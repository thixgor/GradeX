export type ScoringMethod = 'normal' | 'tri' | 'discursive'
export type QuestionType = 'multiple-choice' | 'discursive'
export type CorrectionMethod = 'manual' | 'ai'
export type CorrectionStatus = 'pending' | 'corrected'

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

export interface Question {
  id: string
  number: number
  type: QuestionType // 'multiple-choice' ou 'discursive'
  statement: string
  statementSource?: string
  imageUrl?: string
  imageSource?: string
  command: string
  // Para questões de múltipla escolha
  alternatives: Alternative[]
  // TRI parameters (apenas para múltipla escolha)
  triDiscrimination?: number // parâmetro 'a'
  triDifficulty?: number // parâmetro 'b'
  triGuessing?: number // parâmetro 'c'
  // Para questões discursivas
  keyPoints?: KeyPoint[]
  maxScore?: number // Nota máxima para questão discursiva
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
  keyPointsFound?: string[] // IDs dos pontos-chave identificados
}

export interface UserAnswer {
  questionId: string
  // Para questões de múltipla escolha
  selectedAlternative?: string
  crossedAlternatives?: string[]
  // Para questões discursivas
  discursiveText?: string
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
  submittedAt: Date
}

export interface User {
  _id?: string
  email: string
  password: string
  name: string
  role: 'admin' | 'user'
  createdAt: Date
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
  examId: string
  examTitle: string
  type: 'correction_ready' // Tipo de notificação
  message: string
  read: boolean
  createdAt: Date
}
