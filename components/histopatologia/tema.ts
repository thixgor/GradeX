import type { EstadoDeDireitos, EstadoDeRevisao, MecanismoGeral } from '@/lib/histopatologia/esquemas'

/**
 * Vocabulário visual da Histopatologia.
 *
 * Reaproveita a linguagem do Manual da Histologia — mesmas superfícies, mesmos
 * cantos, mesma tipografia — e acrescenta o que é próprio da patologia: dois
 * eixos de estado que precisam ser lidos de relance e **nunca** apenas por cor.
 *
 * Cada estado tem sempre três marcas: cor, rótulo textual e um símbolo. O
 * requisito de acessibilidade ("nunca usar cor como único indicador") não é
 * atendido por bom senso na hora de escrever a tela; é atendido por o dado já
 * vir acompanhado do texto e do símbolo desde aqui.
 */

export interface Marca {
  rotulo: string
  /** Símbolo textual, para quem não distingue as cores. */
  simbolo: string
  classe: string
}

export const MARCA_DE_REVISAO: Record<EstadoDeRevisao, Marca> = {
  rascunho: {
    rotulo: 'Rascunho',
    simbolo: '○',
    classe: 'border-border bg-muted text-muted-foreground',
  },
  'revisao-medica': {
    rotulo: 'Em revisão médica',
    simbolo: '◐',
    classe: 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300',
  },
  publicado: {
    rotulo: 'Revisado e publicado',
    simbolo: '●',
    classe: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
  },
  desatualizado: {
    rotulo: 'Desatualizado',
    simbolo: '△',
    classe: 'border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-300',
  },
}

export const MARCA_DE_DIREITOS: Record<EstadoDeDireitos, Marca> = {
  pendente: {
    rotulo: 'Direitos em verificação',
    simbolo: '◌',
    classe: 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300',
  },
  'autorizado-link-remoto': {
    rotulo: 'Autorizado como link',
    simbolo: '↗',
    classe: 'border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-300',
  },
  'autorizado-incorporacao': {
    rotulo: 'Direitos aprovados',
    simbolo: '●',
    classe: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
  },
  bloqueado: {
    rotulo: 'Exibição bloqueada',
    simbolo: '✕',
    classe: 'border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-300',
  },
}

export const MARCA_DE_NATUREZA: Record<string, Marca> = {
  'nao-neoplasica': {
    rotulo: 'Não neoplásica',
    simbolo: '□',
    classe: 'border-teal-500/40 bg-teal-500/10 text-teal-800 dark:text-teal-300',
  },
  'neoplasica-benigna': {
    rotulo: 'Neoplasia benigna',
    simbolo: '◇',
    classe: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-800 dark:text-indigo-300',
  },
  'neoplasica-maligna': {
    rotulo: 'Neoplasia maligna',
    simbolo: '◆',
    classe: 'border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-300',
  },
  indefinida: {
    rotulo: 'Natureza indefinida',
    simbolo: '?',
    classe: 'border-border bg-muted text-muted-foreground',
  },
}

/** Peso diagnóstico de um achado. Quatro níveis, quatro marcas distinguíveis. */
export const MARCA_DE_PESO: Record<string, Marca> = {
  frequente: {
    rotulo: 'Frequente',
    simbolo: '·',
    classe: 'border-border bg-muted text-muted-foreground',
  },
  sugestivo: {
    rotulo: 'Sugestivo',
    simbolo: '◐',
    classe: 'border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-300',
  },
  necessário: {
    rotulo: 'Necessário',
    simbolo: '▲',
    classe: 'border-violet-500/40 bg-violet-500/10 text-violet-800 dark:text-violet-300',
  },
  suficiente: {
    rotulo: 'Suficiente',
    simbolo: '★',
    classe: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
  },
}

export const CLASSE_DE_FAMILIA: Record<MecanismoGeral['familia'], string> = {
  'lesao-celular': 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300',
  inflamacao: 'border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-300',
  hemodinamica: 'border-red-500/40 bg-red-500/10 text-red-800 dark:text-red-300',
  imunopatologia: 'border-violet-500/40 bg-violet-500/10 text-violet-800 dark:text-violet-300',
  infeccao: 'border-lime-500/40 bg-lime-500/10 text-lime-800 dark:text-lime-300',
  'reparo-fibrose': 'border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-300',
  genetica: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-800 dark:text-indigo-300',
  neoplasia: 'border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-800 dark:text-fuchsia-300',
}

/** Rótulos dos aumentos, na ordem real do microscópio. */
export const AUMENTOS = [
  { id: 'panoramica', rotulo: 'Panorâmica', objetivo: 'Scanner / 1×–2×' },
  { id: 'pequeno', rotulo: 'Pequeno aumento', objetivo: '4×' },
  { id: 'medio', rotulo: 'Médio aumento', objetivo: '10×–20×' },
  { id: 'grande', rotulo: 'Grande aumento', objetivo: '40×' },
] as const

export type IdDeAumento = (typeof AUMENTOS)[number]['id']

/** Níveis de profundidade de leitura. */
export const PROFUNDIDADES = [
  {
    id: 'essencial',
    rotulo: 'Essencial',
    descricao: 'Definição, mecanismo central e os achados-chave. Faz sentido sozinho.',
  },
  {
    id: 'aprofundar',
    rotulo: 'Aprofundar',
    descricao: 'Sequência molecular e celular, exames complementares e diferenciais.',
  },
  {
    id: 'avancado',
    rotulo: 'Revisão avançada',
    descricao: 'Classificações, biomarcadores, limitações e pontos em discussão.',
  },
] as const

export type IdDeProfundidade = (typeof PROFUNDIDADES)[number]['id']

/** A seção deve aparecer no nível de profundidade escolhido? */
export function visivelEm(
  nivelDaSecao: IdDeProfundidade,
  nivelEscolhido: IdDeProfundidade,
): boolean {
  const ordem: IdDeProfundidade[] = ['essencial', 'aprofundar', 'avancado']
  return ordem.indexOf(nivelDaSecao) <= ordem.indexOf(nivelEscolhido)
}
