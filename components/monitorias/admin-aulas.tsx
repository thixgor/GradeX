'use client'

/**
 * Admin → Monitorias → Aulas: o suporte acha qualquer monitoria (por #ID,
 * título ou aluno), vê quem está na sala agora, lê a conversa, encerra ou
 * reabre a aula, tira alguém da sala e cancela com reembolso.
 *
 * O suporte NÃO entra na chamada (privacidade e custo): age sobre a sala pelo
 * servidor, e os participantes sentem no próximo pulso (até ~30 s).
 */

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Ban, Copy, DoorOpen, ExternalLink, Loader2, MessageSquareText, Power, Radio, RotateCcw, Search, ShieldAlert, UserMinus, UserPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { api, CaixaErro, Esqueleto, Selo, SeloStatus } from '@/components/monitorias/base'
import { useIntervaloVisivel } from '@/hooks/use-intervalo-visivel'
import { formatarEmBrasilia } from '@/lib/fuso-brasilia'
import { ROTULO_CATEGORIA, type CategoriaContato } from '@/lib/monitorias/contato-inteligente'
import type { StatusReserva } from '@/lib/monitorias/tipos'
import { cn } from '@/lib/utils'

type Filtro = 'ao_vivo' | 'hoje' | 'proximas' | 'todas'

interface ParticipanteDaSala {
  pid: string
  papel: 'monitor' | 'aluno'
  nome: string
  presente: boolean
  entrouEm: string
  removido: null | 'monitor' | 'suporte'
}

interface Aula {
  id: string
  curto: string
  titulo: string
  status: StatusReserva
  inicio: string | null
  fim: string | null
  monitor: string
  motivoCancelamento: string | null
  disputa: { motivo: string; em: string } | null
  temLinkExterno: boolean
  alunos: Array<{ id: string; nome: string; status: string; valorCentavos: number }>
  sala: null | {
    encerrada: boolean
    encerradaPeloSuporte: boolean
    permissoes: { telaAlunos: boolean; chatAlunos: boolean }
    participantes: ParticipanteDaSala[]
  }
  presenca: Array<{ pid: string; papel: 'monitor' | 'aluno'; minutos: number }>
  infracoes: { total: number; bloqueios: number }
}

const FILTROS: Array<{ chave: Filtro; rotulo: string }> = [
  { chave: 'ao_vivo', rotulo: 'Ao vivo agora' },
  { chave: 'hoje', rotulo: 'Hoje' },
  { chave: 'proximas', rotulo: 'Próximas' },
  { chave: 'todas', rotulo: 'Todas' },
]

const FINAIS: StatusReserva[] = ['concluida', 'cancelada_aluno', 'cancelada_monitor', 'cancelada_suporte', 'recusada', 'expirada', 'reembolsada']

