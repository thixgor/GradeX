import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { isValidObjectId } from '@/lib/api-security'
import { colecaoDeGrupos, colecaoDeProvas } from '@/lib/provas/colecoes'
import { paraCodigo } from '@/lib/banco/hierarquia'
import {
  chaveDeOrigem,
  mapearProvas,
  type GrupoDeProvas,
  type ProvaParaImportar,
  type QuestaoImportada,
} from '@/lib/banco/importar-provas'

export const dynamic = 'force-dynamic'

/**
 * Trazer as questões das Provas da Faculdade para o Banco de Questões.
 *
 * O admin escolhe grupos em /provas e as questões entram com gabarito e
 * resposta comentada. Redigitá-las no formato de importação por texto seria
 * manter duas cópias da mesma questão, que divergem no primeiro conserto de
 * gabarito.
 *
 * `?prévia=1` (ou `previa`) devolve a conta sem gravar nada. A prévia usa a
 * MESMA função de mapeamento da importação — é o que garante que o número
 * mostrado antes seja o número importado depois.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const previa = body?.previa === true
    const brutos: unknown[] = Array.isArray(body?.grupoIds) ? body.grupoIds : []
    const grupoIds = Array.from(new Set(brutos.map((g) => String(g)).filter(isValidObjectId)))

    if (grupoIds.length === 0) {
      return NextResponse.json({ error: 'Escolha ao menos um grupo' }, { status: 400 })
    }

    const [gruposCol, provasCol] = await Promise.all([colecaoDeGrupos(), colecaoDeProvas()])

    const gruposDocs = await gruposCol
      .find({}, { projection: { name: 1, parentGroupId: 1 } })
      .toArray()
    const grupos: GrupoDeProvas[] = gruposDocs.map((g: any) => ({
      _id: String(g._id),
      name: g.name,
      parentGroupId: g.parentGroupId ? String(g.parentGroupId) : null,
    }))
    const porId = new Map(grupos.map((g) => [g._id, g]))

    // Só as provas que estão em algum grupo interessam; o mapeamento descarta
    // as que não estiverem sob a raiz escolhida.
    const provasDocs = await provasCol
      .find(
        { isDeleted: { $ne: true }, groupId: { $ne: null } },
        { projection: { title: 1, groupId: 1, questions: 1, startTime: 1, createdAt: 1 } },
      )
      .toArray()
    const provas: ProvaParaImportar[] = provasDocs.map((p: any) => ({
      _id: String(p._id),
      title: p.title || 'Prova sem título',
      groupId: p.groupId ? String(p.groupId) : null,
      questions: p.questions || [],
      startTime: p.startTime,
      createdAt: p.createdAt,
    }))

    const todas: QuestaoImportada[] = []
    const ignoradas: any[] = []
    const porGrupo: { grupoId: string; grupoNome: string; questoes: number }[] = []

    for (const grupoId of grupoIds) {
      const raiz = porId.get(grupoId)
      if (!raiz) {
        return NextResponse.json({ error: `Grupo ${grupoId} não encontrado` }, { status: 404 })
      }
      const resultado = mapearProvas(raiz, provas, grupos)
      todas.push(...resultado.questoes)
      ignoradas.push(...resultado.ignoradas)
      porGrupo.push({ grupoId, grupoNome: raiz.name, questoes: resultado.questoes.length })
    }

    // Quantas já existem no banco — a diferença entre "novas" e "atualizadas" é
    // a pergunta que o admin faz antes de apertar o botão.
    const db = await getDb()
    const chaves = todas.map((q) => chaveDeOrigem(q.origem))
    const existentes = chaves.length
      ? await db
          .collection('banco_questoes')
          .find({ origemChave: { $in: chaves } }, { projection: { origemChave: 1 } })
          .toArray()
      : []
    const jaExistem = new Set(existentes.map((e: any) => e.origemChave))

    const resumo = {
      total: todas.length,
      novas: chaves.filter((c) => !jaExistem.has(c)).length,
      atualizadas: chaves.filter((c) => jaExistem.has(c)).length,
      ignoradas: ignoradas.length,
      porGrupo,
      // A lista do que ficou de fora é curta de propósito: serve para o admin
      // reconhecer o padrão do problema, não para auditar prova por prova.
      exemplosIgnorados: ignoradas.slice(0, 20),
    }

    if (previa) {
      return NextResponse.json({ previa: true, ...resumo })
    }

    const gravadas = await gravar(db, todas, session.userId)

    return NextResponse.json({ previa: false, ...resumo, ...gravadas })
  } catch (error) {
    console.error('Erro ao importar provas para o banco:', error)
    return NextResponse.json({ error: 'Erro ao importar provas' }, { status: 500 })
  }
}

/**
 * Grava a hierarquia e as questões.
 *
 * A hierarquia é resolvida em lote ANTES das questões: uma consulta por questão
 * transformaria a importação de uma prova de 90 questões em centenas de idas ao
 * banco, e o `upsert` por nome faria as mesmas idas repetidas para o mesmo
 * tópico.
 */
