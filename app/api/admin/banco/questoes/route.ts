import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { BancoQuestao, BancoQuestaoComHierarquia } from '@/lib/types/banco-questoes'
import { ehObjectId, escaparRegex, lerQuestao } from '@/lib/banco/questao-admin'
import { conferirHierarquia } from '@/lib/banco/questao-hierarquia'
import { internalizarObjeto } from '@/lib/midia/internalizar'

export const dynamic = 'force-dynamic'

const LIMITE_PADRAO = 20
const LIMITE_MAXIMO = 100

/** As ordens que a tela oferece. Qualquer outra coisa cai em "recentes". */
const ORDENS: Record<string, Record<string, 1 | -1>> = {
  recentes: { createdAt: -1 },
  antigas: { createdAt: 1 },
  atualizadas: { updatedAt: -1 },
}

/**
 * Questões que precisam de uma segunda olhada.
 *
 * Objetiva sem gabarito, objetiva sem alternativa nenhuma, discursiva sem
 * resposta modelo: todas passavam pelo PUT antigo, que gravava o que viesse
 * (ver lib/banco/questao-admin.ts). A validação nova impede que apareçam
 * novas; este filtro é como se acha as que já estão lá.
 */
const PRECISA_DE_REVISAO = {
  $or: [
    { tipo: 'objetiva', alternativas: { $not: { $elemMatch: { correta: true } } } },
    { tipo: 'objetiva', alternativas: { $elemMatch: { texto: '' } } },
    { tipo: 'discursiva', respostaModelo: { $in: [null, ''] } },
    { enunciado: { $in: [null, ''] } },
    { topicoId: null },
  ],
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)

    const moduloId = searchParams.get('moduloId')
    const topicoId = searchParams.get('topicoId')
    const subtopicoId = searchParams.get('subtopicoId')
    const tipo = searchParams.get('tipo')
    const dificuldade = searchParams.get('dificuldade')
    const busca = (searchParams.get('busca') || '').trim()
    const ordenar = searchParams.get('ordenar') || 'recentes'
    const revisar = searchParams.get('revisar') === '1'

    // Id malformado é pergunta sem resposta, não erro do servidor: antes ele ia
    // direto para `new ObjectId()`, que lança, e a lista inteira respondia 500.
    for (const [nome, valor] of [
      ['moduloId', moduloId],
      ['topicoId', topicoId],
      ['subtopicoId', subtopicoId],
    ] as const) {
      if (valor && !ehObjectId(valor)) {
        return NextResponse.json({ error: `Filtro ${nome} inválido` }, { status: 400 })
      }
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '') || LIMITE_PADRAO), LIMITE_MAXIMO)
    const skip = (page - 1) * limit

    const db = await getDb()

    const filtro: any = {}

    if (moduloId) filtro.moduloId = new ObjectId(moduloId)
    if (topicoId) filtro.topicoId = new ObjectId(topicoId)
    if (subtopicoId) filtro.subtopicoid = new ObjectId(subtopicoId)
    if (tipo === 'objetiva' || tipo === 'discursiva') filtro.tipo = tipo
    if (dificuldade) filtro.dificuldade = dificuldade

    if (busca) {
      // O termo é escapado: enunciado de prova tem parêntese, e "(A)" cru vira
      // um grupo de captura — quando não derruba a consulta com erro de sintaxe.
      const termo = { $regex: escaparRegex(busca), $options: 'i' }
      filtro.$and = [{ $or: [{ enunciado: termo }, { fonte: termo }, { tags: termo }] }]
    }

    if (revisar) {
      filtro.$and = [...(filtro.$and || []), PRECISA_DE_REVISAO]
    }

    // Ordenar, cortar a página e SÓ ENTÃO buscar os nomes da hierarquia. Os
    // `$lookup` vinham antes do `$skip`: com dez mil questões no banco, cada
    // abertura da lista juntava as três coleções dez mil vezes para mostrar
    // vinte linhas.
    const pipeline = [
      { $match: filtro },
      { $sort: ORDENS[ordenar] || ORDENS.recentes },
      { $skip: skip },
      { $limit: limit },
      { $lookup: { from: 'banco_modulos', localField: 'moduloId', foreignField: '_id', as: 'modulo' } },
      { $lookup: { from: 'banco_topicos', localField: 'topicoId', foreignField: '_id', as: 'topico' } },
      {
        $lookup: {
          from: 'banco_subtopicos',
          localField: 'subtopicoid',
          foreignField: '_id',
          as: 'subtopico',
        },
      },
      {
        $addFields: {
          moduloNome: { $arrayElemAt: ['$modulo.nome', 0] },
          topicoNome: { $arrayElemAt: ['$topico.nome', 0] },
          subtopicoNome: { $arrayElemAt: ['$subtopico.nome', 0] },
        },
      },
      { $project: { modulo: 0, topico: 0, subtopico: 0 } },
    ]

    const [questoes, total] = await Promise.all([
      db
        .collection<BancoQuestao>('banco_questoes')
        .aggregate<BancoQuestaoComHierarquia>(pipeline)
        .toArray(),
      db.collection('banco_questoes').countDocuments(filtro),
    ])

    return NextResponse.json({
      questoes,
      paginacao: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    })
  } catch (error) {
    console.error('Erro ao buscar questões:', error)
    return NextResponse.json({ error: 'Erro ao buscar questões' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const corpo = await request.json().catch(() => null)

    // A mesma leitura da edição, para as duas telas cobrarem as mesmas coisas.
    const leitura = lerQuestao(corpo)
    if (!leitura.ok) {
      return NextResponse.json({ error: leitura.erro, campo: leitura.campo }, { status: 400 })
    }

    const db = await getDb()

    // Link do Imgur colado no editor vira arquivo nosso antes de virar
    // documento. Vale para a imagem principal e para qualquer embed escondido
    // no enunciado, na explicação ou no texto de uma alternativa. Se o download
    // falhar, a URL original passa intacta e a varredura noturna a recolhe —
    // ver lib/midia/internalizar.ts.
    const questao = await internalizarObjeto(leitura.questao, { db })

    const hierarquia = await conferirHierarquia(db, questao)
    if (!hierarquia.ok) {
      return NextResponse.json(
        { error: hierarquia.erro, campo: hierarquia.campo },
        { status: hierarquia.status },
      )
    }

    // Período saiu da hierarquia (ver lib/banco/hierarquia.ts): módulo é o topo
    // e questão nova não nasce com período nenhum.
    const nova = {
      tipo: questao.tipo,
      moduloId: new ObjectId(questao.moduloId),
      topicoId: new ObjectId(questao.topicoId),
      subtopicoid: questao.subtopicoId ? new ObjectId(questao.subtopicoId) : null,
      enunciado: questao.enunciado,
      explicacao: questao.explicacao,
      imagemUrl: questao.imagemUrl,
      alternativas: questao.alternativas,
      respostaModelo: questao.respostaModelo,
      dificuldade: questao.dificuldade,
      tags: questao.tags,
      fonte: questao.fonte,
      ano: questao.ano,
      totalRespostas: 0,
      totalAcertos: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: new ObjectId(session.userId),
    }

    const resultado = await db.collection('banco_questoes').insertOne(nova as any)

    return NextResponse.json({
      sucesso: true,
      questao: {
        ...nova,
        _id: resultado.insertedId,
        moduloNome: hierarquia.moduloNome,
        topicoNome: hierarquia.topicoNome,
        subtopicoNome: hierarquia.subtopicoNome,
      },
    })
  } catch (error) {
    console.error('Erro ao criar questão:', error)
    return NextResponse.json({ error: 'Erro ao criar questão' }, { status: 500 })
  }
}
