'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle, BadgeCheck, Ban, Brain, CalendarClock, Check, Copy, Eye, FileUp, Flag, Gavel, Loader2, RotateCcw, ShieldAlert, Trash2, Video, Wallet, X,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, CaixaAviso, CaixaErro, Esqueleto, Selo, SeloStatus, api } from '@/components/monitorias/base'
import { AdminSalaDeVideo } from '@/components/monitorias/admin-sala-de-video'
import { AdminAulas } from '@/components/monitorias/admin-aulas'
import { AdminContatoPorFora } from '@/components/monitorias/admin-contato-por-fora'
import { AdminResumosIA } from '@/components/monitorias/resumo/admin-resumos'
import { formatarCentavos, interpretarValorEmReais } from '@/lib/monitorias/dinheiro'
import { formatarDuracao } from '@/lib/monitorias/agenda'
import { formatarEmBrasilia } from '@/lib/fuso-brasilia'
import { cn } from '@/lib/utils'
import type { StatusReserva } from '@/lib/monitorias/tipos'

type Aba = 'aulas' | 'moderacao' | 'disputas' | 'repasses' | 'resumos' | 'perguntas' | 'contato' | 'sala'
const ABAS: Aba[] = ['aulas', 'moderacao', 'disputas', 'repasses', 'resumos', 'perguntas', 'contato', 'sala']

interface Resumo {
  emAnalise: number
  revisoes: number
  disputas: number
  liberados: number
  payoutsAbertos: number
  denunciadas: number
  reembolsosFalhos: number
  contatoPorFora: number
  resumosFalhos?: number
}

export default function AdminMonitorias() {
  const [aba, setAbaEstado] = useState<Aba>('aulas')
  // ?aba=contato (link do aviso de "tentativas de contato por fora").
  useEffect(() => {
    const pedida = new URLSearchParams(window.location.search).get('aba') as Aba | null
    if (pedida && ABAS.includes(pedida)) setAbaEstado(pedida)
  }, [])
  const setAba = (a: Aba) => {
    setAbaEstado(a)
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('aba', a)
      window.history.replaceState(null, '', url)
    } catch {
      /* nada */
    }
  }
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const recarregarResumo = useCallback(() => {
    api<Resumo>('/api/admin/monitorias/resumo').then(setResumo).catch(() => {})
  }, [])
  useEffect(() => recarregarResumo(), [recarregarResumo])

  const abas: Array<{ chave: Aba; rotulo: string; n?: number; icone: typeof Gavel }> = [
    { chave: 'aulas', rotulo: 'Aulas', icone: CalendarClock },
    { chave: 'moderacao', rotulo: 'Moderação', n: (resumo?.emAnalise || 0) + (resumo?.revisoes || 0), icone: BadgeCheck },
    { chave: 'disputas', rotulo: 'Disputas', n: resumo?.disputas, icone: Gavel },
    { chave: 'repasses', rotulo: 'Repasses', n: (resumo?.payoutsAbertos || 0) + (resumo?.liberados ? 1 : 0), icone: Wallet },
    { chave: 'resumos', rotulo: 'Resumos por IA', n: resumo?.resumosFalhos, icone: Brain },
    { chave: 'perguntas', rotulo: 'Denúncias', n: resumo?.denunciadas, icone: Flag },
    { chave: 'contato', rotulo: 'Contato por fora', n: resumo?.contatoPorFora, icone: ShieldAlert },
    { chave: 'sala', rotulo: 'Sala de vídeo', icone: Video },
  ]

  return (
    <AppShell headerTitle="Monitorias" headerSubtitle="Aulas, moderação, disputas e repasses">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {resumo?.reembolsosFalhos ? (
          <CaixaAviso className="mb-4"><AlertTriangle className="mr-1 inline h-4 w-4" /> {resumo.reembolsosFalhos} reembolso(s) falharam várias vezes no Mercado Pago — confira na aba Disputas (todas) e no painel do MP.</CaixaAviso>
        ) : null}
        <nav className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1">
          {abas.map((a) => (
            <button key={a.chave} type="button" onClick={() => setAba(a.chave)} className={cn('relative flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold', aba === a.chave ? 'text-primary-foreground' : 'text-muted-foreground')}>
              {aba === a.chave && <motion.span layoutId="aba-admin-mon" className="absolute inset-0 rounded-xl bg-primary" />}
              <a.icone className="relative h-4 w-4" />
              <span className="relative">{a.rotulo}</span>
              {a.n ? <span className="relative rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-amber-950">{a.n}</span> : null}
            </button>
          ))}
        </nav>
        <AnimatePresence mode="wait">
          <motion.div key={aba} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {aba === 'aulas' && <AdminAulas />}
            {aba === 'moderacao' && <Moderacao onMudou={recarregarResumo} />}
            {aba === 'disputas' && <Disputas onMudou={recarregarResumo} />}
            {aba === 'repasses' && <Repasses onMudou={recarregarResumo} />}
            {aba === 'resumos' && <AdminResumosIA onMudou={recarregarResumo} />}
            {aba === 'perguntas' && <Denuncias onMudou={recarregarResumo} />}
            {aba === 'contato' && <AdminContatoPorFora onMudou={recarregarResumo} />}
            {aba === 'sala' && <AdminSalaDeVideo />}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppShell>
  )
}

