# PROMPT MESTRE — implementar o Manual da Histologia no GradeX

Você é o Claude Code atuando como principal engineer, product designer e arquiteto de conteúdo biomédico no repositório GradeX. Implemente uma nova seção do **Manual Clínico** chamada **Manual da Histologia**. A experiência precisa provocar deslumbramento pela clareza, profundidade e sensação de manipular uma lâmina real — não por efeitos gratuitos. Entregue software de produção, acessível, rápido, testável e cientificamente responsável.

## 1. Leia antes de alterar qualquer código

Leia integralmente, nesta ordem:

1. `public/Manual-Histologia/LICENCA_E_PUBLICACAO.md`;
2. `public/Manual-Histologia/README.md`;
3. `public/Manual-Histologia/ARQUITETURA_E_MAPEAMENTO.md`;
4. `public/Manual-Histologia/documentacao/INVENTARIO_HTML_COMPLETO.md`;
5. amostras representativas de `dados/paginas.jsonl`, `dados/quizzes.jsonl`, `dados/midia.jsonl` e `dados/plano-assets-blob.jsonl`;
6. as implementações reais de `app/manual-clinico/page.tsx`, `app/manual-clinico/layout.tsx`, `app/manual-clinico/tomografia/**`, `components/tomografia/**`, `lib/tomografia/**`, `app/sitemap.ts`, `app/robots.ts`, `lib/seo.ts`, `components/app-shell.tsx` e `app/globals.css`.

Antes de codificar, responda com: diagnóstico do repositório; decisão de integração; riscos; fases; arquivos a criar/alterar; testes; perguntas realmente bloqueantes. Não invente bibliotecas ou APIs: confirme versões no `package.json`.

## 2. Portão jurídico inegociável

O acervo está sob CC BY-NC-SA 4.0. O GradeX tem assinatura/Plus+. Não publique esse conteúdo atrás de paywall e não reutilize automaticamente o controle de acesso da Tomografia. A implementação só pode ir para produção se o módulo for integralmente gratuito e sem exploração comercial contextual, ou se existir autorização escrita dos titulares. Se não houver decisão registrada, implemente um feature flag desligado em produção e deixe o bloqueio explícito. Preserve atribuições por lâmina, licença, fonte, alterações e créditos específicos.

## 3. Resultado esperado

Crie um módulo nativo em `/manual-clinico/histologia`, integrado visual e tecnicamente ao Manual Clínico, mas com identidade própria. Não copie os HTMLs antigos, não use iframe e não faça uma “galeria de fotos”. Construa simultaneamente:

- manual didático extremamente aprofundado;
- atlas pesquisável por estruturas e sistemas;
- microscópio virtual com overlays;
- laboratório virtual de preparação e coloração;
- prática guiada e prova prática;
- quizzes nativos;
- sistema de progresso, favoritos, caderno e retomada.

Toda interface e todo texto ao usuário devem estar em português brasileiro impecável. Conteúdo oriundo do inglês deve ser traduzido/revisado; enquanto não houver revisão biomédica, exiba estado editorial interno e não finja validação.

## 4. Identidade visual

Use obrigatoriamente `public/Manual-Histologia/brand/LOGO_MANUAL_DA_HISTOLOGIA.svg`. A direção de arte nasce da histologia: marfim de lâmina, grafite de microscópio, hematoxilina violeta, eosina rosa/coral e pequenos acentos vermelhos derivados dos marcadores. Crie profundidade com grão microscópico sutil, retícula/micrômetro, luz transmitida e transições de foco. Preserve a linguagem do GradeX.

Evite cyberpunk, neon excessivo, glassmorphism ilegível, partículas gratuitas, cards genéricos em grade e animações que atrasem o estudo. Motion deve explicar estado, zoom, foco, troca de camada e navegação. Respeite `prefers-reduced-motion`.

## 5. Home que apresenta a proposta em segundos

A landing deve conter: logo, frase de valor clara, lâmina hero real com crédito, CTA “Abrir microscópio”, CTA “Explorar atlas”, busca instantânea, “Continuar estudando”, indicadores reais derivados dos dados, mapa curricular completo, laboratórios, quizzes e trilhas sugeridas. O mapa não pode achatar a hierarquia: Histologia Básica, Células, Tecidos e Órgãos e Sistemas, com subsetores na ordem do catálogo.

O card do Manual da Histologia também deve ser adicionado à home do Manual Clínico, ao tour e à navegação pertinente, sem quebrar os módulos existentes.

## 6. Página didática padrão

Cada lâmina/tema combina estudo e observação:

