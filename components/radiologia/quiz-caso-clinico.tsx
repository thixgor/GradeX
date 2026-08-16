'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  ClipboardList,
  Contrast,
  Crosshair,
  Eye,
  EyeOff,
  Flame,
  Gauge,
  HeartPulse,
  Layers,
  ListChecks,
  Microscope,
  Ruler,
  Scale,
  ScanLine,
  Stethoscope,
  Target,
  Trophy,
  User,
  X,
} from 'lucide-react'
import { holdScrollAtTop } from '@/components/scroll-to-top'
import type { VinhetaClinica } from '@/lib/radiologia/casos-clinicos'
import type { AchadoMarcado, TipoMarcacao } from '@/lib/radiologia/casos-raio-x-detalhes'
import type { ImagemCasoRaioX } from '@/lib/radiologia/casos-raio-x'
import type {
  QuestaoCasoClinico,
  QuizCasoClinico,
  ResumoQuizClinico,
} from '@/lib/radiologia/quiz-casos-raio-x'

/**
 * Runner do quiz de casos clínicos.
 *
 * A tela reproduz a ordem de uma consulta de verdade, e é essa ordem que faz o
 * exercício valer: primeiro o prontuário — identificação, queixa, história,
 * antecedentes, sinais vitais, exame físico e o motivo do pedido —, depois o
 * filme **limpo** no negatoscópio, depois a resposta. Só quando o aluno se
 * compromete com uma alternativa é que a metade marcada do filme acende, com as
 * marcações comentadas uma a uma e a resposta aprofundada ao lado.
 *
 * ## O que este componente não faz
 *
 * Ele não decide gabarito, não escolhe distrator e não escreve comentário: tudo
 * chega pronto de `lib/radiologia/quiz-casos-raio-x.ts`, montado no servidor. O
 * que é do cliente é o que depende do aluno — o sorteio da rodada, o teclado, a
 * contagem de acertos e o recorde guardado no navegador.
 *
 * ## Por que o sorteio só acontece depois do "começar"
 *
 * A página é estática e este componente também renderiza no servidor. Sortear
 * durante a montagem faria o HTML e a hidratação discordarem sobre qual é o
 * primeiro caso. A tela de abertura resolve sem truque: até o clique existe
 * apenas o cartão de apresentação; a rodada nasce já no navegador.
 */

const CHAVE_RECORDE = (slug: string) => `rx-quiz-clinico:${slug}`

interface Recorde {
  melhor: number
  rodadas: number
  em: string
}

type Fase = 'abertura' | 'rodada' | 'resultado'

/** Tamanhos de rodada oferecidos — só aparecem quando há casos de sobra. */
const TAMANHOS = [5, 10, 20] as const

export interface QuizCasoClinicoViewProps {
  quiz: QuizCasoClinico
  /** Outros capítulos, para o fim da rodada não ser um beco. */
  irmaos: ResumoQuizClinico[]
}

