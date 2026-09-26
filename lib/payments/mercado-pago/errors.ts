/**
 * Erros da API do Mercado Pago na CRIAÇÃO do pagamento (antes de haver
 * aprovação ou recusa) traduzidos em orientação para o comprador.
 *
 * Sem isto a tela mostrava a mensagem crua em inglês — "Invalid card_token_id",
 * "Invalid users involved" — e a pessoa lia como "cartão recusado", tentava de
 * novo do mesmo jeito e desistia. Vários desses erros não têm nada a ver com o
 * cartão: token vencido (a tela ficou aberta), CPF divergente do titular, ou o
 * comprador logado na mesma conta do vendedor.
 *
 * Arquivo puro — testável sem SDK.
 */

interface MpCause {
  code?: string | number
  description?: string
}

function causesOf(err: any): MpCause[] {
  const raw = err?.cause ?? err?.response?.cause ?? err?.error?.cause
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === 'object') return [raw]
  return []
}

const BY_CODE: Record<string, string> = {
  // Token do cartão inválido, vencido ou já usado (cada token vale uma vez).
  '2006': 'Os dados do cartão expiraram. Digite o CVV de novo e tente outra vez.',
  '2062': 'Os dados do cartão expiraram. Digite o CVV de novo e tente outra vez.',
  '3003': 'Os dados do cartão expiraram. Digite o CVV de novo e tente outra vez.',
  // Documento.
  '2067': 'O CPF não confere com o do titular do cartão. Se o cartão for de outra pessoa, marque essa opção e informe o CPF dela.',
  '4020': 'O CPF não confere com o do titular do cartão. Se o cartão for de outra pessoa, marque essa opção e informe o CPF dela.',
  // Comprador e vendedor são a mesma conta do Mercado Pago.
  '2034': 'Não é possível pagar com o e-mail da conta que recebe o pagamento. Use outra conta ou outro e-mail.',
  // Parcelas.
  '3029': 'O cartão não aceita esse número de parcelas. Escolha outra opção.',
  '4033': 'O cartão não aceita esse número de parcelas. Escolha outra opção.',
  // Dados do cartão.
  '3034': 'O número do cartão não confere com a bandeira. Confira o número digitado.',
  '3033': 'O número do cartão está incorreto. Confira e tente de novo.',
  '3031': 'O código de segurança (CVV) está incorreto.',
  '3032': 'O código de segurança (CVV) está incorreto.',
  '3030': 'A data de validade está incorreta.',
  '3035': 'A data de validade está incorreta.',
  '2131': 'O nome do titular está incorreto. Digite como está impresso no cartão.',
  '316': 'O nome do titular está incorreto. Digite como está impresso no cartão.',
  // Emissor.
  '2077': 'Não conseguimos identificar o banco emissor. Digite o número do cartão de novo e tente outra vez.',
  '3013': 'Não conseguimos identificar o banco emissor. Digite o número do cartão de novo e tente outra vez.',
}

const BY_TEXT: Array<[RegExp, string]> = [
  [/card[_ ]?token/i, BY_CODE['2006']],
  [/identification/i, BY_CODE['2067']],
  [/users involved/i, BY_CODE['2034']],
  [/installments/i, BY_CODE['4033']],
  [/issuer/i, BY_CODE['2077']],
  [/security[_ ]?code/i, BY_CODE['3031']],
  [/expiration/i, BY_CODE['3030']],
  [/cardholder/i, BY_CODE['2131']],
]

/** Mensagem em português para um erro da API, ou `null` se não reconhecido. */
export function describeMercadoPagoApiError(err: unknown): string | null {
  const causes = causesOf(err)
  for (const c of causes) {
    const msg = c.code != null ? BY_CODE[String(c.code)] : undefined
    if (msg) return msg
  }
  const textos = [...causes.map(c => c.description || ''), (err as any)?.message || '']
  for (const texto of textos) {
    for (const [re, msg] of BY_TEXT) if (re.test(texto)) return msg
  }
  return null
}

/**
 * Erro com a mensagem traduzida e o erro original preservado em `cause` —
 * os logs continuam com o detalhe técnico do Mercado Pago.
 */
export class MercadoPagoPaymentError extends Error {
  readonly original: unknown
  constructor(message: string, original: unknown) {
    super(message)
    this.name = 'MercadoPagoPaymentError'
    this.original = original
  }
}
