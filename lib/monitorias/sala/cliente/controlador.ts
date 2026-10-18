'use client'

/**
 * O controlador da sala: uma instância por tela aberta, fora do React.
 *
 * Ele é dono de tudo que precisa ser desligado: trilhas de câmera, microfone e
 * tela, conexões P2P, temporizadores, ouvintes de janela, Wake Lock e o canal
 * entre abas. `destruir()` (e qualquer saída) desliga TUDO — a luz da câmera
 * apaga e nenhuma requisição sai depois.
 *
 * ## Quando ele fala com o servidor
 *
 * Só nestes casos, com a cadência de `cadenciaDaSala` (regras.ts):
 *  - esperando alguém chegar (3 s → 10 s, para depois de 45 min);
 *  - negociando (1 s por poucos segundos);
 *  - reconectando um par cujo canal P2P caiu (recuo até 8 s);
 *  - pulso de presença de 30 s com a aula andando (304 quase sempre);
 *  - renovação do token a cada ~10 min (reconfere a autorização);
 *  - mensagem de chat (gravada no chat da reserva; entregue ao vivo pelo P2P).
 */

import { faseDeSinal, podeIrPara, type FaseDaSala, type FaseDoPar, type MotivoDeSaida } from '../maquina'
import { AVISO_FECHAMENTO_MIN, cadenciaDaSala, devoFecharOPar, niveisDaConfig, NIVEIS_PADRAO, RENOVAR_ANTES_MS, type FaseDeSinal, type NiveisDeVideo } from '../regras'
import { detectarContato } from '../../contato-inteligente'
import { aplicarAnotacao, INTERVALO_DE_REACAO_MS, podeAnotar, type MensagemDeAnotacao, type Reacao, type Traco } from '../tela-anotada'
import type { CredenciaisDaSala, MensagemDoCanal, PedidoDoMonitor, RespostaDoSinal, RetratoDaSala, SinalRecebido, TipoDeSinal, UsoDaConexao } from '../mensagens'
import type { PapelNaSala } from '../../tipos'
import type { EstadoDoResumoNaSala } from '../../resumo/tipos'
import { GravadorDeVoz, gravacaoSuportada, type EstadoDoGravador } from './gravador'
import { novaGeracao, Par, type EstatisticasDoPar, type TrilhasLocais } from './par'
import {
  capturar,
  capturarTela,
  definirCaptura,
  guardarPreferencias,
  lerPreferencias,
  listarAparelhos,
  pararTrilha,
  podeCompartilharTela,
  restricaoDeTamanho,
  suporteDoNavegador,
  type Aparelhos,
  type EstadoDoAparelho,
  type PreferenciasDeAparelho,
} from './midia'
import {
  aplicarDesfoqueNativo,
  guardarEfeitos,
  lerEfeitos,
  precisaProcessarVideo,
  ProcessadorDeAudio,
  ProcessadorDeVideo,
  suportaDesfoqueNativo,
  suportaEfeitosDeVideo,
  suportaEfeitosDeVoz,
  type EfeitoDeVideo,
  type EfeitoDeVoz,
} from './efeitos'

export interface ParticipanteNaTela {
  pid: string
  nome: string
  /** Foto do perfil (a mesma do /profile), para o quadro com a câmera desligada. */
  foto: string | null
  papel: PapelNaSala
  /** `aguardando` = está na sala, mas a conexão com ele ainda não começou. */
  fase: FaseDoPar | 'aguardando'
  camera: MediaStream | null
  tela: MediaStream | null
  versaoDasTrilhas: number
  mic: boolean
  cam: boolean
  compartilhando: boolean
  /** O vídeo dele parou por causa da rede (o áudio segue). */
  videoPausado: boolean
  conexao: 'boa' | 'instavel' | 'fraca'
  falando: boolean
  /** Mão levantada (e desde quando, para a fila de quem quer falar). */
  mao: boolean
  maoDesde: number
  /** Números do `getStats` (painel "Estatísticas da conexão"). */
  estatisticas: EstatisticasDoPar | null
}

export interface MensagemDeChat {
  id: string
  minha: boolean
  nome: string
  texto: string
  em: string
}

export interface EstadoDaSalaNaTela {
  fase: FaseDaSala
  semSuporte: 'inseguro' | 'webrtc' | 'midia' | null
  saida: { motivo: MotivoDeSaida; mensagem: string } | null
  erroAoEntrar: string | null
  abreEm: string | null
  eu: { pid: string; papel: PapelNaSala; nome: string; foto: string | null } | null
  local: {
    /** Microfone cru (medidor de voz, "falando"). */
    audio: MediaStreamTrack | null
    /** O que os outros ouvem: com o efeito de voz, se houver. */
    audioComEfeito: MediaStreamTrack | null
    /** O que os outros veem: com o efeito de câmera, se houver. */
    camera: MediaStream | null
    tela: MediaStream | null
    mic: EstadoDoAparelho
    cam: EstadoDoAparelho
    versao: number
  }
  /** Efeitos de câmera e de voz (tudo no aparelho). */
  efeitos: {
    video: EfeitoDeVideo
    voz: EfeitoDeVoz
    suportaVideo: boolean
    suportaVoz: boolean
    /** A câmera atual tem fundo desfocado do próprio navegador. */
    desfoque: boolean
    /** O aparelho não está dando conta do efeito (vídeo saindo travado). */
    pesado: boolean
  }
  participantes: ParticipanteNaTela[]
  sinal: FaseDeSinal | null
  semInternet: boolean
  problemaNoServidor: boolean
  ociosa: boolean
  encerrada: boolean
  fechaEm: string | null
  avisoDeFechamento: boolean
  chat: MensagemDeChat[]
  naoLidas: number
  config: CredenciaisDaSala['config'] | null
  aparelhos: Aparelhos
  prefs: PreferenciasDeAparelho
  podeCompartilhar: boolean
  turn: boolean
  /** Outra aba deste navegador já está na sala. */
  outraAba: boolean
  economiaDeDados: boolean
  aviso: string | null
  /** Minha mão levantada. */
  mao: boolean
  /** O que o monitor liberou para os alunos nesta aula. */
  permissoes: RetratoDaSala['permissoes']
  /** Quem foi tirado da sala (só o monitor recebe). */
  removidos: RetratoDaSala['removidos']
  /** O monitor pediu para ligar o microfone ou a câmera (a pessoa decide). */
  pedido: { acao: 'pedir_mic' | 'pedir_camera' } | null
  reserva: CredenciaisDaSala['reserva'] | null
  /** Só o monitor: alunos com assento ativo que ainda não estão na sala. */
  faltam: Array<{ pid: string; nome: string }>
  /** Reações dos últimos segundos (a tela anima e some com elas). `pid` = quem reagiu (o meu é o meu pid). */
  reacoes: Array<{ id: number; pid: string; e: Reacao }>
  /** Traços por cima da tela compartilhada que está no palco. */
  tracos: Traco[]
  /** Quem é o dono da tela no palco (pid), para saber quem pode riscar. */
  donoDaTela: string | null
  /** Resumo por IA desta aula (null = a aula não tem). Todos veem o selo. */
  resumo: EstadoDoResumoNaSala | null
  /** O meu gravador (só quando a minha voz é transcrita e autorizada). */
  gravacao: EstadoDoGravador | null
}

const CANAL_DE_ABAS = 'domineaqui:sala:'
const MAX_CHAT = 200

type Ouvinte = () => void

export class ControladorDaSala {
  private readonly reservaId: string
  private estado: EstadoDaSalaNaTela
  private readonly ouvintes = new Set<Ouvinte>()
  private agendado = false

  // Mídia local
  private audio: MediaStreamTrack | null = null
  private cam: MediaStreamTrack | null = null
  private tela: MediaStreamTrack | null = null
  private cameraLocal: MediaStream | null = null
  private telaLocal: MediaStream | null = null
  private procVideo: ProcessadorDeVideo | null = null
  private procAudio: ProcessadorDeAudio | null = null
  /** Resumo por IA: grava a MINHA voz crua (sem efeito) quando ela é transcrita. */
  private gravador: GravadorDeVoz | null = null
  /** Câmera com o desfoque nativo ligado (para desligar ao trocar de efeito). */
  private desfocada: MediaStreamTrack | null = null
  private amostrasPesadas = 0
  /** Tetos do vídeo: o padrão até entrar; depois, os da config do admin. */
  private niveis: NiveisDeVideo = NIVEIS_PADRAO

  // Sala
  private creds: CredenciaisDaSala | null = null
  private retrato: RetratoDaSala | null = null
  private readonly pares = new Map<string, Par>()
  private desde = 0
  private ultimoProcessado = 0
  private etag: string | null = null
  private falhas = 0
  private faseDoSinal: FaseDeSinal | null = null
  private faseDesde = 0
  private ultimoPulso = 0
  /** Quando a última volta terminou: a próxima conta daqui (atualizações da tela não a adiam). */
  private ultimaPuxada = 0
  private alvoDoSinal = 0
  private puxando = false
  private idsDoChat = new Set<string>()
  private chatAberto = false

  // Consumo (relatado na renovação e na saída)
  private bytesPorPar = new Map<string, number>()
  private uso = { bytesRelay: 0, segundosRelay: 0, segundosDireta: 0 }
  private ultimaAmostra = 0
  /** Desde quando cada par conectado está fora da lista do servidor. */
  private ausentesDesde = new Map<string, number>()
  private esperadosNomes: Array<{ pid: string; nome: string }> = []

