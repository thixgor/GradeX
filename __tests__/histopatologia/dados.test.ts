import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  esquemaDoencaCanonica,
  esquemaEntradaBusca,
  esquemaFragmentoDeDoenca,
  esquemaMecanismoGeral,
  esquemaRelatorio,
  esquemaResumoDeDoenca,
  esquemaResumoDeEntrada,
  esquemaSistema,
} from '@/lib/histopatologia/esquemas'
import { SISTEMAS } from '@/lib/histopatologia/editorial/sistemas'
import { MECANISMOS } from '@/lib/histopatologia/editorial/mecanismos'

/**
 * Os derivados versionados provam a própria forma.
 *
 * O repositório server-only usa `as` sobre os JSON importados — o TypeScript
 * infere `estado: string` onde o schema declara uma união fechada, e nenhuma
 * anotação faz um arquivo de dados provar seu conteúdo. Quem prova é este
 * arquivo, rodando cada derivado contra o schema Zod correspondente.
 */

const RAIZ = path.resolve(__dirname, '../..')
const DADOS = path.join(RAIZ, 'data/histopatologia')
const CATALOGO = path.join(RAIZ, 'public/patologia/catalogo')

const ler = (relativo: string) => JSON.parse(readFileSync(path.join(DADOS, relativo), 'utf8'))

const relatorio = esquemaRelatorio.parse(ler('relatorio.json'))
const manifesto = JSON.parse(readFileSync(path.join(CATALOGO, 'manifesto.json'), 'utf8'))

describe('conciliação do pipeline', () => {
  it('não registra nenhuma divergência', () => {
    expect(relatorio.divergencias).toEqual([])
  })

  it('os totais do relatório batem com o manifesto do catálogo', () => {
    expect(relatorio.catalogo.patologias).toBe(manifesto.totais.patologias)
    expect(relatorio.catalogo.midias).toBe(manifesto.totais.midias)
    expect(relatorio.catalogo.fragmentos).toBe(manifesto.arquivos.fragmentosDeMidia.length)
    expect(relatorio.conciliacao.midiasVinculadas).toBe(manifesto.totais.midias)
  })

  it('a soma por modalidade fecha com o total de mídias', () => {
    const soma = Object.values(relatorio.conciliacao.midiasPorModalidade).reduce((n, v) => n + v, 0)
    expect(soma).toBe(relatorio.catalogo.midias)
  })

  it('a soma por fonte fecha com o total de mídias', () => {
    const soma = Object.values(relatorio.conciliacao.midiasPorFonte).reduce((n, v) => n + v, 0)
    expect(soma).toBe(relatorio.catalogo.midias)
  })

  it('as entradas consolidadas e não consolidadas somam o catálogo inteiro', () => {
    expect(relatorio.editorial.entradasConsolidadas + relatorio.editorial.entradasNaoConsolidadas).toBe(
      relatorio.catalogo.patologias,
    )
  })

  it('nenhuma doença está publicada sem ter passado por revisão', () => {
    // O portão de publicação é o que impede texto não revisado de sair com
    // aparência de conteúdo aprovado. Enquanto não houver revisor, o número
    // correto é zero — e é o próprio pipeline que falharia se não fosse.
    expect(relatorio.editorial.doencasPublicadas).toBe(0)
    expect(relatorio.editorial.doencasEmRevisao).toBeGreaterThan(0)
  })
})

