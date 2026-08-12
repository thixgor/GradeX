import { describe, expect, it } from 'vitest'

import {
  ABAS,
  BENEFICIOS,
  CAMINHO_CURTO,
  CAMINHO_INSTALACAO,
  DUVIDAS,
  ENDERECO_CURTO,
  abaInicial,
  ehAbaDoAparelho,
  nomeDoAparelho,
  rotuloDetectado,
  tituloPara,
} from '@/lib/pwa/conteudo'
import { instrucoesDe, type PlataformaInstalacao } from '@/lib/pwa/instalacao'

/**
 * O que estes testes protegem: a promessa da unificação.
 *
 * A seção `#app` da landing e a página `/instalar` eram duas telas com textos
 * próprios, e foi assim que a landing acabou dizendo "no seu iPhone" para quem
 * estava num Galaxy. Agora o texto sai daqui — se uma frase quebrar, quebra nos
 * dois lugares ao mesmo tempo, e é este arquivo que avisa.
 */
const UA = {
  galaxyComSamsungInternet:
    'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36',
  galaxyComChrome:
    'Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  motorola:
    'Mozilla/5.0 (Linux; Android 13; moto g(60)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36',
  iphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  windows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
} as const

describe('nomeDoAparelho', () => {
  it('chama o Galaxy pelo nome, mesmo quando a pessoa abre no Chrome', () => {
    expect(nomeDoAparelho('android-samsung', UA.galaxyComSamsungInternet)).toBe(
      'no seu Samsung',
    )
    // O caso que a landing errava: navegador Chrome, aparelho Samsung.
    expect(nomeDoAparelho('android-chromium', UA.galaxyComChrome)).toBe(
      'no seu Samsung',
    )
  })

  it('não promove qualquer Android a Samsung', () => {
    expect(nomeDoAparelho('android-chromium', UA.motorola)).toBe('no seu Android')
  })

  it('reconhece iPhone e computador', () => {
    expect(nomeDoAparelho('ios-safari', UA.iphone)).toBe('no seu iPhone')
    expect(nomeDoAparelho('desktop', UA.windows)).toBe('no seu computador')
  })

  it('cai num texto neutro enquanto a detecção não aconteceu', () => {
    expect(nomeDoAparelho('desconhecida', '')).toBe('no seu celular')
  })
})

describe('tituloPara', () => {
  it('monta o título com o aparelho detectado', () => {
    expect(tituloPara('android-samsung', UA.galaxyComSamsungInternet)).toBe(
      'O DomineAqui no seu Samsung',
    )
  })

  it('nunca deixa o título vazio antes da detecção — isso causaria salto de layout', () => {
    expect(tituloPara('desconhecida', '')).toBe('O DomineAqui no seu celular')
  })
})

describe('abaInicial', () => {
  it('abre na aba do aparelho quando existe uma', () => {
    const diretas: PlataformaInstalacao[] = [
      'android-samsung',
      'android-chromium',
      'android-firefox',
      'ios-safari',
      'desktop',
    ]
    for (const plataforma of diretas) {
      expect(abaInicial(plataforma)).toBe(plataforma)
    }
  })

  it('manda as plataformas sem aba própria para a aba equivalente', () => {
    expect(abaInicial('android-outro')).toBe('android-chromium')
    expect(abaInicial('ios-outro-navegador')).toBe('ios-safari')
  })

  it('sempre devolve uma aba que existe de fato', () => {
    const ids = new Set(ABAS.map((aba) => aba.id))
    const todas: PlataformaInstalacao[] = [
      'ios-safari',
      'ios-outro-navegador',
      'android-chromium',
      'android-samsung',
      'android-firefox',
      'android-outro',
      'desktop',
      'desconhecida',
    ]
    for (const plataforma of todas) {
      expect(ids.has(abaInicial(plataforma))).toBe(true)
    }
  })
})

describe('ehAbaDoAparelho', () => {
  it('marca a aba que corresponde ao aparelho detectado', () => {
    expect(ehAbaDoAparelho('android-samsung', 'android-samsung')).toBe(true)
    expect(ehAbaDoAparelho('ios-safari', 'ios-outro-navegador')).toBe(true)
  })

  it('não marca nada enquanto o aparelho é desconhecido', () => {
    // Marcar "seu aparelho" num palpite seria mentir para quem está lendo.
    for (const aba of ABAS) {
      expect(ehAbaDoAparelho(aba.id, 'desconhecida')).toBe(false)
    }
  })

  it('marca exatamente uma aba por plataforma conhecida', () => {
    const conhecidas: PlataformaInstalacao[] = [
      'ios-safari',
      'ios-outro-navegador',
      'android-chromium',
      'android-samsung',
      'android-firefox',
      'android-outro',
      'desktop',
    ]
    for (const plataforma of conhecidas) {
      const marcadas = ABAS.filter((aba) => ehAbaDoAparelho(aba.id, plataforma))
      expect(marcadas).toHaveLength(1)
    }
  })
})

describe('rotuloDetectado', () => {
  it('devolve o nome do navegador para a frase "detectamos:"', () => {
    expect(rotuloDetectado('android-samsung')).toBe(
      instrucoesDe('android-samsung').aparelho,
    )
  })

  it('devolve null quando não há detecção — a frase some em vez de chutar', () => {
    expect(rotuloDetectado('desconhecida')).toBeNull()
  })
})

describe('endereços', () => {
  it('o atalho curto e o canônico são rotas distintas (uma redireciona para a outra)', () => {
    expect(CAMINHO_CURTO).toBe('/app')
    expect(CAMINHO_INSTALACAO).toBe('/instalar')
    expect(CAMINHO_CURTO).not.toBe(CAMINHO_INSTALACAO)
  })

  it('o endereço escrito na tela é o atalho curto, sem protocolo', () => {
    expect(ENDERECO_CURTO.endsWith(CAMINHO_CURTO)).toBe(true)
    expect(ENDERECO_CURTO).not.toContain('http')
  })
})

describe('blocos de conteúdo', () => {
  it('cada aba tem rótulo e ícone', () => {
    for (const aba of ABAS) {
      expect(aba.rotulo.length).toBeGreaterThan(0)
      expect(aba.icone.length).toBeGreaterThan(0)
    }
  })

  it('os benefícios cabem numa grade de duas colunas sem sobra', () => {
    expect(BENEFICIOS.length % 2).toBe(0)
    for (const beneficio of BENEFICIOS) {
      expect(beneficio.titulo.length).toBeGreaterThan(0)
      expect(beneficio.texto.length).toBeGreaterThan(0)
    }
  })

  it('as dúvidas têm pergunta e resposta', () => {
    expect(DUVIDAS.length).toBeGreaterThan(0)
    for (const duvida of DUVIDAS) {
      expect(duvida.pergunta.endsWith('?')).toBe(true)
      expect(duvida.resposta.length).toBeGreaterThan(0)
    }
  })
})
