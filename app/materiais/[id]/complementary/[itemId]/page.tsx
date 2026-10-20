import { ComplementaryItemViewer } from '@/components/materiais/complementary-item-viewer'

export default async function ComplementaryItemPage(props: { params: Promise<{ id: string; itemId: string }> }) {
  const params = await props.params
  return <ComplementaryItemViewer materialId={params.id} itemId={params.itemId} />
}
