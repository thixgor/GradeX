# Desconto PROUNI/FIES

Desconto socioeconômico: o admin liga um percentual (ou valor fixo) num produto,
a pessoa prova a condição de bolsista uma vez, e o desconto passa a valer **só
para ela, só naquele produto**.

Núcleo das regras: [`lib/prouni-shared.ts`](../lib/prouni-shared.ts) (aritmética
pura, usada pelo servidor e pela tela) e
[`lib/prouni-fies.ts`](../lib/prouni-fies.ts) (persistência e ciclo de vida).

## Por que não é um cupom

Cupom é código: quem recebe repassa. Um desconto pensado para o bolsista viraria
desconto do grupo de WhatsApp inteiro no primeiro print. Lote também não serve —
vale para todos ao mesmo tempo.

Daí a separação em duas metades:

| | onde mora | o que é |
| --- | --- | --- |
| **Oferta** | `prouni_benefits` | "este produto dá X% a bolsista". Opcional: sem registro, o produto não participa de nada. |
| **Concessão** | campo `grant` dentro de `prouni_requests` | o desconto de UMA pessoa, criado quando um admin aprova a solicitação dela. É o que desconta no checkout. |

A concessão guarda uma **fotografia** das condições no momento da aprovação.
Mexer na oferta depois (ou desligá-la) não altera quem já passou pela análise —
nem para mais, nem para menos.

## Alcance

Material, flashcards (material do tipo `flashcard_deck`), pacote, Manual Clínico
e plano de assinatura. Planos **recorrentes** (mensal/trimestral/anual) ficam de
fora: eles são cobrados via preapproval do Mercado Pago, onde o valor combinado
vale para todas as cobranças futuras — um benefício de uso único ali
significaria desconto para sempre. O painel avisa o admin quando o plano
escolhido é recorrente.

## Como o desconto se combina com lote e cupom

Uma função só decide, e os quatro checkouts a chamam:
`combineDiscountsWithProuni`.

- **Padrão (`stackWithTier: false`)** — vale o **maior** entre lote, cupom e
  PROUNI. O bolsista nunca paga mais que qualquer outro comprador. Empate vai
  para o PROUNI, que é o único concedido individualmente.
- **Empilhado (`stackWithTier: true`)** — o lote desconta primeiro e o PROUNI
  incide sobre o que sobrou. O cupom sai de cena: três descontos somados no mesmo
  item é o caminho mais curto para vender a R$ 0 por engano.

No carrinho, lote e PROUNI são somados **item a item** (cada item tem seu evento
e sua concessão) e só o total disputa com o cupom, que é do carrinho inteiro.

## Ciclo de vida da concessão

```
available ──reserva no pedido──> reserved ──pagamento aprovado──> used
    ^                                │
    └──── Pix vencido / cartão recusado / estorno ────┘
```

- A reserva é atômica (`reserveProuniGrant` só muda de `available`); se a corrida
  for perdida, o pedido é derrubado em vez de cobrar preço com desconto sem ter
  o desconto.
- Item que ficou R$ 0 não gera pedido no provedor: ali a concessão é gasta na
  hora (`spendProuniGrantNow`).
- `consumeProuniGrant` / `releaseProuniGrant` são chamados de
  `lib/payments/effects.ts`, no mesmo ponto em que o cupom é aprovado/liberado.
- O admin pode **revogar** uma aprovação enquanto ela não tiver sido usada.

## Comprovantes

Sobem do navegador **direto para o Blob** (`access: 'private'`), com token
emitido por `POST /api/prouni/upload`: só com sessão, só para a pasta
`prouni-comprovantes/<userId>/`, só PDF/JPG/PNG/WEBP, no máximo 8 MB por arquivo.
Nenhum megabyte de upload passa por uma Function.

O token limita o estrago; quem valida é `lib/prouni-anexos.ts`, no momento de
criar a solicitação, e sempre pelo servidor:

1. o caminho pertence a quem está enviando (senão, bastaria colar a URL do
   comprovante alheio no corpo da requisição);
2. `head()` do Blob dá tipo e tamanho reais — o que o cliente afirma é ignorado;
   há teto por arquivo (8 MB) e somado (16 MB);
3. os 16 primeiros bytes precisam bater com a assinatura do tipo declarado
   (lidos com `Range`, não baixando o arquivo inteiro).

Nada é decodificado ou renderizado no servidor. Arquivo recusado é apagado do
Blob na hora — solicitação que não nasceu não deixa lixo pago para trás.

O admin lê os anexos por `/api/admin/prouni/solicitacoes/[id]/anexo/[attachmentId]`,
que faz proxy dos bytes com `nosniff`, CSP `sandbox` (PDF executa JavaScript) e
`no-store`. A URL do Blob nunca chega ao navegador.

### Apagar depois da análise

Comprovante é documento pessoal; a plataforma não tem por que guardá-lo depois de
conferir. Duas saídas, ambas preservando a decisão (quem decidiu, quando, com que
desconto):

