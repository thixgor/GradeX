'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/theme-toggle'
import { ToastAlert } from '@/components/ui/toast-alert'
import { BanChecker } from '@/components/ban-checker'
import { RichTextEditor } from '@/components/rich-text-editor'
import { ArrowLeft, Upload, X, Tag as TagIcon, MessageSquare, Link as LinkIcon } from 'lucide-react'
import { ForumType, ForumAttachment } from '@/lib/types'
import { Switch } from '@/components/ui/switch'

export default function NewForumPostPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const forumType = (searchParams.get('type') || 'discussion') as ForumType

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [commentsEnabled, setCommentsEnabled] = useState(true)
  const [attachments, setAttachments] = useState<ForumAttachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  async function handleFileUpload(file: File) {
    if (attachments.length >= 3) {
      setToastMessage('Máximo de 3 anexos permitidos')
      setToastType('error')
      setToastOpen(true)
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/forum/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao fazer upload')
      }

      setAttachments([...attachments, {
        type: data.type,
        url: data.url,
        name: data.name,
        size: data.size,
      }])

      setToastMessage('Arquivo enviado com sucesso!')
      setToastType('success')
      setToastOpen(true)
    } catch (error: any) {
      setToastMessage(error.message)
      setToastType('error')
      setToastOpen(true)
    } finally {
      setUploading(false)
    }
  }

  async function handleUrlAttachment() {
    const url = prompt('Digite a URL da imagem ou PDF:')
    if (!url) return

    if (attachments.length >= 3) {
      setToastMessage('Máximo de 3 anexos permitidos')
      setToastType('error')
      setToastOpen(true)
      return
    }

    const isPdf = url.toLowerCase().endsWith('.pdf')
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url)

    if (!isPdf && !isImage) {
      setToastMessage('URL deve ser de uma imagem (JPG, PNG, GIF, WEBP) ou PDF')
      setToastType('error')
      setToastOpen(true)
      return
    }

    setAttachments([...attachments, {
      type: isPdf ? 'pdf' : 'image',
      url,
      name: url.split('/').pop() || 'arquivo',
      size: 0,
    }])
  }

  function removeAttachment(index: number) {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  function handleAddTag() {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter(t => t !== tag))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      setToastMessage('Título e conteúdo são obrigatórios')
      setToastType('error')
      setToastOpen(true)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          forumType,
          title,
          content,
          attachments,
          tags,
          commentsEnabled,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar post')
      }

      setToastMessage('Post criado com sucesso!')
      setToastType('success')
      setToastOpen(true)

      setTimeout(() => {
        router.push(`/forum/post/${data.postId}`)
      }, 1000)
    } catch (error: any) {
      setToastMessage(error.message)
      setToastType('error')
      setToastOpen(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <BanChecker />

      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/forum')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Nova Postagem</h1>
              <p className="text-sm text-muted-foreground">
                {forumType === 'discussion' ? 'Fórum de Discussão' : 'Fórum de Materiais'}
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Criar Post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Digite o título do post"
                  required
                />
              </div>

              {/* Conteúdo */}
              <div className="space-y-2">
                <Label>Conteúdo *</Label>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Digite o conteúdo do post..."
                />
              </div>

              {/* Anexos */}
              <div className="space-y-3">
                <Label>Anexos (até 3)</Label>
                <div className="flex gap-2">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file)
                        e.target.value = ''
                      }}
                      className="hidden"
                      disabled={uploading || attachments.length >= 3}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={uploading || attachments.length >= 3}
                      onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? 'Enviando...' : 'Upload de Arquivo'}
                    </Button>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUrlAttachment}
                    disabled={attachments.length >= 3}
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Anexar URL
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Imagens: até 2MB | PDFs: até 10MB | Máximo: 3 arquivos
                </p>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((attachment, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {attachment.type === 'pdf' ? '📄' : '🖼️'}
                          </span>
                          <div>
                            <p className="text-sm font-medium">{attachment.name}</p>
                            {attachment.size > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {(attachment.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(idx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                    placeholder="Digite uma tag e pressione Enter"
                  />
                  <Button type="button" onClick={handleAddTag} variant="outline">
                    <TagIcon className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:opacity-70"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Comentários */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Permitir comentários</p>
                    <p className="text-sm text-muted-foreground">
                      Usuários poderão comentar neste post
                    </p>
                  </div>
                </div>
                <Switch
                  checked={commentsEnabled}
                  onCheckedChange={setCommentsEnabled}
                />
              </div>

              {/* Botões */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/forum')}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? 'Publicando...' : 'Publicar Post'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
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
