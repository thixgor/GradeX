'use client'

import { WizardAnuncio } from '@/components/monitorias/painel/wizard-anuncio'

export default function EditarAnuncio({ params }: { params: { id: string } }) {
  return <WizardAnuncio anuncioId={params.id} />
}
