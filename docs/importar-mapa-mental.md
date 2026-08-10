# Importar Mapa Mental (JSON) — Guia completo para IA e usuários

> Use esta referência para gerar mapas mentais em JSON (com o **Claude**, ChatGPT, Gemini etc.)
> e importá-los prontos no Domine Aqui pela página **`/mapa-mental`** → botão **“Importar JSON”**.
> O formato é **exatamente o mesmo** que o editor gera em **Exportar → JSON**, então você pode
> exportar um mapa, editar o JSON e reimportar.

---

## 1. Visão geral do formato

Um mapa mental é um objeto JSON com **três campos de topo**:

```json
{
  "title": "Título do mapa",
  "nodes": [ /* lista de nós (a árvore de ideias) */ ],
  "style": { "theme": "forest", "edgeStyle": "curved", "nodeShape": "rounded" }
}
```

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `title` | `string` | Recomendado | Nome do mapa. Se ausente, usa o texto do nó raiz. Máx. **120** caracteres. |
| `nodes` | `array` | ✅ **Sim** | Lista de nós. É o coração do mapa. Precisa de **pelo menos 1 nó raiz**. |
| `style` | `object` | Opcional | Aparência (tema, conexões, forma). Se ausente, usa o padrão (`forest` / `curved` / `rounded`). |

> **Aceito também:** um **array puro de nós** (`[ {…}, {…} ]`) sem o invólucro. Nesse caso o
> título vira o texto do nó raiz e o estilo vira o padrão. Prefira o formato completo.

Ao importar, um **novo mapa privado** é criado e aberto no editor. Nada é sobrescrito.

---

## 2. O nó (`MindMapNode`) — todos os campos

Cada item de `nodes` é um objeto:

```json
{
  "id": "root",
  "parentId": null,
  "text": "Sistema Cardiovascular",
  "x": 0,
  "y": 0,
  "color": "#2ECC71",
  "textColor": "#0B1F17",
  "borderColor": "#27AE60",
  "shape": "rounded",
  "icon": "❤️",
  "note": "Anotação longa em **markdown** simples.",
  "collapsed": false
}
```

| Campo | Tipo | Obrigatório | Regras / limites |
|---|---|---|---|
| `id` | `string` | ✅ **Sim** | Identificador **único** dentro do mapa. Máx. 40 caracteres. Ex.: `"root"`, `"n1"`, `"coracao"`. |
| `parentId` | `string \| null` | ✅ **Sim** | `null` = nó **raiz**. Caso contrário, deve ser o `id` de outro nó (o “pai”). |
| `text` | `string` | ✅ **Sim** | Texto exibido no nó. Máx. **2000** caracteres. |
| `x` | `number` | ✅ **Sim** | Posição horizontal no canvas (coordenada do mundo). Inteiro. |
| `y` | `number` | ✅ **Sim** | Posição vertical no canvas. Inteiro. |
| `color` | `string` (hex) | Opcional | Cor de **preenchimento** do nó. Se ausente, usa a cor do tema. |
| `textColor` | `string` (hex) | Opcional | Cor do **texto**. Se ausente, é calculada automaticamente para contraste. |
| `borderColor` | `string` (hex) | Opcional | Cor da **borda**. Se ausente, usa a do tema. |
| `shape` | `string` | Opcional | Forma **deste** nó: `rounded`, `pill`, `rect`, `ellipse`. Sobrepõe o `nodeShape` global. |
| `icon` | `string` (emoji) | Opcional | Emoji decorativo. Máx. 16 caracteres. Ex.: `"💡"`, `"❤️"`. |
| `note` | `string` | Opcional | Anotação/descrição longa (markdown simples). Máx. **8000** caracteres. |
| `collapsed` | `boolean` | Opcional | `true` esconde os descendentes do nó no editor. |

> ⚠️ Campos desconhecidos são **ignorados** na importação. `id` duplicado é descartado
> (fica só a 1ª ocorrência). Um `parentId` que **não existe** vira automaticamente um nó raiz.

---

## 3. A árvore: como `parentId` conecta os nós

O mapa é uma **árvore**. As conexões (linhas) são criadas automaticamente a partir do
`parentId` — você **não** define linhas manualmente.

