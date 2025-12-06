'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArrowLeft, Upload, X } from 'lucide-react'
import { AulaTopic, AulaSubtopic, AulaModulo, AulaType, AulaVisibility, AulaPostagem } from '@/lib/types'
import { ToastAlert } from '@/components/ui/toast-alert'

interface User {
  id: string
  email: string
  name: string
  role: string
  secondaryRole?: string
}

export default function EditarAulaPage() {
  const router = useRouter()
  const params = useParams()
  const aulaId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Dados
  const [setores, setSetores] = useState<any[]>([])
  const [topicos, setTopicos] = useState<AulaTopic[]>([])
  const [subtopicos, setSubtopicos] = useState<AulaSubtopic[]>([])
  const [modulos, setModulos] = useState<AulaModulo[]>([])
  const [aula, setAula] = useState<AulaPostagem | null>(null)

  // Form
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tipo, setTipo] = useState<AulaType>('gravada')
  const [visibilidade, setVisibilidade] = useState<AulaVisibility>('premium')
  const [setorId, setSetorId] = useState('')
  const [topicoId, setTopicoId] = useState('')
  const [subtopicoId, setSubtopicoId] = useState('')
  const [moduloId, setModuloId] = useState('')
  const [linkOuEmbed, setLinkOuEmbed] = useState('')
  const [videoEmbed, setVideoEmbed] = useState('')
  const [dataLiberacao, setDataLiberacao] = useState('')
  const [dataLiberacaoHabilitada, setDataLiberacaoHabilitada] = useState(false)
  const [pdfs, setPdfs] = useState<Array<{ nome: string; url: string; tamanho: number }>>([])
  
  // Botões de acesso
  const [botoesAcesso, setBotoesAcesso] = useState<Array<{ nome: string; url: string }>>([])
  const [novoBotaoNome, setNovoBotaoNome] = useState('Acessar')
  const [novoBotaoUrl, setNovoBotaoUrl] = useState('')
  
  // Capa
  const [capaTipo, setCapaTipo] = useState<'imagem' | 'cor' | 'nenhuma'>('nenhuma')
  const [capaImagem, setCapaImagem] = useState('')
  const [capaCorHex, setCapaCorHex] = useState('#3b82f6')
  const [capaCorTitulo, setCapaCorTitulo] = useState('')
  
  const [enviando, setEnviando] = useState(false)

  // Toast
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'error' | 'success' | 'info'>('success')

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/auth/login')
        return
      }
      const data = await res.json()
      const isAdmin = data.user.role === 'admin'
      const isMonitor = data.user.secondaryRole === 'monitor'

      if (!isAdmin && !isMonitor) {
        router.push('/aulas')
        return
      }

      setUser(data.user)
      loadDados()
    } catch (error) {
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  async function loadDados() {
    try {
      const [aulasRes, dataRes] = await Promise.all([
        fetch(`/api/aulas/${aulaId}`),
        fetch('/api/aulas')
      ])

      if (!aulasRes.ok) {
        showToast('Aula não encontrada', 'error')
        router.push('/aulas/gerenciar/aulas')
        return
      }

      const aulaData = await aulasRes.json()
      const data = await dataRes.json()

      setAula(aulaData.aula)
      setSetores(data.setores || [])
      setTopicos(data.topicos || [])
      setSubtopicos(data.subtopicos || [])
      setModulos(data.modulos || [])

      // Preencher form
      const a = aulaData.aula
      setTitulo(a.titulo)
      setDescricao(a.descricao || '')
      setTipo(a.tipo)
      setVisibilidade(a.visibilidade)
      setSetorId(a.setorId || '')
      setTopicoId(a.topicoId || '')
      setSubtopicoId(a.subtopicoId || '')
      setModuloId(a.moduloId || '')
      setLinkOuEmbed(a.linkOuEmbed || '')
      setVideoEmbed(a.videoEmbed || '')
      const dataObj = a.dataLiberacao ? new Date(a.dataLiberacao) : null
      const isDefaultDate = dataObj && dataObj.getFullYear() === 2000 && dataObj.getMonth() === 0 && dataObj.getDate() === 1
      const dataLib = dataObj && !isDefaultDate ? dataObj.toISOString().slice(0, 16) : ''
      setDataLiberacao(dataLib)
      setDataLiberacaoHabilitada(!!dataLib)
      setPdfs(a.pdfs || [])
      setBotoesAcesso(a.botoesAcesso || [])
      
      // Carregar capa
      if (a.capa) {
        setCapaTipo(a.capa.tipo)
        if (a.capa.tipo === 'imagem' && a.capa.imagem) {
          setCapaImagem(a.capa.imagem)
        }
        if (a.capa.tipo === 'cor') {
          setCapaCorHex(a.capa.cor || '#3b82f6')
          setCapaCorTitulo(a.capa.titulo || '')
        }
      }
    } catch (error) {
      console.error('Erro ao carregar aula:', error)
      showToast('Erro ao carregar aula', 'error')
    }
  }

  function showToast(message: string, type: 'error' | 'success' | 'info' = 'success') {
    setToastMessage(message)
    setToastType(type)
    setToastOpen(true)
  }

  async function handleUploadPDF(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return

    for (let i = 0; i < files.length && pdfs.length < 3; i++) {
      const file = files[i]

      if (file.size > 2 * 1024 * 1024) {
        showToast(`Arquivo ${file.name} excede 2MB`, 'error')
        continue
      }

      if (file.type !== 'application/pdf') {
        showToast(`Arquivo ${file.name} não é um PDF`, 'error')
        continue
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        setPdfs([
          ...pdfs,
          {
            nome: file.name,
            url: event.target?.result as string,
            tamanho: file.size
          }
        ])
      }
      reader.readAsDataURL(file)
    }
  }

  function removerPDF(index: number) {
    setPdfs(pdfs.filter((_, i) => i !== index))
  }

  async function atualizarAula() {
    if (!titulo.trim()) {
      showToast('Título é obrigatório', 'error')
      return
    }


    // Validar capa
    if (capaTipo === 'imagem' && !capaImagem.trim()) {
      showToast('URL da imagem é obrigatória', 'error')
      return
    }

    if (capaTipo === 'cor' && !capaCorTitulo.trim()) {
      showToast('Título da capa é obrigatório', 'error')
      return
    }

    setEnviando(true)
    try {
      const capa = capaTipo === 'nenhuma' ? undefined : {
        tipo: capaTipo,
        imagem: capaTipo === 'imagem' ? capaImagem : undefined,
        cor: capaTipo === 'cor' ? capaCorHex : undefined,
        titulo: capaTipo === 'cor' ? capaCorTitulo : undefined
      }

      const payload = {
        titulo,
        descricao,
        tipo,
        visibilidade,
        setorId: setorId || null,
        topicoId: topicoId || null,
        subtopicoId: subtopicoId || null,
        moduloId: moduloId || null,
        linkOuEmbed: tipo === 'ao-vivo' ? linkOuEmbed : null,
        videoEmbed: tipo === 'gravada' ? videoEmbed : null,
        pdfs,
        dataLiberacao: dataLiberacao || null,
        capa,
        botoesAcesso: botoesAcesso.length > 0 ? botoesAcesso : null
      }

      console.log('Atualizando aula:', { aulaId, payload })

      const res = await fetch(`/api/aulas/${aulaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      console.log('Response status:', res.status)

      if (res.ok) {
        const data = await res.json()
        console.log('Aula atualizada:', data)
        showToast('Aula atualizada com sucesso!')
        setTimeout(() => {
          router.push('/aulas/gerenciar/aulas')
        }, 1500)
      } else {
        const error = await res.json()
        console.error('Erro na resposta:', error)
        showToast(error.error || 'Erro ao atualizar aula', 'error')
      }
    } catch (error) {
      console.error('Erro ao atualizar aula:', error)
      showToast('Erro ao atualizar aula', 'error')
    } finally {
      setEnviando(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-40 backdrop-blur-md bg-white/5 border-b border-white/10 sticky top-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/aulas/gerenciar/aulas')}
                className="shrink-0 text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">Editar Aula</h1>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-30 container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Informações Básicas</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="titulo" className="text-white/80">Título da Aula *</Label>
                <Input
                  id="titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Introdução à Biologia Celular"
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>

              <div>
                <Label htmlFor="descricao" className="text-white/80">Descrição (Opcional)</Label>
                <Textarea
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descrição da aula..."
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo" className="text-white/80">Tipo de Aula *</Label>
                  <select
                    id="tipo"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as AulaType)}
                    className="w-full mt-1 px-3 py-2 border border-white/10 rounded-md bg-white/5 text-white text-sm"
                  >
                    <option value="gravada" className="bg-slate-900">Gravada</option>
                    <option value="ao-vivo" className="bg-slate-900">Ao Vivo</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="visibilidade" className="text-white/80">Visibilidade *</Label>
                  <select
                    id="visibilidade"
                    value={visibilidade}
                    onChange={(e) => setVisibilidade(e.target.value as AulaVisibility)}
                    className="w-full mt-1 px-3 py-2 border border-white/10 rounded-md bg-white/5 text-white text-sm"
                  >
                    <option value="premium" className="bg-slate-900">Premium</option>
                    <option value="gratuita" className="bg-slate-900">Gratuita</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="dataLiberacao" className="text-white/80">Data de Liberação (Opcional)</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setDataLiberacaoHabilitada(!dataLiberacaoHabilitada)
                      if (!dataLiberacaoHabilitada) {
                        setDataLiberacao(new Date().toISOString().slice(0, 16))
                      } else {
                        setDataLiberacao('')
                      }
                    }}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      dataLiberacaoHabilitada
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                        : 'bg-white/10 text-white/60 border border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {dataLiberacaoHabilitada ? '✓ Habilitado' : 'Desabilitado'}
                  </button>
                </div>
                {dataLiberacaoHabilitada && (
                  <Input
                    id="dataLiberacao"
                    type="datetime-local"
                    value={dataLiberacao}
                    onChange={(e) => setDataLiberacao(e.target.value)}
                    className="mt-1 bg-white/5 border-white/10 text-white"
                  />
                )}
                <p className="text-xs text-white/50 mt-1">
                  {dataLiberacaoHabilitada 
                    ? 'A aula será liberada na data e hora especificadas'
                    : 'Se desabilitado, a aula será liberada imediatamente'}
                </p>
              </div>
            </div>
          </div>

          {/* Categorização */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Categorização (Opcional)</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="setor" className="text-white/80">Setor</Label>
                <select
                  id="setor"
                  value={setorId}
                  onChange={(e) => {
                    setSetorId(e.target.value)
                    setTopicoId('')
                    setSubtopicoId('')
                    setModuloId('')
                  }}
                  className="w-full mt-1 px-3 py-2 border border-white/10 rounded-md bg-white/5 text-white text-sm"
                >
                  <option value="" className="bg-slate-900">Selecione um setor</option>
                  {setores.map(s => (
                    <option key={String(s._id)} value={String(s._id)} className="bg-slate-900">
                      {s.nome}
                    </option>
                  ))}
                </select>
              </div>

              {setorId && (
                <div>
                  <Label htmlFor="topico" className="text-white/80">Tópico</Label>
                  <select
                    id="topico"
                    value={topicoId}
                    onChange={(e) => {
                      setTopicoId(e.target.value)
                      setSubtopicoId('')
                      setModuloId('')
                    }}
                    className="w-full mt-1 px-3 py-2 border border-white/10 rounded-md bg-white/5 text-white text-sm"
                  >
                    <option value="" className="bg-slate-900">Selecione um tópico</option>
                    {topicos
                      .filter(t => t.setorId === setorId)
                      .map(t => (
                        <option key={String(t._id)} value={String(t._id)} className="bg-slate-900">
                          {t.nome}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {topicoId && (
                <div>
                  <Label htmlFor="subtopico" className="text-white/80">Subtópico</Label>
                  <select
                    id="subtopico"
                    value={subtopicoId}
                    onChange={(e) => {
                      setSubtopicoId(e.target.value)
                      setModuloId('')
                    }}
                    className="w-full mt-1 px-3 py-2 border border-white/10 rounded-md bg-white/5 text-white text-sm"
                  >
                    <option value="" className="bg-slate-900">Selecione um subtópico</option>
                    {subtopicos
                      .filter(s => s.topicoId === topicoId)
                      .map(s => (
                        <option key={String(s._id)} value={String(s._id)} className="bg-slate-900">
                          {s.nome}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {(topicoId || subtopicoId) && (
                <div>
                  <Label htmlFor="modulo" className="text-white/80">Módulo</Label>
                  <select
                    id="modulo"
                    value={moduloId}
                    onChange={(e) => setModuloId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-white/10 rounded-md bg-white/5 text-white text-sm"
                  >
                    <option value="" className="bg-slate-900">Selecione um módulo</option>
                    {modulos
                      .filter(m =>
                        (!subtopicoId && m.topicoId === topicoId) ||
                        (subtopicoId && m.subtopicoId === subtopicoId)
                      )
                      .map(m => (
                        <option key={String(m._id)} value={String(m._id)} className="bg-slate-900">
                          {m.nome}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Conteúdo */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Conteúdo da Aula</h2>
            <div className="space-y-4">
              {tipo === 'ao-vivo' && (
                <div>
                  <Label htmlFor="linkOuEmbed" className="text-white/80">Link ou Embed da Aula Ao Vivo (Opcional)</Label>
                  <Textarea
                    id="linkOuEmbed"
                    value={linkOuEmbed}
                    onChange={(e) => setLinkOuEmbed(e.target.value)}
                    placeholder="Cole o link ou código embed do vídeo"
                    className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    rows={4}
                  />
                </div>
              )}

              {tipo === 'gravada' && (
                <div>
                  <Label htmlFor="videoEmbed" className="text-white/80">Vídeo Embed ou Link (Opcional)</Label>
                  <Textarea
                    id="videoEmbed"
                    value={videoEmbed}
                    onChange={(e) => setVideoEmbed(e.target.value)}
                    placeholder="Cole o código embed do vídeo (ex: iframe do YouTube)"
                    className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    rows={4}
                  />
                </div>
              )}

              {/* Botões de Acesso */}
              <div>
                <Label className="text-white/80 mb-4 block">Botões de Acesso (Opcional)</Label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={novoBotaoNome}
                      onChange={(e) => setNovoBotaoNome(e.target.value)}
                      placeholder="Nome do botão (ex: Entrar no Zoom)"
                      className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                    <Input
                      value={novoBotaoUrl}
                      onChange={(e) => setNovoBotaoUrl(e.target.value)}
                      placeholder="URL"
                      className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (novoBotaoNome.trim() && novoBotaoUrl.trim()) {
                          setBotoesAcesso([...botoesAcesso, { nome: novoBotaoNome, url: novoBotaoUrl }])
                          setNovoBotaoNome('Acessar')
                          setNovoBotaoUrl('')
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      size="sm"
                    >
                      Adicionar
                    </Button>
                  </div>

                  {botoesAcesso.length > 0 && (
                    <div className="space-y-2 mt-4">
                      {botoesAcesso.map((botao, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{botao.nome}</p>
                            <p className="text-xs text-white/50 truncate">{botao.url}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setBotoesAcesso(botoesAcesso.filter((_, i) => i !== idx))}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="pdfs" className="text-white/80">PDFs (Máximo 3, 2MB cada)</Label>
                <input
                  id="pdfs"
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={handleUploadPDF}
                  className="mt-1"
                />
                {pdfs.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {pdfs.map((pdf, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white/5 p-2 rounded border border-white/10">
                        <span className="text-sm text-white/70">{pdf.nome}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removerPDF(idx)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Capa da Aula */}
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Capa da Aula (Opcional)</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-white/80">Tipo de Capa</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  <button
                    onClick={() => setCapaTipo('nenhuma')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      capaTipo === 'nenhuma'
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <p className="text-sm font-medium text-white">Nenhuma</p>
                  </button>
                  <button
                    onClick={() => setCapaTipo('imagem')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      capaTipo === 'imagem'
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <p className="text-sm font-medium text-white">Imagem</p>
                  </button>
                  <button
                    onClick={() => setCapaTipo('cor')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      capaTipo === 'cor'
                        ? 'border-green-500 bg-green-500/20'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <p className="text-sm font-medium text-white">Cor + Título</p>
                  </button>
                </div>
              </div>

              {capaTipo === 'imagem' && (
                <div>
                  <Label htmlFor="capaImagem" className="text-white/80">URL da Imagem *</Label>
                  <Input
                    id="capaImagem"
                    value={capaImagem}
                    onChange={(e) => setCapaImagem(e.target.value)}
                    placeholder="https://exemplo.com/imagem.jpg"
                    className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                  <p className="text-xs text-white/50 mt-2">
                    📐 Tamanho recomendado: 16:9 (ex: 1280x720px, 1920x1080px)
                  </p>
                  {capaImagem && (
                    <div className="mt-4 rounded-lg overflow-hidden border border-white/10">
                      <img 
                        src={capaImagem} 
                        alt="Preview" 
                        className="w-full h-40 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="225"%3E%3Crect fill="%23333" width="400" height="225"/%3E%3Ctext x="50%25" y="50%25" font-size="16" fill="%23999" text-anchor="middle" dy=".3em"%3EImagem não carregou%3C/text%3E%3C/svg%3E'
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {capaTipo === 'cor' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="capaCorTitulo" className="text-white/80">Título da Capa *</Label>
                    <Input
                      id="capaCorTitulo"
                      value={capaCorTitulo}
                      onChange={(e) => setCapaCorTitulo(e.target.value)}
                      placeholder="Ex: Biologia Celular"
                      className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>

                  <div>
                    <Label htmlFor="capaCorHex" className="text-white/80">Cor de Fundo</Label>
                    <div className="flex gap-3 mt-2">
                      <input
                        id="capaCorHex"
                        type="color"
                        value={capaCorHex}
                        onChange={(e) => setCapaCorHex(e.target.value)}
                        className="h-10 w-20 rounded cursor-pointer border border-white/10"
                      />
                      <Input
                        value={capaCorHex}
                        onChange={(e) => setCapaCorHex(e.target.value)}
                        placeholder="#3b82f6"
                        className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                      />
                    </div>
                  </div>

                  {capaCorTitulo && (
                    <div
                      className="mt-4 rounded-lg p-8 text-center border border-white/10 flex items-center justify-center"
                      style={{ backgroundColor: capaCorHex }}
                    >
                      <p className="text-2xl font-bold text-white">{capaCorTitulo}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/aulas/gerenciar/aulas')}
              className="flex-1 border-white/10 text-white hover:bg-white/10"
            >
              Cancelar
            </Button>
            <Button
              onClick={atualizarAula}
              disabled={enviando}
              className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
            >
              {enviando ? 'Atualizando...' : 'Atualizar Aula'}
            </Button>
          </div>
        </div>
      </main>

      <ToastAlert
        open={toastOpen}
        onOpenChange={setToastOpen}
        message={toastMessage}
        type={toastType}
      />
    </div>
  )
}
