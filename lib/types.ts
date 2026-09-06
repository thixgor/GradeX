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
  /**
   * As exceções da ocultação — ver `lib/provas/visibilidade-da-prova.ts`.
   *
   * Só tem efeito quando `isHidden` é verdadeiro. Ausente significa o
   * comportamento de sempre: admins veem, mais ninguém.
   */
  hiddenExcept?: {
    /** Admins continuam vendo a prova no catálogo do aluno. Padrão: true. */
    admins?: boolean
    /** Ids de quem continua vendo e podendo fazer a prova oculta. */
    usuarios?: string[]
  }
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
  /**
   * A classificação (ranking) desta prova aparece para o aluno?
   *
   * Ausente ou `true` = aparece, que é como todas as provas se comportavam
   * antes deste campo existir. `false` esconde a lista de nomes e notas e a
   * posição de cada um — a nota da pessoa e a distribuição anônima da turma
   * continuam. Ver `app/api/exams/[id]/results/route.ts`, onde a decisão é
   * aplicada no servidor: esconder só na tela deixaria a lista a um `fetch` de
   * distância.
   */
  showRanking?: boolean
  // Tempo por questão
  timeMode?: 'none' | 'generalized' | 'individual' // none: sem tempo, generalized: mesmo tempo para todas, individual: tempo diferente por questão
  generalizedTimeSeconds?: number // Tempo em segundos quando timeMode = 'generalized'
  // Sistema de grupos e provas pessoais
  groupId?: string // ID do grupo ao qual a prova pertence (null = página inicial)
  /**
   * Posição desta prova dentro da sua lista — o grupo, ou a prateleira das que
   * não têm grupo. Ver `lib/provas/ordem-das-provas.ts`.
   *
   * O campo existia no banco e era lido com `as any` em cinco arquivos, o que
   * é a mesma coisa que não existir para quem lê o tipo: a projeção de
   * `GET /api/exams` esquecia de pedi-lo e ninguém percebeu, porque nenhuma
   * assinatura prometia que ele viria. Ausente = nunca posicionada.
   */
  orderInGroup?: number
  isPersonalExam?: boolean // Se é uma prova pessoal (criada por usuário, só visível para ele)
  // Embaralhar também as alternativas de cada questão (a letra vira posição,
  // não identidade). Ver lib/provas/embaralhar.ts.
  shuffleAlternatives?: boolean
  /**
   * A quem esta prova é aplicada. Ausente = todos os alunos.
   * Ver lib/provas/publico-da-prova.ts.
   */
  audience?: {
    modo: 'todos' | 'periodos'
    periodos?: number[]
  }
  /**
   * Exceção de download desta prova: libera os PDFs para contas sem plano.
   * Nasce desligada e nunca antecipa o gabarito.
   * Ver lib/provas/downloads-da-prova.ts.
   */
  freeDownloads?: {
    prova?: boolean
    relatorio?: boolean
    gabarito?: boolean
    /** A folha de respostas do aluno (só as letras que ele marcou). */
    compacto?: boolean
  }
  /**
   * Quais arquivos ficam presos até a prova terminar.
   *
   * Diferente de `freeDownloads`, que é sobre PLANO: isto é sobre TEMPO, e não
   * tem exceção de assinatura. Ver `lib/provas/downloads-da-prova.ts`.
   */
  holdDownloads?: {
    prova?: boolean
    relatorio?: boolean
  }
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
  /**
   * Ordem em que as questões foram apresentadas a este aluno (ids), quando a
   * prova embaralha. Sem isso o relatório numera pela ordem do banco e não pela
   * que a pessoa viu. Ver lib/provas/embaralhar.ts.
   */
  questionOrder?: string[]
  /** Quantas retomadas o aluno consumiu antes de entregar. */
  resumesUsed?: number
  /** Entrega feita a partir do progresso salvo, sem a pessoa voltar à prova. */
  submittedFromSavedProgress?: boolean
}

/**
 * Cargo da conta.
 *
 * Os quatro cargos de fábrica são `'gratuito'`, `'trial'`, `'quest'` (só o
 * Banco de Questões) e `'plus'` (a plataforma inteira). `'premium'` e
 * `'essential'` continuam no union apenas porque documentos antigos do Mongo
 * ainda os carregam — nunca grave esses valores em código novo.
 *
 * O `(string & {})` no fim aceita os cargos criados pelo admin em
 * `/admin/cargos` (ver `lib/cargos.ts`), sem perder o autocomplete dos de
 * fábrica. Ele é o que impede o union de virar uma lista que precisa de deploy
 * para crescer — mas também tira a checagem de exaustividade, então tabela
 * indexada por cargo (`TIER_LIMITS`, `FLASHCARD_LIMITS`) precisa de fallback
 * explícito para o id que ela não conhece.
 *
 * Use os helpers de `lib/account-tier.ts` para ler/comparar.
 */
export type AccountType =
  | 'gratuito'
  | 'trial'
  | 'quest'
  | 'plus'
  | LegacyPaidAccountType
  | (string & {})

/** @deprecated Consolidados em `'plus'`. Somente leitura de registros antigos. */
export type LegacyPaidAccountType = 'premium' | 'essential'

/**
 * Ciclo de cobrança do cargo pago. Os valores abaixo são os que a plataforma
 * conhece de fábrica, mas o campo aceita qualquer chave: um plano criado em
 * `/admin/settings` grava o próprio `PlanConfig.tipo` aqui (ver
 * `applyPlanPurchase` em `lib/payments/effects.ts`). O `(string & {})` mantém o
 * autocomplete dos ciclos padrão sem transformar um plano personalizado em
 * erro de tipo.
 */
