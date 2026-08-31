/**
 * Helpers compartilhados para anexar o PDF de um material (com marca d'água do
 * comprador) em e-mails — tanto no envio manual pelo admin quanto no envio
 * AUTOMÁTICO na compra (quando o material tem `autoEmailPdfOnPurchase`).
 *
 * Um material só é elegível ao envio automático quando:
 *   - `autoEmailPdfOnPurchase === true` (o admin habilitou na criação), E
 *   - o download está ativado (`pdfDownloadEnabled !== false`), E
 *   - existe um PDF interno (`pdfFile.blobUrl`) para anexar.
 */

import { Db, ObjectId } from 'mongodb'
import { isValidObjectId } from './api-security'
import { fetchMaterialPdfBytes } from './material-pdf-viewer'
import { applyWatermark } from './pdf-watermark'

// Teto do PDF de origem, alinhado ao limite de upload de materiais (100MB).
// O pdf-lib carrega e duplica o arquivo ao aplicar a marca d'água, então
// arquivos acima disso tendem a estourar a memória da função. Ajustável via env.
export const PDF_EMAIL_MAX_ORIGINAL_MB = Number(process.env.PDF_EMAIL_MAX_ORIGINAL_MB) || 100
const MAX_ORIGINAL_BYTES = PDF_EMAIL_MAX_ORIGINAL_MB * 1024 * 1024

export type PdfEmailItem = { title: string; filename: string; buffer: Buffer }

/** Identidade aplicada na marca d'água de cada PDF. */
export interface WatermarkIdentity {
  userName: string
  userEmail: string
  userId: string
  orderId: string
}

export function safeMaterialFilename(title: string): string {
  return (title || 'material')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9_\- ]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 80) + '.pdf'
}

/** Projeção mínima para decidir elegibilidade + anexar o PDF. */
const MATERIAL_PDF_PROJECTION = {
  title: 1,
  pdfFile: 1,
  type: 1,
  pdfDownloadEnabled: 1,
  autoEmailPdfOnPurchase: 1,
} as const

/**
 * Resolve os materiais (com PDF interno) associados a um item comprado —
 * material único ou pacote (vários materiais). Não filtra por elegibilidade.
 */
export async function resolveMaterialsWithPdf(
  db: Db,
  itemType: string,
  itemId: string
): Promise<any[]> {
  if (!itemId || !isValidObjectId(itemId)) return []
  let materials: any[] = []
  if (itemType === 'material' || itemType === 'flashcard') {
    const material = await db.collection('materials').findOne(
      { _id: new ObjectId(itemId) },
      { projection: MATERIAL_PDF_PROJECTION }
    )
    if (material) materials = [material]
  } else if (itemType === 'package') {
    const pkg = await db.collection('material_packages').findOne(
      { _id: new ObjectId(itemId) },
      { projection: { materialIds: 1 } }
    )
    const materialIds: string[] = Array.isArray(pkg?.materialIds) ? pkg!.materialIds : []
    if (materialIds.length > 0) {
      const objectIds = materialIds.filter(isValidObjectId).map((id) => new ObjectId(id))
      materials = objectIds.length
        ? await db.collection('materials')
            .find({ _id: { $in: objectIds } }, { projection: MATERIAL_PDF_PROJECTION })
            .toArray()
        : []
    }
  }
  return materials.filter((m) => m.pdfFile?.blobUrl)
}

/**
 * Um material tem PDF interno entregável quando existe o arquivo e o download
 * não foi desativado. (Não considera a opção de envio automático.)
 */
export function hasInternalDownloadablePdf(material: any): boolean {
  return material?.pdfDownloadEnabled !== false && Boolean(material?.pdfFile?.blobUrl)
}

/**
 * Um material (avulso) é elegível ao envio automático de PDF por e-mail quando o
 * admin habilitou a opção, o download está ativado e há um PDF interno.
 */
export function isAutoEmailEligible(material: any): boolean {
  return material?.autoEmailPdfOnPurchase === true && hasInternalDownloadablePdf(material)
}

/**
 * Materiais a anexar no envio automático de uma compra de PACOTE.
 *
 * Ao comprar um pacote, o comprador deve receber o PDF de TODOS os materiais
 * incluídos (não apenas os que têm a opção marcada individualmente). O pacote é
 * elegível quando ele próprio tem `autoEmailPdfOnPurchase` OU quando qualquer um
 * dos materiais incluídos tem — cobrindo pacotes configurados antes de o pacote
 * ganhar o próprio controle. Sendo elegível, retorna todos os materiais com PDF
 * interno + download ativo.
 */
