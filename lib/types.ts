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
  discursiveCorrectionMethod?: 'manual' | 'ai' | 'prompt' // manual: correção externa; ai: IA; prompt: autoavaliação pelo aluno
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

export type ExamGroupCategory = 'faculdade' | 'plataforma'
export type ExamGroupCourse = 'medicina' | 'psicologia' | 'biomedicina' | 'odontologia' | string

export interface ExamGroup {
  _id?: string | import('mongodb').ObjectId
  name: string // Nome do grupo
  type: ExamGroupType // 'personal' ou 'general'
  category?: ExamGroupCategory // 'faculdade' (provas antigas da faculdade) ou 'plataforma'
  course?: ExamGroupCourse // Curso vinculado (ex: 'medicina')
  description?: string // Descrição opcional
  color?: string // Cor do grupo (hex) para identificação visual
  icon?: string // Ícone opcional (emoji ou nome de ícone)
  imageUrl?: string | null // URL de imagem de capa do grupo
  createdBy: string // ID do usuário que criou (para grupos pessoais) ou admin (para gerais)
  createdByName: string // Nome de quem criou
  isPublic: boolean // Se false, só o criador vê (para grupos pessoais); se true, todos veem (grupos gerais)
  parentGroupId?: string | null // ID do grupo pai para subgrupos (null = grupo raiz)
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
  discursiveSelfScore?: number // Auto-avaliação 0-100% em intervalos de 10%
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

export type AccountType = 'gratuito' | 'trial' | 'premium' | 'essential'
export type PremiumPlanType = 'teste' | 'mensal' | 'trimestral' | 'semestral' | 'vitalicio'
export type TrialPlanType = 'teste' | '7dias'

export interface User {
  _id?: string | import('mongodb').ObjectId
  name: string
  email: string
  password: string
  role: 'admin' | 'user'
  createdAt: Date
  lastLoginAt?: Date
  // Cargo secundário (independente do plano)
  secondaryRole?: 'monitor' // Monitor pode gerenciar aulas, tópicos, etc
  // Informações pessoais obrigatórias
  cpf?: string // CPF do usuário (único, obrigatório no cadastro)
  dateOfBirth?: Date // Data de nascimento (obrigatória no cadastro)
  // Informações sobre a instituição do estudante
  isAfyaMedicineStudent?: boolean // Se é estudante de Medicina
  afyaUnit?: string // Unidade/campus do estudante (se isAfyaMedicineStudent = true)
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
  // Provider de pagamento (Mercado Pago)
  mercadoPagoCustomerId?: string // ID do cliente (payer) no Mercado Pago
  mercadoPagoPreapprovalId?: string // ID da preapproval (assinatura) ativa
  // Legado Stripe (read-only, mantido por compat com registros antigos)
  /** @deprecated mantido apenas para leitura de registros legados */
  stripeCustomerId?: string
  /** @deprecated mantido apenas para leitura de registros legados */
  stripeSubscriptionId?: string
  // Limites de criação de provas pessoais e questões IA
  dailyPersonalExamsCreated?: number // Quantidade de provas pessoais criadas hoje
  dailyPersonalExamsRemaining?: number // Quantidade de provas pessoais restantes (para admin gerenciar)
  dailyAiQuestionsUsed?: number // Quantidade de questões IA usadas hoje
  lastDailyReset?: Date // Data do último reset diário (para limpar contadores)
  // Sistema de flashcards
  dailyFlashcardsGenerated?: number // Quantos decks/flashcards IA gerou no dia
  flashcardsActiveDecks?: number // Quantos decks ativos o usuário mantém
  flashcardsLastReset?: Date // Último reset diário dos limites de flashcards
  // Contadores vitais (total na vida da conta)
  totalCronogramasCreated?: number // Total de cronogramas criados (para cache)
  totalFlashcardsCreated?: number // Total de flashcards criados (para cache)
  totalFlashcardDecksCreated?: number // Total de decks criados (para cache)
  totalPersonalExamsCreated?: number // Total de provas pessoais criadas (para cache)
  // Campos de autenticação social
  googleId?: string // ID do Google (sub)
  profilePicture?: string // URL da foto de perfil
  // Banco de questões gratuito - questões fixas por período
  freeQuestionsByPeriod?: { [periodoId: string]: string[] } // Mapa: periodoId -> array de IDs de questões (5 questões por período)
  // Recuperação de senha
  resetPasswordToken?: string
  resetPasswordExpires?: Date
  // Verificação de Email
  emailVerified?: boolean
  verificationToken?: string
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

// ─── Sistema de Flashcards Manuais (criação manual por usuário/admin) ─────────

export type FlashcardManualOwnerType = 'user' | 'admin'
export type FlashcardManualVisibility = 'private' | 'public' | 'unlisted'
export type FlashcardManualPricing = 'free' | 'paid'
export type FlashcardManualCardKind = 'standard' | 'hidden_word'

export interface FlashcardManualCardSide {
  text: string
  image?: string
}

export interface FlashcardManualHiddenWord {
  // Frase com a palavra a ser descoberta. A palavra oculta aparece marcada
  // entre asteriscos duplos (**palavra**) ou referenciada no campo `word`.
  phrase: string
  word: string
  hint?: string
}

export interface FlashcardManualCard {
  _id?: string | import('mongodb').ObjectId
  deckId: string
  index: number
  kind: FlashcardManualCardKind
  front: FlashcardManualCardSide
  back: FlashcardManualCardSide
  hiddenWord?: FlashcardManualHiddenWord
  comment?: string // Resposta comentada
  createdAt: Date
  updatedAt: Date
}

export interface FlashcardManualDeck {
  _id?: string | import('mongodb').ObjectId
  slug: string
  ownerId: string
  ownerName: string
  ownerType: FlashcardManualOwnerType

