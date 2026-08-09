# Catálogo de patologias e mídias

## Princípio

O catálogo relaciona cada entrada de patologia às mídias encontradas nos dois atlas. Ele armazena somente URLs, descrições e proveniência. Os arquivos `.json.gz` contêm texto JSON compactado; não contêm bytes de imagens.

## Como localizar as mídias de uma patologia

1. Ler `patologias.json`.
2. Localizar a entrada pelo campo `id` ou por busca editorial em `nomeCatalogado`.
3. Ler a lista `fragmentosDeMidia` dessa entrada.
4. Descompactar somente esses fragmentos.
5. Filtrar os registros cujo `patologiaId` seja igual ao `id` da patologia.

Cada grupo de patologia foi mantido junto sempre que possível. Patologias excepcionalmente grandes podem apontar para mais de um fragmento.

## Arquivos

- `manifesto.json`: totais, fragmentos, tamanhos e SHA-256.
- `fontes.json`: créditos e política inicial de direitos de cada fonte.
- `patologias.json`: índice leve das 2.917 entradas.
- `midias/*.json.gz`: 202.593 registros de mídia, agrupados por patologia.
- `falhas-de-coleta.json`: páginas que não puderam ser lidas; não inventar conteúdo para elas.
- `esquemas/*.schema.json`: contratos JSON para validação e tipagem.

## Campos de patologia

- `id`: identificador estável derivado de fonte, nome e slug catalogado.
- `fonteId`: `unicamp` ou `histopathology-atlas`.
- `nomeCatalogado`: título encontrado na fonte; não é tradução nem diagnóstico revisado.
- `slugCatalogado`: normalização usada durante a coleta.
- `sistemaCatalogado`: classificação automatizada preliminar.
- `descricaoCatalogada`: contexto descritivo recuperado da fonte.
- `quantidadeMidias`, `quantidadeImagens`, `quantidadeVisualizadores`: contadores do catálogo.
- `paginasFonte`: páginas de origem relacionadas.
- `revisao`: sempre começa pendente.
- `fragmentosDeMidia`: arquivos que contêm as mídias da entrada.

## Campos de mídia

- `id`: identificador da mídia no catálogo.
- `patologiaId`: chave estrangeira para `patologias.json`.
- `fonteId`: chave para `fontes.json`.
- `patologia`, `sistema`, `modalidade`, `coloracao`, `descricao`: metadados catalogados.
- `urlPaginaFonte`: página que sustenta a proveniência.
- `urlImagem`: URL remota da imagem, quando identificada.
- `urlMiniatura`: URL remota de miniatura, quando distinta.
- `urlVisualizador`: visualizador de lâmina virtual, quando existente.
- `politicaDeExibicao`: exige decisão de direitos antes de incorporar.

Campos ausentes não devem ser fabricados. `Não informado` é preferível a uma suposição.

## Descompactação em Node.js

```js
import { gunzipSync } from 'node:zlib'
import { readFileSync } from 'node:fs'

const bytes = readFileSync('public/patologia/catalogo/midias/unicamp-001.json.gz')
const midias = JSON.parse(gunzipSync(bytes).toString('utf8'))
```

O pipeline do produto deve fazer essa leitura em build ou no servidor. Não enviar todos os fragmentos ao navegador.

## Integridade

Execute:

```bash
node public/patologia/scripts/validar-catalogo.mjs
```

O validador confere hashes, contagens, JSON, referências de fonte e vínculo de toda mídia a uma patologia.
