'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { BanChecker } from '@/components/ban-checker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToastAlert } from '@/components/ui/toast-alert'
import { LogoLoading } from '@/components/logo-loading'
import {
    ArrowLeft,
    Mail,
    Users,
    Send,
    Plus,
    X,
    Search,
    Eye,
    ImageIcon,
    Link2,
    Type,
    AlignCenter,
    Bold,
    Italic,
    List,
    Quote,
    Loader2,
    Check,
    AlertCircle,
    Sparkles,
    FileText,
    Trash2,
    Copy,
} from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
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

export default function AdminEmailsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [users, setUsers] = useState<User[]>([])
    const [templates, setTemplates] = useState<EmailTemplate[]>([])

    // Seleção de destinatários
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
    const [selectAll, setSelectAll] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [additionalEmails, setAdditionalEmails] = useState<string[]>([])
    const [newEmail, setNewEmail] = useState('')

    // Conteúdo do e-mail
    const [subject, setSubject] = useState('')
    const [previewText, setPreviewText] = useState('')
    const [content, setContent] = useState('')

    // Preview
    const [showPreview, setShowPreview] = useState(false)
    const [sendResult, setSendResult] = useState<SendResult | null>(null)

    // Filtros
    const [filterAccountType, setFilterAccountType] = useState<string>('all')

    // Toast
    const [toast, setToast] = useState<{ open: boolean; message: string; type?: 'success' | 'error' | 'info' }>({ open: false, message: '' })

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ open: true, message, type })
    }

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        try {
            // Carregar usuários e templates em paralelo
            const [usersRes, templatesRes] = await Promise.all([
                fetch('/api/users'),
                fetch('/api/admin/emails/templates'),
            ])

            if (usersRes.ok) {
                const usersData = await usersRes.json()
                setUsers(usersData.users || [])
            }

            if (templatesRes.ok) {
                const templatesData = await templatesRes.json()
                setTemplates(templatesData.templates || [])
            }
        } catch (error) {
            console.error('Load data error:', error)
            showToast('Erro ao carregar dados', 'error')
        } finally {
            setLoading(false)
        }
    }

    // Filtrar usuários
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesAccountType =
            filterAccountType === 'all' ||
            user.accountType === filterAccountType ||
            (filterAccountType === 'admin' && user.role === 'admin')

        return matchesSearch && matchesAccountType
    })

    // Gerenciar seleção
    const toggleUserSelection = (userId: string) => {
        const newSet = new Set(selectedUserIds)
        if (newSet.has(userId)) {
            newSet.delete(userId)
        } else {
            newSet.add(userId)
        }
        setSelectedUserIds(newSet)
        setSelectAll(false)
    }

    const toggleSelectAll = () => {
        if (selectAll) {
            setSelectedUserIds(new Set())
            setSelectAll(false)
        } else {
            setSelectAll(true)
            setSelectedUserIds(new Set())
        }
    }

    const selectFiltered = () => {
        const newSet = new Set(filteredUsers.map(u => u._id))
        setSelectedUserIds(newSet)
        setSelectAll(false)
    }

    // E-mails adicionais
    const addEmail = () => {
        if (newEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
            if (!additionalEmails.includes(newEmail)) {
                setAdditionalEmails([...additionalEmails, newEmail])
            }
            setNewEmail('')
        } else {
            showToast('E-mail inválido', 'error')
        }
    }

    const removeEmail = (email: string) => {
        setAdditionalEmails(additionalEmails.filter(e => e !== email))
    }

    // Carregar template
    const loadTemplate = (template: EmailTemplate) => {
        setSubject(template.subject)
        setPreviewText(template.previewText)
        setContent(template.content)
        showToast(`Template "${template.name}" carregado`, 'success')
    }

    // Inserir elementos no conteúdo
    const insertElement = (elementType: string) => {
        let element = ''

        switch (elementType) {
            case 'button':
                element = '\n<div style="text-align: center;">\n  <a href="[LINK_AQUI]" class="cta-button">Texto do Botão</a>\n</div>\n'
                break
            case 'secondary-button':
                element = '\n<div style="text-align: center;">\n  <a href="[LINK_AQUI]" class="secondary-button">Texto do Botão</a>\n</div>\n'
                break
            case 'image':
                element = '\n<div style="text-align: center;">\n  <img src="[URL_DA_IMAGEM]" alt="Descrição" style="max-width: 100%; border-radius: 8px;">\n</div>\n'
                break
            case 'highlight':
                element = '\n<div class="highlight-box">\n  <p><strong>Destaque:</strong> Seu texto aqui</p>\n</div>\n'
                break
            case 'divider':
                element = '\n<div class="divider"></div>\n'
                break
            case 'h1':
                element = '\n<h1 style="text-align: center;">Título Principal</h1>\n'
                break
            case 'h2':
                element = '\n<h2>Subtítulo</h2>\n'
                break
            case 'paragraph':
                element = '\n<p>Seu parágrafo aqui...</p>\n'
                break
            case 'bold':
                element = '<strong>texto em negrito</strong>'
                break
            case 'italic':
                element = '<em>texto em itálico</em>'
                break
            case 'list':
                element = '\n<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n  <li>Item 3</li>\n</ul>\n'
                break
            case 'quote':
                element = '\n<blockquote style="border-left: 4px solid #0f3d2e; padding-left: 20px; margin: 20px 0; font-style: italic; color: #4a5568;">\n  Sua citação aqui...\n</blockquote>\n'
                break
            case 'center':
                element = '\n<div style="text-align: center;">\n  Conteúdo centralizado\n</div>\n'
                break
        }

        setContent(prev => prev + element)
        showToast('Elemento inserido', 'success')
    }

    // Gerar preview HTML
    const getPreviewHtml = useCallback(() => {
        const logoUrl = 'https://www.domineaqui.com.br/logo.png'

        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { margin: 0; padding: 20px; background: #f4f7fa; font-family: 'Segoe UI', sans-serif; }
          .email-container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #0f3d2e 0%, #1a5c45 100%); padding: 30px 20px; text-align: center; }
          .header img { max-height: 60px; }
          .content { padding: 40px 30px; line-height: 1.6; color: #333; }
          .content h1, .content h2 { color: #0f3d2e; margin-top: 0; }
          .content h1 { font-size: 28px; }
          .content h2 { font-size: 22px; }
          .content p { color: #4a5568; margin: 0 0 16px; }
          .content img { max-width: 100%; border-radius: 8px; margin: 20px 0; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #f57c00 0%, #ff9800 100%); color: #fff !important; text-decoration: none; padding: 16px 36px; border-radius: 50px; font-weight: 700; margin: 25px 0; box-shadow: 0 4px 15px rgba(245, 124, 0, 0.35); }
          .secondary-button { display: inline-block; background: transparent; color: #0f3d2e !important; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; border: 2px solid #0f3d2e; margin: 10px 5px; }
          .highlight-box { background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%); border-left: 4px solid #f57c00; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0; }
          .highlight-box p { margin: 0; color: #5d4037; }
          .divider { height: 1px; background: linear-gradient(90deg, transparent, #e0e0e0, transparent); margin: 30px 0; }
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
            ${content || '<p style="color: #999; text-align: center;">Seu conteúdo aparecerá aqui...</p>'}
          </div>
          <div class="footer">
            <p>Siga-nos no Instagram: <a href="https://instagram.com/domineaqui.br" class="social-link">@domineaqui.br</a></p>
            <p>© ${new Date().getFullYear()} DomineAqui. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `
    }, [content])

    // Contagem de destinatários
    const recipientCount = selectAll
        ? users.length + additionalEmails.length
        : selectedUserIds.size + additionalEmails.length

    // Enviar e-mail
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
                    content,
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
        return <LogoLoading message="Carregando..." size="lg" fullscreen />
    }

    return (
        <AppShell headerTitle="Enviar E-mails em Massa" headerSubtitle="Comunicação com usuários">
            <BanChecker />
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push('/admin')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Mail className="h-6 w-6 text-primary" />
                                Central de E-mails
                            </h1>
                            <p className="text-muted-foreground">Envie e-mails personalizados para seus usuários</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-base py-1.5 px-3">
                            <Users className="h-4 w-4 mr-2" />
                            {recipientCount} destinatário{recipientCount !== 1 ? 's' : ''}
                        </Badge>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Coluna Esquerda - Composição */}
                    <div className="space-y-6">
                        {/* Templates */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-yellow-500" />
                                    Templates Prontos
                                </CardTitle>
                                <CardDescription>Comece com um modelo pré-configurado</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {templates.map(template => (
                                        <Button
                                            key={template.id}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => loadTemplate(template)}
                                            className="h-auto py-2 px-3"
                                        >
                                            <div className="text-left">
                                                <div className="font-medium">{template.name}</div>
                                                <div className="text-xs text-muted-foreground">{template.description}</div>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Editor */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-blue-500" />
                                    Compor E-mail
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Assunto */}
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Assunto *</label>
                                    <Input
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="Ex: Novidades incríveis no DomineAqui! 🚀"
                                        className="text-base"
                                    />
                                </div>

                                {/* Preview Text */}
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Texto de Preview (opcional)</label>
                                    <Input
                                        value={previewText}
                                        onChange={(e) => setPreviewText(e.target.value)}
                                        placeholder="Texto que aparece na caixa de entrada antes de abrir o e-mail"
                                    />
                                </div>

                                {/* Toolbar */}
                                <div className="flex flex-wrap gap-1 p-2 bg-muted rounded-lg">
                                    <Button variant="ghost" size="sm" onClick={() => insertElement('h1')} title="Título">
                                        <Type className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => insertElement('h2')} title="Subtítulo">
                                        H2
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => insertElement('paragraph')} title="Parágrafo">
                                        <AlignCenter className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => insertElement('bold')} title="Negrito">
                                        <Bold className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => insertElement('italic')} title="Itálico">
                                        <Italic className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => insertElement('list')} title="Lista">
                                        <List className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => insertElement('quote')} title="Citação">
                                        <Quote className="h-4 w-4" />
                                    </Button>
                                    <div className="w-px h-6 bg-border mx-1" />
                                    <Button variant="ghost" size="sm" onClick={() => insertElement('image')} title="Imagem">
                                        <ImageIcon className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => insertElement('button')} title="Botão CTA">
                                        <Link2 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => insertElement('highlight')} title="Caixa de Destaque">
                                        💡
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => insertElement('divider')} title="Divisor">
                                        ─
                                    </Button>
                                </div>

                                {/* Conteúdo */}
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Conteúdo HTML *</label>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="Escreva o conteúdo do e-mail em HTML..."
                                        className="w-full h-64 p-3 border rounded-lg font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Use os botões acima para inserir elementos. Classes disponíveis: cta-button, secondary-button, highlight-box, divider
                                    </p>
                                </div>

                                {/* Preview Button */}
                                <Button variant="outline" className="w-full" onClick={() => setShowPreview(true)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Visualizar E-mail
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Coluna Direita - Destinatários */}
                    <div className="space-y-6">
                        <Tabs defaultValue="users" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="users">
                                    <Users className="h-4 w-4 mr-2" />
                                    Usuários ({users.length})
                                </TabsTrigger>
                                <TabsTrigger value="extras">
                                    <Plus className="h-4 w-4 mr-2" />
                                    E-mails Extras ({additionalEmails.length})
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="users" className="space-y-4">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg">Selecionar Usuários</CardTitle>
                                        <CardDescription>Escolha quem receberá o e-mail</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Controles */}
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                variant={selectAll ? "default" : "outline"}
                                                size="sm"
                                                onClick={toggleSelectAll}
                                            >
                                                {selectAll ? <Check className="h-4 w-4 mr-2" /> : null}
                                                Selecionar Todos ({users.length})
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={selectFiltered}
                                                disabled={filteredUsers.length === 0}
                                            >
                                                Selecionar Filtrados ({filteredUsers.length})
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedUserIds(new Set())
                                                    setSelectAll(false)
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Limpar
                                            </Button>
                                        </div>

                                        {/* Filtros */}
                                        <div className="flex gap-2">
                                            <div className="flex-1 relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    placeholder="Buscar por nome ou e-mail..."
                                                    className="pl-9"
                                                />
                                            </div>
                                            <Select value={filterAccountType} onValueChange={setFilterAccountType}>
                                                <SelectTrigger className="w-40">
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

                                        {/* Lista de usuários */}
                                        <div className="border rounded-lg max-h-80 overflow-y-auto">
                                            {filteredUsers.length === 0 ? (
                                                <div className="p-8 text-center text-muted-foreground">
                                                    Nenhum usuário encontrado
                                                </div>
                                            ) : (
                                                filteredUsers.map(user => (
                                                    <div
                                                        key={user._id}
                                                        className={`flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer transition-colors ${selectAll || selectedUserIds.has(user._id) ? 'bg-primary/10' : ''
                                                            }`}
                                                        onClick={() => toggleUserSelection(user._id)}
                                                    >
                                                        <Checkbox
                                                            checked={selectAll || selectedUserIds.has(user._id)}
                                                            onCheckedChange={() => toggleUserSelection(user._id)}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium truncate">{user.name}</div>
                                                            <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            {user.role === 'admin' && (
                                                                <Badge variant="secondary" className="text-xs">Admin</Badge>
                                                            )}
                                                            {user.accountType === 'premium' && (
                                                                <Badge className="bg-yellow-500/20 text-yellow-700 text-xs">Premium</Badge>
                                                            )}
                                                            {user.accountType === 'trial' && (
                                                                <Badge variant="outline" className="text-xs">Trial</Badge>
                                                            )}
                                                            {!user.emailVerified && (
                                                                <Badge variant="destructive" className="text-xs">Não verificado</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="extras" className="space-y-4">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg">E-mails Adicionais</CardTitle>
                                        <CardDescription>Adicione e-mails que não estão cadastrados</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Adicionar e-mail */}
                                        <div className="flex gap-2">
                                            <Input
                                                value={newEmail}
                                                onChange={(e) => setNewEmail(e.target.value)}
                                                placeholder="email@exemplo.com"
                                                type="email"
                                                onKeyDown={(e) => e.key === 'Enter' && addEmail()}
                                            />
                                            <Button onClick={addEmail}>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Adicionar
                                            </Button>
                                        </div>

                                        {/* Lista de e-mails extras */}
                                        {additionalEmails.length === 0 ? (
                                            <div className="p-8 text-center text-muted-foreground border rounded-lg">
                                                <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                                <p>Nenhum e-mail adicional</p>
                                                <p className="text-sm">Use o campo acima para adicionar e-mails não cadastrados</p>
                                            </div>
                                        ) : (
                                            <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                                                {additionalEmails.map(email => (
                                                    <div key={email} className="flex items-center justify-between p-3">
                                                        <span className="text-sm">{email}</span>
                                                        <div className="flex gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7"
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(email)
                                                                    showToast('E-mail copiado', 'success')
                                                                }}
                                                            >
                                                                <Copy className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-destructive"
                                                                onClick={() => removeEmail(email)}
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

                        {/* Resumo e Enviar */}
                        <Card className={recipientCount > 0 ? 'ring-2 ring-primary' : ''}>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Send className="h-5 w-5 text-green-500" />
                                    Enviar E-mail
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Resumo */}
                                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Assunto:</span>
                                        <span className="font-medium truncate max-w-[200px]">{subject || '(não definido)'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Destinatários:</span>
                                        <span className="font-medium">{recipientCount}</span>
                                    </div>
                                    {selectAll && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Modo:</span>
                                            <Badge>Todos os usuários</Badge>
                                        </div>
                                    )}
                                </div>

                                {/* Resultado do envio */}
                                {sendResult && (
                                    <div className={`p-4 rounded-lg ${sendResult.stats.failed > 0 ? 'bg-yellow-50 dark:bg-yellow-950/20' : 'bg-green-50 dark:bg-green-950/20'}`}>
                                        <div className="flex items-start gap-3">
                                            {sendResult.stats.failed > 0 ? (
                                                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                                            ) : (
                                                <Check className="h-5 w-5 text-green-600 mt-0.5" />
                                            )}
                                            <div>
                                                <p className="font-medium">{sendResult.message}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Enviados: {sendResult.stats.sent} | Falhas: {sendResult.stats.failed}
                                                </p>
                                                {sendResult.errors && sendResult.errors.length > 0 && (
                                                    <details className="mt-2">
                                                        <summary className="text-sm text-destructive cursor-pointer">
                                                            Ver erros ({sendResult.errors.length})
                                                        </summary>
                                                        <ul className="text-xs mt-1 space-y-1">
                                                            {sendResult.errors.map((err, i) => (
                                                                <li key={i} className="text-destructive">{err}</li>
                                                            ))}
                                                        </ul>
                                                    </details>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Botão de envio */}
                                <Button
                                    onClick={sendEmail}
                                    disabled={sending || recipientCount === 0 || !subject || !content}
                                    className="w-full h-12 text-base"
                                    size="lg"
                                >
                                    {sending ? (
                                        <>
                                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-5 w-5 mr-2" />
                                            Enviar para {recipientCount} destinatário{recipientCount !== 1 ? 's' : ''}
                                        </>
                                    )}
                                </Button>

                                {recipientCount > 50 && (
                                    <p className="text-xs text-muted-foreground text-center">
                                        ⚠️ Envios em massa são processados em lotes. Isso pode levar alguns minutos.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Dialog de Preview */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Preview do E-mail</DialogTitle>
                        <DialogDescription>Assunto: {subject || '(sem assunto)'}</DialogDescription>
                    </DialogHeader>
                    <div className="border rounded-lg overflow-hidden">
                        <iframe
                            srcDoc={getPreviewHtml()}
                            className="w-full h-[600px]"
                            title="Email Preview"
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Toast */}
            <ToastAlert
                open={toast.open}
                onOpenChange={(open) => setToast(prev => ({ ...prev, open }))}
                message={toast.message}
                type={toast.type}
            />
        </AppShell>
    )
}
