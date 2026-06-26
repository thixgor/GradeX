import { Db, ObjectId } from 'mongodb'
import type { MindMap, MindMapNode, MindMapVisibility, MindMapStyle } from './types'
import { MINDMAP_THEME_KEYS, DEFAULT_MINDMAP_STYLE } from './mindmap-themes'

export const MINDMAP_COLLECTIONS = {
  maps: 'mindMaps',
  likes: 'mindMapLikes',
} as const

const SLUG_MAX = 60

/** Limites de tamanho — protegem o banco contra payloads abusivos. */
export const MINDMAP_LIMITS = {
  maxNodes: 5000,
  maxTitle: 120,
  maxDescription: 600,
  maxNodeText: 2000,
  maxNote: 8000,
  maxTags: 8,
  maxTagLength: 24,
} as const

export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, SLUG_MAX)
}

function shortId(): string {
  return Math.random().toString(36).slice(2, 8)
}

export async function generateUniqueSlug(db: Db, base: string): Promise<string> {
  const maps = db.collection(MINDMAP_COLLECTIONS.maps)
  let slug = slugify(base) || `mapa-${shortId()}`
  let attempt = 0
  while (await maps.findOne({ slug })) {
    attempt += 1
    slug = `${slugify(base) || 'mapa'}-${shortId()}`
    if (attempt > 8) {
      slug = `mapa-${Date.now().toString(36)}-${shortId()}`
      break
    }
  }
  return slug
}

export function isValidObjectId(id: string | undefined | null): boolean {
  return !!id && ObjectId.isValid(id)
}

export function sanitizeTitle(title: string): string {
  return String(title || '').replace(/\s+/g, ' ').trim().slice(0, MINDMAP_LIMITS.maxTitle)
}

export function sanitizeDescription(text: string): string {
  return String(text || '').trim().slice(0, MINDMAP_LIMITS.maxDescription)
}

export function sanitizeTags(tags: any): string[] {
  if (!Array.isArray(tags)) return []
  return tags
    .map((t: any) => String(t || '').trim().slice(0, MINDMAP_LIMITS.maxTagLength))
    .filter(Boolean)
    .slice(0, MINDMAP_LIMITS.maxTags)
}

const VALID_SHAPES = ['rounded', 'pill', 'rect', 'ellipse']
const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

function sanitizeHex(value: any): string | undefined {
  const v = String(value || '').trim()
  return HEX.test(v) ? v : undefined
}

/** Saneia o array de nós vindo do cliente. Reconstrói ids/parentId consistentes. */
export function sanitizeNodes(input: any): MindMapNode[] {
  if (!Array.isArray(input)) return []
  const seen = new Set<string>()
  const nodes: MindMapNode[] = []
  for (const raw of input.slice(0, MINDMAP_LIMITS.maxNodes)) {
    if (!raw || typeof raw !== 'object') continue
    const id = String(raw.id || '').trim().slice(0, 40)
    if (!id || seen.has(id)) continue
    seen.add(id)
    const parentId = raw.parentId == null ? null : String(raw.parentId).trim().slice(0, 40) || null
    nodes.push({
      id,
      parentId,
      text: String(raw.text ?? '').slice(0, MINDMAP_LIMITS.maxNodeText),
      x: Number.isFinite(raw.x) ? Math.round(raw.x) : 0,
      y: Number.isFinite(raw.y) ? Math.round(raw.y) : 0,
      color: sanitizeHex(raw.color),
      textColor: sanitizeHex(raw.textColor),
      borderColor: sanitizeHex(raw.borderColor),
      shape: VALID_SHAPES.includes(raw.shape) ? raw.shape : undefined,
      icon: raw.icon ? String(raw.icon).slice(0, 16) : undefined,
      note: raw.note ? String(raw.note).slice(0, MINDMAP_LIMITS.maxNote) : undefined,
      collapsed: raw.collapsed === true ? true : undefined,
    })
  }
  // Garante que todo parentId aponte para um nó existente; senão vira raiz.
  return nodes.map(n => (n.parentId && !seen.has(n.parentId) ? { ...n, parentId: null } : n))
}

