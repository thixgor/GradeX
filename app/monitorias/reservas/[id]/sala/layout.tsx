import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sala de aula | Monitorias DomineAqui',
  robots: { index: false, follow: false },
}

export default function LayoutDaSala({ children }: { children: React.ReactNode }) {
  return children
}
