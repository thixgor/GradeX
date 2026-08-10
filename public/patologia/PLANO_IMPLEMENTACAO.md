# Plano de implementação — Histopatologia no Manual de Histologia

## 1. Objetivo final

Implementar uma área de **Histopatologia (Anatomia Patológica)** integrada ao Manual de Histologia atual do Domine Aqui, em português brasileiro, gratuita, altamente didática e cientificamente responsável.

A nova área deve permitir que o estudante percorra a cadeia causal completa:

> histologia normal → agressão/etiologia → mecanismo patológico geral → mecanismo específico da doença → alteração macro e microscópica → disfunção do órgão → manifestação clínica → raciocínio diferencial.

O catálogo já preparado deve ser usado como fonte organizada de imagens e lâminas. Nenhuma imagem deve ser baixada, copiada para o repositório, enviada para Vercel Blob, convertida ou processada pelo servidor do Domine Aqui. O produto trabalha com **ponteiros remotos**, proveniência, crédito e portão de direitos.

## 2. Escopo desta entrega

O Claude Code deverá implementar:

1. a arquitetura de dados da Histopatologia;
2. a ingestão do catálogo em `public/patologia/catalogo`;
3. a nova navegação dentro do Manual de Histologia;
4. páginas por sistema, mecanismo e doença;
5. ligação explícita entre histologia normal e patológica;
6. galeria de lâminas e visualizadores remotos com crédito por item;
7. busca, filtros e trilhas didáticas;
8. estados de revisão biomédica e de direitos;
9. testes de integridade, interface, acessibilidade e desempenho;
10. documentação para manutenção editorial.

O catálogo completo deve estar consultável desde a primeira versão, mas conteúdo médico aprofundado só pode aparecer como publicado quando tiver passado pelo fluxo de revisão. Não preencher lacunas científicas com texto genérico ou inferências não verificadas.

## 3. Compatibilidade com a arquitetura atual do Domine Aqui

O repositório já possui um módulo maduro de Histologia:

- rotas em `app/manual-clinico/histologia`;
- componentes em `components/histologia`;
- contratos Zod em `lib/histologia/esquemas.ts`;
- repositório server-only e fragmentação de dados;
- pipeline em `scripts/histologia/construir-dados.mjs`;
- dados derivados em `data/histologia`;
- busca e APIs próprias;
- portão de licença e estado de revisão biomédica;
- testes em `__tests__/histologia`.

A Histopatologia deve seguir esses padrões, mas não deve ser acoplada artificialmente ao acervo atual. As fontes, licenças, modelos de conteúdo e volume são diferentes.

### Estrutura proposta

```text
app/manual-clinico/histologia/
└── histopatologia/
    ├── page.tsx
    ├── atlas/page.tsx
    ├── mecanismos/page.tsx
    ├── sistemas/[sistema]/page.tsx
    ├── doencas/[slug]/page.tsx
    └── comparar/[...slugs]/page.tsx

components/histopatologia/
├── busca.tsx
├── cartao-doenca.tsx
├── cadeia-fisiopatologica.tsx
├── comparador.tsx
├── galeria-remota.tsx
├── imagem-remota.tsx
├── mapa-mecanismos.tsx
├── painel-revisao.tsx
├── roteiro-microscopico.tsx
└── seletor-aumento.tsx

lib/histopatologia/
├── esquemas.ts
├── licenca.ts
├── midia.ts
├── repositorio.ts
├── rotas.ts
├── busca.ts
├── seo.ts
└── texto.ts

scripts/histopatologia/
├── construir-dados.mjs
└── validar-conteudo.mjs

data/histopatologia/
├── indice.json
├── mecanismos.json
├── sistemas.json
├── fragmentos/
└── busca.json
```

O catálogo-fonte permanece em `public/patologia`. Os derivados usados pelo Next.js devem ir para `data/histopatologia`, como já ocorre no Manual de Histologia. Não carregar arquivos `.json.gz` diretamente em um componente cliente.

