'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  BookOpen,
  Loader2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Trash2,
  AlertCircle,
  Play,
  FileText,
  Download,
  Eye,
  RotateCcw,
  List,
  X,
  Flag,
  Copy,
  ClipboardCheck,
  Star,
  LayoutGrid,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { BarraInferior } from '@/components/ui/barra-inferior'
import { Portal } from '@/components/ui/portal'
import { BancoListaUsuario, BancoQuestaoComHierarquia } from '@/lib/types/banco-questoes'
import { QuestionAnnotation, TextHighlight } from '@/lib/types'
import { InlineAnnotationCanvas } from '@/components/inline-annotation-canvas'
import { HighlightableText } from '@/components/highlightable-text'
import { ImageModal } from '@/components/image-modal'
import { ReportQuestionModal } from '@/components/report-question-modal'
import { generateBancoListaPDF, downloadPDF, prewarmPDFAssets } from '@/lib/pdf-generator'
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

type ModoVisualizacao = 'lista' | 'simulado'
type ModoCorrecao = 'imediato' | 'final'

interface RespostaUsuario {
  questaoId: string
  tipo: 'objetiva' | 'discursiva'
  alternativaSelecionada?: string
  respostaDiscursiva?: string
}

const formatText = (text: string) => text?.replace(/\\nl/g, '\n').replace(/\\n/g, '\n') || ''

