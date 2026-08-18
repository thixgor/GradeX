import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
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

/** Provas processadas por chamada. A importação avança em ondas — ver o POST. */
const PROVAS_POR_ONDA = 10
/** Operações por `bulkWrite`. Um lote gigante estoura o limite de tamanho do comando. */
const OPERACOES_POR_LOTE = 200

/**
 * Quantas provas existem em cada grupo — contadas na MESMA fonte da importação.
 *
 * A tela chegou a usar `/api/exams` para isso e mostrava zero em todos os
 * grupos por dois motivos independentes: a projeção resumida não trazia
 * `groupId`, e aquela rota esconde as provas marcadas como ocultas — que são
 * justamente muitas das provas antigas da faculdade. O número na tela precisa
 * ser o número que vai ser importado.
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const provasCol = await colecaoDeProvas()
    const linhas = await provasCol
      .aggregate([
        { $match: { isDeleted: { $ne: true }, groupId: { $ne: null } } },
        {
          $group: {
            _id: '$groupId',
            provas: { $sum: 1 },
            questoes: { $sum: { $size: { $ifNull: ['$questions', []] } } },
          },
        },
      ])
      .toArray()

    return NextResponse.json({
      porGrupo: linhas.map((l: any) => ({
        grupoId: String(l._id),
        provas: l.provas,
        questoes: l.questoes,
      })),
    })
  } catch (error) {
    console.error('Erro ao contar provas por grupo:', error)
    return NextResponse.json({ error: 'Erro ao contar provas' }, { status: 500 })
  }
}

/**
 * Trazer as questões das Provas da Faculdade para o Banco de Questões.
 *
 * ## Por que a importação anda em ONDAS
 *
 * A primeira versão fazia tudo numa requisição: carregava todas as provas com
 * o array de questões inteiro, mapeava e gravava num `bulkWrite` só. Isso
 * funciona com um grupo pequeno e falha exatamente quando o admin faz o que a
 * tela convida a fazer — marcar o curso inteiro. Um curso com centenas de
 * provas de 90 questões carrega dezenas de MB na memória, monta milhares de
 * operações num comando só e estoura o tempo limite da função antes de gravar
 * qualquer coisa. E falha DEPOIS de ter trabalhado, sem dizer o que entrou.
 *
 * Agora cada chamada processa um punhado de provas (`offset`/`limite`) e
 * responde quanto falta. A tela chama de novo até acabar, mostrando progresso.
 * Uma onda que falha não leva as anteriores junto: o que já entrou, entrou —
 * e como a gravação é por carimbo de origem, repetir uma onda atualiza em vez
 * de duplicar.
 *
 * `previa: true` responde só a conta, com uma agregação barata.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const previa = body?.previa === true
    const offset = Math.max(0, Number(body?.offset) || 0)
    const limite = Math.min(Math.max(1, Number(body?.limite) || PROVAS_POR_ONDA), 40)

    const brutos: unknown[] = Array.isArray(body?.grupoIds) ? body.grupoIds : []
    const grupoIds = Array.from(new Set(brutos.map((g) => String(g)).filter(isValidObjectId)))
    if (grupoIds.length === 0) {
      return NextResponse.json({ error: 'Escolha ao menos um grupo' }, { status: 400 })
    }

    const [gruposCol, provasCol] = await Promise.all([colecaoDeGrupos(), colecaoDeProvas()])

    const gruposDocs = await gruposCol.find({}, { projection: { name: 1, parentGroupId: 1 } }).toArray()
    const grupos: GrupoDeProvas[] = gruposDocs.map((g: any) => ({
      _id: String(g._id),
      name: g.name,
      parentGroupId: g.parentGroupId ? String(g.parentGroupId) : null,
    }))
    const porId = new Map(grupos.map((g) => [g._id, g]))

    for (const id of grupoIds) {
      if (!porId.has(id)) {
        return NextResponse.json({ error: `Grupo ${id} não encontrado` }, { status: 404 })
      }
    }

    // Os grupos de cada raiz escolhida. Buscar só as provas destes grupos é o
    // que impede a consulta de arrastar o acervo inteiro para a memória.
    const ramoDaRaiz = new Map<string, Set<string>>()
    for (const raizId of grupoIds) {
      ramoDaRaiz.set(raizId, descendentes(grupos, raizId))
    }

    // ── Prévia: só a conta, sem carregar questão nenhuma ────────────────
    if (previa) {
      const porGrupo: { grupoId: string; grupoNome: string; provas: number; questoes: number }[] = []
      let provasTotal = 0
      let questoesTotal = 0
      const jaContadas = new Set<string>()

      for (const raizId of grupoIds) {
        const ids = Array.from(ramoDaRaiz.get(raizId)!)
        const linhas = await provasCol
          .aggregate([
            { $match: { isDeleted: { $ne: true }, groupId: { $in: ids } } },
            {
              $group: {
                _id: null,
                provas: { $sum: 1 },
                questoes: { $sum: { $size: { $ifNull: ['$questions', []] } } },
              },
            },
          ])
          .toArray()

        const linha = linhas[0] || { provas: 0, questoes: 0 }
        porGrupo.push({
          grupoId: raizId,
          grupoNome: porId.get(raizId)!.name,
          provas: linha.provas,
          questoes: linha.questoes,
        })
        if (!jaContadas.has(raizId)) {
          jaContadas.add(raizId)
          provasTotal += linha.provas
          questoesTotal += linha.questoes
        }
      }

      return NextResponse.json({
        previa: true,
        provas: provasTotal,
        // Teto, não promessa: redação, questão sem enunciado e objetiva sem
        // gabarito ficam de fora, e isso só se sabe olhando questão a questão.
        questoes: questoesTotal,
        porGrupo,
      })
    }

    // ── Onda de importação ──────────────────────────────────────────────
    // A ordem por `_id` é estável entre chamadas: sem isso, a onda seguinte
    // poderia repetir provas e pular outras.
    const fila: { examId: string; raizId: string }[] = []
    const vistos = new Set<string>()
    for (const raizId of grupoIds) {
      const ids = Array.from(ramoDaRaiz.get(raizId)!)
      const docs = await provasCol
        .find({ isDeleted: { $ne: true }, groupId: { $in: ids } }, { projection: { _id: 1 } })
        .sort({ _id: 1 })
        .toArray()
      for (const d of docs) {
        const examId = String(d._id)
        // Prova sob duas raízes escolhidas entra uma vez só, pela primeira.
        if (vistos.has(examId)) continue
        vistos.add(examId)
        fila.push({ examId, raizId })
      }
    }

    const fatia = fila.slice(offset, offset + limite)
    if (fatia.length === 0) {
      return NextResponse.json({
        totalProvas: fila.length,
        processadas: 0,
        proximoOffset: fila.length,
        fim: true,
        criadas: 0,
        atualizadas: 0,
        ignoradas: 0,
        exemplosIgnorados: [],
      })
    }

    const docs = await provasCol
      .find(
        { _id: { $in: fatia.map((f) => new ObjectId(f.examId)) } as any },
        { projection: { title: 1, groupId: 1, questions: 1, startTime: 1, createdAt: 1 } },
      )
      .toArray()

    const provasDaOnda = new Map<string, ProvaParaImportar>(
      docs.map((p: any) => [
        String(p._id),
        {
          _id: String(p._id),
          title: p.title || 'Prova sem título',
          groupId: p.groupId ? String(p.groupId) : null,
          questions: p.questions || [],
          startTime: p.startTime,
          createdAt: p.createdAt,
        },
      ]),
    )

    const questoes: QuestaoImportada[] = []
    const ignoradas: any[] = []

    // Uma chamada de mapeamento por raiz, com só as provas daquela raiz nesta
    // onda: `mapearProvas` já descarta o que não está sob a raiz, mas passar a
    // lista certa evita percorrer provas de outros grupos à toa.
    for (const raizId of grupoIds) {
      const doGrupo = fatia
        .filter((f) => f.raizId === raizId)
        .map((f) => provasDaOnda.get(f.examId))
        .filter(Boolean) as ProvaParaImportar[]
      if (doGrupo.length === 0) continue

      const resultado = mapearProvas(porId.get(raizId)!, doGrupo, grupos)
      questoes.push(...resultado.questoes)
      ignoradas.push(...resultado.ignoradas)
    }

    const db = await getDb()
    const gravadas = await gravar(db, questoes, session.userId)
    const proximoOffset = offset + fatia.length

    return NextResponse.json({
      totalProvas: fila.length,
      processadas: fatia.length,
      proximoOffset,
      fim: proximoOffset >= fila.length,
      ...gravadas,
      ignoradas: ignoradas.length,
      exemplosIgnorados: ignoradas.slice(0, 10),
    })
  } catch (error) {
    console.error('Erro ao importar provas para o banco:', error)
    return NextResponse.json({ error: 'Erro ao importar provas' }, { status: 500 })
  }
}

/** O grupo e tudo abaixo dele. Cortado por profundidade para um ciclo em dado antigo não travar. */
function descendentes(grupos: GrupoDeProvas[], raizId: string): Set<string> {
  const filhosPorPai = new Map<string, string[]>()
  for (const g of grupos) {
    const pai = g.parentGroupId || ''
    const lista = filhosPorPai.get(pai) || []
    lista.push(g._id)
    filhosPorPai.set(pai, lista)
  }

  const dentro = new Set<string>([raizId])
  const pilha = [raizId]
  let passos = 0
  while (pilha.length > 0 && passos < 10000) {
    passos++
    const atual = pilha.pop()!
    for (const filho of filhosPorPai.get(atual) || []) {
      if (dentro.has(filho)) continue
      dentro.add(filho)
      pilha.push(filho)
    }
  }
  return dentro
}