  title: string
  description?: string
  coverImage?: string
  tags: string[]
  category?: string

  // Visibilidade e descoberta
  visibility: FlashcardManualVisibility
  isFeatured: boolean // Destaque na comunidade (apenas admin)

  // Monetização (apenas decks de admin podem ser pagos)
  pricing: FlashcardManualPricing
  price?: number
  stripePriceId?: string
  allowedGroups?: MaterialAccessGroup[] // restringir por plano (admin)

  // Vínculos
  folderId?: string | null // pasta do dono (organização pessoal)
  linkedMaterialId?: string | null // ID em /materiais quando vendido
  materialsFolderId?: string | null // Pasta em /materiais onde o material fica

  // Estatísticas
  cardCount: number
  viewCount: number
  studyCount: number
  likeCount: number

  // Controle
  isPublished: boolean // controla se aparece na comunidade quando public
  isHidden: boolean // admin pode esconder

  createdAt: Date
  updatedAt: Date
}

export interface FlashcardManualFolder {
  _id?: string | import('mongodb').ObjectId
  ownerId: string
  ownerType?: 'user' | 'admin'
  name: string
  color?: string
  icon?: string
  parentFolderId?: string | null
  order: number
  createdAt: Date
  updatedAt: Date
}

export type FlashcardManualShareStatus = 'pending' | 'accepted' | 'dismissed'

export interface FlashcardManualShare {
  _id?: string | import('mongodb').ObjectId
  deckId: string
  fromUserId: string
  fromUserName: string
  toUserId: string
  toUserEmail?: string
  status: FlashcardManualShareStatus
  message?: string
  createdAt: Date
  respondedAt?: Date
}

export interface FlashcardManualLike {
  _id?: string | import('mongodb').ObjectId
  deckId: string
  userId: string
  createdAt: Date
}

export type FlashcardSpacedRating = 'SUAVE' | 'NO_PONTO' | 'PORRETE'

export interface FlashcardSpacedProgress {
  _id?: string | import('mongodb').ObjectId
  userId: string
  cardId: string
  deckId: string
  rating: FlashcardSpacedRating
  reviewCount: number
  correctStreak: number
  easeFactor: number
  intervalDays: number
  nextReviewAt: Date
  lastReviewedAt: Date
  createdAt: Date
  updatedAt: Date
}

// Sessão de estudo de deck manual (estatística leve)
export interface FlashcardManualStudyEntry {
  cardId: string
  rating: 'facil' | 'equilibrado' | 'porrada'
  completedAt: Date
}

export interface FlashcardManualSession {
  _id?: string | import('mongodb').ObjectId
  deckId: string
  userId: string
  startedAt: Date
  finishedAt?: Date
  entries: FlashcardManualStudyEntry[]
}

export type SerialKeyType = 'trial' | 'premium' | 'custom'
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
  // Duração personalizada (para keys custom)
  customDurationDays?: number
  customDurationHours?: number
  customDurationMinutes?: number
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

export type ForumPostCreationFreezeMode =
  | 'off'
  | 'pause_all'
  | 'pause_all_except_admins'
  | 'pause_all_except_common_users'
  | 'pause_only_free_common'
  | 'pause_only_free_common_and_monitors'
  | 'pause_only_free_common_and_premium_common'

export interface ForumSettings {
  _id?: string | import('mongodb').ObjectId
  postCreationFreezeMode: ForumPostCreationFreezeMode
  updatedAt: Date
  updatedBy?: string
}

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

// Tipos para Aulas
export type AulaType = 'ao-vivo' | 'gravada'
export type AulaVisibility = 'premium' | 'gratuita'

export interface AulaSetor {
  _id?: string | import('mongodb').ObjectId
  nome: string
  descricao?: string
  imagem?: string
  ordem: number
  oculta?: boolean
  criadoEm: Date
  atualizadoEm: Date
}

export interface AulaTopic {
  _id?: string | import('mongodb').ObjectId
  setorId: string
  nome: string
  descricao?: string
  ordem: number
  oculta?: boolean
  criadoEm: Date
  atualizadoEm: Date
}

export interface AulaSubtopic {
  _id?: string | import('mongodb').ObjectId
  setorId: string
  topicoId: string
  nome: string
  descricao?: string
  ordem: number
  oculta?: boolean
  criadoEm: Date
  atualizadoEm: Date
}

export interface AulaModulo {
  _id?: string | import('mongodb').ObjectId
  setorId: string
  topicoId?: string
  subtopicoId?: string
  nome: string
  descricao?: string
  ordem: number
  oculta?: boolean
  criadoEm: Date
  atualizadoEm: Date
}

export interface AulaSubmodulo {
  _id?: string | import('mongodb').ObjectId
  setorId: string
  topicoId?: string
  subtopicoId?: string
  moduloId: string
  nome: string
  descricao?: string
  ordem: number
  oculta?: boolean
  criadoEm: Date
  atualizadoEm: Date
}

export interface AulaComentario {
  _id?: string | import('mongodb').ObjectId
  aulaId: string
  usuarioId: string
  nomeUsuario: string
  isAdmin: boolean
  conteudo: string
  criadoEm: Date
}

export interface AulaPostagem {
  _id?: string | import('mongodb').ObjectId
  titulo: string
  descricao?: string
  tipo: AulaType // 'ao-vivo' ou 'gravada'
  visibilidade: AulaVisibility // 'premium' ou 'gratuita'
  setorId?: string // Pode estar em um setor específico
  topicoId?: string
  subtopicoId?: string
  moduloId?: string
  submoduloId?: string // Novo: pode estar em um submódulo

