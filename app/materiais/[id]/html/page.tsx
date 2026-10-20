import { HtmlMaterialViewer } from '@/components/materiais/html-material-viewer'

export default async function MaterialHtmlViewerPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  return <HtmlMaterialViewer materialId={params.id} />
}
