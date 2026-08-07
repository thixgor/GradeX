# Manual da Histologia — pacote de implementação

Este diretório prepara a criação do **Manual da Histologia**, seção nativa do Manual Clínico do GradeX. Ele não é a interface final: contém o acervo-fonte, a documentação editorial completa, dados normalizados, scripts de migração e um prompt mestre para o Claude Code.

## Conteúdo verificado

- 1.524 páginas do atlas e 21 índices/entradas locais (1.545 HTMLs documentados);
- 1.318 imagens-base;
- 7.775 camadas PNG de marcadores vermelhos;
- 19 quizzes, 388 questões/imagens e 19 pacotes H5P;
- 9.500 referências de arquivo, 9.385 URLs únicas e 2.792.828.927 bytes únicos;
- exclusões deliberadas: Resources/Additional Resources, Review Textbook, Introductory Video e Randomize.

## Ordem de leitura

1. `LICENCA_E_PUBLICACAO.md` — bloqueio jurídico obrigatório;
2. `PROMPT_MESTRE_CLAUDE_CODE.md` — instrução pronta para implementação;
3. `ARQUITETURA_E_MAPEAMENTO.md` — rotas, componentes e transformação dos HTMLs;
4. `documentacao/INVENTARIO_HTML_COMPLETO.md` — finalidade de cada um dos 1.545 HTMLs;
5. `dados/` — fontes normalizadas para ingestão;
6. `scripts/` — validação e envio do acervo para Vercel Blob.

## Regra técnica decisiva

`acervo-fonte/` permanece nesta árvore para preservação e entrega via Git LFS, mas é ignorado pelo deploy da Vercel. O build deve consumir URLs do Blob/CDN geradas por `scripts/enviar-assets-vercel-blob.mjs`; tentar empacotar 2,60 GiB em `public` torna o deploy inviável.
