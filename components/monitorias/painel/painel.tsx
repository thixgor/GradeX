'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, Inbox, LayoutDashboard, UserRound, Wallet, Plus } from 'lucide-react'
import { PageScaffold } from '@/components/page-scaffold'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Cabecalho, CaixaErro, Esqueleto, api } from '../base'
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
  { chave: 'perfil', rotulo: 'Perfil e PIX', icone: UserRound, href: '/monitorias/painel/perfil' },
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

  const primeiroNome = (dados?.tutor?.nome || '').split(' ')[0]
  const pendentes = dados?.pedidosPendentes || 0
  return (
    <PageScaffold wide>
      <Cabecalho
        titulo={primeiroNome ? `Olá, ${primeiroNome}` : 'Painel do monitor'}
        descricao={
          !dados
            ? 'Seus anúncios, sua agenda e seu dinheiro em um lugar.'
            : pendentes
              ? `${pendentes} ${pendentes === 1 ? 'pedido em aberto' : 'pedidos em aberto'}.`
              : dados.anuncios.length
                ? 'Tudo em dia por aqui.'
                : 'Comece pelo seu primeiro anúncio. Leva uns 5 minutos.'
        }
        acoes={
          <>
            <Link href="/monitorias" className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground">Ver vitrine</Link>
            <Link href="/monitorias/painel/anuncios/novo">
              <Button className="rounded-xl"><Plus className="mr-1.5 h-4 w-4" /> Novo anúncio</Button>
            </Link>
          </>
        }
      />
      <nav className="-mx-4 mb-7 flex gap-1 overflow-x-auto border-b border-border px-4 [scrollbar-width:none] sm:mx-0 sm:px-0" aria-label="Seções do painel">
        {ABAS.map((a) => {
          const ativa = aba === a.chave
          return (
            <Link
              key={a.chave}
              href={a.href}
              aria-current={ativa ? 'page' : undefined}
              className={cn('relative flex shrink-0 items-center gap-2 px-3 pb-3 pt-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', ativa ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              <a.icone className="h-4 w-4" strokeWidth={1.75} />
              {a.rotulo}
              {a.chave === 'pedidos' && pendentes ? <span className="rounded-md bg-primary px-1.5 text-[11px] font-semibold tabular-nums text-primary-foreground">{pendentes}</span> : null}
              {ativa && <motion.span layoutId="aba-painel" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            </Link>
          )
        })}
      </nav>
      {erro && <CaixaErro mensagem={erro} />}
      {!dados && !erro ? (
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <Esqueleto className="h-64" />
          <Esqueleto className="h-64" />
        </div>
      ) : dados ? (
        <AnimatePresence mode="wait">
          <motion.div key={aba} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
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
