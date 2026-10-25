import type { Metadata } from 'next'
import type { ReactNode } from 'react'

// Oferta pessoal (só para contas Quest+): nada aqui para o buscador indexar.
export const metadata: Metadata = {
  title: 'Upgrade para o Plus+',
  robots: { index: false, follow: false },
}

export default function UpgradeLayout({ children }: { children: ReactNode }) {
  return children
}
