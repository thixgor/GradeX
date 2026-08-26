"use client"

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  ListPlus,
  Loader2,
  AlertCircle,
  Flag,
  Copy,
  ClipboardCheck,
  Lock,
  PenLine,
  RotateCcw,
  Star,
  XCircle
} from 'lucide-react'
import { ROTA_ASSINATURA } from '@/lib/account-tier'
import { BancoQuestaoComHierarquia, BancoListaUsuario } from '@/lib/types/banco-questoes'
import { QuestionAnnotation, TextHighlight } from '@/lib/types'
import { InlineAnnotationCanvas } from '@/components/inline-annotation-canvas'
import { HighlightableText } from '@/components/highlightable-text'
import { ImageModal } from '@/components/image-modal'
import { ReportQuestionModal } from '@/components/report-question-modal'
import { cn } from '@/lib/utils'
import { BarraDoQuiz } from '@/components/banco/barra-do-quiz'
import { CabecalhoQuiz } from '@/components/banco/cabecalho-quiz'
import { AlternativaQuiz } from '@/components/banco/alternativa-quiz'
import { CLASSE_DA_DIFICULDADE } from '@/lib/banco/aparencia-da-questao'
import {
  FolhaDeFeedback,
  PainelDaExplicacao,
  TrechoDaCorrecao,
  type VereditoDaQuestao,
} from '@/components/banco/feedback-questao'
import { rolarAte } from '@/components/banco/rolagem-guiada'
import { useEstaNaTela } from '@/components/banco/use-esta-na-tela'

const formatText = (text: string) => text?.replace(/\\nl/g, '\n').replace(/\\n/g, '\n') || ''

/**
 * "hoje", "ontem", "há 3 dias"… — quando a pessoa respondeu isto antes.
 *
 * A data crua ("14/03/2026, 21:07") obriga a fazer a conta de cabeça. O que
 * decide entre rever a correção e refazer do zero é a DISTÂNCIA: o que foi
 * ontem ainda está fresco, o que foi há dois meses não está.
 */
function quandoFoi(iso?: string | null): string | null {
  if (!iso) return null
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return null

  const dias = Math.floor((Date.now() - data.getTime()) / 86_400_000)
  if (dias <= 0) return 'hoje'
  if (dias === 1) return 'ontem'
  if (dias < 30) return `há ${dias} dias`
  const meses = Math.floor(dias / 30)
  if (meses === 1) return 'há 1 mês'
  if (meses < 12) return `há ${meses} meses`
  const anos = Math.floor(meses / 12)
  return anos === 1 ? 'há 1 ano' : `há ${anos} anos`
}

