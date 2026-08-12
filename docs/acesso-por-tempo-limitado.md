# Acesso por tempo limitado (versões de material e pacote)

Além do acesso vitalício — o preço normal do material ou do pacote —, o admin
pode publicar **versões de acesso por tempo**: o mesmo conteúdo por um preço
menor, válido por X dias/horas.

Núcleo da regra: [`lib/material-timed-access.ts`](../lib/material-timed-access.ts).

## As três regras

1. **O relógio começa na liberação, não no pagamento.** Numa compra com Serial
   Key, isso é a **ativação da key**. A duração viaja na `grant` e só vira data
   de fim em `grantSerialKeyProduct` → `grantMaterialCartItems`, que grava
   `accessStartsAt` e `accessExpiresAt`. Comprar hoje e ativar semana que vem
   não consome prazo.
2. **Passada a data, a compra não dá mais acesso.** Todo caminho de leitura
   filtra por `activeAccessFilter()`.
3. **Versão por tempo nunca libera download.** Nem o botão, nem o envio
   automático do PDF por e-mail, nem a exportação do deck em PDF. O conteúdo é
   lido no visualizador protegido. Flashcards e vídeo-aulas não têm PDF, então
   para eles a versão apenas limita o período de uso.

## Modelo de dados

`Material.timedAccessVersions` / `MaterialPackage.timedAccessVersions`:

| campo | o que é |
| --- | --- |
| `id` | id estável; é o que liga a compra à versão (nunca regravar) |
| `label` | rótulo exibido ("Acesso 30 dias") |
| `price` | preço fechado da versão, em R$ |
| `durationDays` + `durationHours` | período total |
| `isActive` | versão despublicada some do catálogo |
| `highlight` | marca como recomendada |

Na compra (`material_purchases`): `accessMode: 'timed'`, `accessVersionId`,
`accessVersionLabel`, `accessDurationMinutes`, `accessStartsAt`,
`accessExpiresAt`, `downloadDisabled`. Compra vitalícia não tem nenhum deles.

## Preço

O preço da versão é **fechado**: não recebe desconto de lote (pricing event),
cupom de lote nem o abatimento proporcional de pacote — esse abatimento existe
para não cobrar duas vezes pelo acesso definitivo, e um passe temporário não é
uma fração do acervo.

## Recompra

Só a posse **vitalícia** bloqueia uma nova compra (`lifetimeOwnershipFilter()`).
Quem está na versão por tempo pode comprar de novo para renovar o prazo ou para
migrar para o acesso definitivo — inclusive depois de o prazo vencer. Quando há
mais de uma posse do mesmo item, vale a melhor: qualquer posse vitalícia encerra
a contagem, e entre prazos vence o maior.

## Onde o prazo aparece para o usuário

- **/materiais** — contagem no cartão do item que ele já tem; "ou R$X por 30
  dias" abaixo do preço do que ainda não tem.
- **/materiais/[id]** e **/pacotes/[id]** — seletor "como você quer o acesso"
  antes de comprar; faixa com o tempo restante depois de comprar.
- **PDF Viewer** — faixa fixa com contagem viva e a explicação em "por que não
  posso baixar?".
- **/flashcards/d/[slug]** — mesma contagem, já que o deck não tem PDF.
- **/materiais/checkout** e **/comprar** — modalidade ao lado do preço.
- **/compra/aprovada**, comprovante em PDF e e-mail — duração e a frase de que a
  contagem só começa na ativação.
- **/ativar** — avisa antes ("seu prazo começa agora") e depois, com a data de
  término.
- **/profile** (histórico de compras) — quanto resta, ou quando encerrou.

## Onde o servidor barra

| caminho | arquivo |
| --- | --- |
| catálogo e "meus materiais" | `app/api/materiais/route.ts` |
| página do material | `app/api/materiais/[id]/route.ts` |
| catálogo e página de pacote | `app/api/materiais/packages/**` |
| leitor de PDF (acesso e páginas) | `lib/material-pdf-viewer.ts` |
| leitor HTML | `lib/material-html-viewer.ts` |
| download do PDF | `app/api/materiais/download/route.ts` |
| deck e exportação em PDF | `lib/flashcard-manual.ts`, `app/api/flashcards/manual/[id]/pdf/route.ts` |
| avaliações e afins | `lib/access.ts` |

## Testes

`__tests__/material-timed-access.test.ts` cobre o saneamento das versões, o
início da contagem na liberação, a expiração e o formato dos filtros Mongo —
inclusive o motivo de `activeAccessFilter()` usar `$nor` e não `$or` (os filtros
de compra já usam `$or` para casar userId/e-mail; duas chaves `$or` no mesmo
objeto se anulariam).
