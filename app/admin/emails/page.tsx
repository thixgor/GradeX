'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    AlertCircle,
    ArrowLeft,
    BarChart3,
    BookOpen,
    Check,
    Copy,
    Eye,
    FileText,
    GraduationCap,
    ImageIcon,
    Italic,
    Layers,
    Link2,
    List,
    Loader2,
    Mail,
    Paperclip,
    Plus,
    Quote,
    Search,
    Send,
    Sparkles,
    Target,
    Trash2,
    Type,
    Users,
    Wand2,
    X,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { BanChecker } from '@/components/ban-checker'
import { LogoLoading } from '@/components/logo-loading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { ToastAlert } from '@/components/ui/toast-alert'

interface User {
    _id: string
    name: string
    email: string
    role: 'admin' | 'user'
    accountType?: string
    emailVerified?: boolean
}

interface EmailTemplate {
    id: string
    name: string
    description: string
    subject: string
    previewText: string
    content: string
    category?: string
}

interface MaterialResource {
    _id: string
    title: string
    description?: string
    coverImage?: string
    type?: string
    pricing?: 'free' | 'paid'
    price?: number
    isHidden?: boolean
    _cardCount?: number
}

interface FlashcardResource {
    _id: string
    slug: string
    title: string
    description?: string
    coverImage?: string
    cardCount?: number
    pricing?: 'free' | 'paid'
    visibility?: string
    isPublished?: boolean
    isHidden?: boolean
}

interface AttachmentBlock {
    type: 'material' | 'flashcard' | 'link'
    title: string
    description: string
    url: string
    ctaText: string
    badge: string
    imageUrl?: string
}

interface SendResult {
    success: boolean
    message: string
    stats: {
        total: number
        sent: number
        failed: number
    }
    errors?: string[]
}

type AttachmentType = 'none' | 'material' | 'flashcard' | 'link'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://domineaqui.com.br'

function escapeHtml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

