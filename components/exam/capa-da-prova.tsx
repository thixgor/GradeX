'use client'

import { useState } from 'react'
import { CoverImage } from '@/components/cover-image'
import { Logo } from '@/components/logo'
import { cn } from '@/lib/utils'

/**
 * A capa da prova nas telas de `/exam/[id]` (entrada, sala de espera, "você já
 * finalizou") e na vitrine de quem chega sem conta.
 *
 * ## O que ela conserta
 *
 * A capa era um `<img src>` cru numa faixa de altura fixa (`h-48`), coberta por
 * um degradê que a desbotava até sumir e com o título subindo por cima dela
 * (`-mt-14`). Três coisas davam errado:
 *
 * - **Não aparecia.** O `<img>` cru recebia o endereço como foi salvo: capa
 *   antiga em `http://` é bloqueada como conteúdo misto, e o link da página do
 *   Imgur devolve HTML. `CoverImage` normaliza os dois (`normalizeCoverSrc`).
 * - **Cortava errado.** Altura fixa num cartão de 768 px é uma proporção de
 *   4:1 — a capa (quase sempre 16:9) perdia metade da altura. Aqui a caixa tem
 *   PROPORÇÃO, não altura: 16:9 no celular, 2:1 a partir do `sm`, e a imagem
 *   preenche com `object-cover` centralizado.
 * - **Pesava.** O arquivo original do Imgur tem 1–3 MB. Pelo otimizador ele
 *   chega na largura em que é desenhado.
 *
 * Sem capa (ou se o download falhar) a caixa vira um campo da marca, e não um
 * buraco cinza.
 */
export function CapaDaProva({
  src,
  titulo,
  sizes = '(max-width: 768px) 100vw, 768px',
  priority = true,
  className,
  adaptavel = false,
}: {
  src?: string | null
  titulo: string
  /** Largura em que a capa é desenhada — decide a variante do otimizador. */
  sizes?: string
  priority?: boolean
  className?: string
  /**
   * A moldura toma a proporção da PRÓPRIA imagem (entre 4:5 e 2:1) e mostra a
   * capa inteira, sem corte.
   *
   * A caixa fixa de 2:1 servia à capa 16:9 e mutilava o resto: uma capa em
   * retrato perdia dois terços da altura, e o título que ela trazia escrito
   * saía decepado. Aqui a imagem vai com `object-contain`; quando a proporção
   * dela passa dos limites, o que sobra da moldura é a mesma imagem, ampliada
   * e desfocada por trás (a mesma URL e o mesmo `sizes`: sai do cache, sem um
   * byte a mais).
   */
  adaptavel?: boolean
}) {
  const [proporcao, setProporcao] = useState<number | null>(null)

  const fallback = (
    <span className="absolute inset-0 flex items-center justify-center bg-[#153D1F]">
      <Logo variant="dark" size="lg" className="opacity-60" />
    </span>
  )

  if (!adaptavel) {
    return (
      <div className={cn('relative aspect-[16/9] w-full overflow-hidden bg-[#153D1F] sm:aspect-[2/1]', className)}>
        <CoverImage
          src={src}
          alt={`Capa da prova ${titulo}`}
          sizes={sizes}
          priority={priority}
          className="object-center"
          fallback={fallback}
        />
      </div>
    )
  }

  // Sem capa, a moldura não vira um buraco escuro: um campo da marca, com o
  // ícone ao centro.
  const campoDaMarca = (
    <span className="ios-capa-vazia absolute inset-0 flex items-center justify-center">
      <Logo variant="icon" size="lg" className="block !h-20 w-auto opacity-80 dark:hidden" />
      <Logo variant="dark" size="lg" className="hidden !h-20 w-auto opacity-80 dark:block" />
    </span>
  )

  // 16:9 enquanto a imagem não chega (é a proporção da maioria das capas), e
  // a medida real assim que ela carrega.
  const aspecto = proporcao ? Math.min(2, Math.max(0.8, proporcao)) : 16 / 9

  return (
    <div
      className={cn('relative w-full overflow-hidden', src ? 'bg-[#153D1F]' : '', className)}
      style={{ aspectRatio: String(aspecto) }}
    >
      {src && (
        <div aria-hidden className="absolute inset-0 scale-125 opacity-80 blur-2xl saturate-150">
          <CoverImage src={src} alt="" sizes={sizes} priority={priority} />
        </div>
      )}
      <CoverImage
        src={src}
        alt={`Capa da prova ${titulo}`}
        sizes={sizes}
        priority={priority}
        className="!object-contain"
        fallback={campoDaMarca}
        onNaturalSize={(largura, altura) => setProporcao(largura / altura)}
      />
    </div>
  )
}