## 4. Arquitetura de informação

### Entrada principal

Adicionar à página inicial do Manual de Histologia uma escolha clara, sem quebrar as rotas existentes:

- **Histologia normal** — estrutura e função do tecido saudável;
- **Histopatologia** — mecanismos de doença e padrões morfológicos;
- **Comparar normal × patológico** — ponto de entrada para aprendizagem visual.

### Navegação da Histopatologia

Oferecer quatro modos complementares:

1. **Por sistema/órgão**: cardiovascular, respiratório, gastrointestinal, hepatobiliopancreático, urinário e genital masculino, ginecológico/placenta, mama, endócrino, pele, sistema nervoso, hematolinfoide e ossos/partes moles.
2. **Por mecanismo geral**: lesão celular, inflamação, distúrbios hemodinâmicos, imunopatologia, infecção, reparo/fibrose, alterações genéticas e neoplasia.
3. **Por doença**: índice alfabético e busca tolerante a sinônimos.
4. **Por lâmina**: atlas filtrável por modalidade, coloração, fonte e disponibilidade de visualizador.

### Página de doença

Usar uma rota canônica, por exemplo:

```text
/manual-clinico/histologia/histopatologia/doencas/adenocarcinoma-colorretal
```

Uma doença canônica pode agregar várias entradas do catálogo, técnicas, ampliações e coleções. A URL não deve ser derivada cegamente do título bruto da fonte.

## 5. Catálogo: ingestão e consolidação editorial

### 5.1 Fonte de verdade do inventário visual

Os arquivos de `public/patologia/catalogo` são a fonte de verdade para:

- quais páginas e mídias foram encontradas;
- URL da página original;
- URL remota de imagem, miniatura ou visualizador;
- modalidade e coloração catalogadas;
- crédito e fonte;
- falhas de coleta conhecidas;
- vínculo técnico entre patologia e fragmento.

Eles **não** são fonte de verdade para nomenclatura médica final, classificação nosológica, diagnóstico, graduação, estadiamento ou conteúdo fisiopatológico.

### 5.2 Entidade catalogada versus doença canônica

Criar duas entidades distintas:

```ts
type EntradaCatalogada = {
  id: string
  fonteId: 'unicamp' | 'histopathology-atlas'
  nomeCatalogado: string
  sistemaCatalogado: string
  fragmentosDeMidia: string[]
}

type DoencaCanonica = {
  id: string
  slug: string
  nome: string
  sinonimos: string[]
  sistemaId: string
  orgaos: string[]
  catalogoIds: string[]
  conteudo: ConteudoDeDoenca
  revisao: RevisaoBiomedica
}
```

Isso permite:

- unir grafias e sinônimos;
- separar doença de técnica ou marcador;
- preservar o nome exato encontrado na fonte;
- corrigir classificação sem perder proveniência;
- associar uma mesma doença a imagens dos dois atlas;
- impedir que uma página de caso seja apresentada como entidade nosológica universal.

### 5.3 Pipeline

O script `scripts/histopatologia/construir-dados.mjs` deverá:

1. validar o manifesto e os SHA-256 dos fragmentos;
2. descompactar os fragmentos com `node:zlib` apenas durante build/ingestão;
3. validar os registros com Zod;
4. aplicar o mapa editorial de consolidação;
5. rejeitar protocolos diferentes de HTTPS;
6. aceitar apenas domínios explicitamente cadastrados por fonte;
7. deduplicar mídias sem apagar referências de proveniência;
8. gerar fragmentos derivados por sistema e doença;
9. produzir índice de busca leve, sem as 202 mil URLs;
10. imprimir conciliação completa e sair com código 1 diante de qualquer divergência.

O pipeline deve ser determinístico. Executá-lo duas vezes com os mesmos insumos deve produzir os mesmos arquivos e a mesma ordem.

