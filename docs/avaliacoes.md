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

Para conferir a folha na hora, sem esperar relógio nem silêncio:

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

**2. Silêncio por desfecho.** Não existe cota por tempo entre convites — quem
estuda três materiais numa tarde pode ser convidado nos três. O que cala é o
**desfecho**: enviar a avaliação silencia por 2 dias, "agora não" por 3 (e adia
aquele item por 14), três recusas seguidas por 2 meses, "não quero avaliar" por
anos. O diagnóstico diz `silenciado` e a hora em que libera.

**3. Rota silenciosa.** Prova, checkout, login, landing e os próprios leitores
não exibem convite. O convite não é descartado: espera a próxima tela que
aceite. O diagnóstico diz `convite em espera`.

**4. O servidor recusou** (`/api/reviews/elegibilidade`):

- `ja_avaliou` — **esta conta já avaliou este item**. É a causa clássica de
  "não aparece nunca" para quem é dono da plataforma e já avaliou o próprio
  acervo. Apague a avaliação para voltar a receber o convite.
- `sem_acesso` — avaliar exige ter acesso ao conteúdo.
- `travado` — `reviewsLocked` ligado no item.

**5. Teto por item.** Cada material ou deck é oferecido no máximo 2 vezes na
vida da conta, mesmo que nada mais esteja no caminho.

Para limpar o histórico local e recomeçar do zero neste navegador:

```js
localStorage.removeItem('domineaqui:avaliacao-convite:v1')
sessionStorage.removeItem('domineaqui:avaliacao-convite-pendente')
```

## Regras de insistência

Elas reagem ao que a pessoa FEZ, não ao relógio: exibir um convite não silencia
nada por si só — enviar, recusar ou dispensar é que silencia. Uma cota fixa por
cima disso existiu e foi removida, porque engolia o convite de quem estuda
vários materiais seguidos e teria respondido a todos.

Estão todas em `lib/reviews-prompt.ts`, com teste em
`__tests__/reviews/convite-de-avaliacao.test.ts`. Mexer nelas sem atualizar o
teste quebra a suíte de propósito: insistir demais custa mais do que a avaliação
que se ganha.
