'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ToastAlert } from '@/components/ui/toast-alert'
import { AppShell, useAppShell } from '@/components/app-shell'
import { Plus, MessageSquare, FileText, Tag, User, Calendar, Edit2, Lock, Search, Crown, ChevronDown, Settings2, X, Bookmark } from 'lucide-react'
import { ForumPost, ForumType, ForumTopic, AccountType, ForumPostCreationFreezeMode } from '@/lib/types'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

function ForumContent() {
  const router = useRouter()
  const { user, isAdmin, accountType: contextAccountType, secondaryRole: contextSecondaryRole } = useAppShell()

  const [discussionPosts, setDiscussionPosts] = useState<ForumPost[]>([])
  const [materialsPosts, setMaterialsPosts] = useState<ForumPost[]>([])
  const [discussionTopics, setDiscussionTopics] = useState<ForumTopic[]>([])
  const [materialsTopics, setMaterialsTopics] = useState<ForumTopic[]>([])
  const [loading, setLoading] = useState(true)
  const userRole = isAdmin ? 'admin' : 'user'
  const accountType = contextAccountType as AccountType
  const secondaryRole = contextSecondaryRole

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
  const [activeTab, setActiveTab] = useState<'discussion' | 'materials'>('discussion')

  useEffect(() => {
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
      setLoadedPostCreationFreezeMode(data.settings?.postCreationFreezeMode || postCreationFreezeMode)
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
      const discussionTopicsRes = await fetch('/api/forum/topics?type=discussion')
      if (discussionTopicsRes.ok) {
        const data = await discussionTopicsRes.json()
        setDiscussionTopics(data.topics || [])
      }

      const materialsTopicsRes = await fetch('/api/forum/topics?type=materials')
      if (materialsTopicsRes.ok) {
        const data = await materialsTopicsRes.json()
        setMaterialsTopics(data.topics || [])
      }

      const discussionRes = await fetch('/api/forum/posts?type=discussion')
      if (discussionRes.ok) {
        const data = await discussionRes.json()
        setDiscussionPosts(data.posts || [])
      }

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

      const res = await fetch(`/api/forum/search?q=${encodeURIComponent(searchQuery)}&type=discussion`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.posts || [])
      }

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

  const isAdminLocal = userRole === 'admin'
  const isMonitor = secondaryRole === 'monitor'
  const isBlocked = isPostCreationBlocked({
    freezeMode: postCreationFreezeMode,
    isAdmin: isAdminLocal,
    isMonitor,
    accountType: (accountType || 'gratuito') as 'gratuito' | 'trial' | 'premium',
  })

  const freezeModeLabels: Record<ForumPostCreationFreezeMode, string> = {
    off: 'Nao paralisado',
    pause_all: 'Paralisado para todos',
    pause_all_except_admins: 'Paralisado (exceto admins)',
    pause_all_except_common_users: 'Paralisado (exceto usuarios comuns)',
    pause_only_free_common: 'Paralisado (apenas gratuito comum)',
    pause_only_free_common_and_monitors: 'Paralisado (gratuito comum + monitores)',
    pause_only_free_common_and_premium_common: 'Paralisado (gratuito comum + premium comum)',
  }

  const freezeOptions: Array<{
    mode: ForumPostCreationFreezeMode
    title: string
    description: string
  }> = [
    { mode: 'off', title: 'Nao paralisar', description: 'Permite novos posts normalmente.' },
    { mode: 'pause_all', title: 'Paralisar para todos', description: 'Bloqueia inclusive administradores, monitores, gratuitos, trial e premium.' },
    { mode: 'pause_all_except_admins', title: 'Menos Administradores', description: 'Somente administradores conseguem postar.' },
    { mode: 'pause_all_except_common_users', title: 'Menos usuarios comuns', description: 'Usuarios comuns (gratuito/trial/premium) conseguem postar.' },
    { mode: 'pause_only_free_common', title: 'Apenas Gratuitos comuns', description: 'Bloqueia usuarios comuns gratuitos.' },
    { mode: 'pause_only_free_common_and_monitors', title: 'Gratuitos + Monitores', description: 'Bloqueia monitores e usuarios comuns gratuitos.' },
    { mode: 'pause_only_free_common_and_premium_common', title: 'Gratuitos + Premium', description: 'Bloqueia gratuitos e premium comuns.' },
  ]

  const hasUnsavedForumSettings = postCreationFreezeMode !== loadedPostCreationFreezeMode

  function handleNewPost() {
    if (isBlocked) {
      setToastMessage('Envio de novos posts esta temporariamente paralisado')
      setToastType('info')
      setToastOpen(true)
      return
    }
    router.push(`/forum/new?type=${activeTab}`)
  }

  function renderPostCard(post: ForumPost) {
    const isPremiumBlocked = post.premiumOnly && accountType === 'gratuito' && userRole !== 'admin'

    return (
      <div
        key={String(post._id)}
        onClick={() => handlePostClick(post)}
        className={cn(
          'p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-all duration-200 group',
          isPremiumBlocked ? 'cursor-default opacity-50' : 'cursor-pointer hover:shadow-sm'
        )}
      >
        {/* Title row */}
        <div className="flex items-start gap-2 mb-1.5">
          <h3 className="text-sm font-medium flex-1 min-w-0 truncate">{post.title}</h3>
          <div className="flex items-center gap-1 shrink-0">
            {post.premiumOnly && (
              <span className="text-[10px] font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Crown className="h-2.5 w-2.5" />
                Premium
              </span>
            )}
            {post.closed && (
              <span className="text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Lock className="h-2.5 w-2.5" />
                Fechado
              </span>
            )}
            {post.edited && (
              <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Edit2 className="h-2.5 w-2.5" />
              </span>
            )}
          </div>
        </div>

        {/* Preview content */}
        <div
          className="text-xs text-muted-foreground line-clamp-2 mb-2"
          dangerouslySetInnerHTML={{
            __html: post.content.length > 150
              ? post.content.substring(0, 150).replace(/<[^>]*$/, '') + '...'
              : post.content
          }}
        />

        {/* Meta row */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {post.authorName}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(post.createdAt)}
          </span>
          {post.attachments.length > 0 && (
            <span>📎 {post.attachments.length}</span>
          )}
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.tags.map((tag, idx) => (
              <span key={idx} className="text-[10px] bg-muted/60 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <Tag className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {post.closed && post.closedByName && (
          <p className="text-[10px] text-red-600 dark:text-red-400 mt-2">
            Fechado por {post.closedByName}
          </p>
        )}
      </div>
    )
  }

  function renderTopicGroup(posts: ForumPost[], topics: ForumTopic[]) {
    const postsByTopic: { [key: string]: ForumPost[] } = {}
    const postsWithoutTopic: ForumPost[] = []

    posts.forEach(post => {
      if (post.topicId) {
        if (!postsByTopic[post.topicId]) postsByTopic[post.topicId] = []
        postsByTopic[post.topicId].push(post)
      } else {
        postsWithoutTopic.push(post)
      }
    })

    if (posts.length === 0) {
      return (
        <div className="text-center py-16 rounded-xl bg-muted/20 border border-border/40">
          <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground mb-4">Nenhum post criado ainda</p>
          {!isBlocked && (
            <Button size="sm" variant="outline" onClick={handleNewPost} className="text-xs h-8">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Criar Primeiro Post
            </Button>
          )}
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {topics.map((topic) => {
          const topicPosts = postsByTopic[String(topic._id)] || []
          if (topicPosts.length === 0) return null

          const isOpen = expandedTopics.has(String(topic._id))

          return (
            <Collapsible
              key={String(topic._id)}
              open={isOpen}
              onOpenChange={(open: boolean) => {
                const next = new Set(expandedTopics)
                if (open) next.add(String(topic._id))
                else next.delete(String(topic._id))
                setExpandedTopics(next)
              }}
            >
              <CollapsibleTrigger className="w-full">
                <div className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/50 transition-all">
                  <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform shrink-0', isOpen && 'rotate-180')} />
                  <span className="text-lg shrink-0">{topic.icon}</span>
                  <div className="flex-1 min-w-0 text-left">
                    <h3 className="text-sm font-medium truncate">{topic.name}</h3>
                    {topic.description && (
                      <p className="text-[11px] text-muted-foreground truncate">{topic.description}</p>
                    )}
                  </div>
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: topic.color }}
                  />
                  <span className="text-[10px] font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full shrink-0">
                    {topicPosts.length}
                  </span>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-1.5 mt-2 pl-4 border-l-2 border-border/40">
                  {topicPosts.map(renderPostCard)}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )
        })}

        {postsWithoutTopic.length > 0 && (
          <Collapsible
            open={expandedTopics.has('no-topic')}
            onOpenChange={(open: boolean) => {
              const next = new Set(expandedTopics)
              if (open) next.add('no-topic')
              else next.delete('no-topic')
              setExpandedTopics(next)
            }}
          >
            <CollapsibleTrigger className="w-full">
              <div className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/20 hover:bg-muted/40 border border-border/40 transition-all">
                <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform shrink-0', expandedTopics.has('no-topic') && 'rotate-180')} />
                <span className="text-lg shrink-0">📌</span>
                <div className="flex-1 text-left">
                  <h3 className="text-sm font-medium">Sem Topico</h3>
                  <p className="text-[11px] text-muted-foreground">Posts nao categorizados</p>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full shrink-0">
                  {postsWithoutTopic.length}
                </span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-1.5 mt-2 pl-4 border-l-2 border-border/40">
                {postsWithoutTopic.map(renderPostCard)}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">

      {/* ====== SECTION 1: Forum Header ====== */}
      <section className="mb-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Foruns</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Discussoes e materiais da comunidade</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {userRole === 'admin' && (
              <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5"
                onClick={() => router.push('/admin/forum-topics')}>
                <Settings2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Topicos</span>
              </Button>
            )}
            <Button size="sm" className="text-xs h-8 gap-1.5 bg-[#468152] hover:bg-[#3a6d45]"
              onClick={handleNewPost}>
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Nova Postagem</span>
            </Button>
          </div>
        </div>
      </section>

      {/* ====== SECTION 2: Admin Settings (if admin) ====== */}
      {userRole === 'admin' && (
        <section className="mb-8">
          <Collapsible open={adminSettingsOpen} onOpenChange={setAdminSettingsOpen}>
            <CollapsibleTrigger className="w-full">
              <div className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/40 transition-all">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Controle de postagens</span>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold',
                    postCreationFreezeMode === 'off'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                  )}>
                    {freezeModeLabels[postCreationFreezeMode]}
                  </span>
                </div>
                <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', adminSettingsOpen && 'rotate-180')} />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 p-4 rounded-xl border border-border/50 bg-card space-y-3">
                <div className="space-y-1.5">
                  {freezeOptions.map((opt) => {
                    const selected = postCreationFreezeMode === opt.mode
                    return (
                      <button
                        key={opt.mode}
                        type="button"
                        onClick={() => setPostCreationFreezeMode(opt.mode)}
                        className={cn(
                          'w-full text-left flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border transition-all text-sm',
                          selected
                            ? 'bg-[#468152]/10 border-[#468152]/30 dark:bg-[#468152]/20 dark:border-[#468152]/40'
                            : 'bg-transparent border-border/40 hover:bg-muted/40'
                        )}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium">{opt.title}</p>
                          <p className="text-[10px] text-muted-foreground">{opt.description}</p>
                        </div>
                        <div className={cn(
                          'w-3 h-3 rounded-full border-2 shrink-0 transition-all',
                          selected ? 'bg-[#468152] border-[#468152]' : 'border-muted-foreground/30'
                        )} />
                      </button>
                    )
                  })}
                </div>

                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="text-xs h-7 bg-[#468152] hover:bg-[#3a6d45]"
                    onClick={saveForumSettings}
                    disabled={savingForumSettings || !hasUnsavedForumSettings}>
                    {savingForumSettings ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs h-7"
                    onClick={loadForumSettings}
                    disabled={savingForumSettings}>
                    Desfazer
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </section>
      )}

      {/* Freeze warning */}
      {isBlocked && (
        <section className="mb-6">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
            <Lock className="h-4 w-4 shrink-0" />
            <span>Envio de novos posts esta temporariamente paralisado.</span>
          </div>
        </section>
      )}

      {/* ====== SECTION 3: Search ====== */}
      <section className="mb-8">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar posts ou topicos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch()
                if (e.key === 'Escape') {
                  setShowSearch(false)
                  setSearchQuery('')
                }
              }}
              className="pl-9 h-9 text-sm bg-muted/30 border-border/50 focus:bg-card"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setShowSearch(false); setSearchResults([]); setSearchTopics([]) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          <Button size="sm" variant="outline" className="h-9 text-xs" onClick={handleSearch}>
            Buscar
          </Button>
        </div>

        {/* Search Results */}
        {showSearch && (
          <div className="mt-4 space-y-4 p-4 rounded-xl border border-border/50 bg-card animate-fade-in">
            {searchTopics.length > 0 && (
              <div>
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Topicos ({searchTopics.length})</h3>
                <div className="space-y-1.5">
                  {searchTopics.map((topic) => (
                    <div
                      key={String(topic._id)}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => {
                        const next = new Set(expandedTopics)
                        next.add(String(topic._id))
                        setExpandedTopics(next)
                        setShowSearch(false)
                        setSearchQuery('')
                      }}
                    >
                      <span className="text-base">{topic.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{topic.name}</p>
                        {topic.description && (
                          <p className="text-[11px] text-muted-foreground truncate">{topic.description}</p>
                        )}
                      </div>
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: topic.color }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchResults.length > 0 && (
              <div>
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Posts ({searchResults.length})</h3>
                <div className="space-y-1.5 max-h-80 overflow-y-auto">
                  {searchResults.map(renderPostCard)}
                </div>
              </div>
            )}

            {searchQuery.trim() && searchResults.length === 0 && searchTopics.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Nenhum resultado para "{searchQuery}"</p>
                <p className="text-xs text-muted-foreground mt-1">Tente outras palavras-chave</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ====== SECTION 4: Tabs ====== */}
      <section className="mb-6">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/30 border border-border/50 w-fit">
          <button
            onClick={() => setActiveTab('discussion')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === 'discussion'
                ? 'bg-card shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Discussao
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === 'materials'
                ? 'bg-card shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Bookmark className="h-3.5 w-3.5" />
            Materiais
          </button>
        </div>
      </section>

      {/* ====== SECTION 5: Post List ====== */}
      <section className="mb-10">
        {loading ? (
          <div className="text-center py-16 text-sm text-muted-foreground">Carregando...</div>
        ) : activeTab === 'discussion' ? (
          renderTopicGroup(discussionPosts, discussionTopics)
        ) : (
          <>
            {userRole === 'admin' && materialsPosts.length > 0 && (
              <div className="mb-4">
                <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5" onClick={handleNewPost}>
                  <Plus className="h-3.5 w-3.5" />
                  Novo Material
                </Button>
              </div>
            )}
            {renderTopicGroup(materialsPosts, materialsTopics)}
          </>
        )}
      </section>

      {/* ====== Premium Modal ====== */}
      <Dialog open={showPremiumModal} onOpenChange={setShowPremiumModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-3">
              <Crown className="h-7 w-7 text-white" />
            </div>
            <DialogTitle className="text-center text-xl">Conteudo Premium</DialogTitle>
            <DialogDescription className="text-center text-sm">
              Este material e exclusivo para usuarios Premium
            </DialogDescription>
          </DialogHeader>

          {premiumBlockedPost && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted/50 rounded-xl">
                <h3 className="text-sm font-medium mb-1">{premiumBlockedPost.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {premiumBlockedPost.content.replace(/<[^>]*>/g, '')}
                </p>
              </div>

              <p className="text-xs text-yellow-800 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-950/50 px-3 py-2 rounded-lg">
                Faca upgrade para Premium e acesse conteudos exclusivos, materiais avancados e muito mais!
              </p>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPremiumModal(false)} className="flex-1 text-xs">
                  Fechar
                </Button>
                <Button
                  onClick={() => { router.push('/buy'); setShowPremiumModal(false) }}
                  className="flex-1 text-xs bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                >
                  <Crown className="h-3.5 w-3.5 mr-1.5" />
                  Premium
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
}

export default function ForumPage() {
  return (
    <AppShell headerTitle="Foruns" headerSubtitle="Discussoes e Materiais">
      <ForumContent />
    </AppShell>
  )
}