  // Para aulas ao-vivo
  linkOuEmbed?: string // Link para entrada ou embed do vídeo

  // Para aulas gravadas
  videoEmbed?: string // Embed do vídeo

  // Capa da aula
  capa?: {
    tipo: 'imagem' | 'cor' // 'imagem' ou 'cor'
    imagem?: string // URL da imagem (se tipo === 'imagem')
    cor?: string // Cor de fundo em hex (se tipo === 'cor')
    titulo?: string // Título pequeno para exibir na capa (se tipo === 'cor')
  }

  // Botões de acesso (ex: Zoom, Meet, etc)
  botoesAcesso?: Array<{
    nome: string // Nome do botão (ex: "Entrar no Zoom", "Acessar")
    url: string // URL para acessar
  }>

  // Anexos
  pdfs?: Array<{
    nome: string
    url: string
    tamanho: number
  }>

  // Datas
  dataLiberacao: Date // Quando a aula será liberada para os alunos
  criadoEm: Date
  atualizadoEm: Date

  // Controle
  ocultarAteLiberacao?: boolean
  oculta: boolean
  ordem: number // Ordem de exibição na página inicial
  comentarios: AulaComentario[]

  // Conclusão por usuário
  usuariosConcluidos?: string[] // IDs de usuários que concluíram a aula
}

// Tipos para Planos/Pricing
export type PlanType = string // 'mensal' | 'trimestral' | 'semestral' | 'anual' | 'vitalicio' ou personalizados

export interface PlanConfig {
  _id?: string
  tipo: PlanType
  nome: string // ex: "DomineAqui PREMIUM"
  periodo: string // ex: "Plano Mensal"
  preco: number // Preço principal (ex: 24.90)
  precoOriginal?: number // Preço original com desconto (ex: 29.90)
  descricao?: string
  beneficios?: string[]
  oculto: boolean // Se true, não aparece em /buy
  ordem: number // Ordem de exibição
  destaque?: boolean // Se true, ganha destaque visual
  badge?: string // Texto do badge (ex: "MAIS POPULAR")
  role?: AccountType // Cargo que o usuário ganha (premium, essential, trial)
  durationMonths?: number // Duração em meses (0 ou undefined = infinito/vitalício)
  /** @deprecated Stripe foi removido — campo mantido só para leitura de planos antigos */
  stripePriceId?: string
  /** @deprecated Stripe foi removido */
  stripeOneTimePriceId?: string
  criadoEm: Date
  atualizadoEm: Date
}


export interface AdminSettings {
  _id?: string
  planos: PlanConfig[]
  criadoEm: Date
  atualizadoEm: Date
}

// === SISTEMA DE FORMULÁRIOS ===

export type FormBlockType = 'question' | 'text' | 'image' | 'video' | 'link'
export type FormQuestionType = 'short-text' | 'long-text' | 'email' | 'phone' | 'multiple-choice' | 'checklist'

export interface FormBlock {
  id: string
  type: FormBlockType
  // Conteúdo Comum
  title?: string // Enunciado da pergunta ou Título do card
  description?: string // Descrição auxiliar

