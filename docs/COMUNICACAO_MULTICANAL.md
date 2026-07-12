# Comunicação Multicanal (E-mail + WhatsApp)

Sistema de envio resiliente baseado em **fila persistente (outbox) no MongoDB**,
drenada por um **worker cron**, com **adapters plugáveis por canal**. Rotas
serverless nunca enviam direto — elas só enfileiram.

Esta é a **Fase 0 + Fase 1 (e-mail) + adapter/worker de WhatsApp** do plano. As
fases seguintes (central "Social-Media", leads com UUID/metatag, sequências de
persuasão) reaproveitam esta mesma fila.

---

## Arquitetura

```
Rota serverless (campanha, lead, etc.)
      │  dispatch()/dispatchBulk()  → enfileira 1 doc por canal
      ▼
MongoDB: outbox_messages   ← fila + log de auditoria por destinatário
      ▲                    (status: pending→processing→sent/delivered/failed/dead/skipped)
      │  Vercel Cron (* * * * *) → GET /api/cron/comms-dispatcher
      │  claimBatch() reserva com lease atômico + takeToken() (rate-limit)
      ▼
  ChannelAdapter (email | whatsapp | …)
      ├─ email    → transporter pooled (lib/mail.ts) → SMTP Hostinger
      └─ whatsapp → HTTP POST → server/whatsapp-worker.js (Baileys, always-on)
```

### Arquivos

| Arquivo | Papel |
|---|---|
| `lib/comms/types.ts` | Tipos + interface `ChannelAdapter` (Strategy/Adapter) |
| `lib/comms/outbox.ts` | Fila: `enqueue`, `enqueueMany`, `claimBatch`, `markSent`, `markFailed`, backoff |
| `lib/comms/rate-limit.ts` | Token bucket de saída por canal (respeita o provedor) |
| `lib/comms/channels/email.ts` | Adapter de e-mail (transporter pooled) |
| `lib/comms/channels/whatsapp.ts` | Adapter de WhatsApp → chama o worker via HTTP |
| `lib/comms/email-render.ts` | Template de marketing + `personalize` (compartilhado) |
| `lib/comms/registry.ts` | Mapa canal → adapter (adicionar SMS/push aqui) |
| `lib/comms/dispatch.ts` | `dispatch`/`dispatchBulk`: enfileira nos canais escolhidos |
| `app/api/cron/comms-dispatcher/route.ts` | Worker cron que drena a fila |
| `server/whatsapp-worker.js` | Cliente Baileys **always-on** (fora da Vercel) |

### Coleções MongoDB (criadas sob demanda)

- `outbox_messages` — fila e auditoria. Índices criados automaticamente.
- `comms_rate_buckets` — estado do token bucket por canal.

---

## Como enfileirar uma mensagem (código)

```ts
import { dispatch } from '@/lib/comms/dispatch'

await dispatch({
  channels: ['email', 'whatsapp'], // só e-mail, só whatsapp, ou ambos
  to: { email, phoneE164, name, leadUuid },
  templateKey: 'lead-material',
  payload: { subject, content, previewText },
  idempotencyKey: `lead-material:${leadUuid}`, // evita duplicidade
})
```

Canais sem dados de contato (ex.: sem telefone) são pulados automaticamente.

---

## Parte 1 — E-mail: o que mudou e por quê

**Antes:** `app/api/admin/emails/send/route.ts` disparava até **50 e-mails
simultâneos** por lote via `Promise.all`, dentro do request. O SMTP compartilhado
da Hostinger derrubava as conexões → erros de **"auth limit"** (~67 falhas), sem
retry e sem log persistente.

**Agora:**
1. **Transporter pooled** (`lib/mail.ts`): `pool:true`, `maxConnections`,
   `maxMessages`, `rateLimit` — sozinho já elimina a maior parte das falhas.
   Ajustável por env (`SMTP_MAX_CONNECTIONS`, `SMTP_RATE_LIMIT`, …).
2. **Fila assíncrona**: a rota agora só enfileira e responde na hora. O cron
   envia com rate-limit e **retry com backoff exponencial + jitter** (até 5
   tentativas; depois vai para `dead` para inspeção).
3. **Log por destinatário**: cada `outbox_messages` guarda status, tentativas,
   erro, `providerMessageId` e timestamps — auditável depois.

