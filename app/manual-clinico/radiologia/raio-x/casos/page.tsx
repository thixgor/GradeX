import type { Metadata } from 'next'
import { AreaRadiologia } from '@/components/radiologia/area-radiologia'
import { CatalogoCasosRaioX } from '@/components/radiologia/catalogo-casos-raio-x'
import type { ResumoDetalhes } from '@/components/radiologia/catalogo-casos-raio-x'
import { CASOS_RAIO_X, GUIAS_CASOS_RAIO_X } from '@/lib/radiologia/casos-raio-x'
import { DETALHES_CASOS_RAIO_X } from '@/lib/radiologia/casos-raio-x-detalhes'

export const metadata: Metadata = {
  title: 'Casos e Alterações no Raio-X de Tórax | Manual de Radiologia',
  description:
    'Galeria aprofundada de casos de tórax: radiografias limpas e marcadas, marcações comentadas uma a uma, dissecção de cada estrutura, sinais radiológicos e armadilhas diagnósticas.',
}

/**
 * O catálogo é um componente cliente e não deve carregar o dossiê inteiro só
 * para mostrar dois números por cartão. O resumo é calculado aqui, no servidor.
 */
const RESUMO_DETALHES: ResumoDetalhes = Object.fromEntries(
  Object.entries(DETALHES_CASOS_RAIO_X).map(([slug, detalhe]) => [
    slug,
    {
      estruturas: detalhe.estruturas.length,
      marcacoes: Object.values(detalhe.marcacoes).reduce((total, lista) => total + lista.length, 0),
    },
  ]),
)

export default function CasosRaioXPage() {
  return (
    <AreaRadiologia alvo="Casos e alterações no Raio-X de tórax">
      <CatalogoCasosRaioX
        casos={CASOS_RAIO_X}
        categorias={Object.values(GUIAS_CASOS_RAIO_X)}
        detalhes={RESUMO_DETALHES}
      />
    </AreaRadiologia>
  )
}