  // Específico de Questão
  questionType?: FormQuestionType
  required?: boolean
  options?: string[] // Para múltipla escolha ou checklist

  // Específico de Mídia/Conteúdo
  content?: string // Texto do card, URL da imagem ou URL do vídeo
  linkUrl?: string // URL para o botão (tipo link)
  buttonText?: string // Texto do botão (tipo link)
}

export interface FormSettings {
  isActive: boolean
  deadline?: Date // Data de encerramento (horário de Brasília)
  sendConfirmationEmail: boolean
  emailQuestionId?: string // ID da pergunta que coleta o e-mail para envio da confirmação
  responseLimit?: number // Limite total de respostas
}

export interface Form {
  _id?: string | import('mongodb').ObjectId
  title: string
  description?: string
  blocks: FormBlock[]
  settings: FormSettings

  createdBy: string // ID do admin
  createdAt: Date
  updatedAt: Date

  // Cache
  responseCount: number
}

export interface FormResponse {
  _id?: string | import('mongodb').ObjectId
  formId: string
  answers: Record<string, string | string[]> // blockId -> resposta
  submittedAt: Date
  userEmail?: string // E-mail extraído da resposta (se configurado)
}

// === SISTEMA DE LEADS (CAPTURA DE LEADS) ===

export type LeadBlockType = 'text' | 'button' | 'card' | 'embed'
export type LeadEmbedType = 'video' | 'podcast' | 'audio'

export interface LeadBlock {
  id: string
  type: LeadBlockType
  // Para textos
  content?: string // Texto rico (HTML ou markdown)
  // Para botões
  buttonText?: string
  buttonUrl?: string // URL para PDF ou link externo
  buttonColor?: string // Cor do botão (hex)
  isPdfButton?: boolean // Se é um botão para abrir PDF
  // Para cards
  cardTitle?: string
  cardDescription?: string
  cardImageUrl?: string
  // Para embeds (videos, podcasts, audio)
  embedType?: LeadEmbedType
  embedUrl?: string // URL do embed (YouTube, Spotify, etc)
  embedTitle?: string
  embedDescription?: string
}

export interface LeadCampaign {
  _id?: string | import('mongodb').ObjectId
  name: string // Nome da campanha (ex: "E-book Estudos")
  slug: string // URL amigável (ex: "ebook-estudos")
  description?: string // Descrição opcional (para admin)
  imageUrl?: string // Imagem de capa opcional

