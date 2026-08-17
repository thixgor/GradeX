import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import {
  secureApiEndpoint,
  isValidObjectId,
  sanitizeHtml,
  normalizeImageUrl,
  validateStringInput
} from '@/lib/api-security'
import { podeMoverGrupo, type GrupoNaArvore } from '@/lib/provas/arvore-grupos'

export const dynamic = 'force-dynamic'

// PUT - Atualizar grupo
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar ObjectId primeiro
    if (!isValidObjectId(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    // Verificar autenticação e rate limit
    const security = await secureApiEndpoint(req, {
      rateLimit: 'WRITE',
      auth: { requireAuth: true }
    })

    if (!security.success || security.errorResponse) {
      return security.errorResponse
    }

    const session = security.session!
    const { id } = params
    const body = await req.json()

    // Validar e sanitizar inputs
    const nameValidation = validateStringInput(body.name, 'Nome', { maxLength: 100 })
    const descValidation = validateStringInput(body.description, 'Descrição', { maxLength: 500 })

    // Sanitizar contra XSS
    const name = nameValidation.value ? sanitizeHtml(nameValidation.value) : undefined
    const description = descValidation.value ? sanitizeHtml(descValidation.value) : undefined
    const color = body.color
    const icon = body.icon ? sanitizeHtml(body.icon) : undefined

    const client = await clientPromise
    const db = client.db('DomineAqui')
    const groupsCollection = db.collection('groups')

    // Buscar grupo
    const group = await groupsCollection.findOne({ _id: new ObjectId(id) })
    if (!group) {
      return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 })
    }

    // Verificar permissão
    // - Grupos pessoais: só o criador pode editar
    // - Grupos gerais: só admin pode editar
    if (group.type === 'personal' && group.createdBy !== session.userId) {
      return NextResponse.json({ error: 'Sem permissão para editar este grupo' }, { status: 403 })
    }
    if (group.type === 'general' && session.role !== 'admin') {
      return NextResponse.json({ error: 'Apenas administradores podem editar grupos gerais' }, { status: 403 })
    }

    // Atualizar grupo
    const updateData: any = {
      updatedAt: new Date(),
    }
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (color !== undefined) updateData.color = color
    if (icon !== undefined) updateData.icon = icon
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl ? normalizeImageUrl(body.imageUrl) : null
    // Campos de categoria/curso (apenas admin)
    if (body.category !== undefined && session.role === 'admin') updateData.category = body.category
    if (body.course !== undefined && session.role === 'admin') updateData.course = body.course

    /*
     * Mover o grupo para dentro de outro (ou para a raiz).
     *
     * Trocar `parentGroupId` move o ramo inteiro de uma vez: as provas apontam
     * para os grupos, não para o caminho, então elas vão junto sem que nada
     * seja copiado nem reescrito.
     *
     * A validação carrega a árvore toda porque a recusa que importa — pôr um
     * grupo dentro do próprio descendente — não é decidível olhando só os dois
     * documentos. Um ciclo aqui não dá erro em lugar nenhum: o grupo e tudo
     * abaixo dele simplesmente somem da tela, já que deixam de ser alcançáveis
     * a partir da raiz.
     */
    if (body.parentGroupId !== undefined) {
      const destinoId = body.parentGroupId ? String(body.parentGroupId) : null
      if (destinoId && !isValidObjectId(destinoId)) {
        return NextResponse.json({ error: 'Grupo de destino inválido' }, { status: 400 })
      }

      const todos = await groupsCollection.find({}).toArray()
      const arvore: GrupoNaArvore[] = todos.map((g: any) => ({
        _id: String(g._id),
        name: g.name,
        parentGroupId: g.parentGroupId ? String(g.parentGroupId) : null,
        type: g.type,
        createdBy: g.createdBy,
      }))

      const veredito = podeMoverGrupo(arvore, id, destinoId, {
        id: session.userId,
        ehAdmin: session.role === 'admin',
      })
      if (!veredito.ok) {
        return NextResponse.json({ error: veredito.motivo }, { status: 409 })
      }

      updateData.parentGroupId = destinoId
    }

    await groupsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    return NextResponse.json({ message: 'Grupo atualizado com sucesso' })
  } catch (error) {
    console.error('Erro ao atualizar grupo:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Deletar grupo
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar ObjectId primeiro
    if (!isValidObjectId(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    // Verificar autenticação e rate limit
    const security = await secureApiEndpoint(req, {
      rateLimit: 'WRITE',
      auth: { requireAuth: true }
    })

    if (!security.success || security.errorResponse) {
      return security.errorResponse
    }

    const session = security.session!
    const { id } = params

    const client = await clientPromise
    const db = client.db('DomineAqui')
    const groupsCollection = db.collection('groups')
    const examsCollection = db.collection('exams')

    // Buscar grupo
    const group = await groupsCollection.findOne({ _id: new ObjectId(id) })
    if (!group) {
      return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 })
    }

    // Verificar permissão
    if (group.type === 'personal' && group.createdBy !== session.userId) {
      return NextResponse.json({ error: 'Sem permissão para deletar este grupo' }, { status: 403 })
    }
    if (group.type === 'general' && session.role !== 'admin') {
      return NextResponse.json({ error: 'Apenas administradores podem deletar grupos gerais' }, { status: 403 })
    }

    // Mover todas as provas deste grupo de volta para a página inicial (groupId = null)
    await examsCollection.updateMany(
      { groupId: id },
      { $set: { groupId: null, updatedAt: new Date() } }
    )

    // Mover subgrupos para o grupo pai (ou para raiz se não tem pai)
    const parentGroupId = group.parentGroupId || null
    await groupsCollection.updateMany(
      { parentGroupId: id },
      { $set: { parentGroupId: parentGroupId, updatedAt: new Date() } }
    )

    // Deletar grupo
    await groupsCollection.deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ message: 'Grupo deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar grupo:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
