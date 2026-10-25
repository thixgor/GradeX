'use client'

import { useLayoutEffect, type RefObject } from 'react'

const VARIAVEL = '--gx-barra-inferior-h'

/**
 * Publica em `--gx-barra-inferior-h` o espaço que uma barra flutuante de
 * rodapé ocupa — o mesmo contrato da `BarraInferior` (components/ui).
 *
 * O "voltar" do iPhone e a doca de ações somam essa variável ao `bottom`.
 * As barras de compra em vidro (`.ios-barra-inferior`) flutuam com folga da
 * borda e somem/voltam conforme o botão do painel sai da tela; sem publicar,
 * o "voltar" ficava por cima do preço. Escondida, a variável sai.
 */
export function useAlturaDoRodape(ref: RefObject<HTMLElement | null>, visivel: boolean) {
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !visivel) return

    const publicar = () => {
      // Altura + a folga até a borda (o `bottom` calculado, e não a posição
      // na tela: na entrada a barra ainda está transladada para baixo).
      const folga = Math.max(0, parseFloat(getComputedStyle(el).bottom) || 0)
      document.documentElement.style.setProperty(VARIAVEL, `${Math.round(el.offsetHeight + folga)}px`)
    }
    publicar()
    const obs = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(publicar) : null
    obs?.observe(el)
    window.addEventListener('resize', publicar)
    return () => {
      obs?.disconnect()
      window.removeEventListener('resize', publicar)
      document.documentElement.style.removeProperty(VARIAVEL)
    }
  }, [ref, visivel])
}
