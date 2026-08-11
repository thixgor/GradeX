import { AreaRadiologia } from '@/components/radiologia/area-radiologia'
import { CatalogoTomografia } from '@/components/tomografia/catalogo'
import { montarCatalogoTC } from '@/lib/tomografia/montar-catalogo'

/**
 * Índice do atlas de tomografia — montado no servidor.
 *
 * O portão de acesso é o mesmo da seção inteira (`AreaRadiologia`): quem não
 * assina vê a landing do Manual de Radiologia, e não uma vitrine só de TC.
 */
export default function TomografiaPage() {
  return (
    <AreaRadiologia>
      <CatalogoTomografia catalogo={montarCatalogoTC()} />
    </AreaRadiologia>
  )
}
