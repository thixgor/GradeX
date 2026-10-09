'use client'

import Link from 'next/link'
import { PageScaffold, PageHeader } from '@/components/page-scaffold'
import { Button } from '@/components/ui/button'
import { ListaReservas } from '@/components/monitorias/lista-reservas'

export default function MinhasMonitorias() {
  return (
    <PageScaffold>
      <PageHeader eyebrow="Monitorias" title="Minhas monitorias" description="Pedidos, aulas agendadas, contratos e comprovantes." actions={<Link href="/monitorias"><Button variant="outline">Explorar</Button></Link>} />
      <ListaReservas papel="aluno" />
    </PageScaffold>
  )
}
