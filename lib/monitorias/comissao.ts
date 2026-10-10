/**
 * Comissão da monitoria quando o aluno leva junto um material oficial.
 *
 * Regra (uma só, usada no checkout, na aprovação, no repasse e na tela):
 *   - sem material na compra            → 10% da plataforma, 90% do monitor;
 *   - com material oficial, preço ≥ 10% do valor da aula → 0% da plataforma, 100% do monitor;
 *   - com material, preço < 10%         → 10% / 90% (o material é vendido, mas não isenta).
 *
 * Tudo em centavos inteiros, sem divisão: `preço × 10 ≥ valor` é o mesmo que
 * `preço ≥ 10% do valor`, sem arredondamento nenhum no caminho.
 *   R$ 100,00 + material R$ 10,00 → 1000 × 10 = 10000 ≥ 10000 → isento
 *   R$ 100,00 + material R$  9,99 →  999 × 10 =  9990 < 10000 → 10%
 *
 * "Valor da aula" é o do ASSENTO (`Participacao.valorCentavos`, fixado pelo
 * servidor no aceite): no grupo, cada aluno paga e escolhe o próprio material,
 * e a regra vale assento por assento. O preço do material é o OFICIAL, lido do
 * banco na hora de gerar o PIX — nunca o que o navegador mandou.
 *
 * Função pura: roda no servidor e na tela (para mostrar a mesma conta).
 */

import { TAXA_PLATAFORMA_PERCENT } from './dinheiro'

/** O material isenta a taxa desta aula? */
export function materialIsentaTaxa(valorAulaCentavos: number, precoMaterialCentavos: number): boolean {
  const aula = Math.round(valorAulaCentavos)
  const material = Math.round(precoMaterialCentavos)
  if (!Number.isFinite(aula) || !Number.isFinite(material)) return false
  if (aula <= 0 || material <= 0) return false
  return material * 100 >= aula * TAXA_PLATAFORMA_PERCENT
}

/** Percentual da plataforma nesta contratação (assento). */
export function taxaPercentDaContratacao(input: { valorAulaCentavos: number; materialCentavos?: number | null }): number {
  if (input.materialCentavos == null) return TAXA_PLATAFORMA_PERCENT
  return materialIsentaTaxa(input.valorAulaCentavos, input.materialCentavos) ? 0 : TAXA_PLATAFORMA_PERCENT
}

/** Menor preço de material que isenta esta aula (para a tela explicar ao monitor). */
export function precoMinimoParaIsencao(valorAulaCentavos: number): number {
  return Math.ceil((Math.max(0, Math.round(valorAulaCentavos)) * TAXA_PLATAFORMA_PERCENT) / 100)
}

/**
 * Percentual gravado no assento/repasse. Registros de antes desta regra não
 * têm o campo e continuam com 10% — nada muda retroativamente.
 */
export function percentualGravado(taxaPercent: number | null | undefined): number {
  return taxaPercent === 0 ? 0 : TAXA_PLATAFORMA_PERCENT
}
