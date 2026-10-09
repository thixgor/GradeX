'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle, BadgeCheck, Ban, Check, Copy, Eye, FileUp, Flag, Gavel, Loader2, RotateCcw, ShieldAlert, Wallet, X,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, CaixaAviso, CaixaErro, Esqueleto, Selo, SeloStatus, api } from '@/components/monitorias/base'
import { formatarCentavos, interpretarValorEmReais } from '@/lib/monitorias/dinheiro'
import { formatarDuracao } from '@/lib/monitorias/agenda'
import { formatarEmBrasilia } from '@/lib/fuso-brasilia'
import { cn } from '@/lib/utils'
import type { StatusReserva } from '@/lib/monitorias/tipos'

type Aba = 'moderacao' | 'disputas' | 'repasses' | 'perguntas'

interface Resumo {
  emAnalise: number
  revisoes: number
  disputas: number
  liberados: number
  payoutsAbertos: number
  denunciadas: number
  reembolsosFalhos: number
}

export default function AdminMonitorias() {
  const [aba, setAba] = useState<Aba>('moderacao')
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const recarregarResumo = useCallback(() => {
    api<Resumo>('/api/admin/monitorias/resumo').then(setResumo).catch(() => {})
  }, [])
  useEffect(() => recarregarResumo(), [recarregarResumo])

  const abas: Array<{ chave: Aba; rotulo: string; n?: number; icone: typeof Gavel }> = [
    { chave: 'moderacao', rotulo: 'Moderação', n: (resumo?.emAnalise || 0) + (resumo?.revisoes || 0), icone: BadgeCheck },
    { chave: 'disputas', rotulo: 'Disputas', n: resumo?.disputas, icone: Gavel },
    { chave: 'repasses', rotulo: 'Repasses', n: (resumo?.payoutsAbertos || 0) + (resumo?.liberados ? 1 : 0), icone: Wallet },
    { chave: 'perguntas', rotulo: 'Denúncias', n: resumo?.denunciadas, icone: Flag },
  ]

  return (
    <AppShell headerTitle="Monitorias" headerSubtitle="Moderação, disputas e repasses">
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
            {aba === 'moderacao' && <Moderacao onMudou={recarregarResumo} />}
            {aba === 'disputas' && <Disputas onMudou={recarregarResumo} />}
            {aba === 'repasses' && <Repasses onMudou={recarregarResumo} />}
            {aba === 'perguntas' && <Denuncias onMudou={recarregarResumo} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppShell>
  )
}

// ─── Moderação ──────────────────────────────────────────────────────────

function Moderacao({ onMudou }: { onMudou: () => void }) {
  const [fila, setFila] = useState<'analise' | 'revisoes' | 'todos'>('analise')
  const [itens, setItens] = useState<any[] | null>(null)
  const [aberto, setAberto] = useState<string | null>(null)
  const carregar = useCallback(() => {
    setItens(null)
    api<{ itens: any[] }>(`/api/admin/monitorias/anuncios?fila=${fila}`).then((r) => setItens(r.itens)).catch(() => setItens([]))
  }, [fila])
  useEffect(() => carregar(), [carregar])

  async function moderar(id: string, acao: string) {
    const precisaMotivo = ['rejeitar', 'suspender', 'rejeitar_revisao'].includes(acao)
    const motivo = precisaMotivo ? window.prompt('Motivo (o monitor vai ler):') : undefined
    if (precisaMotivo && !motivo) return
    try {
      await api(`/api/admin/monitorias/anuncios/${id}`, { method: 'POST', json: { acao, ...(motivo ? { motivo } : {}) } })
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
      <div className="mb-4 flex gap-2">
        {(['analise', 'revisoes', 'todos'] as const).map((f) => (
          <Button key={f} size="sm" variant={fila === f ? 'default' : 'outline'} onClick={() => setFila(f)}>
            {f === 'analise' ? 'Novos para análise' : f === 'revisoes' ? 'Alterações pendentes' : 'Todos'}
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
                    </div>
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
                  {a.status === 'em_analise' && <><Button size="sm" onClick={() => moderar(a.id, 'aprovar')}><Check className="mr-1 h-4 w-4" /> Aprovar</Button><Button size="sm" variant="outline" onClick={() => moderar(a.id, 'rejeitar')}><X className="mr-1 h-4 w-4" /> Pedir ajustes</Button></>}
                  {a.revisaoPendente && <><Button size="sm" onClick={() => moderar(a.id, 'aprovar_revisao')}><Check className="mr-1 h-4 w-4" /> Aprovar alteração</Button><Button size="sm" variant="outline" onClick={() => moderar(a.id, 'rejeitar_revisao')}>Recusar alteração</Button></>}
                  {['publicado', 'pausado'].includes(a.status) && <Button size="sm" variant="outline" className="text-rose-600" onClick={() => moderar(a.id, 'suspender')}><Ban className="mr-1 h-4 w-4" /> Suspender anúncio</Button>}
                  {a.status === 'suspenso' && <Button size="sm" variant="outline" onClick={() => moderar(a.id, 'reativar')}><RotateCcw className="mr-1 h-4 w-4" /> Reativar</Button>}
                  {m.status === 'ativo' ? <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => tutor(m.tutorId, 'suspender')}>Suspender monitor</Button> : <Button size="sm" variant="ghost" onClick={() => tutor(m.tutorId, 'reativar')}>Reativar monitor</Button>}
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
              <ul className="mt-2 space-y-1 text-xs">
                {r.assentos.map((a: any) => (
                  <li key={a.id} className="flex flex-wrap gap-2">
                    <span className="font-medium">{a.alunoNome}</span>
                    <span className="text-muted-foreground">{a.status}</span>
                    <span>{formatarCentavos(a.valorCentavos)}{a.pagoCentavos ? ` (pagou ${formatarCentavos(a.pagoCentavos)})` : ''}</span>
                    {a.reembolsos.some((x: any) => x.status === 'falhou') && <Selo tom="erro">reembolso falhou</Selo>}
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

function Decisao({ reserva, onFechar, onFeito }: { reserva: any; onFechar: () => void; onFeito: () => void }) {
  const pagos = reserva.assentos.filter((a: any) => ['paga', 'concluida'].includes(a.status))
  const [decisao, setDecisao] = useState<'liberar' | 'reembolsar'>('reembolsar')
  const [valores, setValores] = useState<Record<string, string>>({})
  const [marcados, setMarcados] = useState<Record<string, boolean>>(Object.fromEntries(pagos.map((a: any) => [a.id, true])))
  const [culpa, setCulpa] = useState(false)
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
      const r = await api<{ falhas: string[] }>(`/api/admin/monitorias/reservas/${reserva.id}`, { method: 'POST', json: { decisao, reembolsos, culpaDoMonitor: culpa, nota } })
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
