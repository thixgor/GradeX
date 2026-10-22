import type { ItemDoCatalogo } from './catalogo-tipos'
import type { NoCurriculo, Quiz } from './esquemas'
import type { ModuloDeLaboratorio } from './laboratorio'
import type { Modo } from './quiz-engine'

/**
 * Contratos das páginas de navegação do catálogo: `normal`, `praticar`,
 * `sistemas`, `sistemas/<sistema>`, `quizzes`, `quizzes/<slug>`, `atlas`,
 * `laboratorio`, `laboratorio/<módulo>` e `caderno`.
 *
 * Sem `server-only`: as páginas são cascos estáticos desenhados no navegador.
 * Quem monta é `lib/histologia/paginas-do-catalogo.ts`, depois do portão, pela
 * rota `/api/manual-clinico/histologia/catalogo/…`.
 */

export function rotaDosDadosDoCatalogo(segmentos: string[]): string {
  return ['/api/manual-clinico/histologia/catalogo', ...segmentos.map(encodeURIComponent)].join('/')
}

export interface DadosDaAreaNormal {
  imagem: string | null
  totais: { laminas: number; estruturas: number; laminasComZoom: number; sistemasComZoom: number }
  destaques: ItemDoCatalogo[]
  setores: Array<{ slug: string; titulo: string; href: string; itens: ItemDoCatalogo[] }>
  /** Uma fileira por sistema, com as dez primeiras lâminas; `total` é o sistema inteiro. */
  sistemas: Array<{ id: string; nome: string; href: string; total: number; itens: ItemDoCatalogo[] }>
}

export interface DadosDePraticar {
  totais: { quizzes: number; questoes: number }
  quizComZoom: ItemDoCatalogo
  porTema: ItemDoCatalogo[]
  doAcervo: ItemDoCatalogo[]
  laboratorios: ItemDoCatalogo[]
}

export interface DadosDosSistemas {
  comPatologia: boolean
  sistemas: ItemDoCatalogo[]
}

export interface DadosDoSistemaUnificado {
  comPatologia: boolean
  sistema: { id: string; nome: string; descricao: string }
  imagem: string | null
  normais: ItemDoCatalogo[]
  assuntos: ItemDoCatalogo[]
  doencas: ItemDoCatalogo[]
  laminasDoentes: ItemDoCatalogo[]
  atlas: ItemDoCatalogo[]
}

export interface QuizDaLista {
  slug: string
  titulo: string
  questoes: number
  comImagem: number
  autoria: 'acervo' | 'proprio'
  laminas?: number
  /** Onde o tema fica no currículo, sem o setor (que já é o título do grupo). */
  contexto?: string
}

export interface DadosDosQuizzes {
  totais: {
    questoes: number
    questoesProprias: number
    quizzesProprios: number
    questoesDoAcervo: number
    quizzesDoAcervo: number
  }
  /** Os quizzes por tema, agrupados por setor do currículo, na ordem do curso. */
  proprios: Array<{ setor: string; titulo: string; quizzes: QuizDaLista[] }>
  doAcervo: QuizDaLista[]
}

/** O caderno não tem conteúdo do servidor: a rota só confirma o acesso. */
export type DadosDoCaderno = Record<string, never>

export interface DadosDoAtlas {
  totais: { laminas: number; estruturas: number }
  /** Só as técnicas presentes no acervo, com o resultado esperado. */
  coloracoes: Array<{ id: string; nome: string; resultado: string }>
  curriculo: NoCurriculo[]
}

export interface DadosDoLaboratorio {
  modulos: Array<Pick<ModuloDeLaboratorio, 'id' | 'titulo' | 'resumo' | 'objetivos' | 'minutos'>>
}

export interface DadosDoModuloDoLaboratorio {
  modulo: ModuloDeLaboratorio
  /** A bancada de colorações é leitura: as técnicas vêm prontas. Vazio nos outros módulos. */
  coloracoes: Array<{ id: string; nome: string; finalidade: string; afinidade: string; resultado: string }>
}

export interface DadosDoQuiz {
  modo: Modo
  /** Já no recorte do modo: na prova, sem gabarito — removido no servidor, como antes. */
  quiz: Quiz
  jsonLd: Record<string, unknown>
}
