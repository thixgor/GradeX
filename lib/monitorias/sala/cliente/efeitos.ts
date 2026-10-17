'use client'

/**
 * Efeitos de câmera e de voz, tudo no aparelho: nada passa pelo servidor e,
 * sem efeito escolhido, nada disto existe (custo de CPU zero).
 *
 * ## Câmera
 *
 * Um shader WebGL (GPU, roda até em celular simples) recebe cada quadro da
 * câmera e devolve o quadro com o filtro e a moldura. Dois jeitos de bombear
 * os quadros:
 *  - Chrome/Edge: `MediaStreamTrackProcessor` → WebGL → `MediaStreamTrackGenerator`.
 *    Movido pelos quadros da câmera, segue a 30 fps mesmo com a aba em segundo
 *    plano (o monitor abre o PDF em outra aba e o vídeo não congela).
 *  - Safari/Firefox: `<video>` → WebGL → `canvas.captureStream(30)`, a cada quadro
 *    novo (`requestVideoFrameCallback`, ou `requestAnimationFrame`).
 *
 * O fundo desfocado é o do próprio navegador (`backgroundBlur`, Chrome em
 * alguns sistemas): sem biblioteca de recorte pesada para baixar.
 *
 * ## Voz
 *
 * Web Audio: microfone (já com cancelamento de eco) → efeito → trilha nova. A
 * trilha original continua do controlador: é ela que liga/desliga de verdade e
 * que mede quem está falando.
 */

// ─── Catálogo ──────────────────────────────────────────────────────────

export type EfeitoDeVideo =
  | 'nenhum'
  | 'desfoque'
  | 'pb'
  | 'sepia'
  | 'quente'
  | 'frio'
  | 'vivido'
  | 'neon'
  | 'retro'
  | 'pixelado'
  | 'desenho'
  | 'espelho'
  | 'raiox'
  | 'termico'
  | 'moldura-domineaqui'
  | 'moldura-confete'
  | 'moldura-ecg'
  | 'moldura-estetoscopio'

export type EfeitoDeVoz = 'nenhum' | 'robo' | 'grave' | 'esquilo' | 'eco' | 'caverna' | 'radio' | 'alien'

export interface DescricaoDeEfeito<T extends string> {
  id: T
  rotulo: string
  emoji: string
  /** Fundo da miniatura no painel. */
  cor: string
}

/** Índice no shader (0 = sem filtro, só moldura). */
const FILTRO: Record<Exclude<EfeitoDeVideo, 'nenhum' | 'desfoque'>, number> = {
  pb: 1,
  sepia: 2,
  quente: 3,
  frio: 4,
  vivido: 5,
  neon: 6,
  retro: 7,
  pixelado: 8,
  desenho: 9,
  espelho: 10,
  raiox: 11,
  termico: 12,
  'moldura-domineaqui': 0,
  'moldura-confete': 0,
  'moldura-ecg': 0,
  'moldura-estetoscopio': 0,
}

export const EFEITOS_DE_VIDEO: Array<DescricaoDeEfeito<EfeitoDeVideo> & { grupo: 'basico' | 'filtro' | 'moldura' }> = [
  { id: 'nenhum', rotulo: 'Normal', emoji: '🙂', cor: 'from-neutral-500 to-neutral-700', grupo: 'basico' },
  { id: 'desfoque', rotulo: 'Fundo desfocado', emoji: '🌫️', cor: 'from-slate-400 to-slate-600', grupo: 'basico' },
  { id: 'pb', rotulo: 'Preto e branco', emoji: '🎞️', cor: 'from-neutral-300 to-neutral-800', grupo: 'filtro' },
  { id: 'sepia', rotulo: 'Sépia', emoji: '📜', cor: 'from-amber-300 to-amber-800', grupo: 'filtro' },
  { id: 'quente', rotulo: 'Quente', emoji: '☀️', cor: 'from-orange-300 to-rose-500', grupo: 'filtro' },
  { id: 'frio', rotulo: 'Frio', emoji: '❄️', cor: 'from-sky-300 to-indigo-600', grupo: 'filtro' },
  { id: 'vivido', rotulo: 'Vívido', emoji: '🌈', cor: 'from-fuchsia-400 to-emerald-400', grupo: 'filtro' },
  { id: 'neon', rotulo: 'Neon', emoji: '⚡', cor: 'from-violet-600 to-cyan-400', grupo: 'filtro' },
  { id: 'retro', rotulo: 'Retrô', emoji: '📼', cor: 'from-yellow-600 to-stone-800', grupo: 'filtro' },
  { id: 'pixelado', rotulo: 'Pixelado', emoji: '👾', cor: 'from-lime-400 to-green-700', grupo: 'filtro' },
  { id: 'desenho', rotulo: 'Desenho', emoji: '✏️', cor: 'from-pink-300 to-orange-300', grupo: 'filtro' },
  { id: 'espelho', rotulo: 'Espelho', emoji: '🪞', cor: 'from-teal-300 to-cyan-700', grupo: 'filtro' },
  { id: 'raiox', rotulo: 'Raio-X', emoji: '🩻', cor: 'from-slate-900 to-sky-400', grupo: 'filtro' },
  { id: 'termico', rotulo: 'Termografia', emoji: '🌡️', cor: 'from-blue-700 via-yellow-400 to-red-600', grupo: 'filtro' },
  { id: 'moldura-domineaqui', rotulo: 'DomineAqui', emoji: '🎓', cor: 'from-primary to-emerald-700', grupo: 'moldura' },
  { id: 'moldura-confete', rotulo: 'Confete', emoji: '🎉', cor: 'from-pink-400 to-yellow-300', grupo: 'moldura' },
  { id: 'moldura-ecg', rotulo: 'Batimentos', emoji: '💓', cor: 'from-rose-500 to-red-800', grupo: 'moldura' },
  { id: 'moldura-estetoscopio', rotulo: 'Plantão', emoji: '🩺', cor: 'from-cyan-500 to-blue-700', grupo: 'moldura' },
]

