'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppShell } from '@/components/app-shell'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WHATSAPP_TEMPLATES, WHATSAPP_TEMPLATE_CATEGORY_LABELS } from '@/lib/comms/whatsapp-templates'
import {
    ArrowLeft,
    Plus,
    Trash2,
    Type,
    Link2,
    CreditCard,
    Video,
    MoveUp,
    MoveDown,
    Save,
    Users,
    Mail,
    MousePointerClick,
    Download,
    Send,
    Clock,
    Check,
    Copy,
    ExternalLink,
    Share2,
    MapPin,
    Globe,
    BarChart3
} from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { QRCodeSVG } from 'qrcode.react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"

type BlockType = 'text' | 'button' | 'card' | 'embed'
type EmbedType = 'video' | 'podcast' | 'audio'

interface LeadBlock {
    id: string
    type: BlockType
    content?: string
    buttonText?: string
    buttonUrl?: string
    buttonColor?: string
    isPdfButton?: boolean
    cardTitle?: string
    cardDescription?: string
    cardImageUrl?: string
    embedType?: EmbedType
    embedUrl?: string
    embedTitle?: string
    embedDescription?: string
}

interface Lead {
    _id: string
    name: string
    email: string
    ip?: string
    state?: string
    stateCode?: string
    city?: string
    country?: string
    emailSent: boolean
    emailSentAt?: string
    createdAt: string
}

interface StateData {
    stateCode: string
    state: string
    count: number
}

interface LeadCampaign {
    _id: string
    name: string
    slug: string
    description?: string
    imageUrl?: string
    welcomeMessage?: string
    blocks: LeadBlock[]
    collectButtonText?: string
    sendEmail: boolean
    emailSubject?: string
    emailBlocks?: LeadBlock[]
    channels?: ('email' | 'whatsapp')[]
    collectPhone?: boolean
    requirePhone?: boolean
    whatsappTemplate?: string
    defaultPersuasiveTag?: string
    sequenceId?: string
    isActive: boolean
    totalLeads: number
    totalViews: number
    createdAt: string
    updatedAt: string
}

interface Stats {
    totalLeads: number
    uniqueEmails: number
    totalViews: number
}

function generateId() {
    return Math.random().toString(36).substring(2, 11)
}

