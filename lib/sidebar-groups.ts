import {
  SIDEBAR_SECTION_DEFINITIONS,
  getOrderedSidebarSections,
  normalizeSidebarOrder,
  type SidebarSectionDefinition,
  type SidebarSectionKey,
  type SidebarSectionOrder,
} from './sidebar-sections'
import { isValidSidebarIcon } from './sidebar-icons'

/**
 * Grupos do menu lateral.
 *
 * O menu era uma lista plana de até 18 itens de mesmo peso visual — sete deles
 * subáreas do Manual Clínico competindo de igual para igual com "Provas". O que
 * faltava não era menos funcionalidade, era hierarquia. Aqui mora essa camada:
 * uma seção pode viver no primeiro nível (como sempre) ou dentro de um grupo
 * colapsável.
 *
 * Como em `sidebar-sections`, este módulo é lido no servidor (validação do que
 * vem do banco em /api/admin/settings e /api/bootstrap) e por isso não importa
 * lucide — só o NOME do ícone do grupo, validado contra o mesmo catálogo das
 * seções.
 *
 * Tudo aqui é configurável pelo admin: quais grupos existem, o nome, o ícone,
 * se nascem abertos e que seções moram em cada um. O código só define o ponto
 * de partida.
 */

export interface SidebarGroupDefinition {
  /** Slug estável, salvo no banco junto com as seções. Ex.: 'manual-clinico'. */
  key: string
  label: string
  /** Nome no catálogo de `sidebar-icons`. */
  icon: string
  /** Se o grupo nasce aberto para quem nunca mexeu no menu. */
  defaultOpen: boolean
}

/** Seção → chave do grupo. Ausente = item de primeiro nível. */
export type SidebarSectionGroups = Partial<Record<SidebarSectionKey, string>>

/**
 * Só o Manual Clínico nasce agrupado, e por um motivo específico: são oito
 * rotas irmãs (`/manual-clinico/*`) que, soltas, dobram o tamanho do menu
 * assim que o admin liga as subáreas. As áreas de uso diário — Provas, Banco
 * de Questões, Materiais, Fórum — seguem no primeiro nível: esconder atrás de
 * um clique justamente o que o aluno abre todo dia trocaria um problema por
 * outro. Quem quiser mais grupos cria na tela de configuração.
 */
export const DEFAULT_SIDEBAR_GROUPS: SidebarGroupDefinition[] = [
  {
    key: 'manual-clinico',
    label: 'Manual Clínico',
    icon: 'heart-pulse',
    defaultOpen: false,
  },
]

export const DEFAULT_SECTION_GROUPS: SidebarSectionGroups = {
  manualClinico: 'manual-clinico',
  ferramentasClinicas: 'manual-clinico',
  farmacologia: 'manual-clinico',
  anatomia3d: 'manual-clinico',
  manualHistologia: 'manual-clinico',
  manualExames: 'manual-clinico',
  manualRadiologia: 'manual-clinico',
  manualEletro: 'manual-clinico',
}

/** Teto de grupos. Não é limitação técnica: é o ponto em que agrupar deixa de organizar. */
export const MAX_SIDEBAR_GROUPS = 12
const MAX_GROUP_LABEL = 40
const GROUP_KEY_PATTERN = /^[a-z0-9][a-z0-9-]{0,39}$/
const FALLBACK_GROUP_ICON = 'folder'

/**
 * Quantas seções visíveis um grupo precisa ter para valer o acordeão. Com uma
 * só, o grupo é desmontado e a seção volta ao primeiro nível — é o que faz a
 * instalação padrão (onde apenas "Manual Clínico" está ligada, sem as subáreas)
 * continuar com o menu exatamente como era antes dos grupos.
 */
export const MIN_SECTIONS_TO_GROUP = 2

const SECTION_KEY_SET = new Set<string>(SIDEBAR_SECTION_DEFINITIONS.map((s) => s.key))

/** Slug a partir do nome digitado pelo admin. Sempre produz algo utilizável. */
export function toSidebarGroupKey(label: string): string {
  const slug = label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)

  return slug || `grupo-${Math.random().toString(36).slice(2, 8)}`
}

/** Garante que a chave não colide com nenhuma já existente. */
export function uniqueSidebarGroupKey(base: string, taken: Iterable<string>): string {
  const used = new Set(taken)
  if (!used.has(base)) return base

  for (let i = 2; i < 100; i += 1) {
    const candidate = `${base}-${i}`.slice(0, 40)
    if (!used.has(candidate)) return candidate
  }

  return `${base}-${Date.now().toString(36)}`.slice(0, 40)
}

/**
 * Normaliza a lista de grupos vinda do banco. Tolerante de propósito, pelo
 * mesmo motivo da ordem das seções: este dado sobrevive a mudanças de código e
 * a edições manuais. Uma entrada quebrada é descartada, não derruba o menu.
 *
 * Ausência total (`undefined`/`null`/lixo) significa "nunca configurado" e cai
 * no padrão. Um array vazio é uma escolha do admin — menu sem grupo nenhum — e
 * é respeitado.
 */
