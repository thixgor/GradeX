'use client'

/**
 * Admin → Monitorias → "Resumos por IA": gasto do mês contra o orçamento,
 * receita própria do adicional (separada do repasse), tarefas por estado e,
 * em cada aula, custo estimado × real, cobertura, compradores e as ações do
 * suporte (tentar de novo, reembolsar o adicional). Nunca mostra transcrição.
 */

import { useCallback, useEffect, useState } from 'react'
import { Brain, ExternalLink, Loader2, RotateCcw, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api, CaixaAviso, Esqueleto, Selo } from '@/components/monitorias/base'
import { formatarCentavos } from '@/lib/monitorias/dinheiro'
import { formatarEmBrasilia } from '@/lib/fuso-brasilia'
import { cn } from '@/lib/utils'

interface Tarefa {
  reservaId: string
  titulo: string
  inicio: string
  fim: string
  status: string
  individual: boolean
  cobertura: number | null
  custo: { estimadoUsd: number; realUsd: number }
  tentativas: number
  erro: string | null
  falhouEm: string | null
  prontoEm: string | null
  teste: boolean
  monitorAutorizou: boolean | null
  adicionais: Array<{ status: string; precoCentavos: number; teste: boolean; reembolso: { motivo: string; status: string } | null }>
}

interface Painel {
  orcamento: { mensalUsd: number; gastoUsd: number; chamadas: number; aulas: number }
  receitaDoMes: { vendasCentavos: number; reembolsosCentavos: number }
  receitaTotal: Record<string, { n: number; centavos: number }>
  porStatus: Record<string, number>
  tarefas: Tarefa[]
}

const ROTULOS: Record<string, string> = {
  aguardando: 'Aguardando a aula',
  transcrevendo: 'Transcrevendo',
  resumindo: 'Gerando resumo',
  pronto: 'Pronto',
  falhou: 'Falhou',
  cancelado: 'Cancelado',
}
const TOM: Record<string, 'neutro' | 'info' | 'sucesso' | 'erro' | 'alerta'> = {
  aguardando: 'neutro',
  transcrevendo: 'info',
  resumindo: 'info',
  pronto: 'sucesso',
  falhou: 'erro',
  cancelado: 'alerta',
}
const usd = (v: number) => `US$ ${v.toFixed(v < 1 ? 3 : 2)}`