  private timers: Partial<Record<'sinal' | 'renovar' | 'stats' | 'fala' | 'aviso' | 'fecha', ReturnType<typeof setTimeout>>> = {}
  private canalAbas: BroadcastChannel | null = null
  private wakeLock: { release: () => Promise<void> } | null = null
  private removerOuvintes: Array<() => void> = []
  private destruido = false
  /** Sobe a cada entrada/saída: resposta atrasada de uma entrada antiga é ignorada. */
  private ciclo = 0

  constructor(reservaId: string) {
    this.reservaId = reservaId
    this.estado = {
      fase: 'verificando',
      semSuporte: null,
      saida: null,
      erroAoEntrar: null,
      abreEm: null,
      eu: null,
      local: { audio: null, audioComEfeito: null, camera: null, tela: null, mic: 'desligado', cam: 'desligado', versao: 0 },
      efeitos: { video: 'nenhum', voz: 'nenhum', suportaVideo: false, suportaVoz: false, desfoque: false, pesado: false },
      participantes: [],
      sinal: null,
      semInternet: false,
      problemaNoServidor: false,
      ociosa: false,
      encerrada: false,
      fechaEm: null,
      avisoDeFechamento: false,
      chat: [],
      naoLidas: 0,
      config: null,
      aparelhos: { cameras: [], microfones: [], saidas: [] },
      prefs: { micId: null, camId: null, saidaId: null, micLigado: true, camLigada: true },
      podeCompartilhar: false,
      turn: false,
      outraAba: false,
      economiaDeDados: false,
      aviso: null,
      mao: false,
      permissoes: { telaAlunos: true, chatAlunos: true },
      removidos: [],
      pedido: null,
      reserva: null,
      faltam: [],
      reacoes: [],
      tracos: [],
      donoDaTela: null,
      resumo: null,
      gravacao: null,
    }
  }

  // ─── Assinatura (useSyncExternalStore) ──────────────────────────────

  obter = (): EstadoDaSalaNaTela => this.estado

  assinar = (fn: Ouvinte): (() => void) => {
    this.ouvintes.add(fn)
    return () => this.ouvintes.delete(fn)
  }

  private definir(parcial: Partial<EstadoDaSalaNaTela>): void {
    this.estado = { ...this.estado, ...parcial }
    this.conferirDonoDaTela()
    this.emitir()
  }

  /** Mudou quem está com a tela no palco (ou ninguém): os traços da tela anterior somem. */
  private conferirDonoDaTela(): void {
    const eu = this.creds?.eu.pid ?? null
    let dono: string | null = this.tela ? eu : null
    if (!dono) for (const [pid, par] of this.pares) if (par.remoto.tela && par.estado.fase === 'conectado') dono = dono ?? pid
    if (dono !== this.estado.donoDaTela) this.estado = { ...this.estado, donoDaTela: dono, tracos: [] }
  }

  // ─── Reações e anotações (pelo canal P2P; nada passa pelo servidor) ──

  private ultimaReacao = new Map<string, number>()
  private idDeReacao = 0

  private mostrarReacao(pid: string, e: Reacao): void {
    const agora = Date.now()
    if (agora - (this.ultimaReacao.get(pid) ?? 0) < INTERVALO_DE_REACAO_MS) return
    this.ultimaReacao.set(pid, agora)
    const id = ++this.idDeReacao
    this.definir({ reacoes: [...this.estado.reacoes.slice(-11), { id, pid, e }] })
    setTimeout(() => {
      if (!this.destruido) this.definir({ reacoes: this.estado.reacoes.filter((r) => r.id !== id) })
    }, 3_200)
  }

  reagir(e: Reacao): void {
    const eu = this.creds?.eu.pid
    if (!eu || Date.now() - (this.ultimaReacao.get(eu) ?? 0) < INTERVALO_DE_REACAO_MS) return
    this.mostrarReacao(eu, e)
    for (const par of this.pares.values()) par.enviarPeloCanal({ t: 'reacao', e })
  }

  /** Eu posso riscar a tela que está no palco? */
  get possoAnotar(): boolean {
    const eu = this.creds?.eu
    return !!eu && !!this.estado.donoDaTela && podeAnotar({ papel: eu.papel, donoDaTela: this.estado.donoDaTela === eu.pid })
  }

  anotar(m: MensagemDeAnotacao): void {
    const eu = this.creds?.eu
    if (!eu || !this.possoAnotar) return
    this.definir({ tracos: aplicarAnotacao(this.estado.tracos, eu.pid, m, true) })
    for (const par of this.pares.values()) par.enviarPeloCanal(m)
  }

  private receberAnotacao(pid: string, m: MensagemDeAnotacao): void {
    const dono = this.estado.donoDaTela
    if (!dono) return
    const papel = this.vemDoMonitor(pid) ? 'monitor' : 'aluno'
    const ehDono = dono === pid
    if (!podeAnotar({ papel, donoDaTela: ehDono })) return
    this.definir({ tracos: aplicarAnotacao(this.estado.tracos, pid, m, papel === 'monitor' || ehDono) })
  }

  /** Nível da voz de alguém (0 a 1), lido do receptor de áudio — local, sem rede. */
  nivelDeAudio(pid: string): number {
    const par = this.pares.get(pid)
    return par && par.remoto.mic ? par.nivelDeAudio() : 0
  }

  /** Junta várias mudanças num quadro só (eventos de ICE chegam em rajadas). */
  private atualizar = (): void => {
    if (this.agendado || this.destruido) return
    this.agendado = true
    queueMicrotask(() => {
      this.agendado = false
      if (this.destruido) return
      this.estado = { ...this.estado, participantes: this.montarParticipantes(), sinal: this.faseDoSinal }
      this.conferirDonoDaTela()
      this.emitir()
      this.reagendarSinal()
    })
  }

  private emitir(): void {
    for (const fn of this.ouvintes) fn()
  }

  private irPara(fase: FaseDaSala, extra: Partial<EstadoDaSalaNaTela> = {}): boolean {
    if (fase !== this.estado.fase && !podeIrPara(this.estado.fase, fase)) return false
    this.definir({ fase, ...extra })
    return true
  }

  // ─── Saguão: suporte e aparelhos ────────────────────────────────────

  async iniciar(): Promise<void> {
    const suporte = suporteDoNavegador()
    if (!suporte.ok) {
      this.irPara('sem_suporte', { semSuporte: suporte.motivo })
      return
    }
    const prefs = lerPreferencias()
    const suportaVideo = suportaEfeitosDeVideo()
    const suportaVoz = suportaEfeitosDeVoz()
    const lembrados = lerEfeitos()
    this.irPara('saguao', {
      prefs,
      podeCompartilhar: podeCompartilharTela(),
      efeitos: {
        ...this.estado.efeitos,
        suportaVideo,
        suportaVoz,
        video: suportaVideo || lembrados.video === 'desfoque' ? lembrados.video : 'nenhum',
        voz: suportaVoz ? lembrados.voz : 'nenhum',
      },
    })
    this.ouvirAbas()
    const aoMudarAparelhos = () => void this.recarregarAparelhos()
    navigator.mediaDevices.addEventListener?.('devicechange', aoMudarAparelhos)
    this.removerOuvintesDeAparelho = () => navigator.mediaDevices.removeEventListener?.('devicechange', aoMudarAparelhos)
    await this.abrirMidia()
  }

  private removerOuvintesDeAparelho: () => void = () => {}

  /**
   * Uma captura de cada vez. Cada pedido ganha um número; resposta que chega
   * depois de outra mais nova (ou depois de sair da tela) é descartada e tem as
   * trilhas paradas — nada de câmera acesa "fantasma".
   */
  private capturaSeq = 0
  get capturando(): boolean {
    return this.estado.local.mic === 'pedindo' || this.estado.local.cam === 'pedindo'
  }

  private novaCaptura(): number {
    return ++this.capturaSeq
  }

  /** A resposta desta captura ainda vale? Se não, para o que ela abriu. */
  private aindaVale(seq: number, ...trilhas: Array<MediaStreamTrack | null>): boolean {
    if (!this.destruido && seq === this.capturaSeq) return true
    for (const t of trilhas) pararTrilha(t)
    return false
  }

  /** Guarda o aparelho que de fato abriu (o id lembrado pode ter mudado). */
  private lembrarAparelhos(): void {
    const micId = this.audio?.getSettings?.().deviceId || this.estado.prefs.micId
    const camId = this.cam?.getSettings?.().deviceId || this.estado.prefs.camId
    if (micId !== this.estado.prefs.micId || camId !== this.estado.prefs.camId) this.guardar({ micId, camId })
  }

  private async abrirMidia(): Promise<void> {
    const seq = this.novaCaptura()
    const p = this.estado.prefs
    pararTrilha(this.audio)
    pararTrilha(this.cam)
    this.audio = this.cam = null
    this.definirLocal({ mic: 'pedindo', cam: p.camLigada ? 'pedindo' : 'desligado' })
    const r = await capturar({ audio: true, video: p.camLigada, micId: p.micId, camId: p.camId })
    if (!this.aindaVale(seq, r.audio, r.video)) return
    this.audio = r.audio
    this.cam = r.video
    if (this.audio) this.audio.enabled = p.micLigado
    this.vigiarTrilha(this.audio, 'mic')
    this.vigiarTrilha(this.cam, 'cam')
    this.definirLocal({
      mic: r.audio ? (p.micLigado ? 'ligado' : 'desligado') : r.estadoAudio,
      cam: r.video ? 'ligado' : p.camLigada ? r.estadoVideo : 'desligado',
    })
    this.lembrarAparelhos()
    this.distribuirTrilhas()
    await this.recarregarAparelhos()
  }

