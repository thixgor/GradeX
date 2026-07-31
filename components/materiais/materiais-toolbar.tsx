'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ArrowDownWideNarrow,
  Check as CheckIcon,
  FileText,
  Gift,
  Package,
  Search,
  ShoppingBag,
  Tag,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type MateriaisTab = 'materials' | 'packages' | 'loja' | 'mine'

/** Id do painel controlado pelos chips de seção (`aria-controls`). */
export const MATERIAIS_PANEL_ID = 'materiais-panel'
export type PriceFilter = 'all' | 'free' | 'paid'
export type SortKey = 'relevance' | 'recent' | 'downloads' | 'price-asc'

export const SORT_LABELS: Record<SortKey, string> = {
  relevance: 'Relevância',
  recent: 'Mais recentes',
  downloads: 'Mais baixados',
  'price-asc': 'Menor preço',
}

const TABS: { id: MateriaisTab; label: string; icon: React.ReactNode }[] = [
  { id: 'materials', label: 'Materiais', icon: <FileText className="h-3.5 w-3.5" /> },
  { id: 'packages', label: 'Pacotes', icon: <Package className="h-3.5 w-3.5" /> },
  { id: 'loja', label: 'Loja', icon: <ShoppingBag className="h-3.5 w-3.5" /> },
  { id: 'mine', label: 'Meus materiais', icon: <CheckIcon className="h-3.5 w-3.5" /> },
]

const PRICE_FILTERS: { id: PriceFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'free', label: 'Gratuitos' },
  { id: 'paid', label: 'Pagos' },
]

/**
 * Barra de navegação de /materiais — busca, seções, filtro de preço e
 * ordenação, colada logo abaixo do cabeçalho do AppShell (`h-14 sm:h-16`).
 *
 * Mesmo padrão já usado em `/flashcards` e `/aulas`: antes tudo isso vivia
 * dentro do hero e rolava para fora da tela, obrigando o usuário a voltar ao
 * topo para trocar de seção ou refinar a busca.
 */
export function MateriaisToolbar({
  search,
  onSearchChange,
  activeTab,
  onTabChange,
  priceFilter,
  onPriceFilterChange,
  sort,
  onSortChange,
  counts,
}: {
  search: string
  onSearchChange: (value: string) => void
  activeTab: MateriaisTab
  onTabChange: (tab: MateriaisTab) => void
  priceFilter: PriceFilter
  onPriceFilterChange: (filter: PriceFilter) => void
  sort: SortKey
  onSortChange: (sort: SortKey) => void
  counts: Partial<Record<MateriaisTab, number>>
}) {
  const [searchOpen, setSearchOpen] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)

  // Mantém a seção ativa visível na régua. Sem isso, abrir /materiais já numa
  // seção (link direto, voltar do navegador) deixava o chip ativo fora da tela.
  useEffect(() => {
    const active = rowRef.current?.querySelector<HTMLElement>('[data-active="true"]')
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [activeTab])

  // O filtro de preço só afeta a consulta de materiais e pacotes — deixá-lo
  // visível na Loja e em "Meus materiais" sugeria um efeito que não existe.
  const showPriceFilters = activeTab === 'materials' || activeTab === 'packages'
  const showSort = showPriceFilters || activeTab === 'mine'
  const hasActiveFilters = priceFilter !== 'all' || !!search.trim()

  const tabs = (
    <div
      ref={rowRef}
      role="tablist"
      aria-label="Seções de materiais"
      className="scrollbar-hide fade-scroll-x flex gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 -mb-0.5 pr-5 lg:pr-0"
    >
      {TABS.map(tab => (
        <SectionChip
          key={tab.id}
          id={tab.id}
          active={activeTab === tab.id}
          count={counts[tab.id]}
          icon={tab.icon}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </SectionChip>
      ))}
    </div>
  )

  const renderSearchInput = (showClear: boolean, autoFocus = false) => (
    <div className="relative flex-1">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        type="search"
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        enterKeyHint="search"
        autoFocus={autoFocus}
        placeholder="Buscar materiais..."
        aria-label="Buscar materiais"
        // `type=search` dá o teclado certo no celular, mas o WebKit desenha um
        // "x" próprio que ficava colado no nosso — daí o appearance-none.
        // 16px reais no mobile: abaixo disso o iOS dá zoom sozinho ao focar o
        // campo e desalinha a página inteira.
        className={cn(
          'h-11 w-full rounded-md border border-border bg-background pl-10 text-base outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/45 focus:ring-2 focus:ring-primary/15 sm:h-10 sm:text-sm',
          '[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none',
          showClear && search ? 'pr-11' : 'pr-3'
        )}
      />
      {showClear && search && (
        <button
          type="button"
          onClick={() => onSearchChange('')}
          aria-label="Limpar busca"
          className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )

  return (
    // Camada de material flutuante: o conteúdo rola POR BAIXO dela em vez de
    // ser cortado por uma faixa opaca. O desfoque e a sombra são mais fortes
    // que os dos chips porque a superfície é maior — material maior lê como
    // material mais grosso.
    <div className="material-chrome sticky top-14 z-20 mb-4 rounded-xl p-2.5 sm:top-16 sm:p-3">
      {/* Uma linha só, que reflui. No mobile a busca é um botão que expande no
          lugar dos chips — a barra fica grudada no topo o tempo todo, e uma
          segunda linha permanente comeria uma faixa preciosa de tela pequena.
          No desktop o campo já vem aberto ao lado da régua.
          A régua de chips é renderizada UMA vez: duas cópias (uma por
          breakpoint) duplicariam os `id` e o `role="tablist"`. */}
      {searchOpen ? (
        <div className="flex items-center gap-2">
          {/* Um X só: limpa e fecha. Dois botões colados confundiam. */}
          {renderSearchInput(false, true)}
          <button
            type="button"
            onClick={() => { onSearchChange(''); setSearchOpen(false) }}
            aria-label="Limpar e fechar busca"
            className="press-scale inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 lg:gap-3">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Buscar materiais"
            className={cn(
              'press-scale relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition-colors lg:hidden',
              search ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'
            )}
            style={{ touchAction: 'manipulation' }}
          >
            <Search className="h-4 w-4" />
            {search && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />}
          </button>
          {/* O min-width impede que a régua de chips esprema o campo até virar
              um cotoco — quando falta espaço, quem rola é a régua. */}
          <div className="hidden min-w-[240px] max-w-sm flex-1 lg:flex">{renderSearchInput(true)}</div>
          <div className="min-w-0 flex-1">{tabs}</div>
          {showSort && <div className="hidden lg:block"><SortMenu value={sort} onChange={onSortChange} /></div>}
        </div>
      )}

      {/* Filtros de preço + ordenação no mobile. Só aparece nas seções onde o
          filtro realmente muda o resultado. */}
      {(showPriceFilters || showSort) && !searchOpen && (
        <div className="mt-2 flex items-center gap-1.5 border-t border-border/60 pt-2">
          {showPriceFilters && (
            <div className="scrollbar-hide flex min-w-0 flex-1 gap-1.5 overflow-x-auto overscroll-x-contain">
              <span className="hidden shrink-0 items-center gap-1 self-center pr-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:inline-flex">
                <Tag className="h-3 w-3" /> Preço
              </span>
              {PRICE_FILTERS.map(f => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={priceFilter === f.id}
                  onClick={() => onPriceFilterChange(f.id)}
                  className={cn(
                    'press-scale inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-3 text-xs font-semibold transition-colors',
                    priceFilter === f.id
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  )}
                  style={{ touchAction: 'manipulation' }}
                >
                  {f.id === 'free' && <Gift className="h-3.5 w-3.5" />}
                  {f.label}
                </button>
              ))}
            </div>
          )}
          {showSort && (
            <div className="ml-auto shrink-0 lg:hidden">
              <SortMenu value={sort} onChange={onSortChange} compact />
            </div>
          )}
        </div>
      )}

      {/* Filtros ativos: sempre visíveis e removíveis um a um. */}
      {hasActiveFilters && !searchOpen && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ativos</span>
          {search.trim() && (
            <ActiveFilterChip label={`"${search.trim()}"`} onRemove={() => onSearchChange('')} />
          )}
          {priceFilter !== 'all' && (
            <ActiveFilterChip
              label={priceFilter === 'free' ? 'Gratuitos' : 'Pagos'}
              onRemove={() => onPriceFilterChange('all')}
            />
          )}
          <button
            type="button"
            onClick={() => { onSearchChange(''); onPriceFilterChange('all') }}
            className="ml-1 text-xs font-semibold text-primary hover:underline"
          >
            Limpar tudo
          </button>
        </div>
      )}
    </div>
  )
}

