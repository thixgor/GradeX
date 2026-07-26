// Fullscreen API com os tropeços reais de navegador tratados num lugar só.
//
// Dois problemas motivaram este arquivo:
//
// 1. O Safari do iOS NÃO implementa `Element.requestFullscreen` — só `<video>`
//    entra em tela cheia. Num `<div>` o método é `undefined`. O código que
//    existia fazia `el.requestFullscreen().catch(...)` (ou
//    `el.requestFullscreen?.().catch(...)`, que não ajuda: o `?.` cobre a
//    CHAMADA, mas o `.catch` continua sendo lido de `undefined`), então o
//    clique estourava um TypeError e o botão simplesmente não fazia nada.
//
// 2. Navegadores mais antigos (e WebKit em geral) só expõem a variante com
//    prefixo `webkit`.
//
// Quem chama deve tratar tela cheia como BEST-EFFORT: o estado de verdade fica
// no React e, quando `requestAppFullscreen` devolve false, a UI cai para um
// modo imersivo em CSS. É o padrão que a tela de estudo de flashcards já usa.

type FullscreenCapableElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
  webkitRequestFullScreen?: () => Promise<void> | void
}

type FullscreenCapableDocument = Document & {
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void> | void
}

/** Elemento em tela cheia agora, considerando o prefixo webkit. */
export function getFullscreenElement(): Element | null {
  if (typeof document === 'undefined') return null
  const doc = document as FullscreenCapableDocument
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null
}

/** A API existe neste navegador para elementos comuns? (false no iOS) */
export function isFullscreenSupported(element?: HTMLElement | null): boolean {
  if (typeof document === 'undefined') return false
  const target = (element || document.documentElement) as FullscreenCapableElement
  return typeof target.requestFullscreen === 'function'
    || typeof target.webkitRequestFullscreen === 'function'
    || typeof target.webkitRequestFullScreen === 'function'
}

/**
 * Tenta entrar em tela cheia. Devolve `true` se o navegador aceitou.
 * Nunca lança — se a API não existe ou o pedido é negado, devolve `false` e
 * cabe a quem chamou aplicar o fallback.
 */
export async function requestAppFullscreen(element: HTMLElement | null): Promise<boolean> {
  if (!element) return false
  const target = element as FullscreenCapableElement
  const request = target.requestFullscreen
    || target.webkitRequestFullscreen
    || target.webkitRequestFullScreen
  if (typeof request !== 'function') return false
  try {
    await request.call(target)
    return true
  } catch {
    return false
  }
}

/** Sai da tela cheia nativa, se houver. Nunca lança. */
export async function exitAppFullscreen(): Promise<void> {
  if (typeof document === 'undefined') return
  if (!getFullscreenElement()) return
  const doc = document as FullscreenCapableDocument
  const exit = doc.exitFullscreen || doc.webkitExitFullscreen
  if (typeof exit !== 'function') return
  try {
    await exit.call(doc)
  } catch {
    // Sair da tela cheia falhando não é acionável para o usuário.
  }
}

/**
 * Escuta entrada/saída de tela cheia (inclusive quando o usuário sai pelo Esc
 * ou pelo gesto do sistema). Devolve a função de limpeza.
 */
export function onFullscreenChange(callback: (isFullscreen: boolean) => void): () => void {
  if (typeof document === 'undefined') return () => {}
  const handler = () => callback(Boolean(getFullscreenElement()))
  document.addEventListener('fullscreenchange', handler)
  document.addEventListener('webkitfullscreenchange', handler)
  return () => {
    document.removeEventListener('fullscreenchange', handler)
    document.removeEventListener('webkitfullscreenchange', handler)
  }
}
