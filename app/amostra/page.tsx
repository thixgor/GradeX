'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Stethoscope,
  Sparkles,
} from 'lucide-react'

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
    <div className="min-h-screen bg-[#040816] text-slate-100">
      {/* Topo */}
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#040816]/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-7 w-auto" />
          </Link>
          <button
            onClick={() => router.push('/auth/login?mode=register')}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-[#040816] transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #4ADE80 0%, #2DD4BF 100%)' }}
          >
            Criar conta grátis
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10">
        {/* Cabeçalho */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1 text-xs font-semibold text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" />
            Amostra grátis, sem cadastro
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            10 questões comentadas para você testar agora
          </h1>
          <p className="mt-3 max-w-xl text-slate-300">
            Responda, veja o gabarito na hora e leia o comentário. É uma amostra do banco de questões.
            A plataforma completa tem provas com IA, flashcards, cronograma e o Manual Clínico.
          </p>
        </div>

        {loading && (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]" />
            ))}
          </div>
        )}

        {erro && !loading && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-6 text-red-200">{erro}</div>
        )}

        {!loading && !erro && questoes.length === 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 text-slate-300">
            A amostra está sendo preparada. Volte em instantes ou{' '}
            <button onClick={() => router.push('/auth/login?mode=register')} className="font-semibold text-emerald-300 underline">
              crie sua conta grátis
            </button>
            .
          </div>
        )}

        {/* Questões */}
        <div className="space-y-5">
          {questoes.map((q, idx) => {
            const escolha = respostas[q.id]
            const respondida = !!escolha
            return (
              <article key={q.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
                <div className="mb-3 flex items-center gap-3 text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">Questão {idx + 1}</span>
                  {q.fonte && <span>{q.fonte}</span>}
                  {q.ano && <span>· {q.ano}</span>}
                  {q.dificuldade && <span className="capitalize">· {q.dificuldade}</span>}
                </div>

                <p className="mb-4 whitespace-pre-line leading-relaxed text-slate-100">{q.enunciado}</p>

                {q.imagemUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={q.imagemUrl} alt="Imagem da questão" className="mb-4 max-h-80 rounded-xl border border-white/[0.08]" />
                )}

                <div className="space-y-2">
                  {q.alternativas.map((alt) => {
                    const selecionada = escolha === alt.letra
                    let estilo = 'border-white/[0.1] bg-white/[0.02] hover:bg-white/[0.06]'
                    if (respondida) {
                      if (alt.correta) estilo = 'border-emerald-400/40 bg-emerald-400/[0.1]'
                      else if (selecionada) estilo = 'border-red-400/40 bg-red-400/[0.08]'
                      else estilo = 'border-white/[0.06] bg-white/[0.01] opacity-70'
                    }
                    return (
                      <button
                        key={alt.letra}
                        disabled={respondida}
                        onClick={() => escolher(q.id, alt.letra)}
                        className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all ${estilo}`}
                      >
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/[0.15] text-xs font-bold">
                          {alt.letra}
                        </span>
                        <span className="flex-1 text-sm leading-relaxed text-slate-100">{alt.texto}</span>
                        {respondida && alt.correta && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />}
                        {respondida && selecionada && !alt.correta && <XCircle className="h-5 w-5 shrink-0 text-red-400" />}
                      </button>
                    )
                  })}
                </div>

                {respondida && q.explicacao && (
                  <div className="mt-4 rounded-xl border border-teal-400/20 bg-teal-400/[0.05] p-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-teal-300">Comentário</p>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-slate-200">{q.explicacao}</p>
                  </div>
                )}
              </article>
            )
          })}
        </div>

        {/* Progresso simples */}
        {respondidas > 0 && (
          <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 text-center">
            <p className="text-slate-200">
              Você respondeu <strong className="text-white">{respondidas}</strong> de {questoes.length} e acertou{' '}
              <strong className="text-emerald-300">{acertos}</strong>.
            </p>
          </div>
        )}

        {/* Patologia do Manual */}
        {patologia && (
          <section className="mt-10 rounded-2xl border border-amber-300/20 bg-amber-300/[0.05] p-6">
            <div className="mb-3 flex items-center gap-2 text-amber-200">
              <Stethoscope className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wide">Amostra do Manual Clínico</span>
            </div>
            <h2 className="text-xl font-bold text-slate-50">{patologia.nome}</h2>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-400">
              {patologia.sistema && <span>{patologia.sistema}</span>}
              {patologia.cid10 && <span>CID-10: {patologia.cid10}</span>}
            </div>
            {patologia.preview && <p className="mt-3 text-sm leading-relaxed text-slate-200">{patologia.preview}</p>}
            <Link
              href={`/manual-clinico/${patologia.slug}`}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-300/30 bg-amber-300/[0.08] px-4 py-2.5 text-sm font-semibold text-amber-100 transition-all hover:bg-amber-300/[0.15]"
            >
              Abrir patologia completa, sem cadastro
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        )}

        {/* CTA final */}
        <section className="mt-12 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-transparent p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-50">Gostou? Isso é só a amostra.</h2>
          <p className="mx-auto mt-2 max-w-lg text-slate-300">
            Crie sua conta grátis e destrave o banco completo, provas com IA no estilo da sua banca,
            flashcards e cronograma que se adapta ao seu ritmo.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={() => router.push('/auth/login?mode=register')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-base font-bold text-[#040816] transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #4ADE80 0%, #2DD4BF 100%)' }}
            >
              Criar conta grátis
              <ArrowRight className="h-4 w-4" />
            </button>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-slate-100">
              <ArrowLeft className="h-4 w-4" />
              Voltar para a home
            </Link>
          </div>
          <p className="mt-3 text-xs text-slate-500">Grátis no essencial. Sem cartão. Acesso na hora.</p>
        </section>
      </main>
    </div>
  )
}