  // Conteúdo do material
  welcomeMessage?: string // Mensagem inicial: "Aqui está o material, {nome}!"
  blocks: LeadBlock[] // Blocos de conteúdo
  collectButtonText?: string // Texto do botão de coleta final (padrão: "Receber Material")

  // Configurações de email
  sendEmail: boolean // Se deve enviar email com o material
  emailSubject?: string // Assunto do email
  emailBlocks?: LeadBlock[] // Blocos de conteúdo do email (pode ser diferente da página)

  // Status
  isActive: boolean

  // Métricas (caches)
  totalLeads: number // Total de leads coletados
  totalViews: number // Total de visualizações (IPs únicos)

  // Controle
  createdBy: string
  createdByName: string
  createdAt: Date
  updatedAt: Date
}

export interface Lead {
  _id?: string | import('mongodb').ObjectId
  campaignId: string // ID da campanha
  name: string // Nome do lead
  email: string // Email do lead
  emailSentAt?: Date // Quando o email foi enviado (se enviado)
  emailSent: boolean // Se o email já foi enviado para este lead
  createdAt: Date
}

export interface LeadPageView {
  _id?: string | import('mongodb').ObjectId
  campaignId: string
  ip: string // IP do visitante
  userAgent?: string // User agent do navegador
  viewedAt: Date
}

// ─── Doações Pix ──────────────────────────────────────────────
export type DoacaoStatus = 'pending' | 'approved' | 'rejected'

export interface Doacao {
  _id?: string | import('mongodb').ObjectId
  nomeCompleto: string      // Nome da conta bancária
  apelido: string           // Nome público no ranking
  valor: number             // Valor em R$
  mensagem?: string         // Mensagem opcional
  dataDoacao: Date          // Data da doação
  status: DoacaoStatus
  userId?: string           // ID do usuário autenticado (se houver)
  reviewedBy?: string       // Admin que aprovou/rejeitou
  reviewedAt?: Date
  addedByAdmin?: boolean    // true se adicionado manualmente pelo admin
  createdAt: Date
  updatedAt: Date
}

// ─── Sistema de Materiais (Marketplace) ──────────────────────

export type MaterialType = 'pdf' | 'video' | 'video_embed' | 'link' | 'image' | 'document' | 'other'

// Grupos de acesso disponíveis para restrição de materiais
export type MaterialAccessGroup = 'gratuito' | 'trial' | 'essential' | 'premium' | 'monitor'

export interface MaterialFolder {
  _id?: string | import('mongodb').ObjectId
  name: string
  description?: string
  coverImage?: string
  color?: string              // Cor hex para identificação visual
  icon?: string               // Emoji ou ícone
  parentFolderId?: string | null // Para subpastas (null = pasta raiz)
  moduloId?: string           // Módulo vinculado (opcional)
  order: number
  isHidden: boolean
  createdBy: string
  createdByName: string
  createdAt: Date
  updatedAt: Date
}

/** Metadados do PDF interno armazenado no Vercel Blob */
export interface MaterialPdfFile {
  /** Pathname no Vercel Blob — nunca expor ao cliente */
  blobPathname: string
  /** URL completa no Vercel Blob — nunca expor ao cliente */
  blobUrl: string
  /** Nome original do arquivo (sanitizado) */
  originalFilename: string
  /** Tamanho em bytes */
  sizeBytes: number
  /** userId do admin que fez o upload */
  uploadedBy: string
  /** Nome do admin que fez o upload */
  uploadedByName: string
  /** Data do upload */
  uploadedAt: Date
}

export interface Material {
  _id?: string | import('mongodb').ObjectId
  title: string
  description?: string
  coverImage?: string         // Capa do material
  type: MaterialType          // Tipo do arquivo
  downloadUrl: string         // Link externo (Google Drive, etc.) — opcional se pdfFile presente
  previewUrl?: string         // URL de preview (opcional)
  videoDuration?: number      // Duração em segundos (apenas para video e video_embed)
  folderId?: string | null    // Pasta onde o material está (null = raiz)
  moduloId?: string           // Módulo vinculado (opcional)
  tags: string[]              // Tags para busca

