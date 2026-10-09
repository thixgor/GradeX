'use client'

import { notFound } from 'next/navigation'
import { PainelMonitor, type AbaPainel } from '@/components/monitorias/painel/painel'

const VALIDAS: AbaPainel[] = ['perfil', 'agenda', 'pedidos', 'financeiro']

export default function PainelAba({ params }: { params: { aba: string } }) {
  if (!VALIDAS.includes(params.aba as AbaPainel)) notFound()
  return <PainelMonitor aba={params.aba as AbaPainel} />
}