1. breadcrumb e posição no currículo;
2. título, objetivos e tempo estimado;
3. resumo orientador;
4. microscópio virtual;
5. lista pesquisável de estruturas;
6. dossiê da estrutura selecionada;
7. “como reconhecer” em diferentes aumentos;
8. células, matriz, arquitetura e função;
9. origem embrionária/histogênese;
10. coloração e aparência;
11. ultraestrutura quando relevante;
12. vascularização, inervação, renovação e homeostase quando pertinentes;
13. diferenciais e armadilhas;
14. correlações clínicas sem transformar a página em aconselhamento médico;
15. checkpoint e resumo de alta retenção;
16. referências, licença, autoria e histórico editorial.

Não invente fatos para preencher campos. Crie um schema que aceite estado `pendente-de-revisao`, referências e revisor. O aprofundamento novo deve citar fontes acadêmicas adequadas e passar por revisão humana antes de ser marcado como publicado.

## 7. Microscópio virtual — núcleo da experiência

Implemente um viewer próprio ou uma biblioteca madura avaliada no repositório. Requisitos:

- pan fluido; zoom por roda, pinch, botões e teclado;
- objetivos 4×, 10×, 40× e 100× como presets de campo/zoom — não como falsa resolução óptica;
- foco macrométrico e micrométrico simulados com feedback visual moderado;
- iluminação, contraste e modo campo circular/tela cheia;
- mini mapa e indicador de posição;
- bandeja de lâminas e troca sem perder o contexto;
- overlays “todos/nenhum”, individuais e exclusivos, com opacidade;
- transformação geométrica única para base e overlay, garantindo alinhamento em qualquer viewport;
- modo Estudo: rótulo, explicação e realce acessível;
- modo Prova: rótulos escondidos, estrutura sorteada, resposta antes da revelação;
- comparação lado a lado sincronizada entre tecidos/colorações;
- atalhos documentados, foco visível, controles com nome acessível e alternativa textual;
- gestos sem conflito com o scroll da página;
- preload apenas do próximo recurso provável e cancelamento de requests obsoletos;
- escala em µm somente quando houver calibração comprovada nos dados.

Teste matematicamente o alinhamento das camadas e teste E2E zoom + pan + alternância + tela cheia em desktop e mobile.

## 8. Laboratório virtual — faça o aluno entender o processo

Crie módulos interativos:

- **Da coleta à lâmina:** fixação, desidratação, diafanização, inclusão, microtomia, banho-maria, montagem e conservação;
- **Bancada de colorações:** H&E e outras presentes no acervo, com finalidade, afinidade química e resultado esperado;
- **Diagnóstico de artefatos:** dobra, chatter, rasgo, compressão, precipitado, sub/supercoloração, retração e autólise; o aluno identifica a causa e corrige a etapa;
- **Ordem impossível:** atividade de organizar cartões das etapas, com explicação causal;
- **Embrião → tecido → órgão:** linha do tempo que conecta folhetos embrionários, diferenciação, arquitetura adulta e correlações;
- **Mesa de comparação:** duas lâminas, zoom sincronizado, anotações e checklist de diferenças;
- **Prova prática:** cronômetro opcional, sequência sem rótulos, confiança da resposta e relatório de erros por estrutura.

Simulação deve ensinar modelos e consequências; nunca fingir que blur arbitrário é óptica real ou que uma cor inventada é uma reação histoquímica.

## 9. Atlas e busca

A busca deve funcionar sem acentos e cobrir títulos, sinônimos, termos anatômicos, células, tecidos, órgãos, sistemas, rótulos dos overlays, colorações e correlações. Inclua autocomplete com teclado, histórico local removível, realce do termo e filtros combináveis por seção, sistema, tecido, órgão, coloração, aumento disponível, presença de quiz e revisão editorial.

Resultados mostram miniatura, breadcrumb, razão da correspondência e ações “ver no microscópio”, “estudar” e “comparar”. Uma busca por estrutura deve abrir a lâmina já centralizada/realçada apenas quando existir geometria confiável; caso contrário, abrir a camada correta sem prometer centralização.

## 10. Quizzes nativos

Transforme `quiz.json` em componentes React; não dependa do player H5P. Preserve imagem, alternativas, resposta, feedback e proveniência. Traduza e revise. Implemente embaralhamento determinístico por seed, navegação acessível, feedback explicativo, revisão de erros, retomada, resultado por assunto e modo prática/prova. Não exponha a resposta no HTML inicial do modo prova se isso comprometer a atividade. Teste scoring, seed, persistência e teclado.

