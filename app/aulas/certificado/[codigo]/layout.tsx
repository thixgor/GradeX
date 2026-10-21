/**
 * Casco gerado na primeira visita a cada id e servido do CDN dali em diante
 * (até o próximo deploy). A página é client component: o certificado vem da API, que
 * checa sessão e acesso — o HTML é igual para todo mundo.
 */
export function generateStaticParams() {
  return []
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