  /** "Tentar de novo" do saguão, depois de permissão negada ou aparelho ocupado. */
  async tentarAparelhosDeNovo(): Promise<void> {
    const { cam, mic } = this.estado.local
    // A página abriu sem permissão (navegação interna): só recarregar resolve.
    if (cam === 'pagina' || mic === 'pagina') return window.location.reload()
    if (cam === 'negado' || cam === 'em_uso' || cam === 'indisponivel' || cam === 'erro') this.guardar({ camLigada: true })
    await this.abrirMidia()
  }

  private vigiarTrilha(t: MediaStreamTrack | null, tipo: 'mic' | 'cam'): void {
    if (!t) return
    t.onended = () => {
      // Aparelho desconectado (fone tirado, câmera USB solta).
      if (tipo === 'mic' && this.audio === t) {
        this.audio = null
        this.definirLocal({ mic: 'indisponivel' })
        this.definir({ aviso: 'O microfone foi desconectado. Escolha outro em Configurações.' })
      }
      if (tipo === 'cam' && this.cam === t) {
        this.cam = null
        this.definirLocal({ cam: 'indisponivel' })
        this.definir({ aviso: 'A câmera foi desconectada.' })
      }
      this.distribuirTrilhas()
    }
  }

  private async recarregarAparelhos(): Promise<void> {
    const aparelhos = await listarAparelhos()
    if (!this.destruido) this.definir({ aparelhos })
  }

  private definirLocal(parcial: Partial<Omit<EstadoDaSalaNaTela['local'], 'camera' | 'tela' | 'versao' | 'audio' | 'audioComEfeito'>>): void {
    this.sincronizarEfeitos()
    // O gravador do resumo segue o microfone cru (troca de aparelho, religar).
    this.gravador?.definirTrilha(this.audio)
    const cam = this.camEnviada()
    if (cam) {
      if (!this.cameraLocal || this.cameraLocal.getVideoTracks()[0] !== cam) this.cameraLocal = new MediaStream([cam])
    } else this.cameraLocal = null
    if (this.tela) {
      if (!this.telaLocal || this.telaLocal.getVideoTracks()[0] !== this.tela) this.telaLocal = new MediaStream([this.tela])
    } else this.telaLocal = null
    this.definir({
      local: {
        ...this.estado.local,
        ...parcial,
        audio: this.audio,
        audioComEfeito: this.audioEnviado(),
        camera: this.cameraLocal,
        tela: this.telaLocal,
        versao: this.estado.local.versao + 1,
      },
    })
  }

  // ─── Efeitos ────────────────────────────────────────────────────────

  private camEnviada(): MediaStreamTrack | null {
    return this.procVideo?.saida ?? this.cam
  }

  private audioEnviado(): MediaStreamTrack | null {
    return this.procAudio?.saida ?? this.audio
  }

  /**
   * Deixa os processadores de efeito de acordo com as trilhas cruas e a escolha:
   * criados só com efeito ligado e trilha aberta, refeitos quando a trilha muda
   * (outro aparelho) e desmontados quando ela some (câmera desligada).
   */
  private sincronizarEfeitos(): void {
    const { video, voz } = this.estado.efeitos
    // Câmera
    const processar = !!this.cam && precisaProcessarVideo(video)
    if (this.procVideo && (!processar || this.procVideo.entrada !== this.cam)) {
      this.procVideo.destruir()
      this.procVideo = null
    }
    if (processar && !this.procVideo) {
      try {
        this.procVideo = new ProcessadorDeVideo(this.cam!, video)
      } catch {
        this.estado = { ...this.estado, efeitos: { ...this.estado.efeitos, video: 'nenhum', suportaVideo: false }, aviso: 'Este aparelho não conseguiu aplicar efeitos de câmera.' }
      }
    } else this.procVideo?.definir(video)
    // Fundo desfocado do navegador
    const desfocar = !!this.cam && video === 'desfoque'
    if (this.desfocada && (this.desfocada !== this.cam || !desfocar)) {
      if (this.desfocada.readyState === 'live') void aplicarDesfoqueNativo(this.desfocada, false)
      this.desfocada = null
    }
    if (desfocar && this.desfocada !== this.cam) {
      const alvo = this.cam!
      this.desfocada = alvo
      void aplicarDesfoqueNativo(alvo, true).then((ok) => {
        if (!ok && this.desfocada === alvo) this.definir({ aviso: 'O fundo desfocado não funciona nesta câmera ou navegador.' })
      })
    }
    const desfoque = suportaDesfoqueNativo(this.cam)
    if (desfoque !== this.estado.efeitos.desfoque) this.estado = { ...this.estado, efeitos: { ...this.estado.efeitos, desfoque } }
    // Voz
    const processarVoz = !!this.audio && voz !== 'nenhum'
    if (this.procAudio && (!processarVoz || this.procAudio.entrada !== this.audio)) {
      this.procAudio.destruir()
      this.procAudio = null
    }
    if (processarVoz && !this.procAudio) {
      try {
        this.procAudio = new ProcessadorDeAudio(this.audio!, voz)
      } catch {
        this.estado = { ...this.estado, efeitos: { ...this.estado.efeitos, voz: 'nenhum', suportaVoz: false }, aviso: 'Este aparelho não conseguiu aplicar efeitos de voz.' }
      }
    } else this.procAudio?.definir(voz)
    if (this.procAudio && this.audio) this.procAudio.saida.enabled = this.audio.enabled
  }

  private desmontarEfeitos(): void {
    this.procVideo?.destruir()
    this.procAudio?.destruir()
    this.procVideo = this.procAudio = null
    this.desfocada = null
  }

  definirEfeitoDeVideo(video: EfeitoDeVideo): void {
    if (video === this.estado.efeitos.video) return
    this.amostrasPesadas = 0
    this.estado = { ...this.estado, efeitos: { ...this.estado.efeitos, video, pesado: false } }
    guardarEfeitos(this.estado.efeitos)
    this.definirLocal({})
    this.distribuirTrilhas()
  }

  definirEfeitoDeVoz(voz: EfeitoDeVoz): void {
    if (voz === this.estado.efeitos.voz) return
    this.estado = { ...this.estado, efeitos: { ...this.estado.efeitos, voz } }
    guardarEfeitos(this.estado.efeitos)
    this.definirLocal({})
    this.distribuirTrilhas()
  }

  private guardar(parcial: Partial<PreferenciasDeAparelho>): void {
    const prefs = { ...this.estado.prefs, ...parcial }
    guardarPreferencias(prefs)
    this.definir({ prefs })
  }

  async trocarAparelho(tipo: 'mic' | 'cam' | 'saida', id: string): Promise<void> {
    if (tipo === 'saida') return this.guardar({ saidaId: id })
    if (this.capturando) return
    const seq = this.novaCaptura()
    if (tipo === 'mic') {
      const r = await capturar({ audio: true, video: false, micId: id })
      if (!this.aindaVale(seq, r.audio)) return
      if (!r.audio) return this.definir({ aviso: 'Não deu para usar esse microfone. Ele pode estar em uso por outro aplicativo.' })
      pararTrilha(this.audio)
      this.audio = r.audio
      this.audio.enabled = this.estado.prefs.micLigado
      this.vigiarTrilha(this.audio, 'mic')
      this.guardar({ micId: id })
      this.definirLocal({ mic: this.estado.prefs.micLigado ? 'ligado' : 'desligado' })
    } else {
      // Solta a câmera atual ANTES de abrir a outra: muitos celulares e webcams
      // não abrem duas ao mesmo tempo ("em uso"). Se a nova falhar, volta à antiga.
      const anterior = this.cam?.getSettings?.().deviceId || this.estado.prefs.camId
      pararTrilha(this.cam)
      this.cam = null
      let r = await capturar({ audio: false, video: true, camId: id })
      if (!this.aindaVale(seq, r.video)) return
      if (!r.video) {
        this.definir({ aviso: 'Não deu para usar essa câmera. Ela pode estar em uso por outro aplicativo.' })
        r = await capturar({ audio: false, video: true, camId: anterior })
        if (!this.aindaVale(seq, r.video)) return
        if (!r.video) {
          this.definirLocal({ cam: r.estadoVideo })
          this.distribuirTrilhas()
          return
        }
        id = anterior || id
      }
      this.cam = r.video
      this.vigiarTrilha(this.cam, 'cam')
      this.guardar({ camId: r.video.getSettings?.().deviceId || id, camLigada: true })
      this.definirLocal({ cam: 'ligado' })
    }
    this.distribuirTrilhas()
  }

  async alternarMic(): Promise<void> {
    if (this.capturando) return
    if (!this.audio) {
      // Sem trilha (negado, indisponível, desconectado): tenta de novo, a pedido.
      if (this.estado.local.mic === 'pagina') return window.location.reload()
      const seq = this.novaCaptura()
      const r = await capturar({ audio: true, video: false, micId: this.estado.prefs.micId })
      if (!this.aindaVale(seq, r.audio)) return
      if (!r.audio) return this.definirLocal({ mic: r.estadoAudio })
      this.audio = r.audio
      this.vigiarTrilha(this.audio, 'mic')
      this.guardar({ micLigado: true })
      this.definirLocal({ mic: 'ligado' })
      this.distribuirTrilhas()
      return
    }
    const ligar = !this.audio.enabled
    this.audio.enabled = ligar
    this.guardar({ micLigado: ligar })
    this.definirLocal({ mic: ligar ? 'ligado' : 'desligado' })
    this.enviarEstado()
  }

