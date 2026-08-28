import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getFeePolicy } from '@/lib/payments/fees'
import { DEFAULT_PAYMENT_METHODS, type PaymentMethodsConfig } from '@/lib/payment-methods'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Regras de checkout que a tela precisa saber ANTES de o comprador confirmar:
 * quanto de taxa será somado e se o CPF é obrigatório no meio escolhido.
 *
 * O valor cobrado e a exigência de CPF são decididos no servidor; esta rota
 * existe para que a tela mostre exatamente as mesmas regras — um total na tela
 * diferente do total cobrado é a receita de chargeback, e um campo marcado como
 * opcional que o servidor rejeita é a receita de carrinho abandonado.
 *
 * Nada aqui é sigiloso: é o acréscimo que o próprio comprador vê somado ao
 * preço e a obrigatoriedade de um campo do formulário. Sem rate limit de
 * propósito — o checkout já não carrega sem esta resposta, e derrubar a rota
 * por um soluço no Mongo derrubaria a venda junto.
 */
export async function GET() {
  try {
    const policy = getFeePolicy()

    // Uma falha ao ler a config do painel NÃO pode virar "CPF dispensado" na
    // tela: o default exige, então o formulário erra para o lado seguro e o
    // servidor (que aplica a mesma regra) não recusa nada que a tela deixou
    // passar.
    let methods: PaymentMethodsConfig = DEFAULT_PAYMENT_METHODS
    try {
      const db = await getDb()
      const settings = await db.collection('admin_settings').findOne(
        {},
        { projection: { paymentMethods: 1 } }
      )
      methods = { ...DEFAULT_PAYMENT_METHODS, ...(settings?.paymentMethods || {}) }
    } catch (err) {
      console.error('[payments/fees] falha ao ler paymentMethods, exigindo CPF:', err)
    }

    return NextResponse.json(
      {
        policy,
        checkout: {
          // Cartão e boleto não entram: o Mercado Pago recusa os dois sem
          // documento, então ali não há o que configurar.
          cpfRequiredForPix: methods.requireCpfForPix !== false,
          /*
           * Assinatura recorrente ligada no painel?
           *
           * Isto existe pelo mesmo motivo que o CPF acima: a regra é do
           * servidor, mas a tela precisa dela ANTES de cobrar. Sem este campo,
           * /buy/checkout abria com "Assinatura · Recomendado" pré-selecionada
           * mesmo com o toggle desligado — a pessoa digitava cartão, validade,
           * CVV e CPF e só então recebia "Assinaturas não estão disponíveis no
           * momento", sem nenhuma indicação de que a aba ao lado funcionaria.
           *
           * Erra para o lado seguro pelo mesmo critério do CPF: se a leitura do
           * painel falhar, `DEFAULT_PAYMENT_METHODS` mantém `true` e o pior
           * caso volta a ser o comportamento antigo, nunca esconder uma opção
           * que existe.
           */
          subscriptionsEnabled: methods.subscriptions !== false,
        },
      },
      // Curto porque acompanha um toggle do painel — 60s limita a janela em
      // que o formulário segue pedindo (ou dispensando) o CPF pela regra antiga.
      { headers: { 'Cache-Control': 'public, max-age=60' } }
    )
  } catch (err: any) {
    return NextResponse.json({ policy: null, error: err?.message }, { status: 500 })
  }
}
