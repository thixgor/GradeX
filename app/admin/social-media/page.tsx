'use client'

import { useEffect, useRef, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
    Mail, MessageCircle, Send, History, Route, Loader2, Check, AlertCircle, Eye, Sparkles, X, Users, Zap,
    LayoutTemplate, Type, FileText, List, Link2, Image as ImageIcon, MessageSquareQuote, Trash2, MoveUp, MoveDown,
} from 'lucide-react'
import { WHATSAPP_TEMPLATES, WHATSAPP_TEMPLATE_CATEGORY_LABELS } from '@/lib/comms/whatsapp-templates'
import { EMAIL_BLOCK_LABELS, makeEmailBlock, renderEmailBlocksHtml } from '@/lib/comms/email-blocks'
import type { EmailBlock, EmailBlockType } from '@/lib/comms/email-blocks'

type Channel = 'email' | 'whatsapp'
type Audience = 'all-users' | 'contacts' | 'campaign' | 'manual'
type Tab = 'compose' | 'history' | 'journeys'

interface HistoryMsg {
    _id: string
    channel: Channel
    status: string
    to: { email?: string; phoneE164?: string; name?: string }
    templateKey: string
    attempts: number
    lastError?: string
    createdAt: string
}

interface Sequence {
    _id: string
    key: string
    name: string
    description?: string
    steps: { label?: string; delayMinutes: number; channels: Channel[] }[]
    isActive: boolean
}

interface Enrollment {
    _id: string
    sequenceKey: string
    to: { email?: string; phoneE164?: string; name?: string }
    currentStep: number
    nextRunAt: string
    status: 'active' | 'completed' | 'stopped'
    enrolledAt: string
}

const STATUS_COLORS: Record<string, string> = {
    sent: 'bg-green-500/15 text-green-600',
    delivered: 'bg-green-500/15 text-green-600',
    pending: 'bg-amber-500/15 text-amber-600',
    processing: 'bg-sky-500/15 text-sky-600',
    failed: 'bg-orange-500/15 text-orange-600',
    dead: 'bg-red-500/15 text-red-600',
    skipped: 'bg-gray-500/15 text-gray-500',
}

// Tokens de personalização disponíveis (resolvidos por destinatário no envio real).
const TOKENS: { token: string; label: string }[] = [
    { token: '{{firstName}}', label: 'Nome' },
    { token: '{{cidade}}', label: 'Cidade' },
    { token: '{{persuasiveTag}}', label: 'Tag persuasiva' },
    { token: '{{totalStudents}}', label: 'Total de estudantes' },
    { token: '{{campaignLeads}}', label: 'Leads da campanha' },
    { token: '{{campaignName}}', label: 'Nome da campanha' },
    { token: '{{authority}}', label: 'Autoridade' },
]

function insertAtCursor(
    el: HTMLTextAreaElement | HTMLInputElement | null,
    value: string,
    setValue: (v: string) => void,
    token: string,
) {
    if (!el) {
        setValue(value + token)
        return
    }
    const start = el.selectionStart ?? value.length
    const end = el.selectionEnd ?? value.length
    const next = value.slice(0, start) + token + value.slice(end)
    setValue(next)
    requestAnimationFrame(() => {
        el.focus()
        const pos = start + token.length
        el.setSelectionRange(pos, pos)
    })
}

function TokenToolbar({
    fieldRef,
    value,
    setValue,
}: {
    fieldRef: React.RefObject<HTMLTextAreaElement | HTMLInputElement>
    value: string
    setValue: (v: string) => void
}) {
    return (
        <div className="flex flex-wrap gap-1.5">
            {TOKENS.map((t) => (
                <button
                    key={t.token}
                    type="button"
                    onClick={() => insertAtCursor(fieldRef.current, value, setValue, t.token)}
                    className="rounded-full border border-dashed border-input px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    title={t.token}
                >
                    + {t.label}
                </button>
            ))}
        </div>
    )
}

const EMAIL_BLOCK_ICONS: Record<EmailBlockType, typeof Type> = {
    hero: Type,
    text: FileText,
    highlight: Sparkles,
    list: List,
    button: Link2,
    image: ImageIcon,
    quote: MessageSquareQuote,
}

/** Campos de edição por tipo de bloco de e-mail — mesmo padrão de /admin/emails. */
function EmailBlockFields({ block, onChange }: { block: EmailBlock; onChange: (u: Partial<EmailBlock>) => void }) {
    switch (block.type) {
        case 'hero':
        case 'highlight':
            return (
                <div className="space-y-2">
                    <Input value={block.title || ''} onChange={(e) => onChange({ title: e.target.value })} placeholder="Título" className="h-8 text-sm" />
                    <Textarea value={block.text || ''} onChange={(e) => onChange({ text: e.target.value })} placeholder="Texto" rows={2} className="text-sm" />
                </div>
            )
        case 'text':
            return <Textarea value={block.text || ''} onChange={(e) => onChange({ text: e.target.value })} placeholder="Texto (use **negrito** e linha em branco para novo parágrafo)" rows={3} className="text-sm" />
        case 'list':
            return (
                <div className="space-y-2">
                    <Input value={block.title || ''} onChange={(e) => onChange({ title: e.target.value })} placeholder="Título da lista (opcional)" className="h-8 text-sm" />
                    <Textarea
                        value={(block.items || []).join('\n')}
                        onChange={(e) => onChange({ items: e.target.value.split('\n') })}
                        placeholder={'Um item por linha'}
                        rows={3}
                        className="text-sm"
                    />
                </div>
            )
        case 'button':
            return (
                <div className="grid grid-cols-2 gap-2">
                    <Input value={block.buttonText || ''} onChange={(e) => onChange({ buttonText: e.target.value })} placeholder="Texto do botão" className="h-8 text-sm" />
                    <Input value={block.url || ''} onChange={(e) => onChange({ url: e.target.value })} placeholder="URL (https://...)" className="h-8 text-sm" />
                </div>
            )
        case 'image':
            return (
                <div className="grid grid-cols-2 gap-2">
                    <Input value={block.imageUrl || ''} onChange={(e) => onChange({ imageUrl: e.target.value })} placeholder="URL da imagem" className="h-8 text-sm" />
                    <Input value={block.alt || ''} onChange={(e) => onChange({ alt: e.target.value })} placeholder="Texto alternativo" className="h-8 text-sm" />
                </div>
            )
        case 'quote':
            return (
                <div className="space-y-2">
                    <Textarea value={block.text || ''} onChange={(e) => onChange({ text: e.target.value })} placeholder="Depoimento/citação" rows={2} className="text-sm" />
                    <Input value={block.author || ''} onChange={(e) => onChange({ author: e.target.value })} placeholder="Autor (opcional)" className="h-8 text-sm" />
                </div>
            )
        default:
            return null
    }
}

export default function SocialMediaPage() {
    const [tab, setTab] = useState<Tab>('compose')

    // Compose state
    const [channels, setChannels] = useState<Channel[]>(['email'])
    const [audience, setAudience] = useState<Audience>('contacts')
    const [campaignId, setCampaignId] = useState('')
    const [subject, setSubject] = useState('')
    const [content, setContent] = useState('')
    const [contentMode, setContentMode] = useState<'blocks' | 'html'>('blocks')
    const [emailBlocks, setEmailBlocks] = useState<EmailBlock[]>([])
    const [previewText, setPreviewText] = useState('')
    const [waText, setWaText] = useState('')
    const [manualRecipients, setManualRecipients] = useState('')
    const [manualPersuasiveTag, setManualPersuasiveTag] = useState('')
    const [checkConsent, setCheckConsent] = useState(true)
    const [assumeGranted, setAssumeGranted] = useState(false)
    const [sending, setSending] = useState(false)
    const [result, setResult] = useState<{ ok: boolean; message: string; skipped?: Record<string, number>; invalid?: string[] } | null>(null)

    const subjectRef = useRef<HTMLInputElement>(null)
    const contentRef = useRef<HTMLTextAreaElement>(null)
    const waTextRef = useRef<HTMLTextAreaElement>(null)

    // Preview modal state
    const [previewOpen, setPreviewOpen] = useState(false)
    const [previewLoading, setPreviewLoading] = useState(false)
    const [previewSampleName, setPreviewSampleName] = useState('Maria Estudante')
    const [previewSampleCity, setPreviewSampleCity] = useState('São Paulo')
    const [previewTag, setPreviewTag] = useState('')
    const [previewData, setPreviewData] = useState<{ emailSubject?: string; emailHtml?: string; whatsappText?: string } | null>(null)
    const [previewChannel, setPreviewChannel] = useState<Channel>('email')

    // History state
    const [messages, setMessages] = useState<HistoryMsg[]>([])
    const [stats, setStats] = useState<Record<string, number>>({})
    const [loadingHistory, setLoadingHistory] = useState(false)
    const [dispatching, setDispatching] = useState(false)

    // Journeys state
    const [sequences, setSequences] = useState<Sequence[]>([])
    const [seeding, setSeeding] = useState(false)
    const [expandedSequence, setExpandedSequence] = useState<string | null>(null)
    const [enrollments, setEnrollments] = useState<Enrollment[]>([])
    const [loadingEnrollments, setLoadingEnrollments] = useState(false)
    const [cancelingId, setCancelingId] = useState<string | null>(null)

    const toggleChannel = (c: Channel) =>
        setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))

    // Enquanto no modo "Blocos", o HTML final é sempre derivado dos blocos.
    useEffect(() => {
        if (contentMode === 'blocks') setContent(renderEmailBlocksHtml(emailBlocks))
    }, [emailBlocks, contentMode])

    const addEmailBlock = (type: EmailBlockType) => setEmailBlocks((prev) => [...prev, makeEmailBlock(type)])
    const updateEmailBlock = (id: string, updates: Partial<EmailBlock>) =>
        setEmailBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)))
    const removeEmailBlock = (id: string) => setEmailBlocks((prev) => prev.filter((b) => b.id !== id))
    const moveEmailBlock = (id: string, dir: 'up' | 'down') =>
        setEmailBlocks((prev) => {
            const i = prev.findIndex((b) => b.id === id)
            if (i === -1) return prev
            const j = dir === 'up' ? i - 1 : i + 1
            if (j < 0 || j >= prev.length) return prev
            const next = [...prev]
            ;[next[i], next[j]] = [next[j], next[i]]
            return next
        })

    // Assume consentimento por padrão para público "manual" ou "todos os usuários".
    useEffect(() => {
        setAssumeGranted(audience === 'manual' || audience === 'all-users')
    }, [audience])

    useEffect(() => {
        if (audience === 'manual' && manualPersuasiveTag) setPreviewTag(manualPersuasiveTag)
    }, [audience, manualPersuasiveTag])

    const manualCount = manualRecipients
        .split(/[\n,;]+/)
        .map((l) => l.trim())
        .filter(Boolean).length

    const openPreview = async () => {
        setPreviewOpen(true)
        setPreviewLoading(true)
        setPreviewChannel(channels.includes('email') ? 'email' : 'whatsapp')
        try {
            const res = await fetch('/api/admin/social-media/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: channels.includes('email') ? subject : undefined,
                    content: channels.includes('email') ? content : undefined,
                    previewText: channels.includes('email') ? previewText : undefined,
                    whatsappText: channels.includes('whatsapp') ? waText : undefined,
                    sampleName: previewSampleName,
                    sampleCity: previewSampleCity,
                    persuasiveTag: previewTag || manualPersuasiveTag,
                    campaignId: audience === 'campaign' ? campaignId : undefined,
                }),
            })
            const data = await res.json()
            setPreviewData(data)
        } finally {
            setPreviewLoading(false)
        }
    }

    const send = async () => {
        setResult(null)
        if (channels.length === 0) return setResult({ ok: false, message: 'Selecione ao menos um canal' })
        if (audience === 'manual' && manualCount === 0) {
            return setResult({ ok: false, message: 'Cole ao menos um e-mail ou telefone na lista manual' })
        }
        setSending(true)
        try {
            const res = await fetch('/api/admin/social-media/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channels,
                    audience,
                    campaignId: audience === 'campaign' ? campaignId : undefined,
                    manualRecipients: audience === 'manual' ? manualRecipients : undefined,
                    manualPersuasiveTag: audience === 'manual' ? manualPersuasiveTag : undefined,
                    email: channels.includes('email') ? { subject, content, previewText } : undefined,
                    whatsapp: channels.includes('whatsapp') ? { text: waText } : undefined,
                    checkConsent,
                    assumeGranted,
                }),
            })
            const data = await res.json()
            setResult({
                ok: res.ok,
                message: res.ok ? data.message : data.error || 'Erro',
                skipped: data.skipped,
                invalid: data.invalidManualEntries,
            })
        } catch {
            setResult({ ok: false, message: 'Erro de rede' })
        } finally {
            setSending(false)
        }
    }

    const loadHistory = async () => {
        setLoadingHistory(true)
        try {
            const res = await fetch('/api/admin/social-media/history?limit=100', { cache: 'no-store' })
            const data = await res.json()
            setMessages(data.messages || [])
            setStats(data.stats || {})
        } finally {
            setLoadingHistory(false)
        }
    }

    const dispatchNow = async () => {
        setDispatching(true)
        try {
            await fetch('/api/admin/social-media/dispatch-now', { method: 'POST' })
            await loadHistory()
        } finally {
            setDispatching(false)
        }
    }

    const loadSequences = async () => {
        const res = await fetch('/api/admin/social-media/sequences', { cache: 'no-store' })
        const data = await res.json()
        setSequences(data.sequences || [])
    }

    const seedDefault = async () => {
        setSeeding(true)
        try {
            await fetch('/api/admin/social-media/sequences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'seed-default' }),
            })
            await loadSequences()
        } finally {
            setSeeding(false)
        }
    }

    const toggleEnrollments = async (sequenceKey: string) => {
        if (expandedSequence === sequenceKey) {
            setExpandedSequence(null)
            return
        }
        setExpandedSequence(sequenceKey)
        setLoadingEnrollments(true)
        try {
            const res = await fetch(`/api/admin/social-media/enrollments?sequenceKey=${encodeURIComponent(sequenceKey)}&status=active&limit=200`, { cache: 'no-store' })
            const data = await res.json()
            setEnrollments(data.enrollments || [])
        } finally {
            setLoadingEnrollments(false)
        }
    }

    const cancelEnrollment = async (enrollmentId: string) => {
        setCancelingId(enrollmentId)
        try {
            await fetch('/api/admin/social-media/enrollments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'cancel', enrollmentId }),
            })
            setEnrollments((prev) => prev.filter((e) => e._id !== enrollmentId))
        } finally {
            setCancelingId(null)
        }
    }

    const cancelAllForSequence = async (sequenceKey: string) => {
        if (!confirm('Cancelar TODAS as matrículas ativas desta jornada? Quem já está nela para de receber os próximos passos.')) return
        setLoadingEnrollments(true)
        try {
            await fetch('/api/admin/social-media/enrollments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'cancel-all', sequenceKey }),
            })
            setEnrollments([])
        } finally {
            setLoadingEnrollments(false)
        }
    }

    useEffect(() => {
        if (tab === 'history') loadHistory()
        if (tab === 'journeys') loadSequences()
    }, [tab])

    return (
        <AppShell headerTitle="Social-Media" headerSubtitle="Central unificada de comunicação (E-mail + WhatsApp)">
            <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
                {/* Tabs */}
                <div className="flex gap-2 border-b">
                    {([
                        ['compose', 'Nova comunicação', Send],
                        ['history', 'Histórico', History],
                        ['journeys', 'Jornadas', Route],
                    ] as [Tab, string, typeof Send][]).map(([id, label, Icon]) => (
                        <button
                            key={id}
                            onClick={() => setTab(id)}
                            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                                tab === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* ── Nova comunicação ── */}
                {tab === 'compose' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Nova comunicação</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div>
                                <Label className="mb-2 block">Canais</Label>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => toggleChannel('email')}
                                        className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${
                                            channels.includes('email') ? 'border-primary bg-primary/10 text-primary' : 'border-input'
                                        }`}
                                    >
                                        <Mail className="h-4 w-4" /> E-mail
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => toggleChannel('whatsapp')}
                                        className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm ${
                                            channels.includes('whatsapp') ? 'border-green-500 bg-green-500/10 text-green-600' : 'border-input'
                                        }`}
                                    >
                                        <MessageCircle className="h-4 w-4" /> WhatsApp
                                    </button>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="audience" className="mb-2 block">Público</Label>
                                <select
                                    id="audience"
                                    value={audience}
                                    onChange={(e) => setAudience(e.target.value as Audience)}
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    <option value="contacts">Contatos (base unificada com consentimento)</option>
                                    <option value="all-users">Todos os usuários cadastrados (e-mail)</option>
                                    <option value="campaign">Leads de uma campanha específica</option>
                                    <option value="manual">Lista manual (colar e-mails/telefones)</option>
                                </select>

                                {audience === 'campaign' && (
                                    <Input
                                        value={campaignId}
                                        onChange={(e) => setCampaignId(e.target.value)}
                                        placeholder="ID da campanha de leads"
                                        className="mt-2"
                                    />
                                )}

                                {audience === 'manual' && (
                                    <div className="mt-3 space-y-3 rounded-lg border border-dashed p-4">
                                        <div>
                                            <Label htmlFor="manual-recipients">
                                                Destinatários (um e-mail ou telefone por linha) — {manualCount} detectado(s)
                                            </Label>
                                            <Textarea
                                                id="manual-recipients"
                                                value={manualRecipients}
                                                onChange={(e) => setManualRecipients(e.target.value)}
                                                rows={6}
                                                placeholder={'aluno1@gmail.com\n+55 11 99999-8888\naluno2@hotmail.com'}
                                                className="mt-1 font-mono text-xs"
                                            />
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Detecção automática: e-mails vão pro canal E-mail, telefones vão pro canal WhatsApp.
                                            </p>
                                        </div>
                                        <div>
                                            <Label htmlFor="manual-tag">Tag persuasiva (opcional, aplicada a todos)</Label>
                                            <Input
                                                id="manual-tag"
                                                value={manualPersuasiveTag}
                                                onChange={(e) => setManualPersuasiveTag(e.target.value)}
                                                placeholder="ex.: aprovação em Clínica Médica"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {channels.includes('email') && (
                                <div className="space-y-3 rounded-lg border border-dashed p-4">
                                    <div className="flex items-center gap-2 text-sm font-medium"><Mail className="h-4 w-4" /> E-mail</div>
                                    <div>
                                        <Label htmlFor="subject">Assunto</Label>
                                        <Input id="subject" ref={subjectRef} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Assunto — aceita %nome% e {{tokens}}" />
                                        <div className="mt-1.5"><TokenToolbar fieldRef={subjectRef} value={subject} setValue={setSubject} /></div>
                                    </div>
                                    <div>
                                        <Label htmlFor="preview">Preview (opcional)</Label>
                                        <Input id="preview" value={previewText} onChange={(e) => setPreviewText(e.target.value)} placeholder="Texto de pré-visualização" />
                                    </div>
                                    <div>
                                        <div className="mb-1.5 flex items-center justify-between">
                                            <Label>Conteúdo</Label>
                                            <div className="flex gap-1 rounded-md border p-0.5 text-xs">
                                                <button
                                                    type="button"
                                                    onClick={() => setContentMode('blocks')}
                                                    className={`rounded px-2 py-1 ${contentMode === 'blocks' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                                                >
                                                    Blocos
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setContentMode('html')}
                                                    className={`rounded px-2 py-1 ${contentMode === 'html' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                                                >
                                                    HTML avançado
                                                </button>
                                            </div>
                                        </div>

                                        {contentMode === 'blocks' ? (
                                            <div className="space-y-3">
                                                {emailBlocks.length === 0 && (
                                                    <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                                                        Adicione blocos abaixo para montar o e-mail visualmente.
                                                    </p>
                                                )}
                                                {emailBlocks.map((block, index) => (
                                                    <div key={block.id} className="rounded-lg border bg-muted/20 p-3">
                                                        <div className="mb-2 flex items-center justify-between">
                                                            <span className="text-xs font-medium text-muted-foreground">
                                                                {EMAIL_BLOCK_LABELS[block.type]} #{index + 1}
                                                            </span>
                                                            <div className="flex gap-1">
                                                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" disabled={index === 0} onClick={() => moveEmailBlock(block.id, 'up')}>
                                                                    <MoveUp className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" disabled={index === emailBlocks.length - 1} onClick={() => moveEmailBlock(block.id, 'down')}>
                                                                    <MoveDown className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeEmailBlock(block.id)}>
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <EmailBlockFields block={block} onChange={(u) => updateEmailBlock(block.id, u)} />
                                                    </div>
                                                ))}
                                                <div className="flex flex-wrap gap-1.5 border-t pt-3">
                                                    {(['hero', 'text', 'highlight', 'list', 'button', 'image', 'quote'] as EmailBlockType[]).map((type) => {
                                                        const Icon = EMAIL_BLOCK_ICONS[type]
                                                        return (
                                                            <Button key={type} type="button" variant="outline" size="sm" onClick={() => addEmailBlock(type)}>
                                                                <Icon className="mr-1 h-3.5 w-3.5" /> {EMAIL_BLOCK_LABELS[type]}
                                                            </Button>
                                                        )
                                                    })}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Aceita %nome%, %nome completo% e %cidade% em qualquer texto/título.
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                <Textarea id="content" ref={contentRef} value={content} onChange={(e) => setContent(e.target.value)} rows={6} placeholder="<div class='hero-block'><h1>Olá %nome%</h1>...</div>" />
                                                <div className="mt-1.5"><TokenToolbar fieldRef={contentRef} value={content} setValue={setContent} /></div>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Também aceita %nome%, %nome completo% (se houver sobrenome) e %cidade% (se o
                                                    destinatário tiver cidade cadastrada). Trocar para "Blocos" substitui este HTML.
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {channels.includes('whatsapp') && (
                                <div className="space-y-3 rounded-lg border border-dashed p-4">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 text-sm font-medium"><MessageCircle className="h-4 w-4" /> WhatsApp</div>
                                        <div className="flex items-center gap-1.5">
                                            <LayoutTemplate className="h-3.5 w-3.5 text-muted-foreground" />
                                            <select
                                                defaultValue=""
                                                onChange={(e) => {
                                                    const tpl = WHATSAPP_TEMPLATES.find((t) => t.key === e.target.value)
                                                    if (tpl) setWaText(tpl.text)
                                                    e.target.value = ''
                                                }}
                                                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                                            >
                                                <option value="" disabled>
                                                    Usar template...
                                                </option>
                                                {Object.entries(WHATSAPP_TEMPLATE_CATEGORY_LABELS).map(([cat, catLabel]) => (
                                                    <optgroup key={cat} label={catLabel}>
                                                        {WHATSAPP_TEMPLATES.filter((t) => t.category === cat).map((t) => (
                                                            <option key={t.key} value={t.key}>{t.label}</option>
                                                        ))}
                                                    </optgroup>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <Textarea ref={waTextRef} value={waText} onChange={(e) => setWaText(e.target.value)} rows={4} placeholder="Texto da mensagem. Aceita %nome%, %nome completo%, %cidade%, {{persuasiveTag}}." />
                                    <TokenToolbar fieldRef={waTextRef} value={waText} setValue={setWaText} />
                                    <p className="text-xs text-muted-foreground">
                                        %nome%/%cidade% usam os dados reais do destinatário (só se cadastrados);
                                        {'{{...}}'} são as variáveis de persuasão acima.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <input type="checkbox" checked={checkConsent} onChange={(e) => setCheckConsent(e.target.checked)} className="accent-primary" />
                                    Respeitar consentimento (LGPD) — recomendado
                                </label>
                                {checkConsent && (
                                    <label className="flex items-center gap-2 pl-6 text-sm text-muted-foreground">
                                        <input type="checkbox" checked={assumeGranted} onChange={(e) => setAssumeGranted(e.target.checked)} className="accent-primary" />
                                        Assumir consentimento quando não houver registro prévio
                                        {audience === 'manual' && <span className="text-xs">(padrão ligado para listas manuais)</span>}
                                    </label>
                                )}
                            </div>

                            {result && (
                                <div className={`space-y-1 rounded-lg p-3 text-sm ${result.ok ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                                    <div className="flex items-center gap-2">
                                        {result.ok ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                        {result.message}
                                    </div>
                                    {result.skipped && Object.keys(result.skipped).length > 0 && (
                                        <div className="pl-6 text-xs text-muted-foreground">
                                            Pulados: {Object.entries(result.skipped).map(([reason, n]) => `${reason} (${n})`).join(', ')}
                                        </div>
                                    )}
                                    {result.invalid && result.invalid.length > 0 && (
                                        <div className="pl-6 text-xs text-muted-foreground">
                                            Não reconhecidos: {result.invalid.join(', ')}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-wrap gap-3">
                                <Button onClick={send} disabled={sending} className="sm:w-auto">
                                    {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    Enfileirar envio
                                </Button>
                                <Button type="button" variant="outline" onClick={openPreview} disabled={channels.length === 0}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Pré-visualizar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ── Histórico ── */}
                {tab === 'history' && (
                    <Card>
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle>Histórico unificado</CardTitle>
                            <div className="flex gap-2">
                                <Button variant="default" size="sm" onClick={dispatchNow} disabled={dispatching}>
                                    {dispatching ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Zap className="mr-1.5 h-4 w-4" />}
                                    Processar fila agora
                                </Button>
                                <Button variant="outline" size="sm" onClick={loadHistory} disabled={loadingHistory}>
                                    {loadingHistory ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Atualizar'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="mb-3 text-xs text-muted-foreground">
                                Mensagens "pending" esperam o próximo processamento. Elas já são enviadas
                                automaticamente logo após o disparo — use este botão se quiser forçar um novo
                                lote (ex.: mensagens que ficaram de fora do orçamento de tempo do envio, ou
                                enquanto o Cron/ticker externo ainda não está configurado).
                            </p>
                            <div className="mb-4 flex flex-wrap gap-2">
                                {Object.entries(stats).map(([status, count]) => (
                                    <Badge key={status} className={STATUS_COLORS[status] || ''} variant="secondary">
                                        {status}: {count}
                                    </Badge>
                                ))}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="py-2 pr-4">Canal</th>
                                            <th className="py-2 pr-4">Destinatário</th>
                                            <th className="py-2 pr-4">Status</th>
                                            <th className="py-2 pr-4">Tent.</th>
                                            <th className="py-2 pr-4">Quando</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {messages.map((m) => (
                                            <tr key={m._id} className="border-b">
                                                <td className="py-2 pr-4">
                                                    {m.channel === 'email' ? <Mail className="h-4 w-4" /> : <MessageCircle className="h-4 w-4 text-green-600" />}
                                                </td>
                                                <td className="py-2 pr-4">{m.to?.email || m.to?.phoneE164 || '—'}</td>
                                                <td className="py-2 pr-4">
                                                    <span className={`rounded px-2 py-0.5 text-xs ${STATUS_COLORS[m.status] || ''}`}>{m.status}</span>
                                                    {m.lastError && <span className="ml-2 text-xs text-red-500" title={m.lastError}>⚠</span>}
                                                </td>
                                                <td className="py-2 pr-4">{m.attempts}</td>
                                                <td className="py-2 pr-4 text-muted-foreground">{new Date(m.createdAt).toLocaleString('pt-BR')}</td>
                                            </tr>
                                        ))}
                                        {messages.length === 0 && !loadingHistory && (
                                            <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Nenhuma mensagem ainda.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ── Jornadas ── */}
                {tab === 'journeys' && (
                    <Card>
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle>Jornadas de nurturing</CardTitle>
                            <Button variant="outline" size="sm" onClick={seedDefault} disabled={seeding}>
                                {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Criar jornada padrão'}
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {sequences.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    Nenhuma jornada. Clique em “Criar jornada padrão” para gerar a sequência multicanal
                                    de persuasão. Depois, associe a chave <code className="rounded bg-muted px-1">lead-journey-default</code> a
                                    uma campanha de leads (campo “sequenceId”) para matricular novos leads automaticamente.
                                </p>
                            )}
                            {sequences.map((s) => (
                                <div key={s._id} className="rounded-lg border p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium">{s.name}</div>
                                            <code className="text-xs text-muted-foreground">{s.key}</code>
                                        </div>
                                        <Badge variant={s.isActive ? 'default' : 'secondary'}>{s.isActive ? 'ativa' : 'inativa'}</Badge>
                                    </div>
                                    {s.description && <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>}
                                    <ol className="mt-3 space-y-1 text-sm">
                                        {s.steps.map((st, i) => (
                                            <li key={i} className="flex items-center gap-2">
                                                <span className="text-muted-foreground">{Math.round(st.delayMinutes / 60)}h</span>
                                                <span className="flex gap-1">
                                                    {st.channels.map((c) => (c === 'email' ? <Mail key={c} className="h-3.5 w-3.5" /> : <MessageCircle key={c} className="h-3.5 w-3.5 text-green-600" />))}
                                                </span>
                                                <span>{st.label || `Passo ${i + 1}`}</span>
                                            </li>
                                        ))}
                                    </ol>

                                    <div className="mt-4 flex items-center gap-2 border-t pt-3">
                                        <Button variant="outline" size="sm" onClick={() => toggleEnrollments(s.key)}>
                                            <Users className="mr-1.5 h-3.5 w-3.5" />
                                            {expandedSequence === s.key ? 'Ocultar matrículas ativas' : 'Ver matrículas ativas'}
                                        </Button>
                                        {expandedSequence === s.key && enrollments.length > 0 && (
                                            <Button variant="outline" size="sm" className="text-destructive" onClick={() => cancelAllForSequence(s.key)}>
                                                Cancelar todas
                                            </Button>
                                        )}
                                    </div>

                                    {expandedSequence === s.key && (
                                        <div className="mt-3 rounded-lg border bg-muted/30">
                                            {loadingEnrollments ? (
                                                <div className="flex items-center justify-center py-6 text-muted-foreground">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                </div>
                                            ) : enrollments.length === 0 ? (
                                                <p className="p-4 text-sm text-muted-foreground">Nenhuma matrícula ativa nesta jornada.</p>
                                            ) : (
                                                <table className="w-full text-sm">
                                                    <tbody>
                                                        {enrollments.map((en) => (
                                                            <tr key={en._id} className="border-b last:border-0">
                                                                <td className="px-3 py-2">{en.to.name || en.to.email || en.to.phoneE164 || '—'}</td>
                                                                <td className="px-3 py-2 text-muted-foreground">{en.to.email || en.to.phoneE164 || ''}</td>
                                                                <td className="px-3 py-2 text-muted-foreground">Passo {en.currentStep + 1}</td>
                                                                <td className="px-3 py-2 text-muted-foreground">
                                                                    Próximo: {new Date(en.nextRunAt).toLocaleString('pt-BR')}
                                                                </td>
                                                                <td className="px-3 py-2 text-right">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-destructive"
                                                                        onClick={() => cancelEnrollment(en._id)}
                                                                        disabled={cancelingId === en._id}
                                                                    >
                                                                        {cancelingId === en._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                                                                        {' '}Cancelar
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* ── Modal de pré-visualização ── */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Pré-visualização</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 px-6 pb-6">
                        <div className="flex flex-wrap gap-3">
                            <div className="flex-1 min-w-[160px]">
                                <Label htmlFor="pv-name" className="text-xs">Nome de exemplo</Label>
                                <Input id="pv-name" value={previewSampleName} onChange={(e) => setPreviewSampleName(e.target.value)} />
                            </div>
                            <div className="flex-1 min-w-[160px]">
                                <Label htmlFor="pv-city" className="text-xs">Cidade de exemplo</Label>
                                <Input id="pv-city" value={previewSampleCity} onChange={(e) => setPreviewSampleCity(e.target.value)} placeholder="ex.: São Paulo" />
                            </div>
                            <div className="flex-1 min-w-[160px]">
                                <Label htmlFor="pv-tag" className="text-xs">Tag persuasiva de exemplo</Label>
                                <Input id="pv-tag" value={previewTag} onChange={(e) => setPreviewTag(e.target.value)} placeholder="ex.: revalida" />
                            </div>
                            <div className="flex items-end">
                                <Button type="button" size="sm" onClick={openPreview} disabled={previewLoading}>
                                    {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Atualizar prévia'}
                                </Button>
                            </div>
                        </div>

                        {channels.length > 1 && (
                            <div className="flex gap-2 border-b">
                                {channels.map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => setPreviewChannel(c)}
                                        className={`flex items-center gap-1.5 border-b-2 px-3 py-1.5 text-sm ${
                                            previewChannel === c ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
                                        }`}
                                    >
                                        {c === 'email' ? <Mail className="h-3.5 w-3.5" /> : <MessageCircle className="h-3.5 w-3.5" />}
                                        {c === 'email' ? 'E-mail' : 'WhatsApp'}
                                    </button>
                                ))}
                            </div>
                        )}

                        {previewLoading && (
                            <div className="flex items-center justify-center py-10 text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                        )}

                        {!previewLoading && previewData && previewChannel === 'email' && channels.includes('email') && (
                            <div className="overflow-hidden rounded-lg border">
                                <div className="border-b bg-muted/50 px-3 py-2 text-sm">
                                    <span className="text-muted-foreground">Assunto: </span>
                                    <span className="font-medium">{previewData.emailSubject || '(sem assunto)'}</span>
                                </div>
                                <iframe
                                    title="Prévia do e-mail"
                                    srcDoc={previewData.emailHtml || '<p style="padding:16px;font-family:sans-serif">Sem conteúdo</p>'}
                                    className="h-[420px] w-full bg-white"
                                    sandbox=""
                                />
                            </div>
                        )}

                        {!previewLoading && previewData && previewChannel === 'whatsapp' && channels.includes('whatsapp') && (
                            <div className="rounded-lg bg-[#0b141a] p-4">
                                <div className="ml-auto max-w-[80%] whitespace-pre-wrap rounded-lg rounded-tr-none bg-[#005c4b] px-3 py-2 text-sm text-white shadow">
                                    {previewData.whatsappText || '(sem texto)'}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </AppShell>
    )
}
