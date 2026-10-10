'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, CalendarPlus, Check, Clock, Copy, Download, FileText, Hourglass, Loader2, MessagesSquare, PartyPopper, Receipt, Users } from 'lucide-react'
import { PageScaffold } from '@/components/page-scaffold'
import { Button } from '@/components/ui/button'
import { Avatar, CaixaAviso, CaixaErro, Confete, Esqueleto, HoraBrasilia, api } from '@/components/monitorias/base'
import { TermosAceite } from '@/components/monitorias/termos-aceite'
import { AssinaturaContrato } from '@/components/monitorias/assinatura-contrato'
import { PagamentoPix } from '@/components/monitorias/pagamento-pix'
import { baixarIcs, type DetalheReserva } from '@/components/monitorias/tipos-cliente'
import { useIntervaloVisivel } from '@/hooks/use-intervalo-visivel'
import { formatarCentavos } from '@/lib/monitorias/dinheiro'
import { formatarDuracao } from '@/lib/monitorias/agenda'
import { formatarEmBrasilia } from '@/lib/fuso-brasilia'
import { cn } from '@/lib/utils'

const PASSOS = ['Revisar', 'Contrato', 'Pagar', 'Confirmado'] as const

export default function CheckoutMonitoria({ params }: { params: { reservaId: string } }) {
  const reduzir = useReducedMotion()
  const [d, setD] = useState<DetalheReserva | null>(null)
  const [erro, setErro] = useState('')
  const [revisado, setRevisado] = useState(false)
  const [termosOk, setTermosOk] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const carregar = useCallback(() => {
    api<DetalheReserva>(`/api/monitorias/reservas/${params.reservaId}`)
      .then(setD)
      .catch((e) => setErro(e.message))
  }, [params.reservaId])

  useEffect(() => {
    carregar()
  }, [carregar])

  const assento = d?.meuAssento
  const passo = useMemo(() => {
    if (!d || !assento) return 0
    if (['paga', 'gratis', 'concluida'].includes(assento.status)) return 3
    if (assento.status === 'aguardando_pagamento') return 2
    if (assento.status === 'aguardando_assinatura') return revisado ? 1 : 0
    return 0
  }, [d, assento, revisado])

  // Só espera aqui a assinatura do MONITOR (o passo do PIX tem o próprio
  // acompanhamento, mais leve, em <PagamentoPix>): nada de dois relógios.
  const k = d?.meuContrato
  const esperando = !!d && passo === 1 && !!k && !k.falta.includes('contratante') && k.falta.includes('contratado')
  // Esperando o monitor assinar: pergunta só a VERSÃO da reserva (rota leve,
  // a mesma do chat) e recarrega tudo apenas quando ela muda.
  const [desde] = useState(() => new Date().toISOString())
  const versaoVista = d?.versao
  const espiar = useCallback(() => {
    api<{ versao: number }>(`/api/monitorias/reservas/${params.reservaId}/mensagens?depois=${encodeURIComponent(desde)}`)
      .then((x) => {
        if (x.versao !== versaoVista) carregar()
      })
      .catch(() => {})
  }, [params.reservaId, desde, versaoVista, carregar])
  useIntervaloVisivel(espiar, esperando ? 8000 : null)

  if (erro) return <PageScaffold><CaixaErro mensagem={erro} className="mx-auto mt-10 max-w-md" /></PageScaffold>
  if (!d) return <PageScaffold><Esqueleto className="mx-auto h-[520px] max-w-2xl rounded-3xl" /></PageScaffold>

  const r = d.reserva
  const p = r.proposta
  const encerrada = ['expirada', 'cancelada_aluno', 'cancelada_monitor', 'recusada', 'reembolsada'].includes(r.status)
  const urlSala = `/monitorias/reservas/${r.id}`
  const linkConvite = r.codigoConvite && typeof window !== 'undefined' ? `${window.location.origin}/monitorias/convite/${r.codigoConvite}` : ''

  return (
    <PageScaffold>
      <div className="mx-auto max-w-2xl">
        <Link href={urlSala} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Voltar para a reserva
        </Link>

        {/* Passos */}
        <ol className="mb-6 grid grid-cols-4 gap-2">
          {PASSOS.map((nome, i) => (
            <li key={nome} className="flex flex-col items-center gap-1.5 text-center">
              <motion.span
                animate={{ scale: i === passo ? 1.1 : 1 }}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors',
                  i < passo ? 'border-primary bg-primary text-primary-foreground' : i === passo ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground',
                )}
              >
                {i < passo ? <Check className="h-4 w-4" /> : i + 1}
              </motion.span>
              <span className={cn('text-[11px] font-medium', i <= passo ? 'text-foreground' : 'text-muted-foreground')}>{nome}</span>
            </li>
          ))}
        </ol>

        {!encerrada && assento && passo < 2 && r.prazoPagamento && <HorarioGuardado ate={r.prazoPagamento} slug={r.anuncioSlug} />}

        {encerrada ? (
          <CaixaErro mensagem="Esta reserva foi encerrada. Volte ao anúncio para agendar de novo." />
        ) : !assento ? (
          <CaixaAviso>Você não tem um assento nesta reserva.</CaixaAviso>
        ) : (
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={passo}
                initial={reduzir ? false : { opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduzir ? undefined : { opacity: 0, x: -24 }}
                transition={{ duration: 0.28 }}
              >
                {passo === 0 && (
                  <div className="space-y-5">
                    <h1 className="font-heading text-xl font-bold">Confira sua monitoria</h1>
                    <div className="flex items-center gap-3">
                      <Avatar nome={d.monitor?.nome || '?'} url={d.monitor?.fotoUrl} tamanho={52} />
                      <div>
                        <p className="font-semibold">{r.anuncioTitulo}</p>
                        <p className="text-sm text-muted-foreground">com {d.monitor?.nome}</p>
                      </div>
                    </div>
                    {p && (
                      <dl className="grid gap-3 rounded-2xl bg-muted/40 p-4 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-xs text-muted-foreground">Quando</dt>
                          <dd className="font-semibold">{formatarEmBrasilia(p.inicio, { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}</dd>
                          <HoraBrasilia />
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Duração</dt>
                          <dd className="flex items-center gap-1 font-semibold"><Clock className="h-4 w-4 text-primary" /> {formatarDuracao(p.duracaoMin)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Alunos</dt>
                          <dd className="flex items-center gap-1 font-semibold"><Users className="h-4 w-4 text-primary" /> {p.vagas === 1 ? 'Individual' : `Grupo de ${p.vagas}`}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Valor {p.vagas > 1 ? 'por pessoa' : ''}</dt>
                          <dd className="font-heading text-lg font-bold">{p.gratis ? 'Grátis' : formatarCentavos(assento.valorCentavos)}</dd>
                        </div>
                        {p.conteudos.length > 0 && (
                          <div className="sm:col-span-2">
                            <dt className="text-xs text-muted-foreground">Conteúdos</dt>
                            <dd className="mt-1 flex flex-wrap gap-1">{p.conteudos.map((c) => <span key={c} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{c}</span>)}</dd>
                          </div>
                        )}
                      </dl>
                    )}
                    {r.prazoPagamento && new Date(r.prazoPagamento).getTime() - Date.now() > 60 * 60_000 && (
                      <CaixaAviso>Este horário está reservado para você até <strong>{formatarEmBrasilia(r.prazoPagamento, { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</strong> (Brasília). Conclua as etapas antes disso.</CaixaAviso>
                    )}
                    <Button className="h-12 w-full rounded-xl text-base font-semibold" onClick={() => setRevisado(true)}>
                      Está tudo certo, continuar
                    </Button>
                  </div>
                )}

                {passo === 1 && d.meuContrato && (
                  <div className="space-y-5">
                    <div>
                      <h1 className="font-heading text-xl font-bold">Assine o contrato</h1>
                      <p className="text-sm text-muted-foreground">Contrato de prestação de serviços entre você e o monitor. Leva 1 minuto.</p>
                    </div>
                    {!termosOk && (
                      <div className="rounded-2xl border border-border p-4">
                        <TermosAceite papel="aluno" compacto onAceito={() => setTermosOk(true)} />
                      </div>
                    )}
                    {termosOk && <AssinaturaContrato contratoId={d.meuContrato.id} onAssinado={() => carregar()} />}
                    {termosOk && d.meuContrato.falta.includes('contratado') && !d.meuContrato.falta.includes('contratante') && (
                      <CaixaAviso tom="info">
                        <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" /> Você já assinou. Falta o monitor assinar; avisamos por e-mail quando ele assinar.
                      </CaixaAviso>
                    )}
                  </div>
                )}

                {passo === 2 && (
                  <div className="space-y-5">
                    <div>
                      <h1 className="font-heading text-xl font-bold">Pague com PIX</h1>
                      <p className="text-sm text-muted-foreground">A confirmação é automática, em segundos.</p>
                    </div>
                    {r.status === 'aguardando_pagamento' ? (
                      <PagamentoPix reservaId={r.id} onAprovado={carregar} />
                    ) : (
                      <CaixaAviso tom="info"><Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" /> Aguardando o monitor assinar o contrato para liberar o pagamento.</CaixaAviso>
                    )}
                    {linkConvite && (
                      <ConviteGrupo link={linkConvite} copiado={copiado} onCopiar={() => { navigator.clipboard.writeText(linkConvite); setCopiado(true); setTimeout(() => setCopiado(false), 2000) }} />
                    )}
                  </div>
                )}

                {passo === 3 && (
                  <div className="relative space-y-5 text-center">
                    <Confete />
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 15 }} className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl">
                      <PartyPopper className="h-10 w-10" />
                    </motion.div>
                    <div>
                      <h1 className="font-heading text-2xl font-bold">{r.status === 'confirmada' ? 'Monitoria confirmada' : assento.status === 'gratis' ? 'Aula grátis garantida!' : 'Pagamento confirmado!'}</h1>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {r.status === 'confirmada'
                          ? 'Enviamos tudo para o seu e-mail. O link da reunião aparece na página da reserva.'
                          : 'Assim que todos do grupo pagarem, a aula fica confirmada.'}
                      </p>
                    </div>
                    {linkConvite && r.status !== 'confirmada' && (
                      <ConviteGrupo link={linkConvite} copiado={copiado} onCopiar={() => { navigator.clipboard.writeText(linkConvite); setCopiado(true); setTimeout(() => setCopiado(false), 2000) }} />
                    )}
                    <div className="grid gap-2 sm:grid-cols-2">
                      {d.meuContrato && (
                        <a href={`/api/monitorias/documentos/contrato/${d.meuContrato.id}`}>
                          <Button variant="outline" className="w-full"><FileText className="mr-2 h-4 w-4" /> Contrato (PDF)</Button>
                        </a>
                      )}
                      {assento.status !== 'gratis' && (
                        <a href={`/api/monitorias/documentos/comprovante/${assento.id}`}>
                          <Button variant="outline" className="w-full"><Receipt className="mr-2 h-4 w-4" /> Comprovante (PDF)</Button>
                        </a>
                      )}
                      {r.inicio && r.fim && (
                        <Button variant="outline" className="w-full" onClick={() => baixarIcs(r.anuncioTitulo, r.inicio!, r.fim!, `${window.location.origin}${urlSala}`)}>
                          <CalendarPlus className="mr-2 h-4 w-4" /> Adicionar ao calendário
                        </Button>
                      )}
                      <Link href={urlSala}>
                        <Button className="w-full"><MessagesSquare className="mr-2 h-4 w-4" /> Ir para a sala da monitoria</Button>
                      </Link>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
        <p className="mt-4 flex items-center justify-center gap-1 text-center text-[11px] text-muted-foreground">
          <Download className="h-3 w-3" /> Contrato, comprovante e termos ficam sempre disponíveis na página da reserva.
        </p>
      </div>
    </PageScaffold>
  )
}

function ConviteGrupo({ link, copiado, onCopiar }: { link: string; copiado: boolean; onCopiar: () => void }) {
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/[0.05] p-4 text-left">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-900 dark:text-amber-200"><Users className="h-4 w-4" /> Convide os colegas do grupo</p>
      <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-200/80">Cada um entra pelo link, assina o próprio contrato e paga a sua parte até o prazo.</p>
      <div className="mt-2 flex gap-2">
        <input readOnly value={link} className="h-9 flex-1 rounded-lg border border-amber-300 bg-white px-2 text-xs dark:bg-background" onFocus={(e) => e.target.select()} />
        <Button size="sm" onClick={onCopiar}>{copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</Button>
      </div>
    </div>
  )
}

/**
 * "Este horário está guardado para você por 12:34". Só aparece na reta final
 * (menos de 1 h): é o hold real do agendamento — quando zera, o horário volta
 * para a agenda. Relógio só no navegador, nenhuma requisição.
 */
function HorarioGuardado({ ate, slug }: { ate: string; slug: string | null }) {
  const reduzir = useReducedMotion()
  const [agora, setAgora] = useState(() => Date.now())
  const ms = new Date(ate).getTime() - agora
  const perto = ms <= 60 * 60_000
  // Longe do prazo, confere a cada minuto (para a contagem aparecer quando faltar 1 h).
  useIntervaloVisivel(() => setAgora(Date.now()), perto ? 1000 : 60_000)
  if (!perto) return null
  if (ms <= 0) {
    return (
      <CaixaAviso className="mb-4">
        O tempo para concluir acabou e o horário pode ter voltado para a agenda.{' '}
        {slug && <Link href={`/monitorias/anuncio/${slug}`} className="font-semibold underline">Escolher outro horário</Link>}
      </CaixaAviso>
    )
  }
  const m = Math.floor(ms / 60_000)
  const seg = Math.floor((ms % 60_000) / 1000)
  const urgente = ms < 5 * 60_000
  return (
    <motion.div
      initial={reduzir ? false : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'mb-4 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm',
        urgente ? 'border-rose-400/50 bg-rose-500/10 text-rose-900 dark:text-rose-200' : 'border-border bg-card text-foreground',
      )}
      role="timer"
      aria-live="off"
    >
      <Hourglass className={cn('h-5 w-5 shrink-0', urgente && !reduzir && 'animate-pulse')} />
      <span className="flex-1">Este horário está <strong>guardado só para você</strong> enquanto conclui.</span>
      <span className="font-heading text-lg font-bold tabular-nums">{String(m).padStart(2, '0')}:{String(seg).padStart(2, '0')}</span>
    </motion.div>
  )
}
