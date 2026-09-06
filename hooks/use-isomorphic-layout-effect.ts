import { useEffect, useLayoutEffect } from 'react'

/**
 * `useLayoutEffect` no navegador, `useEffect` no servidor.
 *
 * Serve para o punhado de efeitos que precisam correr ANTES da pintura —
 * reposicionar a rolagem quando o conteúdo troca é o caso clássico. Com o
 * `useEffect` comum há sempre um quadro (ou vários, num aparelho carregado) em
 * que o conteúdo novo já está na tela na rolagem ANTIGA: a pessoa vê a questão
 * seguinte começando pelo meio antes de a correção acontecer.
 *
 * O `useLayoutEffect` puro resolveria isso, mas avisa no console a cada render
 * no servidor, onde não existe layout para medir. Trocar de um para o outro
 * conforme o ambiente é o contorno de sempre — e é uma constante, não uma
 * condição dentro do componente, então a ordem dos hooks nunca muda.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect
