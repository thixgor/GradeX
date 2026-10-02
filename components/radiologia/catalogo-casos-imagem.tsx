'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Crosshair, Eye, EyeOff, Layers3, Search, XCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { GuiaCategoria } from '@/lib/radiologia/casos-imagem'
import type { CategoriaCaso, Modalidade } from '@/lib/radiologia/casos-imagem-tipos'
import { lerResultados, type Resultado } from './progresso-casos'

export interface ResumoCaso {
  slug: string
  numero: number
  titulo: string
  categoria: CategoriaCaso
  tema: string
  queixa: string
  identificacao: string
  cortes: number
  imagens: number
  apontamentos: number
  capa: string
}

type FiltroProgresso = 'todos' | 'pendentes' | 'errados'

/**
 * Catálogo de uma coleção de casos com apontamentos, organizado por região e,
 * dentro dela, por tema.
 *
 * Abre em modo prova: o cartão mostra o paciente e a queixa, não o diagnóstico
 * — o título de um caso é a resposta do quiz dele. Quem quer estudar por doença
 * liga os diagnósticos. O progresso (certo, errado, pendente) vem do navegador.
 */
export function CatalogoCasosImagem({
  titulo,
  descricao,
  voltar,
  modalidade,
  rotaCatalogo,
  categorias,
  temas,
  casos,
  outraColecao,
}: {
  titulo: string
  descricao: string
  voltar: { href: string; rotulo: string }
  modalidade: Modalidade
  rotaCatalogo: string
  categorias: GuiaCategoria[]
  temas: Record<string, string[]>
  casos: ResumoCaso[]
  outraColecao?: { href: string; rotulo: string; total: number }
}) {
  const [mostrar, setMostrar] = useState(false)
  const [regiao, setRegiao] = useState<CategoriaCaso | 'todas'>('todas')
  const [tema, setTema] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [progresso, setProgresso] = useState<FiltroProgresso>('todos')
  const [resultados, setResultados] = useState<Record<string, Resultado>>({})

  useEffect(() => {
    setResultados(lerResultados(modalidade))
    const r = new URLSearchParams(window.location.search).get('regiao')
    if (r && categorias.some((c) => c.id === r)) setRegiao(r as CategoriaCaso)
  }, [modalidade, categorias])

  const escolherRegiao = (r: CategoriaCaso | 'todas') => {
    setRegiao(r)
    setTema(null)
    const url = new URL(window.location.href)
    if (r === 'todas') url.searchParams.delete('regiao')
    else url.searchParams.set('regiao', r)
    window.history.replaceState(null, '', url)
  }

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return casos.filter((caso) => {
      if (regiao !== 'todas' && caso.categoria !== regiao) return false
      if (tema && caso.tema !== tema) return false
      if (progresso === 'pendentes' && resultados[caso.slug]) return false
      if (progresso === 'errados' && resultados[caso.slug] !== 'errado') return false
      if (!termo) return true
      return `${caso.queixa} ${caso.identificacao} ${caso.tema} ${mostrar ? caso.titulo : ''}`.toLowerCase().includes(termo)
    })
  }, [casos, regiao, tema, busca, progresso, resultados, mostrar])

  const feitos = casos.filter((c) => resultados[c.slug]).length
  const certos = casos.filter((c) => resultados[c.slug] === 'certo').length
  const totalApontamentos = casos.reduce((t, c) => t + c.apontamentos, 0)
  const totalCortes = casos.reduce((t, c) => t + c.cortes, 0)

  // Grupos para exibição: região → tema → casos.
  const grupos = categorias
    .map((cat) => ({
      cat,
      temas: (temas[cat.id] ?? [])
        .map((t) => ({ tema: t, casos: visiveis.filter((c) => c.categoria === cat.id && c.tema === t) }))
        .filter((g) => g.casos.length),
    }))
    .filter((g) => g.temas.length)

  return (
    <div className="rx surface-page min-h-screen">
      <header className="rx-painel rx-grade relative overflow-hidden border-b border-sky-400/15 text-white">
        <div className="rx-abaixo-flutuantes container relative mx-auto max-w-7xl px-4 pb-8 pt-5">
          <Link href={voltar.href} className="-m-1 inline-flex items-center gap-1.5 rounded p-1 text-sm text-sky-100/50 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" /> {voltar.rotulo}
          </Link>
          <p className="editorial-mark mt-5 !text-sky-300/80 [&::before]:bg-sky-300/60">Manual de Radiologia · Casos com apontamentos</p>
          <h1 className="mt-2 max-w-4xl font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{titulo}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-sky-100/60 sm:text-base">{descricao}</p>
          <dl className="mt-6 grid max-w-2xl grid-cols-2 gap-2 text-center sm:grid-cols-4">
            {[
              [casos.length, 'casos'],
              [modalidade === 'tc' ? totalCortes.toLocaleString('pt-BR') : casos.reduce((t, c) => t + c.imagens, 0), modalidade === 'tc' ? 'cortes' : 'radiografias'],
              [totalApontamentos, 'apontamentos comentados'],
              [`${feitos}/${casos.length}`, `feitos · ${certos} certos`],
            ].map(([valor, rotulo]) => (
              <div key={String(rotulo)} className="rounded-xl border border-white/10 bg-white/[0.04] px-2 py-2.5">
                <dt className="sr-only">{rotulo}</dt>
                <dd className="font-heading text-xl font-semibold">{valor}</dd>
                <dd className="text-[11px] text-sky-100/50">{rotulo}</dd>
              </div>
            ))}
          </dl>
          {outraColecao && (
            <Link href={outraColecao.href} className="mt-4 inline-flex items-center gap-1.5 text-sm text-sky-200/80 underline-offset-4 hover:text-white hover:underline">
              {outraColecao.rotulo} ({outraColecao.total} casos) →
            </Link>
          )}
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-4 py-7">
        {/* Regiões */}
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Regiões">
          {[{ id: 'todas' as const, titulo: 'Todas' }, ...categorias].map((cat) => {
            const n = cat.id === 'todas' ? casos.length : casos.filter((c) => c.categoria === cat.id).length
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={regiao === cat.id}
                onClick={() => escolherRegiao(cat.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                  regiao === cat.id ? 'border-sky-500/60 bg-sky-500/10 text-sky-700 dark:text-sky-300' : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {cat.titulo} <span className="opacity-60">{n}</span>
              </button>
            )
          })}
        </div>

        {/* Temas da região escolhida */}
        {regiao !== 'todas' && (temas[regiao]?.length ?? 0) > 1 && (
          <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Temas">
            {[null, ...(temas[regiao] ?? [])].map((t) => (
              <button
                key={t ?? 'todos'}
                type="button"
                aria-pressed={tema === t}
                onClick={() => setTema(t)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                  tema === t ? 'border-sky-500/50 bg-sky-500/10 text-sky-700 dark:text-sky-300' : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {t ?? 'Todos os temas'}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por queixa, paciente ou tema" className="pl-9" />
          </div>
          <select
            value={progresso}
            onChange={(e) => setProgresso(e.target.value as FiltroProgresso)}
            aria-label="Filtrar por progresso"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="todos">Todos os casos</option>
            <option value="pendentes">Ainda não feitos</option>
            <option value="errados">Que errei</option>
          </select>
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

        <div className="mt-8 space-y-12">
          {grupos.map(({ cat, temas: listaTemas }) => (
            <section key={cat.id} aria-labelledby={`regiao-${cat.id}`}>
              <div className="border-b border-border pb-2">
                <h2 id={`regiao-${cat.id}`} className="font-heading text-2xl font-semibold">{cat.titulo}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{cat.descricao}</p>
              </div>
              <div className="mt-5 space-y-8">
                {listaTemas.map(({ tema: t, casos: lista }) => (
                  <div key={t}>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      {t} <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold normal-case tracking-normal">{lista.length}</span>
                    </h3>
                    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {lista.map((caso) => (
                        <li key={caso.slug}>
                          <Cartao caso={caso} rota={rotaCatalogo} mostrar={mostrar} resultado={resultados[caso.slug]} modalidade={modalidade} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
        {visiveis.length === 0 && <p className="mt-8 text-sm text-muted-foreground">Nenhum caso encontrado com esses filtros.</p>}
      </main>
    </div>
  )
}

function Cartao({
  caso,
  rota,
  mostrar,
  resultado,
  modalidade,
}: {
  caso: ResumoCaso
  rota: string
  mostrar: boolean
  resultado?: Resultado
  modalidade: Modalidade
}) {
  return (
    <Link
      href={`${rota}/${caso.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:border-sky-500/50 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={caso.capa} alt="" loading="lazy" className="h-full w-full object-contain opacity-90 transition group-hover:scale-[1.02] group-hover:opacity-100" />
        <span className="absolute left-2 top-2 rounded bg-black/65 px-2 py-0.5 font-mono text-[11px] text-sky-100/80">Caso {caso.numero}</span>
        {resultado && (
          <span className={`absolute right-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${resultado === 'certo' ? 'bg-emerald-500/90 text-white' : 'bg-rose-500/90 text-white'}`}>
            {resultado === 'certo' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {resultado === 'certo' ? 'Acertou' : 'Errou'}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        {mostrar && <p className="font-heading text-base font-semibold leading-snug">{caso.titulo}</p>}
        <p className={mostrar ? 'mt-1 text-xs text-muted-foreground' : 'font-heading text-base font-semibold leading-snug'}>{caso.queixa}</p>
        <p className="mt-1 text-xs text-muted-foreground">{caso.identificacao}</p>
        <p className="mt-auto flex gap-3 pt-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Layers3 className="h-3.5 w-3.5" />
            {modalidade === 'tc' ? `${caso.cortes} cortes` : `${caso.imagens} ${caso.imagens > 1 ? 'incidências' : 'incidência'}`}
          </span>
          <span className="inline-flex items-center gap-1"><Crosshair className="h-3.5 w-3.5" /> {caso.apontamentos} apontamentos</span>
        </p>
      </div>
    </Link>
  )
}
