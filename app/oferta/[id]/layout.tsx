/**
 * Casco gerado na primeira visita e servido do CDN: a oferta vem de
 * /api/ofertas/[id], que só responde para a dona da oferta.
 */
export function generateStaticParams() {
  return []
}

export const metadata = {
  title: 'Oferta exclusiva',
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