export const EFEITOS_DE_VOZ: Array<DescricaoDeEfeito<EfeitoDeVoz> & { detalhe: string }> = [
  { id: 'nenhum', rotulo: 'Normal', emoji: '🙂', cor: 'from-neutral-500 to-neutral-700', detalhe: 'A sua voz' },
  { id: 'robo', rotulo: 'Robô', emoji: '🤖', cor: 'from-slate-400 to-slate-700', detalhe: 'Metálica' },
  { id: 'grave', rotulo: 'Grave', emoji: '🐻', cor: 'from-amber-700 to-stone-900', detalhe: 'Bem mais grossa' },
  { id: 'esquilo', rotulo: 'Esquilo', emoji: '🐿️', cor: 'from-orange-300 to-amber-600', detalhe: 'Fininha' },
  { id: 'eco', rotulo: 'Eco', emoji: '🏔️', cor: 'from-sky-300 to-blue-700', detalhe: 'Repete no fim' },
  { id: 'caverna', rotulo: 'Caverna', emoji: '🦇', cor: 'from-stone-600 to-neutral-900', detalhe: 'Salão enorme' },
  { id: 'radio', rotulo: 'Rádio', emoji: '📻', cor: 'from-yellow-500 to-orange-700', detalhe: 'Telefone antigo' },
  { id: 'alien', rotulo: 'Alienígena', emoji: '👽', cor: 'from-lime-300 to-emerald-700', detalhe: 'Tremida e aguda' },
]

const IDS_DE_VIDEO = new Set<string>(EFEITOS_DE_VIDEO.map((e) => e.id))
const IDS_DE_VOZ = new Set<string>(EFEITOS_DE_VOZ.map((e) => e.id))

export function ehEfeitoDeVideo(v: unknown): v is EfeitoDeVideo {
  return typeof v === 'string' && IDS_DE_VIDEO.has(v)
}
export function ehEfeitoDeVoz(v: unknown): v is EfeitoDeVoz {
  return typeof v === 'string' && IDS_DE_VOZ.has(v)
}

/** Efeito que pede o processador WebGL (o desfoque é do navegador; "nenhum", nada). */
export function precisaProcessarVideo(e: EfeitoDeVideo): boolean {
  return e !== 'nenhum' && e !== 'desfoque'
}

/**
 * A prévia da própria câmera é espelhada (como num espelho). Com moldura que tem
 * texto, espelhar deixaria as letras ao contrário: mostra como os outros veem.
 */
export function espelharPrevia(e: EfeitoDeVideo): boolean {
  return e !== 'moldura-domineaqui' && e !== 'moldura-estetoscopio'
}

// ─── Preferências (no aparelho) ────────────────────────────────────────

const CHAVE_VIDEO = 'domineaqui:sala:efeito-video'
const CHAVE_VOZ = 'domineaqui:sala:efeito-voz'

/**
 * O filtro de câmera fica lembrado no aparelho. O de voz, só nesta aba: ninguém
 * quer começar a aula de amanhã com voz de robô sem perceber.
 */
export function lerEfeitos(): { video: EfeitoDeVideo; voz: EfeitoDeVoz } {
  let video: EfeitoDeVideo = 'nenhum'
  let voz: EfeitoDeVoz = 'nenhum'
  try {
    const v = localStorage.getItem(CHAVE_VIDEO)
    if (ehEfeitoDeVideo(v)) video = v
  } catch {
    /* sem storage */
  }
  try {
    const v = sessionStorage.getItem(CHAVE_VOZ)
    if (ehEfeitoDeVoz(v)) voz = v
  } catch {
    /* sem storage */
  }
  return { video, voz }
}

export function guardarEfeitos(e: { video: EfeitoDeVideo; voz: EfeitoDeVoz }): void {
  try {
    localStorage.setItem(CHAVE_VIDEO, e.video)
  } catch {
    /* sem storage */
  }
  try {
    sessionStorage.setItem(CHAVE_VOZ, e.voz)
  } catch {
    /* sem storage */
  }
}

// ─── Suporte ───────────────────────────────────────────────────────────

let webglTestado: boolean | null = null

export function suportaEfeitosDeVideo(): boolean {
  if (typeof document === 'undefined') return false
  if (webglTestado !== null) return webglTestado
  try {
    const c = document.createElement('canvas')
    const temSaida = typeof (c as HTMLCanvasElement & { captureStream?: unknown }).captureStream === 'function' || temGerador()
    const gl = (c.getContext('webgl') || c.getContext('experimental-webgl')) as WebGLRenderingContext | null
    webglTestado = temSaida && !!gl
    // Só um teste: devolve o contexto na hora (o navegador limita quantos ficam abertos).
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    webglTestado = false
  }
  return webglTestado
}

