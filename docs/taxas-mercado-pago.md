# Taxa operacional do Mercado Pago repassada ao comprador

## O problema

Até então o checkout cobrava exatamente o preço de tabela e a taxa do Mercado
Pago saía do nosso bolso. No Pix (0,99%) e no boleto (R$ 3,49) a mordida é
pequena. No **cartão parcelado** ela é grave: o custo de financiar as parcelas é
do VENDEDOR, cresce com o número de parcelas e o `<select>` de parcelas apenas
dividia `preço / n`. Na prática vendíamos "12x sem juros" sem nunca ter previsto
o custo de oferecer isso — cerca de **17,83%** do valor da venda.

| Venda de R$ 200 em 12x | Antes | Agora |
| --- | --- | --- |
| Cobrado do comprador | R$ 200,00 | R$ 243,40 |
| Taxa do Mercado Pago (17,83%) | R$ 35,66 | R$ 43,40 |
| **Líquido para nós** | **R$ 164,34** | **R$ 200,00** |

## Como funciona

`lib/payments/fees.ts` é um módulo **puro** (sem I/O), usado pelos dois lados:

- **No servidor**, cada rota de checkout chama `computeCheckoutCharge()` depois
  de resolver o preço na fonte autoritativa e antes de criar o pagamento. O
  valor cobrado (`transaction_amount`) passa a ser base + taxa.
- **No navegador**, `components/payments/mercado-pago-checkout.tsx` chama a
  mesma função com a política servida por `GET /api/payments/fees`, para que o
  total exibido seja exatamente o total cobrado.

### O gross-up

Somar a taxa direto ao preço não fecha a conta: o Mercado Pago cobra o
percentual sobre o valor da transação, então a taxa também incide sobre a taxa.
A fórmula que faz o líquido bater com o preço de tabela é:

```
total = (base + tarifa_fixa) / (1 - percentual/100)
```

Exemplo no Pix: `100 / (1 - 0,0099) = 101,00`. Somar 0,99% daria R$ 100,99, o
Mercado Pago levaria R$ 1,00 e sobrariam R$ 99,99.

O total é arredondado **para cima** no centavo — nunca cobrar menos do que a
taxa custa.

### O que a base não inclui

A comissão do sócio (split de marketplace) incide sobre o preço do produto, não
sobre o total cobrado: a taxa do Mercado Pago não é receita nossa para ser
dividida. Por isso as rotas passam `commissionableAmount` com o valor da base.

Do mesmo modo, os registros de negócio guardam o valor da COMPRA e o valor
COBRADO em campos separados:

| Registro | Valor da compra | Valor cobrado |
| --- | --- | --- |
| `payment_orders` | `baseAmount` | `amount` |
| `shop_orders` (loja física) | `total` | `chargedTotal` (+ `paymentFee`) |
| `raffle_purchases` (rifa) | `amount` | — (fica na order) |

Isso mantém intactos os números com que a logística e o financeiro trabalham.

## A tabela de taxas

Padrão embutido — Mercado Pago, venda online (Checkout Transparente/Pro),
liberação em **30 dias**:

| Meio | Custo |
| --- | --- |
| Pix | 0,99% |
| Boleto | R$ 3,49 por boleto pago |
| Cartão de débito | 1,99% |
| Cartão de crédito à vista | 3,03% |
| Crédito parcelado | 3,03% + custo de parcelamento (2x: 2,66% … 12x: 14,80%) |

**As taxas do Mercado Pago variam por conta, por prazo de liberação e por
negociação comercial.** Confira as suas em *Mercado Pago → Seu negócio →
Custos*. Se divergirem, sobrescreva por variável de ambiente — não precisa de
deploy de código.

## Configuração

Tudo opcional; o repasse vem **ligado** por padrão.

| Variável | Efeito |
| --- | --- |
| `PAYMENT_FEE_ENABLED=false` | Desliga o repasse por completo (voltamos a absorver tudo) |
| `PAYMENT_FEE_PASS_PIX=false` | Absorve a taxa do Pix |
| `PAYMENT_FEE_PASS_BOLETO=false` | Absorve a tarifa do boleto |
| `PAYMENT_FEE_PASS_DEBIT=false` | Absorve a taxa do débito |
| `PAYMENT_FEE_PASS_CREDIT=false` | Absorve a taxa do crédito à vista |
| `PAYMENT_FEE_PASS_INSTALLMENTS=false` | Parcelado sem juros para o comprador (o custo volta a ser nosso) |
| `PAYMENT_FEE_MAX_INSTALLMENTS=6` | Teto de parcelas oferecidas |
| `PAYMENT_FEE_TABLE={...}` | JSON parcial que sobrescreve a tabela |

Exemplo de tabela própria (o que não vier fica no padrão):

```
PAYMENT_FEE_TABLE={"creditPercent":2.89,"installmentPercent":{"12":13.4}}
```

## O que o comprador vê

Antes de confirmar, o rodapé do checkout mostra:

```
Subtotal              R$ 200,00
Juros de parcelamento (12x)  + R$ 43,40
                      R$ 243,40
                      em 12x de R$ 20,28
```

E, acima do botão, uma linha explicando de onde vem o acréscimo. No `<select>`
de parcelas, cada opção já traz o total daquela escolha — a diferença entre 1x e
12x fica visível na hora de escolher.

A bandeira do cartão é detectada pelo BIN enquanto o comprador digita: se for
**débito**, a tela troca para a taxa de débito (1,99%) e some com o
parcelamento, que o débito não admite.

## CPF obrigatório

No mesmo checkout, o CPF passou a ser exigido em **todos** os meios de pagamento
(antes só cartão e boleto pediam; o Pix passava batido) — é o dado da nota
fiscal. A regra vive em `lib/payments/checkout-identity.ts` e roda no servidor,
porque validar só no formulário deixaria a rota aberta a um POST direto.

Para quem está logado e ainda não tem CPF no cadastro, o CPF informado é
**anexado ao perfil** (`cpfSource: 'checkout'`, `cpfVerified: false` — não passou
pela Receita Federal; quem confere é o modal de perfil). Um CPF já gravado nunca
é sobrescrito por uma compra: trocar o titular de uma conta é operação de
cadastro, em `/api/user/complete-profile`. Compras sem conta (rifa, serial key)
só validam o número.

## Onde mexer

| Arquivo | Papel |
| --- | --- |
| `lib/payments/fees.ts` | Tabela, política e o cálculo (puro) |
| `lib/payments/checkout-identity.ts` | CPF obrigatório e vínculo com o perfil |
| `app/api/payments/fees/route.ts` | Serve a política para o navegador |
| `components/payments/mercado-pago-checkout.tsx` | Formulário único de todos os checkouts |
| `__tests__/payments/taxas-operacionais.test.ts` | Garante que o líquido nunca cai abaixo da base |
| `__tests__/payments/cpf-obrigatorio-checkout.test.ts` | Garante as regras de CPF |

Rotas que aplicam a taxa e exigem CPF: `/api/payments/orders`,
`/api/materiais/checkout`, `/api/serial-keys/checkout`,
`/api/manual-clinico/checkout`, `/api/loja/checkout` e
`/api/raffles/[id]/checkout`.
