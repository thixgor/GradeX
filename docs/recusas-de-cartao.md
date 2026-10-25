# Recusas de cartão no DomineAqui Analytics

Aba **Recusas de cartão** em `/admin/analytics`. Toda falha de pagamento com
cartão é gravada com os fatos técnicos; a **análise** (quem decidiu, causas
prováveis, o que fazer) é calculada na leitura. Quando o conhecimento melhora, o
histórico inteiro passa a ser lido com ele, sem reescrever nada.

## O que é registrado e por onde entra

Coleção `card_rejections` (índice TTL de 400 dias). Cada linha tem uma `etapa`:

| Etapa | O que é | Quem grava |
|---|---|---|
| `resultado` | O Mercado Pago recusou ou cancelou o pagamento (resposta imediata, webhook, polling ou varredura) | `applyPaymentResult` em `lib/payments/effects.ts` → `registrarRecusaDoPedido` |
| `criacao` | A API recusou a **criação** do pagamento (token vencido, parcelas, CPF, credencial) | `recoverFromProviderFailure` em `lib/payments/provider-failure.ts` |
| `assinatura` | Erro ao criar a assinatura recorrente | `app/api/subscriptions/route.ts` |
| `tokenizacao` | O Mercado Pago rejeitou os dados do cartão **no navegador**, antes de existir pagamento | `lib/payments/relatar-falha-cartao.ts` → `POST /api/analytics/falha-de-cartao` |
| `envio` | O nosso servidor devolveu erro ao envio (400, 409, 429, 503, 500 ou resposta cortada) | idem |

`resultado` e `criacao` têm um registro por pedido (upsert por `orderId` + `etapa`):
webhook e polling chegando juntos não duplicam. Falha do `criacao` que não dá para
saber se cobrou (timeout) **não** é registrada na hora: guarda o contexto na order
(`metadata.cartaoRequisicao`) e entra como `resultado` se o pagamento aparecer
recusado, ou como `provider_error` se nunca aparecer.

Não entram: estorno e chargeback (outro assunto), Pix e boleto, e falhas de
**cobranças recorrentes** posteriores à criação da assinatura.

## Dados guardados (e os que nunca são)

- Do Mercado Pago: id, status, `status_detail`, bandeira, tipo, emissor, **6
  primeiros e 4 últimos dígitos**, parcelas, valores, modo real/teste, código de
  autorização. Só os campos listados em `extrairDadosTecnicos`: campo novo do MP
  não vaza para o banco por tabela.
- Do que **nós** enviamos (`RequisicaoDoCartao`): parcelas, emissor, se o device ID
  foi enviado (e o tamanho), cartão de terceiro, split, ambiente, tempo limite.
- **Nunca**: token do cartão, número completo, CVV, validade, CPF, nome do titular,
  device ID em si, access token.
- Falhas vistas no navegador são indícios (qualquer um pode chamar a rota): vão
  marcadas `origem: 'navegador'`, com validação rígida e limite por IP. Sequências
  longas de dígitos são apagadas das mensagens.

## Como ler a aba

Diagnóstico do período, totais (taxa de recusa, recuperadas, venda que não entrou),
quebras (motivo, responsável, bandeira, emissor, BIN, parcelas, horário, aparelho,
etapa) e a lista com cada falha. Abrindo uma falha: análise, causas, sinais **desta
tentativa**, o que dizer ao comprador, o que a equipe deve fazer e os dados técnicos.

- **Responsável**: banco emissor, antifraude do MP, dados digitados, limite/parcelas,
  nossa integração, rede, não identificado.
- **"Investigar: pode ser nosso"**: causas que dependem do nosso código ou
  configuração (credencial, parcelas divergentes, device ID, `provider_error`).
- **Recuperada**: o mesmo comprador (conta ou e-mail) teve pagamento aprovado nas
  24 h seguintes. É indício, não prova de que era o mesmo produto.

## Catalogar um código novo

Código desconhecido aparece como "Recusa não catalogada (...)". Acrescente-o em
`lib/payments/recusa-cartao.ts`: `POR_STATUS_DETAIL` (recusa do MP),
`POR_CODIGO_DA_API` (erro de validação da API) ou `POR_CODIGO_DO_TOKEN` (erro do
mercadopago.js). O teste `__tests__/payments/recusa-cartao.test.ts` lista os
códigos cobertos.

## Garantia de que não atrapalha o checkout

Nenhuma função de registro lança. Se o Mongo do log falhar, o pedido é atualizado
e o comprador recebe a resposta de sempre. O contexto anexado ao erro do provider é
propriedade **não enumerável** (não aparece em JSON nem em log). O corpo enviado ao
Mercado Pago não mudou. Provado em
`__tests__/payments/recusa-cartao-ponta-a-ponta.test.ts` (rota, provider e
`applyPaymentResult` reais).
