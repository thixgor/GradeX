import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { User } from '@/lib/types'
import { BancoListaUsuario, BancoListaAleatoriaFiltros } from '@/lib/types/banco-questoes'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()

    // Verificar se usuário é premium ou admin
    const user = await db.collection<User>('users').findOne({ _id: new ObjectId(session.userId) })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    if (user.role !== 'admin' && user.accountType !== 'premium') {
      return NextResponse.json({
        error: 'Acesso restrito a usuários Premium',
        requiresPremium: true
      }, { status: 403 })
    }

    const body: BancoListaAleatoriaFiltros = await request.json()

    // Validar dados
    if (!body.nome || body.nome.trim() === '') {
      return NextResponse.json({ error: 'Nome da lista é obrigatório' }, { status: 400 })
    }

    if (!body.quantidade || body.quantidade < 1 || body.quantidade > 500) {
      return NextResponse.json({ error: 'Quantidade deve ser entre 1 e 500' }, { status: 400 })
    }

    // Verificar se já existe uma lista com esse nome para o usuário
    const existente = await db.collection('banco_listas_usuario').findOne({
      userId: new ObjectId(session.userId),
      nome: body.nome.trim()
    })

    if (existente) {
      return NextResponse.json({ error: 'Já existe uma lista com esse nome' }, { status: 400 })
    }

    // Helper para construir filtro com $in quando múltiplos IDs
    function buildIdFilter(param: string | string[] | undefined) {
      if (!param) return null
      const raw = Array.isArray(param) ? param : param.split(',').filter(Boolean)
      const ids = raw.map(id => new ObjectId(id.trim()))
      if (ids.length === 0) return null
      return ids.length === 1 ? ids[0] : { $in: ids }
    }

    // Construir query para buscar questões
    const matchStage: any = {}

    const periodoFilter = buildIdFilter(body.periodoId)
    if (periodoFilter) matchStage.periodoId = periodoFilter
    const moduloFilter = buildIdFilter(body.moduloId)
    if (moduloFilter) matchStage.moduloId = moduloFilter
    const topicoFilter = buildIdFilter(body.topicoId)
    if (topicoFilter) matchStage.topicoId = topicoFilter
    const subtopicoFilter = buildIdFilter(body.subtopicoId)
    if (subtopicoFilter) matchStage.subtopicoid = subtopicoFilter
    if (body.tipo) {
      matchStage.tipo = body.tipo
    }
    if (body.dificuldade) {
      matchStage.dificuldade = body.dificuldade
    }
    if (body.ano) {
      matchStage.ano = body.ano
    }

    // Buscar questões aleatórias
    // TENTATIVA DE MELHORIA DE ALEATORIEDADE:
    // O usuário relatou que parecem vir sempre as "últimas".
    // O $sample do Mongo pode ter viés se a amostragem for feita em blocos de disco contíguos (onde os últimos inserts estão).
    // Solução: Pedir uma amostra muito maior (ex: 5x) e fazer um embaralhamento (shuffle) em memória (Fisher-Yates).

    const fatorAmostra = 5
    const limiteAmostra = 2500 // Limite de segurança para memória
    const tamanhoAmostra = Math.min(body.quantidade * fatorAmostra, limiteAmostra)

    const pipeline = [
      { $match: matchStage },
      { $sample: { size: tamanhoAmostra } },
      { $project: { _id: 1 } }
    ]

    let questoesAleatorias = await db.collection('banco_questoes')
      .aggregate(pipeline)
      .toArray()

    if (questoesAleatorias.length === 0) {
      return NextResponse.json({
        error: 'Nenhuma questão encontrada com os filtros selecionados'
      }, { status: 400 })
    }

    // Algoritmo Fisher-Yates para garantir aleatoriedade imparcial no array retornado
    for (let i = questoesAleatorias.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questoesAleatorias[i], questoesAleatorias[j]] = [questoesAleatorias[j], questoesAleatorias[i]];
    }

    // Cortar para o tamanho exato solicitado
    const questoesSelecionadas = questoesAleatorias.slice(0, body.quantidade)
    const questaoIds = questoesSelecionadas.map(q => q._id)

    // Criar a lista
    const novaLista: Omit<BancoListaUsuario, '_id'> = {
      userId: new ObjectId(session.userId),
      nome: body.nome.trim(),
      questaoIds,
      modoResposta: body.modoResposta || 'imediato',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('banco_listas_usuario').insertOne(novaLista)

    return NextResponse.json({
      sucesso: true,
      lista: { ...novaLista, _id: result.insertedId },
      totalQuestoes: questaoIds.length
    })
  } catch (error) {
    console.error('Erro ao criar lista aleatória:', error)
    return NextResponse.json({ error: 'Erro ao criar lista aleatória' }, { status: 500 })
  }
}
