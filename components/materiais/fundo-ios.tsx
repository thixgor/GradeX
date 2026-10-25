import type { ReactNode } from 'react'
import Image from 'next/image'
import { FundoDeVidro } from '@/components/vitrine/vidro-app'
import { cn } from '@/lib/utils'
import './vidro-ios.css'

/**
 * O fundo da loja (`/materiais`, `/materiais/[id]`, `/pacotes/[id]`): a aurora
 * do `FundoDeVidro` com o escopo `.vidro-ios` por cima (ver `vidro-ios.css`).
 *
 * `capa` tinge o topo da página com a própria imagem do produto, ampliada e
 * desfocada. Passe em `capaSizes` o mesmo `sizes` da capa grande da página:
 * com o mesmo `srcset`, o navegador escolhe a mesma URL e a imagem do fundo
 * sai do cache, sem um byte a mais.
 */
export function FundoIos({
  children,
  capa,
  capaSizes,
  className,
}: {
  children: ReactNode
  capa?: string | null
  capaSizes?: string
  className?: string
}) {
  return (
    <FundoDeVidro className={cn('vidro-ios', className)}>
      {capa ? (
        <div aria-hidden className="ios-ambiente">
          <div>
            <Image src={capa} alt="" fill sizes={capaSizes || '100vw'} className="object-cover" />
          </div>
        </div>
      ) : null}
      {children}
    </FundoDeVidro>
  )
}
