import { z } from 'zod'
import { isValidCpf, onlyCpfDigits } from '@/lib/cpf'

/**
 * Campos de APOIO do pagamento com cartão, comuns a todas as rotas de checkout.
 *
 * Nenhum deles é obrigatório para o Mercado Pago aprovar — ajudam o antifraude
 * e o roteamento para o emissor. Por isso NUNCA podem derrubar a requisição:
 * valor estranho é descartado e o pagamento segue sem ele. Antes o device ID
 * tinha `z.string().max(200)`; num aparelho em que o `MP_DEVICE_SESSION_ID`
 * passou de 200 caracteres, TODA tentativa voltava "Dados inválidos" antes de
 * chegar ao Mercado Pago, com qualquer cartão.
 */

export const DEVICE_ID_MAX_LENGTH = 1024

/**
 * Device ID do antifraude (`MP_DEVICE_SESSION_ID`, gerado pelo security.js do
 * MP). Vai no header `X-meli-session-id`, por isso só ASCII visível: nada de
 * espaço, CR/LF ou controle — que num header seria injeção ou erro do fetch.
 */
export const deviceIdSchema = z
  .string()
  .trim()
  .max(DEVICE_ID_MAX_LENGTH)
  .regex(/^[\x21-\x7E]+$/)
  .optional()
  .catch(undefined)

/**
 * `issuer_id` do emissor. O mercadopago.js devolve número em algumas respostas
 * e string em outras; aceitamos os dois e descartamos o que não for id.
 */
export const issuerIdSchema = z
  .union([z.string(), z.number()])
  .transform(v => String(v).trim())
  .pipe(z.string().regex(/^\d{1,20}$/))
  .optional()
  .catch(undefined)

/**
 * CPF do TITULAR do cartão, quando o cartão é de outra pessoa (pai, mãe,
 * cônjuge). O CPF do comprador continua indo para a nota fiscal; este é o que
 * vai em `payer.identification` do pagamento, porque é o que o token do cartão
 * carrega e o que o banco confere. Inválido → descartado (o formulário já não
 * deixa enviar um CPF inválido).
 */
export const cardholderDocumentSchema = z
  .string()
  .max(20)
  .transform(onlyCpfDigits)
  .refine(isValidCpf)
  .optional()
  .catch(undefined)

/**
 * Documento que vai em `payer.identification`. No cartão tem de ser o mesmo
 * CPF que foi na tokenização — o do titular. Mandar o do comprador quando o
 * cartão é de terceiro é divergência que o MP devolve como erro de
 * identificação ou que o antifraude pesa como risco.
 */
export function payerIdentificationNumber(input: {
  hasCardToken: boolean
  buyerDocumentNumber?: string
  cardholderDocumentNumber?: string
}): string | undefined {
  const titular = onlyCpfDigits(input.cardholderDocumentNumber || '')
  if (input.hasCardToken && titular) return titular
  const comprador = (input.buyerDocumentNumber || '').replace(/\D/g, '')
  return comprador || undefined
}
