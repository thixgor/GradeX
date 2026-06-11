# Split de pagamentos no Mercado Pago (dividir 70% / 30%)

Este guia explica como fazer cada venda do site ser dividida automaticamente
entre **duas contas** do Mercado Pago — por exemplo, **70% para você** e
**30% para um sócio/amigo**.

> **Resumo:** o comprador paga o valor cheio normalmente. O Mercado Pago credita
> uma parte (a "comissão", chamada `application_fee`) em uma conta e o restante
> na outra. Quem decide o percentual é o site, pelo arquivo `.env`. A ligação
> entre as duas contas é feita **uma vez**, por um botão no painel admin.

---

## 1. Entenda quem fica com o quê

No modelo de marketplace do Mercado Pago existem dois papéis:

| Papel | O que é | O que recebe |
|-------|---------|--------------|
| **Conta principal** (vendedor / collector) | A conta que **conecta** pelo botão do admin e processa os pagamentos | Fica com **o restante** (valor total − comissão) |
| **Sócio** (dono da aplicação) | A conta que cria a **Aplicação** no painel de desenvolvedores do MP | Recebe a **comissão** (`application_fee`) |

Para o seu caso (**70% para você, 30% para o amigo**):

- **Você** = conta principal (conecta no admin, processa os pagamentos, fica com **70%**).
- **Seu amigo** = dono da aplicação MP (recebe a comissão de **30%**).
- No `.env`: `MERCADOPAGO_SPLIT_PARTNER_PERCENT=30`.

---

## 2. O que o seu amigo faz (uma vez)

1. Entra em <https://www.mercadopago.com.br/developers/panel> com a conta dele.
2. Cria uma **Aplicação** (Suas integrações → Criar aplicação).
3. No tipo de solução, escolhe **Pagamentos online → Marketplace**.
4. Em **Redirect URIs** da aplicação, cadastra **exatamente** esta URL:
   `https://domineaqui.com.br/api/admin/mercado-pago/oauth/callback`
   (a mesma que aparece no painel admin do site, em Configurações → Pagamentos).
5. Copia o **Client ID** e o **Client Secret** (credenciais de produção) e te envia.

---

## 3. O que você configura no `.env` (Vercel)

Cole as credenciais que o seu amigo te passou e ligue o split:

```env
# Credenciais da aplicação de marketplace do seu amigo
MERCADOPAGO_CLIENT_ID=...
MERCADOPAGO_CLIENT_SECRET=...

# Liga o split e define a parte do sócio
MERCADOPAGO_SPLIT_ENABLED=true
MERCADOPAGO_SPLIT_PARTNER_PERCENT=30
```

> O `MERCADOPAGO_ACCESS_TOKEN` que você já tem **continua igual** — não precisa
> trocar. Depois que você conectar pelo botão (passo 4), o site passa a usar
> automaticamente o token de marketplace salvo no banco.

---

## 4. Conectar pelo painel admin (o passo que liga tudo)

1. Faça deploy com as variáveis acima.
2. Entre no site como admin → **Configurações → Pagamentos → Integração Mercado
   Pago → Divisão de pagamentos (marketplace)**.
3. Clique em **"Conectar marketplace"**.
4. Você será levado ao Mercado Pago para **fazer login com a SUA conta** e
   autorizar a aplicação do seu amigo. Confirme.
5. Pronto — o site volta para o admin mostrando **"Marketplace conectado"**.

A partir daí, **cada venda** é dividida automaticamente:

- O comprador paga **100%**.
- **30%** cai na conta do seu amigo.
- **70%** cai na sua conta.

> Para mudar a divisão depois (ex.: 80/20), troque
> `MERCADOPAGO_SPLIT_PARTNER_PERCENT=20` e faça novo deploy. Não precisa
> reconectar nem mexer em código.
>
> Para desfazer, clique em **"Desconectar marketplace"** no mesmo lugar — os
> pagamentos voltam a cair 100% na sua conta.

---

## 5. Como testar antes de usar pra valer

1. Use o ambiente **sandbox** (`MERCADOPAGO_ENV=sandbox`) com contas de teste.
2. Crie a aplicação de teste e faça o "Conectar marketplace" com uma segunda
   conta de teste.
3. Faça uma compra de teste e confira nos relatórios do MP de cada conta que os
   valores foram divididos como esperado (70/30).
4. No painel admin, confirme que aparece **"Conectado"** e o resumo
   **70% / 30%**.
5. Só então troque para produção (`MERCADOPAGO_ENV=production`) com os tokens e
   credenciais reais.

---

## 6. O que foi alterado no código

- `lib/payments/config.ts` — lê `MERCADOPAGO_SPLIT_*` e as credenciais OAuth
  (`MERCADOPAGO_CLIENT_ID/SECRET`, redirect URI).
- `lib/payments/mercado-pago/oauth.ts` — fluxo OAuth (autorização, troca de
  código por token, renovação).
- `lib/payments/mercado-pago/marketplace-store.ts` — salva a conexão no banco
  (coleção `mercadopago_marketplace`), resolve o token efetivo e renova quando
  perto de expirar.
- `lib/payments/mercado-pago/provider.ts` — usa o token efetivo e adiciona
  `application_fee` quando o split está ligado.
- `app/api/admin/mercado-pago/oauth/{start,callback,disconnect}` — rotas do
  fluxo de conexão.
- `app/api/admin/mercado-pago/status` + `app/admin/settings` — botão e status no
  painel admin.

O split vem **desligado por padrão**, então nada muda no comportamento atual até
você conectar o marketplace e ligar `MERCADOPAGO_SPLIT_ENABLED`.

---

## 7. Limitações / observações

- O token de marketplace é guardado na coleção `mercadopago_marketplace` do
  MongoDB (incluindo o refresh token). Trate o acesso ao banco como sensível.
- O token expira em ~180 dias; o site **renova sozinho** usando o refresh token
  enquanto a conexão existir.
- Reembolsos seguem as regras do MP para marketplace (a comissão também é
  estornada proporcionalmente).
- Assinaturas recorrentes (`preapproval`) usam o mesmo token de marketplace, mas
  o `application_fee` deste split se aplica aos pagamentos avulsos (planos,
  materiais, produtos, doações). Se precisar dividir assinaturas, me avise.