const hora = (iso: string | null) => (iso ? formatarEmBrasilia(iso, { hour: '2-digit', minute: '2-digit' }) : '')
const dia = (iso: string | null) => (iso ? formatarEmBrasilia(iso, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'sem horário')

export function AdminAulas() {
  const [filtro, setFiltro] = useState<Filtro>('ao_vivo')
  const [busca, setBusca] = useState('')
  const [consulta, setConsulta] = useState('')
  const [aulas, setAulas] = useState<Aula[] | null>(null)
  const [erro, setErro] = useState('')
  const [conversa, setConversa] = useState<{ id: string; titulo: string } | null>(null)
  const [cancelando, setCancelando] = useState<Aula | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)

  const carregar = useCallback(() => {
    const qs = new URLSearchParams({ filtro })
    if (consulta) qs.set('q', consulta)
    api<{ aulas: Aula[] }>(`/api/admin/monitorias/aulas?${qs}`)
      .then((r) => {
        setAulas(r.aulas)
        setErro('')
      })
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro'))
  }, [filtro, consulta])
  useEffect(() => {
    setAulas(null)
    carregar()
  }, [carregar])
  // "Ao vivo" se atualiza sozinho (só com a aba visível).
  useIntervaloVisivel(carregar, filtro === 'ao_vivo' && !consulta ? 30_000 : null)

  async function agir(chave: string, reservaId: string, corpo: Record<string, unknown>, confirmar?: string) {
    if (confirmar && !window.confirm(confirmar)) return
    setOcupado(chave)
    try {
      await api(`/api/admin/monitorias/reservas/${reservaId}/sala`, { method: 'POST', json: corpo })
      carregar()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro')
    } finally {
      setOcupado(null)
    }
  }

  return (
    <div>
      <form
        className="mb-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          setConsulta(busca.trim())
        }}
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por #ID, título ou nome do aluno"
            className="campo-sem-zoom h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm"
            aria-label="Buscar monitoria"
          />
        </div>
        <Button type="submit" size="sm" className="h-10">Buscar</Button>
        {consulta && (
          <Button type="button" size="sm" variant="ghost" className="h-10" onClick={() => { setBusca(''); setConsulta('') }}>
            Limpar
          </Button>
        )}
      </form>
      {!consulta && (
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <Button key={f.chave} size="sm" variant={filtro === f.chave ? 'default' : 'outline'} onClick={() => setFiltro(f.chave)}>
              {f.chave === 'ao_vivo' && <Radio className="mr-1 h-3.5 w-3.5" />}
              {f.rotulo}
            </Button>
          ))}
        </div>
      )}
      {erro && <CaixaErro mensagem={erro} className="mb-3" />}
      {!aulas ? (
        <Esqueleto className="h-64" />
      ) : aulas.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {consulta ? 'Nenhuma monitoria encontrada.' : filtro === 'ao_vivo' ? 'Nenhuma aula acontecendo agora.' : 'Nada por aqui.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {aulas.map((a) => {
            const presentes = a.sala?.participantes.filter((p) => p.presente) || []
            const aoVivo = presentes.length > 0
            const podeCancelar = !FINAIS.includes(a.status)
            return (
              <li key={a.id} className="rounded-2xl border border-border bg-card p-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  {aoVivo && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-bold text-rose-600">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" /> AO VIVO
                    </span>
                  )}
                  <p className="font-semibold">{a.titulo}</p>
                  <SeloStatus status={a.status} />
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(a.id).catch(() => {})}
                    className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground hover:text-foreground"
                    title="Copiar o id completo"
                  >
                    #{a.curto} <Copy className="h-3 w-3" />
                  </button>
                  {a.sala?.encerradaPeloSuporte ? <Selo tom="erro">Encerrada pelo suporte</Selo> : a.sala?.encerrada ? <Selo tom="alerta">Encerrada pelo monitor</Selo> : null}
                  {a.infracoes.bloqueios > 0 && (
                    <Selo tom="erro">
                      <ShieldAlert className="mr-0.5 inline h-3 w-3" /> {a.infracoes.bloqueios} contato(s) bloqueado(s)
                    </Selo>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {dia(a.inicio)}{a.fim ? ` às ${hora(a.fim)}` : ''} · Monitor: {a.monitor} · {a.alunos.length} aluno(s){a.temLinkExterno ? ' · tem link externo' : ''}
                </p>
                {a.motivoCancelamento && <p className="mt-1 text-xs text-rose-600">Motivo do cancelamento: {a.motivoCancelamento}</p>}
                {a.disputa && <p className="mt-2 rounded-lg bg-amber-500/10 p-2 text-xs"><strong>Relato:</strong> {a.disputa.motivo}</p>}

                {a.sala && a.sala.participantes.length > 0 && (
                  <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
                    {a.sala.participantes.map((p) => (
                      <li key={p.pid} className="flex flex-wrap items-center gap-2 px-3 py-2 text-xs">
                        <span className={cn('h-2 w-2 shrink-0 rounded-full', p.presente ? 'bg-emerald-500' : 'bg-muted-foreground/30')} aria-label={p.presente ? 'na sala' : 'fora da sala'} />
                        <span className="font-medium">{p.nome}</span>
                        <span className="text-muted-foreground">{p.papel === 'monitor' ? 'monitor' : 'aluno'}</span>
                        {p.removido && <Selo tom="erro">tirado pelo {p.removido}</Selo>}
                        <span className="text-muted-foreground">{p.presente ? 'na sala agora' : `entrou ${hora(p.entrouEm)}`}</span>
                        {p.papel === 'aluno' && (
                          <span className="ml-auto">
                            {p.removido ? (
                              <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={ocupado === `r${p.pid}`} onClick={() => agir(`r${p.pid}`, a.id, { acao: 'readmitir', pid: p.pid })}>
                                <UserPlus className="mr-1 h-3.5 w-3.5" /> Liberar volta
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-rose-600"
                                disabled={ocupado === `r${p.pid}`}
                                onClick={() => agir(`r${p.pid}`, a.id, { acao: 'remover', pid: p.pid }, `Tirar ${p.nome} da sala? A pessoa não consegue voltar até você liberar.`)}
                              >
                                <UserMinus className="mr-1 h-3.5 w-3.5" /> Tirar da sala
                              </Button>
                            )}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {a.sala && (!a.sala.permissoes.chatAlunos || !a.sala.permissoes.telaAlunos) && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    O monitor pausou: {[!a.sala.permissoes.chatAlunos && 'chat dos alunos', !a.sala.permissoes.telaAlunos && 'tela dos alunos'].filter(Boolean).join(' e ')}.
                  </p>
                )}
                {!a.sala && a.alunos.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">Alunos: {a.alunos.map((x) => `${x.nome} (${x.status})`).join(', ')}</p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setConversa({ id: a.id, titulo: a.titulo })}>
                    <MessageSquareText className="mr-1 h-4 w-4" /> Ver conversa{a.infracoes.total ? ` (${a.infracoes.total} alerta${a.infracoes.total > 1 ? 's' : ''})` : ''}
                  </Button>
                  {a.sala?.encerradaPeloSuporte ? (
                    <Button size="sm" variant="outline" disabled={ocupado === `s${a.id}`} onClick={() => agir(`s${a.id}`, a.id, { acao: 'reabrir' })}>
                      <RotateCcw className="mr-1 h-4 w-4" /> Reabrir aula
                    </Button>
                  ) : (
                    a.fim && !FINAIS.includes(a.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-rose-600"
                        disabled={ocupado === `s${a.id}`}
                        onClick={() => agir(`s${a.id}`, a.id, { acao: 'encerrar' }, 'Encerrar a aula agora? Todos saem da sala em até 30 segundos e ninguém entra até o suporte reabrir. A reserva não muda.')}
                      >
                        <Power className="mr-1 h-4 w-4" /> Encerrar aula
                      </Button>
                    )
                  )}
                  {podeCancelar && (
                    <Button size="sm" variant="outline" className="text-rose-600" onClick={() => setCancelando(a)}>
                      <Ban className="mr-1 h-4 w-4" /> Cancelar monitoria
                    </Button>
                  )}
                  <a href={`/monitorias/reservas/${a.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 text-xs font-semibold text-primary hover:underline">
                    Abrir reserva <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <AnimatePresence>
        {conversa && <ConversaDaMonitoria reservaId={conversa.id} titulo={conversa.titulo} onFechar={() => setConversa(null)} />}
        {cancelando && (
          <CancelarMonitoria
            aula={cancelando}
            onFechar={() => setCancelando(null)}
            onFeito={() => {
              setCancelando(null)
              carregar()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function Janela({ titulo, onFechar, children, largura = 'max-w-2xl' }: { titulo: string; onFechar: () => void; children: React.ReactNode; largura?: string }) {
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => e.key === 'Escape' && onFechar()
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [onFechar])
  return (
    <motion.div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onFechar}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        initial={{ y: 30 }}
        animate={{ y: 0 }}
        className={cn('flex max-h-[92dvh] w-full flex-col rounded-t-3xl border border-border bg-card sm:rounded-3xl', largura)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <h3 className="min-w-0 flex-1 truncate font-heading text-base font-semibold">{titulo}</h3>
          <button type="button" onClick={onFechar} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}

interface MensagemDoSuporte {
  id: string
  autor: string
  papel: 'monitor' | 'aluno' | 'sistema'
  tipo: string
  texto: string
  createdAt: string
}

interface InfracaoNaConversa {
  id: string
  nome: string
  papel: 'monitor' | 'aluno'
  origem: string
  nivel: 'bloqueio' | 'alerta'
  categorias: CategoriaContato[]
  texto: string
  createdAt: string
}

/** A conversa da monitoria como o suporte vê: sem máscara e com o que foi bloqueado. */
export function ConversaDaMonitoria({ reservaId, titulo, onFechar }: { reservaId: string; titulo: string; onFechar: () => void }) {
  const [mensagens, setMensagens] = useState<MensagemDoSuporte[] | null>(null)
  const [infracoes, setInfracoes] = useState<InfracaoNaConversa[]>([])
  const [maisAntigas, setMaisAntigas] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    api<{ mensagens: MensagemDoSuporte[]; infracoes: InfracaoNaConversa[]; maisAntigas: boolean }>(`/api/admin/monitorias/reservas/${reservaId}/conversa`)
      .then((r) => {
        setMensagens(r.mensagens)
        setInfracoes(r.infracoes)
        setMaisAntigas(r.maisAntigas)
      })
      .catch((e) => setErro(e instanceof Error ? e.message : 'Erro'))
  }, [reservaId])

  async function anteriores() {
    if (!mensagens?.length) return
    setCarregando(true)
    try {
      const r = await api<{ mensagens: MensagemDoSuporte[]; maisAntigas: boolean }>(
        `/api/admin/monitorias/reservas/${reservaId}/conversa?antes=${encodeURIComponent(mensagens[0].createdAt)}`,
      )
      setMensagens([...r.mensagens, ...mensagens])
      setMaisAntigas(r.maisAntigas)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <Janela titulo={`Conversa: ${titulo}`} onFechar={onFechar}>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {erro && <CaixaErro mensagem={erro} />}
        {!mensagens && !erro && <Esqueleto className="h-48" />}
        {infracoes.length > 0 && (
          <details className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 text-xs" open>
            <summary className="cursor-pointer font-semibold text-rose-600">
              {infracoes.filter((i) => i.nivel === 'bloqueio').length} tentativa(s) bloqueada(s) · {infracoes.filter((i) => i.nivel === 'alerta').length} alerta(s)
            </summary>
            <ul className="mt-2 space-y-2">
              {infracoes.map((i) => (
                <li key={i.id} className="rounded-lg bg-background/60 p-2">
                  <p className="font-medium">
                    {i.nome} ({i.papel}) · {formatarEmBrasilia(i.createdAt, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} ·{' '}
                    <span className={i.nivel === 'bloqueio' ? 'text-rose-600' : 'text-amber-600'}>{i.nivel === 'bloqueio' ? 'não entregue' : 'entregue (alerta)'}</span>
                  </p>
                  <p className="mt-0.5 text-muted-foreground">{i.categorias.map((c) => ROTULO_CATEGORIA[c] || c).join(', ')}</p>
                  <p className="mt-1 whitespace-pre-wrap break-words">{i.texto}</p>
                </li>
              ))}
            </ul>
          </details>
        )}
        {maisAntigas && (
          <div className="mb-3 text-center">
            <Button size="sm" variant="ghost" onClick={anteriores} disabled={carregando}>
              {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ver mensagens anteriores'}
            </Button>
          </div>
        )}
        {mensagens && mensagens.length === 0 && <p className="text-center text-sm text-muted-foreground">Nenhuma mensagem.</p>}
        <ul className="space-y-2">
          {mensagens?.map((m) =>
            m.papel === 'sistema' ? (
              <li key={m.id} className="text-center text-[11px] text-muted-foreground">
                {m.texto} · {formatarEmBrasilia(m.createdAt, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </li>
            ) : (
              <li key={m.id} className={cn('max-w-[85%] rounded-2xl px-3 py-2 text-sm', m.papel === 'monitor' ? 'ml-auto bg-primary/10' : 'bg-muted')}>
                <p className="text-[11px] font-semibold text-muted-foreground">
                  {m.autor} · {formatarEmBrasilia(m.createdAt, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="mt-0.5 whitespace-pre-wrap break-words">{m.texto}</p>
              </li>
            ),
          )}
        </ul>
      </div>
    </Janela>
  )
}

function CancelarMonitoria({ aula, onFechar, onFeito }: { aula: Aula; onFechar: () => void; onFeito: () => void }) {
  const [motivo, setMotivo] = useState('')
  const [culpa, setCulpa] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
  const pagos = aula.alunos.filter((a) => ['paga', 'reembolso_processando'].includes(a.status))

  async function confirmar() {
    setOcupado(true)
    setErro('')
    try {
      const r = await api<{ reembolsos: { ok: number; falhas: number } }>(`/api/admin/monitorias/reservas/${aula.id}/cancelar`, {
        method: 'POST',
        json: { motivo: motivo.trim(), culpaDoMonitor: culpa },
      })
      if (r.reembolsos.falhas) alert(`${r.reembolsos.falhas} reembolso(s) falharam no Mercado Pago agora; o sistema tenta de novo sozinho.`)
      onFeito()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Janela titulo={`Cancelar: ${aula.titulo}`} onFechar={onFechar} largura="max-w-lg">
      <div className="space-y-3 overflow-y-auto px-5 py-4 text-sm">
        <p>
          A monitoria <strong>#{aula.curto}</strong> passa a <strong>Cancelada pelo suporte</strong>. A sala de vídeo é encerrada (quem estiver dentro sai em até 30 s), a
          agenda do monitor é liberada e todos recebem aviso por e-mail.
        </p>
        <p className={cn('rounded-xl p-3 text-xs', pagos.length ? 'bg-amber-500/10' : 'bg-muted')}>
          {pagos.length
            ? `Reembolso integral pelo Mercado Pago para ${pagos.length} assento(s) pago(s): ${pagos.map((p) => p.nome).join(', ')}.`
            : 'Nenhum assento pago: nada a reembolsar.'}
        </p>
        <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} className="campo-sem-zoom" placeholder="Motivo (vai para o monitor e os alunos)" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={culpa} onChange={(e) => setCulpa(e.target.checked)} /> Falta/culpa do monitor (gera strike)
        </label>
        {erro && <CaixaErro mensagem={erro} />}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onFechar}>Voltar</Button>
          <Button variant="destructive" onClick={confirmar} disabled={ocupado || motivo.trim().length < 5}>
            {ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : <><DoorOpen className="mr-1 h-4 w-4" /> Cancelar monitoria</>}
          </Button>
        </div>
      </div>
    </Janela>
  )
}
