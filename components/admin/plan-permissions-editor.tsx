'use client'

/**
 * Editor das permissões modulares de um plano, dentro do card de planos em
 * /admin/settings.
 *
 * A tela é montada a partir de `PLAN_FEATURE_DEFINITIONS`, e não de um
 * formulário escrito à mão: assim uma área nova aparece aqui sozinha quando
 * for declarada no núcleo, sem risco de existir no servidor e faltar no
 * editor (ou o contrário, que é pior — o admin acha que configurou algo que
 * ninguém lê).
 *
 * O interruptor mestre é o contrato com o resto da plataforma: desligado, este
 * plano se comporta exatamente como antes destas permissões existirem.
 */

import { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Infinity as InfinityIcon, Lock, ShieldCheck, Stethoscope } from 'lucide-react'
import {
  MANUAL_CLINICO_MODULE_DEFINITIONS,
  PLAN_FEATURE_DEFINITIONS,
  PLAN_LIMIT_PERIODS,
  PLAN_LIMIT_PERIOD_LABELS,
  descreverRegra,
  normalizePlanPermissions,
  permissoesLiberadas,
  permissoesPadraoParaCargo,
  todosOsModulosDoManual,
  type ManualClinicoModuleKey,
  type PlanFeatureKey,
  type PlanLimitPeriod,
  type PlanPermissions,
} from '@/lib/plan-entitlements'
import type { AccountType } from '@/lib/types'

interface PlanPermissionsEditorProps {
  permissoes?: PlanPermissions | null
  role?: AccountType | string | null
  onChange: (permissoes: PlanPermissions) => void
}