export function QuizCasoClinicoView({ quiz, irmaos }: QuizCasoClinicoViewProps) {
  const [fase, setFase] = useState<Fase>('abertura')
  const [rodada, setRodada] = useState<QuestaoCasoClinico[]>([])
  const [indice, setIndice] = useState(0)
  const [respostas, setRespostas] = useState<(number | null)[]>([])
  const [tamanho, setTamanho] = useState<number>(() => Math.min(10, quiz.questoes.length))
  const [recorde, setRecorde] = useState<Recorde | null>(null)

  useEffect(() => {
    try {
      const bruto = window.localStorage.getItem(CHAVE_RECORDE(quiz.slug))
      if (bruto) setRecorde(JSON.parse(bruto) as Recorde)
    } catch {
      // Navegador com armazenamento bloqueado: o quiz funciona sem recorde.
    }
  }, [quiz.slug])

  const comecar = useCallback((questoes: QuestaoCasoClinico[]) => {
    setRodada(questoes)
    setRespostas(Array(questoes.length).fill(null))
    setIndice(0)
    setFase('rodada')
    holdScrollAtTop()
  }, [])

  const sortear = useCallback(() => {
    const baralho = [...quiz.questoes]
    for (let i = baralho.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[baralho[i], baralho[j]] = [baralho[j], baralho[i]]
    }
    comecar(baralho.slice(0, Math.min(tamanho, baralho.length)))
  }, [comecar, quiz.questoes, tamanho])

  const questao = rodada[indice]
  const escolhida = respostas[indice] ?? null

  const responder = useCallback(
    (posicao: number) => {
      setRespostas((atuais) => {
        if (atuais[indice] !== null) return atuais
        const proximas = [...atuais]
        proximas[indice] = posicao
        return proximas
      })
    },
    [indice],
  )

  /**
   * Passa de caso e devolve a tela ao topo.
   *
   * `scrollIntoView({ behavior: 'smooth' })` falha justamente aqui: quem termina
   * de ler um comentário longo está no fim do documento, e o caso seguinte nasce
   * curto — o navegador prende o scroll e cancela a rolagem suave quando a
   * radiografia entra e o layout cresce. `holdScrollAtTop` sobe na hora e segura
   * até a página crescer, soltando ao primeiro gesto de rolagem.
   */
  const avancar = useCallback(() => {
    if (indice + 1 >= rodada.length) {
      setFase('resultado')
      holdScrollAtTop()
      return
    }
    setIndice((atual) => atual + 1)
    holdScrollAtTop()
  }, [indice, rodada.length])

  const acertos = useMemo(
    () =>
      rodada.reduce(
        (total, item, posicao) => total + (respostas[posicao] === item.correta ? 1 : 0),
        0,
      ),
    [rodada, respostas],
  )
  const percentual = rodada.length > 0 ? Math.round((acertos / rodada.length) * 100) : 0

  // O recorde é gravado na saída da rodada, e não a cada resposta: o que
  // interessa é o resultado fechado, e escrever a cada clique é ruído.
  useEffect(() => {
    if (fase !== 'resultado' || rodada.length === 0) return
    const proximo: Recorde = {
      melhor: Math.max(percentual, recorde?.melhor ?? 0),
      rodadas: (recorde?.rodadas ?? 0) + 1,
      em: new Date().toISOString(),
    }
    setRecorde(proximo)
    try {
      window.localStorage.setItem(CHAVE_RECORDE(quiz.slug), JSON.stringify(proximo))
    } catch {
      // Sem armazenamento: o resultado desta rodada continua na tela.
    }
    // `recorde` fica de fora de propósito: entrar nas dependências reabriria o
    // efeito a cada gravação e o recorde se reescreveria em laço.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, percentual, quiz.slug, rodada.length])

  // Atalhos de teclado: responder por número ou letra e seguir adiante sem
  // tirar a mão do teclado.
  useEffect(() => {
    if (fase !== 'rodada' || !questao) return
    const aoTeclar = (evento: KeyboardEvent) => {
      const alvo = evento.target as HTMLElement | null
      if (alvo && (/^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName) || alvo.isContentEditable)) return
      if (evento.metaKey || evento.ctrlKey || evento.altKey) return

      const tecla = evento.key.toLowerCase()
      const porNumero = Number.parseInt(tecla, 10) - 1
      const porLetra = 'abcd'.indexOf(tecla)
      const posicao = Number.isNaN(porNumero) ? porLetra : porNumero

      if (posicao >= 0 && posicao < questao.alternativas.length) {
        evento.preventDefault()
        responder(posicao)
        return
      }
      if ((tecla === 'enter' || evento.key === 'ArrowRight') && respostas[indice] !== null) {
        evento.preventDefault()
        avancar()
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [avancar, fase, indice, questao, respostas, responder])

  const erradas = useMemo(
    () => rodada.filter((item, posicao) => respostas[posicao] !== item.correta),
    [rodada, respostas],
  )

  return (
    <div className="rx surface-page min-h-screen">
      <CabecalhoQuiz quiz={quiz} />

      <main className="container mx-auto max-w-6xl px-4 pb-16 pt-6">
        {fase === 'abertura' && (
          <Abertura
            quiz={quiz}
            recorde={recorde}
            tamanho={tamanho}
            onTamanho={setTamanho}
            onComecar={sortear}
          />
        )}

        {fase === 'rodada' && questao && (
          <Rodada
            key={questao.id}
            questao={questao}
            indice={indice}
            total={rodada.length}
            acertos={acertos}
            escolhida={escolhida}
            proxima={rodada[indice + 1]}
            onResponder={responder}
            onAvancar={avancar}
          />
        )}

        {fase === 'resultado' && (
          <Resultado
            rodada={rodada}
            respostas={respostas}
            acertos={acertos}
            percentual={percentual}
            recorde={recorde}
            irmaos={irmaos}
            onRefazer={sortear}
            onRefazerErros={erradas.length > 0 ? () => comecar(erradas) : undefined}
          />
        )}
      </main>
    </div>
  )
}

/* ─────────────────────────────── Cabeçalho ─────────────────────────────── */

function CabecalhoQuiz({ quiz }: { quiz: QuizCasoClinico }) {
  return (
    <header className="rx-painel rx-grade relative overflow-hidden border-b border-sky-400/15">
      <div className="container relative mx-auto max-w-6xl px-4 pb-5 pt-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <Link
            href="/manual-clinico/radiologia/raio-x/casos/quiz"
            className="-m-1 inline-flex items-center gap-1.5 rounded p-1 text-sky-100/55 transition hover:text-sky-100"
          >
            <ArrowLeft className="h-4 w-4" /> Casos clínicos
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-sky-100/25" />
          <Link
            href="/manual-clinico/radiologia/raio-x/casos"
            className="-m-1 rounded p-1 text-sky-100/55 transition hover:text-sky-100"
          >
            Ver o atlas de alterações
          </Link>
        </div>

        <div className="mt-4">
          <p className="editorial-mark !text-sky-300/80 [&::before]:bg-sky-300/60">
            Leia o caso · identifique o achado · {quiz.subtitulo}
          </p>
          <h1 className="mt-1.5 font-heading text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {quiz.titulo}
            <span className="ml-2.5 inline-flex translate-y-[-2px] items-center rounded-full border border-sky-300/30 bg-sky-400/10 px-2.5 py-0.5 align-middle font-clinical text-[11px] font-bold uppercase tracking-widest text-sky-200">
              {quiz.total} {quiz.total === 1 ? 'caso' : 'casos'}
            </span>
          </h1>
        </div>
      </div>
    </header>
  )
}

/* ──────────────────────────────── Abertura ──────────────────────────────── */

function Abertura({
  quiz,
  recorde,
  tamanho,
  onTamanho,
  onComecar,
}: {
  quiz: QuizCasoClinico
  recorde: Recorde | null
  tamanho: number
  onTamanho: (valor: number) => void
  onComecar: () => void
}) {
  const opcoes = [...TAMANHOS.filter((valor) => valor < quiz.total), quiz.total]

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:items-start">
      <section className="rx-entra rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <p className="text-sm leading-relaxed text-muted-foreground">{quiz.descricao}</p>

        {quiz.pergunta && (
          <p className="mt-4 rounded-xl border border-sky-500/25 bg-sky-500/[0.06] p-3.5 text-[13px] leading-relaxed">
            <span className="font-bold">A pergunta deste capítulo: </span>
            {quiz.pergunta}
          </p>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Instrucao icone={ClipboardList} titulo="A consulta vem antes do filme">
            Cada caso abre com o prontuário completo: quem é o paciente, o que ele conta, o que ele
            já tem, os sinais vitais, o exame físico e por que a radiografia foi pedida.
          </Instrucao>
          <Instrucao icone={EyeOff} titulo="O filme sobe limpo">
            Nenhuma seta, nenhum círculo — é o que chega no negatoscópio. As marcações só acendem
            depois que você se compromete com uma resposta.
          </Instrucao>
          <Instrucao icone={Crosshair} titulo="Você responde o achado">
            Quatro alternativas, todas plausíveis para aquela história. As erradas são os erros que
            aquele quadro clínico realmente convida a cometer.
          </Instrucao>
          <Instrucao icone={Microscope} titulo="A resposta é aprofundada">
            Correlação clínico-radiológica, mecanismo da imagem, estrutura por estrutura, sinais,
            armadilhas, conduta e por que cada alternativa errada não era.
          </Instrucao>
        </div>

        <div className="mt-6 border-t border-border pt-5">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Tamanho da rodada
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {opcoes.map((valor) => (
              <button
                key={valor}
                type="button"
                onClick={() => onTamanho(valor)}
                aria-pressed={tamanho === valor}
                className={`rounded-full border px-4 py-1.5 text-xs font-bold transition ${
                  tamanho === valor
                    ? 'border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300'
                    : 'border-border bg-muted/20 hover:border-sky-500/40'
                }`}
              >
                {valor === quiz.total ? `Todos (${valor})` : `${valor} casos`}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Os casos são sorteados a cada rodada. Leia a consulta inteira antes de olhar o filme —
            é assim que a radiografia deve ser lida.
          </p>

          <button
            type="button"
            onClick={onComecar}
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-sky-500 px-6 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-600 active:scale-[0.98]"
          >
            Começar o plantão <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <aside className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-2xl border border-sky-500/25 bg-black shadow-sm">
          <FilmeSprite imagem={quiz.capa} marcado={false} className="w-full" />
        </div>

        {recorde && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Seu histórico neste quiz
            </p>
            <p className="mt-2 font-heading text-2xl font-semibold tracking-tight">
              {recorde.melhor}%
              <span className="ml-2 align-middle font-clinical text-[11px] font-normal text-muted-foreground">
                melhor de {recorde.rodadas} {recorde.rodadas === 1 ? 'rodada' : 'rodadas'}
              </span>
            </p>
          </div>
        )}

        <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.04] p-4 text-xs leading-relaxed text-muted-foreground">
          <p className="font-bold text-foreground">Escopo educacional</p>
          <p className="mt-1">
            Os pacientes são fictícios e as apresentações seguem o que a literatura descreve para
            cada alteração. Material de estudo: não substitui laudo, avaliação clínica, protocolo
            institucional nem a escolha do método de imagem adequado a cada pergunta.
          </p>
        </div>
      </aside>
    </div>
  )
}

function Instrucao({
  icone: Icone,
  titulo,
  children,
}: {
  icone: typeof Target
  titulo: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3.5">
      <p className="flex items-center gap-2 text-[13px] font-bold leading-tight">
        <Icone className="h-4 w-4 shrink-0 text-sky-500" />
        {titulo}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{children}</p>
    </div>
  )
}

/* ───────────────────────────────── Rodada ───────────────────────────────── */

function Rodada({
  questao,
  indice,
  total,
  acertos,
  escolhida,
  proxima,
  onResponder,
  onAvancar,
}: {
  questao: QuestaoCasoClinico
  indice: number
  total: number
  acertos: number
  escolhida: number | null
  proxima?: QuestaoCasoClinico
  onResponder: (posicao: number) => void
  onAvancar: () => void
}) {
  const respondeu = escolhida !== null
  const acertou = escolhida === questao.correta
  const [marcado, setMarcado] = useState(false)
  const [revelacao, setRevelacao] = useState(0)

  /** Responder acende a metade marcada do filme — é o momento didático do caso. */
  useEffect(() => {
    if (!respondeu) return
    setMarcado(true)
    setRevelacao((n) => n + 1)
  }, [respondeu])

  /**
   * Assim que a alternativa é marcada, o comentário entra em cena.
   *
   * No celular o negatoscópio ocupa meia tela e as alternativas o resto: sem
   * isto, o veredito nasce abaixo da dobra e a pessoa não vê nem se acertou.
   */
  const comentarioRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!respondeu) return
    const id = window.requestAnimationFrame(() =>
      comentarioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    )
    return () => window.cancelAnimationFrame(id)
  }, [respondeu])

  return (
    <div className="flex flex-col gap-5">
      {/* ── Progresso ── */}
      <div className="flex items-center justify-between gap-3">
        <span className="font-clinical text-[11px] uppercase tracking-widest text-muted-foreground">
          Caso {String(indice + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}
        </span>
        <span className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
          <span
            className="block h-full rounded-full bg-sky-500 transition-[width] duration-500 ease-out"
            style={{ width: `${((indice + (respondeu ? 1 : 0)) / total) * 100}%` }}
          />
        </span>
        <span className="inline-flex items-center gap-1.5 font-clinical text-[11px] font-bold text-sky-600 dark:text-sky-400">
          <Flame className="h-3.5 w-3.5" /> {acertos} {acertos === 1 ? 'acerto' : 'acertos'}
        </span>
      </div>

      {/* ── Prontuário ── */}
      <Prontuario vinheta={questao.vinheta} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,1fr)] lg:items-start">
        {/* ── Negatoscópio ── */}
        <div className="-mx-4 lg:sticky lg:top-4 lg:mx-0">
          <Negatoscopio
            imagem={questao.imagem}
            marcado={marcado}
            revelacao={revelacao}
            respondeu={respondeu}
            marcacoes={questao.comentario.marcacoes}
            onAlternar={() => {
              setMarcado((atual) => {
                if (!atual) setRevelacao((n) => n + 1)
                return !atual
              })
            }}
          />

          {/* Aquece o filme seguinte enquanto o aluno lê o comentário: o próximo
              caso nasce com a radiografia já no cache. O invólucro de altura
              zero tira a imagem do fluxo sem usar `display: none`, que em
              vários navegadores adia o download em vez de antecipá-lo. */}
          {proxima && (
            <span aria-hidden className="pointer-events-none block h-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" src={proxima.imagem.sprite} loading="eager" decoding="async" />
            </span>
          )}
        </div>

        {/* ── Pergunta, alternativas e comentário ── */}
        <div className="flex min-w-0 flex-col gap-4">
          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-semibold leading-relaxed sm:text-lg">
              {questao.vinheta.pergunta}
            </h2>

            <div className="mt-4 space-y-2">
              {questao.alternativas.map((alternativa, posicao) => {
                const correta = posicao === questao.correta
                const marcada = escolhida === posicao
                let estilo = 'border-border bg-muted/25 hover:border-sky-500/50 hover:bg-muted/50'
                if (respondeu && correta) estilo = 'border-emerald-500/50 bg-emerald-500/10'
                else if (respondeu && marcada) estilo = 'border-rose-500/50 bg-rose-500/10'
                else if (respondeu) estilo = 'border-border bg-muted/20 opacity-55'

                return (
                  <button
                    key={alternativa.id}
                    type="button"
                    onClick={() => onResponder(posicao)}
                    disabled={respondeu}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${estilo} ${
                      respondeu ? 'cursor-default' : 'active:scale-[0.995]'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                        respondeu && correta
                          ? 'bg-emerald-500 text-white'
                          : respondeu && marcada
                            ? 'bg-rose-500 text-white'
                            : 'bg-muted-foreground/15 text-muted-foreground'
                      }`}
                    >
                      {respondeu && correta ? (
                        <Check className="h-3 w-3" />
                      ) : respondeu && marcada ? (
                        <X className="h-3 w-3" />
                      ) : (
                        String.fromCharCode(65 + posicao)
                      )}
                    </span>
                    <span className="min-w-0 text-sm font-medium leading-snug">
                      {alternativa.nome}
                    </span>
                  </button>
                )
              })}
            </div>

            {!respondeu && (
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                Dica de método: antes de escolher, releia o que o exame físico encontrou e procure
                no filme a confirmação daquele achado — a imagem responde à pergunta clínica, não o
                contrário.
              </p>
            )}
          </section>

          {respondeu && (
            <>
              <div ref={comentarioRef} className="scroll-mt-3">
                <Comentario questao={questao} acertou={acertou} escolhida={escolhida} />
              </div>

              {/* Grudada no rodapé enquanto o comentário rola: ele é longo de
                  propósito — é ele que ensina —, mas com o botão só no fim era
                  preciso percorrer tudo para poder seguir. */}
              <div className="sticky bottom-0 z-30 -mx-4 px-4 pb-3 pt-2 lg:mx-0 lg:px-0">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/95 to-transparent" />
                <div className="relative flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={onAvancar}
                    className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-sky-500 px-4 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-600 active:scale-[0.98]"
                  >
                    {indice + 1 >= total ? 'Ver resultado' : 'Próximo caso'}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <Link
                    href={questao.atalho}
                    prefetch={false}
                    className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 text-xs font-bold transition hover:border-sky-500/50 hover:bg-muted"
                  >
                    Abrir no atlas <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────── Prontuário ─────────────────────────────── */

/**
 * A consulta, apresentada como consulta.
 *
 * Blocos na ordem em que a anamnese acontece — identificação, queixa, história,
 * antecedentes, vitais, exame físico e o motivo do pedido. O aluno precisa
 * conseguir voltar a qualquer um deles enquanto olha o filme, então nada aqui
 * fica escondido atrás de um clique.
 */
function Prontuario({ vinheta }: { vinheta: VinhetaClinica }) {
  return (
    <section
      aria-label="Prontuário do caso"
      className="rx-entra overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/25 px-4 py-2.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
          <Stethoscope className="h-3 w-3" /> {vinheta.cenario}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[13px] font-bold">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          {vinheta.identificacao}
        </span>
      </div>

      <div className="grid gap-x-6 gap-y-4 p-4 sm:p-5 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <Rotulo>Queixa e duração</Rotulo>
          <p className="mt-1 text-[15px] font-semibold leading-snug">{vinheta.queixa}</p>
        </div>

        <div className="lg:col-span-2">
          <Rotulo>História da doença atual</Rotulo>
          <p className="mt-1 text-[13px] leading-relaxed text-foreground/85">{vinheta.historia}</p>
        </div>

        <div>
          <Rotulo>Antecedentes e hábitos</Rotulo>
          <ul className="mt-1.5 space-y-1">
            {vinheta.antecedentes.map((item) => (
              <li key={item} className="flex gap-2 text-[13px] leading-relaxed text-foreground/85">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-sky-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <Rotulo>Exame físico</Rotulo>
          <ul className="mt-1.5 space-y-1">
            {vinheta.exame.map((item) => (
              <li key={item} className="flex gap-2 text-[13px] leading-relaxed text-foreground/85">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2">
          <Rotulo>
            <Gauge className="mr-1 inline h-3 w-3 align-[-1px]" /> Sinais vitais
          </Rotulo>
          <dl className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-5">
            <Vital rotulo="PA" valor={vinheta.vitais.pa} />
            <Vital rotulo="FC" valor={vinheta.vitais.fc} />
            <Vital rotulo="FR" valor={vinheta.vitais.fr} />
            <Vital rotulo="SatO₂" valor={vinheta.vitais.satO2} destaque />
            {vinheta.vitais.temp && <Vital rotulo="Temp" valor={vinheta.vitais.temp} />}
          </dl>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border border-sky-500/25 bg-sky-500/[0.06] p-3.5">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
              <ScanLine className="h-3.5 w-3.5" /> Por que a radiografia foi pedida
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/85">
              {vinheta.pedido}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  )
}

function Vital({
  rotulo,
  valor,
  destaque = false,
}: {
  rotulo: string
  valor: string
  destaque?: boolean
}) {
  return (
    <div
      className={`rounded-lg border px-2.5 py-1.5 ${
        destaque ? 'border-sky-500/30 bg-sky-500/[0.07]' : 'border-border bg-muted/25'
      }`}
    >
      <dt className="font-clinical text-[9px] font-black uppercase tracking-wider text-muted-foreground">
        {rotulo}
      </dt>
      <dd className="mt-0.5 font-clinical text-[12px] font-bold leading-tight tabular-nums">
        {valor}
      </dd>
    </div>
  )
}

/* ───────────────────────────── Negatoscópio ───────────────────────────── */

/**
 * O filme, em duas metades do mesmo sprite.
 *
 * Cada imagem do acervo é um sprite de dois quadros lado a lado: à esquerda a
 * radiografia limpa, à direita a mesma radiografia com as marcações. Trocar de
 * uma para a outra é mover o `background-position` — sem segunda requisição,
 * sem salto de layout e com alinhamento pixel a pixel garantido.
 */
function Negatoscopio({
  imagem,
  marcado,
  revelacao,
  respondeu,
  marcacoes,
  onAlternar,
}: {
  imagem: ImagemCasoRaioX
  marcado: boolean
  revelacao: number
  respondeu: boolean
  marcacoes: AchadoMarcado[]
  onAlternar: () => void
}) {
  const [invertido, setInvertido] = useState(false)
  const [realce, setRealce] = useState(false)

  const filtro = useMemo(() => {
    const partes: string[] = []
    if (invertido) partes.push('invert(1)')
    if (realce) partes.push('contrast(1.45) brightness(1.12)')
    return partes.length ? partes.join(' ') : undefined
  }, [invertido, realce])

  const temMarcacoes = marcacoes.length > 0

  return (
    <section className="overflow-hidden border-y border-sky-400/20 bg-[#05070d] shadow-2xl shadow-black/40 lg:rounded-2xl lg:border">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.02] px-3 py-2 text-white">
        <span className="inline-flex min-w-0 items-center gap-2 font-clinical text-[10px] uppercase tracking-widest text-sky-300/80">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-400" />
          </span>
          <span className="truncate">Radiografia de tórax</span>
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <BotaoFilme
            ativo={invertido}
            onClick={() => setInvertido((v) => !v)}
            titulo="Inverter densidades"
          >
            <Contrast className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Negativo</span>
          </BotaoFilme>
          <BotaoFilme ativo={realce} onClick={() => setRealce((v) => !v)} titulo="Realçar contraste">
            <ScanLine className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Realce</span>
          </BotaoFilme>
        </div>
      </div>

      {/* As alterações acendem no topo do visor, junto com o filme marcado. */}
      {respondeu && marcado && temMarcacoes && (
        <div key={`achados-${revelacao}`} className="rx-achados border-b border-sky-400/20 bg-sky-500/[0.07]">
          <p className="flex items-center gap-2 px-3 py-2.5 sm:px-4">
            <Crosshair className="h-3.5 w-3.5 shrink-0 text-sky-300" />
            <span className="font-clinical text-[10px] font-black uppercase tracking-[0.16em] text-sky-200">
              {marcacoes.length} alteraç{marcacoes.length === 1 ? 'ão marcada' : 'ões marcadas'}
            </span>
          </p>
          <ul className="rx-rolagem max-h-56 space-y-1.5 overflow-y-auto px-3 pb-3 sm:max-h-none sm:overflow-visible sm:px-4">
            {marcacoes.map((achado, i) => (
              <li
                key={achado.titulo}
                style={{ ['--rx-i' as string]: i }}
                className="rx-achado flex gap-2.5 rounded-xl border border-white/10 bg-black/35 p-2.5"
              >
                <span
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md font-clinical text-[10px] font-black ${corDoTipo(achado.tipo)}`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold leading-snug text-white/90 sm:text-xs">
                    {achado.titulo}
                    <IconeTipo tipo={achado.tipo} />
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-white/55">
                    {achado.descricao}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="relative bg-black">
        <div
          data-imagem-clinica
          className="relative mx-auto w-full select-none overflow-hidden"
          style={{ aspectRatio: `${imagem.largura} / ${imagem.altura}`, filter: filtro }}
          role="img"
          aria-label={
            marcado
              ? `${imagem.titulo}. Radiografia com as alterações marcadas.`
              : 'Radiografia de tórax sem marcações, a ser interpretada.'
          }
        >
          <Camada imagem={imagem} marcada={false} />
          {marcado && <Camada key={`marcada-${revelacao}`} imagem={imagem} marcada classe="rx-revela" />}
          {marcado && <span key={`disparo-${revelacao}`} aria-hidden className="rx-disparo" />}

          <span
            aria-hidden
            className="pointer-events-none absolute left-2 top-2 rounded-md bg-black/65 px-2 py-1 font-clinical text-[9px] font-black uppercase tracking-widest text-white/75 backdrop-blur"
          >
            {marcado ? 'Com marcações' : 'Sem marcações'}
          </span>
          <span aria-hidden className="rx-canto left-2 bottom-2 border-b border-l" />
          <span aria-hidden className="rx-canto right-2 bottom-2 border-b border-r" />
        </div>
      </div>

      <div className="border-t border-white/10 bg-white/[0.02] px-3 py-2">
        {respondeu ? (
          <button
            type="button"
            onClick={onAlternar}
            aria-pressed={marcado}
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-sky-400/15 text-xs font-bold text-sky-100 transition hover:bg-sky-400/25"
          >
            {marcado ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {marcado ? 'Ver o filme limpo de novo' : 'Mostrar as marcações'}
          </button>
        ) : (
          <p className="py-1 text-center text-[11px] font-medium text-white/45">
            As marcações aparecem depois que você responder.
          </p>
        )}
      </div>
    </section>
  )
}

/** Uma metade do sprite: `0 0` é o filme limpo, `100% 0` é o marcado. */
function Camada({
  imagem,
  marcada,
  classe = '',
}: {
  imagem: ImagemCasoRaioX
  marcada: boolean
  classe?: string
}) {
  return (
    <div
      aria-hidden
      data-imagem-clinica
      className={`absolute inset-0 bg-black bg-no-repeat ${classe}`}
      style={{
        backgroundImage: `url("${imagem.sprite}")`,
        backgroundSize: '200% 100%',
        backgroundPosition: marcada ? '100% 0' : '0 0',
      }}
    />
  )
}

/**
 * Miniatura estática do sprite — usada na abertura e no gabarito.
 *
 * A proporção sai do próprio quadro (`largura` é a de um quadro, não a do
 * sprite inteiro): sem isso, um contêiner quadrado espremeria a radiografia.
 */
export function FilmeSprite({
  imagem,
  marcado = false,
  className = '',
}: {
  imagem: ImagemCasoRaioX
  marcado?: boolean
  className?: string
}) {
  return (
    <span
      role="presentation"
      aria-hidden
      data-imagem-clinica
      className={`block bg-black bg-no-repeat ${className}`}
      style={{
        aspectRatio: `${imagem.largura} / ${imagem.altura}`,
        backgroundImage: `url("${imagem.sprite}")`,
        backgroundSize: '200% 100%',
        backgroundPosition: marcado ? '100% 0' : '0 0',
      }}
    />
  )
}

function BotaoFilme({
  ativo,
  onClick,
  titulo,
  children,
}: {
  ativo: boolean
  onClick: () => void
  titulo: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={titulo}
      aria-label={titulo}
      aria-pressed={ativo}
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-bold transition ${
        ativo ? 'bg-sky-400/20 text-sky-200' : 'text-white/55 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function corDoTipo(tipo: TipoMarcacao) {
  if (tipo === 'armadilha') return 'bg-amber-400/20 text-amber-200 ring-1 ring-amber-300/30'
  if (tipo === 'medida') return 'bg-cyan-400/20 text-cyan-100 ring-1 ring-cyan-300/30'
  if (tipo === 'referencia') return 'bg-white/10 text-white/60 ring-1 ring-white/15'
  return 'bg-sky-400/25 text-sky-100 ring-1 ring-sky-300/35'
}

function IconeTipo({ tipo }: { tipo: TipoMarcacao }) {
  if (tipo === 'armadilha') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-amber-200">
        <AlertTriangle className="h-2.5 w-2.5" />
        armadilha
      </span>
    )
  }
  if (tipo === 'medida') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-cyan-400/15 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-cyan-200">
        <Ruler className="h-2.5 w-2.5" />
        medida
      </span>
    )
  }
  if (tipo === 'referencia') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white/50">
        referência
      </span>
    )
  }
  return null
}

/* ───────────────────────────── Resposta comentada ───────────────────────────── */

function Comentario({
  questao,
  acertou,
  escolhida,
}: {
  questao: QuestaoCasoClinico
  acertou: boolean
  escolhida: number
}) {
  const { comentario } = questao
  const marcada = questao.alternativas[escolhida]

  return (
    <section
      aria-live="polite"
      className="rx-entra overflow-hidden rounded-2xl border border-sky-500/25 bg-card shadow-sm"
    >
      <div
        className={`border-b px-4 py-3 ${
          acertou
            ? 'border-emerald-500/25 bg-emerald-500/[0.08]'
            : 'border-rose-500/25 bg-rose-500/[0.08]'
        }`}
      >
        <p
          className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-wider ${
            acertou ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {acertou ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          {acertou ? 'Correto' : `Você marcou: ${marcada.nome}`}
        </p>
        <h3 className="mt-1 font-heading text-base font-semibold leading-tight">
          {comentario.veredito}
        </h3>
        <p className="mt-1 font-clinical text-[11px] uppercase tracking-wider text-muted-foreground">
          {questao.categoriaTitulo} · {questao.titulo}
        </p>
      </div>

      <div className="divide-y divide-border">
        <Secao icone={Stethoscope} titulo="Da consulta para o filme" destaque>
          {comentario.correlacao}
        </Secao>

        {comentario.mecanismo && (
          <Secao icone={Activity} titulo="Por que a imagem ficou assim">
            {comentario.mecanismo}
          </Secao>
        )}

        <Secao icone={ScanLine} titulo="A leitura do exame">
          {comentario.leitura}
        </Secao>

        {comentario.sinais.length > 0 && (
          <div className="p-4">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              <ListChecks className="h-3.5 w-3.5 text-sky-500" /> O que confirmar no filme
            </p>
            <ul className="mt-2 space-y-1.5">
              {comentario.sinais.map((sinal) => (
                <li key={sinal} className="flex gap-2.5 text-[13px] leading-relaxed">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  {sinal}
                </li>
              ))}
            </ul>
          </div>
        )}

        {comentario.estruturas.length > 0 && (
          <div className="p-4">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              <Layers className="h-3.5 w-3.5 text-sky-500" /> Estrutura por estrutura
            </p>
            <ul className="mt-2.5 space-y-2.5">
              {comentario.estruturas.map((estrutura) => (
                <li key={estrutura.nome} className="rounded-xl border border-border bg-muted/20 p-3">
                  <p className="text-[13px] font-bold">{estrutura.nome}</p>
                  <dl className="mt-1.5 space-y-1 text-[13px] leading-relaxed">
                    <Linha rotulo="O que é">{estrutura.anatomia}</Linha>
                    <Linha rotulo="No filme normal">{estrutura.normal}</Linha>
                    <Linha rotulo="Neste caso" destaque>
                      {estrutura.neste}
                    </Linha>
                    {estrutura.alerta && (
                      <Linha rotulo="Atenção" alerta>
                        {estrutura.alerta}
                      </Linha>
                    )}
                  </dl>
                </li>
              ))}
            </ul>
          </div>
        )}

        {comentario.armadilhas.length > 0 && (
          <div className="bg-amber-500/[0.06] p-4">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" /> Armadilhas deste caso
            </p>
            <ul className="mt-2 space-y-1.5">
              {comentario.armadilhas.map((armadilha) => (
                <li key={armadilha} className="flex gap-2.5 text-[13px] leading-relaxed">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                  {armadilha}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="p-4">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            <Scale className="h-3.5 w-3.5 text-sky-500" /> Por que não as outras
          </p>
          <ul className="mt-2.5 space-y-2.5">
            {comentario.descartes.map((descarte) => (
              <li key={descarte.nome} className="rounded-xl border border-border bg-muted/20 p-3">
                <p className="flex flex-wrap items-center gap-2 text-[13px] font-bold">
                  {descarte.nome}
                  {descarte.nome === marcada.nome && (
                    <span className="inline-flex items-center rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                      sua resposta
                    </span>
                  )}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {descarte.texto}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {comentario.conduta && (
          <Secao icone={HeartPulse} titulo="O que a radiografia não resolve">
            {comentario.conduta}
          </Secao>
        )}

        <div className="p-4">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            <Target className="h-3.5 w-3.5 text-sky-500" /> Roteiro de leitura deste capítulo
          </p>
          <p className="mt-1.5 text-[13px] font-semibold leading-relaxed">
            {comentario.perguntaGuia}
          </p>
          <ol className="mt-2 space-y-1.5">
            {comentario.roteiro.map((passo, i) => (
              <li key={passo} className="flex gap-2.5 text-[13px] leading-relaxed">
                <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded bg-sky-500/15 font-clinical text-[9px] font-black text-sky-600 dark:text-sky-400">
                  {i + 1}
                </span>
                {passo}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

function Linha({
  rotulo,
  children,
  destaque = false,
  alerta = false,
}: {
  rotulo: string
  children: React.ReactNode
  destaque?: boolean
  alerta?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-x-1.5">
      <dt
        className={`font-clinical text-[10px] font-black uppercase tracking-wider ${
          alerta ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
        }`}
      >
        {rotulo}
      </dt>
      <dd
        className={`min-w-0 flex-1 ${
          destaque ? 'font-medium text-foreground' : 'text-muted-foreground'
        } ${alerta ? 'text-amber-700 dark:text-amber-300/90' : ''}`}
      >
        {children}
      </dd>
    </div>
  )
}

function Secao({
  icone: Icone,
  titulo,
  destaque = false,
  children,
}: {
  icone: typeof Activity
  titulo: string
  destaque?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`flex gap-3 p-4 ${destaque ? 'bg-sky-500/[0.05]' : ''}`}>
      <Icone className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
          {titulo}
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-foreground/85">{children}</p>
      </div>
    </div>
  )
}

/* ──────────────────────────────── Resultado ──────────────────────────────── */

function Resultado({
  rodada,
  respostas,
  acertos,
  percentual,
  recorde,
  irmaos,
  onRefazer,
  onRefazerErros,
}: {
  rodada: QuestaoCasoClinico[]
  respostas: (number | null)[]
  acertos: number
  percentual: number
  recorde: Recorde | null
  irmaos: ResumoQuizClinico[]
  onRefazer: () => void
  onRefazerErros?: () => void
}) {
  const bom = percentual >= 70
  const erros = rodada.filter((questao, posicao) => respostas[posicao] !== questao.correta)

  // Onde o erro se concentrou: com o plantão misturando sete capítulos, saber
  // "errei pneumotórax" vale mais do que saber "acertei 68%".
  const porCapitulo = useMemo(() => {
    const mapa = new Map<string, { titulo: string; certas: number; total: number }>()
    rodada.forEach((questao, posicao) => {
      const atual = mapa.get(questao.categoria) ?? {
        titulo: questao.categoriaTitulo,
        certas: 0,
        total: 0,
      }
      atual.total += 1
      if (respostas[posicao] === questao.correta) atual.certas += 1
      mapa.set(questao.categoria, atual)
    })
    return [...mapa.values()].sort((a, b) => a.certas / a.total - b.certas / b.total)
  }, [rodada, respostas])

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] lg:items-start">
      <div className="flex flex-col gap-5">
        <section className="rx-entra rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <div
            className={`mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${
              bom ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500'
            }`}
          >
            <Trophy className="h-7 w-7" />
          </div>
          <p className="font-heading text-2xl font-semibold tracking-tight">
            {acertos} de {rodada.length} — {percentual}%
          </p>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
            {percentual >= 90
              ? 'Você está lendo o filme a partir da história, que é como se lê no plantão. Vale encarar o plantão completo, que mistura os sete capítulos sem avisar qual é qual.'
              : percentual >= 70
                ? 'Base sólida. Refaça só os casos errados: eles costumam ser aqueles em que a clínica apontava para um lado e a imagem para outro — e é exatamente ali que a leitura melhora mais rápido.'
                : percentual >= 45
                  ? 'Metade do caminho. Volte ao atlas de alterações com o roteiro do capítulo ao lado, percorra os filmes marcados e repita a rodada depois.'
                  : 'Ainda é hora de estudar com o filme marcado à vista. Abra o capítulo no atlas, leia as marcações comentadas e volte aqui — o quiz mede o que já foi visto, não substitui a primeira leitura.'}
          </p>
          {recorde && recorde.melhor > percentual && (
            <p className="mt-2 font-clinical text-xs text-muted-foreground">
              Seu melhor neste quiz continua sendo {recorde.melhor}%.
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={onRefazer}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-sky-500 px-4 text-sm font-bold text-white transition hover:bg-sky-600 active:scale-[0.98]"
            >
              Nova rodada
            </button>
            {onRefazerErros && (
              <button
                type="button"
                onClick={onRefazerErros}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 text-sm font-bold transition hover:bg-muted"
              >
                Refazer só os {erros.length} errados
              </button>
            )}
          </div>
        </section>

        {porCapitulo.length > 1 && (
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="flex items-center gap-2 font-heading text-base font-semibold">
              <ListChecks className="h-[18px] w-[18px] text-sky-500" /> Onde o erro se concentrou
            </h3>
            <ul className="mt-3 space-y-2.5">
              {porCapitulo.map((linha) => {
                const taxa = Math.round((linha.certas / linha.total) * 100)
                return (
                  <li key={linha.titulo} className="flex items-center gap-3">
                    <span className="w-36 shrink-0 truncate text-[13px] font-bold">
                      {linha.titulo}
                    </span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <span
                        className={`block h-full rounded-full ${
                          taxa >= 70 ? 'bg-emerald-500' : taxa >= 45 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${taxa}%` }}
                      />
                    </span>
                    <span className="w-16 shrink-0 text-right font-clinical text-[11px] text-muted-foreground">
                      {linha.certas}/{linha.total}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-heading text-base font-semibold">Gabarito da rodada</h3>
          <ul className="mt-3 divide-y divide-border">
            {rodada.map((questao, posicao) => {
              const escolhida = respostas[posicao]
              const acertou = escolhida === questao.correta
              return (
                <li key={questao.id} className="flex items-start gap-3 py-2.5">
                  <FilmeSprite
                    imagem={questao.imagem}
                    marcado
                    className="w-12 shrink-0 rounded-md"
                  />
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      acertou ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'
                    }`}
                  >
                    {acertou ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <Link
                      href={questao.atalho}
                      prefetch={false}
                      className="block text-[13px] font-bold hover:text-sky-600 dark:hover:text-sky-400"
                    >
                      {questao.comentario.veredito}
                    </Link>
                    <span className="block text-[11px] text-muted-foreground">
                      {questao.categoriaTitulo}
                      {!acertou && escolhida !== null && (
                        <> · você marcou <em>{questao.alternativas[escolhida].nome}</em></>
                      )}
                    </span>
                  </span>
                  <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <aside className="flex flex-col gap-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Continuar treinando
          </p>
          <ul className="mt-2.5 space-y-1.5">
            {irmaos.map((irmao) => (
              <li key={irmao.slug}>
                <Link
                  href={`/manual-clinico/radiologia/raio-x/casos/quiz/${irmao.slug}`}
                  className="group flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 transition hover:border-sky-500/50 hover:bg-sky-500/[0.05]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold">{irmao.titulo}</span>
                    <span className="block truncate text-[10px] text-muted-foreground">
                      {irmao.subtitulo}
                    </span>
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-sky-500 transition group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/manual-clinico/radiologia/raio-x/casos/quiz"
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400"
          >
            Todos os capítulos <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.04] p-4 text-xs leading-relaxed text-muted-foreground">
          <p className="font-bold text-foreground">Escopo educacional</p>
          <p className="mt-1">
            Pacientes fictícios, construídos para ensinar leitura de imagem. Acertar o quiz não é
            laudo: a interpretação real depende de história, comparação com exames anteriores e do
            método de imagem adequado a cada pergunta.
          </p>
        </div>
      </aside>
    </div>
  )
}