  // PDF interno (prioridade sobre downloadUrl para type === 'pdf')
  pdfFile?: MaterialPdfFile   // Presente quando admin fez upload direto
  pdfViewerEnabled?: boolean  // Permite abrir o viewer protegido
  pdfDownloadEnabled?: boolean // Permite baixar PDF protegido

  // Controle de acesso por grupo (vazio = todos podem acessar)
  allowedGroups?: MaterialAccessGroup[] // Ex: ['premium', 'essential'] = só premium e essential

  // Preço
  pricing: 'free' | 'paid'
  price?: number              // Preço em R$ (se paid)
  stripePriceId?: string      // ID do preço no Stripe (se paid)

  // Estatísticas
  downloadCount: number
  viewCount: number

  // Controle
  isHidden: boolean
  isFeatured: boolean         // Destaque na página
  order: number
  createdBy: string
  createdByName: string
  createdAt: Date
  updatedAt: Date
}

export interface MaterialPackage {
  _id?: string | import('mongodb').ObjectId
  title: string
  description?: string
  coverImage?: string
  materialIds: string[]       // IDs dos materiais incluídos no pacote
  tags: string[]

  // Controle de acesso por grupo (vazio = todos podem acessar)
  allowedGroups?: MaterialAccessGroup[]

  // Preço
  pricing: 'free' | 'paid'
  price?: number              // Preço do pacote em R$
  originalPrice?: number      // Preço original (soma dos individuais, para mostrar desconto)
  stripePriceId?: string      // ID do preço no Stripe

  // Estatísticas
  downloadCount: number
  viewCount: number