export type PremiumPlanType =
  | 'teste'
  | 'mensal'
  | 'trimestral'
  | 'semestral'
  | 'anual'
  | 'vitalicio'
  | (string & {})
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
  // Informações pessoais. Nenhuma é exigida no cadastro (que pede só nome,
  // e-mail e senha) — são coletadas depois pelo modal de completar perfil.
  cpf?: string // Só os 11 dígitos, sem pontuação. Único entre os usuários.
  cpfVerified?: boolean // true quando a Receita Federal confirmou CPF + nome + nascimento
  cpfVerifiedAt?: Date
  fullName?: string // Nome civil completo (o `name` acima é o nome de exibição)
  dateOfBirth?: Date
  // Perfil profissional coletado no cadastro
  profession?: 'medico' | 'academico' | 'residente'
  state?: string // Estado (UF) do usuário, ex.: "SP"
  phone?: string // Telefone com DDD
  specialty?: string // Especialidade médica (profession = 'medico')
  crm?: string // Número do CRM (profession = 'medico' ou 'residente')
  crmUf?: string // UF de inscrição do CRM
  residencySpecialty?: string // Área da residência (profession = 'residente')
  residencyHospital?: string // Hospital/instituição da residência (profession = 'residente')
  residencyYear?: string // Ano da residência: R1, R2, ... (profession = 'residente')
  // Informações sobre a instituição do estudante
  isAfyaMedicineStudent?: boolean // Se é estudante de Medicina (profession = 'academico')
  afyaUnit?: string // Unidade/faculdade do estudante (se isAfyaMedicineStudent = true)
  // Faculdade em texto livre. Nasceu do formulário PROUNI/FIES, que precisa da
  // instituição de qualquer pessoa — inclusive de quem não estuda numa das
  // unidades cadastradas em `afyaUnit` e por isso nunca teve onde registrar
  // isso. Só é gravado quando o campo está vazio (ver /api/prouni/solicitacoes).
  institution?: string
  // Período acadêmico (semestre). Definido no cadastro ou pelo admin.
  // O período exibido avança automaticamente a cada virada de semestre a
  // partir de periodoBaseRef (ver lib/user-periodo.ts). Cadastros antigos que
  // não preencheram nada ficam sem período (campos ausentes).
  periodoBase?: number // Período definido (1-12)
  periodoBaseRef?: string // Semestre-âncora "AAAA.S" de quando periodoBase foi definido
  // Lembrete de perfil incompleto (cron /api/cron/profile-reminder)
  profileReminderLastSentAt?: Date
  // Modal de completar perfil: quando o usuário concluiu, e até quando ele
  // pediu para não ser incomodado ("Agora não"). Ver /api/user/complete-profile.
  profileCompletedAt?: Date
  profilePromptSnoozedUntil?: Date
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
  // Para o cargo pago (Plus+ — campos com prefixo `premium` por legado)
  premiumPlanType?: PremiumPlanType // Tipo de plano premium (teste, mensal, trimestral, semestral, vitalicio)
  premiumExpiresAt?: Date // Data de expiração do premium
  premiumActivatedAt?: Date // Data de ativação do premium
  premiumPrice?: number // Preço pago em R$
  // ── Plus+ Guard (antiabuso) ──
  plusRiskScore?: number // Score de risco acumulado (ver lib/plus-guard.ts)
  plusRiskFlaggedAt?: Date // Quando passou do limite e entrou para revisão
  plusDownloadsBlocked?: boolean // Downloads bloqueados (auto ou manual)
  plusDownloadsBlockedReason?: string
  plusRefundedAt?: Date // Último reembolso/estorno aprovado
  plusRefundCount?: number // Quantos reembolsos essa conta já pediu
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
  // Banco de questões gratuito — modelo ANTIGO: 5 questões sorteadas por período.
  // Continua sendo lido (as questões dele entram como já desbloqueadas) e nunca
  // mais é escrito. Ver lib/banco/gratuito.ts.
  freeQuestionsByPeriod?: { [periodoId: string]: string[] }
  // Banco de questões gratuito — modelo atual: a pessoa ESCOLHE quais abrir,
  // até o limite, e o que abriu fica aberto para sempre.
  bancoQuestoesLiberadas?: string[]
  // Retenção: último envio do e-mail de revisão espaçada (evita reenvio na janela mínima)
  lastSpacedReviewEmailAt?: Date
  // Recuperação de senha
  resetPasswordToken?: string
  resetPasswordExpires?: Date
  // Verificação de Email
  emailVerified?: boolean
  verificationToken?: string
  // Código de login por email (2FA para administradores)
  loginCodeHash?: string // Hash do código de 6 dígitos enviado por email
  loginCodeExpires?: Date // Expiração do código (10 min)
  loginCodeAttempts?: number // Tentativas de digitar o código (bloqueia após 5)
  loginCodeLastSentAt?: Date // Último envio (para throttle de reenvio)
}

/**
 * Sessão ativa de um dispositivo. Cada login cria um registro vinculado ao
 * `jti` do JWT. Permite ao admin ver em quantos aparelhos a conta está logada
 * (IP, nome do aparelho) e revogar dispositivos — barrando compartilhamento de
 * conta. Sessões legadas (logins anteriores a esta feature) não têm registro e
 * continuam válidas até o token expirar; apenas sessões com registro são
 * passíveis de revogação/limite.
 */
export interface UserSession {
  _id?: string | import('mongodb').ObjectId
  userId: string
  jti: string // ID único do token JWT (claim jti)
  ip?: string
  userAgent?: string
  deviceName?: string // Nome amigável derivado do user-agent (ex: "Chrome no Windows")
  createdAt: Date
  lastActiveAt: Date
  revokedAt?: Date // Quando definido, a sessão é inválida (logout no próximo request)
  revokedBy?: 'admin' | 'limit' | 'user' // Origem da revogação
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
  pricingEventId?: string | null // lote dinâmico por evento (admin)

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
  pdfDownloadEnabled?: boolean // admin libera download de PDF protegido

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

/**
 * Como o usuário se saiu ao lembrar do card. Os valores antigos
 * (`SUAVE`/`NO_PONTO`/`PORRETE`) continuam sendo lidos do banco — ver
 * `normalizeSpacedRating` — mas o que se grava daqui para frente é isto.
 */
export type FlashcardSpacedRating = 'FACIL' | 'MEDIO' | 'DIFICIL'

/** Fase do card na fila: aprendendo, em revisão ou reaprendendo após erro. */
export type FlashcardSpacedState = 'learning' | 'review' | 'relearning'

export interface FlashcardSpacedProgress {
  _id?: string | import('mongodb').ObjectId
  userId: string
  cardId: string
  deckId: string
  rating: FlashcardSpacedRating
  reviewCount: number
  correctStreak: number
  /** Espelho do modelo SM-2 antigo, mantido para compatibilidade de leitura. */
  easeFactor: number
  intervalDays: number
  nextReviewAt: Date
  lastReviewedAt: Date
  createdAt: Date
  updatedAt: Date

  // ── Estado de memória do FSRS (ausente nos documentos antigos) ────────────
  /** Dias até a chance de lembrar cair para 90%. */
  stability?: number
  /** De 1 a 10: o quanto este card resiste a ficar estável. */
  difficulty?: number
  state?: FlashcardSpacedState
  /** Passo curto já cumprido dentro da fase de aprendizado. */
  learningStep?: number
  /** Quantas vezes o card já foi esquecido depois de graduado. */
  lapses?: number
  /** Meta de retenção usada no último agendamento (0,80–0,97). */
  retention?: number
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

/** `'premium'` é o valor legado do que hoje é `'plus'`. */
export type SerialKeyType = 'trial' | 'plus' | 'premium' | 'custom'
export type SerialKeyTrialSubtype = 'teste' | '7dias'
export type SerialKeyPremiumSubtype = 'teste' | 'mensal' | 'trimestral' | 'semestral' | 'vitalicio'

/**
 * Origem da serial key:
 *  - 'admin'    → gerada manualmente por um administrador (fluxo legado).
 *  - 'purchase' → gerada automaticamente após uma compra aprovada (compra avulsa,
 *                 com ou sem login). É o fluxo de Serial Keys de compra.
 */
export type SerialKeyOrigin = 'admin' | 'purchase'

/** Tipo de produto que uma serial key de compra libera na ativação. */
export type SerialKeyProductType =
  | 'manual_clinico'
  | 'material'
  | 'flashcard'
  | 'package'
  | 'plus'
  | LegacyPaidAccountType

/** Estado do ciclo de vida de uma serial key de compra. */
export type SerialKeyStatus = 'unactivated' | 'activated' | 'expired' | 'cancelled'

/**
 * Descreve exatamente o que a serial key concede ao ser ativada. Guardado no
 * momento da geração (após pagamento aprovado) para que a ativação nunca
 * dependa de dados voláteis nem libere algo diferente do que foi comprado.
 */
export interface SerialKeyGrant {
  productType: SerialKeyProductType
  // Para material/pacote/flashcard
  itemType?: 'material' | 'package'
  itemId?: string
  itemTitle?: string
  linkedDeckSlug?: string
  // Para manual clínico
  manualClinicoPlanKey?: ManualClinicoPlanKey
  // Para assinaturas (premium/essential): cargo + duração em meses (0 = vitalício)
  role?: AccountType
  planId?: string
  durationMonths?: number
  /**
   * Versão de acesso por tempo comprada (material/pacote). O prazo só começa a
   * correr quando a key é ativada — por isso a data de fim não é gravada aqui,
   * e sim calculada na ativação a partir de `accessDurationMinutes`.
   */
  accessMode?: import('./material-timed-access').MaterialAccessMode
  accessVersionId?: string
  accessVersionLabel?: string
  /** Prazo comprado — vira data de fim só na ativação. */
  accessDuration?: import('./material-timed-access').TimedAccessDuration
  accessDurationMinutes?: number
}

/** Registro de um envio de e-mail relacionado à serial key. */
export interface SerialKeyEmailLog {
  to: string
  status: 'sent' | 'failed'
  kind: 'purchase' | 'resend'
  sentAt: Date
  error?: string
  sentBy?: string // admin que reenviou, se aplicável
}

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

