/**
 * Leitor HTML de materiais (venda de experiências).
 *
 * Espelha os padrões de `lib/material-pdf-viewer.ts`, porém para um arquivo
 * .html único e autocontido:
 *   - `validateMaterialHtmlAccess`: mesma lógica de acesso (compra direta OR
 *     pacote, grupos, `pricing==='free'`, admin) usada no viewer de PDF.
 *   - `fetchMaterialHtml`: baixa o HTML do Vercel Blob com cache curto em memória.
 *   - `buildWatermarkedHtml`: injeta uma watermark INDEXADA (rastreável por
 *     usuário) no HTML servido, no mesmo formato visível/forense do PDF, para
 *     a ferramenta de trace do admin (`/api/admin/materiais/trace`) reconhecer
 *     via `UID <últimos 8>`, `mail-<hash>` e `Licenciado para:`.
 *
 * O conteúdo NUNCA é servido direto do Blob ao cliente — sempre passa por aqui.
 */

import { Db, ObjectId } from 'mongodb'
import { TokenPayload } from './auth'
import { getDb } from './mongodb'
import { emailFingerprint } from './watermark-fingerprint'

export type MaterialHtmlAccessResult =
  | {
      ok: true
      db: Db
      material: any
      user: any
      materialId: string
      isAdmin: boolean
    }
  | {
      ok: false
      status: number
      error: string
    }

/**
 * Valida se o `session` pode abrir o leitor HTML de `materialId`.
 * Regras idênticas ao viewer de PDF: admin sempre; usuário com compra direta
 * OU compra de pacote que contenha o material; material gratuito liberado por
 * grupo. Visitantes (sem login) nunca têm acesso — não há prévia de HTML.
 */
