import { NextRequest, NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { prouniBlobPrefix } from '@/lib/prouni-anexos'
import {
  getLiveProuniBenefit,
  PROUNI_ALLOWED_CONTENT_TYPES,
  PROUNI_MAX_ATTACHMENT_BYTES,
  type ProuniItemType,
} from '@/lib/prouni-fies'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Autorização de upload dos comprovantes PROUNI/FIES.
 *
 * O arquivo vai do navegador DIRETO para o Blob (client-side upload). Isso não
 * é comodidade: é o que impede que uma Function fique segurando megabytes de
 * upload de dezenas de pessoas ao mesmo tempo — o caminho mais barato para
 * derrubar o site com uploads legítimos, sem exploit nenhum.
 *
 * O que esta rota faz é emitir um token estreito:
 *
 * - só para quem tem sessão;
 * - só para um caminho que começa com o ID da própria pessoa (ninguém escreve
 *   na pasta de outro, e o `pathname` vem do cliente, então é conferido aqui);
 * - só para os tipos de comprovante aceitos;
 * - com teto de tamanho aplicado pelo próprio Blob, antes dos bytes chegarem;
 * - e só se o produto realmente oferece o benefício — sem isso, a rota seria
 *   armazenamento gratuito para qualquer conta.
 *
 * Nada aqui é a validação final. O token limita o estrago; quem confere de
 * verdade tipo, tamanho e conteúdo é `POST /api/prouni/solicitacoes`, que lê os
 * metadados do próprio Blob e os primeiros bytes do arquivo. O cliente nunca é
 * acreditado nas duas pontas.
 */

const TIPOS_VALIDOS: ProuniItemType[] = ['material', 'package', 'manual_clinico', 'plus']

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = (await request.json()) as HandleUploadBody

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const session = await getSession()
        if (!session) throw new Error('Não autorizado')

        // Cota por conta: 12 arquivos por hora cobre folgadamente três anexos
        // e algumas tentativas com o scanner do celular, e ainda assim fecha a
        // porta para quem quer usar o Blob como disco de graça.
        const rl = await checkRateLimit(session.userId, 'prouni_upload', 12, 3_600_000)
        if (!rl.success) throw new Error('Muitos envios de arquivo. Tente novamente mais tarde.')

        let itemType = ''
        let itemId = ''
        try {
          const payload = JSON.parse(clientPayload || '{}')
          itemType = String(payload.itemType || '')
          itemId = String(payload.itemId || '')
        } catch {
          throw new Error('Payload inválido')
        }
        if (!TIPOS_VALIDOS.includes(itemType as ProuniItemType) || !itemId) {
          throw new Error('Item inválido')
        }

        const db = await getDb()
        const benefit = await getLiveProuniBenefit(db, itemType as ProuniItemType, itemId)
        if (!benefit) throw new Error('Este item não oferece desconto PROUNI/FIES.')

        if (!pathname.startsWith(prouniBlobPrefix(session.userId))) {
          throw new Error('Caminho de upload inválido')
        }

        return {
          // Comprovante é documento pessoal: nunca fica em URL pública. O admin
          // lê pela rota autenticada, que faz proxy dos bytes.
          access: 'private',
          addRandomSuffix: true,
          allowedContentTypes: [...PROUNI_ALLOWED_CONTENT_TYPES],
          maximumSizeInBytes: PROUNI_MAX_ATTACHMENT_BYTES,
          tokenPayload: JSON.stringify({ userId: session.userId, itemType, itemId }),
        }
      },
      // Sem onUploadCompleted: nada é gravado no banco por causa de um upload.
      // O arquivo só passa a existir para o sistema quando a solicitação é
      // criada — e é lá que ele é conferido.
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao autorizar upload'
    console.error('[prouni/upload] erro:', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
