export type AreaSaude = 'Medicina' | 'Psicologia' | 'Odontologia' | 'Biomedicina'

export type SistemaFisiologico =
  | 'Sistema Cardiovascular'
  | 'Sistema Respiratório'
  | 'Sistema Nervoso Central e Periférico'
  | 'Sistema Digestivo e Hepatobiliar'
  | 'Sistema Endócrino e Metabólico'
  | 'Sistema Renal e Urinário'
  | 'Sistema Musculoesquelético'
  | 'Sistema Imunológico e Reumatológico'
  | 'Sistema Hematológico'
  | 'Sistema Dermatológico'
  | 'Sistema Reprodutor e Ginecológico'
  | 'Saúde Mental e Transtornos Psiquiátricos'
  | 'Sistema Estomatognático e Saúde Bucal'
  | 'Doenças Infecciosas e Parasitárias'
  | 'Oncologia Geral'

export const AREAS_SAUDE: AreaSaude[] = [
  'Medicina',
  'Psicologia',
  'Odontologia',
  'Biomedicina'
]

export const SISTEMAS_FISIOLOGICOS: SistemaFisiologico[] = [
  'Sistema Cardiovascular',
  'Sistema Respiratório',
  'Sistema Nervoso Central e Periférico',
  'Sistema Digestivo e Hepatobiliar',
  'Sistema Endócrino e Metabólico',
  'Sistema Renal e Urinário',
  'Sistema Musculoesquelético',
  'Sistema Imunológico e Reumatológico',
  'Sistema Hematológico',
  'Sistema Dermatológico',
  'Sistema Reprodutor e Ginecológico',
  'Saúde Mental e Transtornos Psiquiátricos',
  'Sistema Estomatognático e Saúde Bucal',
  'Doenças Infecciosas e Parasitárias',
  'Oncologia Geral'
]

export interface Farmaco {
  medicamento: string
  classe: string
  mecanismo_acao: string
  dose_usual: string
  efeitos_colaterais: string[]
  contraindicacoes: string[]
}

export interface Farmacologia {
  primeira_linha: Farmaco[]
  segunda_linha: Farmaco[]
  terceira_linha?: Farmaco[]
}

export interface Patologia {
  _id?: string
  nome: string
  sinonimos: string[]
  areas: AreaSaude[]
  sistema: SistemaFisiologico
  classificacao: string
  fisiopatologia: string
  diagnostico_semiologico: string
  diagnosticos_diferenciais: string
  gravidade: string
  tratamento: string
  farmacologia: Farmacologia
  fluxograma_tratamento: string
  cid10: string
  slug: string
  // Campos opcionais
  imagens_mecanismo?: string[]
  legenda_imagens?: string[]
  observacoes_clinicas?: string
  referencias?: string
  // Metadados
  createdAt?: Date
  updatedAt?: Date
}

export interface PatologiaFormData extends Omit<Patologia, '_id' | 'slug' | 'createdAt' | 'updatedAt'> {}
