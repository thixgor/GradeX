'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, CalendarClock, Check, ChevronRight, Eye, Inbox, Lightbulb, Pause, Pencil, Play, Plus, Send, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatarCentavos } from '@/lib/monitorias/dinheiro'
import { formatarDuracao } from '@/lib/monitorias/agenda'
import { formatarEmBrasilia } from '@/lib/fuso-brasilia'
import { cn } from '@/lib/utils'
import { comVolta } from '@/lib/monitorias/requisitos'
import { api, CaixaAviso, CaixaErro, Esqueleto, Selo, Vazio } from '../base'
import type { DadosPainel } from './tipos'
import type { ItemReserva } from '@/components/monitorias/lista-reservas'
import { AnelForca } from '@/components/monitorias/forca-anuncio'
import { SimuladorGanhos } from '@/components/monitorias/simulador-ganhos'

const STATUS_ANUNCIO: Record<string, { rotulo: string; tom: 'neutro' | 'info' | 'alerta' | 'sucesso' | 'erro' }> = {
  rascunho: { rotulo: 'Rascunho', tom: 'neutro' },
  em_analise: { rotulo: 'Em análise', tom: 'info' },
  publicado: { rotulo: 'No ar', tom: 'sucesso' },
  rejeitado: { rotulo: 'Precisa de ajustes', tom: 'erro' },
  pausado: { rotulo: 'Pausado', tom: 'alerta' },
  suspenso: { rotulo: 'Suspenso', tom: 'erro' },
}

/** Pedidos em aberto (a mesma regra da contagem do cabeçalho, em /api/monitorias/eu). */
const ESPERA_O_MONITOR = new Set(['solicitada', 'em_negociacao', 'aguardando_assinaturas'])
const TEXTO_PEDIDO: Record<string, string> = {
  solicitada: 'Pedido novo: responda ou faça uma proposta',
  em_negociacao: 'Em negociação: acompanhe a conversa',
  aguardando_assinaturas: 'Contrato aguardando assinatura',
}

