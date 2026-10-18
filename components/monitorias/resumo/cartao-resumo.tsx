'use client'

/**
 * Cartão "Resumo por IA" na lateral da reserva.
 *
 * - Comprador: o estado (contratado → transcrevendo → escrevendo → pronto, ou
 *   falhou/reembolsado) e o botão de ler. Consulta a cada 60 s SÓ enquanto
 *   processa e com a aba visível; pronto/encerrado não consulta mais.
 * - Monitor: o lembrete de autorizar a transcrição na sala.
 * - Quem gravou e fechou a aba no meio: os trechos guardados no aparelho são
 *   enviados daqui (sem precisar voltar à sala).
 */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Brain, CheckCircle2, Clock, Loader2, RotateCcw, Sparkles } from 'lucide-react'
import { api } from '@/components/monitorias/base'
import { useIntervaloVisivel } from '@/hooks/use-intervalo-visivel'
import { formatarCentavos } from '@/lib/monitorias/dinheiro'
import type { EstadoDoResumo } from '@/lib/monitorias/resumo/tipos'

const PROCESSANDO = ['transcrevendo', 'resumindo']

export function CartaoDoResumo({ reservaId, tarefa, meu, ehMonitor }: { reservaId: string; tarefa: string; meu: string | null; ehMonitor: boolean }) {
  const [estado, setEstado] = useState<EstadoDoResumo | null>(null)

  const carregar = useCallback(() => {
    if (!meu) return
    api<EstadoDoResumo>(`/api/monitorias/reservas/${reservaId}/resumo`)
      .then(setEstado)
      .catch(() => {})
  }, [reservaId, meu])
  useEffect(() => carregar(), [carregar])

  // Trechos de voz que ficaram no aparelho (aba fechada no meio da aula).
  useEffect(() => {
    if (!['aguardando', 'transcrevendo'].includes(tarefa)) return
    import('@/lib/monitorias/sala/cliente/gravador').then((m) => m.enviarPendentes(reservaId)).catch(() => {})
  }, [reservaId, tarefa])

  const status = estado?.tarefa?.status || tarefa
  useIntervaloVisivel(carregar, meu && PROCESSANDO.includes(status) ? 60_000 : null)

  if (ehMonitor && !meu) {
    return (
      <Moldura>
        <p className="text-sm text-muted-foreground">
          {tarefa === 'aguardando' || tarefa === 'transcrevendo'
            ? 'Um aluno contratou o Resumo por IA desta aula. Ao entrar na sala, você decide se autoriza a transcrição da sua voz (o vídeo nunca é gravado).'
            : tarefa === 'pronto'
              ? 'O resumo desta aula foi entregue a quem contratou.'
              : 'Esta aula não terá resumo por IA.'}
        </p>
      </Moldura>
    )
  }
  if (!estado?.adicional) return meu ? <Moldura><p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</p></Moldura> : null

  const a = estado.adicional
  if (a.status === 'reembolsado' || a.status === 'reembolso_processando') {
    return (
      <Moldura>
        <p className="flex items-start gap-2 text-sm">
          <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <span>
            {a.status === 'reembolsado' ? 'Reembolsado' : 'Reembolso em andamento'}: {formatarCentavos(a.precoCentavos)} (mais a parte dele na taxa do PIX).
            {a.reembolso?.motivo && <span className="block text-xs text-muted-foreground">{a.reembolso.motivo}</span>}
          </span>
        </p>
      </Moldura>
    )
  }
  if (estado.resultado || (a.status === 'entregue' && status === 'pronto')) {
    return (
      <Moldura destaque>
        <p className="flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="h-4 w-4 text-primary" /> Pronto para estudar
        </p>
        {estado.resultado?.titulo && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{estado.resultado.titulo}</p>}
        <Link
          href={`/monitorias/reservas/${reservaId}/resumo`}
          className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-[0_12px_28px_-14px_hsl(var(--primary)/0.9)] transition hover:bg-primary/90"
        >
          <Sparkles className="h-4 w-4" /> Ler o resumo
        </Link>
      </Moldura>
    )
  }
  if (status === 'falhou' || status === 'cancelado') {
    return (
      <Moldura>
        <p className="text-sm text-muted-foreground">{estado.tarefa?.erroPublico || 'Houve um problema com o resumo. A equipe já foi avisada.'}</p>
      </Moldura>
    )
  }
  const etapa = status === 'resumindo' ? 'Escrevendo o seu resumo…' : status === 'transcrevendo' ? 'Transcrevendo a aula…' : null
  return (
    <Moldura>
      {etapa ? (
        <>
          <p className="flex items-center gap-2 text-sm font-medium"><Loader2 className="h-4 w-4 animate-spin text-primary" /> {etapa}</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <motion.div className="h-full w-1/3 rounded-full bg-primary" animate={{ x: ['-100%', '300%'] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Você recebe um aviso quando ficar pronto. Pode fechar esta página.</p>
        </>
      ) : (
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" /> Contratado ({formatarCentavos(a.precoCentavos)}). O resumo fica pronto aqui depois da aula.
        </p>
      )}
    </Moldura>
  )
}

function Moldura({ children, destaque }: { children: React.ReactNode; destaque?: boolean }) {
  return (
    <section className={`rounded-2xl border p-4 ${destaque ? 'border-primary/40 bg-gradient-to-br from-primary/[0.08] to-card' : 'border-border bg-card'}`}>
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Brain className="h-4 w-4 text-primary" /> Resumo por IA
      </p>
      {children}
    </section>
  )
}
