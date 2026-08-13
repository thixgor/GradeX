'use client'

/**
 * Quiz de identificação do Atlas — escolha do recorte.
 *
 * O acervo já é uma prova pronta: número na peça de um lado, nome do outro.
 * Aqui a ordem se inverte — o aluno vê o marcador sozinho, sem rótulo, e diz
 * que estrutura é. O que sustenta a tela é a resposta comentada: em vez de
 * "certo/errado", vem o raciocínio de identificação, o aprofundamento e o
 * comentário de cada alternativa, porque numa questão de identificação metade
 * do aprendizado está em entender por que **não** era a outra.
 *
 * Esta metade só escolhe de onde vêm as perguntas — e por isso não carrega
 * nada do acervo até o aluno apontar um sistema, nem o texto das fichas, que
 * vem junto da rodada (`quiz-rodada`, importado sob demanda).
 */

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { carregarAcervo, prepararAcervo } from '@/lib/atlas-anatomia/acervo-cliente'
import {
  contarEstruturas,
  ocorrenciasDoAcervo,
  regioesDoSistema,
  type Ocorrencia,
} from '@/lib/atlas-anatomia/recorte-quiz'
import type { ResumoAnatomia } from '@/lib/anatomia/tipos'
import { ArrowLeft, Loader2, Play, Target } from 'lucide-react'

const Rodada = dynamic(() => import('@/components/anatomia/quiz-rodada'), {
  ssr: false,
  loading: () => (
    <div className="surface-page flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
})

const TAMANHOS = [10, 20, 30]

/**
 * Universo de perguntas do recorte escolhido.
 *
 * O acervo chega por sistema. Escolher "acervo inteiro" pede os dez de uma vez;
 * escolher um sistema pede só ele — que é o caso comum e custa poucos KB. Como
 * `carregarAcervo` guarda o que já buscou, voltar a uma configuração anterior
 * não gera pedido nenhum.
 */
function useOcorrencias(sistemaSlug: string | null, ativo = true) {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[] | null>(null)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    if (!ativo) return
    let vivo = true
    setOcorrencias(null)
    setErro(false)
    carregarAcervo(sistemaSlug || 'todos')
      .then(sistemas => {
        if (vivo) setOcorrencias(ocorrenciasDoAcervo(sistemas))
      })
      .catch(() => {
        if (vivo) setErro(true)
      })
    return () => {
      vivo = false
    }
  }, [sistemaSlug, ativo])

  return { ocorrencias, erro }
}

export default function QuizAtlas({ catalogo }: { catalogo: ResumoAnatomia }) {
  const router = useRouter()
  const parametros = useSearchParams()

  const sistemaSlug = parametros.get('sistema')
  const regiao = parametros.get('regiao')
  const quantidade = Number(parametros.get('n')) || 0
  const semente = Number(parametros.get('s')) || 0

  const emAndamento = quantidade > 0 && semente > 0
  const { ocorrencias, erro } = useOcorrencias(sistemaSlug, emAndamento)

  if (!emAndamento) {
    return (
      <Configuracao
        catalogo={catalogo}
        onComecar={(busca: string) => router.push(`/anatomia/atlas-anatomia/quiz?${busca}`)}
      />
    )
  }

  if (erro) {
    return (
      <main className="surface-page flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-heading text-lg font-semibold">Não foi possível montar a rodada</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          O acervo não respondeu. Verifique a conexão e tente de novo.
        </p>
        <button
          type="button"
          onClick={() => router.push('/anatomia/atlas-anatomia/quiz')}
          className="mt-1 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
        >
          Voltar à configuração
        </button>
      </main>
    )
  }

  if (!ocorrencias) {
    return (
      <main className="surface-page flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Sorteando as estruturas da rodada…</p>
      </main>
    )
  }

  return (
    <Rodada
      key={`${sistemaSlug}:${regiao}:${quantidade}:${semente}`}
      ocorrencias={ocorrencias}
      sistemaSlug={sistemaSlug}
      regiao={regiao}
      quantidade={quantidade}
      semente={semente}
      onReconfigurar={() => router.push('/anatomia/atlas-anatomia/quiz')}
      onRefazer={() =>
        router.push(
          `/anatomia/atlas-anatomia/quiz?${new URLSearchParams({
            ...(sistemaSlug ? { sistema: sistemaSlug } : {}),
            ...(regiao ? { regiao } : {}),
            n: String(quantidade),
            s: String(Date.now() % 100000),
          }).toString()}`,
        )
      }
    />
  )
}

/* ══════════════════════════ Configuração ══════════════════════════ */

