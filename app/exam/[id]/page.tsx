'use client'

import { avisarXp } from '@/lib/xp/cliente'
import React, { Suspense, useCallback, useEffect, useRef, useState, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ThemeToggle } from '@/components/theme-toggle'
import { LogoLoading } from '@/components/logo-loading'
import { Countdown } from '@/components/countdown'
import { ToastAlert } from '@/components/ui/toast-alert'
import { BanChecker } from '@/components/ban-checker'
import { SignaturePad } from '@/components/signature-pad'
import { ExamBrandFooter, ExamBrandHeader } from '@/components/exam/exam-brand-header'
import { CapaDaProva } from '@/components/exam/capa-da-prova'
import { FundoIos } from '@/components/materiais/fundo-ios'
import {
  AlternativaDeLeitura,
  AnelDeNota,
  CorpoDaQuestao,
  Folha,
  MiniAnel,
  ReguaDeAutoavaliacao,
  corDaNota,
  frasesDaNota,
  type AcoesDaQuestao,
} from '@/components/exam/pecas-da-prova'
import { CoverImage } from '@/components/cover-image'
import { ExamTimer } from '@/components/exam-timer'
import { ExamBrandBadge } from '@/components/exam-brand-badge'
import { Barcode } from '@/components/barcode'
import { Exam, UserAnswer, TextHighlight, QuestionAnnotation, type Question } from '@/lib/types'
import { cn, formatDate } from '@/lib/utils'
import { ProctoringConsent } from '@/components/proctoring-consent'
import { ProctoringMonitor } from '@/components/proctoring-monitor'
import { InlineAnnotationCanvas, useAnnotationModeActive } from '@/components/inline-annotation-canvas'
import { ReportQuestionModal } from '@/components/report-question-modal'
import { PracticeExamConfig, PracticeExamSettings } from '@/components/practice-exam-config'
import { ExamQuestionPalette, PaletteQuestion } from '@/components/exam-question-palette'
import { useProctoring } from '@/hooks/use-proctoring'
import { useWebSocket } from '@/hooks/use-websocket'
import { useVisibilityDetection } from '@/hooks/use-visibility-detection'
import { EVENTO_INSPECAO, type DetalheDoEventoDeInspecao } from '@/lib/protecao-inspecao'
import { useWebRTC } from '@/hooks/use-webrtc'
import { Check, X, Send, FileDown, FileText, Clock, User, CheckCircle2, AlertCircle, StickyNote, Copy, ClipboardCheck, ClipboardList, Flag, ChevronRight, ChevronLeft, BookOpen, LogOut, Lock, Play, Trophy, Flame, MoreHorizontal, LayoutGrid, Eye, RotateCcw, Loader2 } from 'lucide-react'
import { ImageModal } from '@/components/image-modal'
import { PremiumPdfCtaModal } from '@/components/premium-pdf-cta-modal'
import { PdfCtaBanner } from '@/components/pdf-cta-banner'
import { ExamGateStatus } from '@/components/exam/exam-gate-status'
import { ExamResumeCard } from '@/components/exam/exam-resume-card'
import { AvisoProvaLiberada } from '@/components/exam/aviso-prova-liberada'
import { ExamJaFinalizada } from '@/components/exam/exam-ja-finalizada'
import { PitchDeVendasDaProva } from '@/components/exam/pitch-de-vendas'
import { canDownloadExamPdf } from '@/lib/tier-limits'
import { consumirCotaDoPlano } from '@/lib/plan-consume-client'
import { holdScrollAt, useScrollToTopWhen } from '@/components/scroll-to-top'
import { useIsomorphicLayoutEffect } from '@/hooks/use-isomorphic-layout-effect'
import { createExamAttemptTracker, clearExamAttempt, type ExamAttemptTracker } from '@/lib/tracking/track-client'
import {
  ROTULO_DA_FASE,
  prazoDeEntrega,
  resolverJanelaDaProva,
  type JanelaDaProva,
} from '@/lib/provas/janela-da-prova'
import {
  DESVIO_QUE_MERECE_AVISO,
  agoraEmBrasilia,
  descreverDesvio,
  lerHorarioDaResposta,
  medirDesvio,
  prazoVencido,
} from '@/lib/provas/relogio-da-prova'
import {
  aplicarInstantes,
  deveSincronizarAJanela,
} from '@/lib/provas/sincronizacao-da-janela'
import { useJanelaSincronizada } from '@/hooks/use-janela-sincronizada'
import { resolverDownloadsDaProva } from '@/lib/provas/downloads-da-prova'
import { travasDaProva } from '@/lib/provas/anti-cola'
import { exigeEntregaAutomatica, inicioBloqueadoPorProgresso } from '@/lib/provas/retomada'
import { ReacaoDoResultado } from '@/components/dom/reacao-do-resultado'
import {
  ALVO_DA_ASSINATURA,
  ALVO_DO_BOTAO_INICIAR,
  deveAvisarQueLiberou,
  estaEsperandoOInicio,
  pendenciaParaIniciar,
} from '@/lib/provas/aviso-de-inicio'
import { EscudoAntiCola, ProvedorAntiCola } from '@/components/exam/escudo-anti-cola'
import { ImagensDaQuestao } from '@/components/questoes/imagens-da-questao'
import { TextoComentado } from '@/components/provas/texto-comentado'
import type { ImagemDeQuestao, LayoutDeImagens } from '@/lib/questoes/imagens'
import { imagensDaResposta, layoutDaResposta } from '@/lib/questoes/imagens-da-questao'
import { enderecoDoTreino, pediuTreino, permiteTreinoAposTermino } from '@/lib/provas/treino-pos-termino'
import {
  INTERVALO_DE_GRAVACAO_MS,
  contarRespondidas,
  deveGravarProgresso,
  mesclarRespostas,
  type VereditoDeRetomada,
} from '@/lib/provas/retomada'

/*
 * `useSearchParams` exige uma fronteira de Suspense.
 *
 * O modo treino chega pelo endereço (`?treino=1`), e ler a query string num
 * componente cliente sem `<Suspense>` em volta faz o build do Next falhar na
 * prerenderização — é a mesma casca que /provas usa. A tela em si continua
 * sendo `ConteudoDaProva`.
 */
export default function ExamPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params)
  return (
    <Suspense fallback={<LogoLoading message="Carregando prova..." size="lg" fullscreen />}>
      <ConteudoDaProva params={params} />
    </Suspense>
  )
}

