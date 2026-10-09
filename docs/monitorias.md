# Monitorias — como funciona

Marketplace de aulas entre usuários: quem domina uma matéria anuncia; quem
precisa contrata, assina contrato e paga por PIX. A plataforma recebe o
dinheiro, segura em **garantia** e repassa **90%** ao monitor depois da aula
(10% ficam de taxa de intermediação).

> "Monitor" aqui NÃO é o cargo de equipe `user.secondaryRole === 'monitor'`.
> No código, quem anuncia é um **tutor**; as coleções são `monitorias_*`.

## Jornada

```
Monitor                                   Aluno
───────                                   ─────
1. Perfil, foto, chave PIX (código no
   e-mail), Termos do Monitor
2. Anúncio (wizard 6 passos) → análise
3. Admin aprova → vitrine
4. (Agenda direta) assina a oferta-padrão
                                          5. Escolhe: agendar direto | negociar | a combinar
                                          6. Assina o contrato (código no e-mail)
                                          7. Paga o PIX (checkout próprio, 4 passos)
8. Aula confirmada · coloca link da reunião
                       ── aula acontece ──
                                          9. Avalia (ou reporta problema em até 48h)
10. 48h depois: valor liberado
11. Admin faz o PIX, anexa comprovante + E2E → monitor recebe e-mail e PDF
```

### Modos de contratação (o monitor liga um ou mais)

| Modo | O aluno… | Monitor assina… |
|---|---|---|
| Agendamento direto | escolhe dia/hora livre (Brasília) e duração entre o mínimo e o máximo do monitor; o horário fica travado 30 min | a **oferta-padrão** uma vez (vale para toda reserva direta) |
| Negociar no chat | conversa; os dois trocam propostas (data, duração, valor, conteúdos, alunos) | cada contrato, com código no e-mail |
| A combinar | igual, mas a vitrine mostra "a partir de" e a 1ª proposta é do monitor | idem |

Aula em grupo: o organizador recebe um link de convite; cada colega assina o
próprio contrato e paga a sua parte. Se o grupo não pagar todo até o prazo,
**todos são reembolsados** — ou o monitor confirma "só com quem pagou".

## Dinheiro

- Valores em **centavos inteiros** (`lib/monitorias/dinheiro.ts`). Taxa =
  `floor(10%)`, monitor = resto: a soma nunca perde centavo.
- O preço vem SEMPRE do servidor (assento fixado no aceite). O checkout não
  recebe valor do navegador.
- Taxa do PIX do Mercado Pago é paga pelo aluno (política de `lib/payments/fees.ts`).
- Se o split de sócio do MP estiver ligado, a comissão do sócio incide só
  sobre os 10% da plataforma (`commissionableAmount`).
- Estados do repasse: `em_garantia → liberado → em_pagamento → pago`
  (ou `estornado`). Estorno depois do repasse vira **saldo devedor**, abatido
  do próximo pagamento.
- `monitorias_lancamentos` é um livro-razão só de inserção.

## Cancelamento e reembolso (`lib/monitorias/politica.ts`)

| Quem | Quando | Resultado |
|---|---|---|
| Aluno | ≥ 24h antes | 100% automático |
| Aluno | < 24h | ticket no suporte; reserva em disputa; admin decide |
| Monitor | qualquer hora | 100% para todos + strike (3 em 90 dias suspende) |
| Aluno | até 48h após a aula | "Reportar problema" → disputa |

Reembolso: intenção gravada com compare-and-set + chave de idempotência
`refund:<assento>:<n>` enviada ao MP. Falhou? Fica "processando" e o cron
tenta de novo com a mesma chave.

## Contratos e PDFs

- Texto em `lib/monitorias/documentos/` (termos versionados, contrato, oferta).
- Dados congelados no contrato + **hash SHA-256**; assinar exige mandar o hash
  que a tela mostrou (se o contrato mudou, a assinatura é recusada).
- PDFs gerados no servidor (`lib/monitorias/pdf.ts`): contrato com página de
  evidências e QR, comprovante de pagamento, demonstrativo de venda,
  comprovante de repasse e termos aceitos.
- Verificação pública: `/monitorias/documentos/verificar/<código>`.
- ⚠️ O texto foi escrito para afastar ao máximo a responsabilidade da
  plataforma, mas o CDC não permite afastar tudo. **Revisar com advogado** antes
  de lançar; e validar com contador a parte fiscal da intermediação.

## Segurança

- Chave PIX cifrada (AES-256-GCM, `MONITORIAS_PIX_SECRET`); titular = o próprio
  monitor; troca exige código no e-mail e só vale após **48h** (com alerta).
  O admin revela a chave por ação auditada.
- Sem conflito de horário: índice único `(tutorId, inicioBloco)` em blocos de 30 min.
- Toda transição de estado é compare-and-set com `versao`.
- Contatos pessoais ocultados no chat e nas perguntas antes do pagamento.
- Link da reunião só para quem pagou (nunca por e-mail).
- Vídeos: só YouTube/Instagram, guardados por ID; iframe montado pelo servidor.
- Links externos: https, sem IP/credenciais, aviso antes de sair do site.

## Operação

- Variáveis: ver o bloco "Monitorias" em `.env.example`.
- Depois do deploy: `npm run db:indexes` (índices únicos são regra de negócio).
- Cron horário: `/api/cron/monitorias` (em `vercel.json`).
- Admin: `/admin/monitorias` — moderação, disputas, repasses, denúncias.
- Repasse manual: criar pagamento → revelar chave → PIX pelo banco → anexar
  comprovante (Blob privado) → informar E2E.
