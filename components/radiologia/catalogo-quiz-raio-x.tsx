'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Keyboard,
  LayoutGrid,
  Play,
  ScanLine,
  Target,
  Trophy,
} from 'lucide-react'
import { CantosFilme, FilmeImagem } from '@/components/radiologia/filme'
import type { ResumoQuizRaioX } from '@/lib/radiologia/quiz-raio-x'

/**
 * Índice dos quizzes de identificação.
 *
 * Recebe apenas os resumos — slug, título, capa e contagem. As questões ficam
 * na página de cada quiz: trazê-las para cá significaria mandar as 221
 * demarcações comentadas para o navegador de quem só quer escolher por onde
 * começar.
 */

const CHAVE_RECORDE = (slug: string) => `rx-quiz:${slug}`

export interface CatalogoQuizRaioXProps {
  quizzes: ResumoQuizRaioX[]
  /** Quantas demarcações o acervo tem ao todo — o tamanho real do banco. */
  totalDemarcacoes: number
}

export function CatalogoQuizRaioX({ quizzes, totalDemarcacoes }: CatalogoQuizRaioXProps) {
  const geral = quizzes.find((quiz) => quiz.tipo === 'geral')
  const porRegiao = useMemo(() => quizzes.filter((quiz) => quiz.tipo === 'regiao'), [quizzes])
  const porEstudo = useMemo(() => quizzes.filter((quiz) => quiz.tipo === 'estudo'), [quizzes])

  const [regiao, setRegiao] = useState<string | null>(null)
  const [recordes, setRecordes] = useState<Record<string, number>>({})

  // Os recordes moram no navegador e só existem depois da hidratação. Ler no
  // efeito evita que o HTML estático prometa uma medalha que o cliente não tem.
  useEffect(() => {
    const encontrados: Record<string, number> = {}
    for (const quiz of quizzes) {
      try {
        const bruto = window.localStorage.getItem(CHAVE_RECORDE(quiz.slug))
        if (!bruto) continue
        const salvo = JSON.parse(bruto) as { melhor?: number }
        if (typeof salvo.melhor === 'number') encontrados[quiz.slug] = salvo.melhor
      } catch {
        // Armazenamento indisponível ou registro corrompido: segue sem recorde.
      }
    }
    setRecordes(encontrados)
  }, [quizzes])

  const regioes = useMemo(() => {
    const mapa = new Map<string, string>()
    for (const quiz of porEstudo) {
      if (quiz.regiao && quiz.regiaoTitulo) mapa.set(quiz.regiao, quiz.regiaoTitulo)
    }
    return [...mapa.entries()]
  }, [porEstudo])

  const estudosVisiveis = regiao ? porEstudo.filter((quiz) => quiz.regiao === regiao) : porEstudo

  return (
    <div className="rx surface-page min-h-screen">
      <header className="rx-painel rx-grade rx-varredura relative overflow-hidden border-b border-sky-400/15">
        <div className="rx-abaixo-flutuantes container relative mx-auto max-w-6xl px-4 pb-7 pt-6">
          <Link
            href="/manual-clinico/radiologia/raio-x"
            className="-m-2 inline-flex items-center gap-1.5 rounded-lg p-2 text-sm text-sky-100/60 transition hover:text-sky-100"
          >
            <ArrowLeft className="h-4 w-4" /> Atlas de Raio-X
          </Link>

          {/* `.editorial-mark` é `inline-flex`: sem um bloco em volta, a marca
              subiria para a mesma linha do link de voltar. */}
          <div className="mt-5">
            <p className="editorial-mark !text-sky-300/80 [&::before]:bg-sky-300/60">
              Quizzes de identificação
            </p>
          </div>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-white sm:text-[2rem] sm:leading-tight">
            A marcação está acesa. Qual é a estrutura?
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-sky-100/65 sm:text-base">
            As mesmas demarcações do atlas, no sentido inverso: o filme abre com a estrutura pintada
            e você diz o nome. Cada resposta vem comentada — o que é, como reconhecer sem a
            marcação, o que se avalia nela e por que cada alternativa errada era tentadora.
          </p>

          <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-bold text-sky-100/70">
            <Selo icone={Target} texto={`${totalDemarcacoes} demarcações no banco`} />
            <Selo icone={LayoutGrid} texto={`${quizzes.length} quizzes`} />
            <Selo icone={Keyboard} texto="Responde pelo teclado" />
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 pb-16 pt-7 sm:pt-9">
        {geral && (
          <Link
            href={`/manual-clinico/radiologia/raio-x/quiz/${geral.slug}`}
            className="group mb-9 grid gap-4 overflow-hidden rounded-2xl border border-sky-500/25 bg-gradient-to-br from-sky-500/[0.09] via-card to-violet-500/[0.07] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/10 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500 text-white shadow-lg shadow-sky-500/20">
              <Play className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-[10px] font-black uppercase tracking-widest text-sky-600 dark:text-sky-400">
                {geral.subtitulo} · {geral.total} questões
              </span>
              <strong className="mt-1 block font-heading text-lg font-semibold sm:text-xl">
                {geral.titulo}
              </strong>
              <span className="mt-1.5 block max-w-3xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {geral.descricao}
              </span>
            </span>
            <span className="inline-flex items-center gap-2">
              {recordes[geral.slug] !== undefined && <Medalha valor={recordes[geral.slug]} />}
              <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400">
                Começar <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </span>
          </Link>
        )}

        <section>
          <div className="mb-4">
            <p className="editorial-mark">Uma região inteira por vez</p>
            <h2 className="mt-1.5 font-heading text-xl font-semibold tracking-tight sm:text-2xl">
              Quizzes por região
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Misturam frontal, perfil e oblíquas da mesma região — que é como a estrutura aparece
              na vida real, e não incidência por incidência.
            </p>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
            {porRegiao.map((quiz, indice) => (
              <CardQuiz
                key={quiz.slug}
                quiz={quiz}
                indice={indice}
                recorde={recordes[quiz.slug]}
                formato="largo"
              />
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="editorial-mark">Uma incidência por vez</p>
              <h2 className="mt-1.5 font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                Quizzes por incidência
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {estudosVisiveis.length} de {porEstudo.length} incidências
            </p>
          </div>

          <nav aria-label="Filtrar por região" className="rx-rolagem -mx-1 mb-5 flex gap-1.5 overflow-x-auto px-1 pb-1">
            <BotaoFiltro ativo={regiao === null} onClick={() => setRegiao(null)}>
              Todas
            </BotaoFiltro>
            {regioes.map(([id, titulo]) => (
              <BotaoFiltro key={id} ativo={regiao === id} onClick={() => setRegiao(id)}>
                {titulo}
              </BotaoFiltro>
            ))}
          </nav>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {estudosVisiveis.map((quiz, indice) => (
              <CardQuiz
                key={quiz.slug}
                quiz={quiz}
                indice={Math.min(indice, 10)}
                recorde={recordes[quiz.slug]}
                formato="capa"
              />
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-xl border border-sky-500/20 bg-sky-500/[0.04] p-4 text-xs leading-relaxed text-muted-foreground">
          <p className="font-bold text-foreground">Como usar sem se enganar</p>
          <p className="mt-1">
            O quiz mede reconhecimento, não substitui a primeira leitura. Se uma região ainda é
            nova, percorra as demarcações no atlas com o roteiro ao lado e só depois venha medir —
            responder no chute e ler o comentário depois ensina bem menos do que estudar antes e
            testar em seguida.
          </p>
        </section>
      </main>
    </div>
  )
}

function Selo({ icone: Icone, texto }: { icone: typeof Target; texto: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-400/[0.07] px-3 py-1.5 backdrop-blur">
      <Icone className="h-3.5 w-3.5 text-sky-300" />
      {texto}
    </span>
  )
}

function BotaoFiltro({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
        ativo
          ? 'border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300'
          : 'border-border bg-muted/20 text-muted-foreground hover:border-sky-500/40 hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}

function Medalha({ valor }: { valor: number }) {
  return (
    <span
      title={`Seu melhor resultado: ${valor}%`}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-clinical text-[10px] font-bold ${
        valor >= 70
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
      }`}
    >
      <Trophy className="h-3 w-3" /> {valor}%
    </span>
  )
}

function CardQuiz({
  quiz,
  indice,
  recorde,
  formato,
}: {
  quiz: ResumoQuizRaioX
  indice: number
  recorde?: number
  formato: 'capa' | 'largo'
}) {
  return (
    <Link
      href={`/manual-clinico/radiologia/raio-x/quiz/${quiz.slug}`}
      prefetch={false}
      style={{ ['--rx-i' as string]: indice }}
      className={`rx-entra group flex overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/10 ${
        formato === 'capa' ? 'flex-col' : ''
      }`}
    >
      {formato === 'capa' ? (
        <div className="relative aspect-[4/3] overflow-hidden bg-black">
          <FilmeImagem
            src={quiz.capa}
            alt=""
            larguraMobile={384}
            larguraDesktop={384}
            qualidade={65}
            comEsqueleto
            className="absolute inset-0 h-full w-full object-contain transition duration-700 group-hover:scale-[1.04]"
          />
          <CantosFilme />
          {quiz.incidencia && (
            <span className="absolute left-3 top-3 rounded-full border border-sky-300/25 bg-black/70 px-2.5 py-1 font-clinical text-[10px] font-bold uppercase tracking-widest text-sky-200 backdrop-blur">
              {quiz.incidencia}
            </span>
          )}
          {recorde !== undefined && (
            <span className="absolute right-3 top-3">
              <Medalha valor={recorde} />
            </span>
          )}
        </div>
      ) : (
        <div className="relative w-[38%] shrink-0 overflow-hidden bg-black">
          <FilmeImagem
            src={quiz.capa}
            alt=""
            larguraMobile={256}
            larguraDesktop={384}
            qualidade={62}
            comEsqueleto
            className="absolute inset-0 h-full w-full object-cover object-top opacity-80 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-card" />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <p className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
          {quiz.subtitulo}
        </p>
        <h3 className="mt-1 font-heading font-semibold leading-snug transition group-hover:text-sky-600 dark:group-hover:text-sky-400">
          {quiz.titulo}
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-muted-foreground">
          {quiz.descricao}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2.5">
          <span className="inline-flex items-center gap-1.5 font-clinical text-[10px] uppercase tracking-wider text-muted-foreground">
            <ScanLine className="h-3 w-3" /> {quiz.total} questões
          </span>
          <span className="inline-flex items-center gap-1.5">
            {formato === 'largo' && recorde !== undefined && <Medalha valor={recorde} />}
            <ChevronRight className="h-4 w-4 shrink-0 text-sky-500 transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}
