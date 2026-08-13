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
  chaveDeRegiao,
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
/**
 * Universo de perguntas dos sistemas escolhidos.
 *
 * O acervo chega por sistema. "Acervo inteiro" pede os dez de uma vez; um
 * recorte pede só o que foi marcado — que é o caso comum e custa poucos KB.
 * Como `carregarAcervo` guarda o que já buscou por chave, a lista é ordenada
 * para "esquelético + muscular" e "muscular + esquelético" serem o mesmo pedido.
 */
function chaveDoPedido(sistemas: string[]) {
  return sistemas.length === 0 ? 'todos' : [...sistemas].sort().join(',')
}

function useOcorrencias(sistemas: string[], ativo = true) {
  const chave = chaveDoPedido(sistemas)
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[] | null>(null)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    if (!ativo) return
    let vivo = true
    setOcorrencias(null)
    setErro(false)
    carregarAcervo(chave)
      .then(carregados => {
        if (vivo) setOcorrencias(ocorrenciasDoAcervo(carregados))
      })
      .catch(() => {
        if (vivo) setErro(true)
      })
    return () => {
      vivo = false
    }
  }, [chave, ativo])

  return { ocorrencias, erro }
}

/** Monta a busca da URL repetindo a chave, em vez de separar por vírgula: os
 *  nomes das regiões vêm do acervo e não precisam de um separador reservado. */
function buscaDaRodada(
  sistemas: string[],
  regioes: string[],
  quantidade: number,
  semente: number,
): string {
  const busca = new URLSearchParams()
  for (const sistema of sistemas) busca.append('sistema', sistema)
  for (const regiao of regioes) busca.append('regiao', regiao)
  busca.set('n', String(quantidade))
  busca.set('s', String(semente))
  return busca.toString()
}