- **Raiz:** `parentId: null`. Normalmente há **um** nó raiz (o tema central), mas vários
  são permitidos (múltiplas árvores no mesmo canvas).
- **Filho:** aponta para o `id` do pai. Ex.: um nó com `"parentId": "root"` liga-se à raiz.
- **Netos, bisnetos…:** apontam para o `id` do respectivo pai — profundidade ilimitada
  (respeitando o limite total de nós).

```jsonc
// root  →  cap1  →  sub1
[
  { "id": "root", "parentId": null,  "text": "Livro", "x": 0,   "y": 0 },
  { "id": "cap1", "parentId": "root","text": "Capítulo 1", "x": 220, "y": 0 },
  { "id": "sub1", "parentId": "cap1","text": "Seção 1.1",  "x": 440, "y": 0 }
]
```

**Dica de `id`:** use ids curtos e legíveis (`root`, `n1`, `n2`…). O importador aceita
qualquer string única; não precisa ser aleatória.

---

## 4. Posição (`x`, `y`) — e como não se preocupar com ela

`x` e `y` são coordenadas absolutas no canvas (antes do zoom). Você **precisa** informá-las,
mas **não precisa acertá-las com precisão**: depois de importar, clique em
**Auto‑organizar** (ícone de grade) no editor e o mapa se reposiciona sozinho numa árvore
limpa.

Se quiser um layout já decente **sem** depender do Auto‑organizar, siga o padrão de árvore
horizontal que o próprio sistema usa:

- **`x` = profundidade × 220** — raiz em `x: 0`, filhos em `x: 220`, netos em `x: 440`…
- **`y`** cresce de cima para baixo; separe os irmãos em **~72 px** (`y: 0, 72, 144, …`).
  Idealmente, centralize o pai na média vertical dos filhos.

> Regra prática para a IA: gere `x = depth * 220` e distribua `y` para não sobrepor irmãos.
> Não é preciso ser perfeito — o usuário pode clicar em Auto‑organizar.

---

## 5. Cores — o sistema completo

Todas as cores são **hexadecimais**. Formatos aceitos:

- `#RGB` (ex.: `#2C7`)
- `#RRGGBB` (ex.: `#2ECC71`) ← **recomendado**
- `#RRGGBBAA` (com transparência, ex.: `#2ECC7180`)

Três cores por nó, **todas opcionais**:

| Propriedade | O que pinta | Se omitida |
|---|---|---|
| `color` | Fundo (preenchimento) do nó | Usa a cor de nó do tema (`nodeBg`); a raiz usa `rootBg`. |
| `textColor` | Cor do texto | **Calculada automaticamente** para contrastar com `color` (texto escuro sobre fundo claro, branco sobre escuro). |
| `borderColor` | Cor da borda | Usa a cor de borda do tema (`nodeBorder`). |

**Recomendação para a IA:** defina apenas `color` (e talvez `icon`). Deixe `textColor` e
`borderColor` **de fora** — o sistema escolhe o texto legível sozinho. Só defina `textColor`
se quiser forçar uma cor específica.

Para colorir com harmonia, use as **paletas dos temas** (seção 6): cada tema traz 10 cores
que combinam com o fundo. Uma tática comum: **uma cor por ramo principal** (todos os
descendentes herdam visualmente a ideia do ramo).

---

## 6. Temas (`style.theme`) e suas paletas

O tema define o **fundo do canvas**, as cores padrão dos nós e a **paleta** sugerida.
Escolha **um** destes 8 valores para `style.theme`:

