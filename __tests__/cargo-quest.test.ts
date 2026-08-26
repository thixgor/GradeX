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
import { canDownloadExamPdf, canUseBancoQuestoes, getTierLimits } from '@/lib/tier-limits'
import { getFlashcardLimits, getFlashcardManualLimits } from '@/lib/flashcard-limits'
import type { PlanFeatureKey } from '@/lib/plan-entitlements'
import { PLAN_FEATURE_KEYS, permissoesPadraoParaCargo, regraDaArea } from '@/lib/plan-entitlements'

/**
 * O cargo **Quest+** — o Banco de Questões (mais o PDF das provas) vendido
 * sozinho.
 *
 * O que estes testes seguram, em ordem de gravidade:
 *
 *  1. **Quest+ não vira Plus+ por acidente.** O acervo, o Manual Clínico e as
 *     aulas são o grosso do valor do Plus+; se `isPlusAccount()` passasse a
 *     aceitar o cargo novo, um produto barato abriria a plataforma inteira.
 *  2. **Quest+ entrega o que a venda promete.** O Banco e o download em PDF das
 *     provas são as duas coisas que o modal de assinatura oferece a quem está
 *     fazendo prova sem assinar; se o cargo não abrisse as duas, a pessoa
 *     pagaria e reencontraria o mesmo bloqueio.
 *  3. **Quest+ é dinheiro e vence.** Precisa aparecer nos filtros de expiração,
 *     ou a conta fica com o cargo para sempre depois do prazo.
 */
describe('cargo Quest+', () => {
  it('normaliza as escritas conhecidas e ignora o resto', () => {
    expect(normalizeAccountType('quest')).toBe(QUEST_TIER)
    expect(normalizeAccountType('Quest')).toBe(QUEST_TIER)
    expect(normalizeAccountType(' QUEST+ ')).toBe(QUEST_TIER)
    /*
     * `'questao'` NÃO vira `quest` — e, desde o registro de cargos, também não
     * vira `gratuito`: ele passa direto, porque é um slug válido e pode ser o
     * id de um cargo criado em `/admin/cargos`.
     *
     * `normalizeAccountType` é um normalizador de FORMATO, não um validador de
     * existência: ela é síncrona e roda no navegador, então não tem como
     * consultar o registro. Quem precisa saber se o cargo existe usa
     * `acharCargo()`, que devolve `null` para id órfão.
     */
    expect(normalizeAccountType('questao')).toBe('questao')
    expect(normalizeAccountType('não é slug!')).toBe('gratuito')
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

  it('baixa PDF de prova — é a outra metade da oferta', () => {
    expect(canDownloadExamPdf(QUEST_TIER)).toBe(true)
    expect(canDownloadExamPdf('plus')).toBe(true)
    // Quem não paga continua fora: é este bloqueio que abre o modal de venda.
    expect(canDownloadExamPdf('gratuito')).toBe(false)
    expect(canDownloadExamPdf('trial')).toBe(false)
    expect(canDownloadExamPdf(null, true)).toBe(true)
  })

  it('vale uma conta gratuita fora do Banco e das provas em PDF', () => {
    const quest = getTierLimits(QUEST_TIER)
    const gratuito = getTierLimits('gratuito')
    expect(quest.cronogramasTotal).toBe(gratuito.cronogramasTotal)
    expect(quest.personalExamsTotal).toBe(gratuito.personalExamsTotal)
    expect(quest.questionsPerExam).toBe(gratuito.questionsPerExam)
    expect(getFlashcardLimits(QUEST_TIER)).toEqual(getFlashcardLimits('gratuito'))
    expect(getFlashcardManualLimits(QUEST_TIER)).toEqual(getFlashcardManualLimits('gratuito'))
  })

  it('nasce, no editor de planos, com o Banco e o PDF abertos e o resto fechado', () => {
    const permissoes = permissoesPadraoParaCargo(QUEST_TIER)
    const abertas: PlanFeatureKey[] = ['bancoQuestoes', 'provasPdf']
    for (const key of abertas) {
      expect(regraDaArea(permissoes, key).liberado, key).toBe(true)
      // Sem teto no que foi vendido: quem paga o Quest+ paga por ele inteiro.
      expect(regraDaArea(permissoes, key).limite, key).toBe(0)
    }
    for (const key of PLAN_FEATURE_KEYS) {
      if (abertas.includes(key)) continue
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
    expect(getAccountTypeLabel(QUEST_TIER)).toBe('Quest+')
  })
})
