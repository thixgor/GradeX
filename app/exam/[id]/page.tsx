'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { Countdown } from '@/components/countdown'
import { Toast } from '@/components/toast'
import { ToastAlert } from '@/components/ui/toast-alert'
import { BanChecker } from '@/components/ban-checker'
import { SignaturePad } from '@/components/signature-pad'
import { ExamTimer } from '@/components/exam-timer'
import { Barcode } from '@/components/barcode'
import { Logo } from '@/components/logo'
import { Exam, UserAnswer, TextHighlight, QuestionAnnotation } from '@/lib/types'
import { HighlightableText } from '@/components/highlightable-text'
import { formatDate } from '@/lib/utils'
import { downloadUserReportPDF } from '@/lib/user-report-generator'
import { ProctoringConsent } from '@/components/proctoring-consent'
import { ProctoringMonitor } from '@/components/proctoring-monitor'
import { QuestionNotesCanvas } from '@/components/question-notes-canvas'
import { useProctoring } from '@/hooks/use-proctoring'
import { useWebSocket } from '@/hooks/use-websocket'
import { useVisibilityDetection } from '@/hooks/use-visibility-detection'
import { useWebRTC } from '@/hooks/use-webrtc'
import { ArrowLeft, Check, X, Send, FileDown, Clock, User, CheckCircle2, AlertCircle, List, StickyNote } from 'lucide-react'

