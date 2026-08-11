'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ArrowDownWideNarrow,
  Compass,
  FileText,
  Gift,
  Library,
  Package,
  Search,
  ShoppingBag,
  Sparkles,
  Tag,
  Video,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type MateriaisTab = 'materials' | 'packages' | 'loja' | 'mine'

/**
 * Nível 1 da navegação: o que já é meu × o que posso adquirir.
 *
 * A régua antiga tinha as quatro seções no mesmo nível e rolava na horizontal —
 * no celular "Meus materiais" era a última e ficava fora da tela, então o aluno
 * só encontrava a própria biblioteca por acidente (arrastando a régua).
 */
export type MateriaisScope = 'mine' | 'browse'

/** Seções que vivem dentro de "Explorar". */
export const BROWSE_TABS: MateriaisTab[] = ['materials', 'packages', 'loja']

export function scopeOfTab(tab: MateriaisTab): MateriaisScope {
  return tab === 'mine' ? 'mine' : 'browse'
}

/** Id do painel controlado pelos chips de seção (`aria-controls`). */
export const MATERIAIS_PANEL_ID = 'materiais-panel'
export type PriceFilter = 'all' | 'free' | 'paid'
export type SortKey = 'relevance' | 'recent' | 'downloads' | 'price-asc'

/** Filtro por formato dentro de "Meus materiais". */
export type OwnedTypeFilter = 'all' | 'pdf' | 'flashcard' | 'video'

export const OWNED_TYPE_FILTERS: { id: OwnedTypeFilter; label: string; icon?: React.ReactNode }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'pdf', label: 'PDFs', icon: <FileText className="h-3.5 w-3.5" /> },
  { id: 'flashcard', label: 'Flashcards', icon: <Sparkles className="h-3.5 w-3.5" /> },
  { id: 'video', label: 'Vídeos', icon: <Video className="h-3.5 w-3.5" /> },
]

export const SORT_LABELS: Record<SortKey, string> = {
  relevance: 'Relevância',
  recent: 'Mais recentes',
  downloads: 'Mais baixados',
  'price-asc': 'Menor preço',
}

const BROWSE_TAB_META: Record<Exclude<MateriaisTab, 'mine'>, { label: string; icon: React.ReactNode }> = {
  materials: { label: 'Materiais', icon: <FileText className="h-3.5 w-3.5" /> },
  packages: { label: 'Pacotes', icon: <Package className="h-3.5 w-3.5" /> },
  loja: { label: 'Loja', icon: <ShoppingBag className="h-3.5 w-3.5" /> },
}

const PRICE_FILTERS: { id: PriceFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'free', label: 'Gratuitos' },
  { id: 'paid', label: 'Pagos' },
]

/**
 * Barra de navegação de /materiais — busca, seções, filtro de preço e
 * ordenação, colada logo abaixo do cabeçalho do AppShell (`h-14 sm:h-16`).
 *
 * A navegação tem dois níveis:
 *  1. "Meus materiais" × "Explorar" — sempre inteiro na tela, sem rolagem
 *     horizontal, porque é a decisão que o aluno toma primeiro (ver o que já
 *     tenho ou procurar o que posso comprar).
 *  2. Dentro de "Explorar": Materiais, Pacotes e Loja. Dentro de "Meus
 *     materiais": filtro por formato.
 */
