import { NextRequest, NextResponse } from 'next/server'
import { getSession, TokenPayload } from './auth'
import { getDb } from './mongodb'
import { User } from './types'
import { ObjectId } from 'mongodb'
import crypto from 'crypto'

// ==========================================
// VALIDACAO DE OBJECTID (NoSQL Injection Protection)
// ==========================================

export function isValidObjectId(id: string): boolean {
  if (!id || typeof id !== 'string') return false
  return ObjectId.isValid(id) && new ObjectId(id).toString() === id
}

export function validateObjectId(id: string): { valid: boolean; error?: string } {
  if (!id) {
    return { valid: false, error: 'ID não fornecido' }
  }
  if (!isValidObjectId(id)) {
    return { valid: false, error: 'ID inválido' }
  }
  return { valid: true }
}

// ==========================================
// XSS SANITIZATION
// ==========================================

// Caracteres HTML perigosos
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
}

// Sanitiza string contra XSS
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return ''
  return input.replace(/[&<>"'`=/]/g, char => HTML_ENTITIES[char] || char)
}

// Sanitiza objeto recursivamente
export function sanitizeObject<T extends Record<string, any>>(obj: T, fieldsToSanitize?: string[]): T {
  if (!obj || typeof obj !== 'object') return obj

  const result: any = Array.isArray(obj) ? [] : {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Se fieldsToSanitize for especificado, só sanitiza esses campos
      if (!fieldsToSanitize || fieldsToSanitize.includes(key)) {
        result[key] = sanitizeHtml(value)
      } else {
        result[key] = value
      }
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value, fieldsToSanitize)
    } else {
      result[key] = value
    }
  }

  return result
}

// Remove tags HTML completamente
export function stripHtml(input: string): string {
  if (!input || typeof input !== 'string') return ''
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')    // Remove styles
    .replace(/<[^>]+>/g, '')                                            // Remove todas as tags
    .replace(/\s+/g, ' ')                                               // Normaliza espaços
    .trim()
}

// ==========================================
// CSRF PROTECTION
// ==========================================

const CSRF_TOKEN_LENGTH = 32
const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'

// Gera token CSRF
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
}

// Verifica token CSRF
export function verifyCsrfToken(request: NextRequest): { valid: boolean; error?: string } {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value
  const headerToken = request.headers.get(CSRF_HEADER_NAME)

  if (!cookieToken || !headerToken) {
    return { valid: false, error: 'Token CSRF ausente' }
  }

  // Comparação segura contra timing attacks
  if (cookieToken.length !== headerToken.length) {
    return { valid: false, error: 'Token CSRF inválido' }
  }

  const cookieBuffer = Buffer.from(cookieToken)
  const headerBuffer = Buffer.from(headerToken)

  if (!crypto.timingSafeEqual(cookieBuffer, headerBuffer)) {
    return { valid: false, error: 'Token CSRF inválido' }
  }

  return { valid: true }
}

// Cria response com cookie CSRF
export function setCsrfCookie(response: NextResponse, token?: string): NextResponse {
  const csrfToken = token || generateCsrfToken()
  response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false, // Precisa ser acessível pelo JS para enviar no header
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 // 24 horas
  })
  return response
}

// ==========================================
// INPUT VALIDATION HELPERS
// ==========================================

