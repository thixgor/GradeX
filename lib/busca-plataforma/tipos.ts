import type { ItemBuscavel } from './motor'
import type { SidebarSectionKey } from '../sidebar-sections'

/**
 * Tipos compartilhados pela busca global.
 *
 * Vivem à parte porque tanto a rota `/api/busca` (servidor) quanto a interface
 * (cliente) precisam deles, e o catálogo estático importa `sidebar-sections`,
 * que é lido no servidor e não pode carregar React nem lucide.
 */

/** Como o resultado é agrupado na lista. A ordem aqui é a ordem na tela. */
export type GrupoBusca =
  | 'acao'
  | 'area'
  | 'pagina'
  | 'ferramenta'
  | 'conteudo'
  | 'conta'
  | 'admin'

export const ROTULO_DO_GRUPO: Record<GrupoBusca, string> = {
  acao: 'Ações rápidas',
  area: 'Áreas da plataforma',
  pagina: 'Páginas',
  ferramenta: 'Ferramentas clínicas',
  conteudo: 'Conteúdo',
  conta: 'Conta e ajustes',
  admin: 'Administração',
}

/**
 * Ações que a busca executa em vez de navegar. O identificador é resolvido pela
 * interface — o catálogo não pode guardar função porque também é lido no
 * servidor, onde `toggleLiteMode` não existe.
 */
export type AcaoBusca =
  | 'criar-prova'
  | 'alternar-tema'
  | 'modo-lite'
  | 'abrir-tour'
  | 'sair'

export interface ItemBusca extends ItemBuscavel {
  grupo: GrupoBusca
  /** Destino da navegação. Ausente apenas em itens de ação. */
  href?: string
  acao?: AcaoBusca
  /** Nome do ícone em `components/sidebar-icon-map.ts`. */
  icone: string
  /** Etiqueta do tipo, exibida à direita ("Patologia", "Material", "Deck"). */
  etiqueta?: string
  /** Seção do menu a que o item pertence — usada para respeitar o que o admin desligou. */
  secao?: SidebarSectionKey
  somenteAdmin?: boolean
}

/** Resposta de `/api/busca`. */
export interface RespostaBusca {
  itens: ItemBusca[]
  /** Fontes que falharam ou estouraram o tempo, para a interface avisar. */
  incompleto?: boolean
  /** Milissegundos gastos no servidor — só para diagnóstico. */
  ms?: number
}
