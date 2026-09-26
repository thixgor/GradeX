/**
 * Erros do `createCardToken` do mercadopago.js traduzidos para o comprador.
 *
 * O SDK rejeita com uma lista de causas (`[{ code, message }]`) ou com um
 * objeto que tem essa lista em `cause` — nenhum dos dois é um `Error`, então a
 * tela caía no genérico "Erro ao processar" e a pessoa tentava outro cartão
 * sem saber que o problema era, por exemplo, o CPF ou a validade digitada.
 *
 * Arquivo puro — roda no navegador e nos testes.
 */

const DOC = 'O CPF não é aceito para este cartão. Confira o número — se o cartão for de outra pessoa, marque essa opção e informe o CPF do titular.'
const NUMERO = 'O número do cartão está incorreto. Confira e tente de novo.'
const CVV = 'O código de segurança (CVV) está incorreto. Confira no verso do cartão.'
const VALIDADE = 'A data de validade está incorreta. Confira o mês e o ano impressos no cartão.'
const NOME = 'O nome do titular está incorreto. Digite como está impresso no cartão, sem números ou símbolos.'

const BY_CODE: Record<string, string> = {
  '205': NUMERO,
  E301: NUMERO,
  '208': VALIDADE,
  '209': VALIDADE,
  '325': VALIDADE,
  '326': VALIDADE,
  E205: VALIDADE,
  '224': CVV,
  E302: CVV,
  E203: CVV,
  '221': NOME,
  '316': NOME,
  '212': DOC,
  '213': DOC,
  '214': DOC,
  '322': DOC,
  '323': DOC,
  '324': DOC,
  '220': 'Não conseguimos identificar o banco emissor. Digite o número do cartão de novo.',
}

const BY_TEXT: Array<[RegExp, string]> = [
  [/cardNumber|card number/i, NUMERO],
  [/securityCode|security code|cvv/i, CVV],
  [/expiration|month|year/i, VALIDADE],
  [/cardholderName|cardholder/i, NOME],
  [/identification|docNumber|docType/i, DOC],
]

function causesOf(err: unknown): Array<{ code?: unknown; message?: unknown; description?: unknown }> {
  if (Array.isArray(err)) return err
  const e = err as any
  if (Array.isArray(e?.cause)) return e.cause
  if (e && typeof e === 'object') return [e]
  return []
}

/** Mensagem em português, ou `null` quando o erro não é reconhecido. */
export function describeCardTokenError(err: unknown): string | null {
  const causes = causesOf(err)
  for (const c of causes) {
    const msg = c?.code != null ? BY_CODE[String(c.code)] : undefined
    if (msg) return msg
  }
  for (const c of causes) {
    const texto = `${c?.message ?? ''} ${c?.description ?? ''}`
    for (const [re, msg] of BY_TEXT) if (re.test(texto)) return msg
  }
  return null
}

/**
 * Converte a falha da tokenização num `Error` com mensagem útil — nunca deixa
 * chegar à tela um objeto sem `message`.
 */
export function cardTokenError(err: unknown): Error {
  const amigavel = describeCardTokenError(err)
  if (amigavel) return new Error(amigavel)
  if (err instanceof Error && err.message) return err
  return new Error('Não conseguimos validar os dados do cartão. Confira número, validade, CVV e nome e tente de novo.')
}