// Valida e limita tamanho de string
export function validateStringInput(
  input: any,
  fieldName: string,
  options: { minLength?: number; maxLength?: number; required?: boolean } = {}
): { valid: boolean; value?: string; error?: string } {
  const { minLength = 0, maxLength = 10000, required = false } = options

  if (input === undefined || input === null || input === '') {
    if (required) {
      return { valid: false, error: `${fieldName} é obrigatório` }
    }
    return { valid: true, value: '' }
  }

  if (typeof input !== 'string') {
    return { valid: false, error: `${fieldName} deve ser texto` }
  }

  const trimmed = input.trim()

  if (trimmed.length < minLength) {
    return { valid: false, error: `${fieldName} deve ter no mínimo ${minLength} caracteres` }
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} deve ter no máximo ${maxLength} caracteres` }
  }

  return { valid: true, value: trimmed }
}

// Valida email
export function validateEmail(email: any): { valid: boolean; value?: string; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email é obrigatório' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const trimmed = email.trim().toLowerCase()

  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Email inválido' }
  }

  if (trimmed.length > 254) {
    return { valid: false, error: 'Email muito longo' }
  }

  return { valid: true, value: trimmed }
}

// ==========================================
// RATE LIMITING
// ==========================================

interface RateLimitConfig {
  limit: number       // Numero maximo de requests
  windowMs: number    // Janela de tempo em milissegundos
}

// Configuracoes padrao de rate limit por tipo de endpoint
export const RATE_LIMITS = {
  // Endpoints sensíveis (login, registro, reset senha)
  AUTH: { limit: 5, windowMs: 15 * 60 * 1000 },           // 5 requests por 15 min

  // Endpoints de escrita (POST, PUT, PATCH, DELETE)
  WRITE: { limit: 30, windowMs: 60 * 1000 },              // 30 requests por minuto

  // Endpoints de leitura (GET)
  READ: { limit: 100, windowMs: 60 * 1000 },              // 100 requests por minuto

  // Uploads
  UPLOAD: { limit: 10, windowMs: 60 * 1000 },             // 10 uploads por minuto

  // Endpoints de IA (geracao de questoes, flashcards, etc)
  AI: { limit: 5, windowMs: 60 * 1000 },                  // 5 requests por minuto

  // Endpoints administrativos
  ADMIN: { limit: 60, windowMs: 60 * 1000 },              // 60 requests por minuto

  // Endpoints publicos (captcha, etc)
  PUBLIC: { limit: 20, windowMs: 60 * 1000 },             // 20 requests por minuto
} as const

export type RateLimitType = keyof typeof RATE_LIMITS

// Cache em memoria para rate limit (mais performatico que MongoDB para rate limit)
const rateLimitCache = new Map<string, { count: number; resetAt: number }>()

// Limpa entradas expiradas periodicamente
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitCache.entries()) {
    if (value.resetAt < now) {
      rateLimitCache.delete(key)
    }
  }
}, 60 * 1000) // Limpa a cada minuto

function getClientIp(request: NextRequest): string {
  // Ordem de prioridade para headers de IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback - nao ideal mas necessario
  return 'unknown'
}

export function checkRateLimitSync(
  ip: string,
  endpoint: string,
  config: RateLimitConfig
): { success: boolean; remaining: number; retryAfterMs?: number } {
  const key = `${ip}:${endpoint}`
  const now = Date.now()

  const record = rateLimitCache.get(key)

  if (!record || record.resetAt < now) {
    // Nova janela ou janela expirada
    rateLimitCache.set(key, { count: 1, resetAt: now + config.windowMs })
    return { success: true, remaining: config.limit - 1 }
  }

  if (record.count >= config.limit) {
    return {
      success: false,
      remaining: 0,
      retryAfterMs: record.resetAt - now
    }
  }

  record.count++
  return { success: true, remaining: config.limit - record.count }
}

// ==========================================
// AUTHORIZATION
// ==========================================

export type Role = 'admin' | 'user'
export type SecondaryRole = 'monitor' | undefined

interface AuthConfig {
  requireAuth?: boolean           // Requer autenticacao (padrao: true)
  allowedRoles?: Role[]           // Roles permitidos (padrao: todos autenticados)
  allowSecondaryRoles?: SecondaryRole[]  // Secondary roles permitidos
  requireEmailVerified?: boolean  // Requer email verificado (padrao: false)
  checkOwnership?: boolean        // Verificar ownership do recurso
}

interface AuthResult {
  success: boolean
  session?: TokenPayload
  user?: User
  error?: string
  status?: number
}

export async function authorize(
  request: NextRequest,
  config: AuthConfig = {}
): Promise<AuthResult> {
  const {
    requireAuth = true,
    allowedRoles,
    allowSecondaryRoles,
    requireEmailVerified = false
  } = config

  // Se nao requer auth, retorna sucesso
  if (!requireAuth) {
    return { success: true }
  }

  // Verifica sessao
  const session = await getSession()

  if (!session) {
    return {
      success: false,
      error: 'Nao autenticado',
      status: 401
    }
  }

  // Verifica email verificado
  if (requireEmailVerified && !session.emailVerified) {
    return {
      success: false,
      session,
      error: 'Email nao verificado',
      status: 403
    }
  }

  // Verifica role
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(session.role)) {
      // Verifica se tem secondary role permitido
      if (allowSecondaryRoles && allowSecondaryRoles.length > 0) {
        const db = await getDb()
        const user = await db.collection<User>('users').findOne({
          _id: new ObjectId(session.userId)
        })

        if (user && user.secondaryRole && allowSecondaryRoles.includes(user.secondaryRole)) {
          return { success: true, session, user }
        }
      }

      return {
        success: false,
        session,
        error: 'Sem permissao',
        status: 403
      }
    }
  }

  return { success: true, session }
}

// ==========================================
// API WRAPPER COMPLETO
// ==========================================

interface ApiSecurityConfig {
  rateLimit?: RateLimitType | RateLimitConfig
  auth?: AuthConfig
}

interface SecureApiResult {
  success: boolean
  session?: TokenPayload
  user?: User
  ip: string
  errorResponse?: NextResponse
}

export async function secureApiEndpoint(
  request: NextRequest,
  config: ApiSecurityConfig = {}
): Promise<SecureApiResult> {
  const ip = getClientIp(request)
  const endpoint = new URL(request.url).pathname

  // 1. Verificar rate limit
  if (config.rateLimit) {
    const rateLimitConfig = typeof config.rateLimit === 'string'
      ? RATE_LIMITS[config.rateLimit]
      : config.rateLimit

    const rateLimitResult = checkRateLimitSync(ip, endpoint, rateLimitConfig)

    if (!rateLimitResult.success) {
      return {
        success: false,
        ip,
        errorResponse: NextResponse.json(
          {
            error: 'Muitas requisicoes. Tente novamente mais tarde.',
            retryAfterSeconds: Math.ceil((rateLimitResult.retryAfterMs || 0) / 1000)
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil((rateLimitResult.retryAfterMs || 0) / 1000)),
              'X-RateLimit-Remaining': '0'
            }
          }
        )
      }
    }
  }

  // 2. Verificar autorizacao
  if (config.auth) {
    const authResult = await authorize(request, config.auth)

    if (!authResult.success) {
      return {
        success: false,
        ip,
        errorResponse: NextResponse.json(
          { error: authResult.error },
          { status: authResult.status || 403 }
        )
      }
    }

    return {
      success: true,
      session: authResult.session,
      user: authResult.user,
      ip
    }
  }

  return { success: true, ip }
}

// ==========================================
// VERIFICACAO DE OWNERSHIP
// ==========================================

export async function verifyOwnership(
  collection: string,
  resourceId: string,
  userId: string,
  ownerField: string = 'userId'
): Promise<{ owned: boolean; resource?: any }> {
  try {
    // Validar ObjectId primeiro
    if (!isValidObjectId(resourceId)) {
      return { owned: false }
    }

    const db = await getDb()
    const resource = await db.collection(collection).findOne({
      _id: new ObjectId(resourceId)
    })

    if (!resource) {
      return { owned: false }
    }

    const ownerId = resource[ownerField]
    const owned = ownerId === userId || ownerId?.toString() === userId

    return { owned, resource }
  } catch {
    return { owned: false }
  }
}

// Verifica ownership com suporte a admin e monitor
export async function verifyResourceAccess(
  collection: string,
  resourceId: string,
  session: TokenPayload,
  options: {
    ownerField?: string
    allowAdmin?: boolean
    allowMonitor?: boolean
    monitorOwnerField?: string // Campo que indica quem criou (para monitores)
  } = {}
): Promise<{ allowed: boolean; resource?: any; reason?: string }> {
  const {
    ownerField = 'userId',
    allowAdmin = true,
    allowMonitor = false,
    monitorOwnerField = 'criadoPor'
  } = options

  // Validar ObjectId primeiro
  if (!isValidObjectId(resourceId)) {
    return { allowed: false, reason: 'ID inválido' }
  }

  try {
    const db = await getDb()
    const resource = await db.collection(collection).findOne({
      _id: new ObjectId(resourceId)
    })

    if (!resource) {
      return { allowed: false, reason: 'Recurso não encontrado' }
    }

    // Admin sempre tem acesso (se permitido)
    if (allowAdmin && session.role === 'admin') {
      return { allowed: true, resource }
    }

    // Verifica se é o dono
    const ownerId = resource[ownerField]
    if (ownerId === session.userId || ownerId?.toString() === session.userId) {
      return { allowed: true, resource }
    }

    // Verifica se é monitor e criou o recurso
    if (allowMonitor) {
      const user = await db.collection<User>('users').findOne({
        _id: new ObjectId(session.userId)
      })

      if (user?.secondaryRole === 'monitor') {
        const creatorId = resource[monitorOwnerField]
        if (creatorId === session.userId || creatorId?.toString() === session.userId) {
          return { allowed: true, resource }
        }
      }
    }

    return { allowed: false, reason: 'Sem permissão para acessar este recurso' }
  } catch {
    return { allowed: false, reason: 'Erro ao verificar permissão' }
  }
}

// ==========================================
// PROTECAO CONTRA ADMIN DELETANDO ADMIN
// ==========================================

export async function canAdminModifyUser(
  actingAdminId: string,
  targetUserId: string,
  action: 'delete' | 'ban' | 'update'
): Promise<{ allowed: boolean; reason?: string }> {
  // Nao pode modificar a si mesmo para delete/ban
  if (actingAdminId === targetUserId && (action === 'delete' || action === 'ban')) {
    return {
      allowed: false,
      reason: action === 'delete'
        ? 'Voce nao pode deletar sua propria conta'
        : 'Voce nao pode banir sua propria conta'
    }
  }

  // Verificar se o target e admin
  const db = await getDb()
  const targetUser = await db.collection<User>('users').findOne({
    _id: new ObjectId(targetUserId)
  })

  if (!targetUser) {
    return { allowed: false, reason: 'Usuario nao encontrado' }
  }

  // Nao permite deletar/banir outro admin
  if (targetUser.role === 'admin' && (action === 'delete' || action === 'ban')) {
    return {
      allowed: false,
      reason: action === 'delete'
        ? 'Nao e permitido deletar outros administradores'
        : 'Nao e permitido banir outros administradores'
    }
  }

  return { allowed: true }
}

// ==========================================
// VALIDACAO DE INPUT
// ==========================================

// Lista de extensoes de arquivo permitidas para upload
export const ALLOWED_FILE_EXTENSIONS: Record<'images' | 'documents' | 'all', readonly string[]> = {
  images: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  documents: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'],
  all: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt']
} as const

// Lista de MIME types permitidos
export const ALLOWED_MIME_TYPES: Record<'images' | 'documents' | 'all', readonly string[]> = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ],
  all: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ]
} as const

// Tamanho maximo de arquivo (em bytes)
export const MAX_FILE_SIZES = {
  image: 5 * 1024 * 1024,        // 5MB
  document: 10 * 1024 * 1024,    // 10MB
  default: 5 * 1024 * 1024       // 5MB padrao
} as const

interface FileValidationResult {
  valid: boolean
  error?: string
  sanitizedName?: string
}

export function validateUploadedFile(
  file: File,
  allowedTypes: 'images' | 'documents' | 'all' = 'all',
  maxSize?: number
): FileValidationResult {
  // Verificar tamanho
  const sizeLimit = maxSize || (allowedTypes === 'images' ? MAX_FILE_SIZES.image : MAX_FILE_SIZES.default)
  if (file.size > sizeLimit) {
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho maximo: ${Math.round(sizeLimit / 1024 / 1024)}MB`
    }
  }

  // Verificar MIME type
  const allowedMimes = ALLOWED_MIME_TYPES[allowedTypes]
  if (!allowedMimes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo nao permitido: ${file.type}`
    }
  }

  // Verificar extensao
  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  const allowedExtensions = ALLOWED_FILE_EXTENSIONS[allowedTypes]
  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `Extensao de arquivo nao permitida: ${extension}`
    }
  }

  // Sanitizar nome do arquivo
  // Remove caracteres perigosos e mantem apenas alfanumericos, hifens e underscores
  const baseName = file.name.replace(/\.[^/.]+$/, '') // Remove extensao
  const sanitizedBase = baseName
    .replace(/[^a-zA-Z0-9_-]/g, '_')  // Substitui caracteres especiais por _
    .replace(/_+/g, '_')              // Remove underscores duplicados
    .replace(/^_|_$/g, '')            // Remove underscores no inicio/fim
    .substring(0, 100)                // Limita tamanho

  const sanitizedName = sanitizedBase ? `${sanitizedBase}${extension}` : `file${extension}`

  return {
    valid: true,
    sanitizedName
  }
}

// Verificar se o conteudo do arquivo corresponde ao MIME type declarado
// (Magic bytes validation - proteção contra spoofing de extensao)
export async function validateFileMagicBytes(buffer: ArrayBuffer): Promise<{ valid: boolean; detectedType?: string }> {
  const bytes = new Uint8Array(buffer.slice(0, 12))

  // Assinaturas conhecidas (magic bytes)
  const signatures: Record<string, number[][]> = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF
    'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  }

  for (const [mimeType, sigs] of Object.entries(signatures)) {
    for (const sig of sigs) {
      let match = true
      for (let i = 0; i < sig.length; i++) {
        if (bytes[i] !== sig[i]) {
          match = false
          break
        }
      }
      if (match) {
        return { valid: true, detectedType: mimeType }
      }
    }
  }

  // Para outros tipos, assumimos valido (ex: documentos Office tem estrutura complexa)
  return { valid: true }
}
