'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ThemeToggle } from '@/components/theme-toggle'
import { ToastAlert } from '@/components/ui/toast-alert'
import { BanChecker } from '@/components/ban-checker'
import { ArrowLeft, Plus, Edit2, Trash2, MessageSquare, FileText } from 'lucide-react'
import { ForumTopic, ForumType } from '@/lib/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ForumTopicsPage() {
  const router = useRouter()
  const [discussionTopics, setDiscussionTopics] = useState<ForumTopic[]>([])
  const [materialsTopics, setMaterialsTopics] = useState<ForumTopic[]>([])
  const [loading, setLoading] = useState(true)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [showDialog, setShowDialog] = useState(false)
  const [selectedForumType, setSelectedForumType] = useState<ForumType>('discussion')
  const [formData, setFormData] = useState({ name: '', description: '', color: '#3B82F6', icon: '📁' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadTopics()
  }, [])

  async function loadTopics() {
    try {
      const [discussionRes, materialsRes] = await Promise.all([
        fetch('/api/forum/topics?type=discussion'),
        fetch('/api/forum/topics?type=materials')
      ])

      if (discussionRes.ok) {
        const data = await discussionRes.json()
        setDiscussionTopics(data.topics || [])
      }

      if (materialsRes.ok) {
        const data = await materialsRes.json()
        setMaterialsTopics(data.topics || [])
      }
    } catch (error) {
      console.error('Erro ao carregar tópicos:', error)
      setToastMessage('Erro ao carregar tópicos')
      setToastType('error')
      setToastOpen(true)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateTopic() {
    if (!formData.name.trim()) {
      setToastMessage('Nome do tópico é obrigatório')
      setToastType('error')
      setToastOpen(true)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/forum/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          forumType: selectedForumType
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar tópico')
      }

      setToastMessage('Tópico criado com sucesso!')
      setToastType('success')
      setToastOpen(true)
      setFormData({ name: '', description: '', color: '#3B82F6', icon: '📁' })
      setShowDialog(false)
      loadTopics()
    } catch (error: any) {
      setToastMessage(error.message)
      setToastType('error')
      setToastOpen(true)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteTopic(topicId: string) {
    if (!confirm('Tem certeza que deseja deletar este tópico?')) return

    try {
      const res = await fetch(`/api/forum/topics/${topicId}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        throw new Error('Erro ao deletar tópico')
      }

      setToastMessage('Tópico deletado com sucesso!')
      setToastType('success')
      setToastOpen(true)
      loadTopics()
    } catch (error: any) {
      setToastMessage(error.message)
      setToastType('error')
      setToastOpen(true)
    }
  }

  function renderTopicsList(topics: ForumTopic[]) {
    if (topics.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Nenhum tópico criado ainda</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-2">
        {topics.map((topic) => (
          <Card key={String(topic._id)} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{topic.icon}</span>
                    {topic.name}
                  </CardTitle>
                  {topic.description && (
                    <CardDescription className="mt-2">{topic.description}</CardDescription>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData({
                        name: topic.name,
                        description: topic.description || '',
                        color: topic.color || '#3B82F6',
                        icon: topic.icon || '📁'
                      })
                      setSelectedForumType(topic.forumType)
                      setShowDialog(true)
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteTopic(String(topic._id))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: topic.color }}
                />
                <span>Cor: {topic.color}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <BanChecker />

      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/admin')}
                className="shrink-0 h-8 w-8 sm:h-9 sm:w-9"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">Tópicos do Fórum</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  Gerenciar tópicos de discussão e materiais
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button
            onClick={() => {
              setFormData({ name: '', description: '', color: '#3B82F6', icon: '📁' })
              setShowDialog(true)
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Tópico
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : (
          <Tabs defaultValue="discussion" className="space-y-6">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="discussion" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Discussão
              </TabsTrigger>
              <TabsTrigger value="materials" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Materiais
              </TabsTrigger>
            </TabsList>

            <TabsContent value="discussion" className="space-y-4">
              {renderTopicsList(discussionTopics)}
            </TabsContent>

            <TabsContent value="materials" className="space-y-4">
              {renderTopicsList(materialsTopics)}
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Dialog de Criar/Editar Tópico */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-background via-background to-muted/50 backdrop-blur-xl border border-white/10 shadow-2xl">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ✨ Novo Tópico
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Organize seus posts em tópicos temáticos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold">
                Nome do Tópico *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Biologia, Química..."
                className="bg-white/5 border-white/10 focus:border-blue-500 focus:bg-white/10 transition-all"
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold">
                Descrição
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o tópico (opcional)"
                className="bg-white/5 border-white/10 focus:border-blue-500 focus:bg-white/10 transition-all"
              />
            </div>

            {/* Ícone e Cor em Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="icon" className="text-sm font-semibold">
                  Ícone (emoji)
                </Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="📁"
                  maxLength={2}
                  className="bg-white/5 border-white/10 focus:border-blue-500 focus:bg-white/10 transition-all text-center text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color" className="text-sm font-semibold">
                  Cor
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-10 cursor-pointer rounded border-white/10"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#3B82F6"
                    className="flex-1 bg-white/5 border-white/10 focus:border-blue-500 focus:bg-white/10 transition-all text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Tipo de Fórum */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Tipo de Fórum
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={selectedForumType === 'discussion' ? 'default' : 'outline'}
                  onClick={() => setSelectedForumType('discussion')}
                  className={`transition-all ${
                    selectedForumType === 'discussion'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 border-0'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Discussão
                </Button>
                <Button
                  variant={selectedForumType === 'materials' ? 'default' : 'outline'}
                  onClick={() => setSelectedForumType('materials')}
                  className={`transition-all ${
                    selectedForumType === 'materials'
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 border-0'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Materiais
                </Button>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">Preview:</p>
              <div className="flex items-center gap-2 p-2 bg-white/5 rounded border border-white/10">
                <span className="text-2xl">{formData.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{formData.name || 'Nome do Tópico'}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {formData.description || 'Descrição...'}
                  </p>
                </div>
                <div
                  className="w-3 h-3 rounded-full ml-auto"
                  style={{ backgroundColor: formData.color }}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4 border-t border-white/10">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="bg-white/5 border-white/10 hover:bg-white/10"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateTopic}
              disabled={submitting}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0"
            >
              {submitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Criando...
                </>
              ) : (
                <>
                  ✨ Criar Tópico
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ToastAlert
        open={toastOpen}
        onOpenChange={setToastOpen}
        message={toastMessage}
        type={toastType}
      />
    </div>
  )
}
