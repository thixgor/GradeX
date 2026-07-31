'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  PlusCircle,
  Trash2,
  Pencil,
  Loader2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Video,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { LogoLoading } from '@/components/logo-loading'
import type { PublicTestimonial } from '@/lib/testimonials'

interface FormState {
  embedUrl: string
  name: string
  description: string
  enabled: boolean
}

const EMPTY_FORM: FormState = {
  embedUrl: '',
  name: '',
  description: '',
  enabled: true,
}

export default function AdminDepoimentosPage() {
  const router = useRouter()
  const [authChecking, setAuthChecking] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState<PublicTestimonial[]>([])
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PublicTestimonial | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [confirmDelete, setConfirmDelete] = useState<PublicTestimonial | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const me = await fetch('/api/auth/me')
        if (!me.ok) {
          router.push('/auth/login')
          return
        }
        const data = await me.json()
        if (data.user?.role !== 'admin') {
          router.push('/')
          return
        }
      } catch {
        router.push('/auth/login')
        return
      } finally {
        setAuthChecking(false)
      }
    })()
  }, [router])

  const showToast = (kind: 'success' | 'error', message: string) => {
    setToast({ kind, message })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/testimonials', { cache: 'no-store' })
      if (!res.ok) throw new Error('Erro ao carregar depoimentos')
      const json = await res.json()
      setItems(json.testimonials || [])
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar depoimentos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authChecking) fetchItems()
  }, [authChecking, fetchItems])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (item: PublicTestimonial) => {
    setEditing(item)
    setForm({
      // Ao editar, mostramos o embedUrl salvo; o admin pode colar outro link.
      embedUrl: item.embedUrl,
      name: item.name,
      description: item.description,
      enabled: item.enabled,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.embedUrl.trim()) {
      showToast('error', 'Cole o link do vídeo do YouTube.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        embedUrl: form.embedUrl.trim(),
        name: form.name.trim(),
        description: form.description.trim(),
        enabled: form.enabled,
      }
      const res = editing
        ? await fetch(`/api/admin/testimonials/${editing._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/admin/testimonials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'Erro ao salvar')

      setDialogOpen(false)
      showToast('success', editing ? 'Depoimento atualizado.' : 'Depoimento adicionado.')
      fetchItems()
    } catch (e: any) {
      showToast('error', e?.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const toggleEnabled = async (item: PublicTestimonial) => {
    try {
      const res = await fetch(`/api/admin/testimonials/${item._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !item.enabled }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar')
      setItems((prev) =>
        prev.map((i) => (i._id === item._id ? { ...i, enabled: !item.enabled } : i))
      )
    } catch (e: any) {
      showToast('error', e?.message || 'Erro ao atualizar')
    }
  }

  const move = async (item: PublicTestimonial, dir: -1 | 1) => {
    const idx = items.findIndex((i) => i._id === item._id)
    const swapIdx = idx + dir
    if (idx < 0 || swapIdx < 0 || swapIdx >= items.length) return
    const other = items[swapIdx]

    // Troca visual otimista.
    const reordered = [...items]
    reordered[idx] = other
    reordered[swapIdx] = item
    setItems(reordered)

    try {
      await Promise.all([
        fetch(`/api/admin/testimonials/${item._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: other.order }),
        }),
        fetch(`/api/admin/testimonials/${other._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: item.order }),
        }),
      ])
      fetchItems()
    } catch {
      showToast('error', 'Erro ao reordenar')
      fetchItems()
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      const res = await fetch(`/api/admin/testimonials/${confirmDelete._id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir')
      setItems((prev) => prev.filter((i) => i._id !== confirmDelete._id))
      showToast('success', 'Depoimento excluído.')
      setConfirmDelete(null)
    } catch (e: any) {
      showToast('error', e?.message || 'Erro ao excluir')
    }
  }

  if (authChecking) {
    return <LogoLoading message="Verificando permissões..." size="lg" fullscreen />
  }

  return (
    <AppShell headerTitle="Depoimentos" headerSubtitle="Vídeos de alunos na landing page">
      <div className="container mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => router.push('/admin')} className="-ml-2 rounded-xl">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar
          </Button>
          <Button onClick={openCreate} className="rounded-xl">
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo depoimento
          </Button>
        </div>

        <div className="mb-6 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <Video className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Suba os vídeos no YouTube como <strong>Não listado</strong> e cole o link aqui
              (link normal, de compartilhar, Shorts ou embed — todos funcionam). O{' '}
              <strong>nome</strong> e a <strong>descrição</strong> são opcionais. A ordem definida
              aqui é a mesma exibida na landing.
            </span>
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Carregando...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            <Video className="mx-auto mb-3 h-8 w-8 opacity-50" />
            <p>Nenhum depoimento ainda.</p>
            <p className="text-sm">Clique em “Novo depoimento” para adicionar o primeiro.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={item._id}
                className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center"
              >
                <div className="relative w-full shrink-0 overflow-hidden rounded-lg bg-black sm:w-40">
                  <img
                    src={`https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`}
                    alt={item.name || 'Depoimento'}
                    className="aspect-video w-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {item.name || <span className="text-muted-foreground">(sem nome)</span>}
                    </span>
                    {!item.enabled && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                        Oculto
                      </span>
                    )}
                    {item.vertical && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                        Vertical
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Subir"
                    disabled={idx === 0}
                    onClick={() => move(item, -1)}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Descer"
                    disabled={idx === items.length - 1}
                    onClick={() => move(item, 1)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title={item.enabled ? 'Ocultar' : 'Exibir'}
                    onClick={() => toggleEnabled(item)}
                  >
                    {item.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Excluir"
                    className="text-destructive"
                    onClick={() => setConfirmDelete(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog criar/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar depoimento' : 'Novo depoimento'}</DialogTitle>
            <DialogDescription>
              Cole o link do vídeo do YouTube. Nome e descrição são opcionais.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="embedUrl">
                Link do vídeo (YouTube) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="embedUrl"
                placeholder="https://www.youtube.com/watch?v=..."
                value={form.embedUrl}
                onChange={(e) => setForm((f) => ({ ...f, embedUrl: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Recomendado subir como “Não listado”. Aceita link normal, youtu.be, Shorts ou embed.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">Nome (opcional)</Label>
              <Input
                id="name"
                placeholder="Ex.: Ana, 4º período"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                rows={3}
                placeholder="Uma frase curta sobre a experiência do aluno."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Exibir na landing</Label>
                <p className="text-xs text-muted-foreground">Desligue para ocultar sem excluir.</p>
              </div>
              <Switch
                checked={form.enabled}
                onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog excluir */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir depoimento?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O vídeo continua no YouTube; só o card sai da landing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {toast && (
        <div
          className={`fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2 text-sm text-white shadow-lg ${
            toast.kind === 'success' ? 'bg-emerald-600' : 'bg-destructive'
          }`}
        >
          {toast.message}
        </div>
      )}
    </AppShell>
  )
}
