# Sincronização de imagens: tirando o acervo do Imgur

O site guardava imagem como URL de terceiro. Capa de prova, figura de questão,
imagem de alternativa, mecanismo de patologia, capa de tópico, banner de
campanha, foto de prêmio: tudo era `https://i.imgur.com/…` gravado no Mongo.

Isso custava duas coisas. **Velocidade**, porque cada figura exigia DNS, TLS e um
round-trip a um host que não controlamos, no meio da renderização — e o Imgur
serve o arquivo original, de 1 a 3 MB, mesmo quando o card tem 300 px.
E **existência**: no dia em que o Imgur mudar a política, apagar o que é anônimo
ou simplesmente sair do ar, o acervo inteiro vira quadrado cinza, de uma vez, sem
aviso e sem como recuperar.

Esta seção descreve o conserto: trazer os arquivos para o nosso armazenamento,
trocar as URLs por caminhos nossos, e impedir que o problema volte.

---

## O endereço nosso

Toda imagem internalizada mora em:

```
/midia/<aa>/<sha256>.<ext>
```

Três decisões estão embutidas aí.

**É caminho relativo, não a URL do fornecedor.** O banco guarda `/midia/…`, e
`next.config.js` reescreve isso para o CDN do Vercel Blob. Gravar
`https://xyz.public.blob.vercel-storage.com/…` em milhares de documentos seria
repetir o erro que estamos desfazendo — trocar um domínio de terceiro por outro.
Com a indireção, mudar de armazenamento é editar `BLOB_PUBLIC_BASE_URL`.

**O nome é o SHA-256 do conteúdo.** Duas consequências boas: a mesma capa
reaproveitada em quarenta provas vira um arquivo só, e o endereço é imutável, o
que libera `Cache-Control: immutable` no CDN.

**A prateleira `<aa>` são os dois primeiros dígitos do hash.** Espalha os
arquivos em 256 pastas em vez de um diretório com dezenas de milhares de
entradas.

### Como o endereço é servido

| Situação | Quem responde | Custo |
| --- | --- | --- |
| `BLOB_PUBLIC_BASE_URL` definida | reescrita do `next.config.js`, direto ao CDN | nenhuma função invocada |
| variável ausente | `app/midia/[...caminho]/route.ts` | um redirecionamento por imagem |

A segunda linha existe para que esquecer uma variável de ambiente não apague
todas as imagens do site de uma vez.

---

## A migração, passo a passo

### 1. Ensaio

```bash
npm run midia:ensaio
```

Lê o banco inteiro, não escreve nada e imprime o inventário: quantas URLs
externas existem, em que hosts, em que coleções, e quantas referências. O
relatório completo — URL a URL, com um exemplo de onde cada uma aparece — fica em
`.midia/relatorio.json`.

Requer `MONGODB_URI` (o script lê `.env.local` automaticamente).

Leia esse relatório antes de seguir. É a hora de descobrir que metade do acervo
está num host que ninguém lembrava, ou que 300 imagens já não existem.

### 2. Aplicação

```bash
npm run midia:sincronizar
```

Agora com `BLOB_READ_WRITE_TOKEN` também definido. Baixa cada URL única uma vez,
confere que é imagem de verdade, envia ao armazenamento e reescreve os
documentos.

É **retomável**: interromper no meio e rodar de novo continua de onde parou,
porque o estado mora em `media_assets`, não no processo. E é **idempotente**:
rodar duas vezes sobre a base já migrada não muda nada e não baixa nada.

### 3. Conferência

Abra algumas páginas — uma questão com imagem, uma patologia com figura, a
listagem de provas. As URLs devem começar em `/midia/`.

### 4. Se algo der errado

Cada documento tocado deixa uma entrada em `media_sync_journal` com os valores
anteriores. Para desfazer um lote inteiro:

```bash
node --experimental-strip-types --env-file-if-exists=.env.local \
  scripts/midia/sincronizar-imagens.mjs --reverter=<lote> --aplicar
```

O número do lote aparece no fim da execução que você quer desfazer. A reversão
devolve as URLs originais aos documentos; os arquivos já internalizados
continuam no armazenamento (nada é apagado, então reaplicar depois é barato).

---

## Opções do script

| Opção | Para quê |
| --- | --- |
| `--aplicar` | grava de verdade. Sem isso é ensaio |
| `--colecao=a,b` | só estas coleções |
| `--pular-colecao=a,b` | exceto estas |
| `--incluir-logs` | não pula as coleções de telemetria |
| `--limite=N` | no máximo N documentos por coleção — bom para o primeiro teste |
| `--max-imagens=N` | para a ingestão depois de N imagens novas |
| `--concorrencia=N` | downloads simultâneos (padrão 6) |
| `--somente-imgur` | ignora qualquer host que não seja do Imgur |
| `--incluir-host=h1,h2` | trata estes hosts como acervo migrável |
| `--tentar-falhas` | reprocessa o que já falhou de forma definitiva |
| `--codigo` | também reescreve as URLs fixas no código-fonte |
| `--relatorio=arq.json` | grava o relatório completo |
| `--reverter=<lote>` | desfaz um lote e sai |

Uma primeira execução prudente:

```bash
node --experimental-strip-types --env-file-if-exists=.env.local \
  scripts/midia/sincronizar-imagens.mjs \
  --colecao=banco_questoes --limite=50 --aplicar
```

---

## O que o script decide sozinho

**O que é imagem.** Uma URL entra na migração quando o host é conhecidamente de
imagem (Imgur e parecidos, que servem sem extensão no caminho) **ou** quando o
caminho termina em extensão de imagem. Links de YouTube, Spotify e Drive são
recusados de saída — no texto das patologias eles convivem com as figuras, nos
embeds `!video[…]`. A ingestão ainda confere o `Content-Type` da resposta antes
de gravar qualquer coisa.

