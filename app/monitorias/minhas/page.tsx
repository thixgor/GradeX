'use client'

import Link from 'next/link'
import { PageScaffold } from '@/components/page-scaffold'
import { Button } from '@/components/ui/button'
import { Cabecalho } from '@/components/monitorias/base'
import { ListaReservas } from '@/components/monitorias/lista-reservas'
import { MeusPedidos } from '@/components/monitorias/meus-pedidos'

export default function MinhasMonitorias() {
  return (
    <PageScaffold>
      <Cabecalho
        titulo="Minhas monitorias"
        descricao="Suas aulas, pedidos, contratos e comprovantes."
        acoes={
          <>
            <Link href="/monitorias"><Button variant="outline" className="rounded-xl">Encontrar monitor</Button></Link>
            <Link href="/monitorias/pedir"><Button className="rounded-xl">Pedir monitoria</Button></Link>
          </>
        }
      />
      <MeusPedidos />
      <ListaReservas papel="aluno" />
    </PageScaffold>
  )
}
