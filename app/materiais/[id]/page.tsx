import MaterialViewClient from './view'

// Server shell — permite que o casco HTML da página seja gerado uma vez
// e servido pela CDN da Vercel sem invocar uma Serverless Function por
// requisição. O conteúdo dinâmico continua sendo carregado no browser
// pelo client component, então o CDN entrega o mesmo HTML para todos
// e o useEffect dispara o fetch específico do material.
//
// `revalidate = 3600`: regenera no máximo 1×/hora. Como o HTML só
// contém o casco (sem dados do material), 1h é seguro.
// `dynamicParams = true`: permite IDs novos serem gerados sob demanda
// e cacheados na primeira requisição.
export const dynamic = 'force-static'
export const dynamicParams = true
export const revalidate = 3600

export function generateStaticParams() {
  // Vazio — Next.js gera estaticamente sob demanda na primeira request.
  return []
}

export default function Page() {
  return <MaterialViewClient />
}
