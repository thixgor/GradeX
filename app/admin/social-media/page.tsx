'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, MessageCircle, Send, History, Route, Loader2, Check, AlertCircle } from 'lucide-react'

type Channel = 'email' | 'whatsapp'
type Audience = 'all-users' | 'contacts' | 'campaign'
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

const STATUS_COLORS: Record<string, string> = {
    sent: 'bg-green-500/15 text-green-600',
    delivered: 'bg-green-500/15 text-green-600',
    pending: 'bg-amber-500/15 text-amber-600',
    processing: 'bg-sky-500/15 text-sky-600',
    failed: 'bg-orange-500/15 text-orange-600',
    dead: 'bg-red-500/15 text-red-600',
    skipped: 'bg-gray-500/15 text-gray-500',
}

export default function SocialMediaPage() {
    const [tab, setTab] = useState<Tab>('compose')

    // Compose state
    const [channels, setChannels] = useState<Channel[]>(['email'])
    const [audience, setAudience] = useState<Audience>('contacts')
    const [campaignId, setCampaignId] = useState('')
    const [subject, setSubject] = useState('')
    const [content, setContent] = useState('')
    const [previewText, setPreviewText] = useState('')
    const [waText, setWaText] = useState('')
    const [checkConsent, setCheckConsent] = useState(true)
    const [sending, setSending] = useState(false)
    const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

    // History state
    const [messages, setMessages] = useState<HistoryMsg[]>([])
    const [stats, setStats] = useState<Record<string, number>>({})
    const [loadingHistory, setLoadingHistory] = useState(false)

    // Journeys state
    const [sequences, setSequences] = useState<Sequence[]>([])
    const [seeding, setSeeding] = useState(false)

    const toggleChannel = (c: Channel) =>
        setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))

    const send = async () => {
        setResult(null)
        if (channels.length === 0) return setResult({ ok: false, message: 'Selecione ao menos um canal' })
        setSending(true)
        try {
            const res = await fetch('/api/admin/social-media/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channels,
                    audience,
                    campaignId: audience === 'campaign' ? campaignId : undefined,
                    email: channels.includes('email') ? { subject, content, previewText } : undefined,
                    whatsapp: channels.includes('whatsapp') ? { text: waText } : undefined,
                    checkConsent,
                }),
            })
            const data = await res.json()
            setResult({ ok: res.ok, message: res.ok ? data.message : data.error || 'Erro' })
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
                                </select>
                                {audience === 'campaign' && (
                                    <Input
                                        value={campaignId}
                                        onChange={(e) => setCampaignId(e.target.value)}
                                        placeholder="ID da campanha de leads"
                                        className="mt-2"
                                    />
                                )}
                            </div>

                            {channels.includes('email') && (
                                <div className="space-y-3 rounded-lg border border-dashed p-4">
                                    <div className="flex items-center gap-2 text-sm font-medium"><Mail className="h-4 w-4" /> E-mail</div>
                                    <div>
                                        <Label htmlFor="subject">Assunto</Label>
                                        <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Assunto (aceita %nome%)" />
                                    </div>
                                    <div>
                                        <Label htmlFor="preview">Preview (opcional)</Label>
                                        <Input id="preview" value={previewText} onChange={(e) => setPreviewText(e.target.value)} placeholder="Texto de pré-visualização" />
                                    </div>
                                    <div>
                                        <Label htmlFor="content">Conteúdo (HTML dos blocos)</Label>
                                        <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={6} placeholder="<div class='hero-block'><h1>Olá %nome%</h1>...</div>" />
                                    </div>
                                </div>
                            )}

                            {channels.includes('whatsapp') && (
                                <div className="space-y-3 rounded-lg border border-dashed p-4">
                                    <div className="flex items-center gap-2 text-sm font-medium"><MessageCircle className="h-4 w-4" /> WhatsApp</div>
                                    <Textarea value={waText} onChange={(e) => setWaText(e.target.value)} rows={4} placeholder="Texto da mensagem. Aceita {{nome}}, {{persuasiveTag}}." />
                                </div>
                            )}

                            <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                <input type="checkbox" checked={checkConsent} onChange={(e) => setCheckConsent(e.target.checked)} className="accent-primary" />
                                Respeitar consentimento (LGPD) — recomendado
                            </label>

                            {result && (
                                <div className={`flex items-center gap-2 rounded-lg p-3 text-sm ${result.ok ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                                    {result.ok ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                    {result.message}
                                </div>
                            )}

                            <Button onClick={send} disabled={sending} className="w-full sm:w-auto">
                                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                Enfileirar envio
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* ── Histórico ── */}
                {tab === 'history' && (
                    <Card>
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle>Histórico unificado</CardTitle>
                            <Button variant="outline" size="sm" onClick={loadHistory} disabled={loadingHistory}>
                                {loadingHistory ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Atualizar'}
                            </Button>
                        </CardHeader>
                        <CardContent>
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
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppShell>
    )
}