**Onde as imagens estão.** A varredura é genérica: percorre cada documento
inteiro, em qualquer profundidade, e acha URL em campo dedicado, dentro de array,
em objeto aninhado e no meio de texto longo (`!image[legenda](url)` e
`<img src>`). Não existe catálogo de campos a manter — o que significa que uma
seção nova do site já nasce coberta.

**O que fazer com imagem morta.** O Imgur não devolve 404 para imagem apagada:
ele redireciona para um PNG de aviso e responde 200. Sem tratamento, cada imagem
perdida viraria um asset legítimo e a figura clínica seria trocada pelo mascote
triste do Imgur, em silêncio e para sempre. O script reconhece esse
redirecionamento, registra a falha em `media_sync_falhas` e **deixa o documento
como está** — uma imagem quebrada continua quebrada, o que é honesto, em vez de
virar uma imagem errada.

Um campo de texto com dez figuras, das quais o Imgur apagou uma: as nove migram,
a décima fica apontando para a origem e aparece em `pendentes` no relatório.

**SVG não é migrado.** É documento executável, e o acervo aceita URL de origem
externa: internalizar um SVG traria script de terceiro para dentro de `/midia/`,
servido pelo nosso domínio, onde abrir o link direto o executaria na nossa
origem. URLs `.svg` seguem apontando para onde estão.

---

## Onde caminho relativo **não** serve

`/midia/…` funciona em `<img>` e em `next/image`, porque o navegador resolve
contra a origem da página. Há dois lugares onde não funciona:

- **Open Graph.** A imagem de compartilhamento é buscada pelo WhatsApp e pelo
  Facebook, fora do nosso contexto. Caminho relativo ali apaga a prévia de todo
  link compartilhado do site.
- **`fetch` dentro do servidor.** Não existe "origem da página" numa função;
  `fetch('/midia/…')` lança.

O modo `--codigo` conhece os três arquivos do repositório onde isso vale
(`lib/seo.ts`, `app/apg/route.ts` e a logo do PDF em
`app/api/banco/listas/[id]/pdf/route.ts`), pula cada um e diz por quê. Trocar
esses três exige URL absoluta do nosso domínio — decisão de quem estiver
migrando, não do script.

O mesmo cuidado vale se algum documento do banco alimentar uma tag de Open Graph
diretamente. Hoje não é o caso: `app/lead/[slug]/layout.tsx` e
`app/api/og/material/[id]/route.ts` já passam a URL por `absoluteUrl()`, que
transforma caminho relativo em absoluto.

---

## Para o problema não voltar

A migração conserta o passado. Duas coisas cuidam do futuro.

**Na escrita.** As rotas de criação, edição e importação de questões passam o
documento por `lib/midia/internalizar.ts` antes de gravar: o link do Imgur colado
no editor vira arquivo nosso na hora. Se o download falhar, a URL original passa
intacta — perder o trabalho do admin porque o Imgur devolveu 503 seria um remédio
pior que a doença. Há orçamento de tempo, para que uma importação de 300 questões
não estoure o limite da função.

**Na varredura noturna.** `/api/cron/midia-sync` roda às 5h e reexamina um pedaço
do acervo por execução, trazendo o que ficou para trás. Ela existe porque o site
tem dezenas de telas que gravam URL de imagem, e pendurar um gancho em cada uma
seria garantir que a próxima nasce sem. Reexaminar o acervo cobre inclusive as
telas que ainda não foram escritas.

A varredura é incremental: guarda em `media_sync_estado` em que coleção e em qual
`_id` parou, e cobre a base inteira ao longo de alguns dias, com teto de tempo
(240s) e de imagens (120) por execução.

---

## Coleções criadas

| Coleção | Papel |
| --- | --- |
| `media_assets` | um documento por arquivo internalizado: hash, caminho, tipo, tamanho e todas as URLs de origem que resolveram para ele |
| `media_sync_falhas` | URLs que não puderam ser baixadas, com motivo, contagem de tentativas e se a falha é definitiva |
| `media_sync_journal` | valores anteriores de cada documento tocado — é o que torna a migração reversível |
| `media_sync_estado` | onde a varredura noturna parou |

---

## Variáveis de ambiente

| Variável | Papel |
| --- | --- |
| `BLOB_READ_WRITE_TOKEN` | credencial de escrita. Sem ela a internalização fica desligada (e o cron responde 200 dizendo que pulou) |
| `BLOB_PUBLIC_BASE_URL` | domínio público do store, para a reescrita direta ao CDN |
| `MIDIA_INTERNALIZAR_NA_ESCRITA` | `0` desliga a internalização no momento da escrita |

---

## Onde está cada coisa

| Arquivo | Papel |
| --- | --- |
| `lib/midia/urls.ts` | lógica pura: o que é imagem externa, como extrair de um texto, como montar o caminho canônico |
| `lib/midia/varredura.ts` | percorre um documento e monta o `$set` em dot-notation |
| `lib/midia/deposito.ts` | baixa, valida, calcula o hash, envia ao armazenamento e registra |
| `lib/midia/internalizar.ts` | internalização no momento da escrita, usada pelas rotas do admin |
| `lib/midia/varredura-incremental.ts` | o motor da varredura noturna |
| `scripts/midia/sincronizar-imagens.mjs` | a migração em massa |
| `app/api/cron/midia-sync/route.ts` | a rotina agendada |
| `app/midia/[...caminho]/route.ts` | resolução de `/midia/*` quando não há reescrita |
