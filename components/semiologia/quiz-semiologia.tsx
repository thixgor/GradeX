'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Crosshair,
  HeartPulse,
  Lightbulb,
  RotateCcw,
  Stethoscope,
  Trophy,
  XCircle,
} from 'lucide-react'
import { Palco } from '@/components/semiologia/caso-real'
import { AVISO_EDUCACIONAL } from '@/lib/acervos-licenciados'
import type { MidiaClinica } from '@/lib/semiologia/midia'
import type { QuestaoSemiologia } from '@/lib/semiologia/quiz-tipos'
import { ROTAS } from '@/lib/semiologia/rotas'

/** Questão já com a mídia resolvida no servidor. */
export interface QuestaoComMidia extends QuestaoSemiologia {
  midiaResolvida: { midia: MidiaClinica; src: string; credito: string } | null
  nomeDaFicha: string | null
}

interface Alternativa {
  texto: string
  certa: boolean
  porQue?: string
}

/** Embaralha de forma estável por questão: a posição da certa não segue padrão. */
function embaralhar(semente: string, itens: Alternativa[]): Alternativa[] {
  let h = 2166136261
  for (const ch of semente) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  const lista = [...itens]
  for (let i = lista.length - 1; i > 0; i -= 1) {
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    const j = Math.abs(h) % (i + 1)
    ;[lista[i], lista[j]] = [lista[j], lista[i]]
  }
  return lista
}

const LETRAS = ['A', 'B', 'C', 'D']
const ROTULO_MIDIA: Record<MidiaClinica['tipo'], string> = {
  imagem: 'Fotografia do caso',
  clipe: 'Clipe do caso',
  video: 'Vídeo do exame',
  audio: 'Ausculta gravada',
}

