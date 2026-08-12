/**
 * Árvore do sumário do PDF Viewer.
 *
 * O sumário chega da API como uma lista PLANA de entradas com um `level`
 * (0 = tópico, 1 e 2 = subtópicos). O leitor mostrava essa lista inteira de
 * uma vez, só com recuo — em material com muitas páginas isso vira uma parede
 * de centenas de linhas e navegar fica pior do que rolar o documento.
 *
 * Aqui a lista plana vira uma árvore de tópicos com filhos, para o painel
 * mostrar só os tópicos e expandir os subtópicos sob demanda. As funções são
 * puras (e testadas em `__tests__/pdf-summary-outline.test.ts`) — o componente
 * só guarda o conjunto de nós abertos.
 */

export interface SummaryOutlineEntry {
  id: string
  title: string
  page: number
  level?: number
}

/** Mesmo teto do importador (`lib/pdf-summary-import.ts`): 0, 1 e 2. */
export const MAX_OUTLINE_LEVEL = 2

export interface SummaryOutlineNode {
  id: string
  entry: SummaryOutlineEntry
  /** Nível declarado, já limitado a 0..MAX_OUTLINE_LEVEL. */
  level: number
  /** Profundidade REAL na árvore — o recuo desenhado vem daqui, não do nível. */
  depth: number
  parentId: string | null
  childIds: string[]
  /** Filhos + netos: é o número que a linha fechada mostra ("+12"). */
  descendantCount: number
}

export interface SummaryOutline {
  byId: Map<string, SummaryOutlineNode>
  rootIds: string[]
  /** Ids que têm filhos — vazio quando o sumário é plano. */
  branchIds: string[]
  size: number
}

const EMPTY_OUTLINE: SummaryOutline = {
  byId: new Map(),
  rootIds: [],
  branchIds: [],
  size: 0,
}

function normalizeLevel(level: number | undefined): number {
  if (!Number.isFinite(level)) return 0
  return Math.max(0, Math.min(MAX_OUTLINE_LEVEL, Math.trunc(level as number)))
}

/**
 * Monta a árvore preservando a ordem original das entradas.
 *
 * O empilhamento é tolerante de propósito: sumário importado de IA pula nível
 * (um `##` logo depois de outro `##`, ou um material que começa em `##` sem
 * nenhum `#` antes). Quando não existe pai de nível menor na pilha, a entrada
 * vira raiz — nada é escondido atrás de um pai que não existe.
 */
export function buildSummaryOutline(entries: readonly SummaryOutlineEntry[]): SummaryOutline {
  if (!entries.length) return EMPTY_OUTLINE

  const byId = new Map<string, SummaryOutlineNode>()
  const rootIds: string[] = []
  const stack: SummaryOutlineNode[] = []

  for (const entry of entries) {
    // Entrada sem id (ou id repetido) quebraria a expansão, que é por id.
    if (!entry?.id || byId.has(entry.id)) continue

    const level = normalizeLevel(entry.level)
    while (stack.length && stack[stack.length - 1].level >= level) stack.pop()

    const parent = stack.length ? stack[stack.length - 1] : null
    const node: SummaryOutlineNode = {
      id: entry.id,
      entry,
      level,
      depth: parent ? parent.depth + 1 : 0,
      parentId: parent ? parent.id : null,
      childIds: [],
      descendantCount: 0,
    }

    byId.set(node.id, node)
    if (parent) parent.childIds.push(node.id)
    else rootIds.push(node.id)
    stack.push(node)
  }

  // Contagem de descendentes: de trás para frente, cada nó já encontra os
  // filhos contados (um filho sempre vem depois do pai na ordem original).
  const ids = Array.from(byId.keys())
  for (let index = ids.length - 1; index >= 0; index -= 1) {
    const node = byId.get(ids[index]) as SummaryOutlineNode
    let total = node.childIds.length
    for (const childId of node.childIds) {
      total += byId.get(childId)?.descendantCount ?? 0
    }
    node.descendantCount = total
  }

  const branchIds = ids.filter((id) => (byId.get(id)?.childIds.length ?? 0) > 0)

  return { byId, rootIds, branchIds, size: byId.size }
}

/** Ids dos pais do nó, da raiz para baixo (sem incluir o próprio nó). */
export function outlineAncestors(outline: SummaryOutline, id: string): string[] {
  const ancestors: string[] = []
  let current = outline.byId.get(id)?.parentId ?? null
  // O limite é a profundidade máxima possível; protege de ciclo caso a árvore
  // venha corrompida de algum lugar.
  while (current && ancestors.length <= outline.size) {
    ancestors.unshift(current)
    current = outline.byId.get(current)?.parentId ?? null
  }
  return ancestors
}

/**
 * Lista, na ordem da tela, os nós visíveis: raízes sempre, filhos apenas
 * enquanto todos os pais acima estiverem abertos.
 */
export function visibleOutlineNodes(
  outline: SummaryOutline,
  expanded: ReadonlySet<string>
): SummaryOutlineNode[] {
  const visible: SummaryOutlineNode[] = []

  const walk = (ids: readonly string[]) => {
    for (const id of ids) {
      const node = outline.byId.get(id)
      if (!node) continue
      visible.push(node)
      if (node.childIds.length && expanded.has(node.id)) walk(node.childIds)
    }
  }

  walk(outline.rootIds)
  return visible
}

/**
 * Seção em que o leitor está: a de MAIOR página que ainda não passou da página
 * atual. Empate (duas seções na mesma página) fica com a primeira, que é a que
 * abre a página.
 */
export function findActiveSummaryId(
  entries: readonly SummaryOutlineEntry[],
  currentPage: number
): string {
  let id = ''
  let bestPage = -1
  for (const entry of entries) {
    if (entry.page <= currentPage && entry.page > bestPage) {
      bestPage = entry.page
      id = entry.id
    }
  }
  return id
}
