import { NextRequest } from 'next/server'
import { obterColecoes } from '@/lib/monitorias/db'
import { rotaPublica, ok } from '@/lib/monitorias/rota'
import { hashDoContrato } from '@/lib/monitorias/documentos/contrato'

export const dynamic = 'force-dynamic'

/**
 * Verificação pública de um contrato pelo código impresso no PDF.
 * Mostra só o que prova a autenticidade — número, situação, hash, datas das
 * assinaturas e primeiros nomes. Nada de CPF, e-mail ou valores.
 */
export async function GET(request: NextRequest, { params }: { params: { codigo: string } }) {
  return rotaPublica(request, { limit: 20, windowMs: 60_000 }, async () => {
    const codigo = String(params.codigo || '').toUpperCase()
    if (!/^[A-Z0-9]{10}$/.test(codigo)) return ok({ valido: false })
    const c = await obterColecoes()
    const contrato = await c.contratos.findOne({ codigoVerificacao: codigo })
    if (!contrato) return ok({ valido: false })
    // Recalcula o hash a partir dos dados gravados: se alguém mexeu no banco, aparece aqui.
    const integro = hashDoContrato(contrato.dados) === contrato.hash
    return ok({
      valido: integro,
      integro,
      numero: contrato.numero,
      status: contrato.status,
      hash: contrato.hash,
      emitidoEm: contrato.createdAt,
      monitoria: contrato.dados.anuncio.titulo,
      assinaturas: contrato.assinaturas.map((a) => ({
        papel: a.papel,
        nome: a.nome.split(' ')[0],
        em: a.em,
        hashConfere: a.hash === contrato.hash,
      })),
    })
  })
}
