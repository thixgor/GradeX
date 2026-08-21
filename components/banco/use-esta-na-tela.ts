'use client'

import { useEffect, useState, type RefObject } from 'react'

/**
 * `true` enquanto o elemento estiver visível na janela.
 *
 * Serve para a faixa de veredito do rodapé saber quando calar a boca: o
 * trabalho dela é contar o que a pessoa NÃO está vendo. Com o painel de
 * correção já na tela, repetir "Não foi dessa vez" logo abaixo dele é ruído —
 * e ruído que ocupa uma faixa da altura útil de leitura.
 *
 * `ativo` existe porque o alvo só entra no DOM depois da correção: sem ele o
 * observador seria criado com `null` e nunca mais reconstruído.
 */
export function useEstaNaTela(
  alvo: RefObject<HTMLElement>,
  ativo: boolean,
  /**
   * Recorte da janela que conta como "visto".
   *
   * O padrão descarta a faixa de cima (barra de progresso) e quase metade de
   * baixo. Sem esse recorte, um painel alto espiando por trás da barra do
   * rodapé já contaria como visível — e a faixa de veredito sumiria no exato
   * momento em que ela é mais necessária, com a correção ainda fora de
   * alcance da leitura.
   */
  recorte = '-72px 0px -45% 0px',
): boolean {
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    if (!ativo) {
      setVisivel(false)
      return
    }
    const elemento = alvo.current
    if (!elemento || typeof IntersectionObserver === 'undefined') return

    const observador = new IntersectionObserver(
      ([entrada]) => setVisivel(entrada.isIntersecting),
      { rootMargin: recorte, threshold: 0 },
    )
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [alvo, ativo, recorte])

  return visivel
}
