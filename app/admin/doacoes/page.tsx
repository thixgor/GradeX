'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { LogoLoading } from '@/components/logo-loading'
import {
  Heart,
  HeartPulse,
  Check,
  X,
  Trash2,
  Pencil,
  Plus,
  ToggleLeft,
  ToggleRight,
  Clock,
  Trophy,
  Loader2,
  ArrowLeft,
  User,
  DollarSign,
  Calendar,
  MessageSquare,
  Tag,
  BookOpen,
  FileText,
  Send,
} from 'lucide-react'

interface Doacao {
  _id: string
  nomeCompleto: string
  apelido: string
  valor: number
  mensagem?: string
  dataDoacao: string
  status: 'pending' | 'approved' | 'rejected'
  addedByAdmin?: boolean
  createdAt: string
}

const STATUS_LABELS = {
  pending: { label: 'Pendente', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
  approved: { label: 'Aprovada', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  rejected: { label: 'Rejeitada', color: 'text-red-500', bg: 'bg-red-500/10' },
}

function formatBRL(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function AdminDoacoesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [doacoes, setDoacoes] = useState<Doacao[]>([])
  const [tab, setTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Modals
  const [editModal, setEditModal] = useState<Doacao | null>(null)
  const [addModal, setAddModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Doacao | null>(null)

  // Forms
  const emptyForm = { nomeCompleto: '', apelido: '', valor: '', mensagem: '', dataDoacao: new Date().toISOString().split('T')[0] }
  const [form, setForm] = useState(emptyForm)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const dRes = await fetch('/api/admin/doacoes')
      if (dRes.status === 403) { router.push('/admin'); return }
      const dData = await dRes.json()
      setDoacoes(Array.isArray(dData) ? dData : [])
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(id: string, status: 'approved' | 'rejected') {
    setActionLoading(id + status)
    try {
      const res = await fetch(`/api/admin/doacoes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) setDoacoes(prev => prev.map(d => d._id === id ? { ...d, status } : d))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete(id: string) {
    setActionLoading(id + 'del')
    try {
      const res = await fetch(`/api/admin/doacoes/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setDoacoes(prev => prev.filter(d => d._id !== id))
        setDeleteConfirm(null)
      }
    } finally {
      setActionLoading(null)
    }
  }

  async function handleFormSubmit(isEdit: boolean) {
    if (!form.nomeCompleto.trim() || !form.apelido.trim() || !form.valor) {
      setFormError('Preencha todos os campos obrigatórios.')
      return
    }
    setFormLoading(true)
    setFormError('')
    try {
      const url = isEdit ? `/api/admin/doacoes/${editModal!._id}` : '/api/admin/doacoes'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, valor: Number(form.valor) }),
      })
      if (!res.ok) {
        const d = await res.json()
        setFormError(d.error || 'Erro ao salvar.')
        return
      }
      await loadAll()
      setEditModal(null)
      setAddModal(false)
      setForm(emptyForm)
    } finally {
      setFormLoading(false)
    }
  }

  function openEdit(d: Doacao) {
    setForm({
      nomeCompleto: d.nomeCompleto,
      apelido: d.apelido,
      valor: String(d.valor),
      mensagem: d.mensagem || '',
      dataDoacao: d.dataDoacao?.split('T')[0] || new Date().toISOString().split('T')[0],
    })
    setFormError('')
    setEditModal(d)
  }

  if (loading) return <LogoLoading message="Carregando doações..." size="lg" fullscreen />

  const filtered = tab === 'all' ? doacoes : doacoes.filter(d => d.status === tab)
  const pendingCount = doacoes.filter(d => d.status === 'pending').length

  return (
    <AppShell headerTitle="Doações Pix" headerSubtitle="Gerenciar doações e ranking">
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">

        {/* Voltar */}
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao Admin
        </Button>

        {/* ─── Settings ─── */}
        {/* ─── Doações ─── */}
        <Card>
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-lg" />
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
                  Doações
                  {pendingCount > 0 && (
                    <span className="text-xs bg-amber-500 text-white rounded-full px-2 py-0.5 font-bold">
                      {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>Gerencie e aprove doações. Somente aprovadas aparecem no ranking público.</CardDescription>
              </div>
              <Button
                onClick={() => { setForm(emptyForm); setFormError(''); setAddModal(true) }}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <Plus className="h-4 w-4 mr-1.5" /> Adicionar Manual
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-muted/50 rounded-xl mb-5 w-fit flex-wrap">
              {(['pending', 'approved', 'rejected', 'all'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    tab === t ? 'bg-white dark:bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t === 'pending' ? `Pendentes (${pendingCount})` : t === 'approved' ? 'Aprovadas' : t === 'rejected' ? 'Rejeitadas' : 'Todas'}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Heart className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhuma doação {tab !== 'all' ? `com status "${STATUS_LABELS[tab as keyof typeof STATUS_LABELS]?.label}"` : ''}.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((d) => {
                  const s = STATUS_LABELS[d.status]
                  return (
                    <div
                      key={d._id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-all"
                    >
                      {/* Status badge */}
                      <div className={`flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-full ${s.bg} ${s.color}`}>
                        {s.label}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{d.apelido}</span>
                          <span className="text-xs text-muted-foreground">({d.nomeCompleto})</span>
                          {d.addedByAdmin && (
                            <span className="text-[9px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full">Admin</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatBRL(d.valor)}</span>
                          <span className="text-xs text-muted-foreground">{fmtDate(d.dataDoacao || d.createdAt)}</span>
                          {d.mensagem && (
                            <span className="text-xs text-muted-foreground italic truncate max-w-[200px]">"{d.mensagem}"</span>
                          )}
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {d.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(d._id, 'approved')}
                              disabled={!!actionLoading}
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                              title="Aprovar"
                            >
                              {actionLoading === d._id + 'approved' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              onClick={() => handleStatusChange(d._id, 'rejected')}
                              disabled={!!actionLoading}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all disabled:opacity-50"
                              title="Rejeitar"
                            >
                              {actionLoading === d._id + 'rejected' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                            </button>
                          </>
                        )}
                        {d.status === 'approved' && (
                          <button
                            onClick={() => handleStatusChange(d._id, 'rejected')}
                            disabled={!!actionLoading}
                            className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-all disabled:opacity-50 text-xs font-medium px-2"
                            title="Remover aprovação"
                          >
                            Revogar
                          </button>
                        )}
                        {d.status === 'rejected' && (
                          <button
                            onClick={() => handleStatusChange(d._id, 'approved')}
                            disabled={!!actionLoading}
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-all disabled:opacity-50 text-xs font-medium px-2"
                          >
                            Aprovar
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(d)}
                          className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-all"
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(d)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                          title="Deletar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Modal Add/Edit ─── */}
      <Dialog open={addModal || !!editModal} onOpenChange={(o) => { if (!o) { setAddModal(false); setEditModal(null); setForm(emptyForm); setFormError('') } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editModal ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editModal ? 'Editar Doação' : 'Adicionar Doação Manual'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm"><User className="h-3.5 w-3.5" /> Nome completo *</Label>
              <Input value={form.nomeCompleto} onChange={e => setForm(p => ({ ...p, nomeCompleto: e.target.value }))} placeholder="Nome da conta bancária" />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm"><Tag className="h-3.5 w-3.5" /> Apelido público *</Label>
              <Input value={form.apelido} onChange={e => setForm(p => ({ ...p, apelido: e.target.value }))} placeholder="Nome no ranking" />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm"><DollarSign className="h-3.5 w-3.5" /> Valor (R$) *</Label>
              <Input type="number" min="0.01" step="0.01" value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} placeholder="0,00" />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm"><Calendar className="h-3.5 w-3.5" /> Data da doação</Label>
              <Input type="date" value={form.dataDoacao} onChange={e => setForm(p => ({ ...p, dataDoacao: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm"><MessageSquare className="h-3.5 w-3.5" /> Mensagem (opcional)</Label>
              <Textarea value={form.mensagem} onChange={e => setForm(p => ({ ...p, mensagem: e.target.value }))} rows={2} className="resize-none" />
            </div>
            {formError && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setAddModal(false); setEditModal(null); setForm(emptyForm) }} disabled={formLoading}>Cancelar</Button>
            <Button onClick={() => handleFormSubmit(!!editModal)} disabled={formLoading} className="bg-emerald-600 hover:bg-emerald-500 text-white border-0">
              {formLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              {editModal ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Modal Delete Confirm ─── */}
      <Dialog open={!!deleteConfirm} onOpenChange={(o) => { if (!o) setDeleteConfirm(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" /> Confirmar exclusão
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Tem certeza que deseja deletar a doação de <strong>{deleteConfirm?.apelido}</strong> ({formatBRL(deleteConfirm?.valor || 0)})? Esta ação é irreversível.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)} disabled={!!actionLoading}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm._id)}
              disabled={!!actionLoading}
            >
              {actionLoading === deleteConfirm?._id + 'del' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
