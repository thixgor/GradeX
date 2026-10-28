import { SecurePdfViewer } from '@/components/materiais/secure-pdf-viewer'
import { FocusSessionProvider } from '@/hooks/use-focus-session'

// Casco estático, gerado na primeira visita de cada material e servido pela
// CDN depois disso — o mesmo arranjo de `/materiais/[id]` (ver o comentário
// lá). Sem estas linhas a rota era `ƒ`: cada abertura do leitor rodava uma
// função, refazia a consulta ao Mongo do `generateMetadata` do layout e saía
// com o HTML inteiro da página, cru, pelo Fast Origin Transfer. O HTML não
// leva dado nenhum de quem lê: acesso, prévia, páginas e anotações chegam
// depois, pelas rotas `/api/materiais/[id]/pdf-viewer/*`, que são quem decide.
//
// O título do material vai no <head> e fica guardado por um dia; quem muda o
// material no admin derruba esta página junto com a do catálogo (ver
// `materialMetadataPaths` em `lib/metadata-revalidate.ts`).
export const dynamic = 'force-static'
export const dynamicParams = true
export const revalidate = 86400

export function generateStaticParams() {
  // Vazio: a página nasce na primeira visita (ver "Páginas sob demanda" em
  // `next.config.js`).
  return []
}

export default async function MaterialPdfViewerPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  // O leitor não passa pelo AppShell, e é o AppShell que monta a sessão de
  // foco no resto do site. A sessão mora no localStorage: o relógio que estava
  // correndo lá fora continua aqui dentro, e o que for encerrado aqui sobe para
  // o desempenho do perfil como qualquer outro. Sem conta o leitor nem abre
  // (o acesso responde 401 e manda para o login), então o envio fica ligado.
  return (
    <FocusSessionProvider>
      <SecurePdfViewer materialId={params.id} />
    </FocusSessionProvider>
  )
}
