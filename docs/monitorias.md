# Monitorias — como funciona

Marketplace de aulas entre usuários: quem domina uma matéria anuncia; quem
precisa contrata, assina contrato e paga por PIX. A plataforma recebe o
dinheiro, segura em **garantia** e repassa **90%** ao monitor depois da aula
(10% ficam de taxa de intermediação), ou **100%** quando o aluno leva junto o
material oficial indicado (ver "Comissão com material oficial").

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
8. Aula confirmada                          (a sala abre 15 min antes)
                 ── aula acontece na sala de aula da DomineAqui ──
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

## Pedidos de monitoria (o aluno pede, os monitores vêm)

O anúncio ao contrário: o aluno diz o que precisa e os monitores respondem.
Resolve o "ovo e galinha" do começo: o aluno não sai de mãos vazias quando a
vitrine está fraca, e o monitor que chega vê procura em vez de um site vazio.

- **Aluno** (`/monitorias/pedir`, `components/monitorias/formulario-demanda.tsx`):
  quase tudo é toque em opção. Matéria (com atalhos), assunto opcional,
  pessoas (só eu, 2, 3, 4, 5+), quanto topa pagar por pessoa (ou "o monitor
  propõe"), duração, para quando e melhor horário. Botão preso no rodapé. Sem
  cadastro completo (mesma regra de `requisitosDoAluno`); sem login, o
  rascunho fica no `sessionStorage` e volta depois do login.
- **Monitor** (aba **Oportunidades** do painel): mural dos pedidos abertos, os
  da matéria dele primeiro (selo "Sua matéria"; contador na aba vem de
  `/api/monitorias/eu`). "Quero dar essa aula" → escolhe o anúncio (só os que
  comportam o grupo) e a mensagem já vem escrita → cai na conversa.
- **Responder = negociação comum** (`responderDemanda` em
  `lib/monitorias/demandas.ts`): reserva `origem: 'negociacao'`, `status:
  'solicitada'`, com a cópia do pedido em `reserva.demanda`. A proposta abre
  com pessoas, duração e valor do pedido. Dali em diante é o fluxo de sempre
  (chat, contrato, PIX, garantia, reembolso). O pedido nunca mexe com dinheiro.
- **Fechamento:** quando a aula de uma resposta é confirmada
  (`avisarConfirmacao` → `marcarDemandaAtendida`), o pedido sai do mural e os
  outros monitores que responderam são avisados.
- **Avisos:** pedido novo avisa no sino quem tem anúncio publicado da matéria
  (comparação sem acento/maiúscula, collation `pt` strength 1, até 40
  monitores); e-mail no máximo 1 por dia por monitor
  (`tutor.ultimoAvisoDemandaEm`, reservado de forma atômica).
- **Limites:** 3 pedidos abertos por aluno, 1 por matéria; 8 respostas por
  pedido (`$inc` condicionado); uma resposta por monitor (índice único
  parcial `{ 'demanda.id', tutorId }` em `monitorias_reservas`); 6 pedidos/h e
  20 respostas/dia por pessoa. O pedido expira sozinho (3, 7, 14 ou 21 dias,
  conforme "para quando"), sem cron: as consultas filtram `expiraEm`.
  Respostas ainda sem conversa (`solicitada` com `demanda`) não contam no
  limite de reservas abertas do aluno.
- **Privacidade:** o monitor vê só o primeiro nome. O mural público da vitrine
  (`/api/monitorias/publico/demandas`, CDN 60 s) não mostra nome nenhum.
  Telefone/e-mail no assunto e na mensagem são mascarados.
- **Onde aparece:** vitrine (link no herói, faixa depois da lista e o estado
  vazio "Pedir monitoria de <busca>"), "Quero ensinar" (alunos procurando
  agora, só se houver algum), Minhas monitorias ("Meus pedidos" com quem
  respondeu e "Tirar do mural") e a sala da conversa (cartão "Seu pedido" /
  "O pedido do aluno").
- Regras puras e testáveis em `lib/monitorias/demandas-regras.ts`; testes em
  `__tests__/monitorias/demandas-*.test.ts`.

## Comissão com material oficial (`lib/monitorias/comissao.ts`)

Regra: o monitor recebe **100%** da aula quando o aluno compra junto, no mesmo
PIX, o material OFICIAL indicado no anúncio, e o preço do material é **≥ 10%
do valor da aula**. Senão, 90/10. Em centavos, sem divisão: `preço × 100 ≥ aula × 10`.

| Aula | Material | Monitor |
|---:|---:|---:|
| R$ 100,00 | R$ 10,00 | 100% |
| R$ 100,00 | R$ 9,99 | 90% (material vendido mesmo assim) |
| R$ 200,00 | R$ 20,00 | 100% |
| R$ 200,00 | R$ 15,00 | 90% |

Como fica seguro:
- **Material oficial** = documento de `materials` (só admin cria), `pricing: 'paid'`,
  preço > 0 e visível. O anúncio guarda só `materialOficialId`; ao salvar,
  `erroDoMaterialOficial` confere no banco (link externo, grátis, escondido ou id
  inventado → 400). Troca em anúncio publicado passa pela revisão do admin.
- **Preço oficial lido no checkout** (`materialOficialAVenda`), sem cupom/lote:
  o navegador só manda `{ incluirMaterial: boolean }` (schema `strict`).
- **Opcional para o aluno** (sem venda casada, CDC art. 39, I). Quem já tem acesso
  (compra, pacote, admin) ou resgata pelo Plus+ (`alunoJaTemMaterial`) não recebe a
  oferta, e forçar dá 409: sem venda, sem isenção.
- **Gravado uma vez, do pedido pago**: o pedido leva `metadata.materialOficial`
  e `taxaPercent`; na aprovação o assento copia (no mesmo compare-and-set do
  "pago") `taxaPercent` e `materialOficial`, **recalculando a regra** a partir do
  preço do pedido (metadado adulterado não isenta). Preço do material ou da aula
  que muda depois não mexe na compra feita.
- **Repasse** guarda `taxaPercent`; estorno usa o mesmo percentual. Registro sem o
  campo = 10% (`percentualGravado`): nada muda para trás. `dividirValor` só aceita
  0 ou 10.
- **Entrega do material**: `material_purchases` com `providerOrderId` = pedido da
  monitoria e `origem: 'monitoria'` (upsert por pedido; repetir a aprovação não
  duplica). Só o material do pedido que pagou o assento (PIX duplicado volta inteiro).
- **Reembolso total** (devolve o PIX inteiro) e estorno/contestação no MP revogam o
  material. Parcial (só aula) mantém material e percentual.
- **Antes de liberar** (`conferirComGateway`): se a venda do material não está mais
  `completed`, `reaplicarTaxaSemMaterial` volta a 10% (dívida, se já pago).
- Split do sócio (`commissionableAmount`) = taxa + material (salvo
  `excludeFromCommission`).
- Contrato v4: cláusula 3.3 (isenção) e 3.5 (material vendido pela plataforma,
  opcional, reembolso total devolve o material).

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
- Link da reunião (plano B, se o admin permitir) só para quem pagou (nunca por e-mail).
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
- Foto do monitor: **não há envio de arquivo**. O monitor escolhe um retrato da
  galeria (`lib/monitorias/avatares.ts`: médicos históricos e brasileiros, imagens
  livres hospedadas no Wikimedia Commons). A rota recebe só o `id`; a URL gravada
  sai do catálogo do servidor (URL própria, id inventado ou campo extra: 400).
  Fotos enviadas antes da galeria são apagadas do Blob (`lib/monitorias/fotos.ts`,
  na troca e na varredura horária). Créditos: página de cada arquivo no Commons.
  Filtro "Séries": médicos de séries (House, The Good Doctor, The Resident,
  Grey's Anatomy, Plantão Médico, Scrubs) com a foto livre do **ator** em evento
  público, identificada como "Ator em Série" e com aviso de que não há vínculo
  com estúdios ou atores. Nunca cena ou divulgação da série (são do estúdio).
- Um retrato por conta: `users.avatar` (id do catálogo). Escolher no /profile
  (`PUT /api/user/avatar`) ou no painel (`PUT /api/monitorias/tutor/foto`) muda
  os dois lugares (`definirRetratoDaConta`); monitor novo já nasce com o retrato
  da conta.
- Documentos no /profile (aba Configurações, bloco "Documentos"): nome civil,
  nascimento e CPF, gravados por `/api/user/complete-profile` (a mesma rota do
  modal). Regra única de nome civil em `lib/nome-civil.ts` (nome e sobrenome, só
  letras), usada também pelo requisito "Nome completo". Travas: CPF cadastrado
  não se troca por ali; depois da conferência na Receita, nome e nascimento
  também ficam travados (reenviar o mesmo valor passa). Antes disso o nome civil
  só era pedido quando a Receita recusava, então o requisito ficava pendente sem
  ter onde preencher.
- Links das pendências: `linkDoPerfil(campo)` abre `/profile?tab=config&campo=`
  já no campo, em edição. `comVolta` acrescenta `voltar=` (só caminhos
  `/monitorias…`, validado por `voltarValido`; nada de redirecionamento aberto)
  e o /profile mostra a faixa "Voltar" no topo.
- Quem COMPRA não preenche cadastro: `requisitosDoAluno` pede só conta ativa e
  maioridade (quando a data informada indica menor). E-mail confirmado, CPF e
  nome civil continuam obrigatórios só para o MONITOR. As rotas do aluno não
  exigem `emailVerificado`; a assinatura do contrato usa código enviado ao
  e-mail, e acertar o código marca o e-mail como confirmado. O modal global de
  "complete seu perfil" não abre em `/monitorias` (só no painel do monitor).
- Monitor não contrata a si mesmo: o servidor recusa pela conta e pelo CPF
  (`mesmaPessoa`), o anúncio esconde os botões do dono (`/api/auth/me` devolve
  `user.id`) e, como o aluno pode não ter CPF, `aoAprovarPagamento` compara o
  CPF de quem pagou o PIX (quando o Mercado Pago informa) com o do monitor:
  igual → não confirma, devolve inteiro, audita `autocompra_cpf_do_monitor` e
  avisa a equipe.
- Textos cortados antes de regex; PDF com quebra de linha linear; IP
  mascarado nos PDFs; limites para propostas (6/10 min) e pedidos (15/h).
- O anúncio público não expõe o `userId` do monitor, só `donoChave`
  (SHA-256), que o navegador compara para saber "este anúncio é meu".
- Aluno com data de nascimento de menor de 18 não contrata (o responsável
  contrata pela própria conta).
- Agendamento direto: no máximo 2 reservas sem pagar por aluno e monitor
  (evita "sequestrar" a agenda com holds).

## Sala de aula (videoconferência nativa, `lib/monitorias/sala/`)

A aula acontece dentro da DomineAqui, em `/monitorias/reservas/<id>/sala`.
Monitor e aluno não instalam nada nem copiam link.

```
Navegador A ◄────── áudio/vídeo P2P (ou relé Cloudflare TURN) ──────► Navegador B
     │  ▲          + canal "controle" (DataChannel): estado, chat, tchau     │  ▲
     ▼  │                                                                   ▼  │
 Vercel: só apresenta as pessoas e ajuda a reconectar → Mongo `monitorias_salas`
```

- **Mídia nunca passa pela Vercel.** Direto entre os navegadores; quando a rede
  não deixa (empresa, universidade, alguns 4G), pelo Cloudflare TURN.
- **Quem entra** (`avaliarAcessoSala`, testada): o monitor, ou aluno com assento
  `paga`/`gratis`/`concluida` (reembolso PARCIAL em andamento não tira ninguém).
  Reserva `confirmada`/`realizada`, ou `em_disputa` aberta DEPOIS do início (o
  aluno reportou durante a aula). Janela: monitor 30 min antes, aluno 15 min,
  até 30 min depois do fim. Estranho recebe 404. A identidade vem da sessão; o
  papel, do servidor.
- **Grupos:** malha P2P de até `limiteMalha` pessoas (admin, 2 a 4, padrão 4 =
  monitor + 3). Com o link externo desligado, aula NOVA não passa disso
  (`vagasMaximasPelaSala`). Acima de 4, só com SFU (fase 2, não implementada).
- **Nada da sala mexe na reserva.** Status, `versao`, pagamentos, repasses e
  reembolsos seguem só as regras de sempre; perder a conexão não conclui nada.

### Fluxo

1. Saguão (sem servidor): prévia da câmera, medidor do microfone, escolha de
   aparelhos, ajuda de permissão por navegador. `GET …/sala` traz se a sala está
   aberta e quem já está nela (uma vez; de novo só quando abre, e a cada 20 s por
   no máximo 10 min com a aba visível).
2. `POST …/sala {acao:'entrar'}`: reconfere tudo, grava a conexão (`conexao`
   aleatória, `epoca+1`) e devolve o **token da sala** (15 min), os servidores ICE
   (STUN + credencial TURN temporária, se ligado) e quem está na sala.
3. Quem chega oferece a quem já está (o `findOneAndUpdate` ordena as entradas:
   só um lado vê o outro, então não há ofertas cruzadas). Oferta e resposta vão
   com os candidatos dentro (espera a coleta por até 1,5 s); atrasados em lote.
4. Conectado: três transceptores fixos (áudio, câmera, tela). Ligar/desligar a
   câmera e compartilhar a tela são `replaceTrack`, sem renegociar. Estado de
   microfone/câmera, chat e "tchau" vão pelo DataChannel.
5. Renovação a cada ~10 min (`acao:'renovar'`): reconfere reembolso, banimento,
   fim do horário; recusa encerra a aula na tela com o motivo.
6. Saída: botão Sair, desmontagem ou `pagehide` → "tchau" pelo DataChannel e
   `sendBeacon` (token no corpo). Tudo desligado: trilhas, pares, timers,
   Wake Lock, canal entre abas.

### Custo (o que foi medido)

- `GET …/sala/sinal` é a única rota repetida: valida o token e o JWT do cookie
  só em CPU (sem `getSession`, sem rate limit no banco) e faz **uma** operação
  no Mongo (projeção que já filtra os sinais de quem pergunta). Sala parada → 304.
- Cadência (`cadenciaDaSala`): sozinho 3 s → 6 s → 10 s (para em 45 min com
  "Ainda está aí?"); negociando 1 s por até 15 s; grupo incompleto 6 s → 30 s;
  reconectando 1 → 8 s; **em aula, pulso de 30 s**. Teste com dois Chromium:
  65 s de aula = 2 requisições por pessoa (maioria 304), nenhum POST.
- Estimativa: ~320 invocações por hora de aula 1:1.
- Na rota da sala o chrome do app não monta (menu, sino, música, anúncios,
  convites): `ehRotaDaSala` em `components/monitorias/shell.tsx` e
  `components/app-chrome.tsx`.
- "O monitor já está na sala" na página da reserva vem de carona no polling de
  mensagens que já existia (`presencaResumida`, só dentro da janela).

### TURN e as chaves do admin (Admin → Monitorias → Sala de vídeo)

- `salaNativaAtiva`, `linkExternoPermitido`, `turnAtivo`, `turnOrcamentoGbMes`
  (padrão 900 GB), `turnCorteAutomaticoPct` (padrão 90%), `limiteMalha`,
  `compartilharTela`, `chatNaSala` e `video` (qualidade, abaixo). Em
  `admin_settings.monitoriasSala`, cache de 60 s por instância.
- **Qualidade do vídeo** (`ConfigSala.video`): predefinições Fluido (30 fps,
  800 kbps 1:1, 350 por par no grupo — padrão), Equilibrado, Nítido (480p) e
  Econômico (15 fps, 300 kbps), ou "Ajuste fino" (fps, resolução, tetos, tela,
  ajuste automático). `niveisDaConfig` gera os degraus de rede ruim a partir do
  teto; chega ao navegador nas credenciais do `entrar` (a câmera aberta no
  saguão é ajustada por `applyConstraints`, sem reabrir). A tela mostra a
  estimativa de GB/h pelo relé.
- **Sala de teste**: "Excluir" apaga reserva, assentos, chat, sala, anotações,
  avisos do sino e revoga o TURN de quem estava dentro (`excluirSalasDeTeste`,
  a mesma limpeza da varredura de 7 dias). Só toca em `teste: true`.
- Credencial TURN só dentro da janela, TTL até a sala fechar. O consumo do mês
  é estimado pelos navegadores (bytes do par `relay` no `getStats`, cortados ao
  plausível) em `monitorias_sala_uso`; no teto × %, o servidor para de entregar
  TURN sozinho. "Cortar TURN agora" desliga e revoga as credenciais entregues.
- Variáveis: `CLOUDFLARE_TURN_KEY_ID`, `CLOUDFLARE_TURN_API_TOKEN` e, opcional,
  `MONITORIAS_SALA_SECRET`.

### Segurança

- Token da sala: `aud` próprio, 15 min, uma sala, uma conexão e uma época, preso
  ao `jti` do cookie. Vive só na memória da aba e vai no header `Authorization`.
- Toda gravação filtra `conexao` + `epoca` atuais: aba antiga ou aparelho
  substituído recebe 409 e não injeta nada. Outra aba do mesmo navegador sai na
  hora (`BroadcastChannel`).
- Sinais: schema `zod` estrito, SDP ≤ 16 KB com ≤ 6 seções, ≤ 30 candidatos;
  gravados como `$literal` (nada vira operador do Mongo); fila de 60, ignorados
  depois de 2 min; ≤ 60 envios/min por conexão (contador no próprio documento).
  Entrar 20/h e renovar 20/h por conta (limite durável).
- Participantes se veem por id opaco (`pid` = HMAC), primeiro nome (o monitor vê o
  nome completo) e papel. Nenhum userId, e-mail ou credencial TURN de outro.
- **Só fica quem pode** (o P2P não passa pelo servidor, então quem fecha a
  conexão são os navegadores de quem continua autorizado):
  - o retrato manda a todos os `pid`s tirados da sala (`fora`); cada navegador
    fecha na hora a conexão direta com eles — inclusive quem o suporte tirou;
  - par conectado que some da lista do servidor por 90 s é fechado
    (`devoFecharOPar`); a ETag do sinal inclui quem está presente, para a
    presença que vence sem escrita também chegar;
  - reembolso integral, assento cancelado ou reserva cancelada tiram a pessoa da
    sala na hora (`tirarDaSala`, `lib/monitorias/sala/expulsar.ts`), e renovação
    recusada solta a conexão gravada (não fica "presente" ocupando vaga);
  - a lotação é conferida de novo depois de gravar a entrada
    (`entrouAlemDoLimite`): duas entradas simultâneas não passam do limite;
  - o monitor vê "Ainda não chegaram" (assentos ativos, vindo do servidor).

### Privacidade

- Sem gravação. SDP, candidatos e estatísticas ficam em memória; no banco, os
  sinais duram até 2 h depois do fim (varredura 4b).
- Registro mínimo em `monitorias_salas.registro`: entrada, último sinal, saída e
  tipo de conexão (direta/relé). Sem IP, sem aparelho. Aparece só para o admin,
  na disputa (`resumirPresenca`), como evidência, nunca como decisão.

### Qualidade

Fluidez antes de resolução, com degradação automática a cada 2 s (`getStats`).
Padrão (perfil Fluido): 1:1 640×360@30 até 800 kbps → 640×360@24/450 →
480×270@15/250 → só áudio; no grupo, por par, 350 kbps@24 (monitor 450) →
200@15 → 110@10 → só áudio. Desce em 3 leituras ruins, sobe depois de 10 boas.
`qualityLimitationReason = bandwidth` sozinho NÃO é leitura ruim (o Chrome diz
isso quando o vídeo só encosta no teto que nós pusemos — era o que derrubava
aulas boas para 10 fps); ruim é banda estimada abaixo do alvo, perda > 8% ou
RTT > 600 ms. Câmera com `degradationPreference: maintain-framerate` (cai a
resolução antes do movimento); tela com `maintain-resolution`. Os tetos são
aplicados quando a conexão sobe (antes da negociação o `sender` recusa — o
lado que respondia ficava sem teto). "Estatísticas da conexão" em Ajustes: fps,
resolução e kbps enviados/recebidos, atraso, perda, caminho e o que limita.
"Economia de dados" para de receber vídeo.

### Efeitos de câmera e voz (`cliente/efeitos.ts`)

- Tudo no aparelho; sem efeito, nada roda. Câmera: shader WebGL (P&B, sépia,
  quente, frio, vívido, neon, retrô, pixelado, desenho, espelho, raio-X,
  termografia; molduras DomineAqui, confete, batimentos, plantão). Chrome/Edge
  bombeiam por `MediaStreamTrackProcessor`/`Generator` (segue a 30 fps com a aba
  oculta); Safari/Firefox por `<video>` + `canvas.captureStream`. Fundo
  desfocado só onde o navegador oferece (`backgroundBlur`).
- Voz (Web Audio): robô, grave, esquilo, eco, caverna, rádio, alienígena. A
  trilha crua continua do controlador (liga/desliga de verdade, mede quem fala);
  os pares recebem a processada por `replaceTrack`.
- Filtro de câmera lembrado no aparelho; efeito de voz só na aba. Aviso "efeito
  pesado" quando o processador cai abaixo de 15 fps com limite de CPU.

### Barra flutuante, anotações na tela, reações e brilho

- **Barra flutuante** (Chrome/Edge no computador, Document Picture-in-Picture):
  janela de vidro por cima de tudo, com marca, microfone, câmera, parar de
  compartilhar, mão, reações, "Anotar" e sair. Abre ao compartilhar a tela (ou
  oferece o botão), pela folha "Mais" e sozinha ao trocar de aba (ação
  `enterpictureinpicture` do `mediaSession`). `mediaSession` também liga
  microfone/câmera/desligar nos controles do sistema.
- **Anotações na tela**: traços vetoriais (0–1 sobre a imagem) pelo canal P2P,
  desenhados por cada navegador por cima da tela compartilhada — nada de
  reprocessar vídeo, nada pelo servidor. Riscam o monitor (qualquer tela) e quem
  compartilha (a própria); quem recebe confere. Somem quando a tela para.
- **Reações**: 8 emojis pelo canal P2P, 1 a cada 700 ms por pessoa.
- **Brilho de quem fala**: nível lido a cada quadro (`useBrilhoDaVoz`), escrito
  em `--voz` sem re-render; o meu vem do microfone cru, o dos outros do receptor.
- **Foto do perfil** na sala (quadro com câmera desligada, Pessoas, saguão): o
  retrato da conta (`users.avatar`). A varredura (6d) iguala o perfil de monitor
  à conta nos dados antigos (`sincronizarRetratos`).
- O monitor copia o link da aula (na sala de teste, o convite).

### Testes

- `__tests__/monitorias/sala-regras.test.ts`, `sala-maquina.test.ts`,
  `sala-token.test.ts` (rodam no `npm test`).
- `sala-integracao.test.ts`: Mongo real, opcional
  (`MONITORIAS_MONGO_TESTE=mongodb://127.0.0.1:27999/ npx vitest run __tests__/monitorias/sala-integracao.test.ts`).
- O cliente (controlador + pares) foi exercitado em dois Chromium com câmera e
  microfone falsos contra um servidor de sinalização falso: conexão, áudio/vídeo,
  estado, câmera, tela, chat, saída, volta, recarga, segunda aba, encerrar e
  limpeza total. Na rodada 2, também na tela real (next dev): mão levantada,
  silenciar, pedir microfone, baixar mão, chat pausado, contato bloqueado,
  anotações com PDF, tirar e liberar da sala, e capturas em cinco aparelhos.
- `contato-inteligente.test.ts`, `sala-anfitriao-e-suporte.test.ts`,
  `anotacoes.test.ts`, `rodada4.test.ts` (níveis da config, retratos, efeitos,
  reações/anotações, lotação, fechar par, ETag com presença).
- Rodada 4 em dois Chromium: 30 fps recebidos sem rebaixar, teto aplicado nos
  dois lados, P&B chegando cinza ao outro lado, voz de robô, reações,
  anotações, par fechado depois de o suporte tirar alguém (com o cliente dele
  insistindo) e perfil Econômico do admin aplicado; na tela real, navegação
  interna até a sala (recarrega e libera o microfone), barra flutuante,
  anotação vista pelo aluno, brilho, link copiado e estatísticas.

### Controles do monitor e mão levantada

- Pelo painel **Pessoas** (e pela faixa "fulano levantou a mão"): silenciar um
  ou todos, desligar câmera, parar a tela, pedir para ligar microfone/câmera,
  baixar mãos (uma ou todas), fixar no palco, **tirar da sala** e liberar a
  volta, e as permissões **tela dos alunos** e **chat dos alunos**.
- Pedidos (silenciar, câmera, tela, mão) vão pelo canal P2P (`t:'pedido'`), sem
  custo de servidor; quem recebe só obedece se o remetente for o monitor
  segundo o retrato do servidor. Ligar microfone ou câmera de alguém **nunca** é
  forçado: o aluno vê "O monitor pediu para você falar" e decide.
- Tirar da sala e permissões valem no servidor (`acaoDoAnfitriao` em
  `servidor.ts`, POST `…/sala/sinal` com `remover`/`readmitir`/`permissoes`):
  `removidos.<pid>` recusa entrada/renovação/sinais (403 `removido`) até ser
  liberado; o chat pausado também vale no POST de mensagens (`chatDosAlunosPausado`,
  uma leitura só dentro da janela da aula). A tela de aluno com a tela pausada
  não é exibida nem se o navegador dele ignorar a pausa.
- Aluno levanta a mão pelo botão (ou Ctrl/⌘+Alt+H); o monitor vê a fila em ordem.

### Anotações (`/api/monitorias/reservas/[id]/anotacoes`, `hooks/use-anotacoes.ts`)

- Painel na sala (e cartão "Minhas anotações" na página da reserva). Só quem
  escreveu lê. Botão "Horário" marca `[14:32]`; `# título` e `- item` saem
  formatados no PDF.
- Local primeiro (`localStorage` a cada pausa); servidor com folga: no máximo a
  cada 30 s escrevendo, ao fechar o painel e ao esconder a aba (`keepalive`).
  Conflito de dois aparelhos: 409 com o texto do servidor e junção sem perda
  (`juntarAnotacoes`). Coleção `monitorias_anotacoes` (único userId+reservaId).
- **PDF feito no navegador** (`lib/monitorias/anotacoes-pdf.ts`, jsPDF carregado
  só no clique): faixa da marca com o ícone, ficha (título, #código, data,
  monitor, aluno), corpo formatado, rodapé com página. Helvetica embutida (nada
  de baixar 2 MB de Roboto); o que ela não desenha vira texto (`paraWinAnsi`).

### Marca e marca d'água

- Topo da sala: ícone da DomineAqui (`/favicon.png`, 6 KB) e, do tablet para
  cima, "www.domineaqui.com.br".
- Marca d'água pequena e translúcida no canto do palco, sem receber toques:
  "www.domineaqui.com.br · Monitoria #XXXXXX" e "Monitor: Fulano S. · Aluno:
  Ciclano L." (quem está vendo). Aparece em qualquer captura ou gravação feita
  por fora. Testada em iPhone SE, iPhone 14, celular deitado, iPad e desktop:
  não encosta nos controles nem cobre rosto.

### Celular e iOS

- Altura pela `visualViewport` (`hooks/use-viewport-visivel.ts`): com o teclado
  aberto no iOS, o campo do chat continua visível. Campos com 16 px no toque
  (sem zoom automático), `enterKeyHint="send"`, `touch-manipulation`.
- Barra do celular: microfone, câmera, mão (aluno) ou pessoas (monitor), chat,
  "Mais" e sair; o resto (anotações, virar câmera, economia de dados, aparelhos,
  encerrar) fica na folha "Mais". Painéis viram folha inferior no celular e
  coluna lateral no tablet/desktop. Botões de 44 px abaixo de 380 px de largura
  e compactos com o celular deitado.
- Celular em pé com vídeo deitado: o quadro aparece inteiro (`contain`), sem
  cortar o rosto. Tela compartilhada com zoom (+/−, toque duplo, arrastar).
- Ao voltar do segundo plano, câmera/microfone tomados por outro app (ligação)
  são pegos de novo sozinhos.

## Contato por fora: detector, bloqueio e registro

- `lib/monitorias/contato-inteligente.ts` (puro, testado com 110 casos): telefone
  com DDD válido (também por extenso, com emoji, espaçado, +55, 0xx), e-mail
  (inclusive "arroba"/"ponto com"), links sem http e domínio espaçado, @perfil e
  "meu insta é…", CPF/CNPJ com dígito verificador, chave PIX aleatória, convites
  ("me chama no zap", "passa teu número") e pagamento por fora ("pix direto",
  "sem a taxa da plataforma"). Não bloqueia conversa de aula: "PA 120/80",
  "FC 80 90 100 110", datas e horários, "questões 12, 13 e 14", "o tumor cresce
  por fora", "nesse ponto com certeza". Telefone mandado em pedaços é pego
  juntando as últimas mensagens do mesmo autor (`detectarEmSequencia`).
- **Chat (reserva e sala):** `bloqueio` → 422 com o aviso, a mensagem não entra
  e fica em `monitorias_infracoes`; `alerta` (só cita um canal, "o zap caiu") é
  entregue e registrado. Na 3ª tentativa bloqueada em 24 h a equipe recebe aviso.
  O canal P2P da sala descarta o mesmo conteúdo (quem burlasse o servidor).
- Material enviado pelo monitor: `validarLinkDeMaterial` recusa mensageiros,
  redes sociais, "link na bio", agendadores e encurtadores; título com contato é
  bloqueado e registrado. Nome de cadastro com contato não aparece na sala
  (`nomeVisivel`).
- Limite honesto: o que aparece **dentro do vídeo ou da tela compartilhada**
  (um papel com o número) não é lido pela plataforma.

## Admin: aulas, conversas e cancelamento pelo suporte

- **Aulas** (`/api/admin/monitorias/aulas`): ao vivo agora (atualiza a cada 30 s
  com a aba visível), hoje, próximas, todas; busca por #ID (6 últimos
  caracteres), id completo, título ou nome do aluno. Mostra quem está na sala,
  quem foi tirado, permissões pausadas e tentativas de contato.
- **Ver conversa** (`…/reservas/[id]/conversa`): chat completo, sem máscara, com
  as tentativas bloqueadas (que não chegaram ao outro lado). Abrir fica na
  auditoria (`monitoria_chat_lido`).
- **Encerrar/reabrir aula e tirar/liberar alguém** (`…/reservas/[id]/sala`):
  `encerradaPeloSuporte` impede até o monitor de reabrir; quem está dentro sai no
  próximo pulso (até ~30 s). Não mexe na reserva.
- **Cancelar monitoria** (`…/reservas/[id]/cancelar`): status
  `cancelada_suporte` a partir de qualquer estado não concluído, reembolso
  integral de quem pagou (caminho idempotente de sempre), agenda e contratos
  liberados, strike opcional, aviso por e-mail a todos e sala encerrada.
- **Contato por fora** (`/api/admin/monitorias/infracoes`): novas/todas,
  reincidência em 30 dias, histórico por pessoa, marcar como vista (contador na
  aba). Registro guardado por 2 anos (índice TTL).
- Depois do deploy: `npm run db:indexes` (índices de `monitorias_infracoes` e
  `monitorias_anotacoes`).

### Pendências antes de lançar

- **Jurídico:** Termos 4.4, contrato 1.3/5.1 citam "link de reunião (Zoom,
  Meet)" e a 8.2 isenta falhas "de serviços de terceiros… salvo serviço que ela
  própria presta" — com a sala nativa, a plataforma presta o vídeo. Nova versão
  dos documentos com revisão de advogado (documentos já assinados guardam o
  próprio texto). Política de privacidade: incluir câmera/microfone, conexão P2P,
  Cloudflare como operador e o registro de presença.
