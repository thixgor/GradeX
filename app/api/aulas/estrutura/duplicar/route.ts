import { NextRequest, NextResponse } from 'next/server'
import { ObjectId, type Db } from 'mongodb'
import { z } from 'zod'
import { secureApiEndpoint, isValidObjectId } from '@/lib/api-security'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Duplicar uma estrutura inteira (§29).
 *
 * Duplicar uma aula já existia. O que faltava é o caso que consome tempo de
 * verdade: "esta turma é igual à do ano passado, só mudam as datas". Copiar um
 * módulo de trinta aulas na mão são trinta cliques em "duplicar" e trinta
 * correções de vínculo — e basta errar um para a aula nascer no curso errado.
 *
 * Três decisões que valem explicação:
 *
 *  • **a cópia nasce oculta.** Uma duplicata publicada no instante do clique
 *    apareceria na biblioteca do aluno com o conteúdo antigo e o nome
 *    "(Cópia)". Quem duplica, duplica para editar depois;
 *  • **progresso, comentários e conclusões ficam para trás.** São dados de
 *    pessoas sobre a aula original; copiá-los daria a alunos um histórico numa
 *    aula que nunca abriram;
 *  • **vínculo com /materiais é copiado.** Ele é uma referência, não conteúdo:
 *    a cópia aponta para o mesmo material, sem duplicar nada lá (§6).
 */

const TIPOS = ['setor', 'topico', 'subtopico', 'modulo', 'submodulo'] as const
type TipoDeNo = (typeof TIPOS)[number]

/** Nome do campo de vínculo de cada tipo dentro dos outros documentos. */
const CAMPO_DE_VINCULO: Record<TipoDeNo, string> = {
  setor: 'setorId',
  topico: 'topicoId',
  subtopico: 'subtopicoId',
  modulo: 'moduloId',
  submodulo: 'submoduloId',
}

const COLECAO: Record<TipoDeNo | 'aula', string> = {
  setor: 'aulas_setores',
  topico: 'aulas_topicos',
  subtopico: 'aulas_subtopicos',
  modulo: 'aulas_modulos',
  submodulo: 'aulas_submodulos',
  aula: 'aulas_postagens',
}

/** Teto de segurança: duplicar não pode virar uma escrita sem fim. */
const MAX_NOS = 2000

const Schema = z.object({
  tipo: z.enum(TIPOS),
  id: z.string().min(1),
  sufixo: z.string().max(40).optional(),
})

type Doc = Record<string, any>

export async function POST(request: NextRequest) {
  const security = await secureApiEndpoint(request, {
    rateLimit: 'WRITE',
    auth: {
      requireAuth: true,
      allowedRoles: ['admin'],
      allowSecondaryRoles: ['monitor'],
    },
  })
  if (!security.success || security.errorResponse) return security.errorResponse

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  const { tipo, id } = parsed.data
  const sufixo = (parsed.data.sufixo || '(Cópia)').trim() || '(Cópia)'
  if (!isValidObjectId(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  try {
    const db = await getDb()

    const raiz = await db.collection(COLECAO[tipo]).findOne({ _id: new ObjectId(id) })
    if (!raiz) return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })

    const subarvore = await coletarSubarvore(db, tipo, id)
    const total =
      subarvore.aulas.length +
      TIPOS.reduce((soma, t) => soma + subarvore.nos[t].length, 0)

    if (total > MAX_NOS) {
      return NextResponse.json(
        { error: `Estrutura grande demais para duplicar de uma vez (${total} itens).` },
        { status: 413 },
      )
    }

    const resultado = await gravarCopias(db, subarvore, tipo, id, sufixo)
    return NextResponse.json({ success: true, ...resultado })
  } catch (error) {
    console.error('[aulas/estrutura/duplicar] erro:', error)
    return NextResponse.json({ error: 'Erro ao duplicar a estrutura' }, { status: 500 })
  }
}

interface Subarvore {
  nos: Record<TipoDeNo, Doc[]>
  aulas: Doc[]
}

/**
 * Coleta tudo que pende do nó escolhido.
 *
 * A regra é uma só, e é o que mantém isto simples: **um documento pertence à
 * subárvore se algum dos seus campos de vínculo aponta para um nó já coletado.**
 * Descer nível a nível com uma função por tipo daria cinco caminhos quase
 * iguais e cinco lugares para esquecer um caso.
 *
 * O conjunto começa só com a raiz, e é por isso que duplicar um tópico não
 * arrasta os irmãos: o `setorId` do tópico não está no conjunto, então nada é
 * puxado por ele.
 */
