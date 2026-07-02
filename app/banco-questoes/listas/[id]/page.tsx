'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
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
  ZoomIn,
  Flag,
  Copy,
  ClipboardCheck,
  Star
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
import { BancoListaUsuario, BancoQuestaoComHierarquia } from '@/lib/types/banco-questoes'
import { QuestionAnnotation, TextHighlight } from '@/lib/types'
import { InlineAnnotationCanvas } from '@/components/inline-annotation-canvas'
import { HighlightableText } from '@/components/highlightable-text'
import { ImageModal } from '@/components/image-modal'
import { ReportQuestionModal } from '@/components/report-question-modal'
import { generateBancoListaPDF, downloadPDF, prewarmPDFAssets } from '@/lib/pdf-generator'

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

  function proximaQuestao() {
    if (questaoAtual < questoes.length - 1) {
      setQuestaoAtual(questaoAtual + 1)
    }
  }

  function questaoAnterior() {
    if (questaoAtual > 0) {
      setQuestaoAtual(questaoAtual - 1)
    }
  }

  function finalizarSimulado() {
    setMostrarResultado(new Array(questoes.length).fill(true))
    setSimuladoFinalizado(true)
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
    const respostaAtual = getRespostaAtual(String(questao._id))
    const mostrarResultadoAtual = mostrarResultado[questaoAtual]
    const correta = questao.tipo === 'objetiva' ? questao.alternativas?.find(a => a.correta)?.letra : null
    const acertou = questao.tipo === 'objetiva' && respostaAtual?.alternativaSelecionada === correta
    const resultado = calcularResultado()

    return (
      <AppShell headerTitle={lista.nome} headerSubtitle={`Questão ${questaoAtual + 1} de ${questoes.length}`}>
        <div className="container max-w-4xl mx-auto py-6 px-4 space-y-6">
          {/* Header do simulado */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Button variant="ghost" onClick={voltarParaLista}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Sair do Simulado
            </Button>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">
                {modoCorrecao === 'imediato' ? 'Correção Imediata' : 'Correção no Final'}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadPdf(false)}
                  disabled={downloadingPdf}
                >
                  {downloadingPdf ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Download className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadPdf(true)}
                  disabled={downloadingPdf}
                  title="PDF com Gabarito"
                >
                  {downloadingPdf ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <FileText className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progresso</span>
              <span>{questaoAtual + 1} / {questoes.length}</span>
            </div>
            <Progress value={((questaoAtual + 1) / questoes.length) * 100} />
          </div>

          {/* Se finalizado, mostrar resultado */}
          {simuladoFinalizado && (
            <Card className="bg-gradient-to-r from-[#468152]/10 to-[#E2A43E]/10 border-[#468152]/30">
              <CardContent className="py-6">
                <div className="text-center space-y-4">
                  <h3 className="text-2xl font-bold">Simulado Finalizado!</h3>
                  <div className="text-4xl font-bold text-[#468152]">
                    {resultado.acertos} / {resultado.total}
                  </div>
                  <p className="text-lg text-muted-foreground">
                    Você acertou {resultado.porcentagem.toFixed(0)}% das questões objetivas
                  </p>
                  <div className="flex gap-3 justify-center mt-4">
                    <Button onClick={() => iniciarSimulado(modoCorrecao)}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Refazer
                    </Button>
                    <Button variant="outline" onClick={voltarParaLista}>
                      <List className="h-4 w-4 mr-2" />
                      Ver Lista
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Questão atual */}
          <Card>

            <CardHeader className="flex flex-row items-center justify-between py-2 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
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
                  <Badge variant="outline" className="bg-primary/10 text-xs">
                    {questao.ano}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-orange-500"
                onClick={() => setReportQuestionId(String(questao._id))}
                title="Relatar erro na questão"
              >
                <Flag className="h-4 w-4 mr-2" />
                Relatar Erro
              </Button>
            </CardHeader>
            <CardContent>
            <InlineAnnotationCanvas
              questionId={String(questao._id)}
              questionNumber={questaoAtual + 1}
              annotation={getAnnotationForQuestion(String(questao._id))}
              onChange={handleSaveAnnotation}
              className="space-y-6"
            >
              {/* Enunciado */}
              <div className="prose dark:prose-invert max-w-none">
                <HighlightableText
                  text={formatText(questao.enunciado)}
                  highlights={highlights[String(questao._id)] || []}
                  target="statement"
                  onHighlightsChange={(newHighlights) => {
                    setHighlights(prev => ({
                      ...prev,
                      [String(questao._id)]: newHighlights
                    }))
                  }}
                  className="select-text"
                />
              </div>

              {/* Imagem */}
              {questao.imagemUrl && (
                <div
                  className="flex justify-center group relative cursor-pointer"
                  onClick={() => {
                    setModalImageUrl(questao.imagemUrl!)
                    setShowImageModal(true)
                  }}
                >
                  <img
                    src={questao.imagemUrl}
                    alt="Imagem da questão"
                    className="max-w-full md:max-w-md max-h-80 w-auto h-auto rounded-lg border object-contain transition-all group-hover:scale-[1.02] group-hover:shadow-lg"
                  />
                </div>
              )}

              {/* Alternativas (objetiva) */}
              {questao.tipo === 'objetiva' && questao.alternativas && (
                <div className="space-y-3">
                  {!mostrarResultadoAtual && (
                    <p className="text-xs text-muted-foreground">
                      Clique no X para riscar alternativas
                    </p>
                  )}
                  {questao.alternativas.map((alt) => {
                    const questaoIdStr = String(questao._id)
                    const isSelected = respostaAtual?.alternativaSelecionada === alt.letra
                    const isCorreta = alt.correta
                    const isRiscada = isAlternativaRiscada(questaoIdStr, alt.letra)
                    let bgClass = ''

                    if (mostrarResultadoAtual) {
                      if (isCorreta) {
                        bgClass = 'bg-green-100 dark:bg-green-900/30 border-green-500'
                      } else if (isSelected && !isCorreta) {
                        bgClass = 'bg-red-100 dark:bg-red-900/30 border-red-500'
                      }
                    }

                    return (
                      <div
                        key={alt.letra}
                        className={cn(
                          "flex items-start space-x-3 p-4 rounded-lg border transition-colors",
                          bgClass,
                          !mostrarResultadoAtual && !isRiscada && "hover:bg-muted/50 cursor-pointer",
                          isRiscada && !mostrarResultadoAtual && "opacity-50 bg-muted/50",
                          isSelected && !mostrarResultadoAtual && "border-primary bg-primary/5"
                        )}
                        onClick={() => {
                          if (!mostrarResultadoAtual && !isRiscada) {
                            setResposta(questaoIdStr, 'objetiva', alt.letra)
                          }
                        }}
                      >
                        <div className={cn(
                          "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center",
                          isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                        )}>
                          {isSelected && <div className="w-3 h-3 rounded-full bg-white" />}
                        </div>
                        <span className={cn(
                          "flex-1 whitespace-pre-line",
                          isRiscada && "line-through text-muted-foreground"
                        )}>
                          <span className="font-semibold mr-2">{alt.letra})</span>
                          {alt.texto}
                        </span>

                        {/* Botão de riscar */}
                        {!mostrarResultadoAtual && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleRiscarAlternativa(questaoIdStr, alt.letra)
                            }}
                            className={cn(
                              "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all",
                              isRiscada
                                ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 hover:bg-orange-200 dark:hover:bg-orange-900/50"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"
                            )}
                            title={isRiscada ? "Desriscar alternativa" : "Riscar alternativa"}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}

                        {mostrarResultadoAtual && isCorreta && (
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                        )}
                        {mostrarResultadoAtual && isSelected && !isCorreta && (
                          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Campo de resposta (discursiva) */}
              {questao.tipo === 'discursiva' && (
                <div className="space-y-2">
                  <Label>Sua resposta:</Label>
                  <Textarea
                    value={respostaAtual?.respostaDiscursiva || ''}
                    onChange={(e) => setResposta(String(questao._id), 'discursiva', e.target.value)}
                    placeholder="Digite sua resposta..."
                    rows={6}
                    disabled={mostrarResultadoAtual}
                  />
                </div>
              )}

              {/* Feedback */}
              {mostrarResultadoAtual && (
                <div className="space-y-4 pt-4 border-t">
                  {questao.tipo === 'objetiva' && (
                    <div className={`p-4 rounded-lg ${acertou ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                      <div className="flex items-center gap-2 font-semibold">
                        {acertou ? (
                          <>
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <span className="text-green-700 dark:text-green-400">Resposta Correta!</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-5 w-5 text-red-600" />
                            <span className="text-red-700 dark:text-red-400">Resposta Incorreta</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {questao.tipo === 'discursiva' && questao.respostaModelo && (
                    <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-300">Resposta Modelo:</h4>
                      <p className="text-blue-900 dark:text-blue-200 whitespace-pre-wrap">{formatText(questao.respostaModelo)}</p>
                    </div>
                  )}

                  {questao.explicacao && (
                    <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                      <h4 className="font-semibold mb-2 text-amber-800 dark:text-amber-300">Explicação:</h4>
                      <p className="text-amber-900 dark:text-amber-200 whitespace-pre-wrap">{formatText(questao.explicacao)}</p>
                    </div>
                  )}

                  {questao.fonte && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Fonte:</h4>
                      <p className="whitespace-pre-wrap">{formatText(questao.fonte)}</p>
                    </div>
                  )}

                  {/* Correção por Prompt e Auto-avaliação (discursivas) */}
                  {questao.tipo === 'discursiva' && (
                    <div className="p-4 bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800 rounded-lg space-y-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Star className="h-4 w-4 text-violet-600" />
                        Correção via IA (Prompt)
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Copie o prompt e cole no ChatGPT, Claude ou outra IA para correção detalhada.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyDiscursivePrompt(questao)}
                        >
                          {copiedPromptId === String(questao._id) ? (
                            <>
                              <ClipboardCheck className="h-4 w-4 mr-2 text-green-600" />
                              Prompt Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Copiar Prompt de Correção
                            </>
                          )}
                        </Button>

                        {selfScores[String(questao._id)] !== undefined ? (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-violet-100 dark:bg-violet-900/30 border border-violet-300 dark:border-violet-700">
                            <Star className="h-4 w-4 text-violet-600" />
                            <span className="text-sm font-medium">Nota: {selfScores[String(questao._id)]}%</span>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenSelfScore(String(questao._id))}
                          >
                            <Star className="h-4 w-4 mr-2" />
                            Atribuir Nota
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </InlineAnnotationCanvas>

              {/* Botões de ação */}
              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={questaoAnterior}
                  disabled={questaoAtual === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>

                <div className="flex gap-2">
                  {modoCorrecao === 'imediato' && !mostrarResultadoAtual && respostaAtual && (
                    <Button onClick={() => verificarResposta(questaoAtual)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Resposta
                    </Button>
                  )}

                  {questaoAtual === questoes.length - 1 ? (
                    <Button
                      onClick={finalizarSimulado}
                      className="bg-gradient-to-r from-[#468152] to-[#E2A43E]"
                      disabled={modoCorrecao === 'imediato' && !mostrarResultadoAtual && !!respostaAtual}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Finalizar
                    </Button>
                  ) : (
                    <Button onClick={proximaQuestao}>
                      Próxima
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navegação rápida */}
          <Card>
            <CardContent className="py-4">
              {/* Contador de questões não respondidas */}
              {(() => {
                const naoRespondidas = questoes.filter((q) => !getRespostaAtual(String(q._id))).length
                if (naoRespondidas > 0 && !simuladoFinalizado) {
                  return (
                    <div className="text-center mb-3 text-sm text-muted-foreground">
                      <span className="font-medium text-orange-500">{naoRespondidas}</span>
                      {naoRespondidas === 1 ? ' questão não respondida' : ' questões não respondidas'}
                    </div>
                  )
                }
                return null
              })()}
              <div className="flex flex-wrap gap-2 justify-center">
                {questoes.map((q, i) => {
                  const respondida = !!getRespostaAtual(String(q._id))
                  const mostrou = mostrarResultado[i]
                  const correcta = q.tipo === 'objetiva'
                    ? q.alternativas?.find(a => a.correta)?.letra
                    : null
                  const acertouEsta = q.tipo === 'objetiva' && getRespostaAtual(String(q._id))?.alternativaSelecionada === correcta

                  return (
                    <Button
                      key={i}
                      variant={i === questaoAtual ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        "w-10 h-10",
                        mostrou && q.tipo === 'objetiva'
                          ? acertouEsta
                            ? 'bg-green-500 hover:bg-green-600 text-white border-green-500'
                            : 'bg-red-500 hover:bg-red-600 text-white border-red-500'
                          : respondida
                            ? 'border-primary bg-primary/10'
                            : 'border-orange-400/50 bg-orange-50 dark:bg-orange-900/10'
                      )}
                      onClick={() => setQuestaoAtual(i)}
                    >
                      {i + 1}
                    </Button>
                  )
                })}
              </div>
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
                  Confirmar Nota
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </AppShell >
    )
  }

  // MODO LISTA (padrão)
  return (
    <AppShell headerTitle={lista.nome} headerSubtitle={`${questoes.length} questões`}>
      <div className="container max-w-5xl mx-auto py-6 px-4 space-y-6">
        {/* Navegação */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/banco-questoes/listas')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar às Listas
          </Button>

          {questoes.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={() => handleDownloadPdf(false)}
                disabled={downloadingPdf}
              >
                {downloadingPdf ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Baixar PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDownloadPdf(true)}
                disabled={downloadingPdf}
              >
                {downloadingPdf ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                PDF com Gabarito
              </Button>
            </div>
          )}
        </div>

        {/* Questões da lista */}
        {questoes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-medium">Lista vazia</h3>
              <p className="text-muted-foreground mb-4">
                Adicione questões a esta lista pelo banco de questões
              </p>
              <Button onClick={() => router.push('/banco-questoes')}>
                Ir para o Banco de Questões
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Botões de iniciar simulado */}
            <Card className="bg-gradient-to-r from-[#468152]/10 to-[#E2A43E]/10 border-[#468152]/30">
              <CardContent className="py-6">
                <div className="text-center space-y-4">
                  <h3 className="text-xl font-bold">Pronto para praticar?</h3>
                  <p className="text-muted-foreground">
                    Inicie o simulado e responda as {questoes.length} questões desta lista
                  </p>
                  <div className="flex gap-4 justify-center flex-wrap">
                    <Button
                      onClick={() => iniciarSimulado('imediato')}
                      className="bg-gradient-to-r from-[#468152] to-[#E2A43E] hover:from-[#468152]/90 hover:to-[#E2A43E]/90"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Iniciar com Correção Imediata
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => iniciarSimulado('final')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Iniciar com Correção no Final
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

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
