'use client'

import Image from 'next/image'
import { useCallback, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { canUseNextImage, normalizeCoverSrc } from '@/lib/cover-image-src'

/**
 * Capa de card (provas, grupos, subgrupos).
 *
 * Por que existe: as capas eram `<img src={url}>` cru. Um card de grupo mostra
 * a capa num retângulo de ~300×112 px e o avatar do cabeçalho num quadrado de
 * 40 px — mas o navegador baixava o arquivo original, que num link do Imgur
 * costuma ter 1–3 MB. Numa pasta com 20 subgrupos isso era dezenas de MB
 * disparados de uma vez, todos na mesma leva (sem `loading="lazy"`), brigando
 * pelas conexões e deixando a grade em branco por vários segundos.
 *
 * Aqui a capa passa pelo otimizador do Next quando o host está liberado em
 * `next.config.js`: ele reamostra para a largura real do card, converte para
 * WebP e guarda o resultado no edge por 30 dias (`minimumCacheTTL`). O mesmo
 * card cai de megabytes para alguns KB.
 *
 * Hosts fora da lista não podem ir para o otimizador — `next/image` lança em
 * tempo de render e derrubaria a página inteira. Esses caem num `<img>` comum,
 * que pelo menos é lazy e assíncrono.
 */

interface CoverImageProps {
  src?: string | null
  alt?: string
  /**
   * Mapa de "media query → largura renderizada". Obrigatório: é o que decide
   * qual variante o otimizador gera. Sem isso ele assume 100vw e o ganho
   * evapora.
   */
  sizes: string
  /** Classes extras na imagem (transform de hover, etc.). */
  className?: string
  /** Acima da dobra: carrega imediatamente, sem lazy e sem fade. */
  priority?: boolean
  /** Renderizado quando não há capa ou quando o download falha. */
  fallback?: ReactNode
}

/**
 * Preenche o container mais próximo — que precisa ser `relative` e ter altura
 * própria (`position: absolute` interno, como o `fill` do `next/image`).
 */
export function CoverImage({
  src,
  alt = '',
  sizes,
  className,
  priority = false,
  fallback = null,
}: CoverImageProps) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [trackedSrc, setTrackedSrc] = useState(src)

  // Entrar e sair de pastas reaproveita a mesma instância com outra capa. Sem
  // zerar aqui, um `failed` da capa anterior esconderia a nova para sempre.
  if (src !== trackedSrc) {
    setTrackedSrc(src)
    setFailed(false)
    setLoaded(false)
  }

  // Imagem já em cache do navegador termina de carregar antes da hidratação, e
  // o evento `load` nunca chega ao React — sem esta checagem o card ficaria
  // preso no esqueleto para sempre.
  const settleIfCached = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete) setLoaded(true)
  }, [])

  if (!src || failed) return <>{fallback}</>

  const url = normalizeCoverSrc(src)

  // O fade só vale para o que chega depois da primeira pintura. Numa capa
  // `priority` ele adiaria o LCP pelo tempo da transição.
  const fade = priority ? '' : cn('transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0')

  return (
    <>
      {!loaded && <span aria-hidden className="absolute inset-0 skeleton-pulse" />}
      {canUseNextImage(url) ? (
        <Image
          ref={settleIfCached}
          src={url}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn('object-cover', fade, className)}
        />
      ) : (
        <img
          ref={settleIfCached}
          src={url}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn('absolute inset-0 h-full w-full object-cover', fade, className)}
        />
      )}
    </>
  )
}
