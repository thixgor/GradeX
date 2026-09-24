/**
 * A chamada do Plus+ dentro dos checkouts de compra avulsa.
 *
 * ## Por que existe
 *
 * Boa parte de quem compra material, flashcard, pacote ou o Manual Clínico
 * avulso nunca soube que o Plus+ existe — e o Plus+ Semestral libera tudo isso
 * junto. O checkout é o momento em que a pessoa já decidiu gastar: é ali que a
 * comparação "isto aqui sozinho" × "a plataforma inteira" pesa.
 *
 * ## As três regras que não podem quebrar
 *
 * 1. **Quem já é Plus+ não vê nada.** Nem banner, nem linha. Oferecer ao
 *    assinante o que ele já paga é ruído e desconfiança.
 * 2. **Quest+ vê upgrade, não "assine".** Ele já paga uma fatia; a conversa é
 *    "leve o resto".
 * 3. **Nada é prometido que o plano não entrega.** A lista do que entra sai das
 *    permissões modulares do próprio plano (`lib/plan-entitlements.ts`) e da
 *    chave `includedInPlus` do Manual — se o admin fechou uma área, ela some da
 *    oferta, e se a área que a pessoa está comprando não entra no plano, a
 *    oferta inteira some daquela tela.
 *
 * Este arquivo é isomórfico: só tipos e funções puras. Quem lê o banco é
 * `app/api/plus/oferta/route.ts`; quem desenha é
 * `components/checkout/plus-upsell.tsx`.
 */

import { normalizeAccountType, PLUS_TIER, QUEST_TIER } from './account-tier'
import {
  normalizePlanPermissions,
  type ManualClinicoModuleKey,
  type PlanFeatureKey,
  type PlanPermissions,
} from './plan-entitlements'

// ─── Plano da oferta ──────────────────────────────────────────────────────────

/** O pedaço de `PlanConfig` que a oferta usa. */
export interface PlanoParaOferta {
  tipo: string
  nome?: string
  periodo?: string
  preco: number
  precoOriginal?: number
  durationMonths?: number
  role?: string | null
  oculto?: boolean
  destaque?: boolean
  permissoes?: Partial<PlanPermissions> | null
}

/**
 * Cargo que o plano concede.
 *
 * Plano sem `role` vale Plus+ — é o que `resolveSerialKeyProduct` faz na
 * compra sem login, e é o padrão do editor de planos.
 */
export function cargoDoPlano(plano: Pick<PlanoParaOferta, 'role'> | null | undefined): string {
  return normalizeAccountType(plano?.role || PLUS_TIER)
}

/**
 * O plano oferecido: o **Semestral** do Plus+.
 *
 * Procura pelo `tipo` e, se o admin renomeou, pela duração de 6 meses. Na
 * falta dos dois, cai no Plus+ em destaque e depois no primeiro visível —
 * melhor oferecer outro ciclo do Plus+ do que esconder a oferta porque o
 * catálogo mudou de nome. Plano oculto ou sem preço nunca entra: a oferta
 * não pode levar a um checkout que recusa o plano.
 */
export function escolherPlanoDaOferta<T extends PlanoParaOferta>(planos: T[] | null | undefined): T | null {
  const candidatos = (planos || []).filter(
    (p) => p && !p.oculto && cargoDoPlano(p) === PLUS_TIER && Number(p.preco) > 0,
  )
  return (
    candidatos.find((p) => p.tipo === 'semestral') ||
    candidatos.find((p) => Number(p.durationMonths) === 6) ||
    candidatos.find((p) => p.destaque) ||
    candidatos[0] ||
    null
  )
}

// ─── O que entra ──────────────────────────────────────────────────────────────

export type ChaveDoItem =
  | 'materiais'
  | 'flashcards'
  | 'anatomia3d'
  | 'histologia'
  | 'semiologia'
  | 'radiologia'
  | 'farmacologia'
  | 'patologias'
  | 'ferramentas'
  | 'exames'
  | 'eletro'
  | 'bancoQuestoes'
  | 'provasPdf'
  | 'provasIa'

export interface ItemDaOferta {
  chave: ChaveDoItem
  rotulo: string
  /** Os "e ainda" — entram numa linha só, depois da lista principal. */
  extra?: boolean
}