## 11. Didática, progresso e encantamento útil

Use objetivos observáveis, revelação progressiva, checkpoints curtos, repetição espaçada e comparação deliberada. Mantenha progresso versionado em armazenamento local se não houver backend apropriado; forneça migração de schema, exportar/apagar dados e tolerância a corrupção. Recursos: favoritos, recentes, caderno de lâminas, notas privadas, estruturas “a revisar”, trilha recomendada e “continuar de onde parei”. Gamificação só se representar domínio real; não use confete para mascarar conteúdo raso.

## 12. Dados e pipeline de mídia

Defina schemas TypeScript/Zod para página, mídia, overlay, quiz, crédito, revisão e progresso. Preserve IDs, ordem, SHA-256, URL de origem e créditos. Gere dados menores por seção/slug e um índice de busca; não carregue JSONL gigantes no cliente.

O diretório `acervo-fonte/` é arquivo de migração e está fora do deploy. Antes da UI final, execute/integre `scripts/enviar-assets-vercel-blob.mjs`, valide o mapa resultante e faça o resolver de mídia usar Blob/CDN. Use cache imutável por hash, lazy loading, placeholders e tamanhos responsivos. Não duplique arquivos com o mesmo SHA-256.

## 13. Performance e arquitetura Next.js

Respeite Next.js 14 App Router e o padrão real do projeto. Prefira Server Components; use Client Components apenas para interação. Faça import dinâmico do microscópio/laboratório. Não gere 1.524 páginas no build inicial: use rotas dinâmicas, ISR/on-demand e acesso por slug. Controle memória do browser, dispose listeners/canvas e virtualize listas longas. Defina budgets e meça LCP, CLS e INP em mobile.

## 14. Acessibilidade

Meta: WCAG 2.2 AA. Toda função deve operar por teclado; overlays precisam de equivalente textual; ícones têm rótulos; estados não dependem só de cor; foco é previsível; diálogos prendem/restauram foco; controles têm alvo de toque adequado; contraste é verificado; zoom da página não é bloqueado. Imagens têm alt contextual, e imagens de avaliação usam descrição que não entrega a resposta.

## 15. SEO, confiança e privacidade

Implemente metadata por página, canonical, Open Graph coerente, sitemap escalável e JSON-LD (`MedicalWebPage`/`LearningResource` quando correto). Exiba data de revisão, revisor, referências e aviso educacional. Analytics apenas de eventos úteis e sem resposta livre/notas/dados sensíveis: busca executada (termo anonimizado ou categoria), lâmina aberta, overlay usado, quiz iniciado/concluído e laboratório concluído.

## 16. Fases obrigatórias

- **Fase 0:** auditoria, portão de licença, schemas e ADRs.
- **Fase 1:** ingestão, validação, deduplicação e migração Blob/CDN.
- **Fase 2:** shell, home, navegação, atlas e busca.
- **Fase 3:** página didática e microscópio completo.
- **Fase 4:** quizzes, laboratório, comparação e prova prática.
- **Fase 5:** progresso, caderno, SEO, analytics e refinamento visual.
- **Fase 6:** testes, acessibilidade, performance, revisão biomédica e rollout controlado.

Ao fim de cada fase: rode TypeScript, lint, testes relevantes e build; reporte comandos e resultados; faça commits pequenos e descritivos. Não “resolva” falhas removendo testes, relaxando tipos ou silenciando acessibilidade.

## 17. Critérios de pronto

A entrega só está pronta quando: todos os contadores conciliam com o relatório; todo asset resolve por hash; todos os overlays alinham; busca encontra sinônimos e termos sem acento; o fluxo completo funciona em tela pequena; quiz é navegável por teclado; créditos estão a um clique; nenhum conteúdo proibido foi incluído; não há paywall indevido; e typecheck, lint, testes, build, auditoria de acessibilidade e budgets passam.

## 18. Proibições

Não: publicar antes do portão de licença; copiar layout legado; usar iframe; carregar o acervo inteiro no cliente; colocar os 2,60 GiB no deploy; inventar escala/calibração; traduzir automaticamente e chamar de revisado; gerar conteúdo biomédico sem fonte; perder créditos; usar efeitos que prejudiquem leitura; quebrar Tomografia/Farmacologia/Anatomia/ECG; ou concluir com placeholders silenciosos.

Comece pela auditoria e pelo plano. Depois implemente verticalmente uma fatia real — home → busca → página → microscópio → quiz — antes de multiplicar templates. O objetivo é que o usuário pense “agora eu finalmente entendi e consigo reconhecer isso na lâmina”.
