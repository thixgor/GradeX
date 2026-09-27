import { PERIODOS_APG, respostaApg } from '@/lib/apg-pagina'

export const runtime = 'nodejs'

/**
 * `/apg?periodo=N`, pré-gerada no build.
 *
 * Ninguém chega aqui pelo endereço: o `next.config.js` reescreve
 * `/apg?periodo=N` para cá, e o canonical de cada página continua sendo
 * `/apg?periodo=N`. Ver `app/apg/route.ts` para o motivo.
 */
export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return PERIODOS_APG.map((periodo) => ({ periodo }))
}

export function GET(_request: Request, { params }: { params: { periodo: string } }) {
  return respostaApg(Number(params.periodo))
}
