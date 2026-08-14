# Histopatologia — manutenção editorial

Área de anatomia patológica do Manual da Histologia, em
`/manual-clinico/histologia/histopatologia`.

Leia primeiro, nesta ordem: [`public/patologia/PLANO_IMPLEMENTACAO.md`](../../public/patologia/PLANO_IMPLEMENTACAO.md),
[`public/patologia/CREDITOS_E_DIREITOS.md`](../../public/patologia/CREDITOS_E_DIREITOS.md) e
[`docs/adr/0002-direitos-de-midia-da-histopatologia.md`](../../docs/adr/0002-direitos-de-midia-da-histopatologia.md).

## A regra que não se negocia

Nenhuma imagem é baixada, copiada, convertida, otimizada, colocada em Blob/CDN
ou commitada. O módulo trabalha com **ponteiros remotos**. Quando houver
autorização registrada, a URL vai para um `<img>` nativo no navegador do aluno;
sem autorização, mostram-se descrição, crédito e link para a origem.

Se você precisar mexer em mídia, o único arquivo que monta `<img>` é
`components/histopatologia/imagem-remota.tsx`, e há teste que falha se aparecer
um segundo.

## Mapa dos arquivos

```text
lib/histopatologia/
├── esquemas.ts          contratos Zod (bruto permissivo, publicação exigente)
├── direitos.ts          portão jurídico, allowlist de domínios, créditos
├── midia.ts             DTO de mídia — onde o portão de direitos fecha
├── acervo.ts            leitura sob demanda do catálogo comprimido (server-only)
├── repositorio.ts       acesso aos derivados (server-only)
├── busca.ts             ranqueamento isomórfico
├── rotas.ts             construtores de URL, sem dependência
├── seo.ts               metadados e JSON-LD
├── texto.ts             normalização (usada também pelo pipeline)
├── carregadores.gerado.ts   GERADO — não edite
└── editorial/
    ├── index.ts         mapa de consolidação + versão
    ├── sistemas.ts      taxonomia e remapeamento do sistema catalogado
    ├── mecanismos.ts    mecanismos patológicos gerais
    └── doencas/*.ts     uma doença canônica por arquivo

data/histopatologia/     GERADO por scripts/histopatologia/construir-dados.mjs
                         + 19 fragmentos de referências WebPath/Utah
public/patologia/        acervo-fonte, imutável para a ingestão
```

## Comandos

```bash
npm run histopatologia:catalogo   # integridade do catálogo-fonte (hashes, contagens)
npm run histopatologia:conteudo   # validação editorial, rápida, sem reprocessar o catálogo
npm run histopatologia:dados      # pipeline completo: derivados + mapa de carregadores
npm test                          # inclui __tests__/histopatologia
npm run lint:histopatologia
```

Rode `histopatologia:conteudo` enquanto escreve; `histopatologia:dados` antes de
commitar. O pipeline é idempotente: duas execuções sobre o mesmo catálogo
produzem arquivos idênticos.

## Adicionar uma doença

1. Crie `lib/histopatologia/editorial/doencas/<slug>.ts` exportando um
   `DoencaCanonicaEntrada`. Copie um arquivo existente como referência de forma.
2. Preencha `catalogoIds` com ids **reais** de `public/patologia/catalogo/patologias.json`.
   Uma entrada só pode pertencer a uma doença.
3. Escreva o conteúdo. O que o contrato exige de você:
   - cada etapa da cadeia causal precisa de `porQue` — a explicação de por que o
     próximo evento acontece, não o nome do próximo evento;
   - cada achado morfológico precisa de `processo` e `consequencia`, e de um
     `peso` (frequente, sugestivo, necessário, suficiente);
   - cada exame complementar precisa de `pergunta`, `limitacoes` e
     `mudaODiferencial` — lista de marcadores não passa;
   - cada diferencial precisa de motivo da confusão e discriminador;
   - `histologiaNormalDeReferencia` aponta para rotas reais do currículo de
     Histologia; se a lâmina exata não existir, marque `aproximado: true` e
     explique em `notaDeAproximacao`.
