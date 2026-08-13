'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import {
  ATLAS_CATALOG,
  ATLAS_SYSTEMS,
  ATLAS_TOTALS,
  flattenCollections,
  type AtlasCollection,
  type AtlasMarker,
  type AtlasPiece,
  type AtlasSystem,
} from '@/lib/atlas-anatomia/catalogo'
import { getMarkerInsight } from '@/lib/atlas-anatomia/insights'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  GraduationCap,
  Info,
  MapPin,
  Search,
  Stethoscope,
  Target,
  X,
} from 'lucide-react'

function firstLeaf(system: AtlasSystem) {
  return flattenCollections(system.collections).find(collection => (collection.pieces?.length || 0) > 0)
}

function SystemCard({ system, onSelect }: { system: AtlasSystem; onSelect: () => void }) {
  const leaves = flattenCollections(system.collections).filter(collection => collection.pieces?.length)
  const pieces = leaves.reduce((sum, collection) => sum + (collection.pieces?.length || 0), 0)

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Image
          src={system.cover}
          alt={`Capa do sistema ${system.title}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <span className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-black/35 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
          {pieces} prancha{pieces !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 p-4">
        <div>
          <h3 className="font-heading text-lg font-semibold tracking-tight">{system.title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {leaves.length} {leaves.length === 1 ? 'coleção' : 'coleções'}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
      </div>
    </button>
  )
}

function MarkerButton({
  marker,
  index,
  active,
  onClick,
}: {
  marker: AtlasMarker
  index: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${index + 1}. ${marker.title}`}
      aria-pressed={active}
      style={{ left: `${marker.x * 100}%`, top: `${marker.y * 100}%` }}
      className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white font-black text-white shadow-[0_4px_14px_rgba(0,0,0,0.45)] transition focus:outline-none focus:ring-4 focus:ring-primary/30 ${
        active
          ? 'h-9 w-9 scale-110 bg-amber-500 text-xs'
          : 'h-7 w-7 bg-blue-600 text-[10px] hover:scale-110 hover:bg-blue-500 sm:h-8 sm:w-8 sm:text-xs'
      }`}
    >
      {index + 1}
    </button>
  )
}

function MarkerDetails({ marker, systemSlug }: { marker: AtlasMarker | null; systemSlug: string }) {
  if (!marker) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center">
        <div className="rounded-full bg-blue-600/10 p-3 text-blue-600">
          <Target className="h-6 w-6" />
        </div>
        <h3 className="mt-4 font-semibold">Selecione um marcador</h3>
        <p className="mt-1 max-w-xs text-sm leading-relaxed text-muted-foreground">
          Toque em um número azul na prancha para identificar e aprofundar a estrutura.
        </p>
      </div>
    )
  }

  const insight = getMarkerInsight(marker, systemSlug)
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <header className="border-b border-border bg-primary/[0.06] p-5">
        <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary">Estrutura selecionada</p>
        <h2 className="font-heading text-2xl font-semibold leading-tight tracking-tight">{marker.title}</h2>
      </header>
      <div className="space-y-5 p-5">
        <div>
          <div className="mb-1.5 flex items-center gap-2 text-sm font-bold">
            <MapPin className="h-4 w-4 text-primary" /> Posicionamento anatômico
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{insight.location}</p>
        </div>
        <div>
          <div className="mb-1.5 flex items-center gap-2 text-sm font-bold">
            <CircleDot className="h-4 w-4 text-primary" /> Função
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{insight.function}</p>
        </div>
        <div>
          <div className="mb-1.5 flex items-center gap-2 text-sm font-bold">
            <Stethoscope className="h-4 w-4 text-primary" /> Por que importa na clínica
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{insight.clinical}</p>
        </div>
        {insight.sourceNote && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.07] p-3.5">
            <div className="mb-1 flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
              <Info className="h-3.5 w-3.5" /> Nota do acervo
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{insight.sourceNote}</p>
          </div>
        )}
      </div>
    </article>
  )
}

function CollectionList({
  system,
  activeSlug,
  search,
  onSelect,
}: {
  system: AtlasSystem
  activeSlug: string
  search: string
  onSelect: (collection: AtlasCollection) => void
}) {
  const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR')
  const leaves = flattenCollections(system.collections).filter(collection => {
    if (!collection.pieces?.length) return false
    if (!normalizedSearch) return true
    const haystack = [
      ...collection.breadcrumb,
      ...(collection.pieces || []).flatMap(piece => [piece.title, ...piece.markers.map(marker => marker.title)]),
    ]
      .join(' ')
      .toLocaleLowerCase('pt-BR')
    return haystack.includes(normalizedSearch)
  })

  return (
    <div className="space-y-1">
      {leaves.map(collection => (
        <button
          key={collection.slug}
          type="button"
          onClick={() => onSelect(collection)}
          className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
            activeSlug === collection.slug
              ? 'border-primary/30 bg-primary/10 text-foreground'
              : 'border-transparent text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground'
          }`}
        >
          <span className="block text-sm font-semibold leading-tight">{collection.title}</span>
          <span className="mt-1 block truncate text-[10px] opacity-70">{collection.breadcrumb.slice(0, -1).join(' › ')}</span>
        </button>
      ))}
      {leaves.length === 0 && (
        <p className="px-3 py-8 text-center text-xs leading-relaxed text-muted-foreground">
          Nenhuma coleção ou estrutura encontrada para “{search}”.
        </p>
      )}
    </div>
  )
}

