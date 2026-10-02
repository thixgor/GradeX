import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AreaRadiologia } from '@/components/radiologia/area-radiologia'
import { CasoTCPagina } from '@/components/radiologia/caso-tc'
import {
  CASOS_TC,
  CASOS_TC_POR_SLUG,
  LICENCA_CASOS_TC,
  casoTCVizinho,
  urlDoCorteTC,
  vinhetaDoCasoTC,
} from '@/lib/radiologia/casos-tc'

export const dynamicParams = false

export function generateStaticParams() {
  return CASOS_TC.map((caso) => ({ slug: caso.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const caso = CASOS_TC_POR_SLUG.get(params.slug)
  if (!caso) return {}
  return { title: `${caso.titulo} na TC | Casos de Tomografia`, description: caso.resumo }
}

export default function CasoTCPage({ params }: { params: { slug: string } }) {
  const caso = CASOS_TC_POR_SLUG.get(params.slug)
  const vinheta = vinhetaDoCasoTC(params.slug)
  if (!caso || !vinheta) notFound()

  const indice = CASOS_TC.findIndex((item) => item.slug === caso.slug)
  // Os vizinhos levam só número e região: o título entregaria o diagnóstico
  // do próximo caso antes de o aluno ler a consulta.
  const vizinho = (passo: 1 | -1) => {
    const outro = casoTCVizinho(caso.slug, passo)
    return outro ? { slug: outro.slug, titulo: `Caso ${indice + 1 + passo} · ${outro.categoriaTitulo}` } : null
  }
  const urls = Array.from({ length: caso.totalFatias }, (_, i) => urlDoCorteTC(caso.slug, i + 1))

  return (
    <AreaRadiologia alvo="Casos clínicos de tomografia">
      <CasoTCPagina
        caso={caso}
        urls={urls}
        vinheta={vinheta}
        licenca={LICENCA_CASOS_TC}
        anterior={vizinho(-1)}
        proximo={vizinho(1)}
        posicao={{ indice: indice + 1, total: CASOS_TC.length }}
      />
    </AreaRadiologia>
  )
}
