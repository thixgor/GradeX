import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

/**
 * O carregador da IFrame API do YouTube.
 *
 * A raiz do "às vezes toca, às vezes não": a API do YouTube só avisa que ficou
 * pronta chamando `window.onYouTubeIframeAPIReady` — uma função global, um slot
 * só para o site inteiro. Havia dois carregadores no projeto (o player de
 * música de estudo e o áudio do Manual Clínico) e cada um instalava o SEU
 * callback ali; um deles ainda deletava o do outro antes. Quem montasse por
 * último ganhava, o outro esperava para sempre e ficava com os botões mortos.
 *
 * Os testes abaixo prendem as três garantias que consertam isso: encadear em
 * vez de sobrescrever, um único `<script>` por página, e não depender do
 * callback quando a API já carregou antes de alguém pedir.
 */

const SCRIPT_ID = 'youtube-iframe-api'

interface JanelaFalsa {
  YT?: unknown
  onYouTubeIframeAPIReady?: () => void
  location: { origin: string }
}

let janela: JanelaFalsa
let documento: {
  head: { appendChild: (n: unknown) => void }
  getElementById: (id: string) => unknown
}
let scriptsInseridos: Array<{ id?: string; src?: string; onerror?: () => void }>

/** A API real expõe `YT.Player` só quando termina de inicializar. */
function apiFicaPronta() {
  janela.YT = { Player: function () {}, PlayerState: {} }
}

async function importarModulo() {
  vi.resetModules()
  return import('@/lib/youtube-iframe-api')
}

beforeEach(() => {
  vi.useFakeTimers()
  scriptsInseridos = []
  janela = { location: { origin: 'https://exemplo.test' } }
  documento = {
    head: {
      appendChild: (node: unknown) => {
        scriptsInseridos.push(node as { id?: string; src?: string })
      },
    },
    getElementById: (id: string) =>
      scriptsInseridos.find((s) => s.id === id) ?? null,
  }
  const global = globalThis as unknown as Record<string, unknown>
  global.window = janela
  global.document = {
    ...documento,
    createElement: () => ({}) as Record<string, unknown>,
  }
})

afterEach(() => {
  vi.useRealTimers()
  const global = globalThis as unknown as Record<string, unknown>
  delete global.window
  delete global.document
})

describe('carregarYouTubeIframeApi', () => {
  it('encadeia o callback global existente em vez de sobrescrevê-lo', async () => {
    // Outro trecho do site chegou primeiro e registrou o dele.
    const doOutro = vi.fn()
    janela.onYouTubeIframeAPIReady = doOutro

    const { carregarYouTubeIframeApi } = await importarModulo()
    const promessa = carregarYouTubeIframeApi()

    // A API carrega e chama o único slot global que existe.
    apiFicaPronta()
    janela.onYouTubeIframeAPIReady?.()

    await expect(promessa).resolves.toBeDefined()
    // O outro consumidor continua sendo avisado — este era o bug.
    expect(doOutro).toHaveBeenCalledTimes(1)
  })

  it('insere o script uma única vez, mesmo com vários pedidos simultâneos', async () => {
    const { carregarYouTubeIframeApi } = await importarModulo()

    const a = carregarYouTubeIframeApi()
    const b = carregarYouTubeIframeApi()
    const c = carregarYouTubeIframeApi()

    expect(scriptsInseridos.filter((s) => s.id === SCRIPT_ID)).toHaveLength(1)

    apiFicaPronta()
    janela.onYouTubeIframeAPIReady?.()

    await expect(Promise.all([a, b, c])).resolves.toHaveLength(3)
  })

  it('resolve por sondagem quando a API carregou antes de alguém pedir', async () => {
    // Cenário real: o script já veio de outra tela e o callback global já
    // disparou. Ele nunca dispara de novo — sem sondagem, esta espera seria
    // eterna (os controles ficavam desabilitados para sempre).
    const { carregarYouTubeIframeApi } = await importarModulo()
    const promessa = carregarYouTubeIframeApi()

    apiFicaPronta() // nada chama onYouTubeIframeAPIReady
    await vi.advanceTimersByTimeAsync(500)

    await expect(promessa).resolves.toBeDefined()
  })

  it('resolve na hora se a API já estiver pronta', async () => {
    apiFicaPronta()
    const { carregarYouTubeIframeApi } = await importarModulo()

    await expect(carregarYouTubeIframeApi()).resolves.toBeDefined()
    expect(scriptsInseridos).toHaveLength(0)
  })

  it('falha por tempo esgotado e permite uma nova tentativa', async () => {
    const { carregarYouTubeIframeApi } = await importarModulo()

    const primeira = carregarYouTubeIframeApi()
    const capturada = primeira.catch((e: Error) => e)
    await vi.advanceTimersByTimeAsync(21000)
    expect(await capturada).toBeInstanceOf(Error)

    // A promessa falha é descartada: "tentar de novo" tenta de verdade, em vez
    // de receber para sempre a mesma rejeição em cache.
    const segunda = carregarYouTubeIframeApi()
    apiFicaPronta()
    janela.onYouTubeIframeAPIReady?.()
    await expect(segunda).resolves.toBeDefined()
  })
})