export function isValidVisibility(v: any): v is MindMapVisibility {
  return v === 'private' || v === 'public' || v === 'unlisted' || v === 'password'
}

const VALID_EDGE_STYLES = ['curved', 'straight', 'stepped']

/** Saneia o objeto de estilo do mapa, aplicando padrões para valores inválidos. */
export function sanitizeStyle(input: any): MindMapStyle {
  const s = input && typeof input === 'object' ? input : {}
  return {
    theme: MINDMAP_THEME_KEYS.includes(s.theme) ? s.theme : DEFAULT_MINDMAP_STYLE.theme,
    edgeStyle: VALID_EDGE_STYLES.includes(s.edgeStyle) ? s.edgeStyle : DEFAULT_MINDMAP_STYLE.edgeStyle,
    nodeShape: VALID_SHAPES.includes(s.nodeShape) ? s.nodeShape : DEFAULT_MINDMAP_STYLE.nodeShape,
  }
}

/**
 * Remove campos sensíveis (passwordHash) antes de enviar ao cliente e
 * expõe `hasPassword` para a UI. `includeNodes=false` oculta o conteúdo
 * de mapas protegidos/privados quando o usuário ainda não tem acesso.
 */
export function normalizeMapForResponse(
  map: MindMap & { _id?: any },
  opts: { includeNodes?: boolean } = {}
) {
  const { includeNodes = true } = opts
  const { passwordHash, nodes, ...rest } = map as any
  return {
    ...rest,
    _id: map._id ? String(map._id) : undefined,
    hasPassword: !!passwordHash || map.visibility === 'password',
    nodes: includeNodes ? (nodes || []) : [],
  }
}

export type MindMapAccessReason = 'owner' | 'admin' | 'public' | 'unlisted' | 'password' | 'unlocked'

export interface MindMapAccessResult {
  /** Pode ver os metadados do mapa (existência, título). */
  canView: boolean
  /** Pode ver o conteúdo (nós). Mapas com senha exigem unlock, exceto admin/dono. */
  canViewContent: boolean
  /** Pode editar/salvar. */
  canEdit: boolean
  /** Pode deletar. */
  canDelete: boolean
  isOwner: boolean
  isAdmin: boolean
  /** True quando o mapa exige senha e o solicitante ainda não a forneceu. */
  locked: boolean
  reasons: MindMapAccessReason[]
}

interface ResolveParams {
  map: MindMap & { _id?: any }
  userId: string | null
  isAdmin: boolean
  /** true quando o cliente comprovou a senha (via unlock). */
  passwordOk?: boolean
}

/**
 * Resolve permissões de um mapa. Admin sempre tem acesso total — inclusive
 * a mapas protegidos por senha (requisito: "administrar todos, ver até os que
 * têm senha") — e pode deletar qualquer mapa.
 */
export function resolveMindMapAccess({ map, userId, isAdmin, passwordOk }: ResolveParams): MindMapAccessResult {
  const isOwner = !!userId && map.ownerId === userId
  const reasons: MindMapAccessReason[] = []
  if (isOwner) reasons.push('owner')
  if (isAdmin) reasons.push('admin')

  const published = !!map.isPublished
  const isPublic = map.visibility === 'public' && published
  const isUnlisted = map.visibility === 'unlisted' && published
  const needsPassword = map.visibility === 'password'

  if (isPublic) reasons.push('public')
  if (isUnlisted) reasons.push('unlisted')

  // Quem pode ao menos enxergar que o mapa existe / metadados.
  const canView = isOwner || isAdmin || isPublic || isUnlisted || needsPassword

  let canViewContent = isOwner || isAdmin || isPublic || isUnlisted
  let locked = false
  if (!canViewContent && needsPassword) {
    if (passwordOk) {
      canViewContent = true
      reasons.push('unlocked')
    } else {
      reasons.push('password')
      locked = true
    }
  }

  return {
    canView,
    canViewContent,
    canEdit: isOwner || isAdmin,
    canDelete: isOwner || isAdmin,
    isOwner,
    isAdmin,
    locked,
    reasons,
  }
}
