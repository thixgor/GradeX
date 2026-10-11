import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { secureApiEndpoint, validateObjectId } from '@/lib/api-security'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

/**
 * DELETE — tira o CPF de uma conta (admin).
 *
 * O CPF é único entre as contas (ver `app/api/user/complete-profile/route.ts`
 * e `lib/payments/checkout-identity.ts`). Quando ele fica preso numa conta
 * errada — uma segunda conta da mesma pessoa, ou uma compra em que alguém
 * digitou o CPF de outro —, o titular de verdade não consegue mais cadastrá-lo
 * na própria conta: recebe "Este CPF já está cadastrado em outra conta". Esta
 * rota libera o número para que ele seja cadastrado de novo onde deve.
 *
 * Saem junto as marcas que só fazem sentido com o CPF (verificação na Receita e
 * de onde ele veio). Os pedidos e pagamentos já feitos não são tocados: eles
 * guardam o CPF do pagador no próprio documento.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const security = await secureApiEndpoint(request, {
      rateLimit: 'ADMIN',
      auth: { requireAuth: true, allowedRoles: ['admin'] },
    })
    if (!security.success || security.errorResponse) return security.errorResponse

    const { userId } = await params
    const idCheck = validateObjectId(userId)
    if (!idCheck.valid) {
      return NextResponse.json({ error: idCheck.error }, { status: 400 })
    }

    const db = await getDb()
    const resultado = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $unset: {
          cpf: '',
          cpfVerified: '',
          cpfVerifiedAt: '',
          cpfSource: '',
          cpfLinkedAt: '',
        },
      },
    )

    if (resultado.matchedCount === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    console.info(`[admin] CPF removido da conta ${userId} por ${security.session?.userId}`)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao remover CPF:', error)
    return NextResponse.json({ error: 'Erro ao remover o CPF' }, { status: 500 })
  }
}
