# E-mails automáticos com cron-job.org

Guia para deixar os **agendamentos de e-mail** de `/admin/emails` rodando
sozinhos, sem ninguém abrir o painel.

---

## Por que um cron externo

O projeto está no plano **Hobby da Vercel**, onde o Vercel Cron só executa
**1x por dia** — inútil para "toda terça às 9h". Além disso, o teto de cron
jobs do plano já está ocupado pelas outras rotinas (`subscriptions-sweeper`,
`manual-clinico-expirations`, `raffles-sweeper`, `revisao-espacada`).

A solução é um gatilho externo gratuito batendo em um endpoint do app. O
[cron-job.org](https://cron-job.org) faz isso de minuto em minuto sem custo.

---

## O endpoint

```
POST https://SEU_APP/api/cron/email-scheduler
```

Cada chamada faz duas coisas:

1. **Executa os agendamentos vencidos.** Para cada um, resolve os
   destinatários *naquele momento* (então um agendamento semanal para "todos os
   usuários trial" alcança quem virou trial ontem) e enfileira a campanha.
2. **Drena a fila de e-mail** — o que os agendamentos acabaram de criar e
   também o que sobrou de envios manuais grandes feitos pelo painel.

Aceita `GET` e `POST` (o cron-job.org usa GET por padrão; tanto faz).

É **idempotente**: os agendamentos são reservados atomicamente e cada mensagem
tem chave de idempotência, então duas execuções sobrepostas não mandam o e-mail
duas vezes.

### Resposta

```json
{
  "ok": true,
  "at": "2026-08-11T12:00:03.114Z",
  "tookMs": 8421,
  "schedulesRun": 1,
  "schedules": [
    { "scheduleId": "…", "name": "Resumo semanal", "status": "ok",
      "recipients": 412, "campaignId": "camp_20260811120001_a1b2c3" }
  ],
  "delivery": { "sent": 84, "failed": 0, "dead": 0, "throttled": 12 }
}
```

`throttled` alto é normal e **não é erro**: é o rate-limit segurando o ritmo do
SMTP. Essas mensagens voltam para a fila sem consumir tentativa e saem no tick
seguinte.

---

## Autenticação

Defina `CRON_SECRET` nas variáveis de ambiente da Vercel (já existe no
`.env.example`). Gere um valor forte:

```bash
openssl rand -hex 32
```

O segredo pode chegar de quatro formas — use a que o seu cron permitir:

| Forma | Exemplo |
|---|---|
| Header `Authorization` | `Authorization: Bearer SEU_SEGREDO` |
| Header dedicado | `x-cron-secret: SEU_SEGREDO` |
| Query string | `?secret=SEU_SEGREDO` |
| Query string (alias) | `?token=SEU_SEGREDO` |

> O cron-job.org só deixa configurar headers customizados no plano pago. Por
> isso a **query string** também é aceita. Como o segredo vai na URL (e portanto
> em logs de acesso), prefira o header sempre que possível e troque o
> `CRON_SECRET` se desconfiar de vazamento.

---

## Testando com curl

Antes de configurar o cron, confirme que o endpoint responde:

```bash
# Com header (recomendado)
curl -i -X POST "https://SEU_APP/api/cron/email-scheduler" \
     -H "Authorization: Bearer SEU_SEGREDO"

# Com query string (o que dá para usar no cron-job.org gratuito)
curl -i "https://SEU_APP/api/cron/email-scheduler?token=SEU_SEGREDO"
```

Esperado: `HTTP/2 200` e o JSON acima. Se vier `401 {"error":"unauthorized"}`,
o `CRON_SECRET` não bate (ou não foi definido no ambiente **de produção** —
lembre de redeployar depois de adicionar a variável na Vercel).

Para processar também os outros canais (WhatsApp e o avanço das jornadas de
lead), existe um segundo endpoint, opcional:

```bash
curl -X POST "https://SEU_APP/api/cron/comms-dispatcher" \
     -H "Authorization: Bearer SEU_SEGREDO"
```

---

## Configurando no cron-job.org

1. Crie a conta em <https://cron-job.org> e vá em **Cronjobs → Create cronjob**.
2. Preencha:

   | Campo | Valor |
   |---|---|
   | **Title** | `DomineAqui — e-mails agendados` |
   | **URL** | `https://SEU_APP/api/cron/email-scheduler?token=SEU_SEGREDO` |
   | **Schedule** | *Every 1 minute(s)* (ou a cada 5 minutos) |
   | **Request method** | `GET` (ou `POST`) |
   | **Enable job** | ligado |

3. Em **Advanced** (opcional, mas recomendado):
   - **Treat redirects as success:** desligado.
   - **Notify on failure:** ligado — você recebe e-mail se o endpoint cair.
   - **Timeout:** 60s (o endpoint gasta até ~40s enviando quando a fila está cheia).
4. Salve. A aba **History** mostra cada execução com o JSON de resposta — é o
   melhor lugar para conferir se os envios estão saindo.

### Se você tem plano pago no cron-job.org

Use a URL sem o token e adicione o header em **Headers**:

```
Authorization: Bearer SEU_SEGREDO
```

### Alternativa: crontab num servidor próprio

Se já existe um host sempre-ligado (o mesmo do worker de WhatsApp, por
exemplo), dá para dispensar o serviço externo:

```cron
* * * * * curl -fsS -X POST "https://SEU_APP/api/cron/email-scheduler" -H "Authorization: Bearer SEU_SEGREDO" > /dev/null 2>&1
```

---

## Qual intervalo escolher

| Intervalo | Quando usar |
|---|---|
| **1 minuto** | Recomendado. O horário do agendamento é respeitado com precisão de ~1 min e campanhas grandes escoam rápido (cada tick manda o que couber em ~40s). |
| **5 minutos** | Suficiente se os envios são pequenos e o horário exato não importa. Um agendamento das 9h pode sair às 9h04. |
| **> 15 minutos** | Não recomendado: uma campanha de milhares de destinatários levaria horas para escoar. |

O agendamento **nunca é pulado** por atraso do cron: o horário vencido fica
pendente e dispara no primeiro tick seguinte.

---

## Como criar um agendamento no painel

1. Vá em `/admin/emails` e monte o e-mail normalmente (assunto, preview,
   blocos, anexo).
2. Escolha os destinatários. Para agendamentos recorrentes, prefira os
   **filtros** (tipo de conta / período) em vez de selecionar pessoas na mão —
   os filtros são reavaliados a cada execução e alcançam quem entrou depois.
3. Clique em **Agendar envio**, escolha a frequência (uma vez / diário /
   semanal / mensal), o horário e — no semanal — os dias da semana.
4. Salve. O agendamento aparece na lista com a próxima execução calculada em
   **horário de Brasília** (`America/Sao_Paulo`), com horário de verão tratado
   automaticamente.

O botão **Executar agora** dispara o agendamento fora de hora, sem mexer no
calendário dele — útil para testar o conteúdo antes de deixar rodando.

---

## Solução de problemas

| Sintoma | Causa provável |
|---|---|
| `401 unauthorized` | `CRON_SECRET` ausente/errado no ambiente de produção, ou faltou redeploy após adicionar a variável. |
| `schedulesRun: 0` sempre | Nenhum agendamento está ativo, ou o `nextRunAt` ainda está no futuro. Confira a coluna "Próxima execução" no painel. |
| `status: "empty"` num agendamento | Os filtros não casaram com ninguém no momento da execução. |
| `delivery.sent: 0` com fila cheia | SMTP recusando conexão. Veja `lastError` dos destinatários na tela da campanha. |
| Campanha parada em "na fila" | O cron não está rodando. Teste o curl acima e confira o History no cron-job.org. |
| E-mails duplicados | Não deve acontecer (idempotência por campanha + destinatário). Se acontecer, verifique se não há dois cron jobs apontando para URLs diferentes do mesmo app. |

---

## Variáveis de ambiente relacionadas

| Variável | Padrão | Papel |
|---|---|---|
| `CRON_SECRET` | — | **Obrigatória.** Autentica as rotas de cron. |
| `COMMS_EMAIL_PER_SEC` | `2` | Vazão sustentada de e-mails por segundo. |
| `COMMS_EMAIL_BURST` | `10` | Rajada permitida antes de o rate-limit segurar. |
| `COMMS_BATCH_PER_CHANNEL` | `40` | Mensagens reservadas por lote em cada tick. |
| `SMTP_RATE_LIMIT` | `3` | Teto do próprio transporter (msg/s). |

Aumentar `COMMS_EMAIL_PER_SEC` acelera as campanhas, mas o SMTP compartilhado
da Hostinger derruba conexões sob rajada ("auth limit"). Suba aos poucos e
acompanhe `delivery.failed` na resposta do cron.
