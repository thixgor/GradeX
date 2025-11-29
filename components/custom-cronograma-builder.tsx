'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TopicItem, SubtopicItem, ModuleItem } from '@/lib/cronograma-types'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

interface CustomCronogramaBuilderProps {
  topicos: TopicItem[]
  onTopicosChange: (topicos: TopicItem[]) => void
}

export function CustomCronogramaBuilder({
  topicos,
  onTopicosChange
}: CustomCronogramaBuilderProps) {
  const [expandedTopico, setExpandedTopico] = useState<string | null>(null)
  const [expandedSubtopico, setExpandedSubtopico] = useState<string | null>(null)
  const [novoTopicoNome, setNovoTopicoNome] = useState('')
  const [novoSubtopicoNome, setNovoSubtopicoNome] = useState('')
  const [novoModuloNome, setNovoModuloNome] = useState('')
  const [novoModuloHoras, setNovoModuloHoras] = useState('5')

  // Adicionar novo tópico
  function adicionarTopico() {
    if (!novoTopicoNome.trim()) return

    const novoTopico: TopicItem = {
      id: `topico-${Date.now()}`,
      nome: novoTopicoNome,
      incluido: false,
      subtopicos: []
    }

    onTopicosChange([...topicos, novoTopico])
    setNovoTopicoNome('')
  }

  // Deletar tópico
  function deletarTopico(topicoId: string) {
    onTopicosChange(topicos.filter(t => t.id !== topicoId))
  }

  // Adicionar subtópico
  function adicionarSubtopico(topicoId: string) {
    if (!novoSubtopicoNome.trim()) return

    const novoSubtopico: SubtopicItem = {
      id: `subtopico-${Date.now()}`,
      nome: novoSubtopicoNome,
      incluido: false,
      modulos: []
    }

    const topicosAtualizados = topicos.map(t =>
      t.id === topicoId
        ? { ...t, subtopicos: [...t.subtopicos, novoSubtopico] }
        : t
    )

    onTopicosChange(topicosAtualizados)
    setNovoSubtopicoNome('')
  }

  // Deletar subtópico
  function deletarSubtopico(topicoId: string, subtopicId: string) {
    const topicosAtualizados = topicos.map(t =>
      t.id === topicoId
        ? { ...t, subtopicos: t.subtopicos.filter(s => s.id !== subtopicId) }
        : t
    )
    onTopicosChange(topicosAtualizados)
  }

  // Adicionar módulo
  function adicionarModulo(topicoId: string, subtopicId: string) {
    if (!novoModuloNome.trim()) return

    const novoModulo: ModuleItem = {
      id: `modulo-${Date.now()}`,
      nome: novoModuloNome,
      horasEstimadas: parseInt(novoModuloHoras) || 5,
      incluido: false
    }

    const topicosAtualizados = topicos.map(t =>
      t.id === topicoId
        ? {
            ...t,
            subtopicos: t.subtopicos.map(s =>
              s.id === subtopicId
                ? { ...s, modulos: [...s.modulos, novoModulo] }
                : s
            )
          }
        : t
    )

    onTopicosChange(topicosAtualizados)
    setNovoModuloNome('')
    setNovoModuloHoras('5')
  }

  // Deletar módulo
  function deletarModulo(topicoId: string, subtopicId: string, moduloId: string) {
    const topicosAtualizados = topicos.map(t =>
      t.id === topicoId
        ? {
            ...t,
            subtopicos: t.subtopicos.map(s =>
              s.id === subtopicId
                ? { ...s, modulos: s.modulos.filter(m => m.id !== moduloId) }
                : s
            )
          }
        : t
    )
    onTopicosChange(topicosAtualizados)
  }

  // Toggle tópico
  function toggleTopico(topicoId: string) {
    const topicosAtualizados = topicos.map(t =>
      t.id === topicoId
        ? {
            ...t,
            incluido: !t.incluido,
            subtopicos: t.subtopicos.map(s => ({
              ...s,
              incluido: !t.incluido,
              modulos: s.modulos.map(m => ({ ...m, incluido: !t.incluido }))
            }))
          }
        : t
    )
    onTopicosChange(topicosAtualizados)
  }

  // Toggle subtópico
  function toggleSubtopico(topicoId: string, subtopicId: string) {
    const topicosAtualizados = topicos.map(t =>
      t.id === topicoId
        ? {
            ...t,
            subtopicos: t.subtopicos.map(s =>
              s.id === subtopicId
                ? {
                    ...s,
                    incluido: !s.incluido,
                    modulos: s.modulos.map(m => ({ ...m, incluido: !s.incluido }))
                  }
                : s
            )
          }
        : t
    )
    onTopicosChange(topicosAtualizados)
  }

  // Toggle módulo
  function toggleModulo(topicoId: string, subtopicId: string, moduloId: string) {
    const topicosAtualizados = topicos.map(t =>
      t.id === topicoId
        ? {
            ...t,
            subtopicos: t.subtopicos.map(s =>
              s.id === subtopicId
                ? {
                    ...s,
                    modulos: s.modulos.map(m =>
                      m.id === moduloId ? { ...m, incluido: !m.incluido } : m
                    )
                  }
                : s
            )
          }
        : t
    )
    onTopicosChange(topicosAtualizados)
  }

  return (
    <div className="space-y-6">
      {/* Adicionar novo tópico */}
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Tópico</CardTitle>
          <CardDescription>
            Crie um novo tópico para seu cronograma personalizado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nome do tópico (ex: Matemática, História, etc)"
              value={novoTopicoNome}
              onChange={(e) => setNovoTopicoNome(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && adicionarTopico()}
            />
            <Button onClick={adicionarTopico}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de tópicos */}
      <div className="space-y-3">
        {topicos.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Nenhum tópico adicionado ainda. Comece criando um novo tópico acima.
            </CardContent>
          </Card>
        ) : (
          topicos.map((topico) => (
            <Card key={topico.id} className="overflow-hidden">
              <div className="p-4">
                {/* Header do Tópico */}
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    checked={topico.incluido}
                    onChange={() => toggleTopico(topico.id)}
                    className="w-5 h-5 rounded border-gray-300 cursor-pointer"
                  />
                  <button
                    onClick={() =>
                      setExpandedTopico(
                        expandedTopico === topico.id ? null : topico.id
                      )
                    }
                    className="flex-1 flex items-center gap-2 text-left hover:text-primary transition-colors"
                  >
                    {expandedTopico === topico.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    <span className="font-semibold">{topico.nome}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {topico.subtopicos.length} subtópicos
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deletarTopico(topico.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                {/* Conteúdo expandido */}
                {expandedTopico === topico.id && (
                  <div className="space-y-4 pl-8 border-l-2 border-muted">
                    {/* Adicionar subtópico */}
                    <div className="space-y-2">
                      <Label className="text-sm">Novo Subtópico</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nome do subtópico"
                          value={novoSubtopicoNome}
                          onChange={(e) => setNovoSubtopicoNome(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === 'Enter' && adicionarSubtopico(topico.id)
                          }
                          size={32}
                        />
                        <Button
                          size="sm"
                          onClick={() => adicionarSubtopico(topico.id)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Lista de subtópicos */}
                    <div className="space-y-3">
                      {topico.subtopicos.map((subtopico) => (
                        <Card key={subtopico.id} className="bg-muted/50">
                          <div className="p-3">
                            {/* Header do Subtópico */}
                            <div className="flex items-center gap-2 mb-3">
                              <input
                                type="checkbox"
                                checked={subtopico.incluido}
                                onChange={() =>
                                  toggleSubtopico(topico.id, subtopico.id)
                                }
                                className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                              />
                              <button
                                onClick={() =>
                                  setExpandedSubtopico(
                                    expandedSubtopico === subtopico.id
                                      ? null
                                      : subtopico.id
                                  )
                                }
                                className="flex-1 flex items-center gap-2 text-left text-sm hover:text-primary transition-colors"
                              >
                                {expandedSubtopico === subtopico.id ? (
                                  <ChevronUp className="h-3 w-3" />
                                ) : (
                                  <ChevronDown className="h-3 w-3" />
                                )}
                                <span className="font-medium">{subtopico.nome}</span>
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {subtopico.modulos.length} módulos
                                </span>
                              </button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  deletarSubtopico(topico.id, subtopico.id)
                                }
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>

                            {/* Conteúdo do subtópico expandido */}
                            {expandedSubtopico === subtopico.id && (
                              <div className="space-y-3 pl-6 border-l-2 border-muted">
                                {/* Adicionar módulo */}
                                <div className="space-y-2">
                                  <Label className="text-xs">Novo Módulo</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      placeholder="Nome do módulo"
                                      value={novoModuloNome}
                                      onChange={(e) =>
                                        setNovoModuloNome(e.target.value)
                                      }
                                      onKeyPress={(e) =>
                                        e.key === 'Enter' &&
                                        adicionarModulo(topico.id, subtopico.id)
                                      }
                                      size={32}
                                    />
                                    <Input
                                      type="number"
                                      placeholder="Horas"
                                      value={novoModuloHoras}
                                      onChange={(e) =>
                                        setNovoModuloHoras(e.target.value)
                                      }
                                      min="1"
                                      max="100"
                                      className="w-20"
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        adicionarModulo(topico.id, subtopico.id)
                                      }
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Lista de módulos */}
                                <div className="space-y-2">
                                  {subtopico.modulos.map((modulo) => (
                                    <div
                                      key={modulo.id}
                                      className="flex items-center gap-2 p-2 bg-background rounded border border-muted text-sm"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={modulo.incluido}
                                        onChange={() =>
                                          toggleModulo(
                                            topico.id,
                                            subtopico.id,
                                            modulo.id
                                          )
                                        }
                                        className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                                      />
                                      <span className="flex-1">{modulo.nome}</span>
                                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                        {modulo.horasEstimadas}h
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          deletarModulo(
                                            topico.id,
                                            subtopico.id,
                                            modulo.id
                                          )
                                        }
                                      >
                                        <Trash2 className="h-3 w-3 text-destructive" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Resumo */}
      {topicos.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">
                  {topicos.length}
                </p>
                <p className="text-sm text-muted-foreground">Tópicos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">
                  {topicos.reduce((sum, t) => sum + t.subtopicos.length, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Subtópicos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">
                  {topicos.reduce(
                    (sum, t) =>
                      sum +
                      t.subtopicos.reduce((s, st) => s + st.modulos.length, 0),
                    0
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Módulos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
