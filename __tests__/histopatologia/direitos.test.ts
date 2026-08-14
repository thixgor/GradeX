import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  ESCOPOS_DE_DIREITOS,
  FONTES,
  LISTA_DE_FONTES,
  histopatologiaHabilitada,
  hostPermitido,
  permiteIncorporacao,
  permiteLinkDireto,
  podeIndexar,
  resolverDireitos,
  urlRemotaValida,
} from '@/lib/histopatologia/direitos'
import type { EscopoDeDireitos, MidiaCatalogada } from '@/lib/histopatologia/esquemas'
import { altDaMidia, midiaElegivel, paraExibicao, podeIncorporar } from '@/lib/histopatologia/midia'

/**
 * O portão de direitos.
 *
 * Este é o teste que impede a falha mais cara possível deste módulo:
 * redistribuir imagem de terceiro sem base jurídica. Ele verifica a regra em
 * três camadas — decisão, DTO e interface — porque uma regra que existe em um só
 * lugar é uma regra que alguém remove sem perceber.
 */

const RAIZ = path.resolve(__dirname, '../..')

const midiaBase: MidiaCatalogada = {
  id: 'UNI-000001',
  patologiaId: 'unicamp-teste',
  fonteId: 'unicamp',
  patologia: 'Lâmina de teste',
  sistema: 'Não classificado',
  modalidade: 'Histologia',
  coloracao: 'HE',
  descricao: 'Descrição catalogada de teste.',
  urlPaginaFonte: 'https://anatpat.unicamp.br/pagina.html',
  urlImagem: 'https://anatpat.unicamp.br/imagem.jpg',
  politicaDeExibicao: 'url-remota-com-portao-de-direitos',
}

describe('estado atual: incorporação e consulta externa são separadas', () => {
  it('as três fontes autorizadas estão com incorporação aprovada', () => {
    for (const fonte of [FONTES.unicamp, FONTES['histopathology-atlas'], FONTES['webpath-utah']]) {
      const decisao = resolverDireitos({
        fonteId: fonte.id,
        midiaId: '—',
        urlPaginaFonte: fonte.url,
      })
      expect(decisao.estado, fonte.id).toBe('autorizado-incorporacao')
      expect(permiteIncorporacao(decisao.estado)).toBe(true)
      expect(permiteLinkDireto(decisao.estado)).toBe(true)
    }
  })

  it('as duas fontes sem autorização permitem somente abrir a página original', () => {
    for (const fonte of [FONTES['pathology-outlines'], FONTES.webpathology]) {
      const decisao = resolverDireitos({
        fonteId: fonte.id,
        midiaId: '—',
        urlPaginaFonte: fonte.url,
      })
      expect(decisao.estado, fonte.id).toBe('autorizado-link-remoto')
      expect(permiteIncorporacao(decisao.estado)).toBe(false)
      expect(permiteLinkDireto(decisao.estado)).toBe(true)
    }
  })

  it('as cinco fontes têm registro editorial', () => {
    expect(LISTA_DE_FONTES).toHaveLength(5)
  })

  it('todo escopo registrado tem titular, data e responsável', () => {
    expect(ESCOPOS_DE_DIREITOS.length).toBeGreaterThan(0)
    for (const escopo of ESCOPOS_DE_DIREITOS) {
      expect(escopo.titular.length, escopo.id).toBeGreaterThan(3)
      expect(escopo.verificadoEm, escopo.id).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(escopo.responsavel.length, escopo.id).toBeGreaterThan(3)
      expect(FONTES[escopo.fonteId], escopo.id).toBeDefined()
    }
  })

  it('a licença do Digital Histology não é reaproveitada aqui', () => {
    // CREDITOS_E_DIREITOS.md é explícito: a licença de um acervo não vale para o
    // outro. Nenhum escopo pode declarar CC BY-NC-SA por herança.
    for (const escopo of ESCOPOS_DE_DIREITOS) {
      expect(escopo.licenca ?? '').not.toMatch(/CC BY-NC-SA/i)
    }
  })
})