type Origem =
  | { area: PlanFeatureKey }
  | { modulo: ManualClinicoModuleKey }

/**
 * A ordem é a do pitch: o que a pessoa está comprando avulso vem primeiro
 * (materiais e flashcards), depois os manuais, depois o resto.
 */
const CATALOGO: Array<ItemDaOferta & Origem> = [
  { chave: 'materiais', rotulo: 'Todos os materiais da plataforma', area: 'materiais' },
  { chave: 'flashcards', rotulo: 'Todos os flashcards', area: 'materiais' },
  { chave: 'anatomia3d', rotulo: 'Manual de Anatomia cadavérica e 3D', modulo: 'anatomia3d' },
  { chave: 'histologia', rotulo: 'Manual de Histologia interativo', modulo: 'histologia' },
  { chave: 'semiologia', rotulo: 'Manual de Semiologia', modulo: 'semiologia' },
  { chave: 'radiologia', rotulo: 'Manual de Radiologia', modulo: 'radiologia' },
  { chave: 'farmacologia', rotulo: 'Manual de Farmacologia', modulo: 'farmacologia' },
  { chave: 'patologias', rotulo: 'Manual Patológico', modulo: 'patologias' },
  { chave: 'ferramentas', rotulo: 'Ferramentas clínicas', modulo: 'ferramentas' },
  { chave: 'exames', rotulo: 'Exames laboratoriais', modulo: 'exames' },
  { chave: 'eletro', rotulo: 'Manual do Eletrocardiograma', modulo: 'eletro', extra: true },
  { chave: 'bancoQuestoes', rotulo: 'Banco de Questões', area: 'bancoQuestoes', extra: true },
  { chave: 'provasPdf', rotulo: 'Provas em PDF', area: 'provasPdf', extra: true },
  { chave: 'provasIa', rotulo: 'Provas com IA', area: 'provasIa', extra: true },
]

/**
 * O que o plano libera de verdade.
 *
 * Com as permissões desligadas (`ativo: false`, o estado de todo plano
 * antigo) o plano vale o cargo, e o Plus+ vale tudo. Ligadas, cada área e
 * cada módulo do Manual respondem por si. Os módulos do Manual dependem ainda
 * de o Manual estar incluso no Plus+ (`includedInPlus`, config do produto).
 */
export function itensInclusos(
  plano: Pick<PlanoParaOferta, 'permissoes'>,
  opcoes: { manualIncluidoNoPlus: boolean },
): ItemDaOferta[] {
  const permissoes = plano.permissoes ? normalizePlanPermissions(plano.permissoes) : null
  const modulado = !!permissoes?.ativo
  const areaLiberada = (area: PlanFeatureKey) => !modulado || !!permissoes!.regras[area]?.liberado
  const manualLiberado = opcoes.manualIncluidoNoPlus && areaLiberada('manualClinico')

  return CATALOGO.filter((item) => {
    if ('area' in item) return areaLiberada(item.area)
    return manualLiberado && (!modulado || !!permissoes!.manualClinicoModulos[item.modulo])
  }).map(({ chave, rotulo, extra }) => (extra ? { chave, rotulo, extra } : { chave, rotulo }))
}

// ─── Quem está olhando ────────────────────────────────────────────────────────

/**
 * - `visitante`: sem sessão (compra por Serial Key).
 * - `gratuito`: conta sem cargo pago vigente (inclui trial e Plus+ vencido).
 * - `quest`: Quest+ vigente.
 * - `plus`: Plus+ vigente, ou admin.
 * - `outro`: cargo pago criado pelo admin — não sabemos o que ele cobre, então
 *   não interferimos.
 */
export type PerfilDoComprador = 'visitante' | 'gratuito' | 'quest' | 'plus' | 'outro'

/** O que o checkout está vendendo — muda o argumento e a cobertura exigida. */
export type ContextoDaOferta =
  | 'material'
  | 'flashcard'
  | 'pacote'
  | 'carrinho'
  | 'manual_clinico'
  | 'plano'

export type ModoDaOferta = 'nenhuma' | 'oferta' | 'upgrade'

/**
 * A área que precisa estar no Plus+ para a oferta fazer sentido nesta tela.
 *
 * Se a pessoa compra um material e o plano não libera materiais, "leve tudo"
 * seria mentira sobre o próprio item do carrinho — a oferta some.
 */
