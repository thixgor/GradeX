import { ObjectId } from 'mongodb'

// ============================================
// BANCO DE QUESTÕES - TIPOS
// ============================================

export type BancoQuestaoTipo = 'objetiva' | 'discursiva'
export type BancoDificuldade = 'facil' | 'medio' | 'dificil'
export type BancoAlternativaLetra = 'A' | 'B' | 'C' | 'D' | 'E'

// Hierarquia: Período → Módulo → Tópico → Subtópico

export interface BancoPeriodo {
  _id?: string | ObjectId
  nome: string           // "SOI I", "HAM II", etc.
  codigo: string         // "soi-1", "ham-2"
  ordem: number          // Para ordenação
  createdAt: Date
  updatedAt: Date
}

export interface BancoModulo {
  _id?: string | ObjectId
  periodoId: string | ObjectId
  nome: string
  codigo: string
  ordem: number
  createdAt: Date
  updatedAt: Date
}

export interface BancoTopico {
  _id?: string | ObjectId
  moduloId: string | ObjectId
  nome: string
  codigo: string
  ordem: number
  createdAt: Date
  updatedAt: Date
}

export interface BancoSubtopico {
  _id?: string | ObjectId
  topicoId: string | ObjectId
  nome: string
  codigo: string
  ordem: number
  createdAt: Date
  updatedAt: Date
}

export interface BancoAlternativa {
  letra: BancoAlternativaLetra
  texto: string
  correta: boolean
}

export interface BancoQuestao {
  _id?: string | ObjectId
  tipo: BancoQuestaoTipo
  periodoId: string | ObjectId
  moduloId: string | ObjectId
  topicoId: string | ObjectId
  subtopicoid?: string | ObjectId

  enunciado: string
  explicacao?: string

  // Imagens (URLs do imgur ou upload)
  imagemUrl?: string           // URL da imagem principal (imgur ou upload)
  imagensAlternativas?: {      // Imagens por alternativa
    letra: BancoAlternativaLetra
    url: string
  }[]

  // Para objetivas
  alternativas?: BancoAlternativa[]

  // Para discursivas
  respostaModelo?: string

  // Metadados
  dificuldade?: BancoDificuldade
  tags?: string[]
  fonte?: string
  ano?: number

  // Estatísticas
  totalRespostas: number
  totalAcertos: number

  createdAt: Date
  updatedAt: Date
  createdBy: string | ObjectId
}

export type BancoModoResposta = 'imediato' | 'final'

export interface BancoListaUsuario {
  _id?: string | ObjectId
  userId: string | ObjectId
  nome: string
  questaoIds: (string | ObjectId)[]
  modoResposta: BancoModoResposta // 'imediato' = mostra resposta após cada questão, 'final' = mostra todas no final
  createdAt: Date
  updatedAt: Date
}

export interface BancoResolucao {
  _id?: string | ObjectId
  userId: string | ObjectId
  questaoId: string | ObjectId
  tipo: BancoQuestaoTipo

  // Para objetiva
  alternativaSelecionada?: BancoAlternativaLetra
  correta?: boolean

  // Para discursiva
  respostaUsuario?: string

  tempoGasto?: number  // em segundos
  createdAt: Date
}

// ============================================
// TIPOS PARA API RESPONSES
// ============================================

export interface BancoPeriodoComContagem extends BancoPeriodo {
  totalQuestoes: number
  totalModulos: number
}

export interface BancoModuloComContagem extends BancoModulo {
  totalQuestoes: number
  totalTopicos: number
  periodoNome?: string
}

export interface BancoTopicoComContagem extends BancoTopico {
  totalQuestoes: number
  totalSubtopicos: number
  moduloNome?: string
}

export interface BancoSubtopicoComContagem extends BancoSubtopico {
  totalQuestoes: number
  topicoNome?: string
}

export interface BancoQuestaoComHierarquia extends BancoQuestao {
  periodoNome?: string
  moduloNome?: string
  topicoNome?: string
  subtopicoNome?: string
  jaResolvida?: boolean
  ultimaResolucao?: BancoResolucao
}

export interface BancoEstatisticasUsuario {
  totalResolvidas: number
  totalAcertos: number
  totalErros: number
  percentualAcerto: number
  questoesPorPeriodo: {
    periodoId: string
    periodoNome: string
    total: number
    acertos: number
  }[]
  questoesPorTipo: {
    tipo: BancoQuestaoTipo
    total: number
    acertos: number
  }[]
  ultimasResolucoes: BancoResolucao[]
}

export interface BancoEstatisticasAdmin {
  totalQuestoes: number
  questoesPorTipo: {
    objetiva: number
    discursiva: number
  }
  questoesPorPeriodo: {
    periodoId: string
    periodoNome: string
    total: number
  }[]
  questoesPorDificuldade: {
    facil: number
    medio: number
    dificil: number
    semClassificacao: number
  }
  totalResolucoes: number
  resolucoesHoje: number
  mediaAcertos: number
  relatosPendentes: number
}

// ============================================
// TIPOS PARA FILTROS E PAGINAÇÃO
// ============================================

export interface BancoQuestoesFiltros {
  periodoId?: string
  moduloId?: string
  topicoId?: string
  subtopicoId?: string
  tipo?: BancoQuestaoTipo
  dificuldade?: BancoDificuldade
  apenasNaoResolvidas?: boolean
  tags?: string[]
  busca?: string
}

export interface BancoPaginacao {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface BancoQuestoesResponse {
  questoes: BancoQuestaoComHierarquia[]
  paginacao: BancoPaginacao
}

// ============================================
// TIPOS PARA IMPORTAÇÃO TXT
// ============================================

export interface BancoQuestaoImportacao {
  tipo: BancoQuestaoTipo
  periodo?: string            // Opcional se módulo for fornecido
  modulo: string
  topico: string
  subtopico?: string
  enunciado: string
  imagemUrl?: string          // URL da imagem (imgur ou upload)
  alternativas?: {
    letra: string
    texto: string
  }[]
  correta?: string
  respostaModelo?: string
  explicacao?: string
  dificuldade?: BancoDificuldade
  tags?: string[]
  fonte?: string
  ano?: number
}

export interface BancoImportacaoResult {
  sucesso: boolean
  totalImportadas: number
  erros: {
    linha: number
    mensagem: string
  }[]
  questoesImportadas: BancoQuestao[]
}

// ============================================
// TIPOS PARA FORMULÁRIOS
// ============================================

export interface BancoQuestaoFormData {
  tipo: BancoQuestaoTipo
  periodoId: string
  moduloId: string
  topicoId: string
  subtopicoId?: string
  enunciado: string
  explicacao?: string
  imagemUrl?: string  // URL da imagem (imgur ou upload)
  alternativas?: {
    letra: BancoAlternativaLetra
    texto: string
    correta: boolean
  }[]
  respostaModelo?: string
  dificuldade?: BancoDificuldade
  tags?: string[]
  fonte?: string
  ano?: number
}

export interface BancoListaFormData {
  nome: string
  questaoIds?: string[]
  modoResposta?: BancoModoResposta
}

// ============================================
// TIPOS PARA GERAÇÃO DE LISTA ALEATÓRIA
// ============================================

export interface BancoListaAleatoriaFiltros {
  periodoId?: string
  moduloId?: string
  topicoId?: string
  subtopicoId?: string
  tipo?: BancoQuestaoTipo
  dificuldade?: BancoDificuldade
  ano?: number
  quantidade: number
  modoResposta: BancoModoResposta
  nome: string
}
