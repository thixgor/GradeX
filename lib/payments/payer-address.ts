import { z } from 'zod'

/**
 * Endereço do pagador, enviado pelo formulário do boleto
 * (components/payments/mercado-pago-checkout.tsx).
 *
 * O Mercado Pago recusa a criação de um boleto sem `payer.address`. O
 * formulário já exige CEP, rua e número, mas as rotas que não declaravam este
 * campo no schema o perdiam: o zod descarta chave desconhecida em silêncio, o
 * provider não recebia endereço nenhum e o boleto era recusado — sem que
 * nada, nem na tela nem no log, dissesse que o endereço tinha chegado e sumido.
 *
 * Mesma forma de `PayerAddress` (lib/payments/types.ts). Só o boleto envia.
 */
export const payerAddressSchema = z.object({
  zipCode: z.string().max(20),
  streetName: z.string().max(160),
  streetNumber: z.string().max(20),
  neighborhood: z.string().max(120).optional(),
  city: z.string().max(120).optional(),
  federalUnit: z.string().max(4).optional(),
})
