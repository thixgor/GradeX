import { SecurePdfViewer } from '@/components/materiais/secure-pdf-viewer'

export default function MaterialPdfViewerPage({ params }: { params: { id: string } }) {
  return <SecurePdfViewer materialId={params.id} />
}
