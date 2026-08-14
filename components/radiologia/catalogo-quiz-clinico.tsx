'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ClipboardList,
  Crosshair,
  HeartPulse,
  Layers,
  Play,
  ScanSearch,
  ShieldAlert,
  Stethoscope,
  Trophy,
  Wind,
} from 'lucide-react'
import { FilmeSprite } from '@/components/radiologia/quiz-caso-clinico'
import type { CategoriaCasoRaioX } from '@/lib/radiologia/casos-raio-x'
import type { ResumoQuizClinico } from '@/lib/radiologia/quiz-casos-raio-x'

/**
 * Índice dos quizzes de casos clínicos.
 *
 * Recebe apenas os resumos — slug, título, capa e contagem. As consultas e as
 * respostas comentadas ficam na página de cada quiz: trazê-las para cá
 * significaria mandar os 72 dossiês para o navegador de quem só quer escolher
 * por onde começar.
 */

const CHAVE_RECORDE = (slug: string) => `rx-quiz-clinico:${slug}`

const ICONES: Record<CategoriaCasoRaioX, typeof HeartPulse> = {
  cardiovascular: HeartPulse,
  variantes: Layers,
  'vias-aereas': Wind,
  dispositivos: Stethoscope,
  pneumotorax: ShieldAlert,
  'cancer-pulmao': Crosshair,
  mediastino: ScanSearch,
}

