'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Camada de imagem do Atlas de Raio-X.
 *
 * Radiografias e demarcações vivem em `/public/img/radiologia/raio-x/v1` e são
 * servidas pelo edge da aplicação com cache imutável. Não há dependência do
 * servidor de origem durante o estudo.
 *
 * A correção tem três partes, e as três moram aqui:
 *
 * 1. **Otimizador seletivo.** Radiografias-base passam por `/_next/image`, que
 *    converte para WebP e reduz para a largura de exibição. Sobreposições ficam
 *    no PNG original: o acervo inteiro de demarcações tem só 1,54 MB e assim a
 *    transparência e o alinhamento permanecem pixel-perfect.
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
  /** Desativa WebP/redimensionamento; ideal para demarcações PNG transparentes. */
  otimizar?: boolean
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
  otimizar = true,
  semTransicao = false,
  comEsqueleto = false,
  onPronta,
}: FilmeImagemProps) {
  const [pronta, setPronta] = useState(false)
  const [otimizadorFalhou, setOtimizadorFalhou] = useState(false)
  const ref = useRef<HTMLImageElement | null>(null)

  const marcarPronta = useCallback(() => {
    setPronta(true)
    onPronta?.()
  }, [onPronta])

  // Imagem vinda do cache do navegador dispara `load` antes da hidratação: sem
  // esta checagem ela ficaria invisível para sempre atrás do fade.
  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth > 0) marcarPronta()
  }, [marcarPronta, otimizadorFalhou, otimizar])

  // Se o otimizador falhar (origem fora do ar, transformação recusada), a
  // imagem original ainda carrega. Degradar é melhor que sumir.
  const aoFalhar = useCallback(() => {
    setOtimizadorFalhou((atual) => {
      if (atual) return atual
      return true
    })
  }, [])

  const usarOriginal = !otimizar || otimizadorFalhou

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
      {usarOriginal ? (
        <img
          {...comuns}
          key="original"
          src={src}
          loading={prioritaria || segundoPlano ? 'eager' : 'lazy'}
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