export default function QuestaoPage() {
  const { id } = useParams() // id from route /banco-questoes/[id]
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [questao, setQuestao] = useState<BancoQuestaoComHierarquia | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [bloqueio, setBloqueio] = useState<{ podeAbrir: boolean; restantes: number; limite: number } | null>(null)
  const [abrindo, setAbrindo] = useState(false)
  /*
   * Saldo do plano gratuito — presente SÓ para quem não assina.
   *
   * É o mesmo sinal que a listagem do banco usa, e é ele que responde "essa
   * pessoa tem as listas?". A rota já mandava o campo; a tela ignorava, e por
   * isso oferecia "Adicionar à lista" para quem recebia 403 ao clicar. Uma
   * ação que só existe para falhar é pior do que ação nenhuma: ela promete o
   * recurso e cobra a decepção na hora do clique.
   */
  const [saldoGratuito, setSaldoGratuito] = useState<{ restantes: number; limite: number } | null>(null)

  // Estado da resolução
  const [alternativaSelecionada, setAlternativaSelecionada] = useState<string | null>(null)
  const [respostaDiscursiva, setRespostaDiscursiva] = useState('')
  const [respondendo, setRespondendo] = useState(false)
  const [mostrarResposta, setMostrarResposta] = useState(false)
  const [resultado, setResultado] = useState<{
    correta?: boolean
    alternativaCorreta?: string
    respostaModelo?: string
    explicacao?: string
  } | null>(null)

  // Timer
  const [tempoInicio] = useState(Date.now())

  // Modal de adicionar à lista
  const [showAddToListModal, setShowAddToListModal] = useState(false)
  const [listas, setListas] = useState<BancoListaUsuario[]>([])
  const [listaSelecionada, setListaSelecionada] = useState<string>('')
  const [novaListaNome, setNovaListaNome] = useState('')
  const [adicionandoLista, setAdicionandoLista] = useState(false)

  // Modal de questão já respondida
  const [showJaRespondidaModal, setShowJaRespondidaModal] = useState(false)
  const [dadosUltimaResolucao, setDadosUltimaResolucao] = useState<{
    correta?: boolean
    alternativaSelecionada?: string
    respostaUsuario?: string
    createdAt?: string
  } | null>(null)

  // Estado para riscar alternativas
  const [alternativasRiscadas, setAlternativasRiscadas] = useState<Set<string>>(new Set())

  // Estados de Anotações
  const [annotations, setAnnotations] = useState<QuestionAnnotation[]>([])

  // Modal de imagem expandida
  const [showImageModal, setShowImageModal] = useState(false)
  const [modalImageUrl, setModalImageUrl] = useState('')

  // Report Modal
  const [showReportModal, setShowReportModal] = useState(false)

  // Highlights de texto
  const [highlights, setHighlights] = useState<TextHighlight[]>([])

  // A correção fica no corpo da página (o texto é longo demais para caber num
  // painel de rodapé), e o "Ver por que" da barra rola até ela.
  // `explicacaoDestacada` acende um anel por um instante quando a rolagem
  // chega — sem isso a animação termina e a pessoa ainda precisa procurar o
  // que mudou.
  const explicacaoRef = useRef<HTMLDivElement>(null)
  // Com o painel de correção já na tela, a faixa do rodapé não tem o que
  // dizer: ela existe para contar o que a pessoa NÃO está vendo.
  const explicacaoNaTela = useEstaNaTela(explicacaoRef, mostrarResposta)
  const [explicacaoDestacada, setExplicacaoDestacada] = useState(false)
  const timerDoDestaque = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerDoDestaque.current) clearTimeout(timerDoDestaque.current)
    }
  }, [])

  function irParaExplicacao() {
    rolarAte(explicacaoRef.current, {
      // Espaço para a barra fixa do topo.
      margemTopo: 96,
      aoChegar: () => {
        setExplicacaoDestacada(true)
        if (timerDoDestaque.current) clearTimeout(timerDoDestaque.current)
        timerDoDestaque.current = setTimeout(() => setExplicacaoDestacada(false), 1700)
      },
    })
  }

  // Copy prompt e auto-avaliação para discursivas
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [selfScore, setSelfScore] = useState<number | null>(null)
  const [pendingSelfScore, setPendingSelfScore] = useState<number | null>(null)
  const [showSelfScoreModal, setShowSelfScoreModal] = useState(false)

  // Handler para ver gabarito da última resolução
  function handleVerGabarito() {
    if (!questao || !dadosUltimaResolucao) return

    // Preencher com a resposta anterior
    if (questao.tipo === 'objetiva' && dadosUltimaResolucao.alternativaSelecionada) {
      setAlternativaSelecionada(dadosUltimaResolucao.alternativaSelecionada)
    } else if (questao.tipo === 'discursiva' && dadosUltimaResolucao.respostaUsuario) {
      setRespostaDiscursiva(dadosUltimaResolucao.respostaUsuario)
    }

    // Mostrar resultado
    const alternativaCorreta = questao.alternativas?.find(a => a.correta)?.letra
    setResultado({
      correta: dadosUltimaResolucao.correta,
      alternativaCorreta,
      respostaModelo: questao.respostaModelo,
      explicacao: questao.explicacao
    })
    setMostrarResposta(true)
    setShowJaRespondidaModal(false)
  }

  // Handler para refazer questão (começar do zero)
  function handleRefazerQuestao() {
    setAlternativaSelecionada(null)
    setRespostaDiscursiva('')
    setMostrarResposta(false)
    setResultado(null)
    setAlternativasRiscadas(new Set())
    setShowJaRespondidaModal(false)
  }

  // Handler para riscar/desriscar alternativa
  function toggleRiscarAlternativa(letra: string) {
    if (mostrarResposta) return

    setAlternativasRiscadas(prev => {
      const novoSet = new Set(prev)
      if (novoSet.has(letra)) {
        novoSet.delete(letra)
      } else {
        novoSet.add(letra)
        // Se estava selecionada, desseleciona
        if (alternativaSelecionada === letra) {
          setAlternativaSelecionada(null)
        }
      }
      return novoSet
    })
  }

  // Funções de anotações
  function handleSaveAnnotation(annotation: QuestionAnnotation) {
    setAnnotations(prev => {
      const existing = prev.findIndex(a => a.questionId === annotation.questionId)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = annotation
        return updated
      }
      return [...prev, annotation]
    })
  }

  function getAnnotationForQuestion(questionId: string): QuestionAnnotation | undefined {
    return annotations.find(a => a.questionId === questionId)
  }

  /*
   * Assina o Banco?
   *
   * O servidor só manda o saldo gratuito para quem NÃO assina, então a
   * ausência do campo é a resposta — mas só depois que a questão chegou:
   * enquanto carrega, ninguém é assinante ainda, ou a tela pediria as listas
   * antes de saber de quem elas são.
   */
  const ehAssinanteDoBanco = !!questao && saldoGratuito === null

  useEffect(() => {
    loadQuestao()
  }, [id])

  // As listas são de assinante: para quem não é, a rota responde 403 e a tela
  // não tem o que fazer com a resposta. Buscar só depois de saber quem é a
  // pessoa evita uma requisição que nasce condenada em toda questão aberta.
  useEffect(() => {
    if (ehAssinanteDoBanco) loadListas()
  }, [ehAssinanteDoBanco])

  async function loadQuestao() {
    try {
      const res = await fetch(`/api/banco/questoes/${id}`, { cache: 'no-store' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        // Questão fechada para quem está no plano gratuito não é erro: é um
        // convite. O servidor diz quantas questões grátis sobraram, e a tela
        // oferece gastar uma — em vez do beco "Acesso restrito a assinantes",
        // que era a resposta para quem estava justamente avaliando se assina.
        if (data.bloqueada) {
          setBloqueio({
            podeAbrir: data.podeAbrir === true,
            restantes: data.gratuito?.restantes ?? 0,
            limite: data.gratuito?.limite ?? 0,
          })
          return
        }
        setError(data.error || 'Erro ao carregar questão')
        return
      }
      const data = await res.json()
      setQuestao(data.questao)
      setSaldoGratuito(data.gratuito ?? null)

      // Se já foi resolvida, mostrar modal perguntando o que fazer
      if (data.questao.jaResolvida && data.questao.ultimaResolucao) {
        setDadosUltimaResolucao(data.questao.ultimaResolucao)
        setShowJaRespondidaModal(true)
      }
    } catch (err) {
      setError('Erro ao carregar questão')
    } finally {
      setLoading(false)
    }
  }

  async function loadListas() {
    try {
      const res = await fetch('/api/banco/listas')
      if (res.ok) {
        const data = await res.json()
        setListas(data.listas)
      }
    } catch (err) {
      console.error('Erro ao carregar listas:', err)
    }
  }

  function handleRefazer() {
    // Reset estado para permitir refazer a questão
    setAlternativaSelecionada(null)
    setRespostaDiscursiva('')
    setMostrarResposta(false)
    setResultado(null)
    setAlternativasRiscadas(new Set())
    setSelfScore(null)
    setCopiedPrompt(false)
    setExplicacaoDestacada(false)
  }

  function handleCopyDiscursivePrompt() {
    if (!questao) return
    const enunciado = questao.enunciado || ''
    const respostaComentada = resultado?.respostaModelo || resultado?.explicacao || questao.respostaModelo || questao.explicacao || ''
    const respostaAluno = respostaDiscursiva || ''

    const prompt = `Você é um corretor de questões de Medicina. Você é humano, experiente e pedagogicamente sensato — não é um corretor mecânico nem perfeccionista. Sua filosofia de correção parte do princípio de que o objetivo é avaliar se o aluno compreende o conteúdo, não se ele decorou palavras-chave ou seguiu exatamente a estrutura do gabarito.

Você aceita e valoriza amplitude e generalidade nas respostas. Se o aluno abordou aspectos que o enunciado não explicitou, mas que são clinicamente ou conceitualmente pertinentes, isso conta a favor, não contra. Você nunca penaliza o aluno por demonstrar conhecimento além do esperado, nem por usar terminologia diferente da do gabarito quando o conteúdo está correto.

Você também leva em conta o esforço e a construção da resposta. O aluno dedicou tempo para elaborar um raciocínio e para escrever tentando abordar o que ele acha que a questão quer — sua correção respeita isso.

A seguir, serão apresentados: o enunciado da questão, a resposta comentada oficial e a resposta do aluno.
Ao final, você deve atribuir uma nota de 0% a 100% em intervalos de 10%, justificando brevemente sua avaliação com foco no que o aluno acertou, no que ficou incompleto e, se for o caso, no que estava equivocado. Seja direto, humano e justo.

---

ENUNCIADO DA QUESTÃO:
${enunciado}

---

RESPOSTA COMENTADA (GABARITO):
${respostaComentada}

---

RESPOSTA DO ALUNO:
${respostaAluno}`

    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedPrompt(true)
      setTimeout(() => setCopiedPrompt(false), 2500)
    })
  }

  function handleConfirmSelfScore() {
    if (pendingSelfScore === null) return
    setSelfScore(pendingSelfScore)
    setShowSelfScoreModal(false)
    setPendingSelfScore(null)
  }

  async function handleResponder() {
    if (!questao) return

    if (questao.tipo === 'objetiva' && !alternativaSelecionada) {
      return
    }

    if (questao.tipo === 'discursiva' && !respostaDiscursiva.trim()) {
      return
    }

    setRespondendo(true)

    try {
      const tempoGasto = Math.floor((Date.now() - tempoInicio) / 1000)

      const body: any = {
        tempoGasto
      }

      if (questao.tipo === 'objetiva') {
        body.alternativaSelecionada = alternativaSelecionada
      } else {
        body.respostaUsuario = respostaDiscursiva
      }

      const res = await fetch(`/api/banco/questoes/${id}/resolver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        const data = await res.json()
        setResultado(data)
        setMostrarResposta(true)
      }
    } catch (err) {
      console.error('Erro ao responder:', err)
    } finally {
      setRespondendo(false)
    }
  }

  async function handleAddToList() {
    if (!listaSelecionada && !novaListaNome.trim()) return

    setAdicionandoLista(true)

    try {
      if (novaListaNome.trim()) {
        // Criar nova lista e adicionar questão
        const createRes = await fetch('/api/banco/listas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: novaListaNome.trim(),
            questaoIds: [id]
          })
        })

        if (createRes.ok) {
          setShowAddToListModal(false)
          setNovaListaNome('')
          loadListas()
        }
      } else {
        // Adicionar à lista existente
        const updateRes = await fetch(`/api/banco/listas/${listaSelecionada}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adicionarQuestao: id
          })
        })

        if (updateRes.ok) {
          setShowAddToListModal(false)
        }
      }
    } catch (err) {
      console.error('Erro ao adicionar à lista:', err)
    } finally {
      setAdicionandoLista(false)
    }
  }

  if (loading) {
    return (
      <AppShell headerTitle="Questão">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    )
  }

  if (bloqueio) {
    return (
      <AppShell headerTitle="Questão">
        <div className="container mx-auto max-w-lg px-4 py-12">
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-lg font-bold">
              {bloqueio.podeAbrir ? 'Abrir esta questão?' : 'Suas questões gratuitas acabaram'}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {bloqueio.podeAbrir
                ? `Você tem ${bloqueio.restantes} de ${bloqueio.limite} questões gratuitas. Abrir esta usa uma delas — e ela fica sua para sempre, com a resposta comentada.`
                : 'As questões que você já abriu continuam disponíveis, com a resposta comentada. Para ver o banco inteiro, assine o Plus+.'}
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {bloqueio.podeAbrir ? (
                <Button
                  disabled={abrindo}
                  onClick={async () => {
                    setAbrindo(true)
                    try {
                      const res = await fetch(`/api/banco/questoes/${id}/abrir`, { method: 'POST' })
                      if (res.ok) {
                        setBloqueio(null)
                        setLoading(true)
                        await loadQuestao()
                      }
                    } finally {
                      setAbrindo(false)
                    }
                  }}
                >
                  {abrindo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Abrir questão
                </Button>
              ) : (
                <Button onClick={() => router.push(ROTA_ASSINATURA)}>Assinar o Plus+</Button>
              )}
              <Button variant="outline" onClick={() => router.push('/banco-questoes')}>
                Voltar ao banco
              </Button>
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  if (error || !questao) {
    return (
      <AppShell headerTitle="Questão">
        <div className="container max-w-2xl py-12">
          <Card className="text-center">
            <CardContent className="py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-medium">{error || 'Questão não encontrada'}</h3>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/banco-questoes')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Banco
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }
  const veredito: VereditoDaQuestao | null = !mostrarResposta
    ? null
    : questao.tipo === 'discursiva'
      ? 'registrada'
      : resultado?.correta
        ? 'acertou'
        : 'errou'

  const letraCorreta =
    resultado?.alternativaCorreta || questao.alternativas?.find((a) => a.correta)?.letra || null

  const temCorrecaoParaLer = !!(
    resultado?.explicacao ||
    resultado?.respostaModelo ||
    questao.fonte
  )

  const podeVerificar =
    !respondendo &&
    ((questao.tipo === 'objetiva' && !!alternativaSelecionada) ||
      (questao.tipo === 'discursiva' && !!respostaDiscursiva.trim()))

  // As etiquetas (tipo, período, tópico, ano, dificuldade) ficam visíveis
  // acima do enunciado — é o que identifica QUAL questão está sendo lida, e
  // esconder isso atrás de um toque confundia mais do que ajudava. O que
  // fecha no painel de detalhes são só as AÇÕES (adicionar à lista, relatar
  // erro), que não são usadas durante a leitura em si.
  const badgesDaQuestao = (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant={questao.tipo === 'objetiva' ? 'default' : 'secondary'}>
        {questao.tipo === 'objetiva' ? 'Objetiva' : 'Discursiva'}
      </Badge>
      <Badge variant="outline">{questao.periodoNome}</Badge>
      {questao.moduloNome && <Badge variant="outline">{questao.moduloNome}</Badge>}
      {questao.topicoNome && <Badge variant="outline">{questao.topicoNome}</Badge>}
      {questao.ano && (
        <Badge variant="outline" className="bg-primary/10">
          {questao.ano}
        </Badge>
      )}
      {/* Rótulo e cor vêm do mesmo lugar que a amostra e a demonstração da
          landing usam — ver lib/banco/aparencia-da-questao.ts. */}
      {questao.dificuldade && CLASSE_DA_DIFICULDADE[questao.dificuldade] && (
        <Badge variant="outline" className={CLASSE_DA_DIFICULDADE[questao.dificuldade].classe}>
          {CLASSE_DA_DIFICULDADE[questao.dificuldade].texto}
        </Badge>
      )}
    </div>
  )

  const detalhesDaQuestao = (
    <>
      <div className="flex flex-wrap gap-2">
        {/* Só quem assina tem listas. Para quem não assina o botão não some sem
            dizer por quê: vira o convite, com o cadeado no lugar do ícone —
            some a frustração do 403 e fica a informação de que existe. */}
        {ehAssinanteDoBanco ? (
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-xl text-xs"
            onClick={() => setShowAddToListModal(true)}
          >
            <ListPlus className="mr-1.5 h-3.5 w-3.5" />
            Adicionar à lista
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-xl border-primary/30 bg-primary/5 text-xs text-primary hover:bg-primary/10"
            onClick={() => router.push(ROTA_ASSINATURA)}
          >
            <Lock className="mr-1.5 h-3.5 w-3.5" />
            Listas são do Plus+
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-9 rounded-xl text-xs text-muted-foreground hover:text-orange-500"
          onClick={() => setShowReportModal(true)}
        >
          <Flag className="mr-1.5 h-3.5 w-3.5" />
          Relatar erro
        </Button>
      </div>
    </>
  )

  return (
    // Sem o cabeçalho do app: resolver uma questão é leitura concentrada, e
    // menu, carrinho, sino e tema não participam dela. Ver o comentário de
    // `CabecalhoQuiz`.
    <AppShell showHeader={false} controlesFlutuantes={false}>
      <CabecalhoQuiz
        aoSair={() => router.push('/banco-questoes')}
        rotuloSair="Voltar ao banco"
        iconeSair="seta"
        detalhes={detalhesDaQuestao}
      />

      {/* A folga no rodapé é a altura REAL da barra fixa (ela publica a própria
          altura), que cresce quando o veredito entra nela. */}
      <div
        className="container mx-auto max-w-4xl space-y-4 px-4 py-5"
        style={{ paddingBottom: 'calc(var(--gx-barra-inferior-h, 6rem) + 1.5rem)' }}
      >
        {badgesDaQuestao}

        <InlineAnnotationCanvas
          questionId={String(questao._id)}
          questionNumber={1}
          annotation={getAnnotationForQuestion(String(questao._id))}
          onChange={handleSaveAnnotation}
          className="space-y-4"
        >
          <Card>
            <CardContent className="space-y-4 p-4 sm:p-5">
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                <HighlightableText
                  text={formatText(questao.enunciado)}
                  highlights={highlights}
                  target="statement"
                  onHighlightsChange={setHighlights}
                  className="select-text"
                />
              </div>

              {/* Imagem da questão */}
              {questao.imagemUrl && (
                <div className="mt-4 flex flex-col items-center gap-1.5">
                  <div
                    className="group relative cursor-pointer select-none"
                    style={{ touchAction: 'manipulation' }}
                    onClick={() => {
                      setModalImageUrl(questao.imagemUrl!)
                      setShowImageModal(true)
                    }}
                  >
                    <img
                      src={questao.imagemUrl}
                      alt="Imagem da questão"
                      className="pointer-events-none h-auto max-h-80 w-auto max-w-full rounded-lg border object-contain transition-all group-hover:brightness-95 md:max-w-md"
                      draggable={false}
                    />
                    {/* Desktop: hover overlay */}
                    <div className="absolute inset-0 hidden items-center justify-center rounded-lg opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
                      <div className="rounded-lg bg-black/55 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
                        Clique para ampliar
                      </div>
                    </div>
                    {/* Mobile/tablet: always-visible badge */}
                    <div className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[10px] text-white backdrop-blur-sm sm:hidden">
                      Ampliar
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Toque para ampliar a imagem</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Área de resposta */}
          {questao.tipo === 'objetiva' ? (
            <div className="space-y-2.5">
              {!mostrarResposta && (
                <p className="text-xs text-muted-foreground">
                  Toque no X para riscar uma alternativa
                </p>
              )}
              {questao.alternativas?.map((alt) => (
                <AlternativaQuiz
                  key={alt.letra}
                  letra={alt.letra}
                  texto={formatText(alt.texto)}
                  marcada={alternativaSelecionada === alt.letra}
                  riscada={alternativasRiscadas.has(alt.letra)}
                  conferida={mostrarResposta}
                  correta={letraCorreta ? alt.letra === letraCorreta : !!alt.correta}
                  aoMarcar={() => setAlternativaSelecionada(alt.letra)}
                  aoRiscar={() => toggleRiscarAlternativa(alt.letra)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="space-y-2 p-4 sm:p-5">
                <Label className="text-sm font-medium">Sua resposta</Label>
                <Textarea
                  placeholder="Digite sua resposta aqui..."
                  value={respostaDiscursiva}
                  onChange={(e) => setRespostaDiscursiva(e.target.value)}
                  disabled={mostrarResposta}
                  rows={8}
                  className="resize-none"
                />
              </CardContent>
            </Card>
          )}
        </InlineAnnotationCanvas>

        {/* Correção — destino da rolagem guiada do "Ver por que". */}
        {mostrarResposta && resultado && (
          <PainelDaExplicacao
            ref={explicacaoRef}
            veredito={veredito}
            letraCorreta={letraCorreta}
            destacado={explicacaoDestacada}
          >
            {questao.tipo === 'discursiva' && resultado.respostaModelo && (
              <TrechoDaCorrecao titulo="Resposta modelo">
                {formatText(resultado.respostaModelo)}
              </TrechoDaCorrecao>
            )}

            {resultado.explicacao && (
              <TrechoDaCorrecao titulo="Explicação">
                {formatText(resultado.explicacao)}
              </TrechoDaCorrecao>
            )}

            {questao.fonte && (
              <TrechoDaCorrecao titulo="Fonte">{formatText(questao.fonte)}</TrechoDaCorrecao>
            )}

            {/* Correção por Prompt e Auto-avaliação (discursivas) */}
            {questao.tipo === 'discursiva' && (
              <div className="space-y-3 rounded-xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-800 dark:bg-violet-900/10">
                <h4 className="flex items-center gap-2 text-sm font-semibold">
                  <Star className="h-4 w-4 text-violet-600" />
                  Correção via IA (prompt)
                </h4>
                <p className="text-xs text-muted-foreground">
                  Copie o prompt e cole no ChatGPT, Claude ou outra IA para uma correção detalhada
                  da sua resposta.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyDiscursivePrompt}>
                    {copiedPrompt ? (
                      <>
                        <ClipboardCheck className="mr-2 h-4 w-4 text-green-600" />
                        Prompt copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar prompt de correção
                      </>
                    )}
                  </Button>

                  {selfScore !== null ? (
                    <div className="flex items-center gap-2 rounded-md border border-violet-300 bg-violet-100 px-3 py-1.5 dark:border-violet-700 dark:bg-violet-900/30">
                      <Star className="h-4 w-4 text-violet-600" />
                      <span className="text-sm font-medium">Nota: {selfScore}%</span>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPendingSelfScore(null)
                        setShowSelfScoreModal(true)
                      }}
                    >
                      <Star className="mr-2 h-4 w-4" />
                      Atribuir nota
                    </Button>
                  )}
                </div>
              </div>
            )}
          </PainelDaExplicacao>
        )}

        {/* Modal de adicionar à lista */}
        <Dialog open={showAddToListModal} onOpenChange={setShowAddToListModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar à Lista</DialogTitle>
              <DialogDescription>
                Adicione esta questão a uma lista existente ou crie uma nova lista.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {listas.length > 0 && (
                <div className="space-y-2">
                  <Label>Selecionar lista existente</Label>
                  <Select
                    value={listaSelecionada}
                    onValueChange={setListaSelecionada}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma lista" />
                    </SelectTrigger>
                    <SelectContent>
                      {listas.map((lista) => (
                        <SelectItem key={String(lista._id)} value={String(lista._id)}>
                          {lista.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    ou criar nova lista
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nome da nova lista</Label>
                <input
                  type="text"
                  placeholder="Ex: Revisão de Cardiologia"
                  value={novaListaNome}
                  onChange={(e) => {
                    setNovaListaNome(e.target.value)
                    setListaSelecionada('')
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddToListModal(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleAddToList}
                disabled={adicionandoLista || (!listaSelecionada && !novaListaNome.trim())}
              >
                {adicionandoLista ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Adicionar'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de questão já respondida */}
        {/*
          Esta é a primeira coisa que a pessoa vê ao reabrir uma questão que já
          resolveu, e a versão anterior gastava esse momento sem dizer nada:
          título com ícone de alerta, "o que deseja fazer?" e duas opções de
          peso visual idêntico. Quem chega aqui já esqueceu o que respondeu —
          e é justamente isso que decide entre rever e refazer.

          Então o diálogo abre pelo VEREDITO (acertou/errou, o que marcou,
          quando foi), e só depois oferece as saídas, com a recomendada em
          destaque. As duas dizem o que custam: rever não mexe em nada,
          refazer grava uma nova resposta e conta de novo no desempenho.
        */}
        <Dialog open={showJaRespondidaModal} onOpenChange={setShowJaRespondidaModal}>
          <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
            {(() => {
              const acertou = dadosUltimaResolucao?.correta === true
              const ehDiscursiva = questao?.tipo === 'discursiva'
              // Discursiva não tem certo/errado automático: a nota é da
              // auto-avaliação, e nunca vem no registro. Fingir um veredito
              // aqui seria inventar informação.
              const semVeredito = ehDiscursiva || dadosUltimaResolucao?.correta === undefined
              const quando = quandoFoi(dadosUltimaResolucao?.createdAt)
              const letra = dadosUltimaResolucao?.alternativaSelecionada

              return (
                <>
                  {/* ── Veredito ────────────────────────────────────────── */}
                  <div
                    className={cn(
                      'px-6 pb-5 pt-6 text-center',
                      semVeredito
                        ? 'bg-violet-500/10'
                        : acertou
                          ? 'bg-emerald-500/10'
                          : 'bg-red-500/10',
                    )}
                  >
                    <div
                      className={cn(
                        'mx-auto flex h-14 w-14 items-center justify-center rounded-2xl',
                        semVeredito
                          ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400'
                          : acertou
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-red-500/15 text-red-600 dark:text-red-400',
                      )}
                    >
                      {semVeredito ? (
                        <PenLine className="h-7 w-7" />
                      ) : acertou ? (
                        <CheckCircle2 className="h-7 w-7" />
                      ) : (
                        <XCircle className="h-7 w-7" />
                      )}
                    </div>

                    {/* `p-0`: o respiro já vem da faixa do veredito acima. */}
                    <DialogHeader className="mt-3 p-0">
                      <DialogTitle className="text-center font-heading text-lg font-semibold tracking-tight">
                        {semVeredito
                          ? 'Você já respondeu esta questão'
                          : acertou
                            ? 'Você acertou esta questão'
                            : 'Você errou esta questão'}
                      </DialogTitle>
                      <DialogDescription className="mt-1 text-center text-sm">
                        {/* A frase junta o que a pessoa precisa lembrar: o que
                            marcou e há quanto tempo. Cada pedaço some sozinho
                            quando o registro não o tem. */}
                        {[
                          letra && !ehDiscursiva ? `Você marcou a alternativa ${letra}` : null,
                          quando,
                        ]
                          .filter(Boolean)
                          .join(' · ') || 'Ela já está no seu histórico.'}
                      </DialogDescription>
                    </DialogHeader>
                  </div>

                  {/* ── Saídas ──────────────────────────────────────────── */}
                  <div className="space-y-2 px-4 py-4">
                    <button
                      type="button"
                      onClick={handleVerGabarito}
                      className="group flex w-full items-center gap-3 rounded-2xl border border-primary/40 bg-primary/5 p-3.5 text-left transition hover:bg-primary/10 active:scale-[0.99]"
                    >
                      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-primary/15 text-primary">
                        <BookOpen className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 text-sm font-bold">
                          Ver a correção
                          <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                            Recomendado
                          </span>
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                          Abre a resposta certa, a sua e o comentário. Não altera seu histórico.
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 flex-none text-primary opacity-0 transition group-hover:opacity-100" />
                    </button>

                    <button
                      type="button"
                      onClick={handleRefazerQuestao}
                      className="group flex w-full items-center gap-3 rounded-2xl border border-border p-3.5 text-left transition hover:bg-muted active:scale-[0.99]"
                    >
                      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-muted text-muted-foreground">
                        <RotateCcw className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold">Refazer do zero</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                          Limpa a tela e responde de novo. A nova resposta entra no seu desempenho.
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 flex-none text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                    </button>
                  </div>

                  <DialogFooter className="border-t border-border/60 bg-muted/30 px-4 py-3 sm:justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push('/banco-questoes')}
                      className="h-9 w-full text-xs font-semibold text-muted-foreground"
                    >
                      <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                      Voltar ao banco
                    </Button>
                  </DialogFooter>
                </>
              )
            })()}
          </DialogContent>
        </Dialog>

        {/* Modal de Imagem Expandida */}
        <ImageModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          src={modalImageUrl}
          alt="Imagem da questão"
        />

        {/* Modal de Relatar Erro */}
        {questao && (
          <ReportQuestionModal
            questionId={String(questao._id)}
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
          />
        )}

        {/* Modal de Auto-avaliação */}
        <Dialog open={showSelfScoreModal} onOpenChange={setShowSelfScoreModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-violet-600" />
                Auto-avaliação
              </DialogTitle>
              <DialogDescription>
                Após corrigir com a IA, atribua uma nota de 0% a 100% para sua resposta.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <div className="grid grid-cols-6 gap-2">
                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((score) => (
                  <Button
                    key={score}
                    variant={pendingSelfScore === score ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPendingSelfScore(score)}
                    className={cn(
                      "text-xs",
                      pendingSelfScore === score && "bg-violet-600 hover:bg-violet-700"
                    )}
                  >
                    {score}%
                  </Button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSelfScoreModal(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmSelfScore}
                disabled={pendingSelfScore === null}
                className="bg-violet-600 hover:bg-violet-700"
              >
                Confirmar nota
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Barra de ações ─────────────────────────────────────────────────
          "Verificar resposta" era um botão centralizado DEPOIS das cinco
          alternativas: respondia exigia rolar de volta para baixo o que se
          acabou de ler — no desktop também, já que a barra só existia até
          `md`. Aqui a ação acompanha a leitura em qualquer tamanho de tela, e
          é a mesma barra que passa a carregar o veredito. */}
      <BarraDoQuiz>
        <FolhaDeFeedback
          veredito={explicacaoNaTela ? null : veredito}
          letraCorreta={letraCorreta}
          temExplicacao={temCorrecaoParaLer}
          aoVerExplicacao={irParaExplicacao}
        >
          {mostrarResposta ? (
            <>
              <button
                type="button"
                onClick={handleRefazer}
                aria-label="Refazer a questão"
                className="tecla flex h-14 w-14 flex-none items-center justify-center"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
              <Button
                onClick={() => router.push('/banco-questoes')}
                className="btn-brand-glow h-14 min-w-0 flex-1 gap-1.5 rounded-2xl text-[15px] font-bold text-white"
              >
                <BookOpen className="h-4 w-4" />
                Voltar ao banco
              </Button>
            </>
          ) : (
            <Button
              onClick={handleResponder}
              disabled={!podeVerificar}
              className="btn-brand-glow h-14 min-w-0 flex-1 gap-1.5 rounded-2xl text-[15px] font-bold text-white"
            >
              {respondendo ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Verificar resposta
                </>
              )}
            </Button>
          )}
        </FolhaDeFeedback>
      </BarraDoQuiz>
    </AppShell>
  )
}
