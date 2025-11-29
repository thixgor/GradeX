'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Trash2, Edit, Plus, X } from 'lucide-react'
import { CustomContext } from '@/lib/types'

interface CustomContextsManagerProps {
  isOpen: boolean
  onClose: () => void
  onContextsUpdated: () => void
}

export function CustomContextsManager({
  isOpen,
  onClose,
  onContextsUpdated,
}: CustomContextsManagerProps) {
  const [contexts, setContexts] = useState<CustomContext[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })

  useEffect(() => {
    if (isOpen) {
      fetchContexts()
    }
  }, [isOpen])

  async function fetchContexts() {
    try {
      const res = await fetch('/api/contexts')
      const data = await res.json()
      if (data.success) {
        setContexts(data.contexts)
      }
    } catch (error) {
      console.error('Erro ao carregar contextos:', error)
    }
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      alert('Nome do contexto é obrigatório')
      return
    }

    setLoading(true)
    try {
      const url = editingId ? '/api/contexts' : '/api/contexts'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...formData } : formData),
      })

      const data = await res.json()

      if (data.success) {
        setFormData({ name: '', description: '' })
        setEditingId(null)
        await fetchContexts()
        onContextsUpdated()
      } else {
        alert(data.error || 'Erro ao salvar contexto')
      }
    } catch (error) {
      console.error('Erro ao salvar contexto:', error)
      alert('Erro ao salvar contexto')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir este contexto?')) return

    setLoading(true)
    try {
      const res = await fetch(`/api/contexts?id=${id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (data.success) {
        await fetchContexts()
        onContextsUpdated()
      } else {
        alert(data.error || 'Erro ao excluir contexto')
      }
    } catch (error) {
      console.error('Erro ao excluir contexto:', error)
      alert('Erro ao excluir contexto')
    } finally {
      setLoading(false)
    }
  }

  function handleEdit(context: CustomContext) {
    setEditingId(context.id)
    setFormData({ name: context.name, description: context.description || '' })
  }

  function handleCancel() {
    setEditingId(null)
    setFormData({ name: '', description: '' })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>Gerenciar Contextos Personalizados</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <CardDescription>
            Adicione, edite ou exclua contextos personalizados para geração de questões
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formulário de Adicionar/Editar */}
          <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
            <h3 className="font-semibold text-sm">
              {editingId ? '✏️ Editar Contexto' : '➕ Adicionar Novo Contexto'}
            </h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="contextName">Nome do Contexto *</Label>
                <Input
                  id="contextName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Medicina (UNIFESP), Direito (OAB), Concurso..."
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contextDescription">Descrição (opcional)</Label>
                <Textarea
                  id="contextDescription"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Questões de medicina para residência UNIFESP..."
                  rows={2}
                  disabled={loading}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={loading || !formData.name.trim()}>
                  {loading ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Adicionar Contexto'}
                </Button>
                {editingId && (
                  <Button variant="outline" onClick={handleCancel} disabled={loading}>
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Lista de Contextos */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">📚 Contextos Salvos</h3>

            {/* Contextos Padrão (não editáveis) */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-semibold">Padrões (não editáveis)</p>
              <div className="space-y-2">
                <div className="border rounded-lg p-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">🎓 ENEM - Exame Nacional do Ensino Médio</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Questões interdisciplinares e interpretativas
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">Fixo</div>
                  </div>
                </div>
                <div className="border rounded-lg p-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">🏛️ UERJ - Universidade do Estado do Rio de Janeiro</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Questões analíticas e críticas
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">Fixo</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contextos Personalizados */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-semibold">Personalizados</p>
              {contexts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Nenhum contexto personalizado ainda</p>
                  <p className="text-xs mt-1">Use o formulário acima para adicionar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {contexts.map((context) => (
                    <div key={context.id} className="border rounded-lg p-3 bg-background">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">✨ {context.name}</p>
                          {context.description && (
                            <p className="text-xs text-muted-foreground mt-1">{context.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Criado em {new Date(context.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(context)}
                            disabled={loading}
                            title="Editar"
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(context.id)}
                            disabled={loading}
                            title="Excluir"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
