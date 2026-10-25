'use client'

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
}: {
  src?: string | null
  titulo: string
  /** Largura em que a capa é desenhada — decide a variante do otimizador. */
  sizes?: string
  priority?: boolean
  className?: string
}) {
  return (
    <div className={cn('relative aspect-[16/9] w-full overflow-hidden bg-[#153D1F] sm:aspect-[2/1]', className)}>
      <CoverImage
        src={src}
        alt={`Capa da prova ${titulo}`}
        sizes={sizes}
        priority={priority}
        className="object-center"
        fallback={
          <span className="absolute inset-0 flex items-center justify-center bg-[#153D1F]">
            <Logo variant="dark" size="lg" className="opacity-60" />
          </span>
        }
      />
    </div>
  )
}
