import type { Metadata } from 'next'
import { AreaRadiologia } from '@/components/radiologia/area-radiologia'
import { CatalogoPranchas } from '@/components/radiologia/catalogo-pranchas'
import {
  GUIA_PRANCHAS,
  TOTAL_TERRITORIOS_PRANCHAS,
  resumosPranchas,
} from '@/lib/radiologia/pranchas'

export const metadata: Metadata = {
  title: 'Lobos e segmentos pulmonares no Raio-X - Pranchas | Manual de Radiologia',
  description:
    'Quatro pranchas comentadas de anatomia pulmonar em radiografia de tórax: lobos e segmentos broncopulmonares em PA e perfil, com chave de cores, filme limpo para autoavaliação, sinal da silhueta, sinal da coluna e dossiê de cada território.',
}

/**
 * Índice das pranchas. O catálogo é montado no servidor e desce pronto: o
 * módulo `lib/radiologia/pranchas` carrega o dossiê dos 40 territórios e não
 * tem por que atravessar a rede para desenhar quatro cards.
 */
export default function PranchasPage() {
  return (
    <AreaRadiologia>
      <CatalogoPranchas
        pranchas={resumosPranchas()}
        guia={GUIA_PRANCHAS}
        totalTerritorios={TOTAL_TERRITORIOS_PRANCHAS}
      />
    </AreaRadiologia>
  )
}
