'use client'

/**
 * Um par: a conexão P2P com UMA outra pessoa da sala.
 *
 * ## Escolhas que poupam sinalização (e, portanto, invocações)
 *
 * - **Três transceptores fixos desde a primeira oferta** (áudio, câmera, tela).
 *   Ligar e desligar a câmera, trocar de aparelho e compartilhar a tela são só
 *   `replaceTrack`: nenhuma renegociação, nenhuma mensagem nova.
 * - **Quem ofertou continua ofertando** (inclusive nos reinícios de ICE). O outro
 *   lado só pede. Sem ofertas cruzadas, sem rollback.
 * - **Oferta e resposta com os candidatos dentro**: espera a coleta terminar (no
 *   máximo 1,5 s) e manda tudo junto. Os atrasados saem em lote a cada 500 ms.
 * - **Depois de conectado, o canal P2P (`controle`) carrega o que sobrar**:
 *   estado de microfone/câmera, chat, "tchau" e até uma oferta de reinício, se o
 *   transporte ainda estiver vivo. O servidor só entra quando o canal caiu.
 */

import { candidatoLimpo, lerMensagemDoCanal, type CandidatoIce, type MensagemDoCanal, type TipoDeSinal } from '../mensagens'
import { PAR_NOVO, transicaoDoPar, type AcaoDoPar, type EstadoDoPar, type EventoDoPar } from '../maquina'
import {
  classificarAmostra,
  ACOMODACAO_MS,
  AQUECIMENTO_MS,
  ESPERA_ANTES_DE_REINICIAR_MS,
  nivelDeVideo,
  PRAZO_COLETA_ICE_MS,
  PRAZO_NEGOCIACAO_MS,
  proximaQualidade,
  rotuloDeConexao,
  type Amostra,
  type EstadoDeQualidade,
  type NiveisDeVideo,
} from '../regras'
import type { PapelNaSala } from '../../tipos'
import { aplicarAudio, aplicarNivelDeVideo, aplicarTela, lerEstatisticas, type LeituraDoPar } from './qualidade'

/** O que o painel "Estatísticas da conexão" mostra deste par (tudo do `getStats`, sem rede). */
export interface EstatisticasDoPar {
  tipo: 'direta' | 'retransmitida' | null
  rttMs: number | null
  perdaPct: number | null
  nivel: number
  envio: { fps: number | null; largura: number | null; altura: number | null; kbps: number | null } | null
  recebimento: { fps: number | null; largura: number | null; altura: number | null; kbps: number | null } | null
  motivoDoLimite: LeituraDoPar['motivoDoLimite']
}

export interface TrilhasLocais {
  audio: MediaStreamTrack | null
  cam: MediaStreamTrack | null
  tela: MediaStreamTrack | null
}

export interface OpcoesDoPar {
  pid: string
  /** Conexão (aba) do outro quando o par nasceu: sinal de outra conexão é descartado. */
  cx: string
  ofertante: boolean
  /** Instância do RTCPeerConnection de quem oferta; muda quando o par é reconstruído. */
  geracao: string
  iceServers: RTCIceServer[]
  perfil: 'individual' | 'grupo'
  /** Tetos e degraus do vídeo, da config do admin. */
  niveis: NiveisDeVideo
  papelLocal: PapelNaSala
  /** Manda pelo servidor (quando o canal P2P não serve). */
  pelaRede: (tipo: TipoDeSinal, dados: Record<string, unknown>) => Promise<void>
  aoMudar: () => void
  aoMensagem: (m: MensagemDoCanal) => void
  aoReconstruir: () => void
  aoCanalAberto: () => void
  /** Par reconstruído herda as tentativas do anterior: a reconstrução acontece uma vez só. */
  estadoInicial?: EstadoDoPar
}

const MENSAGENS_POR_SEGUNDO = 50

export function novaGeracao(): string {
  return Math.random().toString(36).slice(2, 10)
}