export function normalizeSidebarGroups(input?: unknown): SidebarGroupDefinition[] {
  if (!Array.isArray(input)) return DEFAULT_SIDEBAR_GROUPS.map((group) => ({ ...group }))

  const groups: SidebarGroupDefinition[] = []
  const seen = new Set<string>()

  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue
    const candidate = raw as Record<string, unknown>

    const key = typeof candidate.key === 'string' ? candidate.key.trim().toLowerCase() : ''
    if (!GROUP_KEY_PATTERN.test(key) || seen.has(key)) continue

    const rawLabel = typeof candidate.label === 'string' ? candidate.label.trim() : ''
    const label = rawLabel ? rawLabel.slice(0, MAX_GROUP_LABEL) : key

    seen.add(key)
    groups.push({
      key,
      label,
      icon: isValidSidebarIcon(candidate.icon) ? candidate.icon : FALLBACK_GROUP_ICON,
      defaultOpen: candidate.defaultOpen === true,
    })

    if (groups.length >= MAX_SIDEBAR_GROUPS) break
  }

  return groups
}

/**
 * Normaliza o mapa seção → grupo. Descarta seção desconhecida (removida numa
 * versão futura) e referência a grupo que não existe mais — nos dois casos a
 * seção simplesmente volta ao primeiro nível, que é o comportamento seguro.
 */
export function normalizeSidebarSectionGroups(
  input: unknown,
  groups: SidebarGroupDefinition[] = DEFAULT_SIDEBAR_GROUPS
): SidebarSectionGroups {
  const groupKeys = new Set(groups.map((group) => group.key))
  const source =
    input && typeof input === 'object' && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : DEFAULT_SECTION_GROUPS

  const assignments: SidebarSectionGroups = {}
  for (const [sectionKey, groupKey] of Object.entries(source)) {
    if (!SECTION_KEY_SET.has(sectionKey)) continue
    if (typeof groupKey !== 'string' || !groupKeys.has(groupKey)) continue
    assignments[sectionKey as SidebarSectionKey] = groupKey
  }

  return assignments
}

// ─── Árvore do menu ──────────────────────────────────────────────────────────

export type SidebarTreeNode =
  | { type: 'section'; id: string; section: SidebarSectionDefinition }
  | {
      type: 'group'
      id: string
      group: SidebarGroupDefinition
      sections: SidebarSectionDefinition[]
    }

export interface BuildSidebarTreeOptions {
  /**
   * Mínimo de seções para o grupo sobreviver como acordeão. O menu usa o
   * padrão; a tela do admin passa 1, porque lá o grupo precisa aparecer mesmo
   * meio vazio para poder ser configurado.
   */
  minSectionsToGroup?: number
}

/**
 * Monta a árvore do menu a partir das seções JÁ ordenadas e filtradas.
 *
 * A posição vertical continua saindo de uma única fonte — a ordem plana das
 * seções. Um grupo aparece na posição do seu primeiro membro e recolhe ali
 * todos os outros, mesmo que estejam espalhados pela ordem. É o que mantém o
 * dado antigo (salvo antes dos grupos existirem) funcionando sem migração.
 */
export function buildSidebarTree(
  sections: SidebarSectionDefinition[],
  groups: SidebarGroupDefinition[],
  assignments: SidebarSectionGroups,
  options: BuildSidebarTreeOptions = {}
): SidebarTreeNode[] {
  const minToGroup = options.minSectionsToGroup ?? MIN_SECTIONS_TO_GROUP
  const groupByKey = new Map(groups.map((group) => [group.key, group]))
  const nodes: SidebarTreeNode[] = []
  const groupNodes = new Map<string, Extract<SidebarTreeNode, { type: 'group' }>>()

  for (const section of sections) {
    const groupKey = assignments[section.key]
    const group = groupKey ? groupByKey.get(groupKey) : undefined

    if (!group) {
      nodes.push({ type: 'section', id: `section:${section.key}`, section })
      continue
    }

    const existing = groupNodes.get(group.key)
    if (existing) {
      existing.sections.push(section)
      continue
    }

    const node: Extract<SidebarTreeNode, { type: 'group' }> = {
      type: 'group',
      id: `group:${group.key}`,
      group,
      sections: [section],
    }
    groupNodes.set(group.key, node)
    nodes.push(node)
  }

  // Grupo com menos membros que o mínimo não justifica o clique a mais: seus
  // itens voltam ao primeiro nível, na posição onde o grupo estava.
  return nodes.flatMap((node) => {
    if (node.type === 'section' || node.sections.length >= minToGroup) return [node]
    return node.sections.map(
      (section): SidebarTreeNode => ({ type: 'section', id: `section:${section.key}`, section })
    )
  })
}

