'use client'

/**
 * Upgrade Quest+ → Plus+ em /admin/settings.
 *
 * Tudo o que muda a oferta que o Quest+ vê na /upgrade, no perfil, no
 * checkout e no e-mail: ligar/desligar, o desconto, quais planos Plus+ entram,
 * qual abre selecionado e a contagem regressiva. O servidor aplica exatamente
 * o que está salvo aqui (lib/upgrade-quest.ts) — a tela é só a vitrine.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, CheckCircle, Crown, ExternalLink, GraduationCap, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { precoDeUpgrade, precoDoBolsista, type ConfigDoUpgradeQuest } from '@/lib/upgrade-quest'
import { cn } from '@/lib/utils'

interface PlanoPlus {
  tipo: string
  nome: string
  periodo: string
  preco: number
  oculto: boolean
  durationMonths: number
}

interface Resposta {
  config: ConfigDoUpgradeQuest
  padrao: ConfigDoUpgradeQuest
  limites: {
    descontoMinimo: number
    descontoMaximo: number
    horasMinimas: number
    horasMaximas: number
    extraMinimo: number
    extraMaximo: number
  }
  planos: PlanoPlus[]
  panorama: { questVigentes: number; upgradesPagos: number; receitaDeUpgrades: number }
}

const brl = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`

export function UpgradeQuestPanel() {
  const [dados, setDados] = useState<Resposta | null>(null)
  const [config, setConfig] = useState<ConfigDoUpgradeQuest | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')

  const carregar = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings/upgrade', { cache: 'no-store' })
      if (!res.ok) throw new Error()
      const d: Resposta = await res.json()
      setDados(d)
      setConfig(d.config)
    } catch {
      setErro('Não foi possível carregar a configuração do upgrade.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function salvar() {
    if (!config) return
    setSalvando(true)
    setErro('')
    setOk('')
    try {
      const res = await fetch('/api/admin/settings/upgrade', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Falha ao salvar')
      setConfig(d.config)
      setOk('Oferta de upgrade salva. Já vale para a página, o checkout e o próximo e-mail.')
      setTimeout(() => setOk(''), 5000)
    } catch (e: any) {
      setErro(e.message || 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  // Planos que entram, com a mesma regra do servidor (lista vazia = visíveis).
  const naOferta = useMemo(() => {
    if (!dados || !config) return []
    return dados.planos.filter((p) => (config.planos.length > 0 ? config.planos.includes(p.tipo) : !p.oculto))
  }, [dados, config])

  if (carregando) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">Carregando o upgrade Quest+ → Plus+…</CardContent>
      </Card>
    )
  }
  if (!dados || !config) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-red-500">{erro || 'Configuração indisponível.'}</CardContent>
      </Card>
    )
  }

  const { limites, panorama } = dados
  const listaPersonalizada = config.planos.length > 0

  function alternarPlano(tipo: string) {
    setConfig((c) => {
      if (!c) return c
      // Sair do modo "todos os visíveis" começa com os visíveis marcados.
      const base = c.planos.length > 0 ? c.planos : dados!.planos.filter((p) => !p.oculto).map((p) => p.tipo)
      const proxima = base.includes(tipo) ? base.filter((t) => t !== tipo) : [...base, tipo]
      return { ...c, planos: proxima }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" />
          Upgrade Quest+ → Plus+
        </CardTitle>
        <CardDescription>
          A oferta que o assinante Quest+ vê em <code>/upgrade</code>, no perfil, no checkout e no e-mail de
          /admin/emails. O desconto é aplicado pelo servidor só para contas Quest+ vigentes, e nunca soma com cupom
          ou PROUNI — vale o maior.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <Numero rotulo="Quest+ que podem receber" valor={String(panorama.questVigentes)} />
          <Numero rotulo="Upgrades pagos" valor={String(panorama.upgradesPagos)} />
          <Numero rotulo="Receita de upgrades" valor={brl(panorama.receitaDeUpgrades)} />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
          <div>
            <Label htmlFor="upgrade-ativo" className="text-sm font-semibold">
              Oferta no ar
            </Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Desligada: o Quest+ compra o Plus+ pelo preço cheio em /buy, sem página de oferta nem desconto.
            </p>
          </div>
          <Switch
            id="upgrade-ativo"
            checked={config.ativo}
            onCheckedChange={(v) => setConfig({ ...config, ativo: v })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="upgrade-desconto">Desconto do upgrade (%)</Label>
            <Input
              id="upgrade-desconto"
              type="number"
              inputMode="numeric"
              min={limites.descontoMinimo}
              max={limites.descontoMaximo}
              value={config.descontoPercentual}
              onChange={(e) => setConfig({ ...config, descontoPercentual: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">
              Entre {limites.descontoMinimo}% e {limites.descontoMaximo}%. Padrão: {dados.padrao.descontoPercentual}%.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="upgrade-padrao">Plano que abre selecionado</Label>
            <select
              id="upgrade-padrao"
              value={config.planoPadrao}
              onChange={(e) => setConfig({ ...config, planoPadrao: e.target.value })}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Automático (o anual, senão o destaque)</option>
              {naOferta.map((p) => (
                <option key={p.tipo} value={p.tipo}>
                  {p.nome} — {p.periodo || p.tipo}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">É também o plano anunciado no e-mail.</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <Label>Planos Plus+ na oferta</Label>
            {listaPersonalizada && (
              <button
                type="button"
                onClick={() => setConfig({ ...config, planos: [] })}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Voltar a “todos os visíveis”
              </button>
            )}
          </div>
          <div className="divide-y rounded-xl border">
            {dados.planos.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">Nenhum plano Plus+ com preço cadastrado.</p>
            )}
            {dados.planos.map((p) => {
              const marcado = naOferta.some((n) => n.tipo === p.tipo)
              return (
                <label key={p.tipo} className="flex cursor-pointer items-center gap-3 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={() => alternarPlano(p.tipo)}
                    className="h-4 w-4 accent-[hsl(var(--primary))]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {p.nome} — {p.periodo || p.tipo}
                      {p.oculto && <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold">oculto</span>}
                    </span>
                  </span>
                  <span className={cn('text-right text-sm tabular-nums', !marcado && 'text-muted-foreground')}>
                    <s className="mr-2 text-xs text-muted-foreground">{brl(p.preco)}</s>
                    <strong>{brl(precoDeUpgrade(p.preco, config.descontoPercentual))}</strong>
                  </span>
                </label>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {listaPersonalizada
              ? 'Lista personalizada: só os marcados entram (um plano oculto marcado vira um plano “só de upgrade”).'
              : 'Sem lista: entram todos os Plus+ visíveis em /buy. Desmarque para escolher a dedo.'}
          </p>
        </div>

        <div className="space-y-3 rounded-xl border p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="upgrade-urgencia" className="flex items-center gap-1.5 text-sm font-semibold">
                <Timer className="h-4 w-4" /> Contagem regressiva
              </Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Cada pessoa vê o próprio prazo (o mesmo no celular, no computador e no e-mail). Quando ele zera, abre-se
                uma nova janela — o preço de upgrade continua valendo no checkout.
              </p>
            </div>
            <Switch
              id="upgrade-urgencia"
              checked={config.urgencia.ativa}
              onCheckedChange={(v) => setConfig({ ...config, urgencia: { ...config.urgencia, ativa: v } })}
            />
          </div>
          <div className="max-w-[220px] space-y-1.5">
            <Label htmlFor="upgrade-horas">Tamanho da janela (horas)</Label>
            <Input
              id="upgrade-horas"
              type="number"
              inputMode="numeric"
              min={limites.horasMinimas}
              max={limites.horasMaximas}
              disabled={!config.urgencia.ativa}
              value={config.urgencia.horas}
              onChange={(e) => setConfig({ ...config, urgencia: { ...config.urgencia, horas: Number(e.target.value) } })}
            />
          </div>
        </div>

        <div className="space-y-3 rounded-xl border p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="upgrade-bolsista" className="flex items-center gap-1.5 text-sm font-semibold">
                <GraduationCap className="h-4 w-4" /> Extra para bolsista PROUNI/FIES
              </Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Para o Quest+ com PROUNI/FIES aprovado para o plano, o desconto do benefício SOMA com este extra
                (aplicado sobre o preço já com o PROUNI), e a concessão é usada na compra. Vale sempre o menor preço
                entre o upgrade comum e o de bolsista. Desligado: o bolsista fica com o maior entre o PROUNI e o
                upgrade.
              </p>
            </div>
            <Switch
              id="upgrade-bolsista"
              checked={config.bolsista.ativo}
              onCheckedChange={(v) => setConfig({ ...config, bolsista: { ...config.bolsista, ativo: v } })}
            />
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="max-w-[220px] space-y-1.5">
              <Label htmlFor="upgrade-extra">Extra sobre o preço com PROUNI (%)</Label>
              <Input
                id="upgrade-extra"
                type="number"
                inputMode="numeric"
                min={limites.extraMinimo}
                max={limites.extraMaximo}
                disabled={!config.bolsista.ativo}
                value={config.bolsista.descontoExtra}
                onChange={(e) =>
                  setConfig({ ...config, bolsista: { ...config.bolsista, descontoExtra: Number(e.target.value) } })
                }
              />
            </div>
            {config.bolsista.ativo && naOferta[0] && (
              // Um exemplo com o primeiro plano da oferta e um PROUNI de 50%:
              // é o jeito mais rápido de ver se o número faz sentido.
              <p className="pb-2 text-xs text-muted-foreground">
                Ex.: {naOferta[0].nome} — {naOferta[0].periodo || naOferta[0].tipo} com PROUNI de 50%:{' '}
                {brl(naOferta[0].preco * 0.5)} →{' '}
                <strong className="text-foreground">
                  {brl(precoDoBolsista(Math.round(naOferta[0].preco * 50) / 100, config.bolsista.descontoExtra))}
                </strong>{' '}
                (o upgrade comum sairia {brl(precoDeUpgrade(naOferta[0].preco, config.descontoPercentual))}).
              </p>
            )}
          </div>
        </div>

        {erro && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {erro}
          </div>
        )}
        {ok && (
          <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" /> {ok}
          </div>
        )}

        <div className="flex flex-wrap gap-3 border-t pt-4">
          <Button onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar oferta de upgrade'}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/upgrade?previa=1" target="_blank">
              Ver a página como Quest+ <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/admin/emails">Enviar o e-mail de upgrade</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function Numero({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-xl border bg-muted/30 p-3">
      <p className="text-[11px] leading-tight text-muted-foreground">{rotulo}</p>
      <p className="mt-1 text-lg font-bold tabular-nums">{valor}</p>
    </div>
  )
}
