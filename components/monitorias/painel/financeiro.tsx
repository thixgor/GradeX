'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Banknote, CalendarClock, Download, FileText, Hourglass, ShieldAlert, Wallet } from 'lucide-react'
import { MetricTile } from '@/components/page-scaffold'
import { formatarCentavos } from '@/lib/monitorias/dinheiro'
import { formatarEmBrasilia } from '@/lib/fuso-brasilia'
import { Esqueleto, Selo, api } from '../base'

interface Financeiro {
  resumo: { emGarantiaCentavos: number; liberadoCentavos: number; emPagamentoCentavos: number; pagoCentavos: number; saldoDevedorCentavos: number }
  vendas: Array<{ id: string; participacaoId: string; reservaId: string; anuncioTitulo: string; inicio: string | null; brutoCentavos: number; taxaCentavos: number; liquidoCentavos: number; status: string; liberaEm: string | null; createdAt: string }>
  payouts: Array<{ id: string; totalCentavos: number; abatidoCentavos: number; status: string; pix: string; e2eId: string | null; pagoEm: string | null; temComprovante: boolean; createdAt: string }>
  lancamentos: Array<{ tipo: string; valorCentavos: number; descricao: string; em: string }>
}

const STATUS: Record<string, { r: string; t: 'neutro' | 'info' | 'alerta' | 'sucesso' | 'erro' }> = {
  em_garantia: { r: 'Em garantia', t: 'info' },
  liberado: { r: 'Liberado', t: 'sucesso' },
  em_pagamento: { r: 'Pagando', t: 'alerta' },
  pago: { r: 'Pago', t: 'sucesso' },
  estornado: { r: 'Estornado', t: 'erro' },
  retido: { r: 'Retido', t: 'alerta' },
}

export function FinanceiroMonitor() {
  const [f, setF] = useState<Financeiro | null>(null)
  useEffect(() => {
    api<Financeiro>('/api/monitorias/tutor/financeiro').then(setF).catch(() => setF(null))
  }, [])
  if (!f) return <Esqueleto className="h-96" />
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Em garantia" value={formatarCentavos(f.resumo.emGarantiaCentavos)} hint="libera 48h após a aula" icon={<Hourglass className="h-4 w-4" />} />
        <MetricTile label="Liberado" value={formatarCentavos(f.resumo.liberadoCentavos)} hint="entra no próximo repasse" icon={<Wallet className="h-4 w-4" />} />
        <MetricTile label="Em pagamento" value={formatarCentavos(f.resumo.emPagamentoCentavos)} hint="PIX sendo enviado" icon={<CalendarClock className="h-4 w-4" />} />
        <MetricTile label="Já recebido" value={formatarCentavos(f.resumo.pagoCentavos)} icon={<Banknote className="h-4 w-4" />} />
      </div>
      {f.resumo.saldoDevedorCentavos > 0 && (
        <p className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
          <ShieldAlert className="h-4 w-4" /> Saldo devedor de {formatarCentavos(f.resumo.saldoDevedorCentavos)} (estorno após repasse) — será abatido do próximo pagamento.
        </p>
      )}
      <p className="text-xs text-muted-foreground">Como funciona: o aluno paga → valor fica em garantia → 48h depois da aula, sem reclamação, fica liberado → a plataforma envia por PIX (90% do valor; 10% é a taxa de intermediação).</p>

      <section>
        <h2 className="mb-2 font-heading text-lg font-semibold">Repasses recebidos</h2>
        {f.payouts.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum repasse ainda.</p> : (
          <ul className="space-y-2">
            {f.payouts.map((p) => (
              <motion.li key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{formatarCentavos(p.totalCentavos)} <span className="font-normal text-muted-foreground">→ {p.pix}</span></p>
                  <p className="text-xs text-muted-foreground">{p.pagoEm ? `Pago em ${formatarEmBrasilia(p.pagoEm)}` : 'Em processamento'}{p.e2eId ? ` · E2E ${p.e2eId}` : ''}</p>
                </div>
                <Selo tom={p.status === 'pago' ? 'sucesso' : 'alerta'}>{p.status === 'pago' ? 'Pago' : 'Em aberto'}</Selo>
                <a href={`/api/monitorias/documentos/repasse/${p.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"><FileText className="h-3.5 w-3.5" /> Demonstrativo</a>
                {p.temComprovante && <a href={`/api/monitorias/payouts/${p.id}/comprovante`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"><Download className="h-3.5 w-3.5" /> Comprovante PIX</a>}
              </motion.li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-heading text-lg font-semibold">Vendas</h2>
        {f.vendas.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma venda ainda.</p> : (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr><th className="p-3">Monitoria</th><th className="p-3">Bruto</th><th className="p-3">Taxa 10%</th><th className="p-3">Você recebe</th><th className="p-3">Situação</th><th className="p-3" /></tr>
              </thead>
              <tbody>
                {f.vendas.map((v) => (
                  <tr key={v.id} className="border-t border-border">
                    <td className="p-3"><p className="font-medium">{v.anuncioTitulo}</p><p className="text-xs text-muted-foreground">{v.inicio ? formatarEmBrasilia(v.inicio) : ''}</p></td>
                    <td className="p-3 tabular-nums">{formatarCentavos(v.brutoCentavos)}</td>
                    <td className="p-3 tabular-nums text-muted-foreground">-{formatarCentavos(v.taxaCentavos)}</td>
                    <td className="p-3 font-semibold tabular-nums">{formatarCentavos(v.liquidoCentavos)}</td>
                    <td className="p-3"><Selo tom={STATUS[v.status]?.t || 'neutro'}>{STATUS[v.status]?.r || v.status}</Selo></td>
                    <td className="p-3"><a href={`/api/monitorias/documentos/venda/${v.participacaoId}`} className="text-xs font-semibold text-primary hover:underline">PDF</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {f.lancamentos.length > 0 && (
        <section>
          <h2 className="mb-2 font-heading text-lg font-semibold">Extrato</h2>
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card text-sm">
            {f.lancamentos.map((l, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="min-w-0"><span className="block truncate">{l.descricao}</span><span className="text-xs text-muted-foreground">{formatarEmBrasilia(l.em)}</span></span>
                <span className={`shrink-0 font-semibold tabular-nums ${l.valorCentavos < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{l.valorCentavos < 0 ? '-' : '+'}{formatarCentavos(Math.abs(l.valorCentavos))}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
