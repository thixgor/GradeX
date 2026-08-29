'use client'

/**
 * Envio de imagens de cartão a partir do navegador.
 *
 * Centraliza o caminho do Vercel Blob (`/api/flashcards/upload`) para que o
 * seletor de imagem de um cartão e o envio em lote da importação usem as
 * mesmas regras de tipo, tamanho e nome de arquivo.
 */

import { upload } from '@vercel/blob/client'

export const FLASHCARD_IMAGE_MAX_BYTES = 8 * 1024 * 1024
export const FLASHCARD_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/avif'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])

export function validateFlashcardImage(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'Selecione uma imagem'
  if (!ALLOWED_TYPES.has(file.type)) return 'Formato não suportado (use JPG, PNG, WEBP, GIF ou AVIF)'
  if (file.size > FLASHCARD_IMAGE_MAX_BYTES) return 'Imagem muito grande (máx. 8 MB)'
  return null
}

function safeExtension(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName
  const fromType = file.type.split('/')[1]?.toLowerCase()
  if (fromType && /^[a-z0-9]{2,5}$/.test(fromType)) return fromType
  return 'jpg'
}

/** Envia um arquivo e devolve a URL pública já pronta para o cartão. */
export async function uploadFlashcardImage(file: File): Promise<string> {
  const invalid = validateFlashcardImage(file)
  if (invalid) throw new Error(invalid)

  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
  const pathname = `flashcards/${Date.now()}-${id}.${safeExtension(file)}`

  const blob = await upload(pathname, file, {
    access: 'public',
    contentType: file.type,
    handleUploadUrl: '/api/flashcards/upload',
  })

  return blob.url
}