function Configuracao({
  catalogo,
  onComecar,
}: {
  catalogo: ResumoAnatomia
  onComecar: (busca: string) => void
}) {
  const [sistemaSlug, setSistemaSlug] = useState<string | null>(null)
  const [regiao, setRegiao] = useState<string | null>(null)
  const [quantidade, setQuantidade] = useState(10)

  // Regiões e contagem por região dependem do acervo — buscado só depois que o
  // aluno aponta um sistema, e só o sistema apontado. Enquanto ele está em
  // "acervo inteiro", o total já veio no resumo e não custa pedido nenhum.
  const { ocorrencias } = useOcorrencias(sistemaSlug, !!sistemaSlug)

  const listaRegioes = useMemo(
    () => (sistemaSlug && ocorrencias ? regioesDoSistema(ocorrencias, sistemaSlug) : []),
    [ocorrencias, sistemaSlug],
  )
  const disponiveis = useMemo(() => {
    if (!sistemaSlug) return catalogo.totalMarcadores
    if (!ocorrencias) return catalogo.sistemas.find(item => item.slug === sistemaSlug)?.marcadores ?? 0
    return contarEstruturas(ocorrencias, { sistemaSlug, regiao })
  }, [catalogo, ocorrencias, sistemaSlug, regiao])

  // A rodada é o passo seguinte garantido: o pacote dela vem no tempo ocioso,
  // enquanto o aluno ainda decide o recorte.
  useEffect(() => {
    const adiantar = () => void import('@/components/anatomia/quiz-rodada').catch(() => {})
    const temOcioso = typeof window.requestIdleCallback === 'function'
    const agendado = temOcioso ? window.requestIdleCallback(adiantar) : window.setTimeout(adiantar, 1200)
    return () => {
      if (temOcioso) window.cancelIdleCallback(agendado)
      else window.clearTimeout(agendado)
    }
  }, [])

  function comecar() {
    const busca = new URLSearchParams({
      ...(sistemaSlug ? { sistema: sistemaSlug } : {}),
      ...(regiao ? { regiao } : {}),
      n: String(quantidade),
      s: String(Date.now() % 100000),
    })
    onComecar(busca.toString())
  }

  return (
    <main className="surface-page min-h-screen">
      <header className="relative isolate overflow-hidden border-b border-border bg-slate-950">
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_20%_0%,rgba(245,158,11,0.22),transparent_60%),radial-gradient(ellipse_50%_50%_at_85%_20%,rgba(16,185,129,0.18),transparent_60%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl px-4 pb-10 pt-7 sm:pb-12 sm:pt-9">
          <Link
            href="/anatomia/atlas-anatomia"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/55 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Atlas de Anatomia
          </Link>

          <div className="mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/25 bg-amber-400/12 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-amber-300">
              <Target className="h-3.5 w-3.5" /> Quiz de identificação
            </span>
          </div>
          <h1 className="font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl">
            Você reconhece a estrutura?
          </h1>
          <p className="mt-3.5 max-w-2xl text-base leading-relaxed text-white/65">
            A prancha aparece com um único marcador e sem rótulo. Você diz qual é — e a resposta vem comentada, com o
            raciocínio de identificação, o aprofundamento da estrutura e o porquê de cada alternativa errada.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
        <Campo titulo="De onde vêm as questões" numero={1}>
          <div className="flex flex-wrap gap-2">
            <Chip
              ativo={sistemaSlug === null}
              onClick={() => {
                setSistemaSlug(null)
                setRegiao(null)
              }}
            >
              Acervo inteiro
            </Chip>
            {catalogo.sistemas.map(sistema => (
              <Chip
                key={sistema.slug}
                ativo={sistemaSlug === sistema.slug}
                // Passar o dedo/mouse já adianta o acervo daquele sistema: as
                // regiões aparecem no clique, sem espera visível.
                onPointerEnter={() => prepararAcervo(sistema.slug)}
                onClick={() => {
                  setSistemaSlug(sistema.slug)
                  setRegiao(null)
                }}
              >
                {sistema.titulo}
              </Chip>
            ))}
          </div>
        </Campo>

        {listaRegioes.length > 1 && (
          <Campo titulo="Quer estreitar mais?" numero={2}>
            <div className="flex flex-wrap gap-2">
              <Chip ativo={regiao === null} onClick={() => setRegiao(null)}>
                Sistema todo
              </Chip>
              {listaRegioes.map(item => (
                <Chip key={item.nome} ativo={regiao === item.nome} onClick={() => setRegiao(item.nome)}>
                  {item.nome}
                  <span className="ml-1.5 text-[10px] opacity-60">{item.estruturas}</span>
                </Chip>
              ))}
            </div>
          </Campo>
        )}

        <Campo titulo="Quantas questões" numero={listaRegioes.length > 1 ? 3 : 2}>
          <div className="flex flex-wrap gap-2">
            {TAMANHOS.map(tamanho => (
              <Chip key={tamanho} ativo={quantidade === tamanho} onClick={() => setQuantidade(tamanho)}>
                {tamanho} questões
              </Chip>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {disponiveis.toLocaleString('pt-BR')} estruturas marcadas disponíveis neste recorte. Cada rodada sorteia
            estruturas diferentes, sem repetir a mesma duas vezes.
          </p>
        </Campo>

        <button
          type="button"
          onClick={comecar}
          disabled={disponiveis < 4}
          className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-8"
        >
          <Play className="h-4 w-4" /> Começar o quiz
        </button>
        {disponiveis < 4 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Este recorte tem estruturas de menos para montar alternativas. Escolha um conjunto maior.
          </p>
        )}
      </section>
    </main>
  )
}

function Campo({ titulo, numero, children }: { titulo: string; numero: number; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/12 text-[11px] font-black text-primary">
          {numero}
        </span>
        {titulo}
      </h2>
      {children}
    </div>
  )
}

function Chip({
  ativo,
  onClick,
  onPointerEnter,
  children,
}: {
  ativo: boolean
  onClick: () => void
  onPointerEnter?: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      aria-pressed={ativo}
      className={`inline-flex items-center rounded-xl border px-3 py-2 text-[13px] font-semibold transition ${
        ativo
          ? 'border-primary bg-primary/12 text-primary'
          : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}
