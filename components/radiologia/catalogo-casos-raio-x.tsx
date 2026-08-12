'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Search, Sparkles, X } from 'lucide-react'
import { MiniaturaCasoRaioX } from '@/components/radiologia/caso-raio-x-imagem'
import type { CasoRaioX, CategoriaCasoRaioX, GuiaCategoriaCasoRaioX } from '@/lib/radiologia/casos-raio-x'

const normalizar = (texto: string) => texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export function CatalogoCasosRaioX({ casos, categorias }: { casos: CasoRaioX[]; categorias: GuiaCategoriaCasoRaioX[] }) {
  const [categoria, setCategoria] = useState<CategoriaCasoRaioX | null>(null)
  const [busca, setBusca] = useState('')
  const termo = normalizar(busca.trim())
  const visiveis = useMemo(() => casos.filter((caso) => {
    if (categoria && caso.categoria !== categoria) return false
    if (!termo) return true
    return normalizar([caso.titulo, caso.resumo, caso.explicacao, caso.categoriaTitulo, ...caso.sinais, ...caso.armadilhas].join(' ')).includes(termo)
  }), [casos, categoria, termo])

  return (
    <div className="rx surface-page min-h-screen">
      <header className="rx-painel rx-grade rx-varredura relative overflow-hidden border-b border-sky-400/15 text-white">
        <div className="container mx-auto max-w-6xl px-4 pb-7 pt-6 sm:pb-9">
          <Link href="/manual-clinico/radiologia/raio-x" className="-m-2 inline-flex items-center gap-1.5 rounded-lg p-2 text-sm text-sky-100/60 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Atlas de Raio-X
          </Link>
          <div className="mt-6 grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <p className="editorial-mark !text-sky-300/80 [&::before]:bg-sky-300/60">Raio-X de tórax · prática guiada</p>
              <h1 className="mt-2 max-w-3xl font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Casos e alterações</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-sky-100/65 sm:text-base">
                Aprenda a reconhecer a alteração antes de revelar a marcação. Cada tema reúne imagens limpas e anotadas, raciocínio radiográfico, sinais-chave e armadilhas que mudam a interpretação.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-bold text-sky-100/70">
                <Selo>{casos.length} temas</Selo>
                <Selo>{casos.reduce((n, caso) => n + caso.imagens.length, 0)} exemplos selecionados</Selo>
                <Selo>{categorias.length} capítulos</Selo>
              </div>
            </div>
            <div>
              <label htmlFor="busca-casos-rx" className="sr-only">Buscar caso, sinal ou diagnóstico</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-300/70" />
                <input id="busca-casos-rx" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Kerley, pneumotórax, massa hilar…" className="h-12 w-full rounded-xl border border-sky-400/25 bg-sky-950/40 pl-11 pr-11 text-sm text-white outline-none placeholder:text-sky-200/35 focus:border-sky-400/70 focus:ring-4 focus:ring-sky-400/10" />
                {busca && <button type="button" onClick={() => setBusca('')} aria-label="Limpar busca" className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-sky-100/60 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>}
              </div>
              <p className="mt-2 text-[11px] text-sky-200/45">Busque pelo diagnóstico, sinal radiográfico ou estrutura.</p>
            </div>
          </div>
        </div>
      </header>

      <nav aria-label="Capítulos de casos" className="sticky top-0 z-20 border-b border-border bg-background/95 shadow-sm backdrop-blur">
        <div className="rx-rolagem container mx-auto flex max-w-6xl gap-1.5 overflow-x-auto px-4 py-2.5">
          <Filtro ativo={!categoria} onClick={() => setCategoria(null)}>Todos <span>{casos.length}</span></Filtro>
          {categorias.map((item) => <Filtro key={item.id} ativo={categoria === item.id} onClick={() => setCategoria(item.id)}>{item.titulo} <span>{casos.filter((c) => c.categoria === item.id).length}</span></Filtro>)}
        </div>
      </nav>

      <main className="container mx-auto max-w-6xl px-4 py-8 sm:py-10">
        {!termo && categoria && <GuiaCategoria guia={categorias.find((item) => item.id === categoria)!} />}
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="editorial-mark">{termo ? 'Resultado da busca' : categoria ? 'Temas do capítulo' : 'Acervo completo'}</p>
            <h2 className="mt-1.5 font-heading text-xl font-semibold tracking-tight sm:text-2xl">{visiveis.length} tema{visiveis.length === 1 ? '' : 's'} para estudar</h2>
          </div>
          <p className="hidden max-w-sm text-right text-xs leading-relaxed text-muted-foreground sm:block">Abra sem marcações, descreva em voz alta e só então revele os achados.</p>
        </div>

        {visiveis.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visiveis.map((caso, indice) => <CardCaso key={caso.slug} caso={caso} indice={indice} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <Search className="mx-auto h-8 w-8 text-muted-foreground/30" />
            <p className="mt-3 text-sm text-muted-foreground">Nenhum caso corresponde à busca.</p>
            <button type="button" onClick={() => { setBusca(''); setCategoria(null) }} className="mt-4 rounded-full border border-border px-4 py-2 text-xs font-bold hover:border-sky-500/50">Limpar filtros</button>
          </div>
        )}
      </main>
    </div>
  )
}

