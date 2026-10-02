import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AreaRadiologia } from '@/components/radiologia/area-radiologia'
import { CasoImagemPagina } from '@/components/radiologia/caso-imagem'
import { COLECAO_TC, LICENCA_CASOS_TC } from '@/lib/radiologia/casos-tc'
import { urlsDasSeries, vizinhosDoCaso } from '@/lib/radiologia/casos-imagem-paginas'

export const dynamicParams = false

export function generateStaticParams() {
  return COLECAO_TC.casos.map((caso) => ({ slug: caso.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const caso = COLECAO_TC.porSlug.get(params.slug)
  if (!caso) return {}
  return { title: `${caso.titulo} na TC | Casos de Tomografia`, description: caso.resumo }
}

export default function CasoTCPage({ params }: { params: { slug: string } }) {
  const caso = COLECAO_TC.porSlug.get(params.slug)
  const vinheta = COLECAO_TC.vinheta(params.slug)
  if (!caso || !vinheta) notFound()

  return (
    <AreaRadiologia alvo="Casos clínicos de tomografia">
      <CasoImagemPagina
        caso={caso}
        urlsPorSerie={urlsDasSeries(caso)}
        vinheta={vinheta}
        licenca={LICENCA_CASOS_TC}
        rotaCatalogo="/manual-clinico/radiologia/tomografia/casos"
        rotuloColecao="Casos de TC"
        {...vizinhosDoCaso(COLECAO_TC, caso.slug)}
      />
    </AreaRadiologia>
  )
}
