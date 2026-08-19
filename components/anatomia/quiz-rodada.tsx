'use client'

/**
 * A rodada do quiz: questão, resposta comentada e resultado.
 *
 * Separada da tela de configuração porque é só aqui que entra o conteúdo das
 * fichas — o dicionário de estruturas, os contextos regionais e o
 * classificador, que juntos pesam mais que todo o resto da seção. Escolher de
 * onde vêm as perguntas não precisa disso; responder, sim.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { PranchaInterativa } from '@/components/anatomia/prancha-interativa'
import { holdScrollAtTop } from '@/components/scroll-to-top'
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
  sistemas,
  regioes,
  quantidade,
  semente,
  onReconfigurar,
  onRefazer,
}: {
  /** Universo já carregado pela tela de configuração. */
  ocorrencias: Ocorrencia[]
  sistemas: string[]
  regioes: string[]
  quantidade: number
  semente: number
  onReconfigurar: () => void
  onRefazer: () => void
}) {
  const questoes = useMemo(
    () => montarQuiz(ocorrencias, { sistemas, regioes }, quantidade, semente),
    // As listas vêm da URL e são recriadas a cada render; a chave estável é o
    // conteúdo delas, não a identidade do array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ocorrencias, sistemas.join(','), regioes.join(','), quantidade, semente],
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

  /**
   * Volta ao topo a cada questão.
   *
   * `window.scrollTo({ behavior: 'smooth' })` não dava conta: quem responde
   * termina lá embaixo, no fim do comentário, e a questão seguinte nasce curta
   * — sem comentário e com a prancha ainda carregando. O navegador prende o
   * scroll no fim desse documento curto e cancela a rolagem suave quando a
   * imagem entra e muda o layout. Resultado: a tela ficava exatamente onde
   * estava, no rodapé. `holdScrollAtTop` sobe na hora e segura por alguns
   * quadros, até a página crescer — e solta ao primeiro gesto de rolagem.
   */
  useEffect(() => holdScrollAtTop(), [atual, encerrado])

  /**
   * Assim que a resposta é marcada, o veredito entra em cena.
   *
   * No celular as alternativas ocupam a tela inteira: sem isto, o comentário
   * nasce abaixo da dobra e a pessoa não vê nem se acertou.
   */
  const comentarioRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!respondida) return
    const id = window.requestAnimationFrame(() =>
      comentarioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    )
    return () => window.cancelAnimationFrame(id)
  }, [respondida, atual])

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
    <main className="surface-page anatomia-ambiente min-h-screen pb-8">
      {/* ── Progresso ── */}
      <header className="anatomia-barra sticky top-0 z-40">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 py-2.5 pl-[3.75rem] pr-[9.75rem] sm:py-3 lg:pl-4">
          <button
            type="button"
            onClick={onReconfigurar}
            className="tecla flex h-9 shrink-0 items-center gap-1.5 px-2.5 text-xs font-semibold text-muted-foreground"
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
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-foreground/[0.08]">
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
                  className={`vidro relevo flex w-full items-start gap-3 rounded-[22px] p-3.5 text-left transition ${
                    revelar && correta
                      ? '!border-emerald-500/50 !bg-emerald-500/15'
                      : revelar
                        ? '!border-rose-500/50 !bg-rose-500/15'
                        : respondida
                          ? 'opacity-55'
                          : 'relevo-toca hover:!border-primary/45'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                      revelar && correta
                        ? 'bg-emerald-500 text-white'
                        : revelar
                          ? 'bg-rose-500 text-white'
                          : 'bg-foreground/[0.07] text-muted-foreground'
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
                className="tecla inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-700 disabled:opacity-60 dark:text-amber-300"
              >
                <Lightbulb className="h-3.5 w-3.5" /> {dicaAberta ? 'Dica revelada' : 'Preciso de uma dica'}
              </button>
              {dicaAberta && (
                <p className="vidro mt-2 rounded-2xl !border-amber-500/25 !bg-amber-500/[0.09] p-3 text-[13px] leading-relaxed text-muted-foreground">
                  A estrutura marcada é <strong className="text-foreground">{questao.insight.classe.toLowerCase()}</strong>{' '}
                  na região de <strong className="text-foreground">{questao.insight.regiao.toLowerCase()}</strong>. Isso
                  já elimina o que não pertence a essa família.
                </p>
              )}
            </div>
          )}

          {comentario && (
            <>
              <div ref={comentarioRef} className="scroll-mt-[68px] sm:scroll-mt-[76px]">
                <RespostaComentada comentario={comentario} acertou={resposta.acertou} />
              </div>
              {/* Grudado no rodapé enquanto o comentário rola.
                  A resposta comentada é longa de propósito — é ela que ensina —,
                  mas com o botão só no fim era preciso percorrer tudo para poder
                  seguir. Agora ele acompanha a leitura: quem quiser ler até a
                  última linha lê, quem já entendeu avança de onde estiver. */}
              <div className="sticky bottom-0 z-30 -mx-3 mt-3 px-3 pb-3 pt-2 sm:-mx-4 sm:px-4 lg:mx-0 lg:px-0">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/95 to-transparent" />
                <button
                  type="button"
                  onClick={avancar}
                  className="relative inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90 active:scale-[0.99]"
                >
                  {atual + 1 >= questoes.length ? 'Ver o resultado' : 'Próxima questão'}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
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
    <article className="vidro relevo mt-4 overflow-hidden rounded-[22px]">
      <header
        className={`flex items-start gap-3 border-b border-border/60 p-4 ${
          acertou ? 'bg-emerald-500/[0.12]' : 'bg-rose-500/[0.1]'
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

      <section className="bg-foreground/[0.035] px-4 py-3.5">
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
    <main className="surface-page anatomia-ambiente min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="vidro vidro-brilho relevo rounded-[28px] p-6 text-center sm:p-9">
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
              className="tecla inline-flex h-11 items-center justify-center gap-2 px-5 text-sm font-bold"
            >
              Trocar o recorte
            </button>
          </div>
        </div>

        {erradas.length > 0 && (
          <section className="vidro relevo mt-6 rounded-[22px] p-5">
            <h2 className="mb-3 text-sm font-bold">Estruturas para revisar</h2>
            <ul className="space-y-1.5">
              {erradas.map(questao => (
                <li key={questao.id}>
                  <Link
                    href={`/anatomia/atlas-anatomia?sistema=${questao.ocorrencia.sistemaSlug}&colecao=${questao.ocorrencia.colecaoSlug}`}
                    className="vidro-pastilha group flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5"
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
