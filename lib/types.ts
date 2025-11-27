export type ScoringMethod = 'normal' | 'tri' | 'discursive'
export type QuestionType = 'multiple-choice' | 'discursive' | 'essay'
export type AlternativeType = 'standard' | 'multiple-affirmative' | 'comparison' | 'assertion-reason'
export type EssayStyle = 'enem' | 'uerj'
export type CorrectionMethod = 'manual' | 'ai'
export type CorrectionStatus = 'pending' | 'corrected'
export type ScreenCaptureMode = 'window' | 'screen' // Somente janela ou tela inteira
export type BanReason =
  | 'cheating' // Tentativa de fraude/cola
  | 'impersonation' // Falsificação de identidade
  | 'multiple_accounts' // Múltiplas contas
  | 'inappropriate_behavior' // Comportamento inadequado
  | 'security_violation' // Violação de segurança
  | 'abuse' // Abuso do sistema
  | 'other' // Outro motivo

export const BanReasonLabels: Record<BanReason, string> = {
  cheating: 'Tentativa de fraude ou cola',
  impersonation: 'Falsificação de identidade',
  multiple_accounts: 'Criação de múltiplas contas',
  inappropriate_behavior: 'Comportamento inadequado',
  security_violation: 'Violação de segurança',
  abuse: 'Abuso do sistema',
  other: 'Outro motivo'
}

export interface Alternative {
  id: string
  letter: string
  text: string
  isCorrect: boolean
}

export interface KeyPoint {
  id: string
  description: string
  weight: number // Peso deste ponto-chave (ex: 0.2 = 20% da nota)
}

export interface EssayCompetence {
  name: string
  score: number
  maxScore: number
  feedback: string
}

export interface Question {
  id: string
  number: number
  type: QuestionType // 'multiple-choice', 'discursive' ou 'essay'
  statement: string
  statementSource?: string
  imageUrl?: string
  imageSource?: string
  command: string
  // Para questões de múltipla escolha
  alternatives: Alternative[]
  alternativeType?: AlternativeType // Tipo de alternativa: 'standard', 'multiple-affirmative', 'comparison', 'assertion-reason'
  // TRI parameters (apenas para múltipla escolha)
  triDiscrimination?: number // parâmetro 'a'
  triDifficulty?: number // parâmetro 'b'
  triGuessing?: number // parâmetro 'c'
  // Para questões discursivas
  keyPoints?: KeyPoint[]
  maxScore?: number // Nota máxima para questão discursiva
  // Para redações (essay)
  essayStyle?: EssayStyle // 'enem' ou 'uerj'
  essayTheme?: string // Tema da redação
  essaySupportTexts?: string[] // Textos de apoio/motivadores
  essayCorrectionMethod?: CorrectionMethod // 'manual' ou 'ai'
  essayAiRigor?: number // Rigor da IA (0-1) para correção automática
}

export interface Exam {
  _id?: string
  title: string
  description?: string
  coverImage?: string
  numberOfQuestions: number
  numberOfAlternatives: number
  themePhrase?: string
  scoringMethod: ScoringMethod
  totalPoints?: number // para método normal
  questions: Question[]
  pdfUrl?: string
  gatesOpen?: Date
  gatesClose?: Date
  startTime: Date
  endTime: Date
  createdBy: string
  isHidden: boolean
  // Para questões discursivas
  discursiveCorrectionMethod?: 'manual' | 'ai' // Como corrigir questões discursivas
  aiRigor?: number // Rigor da IA (0-1) se usar correção automática
  // Modo de navegação da prova
  navigationMode?: 'paginated' | 'scroll' // paginated: navegação com botões, scroll: todas questões visíveis com scroll
  duration?: number // Duração da prova em minutos
  // Sistema de monitoramento (proctoring)
  proctoring?: {
    enabled: boolean
    camera: boolean
    audio: boolean
    screen: boolean
    screenMode?: ScreenCaptureMode // 'window' ou 'screen'
  }
  createdAt: Date
  updatedAt: Date
}