### 5.4 Não gerar milhares de páginas estáticas no build

Não incluir todas as doenças em `generateStaticParams`. O volume pode alongar ou inviabilizar o build. Preferir rota dinâmica server-side com cache/ISR e `revalidate`, carregando somente o fragmento da doença solicitada. Gerar estaticamente apenas páginas de entrada e, se medido como vantajoso, um conjunto pequeno de páginas prioritárias.

## 6. Modelo científico aprofundado

Cada doença canônica deve usar um contrato que torne impossível misturar mecanismo, morfologia e clínica em um parágrafo genérico.

```ts
type ConteudoDeDoenca = {
  definicao: string
  epidemiologia?: BlocoComFontes
  etiologias: Etiologia[]
  fatoresDeRisco: FatorDeRisco[]
  histologiaNormalDeReferencia: ReferenciaNormal[]
  mecanismoPatologicoGeral: MecanismoGeral[]
  fisiopatologiaEspecifica: EtapaCausal[]
  macroscopia?: AchadoMorfologico[]
  histopatologia: HistopatologiaPorAumento
  coloracoesEspeciais?: ExameComplementar[]
  imunoHistoquimica?: ExameComplementar[]
  biologiaMolecular?: ExameComplementar[]
  correlacaoClinica: CorrelacaoClinica[]
  diagnosticosDiferenciais: Diferencial[]
  complicacoes?: Complicacao[]
  prognostico?: BlocoComFontes
  resumoDeProva: string[]
  armadilhas: string[]
  perguntasDeAutoavaliacao: Pergunta[]
}
```

Campos científicos podem ser opcionais; conteúdo ausente deve aparecer como **em preparação**, nunca ser inventado. A publicação exige mínimos definidos na seção de revisão.

## 7. Como escrever fisiopatologia de forma realmente didática

### 7.1 Cadeia causal obrigatória

Para cada doença, explicar em etapas numeradas:

1. **Gatilho ou etiologia** — o que inicia o processo.
2. **Alvo molecular/celular** — receptor, gene, proteína, organela, célula ou compartimento afetado.
3. **Resposta celular** — adaptação, dano, morte, ativação, proliferação ou mudança fenotípica.
4. **Resposta tecidual** — inflamação, depósito, destruição, fibrose, remodelamento ou neoplasia.
5. **Morfologia resultante** — o achado macro e microscópico que registra o mecanismo.
6. **Disfunção do órgão** — por que aquela alteração reduz ou distorce a função.
7. **Manifestação clínica** — como a disfunção se torna sinal, sintoma ou alteração laboratorial.
8. **Complicação** — como a progressão produz desfechos adicionais.

Exibir a cadeia com setas e frases completas. Cada seta deve responder “por que o próximo evento acontece?”. Evitar listas de mediadores sem relação causal.

### 7.2 Mecanismo geral versus mecanismo específico

Separar explicitamente:

- **mecanismo patológico geral**: conceito reutilizável, como necrose coagulativa, inflamação granulomatosa, trombose, metaplasia, displasia, invasão ou fibrose;
- **mecanismo específico**: aplicação daquele mecanismo à doença concreta, com célula, órgão, sequência temporal e consequência funcional.

Exemplo de estrutura, sem servir como conteúdo final:

```text
Mecanismo geral: inflamação granulomatosa tenta conter um agente persistente.
Aplicação específica: agente persistente ativa macrófagos → resposta de células T →
macrófagos epitelioides e células gigantes → granuloma → dano e remodelamento do órgão.
```

### 7.3 Histologia normal como âncora

Antes da alteração, mostrar:

- arquitetura normal do órgão;
- células dominantes;
- compartimentos e limites;
- função relevante;
- aspecto esperado em H&E;
- link profundo para a página correspondente do Manual de Histologia normal.

