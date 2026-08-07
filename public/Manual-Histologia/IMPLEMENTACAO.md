# Manual da Histologia — estado da implementação

Documento de entrega. Descreve o que existe, o que está bloqueado e o que falta,
com precisão suficiente para que outra pessoa continue de onde este trabalho
parou. Ele é honesto sobre as lacunas de propósito: um relatório que declara
tudo pronto obriga o próximo a redescobrir o que não está.

## 1. Portão de licença — bloqueio ativo

**O módulo não pode ir a produção hoje.** O acervo é CC BY-NC-SA 4.0 e o GradeX
tem fluxos pagos; a cláusula NãoComercial impede a combinação. Nenhuma decisão
foi encontrada no repositório durante a auditoria.

Estado: `AUTORIZACAO.decisao === 'pendente'` em `lib/histologia/licenca.ts`.

O bloqueio é aplicado em **duas camadas**:

1. **`middleware.ts`** — devolve 404 real com `X-Robots-Tag: noindex` para
   `/manual-clinico/histologia*` e `/api/manual-clinico/histologia/*`. Esta é a
   camada que vale: as páginas do módulo são pré-renderizadas, e `notFound()`
   dentro de página estática faz o servidor responder **200** com o corpo do
   not-found (verificado em `next start`). Para um portão jurídico, 200 é
   convite à indexação.
2. **`app/manual-clinico/histologia/layout.tsx`** — `notFound()` como segunda
   barreira, para rotas que fujam do padrão de caminho tratado no middleware.

Além disso, o sitemap devolve lista vazia e `podeIndexar()` força
`noindex, nofollow` em toda a metadata do módulo.

**Como liberar:** ver `docs/adr/0001-licenca-manual-histologia.md`. Exige editar
`AUTORIZACAO` (decisão, responsável, data) **e** definir `HISTOLOGIA_HABILITADO=1`
no ambiente. As duas condições, não uma.

Não existe código de cobrança no módulo. A gratuidade é estrutural — não há
configuração para inverter por engano — e há teste que varre a superfície inteira
atrás de `useAcessoTomografia`, `PLUS_LABEL`, checkout ou `account-tier`.

## 2. Mídia — pendência operacional que bloqueia produção

Os 9.175 objetos (2,56 GiB) **ainda não foram enviados ao Vercel Blob**. Não foi
possível fazê-lo neste ambiente: os binários do acervo são ponteiros Git LFS
(`git-lfs` não está instalado) e `BLOB_READ_WRITE_TOKEN` não existe aqui.

O que já está pronto para o envio:

- o resolver (`lib/histologia/midia.ts`) monta a URL a partir de `sha256` + `ext`,
  no mesmo esquema de `scripts/enviar-assets-vercel-blob.mjs`;
- há teste conferindo essa derivação nos 9.175 assets;
- em produção sem `NEXT_PUBLIC_HISTOLOGIA_BLOB_BASE`, a interface mostra aviso
  explícito em vez de imagem quebrada;
- fora de produção, a mídia é servida da URL de origem, para permitir revisão.

**Passos para publicar a mídia:**

```bash
git lfs pull                                    # materializa os 2,56 GiB
node public/Manual-Histologia/scripts/validar-acervo.mjs
BLOB_READ_WRITE_TOKEN=... node public/Manual-Histologia/scripts/enviar-assets-vercel-blob.mjs
# depois, no ambiente:
NEXT_PUBLIC_HISTOLOGIA_BLOB_BASE=https://<store>.public.blob.vercel-storage.com
```

Sem `git lfs`, o acervo ainda pode ser **validado** pelos ponteiros: o `oid
sha256` do ponteiro é o hash do conteúdo real. `__tests__/histologia/acervo.test.ts`
faz essa conferência nos 9.175 assets e ela passa hoje — zero divergências.

## 3. Conciliação com o acervo

O pipeline (`npm run histologia:dados`) falha com código 1 se qualquer contador
divergir. Situação atual:

| Contador | Anunciado | Obtido |
|---|---|---|
| páginas | 1.524 | 1.524 ✔ |
| imagens-base | 1.318 | 1.318 ✔ |
| camadas de marcador | 7.775 | 7.775 ✔ |
| imagens de quiz | 388 | 388 ✔ |
| pacotes H5P | 19 | 19 ✔ |
| quizzes | 19 | 19 ✔ |
| questões | 388 | 388 ✔ |
| referências de arquivo | 9.500 | 9.500 ✔ |
| assets únicos (SHA-256) | 9.175 | 9.175 ✔ |

Das 1.524 páginas, **1.320 são lâminas** e **204 são nós de índice** (sem imagem
nem marcador) — estas viram landings de seção, não lâminas vazias.

### Divergência registrada

O `README.md` do pacote anuncia **2.792.828.927 bytes únicos**. Esse número não
corresponde a nada computável a partir dos dados:

- soma dos 9.175 objetos deduplicados: **2.750.855.677** (2,56 GiB);
- soma das 9.500 referências: **2.811.077.750**.

O valor anunciado fica entre os dois e não bate com nenhum. Como os outros nove
contadores fecham exatamente, o dado suspeito é esse. A divergência é registrada
em `data/histologia/relatorio.json` (campo `notas`) em vez de arredondada.

### Correções sobre o acervo, feitas na ingestão

