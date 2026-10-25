'use client'

import { animate, motion, useInView, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * A cena do topo: a arte dourada da marca brilhando atrás, a tela da prova na
 * frente, e chips de vidro flutuando em volta. Com o mouse por cima, a tela
 * inclina seguindo o cursor e a arte anda no sentido contrário — a
 * profundidade vem da diferença entre as duas.
 *
 * Sem mouse (toque) ou com "reduzir movimento", tudo fica parado no lugar.
 */
export function Cena({
  arte,
  figura,
  chips,
  fundo,
}: {
  /** A arte da landing (`public/landing/*-3d.png`), atrás de tudo. */
  arte?: { src: string; largura: number; altura: number } | null
  figura: ReactNode
  /** Até três chips, nos cantos: [cima-esquerda, direita, baixo-esquerda]. */
  chips?: ReactNode[]
  /** Um brilho de fundo próprio (a capa da prova desfocada, por exemplo). */
  fundo?: ReactNode
}) {
  const reduzir = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const mola = { stiffness: 120, damping: 18, mass: 0.6 }
  const rx = useSpring(useTransform(y, [-0.5, 0.5], [7, -7]), mola)
  const ry = useSpring(useTransform(x, [-0.5, 0.5], [-9, 9]), mola)
  const ax = useSpring(useTransform(x, [-0.5, 0.5], [18, -18]), mola)
  const ay = useSpring(useTransform(y, [-0.5, 0.5], [14, -14]), mola)

  const mover = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduzir || e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - r.left) / r.width - 0.5)
    y.set((e.clientY - r.top) / r.height - 0.5)
  }
  const soltar = () => {
    x.set(0)
    y.set(0)
  }

  const posicoes = [
    'left-0 top-[6%] md:-left-6 flutua-2',
    'right-0 top-[1%] md:-right-2 flutua-3',
    'bottom-[4%] left-[6%] flutua',
  ]

  return (
    <div onPointerMove={mover} onPointerLeave={soltar} className="relative [perspective:1200px]">
      {fundo}
      {arte && (
        // Três camadas porque cada uma mexe no `transform`: a de fora centraliza,
        // a do meio flutua, e a imagem anda com o mouse.
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 w-[130%] -translate-x-1/2 -translate-y-[56%]">
          <div className="flutua">
            <motion.img
              src={arte.src}
              alt=""
              width={arte.largura}
              height={arte.altura}
              style={{ x: ax, y: ay }}
              className="brilho-arte w-full opacity-90"
            />
          </div>
        </div>
      )}
      <motion.div style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }} className="relative mx-auto max-w-[470px] py-14">
        {figura}
      </motion.div>
      {chips?.slice(0, 3).map((chip, i) => (
        <div key={i} className={cn('pointer-events-none absolute z-10', posicoes[i])}>
          {chip}
        </div>
      ))}
    </div>
  )
}

/** Um chip de vidro, com um ponto vivo opcional. */
export function Chip({ children, vivo = false }: { children: ReactNode; vivo?: boolean }) {
  return (
    <span className="vidro-forte pilula !text-[var(--papel)] shadow-2xl">
      {vivo && <span className="ponto-vivo" />}
      {children}
    </span>
  )
}

/**
 * Um número que sobe do zero até o valor quando entra na tela. O valor final
 * já está no HTML (é ele que o leitor de tela e o buscador leem); a contagem
 * só acontece com script e sem "reduzir movimento".
 */
export function Contador({ ate, prefixo = '', sufixo = '' }: { ate: number; prefixo?: string; sufixo?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const visto = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const reduzir = useReducedMotion()
  const [valor, setValor] = useState(ate)

  useEffect(() => {
    if (!visto || reduzir) return
    const controle = animate(0, ate, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setValor(Math.round(v)),
    })
    return () => controle.stop()
  }, [visto, reduzir, ate])

  return (
    <span ref={ref} className="num">
      {prefixo}
      {valor.toLocaleString('pt-BR')}
      {sufixo}
    </span>
  )
}
