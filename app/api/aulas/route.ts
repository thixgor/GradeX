import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { AulaPostagem, AulaSetor, AulaTopic, AulaSubtopic, AulaModulo, AulaSubmodulo } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = await getDb()
    
    const setoresCollection = db.collection<AulaSetor>('aulas_setores')
    const topicosCollection = db.collection<AulaTopic>('aulas_topicos')
    const subtopicosCollection = db.collection<AulaSubtopic>('aulas_subtopicos')
    const modulosCollection = db.collection<AulaModulo>('aulas_modulos')
    const submodulosCollection = db.collection<AulaSubmodulo>('aulas_submodulos')
    const aulasCollection = db.collection<AulaPostagem>('aulas_postagens')

    const [setores, topicos, subtopicos, modulos, submodulos, aulas] = await Promise.all([
      setoresCollection.find({}).sort({ ordem: 1 }).toArray(),
      topicosCollection.find({}).sort({ ordem: 1 }).toArray(),
      subtopicosCollection.find({}).sort({ ordem: 1 }).toArray(),
      modulosCollection.find({}).sort({ ordem: 1 }).toArray(),
      submodulosCollection.find({}).sort({ ordem: 1 }).toArray(),
      aulasCollection.find({}).sort({ criadoEm: -1 }).toArray()
    ])

    return NextResponse.json({
      setores,
      topicos,
      subtopicos,
      modulos,
      submodulos,
      aulas
    })
  } catch (error) {
    console.error('Erro ao buscar aulas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar aulas' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
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
    const {
      titulo,
      descricao,
      tipo,
      visibilidade,
      setorId,
      topicoId,
      subtopicoId,
      moduloId,
      submoduloId,
      linkOuEmbed,
      videoEmbed,
      pdfs,
      dataLiberacao
    } = body

    if (!titulo) {
      return NextResponse.json(
        { error: 'Título é obrigatório' },
        { status: 400 }
      )
    }

    const aulasCollection = db.collection<AulaPostagem>('aulas_postagens')

    const novaAula: AulaPostagem = {
      titulo,
      descricao,
      tipo,
      visibilidade,
      setorId,
      topicoId,
      subtopicoId,
      moduloId,
      submoduloId,
      linkOuEmbed,
      videoEmbed,
      pdfs: pdfs || [],
      dataLiberacao: dataLiberacao ? new Date(dataLiberacao) : new Date('2000-01-01'),
      criadoEm: new Date(),
      atualizadoEm: new Date(),
      oculta: false,
      comentarios: []
    }

    const result = await aulasCollection.insertOne(novaAula)

    return NextResponse.json({
      aula: {
        ...novaAula,
        _id: result.insertedId
      }
    })
  } catch (error) {
    console.error('Erro ao criar aula:', error)
    return NextResponse.json(
      { error: 'Erro ao criar aula' },
      { status: 500 }
    )
  }
}
