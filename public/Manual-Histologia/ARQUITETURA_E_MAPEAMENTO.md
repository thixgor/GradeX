# Arquitetura e mapeamento da migração

## Rotas propostas

- `/manual-clinico/histologia` — home imersiva, retomada e mapa curricular;
- `/manual-clinico/histologia/atlas` — busca e filtros por sistema, tecido, coloração e estrutura;
- `/manual-clinico/histologia/laboratorio` — preparação, colorações e artefatos;
- `/manual-clinico/histologia/quizzes` e `/quizzes/[slug]` — avaliações nativas;
- `/manual-clinico/histologia/[...slug]` — seção, assunto e lâmina por conteúdo.

## Estrutura de código sugerida

```text
app/manual-clinico/histologia/
  layout.tsx  page.tsx  loading.tsx  error.tsx
  atlas/page.tsx  laboratorio/page.tsx
  quizzes/page.tsx  quizzes/[slug]/page.tsx
  [...slug]/page.tsx
components/histologia/
  hero/ curriculum/ search/ microscope/ dossier/ lab/ quiz/ progress/ credits/
lib/histologia/
  schema.ts  repository.ts  search.ts  assets.ts  progress.ts  quiz-engine.ts  seo.ts
```

## Conversão do legado

| Origem | Destino nativo | Regra |
|---|---|---|
| HTML de índice | CurriculumMap/SectionLanding | Sem iframe; composição responsiva e progresso |
| HTML com `metadata.json` e bases | SlideLesson + MicroscopeViewer | Imagem e overlays usam a mesma transformação geométrica |
| Overlay PNG vermelho | OverlayLayer acessível | Alternância individual/coletiva, opacidade e modo prova |
| `quiz.json`/H5P | QuizRunner React | Migrar questões e feedback; H5P só como prova de origem |
| `descricao_original` | Rascunho editorial | Traduzir, ampliar e submeter a revisão biomédica |
| créditos/URLs/hashes | CreditsDrawer + provenance | Sempre acessíveis na lâmina |

## Modelo editorial enriquecido por página

Cada tema final deve incluir: objetivos; visão geral; critérios de reconhecimento; morfologia em pequeno/médio/grande aumento; células, matriz e arquitetura; função; histogênese/origem embrionária; renovação e homeostase; vascularização/inervação quando pertinente; colorações e técnicas; ultraestrutura; relações morfofuncionais; diferenciais; armadilhas de identificação; correlações clínicas; checkpoint; resumo de alta retenção; referências e créditos.

A fonte catalogada não contém todo esse aprofundamento em português. O implementador deve tratar os metadados como matéria-prima, nunca inventar ciência e marcar conteúdo pendente de revisão especializada.

## Dados e desempenho

- validar todos os JSON/JSONL com Zod e manter IDs, ordem, proveniência e SHA-256;
- gerar índice de busca que remova acentos e inclua título, sinônimos, breadcrumb, rótulos de overlay e termos clínicos;
- servir mídia pelo Blob/CDN, com `sizes`, formatos responsivos, cache imutável e carregamento progressivo;
- não importar 9.385 mídias no bundle nem pré-renderizar 1.524 páginas no primeiro build; usar renderização sob demanda/ISR;
- preservar coordenadas e dimensões; nunca usar “escala em µm” sem calibração real.