export function VisaoGeral({ dados, recarregar }: { dados: DadosPainel; recarregar: () => void }) {
  const reduzir = useReducedMotion()
  const req = dados.requisitosMonitor
  const feitos = req.itens.filter((i) => i.ok).length
  const t = dados.tutor
  const [reservas, setReservas] = useState<ItemReserva[] | null>(null)
  const [erroAcao, setErroAcao] = useState('')

  useEffect(() => {
    api<{ reservas: ItemReserva[] }>('/api/monitorias/reservas?papel=monitor&escopo=ativas')
      .then((r) => setReservas(r.reservas))
      .catch(() => setReservas([]))
  }, [])

  async function acao(id: string, acao: 'enviar' | 'pausar' | 'retomar') {
    setErroAcao('')
    try {
      await api(`/api/monitorias/tutor/anuncios/${id}/acao`, { method: 'POST', json: { acao } })
      recarregar()
    } catch (e) {
      setErroAcao(e instanceof Error ? e.message : 'Não foi possível concluir. Tente de novo.')
    }
  }

  const agora = Date.now()
  const pedidos = (reservas || []).filter((r) => ESPERA_O_MONITOR.has(r.status))
  const proximas = (reservas || [])
    .filter((r) => r.status === 'confirmada' && r.inicio && new Date(r.inicio).getTime() > agora - 2 * 3_600_000)
    .sort((a, b) => new Date(a.inicio!).getTime() - new Date(b.inicio!).getTime())
    .slice(0, 4)
  const fin = t?.financeiro

  return (
    <div className="space-y-8">
      {t?.status === 'suspenso' && <CaixaAviso tom="alerta">Seu perfil de monitor está suspenso. Fale com o suporte para entender o motivo.</CaixaAviso>}

      {/* Primeiros passos: aparece só até o cadastro ficar completo */}
      {!req.ok && (
        <motion.section initial={reduzir ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl font-semibold">Faltam {req.itens.length - feitos} passos para você vender</h2>
              <p className="mt-1 max-w-[56ch] text-sm text-muted-foreground">Como a aula envolve dinheiro, o anúncio só vai ao ar com o cadastro completo.</p>
            </div>
            <p className="font-heading text-sm font-semibold tabular-nums text-primary">{feitos} de {req.itens.length}</p>
          </div>
          <div className="mt-4 flex gap-1" aria-hidden>
            {req.itens.map((i) => <span key={i.chave} className={cn('h-1.5 flex-1 rounded-full', i.ok ? 'bg-primary' : 'bg-muted')} />)}
          </div>
          <ol className="mt-5 divide-y divide-border">
            {req.itens.map((i) => (
              <li key={i.chave} className="flex items-center justify-between gap-3 py-3">
                <span className={cn('flex items-center gap-3 text-sm', i.ok && 'text-muted-foreground')}>
                  <span className={cn('inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg', i.ok ? 'bg-primary text-primary-foreground' : 'border border-border')}>
                    {i.ok && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className={cn(i.ok && 'line-through decoration-muted-foreground/40')}>{i.rotulo}</span>
                </span>
                {!i.ok && i.acao && (
                  <Link href={comVolta(i.acao.href, '/monitorias/painel')} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-primary transition hover:bg-primary/10">
                    {i.acao.texto} <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </motion.section>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* O que depende de você */}
        <div className="space-y-6">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold">Precisa de você</h2>
              {pedidos.length > 0 && <Link href="/monitorias/painel/pedidos" className="text-sm font-medium text-primary hover:underline">Ver todos</Link>}
            </div>
            {!reservas ? (
              <Esqueleto className="h-24" />
            ) : pedidos.length === 0 ? (
              <p className="flex items-center gap-2 rounded-2xl bg-muted/40 px-4 py-4 text-sm text-muted-foreground">
                <Inbox className="h-4 w-4" strokeWidth={1.75} /> Nenhum pedido em aberto.
              </p>
            ) : (
              <ul className="space-y-2">
                {pedidos.slice(0, 4).map((r) => (
                  <li key={r.id}>
                    <Link href={`/monitorias/reservas/${r.id}`} className="group flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/[0.04] px-4 py-3 transition hover:border-primary/60">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Inbox className="h-4 w-4" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{r.anuncioTitulo}</span>
                        <span className="block text-xs text-muted-foreground">{TEXTO_PEDIDO[r.status]}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-primary transition group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-heading text-lg font-semibold">Próximas aulas</h2>
            {!reservas ? (
              <Esqueleto className="h-32" />
            ) : proximas.length === 0 ? (
              <p className="flex items-center gap-2 rounded-2xl bg-muted/40 px-4 py-4 text-sm text-muted-foreground">
                <CalendarClock className="h-4 w-4" strokeWidth={1.75} /> Nenhuma aula marcada. Uma agenda com mais horários atrai mais alunos.
                <Link href="/monitorias/painel/agenda" className="ml-auto shrink-0 font-semibold text-primary hover:underline">Abrir agenda</Link>
              </p>
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                {proximas.map((r) => {
                  const d = new Date(r.inicio!)
                  return (
                    <li key={r.id}>
                      <Link href={`/monitorias/reservas/${r.id}`} className="flex items-center gap-4 px-4 py-3 transition hover:bg-muted/40">
                        <span className="flex w-12 shrink-0 flex-col items-center rounded-xl bg-muted/60 py-1.5">
                          <span className="text-[11px] text-muted-foreground">{formatarEmBrasilia(d, { month: 'short' }).replace('.', '')}</span>
                          <span className="font-heading text-lg font-semibold leading-none tabular-nums">{formatarEmBrasilia(d, { day: '2-digit' })}</span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{r.anuncioTitulo}</span>
                          <span className="block text-xs text-muted-foreground">
                            {formatarEmBrasilia(d, { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
                            {r.duracaoMin ? `, ${formatarDuracao(r.duracaoMin)}` : ''}
                            {r.vagas > 1 ? `, grupo de ${r.vagas}` : ''}
                          </span>
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Dinheiro e reputação */}
        <aside className="space-y-4">
          <section className="rounded-2xl bg-primary p-5 text-primary-foreground">
            <p className="text-sm text-primary-foreground/80">Pronto para receber</p>
            <p className="mt-1 font-heading text-3xl font-semibold tabular-nums">{formatarCentavos(fin?.liberadoCentavos || 0)}</p>
            <p className="mt-1 text-xs text-primary-foreground/75">Vai por PIX na próxima rodada de repasses.</p>
            <div className="mt-4 flex items-center justify-between border-t border-primary-foreground/20 pt-3 text-sm">
              <span className="text-primary-foreground/80">Em garantia</span>
              <span className="font-semibold tabular-nums">{formatarCentavos(fin?.emGarantiaCentavos || 0)}</span>
            </div>
            <p className="mt-1 text-xs text-primary-foreground/70">Libera 48h depois de cada aula.</p>
            <Link href="/monitorias/painel/financeiro" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline">
              Ver extrato <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
          <section className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/15 text-amber-600 dark:text-amber-400">
              <Star className="h-5 w-5 fill-current" />
            </span>
            <div>
              <p className="font-heading text-xl font-semibold tabular-nums">{t?.stats.avaliacoes ? t.stats.nota.toFixed(1) : 'Sem nota'}</p>
              <p className="text-xs text-muted-foreground">
                {t?.stats.aulasDadas || 0} {t?.stats.aulasDadas === 1 ? 'aula dada' : 'aulas dadas'}
                {t?.stats.avaliacoes ? `, ${t.stats.avaliacoes} ${t.stats.avaliacoes === 1 ? 'avaliação' : 'avaliações'}` : ''}
              </p>
            </div>
          </section>
        </aside>
      </div>

      {/* Anúncios */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Seus anúncios</h2>
          {dados.anuncios.length > 0 && (
            <Link href="/monitorias/painel/anuncios/novo" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              <Plus className="h-4 w-4" /> Novo
            </Link>
          )}
        </div>
        {erroAcao && <CaixaErro mensagem={erroAcao} className="mb-3" />}
        {dados.anuncios.length === 0 ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <Vazio
              icone={<Plus className="h-5 w-5" />}
              titulo="Seu primeiro anúncio"
              texto="Conte o que você ensina, grave um vídeo curto e defina preço e agenda. Anunciar é grátis: a plataforma fica com 10% do que você vender."
              acao={<Link href="/monitorias/painel/anuncios/novo"><Button className="rounded-xl">Criar anúncio</Button></Link>}
              className="h-full justify-center"
            />
            <SimuladorGanhos compacto />
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {dados.anuncios.map((a) => {
              const s = STATUS_ANUNCIO[a.status] || { rotulo: a.status, tom: 'neutro' as const }
              const dica = a.forca.dicas[0] && a.forca.pontos < 80 ? a.forca.dicas[0] : null
              return (
                <li key={a.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <AnelForca forca={a.forca} tamanho={44} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold">{a.titulo}</p>
                        <Selo tom={s.tom}>{s.rotulo}</Selo>
                        {a.temRevisaoPendente && <Selo tom="info">Alteração em análise</Selo>}
                        {a.direto && !a.ofertaAssinada && <Selo tom="alerta">Assine a oferta para abrir a agenda</Selo>}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatarCentavos(a.preco.valorCentavos)}/{a.preco.modo === 'hora' ? 'h' : 'aula'}, {a.stats.reservas} {a.stats.reservas === 1 ? 'reserva' : 'reservas'}, {a.stats.perguntas} {a.stats.perguntas === 1 ? 'pergunta' : 'perguntas'}
                      </p>
                      {a.moderacao?.motivo && ['rejeitado', 'suspenso'].includes(a.status) && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">Moderação: {a.moderacao.motivo}</p>}
                      {dica && (
                        <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                          <Lightbulb className="mt-px h-3.5 w-3.5 shrink-0 text-amber-500" /> {dica.texto} <span className="font-semibold text-primary">+{dica.ganho}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 sm:justify-end">
                    {['rascunho', 'rejeitado'].includes(a.status) && <Button size="sm" className="rounded-lg" onClick={() => acao(a.id, 'enviar')}><Send className="mr-1.5 h-3.5 w-3.5" /> Enviar para análise</Button>}
                    {a.status === 'pausado' && <Button size="sm" className="rounded-lg" onClick={() => acao(a.id, 'retomar')}><Play className="mr-1.5 h-3.5 w-3.5" /> Retomar</Button>}
                    {a.status !== 'suspenso' && (
                      <Link href={`/monitorias/painel/anuncios/${a.id}`} aria-label={`Editar ${a.titulo}`}>
                        <Button size="sm" variant="ghost" className="rounded-lg"><Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar</Button>
                      </Link>
                    )}
                    {['publicado', 'pausado'].includes(a.status) && (
                      <Link href={`/monitorias/anuncio/${a.slug}`} aria-label={`Ver ${a.titulo} na vitrine`}>
                        <Button size="sm" variant="ghost" className="rounded-lg"><Eye className="h-3.5 w-3.5" /></Button>
                      </Link>
                    )}
                    {a.status === 'publicado' && (
                      <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => acao(a.id, 'pausar')} aria-label={`Pausar ${a.titulo}`}><Pause className="h-3.5 w-3.5" /></Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        Regras, taxa de 10%, garantia de 48h e reembolsos: <Link href="/monitorias/termos?papel=monitor" className="font-semibold text-primary hover:underline">Termos do Monitor</Link>
      </p>
    </div>
  )
}

