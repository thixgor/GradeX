'use client'

/**
 * Falha de transferência do PDF, já classificada.
 *
 * A distinção importa porque a mensagem antiga — "Erro de conexão. Verifique
 * sua internet" — era exibida também quando o problema estava do nosso lado: o
 * servidor cortava o corpo da resposta no meio (materiais grandes, ver
 * `lib/pdf-response.ts`) e o aluno ia reiniciar o roteador atrás de um defeito
 * que não era dele.
 */
export type PdfDownloadFailureKind =
  /** O corpo da resposta chegou incompleto ou vazio. */
  | 'interrompido'
  /** O navegador está sem rede. */
  | 'offline'

export class PdfDownloadTransferError extends Error {
  readonly kind: PdfDownloadFailureKind

  constructor(kind: PdfDownloadFailureKind, message: string) {
    super(message)
    this.name = 'PdfDownloadTransferError'
    this.kind = kind
  }
}

const MENSAGENS: Record<PdfDownloadFailureKind, string> = {
  interrompido:
    'O envio do arquivo foi interrompido antes do fim. Tente novamente — se repetir, abra o material no visualizador protegido.',
  offline:
    'Você está sem conexão com a internet. Reconecte e tente novamente.',
}

/**
 * Mensagem para o usuário a partir do erro que derrubou o download.
 *
 * `fetch` rejeita com um `TypeError` genérico tanto quando o aparelho perdeu a
 * rede quanto quando o servidor fechou a conexão no meio do corpo. Só o
 * `navigator.onLine` separa os dois casos com alguma honestidade: estando
 * online, o problema não é a internet do aluno e não faz sentido mandá-lo
 * conferi-la.
 */
export function describePdfDownloadFailure(error: unknown): string {
  if (error instanceof PdfDownloadTransferError) return MENSAGENS[error.kind]

  const offline = typeof navigator !== 'undefined' && navigator.onLine === false
  return offline ? MENSAGENS.offline : MENSAGENS.interrompido
}

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

/**
 * Confere se o corpo chegou inteiro antes de salvar o arquivo.
 *
 * Uma resposta cortada no meio nem sempre faz o `fetch` rejeitar: dependendo de
 * onde o corte acontece, o `blob()` resolve com o pedaço que chegou e o aluno
 * salva um PDF que não abre. Como a rota envia `Content-Length`, dá para
 * comparar. A comparação é só por falta (`<`): resposta comprimida pelo
 * caminho traz o tamanho do conteúdo comprimido no cabeçalho e um corpo maior
 * depois de descomprimido — o que não é truncamento.
 */
function assertPdfBlobIsComplete(blob: Blob, response: Response): void {
  if (blob.size === 0) {
    throw new PdfDownloadTransferError('interrompido', 'PDF veio vazio')
  }

  const declared = Number(response.headers.get('Content-Length'))
  if (Number.isFinite(declared) && declared > 0 && blob.size < declared) {
    throw new PdfDownloadTransferError(
      'interrompido',
      `PDF veio incompleto (${blob.size} de ${declared} bytes)`
    )
  }
}

export async function downloadPdfResponse(response: Response, fallbackFilename: string): Promise<void> {
  const blob = await response.blob()
  assertPdfBlobIsComplete(blob, response)

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
