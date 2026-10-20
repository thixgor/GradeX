import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AreaRadiologia } from '@/components/radiologia/area-radiologia'
import { CasoImagemPagina } from '@/components/radiologia/caso-imagem'
import { COLECAO_RX, LICENCA_CASOS_RX } from '@/lib/radiologia/casos-rx'
import { urlsDasSeries, vizinhosDoCaso } from '@/lib/radiologia/casos-imagem-paginas'
import { ConexoesDoManual } from '@/components/manual-clinico/integracao/conexoes-do-manual'

// Gerada na primeira visita e guardada até o próximo deploy, e não no build:
// ver "Páginas sob demanda" em next.config.js.
export function generateStaticParams() {
  return []
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params
  const caso = COLECAO_RX.porSlug.get(params.slug)
  if (!caso) return {}
  return { title: `${caso.titulo} no Raio-X | Casos com apontamentos`, description: caso.resumo }
}

export default async function CasoRXApontadoPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params
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
