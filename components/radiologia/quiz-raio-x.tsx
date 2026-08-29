'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { holdScrollAtTop } from '@/components/scroll-to-top'
import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  Contrast,
  Crosshair,
  Eye,
  EyeOff,
  Flame,
  GraduationCap,
  Info,
  Keyboard,
  Lightbulb,
  ListChecks,
  Ruler,
  Scale,
  Sparkles,
  Target,
  Trophy,
  X,
} from 'lucide-react'
import { CantosFilme, FilmeImagem } from '@/components/radiologia/filme'
import type {
  QuestaoRaioX,
  QuizRaioX,
  ResumoQuizRaioX,
} from '@/lib/radiologia/quiz-raio-x'

/**
 * Quiz de identificação do Atlas de Raio-X.
 *
 * O atlas ensina no sentido fácil — clique no nome, a estrutura acende. Aqui a
 * marcação já está acesa e falta o nome. A diferença entre "reconhecer" e "ter
 * lido a lista ao lado do filme" só aparece nesse sentido.
 *
 * ## O que este componente não faz
 *
 * Ele não decide gabarito, não escolhe distrator e não escreve comentário: tudo
 * isso chega pronto de `lib/radiologia/quiz-raio-x.ts`, montado no servidor. O
 * que é do cliente é o que depende do aluno — o sorteio da rodada, o teclado, o
 * cronômetro da sequência de acertos e o recorde guardado no navegador.
 *
 * ## Por que o sorteio só acontece depois do "começar"
 *
 * A página é estática e este componente também renderiza no servidor. Sortear
 * durante a montagem faria o HTML e a hidratação discordarem sobre qual é a
 * primeira questão. A tela de abertura resolve isso sem truque: até o clique,
 * o que existe é o cartão de apresentação; a rodada nasce já no navegador.
 */

const CHAVE_RECORDE = (slug: string) => `rx-quiz:${slug}`

interface Recorde {
  melhor: number
  rodadas: number
  em: string
}

type Fase = 'abertura' | 'rodada' | 'resultado'

/** Tamanhos de rodada oferecidos — só aparecem quando há questões de sobra. */
const TAMANHOS = [10, 20, 40] as const

export interface QuizRaioXViewProps {
  quiz: QuizRaioX
  /** Outros quizzes da mesma família, para o fim da rodada não ser um beco. */
  irmaos: ResumoQuizRaioX[]
}