// ─── Moderação ──────────────────────────────────────────────────────────

function Moderacao({ onMudou }: { onMudou: () => void }) {
  const [fila, setFila] = useState<'analise' | 'revisoes' | 'todos' | 'excluidos'>('analise')
  const [itens, setItens] = useState<any[] | null>(null)
  const [aberto, setAberto] = useState<string | null>(null)
  const carregar = useCallback(() => {
    setItens(null)
    api<{ itens: any[] }>(`/api/admin/monitorias/anuncios?fila=${fila}`).then((r) => setItens(r.itens)).catch(() => setItens([]))
  }, [fila])
  useEffect(() => carregar(), [carregar])

  async function moderar(id: string, acao: string) {
    if (acao === 'excluir' && !window.confirm('Excluir o anúncio? Sem reservas ele é apagado de vez; com reservas some da vitrine e do painel do monitor, e as aulas já marcadas continuam.')) return
    const precisaMotivo = ['rejeitar', 'suspender', 'rejeitar_revisao', 'excluir'].includes(acao)
    const motivo = precisaMotivo ? window.prompt('Motivo (o monitor vai ler):') : undefined
    if (precisaMotivo && !motivo) return
    try {
      const r = await api<{ apagadoDeVez?: boolean }>(`/api/admin/monitorias/anuncios/${id}`, { method: 'POST', json: { acao, ...(motivo ? { motivo } : {}) } })
      if (acao === 'excluir') alert(r.apagadoDeVez ? 'Anúncio apagado de vez (não tinha reservas).' : 'Anúncio excluído. Ele fica no filtro "Excluídos" porque tem reservas no histórico.')
      carregar()
      onMudou()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro')
    }
  }

  async function tutor(tutorId: string, acao: 'suspender' | 'reativar' | 'cancelar_troca_pix') {
    const motivo = window.prompt('Motivo (vai por e-mail ao monitor):')
    if (!motivo) return
    try {
      await api(`/api/admin/monitorias/tutores/${tutorId}`, { method: 'POST', json: { acao, motivo } })
      carregar()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro')
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {(['analise', 'revisoes', 'todos', 'excluidos'] as const).map((f) => (
          <Button key={f} size="sm" variant={fila === f ? 'default' : 'outline'} onClick={() => setFila(f)}>
            {f === 'analise' ? 'Novos para análise' : f === 'revisoes' ? 'Alterações pendentes' : f === 'todos' ? 'Todos' : 'Excluídos'}
          </Button>
        ))}
      </div>
      {!itens ? <Esqueleto className="h-64" /> : itens.length === 0 ? <p className="text-sm text-muted-foreground">Nada na fila. 🎉</p> : (
        <ul className="space-y-3">
          {itens.map((a) => {
            const c = a.revisaoPendente || a.conteudo
            const m = a.monitor
            const pend = (m.requisitos as Array<{ ok: boolean; rotulo: string }>).filter((x) => !x.ok)
            return (
              <li key={a.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start gap-3">
                  <Avatar nome={m.nome} url={m.fotoUrl} tamanho={48} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{c.titulo}</p>
                      <Selo tom="info">{a.status}</Selo>
                      {a.revisaoPendente && <Selo tom="alerta">alteração pendente</Selo>}
                      {m.status === 'suspenso' && <Selo tom="erro">monitor suspenso</Selo>}
                      {a.excluido && <Selo tom="erro">excluído</Selo>}
                    </div>
                    {a.excluido && <p className="mt-0.5 text-xs text-rose-600">Excluído em {formatarEmBrasilia(a.excluido.em, { dateStyle: 'short', timeStyle: 'short' })}: {a.excluido.motivo}</p>}
                    <p className="text-xs text-muted-foreground">{m.nome} · {m.nomeCivil || 'sem nome civil'} · {m.email} · CPF {m.cpf || '—'} {m.cpfVerificado ? '✓ Receita' : ''} · {m.strikes} strike(s)</p>
                    {pend.length > 0 && <p className="mt-1 text-xs text-rose-600">Pendências: {pend.map((x) => x.rotulo).join('; ')}</p>}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setAberto(aberto === a.id ? null : a.id)}><Eye className="mr-1 h-4 w-4" /> {aberto === a.id ? 'Fechar' : 'Conferir'}</Button>
                </div>
                <AnimatePresence>
                  {aberto === a.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="mt-4 grid gap-4 border-t border-border pt-4 text-sm md:grid-cols-2">
                        <div className="space-y-2">
                          <p><strong>Matéria:</strong> {c.materia}</p>
                          <p><strong>Conteúdos:</strong> {c.conteudos.join(', ')}</p>
                          <p className="whitespace-pre-line"><strong>Descrição:</strong> {c.descricao}</p>
                          <p><strong>Preço:</strong> {formatarCentavos(c.preco.valorCentavos)}/{c.preco.modo} · grupo {c.grupo.ativo ? `até ${c.grupo.maxAlunos}` : 'não'} · grátis {c.aulaGratis.ativa ? formatarDuracao(c.aulaGratis.duracaoMin) : 'não'}</p>
                          <p><strong>Modos:</strong> {[c.modos.direto && 'direto', c.modos.negociacao && 'negociação', c.modos.aCombinar && 'a combinar'].filter(Boolean).join(', ')}</p>
                          <p><strong>Vídeos:</strong> {c.videos.map((v: any) => `${v.provider}:${v.id}`).join(', ') || '—'}</p>
                          <p><strong>Materiais:</strong> {c.materiais.map((x: any) => `${x.titulo} (${x.dominio})`).join(', ') || '—'}</p>
                        </div>
                        <div className="space-y-2">
                          <p><strong>Título do perfil:</strong> {m.titulo}</p>
                          <p><strong>Bio:</strong> {m.bio}</p>
                          <p className="whitespace-pre-line"><strong>História:</strong> {m.historia}</p>
                          {c.faq.length > 0 && <p><strong>FAQ:</strong> {c.faq.map((x: any) => x.pergunta).join(' · ')}</p>}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="mt-3 flex flex-wrap gap-2">
                  {a.excluido ? (
                    <Button size="sm" variant="outline" onClick={() => moderar(a.id, 'restaurar')}><RotateCcw className="mr-1 h-4 w-4" /> Restaurar (volta suspenso)</Button>
                  ) : <>
                  {a.status === 'em_analise' && <><Button size="sm" onClick={() => moderar(a.id, 'aprovar')}><Check className="mr-1 h-4 w-4" /> Aprovar</Button><Button size="sm" variant="outline" onClick={() => moderar(a.id, 'rejeitar')}><X className="mr-1 h-4 w-4" /> Pedir ajustes</Button></>}
                  {a.revisaoPendente && <><Button size="sm" onClick={() => moderar(a.id, 'aprovar_revisao')}><Check className="mr-1 h-4 w-4" /> Aprovar alteração</Button><Button size="sm" variant="outline" onClick={() => moderar(a.id, 'rejeitar_revisao')}>Recusar alteração</Button></>}
                  {['publicado', 'pausado'].includes(a.status) && <Button size="sm" variant="outline" className="text-rose-600" onClick={() => moderar(a.id, 'suspender')}><Ban className="mr-1 h-4 w-4" /> Suspender anúncio</Button>}
                  {a.status === 'suspenso' && <Button size="sm" variant="outline" onClick={() => moderar(a.id, 'reativar')}><RotateCcw className="mr-1 h-4 w-4" /> Reativar</Button>}
                  <Button size="sm" variant="outline" className="border-rose-300 text-rose-600" onClick={() => moderar(a.id, 'excluir')}><Trash2 className="mr-1 h-4 w-4" /> Excluir anúncio</Button>
                  {m.status === 'ativo' ? <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => tutor(m.tutorId, 'suspender')}>Suspender monitor</Button> : <Button size="sm" variant="ghost" onClick={() => tutor(m.tutorId, 'reativar')}>Reativar monitor</Button>}
                  </>}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ─── Disputas ───────────────────────────────────────────────────────────

function Disputas({ onMudou }: { onMudou: () => void }) {
  const [filtro, setFiltro] = useState<'em_disputa' | 'todas'>('em_disputa')
  const [reservas, setReservas] = useState<any[] | null>(null)
  const [decidindo, setDecidindo] = useState<any | null>(null)
  const carregar = useCallback(() => {
    setReservas(null)
    api<{ reservas: any[] }>(`/api/admin/monitorias/reservas?status=${filtro}`).then((r) => setReservas(r.reservas)).catch(() => setReservas([]))
  }, [filtro])
  useEffect(() => carregar(), [carregar])

  return (
    <div>
      <RevisoesDeCancelamento onMudou={onMudou} />
      <div className="mb-4 flex gap-2">
        <Button size="sm" variant={filtro === 'em_disputa' ? 'default' : 'outline'} onClick={() => setFiltro('em_disputa')}>Em disputa</Button>
        <Button size="sm" variant={filtro === 'todas' ? 'default' : 'outline'} onClick={() => setFiltro('todas')}>Todas as reservas</Button>
      </div>
      {!reservas ? <Esqueleto className="h-64" /> : reservas.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma disputa aberta. 🎉</p> : (
        <ul className="space-y-3">
          {reservas.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{r.anuncioTitulo}</p>
                <SeloStatus status={r.status as StatusReserva} />
                <span className="text-xs text-muted-foreground">{r.inicio ? formatarEmBrasilia(r.inicio) : ''}</span>
                <a href={`/monitorias/reservas/${r.id}`} target="_blank" rel="noreferrer" className="ml-auto text-xs font-semibold text-primary hover:underline">Abrir sala</a>
              </div>
              {r.disputa && <p className="mt-2 rounded-lg bg-amber-500/10 p-2 text-xs"><strong>Relato:</strong> {r.disputa.motivo}{r.disputa.decisao ? ` — Decisão: ${r.disputa.decisao}` : ''}</p>}
              <PresencaNaSala presenca={r.presenca || []} />
              <ul className="mt-2 space-y-1 text-xs">
                {r.assentos.map((a: any) => (
                  <li key={a.id} className="flex flex-wrap gap-2">
                    <span className="font-medium">{a.alunoNome}</span>
                    <span className="text-muted-foreground">{a.status}</span>
                    <span>{formatarCentavos(a.valorCentavos)}{a.pagoCentavos ? ` (pagou ${formatarCentavos(a.pagoCentavos)})` : ''}</span>
                    {a.reembolsos.some((x: any) => x.status === 'falhou') && <Selo tom="erro">reembolso falhou</Selo>}
                    {a.falta && (
                      <Selo tom="alerta">
                        falta {a.falta.fonte === 'sala' ? 'registrada pela sala' : 'informada pelo monitor'}
                        {a.falta.evidencia ? ` · monitor ${a.falta.evidencia.minutosMonitor} min na sala` : ''}
                        {a.falta.evidencia?.minutosAluno != null ? `, aluno ${a.falta.evidencia.minutosAluno} min` : ''}
                      </Selo>
                    )}
                    {a.cancelamentoTardio && <Selo tom="info">cancelou com {a.cancelamentoTardio.horasAntes} h · {a.cancelamentoTardio.pctDevolvido}% devolvido</Selo>}
                  </li>
                ))}
              </ul>
              {(r.status === 'em_disputa' || r.assentos.some((a: any) => ['paga', 'concluida'].includes(a.status))) && (
                <Button size="sm" className="mt-3" onClick={() => setDecidindo(r)}><Gavel className="mr-1 h-4 w-4" /> Decidir / reembolsar</Button>
              )}
            </li>
          ))}
        </ul>
      )}
      <AnimatePresence>
        {decidindo && <Decisao reserva={decidindo} onFechar={() => setDecidindo(null)} onFeito={() => { setDecidindo(null); carregar(); onMudou() }} />}
      </AnimatePresence>
    </div>
  )
}

interface RevisaoDeCancelamento {
  participacaoId: string
  reservaId: string
  anuncioTitulo: string
  inicio: string | null
  alunoNome: string
  status: string
  valorCentavos: number
  horasAntes: number
  pctDevolvido: number
  devolvidoCentavos: number
  retidoCentavos: number
  liberarApos: string
  revisao: { em: string; motivo: string; ticketId?: string; decididaEm?: string; decisao?: 'manter' | 'devolver'; nota?: string }
}

/**
 * Pedidos de revisão de cancelamento tardio (força maior, contrato 4.6). Enquanto
 * o pedido está aberto, o valor retido não vai ao monitor. "Devolver" = força
 * maior aceita: o aluno recebe o restante, como num cancelamento no prazo.
 */
function RevisoesDeCancelamento({ onMudou }: { onMudou: () => void }) {
  const [lista, setLista] = useState<RevisaoDeCancelamento[] | null>(null)
  const [notas, setNotas] = useState<Record<string, string>>({})
  const [ocupado, setOcupado] = useState('')
  const [erro, setErro] = useState('')
  const carregar = useCallback(() => {
    api<{ revisoes: RevisaoDeCancelamento[] }>('/api/admin/monitorias/revisoes').then((r) => setLista(r.revisoes)).catch(() => setLista([]))
  }, [])
  useEffect(() => carregar(), [carregar])

  async function decidir(r: RevisaoDeCancelamento, decisao: 'manter' | 'devolver') {
    setOcupado(`${r.participacaoId}:${decisao}`)
    setErro('')
    try {
      const out = await api<{ ok: boolean; falha: string | null }>('/api/admin/monitorias/revisoes', { method: 'POST', json: { participacaoId: r.participacaoId, decisao, nota: notas[r.participacaoId] || '' } })
      if (out.falha) setErro(`${r.alunoNome}: ${out.falha}`)
      carregar()
      onMudou()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro')
    } finally {
      setOcupado('')
    }
  }

  if (!lista?.length) return null
  return (
    <section className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4" aria-label="Revisões de cancelamento">
      <h3 className="font-heading text-base font-semibold">Revisões de cancelamento (força maior)</h3>
      <p className="text-xs text-muted-foreground">Enquanto o pedido está aberto, o valor retido não é liberado ao monitor.</p>
      {erro && <CaixaErro mensagem={erro} className="mt-2" />}
      <ul className="mt-3 space-y-3">
        {lista.map((r) => {
          const decidida = !!r.revisao.decididaEm
          const nota = notas[r.participacaoId] || ''
          return (
            <li key={r.participacaoId} className="rounded-xl border border-border bg-card p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{r.anuncioTitulo}</p>
                <span className="text-xs text-muted-foreground">{r.alunoNome}{r.inicio ? ` · aula ${formatarEmBrasilia(r.inicio)}` : ''}</span>
                {decidida ? <Selo tom={r.revisao.decisao === 'devolver' ? 'sucesso' : 'neutro'}>{r.revisao.decisao === 'devolver' ? 'devolvido' : 'multa mantida'}</Selo> : <Selo tom="alerta">aguardando decisão</Selo>}
                <a href={`/monitorias/reservas/${r.reservaId}`} target="_blank" rel="noreferrer" className="ml-auto text-xs font-semibold text-primary hover:underline">Abrir reserva</a>
              </div>
              <p className="mt-1 text-xs">
                Cancelou com {r.horasAntes.toLocaleString('pt-BR')} h de antecedência: devolvidos {formatarCentavos(r.devolvidoCentavos)} ({r.pctDevolvido}%), retidos {formatarCentavos(r.retidoCentavos)} de {formatarCentavos(r.valorCentavos)}.
              </p>
              <p className="mt-2 rounded-lg bg-amber-500/10 p-2 text-xs"><strong>Relato:</strong> {r.revisao.motivo}</p>
              {decidida ? (
                r.revisao.nota && <p className="mt-2 text-xs text-muted-foreground"><strong>Decisão:</strong> {r.revisao.nota}</p>
              ) : (
                <>
                  <Textarea value={nota} onChange={(e) => setNotas((n) => ({ ...n, [r.participacaoId]: e.target.value }))} rows={2} className="mt-2" placeholder="Justificativa (vai para aluno e monitor)" />
                  <div className="mt-2 flex flex-wrap justify-end gap-2">
                    <Button size="sm" variant="outline" disabled={!!ocupado || nota.trim().length < 5} onClick={() => void decidir(r, 'manter')}>
                      {ocupado === `${r.participacaoId}:manter` ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Manter a multa'}
                    </Button>
                    <Button size="sm" disabled={!!ocupado || nota.trim().length < 5} onClick={() => void decidir(r, 'devolver')}>
                      {ocupado === `${r.participacaoId}:devolver` ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aceitar e devolver o restante'}
                    </Button>
                  </div>
                </>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/**
 * Registro mínimo da sala de aula (entrada, última atividade, minutos): ajuda a
 * decidir "o monitor não apareceu". É evidência, não decisão: nada aqui muda a reserva.
 */
function PresencaNaSala({ presenca }: { presenca: Array<{ pid: string; papel: 'monitor' | 'aluno'; primeiraEntrada: string; ultimaAtividade: string; minutos: number; retransmitida: boolean }> }) {
  if (!presenca.length) return <p className="mt-2 text-xs text-muted-foreground">Sala de aula: ninguém entrou pela plataforma.</p>
  const monitores = presenca.filter((p) => p.papel === 'monitor').length
  return (
    <div className="mt-2 rounded-lg bg-muted/50 p-2 text-xs">
      <p className="font-semibold">Presença na sala de aula{monitores === 0 ? ' (o monitor não entrou pela plataforma)' : ''}</p>
      <ul className="mt-1 space-y-0.5">
        {presenca.map((p) => (
          <li key={p.pid}>
            {p.papel === 'monitor' ? 'Monitor' : `Aluno ${presenca.filter((x) => x.papel === 'aluno').indexOf(p) + 1}`}: entrou {formatarEmBrasilia(p.primeiraEntrada, { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}, último sinal{' '}
            {formatarEmBrasilia(p.ultimaAtividade, { hour: '2-digit', minute: '2-digit' })}, {p.minutos} min na sala{p.retransmitida ? ' (via relé)' : ''}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Decisao({ reserva, onFechar, onFeito }: { reserva: any; onFechar: () => void; onFeito: () => void }) {
  const pagos = reserva.assentos.filter((a: any) => ['paga', 'concluida'].includes(a.status))
  const [decisao, setDecisao] = useState<'liberar' | 'reembolsar'>('reembolsar')
  const [valores, setValores] = useState<Record<string, string>>({})
  const [marcados, setMarcados] = useState<Record<string, boolean>>(Object.fromEntries(pagos.map((a: any) => [a.id, true])))
  const [culpa, setCulpa] = useState(false)
  const [comResumo, setComResumo] = useState(false)
  const [nota, setNota] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')

  async function enviar() {
    setOcupado(true)
    setErro('')
    try {
      const reembolsos = decisao === 'reembolsar'
        ? pagos.filter((a: any) => marcados[a.id]).map((a: any) => ({ participacaoId: a.id, valorCentavos: valores[a.id]?.trim() ? interpretarValorEmReais(valores[a.id]) : null }))
        : []
      const r = await api<{ falhas: string[] }>(`/api/admin/monitorias/reservas/${reserva.id}`, {
        method: 'POST',
        json: { decisao, reembolsos, culpaDoMonitor: culpa, nota, ...(decisao === 'reembolsar' && comResumo ? { reembolsarResumo: true } : {}) },
      })
      if (r.falhas?.length) alert(`Algumas devoluções falharam (o sistema tenta de novo):\n${r.falhas.join('\n')}`)
      onFeito()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <motion.div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onFechar}>
      <motion.div initial={{ y: 30 }} animate={{ y: 0 }} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-card p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-heading text-lg font-semibold">Decisão: {reserva.anuncioTitulo}</h3>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant={decisao === 'reembolsar' ? 'default' : 'outline'} onClick={() => setDecisao('reembolsar')}>Reembolsar</Button>
          <Button size="sm" variant={decisao === 'liberar' ? 'default' : 'outline'} onClick={() => setDecisao('liberar')}>Manter aula / liberar valor</Button>
        </div>
        {decisao === 'reembolsar' && (
          <ul className="mt-3 space-y-2">
            {pagos.map((a: any) => (
              <li key={a.id} className="flex flex-wrap items-center gap-2 text-sm">
                <input type="checkbox" checked={!!marcados[a.id]} onChange={(e) => setMarcados((m) => ({ ...m, [a.id]: e.target.checked }))} />
                <span className="flex-1">{a.alunoNome} ({formatarCentavos(a.valorCentavos)})</span>
                <input value={valores[a.id] || ''} onChange={(e) => setValores((v) => ({ ...v, [a.id]: e.target.value }))} placeholder="vazio = total" className="h-8 w-28 rounded-lg border border-border bg-background px-2 text-xs" />
              </li>
            ))}
          </ul>
        )}
        {decisao === 'reembolsar' && (
          <label className="mt-3 flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={comResumo} onChange={(e) => setComResumo(e.target.checked)} />
            <span>
              Reembolsar também o Resumo por IA dos assentos marcados
              <span className="block text-xs text-muted-foreground">Sem marcar: reembolso integral antes da entrega leva o resumo junto; depois de entregue, o resumo fica (serviço prestado).</span>
            </span>
          </label>
        )}
        <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={culpa} onChange={(e) => setCulpa(e.target.checked)} /> Falta/culpa do monitor (gera strike)</label>
        <Textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={3} className="mt-3" placeholder="Justificativa (vai para aluno e monitor)" />
        {erro && <CaixaErro mensagem={erro} className="mt-2" />}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onFechar}>Cancelar</Button>
          <Button onClick={enviar} disabled={ocupado || nota.trim().length < 5}>{ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar decisão'}</Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Repasses ───────────────────────────────────────────────────────────

function Repasses({ onMudou }: { onMudou: () => void }) {
  const [dados, setDados] = useState<any | null>(null)
  const [revelado, setRevelado] = useState<Record<string, any>>({})
  const [e2e, setE2e] = useState<Record<string, string>>({})
  const [ocupado, setOcupado] = useState<string | null>(null)
  const carregar = useCallback(() => {
    api('/api/admin/monitorias/repasses').then(setDados).catch(() => setDados({ fila: [], payouts: [], emGarantiaCentavos: 0 }))
  }, [])
  useEffect(() => carregar(), [carregar])

  async function executar(chave: string, fn: () => Promise<unknown>) {
    setOcupado(chave)
    try {
      await fn()
      carregar()
      onMudou()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro')
    } finally {
      setOcupado(null)
    }
  }

  if (!dados) return <Esqueleto className="h-64" />
  const abertos = dados.payouts.filter((p: any) => p.status === 'aberto')
  const pagos = dados.payouts.filter((p: any) => p.status === 'pago')

  return (
    <div className="space-y-6">
      <CaixaAviso tom="info">
        Fluxo: <strong>1.</strong> crie o pagamento do monitor → <strong>2.</strong> revele a chave PIX e faça o PIX pelo banco da empresa (confira o nome do titular!) → <strong>3.</strong> anexe o comprovante → <strong>4.</strong> informe o E2E. Em garantia agora: {formatarCentavos(dados.emGarantiaCentavos)}.
      </CaixaAviso>

      {dados.retidos?.length > 0 && (
        <section>
          <h3 className="mb-2 font-heading text-lg font-semibold text-rose-600">Retidos: divergência com o Mercado Pago</h3>
          <p className="mb-2 text-xs text-muted-foreground">Antes de liberar o valor ao monitor, cada pagamento é conferido no Mercado Pago. Confira no painel do MP e decida: nenhuma decisão aqui cobra ou devolve o aluno.</p>
          <ul className="space-y-2">
            {dados.retidos.map((r: any) => (
              <li key={r.id} className="rounded-2xl border-2 border-rose-400/50 bg-card p-3 text-sm">
                <p className="font-semibold">{r.nome} — {formatarCentavos(r.liquidoCentavos)} <a className="ml-1 text-xs font-normal text-primary underline" href={`/monitorias/reservas/${r.reservaId}`}>reserva</a></p>
                <p className="text-xs text-rose-700 dark:text-rose-300">{r.motivo}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" disabled={ocupado === `l${r.id}`} onClick={() => {
                    const nota = prompt('O que você conferiu no Mercado Pago? (fica registrado)')
                    if (nota && nota.trim().length >= 5) executar(`l${r.id}`, () => api('/api/admin/monitorias/repasses', { method: 'POST', json: { repasseId: r.id, decisao: 'liberar', nota } }))
                  }}>Conferido: liberar ao monitor</Button>
                  <Button size="sm" variant="ghost" className="text-rose-600" disabled={ocupado === `e${r.id}`} onClick={() => {
                    const nota = prompt('Por que a receita não existe? (fica registrado)')
                    if (nota && nota.trim().length >= 5) executar(`e${r.id}`, () => api('/api/admin/monitorias/repasses', { method: 'POST', json: { repasseId: r.id, decisao: 'estornar', nota } }))
                  }}>Receita não confirmada: zerar repasse</Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="mb-2 font-heading text-lg font-semibold">Liberados para pagar</h3>
        {dados.fila.length === 0 ? <p className="text-sm text-muted-foreground">Ninguém para pagar agora.</p> : (
          <ul className="space-y-2">
            {dados.fila.map((t: any) => (
              <li key={t.tutorId} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3 text-sm">
                <Avatar nome={t.nome} url={t.fotoUrl} tamanho={36} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{t.nome} — {formatarCentavos(t.aPagarCentavos)}</p>
                  <p className="text-xs text-muted-foreground">{t.qtd} monitoria(s) · liberado {formatarCentavos(t.liberadoCentavos)}{t.saldoDevedorCentavos ? ` · devedor ${formatarCentavos(t.saldoDevedorCentavos)}` : ''} · PIX {t.pix ? `${t.pix.mascarada} (titular ${t.pix.titular})` : 'NÃO CADASTRADO'}</p>
                  {t.trocaDePixPendente && <p className="text-xs text-amber-600"><ShieldAlert className="mr-1 inline h-3.5 w-3.5" /> Troca de chave PIX em carência — confirme com o monitor antes.</p>}
                </div>
                <Button size="sm" disabled={!t.pix || ocupado === t.tutorId} onClick={() => executar(t.tutorId, () => api('/api/admin/monitorias/payouts', { method: 'POST', json: { tutorId: t.tutorId } }))}>
                  {ocupado === t.tutorId ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar pagamento'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 font-heading text-lg font-semibold">Pagamentos em aberto</h3>
        {abertos.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum.</p> : (
          <ul className="space-y-3">
            {abertos.map((p: any) => (
              <li key={p.id} className="rounded-2xl border-2 border-amber-400/50 bg-card p-4 text-sm">
                <p className="font-semibold">{p.nome} — {formatarCentavos(p.totalCentavos)} <span className="font-normal text-muted-foreground">({p.qtd} monitoria(s){p.abatidoCentavos ? `, abatido ${formatarCentavos(p.abatidoCentavos)}` : ''})</span></p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="text-xs font-semibold">1. Chave PIX</p>
                    {revelado[p.id] ? (
                      <div className="mt-1 space-y-1 text-xs">
                        <p className="flex items-center gap-1 break-all font-mono text-sm">{revelado[p.id].chave} <button type="button" onClick={() => navigator.clipboard.writeText(revelado[p.id].chave)}><Copy className="h-3.5 w-3.5" /></button></p>
                        <p>Titular: {revelado[p.id].titularNome} · CPF {revelado[p.id].titularCpf}</p>
                        {revelado[p.id].chaveMudou && <p className="text-rose-600">A chave mudou desde a criação deste pagamento!</p>}
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" className="mt-1" onClick={() => executar(`r${p.id}`, async () => setRevelado({ ...revelado, [p.id]: await api(`/api/admin/monitorias/payouts/${p.id}`, { method: 'POST', json: { acao: 'revelar' } }) }))}>
                        <Eye className="mr-1 h-3.5 w-3.5" /> Revelar (auditado)
                      </Button>
                    )}
                  </div>
                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="text-xs font-semibold">2. Comprovante</p>
                    {p.temComprovante ? <p className="mt-1 text-xs text-emerald-600">✓ Anexado · <a className="underline" href={`/api/monitorias/payouts/${p.id}/comprovante`}>ver</a></p> : (
                      <label className="mt-1 inline-flex cursor-pointer items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-xs">
                        <FileUp className="h-3.5 w-3.5" /> Enviar PDF/imagem
                        <input type="file" accept="application/pdf,image/jpeg,image/png" className="hidden" onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const fd = new FormData()
                          fd.append('arquivo', file)
                          executar(`c${p.id}`, () => api(`/api/admin/monitorias/payouts/${p.id}/comprovante`, { method: 'POST', body: fd }))
                        }} />
                      </label>
                    )}
                  </div>
                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="text-xs font-semibold">3. Identificador E2E</p>
                    <input value={e2e[p.id] || ''} onChange={(e) => setE2e({ ...e2e, [p.id]: e.target.value.trim() })} placeholder="E00000000202610091200..." className="mt-1 h-8 w-full rounded-lg border border-border bg-background px-2 font-mono text-[11px]" />
                    <Button size="sm" className="mt-2 w-full" disabled={!p.temComprovante || (e2e[p.id] || '').length !== 32 || ocupado === `f${p.id}`} onClick={() => executar(`f${p.id}`, () => api(`/api/admin/monitorias/payouts/${p.id}`, { method: 'POST', json: { acao: 'confirmar', e2eId: e2e[p.id] } }))}>
                      Confirmar pago
                    </Button>
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="mt-2 text-rose-600" onClick={() => confirm('Cancelar este pagamento? Os valores voltam para "liberado".') && executar(`x${p.id}`, () => api(`/api/admin/monitorias/payouts/${p.id}`, { method: 'POST', json: { acao: 'cancelar' } }))}>
                  Cancelar pagamento
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 font-heading text-lg font-semibold">Últimos pagos</h3>
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card text-sm">
          {pagos.length === 0 && <li className="p-3 text-muted-foreground">Nenhum ainda.</li>}
          {pagos.map((p: any) => (
            <li key={p.id} className="flex flex-wrap items-center gap-2 p-3">
              <span className="font-medium">{p.nome}</span>
              <span>{formatarCentavos(p.totalCentavos)}</span>
              <span className="text-xs text-muted-foreground">{formatarEmBrasilia(p.pagoEm)} · E2E {p.e2eId}</span>
              <a className="ml-auto text-xs font-semibold text-primary" href={`/api/monitorias/documentos/repasse/${p.id}`}>PDF</a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

// ─── Denúncias ──────────────────────────────────────────────────────────

function Denuncias({ onMudou }: { onMudou: () => void }) {
  const [itens, setItens] = useState<any[] | null>(null)
  const carregar = useCallback(() => {
    api<{ perguntas: any[] }>('/api/admin/monitorias/perguntas').then((r) => setItens(r.perguntas)).catch(() => setItens([]))
  }, [])
  useEffect(() => carregar(), [carregar])
  async function acao(id: string, a: 'ocultar' | 'mostrar') {
    await api(`/api/monitorias/perguntas/${id}`, { method: 'POST', json: { acao: a } }).catch(() => {})
    carregar()
    onMudou()
  }
  if (!itens) return <Esqueleto className="h-48" />
  if (!itens.length) return <p className="text-sm text-muted-foreground">Nenhuma denúncia.</p>
  return (
    <ul className="space-y-2">
      {itens.map((p) => (
        <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3 text-sm">
          <div className="min-w-0 flex-1">
            <p><strong>{p.autorNome}:</strong> {p.texto}</p>
            <p className="text-xs text-muted-foreground">{p.denuncias} denúncia(s) · {p.status}</p>
          </div>
          {p.status === 'visivel' ? <Button size="sm" variant="outline" onClick={() => acao(p.id, 'ocultar')}>Ocultar</Button> : <Button size="sm" variant="ghost" onClick={() => acao(p.id, 'mostrar')}>Mostrar</Button>}
        </li>
      ))}
    </ul>
  )
}