export default function ListaDetalhePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [lista, setLista] = useState<BancoListaUsuario | null>(null)
  const [questoes, setQuestoes] = useState<BancoQuestaoComHierarquia[]>([])
  const [error, setError] = useState<string | null>(null)
  const [removendo, setRemovendo] = useState<string | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  // Modo simulado
  const [modo, setModo] = useState<ModoVisualizacao>('lista')
  const [modoCorrecao, setModoCorrecao] = useState<ModoCorrecao>('imediato')
  const [questaoAtual, setQuestaoAtual] = useState(0)
  const [respostas, setRespostas] = useState<RespostaUsuario[]>([])
  const [mostrarResultado, setMostrarResultado] = useState<boolean[]>([])
  const [simuladoFinalizado, setSimuladoFinalizado] = useState(false)

  // Estado para riscar alternativas por questão (mapa questaoId -> Set de letras riscadas)
  const [alternativasRiscadas, setAlternativasRiscadas] = useState<Record<string, Set<string>>>({})

  // Estados de Anotações
  const [annotations, setAnnotations] = useState<QuestionAnnotation[]>([])

  // Report Modal
  const [reportQuestionId, setReportQuestionId] = useState<string | null>(null)

  // Modal de imagem expandida
  const [showImageModal, setShowImageModal] = useState(false)
  const [modalImageUrl, setModalImageUrl] = useState('')

  // Highlights de texto por questão
  const [highlights, setHighlights] = useState<Record<string, TextHighlight[]>>({})

  // Copy prompt e auto-avaliação para discursivas
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null)
  const [selfScores, setSelfScores] = useState<Record<string, number>>({})
  const [selfScoreQuestionId, setSelfScoreQuestionId] = useState<string | null>(null)
  const [pendingSelfScore, setPendingSelfScore] = useState<number | null>(null)
  const [showSelfScoreModal, setShowSelfScoreModal] = useState(false)

  // Mapa de questões no celular. No desktop ele é um cartão fixo no fim da
  // página; no celular, chegar até lá custava rolar a questão inteira, então
  // ele virou um painel que abre a partir da barra de ações.
  const [mapaAberto, setMapaAberto] = useState(false)

  // A correção fica no corpo da página (o texto é longo demais para um painel
  // de rodapé), e o "Ver por que" da barra rola até ela. `explicacaoDestacada`
  // acende um anel por um instante quando a rolagem chega — sem isso a
  // animação termina e a pessoa ainda precisa procurar o que mudou.
  const explicacaoRef = useRef<HTMLDivElement>(null)
  // Com o painel de correção já na tela, a faixa do rodapé não tem o que
  // dizer: ela existe para contar o que a pessoa NÃO está vendo.
  const explicacaoNaTela = useEstaNaTela(explicacaoRef, mostrarResultado[questaoAtual])
  const [explicacaoDestacada, setExplicacaoDestacada] = useState(false)
  const timerDoDestaque = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerDoDestaque.current) clearTimeout(timerDoDestaque.current)
    }
  }, [])

  function irParaExplicacao() {
    rolarAte(explicacaoRef.current, {
      // Espaço para a barra de progresso, que é fixa no topo.
      margemTopo: 96,
      aoChegar: () => {
        setExplicacaoDestacada(true)
        if (timerDoDestaque.current) clearTimeout(timerDoDestaque.current)
        timerDoDestaque.current = setTimeout(() => setExplicacaoDestacada(false), 1700)
      },
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

  useEffect(() => {
    loadLista()
    prewarmPDFAssets()
  }, [id])

  // No simulado só a questão atual está no DOM, então o <img> da próxima só
  // começa a baixar depois do clique em "Próxima" — daí a demora visível para
  // a imagem trocar. Buscando o arquivo em segundo plano assim que a questão
  // atual abre, ele já está no cache do navegador quando o <img> trocar de src.
  useEffect(() => {
    if (modo !== 'simulado') return
    if (typeof window === 'undefined') return
    const proxima = questoes[questaoAtual + 1]
    if (proxima?.imagemUrl) {
      const preload = new window.Image()
      preload.src = proxima.imagemUrl
    }
  }, [modo, questaoAtual, questoes])

  async function loadLista() {
    try {
      const res = await fetch(`/api/banco/listas/${id}`)
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erro ao carregar lista')
        return
      }
      const data = await res.json()
      setLista(data.lista)
      setQuestoes(data.questoes)
    } catch (err) {
      setError('Erro ao carregar lista')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemoverQuestao(questaoId: string) {
    if (!confirm('Remover esta questão da lista?')) return

    setRemovendo(questaoId)
    try {
      const res = await fetch(`/api/banco/listas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ removerQuestao: questaoId })
      })

      if (res.ok) {
        setQuestoes(prev => prev.filter(q => String(q._id) !== questaoId))
      }
    } catch (err) {
      console.error('Erro ao remover questão:', err)
    } finally {
      setRemovendo(null)
    }
  }

  async function handleDownloadPdf(incluirRespostas: boolean = false) {
    if (!lista || questoes.length === 0) return
    setDownloadingPdf(true)
    try {
      const blob = await generateBancoListaPDF(
        lista.nome,
        questoes.map(q => ({
          tipo: q.tipo,
          enunciado: q.enunciado,
          alternativas: q.alternativas,
          imagemUrl: q.imagemUrl,
          explicacao: q.explicacao,
          respostaModelo: q.respostaModelo,
          dificuldade: q.dificuldade,
          ano: q.ano,
          fonte: q.fonte,
          periodoNome: q.periodoNome,
          moduloNome: q.moduloNome,
          topicoNome: q.topicoNome,
        })),
        incluirRespostas
      )
      const safeName = (lista.nome || 'lista').replace(/[^a-zA-Z0-9]/g, '_')
      downloadPDF(blob, `${safeName}_DomineAqui.pdf`, {
        type: 'banco-lista',
        resourceId: id,
        resourceTitle: lista.nome,
      })
    } catch (err) {
      console.error('Erro ao baixar PDF:', err)
      alert('Erro ao gerar PDF')
    } finally {
      setDownloadingPdf(false)
    }
  }

  function iniciarSimulado(correcao: ModoCorrecao) {
    setModoCorrecao(correcao)
    setModo('simulado')
    setQuestaoAtual(0)
    setRespostas([])
    setMostrarResultado(new Array(questoes.length).fill(false))
    setSimuladoFinalizado(false)
    setAlternativasRiscadas({})
  }

  // Função para verificar se alternativa está riscada
  function isAlternativaRiscada(questaoId: string, letra: string): boolean {
    return alternativasRiscadas[questaoId]?.has(letra) || false
  }

  // Função para riscar/desriscar alternativa
  function toggleRiscarAlternativa(questaoId: string, letra: string) {
    setAlternativasRiscadas(prev => {
      const novoMapa = { ...prev }
      if (!novoMapa[questaoId]) {
        novoMapa[questaoId] = new Set()
      }

      const novoSet = new Set(novoMapa[questaoId])
      if (novoSet.has(letra)) {
        novoSet.delete(letra)
      } else {
        novoSet.add(letra)
        // Se estava selecionada, desseleciona
        const respostaAtual = getRespostaAtual(questaoId)
        if (respostaAtual?.alternativaSelecionada === letra) {
          setRespostas(prev => prev.filter(r => r.questaoId !== questaoId))
        }
      }

      novoMapa[questaoId] = novoSet
      return novoMapa
    })
  }

  function voltarParaLista() {
    setModo('lista')
    setSimuladoFinalizado(false)
  }

  function getRespostaAtual(questaoId: string): RespostaUsuario | undefined {
    return respostas.find(r => r.questaoId === questaoId)
  }

  function setResposta(questaoId: string, tipo: 'objetiva' | 'discursiva', valor: string) {
    setRespostas(prev => {
      const existente = prev.findIndex(r => r.questaoId === questaoId)
      const novaResposta: RespostaUsuario = {
        questaoId,
        tipo,
        ...(tipo === 'objetiva' ? { alternativaSelecionada: valor } : { respostaDiscursiva: valor })
      }

      if (existente >= 0) {
        const novas = [...prev]
        novas[existente] = novaResposta
        return novas
      }
      return [...prev, novaResposta]
    })
  }

  function verificarResposta(index: number) {
    setMostrarResultado(prev => {
      const novo = [...prev]
      novo[index] = true
      return novo
    })
  }

  function handleCopyDiscursivePrompt(questao: BancoQuestaoComHierarquia) {
    const enunciado = questao.enunciado || ''
    const respostaComentada = questao.respostaModelo || questao.explicacao || ''
    const respostaAluno = getRespostaAtual(String(questao._id))?.respostaDiscursiva || ''

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
      setCopiedPromptId(String(questao._id))
      setTimeout(() => setCopiedPromptId(null), 2500)
    })
  }

  function handleOpenSelfScore(questaoId: string) {
    setSelfScoreQuestionId(questaoId)
    setPendingSelfScore(null)
    setShowSelfScoreModal(true)
  }

  function handleConfirmSelfScore() {
    if (selfScoreQuestionId === null || pendingSelfScore === null) return
    setSelfScores(prev => ({ ...prev, [selfScoreQuestionId!]: pendingSelfScore! }))
    setShowSelfScoreModal(false)
    setSelfScoreQuestionId(null)
    setPendingSelfScore(null)
  }

  /**
   * Troca de questão e volta ao topo.
   *
   * Sem isso, quem avança do fim de uma questão longa cai no MEIO da próxima —
   * com o enunciado já rolado para fora da tela — e precisa subir para
   * começar a ler. O salto é instantâneo de propósito: rolagem suave por três
   * telas de altura é uma espera, não um afago.
   */
  function irParaQuestao(indice: number) {
    if (indice < 0 || indice >= questoes.length) return
    setQuestaoAtual(indice)
    setMapaAberto(false)
    setExplicacaoDestacada(false)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' })
  }

  function proximaQuestao() {
    irParaQuestao(questaoAtual + 1)
  }

  function questaoAnterior() {
    irParaQuestao(questaoAtual - 1)
  }

  function finalizarSimulado() {
    setMostrarResultado(new Array(questoes.length).fill(true))
    setSimuladoFinalizado(true)
    setMapaAberto(false)
    // O resultado é desenhado no TOPO da página; terminar a última questão e
    // continuar olhando para o rodapé faria parecer que nada aconteceu.
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function calcularResultado() {
    let acertos = 0
    let total = 0

    questoes.forEach((q) => {
      if (q.tipo === 'objetiva') {
        total++
        const resposta = getRespostaAtual(String(q._id))
        const correta = q.alternativas?.find(a => a.correta)?.letra
        if (resposta?.alternativaSelecionada === correta) {
          acertos++
        }
      }
    })

    return { acertos, total, porcentagem: total > 0 ? (acertos / total) * 100 : 0 }
  }

  if (loading) {
    return (
      <AppShell headerTitle="Lista">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    )
  }

  if (error || !lista) {
    return (
      <AppShell headerTitle="Lista">
        <div className="container max-w-2xl py-12">
          <Card className="text-center">
            <CardContent className="py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-medium">{error || 'Lista não encontrada'}</h3>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/banco-questoes/listas')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar às Listas
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  // MODO SIMULADO
  if (modo === 'simulado') {
    const questao = questoes[questaoAtual]
    const questaoId = String(questao._id)
    const respostaAtual = getRespostaAtual(questaoId)
    const mostrarResultadoAtual = mostrarResultado[questaoAtual]
    const correta = questao.tipo === 'objetiva' ? questao.alternativas?.find(a => a.correta)?.letra : null
    const acertou = questao.tipo === 'objetiva' && respostaAtual?.alternativaSelecionada === correta
    const resultado = calcularResultado()

    const ehUltima = questaoAtual === questoes.length - 1
    const podeVerResposta = modoCorrecao === 'imediato' && !mostrarResultadoAtual && !!respostaAtual
    // Na correção imediata, terminar sem conferir a última resposta perderia o
    // gabarito dela — o botão só libera depois do "Ver resposta".
    const finalizarBloqueado = podeVerResposta
    const naoRespondidas = questoes.filter((q) => !getRespostaAtual(String(q._id))).length

    // O veredito que aparece colado no polegar, na barra do rodapé. Numa
    // discursiva não existe certo e errado automático: o que se diz é que a
    // resposta foi registrada e que há um gabarito para comparar.
    const veredito: VereditoDaQuestao | null = !mostrarResultadoAtual
      ? null
      : questao.tipo === 'discursiva'
        ? 'registrada'
        : acertou
          ? 'acertou'
          : 'errou'

    const temCorrecaoParaLer = !!(questao.explicacao || questao.respostaModelo || questao.fonte)

    // Tudo o que classifica a questão vive aqui, fechado. Durante a resolução
    // essas etiquetas não são usadas — e ocupavam a faixa logo acima do
    // enunciado, que é justamente onde o olho começa a ler.
    const detalhesDaQuestao = (
      <>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant={questao.tipo === 'objetiva' ? 'default' : 'secondary'}>
            {questao.tipo === 'objetiva' ? 'Objetiva' : 'Discursiva'}
          </Badge>
          <Badge variant="outline">{questao.periodoNome}</Badge>
          {questao.moduloNome && (
            <Badge variant="outline" className="text-xs">{questao.moduloNome}</Badge>
          )}
          {questao.topicoNome && (
            <Badge variant="outline" className="text-xs">{questao.topicoNome}</Badge>
          )}
          {questao.ano && (
            <Badge variant="outline" className="bg-primary/10 text-xs">{questao.ano}</Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          {modoCorrecao === 'imediato'
            ? 'Correção a cada resposta.'
            : 'Correção só no final.'}
        </p>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-xl text-xs"
            onClick={() => handleDownloadPdf(false)}
            disabled={downloadingPdf}
          >
            {downloadingPdf ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="mr-1.5 h-3.5 w-3.5" />
            )}
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-xl text-xs"
            onClick={() => handleDownloadPdf(true)}
            disabled={downloadingPdf}
          >
            {downloadingPdf ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileText className="mr-1.5 h-3.5 w-3.5" />
            )}
            PDF com gabarito
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-xl text-xs text-muted-foreground hover:text-orange-500"
            onClick={() => setReportQuestionId(questaoId)}
          >
            <Flag className="mr-1.5 h-3.5 w-3.5" />
            Relatar erro
          </Button>
        </div>
      </>
    )

    return (
      // Sem o cabeçalho do app: durante a resolução, menu, carrinho, sino e
      // tema não são usados — e eram a primeira coisa da tela. O que fica no
      // topo é o que serve ali: sair, onde estou, quanto falta.
      <AppShell showHeader={false} controlesFlutuantes={false}>
        <CabecalhoQuiz
          aoSair={voltarParaLista}
          rotuloSair="Sair do simulado"
          progresso={{ atual: questaoAtual, total: questoes.length }}
          detalhes={detalhesDaQuestao}
        />

        {/* A folga no rodapé é a altura REAL da barra fixa (ela publica a
            própria altura): sem isso, o último bloco fica escondido atrás dos
            botões — e a barra cresce quando o veredito entra nela. */}
        <div
          className="container mx-auto max-w-4xl space-y-4 px-4 py-5"
          style={{ paddingBottom: 'calc(var(--gx-barra-inferior-h, 6rem) + 1.5rem)' }}
        >
          {/* Se finalizado, mostrar resultado */}
          {simuladoFinalizado && (
            <Card className="border-[#468152]/30 bg-gradient-to-r from-[#468152]/10 to-[#E2A43E]/10">
              <CardContent className="py-6">
                <div className="space-y-4 text-center">
                  <h3 className="font-heading text-2xl font-bold">Simulado finalizado!</h3>
                  <div className="text-4xl font-bold text-[#468152]">
                    {resultado.acertos} / {resultado.total}
                  </div>
                  <p className="text-lg text-muted-foreground">
                    Você acertou {resultado.porcentagem.toFixed(0)}% das questões objetivas
                  </p>
                  <div className="mt-4 flex justify-center gap-3">
                    <Button onClick={() => iniciarSimulado(modoCorrecao)}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Refazer
                    </Button>
                    <Button variant="outline" onClick={voltarParaLista}>
                      <List className="mr-2 h-4 w-4" />
                      Ver lista
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Questão atual */}
          <Card>
            <CardContent className="p-4 sm:p-5">
              <InlineAnnotationCanvas
                questionId={questaoId}
                questionNumber={questaoAtual + 1}
                annotation={getAnnotationForQuestion(questaoId)}
                onChange={handleSaveAnnotation}
                className="space-y-5"
              >
                {/* Enunciado */}
                <div className="prose dark:prose-invert max-w-none">
                  <HighlightableText
                    text={formatText(questao.enunciado)}
                    highlights={highlights[questaoId] || []}
                    target="statement"
                    onHighlightsChange={(newHighlights) => {
                      setHighlights(prev => ({
                        ...prev,
                        [questaoId]: newHighlights
                      }))
                    }}
                    className="select-text"
                  />
                </div>

                {/* Imagem */}
                {questao.imagemUrl && (
                  <div
                    className="group relative flex cursor-pointer justify-center"
                    onClick={() => {
                      setModalImageUrl(questao.imagemUrl!)
                      setShowImageModal(true)
                    }}
                  >
                    <img
                      src={questao.imagemUrl}
                      alt="Imagem da questão"
                      className="h-auto max-h-80 w-auto max-w-full rounded-lg border object-contain transition-all group-hover:scale-[1.02] group-hover:shadow-lg md:max-w-md"
                    />
                  </div>
                )}

                {/* Alternativas (objetiva) */}
                {questao.tipo === 'objetiva' && questao.alternativas && (
                  <div className="space-y-2.5">
                    {!mostrarResultadoAtual && (
                      <p className="text-xs text-muted-foreground">
                        Toque no X para riscar uma alternativa
                      </p>
                    )}
                    {questao.alternativas.map((alt) => (
                      <AlternativaQuiz
                        key={alt.letra}
                        letra={alt.letra}
                        texto={formatText(alt.texto)}
                        marcada={respostaAtual?.alternativaSelecionada === alt.letra}
                        riscada={isAlternativaRiscada(questaoId, alt.letra)}
                        conferida={!!mostrarResultadoAtual}
                        correta={!!alt.correta}
                        aoMarcar={() => setResposta(questaoId, 'objetiva', alt.letra)}
                        aoRiscar={() => toggleRiscarAlternativa(questaoId, alt.letra)}
                      />
                    ))}
                  </div>
                )}

                {/* Campo de resposta (discursiva) */}
                {questao.tipo === 'discursiva' && (
                  <div className="space-y-2">
                    <Label>Sua resposta:</Label>
                    <Textarea
                      value={respostaAtual?.respostaDiscursiva || ''}
                      onChange={(e) => setResposta(questaoId, 'discursiva', e.target.value)}
                      placeholder="Digite sua resposta..."
                      rows={6}
                      disabled={mostrarResultadoAtual}
                    />
                  </div>
                )}
              </InlineAnnotationCanvas>
            </CardContent>
          </Card>

          {/* Correção — destino da rolagem guiada do "Ver por que". */}
          {mostrarResultadoAtual && (
            <PainelDaExplicacao
              ref={explicacaoRef}
              veredito={veredito}
              letraCorreta={correta}
              destacado={explicacaoDestacada}
            >
              {questao.tipo === 'discursiva' && questao.respostaModelo && (
                <TrechoDaCorrecao titulo="Resposta modelo">
                  {formatText(questao.respostaModelo)}
                </TrechoDaCorrecao>
              )}

              {questao.explicacao && (
                <TrechoDaCorrecao titulo="Explicação">
                  {formatText(questao.explicacao)}
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
                    Copie o prompt e cole no ChatGPT, Claude ou outra IA para uma correção detalhada.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyDiscursivePrompt(questao)}
                    >
                      {copiedPromptId === questaoId ? (
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

                    {selfScores[questaoId] !== undefined ? (
                      <div className="flex items-center gap-2 rounded-md border border-violet-300 bg-violet-100 px-3 py-1.5 dark:border-violet-700 dark:bg-violet-900/30">
                        <Star className="h-4 w-4 text-violet-600" />
                        <span className="text-sm font-medium">Nota: {selfScores[questaoId]}%</span>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenSelfScore(questaoId)}
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

          {/* Navegação do desktop. No celular ela vive na barra do rodapé (a
              barra é `apenasMobile`: no desktop ela passaria por baixo da
              sidebar, que é fixa e mais alta na pilha). */}
          <div className="hidden items-center justify-between gap-3 md:flex">
            <Button
              variant="outline"
              onClick={questaoAnterior}
              disabled={questaoAtual === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>

            <div className="flex gap-2">
              {podeVerResposta && (
                <Button onClick={() => verificarResposta(questaoAtual)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver resposta
                </Button>
              )}

              {ehUltima ? (
                <Button
                  onClick={finalizarSimulado}
                  className="btn-brand-glow text-white"
                  disabled={finalizarBloqueado}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Finalizar
                </Button>
              ) : (
                <Button onClick={proximaQuestao} className="btn-brand-glow text-white">
                  Próxima
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Navegação rápida — no desktop ela cabe na página; no celular vira
              painel, aberto pelo botão do mapa na barra do rodapé. */}
          <Card className="hidden md:block">
            <CardContent className="py-4">
              {naoRespondidas > 0 && !simuladoFinalizado ? (
                <div className="mb-3 text-center text-sm text-muted-foreground">
                  <span className="font-medium text-orange-500">{naoRespondidas}</span>
                  {naoRespondidas === 1 ? ' questão não respondida' : ' questões não respondidas'}
                </div>
              ) : null}
              <MapaDeQuestoes
                questoes={questoes}
                questaoAtual={questaoAtual}
                mostrarResultado={mostrarResultado}
                getResposta={(id) => getRespostaAtual(id)}
                onIr={irParaQuestao}
              />
            </CardContent>
          </Card>

          {/* Modal de Imagem Expandida */}
          <ImageModal
            isOpen={showImageModal}
            onClose={() => setShowImageModal(false)}
            src={modalImageUrl}
            alt="Imagem da questão"
          />

          {/* Modal de Relatar Erro */}
          {reportQuestionId && (
            <ReportQuestionModal
              questionId={reportQuestionId}
              isOpen={!!reportQuestionId}
              onClose={() => setReportQuestionId(null)}
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
              <div className="space-y-3 py-4">
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

        {/* ── Barra de ações ───────────────────────────────────────────────
            O "Próxima" ficava no fim do cartão da questão: enunciado longo,
            cinco alternativas, gabarito e explicação depois de responder —
            várias telas de rolagem para dar UM passo. Agora ele acompanha a
            leitura, e é a MESMA barra que carrega o veredito: conferir a
            resposta muda a tela exatamente onde o polegar já estava. */}
        <BarraInferior apenasMobile>
          <FolhaDeFeedback
            veredito={explicacaoNaTela ? null : veredito}
            letraCorreta={correta}
            temExplicacao={temCorrecaoParaLer}
            aoVerExplicacao={irParaExplicacao}
          >
            <button
              type="button"
              onClick={questaoAnterior}
              disabled={questaoAtual === 0}
              aria-label="Questão anterior"
              className="tecla flex h-14 w-14 flex-none items-center justify-center disabled:opacity-35"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => setMapaAberto(true)}
              aria-label="Abrir o mapa de questões"
              className="tecla flex h-14 w-14 flex-none items-center justify-center md:hidden"
            >
              <LayoutGrid className="h-5 w-5" />
            </button>

            {simuladoFinalizado ? (
              // Terminado, "Finalizar" de novo não faria nada. O que resta a
              // fazer é ler o resultado, que está no topo da página.
              <Button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="btn-brand-glow h-14 min-w-0 flex-1 gap-1.5 rounded-2xl text-[15px] font-bold text-white"
              >
                <CheckCircle2 className="h-4 w-4" />
                Ver resultado
              </Button>
            ) : podeVerResposta ? (
              <Button
                onClick={() => verificarResposta(questaoAtual)}
                className="h-14 min-w-0 flex-1 gap-1.5 rounded-2xl text-[15px] font-bold"
              >
                <Eye className="h-4 w-4" />
                Ver resposta
              </Button>
            ) : ehUltima ? (
              <Button
                onClick={finalizarSimulado}
                disabled={finalizarBloqueado}
                className="btn-brand-glow h-14 min-w-0 flex-1 gap-1.5 rounded-2xl text-[15px] font-bold text-white"
              >
                <CheckCircle2 className="h-4 w-4" />
                Finalizar
              </Button>
            ) : (
              <Button
                onClick={proximaQuestao}
                className="btn-brand-glow h-14 min-w-0 flex-1 gap-1.5 rounded-2xl text-[15px] font-bold text-white"
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </FolhaDeFeedback>
        </BarraInferior>

        {/* ── Mapa de questões no celular ──────────────────────────────── */}
        {mapaAberto ? (
          <Portal>
            <div
              className="fixed inset-0 z-[210] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm md:hidden"
              style={{
                paddingTop: 'max(1rem, env(safe-area-inset-top))',
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setMapaAberto(false)
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Mapa de questões"
                className="vidro-denso vidro-brilho relevo flex max-h-full w-full max-w-sm flex-col rounded-[28px] p-4"
              >
                <div className="flex items-center justify-between gap-2 pb-3">
                  <h2 className="text-sm font-bold">Ir para a questão</h2>
                  <button
                    type="button"
                    onClick={() => setMapaAberto(false)}
                    aria-label="Fechar"
                    className="-m-1 rounded-lg p-1 text-muted-foreground hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {naoRespondidas > 0 && !simuladoFinalizado ? (
                  <p className="pb-3 text-center text-xs text-muted-foreground">
                    <span className="font-semibold text-orange-500">{naoRespondidas}</span>
                    {naoRespondidas === 1 ? ' questão não respondida' : ' questões não respondidas'}
                  </p>
                ) : null}
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <MapaDeQuestoes
                    questoes={questoes}
                    questaoAtual={questaoAtual}
                    mostrarResultado={mostrarResultado}
                    getResposta={(id) => getRespostaAtual(id)}
                    onIr={irParaQuestao}
                  />
                </div>
              </div>
            </div>
          </Portal>
        ) : null}
      </AppShell>
    )
  }

  // MODO LISTA (padrão)
  return (
    <AppShell headerTitle={lista.nome} headerSubtitle={`${questoes.length} questões`}>
      <div className="container max-w-5xl mx-auto py-6 px-4 space-y-6">
        {/* Navegação — rola no celular em vez de empilhar três botões. */}
        <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:justify-between sm:overflow-visible sm:px-0 sm:pb-0">
          <Button
            variant="ghost"
            className="h-9 flex-none rounded-xl text-xs"
            onClick={() => router.push('/banco-questoes/listas')}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Minhas listas
          </Button>

          {questoes.length > 0 && (
            <div className="flex flex-none gap-2">
              <Button
                variant="outline"
                className="h-9 flex-none rounded-xl text-xs"
                onClick={() => handleDownloadPdf(false)}
                disabled={downloadingPdf}
              >
                {downloadingPdf ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                )}
                PDF
              </Button>
              <Button
                variant="outline"
                className="h-9 flex-none rounded-xl text-xs"
                onClick={() => handleDownloadPdf(true)}
                disabled={downloadingPdf}
              >
                {downloadingPdf ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileText className="mr-1.5 h-3.5 w-3.5" />
                )}
                PDF com gabarito
              </Button>
            </div>
          )}
        </div>

        {/* Questões da lista */}
        {questoes.length === 0 ? (
          <div className="glass-page-card rounded-2xl px-6 py-14 text-center">
            <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
            <h3 className="text-base font-bold">Lista vazia</h3>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Abra o banco, use o botão de adicionar no cartão da questão e ela cai aqui.
            </p>
            <Button
              className="btn-brand-glow mt-5 h-10 rounded-xl text-sm font-bold text-white"
              onClick={() => router.push('/banco-questoes')}
            >
              Escolher questões
            </Button>
          </div>
        ) : (
          <>
            {/* ── Começar ────────────────────────────────────────────────
                Havia dois cartões de contorno lado a lado, do mesmo peso
                visual, e nenhum deles parecia o botão de começar: a tela abria
                com duas escolhas de igual importância antes que ficasse claro
                que ali era o INÍCIO. Agora há UM botão primário — grande,
                preenchido, dizendo o verbo — e a segunda opção é um link
                secundário embaixo, para quem quer o formato de simulado. */}
            <div className="glass-page-card relevo rounded-2xl p-4 sm:p-5">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-heading text-base font-bold">
                    Responder em sequência
                  </h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    As {questoes.length} questões, uma de cada vez, com o gabarito e a explicação a
                    cada resposta.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => iniciarSimulado('imediato')}
                className="btn-brand-glow mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-bold text-white active:scale-[0.99]"
              >
                <Play className="h-5 w-5 fill-current" />
                Começar as {questoes.length} questões
              </button>

              <button
                type="button"
                onClick={() => iniciarSimulado('final')}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-[0.99]"
              >
                <Eye className="h-3.5 w-3.5" />
                Ou fazer como simulado — respostas só no final
              </button>
            </div>

            {/* Lista de questões */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Questões da Lista</h4>
              {questoes.map((questao, index) => (
                <Card
                  key={String(questao._id)}
                  className="hover:border-primary/50 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className="flex-1 space-y-2 cursor-pointer"
                        onClick={() => router.push(`/banco-questoes/${questao._id}`)}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-muted-foreground">
                            #{index + 1}
                          </span>
                          <Badge variant={questao.tipo === 'objetiva' ? 'default' : 'secondary'}>
                            {questao.tipo === 'objetiva' ? 'Objetiva' : 'Discursiva'}
                          </Badge>
                          <Badge variant="outline">{questao.periodoNome}</Badge>
                          {questao.moduloNome && (
                            <Badge variant="outline" className="text-xs">
                              {questao.moduloNome}
                            </Badge>
                          )}
                          {questao.topicoNome && (
                            <Badge variant="outline" className="text-xs">
                              {questao.topicoNome}
                            </Badge>
                          )}
                          {questao.ano && (
                            <Badge variant="outline" className="bg-primary/10 text-xs">
                              {questao.ano}
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm line-clamp-2 whitespace-pre-line">
                          {formatText(questao.enunciado)}
                        </p>

                        {questao.jaResolvida && (
                          <div className="flex items-center gap-1 text-xs">
                            {questao.ultimaResolucao?.correta ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="text-green-600">Acertou</span>
                              </>
                            ) : questao.tipo === 'objetiva' ? (
                              <>
                                <XCircle className="h-4 w-4 text-red-600" />
                                <span className="text-red-600">Errou</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                <span className="text-blue-600">Respondida</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoverQuestao(String(questao._id))}
                          disabled={removendo === String(questao._id)}
                        >
                          {removendo === String(questao._id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-500" />
                          )}
                        </Button>
                        <ChevronRight
                          className="h-5 w-5 text-muted-foreground cursor-pointer"
                          onClick={() => router.push(`/banco-questoes/${questao._id}`)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Modal de Imagem Expandida */}
        <ImageModal
          isOpen={showImageModal}
          onClose={() => setShowImageModal(false)}
          src={modalImageUrl}
          alt="Imagem da questão"
        />
      </div>

      {/* Modal de Relatar Erro */}
      {reportQuestionId && (
        <ReportQuestionModal
          questionId={reportQuestionId}
          isOpen={!!reportQuestionId}
          onClose={() => setReportQuestionId(null)}
        />
      )}
    </AppShell>
  )
}

/**
 * A grade de números que leva a qualquer questão.
 *
 * Uma implementação só, usada no cartão do desktop e no painel do celular. Ter
 * duas cópias faria as cores de "acertou"/"errou"/"não respondida" divergirem
 * na primeira alteração — e é justamente a cor que a pessoa usa para achar o
 * que falta.
 *
 * O estado nunca é só a cor: a questão atual leva anel, a respondida leva
 * preenchimento, a não respondida fica com a borda tracejada.
 */
function MapaDeQuestoes({
  questoes,
  questaoAtual,
  mostrarResultado,
  getResposta,
  onIr,
}: {
  questoes: BancoQuestaoComHierarquia[]
  questaoAtual: number
  mostrarResultado: boolean[]
  getResposta: (questaoId: string) => RespostaUsuario | undefined
  onIr: (indice: number) => void
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-2">
      {questoes.map((q, i) => {
        const resposta = getResposta(String(q._id))
        const respondida = !!resposta
        const mostrou = mostrarResultado[i]
        const correta = q.tipo === 'objetiva' ? q.alternativas?.find((a) => a.correta)?.letra : null
        const acertouEsta = q.tipo === 'objetiva' && resposta?.alternativaSelecionada === correta
        const corrigida = mostrou && q.tipo === 'objetiva'

        return (
          <button
            key={q._id ? String(q._id) : `q-${i}`}
            type="button"
            onClick={() => onIr(i)}
            aria-label={`Questão ${i + 1}${
              corrigida ? (acertouEsta ? ', acertou' : ', errou') : respondida ? ', respondida' : ', não respondida'
            }`}
            aria-current={i === questaoAtual ? 'true' : undefined}
            className={cn(
              'flex h-10 items-center justify-center rounded-xl border text-[13px] font-bold tabular-nums transition active:scale-95',
              corrigida
                ? acertouEsta
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-red-500 bg-red-500 text-white'
                : respondida
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-dashed border-border text-muted-foreground hover:bg-muted',
              i === questaoAtual && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
            )}
          >
            {i + 1}
          </button>
        )
      })}
    </div>
  )
}
