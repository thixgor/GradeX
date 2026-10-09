import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { erro, idDe, lerJson, naoEncontrado, obterColecoes, userAgentDe } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { secoesDoContrato, tituloDoContrato } from '@/lib/monitorias/documentos/contrato'
import { assinarContrato, nomeCivil, quemFaltaAssinar } from '@/lib/monitorias/contratos'
import { conferirCodigo, mensagemDoCodigo } from '@/lib/monitorias/codigos'
import { carregarUsuario, termosAceitos } from '@/lib/monitorias/servidor'
import { aposContratoAssinado } from '@/lib/monitorias/reservas'
import { avisar } from '@/lib/monitorias/avisos'

export const dynamic = 'force-dynamic'

async function carregar(id: string, userId: string, admin: boolean) {
  if (!ObjectId.isValid(id)) return null
  const c = await obterColecoes()
  const contrato = await c.contratos.findOne({ _id: new ObjectId(id) } as any)
  if (!contrato) return null
  if (!admin && contrato.contratanteId !== userId && contrato.contratadoId !== userId) return null
  return contrato
}

/** GET — o texto do contrato, como será assinado (com o hash que a tela deve devolver). */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, {}, async ({ sessao }) => {
    const contrato = await carregar(params.id, sessao.userId, sessao.role === 'admin')
    if (!contrato) return naoEncontrado()
    const papel = contrato.contratanteId === sessao.userId ? 'contratante' : contrato.contratadoId === sessao.userId ? 'contratado' : null
    return ok({
      id: idDe(contrato),
      numero: contrato.numero,
      titulo: tituloDoContrato(contrato.dados),
      secoes: secoesDoContrato(contrato.dados),
      hash: contrato.hash,
      status: contrato.status,
      reservaId: contrato.reservaId,
      meuPapel: papel,
      falta: quemFaltaAssinar(contrato),
      euAssinei: !!papel && contrato.assinaturas.some((a) => a.papel === papel),
      assinaturas: contrato.assinaturas.map((a) => ({ papel: a.papel, nome: a.nome, em: a.em, metodo: a.metodo })),
      codigoVerificacao: contrato.codigoVerificacao,
    })
  })
}

/** POST {codigo, hash} — assina. Exige os Termos do papel aceitos. */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { limite: 'WRITE', emailVerificado: true }, async ({ sessao, ip }) => {
    const corpo = z.object({ codigo: z.string().max(10), hash: z.string().length(64) }).strict().safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, 'Dados inválidos.')
    const contrato = await carregar(params.id, sessao.userId, false)
    if (!contrato) return naoEncontrado()
    const papelTermos = contrato.contratanteId === sessao.userId ? 'aluno' : 'monitor'
    if (!(await termosAceitos(sessao.userId, papelTermos))) {
      return erro(409, `Aceite os Termos de Serviço do ${papelTermos === 'aluno' ? 'Aluno' : 'Monitor'} antes de assinar.`, { precisaTermos: papelTermos })
    }
    const r = await conferirCodigo(sessao.userId, `assinar:${params.id}`, corpo.data.codigo)
    if (r !== 'ok') return erro(400, mensagemDoCodigo(r))
    const user = await carregarUsuario(sessao.userId)
    if (!user) return naoEncontrado()
    const resultado = await assinarContrato({
      contratoId: params.id,
      userId: sessao.userId,
      nome: nomeCivil(user),
      hashVisto: corpo.data.hash,
      ip,
      userAgent: userAgentDe(request),
    })
    if (!resultado.ok) return erro(resultado.status, resultado.erro)
    if (resultado.completo) {
      await aposContratoAssinado(resultado.contrato)
    } else {
      const outro = sessao.userId === contrato.contratanteId ? contrato.contratadoId : contrato.contratanteId
      await avisar([
        {
          userId: outro,
          titulo: 'Falta a sua assinatura',
          mensagem: `O contrato ${contrato.numero} foi assinado pela outra parte. Assine para continuar.`,
          url: `/monitorias/reservas/${contrato.reservaId}`,
          email: { assunto: `Assine o contrato ${contrato.numero}`, paragrafos: ['A outra parte já assinou o contrato da monitoria. Falta só você.'], botao: 'Assinar agora' },
        },
      ])
    }
    return ok({ assinado: true, completo: resultado.completo, reservaId: contrato.reservaId })
  })
}