async function resolvePackageAutoEmailMaterials(db: Db, packageId: string): Promise<any[]> {
  if (!packageId || !isValidObjectId(packageId)) return []
  const pkg = await db.collection('material_packages').findOne(
    { _id: new ObjectId(packageId) },
    { projection: { materialIds: 1, autoEmailPdfOnPurchase: 1 } }
  )
  const materialIds: string[] = Array.isArray(pkg?.materialIds) ? pkg!.materialIds : []
  const objectIds = materialIds.filter(isValidObjectId).map((id) => new ObjectId(id))
  if (objectIds.length === 0) return []

  const children = await db.collection('materials')
    .find({ _id: { $in: objectIds } }, { projection: MATERIAL_PDF_PROJECTION })
    .toArray()

  const deliverable = children.filter(hasInternalDownloadablePdf)
  const packageEligible =
    pkg?.autoEmailPdfOnPurchase === true || children.some(isAutoEmailEligible)

  return packageEligible ? deliverable : []
}

/**
 * Baixa e aplica marca d'água em cada PDF, em série (mantém o pico de memória
 * baixo). Retorna os anexos prontos e o que foi pulado (tamanho/falha).
 */
export async function prepareWatermarkedItems(
  materials: any[],
  identity: WatermarkIdentity
): Promise<{ items: PdfEmailItem[]; sentMaterialIds: string[]; skipped: { title: string; reason: string }[] }> {
  const now = new Date()
  const items: PdfEmailItem[] = []
  const sentMaterialIds: string[] = []
  const skipped: { title: string; reason: string }[] = []

  for (const material of materials) {
    const title = material.title || 'Material'
    try {
      const original = await fetchMaterialPdfBytes(material.pdfFile.blobUrl)
      const originalBytes = original.byteLength
      if (originalBytes > MAX_ORIGINAL_BYTES) {
        const sizeMb = (originalBytes / 1024 / 1024).toFixed(1)
        console.warn(
          `[material-pdf-email] PDF "${title}" (${material._id}) tem ${sizeMb}MB, acima do limite de ${PDF_EMAIL_MAX_ORIGINAL_MB}MB — pulado.`
        )
        skipped.push({ title, reason: `${sizeMb}MB (máx. ${PDF_EMAIL_MAX_ORIGINAL_MB}MB)` })
        continue
      }
      const watermarked = await applyWatermark(original, {
        userName: identity.userName,
        userEmail: identity.userEmail,
        userId: identity.userId,
        orderId: identity.orderId,
        downloadedAt: now,
      })
      items.push({
        title,
        filename: safeMaterialFilename(material.title),
        buffer: Buffer.from(watermarked),
      })
      sentMaterialIds.push(String(material._id))
    } catch (err: any) {
      console.error(
        `[material-pdf-email] Falha ao preparar PDF do material ${material._id}:`,
        err
      )
      // O motivo vai junto: quando o carimbo recusa entregar um material que
      // perdeu figura, o admin precisa ver isso na tela do envio — "falha ao
      // processar" mandaria ele procurar no log de produção.
      const reason = String(err?.message || err || '').replace(/\s+/g, ' ').trim()
      skipped.push({ title, reason: reason ? reason.slice(0, 200) : 'falha ao processar' })
    }
  }

  return { items, sentMaterialIds, skipped }
}

/**
 * Constrói os anexos de PDF para o envio AUTOMÁTICO de uma compra: resolve os
 * materiais do item, filtra apenas os elegíveis (opção habilitada + download
 * ativo + PDF interno) e aplica a marca d'água do comprador.
 *
 * Nunca lança: em qualquer falha retorna vazio, para não quebrar o fluxo de
 * confirmação de compra (o e-mail é enviado mesmo sem o anexo).
 */
export async function buildAutoEmailPdfAttachments(
  db: Db,
  itemType: string,
  itemId: string,
  identity: WatermarkIdentity,
  options: { timedAccess?: boolean } = {}
): Promise<{ items: PdfEmailItem[]; eligible: boolean }> {
  try {
    // Versão por tempo limitado não inclui download — e o PDF por e-mail é um
    // download que sobreviveria ao fim do prazo. Nunca anexa nesse caso.
    if (options.timedAccess) return { items: [], eligible: false }
    // Pacote: entrega o PDF de TODOS os materiais incluídos (quando elegível).
    // Material avulso/flashcard: entrega apenas se o próprio material está
    // marcado para envio automático.
    const eligibleMaterials = itemType === 'package'
      ? await resolvePackageAutoEmailMaterials(db, itemId)
      : (await resolveMaterialsWithPdf(db, itemType, itemId)).filter(isAutoEmailEligible)

    if (eligibleMaterials.length === 0) return { items: [], eligible: false }
    const { items } = await prepareWatermarkedItems(eligibleMaterials, identity)
    return { items, eligible: true }
  } catch (err) {
    console.error('[material-pdf-email] buildAutoEmailPdfAttachments falhou:', err)
    return { items: [], eligible: false }
  }
}
