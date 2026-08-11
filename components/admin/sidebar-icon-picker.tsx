'use client'

import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import {
  SIDEBAR_ICON_GROUPS,
  getSidebarIconLabel,
} from '@/lib/sidebar-icons'
import { getSidebarIconComponent } from '@/components/sidebar-icon-map'

/**
 * Escolha do ícone de uma seção do menu.
 *
 * Fechado, mostra só o ícone atual — a lista de seções tem 17 linhas e abrir
 * 130 ícones em todas de uma vez deixaria a tela impossível de ler. Aberto,
 * traz o catálogo agrupado com busca por nome em português.
 */
export function SidebarIconPicker({
  value,
  sectionLabel,
  onChange,
}: {
  value: string
  sectionLabel: string
  onChange: (iconName: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const CurrentIcon = getSidebarIconComponent(value)

  const groups = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return SIDEBAR_ICON_GROUPS

    return SIDEBAR_ICON_GROUPS.map((group) => ({
      ...group,
      // Busca pelo rótulo em português E pelo nome técnico: quem conhece o
      // lucide procura por "scan-line", quem não conhece procura por "raio".
      icons: group.icons.filter(
        (icon) =>
          icon.label.toLowerCase().includes(term) || icon.name.toLowerCase().includes(term)
      ),
    })).filter((group) => group.icons.length > 0)
  }, [query])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Trocar ícone de ${sectionLabel} (atual: ${getSidebarIconLabel(value)})`}
        title={`Ícone: ${getSidebarIconLabel(value)}`}
        className="flex h-11 w-11 items-center justify-center rounded-lg border bg-background transition-colors hover:bg-muted"
      >
        <CurrentIcon className="h-5 w-5" />
      </button>

      {open && (
        <>
          {/* Clique fora fecha. Fica atrás do painel no empilhamento. */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-xl border bg-card p-3 shadow-xl">
            <div className="mb-3 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar ícone…"
                  className="w-full rounded-lg border bg-background py-2 pl-8 pr-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="rounded-lg border p-2 transition-colors hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto pr-1">
              {groups.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nenhum ícone encontrado.
                </p>
              )}

              {groups.map((group) => (
                <div key={group.label} className="mb-3 last:mb-0">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-6 gap-1.5">
                    {group.icons.map((icon) => {
                      const Icon = getSidebarIconComponent(icon.name)
                      const selected = icon.name === value
                      return (
                        <button
                          key={icon.name}
                          type="button"
                          onClick={() => {
                            onChange(icon.name)
                            setOpen(false)
                          }}
                          title={icon.label}
                          aria-label={icon.label}
                          aria-pressed={selected}
                          className={`flex h-10 items-center justify-center rounded-lg border transition-colors ${
                            selected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'hover:bg-muted'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
