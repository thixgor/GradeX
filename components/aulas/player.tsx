'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Loader2, PlayCircle, X } from 'lucide-react'
import { formatarTempo } from '@/lib/aulas/progresso'
import { cn } from '@/lib/utils'

/**
 * Player da aula, com retomada e progresso automático (§6, §7, §32, §34).
 *
 * UMA LIMITAÇÃO QUE PRECISA FICAR EXPLÍCITA
 *
 * O campo `videoEmbed` guarda duas coisas diferentes:
 *
 *  • uma URL de vídeo → vira `<video>` nativo, e aí dá para ler `currentTime`:
 *    retomada exata, percentual real, conclusão automática;
 *  • um HTML de incorporação (YouTube, Vimeo, Panda…) → vira `<iframe>`, e o
 *    navegador NÃO deixa a página ler o tempo de um vídeo de outro domínio.
 *
 * Para o iframe não existe "continuar de 18:42" sem a API JavaScript de cada
 * provedor — e cada uma tem um contrato próprio. Em vez de inventar um número
 * (contar tempo de página como se fosse tempo assistido, por exemplo), o player
 * é honesto: no iframe ele marca a aula como iniciada e deixa a conclusão na
 * mão do aluno, dizendo isso na tela. Progresso falso é pior que progresso
 * nenhum — o aluno para de confiar na barra e passa a controlar o estudo por
 * fora da plataforma.
 */

/** Intervalo entre gravações durante a reprodução. */
const INTERVALO_SALVAR_MS = 10_000
const CHAVE_VELOCIDADE = 'gx-aula-velocidade'

export interface ControleDoPlayer {
  /** Leva o vídeo até um segundo — usado pelas anotações e capítulos. */
  irPara: (segundo: number) => void
  /** Tempo atual, para carimbar uma anotação nova. */
  tempoAtual: () => number
  /** `false` quando o conteúdo é iframe e não dá para navegar por tempo. */
  navegavel: boolean
}

interface Props {
  aulaId: string
  videoEmbed: string
  posicaoInicial?: number
  duracaoConhecida?: number
  aoRegistrarControle?: (controle: ControleDoPlayer) => void
  aoAtualizarProgresso?: (p: { percentual: number; concluida: boolean }) => void
  className?: string
}

