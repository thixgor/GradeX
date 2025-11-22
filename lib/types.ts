export type ScoringMethod = 'normal' | 'tri'

export interface Alternative {
  id: string
  letter: string
  text: string
  isCorrect: boolean
}

export interface Question {
  id: string
  number: number
  statement: string
  statementSource?: string
  imageUrl?: string
  imageSource?: string
  command: string
  alternatives: Alternative[]
  // TRI parameters
  triDiscrimination?: number // parâmetro 'a'
  triDifficulty?: number // parâmetro 'b'
  triGuessing?: number // parâmetro 'c'
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

export interface UserAnswer {
  questionId: string
  selectedAlternative: string
  crossedAlternatives: string[]
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
