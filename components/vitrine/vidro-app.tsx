import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import './vidro-app.css'

/**
 * O fundo das telas logadas que vestem o visual da vitrine (`/provas` e a
 * tela inicial de `/exam/[id]`): a aurora atrás, e o escopo `.vidro-app` que
 * as classes `vidro-*` de `vidro-app.css` usam. Respeita o tema da pessoa.
 */
export function FundoDeVidro({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('vidro-app', className)}>
      <div aria-hidden className="vidro-app-aurora">
        <span className="m1" />
        <span className="m2" />
        <span className="m3" />
      </div>
      {children}
    </div>
  )
}