Depois, apresentar uma tabela curta **normal × patológico** com diferenças observáveis, sem reduzir toda a explicação à tabela.

## 8. Como escrever histopatologia de forma aprofundada

### 8.1 Roteiro por aumento

Toda descrição microscópica deve orientar o olhar na ordem real do microscópio:

1. **Panorâmica/scanner** — distribuição, focalidade, simetria, relação com cápsula, mucosa, parede ou parênquima.
2. **Pequeno aumento** — padrão arquitetural, compartimento comprometido, interface com tecido normal, necrose, fibrose e invasão.
3. **Médio aumento** — organização em glândulas, ninhos, fascículos, papilas, granulomas, folículos, septos ou espaços vasculares.
4. **Grande aumento** — citologia, núcleo, nucléolo, cromatina, citoplasma, mitoses, inclusões, pigmentos e agentes.
5. **Síntese diagnóstica** — quais achados sustentam a hipótese e quais ainda precisam de correlação.

Não chamar algo de “característico” ou “patognomônico” sem base robusta. Distinguir achado frequente, sugestivo, necessário e suficiente.

### 8.2 Morfologia deve explicar mecanismo

Para cada achado relevante, relacionar:

```text
achado observado → processo biológico que o produz → consequência diagnóstica/funcional
```

Exemplo de forma:

```text
perda da arquitetura normal → crescimento clonal desorganizado e invasivo →
redução da função especializada e evidência de malignidade quando a invasão é demonstrada.
```

### 8.3 Colorações, imuno-histoquímica e molecular

Não criar uma “lista de marcadores”. Para cada exame complementar, explicar:

- pergunta diagnóstica que ele responde;
- padrão esperado: nuclear, citoplasmático, membranar, granular, difuso ou focal;
- controles necessários;
- principais limitações e falsos positivos/negativos;
- como o resultado muda o diferencial;
- quando classificação molecular ou método adicional é necessário.

O resultado de IHQ não deve ser tratado como diagnóstico isolado.

### 8.4 Diagnóstico diferencial comparativo

Cada diferencial deve conter:

- motivo da confusão;
- achados compartilhados;
- achado discriminador mais útil;
- exame complementar, se necessário;
- armadilha pré-analítica ou de amostragem.

Quando houver duas páginas publicadas, oferecer um comparador lado a lado.

## 9. Estratégia pedagógica

Cada página deve seguir o ciclo:

1. **Orientar** — o que o estudante deve encontrar.
2. **Observar** — abrir a lâmina e percorrer aumentos.
3. **Explicar** — ligar morfologia ao mecanismo.
4. **Comparar** — normal, doença e diferenciais.
5. **Recuperar da memória** — perguntas sem resposta visível de imediato.
6. **Aplicar** — caso curto ou decisão diagnóstica.

### Recursos obrigatórios

- objetivos de aprendizagem no início;
- “Antes de olhar a lâmina” com histologia normal essencial;
- roteiro microscópico por aumento;
- cartões “o que estou vendo?”;
- cadeia fisiopatológica visual;
- quadro normal × patológico;
- armadilhas comuns;
- resumo de alta retenção;
- autoavaliação com justificativa;
- glossário contextual para termos difíceis;
- aviso de revisão médica e data de atualização.

### Níveis de leitura

Organizar o texto em três profundidades, sem duplicação:

- **Essencial**: definição, mecanismo central e três achados-chave;
- **Aprofundar**: sequência molecular/celular e diferenciais;
- **Revisão avançada**: classificações, biomarcadores, limitações e controvérsias.

O conteúdo essencial deve fazer sentido sozinho. O avançado não pode esconder o mecanismo básico.

## 10. Uso das imagens catalogadas

### 10.1 Regra técnica

Quando a política de direitos permitir incorporação:

