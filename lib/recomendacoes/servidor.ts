/**
 * Carrega o que o motor (lib/recomendacoes/motor.ts) precisa: o catálogo
 * visível e as cestas de compra.
 *
 * O modelo é o mesmo para todo mundo — catálogo e co-compra não dependem de
 * quem pergunta —, então é montado uma vez por instância a cada
 * `TTL_DO_MODELO_MS` (`memoizarPorTempo`). A janela é maior que a das outras
 * memórias do projeto de propósito: recomendação não precisa refletir a venda
 * do último minuto, e montar o modelo agrega a coleção de compras inteira.
 *
 * O que depende da pessoa (o que ela já tem, os grupos da conta) é lido a
 * cada requisição, numa consulta indexada, em `contextoDaPessoa`.
 */

import type { Db } from 'mongodb'
import { ObjectId } from 'mongodb'
import { memoizarPorTempo } from '../cache-de-servidor'
import { chaveDe, construirModelo, type Cesta, type ItemDoCatalogo, type ModeloDeRecomendacao } from './motor'

export const TTL_DO_MODELO_MS = 30 * 60_000

async function montarModelo(db: Db): Promise<ModeloDeRecomendacao> {
  const [materiais, pacotes, cestas] = await Promise.all([
    db.collection('materials')
      .find({ isHidden: { $ne: true } })
      .project({
        title: 1, tags: 1, folderId: 1, moduloId: 1, type: 1, pricing: 1, price: 1,
        coverImage: 1, isFeatured: 1, downloadCount: 1, viewCount: 1, allowedGroups: 1,
      })
      .toArray(),
    db.collection('material_packages')
      .find({ isHidden: { $ne: true } })
      .project({
        title: 1, tags: 1, materialIds: 1, pricing: 1, price: 1, coverImage: 1,
        isFeatured: 1, downloadCount: 1, viewCount: 1, allowedGroups: 1,
      })
      .toArray(),
    // Uma cesta por pessoa: tudo o que ela tem hoje, comprado ou resgatado.
    db.collection('material_purchases')
      .aggregate<{ itens: string[] }>([
        { $match: { status: 'completed', itemType: { $in: ['material', 'package'] }, userId: { $nin: [null, ''] } } },
        {
          $group: {
            _id: '$userId',
            itens: { $addToSet: { $concat: ['$itemType', ':', { $toString: '$itemId' }] } },
          },
        },
        { $project: { _id: 0, itens: 1 } },
      ], { allowDiskUse: true })
      .toArray(),
  ])

  const catalogo: ItemDoCatalogo[] = [
    ...materiais.map((m: any): ItemDoCatalogo => ({
      itemType: 'material',
      itemId: String(m._id),
      titulo: m.title || 'Material',
      tags: Array.isArray(m.tags) ? m.tags.map(String) : [],
      folderId: m.folderId ? String(m.folderId) : null,
      moduloId: m.moduloId ? String(m.moduloId) : null,
      tipo: m.type || null,
      pago: m.pricing === 'paid' && Number(m.price) > 0,
      preco: m.pricing === 'paid' ? Math.max(0, Number(m.price || 0)) : 0,
      capa: m.coverImage || null,
      destaque: m.isFeatured === true,
      interesse: Number(m.downloadCount || 0) + Number(m.viewCount || 0) / 10,
      grupos: Array.isArray(m.allowedGroups) ? m.allowedGroups.map(String) : [],
    })),
    ...pacotes.map((p: any): ItemDoCatalogo => ({
      itemType: 'package',
      itemId: String(p._id),
      titulo: p.title || 'Pacote',
      tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
      materialIds: Array.isArray(p.materialIds) ? p.materialIds.map(String) : [],
      pago: p.pricing === 'paid' && Number(p.price) > 0,
      preco: p.pricing === 'paid' ? Math.max(0, Number(p.price || 0)) : 0,
      capa: p.coverImage || null,
      destaque: p.isFeatured === true,
      interesse: Number(p.downloadCount || 0) + Number(p.viewCount || 0) / 10,
      grupos: Array.isArray(p.allowedGroups) ? p.allowedGroups.map(String) : [],
    })),
  ]

  return construirModelo(catalogo, cestas.map((c) => c.itens as Cesta))
}

export function carregarModelo(db: Db): Promise<ModeloDeRecomendacao> {
  return memoizarPorTempo('recomendacoes:modelo', TTL_DO_MODELO_MS, () => montarModelo(db))
}

export interface ContextoDaPessoa {
  possuidos: Set<string>
  materiaisPossuidos: Set<string>
  grupos: string[]
}

/** O que a pessoa já tem e em que grupos a conta está. */
export async function contextoDaPessoa(
  db: Db,
  modelo: ModeloDeRecomendacao,
  userId: string
): Promise<ContextoDaPessoa> {
  const [compras, usuario] = await Promise.all([
    db.collection('material_purchases')
      .find({ userId, status: 'completed', itemType: { $in: ['material', 'package'] } })
      .project({ itemType: 1, itemId: 1 })
      .toArray(),
    ObjectId.isValid(userId)
      ? db.collection('users').findOne(
          { _id: new ObjectId(userId) },
          { projection: { accountType: 1, secondaryRole: 1 } }
        )
      : Promise.resolve(null),
  ])

  const possuidos = new Set<string>()
  const materiaisPossuidos = new Set<string>()
  for (const compra of compras as any[]) {
    const itemId = String(compra.itemId)
    possuidos.add(chaveDe(compra.itemType, itemId))
    if (compra.itemType === 'material') materiaisPossuidos.add(itemId)
    else for (const id of modelo.itens.get(chaveDe('package', itemId))?.materialIds || []) materiaisPossuidos.add(id)
  }

  const grupos: string[] = []
  if (usuario?.accountType) grupos.push(String(usuario.accountType))
  if (usuario?.secondaryRole === 'monitor') grupos.push('monitor')
  return { possuidos, materiaisPossuidos, grupos }
}
