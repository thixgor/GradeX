'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  PhoneOff,
  RefreshCw,
  ScreenShare,
  ScreenShareOff,
  Send,
  Settings2,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Users,
  Video,
  VideoOff,
  Volume2,
  WifiOff,
  X,
} from 'lucide-react'
import { Avatar } from '@/components/monitorias/base'
import { horaEmBrasilia } from '@/lib/fuso-brasilia'
import { podeEscolherSaida } from '@/lib/monitorias/sala/cliente/midia'
import type { ControladorDaSala, EstadoDaSalaNaTela, ParticipanteNaTela } from '@/lib/monitorias/sala/cliente/controlador'
import { cn } from '@/lib/utils'
import { AudioRemoto, destravarAudios, VideoAoVivo } from './midia-ao-vivo'
import { SeletorDeAparelho } from './saguao'

// ─── Peças pequenas ─────────────────────────────────────────────────────

function BotaoDeControle({
  rotulo,
  ativo = true,
  perigo = false,
  atalho,
  expandido,
  onClick,
  children,
  contador,
}: {
  rotulo: string
  ativo?: boolean
  perigo?: boolean
  atalho?: string
  /** Para o chat: abre e fecha um painel (o rótulo não muda). */
  expandido?: boolean
  onClick: () => void
  children: React.ReactNode
  contador?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      title={atalho ? `${rotulo} (${atalho})` : rotulo}
      aria-keyshortcuts={atalho?.replace('⌘/Ctrl', 'Control')}
      aria-expanded={expandido}
      className={cn(
        'relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 sm:h-[52px] sm:w-[52px]',
        perigo ? 'bg-rose-600 text-white hover:bg-rose-500' : ativo ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white text-neutral-900 hover:bg-white/90',
      )}
    >
      {children}
      {!!contador && (
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
          {contador > 9 ? '9+' : contador}
        </span>
      )}
    </button>
  )
}

const ROTULO_CONEXAO = { boa: 'Conexão boa', instavel: 'Conexão instável', fraca: 'Conexão fraca' } as const

function IconeDeConexao({ nivel, className }: { nivel: 'boa' | 'instavel' | 'fraca'; className?: string }) {
  const Icone = nivel === 'boa' ? SignalHigh : nivel === 'instavel' ? SignalMedium : SignalLow
  return <Icone className={cn('h-4 w-4', nivel === 'boa' ? 'text-primary' : 'text-amber-300', className)} aria-hidden />
}

function Faixa({ children, acao, tom = 'info' }: { children: React.ReactNode; acao?: React.ReactNode; tom?: 'info' | 'alerta' }) {
  return (
    <div
      className={cn(
        'pointer-events-auto flex max-w-[min(92vw,560px)] items-center gap-3 rounded-xl px-3.5 py-2 text-sm shadow-lg backdrop-blur',
        tom === 'alerta' ? 'bg-amber-400/95 text-neutral-950' : 'bg-neutral-800/95 text-white',
      )}
      role="status"
    >
      <span className="min-w-0 flex-1">{children}</span>
      {acao}
    </div>
  )
}

const ESTADO_DO_PAR: Record<ParticipanteNaTela['fase'], string | null> = {
  aguardando: 'Conectando…',
  novo: 'Conectando…',
  negociando: 'Conectando…',
  conectado: null,
  instavel: 'Reconectando…',
  reiniciando: 'Reconectando…',
  perdido: 'Conexão perdida',
}