export interface Correction {
  questionId: string
  score: number // Nota obtida nesta questão
  maxScore: number // Nota máxima possível
  feedback: string // Feedback do corretor (manual ou IA)
  method: CorrectionMethod // 'manual' ou 'ai'
  correctedBy?: string // ID do admin que corrigiu (se manual)
  correctedAt: Date
  keyPointsFound?: string[] // IDs dos pontos-chave identificados (discursivas)
  // Para redações
  essayCompetences?: EssayCompetence[] // Notas por competência
  essayGeneralFeedback?: string // Feedback geral da redação
}

export interface UserAnswer {
  questionId: string
  // Para questões de múltipla escolha
  selectedAlternative?: string
  crossedAlternatives?: string[]
  // Para questões discursivas
  discursiveText?: string
  // Para redações (essay)
  essayText?: string
}

export interface ExamSubmission {
  _id?: string
  examId: string
  userId: string
  userName: string
  themeTranscription?: string
  answers: UserAnswer[]
  signature?: string
  score?: number
  triScore?: number
  // Para questões discursivas
  corrections?: Correction[]
  correctionStatus?: CorrectionStatus // 'pending' ou 'corrected'
  discursiveScore?: number // Soma das notas das questões discursivas
  startedAt?: Date // Quando o aluno iniciou a prova
  submittedAt: Date // Quando o aluno submeteu a prova
}

export interface User {
  _id?: string
  name: string
  email: string
  password: string
  role: 'admin' | 'user'
  createdAt: Date
  // Campos de banimento
  banned?: boolean
  banReason?: BanReason
  banDetails?: string // Detalhes adicionais sobre o banimento
  bannedBy?: string // ID do admin que baniu
  bannedAt?: Date
}

export interface TRICalculationInput {
  theta: number
  a: number
  b: number
  c: number
}

export interface TRIResult {
  userId: string
  userName: string
  triScore: number
}

export interface Notification {
  _id?: string
  userId: string
  examId?: string
  examTitle?: string
  ticketId?: string
  ticketTitle?: string
  type: 'correction_ready' | 'ticket_created' | 'ticket_reopened' // Tipo de notificação
  message: string
  read: boolean
  createdAt: Date
}

export type TicketStatus = 'open' | 'assigned' | 'resolved' | 'closed'

export interface TicketMessage {
  id: string
  senderId: string
  senderName: string
  senderRole: 'admin' | 'user'
  text: string
  sentAt: Date
  readAt?: Date // Quando foi lida
}

export interface Ticket {
  _id?: string
  userId: string
  userName: string
  userEmail: string
  title: string
  status: TicketStatus
  assignedTo?: string // ID do admin que pegou o ticket
  assignedToName?: string // Nome do admin
  messages: TicketMessage[]
  createdAt: Date
  updatedAt: Date
  resolvedAt?: Date
  closedAt?: Date
}

export interface CustomContext {
  id: string
  name: string
  description?: string
  createdAt: Date
}

export interface Settings {
  _id?: string
  geminiApiKey?: string
  customContexts?: CustomContext[] // Contextos personalizados salvos
  updatedAt: Date
  updatedBy?: string
}

export interface ProctoringSession {
  _id?: string
  examId: string
  examTitle: string
  userId: string
  userName: string
  submissionId?: string
  // Informações da prova
  numberOfQuestions: number
  totalPoints: number
  // Status da sessão
  isActive: boolean
  startedAt: Date
  endedAt?: Date
  // Alertas e infrações
  cameraBlackWarnings: number
  cameraBlackAt?: Date // Quando começou o problema
  forcedSubmit: boolean // Se foi submetido automaticamente por infração
  forcedSubmitReason?: string
  // Configurações de monitoramento ativas
  cameraEnabled: boolean
  audioEnabled: boolean
  screenEnabled: boolean
  screenMode?: ScreenCaptureMode
}
