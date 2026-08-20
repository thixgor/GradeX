# Formato de importação da Área de Ensino

Este documento descreve o arquivo que o painel de Ensino lê em
`/aulas/gerenciar/importar` para criar **níveis de organização**, **aulas**,
**Aulas Resumo** e **Trilhas de Ensino** de uma vez.

Dois formatos são aceitos — **Markdown** e **JSON** — e os dois produzem
exatamente a mesma estrutura. O sistema escolhe o analisador pelo conteúdo do
arquivo (começa com `{` ou `[` → JSON; caso contrário → Markdown), então a
extensão não importa.

## Princípios

**Nada é duplicado.** Uma aula citada por três Trilhas continua sendo uma aula
só. As Trilhas referenciam aulas pelo **título**.

**Reimportar atualiza, não duplica.** Níveis e Trilhas são reconhecidos pelo
*slug* (derivado do nome); aulas, pelo título normalizado. Corrigir uma linha e
rodar o arquivo de novo atualiza os registros existentes.

**Nada é apagado.** A importação cria e atualiza. Ela nunca remove aulas,
Trilhas ou níveis — mesmo os que sumiram do arquivo.

**Sempre há ensaio.** O painel roda primeiro sem gravar e mostra o relatório
completo (quantas aulas seriam criadas, quantas atualizadas, quais títulos não
foram encontrados). O botão de aplicar só aparece depois.

**Linha torta não derruba o arquivo.** Um campo desconhecido vira aviso, e o
resto do arquivo é importado normalmente.

---

## Estrutura em Markdown

O arquivo tem três seções, todas opcionais e em qualquer ordem:

```md
## Taxonomia    → os níveis de organização
## Aulas        → as unidades de conhecimento
## Trilhas      → os caminhos que reutilizam essas aulas
```

A gramática é pequena de propósito:

| Forma | Significado |
|---|---|
| `## Seção` | abre Taxonomia, Aulas ou Trilhas |
| `### Aula: Título` / `### Trilha: Título` | abre um registro |
| `#### Etapa: Nome` | abre uma etapa dentro da Trilha aberta |
| `- campo: valor` | preenche um campo do registro aberto |
| `- Texto` (dentro de etapa) | adiciona a aula com esse título à etapa |

---

## Seção `## Taxonomia`

Os quatro níveis, com o recuo marcando a hierarquia:

```md
## Taxonomia

- Área: Medicina
  - Módulo: Ciclo Básico
    - Tópico: Sistema Cardiovascular
      - Subtópico: Fisiologia
      - Subtópico: Eletrofisiologia
  - Módulo: Ciclo Clínico
    - Tópico: Cardiologia
      - Subtópico: Insuficiência Cardíaca
    - Tópico: Nefrologia
```

Os rótulos aceitos são `Área`, `Módulo`, `Tópico` e `Subtópico` (com ou sem
acento, maiúsculas ou minúsculas). O **Subtópico é opcional** — nem todo
conteúdo precisa de mais um nível.

Esta seção é opcional: os níveis citados em `localizacao` das aulas são criados
automaticamente quando faltarem. Ela existe para quando você quer declarar a
estrutura inteira de uma vez, inclusive níveis que ainda não têm aula.

---

## Seção `## Aulas`

Cada aula é uma **unidade específica de conhecimento** — "Lei de Frank-Starling",
não "Sistema Cardiovascular".

```md
## Aulas

### Aula: Lei de Frank-Starling
- localizacao: Medicina > Ciclo Básico > Sistema Cardiovascular > Fisiologia
- duracao: 12min
- profundidade: essencial
- professor: Dra. Helena Prado
- tags: hemodinâmica, contratilidade, pré-carga
- video: https://cdn.exemplo.com/frank-starling.mp4
- descricao: A relação entre estiramento da fibra e força de contração.
- prerequisitos: Débito cardíaco; Pré-carga e pós-carga
- relacionadas: Fisiopatologia da Insuficiência Cardíaca
- resumo: Frank-Starling em 3 minutos | 3min | https://cdn.exemplo.com/fs-resumo.mp4
- pdf: Resumo em PDF | https://cdn.exemplo.com/fs.pdf
- flashcards: 65f0a1b2c3d4e5f6a7b8c9d0
- acesso: plus
```

### Campos da aula

