# Comunicação Multicanal (E-mail + WhatsApp)

Sistema de envio resiliente baseado em **fila persistente (outbox) no MongoDB**,
com **adapters plugáveis por canal**. Rotas serverless nunca enviam direto —
elas só enfileiram, e o próprio endpoint de envio drena a fila na hora (sem
depender de Vercel Cron, que não é usado por este projeto).

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
      │  drainQueueNow() chamado DIRETO pelo endpoint de envio (sem cron)
      │  claimBatch() reserva com lease atômico + takeToken() (rate-limit)
      ▼
  ChannelAdapter (email | whatsapp | …)
      ├─ email    → transporter pooled (lib/mail.ts) → SMTP Hostinger
      └─ whatsapp → HTTP POST → server/whatsapp-worker.js (Baileys, always-on)
```

> **Este projeto NÃO usa Vercel Cron para a fila** (o plano Hobby já usa o teto
> de cron jobs com outras rotinas do sistema). O processamento acontece por
> três vias, sem depender de agendamento algum: (1) o próprio envio drena a
> fila antes de responder, (2) o botão "Processar fila agora" no admin, e (3)
> opcionalmente um ticker externo (`scripts/comms-ticker.js`) rodando fora da
> Vercel. Ver seção "Acionando o dispatcher" abaixo.

### Arquivos

| Arquivo | Papel |
|---|---|
| `lib/comms/types.ts` | Tipos + interface `ChannelAdapter` (Strategy/Adapter) |
| `lib/comms/outbox.ts` | Fila: `enqueue`, `enqueueMany`, `claimBatch`, `markSent`, `markFailed`, backoff |
| `lib/comms/rate-limit.ts` | Token bucket de saída por canal (respeita o provedor) |
| `lib/comms/process.ts` | Núcleo do processamento (`processChannel`, `drainQueueNow`) |
| `lib/comms/channels/email.ts` | Adapter de e-mail (transporter pooled) |
| `lib/comms/channels/whatsapp.ts` | Adapter de WhatsApp → chama o worker via HTTP |
| `lib/comms/email-render.ts` | Template de marketing + `personalize` (compartilhado) |
| `lib/comms/registry.ts` | Mapa canal → adapter (adicionar SMS/push aqui) |
| `lib/comms/dispatch.ts` | `dispatch`/`dispatchBulk`: enfileira nos canais escolhidos |
| `app/api/cron/comms-dispatcher/route.ts` | Endpoint de processamento (**não** agendado no Vercel Cron) |
| `app/api/admin/social-media/dispatch-now/route.ts` | Botão "Processar fila agora" (admin) |
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

## Acionando o dispatcher (sem Vercel Cron)

**Este projeto não registra `comms-dispatcher` no `vercel.json`** — o Hobby já
usa o teto de cron jobs com as outras rotinas do sistema (subscriptions-sweeper,
manual-clinico-expirations, raffles-sweeper, revisao-espacada), e adicionar
mais um quebrava o deploy. Em vez de cron, o processamento acontece assim:

1. **Instantâneo (padrão):** todo envio pela Central Social-Media já drena a
   própria fila antes de responder (`drainQueueNow`, até ~20s de orçamento) —
   cobre a grande maioria dos casos sem nenhuma configuração extra.
2. **Botão "Processar fila agora"** (aba Histórico de `/admin/social-media`):
   drena manualmente o que sobrou de lotes grandes. Sempre disponível, admin-autenticado.
3. **Ticker externo (opcional):** se quiser processamento contínuo mesmo sem
   ninguém no admin (ex.: para as jornadas de nurturing avançarem sozinhas),
   rode o ticker num host sempre-ligado:
   ```bash
   export APP_URL="https://domineaqui.com.br"
   export CRON_SECRET="<mesmo do .env>"
   npm run comms:ticker
   # Com PM2 (junto do worker de WhatsApp):
   pm2 start "npm run comms:ticker" --name comms-ticker && pm2 save
   ```
   Alternativa sem instalar nada: um serviço de cron externo gratuito (ex.:
   cron-job.org) apontando pra `POST https://SEU_APP/api/cron/comms-dispatcher`
   com header `Authorization: Bearer <CRON_SECRET>`.

Sem nenhuma das duas últimas opções configuradas, as jornadas de nurturing
(que dependem de `advanceSequences()` rodando periodicamente) só avançam
quando alguém aciona o processamento manualmente ou faz um novo envio pela
Central. Para jornadas 100% automáticas, configure o ticker.

## Operação