function Quadro({
  nome,
  papel,
  stream,
  versao,
  camLigada,
  micLigado,
  fase = 'conectado',
  conexao = 'boa',
  falando = false,
  videoPausado = false,
  eu = false,
  pequeno = false,
  aoTentar,
}: {
  nome: string
  papel?: 'monitor' | 'aluno'
  stream: MediaStream | null
  versao: number
  camLigada: boolean
  micLigado: boolean
  fase?: ParticipanteNaTela['fase']
  conexao?: 'boa' | 'instavel' | 'fraca'
  falando?: boolean
  videoPausado?: boolean
  eu?: boolean
  pequeno?: boolean
  aoTentar?: () => void
}) {
  const estadoDoPar = ESTADO_DO_PAR[fase]
  const mostrarVideo = !!stream && camLigada && fase !== 'perdido'
  return (
    <div
      className={cn(
        'relative h-full w-full overflow-hidden rounded-2xl bg-neutral-900 transition-shadow',
        falando && 'ring-2 ring-primary ring-offset-2 ring-offset-neutral-950',
      )}
    >
      {mostrarVideo ? (
        <VideoAoVivo stream={stream} versao={versao} espelhar={eu} rotulo={eu ? 'Sua câmera' : `Câmera de ${nome}`} />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Avatar nome={nome} tamanho={pequeno ? 40 : 76} />
        </div>
      )}

      {estadoDoPar && !eu && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-neutral-950/60 text-center text-sm text-white">
          {fase === 'perdido' ? <WifiOff className="h-5 w-5" aria-hidden /> : <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
          {!pequeno && <span>{estadoDoPar}</span>}
          {fase === 'perdido' && aoTentar && (
            <button type="button" onClick={aoTentar} className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 hover:bg-white/90">
              <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Tentar de novo
            </button>
          )}
        </div>
      )}

      {videoPausado && fase === 'conectado' && !pequeno && (
        <span className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white">Vídeo pausado para manter o áudio</span>
      )}

      <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2">
        <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg bg-black/55 px-2 py-1 text-xs text-white">
          {!micLigado && <MicOff className="h-3.5 w-3.5 shrink-0 text-rose-300" aria-label="microfone desligado" />}
          <span className="truncate">{eu ? 'Você' : nome}</span>
          {papel === 'monitor' && !eu && <span className="rounded bg-primary/90 px-1 text-[10px] font-semibold text-primary-foreground">Monitor</span>}
        </span>
        {!eu && fase === 'conectado' && conexao !== 'boa' && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-black/55 px-1.5 py-1" title={ROTULO_CONEXAO[conexao]}>
            <IconeDeConexao nivel={conexao} />
            <span className="sr-only">{ROTULO_CONEXAO[conexao]}</span>
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Painéis ────────────────────────────────────────────────────────────

function PainelDeChat({ estado, ctrl, aoFechar }: { estado: EstadoDaSalaNaTela; ctrl: ControladorDaSala; aoFechar: () => void }) {
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const fim = useRef<HTMLDivElement>(null)
  useEffect(() => {
    fim.current?.scrollIntoView({ block: 'nearest' })
  }, [estado.chat.length])
  async function enviar() {
    if (!texto.trim() || enviando) return
    setEnviando(true)
    setErro('')
    const falha = await ctrl.enviarChat(texto)
    setEnviando(false)
    if (falha) setErro(falha)
    else setTexto('')
  }
  return (
    <aside
      className="absolute inset-x-0 bottom-0 z-20 flex max-h-[70dvh] flex-col rounded-t-2xl border-t border-white/10 bg-neutral-900 sm:inset-y-3 sm:left-auto sm:right-3 sm:max-h-none sm:w-80 sm:rounded-2xl sm:border"
      aria-label="Chat da aula"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold">Chat da aula</h2>
        <button type="button" onClick={aoFechar} aria-label="Fechar o chat" className="rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="min-h-[160px] flex-1 space-y-2 overflow-y-auto px-4 py-3" aria-live="polite">
        {estado.chat.length === 0 ? (
          <p className="text-xs leading-relaxed text-white/60">As mensagens ficam guardadas no chat da reserva, junto com o resto da conversa.</p>
        ) : (
          estado.chat.map((m) => (
            <div key={m.id} className={cn('max-w-[90%] rounded-2xl px-3 py-2 text-sm', m.minha ? 'ml-auto rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md bg-white/10')}>
              {!m.minha && <p className="mb-0.5 text-[11px] font-semibold text-white/70">{m.nome}</p>}
              <p className="whitespace-pre-line break-words">{m.texto}</p>
              <p className={cn('mt-0.5 text-[10px]', m.minha ? 'text-primary-foreground/70' : 'text-white/50')}>{horaEmBrasilia(m.em)}</p>
            </div>
          ))
        )}
        <div ref={fim} />
      </div>
      <div className="border-t border-white/10 p-3">
        {erro && <p className="mb-2 text-xs text-rose-300">{erro}</p>}
        <div className="flex items-end gap-2">
          <label className="sr-only" htmlFor="chat-da-aula">
            Mensagem
          </label>
          <textarea
            id="chat-da-aula"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void enviar()
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder="Escreva uma mensagem…"
            className="min-h-[44px] flex-1 resize-none rounded-xl border border-white/15 bg-neutral-950 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <button
            type="button"
            onClick={() => void enviar()}
            disabled={enviando || !texto.trim()}
            aria-label="Enviar mensagem"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
          >
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </aside>
  )
}

function Dialogo({ titulo, aoFechar, children }: { titulo: string; aoFechar: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('button, select, [tabindex]')?.focus()
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar()
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [aoFechar])
  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-black/60 sm:items-center sm:p-4" onClick={aoFechar}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl border border-white/10 bg-neutral-900 p-5 text-white shadow-2xl sm:rounded-3xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">{titulo}</h2>
          <button type="button" onClick={aoFechar} aria-label="Fechar" className="rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── A sala ─────────────────────────────────────────────────────────────

export function SalaChamada({ ctrl, estado, titulo, fim }: { ctrl: ControladorDaSala; estado: EstadoDaSalaNaTela; titulo: string; fim: string | null }) {
  const [chatAberto, setChatAberto] = useState(false)
  const [ajustes, setAjustes] = useState(false)
  const [confirmarSaida, setConfirmarSaida] = useState(false)
  const [audioBloqueado, setAudioBloqueado] = useState(false)
  const [anuncio, setAnuncio] = useState('')
  const [erroDoMonitor, setErroDoMonitor] = useState('')
  const [pipNoTopo, setPipNoTopo] = useState(false)
  const ehMonitor = estado.eu?.papel === 'monitor'
  const remotos = estado.participantes
  const micLigado = estado.local.mic === 'ligado'
  const camLigada = estado.local.cam === 'ligado'
  const compartilhando = !!estado.local.tela
  const telaRemota = remotos.find((p) => p.compartilhando && p.tela)
  const aoBloquear = useCallback(() => setAudioBloqueado(true), [])

  useEffect(() => {
    ctrl.definirChatAberto(chatAberto)
  }, [chatAberto, ctrl])

  // Aviso passageiro do controlador (aparelho desconectado etc.).
  useEffect(() => {
    if (!estado.aviso) return
    const t = setTimeout(() => ctrl.limparAviso(), 6_000)
    return () => clearTimeout(t)
  }, [estado.aviso, ctrl])

  // Atalhos: Ctrl/⌘+D microfone, Ctrl/⌘+E câmera (os mesmos de outras salas de vídeo).
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return
      const alvo = e.target as HTMLElement | null
      if (alvo && (alvo.tagName === 'TEXTAREA' || alvo.tagName === 'INPUT' || alvo.isContentEditable)) return
      const k = e.key.toLowerCase()
      if (k === 'd') {
        e.preventDefault()
        void ctrl.alternarMic()
      } else if (k === 'e') {
        e.preventDefault()
        void ctrl.alternarCam()
      }
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [ctrl])

  // Leitor de tela: quem entrou e quem saiu.
  const anteriores = useRef<Map<string, string>>(new Map())
  useEffect(() => {
    const agora = new Map(remotos.map((p) => [p.pid, p.nome]))
    const entraram = Array.from(agora).filter(([pid]) => !anteriores.current.has(pid)).map(([, n]) => n)
    const sairam = Array.from(anteriores.current).filter(([pid]) => !agora.has(pid)).map(([, n]) => n)
    anteriores.current = agora
    const partes = [...entraram.map((n) => `${n} entrou na sala.`), ...sairam.map((n) => `${n} saiu da sala.`)]
    if (partes.length) setAnuncio(partes.join(' '))
  }, [remotos])

  const pior = useMemo<'boa' | 'instavel' | 'fraca'>(() => {
    const conectados = remotos.filter((p) => p.fase === 'conectado')
    if (conectados.some((p) => p.conexao === 'fraca')) return 'fraca'
    if (conectados.some((p) => p.conexao === 'instavel')) return 'instavel'
    return 'boa'
  }, [remotos])
  const reconectando = remotos.filter((p) => p.fase === 'instavel' || p.fase === 'reiniciando')
  const nomeDoEsperado = ehMonitor ? 'os alunos' : 'o monitor'

  const meuQuadro = (pequeno: boolean) => (
    <Quadro nome={estado.eu?.nome || 'Você'} stream={estado.local.camera} versao={estado.local.versao} camLigada={camLigada} micLigado={micLigado} eu pequeno={pequeno} />
  )
  const quadroDe = (p: ParticipanteNaTela, pequeno = false) => (
    <Quadro
      key={p.pid}
      nome={p.nome}
      papel={p.papel}
      stream={p.camera}
      versao={p.versaoDasTrilhas}
      camLigada={p.cam}
      micLigado={p.mic}
      fase={p.fase}
      conexao={p.conexao}
      falando={p.falando}
      videoPausado={p.videoPausado}
      pequeno={pequeno}
      aoTentar={() => ctrl.tentarDeNovo(p.pid)}
    />
  )

  let palco: React.ReactNode
  if (telaRemota || compartilhando) {
    palco = (
      <div className="flex h-full flex-col gap-2 lg:flex-row">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-black">
          {telaRemota ? (
            <VideoAoVivo stream={telaRemota.tela} versao={telaRemota.versaoDasTrilhas} contain rotulo={`Tela de ${telaRemota.nome}`} />
          ) : (
            <VideoAoVivo stream={estado.local.tela} versao={estado.local.versao} contain rotulo="Sua tela compartilhada" />
          )}
          <span className="absolute left-3 top-3 rounded-lg bg-black/60 px-2 py-1 text-xs text-white">{telaRemota ? `Tela de ${telaRemota.nome}` : 'Você está compartilhando a tela'}</span>
        </div>
        <div className="flex h-28 shrink-0 gap-2 overflow-x-auto lg:h-auto lg:w-56 lg:flex-col lg:overflow-y-auto">
          {remotos.map((p) => (
            <div key={p.pid} className="aspect-video h-full shrink-0 lg:h-auto lg:w-full">
              {quadroDe(p, true)}
            </div>
          ))}
          <div className="aspect-video h-full shrink-0 lg:h-auto lg:w-full">{meuQuadro(true)}</div>
        </div>
      </div>
    )
  } else if (remotos.length === 0) {
    palco = (
      <div className="relative h-full overflow-hidden rounded-2xl">
        {meuQuadro(false)}
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/55 p-6 text-center">
          <div className="max-w-sm">
            {estado.ociosa ? (
              <>
                <p className="font-heading text-xl font-semibold">Ainda está aí?</p>
                <p className="mt-1 text-sm text-white/75">Paramos de procurar {nomeDoEsperado} para não gastar sua internet à toa.</p>
                <button type="button" onClick={() => ctrl.continuarEsperando()} className="mt-4 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
                  Continuar esperando
                </button>
              </>
            ) : (
              <>
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-white/80" aria-hidden />
                <p className="mt-3 font-heading text-xl font-semibold">Aguardando {nomeDoEsperado}</p>
                <p className="mt-1 text-sm text-white/75">{ehMonitor ? 'Os alunos foram avisados de que você entrou.' : 'Assim que o monitor entrar, a aula começa aqui. Você pode deixar esta aba aberta.'}</p>
              </>
            )}
          </div>
        </div>
      </div>
    )
  } else if (remotos.length === 1) {
    palco = (
      <div className="relative h-full">
        {quadroDe(remotos[0])}
        <button
          type="button"
          onClick={() => setPipNoTopo((v) => !v)}
          aria-label="Mover sua câmera"
          className={cn('absolute right-3 aspect-video w-28 overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/15 sm:w-48', pipNoTopo ? 'top-3' : 'bottom-3')}
        >
          {meuQuadro(true)}
        </button>
      </div>
    )
  } else {
    palco = (
      <div className="grid h-full auto-rows-fr grid-cols-1 gap-2 min-[480px]:grid-cols-2">
        {remotos.map((p) => quadroDe(p))}
        {meuQuadro(false)}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[1000] flex h-[100dvh] flex-col bg-neutral-950 text-white">
      <p className="sr-only" aria-live="polite">
        {anuncio}
      </p>
      {remotos.map((p) => (
        <AudioRemoto key={p.pid} stream={p.camera} versao={p.versaoDasTrilhas} saidaId={estado.prefs.saidaId} aoBloquear={aoBloquear} />
      ))}

      {/* Topo */}
      <header className="flex h-14 shrink-0 items-center gap-3 px-4 pt-[env(safe-area-inset-top)]">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold">{titulo}</h1>
          {fim && <p className="text-xs text-white/60">Termina às {horaEmBrasilia(fim)}</p>}
        </div>
        {remotos.some((p) => p.fase === 'conectado') && (
          <span className="inline-flex items-center gap-1.5 text-xs text-white/75" title={ROTULO_CONEXAO[pior]}>
            <IconeDeConexao nivel={pior} />
            <span className="hidden sm:inline">{ROTULO_CONEXAO[pior]}</span>
            <span className="sr-only sm:hidden">{ROTULO_CONEXAO[pior]}</span>
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-xs text-white/75">
          <Users className="h-4 w-4" aria-hidden />
          <span>{remotos.length + 1}</span>
          <span className="sr-only">pessoas na sala</span>
        </span>
      </header>

      {/* Palco */}
      <main className="relative min-h-0 flex-1 px-2 pb-2 sm:px-4">
        {palco}

        <div className="pointer-events-none absolute inset-x-0 top-2 z-10 flex flex-col items-center gap-2 px-3">
          {estado.semInternet && (
            <Faixa tom="alerta">
              <WifiOff className="mr-1.5 inline h-4 w-4" aria-hidden /> Sem internet. A aula volta sozinha quando a conexão voltar.
            </Faixa>
          )}
          {!estado.semInternet && reconectando.length > 0 && <Faixa>Reconectando com {reconectando.map((p) => p.nome.split(' ')[0]).join(', ')}…</Faixa>}
          {estado.problemaNoServidor && !estado.semInternet && <Faixa>Instabilidade na plataforma. A aula continua; novas conexões podem demorar.</Faixa>}
          {audioBloqueado && (
            <Faixa
              acao={
                <button
                  type="button"
                  onClick={() => {
                    destravarAudios()
                    setAudioBloqueado(false)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  <Volume2 className="h-3.5 w-3.5" aria-hidden /> Ativar o som
                </button>
              }
            >
              O navegador pausou o som da aula.
            </Faixa>
          )}
          {estado.avisoDeFechamento && estado.fechaEm && <Faixa tom="alerta">A sala fecha às {horaEmBrasilia(estado.fechaEm)}.</Faixa>}
          {ehMonitor && estado.encerrada && (
            <Faixa
              acao={
                <button
                  type="button"
                  onClick={async () => setErroDoMonitor((await ctrl.encerrarParaTodos(false)) || '')}
                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900"
                >
                  Reabrir sala
                </button>
              }
            >
              Você encerrou a aula para os alunos.
            </Faixa>
          )}
          {estado.aviso && <Faixa>{estado.aviso}</Faixa>}
          {erroDoMonitor && <Faixa tom="alerta">{erroDoMonitor}</Faixa>}
        </div>

        {chatAberto && estado.config?.chatNaSala && <PainelDeChat estado={estado} ctrl={ctrl} aoFechar={() => setChatAberto(false)} />}
      </main>

      {/* Controles */}
      <nav aria-label="Controles da chamada" className="flex shrink-0 items-center justify-center gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 sm:gap-3">
        <BotaoDeControle rotulo={micLigado ? 'Desligar microfone' : 'Ligar microfone'} ativo={micLigado} atalho="⌘/Ctrl+D" onClick={() => void ctrl.alternarMic()}>
          {micLigado ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </BotaoDeControle>
        <BotaoDeControle rotulo={camLigada ? 'Desligar câmera' : 'Ligar câmera'} ativo={camLigada} atalho="⌘/Ctrl+E" onClick={() => void ctrl.alternarCam()}>
          {camLigada ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </BotaoDeControle>
        {estado.podeCompartilhar && estado.config?.compartilharTela && (
          <BotaoDeControle rotulo={compartilhando ? 'Parar de compartilhar a tela' : 'Compartilhar a tela'} ativo={!compartilhando} onClick={() => void ctrl.alternarTela()}>
            {compartilhando ? <ScreenShareOff className="h-5 w-5" /> : <ScreenShare className="h-5 w-5" />}
          </BotaoDeControle>
        )}
        {estado.config?.chatNaSala && (
          <BotaoDeControle rotulo="Chat da aula" expandido={chatAberto} contador={chatAberto ? 0 : estado.naoLidas} onClick={() => setChatAberto((v) => !v)}>
            <MessageSquare className="h-5 w-5" />
          </BotaoDeControle>
        )}
        <BotaoDeControle rotulo="Ajustes da chamada" onClick={() => setAjustes(true)}>
          <Settings2 className="h-5 w-5" />
        </BotaoDeControle>
        <BotaoDeControle rotulo="Sair da aula" perigo onClick={() => setConfirmarSaida(true)}>
          <PhoneOff className="h-5 w-5" />
        </BotaoDeControle>
      </nav>

      {ajustes && (
        <Dialogo titulo="Ajustes" aoFechar={() => setAjustes(false)}>
          <div className="space-y-3 [&_label_span]:text-white/60 [&_select]:border-white/15 [&_select]:bg-neutral-950 [&_select]:text-white">
            <SeletorDeAparelho rotulo="Câmera" valor={estado.prefs.camId} opcoes={estado.aparelhos.cameras} aoMudar={(id) => void ctrl.trocarAparelho('cam', id)} />
            <SeletorDeAparelho rotulo="Microfone" valor={estado.prefs.micId} opcoes={estado.aparelhos.microfones} aoMudar={(id) => void ctrl.trocarAparelho('mic', id)} />
            {podeEscolherSaida() && <SeletorDeAparelho rotulo="Alto-falante" valor={estado.prefs.saidaId} opcoes={estado.aparelhos.saidas} aoMudar={(id) => void ctrl.trocarAparelho('saida', id)} />}
            <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl bg-white/5 p-3">
              <span>
                <span className="block text-sm font-medium !text-white">Economia de dados</span>
                <span className="block text-xs">Para de receber vídeo dos outros. O áudio continua.</span>
              </span>
              <input type="checkbox" checked={estado.economiaDeDados} onChange={() => ctrl.alternarEconomiaDeDados()} className="mt-1 h-5 w-5 accent-[hsl(var(--primary))]" />
            </label>
            {ehMonitor && (
              <button
                type="button"
                onClick={async () => {
                  setErroDoMonitor((await ctrl.encerrarParaTodos(!estado.encerrada)) || '')
                  setAjustes(false)
                }}
                className="w-full rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/5"
              >
                {estado.encerrada ? 'Reabrir a sala para os alunos' : 'Encerrar a aula para todos'}
              </button>
            )}
            <p className="text-xs text-white/50">{estado.turn ? 'Se a conexão direta não funcionar, a chamada passa por um servidor de apoio seguro.' : 'Conexão direta entre os participantes.'}</p>
          </div>
        </Dialogo>
      )}

      {confirmarSaida && (
        <Dialogo titulo="Sair da aula?" aoFechar={() => setConfirmarSaida(false)}>
          <p className="text-sm text-white/75">
            Sair não cancela nem conclui a monitoria. {estado.fechaEm ? `Você pode voltar até ${horaEmBrasilia(estado.fechaEm)}.` : ''}
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <button type="button" onClick={() => setConfirmarSaida(false)} className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900">
              Continuar na aula
            </button>
            <button type="button" onClick={() => ctrl.sair()} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-500">
              Sair
            </button>
            {ehMonitor && !estado.encerrada && (
              <button
                type="button"
                onClick={async () => {
                  await ctrl.encerrarParaTodos(true)
                  ctrl.sair()
                }}
                className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/5"
              >
                Encerrar para todos e sair
              </button>
            )}
          </div>
        </Dialogo>
      )}
    </div>
  )
}
