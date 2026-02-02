'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppShell } from '@/components/app-shell'
import {
    ArrowLeft,
    Download,
    Trash2,
    User,
    Mail,
    Calendar,
    FileText,
    MessageSquare,
    ChevronDown,
    ChevronUp
} from 'lucide-react'
import { Form, FormResponse } from '@/lib/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function FormResponsesPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const [form, setForm] = useState<Form | null>(null)
    const [responses, setResponses] = useState<FormResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedResponse, setExpandedResponse] = useState<string | null>(null)

    useEffect(() => {
        fetchData()
    }, [id])

    async function fetchData() {
        try {
            const [formRes, respRes] = await Promise.all([
                fetch(`/api/admin/forms/${id}`),
                fetch(`/api/admin/forms/${id}/responses`)
            ])

            const formData = await formRes.json()
            const respData = await respRes.json()

            if (formData.form) setForm(formData.form)
            if (respData.responses) setResponses(respData.responses)
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    async function deleteResponse(responseId: string) {
        if (!confirm('Excluir esta resposta permanentemente?')) return

        try {
            // I haven't implemented DELETE /api/admin/forms/[id]/responses/[respId] yet.
            // For now let's just alert.
            alert('Funcionalidade de exclusão de resposta individual em breve.')
        } catch (error) {
            console.error(error)
        }
    }

    if (loading) return <div className="p-10 text-center">Carregando respostas...</div>

    return (
        <AppShell headerTitle="Respostas do Formulário" headerSubtitle={form?.title || 'Carregando...'}>
            <div className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="flex items-center justify-between mb-8">
                    <Button variant="ghost" onClick={() => router.push('/admin/forms')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => alert('Exportação em CSV em breve.')}>
                            <Download className="mr-2 h-4 w-4" /> Exportar CSV
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4">
                    {responses.length === 0 ? (
                        <Card className="p-20 text-center border-dashed">
                            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-xl font-semibold">Nenhuma resposta recebida ainda</h3>
                            <p className="text-muted-foreground mt-2">Assim que alguém responder ao formulário, as respostas aparecerão aqui.</p>
                        </Card>
                    ) : (
                        responses.map((resp, idx) => (
                            <Card key={resp._id?.toString()} className="overflow-hidden">
                                <div
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => setExpandedResponse(expandedResponse === resp._id?.toString() ? null : resp._id?.toString()!)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {responses.length - idx}
                                        </div>
                                        <div>
                                            <p className="font-semibold flex items-center gap-2">
                                                {resp.userEmail ? (
                                                    <>
                                                        <Mail className="h-3 w-3" /> {resp.userEmail}
                                                    </>
                                                ) : (
                                                    <>
                                                        <User className="h-3 w-3" /> Anônimo
                                                    </>
                                                )}
                                            </p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Calendar className="h-3 w-3" /> {format(new Date(resp.submittedAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {expandedResponse === resp._id?.toString() ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                    </div>
                                </div>

                                {expandedResponse === resp._id?.toString() && (
                                    <CardContent className="bg-muted/20 pt-6 border-t space-y-6">
                                        {form?.blocks.filter(b => b.type === 'question').map(block => {
                                            const answer = resp.answers[block.id]
                                            return (
                                                <div key={block.id} className="space-y-2">
                                                    <p className="font-bold text-sm text-slate-700 flex items-center gap-2">
                                                        <FileText className="h-3 w-3 text-primary" /> {block.title}
                                                    </p>
                                                    <div className="p-3 bg-white rounded-lg border shadow-sm text-sm">
                                                        {Array.isArray(answer) ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {answer.map((a, i) => <Badge key={i} variant="secondary">{a}</Badge>)}
                                                            </div>
                                                        ) : (
                                                            <p className="whitespace-pre-wrap">{answer || '(Sem resposta)'}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}

                                        <div className="flex justify-end pt-4">
                                            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={(e) => {
                                                e.stopPropagation();
                                                deleteResponse(resp._id?.toString()!);
                                            }}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Excluir Resposta
                                            </Button>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </AppShell>
    )
}
