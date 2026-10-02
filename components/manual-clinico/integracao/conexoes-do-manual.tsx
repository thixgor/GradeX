'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

/**
 * "Estude este tema em todos os manuais" — o painel ao pé de cada ficha.
 *
 * É o que tira os manuais do isolamento: quem está no caso de carcinoma renal
 * da TC vê, sem procurar, a lâmina do carcinoma de células claras, os outros
 * tumores do rim, a janela de ultrassom dos rins, a ficha do Manual Clínico e
 * a creatinina — na ordem em que se estuda.
 *
 * ## Custo
 *
 * Este componente é só um sentinela. A ficha que o hospeda continua estática,
 * e nada do painel (diálogo, ícones, trilha) entra no pacote da página: o
 * corpo é baixado e as conexões são pedidas uma única vez, quando o fim da
 * ficha chega perto da tela. Quem lê o topo e sai não gera chamada nem
 * download nenhum.
 *
 * O painel some por completo quando não há conexão ou quando a conta não tem
 * o Manual — sem cabeçalho vazio, sem anúncio no meio do estudo.
 */

const PainelDeConexoes = dynamic(() => import('./painel-de-conexoes'), {
  ssr: false,
  loading: () => <div className="mx-auto h-40 w-full max-w-6xl animate-pulse rounded-xl bg-muted/30" aria-hidden />,
})

export function ConexoesDoManual(props: {
  /** `tc:carcinoma-de-celulas-renais`, `patologia:<slug>`… */
  refOrigem: string
  /** Nome do assunto, para sugerir o nome do estudo. */
  titulo: string
  className?: string
}) {
  const sentinela = useRef<HTMLDivElement>(null)
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    const el = sentinela.current
    if (!el || visivel) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisivel(true)
      return
    }
    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          setVisivel(true)
          observador.disconnect()
        }
      },
      // Começa um pouco antes de o painel aparecer.
      { rootMargin: '600px 0px' },
    )
    observador.observe(el)
    return () => observador.disconnect()
  }, [visivel])

  if (visivel) return <PainelDeConexoes {...props} />
  return <div ref={sentinela} className="h-px w-full" aria-hidden />
}