  // Controle
  isHidden: boolean
  isFeatured: boolean
  order: number
  createdBy: string
  createdByName: string
  createdAt: Date
  updatedAt: Date
}

export interface MaterialPurchase {
  _id?: string | import('mongodb').ObjectId
  userId: string
  userName: string
  userEmail: string
  itemType: 'material' | 'package' // O que foi comprado
  itemId: string              // ID do material ou pacote
  itemTitle: string
  price: number               // Preço pago em R$
  /** @deprecated registros novos usam payment_orders/payments */
  stripeSessionId?: string
  /** @deprecated registros novos usam payment_orders/payments */
  stripePaymentIntentId?: string
  // Provider canônico (Mercado Pago)
  provider?: 'mercado_pago'
  providerOrderId?: string    // payment_orders._id
  providerPaymentId?: string  // payments.providerPaymentId
  status: 'pending' | 'completed' | 'refunded'
  purchasedAt: Date
  refundedAt?: Date
}

// ───── Pagamentos (Mercado Pago) ─────

import type { PaymentStatus, SubscriptionStatus, PaymentMethodKind, PaymentOrderType, PaymentProviderId } from './payments/types'

export interface PaymentOrder {
  _id?: string | import('mongodb').ObjectId
  userId?: string                  // pode ser undefined em doação anônima
  payerEmail?: string
  payerName?: string
  provider: PaymentProviderId
  providerOrderId?: string         // id do payment no MP (após criação)
  providerPaymentId?: string       // == providerOrderId para fluxo Payments API
  type: PaymentOrderType
  refId?: string                   // material id, plan id, donation id
  refSlug?: string                 // ex.: linkedDeckSlug
  amount: number                   // BRL
  currency: 'BRL'
  status: PaymentStatus
  paymentMethod?: PaymentMethodKind
  statusDetail?: string
  idempotencyKey: string
  metadata?: Record<string, any>
  // Específicos por método
  pix?: { qrCode: string; qrCodeBase64: string; ticketUrl?: string }
  boleto?: { barcode?: string; ticketUrl?: string }
  // Auditoria
  createdAt: Date
  updatedAt: Date
  paidAt?: Date
  expiresAt?: Date
}

export interface PaymentRecord {
  _id?: string | import('mongodb').ObjectId
  orderId: string                  // payment_orders._id
  userId?: string
  provider: PaymentProviderId
  providerPaymentId: string
  amount: number
  currency: 'BRL'
  status: PaymentStatus
  paymentMethod?: PaymentMethodKind
  statusDetail?: string
  installments?: number
  raw?: any
  createdAt: Date
  updatedAt: Date
  paidAt?: Date
}

export interface SubscriptionRecord {
  _id?: string | import('mongodb').ObjectId
  userId: string
  planId: string                   // 'monthly' | 'quarterly' | 'annual' | etc.
  role?: string                    // accountType atribuído quando ativa
  amount: number
  currency: 'BRL'
  billingIntervalMonths: 1 | 3 | 12
  provider: PaymentProviderId
  providerSubscriptionId: string   // preapproval id no MP
  status: SubscriptionStatus
  /** Quando termina o período já pago — usuário mantém acesso até essa data ao cancelar */
  currentPeriodEndsAt?: Date
  nextBillingAt?: Date
  lastPaymentAt?: Date
  cancelAtPeriodEnd?: boolean
  canceledAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface DonationPayment {
  _id?: string | import('mongodb').ObjectId
  /** doação criada por usuário logado tem userId; anônima fica null/undefined */
  userId?: string
  nomeCompleto?: string
  apelido?: string
  email?: string
  mensagem?: string
  amount: number
  currency: 'BRL'
  provider: PaymentProviderId
  providerOrderId: string
  providerPaymentId?: string
  paymentMethod?: PaymentMethodKind
  status: PaymentStatus
  // Vínculo com a coleção pública `doacoes` (criada após approved)
  publicDoacaoId?: string
  createdAt: Date
  updatedAt: Date
  paidAt?: Date
}

export interface WebhookEventRecord {
  _id?: string | import('mongodb').ObjectId
  provider: PaymentProviderId
  /** id único derivado de x-request-id ou hash do payload — UNIQUE INDEX */
  eventId: string
  topic?: string
  resourceId?: string
  rawBody: string
  headers?: Record<string, string>
  signatureValid: boolean
  processedAt?: Date
  processingError?: string
  attempts: number
  createdAt: Date
}