export default function AtlasAnatomiaPage() {
  const [systemSlug, setSystemSlug] = useState<string | null>(null)
  const [collectionSlug, setCollectionSlug] = useState('')
  const [pieceIndex, setPieceIndex] = useState(0)
  const [markerIndex, setMarkerIndex] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  const system = ATLAS_SYSTEMS.find(item => item.slug === systemSlug) || null
  const collections = useMemo(() => (system ? flattenCollections(system.collections) : []), [system])
  const collection = collections.find(item => item.slug === collectionSlug) || null
  const pieces = collection?.pieces || []
  const piece: AtlasPiece | null = pieces[pieceIndex] || null
  const marker = markerIndex === null ? null : piece?.markers[markerIndex] || null

  function selectSystem(nextSystem: AtlasSystem) {
    const initialCollection = firstLeaf(nextSystem)
    setSystemSlug(nextSystem.slug)
    setCollectionSlug(initialCollection?.slug || '')
    setPieceIndex(0)
    setMarkerIndex(null)
    setSearch('')
  }

  function selectCollection(nextCollection: AtlasCollection) {
    setCollectionSlug(nextCollection.slug)
    setPieceIndex(0)
    setMarkerIndex(null)
  }

  function selectPiece(index: number) {
    setPieceIndex(index)
    setMarkerIndex(null)
  }

  if (!system) {
    return (
      <AppShell allowGuest showHeader={false}>
        <main className="surface-page min-h-screen">
          <header className="border-b border-border bg-muted/30">
            <div className="mx-auto max-w-6xl px-4 pb-10 pt-8">
              <Link
                href="/manual-clinico/anatomia-3d"
                className="mb-7 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> Voltar ao Domine Anatomia
              </Link>
              <p className="editorial-mark mb-3">Atlas de Anatomia · acervo UFJF</p>
              <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">Escolha o sistema</h1>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
                Navegue por {ATLAS_TOTALS.pieces} pranchas e selecione os marcadores para estudar localização, função e
                correlação clínica de cada estrutura.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border border-border bg-card px-3 py-1.5">{ATLAS_SYSTEMS.length} sistemas</span>
                <span className="rounded-full border border-border bg-card px-3 py-1.5">{ATLAS_TOTALS.pieces} pranchas</span>
                <span className="rounded-full border border-border bg-card px-3 py-1.5">
                  {ATLAS_TOTALS.markers.toLocaleString('pt-BR')} marcadores
                </span>
              </div>
            </div>
          </header>

          <section className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
              {ATLAS_SYSTEMS.map(item => (
                <SystemCard key={item.slug} system={item} onSelect={() => selectSystem(item)} />
              ))}
            </div>
            <p className="mt-8 text-center text-xs text-muted-foreground">
              Acervo: {ATLAS_CATALOG.source.name}. Uso integral autorizado ao Domine Aqui em 12/08/2026.
            </p>
          </section>
        </main>
      </AppShell>
    )
  }

  return (
    <AppShell allowGuest showHeader={false}>
      <main className="surface-page min-h-screen">
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-4 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setSystemSlug(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:text-foreground"
                aria-label="Escolher outro sistema"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">Atlas de Anatomia</p>
                <h1 className="truncate font-heading text-xl font-semibold">{system.title}</h1>
              </div>
            </div>
            <Link
              href="/manual-clinico/anatomia-3d"
              className="hidden text-xs font-semibold text-muted-foreground transition hover:text-foreground sm:inline"
            >
              Domine Anatomia
            </Link>
          </div>
        </header>

        <div className="mx-auto grid max-w-[1500px] gap-5 px-4 py-5 xl:grid-cols-[260px_minmax(0,1fr)_360px]">
          <aside className="rounded-2xl border border-border bg-card p-3 xl:sticky xl:top-5 xl:h-[calc(100vh-2.5rem)] xl:overflow-y-auto">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Buscar estrutura..."
                aria-label="Buscar coleção ou estrutura"
                className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-9 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
                  aria-label="Limpar busca"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <CollectionList
              system={system}
              activeSlug={collectionSlug}
              search={search}
              onSelect={selectCollection}
            />
          </aside>

          <section className="min-w-0">
            {collection && piece ? (
              <>
                <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      {collection.breadcrumb.slice(0, -1).join(' · ') || system.title}
                    </p>
                    <h2 className="font-heading text-2xl font-semibold tracking-tight">{collection.title}</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">{piece.title}</p>
                  </div>
                  <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                    Prancha {pieceIndex + 1} de {pieces.length}
                  </span>
                </div>

                <div className="overflow-hidden rounded-2xl border border-border bg-[#101418] shadow-sm">
                  <div className="relative mx-auto aspect-square w-full max-w-[850px]">
                    <Image
                      key={piece.image}
                      src={piece.image}
                      alt={`${collection.title}: ${piece.title}`}
                      fill
                      priority
                      sizes="(max-width: 1280px) 100vw, 850px"
                      className="object-contain"
                    />
                    {piece.markers.map((item, index) => (
                      <MarkerButton
                        key={`${piece.id}-${index}-${item.title}`}
                        marker={item}
                        index={index}
                        active={markerIndex === index}
                        onClick={() => setMarkerIndex(markerIndex === index ? null : index)}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => selectPiece(Math.max(0, pieceIndex - 1))}
                    disabled={pieceIndex === 0}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" /> Anterior
                  </button>
                  <select
                    value={pieceIndex}
                    onChange={event => selectPiece(Number(event.target.value))}
                    aria-label="Selecionar prancha"
                    className="min-w-0 max-w-xs rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold outline-none focus:border-primary/50"
                  >
                    {pieces.map((item, index) => (
                      <option key={item.id} value={index}>
                        {index + 1}. {item.title}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => selectPiece(Math.min(pieces.length - 1, pieceIndex + 1))}
                    disabled={pieceIndex === pieces.length - 1}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Próxima <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-5 xl:hidden">
                  <MarkerDetails marker={marker} systemSlug={system.slug} />
                </div>
              </>
            ) : (
              <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                Escolha uma coleção para abrir as pranchas.
              </div>
            )}
          </section>

          <aside className="hidden xl:block xl:sticky xl:top-5 xl:h-fit">
            <MarkerDetails marker={marker} systemSlug={system.slug} />
            <div className="mt-3 rounded-xl border border-border bg-card p-3 text-[10px] leading-relaxed text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-bold text-foreground">
                <GraduationCap className="h-3.5 w-3.5 text-primary" /> Uso educacional
              </span>{' '}
              · Aprofundamentos do GradeX complementam os marcadores do acervo UFJF e não substituem avaliação clínica.
            </div>
          </aside>
        </div>
      </main>
    </AppShell>
  )
}
