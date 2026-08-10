# Pacote de implementação — Histopatologia

Este diretório é a entrada editorial e técnica para a nova área de **Histopatologia** do Manual de Histologia do Domine Aqui.

Ele contém o plano de implementação, um prompt operacional para o Claude Code e o catálogo normalizado das lâminas. O catálogo guarda **URLs e metadados**; nenhuma imagem, miniatura ou lâmina virtual foi baixada ou incluída no repositório.

## Ordem de leitura para implementação

1. [`PLANO_IMPLEMENTACAO.md`](./PLANO_IMPLEMENTACAO.md) — arquitetura, experiência didática, modelo científico, fases e critérios de aceite.
2. [`PROMPT_CLAUDE_CODE.md`](./PROMPT_CLAUDE_CODE.md) — instrução executável para o agente de código.
3. [`CREDITOS_E_DIREITOS.md`](./CREDITOS_E_DIREITOS.md) — atribuição, proveniência e portões de publicação.
4. [`catalogo/README.md`](./catalogo/README.md) — contrato dos dados e forma de localizar as mídias de cada patologia.
5. [`catalogo/manifesto.json`](./catalogo/manifesto.json) — totais, fragmentos, hashes e conciliação.

## Conteúdo do catálogo

- **2.917 entradas catalogadas de patologia/tema**;
- **202.593 referências de mídia**;
- **202.301 referências da Unicamp**;
- **292 referências do Histopathology Atlas**;
- **18 fragmentos compactados**, agrupados por patologia;
- **0 arquivos de imagem armazenados**.

As entradas catalogadas não devem ser tratadas automaticamente como 2.917 diagnósticos canônicos. O acervo inclui doenças, variantes, técnicas, casos, recortes anatômicos e títulos editoriais. A implementação deve preservar a proveniência e criar uma camada editorial de consolidação, sem apagar o registro original.

## Destino no produto

- Os arquivos deste diretório ficam em `public/patologia` como acervo-fonte versionado.
- A nova experiência do usuário deve entrar em `/manual-clinico/histologia/histopatologia`.
- O pipeline deve produzir derivados enxutos em `data/histopatologia`, seguindo o padrão já usado por `data/histologia`.
- O catálogo bruto não deve ser carregado inteiro no navegador.

## Regra inegociável de mídia

Não baixar, copiar, reprocessar, otimizar, armazenar em Blob/CDN ou commitar as imagens catalogadas. Quando houver autorização jurídica registrada para uma coleção, usar a URL remota diretamente no navegador, com carregamento tardio. Sem autorização, mostrar crédito, descrição e link para a página de origem.
