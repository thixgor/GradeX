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

Saídas do grupo (cada assento é independente — contrato, pagamento, repasse):
- Quem sai é reembolsado pela política normal; o valor por pessoa de quem
  fica **não muda** e os repasses dos outros não são tocados.
- O organizador com colegas ativos sai só do próprio assento.
- Se todos os que ficaram já pagaram, o monitor é avisado para confirmar com
  eles. Se o último sair, a reserva é encerrada e o horário volta à agenda.
- Quem saiu não volta pelo convite (evita cobrança nova sobre assento antigo);
  vê o histórico só para leitura. Nada é apagado: assento, repasse estornado,
  lançamentos e contrato (rescindido, com o motivo) ficam registrados.
- Reembolso que o Mercado Pago não confirma na hora fica "em andamento" e a
  varredura conclui; a saída vale do mesmo jeito.

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
- Estorno é idempotente pela chave do reembolso (`Repasse.estornos`) e
  cumulativo: dois parciais nunca descontam duas vezes do valor cheio.
- A garantia só libera repasse de assento sem pendência (reembolso em
  andamento/falho ou pedido de cancelamento no suporte —
  `Participacao.cancelamentoPedidoEm`); resolvida a pendência,
  `liberarSePronta` solta o resto.
- Reembolso em lote grava a intenção em todos os assentos antes de chamar o
  Mercado Pago; a varredura retoma os que ficaram e reembolsa assento pago
  que tenha sobrado numa reserva encerrada.
- PIX: criação serializada por assento; segundo pagamento do mesmo assento é
  devolvido; contestação que passa por mediação também estorna o repasse;
  em produção o admin não aprova "na mão" pagamento de monitoria.

### Pagamento: nada em dobro, nada pela metade

| Situação | O que acontece |
|---|---|
| Dois cliques / duas abas em "pagar" | Um PIX só: o segundo espera o QR do primeiro (`esperarPix`) e recebe o MESMO |
| Recarregar a página | Reaproveita o PIX válido; não cria transação |
| Aprovado no MP, função caiu antes do assento | Reaplicado por: aviso repetido do MP (`effects.ts` reexecuta `aoAprovarPagamento` em `approved → approved`), volta do aluno ao checkout (conclui em vez de gerar outro PIX) e varredura 2b (`curarPagamentosDaReserva`) |
| Assento pago, repasse/avisos/confirmação não rodaram | `concluirAprovacao` é idempotente: repasse com índice único, avisos marcados (`pagamentoAvisadoEm`), confirmação com trava curta (`Reserva.confirmandoEm`) |
| PIX aprovado tarde, dentro do prazo | Confirma normalmente |
| PIX aprovado depois de o horário ser solto | Devolvido inteiro (compare-and-set: dois atrasados não se sobrescrevem) |
| Prazo venceu com o grupo todo pago | A varredura confirma a aula em vez de devolver |
| Mesmo assento pago duas vezes | O segundo volta inteiro por `devolverPagamentoAvulso` (chave `duplicado:<pedido>`, coleção `monitorias_devolucoes`, nova tentativa na varredura 6a); o estorno desse segundo pagamento NÃO derruba o assento (`aoRevogarPagamento` ignora pagamento que não é o do assento) |
| PIX recusado/expirado | Assento segue aguardando; nova tentativa gera PIX novo; no fim do prazo a reserva expira e o horário é solto |

### Devolução, conciliação e ordem dos avisos

- **Uma movimentação por devolução:** a intenção é gravada com chave
  (`refund:<assento>:<n>`) antes de chamar o MP; só uma fica em aberto por
  assento; ao retomar, o sistema **pergunta ao MP** se já devolveu
  (`devolvidoNoGateway`) antes de pedir de novo, e a chave é a segunda trava.
  A conclusão é compare-and-set (avisa uma vez) e o estorno do repasse vem
  antes dela (idempotente pela mesma chave).
- **Nunca desiste:** devolução que falha segue "processando" e a varredura
  tenta de hora em hora; na 6ª falha a equipe recebe um alerta. Registros
  antigos com `falhou` são retomados do mesmo jeito.
- **Aviso "refunded" do MP com devolução em aberto** conclui sem pedir de novo.
- **Leitura atrasada não volta o relógio** (`transicaoObsoleta` em
  `lib/payments/effects.ts`, vale para o site todo): aprovado não volta a
  pendente (só a "em mediação" de verdade), devolvido não volta a aprovado,
  recusado não volta a pendente.
- **Identidade do pagamento:** a aprovação exige `external_reference` = id do
  pedido e que o pagamento não esteja em outro assento; o valor pago tem de
  ser exatamente o do pedido (±1 centavo) — diferente para mais ou para menos
  volta inteiro e não confirma vaga.
