import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AreaRadiologia } from '@/components/radiologia/area-radiologia'
import { CasoImagemPagina } from '@/components/radiologia/caso-imagem'
import { COLECAO_RX, LICENCA_CASOS_RX } from '@/lib/radiologia/casos-rx'
import { urlsDasSeries, vizinhosDoCaso } from '@/lib/radiologia/casos-imagem-paginas'
import { ConexoesDoManual } from '@/components/manual-clinico/integracao/conexoes-do-manual'

export const dynamicParams = false

export function generateStaticParams() {
  return COLECAO_RX.casos.map((caso) => ({ slug: caso.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const caso = COLECAO_RX.porSlug.get(params.slug)
  if (!caso) return {}
  return { title: `${caso.titulo} no Raio-X | Casos com apontamentos`, description: caso.resumo }
}

export default function CasoRXApontadoPage({ params }: { params: { slug: string } }) {
  const caso = COLECAO_RX.porSlug.get(params.slug)
  const vinheta = COLECAO_RX.vinheta(params.slug)
  if (!caso || !vinheta) notFound()

  return (
    <AreaRadiologia alvo="Casos clínicos de Raio-X com apontamentos">
      <CasoImagemPagina
        caso={caso}
        urlsPorSerie={urlsDasSeries(caso)}
        vinheta={vinheta}
        licenca={LICENCA_CASOS_RX}
        rotaCatalogo="/manual-clinico/radiologia/raio-x/casos-com-apontamentos"
        rotuloColecao="Casos de Raio-X com apontamentos"
        {...vizinhosDoCaso(COLECAO_RX, caso.slug)}
      />
      <ConexoesDoManual refOrigem={`rxa:${caso.slug}`} titulo={caso.titulo} />
    </AreaRadiologia>
  )
}