export default function ExamPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const [exam, setExam] = useState<Exam | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [started, setStarted] = useState(false)
  const [inWaitingRoom, setInWaitingRoom] = useState(false)
  const [canStart, setCanStart] = useState(false)

  const [userName, setUserName] = useState('')
  const [loggedUserName, setLoggedUserName] = useState('')
  const [themeTranscription, setThemeTranscription] = useState('')
  const [signature, setSignature] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [answers, setAnswers] = useState<UserAnswer[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [submissionScore, setSubmissionScore] = useState<string>('')
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [existingSubmissionId, setExistingSubmissionId] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'error' | 'success' | 'info'>('error')
  const [showUnansweredModal, setShowUnansweredModal] = useState(false)
  const [examStartTime, setExamStartTime] = useState<Date | null>(null)
  const [examDuration, setExamDuration] = useState<string>('')

  // Estados de Anotações
  const [annotations, setAnnotations] = useState<QuestionAnnotation[]>([])
  const [editingNotesFor, setEditingNotesFor] = useState<string | null>(null)

  // Estados de Proctoring
  const [showProctoringConsent, setShowProctoringConsent] = useState(false)
  const [proctoringAccepted, setProctoringAccepted] = useState(false)
  const [blackCameraTimer, setBlackCameraTimer] = useState<number | null>(null)
  const [proctoringError, setProctoringError] = useState<string | null>(null)

  // Estados de Timer por Questão
  const [showTimeWarningPopup, setShowTimeWarningPopup] = useState(false)
  const [timeWarningCountdown, setTimeWarningCountdown] = useState(3)
  const [questionTimeRemaining, setQuestionTimeRemaining] = useState<number | null>(null)
  const [questionTimerActive, setQuestionTimerActive] = useState(false)
  const [questionTimesSpent, setQuestionTimesSpent] = useState<Record<string, number>>({}) // Rastreia tempo já gasto por questão
  const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(new Set()) // Questões já visitadas

  // Estados de Feedback Modal para Provas Pessoais
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackData, setFeedbackData] = useState<{
    isCorrect: boolean
    selectedAlternative: string
    correctAlternative: string
    explanation?: string
    statement?: string
    command?: string
    commentedFeedback?: {
      correctAlternative: string
      explanations: Record<string, string>
    }
  } | null>(null)
  const [lockedQuestions, setLockedQuestions] = useState<Set<string>>(new Set()) // Questões respondidas e bloqueadas
  const [showCheckButton, setShowCheckButton] = useState(false) // Mostrar botão "Check & Continue"
  const [showFinalFeedback, setShowFinalFeedback] = useState(false) // Mostrar feedback final
  const [currentFeedbackIndex, setCurrentFeedbackIndex] = useState(0) // Índice do feedback atual

  // Verificar se a prova tem proctoring habilitado
  // Provas pessoais não suportam proctoring
  const hasProctoring = (exam?.proctoring?.enabled || false) && !(exam as any).isPersonalExam
  const needsCamera = exam?.proctoring?.camera || false
  const needsAudio = exam?.proctoring?.audio || false
  const needsScreen = exam?.proctoring?.screen || false
  const screenMode = exam?.proctoring?.screenMode || 'window'

  // Debug: Log configurações de proctoring
  useEffect(() => {
    if (exam) {
      console.log('[PROCTORING DEBUG] Configurações da prova:', {
        hasProctoring,
        proctoring: exam.proctoring,
        needsCamera,
        needsAudio,
        needsScreen,
        screenMode,
      })
    }
  }, [exam, hasProctoring, needsCamera, needsAudio, needsScreen, screenMode])

  // Hook de Proctoring
  const {
    cameraStream,
    audioStream,
    screenStream,
    error: proctoringHookError,
    isBlackCamera,
    initializeMedia,
    cleanup,
    videoRef,
    canvasRef,
  } = useProctoring({
    camera: needsCamera,
    audio: needsAudio,
    screen: needsScreen,
    screenMode,
    onCameraBlack: () => {
      // Iniciar timer de 150 segundos quando câmera ficar preta
      if (blackCameraTimer === null) {
        setBlackCameraTimer(150)
      }
    },
    onCameraRestored: () => {
      // Cancelar timer quando câmera voltar ao normal
      setBlackCameraTimer(null)
    },
  })

  // Hook de WebRTC para streaming de vídeo/áudio/tela
  const {
    isConnected: webrtcConnected,
    createOffer: createWebRTCOffer,
    handleAnswer: handleWebRTCAnswer,
    addIceCandidate: addWebRTCIceCandidate,
  } = useWebRTC({
    localStream: cameraStream, // Stream da câmera (pode adicionar screen depois)
    sendSignal: (signal) => {
      // Enviar sinalização WebRTC via WebSocket
      if (wsConnected) {
        wsSendMessage(signal)
      }
    },
    enabled: hasProctoring && started && !submitted,
  })

  // Hook de WebSocket para comunicação em tempo real (apenas se proctoring ativo e prova iniciada)
  const { isConnected: wsConnected, sendMessage: wsSendMessage } = useWebSocket({
    userId: userId || 'temp-user',
    role: 'student',
    examId: id,
    userName,
    onMessage: (message) => {
      console.log('[WS] Mensagem recebida:', message)

      // Processar mensagens WebRTC
      if (message.type === 'webrtc-answer') {
        handleWebRTCAnswer(message.answer)
      } else if (message.type === 'webrtc-ice-candidate') {
        addWebRTCIceCandidate(message.candidate)
      }
    },
    enabled: hasProctoring && started && !submitted, // Só conectar quando condições verdadeiras
    autoReconnect: true,
  })

  // Hook de detecção de troca de abas/janelas
  const { isVisible, switchCount } = useVisibilityDetection({
    enabled: hasProctoring && started && !submitted,
    onTabSwitch: (data) => {
      // Enviar alerta via WebSocket
      if (wsConnected) {
        wsSendMessage({
          type: 'tab-switch',
          data: {
            ...data,
            examId: id,
            userName,
            userId,
            switchCount: switchCount + 1,
          },
        })
      }
    },
  })

  // Iniciar WebRTC quando WebSocket conectar e stream estiver disponível
  useEffect(() => {
    console.log('[WebRTC DEBUG] Verificando condições:', {
      wsConnected,
      hasCameraStream: !!cameraStream,
      hasProctoring,
      started,
      submitted,
      webrtcConnected,
    })

    if (wsConnected && cameraStream && hasProctoring && started && !submitted && !webrtcConnected) {
      console.log('[WebRTC] ✅ Todas as condições OK - Iniciando oferta WebRTC...')
      createWebRTCOffer()
    } else {
      console.log('[WebRTC] ❌ Condições não atendidas - aguardando...')
    }
  }, [wsConnected, cameraStream, hasProctoring, started, submitted, webrtcConnected, createWebRTCOffer])

  const showToastMessage = (message: string, type: 'error' | 'success' | 'info' = 'error') => {
    setToastMessage(message)
    setToastType(type)
    setToastOpen(true)
  }

  // Carregar tempo de início do localStorage ao montar o componente
  useEffect(() => {
    const savedStartTime = localStorage.getItem(`exam-${id}-start-time`)
    if (savedStartTime) {
      setExamStartTime(new Date(savedStartTime))
    }
  }, [id])

  // Timer de câmera preta com auto-submit
  useEffect(() => {
    if (blackCameraTimer === null || !started) return

    if (blackCameraTimer <= 0) {
      // Auto-submeter prova quando timer chegar a zero
      handleAutoSubmit('Câmera bloqueada por mais de 2 minutos e 30 segundos')
      return
    }

    const interval = setInterval(() => {
      setBlackCameraTimer(prev => (prev !== null ? prev - 1 : null))
    }, 1000)

    return () => clearInterval(interval)
  }, [blackCameraTimer, started])

  // Cleanup do proctoring ao sair
  useEffect(() => {
    return () => {
      if (hasProctoring) {
        cleanup()
      }
    }
  }, [hasProctoring, cleanup])

  // Sincronizar erro do hook de proctoring
  useEffect(() => {
    if (proctoringHookError) {
      setProctoringError(proctoringHookError)
    }
  }, [proctoringHookError])

  // Função para iniciar a prova e salvar o tempo de início
  const handleStartExam = () => {
    console.log('[PROCTORING DEBUG] handleStartExam chamado', {
      hasProctoring,
      proctoringAccepted,
      showProctoringConsent,
    })

    // Se a prova tem proctoring e ainda não foi aceito, mostrar termo
    if (hasProctoring && !proctoringAccepted) {
      console.log('[PROCTORING DEBUG] Mostrando termo de consentimento')
      setShowProctoringConsent(true)
      return
    }

    // Verificar se alguma questão tem tempo definido
    const hasTimedQuestions = exam?.questions.some(q => q.timePerQuestionSeconds && q.timePerQuestionSeconds > 0)

    // Iniciar prova normalmente
    const startTime = new Date()
    setExamStartTime(startTime)
    localStorage.setItem(`exam-${id}-start-time`, startTime.toISOString())
    setStarted(true)

    // Se houver questões com tempo, mostrar popup de aviso por 3 segundos
    if (hasTimedQuestions) {
      setShowTimeWarningPopup(true)
      setTimeWarningCountdown(3)
    } else {
      // Se não houver questões com tempo, iniciar normalmente
      initializeQuestionTimer(0)
    }
  }

  // Função para aceitar termo de proctoring e inicializar mídia
  const handleProctoringAccept = async () => {
    try {
      const success = await initializeMedia()
      if (success) {
        setProctoringAccepted(true)
        setShowProctoringConsent(false)
        setProctoringError(null)

        // Iniciar prova após aceitar termo
        const startTime = new Date()
        setExamStartTime(startTime)
        localStorage.setItem(`exam-${id}-start-time`, startTime.toISOString())

        // Criar submission inicial para tracking de proctoring
        // (sem respostas ainda, só para aparecer no painel admin)
        try {
          await fetch(`/api/exams/${id}/start-proctoring`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userName,
              startedAt: startTime.toISOString(),
            }),
          })
          console.log('[PROCTORING DEBUG] Sessão de monitoramento criada')
        } catch (err) {
          console.error('[PROCTORING DEBUG] Erro ao criar sessão:', err)
          // Não bloqueia a prova se falhar
        }

        setStarted(true)
      } else {
        throw new Error('Não foi possível inicializar os dispositivos de monitoramento')
      }
    } catch (error: any) {
      setProctoringError(error.message || 'Erro ao configurar monitoramento')
      throw error
    }
  }

  // Função para rejeitar termo de proctoring
  const handleProctoringReject = () => {
    setShowProctoringConsent(false)
    showToastMessage('Você precisa aceitar o termo de monitoramento para iniciar a prova', 'info')
  }

  // Função para calcular o tempo decorrido
  const calculateDuration = (startTime: Date, endTime: Date): string => {
    const diffMs = endTime.getTime() - startTime.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const hours = Math.floor(diffMins / 60)
    const minutes = diffMins % 60

    if (hours > 0) {
      return `${hours}h ${minutes}min`
    }
    return `${minutes}min`
  }

  // Função para identificar questões não respondidas
  const getUnansweredQuestions = () => {
    return answers
      .map((answer, index) => {
        const question = exam?.questions[index]
        if (!question) return null

        const isUnanswered =
          (question.type === 'multiple-choice' && !answer.selectedAlternative) ||
          (question.type === 'discursive' && (!answer.discursiveText || answer.discursiveText.trim() === '')) ||
          (question.type === 'essay' && (!answer.essayText || answer.essayText.trim() === ''))

        return isUnanswered ? { question, index } : null
      })
      .filter((item) => item !== null) as { question: any; index: number }[]
  }

  // Função para baixar PDF da prova
  const handleDownloadExamPDF = async () => {
    try {
      if (exam?.pdfUrl) {
        // Se tem PDF anexado, baixar esse
        window.open(exam.pdfUrl, '_blank')
      } else {
        // Caso contrário, gerar PDF do sistema
        const { generateExamPDF, downloadPDF } = await import('@/lib/pdf-generator')
        const blob = generateExamPDF(exam!, userId)
        downloadPDF(blob, `${exam!.title}.pdf`)
      }
    } catch (error: any) {
      showToastMessage('Erro ao baixar PDF: ' + error.message)
    }
  }

  useEffect(() => {
    checkExistingSubmission()
    loadExam()
    loadUserInfo()
  }, [id])

  useEffect(() => {
    if (!exam) return

    // Se for prova prática, sempre pode iniciar
    if (exam.isPracticeExam) {
      setCanStart(true)
      return
    }

    const checkExamStatus = () => {
      const now = new Date()
      const startTime = new Date(exam.startTime)
      const endTime = new Date(exam.endTime)

      // Verifica se a prova já terminou
      if (now > endTime) {
        router.push(`/exam/${id}/results`)
        return
      }

      // Verifica se a prova já começou
      if (now >= startTime) {
        setCanStart(true)
      } else {
        setCanStart(false)
      }
    }

    checkExamStatus()
    const interval = setInterval(checkExamStatus, 1000)

    return () => clearInterval(interval)
  }, [exam, id, router])

  async function checkExistingSubmission() {
    try {
      const resAuth = await fetch('/api/auth/me')
      if (!resAuth.ok) return

      const authData = await resAuth.json()
      const currentUserId = authData.user.id
      setUserId(currentUserId)

      // Carregar exam primeiro para verificar se é prova prática
      const resExam = await fetch(`/api/exams/${id}`)
      const examData = await resExam.json()

      // Se for prova prática, não bloquear múltiplas tentativas
      if (examData.exam?.isPracticeExam) {
        return
      }

      const res = await fetch(`/api/exams/${id}/check-submission`)
      if (res.ok) {
        const data = await res.json()
        if (data.hasSubmitted) {
          setAlreadySubmitted(true)
          setExistingSubmissionId(data.submissionId)
        }
      }
    } catch (error) {
      console.error('Erro ao verificar submissao:', error)
    }
  }

  async function loadExam() {
    try {
      const res = await fetch(`/api/exams/${id}`)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      let examData = data.exam

      // Se shuffleQuestions estiver ativado, embaralhar a ordem das questões
      if (examData.shuffleQuestions) {
        const shuffled = [...examData.questions]

        // Fisher-Yates shuffle
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }

        // Renumerar questões após embaralhar
        shuffled.forEach((q: any, idx: number) => {
          q.number = idx + 1
        })

        examData = { ...examData, questions: shuffled }
      }

      setExam(examData)

      // Inicializa respostas
      const initialAnswers: UserAnswer[] = examData.questions.map((q: any) => ({
        questionId: q.id,
        selectedAlternative: q.type === 'multiple-choice' ? '' : undefined,
        crossedAlternatives: q.type === 'multiple-choice' ? [] : undefined,
        discursiveText: q.type === 'discursive' ? '' : undefined,
        essayText: q.type === 'essay' ? '' : undefined,
      }))
      setAnswers(initialAnswers)
    } catch (error: any) {
      showToastMessage(error.message)
      setTimeout(() => router.push('/'), 2000)
    } finally {
      setLoading(false)
    }
  }

  async function loadUserInfo() {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setLoggedUserName(data.user.name)
        // Se allowCustomName for false, usar nome do usuário automaticamente
        // será feito no useEffect abaixo quando exam estiver carregado
      }
    } catch (error) {
      // Silently fail - user can still enter name manually
    }
  }

  // Setar nome automaticamente se allowCustomName for false
  useEffect(() => {
    if (exam && loggedUserName && !exam.allowCustomName && !userName) {
      setUserName(loggedUserName)
    }
  }, [exam, loggedUserName, userName])

  // Auto-iniciar provas práticas
  useEffect(() => {
    if (exam && exam.isPracticeExam && !started && !loading) {
      // Provas práticas iniciam automaticamente
      const startTime = new Date()
      setExamStartTime(startTime)
      localStorage.setItem(`exam-${id}-start-time`, startTime.toISOString())
      setStarted(true)

      // Verificar se tem questões com tempo para mostrar popup
      const hasTimedQuestions = exam.questions.some(q => q.timePerQuestionSeconds && q.timePerQuestionSeconds > 0)
      if (hasTimedQuestions) {
        setShowTimeWarningPopup(true)
        setTimeWarningCountdown(3)
      } else {
        initializeQuestionTimer(0)
      }
    }
  }, [exam, started, loading])

  // Função para inicializar o timer de uma questão específica
  function initializeQuestionTimer(questionIndex: number) {
    if (!exam) return

    const question = exam.questions[questionIndex]

    // Marcar questão como visitada
    setVisitedQuestions(prev => new Set(prev).add(questionIndex))

    if (question?.timePerQuestionSeconds && question.timePerQuestionSeconds > 0) {
      // Se a questão já foi visitada e tem tempo salvo, usar o tempo restante
      const timeSpent = questionTimesSpent[question.id] || 0
      const timeRemaining = Math.max(0, question.timePerQuestionSeconds - timeSpent)

      if (timeRemaining > 0) {
        setQuestionTimeRemaining(timeRemaining)
        setQuestionTimerActive(true)
      } else {
        // Tempo já esgotado, avançar automaticamente
        setQuestionTimeRemaining(null)
        setQuestionTimerActive(false)
        setTimeout(() => {
          if (questionIndex < exam.questions.length - 1) {
            setCurrentQuestionIndex(questionIndex + 1)
          }
        }, 500)
      }
    } else {
      setQuestionTimeRemaining(null)
      setQuestionTimerActive(false)
    }
  }

  // Countdown do popup de aviso (3 segundos)
  useEffect(() => {
    if (showTimeWarningPopup && timeWarningCountdown > 0) {
      const timer = setTimeout(() => {
        setTimeWarningCountdown(timeWarningCountdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (showTimeWarningPopup && timeWarningCountdown === 0) {
      setShowTimeWarningPopup(false)
      // Iniciar timer da primeira questão
      initializeQuestionTimer(currentQuestionIndex)
    }
  }, [showTimeWarningPopup, timeWarningCountdown])

  // Timer da questão atual
  useEffect(() => {
    if (questionTimerActive && questionTimeRemaining !== null && questionTimeRemaining > 0 && started && exam) {
      const timer = setInterval(() => {
        const currentQuestion = exam.questions[currentQuestionIndex]

        setQuestionTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            // Tempo esgotado - salvar tempo total gasto
            if (currentQuestion?.timePerQuestionSeconds) {
              setQuestionTimesSpent(prevTimes => ({
                ...prevTimes,
                [currentQuestion.id]: currentQuestion.timePerQuestionSeconds || 0
              }))
            }
            setQuestionTimerActive(false)
            autoSubmitCurrentQuestion()
            return null
          }

          // Salvar tempo gasto a cada segundo
          if (currentQuestion?.timePerQuestionSeconds) {
            const timeSpent = currentQuestion.timePerQuestionSeconds - prev
            setQuestionTimesSpent(prevTimes => ({
              ...prevTimes,
              [currentQuestion.id]: timeSpent
            }))
          }

          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [questionTimerActive, questionTimeRemaining, started, exam, currentQuestionIndex])

  // Auto-submeter questão atual quando o tempo acabar
  async function autoSubmitCurrentQuestion() {
    if (!exam) return

    const isScrollMode = exam.navigationMode === 'scroll'

    if (isScrollMode) {
      // Em modo scroll, simplesmente vai para a próxima questão
      if (currentQuestionIndex < exam.questions.length - 1) {
        const nextIndex = currentQuestionIndex + 1
        setCurrentQuestionIndex(nextIndex)
        initializeQuestionTimer(nextIndex)

        // Rolar até a próxima questão
        setTimeout(() => {
          const nextQuestion = exam.questions[nextIndex]
          const element = document.getElementById(`question-${nextQuestion.id}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 100)
      }
    } else {
      // Em modo paginado, avança para a próxima questão
      if (currentQuestionIndex < exam.questions.length - 1) {
        const nextIndex = currentQuestionIndex + 1
        setCurrentQuestionIndex(nextIndex)
        initializeQuestionTimer(nextIndex)
      }
    }
  }

  // Atualizar timer quando mudar de questão
  useEffect(() => {
    if (started && exam) {
      initializeQuestionTimer(currentQuestionIndex)
    }
  }, [currentQuestionIndex, started, exam])

  function handleSelectAlternative(questionId: string, alternativeId: string) {
    // Não permitir mudança se questão está bloqueada
    if (lockedQuestions.has(questionId)) {
      return
    }

    setAnswers(prev =>
      prev.map(a =>
        a.questionId === questionId
          ? { ...a, selectedAlternative: alternativeId }
          : a
      )
    )

    // Se for prova pessoal com feedback imediato, mostrar botão "Check & Continue"
    if (exam?.feedbackMode === 'immediate' && (exam as any).isPersonalExam) {
      setShowCheckButton(true)
    }
  }

  function handleCheckAnswer() {
    if (!exam || !currentQuestion) return

    const currentAnswer = answers.find(a => a.questionId === currentQuestion.id)
    if (!currentAnswer || !currentAnswer.selectedAlternative) {
      alert('Por favor, selecione uma alternativa antes de continuar')
      return
    }

    const selectedAlt = currentQuestion.alternatives.find(a => a.id === currentAnswer.selectedAlternative)
    const correctAlt = currentQuestion.alternatives.find(a => a.isCorrect)
    
    if (selectedAlt && correctAlt) {
      setFeedbackData({
        isCorrect: selectedAlt.isCorrect,
        selectedAlternative: selectedAlt.letter,
        correctAlternative: correctAlt.letter,
        explanation: currentQuestion.explanation,
        statement: currentQuestion.statement,
        command: currentQuestion.command,
        commentedFeedback: (currentQuestion as any).commentedFeedback
      })
      setShowFeedbackModal(true)
      setShowCheckButton(false)
      
      // Bloquear questão
      setLockedQuestions(prev => new Set(prev).add(currentQuestion.id))
    }
  }

  function handleToggleCross(questionId: string, alternativeId: string) {
    setAnswers(prev =>
      prev.map(a => {
        if (a.questionId === questionId) {
          const crossed = a.crossedAlternatives?.includes(alternativeId) || false
          return {
            ...a,
            crossedAlternatives: crossed
              ? a.crossedAlternatives?.filter(id => id !== alternativeId)
              : [...(a.crossedAlternatives || []), alternativeId]
          }
        }
        return a
      })
    )
  }

  function handleDiscursiveText(questionId: string, text: string) {
    setAnswers(prev =>
      prev.map(a =>
        a.questionId === questionId
          ? { ...a, discursiveText: text }
          : a
      )
    )
  }

  function handleEssayText(questionId: string, text: string) {
    setAnswers(prev =>
      prev.map(a =>
        a.questionId === questionId
          ? { ...a, essayText: text }
          : a
      )
    )
  }

  function handleHighlights(questionId: string, highlights: TextHighlight[]) {
    setAnswers(prev =>
      prev.map(a =>
        a.questionId === questionId
          ? { ...a, highlights }
          : a
      )
    )
  }

  function handleSaveAnnotation(annotation: QuestionAnnotation) {
    setAnnotations(prev => {
      const existing = prev.findIndex(a => a.questionId === annotation.questionId)
      if (existing >= 0) {
        // Update existing annotation
        const updated = [...prev]
        updated[existing] = annotation
        return updated
      } else {
        // Add new annotation
        return [...prev, annotation]
      }
    })
  }

  function getAnnotationForQuestion(questionId: string): QuestionAnnotation | undefined {
    return annotations.find(a => a.questionId === questionId)
  }

  // Função para auto-submeter a prova (chamada quando o timer de câmera preta chegar a zero)
  async function handleAutoSubmit(reason: string) {
    if (submitting || submitted) return

    setSubmitting(true)

    try {
      const endTime = new Date()
      const duration = examStartTime ? calculateDuration(examStartTime, endTime) : ''
      setExamDuration(duration)

      const res = await fetch(`/api/exams/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName,
          themeTranscription,
          answers,
          signature,
          startedAt: examStartTime?.toISOString(),
          forcedSubmit: true,
          forcedSubmitReason: reason,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      // Limpar localStorage
      localStorage.removeItem(`exam-${id}-start-time`)

      // Salvar score
      if (exam?.scoringMethod === 'normal') {
        setSubmissionScore(`${data.score} pontos (Submissão automática: ${reason})`)
      } else {
        setSubmissionScore(`Prova submetida automaticamente: ${reason}`)
      }

      // Limpar proctoring
      cleanup()

      setSubmitted(true)
    } catch (error: any) {
      console.error('Erro ao auto-submeter:', error)
      showToastMessage('Erro ao submeter prova automaticamente: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit() {
    // Validações
    if (!userName.trim()) {
      showToastMessage('Por favor, preencha seu nome completo', 'info')
      return
    }

    if (exam?.themePhrase && !themeTranscription.trim()) {
      showToastMessage('Por favor, transcreva a frase-tema', 'info')
      return
    }

    // Verificar questões não respondidas (múltipla escolha, discursivas e redações)
    const unanswered = answers.filter((a, index) => {
      const question = exam?.questions[index]
      if (question?.type === 'multiple-choice') {
        return !a.selectedAlternative
      } else if (question?.type === 'discursive') {
        return !a.discursiveText || a.discursiveText.trim() === ''
      } else if (question?.type === 'essay') {
        return !a.essayText || a.essayText.trim() === ''
      }
      return false
    })

    if (unanswered.length > 0) {
      const confirm = window.confirm(
        `Você deixou ${unanswered.length} questão(ões) sem resposta. Deseja continuar?`
      )
      if (!confirm) return
    }

    setSubmitting(true)

    try {
      const endTime = new Date()
      const duration = examStartTime ? calculateDuration(examStartTime, endTime) : ''
      setExamDuration(duration)

      const res = await fetch(`/api/exams/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName,
          themeTranscription,
          answers,
          signature,
          startedAt: examStartTime?.toISOString(),
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      // Limpar localStorage após submissão bem-sucedida
      localStorage.removeItem(`exam-${id}-start-time`)

      // Salvar score para mostrar depois
      if (exam?.scoringMethod === 'normal') {
        setSubmissionScore(`${data.score} pontos`)
      } else {
        setSubmissionScore(data.message || 'Prova submetida com sucesso!')
      }

      // Marcar como submetido ao invés de redirecionar
      setSubmitted(true)
    } catch (error: any) {
      showToastMessage(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Prova não encontrada</div>
      </div>
    )
  }


  // Renderizar modal de proctoring SEMPRE que necessário (independente de early returns)
  const proctoringModal = showProctoringConsent && (
    <ProctoringConsent
      examTitle={exam.title}
      camera={needsCamera}
      audio={needsAudio}
      screen={needsScreen}
      screenMode={screenMode}
      onAccept={handleProctoringAccept}
      onReject={handleProctoringReject}
    />
  )

  // Tela de conclusão após submissão
  if (submitted) {
    return (
      <>
        {proctoringModal}
        <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 dark:bg-green-900 rounded-full p-4">
                <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-3xl text-green-600 dark:text-green-400">
              Prova Concluída!
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {submissionScore}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Parabéns, {userName}!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sua prova foi submetida com sucesso. Você pode baixar um relatório com suas respostas para conferir quando o gabarito for divulgado.
              </p>
              {examDuration && (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Tempo de prova: {examDuration}</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {/* Botão de Feedback Final para Provas Pessoais */}
              {(exam as any)?.isPersonalExam && (
                <Button
                  className="w-full"
                  size="lg"
                  variant="default"
                  onClick={() => {
                    console.log('Abrindo feedback final...')
                    setShowFinalFeedback(true)
                    setCurrentFeedbackIndex(0)
                  }}
                >
                  📊 Ver Feedback de Todas as Questões
                </Button>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  downloadUserReportPDF({
                    exam,
                    examId: id,
                    userName,
                    signature,
                    answers,
                  })
                }}
              >
                <FileDown className="h-5 w-5 mr-2" />
                Baixar Relatório da Minha Prova
              </Button>

              {annotations.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    try {
                      const { generateAnnotationsPDF, downloadPDF } = await import('@/lib/pdf-generator')
                      const blob = generateAnnotationsPDF(exam.title, annotations)
                      downloadPDF(blob, `Anotacoes-${exam.title}.pdf`)
                    } catch (error: any) {
                      showToastMessage('Erro ao gerar PDF de anotações: ' + error.message)
                    }
                  }}
                >
                  <StickyNote className="h-4 w-4 mr-2" />
                  Baixar Anotações (PDF)
                </Button>
              )}

              {exam.pdfUrl && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(exam.pdfUrl, '_blank')}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Baixar PDF Original da Prova
                </Button>
              )}

              <Button
                variant="secondary"
                className="w-full"
                onClick={() => router.push('/')}
              >
                Voltar para Página Inicial
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Feedback Final para Todas as Questões */}
      {showFinalFeedback && exam && exam.questions && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <CardHeader className="sticky top-0 bg-background border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">
                    Feedback de Todas as Questões
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Questão {currentFeedbackIndex + 1} de {exam.questions.length}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFinalFeedback(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {(() => {
                const question = exam.questions[currentFeedbackIndex]
                const answer = answers.find(a => a.questionId === question.id)
                const selectedAlt = question.type === 'multiple-choice' 
                  ? question.alternatives.find(a => a.id === answer?.selectedAlternative)
                  : null
                const correctAlt = question.type === 'multiple-choice'
                  ? question.alternatives.find(a => a.isCorrect)
                  : null
                const isCorrect = selectedAlt?.isCorrect || false

                return (
                  <>
                    {/* Número e Tipo da Questão */}
                    <div className="flex items-center justify-between pb-4 border-b">
                      <div>
                        <h3 className="text-xl font-bold">Questão {question.number}</h3>
                        <p className="text-sm text-muted-foreground">
                          {question.type === 'multiple-choice' && 'Múltipla Escolha'}
                          {question.type === 'discursive' && 'Discursiva'}
                          {question.type === 'essay' && 'Redação'}
                        </p>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                        isCorrect 
                          ? 'bg-green-100 dark:bg-green-900' 
                          : 'bg-red-100 dark:bg-red-900'
                      }`}>
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-semibold text-green-700 dark:text-green-300">Correta</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            <span className="text-sm font-semibold text-red-700 dark:text-red-300">Incorreta</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Enunciado */}
                    {question.statement && (
                      <div className="bg-muted rounded-lg p-4 space-y-2">
                        <h4 className="font-semibold text-sm">Enunciado:</h4>
                        <p className="text-sm whitespace-pre-wrap">
                          {question.statement}
                        </p>
                      </div>
                    )}

                    {/* Comando */}
                    {question.command && (
                      <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 space-y-2 border border-blue-200 dark:border-blue-800">
                        <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">Comando:</h4>
                        <p className="text-sm whitespace-pre-wrap text-blue-800 dark:text-blue-200">
                          {question.command}
                        </p>
                      </div>
                    )}

                    {/* Resposta do Usuário e Gabarito */}
                    {question.type === 'multiple-choice' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                          <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100 mb-2">Sua Resposta:</h4>
                          <p className="text-sm">
                            {selectedAlt 
                              ? `${selectedAlt.letter}) ${selectedAlt.text}`
                              : 'Não respondida'
                            }
                          </p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border border-green-200 dark:border-green-800">
                          <h4 className="font-semibold text-sm text-green-900 dark:text-green-100 mb-2">Resposta Correta:</h4>
                          <p className="text-sm">
                            {correctAlt 
                              ? `${correctAlt.letter}) ${correctAlt.text}`
                              : 'N/A'
                            }
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Feedback Comentado */}
                    {question.type === 'multiple-choice' && (question as any).commentedFeedback?.explanations && (
                      <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 space-y-3 border border-blue-200 dark:border-blue-800">
                        <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">Análise das Alternativas:</h4>
                        <div className="space-y-2">
                          {Object.entries((question as any).commentedFeedback.explanations).map(([letter, explanation]) => (
                            <div 
                              key={letter}
                              className={`p-3 rounded border-l-4 ${
                                letter === (question as any).commentedFeedback?.correctAlternative
                                  ? 'border-l-green-500 bg-green-50 dark:bg-green-950'
                                  : 'border-l-red-500 bg-red-50 dark:bg-red-950'
                              }`}
                            >
                              <p className={`text-sm font-semibold ${
                                letter === (question as any).commentedFeedback?.correctAlternative
                                  ? 'text-green-700 dark:text-green-300'
                                  : 'text-red-700 dark:text-red-300'
                              }`}>
                                {letter}) {letter === (question as any).commentedFeedback?.correctAlternative ? '✓ Correta' : '✗ Incorreta'}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {explanation as string}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Explicação Geral */}
                    {question.explanation && (
                      <div className="bg-muted rounded-lg p-4 space-y-2">
                        <h4 className="font-semibold text-sm">Explicação Geral:</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {question.explanation}
                        </p>
                      </div>
                    )}

                    {/* Navegação */}
                    <div className="flex gap-3 pt-6 border-t">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentFeedbackIndex(Math.max(0, currentFeedbackIndex - 1))}
                        disabled={currentFeedbackIndex === 0}
                        className="flex-1"
                      >
                        ← Anterior
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentFeedbackIndex(Math.min(exam.questions.length - 1, currentFeedbackIndex + 1))}
                        disabled={currentFeedbackIndex === exam.questions.length - 1}
                        className="flex-1"
                      >
                        Próxima →
                      </Button>
                    </div>
                  </>
                )
              })()}
            </CardContent>
          </Card>
        </div>
      )}
      </>
    )
  }

  if (!started && !inWaitingRoom) {
    return (
      <>
        {proctoringModal}
        <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="text-3xl">{exam.title}</CardTitle>
            {exam.description && (
              <CardDescription className="text-base">{exam.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {exam.coverImage && (
              <img
                src={exam.coverImage}
                alt={exam.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            )}

            <div className="space-y-2 text-sm">
              <p>
                <strong>Número de questões:</strong> {exam.numberOfQuestions}
              </p>
              <p>
                <strong>Pontuação:</strong>{' '}
                {exam.scoringMethod === 'tri' ? 'TRI (1000 pontos)' : `${exam.totalPoints} pontos`}
              </p>
              <p>
                <strong>Início:</strong> {formatDate(exam.startTime)}
              </p>
              <p>
                <strong>Término:</strong> {formatDate(exam.endTime)}
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="userName">Nome Completo *</Label>
                  {exam.allowCustomName && loggedUserName && !userName && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setUserName(loggedUserName)}
                      className="h-auto py-1"
                    >
                      <User className="h-3 w-3 mr-1" />
                      Usar meu nome
                    </Button>
                  )}
                </div>
                <Input
                  id="userName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder={exam.allowCustomName ? "Digite seu nome completo" : "Usando nome do usuário"}
                  disabled={!exam.allowCustomName}
                  className={!exam.allowCustomName ? "bg-muted" : ""}
                />
                {!exam.allowCustomName && (
                  <p className="text-xs text-muted-foreground">
                    O nome será preenchido automaticamente com seu nome de usuário
                  </p>
                )}
              </div>

              {exam.themePhrase && (
                <div className="space-y-2">
                  <Label htmlFor="theme">Transcreva a frase-tema abaixo *</Label>
                  <div className="p-4 bg-muted rounded-lg mb-2">
                    <p className="text-sm font-medium italic">"{exam.themePhrase}"</p>
                  </div>
                  <Textarea
                    id="theme"
                    value={themeTranscription}
                    onChange={(e) => setThemeTranscription(e.target.value)}
                    placeholder="Transcreva a frase-tema aqui..."
                    rows={3}
                    className="font-serif text-base"
                  />
                </div>
              )}
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                if (canStart) {
                  handleStartExam()
                } else {
                  setInWaitingRoom(true)
                }
              }}
              disabled={!userName.trim() || (exam.themePhrase ? !themeTranscription.trim() : false)}
            >
              {canStart ? 'Iniciar Prova' : 'Entrar na Sala'}
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
      </>
    )
  }

  // Sala de espera
  if (!started && inWaitingRoom) {
    return (
      <>
        {proctoringModal}
        <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
          <Card className="max-w-3xl w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl mb-2">{exam.title}</CardTitle>
            <CardDescription className="text-lg">
              Sala de Espera
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center py-4">
              <Clock className="h-16 w-16 text-primary animate-pulse" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Bem-vindo(a), {userName}!</h3>
              <p className="text-muted-foreground">
                Você está na sala de espera. A prova iniciará em:
              </p>
            </div>

            <div className="py-6">
              <Countdown
                targetDate={new Date(exam.startTime)}
                onComplete={() => {
                  setCanStart(true)
                  setTimeout(() => {
                    setShowToast(true)
                  }, 100)
                }}
              />
            </div>

            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Horário de início:</span>
                <span className="font-semibold">{formatDate(exam.startTime)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Horário de término:</span>
                <span className="font-semibold">{formatDate(exam.endTime)}</span>
              </div>
            </div>

            {/* Campo de Assinatura - Opcional se requireSignature for false */}
            {exam.requireSignature !== false && (
              <SignaturePad
                onSignatureChange={setSignature}
                label={`Assinatura Digital ${exam.requireSignature ? '*' : '(opcional)'}`}
              />
            )}

            {/* PDF só aparece quando a prova começar */}
            {exam.pdfUrl && canStart && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(exam.pdfUrl, '_blank')}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Baixar PDF da Prova
              </Button>
            )}

            <div className="flex gap-2">
              <Button
                className="flex-1"
                size="lg"
                onClick={handleStartExam}
                disabled={!canStart || (exam.requireSignature && !signature)}
              >
                {(exam.requireSignature && !signature) ? 'Assine antes de iniciar' : canStart ? 'Iniciar Prova Agora' : 'Aguardando Início...'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setInWaitingRoom(false)
                  router.push('/')
                }}
              >
                Sair
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Toast de notificação quando a prova começar */}
        {showToast && (
          <Toast
            message="Você já pode iniciar a prova clicando no botão abaixo."
            onClose={() => setShowToast(false)}
          />
        )}
      </div>
      </>
    )
  }

  const currentQuestion = exam.questions[currentQuestionIndex]
  const currentAnswer = answers.find(a => a.questionId === currentQuestion.id)
  const isScrollMode = exam.navigationMode === 'scroll'

  // Verificar se alguma questão tem tempo definido
  const hasTimedQuestions = exam.questions.some(q => q.timePerQuestionSeconds && q.timePerQuestionSeconds > 0)
  // Em provas com tempo, não permitir voltar para questões anteriores
  const canGoBack = !hasTimedQuestions || currentQuestionIndex === 0

  return (
    <>
      {proctoringModal}
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        {/* Verificador de Banimento */}
        <BanChecker />

      {/* Monitor de Câmera (durante a prova) */}
      {started && proctoringAccepted && needsCamera && cameraStream && (
        <ProctoringMonitor
          cameraStream={cameraStream}
          isBlackCamera={isBlackCamera}
          blackCameraTimeRemaining={blackCameraTimer || undefined}
        />
      )}

      {/* Canvas invisível para detecção de câmera preta */}
      {started && proctoringAccepted && needsCamera && (
        <>
          <video ref={videoRef} style={{ display: 'none' }} autoPlay playsInline muted />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </>
      )}

      {/* Modal - Prova já realizada (não exibir para provas práticas) */}
      {alreadySubmitted && !exam?.isPracticeExam && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="max-w-md w-full shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <CardTitle className="text-2xl">Prova Já Realizada!</CardTitle>
                <CardDescription className="mt-2">
                  Você já realizou esta prova. Não é possível refazê-la.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-center text-muted-foreground">
                  {exam && (new Date() > new Date(exam.endTime) || exam.isPracticeExam)
                    ? exam.isPracticeExam
                      ? 'Você pode visualizar seu relatório ou baixar o gabarito da prova (prova prática - gabarito sempre disponível)'
                      : 'Você pode visualizar seu relatório ou baixar o gabarito da prova'
                    : 'Você pode visualizar seu relatório. O gabarito será liberado após o término da prova.'}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => router.push(`/exam/${id}/user/${userId}`)}
                  className="w-full"
                  size="lg"
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Ver Meu Relatório
                </Button>
                {exam && (new Date() > new Date(exam.endTime) || exam.isPracticeExam) ? (
                  <Button
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/exams/${id}`)
                        if (!res.ok) throw new Error('Erro ao buscar prova')
                        const data = await res.json()
                        const { generateGabaritoPDF, downloadPDF } = await import('@/lib/pdf-generator')
                        const blob = generateGabaritoPDF(data.exam)
                        downloadPDF(blob, `Gabarito-${data.exam.title}.pdf`)
                      } catch (error: any) {
                        showToastMessage('Erro ao gerar gabarito: ' + error.message)
                      }
                    }}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Baixar Gabarito (PDF)
                  </Button>
                ) : (
                  <div className="w-full p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
                    <p className="text-sm text-center text-orange-800 dark:text-orange-200">
                      <Clock className="h-4 w-4 inline mr-2" />
                      Prova ainda em andamento. O gabarito será liberado após o término.
                    </p>
                  </div>
                )}
                <Button
                  onClick={() => router.push('/')}
                  variant="ghost"
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para Início
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Popup de Aviso - Tempo por Questão (3 segundos) */}
      {showTimeWarningPopup && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="max-w-lg w-full shadow-2xl border-2 border-orange-500">
            <CardHeader className="text-center space-y-4 pb-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center animate-pulse">
                <Clock className="h-10 w-10 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">⏱️ Atenção: Tempo por Questão!</CardTitle>
                <CardDescription className="mt-3 text-base">
                  Esta prova possui questões com tempo limite individual
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-center text-orange-900 dark:text-orange-100 font-medium">
                  ⚠️ Algumas questões devem ser respondidas dentro de um tempo limite específico.
                  Quando o tempo de uma questão acabar, ela será automaticamente enviada com a resposta atual
                  e você passará para a próxima questão.
                </p>
              </div>
              <div className="text-center">
                <p className="text-6xl font-bold text-orange-600 dark:text-orange-400 animate-pulse">
                  {timeWarningCountdown}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  A prova iniciará em {timeWarningCountdown} segundo{timeWarningCountdown !== 1 ? 's' : ''}...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3 md:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink">
              <Logo variant="icon" size="sm" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold truncate">{exam.title}</h1>
                  {(exam as any).isPersonalExam && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-2 py-1 rounded whitespace-nowrap">
                      Prova Pessoal
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {isScrollMode ? (
                    `${exam.questions.length} questões`
                  ) : (
                    `Questão ${currentQuestionIndex + 1} de ${exam.questions.length}`
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
              {/* Timer da Questão Atual */}
              {questionTimeRemaining !== null && questionTimerActive && (
                <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1 sm:py-2 rounded-lg font-semibold ${
                  questionTimeRemaining <= 30
                    ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 animate-pulse'
                    : questionTimeRemaining <= 60
                    ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                    : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                }`}>
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">
                    {Math.floor(questionTimeRemaining / 3600) > 0 && `${Math.floor(questionTimeRemaining / 3600)}:`}
                    {String(Math.floor((questionTimeRemaining % 3600) / 60)).padStart(2, '0')}:
                    {String(questionTimeRemaining % 60).padStart(2, '0')}
                  </span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUnansweredModal(true)}
                className="hidden md:flex h-8"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Não respondidas ({getUnansweredQuestions().length})
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowUnansweredModal(true)}
                title="Não respondidas"
                className="md:hidden h-8 w-8"
              >
                <AlertCircle className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadExamPDF}
                className="hidden lg:flex h-8"
              >
                <FileDown className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownloadExamPDF}
                title="Baixar PDF"
                className="lg:hidden h-8 w-8"
              >
                <FileDown className="h-4 w-4" />
              </Button>
              <div className="hidden sm:block">
                <ExamTimer
                  endTime={exam.endTime}
                  onTimeUp={() => {
                    showToastMessage('O tempo da prova acabou!', 'info')
                    setTimeout(() => router.push('/'), 2000)
                  }}
                />
              </div>
              <ThemeToggle />
            </div>
          </div>
          {/* Exam Timer em linha separada no mobile */}
          <div className="sm:hidden mt-2 flex justify-center">
            <ExamTimer
              endTime={exam.endTime}
              onTimeUp={() => {
                showToastMessage('O tempo da prova acabou!', 'info')
                setTimeout(() => router.push('/'), 2000)
              }}
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Modo Scroll - Todas as questões visíveis */}
        {isScrollMode ? (
          <div className="space-y-6">
            {exam.questions.map((question, index) => {
              const answer = answers.find(a => a.questionId === question.id)

              return (
                <Card key={question.id} id={`question-${question.id}`}>
                  <CardHeader>
                    <CardTitle>Questão {question.number}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Enunciado */}
                    <div className="space-y-2">
                      <div className="prose dark:prose-invert max-w-none">
                        <HighlightableText
                          text={question.statement}
                          highlights={answer?.highlights || []}
                          target="statement"
                          onHighlightsChange={(highlights) => handleHighlights(question.id, highlights)}
                          className="whitespace-pre-wrap"
                        />
                      </div>
                      {question.statementSource && (
                        <p className="text-xs text-muted-foreground italic">
                          Fonte: {question.statementSource}
                        </p>
                      )}
                    </div>

                    {/* Imagem */}
                    {question.imageUrl && (
                      <div className="space-y-2">
                        <img
                          src={question.imageUrl}
                          alt="Imagem da questão"
                          className="max-w-full h-auto rounded-lg border"
                        />
                        {question.imageSource && (
                          <p className="text-xs text-muted-foreground italic">
                            Fonte da imagem: {question.imageSource}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Comando */}
                    <div className="bg-muted p-4 rounded-lg">
                      <HighlightableText
                        text={question.command}
                        highlights={answer?.highlights || []}
                        target="command"
                        onHighlightsChange={(highlights) => handleHighlights(question.id, highlights)}
                        className="font-medium"
                      />
                    </div>

                    {/* Botão de Anotações */}
                    <div className="flex justify-start">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingNotesFor(question.id)}
                        className="bg-primary/10 hover:bg-primary/20 backdrop-blur-sm text-primary border border-primary/20"
                      >
                        <StickyNote className="h-4 w-4 mr-2" />
                        {getAnnotationForQuestion(question.id) ? 'Editar Anotações' : 'Adicionar Anotações'}
                      </Button>
                    </div>

                    {/* Alternativas (Múltipla Escolha) */}
                    {question.type === 'multiple-choice' && (
                      <div className="space-y-3">
                        {question.alternatives.map((alt) => {
                          const isSelected = answer?.selectedAlternative === alt.id
                          const isCrossed = answer?.crossedAlternatives?.includes(alt.id) || false

                          return (
                            <div
                              key={alt.id}
                              onClick={() => handleSelectAlternative(question.id, alt.id)}
                              className={`border rounded-lg p-4 transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-primary bg-primary/10'
                                  : isCrossed
                                  ? 'border-destructive bg-destructive/5 opacity-50'
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <input
                                  type="radio"
                                  name={`question-${question.id}`}
                                  checked={isSelected}
                                  onChange={() => handleSelectAlternative(question.id, alt.id)}
                                  className="mt-1 h-4 w-4 pointer-events-none"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className={`font-bold ${isCrossed ? 'line-through' : ''}`}>
                                      {alt.letter})
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleToggleCross(question.id, alt.id)
                                      }}
                                    >
                                      {isCrossed ? (
                                        <Check className="h-4 w-4 text-destructive" />
                                      ) : (
                                        <X className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                  <p className={`mt-1 ${isCrossed ? 'line-through' : ''}`}>
                                    {alt.text}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Resposta Discursiva */}
                    {question.type === 'discursive' && (
                      <div className="space-y-3">
                        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <p className="text-sm text-blue-900 dark:text-blue-100">
                            <strong>Questão Discursiva:</strong> Escreva sua resposta completa no campo abaixo.
                            {question.maxScore && (
                              <span className="ml-2">Pontuação máxima: {question.maxScore} pontos</span>
                            )}
                          </p>
                        </div>
                        <Textarea
                          value={answer?.discursiveText || ''}
                          onChange={(e) => handleDiscursiveText(question.id, e.target.value)}
                          placeholder="Digite sua resposta aqui..."
                          rows={12}
                          className="font-serif text-base"
                        />
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Caracteres: {(answer?.discursiveText || '').length}</span>
                          <span>Palavras: {(answer?.discursiveText || '').split(/\s+/).filter(w => w.length > 0).length}</span>
                        </div>
                      </div>
                    )}

                    {/* Redação */}
                    {question.type === 'essay' && (
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-3">
                            ✍️ Redação {question.essayStyle === 'enem' ? 'ENEM' : 'UERJ'}
                          </h3>
                          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                            <p>
                              <strong>Pontuação máxima:</strong> {question.maxScore} pontos
                            </p>
                            <p>
                              <strong>Tema:</strong> {question.essayTheme}
                            </p>
                          </div>
                        </div>

                        {/* Textos de Apoio */}
                        {question.essaySupportTexts && question.essaySupportTexts.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-semibold text-sm">Textos Motivadores:</h4>
                            {question.essaySupportTexts.map((text, idx) => (
                              <div key={idx} className="bg-muted p-4 rounded-lg border-l-4 border-primary">
                                <p className="text-xs font-semibold text-muted-foreground mb-2">Texto {idx + 1}</p>
                                <p className="text-sm whitespace-pre-wrap">{text}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Campo de Redação */}
                        <div className="space-y-2">
                          <Label htmlFor={`essay-${question.id}`} className="text-base font-semibold">
                            Sua Redação:
                          </Label>
                          <div className="bg-white dark:bg-slate-900 border-2 border-primary rounded-lg p-1">
                            <Textarea
                              id={`essay-${question.id}`}
                              value={answer?.essayText || ''}
                              onChange={(e) => handleEssayText(question.id, e.target.value)}
                              placeholder="Escreva sua redação aqui seguindo as orientações do tema proposto..."
                              rows={25}
                              className="font-serif text-base leading-relaxed resize-none border-0 focus-visible:ring-0"
                            />
                          </div>
                          <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                            <div className="flex gap-6">
                              <span>📝 Linhas: {(answer?.essayText || '').split('\n').length}</span>
                              <span>📊 Palavras: {(answer?.essayText || '').split(/\s+/).filter(w => w.length > 0).length}</span>
                              <span>🔤 Caracteres: {(answer?.essayText || '').length}</span>
                            </div>
                          </div>
                        </div>

                        {/* Dica */}
                        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                          <p className="text-xs text-amber-900 dark:text-amber-100">
                            💡 <strong>Dica:</strong> {question.essayStyle === 'enem'
                              ? 'A redação ENEM deve ser um texto dissertativo-argumentativo, com introdução, desenvolvimento e conclusão. Não esqueça da proposta de intervenção!'
                              : 'A redação UERJ permite uso de primeira pessoa, mas exige densidade argumentativa e autoria clara. Desenvolva bem cada parágrafo!'}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}

            {/* Barra de progresso e botão de finalizar fixos no modo scroll */}
            <Card className="sticky bottom-4 shadow-lg">
              <CardContent className="py-4">
                <div className="space-y-4">
                  {/* Progresso */}
                  <div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                      <span>Progresso</span>
                      <span>
                        {answers.filter((a, index) => {
                          const question = exam.questions[index]
                          if (question.type === 'multiple-choice') {
                            return !!a.selectedAlternative
                          } else if (question.type === 'discursive') {
                            return !!a.discursiveText && a.discursiveText.trim().length > 0
                          } else if (question.type === 'essay') {
                            return !!a.essayText && a.essayText.trim().length > 0
                          }
                          return false
                        }).length}/{exam.questions.length} respondidas
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{
                          width: `${(answers.filter((a, index) => {
                            const question = exam.questions[index]
                            if (question.type === 'multiple-choice') {
                              return !!a.selectedAlternative
                            } else if (question.type === 'discursive') {
                              return !!a.discursiveText && a.discursiveText.trim().length > 0
                            } else if (question.type === 'essay') {
                              return !!a.essayText && a.essayText.trim().length > 0
                            }
                            return false
                          }).length / exam.questions.length) * 100}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Botão Finalizar */}
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full"
                    size="lg"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submitting ? 'Enviando...' : 'Finalizar Prova'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Modo Paginado - Uma questão por vez */
          <Card>
          <CardHeader>
            <CardTitle>Questão {currentQuestion.number}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Barcode do Usuário */}
            <div className="border-b pb-4">
              <Barcode
                value={`${id}-${userName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}`}
                height={50}
                fontSize={12}
              />
              <p className="text-xs text-center text-muted-foreground mt-2">
                Código Individual: Prova {id.substring(0, 8)} - {userName}
              </p>
            </div>

            {/* Enunciado */}
            <div className="space-y-2">
              <div className="max-w-none">
                <HighlightableText
                  text={currentQuestion.statement}
                  highlights={currentAnswer?.highlights || []}
                  target="statement"
                  onHighlightsChange={(highlights) => handleHighlights(currentQuestion.id, highlights)}
                  className="whitespace-pre-wrap text-base"
                />
              </div>
              {currentQuestion.statementSource && (
                <p className="text-xs text-muted-foreground italic">
                  Fonte: {currentQuestion.statementSource}
                </p>
              )}
            </div>

            {/* Imagem */}
            {currentQuestion.imageUrl && (
              <div className="space-y-2">
                <img
                  src={currentQuestion.imageUrl}
                  alt="Imagem da questão"
                  className="max-w-full h-auto rounded-lg border"
                />
                {currentQuestion.imageSource && (
                  <p className="text-xs text-muted-foreground italic">
                    Fonte da imagem: {currentQuestion.imageSource}
                  </p>
                )}
              </div>
            )}

            {/* Comando */}
            <div className="bg-muted p-4 rounded-lg">
              <HighlightableText
                text={currentQuestion.command}
                highlights={currentAnswer?.highlights || []}
                target="command"
                onHighlightsChange={(highlights) => handleHighlights(currentQuestion.id, highlights)}
                className="font-medium"
              />
            </div>

            {/* Botão de Anotações */}
            <div className="flex justify-start">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingNotesFor(currentQuestion.id)}
                className="bg-primary/10 hover:bg-primary/20 backdrop-blur-sm text-primary border border-primary/20"
              >
                <StickyNote className="h-4 w-4 mr-2" />
                {getAnnotationForQuestion(currentQuestion.id) ? 'Editar Anotações' : 'Adicionar Anotações'}
              </Button>
            </div>

            {/* Indicador de Questão Bloqueada */}
            {exam?.feedbackMode === 'immediate' && lockedQuestions.has(currentQuestion.id) && (
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Questão bloqueada:</strong> Você já respondeu esta questão e não pode alterá-la.
                </p>
              </div>
            )}

            {/* Alternativas (Múltipla Escolha) */}
            {currentQuestion.type === 'multiple-choice' && (
              <div className="space-y-3">
                {currentQuestion.alternatives.map((alt) => {
                  const isSelected = currentAnswer?.selectedAlternative === alt.id
                  const isCrossed = currentAnswer?.crossedAlternatives?.includes(alt.id) || false
                  const isCorrect = alt.isCorrect
                  const isLocked = exam?.feedbackMode === 'immediate' && lockedQuestions.has(currentQuestion.id)

                  return (
                    <div
                      key={alt.id}
                      onClick={() => handleSelectAlternative(currentQuestion.id, alt.id)}
                      className={`border rounded-lg p-4 transition-all ${
                        isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                      } ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : isCrossed
                          ? 'border-destructive bg-destructive/5 opacity-50'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          checked={isSelected}
                          onChange={() => handleSelectAlternative(currentQuestion.id, alt.id)}
                          className="mt-1 h-4 w-4 pointer-events-none"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`font-bold ${isCrossed ? 'line-through' : ''}`}>
                              {alt.letter})
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleCross(currentQuestion.id, alt.id)
                              }}
                            >
                              {isCrossed ? (
                                <Check className="h-4 w-4 text-destructive" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <p className={`mt-1 ${isCrossed ? 'line-through' : ''}`}>
                            {alt.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Resposta Discursiva */}
            {currentQuestion.type === 'discursive' && (
              <div className="space-y-3">
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Questão Discursiva:</strong> Escreva sua resposta completa no campo abaixo.
                    {currentQuestion.maxScore && (
                      <span className="ml-2">Pontuação máxima: {currentQuestion.maxScore} pontos</span>
                    )}
                  </p>
                </div>
                <Textarea
                  value={currentAnswer?.discursiveText || ''}
                  onChange={(e) => handleDiscursiveText(currentQuestion.id, e.target.value)}
                  placeholder="Digite sua resposta aqui..."
                  rows={12}
                  className="font-serif text-base"
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Caracteres: {(currentAnswer?.discursiveText || '').length}</span>
                  <span>Palavras: {(currentAnswer?.discursiveText || '').split(/\s+/).filter(w => w.length > 0).length}</span>
                </div>
              </div>
            )}

            {/* Redação */}
            {currentQuestion.type === 'essay' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-3">
                    ✍️ Redação {currentQuestion.essayStyle === 'enem' ? 'ENEM' : 'UERJ'}
                  </h3>
                  <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    <p>
                      <strong>Pontuação máxima:</strong> {currentQuestion.maxScore} pontos
                    </p>
                    <p>
                      <strong>Tema:</strong> {currentQuestion.essayTheme}
                    </p>
                  </div>
                </div>

                {/* Textos de Apoio */}
                {currentQuestion.essaySupportTexts && currentQuestion.essaySupportTexts.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Textos Motivadores:</h4>
                    {currentQuestion.essaySupportTexts.map((text, idx) => (
                      <div key={idx} className="bg-muted p-4 rounded-lg border-l-4 border-primary">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Texto {idx + 1}</p>
                        <p className="text-sm whitespace-pre-wrap">{text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Campo de Redação */}
                <div className="space-y-2">
                  <Label htmlFor={`essay-${currentQuestion.id}`} className="text-base font-semibold">
                    Sua Redação:
                  </Label>
                  <div className="bg-white dark:bg-slate-900 border-2 border-primary rounded-lg p-1">
                    <Textarea
                      id={`essay-${currentQuestion.id}`}
                      value={currentAnswer?.essayText || ''}
                      onChange={(e) => handleEssayText(currentQuestion.id, e.target.value)}
                      placeholder="Escreva sua redação aqui seguindo as orientações do tema proposto..."
                      rows={25}
                      className="font-serif text-base leading-relaxed resize-none border-0 focus-visible:ring-0"
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    <div className="flex gap-6">
                      <span>📝 Linhas: {(currentAnswer?.essayText || '').split('\n').length}</span>
                      <span>📊 Palavras: {(currentAnswer?.essayText || '').split(/\s+/).filter(w => w.length > 0).length}</span>
                      <span>🔤 Caracteres: {(currentAnswer?.essayText || '').length}</span>
                    </div>
                  </div>
                </div>

                {/* Dica */}
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <p className="text-xs text-amber-900 dark:text-amber-100">
                    💡 <strong>Dica:</strong> {currentQuestion.essayStyle === 'enem'
                      ? 'A redação ENEM deve ser um texto dissertativo-argumentativo, com introdução, desenvolvimento e conclusão. Não esqueça da proposta de intervenção!'
                      : 'A redação UERJ permite uso de primeira pessoa, mas exige densidade argumentativa e autoria clara. Desenvolva bem cada parágrafo!'}
                  </p>
                </div>
              </div>
            )}

            {/* Navegação */}
            <div className="flex justify-between pt-6 border-t gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={!canGoBack || (exam?.feedbackMode === 'immediate' && lockedQuestions.has(currentQuestion.id))}
                title={hasTimedQuestions && currentQuestionIndex > 0 ? "Não é possível voltar em provas com tempo por questão" : ""}
              >
                Anterior
              </Button>

              {/* Botão "Check & Continue" para feedback imediato */}
              {exam?.feedbackMode === 'immediate' && (exam as any).isPersonalExam && showCheckButton && (
                <Button
                  onClick={handleCheckAnswer}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Verificar e Continuar
                </Button>
              )}

              {currentQuestionIndex === exam.questions.length - 1 ? (
                <Button onClick={handleSubmit} disabled={submitting}>
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? 'Enviando...' : 'Finalizar Prova'}
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                  disabled={exam?.feedbackMode === 'immediate' && !lockedQuestions.has(currentQuestion.id)}
                >
                  Próxima
                </Button>
              )}
            </div>

            {/* Indicador de progresso */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Progresso</span>
                <span>
                  {answers.filter((a, index) => {
                    const question = exam.questions[index]
                    if (question.type === 'multiple-choice') {
                      return !!a.selectedAlternative
                    } else if (question.type === 'discursive') {
                      return !!a.discursiveText && a.discursiveText.trim().length > 0
                    } else if (question.type === 'essay') {
                      return !!a.essayText && a.essayText.trim().length > 0
                    }
                    return false
                  }).length}/{exam.questions.length}{' '}
                  respondidas
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${(answers.filter((a, index) => {
                      const question = exam.questions[index]
                      if (question.type === 'multiple-choice') {
                        return !!a.selectedAlternative
                      } else if (question.type === 'discursive') {
                        return !!a.discursiveText && a.discursiveText.trim().length > 0
                      } else if (question.type === 'essay') {
                        return !!a.essayText && a.essayText.trim().length > 0
                      }
                      return false
                    }).length / exam.questions.length) * 100}%`
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        )}
      </main>

      <ToastAlert
        open={toastOpen}
        onOpenChange={setToastOpen}
        message={toastMessage}
        type={toastType}
      />

      {/* Modal de Questões Não Respondidas */}
      {showUnansweredModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5" />
                  Questões Não Respondidas
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUnansweredModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                {getUnansweredQuestions().length === 0
                  ? 'Você respondeu todas as questões!'
                  : `Você ainda tem ${getUnansweredQuestions().length} questão(ões) não respondida(s).`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getUnansweredQuestions().length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    Todas as questões foram respondidas!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {getUnansweredQuestions().map(({ question, index }) => (
                    <div
                      key={question.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-semibold">Questão {question.number}</p>
                        <p className="text-sm text-muted-foreground">
                          {question.type === 'multiple-choice' && 'Múltipla Escolha'}
                          {question.type === 'discursive' && 'Discursiva'}
                          {question.type === 'essay' && 'Redação'}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (isScrollMode) {
                            // Em modo scroll, rolar até a questão
                            const element = document.getElementById(`question-${question.id}`)
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                              setShowUnansweredModal(false)
                            }
                          } else {
                            // Em modo navegação, ir para a questão
                            setCurrentQuestionIndex(index)
                            setShowUnansweredModal(false)
                          }
                        }}
                      >
                        Ir para questão
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Feedback para Provas Pessoais */}
      {showFeedbackModal && feedbackData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center mb-4">
                {feedbackData.isCorrect ? (
                  <div className="bg-green-100 dark:bg-green-900 rounded-full p-4">
                    <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                  </div>
                ) : (
                  <div className="bg-red-100 dark:bg-red-900 rounded-full p-4">
                    <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                  </div>
                )}
              </div>
              <div>
                <CardTitle className={`text-2xl ${feedbackData.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {feedbackData.isCorrect ? 'Resposta Correta!' : 'Resposta Incorreta'}
                </CardTitle>
                <CardDescription className="mt-2">
                  {feedbackData.isCorrect 
                    ? 'Você selecionou a alternativa correta.'
                    : 'Você selecionou a alternativa incorreta. Tente novamente.'}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enunciado */}
              {feedbackData.statement && (
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-sm">Enunciado da Questão:</h4>
                  <p className="text-sm whitespace-pre-wrap">
                    {feedbackData.statement}
                  </p>
                </div>
              )}

              {/* Comando */}
              {feedbackData.command && (
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 space-y-2 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">Comando da Questão:</h4>
                  <p className="text-sm whitespace-pre-wrap text-blue-800 dark:text-blue-200">
                    {feedbackData.command}
                  </p>
                </div>
              )}

              {/* Feedback Comentado */}
              {feedbackData.commentedFeedback && feedbackData.commentedFeedback.explanations && (
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 space-y-3 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">Análise das Alternativas:</h4>
                  <div className="space-y-2">
                    {Object.entries(feedbackData.commentedFeedback.explanations).map(([letter, explanation]) => (
                      <div 
                        key={letter}
                        className={`p-3 rounded border-l-4 ${
                          letter === feedbackData.commentedFeedback?.correctAlternative
                            ? 'border-l-green-500 bg-green-50 dark:bg-green-950'
                            : 'border-l-red-500 bg-red-50 dark:bg-red-950'
                        }`}
                      >
                        <p className={`text-sm font-semibold ${
                          letter === feedbackData.commentedFeedback?.correctAlternative
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-red-700 dark:text-red-300'
                        }`}>
                          {letter}) {letter === feedbackData.commentedFeedback?.correctAlternative ? '✓ Correta' : '✗ Incorreta'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explicação Geral */}
              {feedbackData.explanation && (
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-sm">Explicação Geral:</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {feedbackData.explanation}
                  </p>
                </div>
              )}

              <Button
                onClick={() => {
                  setShowFeedbackModal(false)
                  setFeedbackData(null)
                  // Avançar para próxima questão
                  if (currentQuestionIndex < exam!.questions.length - 1) {
                    setCurrentQuestionIndex(currentQuestionIndex + 1)
                  }
                }}
                className="w-full"
                size="lg"
              >
                Próxima Questão
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Anotações */}
      {editingNotesFor && (() => {
        const question = exam.questions.find(q => q.id === editingNotesFor)
        if (!question) return null

        return (
          <QuestionNotesCanvas
            questionId={question.id}
            questionNumber={question.number}
            initialAnnotation={getAnnotationForQuestion(question.id)}
            onSave={handleSaveAnnotation}
            onClose={() => setEditingNotesFor(null)}
          />
        )
      })()}
    </div>
    </>
  )
}
