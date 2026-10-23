'use client'

/**
 * Serial Keys — emissão e gestão.
 *
 * Gera keys de cortesia para qualquer produto do site (material, flashcards,
 * pacote, Manual Clínico, Plus+) e lista todas: as emitidas aqui, as antigas
 * (Trial/Plus+ sem produto) e, se quiser, as de compras. De cada uma dá para
 * copiar a key e o link de ativação, enviar por e-mail, cancelar ou excluir.
 *
 * As métricas de venda das keys de compra continuam em /admin/analytics.
 */

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Ban, CheckCircle2, Clock, Crown, FileText, KeyRound, Layers, Loader2, Lock, Mail, Package, Plus,
  RefreshCw, Search, Stethoscope, Trash2, X, XCircle,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { ToastAlert } from '@/components/ui/toast-alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BotaoCopiar, EmitirSerialKeyDialog } from '@/components/admin/emitir-serial-key'
import type { KeyDoAdmin } from '@/lib/serial-key-emissao'

type Origem = 'emitidas' | 'compras' | 'todas'
type Estado = '' | 'unactivated' | 'activated' | 'cancelled'

interface Contagem { total: number; pendentes: number; ativadas: number; canceladas: number }

const ORIGENS: { id: Origem; label: string }[] = [
  { id: 'emitidas', label: 'Emitidas pelo admin' },
  { id: 'compras', label: 'De compras' },
  { id: 'todas', label: 'Todas' },
]

const TIPOS: { id: string; label: string }[] = [
  { id: '', label: 'Todos os produtos' },
  { id: 'material', label: 'Material' },
  { id: 'flashcard', label: 'Flashcards' },
  { id: 'package', label: 'Pacote' },
  { id: 'manual_clinico', label: 'Manual Clínico' },
  { id: 'plus', label: 'Plus+' },
  { id: 'legado', label: 'Keys antigas (Trial/Plus+)' },
]

function iconeDoProduto(k: KeyDoAdmin) {
  if (k.legado) return <Clock className="h-5 w-5 text-sky-500" />
  switch (k.productType) {
    case 'package': return <Package className="h-5 w-5 text-violet-500" />
    case 'flashcard': return <Layers className="h-5 w-5 text-sky-500" />
    case 'manual_clinico': return <Stethoscope className="h-5 w-5 text-emerald-500" />
    case 'plus': case 'premium': case 'essential': return <Crown className="h-5 w-5 text-amber-500" />
    default: return <FileText className="h-5 w-5 text-primary" />
  }
}

