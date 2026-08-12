# Acesso por tempo limitado (versões de material e pacote)

Além do acesso vitalício — o preço normal do material ou do pacote —, o admin
pode publicar **versões de acesso por tempo**: o mesmo conteúdo por um preço
menor, válido por um prazo que ele monta somando **minutos, horas, dias, meses
e anos**.

Núcleo da regra: [`lib/material-timed-access.ts`](../lib/material-timed-access.ts).

## As quatro regras

1. **O relógio começa na liberação, não no pagamento.** Numa compra com Serial
   Key, isso é a **ativação da key**. A duração viaja na `grant` e só vira data
   de fim em `grantSerialKeyProduct` → `grantMaterialCartItems`, que grava
   `accessStartsAt` e `accessExpiresAt`. Comprar hoje e ativar semana que vem
   não consome prazo.
2. **Passada a data, a compra não dá mais acesso.** Todo caminho de leitura
   filtra por `activeAccessFilter()`.
3. **Meses e anos são de calendário**, não blocos de 30/365 dias: "1 mês"
   comprado em 31/01 termina em 28/02 (e em 29/02 num ano bissexto), não em
   02/03. Por isso a duração viaja inteira até a ativação, onde `computeAccessExpiry`
   a transforma em data — dias, horas e minutos entram como tempo absoluto.
4. **Versão por tempo nunca libera download.** Nem o botão, nem o envio
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
| `durationYears`, `durationMonths`, `durationDays`, `durationHours`, `durationMinutes` | as cinco unidades somam o prazo; basta uma preenchida |
| `isActive` | versão despublicada some do catálogo |
| `highlight` | marca como recomendada |

Na compra (`material_purchases`): `accessMode: 'timed'`, `accessVersionId`,
`accessVersionLabel`, `accessDuration` (as cinco unidades — é a fonte da verdade),
`accessDurationMinutes` (estimativa, para ordenar e comparar), `accessStartsAt`,
`accessExpiresAt`, `downloadDisabled`. Compra vitalícia não tem nenhum deles.

**Compatibilidade.** Versões salvas antes das cinco unidades só têm
`durationDays`/`durationHours` e continuam valendo o mesmo prazo — as demais
unidades entram zeradas. Serial keys geradas antes disso carregam apenas
`accessDurationMinutes`; `buildTimedPurchaseFieldsFor` aceita as duas formas, então
uma key antiga não ativada ainda ativa normalmente.

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

`__tests__/material-timed-access.test.ts` cobre o saneamento das versões (as
cinco unidades e o formato antigo), a aritmética de calendário (fim de mês, ano
bissexto, meses acima de 12), o início da contagem na liberação, a expiração e o
formato dos filtros Mongo —
inclusive o motivo de `activeAccessFilter()` usar `$nor` e não `$or` (os filtros
de compra já usam `$or` para casar userId/e-mail; duas chaves `$or` no mesmo
objeto se anulariam).
