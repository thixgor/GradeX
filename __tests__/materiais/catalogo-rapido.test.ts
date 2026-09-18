import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ObjectId } from 'mongodb'

/**
 * O que fazia /materiais demorar.
 *
 * A página pede o acervo inteiro de uma vez (a pasta é um recorte em memória,
 * de propósito), e a rota que responde tinha dois problemas somados:
 *
 *  1. **Fila de idas ao banco.** Cargo da conta → acervo → quatro consultas de
 *     posse → pacotes do dono. Cada uma esperava a anterior terminar sem
 *     precisar do resultado dela, então o tempo da página era a SOMA das
 *     latências, não a maior delas.
 *  2. **Documento inteiro na resposta.** `pdfViewerConfig.summary` não tem teto
 *     (sumário importado de PDF longo "passava de 500" entradas) e cada item de
 *     `complementaryItems` carrega até 20 000 caracteres de código embed, 30 por
 *     material. Nada disso desenha um card — o card mostra capa, título, tipo e
 *     preço — mas tudo isso viajava, multiplicado pelo acervo.
 *
 * Estes testes travam as duas correções, e travam também o que NÃO podia mudar
 * junto: a posse herdada de pacote, e o documento completo para o admin (é
 * neste retorno que o formulário de edição se apoia).
 */

const ID_USUARIO = '64b7f9c2a1d2e3f4a5b6c7d8'
const ID_PACOTE = '64b7f9c2a1d2e3f4a5b6c7e1'

type Consulta = { colecao: string; query: any; opcoes: any }

let consultas: Consulta[] = []
let sessao: any = null
/** Nenhum `toArray` responde antes disto abrir — é como medimos paralelismo. */
let abrirPortao: () => void = () => {}
let portao: Promise<void> = Promise.resolve()

let materiaisNoBanco: any[] = []
let comprasNoBanco: any[] = []
let pacotesNoBanco: any[] = []

/** Aplica uma projeção de exclusão ({ campo: 0 }) como o Mongo aplicaria. */
function projetar(doc: any, projecao: any): any {
  if (!projecao) return doc
  const excluidos = Object.keys(projecao).filter((k) => projecao[k] === 0)
  if (excluidos.length === 0) return doc
  const saida: any = { ...doc }
  for (const campo of excluidos) delete saida[campo]
  return saida
}

function colecaoFalsa(nome: string) {
  return {
    async findOne(query: any, opcoes: any = {}) {
      consultas.push({ colecao: nome, query, opcoes })
      await portao
      if (nome === 'users') {
        return { _id: new ObjectId(ID_USUARIO), accountType: 'gratuito' }
      }
      return null
    },
    find(query: any, opcoes: any = {}) {
      consultas.push({ colecao: nome, query, opcoes })
      let projecao = opcoes?.projection ?? null
      const cursor: any = {
        sort: () => cursor,
        project: (p: any) => { projecao = p; return cursor },
        toArray: async () => {
          await portao
          if (nome === 'materials') return materiaisNoBanco.map((d) => projetar(d, projecao))
          if (nome === 'material_purchases') return comprasNoBanco
          if (nome === 'material_packages') return pacotesNoBanco
          return []
        },
      }
      return cursor
    },
    aggregate(etapas: any[]) {
      consultas.push({ colecao: nome, query: etapas, opcoes: null })
      return { toArray: async () => { await portao; return [] } }
    },
  }
}

vi.mock('@/lib/mongodb', () => ({
  default: Promise.resolve({ db: () => ({ collection: colecaoFalsa }) }),
  getDb: async () => ({ collection: colecaoFalsa }),
}))

vi.mock('@/lib/auth', () => ({
  getSession: async () => sessao,
}))

import { GET } from '@/app/api/materiais/route'

function pedido(busca = '') {
  return new Request(`https://exemplo.test/api/materiais${busca}`) as any
}

/** Material com os dois campos gordos preenchidos. */
function materialGordo(id: string, extra: any = {}) {
  return {
    _id: new ObjectId(id),
    title: `Material ${id.slice(-2)}`,
    type: 'pdf',
    pricing: 'free',
    price: 0,
    isHidden: false,
    allowedGroups: [],
    pdfViewerConfig: {
      summary: Array.from({ length: 600 }, (_, i) => ({ id: `t${i}`, title: `Capítulo ${i}`, page: i + 1, level: 0 })),
      navigation: [],
      preview: { enabled: false, ranges: [] },
    },
    complementaryItems: [
      { id: 'ci-1', kind: 'custom', title: 'Extra', url: '<iframe>'.padEnd(20000, 'x') },
    ],
    ...extra,
  }
}

async function corpo(resposta: any) {
  return resposta.json()
}

beforeEach(() => {
  consultas = []
  sessao = null
  materiaisNoBanco = []
  comprasNoBanco = []
  pacotesNoBanco = []
  portao = Promise.resolve()
  abrirPortao = () => {}
})

