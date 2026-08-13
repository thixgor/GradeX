'use client'

/**
 * A rodada do quiz: questão, resposta comentada e resultado.
 *
 * Separada da tela de configuração porque é só aqui que entra o conteúdo das
 * fichas — o dicionário de estruturas, os contextos regionais e o
 * classificador, que juntos pesam mais que todo o resto da seção. Escolher de
 * onde vêm as perguntas não precisa disso; responder, sim.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { PranchaInterativa } from '@/components/anatomia/prancha-interativa'
import { comentar, montarQuiz, type Comentario, type QuestaoQuiz } from '@/lib/atlas-anatomia/quiz'
import type { Ocorrencia } from '@/lib/atlas-anatomia/recorte-quiz'
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  ChevronRight,
  Lightbulb,
  RotateCcw,
  Target,
  Trophy,
  X,
} from 'lucide-react'

/** Realce de **negrito** sem trazer um interpretador de markdown para cá. */
function TextoRico({ texto, className = '' }: { texto: string; className?: string }) {
  const partes = texto.split(/(\*\*[^*]+\*\*)/g)
  return (
    <p className={className}>
      {partes.map((parte, indice) =>
        parte.startsWith('**') && parte.endsWith('**') ? (
          <strong key={indice} className="font-bold text-foreground">
            {parte.slice(2, -2)}
          </strong>
        ) : (
          <span key={indice}>{parte}</span>
        ),
      )}
    </p>
  )
}

interface Resposta {
  indice: number | null
  acertou: boolean
}

/* ══════════════════════════ Rodada ══════════════════════════ */