function SectionChip({
  id,
  active,
  count,
  icon,
  onClick,
  children,
}: {
  id: MateriaisTab
  active: boolean
  count?: number
  icon: React.ReactNode
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      id={`materiais-tab-${id}`}
      aria-controls={MATERIAIS_PANEL_ID}
      aria-selected={active}
      data-active={active ? 'true' : undefined}
      onClick={onClick}
      className={cn(
        // h-10 no toque (alvo confortável), h-9 no ponteiro.
        'press-scale inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-3 text-xs font-semibold transition-colors sm:h-9',
        active
          ? 'cta-raised border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
      )}
      style={{ touchAction: 'manipulation' }}
    >
      {icon}
      {children}
      {typeof count === 'number' && count > 0 && (
        <span
          className={cn(
            'min-w-[1.5rem] rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold tabular-nums',
            active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}

function ActiveFilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 py-0.5 pl-2.5 pr-1 text-xs font-semibold text-primary">
      <span className="max-w-[10rem] truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remover filtro ${label}`}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full transition hover:bg-primary/20"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}

/**
 * `<select>` nativo de propósito: o picker do sistema é melhor no celular que
 * qualquer menu custom, a acessibilidade vem pronta e não custa nada no bundle
 * — a versão com Radix DropdownMenu somava ~30 kB ao first-load da rota.
 */
function SortMenu({
  value,
  onChange,
  compact = false,
}: {
  value: SortKey
  onChange: (sort: SortKey) => void
  compact?: boolean
}) {
  return (
    <div className="relative inline-flex shrink-0 items-center">
      <ArrowDownWideNarrow className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      <select
        value={value}
        onChange={e => onChange(e.target.value as SortKey)}
        aria-label="Ordenar resultados"
        className={cn(
          'h-9 cursor-pointer appearance-none rounded-md border border-border bg-card pl-8 pr-3 text-xs font-semibold text-muted-foreground outline-none transition-colors hover:border-primary/30 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40',
          compact && 'w-[7.5rem]'
        )}
        style={{ touchAction: 'manipulation' }}
      >
        {(Object.keys(SORT_LABELS) as SortKey[]).map(key => (
          <option key={key} value={key}>{SORT_LABELS[key]}</option>
        ))}
      </select>
    </div>
  )
}