  // ── Serial Keys de compra (origin === 'purchase') ──────────────────────────
  origin?: SerialKeyOrigin
  status?: SerialKeyStatus
  /** O que a key concede ao ser ativada. */
  grant?: SerialKeyGrant
  productType?: SerialKeyProductType
  productId?: string
  productTitle?: string
  /** Token seguro (URL-safe) usado no link/QR de ativação. */
  activationToken?: string
  // Vínculo com a compra/pagamento
  orderId?: string
  /** Posição do item dentro da compra (0 para item único; 0..N-1 para carrinho). */
  cartIndex?: number
  providerPaymentId?: string
  paymentStatus?: PaymentStatus
  amount?: number
  // Dados do comprador (pode não ter conta)
  buyerName?: string
  buyerFirstName?: string
  buyerEmail?: string
  buyerPhone?: string
  // Ativação
  activatedByUserId?: string
  activatedByEmail?: string
  activatedAt?: Date
  expiresAt?: Date
  /**
   * Restringe a ativação à conta cujo e-mail seja igual ao `buyerEmail` (o
   * e-mail usado na compra). Definido quando o material comprado envia o PDF
   * automaticamente por e-mail (`autoEmailPdfOnPurchase`).
   */
  restrictActivationToBuyerEmail?: boolean
  // Auditoria / anti-fraude
  ip?: string
  userAgent?: string
  source?: string
  // Cancelamento administrativo
  cancelledAt?: Date
  cancelledBy?: string
  cancelReason?: string
  // Histórico de e-mails enviados
  emailHistory?: SerialKeyEmailLog[]
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
  /** Pedido físico relacionado (type === 'order_update') */
  orderId?: string
  orderNumber?: string
  type:
    | 'correction_ready'
    | 'ticket_created'
    | 'ticket_reopened'
    /** Admin respondeu o ticket do usuário */
    | 'ticket_reply'
    /** Admin marcou o ticket como resolvido */
    | 'ticket_resolved'
    /** Admin fechou o ticket */
    | 'ticket_closed'
    /** Usuário respondeu — avisa o admin que atende o ticket */
    | 'ticket_user_reply'
    | 'order_update'
    /** Lembrete de avaliação (cron /api/cron/avaliacoes-lembretes) */
    | 'avaliacao_lembrete'
  message: string
  read: boolean
  createdAt: Date
}

export type TicketStatus = 'open' | 'assigned' | 'resolved' | 'closed'

/** Prioridade de atendimento — definida pelo admin, nunca pelo usuário. */
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent'

/** Assunto escolhido por quem abre o ticket (ver TICKET_CATEGORIES). */
export type TicketCategory =
  | 'financeiro'
  | 'acesso'
  | 'conteudo'
  | 'bug'
  | 'sugestao'
  | 'outro'

export interface TicketMessage {
  id: string
  senderId: string
  senderName: string
  /**
   * 'system' é o valor novo para os avisos automáticos. Documentos antigos
   * gravavam 'user' com `senderId === 'system'` — por isso a interface aceita
   * os dois e a UI decide pelo helper `ehMensagemDoSistema`.
   */
  senderRole: 'admin' | 'user' | 'system'
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
  category?: TicketCategory
  priority?: TicketPriority
  assignedTo?: string // ID do admin que pegou o ticket
  assignedToName?: string // Nome do admin
  messages: TicketMessage[]
  createdAt: Date
  updatedAt: Date
  resolvedAt?: Date
  closedAt?: Date
  /** Quem encerrou — muda o texto do aviso e evita e-mail redundante. */
  closedBy?: 'user' | 'admin'
  reopenedAt?: Date
  /** Primeira resposta humana de um admin — base do tempo de resposta. */
  firstResponseAt?: Date
  /**
   * Última vez que cada lado abriu a conversa. Serve para não mandar e-mail
   * para quem está com o chat aberto lendo a resposta em tempo real.
   */
  userLastSeenAt?: Date
  adminLastSeenAt?: Date
  /** Último aviso por e-mail deste ticket — evita rajada em conversa rápida. */
  lastEmailAt?: Date
  /**
   * Marca desde quando existe resposta do admin que a trava de rajada segurou.
   * É o que a varredura procura para entregar o agrupado — sem isso, a
   * mensagem segurada simplesmente nunca chegaria à caixa de entrada.
   */
  pendingEmailSince?: Date
}

/**
 * O que a listagem devolve: tudo do ticket menos o histórico completo de
 * mensagens, que só é carregado ao abrir a conversa. A lista é consultada em
 * polling — mandar todas as mensagens de todos os tickets a cada 30s era o
 * maior desperdício do sistema antigo.
 */
export interface TicketSummary extends Omit<Ticket, 'messages'> {
  lastMessage?: Pick<TicketMessage, 'senderId' | 'senderName' | 'senderRole' | 'text' | 'sentAt'>
  messageCount: number
  /** Mensagens ainda não lidas por quem fez a consulta. */
  unreadCount: number
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

export type StrokeShape = 'line' | 'rectangle' | 'ellipse' | 'arrow'

export interface DrawingStroke {
  id: string
  tool: 'pen' | 'highlighter' // Caneta ou marca-texto
  shape?: StrokeShape // Forma geométrica (opcional — sem shape = traço livre)
  filled?: boolean // Se a forma deve ser preenchida
  points: Point[] // Pontos do traço (para shapes, geralmente [início, fim])
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
/** `'premium'` é legado — aulas novas usam `'plus'`. */
export type AulaVisibility = 'plus' | 'gratuita' | 'premium'

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
  nome: string // ex: "DomineAqui Plus+"
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
  /**
   * Permissões modulares: o que este plano libera, área por área, com teto
   * opcional (X por janela de tempo). Ausente ou com `ativo: false` significa
   * "sem modulação" — quem manda são os limites do cargo, como sempre foi.
   * Ver `lib/plan-entitlements.ts`.
   */
  permissoes?: import('./plan-entitlements').PlanPermissions
  /** @deprecated Stripe foi removido — campo mantido só para leitura de planos antigos */
  stripePriceId?: string
  /** @deprecated Stripe foi removido */
  stripeOneTimePriceId?: string
  criadoEm: Date
  atualizadoEm: Date
}


// ─── Plus+ Guard (proteção contra abuso e reembolso oportunista) ─────────────

/**
 * Toda a configuração antiabuso do Plus+, editável em /admin/settings.
 *
 * O risco central: o Plus+ libera 100% do acervo, e o CDC (art. 49) dá 7 dias
 * de arrependimento. Sem trava, dá para assinar, baixar tudo em um dia e pedir
 * o dinheiro de volta. As defesas abaixo não impedem o reembolso — elas
 * limitam o quanto dá para extrair antes de a janela fechar e deixam prova
 * do consumo para contestar o estorno.
 */
export interface PlusGuardSettings {
  /** Liga/desliga o conjunto inteiro. Desligado = nenhum bloqueio (só log). */
  enabled: boolean

