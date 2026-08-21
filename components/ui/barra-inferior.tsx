'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

/**
 * Barra de ações presa no rodapé — a ação principal ao alcance do polegar.
 *
 * ## O problema que ela resolve
 *
 * Numa lista de questões o botão "Próxima" ficava no fim do cartão da questão.
 * Enunciado longo, cinco alternativas, gabarito e explicação depois de
 * responder: no celular isso são várias telas de rolagem, e a pessoa tinha que
 * percorrer todas de volta para baixo só para avançar. O gesto mais frequente
 * do fluxo — trocar de questão — era o mais caro.
 *
 * Aqui ele fica sempre visível, na faixa que o polegar alcança sem reposicionar
 * a mão.
 *
 * ## Por que ela publica a própria altura
 *
 * A tela já tem dois elementos flutuantes no rodapé: o "voltar" (canto
 * esquerdo) e a doca de ações (canto direito). Uma barra de largura total passa
 * exatamente por cima dos dois — ou eles por cima dela, cobrindo justamente o
 * botão de avançar.
 *
 * A plataforma já tinha um jeito de resolver isso: o banner de instalação do
 * PWA publica a própria altura em `--gx-install-prompt-h`, e quem flutua soma
 * essa variável ao `bottom`. `BarraInferior` faz o mesmo com
 * `--gx-barra-inferior-h`, medida de verdade (a altura muda com a safe-area e
 * com o texto do botão). O "voltar" e a doca sobem juntos, sem que nenhum dos
 * dois precise saber que esta tela existe.
 *
 * Ela vai para o fim do `<body>` pelo mesmo motivo dos modais: `position:
 * fixed` é relativo ao viewport só até encontrar um ancestral com `transform`
 * ou `filter` — e páginas animadas têm vários. Ver components/ui/portal.tsx.
 */

const VARIAVEL = '--gx-barra-inferior-h'

/** `useLayoutEffect` no cliente, `useEffect` no servidor — evita o aviso do SSR. */
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export function BarraInferior({
  children,
  className,
  /** Esconde a barra a partir deste ponto — o padrão a mantém em toda largura. */
  apenasMobile = false,
}: {
  children: React.ReactNode
  className?: string
  apenasMobile?: boolean
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [montado, setMontado] = useState(false)

  useEffect(() => {
    setMontado(true)
  }, [])

  useIsomorphicLayoutEffect(() => {
    if (!montado) return
    const elemento = ref.current
    if (!elemento) return

    const publicar = () => {
      document.documentElement.style.setProperty(VARIAVEL, `${elemento.offsetHeight}px`)
    }
    publicar()

    // A altura muda quando o texto do botão muda ("Próxima" → "Finalizar") e
    // quando o teclado virtual reflui a página. Sem observar, os botões
    // flutuantes ficariam parados na altura antiga.
    const observador =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(publicar) : null
    observador?.observe(elemento)
    window.addEventListener('resize', publicar)

    return () => {
      observador?.disconnect()
      window.removeEventListener('resize', publicar)
      document.documentElement.style.removeProperty(VARIAVEL)
    }
  }, [montado])

  if (!montado || typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={ref}
      className={cn(
        // Acima da doca (z-40) e do "voltar" (z-30) — que já sobem sozinhos,
        // mas a sobreposição não pode depender só da variável — e ABAIXO da
        // gaveta do menu (z-50), que quando aberta manda na tela inteira.
        'fixed inset-x-0 bottom-0 z-[45]',
        'border-t border-border/60 bg-background/85 backdrop-blur-xl',
        'shadow-[0_-8px_24px_-16px_rgba(21,61,31,0.45)]',
        apenasMobile && 'md:hidden',
        className,
      )}
      style={{
        // A folga de baixo não é decoração: no mapa de alcance do polegar, a
        // faixa COLADA na borda inferior é tão desconfortável quanto o topo da
        // tela — o polegar precisa se dobrar para trás para alcançá-la. Uns
        // poucos pixels de respiro sobem a ação para dentro do arco natural.
        // Em aparelhos com indicador de home a própria safe-area já faz isso.
        paddingBottom: 'max(0.85rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 pt-2.5">{children}</div>
    </div>,
    document.body,
  )
}
