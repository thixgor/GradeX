import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  ESCOPOS_DE_DIREITOS,
  FONTES,
  LISTA_DE_FONTES,
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

describe('estado atual: as duas fontes autorizam incorporação', () => {
  it('as duas fontes catalogadas estão com direitos aprovados', () => {
    for (const fonte of LISTA_DE_FONTES) {
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
