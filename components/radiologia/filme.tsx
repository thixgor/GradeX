'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Camada de imagem do Atlas de Raio-X.
 *
 * O problema original: cada radiografia e cada uma das ~10 sobreposições era um
 * PNG integral buscado direto de `clinicalanatomy.ca` pelo navegador do aluno —
 * host único, sem CDN, sem cache útil. Dava para ver a imagem sendo pintada.
 *
 * A correção tem três partes, e as três moram aqui:
 *
 * 1. **Otimizador.** Toda URL passa por `/_next/image`, que converte para WebP,
 *    reduz para a largura em que a imagem realmente aparece e serve do edge
 *    cache por 30 dias. A ida ao servidor de origem passa a ser uma por
 *    variante, no servidor — não uma por aluno, no navegador.
 * 2. **Larguras fixas.** Em vez de deixar o `srcset` gerar uma variante por
 *    viewport, cada uso declara duas larguras (celular e telas maiores). Menos
 *    variantes significa mais acertos de cache — inclusive entre alunos
 *    diferentes.
 * 3. **Estado de carregamento desenhado.** A imagem só aparece quando está
 *    inteira e decodificada; antes disso o que se vê é um placeholder de filme.
 *    O aluno nunca vê um PNG meio pintado.
 */

/** Larguras declaradas em `next.config.js` (deviceSizes ∪ imageSizes). */
export type LarguraFilme = 256 | 384 | 640 | 750 | 828 | 1080 | 1200 | 1920

export function urlFilme(src: string, largura: LarguraFilme, qualidade = 70): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${largura}&q=${qualidade}`
}

interface FilmeImagemProps {
  src: string
  alt: string
  /** Largura servida em telas até 640 px. */
  larguraMobile: LarguraFilme
  /** Largura servida acima de 640 px. */
  larguraDesktop: LarguraFilme
  qualidade?: number
  className?: string
  /** Carrega já no HTML inicial, com prioridade alta de rede. */
  prioritaria?: boolean
  /** Deixa a rede priorizar outra coisa (usado nas sobreposições). */
  segundoPlano?: boolean
  /** Some com o fade de entrada — usado quando o pai já controla a transição. */
  semTransicao?: boolean
  /**
   * Desenha o placeholder de filme atrás da imagem e o apaga quando ela chega.
   * Exige um ancestral posicionado (`relative`).
   */
  comEsqueleto?: boolean
  onPronta?: () => void
}

export function FilmeImagem({
  src,
  alt,
  larguraMobile,
  larguraDesktop,
  qualidade = 70,
  className = '',
  prioritaria = false,
  segundoPlano = false,
  semTransicao = false,
  comEsqueleto = false,
  onPronta,
}: FilmeImagemProps) {
  const [pronta, setPronta] = useState(false)
  const [semOtimizador, setSemOtimizador] = useState(false)
  const ref = useRef<HTMLImageElement | null>(null)

  const marcarPronta = useCallback(() => {
    setPronta(true)
    onPronta?.()
  }, [onPronta])

  // Imagem vinda do cache do navegador dispara `load` antes da hidratação: sem
  // esta checagem ela ficaria invisível para sempre atrás do fade.
  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth > 0) marcarPronta()
  }, [marcarPronta, semOtimizador])

  // Se o otimizador falhar (origem fora do ar, transformação recusada), a
  // imagem original ainda carrega. Degradar é melhor que sumir.
  const aoFalhar = useCallback(() => {
    setSemOtimizador((atual) => {
      if (atual) return atual
      return true
    })
  }, [])

  const classes = [
    className,
    semTransicao ? '' : 'transition-opacity duration-500 ease-out',
    semTransicao || pronta ? 'opacity-100' : 'opacity-0',
  ]
    .filter(Boolean)
    .join(' ')

  const comuns = {
    ref,
    alt,
    className: classes,
    decoding: 'async' as const,
    draggable: false,
    onLoad: marcarPronta,
    // `fetchpriority` ainda não está nos tipos de React 18.
    ...(prioritaria ? { fetchpriority: 'high' } : segundoPlano ? { fetchpriority: 'low' } : {}),
  } as React.ImgHTMLAttributes<HTMLImageElement> & { ref: typeof ref }

  return (
    <>
      {comEsqueleto && (
        <span
          aria-hidden
          className={`rx-esqueleto pointer-events-none absolute inset-0 transition-opacity duration-500 ${
            pronta ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}
      {semOtimizador ? (
        <img
          {...comuns}
          key="bruta"
          src={src}
          referrerPolicy="no-referrer"
          loading={prioritaria ? 'eager' : 'lazy'}
        />
      ) : (
        // `display: contents` tira o <picture> da árvore de caixas: o <img>
        // continua se posicionando contra o contêiner do chamador, como se o
        // wrapper não existisse.
        <picture className="contents">
          <source media="(max-width: 640px)" srcSet={urlFilme(src, larguraMobile, qualidade)} />
          <img
            {...comuns}
            key="otimizada"
            src={urlFilme(src, larguraDesktop, qualidade)}
            loading={prioritaria ? 'eager' : 'lazy'}
            onError={aoFalhar}
          />
        </picture>
      )}
    </>
  )
}

/** Cantos do porta-filme — moldura de negatoscópio. */
export function CantosFilme() {
  return (
    <>
      <span aria-hidden className="rx-canto left-2 top-2 border-l border-t" />
      <span aria-hidden className="rx-canto right-2 top-2 border-r border-t" />
      <span aria-hidden className="rx-canto bottom-2 left-2 border-b border-l" />
      <span aria-hidden className="rx-canto bottom-2 right-2 border-b border-r" />
    </>
  )
}
