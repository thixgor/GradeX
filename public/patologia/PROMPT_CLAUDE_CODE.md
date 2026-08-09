# Prompt para o Claude Code — implementar Histopatologia no GradeX

Você está trabalhando no repositório **GradeX**, uma aplicação Next.js 14. Implemente uma nova área de **Histopatologia (Anatomia Patológica)** dentro do Manual de Histologia atual.

O conteúdo deve ser em **português brasileiro**, aprofundado, cientificamente organizado, muito didático e centrado na relação entre mecanismo e morfologia. Não faça uma página genérica nem uma galeria desconectada: implemente a base arquitetural capaz de atender todo o catálogo já preparado.

## 1. Leia antes de alterar código

Leia integralmente, nesta ordem:

1. `public/patologia/README.md`
2. `public/patologia/PLANO_IMPLEMENTACAO.md`
3. `public/patologia/CREDITOS_E_DIREITOS.md`
4. `public/patologia/catalogo/README.md`
5. `public/patologia/catalogo/manifesto.json`
6. `lib/histologia/esquemas.ts`
7. `lib/histologia/repositorio.ts`
8. `lib/histologia/licenca.ts`
9. `lib/histologia/midia.ts`
10. `scripts/histologia/construir-dados.mjs`
11. as rotas, componentes e testes existentes de Histologia.

Execute antes de começar:

```bash
node public/patologia/scripts/validar-catalogo.mjs
```

Não prossiga se o catálogo não fechar exatamente.

## 2. Resultado obrigatório

Crie a experiência em:

```text
/manual-clinico/histologia/histopatologia
```

Use `public/patologia` como acervo-fonte e gere derivados em `data/histopatologia`. Mantenha a área de Histologia normal funcionando e conecte as duas por links bidirecionais.

A implementação deve oferecer:

- home de Histopatologia;
- atlas completo pesquisável;
- navegação por sistema, órgão e mecanismo geral;
- rota canônica de doença;
- comparação normal × patológico;
- galeria de referências remotas filtrável;
- crédito e página-fonte por mídia;
- estados explícitos de revisão médica e de direitos;
- pipeline determinístico e testado.

## 3. Restrições inegociáveis

### Imagens

- Não baixe imagem alguma, nem manualmente nem por script.
- Não copie imagens para `public`, `data`, Blob, CDN ou cache próprio.
- Não crie proxy, thumbnail, conversão ou otimização.
- Não use `next/image` nem `/_next/image` para estas fontes.
- Não faça requisições remotas durante build, teste ou renderização do servidor.
- Quando a incorporação estiver autorizada, use `<img src="URL_REMOTA">` diretamente no navegador, com lazy loading.
- Enquanto os direitos estiverem pendentes, mostre apenas descrição, crédito, página-fonte e botão para abrir na origem.
- O site deve continuar funcional quando os atlas estiverem fora do ar.

### Direitos e créditos

- Não suponha que conteúdo gratuito ou código público autorize reprodução.
- Não reutilize a licença do Digital Histology para Unicamp ou Histopathology Atlas.
- Implemente portão independente por fonte/coleção.
- Crédito geral não substitui crédito junto de cada mídia.
- Preserve o nome catalogado e a URL da página original.

### Conteúdo médico

- Não invente dados ausentes.
- Não derive diagnóstico a partir do nome do arquivo.
- Não publique texto gerado como se tivesse revisão médica.
- Não trate todas as 2.917 entradas catalogadas como doenças canônicas.
- Preserve a diferença entre título bruto, caso, técnica, marcador, variante e doença.
- Campos ausentes devem permanecer ausentes ou “em preparação”.

### Desempenho

- Não envie o catálogo completo ao cliente.
- Não importe todos os fragmentos em um único módulo.
- Não gere todas as rotas estaticamente sem medir custo.
- Não renderize centenas de imagens numa única página.
- Não faça verificação online de 202 mil URLs em runtime.

## 4. Implementação técnica

### 4.1 Contratos de dados

Crie schemas Zod separados para:

- fonte e estado de direitos;
- entrada catalogada;
- referência de mídia;
- doença canônica;
- mecanismo patológico geral;
- conteúdo de fisiopatologia;
- histopatologia por aumento;
- exame complementar;
- diagnóstico diferencial;
- revisão biomédica;
- vínculo com histologia normal.

Campos científicos devem ser opcionais no schema bruto, mas a validação de publicação deve exigir o conjunto mínimo descrito no plano.

### 4.2 Pipeline

Crie `scripts/histopatologia/construir-dados.mjs` que:

1. leia e valide o manifesto;
2. verifique SHA-256;
3. descompacte com `node:zlib`;
4. valide cada mídia;
5. aplique um mapa editorial versionado de consolidação;
6. gere fragmentos por doença/sistema;
7. gere índice de busca leve;
8. produza relatório de conciliação;
9. seja idempotente;
10. falhe de forma explícita diante de divergência.

Não altere os arquivos-fonte do catálogo durante a ingestão.

### 4.3 Camada editorial

Implemente um arquivo ou conjunto de arquivos versionados que mapeie `catalogoIds` para uma `DoencaCanonica`. Deve ser possível:

- juntar sinônimos;
- mover entrada para o sistema correto;
- marcar item como técnica/caso e não doença;
- manter mais de uma fonte na mesma doença;
- definir mídia principal e ordem didática;
- bloquear uma mídia específica;
- registrar referências e revisão.

Não tente concluir toda a curadoria automaticamente. Forneça estrutura, validação e exemplos claros.

### 4.4 Repositório server-only

Siga o padrão de `lib/histologia/repositorio.ts`:

