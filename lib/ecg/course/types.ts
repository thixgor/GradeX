/**
 * Modelo de conteúdo da trilha de ensino do Manual do Eletrocardiograma.
 *
 * O currículo é dado (não JSX) para que o mesmo conteúdo possa ser percorrido
 * pelo player de lições, pela busca e pelo cálculo de progresso sem duplicação.
 * Cada lição é uma sequência de passos; cada passo é uma tela.
 */

/** Caixa de destaque dentro de um passo expositivo. */
export type CalloutKind =
  | 'macete'    // mnemônico / atalho de prova
  | 'porque'    // o mecanismo por trás do achado
  | 'atencao'   // erro comum, pegadinha
  | 'prova'     // como o tema cai em prova/residência
  | 'clinica'   // o que fazer com isso na beira do leito

export interface Callout {
  kind: CalloutKind
  title?: string
  text: string
}

export interface TeachTable {
  head: string[]
  rows: string[][]
  caption?: string
  /** Índice da coluna que recebe destaque numérico (fonte monoespaçada). */
  numericFrom?: number
}

export interface Bullet {
  t: string
  d: string
}

/** Identificador de um laboratório interativo (registro em components/ecg/course/widgets). */
export type WidgetId =
  | 'wave-builder'
  | 'pacemaker-lab'
  | 'velocity-lab'
  | 'refractory-lab'
  | 'tetany-lab'
  | 'paper-lab'
  | 'interval-lab'
  | 'leads-explorer'
  | 'axis-lab'
  | 'hr-lab'
  | 'block-lab'
  | 'bbb-lab'
  | 'electrolyte-lab'
  | 'wave-doctor'
  | 'letters-lab'
  | 'read-order-lab'

export interface WidgetSpec {
  id: WidgetId
  /** Configuração opcional passada ao laboratório (ex.: cenário inicial). */
  props?: Record<string, unknown>
}

export interface TeachStep {
  kind: 'teach'
  title: string
  /** Frase-âncora exibida em destaque antes do corpo. */
  lead?: string
  body?: string[]
  bullets?: Bullet[]
  table?: TeachTable
  callouts?: Callout[]
  /** Laboratório interativo embutido no fim do passo. */
  widget?: WidgetSpec
}

export interface LabStep {
  kind: 'lab'
  title: string
  intro?: string
  widget: WidgetSpec
  outro?: string
  callouts?: Callout[]
}

export interface QuizOption {
  text: string
  correct?: boolean
}

export interface QuizStep {
  kind: 'quiz'
  /** Enunciado curto ("caso") exibido acima da pergunta. */
  stem?: string
  question: string
  options: QuizOption[]
  explain: string
}

/** Ordenar itens na sequência correta — `items` já vem na ordem certa. */
export interface OrderStep {
  kind: 'order'
  question: string
  hint?: string
  items: string[]
  explain: string
}

/** Parear conceito ↔ significado. */
export interface MatchStep {
  kind: 'match'
  question: string
  pairs: { left: string; right: string }[]
  explain: string
}

/** Completar a lacuna escolhendo entre alternativas curtas. */
export interface FillStep {
  kind: 'fill'
  question: string
  /** Texto com `___` marcando a lacuna. */
  sentence: string
  options: string[]
  answer: string
  explain: string
}

export type Step = TeachStep | LabStep | QuizStep | OrderStep | MatchStep | FillStep

/** Passos que valem acerto/erro no placar da lição. */
export type GradedStep = QuizStep | OrderStep | MatchStep | FillStep

export function isGraded(step: Step): step is GradedStep {
  return step.kind === 'quiz' || step.kind === 'order' || step.kind === 'match' || step.kind === 'fill'
}

export interface Lesson {
  id: string
  title: string
  subtitle: string
  /** Estimativa de duração em minutos, exibida na trilha. */
  minutes: number
  xp: number
  steps: Step[]
}

export interface CourseModule {
  id: string
  title: string
  tagline: string
  /** Chave de cor da trilha (mapeada para classes no componente). */
  color: ModuleColor
  lessons: Lesson[]
}

export type ModuleColor =
  | 'emerald'
  | 'sky'
  | 'violet'
  | 'amber'
  | 'rose'
  | 'cyan'
  | 'lime'
  | 'orange'
  | 'fuchsia'
  | 'teal'
  | 'indigo'
