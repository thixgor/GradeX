'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    ArrowLeft,
    Loader2,
    AlertCircle,
    Eye,
    CheckCircle2,
    XCircle,
    Clock,
    ExternalLink
} from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

interface Report {
    _id: string
    reason: string
    description: string
    status: 'pending' | 'resolved' | 'ignored'
    createdAt: string
    questionId: string
    questionEnunciado: string
    userName: string
    userEmail: string
}

export default function AdminRelatosPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [reports, setReports] = useState<Report[]>([])
    const [statusFilter, setStatusFilter] = useState<string>('pending')
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState({ total: 0, pages: 1 })

    // Modal de detalhes
    const [selectedReport, setSelectedReport] = useState<Report | null>(null)
    const [isUpdating, setIsUpdating] = useState(false)

    useEffect(() => {
        loadReports()
    }, [statusFilter, page])

    async function loadReports() {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.set('status', statusFilter)
            params.set('page', page.toString())
            params.set('limit', '20')

            const res = await fetch(`/api/admin/banco/reports?${params.toString()}`)
            if (res.ok) {
                const data = await res.json()
                setReports(data.reports)
                setPagination(data.pagination)
            }
        } catch (error) {
            console.error('Erro ao carregar relatos:', error)
        } finally {
            setLoading(false)
        }
    }

    async function updateStatus(id: string, newStatus: string) {
        setIsUpdating(true)
        try {
            const res = await fetch(`/api/admin/banco/reports/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            if (res.ok) {
                // Atualizar lista local
                setReports(prev => prev.map(r =>
                    r._id === id ? { ...r, status: newStatus as any } : r
                ))

                if (selectedReport && selectedReport._id === id) {
                    setSelectedReport(prev => prev ? { ...prev, status: newStatus as any } : null)
                }

                // Se estiver filtrando por status, recarregar para remover da lista se necessário
                if (statusFilter !== 'all') {
                    loadReports()
                    setSelectedReport(null)
                }
            }
        } catch (error) {
            console.error('Erro ao atualizar status:', error)
        } finally {
            setIsUpdating(false)
        }
    }

    function getStatusBadge(status: string) {
        switch (status) {
            case 'pending':
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>
            case 'resolved':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Resolvido</Badge>
            case 'ignored':
                return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Ignorado</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    function getReasonLabel(reason: string) {
        const map: Record<string, string> = {
            'erro_gabarito': 'Erro no Gabarito',
            'enunciado_confuso': 'Enunciado Confuso',
            'imagem_ruim': 'Problema na Imagem',
            'conteudo_desatualizado': 'Desatualizado',
            'outros': 'Outros'
        }
        return map[reason] || reason
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" onClick={() => router.push('/admin/banco-questoes')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                </Button>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <AlertCircle className="h-6 w-6 text-orange-500" />
                    Relatos de Erros
                </h1>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Gerenciar Relatos</CardTitle>
                            <CardDescription>Visualize e resolva problemas reportados pelos usuários</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filtrar por status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="pending">Pendentes</SelectItem>
                                    <SelectItem value="resolved">Resolvidos</SelectItem>
                                    <SelectItem value="ignored">Ignorados</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            Nenhum relato encontrado com este filtro.
                        </div>
                    ) : (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Motivo</TableHead>
                                        <TableHead>Usuário</TableHead>
                                        <TableHead>Questão</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reports.map((report) => (
                                        <TableRow key={report._id}>
                                            <TableCell className="whitespace-nowrap">
                                                {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{getReasonLabel(report.reason)}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{report.userName}</span>
                                                    <span className="text-xs text-muted-foreground">{report.userEmail}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[300px]">
                                                <p className="truncate text-sm text-muted-foreground">
                                                    {report.questionEnunciado || 'Enunciado não disponível'}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(report.status)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedReport(report)}
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Detalhes
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Paginação */}
                    {pagination.pages > 1 && (
                        <div className="flex justify-center gap-2 mt-4">
                            <Button
                                variant="outline"
                                disabled={page <= 1}
                                onClick={() => setPage(page - 1)}
                            >
                                Anterior
                            </Button>
                            <span className="py-2 text-sm text-muted-foreground">
                                Página {page} de {pagination.pages}
                            </span>
                            <Button
                                variant="outline"
                                disabled={page >= pagination.pages}
                                onClick={() => setPage(page + 1)}
                            >
                                Próxima
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal De Detalhes */}
            <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Detalhes do Relato</DialogTitle>
                        <DialogDescription>
                            Enviado em {selectedReport && new Date(selectedReport.createdAt).toLocaleString('pt-BR')}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedReport && (
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Motivo</h4>
                                    <div className="text-lg font-medium">{getReasonLabel(selectedReport.reason)}</div>
                                </div>
                                <div>
                                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Status Atual</h4>
                                    <div>{getStatusBadge(selectedReport.status)}</div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-sm text-muted-foreground mb-2">Descrição do Usuário</h4>
                                <div className="p-4 bg-muted rounded-md text-sm whitespace-pre-wrap">
                                    {selectedReport.description || 'Nenhuma descrição fornecida.'}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-sm text-muted-foreground mb-2">Questão Reportada</h4>
                                <div className="border rounded-md p-4">
                                    <p className="text-sm line-clamp-3 mb-2">{selectedReport.questionEnunciado}</p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(`/banco-questoes/${selectedReport.questionId}`, '_blank')}
                                        >
                                            <ExternalLink className="h-3 w-3 mr-2" />
                                            Ver Questão
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(`/admin/banco-questoes/questoes?busca=${selectedReport.questionId}`, '_blank')}
                                        >
                                            <ExternalLink className="h-3 w-3 mr-2" />
                                            Editar no Admin
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-4 border-t">
                                {selectedReport.status !== 'resolved' && (
                                    <Button
                                        onClick={() => updateStatus(selectedReport._id, 'resolved')}
                                        disabled={isUpdating}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                        Marcar como Resolvido
                                    </Button>
                                )}

                                {selectedReport.status !== 'ignored' && (
                                    <Button
                                        variant="outline"
                                        onClick={() => updateStatus(selectedReport._id, 'ignored')}
                                        disabled={isUpdating}
                                        className="text-muted-foreground"
                                    >
                                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                                        Ignorar
                                    </Button>
                                )}

                                {selectedReport.status !== 'pending' && (
                                    <Button
                                        variant="ghost"
                                        onClick={() => updateStatus(selectedReport._id, 'pending')}
                                        disabled={isUpdating}
                                    >
                                        <Clock className="h-4 w-4 mr-2" />
                                        Reabrir (Pendente)
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