export class Par {
  readonly pid: string
  readonly cx: string
  readonly ofertante: boolean
  readonly geracao: string
  readonly pc: RTCPeerConnection
  readonly canal: RTCDataChannel
  /** Áudio + câmera do outro. */
  readonly cameraRemota: MediaStream
  readonly telaRemota: MediaStream
  estado: EstadoDoPar = PAR_NOVO
  remoto = { mic: true, cam: true, tela: false, videoPausado: false, mao: false }
  /** Quando o outro levantou a mão (ordem da fila de quem quer falar). */
  maoDesde = 0
  qualidade: EstadoDeQualidade = { nivel: 0, ruins: 0, boas: 0 }
  ultimaAmostra: Amostra = 'neutra'
  /** Vezes que as trilhas remotas mudaram (a tela reatribui o `srcObject`). */
  versaoDasTrilhas = 0
  estatisticas: EstatisticasDoPar | null = null
  private bytesAnteriores: { em: number; envio: number; recebimento: number } | null = null

  private readonly o: OpcoesDoPar
  private tx: { audio?: RTCRtpTransceiver; cam?: RTCRtpTransceiver; tela?: RTCRtpTransceiver } = {}
  private trilhas: TrilhasLocais = { audio: null, cam: null, tela: null }
  private contador = 0
  neg = ''
  private descricaoEnviada = false
  private paraEnviar: CandidatoIce[] = []
  private recebidos: Array<{ c: CandidatoIce; neg: string }> = []
  private timers: { espera?: ReturnType<typeof setTimeout>; prazo?: ReturnType<typeof setTimeout>; lote?: ReturnType<typeof setTimeout> } = {}
  private ultimoPedido = 0
  private videoPausado = false
  private outroNaoQuerVideo = false
  private fechado = false
  private janelaDeMensagens = { n: 0, ate: 0 }
  private conectadoEm = 0
  private nivelMudouEm = 0

  constructor(o: OpcoesDoPar, trilhas: TrilhasLocais) {
    this.o = o
    this.pid = o.pid
    this.cx = o.cx
    this.ofertante = o.ofertante
    this.geracao = o.geracao
    this.trilhas = trilhas
    if (o.estadoInicial) this.estado = o.estadoInicial
    this.cameraRemota = new MediaStream()
    this.telaRemota = new MediaStream()
    this.pc = new RTCPeerConnection({ iceServers: o.iceServers, bundlePolicy: 'max-bundle', rtcpMuxPolicy: 'require', iceCandidatePoolSize: 0 })
    // Canal negociado (id fixo): os dois lados o criam, ninguém espera `ondatachannel`.
    this.canal = this.pc.createDataChannel('controle', { negotiated: true, id: 0, ordered: true })
    if (o.ofertante) {
      this.tx.audio = this.pc.addTransceiver('audio', { direction: 'sendrecv' })
      this.tx.cam = this.pc.addTransceiver('video', { direction: 'sendrecv' })
      this.tx.tela = this.pc.addTransceiver('video', { direction: 'sendrecv' })
      this.aplicarTrilhas()
    }
    this.ligarEventos()
  }

  // ─── Eventos do navegador → máquina de estados ─────────────────────

  private ligarEventos(): void {
    this.pc.onicecandidate = (ev) => {
      if (!ev.candidate || !ev.candidate.candidate || !this.descricaoEnviada) return
      this.paraEnviar.push(candidatoLimpo(ev.candidate))
      if (!this.timers.lote) this.timers.lote = setTimeout(() => this.enviarLote(), 500)
    }
    this.pc.oniceconnectionstatechange = () => {
      const s = this.pc.iceConnectionState
      if (s === 'connected' || s === 'completed') {
        clearTimeout(this.timers.prazo)
        clearTimeout(this.timers.espera)
        if (this.estado.fase !== 'conectado') {
          this.conectadoEm = Date.now()
          // Antes da negociação o `sender` não tem codificação e recusa o teto
          // (era assim que o lado que responde ficava sem limite nenhum): aplica agora.
          void this.aplicarQualidade()
        }
        this.transicao({ tipo: 'conectou' })
      } else if (s === 'disconnected') {
        this.transicao({ tipo: 'oscilou' })
      } else if (s === 'failed') {
        this.transicao({ tipo: 'falhou' })
      }
    }
    this.pc.ontrack = (ev) => {
      // A posição do transceptor diz o que é: 0 áudio, 1 câmera, 2 tela (igual nos dois lados).
      const indice = this.pc.getTransceivers().indexOf(ev.transceiver)
      const destino = indice === 2 ? this.telaRemota : this.cameraRemota
      if (!destino.getTracks().includes(ev.track)) destino.addTrack(ev.track)
      ev.track.onmute = ev.track.onunmute = () => {
        this.versaoDasTrilhas++
        this.o.aoMudar()
      }
      this.versaoDasTrilhas++
      this.o.aoMudar()
    }
    this.canal.onopen = () => {
      this.o.aoCanalAberto()
      this.o.aoMudar()
    }
    this.canal.onclose = () => this.o.aoMudar()
    this.canal.onmessage = (ev) => this.aoMensagemDoCanal(ev.data)
  }

