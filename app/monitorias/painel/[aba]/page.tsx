'use client'

import { use } from 'react'
import { notFound } from 'next/navigation'
import { PainelMonitor, type AbaPainel } from '@/components/monitorias/painel/painel'

const VALIDAS: AbaPainel[] = ['oportunidades', 'perfil', 'agenda', 'pedidos', 'financeiro']

export default function PainelAba(props: { params: Promise<{ aba: string }> }) {
  const params = use(props.params)
  if (!VALIDAS.includes(params.aba as AbaPainel)) notFound()
  return <PainelMonitor aba={params.aba as AbaPainel} />
}