  /** Duração da janela legal de arrependimento, em dias. Padrão: 7. */
  refundWindowDays: number

  /**
   * Cotas de download durante a janela de arrependimento (assinante novo).
   * É aqui que mora a proteção principal.
   */
  trialWindow: PlusDownloadQuota

  /** Cotas depois que a janela de arrependimento fecha (assinante estável). */
  steadyState: PlusDownloadQuota

  /** Teto absoluto de downloads dentro de toda a janela de arrependimento. */
  refundWindowTotalCap: number

  /** Dispositivos/sessões simultâneas por conta Plus+. 0 = usa o padrão global. */
  maxDevices: number

  /** Marca a conta para revisão manual ao ultrapassar este score de risco. */
  riskScoreThreshold: number

  /** Bloqueia downloads automaticamente quando o score passa do limite. */
  autoBlockOnRisk: boolean

  /** Exige marca d'água com identificação do usuário em todo PDF liberado. */
  enforceWatermark: boolean

  /**
   * Ao aprovar reembolso/estorno, rebaixa a conta para gratuito e revoga
   * acessos concedidos pela assinatura.
   */
  revokeOnRefund: boolean

  /** Bloqueia nova assinatura para quem já pediu reembolso. 0 = não bloqueia. */
  refundCooldownDays: number

  /** Mensagem exibida ao usuário quando uma cota é atingida. */
  quotaMessage: string

  atualizadoEm?: Date
  atualizadoPor?: string
}

export interface PlusDownloadQuota {
  /** Downloads por hora. Corta o script de raspagem em massa. */
  perHour: number
  /** Downloads por dia. */
  perDay: number
  /** Downloads por semana. */
  perWeek: number
}

/** Categorias de conteúdo contabilizadas pelo Plus+ Guard. */
export type PlusDownloadKind =
  | 'material'
  | 'manual_clinico'
  | 'flashcard_deck'
  | 'exam_pdf'
  | 'aula_pdf'
  | 'mapa_mental'
  | 'cronograma'
  /** Exportação de lista do Banco de Questões em PDF — a superfície de download do Quest. */
  | 'banco_lista_pdf'
  | 'outro'

/** Registro server-side de cada download liberado (prova de consumo). */
export interface PlusDownloadLog {
  _id?: string | import('mongodb').ObjectId
  userId: string
  userEmail?: string
  userName?: string
  accountType?: AccountType
  kind: PlusDownloadKind
  resourceId?: string
  resourceTitle?: string
  /** true se o download aconteceu dentro da janela de arrependimento. */
  inRefundWindow: boolean
  ip?: string
  userAgent?: string
  /** Impressão digital gravada na marca d'água do arquivo entregue. */
  watermarkFingerprint?: string
  createdAt: Date
}

/** Motivo pelo qual o Plus+ Guard barrou uma liberação. */
export type PlusGuardBlockReason =
  | 'hourly_quota'
  | 'daily_quota'
  | 'weekly_quota'
  | 'refund_window_cap'
  | 'risk_blocked'
  | 'refund_cooldown'

export interface PlusGuardDecision {
  allowed: boolean
  reason?: PlusGuardBlockReason
  message?: string
  /** Downloads restantes na cota mais apertada do momento. */
  remaining?: number
  /** Quando a cota atingida se renova. */
  retryAt?: Date
}

export interface AdminSettings {
  _id?: string
  planos: PlanConfig[]
  plusGuard?: PlusGuardSettings
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

/** Material oferecido como prêmio por um formulário. */
export interface FormMaterialPrize {
  id: string // ID do material (coleção materials)
  title?: string // Cache do título (exibição/admin)
}

/**
 * Como os prêmios são distribuídos quando o formulário tem mais de um:
 * - `all`: o usuário recebe todos os materiais da lista;
 * - `single`: o usuário escolhe UM material da lista e só recebe esse.
 */
export type FormMaterialChoiceMode = 'all' | 'single'

export interface FormSettings {
  isActive: boolean
  deadline?: Date // Data de encerramento (horário de Brasília)
  sendConfirmationEmail: boolean
  emailQuestionId?: string // ID da pergunta que coleta o e-mail para envio da confirmação
  responseLimit?: number // Limite total de respostas

  // Exige que o usuário esteja logado para acessar e responder o formulário.
  // Quando ativo, o e-mail de destino de entregas passa a ser o da conta logada.
  requireLogin?: boolean

  // Impede que o mesmo e-mail responda o formulário mais de uma vez. A checagem
  // usa o e-mail da conta logada e/ou a resposta da pergunta de e-mail.
  oneResponsePerEmail?: boolean

  // Entrega de material por e-mail após o envio das respostas. Gera uma serial
  // key (com link de ativação) para um material de /materiais e envia ao e-mail
  // do usuário. Requer login (para conhecermos o e-mail com segurança).
  deliverMaterial?: boolean
  /** @deprecated Use `deliverMaterials`. Mantido para formulários antigos. */
  deliverMaterialId?: string // ID do material (coleção materials) a ser entregue
  /** @deprecated Use `deliverMaterials`. Mantido para formulários antigos. */
  deliverMaterialTitle?: string // Cache do título do material (exibição/admin)

  // Lista de materiais entregues pelo formulário (permite mais de um prêmio).
  deliverMaterials?: FormMaterialPrize[]
  // Padrão: 'all' (entrega todos). Em 'single' o usuário escolhe apenas um.
  materialChoiceMode?: FormMaterialChoiceMode
  // Enunciado exibido no seletor de prêmio quando o modo é 'single'.
  materialChoiceTitle?: string
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
  /** Todos os e-mails conhecidos da resposta (conta + pergunta), em minúsculas.
   *  É o campo consultado pela trava de "uma resposta por e-mail". */
  emails?: string[]
  /** Material escolhido pelo usuário quando o formulário entrega só um prêmio. */
  selectedMaterialId?: string
  /** Materiais efetivamente entregues nesta resposta. */
  deliveredMaterialIds?: string[]
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
  campaignUuid?: string // Identificador interno estável (UUID v4), não sequencial
  name: string // Nome da campanha (ex: "E-book Estudos")
  slug: string // URL amigável (ex: "ebook-estudos"), usada em /lead/[slug]
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

