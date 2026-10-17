'use client'

/**
 * Câmera, microfone e tela: pedir, entender o erro e soltar.
 *
 * Cada erro do navegador vira um estado que a tela sabe explicar em português
 * e com uma ação de saída — "negado" leva ao passo a passo de permissão, "em
 * uso" pede para fechar o outro aplicativo, "indisponível" deixa entrar sem o
 * aparelho. Nenhum caminho aqui pede permissão em laço.
 */

import { NIVEIS_PADRAO, type NiveisDeVideo } from '../regras'

/**
 * `pedindo`: o navegador está perguntando (a tela explica onde clicar).
 * `pagina`: a própria página abriu sem permissão de usar o aparelho (navegação
 * interna do site carregou a política de outra página) — só recarregar resolve.
 */
export type EstadoDoAparelho = 'ligado' | 'desligado' | 'pedindo' | 'negado' | 'indisponivel' | 'em_uso' | 'erro' | 'pagina'

export interface ResultadoDaCaptura {
  audio: MediaStreamTrack | null
  video: MediaStreamTrack | null
  estadoAudio: EstadoDoAparelho
  estadoVideo: EstadoDoAparelho
}

export function suporteDoNavegador(): { ok: true } | { ok: false; motivo: 'inseguro' | 'webrtc' | 'midia' } {
  if (typeof window === 'undefined') return { ok: false, motivo: 'webrtc' }
  if (!window.isSecureContext) return { ok: false, motivo: 'inseguro' }
  if (typeof RTCPeerConnection === 'undefined') return { ok: false, motivo: 'webrtc' }
  if (!navigator.mediaDevices?.getUserMedia) return { ok: false, motivo: 'midia' }
  return { ok: true }
}

export function podeCompartilharTela(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices && typeof navigator.mediaDevices.getDisplayMedia === 'function'
}

export function podeEscolherSaida(): boolean {
  return typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype
}

/**
 * A política da página permite o aparelho? (Chrome/Edge expõem; nos outros
 * devolve `true` e quem decide é o pedido.) A sala carrega com
 * `microphone=(self)`; uma navegação interna a partir de outra página do site
 * herda `microphone=()` e o navegador recusa sem nem perguntar.
 */
export function politicaPermite(recurso: 'microphone' | 'camera'): boolean {
  if (typeof document === 'undefined') return true
  const d = document as unknown as { permissionsPolicy?: { allowsFeature: (f: string) => boolean }; featurePolicy?: { allowsFeature: (f: string) => boolean } }
  try {
    const p = d.permissionsPolicy || d.featurePolicy
    return p ? p.allowsFeature(recurso) : true
  } catch {
    return true
  }
}

/** Estado da permissão do navegador para um aparelho, quando dá para saber sem perguntar. */
export async function estadoDaPermissao(recurso: 'microphone' | 'camera'): Promise<'granted' | 'denied' | 'prompt' | null> {
  try {
    const r = await navigator.permissions?.query({ name: recurso as PermissionName })
    return r ? (r.state as 'granted' | 'denied' | 'prompt') : null
  } catch {
    return null
  }
}

function estadoDoErro(err: unknown): EstadoDoAparelho {
  const nome = (err as { name?: string })?.name || ''
  if (nome === 'NotAllowedError' || nome === 'SecurityError' || nome === 'PermissionDeniedError') return 'negado'
  if (nome === 'NotFoundError' || nome === 'DevicesNotFoundError' || nome === 'OverconstrainedError') return 'indisponivel'
  if (nome === 'NotReadableError' || nome === 'TrackStartError' || nome === 'AbortError') return 'em_uso'
  return 'erro'
}

/** Tamanho e fps da câmera: o padrão até entrar; depois, o que o admin configurou. */
let captura: NiveisDeVideo['captura'] = NIVEIS_PADRAO.captura

export function definirCaptura(c: NiveisDeVideo['captura']): void {
  captura = c
}

export function restricaoDeTamanho(): MediaTrackConstraints {
  return { width: { ideal: captura.largura }, height: { ideal: captura.altura }, frameRate: { ideal: captura.fps, max: 30 } }
}

function restricaoDeVideo(deviceId?: string | null, folgada = false): MediaTrackConstraints {
  if (folgada) return deviceId ? { deviceId: { exact: deviceId } } : {}
  return { ...(deviceId ? { deviceId: { exact: deviceId } } : {}), ...restricaoDeTamanho() }
}

function restricaoDeAudio(deviceId?: string | null): MediaTrackConstraints {
  return { ...(deviceId ? { deviceId: { exact: deviceId } } : {}), echoCancellation: true, noiseSuppression: true, autoGainControl: true }
}

