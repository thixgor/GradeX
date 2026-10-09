'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, ExternalLink, Eye, Pause, Pencil, Play, Plus, Send, Star, Wallet, CalendarClock, Inbox } from 'lucide-react'
import { MetricTile } from '@/components/page-scaffold'
import { Button } from '@/components/ui/button'
import { formatarCentavos } from '@/lib/monitorias/dinheiro'
import { cn } from '@/lib/utils'
import { api, CaixaAviso, Selo } from '../base'
import type { DadosPainel } from './tipos'

const STATUS_ANUNCIO: Record<string, { rotulo: string; tom: 'neutro' | 'info' | 'alerta' | 'sucesso' | 'erro' }> = {
  rascunho: { rotulo: 'Rascunho', tom: 'neutro' },
  em_analise: { rotulo: 'Em análise', tom: 'info' },
  publicado: { rotulo: 'No ar', tom: 'sucesso' },
  rejeitado: { rotulo: 'Precisa de ajustes', tom: 'erro' },
  pausado: { rotulo: 'Pausado', tom: 'alerta' },
  suspenso: { rotulo: 'Suspenso', tom: 'erro' },
}

export function VisaoGeral({ dados, recarregar }: { dados: DadosPainel; recarregar: () => void }) {
  const req = dados.requisitosMonitor
  const feitos = req.itens.filter((i) => i.ok).length
  const pct = req.itens.length ? Math.round((feitos / req.itens.length) * 100) : 0
  const t = dados.tutor

  async function acao(id: string, acao: 'enviar' | 'pausar' | 'retomar') {
    try {
      await api(`/api/monitorias/tutor/anuncios/${id}/acao`, { method: 'POST', json: { acao } })
      recarregar()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro')
    }
  }

  return (
    <div className="space-y-6">
      {!req.ok && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border bg-card p-5">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0">
              <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-muted" strokeWidth="3.5" />
                <motion.circle
                  cx="18" cy="18" r="15.5" fill="none" className="stroke-primary" strokeWidth="3.5" strokeLinecap="round"
                  strokeDasharray="97.4" initial={{ strokeDashoffset: 97.4 }} animate={{ strokeDashoffset: 97.4 - (97.4 * pct) / 100 }} transition={{ duration: 1, ease: 'easeOut' }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{pct}%</span>
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold">Complete seu cadastro de monitor</h2>
              <p className="text-sm text-muted-foreground">Por segurança (envolve dinheiro), só publicamos anúncios com tudo preenchido e verificado.</p>
            </div>
          </div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {req.itens.map((i) => (
              <li key={i.chave} className={cn('flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm', i.ok ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border')}>
                <span className="flex items-center gap-2">
                  {i.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-amber-500" />}
                  {i.rotulo}
                </span>
                {!i.ok && i.acao && <Link href={i.acao.href} className="shrink-0 text-xs font-semibold text-primary hover:underline">{i.acao.texto}</Link>}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {t?.status === 'suspenso' && <CaixaAviso tom="alerta">Seu perfil de monitor está suspenso. Fale com o suporte.</CaixaAviso>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Pedidos pendentes" value={dados.pedidosPendentes} icon={<Inbox className="h-4 w-4" />} hint="aguardando você" />
        <MetricTile label="Em garantia" value={formatarCentavos(t?.financeiro.emGarantiaCentavos || 0)} icon={<CalendarClock className="h-4 w-4" />} hint="libera 48h após a aula" />
        <MetricTile label="Disponível p/ repasse" value={formatarCentavos(t?.financeiro.liberadoCentavos || 0)} icon={<Wallet className="h-4 w-4" />} hint="pago por PIX" />
        <MetricTile label="Avaliação" value={t?.stats.avaliacoes ? t.stats.nota.toFixed(1) : '—'} icon={<Star className="h-4 w-4" />} hint={`${t?.stats.aulasDadas || 0} aulas dadas`} />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Meus anúncios</h2>
          <Link href="/monitorias/painel/anuncios/novo"><Button size="sm"><Plus className="mr-1.5 h-4 w-4" /> Novo anúncio</Button></Link>
        </div>
        {dados.anuncios.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center">
            <p className="font-semibold">Você ainda não tem anúncios</p>
            <p className="mt-1 text-sm text-muted-foreground">Crie o primeiro: conte o que você ensina, defina preço, agenda e forma de contratação.</p>
            <Link href="/monitorias/painel/anuncios/novo"><Button className="mt-4"><Plus className="mr-1.5 h-4 w-4" /> Criar anúncio</Button></Link>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {dados.anuncios.map((a, i) => {
              const s = STATUS_ANUNCIO[a.status] || { rotulo: a.status, tom: 'neutro' as const }
              return (
                <motion.li key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold">{a.titulo}</p>
                        <Selo tom={s.tom}>{s.rotulo}</Selo>
                        {a.temRevisaoPendente && <Selo tom="info">Alteração em análise</Selo>}
                        {a.direto && !a.ofertaAssinada && <Selo tom="alerta">Agenda direta sem oferta assinada</Selo>}
                      </div>
                      <p className="text-xs text-muted-foreground">{a.materia} · {formatarCentavos(a.preco.valorCentavos)}/{a.preco.modo === 'hora' ? 'h' : 'aula'} · {a.stats.reservas} reservas · {a.stats.perguntas} perguntas</p>
                      {a.moderacao?.motivo && ['rejeitado', 'suspenso'].includes(a.status) && <p className="mt-1 text-xs text-rose-600">Moderação: {a.moderacao.motivo}</p>}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {['publicado', 'pausado'].includes(a.status) && <Link href={`/monitorias/anuncio/${a.slug}`}><Button size="sm" variant="ghost"><Eye className="mr-1 h-3.5 w-3.5" /> Ver</Button></Link>}
                      {a.status !== 'suspenso' && <Link href={`/monitorias/painel/anuncios/${a.id}`}><Button size="sm" variant="outline"><Pencil className="mr-1 h-3.5 w-3.5" /> Editar</Button></Link>}
                      {['rascunho', 'rejeitado'].includes(a.status) && <Button size="sm" onClick={() => acao(a.id, 'enviar')}><Send className="mr-1 h-3.5 w-3.5" /> Enviar p/ análise</Button>}
                      {a.status === 'publicado' && <Button size="sm" variant="outline" onClick={() => acao(a.id, 'pausar')}><Pause className="mr-1 h-3.5 w-3.5" /> Pausar</Button>}
                      {a.status === 'pausado' && <Button size="sm" onClick={() => acao(a.id, 'retomar')}><Play className="mr-1 h-3.5 w-3.5" /> Retomar</Button>}
                    </div>
                  </div>
                </motion.li>
              )
            })}
          </ul>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Dúvidas sobre regras, taxa de 10%, garantia de 48h e reembolsos? <Link href="/monitorias/termos?papel=monitor" className="font-semibold text-primary hover:underline">Leia os Termos do Monitor <ExternalLink className="inline h-3 w-3" /></Link>
      </p>
    </div>
  )
}