export function suportaEfeitosDeVoz(): boolean {
  if (typeof window === 'undefined') return false
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  return !!AC && typeof AC.prototype.createMediaStreamDestination === 'function'
}

/** Fundo desfocado nativo (Chrome com recorte do sistema). */
export function suportaDesfoqueNativo(trilha: MediaStreamTrack | null): boolean {
  try {
    const cap = trilha?.getCapabilities?.() as (MediaTrackCapabilities & { backgroundBlur?: boolean[] }) | undefined
    return !!cap?.backgroundBlur?.includes(true)
  } catch {
    return false
  }
}

export async function aplicarDesfoqueNativo(trilha: MediaStreamTrack, ligar: boolean): Promise<boolean> {
  if (!suportaDesfoqueNativo(trilha)) return false
  try {
    await trilha.applyConstraints({ advanced: [{ backgroundBlur: ligar } as MediaTrackConstraintSet] })
    return true
  } catch {
    return false
  }
}

function temGerador(): boolean {
  const w = typeof window === 'undefined' ? null : (window as unknown as Record<string, unknown>)
  return !!w && typeof w.MediaStreamTrackProcessor === 'function' && typeof w.MediaStreamTrackGenerator === 'function' && typeof w.VideoFrame === 'function'
}

// ─── Câmera: WebGL ─────────────────────────────────────────────────────

const VERTICES = `
attribute vec2 p;
varying vec2 uv;
void main() {
  uv = vec2((p.x + 1.0) * 0.5, 1.0 - (p.y + 1.0) * 0.5);
  gl_Position = vec4(p, 0.0, 1.0);
}`

const FRAGMENTOS = `
precision mediump float;
varying vec2 uv;
uniform sampler2D video;
uniform sampler2D moldura;
uniform int efeito;
uniform float tempo;
uniform vec2 tamanho;
uniform float temMoldura;

float luz(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
float ruido(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

float borda(vec2 p) {
  vec2 d = 1.0 / tamanho;
  float tl = luz(texture2D(video, p + vec2(-d.x, -d.y)).rgb);
  float t = luz(texture2D(video, p + vec2(0.0, -d.y)).rgb);
  float tr = luz(texture2D(video, p + vec2(d.x, -d.y)).rgb);
  float l = luz(texture2D(video, p + vec2(-d.x, 0.0)).rgb);
  float r = luz(texture2D(video, p + vec2(d.x, 0.0)).rgb);
  float bl = luz(texture2D(video, p + vec2(-d.x, d.y)).rgb);
  float b = luz(texture2D(video, p + vec2(0.0, d.y)).rgb);
  float br = luz(texture2D(video, p + vec2(d.x, d.y)).rgb);
  float gx = -tl - 2.0 * l - bl + tr + 2.0 * r + br;
  float gy = -tl - 2.0 * t - tr + bl + 2.0 * b + br;
  return clamp(length(vec2(gx, gy)), 0.0, 1.0);
}

vec3 matiz(float h) {
  return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
}

vec3 sepia(vec3 c) {
  return clamp(vec3(dot(c, vec3(0.393, 0.769, 0.189)), dot(c, vec3(0.349, 0.686, 0.168)), dot(c, vec3(0.272, 0.534, 0.131))), 0.0, 1.0);
}

void main() {
  vec2 p = uv;
  if (efeito == 8) {
    vec2 blocos = vec2(72.0, 72.0 * tamanho.y / tamanho.x);
    p = (floor(p * blocos) + 0.5) / blocos;
  }
  if (efeito == 10 && p.x > 0.5) p.x = 1.0 - p.x;
  vec3 c = texture2D(video, p).rgb;

  if (efeito == 1) {
    c = vec3(luz(c));
  } else if (efeito == 2) {
    c = sepia(c);
  } else if (efeito == 3) {
    c = clamp(vec3(c.r * 1.08 + 0.06, c.g * 1.02 + 0.02, c.b * 0.82), 0.0, 1.0);
  } else if (efeito == 4) {
    c = clamp(vec3(c.r * 0.86, c.g * 0.98 + 0.02, c.b * 1.1 + 0.06), 0.0, 1.0);
  } else if (efeito == 5) {
    float l = luz(c);
    c = clamp(mix(vec3(l), c, 1.75), 0.0, 1.0);
    c = clamp((c - 0.5) * 1.12 + 0.5, 0.0, 1.0);
  } else if (efeito == 6) {
    float e = smoothstep(0.08, 0.45, borda(p));
    vec3 cor = matiz(fract(uv.y * 0.6 + uv.x * 0.25 + tempo * 0.12));
    c = c * 0.18 + cor * e * 1.25;
  } else if (efeito == 7) {
    c = sepia(c) * 0.9 + 0.05;
    float v = smoothstep(0.85, 0.25, distance(uv, vec2(0.5)));
    c = c * (0.45 + 0.55 * v) + (ruido(uv * tamanho + tempo) - 0.5) * 0.09;
  } else if (efeito == 9) {
    c = floor(c * 5.0 + 0.5) / 5.0;
    float e = smoothstep(0.22, 0.5, borda(p));
    c = mix(c, vec3(0.08), e);
  } else if (efeito == 11) {
    float l = 1.0 - luz(c);
    l = smoothstep(0.15, 0.95, l);
    c = vec3(l * 0.78, l * 0.9, l) + vec3(0.0, 0.03, 0.08);
  } else if (efeito == 12) {
    float l = luz(c);
    c = l < 0.25 ? mix(vec3(0.0, 0.0, 0.35), vec3(0.0, 0.3, 1.0), l / 0.25)
      : l < 0.5 ? mix(vec3(0.0, 0.3, 1.0), vec3(0.0, 1.0, 0.4), (l - 0.25) / 0.25)
      : l < 0.75 ? mix(vec3(0.0, 1.0, 0.4), vec3(1.0, 0.9, 0.0), (l - 0.5) / 0.25)
      : mix(vec3(1.0, 0.9, 0.0), vec3(1.0, 0.1, 0.0), (l - 0.75) / 0.25);
  }

  if (temMoldura > 0.5) {
    vec4 m = texture2D(moldura, uv);
    c = mix(c, m.rgb, m.a);
  }
  gl_FragColor = vec4(c, 1.0);
}`

