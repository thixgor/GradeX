export type ScoringMethod = 'normal' | 'tri' | 'discursive'
export type QuestionType = 'multiple-choice' | 'discursive' | 'essay'
export type AlternativeType = 'standard' | 'multiple-affirmative' | 'comparison' | 'assertion-reason' | 'mixed'
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

export type HighlightColor = 'yellow' | 'green' | 'cyan' | 'magenta' | 'red' | 'custom'
export type HighlightType = 'highlight' | 'strikethrough' | 'bold' | 'underline'

export interface TextHighlight {
  id: string
  text: string // Texto selecionado
  startOffset: number // Posição inicial no texto
  endOffset: number // Posição final no texto
  type: HighlightType // Tipo de marcação
  color?: HighlightColor // Cor (apenas para type === 'highlight')
  customColor?: string // Cor personalizada (se color === 'custom')
  target: 'statement' | 'command' // Onde foi aplicado o highlight
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
  timePerQuestionSeconds?: number // Tempo máximo em segundos para responder esta questão (opcional)
  explanation?: string // Resposta comentada (para provas pessoais)
  commentedFeedback?: {
    correctAlternative: string // Letra da alternativa correta
    explanations: {
      [key: string]: string // Explicação para cada alternativa (A, B, C, D, E, etc)
    }
  } // Feedback comentado pré-gerado durante criação (para provas pessoais)
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
  _id?: string | import('mongodb').ObjectId
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
  // Configurações adicionais
  isPracticeExam?: boolean // Prova prática/treino: múltiplas tentativas, sem datas obrigatórias
  allowCustomName?: boolean // Permitir que o aluno digite um nome diferente do nome de usuário
  requireSignature?: boolean // Exigir assinatura desenhada antes de iniciar
  shuffleQuestions?: boolean // Embaralhar a ordem das questões (não as alternativas)
  // Tempo por questão
  timeMode?: 'none' | 'generalized' | 'individual' // none: sem tempo, generalized: mesmo tempo para todas, individual: tempo diferente por questão
  generalizedTimeSeconds?: number // Tempo em segundos quando timeMode = 'generalized'
  // Sistema de grupos e provas pessoais
  groupId?: string // ID do grupo ao qual a prova pertence (null = página inicial)
  isPersonalExam?: boolean // Se é uma prova pessoal (criada por usuário, só visível para ele)
  aiQuestionsCount?: number // Quantidade de questões geradas por IA nesta prova (para controle de limites)
  feedbackMode?: 'end' | 'immediate' // Modo de feedback para provas pessoais: 'end' (ao final) ou 'immediate' (imediato)
  createdAt: Date
  updatedAt: Date
}

export type ExamGroupType = 'personal' | 'general' // Pessoal (criado por usuário) ou Geral (criado por admin)

export interface ExamGroup {
  _id?: string | import('mongodb').ObjectId
  name: string // Nome do grupo
  type: ExamGroupType // 'personal' ou 'general'
  description?: string // Descrição opcional
  color?: string // Cor do grupo (hex) para identificação visual
  icon?: string // Ícone opcional (emoji ou nome de ícone)
  createdBy: string // ID do usuário que criou (para grupos pessoais) ou admin (para gerais)
  createdByName: string // Nome de quem criou
  isPublic: boolean // Se false, só o criador vê (para grupos pessoais); se true, todos veem (grupos gerais)
  order?: number // Ordem de exibição
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
  // Highlights de texto no enunciado/comando
  highlights?: TextHighlight[]
}