async function gravar(db: any, questoes: QuestaoImportada[], userId: string) {
  if (questoes.length === 0) return { importadas: 0, criadas: 0, atualizadas: 0 }

  const idDeModulo = new Map<string, ObjectId>()
  const idDeTopico = new Map<string, ObjectId>()
  const idDeSubtopico = new Map<string, ObjectId>()

  async function acharOuCriar(
    colecao: string,
    filtro: Record<string, any>,
    documento: Record<string, any>,
  ): Promise<ObjectId> {
    const achado = await db.collection(colecao).findOne(filtro, { projection: { _id: 1 } })
    if (achado) return achado._id
    const criado = await db.collection(colecao).insertOne({
      ...documento,
      ordem: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return criado.insertedId
  }

  for (const q of questoes) {
    const moduloCodigo = paraCodigo(q.moduloNome)
    if (!idDeModulo.has(moduloCodigo)) {
      idDeModulo.set(
        moduloCodigo,
        await acharOuCriar('banco_modulos', { codigo: moduloCodigo }, {
          nome: q.moduloNome,
          codigo: moduloCodigo,
        }),
      )
    }
    const moduloId = idDeModulo.get(moduloCodigo)!

    const topicoChave = `${moduloCodigo}/${paraCodigo(q.topicoNome)}`
    if (!idDeTopico.has(topicoChave)) {
      idDeTopico.set(
        topicoChave,
        await acharOuCriar(
          'banco_topicos',
          { moduloId, codigo: paraCodigo(q.topicoNome) },
          { moduloId, nome: q.topicoNome, codigo: paraCodigo(q.topicoNome) },
        ),
      )
    }
    const topicoId = idDeTopico.get(topicoChave)!

    const subChave = `${topicoChave}/${paraCodigo(q.subtopicoNome)}`
    if (!idDeSubtopico.has(subChave)) {
      idDeSubtopico.set(
        subChave,
        await acharOuCriar(
          'banco_subtopicos',
          { topicoId, codigo: paraCodigo(q.subtopicoNome) },
          { topicoId, nome: q.subtopicoNome, codigo: paraCodigo(q.subtopicoNome) },
        ),
      )
    }
  }

  const operacoes = questoes.map((q) => {
    const moduloCodigo = paraCodigo(q.moduloNome)
    const topicoChave = `${moduloCodigo}/${paraCodigo(q.topicoNome)}`
    const subChave = `${topicoChave}/${paraCodigo(q.subtopicoNome)}`

    return {
      updateOne: {
        filter: { origemChave: chaveDeOrigem(q.origem) },
        update: {
          $set: {
            tipo: q.tipo,
            moduloId: idDeModulo.get(moduloCodigo),
            topicoId: idDeTopico.get(topicoChave),
            subtopicoid: idDeSubtopico.get(subChave),
            enunciado: q.enunciado,
            alternativas: q.alternativas,
            respostaModelo: q.respostaModelo,
            explicacao: q.explicacao,
            imagemUrl: q.imagemUrl,
            fonte: q.fonte,
            ano: q.ano,
            origem: q.origem,
            updatedAt: new Date(),
          },
          // Estatística e autoria só entram na criação: reimportar para
          // corrigir um gabarito não pode zerar quantas pessoas já responderam.
          $setOnInsert: {
            origemChave: chaveDeOrigem(q.origem),
            totalRespostas: 0,
            totalAcertos: 0,
            createdAt: new Date(),
            createdBy: new ObjectId(userId),
          },
        },
        upsert: true,
      },
    }
  })

  const resultado = await db.collection('banco_questoes').bulkWrite(operacoes, { ordered: false })

  return {
    importadas: questoes.length,
    criadas: resultado.upsertedCount || 0,
    atualizadas: resultado.modifiedCount || 0,
  }
}