async function pedir(c: MediaStreamConstraints): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia(c)
}

/**
 * Pede o que a pessoa quer ligado. Se pedir os dois juntos falhar, tenta cada um
 * sozinho: sem câmera, a aula ainda acontece com áudio (e vice-versa).
 * Aparelho escolhido que sumiu (deviceId exato) cai para o padrão.
 */
export async function capturar(opcoes: { audio: boolean; video: boolean; micId?: string | null; camId?: string | null }): Promise<ResultadoDaCaptura> {
  const r: ResultadoDaCaptura = { audio: null, video: null, estadoAudio: 'desligado', estadoVideo: 'desligado' }
  // A página não permite o aparelho: nem pergunta (o navegador recusaria) e não
  // deixa o pedido conjunto derrubar o outro.
  if (opcoes.audio && !politicaPermite('microphone')) {
    const resto = opcoes.video ? await capturar({ ...opcoes, audio: false }) : r
    return { ...resto, audio: null, estadoAudio: 'pagina' }
  }
  if (opcoes.video && !politicaPermite('camera')) {
    const resto = opcoes.audio ? await capturar({ ...opcoes, video: false }) : r
    return { ...resto, video: null, estadoVideo: 'pagina' }
  }
  if (!opcoes.audio && !opcoes.video) return r
  try {
    const s = await pedir({ audio: opcoes.audio ? restricaoDeAudio(opcoes.micId) : false, video: opcoes.video ? restricaoDeVideo(opcoes.camId) : false })
    r.audio = s.getAudioTracks()[0] || null
    r.video = s.getVideoTracks()[0] || null
    r.estadoAudio = r.audio ? 'ligado' : opcoes.audio ? 'indisponivel' : 'desligado'
    r.estadoVideo = r.video ? 'ligado' : opcoes.video ? 'indisponivel' : 'desligado'
    return r
  } catch (err) {
    // Negado no pedido conjunto: descobre QUAL foi negado. Só pede de novo o
    // aparelho que o navegador diz estar permitido (sem repetir a pergunta).
    if (estadoDoErro(err) === 'negado' && opcoes.audio && opcoes.video) {
      const [pMic, pCam] = await Promise.all([estadoDaPermissao('microphone'), estadoDaPermissao('camera')])
      if (pMic !== 'granted' && pCam !== 'granted') return { audio: null, video: null, estadoAudio: 'negado', estadoVideo: 'negado' }
      const so = await capturar({ ...opcoes, audio: pMic === 'granted', video: pCam === 'granted' })
      return {
        ...so,
        estadoAudio: pMic === 'granted' ? so.estadoAudio : 'negado',
        estadoVideo: pCam === 'granted' ? so.estadoVideo : 'negado',
      }
    }
  }
  if (opcoes.audio) {
    try {
      r.audio = (await pedir({ audio: restricaoDeAudio(opcoes.micId) })).getAudioTracks()[0] || null
      r.estadoAudio = r.audio ? 'ligado' : 'indisponivel'
    } catch (err) {
      r.estadoAudio = estadoDoErro(err)
      if (opcoes.micId && r.estadoAudio === 'indisponivel') return capturar({ ...opcoes, micId: null })
    }
  }
  if (opcoes.video) {
    try {
      r.video = (await pedir({ video: restricaoDeVideo(opcoes.camId) })).getVideoTracks()[0] || null
      r.estadoVideo = r.video ? 'ligado' : 'indisponivel'
    } catch (err) {
      r.estadoVideo = estadoDoErro(err)
      if (r.estadoVideo === 'indisponivel') {
        // Câmera que não aceita 640x360 (ou que sumiu): sem restrição de tamanho.
        try {
          r.video = (await pedir({ video: restricaoDeVideo(null, true) })).getVideoTracks()[0] || null
          r.estadoVideo = r.video ? 'ligado' : 'indisponivel'
        } catch (err2) {
          r.estadoVideo = estadoDoErro(err2)
        }
      }
    }
  }
  return r
}

export async function capturarTela(perfil: 'individual' | 'grupo', fpsMax = 5): Promise<MediaStreamTrack | null> {
  const s = await navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: { max: fpsMax }, width: { max: 1920 }, height: { max: 1080 } },
    audio: false,
  })
  const t = s.getVideoTracks()[0] || null
  if (t && 'contentHint' in t) t.contentHint = perfil === 'grupo' ? 'detail' : 'text'
  return t
}

export interface Aparelhos {
  cameras: MediaDeviceInfo[]
  microfones: MediaDeviceInfo[]
  saidas: MediaDeviceInfo[]
}

