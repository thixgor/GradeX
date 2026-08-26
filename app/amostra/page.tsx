'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Flag,
  ListPlus,
  Lock,
  RotateCcw,
  Sparkles,
  Stethoscope,
  Trophy,
  XCircle,
} from 'lucide-react'
import { Logo } from '@/components/logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BarraInferior } from '@/components/ui/barra-inferior'
import { CabecalhoQuiz } from '@/components/banco/cabecalho-quiz'
import { AlternativaQuiz } from '@/components/banco/alternativa-quiz'
import {
  FolhaDeFeedback,
  PainelDaExplicacao,
  TrechoDaCorrecao,
  type VereditoDaQuestao,
} from '@/components/banco/feedback-questao'
import { rolarAte } from '@/components/banco/rolagem-guiada'
import { useEstaNaTela } from '@/components/banco/use-esta-na-tela'
import { HighlightableText } from '@/components/highlightable-text'
import { CLASSE_DA_DIFICULDADE } from '@/lib/banco/aparencia-da-questao'
import type { TextHighlight } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * A amostra pública — 10 questões do banco, sem cadastro.
 *
 * ## Por que ela foi refeita sobre os componentes do banco
 *
 * A versão anterior desenhava a própria interface: dez cartões empilhados numa
 * rolagem, um toque revelava gabarito e comentário de uma vez, e não havia
 * progresso, riscar, veredito nem barra de ação. Funcionava — só que era um
 * QUIZ GENÉRICO. Quem gostava dele não tinha visto o produto; quem não gostava
 * tinha julgado uma coisa que a plataforma não é.
 *
 * Isso é caro justamente aqui: esta é a única tela em que um estranho usa o
 * Domine Aqui antes de decidir qualquer coisa. Ela não deveria PARECER a
 * plataforma — ela deveria SER a plataforma, com o mesmo código.
 *
 * Então a amostra passa a montar exatamente o que `/banco-questoes/[id]`
 * monta, com os mesmos componentes: `CabecalhoQuiz` (barra de progresso),
 * `AlternativaQuiz` (alvo de 56px, riscar, tremida no erro), `BarraInferior`
 * com "Verificar resposta", `FolhaDeFeedback` (o veredito colado no polegar) e
 * `PainelDaExplicacao` com a rolagem guiada até a correção. O marca-texto do
 * enunciado vem junto. Uma questão por vez, como lá dentro.
 *
 * O que muda em relação à tela de quem tem conta é só o que depende de conta:
 * nada é salvo, listas e PDF aparecem com cadeado (é a mesma linguagem que a
 * plataforma já usa com quem não assina), e no fim vem o placar com o convite.
 */

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
  moduloNome: string | null
  topicoNome: string | null
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

  const [indice, setIndice] = useState(0)
  const [finalizado, setFinalizado] = useState(false)
  // Estado por questão. Guardado por id (e não no índice) para voltar a uma
  // questão já respondida encontrar tudo como estava — inclusive as
  // alternativas riscadas, que são raciocínio da pessoa, não rascunho.
  const [marcadas, setMarcadas] = useState<Record<string, string>>({})
  const [riscadas, setRiscadas] = useState<Record<string, string[]>>({})
  const [conferidas, setConferidas] = useState<Record<string, true>>({})
  const [marcaTexto, setMarcaTexto] = useState<Record<string, TextHighlight[]>>({})

  const questao = questoes[indice] as Questao | undefined
  const marcada = questao ? marcadas[questao.id] : undefined
  const conferida = questao ? !!conferidas[questao.id] : false

  // A correção fica no corpo da página (o texto é longo demais para caber num
  // painel de rodapé) e o "Ver por que" da barra rola até ela — mesma mecânica
  // da tela de quem tem conta.
  const explicacaoRef = useRef<HTMLDivElement>(null)
  // O recorte é mais generoso que o padrão do hook (-45% embaixo) porque esta
  // página é mais curta que a do banco: com uma questão só e nada depois da
  // correção, muitas vezes não há rolagem sobrando para a rolagem guiada
  // encostar o painel no topo. Ele acabava parando um pixel abaixo do recorte
  // padrão, e o veredito aparecia DUAS vezes — na faixa do rodapé e no
  // cabeçalho do painel, um do lado do outro. Com -30%, o painel que já está
  // legível cala a faixa, e o que só espia por trás da barra ainda não.
  const explicacaoNaTela = useEstaNaTela(explicacaoRef, conferida, '-72px 0px -30% 0px')
  const [explicacaoDestacada, setExplicacaoDestacada] = useState(false)
  const timerDoDestaque = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      .catch(
        () =>
          ativo &&
          setErro('Não foi possível carregar a amostra agora. Tente recarregar a página.'),
      )
      .finally(() => ativo && setLoading(false))
    return () => {
      ativo = false
    }
  }, [])

  useEffect(() => {
    return () => {
      if (timerDoDestaque.current) clearTimeout(timerDoDestaque.current)
    }
  }, [])

  const acertos = useMemo(
    () =>
      questoes.filter((q) => {
        const escolha = marcadas[q.id]
        return (
          !!conferidas[q.id] && !!escolha && !!q.alternativas.find((a) => a.letra === escolha)?.correta
        )
      }).length,
    [questoes, marcadas, conferidas],
  )
  const respondidas = Object.keys(conferidas).length

  function irParaExplicacao() {
    rolarAte(explicacaoRef.current, {
      margemTopo: 96,
      aoChegar: () => {
        setExplicacaoDestacada(true)
        if (timerDoDestaque.current) clearTimeout(timerDoDestaque.current)
        timerDoDestaque.current = setTimeout(() => setExplicacaoDestacada(false), 1700)
      },
    })
  }

  function conferir() {
    if (!questao || !marcada) return
    setConferidas((prev) => ({ ...prev, [questao.id]: true }))
  }

  function refazer() {
    if (!questao) return
    setConferidas((prev) => {
      const proximo = { ...prev }
      delete proximo[questao.id]
      return proximo
    })
    setMarcadas((prev) => {
      const proximo = { ...prev }
      delete proximo[questao.id]
      return proximo
    })
    setRiscadas((prev) => ({ ...prev, [questao.id]: [] }))
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  function avancar() {
    if (indice + 1 >= questoes.length) {
      setFinalizado(true)
      window.scrollTo({ top: 0, behavior: 'auto' })
      return
    }
    setIndice((i) => i + 1)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  function toggleRiscar(letra: string) {
    if (!questao) return
    setRiscadas((prev) => {
      const atuais = prev[questao.id] || []
      return {
        ...prev,
        [questao.id]: atuais.includes(letra)
          ? atuais.filter((l) => l !== letra)
          : [...atuais, letra],
      }
    })
  }

  /* ---------- carregando / erro / vazio ---------- */

  if (loading) {
    return (
      <MolduraSimples>
        <div className="space-y-4">
          <div className="h-3 animate-pulse rounded-full bg-muted" />
          <div className="h-40 animate-pulse rounded-2xl border border-border bg-card" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      </MolduraSimples>
    )
  }

  if (erro || questoes.length === 0) {
    return (
      <MolduraSimples>
        <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          {erro || 'A amostra está sendo preparada. Volte em instantes ou crie sua conta grátis.'}
          <div className="mt-4">
            <Button
              onClick={() => router.push('/auth/login?mode=register')}
              className="h-11 rounded-xl font-bold"
            >
              Começar grátis
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </MolduraSimples>
    )
  }

  /* ---------- placar ---------- */

  if (finalizado) {
    return (
      <TelaDeResultado
        questoes={questoes}
        marcadas={marcadas}
        conferidas={conferidas}
        acertos={acertos}
        respondidas={respondidas}
        patologia={patologia}
        aoRevisar={(i) => {
          setIndice(i)
          setFinalizado(false)
          window.scrollTo({ top: 0, behavior: 'auto' })
        }}
      />
    )
  }

  if (!questao) return null

  /* ---------- resolvendo ---------- */

  const letraCorreta = questao.alternativas.find((a) => a.correta)?.letra || null
  const acertou = !!marcada && marcada === letraCorreta
  const veredito: VereditoDaQuestao | null = !conferida ? null : acertou ? 'acertou' : 'errou'
  const riscadasDaQuestao = riscadas[questao.id] || []
  const ultima = indice + 1 >= questoes.length

  return (
    <div className="min-h-screen surface-page text-foreground">
      <CabecalhoQuiz
        aoSair={() => router.push('/')}
        rotuloSair="Voltar para a home"
        iconeSair="seta"
        progresso={{ atual: indice, total: questoes.length }}
        rotuloDetalhes="Sobre esta questão"
        detalhes={
          <>
            {/* O mesmo painel de quem tem conta, com o mesmo cadeado que a
                plataforma já mostra a quem não assina: some a frustração do 403
                e fica a informação de que a função existe. */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-primary/30 bg-primary/5 text-xs text-primary hover:bg-primary/10"
                onClick={() => router.push('/auth/login?mode=register')}
              >
                <ListPlus className="mr-1.5 h-3.5 w-3.5" />
                Salvar numa lista
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl border-primary/30 bg-primary/5 text-xs text-primary hover:bg-primary/10"
                onClick={() => router.push('/auth/login?mode=register')}
              >
                <Lock className="mr-1.5 h-3.5 w-3.5" />
                Baixar em PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled
                className="h-9 rounded-xl text-xs text-muted-foreground"
              >
                <Flag className="mr-1.5 h-3.5 w-3.5" />
                Relatar erro
              </Button>
            </div>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <Logo variant="icon" size="sm" className="h-4" />
              <span>
                Você está no Banco de Questões do Domine Aqui. Na amostra nada é salvo — com a
                conta grátis, o seu histórico e as listas ficam guardados.
              </span>
            </p>
            {(questao.fonte || questao.ano) && (
              <p className="text-xs text-muted-foreground">
                Fonte: {[questao.fonte, questao.ano].filter(Boolean).join(' · ')}
              </p>
            )}
          </>
        }
      />

      {/* A folga no rodapé é a altura REAL da barra fixa (ela publica a própria
          altura), que cresce quando o veredito entra nela. */}
      <div
        className="container mx-auto max-w-4xl space-y-4 px-4 py-5"
        style={{ paddingBottom: 'calc(var(--gx-barra-inferior-h, 6rem) + 1.5rem)' }}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge>Objetiva</Badge>
          {questao.moduloNome && <Badge variant="outline">{questao.moduloNome}</Badge>}
          {questao.topicoNome && <Badge variant="outline">{questao.topicoNome}</Badge>}
          {questao.ano && (
            <Badge variant="outline" className="bg-primary/10">
              {questao.ano}
            </Badge>
          )}
          {questao.dificuldade && CLASSE_DA_DIFICULDADE[questao.dificuldade] && (
            <Badge variant="outline" className={CLASSE_DA_DIFICULDADE[questao.dificuldade].classe}>
              {CLASSE_DA_DIFICULDADE[questao.dificuldade].texto}
            </Badge>
          )}
        </div>

        <Card>
          <CardContent className="space-y-4 p-4 sm:p-5">
            {/* Marca-texto de verdade, com as cinco cores da plataforma. Não é
                enfeite de demonstração: é a ferramenta que a pessoa vai usar
                para achar o dado do enunciado, e ela funciona aqui sem conta. */}
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              <HighlightableText
                text={questao.enunciado}
                highlights={marcaTexto[questao.id] || []}
                target="statement"
                onHighlightsChange={(novos) =>
                  setMarcaTexto((prev) => ({ ...prev, [questao.id]: novos }))
                }
                className="select-text"
              />
            </div>

            {questao.imagemUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={questao.imagemUrl}
                alt="Imagem da questão"
                className="h-auto max-h-80 w-auto max-w-full rounded-lg border object-contain"
              />
            )}
          </CardContent>
        </Card>

        <div className="space-y-2.5">
          {!conferida && (
            <p className="text-xs text-muted-foreground">
              Selecione uma alternativa · toque no X para riscar
            </p>
          )}
          {questao.alternativas.map((alt) => (
            <AlternativaQuiz
              key={alt.letra}
              letra={alt.letra}
              texto={alt.texto}
              marcada={marcada === alt.letra}
              riscada={riscadasDaQuestao.includes(alt.letra)}
              conferida={conferida}
              correta={alt.correta}
              aoMarcar={() => setMarcadas((prev) => ({ ...prev, [questao.id]: alt.letra }))}
              aoRiscar={() => toggleRiscar(alt.letra)}
            />
          ))}
        </div>

        {conferida && questao.explicacao && (
          <PainelDaExplicacao
            ref={explicacaoRef}
            veredito={veredito}
            letraCorreta={letraCorreta}
            destacado={explicacaoDestacada}
          >
            <TrechoDaCorrecao titulo="Explicação">{questao.explicacao}</TrechoDaCorrecao>
            {questao.fonte && (
              <TrechoDaCorrecao titulo="Fonte">
                {[questao.fonte, questao.ano].filter(Boolean).join(' · ')}
              </TrechoDaCorrecao>
            )}
          </PainelDaExplicacao>
        )}
      </div>

      <BarraInferior>
        <FolhaDeFeedback
          veredito={explicacaoNaTela ? null : veredito}
          letraCorreta={letraCorreta}
          temExplicacao={!!questao.explicacao}
          aoVerExplicacao={irParaExplicacao}
        >
          {conferida ? (
            <>
              <button
                type="button"
                onClick={refazer}
                aria-label="Refazer a questão"
                className="tecla flex h-14 w-14 flex-none items-center justify-center"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
              <Button
                onClick={avancar}
                className="btn-brand-glow h-14 min-w-0 flex-1 gap-1.5 rounded-2xl text-[15px] font-bold text-white"
              >
                {ultima ? (
                  <>
                    <Trophy className="h-4 w-4" />
                    Ver meu resultado
                  </>
                ) : (
                  <>
                    Próxima
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              onClick={conferir}
              disabled={!marcada}
              className="btn-brand-glow h-14 min-w-0 flex-1 gap-1.5 rounded-2xl text-[15px] font-bold text-white"
            >
              <CheckCircle2 className="h-4 w-4" />
              Verificar resposta
            </Button>
          )}
        </FolhaDeFeedback>
      </BarraInferior>
    </div>
  )
}

/* ---------- moldura das telas de carregamento e erro ---------- */

function MolduraSimples({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen surface-page text-foreground">
      <div className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <Link href="/" aria-label="Domine Aqui">
            <Logo variant="full" size="md" />
          </Link>
        </div>
      </div>
      <div className="container mx-auto max-w-4xl px-4 py-6">{children}</div>
    </div>
  )
}

/* ---------- placar ---------- */

/**
 * O fim da amostra.
 *
 * A versão anterior terminava numa linha de texto ("você respondeu 3 de 10").
 * Um placar é a única coisa que a pessoa quer ver depois de dez questões — e é
 * também o único momento da amostra em que pedir a conta não interrompe nada,
 * porque o produto já foi entregue por inteiro.
 *
 * A revisão questão a questão existe pelo mesmo motivo que existe lá dentro:
 * o valor não está em saber quantas você acertou, está em voltar nas que você
 * errou.
 */
function TelaDeResultado({
  questoes,
  marcadas,
  conferidas,
  acertos,
  respondidas,
  patologia,
  aoRevisar,
}: {
  questoes: Questao[]
  marcadas: Record<string, string>
  conferidas: Record<string, true>
  acertos: number
  respondidas: number
  patologia: Patologia | null
  aoRevisar: (indice: number) => void
}) {
  const percentual = respondidas > 0 ? Math.round((acertos / respondidas) * 100) : 0

  return (
    <div className="min-h-screen surface-page text-foreground">
      <div className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" aria-label="Domine Aqui">
            <Logo variant="full" size="md" />
          </Link>
          <Link
            href="/auth/login?mode=register"
            className="btn-brand-glow inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-bold text-white"
          >
            Começar grátis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl space-y-5 px-4 py-6">
        <Card className="overflow-hidden">
          <CardContent className="p-5 text-center sm:p-7">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Trophy className="h-7 w-7 text-primary" />
            </span>
            <p className="mt-4 font-heading text-4xl font-bold tabular-nums tracking-tight">
              {acertos}
              <span className="text-2xl text-muted-foreground">/{respondidas}</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {percentual}% de acerto na amostra
            </p>
            <div className="mx-auto mt-4 h-2.5 max-w-sm overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-700"
                style={{ width: `${percentual}%` }}
              />
            </div>
            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
              Isto foi uma fatia do Banco de Questões, com a mesma tela que quem tem conta usa.
              Lá dentro o seu desempenho fica guardado por módulo e tópico — é assim que você
              descobre onde está o buraco antes da prova descobrir.
            </p>
          </CardContent>
        </Card>

        <section>
          <h2 className="pb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Sua revisão
          </h2>
          <div className="space-y-2">
            {questoes.map((q, i) => {
              const escolha = marcadas[q.id]
              const respondida = !!conferidas[q.id]
              const certa = q.alternativas.find((a) => a.correta)?.letra
              const acertou = respondida && escolha === certa
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => aoRevisar(i)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3 text-left transition hover:border-primary/50"
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 flex-none items-center justify-center rounded-xl text-sm font-bold',
                      !respondida && 'bg-muted text-muted-foreground',
                      acertou && 'bg-emerald-500 text-white',
                      respondida && !acertou && 'bg-red-500 text-white',
                    )}
                  >
                    {!respondida ? i + 1 : acertou ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-sm font-medium">{q.enunciado}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {!respondida
                        ? 'Você pulou esta'
                        : acertou
                          ? `Você marcou a ${escolha} · correta`
                          : `Você marcou a ${escolha} · a certa era a ${certa}`}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 flex-none text-muted-foreground" />
                </button>
              )
            })}
          </div>
        </section>

        {patologia && (
          <section className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 sm:p-6">
            <div className="mb-2 flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <Stethoscope className="h-4 w-4" />
              <span className="font-clinical text-[10px] font-bold uppercase tracking-wider">
                Amostra do Manual Clínico
              </span>
            </div>
            <h2 className="font-heading text-lg font-semibold sm:text-xl">{patologia.nome}</h2>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {patologia.sistema && <span>{patologia.sistema}</span>}
              {patologia.cid10 && <span className="font-clinical">CID-10: {patologia.cid10}</span>}
            </div>
            {patologia.preview && (
              <p className="mt-3 text-sm leading-relaxed text-foreground/90">{patologia.preview}</p>
            )}
            <Link
              href={`/manual-clinico/${patologia.slug}`}
              className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl border border-amber-500/30 bg-card px-4 text-sm font-semibold transition hover:bg-muted"
            >
              Abrir a patologia completa
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        )}

        <section className="rounded-2xl border border-border bg-card p-6 text-center sm:p-8">
          <p className="editorial-mark mb-2 justify-center">
            <Sparkles className="h-3.5 w-3.5" />
            Próximo passo
          </p>
          <h2 className="font-heading text-xl font-semibold sm:text-2xl">
            Isso foi 10 questões. O banco não acaba aqui.
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Na conta grátis você continua resolvendo, o histórico fica guardado e ainda entram as
            provas da sua faculdade, os flashcards e o Manual Clínico. Sem cartão, com acesso na
            hora.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/auth/login?mode=register"
              className="btn-brand-glow inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-bold text-white"
            >
              Começar grátis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex h-12 items-center gap-2 px-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              <BookOpen className="h-4 w-4" />
              Ver a plataforma inteira
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
