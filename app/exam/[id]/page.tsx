'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { LogoLoading } from '@/components/logo-loading'
import { Logo } from '@/components/logo'
import { Countdown } from '@/components/countdown'
import { Toast } from '@/components/toast'
import { ToastAlert } from '@/components/ui/toast-alert'
import { BanChecker } from '@/components/ban-checker'
import { SignaturePad } from '@/components/signature-pad'
import { ExamBrandFooter, ExamBrandHeader } from '@/components/exam/exam-brand-header'
import { ExamTimer } from '@/components/exam-timer'
import { ExamBrandBadge } from '@/components/exam-brand-badge'
import { Barcode } from '@/components/barcode'
import { Exam, UserAnswer, TextHighlight, QuestionAnnotation } from '@/lib/types'
import { HighlightableText } from '@/components/highlightable-text'
import { formatDate } from '@/lib/utils'
import { downloadUserReportPDF } from '@/lib/user-report-generator'
import { ProctoringConsent } from '@/components/proctoring-consent'
import { ProctoringMonitor } from '@/components/proctoring-monitor'
import { InlineAnnotationCanvas, useAnnotationModeActive } from '@/components/inline-annotation-canvas'
import { ReportQuestionModal } from '@/components/report-question-modal'
import { PracticeExamConfig, PracticeExamSettings } from '@/components/practice-exam-config'
import { ExamQuestionPalette, PaletteQuestion } from '@/components/exam-question-palette'
import { useProctoring } from '@/hooks/use-proctoring'
import { useWebSocket } from '@/hooks/use-websocket'
import { useVisibilityDetection } from '@/hooks/use-visibility-detection'
import { useWebRTC } from '@/hooks/use-webrtc'
import { ArrowLeft, Check, X, Send, FileDown, Clock, User, CheckCircle2, AlertCircle, List, StickyNote, Copy, ClipboardCheck, Flag, ChevronRight, ChevronLeft, Bot, Maximize2, BookOpen, LogOut, Play, BarChart3, Trophy } from 'lucide-react'
import { ImageModal } from '@/components/image-modal'
import { PremiumPdfCtaModal } from '@/components/premium-pdf-cta-modal'
import { PdfCtaBanner } from '@/components/pdf-cta-banner'
import { ExamGateStatus } from '@/components/exam/exam-gate-status'
import { ExamResumeCard } from '@/components/exam/exam-resume-card'
import { canDownloadExamPdf } from '@/lib/tier-limits'
import { consumirCotaDoPlano } from '@/lib/plan-consume-client'
import { useScrollToTopWhen } from '@/components/scroll-to-top'
import { createExamAttemptTracker, clearExamAttempt, type ExamAttemptTracker } from '@/lib/tracking/track-client'
import {
  ROTULO_DA_FASE,
  prazoDeEntrega,
  resolverJanelaDaProva,
  type JanelaDaProva,
} from '@/lib/provas/janela-da-prova'
import { resolverDownloadsDaProva } from '@/lib/provas/downloads-da-prova'
import { travasDaProva } from '@/lib/provas/anti-cola'
import { EscudoAntiCola } from '@/components/exam/escudo-anti-cola'
import {
  INTERVALO_DE_GRAVACAO_MS,
  contarRespondidas,
  mesclarRespostas,
  type VereditoDeRetomada,
} from '@/lib/provas/retomada'