async function coletarSubarvore(db: Db, tipo: TipoDeNo, id: string): Promise<Subarvore> {
  const nos: Record<TipoDeNo, Doc[]> = {
    setor: [],
    topico: [],
    subtopico: [],
    modulo: [],
    submodulo: [],
  }
  const ids: Record<TipoDeNo, string[]> = {
    setor: [],
    topico: [],
    subtopico: [],
    modulo: [],
    submodulo: [],
  }

  const raiz = await db.collection(COLECAO[tipo]).findOne({ _id: new ObjectId(id) })
  if (raiz) {
    nos[tipo].push(raiz)
    ids[tipo].push(id)
  }

  /** Condições "campo ∈ ids coletados" para os tipos que já têm conteúdo. */
  function filtroDeDescendencia(): Doc | null {
    const clausulas = TIPOS.filter((t) => ids[t].length > 0).map((t) => ({
      [CAMPO_DE_VINCULO[t]]: { $in: ids[t] },
    }))
    return clausulas.length > 0 ? { $or: clausulas } : null
  }

  // A ordem importa: cada nível só pode ser buscado depois que o de cima já
  // encheu o conjunto de ids.
  const descida: TipoDeNo[] = ['topico', 'subtopico', 'modulo', 'submodulo']
  for (const nivel of descida) {
    if (nivel === tipo) continue
    const filtro = filtroDeDescendencia()
    if (!filtro) break
    const encontrados = await db.collection(COLECAO[nivel]).find(filtro).limit(MAX_NOS).toArray()
    // Evita recoletar a própria raiz quando ela é deste nível.
    for (const doc of encontrados) {
      const docId = String(doc._id)
      if (ids[nivel].includes(docId)) continue
      nos[nivel].push(doc)
      ids[nivel].push(docId)
    }
  }

  const filtroAulas = filtroDeDescendencia()
  const aulas = filtroAulas
    ? await db.collection(COLECAO.aula).find(filtroAulas).limit(MAX_NOS).toArray()
    : []

  return { nos, aulas }
}

/**
 * Grava as cópias com os vínculos reapontados.
 *
 * O mapa `id antigo → id novo` é o coração disto. Sem ele os filhos copiados
 * continuariam apontando para os pais originais, e a cópia inteira apareceria
 * dentro do curso de origem — o erro clássico de duplicar árvore.
 *
 * Vínculo que **não** está no mapa é preservado: é assim que a cópia de um
 * tópico continua morando no mesmo setor.
 */
async function gravarCopias(
  db: Db,
  subarvore: Subarvore,
  tipoRaiz: TipoDeNo,
  idRaiz: string,
  sufixo: string,
) {
  const agora = new Date()
  const mapa = new Map<string, string>()

  for (const tipo of TIPOS) {
    for (const doc of subarvore.nos[tipo]) {
      mapa.set(String(doc._id), String(new ObjectId()))
    }
  }

  function reapontar(doc: Doc): Doc {
    const vinculos: Doc = {}
    for (const tipo of TIPOS) {
      const campo = CAMPO_DE_VINCULO[tipo]
      const atual = doc[campo]
      if (!atual) continue
      vinculos[campo] = mapa.get(String(atual)) || String(atual)
    }
    return vinculos
  }

  function clonar(doc: Doc, extras: Doc): Doc {
    const { _id, ...resto } = doc
    return {
      ...resto,
      ...reapontar(doc),
      ...extras,
      // A cópia nasce fora do ar. Publicar é uma decisão separada de duplicar.
      oculta: true,
      criadoEm: agora,
      atualizadoEm: agora,
    }
  }

  for (const tipo of TIPOS) {
    const docs = subarvore.nos[tipo]
    if (docs.length === 0) continue

    const copias = docs.map((doc) => {
      const novoId = new ObjectId(mapa.get(String(doc._id)) as string)
      const ehRaiz = tipo === tipoRaiz && String(doc._id) === idRaiz
      return clonar(doc, {
        _id: novoId,
        nome: ehRaiz ? `${doc.nome} ${sufixo}` : doc.nome,
      })
    })

    await db.collection(COLECAO[tipo]).insertMany(copias as any[], { ordered: false })
  }

  if (subarvore.aulas.length > 0) {
    const copias = subarvore.aulas.map((aula) =>
      clonar(aula, {
        _id: new ObjectId(),
        // Histórico de gente não se copia: comentários e conclusões pertencem
        // à aula original.
        comentarios: [],
        usuariosConcluidos: [],
      }),
    )
    await db.collection(COLECAO.aula).insertMany(copias as any[], { ordered: false })
  }

  return {
    id: mapa.get(idRaiz),
    aulasCopiadas: subarvore.aulas.length,
    nosCopiados: mapa.size,
  }
}
