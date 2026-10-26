import { BookOpen, Bone, FileText, Layers, ShoppingBag, type LucideIcon } from 'lucide-react'
import type { AreaDeEstudo } from '@/lib/estudo/resumo-de-estudo'

/**
 * As cinco frentes de estudo, na ordem da paleta categórica (`--viz-series-1`
 * a `-5`, validada nos dois modos). A cor segue a frente em todo lugar — no
 * gráfico empilhado, nas barras de acerto, nos cartões do perfil e do painel —
 * para "azul" querer dizer flashcards em qualquer tela.
 */
export const FRENTES: Array<{
  id: AreaDeEstudo
  nome: string
  /** Como a unidade aparece no tooltip do gráfico: "12 no banco". */
  serie: string
  cor: string
  href: string
  icone: LucideIcon
}> = [
  { id: 'banco', nome: 'Banco de questões', serie: 'no banco', cor: 'var(--viz-series-1)', href: '/banco-questoes', icone: BookOpen },
  { id: 'provas', nome: 'Provas', serie: 'em provas', cor: 'var(--viz-series-2)', href: '/provas', icone: FileText },
  { id: 'flashcards', nome: 'Flashcards', serie: 'cartas', cor: 'var(--viz-series-3)', href: '/flashcards', icone: Layers },
  { id: 'materiais', nome: 'Materiais', serie: 'materiais', cor: 'var(--viz-series-4)', href: '/materiais', icone: ShoppingBag },
  { id: 'anatomia', nome: 'Anatomia', serie: 'em anatomia', cor: 'var(--viz-series-5)', href: '/anatomia', icone: Bone },
]

export function plural(n: number, um: string, varios: string): string {
  return `${n.toLocaleString('pt-BR')} ${n === 1 ? um : varios}`
}
