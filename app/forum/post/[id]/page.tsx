'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { ToastAlert } from '@/components/ui/toast-alert'
import { BanChecker } from '@/components/ban-checker'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Edit, Trash2, Lock, Unlock, Calendar, User as UserIcon, Tag as TagIcon, MessageSquare, AlertCircle } from 'lucide-react'
import { ForumPost, ForumComment } from '@/lib/types'
import { formatDate } from '@/lib/utils'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
}

export default function ForumPostPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const postId = params.id
  const [post, setPost] = useState<ForumPost | null>(null)
  const [comments, setComments] = useState<ForumComment[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  useEffect(() => {
    checkAuth()
    loadPost()
    loadComments()
  }, [])

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/auth/login')
        return
      }
      const data = await res.json()
      setUser(data.user)
    } catch (error) {
      router.push('/auth/login')
    }
  }

  async function loadPost() {
    try {
      const res = await fetch(`/api/forum/posts/${postId}`)
      const data = await res.json()
      if (res.ok) {
        setPost(data.post)
      } else {
        setToastMessage(data.error || 'Erro ao carregar post')
        setToastType('error')
        setToastOpen(true)
      }
    } catch (error) {
      setToastMessage('Erro ao carregar post')
      setToastType('error')
      setToastOpen(true)
    } finally {
      setLoading(false)
    }
  }

  async function loadComments() {
    try {
      const res = await fetch(`/api/forum/posts/${postId}/comments`)
      const data = await res.json()
      if (res.ok) {
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Erro ao carregar comentários:', error)
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault()

    if (!newComment.trim()) {
      setToastMessage('Digite um comentário')
      setToastType('error')
      setToastOpen(true)
      return
    }

    setSubmittingComment(true)
    try {
      const res = await fetch(`/api/forum/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao enviar comentário')
      }

      setToastMessage('Comentário adicionado com sucesso!')
      setToastType('success')
      setToastOpen(true)
      setNewComment('')
      loadComments()
    } catch (error: any) {
      setToastMessage(error.message)
      setToastType('error')
      setToastOpen(true)
    } finally {
      setSubmittingComment(false)
    }
  }

  async function handleDeletePost() {
    if (!confirm('Tem certeza que deseja excluir este post? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const res = await fetch(`/api/forum/posts/${postId}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao excluir post')
      }

      setToastMessage('Post excluído com sucesso!')
      setToastType('success')
      setToastOpen(true)

      setTimeout(() => {
        router.push('/forum')
      }, 1000)
    } catch (error: any) {
      setToastMessage(error.message)
      setToastType('error')
      setToastOpen(true)
    }
  }

  async function handleClosePost() {
    if (!confirm('Tem certeza que deseja fechar esta discussão?')) {
      return
    }

    try {
      const res = await fetch(`/api/forum/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close' }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao fechar discussão')
      }

      setToastMessage('Discussão fechada com sucesso!')
      setToastType('success')
      setToastOpen(true)
      loadPost()
    } catch (error: any) {
      setToastMessage(error.message)
      setToastType('error')
      setToastOpen(true)
    }
  }

  async function handleOpenPost() {
    if (!confirm('Tem certeza que deseja reabrir esta discussão?')) {
      return
    }

    try {
      const res = await fetch(`/api/forum/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'open' }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao reabrir discussão')
      }

      setToastMessage('Discussão reaberta com sucesso!')
      setToastType('success')
      setToastOpen(true)
      loadPost()
    } catch (error: any) {
      setToastMessage(error.message)
      setToastType('error')
      setToastOpen(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Post não encontrado</div>
      </div>
    )
  }

  const isAuthor = user?.id === post.authorId
  const isAdmin = user?.role === 'admin'
  const canEdit = isAuthor || isAdmin
  const canDelete = isAuthor || isAdmin
  const canCloseOpen = isAdmin

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
                onClick={() => router.push('/forum')}
                className="shrink-0 h-8 w-8 sm:h-9 sm:w-9"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">Fórum</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {post.forumType === 'discussion' ? 'Discussão' : 'Materiais'}
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Post Principal */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <CardTitle className="text-3xl">{post.title}</CardTitle>
              <div className="flex gap-2">
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/forum/post/${postId}/edit`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeletePost}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                )}
                {canCloseOpen && (
                  post.closed ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenPost}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Unlock className="h-4 w-4 mr-2" />
                      Reabrir
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClosePost}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Fechar
                    </Button>
                  )
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-4">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                <span>{post.authorName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(post.createdAt)}</span>
              </div>
              {post.edited && (
                <span className="text-xs text-orange-600 dark:text-orange-400">
                  ✏️ Editado em {formatDate(post.editedAt!)}
                </span>
              )}
            </div>

            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    <TagIcon className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Conteúdo do Post */}
            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Anexos */}
            {post.attachments.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Anexos</h3>
                {post.attachments.map((attachment, idx) => (
                  <div key={idx}>
                    {attachment.type === 'image' ? (
                      <div className="border rounded-lg overflow-hidden">
                        <img
                          src={attachment.url}
                          alt={attachment.name}
                          className="w-full max-h-96 object-contain"
                        />
                        <div className="p-2 bg-muted text-xs">
                          {attachment.name}
                        </div>
                      </div>
                    ) : (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted transition-colors"
                      >
                        <span className="text-3xl">📄</span>
                        <div>
                          <p className="font-medium">{attachment.name}</p>
                          {attachment.size > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {(attachment.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          )}
                        </div>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Aviso de discussão fechada */}
            {post.closed && (
              <div className="p-4 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
                <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                  <AlertCircle className="h-5 w-5" />
                  <p className="font-medium">
                    Discussão fechada por {post.closedByName} em {formatDate(post.closedAt!)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seção de Comentários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Comentários ({comments.length})
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Lista de Comentários */}
            {comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment._id?.toString()}
                    className="p-4 bg-muted rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm">
                        <UserIcon className="h-4 w-4" />
                        <span className="font-medium">{comment.authorName}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">
                          {formatDate(comment.createdAt)}
                        </span>
                        {comment.edited && (
                          <span className="text-xs text-orange-600 dark:text-orange-400">
                            (editado)
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                Nenhum comentário ainda. Seja o primeiro a comentar!
              </p>
            )}

            {/* Formulário de Novo Comentário */}
            {post.commentsEnabled && !post.closed ? (
              <form onSubmit={handleSubmitComment} className="space-y-4">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escreva seu comentário..."
                  rows={4}
                  className="resize-none"
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={submittingComment}>
                    {submittingComment ? 'Enviando...' : 'Enviar Comentário'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground">
                {post.closed
                  ? '💬 Esta discussão está fechada para novos comentários'
                  : '💬 Comentários desabilitados neste post'}
              </div>
            )}
          </CardContent>
        </Card>
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