describe('derivados validam contra os schemas', () => {
  it('sistemas.json', () => {
    for (const sistema of ler('sistemas.json')) {
      const resultado = esquemaSistema.safeParse(sistema)
      expect(resultado.success, `${sistema.id}: ${resultado.error?.issues[0]?.message}`).toBe(true)
      expect(typeof sistema.entradas).toBe('number')
      expect(typeof sistema.midias).toBe('number')
    }
  })

  it('mecanismos.json', () => {
    for (const mecanismo of ler('mecanismos.json')) {
      const resultado = esquemaMecanismoGeral.safeParse(mecanismo)
      expect(resultado.success, `${mecanismo.id}: ${resultado.error?.issues[0]?.message}`).toBe(true)
    }
  })

  it('doencas.json', () => {
    for (const doenca of ler('doencas.json')) {
      const resultado = esquemaResumoDeDoenca.safeParse(doenca)
      expect(resultado.success, `${doenca.slug}: ${resultado.error?.issues[0]?.message}`).toBe(true)
    }
  })

  it('cada fragmento de doença', () => {
    const arquivos = readdirSync(path.join(DADOS, 'doencas'))
    expect(arquivos.length).toBeGreaterThan(0)
    for (const arquivo of arquivos) {
      const fragmento = ler(path.join('doencas', arquivo))
      const resultado = esquemaFragmentoDeDoenca.safeParse(fragmento)
      expect(resultado.success, `${arquivo}: ${JSON.stringify(resultado.error?.issues[0])}`).toBe(
        true,
      )
      // O nome do arquivo é a chave da rota: divergir dele produz 404.
      expect(`${fragmento.doenca.slug}.json`).toBe(arquivo)
    }
  })

  it('cada inventário por sistema', () => {
    for (const arquivo of readdirSync(path.join(DADOS, 'inventario'))) {
      const lista = ler(path.join('inventario', arquivo))
      const sistemaId = arquivo.replace(/\.json$/, '')
      expect(SISTEMAS.some((s) => s.id === sistemaId), `sistema desconhecido: ${sistemaId}`).toBe(
        true,
      )
      for (const entrada of lista) {
        const resultado = esquemaResumoDeEntrada.safeParse(entrada)
        expect(resultado.success, `${entrada.id}: ${resultado.error?.issues[0]?.message}`).toBe(true)
        expect(entrada.sistemaId).toBe(sistemaId)
      }
    }
  })

  it('os índices de busca', () => {
    for (const arquivo of ['busca-cliente.json', 'busca-servidor.json']) {
      for (const entrada of ler(arquivo)) {
        const resultado = esquemaEntradaBusca.safeParse(entrada)
        expect(resultado.success, `${arquivo} ${entrada.u}: ${resultado.error?.issues[0]?.message}`).toBe(
          true,
        )
      }
    }
  })
})

describe('cobertura e integridade referencial', () => {
  const inventarios = readdirSync(path.join(DADOS, 'inventario')).map((a) =>
    ler(path.join('inventario', a)),
  )
  const todasAsEntradas = inventarios.flat()

  it('o inventário cobre as 2.917 entradas, sem duplicar', () => {
    expect(todasAsEntradas).toHaveLength(relatorio.catalogo.patologias)
    const ids = new Set(todasAsEntradas.map((e: { id: string }) => e.id))
    expect(ids.size).toBe(todasAsEntradas.length)
  })

  it('a soma de mídias do inventário fecha com o total do catálogo', () => {
    const soma = todasAsEntradas.reduce((n: number, e: { midias: number }) => n + e.midias, 0)
    expect(soma).toBe(relatorio.catalogo.midias)
  })

  it('os contadores visuais excluem registros sem lâmina elegível', () => {
    const capitulosComLamina = todasAsEntradas.filter(
      (entrada: { midiasElegiveis: number }) => entrada.midiasElegiveis > 0,
    )
    const totalNosSistemas = ler('sistemas.json').reduce(
      (total: number, sistema: { entradas: number }) => total + sistema.entradas,
      0,
    )
    expect(totalNosSistemas).toBe(capitulosComLamina.length)
    expect(capitulosComLamina.length).toBeLessThan(todasAsEntradas.length)
  })

  it('toda doença aponta para entradas catalogadas reais', () => {
    const ids = new Set(todasAsEntradas.map((e: { id: string }) => e.id))
    for (const arquivo of readdirSync(path.join(DADOS, 'doencas'))) {
      const fragmento = ler(path.join('doencas', arquivo))
      for (const catalogoId of fragmento.doenca.catalogoIds) {
        expect(ids.has(catalogoId), `${arquivo} → ${catalogoId}`).toBe(true)
      }
      for (const entrada of fragmento.entradas) {
        expect(entrada.doencaSlug).toBe(fragmento.doenca.slug)
      }
    }
  })

  it('toda doença aponta para sistema e mecanismos existentes', () => {
    for (const doenca of ler('doencas.json')) {
      expect(SISTEMAS.some((s) => s.id === doenca.sistemaId), doenca.slug).toBe(true)
      for (const id of doenca.mecanismoIds) {
        expect(MECANISMOS.some((m) => m.id === id), `${doenca.slug} → ${id}`).toBe(true)
      }
    }
  })

  it('toda mídia da galeria pertence a uma entrada consolidada na doença', () => {
    for (const arquivo of readdirSync(path.join(DADOS, 'doencas'))) {
      const fragmento = ler(path.join('doencas', arquivo))
      const ids = new Set(fragmento.doenca.catalogoIds)
      for (const midia of fragmento.galeria) {
        expect(ids.has(midia.patologiaId), `${arquivo}: ${midia.id}`).toBe(true)
      }
    }
  })
})

