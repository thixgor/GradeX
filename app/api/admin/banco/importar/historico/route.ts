import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

/**
 * Histórico de importações: uma linha por leva (arquivo TXT importado).
 *
 * Não existe uma coleção própria para isto — a leva é reconstruída agrupando
 * `banco_questoes` pelo `loteImportacaoId` que a rota de importação grava em
 * cada questão (ver app/api/admin/banco/importar/route.ts). Isso mantém o
 * histórico sempre consistente com o que de fato existe: uma leva que já foi
 * total ou parcialmente apagada aparece com a contagem que sobrou (ou some,
 * se não sobrou nada), em vez de um registro "fantasma" apontando para
 * questões que não existem mais.
 *
 * Só leva questão de arquivo TXT feita depois desta mudança: questões
 * criadas manualmente, editadas na tela ou trazidas pelo importador de
 * provas nunca tiveram (e não passam a ter) `loteImportacaoId`.
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const db = await getDb()

    const grupos = await db
      .collection('banco_questoes')
      .aggregate([
        { $match: { loteImportacaoId: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: '$loteImportacaoId',
            quantidade: { $sum: 1 },
            objetivas: { $sum: { $cond: [{ $eq: ['$tipo', 'objetiva'] }, 1, 0] } },
            discursivas: { $sum: { $cond: [{ $eq: ['$tipo', 'discursiva'] }, 1, 0] } },
            criadoEm: { $min: '$createdAt' },
            criadoPor: { $first: '$createdBy' },
            moduloIds: { $addToSet: '$moduloId' },
          },
        },
        { $sort: { criadoEm: -1 } },
        { $limit: 200 },
      ])
      .toArray()

    if (grupos.length === 0) {
      return NextResponse.json({ lotes: [] })
    }

    const moduloIds = [...new Set(grupos.flatMap((g) => g.moduloIds.map((id: ObjectId) => String(id))))].map(
      (id) => new ObjectId(id),
    )
    const criadoPorIds = [...new Set(grupos.map((g) => String(g.criadoPor)).filter(Boolean))].map(
      (id) => new ObjectId(id),
    )

    const [modulos, usuarios] = await Promise.all([
      db
        .collection('banco_modulos')
        .find({ _id: { $in: moduloIds } }, { projection: { nome: 1 } })
        .toArray(),
      criadoPorIds.length > 0
        ? db
            .collection('users')
            .find({ _id: { $in: criadoPorIds } }, { projection: { name: 1, email: 1 } })
            .toArray()
        : Promise.resolve([]),
    ])

    const nomeDoModulo = new Map(modulos.map((m: any) => [String(m._id), m.nome as string]))
    const nomeDoUsuario = new Map(usuarios.map((u: any) => [String(u._id), (u.name || u.email) as string]))

    const lotes = grupos.map((g) => ({
      loteId: String(g._id),
      criadoEm: g.criadoEm,
      criadoPorNome: g.criadoPor ? nomeDoUsuario.get(String(g.criadoPor)) : undefined,
      quantidade: g.quantidade as number,
      objetivas: g.objetivas as number,
      discursivas: g.discursivas as number,
      modulos: (g.moduloIds as ObjectId[])
        .map((id) => nomeDoModulo.get(String(id)))
        .filter((n): n is string => !!n)
        .sort(),
    }))

    return NextResponse.json({ lotes })
  } catch (error) {
    console.error('Erro ao buscar histórico de importações:', error)
    return NextResponse.json({ error: 'Erro ao buscar histórico de importações' }, { status: 500 })
  }
}