- usar a URL remota no atributo `src` de um `<img>` nativo;
- usar `loading="lazy"` e `decoding="async"`;
- não passar pelo otimizador `/_next/image`;
- não buscar a imagem no servidor;
- não criar proxy de mídia;
- não gerar miniatura local;
- não pré-carregar galerias;
- não testar todas as URLs durante a requisição;
- abortar carregamentos que saíram do viewport quando a implementação suportar;
- mostrar fallback útil diante de erro.

O navegador deve requisitar a imagem diretamente à fonte somente quando ela estiver próxima do viewport e o portão de direitos permitir.

### 10.2 Política de direitos na renderização

```ts
type EstadoDeDireitos =
  | 'pendente'
  | 'autorizado-link-remoto'
  | 'autorizado-incorporacao'
  | 'bloqueado'
```

- `pendente`: mostrar descrição, crédito e botão para a página-fonte.
- `autorizado-link-remoto`: mostrar links para imagem/visualizador, sem incorporação.
- `autorizado-incorporacao`: permitir `<img src="URL_REMOTA">` com crédito adjacente.
- `bloqueado`: não mostrar URL direta da mídia; manter apenas referência bibliográfica permitida.

### 10.3 Cartão de lâmina

Cada cartão deve exibir:

- modalidade e coloração;
- descrição catalogada, sinalizada como não revisada quando necessário;
- botão **Abrir imagem na fonte**;
- botão **Abrir lâmina virtual**, quando houver;
- crédito curto e link para a página original;
- estado de disponibilidade e direitos;
- fallback sem deslocamento de layout.

Não inventar setas, círculos ou coordenadas sobre a lâmina. Só criar anotações quando houver coordenadas editoriais verificadas.

### 10.4 Seleção de imagens por página

Não renderizar centenas de imagens de uma mesma doença de uma vez. A página deve:

- escolher um conjunto editorial principal;
- agrupar o restante por modalidade, coloração e fonte;
- paginar ou virtualizar galerias extensas;
- priorizar H&E e arquitetura antes de IHQ;
- indicar claramente quando a imagem é macroscópica, histológica, IHQ ou WSI;
- permitir abrir o inventário completo sob demanda.

## 11. Busca e filtros

Indexar apenas campos leves:

- nome canônico;
- sinônimos;
- nome catalogado;
- sistema e órgão;
- mecanismo geral;
- padrão morfológico;
- modalidade e coloração disponíveis.

Não incluir as 202.593 URLs no índice entregue ao cliente.

Filtros mínimos:

- sistema/órgão;
- neoplásica × não neoplásica;
- mecanismo geral;
- modalidade;
- coloração;
- fonte;
- com lâmina virtual;
- conteúdo revisado;
- incorporação autorizada.

A busca deve tolerar acentos, hífens, plurais simples e sinônimos em português/inglês quando cadastrados. Não traduzir títulos automaticamente durante a busca.

## 12. Integração normal × patológico

Criar ligações bidirecionais:

- página de histologia normal lista doenças relacionadas por órgão/estrutura;
- página de doença aponta para as lâminas normais relevantes;
- comparador abre normal e patológico lado a lado;
- o texto explicita exatamente o que foi perdido, aumentado, substituído ou reorganizado.

Não modificar em massa os dados de Histologia normal. Criar um mapa editorial independente, testado contra as rotas reais do currículo existente.

## 13. Revisão biomédica e publicação

### Estados

```ts
type EstadoDeRevisao = 'rascunho' | 'revisao-medica' | 'publicado' | 'desatualizado'
```

### Mínimo para publicar uma doença

- nomenclatura canônica e sinônimos revisados;
- histologia normal de referência;
- mecanismo geral e específico;
- roteiro histopatológico por aumento;
- correlação morfofuncional;
- pelo menos um diferencial quando aplicável;
- referências bibliográficas registradas;
- revisor, data e versão;
- revisão do vínculo entre texto e imagens;
- política de direitos definida para cada mídia exibida.

