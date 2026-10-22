import { redirect } from 'next/navigation'

import { rotaDoCapituloWebPathUtah } from '@/lib/histopatologia/rotas'

/**
 * Endereço antigo de um capítulo do WebPath/Utah: leva ao capítulo dentro do
 * atlas. Redirecionamento estático, gerado na primeira visita, sem ler a
 * sessão — o portão fica no destino, e o visitante sem sessão é desviado antes,
 * no middleware.
 */

interface Props {
  params: Promise<{ capitulo: string }>
}

export function generateStaticParams() {
  return []
}

export default async function RedirecionarCapituloWebPathParaOAtlas(props: Props) {
  const { capitulo } = await props.params
  redirect(rotaDoCapituloWebPathUtah(capitulo))
}