  // Comunicação multicanal (F3/F4)
  channels?: ('email' | 'whatsapp')[] // Canais em que o material é entregue (default: ['email'])
  collectPhone?: boolean // Se o formulário coleta telefone (para WhatsApp)
  requirePhone?: boolean // Se o telefone é obrigatório
  whatsappTemplate?: string // Texto do 1º toque no WhatsApp (aceita {{nome}}, {{persuasiveTag}})
  defaultPersuasiveTag?: string // Metatag persuasiva padrão aplicada aos leads desta campanha
  sequenceId?: string // Sequência/jornada de nurturing a matricular o lead ao capturar

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
  leadUuid?: string // Identificador único universal (UUID v4). Seguro para URLs públicas.
  campaignId: string // ID da campanha
  name: string // Nome do lead
  email: string // Email do lead
  phoneE164?: string // Telefone em formato E.164 (ex.: +5511999998888), para WhatsApp
  persuasiveTag?: string // Copy persuasiva personalizada usada para personalizar as mensagens
  emailSentAt?: Date // Quando o email foi enviado (se enviado)
  emailSent: boolean // Se o email já foi enviado para este lead
  whatsappSentAt?: Date // Quando a 1ª mensagem de WhatsApp foi enfileirada
  whatsappQueued?: boolean // Se o WhatsApp já foi enfileirado para este lead
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

export type MaterialType = 'pdf' | 'html' | 'video' | 'video_embed' | 'link' | 'image' | 'document' | 'other'

// Grupos de acesso disponíveis para restrição de materiais.
// `essential`/`premium` só aparecem em registros anteriores ao Plus+.
export type MaterialAccessGroup =
  | 'gratuito'
  | 'trial'
  | 'plus'
  | 'monitor'
  | LegacyPaidAccountType

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

/** Entrada do sumário interativo do PDF Viewer (título → página) */
export interface MaterialPdfSummaryEntry {
  /** id estável para React keys / edição */
  id: string
  /** Título exibido no sumário */
  title: string
  /** Número da página de destino (1-based) */
  page: number
  /** Nível de indentação (0 = capítulo, 1 = seção, 2 = subseção) */
  level?: number
}

/** Atalho de navegação rápida do PDF Viewer (rótulo → página) */
export interface MaterialPdfNavEntry {
  id: string
  label: string
  page: number
}

/**
 * Configuração do PDF Viewer definida pelo admin para um material com PDF
 * interno (Vercel Blob) e viewer habilitado: capa, sumário interativo e
 * páginas de navegação rápida.
 */
export interface MaterialPdfViewerConfig {
  /** Página designada como capa (1-based). O viewer abre nela. */
  coverPage?: number
  /** Sumário interativo (lista ordenada de títulos → páginas). */
  summary?: MaterialPdfSummaryEntry[]
  /** Atalhos de navegação rápida (chips). */
  navigation?: MaterialPdfNavEntry[]
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
  /** Quantidade de páginas do PDF (calculado no upload via pdf-lib) */
  pageCount?: number
}

/** Metadados do HTML interno armazenado no Vercel Blob (arquivo .html único) */
export interface MaterialHtmlFile {
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

/** Template visual de um item complementar avulso. */
export type ComplementaryTemplate = 'experiencia' | 'pdf' | 'aula' | 'podcast' | 'ebook'

/**
 * Como o CTA de um item avulso entrega o conteúdo:
 *  - 'link'        : abre uma URL externa (ou interna) diretamente.
 *  - 'html'        : arquivo .html enviado (upload), aberto no leitor protegido
 *                     com marca d'água — igual ao material do tipo html.
 *  - 'pdf'         : arquivo .pdf enviado (upload), aberto com marca d'água —
 *                     igual ao material do tipo pdf.
 *  - 'video_embed' : código embed ou URL de vídeo (aula), com marca d'água de vídeo.
 */
export type ComplementaryContentKind = 'link' | 'html' | 'pdf' | 'video_embed'

/**
 * Item da seção "Você também leva …". Pode ser:
 *  - kind 'material': referência a um material existente (link automático).
 *  - kind 'custom'  : item avulso (não vira material), com template, descrição,
 *                     conteúdo próprio (link/html/pdf/aula) e botão (CTA).
 */
export interface ComplementaryItem {
  /** id estável para React keys / edição no admin */
  id: string
  kind: 'material' | 'custom'
  /** Referência ao material (kind === 'material') */
  materialId?: string
  /** Template visual do item avulso (kind === 'custom') */
  template?: ComplementaryTemplate
  /** Como o conteúdo é entregue (kind === 'custom'). Padrão: 'link'. */
  contentKind?: ComplementaryContentKind
  /** Título exibido (obrigatório em custom; opcional em material = usa o do material) */
  title?: string
  /** Descrição curta exibida abaixo do título */
  description?: string
  /** Capa/thumbnail (URL). Opcional — cai no ícone do template/tipo. */
  coverImage?: string
  /** Rótulo do botão (CTA). Ex.: "Acessar", "Ouvir agora". */
  buttonLabel?: string
  /** Destino do botão. contentKind 'link': URL externa/interna.
   *  contentKind 'video_embed': código embed completo OU URL do vídeo. */
  buttonUrl?: string
  /** Habilita o leitor protegido (contentKind 'html' | 'pdf'). */
  viewerEnabled?: boolean
  /** Arquivo HTML enviado (contentKind === 'html') — nunca expor blobUrl ao cliente */
  htmlFile?: MaterialHtmlFile
  /** Arquivo PDF enviado (contentKind === 'pdf') — nunca expor blobUrl ao cliente */
  pdfFile?: MaterialPdfFile
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
  // Envia o PDF (com marca d'água) automaticamente por e-mail ao comprador na
  // compra. Só surte efeito quando há PDF interno e o download está ativado.
  // Para compras sem login, a serial key passa a ter ativação restrita ao
  // e-mail usado na compra.
  autoEmailPdfOnPurchase?: boolean
  pdfViewerConfig?: MaterialPdfViewerConfig // Capa, sumário e navegação (admin)

  // HTML interno (leitor de experiências — arquivo .html autocontido)
  htmlFile?: MaterialHtmlFile // Presente quando admin fez upload direto do HTML
  htmlViewerEnabled?: boolean // Permite abrir o leitor HTML protegido (com watermark)

  // Materiais complementares (legado) — IDs de outros materiais anexados.
  // Mantido apenas para leitura/compatibilidade; a UI nova usa complementaryItems.
  complementaryMaterialIds?: string[]

  // Materiais complementares (novo) — itens ricos exibidos como "Você também
  // leva …". Cada item pode referenciar um material existente OU ser um item
  // avulso (sem criar material), com template visual, descrição e botão (CTA).
  complementaryItems?: ComplementaryItem[]

  // Controle de acesso por grupo (vazio = todos podem acessar)
  allowedGroups?: MaterialAccessGroup[] // Ex: ['premium', 'essential'] = só premium e essential

  // Preço
  pricing: 'free' | 'paid'
  price?: number              // Preço em R$ (se paid)
  stripePriceId?: string      // ID do preço no Stripe (se paid)

  /** Lote dinâmico por evento (pricingEvent._id). Quando setado, aplica desconto progressivo. */
  pricingEventId?: string | null

  /**
   * Versões de acesso por tempo limitado (opcionais). O mesmo conteúdo por um
   * preço menor, válido por X dias/horas contados a partir da ativação. Compra
   * por tempo nunca libera download — ver `lib/material-timed-access`.
   */
  timedAccessVersions?: import('./material-timed-access').TimedAccessVersion[]

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

  /**
   * Envia por e-mail, na compra, o PDF (com marca d'água) de TODOS os materiais
   * incluídos que tenham PDF interno com download ativado. Para compras sem
   * login, a serial key passa a ter ativação restrita ao e-mail da compra.
   */
  autoEmailPdfOnPurchase?: boolean

  // Controle de acesso por grupo (vazio = todos podem acessar)
  allowedGroups?: MaterialAccessGroup[]

  // Preço
  pricing: 'free' | 'paid'
  price?: number              // Preço do pacote em R$
  originalPrice?: number      // Preço original (soma dos individuais, para mostrar desconto)
  stripePriceId?: string      // ID do preço no Stripe

