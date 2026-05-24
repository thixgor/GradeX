'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    AlertCircle,
    ArrowLeft,
    BarChart3,
    BookOpen,
    Check,
    ChevronDown,
    ChevronUp,
    Copy,
    Eye,
    FileText,
    FolderOpen,
    GraduationCap,
    ImageIcon,
    Link2,
    List,
    Loader2,
    Mail,
    MessageSquareQuote,
    Paperclip,
    Plus,
    Save,
    Search,
    Send,
    Sparkles,
    Target,
    Trash2,
    Type,
    Users,
    Wand2,
    X,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { BanChecker } from '@/components/ban-checker'
import { LogoLoading } from '@/components/logo-loading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { ToastAlert } from '@/components/ui/toast-alert'
import { PERIODO_OPTIONS, computeCurrentPeriodo, formatPeriodoLabel } from '@/lib/user-periodo'

interface User {
    _id: string
    name: string
    email: string
    role: 'admin' | 'user'
    accountType?: string
    emailVerified?: boolean
    periodoBase?: number
    periodoBaseRef?: string
}

interface EmailTemplate {
    id: string
    name: string
    description: string
    subject: string
    previewText: string
    content: string
    category?: string
}

interface MaterialResource {
    _id: string
    title: string
    description?: string
    coverImage?: string
    type?: string
    pricing?: 'free' | 'paid'
    price?: number
    isHidden?: boolean
    _cardCount?: number
}

interface FlashcardResource {
    _id: string
    slug: string
    title: string
    description?: string
    coverImage?: string
    cardCount?: number
    pricing?: 'free' | 'paid'
    visibility?: string
    isPublished?: boolean
    isHidden?: boolean
}

interface AttachmentBlock {
    type: 'material' | 'flashcard' | 'link'
    title: string
    description: string
    url: string
    ctaText: string
    badge: string
    imageUrl?: string
}

interface SendResult {
    success: boolean
    message: string
    stats: {
        total: number
        sent: number
        failed: number
    }
    errors?: string[]
}

type AttachmentType = 'none' | 'material' | 'flashcard' | 'link'
type EmailBlockType = 'hero' | 'text' | 'highlight' | 'list' | 'button' | 'image' | 'quote'

interface EmailBlock {
    id: string
    type: EmailBlockType
    title?: string
    text?: string
    url?: string
    buttonText?: string
    imageUrl?: string
    alt?: string
    items?: string[]
    author?: string
}

interface EmailDraft {
    _id: string
    name: string
    subject: string
    previewText: string
    blocks: EmailBlock[]
    attachmentType?: AttachmentType
    selectedMaterialId?: string
    selectedFlashcardId?: string
    customLinkUrl?: string
    customLinkTitle?: string
    customLinkDescription?: string
    attachmentCtaText?: string
    selectedTemplateId?: string
    updatedAt?: string
    createdAt?: string
}

