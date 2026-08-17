import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { contarDependentes, mensagemDeBloqueio } from '@/lib/aulas/exclusao'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se é admin ou monitor
    const db = await getDb()
    const usersCollection = db.collection('users')
    const user = await usersCollection.findOne({ _id: new ObjectId(session.userId) })

    const isAdmin = session.role === 'admin'
    const isMonitor = user?.secondaryRole === 'monitor'

    if (!isAdmin && !isMonitor) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { nome, descricao, imagem, oculta, ordem, certificado } = body

    const setoresCollection = db.collection('aulas_setores')

    const updateData: any = {
      atualizadoEm: new Date()
    }

    if (nome !== undefined) updateData.nome = nome
    if (descricao !== undefined) updateData.descricao = descricao
    if (imagem !== undefined) updateData.imagem = imagem
    if (oculta !== undefined) updateData.oculta = oculta
    if (ordem !== undefined) updateData.ordem = ordem

    // Certificado do curso (§38). `null` desliga. A régua é validada aqui para
    // o documento nunca guardar um percentual fora da faixa — o que faria
    // `regrasDoCertificado` cair no padrão e o curso passar a exigir 100% sem
    // ninguém ter pedido.
    if (certificado !== undefined) {
      if (!certificado || certificado.habilitado !== true) {
        updateData.certificado = null
      } else {
        const bruto = Number(certificado.percentualMinimo)
        updateData.certificado = {
          habilitado: true,
          percentualMinimo:
            Number.isFinite(bruto) && bruto >= 1 && bruto <= 100 ? Math.round(bruto) : 100,
          textoAssinatura: String(certificado.textoAssinatura || '').slice(0, 160) || undefined,
        }
      }
    }

    const result = await setoresCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    if (!result) {
      return NextResponse.json(
        { error: 'Setor não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      item: result
    })
  } catch (error) {
    console.error('Update setor error:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar setor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se é admin ou monitor
    const db = await getDb()
    const usersCollection = db.collection('users')
    const user = await usersCollection.findOne({ _id: new ObjectId(session.userId) })

    const isAdmin = session.role === 'admin'
    const isMonitor = user?.secondaryRole === 'monitor'

    if (!isAdmin && !isMonitor) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const setoresCollection = db.collection('aulas_setores')

    // A exclusão em cascata daqui comparava um campo de TEXTO com um
    // ObjectId, então nunca apagava nada e apenas deixava as aulas órfãs,
    // fora da biblioteca do aluno. Consertar o filtro passaria a destruir
    // conteúdo e progresso de verdade; em vez disso, a exclusão agora é
    // recusada enquanto houver algo dentro (§45).
    const dependentes = await contarDependentes(db, 'setor', id)
    if (dependentes.total > 0) {
      return NextResponse.json(
        { error: mensagemDeBloqueio(dependentes), dependentes: dependentes.total },
        { status: 409 }
      )
    }

    // Deletar o setor
    const result = await setoresCollection.deleteOne({
      _id: new ObjectId(id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Setor não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Setor excluído com sucesso'
    })
  } catch (error) {
    console.error('Delete setor error:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar setor' },
      { status: 500 }
    )
  }
}
