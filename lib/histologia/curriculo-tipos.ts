import type { EstadoDeRevisao } from '@/lib/histopatologia/esquemas'

import type { Visto } from './vistos'
import type { NoCurriculo, Pagina } from './esquemas'
import type { DescricaoDeLamina } from './laminas'
import type { ResumoDeSetor } from './resumos'

/**
 * Contratos das páginas do currículo (`/manual-clinico/histologia/[...slug]`).
 *
 * Sem `server-only`: quem desenha é um componente de cliente, e só o formato
 * atravessa. `lib/histologia/curriculo.ts` monta no servidor, depois do portão.
 */

/** Rota de dados de uma página do currículo. */
export function rotaDosDadosDoCurriculo(caminho: string[]): string {
  return `/api/manual-clinico/histologia/curriculo/${caminho.map(encodeURIComponent).join('/')}`
}

export interface DoencaRelacionada {
  slug: string
  nome: string
  estadoDeRevisao: EstadoDeRevisao
}

interface Comum {
  /** Para a aba do navegador: o casco é igual para todas as páginas. */
  titulo: string
  comPatologia: boolean
  relacionadas: DoencaRelacionada[]
  /** Dados estruturados (JSON-LD) da página, prontos. */
  jsonLd: Record<string, unknown>[]
}

/** Nó de índice: 204 páginas do acervo não são lâminas. */
export interface DadosDaSecaoDoCurriculo extends Comum {
  tipo: 'secao'
  pagina: Pick<Pagina, 'caminho' | 'titulo' | 'trilha'>
  /** Só o primeiro nível: a seção lista os filhos, não a árvore inteira abaixo deles. */
  filhos: NoCurriculo[]
  miniaturas: Record<string, string>
  resumo: ResumoDeSetor | null
}

export interface DadosDaLaminaDoCurriculo extends Comum {
  tipo: 'lamina'
  pagina: Pagina
  descricaoPropria: DescricaoDeLamina | null
  vizinhas: { anterior?: { titulo: string; caminho: string[] }; proxima?: { titulo: string; caminho: string[] } }
  bandeja: Array<{ rota: string; titulo: string; miniatura: Pagina['base'] }>
  quizzes: Array<{ slug: string; titulo: string; questoes: number }>
  visto: Omit<Visto, 'em'>
  /** A prévia e a lâmina, para o navegador já pedir enquanto o microscópio carrega. */
  preLamina: string | null
  prePrevia: string | null
}

export type DadosDaPaginaDoCurriculo = DadosDaSecaoDoCurriculo | DadosDaLaminaDoCurriculo
