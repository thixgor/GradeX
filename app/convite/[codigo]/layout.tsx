/**
 * Casco gerado na primeira visita a cada código e servido do CDN dali em
 * diante. Nome e cupom do embaixador vêm de /api/embaixadores/convite, no
 * cliente — o HTML é igual para todo mundo e não consulta o banco.
 */
export function generateStaticParams() {
  return []
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