- **Envio instantâneo:** desde esta versão, `POST /api/admin/social-media/send`
  não só enfileira — ele mesmo drena a fila recém-criada antes de responder
  (`lib/comms/process.ts`, `drainQueueNow`), então o admin já vê "Enviado: X de
  Y" na hora, sem depender do cron/ticker para lotes pequenos/médios. Só o que
  não couber no orçamento de tempo da função (20s no envio, para caber nos 60s
  do plano Hobby) fica "pending" à espera do próximo processamento.
- **"Processar fila agora"** (botão na aba Histórico de `/admin/social-media`,
  ou `POST /api/admin/social-media/dispatch-now`, admin-autenticado): drena o
  que sobrou manualmente, sem precisar do CRON_SECRET.
- **Forçar processamento via curl** (equivalente ao ticker, sem instalar nada):
  ```bash
  curl -X POST https://SEU_APP/api/cron/comms-dispatcher \
       -H "Authorization: Bearer $CRON_SECRET"
  ```
- **Auditar envios**: consultar `outbox_messages` por `status`, `campaignId`,
  `to.email`/`to.leadUuid`. `statsByStatus()` retorna a contagem por status.
- **Reprocessar dead-letters**: alterar `status` de `dead` para `pending` e
  zerar `nextAttemptAt`.

---

---

## Parte 3 — Central "Social-Media" (unificada)

