'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppShell } from '@/components/app-shell'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
    Eye,
    FileText,
    Music,
    Podcast
} from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { WHATSAPP_TEMPLATES, WHATSAPP_TEMPLATE_CATEGORY_LABELS } from '@/lib/comms/whatsapp-templates'

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

function generateId() {
    return Math.random().toString(36).substring(2, 11)
}

export default function NewLeadCampaignPage() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)

    // Form state
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [welcomeMessage, setWelcomeMessage] = useState('Aqui está seu material, {nome}!')
    const [collectButtonText, setCollectButtonText] = useState('Acessar Material')
    const [blocks, setBlocks] = useState<LeadBlock[]>([])
    const [sendEmail, setSendEmail] = useState(false)
    const [emailSubject, setEmailSubject] = useState('')
    const [isActive, setIsActive] = useState(true)

    // Comunicação multicanal
    const [collectPhone, setCollectPhone] = useState(true)
    const [requirePhone, setRequirePhone] = useState(false)
    const [sendWhatsapp, setSendWhatsapp] = useState(false)
    const [whatsappTemplate, setWhatsappTemplate] = useState('Olá %nome%! 👋 Aqui está seu material *{{campaignName}}*. Qualquer dúvida, é só responder por aqui.')
    const [defaultPersuasiveTag, setDefaultPersuasiveTag] = useState('')
    const [sequenceId, setSequenceId] = useState('')
    const [sequences, setSequences] = useState<{ key: string; name: string }[]>([])

    useEffect(() => {
        fetch('/api/admin/leads/sequences', { cache: 'no-store' })
            .then((r) => r.json())
            .then((d) => setSequences(d.sequences || []))
            .catch(() => {})
    }, [])

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

    const moveBlock = (id: string, direction: 'up' | 'down') => {
        const index = blocks.findIndex(b => b.id === id)
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
            const res = await fetch('/api/admin/leads', {
                method: 'POST',
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
                const data = await res.json()
                router.push(`/admin/leads/${data.campaign._id}`)
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

    const renderBlockEditor = (block: LeadBlock) => {
        switch (block.type) {
            case 'text':
                return (
                    <div className="space-y-2">
                        <Label>Conteúdo do Texto</Label>
                        <Textarea
                            value={block.content || ''}
                            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                            placeholder="Digite o texto aqui... Suporta HTML básico."
                            rows={4}
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
                                <Label>Cor do Botão</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={block.buttonColor || '#f57c00'}
                                        onChange={(e) => updateBlock(block.id, { buttonColor: e.target.value })}
                                        className="w-14 h-10 p-1"
                                    />
                                    <Input
                                        value={block.buttonColor || '#f57c00'}
                                        onChange={(e) => updateBlock(block.id, { buttonColor: e.target.value })}
                                        placeholder="#f57c00"
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <Label>URL do Link (PDF ou site)</Label>
                            <Input
                                value={block.buttonUrl || ''}
                                onChange={(e) => updateBlock(block.id, { buttonUrl: e.target.value })}
                                placeholder="https://exemplo.com/arquivo.pdf"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={block.isPdfButton || false}
                                onCheckedChange={(checked) => updateBlock(block.id, { isPdfButton: checked })}
                            />
                            <Label>É um botão de PDF (adiciona ícone 📄)</Label>
                        </div>
                    </div>
                )

            case 'card':
                return (
                    <div className="space-y-3">
                        <div>
                            <Label>Título do Card</Label>
                            <Input
                                value={block.cardTitle || ''}
                                onChange={(e) => updateBlock(block.id, { cardTitle: e.target.value })}
                                placeholder="Título do card"
                            />
                        </div>
                        <div>
                            <Label>Descrição do Card</Label>
                            <Textarea
                                value={block.cardDescription || ''}
                                onChange={(e) => updateBlock(block.id, { cardDescription: e.target.value })}
                                placeholder="Descrição opcional..."
                                rows={2}
                            />
                        </div>
                        <div>
                            <Label>URL da Imagem (opcional)</Label>
                            <Input
                                value={block.cardImageUrl || ''}
                                onChange={(e) => updateBlock(block.id, { cardImageUrl: e.target.value })}
                                placeholder="https://exemplo.com/imagem.jpg"
                            />
                        </div>
                    </div>
                )

            case 'embed':
                return (
                    <div className="space-y-3">
                        <div>
                            <Label>Tipo de Embed</Label>
                            <Select
                                value={block.embedType || 'video'}
                                onValueChange={(v) => updateBlock(block.id, { embedType: v as EmbedType })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="video">🎬 Vídeo</SelectItem>
                                    <SelectItem value="podcast">🎙️ Podcast</SelectItem>
                                    <SelectItem value="audio">🎵 Áudio</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>URL do Embed (YouTube, Spotify, etc)</Label>
                            <Input
                                value={block.embedUrl || ''}
                                onChange={(e) => updateBlock(block.id, { embedUrl: e.target.value })}
                                placeholder="https://youtube.com/watch?v=..."
                            />
                        </div>
                        <div>
                            <Label>Título (opcional)</Label>
                            <Input
                                value={block.embedTitle || ''}
                                onChange={(e) => updateBlock(block.id, { embedTitle: e.target.value })}
                                placeholder="Assista ao vídeo completo"
                            />
                        </div>
                        <div>
                            <Label>Descrição (opcional)</Label>
                            <Textarea
                                value={block.embedDescription || ''}
                                onChange={(e) => updateBlock(block.id, { embedDescription: e.target.value })}
                                placeholder="Descrição do conteúdo..."
                                rows={2}
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

    const getBlockTitle = (type: BlockType) => {
        switch (type) {
            case 'text': return 'Texto'
            case 'button': return 'Botão'
            case 'card': return 'Card'
            case 'embed': return 'Embed'
        }
    }

    return (
        <AppShell headerTitle="Nova Campanha de Lead" headerSubtitle="Configure seu material de captura">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <Button variant="ghost" onClick={() => router.back()} className="mb-6">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>

                <div className="grid gap-6">
                    {/* Informações Básicas */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações da Campanha</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Nome da Campanha *</Label>
                                    <Input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Ex: E-book Estudos Avançados"
                                    />
                                </div>
                                <div>
                                    <Label>Imagem de Capa (URL opcional)</Label>
                                    <Input
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        placeholder="https://exemplo.com/capa.jpg"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Descrição (para organização interna)</Label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Descrição opcional..."
                                    rows={2}
                                />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Mensagem de Boas-vindas</Label>
                                    <Input
                                        value={welcomeMessage}
                                        onChange={(e) => setWelcomeMessage(e.target.value)}
                                        placeholder="Aqui está seu material, {nome}!"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Use {'{nome}'} para inserir o nome do lead</p>
                                </div>
                                <div>
                                    <Label>Texto do Botão de Coleta</Label>
                                    <Input
                                        value={collectButtonText}
                                        onChange={(e) => setCollectButtonText(e.target.value)}
                                        placeholder="Acessar Material"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch checked={isActive} onCheckedChange={setIsActive} />
                                <Label>Campanha ativa</Label>
                            </div>
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

                    {/* Email Automático */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span>Email Automático</span>
                                <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
                            </CardTitle>
                        </CardHeader>
                        {sendEmail && (
                            <CardContent>
                                <div>
                                    <Label>Assunto do Email</Label>
                                    <Input
                                        value={emailSubject}
                                        onChange={(e) => setEmailSubject(e.target.value)}
                                        placeholder={`Seu material: ${name || 'Nome da campanha'}`}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        O email enviará os mesmos blocos de conteúdo configurados abaixo.
                                        Leads que já receberam email não receberão novamente.
                                    </p>
                                </div>
                            </CardContent>
                        )}
                    </Card>

                    {/* Blocos de Conteúdo */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Conteúdo do Material</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Lista de blocos */}
                            {blocks.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                                    <p className="text-muted-foreground">Adicione blocos de conteúdo abaixo</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {blocks.map((block, index) => (
                                        <div key={block.id} className="border rounded-lg p-4 bg-muted/20">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    {getBlockIcon(block.type)}
                                                    <span className="font-medium">{getBlockTitle(block.type)}</span>
                                                    <span className="text-xs text-muted-foreground">#{index + 1}</span>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => moveBlock(block.id, 'up')}
                                                        disabled={index === 0}
                                                    >
                                                        <MoveUp className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => moveBlock(block.id, 'down')}
                                                        disabled={index === blocks.length - 1}
                                                    >
                                                        <MoveDown className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive"
                                                        onClick={() => removeBlock(block.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            {renderBlockEditor(block)}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Botões para adicionar blocos */}
                            <div className="flex flex-wrap gap-2 pt-4 border-t">
                                <span className="text-sm text-muted-foreground mr-2 self-center">Adicionar:</span>
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

                    {/* Botões de ação */}
                    <div className="flex gap-4 justify-end">
                        <Button variant="outline" onClick={() => router.back()}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            <Save className="mr-2 h-4 w-4" />
                            {saving ? 'Salvando...' : 'Salvar Campanha'}
                        </Button>
                    </div>
                </div>
            </div>
        </AppShell>
    )
}
