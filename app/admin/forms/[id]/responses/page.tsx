'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    ChevronUp,
    BarChart3,
    ListChecks,
    Clock,
    TrendingUp,
} from 'lucide-react'
import { Form, FormResponse } from '@/lib/types'
import { format, isToday, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { decodeHtmlEntities } from '@/lib/html-entities'

const CHOICE_TYPES = ['multiple-choice', 'checklist']
const TEXT_TYPES = ['short-text', 'long-text', 'email', 'phone']

function dec(value: unknown): string {
    if (value == null) return ''
    return decodeHtmlEntities(String(value))
}

// Normaliza a resposta de um bloco para um array de strings decodificadas.
function answerToValues(answer: string | string[] | undefined): string[] {
    if (answer == null) return []
    if (Array.isArray(answer)) return answer.map(dec).filter(Boolean)
    const s = dec(answer).trim()
    return s ? [s] : []
}

export default function FormResponsesPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const [form, setForm] = useState<Form | null>(null)
    const [responses, setResponses] = useState<FormResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedResponse, setExpandedResponse] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    useEffect(() => {
        fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        if (!responseId) return
        if (!confirm('Excluir esta resposta permanentemente? Esta ação não pode ser desfeita.')) return

        setDeletingId(responseId)
        try {
            const res = await fetch(`/api/admin/forms/${id}/responses/${responseId}`, {
                method: 'DELETE',
            })
            if (res.ok) {
                setResponses(prev => prev.filter(r => r._id?.toString() !== responseId))
            } else {
                const data = await res.json().catch(() => ({}))
                alert(data.error || 'Não foi possível excluir a resposta.')
            }
        } catch (error) {
            console.error(error)
            alert('Erro de conexão ao excluir a resposta.')
        } finally {
            setDeletingId(null)
        }
    }

    const questionBlocks = useMemo(
        () => (form?.blocks || []).filter(b => b.type === 'question'),
        [form]
    )

    // ── Analytics agregadas ──────────────────────────────────────────
    const stats = useMemo(() => {
        const total = responses.length
        const today = responses.filter(r => isToday(new Date(r.submittedAt))).length
        const weekAgo = subDays(new Date(), 7)
        const last7 = responses.filter(r => new Date(r.submittedAt) >= weekAgo).length
        const withEmail = responses.filter(r => r.userEmail).length
        const lastResponse = total > 0
            ? responses
                .map(r => new Date(r.submittedAt).getTime())
                .reduce((a, b) => Math.max(a, b), 0)
            : null
        return { total, today, last7, withEmail, lastResponse }
    }, [responses])

    // Distribuição por pergunta (para gráficos de barra em perguntas de escolha).
    const perQuestion = useMemo(() => {
        return questionBlocks.map(block => {
            const isChoice = block.questionType && CHOICE_TYPES.includes(block.questionType)
            const isText = block.questionType && TEXT_TYPES.includes(block.questionType)

            // Coleta valores das respostas
            const allValues: string[] = []
            let answeredCount = 0
            for (const r of responses) {
                const vals = answerToValues(r.answers?.[block.id])
                if (vals.length > 0) answeredCount++
                allValues.push(...vals)
            }

            let distribution: { label: string; count: number }[] = []
            if (isChoice) {
                const counts = new Map<string, number>()
                // Semeia com as opções definidas (mesmo com 0 respostas)
                for (const opt of block.options || []) counts.set(dec(opt), 0)
                for (const v of allValues) counts.set(v, (counts.get(v) || 0) + 1)
                distribution = Array.from(counts.entries())
                    .map(([label, count]) => ({ label, count }))
                    .sort((a, b) => b.count - a.count)
            }

            return {
                block,
                isChoice,
                isText,
                answeredCount,
                distribution,
                totalAnswers: allValues.length,
            }
        })
    }, [questionBlocks, responses])

    // Perguntas de texto → "comentários"
    const commentQuestions = useMemo(
        () => perQuestion.filter(q => q.isText || (!q.isChoice && q.block.questionType == null)),
        [perQuestion]
    )
    const hasComments = commentQuestions.some(q => q.answeredCount > 0)

    function exportCSV() {
        if (responses.length === 0) return
        const headers = ['Data', 'E-mail', ...questionBlocks.map(b => dec(b.title || 'Pergunta'))]

        const escape = (val: string) => {
            const needsQuotes = /[",\n;]/.test(val)
            const safe = val.replace(/"/g, '""')
            return needsQuotes ? `"${safe}"` : safe
        }

        const rows = responses.map(r => {
            const cols = [
                format(new Date(r.submittedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
                dec(r.userEmail) || 'Anônimo',
                ...questionBlocks.map(b => answerToValues(r.answers?.[b.id]).join(' | ') || ''),
            ]
            return cols.map(escape).join(',')
        })

        const csv = '﻿' + [headers.map(escape).join(','), ...rows].join('\r\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const slug = dec(form?.title || 'formulario').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        a.download = `respostas-${slug || id}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    if (loading) return <div className="p-10 text-center">Carregando respostas...</div>

    return (
        <AppShell headerTitle="Respostas do Formulário" headerSubtitle={dec(form?.title || '') || 'Carregando...'}>
            <div className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
                    <Button variant="ghost" onClick={() => router.push('/admin/forms')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                    </Button>
                    <Button variant="outline" onClick={exportCSV} disabled={responses.length === 0}>
                        <Download className="mr-2 h-4 w-4" /> Exportar CSV
                    </Button>
                </div>

                {/* Cartões de resumo */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                    <StatCard icon={<MessageSquare className="h-4 w-4" />} label="Total de respostas" value={stats.total} />
                    <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Últimos 7 dias" value={stats.last7} />
                    <StatCard icon={<Clock className="h-4 w-4" />} label="Hoje" value={stats.today} />
                    <StatCard
                        icon={<Calendar className="h-4 w-4" />}
                        label="Última resposta"
                        value={stats.lastResponse ? format(new Date(stats.lastResponse), 'dd/MM HH:mm', { locale: ptBR }) : '—'}
                        small
                    />
                </div>

                <Tabs defaultValue="responses">
                    <TabsList className="mb-4">
                        <TabsTrigger value="responses">
                            <ListChecks className="mr-2 h-4 w-4" /> Respostas
                        </TabsTrigger>
                        <TabsTrigger value="analytics">
                            <BarChart3 className="mr-2 h-4 w-4" /> Análise
                        </TabsTrigger>
                        <TabsTrigger value="comments">
                            <MessageSquare className="mr-2 h-4 w-4" /> Comentários
                        </TabsTrigger>
                    </TabsList>

                    {/* ── Tab: Respostas individuais ── */}
                    <TabsContent value="responses">
                        <div className="grid gap-4">
                            {responses.length === 0 ? (
                                <EmptyState />
                            ) : (
                                responses.map((resp, idx) => {
                                    const rid = resp._id?.toString()
                                    const expanded = expandedResponse === rid
                                    return (
                                        <Card key={rid} className="overflow-hidden">
                                            <div
                                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                                                onClick={() => setExpandedResponse(expanded ? null : rid ?? null)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                        {responses.length - idx}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold flex items-center gap-2">
                                                            {resp.userEmail ? (
                                                                <><Mail className="h-3 w-3" /> {dec(resp.userEmail)}</>
                                                            ) : (
                                                                <><User className="h-3 w-3" /> Anônimo</>
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" /> {format(new Date(resp.submittedAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                                </div>
                                            </div>

                                            {expanded && (
                                                <CardContent className="bg-muted/20 pt-6 border-t space-y-6">
                                                    {questionBlocks.map(block => {
                                                        const values = answerToValues(resp.answers?.[block.id])
                                                        return (
                                                            <div key={block.id} className="space-y-2">
                                                                <p className="font-bold text-sm text-foreground flex items-center gap-2">
                                                                    <FileText className="h-3 w-3 text-primary" /> {dec(block.title)}
                                                                </p>
                                                                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border shadow-sm text-sm text-slate-900 dark:text-slate-100">
                                                                    {Array.isArray(resp.answers?.[block.id]) ? (
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {values.length > 0
                                                                                ? values.map((a, i) => <Badge key={i} variant="secondary">{a}</Badge>)
                                                                                : <span className="text-muted-foreground">(Sem resposta)</span>}
                                                                        </div>
                                                                    ) : (
                                                                        <p className="whitespace-pre-wrap">{values[0] || '(Sem resposta)'}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}

                                                    <div className="flex justify-end pt-4">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive hover:bg-destructive/10"
                                                            disabled={deletingId === rid}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                if (rid) deleteResponse(rid)
                                                            }}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            {deletingId === rid ? 'Excluindo...' : 'Excluir Resposta'}
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            )}
                                        </Card>
                                    )
                                })
                            )}
                        </div>
                    </TabsContent>

                    {/* ── Tab: Análise ── */}
                    <TabsContent value="analytics">
                        {responses.length === 0 ? (
                            <EmptyState />
                        ) : (
                            <div className="grid gap-4">
                                {perQuestion.map(({ block, isChoice, answeredCount, distribution }) => (
                                    <Card key={block.id}>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base flex items-start gap-2">
                                                <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                                <span>{dec(block.title)}</span>
                                            </CardTitle>
                                            <p className="text-xs text-muted-foreground pl-6">
                                                {answeredCount} de {stats.total} responderam
                                                {block.questionType ? ` · ${questionTypeLabel(block.questionType)}` : ''}
                                            </p>
                                        </CardHeader>
                                        <CardContent>
                                            {isChoice ? (
                                                distribution.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground">Sem opções.</p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {distribution.map((d, i) => {
                                                            const pct = answeredCount > 0 ? Math.round((d.count / answeredCount) * 100) : 0
                                                            return (
                                                                <div key={i} className="space-y-1">
                                                                    <div className="flex items-center justify-between text-sm">
                                                                        <span className="truncate pr-2">{d.label}</span>
                                                                        <span className="text-muted-foreground shrink-0 tabular-nums">
                                                                            {d.count} ({pct}%)
                                                                        </span>
                                                                    </div>
                                                                    <Progress value={pct} className="h-2" />
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    Pergunta aberta — veja as respostas na aba <strong>Comentários</strong>.
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* ── Tab: Comentários (respostas abertas) ── */}
                    <TabsContent value="comments">
                        {!hasComments ? (
                            <Card className="p-16 text-center border-dashed">
                                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold">Nenhum comentário ainda</h3>
                                <p className="text-muted-foreground mt-2 text-sm">
                                    As respostas de perguntas abertas (texto) aparecerão aqui.
                                </p>
                            </Card>
                        ) : (
                            <div className="grid gap-6">
                                {commentQuestions.filter(q => q.answeredCount > 0).map(({ block }) => (
                                    <div key={block.id}>
                                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4 text-primary" />
                                            {dec(block.title)}
                                            <Badge variant="secondary" className="ml-1">
                                                {responses.filter(r => answerToValues(r.answers?.[block.id]).length > 0).length}
                                            </Badge>
                                        </h3>
                                        <div className="grid gap-3">
                                            {responses
                                                .map(r => ({ r, text: answerToValues(r.answers?.[block.id]).join(', ') }))
                                                .filter(x => x.text)
                                                .map(({ r, text }) => (
                                                    <Card key={r._id?.toString()} className="p-4">
                                                        <p className="text-sm whitespace-pre-wrap text-slate-900 dark:text-slate-100">
                                                            “{text}”
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                                                            {r.userEmail ? (
                                                                <><Mail className="h-3 w-3" /> {dec(r.userEmail)}</>
                                                            ) : (
                                                                <><User className="h-3 w-3" /> Anônimo</>
                                                            )}
                                                            <span>·</span>
                                                            <Calendar className="h-3 w-3" />
                                                            {format(new Date(r.submittedAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                                        </p>
                                                    </Card>
                                                ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </AppShell>
    )
}

function StatCard({ icon, label, value, small }: { icon: React.ReactNode; label: string; value: React.ReactNode; small?: boolean }) {
    return (
        <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                {icon}
                <span className="truncate">{label}</span>
            </div>
            <p className={small ? 'text-lg font-bold' : 'text-2xl font-bold'}>{value}</p>
        </Card>
    )
}

function EmptyState() {
    return (
        <Card className="p-20 text-center border-dashed">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">Nenhuma resposta recebida ainda</h3>
            <p className="text-muted-foreground mt-2">Assim que alguém responder ao formulário, as respostas aparecerão aqui.</p>
        </Card>
    )
}

function questionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        'short-text': 'Texto curto',
        'long-text': 'Texto longo',
        'email': 'E-mail',
        'phone': 'Telefone',
        'multiple-choice': 'Múltipla escolha',
        'checklist': 'Checklist',
    }
    return labels[type] || type
}