Doenças sem conteúdo mínimo podem aparecer no catálogo como **inventário de lâminas**, mas não com aparência de capítulo científico completo.

### Atualização de classificações

Todo conteúdo dependente de classificação, graduação, estadiamento ou biomarcador deve registrar:

- organização/consenso de referência;
- edição ou versão;
- ano;
- data da última revisão;
- estado `desatualizado` quando a referência for substituída.

## 14. Segurança e robustez

- aceitar apenas `https:`;
- manter allowlist de domínios por fonte;
- não renderizar HTML recebido do catálogo;
- escapar descrições como texto;
- não usar `dangerouslySetInnerHTML` para conteúdo catalogado;
- validar redirecionamentos no pipeline de manutenção, não em cada acesso;
- limitar quantidade de mídias renderizadas por página;
- não expor caminhos locais, hashes internos desnecessários ou segredos;
- registrar falhas de mídia sem enviar dados pessoais;
- não permitir URL arbitrária fornecida pelo usuário.

## 15. Desempenho

Metas iniciais:

- página de doença não baixa nenhum fragmento sem relação com ela;
- primeira renderização não requisita imagem fora do viewport;
- catálogo completo nunca entra no bundle cliente;
- navegação básica funciona mesmo quando a fonte de mídia está indisponível;
- o servidor do Domine Aqui não processa bytes de imagem;
- lista de doenças usa índice derivado leve;
- galerias longas usam paginação ou virtualização;
- build valida dados, mas não faz 202 mil requisições remotas.

Adicionar métricas de tamanho dos derivados ao relatório do pipeline e falhar se houver regressão desproporcional.

## 16. Acessibilidade

- hierarquia correta de títulos;
- navegação completa por teclado;
- foco visível;
- botões de fonte com nome acessível específico;
- texto alternativo editorial, não apenas o nome do arquivo;
- nunca usar cor como único indicador;
- tabelas comparativas com cabeçalhos corretos;
- cadeia causal também disponível como lista textual;
- zoom não bloqueado;
- respeito a `prefers-reduced-motion`;
- contraste compatível com WCAG AA;
- mensagens de erro anunciadas por tecnologia assistiva.

Texto alternativo não deve afirmar um diagnóstico além do que a revisão da mídia sustenta.

## 17. SEO e dados estruturados

- páginas em revisão devem usar `noindex`;
- páginas publicadas podem usar `MedicalWebPage`/`LearningResource` com cautela;
- incluir `dateModified` e estado editorial;
- não declarar autoria das imagens como Domine Aqui;
- canonical por doença, não por título duplicado do catálogo;
- sitemap apenas para conteúdo publicado;
- não expor 2.917 páginas vazias ao buscador.

## 18. Testes obrigatórios

### Dados

- manifesto, hashes e contagens fecham;
- toda mídia aponta para patologia e fonte existentes;
- toda doença canônica aponta para entradas catalogadas reais;
- toda rota normal relacionada existe;
- nenhuma URL usa protocolo não permitido;
- nenhum domínio está fora da allowlist;
- nenhuma entrada publicada carece dos campos científicos mínimos;
- nenhuma mídia incorporada está com direitos pendentes.

### Interface

- busca e filtros;
- página sem imagem disponível;
- página com uma e com muitas mídias;
- falha de carregamento remoto;
- crédito e links visíveis;
- navegação normal × patológico;
- conteúdo pendente versus publicado;
- mobile, tablet e desktop;
- teclado e leitor de tela.

### Performance

- garantir que a home não solicita fragmentos de mídia;
- garantir que uma doença carrega somente seus fragmentos;
- garantir que imagens abaixo da dobra sejam lazy;
- garantir que nenhuma URL remota passe pelo proxy de imagem do Next;
- verificar tamanho do índice cliente.

## 19. Fases de execução

### Fase 0 — auditoria e contratos

