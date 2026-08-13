'use client'

import { PortaoAnatomia } from '@/components/anatomia/portao-anatomia'
import { HubAnatomia } from '@/components/anatomia/hub-anatomia'

export default function DomineAnatomiaPage() {
  return <PortaoAnatomia secao="hub">{dados => <HubAnatomia catalogo={dados.catalogo} />}</PortaoAnatomia>
}