export default function ExamPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const [exam, setExam] = useState<Exam | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [started, setStarted] = useState(false)
  const [inWaitingRoom, setInWaitingRoom] = useState(false)
  const [canStart, setCanStart] = useState(false)
  /**
   * A janela da prova como o SERVIDOR a enxerga.
   *
   * Vem de `GET /api/exams/[id]` e é recalculada localmente a cada segundo a
   * partir do documento da prova — o relógio do navegador serve para animar a
   * contagem regressiva, nunca para decidir. Quem decide é o servidor, na
   * entrega; aqui a janela só determina o que a tela desenha.
   */
  const [janela, setJanela] = useState<JanelaDaProva | null>(null)
  /**
   * Esta pessoa já passou pelo portão.
   *
   * Vem do servidor (`GET /api/exams/[id]`) e é o que mantém o botão
   * "Iniciar" destravado depois que o portão fecha: o portão limita a
   * CHEGADA, não o começo. Ver `lib/provas/entrada-na-prova.ts`.
   */
  const [jaEntrou, setJaEntrou] = useState(false)
  /** Progresso salvo de uma tentativa interrompida, e se dá para continuar. */
  const [retomada, setRetomada] = useState<VereditoDeRetomada | null>(null)
  const [progressoSalvo, setProgressoSalvo] = useState<any>(null)
  const [retomando, setRetomando] = useState(false)
  const [salvandoProgresso, setSalvandoProgresso] = useState<'salvando' | 'salvo' | 'erro' | null>(null)
  const [ordemDasQuestoes, setOrdemDasQuestoes] = useState<string[]>([])
  const [examImageModal, setExamImageModal] = useState<{ src: string } | null>(null)
  const [pdfGenerating, setPdfGenerating] = useState<string | null>(null)
  const [accountType, setAccountType] = useState<string | undefined>(undefined)
  const [userRole, setUserRole] = useState<string | undefined>(undefined)
  const [showPdfCta, setShowPdfCta] = useState(false)

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
  const [showExitConfirm, setShowExitConfirm] = useState(false) // Confirmação antes de abandonar a prova
  const [examStartTime, setExamStartTime] = useState<Date | null>(null)
  const [examDuration, setExamDuration] = useState<string>('')

  // Estados de Anotações
  const [annotations, setAnnotations] = useState<QuestionAnnotation[]>([])

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
    alternatives?: { id: string; letter: string; text: string; isCorrect: boolean }[]
    commentedFeedback?: {
      correctAlternative: string
      explanations: Record<string, string>
    }
  } | null>(null)
  const [lockedQuestions, setLockedQuestions] = useState<Set<string>>(new Set()) // Questões respondidas e bloqueadas
  const [showCheckButton, setShowCheckButton] = useState(false) // Mostrar botão "Check & Continue"
  const [showFinalFeedback, setShowFinalFeedback] = useState(false) // Mostrar feedback final
  const [currentFeedbackIndex, setCurrentFeedbackIndex] = useState(0) // Índice do feedback atual
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null) // ID da questão cujo prompt foi copiado
  const [revealedExplanations, setRevealedExplanations] = useState<Set<string>>(new Set()) // IDs de questões com gabarito revelado
  const [reportQuestionId, setReportQuestionId] = useState<string | null>(null) // ID da questão sendo relatada
  const [showSelfScoreModal, setShowSelfScoreModal] = useState(false) // Modal de auto-avaliação discursiva
  const [selfScoreQuestionId, setSelfScoreQuestionId] = useState<string | null>(null) // Questão sendo auto-avaliada
  const [pendingSelfScore, setPendingSelfScore] = useState<number | null>(null) // Nota pendente de confirmação
  const [showPracticeConfig, setShowPracticeConfig] = useState(false) // Tela de configuração para provas práticas
  const [practiceTimeLimitMs, setPracticeTimeLimitMs] = useState<number | null>(null) // Tempo limite para provas práticas
  const [practiceFeedbackMode, setPracticeFeedbackMode] = useState<'immediate' | 'end'>('end') // Modo de feedback para provas práticas
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null) // Questão expandida no gabarito pós-submissão
  const [streak, setStreak] = useState(0) // Sequência de acertos consecutivos (immediate feedback)
  const [streakJustIncremented, setStreakJustIncremented] = useState(false) // Trigger de animação

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

    /*
     * A assinatura, quando exigida, é condição para começar — em qualquer
     * caminho.
     *
     * O campo de assinatura só existia na SALA DE ESPERA, e a sala de espera só
     * aparece para quem chega antes de a prova começar. Quem abre a página com a
     * prova já em andamento — o caso normal, e o único caso de quem chega
     * atrasado — via na tela inicial um botão "Iniciar Prova" que chamava esta
     * função direto: a prova começava sem que a assinatura fosse pedida uma vez
     * sequer. "Exigir assinatura digital" estava marcado no painel e não exigia
     * nada de ninguém.
     *
     * A tela inicial agora desenha o campo (ver mais abaixo), e a checagem mora
     * aqui porque é por aqui que passam os dois caminhos — o da tela inicial e
     * o da sala de espera — e também a volta do termo de monitoramento.
     */
    if (exam?.requireSignature && !signature) {
      showToastMessage('Assine no campo de assinatura antes de iniciar a prova.', 'info')
      return
    }

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

  /**
   * O veredito de download desta prova, para esta conta, agora.
   *
   * Antes cada botão decidia sozinho: a tela inicial checava o cargo, os dois
   * botões da tela de resultado não checavam nada, e o gabarito tinha três
   * critérios de tempo diferentes espalhados. Uma conta gratuita ouvia "assine
   * para baixar" antes da prova e baixava dois PDFs depois dela.
   * Ver lib/provas/downloads-da-prova.ts.
   */
  const downloads = resolverDownloadsDaProva(exam, {
    accountType,
    isAdmin: userRole === 'admin',
    jaEnviou: submitted || alreadySubmitted,
  })

  // Função para baixar PDF da prova
  const handleDownloadExamPDF = async () => {
    if (!downloads.prova.permitido) {
      // A recusa por tempo não se resolve assinando — mostrar o convite do
      // plano nela seria vender o que a pessoa já tem.
      if (downloads.prova.esperandoOFim) {
        showToastMessage(downloads.prova.motivo || 'Ainda não liberado.', 'info')
        return
      }
      setShowPdfCta(true)
      return
    }
    // Teto de downloads de prova do plano, quando houver. O PDF é montado no
    // navegador, então este é o único ponto em que o consumo pode ser contado.
    const cota = await consumirCotaDoPlano('provasPdf', String(id))
    if (!cota.permitido) {
      showToastMessage(cota.mensagem || 'Limite de downloads do seu plano atingido.', 'info')
      return
    }
    try {
      if (exam?.pdfUrl) {
        window.open(exam.pdfUrl, '_blank')
      } else {
        setPdfGenerating('Prova')
        const { generateExamPDF, downloadPDF } = await import('@/lib/pdf-generator')
        const blob = await generateExamPDF(exam!, userId)
        downloadPDF(blob, `${exam!.title}.pdf`, { type: 'exam_pdf', resourceId: id as string, resourceTitle: exam!.title })
      }
    } catch (error: any) {
      showToastMessage('Erro ao baixar PDF: ' + error.message)
    } finally {
      setPdfGenerating(null)
    }
  }

  // ─── Rastreamento da tentativa (/admin/stats) ─────────────────
  // Sem isto o painel só enxerga quem ENVIA a prova. Os pings abaixo contam
  // a outra metade da história: quem abriu, quem começou, em que questão
  // parou e quem sumiu no meio.
  const attemptTrackerRef = useRef<ExamAttemptTracker | null>(null)
  // Refs espelham o estado porque o snapshot é lido de dentro de um
  // setInterval e de listeners de unload — closures que nunca reexecutam.
  const answersRef = useRef<UserAnswer[]>([])
  const currentQuestionRef = useRef(0)
  const examRef = useRef<Exam | null>(null)
  // Os mesmos espelhos servem à gravação de progresso, que roda dentro de um
  // `setInterval` e de listeners de `pagehide` — closures que nunca reexecutam.
  const ordemDasQuestoesRef = useRef<string[]>([])
  const userNameRef = useRef('')
  const themeTranscriptionRef = useRef('')
  const assinaturaRef = useRef('')
  const examStartTimeRef = useRef<Date | null>(null)

  useEffect(() => { answersRef.current = answers }, [answers])
  useEffect(() => { currentQuestionRef.current = currentQuestionIndex }, [currentQuestionIndex])
  useEffect(() => { examRef.current = exam }, [exam])
  useEffect(() => { ordemDasQuestoesRef.current = ordemDasQuestoes }, [ordemDasQuestoes])
  useEffect(() => { userNameRef.current = userName }, [userName])
  useEffect(() => { themeTranscriptionRef.current = themeTranscription }, [themeTranscription])
  useEffect(() => { assinaturaRef.current = signature }, [signature])
  useEffect(() => { examStartTimeRef.current = examStartTime }, [examStartTime])

  function attemptSnapshot() {
    const total = examRef.current?.questions?.length || 0
    const answered = answersRef.current.filter(a =>
      !!a.selectedAlternative ||
      !!a.discursiveText?.trim() ||
      !!a.essayText?.trim()
    ).length
    return {
      totalQuestions: total,
      answeredCount: answered,
      currentQuestion: currentQuestionRef.current,
    }
  }

  function getAttemptTracker(): ExamAttemptTracker | null {
    if (!attemptTrackerRef.current && id) {
      attemptTrackerRef.current = createExamAttemptTracker(id, examRef.current?.title)
    }
    return attemptTrackerRef.current
  }

  // Abertura da prova — dispara uma vez, quando o título já é conhecido.
  const examTitle = exam?.title
  useEffect(() => {
    if (!examTitle) return
    getAttemptTracker()?.send('open', attemptSnapshot())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examTitle])

  // Início efetivo + heartbeat enquanto a prova está em andamento.
  useEffect(() => {
    if (!started || submitted || alreadySubmitted) return
    const tracker = getAttemptTracker()
    if (!tracker) return
    tracker.send('start', attemptSnapshot())
    return tracker.startHeartbeat(attemptSnapshot)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, submitted, alreadySubmitted])

  /*
   * ═══ Retomada: a prova que sobrevive à queda ═══
   *
   * Nada da prova era gravado até o clique em "Entregar". O `localStorage`
   * guardava um único dado — o instante de início — e as respostas viviam só no
   * estado do React: fechar a aba sem querer, o navegador do celular recolher a
   * página ou a energia cair apagavam duas horas de prova.
   *
   * O rascunho vai para o servidor a cada `INTERVALO_DE_GRAVACAO_MS` e quando a
   * aba é escondida. Ao voltar, a pessoa recebe a oferta de continuar — uma
   * vez, contada no servidor. Ver lib/provas/retomada.ts.
   */
  const ultimaGravacaoRef = useRef(0)
  const gravandoRef = useRef(false)
  const inicioNoServidorRef = useRef<Date | null>(null)

  const montarRascunho = useCallback(() => ({
    answers: answersRef.current,
    currentQuestionIndex: currentQuestionRef.current,
    questionOrder: ordemDasQuestoesRef.current,
    userName: userNameRef.current,
    themeTranscription: themeTranscriptionRef.current,
    signature: assinaturaRef.current || undefined,
    startedAt: (examStartTimeRef.current || new Date()).toISOString(),
  }), [])

  const gravarProgresso = useCallback(
    async (forcar = false) => {
      if (!id || gravandoRef.current) return
      if (!forcar && Date.now() - ultimaGravacaoRef.current < INTERVALO_DE_GRAVACAO_MS) return

      gravandoRef.current = true
      ultimaGravacaoRef.current = Date.now()
      setSalvandoProgresso('salvando')
      try {
        const res = await fetch(`/api/exams/${id}/progress`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(montarRascunho()),
        })
        setSalvandoProgresso(res.ok ? 'salvo' : 'erro')
      } catch {
        // Queda de rede é exatamente o cenário desta funcionalidade: o
        // indicador avisa, e a próxima gravação tenta de novo sozinha.
        setSalvandoProgresso('erro')
      } finally {
        gravandoRef.current = false
      }
    },
    [id, montarRascunho],
  )

  // Prova em andamento: grava periodicamente e sempre que a aba some.
  useEffect(() => {
    if (!started || submitted || alreadySubmitted) return
    if (exam?.isPracticeExam || (exam as any)?.isPersonalExam) return

    gravarProgresso(true)
    const relogio = setInterval(() => gravarProgresso(), INTERVALO_DE_GRAVACAO_MS)

    const aoEsconder = () => {
      if (document.visibilityState === 'hidden') gravarProgresso(true)
    }
    document.addEventListener('visibilitychange', aoEsconder)
    window.addEventListener('pagehide', aoEsconder)

    return () => {
      clearInterval(relogio)
      document.removeEventListener('visibilitychange', aoEsconder)
      window.removeEventListener('pagehide', aoEsconder)
    }
  }, [started, submitted, alreadySubmitted, exam, gravarProgresso])

  /** Busca o rascunho ao abrir a prova, para oferecer "continuar". */
  const carregarRetomada = useCallback(async () => {
    try {
      const res = await fetch(`/api/exams/${id}/progress`)
      if (!res.ok) return
      const dados = await res.json()
      setRetomada(dados.veredito || null)
      setProgressoSalvo(dados.progresso || null)
    } catch {
      // Sem rascunho a prova começa do zero — que é o comportamento antigo.
    }
  }, [id])

  /** Consome a retomada e devolve a prova de onde parou. */
  async function continuarProva() {
    setRetomando(true)
    try {
      const res = await fetch(`/api/exams/${id}/progress`, { method: 'POST' })
      const dados = await res.json()
      if (!res.ok) {
        setRetomada(dados.veredito || retomada)
        showToastMessage(dados.error || 'Não foi possível retomar a prova.', 'info')
        return
      }

      const salvo = dados.progresso
      setAnswers((atuais) => mesclarRespostas(atuais, salvo.answers))
      setCurrentQuestionIndex(Math.min(salvo.currentQuestionIndex || 0, (exam?.questions.length || 1) - 1))
      if (salvo.userName) setUserName(salvo.userName)
      if (salvo.themeTranscription) setThemeTranscription(salvo.themeTranscription)
      if (salvo.signature) setSignature(salvo.signature)

      // O cronômetro continua de onde estava: o início é o da PRIMEIRA vez,
      // guardado no servidor. Retomar devolve as respostas, não o tempo.
      const inicio = salvo.startedAt ? new Date(salvo.startedAt) : new Date()
      inicioNoServidorRef.current = inicio
      setExamStartTime(inicio)
      localStorage.setItem(`exam-${id}-start-time`, inicio.toISOString())

      setRetomada(null)
      setProgressoSalvo(null)
      setInWaitingRoom(false)
      setStarted(true)
      showToastMessage('Prova retomada de onde você parou.', 'info')
    } catch (error: any) {
      showToastMessage('Erro ao retomar a prova: ' + error.message)
    } finally {
      setRetomando(false)
    }
  }

  /** Entrega o que ficou gravado, para quem já gastou a retomada. */
  async function entregarRascunho() {
    if (!progressoSalvo) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/exams/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: progressoSalvo.userName || loggedUserName || 'Aluno',
          themeTranscription: progressoSalvo.themeTranscription,
          answers: progressoSalvo.answers || [],
          // `|| signature`: quem assinou agora na tela inicial (porque a prova
          // passou a exigir assinatura depois que o rascunho começou) tem a
          // assinatura no estado, não no rascunho.
          signature: progressoSalvo.signature || signature,
          questionOrder: progressoSalvo.questionOrder,
          fromSavedProgress: true,
        }),
      })
      const dados = await res.json()
      if (!res.ok) throw new Error(dados.error)

      setAlreadySubmitted(true)
      if (dados.submissionId) setExistingSubmissionId(dados.submissionId)
      setRetomada(null)
      showToastMessage('Suas respostas salvas foram entregues.', 'info')
    } catch (error: any) {
      showToastMessage(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    checkExistingSubmission()
    loadExam()
    loadUserInfo()
    carregarRetomada()
    // Pre-warm PDF assets in background
    import('@/lib/pdf-generator').then(m => m.prewarmPDFAssets()).catch(() => {})
  }, [id])

  // Ao finalizar, a tela de resultado entra no lugar da prova sem trocar de
  // rota. Como a prova é longa e a pessoa termina lá embaixo (última questão),
  // sem isto o resultado abria no fim da página — não na nota, que é o que
  // interessa. Sobe para o topo assim que a submissão é confirmada.
  useScrollToTopWhen(submitted)

  /*
   * O relógio da tela.
   *
   * Antes esta checagem olhava só `startTime`/`endTime` — os portões nunca
   * chegaram até aqui. E quando a prova terminava com o aluno na tela inicial,
   * ela o empurrava para `/exam/[id]/results`, uma rota que devolvia 403 para
   * quem não é admin e o jogava para a home. Agora a fase vem de
   * `resolverJanelaDaProva` (a mesma função que o servidor usa para recusar a
   * entrega) e a prova encerrada mostra uma tela em vez de um redirecionamento.
   */
  useEffect(() => {
    if (!exam) return

    const recalcular = () => {
      const atual = resolverJanelaDaProva(exam, new Date(), { jaEntrou })
      setJanela(atual)
      setCanStart(atual.podeIniciar)
    }

    recalcular()
    const interval = setInterval(recalcular, 1000)
    return () => clearInterval(interval)
  }, [exam, jaEntrou])

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

      /*
       * A prova já chega embaralhada — o sorteio agora é do servidor.
       *
       * Aqui havia um Fisher-Yates com `Math.random()`, sem semente. Ele rodava
       * a cada montagem do componente: recarregar a página no meio da prova
       * devolvia outra ordem, e a "questão 12" passava a ser outra questão. Com
       * a retomada, isso deixaria de ser um incômodo e viraria perda de
       * referência — o progresso volta por `questionId`, mas a pessoa não
       * reconhece mais onde estava. Ver lib/provas/embaralhar.ts.
       */
      const examData = data.exam

      setExam(examData)
      if (data.janela) setJanela(data.janela)
      if (data.jaEntrou) setJaEntrou(true)

      /*
       * Passar pelo portão.
       *
       * Abrir esta tela com o portão aberto É entrar — e o registro disso é o
       * que sustenta o botão "Iniciar" quando o portão fecha antes de a prova
       * começar (portão 13h–13h50, prova às 14h). Falha em silêncio: quem já
       * está dentro recebe 200 sem gravar nada, e quem chegou tarde recebe 403,
       * que a tela já conta pela fase da janela.
       */
      if (!data.jaEntrou && data.janela?.podeEntrar) {
        fetch(`/api/exams/${id}/entrada`, { method: 'POST' })
          .then((res) => (res.ok ? res.json() : null))
          .then((entrada) => {
            if (entrada?.dentro) {
              setJaEntrou(true)
              if (entrada.janela) setJanela(entrada.janela)
            }
          })
          .catch(() => {})
      }
      // A ordem que ESTE aluno recebeu segue junto na entrega, para o relatório
      // numerar as questões como ele as viu.
      setOrdemDasQuestoes((examData.questions || []).map((q: any) => q.id))

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
        setAccountType(data.user.accountType)
        setUserRole(data.user.role)
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

  // Atalhos de teclado durante a prova (1-5 selecionar, ←/→ navegar)
  useEffect(() => {
    if (!started || submitted || alreadySubmitted) return
    if (!exam) return

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      // Ignorar quando usuário digita em inputs/textareas/contenteditable
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
      if (showFeedbackModal || showUnansweredModal || showExitConfirm || reportQuestionId) return

      // Modo paginado apenas (em scroll mode, atalhos atrapalhariam)
      if (exam.navigationMode === 'scroll') return

      const q = exam.questions[currentQuestionIndex]
      if (!q) return

      // 1-9 para selecionar alternativas em multiple-choice
      if (q.type === 'multiple-choice' && /^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1
        const alt = q.alternatives[idx]
        if (alt && !(exam.feedbackMode === 'immediate' && lockedQuestions.has(q.id))) {
          e.preventDefault()
          handleSelectAlternative(q.id, alt.id)
        }
        return
      }

      // Setas para navegar
      const hasTimed = exam.questions.some(qq => qq.timePerQuestionSeconds && qq.timePerQuestionSeconds > 0)
      const localCanGoBack = !hasTimed || currentQuestionIndex === 0
      if (e.key === 'ArrowRight' && currentQuestionIndex < exam.questions.length - 1) {
        if (exam.feedbackMode === 'immediate' && q.type === 'multiple-choice' && !lockedQuestions.has(q.id)) return
        e.preventDefault()
        setCurrentQuestionIndex(i => Math.min(exam.questions.length - 1, i + 1))
      } else if (e.key === 'ArrowLeft' && currentQuestionIndex > 0 && localCanGoBack) {
        e.preventDefault()
        setCurrentQuestionIndex(i => Math.max(0, i - 1))
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, submitted, alreadySubmitted, exam, currentQuestionIndex, showFeedbackModal, showUnansweredModal, showExitConfirm, reportQuestionId, lockedQuestions])

  // Esc fecha a confirmação de saída — o mesmo gesto que fecha os outros modais.
  useEffect(() => {
    if (!showExitConfirm) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowExitConfirm(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showExitConfirm])

  // Mostrar tela de configuração para provas práticas ao invés de auto-iniciar
  useEffect(() => {
    if (exam && exam.isPracticeExam && !started && !loading && !showPracticeConfig) {
      setShowPracticeConfig(true)
    }
  }, [exam, started, loading])

  function handlePracticeStart(config: PracticeExamSettings) {
    if (!exam) return

    // Aplicar configurações escolhidas pelo usuário
    exam.navigationMode = config.navigationMode
    ;(exam as any).feedbackMode = config.feedbackMode === 'immediate' ? 'immediate' : 'end'
    setPracticeFeedbackMode(config.feedbackMode)

    // Embaralhar questões se escolhido
    if (config.shuffleQuestions) {
      const shuffled = [...exam.questions]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      shuffled.forEach((q, idx) => { q.number = idx + 1 })
      exam.questions = shuffled
      // Re-inicializar respostas para ordem embaralhada
      setAnswers(shuffled.map(q => ({ questionId: q.id })))
    }

    // Aplicar limite de tempo
    if (config.timeLimitMinutes) {
      setPracticeTimeLimitMs(config.timeLimitMinutes * 60 * 1000)
    }

    setShowPracticeConfig(false)

    const startTime = new Date()
    setExamStartTime(startTime)
    localStorage.setItem(`exam-${id}-start-time`, startTime.toISOString())
    setStarted(true)

    // Verificar se tem questões com tempo individual
    const hasTimedQuestions = exam.questions.some(q => q.timePerQuestionSeconds && q.timePerQuestionSeconds > 0)
    if (hasTimedQuestions) {
      setShowTimeWarningPopup(true)
      setTimeWarningCountdown(3)
    } else {
      initializeQuestionTimer(0)
    }
  }

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
            // 'start' (e não 'center'): a questão precisa começar pelo enunciado,
            // no topo da tela — centralizar deixava o começo do texto acima da
            // área visível. O `scroll-mt-28` do card cobre o header sticky.
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
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

  // ─── Modo paginado: trocar de questão volta para o topo do enunciado ───
  // Os botões "Anterior/Próxima" ficam no rodapé do card. Sem isto, a questão
  // seguinte entra no lugar mantendo a rolagem antiga: a pessoa continua lá
  // embaixo, olhando para as últimas alternativas da nova questão, e precisa
  // subir na mão toda vez para ler o enunciado.
  const questionCardRef = useRef<HTMLDivElement>(null)
  const isPaginatedMode = !!exam && exam.navigationMode !== 'scroll'
  // Enquanto a pessoa desenha, a barra de anotação ocupa o rodapé — a barra de
  // navegação sai de cena para as duas não disputarem o mesmo espaço.
  const annotationModeActive = useAnnotationModeActive()
  useEffect(() => {
    if (!started || submitted || !isPaginatedMode) return
    if (typeof window === 'undefined') return
    // O body vira `position: fixed` quando a sidebar mobile está aberta —
    // mexer no scroll ali só bagunçaria a posição restaurada depois.
    if (document.body.style.position === 'fixed') return

    const scrollToQuestionTop = () => {
      const card = questionCardRef.current
      // O header é sticky: descontar a altura dele para o título da questão
      // não nascer escondido atrás da barra.
      const headerHeight = document.querySelector('header')?.getBoundingClientRect().height ?? 0
      const top = card
        ? Math.max(0, window.scrollY + card.getBoundingClientRect().top - headerHeight - 12)
        : 0
      const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' })
    }

    // rAF: espera o card da nova questão já estar no DOM antes de medir.
    const frame = requestAnimationFrame(scrollToQuestionTop)
    return () => cancelAnimationFrame(frame)
  }, [currentQuestionIndex, started, submitted, isPaginatedMode])

  // ─── Modo paginado: pré-carregar a imagem da próxima questão ───
  // No modo paginado só a questão atual está no DOM, então o <img> da próxima
  // só começa a baixar depois do clique em "Próxima" — a pessoa via a tela
  // travada até a imagem chegar. Buscando o arquivo em segundo plano assim que
  // a questão atual abre, ele já está no cache do navegador quando o <img>
  // trocar de src.
  useEffect(() => {
    if (!started || submitted || !isPaginatedMode) return
    if (typeof window === 'undefined') return
    const proxima = exam?.questions[currentQuestionIndex + 1]
    if (proxima?.imageUrl) {
      const preload = new window.Image()
      preload.src = proxima.imageUrl
    }
  }, [currentQuestionIndex, started, submitted, isPaginatedMode, exam])

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

    // Se for prova pessoal/prática com feedback imediato, mostrar botão "Check & Continue"
    if (exam?.feedbackMode === 'immediate' && ((exam as any).isPersonalExam || exam.isPracticeExam)) {
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
        alternatives: currentQuestion.alternatives.map(a => ({
          id: a.id,
          letter: a.letter,
          text: a.text,
          isCorrect: a.isCorrect,
        })),
        commentedFeedback: (currentQuestion as any).commentedFeedback
      })
      setShowFeedbackModal(true)
      setShowCheckButton(false)

      // Streak de acertos consecutivos
      if (selectedAlt.isCorrect) {
        setStreak(prev => prev + 1)
        setStreakJustIncremented(true)
        setTimeout(() => setStreakJustIncremented(false), 600)
      } else {
        setStreak(0)
      }

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

  function handleCopyDiscursivePrompt(question: any, answer: any) {
    const enunciado = question.statement || ''
    const comando = question.command || ''
    const respostaComentada = question.explanation || ''
    const respostaAluno = answer?.discursiveText || ''

    const prompt = `Você é um corretor de questões de Medicina. Você é humano, experiente e pedagogicamente sensato — não é um corretor mecânico nem perfeccionista. Sua filosofia de correção parte do princípio de que o objetivo é avaliar se o aluno compreende o conteúdo, não se ele decorou palavras-chave ou seguiu exatamente a estrutura do gabarito.

Ao corrigir, você considera três pilares: (1) a resposta comentada oficial, que serve como referência de conteúdo, não como template obrigatório; (2) os requisitos mínimos implícitos no enunciado, ou seja, o que a questão realmente está pedindo; e (3) a profundidade e coerência do raciocínio demonstrado pelo aluno, pois um aluno que domina mecanismos complexos — como cascatas imunológicas, fisiopatologia celular ou farmacologia de receptores — claramente domina também os conceitos mais simples que orbitam esse tema, mesmo que não os tenha escrito explicitamente.

Você aceita e valoriza amplitude e generalidade nas respostas. Se o aluno abordou aspectos que o enunciado não explicitou, mas que são clinicamente ou conceitualmente pertinentes, isso conta a favor, não contra. Você nunca penaliza o aluno por demonstrar conhecimento além do esperado, nem por usar terminologia diferente da do gabarito quando o conteúdo está correto.

Você também leva em conta o esforço e a construção da resposta. O aluno dedicou tempo para elaborar um raciocínio e para escrever tentando abordar o que ele acha que a questão quer — sua correção respeita isso.

A seguir, serão apresentados: o enunciado da questão, a resposta comentada oficial e a resposta do aluno.
Ao final, você deve atribuir uma nota de 0% a 100% em intervalos de 10%, justificando brevemente sua avaliação com foco no que o aluno acertou, no que ficou incompleto e, se for o caso, no que estava equivocado. Seja direto, humano e justo.

---

ENUNCIADO DA QUESTÃO:
${enunciado}${comando ? `\n\nCOMANDO:\n${comando}` : ''}

---

RESPOSTA COMENTADA (GABARITO):
${respostaComentada}

---

RESPOSTA DO ALUNO:
${respostaAluno}`

    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedPromptId(question.id)
      setTimeout(() => setCopiedPromptId(null), 2500)
    })
  }

  function handleOpenSelfScore(questionId: string) {
    setSelfScoreQuestionId(questionId)
    setPendingSelfScore(null)
    setShowSelfScoreModal(true)
  }

  function handleConfirmSelfScore() {
    if (selfScoreQuestionId === null || pendingSelfScore === null) return
    const updatedAnswers = answers.map(a =>
      a.questionId === selfScoreQuestionId
        ? { ...a, discursiveSelfScore: pendingSelfScore }
        : a
    )
    setAnswers(updatedAnswers)
    setLockedQuestions(prev => new Set(prev).add(selfScoreQuestionId))
    setShowSelfScoreModal(false)
    setSelfScoreQuestionId(null)
    setPendingSelfScore(null)

    // Persist self-score to server if already submitted
    if (submitted && existingSubmissionId) {
      fetch(`/api/submissions/${existingSubmissionId}/self-score`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: selfScoreQuestionId,
          selfScore: pendingSelfScore,
        }),
      }).catch(err => console.error('Erro ao salvar auto-avaliação:', err))
    }
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
          // A ordem em que ESTE aluno viu as questões: sem ela o relatório
          // numera pela ordem do banco, e a "questão 7" da reclamação não é a
          // mesma que o admin abre. Ver lib/provas/embaralhar.ts.
          questionOrder: ordemDasQuestoes,
          forcedSubmit: true,
          forcedSubmitReason: reason,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      // Limpar localStorage
      localStorage.removeItem(`exam-${id}-start-time`)

      // Fecha a tentativa no painel — sem isto ela ficaria como "saiu no meio".
      getAttemptTracker()?.send('submit', {
        ...attemptSnapshot(),
        submissionId: data.submissionId,
        score: typeof data.score === 'number' ? data.score : undefined,
      })
      // Zera o rastreador junto: numa prova de treino o aluno recomeça sem
      // trocar de página, e reaproveitar o id reabriria a tentativa entregue.
      clearExamAttempt(id)
      attemptTrackerRef.current = null

      // Salvar score
      if (exam?.scoringMethod === 'normal' && data.score !== undefined) {
        setSubmissionScore(`${data.score} pontos`)
      } else if (data.message) {
        setSubmissionScore(data.message)
      }

      // Salvar ID da submissão
      if (data.submissionId) {
        setExistingSubmissionId(data.submissionId)
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
          // A ordem em que ESTE aluno viu as questões: sem ela o relatório
          // numera pela ordem do banco, e a "questão 7" da reclamação não é a
          // mesma que o admin abre. Ver lib/provas/embaralhar.ts.
          questionOrder: ordemDasQuestoes,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      // Limpar localStorage após submissão bem-sucedida
      localStorage.removeItem(`exam-${id}-start-time`)

      // Fecha a tentativa no painel — sem isto ela ficaria como "saiu no meio".
      getAttemptTracker()?.send('submit', {
        ...attemptSnapshot(),
        submissionId: data.submissionId,
        score: typeof data.score === 'number' ? data.score : undefined,
      })
      // Zera o rastreador junto: numa prova de treino o aluno recomeça sem
      // trocar de página, e reaproveitar o id reabriria a tentativa entregue.
      clearExamAttempt(id)
      attemptTrackerRef.current = null

      // Salvar score para mostrar depois
      if (exam?.scoringMethod === 'normal' && data.score !== undefined) {
        setSubmissionScore(`${data.score} pontos`)
      } else if (data.message) {
        setSubmissionScore(data.message)
      }

      // Salvar ID da submissão para permitir auto-avaliação posterior
      if (data.submissionId) {
        setExistingSubmissionId(data.submissionId)
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
    return <LogoLoading message="Carregando prova..." size="lg" fullscreen />
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Prova não encontrada</div>
      </div>
    )
  }


  // Tela de configuração para provas práticas
  if (showPracticeConfig && exam && exam.isPracticeExam && !started) {
    return (
      <PracticeExamConfig
        exam={exam}
        onStart={handlePracticeStart}
        onBack={() => router.push('/')}
      />
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

  // Helper: replace \nl with actual newlines
  const formatText = (text: string) => text?.replace(/\\nl/g, '\n').replace(/\\n/g, '\n') || ''

  // Helper: render text with **bold** and *italic* inline markdown as React nodes
  const renderRichText = (text: string): React.ReactNode => {
    const processed = formatText(text)
    const parts = processed.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={i}>{part.slice(2, -2)}</strong>
      if (part.startsWith('*') && part.endsWith('*'))
        return <em key={i}>{part.slice(1, -1)}</em>
      return part
    })
  }

  // Tela de conclusão após submissão
  if (submitted) {
    // Calcular resultados para provas práticas/pessoais
    const isPracticeOrPersonal = exam.isPracticeExam || (exam as any)?.isPersonalExam
    const mcQuestions = exam.questions.filter(q => q.type === 'multiple-choice')
    const discursiveQuestions = exam.questions.filter(q => q.type === 'discursive')
    let mcCorrect = 0
    let mcTotal = mcQuestions.length

    mcQuestions.forEach(q => {
      const answer = answers.find(a => a.questionId === q.id)
      const correctAlt = q.alternatives.find(a => a.isCorrect)
      if (correctAlt && answer?.selectedAlternative === correctAlt.id) {
        mcCorrect++
      }
    })

    const mcPercentage = mcTotal > 0 ? Math.round((mcCorrect / mcTotal) * 100) : 0
    const discursiveWithScore = discursiveQuestions.filter(q => {
      const answer = answers.find(a => a.questionId === q.id)
      return answer?.discursiveSelfScore !== undefined
    })
    const discursivePending = discursiveQuestions.filter(q => {
      const answer = answers.find(a => a.questionId === q.id)
      return answer?.discursiveText?.trim() && answer?.discursiveSelfScore === undefined
    })
    const discursiveAvg = discursiveWithScore.length > 0
      ? Math.round(discursiveWithScore.reduce((sum, q) => {
          const a = answers.find(a => a.questionId === q.id)
          return sum + (a?.discursiveSelfScore || 0)
        }, 0) / discursiveWithScore.length)
      : null

    /**
     * O percentual que o anel desenha.
     *
     * `overallScore` é texto — pode ser "72%", "8 pontos" ou uma mensagem de
     * "aguardando correção". O anel precisa de um número de 0 a 100, e quando
     * não há como extrair um (correção pendente, nota TRI), ele fica vazio em
     * vez de mostrar um preenchimento inventado.
     */
    // Overall score
    let overallScore = submissionScore
    if (!overallScore && isPracticeOrPersonal) {
      if (discursiveAvg !== null && mcTotal > 0) {
        overallScore = `${Math.round((mcPercentage + discursiveAvg) / 2)}%`
      } else {
        overallScore = `${mcPercentage}%`
      }
    }

    const notaGeralEmPercentual: number | null = (() => {
      if (isPracticeOrPersonal) {
        if (discursiveAvg !== null && mcTotal > 0) return Math.round((mcPercentage + discursiveAvg) / 2)
        if (mcTotal > 0) return mcPercentage
        return discursiveAvg
      }
      const pontos = Number(String(submissionScore || '').replace(/[^\d.,]/g, '').replace(',', '.'))
      const total = exam.totalPoints || 100
      if (!Number.isFinite(pontos) || total <= 0) return null
      return Math.max(0, Math.min(100, Math.round((pontos / total) * 100)))
    })()

    return (
      <>
        {proctoringModal}
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
          <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

            {/* ═══ HEADER ═══ */}
            <div className="text-center space-y-5 py-8">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse" />
                  {/* O selo entra com um leve estouro: é o momento em que a
                      pessoa descobre que a prova foi mesmo entregue. */}
                  <div className="exam-selo-estoura relative bg-gradient-to-br from-green-400 to-emerald-600 rounded-full p-5 shadow-2xl shadow-green-500/30">
                    <CheckCircle2 className="h-12 w-12 text-white" />
                  </div>
                </div>
              </div>
              <div className="exam-resultado-entra" style={{ '--exam-ordem': 1 } as React.CSSProperties}>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                  Prova entregue
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">{exam.title}</p>
              </div>
              <div className="exam-resultado-entra flex flex-wrap items-center justify-center gap-2" style={{ '--exam-ordem': 2 } as React.CSSProperties}>
                {examDuration && (
                  <span className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 backdrop-blur-sm px-4 py-2 rounded-full border border-border/50">
                    <Clock className="h-4 w-4" />
                    Duração: {examDuration}
                  </span>
                )}
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 backdrop-blur-sm px-4 py-2 rounded-full border border-border/50">
                  <User className="h-4 w-4" />
                  {userName}
                </span>
                {/* Numa prova avaliativa a nota não é o fim da história: a
                    correção e o gabarito ainda dependem do término. Dizer isso
                    aqui evita a pergunta "e agora?" logo depois da entrega. */}
                {!isPracticeOrPersonal && janela && !janela.encerrada && (
                  <span className="inline-flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-500/10 px-4 py-2 rounded-full border border-amber-500/25">
                    <Clock className="h-4 w-4" />
                    Gabarito em {new Date(exam.endTime).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>

            {/* ═══ SCORE CARDS ═══ */}
            {isPracticeOrPersonal && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {mcTotal > 0 && (
                  <div className="exam-resultado-entra relative overflow-hidden rounded-2xl border border-border/50 bg-background/60 backdrop-blur-md p-6 text-center shadow-lg" style={{ '--exam-ordem': 3 } as React.CSSProperties}>
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/5 rounded-full" />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Objetivas</p>
                    <div className="text-5xl font-black tracking-tight">{mcCorrect}<span className="text-xl text-muted-foreground font-normal">/{mcTotal}</span></div>
                    <div className={`text-2xl font-bold mt-2 ${mcPercentage >= 70 ? 'text-green-600' : mcPercentage >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                      {mcPercentage}%
                    </div>
                  </div>
                )}
                {discursiveQuestions.length > 0 && (
                  <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-background/60 backdrop-blur-md p-6 text-center shadow-lg">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-400" />
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-violet-500/5 rounded-full" />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Discursivas</p>
                    <div className="text-5xl font-black tracking-tight">{discursiveWithScore.length}<span className="text-xl text-muted-foreground font-normal">/{discursiveQuestions.length}</span></div>
                    <div className="text-sm text-muted-foreground mt-1">avaliadas</div>
                    {discursiveAvg !== null && (
                      <div className={`text-2xl font-bold mt-1 ${discursiveAvg >= 70 ? 'text-green-600' : discursiveAvg >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                        {discursiveAvg}%
                      </div>
                    )}
                  </div>
                )}
                {/*
                  A nota geral em anel, e não só em número.

                  Um "72%" isolado não diz se foi bom. O anel dá a proporção de
                  imediato — quanto do total foi preenchido — e a cor faz o
                  julgamento sem uma frase julgando. O ângulo vai por variável
                  CSS (`--exam-nota`) e a animação mora no globals.css.
                */}
                <div className="exam-resultado-entra relative overflow-hidden rounded-2xl border border-border/50 bg-background/60 backdrop-blur-md p-6 text-center shadow-lg" style={{ '--exam-ordem': 5 } as React.CSSProperties}>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#468152] to-[#E2A43E]" />
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Nota Geral</p>
                  <div
                    className="exam-anel-de-nota mx-auto flex h-28 w-28 items-center justify-center rounded-full"
                    style={{
                      '--exam-nota': notaGeralEmPercentual ?? 0,
                      '--exam-anel-cor':
                        (notaGeralEmPercentual ?? 0) >= 70 ? '#10b981'
                          : (notaGeralEmPercentual ?? 0) >= 40 ? '#f59e0b'
                          : '#ef4444',
                    } as React.CSSProperties}
                    role="img"
                    aria-label={`Nota geral: ${overallScore}`}
                  >
                    <div className="flex h-[6.25rem] w-[6.25rem] flex-col items-center justify-center rounded-full bg-background">
                      <span className="exam-numero-sobe text-2xl font-black leading-none bg-gradient-to-r from-[#468152] to-[#E2A43E] bg-clip-text text-transparent">
                        {overallScore}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-3">{exam.questions.length} questões</div>
                </div>
              </div>
            )}

            {/* ═══ NON-PRACTICE CONGRATS ═══ */}
            {!isPracticeOrPersonal && (
              <div className="exam-resultado-entra relative overflow-hidden rounded-2xl border border-border/50 bg-background/60 backdrop-blur-md p-8 text-center shadow-lg" style={{ '--exam-ordem': 3 } as React.CSSProperties}>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#468152] to-[#E2A43E]" />

                {notaGeralEmPercentual !== null ? (
                  <div
                    className="exam-anel-de-nota mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full"
                    style={{
                      '--exam-nota': notaGeralEmPercentual,
                      '--exam-anel-cor':
                        notaGeralEmPercentual >= 70 ? '#10b981'
                          : notaGeralEmPercentual >= 40 ? '#f59e0b'
                          : '#ef4444',
                    } as React.CSSProperties}
                    role="img"
                    aria-label={`Sua nota: ${submissionScore}`}
                  >
                    <div className="flex h-[7.25rem] w-[7.25rem] flex-col items-center justify-center rounded-full bg-background">
                      <span className="exam-numero-sobe text-3xl font-black leading-none bg-gradient-to-r from-[#468152] to-[#E2A43E] bg-clip-text text-transparent">
                        {submissionScore}
                      </span>
                      <span className="mt-1 text-[11px] text-muted-foreground">de {exam.totalPoints} pontos</span>
                    </div>
                  </div>
                ) : (
                  submissionScore && (
                    <p className="exam-numero-sobe text-2xl font-black mt-1 mb-3 bg-gradient-to-r from-[#468152] to-[#E2A43E] bg-clip-text text-transparent">
                      {submissionScore}
                    </p>
                  )
                )}

                <h3 className="text-xl font-bold mb-1">Tudo certo, {userName}.</h3>
                <p className="text-sm text-muted-foreground">
                  Sua prova foi registrada{examDuration ? ` em ${examDuration}` : ''}. Guarde o comprovante abaixo.
                </p>
              </div>
            )}

            {/* ═══ DISCURSIVE PENDING SELF-SCORE ═══ */}
            {isPracticeOrPersonal && discursivePending.length > 0 && (
              <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-violet-50/30 dark:bg-violet-950/20 backdrop-blur-md p-6 shadow-lg">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-400" />
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-violet-500/10 flex-shrink-0">
                    <Copy className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base">
                      {discursivePending.length} {discursivePending.length === 1 ? 'questão discursiva precisa' : 'questões discursivas precisam'} de auto-avaliação
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Copie o prompt, cole em uma IA (ChatGPT, Claude) e atribua sua nota.
                    </p>
                    <div className="mt-4 space-y-3">
                      {discursivePending.map((q) => {
                        const answer = answers.find(a => a.questionId === q.id)
                        return (
                          <div key={q.id} className="flex items-center gap-3 p-4 rounded-xl bg-background/80 border border-border/50 backdrop-blur-sm">
                            <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {q.number}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{formatText(q.statement || '').slice(0, 100)}...</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={() => {
                                  const enunciado = formatText(q.statement || '')
                                  const comando = formatText(q.command || '')
                                  const respostaComentada = formatText(q.explanation || '')
                                  const respostaAluno = answer?.discursiveText || ''
                                  const prompt = `Você é um corretor de questões de Medicina. Você é humano, experiente e pedagogicamente sensato — não é um corretor mecânico nem perfeccionista. Sua filosofia de correção parte do princípio de que o objetivo é avaliar se o aluno compreende o conteúdo, não se ele decorou palavras-chave ou seguiu exatamente a estrutura do gabarito.\n\nVocê aceita e valoriza amplitude e generalidade nas respostas. Se o aluno abordou aspectos que o enunciado não explicitou, mas que são clinicamente ou conceitualmente pertinentes, isso conta a favor, não contra. Você nunca penaliza o aluno por demonstrar conhecimento além do esperado, nem por usar terminologia diferente da do gabarito quando o conteúdo está correto.\n\nVocê também leva em conta o esforço e a construção da resposta. O aluno dedicou tempo para elaborar um raciocínio e para escrever tentando abordar o que ele acha que a questão quer — sua correção respeita isso.\n\nA seguir, serão apresentados: o enunciado da questão, a resposta comentada oficial e a resposta do aluno.\nAo final, você deve atribuir uma nota de 0% a 100% em intervalos de 10%, justificando brevemente sua avaliação com foco no que o aluno acertou, no que ficou incompleto e, se for o caso, no que estava equivocado. Seja direto, humano e justo.\n\n---\n\nENUNCIADO DA QUESTÃO:\n${enunciado}${comando ? `\n\nCOMANDO:\n${comando}` : ''}\n\n---\n\nRESPOSTA COMENTADA (GABARITO):\n${respostaComentada}\n\n---\n\nRESPOSTA DO ALUNO:\n${respostaAluno}`
                                  navigator.clipboard.writeText(prompt).then(() => {
                                    setCopiedPromptId(q.id)
                                    setTimeout(() => setCopiedPromptId(null), 2500)
                                  })
                                }}
                              >
                                {copiedPromptId === q.id ? (
                                  <><ClipboardCheck className="h-3.5 w-3.5 text-green-600 mr-1.5" /> Copiado</>
                                ) : (
                                  <><Copy className="h-3.5 w-3.5 mr-1.5" /> Prompt</>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white"
                                onClick={() => handleOpenSelfScore(q.id)}
                              >
                                Atribuir Nota
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ GABARITO COMPLETO ═══ */}
            {isPracticeOrPersonal && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#468152]/10">
                    <List className="h-5 w-5 text-[#468152]" />
                  </div>
                  <h2 className="text-xl font-bold">Gabarito Completo</h2>
                  <div className="flex-1 h-px bg-border/50" />
                </div>

                <div className="space-y-3">
                  {exam.questions.map((q) => {
                    const answer = answers.find(a => a.questionId === q.id)
                    const isExpanded = expandedQuestion === q.id

                    if (q.type === 'multiple-choice') {
                      const correctAlt = q.alternatives.find(a => a.isCorrect)
                      const selectedAlt = q.alternatives.find(a => a.id === answer?.selectedAlternative)
                      const isCorrect = correctAlt?.id === answer?.selectedAlternative

                      return (
                        <div
                          key={q.id}
                          className={`relative overflow-hidden rounded-2xl border backdrop-blur-md transition-all duration-300 cursor-pointer ${
                            isCorrect
                              ? 'border-green-500/30 bg-green-50/30 dark:bg-green-950/15'
                              : 'border-red-500/30 bg-red-50/30 dark:bg-red-950/15'
                          }`}
                          onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                        >
                          {/* Compact view */}
                          <div className="p-4 flex items-center gap-4">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md ${
                              isCorrect ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'
                            }`}>
                              {q.number}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium line-clamp-1">{formatText(q.statement || '')}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                {selectedAlt && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    isCorrect ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
                                  }`}>
                                    Sua: {selectedAlt.letter}
                                  </span>
                                )}
                                {!isCorrect && correctAlt && (
                                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400">
                                    Correta: {correctAlt.letter}
                                  </span>
                                )}
                                {!selectedAlt && (
                                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                    Não respondida
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                          </div>

                          {/* Expanded content */}
                          {isExpanded && (
                            <div className="px-4 pb-5 space-y-4 border-t border-border/30 pt-4" onClick={(e) => e.stopPropagation()}>
                              {/* Enunciado completo */}
                              <div className="bg-background/60 rounded-xl p-4 border border-border/30">
                                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2">Enunciado</h4>
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{formatText(q.statement || '')}</p>
                              </div>

                              {q.command && (
                                <div className="bg-blue-50/50 dark:bg-blue-950/30 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/30">
                                  <h4 className="font-semibold text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">Comando</h4>
                                  <p className="text-sm whitespace-pre-wrap text-blue-900 dark:text-blue-100 leading-relaxed">{formatText(q.command)}</p>
                                </div>
                              )}

                              {/* Todas as alternativas */}
                              <div className="space-y-2">
                                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Alternativas</h4>
                                {q.alternatives.map(alt => {
                                  const isSelected = alt.id === answer?.selectedAlternative
                                  const isCorrectAlt = alt.isCorrect
                                  return (
                                    <div
                                      key={alt.id}
                                      className={`p-3 rounded-xl text-sm border ${
                                        isCorrectAlt
                                          ? 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-800'
                                          : isSelected
                                          ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800'
                                          : 'bg-background/40 border-border/30'
                                      }`}
                                    >
                                      <span className={`font-bold ${
                                        isCorrectAlt ? 'text-green-700 dark:text-green-400' : isSelected ? 'text-red-700 dark:text-red-400' : ''
                                      }`}>
                                        {alt.letter})
                                      </span>{' '}
                                      <span className="whitespace-pre-wrap">{formatText(alt.text)}</span>
                                      {isCorrectAlt && <span className="ml-2 text-green-600 font-bold text-xs">✓ CORRETA</span>}
                                      {isSelected && !isCorrectAlt && <span className="ml-2 text-red-600 font-bold text-xs">✗ SUA RESPOSTA</span>}
                                    </div>
                                  )
                                })}
                              </div>

                              {/* Feedback comentado por alternativa */}
                              {(q as any).commentedFeedback?.explanations && (
                                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl p-4 border border-indigo-200/50 dark:border-indigo-800/30 space-y-3">
                                  <h4 className="font-semibold text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Análise das Alternativas</h4>
                                  {Object.entries((q as any).commentedFeedback.explanations).map(([letter, explanation]) => (
                                    <div key={letter} className={`p-3 rounded-lg border-l-4 ${
                                      letter === (q as any).commentedFeedback?.correctAlternative
                                        ? 'border-l-green-500 bg-green-50/50 dark:bg-green-950/20'
                                        : 'border-l-gray-300 dark:border-l-gray-600 bg-background/40'
                                    }`}>
                                      <p className="text-xs font-bold mb-1">{letter}) {letter === (q as any).commentedFeedback?.correctAlternative ? '✓ Correta' : ''}</p>
                                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{formatText(explanation as string)}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Resposta Comentada / Explicação */}
                              {q.explanation && (
                                <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-200/50 dark:border-amber-800/30">
                                  <h4 className="font-semibold text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">Resposta Comentada</h4>
                                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{formatText(q.explanation)}</p>
                                </div>
                              )}

                              {/* Botão reportar */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-muted-foreground"
                                onClick={() => setReportQuestionId(q.id)}
                              >
                                <Flag className="h-3 w-3 mr-1" /> Reportar questão
                              </Button>
                            </div>
                          )}
                        </div>
                      )
                    }

                    if (q.type === 'discursive') {
                      const selfScore = answer?.discursiveSelfScore
                      return (
                        <div
                          key={q.id}
                          className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-violet-50/30 dark:bg-violet-950/15 backdrop-blur-md transition-all duration-300 cursor-pointer"
                          onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                        >
                          <div className="p-4 flex items-center gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md bg-gradient-to-br from-violet-500 to-purple-600">
                              {q.number}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium line-clamp-1">{formatText(q.statement || '')}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-violet-600 dark:text-violet-400 font-medium">Discursiva</span>
                                {selfScore !== undefined && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    selfScore >= 70 ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' :
                                    selfScore >= 40 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' :
                                    'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
                                  }`}>
                                    {selfScore}%
                                  </span>
                                )}
                                {selfScore === undefined && answer?.discursiveText?.trim() && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 font-medium">Pendente</span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                          </div>

                          {isExpanded && (
                            <div className="px-4 pb-5 space-y-4 border-t border-border/30 pt-4" onClick={(e) => e.stopPropagation()}>
                              <div className="bg-background/60 rounded-xl p-4 border border-border/30">
                                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2">Enunciado</h4>
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{formatText(q.statement || '')}</p>
                              </div>

                              {q.command && (
                                <div className="bg-blue-50/50 dark:bg-blue-950/30 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/30">
                                  <h4 className="font-semibold text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">Comando</h4>
                                  <p className="text-sm whitespace-pre-wrap text-blue-900 dark:text-blue-100 leading-relaxed">{formatText(q.command)}</p>
                                </div>
                              )}

                              <div className="bg-background/60 rounded-xl p-4 border border-border/30">
                                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2">Sua Resposta</h4>
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{answer?.discursiveText || 'Não respondida'}</p>
                              </div>

                              {q.explanation && (
                                <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-200/50 dark:border-amber-800/30">
                                  <h4 className="font-semibold text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">Resposta Comentada</h4>
                                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{formatText(q.explanation)}</p>
                                </div>
                              )}

                              {selfScore !== undefined && (
                                <div className={`rounded-xl p-4 text-center border ${
                                  selfScore >= 70 ? 'bg-green-50/50 dark:bg-green-950/20 border-green-300/50' :
                                  selfScore >= 40 ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300/50' :
                                  'bg-red-50/50 dark:bg-red-950/20 border-red-300/50'
                                }`}>
                                  <p className="text-lg font-bold">Nota auto-atribuída: {selfScore}%</p>
                                </div>
                              )}

                              {selfScore === undefined && answer?.discursiveText?.trim() && (
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl flex-1"
                                    onClick={() => {
                                      const enunciado = formatText(q.statement || '')
                                      const comando = formatText(q.command || '')
                                      const respostaComentada = formatText(q.explanation || '')
                                      const respostaAluno = answer?.discursiveText || ''
                                      const prompt = `Você é um corretor de questões de Medicina. Você é humano, experiente e pedagogicamente sensato — não é um corretor mecânico nem perfeccionista. Sua filosofia de correção parte do princípio de que o objetivo é avaliar se o aluno compreende o conteúdo, não se ele decorou palavras-chave ou seguiu exatamente a estrutura do gabarito.\n\nVocê aceita e valoriza amplitude e generalidade nas respostas. Se o aluno abordou aspectos que o enunciado não explicitou, mas que são clinicamente ou conceitualmente pertinentes, isso conta a favor, não contra. Você nunca penaliza o aluno por demonstrar conhecimento além do esperado, nem por usar terminologia diferente da do gabarito quando o conteúdo está correto.\n\nVocê também leva em conta o esforço e a construção da resposta. O aluno dedicou tempo para elaborar um raciocínio e para escrever tentando abordar o que ele acha que a questão quer — sua correção respeita isso.\n\nA seguir, serão apresentados: o enunciado da questão, a resposta comentada oficial e a resposta do aluno.\nAo final, você deve atribuir uma nota de 0% a 100% em intervalos de 10%, justificando brevemente sua avaliação com foco no que o aluno acertou, no que ficou incompleto e, se for o caso, no que estava equivocado. Seja direto, humano e justo.\n\n---\n\nENUNCIADO DA QUESTÃO:\n${enunciado}${comando ? `\n\nCOMANDO:\n${comando}` : ''}\n\n---\n\nRESPOSTA COMENTADA (GABARITO):\n${respostaComentada}\n\n---\n\nRESPOSTA DO ALUNO:\n${respostaAluno}`
                                      navigator.clipboard.writeText(prompt).then(() => {
                                        setCopiedPromptId(q.id)
                                        setTimeout(() => setCopiedPromptId(null), 2500)
                                      })
                                    }}
                                  >
                                    {copiedPromptId === q.id ? <><ClipboardCheck className="h-3.5 w-3.5 mr-1.5 text-green-600" /> Copiado</> : <><Copy className="h-3.5 w-3.5 mr-1.5" /> Copiar Prompt</>}
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white flex-1"
                                    onClick={() => handleOpenSelfScore(q.id)}
                                  >
                                    Atribuir Minha Nota (0-100%)
                                  </Button>
                                </div>
                              )}

                              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setReportQuestionId(q.id)}>
                                <Flag className="h-3 w-3 mr-1" /> Reportar questão
                              </Button>
                            </div>
                          )}
                        </div>
                      )
                    }

                    // Essay
                    return (
                      <div key={q.id} className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-blue-50/30 dark:bg-blue-950/15 backdrop-blur-md p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md bg-gradient-to-br from-blue-500 to-sky-600">
                            {q.number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{q.essayTheme || formatText(q.statement || '')}</p>
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Redação</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ═══ AÇÕES / DOWNLOADS ═══ */}
            <div className="exam-resultado-entra relative overflow-hidden rounded-2xl border border-border/50 bg-background/60 backdrop-blur-md p-6 shadow-lg space-y-3" style={{ '--exam-ordem': 4 } as React.CSSProperties}>
              <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-4">Downloads e Ações</h3>

              {/*
                Os dois botões abaixo não checavam nada: a mesma conta gratuita
                que ouvia "assine para baixar" na tela inicial da prova baixava
                relatório e gabarito aqui. Agora os dois passam pelo mesmo
                veredito do resto da plataforma — e o do gabarito espera a prova
                terminar, mesmo para quem paga.
              */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  className="w-full rounded-xl h-12 bg-gradient-to-r from-[#468152] to-[#3a6d44] hover:from-[#3a6d44] hover:to-[#2f5a38] text-white font-semibold shadow-md disabled:bg-none"
                  disabled={!!pdfGenerating}
                  onClick={async () => {
                    if (!downloads.relatorio.permitido) {
                      if (downloads.relatorio.esperandoOFim) {
                        showToastMessage(downloads.relatorio.motivo!, 'info')
                      } else {
                        setShowPdfCta(true)
                      }
                      return
                    }
                    try {
                      setPdfGenerating('Relatório')
                      await downloadUserReportPDF({
                        exam: { ...exam, questions: exam.questions },
                        examId: id,
                        userName,
                        signature,
                        answers,
                        submittedAt: new Date(),
                        score: notaGeralEmPercentual !== null && exam.totalPoints
                          ? (notaGeralEmPercentual / 100) * exam.totalPoints
                          : null,
                      })
                    } catch (error: any) {
                      showToastMessage('Erro ao gerar PDF: ' + error.message)
                    } finally {
                      setPdfGenerating(null)
                    }
                  }}
                >
                  <FileDown className="h-5 w-5 mr-2" />
                  Minha prova respondida (PDF)
                </Button>

                <Button
                  className="w-full rounded-xl h-12 bg-gradient-to-r from-[#E2A43E] to-[#d4912e] hover:from-[#d4912e] hover:to-[#c07f22] text-white font-semibold shadow-md disabled:bg-none"
                  disabled={!!pdfGenerating || downloads.gabarito.esperandoOFim}
                  title={downloads.gabarito.motivo || undefined}
                  onClick={async () => {
                    if (!downloads.gabarito.permitido) {
                      if (downloads.gabarito.esperandoOFim) {
                        showToastMessage(downloads.gabarito.motivo!, 'info')
                      } else {
                        setShowPdfCta(true)
                      }
                      return
                    }
                    try {
                      setPdfGenerating('Relatório + Gabarito')
                      const { generateUserReportWithGabaritoPDF } = await import('@/lib/user-report-generator')
                      await generateUserReportWithGabaritoPDF({
                        exam,
                        examId: id,
                        userName,
                        signature,
                        answers,
                        submittedAt: new Date(),
                      })
                    } catch (error: any) {
                      showToastMessage('Erro ao gerar PDF: ' + error.message)
                    } finally {
                      setPdfGenerating(null)
                    }
                  }}
                >
                  <FileDown className="h-5 w-5 mr-2" />
                  {downloads.gabarito.esperandoOFim ? 'Gabarito após o término' : 'Respostas comentadas (PDF)'}
                </Button>
              </div>

              {downloads.gabarito.esperandoOFim && (
                <p className="flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground">
                  <Clock className="mt-0.5 h-3 w-3 flex-shrink-0" />
                  {downloads.gabarito.motivo}
                </p>
              )}

              {annotations.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full rounded-xl"
                  onClick={async () => {
                    try {
                      const { generateAnnotationsPDF, downloadPDF } = await import('@/lib/pdf-generator')
                      const blob = await generateAnnotationsPDF(exam.title, annotations)
                      downloadPDF(blob, `Anotacoes-${exam.title}.pdf`, { type: 'annotations_pdf', resourceId: id as string, resourceTitle: exam.title })
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
                  className="w-full rounded-xl"
                  onClick={() => window.open(exam.pdfUrl, '_blank')}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  PDF Original da Prova
                </Button>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {isPracticeOrPersonal && (
                  <Button
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={() => {
                      setSubmitted(false)
                      setStarted(false)
                      setShowPracticeConfig(true)
                      setAnswers(exam.questions.map(q => ({ questionId: q.id })))
                      setCurrentQuestionIndex(0)
                      setLockedQuestions(new Set())
                    }}
                  >
                    Refazer Prova
                  </Button>
                )}
                <Button
                  variant="secondary"
                  className="w-full rounded-xl"
                  onClick={() => router.push('/')}
                >
                  Voltar para Início
                </Button>
              </div>
            </div>
          </div>
        </div>

      {/* Modal de Relatar Questão */}
      {reportQuestionId && (
        <ReportQuestionModal
          questionId={reportQuestionId}
          examId={id}
          isOpen={!!reportQuestionId}
          onClose={() => setReportQuestionId(null)}
        />
      )}

      {/* Modal de imagem expandida */}
      {examImageModal && (
        <ImageModal
          isOpen={!!examImageModal}
          onClose={() => setExamImageModal(null)}
          src={examImageModal.src}
          alt="Imagem da questão"
        />
      )}

      {/* PDF generating toast */}
      {pdfGenerating && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl bg-card border border-border animate-in slide-in-from-bottom-4 duration-300">
          <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 border-t-emerald-500 animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Gerando PDF…</p>
            <p className="text-xs text-muted-foreground">{pdfGenerating}</p>
          </div>
        </div>
      )}

      {/* Modal de Auto-Avaliação Discursiva - Glassmorphism */}
      {showSelfScoreModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="max-w-md w-full rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-5 text-center">
              <h2 className="text-xl font-bold text-white">Autoavaliação</h2>
              <p className="text-violet-200 text-sm mt-1">
                Como você avalia sua resposta nesta questão?
              </p>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-4 gap-2">
                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(score => (
                  <button
                    key={score}
                    className={`h-14 rounded-xl text-lg font-bold transition-all duration-200 border-2 ${
                      pendingSelfScore === score
                        ? score >= 70
                          ? 'bg-green-600 border-green-500 text-white scale-105 shadow-lg shadow-green-500/30'
                          : score >= 40
                          ? 'bg-amber-500 border-amber-400 text-white scale-105 shadow-lg shadow-amber-500/30'
                          : 'bg-red-600 border-red-500 text-white scale-105 shadow-lg shadow-red-500/30'
                        : 'bg-background border-border/50 hover:bg-muted hover:scale-[1.02]'
                    } ${score === 100 ? 'col-span-4 sm:col-span-3' : ''}`}
                    onClick={() => setPendingSelfScore(score)}
                  >
                    {score}%
                  </button>
                ))}
              </div>

              {pendingSelfScore !== null && (
                <div className={`text-center p-3 rounded-xl ${
                  pendingSelfScore >= 70 ? 'bg-green-50 dark:bg-green-950/20' :
                  pendingSelfScore >= 40 ? 'bg-amber-50 dark:bg-amber-950/20' :
                  'bg-red-50 dark:bg-red-950/20'
                }`}>
                  <p className="text-sm font-medium">
                    {pendingSelfScore >= 90 ? 'Excelente!' :
                     pendingSelfScore >= 70 ? 'Bom desempenho!' :
                     pendingSelfScore >= 40 ? 'Pode melhorar' :
                     'Precisa revisar'}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl h-12"
                  onClick={() => {
                    setShowSelfScoreModal(false)
                    setSelfScoreQuestionId(null)
                    setPendingSelfScore(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 rounded-xl h-12 bg-violet-600 hover:bg-violet-700 text-white font-semibold"
                  disabled={pendingSelfScore === null}
                  onClick={handleConfirmSelfScore}
                >
                  Confirmar Nota
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFinalFeedback && exam && exam.questions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-border/50 bg-background/90 backdrop-blur-xl shadow-2xl">
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Feedback Completo</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Questão {currentFeedbackIndex + 1} de {exam.questions.length}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => setShowFinalFeedback(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#468152] to-[#E2A43E] transition-all duration-300 rounded-full" style={{ width: `${((currentFeedbackIndex + 1) / exam.questions.length) * 100}%` }} />
              </div>
            </div>
            <div className="p-6 space-y-5">
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
                const selfScore = answer?.discursiveSelfScore

                return (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shadow-md ${
                          question.type === 'discursive' ? 'bg-gradient-to-br from-violet-500 to-purple-600' :
                          isCorrect ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'
                        }`}>
                          {question.number}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">Questão {question.number}</h3>
                          <p className="text-xs text-muted-foreground">
                            {question.type === 'multiple-choice' ? 'Múltipla Escolha' : question.type === 'discursive' ? 'Discursiva' : 'Redação'}
                          </p>
                        </div>
                      </div>
                      {question.type === 'multiple-choice' && (
                        <div className={`px-4 py-2 rounded-xl font-semibold text-sm ${
                          isCorrect ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {isCorrect ? '✓ Correta' : '✗ Incorreta'}
                        </div>
                      )}
                      {question.type === 'discursive' && selfScore !== undefined && (
                        <div className={`px-4 py-2 rounded-xl font-semibold text-sm ${
                          selfScore >= 70 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                          selfScore >= 40 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {selfScore}%
                        </div>
                      )}
                    </div>

                    {question.statement && (
                      <div className="bg-muted/50 rounded-xl p-5 border border-border/30">
                        <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-3">Enunciado</h4>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{formatText(question.statement)}</p>
                      </div>
                    )}

                    {question.command && (
                      <div className="bg-blue-50/50 dark:bg-blue-950/30 rounded-xl p-5 border border-blue-200/50 dark:border-blue-800/30">
                        <h4 className="font-semibold text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">Comando</h4>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{formatText(question.command)}</p>
                      </div>
                    )}

                    {question.type === 'multiple-choice' && (
                      <div className="space-y-2">
                        {question.alternatives.map(alt => {
                          const isSelected = alt.id === answer?.selectedAlternative
                          const isCorrectAlt = alt.isCorrect
                          return (
                            <div key={alt.id} className={`p-4 rounded-xl text-sm border ${
                              isCorrectAlt ? 'bg-green-50/50 dark:bg-green-950/20 border-green-300/50' :
                              isSelected ? 'bg-red-50/50 dark:bg-red-950/20 border-red-300/50' :
                              'bg-background/40 border-border/30'
                            }`}>
                              <span className={`font-bold ${isCorrectAlt ? 'text-green-700 dark:text-green-400' : isSelected ? 'text-red-700 dark:text-red-400' : ''}`}>
                                {alt.letter})
                              </span>{' '}
                              <span className="whitespace-pre-wrap">{formatText(alt.text)}</span>
                              {isCorrectAlt && <span className="ml-2 text-green-600 font-bold text-xs">✓ CORRETA</span>}
                              {isSelected && !isCorrectAlt && <span className="ml-2 text-red-600 font-bold text-xs">✗ SUA</span>}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {question.type === 'discursive' && (
                      <div className="bg-background/60 rounded-xl p-5 border border-border/30">
                        <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-3">Sua Resposta</h4>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{answer?.discursiveText || 'Não respondida'}</p>
                      </div>
                    )}

                    {(question as any).commentedFeedback?.explanations && (
                      <div className="bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl p-5 border border-indigo-200/50 dark:border-indigo-800/30 space-y-3">
                        <h4 className="font-semibold text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Análise das Alternativas</h4>
                        {Object.entries((question as any).commentedFeedback.explanations).map(([letter, explanation]) => (
                          <div key={letter} className={`p-3 rounded-lg border-l-4 ${
                            letter === (question as any).commentedFeedback?.correctAlternative
                              ? 'border-l-green-500 bg-green-50/50 dark:bg-green-950/20' : 'border-l-gray-300 dark:border-l-gray-600 bg-background/40'
                          }`}>
                            <p className="text-xs font-bold mb-1">{letter}) {letter === (question as any).commentedFeedback?.correctAlternative ? '✓ Correta' : ''}</p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{formatText(explanation as string)}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {question.explanation && (
                      <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-xl p-5 border border-amber-200/50 dark:border-amber-800/30">
                        <h4 className="font-semibold text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-3">
                          {question.type === 'discursive' ? 'Resposta Comentada' : 'Resposta Comentada'}
                        </h4>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{formatText(question.explanation)}</p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t border-border/30">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentFeedbackIndex(Math.max(0, currentFeedbackIndex - 1))}
                        disabled={currentFeedbackIndex === 0}
                        className="flex-1 rounded-xl h-11"
                      >
                        ← Anterior
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentFeedbackIndex(Math.min(exam.questions.length - 1, currentFeedbackIndex + 1))}
                        disabled={currentFeedbackIndex === exam.questions.length - 1}
                        className="flex-1 rounded-xl h-11"
                      >
                        Próxima →
                      </Button>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}
      </>
    )
  }

  if (!started && !inWaitingRoom) {
    return (
      <>
        {proctoringModal}
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/40 flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-3xl w-full">
            {/*
              A marca antes da prova. Esta tela é a porta de entrada de quem
              chega pelo link direto — e ela não tinha logo, nome nem endereço:
              um cartão de vidro com um botão verde, igual ao de qualquer lugar.
            */}
            <ExamBrandHeader
              className="mb-3 px-1"
              acao={
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-muted-foreground hover:text-foreground"
                  onClick={() => router.push('/')}
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar
                </Button>
              }
            />

            <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-background/60 backdrop-blur-xl shadow-2xl">
              {/* Top accent */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#468152] via-emerald-400 to-[#E2A43E]" />

              {/* Cover */}
              {exam.coverImage ? (
                <div className="relative h-48 sm:h-56 overflow-hidden">
                  <img src={exam.coverImage} alt={exam.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                </div>
              ) : (
                /*
                  Sem capa, esta faixa era um degradê mudo de 80px. Agora ela
                  carrega a marca em marca-d'água: a prova sem imagem própria
                  passa a ter, ainda assim, uma identidade.
                */
                <div className="relative h-20 overflow-hidden bg-gradient-to-br from-emerald-500/10 via-background to-amber-500/10 sm:h-24">
                  {/*
                    No canto, e não no centro: o conteúdo do cartão sobe por
                    cima desta faixa (`-mt-14`), e uma marca centralizada
                    apareceria por trás do título da prova.
                  */}
                  <div className="absolute right-5 top-3 opacity-[0.16]">
                    <Logo variant="icon" size="lg" className="exam-flutua block !h-12 w-auto dark:hidden" />
                    <Logo variant="dark" size="lg" className="exam-flutua hidden !h-12 w-auto dark:block" />
                  </div>
                </div>
              )}

              <div className="p-6 sm:p-8 -mt-10 sm:-mt-14 relative space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {(exam as any).isPersonalExam && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400">Pessoal</span>
                    )}
                    {exam.isPracticeExam && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">Treino</span>
                    )}
                    {exam.proctoring?.enabled && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">Proctoring</span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">{exam.title}</h1>
                  {exam.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{exam.description}</p>
                  )}
                </div>

                {/* Retomada — a primeira coisa que quem caiu precisa ler. */}
                {retomada?.temProgresso && (
                  <ExamResumeCard
                    veredito={retomada}
                    respondidas={progressoSalvo?.respondidas ?? contarRespondidas(progressoSalvo?.answers)}
                    totalDeQuestoes={exam.questions.length}
                    salvoEm={progressoSalvo?.atualizadoEm}
                    retomando={retomando}
                    entregando={submitting}
                    onContinuar={continuarProva}
                    onEntregar={entregarRascunho}
                  />
                )}

                {/* Portões — os quatro marcos que só existiam no banco. */}
                {janela && janela.fase !== 'livre' && <ExamGateStatus janela={janela} />}

                {/*
                  Os números da prova.

                  "Início" e "Término" saem daqui quando o painel de portões
                  está na tela: ele já mostra os dois, no mesmo formato, dois
                  centímetros acima. Repetir a mesma data duas vezes na mesma
                  dobra não reforça nada — só faz o leitor conferir se são a
                  mesma coisa. No lugar entra a duração, que o painel não diz.
                */}
                {(() => {
                  const temPainelDePortoes = !!janela && janela.fase !== 'livre'
                  const dataCurta = (valor: Date | string) =>
                    new Date(valor).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })

                  const stats: { label: string; value: React.ReactNode; color: string }[] = [
                    { label: 'Questões', value: exam.numberOfQuestions, color: 'from-emerald-500/15 to-emerald-500/5 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
                    { label: 'Pontuação', value: exam.scoringMethod === 'tri' ? 'TRI · 1000' : `${exam.totalPoints} pts`, color: 'from-amber-500/15 to-amber-500/5 text-amber-700 dark:text-amber-400 border-amber-500/20' },
                  ]

                  if (exam.duration) {
                    stats.push({
                      label: 'Duração',
                      value: exam.duration >= 60
                        ? `${Math.floor(exam.duration / 60)}h${exam.duration % 60 ? ` ${String(exam.duration % 60).padStart(2, '0')}min` : ''}`
                        : `${exam.duration} min`,
                      color: 'from-violet-500/15 to-violet-500/5 text-violet-700 dark:text-violet-400 border-violet-500/20',
                    })
                  }

                  if (!temPainelDePortoes) {
                    stats.push(
                      { label: 'Início', value: dataCurta(exam.startTime), color: 'from-blue-500/15 to-blue-500/5 text-blue-700 dark:text-blue-400 border-blue-500/20' },
                      { label: 'Término', value: dataCurta(exam.endTime), color: 'from-rose-500/15 to-rose-500/5 text-rose-700 dark:text-rose-400 border-rose-500/20' },
                    )
                  }

                  return (
                    <div
                      className={`grid gap-3 ${
                        stats.length <= 2 ? 'grid-cols-2' : stats.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'
                      }`}
                    >
                      {stats.map((stat, i) => (
                        <div key={i} className={`rounded-xl border bg-gradient-to-br p-3 ${stat.color}`}>
                          <p className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">{stat.label}</p>
                          <p className="text-sm font-bold mt-0.5 tabular-nums">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  )
                })()}

                {/* Form */}
                <div className="space-y-4 pt-2 border-t border-border/40">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="userName" className="text-sm font-medium">Nome completo *</Label>
                      {exam.allowCustomName && loggedUserName && !userName && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setUserName(loggedUserName)}
                          className="h-7 text-xs rounded-lg"
                        >
                          <User className="h-3 w-3 mr-1" /> Usar meu nome
                        </Button>
                      )}
                    </div>
                    <Input
                      id="userName"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder={exam.allowCustomName ? 'Digite seu nome completo' : 'Usando nome do usuário'}
                      disabled={!exam.allowCustomName}
                      className={`rounded-xl ${!exam.allowCustomName ? 'bg-muted' : ''}`}
                    />
                    {!exam.allowCustomName && (
                      <p className="text-[11px] text-muted-foreground">O nome será preenchido automaticamente.</p>
                    )}
                  </div>

                  {exam.themePhrase && (
                    <div className="space-y-2">
                      <Label htmlFor="theme" className="text-sm font-medium">Transcreva a frase-tema *</Label>
                      <div className="p-3.5 bg-muted/60 rounded-xl border border-border/30">
                        <p className="text-sm font-medium italic text-foreground">&ldquo;{exam.themePhrase}&rdquo;</p>
                      </div>
                      <Textarea
                        id="theme"
                        value={themeTranscription}
                        onChange={(e) => setThemeTranscription(e.target.value)}
                        placeholder="Transcreva a frase-tema aqui..."
                        rows={3}
                        className="font-serif text-base rounded-xl"
                      />
                    </div>
                  )}
                </div>

                {/*
                  A assinatura, na tela em que a prova de fato começa.

                  Ela morava só na sala de espera — e a sala de espera é para
                  quem chega ANTES do início. Quem abre a página com a prova já
                  em andamento pula direto daqui para dentro da prova, e nunca
                  via o campo: a exigência de assinatura valia apenas para quem
                  chegava adiantado. Aqui o campo aparece nos dois caminhos, e o
                  botão abaixo só destrava com ela.

                  Não aparece quando a entrada está fechada (portão fechado,
                  prova encerrada): pedir assinatura para uma porta trancada é
                  pedir trabalho por nada. A exceção é quem tem rascunho para
                  retomar ou entregar — para esse, o portão fechado não é o fim
                  do caminho, e sem o campo aqui ele não teria onde assinar.
                */}
                {exam.requireSignature !== false &&
                  (!janela ||
                    janela.podeEntrar ||
                    janela.podeIniciar ||
                    (!!retomada?.temProgresso && !janela.encerrada)) && (
                  <SignaturePad
                    onSignatureChange={setSignature}
                    valorInicial={signature}
                    label={`Assinatura Digital ${exam.requireSignature ? '*' : '(opcional)'}`}
                  />
                )}

                {/*
                  O botão agora responde à fase, não só a "começou ou não".
                  Antes ele oferecia "Entrar na Sala" com os portões fechados —
                  a pessoa entrava numa sala de espera de uma prova que nunca ia
                  abrir para ela, e só descobria no botão seguinte.
                */}
                <Button
                  className={`relative w-full overflow-hidden rounded-xl h-12 font-semibold bg-gradient-to-r from-[#468152] to-[#3a6d44] hover:from-[#3a6d44] hover:to-[#2f5a38] text-white shadow-md shadow-emerald-500/20 disabled:bg-none ${
                    // A mesma chamada da sala de espera, no botão que a maioria
                    // de fato clica: quem chega com a prova já em andamento
                    // nunca passa pela sala.
                    canStart && (!exam.requireSignature || signature) ? 'exam-botao-chama' : ''
                  }`}
                  size="lg"
                  onClick={() => {
                    if (canStart) {
                      handleStartExam()
                    } else {
                      setInWaitingRoom(true)
                    }
                  }}
                  disabled={
                    !userName.trim() ||
                    (exam.themePhrase ? !themeTranscription.trim() : false) ||
                    /*
                     * `podeEntrar` sozinho travava quem JÁ ESTÁ DENTRO.
                     *
                     * Numa prova de portão 13h–13h50 e início às 14h, quem
                     * entrou às 13h30 chega às 14h com `podeEntrar: false` (o
                     * portão fechou) e `podeIniciar: true` (ele está dentro) —
                     * e o botão ficava desabilitado justamente para a pessoa
                     * que a prova está esperando. A porta abre para os três
                     * caminhos: entrar agora, iniciar por já ter entrado, ou
                     * VOLTAR PARA A SALA por já ter entrado.
                     *
                     * O terceiro é o intervalo entre o portão fechar e a prova
                     * começar — das 13h50 às 14h no exemplo. Ali quem entrou
                     * às 13h30 tem `podeEntrar: false` (o portão fechou) e
                     * `podeIniciar: false` (a prova ainda não começou): um
                     * F5 nesses dez minutos trancava do lado de fora quem
                     * estava dentro, e a única coisa que ele tinha feito de
                     * diferente foi chegar cedo.
                     */
                    (!!janela &&
                      !janela.podeEntrar &&
                      !janela.podeIniciar &&
                      !(janela.jaEntrou && !janela.encerrada)) ||
                    // Só trava o caminho que ENTRA na prova: para a sala de
                    // espera a assinatura ainda pode ser feita lá dentro.
                    (canStart && !!exam.requireSignature && !signature)
                  }
                >
                  {janela?.fase === 'encerrada'
                    ? 'Prova encerrada'
                    : janela?.fase === 'portao-fechado'
                      ? 'Portões fechados'
                      : janela?.fase === 'antes-do-portao'
                        ? 'Aguardando abertura dos portões'
                        : canStart
                          ? (exam.requireSignature && !signature ? 'Assine antes de iniciar' : 'Iniciar Prova')
                          : 'Entrar na Sala'}
                </Button>

                <PdfCtaBanner accountType={accountType} isAdmin={userRole === 'admin'} compact />

                <ExamBrandFooter className="border-t border-border/40 pt-4" />
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  // Sala de espera
  if (!started && inWaitingRoom) {
    return (
      <>
        {proctoringModal}
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/40 flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-3xl w-full">
            <ExamBrandHeader
              className="mb-3 px-1"
              acao={
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-muted-foreground hover:text-foreground"
                  onClick={() => router.push('/')}
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" /> Sair
                </Button>
              }
            />

            <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-background/60 backdrop-blur-xl shadow-2xl">
              {/*
                A faixa do topo era azul-violeta-fúcsia — três cores que não
                são da plataforma. Passa a ser a mesma da tela de entrada:
                verde e âmbar da marca.
              */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#468152] via-emerald-400 to-[#E2A43E]" />

              <div className="p-6 sm:p-8 space-y-6">
                <div className="text-center space-y-2.5">
                  {/*
                    O relógio da espera, com a órbita girando em volta. A sala
                    de espera é a tela em que a pessoa fica mais tempo parada
                    olhando — e ela era um ícone estático num quadrado violeta.
                  */}
                  <div className="relative mx-auto mb-1 inline-flex h-20 w-20 items-center justify-center">
                    <span
                      aria-hidden
                      className="exam-orbita absolute inset-0 rounded-full border-2 border-dashed border-emerald-500/35"
                    />
                    <span className="exam-flutua flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-amber-500/20 shadow-inner">
                      <Clock className="h-7 w-7 text-[#468152] dark:text-emerald-400" />
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{exam.title}</h1>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-[#468152] dark:text-emerald-400">Sala de Espera</span>
                    {' · '}Bem-vindo(a), <span className="font-semibold text-foreground">{userName}</span>
                  </p>
                </div>

                <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-muted/40 to-background p-6">
                  <Countdown
                    targetDate={new Date(exam.startTime)}
                    onComplete={() => {
                      setCanStart(true)
                      setTimeout(() => setShowToast(true), 100)
                    }}
                  />
                </div>

                {janela && janela.fase !== 'livre' ? (
                  <ExamGateStatus janela={janela} />
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Início', value: formatDate(exam.startTime) },
                      { label: 'Término', value: formatDate(exam.endTime) },
                    ].map((s, i) => (
                      <div key={i} className="rounded-xl border border-border/40 bg-muted/30 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{s.label}</p>
                        <p className="text-sm font-semibold mt-0.5">{s.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Campo de Assinatura - Opcional se requireSignature for false */}
                {exam.requireSignature !== false && (
                  <SignaturePad
                    onSignatureChange={setSignature}
                    valorInicial={signature}
                    label={`Assinatura Digital ${exam.requireSignature ? '*' : '(opcional)'}`}
                  />
                )}

                {/* PDF só aparece quando a prova começar */}
                {exam.pdfUrl && canStart && (
                  <Button
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={() => window.open(exam.pdfUrl, '_blank')}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Baixar PDF da Prova
                  </Button>
                )}

                {/*
                  O botão que a pessoa está esperando.

                  Ele nascia igual a qualquer outro botão verde da tela — e ele
                  não é: é o único que ela veio esperar, às vezes por vinte
                  minutos, e o momento em que ele destrava não tinha nenhuma
                  marca visual. `exam-botao-chama` pulsa o halo e passa um
                  brilho por cima, e a classe é aplicada SÓ quando ele está de
                  fato clicável: um botão travado que pisca é uma promessa
                  quebrada a cada segundo. Ver app/globals.css.
                */}
                <div className="flex gap-2">
                  <Button
                    className={`relative flex-1 overflow-hidden rounded-xl h-12 font-semibold transition-all ${
                      canStart && (!exam.requireSignature || signature)
                        ? 'exam-botao-chama bg-gradient-to-r from-[#468152] to-[#3a6d44] hover:from-[#3a6d44] hover:to-[#2f5a38] text-white'
                        : ''
                    }`}
                    size="lg"
                    onClick={handleStartExam}
                    disabled={!canStart || (exam.requireSignature && !signature)}
                  >
                    {(exam.requireSignature && !signature) ? (
                      'Assine antes de iniciar'
                    ) : canStart ? (
                      <>
                        <Play className="mr-2 h-4 w-4 fill-current" />
                        Iniciar Prova Agora
                      </>
                    ) : (
                      'Aguardando Início...'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      setInWaitingRoom(false)
                      router.push('/')
                    }}
                  >
                    Sair
                  </Button>
                </div>

                <ExamBrandFooter className="border-t border-border/40 pt-4" />
              </div>
            </div>
          </div>

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

  // ─── Question palette derived state ───
  const paletteQuestions: PaletteQuestion[] = exam.questions.map((q) => {
    const ans = answers.find(a => a.questionId === q.id)
    let answered = false
    if (q.type === 'multiple-choice') answered = !!ans?.selectedAlternative
    else if (q.type === 'discursive') answered = !!(ans?.discursiveText && ans.discursiveText.trim())
    else if (q.type === 'essay') answered = !!(ans?.essayText && ans.essayText.trim())
    return {
      id: q.id,
      number: q.number,
      type: q.type,
      answered,
      hasAnnotation: !!annotations.find(a => a.questionId === q.id),
      locked: lockedQuestions.has(q.id),
    }
  })

  // A contagem de respondidas já sai pronta da paleta — reaproveitar aqui evita
  // recalcular a mesma varredura em cada barra de progresso da tela.
  const answeredCount = paletteQuestions.filter(q => q.answered).length
  const progressPercent = exam.questions.length
    ? (answeredCount / exam.questions.length) * 100
    : 0

  // ─── Cronômetro da prova ───
  // Provas de treino e pessoais nascem com `endTime` um ano à frente, só para
  // liberar o acesso. Usar essa data como prazo fazia o cabeçalho exibir uma
  // contagem sem sentido ("17:13:38 restante") mesmo para quem escolheu "Sem
  // limite". O cronômetro agora só aparece quando existe prazo de verdade: o
  // limite escolhido no treino ou o fim de uma prova agendada.
  const isSelfPacedExam = Boolean(exam.isPracticeExam || (exam as any).isPersonalExam)
  const examDeadline: Date | null =
    practiceTimeLimitMs && examStartTime
      ? new Date(examStartTime.getTime() + practiceTimeLimitMs)
      : isSelfPacedExam
      ? null
      // `prazoDeEntrega` é o menor entre o fim da prova e a duração individual
      // (`duration`, em minutos). Uma prova de 90 minutos dentro de uma janela
      // de 3 horas mostrava a contagem da janela — o aluno via 3 horas
      // sobrando e o tempo dele acabava antes.
      : prazoDeEntrega(exam, examStartTime)
  const handleExamTimeUp = () => {
    if (exam.isPracticeExam) {
      showToastMessage('Tempo esgotado! Finalizando prova...', 'info')
      handleSubmit()
    } else {
      showToastMessage('O tempo da prova acabou!', 'info')
      setTimeout(() => router.push('/'), 2000)
    }
  }

  // ─── Estado da navegação paginada ───
  const isLastQuestion = currentQuestionIndex === exam.questions.length - 1
  const showCheckAnswerButton =
    exam?.feedbackMode === 'immediate' &&
    ((exam as any).isPersonalExam || exam.isPracticeExam) &&
    showCheckButton
  const previousDisabled =
    !canGoBack || (exam?.feedbackMode === 'immediate' && lockedQuestions.has(currentQuestion.id))
  const nextDisabled =
    exam?.feedbackMode === 'immediate' &&
    currentQuestion.type === 'multiple-choice' &&
    !lockedQuestions.has(currentQuestion.id)

  function handlePaletteJump(idx: number) {
    if (isScrollMode) {
      const q = exam!.questions[idx]
      const el = document.getElementById(`question-${q.id}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      // Respect hasTimedQuestions backward restriction
      if (hasTimedQuestions && idx < currentQuestionIndex) return
      setCurrentQuestionIndex(idx)
    }
  }

  return (
    <>
      {/*
        As travas de cópia desta prova, se o admin ligou alguma.

        Só valem com a prova em andamento (`started`) e antes da entrega: na
        sala de espera e na tela de resultado não há enunciado para proteger, e
        travar ali só atrapalharia quem quer copiar o próprio resultado. O
        aviso vai pelo mesmo toast do resto da tela — tecla que não faz nada
        parece defeito.
      */}
      <EscudoAntiCola
        travas={travasDaProva(exam)}
        ativo={started && !submitted}
        aoBloquear={(mensagem) => showToastMessage(mensagem, 'info')}
      />
      {proctoringModal}
      <div
        className="min-h-screen bg-gradient-to-br from-background to-muted"
        style={
          isScrollMode
            ? undefined
            // 4.75rem cobre a barra de navegação; os +5.25rem por cima são o
            // botão "Questões" (bottom-24 + sua própria altura) — sem eles o
            // FAB de anotação nascia embaixo do mapa de questões, quase colado.
            : ({ '--anotacao-espaco-inferior': 'calc(10rem + env(safe-area-inset-bottom))' } as React.CSSProperties)
        }
      >
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

      {/*
        Prova já finalizada.

        O cartão anunciava uma proibição — "Prova Já Realizada! Você já realizou
        esta prova. Não é possível refazê-la." —, que é a leitura mais fria
        possível de alguém acabar de terminar uma prova. Quem chega aqui
        terminou: a primeira frase é sobre o que ele fez, e a primeira ação é
        para onde ele quer ir, o próprio resumo.
      */}
      {alreadySubmitted && !exam?.isPracticeExam && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="max-w-md w-full shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <div className="exam-selo-estoura mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-2xl">Você finalizou essa prova</CardTitle>
                <CardDescription className="mt-2">
                  Sua entrega está registrada. Não é possível refazê-la.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-center text-muted-foreground">
                  {downloads.gabarito.esperandoOFim
                    ? 'Seu resumo já está disponível. O gabarito é liberado quando a prova termina.'
                    : 'Veja seu resumo com as respostas e a correção, ou baixe o gabarito da prova.'}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => router.push(`/exam/${id}/user/${userId}`)}
                  className="exam-botao-chama relative w-full overflow-hidden bg-gradient-to-r from-[#468152] to-[#3a6d44] font-semibold text-white hover:from-[#3a6d44] hover:to-[#2f5a38]"
                  size="lg"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Quero ver meu resumo
                </Button>
                {/*
                  A classificação da turma só existe depois do término — antes
                  disso o botão levaria a uma tela que recusa a entrada.
                */}
                {janela?.encerrada && (
                  <Button
                    onClick={() => router.push(`/exam/${id}/results`)}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Ver resultados da turma
                  </Button>
                )}
                {!downloads.gabarito.esperandoOFim ? (
                  <Button
                    onClick={async () => {
                      if (!downloads.gabarito.permitido) {
                        setShowPdfCta(true)
                        return
                      }
                      try {
                        setPdfGenerating('Gabarito')
                        const res = await fetch(`/api/exams/${id}`)
                        if (!res.ok) throw new Error('Erro ao buscar prova')
                        const data = await res.json()
                        const { generateGabaritoPDF, downloadPDF } = await import('@/lib/pdf-generator')
                        const blob = await generateGabaritoPDF(data.exam)
                        downloadPDF(blob, `Gabarito-${data.exam.title}.pdf`, { type: 'gabarito_pdf', resourceId: id as string, resourceTitle: data.exam.title })
                      } catch (error: any) {
                        showToastMessage('Erro ao gerar gabarito: ' + error.message)
                      } finally {
                        setPdfGenerating(null)
                      }
                    }}
                    disabled={!!pdfGenerating}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    {pdfGenerating === 'Gabarito' ? <><span className="h-4 w-4 mr-2 rounded-full border-2 border-current border-t-transparent animate-spin inline-block" />Gerando…</> : <><FileDown className="h-4 w-4 mr-2" />Baixar Gabarito (PDF)</>}
                  </Button>
                ) : (
                  <div className="w-full p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
                    <p className="text-sm text-center text-orange-800 dark:text-orange-200">
                      <Clock className="h-4 w-4 inline mr-2" />
                      {downloads.gabarito.motivo}
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

      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 shadow-sm backdrop-blur-md">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3 md:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-shrink">
              {/* Saída para a tela inicial — durante a prova ela passa pela
                  confirmação, porque sair aqui descarta o que ainda não foi enviado. */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowExitConfirm(true)}
                title="Voltar para a tela inicial"
                aria-label="Voltar para a tela inicial"
                className="h-9 w-9 shrink-0 -ml-1 rounded-xl text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              {examDeadline && <ExamBrandBadge compact className="hidden sm:flex" />}
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
              {/*
                O selo de gravação automática.

                Ele existe para uma pessoa só: a que está com a internet
                oscilando e não sabe se perder a conexão custa a prova. Sem esse
                sinal, a resposta honesta era "não custa, mas confie" — e no
                meio de uma prova ninguém confia. Fica discreto enquanto tudo
                vai bem e fica vermelho quando a gravação falha, que é o único
                momento em que ele precisa ser lido.
              */}
              {salvandoProgresso && (
                <div
                  className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                    salvandoProgresso === 'erro'
                      ? 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300'
                      : 'bg-muted text-muted-foreground'
                  }`}
                  title={
                    salvandoProgresso === 'erro'
                      ? 'A última gravação falhou. Suas respostas continuam nesta tela e a próxima tentativa é automática.'
                      : 'Suas respostas são gravadas automaticamente. Se você cair, dá para continuar.'
                  }
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      salvandoProgresso === 'salvando'
                        ? 'bg-amber-500 animate-pulse'
                        : salvandoProgresso === 'erro'
                          ? 'bg-red-500'
                          : 'bg-emerald-500'
                    }`}
                  />
                  {salvandoProgresso === 'salvando'
                    ? 'Salvando…'
                    : salvandoProgresso === 'erro'
                      ? 'Falha ao salvar'
                      : 'Salvo'}
                </div>
              )}

              {/* 🔥 Streak Fire Widget */}
              {exam?.feedbackMode === 'immediate' && streak >= 3 && (
                <div
                  className={`streak-badge flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full select-none ${streakJustIncremented ? 'streak-pop' : ''}`}
                  style={{
                    background: 'linear-gradient(135deg, rgba(251,146,60,0.15) 0%, rgba(239,68,68,0.15) 100%)',
                    border: '1px solid rgba(251,146,60,0.35)',
                  }}
                >
                  <span className="flame-icon text-base sm:text-lg leading-none">🔥</span>
                  <span
                    className={`font-bold tabular-nums text-orange-500 dark:text-orange-400 text-sm sm:text-base leading-none ${streakJustIncremented ? 'streak-number-in' : ''}`}
                    style={{ textShadow: '0 0 8px rgba(251,146,60,0.6)' }}
                  >
                    {streak}
                  </span>
                </div>
              )}

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
              {/* No mobile o botão vira ícone: sem o número ao lado, ele não
                  contava mais quantas questões ainda faltam. */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowUnansweredModal(true)}
                title={`Não respondidas (${getUnansweredQuestions().length})`}
                aria-label={`Não respondidas (${getUnansweredQuestions().length})`}
                className="md:hidden relative h-8 w-8"
              >
                <AlertCircle className="h-4 w-4" />
                {getUnansweredQuestions().length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-[10px] font-bold leading-4 text-white tabular-nums">
                    {getUnansweredQuestions().length}
                  </span>
                )}
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
                {examDeadline ? (
                  <ExamTimer endTime={examDeadline} onTimeUp={handleExamTimeUp} />
                ) : (
                  <ExamBrandBadge />
                )}
              </div>
              <ThemeToggle />
            </div>
          </div>
          {/* Cronômetro (ou, sem prazo, a marca) em linha separada no mobile */}
          <div className="sm:hidden mt-2 flex items-center justify-center gap-2">
            {examDeadline ? (
              <>
                <ExamBrandBadge compact />
                <ExamTimer endTime={examDeadline} onTimeUp={handleExamTimeUp} />
              </>
            ) : (
              <ExamBrandBadge />
            )}
          </div>
        </div>
      </header>

      <main
        className={`container mx-auto px-4 py-6 sm:py-8 max-w-4xl ${
          // Espaço para o conteúdo não terminar debaixo da barra fixa.
          isScrollMode ? '' : 'pb-[calc(7rem+env(safe-area-inset-bottom))]'
        }`}
      >
        {/* Modo Scroll - Todas as questões visíveis */}
        {isScrollMode ? (
          <div className="space-y-6">
            {exam.questions.map((question, index) => {
              const answer = answers.find(a => a.questionId === question.id)

              return (
                <Card key={question.id} id={`question-${question.id}`} className="rounded-2xl border-border/60 bg-card/95 shadow-sm scroll-mt-28">
                  <CardHeader className="rounded-t-2xl border-b border-border/50 bg-muted/20 pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">Questão {question.number}</CardTitle>
                      {!exam?.isPersonalExam && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-orange-500"
                          onClick={() => setReportQuestionId(question.id)}
                          title="Relatar erro na questão"
                        >
                          <Flag className="h-4 w-4 mr-1" />
                          <span className="text-xs">Relatar</span>
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                  <InlineAnnotationCanvas
                    questionId={question.id}
                    questionNumber={question.number}
                    annotation={getAnnotationForQuestion(question.id)}
                    onChange={handleSaveAnnotation}
                    className="space-y-6"
                  >
                    {/* Enunciado */}
                    <div className="space-y-2">
                      <div className="prose dark:prose-invert max-w-none">
                        <HighlightableText
                          text={formatText(question.statement)}
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
                        <div
                          className="group relative cursor-pointer sm:cursor-zoom-in inline-block w-full select-none"
                          style={{ touchAction: 'manipulation' }}
                          onClick={() => setExamImageModal({ src: question.imageUrl! })}
                        >
                          <img
                            src={question.imageUrl}
                            alt="Imagem da questão"
                            className="max-w-full h-auto rounded-lg border transition-all group-hover:brightness-95 pointer-events-none"
                            draggable={false}
                          />
                          {/* Desktop: hover overlay */}
                          <div className="absolute inset-0 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                            <div className="bg-black/55 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm flex items-center gap-1.5">
                              <Maximize2 className="h-3.5 w-3.5" />
                              Clique para ampliar
                            </div>
                          </div>
                          {/* Mobile/tablet: always-visible badge */}
                          <div className="absolute bottom-2 right-2 sm:hidden bg-black/60 text-white text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 backdrop-blur-sm pointer-events-none">
                            <Maximize2 className="h-3 w-3" />
                            Ampliar
                          </div>
                        </div>
                        {question.imageSource && (
                          <p className="text-xs text-muted-foreground italic">
                            Fonte da imagem: {question.imageSource}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Comando */}
                    <div className="rounded-xl border border-primary/15 border-l-4 border-l-primary/40 bg-primary/5 p-4">
                      <HighlightableText
                        text={formatText(question.command)}
                        highlights={answer?.highlights || []}
                        target="command"
                        onHighlightsChange={(highlights) => handleHighlights(question.id, highlights)}
                        className="font-medium"
                      />
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
                              className={`border rounded-xl p-4 transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-primary bg-primary/10 shadow-sm'
                                  : isCrossed
                                  ? 'border-destructive bg-destructive/5 opacity-50'
                                  : 'border-border/70 hover:border-primary/50 hover:bg-muted/30'
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
                                  <p className={`mt-1 whitespace-pre-wrap ${isCrossed ? 'line-through' : ''}`}>
                                    {formatText(alt.text)}
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
                        <Textarea
                          value={answer?.discursiveText || ''}
                          onChange={(e) => handleDiscursiveText(question.id, e.target.value)}
                          placeholder="Digite sua resposta aqui..."
                          rows={10}
                          className="font-serif text-base"
                          disabled={lockedQuestions.has(question.id)}
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                          <span>{(answer?.discursiveText || '').length} caracteres</span>
                          <span>{(answer?.discursiveText || '').split(/\s+/).filter(w => w.length > 0).length} palavras</span>
                        </div>

                        {/* Resposta Comentada — logo abaixo do campo */}
                        {question.explanation && (
                          <div className="rounded-2xl border border-amber-200/80 dark:border-amber-700/40 overflow-hidden shadow-sm">
                            <button
                              className="w-full flex items-center justify-between px-4 py-3 bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-900/20 transition-colors text-left"
                              onClick={() => setRevealedExplanations(prev => {
                                const next = new Set(prev)
                                if (next.has(question.id)) next.delete(question.id)
                                else next.add(question.id)
                                return next
                              })}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="shrink-0 p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                                  <BookOpen className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Resposta Comentada</p>
                                  <p className="text-[11px] text-amber-600/70 dark:text-amber-400/60 mt-0.5">
                                    {revealedExplanations.has(question.id) ? 'Clique para ocultar o gabarito' : 'Clique para ver o gabarito comentado'}
                                  </p>
                                </div>
                              </div>
                              <ChevronRight className={`h-4 w-4 text-amber-500 dark:text-amber-400 transition-transform duration-200 ${revealedExplanations.has(question.id) ? 'rotate-90' : ''}`} />
                            </button>
                            {revealedExplanations.has(question.id) && (
                              <div className="px-4 py-4 border-t border-amber-200/50 dark:border-amber-700/30 bg-amber-50/30 dark:bg-amber-950/10">
                                <p className="text-sm text-amber-900/85 dark:text-amber-100/75 whitespace-pre-wrap leading-relaxed">
                                  {question.explanation.replace(/\\nl/g, '\n').replace(/\\n/g, '\n')}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Instruções de correção via IA */}
                        {question.explanation && (
                          <div className="rounded-xl border border-blue-200/60 dark:border-blue-800/40 bg-blue-50/60 dark:bg-blue-950/20 p-3.5 space-y-2.5">
                            <div className="flex items-center gap-2">
                              <div className="shrink-0 p-1 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                                <Bot className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Como corrigir com IA</p>
                            </div>
                            <ol className="text-xs text-blue-700/80 dark:text-blue-300/80 space-y-1.5 list-decimal list-inside leading-relaxed">
                              <li>Escreva sua resposta acima e clique em <span className="font-semibold">Copiar Prompt de Correção</span></li>
                              <li>Abra seu chatbot preferido — <span className="font-medium">ChatGPT, Gemini, Claude ou Grok</span></li>
                              <li>Cole o prompt copiado e aguarde a correção</li>
                              <li>Volte aqui e atribua a nota indicada pelo chatbot</li>
                            </ol>
                            <p className="text-[11px] text-blue-600/60 dark:text-blue-400/50 leading-relaxed border-t border-blue-200/40 dark:border-blue-700/30 pt-2">
                              O prompt foi criado para ser humano e pedagógico — avalia o entendimento geral do conteúdo com base no contexto da questão, reconhecendo que é praticamente impossível uma resposta discursiva 100% completa.
                            </p>
                          </div>
                        )}

                        {/* Autoavaliação inline — sempre visível para questões discursivas */}
                        {answer?.discursiveText?.trim() && (
                          <div className="rounded-2xl border border-violet-200/60 dark:border-violet-800/40 bg-gradient-to-br from-violet-50/80 to-purple-50/50 dark:from-violet-950/30 dark:to-purple-950/20 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                                <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wider">Autoavaliação</p>
                              </div>
                              {answer?.discursiveSelfScore !== undefined && (
                                <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                                  answer.discursiveSelfScore >= 70 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                                  answer.discursiveSelfScore >= 40 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                                  'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                }`}>
                                  {answer.discursiveSelfScore}%
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">Como você avalia sua resposta?</p>
                            <div className="grid grid-cols-6 gap-1.5">
                              {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(score => (
                                <button
                                  key={score}
                                  onClick={() => {
                                    setAnswers(prev => prev.map(a =>
                                      a.questionId === question.id ? { ...a, discursiveSelfScore: score } : a
                                    ))
                                  }}
                                  className={`h-10 rounded-xl text-sm font-bold transition-all duration-150 border-2 focus:outline-none
                                    ${score === 100 ? 'col-span-2' : ''}
                                    ${answer?.discursiveSelfScore === score
                                      ? score >= 70 ? 'bg-green-500 border-green-400 text-white shadow-md shadow-green-500/30 scale-105'
                                        : score >= 40 ? 'bg-amber-500 border-amber-400 text-white shadow-md shadow-amber-500/30 scale-105'
                                        : 'bg-red-500 border-red-400 text-white shadow-md shadow-red-500/30 scale-105'
                                      : 'bg-white/70 dark:bg-background/40 border-border/40 hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:border-violet-300 hover:scale-[1.03]'
                                    }`}
                                >
                                  {score}%
                                </button>
                              ))}
                            </div>
                            {answer?.discursiveSelfScore !== undefined && (
                              <p className="text-xs text-center font-medium text-muted-foreground">
                                {answer.discursiveSelfScore >= 90 ? '🏆 Excelente!' :
                                 answer.discursiveSelfScore >= 70 ? '✅ Bom desempenho' :
                                 answer.discursiveSelfScore >= 40 ? '📈 Pode melhorar' :
                                 '📚 Precisa revisar'}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Copiar Prompt de correção */}
                        {question.explanation && answer?.discursiveText?.trim() && (
                          <Button variant="outline" size="sm" className="w-full text-xs rounded-xl"
                            onClick={() => handleCopyDiscursivePrompt(question, answer)}>
                            {copiedPromptId === question.id
                              ? <><ClipboardCheck className="h-3.5 w-3.5 mr-1.5 text-green-600" />Prompt Copiado!</>
                              : <><Copy className="h-3.5 w-3.5 mr-1.5" />Copiar Prompt de Correção</>}
                          </Button>
                        )}
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
                  </InlineAnnotationCanvas>
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
                      <span className="tabular-nums">
                        {answeredCount}/{exam.questions.length} respondidas
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
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
          <Card ref={questionCardRef} className="rounded-2xl border-border/60 bg-card/95 shadow-sm scroll-mt-28">
          <CardHeader className="rounded-t-2xl border-b border-border/50 bg-muted/20 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Questão {currentQuestion.number}</CardTitle>
              {!exam?.isPersonalExam && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-orange-500"
                  onClick={() => setReportQuestionId(currentQuestion.id)}
                  title="Relatar erro na questão"
                >
                  <Flag className="h-4 w-4 mr-1" />
                  <span className="text-xs">Relatar</span>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
          <InlineAnnotationCanvas
            questionId={currentQuestion.id}
            questionNumber={currentQuestion.number}
            annotation={getAnnotationForQuestion(currentQuestion.id)}
            onChange={handleSaveAnnotation}
            className="space-y-6"
          >
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
                  text={formatText(currentQuestion.statement)}
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
                <div
                  className="group relative cursor-pointer sm:cursor-zoom-in inline-block w-full select-none"
                  style={{ touchAction: 'manipulation' }}
                  onClick={() => setExamImageModal({ src: currentQuestion.imageUrl! })}
                >
                  <img
                    src={currentQuestion.imageUrl}
                    alt="Imagem da questão"
                    className="max-w-full h-auto rounded-lg border transition-all group-hover:brightness-95 pointer-events-none"
                    draggable={false}
                  />
                  {/* Desktop: hover overlay */}
                  <div className="absolute inset-0 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                    <div className="bg-black/55 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm flex items-center gap-1.5">
                      <Maximize2 className="h-3.5 w-3.5" />
                      Clique para ampliar
                    </div>
                  </div>
                  {/* Mobile/tablet: always-visible badge */}
                  <div className="absolute bottom-2 right-2 sm:hidden bg-black/60 text-white text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 backdrop-blur-sm pointer-events-none">
                    <Maximize2 className="h-3 w-3" />
                    Ampliar
                  </div>
                </div>
                {currentQuestion.imageSource && (
                  <p className="text-xs text-muted-foreground italic">
                    Fonte da imagem: {currentQuestion.imageSource}
                  </p>
                )}
              </div>
            )}

            {/* Comando */}
            <div className="rounded-xl border border-primary/15 border-l-4 border-l-primary/40 bg-primary/5 p-4">
              <HighlightableText
                text={currentQuestion.command}
                highlights={currentAnswer?.highlights || []}
                target="command"
                onHighlightsChange={(highlights) => handleHighlights(currentQuestion.id, highlights)}
                className="font-medium"
              />
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
                      className={`border rounded-xl p-4 transition-all ${
                        isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                      } ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-sm'
                        : isCrossed
                        ? 'border-destructive bg-destructive/5 opacity-50'
                        : 'border-border/70 hover:border-primary/50 hover:bg-muted/30'
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
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${isCrossed ? 'line-through' : ''}`}>
                                {alt.letter})
                              </span>
                            </div>
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
                <Textarea
                  value={currentAnswer?.discursiveText || ''}
                  onChange={(e) => handleDiscursiveText(currentQuestion.id, e.target.value)}
                  placeholder="Digite sua resposta aqui..."
                  rows={12}
                  className="font-serif text-base"
                  disabled={lockedQuestions.has(currentQuestion.id)}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <span>{(currentAnswer?.discursiveText || '').length} caracteres</span>
                  <span>{(currentAnswer?.discursiveText || '').split(/\s+/).filter(w => w.length > 0).length} palavras</span>
                </div>

                {/* Resposta Comentada — logo abaixo do campo */}
                {currentQuestion.explanation && (
                  <div className="rounded-2xl border border-amber-200/80 dark:border-amber-700/40 overflow-hidden shadow-sm">
                    <button
                      className="w-full flex items-center justify-between px-4 py-3 bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-900/20 transition-colors text-left"
                      onClick={() => setRevealedExplanations(prev => {
                        const next = new Set(prev)
                        if (next.has(currentQuestion.id)) next.delete(currentQuestion.id)
                        else next.add(currentQuestion.id)
                        return next
                      })}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="shrink-0 p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                          <BookOpen className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Resposta Comentada</p>
                          <p className="text-[11px] text-amber-600/70 dark:text-amber-400/60 mt-0.5">
                            {revealedExplanations.has(currentQuestion.id) ? 'Clique para ocultar o gabarito' : 'Clique para ver o gabarito comentado'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className={`h-4 w-4 text-amber-500 dark:text-amber-400 transition-transform duration-200 ${revealedExplanations.has(currentQuestion.id) ? 'rotate-90' : ''}`} />
                    </button>
                    {revealedExplanations.has(currentQuestion.id) && (
                      <div className="px-4 py-4 border-t border-amber-200/50 dark:border-amber-700/30 bg-amber-50/30 dark:bg-amber-950/10">
                        <p className="text-sm text-amber-900/85 dark:text-amber-100/75 whitespace-pre-wrap leading-relaxed">
                          {currentQuestion.explanation.replace(/\\nl/g, '\n').replace(/\\n/g, '\n')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Instruções de correção via IA */}
                {currentQuestion.explanation && (
                  <div className="rounded-xl border border-blue-200/60 dark:border-blue-800/40 bg-blue-50/60 dark:bg-blue-950/20 p-3.5 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div className="shrink-0 p-1 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                        <Bot className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Como corrigir com IA</p>
                    </div>
                    <ol className="text-xs text-blue-700/80 dark:text-blue-300/80 space-y-1.5 list-decimal list-inside leading-relaxed">
                      <li>Escreva sua resposta acima e clique em <span className="font-semibold">Copiar Prompt de Correção</span></li>
                      <li>Abra seu chatbot preferido — <span className="font-medium">ChatGPT, Gemini, Claude ou Grok</span></li>
                      <li>Cole o prompt copiado e aguarde a correção</li>
                      <li>Volte aqui e atribua a nota indicada pelo chatbot</li>
                    </ol>
                    <p className="text-[11px] text-blue-600/60 dark:text-blue-400/50 leading-relaxed border-t border-blue-200/40 dark:border-blue-700/30 pt-2">
                      O prompt foi criado para ser humano e pedagógico — avalia o entendimento geral do conteúdo com base no contexto da questão, reconhecendo que é praticamente impossível uma resposta discursiva 100% completa.
                    </p>
                  </div>
                )}

                {/* Autoavaliação inline — aparece quando há texto */}
                {currentAnswer?.discursiveText?.trim() && (
                  <div className="rounded-2xl border border-violet-200/60 dark:border-violet-800/40 bg-gradient-to-br from-violet-50/80 to-purple-50/50 dark:from-violet-950/30 dark:to-purple-950/20 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                        <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wider">Autoavaliação</p>
                      </div>
                      {currentAnswer?.discursiveSelfScore !== undefined && (
                        <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                          currentAnswer.discursiveSelfScore >= 70 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                          currentAnswer.discursiveSelfScore >= 40 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                          'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                        }`}>
                          {currentAnswer.discursiveSelfScore}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Como você avalia sua resposta?</p>
                    <div className="grid grid-cols-6 gap-1.5">
                      {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(score => (
                        <button
                          key={score}
                          onClick={() => {
                            setAnswers(prev => prev.map(a =>
                              a.questionId === currentQuestion.id ? { ...a, discursiveSelfScore: score } : a
                            ))
                          }}
                          className={`h-11 rounded-xl text-sm font-bold transition-all duration-150 border-2 focus:outline-none
                            ${score === 100 ? 'col-span-2' : ''}
                            ${currentAnswer?.discursiveSelfScore === score
                              ? score >= 70 ? 'bg-green-500 border-green-400 text-white shadow-md shadow-green-500/30 scale-105'
                                : score >= 40 ? 'bg-amber-500 border-amber-400 text-white shadow-md shadow-amber-500/30 scale-105'
                                : 'bg-red-500 border-red-400 text-white shadow-md shadow-red-500/30 scale-105'
                              : 'bg-white/70 dark:bg-background/40 border-border/40 hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:border-violet-300 hover:scale-[1.03]'
                            }`}
                        >
                          {score}%
                        </button>
                      ))}
                    </div>
                    {currentAnswer?.discursiveSelfScore !== undefined && (
                      <p className="text-xs text-center font-medium text-muted-foreground">
                        {currentAnswer.discursiveSelfScore >= 90 ? '🏆 Excelente!' :
                         currentAnswer.discursiveSelfScore >= 70 ? '✅ Bom desempenho' :
                         currentAnswer.discursiveSelfScore >= 40 ? '📈 Pode melhorar' :
                         '📚 Precisa revisar'}
                      </p>
                    )}
                  </div>
                )}

                {/* Copiar Prompt de correção */}
                {currentQuestion.explanation && currentAnswer?.discursiveText?.trim() && (
                  <Button variant="outline" size="sm" className="w-full text-xs rounded-xl"
                    onClick={() => handleCopyDiscursivePrompt(currentQuestion, currentAnswer)}>
                    {copiedPromptId === currentQuestion.id
                      ? <><ClipboardCheck className="h-3.5 w-3.5 mr-1.5 text-green-600" />Prompt Copiado!</>
                      : <><Copy className="h-3.5 w-3.5 mr-1.5" />Copiar Prompt de Correção</>}
                  </Button>
                )}
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
          </InlineAnnotationCanvas>

            {/* A navegação e o progresso vivem na barra fixa do rodapé
                (logo abaixo de </main>): no card eles ficavam no fim de um
                enunciado longo, e no celular só apareciam depois de rolar a
                questão inteira. */}
          </CardContent>
        </Card>
        )}
      </main>

      {/* ─── Barra fixa de navegação (modo paginado) ───
          Fica sempre ao alcance do polegar: o "Próxima" não depende mais de
          rolar até o fim do enunciado, das alternativas e do gabarito. */}
      {!isScrollMode && (
        <nav
          className={`fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-md transition-all duration-200 ${
            annotationModeActive ? 'pointer-events-none translate-y-full opacity-0' : ''
          }`}
        >
          {/* Progresso como filete no topo da barra: informa sem roubar altura */}
          <div className="h-1 w-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="container mx-auto flex max-w-4xl items-center gap-2 px-3 pt-2.5 pb-[calc(0.7rem+env(safe-area-inset-bottom))] sm:px-4">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={previousDisabled}
              title={hasTimedQuestions && currentQuestionIndex > 0 ? 'Não é possível voltar em provas com tempo por questão' : 'Questão anterior'}
              aria-label="Questão anterior"
              className="h-12 shrink-0 rounded-xl px-3 sm:px-4"
            >
              <ChevronLeft className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>

            {/* Posição e respondidas — só onde sobra largura para elas */}
            <div className="hidden min-w-0 flex-1 flex-col items-center justify-center leading-tight sm:flex">
              <span className="text-xs font-semibold tabular-nums">
                Questão {currentQuestionIndex + 1} de {exam.questions.length}
              </span>
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {answeredCount}/{exam.questions.length} respondidas
              </span>
            </div>

            {showCheckAnswerButton ? (
              <Button
                onClick={handleCheckAnswer}
                className="h-12 flex-1 rounded-xl bg-green-600 font-semibold hover:bg-green-700 sm:flex-none sm:px-6"
              >
                <Check className="h-4 w-4 mr-2" />
                Verificar e Continuar
              </Button>
            ) : isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="h-12 flex-1 rounded-xl font-semibold sm:flex-none sm:px-6"
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Enviando...' : 'Finalizar Prova'}
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                disabled={nextDisabled}
                title={nextDisabled ? 'Responda a questão para continuar' : 'Próxima questão'}
                className="h-12 flex-1 rounded-xl font-semibold sm:flex-none sm:px-6"
              >
                {nextDisabled ? 'Responda para continuar' : 'Próxima'}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </nav>
      )}

      {/* Mapa de Questões — paleta flutuante */}
      {started && !alreadySubmitted && (
        <ExamQuestionPalette
          questions={paletteQuestions}
          currentIndex={currentQuestionIndex}
          onJump={handlePaletteJump}
          raised={!isScrollMode}
        />
      )}

      <ToastAlert
        open={toastOpen}
        onOpenChange={setToastOpen}
        message={toastMessage}
        type={toastType}
      />

      {/* Modal de Saída — sair leva para a tela inicial e descarta o que não foi enviado */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="max-w-md w-full shadow-2xl">
            <CardHeader className="space-y-3">
              <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <AlertCircle className="h-7 w-7 text-amber-600 dark:text-amber-300" />
              </div>
              <div className="text-center">
                <CardTitle className="text-xl">Sair da prova?</CardTitle>
                <CardDescription className="mt-2">
                  Você respondeu {answeredCount} de {exam.questions.length} questões. Saindo agora
                  nada é enviado — as respostas desta sessão são perdidas.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {!exam.isPracticeExam && !(exam as any).isPersonalExam && (
                <p className="text-xs text-center text-muted-foreground bg-muted rounded-lg p-3">
                  O cronômetro da prova continua correndo enquanto você estiver fora.
                </p>
              )}
              <div className="flex flex-col-reverse sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={() => setShowExitConfirm(false)}
                >
                  Continuar prova
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 h-11"
                  onClick={() => {
                    setShowExitConfirm(false)
                    router.push('/')
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair mesmo assim
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                              // 'start': a questão começa pelo enunciado, no topo
                              // da tela (o `scroll-mt-28` cobre o header sticky).
                              element.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <Card className="flex w-full max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] sm:max-w-3xl flex-col overflow-hidden rounded-t-3xl rounded-b-none sm:rounded-2xl border-border/60 bg-background/95 shadow-2xl backdrop-blur-xl">
            <CardHeader className={`relative shrink-0 overflow-hidden border-b p-4 sm:p-6 ${
              feedbackData.isCorrect
                ? 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/12 via-background to-background'
                : 'border-red-500/20 bg-gradient-to-br from-red-500/12 via-background to-background'
            }`}>
              <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl ${
                feedbackData.isCorrect ? 'bg-emerald-500/20' : 'bg-red-500/20'
              }`} />
              <div className="relative flex items-start gap-3 sm:gap-4 pr-10">
                <div className={`flex h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 items-center justify-center rounded-2xl border shadow-sm ${
                  feedbackData.isCorrect
                    ? 'border-emerald-500/25 bg-emerald-500/12 text-emerald-600 dark:text-emerald-300'
                    : 'border-red-500/25 bg-red-500/12 text-red-600 dark:text-red-300'
                }`}>
                  {feedbackData.isCorrect ? (
                    <CheckCircle2 className="h-7 w-7 sm:h-8 sm:w-8" />
                  ) : (
                    <AlertCircle className="h-7 w-7 sm:h-8 sm:w-8" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    feedbackData.isCorrect
                      ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300'
                      : 'bg-red-500/12 text-red-700 dark:text-red-300'
                  }`}>
                    {feedbackData.isCorrect ? 'Correta' : 'Incorreta'}
                  </span>
                  <CardTitle className={`mt-2 text-xl sm:text-2xl ${
                    feedbackData.isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'
                  }`}>
                    {feedbackData.isCorrect ? 'Resposta correta' : 'Resposta incorreta'}
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm">
                    {feedbackData.isCorrect
                      ? 'Boa. Compare seu raciocínio com o comentário antes de seguir.'
                      : 'Revise o comentário e veja onde o raciocínio desviou.'}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowFeedbackModal(false)
                    setFeedbackData(null)
                  }}
                  className="absolute right-0 top-0 h-8 w-8 rounded-full p-0"
                  aria-label="Fechar feedback"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4 overflow-y-auto p-4 sm:space-y-5 sm:p-6">
              {/* Enunciado */}
              {feedbackData.statement && (
                <section className="rounded-2xl border border-border/60 bg-muted/30 p-3.5 sm:p-4">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Enunciado</h4>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {formatText(feedbackData.statement)}
                  </p>
                </section>
              )}

              {/* Comando */}
              {feedbackData.command && (
                <section className="rounded-2xl border border-primary/15 border-l-4 border-l-primary/45 bg-primary/5 p-3.5 sm:p-4">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">Comando</h4>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {formatText(feedbackData.command)}
                  </p>
                </section>
              )}

              {/* Alternativas */}
              {feedbackData.alternatives && feedbackData.alternatives.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Alternativas</h4>
                  {feedbackData.alternatives.map(alt => {
                    const isSelected = alt.letter === feedbackData.selectedAlternative
                    const isCorrect = alt.isCorrect
                    const hasPerAltExplanation = feedbackData.commentedFeedback?.explanations?.[alt.letter]
                    return (
                      <div
                        key={alt.id}
                        className={`rounded-2xl border p-3 text-sm transition-colors sm:p-4 ${
                          isCorrect
                            ? 'border-emerald-500/40 bg-emerald-500/10'
                            : isSelected
                            ? 'border-red-500/40 bg-red-500/10'
                            : 'border-border/60 bg-muted/20'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            isCorrect ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : isSelected ? 'bg-red-500/15 text-red-700 dark:text-red-300'
                            : 'text-muted-foreground'
                          }`}>
                            {alt.letter}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className={`whitespace-pre-wrap leading-relaxed ${
                              isCorrect ? 'font-medium text-emerald-950 dark:text-emerald-50'
                              : isSelected ? 'text-red-950 dark:text-red-50'
                              : 'text-foreground'
                            }`}>
                              {formatText(alt.text)}
                            </p>
                            {/* Per-alternative explanation */}
                            {hasPerAltExplanation && (
                              <p className="mt-1.5 text-xs text-muted-foreground italic whitespace-pre-wrap">
                                {formatText(hasPerAltExplanation)}
                              </p>
                            )}
                          </div>
                          {isCorrect && <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-300" />}
                          {!isCorrect && isSelected && <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600 dark:text-red-300" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Explicação Geral / Resposta Comentada */}
              {feedbackData.explanation && (
                <section className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3.5 sm:p-4">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Resposta comentada</h4>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-amber-950 dark:text-amber-50">
                    {renderRichText(feedbackData.explanation)}
                  </div>
                </section>
              )}
            </CardContent>
            <div className="flex-shrink-0 border-t border-border/60 bg-background/95 p-3 sm:p-4">
              <Button
                onClick={() => {
                  setShowFeedbackModal(false)
                  setFeedbackData(null)
                  // Avançar para próxima questão
                  if (currentQuestionIndex < exam!.questions.length - 1) {
                    setCurrentQuestionIndex(currentQuestionIndex + 1)
                  }
                }}
                className="h-11 w-full rounded-xl font-semibold"
                size="lg"
              >
                {currentQuestionIndex < exam!.questions.length - 1 ? 'Próxima questão' : 'Fechar feedback'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de imagem expandida */}
      {examImageModal && (
        <ImageModal
          isOpen={!!examImageModal}
          onClose={() => setExamImageModal(null)}
          src={examImageModal.src}
          alt="Imagem da questão"
        />
      )}
      <PremiumPdfCtaModal open={showPdfCta} onClose={() => setShowPdfCta(false)} />
    </div>
    </>
  )
}
