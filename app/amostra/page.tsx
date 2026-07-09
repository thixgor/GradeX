'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Stethoscope,
  Sparkles,
} from 'lucide-react'
import { PublicPageShell } from '@/components/public-page-shell'
import { cn } from '@/lib/utils'

type Alternativa = { letra: string; texto: string; correta: boolean }
type Questao = {
  id: string
  enunciado: string
  explicacao: string
  imagemUrl: string | null
  alternativas: Alternativa[]
  dificuldade: string | null
  fonte: string | null
  ano: number | null
}
type Patologia = {
  slug: string
  nome: string
  sistema: string | null
  cid10: string | null
  preview: string
}

export default function AmostraPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [questoes, setQuestoes] = useState<Questao[]>([])
  const [patologia, setPatologia] = useState<Patologia | null>(null)
  const [respostas, setRespostas] = useState<Record<string, string>>({})

  useEffect(() => {
    let ativo = true
    fetch('/api/amostra')
      .then(async (res) => {
        if (!res.ok) throw new Error('falha')
        return res.json()
      })
      .then((data) => {
        if (!ativo) return
        setQuestoes(data.questoes || [])
        setPatologia(data.patologia || null)
      })
      .catch(() => ativo && setErro('Não foi possível carregar a amostra agora. Tente recarregar a página.'))
      .finally(() => ativo && setLoading(false))
    return () => {
      ativo = false
    }
  }, [])

  const respondidas = Object.keys(respostas).length
  const acertos = questoes.filter((q) => {
    const escolha = respostas[q.id]
    return escolha && q.alternativas.find((a) => a.letra === escolha)?.correta
  }).length

  function escolher(questaoId: string, letra: string) {
    setRespostas((prev) => (prev[questaoId] ? prev : { ...prev, [questaoId]: letra }))
  }

  return (
    <PublicPageShell
      maxWidth="max-w-3xl"
      rightSlot={
        <button
          type="button"
          onClick={() => router.push('/auth/login?mode=register')}
          className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs sm:text-sm font-bold text-secondary-foreground shadow-sm hover:bg-secondary/90 transition"
        >
          Criar conta
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      }
    >
      <div className="mb-8">
        <p className="editorial-mark mb-2">Amostra grátis · sem cadastro</p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-[2.1rem] leading-tight">
          10 questões comentadas para testar agora
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
          Responda, veja o gabarito na hora e leia o comentário. É uma fatia do banco — a plataforma
          completa tem provas, flashcards, cronograma e o Manual Clínico.
        </p>
      </div>

      {loading && (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      )}

      {erro && !loading && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-5 text-sm text-red-700 dark:text-red-200">
          {erro}
        </div>
      )}

      {!loading && !erro && questoes.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
          A amostra está sendo preparada. Volte em instantes ou{' '}
          <button
            type="button"
            onClick={() => router.push('/auth/login?mode=register')}
            className="font-semibold text-primary underline underline-offset-2"
          >
            crie sua conta grátis
          </button>
          .
        </div>
      )}

      <div className="space-y-4">
        {questoes.map((q, idx) => {
          const escolha = respostas[q.id]
          const respondida = !!escolha
          return (
            <article
              key={q.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5"
            >
              <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span className="font-clinical font-bold text-primary">Q{idx + 1}</span>
                {q.fonte && <span>· {q.fonte}</span>}
                {q.ano && <span>· {q.ano}</span>}
                {q.dificuldade && <span className="capitalize">· {q.dificuldade}</span>}
              </div>

              <p className="mb-4 whitespace-pre-line text-sm leading-relaxed text-foreground sm:text-[15px]">
                {q.enunciado}
              </p>

              {q.imagemUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={q.imagemUrl}
                  alt="Imagem da questão"
                  className="mb-4 max-h-80 rounded-lg border border-border"
                />
              )}

              <div className="space-y-2">
                {q.alternativas.map((alt) => {
                  const selecionada = escolha === alt.letra
                  return (
                    <button
                      key={alt.letra}
                      type="button"
                      disabled={respondida}
                      onClick={() => escolher(q.id, alt.letra)}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors sm:px-4 sm:py-3',
                        !respondida &&
                          'border-border bg-background hover:border-primary/35 hover:bg-muted/40',
                        respondida &&
                          alt.correta &&
                          'border-primary/40 bg-primary/10',
                        respondida &&
                          selecionada &&
                          !alt.correta &&
                          'border-red-500/40 bg-red-500/10',
                        respondida &&
                          !alt.correta &&
                          !selecionada &&
                          'border-border bg-muted/20 opacity-70'
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold font-clinical',
                          respondida && alt.correta
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-card text-muted-foreground'
                        )}
                      >
                        {alt.letra}
                      </span>
                      <span className="flex-1 text-sm leading-relaxed text-foreground">
                        {alt.texto}
                      </span>
                      {respondida && alt.correta && (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                      )}
                      {respondida && selecionada && !alt.correta && (
                        <XCircle className="h-5 w-5 shrink-0 text-red-500" />
                      )}
                    </button>
                  )
                })}
              </div>

              {respondida && q.explicacao && (
                <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3.5 sm:p-4">
                  <p className="mb-1 font-clinical text-[10px] font-bold uppercase tracking-wider text-primary">
                    Comentário
                  </p>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                    {q.explicacao}
                  </p>
                </div>
              )}
            </article>
          )
        })}
      </div>

      {respondidas > 0 && (
        <div className="mt-5 rounded-xl border border-border bg-card p-4 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            Você respondeu{' '}
            <strong className="text-foreground tabular-nums">{respondidas}</strong> de{' '}
            {questoes.length} e acertou{' '}
            <strong className="text-primary tabular-nums">{acertos}</strong>.
          </p>
        </div>
      )}

      {patologia && (
        <section className="mt-8 rounded-xl border border-amber-500/25 bg-amber-500/5 p-5 sm:p-6">
          <div className="mb-2 flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <Stethoscope className="h-4 w-4" />
            <span className="font-clinical text-[10px] font-bold uppercase tracking-wider">
              Amostra do Manual Clínico
            </span>
          </div>
          <h2 className="font-heading text-lg font-semibold text-foreground sm:text-xl">
            {patologia.nome}
          </h2>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {patologia.sistema && <span>{patologia.sistema}</span>}
            {patologia.cid10 && (
              <span className="font-clinical">CID-10: {patologia.cid10}</span>
            )}
          </div>
          {patologia.preview && (
            <p className="mt-3 text-sm leading-relaxed text-foreground/90">{patologia.preview}</p>
          )}
          <Link
            href={`/manual-clinico/${patologia.slug}`}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            Abrir patologia completa
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      )}

      <section className="mt-10 rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
        <p className="editorial-mark mb-2 justify-center">Próximo passo</p>
        <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
          Gostou? Isso é só a amostra.
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          Crie a conta grátis e continue no ritmo da prova — sem cartão, com acesso na hora.
        </p>
        <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push('/auth/login?mode=register')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-6 py-3 text-sm font-bold text-secondary-foreground shadow-md shadow-secondary/25 hover:bg-secondary/90 transition"
          >
            Criar conta grátis
            <ArrowRight className="h-4 w-4" />
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para a home
          </Link>
        </div>
      </section>
    </PublicPageShell>
  )
}
