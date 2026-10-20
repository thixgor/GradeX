import MaterialViewClient from './view'

// Server shell — permite que o casco HTML da página seja gerado uma vez
// e servido pela CDN da Vercel sem invocar uma Serverless Function por
// requisição. O conteúdo dinâmico continua sendo carregado no browser
// pelo client component, então o CDN entrega o mesmo HTML para todos
// e o useEffect dispara o fetch específico do material.
//
// `revalidate = 86400`: regenera no máximo 1×/dia. O HTML só contém o
// casco (sem dados do material) e os metatags do layout; quando o admin muda
// título ou preço, `revalidateMetadataPaths` (lib/metadata-revalidate.ts)
// derruba esta página na hora. Era 1×/hora, e cada material aberto ao longo do
// dia era renderizado de novo a cada hora para sair idêntico — a terceira rota
// em CPU do projeto.
// `dynamicParams = true`: permite IDs novos serem gerados sob demanda
// e cacheados na primeira requisição.
export const dynamic = 'force-static'
export const dynamicParams = true
export const revalidate = 86400

export function generateStaticParams() {
  // Vazio — Next.js gera estaticamente sob demanda na primeira request.
  return []
}

export default function Page() {
  return <MaterialViewClient />
}