export default function LeadCampaignDetailsPage() {
    const params = useParams()
    const id = params.id as string
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [campaign, setCampaign] = useState<LeadCampaign | null>(null)
    const [leads, setLeads] = useState<Lead[]>([])
    const [stats, setStats] = useState<Stats>({ totalLeads: 0, uniqueEmails: 0, totalViews: 0 })
    const [stateData, setStateData] = useState<StateData[]>([])
    const [sendingEmailTo, setSendingEmailTo] = useState<string | null>(null)
    const [shareDialogOpen, setShareDialogOpen] = useState(false)

    // Form state
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [welcomeMessage, setWelcomeMessage] = useState('')
    const [collectButtonText, setCollectButtonText] = useState('')
    const [blocks, setBlocks] = useState<LeadBlock[]>([])
    const [sendEmail, setSendEmail] = useState(false)
    const [emailSubject, setEmailSubject] = useState('')
    const [isActive, setIsActive] = useState(true)

    // Comunicação multicanal
    const [collectPhone, setCollectPhone] = useState(true)
    const [requirePhone, setRequirePhone] = useState(false)
    const [sendWhatsapp, setSendWhatsapp] = useState(false)
    const [whatsappTemplate, setWhatsappTemplate] = useState('')
    const [defaultPersuasiveTag, setDefaultPersuasiveTag] = useState('')
    const [sequenceId, setSequenceId] = useState('')
    const [sequences, setSequences] = useState<{ key: string; name: string }[]>([])

    useEffect(() => {
        fetch('/api/admin/leads/sequences', { cache: 'no-store' })
            .then((r) => r.json())
            .then((d) => setSequences(d.sequences || []))
            .catch(() => {})
    }, [])

    useEffect(() => {
        fetchCampaign()
    }, [id])

    async function fetchCampaign() {
        try {
            const res = await fetch(`/api/admin/leads/${id}`)
            const data = await res.json()
            if (data.campaign) {
                const c = data.campaign
                setCampaign(c)
                setName(c.name)
                setDescription(c.description || '')
                setImageUrl(c.imageUrl || '')
                setWelcomeMessage(c.welcomeMessage || 'Aqui está seu material, {nome}!')
                setCollectButtonText(c.collectButtonText || 'Acessar Material')
                setBlocks(c.blocks || [])
                setSendEmail(c.sendEmail || false)
                setEmailSubject(c.emailSubject || '')
                setIsActive(c.isActive)
                setCollectPhone(c.collectPhone !== undefined ? c.collectPhone : true)
                setRequirePhone(c.requirePhone || false)
                setSendWhatsapp(Array.isArray(c.channels) && c.channels.includes('whatsapp'))
                setWhatsappTemplate(c.whatsappTemplate || 'Olá %nome%! 👋 Aqui está seu material *{{campaignName}}*. Qualquer dúvida, é só responder por aqui.')
                setDefaultPersuasiveTag(c.defaultPersuasiveTag || '')
                setSequenceId(c.sequenceId || '')
                setLeads(data.leads || [])
                setStats(data.stats || { totalLeads: 0, uniqueEmails: 0, totalViews: 0 })
                setStateData(data.stateData || [])
            }
        } catch (error) {
            console.error('Erro ao buscar campanha:', error)
        } finally {
            setLoading(false)
        }
    }

    const addBlock = (type: BlockType) => {
        const newBlock: LeadBlock = {
            id: generateId(),
            type,
            buttonColor: '#f57c00',
            embedType: 'video'
        }
        setBlocks([...blocks, newBlock])
    }

    const updateBlock = (id: string, updates: Partial<LeadBlock>) => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b))
    }

    const removeBlock = (id: string) => {
        setBlocks(blocks.filter(b => b.id !== id))
    }

    const moveBlock = (blockId: string, direction: 'up' | 'down') => {
        const index = blocks.findIndex(b => b.id === blockId)
        if (index === -1) return
        if (direction === 'up' && index === 0) return
        if (direction === 'down' && index === blocks.length - 1) return

        const newBlocks = [...blocks]
        const targetIndex = direction === 'up' ? index - 1 : index + 1
        const temp = newBlocks[targetIndex]
        newBlocks[targetIndex] = newBlocks[index]
        newBlocks[index] = temp
        setBlocks(newBlocks)
    }

    const handleSave = async () => {
        if (!name.trim()) {
            alert('Nome é obrigatório')
            return
        }

        setSaving(true)
        try {
            const res = await fetch(`/api/admin/leads/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    description,
                    imageUrl,
                    welcomeMessage,
                    collectButtonText,
                    blocks,
                    sendEmail,
                    emailSubject: emailSubject || `Seu material: ${name}`,
                    emailBlocks: sendEmail ? blocks : [],
                    channels: sendWhatsapp ? ['email', 'whatsapp'] : ['email'],
                    collectPhone,
                    requirePhone: collectPhone && requirePhone,
                    whatsappTemplate: sendWhatsapp ? whatsappTemplate : undefined,
                    defaultPersuasiveTag: defaultPersuasiveTag || undefined,
                    sequenceId: sequenceId || undefined,
                    isActive
                })
            })

            if (res.ok) {
                alert('Campanha salva com sucesso!')
                fetchCampaign()
            } else {
                const error = await res.json()
                alert(error.error || 'Erro ao salvar')
            }
        } catch (error) {
            console.error('Erro ao salvar:', error)
            alert('Erro ao salvar campanha')
        } finally {
            setSaving(false)
        }
    }

    const handleSendEmail = async (leadId: string) => {
        setSendingEmailTo(leadId)
        try {
            const res = await fetch(`/api/admin/leads/${id}/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadId })
            })

            const data = await res.json()

            if (res.ok) {
                alert('Email enviado com sucesso!')
                fetchCampaign()
            } else {
                alert(data.error || 'Erro ao enviar email')
            }
        } catch (error) {
            console.error('Erro ao enviar email:', error)
            alert('Erro ao enviar email')
        } finally {
            setSendingEmailTo(null)
        }
    }

    const exportLeads = () => {
        if (leads.length === 0) {
            alert('Não há leads para exportar')
            return
        }

        const csv = [
            ['Nome', 'Email', 'IP', 'Cidade', 'Estado', 'Email Enviado', 'Data de Cadastro'].join(','),
            ...leads.map(l => [
                `"${l.name}"`,
                l.email,
                l.ip || 'N/A',
                l.city || 'N/A',
                l.state || 'N/A',
                l.emailSent ? 'Sim' : 'Não',
                format(new Date(l.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })
            ].join(','))
        ].join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `leads-${campaign?.slug || 'campanha'}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        alert('Copiado!')
    }

    const shareUrl = campaign ? `${window.location.origin}/lead/${campaign.slug}` : ''

    const renderBlockEditor = (block: LeadBlock) => {
        switch (block.type) {
            case 'text':
                return (
                    <div className="space-y-2">
                        <Label>Conteúdo do Texto</Label>
                        <Textarea
                            value={block.content || ''}
                            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                            placeholder="Digite o texto aqui..."
                            rows={3}
                        />
                    </div>
                )

            case 'button':
                return (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Texto do Botão</Label>
                                <Input
                                    value={block.buttonText || ''}
                                    onChange={(e) => updateBlock(block.id, { buttonText: e.target.value })}
                                    placeholder="Baixar PDF"
                                />
                            </div>
                            <div>
                                <Label>Cor</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={block.buttonColor || '#f57c00'}
                                        onChange={(e) => updateBlock(block.id, { buttonColor: e.target.value })}
                                        className="w-14 h-10 p-1"
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <Label>URL do Link</Label>
                            <Input
                                value={block.buttonUrl || ''}
                                onChange={(e) => updateBlock(block.id, { buttonUrl: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={block.isPdfButton || false}
                                onCheckedChange={(checked) => updateBlock(block.id, { isPdfButton: checked })}
                            />
                            <Label>É PDF</Label>
                        </div>
                    </div>
                )

            case 'card':
                return (
                    <div className="space-y-3">
                        <div>
                            <Label>Título</Label>
                            <Input
                                value={block.cardTitle || ''}
                                onChange={(e) => updateBlock(block.id, { cardTitle: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Descrição</Label>
                            <Textarea
                                value={block.cardDescription || ''}
                                onChange={(e) => updateBlock(block.id, { cardDescription: e.target.value })}
                                rows={2}
                            />
                        </div>
                        <div>
                            <Label>URL da Imagem</Label>
                            <Input
                                value={block.cardImageUrl || ''}
                                onChange={(e) => updateBlock(block.id, { cardImageUrl: e.target.value })}
                            />
                        </div>
                    </div>
                )

            case 'embed':
                return (
                    <div className="space-y-3">
                        <div>
                            <Label>Tipo</Label>
                            <Select
                                value={block.embedType || 'video'}
                                onValueChange={(v) => updateBlock(block.id, { embedType: v as EmbedType })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="video">Vídeo</SelectItem>
                                    <SelectItem value="podcast">Podcast</SelectItem>
                                    <SelectItem value="audio">Áudio</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>URL</Label>
                            <Input
                                value={block.embedUrl || ''}
                                onChange={(e) => updateBlock(block.id, { embedUrl: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Título</Label>
                            <Input
                                value={block.embedTitle || ''}
                                onChange={(e) => updateBlock(block.id, { embedTitle: e.target.value })}
                            />
                        </div>
                    </div>
                )
        }
    }

    const getBlockIcon = (type: BlockType) => {
        switch (type) {
            case 'text': return <Type className="h-4 w-4" />
            case 'button': return <Link2 className="h-4 w-4" />
            case 'card': return <CreditCard className="h-4 w-4" />
            case 'embed': return <Video className="h-4 w-4" />
        }
    }

    if (loading) {
        return (
            <AppShell headerTitle="Carregando...">
                <div className="flex justify-center py-20">
                    <p>Carregando campanha...</p>
                </div>
            </AppShell>
        )
    }

    if (!campaign) {
        return (
            <AppShell headerTitle="Campanha não encontrada">
                <div className="container mx-auto px-4 py-8 text-center">
                    <p className="text-muted-foreground">Esta campanha não existe.</p>
                    <Button onClick={() => router.push('/admin/leads')} className="mt-4">
                        Voltar
                    </Button>
                </div>
            </AppShell>
        )
    }

    return (
        <AppShell headerTitle={campaign.name} headerSubtitle="Gerenciar campanha de leads">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="flex items-center justify-between mb-6">
                    <Button variant="ghost" onClick={() => router.push('/admin/leads')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShareDialogOpen(true)}>
                            <Share2 className="mr-2 h-4 w-4" /> Compartilhar
                        </Button>
                        <Button variant="outline" onClick={() => window.open(`/lead/${campaign.slug}`, '_blank')}>
                            <ExternalLink className="mr-2 h-4 w-4" /> Ver Página
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/20">
                                    <Users className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.totalLeads}</p>
                                    <p className="text-xs text-muted-foreground">Leads coletados</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/20">
                                    <Mail className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.uniqueEmails}</p>
                                    <p className="text-xs text-muted-foreground">Emails únicos</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-orange-500/5 to-orange-500/10">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-orange-500/20">
                                    <MousePointerClick className="h-5 w-5 text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.totalViews}</p>
                                    <p className="text-xs text-muted-foreground">IPs únicos</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="leads" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="leads">Leads ({leads.length})</TabsTrigger>
                        <TabsTrigger value="stats">Estatísticas</TabsTrigger>
                        <TabsTrigger value="edit">Editar Campanha</TabsTrigger>
                    </TabsList>

                    <TabsContent value="leads">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Leads Coletados</CardTitle>
                                    <Button variant="outline" size="sm" onClick={exportLeads}>
                                        <Download className="mr-2 h-4 w-4" /> Exportar CSV
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {leads.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Nenhum lead capturado ainda.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Nome</TableHead>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead>IP</TableHead>
                                                    <TableHead>Localização</TableHead>
                                                    <TableHead>Data</TableHead>
                                                    <TableHead>Email Env.</TableHead>
                                                    <TableHead className="w-[80px]">Ações</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {leads.map((lead) => (
                                                    <TableRow key={lead._id}>
                                                        <TableCell className="font-medium">{lead.name}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-sm truncate max-w-[150px]">{lead.email}</span>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6 shrink-0"
                                                                    onClick={() => copyToClipboard(lead.email)}
                                                                >
                                                                    <Copy className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1">
                                                                <Globe className="h-3 w-3 text-muted-foreground" />
                                                                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{lead.ip || 'N/A'}</code>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {lead.state ? (
                                                                <div className="flex items-center gap-1">
                                                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                                                    <span className="text-sm">
                                                                        {lead.city ? `${lead.city}, ` : ''}{lead.stateCode || lead.state}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground text-sm">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                                            {format(new Date(lead.createdAt), "dd/MM/yy HH:mm", { locale: ptBR })}
                                                        </TableCell>
                                                        <TableCell>
                                                            {lead.emailSent ? (
                                                                <Badge variant="success" className="gap-1">
                                                                    <Check className="h-3 w-3" /> Enviado
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="secondary">Pendente</Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {!lead.emailSent && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleSendEmail(lead._id)}
                                                                    disabled={sendingEmailTo === lead._id}
                                                                >
                                                                    {sendingEmailTo === lead._id ? (
                                                                        <Clock className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <Send className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="stats">
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Gráfico de Distribuição por Estado */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5" />
                                        Leads por Estado
                                    </CardTitle>
                                    <CardDescription>
                                        Distribuição geográfica dos leads capturados
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {stateData.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            Sem dados de localização ainda.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {stateData.map((item, index) => {
                                                const maxCount = Math.max(...stateData.map(s => s.count))
                                                const percentage = (item.count / maxCount) * 100
                                                const colors = [
                                                    'bg-primary',
                                                    'bg-blue-500',
                                                    'bg-green-500',
                                                    'bg-orange-500',
                                                    'bg-purple-500',
                                                    'bg-pink-500',
                                                    'bg-teal-500',
                                                    'bg-indigo-500'
                                                ]
                                                const barColor = colors[index % colors.length]

                                                return (
                                                    <div key={item.stateCode} className="space-y-1">
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="font-medium flex items-center gap-1">
                                                                <MapPin className="h-3 w-3" />
                                                                {item.state || item.stateCode}
                                                            </span>
                                                            <span className="text-muted-foreground">
                                                                {item.count} lead{item.count !== 1 ? 's' : ''}
                                                            </span>
                                                        </div>
                                                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full ${barColor} rounded-full transition-all duration-500`}
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Resumo de IPs */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Globe className="h-5 w-5" />
                                        Resumo de Acessos
                                    </CardTitle>
                                    <CardDescription>
                                        IPs únicos e conversões
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-muted/50 rounded-lg p-4 text-center">
                                                <p className="text-3xl font-bold text-primary">{stats.totalViews}</p>
                                                <p className="text-sm text-muted-foreground">Visualizações</p>
                                            </div>
                                            <div className="bg-muted/50 rounded-lg p-4 text-center">
                                                <p className="text-3xl font-bold text-green-500">{stats.totalLeads}</p>
                                                <p className="text-sm text-muted-foreground">Conversões</p>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-r from-primary/10 to-green-500/10 rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">Taxa de Conversão</span>
                                                <span className="text-2xl font-bold">
                                                    {stats.totalViews > 0
                                                        ? ((stats.totalLeads / stats.totalViews) * 100).toFixed(1)
                                                        : 0}%
                                                </span>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full"
                                                    style={{
                                                        width: `${stats.totalViews > 0
                                                            ? Math.min((stats.totalLeads / stats.totalViews) * 100, 100)
                                                            : 0}%`
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {stateData.length > 0 && (
                                            <div className="border-t pt-4">
                                                <p className="text-sm font-medium mb-2">Top 3 Estados</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {stateData.slice(0, 3).map((item, index) => (
                                                        <Badge key={item.stateCode} variant={index === 0 ? "default" : "secondary"}>
                                                            {index === 0 && '🥇 '}
                                                            {index === 1 && '🥈 '}
                                                            {index === 2 && '🥉 '}
                                                            {item.stateCode}: {item.count}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="edit">
                        <div className="grid gap-6">
                            {/* Informações Básicas */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Informações da Campanha</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Nome *</Label>
                                            <Input value={name} onChange={(e) => setName(e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Imagem de Capa (URL)</Label>
                                            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Descrição</Label>
                                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Mensagem de Boas-vindas</Label>
                                            <Input value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Texto do Botão</Label>
                                            <Input value={collectButtonText} onChange={(e) => setCollectButtonText(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <Switch checked={isActive} onCheckedChange={setIsActive} />
                                            <Label>Ativa</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
                                            <Label>Enviar email automático</Label>
                                        </div>
                                    </div>
                                    {sendEmail && (
                                        <div>
                                            <Label>Assunto do Email</Label>
                                            <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder={`Seu material: ${name}`} />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Comunicação Multicanal */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Comunicação Multicanal</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Switch checked={collectPhone} onCheckedChange={setCollectPhone} />
                                        <Label>Pedir WhatsApp no formulário</Label>
                                    </div>
                                    {collectPhone && (
                                        <div className="flex items-center gap-2 pl-6">
                                            <Switch checked={requirePhone} onCheckedChange={setRequirePhone} />
                                            <Label>Tornar WhatsApp obrigatório</Label>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Switch checked={sendWhatsapp} onCheckedChange={setSendWhatsapp} />
                                        <Label>Enviar o material também por WhatsApp (quem der opt-in)</Label>
                                    </div>
                                    {sendWhatsapp && (
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <Label>Mensagem do 1º toque no WhatsApp</Label>
                                                <select
                                                    defaultValue=""
                                                    onChange={(e) => {
                                                        const tpl = WHATSAPP_TEMPLATES.find((t) => t.key === e.target.value)
                                                        if (tpl) setWhatsappTemplate(tpl.text)
                                                        e.target.value = ''
                                                    }}
                                                    className="h-7 rounded-md border border-input bg-background px-2 text-xs"
                                                >
                                                    <option value="" disabled>Usar template...</option>
                                                    {Object.entries(WHATSAPP_TEMPLATE_CATEGORY_LABELS).map(([cat, catLabel]) => (
                                                        <optgroup key={cat} label={catLabel}>
                                                            {WHATSAPP_TEMPLATES.filter((t) => t.category === cat).map((t) => (
                                                                <option key={t.key} value={t.key}>{t.label}</option>
                                                            ))}
                                                        </optgroup>
                                                    ))}
                                                </select>
                                            </div>
                                            <Textarea
                                                value={whatsappTemplate}
                                                onChange={(e) => setWhatsappTemplate(e.target.value)}
                                                rows={3}
                                                placeholder="Olá %nome%! Aqui está seu material..."
                                                className="mt-1"
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Aceita %nome%, %nome completo%, %cidade% e {'{{campaignName}}'}, {'{{persuasiveTag}}'}, {'{{totalStudents}}'}.
                                            </p>
                                        </div>
                                    )}
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <Label>Tag persuasiva padrão (opcional)</Label>
                                            <Input
                                                value={defaultPersuasiveTag}
                                                onChange={(e) => setDefaultPersuasiveTag(e.target.value)}
                                                placeholder="ex.: aprovação em Clínica Médica"
                                            />
                                        </div>
                                        <div>
                                            <Label>Jornada de nurturing (opcional)</Label>
                                            <select
                                                value={sequenceId}
                                                onChange={(e) => setSequenceId(e.target.value)}
                                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                            >
                                                <option value="">Nenhuma</option>
                                                {sequences.map((s) => (
                                                    <option key={s.key} value={s.key}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Blocos de Conteúdo */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Conteúdo do Material</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {blocks.length === 0 ? (
                                        <div className="text-center py-8 border-2 border-dashed rounded-lg">
                                            <p className="text-muted-foreground">Sem blocos ainda</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {blocks.map((block, index) => (
                                                <div key={block.id} className="border rounded-lg p-4 bg-muted/20">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            {getBlockIcon(block.type)}
                                                            <span className="font-medium capitalize">{block.type}</span>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveBlock(block.id, 'up')} disabled={index === 0}>
                                                                <MoveUp className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveBlock(block.id, 'down')} disabled={index === blocks.length - 1}>
                                                                <MoveDown className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeBlock(block.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    {renderBlockEditor(block)}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                                        <span className="text-sm text-muted-foreground self-center">Adicionar:</span>
                                        <Button variant="outline" size="sm" onClick={() => addBlock('text')}>
                                            <Type className="mr-1 h-4 w-4" /> Texto
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => addBlock('button')}>
                                            <Link2 className="mr-1 h-4 w-4" /> Botão
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => addBlock('card')}>
                                            <CreditCard className="mr-1 h-4 w-4" /> Card
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => addBlock('embed')}>
                                            <Video className="mr-1 h-4 w-4" /> Embed
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex gap-4 justify-end">
                                <Button variant="outline" onClick={() => router.push('/admin/leads')}>
                                    Cancelar
                                </Button>
                                <Button onClick={handleSave} disabled={saving}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                                </Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Share Dialog */}
            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Compartilhar Campanha</DialogTitle>
                        <DialogDescription>
                            Envie o link ou o QR Code para capturar leads
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col items-center gap-6 py-4">
                        <div className="bg-white p-4 rounded-xl border-2 border-primary/10 shadow-sm">
                            <QRCodeSVG
                                value={shareUrl}
                                size={200}
                                level="H"
                                includeMargin={true}
                            />
                        </div>

                        <div className="w-full space-y-2">
                            <Label>Link Direto</Label>
                            <div className="flex gap-2">
                                <Input value={shareUrl} readOnly className="font-mono text-xs" />
                                <Button size="icon" onClick={() => copyToClipboard(shareUrl)}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" className="w-full" onClick={() => setShareDialogOpen(false)}>
                            Fechar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppShell>
    )
}
