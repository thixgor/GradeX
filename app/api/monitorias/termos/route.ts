import { NextRequest } from 'next/server'
import { z } from 'zod'
import { erro, lerJson, userAgentDe } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { secoesDosTermos, tituloDosTermos, VERSAO_TERMOS } from '@/lib/monitorias/documentos/termos'
import { hashDosTermos, registrarAceiteDosTermos, termosAceitos } from '@/lib/monitorias/servidor'

export const dynamic = 'force-dynamic'

const Papel = z.enum(['monitor', 'aluno'])

/** GET ?papel=monitor|aluno → texto vigente + se a pessoa já aceitou. */
export async function GET(request: NextRequest) {
  return rotaAutenticada(request, {}, async ({ sessao }) => {
    const papel = Papel.safeParse(new URL(request.url).searchParams.get('papel'))
    if (!papel.success) return erro(400, 'Papel inválido.')
    return ok({
      papel: papel.data,
      versao: VERSAO_TERMOS,
      titulo: tituloDosTermos(papel.data),
      secoes: secoesDosTermos(papel.data),
      hash: hashDosTermos(papel.data),
      aceito: await termosAceitos(sessao.userId, papel.data),
    })
  })
}

/** POST {papel, hash} → registra o aceite (com IP, navegador e hash do texto lido). */
export async function POST(request: NextRequest) {
  return rotaAutenticada(request, { limite: 'WRITE', emailVerificado: true }, async ({ sessao, ip }) => {
    const corpo = z.object({ papel: Papel, hash: z.string().length(64) }).strict().safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, 'Dados inválidos.')
    if (corpo.data.hash !== hashDosTermos(corpo.data.papel)) {
      return erro(409, 'Os termos foram atualizados enquanto você lia. Recarregue a página.')
    }
    await registrarAceiteDosTermos({ userId: sessao.userId, papel: corpo.data.papel, ip, userAgent: userAgentDe(request) })
    return ok({ aceito: true, versao: VERSAO_TERMOS })
  })
}
