'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  AlertTriangle, ArrowLeft, BookOpen, CalendarPlus, Check, CheckCircle2, Clock, Copy, CreditCard, FileText, HeartHandshake, Link2,
  Loader2, MessagesSquare, Plus, Receipt, Repeat, Send, Star, Trash2, Users, Video, X, XCircle,
} from 'lucide-react'
import { PageScaffold } from '@/components/page-scaffold'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, CaixaAviso, CaixaErro, Esqueleto, HoraBrasilia, SeloStatus, api } from '@/components/monitorias/base'
import { AssinaturaContrato } from '@/components/monitorias/assinatura-contrato'
import { LinkExternoSeguro } from '@/components/monitorias/link-externo-seguro'
import { CompositorProposta } from '@/components/monitorias/compositor-proposta'
import { baixarIcs, type DetalheReserva, type MensagemReserva } from '@/components/monitorias/tipos-cliente'
import { useIntervaloVisivel } from '@/hooks/use-intervalo-visivel'
import { formatarCentavos } from '@/lib/monitorias/dinheiro'
import { formatarDuracao } from '@/lib/monitorias/agenda'
import { ETAPAS_LINHA_DO_TEMPO } from '@/lib/monitorias/estado'
import { dentroDoArrependimento } from '@/lib/monitorias/politica'
import { formatarEmBrasilia, horaEmBrasilia } from '@/lib/fuso-brasilia'
import { cn } from '@/lib/utils'

type Modal = null | 'cancelar' | 'recusar' | 'reportar' | 'propor'

