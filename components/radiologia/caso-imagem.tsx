'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Crosshair,
  GraduationCap,
  HeartPulse,
  Lightbulb,
  ListChecks,
  ScanSearch,
  Stethoscope,
  XCircle,
} from 'lucide-react'
import { VisorCasoImagem, corDoApontamento } from '@/components/radiologia/visor-caso-imagem'
import type { CasoImagem } from '@/lib/radiologia/casos-imagem'
import type { VinhetaClinica } from '@/lib/radiologia/casos-clinicos'
import { lerModo, gravarModo, gravarResultado, type ModoCaso } from './progresso-casos'

export interface VizinhoCaso {
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

export function CasoImagemPagina({
  caso,
  urlsPorSerie,
  vinheta,
  licenca,
  rotaCatalogo,
  rotuloColecao,
  anterior,
  proximo,
  posicao,
}: {
  caso: CasoImagem
  urlsPorSerie: string[][]
  vinheta: VinhetaClinica
  licenca: string
  /** Endereço do catálogo da coleção; os casos vivem em `${rotaCatalogo}/<slug>`. */
  rotaCatalogo: string
  rotuloColecao: string
  anterior: VizinhoCaso | null
  proximo: VizinhoCaso | null
  posicao: { indice: number; total: number }
}) {
  const [modo, setModo] = useState<ModoCaso>('prova')
  const [serie, setSerie] = useState(0)
  const [cortes, setCortes] = useState<number[]>(() => caso.series.map((s) => s.corteInicial))
  const [setas, setSetas] = useState(false)
  const [passo, setPasso] = useState<number | null>(null)
  const [escolha, setEscolha] = useState<number | null>(null)

  useEffect(() => {
    const m = lerModo()
    setModo(m)
    if (m === 'estudo') setSetas(true)
  }, [])

  const numeracao = useMemo(() => Object.fromEntries(caso.apontamentos.map((a, i) => [a.id, i])), [caso.apontamentos])
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
  const revelado = respondeu || modo === 'estudo'
  const atual = passo !== null ? caso.apontamentos[passo] : null

  const irAoApontamento = (indice: number, rolar = false) => {
    const a = caso.apontamentos[indice]
    if (!a) return
    setPasso(indice)
    setSetas(true)
    setSerie(a.serie)
    setCortes((lista) => lista.map((c, k) => (k === a.serie ? a.pontos[0].corte : c)))
    if (rolar && typeof window !== 'undefined' && window.innerWidth < 1024) {
      document.getElementById('visor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const responder = (i: number) => {
    if (respondeu) return
    setEscolha(i)
    gravarResultado(caso.modalidade, caso.slug, alternativas[i].certa)
    irAoApontamento(0)
  }

  const trocarModo = (m: ModoCaso) => {
    setModo(m)
    gravarModo(m)
    if (m === 'estudo') {
      setSetas(true)
      if (passo === null && caso.apontamentos.length) irAoApontamento(0)
    }
  }

  const serieAtual = caso.series[serie]

  return (
    <div className="rx surface-page min-h-screen">
      <header className="rx-painel rx-grade relative overflow-hidden border-b border-sky-400/15 text-white">
        <div className="rx-abaixo-flutuantes container relative mx-auto max-w-7xl px-4 pb-7 pt-4 sm:pb-8 sm:pt-5">
          <nav aria-label="Trilha de navegação" className="flex flex-wrap items-center gap-1.5 text-xs text-sky-100/50 sm:text-sm">
            <Link href={rotaCatalogo} className="-m-1 inline-flex items-center gap-1.5 rounded p-1 transition hover:text-white">
              <ArrowLeft className="h-4 w-4" /> {rotuloColecao}
            </Link>
            <span aria-hidden>›</span>
            <Link href={`${rotaCatalogo}?regiao=${caso.categoria}`} className="rounded p-1 transition hover:text-white">
              {caso.categoriaTitulo}
            </Link>
            <span aria-hidden>›</span>
            <span className="truncate">{caso.tema}</span>
          </nav>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-4xl">
              <p className="editorial-mark !text-sky-300/80 [&::before]:bg-sky-300/60">
                Caso {posicao.indice} de {posicao.total} · {caso.apontamentos.length} apontamentos ·{' '}
                {caso.totalFatias > caso.series.length ? `${caso.totalFatias} cortes` : `${caso.series.length} ${caso.series.length > 1 ? 'imagens' : 'imagem'}`}
              </p>
              <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-4xl sm:leading-[1.12]">
                {revelado ? caso.titulo : `Caso clínico de ${caso.modalidade === 'tc' ? 'tomografia' : 'radiografia'}`}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-sky-100/60 sm:text-base">
                {revelado
                  ? caso.resumo
                  : 'Leia a consulta, examine a imagem e responda antes de ligar os apontamentos. O diagnóstico aparece depois da resposta.'}
              </p>
            </div>
            <div role="radiogroup" aria-label="Modo de estudo" className="inline-flex rounded-xl border border-white/15 bg-white/5 p-1 text-xs font-bold">
              {(['prova', 'estudo'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={modo === m}
                  onClick={() => trocarModo(m)}
                  className={`rounded-lg px-3 py-1.5 transition ${modo === m ? 'bg-sky-400/20 text-white' : 'text-sky-100/60 hover:text-white'}`}
                >
                  {m === 'prova' ? 'Modo prova' : 'Modo estudo'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto grid max-w-7xl gap-6 px-4 py-7 sm:py-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        {/* ── Coluna da imagem ── */}
        <div id="visor" className="rx-ancora space-y-3 lg:sticky lg:top-20 lg:self-start">
          {caso.series.length > 1 && (
            <div role="tablist" aria-label="Séries do exame" className="flex flex-wrap gap-1.5">
              {caso.series.map((s) => (
                <button
                  key={s.indice}
                  type="button"
                  role="tab"
                  aria-selected={serie === s.indice}
                  onClick={() => setSerie(s.indice)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                    serie === s.indice ? 'border-sky-500/60 bg-sky-500/10 text-sky-700 dark:text-sky-300' : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {s.rotulo}
                </button>
              ))}
            </div>
          )}
          <VisorCasoImagem
            urls={urlsPorSerie[serie]}
            largura={serieAtual.largura}
            altura={serieAtual.altura}
            apontamentos={caso.apontamentos.filter((a) => a.serie === serie)}
            numeracao={numeracao}
            corte={cortes[serie]}
            onCorte={(c) => setCortes((lista) => lista.map((x, k) => (k === serie ? c : x)))}
            mostrarSetas={setas}
            onMostrarSetas={(v) => { setSetas(v); if (!v) setPasso(null) }}
            foco={atual?.id ?? null}
            rotuloSerie={serieAtual.rotulo}
          />

          {/* Tour guiado: um apontamento por vez, com o comentário ao lado da imagem. */}
          {revelado && atual && passo !== null ? (
            <section aria-live="polite" className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 font-clinical text-[10px] font-black uppercase tracking-widest text-sky-700 dark:text-sky-300">
                  <Crosshair className="h-3.5 w-3.5" /> Apontamento {passo + 1} de {caso.apontamentos.length}
                </p>
                <div className="flex gap-1">
                  <button type="button" aria-label="Apontamento anterior" disabled={passo === 0} onClick={() => irAoApontamento(passo - 1)} className="rounded-lg border border-border p-1.5 disabled:opacity-30 hover:bg-muted">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button type="button" aria-label="Próximo apontamento" disabled={passo === caso.apontamentos.length - 1} onClick={() => irAoApontamento(passo + 1)} className="rounded-lg border border-border p-1.5 disabled:opacity-30 hover:bg-muted">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h2 className="mt-2 flex items-center gap-2 font-heading text-lg font-semibold">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black text-black" style={{ background: corDoApontamento(passo) }}>
                  {passo + 1}
                </span>
                {atual.nome}
              </h2>
              <p className="mt-1 text-sm font-medium text-foreground/85">{atual.resumo}</p>
              {atual.explicacao !== atual.resumo && <p className="mt-3 text-sm leading-7 text-foreground/75">{atual.explicacao}</p>}
              {atual.dica && (
                <p className="mt-3 flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3 text-sm leading-6 text-foreground/80">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /> {atual.dica}
                </p>
              )}
              <p className="mt-3 text-[11px] text-muted-foreground">
                {caso.series.length > 1 ? `${caso.series[atual.serie].rotulo} · ` : ''}
                {caso.series[atual.serie].totalFatias > 1 ? `corte ${atual.pontos[0].corte + 1} · ` : ''}
                {atual.proprio ? 'seta acrescentada pela equipe Domine Aqui' : <>rótulo original do autor: <em>{atual.rotuloOriginal}</em></>}
              </p>
            </section>
          ) : (
            <p className="text-xs text-muted-foreground">
              {caso.protocolo}.{' '}
              {caso.totalFatias > caso.series.length
                ? 'Role a roda do mouse, arraste na imagem ou use as setas do teclado; a tecla A liga os apontamentos.'
                : 'Use o zoom e o arraste para examinar detalhes; dois cliques ampliam.'}
            </p>
          )}
        </div>

        {/* ── Coluna do caso ── */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <p className="flex items-center gap-2 font-clinical text-[10px] font-black uppercase tracking-widest text-sky-700 dark:text-sky-300">
              <Stethoscope className="h-3.5 w-3.5" /> {vinheta.cenario}
            </p>
            <h2 className="mt-2 font-heading text-lg font-semibold leading-snug">{vinheta.identificacao}</h2>
            <dl className="mt-4 space-y-3 text-sm leading-7 text-foreground/80">
              <Bloco rotulo="Queixa principal">{vinheta.queixa}</Bloco>
              <Bloco rotulo="História da doença atual">{vinheta.historia}</Bloco>
              <Bloco rotulo="Antecedentes e fatores de risco">
                <ul className="mt-1 space-y-1">
                  {vinheta.antecedentes.map((item) => {
                    const [rotulo, ...resto] = item.split(': ')
                    return (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-sky-500" />
                        <span>{resto.length ? <><strong className="font-semibold text-foreground/90">{rotulo}:</strong> {resto.join(': ')}</> : item}</span>
                      </li>
                    )
                  })}
                </ul>
              </Bloco>
              <div>
                <dt className="flex items-center gap-1.5 font-semibold text-foreground"><HeartPulse className="h-4 w-4 text-rose-500" /> Sinais vitais</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5 text-xs">
                  {[
                    ['PA', vinheta.vitais.pa],
                    ['FC', vinheta.vitais.fc],
                    ['FR', vinheta.vitais.fr],
                    ['SatO₂', vinheta.vitais.satO2],
                    ...(vinheta.vitais.temp ? [['T', vinheta.vitais.temp]] : []),
                  ].map(([rotulo, valor]) => (
                    <span key={rotulo} className="rounded-lg border border-border bg-muted/50 px-2 py-1"><strong>{rotulo}</strong> {valor}</span>
                  ))}
                </dd>
              </div>
              <Bloco rotulo="Exame físico e exames iniciais">
                <ul className="mt-1 space-y-1">
                  {vinheta.exame.map((item) => (
                    <li key={item} className="flex gap-2"><span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-sky-500" />{item}</li>
                  ))}
                </ul>
              </Bloco>
            </dl>
            <p className="mt-4 rounded-xl border border-sky-500/20 bg-sky-500/[0.05] p-3 text-sm leading-6 text-foreground/80">{vinheta.pedido}</p>
          </section>

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
                    <button type="button" disabled={respondeu} onClick={() => responder(i)} className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition ${estilo}`}>
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">{LETRAS[i]}</span>
                      <span className="flex-1 pt-0.5 font-medium">{alt.texto}</span>
                      {respondeu && alt.certa && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />}
                      {respondeu && marcada && !alt.certa && <XCircle className="h-5 w-5 shrink-0 text-rose-500" />}
                    </button>
                  </li>
                )
              })}
            </ol>

            {revelado && (
              <div className="mt-5 space-y-4">
                <div className={`rounded-xl border p-4 ${!respondeu ? 'border-sky-500/30 bg-sky-500/[0.05]' : acertou ? 'border-emerald-500/40 bg-emerald-500/[0.06]' : 'border-rose-500/40 bg-rose-500/[0.06]'}`}>
                  <p className="text-xs font-black uppercase tracking-widest">{!respondeu ? 'Gabarito' : acertou ? 'Resposta certa' : 'Resposta errada'}</p>
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
              </div>
            )}
          </section>

          {revelado && (
            <>
              <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                <p className="flex items-center gap-2 font-clinical text-[10px] font-black uppercase tracking-widest text-sky-700 dark:text-sky-300">
                  <Crosshair className="h-3.5 w-3.5" /> Todos os apontamentos
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Clique para levar a imagem até a seta e abrir o comentário ao lado dela.</p>
                <ol className="mt-3 space-y-1.5">
                  {caso.apontamentos.map((a, i) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => irAoApontamento(i, true)}
                        className={`flex w-full items-start gap-3 rounded-xl border p-2.5 text-left text-sm transition hover:bg-muted/50 ${passo === i ? 'border-sky-500/60 bg-sky-500/[0.04]' : 'border-border'}`}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black text-black" style={{ background: corDoApontamento(i) }}>{i + 1}</span>
                        <span className="flex-1">
                          <span className="font-semibold">{a.nome}</span>
                          <span className="block text-xs leading-5 text-muted-foreground">{a.resumo}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              </section>
              <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                <p className="flex items-center gap-2 font-clinical text-[10px] font-black uppercase tracking-widest text-sky-700 dark:text-sky-300">
                  <ListChecks className="h-3.5 w-3.5" /> Leitura do exame
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{caso.protocolo}</p>
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

          {!revelado && (
            <p className="flex items-center gap-2 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              <GraduationCap className="h-4 w-4 shrink-0" />
              Os {caso.apontamentos.length} apontamentos comentados, a leitura do exame, as armadilhas e a conduta abrem depois da resposta. Para estudar direto, use o modo estudo.
            </p>
          )}

          <p className="flex gap-2 text-xs leading-5 text-muted-foreground">
            <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Imagens: caso de {caso.autoria}, <a href={caso.urlDoCaso} target="_blank" rel="noreferrer" className="underline">Radiopaedia.org</a>. {licenca}. Setas do autor
              do caso, com rótulos traduzidos e comentados pelo Manual de Radiologia; paciente da consulta fictício.
            </span>
          </p>

          <nav className="grid gap-2 sm:grid-cols-2" aria-label="Outros casos">
            {anterior ? (
              <Link href={`${rotaCatalogo}/${anterior.slug}`} className="rounded-xl border border-border p-3 text-sm transition hover:bg-muted/50">
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Anterior</span>
                <span className="font-semibold">{anterior.titulo}</span>
              </Link>
            ) : <span />}
            {proximo && (
              <Link href={`${rotaCatalogo}/${proximo.slug}`} className="rounded-xl border border-border p-3 text-right text-sm transition hover:bg-muted/50">
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

function Bloco({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-semibold text-foreground">{rotulo}</dt>
      <dd>{children}</dd>
    </div>
  )
}
