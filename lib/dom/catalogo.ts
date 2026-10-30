import 'server-only'

/**
 * O que o Dom sabe da vitrine: os materiais de /materiais e os preços de /buy.
 *
 * - **Preços** (`precosAtuais`): os planos visíveis de `admin_settings.planos`,
 *   apresentados pelas MESMAS regras da /buy (`lib/buy/pricing.ts`) — o Dom
 *   nunca diz um número diferente do da página. Igual para todo mundo, então
 *   fica em `memoizarPorTempo` (5 min) e é invalidado por quem salva os planos
 *   (`app/api/admin/settings/planos`).
 * - **Materiais** (`materiaisDaMensagem`): busca pelos termos da mensagem em
 *   título, descrição e tags (só os visíveis), com teto curto e `maxTimeMS` —
 *   o modelo recebe só os 4 que importam para aquela pergunta, não o catálogo
 *   inteiro (tokens). Viram também destinos clicáveis ("vou te levar lá").
 */

import type { Db } from 'mongodb'
import { memoizarPorTempo } from '@/lib/cache-de-servidor'
import { normalizeAccountType, PLUS_TIER, QUEST_TIER } from '@/lib/account-tier'
import { apresentarPreco, linhaDeApoio, rotuloCurtoDePreco } from '@/lib/buy/pricing'
import { condicaoDeTexto } from '@/lib/busca-plataforma/mongo'
import type { PlanConfig } from '@/lib/types'
import { termosSignificativos, type CandidatoDeDestino } from './destinos'

export const CACHE_DOS_PRECOS = 'dom:planos'

export async function precosAtuais(db: Db): Promise<string[]> {
  return memoizarPorTempo(CACHE_DOS_PRECOS, 5 * 60_000, async () => {
    const settings = await db.collection('admin_settings').findOne({}, { projection: { planos: 1 } })
    const planos = ((settings?.planos || []) as PlanConfig[])
      .filter((p) => p && !p.oculto && Number(p.preco) > 0)
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
      .slice(0, 8)
    return planos.map((p) => {
      const cargo = normalizeAccountType(p.role || PLUS_TIER)
      const marca = cargo === QUEST_TIER ? 'Quest+' : cargo === PLUS_TIER ? 'Plus+' : String(p.nome || cargo)
      const preco = apresentarPreco({ preco: p.preco, precoOriginal: p.precoOriginal, durationMonths: p.durationMonths })
      const desconto = preco.ancora ? ` (de R$ ${preco.ancora.toFixed(2).replace('.', ',')}, ${preco.descontoPercentual}% off)` : ''
      return `${marca} · ${p.periodo || p.nome}: ${rotuloCurtoDePreco(preco)}${desconto} — ${linhaDeApoio(preco)}`
    })
  }).catch(() => [])
}

/** A mensagem fala de dinheiro/plano? Só então os preços entram no prompt (tokens). */
export function falaDePreco(texto: string): boolean {
  return /\b(pre[cç]o|valor|quanto|custa|plano|planos|assin|comprar|compra|pagar|pix|cart[aã]o|parcel|desconto|promo|plus|quest|mensal|anual|barato|caro)/i.test(texto)
}

export interface MaterialDoCatalogo {
  id: string
  titulo: string
  preco: string
  resumo: string
}

export async function materiaisDaMensagem(db: Db, texto: string, isAdmin: boolean): Promise<MaterialDoCatalogo[]> {
  const termos = termosSignificativos(texto).slice(0, 3)
  if (!termos.length) return []
  try {
    const condicoes: object[] = [condicaoDeTexto(['title', 'description', 'tags'], termos)]
    if (!isAdmin) condicoes.push({ isHidden: { $ne: true } })
    let docs = await db
      .collection('materials')
      .find({ $and: condicoes })
      .project({ title: 1, description: 1, pricing: 1, price: 1 })
      .limit(4)
      .maxTimeMS(1200)
      .toArray()
    // Nada com todos os termos: tenta pelo mais importante (o primeiro).
    if (!docs.length && termos.length > 1) {
      const so = [condicaoDeTexto(['title', 'description', 'tags'], [termos[0]]), ...(isAdmin ? [] : [{ isHidden: { $ne: true } }])]
      docs = await db.collection('materials').find({ $and: so }).project({ title: 1, description: 1, pricing: 1, price: 1 }).limit(4).maxTimeMS(1200).toArray()
    }
    return docs.map((d) => ({
      id: String(d._id),
      titulo: String(d.title || 'Material').slice(0, 90),
      preco: d.pricing === 'paid' && Number(d.price) > 0 ? `R$ ${Number(d.price).toFixed(2).replace('.', ',')}` : 'gratuito',
      resumo: String(d.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80),
    }))
  } catch {
    return []
  }
}

/** Os materiais achados viram destinos ("vou te levar lá") validados pela rota. */
export function materiaisComoDestinos(materiais: MaterialDoCatalogo[]): CandidatoDeDestino[] {
  return materiais.map((m) => ({ id: `material:${m.id}`, titulo: m.titulo, href: `/materiais/${m.id}`, exclusivo: false, resumo: `Material (${m.preco})` }))
}