export function MateriaisToolbar({
  search,
  onSearchChange,
  activeTab,
  onTabChange,
  onScopeChange,
  priceFilter,
  onPriceFilterChange,
  ownedType,
  onOwnedTypeChange,
  ownedTypeCounts,
  sort,
  onSortChange,
  counts,
}: {
  search: string
  onSearchChange: (value: string) => void
  activeTab: MateriaisTab
  onTabChange: (tab: MateriaisTab) => void
  onScopeChange: (scope: MateriaisScope) => void
  priceFilter: PriceFilter
  onPriceFilterChange: (filter: PriceFilter) => void
  ownedType: OwnedTypeFilter
  onOwnedTypeChange: (filter: OwnedTypeFilter) => void
  ownedTypeCounts: Partial<Record<OwnedTypeFilter, number>>
  sort: SortKey
  onSortChange: (sort: SortKey) => void
  counts: Partial<Record<MateriaisTab, number>>
}) {
  const [searchOpen, setSearchOpen] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)
  const scope = scopeOfTab(activeTab)

  // Mantém a seção ativa visível na régua de nível 2. Sem isso, abrir
  // /materiais já numa seção (link direto, voltar do navegador) deixava o chip
  // ativo fora da tela.
  useEffect(() => {
    const active = rowRef.current?.querySelector<HTMLElement>('[data-active="true"]')
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [activeTab])

  // O filtro de preço só afeta a consulta de materiais e pacotes — deixá-lo
  // visível na Loja e em "Meus materiais" sugeria um efeito que não existe.
  const showPriceFilters = activeTab === 'materials' || activeTab === 'packages'
  const showSort = showPriceFilters || activeTab === 'mine'
  const hasActiveFilters = priceFilter !== 'all' || !!search.trim() || (scope === 'mine' && ownedType !== 'all')

  // Só oferece o filtro de formato quando ele separa alguma coisa: com um
  // formato só (ou nenhum material), os chips seriam decoração.
  const ownedTypeOptions = OWNED_TYPE_FILTERS.filter(
    f => f.id === 'all' || (ownedTypeCounts[f.id] || 0) > 0
  )
  const showOwnedTypes = scope === 'mine' && ownedTypeOptions.length > 2

  const browseTabs = (
    <div
      ref={rowRef}
      role="tablist"
      aria-label="Seções do catálogo"
      className="scrollbar-hide fade-scroll-x flex min-w-0 flex-1 gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 -mb-0.5 pr-5 lg:pr-0"
    >
      {BROWSE_TABS.map(id => {
        const meta = BROWSE_TAB_META[id as Exclude<MateriaisTab, 'mine'>]
        return (
          <SectionChip
            key={id}
            id={id}
            active={activeTab === id}
            count={counts[id]}
            icon={meta.icon}
            onClick={() => onTabChange(id)}
          >
            {meta.label}
          </SectionChip>
        )
      })}
    </div>
  )

  const ownedTypeChips = (
    <div className="scrollbar-hide fade-scroll-x flex min-w-0 flex-1 gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 -mb-0.5">
      {ownedTypeOptions.map(f => (
        <button
          key={f.id}
          type="button"
          aria-pressed={ownedType === f.id}
          onClick={() => onOwnedTypeChange(f.id)}
          className={cn(
            'press-scale inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-3 text-xs font-semibold transition-colors sm:h-9',
            ownedType === f.id
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
          )}
          style={{ touchAction: 'manipulation' }}
        >
          {f.icon}
          {f.label}
          {typeof ownedTypeCounts[f.id] === 'number' && (ownedTypeCounts[f.id] as number) > 0 && (
            <span className="text-[10px] font-bold tabular-nums opacity-70">{ownedTypeCounts[f.id]}</span>
          )}
        </button>
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
        placeholder={scope === 'mine' ? 'Buscar nos meus materiais...' : 'Buscar materiais...'}
        aria-label={scope === 'mine' ? 'Buscar nos meus materiais' : 'Buscar materiais'}
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

  const searchButton = (
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
  )

  // Segunda linha: seções do catálogo ou formatos da biblioteca. Quando não há
  // nada além do botão de busca (que só existe no mobile), a linha inteira some
  // no desktop em vez de virar uma faixa vazia.
  const secondary = scope === 'browse' ? browseTabs : showOwnedTypes ? ownedTypeChips : null

  return (
    // Camada de material flutuante: o conteúdo rola POR BAIXO dela em vez de
    // ser cortado por uma faixa opaca. O desfoque e a sombra são mais fortes
    // que os dos chips porque a superfície é maior — material maior lê como
    // material mais grosso.
    <div className="material-chrome sticky top-14 z-20 mb-4 rounded-xl p-2.5 sm:top-16 sm:p-3">
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
        <>
          {/* ── Nível 1 ── ocupa a largura toda no celular: as duas metades
              cabem sempre, então nunca há um destino escondido fora da tela. */}
          <div className="flex items-center gap-2 lg:gap-3">
            <ScopeSwitch
              scope={scope}
              ownedCount={counts.mine}
              onSelect={onScopeChange}
            />
            {/* O min-width impede que o resto da barra esprema o campo até
                virar um cotoco. */}
            <div className="hidden min-w-[220px] max-w-sm flex-1 lg:flex">{renderSearchInput(true)}</div>
            {showSort && <div className="hidden lg:block"><SortMenu value={sort} onChange={onSortChange} /></div>}
          </div>

          {/* ── Nível 2 ── */}
          <div
            className={cn(
              'mt-2 flex items-center gap-2 border-t border-border/60 pt-2',
              !secondary && 'lg:hidden'
            )}
          >
            {searchButton}
            {secondary}
            {/* Sem terceira linha (Loja e Meus materiais não têm filtro de
                preço), a ordenação vem para cá no mobile. */}
            {showSort && !showPriceFilters && (
              <div className="ml-auto shrink-0 lg:hidden">
                <SortMenu value={sort} onChange={onSortChange} compact />
              </div>
            )}
          </div>
        </>
      )}

      {/* Filtros de preço + ordenação no mobile. Só aparece nas seções onde o
          filtro realmente muda o resultado. */}
      {showPriceFilters && !searchOpen && (
        <div className="mt-2 flex items-center gap-1.5 border-t border-border/60 pt-2">
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
          {scope === 'mine' && ownedType !== 'all' && (
            <ActiveFilterChip
              label={OWNED_TYPE_FILTERS.find(f => f.id === ownedType)?.label || ''}
              onRemove={() => onOwnedTypeChange('all')}
            />
          )}
          <button
            type="button"
            onClick={() => { onSearchChange(''); onPriceFilterChange('all'); onOwnedTypeChange('all') }}
            className="ml-1 text-xs font-semibold text-primary hover:underline"
          >
            Limpar tudo
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Chave de nível 1. Duas metades de largura igual — a de "Meus materiais" vem
 * primeiro porque é o destino que o aluno já pagou para ter.
 */
function ScopeSwitch({
  scope,
  ownedCount,
  onSelect,
}: {
  scope: MateriaisScope
  ownedCount?: number
  onSelect: (scope: MateriaisScope) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Meus materiais ou catálogo"
      // No celular ocupa a linha inteira (duas metades iguais, nada fora da
      // tela); no desktop encolhe para o tamanho do conteúdo e divide a barra
      // com a busca.
      className="grid min-w-0 flex-1 grid-cols-2 gap-1 rounded-lg border border-border bg-muted/40 p-1 lg:flex-none"
    >
      <ScopeButton
        id="mine"
        active={scope === 'mine'}
        icon={<Library className="h-4 w-4 shrink-0" />}
        count={ownedCount}
        onClick={() => onSelect('mine')}
      >
        Meus materiais
      </ScopeButton>
      <ScopeButton
        id="browse"
        active={scope === 'browse'}
        icon={<Compass className="h-4 w-4 shrink-0" />}
        onClick={() => onSelect('browse')}
      >
        Explorar
      </ScopeButton>
    </div>
  )
}

function ScopeButton({
  id,
  active,
  icon,
  count,
  onClick,
  children,
}: {
  id: 'mine' | 'browse'
  active: boolean
  icon: React.ReactNode
  count?: number
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      // `mine` reaproveita o id de aba para o painel continuar apontando para
      // um rótulo que existe — no nível 2 não há chip "Meus materiais".
      id={id === 'mine' ? 'materiais-tab-mine' : 'materiais-scope-browse'}
      aria-controls={MATERIAIS_PANEL_ID}
      aria-selected={active}
      className={cn(
        'press-scale inline-flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-md px-2.5 text-[13px] font-semibold transition-colors sm:h-10 sm:text-sm lg:px-4',
        active
          ? 'cta-raised bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-card hover:text-foreground'
      )}
      style={{ touchAction: 'manipulation' }}
      onClick={onClick}
    >
      {/* Em telas estreitas o ícone sai: "Meus materiais 62" inteiro vale mais
          que a ilustração — com ele, o rótulo truncava em 360px. */}
      <span className="hidden shrink-0 sm:inline-flex">{icon}</span>
      <span className="truncate">{children}</span>
      {typeof count === 'number' && count > 0 && (
        <span
          className={cn(
            'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
            active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}
        >
          {count}
        </span>
      )}
    </button>
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
          ? 'border-primary bg-primary/10 text-primary'
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
            active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
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