describe('peso da resposta do catálogo', () => {
  it('não manda ao aluno o sumário do PDF nem os itens complementares', async () => {
    sessao = { userId: ID_USUARIO, email: 'aluno@exemplo.test', role: 'user' }
    materiaisNoBanco = [materialGordo('64b7f9c2a1d2e3f4a5b6c7d1')]

    const { materials } = await corpo(await GET(pedido()))

    expect(materials).toHaveLength(1)
    expect(materials[0].pdfViewerConfig).toBeUndefined()
    expect(materials[0].complementaryItems).toBeUndefined()
    // O que o card desenha continua vindo.
    expect(materials[0].title).toBe('Material d1')
    expect(materials[0].pricing).toBe('free')
  })

  it('a exclusão é pedida ao banco, não peneirada depois', async () => {
    sessao = { userId: ID_USUARIO, email: 'aluno@exemplo.test', role: 'user' }
    materiaisNoBanco = [materialGordo('64b7f9c2a1d2e3f4a5b6c7d1')]

    await GET(pedido())

    const doAcervo = consultas.find((c) => c.colecao === 'materials')
    expect(doAcervo?.opcoes?.projection).toMatchObject({
      pdfViewerConfig: 0,
      complementaryItems: 0,
    })
  })

  it('o admin continua recebendo o documento completo (é o que o formulário edita)', async () => {
    sessao = { userId: ID_USUARIO, email: 'chefe@exemplo.test', role: 'admin' }
    materiaisNoBanco = [materialGordo('64b7f9c2a1d2e3f4a5b6c7d1')]

    const { materials } = await corpo(await GET(pedido()))

    expect(materials[0].pdfViewerConfig.summary).toHaveLength(600)
    expect(materials[0].complementaryItems).toHaveLength(1)
  })
})

describe('idas ao banco em paralelo', () => {
  it('pergunta cargo, posse e acervo de uma vez, não em fila', async () => {
    sessao = { userId: ID_USUARIO, email: 'aluno@exemplo.test', role: 'user' }
    materiaisNoBanco = [materialGordo('64b7f9c2a1d2e3f4a5b6c7d1')]
    portao = new Promise<void>((resolve) => { abrirPortao = resolve })

    const emAndamento = GET(pedido())
    // Deixa o handler correr até travar no portão. Nada respondeu ainda:
    // tudo que já foi pedido ao banco foi pedido SEM esperar o resto.
    for (let i = 0; i < 20; i++) await Promise.resolve()

    const colecoes = consultas.map((c) => c.colecao)
    expect(colecoes).toContain('users')
    expect(colecoes).toContain('materials')
    expect(colecoes.filter((c) => c === 'material_purchases')).toHaveLength(2)

    abrirPortao()
    await emAndamento
  })

  it('a posse de material e de pacote sai numa consulta por identidade, não em quatro', async () => {
    sessao = { userId: ID_USUARIO, email: 'aluno@exemplo.test', role: 'user' }
    materiaisNoBanco = [materialGordo('64b7f9c2a1d2e3f4a5b6c7d1')]

    await GET(pedido())

    const posse = consultas.filter((c) => c.colecao === 'material_purchases')
    expect(posse).toHaveLength(2)
    for (const consulta of posse) {
      expect(consulta.query.itemType).toEqual({ $in: ['material', 'package'] })
    }
    // Uma por id da conta, outra por e-mail (a reserva das liberações manuais).
    expect(posse[0].query.userId).toBe(ID_USUARIO)
    expect(posse[1].query.userEmail).toBeDefined()
  })
})

describe('o que não podia mudar junto', () => {
  it('quem comprou o pacote continua com acesso aos materiais dele', async () => {
    const idMaterial = '64b7f9c2a1d2e3f4a5b6c7d2'
    sessao = { userId: ID_USUARIO, email: 'aluno@exemplo.test', role: 'user' }
    materiaisNoBanco = [materialGordo(idMaterial, { pricing: 'paid', price: 40 })]
    comprasNoBanco = [{ itemId: ID_PACOTE, itemType: 'package', status: 'completed' }]
    pacotesNoBanco = [{ _id: new ObjectId(ID_PACOTE), materialIds: [idMaterial] }]

    const { materials, purchasedIds } = await corpo(await GET(pedido()))

    expect(purchasedIds).toContain(idMaterial)
    expect(materials[0]._isPurchased).toBe(true)
    expect(materials[0]._hasAccess).toBe(true)
  })

  it('material pago sem posse nenhuma não vaza a URL do arquivo', async () => {
    sessao = { userId: ID_USUARIO, email: 'aluno@exemplo.test', role: 'user' }
    materiaisNoBanco = [
      materialGordo('64b7f9c2a1d2e3f4a5b6c7d3', {
        pricing: 'paid',
        price: 40,
        downloadUrl: 'https://blob.exemplo.test/segredo.pdf',
      }),
    ]

    const { materials } = await corpo(await GET(pedido()))

    expect(materials[0]._hasAccess).toBe(false)
    expect(materials[0].downloadUrl).toBe('')
  })
})

describe('busca', () => {
  it('trata o que foi digitado como texto, não como expressão regular', async () => {
    sessao = { userId: ID_USUARIO, email: 'aluno@exemplo.test', role: 'user' }

    await GET(pedido('?search=' + encodeURIComponent('anatomia (2)')))

    const doAcervo = consultas.find((c) => c.colecao === 'materials')
    const porTitulo = doAcervo?.query.$or?.[0]?.title
    expect(porTitulo.$regex).toBe('anatomia \\(2\\)')
  })

  it('um quantificador aninhado não chega ao banco como padrão', async () => {
    sessao = { userId: ID_USUARIO, email: 'aluno@exemplo.test', role: 'user' }

    await GET(pedido('?search=' + encodeURIComponent('(a+)+$')))

    const doAcervo = consultas.find((c) => c.colecao === 'materials')
    expect(doAcervo?.query.$or?.[0]?.title.$regex).toBe('\\(a\\+\\)\\+\\$')
  })
})