4. Registre o arquivo em `DOENCAS`, em `editorial/index.ts`.
5. Deixe `revisao.estado` em `rascunho` ou `revisao-medica` e liste o que falta
   em `revisao.pendencias`.
6. Rode `npm run histopatologia:conteudo` e depois `npm run histopatologia:dados`.

Campo que você não tem? Deixe ausente. A interface mostra "em preparação" — e
isso é melhor do que texto genérico, que é indistinguível de conteúdo revisado
para quem está aprendendo.

## Publicar uma doença

`revisao.estado: 'publicado'` exige, e o pipeline **falha o build** se faltar:

- histologia normal de referência, mecanismo geral e cadeia específica (≥ 4 etapas);
- roteiro histopatológico por aumento completo;
- correlação morfofuncional e ao menos um diferencial;
- referências bibliográficas registradas;
- `revisor`, `registroProfissional` e `revisadoEm` preenchidos.

Publicar é a única transição que torna a página indexável. Não use o estado para
sinalizar "está bom" — use para registrar que alguém habilitado assinou.

## Marcar uma entrada como não sendo doença

Acrescente-a a `ENTRADAS_NAO_NOSOLOGICAS` com o motivo. Ela continua visível e
pesquisável no atlas de inventário; o registro apenas distingue "ainda não
olhamos" de "olhamos e concluímos que não é uma entidade nosológica".

## Bloquear uma mídia específica

Use `midiasBloqueadas` na doença, com `midiaId` e um motivo de pelo menos oito
caracteres. É o caminho para retirar uma lâmina cuja legenda de origem afirma um
diagnóstico que a revisão não sustenta, sem retirar a entrada inteira.

## Direitos das fontes

FCM/Unicamp, Histopathology Atlas e WebPath estão aprovados para exibição remota.
Pathology Outlines e WebPathology permanecem **somente como links para a página
original**. Na WebPath, a autorização escrita permite imagem direta e visualizador
interno com ampliação; o Domine Aqui mantém crédito, página-fonte e roteiro autoral.
A decisão e os créditos estão registrados na
[ADR 0002](../../docs/adr/0002-direitos-de-midia-da-histopatologia.md).

O catálogo complementar do WebPath/Utah fica em
`data/histopatologia/webpath-utah/`: são 1.325 páginas de macroscopia ou
microscopia patológica e suas URLs remotas de imagem, separadas em 19 fragmentos.
Nenhum JPEG é copiado para o projeto. A interface carrega somente
o capítulo aberto, pagina 24 referências por vez e gera a tradução e a leitura
guiada a partir de texto editorial próprio, com zoom de 100% a 400%. Esses capítulos fazem parte do
índice e da busca do Atlas de lâminas; não constituem um módulo separado.

## Atualizar uma classificação

Conteúdo que depende de classificação, gradação, estadiamento ou biomarcador
deve registrar `organizacao`, `edicao` e `ano` na referência correspondente.
Quando a edição de referência for substituída, marque a doença como
`desatualizado` — o estado existe exatamente para isso.

## Disponibilidade em produção

Este módulo é uma subárea do Manual da Histologia: mora dentro da rota dele, passa pelo layout dele
e usa o mesmo portão de assinatura. Por isso a disponibilidade **acompanha** a do módulo que o
contém — com `HISTOLOGIA_HABILITADO=1`, a Histopatologia também está no ar.

`HISTOPATOLOGIA_HABILITADO` continua existindo para separar os dois, e só age quando é declarado:
`0` fecha apenas a Histopatologia (botão de emergência para um problema de direitos restrito a
ela), `1` abre apenas a Histopatologia (revisão isolada, com a Histologia fechada). Sem valor
declarado, herda.

A flag governa somente a disponibilidade da rota — nunca os direitos de mídia, que continuam
decididos item a item por `resolverDireitos`.