describe('direitos aprovados produzem URL de mídia', () => {
  it('o DTO inclui a URL remota e mantém crédito e origem', () => {
    const dto = paraExibicao(midiaBase)
    expect(dto).not.toBeNull()
    expect(dto!.estadoDeDireitos).toBe('autorizado-incorporacao')
    expect(dto!.urlImagem).toBe(midiaBase.urlImagem)
    expect(dto!.urlVisualizador).toBeUndefined()
    expect(dto!.urlPaginaFonte).toBe(midiaBase.urlPaginaFonte)
    expect(dto!.creditoCurto).toBe(FONTES.unicamp.creditoCurto)
  })

  it('`podeIncorporar` aceita mídia autorizada', () => {
    expect(podeIncorporar(paraExibicao(midiaBase)!)).toBe(true)
  })

  it('com incorporação autorizada, a URL atravessa e o crédito continua junto', () => {
    const escoposLiberados: EscopoDeDireitos[] = [
      {
        id: 'teste-liberado',
        fonteId: 'unicamp',
        escopo: 'fonte',
        alvo: 'unicamp',
        estado: 'autorizado-incorporacao',
        titular: 'FCM/Unicamp',
        licenca: 'Autorização escrita de teste',
        comprovante: 'https://exemplo.invalido/documento',
        verificadoEm: '2026-08-09',
        responsavel: 'Teste',
        restricoes: [],
        observacao: '',
      },
    ]
    const decisao = resolverDireitos(
      {
        fonteId: 'unicamp',
        midiaId: midiaBase.id,
        urlPaginaFonte: midiaBase.urlPaginaFonte,
        urlImagem: midiaBase.urlImagem,
      },
      escoposLiberados,
    )
    expect(decisao.estado).toBe('autorizado-incorporacao')
    expect(permiteIncorporacao(decisao.estado)).toBe(true)
    expect(permiteLinkDireto(decisao.estado)).toBe(true)
  })

  it('mídia sem escopo registrado é bloqueada, e não apenas pendente', () => {
    const decisao = resolverDireitos(
      { fonteId: 'unicamp', midiaId: 'x', urlPaginaFonte: 'https://exemplo.invalido/' },
      [],
    )
    expect(decisao.estado).toBe('bloqueado')
    expect(permiteLinkDireto(decisao.estado)).toBe(false)
  })

  it('escopo mais específico vence o mais amplo', () => {
    const escopos: EscopoDeDireitos[] = [
      { ...ESCOPOS_DE_DIREITOS[0] },
      {
        id: 'colecao-liberada',
        fonteId: 'unicamp',
        escopo: 'colecao',
        alvo: 'https://anatpat.unicamp.br/colecao/',
        estado: 'autorizado-link-remoto',
        titular: 'FCM/Unicamp',
        licenca: 'Autorização de teste',
        comprovante: null,
        verificadoEm: '2026-08-09',
        responsavel: 'Teste',
        restricoes: [],
        observacao: '',
      },
    ]
    const dentro = resolverDireitos(
      { fonteId: 'unicamp', midiaId: 'a', urlPaginaFonte: 'https://anatpat.unicamp.br/colecao/x.html' },
      escopos,
    )
    const fora = resolverDireitos(
      { fonteId: 'unicamp', midiaId: 'b', urlPaginaFonte: 'https://anatpat.unicamp.br/outra.html' },
      escopos,
    )
    expect(dentro.estado).toBe('autorizado-link-remoto')
    expect(fora.estado).toBe('autorizado-incorporacao')
  })
})

describe('allowlist de domínios', () => {
  it('aceita apenas https', () => {
    expect(urlRemotaValida('https://anatpat.unicamp.br/a.jpg')).toBe(true)
    expect(urlRemotaValida('http://anatpat.unicamp.br/a.jpg')).toBe(false)
    expect(urlRemotaValida('javascript:alert(1)')).toBe(false)
    expect(urlRemotaValida('data:image/png;base64,AAA')).toBe(false)
    expect(urlRemotaValida(undefined)).toBe(false)
  })

  it('aceita apenas hosts cadastrados por fonte', () => {
    expect(hostPermitido('unicamp', 'https://anatpat.unicamp.br/a.jpg')).toBe(true)
    expect(hostPermitido('unicamp', 'https://img.shields.io/badge.svg')).toBe(false)
    expect(hostPermitido('unicamp', 'https://www.youtube.com/watch?v=x')).toBe(false)
    // Domínio de uma fonte não vale para a outra.
    expect(hostPermitido('histopathology-atlas', 'https://anatpat.unicamp.br/a.jpg')).toBe(false)
    expect(hostPermitido('histopathology-atlas', 'https://images.patolojiatlasi.com/a/HE.html')).toBe(
      true,
    )
  })

  it('mídia inteiramente fora da allowlist não é exibível', () => {
    const rastreador: MidiaCatalogada = {
      ...midiaBase,
      id: 'UNI-999999',
      urlImagem: 'https://mapmyvisitors.com/pixel.png',
    }
    expect(midiaElegivel(rastreador)).toBe(false)
    expect(paraExibicao(rastreador)).toBeNull()
  })
})

