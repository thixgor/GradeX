# Prompt de curadoria — Manual de Semiologia

Cole o texto abaixo numa sessão do Claude Code aberta na pasta do projeto.
Ele é autocontido: a sessão descobre o resto lendo o repositório.

---

Você vai popular o acervo de casos reais do **Manual de Semiologia** deste
repositório. Leia `scripts/semiologia/README.md` antes de começar — ele explica
o pipeline inteiro.

## Contexto

O módulo (`/manual-clinico/semiologia`) tem 29 cenas clínicas, cada uma hoje
ilustrada só por um SVG paramétrico desenhado por nós. O esquema ensina o
**padrão**; falta a fotografia, que ensina a **variação**. As duas convivem lado
a lado — o esquema nunca é removido.

Temos autorização escrita de duas fontes, registrada em
`lib/acervos-licenciados.ts` com o SHA-256 de cada documento:

- **The POCUS Atlas** — CC BY-NC 4.0 com exceção expressa à cláusula
  NonCommercial para a DomineAqui e seus domínios.
- **Radiopaedia.org** — CC BY-NC-SA 3.0 com a mesma exceção, mais tradução.

As duas liberam o acervo completo (imagens, clipes, casos, textos), inclusive em
produto pago. Leia as `permissoes` e `restricoes` desse arquivo antes de agir.

## O que fazer

1. `npm install` se necessário, depois `npm run semiologia:acervo:esboco`.
   Isso regenera `scripts/semiologia/curadoria.json` com uma entrada por cena
   que ainda não tem caso — já com `janela`, `cena`, fonte provável, legenda
   rascunhada e os campos `_alvo` / `_procurar` dizendo o que buscar.

2. Para cada entrada, **busque um caso real na fonte indicada** e preencha:
   - `caso` (URL ou id do caso no Radiopaedia — o script resolve as imagens) ou
     `urlOrigem` (URL direta do arquivo; obrigatório no POCUS Atlas)
   - `urlDoCaso` — a página do caso na fonte. É a proveniência, é obrigatória.
   - `legenda` — revise o rascunho. Português, descrevendo o que se vê.

   Escolha casos que mostrem o achado com clareza didática. Um caso ambíguo é
   pior que nenhum: o aluno aprende o ruído junto com o sinal.

3. `npm run semiologia:acervo:verificar` até zerar as falhas. Entrada sem link é
   ignorada, não é erro — dá para curar em lotes.

4. `npm run semiologia:acervo:gerar` — baixa, confere o content-type, calcula o
   SHA-256, salva os bytes em `.semiologia/midia/` e escreve
   `lib/semiologia/acervo.gerado.ts`.

5. `npm test` e `npm run build`. Depois commit e push.

## Regras que não se negociam

- **Nunca invente URL.** Se a resolução automática falhar, o script diz o que
  veio da API. Investigue ou preencha `urlOrigem` à mão — jamais chute um
  caminho. URL inventada não quebra no script: quebra em produção, com o
  crédito apontando para um caso que talvez não exista.
- **Verifique antes de gravar.** Só `--gerar` (que baixa de verdade) confirma
  que a URL responde. Não edite `lib/semiologia/acervo.gerado.ts` à mão.
- **Não toque na prosa.** `lib/semiologia/vistas.ts` e `ultrassom.ts` são texto
  revisado. O acervo é um arquivo separado e o merge acontece na leitura.
- **Host rejeitado ≠ contornar a allowlist.** Se o script recusar um host
  legítimo, acrescente-o em `dominiosDeMidia` (`lib/acervos-licenciados.ts`)
  **e** em `HOSTS` (`scripts/semiologia/curar-acervo.mjs`). Um teste compara as
  duas listas e falha se divergirem. Nunca remova a checagem.
- **Crédito é obrigação contratual.** Não altere os textos de `credito` — eles
  reproduzem o que a autorização pede, palavra por palavra.

## Ordem sugerida

Comece pelo **ultrassom** (`pulmao-linhas`, `fast-morrison`,
`veia-cava-inferior`, `subxifoide-pericardio` — 11 cenas). É onde o esquema tem
a maior lacuna: deslizamento pleural, ponto pulmonar e swinging heart são
achados de movimento que desenho nenhum reproduz, e o POCUS Atlas tem clipes.

Depois `otoscopia` (6), `fundoscopia` (5), `orofaringoscopia` (4) e
`rinoscopia-anterior` (3).

## Uma decisão que é do dono do projeto

Onde servir a mídia. `lib/semiologia/midia.ts` tem três estratégias:

| Estratégia | Variável | Consequência |
|---|---|---|
| espelho | `NEXT_PUBLIC_SEMIOLOGIA_MIDIA_BASE` | CDN nosso, por hash. **Recomendado.** |
| origem | `NEXT_PUBLIC_SEMIOLOGIA_MIDIA_ORIGEM=1` | Tráfego bate no servidor deles; URL que muda quebra a cena |
| indisponível | — | Produção sem nenhuma das duas: mostra só o esquema |

Em desenvolvimento a origem já está ativa, então dá para revisar sem espelhar
nada. Se o espelho for a escolha, os bytes de `.semiologia/midia/` estão prontos
para subir — pergunte antes de configurar.

## Ao terminar

Reporte: quantas cenas ganharam caso, quantas ficaram sem e por quê, e quais
hosts precisaram entrar na allowlist. A página `/manual-clinico/semiologia/creditos`
publica a cobertura automaticamente — confira se o número bate.
