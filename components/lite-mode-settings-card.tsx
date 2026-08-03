'use client'

import { Check, Cpu, Gauge, Signal, Zap } from 'lucide-react'
import { useLiteMode } from '@/hooks/use-lite-mode'
import {
  LITE_PREFERENCE_DESCRIPTIONS,
  LITE_PREFERENCE_LABELS,
  type LitePreference,
} from '@/lib/lite-mode'
import { cn } from '@/lib/utils'

const OPTIONS: LitePreference[] = ['auto', 'on', 'off']

const WHAT_CHANGES = [
  'Animações, transições e efeitos de vidro',
  'Sombras, brilhos e gradientes pesados',
  'Fontes personalizadas (usa a do sistema)',
  'Anúncios rotativos e pré-carregamento de páginas',
]

/**
 * Painel completo do Modo Lite no Perfil.
 *
 * O toggle antigo era uma linha solta ("Lite Mode — melhora o desempenho")
 * enterrada no fim da página. Aqui a pessoa vê o estado atual, o porquê (o que
 * foi detectado no aparelho dela) e escolhe entre automático, sempre ativo ou
 * desligado.
 */
export function LiteModeSettingsCard() {
  const { liteMode, preference, setPreference, device, hydrated, autoEnabled } = useLiteMode()

  return (
    <div
      className={cn(
        'rounded-lg border bg-card shadow-sm',
        liteMode ? 'border-amber-500/40' : 'border-border',
      )}
    >
      <div className="flex items-start gap-3 border-b border-border p-4">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-md border',
            liteMode
              ? 'border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-300'
              : 'border-border bg-muted/40 text-muted-foreground',
          )}
        >
          {liteMode ? <Zap className="h-5 w-5 fill-current" /> : <Gauge className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">Modo Lite</h3>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                liteMode ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground',
              )}
            >
              {hydrated ? (liteMode ? 'Ativo' : 'Desativado') : '...'}
            </span>
            {autoEnabled && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                Automático
              </span>
            )}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Deixa a plataforma leve em celular antigo, notebook fraco ou internet ruim: as telas
            abrem mais rápido e a rolagem para de travar.
          </p>
        </div>
      </div>

      <div className="grid gap-2 p-4 sm:grid-cols-3">
        {OPTIONS.map((option) => {
          const active = preference === option
          return (
            <button
              key={option}
              type="button"
              onClick={() => setPreference(option)}
              aria-pressed={active}
              className={cn(
                'rounded-md border p-3 text-left transition-colors',
                active
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                  : 'border-border bg-background hover:bg-muted/60',
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{LITE_PREFERENCE_LABELS[option]}</span>
                {active && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </span>
              <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
                {LITE_PREFERENCE_DESCRIPTIONS[option]}
              </span>
              {option === 'auto' && (
                <span className="mt-1.5 inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">
                  Recomendado
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="border-t border-border px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          O que o Modo Lite desliga
        </p>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2">
          {WHAT_CHANGES.map((item) => (
            <li key={item} className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Nenhum conteúdo é escondido — só os enfeites. Você pode ligar e desligar a qualquer
          momento pelo ícone <Zap className="inline h-3 w-3" /> no topo da tela.
        </p>
      </div>

      {hydrated && device && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground">
          <span className="font-semibold uppercase tracking-wider">Detectado aqui:</span>
          {device.memory !== null && (
            <span className="inline-flex items-center gap-1">
              <Cpu className="h-3 w-3" />
              {device.memory} GB de memória
            </span>
          )}
          {device.cores !== null && (
            <span className="inline-flex items-center gap-1">
              <Cpu className="h-3 w-3" />
              {device.cores} núcleos
            </span>
          )}
          {device.effectiveType && (
            <span className="inline-flex items-center gap-1">
              <Signal className="h-3 w-3" />
              conexão {device.effectiveType.toUpperCase()}
            </span>
          )}
          {device.saveData && <span>economia de dados ligada</span>}
          {device.memory === null && device.cores === null && !device.effectiveType && (
            <span>seu navegador não informa os dados do aparelho</span>
          )}
        </div>
      )}
    </div>
  )
}