describe('desempenho dos derivados', () => {
  /**
   * O índice de cliente é baixado inteiro pelo navegador na primeira interação
   * com a busca. Este teto é a guarda contra alguém indexar descrições completas
   * — ou, pior, o inventário — e transferir o custo para todo aluno que abre a
   * home.
   */
  it('o índice de cliente cabe em 64 KB', () => {
    const bytes = statSync(path.join(DADOS, 'busca-cliente.json')).size
    expect(bytes).toBeLessThan(64 * 1024)
    expect(relatorio.derivados.bytesDoIndiceDeCliente).toBe(bytes)
  })

  it('nenhum fragmento de doença passa de 512 KB', () => {
    for (const arquivo of readdirSync(path.join(DADOS, 'doencas'))) {
      const bytes = statSync(path.join(DADOS, 'doencas', arquivo)).size
      expect(bytes, arquivo).toBeLessThan(512 * 1024)
    }
  })

  it('os derivados inteiros não passam de 8 MB', () => {
    let total = 0
    const somar = (dir: string) => {
      for (const nome of readdirSync(dir)) {
        const completo = path.join(dir, nome)
        if (statSync(completo).isDirectory()) somar(completo)
        else total += statSync(completo).size
      }
    }
    somar(DADOS)
    expect(total).toBeLessThan(8 * 1024 * 1024)
  })

  it('nenhum arquivo de imagem foi gravado em data/histopatologia', () => {
    const suspeitos: string[] = []
    const varrer = (dir: string) => {
      for (const nome of readdirSync(dir)) {
        const completo = path.join(dir, nome)
        if (statSync(completo).isDirectory()) varrer(completo)
        else if (/\.(jpe?g|png|gif|webp|avif|tiff?|svs|ndpi)$/i.test(nome)) suspeitos.push(nome)
      }
    }
    varrer(DADOS)
    expect(suspeitos).toEqual([])
  })
})

describe('o mapa de carregadores acompanha os derivados', () => {
  const carregadores = readFileSync(
    path.join(RAIZ, 'lib/histopatologia/carregadores.gerado.ts'),
    'utf8',
  )

  it('declara um import literal por doença', () => {
    for (const arquivo of readdirSync(path.join(DADOS, 'doencas'))) {
      const slug = arquivo.replace(/\.json$/, '')
      expect(carregadores, slug).toContain(`"${slug}": () => import('@/data/histopatologia/doencas/${slug}.json')`)
    }
  })

  it('declara um import literal por inventário de sistema', () => {
    for (const arquivo of readdirSync(path.join(DADOS, 'inventario'))) {
      const id = arquivo.replace(/\.json$/, '')
      expect(carregadores, id).toContain(
        `"${id}": () => import('@/data/histopatologia/inventario/${id}.json')`,
      )
    }
  })

  it('não usa caminho montado em variável', () => {
    // Um `import()` com template string funciona em desenvolvimento e devolve
    // 404 em produção, porque o rastreamento de arquivos da Vercel não o enxerga.
    expect(carregadores).not.toMatch(/import\(`/)
    expect(carregadores).not.toMatch(/import\([^'`]*\$\{/)
  })
})
