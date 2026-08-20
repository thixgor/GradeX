import { NextRequest, NextResponse } from 'next/server'
import { Db, ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { paraCodigo } from '@/lib/banco/hierarquia'
import { formatarPeriodoLetivo } from '@/lib/banco/periodo-letivo'
import {
  chaveDaQuestao,
  lerArquivoDeImportacao,
  resumir,
  type OcorrenciaDeImportacao,
  type QuestaoLida,
} from '@/lib/banco/importar-questoes'
import { BancoAlternativaLetra, BancoQuestao } from '@/lib/types/banco-questoes'

export const dynamic = 'force-dynamic'

/**
 * Importação em massa de questões pelo arquivo de texto.
 *
 * A leitura do arquivo mora em lib/banco/importar-questoes.ts, que é puro e
 * testado — aqui só sobra o que precisa de banco. Esta rota faz três coisas
 * que a versão anterior não fazia:
 *
 * 1. **Conferir sem gravar** (`validar: true`). Antes, a única forma de saber
 *    se o arquivo estava certo era importar: quando a questão 300 falhava, as
 *    299 primeiras já estavam no banco e o conserto era caçá-las na tabela.
 * 2. **Não duplicar.** Reimportar o mesmo arquivo — porque a primeira metade
 *    falhou, porque o admin não lembrava se tinha enviado — criava uma segunda
 *    cópia de cada questão. Agora o que já existe no mesmo módulo é contado
 *    como ignorado, e a resposta diz quantos foram.
 * 3. **Achar a hierarquia pelo código.** A busca era por `$regex` com o nome
 *    cru: um módulo chamado "Saúde (SOI I)" virava expressão regular inválida
 *    e derrubava a questão inteira com um erro de MongoDB. Agora o nome é
 *    escapado e a comparação primária é pelo `codigo` — o mesmo que a tela de
 *    hierarquia usa —, então "Cardiologia" e "cardiologia " param no mesmo
 *    módulo em vez de criarem dois.
 */

interface HierarquiaCriada {
  modulos: string[]
  topicos: string[]
  subtopicos: string[]
}

function escaparRegex(valor: string): string {
  return valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Casa pelo código (sem acento nem caixa) e, para dado antigo, pelo nome. */
function filtroDeNome(nome: string) {
  return {
    $or: [
      { codigo: paraCodigo(nome) },
      { nome: { $regex: `^${escaparRegex(nome)}$`, $options: 'i' } },
    ],
  }
}

/**
 * Resolve (achando ou criando) um nível da hierarquia, com cache por execução.
 *
 * Sem o cache, um arquivo com 300 questões do mesmo módulo faz 300 idas ao
 * banco para descobrir 300 vezes a mesma resposta — e, nas primeiras, corre o
 * risco de criar o módulo duas vezes.
 */
async function resolverNivel(
  db: Db,
  colecao: string,
  nome: string,
  pai: Record<string, unknown>,
  cache: Map<string, ObjectId>,
  criados: string[],
  criar: boolean,
): Promise<ObjectId | null> {
  const chaveDoPai = Object.values(pai).map(String).join('/')
  const chave = `${colecao}:${chaveDoPai}:${paraCodigo(nome)}`
  const emCache = cache.get(chave)
  if (emCache) return emCache

  const existente = await db.collection(colecao).findOne({ ...pai, ...filtroDeNome(nome) })
  if (existente) {
    cache.set(chave, existente._id)
    return existente._id
  }

  if (!criar) return null

  const ultimo = await db.collection(colecao).findOne(pai, { sort: { ordem: -1 } })
  const { insertedId } = await db.collection(colecao).insertOne({
    ...pai,
    nome,
    codigo: paraCodigo(nome),
    ordem: (ultimo?.ordem ?? 0) + 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  cache.set(chave, insertedId)
  criados.push(nome)
  return insertedId
}

/**
 * Enunciados que já existem nos módulos envolvidos.
 *
 * Uma consulta só, projetando o enunciado, em vez de uma por questão: com o
 * banco cheio, 300 consultas sem índice são 300 varreduras da coleção. O teto
 * evita que um módulo gigante traga tudo para a memória — passando dele, a
 * importação segue sem a checagem, e a resposta avisa.
 */
const TETO_DE_COMPARACAO = 20000

async function carregarExistentes(
  db: Db,
  moduloIds: ObjectId[],
): Promise<{ chaves: Set<string>; completo: boolean }> {
  const chaves = new Set<string>()
  if (moduloIds.length === 0) return { chaves, completo: true }

  const docs = await db
    .collection('banco_questoes')
    .find({ moduloId: { $in: moduloIds } }, { projection: { enunciado: 1, moduloId: 1 } })
    .limit(TETO_DE_COMPARACAO + 1)
    .toArray()

  if (docs.length > TETO_DE_COMPARACAO) return { chaves, completo: false }

  for (const doc of docs) {
    chaves.add(chaveDaQuestao(String(doc.moduloId), String(doc.enunciado || '')))
  }
  return { chaves, completo: true }
}

function montarQuestao(
  q: QuestaoLida,
  moduloId: ObjectId,
  topicoId: ObjectId,
  subtopicoId: ObjectId | null,
  autor: ObjectId | undefined,
  loteImportacaoId: ObjectId,
): Omit<BancoQuestao, '_id'> {
  const periodoLetivo =
    q.ano && q.semestre ? formatarPeriodoLetivo({ ano: q.ano, semestre: q.semestre }) : null

  return {
    tipo: q.tipo,
    moduloId,
    topicoId,
    subtopicoid: subtopicoId || undefined,
    enunciado: q.enunciado,
    explicacao: q.explicacao,
    imagemUrl: q.imagemUrl,
    imagensAlternativas: q.alternativas
      ?.filter((a) => a.imagemUrl)
      .map((a) => ({ letra: a.letra as BancoAlternativaLetra, url: a.imagemUrl! })),
    alternativas: q.alternativas?.map((alt) => ({
      letra: alt.letra as BancoAlternativaLetra,
      texto: alt.texto,
      correta: alt.letra === q.correta,
    })),
    respostaModelo: q.respostaModelo,
    dificuldade: q.dificuldade,
    tags: q.tags,
    fonte: q.fonte,
    ano: q.ano,
    semestre: q.semestre,
    periodoLetivo: periodoLetivo || undefined,
    totalRespostas: 0,
    totalAcertos: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: autor as unknown as ObjectId,
    loteImportacaoId,
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))

    if (!body?.conteudo || typeof body.conteudo !== 'string') {
      return NextResponse.json({ error: 'Conteúdo do arquivo é obrigatório' }, { status: 400 })
    }

    // Conferência: lê, resolve a hierarquia que JÁ existe e conta duplicadas,
    // sem escrever nada. É o que a tela chama antes de deixar importar.
    const validar = body.validar === true

    const { questoes, erros, avisos } = lerArquivoDeImportacao(body.conteudo)

    if (questoes.length === 0) {
      return NextResponse.json({
        sucesso: false,
        validacao: validar,
        totalImportadas: 0,
        totalIgnoradas: 0,
        erros: erros.length > 0 ? erros : [{ linha: 1, mensagem: 'Nenhuma questão encontrada no arquivo' }],
        avisos,
        questoesImportadas: [],
        hierarquiaCriada: { modulos: [], topicos: [], subtopicos: [] },
      })
    }

    const db = await getDb()

    const cache = new Map<string, ObjectId>()
    const criados: HierarquiaCriada = { modulos: [], topicos: [], subtopicos: [] }
    const errosDeGravacao: OcorrenciaDeImportacao[] = []
    const autor = ObjectId.isValid(String(session.userId))
      ? new ObjectId(String(session.userId))
      : undefined

    // 1ª passada: hierarquia. Em conferência, nada é criado — o que ainda não
    // existe é listado como "vai ser criado".
    const resolvidas: { q: QuestaoLida; moduloId: ObjectId; topicoId: ObjectId; subtopicoId: ObjectId | null }[] = []
    const criariaModulos = new Set<string>()
    const criariaTopicos = new Set<string>()
    const criariaSubtopicos = new Set<string>()

    for (const q of questoes) {
      try {
        const moduloId = await resolverNivel(db, 'banco_modulos', q.modulo, {}, cache, criados.modulos, !validar)
        if (!moduloId) {
          criariaModulos.add(q.modulo)
          criariaTopicos.add(`${q.modulo} › ${q.topico}`)
          if (q.subtopico) criariaSubtopicos.add(`${q.modulo} › ${q.topico} › ${q.subtopico}`)
          continue
        }

        const topicoId = await resolverNivel(
          db, 'banco_topicos', q.topico, { moduloId }, cache, criados.topicos, !validar,
        )
        if (!topicoId) {
          criariaTopicos.add(`${q.modulo} › ${q.topico}`)
          if (q.subtopico) criariaSubtopicos.add(`${q.modulo} › ${q.topico} › ${q.subtopico}`)
          continue
        }

        let subtopicoId: ObjectId | null = null
        if (q.subtopico) {
          subtopicoId = await resolverNivel(
            db, 'banco_subtopicos', q.subtopico, { topicoId }, cache, criados.subtopicos, !validar,
          )
          if (!subtopicoId) criariaSubtopicos.add(`${q.modulo} › ${q.topico} › ${q.subtopico}`)
        }

        resolvidas.push({ q, moduloId, topicoId, subtopicoId })
      } catch (e) {
        errosDeGravacao.push({
          linha: q.linha,
          mensagem: `Não consegui montar a hierarquia de "${resumir(q.enunciado)}": ${e instanceof Error ? e.message : e}`,
        })
      }
    }

    // 2ª passada: o que já está no banco não entra de novo.
    const moduloIds = [...new Set(resolvidas.map((r) => String(r.moduloId)))].map((id) => new ObjectId(id))
    const { chaves, completo } = await carregarExistentes(db, moduloIds)

    if (!completo) {
      avisos.push({
        linha: 0,
        mensagem: 'Este módulo tem questões demais para comparar uma a uma — a checagem de repetidas foi pulada nesta importação.',
      })
    }

    // Um id só para toda a leva: é o que permite achar e apagar, de uma vez,
    // tudo o que este arquivo trouxe — ver /admin/banco-questoes/importar/historico.
    const loteImportacaoId = new ObjectId()

    const novas: { q: QuestaoLida; documento: Omit<BancoQuestao, '_id'> }[] = []
    let ignoradas = 0

    for (const { q, moduloId, topicoId, subtopicoId } of resolvidas) {
      const chave = chaveDaQuestao(String(moduloId), q.enunciado)
      if (chaves.has(chave)) {
        ignoradas++
        continue
      }
      chaves.add(chave)
      novas.push({
        q,
        documento: montarQuestao(q, moduloId, topicoId, subtopicoId, autor, loteImportacaoId),
      })
    }

    if (validar) {
      return NextResponse.json({
        sucesso: erros.length === 0 && novas.length > 0,
        validacao: true,
        totalImportadas: 0,
        totalAImportar: novas.length,
        totalIgnoradas: ignoradas,
        erros: [...erros, ...errosDeGravacao],
        avisos,
        questoesImportadas: [],
        hierarquiaCriada: {
          modulos: [...criariaModulos],
          topicos: [...criariaTopicos],
          subtopicos: [...criariaSubtopicos],
        },
      })
    }

    // Gravação em lotes: `insertMany` por questão faria uma ida ao banco por
    // linha do arquivo, e um arquivo de prova inteira tem centenas.
    const TAMANHO_DO_LOTE = 200
    const importadas: BancoQuestao[] = []

    for (let i = 0; i < novas.length; i += TAMANHO_DO_LOTE) {
      const lote = novas.slice(i, i + TAMANHO_DO_LOTE)
      try {
        const { insertedIds } = await db
          .collection('banco_questoes')
          .insertMany(lote.map((n) => n.documento) as any[], { ordered: false })

        lote.forEach((n, indice) => {
          importadas.push({ ...n.documento, _id: insertedIds[indice] } as BancoQuestao)
        })
      } catch (e) {
        errosDeGravacao.push({
          linha: lote[0].q.linha,
          mensagem: `Falha ao gravar um lote de ${lote.length} questões: ${e instanceof Error ? e.message : e}`,
        })
      }
    }

    return NextResponse.json({
      sucesso: importadas.length > 0,
      validacao: false,
      totalImportadas: importadas.length,
      totalIgnoradas: ignoradas,
      erros: [...erros, ...errosDeGravacao],
      avisos,
      // A tela só mostra uma amostra; devolver 3 mil questões inteiras faria a
      // resposta pesar mais do que o arquivo enviado.
      questoesImportadas: importadas.slice(0, 50),
      hierarquiaCriada: criados,
      loteImportacaoId: importadas.length > 0 ? String(loteImportacaoId) : undefined,
    })
  } catch (error) {
    console.error('Erro ao importar questões:', error)
    return NextResponse.json({ error: 'Erro ao importar questões' }, { status: 500 })
  }
}
