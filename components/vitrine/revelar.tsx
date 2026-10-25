'use client'

import { useEffect } from 'react'

/**
 * O mesmo observador do script em linha do casco, para a navegação dentro do
 * app: indo de uma vitrine para outra pelo `<Link>`, o React não executa o
 * `<script>` da página nova — e a classe `vitrine-js`, posta na primeira
 * carga, continuaria escondendo as seções. Rodar duas vezes não faz mal:
 * acrescentar `visivel` a quem já tem é nada.
 */
export function Revelar() {
  useEffect(() => {
    const alvos = Array.from(document.querySelectorAll<HTMLElement>('.vitrine [data-revelar]:not(.visivel)'))
    if (alvos.length === 0) return
    if (typeof IntersectionObserver === 'undefined') {
      alvos.forEach((el) => el.classList.add('visivel'))
      return
    }
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue
          entrada.target.classList.add('visivel')
          observador.unobserve(entrada.target)
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    )
    alvos.forEach((el) => observador.observe(el))
    return () => observador.disconnect()
  }, [])

  return null
}
