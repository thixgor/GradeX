# Lembretes de avaliação com cron-job.org

Guia para deixar os **lembretes de prova** de `/admin/cronogramas` saindo
sozinhos, no horário que o admin escolheu para cada avaliação.

---

## Por que um cron externo

O projeto está no plano **Hobby da Vercel**, onde o Vercel Cron executa
**1x por dia** e o teto de jobs já está ocupado pelas outras rotinas
(`subscriptions-sweeper`, `manual-clinico-expirations`, `raffles-sweeper`,
`revisao-espacada`, `midia-sync`).

Uma execução diária não serviria aqui: o horário de envio é escolhido **por
avaliação** no painel, com precisão de minuto. Uma prova configurada para
avisar às 07:00 e outra às 21:00 precisam dos dois momentos.

Por isso esta rota **não** está em `crons` no `vercel.json` — só a
configuração de `maxDuration`. O gatilho é o
[cron-job.org](https://cron-job.org), igual ao dos e-mails agendados
(`docs/EMAIL_AGENDAMENTO_CRONJOB.md`).

---

## O endpoint

```
GET https://SEU_APP/api/cron/avaliacoes-lembretes
```

Aceita `GET` e `POST` (o cron-job.org usa GET por padrão; tanto faz).

A cada chamada, para cada avaliação futura, publicada e com lembrete ligado:

1. **Hoje é um dos dias da agenda?** A contagem sai do dia da prova para trás,
   no passo configurado — então o último lembrete cai sempre no dia dela.
2. **Já passou do horário de envio?** No relógio de Brasília
   (`America/Sao_Paulo`), não no fuso do servidor.
3. **Quem recebe?** Só alunos que acompanham aquela seção e período **e**
   ligaram "Quero receber lembretes das minhas avaliações" no próprio
   calendário. Não existe lista de "todos do período".

Quem passa nos três recebe um e-mail e uma notificação dentro do site.

### Resposta

```json
{
  "ok": true,
  "at": "2026-08-27T20:09:20.915Z",
  "hoje": "2026-08-27",
  "avaliacoesConsideradas": 2,
  "avaliacoesNoHorario": 1,
  "enviados": 1,
  "duplicadosEvitados": 0,
  "falhas": 0,
  "semDestinatario": 0
}
```

| Campo | O que significa |
|---|---|
| `avaliacoesConsideradas` | Publicadas, com lembrete ligado, nos próximos 120 dias. |
| `avaliacoesNoHorario` | Dessas, quantas caem na agenda de hoje **e** já passaram do horário. |
| `enviados` | E-mails que saíram nesta execução. |
| `duplicadosEvitados` | Alunos que já tinham recebido essa avaliação hoje. **Alto é o normal** — ver abaixo. |
| `falhas` | O SMTP recusou. A reserva é desfeita, então o próximo tique tenta de novo. |
| `semDestinatario` | A avaliação estava no horário, mas ninguém daquela seção/período tinha o opt-in ligado. |

> `duplicadosEvitados` crescendo ao longo do dia **não é erro**: é a trava
> anti-spam funcionando. Com um tique a cada 5 minutos, a primeira execução
> depois do horário envia e todas as seguintes batem no índice único e não
> mandam nada.

---

## Autenticação

Use o mesmo `CRON_SECRET` dos e-mails agendados (já existe no `.env.example`).
Gere um valor forte:

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

```bash
# Sem segredo — confirma que a rota está protegida
curl -i "https://SEU_APP/api/cron/avaliacoes-lembretes"
# → HTTP/2 401  {"error":"unauthorized"}

# Com header (recomendado)
curl -s "https://SEU_APP/api/cron/avaliacoes-lembretes" \
     -H "Authorization: Bearer SEU_SEGREDO"

# Com query string (o que dá para usar no cron-job.org gratuito)
curl -s "https://SEU_APP/api/cron/avaliacoes-lembretes?token=SEU_SEGREDO"
```

Esperado: `HTTP/2 200` e o JSON acima. Se vier `401 {"error":"unauthorized"}`,
o `CRON_SECRET` não bate (ou não foi definido no ambiente **de produção** —
lembre de redeployar depois de adicionar a variável na Vercel).

Rodar o curl duas vezes seguidas é o melhor teste que existe: a segunda
resposta deve trazer `enviados: 0` e `duplicadosEvitados` igual ao `enviados`
da primeira. Se a segunda enviar de novo, o índice único não foi criado —
confira `cronograma_lembretes_enviados` no banco.

---

## Configurando no cron-job.org

1. Em **Cronjobs → Create cronjob**, preencha:

   | Campo | Valor |
   |---|---|
   | **Title** | `DomineAqui — lembretes de avaliação` |
   | **URL** | `https://SEU_APP/api/cron/avaliacoes-lembretes?token=SEU_SEGREDO` |
   | **Schedule** | *Every 5 minutes* |
   | **Request method** | `GET` |
   | **Enable job** | ligado |

2. Em **Advanced** (recomendado):
   - **Notify on failure:** ligado.
   - **Timeout:** 60s (o teto da função; um lote cheio gasta ~40s).
3. Salve. A aba **History** mostra o JSON de cada execução — é onde conferir
   se os lembretes estão saindo.

### Se você tem plano pago no cron-job.org

Use a URL sem o token e adicione em **Headers**:

```
Authorization: Bearer SEU_SEGREDO
```

### Alternativa: crontab num servidor próprio

```cron
*/5 * * * * curl -fsS "https://SEU_APP/api/cron/avaliacoes-lembretes" -H "Authorization: Bearer SEU_SEGREDO" > /dev/null 2>&1
```

---

## Qual intervalo escolher

| Intervalo | Efeito |
|---|---|
| **5 minutos** | Recomendado. Um lembrete marcado para 19:30 sai entre 19:30 e 19:35. |
| **15 minutos** | Aceitável. O mesmo lembrete pode sair 19:44. |
| **1 hora** | O horário vira "a hora cheia seguinte": 19:30 sai às 20:00. |
| **1x por dia** | Não use. Todos os lembretes saem no horário do tique, e a configuração de horário por avaliação deixa de valer. |

O lembrete **nunca é pulado** por atraso do cron: a condição continua
verdadeira até o fim do dia em Brasília, então um tique perdido é recuperado
no seguinte.

Cada execução manda no máximo **120 e-mails**. O SMTP da Hostinger está
limitado a 3 mensagens por segundo, então esse é o teto que cabe nos 60s da
função. Num dia de muitas avaliações coincidindo, o excedente sai nos tiques
seguintes.

---

## Como configurar os lembretes no painel

Em `/admin/cronogramas`, ao criar ou editar uma avaliação:

| Campo | O que faz |
|---|---|
| **Começar a lembrar** | Quantos dias antes o primeiro lembrete sai (0 = só no dia). |
| **Repetir a cada** | N dias ou N semanas. |
| **Horário do envio** | Hora de Brasília. |
| **Recado no lembrete** | Texto livre que entra no corpo (ex.: "levar jaleco"). |
| **Interruptor** | Desliga os lembretes daquela avaliação sem apagá-la. |

A caixa **Próximos envios** mostra as datas reais que serão usadas, calculadas
pela mesma função que o cron executa — o que está na prévia é o que vai sair.

Exemplo: prova em 08/09, começar 14 dias antes, a cada 3 dias →
`27/08, 30/08, 02/09, 05/09, 08/09`.

---

## Solução de problemas

| Sintoma | Causa provável |
|---|---|
| `401 unauthorized` | `CRON_SECRET` ausente/errado em produção, ou faltou redeploy após adicionar a variável. |
| `avaliacoesConsideradas: 0` | Nenhuma avaliação futura publicada com lembrete ligado. Confira o indicador "Lembrando" no topo do painel. |
| `avaliacoesNoHorario: 0` o dia todo | Hoje não é um dos dias da agenda de nenhuma avaliação. Confira "Próximos envios" no formulário. |
| `semDestinatario` alto | Ninguém daquela seção/período ligou o opt-in. Ele fica no calendário do aluno, em `/cronogramas`. |
| `falhas` > 0 | SMTP recusando. Mesmas variáveis dos outros e-mails (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`). |
| Aluno não recebeu | Na ordem: ele ligou o opt-in? está na mesma seção **e** período da avaliação? a avaliação está publicada? a conta está banida? |
| Lembrete duplicado | Não deve acontecer (índice único por avaliação + aluno + dia). Se acontecer, verifique se não há dois cron jobs apontando para URLs diferentes do mesmo app. |

---

## Variáveis de ambiente relacionadas

| Variável | Papel |
|---|---|
| `CRON_SECRET` | Autentica a chamada. Sem ele — e fora da Vercel —, a rota responde 401. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Transporte do e-mail, compartilhado com o resto do site. |
| `NEXT_PUBLIC_APP_URL` | Vira o link do botão "Estudar agora" dentro do lembrete. |
| `MONGODB_URI` | Onde vivem as avaliações, as preferências e o registro de envios. |
