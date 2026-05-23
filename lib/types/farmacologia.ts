// ─────────────────────────────────────────────────────────────
// Farmacologia — Manual Clínico
// Medicamentos organizados em Classes (principal) e Subclasses.
// ─────────────────────────────────────────────────────────────

export type TipoFarmaco =
  | 'Fármaco ativo'
  | 'Pró-fármaco'
  | 'Metabólito ativo'
  | 'Fármaco ativo com metabólito ativo'
  | 'Outro'

export const TIPOS_FARMACO: TipoFarmaco[] = [
  'Fármaco ativo',
  'Pró-fármaco',
  'Metabólito ativo',
  'Fármaco ativo com metabólito ativo',
  'Outro',
]

// Cada contraindicação carrega o motivo (o porquê).
export interface Contraindicacao {
  condicao: string
  motivo: string
}

// Um "check" exibido na calculadora de dose. Quando marcado e `contraindica`
// for verdadeiro, o app avisa que o medicamento é contraindicado para a pessoa.
export interface DoseCheck {
  label: string
  contraindica: boolean
  // opcional: motivo específico (se vazio, tenta casar com a lista de contraindicações)
  motivo?: string
}

// Configuração da calculadora de dose. A dose é estimada a partir de
// `mg_por_kg * peso` ou de `dose_fixa`, com ajustes por sexo e idade.
export interface DoseCalculo {
  enabled: boolean
  unidade: string            // ex.: 'mg'
  via: string                // ex.: 'VO', 'IV'
  mg_por_kg: number | null   // dose por kg de peso (por administração)
  dose_fixa: number | null   // dose fixa (usada quando não há mg_por_kg)
  dose_min: number | null    // piso da dose calculada
  dose_max: number | null    // teto da dose calculada
  frequencia: string         // ex.: '8/8h'
  ajuste_idoso_pct: number | null   // ex.: -25 reduz 25% para idosos (>=65)
  fator_masculino: number | null    // multiplicador para sexo masculino (default 1)
  fator_feminino: number | null     // multiplicador para sexo feminino (default 1)
  observacao_calculo: string
  checks: DoseCheck[]
}

export interface Medicamento {
  _id?: string
  nome: string
  sinonimos: string[]              // nomes comerciais / alternativos
  classe_principal: string         // ver CLASSES_MEDICAMENTOS
  subclasse: string                // subclasse dentro da classe
  slug: string

  // ── Seções da ficha ──
  classificacao: string            // inclui se é pró-fármaco, fármaco ativo, etc.
  tipo_farmaco: TipoFarmaco | ''   // classificação rápida (badge)
  principais_funcoes: string
  mecanismo_acao_compacto: string
  mecanismo_acao_detalhado: string
  metabolismo: string
  excrecao: string
  efeitos_colaterais: string[]
  efeitos_adversos: string[]
  contraindicacoes: Contraindicacao[]
  posologia: string
  calculo_dose: DoseCalculo
  fluxograma_uso: string
  observacoes_clinicas: string
  referencias: string

  // ── Metadados ──
  createdAt?: Date
  updatedAt?: Date
}

export interface MedicamentoFormData
  extends Omit<Medicamento, '_id' | 'slug' | 'createdAt' | 'updatedAt'> {}

// Texto fixo (hardcoded) que explica a diferença antes de listar efeitos.
export const EFEITOS_EXPLICACAO = {
  colaterais:
    'Efeitos previsíveis e geralmente leves que decorrem da própria ação farmacológica do medicamento em doses terapêuticas. Costumam ser dose-dependentes, conhecidos e, na maioria das vezes, toleráveis ou manejáveis (ex.: sonolência com anti-histamínicos, tosse seca com IECA).',
  adversos:
    'Respostas nocivas e não-intencionais ao medicamento, que podem ser graves, imprevisíveis e exigir intervenção, suspensão do fármaco ou notificação (farmacovigilância). Incluem reações idiossincráticas, alérgicas e tóxicas (ex.: hepatotoxicidade, anafilaxia, síndrome de Stevens-Johnson).',
} as const

// ─────────────────────────────────────────────────────────────
// Taxonomia de Classes e Subclasses
// ─────────────────────────────────────────────────────────────
export interface ClasseMedicamento {
  classe: string
  subclasses: string[]
}

