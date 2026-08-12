import { describe, expect, it } from 'vitest'

import {
  DIAS_DE_SILENCIO,
  SAMSUNG_MINIMO_PROMPT_NATIVO,
  detectarPlataforma,
  ehAndroid,
  ehAparelhoSamsung,
  ehIos,
  esperaPromptNativo,
  foiDispensadoRecentemente,
  instrucoesDe,
  SCRIPT_CAPTURA_INSTALACAO,
  type PlataformaInstalacao,
} from '@/lib/pwa/instalacao'

/**
 * O que estes testes protegem: a pergunta "como esta pessoa instala o app?".
 * Errar aqui não quebra a tela — é pior, ensina o caminho errado. Mandar quem
 * está no Samsung Internet procurar o menu ⋮ do Chrome (que não existe ali) faz
 * a pessoa concluir que não dá para instalar.
 *
 * Os user agents abaixo são reais, copiados de aparelhos de verdade.
 */
const UA = {
  samsungInternetAtual:
    'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36',
  samsungInternetAntigo:
    'Mozilla/5.0 (Linux; Android 7.0; SM-G930F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/6.2 Chrome/56.0.2924.87 Mobile Safari/537.36',
  chromeNoGalaxy:
    'Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  chromeNoMotorola:
    'Mozilla/5.0 (Linux; Android 13; moto g(60)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36',
  firefoxAndroid:
    'Mozilla/5.0 (Android 13; Mobile; rv:125.0) Gecko/125.0 Firefox/125.0',
  edgeAndroid:
    'Mozilla/5.0 (Linux; Android 12; SM-A525M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 EdgA/120.0.0.0',
  safariIphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  chromeIphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.6367.111 Mobile/15E148 Safari/604.1',
  ipadModoDesktop:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  windows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
} as const

describe('detectarPlataforma', () => {
  it('reconhece o Samsung Internet, que é o navegador padrão do Galaxy', () => {
    expect(detectarPlataforma({ userAgent: UA.samsungInternetAtual })).toBe(
      'android-samsung',
    )
    expect(detectarPlataforma({ userAgent: UA.samsungInternetAntigo })).toBe(
      'android-samsung',
    )
  })

  it('não confunde o Samsung Internet com Chrome — o UA dele também traz "Chrome/"', () => {
    expect(detectarPlataforma({ userAgent: UA.chromeNoGalaxy })).toBe(
      'android-chromium',
    )
    expect(detectarPlataforma({ userAgent: UA.samsungInternetAtual })).not.toBe(
      'android-chromium',
    )
  })

  it('trata Edge no Android como Chromium (tem o diálogo nativo)', () => {
    expect(detectarPlataforma({ userAgent: UA.edgeAndroid })).toBe('android-chromium')
  })

  it('separa o Firefox Android, que não tem diálogo nativo', () => {
    expect(detectarPlataforma({ userAgent: UA.firefoxAndroid })).toBe(
      'android-firefox',
    )
  })

  it('separa Safari dos outros navegadores do iPhone', () => {
    expect(detectarPlataforma({ userAgent: UA.safariIphone })).toBe('ios-safari')
    expect(detectarPlataforma({ userAgent: UA.chromeIphone })).toBe(
      'ios-outro-navegador',
    )
  })

  it('pega o iPad em modo desktop, que se declara Macintosh', () => {
    expect(
      detectarPlataforma({
        userAgent: UA.ipadModoDesktop,
        platform: 'MacIntel',
        maxTouchPoints: 5,
      }),
    ).toBe('ios-safari')
  })

  it('não confunde um Mac de verdade com iPad', () => {
    expect(
      detectarPlataforma({
        userAgent: UA.ipadModoDesktop,
        platform: 'MacIntel',
        maxTouchPoints: 0,
      }),
    ).toBe('desktop')
  })

  it('classifica computador e user agent vazio', () => {
    expect(detectarPlataforma({ userAgent: UA.windows })).toBe('desktop')
    expect(detectarPlataforma({ userAgent: '' })).toBe('desconhecida')
  })
})

describe('esperaPromptNativo', () => {
  it('espera o diálogo nativo no Chrome Android e no computador', () => {
    expect(esperaPromptNativo('android-chromium', UA.chromeNoMotorola)).toBe(true)
    expect(esperaPromptNativo('desktop', UA.windows)).toBe(true)
  })

  it('espera no Samsung Internet moderno, mas não no antigo', () => {
    expect(esperaPromptNativo('android-samsung', UA.samsungInternetAtual)).toBe(true)
    expect(esperaPromptNativo('android-samsung', UA.samsungInternetAntigo)).toBe(false)
  })

  it(`usa a versão ${SAMSUNG_MINIMO_PROMPT_NATIVO} do Samsung Internet como corte`, () => {
    const comVersao = (v: string) =>
      `Mozilla/5.0 (Linux; Android 10; SM-A105M) AppleWebKit/537.36 SamsungBrowser/${v} Chrome/90.0 Mobile Safari/537.36`
    expect(esperaPromptNativo('android-samsung', comVersao('7.4'))).toBe(false)
    expect(esperaPromptNativo('android-samsung', comVersao('8.0'))).toBe(true)
  })

  it('não espera diálogo nenhum no iPhone nem no Firefox Android', () => {
    expect(esperaPromptNativo('ios-safari', UA.safariIphone)).toBe(false)
    expect(esperaPromptNativo('android-firefox', UA.firefoxAndroid)).toBe(false)
  })
})

