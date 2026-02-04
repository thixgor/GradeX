'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { LogoLoading } from '@/components/logo-loading'
import { BanChecker } from '@/components/ban-checker'
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
  FileText,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  Eye,
  Image as ImageIcon,
  X,
  Download,
  AlertTriangle,
  Copy,
  CheckCircle2
} from 'lucide-react'
import {
  BancoPeriodoComContagem,
  BancoModuloComContagem,
  BancoTopicoComContagem,
  BancoSubtopicoComContagem,
  BancoQuestaoComHierarquia,
  BancoQuestaoFormData,
  BancoAlternativaLetra,
  BancoPaginacao
} from '@/lib/types/banco-questoes'

export default function AdminQuestoesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  // Dados de hierarquia para filtros e formulário
  const [periodos, setPeriodos] = useState<BancoPeriodoComContagem[]>([])
  const [modulos, setModulos] = useState<BancoModuloComContagem[]>([])
  const [topicos, setTopicos] = useState<BancoTopicoComContagem[]>([])
  const [subtopicos, setSubtopicos] = useState<BancoSubtopicoComContagem[]>([])

  // Filtros
  const [filtros, setFiltros] = useState({
    periodoId: '',
    moduloId: '',
    tipo: '',
    busca: ''
  })

  // Questões
  const [questoes, setQuestoes] = useState<BancoQuestaoComHierarquia[]>([])
  const [paginacao, setPaginacao] = useState<BancoPaginacao | null>(null)
  const [loadingQuestoes, setLoadingQuestoes] = useState(false)

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [editingQuestao, setEditingQuestao] = useState<BancoQuestaoComHierarquia | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Exportação
  const [exporting, setExporting] = useState(false)

  // Modal de questões duplicadas
  const [showDuplicatasModal, setShowDuplicatasModal] = useState(false)
  const [loadingDuplicatas, setLoadingDuplicatas] = useState(false)
  const [duplicatas, setDuplicatas] = useState<any[]>([])
  const [deletingDuplicata, setDeletingDuplicata] = useState<string | null>(null)

  // Form data
  const [formData, setFormData] = useState<BancoQuestaoFormData>({
    tipo: 'objetiva',
    periodoId: '',
    moduloId: '',
    topicoId: '',
    subtopicoId: '',
    enunciado: '',
    explicacao: '',
    imagemUrl: '',
    alternativas: [
      { letra: 'A', texto: '', correta: false },
      { letra: 'B', texto: '', correta: false },
      { letra: 'C', texto: '', correta: false },
      { letra: 'D', texto: '', correta: false },
    ],
    respostaModelo: '',
    dificuldade: undefined,
    tags: [],
    fonte: '',
    ano: undefined
  })

  // Form hierarchy
  const [formModulos, setFormModulos] = useState<BancoModuloComContagem[]>([])
  const [formTopicos, setFormTopicos] = useState<BancoTopicoComContagem[]>([])
  const [formSubtopicos, setFormSubtopicos] = useState<BancoSubtopicoComContagem[]>([])

  // Criar novo tópico/subtópico inline
  const [showNewTopico, setShowNewTopico] = useState(false)
  const [showNewSubtopico, setShowNewSubtopico] = useState(false)
  const [newTopicoNome, setNewTopicoNome] = useState('')
  const [newSubtopicoNome, setNewSubtopicoNome] = useState('')
  const [creatingTopico, setCreatingTopico] = useState(false)
  const [creatingSubtopico, setCreatingSubtopico] = useState(false)

  useEffect(() => {
    checkAuth()
    loadPeriodos()
  }, [])

  useEffect(() => {
    loadQuestoes()
  }, [filtros.periodoId, filtros.moduloId, filtros.tipo])

  useEffect(() => {
    if (filtros.periodoId) {
      loadModulos(filtros.periodoId)
    } else {
      setModulos([])
    }
  }, [filtros.periodoId])

  // Form hierarchy loading
  useEffect(() => {
    if (formData.periodoId) {
      loadFormModulos(formData.periodoId)
    } else {
      setFormModulos([])
      setFormTopicos([])
      setFormSubtopicos([])
    }
  }, [formData.periodoId])

  useEffect(() => {
    if (formData.moduloId) {
      loadFormTopicos(formData.moduloId)
    } else {
      setFormTopicos([])
      setFormSubtopicos([])
    }
  }, [formData.moduloId])

  useEffect(() => {
    if (formData.topicoId) {
      loadFormSubtopicos(formData.topicoId)
    } else {
      setFormSubtopicos([])
    }
  }, [formData.topicoId])

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

  async function loadFormModulos(periodoId: string) {
    try {
      const res = await fetch(`/api/admin/banco/modulos?periodoId=${periodoId}`)
      if (res.ok) {
        const data = await res.json()
        setFormModulos(data.modulos)
      }
    } catch (error) {
      console.error('Erro ao carregar módulos:', error)
    }
  }

  async function loadFormTopicos(moduloId: string) {
    try {
      const res = await fetch(`/api/admin/banco/topicos?moduloId=${moduloId}`)
      if (res.ok) {
        const data = await res.json()
        setFormTopicos(data.topicos)
      }
    } catch (error) {
      console.error('Erro ao carregar tópicos:', error)
    }
  }

  async function loadFormSubtopicos(topicoId: string) {
    try {
      const res = await fetch(`/api/admin/banco/subtopicos?topicoId=${topicoId}`)
      if (res.ok) {
        const data = await res.json()
        setFormSubtopicos(data.subtopicos)
      }
    } catch (error) {
      console.error('Erro ao carregar subtópicos:', error)
    }
  }

  async function loadQuestoes(page = 1) {
    setLoadingQuestoes(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '20')
      if (filtros.periodoId) params.set('periodoId', filtros.periodoId)
      if (filtros.moduloId) params.set('moduloId', filtros.moduloId)
      if (filtros.tipo) params.set('tipo', filtros.tipo)
      if (filtros.busca) params.set('busca', filtros.busca)

      const res = await fetch(`/api/admin/banco/questoes?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setQuestoes(data.questoes)
        setPaginacao(data.paginacao)
      }
    } catch (error) {
      console.error('Erro ao carregar questões:', error)
    } finally {
      setLoadingQuestoes(false)
    }
  }

  function openCreateModal() {
    setModalMode('create')
    setEditingQuestao(null)
    setFormData({
      tipo: 'objetiva',
      periodoId: '',
      moduloId: '',
      topicoId: '',
      subtopicoId: '',
      enunciado: '',
      explicacao: '',
      imagemUrl: '',
      alternativas: [
        { letra: 'A', texto: '', correta: false },
        { letra: 'B', texto: '', correta: false },
        { letra: 'C', texto: '', correta: false },
        { letra: 'D', texto: '', correta: false },
      ],
      respostaModelo: '',
      dificuldade: undefined,
      tags: [],
      fonte: '',
      ano: undefined
    })
    setShowModal(true)
  }

  async function openEditModal(questao: BancoQuestaoComHierarquia) {
    setModalMode('edit')
    setEditingQuestao(questao)

    // Carregar hierarquia necessária
    if (questao.periodoId) {
      await loadFormModulos(String(questao.periodoId))
    }
    if (questao.moduloId) {
      await loadFormTopicos(String(questao.moduloId))
    }
    if (questao.topicoId) {
      await loadFormSubtopicos(String(questao.topicoId))
    }

    setFormData({
      tipo: questao.tipo,
      periodoId: String(questao.periodoId),
      moduloId: String(questao.moduloId),
      topicoId: String(questao.topicoId),
      subtopicoId: questao.subtopicoid ? String(questao.subtopicoid) : '',
      enunciado: questao.enunciado,
      explicacao: questao.explicacao || '',
      imagemUrl: questao.imagemUrl || '',
      alternativas: questao.alternativas || [
        { letra: 'A', texto: '', correta: false },
        { letra: 'B', texto: '', correta: false },
        { letra: 'C', texto: '', correta: false },
        { letra: 'D', texto: '', correta: false },
      ],
      respostaModelo: questao.respostaModelo || '',
      dificuldade: questao.dificuldade,
      tags: questao.tags || [],
      fonte: questao.fonte || '',
      ano: questao.ano
    })
    setShowModal(true)
  }

  function openViewModal(questao: BancoQuestaoComHierarquia) {
    setModalMode('view')
    setEditingQuestao(questao)
    setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const url = modalMode === 'edit'
        ? `/api/admin/banco/questoes/${editingQuestao?._id}`
        : '/api/admin/banco/questoes'

      const res = await fetch(url, {
        method: modalMode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setShowModal(false)
        loadQuestoes()
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
    if (!confirm('Tem certeza que deseja excluir esta questão? Esta ação não pode ser desfeita.')) {
      return
    }

    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/banco/questoes/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        loadQuestoes()
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

  function updateAlternativa(index: number, field: 'texto' | 'correta', value: any) {
    setFormData(prev => {
      const newAlts = [...(prev.alternativas || [])]
      if (field === 'correta') {
        // Desmarcar todas e marcar apenas a selecionada
        newAlts.forEach((alt, i) => {
          alt.correta = i === index
        })
      } else {
        newAlts[index] = { ...newAlts[index], [field]: value }
      }
      return { ...prev, alternativas: newAlts }
    })
  }

  function addAlternativa() {
    if ((formData.alternativas?.length || 0) >= 5) return
    const letras: BancoAlternativaLetra[] = ['A', 'B', 'C', 'D', 'E']
    const nextLetra = letras[formData.alternativas?.length || 0]
    setFormData(prev => ({
      ...prev,
      alternativas: [...(prev.alternativas || []), { letra: nextLetra, texto: '', correta: false }]
    }))
  }

  function removeAlternativa(index: number) {
    if ((formData.alternativas?.length || 0) <= 2) return
    setFormData(prev => ({
      ...prev,
      alternativas: prev.alternativas?.filter((_, i) => i !== index)
    }))
  }

  async function handleExportar() {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (filtros.periodoId) params.set('periodoId', filtros.periodoId)
      if (filtros.moduloId) params.set('moduloId', filtros.moduloId)
      if (filtros.tipo) params.set('tipo', filtros.tipo)

      const res = await fetch(`/api/admin/banco/exportar?${params.toString()}`)
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Erro ao exportar')
        return
      }

      // Download do arquivo
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `banco_questoes_${new Date().toISOString().slice(0, 10)}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao exportar:', error)
      alert('Erro ao exportar questões')
    } finally {
      setExporting(false)
    }
  }

  async function handleCarregarDuplicatas() {
    setLoadingDuplicatas(true)
    try {
      const res = await fetch('/api/admin/banco/questoes/duplicatas')
      if (res.ok) {
        const data = await res.json()
        setDuplicatas(data.duplicatas)
        setShowDuplicatasModal(true)
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao buscar duplicatas')
      }
    } catch (error) {
      console.error('Erro ao buscar duplicatas:', error)
      alert('Erro ao buscar duplicatas')
    } finally {
      setLoadingDuplicatas(false)
    }
  }

  async function handleDeleteDuplicata(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta questão duplicada?')) {
      return
    }

    setDeletingDuplicata(id)
    try {
      const res = await fetch(`/api/admin/banco/questoes/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setDuplicatas(prev => prev.map(grupo => ({
          ...grupo,
          questoes: grupo.questoes.filter((q: any) => String(q._id) !== id),
          count: grupo.questoes.filter((q: any) => String(q._id) !== id).length
        })).filter(g => g.count > 1))
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao excluir')
      }
    } catch (error) {
      console.error('Erro ao excluir:', error)
      alert('Erro ao excluir')
    } finally {
      setDeletingDuplicata(null)
    }
  }

  async function handleCreateTopico() {
    if (!newTopicoNome.trim() || !formData.moduloId) return

    setCreatingTopico(true)
    try {
      const res = await fetch('/api/admin/banco/topicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduloId: formData.moduloId,
          nome: newTopicoNome.trim()
        })
      })

      if (res.ok) {
        const data = await res.json()
        // Recarregar tópicos e selecionar o novo
        await loadFormTopicos(formData.moduloId)
        setFormData(prev => ({ ...prev, topicoId: String(data.topico._id), subtopicoId: '' }))
        setNewTopicoNome('')
        setShowNewTopico(false)
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao criar tópico')
      }
    } catch (error) {
      console.error('Erro ao criar tópico:', error)
    } finally {
      setCreatingTopico(false)
    }
  }

  async function handleCreateSubtopico() {
    if (!newSubtopicoNome.trim() || !formData.topicoId) return

    setCreatingSubtopico(true)
    try {
      const res = await fetch('/api/admin/banco/subtopicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicoId: formData.topicoId,
          nome: newSubtopicoNome.trim()
        })
      })

      if (res.ok) {
        const data = await res.json()
        // Recarregar subtópicos e selecionar o novo
        await loadFormSubtopicos(formData.topicoId)
        setFormData(prev => ({ ...prev, subtopicoId: String(data.subtopico._id) }))
        setNewSubtopicoNome('')
        setShowNewSubtopico(false)
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao criar subtópico')
      }
    } catch (error) {
      console.error('Erro ao criar subtópico:', error)
    } finally {
      setCreatingSubtopico(false)
    }
  }

  if (loading) {
    return <LogoLoading message="Carregando..." size="lg" fullscreen />
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
                  <FileText className="h-5 w-5 text-primary" />
                  Gerenciar Questões
                </h1>
                <p className="text-sm text-muted-foreground">
                  Criar, editar e excluir questões
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleCarregarDuplicatas}
                disabled={loadingDuplicatas}
              >
                {loadingDuplicatas ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mr-2" />
                )}
                Scanear Duplicatas
              </Button>
              <Button
                variant="outline"
                onClick={handleExportar}
                disabled={exporting}
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Exportar TXT
              </Button>
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Questão
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-5">
              <div>
                <Label>Período</Label>
                <Select
                  value={filtros.periodoId}
                  onValueChange={(v) => setFiltros(prev => ({ ...prev, periodoId: v, moduloId: '' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {periodos.map((p) => (
                      <SelectItem key={String(p._id)} value={String(p._id)}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Módulo</Label>
                <Select
                  value={filtros.moduloId}
                  onValueChange={(v) => setFiltros(prev => ({ ...prev, moduloId: v }))}
                  disabled={!filtros.periodoId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {modulos.map((m) => (
                      <SelectItem key={String(m._id)} value={String(m._id)}>
                        {m.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tipo</Label>
                <Select
                  value={filtros.tipo}
                  onValueChange={(v) => setFiltros(prev => ({ ...prev, tipo: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="objetiva">Objetiva</SelectItem>
                    <SelectItem value="discursiva">Discursiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label>Buscar</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Buscar no enunciado..."
                    value={filtros.busca}
                    onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && loadQuestoes()}
                  />
                  <Button variant="outline" onClick={() => loadQuestoes()}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Questões */}
        <Card>
          <CardHeader>
            <CardTitle>
              Questões
              {paginacao && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({paginacao.total} total)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingQuestoes ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : questoes.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                Nenhuma questão encontrada
              </p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Tipo</TableHead>
                      <TableHead>Enunciado</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Módulo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questoes.map((questao) => (
                      <TableRow key={String(questao._id)}>
                        <TableCell>
                          <Badge variant={questao.tipo === 'objetiva' ? 'default' : 'secondary'}>
                            {questao.tipo === 'objetiva' ? 'OBJ' : 'DIS'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <p className="truncate">{questao.enunciado}</p>
                        </TableCell>
                        <TableCell>{questao.periodoNome}</TableCell>
                        <TableCell>{questao.moduloNome}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openViewModal(questao)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(questao)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(String(questao._id))}
                            disabled={deleting === String(questao._id)}
                          >
                            {deleting === String(questao._id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-red-500" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Paginação */}
                {paginacao && paginacao.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      disabled={paginacao.page <= 1}
                      onClick={() => loadQuestoes(paginacao.page - 1)}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Página {paginacao.page} de {paginacao.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      disabled={paginacao.page >= paginacao.totalPages}
                      onClick={() => loadQuestoes(paginacao.page + 1)}
                    >
                      Próxima
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Modal de criar/editar/visualizar */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {modalMode === 'create' ? 'Nova Questão' :
                 modalMode === 'edit' ? 'Editar Questão' : 'Visualizar Questão'}
              </DialogTitle>
            </DialogHeader>

            {modalMode === 'view' && editingQuestao ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Badge>{editingQuestao.tipo}</Badge>
                  <Badge variant="outline">{editingQuestao.periodoNome}</Badge>
                  <Badge variant="outline">{editingQuestao.moduloNome}</Badge>
                </div>

                <div>
                  <Label className="font-medium">Enunciado</Label>
                  <p className="mt-1 whitespace-pre-wrap">{editingQuestao.enunciado}</p>
                </div>

                {editingQuestao.imagemUrl && (
                  <div>
                    <Label className="font-medium">Imagem</Label>
                    <div className="mt-2">
                      <img
                        src={editingQuestao.imagemUrl}
                        alt="Imagem da questão"
                        className="max-w-full max-h-64 rounded border"
                      />
                    </div>
                  </div>
                )}

                {editingQuestao.tipo === 'objetiva' && editingQuestao.alternativas && (
                  <div>
                    <Label className="font-medium">Alternativas</Label>
                    <div className="mt-2 space-y-2">
                      {editingQuestao.alternativas.map((alt) => (
                        <div
                          key={alt.letra}
                          className={`p-3 rounded border ${alt.correta ? 'bg-green-50 border-green-500 dark:bg-green-900/20' : ''}`}
                        >
                          <strong>{alt.letra})</strong> {alt.texto}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {editingQuestao.tipo === 'discursiva' && editingQuestao.respostaModelo && (
                  <div>
                    <Label className="font-medium">Resposta Modelo</Label>
                    <p className="mt-1 whitespace-pre-wrap p-3 bg-muted rounded">
                      {editingQuestao.respostaModelo}
                    </p>
                  </div>
                )}

                {editingQuestao.explicacao && (
                  <div>
                    <Label className="font-medium">Explicação</Label>
                    <p className="mt-1 whitespace-pre-wrap p-3 bg-muted rounded">
                      {editingQuestao.explicacao}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 py-4">
                {/* Tipo */}
                <div>
                  <Label>Tipo *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(v: 'objetiva' | 'discursiva') => setFormData(prev => ({ ...prev, tipo: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="objetiva">Objetiva</SelectItem>
                      <SelectItem value="discursiva">Discursiva</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Hierarquia */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Período *</Label>
                    <Select
                      value={formData.periodoId}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, periodoId: v, moduloId: '', topicoId: '', subtopicoId: '' }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {periodos.map((p) => (
                          <SelectItem key={String(p._id)} value={String(p._id)}>
                            {p.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Módulo *</Label>
                    <Select
                      value={formData.moduloId}
                      onValueChange={(v) => setFormData(prev => ({ ...prev, moduloId: v, topicoId: '', subtopicoId: '' }))}
                      disabled={!formData.periodoId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {formModulos.map((m) => (
                          <SelectItem key={String(m._id)} value={String(m._id)}>
                            {m.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Tópico *</Label>
                    {showNewTopico ? (
                      <div className="flex gap-2">
                        <Input
                          value={newTopicoNome}
                          onChange={(e) => setNewTopicoNome(e.target.value)}
                          placeholder="Nome do novo tópico"
                          disabled={creatingTopico}
                        />
                        <Button
                          type="button"
                          size="icon"
                          onClick={handleCreateTopico}
                          disabled={creatingTopico || !newTopicoNome.trim()}
                        >
                          {creatingTopico ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => { setShowNewTopico(false); setNewTopicoNome('') }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Select
                          value={formData.topicoId}
                          onValueChange={(v) => setFormData(prev => ({ ...prev, topicoId: v, subtopicoId: '' }))}
                          disabled={!formData.moduloId}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {formTopicos.map((t) => (
                              <SelectItem key={String(t._id)} value={String(t._id)}>
                                {t.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => setShowNewTopico(true)}
                          disabled={!formData.moduloId}
                          title="Criar novo tópico"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Subtópico (opcional)</Label>
                    {showNewSubtopico ? (
                      <div className="flex gap-2">
                        <Input
                          value={newSubtopicoNome}
                          onChange={(e) => setNewSubtopicoNome(e.target.value)}
                          placeholder="Nome do novo subtópico"
                          disabled={creatingSubtopico}
                        />
                        <Button
                          type="button"
                          size="icon"
                          onClick={handleCreateSubtopico}
                          disabled={creatingSubtopico || !newSubtopicoNome.trim()}
                        >
                          {creatingSubtopico ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => { setShowNewSubtopico(false); setNewSubtopicoNome('') }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Select
                          value={formData.subtopicoId || ''}
                          onValueChange={(v) => setFormData(prev => ({ ...prev, subtopicoId: v }))}
                          disabled={!formData.topicoId}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Nenhum</SelectItem>
                            {formSubtopicos.map((s) => (
                              <SelectItem key={String(s._id)} value={String(s._id)}>
                                {s.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => setShowNewSubtopico(true)}
                          disabled={!formData.topicoId}
                          title="Criar novo subtópico"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enunciado */}
                <div>
                  <Label>Enunciado *</Label>
                  <Textarea
                    value={formData.enunciado}
                    onChange={(e) => setFormData(prev => ({ ...prev, enunciado: e.target.value }))}
                    rows={5}
                    placeholder="Digite o enunciado da questão..."
                  />
                </div>

                {/* Imagem */}
                <div>
                  <Label className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Imagem (opcional)
                  </Label>
                  <div className="mt-1 space-y-2">
                    <Input
                      value={formData.imagemUrl || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, imagemUrl: e.target.value }))}
                      placeholder="Cole a URL da imagem (Imgur, etc.) ou faça upload"
                    />
                    {formData.imagemUrl && (
                      <div className="relative inline-block">
                        <img
                          src={formData.imagemUrl}
                          alt="Preview"
                          className="max-w-full max-h-48 rounded border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => setFormData(prev => ({ ...prev, imagemUrl: '' }))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Dica: Faça upload no <a href="https://imgur.com/upload" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Imgur</a> e cole o link aqui
                    </p>
                  </div>
                </div>

                {/* Alternativas (para objetiva) */}
                {formData.tipo === 'objetiva' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Alternativas *</Label>
                      {(formData.alternativas?.length || 0) < 5 && (
                        <Button variant="outline" size="sm" onClick={addAlternativa}>
                          <Plus className="h-3 w-3 mr-1" />
                          Adicionar
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {formData.alternativas?.map((alt, index) => (
                        <div key={alt.letra} className="flex items-start gap-2">
                          <div className="flex items-center gap-2 pt-2">
                            <input
                              type="radio"
                              name="alternativaCorreta"
                              checked={alt.correta}
                              onChange={() => updateAlternativa(index, 'correta', true)}
                              className="h-4 w-4"
                            />
                            <span className="font-medium w-6">{alt.letra})</span>
                          </div>
                          <Textarea
                            value={alt.texto}
                            onChange={(e) => updateAlternativa(index, 'texto', e.target.value)}
                            rows={2}
                            className="flex-1"
                            placeholder={`Texto da alternativa ${alt.letra}`}
                          />
                          {(formData.alternativas?.length || 0) > 2 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeAlternativa(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resposta Modelo (para discursiva) */}
                {formData.tipo === 'discursiva' && (
                  <div>
                    <Label>Resposta Modelo *</Label>
                    <Textarea
                      value={formData.respostaModelo || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, respostaModelo: e.target.value }))}
                      rows={5}
                      placeholder="Digite a resposta modelo esperada..."
                    />
                  </div>
                )}

                {/* Explicação */}
                <div>
                  <Label>Explicação (opcional)</Label>
                  <Textarea
                    value={formData.explicacao || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, explicacao: e.target.value }))}
                    rows={3}
                    placeholder="Explicação que será mostrada após a resposta..."
                  />
                </div>

                {/* Metadados */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label>Dificuldade</Label>
                    <Select
                      value={formData.dificuldade || ''}
                      onValueChange={(v: any) => setFormData(prev => ({ ...prev, dificuldade: v || undefined }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Não definida</SelectItem>
                        <SelectItem value="facil">Fácil</SelectItem>
                        <SelectItem value="medio">Médio</SelectItem>
                        <SelectItem value="dificil">Difícil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Fonte</Label>
                    <Input
                      value={formData.fonte || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, fonte: e.target.value }))}
                      placeholder="Ex: ENADE 2023"
                    />
                  </div>

                  <div>
                    <Label>Ano</Label>
                    <Input
                      type="number"
                      value={formData.ano || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, ano: e.target.value ? parseInt(e.target.value) : undefined }))}
                      placeholder="Ex: 2023"
                    />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModal(false)}>
                {modalMode === 'view' ? 'Fechar' : 'Cancelar'}
              </Button>
              {modalMode !== 'view' && (
                <Button
                  onClick={handleSave}
                  disabled={
                    saving ||
                    !formData.periodoId ||
                    !formData.moduloId ||
                    !formData.topicoId ||
                    !formData.enunciado.trim() ||
                    (formData.tipo === 'objetiva' && !formData.alternativas?.some(a => a.correta)) ||
                    (formData.tipo === 'discursiva' && !formData.respostaModelo?.trim())
                  }
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de questões duplicadas */}
        <Dialog open={showDuplicatasModal} onOpenChange={setShowDuplicatasModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Questões Duplicadas
              </DialogTitle>
              <DialogDescription>
                Questões com enunciados idênticos encontradas no banco de questões
              </DialogDescription>
            </DialogHeader>

            {loadingDuplicatas ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : duplicatas.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-medium">Nenhuma duplicata encontrada!</h3>
                <p className="text-muted-foreground">
                  Todas as questões têm enunciados únicos
                </p>
              </div>
            ) : (
              <div className="space-y-6 py-4">
                {duplicatas.map((grupo, idx) => (
                  <div key={idx} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <Copy className="h-3 w-3" />
                            {grupo.count} duplicatas
                          </Badge>
                        </div>
                        <p className="text-sm font-medium line-clamp-2">
                          {grupo.enunciado}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {grupo.questoes.map((questao: any) => (
                        <div key={String(questao._id)} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex-1 text-sm">
                            <span className="font-medium">ID:</span> {String(questao._id).slice(-6)}
                            <span className="mx-2">•</span>
                            <span className="font-medium">Criada em:</span> {new Date(questao.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteDuplicata(String(questao._id))}
                            disabled={deletingDuplicata === String(questao._id)}
                          >
                            {deletingDuplicata === String(questao._id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDuplicatasModal(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