export function CatalogoQuizClinico({
  quizzes,
  totalCasos,
}: {
  quizzes: ResumoQuizClinico[]
  totalCasos: number
}) {
  const plantao = quizzes.find((quiz) => quiz.tipo === 'plantao')
  const capitulos = quizzes.filter((quiz) => quiz.tipo === 'categoria')
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

  return (
    <div className="rx surface-page min-h-screen">
      <header className="rx-painel rx-grade rx-varredura relative overflow-hidden border-b border-sky-400/15">
        <div className="container relative mx-auto max-w-6xl px-4 pb-7 pt-6">
          <Link
            href="/manual-clinico/radiologia/raio-x/casos"
            className="-m-2 inline-flex items-center gap-1.5 rounded-lg p-2 text-sm text-sky-100/60 transition hover:text-sky-100"
          >
            <ArrowLeft className="h-4 w-4" /> Atlas de casos e alterações
          </Link>

          {/* `.editorial-mark` é `inline-flex`: sem um bloco em volta, a marca
              subiria para a mesma linha do link de voltar. */}
          <div className="mt-5">
            <p className="editorial-mark !text-sky-300/80 [&::before]:bg-sky-300/60">
              Quiz de casos clínicos
            </p>
          </div>
          <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-white sm:text-[2rem] sm:leading-tight">
            O paciente entrou. O que a radiografia dele mostra?
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-sky-100/65 sm:text-base">
            Cada caso começa como começa no plantão: a queixa, a história, os antecedentes, os
            sinais vitais e o exame físico. Só então o filme sobe — limpo, sem nenhuma marcação. Você
            identifica o achado e a resposta devolve o mesmo filme marcado, com o mecanismo da
            imagem, a dissecção estrutura por estrutura, as armadilhas e o porquê de cada
            alternativa errada.
          </p>

          <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-bold text-sky-100/70">
            <Selo icone={ClipboardList} texto={`${totalCasos} consultas escritas`} />
            <Selo icone={Layers} texto={`${capitulos.length} capítulos`} />
            <Selo icone={Crosshair} texto="Filme limpo e filme marcado" />
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 pb-16 pt-7 sm:pt-9">
        {plantao && (
          <Link
            href={`/manual-clinico/radiologia/raio-x/casos/quiz/${plantao.slug}`}
            className="group mb-9 grid gap-4 overflow-hidden rounded-2xl border border-sky-500/25 bg-gradient-to-br from-sky-500/[0.09] via-card to-violet-500/[0.07] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/10 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500 text-white shadow-lg shadow-sky-500/20">
              <Play className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-[10px] font-black uppercase tracking-widest text-sky-600 dark:text-sky-400">
                {plantao.subtitulo} · {plantao.total} casos
              </span>
              <strong className="mt-1 block font-heading text-lg font-semibold sm:text-xl">
                {plantao.titulo}
              </strong>
              <span className="mt-1.5 block max-w-3xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {plantao.descricao}
              </span>
            </span>
            <span className="inline-flex items-center gap-2">
              {recordes[plantao.slug] !== undefined && <Medalha valor={recordes[plantao.slug]} />}
              <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400">
                Começar <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </span>
          </Link>
        )}

        <section>
          <div className="mb-4">
            <p className="editorial-mark">Um capítulo por vez</p>
            <h2 className="mt-1.5 font-heading text-xl font-semibold tracking-tight sm:text-2xl">
              Quizzes por capítulo
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Saber de antemão que o caso é de pneumotórax facilita — e é justamente por isso que
              serve para estudar um tema. Quando ele estiver firme, o plantão mistura os sete e tira
              essa pista.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {capitulos.map((quiz, indice) => (
              <CardQuiz
                key={quiz.slug}
                quiz={quiz}
                indice={Math.min(indice, 10)}
                recorde={recordes[quiz.slug]}
              />
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-3.5 sm:grid-cols-3">
          <Passo numero={1} titulo="Leia a consulta inteira">
            Resista à vontade de pular direto para a imagem. A pergunta clínica é o que decide o que
            você vai procurar no filme — e, no plantão, ela sempre vem antes.
          </Passo>
          <Passo numero={2} titulo="Percorra o filme na ordem">
            Cada capítulo tem um roteiro sistemático. Ler sempre na mesma ordem é o que evita o erro
            clássico: achar a primeira alteração e parar de olhar o resto.
          </Passo>
          <Passo numero={3} titulo="Só então responda">
            Depois da resposta o filme marcado acende e o comentário abre. Errar aqui é barato — é
            no comentário que a leitura melhora.
          </Passo>
        </section>

        <section className="mt-10 rounded-xl border border-sky-500/20 bg-sky-500/[0.04] p-4 text-xs leading-relaxed text-muted-foreground">
          <p className="font-bold text-foreground">Escopo educacional</p>
          <p className="mt-1">
            Os pacientes destas consultas são fictícios; as apresentações seguem o que a literatura
            descreve para cada alteração. Material de estudo de radiologia: não substitui laudo
            médico, avaliação clínica, protocolos institucionais nem a escolha do método de imagem
            adequado a cada pergunta.
          </p>
        </section>
      </main>
    </div>
  )
}

function Selo({ icone: Icone, texto }: { icone: typeof HeartPulse; texto: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-400/[0.07] px-3 py-1.5 backdrop-blur">
      <Icone className="h-3.5 w-3.5 text-sky-300" />
      {texto}
    </span>
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

function Passo({
  numero,
  titulo,
  children,
}: {
  numero: number
  titulo: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 font-clinical text-xs font-black text-sky-600 dark:text-sky-400">
        {numero}
      </span>
      <h3 className="mt-2.5 font-heading text-sm font-semibold">{titulo}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{children}</p>
    </div>
  )
}

function CardQuiz({
  quiz,
  indice,
  recorde,
}: {
  quiz: ResumoQuizClinico
  indice: number
  recorde?: number
}) {
  const Icone = quiz.categoria ? ICONES[quiz.categoria] : ClipboardList

  return (
    <Link
      href={`/manual-clinico/radiologia/raio-x/casos/quiz/${quiz.slug}`}
      prefetch={false}
      style={{ ['--rx-i' as string]: indice }}
      className="rx-entra group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/10"
    >
      <div className="relative overflow-hidden bg-black">
        <FilmeSprite
          imagem={quiz.capa}
          className="w-full transition duration-700 group-hover:scale-[1.04]"
        />
        {recorde !== undefined && (
          <span className="absolute right-3 top-3">
            <Medalha valor={recorde} />
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
          <Icone className="h-3.5 w-3.5" /> {quiz.subtitulo}
        </p>
        <h3 className="mt-1 font-heading font-semibold leading-snug transition group-hover:text-sky-600 dark:group-hover:text-sky-400">
          {quiz.titulo}
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-muted-foreground">
          {quiz.descricao}
        </p>
        {quiz.pergunta && (
          <p className="mt-2.5 border-l-2 border-sky-500/40 pl-2.5 text-[11px] italic leading-relaxed text-muted-foreground">
            {quiz.pergunta}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2.5">
          <span className="inline-flex items-center gap-1.5 font-clinical text-[10px] uppercase tracking-wider text-muted-foreground">
            <ClipboardList className="h-3 w-3" /> {quiz.total} {quiz.total === 1 ? 'caso' : 'casos'}
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-sky-500 transition group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  )
}
