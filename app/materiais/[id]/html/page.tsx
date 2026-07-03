import { HtmlMaterialViewer } from '@/components/materiais/html-material-viewer'

export default function MaterialHtmlViewerPage({ params }: { params: { id: string } }) {
  return <HtmlMaterialViewer materialId={params.id} />
}
