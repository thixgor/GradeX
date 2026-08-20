'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'

/**
 * Publica a altura de um elemento numa variável CSS em `<html>`.
 *
 * O PROBLEMA QUE ISSO RESOLVE
 *
 * Uma barra fixa no rodapé (`fixed inset-x-0 bottom-0`) e um botão flutuante
 * de canto (`fixed bottom-6 right-6`) não sabem um do outro por padrão: se os
 * dois existem na mesma tela, a barra cobre o botão — ou o botão intercepta o
 * clique de quem estava embaixo dele, mesmo que pareça clicável. É o que
 * aconteceu com o botão "Excluir" da seleção em massa no Catálogo: o círculo
 * de Suporte, fixo no canto inferior direito em telas grandes, ficava
 * literalmente em cima dele.
 *
 * `components/ui/barra-inferior.tsx` já resolvia isso para as barras que a
 * usam, publicando `--gx-barra-inferior-h`; este hook é a mesma técnica,
 * extraída para telas que precisam da variável sem herdar o visual dela (cor,
 * blur, portal para o body) — como uma barra de ações já estilizada à mão.
 *
 * Quem lê a variável soma-a ao próprio `bottom` (ver `MobileBackButton`,
 * `SupportChat`): sem nenhuma barra publicando, ela vale `0px` e ninguém se
 * move — o efeito só existe quando há de fato algo a evitar.
 */
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export function usePublicaAltura<T extends HTMLElement>(
  variavel: string,
  ativo: boolean,
): React.RefObject<T> {
  const ref = useRef<T>(null)

  useIsomorphicLayoutEffect(() => {
    if (!ativo) return
    const elemento = ref.current
    if (!elemento) return

    const publicar = () => {
      document.documentElement.style.setProperty(variavel, `${elemento.offsetHeight}px`)
    }
    publicar()

    // O texto do botão muda ("Publicar" ↔ carregando) e a barra pode quebrar
    // linha em janelas estreitas — sem observar, quem lê a variável ficaria
    // parado na altura antiga.
    const observador =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(publicar) : null
    observador?.observe(elemento)
    window.addEventListener('resize', publicar)

    return () => {
      observador?.disconnect()
      window.removeEventListener('resize', publicar)
      document.documentElement.style.removeProperty(variavel)
    }
  }, [ativo, variavel])

  return ref
}