| `theme` | Nome | Fundo (`canvasBg`) | Paleta (10 cores para os nós) |
|---|---|---|---|
| `forest` | Floresta 🌲 | `#0B1F17` | `#2ECC71` `#27AE60` `#1ABC9C` `#3498DB` `#9B59B6` `#E67E22` `#E74C3C` `#F1C40F` `#EC4899` `#34495E` |
| `midnight` | Meia‑noite 🌌 | `#0B1326` | `#60A5FA` `#3B82F6` `#6366F1` `#8B5CF6` `#06B6D4` `#22D3EE` `#F472B6` `#FBBF24` `#34D399` `#F87171` |
| `graphite` | Grafite ⚙️ | `#15161A` | `#A3E635` `#84CC16` `#22D3EE` `#60A5FA` `#A78BFA` `#F472B6` `#FB923C` `#FBBF24` `#F87171` `#94A3B8` |
| `ocean` | Oceano 🌊 | `#062A33` | `#2DD4BF` `#14B8A6` `#22D3EE` `#38BDF8` `#818CF8` `#F472B6` `#FB7185` `#FBBF24` `#A3E635` `#5EEAD4` |
| `sunset` | Pôr do sol 🌅 | `#2A1410` | `#FB923C` `#F97316` `#EF4444` `#EC4899` `#F59E0B` `#FBBF24` `#A78BFA` `#60A5FA` `#34D399` `#FCA5A5` |
| `royal` | Realeza 👑 | `#1A1030` | `#C084FC` `#A855F7` `#8B5CF6` `#6366F1` `#EC4899` `#F472B6` `#60A5FA` `#22D3EE` `#FBBF24` `#34D399` |
| `rose` | Rosé 🌹 | `#2A0E1B` | `#FB7185` `#F43F5E` `#EC4899` `#D946EF` `#A855F7` `#F59E0B` `#FBBF24` `#34D399` `#60A5FA` `#FDA4AF` |
| `light` | Claro ☀️ | `#F4F6F5` | `#16A34A` `#059669` `#0891B2` `#2563EB` `#7C3AED` `#DB2777` `#EA580C` `#CA8A04` `#DC2626` `#475569` |

> Se `theme` for inválido ou ausente, o padrão é **`forest`**.
> Dica: em fundos escuros (todos, menos `light`), cores vivas ficam ótimas; no tema
> `light`, prefira as cores mais saturadas/escuras da paleta.

---

## 7. Conexões (`style.edgeStyle`)

Estilo das linhas que ligam pai e filho. Escolha **um**:

| `edgeStyle` | Aparência |
|---|---|
| `curved` | Curva suave (Bézier). **Padrão.** |
| `straight` | Linha reta direta. |
| `stepped` | Em degraus (ortogonal), estilo organograma. |

Se ausente/inválido → `curved`.

---

## 8. Forma dos nós (`style.nodeShape` e `node.shape`)

Forma **padrão** de todos os nós = `style.nodeShape`. Um nó pode sobrepor com o seu próprio
`shape`. Valores:

| Valor | Aparência |
|---|---|
| `rounded` | Retângulo de cantos arredondados. **Padrão.** |
| `pill` | Cápsula (bordas totalmente arredondadas). |
| `rect` | Retângulo de cantos retos. |
| `ellipse` | Elipse / oval. |

Se ausente/inválido → `rounded`.

---

## 9. Ícones (`node.icon`)

Um **emoji** decorativo por nó (máx. 16 caracteres). Aparece antes do texto. Sugestões usadas
no editor:

`💡` `⭐` `✅` `❗` `📌` `🔥` `🎯` `📚` `🧠` `❤️` `⚠️` `🚀` `💰` `📈` `🔑` `❓` `✏️` `📝` `⏰` `🏆`

Qualquer emoji é válido — não precisa estar na lista.

---

## 10. Notas e colapso

- **`note`** — texto longo (markdown simples: `**negrito**`, `*itálico*`) anexado ao nó.
  Aparece nos detalhes do nó. Máx. 8000 caracteres. Ótimo para explicações/definições.
- **`collapsed`** — `true` esconde os descendentes do nó (útil em mapas grandes). Padrão `false`.

---

## 11. Limites (para não estourar o servidor)

| Limite | Valor |
|---|---|
| Máx. de nós | **5000** |
| Título | 120 caracteres |
| Texto do nó (`text`) | 2000 caracteres |
| Nota (`note`) | 8000 caracteres |
| Descrição do mapa | 600 caracteres |
| Tags | 8 tags de até 24 caracteres |

Nós além de 5000 são cortados; textos maiores são truncados.

---

## 12. Exemplo completo (pronto para colar)

