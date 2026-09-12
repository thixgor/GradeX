'use client'

/**
 * Envio da imagem do anúncio a partir do navegador.
 *
 * Concentra num só lugar as regras de tipo, tamanho e nome de arquivo que a
 * rota `/api/admin/anuncios/upload` aplica do outro lado — validar aqui evita
 * gastar um round-trip para descobrir que o arquivo tem 30 MB.
 */

import { upload } from '@vercel/blob/client'

export const ANUNCIO_IMAGE_MAX_BYTES = 8 * 1024 * 1024
export const ANUNCIO_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/avif'

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
])

export function validateAnuncioImage(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'Selecione um arquivo de imagem'
  if (!ALLOWED_TYPES.has(file.type)) return 'Formato não suportado (use JPG, PNG, WEBP, GIF ou AVIF)'
  if (file.size > ANUNCIO_IMAGE_MAX_BYTES) return 'Imagem muito grande (máximo de 8 MB)'
  return null
}

function safeExtension(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName
  const fromType = file.type.split('/')[1]?.toLowerCase()
  if (fromType && /^[a-z0-9]{2,5}$/.test(fromType)) return fromType
  return 'jpg'
}

/**
 * Envia o arquivo e devolve a URL pública pronta para o anúncio.
 *
 * `onProgress` recebe a porcentagem enviada — uma arte de 8 MB em conexão de
 * celular leva segundos, e sem esse retorno a tela parece travada.
 */
export async function uploadAnuncioImage(
  file: File,
  onProgress?: (percentual: number) => void,
): Promise<string> {
  const invalid = validateAnuncioImage(file)
  if (invalid) throw new Error(invalid)

  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  const pathname = `anuncios/${Date.now()}-${id}.${safeExtension(file)}`

  try {
    const blob = await upload(pathname, file, {
      access: 'public',
      contentType: file.type,
      handleUploadUrl: '/api/admin/anuncios/upload',
      onUploadProgress: onProgress
        ? ({ percentage }) => onProgress(Math.round(percentage))
        : undefined,
    })
    return blob.url
  } catch (error) {
    // Quando a API do Blob recusa o envio ela responde sem cabeçalho de CORS e
    // o navegador troca a mensagem real por "blocked by CORS policy", que não
    // ajuda ninguém a resolver. Vale mais dizer o que fazer.
    const raw = error instanceof Error ? error.message : ''
    if (!raw || /failed to fetch|networkerror|load failed|cors/i.test(raw)) {
      throw new Error(
        'O servidor de imagens recusou o envio. Recarregue a página e tente de novo; se persistir, confira o token do Blob de mídia.',
      )
    }
    throw new Error(raw)
  }
}
