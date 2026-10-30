import 'server-only'

/**
 * O Dom usando os dois algoritmos da casa, em vez de adivinhar:
 *
 * - **Busca da plataforma** (`conteudoDaBusca`): as mesmas fontes, filtros de
 *   acesso e ranqueamento da caixa de busca (`lib/busca-plataforma/conteudo`).
 *   O Dom acha o que a busca acharia — patologia, fármaco, aula, deck, mapa,
 *   calculadora, pacote — e cada achado vira destino clicável.
 * - **"Quem estuda isto também leva"** (`sugestoesDeCompra`): o motor de
 *   recomendação das páginas de material (`lib/recomendacoes`), semeado pelo
 *   material que apareceu na conversa (ou pela última compra, quando o aluno
 *   pede indicação). Sai já sem o que a pessoa tem e respeitando os grupos.
 *
 * Tokens: o modelo recebe no máximo 5 achados e 3 sugestões, uma linha cada.
 */

import type { Db } from 'mongodb'
import { buscarConteudo } from '@/lib/busca-plataforma/conteudo'
import { chaveDe, recomendar, type Recomendacao } from '@/lib/recomendacoes/motor'
import { carregarModelo, contextoDaPessoa } from '@/lib/recomendacoes/servidor'
import { hrefInternoSeguro, termosSignificativos, type CandidatoDeDestino } from './destinos'

const LIMITE_DE_ACHADOS = 5
const LIMITE_DE_SUGESTOES = 3

/** Achados da busca da plataforma, já como destinos. Materiais ficam de fora: vêm com preço por `materiaisDaMensagem`. */
export async function conteudoDaBusca(
  db: Db,
  mensagem: string,
  quem: { userId: string; isAdmin: boolean },
): Promise<CandidatoDeDestino[]> {
  const termos = termosSignificativos(mensagem).slice(0, 4)
  if (!termos.length) return []
  try {
    const { itens } = await buscarConteudo({ db, userId: quem.userId, isAdmin: quem.isAdmin, termos }, termos.join(' '), 12)
    const destinos: CandidatoDeDestino[] = []
    for (const item of itens) {
      if (item.etiqueta === 'Material') continue
      const href = hrefInternoSeguro(item.href)
      if (!href) continue
      destinos.push({
        id: `busca:${destinos.length + 1}`,
        titulo: item.titulo.slice(0, 90),
        href,
        exclusivo: false,
        resumo: [item.etiqueta, item.subtitulo?.slice(0, 70)].filter(Boolean).join(': ') || undefined,
      })
      if (destinos.length >= LIMITE_DE_ACHADOS) break
    }
    return destinos
  } catch {
    return []
  }
}

/** O aluno pede indicação do que estudar/comprar? Só então a última compra vira semente. */
export function pedeRecomendacao(texto: string): boolean {
  return /\b(recomend|indic|sugest|sugere|o que (eu )?(compro|comprar|levo|levar|estudo|estudar)|vale a pena|outros (compram|levam|estudam)|tamb[eé]m (compram|levam)|combina com|junto com)/i.test(texto)
}

export interface SugestaoDeCompra {
  titulo: string
  preco: string
  motivo: string
  destino: CandidatoDeDestino
}

function precoDe(r: Recomendacao): string {
  return r.pago && r.preco > 0 ? `R$ ${r.preco.toFixed(2).replace('.', ',')}` : 'gratuito'
}

/**
 * Sugestões do motor de co-compra. `sementes` são ids de materiais citados na
 * conversa; sem eles, só roda se `pediu` (usa a última compra da pessoa).
 */
export async function sugestoesDeCompra(
  db: Db,
  userId: string,
  { sementes, pediu }: { sementes: string[]; pediu: boolean },
): Promise<SugestaoDeCompra[]> {
  if (!sementes.length && !pediu) return []
  try {
    const modelo = await carregarModelo(db)
    const pessoa = await contextoDaPessoa(db, modelo, userId)
    const candidatas = sementes.map((id) => chaveDe('material', id)).filter((c) => modelo.itens.has(c))
    // Sem material na conversa: o que a pessoa comprou por último (a ordem do Set é a da consulta).
    if (!candidatas.length) candidatas.push(...[...pessoa.possuidos].reverse().filter((c) => modelo.itens.has(c)).slice(0, 1))
    const semente = candidatas[0]
    if (!semente) return []
    const recomendadas = recomendar(modelo, semente, {
      limite: LIMITE_DE_SUGESTOES,
      possuidos: pessoa.possuidos,
      materiaisPossuidos: pessoa.materiaisPossuidos,
      grupos: pessoa.grupos,
      excluir: new Set(candidatas),
    })
    return recomendadas.map((r, i) => {
      const href = r.itemType === 'package' ? `/pacotes/${r.itemId}` : `/materiais/${r.itemId}`
      const tipo = r.itemType === 'package' ? `Pacote${r.totalDeMateriais ? ` com ${r.totalDeMateriais} materiais` : ''}` : 'Material'
      return {
        titulo: r.titulo.slice(0, 90),
        preco: precoDe(r),
        motivo: r.motivo,
        destino: { id: `leva:${i + 1}`, titulo: r.titulo.slice(0, 90), href, exclusivo: false, resumo: `${tipo} (${precoDe(r)}) · ${r.motivo}` },
      }
    })
  } catch {
    return []
  }
}
