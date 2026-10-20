import { redirect } from 'next/navigation'

import { exigirAcessoAHistologia } from '@/lib/histologia/acesso'
import { rotaDoCapituloWebPathUtah } from '@/lib/histopatologia/rotas'

interface Props {
  params: Promise<{ capitulo: string }>
}

export const dynamic = 'force-dynamic'

export default async function RedirecionarCapituloWebPathParaOAtlas(props: Props) {
  const params = await props.params
  await exigirAcessoAHistologia()

  redirect(rotaDoCapituloWebPathUtah(params.capitulo))
}
