'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, ExternalLink, Images, Search, Target, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { LogoRadiologia } from '@/components/radiologia/logo'
import {
  buscarEstudosRaioX,
  CREDITO_CLINICAL_ANATOMY,
  REGIOES_RAIO_X,
  TOTAL_ESTRUTURAS_RAIO_X,
  type RegiaoRaioX,
} from '@/lib/radiologia/raio-x'

export function CatalogoRaioX() {
  const [busca, setBusca] = useState('')
  const [regiao, setRegiao] = useState<RegiaoRaioX | 'todas'>('todas')
  const estudos = useMemo(() => buscarEstudosRaioX(busca, regiao), [busca, regiao])

  return (
    <div className="surface-page min-h-screen">
      <header className="border-b border-border bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4 pb-8 pt-6">
          <Link href="/manual-clinico/radiologia" className="-m-2 inline-flex items-center gap-1.5 rounded-lg p-2 text-sm text-muted-foreground transition hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Manual de Radiologia
          </Link>
          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <LogoRadiologia className="scale-90 origin-left" />
              <p className="editorial-mark mt-5">Atlas de Raio-X · anatomia guiada</p>
              <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Radiografias organizadas por região e incidência</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Selecione uma incidência, clique nas estruturas e veja a demarcação diretamente sobre a radiografia.
                Cada estudo inclui tradução pt-BR, técnica, critérios de qualidade, roteiro sistemático e armadilhas.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-muted-foreground">
                <span className="rounded-full border border-border bg-card px-3 py-1.5"><Images className="mr-1.5 inline h-3.5 w-3.5 text-sky-500" />28 incidências</span>
                <span className="rounded-full border border-border bg-card px-3 py-1.5"><Target className="mr-1.5 inline h-3.5 w-3.5 text-sky-500" />{TOTAL_ESTRUTURAS_RAIO_X} demarcações</span>
              </div>
            </div>
            <div className="w-full max-w-md">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar exame ou estrutura..." className="h-12 bg-card pl-11 pr-11" aria-label="Buscar exame ou estrutura" />
                {busca && <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted" aria-label="Limpar busca"><X className="h-4 w-4" /></button>}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2" aria-label="Filtrar por região">
          <button onClick={() => setRegiao('todas')} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition ${regiao === 'todas' ? 'border-sky-500 bg-sky-500 text-white' : 'border-border bg-card text-muted-foreground hover:border-sky-500/40'}`}>Todas</button>
          {REGIOES_RAIO_X.map((item) => <button key={item.id} onClick={() => setRegiao(item.id)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition ${regiao === item.id ? 'border-sky-500 bg-sky-500 text-white' : 'border-border bg-card text-muted-foreground hover:border-sky-500/40'}`}>{item.titulo}</button>)}
        </div>

        <p className="mb-4 text-xs font-semibold text-muted-foreground">{estudos.length} exame{estudos.length === 1 ? '' : 's'} encontrado{estudos.length === 1 ? '' : 's'}</p>
        {estudos.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {estudos.map((estudo) => (
              <Link key={estudo.id} href={`/manual-clinico/radiologia/raio-x/${estudo.id}`} className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-sky-500/40 hover:shadow-md">
                <div className="relative aspect-[4/3] overflow-hidden bg-black">
                  <img src={estudo.imagem} alt={`Radiografia: ${estudo.titulo}, ${estudo.incidencia}`} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.03]" />
                  <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/65 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white backdrop-blur">{estudo.incidencia}</span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">{estudo.regiaoTitulo}</p>
                  <h2 className="mt-1 font-semibold leading-snug">{estudo.titulo}</h2>
                  <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-muted-foreground">{estudo.foco}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
                    <span className="font-medium text-muted-foreground">{estudo.estruturas.length} estruturas</span>
                    <span className="inline-flex items-center gap-1 font-bold text-sky-600 dark:text-sky-400">Estudar <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center"><Search className="mx-auto h-8 w-8 text-muted-foreground/30" /><p className="mt-3 text-sm text-muted-foreground">Nenhuma incidência ou estrutura corresponde aos filtros.</p></div>
        )}

        <div className="mt-10 rounded-xl border border-sky-500/20 bg-sky-500/[0.05] p-4 text-xs leading-relaxed text-muted-foreground">
          <p className="font-bold text-foreground">Fonte visual e autorização</p>
          <p className="mt-1">{CREDITO_CLINICAL_ANATOMY.nota} Documento {CREDITO_CLINICAL_ANATOMY.autorizacao}. <a href={CREDITO_CLINICAL_ANATOMY.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-sky-600 underline underline-offset-2">Abrir atlas original <ExternalLink className="h-3 w-3" /></a></p>
        </div>
      </main>
    </div>
  )
}
