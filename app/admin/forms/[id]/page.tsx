'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppShell } from '@/components/app-shell'
import {
    ArrowLeft,
    Plus,
    Trash2,
    GripVertical,
    Type,
    Image as ImageIcon,
    Video as VideoIcon,
    Link as LinkIcon,
    HelpCircle,
    Save,
    Settings as SettingsIcon,
    ChevronDown,
    ChevronUp,
    Mail,
    Clock,
    CheckSquare,
    ListIcon,
    Phone,
    TextCursorInput,
    AtSign,
    AlertTriangle,
    Users,
    Lock,
    Gift,
    KeyRound,
    MailCheck
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { v4 as uuidv4 } from 'uuid'
import { Form, FormBlock, FormBlockType, FormMaterialPrize, FormQuestionType } from '@/lib/types'
import { DEFAULT_PRIZE_CHOICE_TITLE, getFormPrizes, getMaterialChoiceMode } from '@/lib/form-prizes'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function FormEditorPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const [loading, setLoading] = useState(id !== 'new')
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState<Partial<Form>>({
        title: '',
        description: '',
        blocks: [],
        settings: {
            isActive: true,
            sendConfirmationEmail: false,
            responseLimit: 0
        }
    })

    const [materials, setMaterials] = useState<Array<{ _id: string; title: string; pricing?: string }>>([])

    useEffect(() => {
        if (id !== 'new') {
            fetchForm()
        }
    }, [id])

    useEffect(() => {
        fetchMaterials()
    }, [])

    async function fetchMaterials() {
        try {
            const res = await fetch('/api/materiais')
            const data = await res.json()
            if (Array.isArray(data?.materials)) {
                setMaterials(
                    data.materials.map((m: any) => ({ _id: String(m._id), title: m.title, pricing: m.pricing }))
                )
            }
        } catch (error) {
            console.error('Error fetching materials:', error)
        }
    }

    async function fetchForm() {
        try {
            const res = await fetch(`/api/admin/forms/${id}`)
            const data = await res.json()
            if (data.form) {
                // Formulários antigos guardavam um único material em
                // `deliverMaterialId`. Migra para a lista assim que abrem no
                // editor, para o restante da tela lidar só com `deliverMaterials`.
                const migrated = {
                    ...data.form,
                    settings: {
                        ...data.form.settings,
                        deliverMaterials: getFormPrizes(data.form.settings),
                        materialChoiceMode: getMaterialChoiceMode(data.form.settings),
                    },
                }
                setForm(migrated)
            }
        } catch (error) {
            console.error('Error fetching form:', error)
        } finally {
            setLoading(false)
        }
    }

    // === Prêmios (materiais entregues) ===================================

    const prizes: FormMaterialPrize[] = form.settings?.deliverMaterials || []
    const choiceMode = getMaterialChoiceMode(form.settings)

    /**
     * Grava a lista de prêmios mantendo `deliverMaterialId`/`Title` apontando
     * para o primeiro item: são campos legados que ainda podem ser lidos por
     * formulários/telas antigas.
     */
    const setPrizes = (next: FormMaterialPrize[]) => {
        setForm(prev => ({
            ...prev,
            settings: {
                ...prev.settings!,
                deliverMaterials: next,
                deliverMaterialId: next[0]?.id,
                deliverMaterialTitle: next[0]?.title,
            }
        }))
    }

    const addPrize = (materialId: string) => {
        if (prizes.some(p => p.id === materialId)) return
        const mat = materials.find(m => m._id === materialId)
        setPrizes([...prizes, { id: materialId, title: mat?.title }])
    }

    const removePrize = (materialId: string) => {
        setPrizes(prizes.filter(p => p.id !== materialId))
    }

    const movePrize = (index: number, direction: 'up' | 'down') => {
        const target = direction === 'up' ? index - 1 : index + 1
        if (target < 0 || target >= prizes.length) return
        const next = [...prizes]
        const temp = next[index]
        next[index] = next[target]
        next[target] = temp
        setPrizes(next)
    }

    const addBlock = (type: FormBlockType) => {
        const newBlock: FormBlock = {
            id: uuidv4(),
            type,
            title: type === 'question' ? 'Nova Pergunta' : 'Novo Título',
            required: false,
            questionType: type === 'question' ? 'short-text' : undefined,
        }
        setForm(prev => ({ ...prev, blocks: [...(prev.blocks || []), newBlock] }))
    }

    const updateBlock = (blockId: string, updates: Partial<FormBlock>) => {
        setForm(prev => ({
            ...prev,
            blocks: prev.blocks?.map(btn => btn.id === blockId ? { ...btn, ...updates } : btn)
        }))
    }

    const removeBlock = (blockId: string) => {
        setForm(prev => ({
            ...prev,
            blocks: prev.blocks?.filter(btn => btn.id !== blockId)
        }))
    }

    const moveBlock = (index: number, direction: 'up' | 'down') => {
        if (!form.blocks) return
        const newBlocks = [...form.blocks]
        const targetIndex = direction === 'up' ? index - 1 : index + 1
        if (targetIndex < 0 || targetIndex >= newBlocks.length) return

        const temp = newBlocks[index]
        newBlocks[index] = newBlocks[targetIndex]
        newBlocks[targetIndex] = temp

        setForm(prev => ({ ...prev, blocks: newBlocks }))
    }

    async function saveForm() {
        if (!form.title) {
            alert('O título do formulário é obrigatório.')
            return
        }

        if (form.settings?.deliverMaterial) {
            if (prizes.length === 0) {
                alert('Adicione pelo menos um material para entregar.')
                return
            }
            if (!form.settings?.emailQuestionId) {
                alert('Para entregar material, adicione uma pergunta do tipo "E-mail" ao formulário e selecione-a em "Pergunta de E-mail". Ela é usada para enviar o material a quem responder sem estar logado.')
                return
            }
        }
        if (form.settings?.sendConfirmationEmail && !form.settings?.emailQuestionId) {
            alert('Para enviar a confirmação por e-mail, selecione a pergunta que coleta o e-mail.')
            return
        }
        // Sem login obrigatório nem pergunta de e-mail não há como saber quem
        // está respondendo — a trava por e-mail barraria todo mundo.
        if (form.settings?.oneResponsePerEmail && !form.settings?.requireLogin && !form.settings?.emailQuestionId) {
            alert('Para limitar uma resposta por e-mail, ative "Exigir Login" ou adicione uma pergunta do tipo "E-mail" e selecione-a em "Pergunta de E-mail".')
            return
        }

        setSaving(true)
        try {
            const url = id === 'new' ? '/api/admin/forms' : `/api/admin/forms/${id}`
            const method = id === 'new' ? 'POST' : 'PUT'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            })

            if (res.ok) {
                if (id === 'new') {
                    const data = await res.json()
                    router.push(`/admin/forms/${data.form._id}`)
                } else {
                    alert('Formulário salvo com sucesso!')
                }
            }
        } catch (error) {
            console.error('Error saving form:', error)
            alert('Erro ao salvar formulário.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-10 text-center">Carregando...</div>

    return (
        <AppShell headerTitle={id === 'new' ? 'Novo Formulário' : 'Editar Formulário'} headerSubtitle={form.title || 'Sem título'}>
            <div className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="flex items-center justify-between mb-8">
                    <Button variant="ghost" onClick={() => router.push('/admin/forms')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                    </Button>
                    <Button onClick={saveForm} disabled={saving} className="bg-primary hover:bg-primary/90">
                        <Save className="mr-2 h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar Formulário'}
                    </Button>
                </div>

                <Tabs defaultValue="editor" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
                        <TabsTrigger value="editor">Editor</TabsTrigger>
                        <TabsTrigger value="settings">Configurações</TabsTrigger>
                    </TabsList>

                    <TabsContent value="editor" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Identificação</CardTitle>
                                <CardDescription>Título e descrição principal do formulário</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Título do Formulário</Label>
                                    <Input
                                        value={form.title}
                                        onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="Ex: Pesquisa de Satisfação 2024"
                                        className="text-lg font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Descrição (Opcional)</Label>
                                    <Textarea
                                        value={form.description}
                                        onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Conte um pouco sobre o objetivo desta pesquisa..."
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-4">
                            <h3 className="text-xl font-bold flex items-center justify-between">
                                Blocos de Conteúdo
                                <span className="text-sm font-normal text-muted-foreground">{form.blocks?.length || 0} blocos</span>
                            </h3>

                            <div className="space-y-4">
                                {form.blocks?.map((block, index) => (
                                    <Card key={block.id} className="relative group overflow-hidden border-l-4 border-l-primary">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 flex flex-col items-center justify-center p-1 cursor-move opacity-50 group-hover:opacity-100">
                                            <GripVertical className="h-4 w-4" />
                                        </div>

                                        <CardHeader className="py-3 px-6 bg-muted/30 flex flex-row items-center justify-between space-y-0">
                                            <div className="flex items-center gap-3">
                                                {block.type === 'question' && <HelpCircle className="h-4 w-4 text-blue-500" />}
                                                {block.type === 'text' && <Type className="h-4 w-4 text-gray-500" />}
                                                {block.type === 'image' && <ImageIcon className="h-4 w-4 text-green-500" />}
                                                {block.type === 'video' && <VideoIcon className="h-4 w-4 text-red-500" />}
                                                {block.type === 'link' && <LinkIcon className="h-4 w-4 text-purple-500" />}
                                                <span className="font-semibold text-sm uppercase tracking-wider opacity-70">
                                                    {block.type === 'question' ? `Pergunta: ${block.questionType}` : block.type}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={index === 0} onClick={() => moveBlock(index, 'up')}>
                                                    <ChevronUp className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={index === (form.blocks?.length || 0) - 1} onClick={() => moveBlock(index, 'down')}>
                                                    <ChevronDown className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-white hover:bg-destructive" onClick={() => removeBlock(block.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="p-6 space-y-4">
                                            {/* Título do Bloco / Enunciado */}
                                            <div className="space-y-2">
                                                <Label>{block.type === 'question' ? 'Enunciado da Pergunta' : 'Título do Card'}</Label>
                                                <Input
                                                    value={block.title}
                                                    onChange={e => updateBlock(block.id, { title: e.target.value })}
                                                    placeholder="Digite aqui..."
                                                />
                                            </div>

                                            {/* Configurações Específicas por Tipo */}
                                            {block.type === 'question' && (
                                                <div className="grid gap-4 md:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <Label>Tipo de Resposta</Label>
                                                        <Select
                                                            value={block.questionType}
                                                            onValueChange={(val: FormQuestionType) => updateBlock(block.id, { questionType: val })}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="short-text">Texto Curto</SelectItem>
                                                                <SelectItem value="long-text">Texto Longo (Discursiva)</SelectItem>
                                                                <SelectItem value="multiple-choice">Múltipla Escolha</SelectItem>
                                                                <SelectItem value="checklist">Checklist (Múltiplas Seleções)</SelectItem>
                                                                <SelectItem value="email">E-mail</SelectItem>
                                                                <SelectItem value="phone">Telefone</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="flex items-center gap-2 pt-8">
                                                        <Switch
                                                            id={`req-${block.id}`}
                                                            checked={block.required}
                                                            onCheckedChange={val => updateBlock(block.id, { required: val })}
                                                        />
                                                        <Label htmlFor={`req-${block.id}`}>Pergunta Obrigatória</Label>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Opções para Múltipla Escolha ou Checklist */}
                                            {(block.questionType === 'multiple-choice' || block.questionType === 'checklist') && (
                                                <div className="space-y-2 border p-4 rounded-lg bg-muted/20">
                                                    <Label>Opções (uma por linha)</Label>
                                                    <Textarea
                                                        value={block.options?.join('\n')}
                                                        onChange={e => updateBlock(block.id, { options: e.target.value.split('\n').filter(o => o.trim()) })}
                                                        placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                                                        rows={4}
                                                    />
                                                </div>
                                            )}

                                            {/* Descrição Auxiliar */}
                                            <div className="space-y-2">
                                                <Label>Descrição / Instruções Auxiliares (Opcional)</Label>
                                                <Input
                                                    value={block.description}
                                                    onChange={e => updateBlock(block.id, { description: e.target.value })}
                                                    placeholder="Dê mais detalhes para o usuário..."
                                                    className="text-sm italic"
                                                />
                                            </div>

                                            {/* Conteúdo de Mídia */}
                                            {block.type === 'text' && (
                                                <div className="space-y-2">
                                                    <Label>Conteúdo de Texto</Label>
                                                    <Textarea
                                                        value={block.content}
                                                        onChange={e => updateBlock(block.id, { content: e.target.value })}
                                                        placeholder="Escreva o texto do card..."
                                                    />
                                                </div>
                                            )}

                                            {block.type === 'image' && (
                                                <div className="space-y-2">
                                                    <Label>URL da Imagem</Label>
                                                    <Input
                                                        value={block.content}
                                                        onChange={e => updateBlock(block.id, { content: e.target.value })}
                                                        placeholder="https://exemplo.com/imagem.png"
                                                    />
                                                    {block.content && (
                                                        <img src={block.content} alt="Preview" className="h-32 object-contain mt-2 border rounded" />
                                                    )}
                                                </div>
                                            )}

                                            {block.type === 'video' && (
                                                <div className="space-y-2">
                                                    <Label>URL do Vídeo (Youtube Embed)</Label>
                                                    <Input
                                                        value={block.content}
                                                        onChange={e => updateBlock(block.id, { content: e.target.value })}
                                                        placeholder="https://www.youtube.com/embed/..."
                                                    />
                                                </div>
                                            )}

                                            {block.type === 'link' && (
                                                <div className="grid gap-4 md:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <Label>Texto do Botão</Label>
                                                        <Input
                                                            value={block.buttonText}
                                                            onChange={e => updateBlock(block.id, { buttonText: e.target.value })}
                                                            placeholder="Falar no WhatsApp"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Link do Botão</Label>
                                                        <Input
                                                            value={block.linkUrl}
                                                            onChange={e => updateBlock(block.id, { linkUrl: e.target.value })}
                                                            placeholder="https://..."
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Botões de Adicionar Bloco */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-6">
                                <Button variant="outline" size="sm" onClick={() => addBlock('question')} className="flex flex-col h-auto py-3 gap-1">
                                    <HelpCircle className="h-5 w-5 text-blue-500" />
                                    <span>Pergunta</span>
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => addBlock('text')} className="flex flex-col h-auto py-3 gap-1">
                                    <Type className="h-5 w-5 text-gray-500" />
                                    <span>Texto</span>
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => addBlock('image')} className="flex flex-col h-auto py-3 gap-1">
                                    <ImageIcon className="h-5 w-5 text-green-500" />
                                    <span>Imagem</span>
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => addBlock('video')} className="flex flex-col h-auto py-3 gap-1">
                                    <VideoIcon className="h-5 w-5 text-red-500" />
                                    <span>Vídeo</span>
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => addBlock('link')} className="flex flex-col h-auto py-3 gap-1">
                                    <LinkIcon className="h-5 w-5 text-purple-500" />
                                    <span>Botão Link</span>
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Configurações Gerais</CardTitle>
                                <CardDescription>Controle o status e comportamento do formulário</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-bold">Aceitar Respostas</Label>
                                        <p className="text-sm text-muted-foreground">O formulário estará visível e funcional para usuários.</p>
                                    </div>
                                    <Switch
                                        checked={form.settings?.isActive}
                                        onCheckedChange={(val) => setForm(prev => ({ ...prev, settings: { ...prev.settings!, isActive: val } }))}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-bold flex items-center gap-2">
                                            <Lock className="h-4 w-4" /> Exigir Login
                                        </Label>
                                        <p className="text-sm text-muted-foreground">O usuário precisa estar logado para acessar e responder o formulário.</p>
                                    </div>
                                    <Switch
                                        checked={form.settings?.requireLogin ?? false}
                                        onCheckedChange={(val) => setForm(prev => ({ ...prev, settings: { ...prev.settings!, requireLogin: val } }))}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                    <div className="space-y-0.5 pr-4">
                                        <Label className="text-base font-bold flex items-center gap-2">
                                            <MailCheck className="h-4 w-4" /> Uma Resposta por E-mail
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Bloqueia envios repetidos do mesmo e-mail. Exige login ativo ou uma pergunta de e-mail configurada.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={form.settings?.oneResponsePerEmail ?? false}
                                        onCheckedChange={(val) => setForm(prev => ({ ...prev, settings: { ...prev.settings!, oneResponsePerEmail: val } }))}
                                    />
                                </div>

                                {form.settings?.oneResponsePerEmail && !form.settings?.requireLogin && !form.settings?.emailQuestionId && (
                                    <p className="text-xs text-destructive flex items-start gap-1.5">
                                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                        Ative "Exigir Login" ou selecione uma "Pergunta de E-mail" abaixo — sem isso não é possível identificar quem respondeu.
                                    </p>
                                )}

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" /> Prazo de Encerramento (Opcional)
                                    </Label>
                                    <Input
                                        type="datetime-local"
                                        value={form.settings?.deadline ? new Date(form.settings.deadline).toISOString().slice(0, 16) : ''}
                                        onChange={e => setForm(prev => ({ ...prev, settings: { ...prev.settings!, deadline: e.target.value ? new Date(e.target.value) : undefined } }))}
                                    />
                                    <p className="text-xs text-muted-foreground">O formulário deixará de aceitar respostas automaticamente nesta data.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Users className="h-4 w-4" /> Limite de Respostas (Opcional)
                                    </Label>
                                    <Input
                                        type="number"
                                        placeholder="Ex: 100"
                                        value={form.settings?.responseLimit || ''}
                                        onChange={e => setForm(prev => ({ ...prev, settings: { ...prev.settings!, responseLimit: parseInt(e.target.value) || 0 } }))}
                                    />
                                    <p className="text-xs text-muted-foreground">Útil para inscrições com vagas limitadas.</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-primary/20 bg-primary/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="h-5 w-5 text-primary" /> Confirmação por e-mail
                                </CardTitle>
                                <CardDescription>Envie um e-mail com resumo e PDF para o usuário ao submeter</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-bold">Enviar E-mail de Confirmação</Label>
                                        <p className="text-sm text-muted-foreground">Anexa um PDF estilizado com todas as respostas.</p>
                                    </div>
                                    <Switch
                                        checked={form.settings?.sendConfirmationEmail}
                                        onCheckedChange={(val) => setForm(prev => ({ ...prev, settings: { ...prev.settings!, sendConfirmationEmail: val } }))}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-primary/20 bg-primary/5">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Gift className="h-5 w-5 text-primary" /> Entregar Material por E-mail
                                </CardTitle>
                                <CardDescription>
                                    Após enviar o formulário, o usuário recebe por e-mail um material de /materiais com serial key e link de ativação.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-bold">Entregar Material</Label>
                                        <p className="text-sm text-muted-foreground">Gera e envia uma serial key de ativação por e-mail.</p>
                                    </div>
                                    <Switch
                                        checked={form.settings?.deliverMaterial ?? false}
                                        onCheckedChange={(val) => setForm(prev => ({ ...prev, settings: { ...prev.settings!, deliverMaterial: val } }))}
                                    />
                                </div>

                                {form.settings?.deliverMaterial && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                                <KeyRound className="h-4 w-4" /> Materiais a entregar
                                            </Label>

                                            {prizes.length > 0 && (
                                                <div className="space-y-2">
                                                    {prizes.map((prize, index) => (
                                                        <div
                                                            key={prize.id}
                                                            className="flex items-center gap-2 p-3 rounded-lg border bg-background"
                                                        >
                                                            <Badge variant="outline" className="shrink-0 tabular-nums">{index + 1}</Badge>
                                                            <span className="flex-1 min-w-0 text-sm font-medium truncate">
                                                                {prize.title || materials.find(m => m._id === prize.id)?.title || prize.id}
                                                            </span>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 shrink-0"
                                                                disabled={index === 0}
                                                                onClick={() => movePrize(index, 'up')}
                                                            >
                                                                <ChevronUp className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 shrink-0"
                                                                disabled={index === prizes.length - 1}
                                                                onClick={() => movePrize(index, 'down')}
                                                            >
                                                                <ChevronDown className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 shrink-0 text-destructive hover:text-white hover:bg-destructive"
                                                                onClick={() => removePrize(prize.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* `value=""` mantém o seletor sempre no placeholder: ele é um
                                                "adicionar", não a exibição de uma escolha atual. */}
                                            <Select value="" onValueChange={addPrize}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={prizes.length === 0 ? 'Selecione o material...' : 'Adicionar outro material...'} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {materials.filter(m => !prizes.some(p => p.id === m._id)).map(m => (
                                                        <SelectItem key={m._id} value={m._id}>
                                                            {m.title}{m.pricing === 'free' ? ' (Grátis)' : ''}
                                                        </SelectItem>
                                                    ))}
                                                    {materials.filter(m => !prizes.some(p => p.id === m._id)).length === 0 && (
                                                        <div className="p-2 text-xs text-muted-foreground flex items-center gap-1">
                                                            <AlertTriangle className="h-3 w-3" />
                                                            {materials.length === 0 ? 'Nenhum material encontrado.' : 'Todos os materiais já foram adicionados.'}
                                                        </div>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {prizes.length > 1 && (
                                            <div className="space-y-3 rounded-lg border bg-background p-4">
                                                <Label className="flex items-center gap-2 text-base font-bold">
                                                    <Gift className="h-4 w-4" /> Como entregar os prêmios
                                                </Label>
                                                <div className="grid gap-2 sm:grid-cols-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setForm(prev => ({ ...prev, settings: { ...prev.settings!, materialChoiceMode: 'all' } }))}
                                                        className={`text-left p-3 rounded-lg border transition-colors ${choiceMode === 'all' ? 'border-primary bg-primary/10' : 'hover:border-primary/40'}`}
                                                    >
                                                        <p className="font-semibold text-sm">Entregar todos</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            O usuário recebe uma serial key para cada material da lista.
                                                        </p>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setForm(prev => ({ ...prev, settings: { ...prev.settings!, materialChoiceMode: 'single' } }))}
                                                        className={`text-left p-3 rounded-lg border transition-colors ${choiceMode === 'single' ? 'border-primary bg-primary/10' : 'hover:border-primary/40'}`}
                                                    >
                                                        <p className="font-semibold text-sm">O usuário escolhe apenas um</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            Ele seleciona um material da lista no formulário e só recebe esse.
                                                        </p>
                                                    </button>
                                                </div>

                                                {choiceMode === 'single' && (
                                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                                                        <Label>Enunciado do seletor de prêmio (Opcional)</Label>
                                                        <Input
                                                            value={form.settings?.materialChoiceTitle || ''}
                                                            onChange={e => setForm(prev => ({ ...prev, settings: { ...prev.settings!, materialChoiceTitle: e.target.value } }))}
                                                            placeholder={DEFAULT_PRIZE_CHOICE_TITLE}
                                                        />
                                                        <p className="text-xs text-muted-foreground">
                                                            Aparece no formulário, logo antes do botão de envio, como uma escolha obrigatória.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <p className="text-xs text-muted-foreground">
                                            Não exige login: se o usuário estiver logado, enviamos para o e-mail da conta; se não, usamos a
                                            resposta da <strong>pergunta de e-mail</strong> configurada abaixo — por isso ela é obrigatória
                                            para quem responde sem estar logado.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {(form.settings?.sendConfirmationEmail || form.settings?.deliverMaterial || form.settings?.oneResponsePerEmail) && (
                            <Card className="border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-2">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <AtSign className="h-5 w-5 text-primary" /> Pergunta de E-mail
                                    </CardTitle>
                                    <CardDescription>
                                        Usada para a confirmação por e-mail, para entregar o material a quem responde sem login
                                        e para a trava de uma resposta por e-mail.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Label>Pergunta que solicita o e-mail</Label>
                                    <Select
                                        value={form.settings?.emailQuestionId}
                                        onValueChange={(val) => setForm(prev => ({ ...prev, settings: { ...prev.settings!, emailQuestionId: val } }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a pergunta..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {form.blocks?.filter(b => b.type === 'question' && b.questionType === 'email').map(b => (
                                                <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>
                                            ))}
                                            {form.blocks?.filter(b => b.type === 'question' && b.questionType === 'email').length === 0 && (
                                                <div className="p-2 text-xs text-destructive flex items-center gap-1">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    Você precisa adicionar uma pergunta do tipo "E-mail" primeiro.
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {form.settings?.deliverMaterial && (
                                        <p className="text-xs text-muted-foreground">
                                            Obrigatória: sem ela, quem responder deslogado não poderá receber o material.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </AppShell>
    )
}
