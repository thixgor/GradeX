import { redirect } from 'next/navigation'

import { rotaDoAtlas } from '@/lib/histopatologia/rotas'

/**
 * Endereço antigo do WebPath/Utah: leva ao atlas, que agora o inclui.
 *
 * Redirecionamento estático, sem ler a sessão: quem não assina é barrado no
 * destino (o atlas é casco com portão) e o visitante sem sessão já é desviado
 * para a home pelo middleware, antes de chegar aqui.
 */
export default function RedirecionarWebPathParaOAtlas() {
  redirect(rotaDoAtlas())
}
