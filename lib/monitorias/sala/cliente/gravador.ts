/**
 * Gravador de voz do Resumo por IA — roda no navegador de quem tem a voz
 * transcrita (o monitor e, na aula individual, o aluno que comprou).
 *
 * - Grava SÓ o próprio microfone cru (a trilha capturada, sem o efeito de voz),
 *   em opus a 24 kb/s. Nada muda no P2P nem no TURN; o vídeo nunca é gravado.
 * - Pausa no silêncio (e com o microfone mudo): o medidor de nível lê a cada
 *   100 ms; a gravação segue até 2 s depois da última fala. Cada retomada
 *   registra a marca [ms de áudio, ms reais] para o servidor pôr cada fala no
 *   minuto certo da aula. Corta de 40% a 70% do áudio (e dos tokens).
 * - Trechos de até 10 min de FALA. Os pedaços vão para o IndexedDB a cada 10 s:
 *   aba fechada no meio perde no máximo 10 s, e o envio retoma na próxima vez
 *   que a sala (ou a reserva) abrir, por até 24 h depois da aula.
 * - Envio direto do navegador para o Google (URL de upload resumable aberta pelo
 *   servidor); sem acesso ao Google (rede, CORS), vai para o Blob privado.
 */

import { criarMedidor } from './midia'

const LIMIAR_DE_FALA = 0.06
const SEGURA_APOS_FALA_MS = 2_000
const FALA_MAX_POR_TRECHO_MS = 10 * 60_000
const FALA_MIN_POR_TRECHO_MS = 1_000
const FATIA_MS = 10_000
const BITS_POR_SEGUNDO = 24_000
const VIDA_LOCAL_MS = 26 * 3600_000
const BANCO = 'domineaqui-resumo-ia'

export interface EstadoDoGravador {
  /** Gravando a fala agora (o selo pulsa). */
  falando: boolean
  /** A pessoa pausou a transcrição da própria voz. */
  pausado: boolean
  /** Trechos guardados no aparelho esperando envio. */
  pendentes: number
  enviados: number
  erro: string | null
}

interface TrechoLocal {
  chave: string
  reservaId: string
  seq: number
  partes: Blob[]
  mime: string
  inicio: string
  marcas: Array<[number, number]>
  duracaoAudioMs: number
  duracaoRealMs: number
  fechado: boolean
  criadoEm: number
}

// ─── IndexedDB (pequeno, sem dependência) ───────────────────────────────

function abrirBanco(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null)
      const req = indexedDB.open(BANCO, 1)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains('trechos')) db.createObjectStore('trechos', { keyPath: 'chave' })
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