- **Conferência antes de liberar** (`conferirComGateway`, varredura passo 5 e
  decisão de disputa): cada assento pago é conferido no MP (status, valor,
  pedido). Bateu → `conferidoNoGatewayEm`. Devolvido/contestado no MP → registra
  a revogação. Divergente (inclusive "aprovação manual" em produção) → repasse
  daquele assento **retido** e alerta à equipe; admin decide em
  Admin → Monitorias → Repasses ("liberar" ou "zerar"). MP fora do ar → nada
  é liberado até a próxima hora. Nenhum caminho de conciliação cobra ou devolve.
- **PIX incerto (timeout na criação):** antes de gerar outro, o checkout procura
  o pedido no MP pela referência; a tela mostra "confirmando com o banco" e pega
  o QR pelo acompanhamento.
- **Última vaga do grupo:** entrada por convite com trava curta na reserva
  (`entrandoEm`, vence em 20 s) — contar e inserir não deixam duas pessoas
  ocuparem a mesma vaga.
- **Contestação (chargeback):** só o assento contestado sai do repasse; os
  outros alunos e a aula seguem; monitor e aluno são avisados.

Teste de integração (Mongo real + MP falso), opcional:
`MONITORIAS_MONGO_TESTE=mongodb://127.0.0.1:27017/ npx vitest run __tests__/monitorias/pagamentos-integracao.test.ts`
(apaga o banco `monitorias-pagamentos-teste` daquela instância).

## Cancelamento e reembolso (`lib/monitorias/politica.ts`)

| Quem | Quando | Resultado |
|---|---|---|
| Aluno | até **7 dias após pagar** e antes da aula | 100% automático, inclusive a taxa do PIX — **direito de arrependimento** (CDC art. 49; Decreto 7.962/2013, art. 5º) |
| Aluno | ≥ 24h antes (fora dos 7 dias) | 100% automático |
| Aluno | < 24h e fora dos 7 dias | ticket no suporte; reserva em disputa; admin decide de forma fundamentada (CC art. 413) |
| Monitor | qualquer hora | 100% para todos + strike (3 em 90 dias suspende) |
| Aluno | até 48h após a aula | "Reportar problema" → disputa |

Por que os 7 dias valem mesmo a menos de 24h da aula: contratação pela
internet é "fora do estabelecimento"; enquanto o serviço não foi prestado,
nenhuma regra contratual tira esse direito (cláusula assim seria nula, CDC
art. 51). Exemplo: pagou terça, aula quinta 10h, desistiu quinta 8h → 100%.
Organizador de grupo que cancela com colegas já pagos sai só do próprio assento.

Reembolso: intenção gravada com compare-and-set + chave de idempotência
`refund:<assento>:<n>` enviada ao MP. Falhou? Fica "processando" e o cron
tenta de novo com a mesma chave.

## Contratos e PDFs

- Texto em `lib/monitorias/documentos/` (termos versionados, contrato, oferta).
  Termos `2026.10-v4`, contrato `2026.10-v3` (oferta `2026.10-v2`): identificação da empresa
  (Decreto 7.962, art. 2º), arrependimento, ressalva do CDC, mandato (CC 653),
  LGPD (bases, operadores, retenção de 5 anos, direitos, encarregado), conduta,
  imagem/gravação, menores, nulidade parcial, foro do consumidor (CDC 101, I).
- Dados congelados no contrato + **hash SHA-256**; assinar exige mandar o hash
  que a tela mostrou (se o contrato mudou, a assinatura é recusada).
- O contrato guarda o **texto exato emitido** (`Contrato.secoes`), o aceite dos
  Termos guarda a cópia das seções aceitas e a oferta-padrão guarda o texto
  assinado: mudar o modelo no código (ou o `.env` da empresa) nunca altera nem
  invalida um documento já assinado — a verificação recalcula o hash sobre o
  texto guardado.
- O contrato é lido pelo aluno **antes de pagar**, então traz o CPF mascarado
  (`***.456.789-**`) e nenhum e-mail — com o CPF inteiro (muitas vezes a chave
  PIX do monitor) daria para pagar "por fora" e perder a garantia. A
  qualificação completa fica em `Contrato.dados`, visível só às partes e ao admin.
- PDFs gerados no servidor (`lib/monitorias/pdf.ts`): contrato com página de
  evidências e QR, comprovante de pagamento, demonstrativo de venda,
  comprovante de repasse, termos aceitos (a versão que a pessoa aceitou) e o
  **histórico da conversa** (`/api/monitorias/documentos/conversa/<reservaId>`,
  com os materiais da aula).
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
- Toda rota que muda dado recusa `Origin` de outro site (`lib/monitorias/origem.ts`).
- Papel ATIVO (`papelNaReserva`) só com assento ativo; quem saiu (expirou,
  cancelou, foi reembolsado) tem `acessoDeLeitura`: vê o histórico só para
  leitura e com contatos mascarados. Reportar problema exige assento pago e
  abre 15 min depois do início.
- Blocos de agenda sempre na grade de 30 min (`blocosDaAula` alinha e
  `inicioNaGrade` valida) — um início "quebrado" furaria o índice único.
- Confirmar aula (grátis, manual ou após PIX) exige a aula inteira travada
  (`garantirBlocos`).
