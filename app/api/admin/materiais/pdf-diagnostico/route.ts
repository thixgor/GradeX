/**
 * Diagnóstico do PDF de um material: as figuras existem no arquivo que está
 * no storage, e sobrevivem ao carimbo da marca d'água?
 *
 * Existe para responder objetivamente ao relato "o PDF chegou sem imagem".
 * São dois lugares possíveis para o problema e a resposta muda tudo:
 *   - o arquivo de origem já não tem a figura   → o problema é o upload/autoria;
 *   - tem na origem e some depois do carimbo    → o problema é a entrega.
 *
 * GET /api/admin/materiais/pdf-diagnostico?materialId=<id>[&pagina=7]
 * GET /api/admin/materiais/pdf-diagnostico?titulo=Resumo N1 SOI IV[&pagina=7]
 */

import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { isValidObjectId } from '@/lib/api-security'
import { fetchMaterialPdfBytes } from '@/lib/material-pdf-viewer'
import { applyWatermark } from '@/lib/pdf-watermark'
import { compareImageReports, inspectPdfImages } from '@/lib/pdf-diagnostico'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const materialId = request.nextUrl.searchParams.get('materialId') || ''
    const titulo = (request.nextUrl.searchParams.get('titulo') || '').trim()
    if (!isValidObjectId(materialId) && !titulo) {
      return NextResponse.json(
        { error: 'Informe materialId (24 caracteres) ou titulo' },
        { status: 400 }
      )
    }
    const paginaFiltro = Number(request.nextUrl.searchParams.get('pagina')) || 0

    const db = await getDb()
    const projection = { title: 1, pdfFile: 1, pdfDownloadEnabled: 1 }
    // Busca por título existe para o caso de estar diagnosticando pelo celular,
    // onde copiar o id do material dá mais trabalho do que digitar o nome.
    const material = isValidObjectId(materialId)
      ? await db.collection('materials').findOne({ _id: new ObjectId(materialId) }, { projection })
      : await db.collection('materials').findOne(
          { title: { $regex: escapeRegex(titulo), $options: 'i' } },
          { projection }
        )
    if (!material) {
      return NextResponse.json({ error: 'Material não encontrado' }, { status: 404 })
    }
    const blobUrl: string = material.pdfFile?.blobUrl || ''
    if (!blobUrl) {
      return NextResponse.json({ error: 'Material sem PDF interno' }, { status: 422 })
    }

    const originalBytes = await fetchMaterialPdfBytes(blobUrl)
    const original = await inspectPdfImages(originalBytes)

    // Carimba com uma identidade de teste: o que interessa aqui é o efeito do
    // carimbo sobre as figuras, não o rastreio.
    const deliveredBytes = await applyWatermark(originalBytes, {
      userName: 'Diagnóstico',
      userEmail: 'diagnostico@domineaqui.com.br',
      userId: String(session.userId || ''),
      orderId: 'diagnostico',
      downloadedAt: new Date(),
    })
    const delivered = await inspectPdfImages(deliveredBytes)

    const filtrarPagina = (imagens: typeof original.images) =>
      paginaFiltro > 0 ? imagens.filter((img) => img.page === paginaFiltro) : imagens

    return NextResponse.json({
      material: {
        id: String(material._id),
        titulo: material.title || '',
        arquivo: material.pdfFile?.originalFilename || '',
        // Tamanho e páginas anotados no momento do upload. Divergência entre
        // isso e o que foi baixado agora significa que o arquivo no storage
        // não é o mesmo que saiu do navegador do admin — outro jeito de o
        // material chegar sem as figuras do fim do arquivo.
        bytesNoUpload: material.pdfFile?.sizeBytes ?? null,
        paginasNoUpload: Number(material.pdfFile?.pageCount) || null,
        arquivoIntegro:
          material.pdfFile?.sizeBytes == null
            ? null
            : Number(material.pdfFile.sizeBytes) === original.byteLength,
      },
      origem: {
        paginas: original.pageCount,
        bytes: original.byteLength,
        totalDeImagens: original.totalImages,
        temCamadas: original.hasOptionalContentProperties,
        imagensPorPagina: original.imagesPerPage,
        imagens: filtrarPagina(original.images),
      },
      entregue: {
        paginas: delivered.pageCount,
        bytes: delivered.byteLength,
        totalDeImagens: delivered.totalImages,
        temCamadas: delivered.hasOptionalContentProperties,
        imagensPorPagina: delivered.imagesPerPage,
        imagens: filtrarPagina(delivered.images),
      },
      veredito: compareImageReports(original, delivered),
    })
  } catch (error: any) {
    console.error('[admin-pdf-diagnostico] Falha ao diagnosticar PDF:', error)
    return NextResponse.json(
      { error: `Falha ao diagnosticar o PDF: ${error?.message || String(error)}` },
      { status: 500 }
    )
  }
}
