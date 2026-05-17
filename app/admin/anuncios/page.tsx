'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Image,
  Link2,
  Loader2,
  Megaphone,
  MonitorUp,
  PanelTop,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { AppShell, useAppShell } from '@/components/app-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ToastAlert } from '@/components/ui/toast-alert'
import { LogoLoading } from '@/components/logo-loading'
import { cn } from '@/lib/utils'

type TipoAcao = 'link' | 'modal'
type StatusFilter = 'all' | 'active' | 'inactive'
type TypeFilter = 'all' | TipoAcao

interface Anuncio {
  _id: string
  imagemUrl: string
  ativo: boolean
  ordem: number
  tipoAcao: TipoAcao
  linkUrl?: string
  linkNovaAba?: boolean
  modalTitulo?: string
  modalConteudo?: string
  modalBotaoTexto?: string
  modalBotaoLink?: string
  criadoEm?: string
  atualizadoEm?: string
}

interface FormData {
  imagemUrl: string
  tipoAcao: TipoAcao
  linkUrl: string
  linkNovaAba: boolean
  modalTitulo: string
  modalConteudo: string
  modalBotaoTexto: string
  modalBotaoLink: string
  ativo: boolean
}

const initialFormData: FormData = {
  imagemUrl: '',
  tipoAcao: 'link',
  linkUrl: '',
  linkNovaAba: true,
  modalTitulo: '',
  modalConteudo: '',
  modalBotaoTexto: '',
  modalBotaoLink: '',
  ativo: true,
}

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
]

const typeFilters: Array<{ value: TypeFilter; label: string }> = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'link', label: 'Link' },
  { value: 'modal', label: 'Modal' },
]

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function isValidImageUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('/')) return true

  try {
    const url = new URL(trimmed)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isValidNavigationUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('/')) return true

  try {
    const url = new URL(trimmed)
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)
  } catch {
    return false
  }
}