export default function SalaDaReserva({ params }: { params: { id: string } }) {
  const reduzir = useReducedMotion()
  const [d, setD] = useState<DetalheReserva | null>(null)
  const [erro, setErro] = useState('')
  const [texto, setTexto] = useState('')
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [modal, setModal] = useState<Modal>(null)
  const fimDoChat = useRef<HTMLDivElement>(null)

  // Recarga cheia preserva o que a pessoa já abriu com "Ver mensagens
  // anteriores": a resposta traz só as 150 últimas, então as mais antigas que
  // já estavam na tela continuam lá (mescladas por id), sem a rolagem pular.
  const carregar = useCallback(() => {
    api<DetalheReserva>(`/api/monitorias/reservas/${params.id}`)
      .then((x) =>
        setD((atual) => {
          if (!atual || !x.mensagens.length) return x
          const primeira = new Date(x.mensagens[0].createdAt).getTime()
          const antigas = atual.mensagens.filter((m) => new Date(m.createdAt).getTime() < primeira)
          return antigas.length ? { ...x, mensagens: [...antigas, ...x.mensagens], maisAntigas: atual.maisAntigas } : x
        }),
      )
      .catch((e) => setErro(e.message))
  }, [params.id])

  useEffect(() => {
    carregar()
  }, [carregar])

  // Polling barato: pede só as mensagens NOVAS + a versão da reserva. A sala
  // inteira (assentos, contrato, proposta…) só é recarregada quando a versão
  // muda — ou a cada ~10 voltas, como rede de segurança. Só com a aba visível.
  const voltas = useRef(0)
  const atualizar = useCallback(async () => {
    if (!d) return
    voltas.current++
    const ultima = d.mensagens.at(-1)?.createdAt
    try {
      const x = await api<{ status: string; versao: number; mensagens: MensagemReserva[] }>(
        `/api/monitorias/reservas/${params.id}/mensagens${ultima ? `?depois=${encodeURIComponent(ultima)}` : ''}`,
      )
      if (x.versao !== d.versao || x.status !== d.reserva.status || voltas.current % 10 === 0) return carregar()
      if (x.mensagens.length) {
        setD((atual) => {
          if (!atual) return atual
          const vistas = new Set(atual.mensagens.map((m) => m.id))
          return { ...atual, mensagens: [...atual.mensagens, ...x.mensagens.filter((m) => !vistas.has(m.id))] }
        })
      }
    } catch {
      /* rede instável: a próxima volta tenta de novo */
    }
  }, [d, params.id, carregar])
  const ativa = d && !['expirada', 'cancelada_aluno', 'cancelada_monitor', 'recusada', 'reembolsada', 'concluida'].includes(d.reserva.status)
  const negociando = d && ['solicitada', 'em_negociacao', 'aguardando_assinaturas', 'aguardando_pagamento'].includes(d.reserva.status)
  useIntervaloVisivel(atualizar, !ativa ? null : negociando ? 7000 : 15000)

  const [carregandoAntigas, setCarregandoAntigas] = useState(false)
  async function verAnteriores() {
    if (!d || !d.mensagens.length) return
    setCarregandoAntigas(true)
    try {
      const x = await api<{ mensagens: MensagemReserva[]; maisAntigas: boolean }>(
        `/api/monitorias/reservas/${params.id}/mensagens?antes=${encodeURIComponent(d.mensagens[0].createdAt)}`,
      )
      setD((atual) => {
        if (!atual) return atual
        const vistas = new Set(atual.mensagens.map((m) => m.id))
        return { ...atual, maisAntigas: x.maisAntigas, mensagens: [...x.mensagens.filter((m) => !vistas.has(m.id)), ...atual.mensagens] }
      })
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Não deu para carregar.')
    } finally {
      setCarregandoAntigas(false)
    }
  }

  // Rola para o fim só quando chega mensagem NOVA (carregar as antigas não mexe na rolagem).
  const ultimaMensagem = d?.mensagens.at(-1)?.id
  useEffect(() => {
    fimDoChat.current?.scrollIntoView({ behavior: reduzir ? 'auto' : 'smooth', block: 'nearest' })
  }, [ultimaMensagem, reduzir])

  async function enviarMensagem() {
    if (!texto.trim()) return
    setEnviando(true)
    try {
      const r = await api<{ id: string; texto: string; createdAt: string; aviso: string | null }>(`/api/monitorias/reservas/${params.id}/mensagens`, { method: 'POST', json: { texto } })
      setTexto('')
      setAviso(r.aviso || '')
      // Entra direto na lista (sem recarregar a sala inteira); o polling traz o resto.
      setD((atual) =>
        atual && !atual.mensagens.some((m) => m.id === r.id)
          ? { ...atual, mensagens: [...atual.mensagens, { id: r.id, autor: 'eu', tipo: 'texto', texto: r.texto, propostaId: null, createdAt: r.createdAt }] }
          : atual,
      )
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Erro ao enviar.')
    } finally {
      setEnviando(false)
    }
  }

  async function acao(corpo: Record<string, unknown>) {
    await api(`/api/monitorias/reservas/${params.id}/acao`, { method: 'POST', json: corpo })
    carregar()
  }

  if (erro) return <PageScaffold><CaixaErro mensagem={erro} className="mx-auto mt-10 max-w-md" /></PageScaffold>
  if (!d) return <PageScaffold><Esqueleto className="h-[560px] rounded-3xl" /></PageScaffold>

  const r = d.reserva
  const p = r.proposta
  const ehMonitor = d.papel === 'monitor'
  const outroNome = ehMonitor ? (d.assentos[0]?.alunoNome || 'Aluno') : d.monitor?.nome || 'Monitor'
  const etapaAtual = ETAPAS_LINHA_DO_TEMPO.findIndex((e) => e.status.includes(r.status))
  const encerrada = ['expirada', 'cancelada_aluno', 'cancelada_monitor', 'recusada', 'reembolsada'].includes(r.status)
  const propostaPendente = !d.somenteLeitura && r.status === 'em_negociacao' && p && (ehMonitor ? !r.aceites.tutor : !r.aceites.aluno)
  const assento = d.meuAssento
  const precisaCheckout = !ehMonitor && assento && ['aguardando_assinatura', 'aguardando_pagamento'].includes(assento.status) && ['aguardando_assinaturas', 'aguardando_pagamento'].includes(r.status)
  const somenteLeitura = d.somenteLeitura
  const podeCancelar = !somenteLeitura && !encerrada && ['solicitada', 'em_negociacao', 'aguardando_assinaturas', 'aguardando_pagamento', 'confirmada'].includes(r.status)

  return (
    <PageScaffold wide>
      <Link href={ehMonitor ? '/monitorias/painel/pedidos' : '/monitorias/minhas'} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> {ehMonitor ? 'Meus pedidos' : 'Minhas monitorias'}
      </Link>

      {/* Cabeçalho */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar nome={ehMonitor ? outroNome : d.monitor?.nome || '?'} url={ehMonitor ? null : d.monitor?.fotoUrl} tamanho={52} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-heading text-2xl font-semibold">{r.anuncioTitulo}</h1>
            <p className="text-sm text-muted-foreground">{ehMonitor ? `Aluno: ${outroNome}` : `Monitor: ${d.monitor?.nome}`}{d.assentos.length > 1 ? `, grupo de ${p?.vagas}` : ''}</p>
          </div>
          <SeloStatus status={r.status} />
        </div>
        {!encerrada && r.status !== 'em_disputa' && (
          <ol className="mt-5 flex items-center">
            {ETAPAS_LINHA_DO_TEMPO.map((e, i) => (
              <li key={e.chave} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <motion.span
                    initial={false}
                    animate={{ scale: i === etapaAtual ? 1.15 : 1 }}
                    className={cn('flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold', i < etapaAtual ? 'bg-primary text-primary-foreground' : i === etapaAtual ? 'bg-card text-primary ring-2 ring-primary' : 'bg-muted text-muted-foreground')}
                  >
                    {i < etapaAtual ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </motion.span>
                  <span className={cn('hidden text-xs sm:block', i === etapaAtual ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{e.rotulo}</span>
                </div>
                {i < ETAPAS_LINHA_DO_TEMPO.length - 1 && <span className={cn('mx-1 h-0.5 flex-1 rounded', i < etapaAtual ? 'bg-primary' : 'bg-muted')} />}
              </li>
            ))}
          </ol>
        )}
        {r.motivoCancelamento && encerrada && <CaixaAviso className="mt-4" tom="info">Motivo: {r.motivoCancelamento}</CaixaAviso>}
        {r.disputa && (
          <CaixaAviso className="mt-4">
            <strong>Em análise pelo suporte:</strong> {r.disputa.motivo}
            {r.disputa.decisao ? <span className="mt-1 block"><strong>Decisão:</strong> {r.disputa.decisao}</span> : ' O valor fica retido até a decisão.'}
          </CaixaAviso>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* Chat */}
        <section className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: 620 }}>
            {d.maisAntigas && (
              <button type="button" onClick={verAnteriores} disabled={carregandoAntigas} className="mx-auto block rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted">
                {carregandoAntigas ? 'Carregando…' : 'Ver mensagens anteriores'}
              </button>
            )}
            <AnimatePresence initial={false}>
              {d.mensagens.map((m) => {
                if (m.tipo === 'sistema') {
                  return (
                    <motion.p key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-md rounded-full bg-muted px-3 py-1 text-center text-[11px] text-muted-foreground">
                      {m.texto}
                    </motion.p>
                  )
                }
                const meu = m.autor === 'eu'
                const ehProposta = m.tipo === 'proposta'
                const vigente = ehProposta && m.propostaId === p?.id
                return (
                  <motion.div key={m.id} initial={reduzir ? false : { opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={cn('flex', meu ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-sm',
                        ehProposta ? 'border border-primary/40 bg-primary/[0.06] text-foreground' : meu ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md bg-muted',
                        ehProposta && !vigente && 'opacity-60',
                      )}
                    >
                      {ehProposta && <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-primary"><HeartHandshake className="h-3.5 w-3.5" /> Proposta {vigente ? '' : '(substituída)'}</p>}
                      <p className="whitespace-pre-line break-words">{m.texto}</p>
                      <p className={cn('mt-1 text-[10px]', meu && !ehProposta ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{horaEmBrasilia(m.createdAt)}</p>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            <div ref={fimDoChat} />
          </div>

          {propostaPendente && p && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="border-t border-amber-300/50 bg-amber-50 p-4 dark:bg-amber-500/10">
              <p className="text-sm font-semibold">Proposta aguardando sua resposta</p>
              <p className="text-xs text-muted-foreground">
                {formatarEmBrasilia(p.inicio, { weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} (Brasília) · {formatarDuracao(p.duracaoMin)} ·{' '}
                {p.gratis ? 'grátis' : `${formatarCentavos(p.valorPorPessoaCentavos)} por pessoa`}{p.vagas > 1 ? ` · ${p.vagas} alunos` : ''}
              </p>
              {p.observacao && <p className="mt-1 text-xs italic">“{p.observacao}”</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <BotaoAcao onClick={() => acao({ acao: 'aceitar', propostaId: p.id })}><CheckCircle2 className="mr-1.5 h-4 w-4" /> Aceitar</BotaoAcao>
                <Button variant="outline" size="sm" onClick={() => setModal('propor')}>Contraproposta</Button>
              </div>
            </motion.div>
          )}

          {somenteLeitura && (
            <p className="border-t border-border p-3 text-center text-xs text-muted-foreground">
              Você saiu desta monitoria. O histórico fica aqui para consulta (contatos pessoais aparecem ocultos).
            </p>
          )}
          {!encerrada && !somenteLeitura && (
            <div className="border-t border-border p-3">
              {aviso && <p className="mb-2 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs text-amber-800 dark:text-amber-300">{aviso}</p>}
              <div className="flex items-end gap-2">
                <Textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      enviarMensagem()
                    }
                  }}
                  rows={1}
                  maxLength={2000}
                  placeholder="Escreva uma mensagem…"
                  className="min-h-[44px] resize-none"
                />
                <Button onClick={enviarMensagem} disabled={enviando || !texto.trim()} size="icon" className="h-11 w-11 shrink-0 rounded-xl" aria-label="Enviar">
                  {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              {r.negociavel && d.papel !== 'membro' && (
                <button type="button" onClick={() => setModal('propor')} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  <HeartHandshake className="h-3.5 w-3.5" /> {p ? 'Fazer nova proposta' : 'Enviar proposta (dia, horário, duração, valor)'}
                </button>
              )}
            </div>
          )}
        </section>

        {/* Painel lateral */}
        <aside className="space-y-4">
          {p && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold">O combinado</h2>
              <dl className="mt-2 space-y-1.5 text-sm">
                <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Quando</dt><dd className="text-right font-medium">{formatarEmBrasilia(p.inicio, { day: '2-digit', month: '2-digit', weekday: 'short', hour: '2-digit', minute: '2-digit' })}</dd></div>
                <div className="flex justify-end"><HoraBrasilia /></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Duração</dt><dd className="font-medium">{formatarDuracao(p.duracaoMin)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Valor</dt><dd className="font-medium">{p.gratis ? 'Grátis' : `${formatarCentavos(p.valorPorPessoaCentavos)}${p.vagas > 1 ? '/pessoa' : ''}`}</dd></div>
                {r.prazoPagamento && ['aguardando_assinaturas', 'aguardando_pagamento'].includes(r.status) && (
                  <div className="flex justify-between"><dt className="text-muted-foreground">Prazo</dt><dd className="flex items-center gap-1 font-medium text-amber-700 dark:text-amber-300"><Clock className="h-3.5 w-3.5" /> {formatarEmBrasilia(r.prazoPagamento, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</dd></div>
                )}
              </dl>
            </div>
          )}

          {precisaCheckout && (
            <motion.div initial={{ scale: 0.97 }} animate={{ scale: 1 }} className="rounded-2xl bg-primary p-5 text-primary-foreground">
              <p className="font-semibold">{assento!.status === 'aguardando_assinatura' ? 'Falta assinar o contrato' : 'Falta pagar'}</p>
              <p className="mt-0.5 text-sm text-primary-foreground/80">Contrato, PIX e comprovante em um só lugar.</p>
              <Link href={`/monitorias/checkout/${r.id}`}>
                <Button className="mt-4 h-11 w-full rounded-xl bg-card font-semibold text-foreground hover:bg-card/90"><CreditCard className="mr-2 h-4 w-4" /> Continuar</Button>
              </Link>
            </motion.div>
          )}

          {ehMonitor && d.contratosParaAssinar.length > 0 && (
            <div className="rounded-2xl border border-primary/40 bg-card p-4">
              <p className="mb-3 text-sm font-semibold">Assine o contrato para liberar o pagamento do aluno</p>
              {d.contratosParaAssinar.map((k) => (
                <AssinaturaContrato key={k.id} contratoId={k.id} onAssinado={carregar} />
              ))}
            </div>
          )}

          {(r.status === 'confirmada' || r.status === 'aguardando_pagamento' || r.status === 'realizada') && (
            <LinkDaReuniao d={d} onSalvar={(url) => acao({ acao: 'link', url })} />
          )}

          <Materiais
            d={d}
            onAdicionar={(titulo, url) => acao({ acao: 'material', titulo, url })}
            onRemover={(url) => acao({ acao: 'material_remover', url })}
          />

          {ehMonitor && r.status === 'aguardando_pagamento' && d.assentos.some((a) => a.status === 'paga') && (p?.vagas || 1) > 1 && (
            <div className="rounded-2xl border border-border bg-card p-4 text-sm">
              <p className="font-semibold">Grupo incompleto?</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Você pode confirmar a aula só com quem já pagou (o preço por pessoa não muda).</p>
              <BotaoAcao className="mt-2 w-full" onClick={() => acao({ acao: 'confirmar' })}>Confirmar com quem pagou</BotaoAcao>
            </div>
          )}

          {r.codigoConvite && ['aguardando_pagamento', 'aguardando_assinaturas'].includes(r.status) && <Convite codigo={r.codigoConvite} />}

          {d.assentos.length > 0 && (ehMonitor || (p?.vagas || 1) > 1) && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold"><Users className="h-4 w-4 text-primary" /> Alunos</h2>
              <ul className="mt-2 space-y-1.5 text-sm">
                {d.assentos.map((a, i) => (
                  <li key={i} className="flex items-center justify-between"><span>{a.alunoNome}{a.eu ? ' (você)' : ''}</span><span className="text-xs text-muted-foreground">{ROTULO_ASSENTO[a.status] || a.status}</span></li>
                ))}
              </ul>
            </div>
          )}

          <Documentos d={d} />

          {!ehMonitor && assento && ['realizada', 'concluida'].includes(r.status) && ['paga', 'gratis', 'concluida'].includes(assento.status) && (
            <Avaliar jaAvaliado={assento.avaliacao} onEnviar={(nota, comentario) => acao({ acao: 'avaliar', nota, comentario })} />
          )}

          {!ehMonitor && r.anuncioSlug && ['realizada', 'concluida'].includes(r.status) && (
            <Link href={`/monitorias/anuncio/${r.anuncioSlug}`}>
              <motion.div whileHover={{ y: -2 }} className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/[0.06] p-4">
                <Repeat className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">Agendar a próxima aula</p>
                  <p className="text-xs text-muted-foreground">Mesmo monitor, do jeito que você já conhece.</p>
                </div>
              </motion.div>
            </Link>
          )}

          {r.status === 'confirmada' && r.inicio && r.fim && (
            <Button variant="outline" className="w-full" onClick={() => baixarIcs(r.anuncioTitulo, r.inicio!, r.fim!, window.location.href)}>
              <CalendarPlus className="mr-2 h-4 w-4" /> Adicionar ao calendário
            </Button>
          )}

          <div className="space-y-2">
            {r.podeReportar && (
              <Button variant="outline" className="w-full rounded-xl" onClick={() => setModal('reportar')}>
                <AlertTriangle className="mr-2 h-4 w-4" /> Reportar problema
              </Button>
            )}
            {ehMonitor && ['solicitada', 'em_negociacao'].includes(r.status) && (
              <Button variant="outline" className="w-full" onClick={() => setModal('recusar')}><X className="mr-2 h-4 w-4" /> Recusar pedido</Button>
            )}
            {podeCancelar && (
              <Button variant="ghost" className="w-full text-rose-600 hover:bg-rose-500/10 hover:text-rose-700" onClick={() => setModal('cancelar')}>
                <XCircle className="mr-2 h-4 w-4" /> {d.papel === 'membro' ? 'Sair do grupo' : 'Cancelar monitoria'}
              </Button>
            )}
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {modal && (
          <motion.div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModal(null)}>
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-card p-5 shadow-2xl sm:rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-heading text-lg font-semibold">
                  {modal === 'propor' ? 'Nova proposta' : modal === 'cancelar' ? 'Cancelar monitoria' : modal === 'recusar' ? 'Recusar pedido' : 'Reportar problema'}
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setModal(null)} aria-label="Fechar"><X className="h-5 w-5" /></Button>
              </div>
              {modal === 'propor' ? (
                <CompositorProposta d={d} onEnviada={() => { setModal(null); carregar() }} />
              ) : (
                <FormMotivo
                  tipo={modal}
                  d={d}
                  onEnviar={async (motivo) => {
                    await acao({ acao: modal, motivo })
                    setModal(null)
                  }}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageScaffold>
  )
}

const ROTULO_ASSENTO: Record<string, string> = {
  aguardando_assinatura: 'assinando',
  aguardando_pagamento: 'pagando',
  paga: 'pago',
  gratis: 'grátis',
  concluida: 'concluída',
  reembolsada: 'reembolsado',
  reembolso_processando: 'reembolsando',
  cancelada: 'saiu',
  expirada: 'expirou',
}

function BotaoAcao({ onClick, children, className }: { onClick: () => Promise<unknown>; children: React.ReactNode; className?: string }) {
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
  return (
    <div className={className}>
      <Button
        size="sm"
        className="w-full"
        disabled={ocupado}
        onClick={async () => {
          setOcupado(true)
          setErro('')
          try {
            await onClick()
          } catch (e) {
            setErro(e instanceof Error ? e.message : 'Erro.')
          } finally {
            setOcupado(false)
          }
        }}
      >
        {ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
      </Button>
      {erro && <p className="mt-1 text-xs text-rose-600">{erro}</p>}
    </div>
  )
}

function FormMotivo({ tipo, d, onEnviar }: { tipo: 'cancelar' | 'recusar' | 'reportar'; d: DetalheReserva; onEnviar: (motivo: string) => Promise<void> }) {
  const [motivo, setMotivo] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
  const r = d.reserva
  const pago = d.meuAssento?.status === 'paga' || d.assentos.some((a) => a.status === 'paga')
  const horas = r.inicio ? (new Date(r.inicio).getTime() - Date.now()) / 3_600_000 : Infinity
  let explicacao = ''
  if (tipo === 'cancelar') {
    if (!pago) explicacao = 'Ainda não houve pagamento: a reserva só é encerrada.'
    else if (d.papel === 'monitor') explicacao = 'Todos os alunos recebem 100% de volta e você recebe uma advertência (strike). 3 strikes em 90 dias suspendem o perfil.'
    else if (dentroDoArrependimento(d.meuAssento?.pagoEm ? new Date(d.meuAssento.pagoEm) : null, new Date()))
      explicacao = 'Você está no prazo de arrependimento (7 dias desde o pagamento, CDC art. 49): recebe 100% de volta, inclusive a taxa do PIX, automaticamente.'
    else if (horas >= 24) explicacao = 'Faltam 24h ou mais: você recebe 100% de volta automaticamente.'
    else explicacao = 'Faltam menos de 24h e já passou o prazo de arrependimento: seu pedido vai para o suporte, que decide o reembolso de forma fundamentada.'
  } else if (tipo === 'reportar') {
    explicacao = 'O valor fica retido e o suporte analisa (conte o que aconteceu: falta, atraso, aula diferente do combinado...).'
  } else {
    explicacao = 'O aluno é avisado. Seja gentil e explique o motivo.'
  }
  return (
    <div className="space-y-3">
      <CaixaAviso tom="info">{explicacao}</CaixaAviso>
      <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={4} maxLength={1000} placeholder="Motivo" />
      {erro && <CaixaErro mensagem={erro} />}
      <Button
        className={cn('w-full', tipo !== 'reportar' && 'bg-rose-600 hover:bg-rose-700')}
        disabled={ocupado || motivo.trim().length < 5}
        onClick={async () => {
          setOcupado(true)
          setErro('')
          try {
            await onEnviar(motivo.trim())
          } catch (e) {
            setErro(e instanceof Error ? e.message : 'Erro.')
          } finally {
            setOcupado(false)
          }
        }}
      >
        {ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : tipo === 'cancelar' ? 'Confirmar cancelamento' : tipo === 'recusar' ? 'Recusar' : 'Enviar ao suporte'}
      </Button>
    </div>
  )
}

function LinkDaReuniao({ d, onSalvar }: { d: DetalheReserva; onSalvar: (url: string) => Promise<void> }) {
  const [url, setUrl] = useState('')
  const [editando, setEditando] = useState(false)
  const [erro, setErro] = useState('')
  const r = d.reserva
  if (d.papel === 'monitor') {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold"><Video className="h-4 w-4 text-primary" /> Link da reunião</h2>
        {r.linkReuniao && !editando ? (
          <div className="mt-2 space-y-2">
            <a href={r.linkReuniao} target="_blank" rel="noopener noreferrer" className="block truncate text-sm text-primary hover:underline">{r.linkReuniao}</a>
            <button type="button" className="text-xs text-muted-foreground hover:underline" onClick={() => setEditando(true)}>Trocar link</button>
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            <p className="text-xs text-muted-foreground">Meet, Zoom, Teams... Só quem pagou vê. Pode colocar depois.</p>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://meet.google.com/..." className="h-10 w-full rounded-lg border border-border bg-background px-2 text-sm" />
            {erro && <p className="text-xs text-rose-600">{erro}</p>}
            <BotaoAcao
              onClick={async () => {
                setErro('')
                try {
                  await onSalvar(url)
                  setEditando(false)
                } catch (e) {
                  setErro(e instanceof Error ? e.message : 'Erro.')
                }
              }}
            >
              <Link2 className="mr-1.5 h-4 w-4" /> Salvar link
            </BotaoAcao>
          </div>
        )}
      </div>
    )
  }
  if (r.linkReuniao) {
    return (
      <a href={r.linkReuniao} target="_blank" rel="noopener noreferrer">
        <motion.div whileHover={{ y: -2 }} className="flex items-center gap-3 rounded-2xl bg-primary p-4 text-primary-foreground shadow-[0_12px_30px_-14px_hsl(var(--primary)/0.7)]">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/15"><Video className="h-5 w-5" /></span>
          <div>
            <p className="font-semibold">Entrar na aula</p>
            <p className="text-xs text-primary-foreground/80">Abre a sala de reunião</p>
          </div>
        </motion.div>
      </a>
    )
  }
  if (r.status === 'confirmada') return <CaixaAviso tom="info">O monitor ainda vai colocar o link da reunião aqui. Você será avisado.</CaixaAviso>
  return null
}

function Convite({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false)
  const link = typeof window !== 'undefined' ? `${window.location.origin}/monitorias/convite/${codigo}` : ''
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/[0.05] p-4">
      <p className="flex items-center gap-1.5 text-sm font-semibold"><Users className="h-4 w-4 text-primary" /> Convide seus colegas</p>
      <p className="mt-0.5 text-xs text-muted-foreground">Cada um assina e paga a própria parte.</p>
      <div className="mt-2 flex gap-2">
        <input readOnly value={link} className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-background px-2 text-xs" onFocus={(e) => e.target.select()} />
        <Button
          size="sm"
          aria-label={copiado ? 'Link copiado' : 'Copiar link de convite'}
          onClick={() => {
            navigator.clipboard
              .writeText(link)
              .then(() => {
                setCopiado(true)
                setTimeout(() => setCopiado(false), 2000)
              })
              .catch(() => window.prompt('Copie o link do convite:', link))
          }}
        >
          {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  )
}

function Documentos({ d }: { d: DetalheReserva }) {
  const itens: Array<{ href: string; rotulo: string; icone: typeof FileText }> = []
  if (d.meuContrato) itens.push({ href: `/api/monitorias/documentos/contrato/${d.meuContrato.id}`, rotulo: `Contrato nº ${d.meuContrato.numero}`, icone: FileText })
  if (d.meuAssento && d.meuAssento.paymentOrderId && d.meuAssento.pagoEm) {
    itens.push({ href: `/api/monitorias/documentos/comprovante/${d.meuAssento.id}`, rotulo: 'Comprovante de pagamento', icone: Receipt })
  }
  if (d.papel === 'monitor') {
    for (const a of d.assentos) {
      if (a.contratoId) itens.push({ href: `/api/monitorias/documentos/contrato/${a.contratoId}`, rotulo: `Contrato de ${a.alunoNome.split(' ')[0]}`, icone: FileText })
      if (a.id && ['paga', 'concluida', 'reembolsada', 'reembolso_processando'].includes(a.status)) {
        itens.push({ href: `/api/monitorias/documentos/venda/${a.id}`, rotulo: `Demonstrativo de venda de ${a.alunoNome.split(' ')[0]}`, icone: Receipt })
      }
    }
  }
  if (d.mensagens.length) {
    itens.push({ href: `/api/monitorias/documentos/conversa/${d.reserva.id}`, rotulo: 'Histórico da conversa', icone: MessagesSquare })
  }
  if (!itens.length) return null
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold">Documentos (PDF)</h2>
      <ul className="mt-2 space-y-1">
        {itens.map((i) => (
          <li key={i.href}>
            <a href={i.href} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted">
              <i.icone className="h-4 w-4 text-primary" /> {i.rotulo}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Materiais({ d, onAdicionar, onRemover }: { d: DetalheReserva; onAdicionar: (titulo: string, url: string) => Promise<void>; onRemover: (url: string) => Promise<void> }) {
  const [abrir, setAbrir] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [url, setUrl] = useState('')
  const [erro, setErro] = useState('')
  const [removendo, setRemovendo] = useState<string | null>(null)
  const ehMonitor = d.papel === 'monitor'
  const podeEnviar = ehMonitor && ['aguardando_pagamento', 'confirmada', 'realizada', 'em_disputa', 'concluida'].includes(d.reserva.status)
  if (!d.materiais.length && !podeEnviar) return null
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold"><BookOpen className="h-4 w-4 text-primary" /> Materiais desta monitoria</h2>
      {d.materiais.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {d.materiais.map((m) => (
            <li key={m.url} className="flex items-center gap-2">
              <LinkExternoSeguro url={m.url} dominio={m.dominio}>
                <span className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted">
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0">
                    <span className="block truncate">{m.titulo}</span>
                    <span className="block text-[11px] text-muted-foreground">{m.dominio}{m.exclusivo ? ' · só para esta aula' : ''}</span>
                  </span>
                </span>
              </LinkExternoSeguro>
              {ehMonitor && m.exclusivo && d.reserva.inicio && new Date(d.reserva.inicio).getTime() > Date.now() && (
                <button
                  type="button"
                  aria-label={`Remover material ${m.titulo}`}
                  disabled={removendo === m.url}
                  className="ml-auto rounded p-1 text-muted-foreground hover:text-rose-600 disabled:opacity-40"
                  onClick={() => {
                    setRemovendo(m.url)
                    setErro('')
                    onRemover(m.url)
                      .catch((e) => setErro(e instanceof Error ? e.message : 'Não foi possível remover.'))
                      .finally(() => setRemovendo(null))
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">Envie slides, resumos ou listas de exercícios por link. O aluno recebe um aviso e o material fica guardado aqui.</p>
      )}
      {podeEnviar && (
        abrir ? (
          <div className="mt-3 space-y-2">
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={100} placeholder="Título (ex.: Slides da aula)" className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm" />
            <input value={url} onChange={(e) => setUrl(e.target.value)} maxLength={500} placeholder="https://drive.google.com/..." className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm" />
            {erro && <p className="text-xs text-rose-600">{erro}</p>}
            <BotaoAcao
              className="w-full"
              onClick={async () => {
                setErro('')
                try {
                  await onAdicionar(titulo, url)
                  setTitulo('')
                  setUrl('')
                  setAbrir(false)
                } catch (e) {
                  setErro(e instanceof Error ? e.message : 'Erro.')
                }
              }}
            >
              Enviar ao aluno
            </BotaoAcao>
          </div>
        ) : (
          <button type="button" onClick={() => setAbrir(true)} className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            <Plus className="h-3.5 w-3.5" /> Enviar material
          </button>
        )
      )}
      {erro && !abrir && <p className="mt-1 text-xs text-rose-600">{erro}</p>}
      <p className="mt-2 text-[10px] leading-snug text-muted-foreground">Links externos indicados pelo monitor. A plataforma não hospeda nem se responsabiliza pelo conteúdo.</p>
    </div>
  )
}

function Avaliar({ jaAvaliado, onEnviar }: { jaAvaliado: { nota: number; comentario: string } | null; onEnviar: (nota: number, comentario: string) => Promise<void> }) {
  const [nota, setNota] = useState(0)
  const [hover, setHover] = useState(0)
  const [comentario, setComentario] = useState('')
  const [erro, setErro] = useState('')
  if (jaAvaliado) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 text-sm">
        <p className="font-semibold">Sua avaliação</p>
        <p className="mt-1 flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn('h-4 w-4', i < jaAvaliado.nota ? 'fill-amber-400 text-amber-400' : 'text-muted')} />)}</p>
        {jaAvaliado.comentario && <p className="mt-1 text-muted-foreground">{jaAvaliado.comentario}</p>}
      </div>
    )
  }
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-sm font-semibold">Como foi a monitoria?</p>
      <div className="mt-2 flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <motion.button key={n} type="button" whileTap={{ scale: 0.85 }} onMouseEnter={() => setHover(n)} onClick={() => setNota(n)} aria-label={`${n} estrelas`}>
            <Star className={cn('h-7 w-7 transition', n <= (hover || nota) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40')} />
          </motion.button>
        ))}
      </div>
      <Textarea value={comentario} onChange={(e) => setComentario(e.target.value)} rows={2} maxLength={1000} placeholder="Conte como foi (opcional, público)" className="mt-2" />
      {erro && <p className="mt-1 text-xs text-rose-600">{erro}</p>}
      <BotaoAcao className="mt-2" onClick={async () => { setErro(''); if (!nota) return setErro('Escolha de 1 a 5 estrelas.'); try { await onEnviar(nota, comentario) } catch (e) { setErro(e instanceof Error ? e.message : 'Erro.') } }}>
        Enviar avaliação
      </BotaoAcao>
    </div>
  )
}
