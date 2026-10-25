import type { CouponValidationResult } from '@/lib/coupons'

/**
 * O que o pedido precisa carregar para a venda ser do embaixador quando o
 * pagamento for aprovado (lá no webhook só existe o pedido).
 *
 * A regra do programa é uma só: o embaixador ganha quando o CUPOM DELE é usado
 * na compra. O link conta visita e cadastro e deixa o cupom pronto no
 * checkout, mas não dá venda a ninguém sozinho — é o código digitado que a
 * equipe consegue conferir.
 *
 * `embaixadorCupomId` guarda o cupom de embaixador que a pessoa aplicou MESMO
 * quando ele não descontou nada, porque outro desconto foi maior. O caso que
 * importa é o do bolsista: o PROUNI/FIES de 30% vence o cupom de 10%, o
 * bolsista paga o menor preço, e a venda continua sendo de quem indicou. Sem
 * isto, o checkout descartava o cupom perdedor e a venda sumia do embaixador
 * justamente na turma que mais usa o benefício.
 *
 * Chamar ANTES de o checkout descartar o cupom que perdeu a disputa.
 */
export function atribuicaoDeEmbaixador(
  validacao: CouponValidationResult | null | undefined,
): { embaixadorCupomId?: string } {
  return validacao?.coupon?.embaixadorId ? { embaixadorCupomId: validacao.couponId } : {}
}
