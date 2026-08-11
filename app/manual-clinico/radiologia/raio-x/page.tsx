import { AreaRadiologia } from '@/components/radiologia/area-radiologia'
import { CatalogoRaioX } from '@/components/radiologia/catalogo-raio-x'
import { montarCatalogoRaioX } from '@/lib/radiologia/catalogo'

/**
 * O catálogo é montado aqui, no servidor, e desce como prop. O componente de
 * cliente que o desenha não importa mais o acervo — ele não tem como saber que
 * existem 172 KB de atlas do outro lado.
 */
export default function RaioXPage() {
  return (
    <AreaRadiologia>
      <CatalogoRaioX catalogo={montarCatalogoRaioX()} />
    </AreaRadiologia>
  )
}