describe('texto alternativo não afirma diagnóstico', () => {
  it('descreve tipo de imagem e proveniência, e marca a ausência de revisão', () => {
    const alt = altDaMidia(midiaBase)
    expect(alt).toContain('Fotomicrografia histológica')
    expect(alt).toContain(FONTES.unicamp.creditoCurto)
    expect(alt).toContain('não revisado')
  })

  it('legenda editorial revisada pode descrever o achado', () => {
    const alt = altDaMidia(midiaBase, 'granuloma com necrose caseosa central')
    expect(alt).toContain('granuloma com necrose caseosa central')
  })
})

/**
 * O 404 que este bloco existe para não deixar voltar.
 *
 * A Histopatologia exigia `HISTOPATOLOGIA_HABILITADO=1` e mais nada. Nenhum
 * documento de publicação mandava definir essa variável — `docs/adr/0001` e
 * `public/Manual-Histologia/IMPLEMENTACAO.md` falam só de
 * `HISTOLOGIA_HABILITADO=1` —, então em produção ela ficou vazia. Resultado: a
 * Histologia no ar, com link para a Histopatologia na própria home do módulo, e
 * **assinante clicando nesse link recebia 404**. O portão não protegia nada;
 * derrubava conteúdo pago por uma variável que ninguém sabia que existia.
 *
 * A regra passa a ser a que não surpreende: a subárea acompanha o módulo que a
 * contém, e só se separa dele quando alguém declara isso de propósito.
 */
describe('disponibilidade da rota', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('fora de produção abre sempre — é preciso poder revisar', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('HISTOLOGIA_HABILITADO', '')
    vi.stubEnv('HISTOPATOLOGIA_HABILITADO', '')
    expect(histopatologiaHabilitada()).toBe(true)
  })

  it('em produção herda a Histologia quando nada é declarado', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('HISTOPATOLOGIA_HABILITADO', '')

    vi.stubEnv('HISTOLOGIA_HABILITADO', '1')
    expect(histopatologiaHabilitada()).toBe(true)

    vi.stubEnv('HISTOLOGIA_HABILITADO', '')
    expect(histopatologiaHabilitada()).toBe(false)
  })

  it('"0" fecha só a Histopatologia, com a Histologia no ar', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('HISTOLOGIA_HABILITADO', '1')
    vi.stubEnv('HISTOPATOLOGIA_HABILITADO', '0')
    expect(histopatologiaHabilitada()).toBe(false)
  })

  it('"1" abre a Histopatologia mesmo com a Histologia fechada', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('HISTOLOGIA_HABILITADO', '')
    vi.stubEnv('HISTOPATOLOGIA_HABILITADO', '1')
    expect(histopatologiaHabilitada()).toBe(true)
  })
})

describe('indexação', () => {
  it('só conteúdo publicado é indexável', () => {
    expect(podeIndexar('publicado')).toBe(true)
    expect(podeIndexar('revisao-medica')).toBe(false)
    expect(podeIndexar('rascunho')).toBe(false)
    expect(podeIndexar(undefined)).toBe(false)
  })
})

describe('nenhum índice de busca carrega URL de mídia', () => {
  const DADOS = path.join(RAIZ, 'data/histopatologia')

  for (const arquivo of ['busca-cliente.json', 'busca-servidor.json']) {
    it(`${arquivo} não contém URL`, () => {
      const bruto = readFileSync(path.join(DADOS, arquivo), 'utf8')
      expect(/https?:\/\//i.test(bruto), arquivo).toBe(false)
    })
  }

  it('o índice de cliente não contém o inventário catalogado', () => {
    const indice = JSON.parse(readFileSync(path.join(DADOS, 'busca-cliente.json'), 'utf8'))
    expect(indice.some((e: { t: string }) => e.t === 'c')).toBe(false)
    expect(statSync(path.join(DADOS, 'busca-cliente.json')).size).toBeLessThan(64 * 1024)
  })
})

describe('nenhuma imagem entrou no repositório', () => {
  it('public/patologia contém apenas texto, JSON e gzip de JSON', () => {
    const permitidos = /\.(md|json|gz|mjs)$/i
    const proibidos: string[] = []
    const varrer = (dir: string) => {
      for (const nome of readdirSync(dir)) {
        const completo = path.join(dir, nome)
        if (statSync(completo).isDirectory()) varrer(completo)
        else if (!permitidos.test(nome)) proibidos.push(path.relative(RAIZ, completo))
      }
    }
    varrer(path.join(RAIZ, 'public/patologia'))
    expect(proibidos).toEqual([])
  })
})
