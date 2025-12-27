'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ThemeToggle } from '@/components/theme-toggle'
import { ToastAlert } from '@/components/ui/toast-alert'
import { BanChecker } from '@/components/ban-checker'
import { ArrowLeft, Plus, MessageSquare, FileText, Tag, User, Calendar, Edit2, Lock, Search, Crown, ChevronDown } from 'lucide-react'
import { ForumPost, ForumType, ForumTopic, AccountType, ForumPostCreationFreezeMode } from '@/lib/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

export default function ForumPage() {
  const router = useRouter()
  const [discussionPosts, setDiscussionPosts] = useState<ForumPost[]>([])
  const [materialsPosts, setMaterialsPosts] = useState<ForumPost[]>([])
  const [discussionTopics, setDiscussionTopics] = useState<ForumTopic[]>([])
  const [materialsTopics, setMaterialsTopics] = useState<ForumTopic[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user')
  const [accountType, setAccountType] = useState<AccountType>('gratuito')
  const [secondaryRole, setSecondaryRole] = useState<string | undefined>(undefined)
  const [postCreationFreezeMode, setPostCreationFreezeMode] = useState<ForumPostCreationFreezeMode>('off')
  const [loadedPostCreationFreezeMode, setLoadedPostCreationFreezeMode] = useState<ForumPostCreationFreezeMode>('off')
  const [savingForumSettings, setSavingForumSettings] = useState(false)
  const [adminSettingsOpen, setAdminSettingsOpen] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('error')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ForumPost[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [premiumBlockedPost, setPremiumBlockedPost] = useState<ForumPost | null>(null)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set())
  const [searchTopics, setSearchTopics] = useState<ForumTopic[]>([])

  useEffect(() => {
    loadUserRole()
    loadForumSettings()
    loadPosts()
  }, [])

  function isPostCreationBlocked(params: {
    freezeMode: ForumPostCreationFreezeMode
    isAdmin: boolean
    isMonitor: boolean
    accountType: 'gratuito' | 'trial' | 'premium'
  }) {
    const { freezeMode, isAdmin, isMonitor, accountType } = params
    const isCommonUser = !isAdmin && !isMonitor

    switch (freezeMode) {
      case 'off':
        return false
      case 'pause_all':
        return true
      case 'pause_all_except_admins':
        return !isAdmin
      case 'pause_all_except_common_users':
        return !isCommonUser
      case 'pause_only_free_common':
        return isCommonUser && accountType === 'gratuito'
      case 'pause_only_free_common_and_monitors':
        return isMonitor || (isCommonUser && accountType === 'gratuito')
      case 'pause_only_free_common_and_premium_common':
        return isCommonUser && (accountType === 'gratuito' || accountType === 'premium')
      default:
        return false
    }
  }

  async function loadUserRole() {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUserRole(data.user?.role || 'user')
        setAccountType(data.user?.accountType || 'gratuito')
        setSecondaryRole(data.user?.secondaryRole)
      }
    } catch (error) {
      console.error('Erro ao carregar role:', error)
    }
  }

  async function loadForumSettings() {
    try {
      const res = await fetch('/api/forum/settings')
      if (res.ok) {
        const data = await res.json()
        const mode = (data.settings?.postCreationFreezeMode || 'off') as ForumPostCreationFreezeMode
        setPostCreationFreezeMode(mode)
        setLoadedPostCreationFreezeMode(mode)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do fórum:', error)
    }
  }

  async function saveForumSettings() {
    if (userRole !== 'admin') return

    setSavingForumSettings(true)
    try {
      const res = await fetch('/api/forum/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postCreationFreezeMode }),
      })

      const data = await res.json()

      if (!res.ok) {
        setToastMessage(data.error || 'Erro ao salvar configurações do fórum')
        setToastType('error')
        setToastOpen(true)
        return
      }

      setToastMessage('Configurações do fórum salvas com sucesso!')
      setToastType('success')
      setToastOpen(true)
      setPostCreationFreezeMode(data.settings?.postCreationFreezeMode || postCreationFreezeMode)
    } catch (error) {
      setToastMessage('Erro ao salvar configurações do fórum')
      setToastType('error')
      setToastOpen(true)
    } finally {
      setSavingForumSettings(false)
    }
  }

  async function loadPosts() {
    try {
      // Carregar tópicos de discussão
      const discussionTopicsRes = await fetch('/api/forum/topics?type=discussion')
      if (discussionTopicsRes.ok) {
        const data = await discussionTopicsRes.json()
        setDiscussionTopics(data.topics || [])
      }

      // Carregar tópicos de materiais
      const materialsTopicsRes = await fetch('/api/forum/topics?type=materials')
      if (materialsTopicsRes.ok) {
        const data = await materialsTopicsRes.json()
        setMaterialsTopics(data.topics || [])
      }

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

  async function handleSearch() {
    if (!searchQuery.trim()) {
      setShowSearch(false)
      return
    }

    try {
      const query = searchQuery.toLowerCase()
      
      // Buscar posts
      const res = await fetch(`/api/forum/search?q=${encodeURIComponent(searchQuery)}&type=discussion`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.posts || [])
      }

      // Buscar tópicos por nome/descrição
      const allTopics = [...discussionTopics, ...materialsTopics]
      const matchedTopics = allTopics.filter(topic =>
        topic.name.toLowerCase().includes(query) ||
        topic.description?.toLowerCase().includes(query)
      )
      setSearchTopics(matchedTopics)
      
      setShowSearch(true)
    } catch (error) {
      console.error('Erro ao buscar:', error)
    }
  }

  function handlePostClick(post: ForumPost) {
    // Verificar se é material premium bloqueado (não bloqueia admin)
    if (post.premiumOnly && accountType === 'gratuito' && userRole !== 'admin') {
      setPremiumBlockedPost(post)
      setShowPremiumModal(true)
      return
    }
    router.push(`/forum/post/${String(post._id)}`)
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

  function renderPostsByTopics(posts: ForumPost[], topics: ForumTopic[]) {
    // Agrupar posts por tópico
    const postsByTopic: { [key: string]: ForumPost[] } = {}
    const postsWithoutTopic: ForumPost[] = []

    posts.forEach(post => {
      if (post.topicId) {
        if (!postsByTopic[post.topicId]) {
          postsByTopic[post.topicId] = []
        }
        postsByTopic[post.topicId].push(post)
      } else {
        postsWithoutTopic.push(post)
      }
    })

    return (
      <div className="space-y-2">
        {/* Posts com tópicos */}
        {topics.map((topic) => {
          const topicPosts = postsByTopic[String(topic._id)] || []
          if (topicPosts.length === 0) return null

          const isOpen = expandedTopics.has(String(topic._id))

          return (
            <Collapsible
              key={String(topic._id)}
              open={isOpen}
              onOpenChange={(open: boolean) => {
                const newExpanded = new Set(expandedTopics)
                if (open) {
                  newExpanded.add(String(topic._id))
                } else {
                  newExpanded.delete(String(topic._id))
                }
                setExpandedTopics(newExpanded)
              }}
            >
              <CollapsibleTrigger className="w-full">
                <div className="w-full flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-xl bg-white/15 dark:bg-white/8 hover:bg-white/25 dark:hover:bg-white/12 border border-white/20 dark:border-white/10 transition-all hover:shadow-lg">
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition-transform shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                  <span className="text-xl shrink-0">{topic.icon}</span>
                  <div className="flex-1 min-w-0 text-left">
                    <h3 className="font-semibold text-sm text-foreground truncate">{topic.name}</h3>
                    {topic.description && (
                      <p className="text-xs text-muted-foreground truncate">{topic.description}</p>
                    )}
                  </div>
                  <div
                    className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: topic.color }}
                    title={`Cor: ${topic.color}`}
                  />
                  <span className="text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 px-2 py-1 rounded-full shrink-0 shadow-md">
                    {topicPosts.length}
                  </span>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-2 mt-3 pl-4 border-l-2 border-white/20 dark:border-white/10">
                  {topicPosts.map(renderPostCard)}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )
        })}

        {/* Posts sem tópico */}
        {postsWithoutTopic.length > 0 && (
          <Collapsible
            open={expandedTopics.has('no-topic')}
            onOpenChange={(open: boolean) => {
              const newExpanded = new Set(expandedTopics)
              if (open) {
                newExpanded.add('no-topic')
              } else {
                newExpanded.delete('no-topic')
              }
              setExpandedTopics(newExpanded)
            }}
          >
            <CollapsibleTrigger className="w-full">
              <div className="w-full flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-xl bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 border border-white/20 dark:border-white/10 transition-all hover:shadow-lg">
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform shrink-0 ${
                    expandedTopics.has('no-topic') ? 'rotate-180' : ''
                  }`}
                />
                <span className="text-xl shrink-0">📌</span>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-sm text-foreground">Sem Tópico</h3>
                  <p className="text-xs text-muted-foreground">Posts não categorizados</p>
                </div>
                <span className="text-xs font-bold text-white bg-gradient-to-r from-slate-600 to-slate-700 px-2 py-1 rounded-full shrink-0 shadow-md">
                  {postsWithoutTopic.length}
                </span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-2 mt-3 pl-4 border-l-2 border-white/20 dark:border-white/10">
                {postsWithoutTopic.map(renderPostCard)}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Sem posts */}
        {posts.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">Nenhum post criado ainda</p>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  function renderPostCard(post: ForumPost) {
    const isPremiumBlocked = post.premiumOnly && accountType === 'gratuito' && userRole !== 'admin'

    return (
      <Card
        key={String(post._id)}
        className={`backdrop-blur-xl bg-white/15 dark:bg-white/8 border-white/20 dark:border-white/10 hover:bg-white/25 dark:hover:bg-white/12 transition-all hover:shadow-lg ${isPremiumBlocked ? 'cursor-default opacity-60' : 'cursor-pointer'}`}
        onClick={() => handlePostClick(post)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2 flex-wrap">
                <span className="truncate">{post.title}</span>
                {post.premiumOnly && (
                  <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded flex items-center gap-1 shrink-0">
                    <Crown className="h-3 w-3" />
                    Premium
                  </span>
                )}
                {post.closed && (
                  <span className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded flex items-center gap-1 shrink-0">
                    <Lock className="h-3 w-3" />
                    Fechado
                  </span>
                )}
                {post.edited && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded flex items-center gap-1 shrink-0">
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
    (() => {
      const isAdmin = userRole === 'admin'
      const isMonitor = secondaryRole === 'monitor'
      const isBlocked = isPostCreationBlocked({
        freezeMode: postCreationFreezeMode,
        isAdmin,
        isMonitor,
        accountType: (accountType || 'gratuito') as 'gratuito' | 'trial' | 'premium',
      })

      const freezeModeLabels: Record<ForumPostCreationFreezeMode, string> = {
        off: 'Não paralisado',
        pause_all: 'Paralisado para todos',
        pause_all_except_admins: 'Paralisado (exceto admins)',
        pause_all_except_common_users: 'Paralisado (exceto usuários comuns)',
        pause_only_free_common: 'Paralisado (apenas gratuito comum)',
        pause_only_free_common_and_monitors: 'Paralisado (gratuito comum + monitores)',
        pause_only_free_common_and_premium_common: 'Paralisado (gratuito comum + premium comum)',
      }

      const freezeOptions: Array<{
        mode: ForumPostCreationFreezeMode
        title: string
        description: string
      }> = [
        {
          mode: 'off',
          title: 'Não paralisar',
          description: 'Permite novos posts normalmente.',
        },
        {
          mode: 'pause_all',
          title: 'Paralisar para todos (padrão)',
          description: 'Bloqueia inclusive administradores, monitores, gratuitos, trial e premium.',
        },
        {
          mode: 'pause_all_except_admins',
          title: 'Paralisar para todos, menos Administradores',
          description: 'Somente administradores conseguem postar.',
        },
        {
          mode: 'pause_all_except_common_users',
          title: 'Paralisar para todos, menos usuários comuns',
          description: 'Usuários comuns (gratuito/trial/premium) conseguem postar; admins e monitores ficam bloqueados.',
        },
        {
          mode: 'pause_only_free_common',
          title: 'Paralisar apenas usuários Gratuitos (comuns)',
          description: 'Bloqueia usuários comuns gratuitos; libera trial/premium e também admins/monitores.',
        },
        {
          mode: 'pause_only_free_common_and_monitors',
          title: 'Paralisar usuários Gratuitos (comuns) e Monitores',
          description: 'Bloqueia monitores e também usuários comuns gratuitos.',
        },
        {
          mode: 'pause_only_free_common_and_premium_common',
          title: 'Paralisar usuários Gratuitos (comuns) e Premium',
          description: 'Bloqueia usuários comuns gratuitos e usuários comuns premium; libera trial comum e admins/monitores.',
        },
      ]

      const hasUnsavedForumSettings = postCreationFreezeMode !== loadedPostCreationFreezeMode

      const freezeModeImpact: Record<ForumPostCreationFreezeMode, string> = {
        off: 'Efeito: ninguém é bloqueado para criar posts.',
        pause_all: 'Efeito: todos são bloqueados (inclui admin, monitor, gratuito, trial e premium).',
        pause_all_except_admins: 'Efeito: somente administradores podem criar posts.',
        pause_all_except_common_users: 'Efeito: somente usuários comuns podem criar posts (gratuito/trial/premium).',
        pause_only_free_common: 'Efeito: bloqueia apenas usuário comum gratuito; libera trial/premium e admin/monitor.',
        pause_only_free_common_and_monitors: 'Efeito: bloqueia monitores e também usuário comum gratuito.',
        pause_only_free_common_and_premium_common: 'Efeito: bloqueia usuário comum gratuito e usuário comum premium; libera trial e admin/monitor.',
      }

      return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <BanChecker />

      {/* Liquid Glass Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/10 dark:bg-black/10 border-b border-white/20 dark:border-white/10 shadow-lg">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/')}
                className="shrink-0 h-8 w-8 sm:h-9 sm:w-9 hover:bg-white/20 dark:hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Fóruns</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  Discussões e Materiais
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {userRole === 'admin' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/admin/forum-topics')}
                  className="hidden sm:flex text-xs bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10 backdrop-blur-sm transition-all"
                  title="Gerenciar Tópicos"
                >
                  ⚙️ Tópicos
                </Button>
              )}
              {userRole === 'admin' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push('/admin/forum-topics')}
                  className="sm:hidden h-8 w-8 hover:bg-white/20 dark:hover:bg-white/10 transition-colors"
                  title="Gerenciar Tópicos"
                >
                  ⚙️
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {userRole === 'admin' && (
          <Card className="mb-6 backdrop-blur-xl bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base">Envio de novos posts</CardTitle>
                  <CardDescription>
                    Status atual: {freezeModeLabels[postCreationFreezeMode]}
                    {hasUnsavedForumSettings ? ' (alterações pendentes)' : ''}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAdminSettingsOpen(!adminSettingsOpen)}
                >
                  {adminSettingsOpen ? 'Fechar' : 'Configurar'}
                </Button>
              </div>
            </CardHeader>
            {adminSettingsOpen && (
              <CardContent className="space-y-3">
                <div className="grid gap-2">
                  {freezeOptions.map((opt) => {
                    const selected = postCreationFreezeMode === opt.mode
                    return (
                      <button
                        key={opt.mode}
                        type="button"
                        aria-pressed={selected}
                        className={`w-full text-left group flex items-start justify-between gap-4 p-4 rounded-2xl border backdrop-blur-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                          selected
                            ? 'bg-white/25 dark:bg-white/12 border-white/35 dark:border-white/25 shadow-lg'
                            : 'bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10 hover:shadow-md'
                        }`}
                        onClick={() => setPostCreationFreezeMode(opt.mode)}
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-semibold leading-snug">{opt.title}</div>
                          <div className="text-xs text-muted-foreground leading-snug mt-1">{opt.description}</div>
                        </div>
                        <div
                          className={`shrink-0 mt-0.5 h-6 px-2 rounded-full text-xs font-semibold border transition-colors ${
                            selected
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-white/20'
                              : 'bg-white/10 dark:bg-white/5 text-muted-foreground border-white/20 dark:border-white/10 group-hover:text-foreground'
                          }`}
                        >
                          {selected ? 'Selecionado' : 'Selecionar'}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="text-xs text-muted-foreground px-1">
                  {freezeModeImpact[postCreationFreezeMode]}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    onClick={saveForumSettings}
                    disabled={savingForumSettings || !hasUnsavedForumSettings}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {savingForumSettings ? 'Salvando...' : 'Salvar alterações'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={loadForumSettings}
                    disabled={savingForumSettings}
                  >
                    Desfazer
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {isBlocked && (
          <div className="mb-6 p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 text-sm text-red-800 dark:text-red-200">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>Envio de novos posts está temporariamente paralisado</span>
            </div>
          </div>
        )}

        {/* Busca - Liquid Glass */}
        {showSearch && (
          <div className="mb-8 space-y-4 p-4 sm:p-6 backdrop-blur-xl bg-white/10 dark:bg-white/5 rounded-2xl border border-white/20 dark:border-white/10 shadow-lg">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <span className="text-lg">🔍</span>
                Buscar Posts
              </h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Buscar por tags ou palavras-chave..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch()
                  }}
                  autoFocus
                  className="flex-1 bg-white/20 dark:bg-white/10 border-white/30 dark:border-white/20 backdrop-blur-sm focus:bg-white/30 dark:focus:bg-white/15 transition-all"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSearch} 
                    variant="default"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full sm:w-auto shadow-lg hover:shadow-xl transition-all"
                  >
                    <Search className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Buscar</span>
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowSearch(false)
                      setSearchQuery('')
                      setSearchResults([])
                    }} 
                    variant="outline"
                    className="w-full sm:w-auto bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10 backdrop-blur-sm transition-all"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>

            {(searchResults.length > 0 || searchTopics.length > 0) && (
              <div className="space-y-4 pt-4 border-t border-white/20 dark:border-white/10">
                {/* Tópicos encontrados */}
                {searchTopics.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      🏷️ Tópicos ({searchTopics.length})
                    </p>
                    <div className="space-y-2">
                      {searchTopics.map((topic) => (
                        <div
                          key={String(topic._id)}
                          className="p-3 rounded-xl backdrop-blur-sm bg-white/15 dark:bg-white/8 border border-white/20 dark:border-white/10 hover:bg-white/25 dark:hover:bg-white/12 transition-all cursor-pointer shadow-sm hover:shadow-md"
                          onClick={() => {
                            const newExpanded = new Set(expandedTopics)
                            newExpanded.add(String(topic._id))
                            setExpandedTopics(newExpanded)
                            setShowSearch(false)
                            setSearchQuery('')
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{topic.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{topic.name}</p>
                              {topic.description && (
                                <p className="text-xs text-muted-foreground truncate">{topic.description}</p>
                              )}
                            </div>
                            <div
                              className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                              style={{ backgroundColor: topic.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Posts encontrados */}
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                      📄 Posts ({searchResults.length})
                    </p>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {searchResults.map(renderPostCard)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {searchQuery.trim() && searchResults.length === 0 && searchTopics.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Nenhum resultado encontrado para "{searchQuery}"</p>
                <p className="text-xs mt-2">Tente buscar por outras tags, palavras-chave ou nomes de tópicos</p>
              </div>
            )}
          </div>
        )}

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

            <div className="flex gap-2 flex-col sm:flex-row">
              <Button
                onClick={() => setShowSearch(!showSearch)}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
              <Button
                onClick={() => {
                  if (isBlocked) {
                    setToastMessage('Envio de novos posts está temporariamente paralisado')
                    setToastType('info')
                    setToastOpen(true)
                    return
                  }
                  router.push('/forum/new?type=discussion')
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full sm:w-auto"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Postagem
              </Button>
            </div>
          </div>

          <TabsContent value="discussion" className="space-y-4">
            {loading ? (
              <div className="text-center py-12">Carregando...</div>
            ) : (
              <>
                {renderPostsByTopics(discussionPosts, discussionTopics)}
                {discussionPosts.length === 0 && (
                  <Button 
                    onClick={() => {
                      if (isBlocked) {
                        setToastMessage('Envio de novos posts está temporariamente paralisado')
                        setToastType('info')
                        setToastOpen(true)
                        return
                      }
                      router.push('/forum/new?type=discussion')
                    }}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Discussão
                  </Button>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="materials" className="space-y-4">
            {userRole === 'admin' && (
              <Button
                onClick={() => {
                  if (isBlocked) {
                    setToastMessage('Envio de novos posts está temporariamente paralisado')
                    setToastType('info')
                    setToastOpen(true)
                    return
                  }
                  router.push('/forum/new?type=materials')
                }}
                className="w-full mb-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Postar Novo Material
              </Button>
            )}

            {loading ? (
              <div className="text-center py-12">Carregando...</div>
            ) : (
              renderPostsByTopics(materialsPosts, materialsTopics)
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Modal de Material Premium Bloqueado */}
      <Dialog open={showPremiumModal} onOpenChange={setShowPremiumModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              Conteúdo Premium
            </DialogTitle>
            <DialogDescription>
              Este material é exclusivo para usuários Premium
            </DialogDescription>
          </DialogHeader>

          {premiumBlockedPost && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold text-sm mb-2">{premiumBlockedPost.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {premiumBlockedPost.content.replace(/<[^>]*>/g, '')}
                </p>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-900 dark:text-yellow-100">
                  💡 Faça upgrade para Premium e acesse conteúdos exclusivos, materiais avançados e muito mais!
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPremiumModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    router.push('/buy')
                    setShowPremiumModal(false)
                  }}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Ir para Premium
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ToastAlert
        open={toastOpen}
        onOpenChange={setToastOpen}
        message={toastMessage}
        type={toastType}
      />
    </div>
      )
    })()
  )
}