export function PlanPermissionsEditor({ permissoes, role, onChange }: PlanPermissionsEditorProps) {
  // O formulário trabalha sempre com o objeto completo. Normalizar na entrada
  // evita o campo indefinido que vira input não-controlado no meio da edição.
  const valor = useMemo(() => normalizePlanPermissions(permissoes), [permissoes])

  const atualizar = (patch: Partial<PlanPermissions>) => onChange({ ...valor, ...patch })

  const atualizarRegra = (key: PlanFeatureKey, patch: Partial<PlanPermissions['regras'][PlanFeatureKey]>) =>
    atualizar({ regras: { ...valor.regras, [key]: { ...valor.regras[key], ...patch } } })

  const atualizarModulo = (key: ManualClinicoModuleKey, ligado: boolean) =>
    atualizar({ manualClinicoModulos: { ...valor.manualClinicoModulos, [key]: ligado } })

  /**
   * Ligar o interruptor num plano que nunca foi configurado carrega o que o
   * cargo já concede hoje. É o que garante que ativar não conceda nem tire
   * nada por acidente — o admin parte do estado real e ajusta a partir dele.
   */
  const alternarMestre = (ligado: boolean) => {
    if (!ligado) return atualizar({ ativo: false })
    const nuncaConfigurado = !permissoes?.atualizadoEm && !permissoes?.ativo
    if (nuncaConfigurado) {
      return onChange({ ...permissoesPadraoParaCargo(role), ativo: true })
    }
    return atualizar({ ativo: true })
  }

  const manualLiberado = valor.regras.manualClinico.liberado
  const modulosLigados = MANUAL_CLINICO_MODULE_DEFINITIONS.filter(
    m => valor.manualClinicoModulos[m.key] !== false,
  ).length

  return (
    <div className="rounded-lg border border-dashed bg-muted/20 p-3 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
            <Label className="text-xs font-semibold">Permissões deste plano</Label>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {valor.ativo ? (
              <>
                Ligado: <strong>estas regras substituem</strong> os limites padrão do cargo para
                quem assina este plano. Não há soma — o que está aqui é o que vale.
              </>
            ) : (
              <>
                Desligado: o plano libera o que o cargo já libera, com os limites padrão da
                plataforma. Ligue para modular área por área.
              </>
            )}
          </p>
        </div>
        <Switch checked={valor.ativo} onCheckedChange={alternarMestre} />
      </div>

      {valor.ativo && (
        <>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-[11px]"
              onClick={() => onChange({ ...permissoesLiberadas(), ativo: true })}
            >
              Liberar tudo sem limite
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-[11px]"
              onClick={() => onChange({ ...permissoesPadraoParaCargo(role), ativo: true })}
            >
              Voltar ao padrão do cargo
            </Button>
          </div>

          <div className="space-y-2">
            {PLAN_FEATURE_DEFINITIONS.map(def => {
              const regra = valor.regras[def.key]
              const comTeto = regra.liberado && def.suportaLimite && regra.limite > 0
              return (
                <div
                  key={def.key}
                  className={`rounded-md border p-2.5 transition-colors ${
                    regra.liberado ? 'bg-background' : 'bg-muted/40 border-dashed'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {!regra.liberado && <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />}
                        <span className="text-xs font-medium">{def.label}</span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            regra.liberado
                              ? comTeto
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200'
                                : 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-200'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {descreverRegra(valor, def.key)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                        {def.descricao}
                      </p>
                    </div>
                    <Switch
                      checked={regra.liberado}
                      onCheckedChange={liberado => atualizarRegra(def.key, { liberado })}
                    />
                  </div>

                  {regra.liberado && def.suportaLimite && (
                    <div className="mt-2 flex flex-wrap items-end gap-2 border-t pt-2">
                      <div className="w-28">
                        <Label className="text-[10px] text-muted-foreground">
                          Limite (0 = sem limite)
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          className="h-8 text-xs"
                          value={regra.limite || ''}
                          placeholder="0"
                          onChange={e =>
                            atualizarRegra(def.key, {
                              limite: Math.max(0, parseInt(e.target.value, 10) || 0),
                            })
                          }
                        />
                      </div>
                      <div className="w-40">
                        <Label className="text-[10px] text-muted-foreground">Janela</Label>
                        <select
                          value={regra.periodo}
                          disabled={regra.limite <= 0}
                          onChange={e =>
                            atualizarRegra(def.key, { periodo: e.target.value as PlanLimitPeriod })
                          }
                          className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs shadow-sm disabled:opacity-50"
                        >
                          {PLAN_LIMIT_PERIODS.map(p => (
                            <option key={p} value={p}>
                              {PLAN_LIMIT_PERIOD_LABELS[p]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="flex-1 min-w-[10rem] pb-1.5 text-[10px] leading-snug text-muted-foreground">
                        {regra.limite > 0 ? (
                          <>
                            {regra.limite} {def.unidade} {PLAN_LIMIT_PERIOD_LABELS[regra.periodo]}
                            {regra.periodo !== 'total' && ' — janela deslizante, renova sozinha.'}
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <InfinityIcon className="h-3 w-3" />
                            Sem teto. {def.exemplo}
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Módulos do Manual Clínico — só fazem sentido com a área liberada. */}
                  {def.key === 'manualClinico' && manualLiberado && (
                    <div className="mt-2 border-t pt-2">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-[11px] font-medium">
                          <Stethoscope className="h-3 w-3" />
                          Funções incluídas ({modulosLigados}/
                          {MANUAL_CLINICO_MODULE_DEFINITIONS.length})
                        </span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className="text-[10px] text-primary hover:underline"
                            onClick={() => atualizar({ manualClinicoModulos: todosOsModulosDoManual(true) })}
                          >
                            Todas
                          </button>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <button
                            type="button"
                            className="text-[10px] text-primary hover:underline"
                            onClick={() => atualizar({ manualClinicoModulos: todosOsModulosDoManual(false) })}
                          >
                            Nenhuma
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                        {MANUAL_CLINICO_MODULE_DEFINITIONS.map(modulo => (
                          <label
                            key={modulo.key}
                            className="flex cursor-pointer items-start gap-2 rounded border bg-background/60 p-1.5"
                          >
                            <Checkbox
                              className="mt-0.5"
                              checked={valor.manualClinicoModulos[modulo.key] !== false}
                              onCheckedChange={ligado => atualizarModulo(modulo.key, ligado)}
                            />
                            <span className="min-w-0">
                              <span className="block text-[11px] font-medium leading-tight">
                                {modulo.label}
                              </span>
                              <span className="block text-[10px] leading-snug text-muted-foreground">
                                {modulo.descricao}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <p className="text-[10px] leading-relaxed text-muted-foreground">
            O Plus+ Guard (proteção antifraude de downloads) continua valendo por cima destas
            regras. Administradores nunca são limitados.
          </p>
        </>
      )}
    </div>
  )
}
