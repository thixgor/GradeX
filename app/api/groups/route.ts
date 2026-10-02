import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { normalizeImageUrl, decodeHtmlEntities } from '@/lib/api-security'
import { algumGrupoRestrito, idsDeGruposOcultos } from '@/lib/provas/grupos-ocultos'
import { esquecerGruposOcultos, lerCargoDoAluno } from '@/lib/provas/grupos-ocultos-servidor'
import { normalizarCargosPermitidos } from '@/lib/restricao-por-cargo'

export const dynamic = 'force-dynamic'

// GET - Listar grupos do usuário (pessoais + gerais)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db('DomineAqui')
    const groupsCollection = db.collection('groups')

    // Buscar grupos gerais (públicos) + grupos pessoais do usuário
    const groups = await groupsCollection
      .find({
        $or: [
          { type: 'general', isPublic: true },
          { type: 'personal', createdBy: session.userId },
        ],
      })
      .sort({ order: 1, createdAt: 1 })
      .toArray()

    /*
     * Grupo oculto (e tudo abaixo dele) só existe para o admin — ver
     * `lib/provas/grupos-ocultos.ts`. O mesmo vale para o grupo restrito a
     * cargos que a pessoa não tem. O admin recebe todos, com o `isHidden` e o
     * `allowedGroups` de cada um, e a tela desenha os selos.
     *
     * A árvore é calculada sobre a lista inteira que veio do banco: um
     * subgrupo sem marcação própria está oculto se o pai estiver, e só dá
     * para saber isso olhando o pai.
     */
    const ehAdmin = session.role === 'admin'
    // Grupo restrito a cargos some, com o ramo, para quem não tem o cargo. O
    // cargo só é lido quando algum grupo tem restrição — o caso raro.
    const quem = !ehAdmin && algumGrupoRestrito(groups as any)
      ? await lerCargoDoAluno(db, session.userId)
      : undefined
    const ocultos = ehAdmin ? new Set<string>() : idsDeGruposOcultos(groups as any, quem)
    const visiveis = ocultos.size > 0 ? groups.filter(g => !ocultos.has(String(g._id))) : groups

    // Corrige capas salvas antes da correção do bug de sanitização (URLs com "&#x2F;" no lugar de "/")
    const fixedGroups = visiveis.map(g =>
      g.imageUrl ? { ...g, imageUrl: decodeHtmlEntities(g.imageUrl) } : g
    )

    return NextResponse.json({ groups: fixedGroups })
  } catch (error: any) {
    console.error('Erro ao buscar grupos:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Criar novo grupo
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { name, description, color, icon, type, parentGroupId, category, course, imageUrl, allowedGroups } = await req.json()

    // Validação
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nome do grupo é obrigatório' }, { status: 400 })
    }

    // Apenas admin pode criar grupos gerais
    if (type === 'general' && session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem criar grupos gerais' },
        { status: 403 }
      )
    }

    const client = await clientPromise
    const db = client.db('DomineAqui')
    const groupsCollection = db.collection('groups')
    const usersCollection = db.collection('users')

    // Buscar nome do usuário
    let userName = 'Usuário'
    try {
      const user = await usersCollection.findOne({ _id: new ObjectId(session.userId) })
      if (user) {
        userName = user.name
      }
    } catch (error) {
      console.error('Erro ao buscar nome do usuário:', error)
      // Continuar mesmo se não encontrar o usuário
    }

    // Se parentGroupId foi fornecido, validar que o grupo pai existe
    if (parentGroupId) {
      const parentGroup = await groupsCollection.findOne({ _id: new ObjectId(parentGroupId) })
      if (!parentGroup) {
        return NextResponse.json({ error: 'Grupo pai não encontrado' }, { status: 404 })
      }
      // Herdar tipo do grupo pai
      if (parentGroup.type === 'general' && session.role !== 'admin') {
        return NextResponse.json(
          { error: 'Apenas administradores podem criar subgrupos dentro de grupos gerais' },
          { status: 403 }
        )
      }
    }

    // Criar grupo
    const newGroup: Record<string, any> = {
      name: name.trim(),
      type: type || 'personal',
      description: description?.trim() || '',
      color: color || '#3B82F6',
      icon: icon || '📁',
      createdBy: session.userId,
      createdByName: userName,
      isPublic: type === 'general',
      parentGroupId: parentGroupId || null,
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Campos opcionais
    if (imageUrl) {
      const normalizedImageUrl = normalizeImageUrl(imageUrl)
      if (normalizedImageUrl) newGroup.imageUrl = normalizedImageUrl
    }
    if (category && session.role === 'admin') {
      newGroup.category = category
    }
    if (course && session.role === 'admin') {
      newGroup.course = course
    }
    // Restrição por cargo — só grupo geral, só admin (ver lib/provas/grupos-ocultos.ts).
    const cargos = normalizarCargosPermitidos(allowedGroups)
    if (cargos.length > 0 && session.role === 'admin' && newGroup.type === 'general') {
      newGroup.allowedGroups = cargos
    }

    const result = await groupsCollection.insertOne(newGroup)
    // Um subgrupo novo dentro de um ramo oculto/restrito precisa entrar na
    // árvore que barra as provas dele — a memória curta ainda não o conhece.
    if (newGroup.type === 'general') esquecerGruposOcultos()

    return NextResponse.json({
      message: 'Grupo criado com sucesso',
      groupId: result.insertedId,
      group: { ...newGroup, _id: result.insertedId },
    })
  } catch (error: any) {
    console.error('Erro ao criar grupo:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
