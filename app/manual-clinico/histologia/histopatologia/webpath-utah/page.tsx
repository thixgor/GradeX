import { redirect } from 'next/navigation'

import { rotaDoAtlas } from '@/lib/histopatologia/rotas'

export default function RedirecionarWebPathParaOAtlas() {
  redirect(rotaDoAtlas())
}