```json
{
  "title": "Sistema Cardiovascular",
  "style": { "theme": "rose", "edgeStyle": "curved", "nodeShape": "rounded" },
  "nodes": [
    { "id": "root", "parentId": null, "text": "Sistema Cardiovascular", "x": 0, "y": 216, "icon": "❤️", "color": "#F43F5E" },

    { "id": "coracao", "parentId": "root", "text": "Coração", "x": 220, "y": 72, "color": "#EC4899",
      "note": "Órgão muscular de **4 câmaras**: 2 átrios e 2 ventrículos." },
    { "id": "vasos",   "parentId": "root", "text": "Vasos", "x": 220, "y": 216, "color": "#A855F7" },
    { "id": "sangue",  "parentId": "root", "text": "Sangue", "x": 220, "y": 360, "color": "#D946EF" },

    { "id": "atrios",     "parentId": "coracao", "text": "Átrios", "x": 440, "y": 36 },
    { "id": "ventriculos","parentId": "coracao", "text": "Ventrículos", "x": 440, "y": 108, "icon": "💪" },

    { "id": "arterias", "parentId": "vasos", "text": "Artérias", "x": 440, "y": 180, "icon": "🔴" },
    { "id": "veias",    "parentId": "vasos", "text": "Veias", "x": 440, "y": 252, "icon": "🔵" },

    { "id": "hemacias", "parentId": "sangue", "text": "Hemácias", "x": 440, "y": 324 },
    { "id": "plasma",   "parentId": "sangue", "text": "Plasma", "x": 440, "y": 396,
      "note": "~55% do volume sanguíneo. Água, proteínas e eletrólitos." }
  ]
}
```

Resultado: mapa no tema **Rosé**, raiz “Sistema Cardiovascular” com 3 ramos coloridos
(Coração/Vasos/Sangue), cada um com filhos, ícones em alguns nós e notas em dois deles.

---

## 13. Prompt modelo para a IA

Copie e cole no Claude (ajuste o tema/assunto):

> Gere um **mapa mental** no formato JSON do Domine Aqui sobre **[SEU ASSUNTO]**.
> Regras:
> - Responda **apenas** com o JSON, sem texto ao redor.
> - Estrutura: `{ "title", "style": { "theme", "edgeStyle", "nodeShape" }, "nodes": [...] }`.
> - Cada nó tem `id` (único), `parentId` (`null` na raiz, senão o `id` do pai), `text`, `x`, `y`.
> - Use **`x = profundidade * 220`** e distribua `y` em passos de ~72 para não sobrepor irmãos.
> - Escolha um `theme` entre: forest, midnight, graphite, ocean, sunset, royal, rose, light.
> - Dê **uma `color`** (hex da paleta do tema) para cada **ramo principal**; deixe `textColor`
>   de fora (o sistema calcula o contraste).
> - Opcional: `icon` (emoji) e `note` (explicação) em nós importantes.
> - Comece com **um** nó raiz (`parentId: null`).

---

## 14. Como importar na plataforma

1. Vá em **`/mapa-mental`**.
2. Clique em **“Importar JSON”** (no topo, ao lado de “Novo mapa”).
3. **Cole** o JSON na caixa **ou** clique em **“Escolher arquivo .json”** e envie o arquivo.
4. Clique em **“Importar mapa”**. Um novo mapa privado é criado e aberto no editor.
5. (Opcional) Clique em **Auto‑organizar** para alinhar o layout, ajuste cores/estilo e
   **Salve**.

> Plano gratuito: é possível manter **1** mapa mental. Premium/Essential importam quantos
> quiser. Se atingir o limite, a importação avisa.

---

## 15. Erros comuns

| Mensagem | Causa | Correção |
|---|---|---|
| “JSON inválido” | Vírgula sobrando, aspas erradas, texto fora do JSON | Valide o JSON (nada de comentários `//` no arquivo real). |
| “Nenhum nó encontrado…” | Falta o array `nodes` (ou está vazio) | Inclua `"nodes": [ … ]` com ao menos 1 nó. |
| “Cada nó precisa de um id…” | Nó sem `id` ou com `id` não‑texto | Dê um `id` string único a cada nó. |
| “Nenhum nó raiz…” | Nenhum nó com `parentId: null` | Marque o nó central com `"parentId": null`. |

---

### Referências no código
- Formato exportado: `components/mindmap/mindmap-editor.tsx` (`exportJSON`).
- Tipos: `lib/types.ts` (`MindMapNode`, `MindMapStyle`).
- Temas e paletas: `lib/mindmap-themes.ts`.
- Saneamento/limites no servidor: `lib/mindmap.ts` (`sanitizeNodes`, `MINDMAP_LIMITS`).