- Conta Cloudflare + as duas variáveis do TURN.

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
- **Agenda:** grade semanal para pintar (clicar e arrastar) só com mouse ou
  trackpad (`md:[@media(pointer:fine)]`): a grade usa `touch-action: none` e, no
  tablet de toque, travaria a rolagem. Toque (celular e tablet) usa a lista de um
  dia por vez. Também tem atalhos, copiar dia, calendário de folgas e barra de salvar só com alterações.
  Conversão pura em `lib/monitorias/agenda.ts` (`janelasParaCelulas`/`celulasParaJanelas`).
- **Assistente de anúncio:** prévia ao vivo do cartão da vitrine + força do anúncio.
  No celular e no tablet, Voltar/Salvar/Próximo ficam na `BarraInferior` (o "+"
  flutuante cobria metade do "Próximo" no fim da página).
- **Navegação:** `NavMonitorias` (Encontrar / Minhas aulas / Painel do monitor)
  no topo de toda tela da seção, menos no checkout.
- **Telas estreitas (320px):** toda grade responsiva começa em `grid-cols-1`
  (`minmax(0,1fr)`), nunca na coluna implícita `auto`, que cresce até o maior
  conteúdo (texto com `truncate`, `whitespace-nowrap`) e vaza a tela.

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

## Vídeo-anúncio no herói (`components/monitorias/video-anuncio.tsx`)

- Arquivos em `public/videos/monitorias/` com versão no nome (`-v1`), cache
  imutável (`next.config.js`) e fora do middleware (nenhuma execução por pedaço
  de vídeo). Trocar o vídeo = novo nome (`-v2`).
- Quadrado no celular e no computador; banner 4:1 só no tablet. A tela escolhe
  um formato e baixa só ele.
- `preload="none"` + pôster; toca sem som só enquanto visível; sem autoplay para
  quem pede menos movimento ou economia de dados; "Ativar som" volta ao início.
- Compressão: H.264 CRF 27, 720 px (quadrado) e 1440 px (banner), ~1,6 MB cada.