function compilar(gl: WebGLRenderingContext, tipo: number, fonte: string): WebGLShader {
  const s = gl.createShader(tipo)!
  gl.shaderSource(s, fonte)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader')
  return s
}

class Pincel {
  readonly canvas: HTMLCanvasElement
  private readonly gl: WebGLRenderingContext
  private readonly uni: Record<'efeito' | 'tempo' | 'tamanho' | 'temMoldura' | 'video' | 'moldura', WebGLUniformLocation | null>
  private readonly texVideo: WebGLTexture
  private readonly texMoldura: WebGLTexture
  private readonly inicio = performance.now()
  private versaoDaMoldura = -1

  constructor() {
    this.canvas = document.createElement('canvas')
    this.canvas.width = 640
    this.canvas.height = 360
    const gl = (this.canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, premultipliedAlpha: false, preserveDrawingBuffer: false }) ||
      this.canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
    if (!gl) throw new Error('sem webgl')
    this.gl = gl
    const prog = gl.createProgram()!
    gl.attachShader(prog, compilar(gl, gl.VERTEX_SHADER, VERTICES))
    gl.attachShader(prog, compilar(gl, gl.FRAGMENT_SHADER, FRAGMENTOS))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || 'programa')
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const pos = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(pos)
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)
    const textura = () => {
      const t = gl.createTexture()!
      gl.bindTexture(gl.TEXTURE_2D, t)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      return t
    }
    this.texVideo = textura()
    this.texMoldura = textura()
    const u = (n: string) => gl.getUniformLocation(prog, n)
    this.uni = { efeito: u('efeito'), tempo: u('tempo'), tamanho: u('tamanho'), temMoldura: u('temMoldura'), video: u('video'), moldura: u('moldura') }
    gl.uniform1i(this.uni.video, 0)
    gl.uniform1i(this.uni.moldura, 1)
  }

  /** Desenha um quadro. `fonte`: `<video>`, `VideoFrame` ou canvas. */
  desenhar(fonte: TexImageSource, largura: number, altura: number, efeito: number, moldura: HTMLCanvasElement | null, versaoDaMoldura = 0): void {
    const gl = this.gl
    if (largura > 0 && altura > 0 && (this.canvas.width !== largura || this.canvas.height !== altura)) {
      this.canvas.width = largura
      this.canvas.height = altura
    }
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.texVideo)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fonte)
    if (moldura && versaoDaMoldura !== this.versaoDaMoldura) {
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, this.texMoldura)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, moldura)
      this.versaoDaMoldura = versaoDaMoldura
    }
    gl.uniform1i(this.uni.efeito, efeito)
    gl.uniform1f(this.uni.tempo, (performance.now() - this.inicio) / 1000)
    gl.uniform2f(this.uni.tamanho, this.canvas.width, this.canvas.height)
    gl.uniform1f(this.uni.temMoldura, moldura ? 1 : 0)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  destruir(): void {
    this.gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
}

// ─── Molduras (canvas 2D, viram a segunda textura) ─────────────────────

interface Confete {
  x: number
  y: number
  v: number
  giro: number
  cor: string
  tam: number
}

class Moldura {
  readonly canvas = document.createElement('canvas')
  private readonly ctx: CanvasRenderingContext2D
  private confetes: Confete[] = []
  private desenhadaPara = ''
  /** Sobe a cada redesenho: a textura só é reenviada à GPU quando muda. */
  versao = 0

  constructor() {
    this.ctx = this.canvas.getContext('2d')!
  }