function tx<T>(db: IDBDatabase | null, modo: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T | null> {
  return new Promise((resolve) => {
    if (!db) return resolve(null)
    try {
      const t = db.transaction('trechos', modo)
      const r = fn(t.objectStore('trechos'))
      t.oncomplete = () => resolve(r ? (r.result as T) : null)
      t.onerror = () => resolve(null)
      t.onabort = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

const chaveDe = (reservaId: string, seq: number) => `${reservaId}:${String(seq).padStart(4, '0')}`

/** Apaga o trecho só se ainda for O MESMO (o número de um trecho curto é reaproveitado pelo próximo). */
function apagarSeForOMesmo(db: IDBDatabase | null, chave: string, criadoEm: number): Promise<unknown> {
  return new Promise((resolve) => {
    if (!db) return resolve(null)
    try {
      const t = db.transaction('trechos', 'readwrite')
      const s = t.objectStore('trechos')
      const req = s.get(chave)
      req.onsuccess = () => {
        if ((req.result as TrechoLocal | undefined)?.criadoEm === criadoEm) s.delete(chave)
      }
      t.oncomplete = () => resolve(null)
      t.onerror = () => resolve(null)
      t.onabort = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

async function trechosDaReserva(db: IDBDatabase | null, reservaId: string): Promise<TrechoLocal[]> {
  const todos = (await tx<TrechoLocal[]>(db, 'readonly', (s) => s.getAll())) || []
  const agora = Date.now()
  // Vencidos (passou a janela de envio): saem do aparelho.
  for (const t of todos) if (agora - t.criadoEm > VIDA_LOCAL_MS) void tx(db, 'readwrite', (s) => void s.delete(t.chave))
  return todos.filter((t) => t.reservaId === reservaId && agora - t.criadoEm <= VIDA_LOCAL_MS).sort((a, b) => a.seq - b.seq)
}

function escolherMime(): string | null {
  if (typeof MediaRecorder === 'undefined') return null
  for (const m of ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm', 'audio/mp4']) {
    try {
      if (MediaRecorder.isTypeSupported(m)) return m
    } catch {
      /* segue */
    }
  }
  return null
}

/** O navegador grava? (sem MediaRecorder não há Resumo nesta voz — a aula segue igual). */
export function gravacaoSuportada(): boolean {
  return escolherMime() !== null
}

// ─── Envio ──────────────────────────────────────────────────────────────

type Resposta = { ok: boolean; status: number; corpo: any }

async function postar(url: string, corpo: unknown): Promise<Resposta> {
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo), cache: 'no-store' })
    return { ok: r.ok, status: r.status, corpo: await r.json().catch(() => null) }
  } catch {
    return { ok: false, status: 0, corpo: null }
  }
}

const filaDeEnvio = new Map<string, Promise<{ enviados: number; restam: number }>>()

/**
 * Manda os trechos guardados no aparelho, um por vez. Devolve quantos foram.
 * Recusa definitiva do servidor (voz não transcrita, fora da janela) apaga o
 * trecho do aparelho: nada de áudio esquecido no navegador.
 *
 * Um envio por reserva de cada vez: na mesma aba (a sala fechando enquanto a
 * página da reserva abre) e entre abas (Web Locks). Dois envios do mesmo trecho
 * ao mesmo tempo subiam dois arquivos e o servidor conferia o errado.
 */
export function enviarPendentes(reservaId: string, aoEnviar?: () => void): Promise<{ enviados: number; restam: number }> {
  const rodar = () => enviarPendentesAgora(reservaId, aoEnviar)
  type Resultado = { enviados: number; restam: number }
  const comTrava = (): Promise<Resultado> =>
    typeof navigator !== 'undefined' && navigator.locks?.request
      ? (navigator.locks.request(`domineaqui-resumo-envio-${reservaId}`, rodar) as unknown as Promise<Resultado>)
      : rodar()
  const anterior = filaDeEnvio.get(reservaId)
  const proxima = (anterior ? anterior.catch(() => null) : Promise.resolve(null)).then(comTrava)
  filaDeEnvio.set(reservaId, proxima)
  void proxima
    .finally(() => {
      if (filaDeEnvio.get(reservaId) === proxima) filaDeEnvio.delete(reservaId)
    })
    .catch(() => {})
  return proxima
}

async function enviarPendentesAgora(reservaId: string, aoEnviar?: () => void): Promise<{ enviados: number; restam: number }> {
  const db = await abrirBanco()
  const base = `/api/monitorias/reservas/${reservaId}/resumo`
  let enviados = 0
  for (const t of await trechosDaReserva(db, reservaId)) {
    if (!t.fechado) continue
    const corpo = new Blob(t.partes, { type: t.mime.split(';')[0] })
    if (corpo.size === 0 || t.duracaoAudioMs < FALA_MIN_POR_TRECHO_MS) {
      await tx(db, 'readwrite', (s) => void s.delete(t.chave))
      continue
    }
    const meta = { seq: t.seq, bytes: corpo.size, mime: t.mime, duracaoAudioMs: Math.round(t.duracaoAudioMs), duracaoRealMs: Math.round(Math.max(t.duracaoRealMs, t.duracaoAudioMs)), inicio: t.inicio, marcas: t.marcas }
    let abertura = await postar(`${base}/envio`, meta)
    if (!abertura.ok) {
      if (abertura.status >= 400 && abertura.status < 500 && abertura.status !== 429) await tx(db, 'readwrite', (s) => void s.delete(t.chave))
      continue
    }
    let concluido: Resposta | null = null
    if (abertura.corpo?.modo === 'ja_enviado') {
      concluido = { ok: true, status: 200, corpo: null }
    } else if (abertura.corpo?.modo === 'direto' && abertura.corpo.url) {
      // O motivo de cada falha vai junto para o servidor: é o que o admin vê no diagnóstico.
      let erroDireto = ''
      try {
        const r = await fetch(abertura.corpo.url, { method: 'POST', headers: { 'X-Goog-Upload-Command': 'upload, finalize', 'X-Goog-Upload-Offset': '0' }, body: corpo })
        const dados = await r.json().catch(() => null)
        if (r.ok && dados?.file?.name) {
          concluido = await postar(`${base}/envio/concluido`, { seq: t.seq, arquivo: dados.file.name })
        } else {
          erroDireto = `Google respondeu HTTP ${r.status}${dados?.error?.message ? `: ${String(dados.error.message)}` : ''}`
        }
      } catch (e) {
        erroDireto = `rede ou CORS até o Google (${e instanceof Error ? e.message || e.name : 'erro'})`
      }
      if (!concluido) abertura = await postar(`${base}/envio`, { ...meta, viaBlob: true, erroDireto: erroDireto.slice(0, 200) || undefined })
    }
    let falha = ''
    if (!concluido && abertura.ok && abertura.corpo?.modo === 'blob' && abertura.corpo.caminho) {
      try {
        const { upload } = await import('@vercel/blob/client')
        const blob = await upload(abertura.corpo.caminho, corpo, {
          access: 'private',
          contentType: t.mime.split(';')[0],
          handleUploadUrl: `${base}/blob`,
          clientPayload: JSON.stringify({ reservaId, seq: t.seq }),
        })
        concluido = await postar(`${base}/envio/concluido`, { seq: t.seq, blobUrl: blob.url })
      } catch (e) {
        concluido = null
        falha = `reserva pelo Blob falhou (${e instanceof Error ? e.message || e.name : 'erro'})`
      }
    } else if (!concluido && !abertura.ok) {
      falha = `reserva pelo Blob recusada (HTTP ${abertura.status}${abertura.corpo?.error ? `: ${String(abertura.corpo.error)}` : ''})`
    }
    if (falha) void postar(`${base}/envio/concluido`, { seq: t.seq, falha: falha.slice(0, 200) })
    if (concluido?.ok) {
      await tx(db, 'readwrite', (s) => void s.delete(t.chave))
      enviados++
      aoEnviar?.()
    }
  }
  const restam = (await trechosDaReserva(db, reservaId)).filter((t) => t.fechado).length
  db?.close()
  return { enviados, restam }
}

/** Avisa o servidor que esta voz terminou (o resumo não espera mais trechos dela). */
export function avisarFimDaVoz(reservaId: string, ultimoSeq: number): void {
  const url = `/api/monitorias/reservas/${reservaId}/resumo/fim`
  const corpo = JSON.stringify({ ultimoSeq })
  try {
    void fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: corpo, keepalive: true, cache: 'no-store' }).catch(() => {})
  } catch {
    /* a espera do servidor (2 h) cobre */
  }
}

// ─── O gravador ─────────────────────────────────────────────────────────

export class GravadorDeVoz {
  private db: IDBDatabase | null = null
  private trilha: MediaStreamTrack | null = null
  private medidor: { ler: () => number; parar: () => void } | null = null
  private recorder: MediaRecorder | null = null
  private relogio: ReturnType<typeof setInterval> | null = null
  private reenvio: ReturnType<typeof setTimeout> | null = null
  private mime: string | null = escolherMime()
  private seq: number
  private trecho: TrechoLocal | null = null
  private ativoDesde = 0
  private ultimaFala = 0
  private gravandoAgora = false
  private enviando = false
  private destruido = false
  private estado: EstadoDoGravador = { falando: false, pausado: false, pendentes: 0, enviados: 0, erro: null }
  private salvar: Promise<unknown> = Promise.resolve()
  /** Resolve quando o MediaRecorder atual entrega o último pedaço (onstop). */
  private parada: Promise<void> = Promise.resolve()
  private aoParar: (() => void) | null = null

  constructor(
    private readonly reservaId: string,
    proximoSeq: number,
    private readonly aoMudar: (e: EstadoDoGravador) => void = () => {},
  ) {
    this.seq = proximoSeq
    void this.iniciar()
  }

  private async iniciar(): Promise<void> {
    this.db = await abrirBanco()
    // Trechos que ficaram no aparelho (aba que caiu): fecha e continua a numeração depois deles.
    const locais = await trechosDaReserva(this.db, this.reservaId)
    for (const t of locais) {
      if (!t.fechado) await tx(this.db, 'readwrite', (s) => void s.put({ ...t, fechado: true }))
      this.seq = Math.max(this.seq, t.seq + 1)
    }
    if (!this.mime) this.mudar({ erro: 'Este navegador não grava áudio: sua voz não entra no resumo.' })
    this.relogio = setInterval(() => this.vigiar(), 100)
    void this.enviar()
  }

  private mudar(p: Partial<EstadoDoGravador>): void {
    this.estado = { ...this.estado, ...p }
    this.aoMudar(this.estado)
  }

  /** A trilha crua do microfone (troca de aparelho → fecha o trecho e segue com a nova). */
  definirTrilha(trilha: MediaStreamTrack | null): void {
    if (trilha === this.trilha) return
    this.fecharTrecho()
    this.medidor?.parar()
    this.medidor = null
    this.trilha = trilha
    if (trilha && trilha.readyState === 'live') this.medidor = criarMedidor(trilha)
  }

  /** "Pausar a transcrição da minha voz" (privacidade da própria pessoa). */
  pausar(sim: boolean): void {
    if (sim) this.fecharTrecho()
    this.mudar({ pausado: sim, falando: false })
  }

  private vigiar(): void {
    if (this.destruido || !this.mime) return
    const agora = Date.now()
    const nivel = this.medidor && this.trilha?.enabled && this.trilha.readyState === 'live' ? this.medidor.ler() : 0
    const fala = !this.estado.pausado && nivel >= LIMIAR_DE_FALA
    if (fala) this.ultimaFala = agora
    const deveGravar = !this.estado.pausado && !!this.trilha && agora - this.ultimaFala < SEGURA_APOS_FALA_MS
    if (deveGravar && !this.gravandoAgora) this.retomar(agora)
    else if (!deveGravar && this.gravandoAgora) this.pausarGravacao(agora)
    if (this.gravandoAgora && this.trecho && this.trecho.duracaoAudioMs + (agora - this.ativoDesde) >= FALA_MAX_POR_TRECHO_MS) this.fecharTrecho()
    if (this.estado.falando !== this.gravandoAgora) this.mudar({ falando: this.gravandoAgora })
  }

  private retomar(agora: number): void {
    if (!this.trilha || !this.mime) return
    if (!this.recorder || this.recorder.state === 'inactive') {
      try {
        const rec = new MediaRecorder(new MediaStream([this.trilha]), { mimeType: this.mime, audioBitsPerSecond: BITS_POR_SEGUNDO })
        this.trecho = {
          chave: chaveDe(this.reservaId, this.seq),
          reservaId: this.reservaId,
          seq: this.seq,
          partes: [],
          mime: this.mime,
          inicio: new Date(agora).toISOString(),
          marcas: [[0, 0]],
          duracaoAudioMs: 0,
          duracaoRealMs: 0,
          fechado: false,
          criadoEm: agora,
        }
        const trecho = this.trecho
        this.parada = new Promise<void>((resolve) => (this.aoParar = resolve))
        const terminou = this.aoParar
        rec.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) {
            trecho.partes.push(ev.data)
            this.guardar(trecho)
          }
        }
        rec.onstop = () => {
          trecho.fechado = true
          if (trecho.duracaoAudioMs < FALA_MIN_POR_TRECHO_MS || trecho.partes.length === 0) {
            this.salvar = this.salvar.then(() => apagarSeForOMesmo(this.db, trecho.chave, trecho.criadoEm))
          } else {
            this.guardar(trecho)
            void this.salvar.then(() => this.enviar())
          }
          terminou?.()
        }
        rec.start(FATIA_MS)
        this.recorder = rec
        this.seq++
      } catch {
        this.mudar({ erro: 'Não deu para gravar o microfone: sua voz não entra no resumo agora.' })
        return
      }
    } else if (this.recorder.state === 'paused') {
      try {
        this.recorder.resume()
      } catch {
        return
      }
      if (this.trecho) this.trecho.marcas.push([Math.round(this.trecho.duracaoAudioMs), agora - new Date(this.trecho.inicio).getTime()])
    }
    this.ativoDesde = agora
    this.gravandoAgora = true
  }

  private pausarGravacao(agora: number): void {
    if (this.recorder?.state === 'recording') {
      try {
        this.recorder.pause()
      } catch {
        /* segue */
      }
    }
    if (this.trecho) {
      this.trecho.duracaoAudioMs += agora - this.ativoDesde
      this.trecho.duracaoRealMs = agora - new Date(this.trecho.inicio).getTime()
      this.guardar(this.trecho)
    }
    this.gravandoAgora = false
  }

  /** Fecha o trecho atual (o próximo começa na próxima fala). */
  private fecharTrecho(): void {
    const agora = Date.now()
    if (this.gravandoAgora) this.pausarGravacao(agora)
    if (this.trecho) this.trecho.duracaoRealMs = agora - new Date(this.trecho.inicio).getTime()
    const rec = this.recorder
    this.recorder = null
    // Trecho curto demais é descartado e o número volta a ser usado.
    if (this.trecho && this.trecho.duracaoAudioMs < FALA_MIN_POR_TRECHO_MS) this.seq = this.trecho.seq
    this.trecho = null
    if (rec && rec.state !== 'inactive') {
      try {
        rec.stop()
      } catch {
        /* segue */
      }
    }
  }

  private guardar(t: TrechoLocal): void {
    const copia = { ...t, partes: [...t.partes], marcas: [...t.marcas] }
    this.salvar = this.salvar.then(() => tx(this.db, 'readwrite', (s) => void s.put(copia)))
  }

  private async enviar(): Promise<void> {
    if (this.enviando || this.destruido) return
    this.enviando = true
    try {
      const r = await enviarPendentes(this.reservaId, () => this.mudar({ enviados: this.estado.enviados + 1 }))
      this.mudar({ pendentes: r.restam })
      if (r.restam > 0 && !this.destruido) {
        if (this.reenvio) clearTimeout(this.reenvio)
        this.reenvio = setTimeout(() => void this.enviar(), 60_000)
      }
    } finally {
      this.enviando = false
    }
  }

  /**
   * Fim da aula para esta pessoa: fecha o trecho, avisa o servidor do último
   * número e manda o que der enquanto a página existir (o resto vai na próxima
   * abertura da sala ou da reserva).
   */
  encerrar(): void {
    if (this.destruido) return
    this.fecharTrecho()
    const ultimo = this.seq - 1
    this.destruido = true
    if (this.relogio) clearInterval(this.relogio)
    if (this.reenvio) clearTimeout(this.reenvio)
    this.medidor?.parar()
    this.medidor = null
    avisarFimDaVoz(this.reservaId, ultimo)
    // O stop do MediaRecorder entrega o último pedaço de forma assíncrona: espera (até 2 s) ele cair no banco.
    const limite = new Promise<void>((r) => setTimeout(r, 2_000))
    void Promise.race([this.parada, limite])
      .then(() => this.salvar)
      .then(() => enviarPendentes(this.reservaId))
      .catch(() => null)
      .finally(() => this.db?.close())
  }
}
