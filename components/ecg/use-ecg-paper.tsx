'use client'

import React from 'react'
import { Sun, Activity } from 'lucide-react'
import {
  ECG_PAPERS, ECG_PAPER_DEFAULT, ecgPalette,
  type EcgPaperPalette, type EcgPaperTheme,
} from '@/lib/ecg/paper'

/**
 * Preferência de papel do eletrocardiograma — uma só para o Manual inteiro.
 *
 * A trilha de ensino e o simulador leem do MESMO lugar: quem troca para o papel
 * claro na lição continua no papel claro ao abrir o simulador, e a escolha
 * sobrevive ao recarregamento. Sem isso, o mesmo traçado apareceria com duas
 * caras diferentes em duas abas do mesmo produto.
 *
 * O estado mora fora do React (um store mínimo com `useSyncExternalStore`)
 * justamente porque os dois lados precisam se enxergar sem passar props por
 * uma dúzia de componentes.
 */

const KEY = 'gradex:ecg-paper'

let current: EcgPaperTheme = ECG_PAPER_DEFAULT
let hydrated = false
const listeners = new Set<() => void>()

function readStored(): EcgPaperTheme {
  try {
    const v = window.localStorage.getItem(KEY)
    if (v === 'claro' || v === 'verde') return v
  } catch { /* modo privado / storage bloqueado: fica no padrão */ }
  return ECG_PAPER_DEFAULT
}

function emit() { listeners.forEach((fn) => fn()) }

function subscribe(fn: () => void) {
  if (!hydrated) {
    hydrated = true
    current = readStored()
  }
  listeners.add(fn)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) { current = readStored(); emit() }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(fn)
    window.removeEventListener('storage', onStorage)
  }
}

const getSnapshot = () => current
/** No servidor (e na hidratação) vale sempre o padrão — nada de mismatch. */
const getServerSnapshot = () => ECG_PAPER_DEFAULT

export function setEcgPaper(theme: EcgPaperTheme) {
  if (current === theme) return
  current = theme
  try { window.localStorage.setItem(KEY, theme) } catch { /* ignora */ }
  emit()
}

export interface EcgPaperState {
  theme: EcgPaperTheme
  palette: EcgPaperPalette
  /** true quando o tema é o monitor verde — atalho para as APIs antigas com `dark` */
  dark: boolean
  setTheme: (t: EcgPaperTheme) => void
  toggle: () => void
}

export function useEcgPaper(): EcgPaperState {
  const theme = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return React.useMemo(() => ({
    theme,
    palette: ecgPalette(theme),
    dark: theme === 'verde',
    setTheme: setEcgPaper,
    toggle: () => setEcgPaper(theme === 'claro' ? 'verde' : 'claro'),
  }), [theme])
}

/* ───────────────────────── seletor ───────────────────────── */

/**
 * Botões de troca de papel. Dois botões lado a lado, e não um interruptor:
 * num interruptor a pessoa precisa adivinhar se o rótulo diz onde ela está ou
 * para onde vai — aqui o estado atual fica marcado e o alvo, visível.
 */
export function EcgPaperPicker({
  className = '', size = 'md', label,
}: {
  className?: string
  size?: 'sm' | 'md'
  label?: string
}) {
  const { theme, setTheme } = useEcgPaper()
  const pad = size === 'sm' ? 'min-h-[32px] px-2 text-[10.5px]' : 'min-h-[36px] px-2.5 text-[11.5px]'

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {label && (
        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}</span>
      )}
      <div
        className="inline-flex items-center gap-0.5 rounded-xl border border-border bg-muted/40 p-0.5"
        role="group"
        aria-label="Aparência do papel do eletrocardiograma"
      >
        {(Object.keys(ECG_PAPERS) as EcgPaperTheme[]).map((k) => {
          const p = ECG_PAPERS[k]
          const active = theme === k
          const Icon = k === 'claro' ? Sun : Activity
          return (
            <button
              key={k}
              type="button"
              onClick={() => setTheme(k)}
              aria-pressed={active}
              title={p.hint}
              className={`inline-flex items-center gap-1.5 rounded-[10px] font-bold transition ${pad} ${
                active
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span
                className="h-3 w-3 shrink-0 rounded-[3px] border"
                style={{ backgroundColor: p.bg, borderColor: p.gridBold }}
                aria-hidden
              />
              <Icon className="h-3 w-3 shrink-0" aria-hidden />
              {/* No cabeçalho da lição o espaço é curto: no celular ficam só a
                  amostra do papel e o ícone, que já dizem o que cada opção é. */}
              <span className={size === 'sm' ? 'hidden sm:inline' : ''}>{p.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
