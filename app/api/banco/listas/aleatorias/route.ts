import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { User } from '@/lib/types'
import { BancoListaUsuario, BancoListaAleatoriaFiltros } from '@/lib/types/banco-questoes'
import { isPlusAccount } from '@/lib/account-tier'

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

    if (user.role !== 'admin' && !isPlusAccount(user.accountType)) {
      return NextResponse.json({
        error: 'Acesso restrito a assinantes Plus+',
        requiresPlus: true
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

    // `periodoId` saiu do produto (ver lib/banco/hierarquia.ts) e não é mais
    // aceito: um filtro por um nível que a tela não mostra só produziria
    // listas vazias sem explicação.
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
    // Um ano (compatibilidade) ou vários — a tela manda `anos`.
    const anos = Array.isArray((body as any).anos)
      ? (body as any).anos.map((a: any) => Number(a)).filter((a: number) => Number.isFinite(a))
      : body.ano
        ? [Number(body.ano)]
        : []
    if (anos.length === 1) matchStage.ano = anos[0]
    else if (anos.length > 1) matchStage.ano = { $in: anos }

    // Se o usuário quer excluir questões já resolvidas, buscar IDs resolvidos
    if (body.excluirJaResolvidas) {
      const resolucoes = await db.collection('banco_resolucoes')
        .distinct('questaoId', { userId: new ObjectId(session.userId) })
      if (resolucoes.length > 0) {
        // resolucoes pode conter ObjectId ou string; garantir ObjectId para o filtro
        matchStage._id = { $nin: resolucoes.map((id: any) => new ObjectId(String(id))) }
      }
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
        error: 'Nenhuma questão combina com esses filtros'
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

    /*
     * A lista sai com o que EXISTE, não com o que foi pedido.
     *
     * Pedir 50 quando há 12 não é erro do usuário: é o banco que ainda não tem
     * 50 daquele recorte. Recusar mandaria a pessoa adivinhar qual número
     * cabe, tentando 40, 30, 20 até acertar. A lista é criada com as 12 e a
     * resposta diz que foram 12 — a tela avisa antes, com a mesma conta.
     */
    return NextResponse.json({
      sucesso: true,
      lista: { ...novaLista, _id: result.insertedId },
      totalQuestoes: questaoIds.length,
      pedidas: body.quantidade,
      incompleta: questaoIds.length < body.quantidade
    })
  } catch (error) {
    console.error('Erro ao criar lista aleatória:', error)
    return NextResponse.json({ error: 'Erro ao criar lista aleatória' }, { status: 500 })
  }
}
