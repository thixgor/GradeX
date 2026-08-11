import { redirect } from 'next/navigation'

import { rotaDoCapituloWebPathUtah } from '@/lib/histopatologia/rotas'

interface Props {
  params: { capitulo: string }
}

export default function RedirecionarCapituloWebPathParaOAtlas({ params }: Props) {
  redirect(rotaDoCapituloWebPathUtah(params.capitulo))
}
