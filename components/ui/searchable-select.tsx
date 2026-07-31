'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search } from 'lucide-react'

interface SearchableSelectProps {
  id?: string
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  className?: string
  /**
   * Opção de escape ("Não encontro minha instituição na lista"). Ao escolhê-la,
   * o select vira um campo de texto livre e `onChange` passa a receber o que o
   * usuário digitar — assim nenhum dado se perde quando a lista não cobre o
   * caso dele. A própria opção de escape nunca é gravada como valor.
   */
  customOption?: string
  /** Placeholder do campo de texto livre. */
  customPlaceholder?: string
}

interface Position {
  top: number
  left: number
  width: number
  maxHeight: number
  dropUp: boolean
}

const MARGIN = 8
const MIN_PANEL_HEIGHT = 160
const MAX_PANEL_HEIGHT = 360

export function SearchableSelect({
  id,
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  searchPlaceholder = 'Buscar...',
  disabled,
  className = '',
  customOption,
  customPlaceholder = 'Digite aqui',
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [custom, setCustom] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [position, setPosition] = useState<Position | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (disabled) setOpen(false)
  }, [disabled])

  const updatePosition = () => {
    const trigger = buttonRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom - MARGIN
    const spaceAbove = rect.top - MARGIN
    const dropUp = spaceBelow < MIN_PANEL_HEIGHT && spaceAbove > spaceBelow

    const available = dropUp ? spaceAbove : spaceBelow
    const maxHeight = Math.max(MIN_PANEL_HEIGHT, Math.min(MAX_PANEL_HEIGHT, available))

    setPosition({
      top: dropUp ? rect.top - maxHeight - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      maxHeight,
      dropUp,
    })
  }

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return

    const handleReposition = () => updatePosition()
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (buttonRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setOpen(false)
      setQuery('')
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setQuery('')
        buttonRef.current?.focus()
      }
    }

    window.addEventListener('resize', handleReposition)
    window.addEventListener('scroll', handleReposition, true)
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('resize', handleReposition)
      window.removeEventListener('scroll', handleReposition, true)
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      // Foco no campo de busca só depois do painel montar/posicionar.
      const t = setTimeout(() => searchInputRef.current?.focus(), 0)
      return () => clearTimeout(t)
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((opt) => opt.toLowerCase().includes(q))
  }, [options, query])

  if (customOption && custom) {
    return (
      <input
        id={id}
        type="text"
        autoFocus
        disabled={disabled}
        value={value}
        placeholder={customPlaceholder}
        onChange={(e) => onChange(e.target.value)}
        className={className}
      />
    )
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`${className} flex items-center justify-between text-left disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className={`truncate ${value ? '' : 'text-muted-foreground'}`}>{value || placeholder}</span>
        <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
      </button>

      {mounted && open && !disabled && position && createPortal(
        <div
          ref={panelRef}
          className="fixed z-[200] flex flex-col rounded-lg border border-border bg-card shadow-xl overflow-hidden"
          style={{ top: position.top, left: position.left, width: position.width, maxHeight: position.maxHeight }}
        >
          <div className="flex items-center gap-2 border-b border-border p-2 flex-shrink-0">
            <Search className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="overflow-y-auto py-1">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum resultado encontrado</div>
            )}
            {filtered.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  if (customOption && opt === customOption) {
                    setCustom(true)
                    onChange('')
                  } else {
                    onChange(opt)
                  }
                  setOpen(false)
                  setQuery('')
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                  opt === value ? 'bg-muted/60 font-medium text-foreground' : 'text-foreground/90'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