function cobreOContexto(contexto: ContextoDaOferta, inclusos: ItemDaOferta[]): boolean {
  const tem = (chave: ChaveDoItem) => inclusos.some((i) => i.chave === chave)
  switch (contexto) {
    case 'material':
    case 'pacote':
    case 'carrinho':
      return tem('materiais')
    case 'flashcard':
      return tem('flashcards')
    case 'manual_clinico':
      return tem('patologias')
    case 'plano':
      return inclusos.length > 0
  }
}

export function decidirModo(input: {
  perfil: PerfilDoComprador
  contexto: ContextoDaOferta
  /** Cargo do plano sendo comprado, quando o checkout é de plano. */
  cargoDoPlanoAtual?: string | null
  temPlano: boolean
  inclusos: ItemDaOferta[]
}): ModoDaOferta {
  const { perfil, contexto, cargoDoPlanoAtual, temPlano, inclusos } = input
  if (!temPlano) return 'nenhuma'
  if (perfil === 'plus' || perfil === 'outro') return 'nenhuma'

  if (contexto === 'plano') {
    // Já está comprando Plus+ (qualquer ciclo): não há o que oferecer. Só o
    // Quest+ tem para onde subir.
    if (!cargoDoPlanoAtual || normalizeAccountType(cargoDoPlanoAtual) !== QUEST_TIER) return 'nenhuma'
    return cobreOContexto(contexto, inclusos) ? 'upgrade' : 'nenhuma'
  }

  if (!cobreOContexto(contexto, inclusos)) return 'nenhuma'
  return perfil === 'quest' ? 'upgrade' : 'oferta'
}

// ─── O argumento ──────────────────────────────────────────────────────────────

export type TipoDeArgumento = 'mais-barato' | 'quase-o-mesmo' | 'por-mes'

export interface ArgumentoDaOferta {
  tipo: TipoDeArgumento
  /** Quanto o Plus+ custa a mais que a compra atual (0 se custa menos). */
  diferenca: number
  /** Quanto a pessoa economiza levando o Plus+ no lugar (0 se não economiza). */
  economia: number
  /** Preço dividido pelos meses do plano; `null` para vitalício. */
  porMes: number | null
  /** Preço dividido pelos dias do plano; `null` para vitalício. */
  porDia: number | null
}

/** Abaixo disto a compra atual é pequena demais para a frase "só X a mais". */
export const LIMIAR_QUASE_O_MESMO = 0.35

function centavos(valor: number): number {
  return Math.round(valor * 100) / 100
}

/**
 * Escolhe a frase que mais pesa para ESTA compra:
 *
 * - a compra custa o mesmo ou mais que o Plus+ → "custa menos que o carrinho";
 * - a compra já é uma fatia boa do Plus+ → "por só R$ X a mais";
 * - a compra é pequena → o custo mensal, que é o menor número honesto.
 */
export function argumentoDaOferta(input: {
  valorAtual: number
  precoPlus: number
  meses?: number | null
}): ArgumentoDaOferta {
  const valorAtual = Math.max(0, Number(input.valorAtual) || 0)
  const precoPlus = Math.max(0, Number(input.precoPlus) || 0)
  const meses = Number(input.meses) > 0 ? Number(input.meses) : null

  const porMes = meses ? centavos(precoPlus / meses) : null
  const porDia = meses ? centavos(precoPlus / (meses * 30)) : null
  const diferenca = centavos(Math.max(0, precoPlus - valorAtual))
  const economia = centavos(Math.max(0, valorAtual - precoPlus))

  let tipo: TipoDeArgumento = 'por-mes'
  if (precoPlus > 0 && valorAtual >= precoPlus) tipo = 'mais-barato'
  else if (precoPlus > 0 && valorAtual >= precoPlus * LIMIAR_QUASE_O_MESMO) tipo = 'quase-o-mesmo'

  return { tipo, diferenca, economia, porMes, porDia }
}

/** Para onde vai o clique: logado paga em /buy/checkout; visitante, por Serial Key. */
export function destinoDaOferta(tipoDoPlano: string, logado: boolean): string {
  const tipo = encodeURIComponent(tipoDoPlano)
  return logado
    ? `/buy/checkout?plan=${tipo}`
    : `/comprar?productType=premium&productId=${tipo}`
}
