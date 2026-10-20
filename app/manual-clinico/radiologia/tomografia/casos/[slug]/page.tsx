import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AreaRadiologia } from '@/components/radiologia/area-radiologia'
import { CasoImagemPagina } from '@/components/radiologia/caso-imagem'
import { COLECAO_TC, LICENCA_CASOS_TC } from '@/lib/radiologia/casos-tc'
import { urlsDasSeries, vizinhosDoCaso } from '@/lib/radiologia/casos-imagem-paginas'
import { ConexoesDoManual } from '@/components/manual-clinico/integracao/conexoes-do-manual'

// Gerada na primeira visita e guardada até o próximo deploy, e não no build:
// ver "Páginas sob demanda" em next.config.js.
export function generateStaticParams() {
  return []
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
      <ConexoesDoManual refOrigem={`tc:${caso.slug}`} titulo={caso.titulo} />
    </AreaRadiologia>
  )
}
