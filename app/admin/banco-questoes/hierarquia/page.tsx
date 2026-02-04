'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/theme-toggle'
import { LogoLoading } from '@/components/logo-loading'
import { BanChecker } from '@/components/ban-checker'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FolderTree,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ArrowRight
} from 'lucide-react'
import {
  BancoPeriodoComContagem,
  BancoModuloComContagem,
  BancoTopicoComContagem,
  BancoSubtopicoComContagem
} from '@/lib/types/banco-questoes'

export default function AdminHierarquiaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('periodos')

  // Dados
  const [periodos, setPeriodos] = useState<BancoPeriodoComContagem[]>([])
  const [modulos, setModulos] = useState<BancoModuloComContagem[]>([])
  const [topicos, setTopicos] = useState<BancoTopicoComContagem[]>([])
  const [subtopicos, setSubtopicos] = useState<BancoSubtopicoComContagem[]>([])

  // Filtros
  const [periodoSelecionado, setPeriodoSelecionado] = useState<string>('')
  const [moduloSelecionado, setModuloSelecionado] = useState<string>('')
  const [topicoSelecionado, setTopicoSelecionado] = useState<string>('')

  // Modais
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [modalType, setModalType] = useState<'periodo' | 'modulo' | 'topico' | 'subtopico'>('periodo')
  const [editingItem, setEditingItem] = useState<any>(null)
  const [formData, setFormData] = useState({ nome: '', codigo: '', ordem: 0 })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Modal para mover questões
  const [showMoverModal, setShowMoverModal] = useState(false)
  const [topicoParaMover, setTopicoParaMover] = useState<any>(null)
  const [topicoDestino, setTopicoDestino] = useState('')
  const [movendo, setMovendo] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (activeTab === 'periodos') {
      loadPeriodos()
    } else if (activeTab === 'modulos') {
      loadPeriodos()
      if (periodoSelecionado) {
        loadModulos(periodoSelecionado)
      }
    } else if (activeTab === 'topicos') {
      loadPeriodos()
      if (periodoSelecionado) {
        loadModulos(periodoSelecionado)
        if (moduloSelecionado) {
          loadTopicos(moduloSelecionado)
        }
      }
    } else if (activeTab === 'subtopicos') {
      loadPeriodos()
      if (periodoSelecionado) {
        loadModulos(periodoSelecionado)
        if (moduloSelecionado) {
          loadTopicos(moduloSelecionado)
          if (topicoSelecionado) {
            loadSubtopicos(topicoSelecionado)
          }
        }
      }
    }
  }, [activeTab, periodoSelecionado, moduloSelecionado, topicoSelecionado])

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
    } catch (error) {
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  async function loadPeriodos() {
    try {
      const res = await fetch('/api/admin/banco/periodos')
      if (res.ok) {
        const data = await res.json()
        setPeriodos(data.periodos)
      }
    } catch (error) {
      console.error('Erro ao carregar períodos:', error)
    }
  }

  async function loadModulos(periodoId: string) {
    try {
      const res = await fetch(`/api/admin/banco/modulos?periodoId=${periodoId}`)
      if (res.ok) {
        const data = await res.json()
        setModulos(data.modulos)
      }
    } catch (error) {
      console.error('Erro ao carregar módulos:', error)
    }
  }

  async function loadTopicos(moduloId: string) {
    try {
      const res = await fetch(`/api/admin/banco/topicos?moduloId=${moduloId}`)
      if (res.ok) {
        const data = await res.json()
        setTopicos(data.topicos)
      }
    } catch (error) {
      console.error('Erro ao carregar tópicos:', error)
    }
  }

  async function loadSubtopicos(topicoId: string) {
    try {
      const res = await fetch(`/api/admin/banco/subtopicos?topicoId=${topicoId}`)
      if (res.ok) {
        const data = await res.json()
        setSubtopicos(data.subtopicos)
      }
    } catch (error) {
      console.error('Erro ao carregar subtópicos:', error)
    }
  }

  function openCreateModal(type: typeof modalType) {
    setModalType(type)
    setModalMode('create')
    setEditingItem(null)
    setFormData({ nome: '', codigo: '', ordem: 0 })
    setShowModal(true)
  }

  function openEditModal(type: typeof modalType, item: any) {
    setModalType(type)
    setModalMode('edit')
    setEditingItem(item)
    setFormData({
      nome: item.nome,
      codigo: item.codigo || '',
      ordem: item.ordem || 0
    })
    setShowModal(true)
  }

  function openMoverModal(topico: any) {
    setTopicoParaMover(topico)
    setTopicoDestino('')
    setShowMoverModal(true)
  }

  async function handleMoverQuestoes() {
    if (!topicoParaMover || !topicoDestino || topicoDestino === String(topicoParaMover._id)) {
      return
    }

    setMovendo(true)
    try {
      const res = await fetch('/api/admin/banco/questoes/mover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicoOrigem: String(topicoParaMover._id),
          topicoDestino
        })
      })

      if (res.ok) {
        const data = await res.json()
        alert(`Sucesso! ${data.totalMovidas} questão(ões) movida(s).`)
        setShowMoverModal(false)
        loadTopicos(moduloSelecionado)
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao mover questões')
      }
    } catch (error) {
      console.error('Erro ao mover questões:', error)
      alert('Erro ao mover questões')
    } finally {
      setMovendo(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const endpoints: Record<typeof modalType, string> = {
        periodo: '/api/admin/banco/periodos',
        modulo: '/api/admin/banco/modulos',
        topico: '/api/admin/banco/topicos',
        subtopico: '/api/admin/banco/subtopicos'
      }

      const body: any = {
        nome: formData.nome,
        codigo: formData.codigo || undefined,
        ordem: formData.ordem
      }

      if (modalType === 'modulo') body.periodoId = periodoSelecionado
      if (modalType === 'topico') body.moduloId = moduloSelecionado
      if (modalType === 'subtopico') body.topicoId = topicoSelecionado

      const url = modalMode === 'edit'
        ? `${endpoints[modalType]}/${editingItem._id}`
        : endpoints[modalType]

      const res = await fetch(url, {
        method: modalMode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        setShowModal(false)
        // Recarregar dados
        if (modalType === 'periodo') loadPeriodos()
        else if (modalType === 'modulo' && periodoSelecionado) loadModulos(periodoSelecionado)
        else if (modalType === 'topico' && moduloSelecionado) loadTopicos(moduloSelecionado)
        else if (modalType === 'subtopico' && topicoSelecionado) loadSubtopicos(topicoSelecionado)
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

  async function handleDelete(type: typeof modalType, id: string, cascata = false) {
    if (!cascata && !confirm('Tem certeza que deseja excluir? Esta ação não pode ser desfeita.')) {
      return
    }

    setDeleting(id)
    try {
      const endpoints: Record<typeof modalType, string> = {
        periodo: '/api/admin/banco/periodos',
        modulo: '/api/admin/banco/modulos',
        topico: '/api/admin/banco/topicos',
        subtopico: '/api/admin/banco/subtopicos'
      }

      const url = cascata ? `${endpoints[type]}/${id}?cascata=true` : `${endpoints[type]}/${id}`
      const res = await fetch(url, {
        method: 'DELETE'
      })

      if (res.ok) {
        if (type === 'periodo') loadPeriodos()
        else if (type === 'modulo' && periodoSelecionado) loadModulos(periodoSelecionado)
        else if (type === 'topico' && moduloSelecionado) loadTopicos(moduloSelecionado)
        else if (type === 'subtopico' && topicoSelecionado) loadSubtopicos(topicoSelecionado)
      } else {
        const data = await res.json()

        // Se há itens vinculados, perguntar se quer deletar em cascata
        if (data.detalhes) {
          const totalVinculados = (data.detalhes.questoes || 0) +
            (data.detalhes.modulos || 0) +
            (data.detalhes.topicos || 0) +
            (data.detalhes.subtopicos || 0)

          if (totalVinculados > 0) {
            const confirmarCascata = confirm(
              `${data.mensagem}\n\nDeseja excluir e TODOS os itens vinculados?`
            )
            if (confirmarCascata) {
              // Tentar novamente com cascata
              await handleDelete(type, id, true)
            }
            return
          }
        }

        alert(data.error || 'Erro ao excluir')
      }
    } catch (error) {
      console.error('Erro ao excluir:', error)
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return <LogoLoading message="Carregando..." size="lg" fullscreen />
  }

  const modalTitles = {
    periodo: 'Período',
    modulo: 'Módulo',
    topico: 'Tópico',
    subtopico: 'Subtópico'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <BanChecker />

      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/admin/banco-questoes')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <FolderTree className="h-5 w-5 text-primary" />
                  Gerenciar Hierarquia
                </h1>
                <p className="text-sm text-muted-foreground">
                  Períodos, módulos, tópicos e subtópicos
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="periodos">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="periodos">Períodos</TabsTrigger>
            <TabsTrigger value="modulos">Módulos</TabsTrigger>
            <TabsTrigger value="topicos">Tópicos</TabsTrigger>
            <TabsTrigger value="subtopicos">Subtópicos</TabsTrigger>
          </TabsList>

          {/* Períodos */}
          <TabsContent value="periodos">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Períodos</CardTitle>
                  <CardDescription>Gerencie os períodos do curso</CardDescription>
                </div>
                <Button onClick={() => openCreateModal('periodo')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Período
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Módulos</TableHead>
                      <TableHead>Questões</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {periodos.map((periodo) => (
                      <TableRow key={String(periodo._id)}>
                        <TableCell className="font-medium">{periodo.nome}</TableCell>
                        <TableCell>{periodo.codigo}</TableCell>
                        <TableCell>{periodo.totalModulos}</TableCell>
                        <TableCell>{periodo.totalQuestoes}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal('periodo', periodo)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete('periodo', String(periodo._id))}
                            disabled={deleting === String(periodo._id)}
                          >
                            {deleting === String(periodo._id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-red-500" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {periodos.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Nenhum período cadastrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Módulos */}
          <TabsContent value="modulos">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Módulos</CardTitle>
                    <CardDescription>Gerencie os módulos de cada período</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Selecione um período" />
                      </SelectTrigger>
                      <SelectContent>
                        {periodos.map((p) => (
                          <SelectItem key={String(p._id)} value={String(p._id)}>
                            {p.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={() => openCreateModal('modulo')} disabled={!periodoSelecionado}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Módulo
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!periodoSelecionado ? (
                  <p className="text-center text-muted-foreground py-8">
                    Selecione um período para ver os módulos
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Tópicos</TableHead>
                        <TableHead>Questões</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modulos.map((modulo) => (
                        <TableRow key={String(modulo._id)}>
                          <TableCell className="font-medium">{modulo.nome}</TableCell>
                          <TableCell>{modulo.codigo}</TableCell>
                          <TableCell>{modulo.totalTopicos}</TableCell>
                          <TableCell>{modulo.totalQuestoes}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditModal('modulo', modulo)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete('modulo', String(modulo._id))}
                              disabled={deleting === String(modulo._id)}
                            >
                              {deleting === String(modulo._id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-red-500" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {modulos.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            Nenhum módulo cadastrado neste período
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tópicos */}
          <TabsContent value="topicos">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Tópicos</CardTitle>
                    <CardDescription>Gerencie os tópicos de cada módulo</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={periodoSelecionado} onValueChange={(v) => { setPeriodoSelecionado(v); setModuloSelecionado('') }}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Período" />
                      </SelectTrigger>
                      <SelectContent>
                        {periodos.map((p) => (
                          <SelectItem key={String(p._id)} value={String(p._id)}>
                            {p.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={moduloSelecionado} onValueChange={setModuloSelecionado} disabled={!periodoSelecionado}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Módulo" />
                      </SelectTrigger>
                      <SelectContent>
                        {modulos.map((m) => (
                          <SelectItem key={String(m._id)} value={String(m._id)}>
                            {m.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={() => openCreateModal('topico')} disabled={!moduloSelecionado}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Tópico
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!moduloSelecionado ? (
                  <p className="text-center text-muted-foreground py-8">
                    Selecione um período e módulo para ver os tópicos
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Subtópicos</TableHead>
                        <TableHead>Questões</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topicos.map((topico) => (
                        <TableRow key={String(topico._id)}>
                          <TableCell className="font-medium">{topico.nome}</TableCell>
                          <TableCell>{topico.codigo}</TableCell>
                          <TableCell>{topico.totalSubtopicos}</TableCell>
                          <TableCell>{topico.totalQuestoes}</TableCell>
                           <TableCell className="text-right space-x-2">
                             {topico.totalQuestoes > 0 && (
                               <Button
                                 variant="ghost"
                                 size="icon"
                                 onClick={() => openMoverModal(topico)}
                                 title="Mover todas as questões para outro tópico"
                               >
                                 <ArrowRight className="h-4 w-4" />
                               </Button>
                             )}
                             <Button
                               variant="ghost"
                               size="icon"
                               onClick={() => openEditModal('topico', topico)}
                             >
                               <Pencil className="h-4 w-4" />
                             </Button>
                             <Button
                               variant="ghost"
                               size="icon"
                               onClick={() => handleDelete('topico', String(topico._id))}
                               disabled={deleting === String(topico._id)}
                             >
                               {deleting === String(topico._id) ? (
                                 <Loader2 className="h-4 w-4 animate-spin" />
                               ) : (
                                 <Trash2 className="h-4 w-4 text-red-500" />
                               )}
                             </Button>
                           </TableCell>
                        </TableRow>
                      ))}
                      {topicos.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            Nenhum tópico cadastrado neste módulo
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subtópicos */}
          <TabsContent value="subtopicos">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Subtópicos</CardTitle>
                    <CardDescription>Gerencie os subtópicos de cada tópico</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={periodoSelecionado} onValueChange={(v) => { setPeriodoSelecionado(v); setModuloSelecionado(''); setTopicoSelecionado('') }}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Período" />
                      </SelectTrigger>
                      <SelectContent>
                        {periodos.map((p) => (
                          <SelectItem key={String(p._id)} value={String(p._id)}>
                            {p.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={moduloSelecionado} onValueChange={(v) => { setModuloSelecionado(v); setTopicoSelecionado('') }} disabled={!periodoSelecionado}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Módulo" />
                      </SelectTrigger>
                      <SelectContent>
                        {modulos.map((m) => (
                          <SelectItem key={String(m._id)} value={String(m._id)}>
                            {m.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={topicoSelecionado} onValueChange={setTopicoSelecionado} disabled={!moduloSelecionado}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Tópico" />
                      </SelectTrigger>
                      <SelectContent>
                        {topicos.map((t) => (
                          <SelectItem key={String(t._id)} value={String(t._id)}>
                            {t.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={() => openCreateModal('subtopico')} disabled={!topicoSelecionado}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Subtópico
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!topicoSelecionado ? (
                  <p className="text-center text-muted-foreground py-8">
                    Selecione um período, módulo e tópico para ver os subtópicos
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Questões</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subtopicos.map((subtopico) => (
                        <TableRow key={String(subtopico._id)}>
                          <TableCell className="font-medium">{subtopico.nome}</TableCell>
                          <TableCell>{subtopico.codigo}</TableCell>
                          <TableCell>{subtopico.totalQuestoes}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditModal('subtopico', subtopico)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete('subtopico', String(subtopico._id))}
                              disabled={deleting === String(subtopico._id)}
                            >
                              {deleting === String(subtopico._id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-red-500" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {subtopicos.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            Nenhum subtópico cadastrado neste tópico
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de criar/editar */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {modalMode === 'create' ? 'Novo' : 'Editar'} {modalTitles[modalType]}
              </DialogTitle>
              <DialogDescription>
                {modalMode === 'create' ? 'Preencha os dados para criar' : 'Atualize os dados'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder={`Nome do ${modalTitles[modalType].toLowerCase()}`}
                />
              </div>

              <div className="space-y-2">
                <Label>Código (opcional)</Label>
                <Input
                  value={formData.codigo}
                  onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
                  placeholder="Código único (gerado automaticamente se vazio)"
                />
              </div>

              <div className="space-y-2">
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={formData.ordem}
                  onChange={(e) => setFormData(prev => ({ ...prev, ordem: parseInt(e.target.value) || 0 }))}
                  placeholder="Ordem de exibição"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving || !formData.nome.trim()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de mover questões */}
        <Dialog open={showMoverModal} onOpenChange={setShowMoverModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mover Questões</DialogTitle>
              <DialogDescription>
                Mover {topicoParaMover?.totalQuestoes || 0} questão(ões) do tópico <strong>{topicoParaMover?.nome}</strong> para outro tópico
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tópico de destino *</Label>
                <Select
                  value={topicoDestino}
                  onValueChange={setTopicoDestino}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tópico de destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {topicos.filter(t => String(t._id) !== String(topicoParaMover?._id)).map((t) => (
                      <SelectItem key={String(t._id)} value={String(t._id)}>
                        {t.nome} ({t.totalQuestoes} questões)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMoverModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleMoverQuestoes} disabled={movendo || !topicoDestino}>
                {movendo ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                Mover
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
