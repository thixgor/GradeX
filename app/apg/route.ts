import { respostaApg } from '@/lib/apg-pagina'

export const runtime = 'nodejs'

/**
 * Estática, e não `force-dynamic`.
 *
 * A rota lia `?periodo=` para montar o <head> e, por isso, rodava por função a
 * cada cache miss. A chave de cache da borda é a URL inteira, então todo clique
 * vindo do Instagram (`fbclid` único por clique), de campanha (`utm_*`) ou de
 * qualquer link com parâmetro virava miss: a função devolvia o HTML inteiro à
 * borda de novo. Era a página mais pesada do site (11 MB antes da otimização
 * das imagens embutidas), e cada miss era Fast Origin Transfer.
 *
 * Agora `/apg` é a visão geral pré-gerada no build, e `/apg?periodo=N` é
 * reescrita pelo `next.config.js` para `/apg/periodo/N`, também pré-gerada.
 * Arquivo estático não varia por query string, então parâmetro de rastreio
 * deixou de custar alguma coisa.
 */
export const dynamic = 'force-static'

export function GET() {
  return respostaApg()
}