### Entregabilidade (fazer no DNS, fora do código)

- **SPF, DKIM, DMARC** no domínio `domineaqui.com.br` — sem eles, provedores
  marcam como spam/spoof.
- **Warm-up**: subir volume gradualmente; domínio "frio" enviando milhares =
  bloqueio.
- **List-Unsubscribe** + supressão de hard bounces (próxima fase).
- Para volume alto, avaliar **migrar campanha para um ESP com API** (Amazon SES /
  Resend) — entra como mais um adapter, sem mudar a arquitetura.

---

## Parte 2 — WhatsApp NÃO-OFICIAL: setup do worker

> ⚠️ **Aviso de risco.** A integração não-oficial (Baileys) **viola os Termos do
> WhatsApp** e o número pode ser **banido a qualquer momento**. Use um número
> **dedicado/descartável**, aqueça o volume devagar, respeite opt-out e mantenha
> a API oficial (Meta Cloud) como plano B. O adapter é plugável: migrar depois
> **não** exige reescrever o sistema.

### Por que um processo separado?

O Baileys mantém uma conexão WebSocket persistente + sessão por QR code. Isso
**não roda em serverless** (Vercel). O worker precisa de um host **sempre-ligado**
(VPS, Railway, Render, Fly.io, mini-servidor caseiro).

### Passo a passo

1. **Provisione um host always-on** e clone o repositório (ou só a pasta `server/`).
2. **Instale as dependências do worker** (declaradas em `optionalDependencies`):
   ```bash
   npm install @whiskeysockets/baileys qrcode-terminal pino
   ```
3. **Defina as variáveis** no host do worker:
   ```bash
   export WHATSAPP_WORKER_SECRET="<mesmo valor do .env do app>"
   export WHATSAPP_WORKER_PORT=8088
   # opcional: WHATSAPP_SESSION_DIR, WHATSAPP_MIN_INTERVAL_MS
   ```
4. **Inicie e autentique** (primeira vez):
   ```bash
   npm run wa:worker
   ```
   Escaneie o **QR code** no terminal com o WhatsApp do número dedicado. A sessão
   é salva em `.wa-session/` (já no `.gitignore` — **nunca** commitar) e persiste
   entre reinícios.
5. **Exponha o worker** de forma segura (HTTPS + firewall) e configure no app:
   ```bash
   WHATSAPP_WORKER_URL=https://seu-worker.exemplo.com
   WHATSAPP_WORKER_SECRET=<o mesmo segredo>
   ```

### Endpoints do worker

| Método | Rota | Auth | Uso |
|---|---|---|---|
| `GET` | `/status` | pública | `{ connection, hasQr }` — health check |
| `GET` | `/qr` | Bearer | string do QR atual (autenticar sem terminal) |
| `POST` | `/send` | Bearer | `{ to, text }` → `{ ok, messageId }` |

O `/send` retorna **503** quando desconectado (o dispatcher reagenda) e **422**
para número inexistente no WhatsApp (falha permanente → dead-letter).

### Contrato com o adapter serverless

`lib/comms/channels/whatsapp.ts` faz `POST {WHATSAPP_WORKER_URL}/send` com
`Authorization: Bearer {WHATSAPP_WORKER_SECRET}`. Erros 5xx/429/timeout são
transitórios (retry com backoff); 4xx (exceto 429) são permanentes.

---

## Operação

- **Forçar processamento da fila** (sem esperar o cron):
  ```bash
  curl -X POST https://SEU_APP/api/cron/comms-dispatcher \
       -H "Authorization: Bearer $CRON_SECRET"
  ```
- **Auditar envios**: consultar `outbox_messages` por `status`, `campaignId`,
  `to.email`/`to.leadUuid`. `statsByStatus()` retorna a contagem por status.
- **Reprocessar dead-letters**: alterar `status` de `dead` para `pending` e
  zerar `nextAttemptAt`.

---

## Próximas fases (do plano aprovado)

- **F3 — Central "Social-Media"**: UI unificada, preferências/consentimento
  (LGPD) em `comms_contacts`, histórico unificado.
- **F4 — Leads**: `leadUuid`, metatag persuasiva, captura de telefone/consentimento.
- **F5 — Persuasão**: motor de sequência (jornada), gatilhos de prova social,
  autoridade, escassez legítima, reciprocidade, personalização.