function ConteudoDaProva({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const parametrosDaUrl = useSearchParams()
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
  /**
   * O aviso modal de "a prova começou", para quem está esperando o início.
   *
   * Substituiu o toast do canto da tela, que sumia em cinco segundos e deixava
   * a pessoa com um botão fora da dobra do tablet. Ver
   * `lib/provas/aviso-de-inicio.ts`.
   */
  const [avisoDeInicioAberto, setAvisoDeInicioAberto] = useState(false)
  /** Esta pessoa chegou a esperar o início — sem isso não há novidade a anunciar. */
  const esperavaOInicioRef = useRef(false)
  /** O aviso já apareceu nesta visita: ele anuncia uma transição, não um estado. */
  const avisoDeInicioJaMostrado = useRef(false)
  const [answers, setAnswers] = useState<UserAnswer[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [submissionScore, setSubmissionScore] = useState<string>('')
  /**
   * A nota que o SERVIDOR liberou — em número, não em texto.
   *
   * `submissionScore` é uma string que às vezes é nota ("72 pontos") e às vezes
   * é recado ("As questões discursivas serão corrigidas em breve"), e o anel de
   * nota extraía o número dela com uma expressão regular. Isso funcionava por
   * sorte: um recado com data ou hora dentro ("liberada às 16:30") virava
   * percentual, e o anel desenhava uma nota que ninguém calculou.
   *
   * Agora o número tem o próprio lugar. Ele só existe quando o servidor manda
   * — e, numa prova avaliativa em andamento, ele não manda: a nota espera o
   * término, como o gabarito. Ver `lib/provas/nota-da-prova.ts`.
   */
  const [notaDaEntrega, setNotaDaEntrega] = useState<number | null>(null)
  /** O servidor segurou a nota porque a prova ainda não terminou. */
  const [notaPresaAteOTermino, setNotaPresaAteOTermino] = useState(false)
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

  /*
   * ═══ O segundo tempo da prova ═══
   *
   * `treinoLiberado` — o admin marcou "liberar para praticar" e a prova já
   * terminou. `emTreino` — a pessoa entrou por esse caminho
   * (`/exam/<id>?treino=1`).
   *
   * Em treino esta tela é uma prova de treino em tudo, com UMA diferença que
   * governa todo o resto: nada é entregue. A rodada é corrigida aqui mesmo e
   * morre aqui — não vira submissão, não muda nota, não entra no ranking, não
   * grava rascunho, não registra presença nem tentativa.
   *
   * E não depende só desta tela se comportar: numa prova encerrada há horas, o
   * servidor só aceita entrega pela camada do rascunho, onde ele descarta o
   * corpo da requisição e grava o que ELE mesmo tinha gravado durante a prova
   * (ver `lib/provas/entrega-da-prova.ts`). Como o treino não escreve rascunho,
   * o que se responde aqui não tem por onde virar nota. Ver
   * `lib/provas/treino-pos-termino.ts`.
   */
  /*
   * O "já terminou" passa pela janela, e não só pelo relógio do aparelho.
   *
   * `permiteTreinoAposTermino` compara `endTime` com o horário local, e o
   * relógio do celular pode estar adiantado — o que abriria o segundo tempo de
   * uma prova que a turma ainda está fazendo. `janela` não tem esse defeito:
   * ela chega resolvida pelo servidor em `GET /api/exams/[id]`, é reconferida
   * pela sincronização da sala de espera e, entre uma coisa e outra, é
   * recalculada com o relógio de Brasília corrigido pelo desvio medido do
   * aparelho (ver `lib/provas/relogio-da-prova.ts`).
   *
   * As duas juntas, e não uma no lugar da outra: a janela ainda não existe no
   * primeiro render, e o campo do admin (`practiceAfterEnd`) só a função sabe
   * ler.
   */
  const treinoLiberado = permiteTreinoAposTermino(exam) && (janela === null || janela.encerrada)
  const emTreino = treinoLiberado && pediuTreino(parametrosDaUrl)

  /**
   * A entrega registrada tranca esta tela?
   *
   * `alreadySubmitted` responde a "existe uma entrega desta pessoa nesta
   * prova" — um fato do banco, que continua verdadeiro no treino e é usado
   * para decidir quais PDFs ela pode baixar. Mas quase todo lugar que o lê
   * quer outra coisa: "esta pessoa não tem mais nada a fazer aqui". No treino
   * ela tem — a rodada em andamento é outra coisa, que não vira entrega.
   *
   * Sem esta distinção, quem FEZ a prova entrava no treino e recebia uma tela
   * pela metade: sem mapa de questões, sem os atalhos de teclado, e com o
   * limite de tempo que ele mesmo escolheu não valendo nada. Quem faltou à
   * prova — sem entrega registrada — recebia a tela inteira. A diferença entre
   * os dois era invisível e não tinha razão de ser.
   */
  const entregaTravaATela = alreadySubmitted && !emTreino

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
    /** As imagens da resposta comentada — ver `lib/questoes/imagens.ts`. */
    imagensDaResposta?: ImagemDeQuestao[]
    layoutDasImagensDaResposta?: LayoutDeImagens
  } | null>(null)
  const [lockedQuestions, setLockedQuestions] = useState<Set<string>>(new Set()) // Questões respondidas e bloqueadas
  const [showCheckButton, setShowCheckButton] = useState(false) // Mostrar botão "Check & Continue"
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
  const [paletaAberta, setPaletaAberta] = useState(false) // Mapa de questões (folha que abre pela barra do rodapé)
  const [menuDaProvaAberto, setMenuDaProvaAberto] = useState(false) // Menu "…" da barra de cima, no celular
  const [filtroDoGabarito, setFiltroDoGabarito] = useState<'todas' | 'erradas' | 'certas'>('todas')

  // Verificar se a prova tem proctoring habilitado
  // Provas pessoais não suportam proctoring
  /*
   * Treino pós-término não é monitorado.
   *
   * O proctoring existe para garantir a integridade de uma prova valendo nota,
   * com hora marcada. A rodada de treino não gera entrega nenhuma: pedir câmera,
   * microfone e captura de tela para ela seria cobrar o preço de uma vigilância
   * que não protege coisa alguma.
   */
  const hasProctoring =
    (exam?.proctoring?.enabled || false) && !(exam as any).isPersonalExam && !emTreino
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

  // DevTools aberto durante a prova monitorada vira alerta para o admin, pelo
  // mesmo WebSocket da troca de aba. Quem detecta é o
  // `components/protecao-contra-inspecao.tsx`, no layout; aqui só se repassa —
  // nada vai à Vercel.
  useEffect(() => {
    if (!hasProctoring || !started || submitted || !wsConnected) return
    const aoInspecionar = (evento: Event) => {
      const { aberto } = (evento as CustomEvent<DetalheDoEventoDeInspecao>).detail || { aberto: false }
      wsSendMessage({
        type: 'devtools',
        data: { aberto, examId: id, userName, userId },
      })
    }
    window.addEventListener(EVENTO_INSPECAO, aoInspecionar)
    return () => window.removeEventListener(EVENTO_INSPECAO, aoInspecionar)
  }, [hasProctoring, started, submitted, wsConnected, wsSendMessage, id, userName, userId])

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

    /*
     * Não se começa do zero por cima de um rascunho que não pode ser retomado.
     *
     * Fica aqui pela mesma razão da assinatura logo acima: é por esta função
     * que passam os dois caminhos de iniciar — o botão da tela inicial e o da
     * sala de espera — e também a volta do termo de monitoramento. Desabilitar
     * só um dos botões deixaria os outros dois abertos.
     */
    if (inicioBloqueadoPorProgresso(retomada)) {
      showToastMessage(
        retomada?.mensagem || 'Esta prova não pode ser reiniciada.',
        'info',
      )
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

  /**
   * O caderno com o gabarito e o comentário de cada alternativa.
   *
   * Ele existia em `/provas` e na tela de resultados, e não aqui — que é onde
   * chega quem tem o link da prova. O veredito é o do GABARITO (nunca o da
   * prova em branco): o arquivo revela a resposta, então espera o término e não
   * tem exceção de tempo. Ver lib/provas/downloads-da-prova.ts.
   */
  const baixarGabaritoComentado = async () => {
    if (!downloads.gabarito.permitido) {
      if (downloads.gabarito.esperandoOFim) {
        showToastMessage(downloads.gabarito.motivo || 'Ainda não liberado.', 'info')
        return
      }
      setShowPdfCta(true)
      return
    }
    const cota = await consumirCotaDoPlano('provasPdf', `${String(id)}:comentado`)
    if (!cota.permitido) {
      showToastMessage(cota.mensagem || 'Limite de downloads do seu plano atingido.', 'info')
      return
    }
    try {
      setPdfGenerating('Comentado')
      /*
       * A prova é buscada de novo, e não reaproveitada do estado.
       *
       * O documento que a tela carregou pode ter vindo sanitizado (sem
       * `isCorrect`, sem `explanation`) se ela abriu ANTES do término — e um
       * "gabarito comentado" montado a partir dele sai com todas as
       * alternativas marcadas como erradas e sem comentário nenhum: um arquivo
       * com cara de correto e conteúdo inventado. Ver sanitizar-prova.ts.
       */
      const res = await fetch(`/api/exams/${id}`)
      if (!res.ok) throw new Error('Erro ao buscar prova')
      const dados = await res.json()
      const { generateExamWithAnswersPDF, downloadPDF } = await import('@/lib/pdf-generator')
      const blob = await generateExamWithAnswersPDF(dados.exam)
      downloadPDF(blob, `gabarito-comentado-${dados.exam.title}.pdf`, {
        type: 'exam_answers_pdf',
        resourceId: String(id),
        resourceTitle: dados.exam.title,
      })
    } catch (error: any) {
      showToastMessage('Erro ao gerar o PDF: ' + error.message)
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
    /*
     * A rodada de treino não é uma tentativa.
     *
     * O painel de /admin/stats conta quem abriu, quem começou e quem sumiu no
     * meio DESTA aplicação. Uma pessoa treinando três dias depois entraria ali
     * como se a prova ainda estivesse acontecendo — e "12 alunos em andamento"
     * numa prova encerrada é um número que não descreve nada.
     */
    if (emTreino) return null
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
   * ═══ O relógio que vale é o de Brasília ═══
   *
   * Tudo o que esta tela decide sobre TEMPO — a fase da janela, a contagem
   * regressiva, o fim da prova — era decidido com `Date.now()`, o relógio do
   * aparelho de quem responde. E esse é o único relógio desta prova que
   * ninguém conferiu: o celular com a hora manual, o notebook que voltou do
   * sono, o aparelho que ressincroniza com a operadora no meio da tarde e pula
   * para a frente.
   *
   * Enquanto o preço era um número torto na tela, dava para conviver. O preço
   * era outro: o cronômetro encerrava a prova. Um aparelho adiantado tirava
   * tempo de prova de uma pessoa só, sem nada ter acontecido na sala — a prova
   * "acabava do nada" no meio de uma questão.
   *
   * A prova é marcada em horário de Brasília — é nesse fuso que o admin digita
   * início, término e portões —, então é com ele que a contagem tem de
   * concordar. A hora certa vem do cabeçalho `Date` das respostas que esta tela
   * JÁ busca (a prova, ao abrir; o rascunho, de 12 em 12 segundos): nenhuma
   * rota nova, nenhuma invocação a mais na conta. A tela guarda só a diferença,
   * e o relógio local continua andando sozinho a partir da origem certa. Ver
   * `lib/provas/relogio-da-prova.ts`.
   */
  const desvioDoRelogioRef = useRef<number | null>(null)
  const [desvioDoRelogio, setDesvioDoRelogio] = useState<number | null>(null)
  /** O aviso do desvio aparece uma vez, não a cada gravação de rascunho. */
  const desvioAvisadoRef = useRef(false)

  const anotarHorarioDeBrasilia = useCallback(
    (pedidoEm: number, respondidoEm: number, cabecalhos: Headers | null | undefined) => {
      const desvio = medirDesvio({
        pedidoEm,
        respondidoEm,
        referenciaEm: lerHorarioDaResposta(cabecalhos),
      })
      if (desvio === null) return
      desvioDoRelogioRef.current = desvio
      // O estado só muda quando a correção muda de verdade. O desvio é remedido
      // a cada gravação de rascunho: trocar o estado por causa de meio segundo
      // de variação de rede seria um render a mais por gravação, sem nada de
      // novo na tela.
      setDesvioDoRelogio((anterior) =>
        anterior === null || Math.abs(anterior - desvio) > 1000 ? desvio : anterior,
      )
    },
    [],
  )

  /** `Date.now()` corrigido — o horário de Brasília, aqui dentro. */
  const relogioDaProva = useCallback(() => agoraEmBrasilia(desvioDoRelogioRef.current), [])

  /*
   * O desvio dito em voz alta.
   *
   * Só quando ele é grande o bastante para APARECER: com o relógio do aparelho
   * um minuto à frente, o cronômetro da prova discorda visivelmente do relógio
   * do celular, e um cronômetro que "anda errado" no meio de uma prova vira "o
   * site travou" contado ao professor depois. Corrigir três segundos, ninguém
   * precisa saber.
   */
  useEffect(() => {
    if (!started || desvioAvisadoRef.current) return
    const aviso = descreverDesvio(desvioDoRelogio, DESVIO_QUE_MERECE_AVISO)
    if (!aviso) return
    desvioAvisadoRef.current = true
    showToastMessage(aviso, 'info')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desvioDoRelogio, started])

  /*
   * ═══ O prazo desta pessoa, e o que acontece quando ele acaba ═══
   *
   * ## Onde o prazo mora
   *
   * Provas de treino e pessoais nascem com `endTime` um ano à frente, só para
   * liberar o acesso. Usar essa data como prazo fazia o cabeçalho exibir uma
   * contagem sem sentido ("17:13:38 restante") mesmo para quem escolheu "Sem
   * limite". O cronômetro só existe quando existe prazo de verdade: o limite
   * escolhido no treino ou o fim de uma prova agendada.
   *
   * `prazoDeEntrega` é o menor entre o fim da prova e a duração individual
   * (`duration`, em minutos). Uma prova de 90 minutos dentro de uma janela de 3
   * horas mostrava a contagem da janela — o aluno via 3 horas sobrando e o
   * tempo dele acabava antes.
   *
   * Ele é calculado aqui em cima, com os outros ganchos, porque quem vigia o
   * fim do tempo é um `useEffect` — e efeito não pode nascer depois dos
   * `return` que a tela faz mais abaixo.
   */
  const isSelfPacedExam = Boolean(exam?.isPracticeExam || (exam as any)?.isPersonalExam || emTreino)
  const examDeadline: Date | null = !exam
    ? null
    : practiceTimeLimitMs && examStartTime
      ? new Date(examStartTime.getTime() + practiceTimeLimitMs)
      : isSelfPacedExam
        ? null
        : prazoDeEntrega(exam, examStartTime)

  /*
   * O fim do tempo — uma vigília só, e uma entrega.
   *
   * ## O que estava quebrado
   *
   * Quem avisava que o tempo tinha acabado era o próprio cronômetro do
   * cabeçalho, por `onTimeUp`. Dois problemas moravam aí:
   *
   *  1. **O cronômetro aparece duas vezes** — a versão do desktop e a do
   *     celular, uma escondida por CSS mas as duas montadas —, e o aviso não
   *     parava no zero. Eram duas entregas por segundo, para sempre.
   *  2. **Numa prova agendada, o aviso não entregava nada.** Mostrava um toast
   *     e mandava a pessoa para a home dois segundos depois. As respostas
   *     ficavam só no rascunho, que não é nota; e como a rota de entrega recusa
   *     tudo depois do término, não havia mais como transformá-las em prova
   *     entregue. Chegar ao fim do tempo era perder a prova inteira — e para
   *     quem estava lendo uma questão, ela simplesmente "acabou do nada".
   *
   * Agora quem vigia é a tela, com o relógio do servidor, e o fim do tempo faz
   * o que qualquer sala de prova faz quando o sinal toca: recolhe a folha.
   */
  const entregaPorTempoRef = useRef(false)
  const tentativasPorTempoRef = useRef(0)
  /*
   * O servidor recusou a gravação do rascunho porque a prova fechou.
   *
   * O prazo desta tela é o melhor palpite que ela tem, mas ele foi calculado
   * com a prova de quando a página abriu. Um admin que encerra a aplicação no
   * meio (`force-time`) fecha a prova para o servidor e para mais ninguém: a
   * pessoa seguia respondendo uma prova que já não seria aceita, e descobria
   * isso no clique de entregar — quando não havia mais o que fazer. A gravação
   * do rascunho bate de 12 em 12 segundos e a recusa dela é o aviso.
   */
  const [encerradaPeloServidor, setEncerradaPeloServidor] = useState(false)

  // O prazo entra na vigília como número: `examDeadline` é um `Date` recriado a
  // cada render, e comparar objetos remontaria o efeito de segundo em segundo.
  const prazoEmMs = examDeadline ? examDeadline.getTime() : null

  useEffect(() => {
    if (!started || submitted || entregaTravaATela || submitting) return
    if (!examDeadline) return

    const conferir = () => {
      if (entregaPorTempoRef.current) return
      if (!encerradaPeloServidor && !prazoVencido(examDeadline, relogioDaProva())) return
      entregaPorTempoRef.current = true
      void encerrarPorTempoEsgotado()
    }

    conferir()
    const relogio = setInterval(conferir, 1000)
    return () => clearInterval(relogio)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    started,
    submitted,
    entregaTravaATela,
    submitting,
    encerradaPeloServidor,
    prazoEmMs,
    relogioDaProva,
  ])

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

  /**
   * A questão em que a pessoa está — no modo de ROLAGEM.
   *
   * ## O ponto cego
   *
   * `currentQuestionIndex` é o estado da navegação PAGINADA: ele avança quando
   * a pessoa clica em "Próxima". No modo de rolagem não há esse clique — todas
   * as questões estão na mesma página —, e o índice fica parado no 0 do começo
   * ao fim. Quem só o lê conclui que a turma inteira passou três horas na
   * questão 1: era o que o rascunho gravava, e por consequência o que o painel
   * de acompanhamento do admin mostraria.
   *
   * Aqui a posição vem da tela: a questão cujo topo está mais perto do alto da
   * janela é a que a pessoa está lendo. A conta roda junto da gravação do
   * rascunho (uma vez a cada 12 segundos), e não a cada evento de rolagem —
   * medir a página a 60 quadros por segundo para gravar um número duas vezes
   * por minuto seria pagar caro por precisão que ninguém usa.
   *
   * Devolve `null` fora do modo de rolagem, e aí quem manda é o índice da
   * navegação paginada, que ali está certo.
   */
  const questaoNoAltoDaTela = useCallback((): number | null => {
    const prova = examRef.current
    if (!prova || prova.navigationMode !== 'scroll') return null
    if (typeof document === 'undefined') return null

    const questoes = prova.questions || []
    // A âncora não é o topo absoluto: o cabeçalho fixo cobre a primeira faixa
    // da tela, e uma questão encostada nele já está fora de leitura.
    const ANCORA = 140
    let escolhida: number | null = null
    let menorDistancia = Number.POSITIVE_INFINITY

    for (let i = 0; i < questoes.length; i++) {
      const elemento = document.getElementById(`question-${questoes[i].id}`)
      if (!elemento) continue
      const { top, bottom } = elemento.getBoundingClientRect()
      // Só quem está de fato na tela concorre.
      if (bottom < 0 || top > window.innerHeight) continue
      const distancia = Math.abs(top - ANCORA)
      if (distancia < menorDistancia) {
        menorDistancia = distancia
        escolhida = i
      }
    }

    return escolhida
  }, [])

  const montarRascunho = useCallback(() => ({
    answers: answersRef.current,
    currentQuestionIndex: questaoNoAltoDaTela() ?? currentQuestionRef.current,
    questionOrder: ordemDasQuestoesRef.current,
    userName: userNameRef.current,
    themeTranscription: themeTranscriptionRef.current,
    signature: assinaturaRef.current || undefined,
    startedAt: (examStartTimeRef.current || new Date()).toISOString(),
  }), [questaoNoAltoDaTela])

  /*
   * O último rascunho que o servidor confirmou ter recebido, serializado.
   *
   * É o que permite saber que não há nada novo para gravar. Só é atualizado
   * depois de uma resposta OK: gravação que falhou não conta como salva, e a
   * seguinte tem de tentar de novo com o mesmo conteúdo.
   */
  const ultimoRascunhoGravadoRef = useRef<string | null>(null)

  const gravarProgresso = useCallback(
    async (forcar = false) => {
      if (!id || gravandoRef.current) return

      const corpo = JSON.stringify(montarRascunho())

      // Ver `deveGravarProgresso`: forçada passa sempre; rascunho igual ao
      // último confirmado espera o batimento em vez de reenviar os mesmos bytes.
      if (
        !deveGravarProgresso({
          forcar,
          agora: Date.now(),
          ultimaGravacaoEm: ultimaGravacaoRef.current,
          rascunhoAtual: corpo,
          ultimoRascunhoGravado: ultimoRascunhoGravadoRef.current,
        })
      ) {
        return
      }

      gravandoRef.current = true
      ultimaGravacaoRef.current = Date.now()
      setSalvandoProgresso('salvando')
      try {
        const pedidoEm = Date.now()
        const res = await fetch(`/api/exams/${id}/progress`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: corpo,
        })
        const respondidoEm = Date.now()
        setSalvandoProgresso(res.ok ? 'salvo' : 'erro')
        // Só o que o servidor aceitou conta como gravado. Uma falha mantém o
        // valor anterior, e a próxima volta reenvia este mesmo conteúdo.
        if (res.ok) ultimoRascunhoGravadoRef.current = corpo
        /*
         * A gravação do rascunho é também a batida do relógio.
         *
         * Ela já acontece de 12 em 12 segundos enquanto a prova corre, e o
         * carimbo de hora vem no cabeçalho da própria resposta — de graça.
         * Reconferir aqui é o que protege do aparelho cujo relógio muda no meio
         * da prova: a correção chega na gravação seguinte, não no fim.
         */
        anotarHorarioDeBrasilia(pedidoEm, respondidoEm, res.headers)
        if (res.status === 409) {
          // Só 'encerrada' aciona a entrega: 'ja-entregue' é o fim normal (a
          // tela já está mostrando o resultado) e 'fora-da-janela' antes do
          // início não é caso de entregar nada.
          const dados = await res.json().catch(() => null)
          if (dados?.motivo === 'encerrada') setEncerradaPeloServidor(true)
        }
      } catch {
        // Queda de rede é exatamente o cenário desta funcionalidade: o
        // indicador avisa, e a próxima gravação tenta de novo sozinha.
        setSalvandoProgresso('erro')
      } finally {
        gravandoRef.current = false
      }
    },
    [id, montarRascunho, anotarHorarioDeBrasilia],
  )

  // Prova em andamento: grava periodicamente e sempre que a aba some.
  useEffect(() => {
    if (!started || submitted || alreadySubmitted) return
    // Treino pós-término não tem rascunho a salvar: não há entrega para
    // proteger de uma queda, e a rota de progresso recusa a prova encerrada.
    if (exam?.isPracticeExam || (exam as any)?.isPersonalExam || emTreino) return

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
  }, [started, submitted, alreadySubmitted, exam, emTreino, gravarProgresso])

  /*
   * ═══ A folha de presença da sala de espera ═══
   *
   * Nome e assinatura são preenchidos ANTES de a prova começar — é o que a sala
   * de espera pede enquanto a contagem regressiva corre. Mas o único lugar onde
   * eles eram gravados era o rascunho logo acima, que só roda depois do início
   * (e cuja rota recusa qualquer envio com a janela fechada, de propósito).
   *
   * Consequência: quem assinava às 13h20 continuava "sem assinatura" para o
   * servidor até as 14h. O painel de acompanhamento do admin — que existe
   * justamente para conferir a presença ENQUANTO a sala enche — não tinha o que
   * mostrar, e uma queda de energia antes do início levava a assinatura junto,
   * porque ela vivia só no estado do React.
   *
   * Aqui ela vai para o registro de entrada (`PATCH /api/exams/[id]/entrada`),
   * que já é o fato "esta pessoa está na sala".
   *
   * ## Uma requisição por gesto, não por segundo
   *
   * `janela` é recalculada a cada segundo (o efeito acima), então nada aqui
   * pode depender do objeto dela: as dependências são booleanos, e a
   * "impressão digital" da folha impede reenviar o que o servidor já tem. Uma
   * pessoa na sala de espera gera duas ou três chamadas no total — digitou o
   * nome, assinou —, e não uma a cada segundo de espera.
   */
  const folhaEnviadaRef = useRef<string | null>(null)
  const podeRegistrarPresenca =
    !emTreino &&
    !!janela && janela.fase !== 'livre' && !janela.encerrada && (janela.podeEntrar || janela.jaEntrou)

  useEffect(() => {
    if (!id || !podeRegistrarPresenca) return
    if (started || submitted || alreadySubmitted) return

    const nome = userName.trim()
    const transcricao = themeTranscription.trim()
    const assinatura = signature || ''
    if (!nome && !transcricao && !assinatura) return

    // O tamanho e o fim da assinatura bastam para saber que ela mudou — guardar
    // os 400 KB inteiros num ref só para comparar seria pagar duas vezes.
    const impressao = `${nome}|${transcricao}|${assinatura.length}:${assinatura.slice(-48)}`
    if (impressao === folhaEnviadaRef.current) return

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/exams/${id}/entrada`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, transcricao, assinatura }),
        })
        if (res.ok) folhaEnviadaRef.current = impressao
      } catch {
        // Sem alarme: a folha é uma conveniência para o painel do admin, e a
        // próxima mudança no campo tenta de novo. A assinatura que vale para
        // iniciar a prova continua sendo conferida na tela.
      }
    }, 2500)

    return () => clearTimeout(timer)
  }, [
    id,
    podeRegistrarPresenca,
    started,
    submitted,
    alreadySubmitted,
    userName,
    themeTranscription,
    signature,
  ])

  /** Busca o rascunho ao abrir a prova, para oferecer "continuar". */
  const carregarRetomada = useCallback(async () => {
    try {
      const pedidoEm = Date.now()
      const res = await fetch(`/api/exams/${id}/progress`)
      const respondidoEm = Date.now()
      anotarHorarioDeBrasilia(pedidoEm, respondidoEm, res.headers)
      if (!res.ok) return
      const dados = await res.json()
      setRetomada(dados.veredito || null)
      setProgressoSalvo(dados.progresso || null)
    } catch {
      // Sem rascunho a prova começa do zero — que é o comportamento antigo.
    }
  }, [id, anotarHorarioDeBrasilia])

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
      if (res.ok) avisarXp('prova')
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

  /*
   * A entrega que acontece sozinha.
   *
   * Sem retomada e com respostas gravadas, a pessoa fica num limbo: não pode
   * continuar respondendo, e o que ela já fez só vira nota se ela clicar num
   * botão. Quem caiu duas vezes é justamente quem pode não voltar para clicar
   * — e o rascunho ficava esperando um gesto que talvez nunca acontecesse.
   *
   * O `useRef` é o que impede a segunda tentativa: o veredito continua sendo
   * `retomadas-esgotadas` até a resposta do servidor chegar, e sem a trava
   * este efeito dispararia uma entrega a cada redesenho.
   */
  const entregaAutomaticaDisparada = useRef(false)
  useEffect(() => {
    if (!retomada || !progressoSalvo) return
    if (alreadySubmitted || submitted || submitting) return
    /*
     * E nunca a partir do treino.
     *
     * Aqui `started` ainda é falso enquanto a pessoa escolhe as opções da
     * rodada, então esta guarda não é redundante com a de baixo: abrir
     * `?treino=1` numa prova onde sobrou um rascunho sem retomadas dispararia
     * uma ENTREGA DE VERDADE do que estava gravado, no meio de uma tela que
     * promete não entregar nada. O rascunho da prova aplicada não é assunto do
     * segundo tempo.
     */
    if (emTreino) return
    /*
     * Nunca por cima de uma prova em andamento.
     *
     * O veredito é buscado uma vez, ao abrir a tela, e chega quando a rede
     * deixa. Numa conexão ruim ele pode chegar DEPOIS de a pessoa já ter
     * começado a responder — e aí esta entrega automática entregava o rascunho
     * velho e encerrava, com o modal de "Você finalizou essa prova", a prova de
     * alguém que estava lendo uma questão. O começo já é barrado antes, por
     * `inicioBloqueadoPorProgresso`; se mesmo assim a prova está em andamento,
     * quem manda é ela, e o rascunho espera a entrega normal.
     */
    if (started) return
    if (!exigeEntregaAutomatica(retomada)) return
    if (entregaAutomaticaDisparada.current) return

    entregaAutomaticaDisparada.current = true
    showToastMessage('Você não tem mais retomadas. Entregando o que ficou gravado…', 'info')
    entregarRascunho()
  }, [retomada, progressoSalvo, alreadySubmitted, submitted, submitting, started, emTreino])

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
      // `relogioDaProva()`, e não `new Date()`: com o relógio do aparelho
      // adiantado, esta conta declarava a prova encerrada — e trancava a tela
      // — para quem ainda tinha tempo pelo relógio do servidor.
      const atual = resolverJanelaDaProva(exam, new Date(relogioDaProva()), { jaEntrou })
      setJanela(atual)
      setCanStart(atual.podeIniciar)
    }

    recalcular()
    const interval = setInterval(recalcular, 1000)
    return () => clearInterval(interval)
  }, [exam, jaEntrou, relogioDaProva])

  /*
   * O relógio da prova pode mudar POR FORA, enquanto a pessoa espera.
   *
   * O efeito acima recalcula a janela a cada segundo — mas sempre a partir do
   * mesmo documento, o que `loadExam` buscou uma vez ao abrir a tela. Ele
   * acerta a passagem do tempo e não tem como saber de uma coisa: o botão
   * "Forçar Início" de `/admin/exams`, que grava `startTime` e `gatesOpen`
   * como AGORA (`app/api/exams/[id]/force-time/route.ts`). O admin clicava, o
   * banco mudava, e a sala de espera seguia contando para o horário antigo até
   * alguém dar F5 — numa tela cuja única razão de existir é a pessoa não
   * precisar ficar conferindo.
   *
   * Então a tela pergunta ao servidor, de tempos em tempos, só pelos quatro
   * instantes da janela. Corrigido o documento, o resto acontece pelos
   * caminhos que já existiam: a janela é recalculada, o botão destrava e o
   * aviso de início abre para quem estava esperando.
   *
   * Quem já está respondendo não pergunta nada aqui (ver
   * `deveSincronizarAJanela`), e não porque o término não lhe diga respeito:
   * ele tem um aviso melhor e mais barato. A gravação do rascunho bate de 12
   * em 12 segundos e a recusa dela conta que a prova fechou
   * (`encerradaPeloServidor`, mais acima) — sem nenhuma requisição a mais numa
   * fase que dura horas. É de lá que a entrega do término sai.
   */
  useJanelaSincronizada({
    provaId: id,
    prova: exam,
    fase: janela?.fase,
    ativo: deveSincronizarAJanela({
      prova: exam,
      // O treino não espera horário nenhum: a prova dele já acabou, e ficar
      // perguntando os instantes da janela é conversa sobre uma sala vazia.
      emAndamento: started || emTreino,
      jaEntregou: alreadySubmitted || submitted,
    }),
    // O carimbo de hora desta resposta acerta o relógio de quem está esperando —
    // durante a espera, nenhuma outra requisição está acontecendo para medi-lo.
    aoResponder: anotarHorarioDeBrasilia,
    aoMudar: (instantes, dados) => {
      setExam(atual => (atual ? { ...atual, ...aplicarInstantes(instantes) } : atual))
      // A janela do servidor entra na hora, sem esperar a próxima volta do
      // relógio de 1 s: quem está com o dedo no botão esperando o início não
      // deve nem esse segundo.
      setJanela(dados.janela)
      setCanStart(dados.janela.podeIniciar)

      /*
       * Forçar o início ABRE o portão junto (`gatesOpen = agora`). Quem estava
       * na tela de portão fechado nunca chegou a passar por ele — e sem o
       * registro de entrada, fechar o portão de novo mais tarde a deixaria de
       * fora. Passa agora, pelo mesmo caminho de `loadExam`, e em silêncio: a
       * fase da janela já conta na tela o que acontecer aqui.
       */
      if (dados.jaEntrou) {
        setJaEntrou(true)
      } else if (dados.janela.podeEntrar) {
        fetch(`/api/exams/${id}/entrada`, { method: 'POST' })
          .then(res => (res.ok ? res.json() : null))
          .then(entrada => {
            if (entrada?.dentro) {
              setJaEntrou(true)
              if (entrada.janela) setJanela(entrada.janela)
            }
          })
          .catch(() => {})
      }
    },
  })

  /*
   * O anúncio do início, para quem estava esperando por ele.
   *
   * A sala de espera avisava com um toast no canto superior direito, por cinco
   * segundos. Quem espera vinte minutos olha a contagem regressiva, não o canto
   * da tela — e o que restava depois era um botão verde no fim de uma página
   * alta: num tablet em retrato, abaixo do painel de portões e da assinatura,
   * "Iniciar Prova Agora" fica fora da dobra. A pessoa tinha de rolar para
   * descobrir uma coisa que ninguém tinha contado a ela.
   *
   * O gatilho é a TRANSIÇÃO de esperando para liberado, e é por isso que o
   * `esperavaOInicioRef` existe: quem abre a página com a prova já em andamento
   * não recebe modal nenhum — para essa pessoa nada mudou.
   */
  useEffect(() => {
    if (!exam) return

    if (
      estaEsperandoOInicio({
        naSalaDeEspera: inWaitingRoom,
        fase: janela?.fase,
        liberada: canStart,
      })
    ) {
      esperavaOInicioRef.current = true
      return
    }

    if (
      deveAvisarQueLiberou({
        estavaEsperando: esperavaOInicioRef.current,
        liberada: canStart,
        emAndamento: started,
        jaEntregou: alreadySubmitted || submitted,
        jaAvisado: avisoDeInicioJaMostrado.current,
      })
    ) {
      avisoDeInicioJaMostrado.current = true
      setAvisoDeInicioAberto(true)
    }
  }, [exam, canStart, inWaitingRoom, janela?.fase, started, alreadySubmitted, submitted])

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
      const pedidoEm = Date.now()
      const res = await fetch(`/api/exams/${id}`)
      const respondidoEm = Date.now()
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      // A primeira medida do horário de Brasília: é ela que vale enquanto a
      // prova não começa a gravar rascunho.
      anotarHorarioDeBrasilia(pedidoEm, respondidoEm, res.headers)

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
       * A entrega já vem com a prova.
       *
       * `alreadySubmitted` dependia só de `checkExistingSubmission`, que faz
       * três requisições em cadeia (`/auth/me`, a prova de novo, e enfim
       * `check-submission`) e devolve em silêncio se qualquer uma falhar. Até
       * ela terminar — ou se ela falhasse — o aluno que já entregou via o
       * formulário de assinatura, com o botão de iniciar a prova que ele
       * acabou de fazer.
       *
       * Aqui o dado chega na MESMA resposta que traz a prova, então a tela
       * sabe disso no primeiro render. A prova de treino continua de fora: ela
       * é feita quantas vezes a pessoa quiser.
       */
      if (data.jaSubmeteu && !examData?.isPracticeExam) setAlreadySubmitted(true)

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
        /*
         * O id também sai daqui, e não só de `checkExistingSubmission`.
         *
         * A tela de "você já finalizou" é montada assim que a prova chega
         * (`jaSubmeteu` vem junto com ela), e o botão "ver meu resumo" precisa
         * do id para montar o endereço. Ele só existia depois da cadeia de três
         * requisições da outra função — então o botão nascia apontando para
         * `/exam/<id>/user/`, um endereço sem dono.
         */
        if (data.user.id) setUserId((atual) => atual || data.user.id)
        // Se allowCustomName for false, usar nome do usuário automaticamente
        // será feito no useEffect abaixo quando exam estiver carregado
      }
    } catch (error) {
      // Silently fail - user can still enter name manually
    }
  }

  /*
   * Setar nome automaticamente se allowCustomName for false.
   *
   * `emTreino` entra na exceção: numa prova com nome livre, o campo mora na
   * tela de entrada — a que o treino pula. Sem o nome preenchido, `handleSubmit`
   * recusava a rodada com "preencha seu nome completo", apontando para um campo
   * que não está em lugar nenhum. No treino ninguém assina nada, então o nome
   * da conta serve.
   *
   * A prova de treino (e a pessoal) cai no mesmo buraco: ela abre na tela de
   * configuração do treino, que também não tem campo de nome.
   */
  useEffect(() => {
    const semCampoDeNome = emTreino || !!exam?.isPracticeExam || !!(exam as any)?.isPersonalExam
    if (exam && loggedUserName && (!exam.allowCustomName || semCampoDeNome) && !userName) {
      setUserName(loggedUserName)
    }
  }, [exam, emTreino, loggedUserName, userName])

  // Atalhos de teclado durante a prova (1-5 selecionar, ←/→ navegar)
  useEffect(() => {
    if (!started || submitted || entregaTravaATela) return
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
  }, [started, submitted, entregaTravaATela, exam, currentQuestionIndex, showFeedbackModal, showUnansweredModal, showExitConfirm, reportQuestionId, lockedQuestions])

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
    if (exam && (exam.isPracticeExam || emTreino) && !started && !loading && !showPracticeConfig) {
      setShowPracticeConfig(true)
    }
  }, [exam, emTreino, started, loading])

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
  /*
   * Efeito de LAYOUT, não o comum: ele corre depois de o React trocar a
   * questão no DOM e ANTES de o navegador pintar. Com o `useEffect` normal a
   * pintura vem primeiro, então existe uma janela — medi de 66ms num aparelho
   * folgado a mais de 300ms num carregado — em que a questão nova já está na
   * tela com a rolagem ANTIGA. É exatamente o sintoma relatado: a pessoa vê a
   * questão seguinte começando pelas alternativas, e só depois a tela sobe.
   * Quanto mais lento o aparelho, mais tempo esse quadro errado fica de pé.
   */
  useIsomorphicLayoutEffect(() => {
    if (!started || submitted || !isPaginatedMode) return
    if (typeof window === 'undefined') return
    // O body vira `position: fixed` quando a sidebar mobile está aberta —
    // mexer no scroll ali só bagunçaria a posição restaurada depois.
    if (document.body.style.position === 'fixed') return

    const topoDaQuestao = () => {
      const card = questionCardRef.current
      if (!card) return 0
      // O header é sticky: descontar a altura dele para o título da questão
      // não nascer escondido atrás da barra.
      const headerHeight = document.querySelector('header')?.getBoundingClientRect().height ?? 0
      return window.scrollY + card.getBoundingClientRect().top - headerHeight - 12
    }

    // Segurar por alguns quadros, em vez de um `scrollTo` só. Duas coisas
    // desfaziam a rolagem única, as duas no caminho do feedback imediato:
    //
    // 1. A questão nova nasce menor do que vai ficar (a imagem ainda está
    //    baixando, o texto rico só rende no quadro seguinte) e o navegador
    //    reajusta o scroll sozinho enquanto ela cresce.
    // 2. No celular, rolar dentro do modal de feedback arrasta a página de
    //    trás junto quando o conteúdo do modal acaba; a inércia desse gesto
    //    continua depois do toque e engolia a rolagem com `behavior: smooth`,
    //    deixando a pessoa parada nas alternativas da questão seguinte.
    //
    // O alvo é remedido a cada quadro, e só um gesto de ROLAGEM cancela — um
    // toque solto na tela logo depois de trocar de questão não desarma nada.
    return holdScrollAt(topoDaQuestao, 600)
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
    if (exam?.feedbackMode === 'immediate' && ((exam as any).isPersonalExam || exam.isPracticeExam || emTreino)) {
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
        commentedFeedback: (currentQuestion as any).commentedFeedback,
        imagensDaResposta: imagensDaResposta(currentQuestion),
        layoutDasImagensDaResposta: layoutDaResposta(currentQuestion),
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

  /**
   * Fecha a rodada de treino sem sair da tela e sem tocar no servidor.
   *
   * A tela de conclusão calcula a nota das objetivas a partir de `answers` e do
   * gabarito que já veio com a prova encerrada (ver `sanitizarProvaParaAluno`:
   * depois do término o gabarito é público). Não há entrega a criar, então não
   * há `submissionId`, nota gravada nem tentativa a fechar — e é justamente
   * essa ausência que mantém os resultados da aplicação intactos.
   */
  function encerrarRodadaDeTreino() {
    localStorage.removeItem(`exam-${id}-start-time`)
    cleanup()
    setSubmitted(true)
  }

  /**
   * A entrega que a própria tela faz — sem clique, sem validação de formulário.
   *
   * Dois caminhos chegam aqui: a infração de monitoramento (câmera tapada) e o
   * fim do tempo. Devolve `true` quando o servidor aceitou; `false` quando não
   * deu (rede caiu, prova recusada), e aí quem chamou decide se tenta de novo —
   * a tela continua sendo a da prova, com as respostas na mão do aluno.
   *
   * `forcedSubmit` marca INFRAÇÃO no registro (ver lib/types.ts), então só a
   * câmera o liga: acabar o tempo é o fim normal de uma prova, não uma falta.
   */
  async function handleAutoSubmit(reason: string, motivo: 'infracao' | 'tempo' = 'infracao'): Promise<boolean> {
    if (submitting || submitted || alreadySubmitted) return false

    setSubmitting(true)

    try {
      const endTime = new Date()
      const duration = examStartTime ? calculateDuration(examStartTime, endTime) : ''
      setExamDuration(duration)

      /*
       * A rodada de treino nem chega ao servidor — ver `═══ O segundo tempo ═══`.
       *
       * `true` porque, do ponto de vista de quem chamou, a entrega ACONTECEU:
       * a rodada fechou e a tela de resultado está na frente. Devolver `false`
       * faria a entrega automática do fim do tempo tentar de novo, em laço,
       * numa prova que não tem para onde entregar.
       */
      if (emTreino) {
        encerrarRodadaDeTreino()
        return true
      }

      const res = await fetch(`/api/exams/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // A rota recusa entrega sem nome (400). Num clique isso é uma
          // validação de formulário; numa entrega automática seria a prova
          // inteira perdida por um campo em branco — daí o nome da conta como
          // último recurso, igual ao que a entrega do rascunho já faz.
          userName: userName?.trim() || loggedUserName || 'Aluno',
          themeTranscription,
          answers,
          signature,
          startedAt: examStartTime?.toISOString(),
          // A ordem em que ESTE aluno viu as questões: sem ela o relatório
          // numera pela ordem do banco, e a "questão 7" da reclamação não é a
          // mesma que o admin abre. Ver lib/provas/embaralhar.ts.
          questionOrder: ordemDasQuestoes,
          forcedSubmit: motivo === 'infracao',
          forcedSubmitReason: reason,
        }),
      })
      if (res.ok) avisarXp('prova')

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
      setNotaDaEntrega(typeof data.score === 'number' ? data.score : null)
      setNotaPresaAteOTermino(data.notaPresaAteOTermino === true)

      // Salvar ID da submissão
      if (data.submissionId) {
        setExistingSubmissionId(data.submissionId)
      }

      // Limpar proctoring
      cleanup()

      setSubmitted(true)
      return true
    } catch (error: any) {
      console.error('Erro ao auto-submeter:', error)
      showToastMessage('Erro ao submeter prova automaticamente: ' + error.message)
      return false
    } finally {
      setSubmitting(false)
    }
  }

  /**
   * O sinal tocou.
   *
   * Prova de treino continua como sempre foi: o limite é uma escolha de quem
   * está treinando, e a entrega passa pelo caminho normal.
   *
   * Prova agendada é a que mudou. Antes disto ela mandava a pessoa para a home
   * de mãos vazias; agora a folha é recolhida — as mesmas respostas, pela mesma
   * rota, com a mesma conferência do servidor. O que muda é quem toma a
   * iniciativa, exatamente como na entrega automática do rascunho.
   *
   * ## Quando a entrega não passa
   *
   * A tela NÃO é trocada e nada é apagado: a prova continua na frente da
   * pessoa, com o botão de entregar onde sempre esteve. Tentamos de novo a cada
   * 15 segundos, dentro da folga que o servidor dá para a entrega do último
   * minuto (`TOLERANCIA_DE_ENTREGA_MS`). Esgotadas as tentativas, o aviso diz o
   * que fazer — e diz a verdade: as respostas ainda estão ali.
   */
  async function encerrarPorTempoEsgotado() {
    /*
     * Treino — o de sempre e o de prova encerrada — fecha a rodada e mostra o
     * resultado. Sem `emTreino` aqui, o limite de tempo que a própria pessoa
     * escolheu caía no caminho da prova avaliativa e anunciava "Entregando
     * suas respostas…" numa rodada que, por definição, não entrega nada.
     */
    if (exam?.isPracticeExam || emTreino) {
      showToastMessage('Tempo esgotado! Finalizando prova...', 'info')
      handleSubmit()
      return
    }

    const encerradaPorFora = encerradaPeloServidor
    showToastMessage(
      encerradaPorFora
        ? 'A prova foi encerrada. Entregando suas respostas…'
        : 'O tempo da prova acabou. Entregando suas respostas…',
      'info',
    )
    const entregue = await handleAutoSubmit(
      encerradaPorFora ? 'Prova encerrada durante a resolução' : 'Tempo esgotado',
      'tempo',
    )
    if (entregue) return

    tentativasPorTempoRef.current += 1
    if (tentativasPorTempoRef.current >= 5) {
      showToastMessage(
        'Não conseguimos entregar automaticamente. Suas respostas continuam nesta tela — toque em "Finalizar Prova" para tentar de novo.',
        'error',
      )
      return
    }

    setTimeout(() => {
      entregaPorTempoRef.current = false
    }, 15_000)
  }

  async function handleSubmit() {
    // Validações
    if (!userName.trim()) {
      showToastMessage('Por favor, preencha seu nome completo', 'info')
      return
    }

    /*
     * A frase-tema é a folha de presença da prova aplicada — ela existe para
     * identificar a letra de quem entregou. No treino não há entrega a
     * identificar, e a tela de configuração do treino nem mostra o campo:
     * exigi-la aqui travaria a rodada num campo que a pessoa não tem como
     * preencher.
     */
    if (exam?.themePhrase && !themeTranscription.trim() && !emTreino) {
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

      // A rodada de treino nem chega ao servidor — ver `═══ O segundo tempo ═══`.
      if (emTreino) {
        encerrarRodadaDeTreino()
        return
      }

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
      if (res.ok) avisarXp('prova')

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
      setNotaDaEntrega(typeof data.score === 'number' ? data.score : null)
      setNotaPresaAteOTermino(data.notaPresaAteOTermino === true)

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
      <FundoIos className="flex min-h-[100dvh] flex-1 items-center justify-center p-6">
        <div className="max-w-sm space-y-4 text-center">
          <p className="ios-titulo-produto">Prova não encontrada</p>
          <p className="text-[15px] ios-rotulo-2">
            O link pode estar incompleto, ou a prova foi removida. Confira com quem enviou.
          </p>
          <button type="button" className="ios-botao" onClick={() => router.push('/')}>
            Voltar para o início
          </button>
        </div>
      </FundoIos>
    )
  }


  // Tela de configuração para provas práticas
  if (showPracticeConfig && exam && (exam.isPracticeExam || emTreino) && !started) {
    return (
      <PracticeExamConfig
        exam={exam}
        onStart={handlePracticeStart}
        // Voltar do treino é voltar para a prova, não para a home: é de lá que
        // a pessoa veio, e é lá que está o resultado dela.
        onBack={() => router.push(emTreino ? `/exam/${id}/results` : '/')}
        rotulo={emTreino ? 'Treino · prova encerrada' : undefined}
        aviso={
          emTreino
            ? 'Esta prova já foi aplicada e encerrada. Nada do que você responder aqui é entregue: sua nota e a classificação da turma continuam como estão.'
            : undefined
        }
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

  /*
   * Levar a pessoa até o campo — porque o problema é justamente ela não estar
   * vendo o campo.
   *
   * O aviso de início cobre a tela; fechá-lo devolve uma página que continua
   * mais alta que um tablet em retrato. Então quem fecha não fica onde estava:
   * a tela desce até o botão de iniciar, e quem tem uma pendência (a
   * assinatura, na maioria das vezes) desce até ela. É o gesto que a pessoa
   * teria de adivinhar sozinha.
   */
  const rolarAte = (alvo: string | null) => {
    if (!alvo || typeof document === 'undefined') return
    // Um quadro de espera: o modal ainda está desmontando quando isto roda, e
    // rolar com ele na tela não move nada.
    window.setTimeout(() => {
      const elemento = document.getElementById(alvo)
      if (!elemento) return
      elemento.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Só campos de digitação recebem foco: puxar o foco para o canvas da
      // assinatura ou para o botão "Limpar" não ajudaria ninguém.
      const campo = elemento.matches('input, textarea')
        ? (elemento as HTMLElement)
        : elemento.querySelector<HTMLElement>('input, textarea')
      window.setTimeout(() => campo?.focus({ preventScroll: true }), 450)
    }, 60)
  }

  /*
   * "A prova começou" — o aviso que a sala de espera não dava.
   *
   * Fica aqui, junto do modal de monitoramento, porque as duas telas de antes
   * da prova o desenham: a sala de espera e a tela de entrada com o portão
   * aberto. Quem espera numa ou noutra recebe o mesmo anúncio.
   */
  const avisoDeInicio = (
    <AvisoProvaLiberada
      aberto={avisoDeInicioAberto}
      tituloDaProva={exam.title}
      pendencia={pendenciaParaIniciar({
        exigeAssinatura: !!exam.requireSignature,
        assinou: !!signature,
        nome: userName,
        fraseTema: exam.themePhrase,
        transcricaoDaFrase: themeTranscription,
        retomadaBloqueia: inicioBloqueadoPorProgresso(retomada),
        mensagemDaRetomada: retomada?.mensagem,
      })}
      onIniciar={() => {
        setAvisoDeInicioAberto(false)
        handleStartExam()
      }}
      onResolverPendencia={(alvo) => {
        setAvisoDeInicioAberto(false)
        rolarAte(alvo ?? ALVO_DO_BOTAO_INICIAR)
      }}
      onFechar={() => {
        setAvisoDeInicioAberto(false)
        rolarAte(ALVO_DO_BOTAO_INICIAR)
      }}
    />
  )

  // Helper: replace \nl with actual newlines
  const formatText = (text: string) => text?.replace(/\\nl/g, '\n').replace(/\\n/g, '\n') || ''

  // Tela de conclusão após submissão
  if (submitted) {
    // Calcular resultados para provas práticas/pessoais
    const isPracticeOrPersonal = exam.isPracticeExam || (exam as any)?.isPersonalExam || emTreino
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
      /*
       * A nota vem do número que o servidor liberou, não do texto da tela.
       *
       * Aqui se lia `submissionScore` com uma expressão regular — e como essa
       * string também carrega recados, um recado com número dentro virava
       * percentual. Numa prova avaliativa em andamento `notaDaEntrega` é `null`
       * de propósito: a nota espera o término.
       */
      const total = exam.totalPoints || 100
      if (notaDaEntrega === null || total <= 0) return null
      return Math.max(0, Math.min(100, Math.round((notaDaEntrega / total) * 100)))
    })()

    // O estado de cada questão no gabarito — o que o filtro "Erradas/Certas" lê.
    const estadoNoGabarito = (q: Question): 'certa' | 'errada' | 'neutra' => {
      const answer = answers.find(a => a.questionId === q.id)
      if (q.type === 'multiple-choice') {
        const correta = q.alternatives.find(a => a.isCorrect)
        return correta && answer?.selectedAlternative === correta.id ? 'certa' : 'errada'
      }
      if (q.type === 'discursive' && answer?.discursiveSelfScore !== undefined) {
        return answer.discursiveSelfScore >= 70 ? 'certa' : 'errada'
      }
      return 'neutra'
    }
    const contagemDoGabarito = {
      todas: exam.questions.length,
      erradas: exam.questions.filter(q => estadoNoGabarito(q) === 'errada').length,
      certas: exam.questions.filter(q => estadoNoGabarito(q) === 'certa').length,
    }
    const questoesDoGabarito = exam.questions.filter(q =>
      filtroDoGabarito === 'todas' ? true : estadoNoGabarito(q) === (filtroDoGabarito === 'erradas' ? 'errada' : 'certa'),
    )

    const copiarPromptDoResultado = (q: Question) => {
      const answer = answers.find(a => a.questionId === q.id)
      const enunciado = formatText(q.statement || '')
      const comando = formatText(q.command || '')
      const respostaComentada = formatText(q.explanation || '')
      const respostaAluno = answer?.discursiveText || ''
      const prompt = `Você é um corretor de questões de Medicina. Você é humano, experiente e pedagogicamente sensato — não é um corretor mecânico nem perfeccionista. Sua filosofia de correção parte do princípio de que o objetivo é avaliar se o aluno compreende o conteúdo, não se ele decorou palavras-chave ou seguiu exatamente a estrutura do gabarito.\n\nVocê aceita e valoriza amplitude e generalidade nas respostas. Se o aluno abordou aspectos que o enunciado não explicitou, mas que são clinicamente ou conceitualmente pertinentes, isso conta a favor, não contra. Você nunca penaliza o aluno por demonstrar conhecimento além do esperado, nem por usar terminologia diferente da do gabarito quando o conteúdo está correto.\n\nVocê também leva em conta o esforço e a construção da resposta. O aluno dedicou tempo para elaborar um raciocínio e para escrever tentando abordar o que ele acha que a questão quer — sua correção respeita isso.\n\nA seguir, serão apresentados: o enunciado da questão, a resposta comentada oficial e a resposta do aluno.\nAo final, você deve atribuir uma nota de 0% a 100% em intervalos de 10%, justificando brevemente sua avaliação com foco no que o aluno acertou, no que ficou incompleto e, se for o caso, no que estava equivocado. Seja direto, humano e justo.\n\n---\n\nENUNCIADO DA QUESTÃO:\n${enunciado}${comando ? `\n\nCOMANDO:\n${comando}` : ''}\n\n---\n\nRESPOSTA COMENTADA (GABARITO):\n${respostaComentada}\n\n---\n\nRESPOSTA DO ALUNO:\n${respostaAluno}`
      navigator.clipboard.writeText(prompt).then(() => {
        setCopiedPromptId(q.id)
        setTimeout(() => setCopiedPromptId(null), 2500)
      })
    }

    const dataDoTermino = exam.endTime
      ? new Date(exam.endTime).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
      : ''

    // As linhas da lista de downloads, à moda dos Ajustes: ícone, título, o
    // motivo quando está travado e o giro enquanto o PDF é montado.
    const linhaDeDownload = ({
      icone,
      tom,
      titulo,
      detalhe,
      gerando,
      desabilitado,
      dica,
      onClick,
    }: {
      icone: React.ReactNode
      tom?: 'ambar' | 'cinza' | 'azul'
      titulo: string
      detalhe?: string | null
      gerando?: boolean
      desabilitado?: boolean
      dica?: string | null
      onClick: () => void
    }) => (
      <li>
        <button
          type="button"
          className="ios-linha w-full text-left disabled:cursor-not-allowed disabled:opacity-55"
          disabled={desabilitado}
          title={dica || undefined}
          onClick={onClick}
        >
          <span className="pv-icone-linha" data-tom={tom}>{icone}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] leading-snug">{titulo}</span>
            {detalhe && <span className="mt-0.5 block text-[12.5px] leading-snug ios-rotulo-2">{detalhe}</span>}
          </span>
          {gerando ? <Carregando /> : <FileDown className="h-[18px] w-[18px] ios-rotulo-3" />}
        </button>
      </li>
    )

    return (
      <>
        {proctoringModal}
        <FundoIos className="min-h-[100dvh] flex-1">
          {/*
            A folga do rodapé acompanha a barra fixa do pitch.

            `--gx-barra-inferior-h` é publicada por `BarraInferior` enquanto ela
            está na tela (e vale 0px quando não está). Sem somar essa altura
            aqui, a barra cobriria os últimos botões da tela — justamente
            "Voltar para o início", que é a saída de quem NÃO quer o convite.
          */}
          <div
            className="mx-auto w-full max-w-3xl px-4 pt-[calc(8px+env(safe-area-inset-top))] sm:px-6"
            style={{ paddingBottom: 'calc(3rem + var(--gx-barra-inferior-h, 0px))' }}
          >
            <nav className="flex items-center justify-between gap-3 py-2">
              <button type="button" className="ios-voltar ios-vidro" onClick={() => router.push('/')}>
                <ChevronLeft className="h-5 w-5" />
                Início
              </button>
              <ExamBrandHeader />
            </nav>

            {/* ═══ O resultado ═══ */}
            <section className="flex flex-col items-center pt-6 text-center sm:pt-10">
              {/*
                ═══ A nota não é o comprovante ═══

                Numa prova avaliativa em andamento o servidor não manda a nota
                antes do término (ver `lib/provas/nota-da-prova.ts`): "8 de 10"
                é o gabarito dito de outro jeito, e duas notas comparadas no
                grupo da turma reconstroem as respostas certas por subtração.
                No lugar do número, o anel mostra o cadeado e a tela diz as duas
                coisas que a pessoa precisa saber: a entrega está registrada, e
                a nota sai quando a prova acabar para todos.

                O anel dá a proporção de imediato e a cor faz o julgamento sem
                uma frase julgando. Sem número para desenhar (correção
                pendente, TRI), ele vira o selo de "entregue".
              */}
              <ReacaoDoResultado chave={`${id}:${notaGeralEmPercentual ?? 'pendente'}`} percentual={notaGeralEmPercentual} />
              <div className="ios-assenta">
                {isPracticeOrPersonal ? (
                  <AnelDeNota percentual={notaGeralEmPercentual} rotulo={`Nota geral: ${overallScore}`}>
                    {/* O percentual no anel (é o que o anel desenha); os pontos,
                        quando a prova os tem, vão embaixo — "7 pontos" não
                        cabe dentro do círculo de um celular. */}
                    <span className="pv-nota-grande" style={{ color: corDaNota(notaGeralEmPercentual) }}>
                      {notaGeralEmPercentual !== null ? `${notaGeralEmPercentual}%` : overallScore}
                    </span>
                    <span className="mt-1.5 max-w-[120px] text-[12.5px] font-medium leading-tight ios-rotulo-2">
                      {notaGeralEmPercentual !== null && submissionScore && submissionScore.length <= 24 && submissionScore !== overallScore
                        ? submissionScore
                        : 'nota geral'}
                    </span>
                  </AnelDeNota>
                ) : notaPresaAteOTermino ? (
                  <AnelDeNota percentual={null} rotulo="A nota sai no término da prova">
                    <Lock className="h-8 w-8 ios-ambar" />
                    <span className="mt-2 text-[12.5px] font-semibold ios-ambar">Nota no término</span>
                  </AnelDeNota>
                ) : notaGeralEmPercentual !== null ? (
                  <AnelDeNota percentual={notaGeralEmPercentual} rotulo={`Sua nota: ${submissionScore}`}>
                    <span className="pv-nota-grande text-[34px]" style={{ color: corDaNota(notaGeralEmPercentual) }}>
                      {notaDaEntrega}
                    </span>
                    <span className="mt-1.5 text-[12.5px] font-medium ios-rotulo-2">de {exam.totalPoints} pontos</span>
                  </AnelDeNota>
                ) : (
                  <AnelDeNota percentual={100} cor="var(--ios-tinta)" rotulo="Prova entregue">
                    <Check className="h-14 w-14 ios-tinta" strokeWidth={2.5} />
                  </AnelDeNota>
                )}
              </div>

              <div className="pv-entra mt-6 space-y-2" style={{ '--pv-ordem': 1 } as React.CSSProperties}>
                {/* "Prova entregue" seria falso no treino: não houve entrega
                    nenhuma, e essa é justamente a promessa que o modo faz. */}
                <h1 className="ios-titulo-grande">{emTreino ? 'Treino concluído' : 'Prova entregue'}</h1>
                <p className="text-[17px] ios-rotulo-2">{exam.title}</p>
              </div>

              <div
                className="pv-entra mt-4 flex flex-wrap items-center justify-center gap-2"
                style={{ '--pv-ordem': 2 } as React.CSSProperties}
              >
                {userName && (
                  <span className="pv-capsula">
                    <User className="h-4 w-4" />
                    {userName}
                  </span>
                )}
                {examDuration && (
                  <span className="pv-capsula">
                    <Clock className="h-4 w-4" />
                    {examDuration}
                  </span>
                )}
                {/* Numa prova avaliativa a entrega não é o fim da história: a
                    nota, a correção e o gabarito dependem do término. Dizer
                    isso aqui evita a pergunta "e agora?". */}
                {!isPracticeOrPersonal && janela && !janela.encerrada && dataDoTermino && (
                  <span className="pv-capsula ios-ambar" style={{ background: 'var(--ios-ambar-suave)' }}>
                    <Clock className="h-4 w-4" />
                    Nota e gabarito em {dataDoTermino}
                  </span>
                )}
              </div>
            </section>

            <div className="mt-8 space-y-8">
              {emTreino && (
                <div className="pv-aviso pv-entra flex-col sm:flex-row sm:items-center" data-tom="tinta" style={{ '--pv-ordem': 3 } as React.CSSProperties}>
                  <p className="flex-1">
                    Isto foi um treino: <strong className="font-semibold">nada foi entregue</strong>. Sua nota na
                    prova aplicada e a classificação da turma continuam exatamente como estavam.
                  </p>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button type="button" className="ios-botao ios-botao-p" onClick={() => window.location.reload()}>
                      <Play className="h-3.5 w-3.5 fill-current" /> Treinar de novo
                    </button>
                    <button type="button" className="ios-botao-cinza ios-botao-p" onClick={() => router.push(`/exam/${id}/results`)}>
                      <Trophy className="h-3.5 w-3.5" /> Resultados
                    </button>
                  </div>
                </div>
              )}

              {/* ═══ Os números ═══ */}
              {isPracticeOrPersonal ? (
                <div className="pv-entra ios-cartao rounded-[22px] py-4" style={{ '--pv-ordem': 3 } as React.CSSProperties}>
                  <div className="ios-faixa">
                    {mcTotal > 0 && (
                      <div>
                        <span className="ios-faixa-rotulo">Objetivas</span>
                        <span className="ios-faixa-valor" style={{ color: 'var(--ios-rotulo)' }}>
                          {mcCorrect}/{mcTotal}
                        </span>
                        <span className="ios-faixa-nota" style={{ color: corDaNota(mcPercentage) }}>
                          {mcPercentage}% de acerto
                        </span>
                      </div>
                    )}
                    {discursiveQuestions.length > 0 && (
                      <div>
                        <span className="ios-faixa-rotulo">Discursivas</span>
                        <span className="ios-faixa-valor" style={{ color: 'var(--ios-rotulo)' }}>
                          {discursiveWithScore.length}/{discursiveQuestions.length}
                        </span>
                        <span className="ios-faixa-nota" style={discursiveAvg !== null ? { color: corDaNota(discursiveAvg) } : undefined}>
                          {discursiveAvg !== null ? `média ${discursiveAvg}%` : 'avaliadas'}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="ios-faixa-rotulo">Questões</span>
                      <span className="ios-faixa-valor" style={{ color: 'var(--ios-rotulo)' }}>
                        {exam.questions.length}
                      </span>
                      <span className="ios-faixa-nota">na prova</span>
                    </div>
                    {examDuration && (
                      <div>
                        <span className="ios-faixa-rotulo">Tempo</span>
                        <span className="ios-faixa-valor" style={{ color: 'var(--ios-rotulo)' }}>
                          {examDuration}
                        </span>
                        <span className="ios-faixa-nota">de prova</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="pv-entra space-y-3 text-center" style={{ '--pv-ordem': 3 } as React.CSSProperties}>
                  <p className="text-[19px] font-semibold tracking-[-0.015em]">Tudo certo, {userName}.</p>
                  <p className="text-[15px] ios-rotulo-2">
                    Sua prova foi registrada{examDuration ? ` em ${examDuration}` : ''}. Guarde o comprovante abaixo.
                  </p>
                  {notaPresaAteOTermino && (
                    <div className="pv-aviso mx-auto max-w-xl text-left">
                      <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>
                        Sua nota sai quando a prova terminar{dataDoTermino ? `, em ${dataDoTermino}` : ''}. Enquanto a
                        turma ainda responde, a nota não circula — ela diria quais alternativas eram as certas. Suas
                        respostas já estão guardadas, e você já pode baixar a folha com as letras que marcou.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ Discursivas esperando a autoavaliação ═══ */}
              {isPracticeOrPersonal && discursivePending.length > 0 && (
                <section className="space-y-2">
                  <h2 className="ios-cabeca-lista">
                    {discursivePending.length}{' '}
                    {discursivePending.length === 1 ? 'discursiva espera sua nota' : 'discursivas esperam sua nota'}
                  </h2>
                  <ul className="ios-lista" style={{ '--ios-recuo': '64px' } as React.CSSProperties}>
                    {discursivePending.map(q => (
                      <li key={q.id}>
                        <div className="ios-linha flex-wrap py-3">
                          <span className="pv-num" data-tom="ambar">{q.number}</span>
                          <p className="min-w-0 flex-1 basis-40 text-[15px] leading-snug line-clamp-2">
                            {formatText(q.statement || '')}
                          </p>
                          <div className="flex w-full gap-2 pl-12 sm:w-auto sm:pl-0">
                            <button type="button" className="ios-botao-cinza ios-botao-p flex-1 sm:flex-none" onClick={() => copiarPromptDoResultado(q)}>
                              {copiedPromptId === q.id ? (
                                <><ClipboardCheck className="h-3.5 w-3.5 ios-tinta" /> Copiado</>
                              ) : (
                                <><Copy className="h-3.5 w-3.5" /> Prompt</>
                              )}
                            </button>
                            <button type="button" className="ios-botao ios-botao-p flex-1 sm:flex-none" onClick={() => handleOpenSelfScore(q.id)}>
                              Dar nota
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="ios-pe-lista">
                    Copie o prompt, cole numa IA (ChatGPT, Claude, Gemini) e volte com a nota que ela indicar.
                  </p>
                </section>
              )}

              {/*
                ═══ PITCH DE VENDAS ═══

                Depois do resultado, antes do gabarito. O gabarito comentado são
                várias telas de rolagem numa prova de sessenta questões, e o
                convite no fim acabava a seis arrastadas de qualquer olho. Aqui
                a pergunta "quanto eu fiz?" já está respondida e a revisão
                continua logo abaixo. O componente decide sozinho se aparece —
                ver components/exam/pitch-de-vendas.tsx.
              */}
              <PitchDeVendasDaProva examId={id} />

              {/* ═══ Gabarito ═══ */}
              {isPracticeOrPersonal && (
                <section className="space-y-3">
                  <div className="flex flex-wrap items-end justify-between gap-3 px-1">
                    <h2 className="ios-titulo-secao">Gabarito</h2>
                    <div
                      className="ios-segmentado w-full sm:w-[340px]"
                      role="tablist"
                      aria-label="Filtrar o gabarito"
                      style={{ '--segmentos': 3, '--indice': ['todas', 'erradas', 'certas'].indexOf(filtroDoGabarito) } as React.CSSProperties}
                    >
                      {(['todas', 'erradas', 'certas'] as const).map(filtro => (
                        <button
                          key={filtro}
                          type="button"
                          role="tab"
                          aria-selected={filtroDoGabarito === filtro}
                          className="ios-segmento"
                          onClick={() => setFiltroDoGabarito(filtro)}
                        >
                          {filtro === 'todas' ? 'Todas' : filtro === 'erradas' ? 'Erradas' : 'Certas'}
                          <span className="tabular-nums opacity-55">{contagemDoGabarito[filtro]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {questoesDoGabarito.length === 0 ? (
                    <div className="ios-cartao rounded-[22px] px-6 py-10 text-center">
                      <p className="text-[16px] font-semibold">
                        {filtroDoGabarito === 'erradas' ? 'Nenhum erro. Prova limpa.' : 'Nenhuma questão aqui ainda.'}
                      </p>
                      <p className="mt-1 text-[14px] ios-rotulo-2">Troque o filtro acima para ver as outras.</p>
                    </div>
                  ) : (
                    <ul className="ios-lista" style={{ '--ios-recuo': '64px' } as React.CSSProperties}>
                      {questoesDoGabarito.map(q => {
                        const answer = answers.find(a => a.questionId === q.id)
                        const isExpanded = expandedQuestion === q.id
                        const estado = estadoNoGabarito(q)

                        if (q.type === 'essay') {
                          return (
                            <li key={q.id}>
                              <div className="ios-linha py-3">
                                <span className="pv-num" data-tom="neutro">{q.number}</span>
                                <span className="min-w-0 flex-1">
                                  <span className="text-[15px] leading-snug line-clamp-2">{q.essayTheme || formatText(q.statement || '')}</span>
                                  <span className="mt-1 block text-[12.5px] ios-rotulo-2">Redação · correção à parte</span>
                                </span>
                              </div>
                            </li>
                          )
                        }

                        const correctAlt = q.type === 'multiple-choice' ? q.alternatives.find(a => a.isCorrect) : undefined
                        const selectedAlt = q.type === 'multiple-choice' ? q.alternatives.find(a => a.id === answer?.selectedAlternative) : undefined
                        const selfScore = answer?.discursiveSelfScore
                        const tom =
                          q.type === 'discursive'
                            ? selfScore === undefined ? 'ambar' : estado === 'certa' ? 'certa' : 'errada'
                            : estado === 'certa' ? 'certa' : 'errada'

                        return (
                          <li key={q.id}>
                            <button
                              type="button"
                              className="ios-linha w-full py-3 text-left"
                              aria-expanded={isExpanded}
                              onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                            >
                              <span className="pv-num" data-tom={tom}>{q.number}</span>
                              <span className="min-w-0 flex-1">
                                <span className="text-[15px] leading-snug line-clamp-1">{formatText(q.statement || '')}</span>
                                <span className="mt-1 flex flex-wrap gap-1.5">
                                  {q.type === 'multiple-choice' ? (
                                    selectedAlt ? (
                                      <>
                                        <span className="pv-etiqueta" data-tom={estado === 'certa' ? 'tinta' : 'erro'}>
                                          Sua: {selectedAlt.letter}
                                        </span>
                                        {estado !== 'certa' && correctAlt && (
                                          <span className="pv-etiqueta" data-tom="tinta">Correta: {correctAlt.letter}</span>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        <span className="pv-etiqueta">Em branco</span>
                                        {correctAlt && <span className="pv-etiqueta" data-tom="tinta">Correta: {correctAlt.letter}</span>}
                                      </>
                                    )
                                  ) : selfScore !== undefined ? (
                                    <span className="pv-etiqueta" data-tom={estado === 'certa' ? 'tinta' : 'erro'}>
                                      Discursiva · {selfScore}%
                                    </span>
                                  ) : (
                                    <span className="pv-etiqueta" data-tom="ambar">
                                      Discursiva · {answer?.discursiveText?.trim() ? 'sem nota' : 'em branco'}
                                    </span>
                                  )}
                                </span>
                              </span>
                              <ChevronRight className="pv-seta h-5 w-5" />
                            </button>

                            {isExpanded && (
                              <div className="pv-revela-corpo space-y-5 px-4 pb-5 pt-2 sm:px-5">
                                <div className="space-y-3">
                                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{formatText(q.statement || '')}</p>
                                  {q.command && (
                                    <p className="whitespace-pre-wrap text-[15px] font-semibold leading-relaxed">{formatText(q.command)}</p>
                                  )}
                                </div>

                                {q.type === 'multiple-choice' && (
                                  <div className="pv-alts">
                                    {q.alternatives.map(alt => (
                                      <AlternativaDeLeitura
                                        key={alt.id}
                                        letra={alt.letter}
                                        texto={formatText(alt.text)}
                                        correta={!!alt.isCorrect}
                                        marcada={alt.id === answer?.selectedAlternative}
                                        comentario={
                                          (q as any).commentedFeedback?.explanations?.[alt.letter]
                                            ? formatText((q as any).commentedFeedback.explanations[alt.letter])
                                            : undefined
                                        }
                                      />
                                    ))}
                                  </div>
                                )}

                                {q.type === 'discursive' && (
                                  <div className="space-y-2">
                                    <p className="pv-rotulo">Sua resposta</p>
                                    <p className="whitespace-pre-wrap rounded-[16px] bg-[var(--ios-preenchimento)] px-4 py-3 text-[15px] leading-relaxed">
                                      {answer?.discursiveText || 'Não respondida'}
                                    </p>
                                  </div>
                                )}

                                {(q.explanation || imagensDaResposta(q).length > 0) && (
                                  <section className="pv-revela space-y-3 p-4">
                                    <h3 className="flex items-center gap-2 text-[15px] font-semibold ios-ambar">
                                      <BookOpen className="h-[18px] w-[18px]" /> Resposta comentada
                                    </h3>
                                    {q.explanation && <TextoComentado texto={q.explanation} />}
                                    <ImagensDaQuestao
                                      imagens={imagensDaResposta(q)}
                                      layout={layoutDaResposta(q)}
                                      onAmpliar={(src) => setExamImageModal({ src })}
                                      alt="Imagem da resposta comentada"
                                    />
                                  </section>
                                )}

                                {q.type === 'discursive' && selfScore === undefined && answer?.discursiveText?.trim() && (
                                  <div className="flex flex-col gap-2 sm:flex-row">
                                    <button type="button" className="ios-botao-cinza w-full sm:flex-1" onClick={() => copiarPromptDoResultado(q)}>
                                      {copiedPromptId === q.id ? (
                                        <><ClipboardCheck className="h-4 w-4 ios-tinta" /> Copiado</>
                                      ) : (
                                        <><Copy className="h-4 w-4" /> Copiar prompt</>
                                      )}
                                    </button>
                                    <button type="button" className="ios-botao w-full sm:flex-1" onClick={() => handleOpenSelfScore(q.id)}>
                                      Dar minha nota (0–100%)
                                    </button>
                                  </div>
                                )}

                                <button
                                  type="button"
                                  className="ios-botao-cinza ios-botao-p"
                                  onClick={() => setReportQuestionId(q.id)}
                                >
                                  <Flag className="h-3.5 w-3.5" /> Reportar questão
                                </button>
                              </div>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </section>
              )}

              {/* ═══ Downloads ═══ */}
              {/*
                Os dois primeiros passam pelo mesmo veredito do resto da
                plataforma — e o do gabarito espera a prova terminar, mesmo
                para quem paga. O rótulo conta a espera, em vez de recusar
                depois do toque.
              */}
              <section className="space-y-2">
                <h2 className="ios-cabeca-lista">Downloads</h2>
                <ul className="ios-lista" style={{ '--ios-recuo': '60px' } as React.CSSProperties}>
                  {linhaDeDownload({
                    icone: <FileText className="h-4 w-4" />,
                    titulo: 'Minha prova respondida',
                    detalhe: downloads.relatorio.esperandoOFim ? downloads.relatorio.motivo : 'PDF com as suas respostas',
                    gerando: pdfGenerating === 'Relatório',
                    desabilitado: !!pdfGenerating || downloads.relatorio.esperandoOFim,
                    dica: downloads.relatorio.motivo,
                    onClick: async () => {
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
                        // `jspdf` (328 KB) sob demanda: a prova é para responder,
                        // e o relatório é um clique opcional no fim dela.
                        const { downloadUserReportPDF } = await import('@/lib/user-report-generator')
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
                    },
                  })}
                  {linhaDeDownload({
                    icone: <BookOpen className="h-4 w-4" />,
                    tom: 'ambar',
                    titulo: 'Respostas comentadas',
                    detalhe: downloads.gabarito.esperandoOFim ? downloads.gabarito.motivo : 'PDF com o gabarito e os comentários',
                    gerando: pdfGenerating === 'Relatório + Gabarito',
                    desabilitado: !!pdfGenerating || downloads.gabarito.esperandoOFim,
                    dica: downloads.gabarito.motivo,
                    onClick: async () => {
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
                    },
                  })}
                  {/*
                    A folha com as letras que ele marcou: o arquivo dos cinco
                    minutos seguintes à entrega — conferir com os colegas na
                    saída —, e o único que continua saindo quando o admin
                    prendeu a prova e o relatório até o término. Ver
                    `FORMATOS_DA_FOLHA`.
                  */}
                  {downloads.compacto.permitido &&
                    linhaDeDownload({
                      icone: <ClipboardList className="h-4 w-4" />,
                      tom: 'cinza',
                      titulo: 'Minhas respostas (A, B, C…)',
                      detalhe: 'Só as letras que você marcou',
                      gerando: pdfGenerating === 'Folha',
                      desabilitado: !!pdfGenerating,
                      onClick: async () => {
                        try {
                          setPdfGenerating('Folha')
                          const { generateCompactAnswersPDF, downloadPDF } = await import('@/lib/pdf-generator')
                          const blob = await generateCompactAnswersPDF(exam, answers, userName || 'Aluno')
                          downloadPDF(blob, `folha-de-respostas-${exam.title}.pdf`, {
                            type: 'exam_answers_pdf',
                            resourceId: id as string,
                            resourceTitle: exam.title,
                          })
                        } catch (error: any) {
                          showToastMessage('Erro ao gerar a folha: ' + error.message)
                        } finally {
                          setPdfGenerating(null)
                        }
                      },
                    })}
                  {annotations.length > 0 &&
                    linhaDeDownload({
                      icone: <StickyNote className="h-4 w-4" />,
                      tom: 'azul',
                      titulo: 'Minhas anotações',
                      detalhe: `${annotations.length} ${annotations.length === 1 ? 'questão anotada' : 'questões anotadas'}`,
                      onClick: async () => {
                        try {
                          const { generateAnnotationsPDF, downloadPDF } = await import('@/lib/pdf-generator')
                          const blob = await generateAnnotationsPDF(exam.title, annotations)
                          downloadPDF(blob, `Anotacoes-${exam.title}.pdf`, { type: 'annotations_pdf', resourceId: id as string, resourceTitle: exam.title })
                        } catch (error: any) {
                          showToastMessage('Erro ao gerar PDF de anotações: ' + error.message)
                        }
                      },
                    })}
                  {exam.pdfUrl &&
                    linhaDeDownload({
                      icone: <FileDown className="h-4 w-4" />,
                      tom: 'cinza',
                      titulo: 'PDF original da prova',
                      onClick: () => window.open(exam.pdfUrl, '_blank'),
                    })}
                </ul>
              </section>

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                {isPracticeOrPersonal && (
                  <button
                    type="button"
                    className="ios-botao-cinza ios-botao-g w-full sm:flex-1"
                    onClick={() => {
                      setSubmitted(false)
                      setStarted(false)
                      setShowPracticeConfig(true)
                      setAnswers(exam.questions.map(q => ({ questionId: q.id })))
                      setCurrentQuestionIndex(0)
                      setLockedQuestions(new Set())
                      setFiltroDoGabarito('todas')
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Refazer a prova
                  </button>
                )}
                <button type="button" className="ios-botao ios-botao-g w-full sm:flex-1" onClick={() => router.push('/')}>
                  Voltar para o início
                </button>
              </div>

              <ExamBrandFooter />
            </div>
          </div>

          {/* Relatar questão */}
          {reportQuestionId && (
            <ReportQuestionModal
              questionId={reportQuestionId}
              examId={id}
              isOpen={!!reportQuestionId}
              onClose={() => setReportQuestionId(null)}
            />
          )}

          {/* Imagem expandida */}
          {examImageModal && (
            <ImageModal
              isOpen={!!examImageModal}
              onClose={() => setExamImageModal(null)}
              src={examImageModal.src}
              alt="Imagem da questão"
            />
          )}

          {/* O PDF sendo montado: um aviso que não bloqueia a tela. */}
          {pdfGenerating && (
            <div
              className="ios-vidro fixed bottom-[calc(16px+env(safe-area-inset-bottom))] left-1/2 z-[300] flex -translate-x-1/2 items-center gap-3 rounded-full py-2.5 pl-4 pr-5"
              role="status"
            >
              <Carregando />
              <div className="leading-tight">
                <p className="text-[14px] font-semibold">Gerando PDF…</p>
                <p className="text-[12px] ios-rotulo-2">{pdfGenerating}</p>
              </div>
            </div>
          )}

          {/* Autoavaliação da discursiva */}
          {showSelfScoreModal && (
            <Folha
              largura="md"
              camada={110}
              onFechar={() => {
                setShowSelfScoreModal(false)
                setSelfScoreQuestionId(null)
                setPendingSelfScore(null)
              }}
              titulo="Autoavaliação"
              subtitulo="Que nota a sua resposta merece? Use a que a IA indicou, se corrigiu com ela."
              pe={
                <div className="flex w-full gap-2">
                  <button
                    type="button"
                    className="ios-botao-cinza flex-1"
                    onClick={() => {
                      setShowSelfScoreModal(false)
                      setSelfScoreQuestionId(null)
                      setPendingSelfScore(null)
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="ios-botao flex-1"
                    disabled={pendingSelfScore === null}
                    onClick={handleConfirmSelfScore}
                  >
                    Confirmar
                  </button>
                </div>
              }
            >
              <div className="space-y-4 pb-1">
                <ReguaDeAutoavaliacao valor={pendingSelfScore} onEscolher={setPendingSelfScore} />
                <p className="min-h-[1.5em] text-center text-[15px] font-semibold" style={{ color: corDaNota(pendingSelfScore) }}>
                  {pendingSelfScore !== null ? `${pendingSelfScore}% · ${frasesDaNota(pendingSelfScore)}` : 'Escolha uma nota'}
                </p>
              </div>
            </Folha>
          )}
        </FundoIos>
      </>
    )
  }

  /*
   * Quem já entregou não volta para a porta da prova.
   *
   * Este retorno é o conserto de um buraco de ordem: o cartão "Você finalizou
   * essa prova" era desenhado no corpo principal da página, LÁ EMBAIXO, e o
   * corpo principal só é alcançado quando a prova está aberta. Quem abria o
   * endereço da prova depois de entregar parava aqui — na tela inicial — e
   * recebia o painel de portões ("Você está dentro"), o campo de assinatura e o
   * botão **Iniciar Prova**, como se a prova estivesse por vir. A entrega já
   * era conhecida (`data.jaSubmeteu` chega junto com a prova); ninguém
   * perguntava por ela antes de desenhar a porta.
   *
   * Clicar não refazia nada — o servidor recusa a segunda entrega —, mas a tela
   * dizia o contrário do que tinha acontecido, e numa prova valendo nota é a
   * dúvida mais cara que uma tela pode plantar: "então minha entrega não foi
   * registrada?".
   *
   * `submitted` não entra aqui: quem acabou de entregar NESTA sessão já foi
   * atendido pela tela de conclusão, logo acima, que mostra a nota. A prova de
   * treino também fica de fora — ela é feita quantas vezes a pessoa quiser.
   */
  // `emTreino` fica de fora: quem já entregou também pode refazer a prova como
  // treino, e mandá-lo de volta para a tela de "você já finalizou" seria negar
  // exatamente o botão pelo qual ele clicou.
  if (alreadySubmitted && !exam.isPracticeExam && !emTreino && !started) {
    return (
      <>
        <ExamJaFinalizada
          variante="pagina"
          exam={exam}
          examId={String(id)}
          userId={userId}
          userName={userName || loggedUserName}
          encerrada={!!janela?.encerrada}
          downloads={downloads}
          onErro={(mensagem) => showToastMessage(mensagem)}
          onPlanoBloqueado={() => setShowPdfCta(true)}
        />
        <ToastAlert open={toastOpen} onOpenChange={setToastOpen} message={toastMessage} type={toastType} />
        <PremiumPdfCtaModal open={showPdfCta} onClose={() => setShowPdfCta(false)} />
      </>
    )
  }

  /*
   * O topo das duas telas de antes da prova (entrada e sala de espera): o
   * "‹ voltar" à esquerda, como no iPhone, e a marca à direita. Esta tela é a
   * porta de quem chega pelo link direto — e por muito tempo ela não tinha
   * logo, nome nem endereço.
   */
  const topoDaPorta = (rotulo: string, aoVoltar: () => void) => (
    <nav className="flex items-center justify-between gap-3 py-2">
      <button type="button" className="ios-voltar ios-vidro" onClick={aoVoltar}>
        <ChevronLeft className="h-5 w-5" />
        {rotulo}
      </button>
      <ExamBrandHeader />
    </nav>
  )

  if (!started && !inWaitingRoom) {
    /*
      Os números da prova.

      "Início" e "Término" saem daqui quando o painel de portões está na tela:
      ele já mostra os dois, no mesmo formato, dois centímetros acima. Repetir a
      mesma data duas vezes na mesma dobra não reforça nada — só faz o leitor
      conferir se são a mesma coisa. No lugar entra a duração, que o painel
      não diz.
    */
    const temPainelDePortoes = !!janela && janela.fase !== 'livre'
    const dataCurta = (valor: Date | string) =>
      new Date(valor).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    const numeros: { rotulo: string; valor: React.ReactNode; nota?: string }[] = [
      { rotulo: 'Questões', valor: exam.numberOfQuestions },
      exam.scoringMethod === 'tri'
        ? { rotulo: 'Pontuação', valor: 'TRI', nota: 'até 1000' }
        : { rotulo: 'Pontuação', valor: exam.totalPoints, nota: 'pontos' },
    ]
    if (exam.duration) {
      numeros.push({
        rotulo: 'Duração',
        valor:
          exam.duration >= 60
            ? `${Math.floor(exam.duration / 60)}h${exam.duration % 60 ? String(exam.duration % 60).padStart(2, '0') : ''}`
            : exam.duration,
        nota: exam.duration >= 60 ? undefined : 'minutos',
      })
    }
    if (!temPainelDePortoes) {
      const [diaIni, horaIni] = dataCurta(exam.startTime).split(/,\s*/)
      const [diaFim, horaFim] = dataCurta(exam.endTime).split(/,\s*/)
      numeros.push({ rotulo: 'Início', valor: horaIni || diaIni, nota: horaIni ? diaIni : undefined })
      numeros.push({ rotulo: 'Término', valor: horaFim || diaFim, nota: horaFim ? diaFim : undefined })
    }

    /*
     * `podeEntrar` sozinho travava quem JÁ ESTÁ DENTRO.
     *
     * Numa prova de portão 13h–13h50 e início às 14h, quem entrou às 13h30
     * chega às 14h com `podeEntrar: false` (o portão fechou) e `podeIniciar:
     * true` (ele está dentro) — e o botão ficava desabilitado justamente para
     * a pessoa que a prova está esperando. A porta abre para os três caminhos:
     * entrar agora, iniciar por já ter entrado, ou VOLTAR PARA A SALA por já
     * ter entrado.
     *
     * O terceiro é o intervalo entre o portão fechar e a prova começar — das
     * 13h50 às 14h no exemplo. Ali quem entrou às 13h30 tem `podeEntrar: false`
     * e `podeIniciar: false`: um F5 nesses dez minutos trancava do lado de fora
     * quem estava dentro, e a única coisa que ele tinha feito de diferente foi
     * chegar cedo.
     */
    const portaFechada =
      !!janela && !janela.podeEntrar && !janela.podeIniciar && !(janela.jaEntrou && !janela.encerrada)
    const faltaNome = !userName.trim()
    const faltaFrase = !!exam.themePhrase && !themeTranscription.trim()
    // Só trava o caminho que ENTRA na prova: para a sala de espera a
    // assinatura ainda pode ser feita lá dentro.
    const faltaAssinatura = canStart && !!exam.requireSignature && !signature
    const botaoTravado = faltaNome || faltaFrase || portaFechada || faltaAssinatura
    const rotuloDoBotao =
      janela?.fase === 'encerrada'
        ? 'Prova encerrada'
        : janela?.fase === 'portao-fechado'
          ? 'Portões fechados'
          : janela?.fase === 'antes-do-portao'
            ? 'Aguardando os portões'
            : canStart
              ? faltaAssinatura
                ? 'Assine para iniciar'
                : 'Iniciar prova'
              : 'Entrar na sala'
    // O que falta, dito embaixo do botão travado — em vez de um botão cinza
    // que não explica por que não responde.
    const oQueFalta = portaFechada
      ? null
      : faltaNome
        ? 'Preencha seu nome completo para continuar.'
        : faltaFrase
          ? 'Transcreva a frase-tema para continuar.'
          : faltaAssinatura
            ? 'Assine no quadro acima para iniciar.'
            : null
    const mostraAssinatura =
      exam.requireSignature !== false &&
      (!janela || janela.podeEntrar || janela.podeIniciar || (!!retomada?.temProgresso && !janela.encerrada))

    return (
      <>
        {proctoringModal}
        {avisoDeInicio}
        <FundoIos className="min-h-[100dvh] flex-1">
          <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-[calc(8px+env(safe-area-inset-top))] sm:px-6 lg:px-8">
            {topoDaPorta('Início', () => router.push('/'))}

            {/*
              Arte à esquerda, prova à direita — a página de álbum da Apple.

              Antes as duas colunas eram "capa + título + números + portões"
              contra "o formulário", e o formulário acabava no meio da tela:
              meia página de vazio à direita. Agora a capa e os portões fazem
              uma coluna e o título, os números e o "Antes de começar" fazem a
              outra, de alturas parecidas. No celular a ordem é a de leitura:
              capa, título, números, começar, portões.
            */}
            <div className="mt-4 grid items-start gap-6 sm:mt-6 lg:mt-8 lg:grid-cols-2 lg:gap-10 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] xl:gap-14">
              {/* ── A arte ── */}
              <div className="min-w-0 space-y-6">
                <div className="relative">
                  {/* O brilho da própria capa, desfocado atrás da moldura: a cor
                      da prova sem tingir a página inteira. */}
                  {exam.coverImage && (
                    <div aria-hidden className="pv-arte-brilho">
                      <CoverImage src={exam.coverImage} alt="" sizes="(max-width: 1024px) 100vw, 620px" />
                    </div>
                  )}
                  <div className="pv-arte ios-capa">
                    <CapaDaProva
                      adaptavel
                      src={exam.coverImage}
                      titulo={exam.title}
                      sizes="(max-width: 1024px) 100vw, 620px"
                      className="max-h-[62vh] lg:max-h-[min(64vh,600px)]"
                    />
                  </div>
                </div>

                {/* Portões — os quatro marcos que só existiam no banco. Do
                    notebook para cima, embaixo da capa. */}
                {temPainelDePortoes && (
                  <div className="pv-entra hidden lg:block" style={{ '--pv-ordem': 6 } as React.CSSProperties}>
                    <ExamGateStatus janela={janela!} />
                  </div>
                )}
              </div>

              {/* ── A prova e o começar ── */}
              <div className="min-w-0 space-y-6">
                  <div className="pv-entra space-y-3" style={{ '--pv-ordem': 1 } as React.CSSProperties}>
                    {((exam as any).isPersonalExam || exam.isPracticeExam || exam.proctoring?.enabled) && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(exam as any).isPersonalExam && <span className="pv-etiqueta" data-tom="tinta">Prova pessoal</span>}
                        {exam.isPracticeExam && <span className="pv-etiqueta" data-tom="tinta">Treino</span>}
                        {exam.proctoring?.enabled && (
                          <span className="pv-etiqueta" data-tom="ambar">
                            <Eye className="h-3 w-3" /> Monitorada
                          </span>
                        )}
                      </div>
                    )}
                    <h1 className="ios-titulo-grande">{exam.title}</h1>
                    {exam.description && (
                      <p className="max-w-[62ch] whitespace-pre-line text-[16px] leading-relaxed ios-rotulo-2">
                        {exam.description}
                      </p>
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

                  {/* A faixa de números, à moda da App Store. */}
                  <div className="pv-entra ios-cartao rounded-[22px] py-4" style={{ '--pv-ordem': 3 } as React.CSSProperties}>
                    <div className="ios-faixa">
                      {numeros.map((n, i) => (
                        <div key={n.rotulo} className="pv-entra" style={{ '--pv-ordem': 4 + i } as React.CSSProperties}>
                          <span className="ios-faixa-rotulo">{n.rotulo}</span>
                          <span className="ios-faixa-valor" style={{ color: 'var(--ios-rotulo)' }}>
                            {n.valor}
                          </span>
                          {n.nota && <span className="ios-faixa-nota">{n.nota}</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                {/* ── Começar ── */}
                <div
                  className="pv-painel pv-entra space-y-5 p-5 sm:p-7"
                  style={{ '--pv-ordem': 5 } as React.CSSProperties}
                >
                  <div>
                    <h2 className="ios-titulo-secao">{janela?.encerrada ? 'A prova terminou' : 'Antes de começar'}</h2>
                    {!janela?.encerrada && (
                      <p className="mt-1 text-[14px] leading-snug ios-rotulo-2">
                        Confira seus dados. Eles vão no comprovante da entrega.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor="userName" className="pv-rotulo">
                        Nome completo
                      </label>
                      {exam.allowCustomName && loggedUserName && !userName && (
                        <button
                          type="button"
                          className="ios-botao-suave ios-botao-p"
                          onClick={() => setUserName(loggedUserName)}
                        >
                          <User className="h-3.5 w-3.5" /> Usar meu nome
                        </button>
                      )}
                    </div>
                    <input
                      id="userName"
                      className="pv-entrada"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder={exam.allowCustomName ? 'Como deve sair no comprovante' : 'Usando o nome da sua conta'}
                      disabled={!exam.allowCustomName}
                      autoComplete="name"
                      enterKeyHint="next"
                    />
                    {!exam.allowCustomName && (
                      <p className="text-[12.5px] ios-rotulo-3">O nome vem da sua conta e não pode ser trocado.</p>
                    )}
                  </div>

                  {exam.themePhrase && (
                    <div className="space-y-2">
                      <label htmlFor="theme" className="pv-rotulo block">
                        Transcreva a frase-tema
                      </label>
                      <p className="rounded-[14px] px-4 py-3 text-[16px] font-medium italic leading-relaxed" style={{ background: 'var(--ios-tinta-suave)' }}>
                        &ldquo;{exam.themePhrase}&rdquo;
                      </p>
                      <textarea
                        id="theme"
                        className="pv-entrada font-serif"
                        value={themeTranscription}
                        onChange={(e) => setThemeTranscription(e.target.value)}
                        placeholder="Escreva a frase exatamente como acima…"
                        rows={3}
                      />
                    </div>
                  )}

                  {/*
                    A assinatura, na tela em que a prova de fato começa.

                    Ela morava só na sala de espera — e a sala de espera é para
                    quem chega ANTES do início. Quem abre a página com a prova já
                    em andamento pula direto daqui para dentro da prova, e nunca
                    via o campo. Aqui o campo aparece nos dois caminhos, e o
                    botão abaixo só destrava com ela.

                    Não aparece quando a entrada está fechada (portão fechado,
                    prova encerrada): pedir assinatura para uma porta trancada é
                    pedir trabalho por nada. A exceção é quem tem rascunho para
                    retomar ou entregar.
                  */}
                  {mostraAssinatura && (
                    // O `id` é o destino do aviso de início: quando a prova
                    // libera e falta assinar, o modal leva a tela até aqui.
                    <div id={ALVO_DA_ASSINATURA}>
                      <SignaturePad
                        onSignatureChange={setSignature}
                        valorInicial={signature}
                        label={exam.requireSignature ? 'Assinatura digital' : 'Assinatura digital (opcional)'}
                      />
                    </div>
                  )}

                  {/*
                    O botão responde à fase, não só a "começou ou não". E chama
                    a atenção (`exam-botao-chama`) SÓ quando está de fato
                    clicável: um botão travado que pisca é uma promessa quebrada
                    a cada segundo.
                  */}
                  {!janela?.encerrada && (
                    <div className="space-y-2">
                      <button
                        type="button"
                        id={ALVO_DO_BOTAO_INICIAR}
                        className={cn(
                          'ios-botao ios-botao-g relative w-full overflow-hidden',
                          canStart && !botaoTravado && 'exam-botao-chama',
                        )}
                        onClick={() => {
                          if (canStart) handleStartExam()
                          else setInWaitingRoom(true)
                        }}
                        disabled={botaoTravado}
                      >
                        {canStart && !botaoTravado && <Play className="h-4 w-4 fill-current" />}
                        {portaFechada && <Lock className="h-4 w-4" />}
                        {rotuloDoBotao}
                      </button>
                      {oQueFalta && <p className="text-center text-[13px] ios-rotulo-2">{oQueFalta}</p>}
                      {!canStart && !portaFechada && !oQueFalta && (
                        <p className="text-center text-[13px] ios-rotulo-2">
                          A prova ainda não começou. Na sala você espera com a contagem regressiva.
                        </p>
                      )}
                    </div>
                  )}

                  {/*
                    ═══ O que sobra de uma prova encerrada ═══

                    Para quem fez, para quem faltou, para quem só queria o
                    caderno: os arquivos que o admin libera em "Aplicação da
                    prova" e o treino. As duas coisas que ainda dá para fazer
                    com uma prova que acabou: baixá-la e refazê-la.
                  */}
                  {janela?.encerrada && (
                    <div className="space-y-3">
                      {/* O treino é a única AÇÃO aqui — o resto são arquivos. */}
                      {treinoLiberado && (
                        <button
                          type="button"
                          className="ios-botao ios-botao-g w-full"
                          onClick={() => router.push(enderecoDoTreino(String(id)))}
                        >
                          <Play className="h-4 w-4 fill-current" />
                          Praticar esta prova
                        </button>
                      )}
                      <ul className="ios-lista" style={{ '--ios-recuo': '60px' } as React.CSSProperties}>
                        <li>
                          <button type="button" className="ios-linha w-full text-left" onClick={() => router.push(`/exam/${id}/results`)}>
                            <span className="pv-icone-linha" data-tom="ambar"><Trophy className="h-4 w-4" /></span>
                            <span className="flex-1 text-[16px]">Ver resultados</span>
                            <ChevronRight className="h-5 w-5 ios-rotulo-3" />
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            className="ios-linha w-full text-left disabled:opacity-50"
                            disabled={!!pdfGenerating}
                            title={downloads.prova.motivo || undefined}
                            onClick={handleDownloadExamPDF}
                          >
                            <span className="pv-icone-linha"><FileDown className="h-4 w-4" /></span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[16px]">Prova em branco</span>
                              {downloads.prova.motivo && !downloads.prova.permitido && (
                                <span className="block text-[12.5px] ios-rotulo-3">{downloads.prova.motivo}</span>
                              )}
                            </span>
                            {pdfGenerating === 'Prova' ? <Carregando /> : <span className="text-[13px] ios-rotulo-3">PDF</span>}
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            className="ios-linha w-full text-left disabled:opacity-50"
                            disabled={!!pdfGenerating}
                            title={downloads.gabarito.motivo || undefined}
                            onClick={baixarGabaritoComentado}
                          >
                            <span className="pv-icone-linha" data-tom="azul"><BookOpen className="h-4 w-4" /></span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[16px]">Resposta comentada</span>
                              {downloads.gabarito.motivo && !downloads.gabarito.permitido && (
                                <span className="block text-[12.5px] ios-rotulo-3">{downloads.gabarito.motivo}</span>
                              )}
                            </span>
                            {pdfGenerating === 'Comentado' ? <Carregando /> : <span className="text-[13px] ios-rotulo-3">PDF</span>}
                          </button>
                        </li>
                      </ul>
                      <p className="px-1 text-[12.5px] leading-snug ios-rotulo-3">
                        {treinoLiberado
                          ? 'Praticar refaz as mesmas questões com correção na hora, quantas vezes você quiser — sem alterar a sua nota nem a classificação da turma.'
                          : 'Um arquivo indisponível diz o motivo: pode ser o seu plano, ou uma liberação que o professor ainda não abriu.'}
                      </p>
                    </div>
                  )}

                  <PdfCtaBanner accountType={accountType} isAdmin={userRole === 'admin'} compact />
                </div>

                {/* No celular e no tablet os portões vêm depois do começar,
                    para o botão não ficar a três telas de rolagem. */}
                {temPainelDePortoes && (
                  <div className="lg:hidden">
                    <ExamGateStatus janela={janela!} />
                  </div>
                )}
              </div>
            </div>

            <ExamBrandFooter className="mt-10" />
          </div>
        </FundoIos>
      </>
    )
  }

  // Sala de espera
  if (!started && inWaitingRoom) {
    const travadoNaSala = !canStart || (exam.requireSignature && !signature) || inicioBloqueadoPorProgresso(retomada)
    return (
      <>
        {proctoringModal}
        {avisoDeInicio}
        <FundoIos className="min-h-[100dvh] flex-1">
          <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-[calc(8px+env(safe-area-inset-top))] sm:px-6">
            {topoDaPorta('Sair', () => {
              setInWaitingRoom(false)
              router.push('/')
            })}

            <div className="mt-6 space-y-6 text-center sm:mt-10">
              <div className="pv-entra space-y-2">
                <p className="inline-flex items-center gap-2 text-[14px] font-semibold ios-tinta">
                  <span className="vidro-ponto" aria-hidden />
                  Sala de espera
                </p>
                <h1 className="ios-titulo-grande">{exam.title}</h1>
                <p className="text-[16px] ios-rotulo-2">
                  Bem-vindo(a), <strong className="font-semibold text-[var(--ios-rotulo)]">{userName}</strong>. A prova
                  começa em:
                </p>
              </div>

              {/* A contagem: a tela em que a pessoa fica mais tempo parada
                  olhando, então os números são grandes e não pulam (tabulares). */}
              <div className="pv-entra ios-cartao rounded-[28px] px-4 py-7 sm:py-9" style={{ '--pv-ordem': 1 } as React.CSSProperties}>
                <Countdown variante="ios" targetDate={new Date(exam.startTime)} onComplete={() => setCanStart(true)} />
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {janela && janela.fase !== 'livre' ? (
                <ExamGateStatus janela={janela} />
              ) : (
                <div className="ios-cartao rounded-[22px] py-4">
                  <div className="ios-faixa">
                    <div>
                      <span className="ios-faixa-rotulo">Início</span>
                      <span className="ios-faixa-valor text-[17px]" style={{ color: 'var(--ios-rotulo)' }}>
                        {formatDate(exam.startTime)}
                      </span>
                    </div>
                    <div>
                      <span className="ios-faixa-rotulo">Término</span>
                      <span className="ios-faixa-valor text-[17px]" style={{ color: 'var(--ios-rotulo)' }}>
                        {formatDate(exam.endTime)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Assinatura — opcional se requireSignature for false */}
              {exam.requireSignature !== false && (
                <div id={ALVO_DA_ASSINATURA} className="pv-painel p-5 sm:p-6">
                  <SignaturePad
                    onSignatureChange={setSignature}
                    valorInicial={signature}
                    label={exam.requireSignature ? 'Assinatura digital' : 'Assinatura digital (opcional)'}
                  />
                </div>
              )}

              {/* O PDF só aparece quando a prova começar */}
              {exam.pdfUrl && canStart && (
                <button type="button" className="ios-botao-cinza w-full" onClick={() => window.open(exam.pdfUrl, '_blank')}>
                  <FileDown className="h-4 w-4" />
                  Baixar o PDF da prova
                </button>
              )}

              {/*
                O botão que a pessoa está esperando — às vezes por vinte
                minutos. `exam-botao-chama` pulsa o halo e passa um brilho por
                cima, e a classe é aplicada SÓ quando ele está de fato
                clicável. Ver app/globals.css.
              */}
              <div className="space-y-2">
                <button
                  type="button"
                  id={ALVO_DO_BOTAO_INICIAR}
                  className={cn('ios-botao ios-botao-g relative w-full overflow-hidden', !travadoNaSala && 'exam-botao-chama')}
                  onClick={handleStartExam}
                  // `inicioBloqueadoPorProgresso`: começar do zero por cima de
                  // um rascunho que não pode ser retomado apagaria as respostas
                  // que a própria tela promete preservar.
                  disabled={!!travadoNaSala}
                >
                  {inicioBloqueadoPorProgresso(retomada) ? (
                    'Retomada já utilizada'
                  ) : exam.requireSignature && !signature ? (
                    'Assine para iniciar'
                  ) : canStart ? (
                    <>
                      <Play className="h-4 w-4 fill-current" />
                      Iniciar prova agora
                    </>
                  ) : (
                    'Aguardando o início…'
                  )}
                </button>
                <p className="text-center text-[13px] ios-rotulo-2">
                  {canStart
                    ? exam.requireSignature && !signature
                      ? 'A prova já começou. Assine acima para entrar.'
                      : 'A prova começou. Boa prova!'
                    : 'O botão libera sozinho quando a contagem chegar a zero. Pode deixar esta tela aberta.'}
                </p>
              </div>

              <ExamBrandFooter />
            </div>
          </div>
        </FundoIos>
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

  // ─── Estado da navegação paginada ───
  const isLastQuestion = currentQuestionIndex === exam.questions.length - 1
  const showCheckAnswerButton =
    exam?.feedbackMode === 'immediate' &&
    ((exam as any).isPersonalExam || exam.isPracticeExam || emTreino) &&
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

  const travas = travasDaProva(exam)
  const travasAtivas = started && !submitted
  const totalDeQuestoes = exam.questions.length
  const naoRespondidas = getUnansweredQuestions()
  const fracaoRespondida = totalDeQuestoes ? answeredCount / totalDeQuestoes : 0
  const rotuloDoSalvamento =
    salvandoProgresso === 'salvando' ? 'Salvando…' : salvandoProgresso === 'erro' ? 'Falha ao salvar' : 'Salvo'
  const dicaDoSalvamento =
    salvandoProgresso === 'erro'
      ? 'A última gravação falhou. Suas respostas continuam nesta tela e a próxima tentativa é automática.'
      : 'Suas respostas são gravadas automaticamente. Se você cair, dá para continuar.'

  // O que cada questão faz com o toque, a digitação e o grifo — o mesmo nos
  // dois modos (paginado e rolagem), que antes tinham cada um a sua cópia.
  const acoesDaQuestao = (question: Question): AcoesDaQuestao => ({
    onEscolher: (alternativaId) => handleSelectAlternative(question.id, alternativaId),
    onRiscar: (alternativaId) => handleToggleCross(question.id, alternativaId),
    onGrifos: (grifos) => handleHighlights(question.id, grifos),
    onDiscursiva: (texto) => handleDiscursiveText(question.id, texto),
    onRedacao: (texto) => handleEssayText(question.id, texto),
    onAutoavaliar: (nota) =>
      setAnswers(prev => prev.map(a => (a.questionId === question.id ? { ...a, discursiveSelfScore: nota } : a))),
    onCopiarPrompt: () => handleCopyDiscursivePrompt(question, answers.find(a => a.questionId === question.id)),
    onAlternarComentada: () =>
      setRevealedExplanations(prev => {
        const next = new Set(prev)
        if (next.has(question.id)) next.delete(question.id)
        else next.add(question.id)
        return next
      }),
    onAmpliar: (src) => setExamImageModal({ src }),
  })

  const rotuloDoTipo = (tipo: Question['type']) =>
    tipo === 'multiple-choice' ? 'Múltipla escolha' : tipo === 'discursive' ? 'Discursiva' : 'Redação'

  const cabecaDaQuestao = (question: Question) => (
    <div className="pv-questao-cabeca">
      <div className="min-w-0 flex-1">
        <h2 className="pv-questao-numero">
          Questão {question.number}
          <small>de {totalDeQuestoes}</small>
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="pv-etiqueta">{rotuloDoTipo(question.type)}</span>
          {question.timePerQuestionSeconds ? (
            <span className="pv-etiqueta" data-tom="ambar">
              <Clock className="h-3 w-3" /> Tempo próprio
            </span>
          ) : null}
          {paletteQuestions[exam.questions.indexOf(question)]?.answered && (
            <span className="pv-etiqueta" data-tom="tinta">
              <Check className="h-3 w-3" /> Respondida
            </span>
          )}
        </div>
      </div>
      {!exam?.isPersonalExam && (
        <button
          type="button"
          className="pv-redondo"
          onClick={() => setReportQuestionId(question.id)}
          title="Relatar erro na questão"
          aria-label={`Relatar erro na questão ${question.number}`}
        >
          <Flag className="h-[18px] w-[18px]" />
        </button>
      )}
    </div>
  )

  return (
    /*
      As travas de cópia desta prova, se o admin ligou alguma.

      São duas camadas, porque há dois caminhos de copiar. O `EscudoAntiCola`
      cuida do navegador (Ctrl+C, arrastar, menu do botão direito, impressão);
      o `ProvedorAntiCola` cuida do menu do PRÓPRIO site — aquele que aparece
      ao selecionar o enunciado, com grifo, estilos e um "Copiar" que usa
      `navigator.clipboard` e por isso escapa de qualquer bloqueio de evento.
      Sem a segunda camada a prova ficava com o atalho barrado e o botão de
      copiar funcionando do lado.

      As duas só valem com a prova em andamento e antes da entrega: na sala de
      espera e na tela de resultado não há enunciado para proteger, e travar
      ali só atrapalharia quem quer copiar o próprio resultado.
    */
    <ProvedorAntiCola travas={travas} ativo={travasAtivas}>
      <EscudoAntiCola
        travas={travas}
        ativo={travasAtivas}
        aoBloquear={(mensagem) => showToastMessage(mensagem, 'info')}
      />
      {proctoringModal}
      <FundoIos className="min-h-[100dvh] flex-1">
      <div
        className="min-h-screen"
        // A barra do polegar ocupa o rodapé nos dois modos: o botão de
        // anotação sobe acima dela, sem encostar.
        style={{ '--anotacao-espaco-inferior': 'calc(5.75rem + env(safe-area-inset-bottom))' } as React.CSSProperties}
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
        Prova já finalizada, descoberta com a prova aberta na tela.

        O caminho normal de quem já entregou é o retorno antecipado lá em cima,
        que devolve a MESMA tela sem a prova por trás. Este sobreposto atende o
        caso em que a entrega só é conhecida depois — a verificação chega em
        segundo plano — e aí a prova já está montada atrás dele.

        O cartão anunciava uma proibição — "Prova Já Realizada! Você já realizou
        esta prova. Não é possível refazê-la." —, que é a leitura mais fria
        possível de alguém acabar de terminar uma prova. Quem chega aqui
        terminou: a primeira frase é sobre o que ele fez, e a primeira ação é
        para onde ele quer ir, o próprio resumo.
      */}
      {alreadySubmitted && !exam?.isPracticeExam && !emTreino && (
        <ExamJaFinalizada
          variante="modal"
          exam={exam}
          examId={String(id)}
          userId={userId}
          userName={userName || loggedUserName}
          encerrada={!!janela?.encerrada}
          downloads={downloads}
          onErro={(mensagem) => showToastMessage(mensagem)}
          onPlanoBloqueado={() => setShowPdfCta(true)}
        />
      )}

      {/* Aviso de tempo por questão: fica 3 segundos e a prova começa sozinha. */}
      {showTimeWarningPopup && (
        <Folha
          largura="sm"
          camada={110}
          icone={
            <span className="pv-icone-linha h-11 w-11 rounded-full" data-tom="ambar">
              <Clock className="h-5 w-5" />
            </span>
          }
          titulo="Esta prova tem tempo por questão"
          subtitulo="Algumas questões têm um limite próprio."
        >
          <div className="space-y-5 pb-2">
            <p className="text-[15px] leading-relaxed ios-rotulo-2">
              Quando o tempo de uma questão acaba, ela é enviada com a resposta que estiver marcada e a prova passa
              para a seguinte. Não dá para voltar a uma questão anterior.
            </p>
            <div className="text-center" aria-live="polite">
              <p className="pv-nota-grande ios-ambar" style={{ fontSize: 64 }}>
                {timeWarningCountdown}
              </p>
              <p className="mt-2 text-[14px] ios-rotulo-2">
                A prova começa em {timeWarningCountdown} segundo{timeWarningCountdown !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </Folha>
      )}

      <header className="pv-topo">
        <div className="relative mx-auto w-full max-w-5xl px-3 sm:px-5">
          <div className="pv-topo-linha">
            {/* Saída para a tela inicial — durante a prova ela passa pela
                confirmação, porque sair aqui descarta o que ainda não foi enviado. */}
            <button
              type="button"
              className="pv-redondo"
              onClick={() => setShowExitConfirm(true)}
              title="Sair da prova"
              aria-label="Sair da prova"
            >
              <X className="h-[18px] w-[18px]" />
            </button>

            {/* A capa em miniatura, ao lado do título, durante a prova toda. */}
            {exam.coverImage && (
              <div className="relative hidden h-10 w-10 shrink-0 overflow-hidden rounded-[11px] bg-[var(--ios-preenchimento)] sm:block">
                <CoverImage src={exam.coverImage} alt="" sizes="40px" priority />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="pv-topo-titulo">
                {exam.title}
              </p>
              <p className="pv-topo-sub">
                <span>
                  {isScrollMode
                    ? `${answeredCount} de ${totalDeQuestoes} respondidas`
                    : `Questão ${currentQuestionIndex + 1} de ${totalDeQuestoes}`}
                </span>
                {/*
                  O selo de gravação automática.

                  Ele existe para uma pessoa só: a que está com a internet
                  oscilando e não sabe se perder a conexão custa a prova. Sem
                  esse sinal, a resposta honesta era "não custa, mas confie" — e
                  no meio de uma prova ninguém confia. Fica discreto enquanto
                  tudo vai bem e fica vermelho quando a gravação falha, que é o
                  único momento em que ele precisa ser lido.
                */}
                {salvandoProgresso && (
                  <span
                    className={cn('inline-flex items-center gap-1.5', salvandoProgresso === 'erro' && 'ios-erro font-semibold')}
                    title={dicaDoSalvamento}
                    role="status"
                  >
                    <span aria-hidden>·</span>
                    <span className="pv-ponto" data-estado={salvandoProgresso} aria-hidden />
                    {/* No celular estreito o ponto basta enquanto tudo vai bem;
                        a falha sempre vem escrita. */}
                    <span className={salvandoProgresso === 'erro' ? '' : 'sr-only min-[400px]:not-sr-only'}>
                      {rotuloDoSalvamento}
                    </span>
                  </span>
                )}
              </p>
            </div>

            {/* A sequência de acertos (feedback imediato) */}
            {exam?.feedbackMode === 'immediate' && streak >= 3 && (
              <div
                className={cn('pv-capsula ios-ambar', streakJustIncremented && 'ios-pulo')}
                style={{ background: 'var(--ios-ambar-suave)' }}
                title={`${streak} acertos seguidos`}
                aria-label={`${streak} acertos seguidos`}
              >
                <Flame className="h-4 w-4" />
                <span className="font-bold">{streak}</span>
              </div>
            )}

            {/* Tempo da questão atual */}
            {questionTimeRemaining !== null && questionTimerActive && (
              <div
                className="pv-relogio"
                data-nivel={questionTimeRemaining <= 30 ? 'urgente' : questionTimeRemaining <= 60 ? 'atencao' : 'normal'}
                title="Tempo desta questão"
                role="timer"
              >
                <Clock className="h-4 w-4 opacity-70" aria-hidden />
                <span>
                  {Math.floor(questionTimeRemaining / 3600) > 0 && `${Math.floor(questionTimeRemaining / 3600)}:`}
                  {String(Math.floor((questionTimeRemaining % 3600) / 60)).padStart(2, '0')}:
                  {String(questionTimeRemaining % 60).padStart(2, '0')}
                </span>
                <small className="hidden lg:inline">nesta questão</small>
              </div>
            )}

            {/* Sem `onTimeUp`: quem encerra a prova é a vigília lá em cima,
                uma só. Este cronômetro só desenha o tempo — e desenha pelo
                relógio do servidor. */}
            {examDeadline && <ExamTimer endTime={examDeadline} desvioDoRelogio={desvioDoRelogio} />}

            {/* Do tablet para cima, os controles ficam à mostra. (A
                visibilidade mora num invólucro: as classes `pv-*` definem
                `display` e venceriam o `hidden` do Tailwind.) */}
            <div className="hidden shrink-0 items-center gap-2 md:flex">
              <button
                type="button"
                className="pv-capsula"
                onClick={() => setShowUnansweredModal(true)}
                title="Questões sem resposta"
              >
                {naoRespondidas.length > 0 ? (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    {naoRespondidas.length} sem resposta
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 ios-tinta" />
                    Tudo respondido
                  </>
                )}
              </button>
              <button
                type="button"
                className="pv-redondo"
                onClick={handleDownloadExamPDF}
                title="Baixar a prova em PDF"
                aria-label="Baixar a prova em PDF"
              >
                <FileDown className="h-[18px] w-[18px]" />
              </button>
              <ThemeToggle variant="icon" />
            </div>

            {/* A marca: quem vê um print sabe de onde a prova veio. */}
            <ExamBrandBadge compact className="shrink-0" />

            {/* No celular, o resto mora num menu. */}
            <div className="relative md:hidden">
              <button
                type="button"
                className="pv-redondo"
                onClick={() => setMenuDaProvaAberto(aberto => !aberto)}
                aria-expanded={menuDaProvaAberto}
                aria-haspopup="menu"
                aria-label={`Mais opções${naoRespondidas.length ? ` (${naoRespondidas.length} sem resposta)` : ''}`}
              >
                <MoreHorizontal className="h-5 w-5" />
                {naoRespondidas.length > 0 && <span className="pv-contador">{naoRespondidas.length}</span>}
              </button>
              {menuDaProvaAberto && (
                <>
                  <div className="fixed inset-0 z-[55]" aria-hidden onClick={() => setMenuDaProvaAberto(false)} />
                  <div className="pv-menu" role="menu">
                    <button
                      type="button"
                      role="menuitem"
                      className="ios-linha w-full text-left text-[16px]"
                      onClick={() => {
                        setMenuDaProvaAberto(false)
                        setShowUnansweredModal(true)
                      }}
                    >
                      <AlertCircle className="h-5 w-5 ios-ambar" />
                      <span className="flex-1">Sem resposta</span>
                      <span className="font-semibold tabular-nums ios-rotulo-2">{naoRespondidas.length}</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="ios-linha w-full text-left text-[16px]"
                      onClick={() => {
                        setMenuDaProvaAberto(false)
                        handleDownloadExamPDF()
                      }}
                    >
                      <FileDown className="h-5 w-5 ios-tinta" />
                      <span className="flex-1">Baixar a prova em PDF</span>
                    </button>
                    <div className="ios-linha text-[16px]">
                      <span className="flex-1">Aparência</span>
                      <ThemeToggle />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          {/* Progresso como filete sob a barra: informa sem roubar altura. */}
          <div
            className="pv-filete"
            style={{ '--pv-progresso': fracaoRespondida } as React.CSSProperties}
            role="progressbar"
            aria-label="Questões respondidas"
            aria-valuemin={0}
            aria-valuemax={totalDeQuestoes}
            aria-valuenow={answeredCount}
          >
            <span />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-3 pt-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] sm:px-5 sm:pt-6 lg:pt-8">
        {isScrollMode ? (
          /* Modo rolagem — todas as questões, uma embaixo da outra */
          <div className="space-y-4 sm:space-y-6">
            {exam.questions.map((question) => {
              const answer = answers.find(a => a.questionId === question.id)
              return (
                <article
                  key={question.id}
                  id={`question-${question.id}`}
                  className="pv-questao scroll-mt-24"
                  aria-label={`Questão ${question.number}`}
                >
                  {cabecaDaQuestao(question)}
                  <div className="pv-questao-corpo">
                    <InlineAnnotationCanvas
                      questionId={question.id}
                      questionNumber={question.number}
                      annotation={getAnnotationForQuestion(question.id)}
                      onChange={handleSaveAnnotation}
                    >
                      <CorpoDaQuestao
                        questao={question}
                        resposta={answer}
                        trancada={exam?.feedbackMode === 'immediate' && lockedQuestions.has(question.id)}
                        promptCopiado={copiedPromptId === question.id}
                        comentadaAberta={revealedExplanations.has(question.id)}
                        mostrarAtalhos={false}
                        acoes={acoesDaQuestao(question)}
                      />
                    </InlineAnnotationCanvas>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          /* Modo paginado — uma questão por vez */
          <article
            ref={questionCardRef}
            className="pv-questao scroll-mt-24"
            aria-label={`Questão ${currentQuestion.number} de ${totalDeQuestoes}`}
          >
            {cabecaDaQuestao(currentQuestion)}
            <div className="pv-questao-corpo">
              <InlineAnnotationCanvas
                questionId={currentQuestion.id}
                questionNumber={currentQuestion.number}
                annotation={getAnnotationForQuestion(currentQuestion.id)}
                onChange={handleSaveAnnotation}
              >
                {/* A questão nova assenta no lugar da anterior. */}
                <div key={currentQuestion.id} className="pv-troca space-y-6">
                  {/* O código individual: identifica o aluno em qualquer print
                      da questão, numa faixa fina em vez de um bloco no alto. */}
                  <div className="pv-codigo">
                    <Barcode
                      value={`${id}-${userName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}`}
                      height={34}
                      width={1.3}
                      displayValue={false}
                    />
                    <p>
                      <strong>Código individual</strong>
                      Prova {id.substring(0, 8)} · {userName}
                    </p>
                  </div>

                  <CorpoDaQuestao
                    questao={currentQuestion}
                    resposta={currentAnswer}
                    trancada={exam?.feedbackMode === 'immediate' && lockedQuestions.has(currentQuestion.id)}
                    promptCopiado={copiedPromptId === currentQuestion.id}
                    comentadaAberta={revealedExplanations.has(currentQuestion.id)}
                    mostrarAtalhos
                    acoes={acoesDaQuestao(currentQuestion)}
                  />
                </div>
              </InlineAnnotationCanvas>
            </div>
          </article>
        )}
      </main>

      {/*
        ─── A barra do polegar ───

        Uma cápsula de vidro no rodapé, nos dois modos: voltar, a posição (que
        abre o mapa de questões) e a ação da vez — próxima, verificar ou
        finalizar. Fica sempre ao alcance do polegar: o "Próxima" não depende
        de rolar até o fim do enunciado, das alternativas e do gabarito, e o
        mapa não é mais um segundo botão flutuante empilhado sobre ela.
      */}
      <nav
        className="pv-barra ios-vidro"
        data-escondida={annotationModeActive}
        aria-label="Navegação da prova"
      >
        {!isScrollMode && (
          <button
            type="button"
            className="pv-redondo"
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={previousDisabled}
            title={hasTimedQuestions && currentQuestionIndex > 0 ? 'Não é possível voltar em provas com tempo por questão' : 'Questão anterior'}
            aria-label="Questão anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        <button
          type="button"
          className="pv-barra-mapa"
          onClick={() => setPaletaAberta(true)}
          aria-haspopup="dialog"
          aria-label={`Mapa de questões: ${answeredCount} de ${totalDeQuestoes} respondidas`}
        >
          <MiniAnel fracao={fracaoRespondida} />
          <span className="min-w-0 text-left">
            <strong>
              {isScrollMode ? `${answeredCount} de ${totalDeQuestoes}` : `${currentQuestionIndex + 1} de ${totalDeQuestoes}`}
            </strong>
            <small>{isScrollMode ? 'respondidas' : `${answeredCount} respondidas`}</small>
          </span>
          <LayoutGrid className="ml-auto hidden h-4 w-4 shrink-0 ios-rotulo-3 sm:block" aria-hidden />
        </button>

        {isScrollMode ? (
          <button type="button" className="ios-botao" onClick={handleSubmit} disabled={submitting}>
            <Send className="h-4 w-4" />
            {submitting ? 'Enviando…' : 'Finalizar'}
          </button>
        ) : showCheckAnswerButton ? (
          <button type="button" className="pv-botao-verificar" onClick={handleCheckAnswer}>
            <Check className="h-[18px] w-[18px]" />
            Verificar
          </button>
        ) : isLastQuestion ? (
          <button type="button" className="ios-botao" onClick={handleSubmit} disabled={submitting}>
            <Send className="h-4 w-4" />
            {submitting ? 'Enviando…' : 'Finalizar'}
          </button>
        ) : (
          <button
            type="button"
            className="ios-botao"
            onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
            disabled={nextDisabled}
            title={nextDisabled ? 'Responda a questão para continuar' : 'Próxima questão'}
          >
            {nextDisabled ? (
              <>
                <span className="sm:hidden">Responda</span>
                <span className="hidden sm:inline">Responda para seguir</span>
              </>
            ) : (
              'Próxima'
            )}
            <ChevronRight className="-mr-1 h-5 w-5" />
          </button>
        )}
      </nav>

      {/* Mapa de questões — abre pelo meio da barra */}
      {started && !entregaTravaATela && (
        <ExamQuestionPalette
          questions={paletteQuestions}
          currentIndex={currentQuestionIndex}
          onJump={handlePaletteJump}
          open={paletaAberta}
          onOpenChange={setPaletaAberta}
          isDisabled={(idx) => !isScrollMode && hasTimedQuestions && idx < currentQuestionIndex}
        />
      )}

      <ToastAlert
        open={toastOpen}
        onOpenChange={setToastOpen}
        message={toastMessage}
        type={toastType}
      />

      {/* Sair leva para a tela inicial e descarta o que não foi enviado */}
      {showExitConfirm && (
        <Folha
          largura="sm"
          onFechar={() => setShowExitConfirm(false)}
          icone={
            <span className="pv-icone-linha h-11 w-11 rounded-full" data-tom="ambar">
              <LogOut className="h-5 w-5" />
            </span>
          }
          titulo="Sair da prova?"
          subtitulo={
            <>
              Você respondeu <strong className="tabular-nums">{answeredCount} de {totalDeQuestoes}</strong>. Saindo
              agora nada é enviado — as respostas desta sessão são perdidas.
            </>
          }
          pe={
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                className="ios-botao-erro w-full sm:flex-1"
                onClick={() => {
                  setShowExitConfirm(false)
                  router.push('/')
                }}
              >
                Sair mesmo assim
              </button>
              <button type="button" className="ios-botao w-full sm:flex-1" onClick={() => setShowExitConfirm(false)} autoFocus>
                Continuar a prova
              </button>
            </div>
          }
        >
          {/* A prova já acabou: no treino não há cronômetro da turma correndo. */}
          {!exam.isPracticeExam && !(exam as any).isPersonalExam && !emTreino ? (
            <div className="pv-aviso">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" />
              O cronômetro da prova continua correndo enquanto você estiver fora.
            </div>
          ) : null}
        </Folha>
      )}

      {/* Questões sem resposta */}
      {showUnansweredModal && (
        <Folha
          largura="md"
          onFechar={() => setShowUnansweredModal(false)}
          titulo={naoRespondidas.length === 0 ? 'Tudo respondido' : 'Sem resposta'}
          subtitulo={
            naoRespondidas.length === 0
              ? 'Você respondeu todas as questões. Confira o que quiser e finalize.'
              : `${naoRespondidas.length} ${naoRespondidas.length === 1 ? 'questão ainda está' : 'questões ainda estão'} em branco.`
          }
        >
          {naoRespondidas.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="h-14 w-14 ios-tinta" />
              <p className="text-[15px] font-semibold ios-tinta">Todas as questões foram respondidas</p>
            </div>
          ) : (
            <ul className="ios-lista" style={{ '--ios-recuo': '64px' } as React.CSSProperties}>
              {naoRespondidas.map(({ question, index }) => {
                const bloqueada = !isScrollMode && hasTimedQuestions && index < currentQuestionIndex
                return (
                  <li key={question.id}>
                    <button
                      type="button"
                      className="ios-linha w-full text-left disabled:opacity-50"
                      disabled={bloqueada}
                      onClick={() => {
                        if (isScrollMode) {
                          // 'start': a questão começa pelo enunciado, no topo
                          // da tela (o `scroll-mt-24` cobre a barra de cima).
                          document.getElementById(`question-${question.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        } else {
                          setCurrentQuestionIndex(index)
                        }
                        setShowUnansweredModal(false)
                      }}
                    >
                      <span className="pv-num" data-tom="neutro">{question.number}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[16px] font-semibold">Questão {question.number}</span>
                        <span className="block text-[13px] ios-rotulo-2">{rotuloDoTipo(question.type)}</span>
                      </span>
                      <ChevronRight className="h-5 w-5 ios-rotulo-3" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Folha>
      )}

      {/* Feedback imediato (provas pessoais, de treino e o treino pós-término) */}
      {showFeedbackModal && feedbackData && (
        <Folha
          largura="xl"
          onFechar={() => {
            setShowFeedbackModal(false)
            setFeedbackData(null)
          }}
          icone={
            <span
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: feedbackData.isCorrect ? '#2f8a4f' : '#e5484d' }}
            >
              {feedbackData.isCorrect ? <Check className="h-6 w-6" /> : <X className="h-6 w-6" />}
            </span>
          }
          titulo={feedbackData.isCorrect ? 'Resposta correta' : 'Resposta incorreta'}
          subtitulo={
            feedbackData.isCorrect
              ? 'Boa. Compare seu raciocínio com o comentário antes de seguir.'
              : `A correta é a ${feedbackData.correctAlternative}. Veja no comentário onde o raciocínio desviou.`
          }
          pe={
            <button
              type="button"
              className="ios-botao ios-botao-g w-full"
              onClick={() => {
                setShowFeedbackModal(false)
                setFeedbackData(null)
                // Avançar para a próxima questão
                if (currentQuestionIndex < exam!.questions.length - 1) {
                  setCurrentQuestionIndex(currentQuestionIndex + 1)
                }
              }}
            >
              {currentQuestionIndex < exam!.questions.length - 1 ? (
                <>
                  Próxima questão <ChevronRight className="-mr-1 h-5 w-5" />
                </>
              ) : (
                'Fechar'
              )}
            </button>
          }
        >
          <div className="space-y-5">
            {feedbackData.statement && (
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center gap-2 py-1 pv-rotulo">
                  <ChevronRight className="pv-seta h-4 w-4 transition-transform group-open:rotate-90" />
                  Rever o enunciado
                </summary>
                <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed ios-rotulo-2">
                  {formatText(feedbackData.statement)}
                </p>
                {feedbackData.command && (
                  <p className="mt-3 whitespace-pre-wrap text-[15px] font-semibold leading-relaxed">
                    {formatText(feedbackData.command)}
                  </p>
                )}
              </details>
            )}

            {feedbackData.alternatives && feedbackData.alternatives.length > 0 && (
              <div className="pv-alts">
                {feedbackData.alternatives.map(alt => (
                  <AlternativaDeLeitura
                    key={alt.id}
                    letra={alt.letter}
                    texto={formatText(alt.text)}
                    correta={alt.isCorrect}
                    marcada={alt.letter === feedbackData.selectedAlternative}
                    comentario={
                      feedbackData.commentedFeedback?.explanations?.[alt.letter]
                        ? formatText(feedbackData.commentedFeedback.explanations[alt.letter])
                        : undefined
                    }
                  />
                ))}
              </div>
            )}

            {(feedbackData.explanation || (feedbackData.imagensDaResposta?.length || 0) > 0) && (
              <section className="pv-revela space-y-3 p-4 sm:p-5">
                <h3 className="flex items-center gap-2 text-[15px] font-semibold ios-ambar">
                  <BookOpen className="h-[18px] w-[18px]" /> Resposta comentada
                </h3>
                {feedbackData.explanation && <TextoComentado texto={feedbackData.explanation} />}
                <ImagensDaQuestao
                  imagens={feedbackData.imagensDaResposta || []}
                  layout={feedbackData.layoutDasImagensDaResposta}
                  onAmpliar={(src) => setExamImageModal({ src })}
                  alt="Imagem da resposta comentada"
                />
              </section>
            )}
          </div>
        </Folha>
      )}

      {/* Relatar erro — o botão da bandeira marcava a questão e nada abria:
          o modal só existia na tela de resultado. */}
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
      <PremiumPdfCtaModal open={showPdfCta} onClose={() => setShowPdfCta(false)} />
    </div>
    </FundoIos>
    </ProvedorAntiCola>
  )
}

/** O giro de "gerando" das linhas de download. */
function Carregando() {
  return <Loader2 className="h-[18px] w-[18px] shrink-0 animate-spin ios-rotulo-2" aria-label="Gerando" />
}