  private transicao(ev: EventoDoPar): void {
    if (this.fechado) return
    const antes = this.estado.fase
    const { estado, acao } = transicaoDoPar(this.estado, ev, Date.now())
    this.estado = estado
    this.executar(acao)
    if (estado.fase !== antes) this.o.aoMudar()
  }

  private executar(acao: AcaoDoPar): void {
    switch (acao) {
      case 'agendar_espera':
        clearTimeout(this.timers.espera)
        this.timers.espera = setTimeout(() => this.transicao({ tipo: 'espera_venceu' }), ESPERA_ANTES_DE_REINICIAR_MS)
        return
      case 'reiniciar_ice':
        if (this.ofertante) void this.ofertar(true)
        else this.pedirReinicio()
        return
      case 'reconstruir':
        if (this.ofertante) this.o.aoReconstruir()
        else this.pedirReinicio()
        return
      case 'desistir':
        clearTimeout(this.timers.prazo)
        clearTimeout(this.timers.espera)
        return
      default:
        return
    }
  }

  private armarPrazo(): void {
    clearTimeout(this.timers.prazo)
    this.timers.prazo = setTimeout(() => {
      const s = this.pc.iceConnectionState
      if (s !== 'connected' && s !== 'completed') this.transicao({ tipo: 'negociacao_expirou' })
    }, PRAZO_NEGOCIACAO_MS)
  }

  // ─── Negociação ─────────────────────────────────────────────────────

  private esperarColeta(): Promise<void> {
    if (this.pc.iceGatheringState === 'complete') return Promise.resolve()
    return new Promise((resolver) => {
      const fim = () => {
        clearTimeout(t)
        this.pc.removeEventListener('icegatheringstatechange', ver)
        resolver()
      }
      const ver = () => {
        if (this.pc.iceGatheringState === 'complete') fim()
      }
      const t = setTimeout(fim, PRAZO_COLETA_ICE_MS)
      this.pc.addEventListener('icegatheringstatechange', ver)
    })
  }

  /** O canal serve para sinal só com o transporte de pé. */
  private canalUtil(): boolean {
    const s = this.pc.iceConnectionState
    return this.canal.readyState === 'open' && (s === 'connected' || s === 'completed')
  }

  private async enviar(tipo: TipoDeSinal, dados: Record<string, unknown>): Promise<void> {
    if (this.canalUtil()) {
      const m: MensagemDoCanal =
        tipo === 'oferta' || tipo === 'resposta'
          ? { t: 'sdp', tipo: tipo === 'oferta' ? 'offer' : 'answer', sdp: String(dados.sdp), neg: String(dados.neg) }
          : tipo === 'candidatos'
            ? { t: 'ice', lista: dados.lista as CandidatoIce[], neg: String(dados.neg) }
            : { t: 'reiniciar' }
      if (this.enviarPeloCanal(m)) return
    }
    await this.o.pelaRede(tipo, dados)
  }

