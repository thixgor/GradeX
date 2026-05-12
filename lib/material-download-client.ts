'use client'

function getContentDispositionFilename(disposition: string | null): string | null {
  if (!disposition) return null

  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  if (encoded) {
    try {
      return decodeURIComponent(encoded)
    } catch {
      return encoded
    }
  }

  return disposition.match(/filename="?([^";]+)"?/i)?.[1] || null
}

export function shouldUseNativePdfDownload(): boolean {
  if (typeof navigator === 'undefined') return false

  const ua = navigator.userAgent
  const isIOS =
    /iP(ad|hone|od)/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isSafari =
    /Safari/i.test(ua) &&
    !/(Chrome|CriOS|FxiOS|Edg|EdgiOS|OPR|OPiOS|Android)/i.test(ua)

  return isIOS || isSafari
}

export function triggerNativePdfDownload(materialId: string): void {
  const href = `/api/materiais/download?materialId=${encodeURIComponent(materialId)}`
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = ''
  anchor.rel = 'noopener'
  anchor.target = '_self'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

export async function downloadPdfResponse(response: Response, fallbackFilename: string): Promise<void> {
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.download =
    getContentDispositionFilename(response.headers.get('Content-Disposition')) || fallbackFilename
  anchor.href = url
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()

  window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
}
