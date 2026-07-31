'use client'

/**
 * Painel do Plus+ Guard em /admin/settings.
 *
 * Concentra tudo que controla o risco do cargo único: cotas de download,
 * janela de arrependimento, score de risco e clawback de reembolso. O texto
 * de cada campo explica o que ele protege — quem mexe aqui está calibrando
 * quanto do acervo dá para extrair antes de o reembolso deixar de ser garantido.
 */

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, CheckCircle, ShieldCheck, ShieldAlert, Activity } from 'lucide-react'
import { PLUS_LABEL } from '@/lib/account-tier'
import type { PlusDownloadQuota, PlusGuardSettings } from '@/lib/types'

interface TopConsumer {
  _id: string
  userName?: string
  userEmail?: string
  count: number
  inRefundWindow: number
  lastDownload: string
}

interface Overview {
  plusUsers: number
  plusExpiredPending: number
  plusInRefundWindow: number
  downloads24h: number
  downloads7d: number
  downloadsInRefundWindow: number
  flaggedUsers: number
  blockedUsers: number
  topConsumers: TopConsumer[]
}

export function PlusGuardPanel() {
  const [guard, setGuard] = useState<PlusGuardSettings | null>(null)
  const [overview, setOverview] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings/plus')
      if (!res.ok) throw new Error('Falha ao carregar')
      const data = await res.json()
      setGuard(data.plusGuard)
      setOverview(data.overview)
    } catch {
      setError('Não foi possível carregar a configuração do Plus+.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function save() {
    if (!guard) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/admin/settings/plus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plusGuard: guard }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha ao salvar')
      setGuard(data.plusGuard)
      setSuccess('Configuração do Plus+ salva.')
      setTimeout(() => setSuccess(''), 4000)
    } catch (e: any) {
      setError(e.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  function set<K extends keyof PlusGuardSettings>(key: K, value: PlusGuardSettings[K]) {
    setGuard(g => (g ? { ...g, [key]: value } : g))
  }

  function setQuota(which: 'trialWindow' | 'steadyState', field: keyof PlusDownloadQuota, value: number) {
    setGuard(g => (g ? { ...g, [which]: { ...g[which], [field]: value } } : g))
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Carregando configuração do {PLUS_LABEL}…
        </CardContent>
      </Card>
    )
  }

  if (!guard) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-red-500">
          {error || 'Configuração indisponível.'}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Panorama ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Panorama do {PLUS_LABEL}
          </CardTitle>
          <CardDescription>
            Consumo real do acervo. Um pico dentro da janela de arrependimento costuma
            anteceder um pedido de reembolso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat
              label={`Assinantes ${PLUS_LABEL} ativos`}
              value={overview?.plusUsers ?? 0}
              hint="Contas de usuário, não banidas, com prazo em dia (vitalício conta)."
            />
            <Stat
              label="Em janela de reembolso"
              value={overview?.plusInRefundWindow ?? 0}
              hint="Assinaram há menos dias que a janela — sujeitos às cotas reduzidas."
            />
            <Stat
              label="Vencidos aguardando rebaixe"
              value={overview?.plusExpiredPending ?? 0}
              tone={overview && overview.plusExpiredPending > 0 ? 'warn' : 'default'}
              hint="Prazo já venceu mas o cargo continua. Se não zerar, o cron de assinaturas não está rodando."
            />
            <Stat
              label="Contas sinalizadas"
              value={overview?.flaggedUsers ?? 0}
              tone={overview && overview.flaggedUsers > 0 ? 'warn' : 'default'}
              hint="Passaram do score de risco e aguardam revisão."
            />
            <Stat label="Downloads 24h" value={overview?.downloads24h ?? 0} />
            <Stat label="Downloads 7d" value={overview?.downloads7d ?? 0} />
            <Stat
              label="Downloads na janela (7d)"
              value={overview?.downloadsInRefundWindow ?? 0}
              tone={overview && overview.downloadsInRefundWindow > overview.downloads7d * 0.5 ? 'warn' : 'default'}
              hint="Quanto do consumo veio de quem ainda pode pedir reembolso."
            />
            <Stat
              label="Downloads bloqueados"
              value={overview?.blockedUsers ?? 0}
              tone={overview && overview.blockedUsers > 0 ? 'danger' : 'default'}
            />
          </div>

          {overview && overview.topConsumers.length > 0 && (
            <div className="rounded-lg border">
              <div className="border-b bg-muted/40 px-3 py-2 text-xs font-medium">
                Maiores consumidores (7 dias)
              </div>
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Usuário</th>
                      <th className="px-3 py-2 font-medium">Downloads</th>
                      <th className="px-3 py-2 font-medium">Na janela</th>
                      <th className="px-3 py-2 font-medium">Último</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.topConsumers.map(c => (
                      <tr key={c._id} className="border-b last:border-0">
                        <td className="px-3 py-2">
                          <div className="font-medium">{c.userName || '—'}</div>
                          <div className="text-muted-foreground">{c.userEmail}</div>
                        </td>
                        <td className="px-3 py-2 font-mono">{c.count}</td>
                        <td className="px-3 py-2 font-mono">
                          {c.inRefundWindow > 0 ? (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                              {c.inRefundWindow}
                            </span>
                          ) : (
                            '0'
                          )}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {new Date(c.lastDownload).toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Configuração ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {guard.enabled ? (
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-amber-600" />
            )}
            Proteção do {PLUS_LABEL}
          </CardTitle>
          <CardDescription>
            O {PLUS_LABEL} libera a plataforma inteira, e o CDC garante 7 dias de
            arrependimento. As cotas abaixo existem para que ninguém consiga levar o
            acervo antes de esse prazo passar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Toggle
            checked={guard.enabled}
            onChange={v => set('enabled', v)}
            title="Ativar proteção"
            description="Desligado, nada é bloqueado — os downloads continuam sendo registrados para auditoria."
          />

          <div className="space-y-2">
            <Label className="text-sm">Janela de arrependimento (dias)</Label>
            <Input
              type="number"
              min={0}
              className="max-w-[160px]"
              value={guard.refundWindowDays}
              onChange={e => set('refundWindowDays', parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              Prazo legal de reembolso (art. 49 do CDC = 7 dias). Enquanto a assinatura
              estiver dentro dele, valem as cotas reduzidas.
            </p>
          </div>

          <QuotaBlock
            title="Cotas na janela de arrependimento"
            description="Assinante novo, dinheiro ainda estornável. Deve caber o uso de um aluno real e não caber uma raspagem do acervo."
            quota={guard.trialWindow}
            onChange={(f, v) => setQuota('trialWindow', f, v)}
          />

          <QuotaBlock
            title="Cotas após a janela"
            description="Reembolso já não é automático. Aqui as cotas servem só contra automação e conta compartilhada."
            quota={guard.steadyState}
            onChange={(f, v) => setQuota('steadyState', f, v)}
          />

          <div className="space-y-2">
            <Label className="text-sm">Teto total na janela de arrependimento</Label>
            <Input
              type="number"
              min={0}
              className="max-w-[160px]"
              value={guard.refundWindowTotalCap}
              onChange={e => set('refundWindowTotalCap', parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              Máximo de downloads somando todos os dias da janela, independente das cotas
              por hora/dia. É a trava que impede juntar o acervo dia após dia. 0 = sem teto.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm">Score de risco para sinalizar</Label>
              <Input
                type="number"
                min={0}
                value={guard.riskScoreThreshold}
                onChange={e => set('riskScoreThreshold', parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                0–100. Soma volume, rajada, IPs distintos e peso extra dentro da janela.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Dispositivos simultâneos</Label>
              <Input
                type="number"
                min={0}
                max={20}
                value={guard.maxDevices}
                onChange={e => set('maxDevices', parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Limita o compartilhamento de conta. 0 = usa o padrão global do sistema.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Toggle
              checked={guard.autoBlockOnRisk}
              onChange={v => set('autoBlockOnRisk', v)}
              title="Bloquear downloads automaticamente ao cruzar o score"
              description="Agressivo: pega o abuso na hora, mas pode travar um usuário legítimo em semana de prova. Deixe desligado para apenas sinalizar."
            />
            <Toggle
              checked={guard.enforceWatermark}
              onChange={v => set('enforceWatermark', v)}
              title="Marca d'água identificada em todo PDF"
              description="Cada arquivo sai com nome, e-mail e impressão digital do assinante. Um PDF que vazar aponta para a conta de origem."
            />
            <Toggle
              checked={guard.revokeOnRefund}
              onChange={v => set('revokeOnRefund', v)}
              title="Revogar acesso ao aprovar reembolso"
              description="Reembolso ou estorno rebaixa a conta para gratuito e encerra a assinatura na hora. O histórico de downloads é preservado como prova."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Carência após reembolso (dias)</Label>
            <Input
              type="number"
              min={0}
              className="max-w-[160px]"
              value={guard.refundCooldownDays}
              onChange={e => set('refundCooldownDays', parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              Impede que a mesma conta assine de novo logo após um reembolso e repita o
              ciclo. 0 = sem carência.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Mensagem exibida ao atingir a cota</Label>
            <Textarea
              rows={3}
              value={guard.quotaMessage}
              onChange={e => set('quotaMessage', e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <CheckCircle className="h-4 w-4" />
              {success}
            </div>
          )}

          <Button onClick={save} disabled={saving}>
            {saving ? 'Salvando…' : `Salvar configuração do ${PLUS_LABEL}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({
  label,
  value,
  tone = 'default',
  hint,
}: {
  label: string
  value: number
  tone?: 'default' | 'warn' | 'danger'
  hint?: string
}) {
  const toneClass =
    tone === 'danger'
      ? 'text-red-600 dark:text-red-400'
      : tone === 'warn'
        ? 'text-amber-600 dark:text-amber-400'
        : ''
  return (
    <div className="rounded-lg border bg-muted/30 p-3" title={hint}>
      <div className={`text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</div>
      <div className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{label}</div>
      {hint && <div className="mt-1 text-[10px] leading-tight text-muted-foreground/70">{hint}</div>}
    </div>
  )
}

function Toggle({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  title: string
  description: string
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0"
      />
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
      </span>
    </label>
  )
}

function QuotaBlock({
  title,
  description,
  quota,
  onChange,
}: {
  title: string
  description: string
  quota: PlusDownloadQuota
  onChange: (field: keyof PlusDownloadQuota, value: number) => void
}) {
  return (
    <div className="rounded-lg border border-dashed p-4">
      <div className="mb-1 text-sm font-medium">{title}</div>
      <p className="mb-3 text-xs text-muted-foreground">{description}</p>
      <div className="grid grid-cols-3 gap-3">
        {(
          [
            ['perHour', 'Por hora'],
            ['perDay', 'Por dia'],
            ['perWeek', 'Por semana'],
          ] as const
        ).map(([field, label]) => (
          <div key={field}>
            <Label className="text-xs">{label}</Label>
            <Input
              type="number"
              min={0}
              value={quota[field]}
              onChange={e => onChange(field, parseInt(e.target.value) || 0)}
            />
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">0 em qualquer campo desativa aquele corte.</p>
    </div>
  )
}