  private enviarLote(): void {
    this.timers.lote = undefined
    if (!this.paraEnviar.length || this.fechado) return
    const lista = this.paraEnviar.splice(0, 30)
    void this.enviar('candidatos', { lista, neg: this.neg }).catch(() => {})
    if (this.paraEnviar.length) this.timers.lote = setTimeout(() => this.enviarLote(), 500)
  }

  async ofertar(reiniciar = false): Promise<void> {
    if (!this.ofertante || this.fechado) return
    if (this.pc.signalingState !== 'stable') {
      if (!reiniciar) return
      try {
        await this.pc.setLocalDescription({ type: 'rollback' })
      } catch {
        /* nada pendente */
      }
    }
    this.neg = `${this.geracao}.${++this.contador}`
    this.descricaoEnviada = false
    this.paraEnviar = []
    this.transicao({ tipo: 'negociacao_iniciada' })
    try {
      await this.pc.setLocalDescription(await this.pc.createOffer(reiniciar ? { iceRestart: true } : undefined))
      await this.esperarColeta()
      if (this.fechado || !this.pc.localDescription) return
      const sdp = this.pc.localDescription.sdp
      this.descricaoEnviada = true
      await this.enviar('oferta', { sdp, neg: this.neg })
    } catch (err) {
      console.warn('[sala] oferta falhou', err)
    }
    this.armarPrazo()
  }

  async receberOferta(sdp: string, neg: string): Promise<void> {
    if (this.ofertante || this.fechado) return
    this.neg = neg
    this.descricaoEnviada = false
    this.paraEnviar = []
    this.transicao({ tipo: 'negociacao_iniciada' })
    try {
      await this.pc.setRemoteDescription({ type: 'offer', sdp })
      if (!this.tx.audio) this.atribuirTransceptores()
      await this.drenarCandidatos()
      await this.pc.setLocalDescription(await this.pc.createAnswer())
      void this.aplicarQualidade()
      await this.esperarColeta()
      if (this.fechado || !this.pc.localDescription) return
      const resposta = this.pc.localDescription.sdp
      this.descricaoEnviada = true
      await this.enviar('resposta', { sdp: resposta, neg })
      this.armarPrazo()
    } catch (err) {
      console.warn('[sala] resposta falhou', err)
      this.transicao({ tipo: 'falhou' })
    }
  }

  async receberResposta(sdp: string, neg: string): Promise<void> {
    if (!this.ofertante || this.fechado || neg !== this.neg || this.pc.signalingState !== 'have-local-offer') return
    try {
      await this.pc.setRemoteDescription({ type: 'answer', sdp })
      await this.drenarCandidatos()
    } catch (err) {
      console.warn('[sala] resposta remota recusada', err)
    }
  }

  receberCandidatos(lista: CandidatoIce[], neg: string): void {
    if (this.fechado) return
    for (const c of lista) {
      if (neg !== this.neg || !this.pc.remoteDescription) this.recebidos.push({ c, neg })
      else void this.pc.addIceCandidate(c).catch(() => {})
    }
    if (this.recebidos.length > 120) this.recebidos.splice(0, this.recebidos.length - 120)
  }

  private async drenarCandidatos(): Promise<void> {
    const deAgora = this.recebidos.filter((x) => x.neg === this.neg)
    this.recebidos = []
    for (const { c } of deAgora) await this.pc.addIceCandidate(c).catch(() => {})
  }

  /** Quem responde não oferta: pede ao outro (no máximo a cada 5 s). */
  pedirReinicio(): void {
    const agora = Date.now()
    if (agora - this.ultimoPedido < 5_000) return
    this.ultimoPedido = agora
    this.armarPrazo()
    void this.enviar('reiniciar', { neg: this.neg }).catch(() => {})
  }

  /** O outro lado pediu um reinício. */
  receberPedidoDeReinicio(): void {
    if (!this.ofertante || this.fechado) return
    const f = this.estado.fase
    if (f === 'reiniciando' || f === 'negociando') return
    if (f === 'perdido') return this.o.aoReconstruir()
    if (f === 'instavel') return this.transicao({ tipo: 'espera_venceu' })
    this.transicao({ tipo: 'falhou' })
  }