| Campo | Obrigatório | Descrição |
|---|---|---|
| *(título após `### Aula:`)* | sim | O nome da aula. É por ele que as Trilhas a referenciam. |
| `localizacao` | não | Caminho na taxonomia, separado por `>`. Aceita 1 a 4 níveis. Sem ele a aula fica avulsa (§4) — o que é legítimo. |
| `duracao` | não | `12min`, `1h20`, `18:42`, `1:05:03`, `45s` ou só um número (interpretado como minutos). |
| `profundidade` | não | `essencial`, `intermediario` ou `avancado`. |
| `professor` | não | Nome do professor. |
| `tags` | não | Separadas por vírgula ou ponto e vírgula. Servem à busca. |
| `video` | não | URL do vídeo, ou o HTML de incorporação. |
| `descricao` | não | Texto curto exibido na aula. |
| `prerequisitos` | não | Títulos de outras aulas, separados por `;`. **Recomendação, nunca bloqueio.** |
| `relacionadas` | não | Títulos de outras aulas, separados por `;`. |
| `pdf` | não | `Nome do arquivo \| https://…` — ou só a URL. Pode repetir a linha. |
| `flashcards` | não | Id de um deck de flashcards. Pode repetir a linha. |
| `resumo` | não | A **Aula Resumo** vinculada. Ver abaixo. |
| `acesso` | não | `publico`, `gratuita`, `plus` ou `amostra`. Padrão: `plus`. |

### O campo `resumo` (Aula Resumo)

```
- resumo: Título do resumo | 4min | https://cdn.exemplo.com/resumo.mp4
```

Os três pedaços são separados por `|`, e só o primeiro é obrigatório. O resumo
é criado como uma **aula** com `tipo: resumo`, vinculada nos dois sentidos à
principal: ele ganha player, progresso, acesso e anotações próprios, some da
navegação normal e aparece na aba **Resumo** da aula principal.

Se já existir uma aula com aquele título, ela é reaproveitada como resumo em vez
de uma nova ser criada.

### Valores de `acesso`

| Valor | Quem assiste |
|---|---|
| `publico` | qualquer pessoa, sem login |
| `gratuita` | qualquer pessoa logada |
| `plus` | assinantes Plus+ |
| `amostra` | assinantes Plus+, **e também** quem não é — a aula demonstrativa |

Regras mais específicas (por material comprado, por pacote, por turma, com data
de liberação) continuam sendo definidas no editor da aula: elas dependem de ids
de produtos e turmas que não cabem num arquivo de plano de ensino.

---

## Seção `## Trilhas`

```md
## Trilhas

### Trilha: Entenda Insuficiência Cardíaca do Zero
- subtitulo: Do débito cardíaco ao tratamento da ICFEr
- descricao: Um caminho que começa na fisiologia e termina na descompensação.
- objetivo: Ao final, você entende, diagnostica e trata insuficiência cardíaca.
- nivel: iniciante
- publico: Ciclo Clínico
- duracao: 6h
- tags: cardiologia, IC
- certificado: sim
- aprendizados:
  - Explicar a fisiopatologia da IC
  - Classificar pela fração de ejeção
  - Reconhecer a descompensação

#### Etapa: Antes da doença
- Débito cardíaco
- Pré-carga e pós-carga
- Lei de Frank-Starling
- Sistema renina-angiotensina-aldosterona

#### Etapa: Entenda a doença
- Conceito de insuficiência cardíaca
- Fisiopatologia da Insuficiência Cardíaca
- Classificação pela fração de ejeção

#### Etapa: Diagnóstico
- Clínica da insuficiência cardíaca
- BNP e NT-proBNP
- Ecocardiograma na IC

#### Etapa: Tratamento
- Tratamento da ICFEr
- Tratamento da ICFEp
- Descompensação aguda
```

### Campos da Trilha

| Campo | Descrição |
|---|---|
| *(título após `### Trilha:`)* | O nome da Trilha. |
| `subtitulo` | Frase curta sob o título, nos cartões. |
| `descricao` | Texto de apresentação. |
| `objetivo` | O que o aluno alcança ao concluir. |
| `nivel` | `iniciante`, `intermediario` ou `avancado`. |
| `publico` | Texto livre: "Ciclo Clínico", "Internato", "Residência". |
| `duracao` | Estimativa. Vazio = soma da duração das aulas. |
| `tags` | Separadas por vírgula. |
| `certificado` | `sim` para a Trilha emitir certificado. Nunca é obrigatório. |
| `aprendizados` | Lista — uma competência por item recuado. |

