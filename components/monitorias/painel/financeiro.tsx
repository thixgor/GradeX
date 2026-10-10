'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Banknote, CalendarClock, Download, FileText, Hourglass, ShieldAlert, Wallet } from 'lucide-react'
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

const ETAPAS = [
  { chave: 'emGarantiaCentavos', rotulo: 'Em garantia', dica: 'até 48h depois da aula', icone: Hourglass },
  { chave: 'liberadoCentavos', rotulo: 'Liberado', dica: 'vai no próximo repasse', icone: Wallet },
  { chave: 'emPagamentoCentavos', rotulo: 'Enviando', dica: 'PIX a caminho', icone: CalendarClock },
  { chave: 'pagoCentavos', rotulo: 'Recebido', dica: 'na sua conta', icone: Banknote },
] as const

export function FinanceiroMonitor() {
  const [f, setF] = useState<Financeiro | null>(null)
  const [todasVendas, setTodasVendas] = useState(false)
  const [todoExtrato, setTodoExtrato] = useState(false)
  useEffect(() => {
    api<Financeiro>('/api/monitorias/tutor/financeiro').then(setF).catch(() => setF(null))
  }, [])
  if (!f) return <Esqueleto className="h-96" />
  const vendas = todasVendas ? f.vendas : f.vendas.slice(0, 6)
  const extrato = todoExtrato ? f.lancamentos : f.lancamentos.slice(0, 8)
  return (
    <div className="space-y-10">
      {/* O caminho do dinheiro, da esquerda para a direita */}
      <section aria-label="Resumo do seu dinheiro">
        <ol className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-4">
          {ETAPAS.map((e, i) => (
            <li key={e.chave} className="bg-card p-5">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <e.icone className="h-4 w-4" strokeWidth={1.75} /> {e.rotulo}
                {i < ETAPAS.length - 1 && <span className="ml-auto hidden text-muted-foreground/50 sm:inline" aria-hidden>→</span>}
              </p>
              <p className={`mt-2 font-heading text-2xl font-semibold tabular-nums ${i === 1 && f.resumo[e.chave] > 0 ? 'text-primary' : ''}`}>{formatarCentavos(f.resumo[e.chave])}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{e.dica}</p>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-muted-foreground">Você recebe 90% de cada aula. Os 10% restantes são a taxa da plataforma.</p>
        {f.resumo.saldoDevedorCentavos > 0 && (
          <p className="mt-3 flex items-center gap-2 rounded-xl bg-amber-500/10 px-3.5 py-2.5 text-sm text-amber-800 dark:text-amber-300">
            <ShieldAlert className="h-4 w-4 shrink-0" /> Saldo devedor de {formatarCentavos(f.resumo.saldoDevedorCentavos)} (estorno depois do repasse). Ele é abatido do próximo pagamento.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-heading text-lg font-semibold">Repasses</h2>
        {f.payouts.length === 0 ? (
          <p className="rounded-2xl bg-muted/40 px-4 py-4 text-sm text-muted-foreground">Nenhum repasse ainda. O primeiro sai depois da garantia da sua primeira aula.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {f.payouts.map((p) => (
              <motion.li key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap items-center gap-3 px-4 py-3.5 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold tabular-nums">{formatarCentavos(p.totalCentavos)} <span className="font-normal text-muted-foreground">para {p.pix}</span></p>
                  <p className="text-xs text-muted-foreground">{p.pagoEm ? `Pago em ${formatarEmBrasilia(p.pagoEm)}` : 'Em processamento'}{p.e2eId ? `, E2E ${p.e2eId}` : ''}</p>
                </div>
                <Selo tom={p.status === 'pago' ? 'sucesso' : 'alerta'}>{p.status === 'pago' ? 'Pago' : 'Em aberto'}</Selo>
                <a href={`/api/monitorias/documentos/repasse/${p.id}`} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10"><FileText className="h-3.5 w-3.5" /> Demonstrativo</a>
                {p.temComprovante && <a href={`/api/monitorias/payouts/${p.id}/comprovante`} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10"><Download className="h-3.5 w-3.5" /> Comprovante</a>}
              </motion.li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-heading text-lg font-semibold">Vendas</h2>
        {f.vendas.length === 0 ? (
          <p className="rounded-2xl bg-muted/40 px-4 py-4 text-sm text-muted-foreground">Nenhuma venda ainda.</p>
        ) : (
          <>
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {vendas.map((v) => (
                <li key={v.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3.5 text-sm sm:grid-cols-[minmax(0,1fr)_7rem_6rem_9.5rem]">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{v.anuncioTitulo}</p>
                    <p className="text-xs text-muted-foreground">{v.inicio ? formatarEmBrasilia(v.inicio) : ''}</p>
                  </div>
                  <p className="hidden text-right text-xs text-muted-foreground sm:block">
                    <span className="block tabular-nums">{formatarCentavos(v.brutoCentavos)}</span>
                    <span className="tabular-nums">taxa -{formatarCentavos(v.taxaCentavos)}</span>
                  </p>
                  <p className="text-right font-semibold tabular-nums">{formatarCentavos(v.liquidoCentavos)}</p>
                  <div className="col-span-2 flex items-center gap-2 sm:col-span-1 sm:justify-end">
                    <Selo tom={STATUS[v.status]?.t || 'neutro'}>{STATUS[v.status]?.r || v.status}</Selo>
                    <a href={`/api/monitorias/documentos/venda/${v.participacaoId}`} className="rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10" aria-label={`PDF da venda ${v.anuncioTitulo}`}>PDF</a>
                  </div>
                </li>
              ))}
            </ul>
            {f.vendas.length > 6 && (
              <button type="button" onClick={() => setTodasVendas((x) => !x)} className="mt-3 text-sm font-semibold text-primary hover:underline">
                {todasVendas ? 'Mostrar menos' : `Ver todas as ${f.vendas.length} vendas`}
              </button>
            )}
          </>
        )}
      </section>

      {f.lancamentos.length > 0 && (
        <section>
          <h2 className="mb-3 font-heading text-lg font-semibold">Extrato</h2>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card text-sm">
            {extrato.map((l, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0"><span className="block truncate">{l.descricao}</span><span className="text-xs text-muted-foreground">{formatarEmBrasilia(l.em)}</span></span>
                <span className={`shrink-0 font-semibold tabular-nums ${l.valorCentavos < 0 ? 'text-muted-foreground' : 'text-primary'}`}>{l.valorCentavos < 0 ? '-' : '+'}{formatarCentavos(Math.abs(l.valorCentavos))}</span>
              </li>
            ))}
          </ul>
          {f.lancamentos.length > 8 && (
            <button type="button" onClick={() => setTodoExtrato((x) => !x)} className="mt-3 text-sm font-semibold text-primary hover:underline">
              {todoExtrato ? 'Mostrar menos' : `Ver extrato completo (${f.lancamentos.length})`}
            </button>
          )}
        </section>
      )}
    </div>
  )
}