  /** "Tentar de novo" na tela, para um par que desistiu. */
  tentarDeNovo(): void {
    if (this.ofertante) this.o.aoReconstruir()
    else {
      this.ultimoPedido = 0
      this.pedirReinicio()
    }
  }

  private atribuirTransceptores(): void {
    const ts = this.pc.getTransceivers()
    const audio = ts.find((t) => t.receiver.track.kind === 'audio')
    const videos = ts.filter((t) => t.receiver.track.kind === 'video')
    this.tx = { audio, cam: videos[0], tela: videos[1] }
    for (const t of [audio, ...videos]) if (t) t.direction = 'sendrecv'
    this.aplicarTrilhas()
  }

  // ─── Canal P2P ──────────────────────────────────────────────────────

  enviarPeloCanal(m: MensagemDoCanal): boolean {
    if (this.canal.readyState !== 'open') return false
    try {
      this.canal.send(JSON.stringify(m))
      return true
    } catch {
      return false
    }
  }

  get canalAberto(): boolean {
    return this.canal.readyState === 'open'
  }

  private aoMensagemDoCanal(bruto: unknown): void {
    const agora = Date.now()
    if (this.janelaDeMensagens.ate < agora) this.janelaDeMensagens = { n: 0, ate: agora + 1_000 }
    if (++this.janelaDeMensagens.n > MENSAGENS_POR_SEGUNDO) return
    const m = lerMensagemDoCanal(bruto)
    if (!m) return
    switch (m.t) {
      case 'sdp':
        // Pelo canal só vem reinício da MESMA instância; reconstrução vai pelo servidor.
        if (m.neg.split('.')[0] !== this.geracao) return
        if (m.tipo === 'offer') void this.receberOferta(m.sdp, m.neg)
        else void this.receberResposta(m.sdp, m.neg)
        return
      case 'ice':
        return this.receberCandidatos(m.lista, m.neg)
      case 'reiniciar':
        return this.receberPedidoDeReinicio()
      case 'estado':
        if (m.mao && !this.remoto.mao) this.maoDesde = Date.now()
        this.remoto = { mic: m.mic, cam: m.cam, tela: m.tela, videoPausado: m.videoPausado, mao: m.mao }
        this.o.aoMudar()
        return
      case 'video':
        this.outroNaoQuerVideo = !m.receber
        void this.aplicarQualidade()
        return
      default:
        this.o.aoMensagem(m)
    }
  }

  // ─── Trilhas e qualidade ────────────────────────────────────────────

  definirTrilhas(t: TrilhasLocais): void {
    this.trilhas = t
    this.aplicarTrilhas()
  }

  private aplicarTrilhas(): void {
    if (!this.tx.audio) return
    const camera = this.videoPausado ? null : this.trilhas.cam
    void this.tx.audio.sender.replaceTrack(this.trilhas.audio).catch(() => {})
    void this.tx.cam?.sender.replaceTrack(camera).catch(() => {})
    void this.tx.tela?.sender.replaceTrack(this.trilhas.tela).catch(() => {})
    void this.aplicarQualidade()
  }

  /** O vídeo que vai para ESTE par: nível da rede, tela e economia de dados do outro. */
  async aplicarQualidade(): Promise<void> {
    if (!this.tx.audio) return
    const nivel = nivelDeVideo(this.o.perfil, this.qualidade.nivel, this.o.papelLocal, this.o.niveis)
    const pausar = nivel === null || this.outroNaoQuerVideo
    if (pausar !== this.videoPausado) {
      this.videoPausado = pausar
      void this.tx.cam?.sender.replaceTrack(pausar ? null : this.trilhas.cam).catch(() => {})
      this.o.aoMudar()
    }
    const tela = !!this.trilhas.tela
    await aplicarAudio(this.tx.audio.sender)
    if (tela) {
      const tela = this.o.niveis.tela[this.o.perfil]
      await aplicarTela(this.tx.tela?.sender, tela.maxBitrate, tela.maxFramerate)
      await aplicarNivelDeVideo(this.tx.cam?.sender, this.o.niveis.cameraDuranteTela)
    } else if (nivel) {
      await aplicarNivelDeVideo(this.tx.cam?.sender, nivel)
    }
  }

