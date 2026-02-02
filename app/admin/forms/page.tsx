'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppShell } from '@/components/app-shell'
import {
    ClipboardList,
    Plus,
    Search,
    MoreVertical,
    Trash2,
    Edit,
    ExternalLink,
    Eye,
    EyeOff,
    Users,
    Calendar,
    Share2,
    MoreHorizontal
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
import { Copy, Download } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface Form {
    _id: string
    title: string
    description: string
    settings: {
        isActive: boolean
        deadline?: string
    }
    responseCount: number
    createdAt: string
    updatedAt: string
}

export default function AdminFormsPage() {
    const router = useRouter()
    const [forms, setForms] = useState<Form[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [idToShare, setIdToShare] = useState<string | null>(null)
    const [shareDialogOpen, setShareDialogOpen] = useState(false)

    useEffect(() => {
        fetchForms()
    }, [])

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        alert('Copiado para a área de transferência!')
    }

    const handleShare = (id: string) => {
        setIdToShare(id)
        setShareDialogOpen(true)
    }

    const shareUrl = idToShare ? `${window.location.origin}/forms/${idToShare}` : ''

    async function fetchForms() {
        try {
            const res = await fetch('/api/admin/forms')
            const data = await res.json()
            if (data.forms) {
                setForms(data.forms)
            }
        } catch (error) {
            console.error('Error fetching forms:', error)
        } finally {
            setLoading(false)
        }
    }

    async function toggleStatus(id: string, currentStatus: boolean) {
        try {
            const res = await fetch(`/api/admin/forms/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings: { isActive: !currentStatus } })
            })
            if (res.ok) {
                setForms(forms.map(f => f._id === id ? { ...f, settings: { ...f.settings, isActive: !currentStatus } } : f))
            }
        } catch (error) {
            console.error('Error toggling status:', error)
        }
    }

    async function deleteForm(id: string) {
        if (!confirm('Tem certeza que deseja excluir este formulário? Esta ação não pode ser desfeita.')) return

        try {
            const res = await fetch(`/api/admin/forms/${id}`, { method: 'DELETE' })
            if (res.ok) {
                setForms(forms.filter(f => f._id !== id))
            }
        } catch (error) {
            console.error('Error deleting form:', error)
        }
    }

    const filteredForms = forms.filter(f =>
        f.title.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <AppShell headerTitle="Pesquisas e Formulários" headerSubtitle="Gerencie suas pesquisas de satisfação, inscrições e feedbacks">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar formulários..."
                            className="w-full pl-10 pr-4 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => router.push('/admin/forms/new')} className="w-full md:w-auto">
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Formulário
                    </Button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <p>Carregando formulários...</p>
                    </div>
                ) : filteredForms.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed rounded-xl">
                        <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold">Nenhum formulário encontrado</h3>
                        <p className="text-muted-foreground mt-2">Comece criando seu primeiro formulário de pesquisa.</p>
                        <Button onClick={() => router.push('/admin/forms/new')} variant="outline" className="mt-6">
                            Criar agora
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredForms.map((form) => (
                            <Card key={form._id} className="flex flex-col hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <Badge variant={form.settings.isActive ? "success" : "secondary"}>
                                            {form.settings.isActive ? "Ativo" : "Inativo"}
                                        </Badge>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => router.push(`/admin/forms/${form._id}`)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => window.open(`/forms/${form._id}`, '_blank')}>
                                                    <ExternalLink className="mr-2 h-4 w-4" /> Ver Público
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => toggleStatus(form._id, form.settings.isActive)}>
                                                    {form.settings.isActive ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                                                    {form.settings.isActive ? "Ocultar" : "Mostrar"}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => deleteForm(form._id)}>
                                                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <CardTitle className="mt-3 line-clamp-1">{form.title}</CardTitle>
                                    <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                                        {form.description || 'Sem descrição'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 pb-4">
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Users className="h-4 w-4" />
                                            <span>{form.responseCount} respostas</span>
                                        </div>
                                        {form.settings.deadline && (
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4 text-orange-500" />
                                                <span className="text-orange-600 font-medium">
                                                    Até {format(new Date(form.settings.deadline), 'dd/MM/yy', { locale: ptBR })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0 flex gap-2">
                                    <Button variant="outline" className="flex-1" onClick={() => router.push(`/admin/forms/${form._id}/responses`)}>
                                        Ver Respostas
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleShare(form._id)}>
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
                        <DialogTitle>Compartilhar Formulário</DialogTitle>
                        <DialogDescription>
                            Envie o link ou o QR Code para seus usuários
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
                        <Button variant="outline" className="w-full" onClick={() => {
                            // Simple download trick for SVG/Canvas if needed, but for now just close
                            setShareDialogOpen(false)
                        }}>
                            Fechar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppShell>
    )
}