  /** Atualiza a moldura para o tamanho e o instante; `null` = efeito sem moldura. */
  atualizar(efeito: EfeitoDeVideo, w: number, h: number, t: number): HTMLCanvasElement | null {
    if (!efeito.startsWith('moldura-')) return null
    const animada = efeito === 'moldura-confete' || efeito === 'moldura-ecg'
    const chave = `${efeito}:${w}x${h}`
    if (!animada && chave === this.desenhadaPara) return this.canvas
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w
      this.canvas.height = h
      this.confetes = []
    }
    this.desenhadaPara = chave
    this.versao++
    const c = this.ctx
    c.clearRect(0, 0, w, h)
    const u = Math.min(w, h) / 100
    if (efeito === 'moldura-domineaqui') this.domineAqui(c, w, h, u)
    else if (efeito === 'moldura-confete') this.confete(c, w, h, u)
    else if (efeito === 'moldura-ecg') this.ecg(c, w, h, u, t)
    else if (efeito === 'moldura-estetoscopio') this.plantao(c, w, h, u)
    return this.canvas
  }

  private selo(c: CanvasRenderingContext2D, texto: string, x: number, y: number, u: number, fundo: string): void {
    c.font = `700 ${Math.round(5.2 * u)}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
    const largura = c.measureText(texto).width + 6 * u
    const alto = 9 * u
    c.fillStyle = fundo
    c.beginPath()
    const r = alto / 2
    c.moveTo(x - largura + r, y - alto)
    c.arcTo(x, y - alto, x, y, r)
    c.arcTo(x, y, x - largura, y, r)
    c.arcTo(x - largura, y, x - largura, y - alto, r)
    c.arcTo(x - largura, y - alto, x, y - alto, r)
    c.fill()
    c.fillStyle = '#fff'
    c.textBaseline = 'middle'
    c.fillText(texto, x - largura + 3 * u, y - alto / 2 + 0.3 * u)
  }

  private domineAqui(c: CanvasRenderingContext2D, w: number, h: number, u: number): void {
    const g = c.createLinearGradient(0, 0, w, h)
    g.addColorStop(0, '#10b981')
    g.addColorStop(0.5, '#0ea5e9')
    g.addColorStop(1, '#8b5cf6')
    c.strokeStyle = g
    c.lineWidth = 3.2 * u
    c.beginPath()
    c.roundRect?.(1.6 * u, 1.6 * u, w - 3.2 * u, h - 3.2 * u, 6 * u)
    if (!c.roundRect) c.rect(1.6 * u, 1.6 * u, w - 3.2 * u, h - 3.2 * u)
    c.stroke()
    this.selo(c, '🎓 DomineAqui', w - 5 * u, h - 5 * u, u, 'rgba(16,185,129,0.92)')
  }

  private confete(c: CanvasRenderingContext2D, w: number, h: number, u: number): void {
    const cores = ['#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#facc15']
    while (this.confetes.length < 46) {
      this.confetes.push({ x: Math.random() * w, y: -Math.random() * h, v: (0.35 + Math.random() * 0.6) * u, giro: Math.random() * 6, cor: cores[this.confetes.length % cores.length], tam: (1.2 + Math.random() * 1.6) * u })
    }
    for (const p of this.confetes) {
      p.y += p.v
      p.x += Math.sin(p.y / (12 * u) + p.giro) * 0.35 * u
      p.giro += 0.08
      if (p.y > h + 4 * u) {
        p.y = -4 * u
        p.x = Math.random() * w
      }
      // Só nas bordas: o rosto fica livre.
      const meio = p.x > w * 0.22 && p.x < w * 0.78 && p.y > h * 0.18
      c.globalAlpha = meio ? 0 : 0.95
      c.save()
      c.translate(p.x, p.y)
      c.rotate(p.giro)
      c.fillStyle = p.cor
      c.fillRect(-p.tam, -p.tam / 2, p.tam * 2, p.tam)
      c.restore()
    }
    c.globalAlpha = 1
  }

  private ecg(c: CanvasRenderingContext2D, w: number, h: number, u: number, t: number): void {
    const base = h - 9 * u
    const grad = c.createLinearGradient(0, base - 10 * u, 0, h)
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(1, 'rgba(0,0,0,0.55)')
    c.fillStyle = grad
    c.fillRect(0, base - 14 * u, w, h - base + 14 * u)
    const periodo = w * 0.42
    const desloc = (t * w * 0.28) % w
    c.lineWidth = 0.9 * u
    c.lineJoin = 'round'
    c.shadowColor = '#22c55e'
    c.shadowBlur = 3 * u
    c.strokeStyle = '#4ade80'
    c.beginPath()
    for (let x = 0; x <= w; x += 2) {
      const f = (((x + desloc) % periodo) + periodo) % periodo / periodo
      let y = 0
      if (f > 0.1 && f < 0.16) y = -Math.sin(((f - 0.1) / 0.06) * Math.PI) * 1.6
      else if (f > 0.22 && f < 0.25) y = ((f - 0.22) / 0.03) * 1.8
      else if (f >= 0.25 && f < 0.29) y = 1.8 - ((f - 0.25) / 0.04) * 11.8
      else if (f >= 0.29 && f < 0.33) y = -10 + ((f - 0.29) / 0.04) * 12.5
      else if (f >= 0.33 && f < 0.35) y = 2.5 - ((f - 0.33) / 0.02) * 2.5
      else if (f > 0.45 && f < 0.57) y = -Math.sin(((f - 0.45) / 0.12) * Math.PI) * 2.6
      const py = base + y * u
      if (x === 0) c.moveTo(x, py)
      else c.lineTo(x, py)
    }
    c.stroke()
    c.shadowBlur = 0
    const batida = Math.pow(Math.max(0, Math.sin(t * Math.PI * 2.4)), 6)
    c.font = `${Math.round((6 + batida * 1.6) * u)}px system-ui, sans-serif`
    c.textBaseline = 'middle'
    c.fillText('💓', 3.5 * u, 6.5 * u)
    c.font = `700 ${Math.round(4.4 * u)}px system-ui, sans-serif`
    c.fillStyle = '#4ade80'
    c.fillText('72 bpm', 12 * u, 6.8 * u)
  }

  private plantao(c: CanvasRenderingContext2D, w: number, h: number, u: number): void {
    c.font = `${Math.round(12 * u)}px system-ui, sans-serif`
    c.textBaseline = 'top'
    c.fillText('🩺', 3 * u, 3 * u)
    this.selo(c, '🩺 De plantão nos estudos', w - 4 * u, h - 4 * u, u, 'rgba(14,116,144,0.92)')
  }
}

// ─── Processador de vídeo ──────────────────────────────────────────────

type Gerador = MediaStreamTrack & { writable: WritableStream<VideoFrame> }

export class ProcessadorDeVideo {
  readonly entrada: MediaStreamTrack
  readonly saida: MediaStreamTrack
  private efeito: EfeitoDeVideo
  private readonly pincel: Pincel
  private readonly moldura = new Moldura()
  private parado = false
  private quadros = 0
  private contadoEm = performance.now()
  /** Quadros por segundo que o processador conseguiu entregar (aviso de "efeito pesado"). */
  fps = 30
  private parar: () => void = () => {}

  constructor(entrada: MediaStreamTrack, efeito: EfeitoDeVideo) {
    this.entrada = entrada
    this.efeito = efeito
    this.pincel = new Pincel()
    this.saida = temGerador() ? this.peloGerador() : this.peloVideo()
    try {
      this.saida.contentHint = 'motion'
    } catch {
      /* opcional */
    }
  }

  definir(efeito: EfeitoDeVideo): void {
    this.efeito = efeito
  }

  private contar(): void {
    this.quadros++
    const agora = performance.now()
    if (agora - this.contadoEm >= 1_000) {
      this.fps = Math.round((this.quadros * 1000) / (agora - this.contadoEm))
      this.quadros = 0
      this.contadoEm = agora
    }
  }

  private pintar(fonte: TexImageSource, w: number, h: number): void {
    const indice = precisaProcessarVideo(this.efeito) ? FILTRO[this.efeito as keyof typeof FILTRO] : 0
    const moldura = this.moldura.atualizar(this.efeito, w, h, performance.now() / 1000)
    this.pincel.desenhar(fonte, w, h, indice, moldura, this.moldura.versao)
    this.contar()
  }

  /** Chrome/Edge: quadro a quadro, sem depender de a aba estar visível. */
  private peloGerador(): MediaStreamTrack {
    const w = window as unknown as {
      MediaStreamTrackProcessor: new (o: { track: MediaStreamTrack }) => { readable: ReadableStream<VideoFrame> }
      MediaStreamTrackGenerator: new (o: { kind: 'video' }) => Gerador
    }
    const processador = new w.MediaStreamTrackProcessor({ track: this.entrada })
    const gerador = new w.MediaStreamTrackGenerator({ kind: 'video' })
    const leitor = processador.readable.getReader()
    const escritor = gerador.writable.getWriter()
    // Chrome antigo sem VideoFrame no texImage2D: passa por um canvas 2D.
    let ponte: HTMLCanvasElement | null = null
    const bombear = async () => {
      while (!this.parado) {
        let lido: ReadableStreamReadResult<VideoFrame>
        try {
          lido = await leitor.read()
        } catch {
          return
        }
        if (lido.done || !lido.value) return
        const quadro = lido.value
        try {
          const largura = quadro.displayWidth
          const altura = quadro.displayHeight
          try {
            if (ponte) throw new Error('ponte')
            this.pintar(quadro, largura, altura)
          } catch {
            ponte = ponte || document.createElement('canvas')
            if (ponte.width !== largura || ponte.height !== altura) Object.assign(ponte, { width: largura, height: altura })
            ponte.getContext('2d')!.drawImage(quadro, 0, 0, largura, altura)
            this.pintar(ponte, largura, altura)
          }
          const saida = new VideoFrame(this.pincel.canvas, { timestamp: quadro.timestamp })
          quadro.close()
          await escritor.write(saida)
        } catch {
          try {
            quadro.close()
          } catch {
            /* já fechado */
          }
          if (this.parado) return
        }
      }
    }
    void bombear()
    this.parar = () => {
      void leitor.cancel().catch(() => {})
      void escritor.close().catch(() => {})
    }
    return gerador
  }

  /** Safari/Firefox: `<video>` escondido → WebGL → `captureStream`. */
  private peloVideo(): MediaStreamTrack {
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.setAttribute('playsinline', '')
    video.srcObject = new MediaStream([this.entrada])
    void video.play().catch(() => {})
    const v = video as HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => number; cancelVideoFrameCallback?: (id: number) => void }
    let pedido = 0
    let temporizador: ReturnType<typeof setTimeout> | undefined
    const proximo = () => {
      if (this.parado) return
      // Aba oculta: rAF/rVFC param; um temporizador mantém o vídeo andando (mais devagar).
      if (document.visibilityState === 'hidden') temporizador = setTimeout(quadro, 66)
      else if (v.requestVideoFrameCallback) pedido = v.requestVideoFrameCallback(quadro)
      else pedido = requestAnimationFrame(quadro)
    }
    const quadro = () => {
      if (this.parado) return
      if (video.readyState >= 2 && video.videoWidth) {
        try {
          this.pintar(video, video.videoWidth, video.videoHeight)
        } catch {
          /* quadro perdido */
        }
      }
      proximo()
    }
    proximo()
    const fluxo = (this.pincel.canvas as HTMLCanvasElement & { captureStream: (fps?: number) => MediaStream }).captureStream(30)
    this.parar = () => {
      if (v.cancelVideoFrameCallback && pedido) v.cancelVideoFrameCallback(pedido)
      cancelAnimationFrame(pedido)
      clearTimeout(temporizador)
      video.pause()
      video.srcObject = null
    }
    return fluxo.getVideoTracks()[0]
  }

  /** Para a saída (a entrada é do controlador: quem a para é ele). */
  destruir(): void {
    if (this.parado) return
    this.parado = true
    this.parar()
    try {
      this.saida.stop()
    } catch {
      /* já parada */
    }
    this.pincel.destruir()
  }
}

// ─── Voz ───────────────────────────────────────────────────────────────

/** Mudança de tom por duas linhas de atraso moduladas (técnica "jungle" de Chris Wilson). */
class MudadorDeTom {
  readonly entrada: GainNode
  readonly saida: GainNode
  private readonly fontes: AudioScheduledSourceNode[] = []

  constructor(ctx: AudioContext, quanto: number) {
    const TEMPO = 0.1
    const FADE = 0.05
    const taxa = ctx.sampleRate
    const ativo = Math.round(TEMPO * taxa)
    const total = ativo + Math.round((TEMPO - 2 * FADE) * taxa)
    const rampa = (subindo: boolean) => {
      const b = ctx.createBuffer(1, total, taxa)
      const d = b.getChannelData(0)
      for (let i = 0; i < ativo; i++) d[i] = subindo ? (ativo - i) / total : i / ativo
      return b
    }
    const fade = (() => {
      const b = ctx.createBuffer(1, total, taxa)
      const d = b.getChannelData(0)
      const n = FADE * taxa
      for (let i = 0; i < ativo; i++) d[i] = i < n ? Math.sqrt(i / n) : i >= ativo - n ? Math.sqrt(1 - (i - (ativo - n)) / n) : 1
      return b
    })()
    const laco = (buffer: AudioBuffer) => {
      const s = ctx.createBufferSource()
      s.buffer = buffer
      s.loop = true
      this.fontes.push(s)
      return s
    }
    this.entrada = ctx.createGain()
    this.saida = ctx.createGain()
    const subir = quanto > 0
    const buffer = rampa(subir)
    // Razão de tom ≈ 1 ± quanto/2 (a rampa varre o atraso a cada TEMPO).
    const atraso = 0.5 * TEMPO * Math.min(1, Math.abs(quanto))
    const inicio = ctx.currentTime + 0.05
    for (let k = 0; k < 2; k++) {
      const mod = laco(buffer)
      const ganhoMod = ctx.createGain()
      ganhoMod.gain.value = atraso
      const linha = ctx.createDelay(1)
      linha.delayTime.value = 0
      mod.connect(ganhoMod).connect(linha.delayTime)
      const mistura = ctx.createGain()
      mistura.gain.value = 0
      const f = laco(fade)
      f.connect(mistura.gain)
      this.entrada.connect(linha).connect(mistura).connect(this.saida)
      const t = inicio + k * (TEMPO - FADE)
      mod.start(t)
      f.start(t)
    }
  }

  parar(): void {
    for (const f of this.fontes) {
      try {
        f.stop()
      } catch {
        /* já parada */
      }
    }
  }
}

function curvaDeSaturacao(intensidade: number): Float32Array<ArrayBuffer> {
  const n = 1024
  const curva = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1
    curva[i] = ((3 + intensidade) * x * 20 * (Math.PI / 180)) / (Math.PI + intensidade * Math.abs(x))
  }
  return curva
}

function respostaDeSala(ctx: AudioContext, segundos: number, queda: number): AudioBuffer {
  const n = Math.round(ctx.sampleRate * segundos)
  const b = ctx.createBuffer(2, n, ctx.sampleRate)
  for (let canal = 0; canal < 2; canal++) {
    const d = b.getChannelData(canal)
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, queda)
  }
  return b
}

export class ProcessadorDeAudio {
  readonly entrada: MediaStreamTrack
  readonly saida: MediaStreamTrack
  private readonly ctx: AudioContext
  private readonly fonte: MediaStreamAudioSourceNode
  private readonly destino: MediaStreamAudioDestinationNode
  private efeito: EfeitoDeVoz = 'nenhum'
  private desmontar: () => void = () => {}
  private soltarRetomada: () => void = () => {}

  constructor(entrada: MediaStreamTrack, efeito: EfeitoDeVoz) {
    this.entrada = entrada
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    this.ctx = new AC({ latencyHint: 'interactive' })
    this.fonte = this.ctx.createMediaStreamSource(new MediaStream([entrada]))
    this.destino = this.ctx.createMediaStreamDestination()
    this.saida = this.destino.stream.getAudioTracks()[0]
    this.definir(efeito)
    this.garantirSom()
  }

  /**
   * O navegador só deixa o áudio da página tocar depois de um toque. Efeito
   * lembrado de antes (recarregou a página) criaria uma trilha muda: retoma no
   * primeiro toque, seja onde for.
   */
  private garantirSom(): void {
    if (this.ctx.state === 'running') return
    void this.ctx.resume().catch(() => {})
    const retomar = () => {
      void this.ctx.resume().catch(() => {})
      if (this.ctx.state === 'running') this.soltarRetomada()
    }
    document.addEventListener('pointerdown', retomar, true)
    document.addEventListener('keydown', retomar, true)
    this.soltarRetomada = () => {
      document.removeEventListener('pointerdown', retomar, true)
      document.removeEventListener('keydown', retomar, true)
    }
  }

  get funcionando(): boolean {
    return this.ctx.state === 'running'
  }

  definir(efeito: EfeitoDeVoz): void {
    if (efeito === this.efeito && efeito !== 'nenhum') return
    this.desmontar()
    this.fonte.disconnect()
    this.efeito = efeito
    const ctx = this.ctx
    const ligar = (...nos: AudioNode[]) => {
      for (let i = 0; i < nos.length - 1; i++) nos[i].connect(nos[i + 1])
    }
    const paradas: Array<() => void> = []
    const nos: AudioNode[] = []
    const novo = <T extends AudioNode>(n: T): T => {
      nos.push(n)
      return n
    }
    const osc = (tipo: OscillatorType, hz: number) => {
      const o = novo(ctx.createOscillator())
      o.type = tipo
      o.frequency.value = hz
      o.start()
      paradas.push(() => o.stop())
      return o
    }
    const ganho = (v: number) => {
      const g = novo(ctx.createGain())
      g.gain.value = v
      return g
    }

    switch (efeito) {
      case 'robo': {
        // Modulação em anel + um pente curto: o timbre metálico.
        const anel = ganho(0)
        osc('sine', 55).connect(anel.gain)
        const pente = novo(ctx.createDelay(0.05))
        pente.delayTime.value = 0.008
        const volta = ganho(0.55)
        const saida = ganho(1.4)
        ligar(this.fonte, anel, saida, this.destino)
        ligar(anel, pente, volta, pente)
        ligar(pente, saida)
        break
      }
      case 'grave':
      case 'esquilo':
      case 'alien': {
        const tom = new MudadorDeTom(ctx, efeito === 'grave' ? -0.6 : efeito === 'esquilo' ? 1 : 0.45)
        paradas.push(() => tom.parar())
        nos.push(tom.entrada, tom.saida)
        if (efeito === 'alien') {
          // Vibrato fundo por cima do tom mais agudo.
          const tremor = novo(ctx.createDelay(0.05))
          tremor.delayTime.value = 0.006
          const lfo = ganho(0.004)
          osc('sine', 7).connect(lfo).connect(tremor.delayTime)
          ligar(this.fonte, tom.entrada)
          ligar(tom.saida, tremor, ganho(1.2), this.destino)
        } else {
          ligar(this.fonte, tom.entrada)
          ligar(tom.saida, ganho(1.15), this.destino)
        }
        break
      }
      case 'eco': {
        const atraso = novo(ctx.createDelay(1))
        atraso.delayTime.value = 0.28
        const volta = ganho(0.42)
        const molhado = ganho(0.6)
        ligar(this.fonte, this.destino)
        ligar(this.fonte, atraso, volta, atraso)
        ligar(atraso, molhado, this.destino)
        break
      }
      case 'caverna': {
        const sala = novo(ctx.createConvolver())
        sala.buffer = respostaDeSala(ctx, 2.8, 2.2)
        ligar(this.fonte, ganho(0.75), this.destino)
        ligar(this.fonte, sala, ganho(0.9), this.destino)
        break
      }
      case 'radio': {
        const graves = novo(ctx.createBiquadFilter())
        graves.type = 'highpass'
        graves.frequency.value = 450
        const agudos = novo(ctx.createBiquadFilter())
        agudos.type = 'lowpass'
        agudos.frequency.value = 3200
        const realce = novo(ctx.createBiquadFilter())
        realce.type = 'peaking'
        realce.frequency.value = 1500
        realce.gain.value = 8
        const sat = novo(ctx.createWaveShaper())
        sat.curve = curvaDeSaturacao(40)
        sat.oversample = '2x'
        ligar(this.fonte, graves, agudos, realce, sat, ganho(0.9), this.destino)
        break
      }
      default:
        ligar(this.fonte, this.destino)
    }
    this.desmontar = () => {
      for (const p of paradas) {
        try {
          p()
        } catch {
          /* já parado */
        }
      }
      for (const n of nos) n.disconnect()
    }
  }

  destruir(): void {
    this.desmontar()
    this.soltarRetomada()
    try {
      this.fonte.disconnect()
    } catch {
      /* nada */
    }
    try {
      this.saida.stop()
    } catch {
      /* já parada */
    }
    void this.ctx.close().catch(() => {})
  }
}
