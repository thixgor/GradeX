'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, CalendarCheck, ChevronRight, FileText, GraduationCap, MessagesSquare, Receipt, Search, Sparkles, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, Esqueleto, SeloStatus, Vazio, api } from '@/components/monitorias/base'
import { formatarCentavos } from '@/lib/monitorias/dinheiro'
import { formatarDuracao } from '@/lib/monitorias/agenda'
import { formatarEmBrasilia } from '@/lib/fuso-brasilia'
import { cn } from '@/lib/utils'
import type { StatusReserva } from '@/lib/monitorias/tipos'

export interface ItemReserva {
  id: string
  anuncioTitulo: string
  status: StatusReserva
  origem: string
  inicio: string | null
  duracaoMin: number | null
  vagas: number
  valorPorPessoaCentavos: number | null
  gratis: boolean
  prazoPagamento: string | null
  souOrganizador: boolean
  updatedAt: string
  monitor: { nome: string; fotoUrl: string | null } | null
  meuAssento: {
    id: string
    status: string
    pagoCentavos: number | null
    reembolsadoCentavos: number
    contratoId: string | null
    temComprovante: boolean
  } | null
  alunosPagos?: number
  temMateriais: boolean
}

type Resumo = { aulas: number; proximas: number; investidoCentavos?: number; vendidoCentavos?: number }

const SITUACAO_PAGAMENTO: Record<string, string> = {
  aguardando_assinatura: 'Falta assinar',
  aguardando_pagamento: 'Falta pagar',
  paga: 'Pago, em garantia',
  gratis: 'Grátis',
  concluida: 'Pago',
  reembolso_processando: 'Reembolso em andamento',
  reembolsada: 'Reembolsado',
  cancelada: 'Cancelado',
  expirada: 'Expirado',
}

