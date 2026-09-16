# Avaliações de materiais e decks

Duas portas levam à mesma avaliação:

1. **A seção no rodapé** da página do material (`/materiais/[id]`) e do deck
   (`/flashcards/d/[slug]`) — `components/reviews/reviews-section.tsx`.
2. **O convite de fim de estudo**, que aparece sozinho quando a pessoa fecha o
   conteúdo — `lib/reviews-prompt.ts` + `components/reviews/review-prompt*.tsx`.

A segunda existe porque a primeira quase não era usada: quem abriu o PDF, leu e
fechou não volta à página e rola até o fim só para dar nota. O convite pega a
opinião no instante em que ela existe.

## Onde o convite nasce

| Leitor | Gatilho | Estudo mínimo |
|---|---|---|
| PDF (`secure-pdf-viewer`) | ao sair do leitor | 25s, ou 3 páginas + 8s |
| Deck de flashcards | ao sair do estudo (`exitStudy`, que "concluir sessão" chama) | 45s, ou 3 cards + 8s |
| Experiência HTML | botão voltar | 35s |
| Item complementar | botão voltar (a nota vai para o material pai) | 35s |

O relógio só corre com a aba à vista — material aberto numa aba esquecida não é
estudo. "Sinais" são progresso concreto: páginas viradas, cards respondidos.

## "Fechei o material e não apareceu nada"

Isso quase sempre é uma das portas abaixo, e **todas fecham em silêncio** por
natureza — é a diferença entre um convite discreto e um pop-up. Para ver qual
delas foi, ligue o diagnóstico:

```
https://…/dashboard?avaliacao=debug
```

A partir daí o console narra cada passo (`[avaliação] …`). O modo gruda no
navegador — a query string se perde na primeira navegação, e o convite aparece
justamente depois de navegar. Para desligar: `?avaliacao=off`.

Para conferir a folha na hora, sem esperar relógio nem cota:

```
https://…/materiais/<id>/viewer?avaliacao=forcar
```

`forcar` ignora o tempo de estudo e o histórico local. O **veredito do servidor
continua valendo** — forçar uma folha que o servidor recusaria só produziria um
erro no envio.

### As portas, em ordem

**1. Estudo curto demais.** Abrir e fechar em dez segundos não gera convite.
É o motivo mais comum em teste manual. O diagnóstico diz `convite não nasceu`
com os segundos e sinais contados.

**2. Cota de 20 horas.** No máximo um convite por dia, **por pessoa** — não por
material. Testar um PDF e logo em seguida um deck: o segundo é barrado, mesmo
que tudo o mais esteja certo. O diagnóstico diz `cota_do_dia` e a hora em que
libera.

**3. Rota silenciosa.** Prova, checkout, login, landing e os próprios leitores
não exibem convite. O convite não é descartado: espera a próxima tela que
aceite. O diagnóstico diz `convite em espera`.

**4. O servidor recusou** (`/api/reviews/elegibilidade`):

- `ja_avaliou` — **esta conta já avaliou este item**. É a causa clássica de
  "não aparece nunca" para quem é dono da plataforma e já avaliou o próprio
  acervo. Apague a avaliação para voltar a receber o convite.
- `sem_acesso` — avaliar exige ter acesso ao conteúdo.
- `travado` — `reviewsLocked` ligado no item.

**5. Histórico local.** "Agora não" adia aquele item por 14 dias e silencia tudo
por 3 dias; três recusas seguidas silenciam por 2 meses; "não quero avaliar"
vale anos. Cada item é oferecido no máximo 2 vezes na vida da conta.

Para limpar o histórico local e recomeçar do zero neste navegador:

```js
localStorage.removeItem('domineaqui:avaliacao-convite:v1')
sessionStorage.removeItem('domineaqui:avaliacao-convite-pendente')
```

## Regras de insistência

Estão todas em `lib/reviews-prompt.ts`, com teste em
`__tests__/reviews/convite-de-avaliacao.test.ts`. Mexer nelas sem atualizar o
teste quebra a suíte de propósito: insistir demais custa mais do que a avaliação
que se ganha.
