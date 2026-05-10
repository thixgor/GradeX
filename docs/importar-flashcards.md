# Importar Flashcards — Guia completo

> Use esta referência para importar vários cartões de uma só vez no editor de decks (`/flashcards/d/<slug>/editar`).
> Três formatos são aceitos: **Markdown** (recomendado para LLMs), **JSON** e **CSV**.

---

## Formato Markdown (recomendado)

O formato Markdown é o mais fácil de gerar com ferramentas de IA (ChatGPT, Claude, Gemini, etc.).

### Estrutura

Cada cartão usa cabeçalhos `##` para demarcar as seções. Os cartões são separados por `---`.

```markdown
## Frente
<texto da frente do cartão>

## Verso
<texto do verso do cartão>

## Comentário
<explicação extra — opcional>

---

## Frente
<próximo cartão>

## Verso
<resposta>
```

### Regras

| Seção | Obrigatória | Alias aceito |
|---|---|---|
| `## Frente` | ✅ Sim | `## Front` |
| `## Verso` | ✅ Sim | `## Back` |
| `## Comentário` | ❌ Não | `## Comentario`, `## Comment` |

- Os cabeçalhos aceitam `#`, `##` ou `###` (qualquer nível).
- O separador entre cartões é `---` (três ou mais hífens em linha própria).
- A ordem das seções dentro de um cartão não importa.
- Texto em **negrito** (`**texto**`) e *itálico* (`*texto*`) são renderizados nos cartões.

### Exemplo completo

```markdown
## Frente
O que é a Lei de Ohm?

## Verso
V = R × I

onde V é a tensão (volts), R a resistência (ohms) e I a corrente (ampères).

## Comentário
Válida para condutores ôhmicos em temperatura constante.

---

## Frente
Qual o valor da constante de Avogadro?

## Verso
6,022 × 10²³ mol⁻¹

---

## Frente
Defina mitose.

## Verso
Divisão celular que origina duas células-filhas **geneticamente idênticas** à célula-mãe.

## Comentário
Difere da meiose, que produz células com metade do número cromossômico.
```

### Prompt sugerido para LLMs

Cole o texto abaixo em qualquer LLM para gerar flashcards no formato correto:

```
Crie flashcards de estudo sobre [ASSUNTO] no seguinte formato Markdown.
Gere [N] cartões. Separe cada cartão com ---.

Estrutura obrigatória por cartão:

## Frente
[pergunta ou conceito]

## Verso
[resposta completa e clara]

## Comentário
[contexto extra, fórmulas, dicas de memorização — opcional]

---
```

Substitua `[ASSUNTO]` pelo tema e `[N]` pela quantidade desejada.

---

## Formato JSON

Ideal para importações programáticas ou exportação de outras ferramentas.

### Estrutura

Um **array de objetos**, cada objeto representando um cartão:

```json
[
  {
    "front": { "text": "Pergunta ou conceito" },
    "back":  { "text": "Resposta" },
    "comment": "Explicação adicional (opcional)"
  }
]
```

### Campos disponíveis

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `front.text` | string | ✅ | Texto da frente |
| `front.image` | string (URL) | ❌ | Imagem da frente |
| `back.text` | string | ✅ | Texto do verso |
| `back.image` | string (URL) | ❌ | Imagem do verso |
| `comment` | string | ❌ | Comentário / resposta comentada |
| `kind` | `"standard"` \| `"hidden_word"` | ❌ | Tipo do cartão (padrão: `"standard"`) |
| `hiddenWord.phrase` | string | ✅ se hidden_word | Frase completa com a palavra |
| `hiddenWord.word` | string | ✅ se hidden_word | Palavra a ser ocultada |
| `hiddenWord.hint` | string | ❌ | Dica para a palavra oculta |

### Cartão padrão

```json
[
  {
    "front": { "text": "Qual é a fórmula da água?" },
    "back":  { "text": "H₂O" },
    "comment": "Dois átomos de hidrogênio e um de oxigênio."
  },
  {
    "front": { "text": "Capital da França?" },
    "back":  { "text": "Paris" }
  }
]
```

### Cartão de palavra oculta (`hidden_word`)

O texto exibe a frase com a palavra oculta; o aluno revela antes de virar o cartão.

```json
[
  {
    "kind": "hidden_word",
    "hiddenWord": {
      "phrase": "A fotossíntese ocorre nos cloroplastos.",
      "word": "cloroplastos",
      "hint": "Organela vegetal que contém clorofila"
    },
    "back": { "text": "cloroplastos" },
    "comment": "Localizada principalmente nas células das folhas."
  }
]
```

---

## Formato CSV

Ideal para quem monta os cartões em planilhas (Excel, Google Sheets, etc.).

### Cabeçalhos aceitos

| Coluna | Alias (PT) | Obrigatória |
|---|---|---|
| `front` | `frente` | ✅ |
| `back` | `verso` | ✅ |
| `comment` | `comentario` | ❌ |
| `hiddenWord` | `palavra_oculta` | ❌ |
| `hint` | `dica` | ❌ |

### Exemplo

```csv
front,back,comment
O que é DNA?,Ácido desoxirribonucleico — molécula que carrega informação genética.,Encontrado no núcleo das células eucarióticas.
Defina proteína.,Macromolécula formada por aminoácidos ligados por ligações peptídicas.,
Fórmula da glicose?,C₆H₁₂O₆,Principal fonte de energia celular.
```

### Cartão com palavra oculta no CSV

```csv
front,back,hiddenWord,hint
A célula realiza respiração celular nas mitocôndrias.,mitocôndrias,mitocôndrias,Organela da respiração
```

### Dicas para CSV

- Valores com vírgulas internas devem ser envolvidos em aspas duplas: `"texto, com, vírgulas"`.
- A primeira linha com os cabeçalhos é obrigatória para o parser identificar os campos.
- Encoding recomendado: **UTF-8**.

---

## Limites e restrições

| Parâmetro | Limite |
|---|---|
| Cartões por importação | Até o limite do plano (preenchimento do deck restante) |
| Texto por lado (`front`/`back`) | 1.500 caracteres |
| Comentário | 2.500 caracteres |
| Frase (hidden_word) | 600 caracteres |
| Palavra oculta | 80 caracteres |
| Dica | 200 caracteres |

Se o deck já estiver no limite de cartões, a importação retorna erro `403` com `requiresUpgrade: true`.

---

## Como importar

1. Acesse o deck que deseja editar: `/flashcards/d/<slug>/editar`
2. Clique em **"Importar cartões"** (botão no topo da lista de cartões)
3. Selecione o formato (**Markdown**, JSON ou CSV)
4. Cole o conteúdo no campo de texto
5. Clique em **"Importar"**
6. Um toast confirmará quantos cartões foram importados com sucesso

---

## Erros comuns

| Erro | Causa | Solução |
|---|---|---|
| `Nenhum cartão válido encontrado` | Formato incorreto ou campos obrigatórios ausentes | Verifique se `## Frente` e `## Verso` estão presentes; no JSON, `front.text` e `back.text` |
| `Formato inválido` | JSON malformado | Valide o JSON em [jsonlint.com](https://jsonlint.com) |
| `Limite de cartões atingido` | Deck cheio | Apague cartões existentes ou faça upgrade do plano |
| `Sem permissão` | Tentativa de importar em deck de outro usuário | Só o dono do deck ou admin pode importar |
