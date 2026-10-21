# Entrega de e-mail — como funciona e o que conferir

Todo e-mail do site sai por `enviarEmail` (`lib/envio-de-email.ts`). O
`transporter.sendMail` de `lib/mail.ts` continua existindo, mas é só uma fachada
para ele.

## O que a camada de envio faz

| Problema antigo | O que acontece agora |
| --- | --- |
| Conexão velha no pool (a instância serverless congela entre requisições) derrubava o primeiro envio | Pool parado há mais de `SMTP_POOL_IDLE_MS` (20 s) é trocado antes de usar; erro de conexão descarta o pool na hora |
| Falha passageira (421/451, "auth limit", timeout) era definitiva | Até 3 tentativas com espera crescente, dentro de `SMTP_RETRY_BUDGET_MS` (20 s) |
| Hostinger fora do ar = nenhum e-mail | Servidor SMTP de reserva opcional (`SMTP_FALLBACK_*`) |
| E-mail só com HTML (pontua como spam) | Versão em texto gerada a partir do HTML |
| Respostas iam para `no-reply@` | `Reply-To: contato@domineaqui.com.br` (ou `SMTP_REPLY_TO`) |
| E-mail disparado sem `await` morria quando a função respondia | Envios aguardados (`await` ou `deliverTransactionalEmails`) |
| Nenhum rastro | Cada envio vira uma linha em `email_envios` (45 dias), visível em **/admin/users → E-mails** |

Falhas que não melhoram com o tempo (caixa inexistente, mensagem grande demais)
não são repetidas. A Serial Key recusada por tamanho é reenviada **sem os PDFs**
— a key e o link de ativação chegam, e o material fica para baixar na
plataforma.

## Variáveis de ambiente

| Variável | Padrão | Para quê |
| --- | --- | --- |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | `smtp.hostinger.com` / `465` | Servidor principal |
| `SMTP_SECURE` | `true` na porta 465, `false` nas outras | Antes era sempre `true`: com a porta 587 o handshake nunca fechava |
| `SMTP_FROM_ADDRESS` | — | Troca o endereço do remetente mantendo o nome ("DomineAqui - Suporte") |
| `SMTP_REPLY_TO` | `contato@domineaqui.com.br` | Para onde vão as respostas |
| `SMTP_POOL_IDLE_MS` | `20000` | Ociosidade máxima do pool antes de trocar a conexão |
| `SMTP_RETRY_BUDGET_MS` | `20000` | Não começa nova tentativa depois disso |
| `SMTP_FALLBACK_HOST` / `_PORT` / `_USER` / `_PASS` | — / `587` | Servidor de reserva (Brevo, SendGrid, Amazon SES…). Sem `SMTP_FALLBACK_HOST`, desligado |
| `SMTP_FALLBACK_FROM_ADDRESS` | — | Remetente verificado no provedor de reserva |
| `RESET_PASSWORD_LINK_MINUTES` | `60` | Validade do link de "Esqueci minha senha" |

## DNS do domínio (fora do código, mas decide se o e-mail cai na caixa)

Sem estes registros, Gmail e Outlook aceitam o e-mail e o jogam no spam — ou
descartam calado. Conferir no painel DNS de `domineaqui.com.br`:

- **SPF** — um único TXT na raiz com `include:_spf.mail.hostinger.com`
  (e o `include:` do provedor de reserva, se usar). Dois registros SPF
  separados invalidam os dois.
- **DKIM** — os CNAMEs `hostingermail1._domainkey`, `hostingermail2._domainkey`
  e `hostingermail3._domainkey` que o hPanel mostra em *E-mails → Configurações
  DNS*.
- **DMARC** — TXT em `_dmarc` com pelo menos `v=DMARC1; p=none; rua=mailto:contato@domineaqui.com.br`.
- `no-reply@domineaqui.com.br` precisa ser a caixa do `SMTP_USER` ou um alias
  dela; senão a Hostinger recusa com "553 Sender address rejected".

Teste rápido: mande um e-mail do site para o endereço que o
[mail-tester.com](https://www.mail-tester.com) mostra e veja a nota.

## Senha

- **Esqueci minha senha**: os 3 links mais recentes valem ao mesmo tempo (o
  pedido novo não mata o que ainda está chegando), por 60 min. Se o SMTP falhar,
  a tela diz que falhou em vez de "verifique sua caixa".
- **Perfil → Configurações → Senha**: troca com a senha atual, sem sair da
  conta; conta do Google cria a primeira senha; "Esqueci a senha atual" manda o
  link sem deslogar.
- **/admin/users → Senha**: gera senha provisória para o admin mandar pelo
  WhatsApp (mensagem pronta), ou envia o link por e-mail. Fica registrado na
  trilha de segurança do painel. Senha de outro administrador não se redefine
  por ali.

Toda troca de senha derruba as sessões dos outros aparelhos e manda um aviso
"sua senha foi alterada" para a pessoa.

## Depois do deploy

`npm run db:indexes` cria o índice de `users.resetPasswordTokens.hash`. Os
índices de `email_envios` (incluindo o TTL de 45 dias) são garantidos uma vez
por instância pelo próprio registro.
