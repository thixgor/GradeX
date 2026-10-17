'use client'

/** Copia o link (endereço completo) e diz se deu; sem área de transferência, abre para copiar à mão. */
export async function copiarLink(caminho: string): Promise<boolean> {
  const url = new URL(caminho, window.location.origin).toString()
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    window.prompt('Copie o link da aula:', url)
    return false
  }
}
