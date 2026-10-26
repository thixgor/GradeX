'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ArrowDownWideNarrow,
  ChevronDown,
  FileText,
  Gift,
  Package,
  Search,
  ShoppingBag,
  Sparkles,
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
      className="scrollbar-hide fade-scroll-x flex min-w-0 flex-1 gap-1.5 overflow-x-auto overscroll-x-contain pr-5 lg:pr-0"
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
    <div className="scrollbar-hide fade-scroll-x flex min-w-0 flex-1 gap-1.5 overflow-x-auto overscroll-x-contain">
      {ownedTypeOptions.map(f => (
        <button
          key={f.id}
          type="button"
          aria-pressed={ownedType === f.id}
          onClick={() => onOwnedTypeChange(f.id)}
          className="ios-pilula"
          style={{ touchAction: 'manipulation' }}
        >
          {f.icon}
          {f.label}
          {typeof ownedTypeCounts[f.id] === 'number' && (ownedTypeCounts[f.id] as number) > 0 && (
            <span className="ios-contagem">{ownedTypeCounts[f.id]}</span>
          )}
        </button>
      ))}
    </div>
  )

  const renderSearchInput = (showClear: boolean, autoFocus = false) => (
    <div className="relative flex-1">
      <Search className="ios-rotulo-2 pointer-events-none absolute left-3 top-1/2 h-[17px] w-[17px] -translate-y-1/2" aria-hidden />
      <input
        type="search"
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        enterKeyHint="search"
        autoFocus={autoFocus}
        placeholder={scope === 'mine' ? 'Buscar nos meus materiais' : 'Buscar materiais'}
        aria-label={scope === 'mine' ? 'Buscar nos meus materiais' : 'Buscar materiais'}
        // `type=search` dá o teclado certo no celular; o "x" próprio do WebKit
        // sai no CSS (ficava colado no nosso). 16px reais no mobile: abaixo
        // disso o iOS dá zoom sozinho ao focar o campo.
        className={cn('ios-busca', showClear && search ? 'pr-10' : 'pr-3')}
      />
      {showClear && search && (
        <button
          type="button"
          onClick={() => onSearchChange('')}
          aria-label="Limpar busca"
          className="absolute right-1.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full"
        >
          <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[var(--ios-rotulo-3)] text-[var(--ios-chao)]">
            <X className="h-3 w-3" strokeWidth={3} />
          </span>
        </button>
      )}
    </div>
  )

  const searchButton = (
    <button
      type="button"
      onClick={() => setSearchOpen(true)}
      aria-label="Buscar materiais"
      className={cn('ios-icone-botao relative h-9 w-9 lg:hidden', search && 'bg-[var(--ios-tinta-suave)]')}
      style={{ touchAction: 'manipulation' }}
    >
      <Search className="h-[17px] w-[17px]" />
      {search && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--ios-tinta)] ring-2 ring-[var(--ios-chao)]" />}
    </button>
  )

  // Segunda linha: seções do catálogo ou formatos da biblioteca. Quando não há
  // nada além do botão de busca (que só existe no mobile), a linha inteira some
  // no desktop em vez de virar uma faixa vazia.
  const secondary = scope === 'browse' ? browseTabs : showOwnedTypes ? ownedTypeChips : null

  return (
    // Vidro flutuante: o conteúdo rola POR BAIXO dele em vez de ser cortado
    // por uma faixa opaca.
    <div className="ios-vidro sticky top-[3.75rem] z-20 mb-6 rounded-[22px] p-2 sm:top-[4.5rem] sm:p-2.5">
      {searchOpen ? (
        <div className="flex items-center gap-2">
          {renderSearchInput(true, true)}
          {/* "Cancelar" em texto, como a busca do sistema: limpa e fecha. */}
          <button
            type="button"
            onClick={() => { onSearchChange(''); setSearchOpen(false) }}
            className="ios-tinta h-10 shrink-0 px-2 text-[16px] font-medium"
          >
            Cancelar
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
            <div className="hidden min-w-[220px] max-w-md flex-1 lg:flex">{renderSearchInput(true)}</div>
            {showSort && <div className="ml-auto hidden lg:block"><SortMenu value={sort} onChange={onSortChange} /></div>}
          </div>

          {/* ── Nível 2 ── */}
          <div className={cn('mt-2 flex items-center gap-1.5', !secondary && 'lg:hidden')}>
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
        <div className="mt-2 flex items-center gap-1.5">
          <div
            role="group"
            aria-label="Filtrar por preço"
            className="scrollbar-hide flex min-w-0 flex-1 gap-1.5 overflow-x-auto overscroll-x-contain"
          >
            {PRICE_FILTERS.map(f => (
              <button
                key={f.id}
                type="button"
                aria-pressed={priceFilter === f.id}
                onClick={() => onPriceFilterChange(f.id)}
                className="ios-pilula !h-8 !px-3 !text-[13px]"
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
        <div className="mt-2 flex flex-wrap items-center gap-1.5 px-1">
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
            className="ios-tinta ml-1 text-[13px] font-semibold"
          >
            Limpar tudo
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Chave de nível 1: o controle segmentado do sistema, com o polegar
 * deslizando de uma metade para a outra. "Meus materiais" vem primeiro porque
 * é o destino que o aluno já pagou para ter.
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
      data-indice={scope === 'mine' ? 0 : 1}
      // No celular ocupa a linha inteira (duas metades iguais, nada fora da
      // tela); no desktop tem largura fixa e divide a barra com a busca.
      className="ios-segmentado min-w-0 flex-1 lg:w-[22rem] lg:flex-none"
    >
      <ScopeButton
        id="mine"
        active={scope === 'mine'}
        count={ownedCount}
        onClick={() => onSelect('mine')}
      >
        Meus materiais
      </ScopeButton>
      <ScopeButton
        id="browse"
        active={scope === 'browse'}
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
  count,
  onClick,
  children,
}: {
  id: 'mine' | 'browse'
  active: boolean
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
      className="ios-segmento"
      style={{ touchAction: 'manipulation' }}
      onClick={onClick}
    >
      <span className="truncate">{children}</span>
      {typeof count === 'number' && count > 0 && (
        <span className="ios-rotulo-3 shrink-0 text-[12px] font-semibold tabular-nums">{count}</span>
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
      className="ios-pilula"
      style={{ touchAction: 'manipulation' }}
    >
      {icon}
      {children}
      {typeof count === 'number' && count > 0 && <span className="ios-contagem">{count}</span>}
    </button>
  )
}

function ActiveFilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="ios-tinta inline-flex h-7 items-center gap-1 rounded-full bg-[var(--ios-tinta-suave)] pl-3 pr-1 text-[13px] font-semibold">
      <span className="max-w-[10rem] truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remover filtro ${label}`}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full transition hover:bg-[var(--ios-tinta-suave)]"
      >
        <X className="h-3 w-3" strokeWidth={2.75} />
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
      <ArrowDownWideNarrow className="ios-tinta pointer-events-none absolute left-3 h-3.5 w-3.5" aria-hidden />
      <select
        value={value}
        onChange={e => onChange(e.target.value as SortKey)}
        aria-label="Ordenar resultados"
        className={cn(
          'ios-tinta h-9 cursor-pointer appearance-none rounded-full bg-[var(--ios-preenchimento)] pl-8 pr-7 text-[13px] font-semibold outline-none transition-colors hover:bg-[var(--ios-preenchimento-forte)]',
          compact && 'w-[8.25rem] truncate'
        )}
        style={{ touchAction: 'manipulation' }}
      >
        {(Object.keys(SORT_LABELS) as SortKey[]).map(key => (
          <option key={key} value={key}>{SORT_LABELS[key]}</option>
        ))}
      </select>
      <ChevronDown className="ios-tinta pointer-events-none absolute right-2.5 h-3.5 w-3.5" aria-hidden />
    </div>
  )
}
