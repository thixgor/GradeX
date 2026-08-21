import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { COLECOES } from '@/lib/ensino/compatibilidade'
import {
  garantirIndicesDeEnsino,
  lerNos,
  podeEditarEnsino,
  contarAulasPorNo,
} from '@/lib/ensino/repositorio'
import {
  capasPorNo,
  gerarSlug,
  herdarCapas,
  normalizarCapa,
  slugUnico,
  validarNo,
  montarArvore,
} from '@/lib/ensino/taxonomia'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * A taxonomia do Ensino — Área → Módulo → Tópico → Subtópico.
 *
 * O GET é público de propósito: nomes de tópico não são conteúdo, são o mapa. O
 * cadeado mora nas aulas, e nenhuma delas sai por esta rota. Devolver a árvore
 * a visitante é o que permite a página de exploração (§14) existir antes do
 * login — e é ela que convence alguém a criar conta.
 *
 * A contagem de aulas vem junto porque a navegação sem número é uma lista de
 * pastas: "Cardiologia" sem "34 aulas" não diz se vale entrar.
 */
export async function GET(request: Request) {
  try {
    const db = await getDb()
    const parametros = new URL(request.url).searchParams
    const comContagem = parametros.get('contagem') !== '0'

    const [nos, aulas] = await Promise.all([
      lerNos(db),
      comContagem
        ? db
            .collection(COLECOES.aulas)
            .find(
              { oculta: { $ne: true }, 'ensino.tipo': { $ne: 'resumo' } },
              // `capa` entra na projeção para os nós herdarem ilustração das
              // próprias aulas (ver `herdarCapas`). É um campo pequeno — um
              // objeto com url e cor —, e ele é o que separa a navegação por
              // assunto de uma lista de pastas.
              { projection: { ensino: 1, capa: 1 } },
            )
            .sort({ criadoEm: -1 })
            .toArray()
        : Promise.resolve([]),
    ])

    const contagem = contarAulasPorNo(aulas as any)
    const arvore = herdarCapas(montarArvore(nos, contagem), capasPorNo(aulas as any))

    return NextResponse.json(
      { nos, arvore },
      { headers: { 'Cache-Control': 'private, max-age=30' } },
    )
  } catch (erro) {
    console.error('[ensino/taxonomia] GET:', erro)
    return NextResponse.json({ error: 'Erro ao carregar a taxonomia' }, { status: 500 })
  }
}

/**
 * Cria um nó.
 *
 * A validação de onde ele pode entrar é a mesma função que a tela usa
 * (`validarNo`), rodada de novo aqui: a checagem do navegador é conveniência, e
 * um POST direto não pode plantar um subtópico órfão — que seria conteúdo
 * invisível para sempre.
 */
export async function POST(request: Request) {
  try {
    const db = await getDb()
    const sessao = await getSession()
    if (!(await podeEditarEnsino(db, sessao as any))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const corpo = await request.json()
    const paiId = corpo?.paiId ? String(corpo.paiId) : null

    const pai =
      paiId && ObjectId.isValid(paiId)
        ? await db.collection(COLECOES.nos).findOne({ _id: new ObjectId(paiId) })
        : null

    const problemas = validarNo(
      { nome: corpo?.nome, nivel: corpo?.nivel, paiId },
      pai ? ({ nivel: pai.nivel } as any) : null,
    )
    if (problemas.length > 0) {
      return NextResponse.json({ error: problemas[0].mensagem, problemas }, { status: 400 })
    }

    const usados = await db
      .collection(COLECOES.nos)
      .find({}, { projection: { slug: 1 } })
      .toArray()

    // A ordem padrão é "no fim dos irmãos": um nó novo aparecendo no meio da
    // lista faria o admin procurar o que ele acabou de criar.
    const ultimo = await db
      .collection(COLECOES.nos)
      .find({ paiId })
      .sort({ ordem: -1 })
      .limit(1)
      .toArray()

    const documento = {
      nivel: corpo.nivel,
      paiId,
      nome: String(corpo.nome).trim().slice(0, 160),
      slug: slugUnico(
        gerarSlug(corpo.slug || corpo.nome),
        usados.map((u: any) => u.slug),
      ),
      descricao: corpo.descricao ? String(corpo.descricao).trim().slice(0, 600) : undefined,
      cor: typeof corpo.cor === 'string' ? corpo.cor.slice(0, 16) : undefined,
      capa: normalizarCapa(corpo.capa),
      ordem: Number.isFinite(Number(corpo.ordem))
        ? Number(corpo.ordem)
        : (ultimo[0]?.ordem || 0) + 1,
      oculto: corpo.oculto === true,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    }

    const resultado = await db.collection(COLECOES.nos).insertOne(documento as any)
    await garantirIndicesDeEnsino(db)

    return NextResponse.json({ no: { ...documento, _id: String(resultado.insertedId) } })
  } catch (erro) {
    console.error('[ensino/taxonomia] POST:', erro)
    return NextResponse.json({ error: 'Erro ao criar o nível' }, { status: 500 })
  }
}

/**
 * Reordena vários nós de uma vez.
 *
 * Arrastar e soltar produz uma lista inteira nova, não uma edição por item.
 * Mandar um PATCH por nó a cada solta faria dez requisições para uma
 * reorganização de dez itens — e uma delas falhando deixaria a ordem
 * inconsistente.
 */
export async function PUT(request: Request) {
  try {
    const db = await getDb()
    const sessao = await getSession()
    if (!(await podeEditarEnsino(db, sessao as any))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const corpo = await request.json()
    const ordens: Array<{ id: string; ordem: number; paiId?: string | null }> = Array.isArray(
      corpo?.ordens,
    )
      ? corpo.ordens
      : []

    const operacoes = ordens
      .filter((o) => ObjectId.isValid(String(o.id)))
      .slice(0, 500)
      .map((o) => ({
        updateOne: {
          filter: { _id: new ObjectId(String(o.id)) },
          update: {
            $set: {
              ordem: Number(o.ordem) || 0,
              ...(o.paiId !== undefined ? { paiId: o.paiId ? String(o.paiId) : null } : {}),
              atualizadoEm: new Date(),
            },
          },
        },
      }))

    if (operacoes.length > 0) {
      await db.collection(COLECOES.nos).bulkWrite(operacoes as any)
    }

    return NextResponse.json({ atualizados: operacoes.length })
  } catch (erro) {
    console.error('[ensino/taxonomia] PUT:', erro)
    return NextResponse.json({ error: 'Erro ao reordenar' }, { status: 500 })
  }
}