  async alternarCam(): Promise<void> {
    if (this.capturando) return
    if (this.cam) {
      // Desligar de verdade: para a trilha (a luz apaga) e nada de vídeo sai.
      pararTrilha(this.cam)
      this.cam = null
      this.guardar({ camLigada: false })
      this.definirLocal({ cam: 'desligado' })
      this.distribuirTrilhas()
      return
    }
    if (this.estado.local.cam === 'pagina') return window.location.reload()
    const seq = this.novaCaptura()
    const r = await capturar({ audio: false, video: true, camId: this.estado.prefs.camId })
    if (!this.aindaVale(seq, r.video)) return
    if (!r.video) return this.definirLocal({ cam: r.estadoVideo })
    this.cam = r.video
    this.vigiarTrilha(this.cam, 'cam')
    this.guardar({ camLigada: true })
    this.definirLocal({ cam: 'ligado' })
    this.distribuirTrilhas()
  }

  /** Celular: alterna entre a câmera da frente e a de trás (ou a próxima da lista). */
  async virarCamera(): Promise<void> {
    const cameras = this.estado.aparelhos.cameras
    if (cameras.length < 2) return
    const atual = this.cam?.getSettings().deviceId || this.estado.prefs.camId
    const i = cameras.findIndex((c) => c.deviceId === atual)
    await this.trocarAparelho('cam', cameras[(i + 1) % cameras.length].deviceId)
  }

  /**
   * iOS/Android: uma ligação ou outro app pode tomar a câmera/microfone com a
   * aula em segundo plano. Na volta, tenta pegar de novo o que estava ligado.
   */
  private async retomarAparelhos(): Promise<void> {
    if (this.estado.fase !== 'na_sala' || this.capturando) return
    const { prefs, local } = this.estado
    if (!this.audio && local.mic === 'indisponivel') {
      const seq = this.novaCaptura()
      const r = await capturar({ audio: true, video: false, micId: prefs.micId })
      if (!this.aindaVale(seq, r.audio)) return
      if (r.audio && this.estado.fase === 'na_sala') {
        this.audio = r.audio
        this.audio.enabled = prefs.micLigado
        this.vigiarTrilha(this.audio, 'mic')
        this.definirLocal({ mic: prefs.micLigado ? 'ligado' : 'desligado' })
        this.distribuirTrilhas()
      } else pararTrilha(r.audio)
    }
    if (!this.cam && prefs.camLigada && local.cam === 'indisponivel') {
      const seq = this.novaCaptura()
      const r = await capturar({ audio: false, video: true, camId: prefs.camId })
      if (!this.aindaVale(seq, r.video)) return
      if (r.video && this.estado.fase === 'na_sala') {
        this.cam = r.video
        this.vigiarTrilha(this.cam, 'cam')
        this.definirLocal({ cam: 'ligado' })
        this.distribuirTrilhas()
      } else pararTrilha(r.video)
    }
  }

  async alternarTela(): Promise<void> {
    if (this.tela) return this.pararTela()
    if (!this.estado.config?.compartilharTela && this.estado.fase === 'na_sala') return
    if (this.creds?.eu.papel === 'aluno' && !this.estado.permissoes.telaAlunos) {
      return this.definir({ aviso: 'O monitor pausou o compartilhamento de tela dos alunos.' })
    }
    try {
      const t = await capturarTela(this.perfil(), this.niveis.tela[this.perfil()].maxFramerate)
      if (!t) return
      this.tela = t
      t.onended = () => this.pararTela()
      this.definirLocal({})
      this.distribuirTrilhas()
    } catch (err) {
      if ((err as { name?: string })?.name !== 'NotAllowedError') this.definir({ aviso: 'Não deu para compartilhar a tela.' })
    }
  }

  private pararTela(): void {
    pararTrilha(this.tela)
    this.tela = null
    this.definirLocal({})
    this.distribuirTrilhas()
  }

  /** O que vai para os pares: as trilhas com efeito, quando há. */
  private trilhas(): TrilhasLocais {
    return { audio: this.audioEnviado(), cam: this.camEnviada(), tela: this.tela }
  }

  private distribuirTrilhas(): void {
    const t = this.trilhas()
    for (const par of this.pares.values()) par.definirTrilhas(t)
    this.enviarEstado()
  }

  // ─── Entrar ─────────────────────────────────────────────────────────