1. **`_rota_sugerida` foi descartada.** Tinha 1.248 valores para 1.524 páginas
   (37 grupos colidiam, um deles resolvendo para `/manual-clinico/histologia/`) e
   truncava segmentos em 18 caracteres (`endoplasmic-reticu`). Os slugs passam a
   nascer de `caminho_setorial`, com unicidade verificada por teste.
2. **`blobPath` não é derivável do MIME** em 21 dos 9.175 assets: duas imagens
   são `.jpeg` e os 19 pacotes H5P chegam como `application/octet-stream`. A
   extensão é preservada em cada mídia.
3. **Uma colisão real de breadcrumb.** "Brunner's glands" e "Submucosal plexus"
   ocupam o mesmo `caminho_setorial` ("Small intestine 16"). A segunda ganhou nó
   próprio, nomeado pelo seu título — e não um sufixo `-2` sem significado.

## 4. Tradução — 55,8% e declarada

Os títulos, rótulos e explicações do acervo estão em inglês. A tradução é feita
por **glossário editorial curado** (`lib/histologia/glossario.ts`), termo a termo,
com a terminologia consagrada em português. Nunca automaticamente.

- **4.341 de 7.775 rótulos traduzidos (55,8%).**
- Termo fora do glossário **permanece em inglês** e recebe a tarja "original" na
  interface. Lacuna visível é melhor que preenchimento falso.
- Não há fallback morfológico ("-ium → -io"): uma regra dessas geraria termo
  plausível e errado exatamente onde ninguém conferiria.

Ampliar a cobertura é acrescentar entradas ao glossário e rodar
`npm run histologia:dados`. Os 1.000 rótulos mais frequentes cobrem 80% das
ocorrências.

## 5. Revisão biomédica — pendente em tudo

**Nenhum conteúdo está marcado como publicado.** Todas as 1.524 páginas e os 19
quizzes carregam `revisao.estado === 'pendente-de-revisao'`, e a interface exibe
a tarja correspondente.

O schema (`esquemaRevisao`) **recusa** `estado: 'publicado'` sem `revisor` e
`revisadoEm` preenchidos — não é convenção, é validação. Há teste que confirma.

## 6. Aprofundamento didático — o que falta escrever

A página didática prevê 16 blocos. Existem hoje: trilha, título, tempo estimado,
resumo, microscópio, lista pesquisável de estruturas, dossiê da estrutura,
coloração e aparência, checkpoint (via quizzes do assunto), créditos e histórico
editorial.

**Não existem, e a página declara isso ao aluno em vez de preencher:**

- histogênese e origem embrionária;
- ultraestrutura;
- vascularização, inervação e renovação;
- diagnósticos diferenciais e armadilhas;
- correlações clínicas;
- resumo de alta retenção.

O acervo não fornece nada disso em português, e escrever conteúdo biomédico sem
fonte é a linha que este módulo não cruza. `esquemaDossie` já aceita todos esses
campos, com `referencias` e `revisao` — é só preencher, citar e submeter a
revisão.

## 7. O que ficou de fora do escopo entregue

Declarado explicitamente, para não virar surpresa:

- **Comparação lado a lado sincronizada** entre duas lâminas. A matemática de
  viewport já suporta (um `Campo` compartilhado entre dois palcos), mas a
  interface não foi construída.
- **Prova prática** (sequência sem rótulos, sorteio de estrutura, cronômetro). O
  microscópio já aceita `modo="prova"`, que esconde os rótulos; falta o
  orquestrador da sessão. O cronômetro e a confiança da resposta existem no
  quiz.
- **Embrião → tecido → órgão** e **mesa de comparação** — dois dos sete módulos
  de laboratório previstos. Os quatro implementados são: da coleta à lâmina,
  ordem impossível, bancada de colorações e diagnóstico de artefatos.
- **Repetição espaçada.** Há "estruturas a revisar" e relatório de erros por
  assunto, mas não um algoritmo de agendamento.
- **Testes E2E** (Playwright). Há 136 testes unitários e de integridade de dados,
  incluindo a matemática de alinhamento das camadas, mas não uma bateria de
  navegador.
- **Medição de LCP/CLS/INP em dispositivo real.** O build reporta 2,7 kB para a
  home e 7,8 kB para a lâmina (228–231 kB de first load, contra 438 kB da
  Tomografia), mas não houve medição de campo.

## 8. Comandos

```bash
npm run histologia:dados   # reingestão; falha se algum contador divergir
npm test                   # 136 testes
npx tsc --noEmit           # 0 erros
npx next build             # compila; ver nota sobre variáveis de ambiente
```

O build exige `MONGODB_URI` e `JWT_SECRET` por causa de rotas de admin
pré-existentes, sem relação com este módulo — falha idêntica ocorre em `master`.

## 9. Arquitetura, em cinco linhas

- `public/Manual-Histologia/dados/*.jsonl` (52 MB) é **fonte**, fora do deploy.
- `scripts/histologia/construir-dados.mjs` gera `data/histologia/`, fragmentado
  por subsetor (22 arquivos, 8,7 MB) mais dois índices de busca.
- `lib/histologia/carregadores.gerado.ts` é um mapa **literal** de `import()`,
  gerado — literal porque o file-tracing da Vercel precisa enxergar cada
  especificador; gerado porque à mão dessincronizaria.
- As 1.524 páginas são servidas por uma rota catch-all com ISR. Não há
  `generateStaticParams` — pré-renderizar tudo custaria dezenas de minutos.
- O microscópio aplica **uma** transformação a base e overlays, irmãos em
  `inset-0`. O alinhamento é estrutural, não um cuidado.
