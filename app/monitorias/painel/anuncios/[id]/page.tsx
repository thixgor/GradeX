'use client'

import { use } from 'react'
import { WizardAnuncio } from '@/components/monitorias/painel/wizard-anuncio'

export default function EditarAnuncio(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params)
  return <WizardAnuncio anuncioId={params.id} />
}
