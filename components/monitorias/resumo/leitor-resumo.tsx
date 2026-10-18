'use client'

/**
 * Leitura do Resumo por IA: índice fixo no desktop e recolhível no celular,
 * seção ativa destacada ao rolar, questões com resposta e gabarito comentado,
 * caixas de "a verificar" e "lacunas", e o PDF (gerado no navegador).
 */

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, BookOpenCheck, Brain, Check, ChevronDown, Download, HelpCircle, Lightbulb, ListTree, Loader2, Scale, Sparkles, Target, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatarEmBrasilia } from '@/lib/fuso-brasilia'
import type { ResumoGerado } from '@/lib/monitorias/resumo/tipos'
import { cn } from '@/lib/utils'

const LETRAS = ['A', 'B', 'C', 'D', 'E']

interface Secao {
  id: string
  rotulo: string
  icone: typeof Brain
}

export function LeitorDoResumo({ resumo, reserva, cobertura }: { resumo: ResumoGerado; reserva: { id: string; titulo: string; inicio: string | null }; cobertura: number | null }) {
  const secoes = useMemo<Secao[]>(
    () =>
      [
        { id: 'sintese', rotulo: 'Síntese', icone: Sparkles, tem: true },
        { id: 'topicos', rotulo: 'Tópicos', icone: ListTree, tem: resumo.topicos.length > 0 },
        { id: 'duvidas', rotulo: 'Dúvidas e respostas', icone: HelpCircle, tem: resumo.duvidas.length > 0 },
        { id: 'comparacoes', rotulo: 'Comparações', icone: Scale, tem: resumo.comparacoes.length > 0 },
        { id: 'atencao', rotulo: 'Pontos de atenção', icone: AlertTriangle, tem: resumo.pontosDeAtencao.length > 0 },
        { id: 'revisao', rotulo: 'Revisão rápida', icone: Lightbulb, tem: resumo.revisaoRapida.length > 0 },
        { id: 'questoes', rotulo: 'Questões', icone: Target, tem: resumo.questoes.length > 0 },
        { id: 'verificar', rotulo: 'A verificar e lacunas', icone: BookOpenCheck, tem: resumo.aVerificar.length + resumo.lacunas.length > 0 },
      ].filter((s) => s.tem),
    [resumo],
  )
  const [ativa, setAtiva] = useState('sintese')
  const [indiceAberto, setIndiceAberto] = useState(false)
  const [gerandoPdf, setGerandoPdf] = useState(false)

  // Seção ativa: a primeira cujo topo passou da faixa do cabeçalho.
  useEffect(() => {
    const els = secoes.map((s) => document.getElementById(s.id)).filter((x): x is HTMLElement => !!x)
    if (!('IntersectionObserver' in window) || !els.length) return
    const obs = new IntersectionObserver(
      (entradas) => {
        const visiveis = entradas.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visiveis[0]) setAtiva(visiveis[0].target.id)
      },
      { rootMargin: '-20% 0px -65% 0px' },
    )
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [secoes])

  function ir(id: string) {
    setIndiceAberto(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function pdf() {
    setGerandoPdf(true)
    try {
      const { baixarPdfDoResumo } = await import('@/lib/monitorias/resumo/pdf-resumo')
      await baixarPdfDoResumo({ resumo, reserva })
    } finally {
      setGerandoPdf(false)
    }
  }

  const indice = (
    <nav aria-label="Índice do resumo" className="space-y-0.5">
      {secoes.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => ir(s.id)}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition',
            ativa === s.id ? 'bg-primary/10 font-semibold text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
          aria-current={ativa === s.id ? 'true' : undefined}
        >
          <s.icone className="h-4 w-4 shrink-0" aria-hidden /> {s.rotulo}
        </button>
      ))}
      {resumo.topicos.length > 1 && (
        <div className="ml-6 mt-1 space-y-0.5 border-l border-border pl-2">
          {resumo.topicos.map((t, i) => (
            <button key={i} type="button" onClick={() => ir(`topico-${i}`)} className="block w-full truncate rounded px-1.5 py-0.5 text-left text-xs text-muted-foreground hover:text-foreground">
              {t.titulo}
            </button>
          ))}
        </div>
      )}
    </nav>
  )

  return (
    <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[270px_minmax(0,760px)] xl:justify-center">
      {/* Índice: fixo no desktop */}
      <aside className="hidden lg:block">
        <div className="sticky top-6 space-y-4">
          <div className="rounded-2xl border border-border bg-card p-3">{indice}</div>
          <Button variant="outline" className="w-full" onClick={() => void pdf()} disabled={gerandoPdf}>
            {gerandoPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} Baixar PDF
          </Button>
        </div>
      </aside>

      <article className="min-w-0">
        {/* Cabeçalho */}
        <header className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/[0.12] via-card to-card p-5 sm:p-7">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-2xl" aria-hidden />
          <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
            <Brain className="h-3.5 w-3.5" aria-hidden /> Resumo Inteligente por IA
          </p>
          <h1 className="mt-3 font-heading text-2xl font-semibold leading-tight sm:text-3xl">{resumo.titulo}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {reserva.titulo}
            {reserva.inicio ? ` · ${formatarEmBrasilia(reserva.inicio, { day: '2-digit', month: 'long', year: 'numeric' })}` : ''}
            {cobertura != null ? ` · ${Math.round(cobertura)}% da aula transcrita` : ''}
          </p>
          <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            Gerado por IA a partir da transcrição da aula. Pode conter erros: confira condutas, doses e valores em fontes oficiais.
          </p>
          <div className="mt-4 flex gap-2 lg:hidden">
            <Button variant="outline" size="sm" onClick={() => setIndiceAberto((x) => !x)} aria-expanded={indiceAberto}>
              <ListTree className="mr-1.5 h-4 w-4" /> Índice <ChevronDown className={cn('ml-1 h-4 w-4 transition-transform', indiceAberto && 'rotate-180')} />
            </Button>
            <Button variant="outline" size="sm" onClick={() => void pdf()} disabled={gerandoPdf}>
              {gerandoPdf ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />} PDF
            </Button>
          </div>
          <AnimatePresence>
            {indiceAberto && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden lg:hidden">
                <div className="mt-3 rounded-2xl border border-border bg-card p-2">{indice}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <Bloco id="sintese" titulo="Síntese" icone={Sparkles}>
          {resumo.sintese.split(/\n+/).map((p, i) => (
            <p key={i} className="leading-relaxed text-foreground/90">{p}</p>
          ))}
        </Bloco>

        {resumo.topicos.length > 0 && (
          <Bloco id="topicos" titulo="Tópicos" icone={ListTree}>
            <div className="space-y-4">
              {resumo.topicos.map((t, i) => (
                <section key={i} id={`topico-${i}`} className="scroll-mt-6 rounded-2xl border border-border bg-card p-4 sm:p-5">
                  <h3 className="flex items-start gap-2 font-heading text-lg font-semibold">
                    <span className="mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-lg bg-primary/10 px-1.5 text-xs font-bold text-primary">{i + 1}</span>
                    {t.titulo}
                  </h3>
                  {t.explicacao.split(/\n+/).filter(Boolean).map((p, k) => (
                    <p key={k} className="mt-2 leading-relaxed text-foreground/90">{p}</p>
                  ))}
                  {t.conceitos.length > 0 && (
                    <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                      {t.conceitos.map((c, k) => (
                        <div key={k} className="rounded-xl bg-muted/50 p-3">
                          <dt className="text-sm font-semibold text-primary">{c.termo}</dt>
                          <dd className="mt-0.5 text-sm leading-relaxed text-foreground/85">{c.definicao}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  {t.mecanismos.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mecanismos</p>
                      <ul className="mt-1.5 space-y-1">
                        {t.mecanismos.map((m, k) => (
                          <li key={k} className="flex items-start gap-2 text-sm leading-relaxed"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {t.raciocinioDoMonitor.trim() && (
                    <div className="mt-3 rounded-xl border-l-4 border-primary bg-primary/[0.05] px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Raciocínio do monitor</p>
                      <p className="mt-1 text-sm leading-relaxed">{t.raciocinioDoMonitor}</p>
                    </div>
                  )}
                </section>
              ))}
            </div>
          </Bloco>
        )}

        {resumo.duvidas.length > 0 && (
          <Bloco id="duvidas" titulo="Dúvidas e respostas" icone={HelpCircle}>
            <div className="space-y-2">
              {resumo.duvidas.map((d, i) => (
                <details key={i} className="group rounded-2xl border border-border bg-card p-4 open:shadow-sm">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-3 font-medium">
                    <span>{d.pergunta}</span>
                    <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/85">{d.resposta}</p>
                  {d.quemPerguntou !== 'incerto' && <p className="mt-1 text-xs text-muted-foreground">Pergunta {d.quemPerguntou === 'aluno' ? 'do aluno' : 'levantada pelo monitor'}</p>}
                </details>
              ))}
            </div>
          </Bloco>
        )}

        {resumo.comparacoes.length > 0 && (
          <Bloco id="comparacoes" titulo="Comparações" icone={Scale}>
            <div className="grid gap-3 sm:grid-cols-2">
              {resumo.comparacoes.map((c, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-4">
                  <p className="font-semibold">{c.itens}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">{c.diferencas}</p>
                </div>
              ))}
            </div>
          </Bloco>
        )}

        {resumo.pontosDeAtencao.length > 0 && (
          <Bloco id="atencao" titulo="Pontos de atenção" icone={AlertTriangle}>
            <ul className="space-y-2">
              {resumo.pontosDeAtencao.map((p, i) => (
                <li key={i} className="flex items-start gap-2 rounded-xl bg-rose-500/[0.07] px-3 py-2 text-sm leading-relaxed"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden />{p}</li>
              ))}
            </ul>
          </Bloco>
        )}

        {resumo.revisaoRapida.length > 0 && (
          <Bloco id="revisao" titulo="Revisão rápida" icone={Lightbulb}>
            <ul className="grid gap-2 sm:grid-cols-2">
              {resumo.revisaoRapida.map((p, i) => (
                <li key={i} className="flex items-start gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm leading-relaxed"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />{p}</li>
              ))}
            </ul>
          </Bloco>
        )}

        {resumo.questoes.length > 0 && (
          <Bloco id="questoes" titulo="Questões" icone={Target}>
            <div className="space-y-4">
              {resumo.questoes.map((q, i) => (
                <Questao key={i} n={i + 1} questao={q} />
              ))}
            </div>
          </Bloco>
        )}

        {resumo.aVerificar.length + resumo.lacunas.length > 0 && (
          <Bloco id="verificar" titulo="A verificar e lacunas" icone={BookOpenCheck}>
            {resumo.aVerificar.length > 0 && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] p-4">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Confira em fonte oficial</p>
                <ul className="mt-2 space-y-1.5 text-sm leading-relaxed">
                  {resumo.aVerificar.map((p, i) => (
                    <li key={i} className="flex items-start gap-2"><HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />{p}</li>
                  ))}
                </ul>
              </div>
            )}
            {resumo.lacunas.length > 0 && (
              <div className="mt-3 rounded-2xl border border-border bg-muted/40 p-4">
                <p className="text-sm font-semibold">Lacunas da transcrição</p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {resumo.lacunas.map((p, i) => (
                    <li key={i}>– {p}</li>
                  ))}
                </ul>
              </div>
            )}
          </Bloco>
        )}
      </article>
    </div>
  )
}

function Bloco({ id, titulo, icone: Icone, children }: { id: string; titulo: string; icone: typeof Brain; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-8 scroll-mt-6">
      <h2 className="mb-3 flex items-center gap-2 font-heading text-xl font-semibold">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icone className="h-4 w-4" aria-hidden /></span>
        {titulo}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function Questao({ n, questao }: { n: number; questao: ResumoGerado['questoes'][number] }) {
  const [escolha, setEscolha] = useState<number | null>(null)
  const [revelado, setRevelado] = useState(false)
  const mostrar = revelado || escolha !== null
  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <p className="font-medium leading-relaxed">
        <span className="mr-1.5 text-primary">{n}.</span>
        {questao.enunciado}
      </p>
      <div className="mt-3 space-y-2">
        {questao.alternativas.map((a, k) => {
          const certa = k === questao.correta
          const minha = escolha === k
          return (
            <button
              key={k}
              type="button"
              disabled={mostrar}
              onClick={() => setEscolha(k)}
              className={cn(
                'flex w-full items-start gap-2.5 rounded-xl border px-3 py-2 text-left text-sm leading-relaxed transition',
                !mostrar && 'hover:border-primary/60 hover:bg-primary/[0.04]',
                mostrar && certa && 'border-emerald-500/60 bg-emerald-500/10',
                mostrar && minha && !certa && 'border-rose-500/60 bg-rose-500/10',
                mostrar && !certa && !minha && 'opacity-70',
              )}
            >
              <span className={cn('inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-xs font-bold', mostrar && certa ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-border')}>
                {mostrar && certa ? <Check className="h-3.5 w-3.5" /> : mostrar && minha ? <X className="h-3.5 w-3.5" /> : LETRAS[k]}
              </span>
              <span>{a}</span>
            </button>
          )
        })}
      </div>
      {!mostrar ? (
        <button type="button" onClick={() => setRevelado(true)} className="mt-3 text-xs font-semibold text-primary underline-offset-4 hover:underline">
          Ver gabarito
        </button>
      ) : (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-xl bg-muted/50 p-3 text-sm leading-relaxed">
          <p className="font-semibold">
            Gabarito: {LETRAS[questao.correta]}
            {escolha !== null && <span className={cn('ml-2', escolha === questao.correta ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400')}>{escolha === questao.correta ? 'Você acertou!' : 'Não foi dessa vez.'}</span>}
          </p>
          <p className="mt-1 text-foreground/85">{questao.comentario}</p>
        </motion.div>
      )}
    </div>
  )
}
