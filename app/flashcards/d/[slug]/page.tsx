import DeckPageClient from './view'

// Server shell — vide /app/materiais/[id]/page.tsx para detalhes.
// O HTML estático é cacheado pela CDN da Vercel; o useEffect do
// componente cliente busca o deck específico por slug em runtime.
export const dynamic = 'force-static'
export const dynamicParams = true
export const revalidate = 3600

export function generateStaticParams() {
  return []
}

export default function Page() {
  return <DeckPageClient />
}
