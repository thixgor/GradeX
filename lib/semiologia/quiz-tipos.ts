import type { DistratorClinico, SinaisVitais } from '@/lib/radiologia/casos-clinicos'

export type { DistratorClinico, SinaisVitais }

/**
 * Uma questão do quiz de semiologia.
 *
 * A consulta é escrita por inteiro — queixa, história da doença atual,
 * antecedentes pessoais, gestacionais ou perinatais quando pesam, história
 * familiar e hereditária, hábitos e fatores de risco, sinais vitais e exame — e
 * a mídia é a do próprio acervo da ficha (`sinal`), na posição `midia`. A
 * legenda da mídia entrega o diagnóstico, então ela só aparece depois da
 * resposta, junto com `olhar`, o apontamento do que procurar na imagem, no
 * vídeo ou no áudio.
 */
export interface QuestaoSemiologia {
  id: string
  /** Ficha do Manual de Semiologia cuja mídia ilustra a questão. */
  sinal: string
  /** Posição da mídia no acervo da ficha (0-based). */
  midia?: number
  cenario: string
  identificacao: string
  queixa: string
  historia: string
  antecedentes: {
    pessoais: string[]
    /** Gestação, parto e período neonatal — ou história obstétrica da paciente. */
    gestacionais?: string[]
    familiares: string[]
    habitos: string[]
  }
  vitais: SinaisVitais
  exame: string[]
  pergunta: string
  /** Rótulo curto da resposta certa, paralelo aos distratores. */
  achado: string
  /** O diagnóstico por extenso, que só aparece depois da resposta. */
  veredito: string
  distratores: DistratorClinico[]
  /** Apontamento: onde olhar na imagem, no vídeo ou no áudio, e o que ver. */
  olhar: string
  /** Comentário aprofundado: mecanismo e como a história e o achado se encaixam. */
  explicacao: string
  conduta: string
}

export interface QuizSemiologia {
  id: string
  titulo: string
  descricao: string
  questoes: QuestaoSemiologia[]
}
