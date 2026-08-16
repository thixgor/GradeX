'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogoLoading } from '@/components/logo-loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArrowLeft, Upload, X } from 'lucide-react'
import { AulaTopic, AulaSubtopic, AulaModulo, AulaType, AulaVisibility } from '@/lib/types'
import { ToastAlert } from '@/components/ui/toast-alert'

interface User {
  id: string
  email: string
  name: string
  role: string
}

function CriarAulaConteudo() {
  const router = useRouter()
  // O painel de estrutura abre esta tela já sabendo onde a aula vai morar
  // (§4). Sem isso o admin escolheria o curso de novo, à mão, logo depois de
  // ter clicado exatamente no lugar em que a queria.
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Dados
  const [topicos, setTopicos] = useState<AulaTopic[]>([])
  const [subtopicos, setSubtopicos] = useState<AulaSubtopic[]>([])
  const [modulos, setModulos] = useState<AulaModulo[]>([])

  // Form
  const [titulo, setTitulo] = useState(() => searchParams.get('titulo') || '')
  const [descricao, setDescricao] = useState('')
  const [tipo, setTipo] = useState<AulaType>('gravada')
  const [visibilidade, setVisibilidade] = useState<AulaVisibility>('plus')
  const [topicoId, setTopicoId] = useState(() => searchParams.get('topicoId') || '')
  const [subtopicoId, setSubtopicoId] = useState(() => searchParams.get('subtopicoId') || '')
  const [moduloId, setModuloId] = useState(() => searchParams.get('moduloId') || '')
  // Curso e submódulo não têm campo nesta tela; vêm do painel e seguem junto no
  // envio para a aula não nascer solta.
  const [setorId] = useState(() => searchParams.get('setorId') || '')
  const [submoduloId] = useState(() => searchParams.get('submoduloId') || '')
  const [linkOuEmbed, setLinkOuEmbed] = useState('')
  const [videoEmbed, setVideoEmbed] = useState('')
  const [dataLiberacao, setDataLiberacao] = useState('')
  const [pdfs, setPdfs] = useState<Array<{ nome: string; url: string; tamanho: number }>>([])
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
      if (data.user.role !== 'admin') {
        router.push('/')
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
      const res = await fetch('/api/aulas')
      if (res.ok) {
        const data = await res.json()
        setTopicos(data.topicos || [])
        setSubtopicos(data.subtopicos || [])
        setModulos(data.modulos || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  /** De que curso é este tópico? */
  function setorDoTopico(id: string): string {
    if (!id) return ''
    const topico = topicos.find((t) => String(t._id) === id)
    return topico?.setorId ? String(topico.setorId) : ''
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

      // Validar tamanho (2MB)
      if (file.size > 2 * 1024 * 1024) {
        showToast(`Arquivo ${file.name} excede 2MB`, 'error')
        continue
      }

      // Validar tipo
      if (file.type !== 'application/pdf') {
        showToast(`Arquivo ${file.name} não é um PDF`, 'error')
        continue
      }

      // Simular upload (em produção, usar FormData com API)
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

  async function criarAula() {
    if (!titulo.trim()) {
      showToast('Título é obrigatório', 'error')
      return
    }

    if (!dataLiberacao) {
      showToast('Data de liberação é obrigatória', 'error')
      return
    }

    if (tipo === 'ao-vivo' && !linkOuEmbed.trim()) {
      showToast('Link ou embed é obrigatório para aulas ao vivo', 'error')
      return
    }

    if (tipo === 'gravada' && !videoEmbed.trim()) {
      showToast('Vídeo é obrigatório para aulas gravadas', 'error')
      return
    }

    setEnviando(true)
    try {
      const res = await fetch('/api/aulas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          descricao,
          tipo,
          visibilidade,
          // O `setorId` é o que a biblioteca do aluno usa para agrupar por
          // curso: sem ele a aula é criada, fica no banco e nunca aparece lá.
          // Quando o painel não informa, ele é deduzido do tópico escolhido.
          setorId: setorId || setorDoTopico(topicoId) || undefined,
          topicoId: topicoId || undefined,
          subtopicoId: subtopicoId || undefined,
          moduloId: moduloId || undefined,
          submoduloId: submoduloId || undefined,
          linkOuEmbed: tipo === 'ao-vivo' ? linkOuEmbed : undefined,
          videoEmbed: tipo === 'gravada' ? videoEmbed : undefined,
          pdfs,
          dataLiberacao
        })
      })

      if (res.ok) {
        showToast('Aula criada com sucesso!')
        setTimeout(() => {
          router.push('/admin/aulas')
        }, 1500)
      } else {
        const error = await res.json()
        showToast(error.error || 'Erro ao criar aula', 'error')
      }
    } catch (error) {
      console.error('Erro ao criar aula:', error)
      showToast('Erro ao criar aula', 'error')
    } finally {
      setEnviando(false)
    }
  }

  if (loading) {
    return <LogoLoading message="Carregando..." size="lg" fullscreen />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/admin/aulas')}
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Criar Aula</h1>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título da Aula *</Label>
                <Input
                  id="titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Introdução à Biologia Celular"
                />
              </div>

              <div>
                <Label htmlFor="descricao">Descrição (Opcional)</Label>
                <Textarea
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descrição da aula..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo">Tipo de Aula *</Label>
                  <select
                    id="tipo"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as AulaType)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                  >
                    <option value="gravada">Gravada</option>
                    <option value="ao-vivo">Ao Vivo</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="visibilidade">Visibilidade *</Label>
                  <select
                    id="visibilidade"
                    value={visibilidade}
                    onChange={(e) => setVisibilidade(e.target.value as AulaVisibility)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                  >
                    <option value="premium">Plus+</option>
                    <option value="gratuita">Gratuita</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="dataLiberacao">Data de Liberação *</Label>
                <Input
                  id="dataLiberacao"
                  type="datetime-local"
                  value={dataLiberacao}
                  onChange={(e) => setDataLiberacao(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Categorização */}
          <Card>
            <CardHeader>
              <CardTitle>Categorização (Opcional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="topico">Tópico</Label>
                <select
                  id="topico"
                  value={topicoId}
                  onChange={(e) => {
                    setTopicoId(e.target.value)
                    setSubtopicoId('')
                    setModuloId('')
                  }}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                >
                  <option value="">Selecione um tópico</option>
                  {topicos.map(t => (
                    <option key={String(t._id)} value={String(t._id)}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </div>

              {topicoId && (
                <div>
                  <Label htmlFor="subtopico">Subtópico</Label>
                  <select
                    id="subtopico"
                    value={subtopicoId}
                    onChange={(e) => {
                      setSubtopicoId(e.target.value)
                      setModuloId('')
                    }}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                  >
                    <option value="">Selecione um subtópico</option>
                    {subtopicos
                      .filter(s => s.topicoId === topicoId)
                      .map(s => (
                        <option key={String(s._id)} value={String(s._id)}>
                          {s.nome}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {(topicoId || subtopicoId) && (
                <div>
                  <Label htmlFor="modulo">Módulo</Label>
                  <select
                    id="modulo"
                    value={moduloId}
                    onChange={(e) => setModuloId(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                  >
                    <option value="">Selecione um módulo</option>
                    {modulos
                      .filter(m =>
                        (!subtopicoId && m.topicoId === topicoId) ||
                        (subtopicoId && m.subtopicoId === subtopicoId)
                      )
                      .map(m => (
                        <option key={String(m._id)} value={String(m._id)}>
                          {m.nome}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conteúdo */}
          <Card>
            <CardHeader>
              <CardTitle>Conteúdo da Aula</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tipo === 'ao-vivo' && (
                <div>
                  <Label htmlFor="linkOuEmbed">Link ou Embed da Aula Ao Vivo *</Label>
                  <Textarea
                    id="linkOuEmbed"
                    value={linkOuEmbed}
                    onChange={(e) => setLinkOuEmbed(e.target.value)}
                    placeholder="Cole o link ou código embed do vídeo (ex: https://zoom.us/... ou <iframe>...)</iframe>"
                    rows={4}
                  />
                </div>
              )}

              {tipo === 'gravada' && (
                <div>
                  <Label htmlFor="videoEmbed">Vídeo Embed ou Link *</Label>
                  <Textarea
                    id="videoEmbed"
                    value={videoEmbed}
                    onChange={(e) => setVideoEmbed(e.target.value)}
                    placeholder="Cole o código embed do vídeo (ex: <iframe>...</iframe>) ou URL do vídeo"
                    rows={4}
                  />
                </div>
              )}

              <div>
                <Label>Materiais de Apoio (PDFs - Máx 3, até 2MB cada)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={handleUploadPDF}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label htmlFor="pdf-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Clique para fazer upload de PDFs</p>
                    <p className="text-xs text-muted-foreground">ou arraste arquivos aqui</p>
                  </label>
                </div>

                {pdfs.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {pdfs.map((pdf, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{pdf.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {(pdf.tamanho / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removerPDF(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/aulas')}
            >
              Cancelar
            </Button>
            <Button
              onClick={criarAula}
              disabled={enviando}
            >
              {enviando ? 'Criando...' : 'Criar Aula'}
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

export default function CriarAulaPage() {
  // `useSearchParams` exige a fronteira de Suspense no App Router.
  return (
    <Suspense fallback={<LogoLoading message="Carregando..." size="lg" fullscreen />}>
      <CriarAulaConteudo />
    </Suspense>
  )
}