export function AdminResumosIA({ onMudou }: { onMudou: () => void }) {
  const [filtro, setFiltro] = useState<string>('')
  const [dados, setDados] = useState<Painel | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)

  const carregar = useCallback(() => {
    api<Painel>(`/api/admin/monitorias/resumos-ia${filtro ? `?status=${filtro}` : ''}`)
      .then(setDados)
      .catch(() => setDados(null))
  }, [filtro])
  useEffect(() => carregar(), [carregar])

  async function agir(t: Tarefa, acao: 'tentar_de_novo' | 'reembolsar') {
    let motivo: string | undefined
    if (acao === 'reembolsar') {
      const m = window.prompt('Motivo do reembolso do Resumo por IA (o aluno vai ler):', 'Não foi possível gerar o resumo desta aula')
      if (!m) return
      motivo = m
    }
    setOcupado(`${t.reservaId}:${acao}`)
    try {
      const r = await api<Record<string, unknown>>('/api/admin/monitorias/resumos-ia', { method: 'POST', json: { acao, reservaId: t.reservaId, ...(motivo ? { motivo } : {}) } })
      if (acao === 'reembolsar' && typeof r.falhas === 'number' && r.falhas > 0) alert('Algumas devoluções não confirmaram no Mercado Pago agora; a varredura tenta de novo.')
      carregar()
      onMudou()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro')
    } finally {
      setOcupado(null)
    }
  }

  if (!dados) return <Esqueleto className="h-72" />
  const o = dados.orcamento
  const pct = o.mensalUsd > 0 ? Math.min(100, (o.gastoUsd / o.mensalUsd) * 100) : 0
  const vendidos = (dados.receitaTotal.pago?.centavos || 0) + (dados.receitaTotal.entregue?.centavos || 0)

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gasto com IA no mês</p>
          <p className="mt-1 font-heading text-2xl font-semibold">{usd(o.gastoUsd)}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className={cn('h-full', pct >= 100 ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500')} style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">de {usd(o.mensalUsd)} · {o.aulas} aula(s) · {o.chamadas} chamada(s)</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Receita do adicional no mês</p>
          <p className="mt-1 font-heading text-2xl font-semibold">{formatarCentavos(dados.receitaDoMes.vendasCentavos - dados.receitaDoMes.reembolsosCentavos)}</p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            vendas {formatarCentavos(dados.receitaDoMes.vendasCentavos)} · reembolsos {formatarCentavos(dados.receitaDoMes.reembolsosCentavos)}. 100% da plataforma (fora do repasse do monitor).
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Desde o início</p>
          <p className="mt-1 font-heading text-2xl font-semibold">{formatarCentavos(vendidos)}</p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {dados.receitaTotal.entregue?.n || 0} entregue(s) · {dados.receitaTotal.pago?.n || 0} a entregar · {dados.receitaTotal.reembolsado?.n || 0} reembolsado(s)
          </p>
        </div>
      </div>

      {(dados.porStatus.falhou || 0) > 0 && (
        <CaixaAviso>
          {dados.porStatus.falhou} resumo(s) falharam depois das novas tentativas. Tente de novo ou reembolse o adicional; sem solução em 48 h, o adicional volta sozinho para o aluno.
        </CaixaAviso>
      )}

      <div className="flex flex-wrap gap-2">
        {['', 'falhou', 'transcrevendo', 'resumindo', 'aguardando', 'pronto', 'cancelado'].map((s) => (
          <Button key={s || 'todas'} size="sm" variant={filtro === s ? 'default' : 'outline'} onClick={() => setFiltro(s)}>
            {s ? ROTULOS[s] : 'Todas'}
            {s && dados.porStatus[s] ? <span className="ml-1.5 rounded-full bg-background/30 px-1.5 text-[10px]">{dados.porStatus[s]}</span> : null}
          </Button>
        ))}
      </div>

      {dados.tarefas.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Brain className="h-4 w-4" /> Nenhum resumo por aqui.</p>
      ) : (
        <ul className="space-y-3">
          {dados.tarefas.map((t) => {
            const pagos = t.adicionais.filter((a) => a.status === 'pago').length
            return (
              <li key={t.reservaId} className="rounded-2xl border border-border bg-card p-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{t.titulo}</p>
                  <Selo tom={TOM[t.status] || 'neutro'}>{ROTULOS[t.status] || t.status}</Selo>
                  {t.teste && <Selo tom="info">teste</Selo>}
                  <Selo>{t.individual ? 'individual' : 'grupo'}</Selo>
                  <span className="text-xs text-muted-foreground">{formatarEmBrasilia(t.inicio)}</span>
                  <a href={`/monitorias/reservas/${t.reservaId}`} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                    Reserva <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Custo {usd(t.custo.realUsd)} (estimado {usd(t.custo.estimadoUsd)}) · cobertura {t.cobertura != null ? `${t.cobertura}%` : '—'} · monitor{' '}
                  {t.monitorAutorizou === null ? 'ainda não decidiu' : t.monitorAutorizou ? 'autorizou' : 'não autorizou'}
                  {t.tentativas ? ` · ${t.tentativas} tentativa(s)` : ''}
                </p>
                {t.erro && <p className="mt-1 rounded-lg bg-rose-500/10 px-2 py-1 text-xs text-rose-700 dark:text-rose-300">{t.erro}</p>}
                <ul className="mt-2 flex flex-wrap gap-1.5 text-xs">
                  {t.adicionais.map((a, i) => (
                    <li key={i} className="rounded-md bg-muted px-2 py-0.5">
                      {a.teste ? 'teste' : formatarCentavos(a.precoCentavos)} · {a.status}
                      {a.reembolso ? ` (${a.reembolso.motivo})` : ''}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  {t.status === 'pronto' && (
                    <a href={`/monitorias/reservas/${t.reservaId}/resumo`} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-3 text-xs font-medium hover:bg-muted">
                      <Brain className="h-3.5 w-3.5" /> Ler (fica registrado)
                    </a>
                  )}
                  {['falhou', 'resumindo', 'transcrevendo'].includes(t.status) && pagos > 0 && (
                    <Button size="sm" variant="outline" disabled={!!ocupado} onClick={() => void agir(t, 'tentar_de_novo')}>
                      {ocupado === `${t.reservaId}:tentar_de_novo` ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="mr-1 h-3.5 w-3.5" />} Tentar de novo
                    </Button>
                  )}
                  {pagos > 0 && t.status !== 'pronto' && (
                    <Button size="sm" variant="outline" className="text-rose-600" disabled={!!ocupado} onClick={() => void agir(t, 'reembolsar')}>
                      {ocupado === `${t.reservaId}:reembolsar` ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Undo2 className="mr-1 h-3.5 w-3.5" />} Reembolsar adicional
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
