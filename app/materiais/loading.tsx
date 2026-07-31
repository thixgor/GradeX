import { SectionSkeleton } from '@/components/section-skeleton'

export default function Loading() {
  // `catalog` espelha o layout real de /materiais (cabeçalho + barra grudada +
  // grade de 2 colunas no celular). Com `cards` havia um salto visível quando
  // a rota terminava de carregar.
  return <SectionSkeleton variant="catalog" />
}
