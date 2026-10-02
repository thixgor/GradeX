import { matchesAccessGroups } from '@/lib/account-tier'

/**
 * "Só para estes cargos" — a restrição que grupos de /provas e módulos/tópicos
 * do Banco de Questões compartilham com os materiais.
 *
 * O campo é `allowedGroups`, o mesmo nome e o mesmo vocabulário dos materiais
 * (`plus`, `quest`, um cargo criado em `/admin/cargos`, `monitor`): o admin
 * marca os cargos num seletor só (`useGruposDeAcesso`) e a conta é feita por
 * `matchesAccessGroups`, que já sabe dos aliases legados do Plus+. Lista vazia
 * é "todo mundo".
 *
 * Isomórfico: lido pela tela do admin e pelas rotas.
 */

/** Quem está olhando, para efeito da restrição. */
export interface QuemPedeAcesso {
  accountType?: string | null
  secondaryRole?: string | null
}

/** Mesmo formato de id que um cargo pode ter (ver `slugDeCargo` em `lib/cargos.ts`). */
const FORMATO_DE_CARGO = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const TETO_DE_CARGOS = 30

/**
 * Limpa a lista que veio do formulário: só ids no formato de cargo, sem
 * repetição. Qualquer outra coisa (não-lista, `null`) vira "todo mundo".
 */
export function normalizarCargosPermitidos(valor: unknown): string[] {
  if (!Array.isArray(valor)) return []
  const limpos = valor
    .map((v) => String(v ?? '').trim().toLowerCase())
    .filter((v) => FORMATO_DE_CARGO.test(v))
  return Array.from(new Set(limpos)).slice(0, TETO_DE_CARGOS)
}

/** A lista restringe alguém? */
export function temRestricaoDeCargo(cargos: unknown): boolean {
  return Array.isArray(cargos) && cargos.length > 0
}

/** Esta pessoa passa na restrição? Lista vazia passa sempre. Admin não chega aqui. */
export function cargoPassa(cargos: unknown, quem: QuemPedeAcesso): boolean {
  if (!temRestricaoDeCargo(cargos)) return true
  return matchesAccessGroups(cargos as string[], quem.accountType, quem.secondaryRole)
}
