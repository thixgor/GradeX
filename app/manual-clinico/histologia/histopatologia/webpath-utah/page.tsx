import { redirect } from 'next/navigation'

import { exigirAcessoAHistologia } from '@/lib/histologia/acesso'
import { rotaDoAtlas } from '@/lib/histopatologia/rotas'

export const dynamic = 'force-dynamic'

export default async function RedirecionarWebPathParaOAtlas() {
  await exigirAcessoAHistologia()

  redirect(rotaDoAtlas())
}
