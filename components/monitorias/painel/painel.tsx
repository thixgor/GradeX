'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, Inbox, LayoutDashboard, UserRound, Wallet, Store } from 'lucide-react'
import { PageScaffold, PageHeader } from '@/components/page-scaffold'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CaixaErro, Esqueleto, api } from '../base'
import { ListaReservas } from '../lista-reservas'
import type { DadosPainel } from './tipos'
import { VisaoGeral } from './visao-geral'
import { PerfilMonitor } from './perfil'
import { EditorAgenda } from './agenda'
import { FinanceiroMonitor } from './financeiro'
import { DISPONIBILIDADE_VAZIA } from '@/lib/monitorias/agenda'

export type AbaPainel = 'visao' | 'perfil' | 'agenda' | 'pedidos' | 'financeiro'

const ABAS: Array<{ chave: AbaPainel; rotulo: string; icone: typeof Inbox; href: string }> = [
  { chave: 'visao', rotulo: 'Visão geral', icone: LayoutDashboard, href: '/monitorias/painel' },
  { chave: 'pedidos', rotulo: 'Pedidos', icone: Inbox, href: '/monitorias/painel/pedidos' },
  { chave: 'agenda', rotulo: 'Agenda', icone: CalendarDays, href: '/monitorias/painel/agenda' },
  { chave: 'perfil', rotulo: 'Perfil & PIX', icone: UserRound, href: '/monitorias/painel/perfil' },
  { chave: 'financeiro', rotulo: 'Financeiro', icone: Wallet, href: '/monitorias/painel/financeiro' },
]

export function PainelMonitor({ aba }: { aba: AbaPainel }) {
  const [dados, setDados] = useState<DadosPainel | null>(null)
  const [erro, setErro] = useState('')

  const carregar = useCallback(() => {
    api<DadosPainel>('/api/monitorias/eu').then(setDados).catch((e) => setErro(e.message))
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  return (
    <PageScaffold wide>
      <PageHeader
        eyebrow="Monitorias"
        title="Painel do monitor"
        description="Anuncie, organize sua agenda, negocie com alunos e acompanhe seus repasses."
        actions={<Link href="/monitorias"><Button variant="outline"><Store className="mr-2 h-4 w-4" /> Vitrine</Button></Link>}
      />
      <nav className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1 [scrollbar-width:none]">
        {ABAS.map((a) => (
          <Link key={a.chave} href={a.href} className={cn('relative flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors', aba === a.chave ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
            {aba === a.chave && <motion.span layoutId="aba-painel" className="absolute inset-0 rounded-xl bg-primary" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
            <a.icone className="relative h-4 w-4" />
            <span className="relative">{a.rotulo}</span>
            {a.chave === 'pedidos' && dados?.pedidosPendentes ? <span className="relative rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-amber-950">{dados.pedidosPendentes}</span> : null}
          </Link>
        ))}
      </nav>
      {erro && <CaixaErro mensagem={erro} />}
      {!dados && !erro ? (
        <Esqueleto className="h-96" />
      ) : dados ? (
        <AnimatePresence mode="wait">
          <motion.div key={aba} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {aba === 'visao' && <VisaoGeral dados={dados} recarregar={carregar} />}
            {aba === 'perfil' && <PerfilMonitor dados={dados} recarregar={carregar} />}
            {aba === 'agenda' && <EditorAgenda inicial={dados.tutor?.disponibilidade || DISPONIBILIDADE_VAZIA} recarregar={carregar} />}
            {aba === 'pedidos' && <ListaReservas papel="monitor" />}
            {aba === 'financeiro' && <FinanceiroMonitor />}
          </motion.div>
        </AnimatePresence>
      ) : null}
    </PageScaffold>
  )
}
