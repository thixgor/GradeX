'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  FlipHorizontal2,
  Hand,
  Highlighter,
  Link2,
  Loader2,
  PictureInPicture2,
  Minus,
  MessageSquare,
  Mic,
  MicOff,
  MoreHorizontal,
  PencilLine,
  PhoneOff,
  Pin,
  Plus,
  Power,
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
  Wand2,
  WifiOff,
  X,
  Zap,
} from 'lucide-react'
import { Avatar } from '@/components/monitorias/base'
import { EditorDeAnotacoes } from '@/components/monitorias/anotacoes'
import { useCelularEmPe, useViewportVisivel } from '@/hooks/use-viewport-visivel'
import { useBrilhoDaVoz } from '@/hooks/use-brilho-da-voz'
import { horaEmBrasilia } from '@/lib/fuso-brasilia'
import { criarMedidor, podeEscolherSaida } from '@/lib/monitorias/sala/cliente/midia'
import { copiarLink } from '@/lib/monitorias/sala/cliente/copiar'
import { EFEITOS_DE_VOZ, espelharPrevia } from '@/lib/monitorias/sala/cliente/efeitos'
import type { MensagemDeAnotacao, Traco } from '@/lib/monitorias/sala/tela-anotada'
import type { ControladorDaSala, EstadoDaSalaNaTela, ParticipanteNaTela } from '@/lib/monitorias/sala/cliente/controlador'
import { cn } from '@/lib/utils'
import { MarcaDagua, MarcaNoTopo } from './marca'
import { SeloDoResumo } from './resumo-ia-sala'
import { AudioRemoto, destravarAudios, VideoAoVivo } from './midia-ao-vivo'
import { PainelDePessoas } from './painel-pessoas'
import { SeletorDeAparelho } from './saguao'
import { TesteDeSom } from './teste-de-som'
import { PainelDeEfeitos } from './painel-efeitos'
import { BarraFlutuante, useJanelaFlutuante } from './barra-flutuante'
import { CamadaDeAnotacao, FerramentasDeAnotacao, useAnotador } from './camada-anotacao'
import { BotaoDeReacoes, FileiraDeReacoes, ReacoesFlutuantes } from './reacoes'
import { EstatisticasDaConexao } from './estatisticas-conexao'

type Painel = 'chat' | 'pessoas' | 'anotacoes'

// ─── Peças pequenas ─────────────────────────────────────────────────────

