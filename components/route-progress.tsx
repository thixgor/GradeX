'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Barra fina de progresso da navegação.
 *
 * Substitui o `app/loading.tsx` que existia na raiz — um spinner de tela
 * inteira que trocava a página atual por um logo pulsando a CADA clique em
 * qualquer rota sem esqueleto próprio (admin, manual clínico, anatomia,
 * compra, equipe...). Sem aquele arquivo, o Next mantém a página em que a
 * pessoa está VISÍVEL enquanto busca a próxima: nenhum piscar, nenhuma tela
 * vazia. O que se perdia era o sinal de "entendi seu clique" — é o que esta
 * barra devolve, ocupando 3 px em vez do viewport inteiro.
 *
 * Os esqueletos por seção (`app/<seção>/loading.tsx`) continuam existindo e
 * continuam valendo: eles desenham o molde do conteúdo, que é útil. O que
 * saiu foi só o spinner genérico da raiz.
 *
 * Detalhes que importam:
 *
 * • ATRASO de 180 ms antes de aparecer. Rota já prefetchada (a sidebar
 *   prefetcha todas as visíveis) resolve em algumas dezenas de milissegundos —
 *   mostrar e esconder uma barra nesse intervalo é pior que não mostrar nada.
 *   Na prática ela só aparece quando a espera seria de fato perceptível.
 *
 * • Começa no CLIQUE, não na mudança de rota: `usePathname` só muda quando a
 *   navegação termina, que é tarde demais para sinalizar espera.
 *
 * • `useSearchParams` está fora de propósito. Ele obrigaria toda página que
 *   monta este componente (ou seja, todas — ele vive no layout raiz) a ser
 *   renderizada sob demanda, desfazendo o HTML estático da landing.
 */
export function RouteProgress() {
  const pathname = usePathname()
  const [visivel, setVisivel] = useState(false)
  const [progresso, setProgresso] = useState(0)
  const timers = useRef<number[]>([])

  // Limpa qualquer temporizador pendente de um ciclo anterior.
  function limparTimers() {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }

  // Encerrar em toda mudança de rota cobre os dois caminhos de saída: a
  // navegação que a barra estava acompanhando e a que começou em outro lugar
  // (router.push de dentro de um componente, por exemplo).
  useEffect(() => {
    limparTimers()
    setProgresso(100)
    const id = window.setTimeout(() => {
      setVisivel(false)
      setProgresso(0)
    }, 220)
    timers.current.push(id)
    return limparTimers
  }, [pathname])

  useEffect(() => {
    function aoClicar(event: MouseEvent) {
      // Clique com modificador, botão do meio ou botão direito: o navegador
      // abre em outra aba/janela e a página atual não vai a lugar nenhum.
      if (event.defaultPrevented) return
      if (event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const alvo = (event.target as Element | null)?.closest?.('a')
      if (!alvo) return

      const href = alvo.getAttribute('href')
      if (!href || href.startsWith('#')) return
      if (alvo.target && alvo.target !== '_self') return
      if (alvo.hasAttribute('download')) return

      let destino: URL
      try {
        destino = new URL(alvo.href, window.location.href)
      } catch {
        return
      }

      // Outro site, outro protocolo (mailto:, tel:) ou a mesma URL: não há
      // navegação interna para acompanhar.
      if (destino.origin !== window.location.origin) return
      if (destino.pathname === window.location.pathname && destino.search === window.location.search) {
        return
      }

      iniciar()
    }

    function iniciar() {
      limparTimers()
      // Só aparece se a espera passar do imperceptível.
      const aparecer = window.setTimeout(() => {
        setVisivel(true)
        setProgresso(18)
        // Avanço em degraus decrescentes: sobe rápido no começo e vai
        // desacelerando, para nunca encostar em 100% antes da hora.
        const passos = [42, 62, 76, 85, 90]
        passos.forEach((valor, i) => {
          const id = window.setTimeout(() => setProgresso(valor), 180 * (i + 1))
          timers.current.push(id)
        })
      }, 180)
      timers.current.push(aparecer)

      // Rede de segurança: navegação abortada (a pessoa desistiu, o servidor
      // devolveu erro) não pode deixar a barra parada na tela para sempre.
      const desistir = window.setTimeout(() => {
        limparTimers()
        setVisivel(false)
        setProgresso(0)
      }, 10000)
      timers.current.push(desistir)
    }

    document.addEventListener('click', aoClicar, { capture: true })
    return () => document.removeEventListener('click', aoClicar, { capture: true })
  }, [])

  if (!visivel) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px]"
      role="progressbar"
      aria-label="Carregando página"
      aria-hidden={progresso >= 100 ? 'true' : undefined}
    >
      <div
        className="h-full bg-primary shadow-[0_0_8px_rgba(0,0,0,0.15)] transition-[width,opacity] duration-200 ease-out"
        style={{ width: `${progresso}%`, opacity: progresso >= 100 ? 0 : 1 }}
      />
    </div>
  )
}
