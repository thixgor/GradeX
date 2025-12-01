'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ToastAlert } from '@/components/ui/toast-alert'
import { ArrowLeft, Plus, Trash2, Loader2, Sparkles } from 'lucide-react'
import { FlashcardTheme } from '@/lib/types'

interface ThemeWithId extends FlashcardTheme {
  _id: string
}

export default function FlashcardThemesAdminPage() {
  const router = useRouter()
  const [themes, setThemes] = useState<ThemeWithId[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [toast, setToast] = useState<{ open: boolean; message: string; type?: 'error' | 'success' }>({ open: false, message: '' })

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [defaultDifficulty, setDefaultDifficulty] = useState(0.5)
  const [suggestedCardCount, setSuggestedCardCount] = useState(5)
  const [contextHint, setContextHint] = useState('')

  useEffect(() => {
    checkAuth()
    loadThemes()
  }, [])

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
      }
    } catch (error) {
      router.push('/auth/login')
    }
  }

  async function loadThemes() {
    try {
      setLoading(true)
      const res = await fetch('/api/flashcards/themes')
      if (!res.ok) throw new Error('Erro ao carregar temas')
      const data = await res.json()
      setThemes((data.themes || []).map((t: FlashcardTheme & { _id: string }) => ({ ...t, _id: t._id })))
    } catch (error: any) {
      setToast({ open: true, message: error.message || 'Erro ao carregar temas', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateTheme() {
    if (!title.trim()) {
      setToast({ open: true, message: 'Título é obrigatório', type: 'error' })
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/flashcards/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          tags: tags
            .split(',')
            .map(t => t.trim())
            .filter(Boolean),
          defaultDifficulty,
          suggestedCardCount,
          contextHint: contextHint.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao criar tema')

      setToast({ open: true, message: 'Tema criado com sucesso!', type: 'success' })
      setTitle('')
      setDescription('')
      setTags('')
      setDefaultDifficulty(0.5)
      setSuggestedCardCount(5)
      setContextHint('')
      setCreateOpen(false)
      loadThemes()
    } catch (error: any) {
      setToast({ open: true, message: error.message || 'Erro ao criar tema', type: 'error' })
    } finally {
      setCreating(false)
    }
  }

  async function handleDeleteTheme(id: string) {
    if (!confirm('Tem certeza que deseja deletar este tema?')) return

    setDeleting(id)
    try {
      const res = await fetch(`/api/flashcards/themes/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao deletar tema')

      setToast({ open: true, message: 'Tema deletado com sucesso!', type: 'success' })
      loadThemes()
    } catch (error: any) {
      setToast({ open: true, message: error.message || 'Erro ao deletar tema', type: 'error' })
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/admin')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Temas de Flashcards</h1>
              <p className="text-muted-foreground">Gerenciar templates reutilizáveis para os usuários</p>
            </div>
          </div>
          <Button className="bg-gradient-to-r from-blue-600 to-cyan-600" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Tema
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : themes.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              Nenhum tema criado ainda. Clique em "Novo Tema" para começar.
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {themes.map(theme => (
              <Card key={theme._id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="truncate">{theme.title}</CardTitle>
                      {theme.description && (
                        <CardDescription className="line-clamp-2 mt-1">{theme.description}</CardDescription>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTheme(theme._id)}
                      disabled={deleting === theme._id}
                    >
                      {deleting === theme._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  {theme.tags && theme.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {theme.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 rounded-full bg-muted text-xs font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Dificuldade sugerida</p>
                      <p className="font-semibold">{Math.round((theme.defaultDifficulty || 0.5) * 100)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cartões sugeridos</p>
                      <p className="font-semibold">{theme.suggestedCardCount || '—'}</p>
                    </div>
                  </div>
                  {theme.contextHint && (
                    <div className="rounded-lg bg-muted p-2 text-xs text-muted-foreground">
                      <strong>Dica:</strong> {theme.contextHint}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Criado por {theme.createdByName} em {new Date(theme.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" /> Novo Tema de Flashcard
            </DialogTitle>
            <DialogDescription>
              Crie um template reutilizável que os usuários poderão usar para gerar flashcards com IA.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Neuroanatomia Clínica"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Descreva brevemente o tema e seu propósito"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="Ex: neurologia, clínica, medicina"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty">
                  Dificuldade sugerida: {Math.round(defaultDifficulty * 100)}%
                </Label>
                <input
                  id="difficulty"
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.1}
                  value={defaultDifficulty}
                  onChange={e => setDefaultDifficulty(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardCount">Cartões sugeridos</Label>
                <Input
                  id="cardCount"
                  type="number"
                  min={1}
                  max={50}
                  value={suggestedCardCount}
                  onChange={e => setSuggestedCardCount(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hint">Dica de contexto para IA</Label>
              <Textarea
                id="hint"
                value={contextHint}
                onChange={e => setContextHint(e.target.value)}
                placeholder="Instruções extras para a IA ao gerar flashcards com este tema"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTheme} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {creating ? 'Criando...' : 'Criar Tema'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ToastAlert open={toast.open} onOpenChange={open => setToast(prev => ({ ...prev, open }))} message={toast.message} type={toast.type} />
    </div>
  )
}
