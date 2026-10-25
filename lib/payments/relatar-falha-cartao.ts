/**
 * O navegador conta ao DomineAqui Analytics uma falha de cartão que só ele viu:
 * a validação do cartão no Mercado Pago (antes de existir pagamento) ou o erro
 * que o nosso servidor devolveu ao envio. Ver /api/analytics/falha-de-cartao.
 *
 * Dispara e esquece: NUNCA lança e nunca atrasa o checkout. Do cartão, só vão os
 * 6 primeiros e os 4 últimos dígitos — o servidor descarta o resto.
 */

export interface FalhaDeCartaoDoNavegador {
  etapa: 'tokenizacao' | 'envio'
  origemDoFormulario: 'checkout' | 'assinatura'
  codigos?: string[]
  mensagem?: string
  httpStatus?: number
  codigoDoServidor?: string
  bandeira?: string
  /** Número do cartão (qualquer formatação): só `bin` e `ultimos4` seguem adiante. */
  numeroDoCartao?: string
  parcelas?: number
  valor?: number
  titularDiferente?: boolean
  deviceIdPresente?: boolean
  endpoint?: string
  produto?: string
}

export function relatarFalhaDeCartao(falha: FalhaDeCartaoDoNavegador): void {
  try {
    const { numeroDoCartao, ...resto } = falha
    const digitos = (numeroDoCartao || '').replace(/\D/g, '')
    const corpo = {
      ...resto,
      codigos: falha.codigos || [],
      ...(digitos.length >= 10 ? { bin: digitos.slice(0, 6), ultimos4: digitos.slice(-4) } : {}),
    }
    void fetch('/api/analytics/falha-de-cartao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* relatar nunca atrapalha a compra */
  }
}
