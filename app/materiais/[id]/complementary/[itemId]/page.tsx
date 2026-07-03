import { ComplementaryItemViewer } from '@/components/materiais/complementary-item-viewer'

export default function ComplementaryItemPage({ params }: { params: { id: string; itemId: string } }) {
  return <ComplementaryItemViewer materialId={params.id} itemId={params.itemId} />
}