export function QuizSemiologia({
  titulo,
  descricao,
  questoes,
}: {
  titulo: string
  descricao: string
  questoes: QuestaoComMidia[]
}) {
  const [indice, setIndice] = useState(0)
  const [respostas, setRespostas] = useState<Record<string, number>>({})
  const [fim, setFim] = useState(false)

  const questao = questoes[indice]
  const alternativas = useMemo(
    () =>
      embaralhar(questao.id, [
        { texto: questao.achado, certa: true },
        ...questao.distratores.map((x) => ({ texto: x.nome, certa: false, porQue: x.porQue })),
      ]),
    [questao],
  )
  const escolha = respostas[questao.id]
  const respondeu = escolha !== undefined
  const acertou = respondeu && alternativas[escolha].certa
  const acertos = questoes.filter((q) => {
    const r = respostas[q.id]
    if (r === undefined) return false
    const alts = embaralhar(q.id, [{ texto: q.achado, certa: true }, ...q.distratores.map((x) => ({ texto: x.nome, certa: false }))])
    return alts[r].certa
  }).length

  const irPara = (i: number) => {
    setIndice(i)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (fim) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-border bg-card p-6 text-center sm:p-8">
          <Trophy className="mx-auto h-10 w-10 text-amber-500" />
          <h2 className="mt-3 font-heading text-2xl font-semibold">
            {acertos} de {questoes.length} acertos
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">Reveja os casos que errou: o comentário de cada alternativa é onde o raciocínio se fixa.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => { setRespostas({}); setFim(false); irPara(0) }} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">
              <RotateCcw className="h-4 w-4" /> Refazer
            </button>
            <Link href={ROTAS.quizzes} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Outros quizzes <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <ol className="mt-6 grid gap-2 sm:grid-cols-2">
          {questoes.map((q, i) => (
            <li key={q.id}>
              <button type="button" onClick={() => { setFim(false); irPara(i) }} className="w-full rounded-xl border border-border p-3 text-left text-sm hover:bg-muted/50">
                <span className="text-xs text-muted-foreground">Caso {i + 1}</span>
                <span className="block font-semibold">{q.veredito.split(':')[0]}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    )
  }

  // Antes da resposta, a mídia vai sem a legenda: ela nomeia o diagnóstico.
  const midiaVisivel = questao.midiaResolvida
    ? respondeu
      ? questao.midiaResolvida.midia
      : { ...questao.midiaResolvida.midia, legenda: ROTULO_MIDIA[questao.midiaResolvida.midia.tipo] }
    : null

  return (
    <div className="mx-auto max-w-6xl px-4 py-7 sm:py-10">
      <header className="mb-6">
        <Link href={ROTAS.quizzes} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Quizzes de semiologia
        </Link>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{titulo}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{descricao}</p>
        <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Progresso">
          {questoes.map((q, i) => {
            const r = respostas[q.id]
            const cor = r === undefined ? 'bg-muted' : 'bg-sky-500'
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => irPara(i)}
                aria-label={`Caso ${i + 1}`}
                aria-current={i === indice ? 'step' : undefined}
                className={`h-2 w-8 rounded-full transition ${cor} ${i === indice ? 'ring-2 ring-sky-500 ring-offset-2 ring-offset-background' : ''}`}
              />
            )
          })}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          {midiaVisivel && questao.midiaResolvida && (
            <figure className="overflow-hidden rounded-2xl border border-border bg-black">
              <Palco key={`${questao.id}-${respondeu}`} midia={midiaVisivel} src={questao.midiaResolvida.src} />
              <figcaption className="space-y-1.5 bg-card p-4">
                {respondeu ? (
                  <p className="text-sm leading-relaxed">{questao.midiaResolvida.midia.legenda}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {ROTULO_MIDIA[questao.midiaResolvida.midia.tipo]}. A legenda aparece depois da resposta.
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground/80">{questao.midiaResolvida.credito}</p>
              </figcaption>
            </figure>
          )}
          {respondeu && (
            <section className="rounded-2xl border border-sky-500/30 bg-sky-500/[0.05] p-5">
              <p className="flex items-center gap-2 font-clinical text-[10px] font-black uppercase tracking-widest text-sky-700 dark:text-sky-300">
                <Crosshair className="h-3.5 w-3.5" /> Apontamento: onde olhar
              </p>
              <p className="mt-2 text-sm leading-7 text-foreground/80">{questao.olhar}</p>
            </section>
          )}
          <p className="text-[11px] leading-relaxed text-muted-foreground/80">{AVISO_EDUCACIONAL}</p>
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <p className="flex items-center gap-2 font-clinical text-[10px] font-black uppercase tracking-widest text-sky-700 dark:text-sky-300">
              <Stethoscope className="h-3.5 w-3.5" /> Caso {indice + 1} de {questoes.length} · {questao.cenario}
            </p>
            <h2 className="mt-2 font-heading text-lg font-semibold leading-snug">{questao.identificacao}</h2>
            <dl className="mt-4 space-y-3 text-sm leading-7 text-foreground/80">
              <Bloco rotulo="Queixa principal">{questao.queixa}</Bloco>
              <Bloco rotulo="História da doença atual">{questao.historia}</Bloco>
              <Bloco rotulo="Antecedentes pessoais"><Lista itens={questao.antecedentes.pessoais} /></Bloco>
              {questao.antecedentes.gestacionais && (
                <Bloco rotulo="Gestação, parto e período neonatal"><Lista itens={questao.antecedentes.gestacionais} /></Bloco>
              )}
              <Bloco rotulo="História familiar e hereditária"><Lista itens={questao.antecedentes.familiares} /></Bloco>
              <Bloco rotulo="Hábitos e fatores de risco"><Lista itens={questao.antecedentes.habitos} /></Bloco>
              <div>
                <dt className="flex items-center gap-1.5 font-semibold text-foreground"><HeartPulse className="h-4 w-4 text-rose-500" /> Sinais vitais</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5 text-xs">
                  {[
                    ['PA', questao.vitais.pa],
                    ['FC', questao.vitais.fc],
                    ['FR', questao.vitais.fr],
                    ['SatO₂', questao.vitais.satO2],
                    ...(questao.vitais.temp ? [['T', questao.vitais.temp]] : []),
                  ].map(([r, v]) => (
                    <span key={r} className="rounded-lg border border-border bg-muted/50 px-2 py-1"><strong>{r}</strong> {v}</span>
                  ))}
                </dd>
              </div>
              <Bloco rotulo="Exame físico"><Lista itens={questao.exame} /></Bloco>
            </dl>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h3 className="font-heading text-lg font-semibold leading-snug">{questao.pergunta}</h3>
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
                      onClick={() => setRespostas((atual) => ({ ...atual, [questao.id]: i }))}
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
          </section>

          {respondeu && (
            <>
              <section className={`rounded-2xl border p-5 sm:p-6 ${acertou ? 'border-emerald-500/40 bg-emerald-500/[0.06]' : 'border-rose-500/40 bg-rose-500/[0.06]'}`}>
                <p className="text-xs font-black uppercase tracking-widest">{acertou ? 'Resposta certa' : 'Resposta errada'}</p>
                <p className="mt-1 font-heading text-base font-semibold">{questao.veredito}</p>
                <p className="mt-3 flex items-center gap-2 text-sm font-semibold"><Lightbulb className="h-4 w-4 text-amber-500" /> Por que é isso</p>
                <p className="mt-1 text-sm leading-7 text-foreground/80">{questao.explicacao}</p>
              </section>
              <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                <p className="text-sm font-semibold">Por que as outras alternativas não</p>
                <ul className="mt-2 space-y-2">
                  {alternativas.filter((alt) => !alt.certa).map((alt) => (
                    <li key={alt.texto} className="rounded-xl border border-border bg-muted/30 p-3 text-sm leading-6">
                      <strong className="font-semibold">{alt.texto}.</strong> <span className="text-foreground/75">{alt.porQue}</span>
                    </li>
                  ))}
                </ul>
              </section>
              <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                <p className="flex items-center gap-2 font-clinical text-[10px] font-black uppercase tracking-widest text-sky-700 dark:text-sky-300">
                  <ClipboardList className="h-3.5 w-3.5" /> Conduta
                </p>
                <p className="mt-2 text-sm leading-7 text-foreground/80">{questao.conduta}</p>
                {questao.nomeDaFicha && (
                  <Link href={ROTAS.sinal(questao.sinal)} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:underline dark:text-sky-300">
                    <BookOpen className="h-4 w-4" /> Estudar a ficha: {questao.nomeDaFicha}
                  </Link>
                )}
              </section>
            </>
          )}

          <nav className="flex items-center justify-between gap-2">
            <button type="button" disabled={indice === 0} onClick={() => irPara(indice - 1)} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-semibold disabled:opacity-40">
              <ArrowLeft className="h-4 w-4" /> Anterior
            </button>
            {indice < questoes.length - 1 ? (
              <button type="button" onClick={() => irPara(indice + 1)} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Próximo caso <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button type="button" onClick={() => setFim(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Ver resultado <Trophy className="h-4 w-4" />
              </button>
            )}
          </nav>
        </div>
      </div>
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

function Lista({ itens }: { itens: string[] }) {
  return (
    <ul className="mt-1 space-y-1">
      {itens.map((item) => (
        <li key={item} className="flex gap-2"><span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-sky-500" />{item}</li>
      ))}
    </ul>
  )
}