- dados científicos e URLs ficam no servidor;
- imports de fragmentos precisam ser enumeráveis pelo bundler;
- carregue somente o fragmento necessário;
- exponha DTOs mínimos para componentes cliente;
- gere mapa literal de carregadores quando necessário.

### 4.5 Busca

A busca deve usar nomes canônicos, sinônimos, títulos catalogados, sistemas, órgãos, mecanismos e padrões morfológicos. O índice cliente não pode conter as URLs das mídias.

### 4.6 Mídia remota

Implemente um componente específico, por exemplo `ImagemHistopatologicaRemota`, com:

- validação de fonte e estado de direitos;
- `loading="lazy"`;
- `decoding="async"`;
- `referrerPolicy="strict-origin-when-cross-origin"` quando compatível;
- proporção/altura reservada para evitar layout shift;
- fallback com descrição e link;
- crédito no mesmo cartão;
- erro recuperável;
- sem `next/image`;
- sem fetch do servidor.

Se o estado não for `autorizado-incorporacao`, o componente não deve montar um elemento `img` com a URL remota.

## 5. Página de doença: estrutura obrigatória

Cada página publicada deve apresentar, nesta ordem:

1. nome, sinônimos, sistema, órgão, estado de revisão e atualização;
2. objetivos de aprendizagem;
3. definição curta;
4. histologia normal de referência, com link para o manual atual;
5. etiologia e fatores de risco;
6. mecanismo patológico geral;
7. fisiopatologia específica em cadeia causal;
8. macroscopia, quando aplicável;
9. histopatologia em panorâmica, pequeno, médio e grande aumento;
10. galeria de lâminas escolhida editorialmente;
11. colorações especiais, IHQ e molecular com pergunta e limitações;
12. correlação morfofuncional e clínica;
13. diagnósticos diferenciais comparativos;
14. complicações e prognóstico, quando aplicáveis;
15. armadilhas;
16. resumo de alta retenção;
17. perguntas de autoavaliação com devolutiva;
18. referências, créditos e proveniência.

### Regra de escrita fisiopatológica

Toda cadeia deve seguir:

```text
etiologia/gatilho
→ alvo molecular ou celular
→ resposta celular
→ alteração tecidual
→ achado morfológico
→ perda/alteração de função
→ manifestação clínica
→ complicação
```

Cada seta precisa ter explicação causal. Separe claramente o mecanismo geral da aplicação específica à doença.

### Regra de escrita histopatológica

Descreva o que procurar na lâmina na ordem do microscópio:

```text
panorâmica → arquitetura → compartimento → padrão celular → citologia → síntese
```

Para cada achado importante, explique o processo que o produz e sua consequência. Não use apenas listas de adjetivos morfológicos.

## 6. Interface e didática

Reutilize o sistema visual e os componentes do Manual de Histologia quando isso preservar consistência. Crie componentes novos quando o conceito for próprio da patologia.

Inclua:

- mapas por sistema e mecanismo;
- breadcrumb consistente;
- comparação normal × patológico;
- seletor de profundidade: Essencial, Aprofundar, Revisão avançada;
- roteiro “procure primeiro / depois / confirme”;
- cadeia causal disponível visualmente e como texto;
- filtros de modalidade, coloração, fonte e WSI;
- paginação/virtualização de galerias extensas;
- estados vazios honestos;
- navegação completa por teclado;
- bom funcionamento em mobile.

Não use animações decorativas que atrapalhem leitura ou ampliem custo.

## 7. Revisão e publicação

Implemente dois portões independentes:

1. **revisão biomédica do conteúdo**;
2. **direitos de exibição da mídia**.

Uma doença pode ter texto publicado e mídias apenas linkadas. Uma mídia pode estar autorizada, mas não deve validar um texto ainda não revisado.

Páginas não publicadas devem usar `noindex`. Registre revisor, data, versão e referências de classificação.

## 8. Testes

Adicione testes em `__tests__/histopatologia` cobrindo:

- integridade do catálogo;
- ingestão e conciliação;
- schemas;
- consolidação editorial;
- rotas e links para Histologia normal;
- busca e filtros;
- direitos pendentes sem elemento `img`;
- incorporação autorizada sem proxy do Next;
- crédito por item;
- fallback de mídia;
- estados de revisão;
- acessibilidade básica;
- ausência do catálogo completo no bundle cliente;
- página que carrega somente seus fragmentos.

Mantenha os testes existentes de Histologia passando.

## 9. Sequência de trabalho

1. Audite a arquitetura existente e registre riscos.
2. Implemente schemas e validação.
3. Implemente pipeline e derivados.
4. Implemente repositório server-only e busca.
5. Implemente rotas e layout.
6. Implemente estados de revisão/direitos antes da galeria.
7. Implemente integração normal × patológico.
8. Adicione um pequeno conjunto piloto de conteúdo aprofundado em estado `revisao-medica`.
9. Adicione testes.
10. Rode validação, testes, lint específico e build.

Não faça grandes alterações não relacionadas ao módulo.

## 10. Comandos finais

No mínimo, execute e corrija os problemas relevantes:

```bash
node public/patologia/scripts/validar-catalogo.mjs
npm test
npm run lint:histologia
npm run build
```

Se criar scripts adicionais, documente-os no `package.json` e no README do módulo.

## 11. Relatório de conclusão

Ao terminar, informe:

- arquivos criados e alterados;
- arquitetura adotada;
- totais conciliados do catálogo;
- como a doença aponta para seus fragmentos e mídias;
- quais conteúdos piloto foram adicionados e seu estado de revisão;
- quais fontes/coleções continuam bloqueadas para incorporação;
- testes e build executados;
- pendências que exigem revisor médico ou autorização jurídica;
- confirmação explícita de que nenhuma imagem foi baixada ou armazenada.
