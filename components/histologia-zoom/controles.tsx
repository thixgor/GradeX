'use client'

import { forwardRef, useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

/**
 * Peças de interface do visualizador. Ficam separadas para o componente
 * principal ler como composição, não como marcação.
 */

/** Botão de ferramenta sobre o palco escuro. Alvo de 40 px (44 px no toque). */
export const BotaoDeFerramenta = forwardRef<
  HTMLButtonElement,
  {
    rotulo: string
    atalho?: string
    ativo?: boolean
    onClick: () => void
    children: React.ReactNode
    desabilitado?: boolean
    className?: string
  }
>(function BotaoDeFerramenta({ rotulo, atalho, ativo = false, onClick, children, desabilitado, className = '' }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={desabilitado}
      aria-label={rotulo}
      aria-pressed={ativo || undefined}
      title={atalho ? `${rotulo} (${atalho})` : rotulo}
      className={`inline-flex h-10 min-w-10 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2 text-white/85 transition-colors [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:min-w-11 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300 disabled:opacity-35 ${
        ativo ? 'bg-teal-400/20 text-teal-200 ring-1 ring-inset ring-teal-300/40' : ''
      } ${className}`}
    >
      {children}
    </button>
  )
})

export function Separador() {
  return <span className="mx-0.5 h-6 w-px shrink-0 bg-white/15" aria-hidden />
}

/** Controle deslizante com rótulo, valor e botão de restaurar. */
export function Deslizador({
  rotulo,
  valor,
  min,
  max,
  passo = 1,
  padrao,
  unidade = '',
  onChange,
  formatar,
}: {
  rotulo: string
  valor: number
  min: number
  max: number
  passo?: number
  padrao: number
  unidade?: string
  onChange: (v: number) => void
  formatar?: (v: number) => string
}) {
  const id = useId()
  const alterado = valor !== padrao
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-xs font-semibold">
          {rotulo}
        </label>
        <span className="flex items-center gap-1.5">
          <output htmlFor={id} className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {formatar ? formatar(valor) : `${valor}${unidade}`}
          </output>
          {alterado && (
            <button
              type="button"
              onClick={() => onChange(padrao)}
              className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-teal-700 hover:bg-teal-500/10 dark:text-teal-300"
            >
              restaurar
            </button>
          )}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={passo}
        value={valor}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-6 w-full cursor-pointer accent-teal-600"
      />
    </div>
  )
}

export function Alternador({
  rotulo,
  descricao,
  ativo,
  onChange,
}: {
  rotulo: string
  descricao?: string
  ativo: boolean
  onChange: (v: boolean) => void
}) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-3">
      <label htmlFor={id} className="cursor-pointer">
        <span className="block text-xs font-semibold">{rotulo}</span>
        {descricao && <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{descricao}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={ativo}
        onClick={() => onChange(!ativo)}
        className={`relative mt-0.5 inline-flex h-6 w-10 shrink-0 items-center rounded-full border transition-colors ${
          ativo ? 'border-teal-600 bg-teal-600' : 'border-border bg-muted'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            ativo ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
        <span className="sr-only">{ativo ? 'ligado' : 'desligado'}</span>
      </button>
    </div>
  )
}

/**
 * Folha lateral (tablet/PC) ou inferior (celular) sobre o palco.
 *
 * Fica **dentro** do elemento em tela cheia: um portal para o `body` sumiria
 * atrás dele, porque a Fullscreen API só mostra a subárvore do elemento.
 */
export function Folha({
  titulo,
  subtitulo,
  aberta,
  onFechar,
  children,
  largura = 'normal',
}: {
  titulo: string
  subtitulo?: string
  aberta: boolean
  onFechar: () => void
  children: React.ReactNode
  largura?: 'normal' | 'larga'
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const idTitulo = useId()

  useEffect(() => {
    if (aberta) ref.current?.focus()
  }, [aberta])

  if (!aberta) return null
  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="false"
      aria-labelledby={idTitulo}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation()
          onFechar()
        }
      }}
      className={`absolute z-40 flex flex-col overflow-hidden bg-background text-foreground shadow-2xl outline-none
        inset-x-0 bottom-0 max-h-[72%] rounded-t-2xl border-t border-border
        sm:inset-x-auto sm:bottom-3 sm:right-3 sm:top-3 sm:max-h-none sm:rounded-2xl sm:border ${
          largura === 'larga' ? 'sm:w-[min(460px,calc(100%-24px))]' : 'sm:w-[min(340px,calc(100%-24px))]'
        }`}
    >
      <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border sm:hidden" aria-hidden />
      <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 id={idTitulo} className="font-heading text-base font-semibold leading-tight">
            {titulo}
          </h2>
          {subtitulo && <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitulo}</p>}
        </div>
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar painel"
          className="-mr-1.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {children}
      </div>
    </div>
  )
}
