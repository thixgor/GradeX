'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Crosshair,
  HeartPulse,
  ListChecks,
  ScanSearch,
  Stethoscope,
  XCircle,
} from 'lucide-react'
import { VisorCasoTC, corDoApontamento } from '@/components/radiologia/visor-caso-tc'
import type { CasoTC } from '@/lib/radiologia/casos-tc'
import type { VinhetaClinica } from '@/lib/radiologia/casos-clinicos'

export interface VizinhoCasoTC {
  slug: string
  titulo: string
}

interface Alternativa {
  texto: string
  certa: boolean
  porQue?: string
}

/** Embaralha de forma estável por caso: a posição da certa não segue padrão. */
function embaralhar(slug: string, itens: Alternativa[]): Alternativa[] {
  let h = 2166136261
  for (const ch of slug) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  const lista = [...itens]
  for (let i = lista.length - 1; i > 0; i -= 1) {
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    const j = Math.abs(h) % (i + 1)
    ;[lista[i], lista[j]] = [lista[j], lista[i]]
  }
  return lista
}

const LETRAS = ['A', 'B', 'C', 'D']

export function CasoTCPagina({
  caso,
  urls,
  vinheta,
  licenca,
  anterior,
  proximo,
  posicao,
}: {
  caso: CasoTC
  urls: string[]
  vinheta: VinhetaClinica
  licenca: string
  anterior: VizinhoCasoTC | null
  proximo: VizinhoCasoTC | null
  posicao: { indice: number; total: number }
}) {
  const [corte, setCorte] = useState(caso.corteInicial)
  const [setas, setSetas] = useState(false)
  const [foco, setFoco] = useState<string | null>(null)
  const [escolha, setEscolha] = useState<number | null>(null)

  const alternativas = useMemo(
    () =>
      embaralhar(caso.slug, [
        { texto: vinheta.achado, certa: true },
        ...vinheta.distratores.map((x) => ({ texto: x.nome, certa: false, porQue: x.porQue })),
      ]),
    [caso.slug, vinheta],
  )
  const respondeu = escolha !== null
  const acertou = respondeu && alternativas[escolha].certa

  const responder = (i: number) => {
    if (respondeu) return
    setEscolha(i)
    setSetas(true)
    setCorte(caso.corteInicial)
  }

  const irAoApontamento = (id: string) => {
    const a = caso.apontamentos.find((item) => item.id === id)
    if (!a) return
    setSetas(true)
    setFoco(id)
    setCorte(a.pontos[0].corte)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      document.getElementById('visor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="rx surface-page min-h-screen">
      <header className="rx-painel rx-grade relative overflow-hidden border-b border-sky-400/15 text-white">
        <div className="rx-abaixo-flutuantes container relative mx-auto max-w-7xl px-4 pb-7 pt-4 sm:pb-8 sm:pt-5">
          <nav aria-label="Trilha de navegação" className="flex flex-wrap items-center gap-1.5 text-xs text-sky-100/50 sm:text-sm">
            <Link href="/manual-clinico/radiologia/tomografia/casos" className="-m-1 inline-flex items-center gap-1.5 rounded p-1 transition hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Casos de TC
            </Link>
            <span aria-hidden>›</span>
            <span className="truncate">{caso.categoriaTitulo}</span>
          </nav>
          <p className="editorial-mark mt-5 !text-sky-300/80 [&::before]:bg-sky-300/60">
            Caso {posicao.indice} de {posicao.total} · {caso.categoriaTitulo} · {caso.totalFatias} cortes
          </p>
          <h1 className="mt-2 max-w-4xl font-heading text-2xl font-semibold tracking-tight sm:text-4xl sm:leading-[1.12]">
            {respondeu ? caso.titulo : 'Caso clínico de tomografia'}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-sky-100/60 sm:text-base">
            {respondeu
              ? caso.resumo
              : 'Leia a consulta, percorra os cortes e responda antes de ligar os apontamentos. O diagnóstico aparece depois da resposta.'}
          </p>
        </div>
      </header>

      <main className="container mx-auto grid max-w-7xl gap-6 px-4 py-7 sm:py-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div id="visor" className="rx-ancora lg:sticky lg:top-20 lg:self-start">
          <VisorCasoTC
            urls={urls}
            largura={caso.largura}
            altura={caso.altura}
            apontamentos={caso.apontamentos}
            corte={corte}
            onCorte={setCorte}
            mostrarSetas={setas}
            onMostrarSetas={(v) => { setSetas(v); if (!v) setFoco(null) }}
            foco={foco}
            rotuloSerie={caso.perspectiva === 'Axial' ? 'Axial' : caso.perspectiva === 'Coronal' ? 'Coronal' : 'Sagital'}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            {caso.protocolo}. Role a roda do mouse, arraste na imagem ou use as setas do teclado; a tecla A liga os apontamentos.
          </p>
        </div>

        <div className="space-y-6">
          {/* ── Consulta ── */}
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <p className="flex items-center gap-2 font-clinical text-[10px] font-black uppercase tracking-widest text-sky-700 dark:text-sky-300">
              <Stethoscope className="h-3.5 w-3.5" /> {vinheta.cenario}
            </p>
            <h2 className="mt-2 font-heading text-lg font-semibold leading-snug">{vinheta.identificacao}</h2>
            <dl className="mt-4 space-y-3 text-sm leading-7 text-foreground/80">
              <div>
                <dt className="font-semibold text-foreground">Queixa principal</dt>
                <dd>{vinheta.queixa}</dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">História da doença atual</dt>
                <dd>{vinheta.historia}</dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">Antecedentes e fatores de risco</dt>
                <dd>
                  <ul className="mt-1 space-y-1">
                    {vinheta.antecedentes.map((item) => {
                      const [rotulo, ...resto] = item.split(': ')
                      return (
                        <li key={item} className="flex gap-2">
                          <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-sky-500" />
                          <span>
                            {resto.length ? <><strong className="font-semibold text-foreground/90">{rotulo}:</strong> {resto.join(': ')}</> : item}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 font-semibold text-foreground"><HeartPulse className="h-4 w-4 text-rose-500" /> Sinais vitais</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5 text-xs">
                  {[
                    ['PA', vinheta.vitais.pa],
                    ['FC', vinheta.vitais.fc],
                    ['FR', vinheta.vitais.fr],
                    ['SatO₂', vinheta.vitais.satO2],
                    ...(vinheta.vitais.temp ? [['T', vinheta.vitais.temp]] : []),
                  ].map(([r, v]) => (
                    <span key={r} className="rounded-lg border border-border bg-muted/50 px-2 py-1"><strong>{r}</strong> {v}</span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">Exame físico e exames iniciais</dt>
                <dd>
                  <ul className="mt-1 space-y-1">
                    {vinheta.exame.map((item) => (
                      <li key={item} className="flex gap-2"><span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-sky-500" />{item}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>
            <p className="mt-4 rounded-xl border border-sky-500/20 bg-sky-500/[0.05] p-3 text-sm leading-6 text-foreground/80">{vinheta.pedido}</p>
          </section>

          {/* ── Pergunta ── */}
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <p className="flex items-center gap-2 font-clinical text-[10px] font-black uppercase tracking-widest text-sky-700 dark:text-sky-300">
              <ScanSearch className="h-3.5 w-3.5" /> Pergunta
            </p>
            <h2 className="mt-2 font-heading text-lg font-semibold leading-snug">{vinheta.pergunta}</h2>
            <ol className="mt-4 space-y-2">
              {alternativas.map((alt, i) => {
                const marcada = escolha === i
                const estilo = !respondeu
                  ? 'border-border hover:border-sky-500/60 hover:bg-sky-500/[0.04]'
                  : alt.certa
                    ? 'border-emerald-500/60 bg-emerald-500/[0.07]'
                    : marcada
                      ? 'border-rose-500/60 bg-rose-500/[0.07]'
                      : 'border-border opacity-80'
                return (
                  <li key={alt.texto}>
                    <button
                      type="button"
                      disabled={respondeu}
                      onClick={() => responder(i)}
                      className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition ${estilo}`}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">{LETRAS[i]}</span>
                      <span className="flex-1 pt-0.5 font-medium">{alt.texto}</span>
                      {respondeu && alt.certa && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />}
                      {respondeu && marcada && !alt.certa && <XCircle className="h-5 w-5 shrink-0 text-rose-500" />}
                    </button>
                  </li>
                )
              })}
            </ol>

            {respondeu && (
              <div className="mt-5 space-y-4">
                <div className={`rounded-xl border p-4 ${acertou ? 'border-emerald-500/40 bg-emerald-500/[0.06]' : 'border-rose-500/40 bg-rose-500/[0.06]'}`}>
                  <p className="text-xs font-black uppercase tracking-widest">{acertou ? 'Resposta certa' : 'Resposta errada'}</p>
                  <p className="mt-1 font-heading text-base font-semibold">{vinheta.veredito ?? vinheta.achado}</p>
                  <p className="mt-2 text-sm leading-7 text-foreground/80">{vinheta.correlacao}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Por que as outras não</p>
                  <ul className="mt-2 space-y-2">
                    {alternativas.filter((alt) => !alt.certa).map((alt) => (
                      <li key={alt.texto} className="rounded-xl border border-border bg-muted/30 p-3 text-sm leading-6">
                        <strong className="font-semibold">{alt.texto}.</strong> <span className="text-foreground/75">{alt.porQue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-xs text-muted-foreground">Os apontamentos foram ligados no visor. Clique em cada um abaixo para ir ao corte.</p>
              </div>
            )}
          </section>

          {/* ── Apontamentos ── */}
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <p className="flex items-center gap-2 font-clinical text-[10px] font-black uppercase tracking-widest text-sky-700 dark:text-sky-300">
              <Crosshair className="h-3.5 w-3.5" /> Apontamentos na imagem
            </p>
            {!respondeu && (
              <p className="mt-2 text-sm text-muted-foreground">Responda à pergunta para abrir os apontamentos, ou ligue-os no visor se quiser estudar direto.</p>
            )}
            {(respondeu || setas) && (
              <ol className="mt-3 space-y-2">
                {caso.apontamentos.map((a, i) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => irAoApontamento(a.id)}
                      className={`flex w-full gap-3 rounded-xl border p-3 text-left text-sm transition hover:bg-muted/50 ${foco === a.id ? 'border-sky-500/60' : 'border-border'}`}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black text-black" style={{ background: corDoApontamento(i) }}>
                        {i + 1}
                      </span>
                      <span className="flex-1">
                        <span className="font-semibold">{a.nome}</span>
                        <span className="ml-2 text-xs text-muted-foreground">corte {a.pontos[0].corte + 1}</span>
                        <span className="mt-0.5 block leading-6 text-foreground/75">{a.explicacao}</span>
                        <span className="mt-0.5 block text-[11px] italic text-muted-foreground">Rótulo original: {a.rotuloOriginal}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {respondeu && (
            <>
              <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                <p className="flex items-center gap-2 font-clinical text-[10px] font-black uppercase tracking-widest text-sky-700 dark:text-sky-300">
                  <ListChecks className="h-3.5 w-3.5" /> Leitura do exame
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-foreground/80">
                  {caso.achados.map((item) => (
                    <li key={item} className="flex gap-2"><span className="mt-3 h-1 w-1 shrink-0 rounded-full bg-sky-500" />{item}</li>
                  ))}
                </ul>
              </section>
              <section className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] p-5 sm:p-6">
                <p className="flex items-center gap-2 font-clinical text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5" /> Armadilhas
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-foreground/80">
                  {caso.armadilhas.map((item) => (
                    <li key={item} className="flex gap-2"><span className="mt-3 h-1 w-1 shrink-0 rounded-full bg-amber-500" />{item}</li>
                  ))}
                </ul>
              </section>
              <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                <p className="flex items-center gap-2 font-clinical text-[10px] font-black uppercase tracking-widest text-sky-700 dark:text-sky-300">
                  <ClipboardList className="h-3.5 w-3.5" /> Conduta
                </p>
                <p className="mt-3 text-sm leading-7 text-foreground/80">{caso.conduta}</p>
              </section>
            </>
          )}

          <p className="text-xs leading-5 text-muted-foreground">
            Imagens: caso de {caso.autoria}, <a href={caso.urlDoCaso} target="_blank" rel="noreferrer" className="underline">Radiopaedia.org</a>. {licenca}. Rótulos traduzidos e
            comentados pelo Manual de Radiologia; paciente da consulta fictício.
          </p>

          <nav className="grid gap-2 sm:grid-cols-2" aria-label="Outros casos">
            {anterior ? (
              <Link href={`/manual-clinico/radiologia/tomografia/casos/${anterior.slug}`} className="rounded-xl border border-border p-3 text-sm transition hover:bg-muted/50">
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Anterior</span>
                <span className="font-semibold">{anterior.titulo}</span>
              </Link>
            ) : <span />}
            {proximo && (
              <Link href={`/manual-clinico/radiologia/tomografia/casos/${proximo.slug}`} className="rounded-xl border border-border p-3 text-right text-sm transition hover:bg-muted/50">
                <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">Próximo <ArrowRight className="h-3.5 w-3.5" /></span>
                <span className="font-semibold">{proximo.titulo}</span>
              </Link>
            )}
          </nav>
        </div>
      </main>
    </div>
  )
}
