import { SecurePdfViewer } from '@/components/materiais/secure-pdf-viewer'

export default async function MaterialPdfViewerPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  return <SecurePdfViewer materialId={params.id} />
}