describe('instrucoesDe', () => {
  it('ensina o menu certo de cada navegador', () => {
    expect(instrucoesDe('android-samsung').passos.join(' ')).toContain(
      'Adicionar página a',
    )
    expect(instrucoesDe('android-chromium').passos.join(' ')).toContain('Instalar app')
    expect(instrucoesDe('ios-safari').passos.join(' ')).toContain(
      'Adicionar à Tela de Início',
    )
  })

  it('manda quem está no Chrome do iPhone abrir o Safari', () => {
    const instrucoes = instrucoesDe('ios-outro-navegador')
    expect(instrucoes.passos[0]).toContain('Safari')
    expect(instrucoes.alternativa).toBeTruthy()
  })

  it('sempre devolve passos, inclusive no caso desconhecido', () => {
    const plataformas: PlataformaInstalacao[] = [
      'ios-safari',
      'ios-outro-navegador',
      'android-chromium',
      'android-samsung',
      'android-firefox',
      'android-outro',
      'desktop',
      'desconhecida',
    ]
    for (const plataforma of plataformas) {
      const instrucoes = instrucoesDe(plataforma)
      expect(instrucoes.passos.length).toBeGreaterThanOrEqual(2)
      expect(instrucoes.aparelho).not.toBe('')
    }
  })
})

describe('ehAparelhoSamsung', () => {
  it('reconhece o Galaxy pelo código do modelo, em qualquer navegador', () => {
    expect(ehAparelhoSamsung(UA.chromeNoGalaxy)).toBe(true)
    expect(ehAparelhoSamsung(UA.samsungInternetAtual)).toBe(true)
    expect(ehAparelhoSamsung(UA.edgeAndroid)).toBe(true)
  })

  it('não confunde outro Android nem iPhone com Samsung', () => {
    expect(ehAparelhoSamsung(UA.chromeNoMotorola)).toBe(false)
    expect(ehAparelhoSamsung(UA.safariIphone)).toBe(false)
    expect(ehAparelhoSamsung(UA.windows)).toBe(false)
  })
})

describe('ehAndroid / ehIos', () => {
  it('agrupa as variantes de cada sistema', () => {
    expect(ehAndroid('android-samsung')).toBe(true)
    expect(ehAndroid('android-firefox')).toBe(true)
    expect(ehAndroid('ios-safari')).toBe(false)
    expect(ehIos('ios-outro-navegador')).toBe(true)
    expect(ehIos('desktop')).toBe(false)
  })
})

describe('foiDispensadoRecentemente', () => {
  const agora = Date.parse('2026-08-12T12:00:00Z')
  const dias = (n: number) => String(agora - n * 24 * 60 * 60 * 1000)

  it('silencia o convite pelo prazo combinado e volta depois dele', () => {
    expect(foiDispensadoRecentemente(agora, () => dias(1))).toBe(true)
    expect(foiDispensadoRecentemente(agora, () => dias(DIAS_DE_SILENCIO - 1))).toBe(
      true,
    )
    expect(foiDispensadoRecentemente(agora, () => dias(DIAS_DE_SILENCIO + 1))).toBe(
      false,
    )
  })

  it('trata storage vazio ou corrompido como "nunca dispensou"', () => {
    expect(foiDispensadoRecentemente(agora, () => null)).toBe(false)
    expect(foiDispensadoRecentemente(agora, () => 'ontem')).toBe(false)
  })
})

describe('SCRIPT_CAPTURA_INSTALACAO', () => {
  it('captura o evento antes da hidratação e avisa quem se inscreveu', () => {
    const ouvintes: Record<string, (evento: unknown) => void> = {}
    const janela: Record<string, unknown> = {
      addEventListener: (nome: string, fn: (evento: unknown) => void) => {
        ouvintes[nome] = fn
      },
    }

    // Executa o script no lugar do <head>, com um `window` de mentira.
    new Function('window', SCRIPT_CAPTURA_INSTALACAO)(janela)

    const estado = janela.__gxInstalacao as {
      evento: unknown
      instalado: boolean
      inscritos: Array<() => void>
    }
    expect(estado).toBeTruthy()

    let avisos = 0
    estado.inscritos.push(() => {
      avisos += 1
    })

    let impediuPadrao = false
    const evento = { preventDefault: () => (impediuPadrao = true) }
    ouvintes.beforeinstallprompt(evento)

    // preventDefault é o que impede a mini-barra do Chrome de aparecer sozinha
    // e nos dá o direito de chamar o diálogo na hora certa.
    expect(impediuPadrao).toBe(true)
    expect(estado.evento).toBe(evento)
    expect(avisos).toBe(1)

    ouvintes.appinstalled({})
    expect(estado.instalado).toBe(true)
    expect(estado.evento).toBeNull()
    expect(avisos).toBe(2)
  })
})
