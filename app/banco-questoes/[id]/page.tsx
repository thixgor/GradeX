"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  XCircle,
  BookOpen,
  ListPlus,
  Clock,
  Loader2,
  AlertCircle,
  X,
  StickyNote,
  ZoomIn,
  Flag
} from 'lucide-react'
import { BancoQuestaoComHierarquia, BancoListaUsuario } from '@/lib/types/banco-questoes'
import { QuestionAnnotation, TextHighlight } from '@/lib/types'
import { QuestionNotesCanvas } from '@/components/question-notes-canvas'
import { HighlightableText } from '@/components/highlightable-text'
import { ImageModal } from '@/components/image-modal'
import { ReportQuestionModal } from '@/components/report-question-modal'
import { cn } from '@/lib/utils'

export default function QuestaoPage() {
  const { id } = useParams() // id from route /banco-questoes/[id]
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [questao, setQuestao] = useState<BancoQuestaoComHierarquia | null>(null)
  const [error, setError] = useState<string | null>(null)

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
  } | null>(null)

  // Estado para riscar alternativas
  const [alternativasRiscadas, setAlternativasRiscadas] = useState<Set<string>>(new Set())

  // Estados de Anotações
  const [annotations, setAnnotations] = useState<QuestionAnnotation[]>([])
  const [editingNotesFor, setEditingNotesFor] = useState<string | null>(null)

  // Modal de imagem expandida
  const [showImageModal, setShowImageModal] = useState(false)
  const [modalImageUrl, setModalImageUrl] = useState('')

  // Report Modal
  const [showReportModal, setShowReportModal] = useState(false)

  // Highlights de texto
  const [highlights, setHighlights] = useState<TextHighlight[]>([])

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
  function toggleRiscarAlternativa(letra: string, e: React.MouseEvent) {
    e.stopPropagation()
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

  useEffect(() => {
    loadQuestao()
    loadListas()
  }, [id])

  async function loadQuestao() {
    try {
      const res = await fetch(`/api/banco/questoes/${id}`)
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erro ao carregar questão')
        return
      }
      const data = await res.json()
      setQuestao(data.questao)

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
  return (
    <AppShell headerTitle="Questão">
      <div className="container max-w-4xl mx-auto py-6 px-4 space-y-6">
        {/* Navegação */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push('/banco-questoes')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowAddToListModal(true)}
          >
            <ListPlus className="h-4 w-4 mr-2" />
            Adicionar à lista
          </Button>
        </div>

        {/* Informações da questão */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={questao.tipo === 'objetiva' ? 'default' : 'secondary'}>
            {questao.tipo === 'objetiva' ? 'Objetiva' : 'Discursiva'}
          </Badge>
          <Badge variant="outline">{questao.periodoNome}</Badge>
          {questao.moduloNome && (
            <Badge variant="outline">{questao.moduloNome}</Badge>
          )}
          {questao.topicoNome && (
            <Badge variant="outline">{questao.topicoNome}</Badge>
          )}
          {questao.ano && (
            <Badge variant="outline" className="bg-primary/10">
              {questao.ano}
            </Badge>
          )}
          {questao.dificuldade && (
            <Badge
              variant="outline"
              className={
                questao.dificuldade === 'facil'
                  ? 'border-green-500 text-green-600'
                  : questao.dificuldade === 'medio'
                    ? 'border-yellow-500 text-yellow-600'
                    : 'border-red-500 text-red-600'
              }
            >
              {questao.dificuldade === 'facil' ? 'Fácil' :
                questao.dificuldade === 'medio' ? 'Médio' : 'Difícil'}
            </Badge>
          )}
        </div>

        {/* Enunciado */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Enunciado
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-orange-500"
              onClick={() => setShowReportModal(true)}
              title="Relatar erro na questão"
            >
              <Flag className="h-4 w-4 mr-2" />
              Relatar Erro
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              <HighlightableText
                text={questao.enunciado}
                highlights={highlights}
                target="statement"
                onHighlightsChange={setHighlights}
                className="select-text"
              />
            </div>

            {/* Imagem da questão */}
            {questao.imagemUrl && (
              <div
                className="mt-4 flex justify-center group relative cursor-pointer"
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

            {/* Botão de Anotações */}
            <div className="flex justify-start pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingNotesFor(String(questao._id))}
                className="bg-primary/10 hover:bg-primary/20 backdrop-blur-sm text-primary border border-primary/20"
              >
                <StickyNote className="h-4 w-4 mr-2" />
                {getAnnotationForQuestion(String(questao._id)) ? 'Editar Anotações' : 'Adicionar Anotações'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Área de resposta */}
        {questao.tipo === 'objetiva' ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Alternativas</span>
                {!mostrarResposta && (
                  <span className="text-xs font-normal text-muted-foreground">
                    Clique no X para riscar alternativas
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {questao.alternativas?.map((alt) => {
                const isSelected = alternativaSelecionada === alt.letra
                const isCorrect = mostrarResposta && alt.correta
                const isWrong = mostrarResposta && isSelected && !alt.correta
                const isRiscada = alternativasRiscadas.has(alt.letra)

                return (
                  <div
                    key={alt.letra}
                    className={cn(
                      "relative w-full text-left p-4 rounded-lg border transition-all",
                      !mostrarResposta && !isRiscada && "hover:border-primary/50 cursor-pointer",
                      isSelected && !mostrarResposta && "border-primary bg-primary/5",
                      isCorrect && "border-green-500 bg-green-50 dark:bg-green-900/20",
                      isWrong && "border-red-500 bg-red-50 dark:bg-red-900/20",
                      isRiscada && !mostrarResposta && "opacity-50 bg-muted/50",
                      mostrarResposta && "cursor-default"
                    )}
                    onClick={() => {
                      if (!mostrarResposta && !isRiscada) {
                        setAlternativaSelecionada(alt.letra)
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm",
                        isSelected && !mostrarResposta && "bg-primary text-primary-foreground",
                        isCorrect && "bg-green-500 text-white",
                        isWrong && "bg-red-500 text-white",
                        !isSelected && !isCorrect && !isWrong && "bg-muted"
                      )}>
                        {isCorrect ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : isWrong ? (
                          <XCircle className="h-5 w-5" />
                        ) : (
                          alt.letra
                        )}
                      </span>
                      <span className={cn(
                        "flex-1 pt-1 whitespace-pre-line",
                        isRiscada && "line-through text-muted-foreground"
                      )}>
                        {alt.texto}
                      </span>

                      {/* Botão de riscar */}
                      {!mostrarResposta && (
                        <button
                          onClick={(e) => toggleRiscarAlternativa(alt.letra, e)}
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
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sua Resposta</CardTitle>
            </CardHeader>
            <CardContent>
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

        {/* Botão de responder */}
        {!mostrarResposta && (
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleResponder}
              disabled={
                respondendo ||
                (questao.tipo === 'objetiva' && !alternativaSelecionada) ||
                (questao.tipo === 'discursiva' && !respostaDiscursiva.trim())
              }
              className="bg-gradient-to-r from-[#468152] to-[#E2A43E] hover:from-[#468152]/90 hover:to-[#E2A43E]/90"
            >
              {respondendo ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Verificar Resposta
                </>
              )}
            </Button>
          </div>
        )}

        {/* Resultado */}
        {mostrarResposta && resultado && (
          <Card className={cn(
            "border-2",
            questao.tipo === 'objetiva'
              ? resultado.correta
                ? "border-green-500"
                : "border-red-500"
              : "border-blue-500"
          )}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {questao.tipo === 'objetiva' ? (
                  resultado.correta ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-green-600">Resposta Correta!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="text-red-600">Resposta Incorreta</span>
                    </>
                  )
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    <span className="text-blue-600">Resposta Registrada</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {questao.tipo === 'discursiva' && resultado.respostaModelo && (
                <div className="space-y-2">
                  <Label className="font-medium">Resposta Modelo:</Label>
                  <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                    {resultado.respostaModelo}
                  </div>
                </div>
              )}

              {resultado.explicacao && (
                <div className="space-y-2">
                  <Label className="font-medium">Explicação:</Label>
                  <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                    {resultado.explicacao}
                  </div>
                </div>
              )}

              {questao.fonte && (
                <div className="space-y-2">
                  <Label className="font-medium">Fonte:</Label>
                  <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                    {questao.fonte}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Ações após resposta */}
        {mostrarResposta && (
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/banco-questoes')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Banco
            </Button>
            <Button
              variant="default"
              onClick={handleRefazer}
              className="bg-gradient-to-r from-[#468152] to-[#E2A43E] hover:from-[#468152]/90 hover:to-[#E2A43E]/90"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Refazer Questão
            </Button>
          </div>
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
        <Dialog open={showJaRespondidaModal} onOpenChange={setShowJaRespondidaModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[#468152]">
                <AlertCircle className="h-5 w-5" />
                Opa! Você já fez essa questão
              </DialogTitle>
              <DialogDescription className="text-base pt-2">
                Você já respondeu essa questão anteriormente. O que deseja fazer?
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-4 px-4"
                onClick={handleVerGabarito}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Ver Gabarito</div>
                    <div className="text-sm text-muted-foreground">
                      Rever a resposta correta e o que você marcou
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-auto py-4 px-4"
                onClick={handleRefazerQuestao}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                    <ArrowRight className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Refazer Questão</div>
                    <div className="text-sm text-muted-foreground">
                      Tentar novamente do zero
                    </div>
                  </div>
                </div>
              </Button>
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => router.push('/banco-questoes')}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Banco de Questões
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Anotações */}
        {editingNotesFor && questao && (
          <QuestionNotesCanvas
            questionId={String(questao._id)}
            questionNumber={1}
            initialAnnotation={getAnnotationForQuestion(String(questao._id))}
            onSave={handleSaveAnnotation}
            onClose={() => setEditingNotesFor(null)}
          />
        )}

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
      </div>
    </AppShell>
  )
}
