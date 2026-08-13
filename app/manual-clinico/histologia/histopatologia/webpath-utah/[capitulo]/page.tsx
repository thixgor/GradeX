import { redirect } from 'next/navigation'

import { exigirAcessoAHistologia } from '@/lib/histologia/acesso'
import { rotaDoCapituloWebPathUtah } from '@/lib/histopatologia/rotas'

interface Props {
  params: { capitulo: string }
}

export const dynamic = 'force-dynamic'

export default async function RedirecionarCapituloWebPathParaOAtlas({ params }: Props) {
  await exigirAcessoAHistologia()

  redirect(rotaDoCapituloWebPathUtah(params.capitulo))
}
