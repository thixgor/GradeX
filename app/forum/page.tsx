'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { ToastAlert } from '@/components/ui/toast-alert'
import { BanChecker } from '@/components/ban-checker'
import { ArrowLeft, Plus, MessageSquare, FileText, Tag, User, Calendar, Edit2, Lock } from 'lucide-react'
import { ForumPost, ForumType } from '@/lib/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ForumPage() {
  const router = useRouter()
  const [discussionPosts, setDiscussionPosts] = useState<ForumPost[]>([])
  const [materialsPosts, setMaterialsPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user')
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    loadUserRole()
    loadPosts()
  }, [])

  async function loadUserRole() {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUserRole(data.user?.role || 'user')
      }
    } catch (error) {
      console.error('Erro ao carregar role:', error)
    }
  }

  async function loadPosts() {
    try {
      // Carregar posts de discussão
      const discussionRes = await fetch('/api/forum/posts?type=discussion')
      if (discussionRes.ok) {
        const data = await discussionRes.json()
        setDiscussionPosts(data.posts || [])
      }

      // Carregar posts de materiais
      const materialsRes = await fetch('/api/forum/posts?type=materials')
      if (materialsRes.ok) {
        const data = await materialsRes.json()
        setMaterialsPosts(data.posts || [])
      }
    } catch (error) {
      console.error('Erro ao carregar posts:', error)
    } finally {
      setLoading(false)
    }
  }

  function formatDate(date: Date) {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function renderPostCard(post: ForumPost) {
    return (
      <Card
        key={String(post._id)}
        className="hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => router.push(`/forum/post/${String(post._id)}`)}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                {post.title}
                {post.closed && (
                  <span className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Fechado
                  </span>
                )}
                {post.edited && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded flex items-center gap-1">
                    <Edit2 className="h-3 w-3" />
                    Editado
                  </span>
                )}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-2">
                <User className="h-3 w-3" />
                {post.authorName}
                <span>•</span>
                <Calendar className="h-3 w-3" />
                {formatDate(post.createdAt)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="prose prose-sm dark:prose-invert line-clamp-3"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {post.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-muted px-2 py-1 rounded flex items-center gap-1"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {post.attachments.length > 0 && (
            <div className="text-xs text-muted-foreground mt-2">
              📎 {post.attachments.length} {post.attachments.length === 1 ? 'anexo' : 'anexos'}
            </div>
          )}

          {post.closed && post.closedByName && (
            <div className="mt-3 p-2 bg-red-50 dark:bg-red-950 rounded text-xs text-red-800 dark:text-red-200">
              Discussão fechada por {post.closedByName}
            </div>
          )}
        </CardContent>
      </Card>
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
                onClick={() => router.push('/')}
                className="shrink-0 h-8 w-8 sm:h-9 sm:w-9"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">Fóruns</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  Discussões e Materiais
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="discussion" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="discussion" className="flex items-center gap-2 text-xs sm:text-sm flex-1 sm:flex-initial">
                <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Fórum de </span>Discussão
              </TabsTrigger>
              <TabsTrigger value="materials" className="flex items-center gap-2 text-xs sm:text-sm flex-1 sm:flex-initial">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Fórum de </span>Materiais
              </TabsTrigger>
            </TabsList>

            <Button
              onClick={() => router.push('/forum/new?type=discussion')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full sm:w-auto"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Postagem
            </Button>
          </div>

          <TabsContent value="discussion" className="space-y-4">
            {loading ? (
              <div className="text-center py-12">Carregando...</div>
            ) : discussionPosts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Nenhuma discussão criada ainda
                  </p>
                  <Button onClick={() => router.push('/forum/new?type=discussion')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Discussão
                  </Button>
                </CardContent>
              </Card>
            ) : (
              discussionPosts.map(renderPostCard)
            )}
          </TabsContent>

          <TabsContent value="materials" className="space-y-4">
            {userRole === 'admin' && (
              <Button
                onClick={() => router.push('/forum/new?type=materials')}
                variant="outline"
                className="w-full mb-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Postar Novo Material (Admin)
              </Button>
            )}

            {loading ? (
              <div className="text-center py-12">Carregando...</div>
            ) : materialsPosts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum material disponível ainda
                  </p>
                </CardContent>
              </Card>
            ) : (
              materialsPosts.map(renderPostCard)
            )}
          </TabsContent>
        </Tabs>
      </main>

      <ToastAlert
        open={toastOpen}
        onOpenChange={setToastOpen}
        message={toastMessage}
        type="error"
      />
    </div>
  )
}