export const CLASSES_MEDICAMENTOS: ClasseMedicamento[] = [
  {
    classe: 'Antimicrobianos',
    subclasses: [
      'Penicilinas',
      'Cefalosporinas',
      'Carbapenêmicos',
      'Monobactâmicos',
      'Macrolídeos',
      'Aminoglicosídeos',
      'Quinolonas e Fluoroquinolonas',
      'Tetraciclinas',
      'Sulfonamidas',
      'Glicopeptídeos',
      'Lincosamidas',
      'Nitroimidazólicos',
      'Antifúngicos',
      'Antivirais',
      'Antiparasitários',
      'Antituberculosos',
    ],
  },
  {
    classe: 'Sistema Cardiovascular',
    subclasses: [
      'Inibidores da ECA (IECA)',
      'Bloqueadores do Receptor de Angiotensina (BRA)',
      'Bloqueadores dos Canais de Cálcio (BCC)',
      'Betabloqueadores',
      'Diuréticos',
      'Antiarrítmicos',
      'Nitratos e Antianginosos',
      'Hipolipemiantes (Estatinas e Fibratos)',
      'Inotrópicos e Digitálicos',
      'Vasopressores e Vasodilatadores',
    ],
  },
  {
    classe: 'Sistema Nervoso Central',
    subclasses: [
      'Antidepressivos (ISRS)',
      'Antidepressivos (IRSN)',
      'Antidepressivos Tricíclicos',
      'IMAO',
      'Ansiolíticos e Benzodiazepínicos',
      'Antipsicóticos Típicos',
      'Antipsicóticos Atípicos',
      'Anticonvulsivantes e Antiepilépticos',
      'Estabilizadores do Humor',
      'Antiparkinsonianos',
      'Hipnóticos e Sedativos',
      'Psicoestimulantes',
    ],
  },
  {
    classe: 'Analgésicos, Anti-inflamatórios e Antitérmicos',
    subclasses: [
      'Analgésicos não-opioides',
      'Opioides',
      'Anti-inflamatórios não esteroidais (AINEs)',
      'Antitérmicos',
      'Antienxaqueca',
      'Agentes para Gota',
    ],
  },
  {
    classe: 'Sistema Endócrino e Metabólico',
    subclasses: [
      'Biguanidas',
      'Sulfonilureias',
      'Insulinas',
      'Inibidores da DPP-4',
      'Inibidores do SGLT2',
      'Agonistas do GLP-1',
      'Hormônios Tireoidianos e Antitireoidianos',
      'Corticosteroides',
      'Hormônios Sexuais e Contraceptivos',
      'Agentes para Osteoporose',
    ],
  },
  {
    classe: 'Sistema Respiratório',
    subclasses: [
      'Beta-2 agonistas',
      'Anticolinérgicos inalatórios',
      'Xantinas',
      'Corticoides inalatórios',
      'Anti-histamínicos',
      'Antitussígenos e Expectorantes',
      'Antileucotrienos',
    ],
  },
  {
    classe: 'Sistema Digestório',
    subclasses: [
      'Inibidores da Bomba de Prótons (IBP)',
      'Antagonistas H2',
      'Antiácidos',
      'Antieméticos',
      'Procinéticos',
      'Laxantes',
      'Antidiarreicos',
      'Anti-inflamatórios intestinais',
    ],
  },
  {
    classe: 'Sistema Hematológico',
    subclasses: [
      'Anticoagulantes',
      'Antiagregantes Plaquetários',
      'Fibrinolíticos',
      'Hematopoéticos e Antianêmicos',
    ],
  },
  {
    classe: 'Sistema Geniturinário',
    subclasses: [
      'Diuréticos',
      'Agentes para Hiperplasia Prostática (HPB)',
      'Antiespasmódicos Urinários',
      'Disfunção Erétil',
    ],
  },
  {
    classe: 'Antineoplásicos e Imunomoduladores',
    subclasses: [
      'Quimioterápicos',
      'Imunossupressores',
      'Imunobiológicos',
    ],
  },
  {
    classe: 'Anestésicos',
    subclasses: [
      'Anestésicos Locais',
      'Anestésicos Gerais',
      'Bloqueadores Neuromusculares',
    ],
  },
  {
    classe: 'Vitaminas, Eletrólitos e Suplementos',
    subclasses: [
      'Vitaminas',
      'Eletrólitos e Minerais',
      'Soluções e Reposição',
    ],
  },
]

export const CLASSES_MEDICAMENTOS_NAMES: string[] = CLASSES_MEDICAMENTOS.map(c => c.classe)

export function normalizeClasse(s: string): string {
  return s
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .toLowerCase()
    .trim()
}

export function getSubclassesForClasse(classe: string): string[] {
  const found = CLASSES_MEDICAMENTOS.find(
    c => normalizeClasse(c.classe) === normalizeClasse(classe)
  )
  return found ? found.subclasses : []
}