interface VisualPreset {
    subject: string
    previewText: string
    blocks: EmailBlock[]
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://domineaqui.com.br'

const blockOptions: Array<{ type: EmailBlockType; label: string; icon: typeof Type }> = [
    { type: 'hero', label: 'Titulo', icon: Type },
    { type: 'text', label: 'Texto', icon: FileText },
    { type: 'highlight', label: 'Destaque', icon: Sparkles },
    { type: 'list', label: 'Lista', icon: List },
    { type: 'button', label: 'Botao', icon: Link2 },
    { type: 'image', label: 'Imagem', icon: ImageIcon },
    { type: 'quote', label: 'Citacao', icon: MessageSquareQuote },
]

const blockLabels: Record<EmailBlockType, string> = {
    hero: 'Titulo principal',
    text: 'Texto',
    highlight: 'Destaque',
    list: 'Lista',
    button: 'Botao',
    image: 'Imagem',
    quote: 'Citacao',
}

function newId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function makeBlock(type: EmailBlockType, data: Partial<EmailBlock> = {}): EmailBlock {
    const defaults: Record<EmailBlockType, EmailBlock> = {
        hero: { id: newId(), type: 'hero', title: 'Titulo do e-mail', text: 'Uma frase curta para explicar o principal beneficio.' },
        text: { id: newId(), type: 'text', text: 'Escreva um paragrafo curto, claro e orientado para acao.' },
        highlight: { id: newId(), type: 'highlight', title: 'Destaque', text: 'O principal motivo para o usuario clicar.' },
        list: { id: newId(), type: 'list', title: 'O que voce recebe', items: ['Beneficio 1', 'Beneficio 2', 'Proximo passo'] },
        button: { id: newId(), type: 'button', buttonText: 'Acessar agora', url: appUrl },
        image: { id: newId(), type: 'image', imageUrl: '', alt: 'Imagem do e-mail' },
        quote: { id: newId(), type: 'quote', text: 'Insira uma prova social, depoimento ou frase curta.', author: 'Nome do autor' },
    }

    return { ...defaults[type], id: newId(), ...data }
}

function cloneBlocks(blocks: EmailBlock[]) {
    return blocks.map(block => ({ ...block, id: newId(), items: block.items ? [...block.items] : undefined }))
}

function escapeHtml(value = '') {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

function applyInline(escaped = '') {
    return escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

function textToHtml(value = '') {
    return escapeHtml(value)
        .split(/\n{2,}/)
        .map(paragraph => paragraph.trim())
        .filter(Boolean)
        .map(paragraph => `<p>${applyInline(paragraph.replace(/\n/g, '<br>'))}</p>`)
        .join('')
}

function normalizeHref(value = '') {
    const trimmed = value.trim()
    if (!trimmed) return ''
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function plainTextFromHtml(html: string) {
    return html
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, '\n')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}

function blocksFromTemplate(template: EmailTemplate): EmailBlock[] {
    const preset = visualTemplatePresets[template.id]
    if (preset) return cloneBlocks(preset.blocks)

    const text = plainTextFromHtml(template.content)
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
    const title = lines[0] || template.name.replace(/^[^\wÀ-ÿ]+/u, '').trim() || 'Titulo do e-mail'
    const body = lines.slice(1).join('\n\n') || 'Escreva o conteúdo principal do e-mail.'

    return [
        makeBlock('hero', { title, text: template.previewText || template.description }),
        makeBlock('text', { text: body }),
        makeBlock('button', { buttonText: 'Acessar plataforma', url: appUrl }),
    ]
}

function renderBlocksHtml(blocks: EmailBlock[]) {
    return blocks.map(block => {
        switch (block.type) {
            case 'hero':
                return `
                  <div class="hero-block">
                    <h1>${escapeHtml(block.title || '')}</h1>
                    ${block.text ? `<p>${escapeHtml(block.text)}</p>` : ''}
                  </div>
                `
            case 'text':
                return `<div class="text-block">${textToHtml(block.text || '')}</div>`
            case 'highlight':
                return `
                  <div class="highlight-box">
                    ${block.title ? `<p><strong>${escapeHtml(block.title)}</strong></p>` : ''}
                    ${textToHtml(block.text || '')}
                  </div>
                `
            case 'list':
                return `
                  <div class="list-block">
                    ${block.title ? `<h2>${escapeHtml(block.title)}</h2>` : ''}
                    <ul>
                      ${(block.items || []).filter(Boolean).map(item => `<li>${applyInline(escapeHtml(item))}</li>`).join('')}
                    </ul>
                  </div>
                `
            case 'button': {
                const href = normalizeHref(block.url)
                if (!href) return ''
                return `
                  <div class="button-block">
                    <a href="${escapeHtml(href)}" class="cta-button" target="_blank">${escapeHtml(block.buttonText || 'Acessar agora')}</a>
                  </div>
                `
            }
            case 'image':
                if (!block.imageUrl) return ''
                return `
                  <div class="image-block">
                    <img src="${escapeHtml(block.imageUrl)}" alt="${escapeHtml(block.alt || '')}">
                  </div>
                `
            case 'quote':
                return `
                  <blockquote class="quote-block">
                    <span class="quote-mark">&ldquo;</span>
                    <p class="quote-text">${applyInline(escapeHtml(block.text || ''))}</p>
                    ${block.author ? `<p class="quote-author">${escapeHtml(block.author)}</p>` : ''}
                  </blockquote>
                `
            default:
                return ''
        }
    }).join('')
}

function renderAttachmentHtml(attachment: AttachmentBlock | null) {
    if (!attachment) return ''

    const image = attachment.imageUrl
        ? `<img src="${escapeHtml(attachment.imageUrl)}" alt="" style="width: 100%; max-height: 220px; object-fit: cover; border-radius: 14px; margin: 0 0 18px 0;">`
        : ''

    return `
      <div class="divider"></div>
      <div class="resource-card">
        ${image}
        <p class="resource-badge">${escapeHtml(attachment.badge)}</p>
        <h2>${escapeHtml(attachment.title)}</h2>
        <p>${escapeHtml(attachment.description)}</p>
        <div class="button-block">
          <a href="${escapeHtml(attachment.url)}" class="cta-button" target="_blank">${escapeHtml(attachment.ctaText)}</a>
        </div>
      </div>
    `
}

const visualTemplatePresets: Record<string, VisualPreset> = {
    'welcome-back': {
        subject: 'Sentimos sua falta no DomineAqui',
        previewText: 'Volte agora e veja as novidades que preparamos para voce.',
        blocks: [
            makeBlock('hero', { title: 'Ei, sentimos sua falta!', text: 'Tem conteudo novo esperando por voce na plataforma.' }),
            makeBlock('text', { text: 'Faz um tempo que voce nao aparece por aqui. Enquanto isso, liberamos novos materiais, provas, games educativos e flashcards para deixar sua rotina mais leve.' }),
            makeBlock('highlight', { title: 'Comece por pouco', text: 'Abra a plataforma, escolha um tema e faca uma sessao curta hoje.' }),
            makeBlock('button', { buttonText: 'Voltar a estudar', url: appUrl }),
        ],
    },
    'new-content': {
        subject: 'Tem conteudo novo no DomineAqui',
        previewText: 'Acabamos de liberar uma novidade para acelerar sua revisao.',
        blocks: [
            makeBlock('hero', { title: 'Conteudo novo no ar', text: 'Uma novidade pratica para voce estudar com mais direcao.' }),
            makeBlock('text', { text: 'Acabamos de adicionar um novo conteudo na plataforma. Use esse material para revisar os pontos principais e depois praticar com questoes.' }),
            makeBlock('highlight', { title: 'O que ha de novo', text: 'Descreva aqui o conteudo liberado e por que ele vale o clique.' }),
            makeBlock('button', { buttonText: 'Ver novidade', url: `${appUrl}/dashboard` }),
        ],
    },
    'exam-reminder': {
        subject: 'Lembrete: prova chegando',
        previewText: 'Revise os pontos principais e entre preparado.',
        blocks: [
            makeBlock('hero', { title: 'Prova a vista', text: 'Separe alguns minutos para revisar antes da data.' }),
            makeBlock('highlight', { title: 'Dados da prova', text: 'Nome da prova: [preencher]\nData e horario: [preencher]' }),
            makeBlock('list', { title: 'Antes de comecar', items: ['Revise os pontos principais', 'Faca exercicios praticos', 'Durma bem na vespera'] }),
            makeBlock('button', { buttonText: 'Ir para provas', url: `${appUrl}/provas` }),
        ],
    },
    'premium-promo': {
        subject: 'Condicao especial para virar Premium',
        previewText: 'Aproveite a oferta antes que ela termine.',
        blocks: [
            makeBlock('hero', { title: 'Oferta especial liberada', text: 'Um empurrao para estudar com mais recursos e menos limite.' }),
            makeBlock('highlight', { title: '[X]% de desconto', text: 'Oferta valida ate [DATA]. Ajuste o desconto e a data antes de enviar.' }),
            makeBlock('list', { title: 'Com Premium voce tem', items: ['Questoes ilimitadas', 'Flashcards e materiais exclusivos', 'Estatisticas avancadas', 'Suporte prioritario'] }),
            makeBlock('button', { buttonText: 'Quero ser Premium', url: `${appUrl}/buy` }),
        ],
    },
    'feedback-request': {
        subject: 'Sua opiniao ajuda a melhorar o DomineAqui',
        previewText: 'Responda em poucos minutos e ajude a construir a plataforma.',
        blocks: [
            makeBlock('hero', { title: 'Queremos ouvir voce', text: 'Sua opiniao ajuda a decidir as proximas melhorias.' }),
            makeBlock('text', { text: 'Conte o que voce mais gosta, o que podemos melhorar e quais recursos fariam diferenca na sua rotina.' }),
            makeBlock('button', { buttonText: 'Dar feedback', url: '[LINK_DO_FORMULARIO]' }),
        ],
    },
    'study-tips': {
        subject: 'Dicas simples para estudar melhor',
        previewText: 'Estrategias curtas para lembrar mais e revisar melhor.',
        blocks: [
            makeBlock('hero', { title: 'Estude com mais qualidade', text: 'Pequenas mudancas deixam sua revisao mais eficiente.' }),
            makeBlock('list', { title: 'Experimente hoje', items: ['Estude 25 minutos com foco', 'Revise erros no dia seguinte', 'Faca questoes antes de reler teoria'] }),
            makeBlock('highlight', { title: 'Pratica ativa', text: 'Responder antes de conferir a resposta fixa melhor do que apenas reler.' }),
            makeBlock('button', { buttonText: 'Comecar a praticar', url: appUrl }),
        ],
    },
    achievement: {
        subject: 'Parabens pela sua conquista',
        previewText: 'Sua dedicacao esta aparecendo. Veja o proximo passo.',
        blocks: [
            makeBlock('hero', { title: 'Parabens pela conquista!', text: 'Seu esforco esta dando resultado.' }),
            makeBlock('highlight', { title: '[Descricao da conquista]', text: 'Edite este bloco com a conquista do aluno ou do grupo.' }),
            makeBlock('text', { text: 'Cada pequeno passo conta. Continue usando esse ritmo para chegar ainda mais longe.' }),
            makeBlock('button', { buttonText: 'Continuar evoluindo', url: appUrl }),
        ],
    },
    'material-drop': {
        subject: 'Separei um material para seus estudos',
        previewText: 'Abra para acessar o material e saber como usar.',
        blocks: [
            makeBlock('hero', { title: 'Material novo para estudar melhor', text: 'Um recurso selecionado para facilitar sua revisao.' }),
            makeBlock('text', { text: 'Use o material para revisar os pontos principais e depois volte para praticar com questoes.' }),
            makeBlock('list', { title: 'Como aproveitar', items: ['Leia os topicos principais', 'Marque os pontos dificeis', 'Faca questoes sobre o tema'] }),
        ],
    },
    'flashcard-push': {
        subject: 'Revise em poucos minutos com estes flashcards',
        previewText: 'Um deck pronto para praticar revisao ativa sem perder tempo.',
        blocks: [
            makeBlock('hero', { title: 'Treino rapido para fixar de verdade', text: 'Use flashcards para testar memoria ativa.' }),
            makeBlock('highlight', { title: 'Use assim', text: 'Responda antes de virar o card, marque os dificeis e repita amanha.' }),
            makeBlock('text', { text: 'O deck pode ser anexado no bloco de recurso abaixo.' }),
        ],
    },
    'limited-offer': {
        subject: 'Condicao especial liberada por pouco tempo',
        previewText: 'Aproveite antes que a janela feche.',
        blocks: [
            makeBlock('hero', { title: 'Condicao especial para acelerar seus estudos', text: 'Uma oportunidade com tempo limitado para organizar sua rotina.' }),
            makeBlock('highlight', { title: '[Descreva a oferta]', text: 'Valida ate [data/horario].' }),
            makeBlock('button', { buttonText: 'Ver condicao especial', url: `${appUrl}/buy` }),
        ],
    },
    'challenge-7-days': {
        subject: 'Topa um desafio de 7 dias?',
        previewText: 'Um plano simples para voltar ao ritmo.',
        blocks: [
            makeBlock('hero', { title: 'Desafio de 7 dias', text: 'Um comeco pequeno, claro e repetivel.' }),
            makeBlock('list', { title: 'Plano da semana', items: ['Dia 1: 10 questoes', 'Dia 2: revisar erros', 'Dia 3: flashcards rapidos', 'Dias 4 a 7: repetir o ciclo'] }),
            makeBlock('button', { buttonText: 'Comecar desafio', url: `${appUrl}/dashboard` }),
        ],
    },
    'cart-recovery': {
        subject: 'Seu material ainda esta te esperando',
        previewText: 'Volte para finalizar e liberar acesso ao conteudo.',
        blocks: [
            makeBlock('hero', { title: 'Ainda da tempo de continuar', text: 'O material que voce viu pode ajudar na sua rotina.' }),
            makeBlock('text', { text: 'Esse recurso foi criado para encurtar caminho, organizar o conteudo e colocar voce em pratica mais rapido.' }),
            makeBlock('button', { buttonText: 'Ver materiais', url: `${appUrl}/materiais` }),
        ],
    },
    'class-live': {
        subject: 'Aula especial chegando',
        previewText: 'Veja tema, horario e link para participar.',
        blocks: [
            makeBlock('hero', { title: 'Aula especial marcada', text: 'Reserve esse horario para trabalhar um tema importante.' }),
            makeBlock('highlight', { title: '[Tema da aula]', text: 'Data: [data]\nHorario: [horario]' }),
            makeBlock('button', { buttonText: 'Entrar na aula', url: '[LINK_DA_AULA]' }),
        ],
    },
    'weekly-digest': {
        subject: 'Seu resumo da semana no DomineAqui',
        previewText: 'Novidades, atalhos de estudo e o melhor proximo passo.',
        blocks: [
            makeBlock('hero', { title: 'O que vale sua atencao esta semana', text: 'Um resumo direto para voce nao perder o que importa.' }),
            makeBlock('list', { title: 'Novidades', items: ['[Novidade 1]', '[Novidade 2]', '[Novidade 3]'] }),
            makeBlock('highlight', { title: 'Proximo passo recomendado', text: 'Escolha um tema dificil e faca uma sessao curta de questoes hoje.' }),
            makeBlock('button', { buttonText: 'Abrir meu painel', url: `${appUrl}/dashboard` }),
        ],
    },
    'social-proof': {
        subject: 'Olha como outros alunos estudam melhor',
        previewText: 'Uma forma simples de criar consistencia.',
        blocks: [
            makeBlock('hero', { title: 'Um jeito mais inteligente de evoluir', text: 'Acompanhar erros e revisar ativamente muda o jogo.' }),
            makeBlock('quote', { text: '[Insira aqui um depoimento curto ou resultado real]' }),
            makeBlock('button', { buttonText: 'Continuar estudando', url: appUrl }),
        ],
    },
    'new-feature': {
        subject: 'Tem uma novidade no DomineAqui',
        previewText: 'Veja como usar o novo recurso nos seus estudos.',
        blocks: [
            makeBlock('hero', { title: 'Novo recurso liberado', text: 'Uma melhoria para deixar seus estudos mais simples.' }),
            makeBlock('highlight', { title: 'O que muda', text: '[Explique o recurso em uma frase clara]' }),
            makeBlock('button', { buttonText: 'Testar agora', url: appUrl }),
        ],
    },
    'exam-results': {
        subject: 'Seu resultado merece alguns minutos',
        previewText: 'Veja erros, revise pontos fracos e planeje o proximo treino.',
        blocks: [
            makeBlock('hero', { title: 'Use seu resultado como mapa', text: 'Ele mostra onde vale colocar energia agora.' }),
            makeBlock('list', { title: 'Depois de abrir', items: ['Veja as questoes erradas', 'Anote o padrao dos erros', 'Revise o tema com flashcards ou material'] }),
            makeBlock('button', { buttonText: 'Ver minhas provas', url: `${appUrl}/provas` }),
        ],
    },
    renewal: {
        subject: 'Seu acesso Premium esta perto de expirar',
        previewText: 'Renove para nao interromper sua rotina de estudos.',
        blocks: [
            makeBlock('hero', { title: 'Nao deixe seu ritmo quebrar', text: 'Continue com acesso aos recursos Premium.' }),
            makeBlock('list', { title: 'Voce mantem', items: ['Conteudos Premium', 'Questoes e revisoes', 'Ferramentas de evolucao'] }),
            makeBlock('button', { buttonText: 'Renovar acesso', url: `${appUrl}/buy` }),
        ],
    },
    maintenance: {
        subject: 'Aviso importante sobre a plataforma',
        previewText: 'Leia para saber o que muda e quando.',
        blocks: [
            makeBlock('hero', { title: 'Aviso importante', text: 'Uma atualizacao programada esta chegando.' }),
            makeBlock('highlight', { title: 'Quando?', text: '[data e horario]' }),
            makeBlock('text', { text: 'Nosso objetivo e melhorar sua experiencia e manter tudo funcionando com estabilidade.' }),
        ],
    },
    empty: {
        subject: '',
        previewText: '',
        blocks: [
            makeBlock('hero', { title: 'Titulo do e-mail', text: 'Resumo curto do principal beneficio.' }),
            makeBlock('text', { text: 'Escreva sua mensagem aqui.' }),
            makeBlock('button', { buttonText: 'Acessar plataforma', url: appUrl }),
        ],
    },
}

function templateSubject(template: EmailTemplate) {
    return visualTemplatePresets[template.id]?.subject ?? template.subject
}

function templatePreview(template: EmailTemplate) {
    return visualTemplatePresets[template.id]?.previewText ?? template.previewText
}

export default function AdminEmailsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [users, setUsers] = useState<User[]>([])
    const [templates, setTemplates] = useState<EmailTemplate[]>([])
    const [materials, setMaterials] = useState<MaterialResource[]>([])
    const [flashcards, setFlashcards] = useState<FlashcardResource[]>([])

    const [selectedTemplateId, setSelectedTemplateId] = useState('')
    const [templateCategory, setTemplateCategory] = useState('Todos')
    const [templateSearch, setTemplateSearch] = useState('')

    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
    const [selectAll, setSelectAll] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterAccountType, setFilterAccountType] = useState('all')
    const [filterPeriodo, setFilterPeriodo] = useState('all')
    const [additionalEmails, setAdditionalEmails] = useState<string[]>([])
    const [newEmail, setNewEmail] = useState('')

    const [subject, setSubject] = useState('')
    const [previewText, setPreviewText] = useState('')
    const [blocks, setBlocks] = useState<EmailBlock[]>(() => cloneBlocks(visualTemplatePresets.empty.blocks))

    const [attachmentType, setAttachmentType] = useState<AttachmentType>('none')
    const [selectedMaterialId, setSelectedMaterialId] = useState('')
    const [selectedFlashcardId, setSelectedFlashcardId] = useState('')
    const [customLinkUrl, setCustomLinkUrl] = useState('')
    const [customLinkTitle, setCustomLinkTitle] = useState('')
    const [customLinkDescription, setCustomLinkDescription] = useState('')
    const [attachmentCtaText, setAttachmentCtaText] = useState('Acessar agora')

    const [showPreview, setShowPreview] = useState(false)
    const [drafts, setDrafts] = useState<EmailDraft[]>([])
    const [currentDraftId, setCurrentDraftId] = useState<string | null>(null)
    const [showDrafts, setShowDrafts] = useState(false)
    const [savingDraft, setSavingDraft] = useState(false)
    const [sendResult, setSendResult] = useState<SendResult | null>(null)
    const [toast, setToast] = useState<{ open: boolean; message: string; type?: 'success' | 'error' | 'info' }>({ open: false, message: '' })

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ open: true, message, type })
    }

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        try {
            const [usersRes, templatesRes, materialsRes, flashcardsRes, draftsRes] = await Promise.all([
                fetch('/api/users', { cache: 'no-store' }),
                fetch('/api/admin/emails/templates', { cache: 'no-store' }),
                fetch('/api/materiais', { cache: 'no-store' }),
                fetch('/api/flashcards/manual?scope=all-admin', { cache: 'no-store' }),
                fetch('/api/admin/emails/drafts', { cache: 'no-store' }),
            ])

            if (usersRes.ok) {
                const usersData = await usersRes.json()
                setUsers(usersData.users || [])
            }

            if (templatesRes.ok) {
                const templatesData = await templatesRes.json()
                setTemplates(templatesData.templates || [])
            }

            if (materialsRes.ok) {
                const materialsData = await materialsRes.json()
                setMaterials(materialsData.materials || [])
            }

            if (flashcardsRes.ok) {
                const flashcardsData = await flashcardsRes.json()
                setFlashcards(flashcardsData.decks || [])
            }

            if (draftsRes.ok) {
                const draftsData = await draftsRes.json()
                setDrafts(draftsData.drafts || [])
            }
        } catch (error) {
            console.error('Load email composer data error:', error)
            showToast('Erro ao carregar dados da central de e-mails', 'error')
        } finally {
            setLoading(false)
        }
    }

    const filteredUsers = useMemo(() => {
        const query = searchQuery.toLowerCase().trim()
        return users.filter(user => {
            const matchesSearch =
                !query ||
                user.name.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query)

            const matchesAccountType =
                filterAccountType === 'all' ||
                user.accountType === filterAccountType ||
                (filterAccountType === 'admin' && user.role === 'admin')

            const periodoAtual = computeCurrentPeriodo(user.periodoBase, user.periodoBaseRef)
            const matchesPeriodo =
                filterPeriodo === 'all' ||
                (filterPeriodo === 'none' && periodoAtual === null) ||
                String(periodoAtual) === filterPeriodo

            return matchesSearch && matchesAccountType && matchesPeriodo
        })
    }, [filterAccountType, filterPeriodo, searchQuery, users])

    const categories = useMemo(() => {
        const unique = new Set(templates.map(template => template.category || 'Geral'))
        return ['Todos', ...Array.from(unique)]
    }, [templates])

    const visibleTemplates = useMemo(() => {
        const query = templateSearch.toLowerCase().trim()
        return templates.filter(template => {
            const category = template.category || 'Geral'
            const matchesCategory = templateCategory === 'Todos' || category === templateCategory
            const matchesSearch =
                !query ||
                template.name.toLowerCase().includes(query) ||
                template.description.toLowerCase().includes(query) ||
                templateSubject(template).toLowerCase().includes(query)
            return matchesCategory && matchesSearch
        })
    }, [templateCategory, templateSearch, templates])

    const selectedMaterial = materials.find(material => material._id === selectedMaterialId)
    const selectedFlashcard = flashcards.find(deck => deck._id === selectedFlashcardId)

    const currentAttachment = useMemo<AttachmentBlock | null>(() => {
        if (attachmentType === 'material' && selectedMaterial) {
            return {
                type: 'material',
                title: selectedMaterial.title,
                description: selectedMaterial.description || 'Material selecionado para complementar seus estudos.',
                url: `${appUrl}/materiais/${selectedMaterial._id}`,
                ctaText: attachmentCtaText || 'Abrir material',
                badge: selectedMaterial.pricing === 'paid' ? 'Material premium' : 'Material de apoio',
                imageUrl: selectedMaterial.coverImage,
            }
        }

        if (attachmentType === 'flashcard' && selectedFlashcard) {
            return {
                type: 'flashcard',
                title: selectedFlashcard.title,
                description: selectedFlashcard.description || 'Deck de flashcards para revisar com pratica ativa.',
                url: `${appUrl}/flashcards/d/${selectedFlashcard.slug || selectedFlashcard._id}`,
                ctaText: attachmentCtaText || 'Estudar flashcards',
                badge: `${selectedFlashcard.cardCount || 0} flashcards`,
                imageUrl: selectedFlashcard.coverImage,
            }
        }

        const normalizedLink = normalizeHref(customLinkUrl)
        if (attachmentType === 'link' && normalizedLink) {
            return {
                type: 'link',
                title: customLinkTitle.trim() || 'Link recomendado',
                description: customLinkDescription.trim() || 'Clique para acessar o recurso recomendado pela equipe DomineAqui.',
                url: normalizedLink,
                ctaText: attachmentCtaText || 'Abrir link',
                badge: 'Link externo',
            }
        }

        return null
    }, [
        attachmentCtaText,
        attachmentType,
        customLinkDescription,
        customLinkTitle,
        customLinkUrl,
        selectedFlashcard,
        selectedMaterial,
    ])

    const contentHtml = useMemo(() => renderBlocksHtml(blocks), [blocks])
    const finalContent = useMemo(() => `${contentHtml}${renderAttachmentHtml(currentAttachment)}`, [contentHtml, currentAttachment])

    const recipientCount = selectAll
        ? users.length + additionalEmails.length
        : selectedUserIds.size + additionalEmails.length

    const plainContent = useMemo(() => blocks.map(block => [
        block.title,
        block.text,
        block.buttonText,
        ...(block.items || []),
    ].filter(Boolean).join(' ')).join(' '), [blocks])

    const readinessChecks = useMemo(() => {
        return [
            { label: 'Assunto com gancho', done: subject.trim().length >= 20 },
            { label: 'Preview preenchido', done: previewText.trim().length >= 25 },
            { label: 'Botao ou recurso clicavel', done: blocks.some(block => block.type === 'button' && normalizeHref(block.url)) || !!currentAttachment },
            { label: 'Conteudo suficiente', done: plainContent.trim().length >= 80 },
            { label: 'Destinatarios definidos', done: recipientCount > 0 },
        ]
    }, [blocks, currentAttachment, plainContent, previewText, recipientCount, subject])

    const readinessScore = readinessChecks.filter(item => item.done).length
    const selectedTemplate = templates.find(template => template.id === selectedTemplateId)

    const updateBlock = (blockId: string, updates: Partial<EmailBlock>) => {
        setBlocks(prev => prev.map(block => block.id === blockId ? { ...block, ...updates } : block))
    }

    const updateBlockItem = (blockId: string, index: number, value: string) => {
        setBlocks(prev => prev.map(block => {
            if (block.id !== blockId) return block
            const items = [...(block.items || [])]
            items[index] = value
            return { ...block, items }
        }))
    }

    const addBlockItem = (blockId: string) => {
        setBlocks(prev => prev.map(block => block.id === blockId ? { ...block, items: [...(block.items || []), 'Novo item'] } : block))
    }

    const removeBlockItem = (blockId: string, index: number) => {
        setBlocks(prev => prev.map(block => {
            if (block.id !== blockId) return block
            return { ...block, items: (block.items || []).filter((_, itemIndex) => itemIndex !== index) }
        }))
    }

    const addBlock = (type: EmailBlockType) => {
        setBlocks(prev => [...prev, makeBlock(type)])
        showToast('Bloco adicionado', 'success')
    }

    const removeBlock = (blockId: string) => {
        setBlocks(prev => prev.filter(block => block.id !== blockId))
    }

    const moveBlock = (blockId: string, direction: -1 | 1) => {
        setBlocks(prev => {
            const index = prev.findIndex(block => block.id === blockId)
            const nextIndex = index + direction
            if (index < 0 || nextIndex < 0 || nextIndex >= prev.length) return prev
            const next = [...prev]
            const [block] = next.splice(index, 1)
            next.splice(nextIndex, 0, block)
            return next
        })
    }

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds(prev => {
            const next = new Set(prev)
            if (next.has(userId)) {
                next.delete(userId)
            } else {
                next.add(userId)
            }
            return next
        })
        setSelectAll(false)
    }

    const toggleSelectAll = () => {
        setSelectAll(prev => !prev)
        setSelectedUserIds(new Set())
    }

    const selectFiltered = () => {
        setSelectedUserIds(new Set(filteredUsers.map(user => user._id)))
        setSelectAll(false)
    }

    const addEmail = () => {
        const email = newEmail.trim().toLowerCase()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showToast('E-mail invalido', 'error')
            return
        }

        if (!additionalEmails.includes(email)) {
            setAdditionalEmails(prev => [...prev, email])
        }
        setNewEmail('')
    }

    const loadTemplate = (template: EmailTemplate) => {
        setSelectedTemplateId(template.id)
        setSubject(templateSubject(template))
        setPreviewText(templatePreview(template))
        setBlocks(blocksFromTemplate(template))
        showToast(`Template "${template.name}" carregado`, 'success')
    }

    const getPreviewHtml = useCallback(() => {
        const logoUrl = 'https://www.domineaqui.com.br/logo.png'

        return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light dark">
        <meta name="supported-color-schemes" content="light dark">
        <style>
          :root { color-scheme: light dark; supported-color-schemes: light dark; }
          body { margin: 0; padding: 28px 14px; background: #eef3f0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
          .email-container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 18px; overflow: hidden; box-shadow: 0 18px 48px rgba(15, 61, 46, .14); }
          .header { background: linear-gradient(135deg, #0b3326 0%, #14533d 55%, #1a6b4d 100%); padding: 34px 20px; text-align: center; }
          .header img { max-height: 58px; }
          .header-accent { height: 4px; background: linear-gradient(90deg, #f57c00 0%, #ffb74d 50%, #f57c00 100%); }
          .content { padding: 42px 34px; line-height: 1.6; color: #1f2933; }
          .hero-block { text-align: center; margin-bottom: 30px; }
          .hero-block h1 { color: #0f3d2e; font-size: 29px; font-weight: 800; line-height: 1.18; letter-spacing: -0.4px; margin: 0 0 14px; }
          .hero-block p { color: #43505c; font-size: 17px; margin: 0; }
          .content h2 { color: #0f3d2e; font-size: 22px; font-weight: 700; line-height: 1.28; margin: 0 0 14px; }
          .content p, .content li { color: #43505c; font-size: 16px; }
          .content p { margin: 0 0 16px; }
          .text-block { margin: 18px 0; }
          .list-block { margin: 26px 0; }
          .list-block ul { padding-left: 22px; margin: 0; }
          .list-block li { margin: 9px 0; }
          .image-block { text-align: center; margin: 26px 0; }
          .image-block img { max-width: 100%; border-radius: 14px; }
          .button-block { text-align: center; margin: 28px 0; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #f57c00 0%, #ff9b21 100%); color: #fff !important; text-decoration: none; padding: 16px 38px; border-radius: 999px; font-weight: 800; letter-spacing: 0.2px; box-shadow: 0 8px 20px rgba(245, 124, 0, 0.32); }
          .highlight-box { background: linear-gradient(135deg, #fff4d6 0%, #ffe6a8 100%); border-left: 5px solid #f57c00; padding: 22px 24px; margin: 28px 0; border-radius: 14px; box-shadow: 0 6px 18px rgba(245, 124, 0, 0.12); }
          .highlight-box p { margin: 0 0 8px; color: #4a2f10; font-size: 16px; font-weight: 500; }
          .highlight-box p:last-child { margin-bottom: 0; }
          .highlight-box strong { color: #3a2408; font-weight: 800; }
          .quote-block { position: relative; background: #f4fbf7; border-left: 5px solid #1a6b4d; border-radius: 14px; margin: 28px 0; padding: 26px 28px 24px; }
          .quote-block .quote-mark { display: block; font-family: Georgia, 'Times New Roman', serif; font-size: 52px; line-height: 0.4; color: #1a6b4d; opacity: .35; margin-bottom: 8px; }
          .quote-block .quote-text { margin: 0; color: #2d3b34; font-style: italic; font-size: 18px; line-height: 1.55; }
          .quote-block .quote-author { margin: 16px 0 0; color: #0f3d2e; font-style: normal; font-weight: 700; font-size: 15px; }
          .quote-block .quote-author:before { content: "— "; color: #1a6b4d; }
          .resource-card { border: 1px solid #d4e7dc; background: linear-gradient(135deg, #f4fbf7 0%, #ffffff 100%); border-radius: 18px; padding: 26px; margin: 30px 0; }
          .resource-card h2 { margin-top: 0; }
          .resource-badge { display: inline-block; margin: 0 0 12px 0; padding: 6px 12px; border-radius: 999px; background: #e4f6ec; color: #0f3d2e !important; font-size: 12px !important; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; }
          .divider { height: 1px; background: linear-gradient(90deg, transparent, #d9e3dd, transparent); margin: 32px 0; }
          .footer { background: #f6f9f7; padding: 30px; text-align: center; border-top: 1px solid #e4ece8; }
          .footer p { margin: 5px 0; font-size: 13px; color: #6a7b73; }
          .social-link { color: #f57c00; font-weight: bold; text-decoration: none; }
          @media only screen and (max-width: 600px) {
            body { padding: 14px 8px; }
            .content { padding: 28px 22px; }
            .hero-block h1 { font-size: 25px; }
            .cta-button { display: block; padding: 15px 24px; }
          }
          @media (prefers-color-scheme: dark) {
            body { background: #0c1411 !important; }
            .email-container { background: #15211c !important; box-shadow: none !important; }
            .content { background: #15211c !important; }
            .hero-block h1, .content h2 { color: #58d6a0 !important; }
            .content p, .content li, .hero-block p, .text-block, .list-block li { color: #cdd9d3 !important; }
            .highlight-box { background: #3d2f10 !important; border-left-color: #ffb74d !important; box-shadow: none !important; }
            .highlight-box p { color: #ffe9c2 !important; }
            .highlight-box strong { color: #ffd98a !important; }
            .quote-block { background: #1b2a23 !important; border-left-color: #58d6a0 !important; }
            .quote-block .quote-mark { color: #58d6a0 !important; }
            .quote-block .quote-text { color: #e2ebe6 !important; }
            .quote-block .quote-author { color: #58d6a0 !important; }
            .quote-block .quote-author:before { color: #58d6a0 !important; }
            .resource-card { background: #1b2a23 !important; border-color: #2c3f36 !important; }
            .resource-badge { background: #173329 !important; color: #58d6a0 !important; }
            .divider { background: linear-gradient(90deg, transparent, #2a3a33, transparent) !important; }
            .footer { background: #101a16 !important; border-top-color: #1f2d27 !important; }
            .footer p { color: #849991 !important; }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <img src="${logoUrl}" alt="DomineAqui">
          </div>
          <div class="header-accent"></div>
          <div class="content">
            ${finalContent || '<p style="color: #999; text-align: center;">Seu conteudo aparecera aqui...</p>'}
          </div>
          <div class="footer">
            <p>Siga-nos no Instagram: <a href="https://instagram.com/domineaqui.br" class="social-link">@domineaqui.br</a></p>
            <p>&copy; ${new Date().getFullYear()} DomineAqui. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `
    }, [finalContent])

    const sendEmail = async () => {
        if (!subject.trim()) {
            showToast('Informe o assunto do e-mail', 'error')
            return
        }
        if (!plainContent.trim()) {
            showToast('Escreva o conteudo do e-mail', 'error')
            return
        }
        if (recipientCount === 0) {
            showToast('Selecione pelo menos um destinatario', 'error')
            return
        }

        setSending(true)
        setSendResult(null)

        try {
            const res = await fetch('/api/admin/emails/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipients: {
                        userIds: selectAll ? undefined : Array.from(selectedUserIds),
                        additionalEmails,
                        selectAll,
                    },
                    subject,
                    content: finalContent,
                    previewText,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao enviar e-mails')
            }

            setSendResult(data)
            showToast(data.message, 'success')
        } catch (error) {
            const err = error as Error
            showToast(err.message, 'error')
        } finally {
            setSending(false)
        }
    }

    const reloadDrafts = async () => {
        try {
            const res = await fetch('/api/admin/emails/drafts', { cache: 'no-store' })
            if (res.ok) {
                const data = await res.json()
                setDrafts(data.drafts || [])
            }
        } catch (error) {
            console.error('Reload drafts error:', error)
        }
    }

    const saveDraft = async (asNew = false) => {
        if (!subject.trim() && !plainContent.trim()) {
            showToast('Adicione um assunto ou conteúdo antes de salvar', 'error')
            return
        }

        setSavingDraft(true)
        try {
            const payload = {
                id: asNew ? undefined : currentDraftId || undefined,
                name: subject.trim() || 'Rascunho sem título',
                subject,
                previewText,
                blocks,
                attachmentType,
                selectedMaterialId,
                selectedFlashcardId,
                customLinkUrl,
                customLinkTitle,
                customLinkDescription,
                attachmentCtaText,
                selectedTemplateId,
            }

            const res = await fetch('/api/admin/emails/drafts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || 'Erro ao salvar rascunho')
            }

            if (data.draft?._id) {
                setCurrentDraftId(data.draft._id)
            }
            await reloadDrafts()
            showToast(asNew || !payload.id ? 'Rascunho salvo' : 'Rascunho atualizado', 'success')
        } catch (error) {
            const err = error as Error
            showToast(err.message, 'error')
        } finally {
            setSavingDraft(false)
        }
    }

    const loadDraft = (draft: EmailDraft) => {
        setCurrentDraftId(draft._id)
        setSubject(draft.subject || '')
        setPreviewText(draft.previewText || '')
        setBlocks(Array.isArray(draft.blocks) && draft.blocks.length > 0
            ? draft.blocks.map(block => ({ ...block, id: newId(), items: block.items ? [...block.items] : undefined }))
            : cloneBlocks(visualTemplatePresets.empty.blocks))
        setAttachmentType((draft.attachmentType as AttachmentType) || 'none')
        setSelectedMaterialId(draft.selectedMaterialId || '')
        setSelectedFlashcardId(draft.selectedFlashcardId || '')
        setCustomLinkUrl(draft.customLinkUrl || '')
        setCustomLinkTitle(draft.customLinkTitle || '')
        setCustomLinkDescription(draft.customLinkDescription || '')
        setAttachmentCtaText(draft.attachmentCtaText || 'Acessar agora')
        setSelectedTemplateId(draft.selectedTemplateId || '')
        setShowDrafts(false)
        showToast(`Rascunho "${draft.name}" carregado`, 'success')
    }

    const deleteDraft = async (draftId: string) => {
        if (!confirm('Excluir este rascunho?')) return
        try {
            const res = await fetch(`/api/admin/emails/drafts/${draftId}`, { method: 'DELETE' })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                throw new Error(data.error || 'Erro ao excluir rascunho')
            }
            if (currentDraftId === draftId) setCurrentDraftId(null)
            await reloadDrafts()
            showToast('Rascunho excluído', 'success')
        } catch (error) {
            const err = error as Error
            showToast(err.message, 'error')
        }
    }

    if (loading) {
        return <LogoLoading message="Carregando central de e-mails..." size="lg" fullscreen />
    }

    return (
        <AppShell headerTitle="Central de E-mails" headerSubtitle="Campanhas administrativas com editor visual">
            <BanChecker />
            <div className="container mx-auto max-w-[1500px] px-4 py-7">
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                        <Button variant="ghost" size="icon" onClick={() => router.push('/admin')} className="mt-1 shrink-0">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Criar e-mail</h1>
                                <Badge variant="outline" className="gap-1">
                                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                    {templates.length} templates
                                </Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Escolha um template, edite os blocos e envie com preview.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:min-w-[460px]">
                        <div className="rounded-lg border bg-white p-3 text-center shadow-sm dark:bg-slate-950">
                            <p className="text-xs text-muted-foreground">Destinatários</p>
                            <p className="text-xl font-bold">{recipientCount}</p>
                        </div>
                        <div className="rounded-lg border bg-white p-3 text-center shadow-sm dark:bg-slate-950">
                            <p className="text-xs text-muted-foreground">Template</p>
                            <p className="truncate text-sm font-semibold">{selectedTemplate?.name || 'Livre'}</p>
                        </div>
                        <div className="rounded-lg border bg-white p-3 text-center shadow-sm dark:bg-slate-950">
                            <p className="text-xs text-muted-foreground">Anexo</p>
                            <p className="truncate text-sm font-semibold">{currentAttachment?.badge || 'Nenhum'}</p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)_390px]">
                    <div className="space-y-5">
                        <Card className="overflow-hidden">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Wand2 className="h-5 w-5 text-amber-500" />
                                    Templates
                                </CardTitle>
                                <CardDescription>Modelos prontos para editar em blocos.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={templateSearch}
                                        onChange={(event) => setTemplateSearch(event.target.value)}
                                        placeholder="Buscar campanha..."
                                        className="pl-9"
                                    />
                                </div>

                                <div className="flex gap-2 overflow-x-auto pb-1">
                                    {categories.map(category => (
                                        <Button
                                            key={category}
                                            type="button"
                                            size="sm"
                                            variant={templateCategory === category ? 'default' : 'outline'}
                                            onClick={() => setTemplateCategory(category)}
                                            className="shrink-0"
                                        >
                                            {category}
                                        </Button>
                                    ))}
                                </div>

                                <div className="max-h-[530px] space-y-2 overflow-y-auto pr-1">
                                    {visibleTemplates.map(template => (
                                        <button
                                            key={template.id}
                                            type="button"
                                            onClick={() => loadTemplate(template)}
                                            className={`w-full rounded-lg border p-3 text-left transition hover:border-primary hover:bg-primary/5 ${selectedTemplateId === template.id ? 'border-primary bg-primary/10' : 'bg-background'}`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold">{template.name}</p>
                                                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{template.description}</p>
                                                </div>
                                                <Badge variant="outline" className="shrink-0 text-[10px]">
                                                    {template.category || 'Geral'}
                                                </Badge>
                                            </div>
                                            <p className="mt-3 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{templateSubject(template) || 'Sem assunto predefinido'}</p>
                                        </button>
                                    ))}
                                    {visibleTemplates.length === 0 && (
                                        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                            Nenhum template encontrado.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-5">
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Mail className="h-5 w-5 text-emerald-600" />
                                    Caixa de entrada
                                </CardTitle>
                                <CardDescription>O que aparece antes do e-mail ser aberto.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium">Assunto *</label>
                                        <Input
                                            value={subject}
                                            onChange={(event) => setSubject(event.target.value)}
                                            placeholder="Ex: Seu próximo passo de estudo está aqui"
                                            className="text-base"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium">Preview *</label>
                                        <Input
                                            value={previewText}
                                            onChange={(event) => setPreviewText(event.target.value)}
                                            placeholder="A frase que aparece na caixa de entrada"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                                    <span className="font-semibold">Variáveis de personalização:</span>
                                    <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono dark:bg-amber-900/60">%nome%</code>
                                    <span className="text-amber-600 dark:text-amber-400">— primeiro nome</span>
                                    <span className="mx-1 text-amber-300 dark:text-amber-700">|</span>
                                    <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono dark:bg-amber-900/60">%nome completo%</code>
                                    <span className="text-amber-600 dark:text-amber-400">— nome completo</span>
                                    <span className="ml-auto text-amber-500 dark:text-amber-500">Funciona no assunto, preview e conteúdo</span>
                                </div>

                                <div className="rounded-lg border bg-slate-50 p-4 dark:bg-slate-900">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white">
                                            DA
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="truncate text-sm font-semibold">DomineAqui</p>
                                                <p className="text-xs text-muted-foreground">Agora</p>
                                            </div>
                                            <p className="truncate text-sm font-medium">{subject || 'Assunto do e-mail'}</p>
                                            <p className="truncate text-sm text-muted-foreground">{previewText || 'Texto de preview que aparece na caixa de entrada.'}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                    Conteúdo
                                </CardTitle>
                                <CardDescription>Edite cada bloco sem escrever código.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
                                    {blockOptions.map(option => {
                                        const Icon = option.icon
                                        return (
                                            <Button
                                                key={option.type}
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => addBlock(option.type)}
                                                className="gap-1"
                                            >
                                                <Icon className="h-4 w-4" />
                                                {option.label}
                                            </Button>
                                        )
                                    })}
                                </div>

                                <div className="space-y-3">
                                    {blocks.map((block, index) => (
                                        <Card key={block.id} className="border-slate-200 shadow-none dark:border-slate-800">
                                            <CardHeader className="flex-row items-center justify-between space-y-0 p-4 pb-3">
                                                <div className="min-w-0">
                                                    <CardTitle className="text-sm">{blockLabels[block.type]}</CardTitle>
                                                    <CardDescription>Bloco {index + 1}</CardDescription>
                                                </div>
                                                <div className="flex shrink-0 gap-1">
                                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveBlock(block.id, -1)} disabled={index === 0}>
                                                        <ChevronUp className="h-4 w-4" />
                                                    </Button>
                                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveBlock(block.id, 1)} disabled={index === blocks.length - 1}>
                                                        <ChevronDown className="h-4 w-4" />
                                                    </Button>
                                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeBlock(block.id)} disabled={blocks.length === 1}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-3 p-4 pt-0">
                                                {block.type === 'hero' && (
                                                    <>
                                                        <Input value={block.title || ''} onChange={(event) => updateBlock(block.id, { title: event.target.value })} placeholder="Titulo principal" />
                                                        <Textarea value={block.text || ''} onChange={(event) => updateBlock(block.id, { text: event.target.value })} placeholder="Subtitulo curto" className="min-h-[86px]" />
                                                    </>
                                                )}

                                                {block.type === 'text' && (
                                                    <Textarea value={block.text || ''} onChange={(event) => updateBlock(block.id, { text: event.target.value })} placeholder="Texto do e-mail" className="min-h-[130px]" />
                                                )}

                                                {block.type === 'highlight' && (
                                                    <>
                                                        <Input value={block.title || ''} onChange={(event) => updateBlock(block.id, { title: event.target.value })} placeholder="Titulo do destaque" />
                                                        <Textarea value={block.text || ''} onChange={(event) => updateBlock(block.id, { text: event.target.value })} placeholder="Texto do destaque" className="min-h-[100px]" />
                                                    </>
                                                )}

                                                {block.type === 'list' && (
                                                    <>
                                                        <Input value={block.title || ''} onChange={(event) => updateBlock(block.id, { title: event.target.value })} placeholder="Titulo da lista" />
                                                        <div className="space-y-2">
                                                            {(block.items || []).map((item, itemIndex) => (
                                                                <div key={`${block.id}-${itemIndex}`} className="flex gap-2">
                                                                    <Input value={item} onChange={(event) => updateBlockItem(block.id, itemIndex, event.target.value)} placeholder={`Item ${itemIndex + 1}`} />
                                                                    <Button type="button" variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={() => removeBlockItem(block.id, itemIndex)} disabled={(block.items || []).length <= 1}>
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <Button type="button" variant="outline" size="sm" onClick={() => addBlockItem(block.id)}>
                                                            <Plus className="mr-2 h-4 w-4" />
                                                            Adicionar item
                                                        </Button>
                                                    </>
                                                )}

                                                {block.type === 'button' && (
                                                    <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
                                                        <Input value={block.buttonText || ''} onChange={(event) => updateBlock(block.id, { buttonText: event.target.value })} placeholder="Texto do botao" />
                                                        <Input value={block.url || ''} onChange={(event) => updateBlock(block.id, { url: event.target.value })} placeholder="https://..." />
                                                    </div>
                                                )}

                                                {block.type === 'image' && (
                                                    <div className="grid gap-3">
                                                        <Input value={block.imageUrl || ''} onChange={(event) => updateBlock(block.id, { imageUrl: event.target.value })} placeholder="URL da imagem" />
                                                        <Input value={block.alt || ''} onChange={(event) => updateBlock(block.id, { alt: event.target.value })} placeholder="Descricao da imagem" />
                                                    </div>
                                                )}

                                                {block.type === 'quote' && (
                                                    <div className="space-y-2">
                                                        <Textarea value={block.text || ''} onChange={(event) => updateBlock(block.id, { text: event.target.value })} placeholder="Citacao ou prova social" className="min-h-[100px]" />
                                                        <Input value={block.author || ''} onChange={(event) => updateBlock(block.id, { author: event.target.value })} placeholder="Autor da citacao (ex: Maria, aluna aprovada)" />
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                <Button type="button" variant="outline" className="w-full" onClick={() => setShowPreview(true)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Visualizar e-mail
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Paperclip className="h-5 w-5 text-violet-600" />
                                    Anexar recurso clicável
                                </CardTitle>
                                <CardDescription>Material, flashcard ou link como card dentro do e-mail.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2 sm:grid-cols-4">
                                    {[
                                        { value: 'none', label: 'Nenhum', icon: X },
                                        { value: 'material', label: 'Material', icon: BookOpen },
                                        { value: 'flashcard', label: 'Flashcard', icon: GraduationCap },
                                        { value: 'link', label: 'Link', icon: Link2 },
                                    ].map(option => {
                                        const Icon = option.icon
                                        return (
                                            <Button
                                                key={option.value}
                                                type="button"
                                                variant={attachmentType === option.value ? 'default' : 'outline'}
                                                onClick={() => setAttachmentType(option.value as AttachmentType)}
                                                className="gap-2"
                                            >
                                                <Icon className="h-4 w-4" />
                                                {option.label}
                                            </Button>
                                        )
                                    })}
                                </div>

                                {attachmentType === 'material' && (
                                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                                        <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Escolha um material" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {materials.map(material => (
                                                    <SelectItem key={material._id} value={material._id}>
                                                        {material.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Input value={attachmentCtaText} onChange={(event) => setAttachmentCtaText(event.target.value)} placeholder="Texto do botao" />
                                    </div>
                                )}

                                {attachmentType === 'flashcard' && (
                                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                                        <Select value={selectedFlashcardId} onValueChange={setSelectedFlashcardId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Escolha um deck" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {flashcards.map(deck => (
                                                    <SelectItem key={deck._id} value={deck._id}>
                                                        {deck.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Input value={attachmentCtaText} onChange={(event) => setAttachmentCtaText(event.target.value)} placeholder="Texto do botao" />
                                    </div>
                                )}

                                {attachmentType === 'link' && (
                                    <div className="grid gap-3">
                                        <Input value={customLinkUrl} onChange={(event) => setCustomLinkUrl(event.target.value)} placeholder="https://..." />
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <Input value={customLinkTitle} onChange={(event) => setCustomLinkTitle(event.target.value)} placeholder="Titulo do link" />
                                            <Input value={attachmentCtaText} onChange={(event) => setAttachmentCtaText(event.target.value)} placeholder="Texto do botao" />
                                        </div>
                                        <Textarea
                                            value={customLinkDescription}
                                            onChange={(event) => setCustomLinkDescription(event.target.value)}
                                            placeholder="Descricao curta"
                                            className="min-h-[88px]"
                                        />
                                    </div>
                                )}

                                {currentAttachment ? (
                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
                                        <div className="flex items-start gap-3">
                                            <Paperclip className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                                            <div className="min-w-0">
                                                <p className="font-semibold text-emerald-950 dark:text-emerald-100">{currentAttachment.title}</p>
                                                <p className="mt-1 line-clamp-2 text-sm text-emerald-900/75 dark:text-emerald-100/75">{currentAttachment.description}</p>
                                                <p className="mt-2 truncate text-xs text-emerald-800 dark:text-emerald-200">{currentAttachment.url}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : attachmentType !== 'none' ? (
                                    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                        Escolha ou preencha o recurso para anexar ao e-mail.
                                    </div>
                                ) : null}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-5">
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Target className="h-5 w-5 text-rose-600" />
                                    Checklist
                                </CardTitle>
                                <CardDescription>{readinessScore} de {readinessChecks.length} pontos prontos.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="h-2 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-blue-600 to-amber-500 transition-all"
                                        style={{ width: `${(readinessScore / readinessChecks.length) * 100}%` }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    {readinessChecks.map(item => (
                                        <div key={item.label} className="flex items-center gap-2 text-sm">
                                            {item.done ? (
                                                <Check className="h-4 w-4 text-emerald-600" />
                                            ) : (
                                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                            )}
                                            <span className={item.done ? 'font-medium' : 'text-muted-foreground'}>{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Tabs defaultValue="users">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="users">
                                    <Users className="mr-2 h-4 w-4" />
                                    Usuários
                                </TabsTrigger>
                                <TabsTrigger value="extras">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Extras
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="users" className="mt-4">
                                <Card>
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-lg">Destinatários</CardTitle>
                                        <CardDescription>Selecione todos, filtrados ou usuários específicos.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-2 sm:grid-cols-3">
                                            <Button type="button" variant={selectAll ? 'default' : 'outline'} size="sm" onClick={toggleSelectAll}>
                                                {selectAll && <Check className="mr-2 h-4 w-4" />}
                                                Todos ({users.length})
                                            </Button>
                                            <Button type="button" variant="outline" size="sm" onClick={selectFiltered} disabled={filteredUsers.length === 0}>
                                                Filtrados ({filteredUsers.length})
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedUserIds(new Set())
                                                    setSelectAll(false)
                                                }}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Limpar
                                            </Button>
                                        </div>

                                        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_135px_135px]">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    value={searchQuery}
                                                    onChange={(event) => setSearchQuery(event.target.value)}
                                                    placeholder="Buscar usuário..."
                                                    className="pl-9"
                                                />
                                            </div>
                                            <Select value={filterAccountType} onValueChange={setFilterAccountType}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Tipo" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todos</SelectItem>
                                                    <SelectItem value="admin">Admins</SelectItem>
                                                    <SelectItem value="premium">Premium</SelectItem>
                                                    <SelectItem value="trial">Trial</SelectItem>
                                                    <SelectItem value="gratuito">Gratuito</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Select value={filterPeriodo} onValueChange={setFilterPeriodo}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Período" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todos períodos</SelectItem>
                                                    <SelectItem value="none">Sem período</SelectItem>
                                                    {PERIODO_OPTIONS.map((p) => (
                                                        <SelectItem key={p} value={String(p)}>{formatPeriodoLabel(p)}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {filterPeriodo !== 'all' && (
                                            <p className="text-xs text-muted-foreground">
                                                Dica: use o botão <strong>Filtrados</strong> para selecionar apenas estes usuários e enviar só para o período escolhido.
                                            </p>
                                        )}

                                        <div className="max-h-[360px] overflow-y-auto rounded-lg border">
                                            {filteredUsers.length === 0 ? (
                                                <div className="p-8 text-center text-sm text-muted-foreground">Nenhum usuário encontrado</div>
                                            ) : (
                                                filteredUsers.map(user => (
                                                    <button
                                                        key={user._id}
                                                        type="button"
                                                        onClick={() => toggleUserSelection(user._id)}
                                                        className={`flex w-full items-center gap-3 border-b p-3 text-left last:border-b-0 hover:bg-muted/50 ${selectAll || selectedUserIds.has(user._id) ? 'bg-primary/10' : ''}`}
                                                    >
                                                        <Checkbox
                                                            checked={selectAll || selectedUserIds.has(user._id)}
                                                            onCheckedChange={() => toggleUserSelection(user._id)}
                                                            onClick={(event) => event.stopPropagation()}
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-medium">{user.name}</p>
                                                            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                                                        </div>
                                                        <div className="flex shrink-0 flex-col items-end gap-1">
                                                            {user.role === 'admin' && <Badge variant="secondary" className="text-[10px]">Admin</Badge>}
                                                            {user.accountType && user.role !== 'admin' && <Badge variant="outline" className="text-[10px]">{user.accountType}</Badge>}
                                                            {(() => {
                                                                const p = computeCurrentPeriodo(user.periodoBase, user.periodoBaseRef)
                                                                return p !== null ? <Badge variant="outline" className="text-[10px]">{p}º período</Badge> : null
                                                            })()}
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="extras" className="mt-4">
                                <Card>
                                    <CardHeader className="pb-4">
                                        <CardTitle className="text-lg">E-mails extras</CardTitle>
                                        <CardDescription>Inclua destinatários fora da base de usuários.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex gap-2">
                                            <Input
                                                value={newEmail}
                                                onChange={(event) => setNewEmail(event.target.value)}
                                                placeholder="email@exemplo.com"
                                                type="email"
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter') {
                                                        event.preventDefault()
                                                        addEmail()
                                                    }
                                                }}
                                            />
                                            <Button type="button" onClick={addEmail}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Adicionar
                                            </Button>
                                        </div>

                                        {additionalEmails.length === 0 ? (
                                            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                                                Nenhum e-mail adicional.
                                            </div>
                                        ) : (
                                            <div className="max-h-56 divide-y overflow-y-auto rounded-lg border">
                                                {additionalEmails.map(email => (
                                                    <div key={email} className="flex items-center justify-between gap-2 p-3">
                                                        <span className="truncate text-sm">{email}</span>
                                                        <div className="flex gap-1">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(email)
                                                                    showToast('E-mail copiado', 'success')
                                                                }}
                                                            >
                                                                <Copy className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-destructive"
                                                                onClick={() => setAdditionalEmails(prev => prev.filter(item => item !== email))}
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>

                        <Card className={recipientCount > 0 ? 'border-emerald-300 shadow-sm shadow-emerald-100 dark:shadow-none' : ''}>
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Send className="h-5 w-5 text-emerald-600" />
                                    Envio
                                </CardTitle>
                                <CardDescription>Revise o resumo antes de disparar.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-lg bg-muted/50 p-4 text-sm">
                                    <div className="flex justify-between gap-4">
                                        <span className="text-muted-foreground">Assunto</span>
                                        <span className="max-w-[220px] truncate font-medium">{subject || 'Nao definido'}</span>
                                    </div>
                                    <div className="mt-2 flex justify-between gap-4">
                                        <span className="text-muted-foreground">Destinatários</span>
                                        <span className="font-medium">{recipientCount}</span>
                                    </div>
                                    <div className="mt-2 flex justify-between gap-4">
                                        <span className="text-muted-foreground">Blocos</span>
                                        <span className="font-medium">{blocks.length}</span>
                                    </div>
                                    <div className="mt-2 flex justify-between gap-4">
                                        <span className="text-muted-foreground">Recurso</span>
                                        <span className="max-w-[220px] truncate font-medium">{currentAttachment?.title || 'Sem anexo'}</span>
                                    </div>
                                </div>

                                {sendResult && (
                                    <div className={`rounded-lg p-4 ${sendResult.stats.failed > 0 ? 'bg-yellow-50 dark:bg-yellow-950/20' : 'bg-green-50 dark:bg-green-950/20'}`}>
                                        <div className="flex items-start gap-3">
                                            {sendResult.stats.failed > 0 ? (
                                                <AlertCircle className="mt-0.5 h-5 w-5 text-yellow-600" />
                                            ) : (
                                                <Check className="mt-0.5 h-5 w-5 text-green-600" />
                                            )}
                                            <div>
                                                <p className="font-medium">{sendResult.message}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Enviados: {sendResult.stats.sent} | Falhas: {sendResult.stats.failed}
                                                </p>
                                                {sendResult.errors && sendResult.errors.length > 0 && (
                                                    <details className="mt-2">
                                                        <summary className="cursor-pointer text-sm text-destructive">Ver erros ({sendResult.errors.length})</summary>
                                                        <ul className="mt-1 space-y-1 text-xs">
                                                            {sendResult.errors.map((err, index) => (
                                                                <li key={index} className="text-destructive">{err}</li>
                                                            ))}
                                                        </ul>
                                                    </details>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <Button type="button" variant="outline" onClick={() => setShowPreview(true)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Revisar preview
                                    </Button>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => saveDraft(false)}
                                            disabled={savingDraft}
                                        >
                                            {savingDraft ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Save className="mr-2 h-4 w-4" />
                                            )}
                                            {currentDraftId ? 'Atualizar rascunho' : 'Salvar rascunho'}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setShowDrafts(true)}
                                        >
                                            <FolderOpen className="mr-2 h-4 w-4" />
                                            Rascunhos {drafts.length > 0 ? `(${drafts.length})` : ''}
                                        </Button>
                                    </div>
                                    {currentDraftId && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => saveDraft(true)}
                                            disabled={savingDraft}
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Salvar como novo rascunho
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        onClick={sendEmail}
                                        disabled={sending || recipientCount === 0 || !subject.trim() || !plainContent.trim()}
                                        className="h-12 text-base"
                                    >
                                        {sending ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Enviando...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="mr-2 h-5 w-5" />
                                                Enviar para {recipientCount} destinatário{recipientCount !== 1 ? 's' : ''}
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {recipientCount > 50 && (
                                    <p className="text-center text-xs text-muted-foreground">
                                        Envios em massa são processados em lotes e podem levar alguns minutos.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            Preview do e-mail
                        </DialogTitle>
                        <DialogDescription>{subject || 'Sem assunto definido'}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                        <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <BarChart3 className="h-4 w-4 text-blue-600" />
                                Resumo
                            </div>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-xs text-muted-foreground">Destinatários</p>
                                    <p className="font-semibold">{recipientCount}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Template</p>
                                    <p className="font-semibold">{selectedTemplate?.name || 'Composição livre'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Blocos</p>
                                    <p className="font-semibold">{blocks.length}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Anexo</p>
                                    <p className="font-semibold">{currentAttachment?.title || 'Nenhum'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Checklist</p>
                                    <p className="font-semibold">{readinessScore}/{readinessChecks.length}</p>
                                </div>
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-lg border">
                            <iframe srcDoc={getPreviewHtml()} className="h-[680px] w-full" title="Email Preview" />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showDrafts} onOpenChange={setShowDrafts}>
                <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FolderOpen className="h-5 w-5" />
                            Rascunhos salvos
                        </DialogTitle>
                        <DialogDescription>
                            Continue de onde parou ou exclua rascunhos antigos.
                        </DialogDescription>
                    </DialogHeader>
                    {drafts.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                            Nenhum rascunho salvo ainda.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {drafts.map(draft => (
                                <div
                                    key={draft._id}
                                    className={`flex items-start justify-between gap-3 rounded-lg border p-3 ${currentDraftId === draft._id ? 'border-primary bg-primary/5' : ''}`}
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold">{draft.name || 'Rascunho sem título'}</p>
                                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                            {draft.subject || 'Sem assunto'}
                                        </p>
                                        {draft.updatedAt && (
                                            <p className="mt-1 text-[11px] text-muted-foreground">
                                                Atualizado em {new Date(draft.updatedAt).toLocaleString('pt-BR')}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex shrink-0 gap-1">
                                        <Button type="button" size="sm" onClick={() => loadDraft(draft)}>
                                            Abrir
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive"
                                            onClick={() => deleteDraft(draft._id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <ToastAlert
                open={toast.open}
                onOpenChange={(open) => setToast(prev => ({ ...prev, open }))}
                message={toast.message}
                type={toast.type}
            />
        </AppShell>
    )
}
