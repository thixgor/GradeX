import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Verificar se é admin
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
    const topicosCollection = db.collection('aulas_topicos')
    const subtopicosCollection = db.collection('aulas_subtopicos')
    const modulosCollection = db.collection('aulas_modulos')
    const submodulosCollection = db.collection('aulas_submodulos')
    const aulasCollection = db.collection('aulas_postagens')

    // Buscar todos os IDs válidos
    const setores = await setoresCollection.find({}).project({ _id: 1 }).toArray()
    const topicos = await topicosCollection.find({}).project({ _id: 1 }).toArray()
    const subtopicos = await subtopicosCollection.find({}).project({ _id: 1 }).toArray()
    const modulos = await modulosCollection.find({}).project({ _id: 1 }).toArray()
    const submodulos = await submodulosCollection.find({}).project({ _id: 1 }).toArray()

    const setoresIds = new Set(setores.map(s => String(s._id)))
    const topicosIds = new Set(topicos.map(t => String(t._id)))
    const subtopicosIds = new Set(subtopicos.map(s => String(s._id)))
    const modulosIds = new Set(modulos.map(m => String(m._id)))
    const submodulosIds = new Set(submodulos.map(sm => String(sm._id)))

    // Buscar todas as aulas
    const aulas = await aulasCollection.find({}).toArray()

    let deletedCount = 0
    const aulasParaDeletar: ObjectId[] = []

    for (const aula of aulas) {
      let isOrfa = false

      // Verificar se a aula referencia um setor que não existe
      if (aula.setorId && !setoresIds.has(String(aula.setorId))) {
        isOrfa = true
      }

      // Verificar se a aula referencia um tópico que não existe
      if (aula.topicoId && !topicosIds.has(String(aula.topicoId))) {
        isOrfa = true
      }

      // Verificar se a aula referencia um subtópico que não existe
      if (aula.subtopicoId && !subtopicosIds.has(String(aula.subtopicoId))) {
        isOrfa = true
      }

      // Verificar se a aula referencia um módulo que não existe
      if (aula.moduloId && !modulosIds.has(String(aula.moduloId))) {
        isOrfa = true
      }

      // Verificar se a aula referencia um submódulo que não existe
      if (aula.submoduloId && !submodulosIds.has(String(aula.submoduloId))) {
        isOrfa = true
      }

      if (isOrfa) {
        aulasParaDeletar.push(aula._id)
        deletedCount++
      }
    }

    // Deletar aulas órfãs
    if (aulasParaDeletar.length > 0) {
      await aulasCollection.deleteMany({
        _id: { $in: aulasParaDeletar }
      })
    }

    return NextResponse.json({
      success: true,
      message: `Limpeza concluída! ${deletedCount} aula(s) órfã(s) removida(s)`,
      deletedCount
    })
  } catch (error) {
    console.error('Erro ao limpar aulas órfãs:', error)
    return NextResponse.json(
      { error: 'Erro ao limpar aulas órfãs' },
      { status: 500 }
    )
  }
}