  get pausouVideoPelaRede(): boolean {
    return this.videoPausado && !this.outroNaoQuerVideo
  }

  /** Uma amostra (a cada 2 s): ajusta o nível e devolve a leitura para o consumo. */
  async amostrar(): Promise<LeituraDoPar | null> {
    if (this.fechado || this.estado.fase !== 'conectado') return null
    const l = await lerEstatisticas(this.pc, this.tx.cam?.mid)
    this.guardarEstatisticas(l)
    const nivel = nivelDeVideo(this.o.perfil, this.qualidade.nivel, this.o.papelLocal, this.o.niveis)
    const agora = Date.now()
    // Adaptação desligada pelo admin: mede (para as estatísticas), mas não muda o nível.
    const acomodando = !this.o.niveis.adaptativo || agora - this.conectadoEm < AQUECIMENTO_MS || agora - this.nivelMudouEm < ACOMODACAO_MS
    this.ultimaAmostra = acomodando ? 'neutra' : classificarAmostra({ ...l, alvoBitrate: nivel?.maxBitrate ?? 100_000 })
    const novo = proximaQualidade(this.qualidade, this.ultimaAmostra, 3)
    const mudou = novo.nivel !== this.qualidade.nivel
    this.qualidade = novo
    if (mudou) {
      this.nivelMudouEm = agora
      await this.aplicarQualidade()
      this.o.aoMudar()
    }
    return l
  }

  private guardarEstatisticas(l: LeituraDoPar): void {
    const em = Date.now()
    const antes = this.bytesAnteriores
    const segundos = antes ? (em - antes.em) / 1000 : 0
    const kbps = (agora: number | undefined, anterior: number | undefined) =>
      agora === undefined || anterior === undefined || segundos <= 0 || agora < anterior ? null : Math.round(((agora - anterior) * 8) / segundos / 1000)
    const video = (v: LeituraDoPar['envio'], anterior: number | undefined) => (v ? { fps: v.fps, largura: v.largura, altura: v.altura, kbps: kbps(v.bytes, anterior) } : null)
    this.estatisticas = {
      tipo: l.tipo,
      rttMs: l.rttMs === null ? null : Math.round(l.rttMs),
      perdaPct: l.perda === null ? null : Math.round(l.perda * 1000) / 10,
      nivel: this.qualidade.nivel,
      envio: video(l.envio, antes?.envio),
      recebimento: video(l.recebimento, antes?.recebimento),
      motivoDoLimite: l.motivoDoLimite,
    }
    this.bytesAnteriores = { em, envio: l.envio?.bytes ?? 0, recebimento: l.recebimento?.bytes ?? 0 }
  }

  get rotulo(): 'boa' | 'instavel' | 'fraca' {
    return rotuloDeConexao(this.ultimaAmostra, this.qualidade.nivel)
  }

  /** Nível de áudio do outro (0 a 1) para o indicador de quem fala. Sem custo de rede. */
  nivelDeAudio(): number {
    try {
      const fontes = this.tx.audio?.receiver.getSynchronizationSources?.() || []
      return fontes[0]?.audioLevel ?? 0
    } catch {
      return 0
    }
  }

  fechar(): void {
    if (this.fechado) return
    this.fechado = true
    clearTimeout(this.timers.espera)
    clearTimeout(this.timers.prazo)
    clearTimeout(this.timers.lote)
    this.pc.onicecandidate = this.pc.oniceconnectionstatechange = this.pc.ontrack = null
    this.canal.onopen = this.canal.onclose = this.canal.onmessage = null
    try {
      this.canal.close()
    } catch {
      /* já fechado */
    }
    try {
      this.pc.close()
    } catch {
      /* já fechado */
    }
    // As trilhas locais são da sala (vão para todos os pares): quem as para é o controlador.
    for (const t of [...this.cameraRemota.getTracks(), ...this.telaRemota.getTracks()]) t.stop()
  }
}
