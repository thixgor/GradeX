/**
 * Carregador ÚNICO da IFrame API do YouTube.
 *
 * Por que isto existe: a API do YouTube só avisa que ficou pronta chamando uma
 * função global — `window.onYouTubeIframeAPIReady`. É um slot só, para o site
 * inteiro. Antes deste módulo, dois lugares disputavam esse slot (o player de
 * música de estudo e o áudio embutido do Manual Clínico): quem montasse por
 * último sobrescrevia — e às vezes apagava — o callback do outro, e o player
 * perdedor simplesmente nunca ficava pronto. Era essa a raiz do "às vezes toca,
 * às vezes não".
 *
 * O que este módulo garante:
 *  - o script é inserido UMA vez por página (mesmo com HMR / remontagens);
 *  - o callback global é encadeado, nunca substituído nem deletado;
 *  - existe uma sondagem de reserva (a API pode já ter carregado antes de
 *    alguém registrar o callback — nesse caso o callback nunca dispara);
 *  - existe timeout, então quem espera consegue mostrar erro em vez de ficar
 *    com os botões desabilitados para sempre;
 *  - em caso de falha a promessa é descartada, de modo que uma nova tentativa
 *    (botão "tentar de novo") realmente tente de novo.
 */

const SCRIPT_ID = 'youtube-iframe-api'
const SCRIPT_SRC = 'https://www.youtube.com/iframe_api'
const TIMEOUT_MS = 20000
const POLL_MS = 120

export interface YouTubePlayer {
  playVideo: () => void
  pauseVideo: () => void
  stopVideo: () => void
  mute: () => void
  unMute: () => void
  isMuted: () => boolean
  setVolume: (volume: number) => void
  getVolume: () => number
  setPlaybackRate: (rate: number) => void
  getPlaybackRate: () => number
  loadPlaylist: (playlist: { list: string; listType: string; index?: number }) => void
  cuePlaylist: (playlist: { list: string; listType: string; index?: number }) => void
  loadVideoById: (videoId: string) => void
  cueVideoById: (videoId: string) => void
  nextVideo: () => void
  previousVideo: () => void
  getPlayerState: () => number
  getCurrentTime: () => number
  getDuration: () => number
  getVideoData?: () => { title?: string; video_id?: string; author?: string }
  getIframe?: () => HTMLIFrameElement
  destroy: () => void
}

export interface YouTubePlayerConfig {
  width?: string | number
  height?: string | number
  videoId?: string
  /** Domínio que serve o iframe. `www.youtube-nocookie.com` corta boa parte da
   *  telemetria (é o que os bloqueadores derrubam com ERR_BLOCKED_BY_CLIENT). */
  host?: string
  playerVars?: Record<string, unknown>
  events?: {
    onReady?: (event: { target: YouTubePlayer }) => void
    onStateChange?: (event: { data: number; target: YouTubePlayer }) => void
    onError?: (event: { data: number; target: YouTubePlayer }) => void
  }
}

export interface YouTubeApi {
  Player: new (element: string | HTMLElement, config: YouTubePlayerConfig) => YouTubePlayer
  PlayerState: {
    UNSTARTED: number
    ENDED: number
    PLAYING: number
    PAUSED: number
    BUFFERING: number
    CUED: number
  }
}

declare global {
  interface Window {
    YT?: YouTubeApi
    onYouTubeIframeAPIReady?: () => void
  }
}

/** Estados do player. Espelham `YT.PlayerState`, mas ficam disponíveis mesmo
 *  antes de a API carregar (evita `window.YT.PlayerState.X` em comparações). */
export const YT_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const

function apiPronta(): boolean {
  return typeof window !== 'undefined' && typeof window.YT?.Player === 'function'
}

let promessa: Promise<YouTubeApi> | null = null

export function carregarYouTubeIframeApi(): Promise<YouTubeApi> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IFrame API do YouTube indisponível no servidor'))
  }
  if (apiPronta()) return Promise.resolve(window.YT as YouTubeApi)
  if (promessa) return promessa

  promessa = new Promise<YouTubeApi>((resolve, reject) => {
    let encerrado = false
    let poll: ReturnType<typeof setInterval> | undefined
    let expira: ReturnType<typeof setTimeout> | undefined

    const encerrar = (erro?: Error) => {
      if (encerrado) return
      encerrado = true
      if (poll) clearInterval(poll)
      if (expira) clearTimeout(expira)
      if (erro || !apiPronta()) {
        // Descarta a promessa para que uma próxima chamada tente de novo.
        promessa = null
        reject(erro ?? new Error('IFrame API do YouTube não ficou pronta'))
        return
      }
      resolve(window.YT as YouTubeApi)
    }

    // Encadeia — nunca substitui — o callback global. Se outro trecho do site
    // (ou uma versão antiga desta página, após HMR) já registrou o dele, ele
    // continua sendo chamado.
    const anterior = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      try {
        anterior?.()
      } catch {
        /* o callback de terceiros não pode derrubar o nosso */
      }
      encerrar()
    }

    // Rede de segurança: se o script já tinha carregado antes de chegarmos
    // aqui, o callback global nunca mais dispara — a sondagem resolve.
    poll = setInterval(() => {
      if (apiPronta()) encerrar()
    }, POLL_MS)

    expira = setTimeout(
      () => encerrar(new Error('Tempo esgotado ao carregar a IFrame API do YouTube')),
      TIMEOUT_MS,
    )

    if (!document.getElementById(SCRIPT_ID)) {
      const tag = document.createElement('script')
      tag.id = SCRIPT_ID
      tag.src = SCRIPT_SRC
      tag.async = true
      tag.onerror = () => encerrar(new Error('Falha ao baixar a IFrame API do YouTube'))
      document.head.appendChild(tag)
    }
  })

  return promessa
}

/** Ponte para código legado baseado em callback. */
export function comYouTubeApi(
  aoFicarPronta: (api: YouTubeApi) => void,
  aoFalhar?: (erro: Error) => void,
): void {
  carregarYouTubeIframeApi().then(aoFicarPronta, (erro: Error) => aoFalhar?.(erro))
}