- caixa "apagar arquivos ao decidir", marcada por padrão na análise;
- botão **Limpar analisadas** (`POST /api/admin/prouni/limpeza`), que varre em
  lote as solicitações já analisadas. Nunca alcança pendentes.

## Avisos por e-mail

A análise é humana e leva dias. Sem aviso, o único jeito de saber o que
aconteceu com o comprovante é abrir o site e procurar — e, na dúvida, mandar
tudo de novo. Quatro e-mails fecham as dúvidas que viram segunda solicitação:

| quando | para quem | o que leva |
| --- | --- | --- |
| solicitação enviada | quem pediu | confirmação, prazo estimado e "não precisa enviar de novo" |
| solicitação enviada | administradores (`ADMIN_EMAILS` / `ADMIN_ALERT_EMAIL`) | item, solicitante, CPF **mascarado**, faculdade, nº de anexos, tamanho da fila e link para a análise |
| aprovada | quem pediu | o desconto, que ele entra sozinho no checkout, o prazo (se houver) e botão **Ir para a compra** |
| recusada | quem pediu | **o motivo escrito pelo admin** e botão **Refazer solicitação** |

Todos são disparados sem `await` na rota: a decisão (ou a solicitação) já está
gravada, e o SMTP não pode segurar a resposta — um admin analisando a fila
clica em "aprovar" dezenas de vezes seguidas, e quem envia o formulário
acharia que falhou e clicaria de novo. Cada função engole o próprio erro e
registra no log.

O motivo da recusa é **obrigatório** na API, não só na tela: é ele que vai no
e-mail, e "foi recusada" sem dizer por quê só produz o reenvio do mesmo
documento ilegível.

## Anti-enxurrada

Toda solicitação vira trabalho humano. As travas contam por **conta**, não por
IP — quem quer entupir a fila troca de rede.

A primeira recusa **não** impõe espera: ela chega por e-mail com o motivo e um
botão de refazer, e corrigir o documento e reenviar na hora é exatamente o
comportamento desejado. A espera entra da segunda recusa em diante, quando o
padrão deixa de ser erro honesto e passa a ser tentativa e erro em cima da fila.
O teto diário é o limite real de quanto uma conta pesa na análise.

| trava | valor |
| --- | --- |
| solicitações abertas por conta | 3 |
| solicitações por conta em 24h | 5 |
| espera após recusa, no mesmo item | nenhuma na 1ª; 24h a partir da 2ª |
| segunda solicitação aberta no mesmo item | bloqueada por índice único parcial |
| rate limit de criação | 5/h por conta, 15/h por IP |
| rate limit de upload | 12 arquivos/h por conta |

## Rotas

| rota | quem usa |
| --- | --- |
| `GET /api/prouni/beneficio` | chamativo na página do produto e página exclusiva. Pública (visitante vê a oferta; nada pessoal sai sem sessão). |
| `POST /api/prouni/upload` | token de upload do comprovante |
| `POST/GET /api/prouni/solicitacoes` | criar solicitação / listar as próprias |
| `GET/POST/DELETE /api/admin/prouni/beneficios` | ofertas por produto |
| `GET /api/admin/prouni/produtos` | busca de produtos (inclui planos) |
| `GET /api/admin/prouni/solicitacoes` | fila de análise |
| `PATCH/DELETE /api/admin/prouni/solicitacoes/[id]` | aprovar/recusar/revogar · apagar anexos |
| `POST /api/admin/prouni/limpeza` | faxina em lote dos anexos |

## Telas

- `/prouni-fies/[itemType]/[itemId]` — página exclusiva do produto para a
  condição de bolsista: mostra o preço já com o desconto **antes** de pedir
  qualquer documento, explica o fluxo e traz o formulário.
- `/profile?tab=atendimento` — **Atendimento**: solicitações de desconto e
  tickets de suporte no mesmo lugar, com a próxima ação à mão (refazer, ir para
  a compra, abrir a conversa). As duas eram conversas com a mesma equipe sem
  endereço fixo — o ticket só existia dentro do balão flutuante, que some quando
  a pessoa desliga o botão de suporte nas preferências.
- `/prouni-fies` — endereço antigo; redireciona para Atendimento.
- `/admin/prouni` — duas abas: descontos por produto e fila de solicitações.
- `components/prouni/prouni-cta.tsx` — o chamativo "Sou PROUNI/FIES, quero
  desconto". Não renderiza nada quando o produto não participa, então pode ser
  pendurado em qualquer página de produto.

## Dados coletados

Nome completo, CPF, e-mail, telefone, data de nascimento, faculdade e curso
(opcional), mais as duas declarações aceitas (a do programa e a da plataforma),
com versão do texto (`PROUNI_TERMS_VERSION`), data, IP e user-agent.

O que estiver **faltando** no perfil é preenchido com esses dados; nada que já
exista é sobrescrito — o formulário do benefício não é lugar de corrigir
cadastro, e um CPF conferido pela Receita não é trocado por texto digitado.
