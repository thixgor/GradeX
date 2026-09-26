import { z } from 'zod'

/**
 * Device ID do antifraude do Mercado Pago (`MP_DEVICE_SESSION_ID`, gerado pelo
 * security.js no navegador do comprador).
 *
 * É um dado de apoio: ajuda o antifraude a reconhecer o aparelho, mas o
 * pagamento é perfeitamente válido sem ele. Por isso ele NUNCA pode derrubar a
 * requisição. Antes o schema era `z.string().max(200)` — o valor é gerado pelo
 * script do MP, o formato é deles e varia por aparelho; num celular em que ele
 * passou de 200 caracteres, toda tentativa voltava "Dados inválidos" antes de
 * chegar ao Mercado Pago, com qualquer cartão.
 *
 * Agora: valor estranho (longo demais, tipo errado) é descartado e o pagamento
 * segue sem device ID.
 */
export const DEVICE_ID_MAX_LENGTH = 1024

export const deviceIdSchema = z
  .string()
  .trim()
  .max(DEVICE_ID_MAX_LENGTH)
  .optional()
  .catch(undefined)
