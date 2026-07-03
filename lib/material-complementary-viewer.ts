/**
 * Acesso e entrega de conteúdo de um ITEM COMPLEMENTAR avulso (PDF/HTML
 * anexados diretamente a "Você também leva…", sem precisar criar um material).
 *
 * O acesso é o MESMO do material pai — quem comprou/tem grupo/gratuito no
 * material principal enxerga todos os seus complementares, sem preço próprio.
 * Por isso reaproveitamos `validateMaterialPdfAccess`/`validateMaterialHtmlAccess`
 * com `requirePdf`/`requireHtml: false` (só a checagem de compra/grupo do PAI),
 * e então validamos o ITEM (existe, tem arquivo, viewer habilitado) por cima.
 */

import { TokenPayload } from './auth'
import { validateMaterialPdfAccess } from './material-pdf-viewer'
import { validateMaterialHtmlAccess, fetchMaterialHtml, buildWatermarkedHtml } from './material-html-viewer'

export type ComplementaryFileKind = 'pdf' | 'html'

export type ComplementaryContentAccessResult =
  | { ok: true; material: any; item: any; user: any; isAdmin: boolean }
  | { ok: false; status: number; error: string }

function findItem(material: any, itemId: string): any {
  return (material?.complementaryItems || []).find((it: any) => String(it.id) === itemId) || null
}

export async function validateComplementaryContentAccess(
  materialId: string,
  itemId: string,
  fileKind: ComplementaryFileKind,
  session: TokenPayload | null
): Promise<ComplementaryContentAccessResult> {
  // Reaproveita a checagem de acesso do PAI (compra/grupo/admin), ignorando
  // os requisitos de arquivo/viewer do material principal — o item complementar
  // tem seu próprio arquivo e flag de viewer, verificados abaixo.
  const parentAccess = fileKind === 'pdf'
    ? await validateMaterialPdfAccess(materialId, session, { requirePdf: false, requireViewerEnabled: false })
    : await validateMaterialHtmlAccess(materialId, session, { requireHtml: false, requireViewerEnabled: false })

  if (!parentAccess.ok) {
    return { ok: false, status: parentAccess.status, error: parentAccess.error }
  }
  // Ambas as funções só retornam ok:true quando o acesso pleno já foi
  // concedido (não passamos allowPreview) — nenhuma checagem extra necessária.

  const item = findItem(parentAccess.material, itemId)
  if (!item) {
    return { ok: false, status: 404, error: 'Item complementar não encontrado' }
  }
  if (item.contentKind !== fileKind) {
    return { ok: false, status: 422, error: 'Tipo de conteúdo do item não corresponde' }
  }
  const file = fileKind === 'pdf' ? item.pdfFile : item.htmlFile
  if (!file?.blobUrl) {
    return { ok: false, status: 422, error: 'Este item não possui arquivo vinculado' }
  }
  if (item.viewerEnabled !== true) {
    return { ok: false, status: 403, error: 'O leitor deste item está desabilitado' }
  }

  return { ok: true, material: parentAccess.material, item, user: parentAccess.user, isAdmin: parentAccess.isAdmin }
}

export { fetchMaterialHtml, buildWatermarkedHtml }
