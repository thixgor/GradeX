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

## Anti-enxurrada

Toda solicitação vira trabalho humano. As travas contam por **conta**, não por
IP — quem quer entupir a fila troca de rede:

| trava | valor |
| --- | --- |
| solicitações abertas por conta | 3 |
| solicitações por conta em 24h | 5 |
| espera após recusa, no mesmo item | 24h |
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
- `/prouni-fies` — "onde está meu pedido".
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
