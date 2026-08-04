import type { FormMaterialChoiceMode, FormMaterialPrize, FormSettings } from '@/lib/types'

/**
 * Prêmios (materiais) de um formulário, já normalizados.
 *
 * Formulários antigos guardavam um único material em `deliverMaterialId`. A
 * lista `deliverMaterials` é a fonte de verdade atual; o campo antigo continua
 * sendo lido como fallback para não quebrar formulários já publicados.
 */
export function getFormPrizes(settings?: Partial<FormSettings> | null): FormMaterialPrize[] {
  if (!settings) return []

  const list = Array.isArray(settings.deliverMaterials) ? settings.deliverMaterials : []
  const normalized: FormMaterialPrize[] = []
  const seen = new Set<string>()

  for (const item of list) {
    const id = String(item?.id || '').trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    normalized.push({ id, title: item?.title ? String(item.title) : undefined })
  }

  if (normalized.length === 0 && settings.deliverMaterialId) {
    const id = String(settings.deliverMaterialId).trim()
    if (id) normalized.push({ id, title: settings.deliverMaterialTitle })
  }

  return normalized
}

export function getMaterialChoiceMode(settings?: Partial<FormSettings> | null): FormMaterialChoiceMode {
  return settings?.materialChoiceMode === 'single' ? 'single' : 'all'
}

/**
 * `true` quando o usuário precisa escolher um prêmio na hora de responder.
 * Com um único material na lista não há o que escolher — a entrega é direta.
 */
export function requiresPrizeChoice(settings?: Partial<FormSettings> | null): boolean {
  if (!settings?.deliverMaterial) return false
  return getMaterialChoiceMode(settings) === 'single' && getFormPrizes(settings).length > 1
}

/**
 * Materiais que devem ser entregues nesta submissão.
 * Em `single`, apenas o escolhido (ou o único disponível).
 */
export function resolvePrizesToDeliver(
  settings: Partial<FormSettings> | null | undefined,
  selectedMaterialId?: string | null
): FormMaterialPrize[] {
  const prizes = getFormPrizes(settings)
  if (prizes.length === 0) return []
  if (getMaterialChoiceMode(settings) !== 'single') return prizes
  if (prizes.length === 1) return prizes

  const chosen = prizes.find(p => p.id === String(selectedMaterialId || '').trim())
  return chosen ? [chosen] : []
}

/** Texto do seletor de prêmio exibido no formulário público. */
export const DEFAULT_PRIZE_CHOICE_TITLE = 'Escolha o seu prêmio'