  /** Lote dinâmico por evento (pricingEvent._id). */
  pricingEventId?: string | null

  /** Versões de acesso por tempo limitado (ver `Material.timedAccessVersions`). */
  timedAccessVersions?: import('./material-timed-access').TimedAccessVersion[]

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
  /**
   * `'plus_revoked'`: resgate do Plus+ suspenso porque a assinatura caiu. O
   * registro fica guardado para a renovação devolvê-lo — ver `lib/plus-claims`.
   * Só ocorre em documentos com `source: 'plus'`; compra avulsa nunca chega aqui.
   */
  status: 'pending' | 'completed' | 'refunded' | 'plus_revoked'
  purchasedAt: Date
  refundedAt?: Date
  /**
   * Origem da aquisição. Ausente = compra paga (comportamento histórico).
   * `'plus'` = resgatado sem custo pela assinatura Plus+ — o registro existe
   * para o item aparecer em "Meus materiais" e para o resgate ser auditável,
   * mas não representa receita e é revogado se a assinatura cair.
   */
  source?: 'purchase' | 'plus'
  /** Quando o item foi resgatado pela assinatura (source = 'plus'). */
  claimedAt?: Date
  /** Quando o resgate foi suspenso pela queda do Plus+. */
  plusRevokedAt?: Date
  /** Motivo da suspensão (expiração, cancelamento, reembolso, admin). */
  plusRevokedReason?: string
  /** Quando o resgate voltou por renovação do Plus+. */
  plusRestoredAt?: Date

  // ── Acesso por tempo limitado ──────────────────────────────────────────────
  /** `'timed'` = comprou uma versão com prazo. Ausente/`'lifetime'` = para sempre. */
  accessMode?: import('./material-timed-access').MaterialAccessMode
  /** Versão de acesso comprada (`Material.timedAccessVersions[].id`). */
  accessVersionId?: string
  accessVersionLabel?: string
  /** Prazo comprado (anos/meses/dias/horas/minutos). Meses e anos são de calendário. */
  accessDuration?: import('./material-timed-access').TimedAccessDuration
  /** Estimativa em minutos — ordenação e compras anteriores às cinco unidades. */
  accessDurationMinutes?: number
  /** Início da contagem — a ativação da serial key, não o pagamento. */
  accessStartsAt?: Date
  /** Fim do acesso. Ausente = vitalício. Passada a data, não dá mais acesso. */
  accessExpiresAt?: Date
  /** Compra por tempo: o PDF só pode ser lido no viewer, nunca baixado. */
  downloadDisabled?: boolean

  // ── Liberação individual de download ──────────────────────────────────────
  /**
   * Decisão do admin só para esta pessoa, que vence o `pdfDownloadEnabled` do
   * material: `true` libera o download mesmo com o material bloqueado (é o que
   * substitui mandar o PDF por e-mail), `false` bloqueia só para ela. Ausente =
   * segue o material. Ver `lib/material-download-permission.ts`.
   */
  pdfDownloadAllowed?: boolean
  pdfDownloadAllowedAt?: Date
  pdfDownloadAllowedBy?: string
  pdfDownloadAllowedByName?: string
}

// ─── Loja física (produtos físicos / impressos) ──────────────────

/**
 * Como o produto físico é vinculado à loja:
 *  - 'standalone': vendido sozinho (avulso), aparece na loja/catálogo.
 *  - 'material'  : listado no catálogo como um material normal (com selo Físico),
 *                  opcionalmente atrelado a um material digital (linkedMaterialId).
 *  - 'addon'     : add-on de um material digital — na página do material X, o
 *                  usuário leva a versão impressa por +addonSurcharge.
 */
export type PhysicalLinkMode = 'standalone' | 'material' | 'addon'

/**
 * Versão (variante) de um produto físico — ex.: "Capa dura" / "Capa mole".
 * Preço e detalhes são opcionais: sem preço, usa o preço base do produto
 * (ou o acréscimo, quando add-on).
 */
export interface PhysicalProductVersion {
  id: string
  name: string
  /** Preço cheio (avulso) desta versão em R$. Ausente => usa `price` do produto. */
  price?: number
  /** Acréscimo (preço de add-on) desta versão, aplicado quando comprado junto ao
   *  material/pacote vinculado. Ausente => usa `addonSurcharge` do produto. */
  addonSurcharge?: number
  /** Detalhes opcionais desta versão. */
  details?: string
}

export interface PhysicalProduct {
  _id?: string | import('mongodb').ObjectId
  title: string
  description?: string
  slug?: string
  /** Galeria de imagens (URLs Vercel Blob). images[0] é a capa. */
  images: string[]
  /** Preço base em R$ (avulso/material). */
  price: number
  /** Preço "de" (riscado) para promoção. */
  compareAtPrice?: number

  // Vínculo
  linkMode: PhysicalLinkMode
  /** Material digital vinculado (usado em 'addon'/'material' quando o alvo é um material). */
  linkedMaterialId?: string
  /** Pacote vinculado (usado em 'addon'/'material' quando o alvo é um pacote). */
  linkedPackageId?: string
  /** Acréscimo em R$ quando linkMode === 'addon'. */
  addonSurcharge?: number

  /** Versões/variantes opcionais (com preço e detalhes opcionais por versão). */
  versions?: PhysicalProductVersion[]

  /** Número de páginas do material impresso (opcional). */
  pageCount?: number

  // Produção sob encomenda
  madeToOrder: boolean
  /** Prazo extra de produção em dias (quando madeToOrder). */
  productionDays?: number

  // Estoque (opcional)
  trackStock: boolean
  /** Quantidade em estoque (usado quando trackStock === true). */
  stock?: number

  // Catálogo
  tags: string[]
  allowedGroups?: MaterialAccessGroup[]
  isHidden: boolean
  isFeatured: boolean
  order: number

  // Estatísticas
  salesCount: number
  viewCount: number

  createdBy: string
  createdByName: string
  createdAt: Date
  updatedAt: Date
}

/** Método de entrega configurado pelo admin. Frete por região/UF. */
export interface DeliveryMethod {
  id: string
  name: string
  enabled: boolean
  estimatedDaysMin: number
  estimatedDaysMax: number
  /**
   * Frete (R$) por região. Chave = sigla da UF (ex.: 'RJ', 'SP') OU uma das
   * chaves de macro-região ('N','NE','CO','SE','S') OU 'default' (fallback).
   * Ausente/undefined => usa 'default' (ou 0 se também ausente).
   */
  freightByRegion: Record<string, number>
  /** Quando true, o frete deste método é sempre R$0 (frete grátis). */
  freeShipping?: boolean
  /** Detalhes opcionais exibidos ao usuário. */
  details?: string
}

/** Ponto de retirada configurado pelo admin (ex.: Afya Unigranrio Barra). */
export interface PickupPoint {
  id: string
  name: string
  address?: string
  enabled: boolean
  /** Detalhes opcionais (horário, instruções). */
  details?: string
}

export interface ShopSettings {
  _id?: string | import('mongodb').ObjectId
  settingsId: 'shop'
  deliveryMethods: DeliveryMethod[]
  pickupPoints: PickupPoint[]
  /** Rodapé de entrega. Ex.: "Entregue por DomineAqui LTDA — Rio de Janeiro". */
  sellerFooter: string
  /** Frete grátis automático quando o subtotal físico ≥ este valor (0/undefined = desligado). */
  freeShippingThreshold?: number
  updatedAt: Date
  updatedBy?: string
}

export interface ShippingAddress {
  name: string
  phone?: string
  cep: string
  street: string
  number: string
  complement?: string
  district: string
  city: string
  uf: string
}

export interface ShopOrderItem {
  productId: string
  title: string
  imageUrl?: string
  unitPrice: number
  quantity: number
  /** Versão/variante escolhida (opcional). */
  versionId?: string
  versionName?: string
  /** Se é um add-on da versão impressa de um material digital. */
  isAddon?: boolean
  linkedMaterialId?: string
  linkedPackageId?: string
  madeToOrder?: boolean
  productionDays?: number
}

export type ShopOrderStatus =
  | 'awaiting_payment'
  | 'paid'
  | 'in_production'
  | 'ready'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export interface ShopOrderStatusEntry {
  status: ShopOrderStatus
  note?: string
  at: Date
  byName?: string
}

export interface ShopOrder {
  _id?: string | import('mongodb').ObjectId
  orderNumber: string
  userId: string
  userName: string
  userEmail: string
  items: ShopOrderItem[]

