'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ToastAlert } from '@/components/ui/toast-alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, ExternalLink, Image, Megaphone, ArrowLeft, Loader2 } from 'lucide-react'

interface Anuncio {
  _id: string
  imagemUrl: string
  ativo: boolean
  ordem: number
  tipoAcao: 'link' | 'modal'
  linkUrl?: string
  linkNovaAba?: boolean
  modalTitulo?: string
  modalConteudo?: string
  modalBotaoTexto?: string
  modalBotaoLink?: string
  criadoEm: string
  atualizadoEm: string
}

interface FormData {
  imagemUrl: string
  tipoAcao: 'link' | 'modal'
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
  ativo: true
}

export default function AdminAnunciosPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [anuncios, setAnuncios] = useState<Anuncio[]>([])
  const [loadingAnuncios, setLoadingAnuncios] = useState(false)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAnuncio, setEditingAnuncio] = useState<Anuncio | null>(null)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [submitting, setSubmitting] = useState(false)

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [anuncioToDelete, setAnuncioToDelete] = useState<Anuncio | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Toast state
  const [toast, setToast] = useState<{
    open: boolean
    message: string
    type: 'success' | 'error' | 'info'
  }>({ open: false, message: '', type: 'info' })

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      loadAnuncios()
    }
  }, [user])

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/auth/login')
        return
      }
      const data = await res.json()
      if (data.user.role !== 'admin') {
        router.push('/')
        return
      }
      setUser(data.user)
    } catch (error) {
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  async function loadAnuncios() {
    setLoadingAnuncios(true)
    try {
      const res = await fetch('/api/admin/anuncios')
      if (res.ok) {
        const data = await res.json()
        setAnuncios(data.anuncios || [])
      }
    } catch (error) {
      console.error('Erro ao carregar anuncios:', error)
      showToast('Erro ao carregar anuncios', 'error')
    } finally {
      setLoadingAnuncios(false)
    }
  }

  function showToast(message: string, type: 'success' | 'error' | 'info') {
    setToast({ open: true, message, type })
  }

  function openCreateDialog() {
    setEditingAnuncio(null)
    setFormData(initialFormData)
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
      ativo: anuncio.ativo
    })
    setDialogOpen(true)
  }

  async function handleSubmit() {
    // Validations
    if (!formData.imagemUrl.trim()) {
      showToast('URL da imagem e obrigatoria', 'error')
      return
    }

    if (formData.tipoAcao === 'link' && !formData.linkUrl.trim()) {
      showToast('URL do link e obrigatoria', 'error')
      return
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
    }

    setSubmitting(true)
    try {
      const payload = {
        imagemUrl: formData.imagemUrl,
        tipoAcao: formData.tipoAcao,
        ativo: formData.ativo,
        ...(formData.tipoAcao === 'link'
          ? {
              linkUrl: formData.linkUrl,
              linkNovaAba: formData.linkNovaAba
            }
          : {
              modalTitulo: formData.modalTitulo,
              modalConteudo: formData.modalConteudo,
              modalBotaoTexto: formData.modalBotaoTexto || undefined,
              modalBotaoLink: formData.modalBotaoLink || undefined
            })
      }

      let res
      if (editingAnuncio) {
        res = await fetch(`/api/admin/anuncios?id=${editingAnuncio._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } else {
        res = await fetch('/api/admin/anuncios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      if (res.ok) {
        showToast(
          editingAnuncio ? 'Anuncio atualizado com sucesso!' : 'Anuncio criado com sucesso!',
          'success'
        )
        setDialogOpen(false)
        loadAnuncios()
      } else {
        const data = await res.json()
        showToast(data.error || 'Erro ao salvar anuncio', 'error')
      }
    } catch (error) {
      showToast('Erro ao salvar anuncio', 'error')
    } finally {
      setSubmitting(false)
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
        method: 'DELETE'
      })

      if (res.ok) {
        showToast('Anuncio excluido com sucesso!', 'success')
        setDeleteDialogOpen(false)
        setAnuncioToDelete(null)
        loadAnuncios()
      } else {
        const data = await res.json()
        showToast(data.error || 'Erro ao excluir anuncio', 'error')
      }
    } catch (error) {
      showToast('Erro ao excluir anuncio', 'error')
    } finally {
      setDeleting(false)
    }
  }

  async function toggleAtivo(anuncio: Anuncio) {
    try {
      const res = await fetch(`/api/admin/anuncios?id=${anuncio._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !anuncio.ativo })
      })

      if (res.ok) {
        showToast(
          anuncio.ativo ? 'Anuncio desativado!' : 'Anuncio ativado!',
          'success'
        )
        loadAnuncios()
      } else {
        const data = await res.json()
        showToast(data.error || 'Erro ao atualizar anuncio', 'error')
      }
    } catch (error) {
      showToast('Erro ao atualizar anuncio', 'error')
    }
  }

  async function moveAnuncio(anuncio: Anuncio, direction: 'up' | 'down') {
    const currentIndex = anuncios.findIndex((a) => a._id === anuncio._id)
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    if (targetIndex < 0 || targetIndex >= anuncios.length) return

    const targetAnuncio = anuncios[targetIndex]

    try {
      // Swap orders
      await Promise.all([
        fetch(`/api/admin/anuncios?id=${anuncio._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ordem: targetAnuncio.ordem })
        }),
        fetch(`/api/admin/anuncios?id=${targetAnuncio._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ordem: anuncio.ordem })
        })
      ])

      loadAnuncios()
    } catch (error) {
      showToast('Erro ao reordenar anuncios', 'error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/admin')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <Megaphone className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: '#E2A43E' }} />
                Gerenciar Anuncios
              </h1>
              <p className="text-sm text-muted-foreground">
                Crie e gerencie os banners e anuncios da plataforma
              </p>
            </div>
          </div>
          <Button
            onClick={openCreateDialog}
            className="gap-2"
            style={{ backgroundColor: '#468152' }}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Novo Anuncio</span>
          </Button>
        </div>

        {/* Info box */}
        <div className="mb-6 p-4 rounded-lg border" style={{ backgroundColor: 'rgba(70, 129, 82, 0.1)', borderColor: '#468152' }}>
          <p className="text-sm">
            <strong>Dica:</strong> Os anuncios sao exibidos na ordem definida. Use as setas para reordenar.
            Anuncios inativos nao sao exibidos para os usuarios.
          </p>
        </div>

        {/* Image Size Info */}
        <div className="mb-6 p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
              <Image className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-300 text-sm">Tamanho Recomendado de Imagem</h4>
              <ul className="text-sm text-blue-700 dark:text-blue-400 mt-1 space-y-1">
                <li>• <strong>Dimensões:</strong> 1200 x 400 pixels (proporção 3:1) ou 1920 x 640 pixels</li>
                <li>• <strong>Altura máxima do banner:</strong> 250px (imagens maiores serão ajustadas)</li>
                <li>• <strong>Formato:</strong> PNG ou JPG (PNG para melhor qualidade)</li>
                <li>• <strong>No Modal:</strong> A imagem aparece com altura máxima de 192px (tamanho menor)</li>
              </ul>
              <p className="text-xs text-blue-600 dark:text-blue-500 mt-2">
                💡 Use imagens panorâmicas horizontais para melhor visualização no banner rotativo.
              </p>
            </div>
          </div>
        </div>

        {/* Anuncios List */}
        {loadingAnuncios ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : anuncios.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Image className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Nenhum anuncio cadastrado</p>
              <Button onClick={openCreateDialog} style={{ backgroundColor: '#468152' }}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Anuncio
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {anuncios.map((anuncio, index) => (
              <Card
                key={anuncio._id}
                className={`relative overflow-hidden transition-all ${
                  !anuncio.ativo ? 'opacity-60' : ''
                }`}
              >
                {/* Active/Inactive indicator bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: anuncio.ativo ? '#468152' : '#9ca3af' }}
                />

                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Image Preview */}
                    <div className="w-full sm:w-48 flex-shrink-0">
                      <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-muted border">
                        {anuncio.imagemUrl ? (
                          <img
                            src={anuncio.imagemUrl}
                            alt="Preview do anuncio"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        {/* Status badge */}
                        <div
                          className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${
                            anuncio.ativo
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }`}
                        >
                          {anuncio.ativo ? 'Ativo' : 'Inativo'}
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="px-2 py-0.5 rounded text-xs font-medium"
                              style={{
                                backgroundColor:
                                  anuncio.tipoAcao === 'link'
                                    ? 'rgba(226, 164, 62, 0.2)'
                                    : 'rgba(70, 129, 82, 0.2)',
                                color: anuncio.tipoAcao === 'link' ? '#E2A43E' : '#468152'
                              }}
                            >
                              {anuncio.tipoAcao === 'link' ? 'Link Externo' : 'Modal'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Ordem: {anuncio.ordem}
                            </span>
                          </div>

                          {anuncio.tipoAcao === 'link' && anuncio.linkUrl && (
                            <p className="text-sm text-muted-foreground mt-1 truncate max-w-md flex items-center gap-1">
                              <ExternalLink className="h-3 w-3 flex-shrink-0" />
                              {anuncio.linkUrl}
                              {anuncio.linkNovaAba && (
                                <span className="text-xs">(nova aba)</span>
                              )}
                            </p>
                          )}

                          {anuncio.tipoAcao === 'modal' && anuncio.modalTitulo && (
                            <p className="text-sm font-medium mt-1">
                              Modal: {anuncio.modalTitulo}
                            </p>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground truncate">
                        URL: {anuncio.imagemUrl}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => moveAnuncio(anuncio, 'up')}
                        disabled={index === 0}
                        title="Mover para cima"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => moveAnuncio(anuncio, 'down')}
                        disabled={index === anuncios.length - 1}
                        title="Mover para baixo"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleAtivo(anuncio)}
                        title={anuncio.ativo ? 'Desativar' : 'Ativar'}
                      >
                        {anuncio.ativo ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditDialog(anuncio)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => confirmDelete(anuncio)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAnuncio ? 'Editar Anuncio' : 'Novo Anuncio'}
              </DialogTitle>
              <DialogDescription>
                {editingAnuncio
                  ? 'Altere as informacoes do anuncio'
                  : 'Preencha as informacoes para criar um novo anuncio'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto px-1">
              {/* Image URL */}
              <div className="space-y-2">
                <Label htmlFor="imagemUrl">URL da Imagem *</Label>
                <Input
                  id="imagemUrl"
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={formData.imagemUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imagemUrl: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Image className="h-3 w-3" />
                  Tamanho recomendado: <strong>1200x400px</strong> (proporção 3:1). Altura máx. no banner: 250px | Modal: 192px
                </p>
                {formData.imagemUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden border bg-muted">
                    <img
                      src={formData.imagemUrl}
                      alt="Preview"
                      className="w-full max-h-40 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Tipo de Acao */}
              <div className="space-y-3">
                <Label>Tipo de Acao *</Label>
                <RadioGroup
                  value={formData.tipoAcao}
                  onValueChange={(value: 'link' | 'modal') =>
                    setFormData({ ...formData, tipoAcao: value })
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="link" id="tipo-link" />
                    <Label htmlFor="tipo-link" className="cursor-pointer">
                      Link Externo
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="modal" id="tipo-modal" />
                    <Label htmlFor="tipo-modal" className="cursor-pointer">
                      Abrir Modal
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Link fields */}
              {formData.tipoAcao === 'link' && (
                <div className="space-y-4 p-4 rounded-lg border" style={{ borderColor: '#E2A43E' }}>
                  <div className="space-y-2">
                    <Label htmlFor="linkUrl">URL do Link *</Label>
                    <Input
                      id="linkUrl"
                      placeholder="https://exemplo.com/pagina"
                      value={formData.linkUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, linkUrl: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="linkNovaAba"
                      checked={formData.linkNovaAba}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, linkNovaAba: !!checked })
                      }
                    />
                    <Label htmlFor="linkNovaAba" className="cursor-pointer">
                      Abrir em nova aba
                    </Label>
                  </div>
                </div>
              )}

              {/* Modal fields */}
              {formData.tipoAcao === 'modal' && (
                <div className="space-y-4 p-4 rounded-lg border" style={{ borderColor: '#468152' }}>
                  <div className="space-y-2">
                    <Label htmlFor="modalTitulo">Titulo do Modal *</Label>
                    <Input
                      id="modalTitulo"
                      placeholder="Titulo do popup"
                      value={formData.modalTitulo}
                      onChange={(e) =>
                        setFormData({ ...formData, modalTitulo: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modalConteudo">Conteudo do Modal (HTML) *</Label>
                    <Textarea
                      id="modalConteudo"
                      placeholder="<p>Conteudo em HTML...</p>"
                      value={formData.modalConteudo}
                      onChange={(e) =>
                        setFormData({ ...formData, modalConteudo: e.target.value })
                      }
                      rows={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Voce pode usar tags HTML como &lt;p&gt;, &lt;strong&gt;, &lt;a&gt;, etc.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modalBotaoTexto">Texto do Botao (opcional)</Label>
                    <Input
                      id="modalBotaoTexto"
                      placeholder="Ex: Saiba mais"
                      value={formData.modalBotaoTexto}
                      onChange={(e) =>
                        setFormData({ ...formData, modalBotaoTexto: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modalBotaoLink">Link do Botao (opcional)</Label>
                    <Input
                      id="modalBotaoLink"
                      placeholder="https://exemplo.com"
                      value={formData.modalBotaoLink}
                      onChange={(e) =>
                        setFormData({ ...formData, modalBotaoLink: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}

              {/* Ativo switch */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <Label>Status do Anuncio</Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.ativo
                      ? 'Anuncio sera exibido aos usuarios'
                      : 'Anuncio nao sera exibido'}
                  </p>
                </div>
                <Switch
                  checked={formData.ativo}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, ativo: checked })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                style={{ backgroundColor: '#468152' }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : editingAnuncio ? (
                  'Salvar Alteracoes'
                ) : (
                  'Criar Anuncio'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusao</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir este anuncio? Esta acao nao pode ser
                desfeita.
              </DialogDescription>
            </DialogHeader>
            {anuncioToDelete && (
              <div className="py-4">
                <div className="rounded-lg overflow-hidden border bg-muted mb-2">
                  <img
                    src={anuncioToDelete.imagemUrl}
                    alt="Anuncio a ser excluido"
                    className="w-full max-h-32 object-contain"
                  />
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {anuncioToDelete.imagemUrl}
                </p>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Toast */}
        <ToastAlert
          open={toast.open}
          onOpenChange={(open) => setToast({ ...toast, open })}
          message={toast.message}
          type={toast.type}
        />
      </div>
    </div>
  )
}