export async function validateMaterialHtmlAccess(
  materialId: string,
  session: TokenPayload | null,
  options: { requireViewerEnabled?: boolean; requireHtml?: boolean } = {}
): Promise<MaterialHtmlAccessResult> {
  const requireViewerEnabled = options.requireViewerEnabled ?? true
  const requireHtml = options.requireHtml ?? true

  if (!materialId || !ObjectId.isValid(materialId)) {
    return { ok: false, status: 400, error: 'ID do material inválido' }
  }

  const db = await getDb()
  const isAdmin = session?.role === 'admin'
  const objectId = new ObjectId(materialId)

  const [user, material] = await Promise.all([
    session
      ? db.collection('users').findOne(
          { _id: new ObjectId(session.userId) },
          { projection: { name: 1, email: 1, accountType: 1, secondaryRole: 1, cpf: 1 } }
        )
      : Promise.resolve(null),
    db.collection('materials').findOne({
      _id: objectId,
      ...(isAdmin ? {} : { isHidden: false }),
    }),
  ])

  if (!material) {
    return { ok: false, status: 404, error: 'Material não encontrado' }
  }

  if (requireHtml && !material.htmlFile?.blobUrl) {
    return { ok: false, status: 422, error: 'Este material não possui HTML vinculado' }
  }

  if (requireViewerEnabled && material.htmlViewerEnabled !== true) {
    return { ok: false, status: 403, error: 'O leitor deste HTML está desabilitado' }
  }

  let hasAccess = isAdmin
  const userGroups: string[] = []

  if (!isAdmin && session) {
    if (user?.accountType) userGroups.push(user.accountType)
    if (user?.secondaryRole === 'monitor') userGroups.push('monitor')

    if (material.pricing === 'paid') {
      const baseFilter = { itemId: materialId, itemType: 'material', status: 'completed' }
      const emailRegex = session.email
        ? new RegExp(`^${session.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
        : null

      const byUserId = await db.collection('material_purchases').findOne({
        ...baseFilter,
        userId: session.userId,
      })

      if (byUserId) {
        hasAccess = true
      } else if (emailRegex) {
        const byEmail = await db.collection('material_purchases').findOne({
          ...baseFilter,
          userEmail: { $regex: emailRegex },
        })
        hasAccess = !!byEmail
      }

      if (!hasAccess) {
        const packages = await db.collection('material_packages')
          .find({ materialIds: materialId, isHidden: { $ne: true } })
          .project({ _id: 1 })
          .toArray()
        const packageIds = packages.map((pkg: any) => String(pkg._id))

        if (packageIds.length > 0) {
          const packageFilter = {
            itemType: 'package',
            itemId: { $in: packageIds },
            status: 'completed',
          }
          const packageByUserId = await db.collection('material_purchases').findOne({
            ...packageFilter,
            userId: session.userId,
          })

          if (packageByUserId) {
            hasAccess = true
          } else if (emailRegex) {
            const packageByEmail = await db.collection('material_purchases').findOne({
              ...packageFilter,
              userEmail: { $regex: emailRegex },
            })
            hasAccess = !!packageByEmail
          }
        }
      }
    } else {
      hasAccess =
        !material.allowedGroups?.length ||
        userGroups.some((group) => material.allowedGroups.includes(group))
    }
  }

  if (!hasAccess) {
    return { ok: false, status: 403, error: 'Você não tem acesso a este material' }
  }

  return { ok: true, db, material, user, materialId, isAdmin }
}

// ─── Cache curto do HTML baixado do Blob ─────────────────────────────────────

interface HtmlCacheEntry {
  html: string
  expiresAt: number
}
const htmlCache = new Map<string, HtmlCacheEntry>()
const HTML_CACHE_TTL_MS = 10 * 60 * 1000
const HTML_CACHE_MAX_ENTRIES = 12

export async function fetchMaterialHtml(blobUrl: string): Promise<string> {
  const now = Date.now()
  const cached = htmlCache.get(blobUrl)
  if (cached && cached.expiresAt > now) return cached.html
  if (cached) htmlCache.delete(blobUrl)

  const response = await fetch(blobUrl, {
    headers: {
      ...(process.env.BLOB_READ_WRITE_TOKEN
        ? { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
        : {}),
    },
  })
  if (!response.ok) {
    throw new Error(`Falha ao baixar HTML do blob: ${response.status}`)
  }
  const html = await response.text()

  // LRU simples: remove a entrada mais antiga quando passa do teto.
  if (htmlCache.size >= HTML_CACHE_MAX_ENTRIES) {
    const oldest = htmlCache.keys().next().value
    if (oldest) htmlCache.delete(oldest)
  }
  htmlCache.set(blobUrl, { html, expiresAt: now + HTML_CACHE_TTL_MS })
  return html
}

// ─── Watermark indexada ──────────────────────────────────────────────────────

export interface HtmlWatermarkIdentity {
  userName: string
  userId: string
  userEmail?: string
  materialId: string
  materialTitle?: string
  viewedAt: Date
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function envBoolean(name: string, fallback: boolean): boolean {
  const raw = process.env[name]
  if (raw === undefined) return fallback
  return raw === '1' || raw.toLowerCase() === 'true'
}

function envNumber(name: string, fallback: number, min: number, max: number): number {
  const raw = Number(process.env[name])
  if (!Number.isFinite(raw)) return fallback
  return Math.min(max, Math.max(min, raw))
}

/**
 * Constrói as linhas visíveis da marca — mesmo vocabulário do PDF, para o
 * parser de trace (`UID <suffix>`, `mail-<hash>`, `Licenciado para:`) resolver.
 */
export function buildWatermarkLines(identity: HtmlWatermarkIdentity): string[] {
  const uidSuffix = (identity.userId || '').slice(-8)
  const fingerprint = emailFingerprint(identity.userEmail)
  const stamp = identity.viewedAt.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  return [
    `Licenciado para: ${identity.userName || 'Usuário'}`,
    `UID ${uidSuffix} · ${fingerprint}`,
    stamp,
  ]
}

/**
 * Gera o data-URI de um tile SVG com as linhas de identidade rotacionadas.
 * Usado como `background-image` repetível — tiling nativo, GPU-friendly, sem lag.
 */
function buildWatermarkTile(lines: string[], opacity: number, angle: number, fontSize: number): string {
  const w = 420
  const h = 300
  const cx = w / 2
  const cy = h / 2
  const lineGap = fontSize * 1.5
  const startY = cy - ((lines.length - 1) * lineGap) / 2
  const texts = lines
    .map((line, i) => {
      const y = startY + i * lineGap
      const weight = i === 0 ? '700' : '500'
      return `<text x="${cx}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${i === 0 ? fontSize : fontSize - 2}" font-weight="${weight}" fill="#111827" text-anchor="middle" dominant-baseline="middle">${escapeHtml(line)}</text>`
    })
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><g transform="rotate(${angle} ${cx} ${cy})" opacity="${opacity}">${texts}</g></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/**
 * Injeta a watermark indexada + reforços forenses + CSS anti-cópia leve no
 * HTML servido. O overlay é `position:fixed pointer-events:none` com tiles
 * repetidos — sempre visível, sem interferir na interação com a experiência.
 */
export function buildWatermarkedHtml(rawHtml: string, identity: HtmlWatermarkIdentity): string {
  if (!envBoolean('HTML_VIEWER_WATERMARK_ENABLED', true)) {
    return rawHtml
  }

  const lines = buildWatermarkLines(identity)
  const opacity = envNumber('HTML_VIEWER_WATERMARK_OPACITY', 0.1, 0.02, 0.6)
  const angle = envNumber('HTML_VIEWER_WATERMARK_ANGLE', -30, -90, 90)
  const fontSize = envNumber('HTML_VIEWER_WATERMARK_FONT_SIZE', 15, 8, 40)
  const tile = buildWatermarkTile(lines, opacity, angle, fontSize)

  // Reforço forense invisível: comentário + meta com a identidade completa,
  // reconhecível pela ferramenta de trace mesmo se o overlay for removido.
  const uidSuffix = (identity.userId || '').slice(-8)
  const fingerprint = emailFingerprint(identity.userEmail)
  const forensic = `Licenciado para: ${identity.userName || 'Usuário'} | UID ${uidSuffix} | ${fingerprint} | Material ${identity.materialId} | ${identity.viewedAt.toISOString()}`

  const overlay = `
<style>
  #__gx_html_wm {
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    pointer-events: none;
    background-image: url("${tile}");
    background-repeat: repeat;
    background-position: center;
    user-select: none;
    -webkit-user-select: none;
  }
  @media print { html, body { display: none !important; } }
</style>
<div id="__gx_html_wm" aria-hidden="true" data-gx-license="${escapeHtml(forensic)}"></div>
<meta name="gx-license" content="${escapeHtml(forensic)}">
<!-- ${escapeHtml(forensic)} -->
`.trim()

  // Insere antes de </body> quando existir; senão, ao final do documento.
  const closingBody = /<\/body\s*>/i
  if (closingBody.test(rawHtml)) {
    return rawHtml.replace(closingBody, `${overlay}\n</body>`)
  }
  return `${rawHtml}\n${overlay}`
}

/**
 * Registra a abertura do leitor para rastreabilidade (paridade com
 * `material_pdf_viewer_logs`). Fire-and-forget — nunca bloqueia a resposta.
 */
export async function logHtmlViewerAccess(
  db: Db,
  entry: {
    userId: string
    userName?: string
    userEmail?: string
    materialId: string
    materialTitle?: string
    ip?: string
    userAgent?: string
  }
): Promise<void> {
  try {
    await db.collection('material_html_viewer_logs').insertOne({
      ...entry,
      ts: new Date(),
    })
  } catch (e) {
    console.warn('[html-viewer] Falha ao registrar log de acesso:', e)
  }
}
