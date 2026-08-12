import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AreaRadiologia } from '@/components/radiologia/area-radiologia'
import { CasoRaioXPagina } from '@/components/radiologia/caso-raio-x'
import type { VizinhoCaso } from '@/components/radiologia/caso-raio-x'
import { CASOS_POR_SLUG, CASOS_RAIO_X, GUIAS_CASOS_RAIO_X, casoVizinho } from '@/lib/radiologia/casos-raio-x'
import type { AchadoMarcado } from '@/lib/radiologia/casos-raio-x-detalhes'
import { detalheDoCaso, marcacoesDaImagem } from '@/lib/radiologia/casos-raio-x-detalhes'

export const dynamicParams = false

export function generateStaticParams() {
  return CASOS_RAIO_X.map((caso) => ({ slug: caso.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const caso = CASOS_POR_SLUG.get(params.slug)
  if (!caso) return {}
  return {
    title: `${caso.titulo} no Raio-X | Casos de Radiologia`,
    description: caso.resumo,
  }
}

const resumir = (caso: { slug: string; titulo: string; categoriaTitulo: string }): VizinhoCaso => ({
  slug: caso.slug,
  titulo: caso.titulo,
  categoriaTitulo: caso.categoriaTitulo,
})

export default function CasoRaioXPage({ params }: { params: { slug: string } }) {
  const caso = CASOS_POR_SLUG.get(params.slug)
  if (!caso) notFound()

  const guia = GUIAS_CASOS_RAIO_X[caso.categoria]
  const anterior = casoVizinho(caso.slug, -1)
  const proximo = casoVizinho(caso.slug, 1)
  const detalhe = detalheDoCaso(caso.slug)

  // As marcações viajam por imagem para o cliente: o visor só precisa da lista
  // do filme que está exibindo, não do dossiê inteiro.
  const marcacoesPorImagem: Record<number, AchadoMarcado[]> = {}
  for (const imagem of caso.imagens) {
    marcacoesPorImagem[imagem.indice] = marcacoesDaImagem(caso.slug, imagem.indice)
  }

  return (
    <AreaRadiologia alvo={caso.titulo}>
      <CasoRaioXPagina
        caso={caso}
        guia={guia}
        detalhe={detalhe}
        marcacoesPorImagem={marcacoesPorImagem}
        anterior={anterior ? resumir(anterior) : null}
        proximo={proximo ? resumir(proximo) : null}
        posicao={{
          indice: CASOS_RAIO_X.findIndex((item) => item.slug === caso.slug) + 1,
          total: CASOS_RAIO_X.length,
        }}
      />
    </AreaRadiologia>
  )
}
