'use client'

import { Suspense } from 'react'
import { PageScaffold } from '@/components/page-scaffold'
import { Cabecalho } from '@/components/monitorias/base'
import { FormularioDemanda } from '@/components/monitorias/formulario-demanda'

export default function PedirMonitoria() {
  return (
    <PageScaffold>
      <Cabecalho
        titulo="Pedir monitoria"
        descricao="Diga o que você precisa. Os monitores da matéria recebem o pedido e vêm até você."
        voltar={{ href: '/monitorias', rotulo: 'Monitorias' }}
        className="mx-auto max-w-2xl"
      />
      <Suspense>
        <FormularioDemanda />
      </Suspense>
    </PageScaffold>
  )
}