export default function Rodada({
  ocorrencias,
  sistemaSlug,
  regiao,
  quantidade,
  semente,
  onReconfigurar,
  onRefazer,
}: {
  /** Universo já carregado pela tela de configuração. */
  ocorrencias: Ocorrencia[]
  sistemaSlug: string | null
  regiao: string | null
  quantidade: number
  semente: number
  onReconfigurar: () => void
  onRefazer: () => void
}) {
  const questoes = useMemo(
    () => montarQuiz(ocorrencias, { sistemaSlug, regiao }, quantidade, semente),
    [ocorrencias, sistemaSlug, regiao, quantidade, semente],
  )

  const [atual, setAtual] = useState(0)
  const [respostas, setRespostas] = useState<Record<number, Resposta>>({})
  const [dicaAberta, setDicaAberta] = useState(false)
  const [encerrado, setEncerrado] = useState(false)

  const questao = questoes[atual]
  const resposta = respostas[atual]
  const respondida = resposta !== undefined

  const comentario: Comentario | null = useMemo(
    () => (questao && respondida ? comentar(questao, resposta.indice) : null),
    [questao, respondida, resposta],
  )

  const responder = useCallback(
    (indice: number) => {
      if (respondida || !questao) return
      setRespostas(anteriores => ({
        ...anteriores,
        [atual]: { indice, acertou: indice === questao.correta },
      }))
    },
    [atual, questao, respondida],
  )

  function avancar() {
    setDicaAberta(false)
    if (atual + 1 >= questoes.length) setEncerrado(true)
    else setAtual(atual + 1)
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [atual, encerrado])

  if (questoes.length === 0) {
    return (
      <main className="surface-page flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-heading text-lg font-semibold">Não deu para montar este quiz</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          O recorte escolhido tem estruturas de menos para formar alternativas plausíveis.
        </p>
        <button
          type="button"
          onClick={onReconfigurar}
          className="mt-1 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground"
        >
          Escolher outro recorte
        </button>
      </main>
    )
  }

  const acertos = Object.values(respostas).filter(item => item.acertou).length

  if (encerrado) {
    return (
      <Resultado
        questoes={questoes}
        respostas={respostas}
        acertos={acertos}
        onRefazer={onRefazer}
        onReconfigurar={onReconfigurar}
      />
    )
  }

  return (
    <main className="surface-page min-h-screen pb-8">
      {/* ── Progresso ── */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 py-2.5 pl-[3.75rem] pr-[9.75rem] sm:py-3 lg:pl-4">
          <button
            type="button"
            onClick={onReconfigurar}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-primary">Quiz de identificação</p>
              <p className="shrink-0 text-[11px] font-bold tabular-nums text-muted-foreground">
                {atual + 1}/{questoes.length} · {acertos} {acertos === 1 ? 'acerto' : 'acertos'}
              </p>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${((atual + (respondida ? 1 : 0)) / questoes.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-5 px-3 py-4 sm:px-4 sm:py-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-start">
        {/* ── Peça ── */}
        <section className="min-w-0 lg:sticky lg:top-[84px]">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {questao.ocorrencia.sistemaTitulo} · {questao.ocorrencia.colecaoTitulo}
          </p>
          <h1 className="mb-3 font-heading text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
            Que estrutura o marcador está apontando?
          </h1>

          {/* A prancha é quadrada; sem teto, ocupa a coluna inteira no desktop e
              empurra as alternativas para fora da tela. Quem quiser detalhe usa
              o zoom, que continua ali. */}
          <div className="mx-auto max-w-[620px]">
            <PranchaInterativa
              imagem={questao.ocorrencia.imagem}
              alt={`${questao.ocorrencia.colecaoTitulo}: ${questao.ocorrencia.pecaTitulo}`}
              marcadores={[questao.ocorrencia.marcador]}
              indiceAtivo={0}
              onSelecionar={() => undefined}
              modoEstudo={false}
              chaveDaPeca={`${questao.id}`}
              // O rótulo do pino entregaria a resposta; volta a aparecer depois.
              mostrarRotulos={respondida}
              prioridade
            />
          </div>
          <p className="mx-auto mt-2 max-w-[620px] text-xs text-muted-foreground">
            {questao.ocorrencia.pecaTitulo} · aproxime a peça se precisar olhar de perto.
          </p>
        </section>

        {/* ── Alternativas e comentário ── */}
        <section className="min-w-0">
          <div className="space-y-2">
            {questao.alternativas.map((alternativa, indice) => {
              const escolhida = resposta?.indice === indice
              const correta = indice === questao.correta
              const revelar = respondida && (correta || escolhida)

              return (
                <button
                  key={alternativa.texto}
                  type="button"
                  onClick={() => responder(indice)}
                  disabled={respondida}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition ${
                    revelar && correta
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : revelar
                        ? 'border-rose-500/50 bg-rose-500/10'
                        : respondida
                          ? 'border-border bg-card opacity-55'
                          : 'border-border bg-card hover:border-primary/45 hover:bg-primary/[0.06]'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                      revelar && correta
                        ? 'bg-emerald-500 text-white'
                        : revelar
                          ? 'bg-rose-500 text-white'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {revelar ? (
                      correta ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <X className="h-4 w-4" />
                      )
                    ) : (
                      'ABCD'[indice]
                    )}
                  </span>
                  <span className="min-w-0 flex-1 pt-0.5 text-sm font-semibold leading-snug">{alternativa.texto}</span>
                </button>
              )
            })}
          </div>

          {!respondida && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setDicaAberta(true)}
                disabled={dicaAberta}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-500/15 disabled:opacity-60 dark:text-amber-300"
              >
                <Lightbulb className="h-3.5 w-3.5" /> {dicaAberta ? 'Dica revelada' : 'Preciso de uma dica'}
              </button>
              {dicaAberta && (
                <p className="mt-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.07] p-3 text-[13px] leading-relaxed text-muted-foreground">
                  A estrutura marcada é <strong className="text-foreground">{questao.insight.classe.toLowerCase()}</strong>{' '}
                  na região de <strong className="text-foreground">{questao.insight.regiao.toLowerCase()}</strong>. Isso
                  já elimina o que não pertence a essa família.
                </p>
              )}
            </div>
          )}

          {comentario && (
            <>
              <RespostaComentada comentario={comentario} acertou={resposta.acertou} />
              <button
                type="button"
                onClick={avancar}
                className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.99]"
              >
                {atual + 1 >= questoes.length ? 'Ver o resultado' : 'Próxima questão'}
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </section>
      </div>
    </main>
  )
}

/* ══════════════════════════ Resposta comentada ══════════════════════════ */

function RespostaComentada({ comentario, acertou }: { comentario: Comentario; acertou: boolean }) {
  return (
    <article className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <header
        className={`flex items-start gap-3 border-b border-border p-4 ${
          acertou ? 'bg-emerald-500/[0.08]' : 'bg-rose-500/[0.07]'
        }`}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            acertou ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
          }`}
        >
          {acertou ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">Resposta comentada</p>
          <p className="mt-0.5 text-[13.5px] font-medium leading-relaxed text-foreground/90">{comentario.abertura}</p>
        </div>
      </header>

      <section className="border-b border-border/60 p-4">
        <TextoRico
          texto={comentario.identificacao}
          className="text-[13.5px] leading-relaxed text-foreground/85 sm:text-sm"
        />
      </section>

      {comentario.blocos.map(bloco => (
        <section key={bloco.titulo} className="border-b border-border/60 px-4 py-3.5">
          <h3 className="mb-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-primary">{bloco.titulo}</h3>
          <p className="text-[13.5px] leading-relaxed text-foreground/85 sm:text-sm">{bloco.texto}</p>
        </section>
      ))}

      <section className="border-b border-border/60 px-4 py-3.5">
        <h3 className="mb-2.5 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-muted-foreground">
          <BookOpen className="h-3.5 w-3.5 text-primary" /> Alternativa por alternativa
        </h3>
        <ul className="space-y-2.5">
          {comentario.alternativas.map((alternativa, indice) => (
            <li key={alternativa.texto} className="flex gap-2.5">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-black ${
                  alternativa.correta
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {'ABCD'[indice]}
              </span>
              <p className="min-w-0 text-[13px] leading-relaxed text-muted-foreground">
                <strong className={alternativa.correta ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground'}>
                  {alternativa.texto}.
                </strong>{' '}
                {alternativa.comentario}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-muted/30 px-4 py-3.5">
        <p className="text-[13px] leading-relaxed text-foreground/85">
          <Award className="mr-1.5 inline h-4 w-4 text-primary" />
          {comentario.fechamento}
        </p>
      </section>
    </article>
  )
}

/* ══════════════════════════ Resultado ══════════════════════════ */

function Resultado({
  questoes,
  respostas,
  acertos,
  onRefazer,
  onReconfigurar,
}: {
  questoes: QuestaoQuiz[]
  respostas: Record<number, Resposta>
  acertos: number
  onRefazer: () => void
  onReconfigurar: () => void
}) {
  const total = questoes.length
  const percentual = Math.round((acertos / total) * 100)
  const erradas = questoes.filter((_, indice) => respostas[indice] && !respostas[indice].acertou)

  const recado =
    percentual >= 90
      ? 'Domínio de peça. Nesse patamar, o ganho está em fechar as regiões que você ainda não treinou.'
      : percentual >= 70
        ? 'Base sólida. O que falta é justamente o tipo de estrutura que você errou aqui embaixo — vale voltar nelas na prancha.'
        : percentual >= 40
          ? 'Dá para melhorar rápido: quase sempre o que falta é ler a posição na peça antes de tentar lembrar o nome.'
          : 'Sem drama — identificar estrutura é treino. Abra as pranchas dessa região no Atlas e refaça o quiz depois.'

  return (
    <main className="surface-page min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-sm sm:p-9">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Trophy className="h-7 w-7" />
          </span>
          <p className="mt-4 font-heading text-5xl font-semibold tabular-nums tracking-tight sm:text-6xl">
            {acertos}
            <span className="text-2xl text-muted-foreground sm:text-3xl">/{total}</span>
          </p>
          <p className="mt-1 text-sm font-bold text-primary">{percentual}% de acerto</p>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">{recado}</p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onRefazer}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
            >
              <RotateCcw className="h-4 w-4" /> Nova rodada
            </button>
            <button
              type="button"
              onClick={onReconfigurar}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-bold transition hover:bg-muted"
            >
              Trocar o recorte
            </button>
          </div>
        </div>

        {erradas.length > 0 && (
          <section className="mt-6 rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 text-sm font-bold">Estruturas para revisar</h2>
            <ul className="space-y-1.5">
              {erradas.map(questao => (
                <li key={questao.id}>
                  <Link
                    href={`/anatomia/atlas-anatomia?sistema=${questao.ocorrencia.sistemaSlug}&colecao=${questao.ocorrencia.colecaoSlug}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5 transition hover:border-primary/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold">
                        {questao.ocorrencia.marcador.title}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {questao.ocorrencia.sistemaTitulo} · {questao.ocorrencia.colecaoTitulo}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  )
}
