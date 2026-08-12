import type { Metadata } from 'next'
import { AreaRadiologia } from '@/components/radiologia/area-radiologia'
import { CatalogoCasosRaioX } from '@/components/radiologia/catalogo-casos-raio-x'
import { CASOS_RAIO_X, GUIAS_CASOS_RAIO_X } from '@/lib/radiologia/casos-raio-x'

export const metadata: Metadata = {
  title: 'Casos e Alterações no Raio-X de Tórax | Manual de Radiologia',
  description: 'Galeria aprofundada de casos de tórax com radiografias limpas e marcadas, comparação interativa, sinais radiológicos e armadilhas diagnósticas.',
}

export default function CasosRaioXPage() {
  return (
    <AreaRadiologia alvo="Casos e alterações no Raio-X de tórax">
      <CatalogoCasosRaioX casos={CASOS_RAIO_X} categorias={Object.values(GUIAS_CASOS_RAIO_X)} />
    </AreaRadiologia>
  )
}