export function PlayerDaAula({
  aulaId,
  videoEmbed,
  posicaoInicial = 0,
  duracaoConhecida,
  aoRegistrarControle,
  aoAtualizarProgresso,
  className,
}: Props) {
  const ehIframe = videoEmbed.trim().startsWith('<')
  const refVideo = useRef<HTMLVideoElement>(null)
  const ultimoSalvo = useRef(0)
  const [ofereceRetomar, setOfereceRetomar] = useState(false)
  const [salvando, setSalvando] = useState(false)

  /** Grava a posição. `beacon` para quando a página está indo embora. */
  const salvar = useCallback(
    (posicaoSegundos: number, duracaoSegundos?: number, beacon = false) => {
      const corpo = JSON.stringify({
        posicaoSegundos: Math.floor(posicaoSegundos),
        ...(duracaoSegundos ? { duracaoSegundos: Math.floor(duracaoSegundos) } : {}),
      })
      const url = `/api/aulas/${aulaId}/progresso`

      // `sendBeacon` sobrevive ao fechamento da aba; um fetch normal seria
      // cancelado no meio e o aluno perderia o ponto onde parou justamente na
      // hora mais comum de sair — fechando o navegador.
      if (beacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([corpo], { type: 'application/json' }))
        return
      }

      setSalvando(true)
      fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: corpo })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.progresso) {
            aoAtualizarProgresso?.({
              percentual: d.progresso.percentual,
              concluida: d.progresso.concluida,
            })
          }
        })
        .catch(() => {})
        .finally(() => setSalvando(false))
    },
    [aulaId, aoAtualizarProgresso],
  )

  /* ── Vídeo nativo: rastreamento completo ────────────────────────────── */

  useEffect(() => {
    if (ehIframe) {
      // Sem posição para ler; registra a passagem para a aula aparecer no
      // HISTÓRICO e o aluno reencontrá-la. Não em "continue de onde parou":
      // com posição sempre 0 não há ponto nenhum para retomar, e anunciar uma
      // retomada que não existe é o que fazia a home oferecer "continuar" um
      // vídeo que ninguém tinha visto (ver `lerEmAndamento`).
      salvar(0, duracaoConhecida)
      return
    }

    const video = refVideo.current
    if (!video) return

    const aoCarregar = () => {
      const velocidade = Number(localStorage.getItem(CHAVE_VELOCIDADE) || 1)
      if (velocidade >= 0.25 && velocidade <= 4) video.playbackRate = velocidade
      // A retomada é oferecida, não imposta: quem abriu para rever do início
      // não quer ser jogado no meio.
      if (posicaoInicial > 15 && posicaoInicial < (video.duration || Infinity) - 20) {
        setOfereceRetomar(true)
      }
    }

    const aoAvancar = () => {
      const agora = Date.now()
      if (agora - ultimoSalvo.current < INTERVALO_SALVAR_MS) return
      ultimoSalvo.current = agora
      salvar(video.currentTime, video.duration)
    }

    const aoPausar = () => salvar(video.currentTime, video.duration)
    const aoTerminar = () => salvar(video.duration, video.duration)
    const aoMudarVelocidade = () => {
      try {
        localStorage.setItem(CHAVE_VELOCIDADE, String(video.playbackRate))
      } catch {
        /* modo privado: só não lembra */
      }
    }
    // A aba sumindo conta como saída: no celular, trocar de app é o jeito mais
    // comum de "sair" e não dispara `pagehide` de imediato.
    const aoEsconder = () => {
      if (document.visibilityState === 'hidden') salvar(video.currentTime, video.duration, true)
    }

    video.addEventListener('loadedmetadata', aoCarregar)
    video.addEventListener('timeupdate', aoAvancar)
    video.addEventListener('pause', aoPausar)
    video.addEventListener('ended', aoTerminar)
    video.addEventListener('ratechange', aoMudarVelocidade)
    document.addEventListener('visibilitychange', aoEsconder)
    window.addEventListener('pagehide', aoEsconder)

    return () => {
      video.removeEventListener('loadedmetadata', aoCarregar)
      video.removeEventListener('timeupdate', aoAvancar)
      video.removeEventListener('pause', aoPausar)
      video.removeEventListener('ended', aoTerminar)
      video.removeEventListener('ratechange', aoMudarVelocidade)
      document.removeEventListener('visibilitychange', aoEsconder)
      window.removeEventListener('pagehide', aoEsconder)
      // Sair da aula é o momento mais provável de perder progresso.
      if (video.currentTime > 0) salvar(video.currentTime, video.duration, true)
    }
  }, [ehIframe, posicaoInicial, duracaoConhecida, salvar])

  /* ── Controle exposto para anotações e capítulos ────────────────────── */

  useEffect(() => {
    aoRegistrarControle?.({
      irPara: (segundo: number) => {
        const video = refVideo.current
        if (!video) return
        video.currentTime = Math.max(0, segundo)
        video.play().catch(() => {})
      },
      tempoAtual: () => refVideo.current?.currentTime || 0,
      navegavel: !ehIframe,
    })
  }, [aoRegistrarControle, ehIframe])

  function retomar() {
    const video = refVideo.current
    if (video) {
      video.currentTime = posicaoInicial
      video.play().catch(() => {})
    }
    setOfereceRetomar(false)
  }

  return (
    <div className={cn('relative', className)}>
      <div className="relative overflow-hidden rounded-xl border border-border bg-black">
        {ehIframe ? (
          <div
            className="aspect-video w-full [&>iframe]:h-full [&>iframe]:w-full"
            dangerouslySetInnerHTML={{ __html: videoEmbed }}
          />
        ) : (
          <video
            ref={refVideo}
            src={videoEmbed}
            controls
            playsInline
            preload="metadata"
            className="aspect-video w-full bg-black"
          />
        )}

        {/* Retomada: proposta discreta sobre o player, nunca um salto
            automático que confunde quem queria recomeçar. */}
        {ofereceRetomar ? (
          <div className="absolute inset-x-3 bottom-16 flex items-center justify-between gap-3 rounded-xl border border-border bg-background/95 p-3 shadow-lg backdrop-blur sm:inset-x-auto sm:left-3 sm:max-w-sm">
            <div className="min-w-0">
              <p className="text-sm font-bold">Você parou em {formatarTempo(posicaoInicial)}</p>
              <p className="text-xs text-muted-foreground">Quer continuar de onde estava?</p>
            </div>
            <div className="flex flex-none items-center gap-1.5">
              <button
                type="button"
                onClick={retomar}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground"
              >
                <PlayCircle className="h-3.5 w-3.5" /> Continuar
              </button>
              <button
                type="button"
                onClick={() => setOfereceRetomar(false)}
                aria-label="Começar do início"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-2 flex min-h-5 items-center gap-2 text-xs text-muted-foreground">
        {salvando ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" /> Salvando progresso…
          </>
        ) : ehIframe ? (
          // Dizer a verdade aqui evita a pergunta "por que não salvou onde eu
          // parei?" — e explica por que existe o botão de concluir manual.
          <>
            <Check className="h-3 w-3" /> Este vídeo é incorporado: marque a aula como concluída
            quando terminar.
          </>
        ) : (
          <>
            <Check className="h-3 w-3" /> Seu progresso é salvo automaticamente.
          </>
        )}
      </div>
    </div>
  )
}