function GuiaCategoria({ guia }: { guia: GuiaCategoriaCasoRaioX }) {
  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-sky-500/20 bg-sky-500/[0.04]">
      <div className="grid gap-5 p-5 lg:grid-cols-[0.8fr_1.2fr] lg:p-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-sky-600 dark:text-sky-400">Pergunta de abertura</p>
          <h2 className="mt-2 font-heading text-xl font-semibold leading-snug">{guia.pergunta}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{guia.resumo}</p>
        </div>
        <ol className="grid gap-2 sm:grid-cols-2">
          {guia.roteiro.map((passo, i) => <li key={passo} className="flex gap-2.5 rounded-xl border border-border bg-card p-3 text-xs leading-relaxed text-muted-foreground"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500 font-clinical text-[10px] font-black text-white">{i + 1}</span>{passo}</li>)}
        </ol>
      </div>
    </section>
  )
}

function CardCaso({ caso, indice }: { caso: CasoRaioX; indice: number }) {
  return (
    <Link href={`/manual-clinico/radiologia/raio-x/casos/${caso.slug}`} style={{ ['--rx-i' as string]: Math.min(indice, 12) }} className="rx-entra group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/10">
      <div className="relative aspect-[4/3] overflow-hidden bg-black">
        <MiniaturaCasoRaioX imagem={caso.imagens[0]} className="absolute inset-0 h-full w-full bg-contain transition duration-700 group-hover:scale-[1.035]" />
        <span className="absolute left-3 top-3 rounded-full border border-sky-300/25 bg-black/70 px-2.5 py-1 font-clinical text-[9px] font-bold uppercase tracking-widest text-sky-200 backdrop-blur">{caso.categoriaTitulo}</span>
        <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-2 py-1 font-clinical text-[9px] font-bold text-white/65 backdrop-blur">{caso.imagens.length} {caso.imagens.length === 1 ? 'imagem' : 'imagens'}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-heading text-base font-semibold leading-tight group-hover:text-sky-600 dark:group-hover:text-sky-400">{caso.titulo}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-muted-foreground">{caso.resumo}</p>
        <span className="mt-4 inline-flex items-center justify-between border-t border-border pt-3 text-xs font-bold text-sky-600 dark:text-sky-400">Estudar caso <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span>
      </div>
    </Link>
  )
}

function Selo({ children }: { children: React.ReactNode }) { return <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-400/[0.07] px-3 py-1.5"><Sparkles className="h-3 w-3 text-sky-300" />{children}</span> }

function Filtro({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} aria-pressed={ativo} className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold transition ${ativo ? 'border-sky-500/60 bg-sky-500/10 text-sky-700 dark:text-sky-300' : 'border-border bg-card text-muted-foreground hover:border-sky-500/40 hover:text-foreground'} [&_span]:ml-1.5 [&_span]:font-clinical [&_span]:text-[10px] [&_span]:opacity-60`}>{children}</button>
}