### Como as etapas referenciam aulas

Cada linha dentro de `#### Etapa:` é o **título de uma aula**. Ela pode:

- estar neste mesmo arquivo (será criada antes de a Trilha ser montada); ou
- já existir na plataforma (será reutilizada — este é o caso desejado).

Títulos que não casam com nenhuma aula aparecem no relatório em **"Aulas citadas
que não existem"**, e a Trilha é montada sem elas. Isso quase sempre significa
um título escrito de forma diferente do cadastrado.

**Trilhas importadas nascem em rascunho.** Publicar um caminho é uma decisão
editorial — a ordem faz sentido? falta uma etapa? — e o arquivo não tem como
responder isso. Aulas importadas, ao contrário, nascem publicadas: elas são o
trabalho já pronto.

---

## Estrutura em JSON

Mesma semântica, para quando o arquivo é gerado por outra ferramenta:

```json
{
  "nos": [
    { "nivel": "area", "nome": "Medicina" },
    { "nivel": "modulo", "nome": "Ciclo Clínico", "caminho": ["Medicina"] },
    { "nivel": "topico", "nome": "Cardiologia", "caminho": ["Medicina", "Ciclo Clínico"] }
  ],
  "aulas": [
    {
      "titulo": "Fisiopatologia da Insuficiência Cardíaca",
      "localizacao": "Medicina > Ciclo Clínico > Cardiologia",
      "duracao": "18min",
      "profundidade": "intermediario",
      "tags": ["remodelamento", "SRAA"],
      "video": "https://cdn.exemplo.com/fisiopatologia-ic.mp4",
      "prerequisitos": ["Lei de Frank-Starling"],
      "pdfs": [{ "nome": "Resumo em PDF", "url": "https://cdn.exemplo.com/ic.pdf" }],
      "resumo": { "titulo": "IC em 4 minutos", "duracao": "4min" },
      "acesso": "plus"
    }
  ],
  "trilhas": [
    {
      "titulo": "Entenda Insuficiência Cardíaca do Zero",
      "nivel": "iniciante",
      "certificado": true,
      "aprendizados": ["Explicar a fisiopatologia da IC"],
      "etapas": [
        { "titulo": "Antes da doença", "aulas": ["Débito cardíaco", "Lei de Frank-Starling"] },
        { "titulo": "Entenda a doença", "aulas": ["Fisiopatologia da Insuficiência Cardíaca"] }
      ]
    }
  ]
}
```

`caminho` aceita array (`["Medicina", "Ciclo Clínico"]`) ou string
(`"Medicina > Ciclo Clínico"`). `localizacao` e `caminho` são sinônimos nas
aulas.

---

## Migração do acervo antigo

A mesma tela traz um botão separado para migrar o conteúdo já cadastrado na
hierarquia anterior (setor → tópico → subtópico → módulo → submódulo). Ela não é
uma importação: lê as coleções antigas e propõe a tradução para os quatro níveis
novos, com esta correspondência:

| Antigo | Novo |
|---|---|
| Setor | Área |
| Tópico | Módulo |
| Subtópico | Tópico |
| Módulo | Tópico se ainda livre, senão Subtópico |
| Submódulo | Subtópico |

**Nada é apagado e nada é movido.** As coleções antigas continuam intactas, as
páginas antigas continuam funcionando, e cada aula passa a ter as **duas**
localizações. A operação é segura de repetir: aulas já organizadas não são
tocadas.

---

## Boas práticas

**Aulas pequenas.** "Lei de Frank-Starling" e "Pré-carga e pós-carga", não
"Sistema Cardiovascular". Aula grande não é reutilizável, e é o reuso que
sustenta o sistema.

**Um arquivo por assunto.** Um `.md` para Cardiologia, outro para Nefrologia.
Arquivos menores são mais fáceis de revisar, e a importação é incremental.

**Versione os arquivos.** Eles são o plano de ensino em texto: cabem no Git,
aceitam revisão por pull request e servem de documentação do currículo.

**Escreva a Trilha depois das aulas.** No mesmo arquivo ou num arquivo seguinte
— as duas formas funcionam, porque a resolução por título acontece depois de
todas as aulas existirem.