function normalizeHref(value: string) {
    const trimmed = value.trim()
    if (!trimmed) return ''
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function renderAttachmentHtml(attachment: AttachmentBlock | null) {
    if (!attachment) return ''

    const image = attachment.imageUrl
        ? `<img src="${escapeHtml(attachment.imageUrl)}" alt="" style="width: 100%; max-height: 220px; object-fit: cover; border-radius: 14px; margin: 0 0 18px 0;">`
        : ''

    return `
      <div class="divider"></div>
      <div style="border: 1px solid #d9e8df; background: linear-gradient(135deg, #f6fbf8 0%, #ffffff 100%); border-radius: 16px; padding: 24px; margin: 28px 0;">
        ${image}
        <p style="display: inline-block; margin: 0 0 12px 0; padding: 5px 10px; border-radius: 999px; background: #e9f8ef; color: #0f3d2e; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em;">${escapeHtml(attachment.badge)}</p>
        <h2 style="margin: 0 0 10px 0; color: #0f3d2e;">${escapeHtml(attachment.title)}</h2>
        <p style="margin: 0 0 18px 0; color: #4a5568;">${escapeHtml(attachment.description)}</p>
        <div style="text-align: center;">
          <a href="${escapeHtml(attachment.url)}" class="cta-button" target="_blank">${escapeHtml(attachment.ctaText)}</a>
        </div>
      </div>
    `
}

const quickBlocks = [
    { id: 'h1', label: 'Titulo', icon: Type },
    { id: 'paragraph', label: 'Texto', icon: FileText },
    { id: 'button', label: 'CTA', icon: Link2 },
    { id: 'highlight', label: 'Destaque', icon: Sparkles },
    { id: 'image', label: 'Imagem', icon: ImageIcon },
    { id: 'list', label: 'Lista', icon: List },
    { id: 'quote', label: 'Citação', icon: Quote },
    { id: 'divider', label: 'Divisor', icon: Layers },
]

export default function AdminEmailsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [users, setUsers] = useState<User[]>([])
    const [templates, setTemplates] = useState<EmailTemplate[]>([])
    const [materials, setMaterials] = useState<MaterialResource[]>([])
    const [flashcards, setFlashcards] = useState<FlashcardResource[]>([])

    const [selectedTemplateId, setSelectedTemplateId] = useState('')
    const [templateCategory, setTemplateCategory] = useState('Todos')
    const [templateSearch, setTemplateSearch] = useState('')

    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
    const [selectAll, setSelectAll] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterAccountType, setFilterAccountType] = useState('all')
    const [additionalEmails, setAdditionalEmails] = useState<string[]>([])
    const [newEmail, setNewEmail] = useState('')

    const [subject, setSubject] = useState('')
    const [previewText, setPreviewText] = useState('')
    const [content, setContent] = useState('')

    const [attachmentType, setAttachmentType] = useState<AttachmentType>('none')
    const [selectedMaterialId, setSelectedMaterialId] = useState('')
    const [selectedFlashcardId, setSelectedFlashcardId] = useState('')
    const [customLinkUrl, setCustomLinkUrl] = useState('')
    const [customLinkTitle, setCustomLinkTitle] = useState('')
    const [customLinkDescription, setCustomLinkDescription] = useState('')
    const [attachmentCtaText, setAttachmentCtaText] = useState('Acessar agora')

    const [showPreview, setShowPreview] = useState(false)
    const [sendResult, setSendResult] = useState<SendResult | null>(null)
    const [toast, setToast] = useState<{ open: boolean; message: string; type?: 'success' | 'error' | 'info' }>({ open: false, message: '' })

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ open: true, message, type })
    }

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        try {
            const [usersRes, templatesRes, materialsRes, flashcardsRes] = await Promise.all([
                fetch('/api/users', { cache: 'no-store' }),
                fetch('/api/admin/emails/templates', { cache: 'no-store' }),
                fetch('/api/materiais', { cache: 'no-store' }),
                fetch('/api/flashcards/manual?scope=all-admin', { cache: 'no-store' }),
            ])

            if (usersRes.ok) {
                const usersData = await usersRes.json()
                setUsers(usersData.users || [])
            }

            if (templatesRes.ok) {
                const templatesData = await templatesRes.json()
                setTemplates(templatesData.templates || [])
            }

            if (materialsRes.ok) {
                const materialsData = await materialsRes.json()
                setMaterials(materialsData.materials || [])
            }

            if (flashcardsRes.ok) {
                const flashcardsData = await flashcardsRes.json()
                setFlashcards(flashcardsData.decks || [])
            }
        } catch (error) {
            console.error('Load email composer data error:', error)
            showToast('Erro ao carregar dados da central de e-mails', 'error')
        } finally {
            setLoading(false)
        }
    }

    const filteredUsers = useMemo(() => {
        const query = searchQuery.toLowerCase().trim()
        return users.filter(user => {
            const matchesSearch =
                !query ||
                user.name.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query)

            const matchesAccountType =
                filterAccountType === 'all' ||
                user.accountType === filterAccountType ||
                (filterAccountType === 'admin' && user.role === 'admin')

            return matchesSearch && matchesAccountType
        })
    }, [filterAccountType, searchQuery, users])

    const categories = useMemo(() => {
        const unique = new Set(templates.map(template => template.category || 'Geral'))
        return ['Todos', ...Array.from(unique)]
    }, [templates])

    const visibleTemplates = useMemo(() => {
        const query = templateSearch.toLowerCase().trim()
        return templates.filter(template => {
            const category = template.category || 'Geral'
            const matchesCategory = templateCategory === 'Todos' || category === templateCategory
            const matchesSearch =
                !query ||
                template.name.toLowerCase().includes(query) ||
                template.description.toLowerCase().includes(query) ||
                template.subject.toLowerCase().includes(query)
            return matchesCategory && matchesSearch
        })
    }, [templateCategory, templateSearch, templates])

    const selectedMaterial = materials.find(material => material._id === selectedMaterialId)
    const selectedFlashcard = flashcards.find(deck => deck._id === selectedFlashcardId)

    const currentAttachment = useMemo<AttachmentBlock | null>(() => {
        if (attachmentType === 'material' && selectedMaterial) {
            return {
                type: 'material',
                title: selectedMaterial.title,
                description: selectedMaterial.description || 'Material selecionado para complementar seus estudos.',
                url: `${appUrl}/materiais/${selectedMaterial._id}`,
                ctaText: attachmentCtaText || 'Abrir material',
                badge: selectedMaterial.pricing === 'paid' ? 'Material premium' : 'Material de apoio',
                imageUrl: selectedMaterial.coverImage,
            }
        }

        if (attachmentType === 'flashcard' && selectedFlashcard) {
            return {
                type: 'flashcard',
                title: selectedFlashcard.title,
                description: selectedFlashcard.description || 'Deck de flashcards para revisar com prática ativa.',
                url: `${appUrl}/flashcards/d/${selectedFlashcard.slug || selectedFlashcard._id}`,
                ctaText: attachmentCtaText || 'Estudar flashcards',
                badge: `${selectedFlashcard.cardCount || 0} flashcards`,
                imageUrl: selectedFlashcard.coverImage,
            }
        }

        const normalizedLink = normalizeHref(customLinkUrl)
        if (attachmentType === 'link' && normalizedLink) {
            return {
                type: 'link',
                title: customLinkTitle.trim() || 'Link recomendado',
                description: customLinkDescription.trim() || 'Clique para acessar o recurso recomendado pela equipe DomineAqui.',
                url: normalizedLink,
                ctaText: attachmentCtaText || 'Abrir link',
                badge: 'Link externo',
            }
        }

        return null
    }, [
        attachmentCtaText,
        attachmentType,
        customLinkDescription,
        customLinkTitle,
        customLinkUrl,
        selectedFlashcard,
        selectedMaterial,
    ])

    const finalContent = useMemo(() => {
        return `${content}${renderAttachmentHtml(currentAttachment)}`
    }, [content, currentAttachment])

    const recipientCount = selectAll
        ? users.length + additionalEmails.length
        : selectedUserIds.size + additionalEmails.length

    const readinessChecks = useMemo(() => {
        return [
            { label: 'Assunto com gancho', done: subject.trim().length >= 20 },
            { label: 'Preview preenchido', done: previewText.trim().length >= 25 },
            { label: 'CTA ou anexo clicavel', done: content.includes('cta-button') || !!currentAttachment },
            { label: 'Conteudo suficiente', done: content.replace(/<[^>]*>/g, '').trim().length >= 80 },
            { label: 'Destinatarios definidos', done: recipientCount > 0 },
        ]
    }, [content, currentAttachment, previewText, recipientCount, subject])

    const readinessScore = readinessChecks.filter(item => item.done).length
    const selectedTemplate = templates.find(template => template.id === selectedTemplateId)

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds(prev => {
            const next = new Set(prev)
            if (next.has(userId)) {
                next.delete(userId)
            } else {
                next.add(userId)
            }
            return next
        })
        setSelectAll(false)
    }

    const toggleSelectAll = () => {
        setSelectAll(prev => !prev)
        setSelectedUserIds(new Set())
    }

    const selectFiltered = () => {
        setSelectedUserIds(new Set(filteredUsers.map(user => user._id)))
        setSelectAll(false)
    }

    const addEmail = () => {
        const email = newEmail.trim().toLowerCase()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showToast('E-mail inválido', 'error')
            return
        }

        if (!additionalEmails.includes(email)) {
            setAdditionalEmails(prev => [...prev, email])
        }
        setNewEmail('')
    }

    const loadTemplate = (template: EmailTemplate) => {
        setSelectedTemplateId(template.id)
        setSubject(template.subject)
        setPreviewText(template.previewText)
        setContent(template.content)
        showToast(`Template "${template.name}" carregado`, 'success')
    }

    const insertElement = (elementType: string) => {
        let element = ''

        switch (elementType) {
            case 'button':
                element = '\n<div style="text-align: center;">\n  <a href="[LINK_AQUI]" class="cta-button">Texto do botão</a>\n</div>\n'
                break
            case 'image':
                element = '\n<div style="text-align: center;">\n  <img src="[URL_DA_IMAGEM]" alt="Descrição da imagem" style="max-width: 100%; border-radius: 12px;">\n</div>\n'
                break
            case 'highlight':
                element = '\n<div class="highlight-box">\n  <p><strong>Destaque:</strong> escreva aqui o principal motivo para clicar.</p>\n</div>\n'
                break
            case 'divider':
                element = '\n<div class="divider"></div>\n'
                break
            case 'h1':
                element = '\n<h1 style="text-align: center;">Título principal</h1>\n'
                break
            case 'paragraph':
                element = '\n<p>Escreva um parágrafo curto, claro e orientado para ação.</p>\n'
                break
            case 'list':
                element = '\n<ul>\n  <li>Benefício 1</li>\n  <li>Benefício 2</li>\n  <li>Próximo passo</li>\n</ul>\n'
                break
            case 'quote':
                element = '\n<blockquote style="border-left: 4px solid #0f3d2e; padding-left: 18px; margin: 24px 0; color: #4a5568; font-style: italic;">\n  Insira uma prova social, depoimento ou frase curta.\n</blockquote>\n'
                break
            case 'bold':
                element = '<strong>texto em destaque</strong>'
                break
            case 'italic':
                element = '<em>texto em itálico</em>'
                break
        }

        setContent(prev => `${prev}${element}`)
        showToast('Bloco inserido no e-mail', 'success')
    }

    const getPreviewHtml = useCallback(() => {
        const logoUrl = 'https://www.domineaqui.com.br/logo.png'

        return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 20px; background: #eef3f7; font-family: 'Segoe UI', Tahoma, sans-serif; }
          .email-container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 12px 36px rgba(15, 61, 46, .12); }
          .header { background: linear-gradient(135deg, #0f3d2e 0%, #1a5c45 100%); padding: 30px 20px; text-align: center; }
          .header img { max-height: 60px; }
          .content { padding: 40px 30px; line-height: 1.6; color: #333; }
          .content h1, .content h2 { color: #0f3d2e; margin-top: 0; }
          .content h1 { font-size: 28px; line-height: 1.18; }
          .content h2 { font-size: 22px; line-height: 1.25; }
          .content p, .content li { color: #4a5568; font-size: 16px; }
          .content p { margin: 0 0 16px; }
          .content img { max-width: 100%; border-radius: 12px; margin: 20px 0; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #f57c00 0%, #ff9800 100%); color: #fff !important; text-decoration: none; padding: 16px 34px; border-radius: 999px; font-weight: 800; margin: 22px 0; box-shadow: 0 6px 18px rgba(245, 124, 0, 0.28); }
          .secondary-button { display: inline-block; color: #0f3d2e !important; text-decoration: none; padding: 13px 28px; border-radius: 999px; font-weight: 700; border: 2px solid #0f3d2e; margin: 10px 5px; }
          .highlight-box { background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%); border-left: 4px solid #f57c00; padding: 20px; margin: 25px 0; border-radius: 0 10px 10px 0; }
          .highlight-box p { margin: 0 0 8px; color: #5d4037; }
          .divider { height: 1px; background: linear-gradient(90deg, transparent, #d7dee6, transparent); margin: 30px 0; }
          .footer { background: #fafbfc; padding: 30px; text-align: center; border-top: 1px solid #edf2f7; }
          .footer p { margin: 5px 0; font-size: 13px; color: #718096; }
          .social-link { color: #f57c00; font-weight: bold; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <img src="${logoUrl}" alt="DomineAqui">
          </div>
          <div class="content">
            ${finalContent || '<p style="color: #999; text-align: center;">Seu conteúdo aparecerá aqui...</p>'}
          </div>
          <div class="footer">
            <p>Siga-nos no Instagram: <a href="https://instagram.com/domineaqui.br" class="social-link">@domineaqui.br</a></p>
            <p>&copy; ${new Date().getFullYear()} DomineAqui. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `
    }, [finalContent])

    const sendEmail = async () => {
        if (!subject.trim()) {
            showToast('Informe o assunto do e-mail', 'error')
            return
        }
        if (!content.trim()) {
            showToast('Informe o conteúdo do e-mail', 'error')
            return
        }
        if (recipientCount === 0) {
            showToast('Selecione pelo menos um destinatário', 'error')
            return
        }

        setSending(true)
        setSendResult(null)

        try {
            const res = await fetch('/api/admin/emails/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipients: {
                        userIds: selectAll ? undefined : Array.from(selectedUserIds),
                        additionalEmails,
                        selectAll,
                    },
                    subject,
                    content: finalContent,
                    previewText,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao enviar e-mails')
            }

            setSendResult(data)
            showToast(data.message, 'success')
        } catch (error) {
            const err = error as Error
            showToast(err.message, 'error')
        } finally {
            setSending(false)
        }
    }

    if (loading) {
        return <LogoLoading message="Carregando central de e-mails..." size="lg" fullscreen />
    }

    return (
        <AppShell headerTitle="Central de E-mails" headerSubtitle="Campanhas administrativas com templates, anexos e preview">
            <BanChecker />
            <div className="container mx-auto max-w-[1500px] px-4 py-7">
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                        <Button variant="ghost" size="icon" onClick={() => router.push('/admin')} className="mt-1 shrink-0">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Criar e-mail administrativo</h1>
                                <Badge variant="outline" className="gap-1">
                                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                    {templates.length} templates
                                </Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Monte uma campanha com assunto forte, preview, bloco clicável e destinatários segmentados.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:min-w-[460px]">
                        <div className="rounded-lg border bg-white p-3 text-center shadow-sm dark:bg-slate-950">
                            <p className="text-xs text-muted-foreground">Destinatários</p>
                            <p className="text-xl font-bold">{recipientCount}</p>
                        </div>
                        <div className="rounded-lg border bg-white p-3 text-center shadow-sm dark:bg-slate-950">
                            <p className="text-xs text-muted-foreground">Template</p>
                            <p className="truncate text-sm font-semibold">{selectedTemplate?.name || 'Livre'}</p>
                        </div>
                        <div className="rounded-lg border bg-white p-3 text-center shadow-sm dark:bg-slate-950">
                            <p className="text-xs text-muted-foreground">Anexo</p>
                            <p className="truncate text-sm font-semibold">{currentAttachment?.badge || 'Nenhum'}</p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)_390px]">
                    <div className="space-y-5">
                        <Card className="overflow-hidden">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Wand2 className="h-5 w-5 text-amber-500" />
                                    Templates
                                </CardTitle>
                                <CardDescription>Escolha um ponto de partida para aumentar a chance de clique.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={templateSearch}
                                        onChange={(event) => setTemplateSearch(event.target.value)}
                                        placeholder="Buscar campanha..."
                                        className="pl-9"
                                    />
                                </div>

                                <div className="flex gap-2 overflow-x-auto pb-1">
                                    {categories.map(category => (
                                        <Button
                                            key={category}
                                            type="button"
                                            size="sm"
                                            variant={templateCategory === category ? 'default' : 'outline'}
                                            onClick={() => setTemplateCategory(category)}
                                            className="shrink-0"
                                        >
                                            {category}
                                        </Button>
                                    ))}
                                </div>

                                <div className="max-h-[530px] space-y-2 overflow-y-auto pr-1">
                                    {visibleTemplates.map(template => (
                                        <button
                                            key={template.id}
                                            type="button"
                                            onClick={() => loadTemplate(template)}
                                            className={`w-full rounded-lg border p-3 text-left transition hover:border-primary hover:bg-primary/5 ${selectedTemplateId === template.id ? 'border-primary bg-primary/10' : 'bg-background'}`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold">{template.name}</p>
                                                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{template.description}</p>
                                                </div>
                                                <Badge variant="outline" className="shrink-0 text-[10px]">
                                                    {template.category || 'Geral'}
                                                </Badge>
                                            </div>
                                            <p className="mt-3 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{template.subject || 'Sem assunto predefinido'}</p>
                                        </button>
                                    ))}
                                    {visibleTemplates.length === 0 && (
                                        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                            Nenhum template encontrado.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-5">
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Mail className="h-5 w-5 text-emerald-600" />
                                    Experiência da caixa de entrada
                                </CardTitle>
                                <CardDescription>Assunto e preview aparecem antes do usuário abrir o e-mail.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium">Assunto *</label>
                                        <Input
                                            value={subject}
                                            onChange={(event) => setSubject(event.target.value)}
                                            placeholder="Ex: Seu próximo passo de estudo está aqui"
                                            className="text-base"
                                        />
                                        <p className="mt-1 text-xs text-muted-foreground">{subject.length} caracteres</p>
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium">Preview *</label>
                                        <Input
                                            value={previewText}
                                            onChange={(event) => setPreviewText(event.target.value)}
                                            placeholder="A frase que convence o usuário a abrir"
                                        />
                                        <p className="mt-1 text-xs text-muted-foreground">{previewText.length} caracteres</p>
                                    </div>
                                </div>

                                <div className="rounded-lg border bg-slate-50 p-4 dark:bg-slate-900">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white">
                                            DA
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="truncate text-sm font-semibold">DomineAqui</p>
                                                <p className="text-xs text-muted-foreground">Agora</p>
                                            </div>
                                            <p className="truncate text-sm font-medium">{subject || 'Assunto do e-mail'}</p>
                                            <p className="truncate text-sm text-muted-foreground">{previewText || 'Texto de preview que aparece na caixa de entrada.'}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                    Conteúdo
                                </CardTitle>
                                <CardDescription>Escreva em HTML ou insira blocos prontos. O anexo aparece no fim do e-mail.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap gap-2 rounded-lg border bg-muted/40 p-2">
                                    {quickBlocks.map(block => {
                                        const Icon = block.icon
                                        return (
                                            <Button
                                                key={block.id}
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => insertElement(block.id)}
                                                title={block.label}
                                                className="gap-1"
                                            >
                                                <Icon className="h-4 w-4" />
                                                <span className="hidden sm:inline">{block.label}</span>
                                            </Button>
                                        )
                                    })}
                                    <Button type="button" variant="ghost" size="sm" onClick={() => insertElement('bold')} title="Negrito">
                                        <strong>B</strong>
                                    </Button>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => insertElement('italic')} title="Itálico">
                                        <Italic className="h-4 w-4" />
                                    </Button>
                                </div>

                                <Textarea
                                    value={content}
                                    onChange={(event) => setContent(event.target.value)}
                                    placeholder="Escolha um template ou escreva o conteúdo do e-mail..."
                                    className="min-h-[350px] font-mono text-sm"
                                />

                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => setShowPreview(true)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Visualizar e-mail
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => {
                                            navigator.clipboard.writeText(getPreviewHtml())
                                            showToast('HTML completo copiado', 'success')
                                        }}
                                    >
                                        <Copy className="mr-2 h-4 w-4" />
                                        Copiar HTML
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Paperclip className="h-5 w-5 text-violet-600" />
                                    Anexar recurso clicável
                                </CardTitle>
                                <CardDescription>Adicione material, deck de flashcards ou link como bloco visual no e-mail.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2 sm:grid-cols-4">
                                    {[
                                        { value: 'none', label: 'Nenhum', icon: X },
                                        { value: 'material', label: 'Material', icon: BookOpen },
                                        { value: 'flashcard', label: 'Flashcard', icon: GraduationCap },
                                        { value: 'link', label: 'Link', icon: Link2 },
                                    ].map(option => {
                                        const Icon = option.icon
                                        return (
                                            <Button
                                                key={option.value}
                                                type="button"
                                                variant={attachmentType === option.value ? 'default' : 'outline'}
                                                onClick={() => setAttachmentType(option.value as AttachmentType)}
                                                className="gap-2"
                                            >
                                                <Icon className="h-4 w-4" />
                                                {option.label}
                                            </Button>
                                        )
                                    })}
                                </div>

                                {attachmentType === 'material' && (
                                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                                        <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Escolha um material" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {materials.map(material => (
                                                    <SelectItem key={material._id} value={material._id}>
                                                        {material.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Input value={attachmentCtaText} onChange={(event) => setAttachmentCtaText(event.target.value)} placeholder="Texto do botão" />
                                    </div>
                                )}

                                {attachmentType === 'flashcard' && (
                                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                                        <Select value={selectedFlashcardId} onValueChange={setSelectedFlashcardId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Escolha um deck" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {flashcards.map(deck => (
                                                    <SelectItem key={deck._id} value={deck._id}>
                                                        {deck.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Input value={attachmentCtaText} onChange={(event) => setAttachmentCtaText(event.target.value)} placeholder="Texto do botão" />
                                    </div>
                                )}

                                {attachmentType === 'link' && (
                                    <div className="grid gap-3">
                                        <Input value={customLinkUrl} onChange={(event) => setCustomLinkUrl(event.target.value)} placeholder="https://..." />
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <Input value={customLinkTitle} onChange={(event) => setCustomLinkTitle(event.target.value)} placeholder="Título do link" />
                                            <Input value={attachmentCtaText} onChange={(event) => setAttachmentCtaText(event.target.value)} placeholder="Texto do botão" />
                                        </div>
                                        <Textarea
                                            value={customLinkDescription}
                                            onChange={(event) => setCustomLinkDescription(event.target.value)}
                                            placeholder="Descrição curta do motivo para clicar"
                                            className="min-h-[88px]"
                                        />
                                    </div>
                                )}

                                {currentAttachment ? (
                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
                                        <div className="flex items-start gap-3">
                                            <Paperclip className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                                            <div className="min-w-0">
                                                <p className="font-semibold text-emerald-950 dark:text-emerald-100">{currentAttachment.title}</p>
                                                <p className="mt-1 line-clamp-2 text-sm text-emerald-900/75 dark:text-emerald-100/75">{currentAttachment.description}</p>
                                                <p className="mt-2 truncate text-xs text-emerald-800 dark:text-emerald-200">{currentAttachment.url}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : attachmentType !== 'none' ? (
                                    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                        Escolha ou preencha o recurso para anexar ao e-mail.
                                    </div>
                                ) : null}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-5">
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Target className="h-5 w-5 text-rose-600" />
                                    Checklist de clique
                                </CardTitle>
                                <CardDescription>{readinessScore} de {readinessChecks.length} pontos prontos.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="h-2 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-blue-600 to-amber-500 transition-all"
                                        style={{ width: `${(readinessScore / readinessChecks.length) * 100}%` }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    {readinessChecks.map(item => (
                                        <div key={item.label} className="flex items-center gap-2 text-sm">
                                            {item.done ? (
                                                <Check className="h-4 w-4 text-emerald-600" />
                                            ) : (
                                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                            )}
                                            <span className={item.done ? 'font-medium' : 'text-muted-foreground'}>{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Tabs defaultValue="users">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="users">
                                    <Users className="mr-2 h-4 w-4" />
                                    Usuários
                                </TabsTrigger>
                                <TabsTrigger value="extras">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Extras
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="users" className="mt-4">
                                <Card>
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-lg">Destinatários</CardTitle>
                                        <CardDescription>Selecione todos, filtrados ou usuários específicos.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-2 sm:grid-cols-3">
                                            <Button type="button" variant={selectAll ? 'default' : 'outline'} size="sm" onClick={toggleSelectAll}>
                                                {selectAll && <Check className="mr-2 h-4 w-4" />}
                                                Todos ({users.length})
                                            </Button>
                                            <Button type="button" variant="outline" size="sm" onClick={selectFiltered} disabled={filteredUsers.length === 0}>
                                                Filtrados ({filteredUsers.length})
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedUserIds(new Set())
                                                    setSelectAll(false)
                                                }}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Limpar
                                            </Button>
                                        </div>

                                        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_145px]">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    value={searchQuery}
                                                    onChange={(event) => setSearchQuery(event.target.value)}
                                                    placeholder="Buscar usuário..."
                                                    className="pl-9"
                                                />
                                            </div>
                                            <Select value={filterAccountType} onValueChange={setFilterAccountType}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Tipo" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todos</SelectItem>
                                                    <SelectItem value="admin">Admins</SelectItem>
                                                    <SelectItem value="premium">Premium</SelectItem>
                                                    <SelectItem value="trial">Trial</SelectItem>
                                                    <SelectItem value="gratuito">Gratuito</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="max-h-[360px] overflow-y-auto rounded-lg border">
                                            {filteredUsers.length === 0 ? (
                                                <div className="p-8 text-center text-sm text-muted-foreground">Nenhum usuário encontrado</div>
                                            ) : (
                                                filteredUsers.map(user => (
                                                    <button
                                                        key={user._id}
                                                        type="button"
                                                        onClick={() => toggleUserSelection(user._id)}
                                                        className={`flex w-full items-center gap-3 border-b p-3 text-left last:border-b-0 hover:bg-muted/50 ${selectAll || selectedUserIds.has(user._id) ? 'bg-primary/10' : ''}`}
                                                    >
                                                        <Checkbox
                                                            checked={selectAll || selectedUserIds.has(user._id)}
                                                            onCheckedChange={() => toggleUserSelection(user._id)}
                                                            onClick={(event) => event.stopPropagation()}
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-medium">{user.name}</p>
                                                            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                                                        </div>
                                                        <div className="flex shrink-0 flex-col items-end gap-1">
                                                            {user.role === 'admin' && <Badge variant="secondary" className="text-[10px]">Admin</Badge>}
                                                            {user.accountType && user.role !== 'admin' && <Badge variant="outline" className="text-[10px]">{user.accountType}</Badge>}
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="extras" className="mt-4">
                                <Card>
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-lg">E-mails extras</CardTitle>
                                        <CardDescription>Inclua destinatários fora da base de usuários.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex gap-2">
                                            <Input
                                                value={newEmail}
                                                onChange={(event) => setNewEmail(event.target.value)}
                                                placeholder="email@exemplo.com"
                                                type="email"
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter') {
                                                        event.preventDefault()
                                                        addEmail()
                                                    }
                                                }}
                                            />
                                            <Button type="button" onClick={addEmail}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Adicionar
                                            </Button>
                                        </div>

                                        {additionalEmails.length === 0 ? (
                                            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                                                Nenhum e-mail adicional.
                                            </div>
                                        ) : (
                                            <div className="max-h-56 divide-y overflow-y-auto rounded-lg border">
                                                {additionalEmails.map(email => (
                                                    <div key={email} className="flex items-center justify-between gap-2 p-3">
                                                        <span className="truncate text-sm">{email}</span>
                                                        <div className="flex gap-1">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(email)
                                                                    showToast('E-mail copiado', 'success')
                                                                }}
                                                            >
                                                                <Copy className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-destructive"
                                                                onClick={() => setAdditionalEmails(prev => prev.filter(item => item !== email))}
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>

                        <Card className={recipientCount > 0 ? 'border-emerald-300 shadow-sm shadow-emerald-100 dark:shadow-none' : ''}>
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Send className="h-5 w-5 text-emerald-600" />
                                    Envio
                                </CardTitle>
                                <CardDescription>Revise o resumo antes de disparar.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-lg bg-muted/50 p-4 text-sm">
                                    <div className="flex justify-between gap-4">
                                        <span className="text-muted-foreground">Assunto</span>
                                        <span className="max-w-[220px] truncate font-medium">{subject || 'Nao definido'}</span>
                                    </div>
                                    <div className="mt-2 flex justify-between gap-4">
                                        <span className="text-muted-foreground">Destinatários</span>
                                        <span className="font-medium">{recipientCount}</span>
                                    </div>
                                    <div className="mt-2 flex justify-between gap-4">
                                        <span className="text-muted-foreground">Recurso</span>
                                        <span className="max-w-[220px] truncate font-medium">{currentAttachment?.title || 'Sem anexo'}</span>
                                    </div>
                                </div>

                                {sendResult && (
                                    <div className={`rounded-lg p-4 ${sendResult.stats.failed > 0 ? 'bg-yellow-50 dark:bg-yellow-950/20' : 'bg-green-50 dark:bg-green-950/20'}`}>
                                        <div className="flex items-start gap-3">
                                            {sendResult.stats.failed > 0 ? (
                                                <AlertCircle className="mt-0.5 h-5 w-5 text-yellow-600" />
                                            ) : (
                                                <Check className="mt-0.5 h-5 w-5 text-green-600" />
                                            )}
                                            <div>
                                                <p className="font-medium">{sendResult.message}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Enviados: {sendResult.stats.sent} | Falhas: {sendResult.stats.failed}
                                                </p>
                                                {sendResult.errors && sendResult.errors.length > 0 && (
                                                    <details className="mt-2">
                                                        <summary className="cursor-pointer text-sm text-destructive">Ver erros ({sendResult.errors.length})</summary>
                                                        <ul className="mt-1 space-y-1 text-xs">
                                                            {sendResult.errors.map((err, index) => (
                                                                <li key={index} className="text-destructive">{err}</li>
                                                            ))}
                                                        </ul>
                                                    </details>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <Button type="button" variant="outline" onClick={() => setShowPreview(true)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Revisar preview
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={sendEmail}
                                        disabled={sending || recipientCount === 0 || !subject.trim() || !content.trim()}
                                        className="h-12 text-base"
                                    >
                                        {sending ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Enviando...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="mr-2 h-5 w-5" />
                                                Enviar para {recipientCount} destinatário{recipientCount !== 1 ? 's' : ''}
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {recipientCount > 50 && (
                                    <p className="text-center text-xs text-muted-foreground">
                                        Envios em massa são processados em lotes e podem levar alguns minutos.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            Preview do e-mail
                        </DialogTitle>
                        <DialogDescription>{subject || 'Sem assunto definido'}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                        <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <BarChart3 className="h-4 w-4 text-blue-600" />
                                Resumo
                            </div>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-xs text-muted-foreground">Destinatários</p>
                                    <p className="font-semibold">{recipientCount}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Template</p>
                                    <p className="font-semibold">{selectedTemplate?.name || 'Composição livre'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Anexo</p>
                                    <p className="font-semibold">{currentAttachment?.title || 'Nenhum'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Checklist</p>
                                    <p className="font-semibold">{readinessScore}/{readinessChecks.length}</p>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-lg border">
                            <iframe srcDoc={getPreviewHtml()} className="h-[680px] w-full" title="Email Preview" />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <ToastAlert
                open={toast.open}
                onOpenChange={(open) => setToast(prev => ({ ...prev, open }))}
                message={toast.message}
                type={toast.type}
            />
        </AppShell>
    )
}
