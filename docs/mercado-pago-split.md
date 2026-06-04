# Split de pagamentos no Mercado Pago (dividir 70% / 30%)

Este guia explica como fazer cada venda do site ser dividida automaticamente
entre **duas contas** do Mercado Pago — por exemplo, **70% para você** e
**30% para um sócio/amigo**.

> **Resumo:** o comprador paga o valor cheio normalmente. O Mercado Pago credita
> uma parte (a "comissão", chamada `application_fee`) em uma conta e o restante
> na outra. Quem decide o percentual é o site, pelo arquivo `.env`.

---

## 1. Entenda quem fica com o quê

No modelo de marketplace do Mercado Pago existem dois papéis:

| Papel | O que é | O que recebe |
|-------|---------|--------------|
| **Conta principal** (vendedor / collector) | A conta cujo `MERCADOPAGO_ACCESS_TOKEN` está no `.env` e processa os pagamentos | Fica com **o restante** (valor total − comissão) |
| **Sócio** (dono da aplicação) | A conta que cria a **Aplicação** no painel de desenvolvedores do MP | Recebe a **comissão** (`application_fee`) |

Para o seu caso (**70% para você, 30% para o amigo**):

- **Você** = conta principal (processa os pagamentos, fica com **70%**).
- **Seu amigo** = dono da aplicação MP (recebe a comissão de **30%**).
- No `.env`: `MERCADOPAGO_SPLIT_PARTNER_PERCENT=30`.

> Se preferir o contrário (você como dono da aplicação recebendo a comissão),
> os papéis se invertem. O importante: **`PARTNER_PERCENT` é sempre o percentual
> que vai para o dono da aplicação**, e a conta do `ACCESS_TOKEN` fica com o resto.

---

## 2. Passo a passo no painel do Mercado Pago

Esta parte é feita **fora do código**, no site do Mercado Pago. Só precisa ser
feita uma vez.

### a) Seu amigo cria a Aplicação (marketplace)

1. Seu amigo entra em <https://www.mercadopago.com.br/developers/panel> com a
   conta dele.
2. Cria uma nova **Aplicação** (Suas integrações → Criar aplicação).
3. No tipo de solução, escolhe **Pagamentos online → Marketplace**.
4. Anota o **Client ID** e o **Client Secret** da aplicação.
5. Configura a **Redirect URI** (URL de redirecionamento OAuth) apontando para
   o seu site, por exemplo:
   `https://domineaqui.com.br/api/admin/mercado-pago/oauth/callback`

### b) Você conecta sua conta à aplicação dele (OAuth)

Para a sua conta processar pagamentos "em nome" do marketplace e a comissão
cair na conta do seu amigo, a sua conta precisa **autorizar** a aplicação dele,
uma vez, via OAuth. O fluxo OAuth devolve um **access token** vinculado ao
marketplace — é **esse** token que vai no `MERCADOPAGO_ACCESS_TOKEN`.

Você tem duas opções:

- **Mais simples:** seu amigo gera o link de autorização e o token por você,
  seguindo a doc oficial de OAuth do MP, e te entrega o `access_token`
  resultante. Você cola no `.env`.
- **Automatizado:** implementar o endpoint de callback OAuth no site (não está
  incluído nesta entrega; posso fazer depois se quiser).

Documentação oficial:
- Split / marketplace: <https://www.mercadopago.com.br/developers/pt/docs/checkout-api/additional-content/marketplace>
- OAuth: <https://www.mercadopago.com.br/developers/pt/docs/security/oauth/introduction>

---

## 3. Configuração no `.env`

Depois de ter o access token vinculado ao marketplace:

```env
# Conta que PROCESSA os pagamentos e fica com a maior parte (você, 70%)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...token-vinculado-ao-marketplace...

# Liga o split
MERCADOPAGO_SPLIT_ENABLED=true

# Percentual que vai para o SÓCIO (dono da aplicação). 30 = 30%.
MERCADOPAGO_SPLIT_PARTNER_PERCENT=30
```

Com isso, em cada venda:

- O comprador paga **100%** do valor.
- **30%** cai na conta do seu amigo (dono da aplicação).
- **70%** cai na sua conta (a do `ACCESS_TOKEN`).

> Para mudar a divisão depois (ex.: 80/20), é só trocar
> `MERCADOPAGO_SPLIT_PARTNER_PERCENT=20` e reiniciar o site. Não precisa mexer
> em código.

---

## 4. Como testar antes de usar pra valer

1. Use o ambiente **sandbox** (`MERCADOPAGO_ENV=sandbox`) com contas de teste.
2. Crie a aplicação de teste e faça o OAuth com uma segunda conta de teste.
3. Faça uma compra de teste e confira nos relatórios do MP de cada conta que os
   valores foram divididos como esperado (70/30).
4. Confirme no painel admin do site (`/api/admin/mercado-pago/status`) que o
   campo `split.enabled` está `true` e os percentuais estão certos.
5. Só então troque para produção (`MERCADOPAGO_ENV=production`) com os tokens
   reais.

---

## 5. O que foi alterado no código

- `lib/payments/config.ts` — lê `MERCADOPAGO_SPLIT_ENABLED` e
  `MERCADOPAGO_SPLIT_PARTNER_PERCENT`, com validação (0–100).
- `lib/payments/mercado-pago/provider.ts` — adiciona `application_fee` ao
  pagamento quando o split está ligado.
- `app/api/admin/mercado-pago/status/route.ts` — mostra o status do split.
- `.env.example` — documenta as novas variáveis.

O split vem **desligado por padrão** (`MERCADOPAGO_SPLIT_ENABLED=false`), então
nada muda no comportamento atual até você concluir a configuração acima e ligar.

---

## 6. Limitações / observações

- O split via `application_fee` exige o vínculo de **marketplace/OAuth** acima.
  Não dá para dividir entre duas contas "soltas" sem esse vínculo.
- Reembolsos seguem as regras do MP para marketplace (a comissão também é
  estornada proporcionalmente).
- Assinaturas recorrentes (`preapproval`) **não** usam `application_fee` da
  mesma forma; este split se aplica aos pagamentos avulsos (planos, materiais,
  produtos, doações). Se precisar dividir assinaturas, me avise.