- **UI:** `app/admin/social-media` — abas *Nova comunicação* (escolhe canal:
  e-mail, WhatsApp ou ambos; público: contatos/usuários/campanha/**lista
  manual**), *Histórico* unificado e *Jornadas* (com cancelamento de matrículas).
  Card no painel admin.
- **APIs:** `POST /api/admin/social-media/send` (enfileira multicanal),
  `POST /api/admin/social-media/preview` (renderiza sem enviar),
  `GET /api/admin/social-media/history` (auditoria a partir da outbox),
  `GET|POST /api/admin/social-media/sequences` (listar / criar jornada padrão),
  `GET|POST /api/admin/social-media/enrollments` (listar/cancelar matrículas),
  `POST /api/admin/social-media/dispatch-now` (drena a fila sob demanda).
- **Editor visual de e-mail (blocos):** o composer de e-mail agora tem dois
  modos — *Blocos* (padrão) e *HTML avançado*. No modo Blocos, monta-se o
  e-mail com os mesmos tipos de bloco de `/admin/emails` (título, texto,
  destaque, lista, botão, imagem, citação); o HTML final usa as mesmas classes
  CSS do template de marketing (`lib/comms/email-blocks.ts`, compartilhado).
  Trocar para HTML avançado dá acesso ao HTML bruto para quem precisar de algo
  fora dos blocos padrão.
- **Templates de WhatsApp:** biblioteca com ~13 mensagens prontas
  (`lib/comms/whatsapp-templates.ts`), organizadas por categoria de persuasão
  (reciprocidade, check-in, prova social, autoridade, compromisso, escassez,
  reengajamento). Seletor disponível no composer do Social-Media e no campo
  "Mensagem do 1º toque" das campanhas de leads — insere o texto pronto, que
  o admin pode editar livremente antes de enviar.
- **Personalização:** botões de token (`{{firstName}}`, `{{cidade}}`,
  `{{persuasiveTag}}`, `{{totalStudents}}`, `{{campaignLeads}}`,
  `{{campaignName}}`, `{{authority}}`) inserem a variável no cursor do campo
  (assunto/conteúdo/texto do WhatsApp). Cada destinatário recebe o conteúdo
  renderizado com seu **próprio** nome, cidade e tag persuasiva antes de ser
  enfileirado (mesmo mecanismo das jornadas). Além disso, e-mail **e** WhatsApp
  aceitam `%nome%`, `%nome completo%` (se houver sobrenome cadastrado) e
  `%cidade%` (se o lead tiver cidade geolocalizada) — resolvidos pelo adapter
  no momento do envio, com fallback gracioso quando o dado não existe
  (`personalize()` em `lib/comms/email-render.ts`, reaproveitado pelos dois
  canais). As variáveis de prova social (`totalStudents`, `campaignLeads`) são
  calculadas **uma vez por disparo**, não por destinatário — evita milhares de
  queries redundantes em campanhas grandes.
- **Envio manual (lista colada):** público "Lista manual" aceita e-mails e/ou
  telefones colados (um por linha ou separados por vírgula/`;`). Detecção
  automática por regex/E.164 — cada linha vira e-mail ou WhatsApp. Uma tag
  persuasiva única pode ser aplicada a toda a lista. Por padrão assume
  consentimento concedido (é uma ação explícita do admin), mas o checkbox de
  LGPD continua disponível para desligar isso.
- **Pré-visualização:** botão "Pré-visualizar" renderiza o e-mail (iframe
  sandboxed com o HTML final, com assunto) e o WhatsApp (balão de chat) usando
  um nome/tag de exemplo editáveis — sem enviar nada. Mesma função de
  renderização usada no envio real (`lib/comms/persuasion.ts` +
  `lib/comms/email-render.ts`), então a prévia é fiel.
- **Consentimento (LGPD):** `lib/comms/contacts.ts` + coleção `comms_contacts`
  guardam consentimento por canal. `dispatch({ checkConsent: true })` pula quem
  não consentiu e anexa um snapshot do consentimento a cada mensagem.
- **Histórico unificado:** `lib/comms/history.ts` grava em `email_history` e
  `whatsapp_history` a cada envio, além da outbox (fonte da verdade).
- **Cancelar jornada de nurturing:** na aba *Jornadas*, "Ver matrículas ativas"
  lista quem está numa sequência (nome/contato, passo atual, próximo envio) com
  botão "Cancelar" por lead, ou "Cancelar todas" para pausar a jornada inteira.
  Cancelar não desfaz mensagens já enviadas, só impede os próximos passos.
  Backend: `stopEnrollment`/`stopAllEnrollments`/`stopEnrollmentsForTarget` em
  `lib/comms/sequences.ts`.

## Parte 4 — Leads aprimorados

- **UUID do registro do lead:** `leadUuid` (v4) em cada lead (o formulário
  preenchido por e-mail/nome/telefone) — usado internamente pela fila/histórico,
  nunca aparece em URL. Migração idempotente: `npm run backfill-lead-uuid`.
- **UUID da campanha (o que aparece em `/lead/[slug]`):** `LeadCampaign.campaignUuid`
  (v4) é o identificador interno estável da campanha. A **URL pública continua
  pelo `slug`** (legível, bom pra marketing — ex.: `/lead/ebook-anatomia`), mas
  em colisão de nome o desempate agora usa um **sufixo aleatório** (`randomSlugSuffix`,
  hex de 6 chars) em vez do contador sequencial antigo (`-1`, `-2`, `-3`), que
  expunha quantas campanhas parecidas você já tinha criado. Migração idempotente
  e não-destrutiva (não altera slugs já divulgados): `npm run backfill-campaign-uuid`.
- **Metatag persuasiva:** `Lead.persuasiveTag` (+ `LeadCampaign.defaultPersuasiveTag`).
  Editável por lead via `POST /api/admin/leads/update-lead`.
- **Contato em e-mail E WhatsApp:** o formulário do lead pede telefone
  (**`collectPhone: true` por padrão** em campanhas novas) + checkbox de opt-in
  de WhatsApp; o contato é gravado em `comms_contacts` e o material é entregue
  por e-mail (imediato) e/ou WhatsApp (fila), conforme `LeadCampaign.channels`.
  Configurável por campanha em `app/admin/leads/new` e `app/admin/leads/[id]`
  (card "Comunicação Multicanal": pedir/obrigar WhatsApp, ativar entrega por
  WhatsApp, mensagem do 1º toque, tag persuasiva padrão, jornada de nurturing).
  **Campanhas criadas antes desta versão** não pediam telefone (a UI não
  existia) — rode `npm run backfill-collect-phone` uma vez para ligar a coleta
  em todas elas (não sobrescreve o que já estiver ligado).

## Parte 5 — Persuasão e jornada

- **Variáveis dinâmicas** (`lib/comms/persuasion.ts`): `{{firstName}}`,
  `{{persuasiveTag}}`, `{{totalStudents}}`, `{{campaignLeads}}`, `{{authority}}`,
  escassez legítima (`{{spotsLeft}}`, `{{offerEndsAt}}` — só com dados reais).
- **Motor de sequência** (`lib/comms/sequences.ts`): `sequences` +
  `sequence_enrollments`. O lead é matriculado na captura (se a campanha tiver
  `sequenceId`); `advanceSequences()` enfileira cada passo na hora certa, mas
  só roda quando algo aciona o processamento (envio pela Central, botão
  "Processar fila agora" ou o ticker externo) — **sem o ticker configurado, as
  jornadas não avançam sozinhas**, já que este projeto não usa Vercel Cron.
- **Jornada padrão** (`lib/comms/default-journey.ts`, chave
  `lead-journey-default`): reciprocidade → autoridade/prova social → compromisso
  → prova social → oferta → urgência, com timing psicológico (T+1h … T+7d).
  Crie pelo painel (aba Jornadas → "Criar jornada padrão") e associe a chave ao
  campo `sequenceId` da campanha.