function BotaoDeControle({
  rotulo,
  ativo = true,
  perigo = false,
  destaque = false,
  pressionado,
  atalho,
  expandido,
  onClick,
  children,
  contador,
  className,
}: {
  rotulo: string
  /** `false` = estado que pede atenção (microfone/câmera desligados): botão branco. */
  ativo?: boolean
  perigo?: boolean
  /** Mão levantada: amarelo. */
  destaque?: boolean
  pressionado?: boolean
  atalho?: string
  /** Botões que abrem painel (o rótulo não muda). */
  expandido?: boolean
  onClick: () => void
  children: React.ReactNode
  contador?: number
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      title={atalho ? `${rotulo} (${atalho})` : rotulo}
      aria-keyshortcuts={atalho?.replace('⌘/Ctrl', 'Control')}
      aria-expanded={expandido}
      aria-pressed={pressionado}
      className={cn(
        'relative inline-flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 min-[380px]:h-12 min-[380px]:w-12 sm:h-[52px] sm:w-[52px] [@media(max-height:480px)]:h-10 [@media(max-height:480px)]:w-10',
        perigo
          ? 'bg-rose-600 text-white hover:bg-rose-500'
          : destaque
            ? 'bg-amber-400 text-neutral-950 hover:bg-amber-300'
            : expandido
              ? 'bg-primary text-primary-foreground'
              : ativo
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-white text-neutral-900 hover:bg-white/90',
        className,
      )}
    >
      {children}
      {!!contador && (
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground ring-2 ring-neutral-950">
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

function Faixa({ children, acao, tom = 'info' }: { children: React.ReactNode; acao?: React.ReactNode; tom?: 'info' | 'alerta' | 'mao' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      className={cn(
        'pointer-events-auto flex max-w-[min(92vw,560px)] items-center gap-3 rounded-xl px-3.5 py-2 text-sm shadow-lg backdrop-blur',
        tom === 'alerta' ? 'bg-amber-400/95 text-neutral-950' : tom === 'mao' ? 'bg-amber-300/95 text-neutral-950' : 'bg-neutral-800/95 text-white',
      )}
      role="status"
    >
      <span className="min-w-0 flex-1">{children}</span>
      {acao}
    </motion.div>
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
  foto = null,
  papel,
  stream,
  versao,
  camLigada,
  micLigado,
  fase = 'conectado',
  conexao = 'boa',
  falando = false,
  videoPausado = false,
  mao = false,
  fixado = false,
  contain = false,
  eu = false,
  espelhar = eu,
  selo,
  pequeno = false,
  lerNivel = null,
  aoTentar,
  aoFixar,
}: {
  nome: string
  /** Foto do perfil, para quando a câmera está desligada. */
  foto?: string | null
  papel?: 'monitor' | 'aluno'
  stream: MediaStream | null
  versao: number
  camLigada: boolean
  micLigado: boolean
  fase?: ParticipanteNaTela['fase']
  conexao?: 'boa' | 'instavel' | 'fraca'
  falando?: boolean
  videoPausado?: boolean
  mao?: boolean
  fixado?: boolean
  contain?: boolean
  eu?: boolean
  /** Prévia da própria câmera espelhada (padrão: só a minha). */
  espelhar?: boolean
  /** Lembrete discreto no canto (ex.: efeito de voz ligado). */
  selo?: string
  pequeno?: boolean
  aoTentar?: () => void
  /** Duplo clique fixa no palco (atalho do painel Pessoas). */
  aoFixar?: () => void
  /** Nível da voz (0 a 1), lido a cada quadro: o brilho acompanha a fala. Estável (useCallback). */
  lerNivel?: (() => number) | null
}) {
  const estadoDoPar = ESTADO_DO_PAR[fase]
  const mostrarVideo = !!stream && camLigada && fase !== 'perdido'
  const raiz = useRef<HTMLDivElement>(null)
  useBrilhoDaVoz(raiz, micLigado ? lerNivel : null)
  return (
    <motion.div
      ref={raiz}
      // O brilho é uma sombra; o anel da mão (também sombra) vai junto, senão um apagaria o outro.
      style={
        lerNivel
          ? {
              boxShadow: [
                mao ? '0 0 0 2px rgb(10 10 10), 0 0 0 4px rgb(252 211 77)' : null,
                '0 0 calc(var(--voz, 0) * 30px) calc(var(--voz, 0) * 3px) hsl(var(--primary) / calc(var(--voz, 0) * 0.75))',
              ]
                .filter(Boolean)
                .join(', '),
            }
          : undefined
      }
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onDoubleClick={aoFixar}
      className={cn(
        'group/quadro relative h-full w-full overflow-hidden rounded-2xl bg-neutral-900',
        // Sem leitor de nível (par sem áudio ainda): o anel de antes, por `falando`.
        !lerNivel && falando && 'ring-2 ring-primary ring-offset-2 ring-offset-neutral-950',
        !lerNivel && mao && !falando && 'ring-2 ring-amber-300 ring-offset-2 ring-offset-neutral-950',
      )}
    >
      {/* Brilho de quem fala: anel e reflexo de vidro na intensidade da voz (variável --voz). */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[4] rounded-2xl"
        style={{
          boxShadow:
            'inset 0 0 0 calc(var(--voz, 0) * 4px) hsl(var(--primary) / calc(0.4 + var(--voz, 0) * 0.6)), inset 0 0 calc(var(--voz, 0) * 46px) hsl(var(--primary) / calc(var(--voz, 0) * 0.5))',
          background: 'linear-gradient(145deg, rgb(255 255 255 / calc(var(--voz, 0) * 0.24)) 0%, rgb(255 255 255 / 0) 42%)',
        }}
      />
      {mostrarVideo ? (
        <VideoAoVivo stream={stream} versao={versao} espelhar={espelhar} contain={contain} rotulo={eu ? 'Sua câmera' : `Câmera de ${nome}`} />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="rounded-[32%] transition-transform duration-75" style={{ transform: 'scale(calc(1 + var(--voz, 0) * 0.1))', boxShadow: '0 0 calc(var(--voz, 0) * 34px) hsl(var(--primary) / calc(var(--voz, 0) * 0.8))' }}>
            <Avatar nome={nome} url={foto} tamanho={pequeno ? 40 : 96} className={cn('shadow-lg shadow-black/40', !lerNivel && falando && 'ring-2 ring-primary')} />
          </span>
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

      {selo && (
        <span className={cn('absolute left-2 top-2 rounded-full bg-black/60 font-medium text-white backdrop-blur', pequeno ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs')} title="Efeito de voz ligado">
          {selo}
        </span>
      )}

      {videoPausado && fase === 'conectado' && !pequeno && (
        <span className="absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-3 py-1 text-xs text-white">Vídeo pausado para manter o áudio</span>
      )}

      {(mao || fixado) && (
        <span className="absolute right-2 top-2 inline-flex items-center gap-1">
          {fixado && !pequeno && (
            <span className="rounded-full bg-black/55 p-1.5 text-white" title="Fixado no palco">
              <Pin className="h-3.5 w-3.5" aria-label="fixado no palco" />
            </span>
          )}
          {mao && (
            <motion.span
              initial={{ scale: 0, y: 8 }}
              animate={{ scale: 1, y: 0, rotate: [0, -16, 14, -10, 0] }}
              transition={{ scale: { type: 'spring', stiffness: 500, damping: 15 }, rotate: { duration: 0.9, repeat: Infinity, repeatDelay: 1.4 } }}
              className="inline-flex rounded-full bg-amber-300 p-1.5 text-neutral-950 shadow-lg shadow-amber-300/40"
              title="Mão levantada"
            >
              <Hand className={pequeno ? 'h-3 w-3' : 'h-4 w-4'} aria-label="mão levantada" />
            </motion.span>
          )}
        </span>
      )}

      <div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between gap-2 sm:inset-x-2 sm:bottom-2">
        <span
          className={cn(
            'inline-flex min-w-0 items-center gap-1.5 rounded-lg bg-black/55 px-2 py-1 text-white ring-white/30 transition-all duration-200',
            'group-data-[falando=sim]/quadro:bg-white/15 group-data-[falando=sim]/quadro:ring-1 group-data-[falando=sim]/quadro:backdrop-blur-md',
            pequeno ? 'text-[11px]' : 'text-xs',
          )}
        >
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
    </motion.div>
  )
}

/**
 * Tela compartilhada. Texto pequeno de slide é ilegível num celular: botões de
 * zoom e toque duplo ampliam, e arrastar move (rolagem nativa, sem biblioteca).
 */
function PalcoDaTela({
  stream,
  versao,
  legenda,
  zoomavel,
  acao,
  anotacao,
}: {
  stream: MediaStream | null
  versao: number
  legenda: string
  zoomavel: boolean
  acao?: React.ReactNode
  /** Traços por cima da tela; `pode` = eu posso riscar (monitor ou dono da tela). */
  anotacao?: { tracos: Traco[]; pode: boolean; meuPid: string | null; aoAnotar: (m: MensagemDeAnotacao) => void }
}) {
  const [zoom, setZoom] = useState(1)
  const [alvo, setAlvo] = useState<HTMLDivElement | null>(null)
  const [anotando, setAnotando] = useState(false)
  const anotador = useAnotador(anotacao?.meuPid ?? null, anotacao?.tracos ?? [], anotacao?.aoAnotar ?? (() => {}))
  const desenhando = anotando && !!anotacao?.pode
  useEffect(() => {
    if (!anotacao?.pode) setAnotando(false)
  }, [anotacao?.pode])
  const caixa = useRef<HTMLDivElement>(null)
  const ultimoToque = useRef(0)
  useEffect(() => {
    const el = caixa.current
    if (!el) return
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
    el.scrollTop = (el.scrollHeight - el.clientHeight) / 2
  }, [zoom])
  const alternar = () => zoomavel && !desenhando && setZoom((z) => (z === 1 ? 2 : 1))
  return (
    <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-black">
      <div
        ref={caixa}
        className="h-full w-full overflow-auto overscroll-contain [touch-action:pan-x_pan-y]"
        onDoubleClick={alternar}
        onTouchEnd={(e) => {
          const agora = Date.now()
          if (agora - ultimoToque.current < 300) {
            e.preventDefault()
            alternar()
          }
          ultimoToque.current = agora
        }}
      >
        <div ref={setAlvo} className="relative" style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}>
          <VideoAoVivo stream={stream} versao={versao} contain rotulo={legenda} />
          {anotacao && (
            <CamadaDeAnotacao alvo={alvo} tracos={anotacao.tracos} desenhando={desenhando} ferramenta={anotador.ferramenta} cor={anotador.cor} aoAnotar={anotacao.aoAnotar} />
          )}
        </div>
      </div>
      {anotacao?.pode &&
        (desenhando ? (
          <div className="absolute left-1/2 top-2.5 z-10 -translate-x-1/2">
            <FerramentasDeAnotacao
              ferramenta={anotador.ferramenta}
              cor={anotador.cor}
              aoFerramenta={anotador.setFerramenta}
              aoCor={anotador.setCor}
              aoDesfazer={anotador.desfazer}
              aoLimpar={anotador.limpar}
              aoFechar={() => setAnotando(false)}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAnotando(true)}
            className="absolute right-2.5 top-2.5 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-neutral-900/60 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-xl hover:bg-neutral-900/80"
          >
            <Highlighter className="h-3.5 w-3.5" aria-hidden /> Anotar na tela
          </button>
        ))}
      <span className="absolute bottom-3 left-3 max-w-[60%] truncate rounded-lg bg-black/60 px-2 py-1 text-xs text-white">{legenda}</span>
      {acao}
      {zoomavel && (
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-0.5 rounded-full bg-black/65 p-1 text-white">
          <button type="button" onClick={() => setZoom((z) => Math.max(1, z - 0.5))} disabled={zoom <= 1} aria-label="Diminuir o zoom da tela" className="inline-flex h-8 w-8 touch-manipulation items-center justify-center rounded-full hover:bg-white/15 disabled:opacity-40">
            <Minus className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setZoom(1)} className="w-11 text-center text-xs tabular-nums" aria-label="Voltar ao tamanho normal">
            {Math.round(zoom * 100)}%
          </button>
          <button type="button" onClick={() => setZoom((z) => Math.min(3, z + 0.5))} disabled={zoom >= 3} aria-label="Aumentar o zoom da tela" className="inline-flex h-8 w-8 touch-manipulation items-center justify-center rounded-full hover:bg-white/15 disabled:opacity-40">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Painéis ────────────────────────────────────────────────────────────

const TITULO_DO_PAINEL: Record<Painel, string> = { chat: 'Chat da aula', pessoas: 'Pessoas', anotacoes: 'Minhas anotações' }

function CascaDoPainel({ painel, aoFechar, children }: { painel: Painel; aoFechar: () => void; children: React.ReactNode }) {
  return (
    <motion.aside
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className="absolute inset-x-0 bottom-0 z-20 flex max-h-[78%] min-h-[45%] flex-col rounded-t-2xl border-t border-white/10 bg-neutral-900 shadow-2xl sm:static sm:z-auto sm:ml-3 sm:max-h-none sm:min-h-0 sm:w-80 sm:shrink-0 sm:rounded-2xl sm:border lg:w-96"
      aria-label={TITULO_DO_PAINEL[painel]}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold">{TITULO_DO_PAINEL[painel]}</h2>
        <button type="button" onClick={aoFechar} aria-label={`Fechar ${TITULO_DO_PAINEL[painel].toLowerCase()}`} className="inline-flex h-9 w-9 touch-manipulation items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      {children}
    </motion.aside>
  )
}

function PainelDeChat({ estado, ctrl }: { estado: EstadoDaSalaNaTela; ctrl: ControladorDaSala }) {
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const fim = useRef<HTMLDivElement>(null)
  const pausado = estado.eu?.papel === 'aluno' && !estado.permissoes.chatAlunos
  useEffect(() => {
    fim.current?.scrollIntoView({ block: 'nearest' })
  }, [estado.chat.length])
  async function enviar() {
    if (!texto.trim() || enviando || pausado) return
    setEnviando(true)
    setErro('')
    const falha = await ctrl.enviarChat(texto)
    setEnviando(false)
    if (falha) setErro(falha)
    else setTexto('')
  }
  return (
    <>
      <div className="min-h-[120px] flex-1 space-y-2 overflow-y-auto px-4 py-3" aria-live="polite">
        {estado.chat.length === 0 ? (
          <p className="text-xs leading-relaxed text-white/60">
            As mensagens ficam guardadas no chat da reserva. Telefone, e-mail, links e redes sociais não são enviados: tudo combinado por aqui tem garantia.
          </p>
        ) : (
          estado.chat.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className={cn('max-w-[90%] rounded-2xl px-3 py-2 text-sm', m.minha ? 'ml-auto rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md bg-white/10')}
            >
              {!m.minha && <p className="mb-0.5 text-[11px] font-semibold text-white/70">{m.nome}</p>}
              <p className="whitespace-pre-line break-words">{m.texto}</p>
              <p className={cn('mt-0.5 text-[10px]', m.minha ? 'text-primary-foreground/70' : 'text-white/50')}>{horaEmBrasilia(m.em)}</p>
            </motion.div>
          ))
        )}
        <div ref={fim} />
      </div>
      <div className="border-t border-white/10 p-3">
        {erro && <p className="mb-2 text-xs leading-relaxed text-amber-200">{erro}</p>}
        {pausado ? (
          <p className="rounded-xl bg-white/5 px-3 py-2.5 text-xs text-white/70">O monitor pausou o chat dos alunos durante a aula. Para falar, levante a mão.</p>
        ) : (
          <div className="flex items-end gap-2">
            <label className="sr-only" htmlFor="chat-da-aula">
              Mensagem
            </label>
            <textarea
              id="chat-da-aula"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  void enviar()
                }
              }}
              rows={1}
              maxLength={2000}
              enterKeyHint="send"
              placeholder="Escreva uma mensagem…"
              className="campo-sem-zoom min-h-[44px] flex-1 resize-none rounded-xl border border-white/15 bg-neutral-950 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <button
              type="button"
              onClick={() => void enviar()}
              disabled={enviando || !texto.trim()}
              aria-label="Enviar mensagem"
              className="inline-flex h-11 w-11 touch-manipulation items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
            >
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>
    </>
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
        className="max-h-[90%] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/10 bg-neutral-900 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-white shadow-2xl sm:rounded-3xl"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-semibold">{titulo}</h2>
          <button type="button" onClick={aoFechar} aria-label="Fechar" className="inline-flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ItemDaFolha({ icone: Icone, rotulo, detalhe, onClick, ativo }: { icone: typeof Mic; rotulo: string; detalhe?: string; onClick: () => void; ativo?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={ativo} className="flex w-full touch-manipulation items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-white/5 active:bg-white/10">
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', ativo ? 'bg-primary text-primary-foreground' : 'bg-white/10')}>
        <Icone className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{rotulo}</span>
        {detalhe && <span className="block text-xs text-white/55">{detalhe}</span>}
      </span>
    </button>
  )
}

// ─── A sala ─────────────────────────────────────────────────────────────

export function SalaChamada({ ctrl, estado, titulo, fim }: { ctrl: ControladorDaSala; estado: EstadoDaSalaNaTela; titulo: string; fim: string | null }) {
  const [painel, setPainel] = useState<Painel | null>(null)
  const [mais, setMais] = useState(false)
  const [ajustes, setAjustes] = useState(false)
  const [efeitosAbertos, setEfeitosAbertos] = useState(false)
  const [confirmarSaida, setConfirmarSaida] = useState(false)
  const [audioBloqueado, setAudioBloqueado] = useState(false)
  const [anuncio, setAnuncio] = useState('')
  const [erroDoMonitor, setErroDoMonitor] = useState('')
  const [pipNoTopo, setPipNoTopo] = useState(false)
  const [fixado, setFixado] = useState<string | null>(null)
  const [maoNova, setMaoNova] = useState<string | null>(null)
  const [oferecerBarra, setOferecerBarra] = useState(false)
  const janela = useJanelaFlutuante()
  const fecharJanela = janela.fechar
  // Saiu da sala: a barra flutuante fecha junto.
  useEffect(() => () => fecharJanela(), [fecharJanela])
  const { altura, topo } = useViewportVisivel()
  const emPe = useCelularEmPe()

  const ehMonitor = estado.eu?.papel === 'monitor'
  const remotos = estado.participantes
  const micLigado = estado.local.mic === 'ligado'
  const camLigada = estado.local.cam === 'ligado'
  const compartilhando = !!estado.local.tela
  const telaRemota = remotos.find((p) => p.compartilhando && p.tela)
  const chatNaSala = !!estado.config?.chatNaSala
  const podeTela = estado.podeCompartilhar && !!estado.config?.compartilharTela && (ehMonitor || estado.permissoes.telaAlunos)
  const maosLevantadas = remotos.filter((p) => p.mao).length
  const vozComEfeito = estado.efeitos.voz !== 'nenhum' ? EFEITOS_DE_VOZ.find((e) => e.id === estado.efeitos.voz) : undefined
  const aoBloquear = useCallback(() => setAudioBloqueado(true), [])

  // Compartilhar a tela já tenta abrir a barra flutuante (para controlar e
  // anotar de fora da aba). Sem o gesto ainda valendo, oferece o botão.
  const alternarTela = async () => {
    const ia = !estado.local.tela
    await ctrl.alternarTela()
    if (ia && janela.suportada && !janela.aberta && ctrl.obter().local.tela) {
      if (!(await janela.abrir())) setOferecerBarra(true)
    }
  }
  useEffect(() => {
    if (!estado.local.tela || janela.aberta) setOferecerBarra(false)
  }, [estado.local.tela, janela.aberta])

  // Controles do sistema (central de mídia e o PiP automático do Chrome ao
  // trocar de aba numa videochamada): microfone, câmera, desligar, barra flutuante.
  const abrirJanela = janela.abrir
  useEffect(() => {
    const ms = typeof navigator !== 'undefined' ? (navigator.mediaSession as (MediaSession & { setActionHandler: (a: string, h: (() => void) | null) => void }) | undefined) : undefined
    if (!ms) return
    const acoes: Array<[string, () => void]> = [
      ['togglemicrophone', () => void ctrl.alternarMic()],
      ['togglecamera', () => void ctrl.alternarCam()],
      ['hangup', () => ctrl.sair()],
    ]
    if (janela.suportada) acoes.push(['enterpictureinpicture', () => void abrirJanela()])
    for (const [acao, fn] of acoes) {
      try {
        ms.setActionHandler(acao, fn)
      } catch {
        /* ação desconhecida neste navegador */
      }
    }
    return () => {
      for (const [acao] of acoes) {
        try {
          ms.setActionHandler(acao, null)
        } catch {
          /* nada */
        }
      }
    }
  }, [ctrl, janela.suportada, abrirJanela])
  useEffect(() => {
    const ms = typeof navigator !== 'undefined' ? (navigator.mediaSession as (MediaSession & { setMicrophoneActive?: (v: boolean) => void; setCameraActive?: (v: boolean) => void }) | undefined) : undefined
    try {
      ms?.setMicrophoneActive?.(micLigado)
      ms?.setCameraActive?.(camLigada)
    } catch {
      /* sem suporte */
    }
  }, [micLigado, camLigada])

  // Brilho de quem fala: o meu vem do microfone cru (analisador local); o dos
  // outros, do receptor de áudio de cada um. Leitores estáveis por pessoa.
  const medidor = useRef<ReturnType<typeof criarMedidor> | null>(null)
  useEffect(() => {
    const trilha = estado.local.audio
    if (!trilha) return
    const m = criarMedidor(trilha)
    medidor.current = m
    return () => {
      m.parar()
      if (medidor.current === m) medidor.current = null
    }
  }, [estado.local.audio])
  const lerMeuNivel = useCallback(() => medidor.current?.ler() ?? 0, [])
  const leitores = useRef(new Map<string, () => number>())
  const lerNivelDe = (pid: string) => {
    let ler = leitores.current.get(pid)
    if (!ler) {
      ler = () => Math.min(1, ctrl.nivelDeAudio(pid) * 3.5)
      leitores.current.set(pid, ler)
    }
    return ler
  }
  const alternarPainel = (p: Painel) => setPainel((atual) => (atual === p ? null : p))

  useEffect(() => {
    ctrl.definirChatAberto(painel === 'chat')
  }, [painel, ctrl])

  // Fixado que saiu da sala deixa de estar fixado.
  useEffect(() => {
    if (fixado && !remotos.some((p) => p.pid === fixado)) setFixado(null)
  }, [fixado, remotos])

  // Aviso passageiro do controlador (aparelho desconectado, pedido do monitor…).
  useEffect(() => {
    if (!estado.aviso) return
    const t = setTimeout(() => ctrl.limparAviso(), 6_000)
    return () => clearTimeout(t)
  }, [estado.aviso, ctrl])

  // Atalhos: Ctrl/⌘+D microfone, Ctrl/⌘+E câmera, Ctrl/⌘+Alt+H mão (os de outras salas de vídeo).
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey) return
      const alvo = e.target as HTMLElement | null
      if (alvo && (alvo.tagName === 'TEXTAREA' || alvo.tagName === 'INPUT' || alvo.isContentEditable)) return
      const k = e.key.toLowerCase()
      if (e.altKey) {
        if (k === 'h' || e.code === 'KeyH') {
          e.preventDefault()
          ctrl.alternarMao()
        }
        return
      }
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

  // Leitor de tela e faixa do monitor: quem entrou, saiu ou levantou a mão.
  const anteriores = useRef<Map<string, { nome: string; mao: boolean }>>(new Map())
  useEffect(() => {
    const agora = new Map(remotos.map((p) => [p.pid, { nome: p.nome, mao: p.mao }]))
    const partes: string[] = []
    let novaMao: string | null = null
    for (const [pid, p] of agora) {
      const antes = anteriores.current.get(pid)
      if (!antes) partes.push(`${p.nome} entrou na sala.`)
      else if (p.mao && !antes.mao) {
        // Para o monitor, a faixa (role=status) já anuncia; aqui não repete.
        if (!ehMonitor) partes.push(`${p.nome} levantou a mão.`)
        novaMao = p.nome
      }
    }
    for (const [pid, p] of anteriores.current) if (!agora.has(pid)) partes.push(`${p.nome} saiu da sala.`)
    anteriores.current = agora
    if (partes.length) setAnuncio(partes.join(' '))
    if (novaMao && ehMonitor) setMaoNova(novaMao)
  }, [remotos, ehMonitor])
  useEffect(() => {
    if (!maoNova) return
    const t = setTimeout(() => setMaoNova(null), 7_000)
    return () => clearTimeout(t)
  }, [maoNova])

  const pior = useMemo<'boa' | 'instavel' | 'fraca'>(() => {
    const conectados = remotos.filter((p) => p.fase === 'conectado')
    if (conectados.some((p) => p.conexao === 'fraca')) return 'fraca'
    if (conectados.some((p) => p.conexao === 'instavel')) return 'instavel'
    return 'boa'
  }, [remotos])
  const reconectando = remotos.filter((p) => p.fase === 'instavel' || p.fase === 'reiniciando')
  const nomeDoEsperado = ehMonitor ? 'os alunos' : 'o monitor'

  const meuQuadro = (pequeno: boolean) => (
    <Quadro
      nome={estado.eu?.nome || 'Você'}
      foto={estado.eu?.foto}
      stream={estado.local.camera}
      versao={estado.local.versao}
      camLigada={camLigada}
      micLigado={micLigado}
      mao={estado.mao}
      eu
      espelhar={espelharPrevia(estado.efeitos.video)}
      selo={vozComEfeito ? `${vozComEfeito.emoji} ${pequeno ? '' : vozComEfeito.rotulo}`.trim() : undefined}
      pequeno={pequeno}
      lerNivel={lerMeuNivel}
    />
  )
  const quadroDe = (p: ParticipanteNaTela, opcoes: { pequeno?: boolean; contain?: boolean } = {}) => (
    <Quadro
      key={p.pid}
      nome={p.nome}
      foto={p.foto}
      papel={p.papel}
      stream={p.camera}
      versao={p.versaoDasTrilhas}
      camLigada={p.cam}
      micLigado={p.mic}
      fase={p.fase}
      conexao={p.conexao}
      falando={p.falando}
      videoPausado={p.videoPausado}
      mao={p.mao}
      fixado={fixado === p.pid}
      contain={opcoes.contain}
      pequeno={opcoes.pequeno}
      aoTentar={() => ctrl.tentarDeNovo(p.pid)}
      aoFixar={() => setFixado((f) => (f === p.pid ? null : p.pid))}
      lerNivel={p.fase === 'conectado' ? lerNivelDe(p.pid) : null}
    />
  )
  const faixaDeMiniaturas = (lista: ParticipanteNaTela[]) => (
    <div className="flex h-24 shrink-0 gap-2 overflow-x-auto sm:h-28 lg:h-auto lg:w-56 lg:flex-col lg:overflow-y-auto">
      {lista.map((p) => (
        <div key={p.pid} className="aspect-video h-full shrink-0 lg:h-auto lg:w-full">
          {quadroDe(p, { pequeno: true })}
        </div>
      ))}
      <div className="aspect-video h-full shrink-0 lg:h-auto lg:w-full">{meuQuadro(true)}</div>
    </div>
  )

  const aoAnotar = useCallback((m: MensagemDeAnotacao) => ctrl.anotar(m), [ctrl])
  const anotacaoDoPalco = { tracos: estado.tracos, pode: ctrl.possoAnotar, meuPid: estado.eu?.pid ?? null, aoAnotar }
  const nomeDe = (pid: string) => (pid === estado.eu?.pid ? 'Você' : remotos.find((p) => p.pid === pid)?.nome || 'Alguém')

  const destaque = fixado ? remotos.find((p) => p.pid === fixado) : undefined
  let palco: React.ReactNode
  if (telaRemota || compartilhando) {
    palco = (
      <div className="flex h-full flex-col gap-2 lg:flex-row">
        {telaRemota ? (
          <PalcoDaTela stream={telaRemota.tela} versao={telaRemota.versaoDasTrilhas} legenda={`Tela de ${telaRemota.nome}`} zoomavel anotacao={anotacaoDoPalco} />
        ) : (
          <PalcoDaTela
            stream={estado.local.tela}
            versao={estado.local.versao}
            legenda="Você está compartilhando a tela"
            zoomavel={false}
            anotacao={anotacaoDoPalco}
            acao={
              <button type="button" onClick={() => void alternarTela()} className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500">
                <ScreenShareOff className="h-3.5 w-3.5" aria-hidden /> Parar
              </button>
            }
          />
        )}
        {faixaDeMiniaturas(remotos)}
      </div>
    )
  } else if (destaque && remotos.length > 1) {
    palco = (
      <div className="flex h-full flex-col gap-2 lg:flex-row">
        <div className="min-h-0 flex-1">{quadroDe(destaque, { contain: emPe })}</div>
        {faixaDeMiniaturas(remotos.filter((p) => p.pid !== destaque.pid))}
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
        {/* Celular em pé e vídeo deitado: mostra o quadro inteiro, sem cortar o rosto. */}
        {quadroDe(remotos[0], { contain: emPe })}
        <button
          type="button"
          onClick={() => setPipNoTopo((v) => !v)}
          aria-label="Mover sua câmera"
          className={cn(
            'absolute right-2 w-24 overflow-hidden rounded-xl shadow-2xl ring-1 ring-white/15 sm:right-3 sm:w-44 lg:w-52',
            emPe ? 'aspect-[3/4]' : 'aspect-video',
            pipNoTopo ? 'top-2 sm:top-3' : 'bottom-2 sm:bottom-3',
          )}
        >
          {meuQuadro(true)}
        </button>
      </div>
    )
  } else {
    const total = remotos.length + 1
    palco = (
      <div className={cn('grid h-full auto-rows-fr gap-2', total >= 4 ? 'grid-cols-2' : 'grid-cols-1 min-[480px]:grid-cols-2')}>
        {remotos.map((p) => quadroDe(p))}
        {meuQuadro(false)}
      </div>
    )
  }

  const monitorNome = estado.reserva?.monitor || remotos.find((p) => p.papel === 'monitor')?.nome || (ehMonitor ? estado.eu?.nome || '' : '')
  const codigo = (estado.reserva?.id || '').slice(-6).toUpperCase()

  return (
    <div
      className="fixed inset-x-0 top-0 z-[1000] flex h-screen flex-col overflow-hidden bg-neutral-950 text-white supports-[height:100dvh]:h-[100dvh]"
      style={altura ? { top: topo, height: altura } : undefined}
    >
      <p className="sr-only" aria-live="polite">
        {anuncio}
      </p>
      {remotos.map((p) => (
        <AudioRemoto key={p.pid} stream={p.camera} versao={p.versaoDasTrilhas} saidaId={estado.prefs.saidaId} aoBloquear={aoBloquear} />
      ))}

      {/* Topo */}
      <header className="flex h-14 shrink-0 items-center gap-2.5 px-3 sm:gap-3 sm:px-4 [@media(max-height:480px)]:h-11">
        <MarcaNoTopo />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold">{titulo}</h1>
          {fim && <p className="truncate text-xs text-white/60 [@media(max-height:480px)]:hidden">Termina às {horaEmBrasilia(fim)}</p>}
        </div>
        {remotos.some((p) => p.fase === 'conectado') && (
          <span className="inline-flex items-center gap-1.5 text-xs text-white/75" title={ROTULO_CONEXAO[pior]}>
            <IconeDeConexao nivel={pior} />
            <span className="hidden lg:inline">{ROTULO_CONEXAO[pior]}</span>
            <span className="sr-only lg:hidden">{ROTULO_CONEXAO[pior]}</span>
          </span>
        )}
        <button
          type="button"
          onClick={() => alternarPainel('pessoas')}
          className="relative inline-flex h-9 touch-manipulation items-center gap-1 rounded-lg px-2 text-xs text-white/80 hover:bg-white/10"
          aria-label={`${remotos.length + 1} pessoas na sala${maosLevantadas ? `, ${maosLevantadas} com a mão levantada` : ''}`}
        >
          <Users className="h-4 w-4" aria-hidden />
          <span>{remotos.length + 1}</span>
          {maosLevantadas > 0 && (
            <span className="ml-0.5 inline-flex items-center gap-0.5 rounded-full bg-amber-300 px-1.5 text-[11px] font-semibold text-neutral-950">
              <Hand className="h-3 w-3" aria-hidden />
              {maosLevantadas}
            </span>
          )}
        </button>
      </header>

      {/* Palco + painel */}
      <main className="relative flex min-h-0 flex-1 px-2 pb-2 sm:px-4">
        <div className="relative min-w-0 flex-1">
          {palco}
          {codigo && <MarcaDagua codigo={codigo} monitor={monitorNome} eu={estado.eu?.nome || ''} papel={ehMonitor ? 'monitor' : 'aluno'} />}
          <ReacoesFlutuantes reacoes={estado.reacoes} nomeDe={nomeDe} />
          {/* Resumo por IA: todos sabem quando há voz sendo transcrita; quem é gravado pausa a própria. */}
          {estado.resumo?.ativo && (
            <div className="absolute bottom-2 left-2 z-20">
              <SeloDoResumo resumo={estado.resumo} gravacao={estado.gravacao} onPausar={(sim) => ctrl.pausarTranscricao(sim)} />
            </div>
          )}

          {/* Abaixo da marca d'água até o desktop largo, onde as duas cabem lado a lado. */}
          <div className="pointer-events-none absolute inset-x-0 top-12 z-10 flex flex-col items-center gap-2 px-3 sm:top-14 lg:top-2">
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
            {maoNova && (
              <Faixa
                tom="mao"
                acao={
                  <button type="button" onClick={() => { setPainel('pessoas'); setMaoNova(null) }} className="rounded-lg bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-white">
                    Ver
                  </button>
                }
              >
                <Hand className="mr-1.5 inline h-4 w-4" aria-hidden /> {maoNova} levantou a mão.
              </Faixa>
            )}
            {estado.avisoDeFechamento && estado.fechaEm && <Faixa tom="alerta">A sala fecha às {horaEmBrasilia(estado.fechaEm)}.</Faixa>}
            {ehMonitor && estado.encerrada && (
              <Faixa
                acao={
                  <button type="button" onClick={async () => setErroDoMonitor((await ctrl.encerrarParaTodos(false)) || '')} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900">
                    Reabrir sala
                  </button>
                }
              >
                Você encerrou a aula para os alunos.
              </Faixa>
            )}
            {oferecerBarra && (
              <Faixa
                acao={
                  <span className="flex gap-1.5">
                    <button type="button" onClick={() => void janela.abrir().then((ok) => ok && setOferecerBarra(false))} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900">
                      Abrir
                    </button>
                    <button type="button" onClick={() => setOferecerBarra(false)} className="rounded-lg px-2 py-1.5 text-xs font-semibold text-white/80" aria-label="Agora não">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                }
              >
                <PictureInPicture2 className="mr-1.5 inline h-4 w-4" aria-hidden /> Barra flutuante: controle a aula e anote por cima da tela mesmo fora desta aba.
              </Faixa>
            )}
            {estado.efeitos.pesado && (
              <Faixa
                tom="alerta"
                acao={
                  <button type="button" onClick={() => ctrl.definirEfeitoDeVideo('nenhum')} className="rounded-lg bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-white">
                    Desligar efeito
                  </button>
                }
              >
                O efeito de câmera está pesado para este aparelho: seu vídeo está saindo travado.
              </Faixa>
            )}
            {estado.aviso && <Faixa>{estado.aviso}</Faixa>}
            {erroDoMonitor && <Faixa tom="alerta">{erroDoMonitor}</Faixa>}
          </div>
        </div>

        {painel === 'chat' && chatNaSala && (
          <CascaDoPainel painel="chat" aoFechar={() => setPainel(null)}>
            <PainelDeChat estado={estado} ctrl={ctrl} />
          </CascaDoPainel>
        )}
        {painel === 'pessoas' && (
          <CascaDoPainel painel="pessoas" aoFechar={() => setPainel(null)}>
            <PainelDePessoas estado={estado} ctrl={ctrl} fixado={fixado} aoFixar={setFixado} />
          </CascaDoPainel>
        )}
        {painel === 'anotacoes' && estado.reserva && (
          <CascaDoPainel painel="anotacoes" aoFechar={() => setPainel(null)}>
            <div className="flex min-h-0 flex-1 flex-col p-3">
              <EditorDeAnotacoes reservaId={estado.reserva.id} tema="escuro" className="min-h-0 flex-1" />
            </div>
          </CascaDoPainel>
        )}
      </main>

      {/* Controles: no celular, o essencial; o resto fica em "Mais". */}
      <nav aria-label="Controles da chamada" className="flex shrink-0 items-center justify-center gap-1.5 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 min-[380px]:gap-2 sm:gap-3 [@media(max-height:480px)]:pb-1.5">
        <BotaoDeControle rotulo={micLigado ? 'Desligar microfone' : 'Ligar microfone'} ativo={micLigado} atalho="⌘/Ctrl+D" onClick={() => void ctrl.alternarMic()}>
          {micLigado ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </BotaoDeControle>
        <BotaoDeControle rotulo={camLigada ? 'Desligar câmera' : 'Ligar câmera'} ativo={camLigada} atalho="⌘/Ctrl+E" onClick={() => void ctrl.alternarCam()}>
          {camLigada ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </BotaoDeControle>
        {podeTela && (
          <BotaoDeControle rotulo={compartilhando ? 'Parar de compartilhar a tela' : 'Compartilhar a tela'} ativo={!compartilhando} pressionado={compartilhando} className="hidden sm:inline-flex" onClick={() => void alternarTela()}>
            {compartilhando ? <ScreenShareOff className="h-5 w-5" /> : <ScreenShare className="h-5 w-5" />}
          </BotaoDeControle>
        )}
        {!ehMonitor && (
          <BotaoDeControle rotulo={estado.mao ? 'Baixar a mão' : 'Levantar a mão'} destaque={estado.mao} pressionado={estado.mao} atalho="⌘/Ctrl+Alt+H" onClick={() => ctrl.alternarMao()}>
            <Hand className="h-5 w-5" />
          </BotaoDeControle>
        )}
        {chatNaSala && (
          <BotaoDeControle rotulo="Chat da aula" expandido={painel === 'chat'} contador={painel === 'chat' ? 0 : estado.naoLidas} onClick={() => alternarPainel('chat')}>
            <MessageSquare className="h-5 w-5" />
          </BotaoDeControle>
        )}
        <BotaoDeControle
          rotulo="Pessoas"
          expandido={painel === 'pessoas'}
          contador={ehMonitor ? maosLevantadas : 0}
          className={ehMonitor ? undefined : 'hidden sm:inline-flex'}
          onClick={() => alternarPainel('pessoas')}
        >
          <Users className="h-5 w-5" />
        </BotaoDeControle>
        <BotaoDeControle rotulo="Minhas anotações" expandido={painel === 'anotacoes'} className="hidden sm:inline-flex" onClick={() => alternarPainel('anotacoes')}>
          <PencilLine className="h-5 w-5" />
        </BotaoDeControle>
        <BotaoDeReacoes aoReagir={(e) => ctrl.reagir(e)} className="hidden sm:block" />
        <BotaoDeControle rotulo="Mais opções" expandido={mais} onClick={() => setMais(true)}>
          <MoreHorizontal className="h-5 w-5" />
        </BotaoDeControle>
        <BotaoDeControle rotulo="Sair da aula" perigo onClick={() => setConfirmarSaida(true)}>
          <PhoneOff className="h-5 w-5" />
        </BotaoDeControle>
      </nav>

      {mais && (
        <Dialogo titulo="Mais opções" aoFechar={() => setMais(false)}>
          <FileiraDeReacoes
            aoReagir={(e) => {
              ctrl.reagir(e)
              setMais(false)
            }}
            className="-mx-1 mb-2 justify-between rounded-2xl bg-white/5 p-1 sm:hidden"
          />
          <div className="-mx-2 space-y-0.5">
            <div className="sm:hidden">
              {!ehMonitor && <ItemDaFolha icone={Users} rotulo="Pessoas" detalhe="Quem está na sala e mãos levantadas" onClick={() => { setMais(false); setPainel('pessoas') }} />}
              <ItemDaFolha icone={PencilLine} rotulo="Minhas anotações" detalhe="Salvas sozinhas; baixe em PDF" onClick={() => { setMais(false); setPainel('anotacoes') }} />
              {podeTela && (
                <ItemDaFolha icone={compartilhando ? ScreenShareOff : ScreenShare} rotulo={compartilhando ? 'Parar de compartilhar a tela' : 'Compartilhar a tela'} ativo={compartilhando} onClick={() => { setMais(false); void alternarTela() }} />
              )}
            </div>
            {estado.aparelhos.cameras.length > 1 && camLigada && (
              <ItemDaFolha icone={FlipHorizontal2} rotulo="Virar a câmera" detalhe="Frente ou traseira" onClick={() => { setMais(false); void ctrl.virarCamera() }} />
            )}
            <ItemDaFolha
              icone={Zap}
              rotulo="Economia de dados"
              detalhe={estado.economiaDeDados ? 'Ligada: você não recebe vídeo; o áudio continua' : 'Para de receber vídeo dos outros; o áudio continua'}
              ativo={estado.economiaDeDados}
              onClick={() => ctrl.alternarEconomiaDeDados()}
            />
            <ItemDaFolha
              icone={Wand2}
              rotulo="Efeitos de câmera e voz"
              detalhe={estado.efeitos.video !== 'nenhum' || estado.efeitos.voz !== 'nenhum' ? 'Ligados: toque para trocar' : 'Filtros, molduras e voz de robô'}
              ativo={estado.efeitos.video !== 'nenhum' || estado.efeitos.voz !== 'nenhum'}
              onClick={() => { setMais(false); setEfeitosAbertos(true) }}
            />
            <ItemDaFolha icone={Settings2} rotulo="Câmera, microfone e som" detalhe="Trocar de aparelho e ver a conexão" onClick={() => { setMais(false); setAjustes(true) }} />
            {janela.suportada && (
              <ItemDaFolha
                icone={PictureInPicture2}
                rotulo={janela.aberta ? 'Fechar a barra flutuante' : 'Barra flutuante'}
                detalhe="Controles e anotações por cima de tudo, mesmo fora desta aba"
                ativo={janela.aberta}
                onClick={() => {
                  setMais(false)
                  if (janela.aberta) janela.fechar()
                  else void janela.abrir()
                }}
              />
            )}
            {ehMonitor && estado.reserva?.convite && (
              <ItemDaFolha
                icone={Link2}
                rotulo="Copiar link da aula"
                detalhe={estado.reserva.convite.includes('/teste/') ? 'Convite da sala de teste: quem abrir entra como aluno' : 'Só entra quem tem vaga nesta monitoria'}
                onClick={async () => {
                  setMais(false)
                  if (await copiarLink(estado.reserva!.convite!)) ctrl.avisar('Link da aula copiado!')
                }}
              />
            )}
            {ehMonitor && (
              <ItemDaFolha
                icone={Power}
                rotulo={estado.encerrada ? 'Reabrir a sala para os alunos' : 'Encerrar a aula para todos'}
                detalhe={estado.encerrada ? 'Os alunos podem voltar' : 'Os alunos saem da sala; a reserva não muda'}
                onClick={async () => {
                  setMais(false)
                  setErroDoMonitor((await ctrl.encerrarParaTodos(!estado.encerrada)) || '')
                }}
              />
            )}
          </div>
          <p className="mt-3 text-xs text-white/45">{estado.turn ? 'Se a conexão direta não funcionar, a chamada passa por um servidor de apoio seguro.' : 'Conexão direta entre os participantes.'} A aula não é gravada pela plataforma.</p>
        </Dialogo>
      )}

      {ajustes && (
        <Dialogo titulo="Câmera, microfone e som" aoFechar={() => setAjustes(false)}>
          <div className="space-y-3 [&_label_span]:text-white/60 [&_select]:border-white/15 [&_select]:bg-neutral-950 [&_select]:text-white">
            <SeletorDeAparelho rotulo="Câmera" valor={estado.prefs.camId} opcoes={estado.aparelhos.cameras} aoMudar={(id) => void ctrl.trocarAparelho('cam', id)} />
            <SeletorDeAparelho rotulo="Microfone" valor={estado.prefs.micId} opcoes={estado.aparelhos.microfones} aoMudar={(id) => void ctrl.trocarAparelho('mic', id)} />
            {podeEscolherSaida() && <SeletorDeAparelho rotulo="Alto-falante" valor={estado.prefs.saidaId} opcoes={estado.aparelhos.saidas} aoMudar={(id) => void ctrl.trocarAparelho('saida', id)} />}
            <TesteDeSom trilha={estado.local.audio} micLigado={micLigado} saidaId={estado.prefs.saidaId} tema="escuro" />
            <EstatisticasDaConexao estado={estado} />
          </div>
        </Dialogo>
      )}

      <BarraFlutuante janela={janela.janela} ctrl={ctrl} estado={estado} fim={fim} aoFechar={janela.fechar} />

      {efeitosAbertos && (
        <Dialogo titulo="Efeitos de câmera e voz" aoFechar={() => setEfeitosAbertos(false)}>
          <PainelDeEfeitos ctrl={ctrl} estado={estado} tema="escuro" comPrevia />
        </Dialogo>
      )}

      {estado.pedido && (
        <Dialogo titulo={estado.pedido.acao === 'pedir_mic' ? 'O monitor pediu para você falar' : 'O monitor pediu para ligar a câmera'} aoFechar={() => void ctrl.responderPedido(false)}>
          <p className="text-sm text-white/75">{estado.pedido.acao === 'pedir_mic' ? 'Quer ligar o microfone agora?' : 'Quer ligar a câmera agora?'} Só liga se você aceitar.</p>
          <div className="mt-4 flex flex-col gap-2">
            <button type="button" onClick={() => void ctrl.responderPedido(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
              {estado.pedido.acao === 'pedir_mic' ? <Mic className="h-4 w-4" aria-hidden /> : <Video className="h-4 w-4" aria-hidden />}
              {estado.pedido.acao === 'pedir_mic' ? 'Ligar o microfone' : 'Ligar a câmera'}
            </button>
            <button type="button" onClick={() => void ctrl.responderPedido(false)} className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/5">
              Agora não
            </button>
          </div>
        </Dialogo>
      )}

      {confirmarSaida && (
        <Dialogo titulo="Sair da aula?" aoFechar={() => setConfirmarSaida(false)}>
          <p className="text-sm text-white/75">Sair não cancela nem conclui a monitoria. {estado.fechaEm ? `Você pode voltar até ${horaEmBrasilia(estado.fechaEm)}.` : ''}</p>
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
