import { describe, expect, it } from 'vitest'
import {
  CANONICAL_ACCOUNT_TYPES,
  PAID_ACCOUNT_TYPES,
  QUEST_TIER,
  expandUserAccessGroups,
  getAccountTypeLabel,
  isPaidAccount,
  isPlusAccount,
  isQuestAccount,
  matchesAccessGroups,
  normalizeAccountType,
  temAcessoAoBanco,
} from '@/lib/account-tier'
import { canUseBancoQuestoes, getTierLimits } from '@/lib/tier-limits'
import { getFlashcardLimits, getFlashcardManualLimits } from '@/lib/flashcard-limits'
import { PLAN_FEATURE_KEYS, permissoesPadraoParaCargo, regraDaArea } from '@/lib/plan-entitlements'

/**
 * O cargo **Quest** — o Banco de Questões vendido sozinho.
 *
 * O que estes testes seguram, em ordem de gravidade:
 *
 *  1. **Quest não vira Plus+ por acidente.** O acervo, o Manual Clínico e as
 *     aulas são o grosso do valor do Plus+; se `isPlusAccount()` passasse a
 *     aceitar o cargo novo, um produto barato abriria a plataforma inteira.
 *  2. **Quest realmente abre o Banco.** É a única coisa que a pessoa comprou —
 *     e o cargo precisa passar pela mesma porta que o Plus+ na seção.
 *  3. **Quest é dinheiro e vence.** Precisa aparecer nos filtros de expiração,
 *     ou a conta fica com o cargo para sempre depois do prazo.
 */
describe('cargo Quest', () => {
  it('normaliza as escritas conhecidas e ignora o resto', () => {
    expect(normalizeAccountType('quest')).toBe(QUEST_TIER)
    expect(normalizeAccountType('Quest')).toBe(QUEST_TIER)
    expect(normalizeAccountType(' QUEST+ ')).toBe(QUEST_TIER)
    // Nada parecido demais: valor desconhecido continua caindo em gratuito.
    expect(normalizeAccountType('questao')).toBe('gratuito')
  })

  it('não passa por assinante Plus+', () => {
    expect(isPlusAccount(QUEST_TIER)).toBe(false)
    expect(isQuestAccount(QUEST_TIER)).toBe(true)
    expect(isQuestAccount('plus')).toBe(false)
  })

  it('conta como cargo pago, e o trial não', () => {
    expect(isPaidAccount(QUEST_TIER)).toBe(true)
    expect(isPaidAccount('plus')).toBe(true)
    expect(isPaidAccount('trial')).toBe(false)
    expect(isPaidAccount('gratuito')).toBe(false)
    expect([...PAID_ACCOUNT_TYPES]).toContain(QUEST_TIER)
  })

  it('dá acesso ao Banco de Questões pelo cargo', () => {
    expect(temAcessoAoBanco(QUEST_TIER)).toBe(true)
    expect(canUseBancoQuestoes(QUEST_TIER)).toBe(true)
    expect(getTierLimits(QUEST_TIER).bancoQuestoes).toBe(true)
  })

  it('vale uma conta gratuita fora do Banco', () => {
    const quest = getTierLimits(QUEST_TIER)
    const gratuito = getTierLimits('gratuito')
    expect(quest.cronogramasTotal).toBe(gratuito.cronogramasTotal)
    expect(quest.personalExamsTotal).toBe(gratuito.personalExamsTotal)
    expect(quest.questionsPerExam).toBe(gratuito.questionsPerExam)
    expect(getFlashcardLimits(QUEST_TIER)).toEqual(getFlashcardLimits('gratuito'))
    expect(getFlashcardManualLimits(QUEST_TIER)).toEqual(getFlashcardManualLimits('gratuito'))
  })

  it('nasce, no editor de planos, com o Banco aberto e o resto fechado', () => {
    const permissoes = permissoesPadraoParaCargo(QUEST_TIER)
    expect(regraDaArea(permissoes, 'bancoQuestoes').liberado).toBe(true)
    // Sem teto dentro do Banco: quem paga o Quest paga por ele inteiro.
    expect(regraDaArea(permissoes, 'bancoQuestoes').limite).toBe(0)
    for (const key of PLAN_FEATURE_KEYS) {
      if (key === 'bancoQuestoes') continue
      expect(regraDaArea(permissoes, key).liberado, key).toBe(false)
    }
    expect(Object.values(permissoes.manualClinicoModulos).every(v => v === false)).toBe(true)
  })

  it('é um grupo de acesso próprio — não herda o do Plus+', () => {
    expect(expandUserAccessGroups(QUEST_TIER)).toEqual([QUEST_TIER])
    expect(matchesAccessGroups(['plus'], QUEST_TIER)).toBe(false)
    expect(matchesAccessGroups([QUEST_TIER], QUEST_TIER)).toBe(true)
    // Item sem restrição continua liberado para todo mundo.
    expect(matchesAccessGroups([], QUEST_TIER)).toBe(true)
  })

  it('aparece na lista de cargos que o admin pode atribuir, com rótulo próprio', () => {
    expect(CANONICAL_ACCOUNT_TYPES).toContain(QUEST_TIER)
    expect(getAccountTypeLabel(QUEST_TIER)).toBe('Quest')
  })
})
