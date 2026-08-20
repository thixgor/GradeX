import { ObjectId } from 'mongodb'

// ============================================
// BANCO DE QUESTÕES - TIPOS
// ============================================

export type BancoQuestaoTipo = 'objetiva' | 'discursiva'
export type BancoDificuldade = 'facil' | 'medio' | 'dificil'
export type BancoAlternativaLetra = 'A' | 'B' | 'C' | 'D' | 'E'

/*
 * Hierarquia: Módulo → Tópico → Subtópico.
 *
 * "Período" foi removido do produto — pedia o nome interno da grade da
 * faculdade antes de a pessoa ver qualquer questão, e fazia o mesmo módulo
 * existir duas vezes sem ninguém notar. Os tipos abaixo permanecem porque os
 * documentos antigos continuam no banco (nada foi apagado), mas `periodoId`
 * é opcional em tudo que se escreve hoje. Ver lib/banco/hierarquia.ts.
 */

/** @deprecated Nível removido do produto; mantido para ler dado antigo. */
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
  /** @deprecated Só existe em módulos criados antes da remoção do período. */
  periodoId?: string | ObjectId
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
  /** @deprecated Só existe em questões criadas antes da remoção do período. */
  periodoId?: string | ObjectId
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
  /**
   * Semestre letivo (1 ou 2) lido do título da prova de origem.
   * Ver lib/banco/periodo-letivo.ts.
   */
  semestre?: 1 | 2
  /** "2026.2" — ano e semestre juntos, prontos para filtrar e exibir. */
  periodoLetivo?: string

  // Estatísticas
  totalRespostas: number
  totalAcertos: number

  createdAt: Date
  updatedAt: Date
  createdBy: string | ObjectId

  /**
   * Identifica a leva de importação (arquivo TXT) que criou esta questão.
   * Todas as questões gravadas numa mesma chamada de POST /api/admin/banco/importar
   * recebem o mesmo id, gerado ali. Ausente em questões criadas manualmente,
   * editadas na tela ou trazidas pelo importador de provas.
   */
  loteImportacaoId?: string | ObjectId
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
  periodoId?: string | string[]
  moduloId?: string | string[]
  topicoId?: string | string[]
  subtopicoId?: string | string[]
  tipo?: BancoQuestaoTipo
  dificuldade?: BancoDificuldade
  apenasNaoResolvidas?: boolean
  /** Só as que a pessoa já resolveu E errou — o material de revisão mais direto que existe. */
  apenasErradas?: boolean
  /** Só questão com `imagemUrl` preenchido — ECG, radiografia, lâmina de histologia. */
  comImagem?: boolean
  /** Só questão com `explicacao` preenchida — quem quer estudar pela resposta comentada, não só treinar. */
  comExplicacao?: boolean
  tags?: string[]
  busca?: string
  anos?: number[]
  /** Rótulos de período letivo, ex.: ["2026.2", "2026.1"]. */
  periodos?: string[]
  ordenar?: BancoOrdenacao
}

/**
 * Como listar as questões que casam com o filtro.
 *
 * - `recentes`     — as que entraram por último no banco primeiro (padrão).
 * - `menosPraticadas` — quem tem menos respostas registradas primeiro; é o
 *   filtro de quem quer treinar o que a turma ainda não gastou.
 * - `maisDificeis` — menor taxa de acerto primeiro, entre as que já têm
 *   alguma resposta; questão nunca respondida não tem taxa e fica depois.
 */
export type BancoOrdenacao = 'recentes' | 'menosPraticadas' | 'maisDificeis'

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

export interface BancoImportacaoOcorrencia {
  linha: number
  mensagem: string
}

export interface BancoImportacaoResult {
  sucesso: boolean
  /** `true` quando foi só conferência: nada foi gravado. */
  validacao?: boolean
  totalImportadas: number
  /** Quantas entrariam, na conferência. */
  totalAImportar?: number
  /** Já existiam no mesmo módulo e por isso não entraram de novo. */
  totalIgnoradas?: number
  erros: BancoImportacaoOcorrencia[]
  /** Não impedem a questão de entrar; dizem o que foi assumido ou ignorado. */
  avisos?: BancoImportacaoOcorrencia[]
  /** Amostra: a resposta não devolve milhares de questões inteiras. */
  questoesImportadas: BancoQuestao[]
  /** Níveis criados (ou, na conferência, que seriam criados). */
  hierarquiaCriada?: {
    modulos: string[]
    topicos: string[]
    subtopicos: string[]
  }
  /** Id da leva gravada — usado para achá-la depois no histórico de importações. */
  loteImportacaoId?: string
}

/** Uma leva de importação, no histórico. Ver GET /api/admin/banco/importar/historico. */
export interface BancoImportacaoLote {
  loteId: string
  criadoEm: string
  criadoPorNome?: string
  quantidade: number
  objetivas: number
  discursivas: number
  modulos: string[]
}

// ============================================
// TIPOS PARA FORMULÁRIOS
// ============================================

export interface BancoQuestaoFormData {
  tipo: BancoQuestaoTipo
  /** @deprecated */
  periodoId?: string
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
  /** Um ano, por compatibilidade — a tela manda `anos`. */
  ano?: number
  anos?: number[]
  /** Rótulos de período letivo, ex.: ["2026.2"]. */
  periodos?: string[]
  quantidade: number
  modoResposta: BancoModoResposta
  nome: string
  excluirJaResolvidas?: boolean
  /** Sorteia só entre as que a pessoa já errou — lista de revisão. */
  apenasErradas?: boolean
  comImagem?: boolean
  comExplicacao?: boolean
}
