import type { EstudoCompleto, EstudoResumo, ItemDoEstudo, ItemDoManual } from './tipos'

/**
 * Regras do "Meu Estudo Integrado" — o estudo que o aluno monta juntando itens
 * de vários manuais.
 *
 * Puro: valida e transforma o que chega do cliente, sem tocar o banco. A rota
 * só lê, chama estas funções e grava. Assim cada teto e cada saneamento tem
 * teste sem Mongo.
 *
 * ## O que o banco guarda e o que ele NÃO guarda
 *
 * Guarda a `ref` de cada item (`tc:carcinoma-de-celulas-renais`), se foi
 * estudado e uma nota curta. Não guarda título nem endereço: esses vêm do
 * índice na hora de exibir. Duas razões. Um item renomeado no acervo aparece
 * com o nome novo em todos os estudos, sem migração. E o cliente nunca
 * consegue gravar um `href` arbitrário (um `javascript:` que outra tela
 * renderizasse como link) — a única forma de entrar num estudo é por uma ref
 * que o índice conhece.
 */

export const MAX_ESTUDOS_POR_USUARIO = 50
export const MAX_ITENS_POR_ESTUDO = 80
export const MAX_TITULO = 120
export const MAX_NOTA = 2000

const REF_VALIDA = /^[a-z][a-z-]*:[a-z0-9][a-z0-9/._-]{0,160}$/

export function refValida(ref: unknown): ref is string {
  return typeof ref === 'string' && REF_VALIDA.test(ref)
}

export function limparTitulo(valor: unknown): string | null {
  if (typeof valor !== 'string') return null
  const limpo = valor.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!limpo) return null
  return limpo.slice(0, MAX_TITULO)
}

export function limparNota(valor: unknown): string {
  if (typeof valor !== 'string') return ''
  return valor.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, MAX_NOTA)
}

/** Forma do item como fica no banco. */
export interface ItemGuardado {
  ref: string
  feito: boolean
  nota?: string
  adicionadoEm: Date
}

/**
 * Acrescenta refs ao estudo, na ordem dada, sem repetir o que já está nele e
 * só com refs que o índice conhece. Devolve também quantas ficaram de fora
 * pelo teto, para a interface avisar em vez de descartar em silêncio.
 */
export function acrescentarItens(
  atuais: ItemGuardado[],
  novas: unknown[],
  conhecida: (ref: string) => boolean,
  agora = new Date(),
): { itens: ItemGuardado[]; acrescentados: number; recusados: number } {
  const presentes = new Set(atuais.map((i) => i.ref))
  const itens = [...atuais]
  let acrescentados = 0
  let recusados = 0
  for (const ref of novas) {
    if (!refValida(ref) || !conhecida(ref) || presentes.has(ref)) continue
    if (itens.length >= MAX_ITENS_POR_ESTUDO) {
      recusados++
      continue
    }
    itens.push({ ref, feito: false, adicionadoEm: agora })
    presentes.add(ref)
    acrescentados++
  }
  return { itens, acrescentados, recusados }
}

export type Alteracao =
  | { acao: 'renomear'; titulo: unknown }
  | { acao: 'acrescentar'; refs: unknown }
  | { acao: 'remover'; ref: unknown }
  | { acao: 'marcar'; ref: unknown; feito: unknown }
  | { acao: 'anotar'; ref: unknown; nota: unknown }
  | { acao: 'trocar'; ref: unknown; com: unknown }

export type ResultadoDaAlteracao =
  | { ok: true; titulo?: string; itens: ItemGuardado[]; recusados?: number }
  | { ok: false; erro: string }

/** Aplica uma alteração pedida pelo cliente. Nunca lança: erro vira resposta. */
export function aplicarAlteracao(
  estado: { titulo: string; itens: ItemGuardado[] },
  pedido: unknown,
  conhecida: (ref: string) => boolean,
  agora = new Date(),
): ResultadoDaAlteracao {
  if (!pedido || typeof pedido !== 'object') return { ok: false, erro: 'Pedido inválido' }
  const p = pedido as Alteracao
  const itens = estado.itens

  switch (p.acao) {
    case 'renomear': {
      const titulo = limparTitulo(p.titulo)
      if (!titulo) return { ok: false, erro: 'Dê um nome ao estudo' }
      return { ok: true, titulo, itens }
    }
    case 'acrescentar': {
      if (!Array.isArray(p.refs)) return { ok: false, erro: 'Nada para acrescentar' }
      const r = acrescentarItens(itens, p.refs.slice(0, MAX_ITENS_POR_ESTUDO), conhecida, agora)
      return { ok: true, itens: r.itens, recusados: r.recusados }
    }
    case 'remover': {
      if (!refValida(p.ref)) return { ok: false, erro: 'Item inválido' }
      return { ok: true, itens: itens.filter((i) => i.ref !== p.ref) }
    }
    case 'marcar': {
      if (!refValida(p.ref) || typeof p.feito !== 'boolean') return { ok: false, erro: 'Item inválido' }
      return { ok: true, itens: itens.map((i) => (i.ref === p.ref ? { ...i, feito: p.feito as boolean } : i)) }
    }
    case 'anotar': {
      if (!refValida(p.ref)) return { ok: false, erro: 'Item inválido' }
      const nota = limparNota(p.nota)
      return {
        ok: true,
        itens: itens.map((i) => {
          if (i.ref !== p.ref) return i
          const { nota: _anterior, ...resto } = i
          return nota ? { ...resto, nota } : resto
        }),
      }
    }
    case 'trocar': {
      // A tela agrupa por etapa; "subir" um item é trocá-lo de lugar com o
      // vizinho da mesma etapa, que nem sempre é o vizinho na lista guardada.
      if (!refValida(p.ref) || !refValida(p.com)) return { ok: false, erro: 'Movimento inválido' }
      const a = itens.findIndex((i) => i.ref === p.ref)
      const b = itens.findIndex((i) => i.ref === p.com)
      if (a < 0 || b < 0 || a === b) return { ok: true, itens }
      const copia = [...itens]
      ;[copia[a], copia[b]] = [copia[b], copia[a]]
      return { ok: true, itens: copia }
    }
    default:
      return { ok: false, erro: 'Ação desconhecida' }
  }
}

/* ───────────────────────────── Serialização ───────────────────────────── */

export interface EstudoGuardado {
  _id: { toString(): string }
  titulo: string
  itens: ItemGuardado[]
  criadoEm: Date
  atualizadoEm: Date
}

export function resumirEstudo(doc: EstudoGuardado): EstudoResumo {
  return {
    id: doc._id.toString(),
    titulo: doc.titulo,
    total: doc.itens.length,
    feitos: doc.itens.filter((i) => i.feito).length,
    atualizadoEm: doc.atualizadoEm.toISOString(),
  }
}

/** O estudo para a tela: cada ref ganha título, tipo e endereço do índice. */
export function completarEstudo(
  doc: EstudoGuardado,
  resolver: (ref: string) => ItemDoManual | undefined,
): EstudoCompleto {
  const itens: ItemDoEstudo[] = doc.itens.map((i) => {
    const base: ItemDoEstudo = { ref: i.ref, feito: i.feito, adicionadoEm: i.adicionadoEm.toISOString() }
    if (i.nota) base.nota = i.nota
    const item = resolver(i.ref)
    if (item) {
      base.titulo = item.titulo
      base.tipo = item.tipo
      base.modulo = item.modulo
      base.etapa = item.etapa
      base.href = item.href
    }
    return base
  })
  return { ...resumirEstudo(doc), itens, criadoEm: doc.criadoEm.toISOString() }
}
