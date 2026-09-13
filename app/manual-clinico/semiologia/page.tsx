import { AreaSemiologia } from '@/components/semiologia/area'
import { HomeSemiologia } from '@/components/semiologia/home'
import { montarCatalogo } from '@/lib/semiologia/catalogo'

/**
 * Home do Manual de Semiologia — montada no servidor.
 *
 * `montarCatalogo()` roda aqui e não no cliente pelo mesmo motivo da home da
 * Radiologia: os módulos de conteúdo somam centenas de KB de fonte, e a home
 * só precisa de nomes e contagens. O que desce é HTML.
 */
export default function SemiologiaPage() {
  return (
    <AreaSemiologia>
      <div className="surface-page min-h-screen">
        <div className="container mx-auto max-w-6xl px-4 py-10">
          <HomeSemiologia catalogo={montarCatalogo()} />
        </div>
      </div>
    </AreaSemiologia>
  )
}
