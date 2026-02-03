'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppShell } from '@/components/app-shell'
import {
    Megaphone,
    Plus,
    Search,
    MoreHorizontal,
    Trash2,
    Edit,
    ExternalLink,
    Eye,
    EyeOff,
    Users,
    MousePointerClick,
    Mail,
    Share2,
    Copy
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface LeadCampaign {
    _id: string
    name: string
    slug: string
    description?: string
    imageUrl?: string
    isActive: boolean
    totalLeads: number
    totalViews: number
    sendEmail: boolean
    createdAt: string
    updatedAt: string
}

export default function AdminLeadsPage() {
    const router = useRouter()
    const [campaigns, setCampaigns] = useState<LeadCampaign[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [slugToShare, setSlugToShare] = useState<string | null>(null)
    const [shareDialogOpen, setShareDialogOpen] = useState(false)

    useEffect(() => {
        fetchCampaigns()
    }, [])

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        alert('Copiado para a área de transferência!')
    }

    const handleShare = (slug: string) => {
        setSlugToShare(slug)
        setShareDialogOpen(true)
    }

    const shareUrl = slugToShare ? `${window.location.origin}/lead/${slugToShare}` : ''

    async function fetchCampaigns() {
        try {
            const res = await fetch('/api/admin/leads')
            const data = await res.json()
            if (data.campaigns) {
                setCampaigns(data.campaigns)
            }
        } catch (error) {
            console.error('Erro ao buscar campanhas:', error)
        } finally {
            setLoading(false)
        }
    }

    async function toggleStatus(id: string, currentStatus: boolean) {
        try {
            const res = await fetch(`/api/admin/leads/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentStatus })
            })
            if (res.ok) {
                setCampaigns(campaigns.map(c => c._id === id ? { ...c, isActive: !currentStatus } : c))
            }
        } catch (error) {
            console.error('Erro ao alterar status:', error)
        }
    }

    async function deleteCampaign(id: string) {
        if (!confirm('Tem certeza que deseja excluir esta campanha? Todos os leads coletados serão perdidos.')) return

        try {
            const res = await fetch(`/api/admin/leads/${id}`, { method: 'DELETE' })
            if (res.ok) {
                setCampaigns(campaigns.filter(c => c._id !== id))
            }
        } catch (error) {
            console.error('Erro ao excluir campanha:', error)
        }
    }

    const filteredCampaigns = campaigns.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <AppShell headerTitle="Captura de Leads" headerSubtitle="Gerencie suas campanhas de captura de leads e materiais">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar campanhas..."
                            className="w-full pl-10 pr-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => router.push('/admin/leads/new')} className="w-full md:w-auto">
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Campanha
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <p>Carregando campanhas...</p>
                    </div>
                ) : filteredCampaigns.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed rounded-xl">
                        <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold">Nenhuma campanha encontrada</h3>
                        <p className="text-muted-foreground mt-2">Crie sua primeira campanha de captura de leads.</p>
                        <Button onClick={() => router.push('/admin/leads/new')} variant="outline" className="mt-6">
                            Criar agora
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredCampaigns.map((campaign) => (
                            <Card key={campaign._id} className="flex flex-col hover:shadow-md transition-shadow overflow-hidden">
                                {campaign.imageUrl && (
                                    <div className="h-32 overflow-hidden">
                                        <img
                                            src={campaign.imageUrl}
                                            alt={campaign.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-2">
                                            <Badge variant={campaign.isActive ? "success" : "secondary"}>
                                                {campaign.isActive ? "Ativo" : "Inativo"}
                                            </Badge>
                                            {campaign.sendEmail && (
                                                <Badge variant="outline" className="gap-1">
                                                    <Mail className="h-3 w-3" /> Auto-email
                                                </Badge>
                                            )}
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => router.push(`/admin/leads/${campaign._id}`)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => window.open(`/lead/${campaign.slug}`, '_blank')}>
                                                    <ExternalLink className="mr-2 h-4 w-4" /> Ver Página
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => toggleStatus(campaign._id, campaign.isActive)}>
                                                    {campaign.isActive ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                                                    {campaign.isActive ? "Desativar" : "Ativar"}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => deleteCampaign(campaign._id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <CardTitle className="mt-3 line-clamp-1">{campaign.name}</CardTitle>
                                    <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                                        {campaign.description || `Link: /lead/${campaign.slug}`}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 pb-4">
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Users className="h-4 w-4 text-primary" />
                                            <span className="font-medium">{campaign.totalLeads} leads</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MousePointerClick className="h-4 w-4 text-orange-500" />
                                            <span>{campaign.totalViews} visitas</span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0 flex gap-2">
                                    <Button variant="outline" className="flex-1" onClick={() => router.push(`/admin/leads/${campaign._id}`)}>
                                        Ver Leads
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleShare(campaign.slug)}>
                                        <Share2 className="h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

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
