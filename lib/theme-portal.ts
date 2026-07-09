/**
 * Cinematic theme portal — full-screen GPU overlay.
 * Theme flips only when the screen is fully covered (instant class swap),
 * so we never animate every node. One layer, transform + opacity only.
 */

type ThemeName = 'light' | 'dark'

let busy = false

function reduceMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function runThemePortal(
  next: ThemeName,
  origin: { x: number; y: number },
  apply: () => void
): void {
  if (typeof document === 'undefined') {
    apply()
    return
  }

  if (busy || reduceMotion()) {
    apply()
    return
  }

  busy = true
  const root = document.documentElement
  const toDark = next === 'dark'

  // Origin as % for CSS
  const ox = Math.round((origin.x / window.innerWidth) * 1000) / 10
  const oy = Math.round((origin.y / window.innerHeight) * 1000) / 10
  root.style.setProperty('--portal-ox', `${ox}%`)
  root.style.setProperty('--portal-oy', `${oy}%`)

  // Build overlay once
  const host = document.createElement('div')
  host.className = 'theme-portal'
  host.setAttribute('data-to', toDark ? 'dark' : 'light')
  host.setAttribute('aria-hidden', 'true')
  host.innerHTML = `
    <div class="theme-portal__veil"></div>
    <div class="theme-portal__scene">
      <div class="theme-portal__ring theme-portal__ring--outer"></div>
      <div class="theme-portal__ring theme-portal__ring--mid"></div>
      <div class="theme-portal__core">
        <div class="theme-portal__face theme-portal__face--a"></div>
        <div class="theme-portal__face theme-portal__face--b"></div>
      </div>
      <div class="theme-portal__spark s1"></div>
      <div class="theme-portal__spark s2"></div>
      <div class="theme-portal__spark s3"></div>
      <div class="theme-portal__spark s4"></div>
    </div>
  `
  document.body.appendChild(host)

  // Force layout then play
  void host.offsetWidth
  host.classList.add('is-in')

  // Swap theme at peak coverage (~ half duration)
  const SWAP_MS = 320
  const END_MS = 720

  window.setTimeout(() => {
    apply()
    host.classList.remove('is-in')
    host.classList.add('is-out')
  }, SWAP_MS)

  window.setTimeout(() => {
    host.remove()
    busy = false
  }, END_MS)
}