- ler integralmente este plano, o prompt e a documentação do catálogo;
- executar o validador fornecido;
- mapear os padrões existentes de Histologia;
- definir schemas Zod e portões independentes de licença/revisão;
- documentar decisões em ADR quando alterarem arquitetura ou publicação.

### Fase 1 — pipeline e inventário completo

- criar ingestão dos 18 fragmentos;
- gerar índice de doenças/entradas e busca leve;
- disponibilizar todas as 2.917 entradas no atlas como inventário;
- implementar filtros e páginas de inventário;
- não publicar texto médico automático.

### Fase 2 — experiência didática estrutural

- home de Histopatologia;
- navegação por sistema e mecanismo;
- layout de página de doença;
- normal × patológico;
- cadeia causal e roteiro por aumento;
- estados de conteúdo ausente, revisão e direitos.

### Fase 3 — conteúdo piloto revisável

Selecionar um conjunto pequeno, representativo e não enviesado de doenças para provar o modelo: inflamatória/infecciosa, vascular, degenerativa, benigna e maligna, em sistemas diferentes. Escrever conteúdo aprofundado com referências e deixá-lo em `revisao-medica` até aprovação.

O piloto valida o formato; não autoriza gerar em massa textos superficiais.

### Fase 4 — imagens remotas e direitos

- manter inicialmente o modo link para a fonte;
- registrar autorizações/licenças por coleção;
- habilitar incorporação somente para escopos liberados;
- validar crédito, fallback e ausência de proxy/download.

### Fase 5 — expansão editorial

- consolidar sinônimos e duplicatas por sistema;
- publicar doenças por lotes revisados;
- adicionar comparadores e questões;
- acompanhar cobertura e desatualização.

## 20. Critérios de aceite

A implementação só está pronta quando:

1. `node public/patologia/scripts/validar-catalogo.mjs` passa;
2. todas as 202.593 referências permanecem vinculadas a uma das 2.917 entradas;
3. nenhuma imagem foi adicionada ao Git, Blob ou bundle;
4. o inventário pode ser pesquisado sem baixar o catálogo completo no cliente;
5. uma página carrega somente dados e mídias relacionados;
6. direitos pendentes impedem incorporação, mas preservam crédito e link de origem;
7. conteúdo pendente não é apresentado como revisão médica concluída;
8. a cadeia fisiopatológica separa mecanismo geral e específico;
9. a histopatologia é descrita do pequeno para o grande aumento;
10. normal × patológico está integrado às rotas reais de Histologia;
11. testes existentes continuam passando;
12. novos testes cobrem dados, interface, acessibilidade e desempenho;
13. `npm run build` passa sem depender da disponibilidade dos atlas externos;
14. documentação explica como adicionar, revisar, bloquear ou atualizar uma doença.

## 21. O que não fazer

- Não baixar imagens “só para testar”.
- Não criar proxy de imagens.
- Não usar o otimizador do Next para as novas fontes.
- Não tratar gratuidade como licença.
- Não atribuir o texto editorial do Domine Aqui aos atlas.
- Não criar diagnóstico ou descrição científica a partir apenas do nome do arquivo.
- Não transformar títulos brutos em doenças canônicas sem curadoria.
- Não publicar conteúdo gerado sem estado de revisão.
- Não carregar 202 mil registros no navegador.
- Não gerar milhares de páginas estáticas cegamente.
- Não quebrar nem reescrever a arquitetura atual de Histologia para acomodar o novo módulo.

## 22. Resultado esperado

O estudante deve conseguir abrir uma doença e entender, em ordem, como o tecido normal funciona, o que o agride, qual mecanismo patológico geral entra em ação, como esse mecanismo assume uma forma específica naquela doença, o que surge na lâmina e por que isso produz a disfunção clínica. A imagem deixa de ser ilustração decorativa e passa a ser evidência visual guiada, sempre ligada à fonte, ao crédito, ao estado de direitos e ao estado de revisão científica.