function dataCurta(d: string | Date | null) {
  if (!d) return ''
  return new Date(d).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function SeloDeEstado({ estado }: { estado: KeyDoAdmin['estado'] }) {
  const estilos = {
    unactivated: { cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-400', icon: Clock, label: 'Não ativada' },
    activated: { cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400', icon: CheckCircle2, label: 'Ativada' },
    cancelled: { cls: 'bg-destructive/15 text-destructive', icon: XCircle, label: 'Cancelada' },
  }[estado]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${estilos.cls}`}>
      <estilos.icon className="h-3 w-3" /> {estilos.label}
    </span>
  )
}

export default function AdminKeysPage() {
  return (
    <AppShell headerTitle="Serial Keys" headerSubtitle="Keys de cortesia para materiais, pacotes, Manual Clínico e Plus+">
      <AdminKeysContent />
    </AppShell>
  )
}

function AdminKeysContent() {
  const router = useRouter()
  const [origem, setOrigem] = useState<Origem>('emitidas')
  const [estado, setEstado] = useState<Estado>('')
  const [tipo, setTipo] = useState('')
  const [busca, setBusca] = useState('')
  const [buscaAplicada, setBuscaAplicada] = useState('')
  const [lote, setLote] = useState('')

  const [keys, setKeys] = useState<KeyDoAdmin[]>([])
  const [contagem, setContagem] = useState<Contagem | null>(null)
  const [pagina, setPagina] = useState(0)
  const [temMais, setTemMais] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [carregandoMais, setCarregandoMais] = useState(false)

  const [emitirAberto, setEmitirAberto] = useState(false)
  const [ocupado, setOcupado] = useState('')
  const [envio, setEnvio] = useState<KeyDoAdmin | null>(null)
  const [toast, setToast] = useState<{ msg: string; tipo: 'success' | 'error' } | null>(null)

  const avisar = (msg: string, t: 'success' | 'error' = 'success') => setToast({ msg, tipo: t })

  // Busca só depois de uma pausa na digitação.
  useEffect(() => {
    const t = setTimeout(() => setBuscaAplicada(busca.trim()), 350)
    return () => clearTimeout(t)
  }, [busca])

  const carregar = useCallback(async (paginaAlvo = 0) => {
    const params = new URLSearchParams({ origem, pagina: String(paginaAlvo) })
    if (estado) params.set('estado', estado)
    if (tipo) params.set('tipo', tipo)
    if (buscaAplicada) params.set('q', buscaAplicada)
    if (lote) params.set('lote', lote)
    if (paginaAlvo === 0) setCarregando(true)
    else setCarregandoMais(true)
    try {
      const res = await fetch(`/api/admin/serial-keys/lista?${params}`, { cache: 'no-store' })
      if (res.status === 403) { router.push('/'); return }
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao carregar as keys.')
      setKeys(prev => (paginaAlvo === 0 ? json.keys : [...prev, ...json.keys]))
      setContagem(json.contagem)
      setTemMais(json.temMais)
      setPagina(paginaAlvo)
    } catch (e: any) {
      avisar(e.message, 'error')
    } finally {
      setCarregando(false)
      setCarregandoMais(false)
    }
  }, [origem, estado, tipo, buscaAplicada, lote, router])

  useEffect(() => { carregar(0) }, [carregar])

  function trocarKey(atual: KeyDoAdmin) {
    setKeys(prev => prev.map(k => (k.id === atual.id ? atual : k)))
  }

  async function cancelar(k: KeyDoAdmin) {
    if (!confirm(`Cancelar a key ${k.key}? Ninguém mais poderá ativá-la.`)) return
    setOcupado(k.id)
    try {
      const res = await fetch(`/api/admin/serial-keys/${k.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'cancel' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Falha ao cancelar.')
      if (json.key) trocarKey(json.key)
      avisar('Serial key cancelada.')
    } catch (e: any) {
      avisar(e.message, 'error')
    } finally {
      setOcupado('')
    }
  }

  async function excluir(k: KeyDoAdmin) {
    if (!confirm(`Excluir a key ${k.key}? O link dela para de funcionar.`)) return
    setOcupado(k.id)
    try {
      const res = await fetch(`/api/admin/serial-keys/${k.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Falha ao excluir.')
      setKeys(prev => prev.filter(x => x.id !== k.id))
      setContagem(c => (c ? { ...c, total: c.total - 1, pendentes: c.pendentes - (k.estado === 'unactivated' ? 1 : 0), canceladas: c.canceladas - (k.estado === 'cancelled' ? 1 : 0) } : c))
      avisar('Serial key excluída.')
    } catch (e: any) {
      avisar(e.message, 'error')
    } finally {
      setOcupado('')
    }
  }

  const tiles: { id: Estado; label: string; valor?: number; cls: string }[] = [
    { id: '', label: 'Total', valor: contagem?.total, cls: 'text-foreground' },
    { id: 'unactivated', label: 'Não ativadas', valor: contagem?.pendentes, cls: 'text-amber-600 dark:text-amber-400' },
    { id: 'activated', label: 'Ativadas', valor: contagem?.ativadas, cls: 'text-emerald-600 dark:text-emerald-400' },
    { id: 'cancelled', label: 'Canceladas', valor: contagem?.canceladas, cls: 'text-destructive' },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl bg-muted p-1 overflow-x-auto">
          {ORIGENS.map(o => (
            <button
              key={o.id}
              onClick={() => setOrigem(o.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                origem === o.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={() => carregar(0)} className="gap-1.5" title="Atualizar">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => setEmitirAberto(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Gerar serial key
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tiles.map(t => (
          <button
            key={t.id || 'total'}
            onClick={() => setEstado(t.id)}
            className={`rounded-xl border p-3 text-left transition-colors ${estado === t.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/60'}`}
          >
            <p className="text-xs text-muted-foreground">{t.label}</p>
            <p className={`text-2xl font-bold tabular-nums ${t.cls}`}>{t.valor ?? '—'}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por key, e-mail, nome, produto ou nota…"
            className="h-9 pl-9"
          />
        </div>
        <select
          value={tipo}
          onChange={e => setTipo(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          {TIPOS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>

      {lote && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          <Layers className="h-4 w-4 text-primary" />
          <span>Lote <span className="font-mono text-xs">{lote}</span> · {keys.length} keys</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <BotaoCopiar texto={keys.map(k => k.link).join('\n')} rotulo="Copiar links do lote" icone="link" size="xs" />
            <BotaoCopiar texto={keys.map(k => k.key).join('\n')} rotulo="Copiar keys" size="xs" />
            <button onClick={() => setLote('')} className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-[11px] hover:bg-muted">
              <X className="h-3 w-3" /> Sair do lote
            </button>
          </div>
        </div>
      )}

      {carregando ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : keys.length === 0 ? (
        <div className="rounded-xl border py-14 text-center">
          <KeyRound className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />
          <p className="mb-4 text-sm text-muted-foreground">Nenhuma serial key neste recorte.</p>
          <Button size="sm" onClick={() => setEmitirAberto(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Gerar serial key
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map(k => (
            <LinhaDaKey
              key={k.id}
              k={k}
              ocupado={ocupado === k.id}
              onLote={setLote}
              onEnviar={() => setEnvio(k)}
              onCancelar={() => cancelar(k)}
              onExcluir={() => excluir(k)}
            />
          ))}
          {temMais && (
            <div className="pt-2 text-center">
              <Button variant="outline" size="sm" onClick={() => carregar(pagina + 1)} disabled={carregandoMais} className="gap-1.5">
                {carregandoMais && <Loader2 className="h-4 w-4 animate-spin" />} Carregar mais
              </Button>
            </div>
          )}
        </div>
      )}

      <EmitirSerialKeyDialog
        open={emitirAberto}
        onOpenChange={setEmitirAberto}
        origem="admin_keys"
        onEmitidas={() => {
          if (origem === 'compras') setOrigem('emitidas')
          else carregar(0)
        }}
      />

      <EnviarPorEmailDialog
        k={envio}
        onClose={() => setEnvio(null)}
        onEnviada={(atual, msg) => { trocarKey(atual); avisar(msg) }}
        onErro={msg => avisar(msg, 'error')}
      />

      <ToastAlert open={!!toast} onOpenChange={o => !o && setToast(null)} message={toast?.msg || ''} type={toast?.tipo || 'success'} />
    </div>
  )
}

function LinhaDaKey({ k, ocupado, onLote, onEnviar, onCancelar, onExcluir }: {
  k: KeyDoAdmin
  ocupado: boolean
  onLote: (lote: string) => void
  onEnviar: () => void
  onCancelar: () => void
  onExcluir: () => void
}) {
  const pendente = k.estado === 'unactivated'
  const compra = k.origin === 'purchase'
  const podeEnviar = pendente && !k.legado && (!compra || !!k.destinatarioEmail)

  return (
    <div className={`rounded-xl border p-3 sm:p-4 ${k.estado === 'cancelled' ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">{iconeDoProduto(k)}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="min-w-0 truncate text-sm font-semibold">{k.productTitle || k.acesso}</h3>
            <SeloDeEstado estado={k.estado} />
            {compra && (
              <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:text-sky-400">
                Compra{k.amount > 0 ? ` · R$ ${k.amount.toFixed(2)}` : ''}
              </span>
            )}
            {k.restritaAoEmail && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground" title="Só ativa na conta do e-mail do destinatário">
                <Lock className="h-3 w-3" /> e-mail
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {k.productTypeLabel} · {k.acesso}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="rounded-md bg-muted px-2 py-1 font-mono text-xs font-bold tracking-wider sm:text-sm">{k.key}</code>
            <BotaoCopiar texto={k.key} rotulo="Key" size="xs" />
            <BotaoCopiar texto={k.link} rotulo="Link de ativação" rotuloCopiado="Link copiado!" icone="link" size="xs" />
          </div>

          <div className="mt-2 grid gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground sm:grid-cols-2">
            {(k.destinatarioEmail || k.destinatarioNome) && (
              <span className="truncate">Para: {k.destinatarioNome ? `${k.destinatarioNome} · ` : ''}{k.destinatarioEmail}</span>
            )}
            <span className="truncate">Gerada {k.geradaPor ? `por ${k.geradaPor} ` : ''}em {dataCurta(k.geradaEm)}</span>
            {k.estado === 'activated' && (
              <span className="truncate">Ativada {k.ativadaPor ? `por ${k.ativadaPor} ` : ''}{k.ativadaEm ? `em ${dataCurta(k.ativadaEm)}` : ''}</span>
            )}
            {k.estado === 'cancelled' && k.canceladaEm && <span>Cancelada em {dataCurta(k.canceladaEm)}</span>}
            {k.emailsEnviados > 0 && (
              <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {k.emailsEnviados} e-mail{k.emailsEnviados > 1 ? 's' : ''} enviado{k.emailsEnviados > 1 ? 's' : ''}</span>
            )}
            {k.ultimoEmail?.status === 'failed' && <span className="text-destructive">Último e-mail falhou</span>}
          </div>

          {(k.nota || k.lote) && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
              {k.lote && (
                <button onClick={() => onLote(k.lote!)} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 hover:bg-muted" title="Ver todas as keys deste lote">
                  <Layers className="h-3 w-3" /> Lote
                </button>
              )}
              {k.nota && <span className="italic text-muted-foreground">“{k.nota}”</span>}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
          {ocupado ? (
            <Loader2 className="m-2 h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <>
              {podeEnviar && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEnviar} title={k.destinatarioEmail ? 'Reenviar por e-mail' : 'Enviar por e-mail'}>
                  <Mail className="h-4 w-4" />
                </Button>
              )}
              {pendente && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-700" onClick={onCancelar} title="Cancelar key">
                  <Ban className="h-4 w-4" />
                </Button>
              )}
              {!compra && k.estado !== 'activated' && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onExcluir} title="Excluir key">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Envia (ou reenvia) a key por e-mail. Numa key emitida, dá para escolher ou
 * trocar o destinatário; numa de compra, vai sempre para o e-mail do comprador.
 */
function EnviarPorEmailDialog({ k, onClose, onEnviada, onErro }: {
  k: KeyDoAdmin | null
  onClose: () => void
  onEnviada: (atual: KeyDoAdmin, msg: string) => void
  onErro: (msg: string) => void
}) {
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [restringir, setRestringir] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const compra = k?.origin === 'purchase'

  useEffect(() => {
    if (!k) return
    setEmail(k.destinatarioEmail)
    setNome(k.destinatarioNome)
    setRestringir(k.restritaAoEmail)
  }, [k])

  async function enviar() {
    if (!k) return
    setEnviando(true)
    try {
      const res = await fetch(`/api/admin/serial-keys/${k.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compra ? { action: 'resend' } : { action: 'resend', email, nome, restringirAoEmail: restringir }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || json.message || 'Falha ao enviar.')
      if (json.key) onEnviada(json.key, json.message)
      onClose()
    } catch (e: any) {
      onErro(e.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={!!k} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> Enviar por e-mail</DialogTitle>
          <DialogDescription>
            Mesmo e-mail das compras: key, link de ativação, QR e comprovante.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 px-6 pb-6">
          {compra ? (
            <p className="text-sm">Reenviar para <strong>{k?.destinatarioEmail}</strong>, o e-mail usado na compra.</p>
          ) : (
            <>
              <label className="block text-xs text-muted-foreground">
                E-mail
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 h-9" placeholder="aluno@email.com" />
              </label>
              <label className="block text-xs text-muted-foreground">
                Nome
                <Input value={nome} onChange={e => setNome(e.target.value)} className="mt-1 h-9" placeholder="Nome completo" />
              </label>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Só ativa na conta deste e-mail</p>
                  <p className="text-xs text-muted-foreground">Impede que a key seja repassada.</p>
                </div>
                <Switch checked={restringir} onCheckedChange={setRestringir} />
              </div>
            </>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={enviar} disabled={enviando || (!compra && !email.trim())} className="gap-1.5">
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Enviar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
