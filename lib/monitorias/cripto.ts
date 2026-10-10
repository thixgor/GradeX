import 'server-only'

/**
 * Cifra da chave PIX do monitor (AES-256-GCM).
 *
 * Por que cifrar: quem rouba um dump do banco não deve sair com as chaves PIX
 * de todo mundo — nem conseguir TROCAR a chave de alguém e receber os
 * repasses dele (o GCM tem etiqueta de autenticação: qualquer byte mexido faz
 * a decifragem falhar em vez de devolver lixo).
 *
 * A chave vem de `MONITORIAS_PIX_SECRET` (32 bytes em base64). O HMAC permite
 * comparar chaves (ex.: "esta chave já é sua") sem decifrar nada.
 */

import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from 'crypto'
import { onlyCpfDigits } from '@/lib/cpf'
import type { TipoChavePix } from './tipos'

function segredo(): Buffer {
  const bruto = process.env.MONITORIAS_PIX_SECRET || ''
  const chave = Buffer.from(bruto, 'base64')
  if (chave.length !== 32) {
    throw new Error('MONITORIAS_PIX_SECRET ausente ou inválido (precisa de 32 bytes em base64).')
  }
  return chave
}

export function segredoConfigurado(): boolean {
  try {
    segredo()
    return true
  } catch {
    return false
  }
}

export function cifrar(texto: string): string {
  const iv = randomBytes(12)
  const cifra = createCipheriv('aes-256-gcm', segredo(), iv)
  const corpo = Buffer.concat([cifra.update(texto, 'utf8'), cifra.final()])
  const etiqueta = cifra.getAuthTag()
  return [iv, etiqueta, corpo].map((b) => b.toString('base64url')).join('.')
}

export function decifrar(pacote: string): string {
  const [iv, etiqueta, corpo] = String(pacote || '').split('.').map((p) => Buffer.from(p, 'base64url'))
  if (!iv || !etiqueta || !corpo || iv.length !== 12 || etiqueta.length !== 16) {
    throw new Error('Pacote cifrado inválido')
  }
  const decifra = createDecipheriv('aes-256-gcm', segredo(), iv)
  decifra.setAuthTag(etiqueta)
  return Buffer.concat([decifra.update(corpo), decifra.final()]).toString('utf8')
}

export function hmac(texto: string): string {
  return createHmac('sha256', segredo()).update(texto).digest('base64url')
}

export function hmacIguais(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

// ─── Chave PIX: normalização e validação ────────────────────────────────

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Devolve a chave no formato canônico do DICT, ou null se inválida. */
export function normalizarChavePix(tipo: TipoChavePix, valor: string): string | null {
  const texto = String(valor || '').trim()
  if (tipo === 'cpf') {
    const cpf = onlyCpfDigits(texto)
    return cpf.length === 11 ? cpf : null
  }
  if (tipo === 'email') {
    const email = texto.toLowerCase()
    return EMAIL.test(email) && email.length <= 77 ? email : null
  }
  if (tipo === 'telefone') {
    let digitos = texto.replace(/\D/g, '')
    if (digitos.startsWith('55') && digitos.length >= 12) digitos = digitos.slice(2)
    return /^\d{2}9?\d{8}$/.test(digitos) ? `+55${digitos}` : null
  }
  if (tipo === 'aleatoria') return UUID.test(texto) ? texto.toLowerCase() : null
  return null
}

export function mascararChavePix(tipo: TipoChavePix, chave: string): string {
  if (tipo === 'cpf') return `***.${chave.slice(3, 6)}.${chave.slice(6, 9)}-**`
  if (tipo === 'email') {
    const [usuario, dominio] = chave.split('@')
    return `${usuario.slice(0, 2)}***@${dominio}`
  }
  if (tipo === 'telefone') return `+55 (${chave.slice(3, 5)}) *****-${chave.slice(-4)}`
  return `${chave.slice(0, 4)}…${chave.slice(-4)}`
}

/**
 * Pasta da foto do monitor no Blob público: um apelido opaco da conta (HMAC),
 * nunca o userId — a URL da foto aparece na vitrine para qualquer visitante.
 */
export function pastaDaFoto(userId: string): string {
  const chave = process.env.JWT_SECRET || process.env.MONITORIAS_PIX_SECRET || 'monitorias'
  return `monitorias/fotos/${createHmac('sha256', chave).update(`foto:${userId}`).digest('hex').slice(0, 24)}/`
}

/** Host do store de imagens configurado (do token `vercel_blob_rw_<store>_…`). */
export function hostDoBlobDeImagens(): string | null {
  const m = /^vercel_blob_rw_([A-Za-z0-9]+)_/.exec(process.env.BLOB_READ_WRITE_TOKEN_MIDIA || '')
  return m ? `${m[1].toLowerCase()}.public.blob.vercel-storage.com` : null
}