export function QuizRaioXView({ quiz, irmaos }: QuizRaioXViewProps) {
  const [fase, setFase] = useState<Fase>('abertura')
  const [rodada, setRodada] = useState<QuestaoRaioX[]>([])
  const [indice, setIndice] = useState(0)
  const [respostas, setRespostas] = useState<(number | null)[]>([])
  const [marcando, setMarcando] = useState(true)
  const [invertido, setInvertido] = useState(false)
  const [tamanho, setTamanho] = useState<number>(() => Math.min(20, quiz.questoes.length))
  const [recorde, setRecorde] = useState<Recorde | null>(null)

  useEffect(() => {
    try {
      const bruto = window.localStorage.getItem(CHAVE_RECORDE(quiz.slug))
      if (bruto) setRecorde(JSON.parse(bruto) as Recorde)
    } catch {
      // Navegador com armazenamento bloqueado: o quiz funciona sem recorde.
    }
  }, [quiz.slug])

  const comecar = useCallback(
    (questoes: QuestaoRaioX[]) => {
      setRodada(questoes)
      setRespostas(Array(questoes.length).fill(null))
      setIndice(0)
      setMarcando(true)
      setFase('rodada')
      holdScrollAtTop()
    },
    [],
  )

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
  const respondeu = escolhida !== null

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
   * Passa de questão e devolve a tela ao topo.
   *
   * `scrollIntoView({ behavior: 'smooth' })` falhava justamente aqui: quem
   * responde termina no fim de um comentário longo, e a questão seguinte nasce
   * curta — sem comentário e com o filme ainda carregando. O navegador prende o
   * scroll no fim desse documento curto e cancela a rolagem suave assim que a
   * radiografia entra e muda o layout, deixando a tela parada no rodapé.
   * `holdScrollAtTop` sobe na hora e segura até a página crescer, soltando ao
   * primeiro gesto de rolagem.
   */
  const avancar = useCallback(() => {
    if (indice + 1 >= rodada.length) {
      setFase('resultado')
      holdScrollAtTop()
      return
    }
    setIndice((atual) => atual + 1)
    setMarcando(true)
    holdScrollAtTop()
  }, [indice, rodada.length])

  // Guardar o recorde na saída da rodada, e não a cada resposta: o que interessa
  // é o resultado fechado, e escrever no `localStorage` a cada clique é ruído.
  const acertos = useMemo(
    () => rodada.reduce((total, item, posicao) => total + (respostas[posicao] === item.correta ? 1 : 0), 0),
    [rodada, respostas],
  )
  const percentual = rodada.length > 0 ? Math.round((acertos / rodada.length) * 100) : 0

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

  // Atalhos de teclado: responder por número ou letra, comparar o filme sem a
  // marcação e seguir adiante sem tirar a mão do teclado.
  useEffect(() => {
    if (fase !== 'rodada' || !questao) return
    const aoTeclar = (evento: KeyboardEvent) => {
      const alvo = evento.target as HTMLElement | null
      if (alvo && /^(INPUT|TEXTAREA)$/.test(alvo.tagName)) return

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
        return
      }
      if (tecla === ' ' && alvo?.tagName !== 'BUTTON') {
        evento.preventDefault()
        setMarcando((atual) => !atual)
        return
      }
      if (tecla === 'i') setInvertido((atual) => !atual)
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [avancar, fase, indice, questao, respondeu, respostas, responder])

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
            questao={questao}
            indice={indice}
            total={rodada.length}
            acertos={acertos}
            escolhida={escolhida}
            marcando={marcando}
            invertido={invertido}
            proxima={rodada[indice + 1]}
            onResponder={responder}
            onAvancar={avancar}
            onMarcar={() => setMarcando((atual) => !atual)}
            onInverter={() => setInvertido((atual) => !atual)}
          />
        )}

        {fase === 'resultado' && (
          <Resultado
            quiz={quiz}
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

function CabecalhoQuiz({ quiz }: { quiz: QuizRaioX }) {
  return (
    <header className="rx-painel rx-grade relative overflow-hidden border-b border-sky-400/15">
      <div className="rx-abaixo-flutuantes container relative mx-auto max-w-6xl px-4 pb-5 pt-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <Link
            href="/manual-clinico/radiologia/raio-x/quiz"
            className="-m-1 inline-flex items-center gap-1.5 rounded p-1 text-sky-100/55 transition hover:text-sky-100"
          >
            <ArrowLeft className="h-4 w-4" /> Quizzes do atlas
          </Link>
          {quiz.tipo === 'estudo' && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-sky-100/25" />
              <Link
                href={`/manual-clinico/radiologia/raio-x/${quiz.slug}`}
                className="-m-1 rounded p-1 text-sky-100/55 transition hover:text-sky-100"
              >
                Ver esta incidência no atlas
              </Link>
            </>
          )}
        </div>

        <div className="mt-4">
          <p className="editorial-mark !text-sky-300/80 [&::before]:bg-sky-300/60">
            Identifique a estrutura marcada · {quiz.subtitulo}
          </p>
          <h1 className="mt-1.5 font-heading text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {quiz.titulo}
            <span className="ml-2.5 inline-flex translate-y-[-2px] items-center rounded-full border border-sky-300/30 bg-sky-400/10 px-2.5 py-0.5 align-middle font-clinical text-[11px] font-bold uppercase tracking-widest text-sky-200">
              {quiz.total} questões
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
  quiz: QuizRaioX
  recorde: Recorde | null
  tamanho: number
  onTamanho: (valor: number) => void
  onComecar: () => void
}) {
  const opcoes = [...TAMANHOS.filter((valor) => valor < quiz.total), quiz.total]

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] xl:items-start">
      <section className="rx-entra rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <p className="text-sm leading-relaxed text-muted-foreground">{quiz.descricao}</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Instrucao icone={Target} titulo="A marcação já está acesa">
            O filme abre com a demarcação do atlas por cima. Sua tarefa é dizer o nome do que está
            pintado.
          </Instrucao>
          <Instrucao icone={EyeOff} titulo="Compare com o filme limpo">
            A barra de espaço apaga e reacende a marcação — use isso para conferir o reparo
            anatômico ao redor antes de decidir.
          </Instrucao>
          <Instrucao icone={GraduationCap} titulo="Errar aqui é barato">
            Cada resposta abre um comentário completo: o que é, como achar sem a marcação, o que se
            avalia e por que as outras alternativas não eram.
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
                {valor === quiz.total ? `Todas (${valor})` : `${valor} questões`}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            As questões são sorteadas a cada rodada, e as alternativas mudam de posição conforme a
            estrutura marcada — repetir o quiz não é repetir a mesma sequência.
          </p>

          <button
            type="button"
            onClick={onComecar}
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-sky-500 px-6 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-600 active:scale-[0.98]"
          >
            Começar rodada <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <aside className="flex flex-col gap-4">
        <div className="overflow-hidden rounded-2xl border border-sky-500/25 bg-black shadow-sm">
          <div className="relative aspect-[4/3] w-full">
            <FilmeImagem
              src={quiz.capa}
              alt=""
              larguraMobile={640}
              larguraDesktop={640}
              qualidade={70}
              comEsqueleto
              className="absolute inset-0 h-full w-full object-contain"
            />
            <CantosFilme />
          </div>
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

        <div className="rounded-2xl border border-border bg-muted/20 p-4">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            <Keyboard className="h-3.5 w-3.5" /> Teclado
          </p>
          <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
            <li><Tecla>1</Tecla>–<Tecla>4</Tecla> ou <Tecla>A</Tecla>–<Tecla>D</Tecla> respondem</li>
            <li><Tecla>Espaço</Tecla> apaga e reacende a marcação</li>
            <li><Tecla>I</Tecla> inverte o filme (negativo)</li>
            <li><Tecla>Enter</Tecla> vai para a próxima</li>
          </ul>
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

function Tecla({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-clinical text-[10px] font-bold text-foreground">
      {children}
    </kbd>
  )
}

/* ───────────────────────────────── Rodada ───────────────────────────────── */

function Rodada({
  questao,
  indice,
  total,
  acertos,
  escolhida,
  marcando,
  invertido,
  proxima,
  onResponder,
  onAvancar,
  onMarcar,
  onInverter,
}: {
  questao: QuestaoRaioX
  indice: number
  total: number
  acertos: number
  escolhida: number | null
  marcando: boolean
  invertido: boolean
  proxima?: QuestaoRaioX
  onResponder: (posicao: number) => void
  onAvancar: () => void
  onMarcar: () => void
  onInverter: () => void
}) {
  const respondeu = escolhida !== null
  const acertou = escolhida === questao.correta

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
  }, [respondeu, indice])

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,1fr)] xl:items-start">
      {/* ── Negatoscópio ── */}
      <div className="-mx-4 sm:mx-0 xl:sticky xl:top-4">
        <div className="overflow-hidden border-y border-sky-400/20 bg-black shadow-2xl shadow-black/40 sm:rounded-2xl sm:border">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-neutral-950 px-3 py-2 text-white">
            <span className="inline-flex min-w-0 items-center gap-2 font-clinical text-[10px] uppercase tracking-widest text-sky-300/80">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-400" />
              </span>
              <span className="truncate">{questao.contexto.regiaoTitulo}</span>
              <span className="hidden text-white/25 sm:inline">·</span>
              <span className="hidden truncate text-white/45 sm:inline">
                {questao.contexto.titulo}
              </span>
            </span>
            <div className="flex shrink-0 items-center gap-1">
              <BotaoFilme ativo={invertido} onClick={onInverter} titulo="Inverter o filme (tecla I)">
                <Contrast className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Negativo</span>
              </BotaoFilme>
              <BotaoFilme
                ativo={!marcando}
                onClick={onMarcar}
                titulo="Apagar e reacender a marcação (barra de espaço)"
              >
                {marcando ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{marcando ? 'Filme limpo' : 'Com marcação'}</span>
              </BotaoFilme>
            </div>
          </div>

          <div className="relative h-[42vh] min-h-[240px] w-full overflow-hidden bg-black sm:h-[50vh] md:h-[56vh] xl:h-[min(62vh,660px)]">
            <FilmeImagem
              key={`base-${questao.id}`}
              src={questao.imagem}
              alt={`Radiografia de ${questao.contexto.titulo} em ${questao.contexto.incidencia}`}
              larguraMobile={750}
              larguraDesktop={1080}
              qualidade={78}
              prioritaria
              comEsqueleto
              className={`absolute inset-0 h-full w-full object-contain transition-[filter] duration-500 ${
                invertido ? 'invert' : ''
              }`}
            />

            <div
              aria-hidden={!marcando}
              className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out ${
                marcando ? 'rx-pulso opacity-100' : 'opacity-0'
              }`}
            >
              <FilmeImagem
                key={`marca-${questao.id}`}
                src={questao.sobreposicao}
                alt={marcando ? 'Estrutura demarcada, a ser identificada' : ''}
                larguraMobile={750}
                larguraDesktop={1080}
                qualidade={78}
                prioritaria
                otimizar={false}
                className="h-full w-full object-contain"
              />
            </div>

            {/* Aquece o filme seguinte enquanto o aluno lê o comentário: a
                próxima questão nasce com a radiografia já no cache. */}
            {proxima && (
              <div aria-hidden className="pointer-events-none absolute inset-0 opacity-0">
                <FilmeImagem
                  src={proxima.imagem}
                  alt=""
                  larguraMobile={750}
                  larguraDesktop={1080}
                  qualidade={78}
                  segundoPlano
                  className="h-full w-full object-contain"
                />
                <FilmeImagem
                  src={proxima.sobreposicao}
                  alt=""
                  larguraMobile={750}
                  larguraDesktop={1080}
                  qualidade={78}
                  segundoPlano
                  otimizar={false}
                  className="h-full w-full object-contain"
                />
              </div>
            )}

            <CantosFilme />

            <span className="pointer-events-none absolute right-3 top-3 rounded border border-sky-300/25 bg-black/60 px-1.5 py-0.5 font-clinical text-[10px] font-bold tracking-widest text-sky-200/80 backdrop-blur">
              {questao.contexto.incidencia.toUpperCase()}
            </span>

            {!marcando && (
              <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-black/70 px-3 py-1 text-[11px] font-bold text-white/70 backdrop-blur">
                Filme limpo — a marcação volta com a barra de espaço
              </span>
            )}
          </div>

          <div className="border-t border-white/10 bg-neutral-950">
            <div
              className="h-0.5 bg-sky-400/70 transition-[width] duration-500 ease-out"
              style={{ width: `${((indice + (respondeu ? 1 : 0)) / total) * 100}%` }}
            />
            <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-white">
              <span className="font-clinical text-[11px] uppercase tracking-widest text-white/45">
                Questão {String(indice + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}
              </span>
              <span className="inline-flex items-center gap-1.5 font-clinical text-[11px] font-bold text-sky-200">
                <Flame className="h-3.5 w-3.5" /> {acertos} {acertos === 1 ? 'acerto' : 'acertos'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Enunciado, alternativas e comentário ── */}
      <div className="flex min-w-0 flex-col gap-4">
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/25 bg-sky-500/[0.07] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
              <Target className="h-3 w-3" /> {questao.contexto.camada}
            </span>
            <span className="font-clinical text-[10px] uppercase tracking-wider text-muted-foreground">
              {questao.contexto.titulo} · {questao.contexto.incidencia}
            </span>
          </div>

          <h2 className="text-base font-semibold leading-relaxed sm:text-lg">{questao.enunciado}</h2>

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
                  <span className="min-w-0">
                    <span className="block text-sm font-bold leading-snug">{alternativa.nome}</span>
                    <span className="mt-0.5 block text-[11px] italic leading-tight text-muted-foreground">
                      {alternativa.original}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          {!respondeu && (
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              Dica de método: antes de escolher, apague a marcação e procure o reparo vizinho — a
              estrutura certa continua reconhecível no filme limpo.
            </p>
          )}
        </section>

        {respondeu && (
          <>
            <div ref={comentarioRef} className="scroll-mt-3">
              <Comentario questao={questao} acertou={acertou} escolhida={escolhida} />
            </div>

            {/* Grudada no rodapé enquanto o comentário rola.
                O comentário é longo de propósito — é ele que ensina a
                reconhecer a estrutura sem a marcação —, mas com o botão só no
                fim era preciso percorrer tudo para poder seguir. Agora ele
                acompanha a leitura. */}
            <div className="sticky bottom-0 z-30 -mx-4 px-4 pb-3 pt-2 sm:mx-0 sm:px-0">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/95 to-transparent" />
              <div className="relative flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onAvancar}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-sky-500 px-4 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-600 active:scale-[0.98]"
                >
                  {indice + 1 >= total ? 'Ver resultado' : 'Próxima questão'}
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

/* ───────────────────────────── Resposta comentada ───────────────────────────── */

/** Só o conteúdo: as ações moram na barra grudada, fora daqui. */
function Comentario({
  questao,
  acertou,
  escolhida,
}: {
  questao: QuestaoRaioX
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
          {acertou ? 'Correto' : `Você marcou ${marcada.nome}`}
        </p>
        <h3 className="mt-1 font-heading text-base font-semibold leading-tight">
          {comentario.gabarito}
        </h3>
      </div>

      <div className="divide-y divide-border">
        <Secao icone={Info} titulo="O que é">
          {comentario.oQueE}
        </Secao>
        <Secao icone={Crosshair} titulo="Como reconhecer sem a marcação">
          {comentario.comoIdentificar}
        </Secao>
        <Secao icone={Activity} titulo="O que se avalia nela e por quê">
          {comentario.porQueImporta}
        </Secao>

        {comentario.armadilha && (
          <Secao icone={AlertTriangle} titulo="Armadilha clássica" tom="alerta">
            {comentario.armadilha}
          </Secao>
        )}

        {comentario.medida && (
          <div className="flex gap-3 p-4">
            <Ruler className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Número de referência
              </p>
              <p className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13px]">
                <span className="font-bold">{comentario.medida.rotulo}</span>
                <span className="rounded border border-sky-500/25 bg-sky-500/10 px-1.5 py-0.5 font-clinical text-[11px] font-bold text-sky-700 dark:text-sky-300">
                  {comentario.medida.valor}
                </span>
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-foreground/85">
                {comentario.medida.nota}
              </p>
            </div>
          </div>
        )}

        <div className="p-4">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            <Scale className="h-3.5 w-3.5 text-sky-500" /> Por que não as outras
          </p>
          <ul className="mt-2.5 space-y-2.5">
            {comentario.descartes.map((descarte) => (
              <li
                key={descarte.nome}
                className="rounded-xl border border-border bg-muted/20 p-3"
              >
                <p className="flex flex-wrap items-center gap-2 text-[13px] font-bold">
                  {descarte.nome}
                  {descarte.curado && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      <Sparkles className="h-2.5 w-2.5" /> confusão clássica
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

        <Secao icone={Lightbulb} titulo={`Pérola de ${questao.contexto.regiaoTitulo}`}>
          {comentario.perola}
        </Secao>
      </div>

    </section>
  )
}

function Secao({
  icone: Icone,
  titulo,
  tom = 'padrao',
  children,
}: {
  icone: typeof Info
  titulo: string
  tom?: 'padrao' | 'alerta'
  children: React.ReactNode
}) {
  const alerta = tom === 'alerta'
  return (
    <div className={`flex gap-3 p-4 ${alerta ? 'bg-amber-500/[0.06]' : ''}`}>
      <Icone className={`mt-0.5 h-4 w-4 shrink-0 ${alerta ? 'text-amber-500' : 'text-sky-500'}`} />
      <div className="min-w-0">
        <p
          className={`text-[10px] font-black uppercase tracking-wider ${
            alerta ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
          }`}
        >
          {titulo}
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-foreground/85">{children}</p>
      </div>
    </div>
  )
}

/* ──────────────────────────────── Resultado ──────────────────────────────── */

function Resultado({
  quiz,
  rodada,
  respostas,
  acertos,
  percentual,
  recorde,
  irmaos,
  onRefazer,
  onRefazerErros,
}: {
  quiz: QuizRaioX
  rodada: QuestaoRaioX[]
  respostas: (number | null)[]
  acertos: number
  percentual: number
  recorde: Recorde | null
  irmaos: ResumoQuizRaioX[]
  onRefazer: () => void
  onRefazerErros?: () => void
}) {
  const bom = percentual >= 70
  const erros = rodada.filter((questao, posicao) => respostas[posicao] !== questao.correta)

  // Onde o erro se concentrou: com o simulado geral misturando nove regiões,
  // saber "errei tórax" vale mais do que saber "acertei 68%".
  const porRegiao = useMemo(() => {
    const mapa = new Map<string, { titulo: string; certas: number; total: number }>()
    rodada.forEach((questao, posicao) => {
      const atual = mapa.get(questao.contexto.regiao) ?? {
        titulo: questao.contexto.regiaoTitulo,
        certas: 0,
        total: 0,
      }
      atual.total += 1
      if (respostas[posicao] === questao.correta) atual.certas += 1
      mapa.set(questao.contexto.regiao, atual)
    })
    return [...mapa.values()].sort((a, b) => a.certas / a.total - b.certas / b.total)
  }, [rodada, respostas])

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] xl:items-start">
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
              ? 'Você reconhece essas demarcações sem a legenda. Vale trocar de região ou encarar o simulado geral, que mistura as nove.'
              : percentual >= 70
                ? 'Base sólida. Refaça só as erradas: as estruturas que escaparam costumam ser as vizinhas da certa, e é ali que a leitura melhora mais rápido.'
                : percentual >= 45
                  ? 'Metade do caminho. Volte ao atlas com o roteiro de leitura da região ao lado e percorra as demarcações na ordem antes de repetir a rodada.'
                  : 'Ainda é hora de estudar com a legenda visível. Abra a incidência no atlas, use a revisão automática e volte aqui — o quiz mede o que já foi visto, não substitui a primeira leitura.'}
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
                Refazer só as {erros.length} erradas
              </button>
            )}
          </div>
        </section>

        {porRegiao.length > 1 && (
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="flex items-center gap-2 font-heading text-base font-semibold">
              <ListChecks className="h-[18px] w-[18px] text-sky-500" /> Onde o erro se concentrou
            </h3>
            <ul className="mt-3 space-y-2.5">
              {porRegiao.map((linha) => {
                const taxa = Math.round((linha.certas / linha.total) * 100)
                return (
                  <li key={linha.titulo} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 truncate text-[13px] font-bold">{linha.titulo}</span>
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
                      {questao.alternativas[questao.correta].nome}
                    </Link>
                    <span className="block text-[11px] text-muted-foreground">
                      {questao.contexto.titulo} · {questao.contexto.incidencia}
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
                  href={`/manual-clinico/radiologia/raio-x/quiz/${irmao.slug}`}
                  className="group flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 transition hover:border-sky-500/50 hover:bg-sky-500/[0.05]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold">{irmao.titulo}</span>
                    <span className="block truncate text-[10px] text-muted-foreground">
                      {irmao.subtitulo} · {irmao.total} questões
                    </span>
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-sky-500 transition group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/manual-clinico/radiologia/raio-x/quiz"
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400"
          >
            Todos os quizzes <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.04] p-4 text-xs leading-relaxed text-muted-foreground">
          <p className="font-bold text-foreground">Escopo educacional</p>
          <p className="mt-1">
            Material educacional de anatomia radiográfica. Acertar o quiz não é laudo: a leitura
            clínica depende de história, comparação com exames anteriores e do método de imagem
            adequado a cada pergunta.
          </p>
          {quiz.tipo === 'estudo' && (
            <Link
              href={`/manual-clinico/radiologia/raio-x/${quiz.slug}`}
              className="mt-2.5 inline-flex items-center gap-1 font-bold text-sky-600 dark:text-sky-400"
            >
              Rever esta incidência no atlas <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </aside>
    </div>
  )
}