- Agenda online só com oferta-padrão e Termos na versão vigente.
- Foto do monitor em pasta opaca (`pastaDaFoto`) e só do store do site.
- Textos cortados antes de regex; PDF com quebra de linha linear; IP
  mascarado nos PDFs; limites para propostas (6/10 min) e pedidos (15/h).
- O anúncio público não expõe o `userId` do monitor, só `donoChave`
  (SHA-256), que o navegador compara para saber "este anúncio é meu".
- Aluno com data de nascimento de menor de 18 não contrata (o responsável
  contrata pela própria conta).
- Agendamento direto: no máximo 2 reservas sem pagar por aluno e monitor
  (evita "sequestrar" a agenda com holds).

## Histórico e materiais

- "Minhas monitorias" (aluno) e "Pedidos" (monitor) mostram tudo, inclusive
  canceladas/expiradas/reembolsadas, com resumo no topo e atalhos para
  contrato, comprovante, materiais e PDF da conversa.
- Materiais do anúncio são **copiados para a reserva** na hora do pedido (o
  aluno não perde se o monitor mudar o anúncio). O monitor ainda pode enviar
  materiais só daquela aula (ação `material`; até 20; só quem pagou vê).
- Chat: a sala carrega as últimas 150 mensagens e o botão "Ver mensagens
  anteriores" pagina com `?antes=`.

## Custo (Vercel)

- A sala da reserva faz polling **incremental**: `GET …/mensagens?depois=`
  devolve só o que é novo + `versao`; a sala inteira só recarrega quando a
  versão muda (ou a cada ~10 voltas). 7 s negociando, 15 s confirmada,
  desligado quando encerrada — e só com a aba visível (`useIntervaloVisivel`).
- O checkout tem um relógio só (o do PIX); o da assinatura do monitor só
  roda enquanto se espera por ela.
- "Nova mensagem" no sino é agrupada: se já há um aviso não lido da mesma sala
  nos últimos 10 min, não cria outro.
- Rotas públicas com cache de CDN: vitrine 60 s, anúncio 30 s, horários 15 s.

## Conversão (o que deixa a seção persuasiva)

- Vitrine: números reais de prova social (só aparecem acima de um mínimo, para
  nunca mostrar "0 aulas"), "Como funciona" em 3 passos, simulador de ganhos
  para quem quer ensinar (`ganhoMensalEstimado`), selo "N alunos já contrataram".
- Anúncio: escassez real ("só N horários livres nos próximos 7 dias"),
  melhor depoimento ao lado do botão, caixa "Garantia DomineAqui", % de
  economia por faixa de grupo.
- Checkout: contagem do horário guardado (o hold real de 30 min).
- Monitor: **Força do anúncio** 0–100 com dicas ordenadas pelo ganho
  (`lib/monitorias/forca-anuncio.ts`), no assistente e no painel.

## Visual e UX (regras da seção)

- **Títulos** em Space Grotesk só dentro das monitorias (`components/monitorias/fonte.ts`
  troca `--font-heading` no invólucro `.mon-escopo`); texto segue Source Sans.
- **Uma cor de destaque:** o verde da marca (`primary`). Âmbar só em estrela de
  avaliação e aviso; vermelho só em erro. Sem gradientes coloridos.
- **Raios:** contêiner 16px (`rounded-2xl`), controle 12px (`rounded-xl`),
  etiqueta 6-8px. Avatar em "squircle" (`rounded-[32%]`).
- **Sem travessão (—)** e sem exclamação em mensagens de sucesso; sem rótulo em
  caixa-alta acima de título (`Cabecalho` em `base.tsx`); estados vazios com `Vazio`.
- **Landing:** chave "Quero aprender / Quero ensinar" (lembrada no navegador);
  o monitor, cliente principal, tem caminho próprio com simulador ao vivo.
- **Agenda:** grade semanal para pintar (clicar e arrastar; no celular, tocar),
  atalhos, copiar dia, calendário de folgas e barra de salvar só com alterações.
  Conversão pura em `lib/monitorias/agenda.ts` (`janelasParaCelulas`/`celulasParaJanelas`).
- **Assistente de anúncio:** prévia ao vivo do cartão da vitrine + força do anúncio.

## Operação

- Variáveis: ver o bloco "Monitorias" em `.env.example`. **Antes de lançar**,
  preencha `MONITORIAS_EMPRESA_RAZAO`, `MONITORIAS_EMPRESA_CNPJ`,
  `MONITORIAS_EMPRESA_ENDERECO` e `MONITORIAS_EMPRESA_EMAIL` (entram nos Termos
  e nos contratos; o Decreto 7.962/2013 exige essa identificação).
- Depois do deploy: `npm run db:indexes` (índices únicos são regra de negócio).
- Cron horário: `/api/cron/monitorias` (em `vercel.json`).
- Admin: `/admin/monitorias` — moderação, disputas, repasses, denúncias.
- Repasse manual: criar pagamento → revelar chave → PIX pelo banco → anexar
  comprovante (Blob privado) → informar E2E.