export function ListaReservas({ papel }: { papel: 'aluno' | 'monitor' }) {
  const [escopo, setEscopo] = useState<'ativas' | 'todas'>('ativas')
  const [itens, setItens] = useState<ItemReserva[] | null>(null)
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [cursor, setCursor] = useState<string | null>(null)
  const [carregandoMais, setCarregandoMais] = useState(false)

  useEffect(() => {
    setItens(null)
    setCursor(null)
    api<{ reservas: ItemReserva[]; resumo: Resumo | null; proximoCursor: string | null }>(`/api/monitorias/reservas?papel=${papel}&escopo=${escopo}`)
      .then((r) => {
        setItens(r.reservas)
        if (r.resumo) setResumo(r.resumo)
        setCursor(r.proximoCursor)
      })
      .catch(() => setItens([]))
  }, [papel, escopo])

  async function carregarMais() {
    if (!cursor) return
    setCarregandoMais(true)
    try {
      const r = await api<{ reservas: ItemReserva[]; proximoCursor: string | null }>(
        `/api/monitorias/reservas?papel=${papel}&escopo=${escopo}&cursor=${encodeURIComponent(cursor)}`,
      )
      setItens((atual) => [...(atual || []), ...r.reservas.filter((x) => !(atual || []).some((y) => y.id === x.id))])
      setCursor(r.proximoCursor)
    } finally {
      setCarregandoMais(false)
    }
  }

  const tiles = resumo
    ? [
        { icone: GraduationCap, rotulo: papel === 'aluno' ? 'Monitorias contratadas' : 'Aulas dadas', valor: String(resumo.aulas) },
        { icone: CalendarCheck, rotulo: 'Próximas aulas', valor: String(resumo.proximas) },
        papel === 'aluno'
          ? { icone: Wallet, rotulo: 'Investido em você', valor: formatarCentavos(resumo.investidoCentavos || 0) }
          : { icone: Wallet, rotulo: 'Vendido (bruto)', valor: formatarCentavos(resumo.vendidoCentavos || 0) },
      ]
    : []

  return (
    <div>
      {tiles.length > 0 && (resumo!.aulas > 0 || resumo!.proximas > 0) && (
        <dl className="mb-6 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card">
          {tiles.map((t) => (
            <div key={t.rotulo} className="px-3 py-4 sm:px-5">
              <dt className="text-xs text-muted-foreground">{t.rotulo}</dt>
              <dd className="mt-1 font-heading text-lg font-semibold tabular-nums sm:text-2xl">{t.valor}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="mb-4 inline-flex rounded-xl bg-muted/60 p-1" role="tablist">
        {(['ativas', 'todas'] as const).map((e) => (
          <button key={e} type="button" role="tab" aria-selected={escopo === e} onClick={() => setEscopo(e)} className={cn('relative rounded-lg px-4 py-1.5 text-sm font-medium transition-colors', escopo === e ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}>
            {escopo === e && <motion.span layoutId={`escopo-${papel}`} className="absolute inset-0 rounded-lg bg-card shadow-sm" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            <span className="relative">{e === 'ativas' ? 'Em andamento' : 'Histórico'}</span>
          </button>
        ))}
      </div>
      {!itens ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Esqueleto key={i} className="h-20" />)}</div>
      ) : itens.length === 0 ? (
        <Vazio
          icone={<CalendarCheck className="h-5 w-5" />}
          titulo={escopo === 'ativas' ? (papel === 'aluno' ? 'Nenhuma monitoria em andamento' : 'Nenhum pedido em andamento') : papel === 'aluno' ? 'Sua primeira monitoria começa aqui' : 'Nenhum pedido ainda'}
          texto={
            papel === 'aluno'
              ? 'Uma hora com quem já passou pela mesma prova economiza semanas estudando sozinho. O monitor só recebe depois da aula.'
              : 'Anúncios com vídeo, foto e aula grátis recebem mais pedidos. Capriche no seu e compartilhe o link.'
          }
          acao={
            papel === 'aluno' ? (
              <Link href="/monitorias"><Button className="rounded-xl"><Search className="mr-2 h-4 w-4" /> Encontrar monitor</Button></Link>
            ) : (
              <Link href="/monitorias/painel"><Button className="rounded-xl"><Sparkles className="mr-2 h-4 w-4" /> Melhorar meus anúncios</Button></Link>
            )
          }
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          <AnimatePresence>
            {itens.map((r, i) => (
              <motion.li key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }} className="transition-colors hover:bg-muted/30">
                <Link href={`/monitorias/reservas/${r.id}`} className="group flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-muted/60">
                    {r.inicio ? (
                      <>
                        <span className="text-[11px] text-muted-foreground">{formatarEmBrasilia(r.inicio, { month: 'short' }).replace('.', '')}</span>
                        <span className="font-heading text-lg font-semibold leading-none tabular-nums">{formatarEmBrasilia(r.inicio, { day: '2-digit' })}</span>
                      </>
                    ) : (
                      <GraduationCap className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold group-hover:text-primary">{r.anuncioTitulo}</p>
                    {r.monitor && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Avatar nome={r.monitor.nome} url={r.monitor.fotoUrl} tamanho={16} /> {r.monitor.nome}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {r.inicio ? `${formatarEmBrasilia(r.inicio, { weekday: 'short', hour: '2-digit', minute: '2-digit' })} (Brasília)` : 'Data a combinar'}
                      {r.duracaoMin ? `, ${formatarDuracao(r.duracaoMin)}` : ''}
                      {r.vagas > 1 ? `, grupo de ${r.vagas}` : ''}
                      {r.gratis ? ', grátis' : r.valorPorPessoaCentavos ? `, ${formatarCentavos(r.valorPorPessoaCentavos)}` : ''}
                    </p>
                  </div>
                  <SeloStatus status={r.status} className="hidden sm:inline-flex" />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
                <Atalhos r={r} papel={papel} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
      {cursor && itens && itens.length > 0 && (
        <div className="mt-4 text-center">
          <Button variant="outline" className="rounded-xl" onClick={carregarMais} disabled={carregandoMais}>
            {carregandoMais ? 'Carregando' : 'Carregar mais'}
          </Button>
        </div>
      )}
    </div>
  )
}

/** Linha de atalhos: o que a pessoa costuma procurar depois (documentos, histórico). */
function Atalhos({ r, papel }: { r: ItemReserva; papel: 'aluno' | 'monitor' }) {
  const a = r.meuAssento
  const itens: Array<{ href: string; rotulo: string; icone: typeof FileText; baixar?: boolean }> = []
  if (a?.contratoId) itens.push({ href: `/api/monitorias/documentos/contrato/${a.contratoId}`, rotulo: 'Contrato', icone: FileText, baixar: true })
  if (a?.temComprovante) itens.push({ href: `/api/monitorias/documentos/comprovante/${a.id}`, rotulo: 'Comprovante', icone: Receipt, baixar: true })
  if (r.temMateriais) itens.push({ href: `/monitorias/reservas/${r.id}`, rotulo: 'Materiais', icone: BookOpen })
  if (r.status !== 'solicitada') itens.push({ href: `/api/monitorias/documentos/conversa/${r.id}`, rotulo: 'Conversa (PDF)', icone: MessagesSquare, baixar: true })
  const pagamento = a ? SITUACAO_PAGAMENTO[a.status] : null
  const valor = a?.pagoCentavos ? formatarCentavos(a.pagoCentavos - (a.reembolsadoCentavos || 0)) : null
  if (!itens.length && !pagamento && papel === 'aluno') return null
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 pb-3 pl-20 text-xs">
      {papel === 'aluno' && pagamento && (
        <span className="font-medium text-muted-foreground">
          {pagamento}
          {valor ? `, ${valor}` : ''}
          {a?.reembolsadoCentavos ? ` (devolvido ${formatarCentavos(a.reembolsadoCentavos)})` : ''}
        </span>
      )}
      {papel === 'monitor' && r.alunosPagos !== undefined && r.alunosPagos > 0 && (
        <span className="font-medium text-muted-foreground">{r.alunosPagos} aluno{r.alunosPagos > 1 ? 's' : ''} pago{r.alunosPagos > 1 ? 's' : ''}</span>
      )}
      <span className="ml-auto flex flex-wrap gap-1.5">
        {itens.map((x) => (
          <a key={x.rotulo} href={x.href} className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 text-muted-foreground transition hover:bg-primary/10 hover:text-primary">
            <x.icone className="h-3 w-3" /> {x.rotulo}
          </a>
        ))}
      </span>
    </div>
  )
}