/**
 * Grava a hierarquia e as questões da onda.
 *
 * A hierarquia é resolvida antes, em memória: uma consulta por questão
 * transformaria uma prova de 90 questões em centenas de idas ao banco para
 * resolver sempre o mesmo tópico.
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

    const topicoCodigo = paraCodigo(q.topicoNome)
    const topicoChave = `${moduloCodigo}/${topicoCodigo}`
    if (!idDeTopico.has(topicoChave)) {
      idDeTopico.set(
        topicoChave,
        await acharOuCriar(
          'banco_topicos',
          { moduloId, codigo: topicoCodigo },
          { moduloId, nome: q.topicoNome, codigo: topicoCodigo },
        ),
      )
    }
    const topicoId = idDeTopico.get(topicoChave)!

    const subCodigo = paraCodigo(q.subtopicoNome)
    const subChave = `${topicoChave}/${subCodigo}`
    if (!idDeSubtopico.has(subChave)) {
      idDeSubtopico.set(
        subChave,
        await acharOuCriar(
          'banco_subtopicos',
          { topicoId, codigo: subCodigo },
          { topicoId, nome: q.subtopicoNome, codigo: subCodigo },
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
            ano: q.ano ?? null,
            // `null` explícito e não `undefined`: reimportar uma prova que foi
            // renomeada de "N1 SOI I" para "N1 SOI I - 2023.2" precisa APAGAR o
            // período antigo quando ele deixa de existir, e `$set: undefined`
            // simplesmente não escreve o campo.
            semestre: q.semestre ?? null,
            periodoLetivo: q.periodoLetivo ?? null,
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

  let criadas = 0
  let atualizadas = 0
  for (let i = 0; i < operacoes.length; i += OPERACOES_POR_LOTE) {
    const lote = operacoes.slice(i, i + OPERACOES_POR_LOTE)
    const r = await db.collection('banco_questoes').bulkWrite(lote, { ordered: false })
    criadas += r.upsertedCount || 0
    atualizadas += r.modifiedCount || 0
  }

  return { importadas: questoes.length, criadas, atualizadas }
}