  async entrar(): Promise<void> {
    if (!this.irPara('entrando', { erroAoEntrar: null, saida: null, ociosa: false })) return
    const ciclo = ++this.ciclo
    let res: Response
    try {
      res = await fetch(`/api/monitorias/reservas/${this.reservaId}/sala`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'entrar' }),
        cache: 'no-store',
      })
    } catch {
      if (ciclo === this.ciclo) this.irPara('saguao', { erroAoEntrar: 'Sem conexão com a plataforma. Confira a internet e tente de novo.' })
      return
    }
    if (ciclo !== this.ciclo || this.destruido) return
    const corpo = await res.json().catch(() => null)
    if (!res.ok) return this.recusaAoEntrar(res.status, corpo)
    this.creds = corpo as CredenciaisDaSala
    this.aplicarEntrada()
  }

  private recusaAoEntrar(status: number, corpo: { error?: string; motivo?: string; abreEm?: string } | null): void {
    const mensagem = corpo?.error || 'Não foi possível entrar na sala.'
    if (status === 401) return void this.irPara('fora', { saida: { motivo: 'sessao', mensagem: 'Sua sessão expirou. Entre na sua conta de novo.' } })
    if (status === 429 || status >= 500 || corpo?.motivo === 'nao_abriu') {
      return void this.irPara('saguao', { erroAoEntrar: mensagem, abreEm: corpo?.abreEm || this.estado.abreEm })
    }
    const motivo = motivoDaRecusa(corpo?.motivo)
    this.pararMidia()
    this.irPara('fora', { saida: { motivo, mensagem } })
  }

  private aplicarEntrada(): void {
    const c = this.creds!
    this.desde = c.sala.seq
    this.ultimoProcessado = c.sala.seq
    this.etag = null
    this.falhas = 0
    this.uso = { bytesRelay: 0, segundosRelay: 0, segundosDireta: 0 }
    this.bytesPorPar.clear()
    this.retrato = c.sala
    this.esperadosNomes = c.esperadosNomes || []
    this.ausentesDesde.clear()
    this.faseDoSinal = null
    this.aplicarConfigDeVideo(c.config.video ? niveisDaConfig(c.config.video) : NIVEIS_PADRAO)
    this.ultimaPuxada = Date.now()
    this.irPara('na_sala', {
      eu: { pid: c.eu.pid, papel: c.eu.papel, nome: c.eu.nome, foto: c.eu.foto ?? null },
      config: c.config,
      fechaEm: c.janela.fechaEm,
      turn: c.turn,
      encerrada: c.sala.encerrada,
      outraAba: false,
      aviso: null,
      mao: false,
      pedido: null,
      permissoes: c.sala.permissoes || { telaAlunos: true, chatAlunos: true },
      removidos: c.sala.removidos || [],
      reserva: c.reserva,
      resumo: c.resumo ?? null,
    })
    this.ligarGravador(c.resumo ?? null)
    // Avisa as outras abas deste navegador: a aula agora é aqui.
    this.canalAbas?.postMessage({ t: 'assumi', cx: c.eu.cx })
    // Quem chega oferece a quem já está (o servidor ordena as entradas: só um lado vê o outro).
    for (const p of c.sala.participantes) {
      if (!p.eu && p.presente && p.cx && this.pares.size < c.config.limiteMalha - 1) this.criarPar(p.pid, p.cx, true, novaGeracao())
    }
    this.atualizarFaltam()
    this.ligarCiclosDaAula()
    this.atualizar()
  }

  // ─── Resumo por IA ──────────────────────────────────────────────────

  /** Liga o gravador da minha voz se ela é transcrita nesta aula (e o navegador grava). */
  private ligarGravador(resumo: EstadoDoResumoNaSala | null): void {
    if (this.gravador || !resumo?.gravar || !gravacaoSuportada()) return
    this.gravador = new GravadorDeVoz(this.reservaId, resumo.proximoSeq, (g) => this.definir({ gravacao: { ...g } }))
    this.gravador.definirTrilha(this.audio)
  }

  private desligarGravador(): void {
    this.gravador?.encerrar()
    this.gravador = null
  }

  /** "Pausar a transcrição da minha voz" (só a minha; a aula segue normal). */
  pausarTranscricao(sim: boolean): void {
    // Monitor autorizado pelos Termos (v5+) não pausa a própria voz (Termos do Monitor, item 5.5).
    if (sim && this.estado.resumo?.papel === 'monitor' && this.estado.resumo.pelosTermos) return
    this.gravador?.pausar(sim)
  }

  /** O monitor decidiu no saguão: guarda para ligar o gravador ao entrar. */
  definirResumo(resumo: EstadoDoResumoNaSala | null): void {
    this.definir({ resumo })
    if (this.estado.fase === 'na_sala') this.ligarGravador(resumo)
  }

  /** A câmera já aberta no saguão passa a respeitar o tamanho e o fps do admin (sem reabrir). */
  private aplicarConfigDeVideo(niveis: NiveisDeVideo): void {
    const mudouCaptura = JSON.stringify(niveis.captura) !== JSON.stringify(this.niveis.captura)
    this.niveis = niveis
    definirCaptura(niveis.captura)
    if (mudouCaptura && this.cam) void this.cam.applyConstraints(restricaoDeTamanho()).catch(() => {})
  }

  private perfil(): 'individual' | 'grupo' {
    return (this.retrato?.esperados ?? 2) > 2 ? 'grupo' : 'individual'
  }

  private criarPar(pid: string, cx: string, ofertante: boolean, geracao: string, estadoInicial?: Par['estado']): Par {
    const c = this.creds!
    const par: Par = new Par(
      {
        pid,
        cx,
        ofertante,
        geracao,
        iceServers: c.iceServers,
        perfil: this.perfil(),
        niveis: this.niveis,
        papelLocal: c.eu.papel,
        estadoInicial,
        pelaRede: (tipo, dados) => this.enviarSinal(tipo, pid, dados),
        aoMudar: this.atualizar,
        aoMensagem: (m) => this.aoMensagem(pid, m),
        aoReconstruir: () => this.reconstruir(pid),
        aoCanalAberto: () => this.enviarEstado(par),
      },
      this.trilhas(),
    )
    this.pares.set(pid, par)
    this.bytesPorPar.set(pid, 0)
    if (ofertante) void par.ofertar()
    return par
  }

  /**
   * Fecha a conexão com quem o servidor não lista: na hora quem foi tirado da
   * sala; depois de 90 s quem sumiu da lista com a conexão direta ainda viva
   * (tolera um polling que falhou). Roda a cada retrato e a cada estatística,
   * porque o retrato não muda enquanto ninguém entra nem sai (304).
   */
  private conferirPares(): void {
    const r = this.retrato
    if (!r) return
    const presentes = new Map(r.participantes.filter((p) => !p.eu && p.presente).map((p) => [p.pid, p]))
    const fora = new Set(r.fora || [])
    const agora = Date.now()
    for (const [pid, par] of this.pares) {
      const p = presentes.get(pid)
      const listado = !!p && (!p.cx || p.cx === par.cx)
      if (listado) this.ausentesDesde.delete(pid)
      else if (!this.ausentesDesde.has(pid)) this.ausentesDesde.set(pid, agora)
      const fechar =
        par.estado.fase === 'conectado' ? devoFecharOPar({ removido: fora.has(pid), listado, ausenteDesde: this.ausentesDesde.get(pid) ?? null, agora }) : !listado
      if (fechar) {
        this.fecharPar(pid)
        this.ausentesDesde.delete(pid)
      }
    }
  }

  /** Monitor: quem tem assento e ainda não entrou. */
  private atualizarFaltam(): void {
    if (this.creds?.eu.papel !== 'monitor') return
    const aqui = new Set((this.retrato?.participantes || []).filter((p) => p.presente).map((p) => p.pid))
    const faltam = this.esperadosNomes.filter((e) => !aqui.has(e.pid))
    if (faltam.map((f) => f.pid).join() !== this.estado.faltam.map((f) => f.pid).join()) this.estado = { ...this.estado, faltam }
  }

  private fecharPar(pid: string): void {
    this.pares.get(pid)?.fechar()
    this.pares.delete(pid)
    this.bytesPorPar.delete(pid)
  }

  private reconstruir(pid: string): void {
    const antigo = this.pares.get(pid)
    if (!antigo || !this.creds) return
    const { cx, estado } = antigo
    this.fecharPar(pid)
    this.criarPar(pid, cx, true, novaGeracao(), estado)
    this.atualizar()
  }

  tentarDeNovo(pid: string): void {
    this.pares.get(pid)?.tentarDeNovo()
    this.atualizar()
  }

  // ─── Sinalização (polling adaptativo) ───────────────────────────────

  private cabecalhos(): Record<string, string> {
    return { Authorization: `Bearer ${this.creds?.token || ''}` }
  }

  private reagendarSinal(): void {
    if (this.estado.fase !== 'na_sala' || !this.creds || this.estado.semInternet || this.destruido) {
      clearTimeout(this.timers.sinal)
      this.timers.sinal = undefined
      return
    }
    const outros = (this.retrato?.participantes || []).filter((p) => !p.eu && p.presente).length
    const fase = faseDeSinal({ pares: Array.from(this.pares.values()).map((p) => p.estado.fase), outrosPresentes: outros, esperados: this.retrato?.esperados ?? 2 })
    if (fase !== this.faseDoSinal) {
      this.faseDoSinal = fase
      this.faseDesde = Date.now()
      this.estado = { ...this.estado, sinal: fase }
    }
    const ms = cadenciaDaSala({ fase, visivel: document.visibilityState === 'visible', haMs: Date.now() - this.faseDesde, falhasSeguidas: this.falhas })
    if (ms === null) {
      clearTimeout(this.timers.sinal)
      this.timers.sinal = undefined
      if (!this.estado.ociosa) this.definir({ ociosa: true })
      return
    }
    // A próxima volta conta a partir da última, não de agora: eventos de ICE e a
    // estatística chamam isto o tempo todo e não podem empurrar o pulso para longe.
    const alvo = this.ultimaPuxada + ms
    if (this.timers.sinal && Math.abs(alvo - this.alvoDoSinal) < 50) return
    clearTimeout(this.timers.sinal)
    this.alvoDoSinal = alvo
    this.timers.sinal = setTimeout(() => {
      this.timers.sinal = undefined
      void this.puxar()
    }, Math.max(0, alvo - Date.now()))
  }

  private async puxar(): Promise<void> {
    if (this.puxando || !this.creds || this.estado.fase !== 'na_sala') return
    this.puxando = true
    const ciclo = this.ciclo
    const agora = Date.now()
    const pulso = agora - this.ultimoPulso >= 20_000
    try {
      const res = await fetch(`/api/monitorias/reservas/${this.reservaId}/sala/sinal?desde=${this.desde}${pulso ? '&pulso=1' : ''}`, {
        headers: { ...this.cabecalhos(), ...(this.etag ? { 'If-None-Match': this.etag } : {}) },
        cache: 'no-store',
      })
      if (ciclo !== this.ciclo) return
      if (res.status === 304 || res.ok) {
        this.falhas = 0
        if (pulso) this.ultimoPulso = agora
        if (this.estado.problemaNoServidor) this.definir({ problemaNoServidor: false })
        if (res.ok) {
          this.etag = res.headers.get('etag')
          const corpo = (await res.json()) as RespostaDoSinal
          this.aplicarRetrato(corpo)
          this.processarSinais(corpo.sinais)
          this.desde = Math.max(this.desde, corpo.seq)
        }
      } else {
        await this.falhaDoServidor(res)
      }
    } catch {
      this.falhas++
      if (this.falhas >= 3 && !this.estado.problemaNoServidor) this.definir({ problemaNoServidor: true })
    } finally {
      this.puxando = false
      this.ultimaPuxada = Date.now()
      this.atualizar()
    }
  }

  private async falhaDoServidor(res: Response): Promise<void> {
    const corpo = await res.json().catch(() => null)
    if (res.status === 401) {
      // Token vencido (aba dormindo): renova; se não der, a renovação decide.
      await this.renovar()
      return
    }
    if (res.status === 409 && corpo?.motivo === 'substituida') return this.sairCom('substituida', corpo.error)
    if (res.status === 403 && corpo?.motivo === 'removido') return this.sairCom('removida', corpo.error)
    if (res.status === 410) return this.sairCom('fechada', corpo?.error || 'O horário desta monitoria terminou.')
    if (res.status === 404) return this.sairCom('negado', 'Esta sala não está mais disponível.')
    this.falhas++
    if (this.falhas >= 3 && !this.estado.problemaNoServidor) this.definir({ problemaNoServidor: true })
  }

  private aplicarRetrato(r: RetratoDaSala): void {
    this.retrato = r
    this.conferirPares()
    this.atualizarFaltam()
    const permissoes = r.permissoes || { telaAlunos: true, chatAlunos: true }
    this.definir({ encerrada: r.encerrada, removidos: r.removidos || [] })
    this.aplicarPermissoes(permissoes)
    if (r.encerradaPeloSuporte) return this.sairCom('encerrada', 'O suporte da DomineAqui encerrou esta aula.')
    if (r.encerrada && this.creds?.eu.papel === 'aluno') this.sairCom('encerrada', 'O monitor encerrou a aula.')
  }

  private aplicarPermissoes(p: RetratoDaSala['permissoes']): void {
    const antes = this.estado.permissoes
    if (antes.telaAlunos === p.telaAlunos && antes.chatAlunos === p.chatAlunos) return
    this.definir({ permissoes: p })
    if (this.creds?.eu.papel !== 'aluno') return
    if (!p.telaAlunos && this.tela) {
      this.pararTela()
      this.definir({ aviso: 'O monitor pausou o compartilhamento de tela dos alunos.' })
    } else if (antes.chatAlunos !== p.chatAlunos) {
      this.definir({ aviso: p.chatAlunos ? 'O monitor liberou o chat.' : 'O monitor pausou o chat dos alunos. Levante a mão para falar.' })
    }
  }

  private processarSinais(lista: SinalRecebido[]): void {
    const eu = this.creds?.eu
    if (!eu) return
    for (const s of [...lista].sort((a, b) => a.seq - b.seq)) {
      if (s.seq <= this.ultimoProcessado) continue
      this.ultimoProcessado = s.seq
      const quem = this.retrato?.participantes.find((p) => p.pid === s.de)
      if (!quem || quem.cx !== s.cx) continue // aba antiga do outro, ou ele já saiu
      let par = this.pares.get(s.de)
      const dados = (s.dados || {}) as Record<string, any>
      if (s.tipo === 'oferta') {
        const geracao = String(dados.neg || '').split('.')[0]
        if (par?.ofertante) {
          // Ofertas cruzadas (raro): o menor id continua ofertando.
          if (eu.pid < s.de) continue
          this.fecharPar(s.de)
          par = undefined
        }
        if (par && (par.cx !== s.cx || par.geracao !== geracao)) {
          this.fecharPar(s.de)
          par = undefined
        }
        if (!par) {
          if (this.pares.size >= (this.creds?.config.limiteMalha ?? 2) - 1) continue
          par = this.criarPar(s.de, s.cx, false, geracao)
        }
        void par.receberOferta(String(dados.sdp), String(dados.neg))
      } else if (par && par.cx === s.cx) {
        if (s.tipo === 'resposta') void par.receberResposta(String(dados.sdp), String(dados.neg))
        else if (s.tipo === 'candidatos' && Array.isArray(dados.lista)) par.receberCandidatos(dados.lista, String(dados.neg))
        else if (s.tipo === 'reiniciar') par.receberPedidoDeReinicio()
      }
    }
  }

  private async enviarSinal(tipo: TipoDeSinal, para: string, dados: Record<string, unknown>, tentativa = 0): Promise<void> {
    if (!this.creds) return
    const ciclo = this.ciclo
    try {
      const res = await fetch(`/api/monitorias/reservas/${this.reservaId}/sala/sinal`, {
        method: 'POST',
        headers: { ...this.cabecalhos(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, para, dados }),
        cache: 'no-store',
      })
      if (ciclo !== this.ciclo) return
      if (res.status === 401 && tentativa === 0) {
        if (await this.renovar()) return this.enviarSinal(tipo, para, dados, 1)
        return
      }
      if (res.status === 409 || res.status === 403) {
        const corpo = await res.json().catch(() => null)
        if (corpo?.motivo === 'substituida') this.sairCom('substituida', corpo.error)
        else if (corpo?.motivo === 'removido') this.sairCom('removida', corpo.error)
      }
    } catch {
      this.falhas++
    } finally {
      // Mandou algo: a resposta vem pelo polling, que acelera na negociação.
      this.atualizar()
    }
  }

  // ─── Canal P2P: estado, chat, tchau ─────────────────────────────────

  private enviarEstado(so?: Par): void {
    const base = { mic: !!this.audio && this.audio.enabled, cam: !!this.cam, tela: !!this.tela, mao: this.estado.mao }
    for (const par of so ? [so] : this.pares.values()) {
      par.enviarPeloCanal({ t: 'estado', ...base, videoPausado: par.pausouVideoPelaRede })
    }
  }

  private nomeDe(pid: string): string {
    return this.retrato?.participantes.find((p) => p.pid === pid)?.nome || 'Participante'
  }

  private aoMensagem(pid: string, m: MensagemDoCanal): void {
    if (m.t === 'chat') {
      if (this.idsDoChat.has(m.id)) return
      this.idsDoChat.add(m.id)
      // O servidor já recusa contato no chat; isto barra quem mandasse direto
      // pelo canal P2P, sem passar por ele.
      if (detectarContato(m.texto).nivel === 'bloqueio') return
      const chat = [...this.estado.chat, { id: m.id, minha: false, nome: this.nomeDe(pid), texto: m.texto, em: m.em }].slice(-MAX_CHAT)
      this.definir({ chat, naoLidas: this.chatAberto ? 0 : this.estado.naoLidas + 1 })
    } else if (m.t === 'tchau') {
      this.fecharPar(pid)
      this.atualizar()
    } else if (m.t === 'reacao') {
      this.mostrarReacao(pid, m.e)
    } else if (m.t === 'anotacao') {
      this.receberAnotacao(pid, m)
    } else if (!this.vemDoMonitor(pid)) {
      // Pedidos, remoção, permissões e "encerrar" só valem vindos do monitor
      // (o papel vem do servidor, não do outro navegador).
    } else if (m.t === 'encerrar' && this.creds?.eu.papel === 'aluno') {
      this.sairCom('encerrada', 'O monitor encerrou a aula.')
    } else if (m.t === 'pedido' && this.creds?.eu.papel === 'aluno') {
      void this.atenderPedido(m.acao)
    } else if (m.t === 'removido') {
      if (m.pid === this.creds?.eu.pid) this.sairCom('removida', 'O monitor tirou você da sala. Se foi engano, ele pode liberar sua volta.')
      else this.esquecerParticipante(m.pid)
    } else if (m.t === 'permissoes') {
      this.aplicarPermissoes({ telaAlunos: m.telaAlunos, chatAlunos: m.chatAlunos })
    }
  }

  private vemDoMonitor(pid: string): boolean {
    return this.retrato?.participantes.some((p) => p.pid === pid && p.papel === 'monitor') ?? false
  }

  /** Tirado da sala: some da tela na hora (o servidor confirma no próximo retrato). */
  private esquecerParticipante(pid: string): void {
    this.fecharPar(pid)
    if (this.retrato) this.retrato = { ...this.retrato, participantes: this.retrato.participantes.filter((p) => p.pid !== pid) }
    this.atualizar()
  }

  private async atenderPedido(acao: PedidoDoMonitor): Promise<void> {
    if (acao === 'silenciar' && this.audio?.enabled) {
      this.audio.enabled = false
      this.guardar({ micLigado: false })
      this.definirLocal({ mic: 'desligado' })
      this.enviarEstado()
      this.definir({ aviso: 'O monitor silenciou seu microfone. Ligue de novo quando for falar.' })
    } else if (acao === 'desligar_camera' && this.cam) {
      await this.alternarCam()
      this.definir({ aviso: 'O monitor desligou sua câmera.' })
    } else if (acao === 'parar_tela' && this.tela) {
      this.pararTela()
      this.definir({ aviso: 'O monitor parou o seu compartilhamento de tela.' })
    } else if (acao === 'pedir_mic' && !(this.audio?.enabled ?? false)) {
      this.definir({ pedido: { acao } })
    } else if (acao === 'pedir_camera' && !this.cam) {
      this.definir({ pedido: { acao } })
    } else if (acao === 'baixar_mao' && this.estado.mao) {
      this.definir({ mao: false, aviso: 'O monitor baixou sua mão.' })
      this.enviarEstado()
    }
  }

  /** Resposta ao "o monitor pediu para ligar o microfone/câmera". Nada liga sem a pessoa aceitar. */
  async responderPedido(aceitar: boolean): Promise<void> {
    const pedido = this.estado.pedido
    this.definir({ pedido: null })
    if (!aceitar || !pedido) return
    if (pedido.acao === 'pedir_mic' && !(this.audio?.enabled ?? false)) await this.alternarMic()
    if (pedido.acao === 'pedir_camera' && !this.cam) await this.alternarCam()
  }

  alternarMao(): void {
    this.definir({ mao: !this.estado.mao })
    this.enviarEstado()
  }

  // ─── Controles do anfitrião (monitor) ───────────────────────────────

  /** Pedido a uma pessoa (silenciar, desligar câmera, parar tela, pedir para ligar, baixar a mão). */
  pedirA(pid: string, acao: PedidoDoMonitor): void {
    if (this.creds?.eu.papel !== 'monitor') return
    this.pares.get(pid)?.enviarPeloCanal({ t: 'pedido', acao })
  }

  pedirATodos(acao: 'silenciar' | 'baixar_mao'): void {
    if (this.creds?.eu.papel !== 'monitor') return
    for (const par of this.pares.values()) par.enviarPeloCanal({ t: 'pedido', acao })
  }

  /** Tira da sala (vale no servidor: a pessoa não volta até ser liberada). */
  async removerParticipante(pid: string): Promise<string | null> {
    const falha = await this.acaoNoServidor({ tipo: 'remover', alvo: pid })
    if (falha) return falha
    for (const par of this.pares.values()) par.enviarPeloCanal({ t: 'removido', pid })
    this.esquecerParticipante(pid)
    return null
  }

  async readmitir(pid: string): Promise<string | null> {
    const falha = await this.acaoNoServidor({ tipo: 'readmitir', alvo: pid })
    if (!falha) this.definir({ removidos: this.estado.removidos.filter((r) => r.pid !== pid) })
    return falha
  }

  /** Tela e chat dos alunos: grava no servidor (vale para quem entrar depois) e avisa já pelo P2P. */
  async definirPermissoes(mudanca: Partial<RetratoDaSala['permissoes']>): Promise<string | null> {
    const falha = await this.acaoNoServidor({ tipo: 'permissoes', ...mudanca })
    if (falha) return falha
    const permissoes = { ...this.estado.permissoes, ...mudanca }
    for (const par of this.pares.values()) par.enviarPeloCanal({ t: 'permissoes', ...permissoes })
    this.definir({ permissoes })
    return null
  }

  private async acaoNoServidor(corpo: Record<string, unknown>): Promise<string | null> {
    if (!this.creds || this.creds.eu.papel !== 'monitor') return 'Só o monitor pode fazer isso.'
    try {
      const res = await fetch(`/api/monitorias/reservas/${this.reservaId}/sala/sinal`, {
        method: 'POST',
        headers: { ...this.cabecalhos(), 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
        cache: 'no-store',
      })
      if (res.ok) return null
      const erro = await res.json().catch(() => null)
      if (erro?.motivo === 'substituida') this.sairCom('substituida', erro.error)
      return erro?.error || 'Não deu agora. Tente de novo.'
    } catch {
      return 'Sem conexão. Tente de novo.'
    }
  }

  /**
   * Chat da aula = chat da reserva: grava pela rota que já existe (com as regras
   * de sempre e o registro que os Termos pedem) e entrega ao vivo pelo P2P.
   */
  async enviarChat(texto: string): Promise<string | null> {
    const limpo = texto.trim()
    if (!limpo) return null
    try {
      const res = await fetch(`/api/monitorias/reservas/${this.reservaId}/mensagens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: limpo, origem: 'sala' }),
        cache: 'no-store',
      })
      const corpo = await res.json().catch(() => null)
      if (!res.ok) return corpo?.error || 'Mensagem não enviada.'
      const msg = { id: String(corpo.id), texto: String(corpo.texto), em: new Date(corpo.createdAt).toISOString() }
      this.idsDoChat.add(msg.id)
      for (const par of this.pares.values()) par.enviarPeloCanal({ t: 'chat', ...msg })
      this.definir({ chat: [...this.estado.chat, { ...msg, minha: true, nome: 'Você' }].slice(-MAX_CHAT) })
      return null
    } catch {
      return 'Sem conexão. A mensagem não foi enviada.'
    }
  }

  definirChatAberto(aberto: boolean): void {
    this.chatAberto = aberto
    if (aberto && this.estado.naoLidas) this.definir({ naoLidas: 0 })
  }

  /** Economia de dados: pede aos outros que parem de mandar vídeo (o áudio segue). */
  alternarEconomiaDeDados(): void {
    const ligar = !this.estado.economiaDeDados
    for (const par of this.pares.values()) par.enviarPeloCanal({ t: 'video', receber: !ligar })
    this.definir({ economiaDeDados: ligar })
  }

  /** Um aviso passageiro da própria tela (ex.: "Link copiado!"). */
  avisar(texto: string): void {
    this.definir({ aviso: texto })
  }

  limparAviso(): void {
    if (this.estado.aviso) this.definir({ aviso: null })
  }

  continuarEsperando(): void {
    this.faseDesde = Date.now()
    this.definir({ ociosa: false })
    void this.puxar()
  }

  async encerrarParaTodos(encerrar: boolean): Promise<string | null> {
    if (!this.creds || this.creds.eu.papel !== 'monitor') return null
    const falha = await this.acaoNoServidor({ tipo: encerrar ? 'encerrar' : 'reabrir' })
    if (falha) return falha
    if (encerrar) for (const par of this.pares.values()) par.enviarPeloCanal({ t: 'encerrar' })
    this.definir({ encerrada: encerrar })
    return null
  }

  // ─── Ciclos da aula: estatística, fala, renovação, fechamento ───────

  private ligarCiclosDaAula(): void {
    this.agendarRenovacao()
    this.agendarFechamento()
    this.agendarEstatisticas()
    this.agendarFala()
    void this.pedirWakeLock()
    const aoMudarVisibilidade = () => {
      if (document.visibilityState === 'visible') {
        void this.pedirWakeLock()
        void this.retomarAparelhos()
      }
      this.reagendarSinal()
    }
    const aoFicarOffline = () => this.definir({ semInternet: true })
    const aoVoltarOnline = () => {
      this.definir({ semInternet: false })
      this.falhas = 0
      void this.puxar()
    }
    const aoSairDaPagina = () => this.destruir()
    document.addEventListener('visibilitychange', aoMudarVisibilidade)
    window.addEventListener('offline', aoFicarOffline)
    window.addEventListener('online', aoVoltarOnline)
    window.addEventListener('pagehide', aoSairDaPagina)
    this.removerOuvintes.push(
      () => document.removeEventListener('visibilitychange', aoMudarVisibilidade),
      () => window.removeEventListener('offline', aoFicarOffline),
      () => window.removeEventListener('online', aoVoltarOnline),
      () => window.removeEventListener('pagehide', aoSairDaPagina),
    )
    if (typeof navigator !== 'undefined' && navigator.onLine === false) this.definir({ semInternet: true })
  }

  private agendarEstatisticas(): void {
    clearTimeout(this.timers.stats)
    const intervalo = document.visibilityState === 'visible' ? 2_000 : 5_000
    this.timers.stats = setTimeout(async () => {
      await this.amostrar()
      if (this.estado.fase === 'na_sala') this.agendarEstatisticas()
    }, intervalo)
  }

  private async amostrar(): Promise<void> {
    const agora = Date.now()
    const decorrido = this.ultimaAmostra ? Math.min(10, (agora - this.ultimaAmostra) / 1000) : 0
    this.ultimaAmostra = agora
    let relay = false
    let direta = false
    for (const [pid, par] of this.pares) {
      const l = await par.amostrar()
      if (!l || !l.tipo) continue
      const anterior = this.bytesPorPar.get(pid) ?? 0
      // Par de candidatos trocado (reinício): o contador recomeça do zero.
      const delta = l.bytesDoPar >= anterior ? l.bytesDoPar - anterior : l.bytesDoPar
      this.bytesPorPar.set(pid, l.bytesDoPar)
      if (l.tipo === 'retransmitida') {
        this.uso.bytesRelay += delta
        relay = true
      } else direta = true
    }
    if (relay) this.uso.segundosRelay += decorrido
    else if (direta) this.uso.segundosDireta += decorrido
    this.conferirEfeitoPesado()
    this.conferirPares()
    this.atualizar()
  }

  /**
   * Efeito de câmera que o aparelho não aguenta: o processador entrega menos de
   * 15 quadros por segundo e o navegador diz que o limite é o processador.
   * Três leituras seguidas (6 s) e a tela oferece desligar.
   */
  private conferirEfeitoPesado(): void {
    const cpu = Array.from(this.pares.values()).some((p) => p.estatisticas?.motivoDoLimite === 'cpu')
    const lento = !!this.procVideo && this.procVideo.fps < 15 && cpu
    this.amostrasPesadas = lento ? this.amostrasPesadas + 1 : 0
    const pesado = this.amostrasPesadas >= 3 || (this.estado.efeitos.pesado && !!this.procVideo)
    if (pesado !== this.estado.efeitos.pesado) this.estado = { ...this.estado, efeitos: { ...this.estado.efeitos, pesado } }
  }

  private agendarFala(): void {
    clearTimeout(this.timers.fala)
    this.timers.fala = setTimeout(() => {
      if (document.visibilityState === 'visible') {
        const antes = this.estado.participantes.map((p) => p.falando).join()
        const depois = this.montarParticipantes()
        if (depois.map((p) => p.falando).join() !== antes) this.definir({ participantes: depois })
      }
      if (this.estado.fase === 'na_sala') this.agendarFala()
    }, 400)
  }

  private colherUso(): UsoDaConexao | undefined {
    const segundos = Math.round(this.uso.segundosRelay + this.uso.segundosDireta)
    if (!segundos && !this.uso.bytesRelay) return undefined
    const uso: UsoDaConexao = {
      tipo: this.uso.segundosRelay > this.uso.segundosDireta ? 'retransmitida' : 'direta',
      bytesRelay: Math.round(this.uso.bytesRelay),
      segundos,
    }
    this.uso = { bytesRelay: 0, segundosRelay: 0, segundosDireta: 0 }
    return uso
  }

  private agendarRenovacao(): void {
    clearTimeout(this.timers.renovar)
    if (!this.creds) return
    const ms = Math.max(30_000, new Date(this.creds.expiraEm).getTime() - Date.now() - RENOVAR_ANTES_MS)
    this.timers.renovar = setTimeout(() => void this.renovar(), ms)
  }

  /** Reconfere a autorização e troca o token. `false` = não renovou. */
  private async renovar(): Promise<boolean> {
    if (!this.creds) return false
    const ciclo = this.ciclo
    const uso = this.colherUso()
    try {
      const res = await fetch(`/api/monitorias/reservas/${this.reservaId}/sala`, {
        method: 'POST',
        headers: { ...this.cabecalhos(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'renovar', ...(uso ? { uso } : {}) }),
        cache: 'no-store',
      })
      if (ciclo !== this.ciclo || !this.creds) return false
      const corpo = await res.json().catch(() => null)
      if (res.ok) {
        this.creds = { ...this.creds, token: corpo.token, expiraEm: corpo.expiraEm }
        if (Array.isArray(corpo.esperadosNomes)) this.esperadosNomes = corpo.esperadosNomes
        this.aplicarRetrato(corpo.sala)
        this.agendarRenovacao()
        return true
      }
      if (res.status === 401 && corpo?.motivo !== 'token') {
        this.sairCom('sessao', 'Sua sessão expirou. Entre na sua conta de novo.')
      } else if (res.status === 409 && corpo?.motivo === 'substituida') {
        this.sairCom('substituida', corpo.error)
      } else if (res.status === 401 || res.status === 403 || res.status === 404 || res.status === 409 || res.status === 503) {
        this.sairCom(motivoDaRecusa(corpo?.motivo), corpo?.error || 'Sua participação nesta aula foi encerrada.')
      } else {
        this.devolverUso(uso)
        this.timers.renovar = setTimeout(() => void this.renovar(), 30_000)
      }
      return false
    } catch {
      this.devolverUso(uso)
      this.timers.renovar = setTimeout(() => void this.renovar(), 30_000)
      return false
    }
  }

  private devolverUso(uso: UsoDaConexao | undefined): void {
    if (!uso) return
    this.uso.bytesRelay += uso.bytesRelay
    if (uso.tipo === 'retransmitida') this.uso.segundosRelay += uso.segundos
    else this.uso.segundosDireta += uso.segundos
  }

  private agendarFechamento(): void {
    clearTimeout(this.timers.aviso)
    clearTimeout(this.timers.fecha)
    if (!this.creds) return
    const fecha = new Date(this.creds.janela.fechaEm).getTime()
    const aviso = fecha - AVISO_FECHAMENTO_MIN * 60_000
    const agora = Date.now()
    // setTimeout só aceita ~24 dias; a janela é de horas.
    if (aviso > agora) this.timers.aviso = setTimeout(() => this.definir({ avisoDeFechamento: true }), aviso - agora)
    else this.definir({ avisoDeFechamento: true })
    this.timers.fecha = setTimeout(() => this.sairCom('fechada', 'O horário desta monitoria terminou.'), Math.max(0, fecha - agora))
  }

  private async pedirWakeLock(): Promise<void> {
    try {
      const wl = (navigator as unknown as { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock
      if (!wl || this.estado.fase !== 'na_sala' || document.visibilityState !== 'visible') return
      this.wakeLock = await wl.request('screen')
    } catch {
      /* sem suporte ou negado: a tela pode apagar, a aula continua */
    }
  }

  // ─── Abas do mesmo navegador ────────────────────────────────────────

  private ouvirAbas(): void {
    if (typeof BroadcastChannel === 'undefined') return
    try {
      this.canalAbas = new BroadcastChannel(CANAL_DE_ABAS + this.reservaId)
    } catch {
      return
    }
    this.canalAbas.onmessage = (ev) => {
      const m = ev.data as { t?: string }
      if (m?.t === 'assumi' && this.estado.fase === 'na_sala') this.sairCom('substituida', 'Você abriu a aula em outra aba. Esta janela saiu da sala.')
      else if (m?.t === 'quem' && this.estado.fase === 'na_sala') this.canalAbas?.postMessage({ t: 'estou' })
      else if (m?.t === 'estou' && this.estado.fase === 'saguao') this.definir({ outraAba: true })
    }
    this.canalAbas.postMessage({ t: 'quem' })
  }

  // ─── Saída e limpeza ────────────────────────────────────────────────

  /** Botão "Sair". */
  sair(): void {
    this.sairCom('voce', 'Você pode voltar enquanto a sala estiver aberta.')
  }

  private sairCom(motivo: MotivoDeSaida, mensagem: string): void {
    if (this.estado.fase !== 'na_sala' && this.estado.fase !== 'entrando') return
    this.desligarGravador()
    // Substituída/negada: o servidor já não reconhece esta conexão; não gasta invocação.
    this.encerrarRede(motivo !== 'substituida' && motivo !== 'negado' && motivo !== 'sessao' && motivo !== 'removida')
    this.pararMidia()
    this.irPara('fora', { saida: { motivo, mensagem }, participantes: [], sinal: null, ociosa: false, avisoDeFechamento: false, mao: false, pedido: null })
  }

  /** "Voltar para a aula" depois de sair. */
  async voltar(): Promise<void> {
    if (this.estado.fase !== 'fora') return
    await this.abrirMidia()
    await this.entrar()
  }

  /** "Ajustar câmera e microfone": de fora para o saguão. */
  async voltarAoSaguao(): Promise<void> {
    if (!this.irPara('saguao', { saida: null, erroAoEntrar: null })) return
    await this.abrirMidia()
  }

  private encerrarRede(avisarServidor: boolean): void {
    this.ciclo++
    for (const k of Object.keys(this.timers) as Array<keyof typeof this.timers>) clearTimeout(this.timers[k])
    this.timers = {}
    for (const par of this.pares.values()) {
      if (avisarServidor) par.enviarPeloCanal({ t: 'tchau' })
      par.fechar()
    }
    this.pares.clear()
    this.bytesPorPar.clear()
    if (avisarServidor && this.creds) {
      const uso = this.colherUso()
      const corpo = JSON.stringify({ tipo: 'sair', token: this.creds.token, ...(uso ? { uso } : {}) })
      const url = `/api/monitorias/reservas/${this.reservaId}/sala/sinal`
      try {
        const foi = typeof navigator.sendBeacon === 'function' && navigator.sendBeacon(url, new Blob([corpo], { type: 'text/plain' }))
        if (!foi) void fetch(url, { method: 'POST', body: corpo, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {})
      } catch {
        /* a presença vence sozinha em 75 s */
      }
    }
    this.creds = null
    this.retrato = null
    for (const remover of this.removerOuvintes) remover()
    this.removerOuvintes = []
    void this.wakeLock?.release().catch(() => {})
    this.wakeLock = null
  }

  private pararMidia(): void {
    this.desmontarEfeitos()
    pararTrilha(this.audio)
    pararTrilha(this.cam)
    pararTrilha(this.tela)
    this.audio = this.cam = this.tela = null
    this.cameraLocal = this.telaLocal = null
    this.definir({ local: { audio: null, audioComEfeito: null, camera: null, tela: null, mic: 'desligado', cam: 'desligado', versao: this.estado.local.versao + 1 } })
  }

  /** Desmontagem da tela (ou `pagehide`): desliga tudo, avisa a saída. Idempotente. */
  destruir(): void {
    if (this.destruido) return
    this.desligarGravador()
    this.encerrarRede(this.estado.fase === 'na_sala')
    this.pararMidia()
    this.removerOuvintesDeAparelho()
    try {
      this.canalAbas?.close()
    } catch {
      /* nada */
    }
    this.canalAbas = null
    this.destruido = true
    this.ouvintes.clear()
  }

  // ─── O que a tela mostra ────────────────────────────────────────────

  private montarParticipantes(): ParticipanteNaTela[] {
    const lista: ParticipanteNaTela[] = []
    for (const p of this.retrato?.participantes || []) {
      if (p.eu || !p.presente) continue
      const par = this.pares.get(p.pid)
      lista.push({
        pid: p.pid,
        nome: p.nome,
        foto: p.foto ?? null,
        papel: p.papel,
        fase: par ? par.estado.fase : 'aguardando',
        camera: par ? par.cameraRemota : null,
        tela: par && par.remoto.tela ? par.telaRemota : null,
        versaoDasTrilhas: par?.versaoDasTrilhas ?? 0,
        mic: par?.remoto.mic ?? true,
        cam: par ? par.remoto.cam && !par.remoto.videoPausado : false,
        compartilhando: !!par?.remoto.tela,
        videoPausado: !!par?.remoto.videoPausado,
        conexao: par?.rotulo ?? 'boa',
        falando: !!par && par.remoto.mic && par.nivelDeAudio() > 0.04,
        mao: !!par?.remoto.mao,
        maoDesde: par?.maoDesde ?? 0,
        estatisticas: par?.estatisticas ?? null,
      })
    }
    // Pares conectados com alguém que o servidor ainda não lista (presença atrasada).
    for (const [pid, par] of this.pares) {
      if (lista.some((x) => x.pid === pid) || par.estado.fase !== 'conectado') continue
      lista.push({
        pid,
        nome: this.nomeDe(pid),
        foto: null,
        papel: 'aluno',
        fase: 'conectado',
        camera: par.cameraRemota,
        tela: par.remoto.tela ? par.telaRemota : null,
        versaoDasTrilhas: par.versaoDasTrilhas,
        mic: par.remoto.mic,
        cam: par.remoto.cam && !par.remoto.videoPausado,
        compartilhando: par.remoto.tela,
        videoPausado: par.remoto.videoPausado,
        conexao: par.rotulo,
        falando: par.remoto.mic && par.nivelDeAudio() > 0.04,
        mao: par.remoto.mao,
        maoDesde: par.maoDesde,
        estatisticas: par.estatisticas,
      })
    }
    // Tela de aluno com o compartilhamento pausado pelo monitor não aparece
    // (protege de um navegador que ignore a pausa).
    if (!this.estado.permissoes.telaAlunos) {
      for (const p of lista) if (p.papel === 'aluno' && p.tela) Object.assign(p, { tela: null, compartilhando: false })
    }
    // O monitor primeiro: é quem mais importa ver.
    return lista.sort((a, b) => (a.papel === b.papel ? a.nome.localeCompare(b.nome) : a.papel === 'monitor' ? -1 : 1))
  }
}

/** Recusa do servidor (entrar/renovar) para o motivo de saída que a tela explica. */
function motivoDaRecusa(motivo: string | undefined): MotivoDeSaida {
  if (motivo === 'encerrada') return 'encerrada'
  if (motivo === 'fechada') return 'fechada'
  if (motivo === 'removido') return 'removida'
  return 'negado'
}
