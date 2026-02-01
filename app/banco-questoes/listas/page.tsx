'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  List,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ChevronRight,
  BookOpen,
  Lock
} from 'lucide-react'
import { BancoListaUsuario } from '@/lib/types/banco-questoes'

export default function MinhasListasPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [requiresPremium, setRequiresPremium] = useState(false)
  const [listas, setListas] = useState<(BancoListaUsuario & { totalQuestoes?: number })[]>([])

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingLista, setEditingLista] = useState<BancoListaUsuario | null>(null)
  const [nomeLista, setNomeLista] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadListas()
  }, [])

  async function loadListas() {
    try {
      const res = await fetch('/api/banco/listas')
      if (res.status === 403) {
        const data = await res.json()
        if (data.requiresPremium) {
          setRequiresPremium(true)
          setLoading(false)
          return
        }
      }
      if (res.ok) {
        const data = await res.json()
        setListas(data.listas)
      }
    } catch (error) {
      console.error('Erro ao carregar listas:', error)
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setModalMode('create')
    setEditingLista(null)
    setNomeLista('')
    setShowModal(true)
  }

  function openEditModal(lista: BancoListaUsuario) {
    setModalMode('edit')
    setEditingLista(lista)
    setNomeLista(lista.nome)
    setShowModal(true)
  }

  async function handleSave() {
    if (!nomeLista.trim()) return

    setSaving(true)
    try {
      const url = modalMode === 'edit'
        ? `/api/banco/listas/${editingLista?._id}`
        : '/api/banco/listas'

      const res = await fetch(url, {
        method: modalMode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nomeLista.trim() })
      })

      if (res.ok) {
        setShowModal(false)
        loadListas()
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao salvar')
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta lista?')) return

    setDeleting(id)
    try {
      const res = await fetch(`/api/banco/listas/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        loadListas()
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao excluir')
      }
    } catch (error) {
      console.error('Erro ao excluir:', error)
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <AppShell headerTitle="Minhas Listas">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    )
  }

  if (requiresPremium) {
    return (
      <AppShell headerTitle="Minhas Listas">
        <div className="container max-w-2xl py-12">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Lock className="h-8 w-8 text-amber-600" />
              </div>
              <CardTitle className="text-2xl">Acesso Premium</CardTitle>
              <CardDescription className="text-base">
                As listas personalizadas são exclusivas para assinantes Premium
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => router.push('/buy')}
                className="w-full bg-gradient-to-r from-[#468152] to-[#E2A43E] hover:from-[#468152]/90 hover:to-[#E2A43E]/90"
                size="lg"
              >
                Assinar Premium
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell headerTitle="Minhas Listas" headerSubtitle="Organize suas questões favoritas">
      <div className="container max-w-5xl mx-auto py-6 space-y-6 px-4">
        {/* Header com botão de criar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Minhas Listas</h2>
            <p className="text-muted-foreground">
              {listas.length} lista(s) criada(s)
            </p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Lista
          </Button>
        </div>

        {/* Lista de listas */}
        {listas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <List className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhuma lista criada</h3>
              <p className="text-muted-foreground mb-4">
                Crie listas para organizar suas questões favoritas
              </p>
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira lista
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {listas.map((lista) => (
              <Card
                key={String(lista._id)}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => router.push(`/banco-questoes/listas/${lista._id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{lista.nome}</CardTitle>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditModal(lista)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDelete(String(lista._id))}
                        disabled={deleting === String(lista._id)}
                      >
                        {deleting === String(lista._id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{lista.totalQuestoes || lista.questaoIds?.length || 0} questões</span>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de criar/editar */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {modalMode === 'create' ? 'Nova Lista' : 'Editar Lista'}
              </DialogTitle>
              <DialogDescription>
                {modalMode === 'create'
                  ? 'Crie uma nova lista para organizar suas questões'
                  : 'Atualize o nome da lista'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome da lista</Label>
                <Input
                  value={nomeLista}
                  onChange={(e) => setNomeLista(e.target.value)}
                  placeholder="Ex: Revisão de Cardiologia"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving || !nomeLista.trim()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  )
}