  subtotal: number
  freight: number
  discount: number
  total: number
  couponCode?: string
  /**
   * Taxa operacional do Mercado Pago repassada ao comprador (ver
   * lib/payments/fees.ts). Fica FORA de `total` de propósito: `total` é o que
   * o pedido vale em mercadoria + frete, que é o número que a logística e o
   * financeiro usam. `chargedTotal` é o que foi debitado do cartão.
   */
  paymentFee?: number
  chargedTotal?: number

  // Entrega
  deliveryType: 'pickup' | 'shipping'
  pickupPointId?: string
  pickupPointName?: string
  shippingAddress?: ShippingAddress
  deliveryMethodId?: string
  deliveryMethodName?: string
  /** Prazo estimado (produção + entrega) — data alvo. */
  estimatedDeliveryDate?: Date | null

  // Pagamento
  provider?: 'mercado_pago'
  providerOrderId?: string
  providerPaymentId?: string
  paymentStatus: PaymentStatus

  // Ciclo de vida do pedido físico
  status: ShopOrderStatus
  statusHistory: ShopOrderStatusEntry[]
  /** Rastreio opcional definido pelo admin. */
  tracking?: { code?: string; url?: string; carrier?: string }

  createdAt: Date
  updatedAt: Date
}

// ─── Produto avulso: Manual Clínico Completo ──────────────────────

export type ManualClinicoAccessType = 'lifetime' | 'temporary'

export type ManualClinicoPlanKey = 'semestral' | 'anual' | 'vitalicio'

export interface ManualClinicoPlan {
  key: ManualClinicoPlanKey
  label: string
  /** Meses de acesso. null = vitalício */
  durationMonths: number | null
  price: number
  enabled: boolean
  /** Lote dinâmico por evento (pricingEvent._id). */
  pricingEventId?: string | null
  /** Cupom pré-aplicado para este plano (opcional). */
  defaultCouponCode?: string | null
}

export interface ManualClinicoProductConfig {
  _id?: string | import('mongodb').ObjectId
  productId: 'manual-clinico-premium'
  label: string
  benefitText: string
  shortDescription: string
  ctaText: string
  coverImageUrl?: string
  fullPdfButtonEnabled?: boolean
  fullPdfExternalUrl?: string
  isActive: boolean
  /** Preço legado (mantido para compatibilidade — funciona como fallback do plano Vitalício). */
  price: number
  promotionalPrice?: number | null
  promotionEndsAt?: Date | null
  allowCoupons: boolean
  /** Legado — mantido por compatibilidade. */
  lifetimeAccess: boolean
  /** Planos configurados (Semestral/Anual/Vitalício). */
  plans?: ManualClinicoPlan[]
  freeAccessMode: 'quantity' | 'list'
  freeQuantity: number
  freePathologySlugs: string[]
  /** Inclui o Manual Clínico completo para assinantes Plus+ (sem compra avulsa). */
  includedInPlus?: boolean
  /** @deprecated Substituídos por `includedInPlus`. Só leitura de configs antigas. */
  includedInPremium?: boolean
  /** @deprecated Substituídos por `includedInPlus`. Só leitura de configs antigas. */
  includedInEssential?: boolean
  /** Lote dinâmico por evento (pricingEvent._id) — legado/global. */
  pricingEventId?: string | null
  createdAt: Date
  updatedAt: Date
  updatedBy?: string
}

export interface ManualClinicoPurchase {
  _id?: string | import('mongodb').ObjectId
  userId: string
  userName: string
  userEmail: string
  productId: 'manual-clinico-premium'
  productTitle: string
  productType: 'manual_clinico'
  price: number
  originalPrice?: number | null
  couponId?: string
  couponCode?: string
  couponDiscountAmount?: number
  provider: 'mercado_pago' | 'manual_admin' | 'free'
  providerOrderId?: string
  providerPaymentId?: string
  paymentMethod?: string
  status: 'pending' | 'completed' | 'refunded' | 'revoked'
  accessType: ManualClinicoAccessType
  /** Plano contratado pelo usuário. */
  planKey?: ManualClinicoPlanKey
  planLabel?: string
  /** Duração do plano em meses (null se vitalício). */
  planDurationMonths?: number | null
  purchasedAt: Date
  expiresAt?: Date | null
  /** Usuário optou por NÃO renovar mais (pix). Quando true, ocultar lembretes. */
  renewalDeclined?: boolean
  /** Último envio de e-mail de aviso de expiração (para evitar repetição). */
  renewalReminderSentAt?: Date | null
  refundedAt?: Date
  revokedAt?: Date
  revokedBy?: string
  revokedByName?: string
  grantedBy?: string
  grantedByName?: string
}

export interface ManualClinicoFreeQuota {
  _id?: string | import('mongodb').ObjectId
  userId: string
  userName?: string
  userEmail?: string
  productId: 'manual-clinico-premium'
  claimedSlugs: string[]
  createdAt: Date
  updatedAt: Date
  lastClaimedAt?: Date
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
  amount: number                   // BRL — valor efetivamente COBRADO (base + taxa)
  /** Preço de tabela, antes da taxa operacional repassada. */
  baseAmount?: number
  /** Taxa operacional / juros de parcelamento somados ao `amount`. */
  feeAmount?: number
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
  /**
   * Marca quando o alerta interno de falha de entrega automática (e-mail com
   * material/serial key que não pôde ser enviado após várias tentativas) já foi
   * disparado aos admins — evita alertas duplicados a cada execução do sweeper.
   */
  fulfillmentAlertSentAt?: Date
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
  /** BRL — valor efetivamente COBRADO em cada ciclo (base + taxa operacional). */
  amount: number
  /** Preço de tabela do plano, antes da taxa repassada. */
  baseAmount?: number
  /** Taxa operacional do Mercado Pago somada ao `amount`. */
  feeAmount?: number
  currency: 'BRL'
  /** Ciclo da cobrança. Ver MESES_DE_RECORRENCIA em lib/payments/subscription-view. */
  billingIntervalMonths: 1 | 3 | 6 | 12
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

// ============================================================
// Mapas Mentais (MindMap Community Platform)
// ============================================================

export type MindMapVisibility = 'private' | 'public' | 'unlisted' | 'password'

/** Estilo de conexão entre os nós. */
export type MindMapEdgeStyle = 'curved' | 'straight' | 'stepped'

/** Aparência geral do mapa (tema, conexões e forma padrão dos nós). */
export interface MindMapStyle {
  /** Chave do tema (paleta + fundo). Ver lib/mindmap-themes. */
  theme: string
  /** Estilo das linhas que ligam os nós. */
  edgeStyle: MindMapEdgeStyle
  /** Forma padrão dos nós que não têm forma própria. */
  nodeShape: 'rounded' | 'pill' | 'rect' | 'ellipse'
}

/** Um nó do mapa mental. Posição livre no canvas + vínculo de árvore via parentId. */
export interface MindMapNode {
  id: string
  parentId: string | null
  text: string
  /** Posição absoluta no canvas (coordenadas do mundo, pré-zoom). */
  x: number
  y: number
  /** Cor de preenchimento (hex). Opcional — usa tema por padrão. */
  color?: string
  /** Cor do texto (hex). */
  textColor?: string
  /** Cor da borda (hex). */
  borderColor?: string
  /** Forma do nó. */
  shape?: 'rounded' | 'pill' | 'rect' | 'ellipse'
  /** Emoji/ícone decorativo opcional. */
  icon?: string
  /** Nota/descrição longa (markdown simples). */
  note?: string
  /** Nó colapsado (esconde descendentes). */
  collapsed?: boolean
}

/** Colaborador convidado pelo dono — pode editar o mapa. */
export interface MindMapCollaborator {
  userId: string
  email: string
  name?: string
  addedAt: Date
}

export interface MindMap {
  _id?: string | import('mongodb').ObjectId
  slug: string
  ownerId: string
  ownerName: string
  title: string
  description?: string
  tags: string[]
  category?: string
  nodes: MindMapNode[]
  /** Colaboradores com permissão de edição (escolhidos pelo dono via e-mail). */
  collaborators?: MindMapCollaborator[]
  /** Estilo/aparência do mapa. Opcional — usa padrão quando ausente. */
  style?: MindMapStyle
  visibility: MindMapVisibility
  /** Hash bcrypt da senha quando visibility === 'password'. Nunca enviado ao cliente. */
  passwordHash?: string | null
  isPublished: boolean
  /** Oculto pela moderação/admin (não some, mas não aparece na comunidade). */
  isHidden?: boolean
  likeCount: number
  viewCount: number
  nodeCount: number
  createdAt: Date
  updatedAt: Date
}

export interface MindMapLike {
  _id?: string | import('mongodb').ObjectId
  mapId: string
  userId: string
  createdAt: Date
}

// ============================================================
// RIFAS / SORTEIOS
// ============================================================

export type RaffleStatus =
  | 'draft'       // rascunho — não aparece publicamente
  | 'scheduled'   // agendada — aparece com contagem regressiva para início
  | 'open'        // aberta — permite compra
  | 'closed'      // encerrada — não permite mais compra
  | 'drawing'     // sorteando — mostra animação ao vivo
  | 'finished'    // finalizada — mostra resultado
  | 'cancelled'   // cancelada — aviso, sem compra

export type RaffleVisibility = 'public' | 'unlisted' | 'private'

export type RaffleNumberStatus = 'available' | 'reserved' | 'sold' | 'drawn'

export type RaffleDrawMethod = 'automatic' | 'manual'

/** Identificadores dos templates visuais disponíveis para a rifa. */
export type RaffleTemplate =
  | 'premium-dark'
  | 'golden'
  | 'neon'
  | 'minimal'
  | 'community'
  | 'luxury'
  | 'event'

/** Personalização visual opcional, sobrepõe valores do template. */
export interface RaffleCustomDesign {
  primaryColor?: string
  secondaryColor?: string
  /** Estilo do card na listagem. */
  cardStyle?: 'glass' | 'solid' | 'outline'
  /** Estilo do grid de números. */
  gridStyle?: 'rounded' | 'square' | 'pill'
  /** CSS background (cor ou gradiente). */
  background?: string
  /** Texto de destaque exibido no topo. */
  highlightText?: string
}

export interface RaffleWinnerEmbedded {
  number: number
  participantId?: string
  purchaseId?: string
  /** Nome do ganhador (parcialmente mascarado para exibição pública). */
  participantName?: string
  prizeName?: string
  drawnAt: Date
  drawMethod: RaffleDrawMethod
  notifiedAt?: Date
}

/** Vídeo de demonstração do prêmio (YouTube, Vimeo ou arquivo direto). */
export interface RaffleVideo {
  url: string
  caption?: string
}

export interface Raffle {
  _id?: string | import('mongodb').ObjectId
  name: string
  slug: string
  description?: string
  pricePerNumber: number
  totalNumbers: number
  winnersCount: number
  coverImageUrl?: string
  prizeName: string
  prizeDescription?: string
  prizeCategory?: string
  prizeImageUrl?: string
  /** Vídeos de demonstração do prêmio, com legenda. */
  videos?: RaffleVideo[]
  template: RaffleTemplate
  customDesign?: RaffleCustomDesign
  visibility: RaffleVisibility
  status: RaffleStatus
  /** Observações/regras adicionais exibidas ao participante. */
  rules?: string
  /** Permite ao admin sortear manualmente mesmo com a rifa aberta. */
  allowManualDrawWhileOpen?: boolean
  /** Permite sortear números não vendidos (sorteio "vazio"). */
  allowDrawUnsoldNumbers?: boolean
  startsAt?: Date
  endsAt?: Date
  createdBy?: string
  createdByName?: string
  createdAt: Date
  updatedAt: Date
  drawAt?: Date
  drawnBy?: string
  winners?: RaffleWinnerEmbedded[]
  /** Cache do total de números vendidos (atualizado nas transições). */
  soldCount?: number
}

export interface RaffleNumber {
  _id?: string | import('mongodb').ObjectId
  raffleId: string
  number: number
  status: RaffleNumberStatus
  reservedBySessionId?: string
  reservedUntil?: Date
  participantId?: string
  purchaseId?: string
  /** id do payment_orders */
  orderId?: string
  createdAt: Date
  updatedAt: Date
}

export interface RaffleParticipant {
  _id?: string | import('mongodb').ObjectId
  raffleId: string
  userId?: string
  name: string
  email: string
  phone: string
  createdAt: Date
}

export type RafflePurchaseStatus = 'pending' | 'paid' | 'expired' | 'cancelled' | 'refunded'

export interface RafflePurchase {
  _id?: string | import('mongodb').ObjectId
  raffleId: string
  participantId?: string
  participantName: string
  participantEmail: string
  participantPhone: string
  userId?: string
  numbers: number[]
  amount: number
  pricePerNumber: number
  status: RafflePurchaseStatus
  /** id do payment_orders interno (external_reference no MP). */
  orderId?: string
  mercadoPagoPaymentId?: string
  mercadoPagoPreferenceId?: string
  checkoutUrl?: string
  /** sessão anônima que reservou os números. */
  reservedBySessionId?: string
  reservedUntil?: Date
  createdAt: Date
  updatedAt: Date
  paidAt?: Date
}

export interface RaffleWinner {
  _id?: string | import('mongodb').ObjectId
  raffleId: string
  number: number
  participantId?: string
  purchaseId?: string
  participantName?: string
  participantEmail?: string
  prizeName: string
  drawnAt: Date
  drawMethod: RaffleDrawMethod
  drawnBy?: string
  notifiedAt?: Date
}
