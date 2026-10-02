'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Crosshair, Eye, EyeOff, Layers3, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { CategoriaCasoTC, GuiaCategoriaTC } from '@/lib/radiologia/casos-tc'

export interface ResumoCasoTC {
  slug: string
  numero: number
  titulo: string
  categoria: CategoriaCasoTC
  queixa: string
  identificacao: string
  cortes: number
  apontamentos: number
  capa: string
}

/**
 * Índice dos casos de TC.
 *
 * Abre em modo prova: o cartão mostra o paciente e a queixa, não o
 * diagnóstico — o título de um caso é a resposta do quiz dele. Quem quer
 * estudar por doença liga os diagnósticos.
 */
export function CatalogoCasosTC({ casos, categorias }: { casos: ResumoCasoTC[]; categorias: GuiaCategoriaTC[] }) {
  const [mostrar, setMostrar] = useState(false)
  const [filtro, setFiltro] = useState<CategoriaCasoTC | 'todos'>('todos')
  const [busca, setBusca] = useState('')

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return casos.filter((caso) => {
      if (filtro !== 'todos' && caso.categoria !== filtro) return false
      if (!termo) return true
      const alvo = `${caso.queixa} ${caso.identificacao} ${mostrar ? caso.titulo : ''}`.toLowerCase()
      return alvo.includes(termo)
    })
  }, [casos, filtro, busca, mostrar])

  const totalCortes = casos.reduce((t, c) => t + c.cortes, 0)
  const totalApontamentos = casos.reduce((t, c) => t + c.apontamentos, 0)

  return (
    <div className="rx surface-page min-h-screen">
      <header className="rx-painel rx-grade relative overflow-hidden border-b border-sky-400/15 text-white">
        <div className="rx-abaixo-flutuantes container relative mx-auto max-w-7xl px-4 pb-8 pt-5">
          <Link href="/manual-clinico/radiologia/tomografia" className="-m-1 inline-flex items-center gap-1.5 rounded p-1 text-sm text-sky-100/50 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Atlas de tomografia
          </Link>
          <p className="editorial-mark mt-5 !text-sky-300/80 [&::before]:bg-sky-300/60">Manual de Radiologia · Tomografia</p>
          <h1 className="mt-2 max-w-4xl font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Casos clínicos de TC</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-sky-100/60 sm:text-base">
            Pilhas reais de cortes, roladas como no aparelho. Cada caso começa pela consulta inteira; depois da resposta, as setas do autor
            aparecem traduzidas e comentadas, com a leitura do exame, as armadilhas e a conduta.
          </p>
          <dl className="mt-6 grid max-w-md grid-cols-3 gap-2 text-center">
            {[
              [casos.length, 'casos'],
              [totalCortes.toLocaleString('pt-BR'), 'cortes'],
              [totalApontamentos, 'apontamentos'],
            ].map(([valor, rotulo]) => (
              <div key={rotulo} className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2.5">
                <dt className="sr-only">{rotulo}</dt>
                <dd className="font-heading text-xl font-semibold">{valor}</dd>
                <dd className="text-[11px] text-sky-100/50">{rotulo}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-4 py-7">
        <div className="flex flex-wrap items-center gap-2">
          {[{ id: 'todos' as const, titulo: 'Todos' }, ...categorias].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFiltro(cat.id)}
              aria-pressed={filtro === cat.id}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                filtro === cat.id ? 'border-sky-500/60 bg-sky-500/10 text-sky-700 dark:text-sky-300' : 'border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {cat.titulo}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setMostrar(!mostrar)}
            aria-pressed={mostrar}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground transition hover:bg-muted"
          >
            {mostrar ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {mostrar ? 'Esconder diagnósticos' : 'Mostrar diagnósticos'}
          </button>
        </div>
        <div className="relative mt-3 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por queixa ou paciente" className="pl-9" />
        </div>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visiveis.map((caso) => (
            <li key={caso.slug}>
              <Link
                href={`/manual-clinico/radiologia/tomografia/casos/${caso.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:border-sky-500/50 hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={caso.capa} alt="" loading="lazy" className="h-full w-full object-contain opacity-90 transition group-hover:scale-[1.02] group-hover:opacity-100" />
                  <span className="absolute left-2 top-2 rounded bg-black/65 px-2 py-0.5 font-mono text-[11px] text-sky-100/80">
                    Caso {caso.numero} · {categorias.find((c) => c.id === caso.categoria)?.titulo}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  {mostrar && <p className="font-heading text-base font-semibold leading-snug">{caso.titulo}</p>}
                  <p className={`${mostrar ? 'mt-1 text-xs text-muted-foreground' : 'font-heading text-base font-semibold leading-snug'}`}>{caso.queixa}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{caso.identificacao}</p>
                  <p className="mt-auto flex gap-3 pt-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Layers3 className="h-3.5 w-3.5" /> {caso.cortes} cortes</span>
                    <span className="inline-flex items-center gap-1"><Crosshair className="h-3.5 w-3.5" /> {caso.apontamentos} apontamentos</span>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        {visiveis.length === 0 && <p className="mt-8 text-sm text-muted-foreground">Nenhum caso encontrado.</p>}
      </main>
    </div>
  )
}