// ─── Reordenação (usada pela tela do admin) ──────────────────────────────────

/**
 * Achata a árvore de volta numa ordem plana canônica, com os membros de cada
 * grupo contíguos. Depois de qualquer edição do admin a ordem salva passa por
 * aqui, então o dado no banco nunca fica com um grupo "partido ao meio".
 */
function flattenTreeToOrder(nodes: SidebarTreeNode[]): SidebarSectionOrder {
  return nodes.flatMap((node) =>
    node.type === 'section' ? [node.section.key] : node.sections.map((section) => section.key)
  )
}

/** Árvore completa (sem filtrar por habilitada), do jeito que o admin edita. */
export function buildFullSidebarTree(
  order: unknown,
  groups: SidebarGroupDefinition[],
  assignments: SidebarSectionGroups
): SidebarTreeNode[] {
  return buildSidebarTree(getOrderedSidebarSections(order), groups, assignments, {
    minSectionsToGroup: 1,
  })
}

export type SidebarMoveTarget =
  | { type: 'section'; key: SidebarSectionKey }
  | { type: 'group'; key: string }

/**
 * Sobe (-1) ou desce (+1) um nó do menu, devolvendo a nova ordem plana.
 *
 * Move o que o admin vê: um grupo anda como bloco inteiro, passando por cima
 * do vizinho de primeiro nível; uma seção dentro de um grupo anda apenas entre
 * os irmãos daquele grupo. Sem isso, "descer" um grupo de oito itens exigiria
 * oito cliques e ainda embaralharia a lista pelo caminho.
 */
export function moveSidebarNode(
  order: unknown,
  groups: SidebarGroupDefinition[],
  assignments: SidebarSectionGroups,
  target: SidebarMoveTarget,
  direction: -1 | 1
): SidebarSectionOrder {
  const nodes = buildFullSidebarTree(order, groups, assignments)

  // Seção dentro de um grupo: anda só entre os irmãos.
  if (target.type === 'section') {
    const groupKey = assignments[target.key]
    if (groupKey) {
      const groupNode = nodes.find(
        (node): node is Extract<SidebarTreeNode, { type: 'group' }> =>
          node.type === 'group' && node.group.key === groupKey
      )
      if (groupNode) {
        const from = groupNode.sections.findIndex((section) => section.key === target.key)
        const to = from + direction
        if (from === -1 || to < 0 || to >= groupNode.sections.length) {
          return normalizeSidebarOrder(order)
        }
        const siblings = [...groupNode.sections]
        ;[siblings[from], siblings[to]] = [siblings[to], siblings[from]]
        groupNode.sections = siblings
        return flattenTreeToOrder(nodes)
      }
    }
  }

  const nodeId = target.type === 'group' ? `group:${target.key}` : `section:${target.key}`
  const from = nodes.findIndex((node) => node.id === nodeId)
  const to = from + direction
  if (from === -1 || to < 0 || to >= nodes.length) return normalizeSidebarOrder(order)

  const next = [...nodes]
  ;[next[from], next[to]] = [next[to], next[from]]
  return flattenTreeToOrder(next)
}

/**
 * Move uma seção para um grupo (ou para fora dele, com `groupKey` nulo) e já
 * devolve a ordem recanonizada, para a seção aterrissar junto dos novos irmãos
 * em vez de ficar órfã no meio da lista.
 */
export function assignSectionToGroup(
  order: unknown,
  groups: SidebarGroupDefinition[],
  assignments: SidebarSectionGroups,
  sectionKey: SidebarSectionKey,
  groupKey: string | null
): { order: SidebarSectionOrder; assignments: SidebarSectionGroups } {
  const nextAssignments: SidebarSectionGroups = { ...assignments }
  if (groupKey && groups.some((group) => group.key === groupKey)) {
    nextAssignments[sectionKey] = groupKey
  } else {
    delete nextAssignments[sectionKey]
  }

  return {
    order: flattenTreeToOrder(buildFullSidebarTree(order, groups, nextAssignments)),
    assignments: nextAssignments,
  }
}

/** Remove um grupo e devolve seus membros ao primeiro nível. */
export function removeSidebarGroup(
  order: unknown,
  groups: SidebarGroupDefinition[],
  assignments: SidebarSectionGroups,
  groupKey: string
): {
  groups: SidebarGroupDefinition[]
  assignments: SidebarSectionGroups
  order: SidebarSectionOrder
} {
  const nextGroups = groups.filter((group) => group.key !== groupKey)
  const nextAssignments: SidebarSectionGroups = {}
  for (const [section, assigned] of Object.entries(assignments)) {
    if (assigned !== groupKey) nextAssignments[section as SidebarSectionKey] = assigned
  }

  return {
    groups: nextGroups,
    assignments: nextAssignments,
    order: flattenTreeToOrder(buildFullSidebarTree(order, nextGroups, nextAssignments)),
  }
}