export interface ExamSubmission {
  _id?: string | import('mongodb').ObjectId
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

export type AccountType = 'gratuito' | 'trial' | 'premium'
export type PremiumPlanType = 'teste' | 'mensal' | 'trimestral' | 'semestral' | 'vitalicio'
export type TrialPlanType = 'teste' | '7dias'

export interface User {
  _id?: string | import('mongodb').ObjectId
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
  // Sistema de assinaturas
  accountType?: AccountType // Tipo de conta (admin não tem accountType, só role)
  // Para Trial
  trialExpiresAt?: Date // Data de expiração do trial
  trialDuration?: number // Duração personalizada do trial em dias (padrão: 7)
  trialPlanType?: TrialPlanType // Tipo de plano trial (teste ou 7dias)
  trialActivatedAt?: Date // Data de ativação do trial
  // Para Premium
  premiumPlanType?: PremiumPlanType // Tipo de plano premium (teste, mensal, trimestral, semestral, vitalicio)
  premiumExpiresAt?: Date // Data de expiração do premium
  premiumActivatedAt?: Date // Data de ativação do premium
  premiumPrice?: number // Preço pago em R$
  // Stripe
  stripeCustomerId?: string // ID do cliente no Stripe
  stripeSubscriptionId?: string // ID da assinatura no Stripe
  // Limites de criação de provas pessoais e questões IA
  dailyPersonalExamsCreated?: number // Quantidade de provas pessoais criadas hoje
  dailyPersonalExamsRemaining?: number // Quantidade de provas pessoais restantes (para admin gerenciar)
  dailyAiQuestionsUsed?: number // Quantidade de questões IA usadas hoje
  lastDailyReset?: Date // Data do último reset diário (para limpar contadores)
  // Sistema de flashcards
  dailyFlashcardsGenerated?: number // Quantos decks/flashcards IA gerou no dia
  flashcardsActiveDecks?: number // Quantos decks ativos o usuário mantém
  flashcardsLastReset?: Date // Último reset diário dos limites de flashcards
  // Campos de autenticação social
  googleId?: string // ID do Google (sub)
  profilePicture?: string // URL da foto de perfil
}

export type FlashcardDifficultyFeedback = 'facil' | 'equilibrado' | 'porrada'

export interface FlashcardCardObjective {
  id: string
  text: string
}

export interface FlashcardCard {
  id: string
  deckId: string
  index: number
  front: string
  back: string
  hint: string
  objectives: FlashcardCardObjective[]
  createdAt: Date
  updatedAt: Date
}

export interface FlashcardDeck {
  _id?: string | import('mongodb').ObjectId
  userId: string
  userName: string
  title: string
  theme: string
  templateId?: string | import('mongodb').ObjectId
  difficultyPercentage: number
  randomDifficulty: boolean
  cardsRequested: number
  cardsGenerated: number
  accountTypeSnapshot: AccountType
  status: 'ativo' | 'concluido'
  dailySlot?: number
  createdAt: Date
  updatedAt: Date
}

export interface FlashcardSessionEntry {
  cardId: string
  difficulty: FlashcardDifficultyFeedback
  objectivesStruggled: string[]
  completedAt: Date
}

export interface FlashcardSession {
  _id?: string | import('mongodb').ObjectId
  deckId: string
  userId: string
  startedAt: Date
  finishedAt?: Date
  entries: FlashcardSessionEntry[]
  dominantObjectives?: string[]
}

export interface FlashcardTheme {
  _id?: string | import('mongodb').ObjectId
  title: string
  description?: string
  tags?: string[]
  defaultDifficulty?: number
  suggestedCardCount?: number
  contextHint?: string
  createdBy: string
  createdByName: string
  createdAt: Date
  updatedAt: Date
}

export type SerialKeyType = 'trial' | 'premium'
export type SerialKeyTrialSubtype = 'teste' | '7dias'
export type SerialKeyPremiumSubtype = 'teste' | 'mensal' | 'trimestral' | 'semestral' | 'vitalicio'

export interface SerialKey {
  _id?: string | import('mongodb').ObjectId
  key: string // A serial key em si (ex: XXXX-XXXX-XXXX-XXXX)
  type: SerialKeyType // 'trial' ou 'premium'
  // Subtipo específico
  trialSubtype?: SerialKeyTrialSubtype // Para trial: 'teste' (2 min) ou '7dias'
  premiumSubtype?: SerialKeyPremiumSubtype // Para premium: 'teste', 'mensal', 'trimestral', 'semestral', 'vitalicio'
  // Preço associado
  price?: number // Preço em R$ (para histórico)
  // Status
  used: boolean // Se já foi usada
  generatedBy: string // ID do admin que gerou
  generatedByName: string // Nome do admin
  generatedAt: Date
  usedBy?: string // ID do usuário que usou
  usedByName?: string // Nome do usuário que usou
  usedAt?: Date // Quando foi usada
}

export type ForumType = 'discussion' | 'materials' // Discussão ou Materiais

export interface ForumTopic {
  _id?: string | import('mongodb').ObjectId
  name: string // Nome do tópico
  description?: string // Descrição opcional
  forumType: ForumType // Se é para discussão ou materiais
  color?: string // Cor para identificação visual (hex)
  icon?: string // Ícone (emoji)
  createdBy: string // ID do admin que criou
  createdByName: string // Nome do admin
  order?: number // Ordem de exibição
  createdAt: Date
  updatedAt: Date
}

export interface ForumAttachment {
  type: 'image' | 'pdf'
  url: string // URL do arquivo (upload ou externa)
  name: string
  size: number // Tamanho em bytes
}

export interface ForumPost {
  _id?: string | import('mongodb').ObjectId
  forumType: ForumType
  topicId?: string // ID do tópico (opcional)
  title: string
  content: string // HTML rico do editor
  authorId: string
  authorName: string
  attachments: ForumAttachment[]
  tags: string[]
  commentsEnabled: boolean
  closed: boolean // Fechado por admin
  closedBy?: string // ID do admin que fechou
  closedByName?: string // Nome do admin que fechou
  closedAt?: Date
  edited: boolean
  editedAt?: Date
  premiumOnly?: boolean // Se true, apenas usuários premium podem ver (para materiais)
  createdAt: Date
  updatedAt: Date
}

export interface ForumComment {
  _id?: string | import('mongodb').ObjectId
  postId: string
  authorId: string
  authorName: string
  content: string // HTML rico
  createdAt: Date
  edited: boolean
  editedAt?: Date
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
  _id?: string | import('mongodb').ObjectId
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
  _id?: string | import('mongodb').ObjectId
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
  _id?: string | import('mongodb').ObjectId
  geminiApiKey?: string
  customContexts?: CustomContext[] // Contextos personalizados salvos
  updatedAt: Date
  updatedBy?: string
}

export interface ProctoringSession {
  _id?: string | import('mongodb').ObjectId
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

// Sistema de Anotações
export type DrawingTool = 'pen' | 'eraser' | 'highlighter' | 'text' | 'select'
export type EraserType = 'standard' | 'line' // padrão (circular) ou traço (linear)
export type SelectionMode = 'lasso' | 'rectangle' // seleção livre ou retangular

export interface Point {
  x: number
  y: number
}

export interface DrawingStroke {
  id: string
  tool: 'pen' | 'highlighter' // Caneta ou marca-texto
  points: Point[] // Pontos do traço
  color: string // Cor em formato hex
  thickness: number // Grossura/tamanho
  opacity?: number // Opacidade (para marca-texto)
}

export interface TextAnnotation {
  id: string
  text: string
  position: Point // Posição do canto superior esquerdo
  fontSize: number
  color: string
  width?: number // Largura da caixa de texto
  height?: number // Altura da caixa de texto
}

export interface QuestionAnnotation {
  questionId: string
  questionNumber: number
  strokes: DrawingStroke[] // Traços de caneta e marca-texto
  texts: TextAnnotation[] // Caixas de texto
  canvasDataUrl?: string // Snapshot do canvas para backup
}

// Configurações de Stripe
export interface StripeSettings {
  _id?: string | import('mongodb').ObjectId
  monthly: string
  quarterly: string
  'semi-annual': string
  annual: string
  lifetime: string
  updatedAt?: Date
  updatedBy?: string // ID do admin que atualizou
}
