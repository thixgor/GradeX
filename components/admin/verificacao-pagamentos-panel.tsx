'use client'

/**
 * "O pagamento automático está funcionando?" — topo da aba Pedidos do
 * DomineAqui Analytics.
 *
 * A aprovação chega por três caminhos: o webhook do Mercado Pago (na hora), a
 * tela do comprador consultando o status, e a varredura agendada (cron). Este
 * painel mostra os dois que o admin não vê — quando o webhook chegou por
 * último e se falhou, quando a varredura rodou e o que achou — e deixa rodar a
 * varredura na hora, sem esperar o agendamento.
 *
 * Autossuficiente: busca /api/admin/payments/saude só quando a aba abre.
 */

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, ShieldCheck } from 'lucide-react'
import type { SaudeDosPagamentos } from '@/lib/payments/verificacao'

const quando = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '—'

function haQuanto(iso?: string | null) {
  if (!iso) return 'nunca'
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.round(min / 60)
  if (h < 48) return `há ${h} h`
  return `há ${Math.round(h / 24)} dias`
}

const ORIGEM: Record<string, string> = { cron: 'cron externo', cron_assinaturas: 'cron diário', admin: 'admin' }

function Bloco({ titulo, ok, children }: { titulo: string; ok: boolean; children: React.ReactNode }) {
  return (
    <div className={`rounded-2xl border p-4 ${ok ? 'border-white/10 bg-black/10' : 'border-amber-300/25 bg-amber-400/[0.07]'}`}>
      <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-white/50">
        {ok ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />}
        {titulo}
      </p>
      <div className="space-y-1 text-sm text-white/75">{children}</div>
    </div>
  )
}

export function VerificacaoPagamentosPanel({ onAtualizado }: { onAtualizado: () => void }) {
  const [dados, setDados] = useState<SaudeDosPagamentos | null>(null)
  const [erro, setErro] = useState('')
  const [rodando, setRodando] = useState(false)
  const [resultado, setResultado] = useState('')

  const carregar = useCallback(async () => {
    setErro('')
    try {
      const res = await fetch('/api/admin/payments/saude', { cache: 'no-store' })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload.error || 'Falha ao carregar')
      setDados(payload)
    } catch (err: any) {
      setErro(err?.message || 'Falha ao carregar')
    }
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  async function verificarTodos() {
    if (rodando) return
    setRodando(true)
    setResultado('')
    try {
      const res = await fetch('/api/admin/payments/verificar-pendentes', { method: 'POST' })
      const r = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(r.error || 'Falha na verificação')
      const partes = [
        `${r.checked || 0} conferidos no Mercado Pago`,
        `${r.approved || 0} aprovados agora`,
        `${Math.max(0, (r.reconciled || 0) - (r.approved || 0))} com outro status atualizado`,
      ]
      if (r.foundByReference) partes.push(`${r.foundByReference} achados sem id de pagamento`)
      if (r.effectsResumed) partes.push(`${r.effectsResumed} liberações concluídas`)
      if (r.errors) partes.push(`${r.errors} com erro`)
      setResultado(partes.join(' · '))
      await carregar()
      onAtualizado()
    } catch (err: any) {
      setResultado(err?.message || 'Falha na verificação')
    } finally {
      setRodando(false)
    }
  }

  if (erro) return <p className="text-sm text-rose-300">{erro}</p>
  if (!dados) {
    return (
      <div className="flex items-center gap-2 text-sm text-white/50">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando verificação…
      </div>
    )
  }

  const w = dados.webhook
  // Assinatura inválida ou erro ao processar: a notificação chega e não serve
  // (segredo trocado, falha nossa) — o pagamento só entra pela varredura.
  const webhookOk = w.assinaturaInvalida24h === 0 && w.comErro24h === 0 && !!w.ultimoEm
  const v = dados.varredura
  const varreduraOk = !!v?.terminadaEm && Date.now() - new Date(v.terminadaEm).getTime() < 26 * 60 * 60_000
  const parados = dados.pendentes.total > 0 || dados.efeitosInterrompidos > 0

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Bloco titulo="Webhook do Mercado Pago" ok={webhookOk}>
          <p>
            Último aviso: <strong className="text-white">{haQuanto(w.ultimoEm)}</strong>{' '}
            <span className="text-white/40">({quando(w.ultimoEm)})</span>
          </p>
          <p>{w.ultimas24h} recebidos nas últimas 24 h</p>
          {w.assinaturaInvalida24h > 0 ? (
            <p className="text-amber-200">{w.assinaturaInvalida24h} com assinatura inválida — confira o segredo do webhook no painel do MP</p>
          ) : null}
          {w.comErro24h > 0 ? (
            <p className="text-amber-200">
              {w.comErro24h} falharam ao processar{w.ultimoErro ? `: ${w.ultimoErro}` : ''}
            </p>
          ) : null}
        </Bloco>
        <Bloco titulo="Varredura agendada" ok={varreduraOk}>
          {v ? (
            <>
              <p>
                Última: <strong className="text-white">{haQuanto(v.terminadaEm)}</strong>{' '}
                <span className="text-white/40">({ORIGEM[v.origem] || v.origem})</span>
              </p>
              <p>
                {v.stats.checked || 0} conferidos · {v.stats.approved || 0} aprovados
                {v.stats.errors ? ` · ${v.stats.errors} erros` : ''}
              </p>
            </>
          ) : (
            <p>Ainda não registrou nenhuma execução.</p>
          )}
          {!varreduraOk ? <p className="text-amber-200">Sem execução nas últimas 26 h — confira o cron.</p> : null}
        </Bloco>
        <Bloco titulo="Parados agora (14 dias)" ok={!parados}>
          <p>
            <strong className="text-white">{dados.pendentes.total}</strong> pedidos pendentes
            {dados.pendentes.semIdDoPagamento > 0 ? `, ${dados.pendentes.semIdDoPagamento} sem id de pagamento` : ''}
          </p>
          {dados.pendentes.maisAntigoEm ? <p className="text-white/50">Mais antigo: {quando(dados.pendentes.maisAntigoEm)}</p> : null}
          {dados.efeitosInterrompidos > 0 ? (
            <p className="text-amber-200">{dados.efeitosInterrompidos} aprovados com a liberação parada no meio</p>
          ) : null}
        </Bloco>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={verificarTodos}
          disabled={rodando}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {rodando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {rodando ? 'Conferindo no Mercado Pago…' : 'Verificar todos os pendentes agora'}
        </button>
        <button
          type="button"
          onClick={() => void carregar()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-white/60 transition hover:bg-white/5"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Atualizar
        </button>
        {resultado ? <span className="text-xs text-white/60">{resultado}</span> : null}
      </div>
      <p className="text-xs text-white/40">
        A verificação consulta o Mercado Pago e aplica o que ele disser — não aprova nada à força. Para um pedido só, use
        &quot;Verificar no MP&quot; na linha dele.
      </p>
    </div>
  )
}