export async function listarAparelhos(): Promise<Aparelhos> {
  try {
    const todos = await navigator.mediaDevices.enumerateDevices()
    return {
      cameras: todos.filter((d) => d.kind === 'videoinput' && d.deviceId),
      microfones: todos.filter((d) => d.kind === 'audioinput' && d.deviceId),
      saidas: todos.filter((d) => d.kind === 'audiooutput' && d.deviceId),
    }
  } catch {
    return { cameras: [], microfones: [], saidas: [] }
  }
}

export function pararTrilha(t: MediaStreamTrack | null | undefined): void {
  try {
    t?.stop()
  } catch {
    /* já parada */
  }
}

/**
 * Medidor do microfone no saguão (0 a 1). Um AudioContext só, desligado ao sair;
 * a leitura acompanha o quadro da tela, então não roda com a aba oculta.
 */
export function medirNivel(trilha: MediaStreamTrack, aoMedir: (nivel: number) => void): () => void {
  const Contexto = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Contexto) return () => {}
  const ctx = new Contexto()
  // Nasce suspenso sem um toque na tela (Chrome/Safari): tenta já e no primeiro toque.
  const acordar = () => void ctx.resume().catch(() => {})
  acordar()
  window.addEventListener('pointerdown', acordar, { once: true })
  const fonte = ctx.createMediaStreamSource(new MediaStream([trilha]))
  const analisador = ctx.createAnalyser()
  analisador.fftSize = 512
  fonte.connect(analisador)
  const dados = new Uint8Array(analisador.fftSize)
  let quadro = 0
  const ler = () => {
    analisador.getByteTimeDomainData(dados)
    let soma = 0
    for (const v of dados) soma += ((v - 128) / 128) ** 2
    aoMedir(Math.min(1, Math.sqrt(soma / dados.length) * 3))
    quadro = requestAnimationFrame(ler)
  }
  quadro = requestAnimationFrame(ler)
  return () => {
    cancelAnimationFrame(quadro)
    window.removeEventListener('pointerdown', acordar)
    try {
      fonte.disconnect()
    } catch {
      /* nada */
    }
    void ctx.close().catch(() => {})
  }
}

/**
 * Medidor de voz para quem lê no próprio ritmo (o brilho de quem fala lê a
 * cada quadro da tela). `ler()` devolve de 0 a 1; `parar()` solta o áudio.
 */
export function criarMedidor(trilha: MediaStreamTrack): { ler: () => number; parar: () => void } {
  const Contexto = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Contexto) return { ler: () => 0, parar: () => {} }
  const ctx = new Contexto()
  const acordar = () => void ctx.resume().catch(() => {})
  acordar()
  window.addEventListener('pointerdown', acordar, { once: true })
  const fonte = ctx.createMediaStreamSource(new MediaStream([trilha]))
  const analisador = ctx.createAnalyser()
  analisador.fftSize = 512
  fonte.connect(analisador)
  const dados = new Uint8Array(analisador.fftSize)
  return {
    ler: () => {
      if (!trilha.enabled) return 0
      analisador.getByteTimeDomainData(dados)
      let soma = 0
      for (const v of dados) soma += ((v - 128) / 128) ** 2
      return Math.min(1, Math.sqrt(soma / dados.length) * 3)
    },
    parar: () => {
      window.removeEventListener('pointerdown', acordar)
      try {
        fonte.disconnect()
      } catch {
        /* nada */
      }
      void ctx.close().catch(() => {})
    },
  }
}

/** Preferências de aparelho lembradas no navegador (só conveniência; falha em silêncio). */
const CHAVE_PREFERENCIAS = 'domineaqui:sala:aparelhos'

export interface PreferenciasDeAparelho {
  micId: string | null
  camId: string | null
  saidaId: string | null
  micLigado: boolean
  camLigada: boolean
}

export function lerPreferencias(): PreferenciasDeAparelho {
  const padrao: PreferenciasDeAparelho = { micId: null, camId: null, saidaId: null, micLigado: true, camLigada: true }
  try {
    const v = JSON.parse(localStorage.getItem(CHAVE_PREFERENCIAS) || 'null')
    if (!v || typeof v !== 'object') return padrao
    return {
      micId: typeof v.micId === 'string' ? v.micId : null,
      camId: typeof v.camId === 'string' ? v.camId : null,
      saidaId: typeof v.saidaId === 'string' ? v.saidaId : null,
      micLigado: v.micLigado !== false,
      camLigada: v.camLigada !== false,
    }
  } catch {
    return padrao
  }
}

export function guardarPreferencias(p: PreferenciasDeAparelho): void {
  try {
    localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify(p))
  } catch {
    /* navegação privada: tudo bem */
  }
}