function formatDate(value?: string) {
  if (!value) return 'Sem data'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sem data'

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getAdTitle(ad: Anuncio) {
  if (ad.modalTitulo?.trim()) return ad.modalTitulo.trim()
  if (ad.tipoAcao === 'link' && ad.linkUrl?.trim()) return getDestinationLabel(ad.linkUrl)
  return `Anuncio #${ad.ordem + 1}`
}

function getDestinationLabel(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return 'Sem destino'
  if (trimmed.startsWith('/')) return trimmed

  try {
    const url = new URL(trimmed)
    return `${url.hostname.replace(/^www\./, '')}${url.pathname === '/' ? '' : url.pathname}`
  } catch {
    return trimmed
  }
}

export default function AdminAnunciosPage() {
  return (
    <AppShell headerTitle="Anuncios" headerSubtitle="Banners globais da plataforma">
      <AdminAnunciosContent />
    </AppShell>
  )
}

function AdminAnunciosContent() {
  const router = useRouter()
  const { isAdmin } = useAppShell()
  const [anuncios, setAnuncios] = useState<Anuncio[]>([])
  const [loadingAnuncios, setLoadingAnuncios] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAnuncio, setEditingAnuncio] = useState<Anuncio | null>(null)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [submitting, setSubmitting] = useState(false)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [anuncioToDelete, setAnuncioToDelete] = useState<Anuncio | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [toast, setToast] = useState<{
    open: boolean
    message: string
    type: 'success' | 'error' | 'info'
  }>({ open: false, message: '', type: 'info' })

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToast({ open: true, message, type })
  }, [])

  const loadAnuncios = useCallback(async () => {
    setLoadingAnuncios(true)
    try {
      const res = await fetch('/api/admin/anuncios', { cache: 'no-store' })
      if (!res.ok) throw new Error('Erro ao carregar anuncios')

      const data = await res.json()
      setAnuncios(Array.isArray(data.anuncios) ? data.anuncios : [])
    } catch (error) {
      console.error('Erro ao carregar anuncios:', error)
      showToast('Erro ao carregar anuncios', 'error')
    } finally {
      setLoadingAnuncios(false)
    }
  }, [showToast])

  useEffect(() => {
    if (!isAdmin) {
      router.replace('/')
      return
    }

    loadAnuncios()
  }, [isAdmin, loadAnuncios, router])

  const sortedAnuncios = useMemo(
    () => [...anuncios].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)),
    [anuncios],
  )

  const stats = useMemo(() => {
    const active = anuncios.filter((ad) => ad.ativo).length
    const link = anuncios.filter((ad) => ad.tipoAcao === 'link').length
    const modal = anuncios.filter((ad) => ad.tipoAcao === 'modal').length

    return {
      total: anuncios.length,
      active,
      inactive: anuncios.length - active,
      link,
      modal,
    }
  }, [anuncios])

  const filteredAnuncios = useMemo(() => {
    const query = normalizeSearch(search.trim())

    return sortedAnuncios.filter((ad) => {
      if (statusFilter === 'active' && !ad.ativo) return false
      if (statusFilter === 'inactive' && ad.ativo) return false
      if (typeFilter !== 'all' && ad.tipoAcao !== typeFilter) return false
      if (!query) return true

      return normalizeSearch(
        [
          ad.imagemUrl,
          ad.linkUrl,
          ad.modalTitulo,
          ad.modalConteudo,
          ad.modalBotaoTexto,
          ad.modalBotaoLink,
        ]
          .filter(Boolean)
          .join(' '),
      ).includes(query)
    })
  }, [search, sortedAnuncios, statusFilter, typeFilter])

  function openCreateDialog() {
    setEditingAnuncio(null)
    setFormData({ ...initialFormData })
    setDialogOpen(true)
  }

  function openEditDialog(anuncio: Anuncio) {
    setEditingAnuncio(anuncio)
    setFormData({
      imagemUrl: anuncio.imagemUrl,
      tipoAcao: anuncio.tipoAcao,
      linkUrl: anuncio.linkUrl || '',
      linkNovaAba: anuncio.linkNovaAba ?? true,
      modalTitulo: anuncio.modalTitulo || '',
      modalConteudo: anuncio.modalConteudo || '',
      modalBotaoTexto: anuncio.modalBotaoTexto || '',
      modalBotaoLink: anuncio.modalBotaoLink || '',
      ativo: anuncio.ativo,
    })
    setDialogOpen(true)
  }

  async function handleSubmit() {
    const imageUrl = formData.imagemUrl.trim()
    const linkUrl = formData.linkUrl.trim()
    const modalButtonLink = formData.modalBotaoLink.trim()

    if (!isValidImageUrl(imageUrl)) {
      showToast('Informe uma URL de imagem http(s) ou um caminho interno iniciado por /', 'error')
      return
    }

    if (formData.tipoAcao === 'link') {
      if (!isValidNavigationUrl(linkUrl)) {
        showToast('Informe uma URL de destino valida para o link', 'error')
        return
      }
    }

    if (formData.tipoAcao === 'modal') {
      if (!formData.modalTitulo.trim()) {
        showToast('Titulo do modal e obrigatorio', 'error')
        return
      }
      if (!formData.modalConteudo.trim()) {
        showToast('Conteudo do modal e obrigatorio', 'error')
        return
      }
      if (modalButtonLink && !isValidNavigationUrl(modalButtonLink)) {
        showToast('Informe uma URL valida para o botao do modal', 'error')
        return
      }
    }

    setSubmitting(true)
    try {
      const payload =
        formData.tipoAcao === 'link'
          ? {
              imagemUrl: imageUrl,
              tipoAcao: formData.tipoAcao,
              ativo: formData.ativo,
              linkUrl,
              linkNovaAba: formData.linkNovaAba,
            }
          : {
              imagemUrl: imageUrl,
              tipoAcao: formData.tipoAcao,
              ativo: formData.ativo,
              modalTitulo: formData.modalTitulo.trim(),
              modalConteudo: formData.modalConteudo,
              modalBotaoTexto: formData.modalBotaoTexto.trim() || undefined,
              modalBotaoLink: modalButtonLink || undefined,
            }

      const res = await fetch(
        editingAnuncio ? `/api/admin/anuncios?id=${editingAnuncio._id}` : '/api/admin/anuncios',
        {
          method: editingAnuncio ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao salvar anuncio')
      }

      showToast(editingAnuncio ? 'Anuncio atualizado com sucesso' : 'Anuncio criado com sucesso', 'success')
      setDialogOpen(false)
      await loadAnuncios()
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Erro ao salvar anuncio', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleAtivo(anuncio: Anuncio) {
    setActionLoading(`${anuncio._id}-status`)
    try {
      const res = await fetch(`/api/admin/anuncios?id=${anuncio._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !anuncio.ativo }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao atualizar anuncio')
      }

      setAnuncios((previous) =>
        previous.map((item) => (item._id === anuncio._id ? { ...item, ativo: !anuncio.ativo } : item)),
      )
      showToast(anuncio.ativo ? 'Anuncio desativado' : 'Anuncio ativado', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Erro ao atualizar anuncio', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  async function moveAnuncio(anuncio: Anuncio, direction: 'up' | 'down') {
    const currentIndex = sortedAnuncios.findIndex((item) => item._id === anuncio._id)
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= sortedAnuncios.length) return

    const targetAnuncio = sortedAnuncios[targetIndex]
    setActionLoading(`${anuncio._id}-move`)

    try {
      const responses = await Promise.all([
        fetch(`/api/admin/anuncios?id=${anuncio._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ordem: targetAnuncio.ordem }),
        }),
        fetch(`/api/admin/anuncios?id=${targetAnuncio._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ordem: anuncio.ordem }),
        }),
      ])

      if (responses.some((response) => !response.ok)) {
        throw new Error('Erro ao reordenar anuncios')
      }

      setAnuncios((previous) =>
        previous.map((item) => {
          if (item._id === anuncio._id) return { ...item, ordem: targetAnuncio.ordem }
          if (item._id === targetAnuncio._id) return { ...item, ordem: anuncio.ordem }
          return item
        }),
      )
      showToast('Ordem atualizada', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Erro ao reordenar anuncios', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  function confirmDelete(anuncio: Anuncio) {
    setAnuncioToDelete(anuncio)
    setDeleteDialogOpen(true)
  }

  async function handleDelete() {
    if (!anuncioToDelete) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/anuncios?id=${anuncioToDelete._id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao excluir anuncio')
      }

      setAnuncios((previous) => previous.filter((item) => item._id !== anuncioToDelete._id))
      showToast('Anuncio excluido com sucesso', 'success')
      setDeleteDialogOpen(false)
      setAnuncioToDelete(null)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Erro ao excluir anuncio', 'error')
    } finally {
      setDeleting(false)
    }
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      showToast(`${label} copiado`, 'success')
    } catch {
      showToast('Nao foi possivel copiar', 'error')
    }
  }

  if (!isAdmin) {
    return <LogoLoading message="Verificando permissoes..." size="lg" fullscreen />
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => router.push('/admin')} className="-ml-2">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao painel
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadAnuncios} disabled={loadingAnuncios}>
            {loadingAnuncios ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Atualizar
          </Button>
          <Button onClick={openCreateDialog} className="bg-[#468152] text-white hover:bg-[#3b7045]">
            <Plus className="mr-2 h-4 w-4" />
            Novo anuncio
          </Button>
        </div>
      </div>

      <div className="mb-6 overflow-hidden rounded-lg border border-[#468152]/20 bg-white/55 p-4 shadow-sm backdrop-blur-xl dark:border-emerald-400/20 dark:bg-white/[0.04]">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#468152]/20 bg-[#468152]/10 text-[#468152]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold">Exibicao global ativada</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Anuncios ativos desta lista aparecem como uma peca flutuante, sucinta e com glassmorphism em toda a plataforma. Rotas com <span className="font-semibold text-foreground">/viewer</span> ficam sem exibicao.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard icon={BarChart3} label="Total" value={stats.total} helper="Cadastrados" />
        <MetricCard icon={CheckCircle2} label="Ativos" value={stats.active} helper="Rodando agora" tone="emerald" />
        <MetricCard icon={XCircle} label="Inativos" value={stats.inactive} helper="Fora da rotacao" tone="slate" />
        <MetricCard icon={Link2} label="Links" value={stats.link} helper="Destino direto" tone="amber" />
        <MetricCard icon={PanelTop} label="Modais" value={stats.modal} helper="Abrem popup" tone="violet" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-4">
          <div className="rounded-lg border border-border/70 bg-card/70 p-3 shadow-sm backdrop-blur-xl">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="flex flex-1 items-center gap-2 rounded-lg border bg-background/70 px-3">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por URL, titulo, conteudo ou destino"
                  className="border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <SegmentedFilter
                label="Status"
                value={statusFilter}
                items={statusFilters}
                onChange={(value) => setStatusFilter(value as StatusFilter)}
              />

              <SegmentedFilter
                label="Tipo"
                value={typeFilter}
                items={typeFilters}
                onChange={(value) => setTypeFilter(value as TypeFilter)}
              />
            </div>
          </div>

          {loadingAnuncios ? (
            <div className="space-y-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-32 animate-pulse rounded-lg border bg-muted/40" />
              ))}
            </div>
          ) : filteredAnuncios.length === 0 ? (
            <EmptyState onCreate={openCreateDialog} hasAds={anuncios.length > 0} />
          ) : (
            <div className="space-y-3">
              {filteredAnuncios.map((anuncio) => {
                const absoluteIndex = sortedAnuncios.findIndex((item) => item._id === anuncio._id)
                return (
                  <AdListItem
                    key={anuncio._id}
                    anuncio={anuncio}
                    isFirst={absoluteIndex === 0}
                    isLast={absoluteIndex === sortedAnuncios.length - 1}
                    loadingKey={actionLoading}
                    onMove={moveAnuncio}
                    onToggle={toggleAtivo}
                    onEdit={openEditDialog}
                    onDelete={confirmDelete}
                    onCopy={copyText}
                  />
                )
              })}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <GlobalPreview anuncios={sortedAnuncios} />

          <div className="rounded-lg border border-border/70 bg-card/70 p-4 shadow-sm backdrop-blur-xl">
            <div className="mb-3 flex items-center gap-2">
              <Image className="h-4 w-4 text-[#E2A43E]" />
              <h3 className="text-sm font-bold">Padrao recomendado</h3>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <GuidelineItem label="Imagem" value="1200 x 400 px ou proporcao 3:1" />
              <GuidelineItem label="Peso" value="Use JPG/WEBP leve para nao atrasar paginas" />
              <GuidelineItem label="Texto" value="Deixe a mensagem principal dentro da imagem" />
              <GuidelineItem label="Modal" value="Conteudo curto, com CTA opcional" />
            </div>
          </div>
        </aside>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingAnuncio ? 'Editar anuncio' : 'Novo anuncio'}</DialogTitle>
            <DialogDescription>
              Configure a imagem, o destino e o status do banner global.
            </DialogDescription>
          </DialogHeader>

          <div className="grid max-h-[68vh] gap-5 overflow-y-auto pr-1 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="imagemUrl">URL da imagem *</Label>
                <Input
                  id="imagemUrl"
                  placeholder="https://exemplo.com/banner.jpg ou /uploads/banner.jpg"
                  value={formData.imagemUrl}
                  onChange={(event) => setFormData({ ...formData, imagemUrl: event.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Aceita http(s) ou caminhos internos iniciados por /.
                </p>
              </div>

              <div className="space-y-3">
                <Label>Tipo de acao *</Label>
                <RadioGroup
                  value={formData.tipoAcao}
                  onValueChange={(value) => setFormData({ ...formData, tipoAcao: value as TipoAcao })}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  <ActionChoice
                    id="tipo-link"
                    value="link"
                    title="Abrir link"
                    description="Envia o usuario para uma pagina interna ou externa."
                    icon={ExternalLink}
                  />
                  <ActionChoice
                    id="tipo-modal"
                    value="modal"
                    title="Abrir modal"
                    description="Mostra uma janela curta dentro da plataforma."
                    icon={PanelTop}
                  />
                </RadioGroup>
              </div>

              {formData.tipoAcao === 'link' ? (
                <div className="space-y-4 rounded-lg border border-[#E2A43E]/30 bg-[#E2A43E]/5 p-4">
                  <div className="space-y-2">
                    <Label htmlFor="linkUrl">URL de destino *</Label>
                    <Input
                      id="linkUrl"
                      placeholder="https://exemplo.com ou /materiais"
                      value={formData.linkUrl}
                      onChange={(event) => setFormData({ ...formData, linkUrl: event.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="linkNovaAba"
                      checked={formData.linkNovaAba}
                      onCheckedChange={(checked) => setFormData({ ...formData, linkNovaAba: !!checked })}
                    />
                    <Label htmlFor="linkNovaAba" className="cursor-pointer text-sm">
                      Abrir em nova aba
                    </Label>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 rounded-lg border border-[#468152]/30 bg-[#468152]/5 p-4">
                  <div className="space-y-2">
                    <Label htmlFor="modalTitulo">Titulo do modal *</Label>
                    <Input
                      id="modalTitulo"
                      placeholder="Titulo curto do popup"
                      value={formData.modalTitulo}
                      onChange={(event) => setFormData({ ...formData, modalTitulo: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modalConteudo">Conteudo do modal *</Label>
                    <Textarea
                      id="modalConteudo"
                      placeholder="<p>Mensagem curta do anuncio...</p>"
                      value={formData.modalConteudo}
                      onChange={(event) => setFormData({ ...formData, modalConteudo: event.target.value })}
                      rows={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      Tags simples como p, strong, em, ul, li e a sao aceitas na exibicao publica.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="modalBotaoTexto">Texto do botao</Label>
                      <Input
                        id="modalBotaoTexto"
                        placeholder="Saiba mais"
                        value={formData.modalBotaoTexto}
                        onChange={(event) => setFormData({ ...formData, modalBotaoTexto: event.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="modalBotaoLink">Link do botao</Label>
                      <Input
                        id="modalBotaoLink"
                        placeholder="https://exemplo.com"
                        value={formData.modalBotaoLink}
                        onChange={(event) => setFormData({ ...formData, modalBotaoLink: event.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/25 p-4">
                <div>
                  <Label>Status do anuncio</Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.ativo ? 'Vai entrar na rotacao global' : 'Fica salvo, mas fora da rotacao'}
                  </p>
                </div>
                <Switch
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold">
                  <MonitorUp className="h-4 w-4 text-[#468152]" />
                  Preview compacto
                </div>
                <MiniAdPreview formData={formData} />
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">
                A peca publica aparece fixa na parte inferior, com botao para ocultar por 30 minutos e rotacao automatica entre anuncios ativos.
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-[#468152] text-white hover:bg-[#3b7045]">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingAnuncio ? 'Salvar alteracoes' : 'Criar anuncio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir anuncio</DialogTitle>
            <DialogDescription>
              Esta acao remove o anuncio da rotacao e da lista administrativa.
            </DialogDescription>
          </DialogHeader>

          {anuncioToDelete && (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-lg border bg-muted/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={anuncioToDelete.imagemUrl}
                  alt={getAdTitle(anuncioToDelete)}
                  className="max-h-36 w-full object-contain"
                />
              </div>
              <p className="truncate text-sm text-muted-foreground">{anuncioToDelete.imagemUrl}</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ToastAlert
        open={toast.open}
        onOpenChange={(open) => setToast({ ...toast, open })}
        message={toast.message}
        type={toast.type}
      />
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  tone = 'emerald',
}: {
  icon: LucideIcon
  label: string
  value: number
  helper: string
  tone?: 'emerald' | 'amber' | 'slate' | 'violet'
}) {
  const toneClass = {
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
    slate: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
  }[tone]

  return (
    <div className="rounded-lg border border-border/70 bg-card/70 p-4 shadow-sm backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{helper}</p>
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', toneClass)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function SegmentedFilter({
  label,
  value,
  items,
  onChange,
}: {
  label: string
  value: string
  items: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="mr-1 text-xs font-semibold text-muted-foreground">{label}</span>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={cn(
            'rounded-lg px-3 py-2 text-xs font-bold transition',
            value === item.value
              ? 'bg-[#468152] text-white shadow-sm'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

function AdListItem({
  anuncio,
  isFirst,
  isLast,
  loadingKey,
  onMove,
  onToggle,
  onEdit,
  onDelete,
  onCopy,
}: {
  anuncio: Anuncio
  isFirst: boolean
  isLast: boolean
  loadingKey: string | null
  onMove: (anuncio: Anuncio, direction: 'up' | 'down') => void
  onToggle: (anuncio: Anuncio) => void
  onEdit: (anuncio: Anuncio) => void
  onDelete: (anuncio: Anuncio) => void
  onCopy: (text: string, label: string) => void
}) {
  const isBusy = loadingKey?.startsWith(anuncio._id)

  return (
    <article
      className={cn(
        'overflow-hidden rounded-lg border border-border/70 bg-card/75 shadow-sm backdrop-blur-xl transition',
        !anuncio.ativo && 'opacity-70',
      )}
    >
      <div className={cn('h-1', anuncio.ativo ? 'bg-[#468152]' : 'bg-muted-foreground/35')} />
      <div className="grid gap-4 p-4 md:grid-cols-[180px_minmax(0,1fr)_auto]">
        <div className="overflow-hidden rounded-lg border bg-muted/25">
          <div className="relative aspect-[3/1] md:aspect-[16/9]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={anuncio.imagemUrl}
              alt={getAdTitle(anuncio)}
              className="h-full w-full object-cover"
              onError={(event) => {
                event.currentTarget.style.opacity = '0'
              }}
            />
            <div className="absolute left-2 top-2 flex items-center gap-1">
              <Badge className={cn('border px-2 py-0.5 text-[11px]', anuncio.ativo ? 'border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'border-slate-500/25 bg-slate-500/15 text-slate-600 dark:text-slate-300')}>
                {anuncio.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge className={cn('border text-xs', anuncio.tipoAcao === 'link' ? 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300')}>
              {anuncio.tipoAcao === 'link' ? 'Link' : 'Modal'}
            </Badge>
            <span className="rounded-lg bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
              Ordem {anuncio.ordem}
            </span>
            <span className="text-xs text-muted-foreground">
              Atualizado em {formatDate(anuncio.atualizadoEm || anuncio.criadoEm)}
            </span>
          </div>

          <h3 className="truncate text-base font-bold">{getAdTitle(anuncio)}</h3>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {anuncio.tipoAcao === 'link' && anuncio.linkUrl
              ? getDestinationLabel(anuncio.linkUrl)
              : anuncio.modalConteudo || 'Modal sem resumo'}
          </p>
          <p className="mt-2 truncate text-xs text-muted-foreground">Imagem: {anuncio.imagemUrl}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:w-[112px] md:justify-end">
          <IconButton label="Mover para cima" onClick={() => onMove(anuncio, 'up')} disabled={isFirst || isBusy}>
            {isBusy && loadingKey?.endsWith('-move') ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
          </IconButton>
          <IconButton label="Mover para baixo" onClick={() => onMove(anuncio, 'down')} disabled={isLast || isBusy}>
            <ArrowDown className="h-4 w-4" />
          </IconButton>
          <IconButton label={anuncio.ativo ? 'Desativar' : 'Ativar'} onClick={() => onToggle(anuncio)} disabled={isBusy}>
            {isBusy && loadingKey?.endsWith('-status') ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : anuncio.ativo ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </IconButton>
          <IconButton label="Copiar URL da imagem" onClick={() => onCopy(anuncio.imagemUrl, 'URL da imagem')}>
            <Copy className="h-4 w-4" />
          </IconButton>
          <IconButton label="Editar" onClick={() => onEdit(anuncio)}>
            <Pencil className="h-4 w-4" />
          </IconButton>
          <IconButton label="Excluir" onClick={() => onDelete(anuncio)} destructive>
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
    </article>
  )
}

function IconButton({
  label,
  onClick,
  disabled,
  destructive,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  destructive?: boolean
  children: ReactNode
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        'h-9 w-9',
        destructive && 'text-red-500 hover:bg-red-500/10 hover:text-red-600',
      )}
    >
      {children}
    </Button>
  )
}

function EmptyState({ onCreate, hasAds }: { onCreate: () => void; hasAds: boolean }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/25 p-8 text-center">
      <Image className="mx-auto h-10 w-10 text-muted-foreground" />
      <h3 className="mt-3 text-base font-bold">{hasAds ? 'Nenhum anuncio encontrado' : 'Nenhum anuncio cadastrado'}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        {hasAds
          ? 'Ajuste os filtros ou a busca para ver outros itens.'
          : 'Crie o primeiro anuncio para iniciar a rotacao global da plataforma.'}
      </p>
      {!hasAds && (
        <Button onClick={onCreate} className="mt-4 bg-[#468152] text-white hover:bg-[#3b7045]">
          <Plus className="mr-2 h-4 w-4" />
          Criar anuncio
        </Button>
      )}
    </div>
  )
}

function GlobalPreview({ anuncios }: { anuncios: Anuncio[] }) {
  const activeAd = anuncios.find((ad) => ad.ativo)

  return (
    <div className="sticky top-20 rounded-lg border border-border/70 bg-card/70 p-4 shadow-sm backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MonitorUp className="h-4 w-4 text-[#468152]" />
          <h3 className="text-sm font-bold">Preview global</h3>
        </div>
        <Badge className="border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
          Live
        </Badge>
      </div>

      {activeAd ? (
        <MiniAdPreview anuncio={activeAd} />
      ) : (
        <div className="rounded-lg border border-dashed bg-muted/25 p-5 text-center text-sm text-muted-foreground">
          Nenhum anuncio ativo para exibir.
        </div>
      )}

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Este formato roda no layout principal da aplicacao e respeita a regra de exclusao de /viewer.
      </p>
    </div>
  )
}

function MiniAdPreview({ anuncio, formData }: { anuncio?: Anuncio; formData?: FormData }) {
  const imageUrl = anuncio?.imagemUrl || formData?.imagemUrl || ''
  const title = anuncio ? getAdTitle(anuncio) : formData?.modalTitulo || getDestinationLabel(formData?.linkUrl || '') || 'Titulo do anuncio'
  const type = anuncio?.tipoAcao || formData?.tipoAcao || 'link'

  return (
    <div className="overflow-hidden rounded-lg border border-white/50 bg-white/80 p-2 shadow-lg backdrop-blur-2xl dark:border-white/15 dark:bg-slate-950/70">
      <div className="flex min-h-[76px] items-center gap-2">
        <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white/70 p-1 dark:bg-slate-900/70">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={title} className="max-h-full max-w-full object-contain" />
          ) : (
            <Image className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-[#468152]">
            <Megaphone className="h-3 w-3" />
            {type === 'link' ? 'Destaque' : 'Publicidade'}
          </div>
          <p className="line-clamp-2 text-xs font-black leading-tight">{title}</p>
          <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-[#468152]/10 px-2 py-0.5 text-[10px] font-bold text-[#468152]">
            {type === 'link' ? 'Ver agora' : 'Abrir modal'}
          </div>
        </div>
        {type === 'link' ? <ExternalLink className="h-4 w-4 text-muted-foreground" /> : <PanelTop className="h-4 w-4 text-muted-foreground" />}
      </div>
    </div>
  )
}

function GuidelineItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <span className="font-semibold text-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  )
}

function ActionChoice({
  id,
  value,
  title,
  description,
  icon: Icon,
}: {
  id: string
  value: TipoAcao
  title: string
  description: string
  icon: LucideIcon
}) {
  return (
    <div className="relative">
      <RadioGroupItem value={value} id={id} className="peer sr-only" />
      <Label
        htmlFor={id}
        className="flex h-full cursor-pointer gap-3 rounded-lg border bg-background/70 p-4 transition hover:bg-muted/60 peer-data-[state=checked]:border-[#468152] peer-data-[state=checked]:bg-[#468152]/10"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground peer-data-[state=checked]:text-[#468152]">
          <Icon className="h-4 w-4" />
        </span>
        <span>
          <span className="block text-sm font-bold">{title}</span>
          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{description}</span>
        </span>
      </Label>
    </div>
  )
}