export default function QuizAtlas({ catalogo }: { catalogo: ResumoAnatomia }) {
  const router = useRouter()
  const parametros = useSearchParams()

  // `getAll` porque o recorte é plural — e um link antigo com um `sistema` só
  // continua sendo lido, agora como lista de um item.
  const sistemas = parametros.getAll('sistema').filter(Boolean)
  const regioes = parametros.getAll('regiao').filter(Boolean)
  const quantidade = Number(parametros.get('n')) || 0
  const semente = Number(parametros.get('s')) || 0

  const emAndamento = quantidade > 0 && semente > 0
  const { ocorrencias, erro } = useOcorrencias(sistemas, emAndamento)

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
      key={`${sistemas.join(',')}:${regioes.join(',')}:${quantidade}:${semente}`}
      ocorrencias={ocorrencias}
      sistemas={sistemas}
      regioes={regioes}
      quantidade={quantidade}
      semente={semente}
      onReconfigurar={() => router.push('/anatomia/atlas-anatomia/quiz')}
      onRefazer={() =>
        router.push(
          `/anatomia/atlas-anatomia/quiz?${buscaDaRodada(sistemas, regioes, quantidade, Date.now() % 100000)}`,
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
  const [sistemas, setSistemas] = useState<string[]>([])
  const [regioes, setRegioes] = useState<string[]>([])
  const [quantidade, setQuantidade] = useState(10)

  // Regiões e contagens dependem do acervo — buscado só depois que o aluno
  // aponta um sistema, e só os sistemas apontados. Enquanto ele está em "acervo
  // inteiro", os números já vieram no resumo e não custam pedido nenhum.
  const { ocorrencias } = useOcorrencias(sistemas, sistemas.length > 0)

  function alternarSistema(slug: string) {
    setSistemas(atuais => {
      const marcado = atuais.includes(slug)
      // Desmarcar o sistema leva junto as regiões dele: deixar chave órfã no
      // recorte faria o quiz filtrar por algo que não está mais em jogo.
      if (marcado) setRegioes(anteriores => anteriores.filter(chave => !chave.startsWith(`${slug}:`)))
      return marcado ? atuais.filter(item => item !== slug) : [...atuais, slug]
    })
  }

  function alternarRegiao(chave: string) {
    setRegioes(atuais => (atuais.includes(chave) ? atuais.filter(item => item !== chave) : [...atuais, chave]))
  }

  /** Regiões oferecidas, agrupadas por sistema, na ordem em que foram marcados. */
  const gruposDeRegiao = useMemo(() => {
    if (!ocorrencias) return []
    return sistemas
      .map(slug => ({
        slug,
        titulo: catalogo.sistemas.find(item => item.slug === slug)?.titulo || slug,
        regioes: regioesDoSistema(ocorrencias, slug),
      }))
      // Sistema com uma região só não tem o que recortar — mostrar o botão
      // sozinho seria oferecer uma escolha que não muda nada.
      .filter(grupo => grupo.regioes.length > 1)
  }, [catalogo.sistemas, ocorrencias, sistemas])

  const disponiveis = useMemo(() => {
    if (sistemas.length === 0) return catalogo.totalMarcadores
    // Antes de o acervo chegar, o resumo já sabe quantos marcadores cada sistema
    // tem: o número aparece na hora e só se refina quando as regiões entram.
    if (!ocorrencias) {
      return sistemas.reduce(
        (total, slug) => total + (catalogo.sistemas.find(item => item.slug === slug)?.marcadores ?? 0),
        0,
      )
    }
    return contarEstruturas(ocorrencias, { sistemas, regioes })
  }, [catalogo, ocorrencias, sistemas, regioes])

  const resumoDoRecorte = useMemo(() => {
    if (sistemas.length === 0) return 'Acervo inteiro'
    const nomes = sistemas.map(slug => catalogo.sistemas.find(item => item.slug === slug)?.titulo || slug)
    const comRegiao = regioes.length > 0 ? ` · ${regioes.length} ${regioes.length === 1 ? 'região' : 'regiões'}` : ''
    return nomes.join(' + ') + comRegiao
  }, [catalogo.sistemas, sistemas, regioes])

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
    onComecar(buscaDaRodada(sistemas, regioes, quantidade, Date.now() % 100000))
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
        <Campo
          titulo="De onde vêm as questões"
          numero={1}
          nota="Pode marcar mais de um — as questões vêm de tudo o que estiver aceso."
        >
          <div className="flex flex-wrap gap-2">
            <Chip
              ativo={sistemas.length === 0}
              onClick={() => {
                setSistemas([])
                setRegioes([])
              }}
            >
              Acervo inteiro
            </Chip>
            {catalogo.sistemas.map(sistema => (
              <Chip
                key={sistema.slug}
                ativo={sistemas.includes(sistema.slug)}
                // Passar o dedo/mouse já adianta o acervo daquele sistema: as
                // regiões aparecem no clique, sem espera visível.
                onPointerEnter={() => prepararAcervo(sistema.slug)}
                onClick={() => alternarSistema(sistema.slug)}
              >
                {sistema.titulo}
              </Chip>
            ))}
          </div>
        </Campo>

        {gruposDeRegiao.length > 0 && (
          <Campo
            titulo="Quer estreitar mais?"
            numero={2}
            nota="Sem nada marcado, o sistema entra inteiro. Marque as regiões que quiser treinar."
          >
            <div className="space-y-3.5">
              {gruposDeRegiao.map(grupo => (
                <div key={grupo.slug}>
                  {/* O nome do sistema fica visível mesmo com um só marcado: é
                      ele que diz a qual sistema cada região pertence quando há
                      "Tronco" em mais de um. */}
                  <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                    {grupo.titulo}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {grupo.regioes.map(item => {
                      const chave = chaveDeRegiao(grupo.slug, item.nome)
                      return (
                        <Chip key={chave} ativo={regioes.includes(chave)} onClick={() => alternarRegiao(chave)}>
                          {item.nome}
                          <span className="ml-1.5 text-[10px] opacity-60">{item.estruturas}</span>
                        </Chip>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Campo>
        )}

        <Campo titulo="Quantas questões" numero={gruposDeRegiao.length > 0 ? 3 : 2}>
          <div className="flex flex-wrap gap-2">
            {TAMANHOS.map(tamanho => (
              <Chip key={tamanho} ativo={quantidade === tamanho} onClick={() => setQuantidade(tamanho)}>
                {tamanho} questões
              </Chip>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            <span className="font-bold text-foreground">{resumoDoRecorte}</span> ·{' '}
            {disponiveis.toLocaleString('pt-BR')} estruturas marcadas disponíveis. Cada rodada sorteia estruturas
            diferentes, sem repetir a mesma duas vezes.
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

function Campo({
  titulo,
  numero,
  nota,
  children,
}: {
  titulo: string
  numero: number
  /** Uma linha explicando a regra do campo — o que "nada marcado" significa. */
  nota?: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-6">
      <h2 className="flex items-center gap-2 text-sm font-bold">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/12 text-[11px] font-black text-primary">
          {numero}
        </span>
        {titulo}
      </h2>
      {nota && <p className="mb-3 ml-8 mt-1 text-xs leading-relaxed text-muted-foreground">{nota}</p>}
      {!nota && <div className="mb-3" />}
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
