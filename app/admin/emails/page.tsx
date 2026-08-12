'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    AlertCircle,
    ArrowLeft,
    BarChart3,
    BookOpen,
    CalendarClock,
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
    Monitor,
    Pause,
    Paperclip,
    Play,
    Plus,
    Save,
    Terminal,
    Search,
    Send,
    Smartphone,
    Sparkles,
    Target,
    Trash2,
    TrendingUp,
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
import {
    getMarketingEmailTemplate,
    renderEmailButton,
    renderEmailStats,
} from '@/lib/comms/email-render'
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

interface RecipientStatus {
    email: string
    name: string
    /** pending | processing | sent | delivered | failed | dead | skipped */
    status: string
    attempts: number
    error?: string
    sentAt?: string
}

interface CampaignStats {
    total: number
    sent: number
    pending: number
    failed: number
    dead: number
    skipped: number
}

interface SendResult {
    success?: boolean
    campaignId?: string
    message: string
    stats: CampaignStats
    /** true quando não há mais nada pendente na fila desta campanha. */
    done?: boolean
    recipients?: RecipientStatus[]
    errors?: string[]
}

type ScheduleFrequency = 'once' | 'daily' | 'weekly' | 'monthly'

interface EmailSchedule {
    _id: string
    name: string
    subject: string
    frequency: ScheduleFrequency
    time: string
    timezone: string
    weekdays?: number[]
    dayOfMonth?: number
    date?: string
    isActive: boolean
    nextRunAt: string | null
    lastRunAt?: string
    lastStatus?: 'ok' | 'error' | 'empty'
    lastError?: string
    lastRecipientCount?: number
    runCount: number
}

type AttachmentType = 'none' | 'material' | 'flashcard' | 'link'
type EmailBlockType = 'hero' | 'text' | 'highlight' | 'list' | 'button' | 'image' | 'quote' | 'stats'

interface EmailStat {
    value: string
    label: string
}

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
    /** hero: rótulo curto acima do título (ex.: "NOVIDADE"). */
    eyebrow?: string
    /** button: frase curta abaixo do botão (ex.: "Leva 2 minutos"). */
    hint?: string
    /** stats: prova social em números. */
    stats?: EmailStat[]
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

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

type MobileTab = 'templates' | 'content' | 'send'

const MOBILE_TABS: Array<{ id: MobileTab; label: string; icon: typeof Mail }> = [
    { id: 'templates', label: 'Modelos', icon: Wand2 },
    { id: 'content', label: 'Conteúdo', icon: FileText },
    { id: 'send', label: 'Enviar', icon: Send },
]

const FREQUENCY_LABELS: Record<ScheduleFrequency, string> = {
    once: 'Uma vez',
    daily: 'Todo dia',
    weekly: 'Toda semana',
    monthly: 'Todo mês',
}

/** Rótulo e cor de cada status da fila, para a lista de destinatários. */
const RECIPIENT_STATUS: Record<string, { label: string; className: string }> = {
    sent: { label: 'Enviado', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
    delivered: { label: 'Entregue', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
    pending: { label: 'Na fila', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
    processing: { label: 'Enviando', className: 'bg-sky-500/15 text-sky-700 dark:text-sky-400' },
    failed: { label: 'Retentando', className: 'bg-orange-500/15 text-orange-700 dark:text-orange-400' },
    dead: { label: 'Falhou', className: 'bg-red-500/15 text-red-700 dark:text-red-400' },
    skipped: { label: 'Ignorado', className: 'bg-slate-500/15 text-slate-600 dark:text-slate-400' },
}

function formatDateTime(value?: string | null): string {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
    })
}

// Endpoint que o cron externo precisa chamar. O segredo fica de fora
// deliberadamente — ele nunca é exposto ao navegador; o admin cola o valor de
// CRON_SECRET no lugar do placeholder.
const cronEndpoint = `${appUrl.replace(/\/$/, '')}/api/cron/email-scheduler`
const cronUrl = `${cronEndpoint}?token=SEU_SEGREDO`
const cronCurl = `curl -X POST "${cronEndpoint}" -H "Authorization: Bearer SEU_SEGREDO"`

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
    admin: 'admins',
    premium: 'assinantes Plus+',
    trial: 'contas em trial',
    gratuito: 'contas gratuitas',
}

/** Frase legível do público de um agendamento dinâmico (sem expor 'all'). */
function describeAudienceFilter(accountType: string, periodo: string): string {
    const audience = accountType === 'all'
        ? 'Todos os usuários'
        : `Usuários: ${ACCOUNT_TYPE_LABELS[accountType] || accountType}`

    if (periodo === 'all') return audience
    if (periodo === 'none') return `${audience}, sem período definido`
    return `${audience}, do ${periodo}º período`
}

/** Descrição legível da recorrência, para a lista de agendamentos. */
function describeSchedule(schedule: EmailSchedule): string {
    const at = `às ${schedule.time}`
    switch (schedule.frequency) {
        case 'once':
            return `Uma vez em ${schedule.date?.split('-').reverse().join('/') || '—'} ${at}`
        case 'daily':
            return `Todo dia ${at}`
        case 'weekly': {
            const days = (schedule.weekdays || []).map(d => WEEKDAY_LABELS[d]).join(', ')
            return `Toda semana (${days || '—'}) ${at}`
        }
        case 'monthly':
            return `Todo dia ${schedule.dayOfMonth || 1} do mês ${at}`
        default:
            return at
    }
}

const blockOptions: Array<{ type: EmailBlockType; label: string; icon: typeof Type }> = [
    { type: 'hero', label: 'Titulo', icon: Type },
    { type: 'text', label: 'Texto', icon: FileText },
    { type: 'highlight', label: 'Destaque', icon: Sparkles },
    { type: 'list', label: 'Lista', icon: List },
    { type: 'button', label: 'Botao', icon: Link2 },
    { type: 'image', label: 'Imagem', icon: ImageIcon },
    { type: 'quote', label: 'Citação', icon: MessageSquareQuote },
    { type: 'stats', label: 'Números', icon: TrendingUp },
]

const blockLabels: Record<EmailBlockType, string> = {
    hero: 'Título principal',
    text: 'Texto',
    highlight: 'Destaque',
    list: 'Lista',
    button: 'Botão',
    image: 'Imagem',
    quote: 'Citação',
    stats: 'Números (prova social)',
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
        button: { id: newId(), type: 'button', buttonText: 'Acessar agora', url: appUrl, hint: '' },
        image: { id: newId(), type: 'image', imageUrl: '', alt: 'Imagem do e-mail' },
        quote: { id: newId(), type: 'quote', text: 'Insira uma prova social, depoimento ou frase curta.', author: 'Nome do autor' },
        stats: {
            id: newId(),
            type: 'stats',
            stats: [
                { value: '+12 mil', label: 'estudantes na plataforma' },
                { value: '4,9', label: 'nota média dos materiais' },
                { value: '24h', label: 'acesso liberado na hora' },
            ],
        },
    }

    return { ...defaults[type], id: newId(), ...data }
}

function cloneBlocks(blocks: EmailBlock[]) {
    return blocks.map(block => ({
        ...block,
        id: newId(),
        items: block.items ? [...block.items] : undefined,
        stats: block.stats ? block.stats.map(stat => ({ ...stat })) : undefined,
    }))
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
                    ${block.eyebrow ? `<span class="hero-eyebrow">${escapeHtml(block.eyebrow)}</span>` : ''}
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
                    <ul class="check-list">
                      ${(block.items || []).filter(Boolean).map(item => `<li><span class="check-icon" style="color:#1a6b4d;font-weight:800;padding-right:10px;">&#10003;</span>${applyInline(escapeHtml(item))}</li>`).join('')}
                    </ul>
                  </div>
                `
            case 'button': {
                const href = normalizeHref(block.url)
                if (!href) return ''
                // Botão em tabela: um <a> com padding é ignorado pelo Outlook,
                // que renderizaria só o texto sem a pílula laranja.
                return renderEmailButton(
                    escapeHtml(href),
                    escapeHtml(block.buttonText || 'Acessar agora'),
                    block.hint ? escapeHtml(block.hint) : undefined,
                )
            }
            case 'stats':
                return renderEmailStats(
                    (block.stats || []).map(stat => ({
                        value: escapeHtml(stat.value || ''),
                        label: escapeHtml(stat.label || ''),
                    })),
                )
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
        ${renderEmailButton(escapeHtml(attachment.url), escapeHtml(attachment.ctaText))}
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
        subject: 'Condicao especial para assinar o Plus+',
        previewText: 'Aproveite a oferta antes que ela termine.',
        blocks: [
            makeBlock('hero', { title: 'Oferta especial liberada', text: 'Um empurrao para estudar com mais recursos e menos limite.' }),
            makeBlock('highlight', { title: '[X]% de desconto', text: 'Oferta valida ate [DATA]. Ajuste o desconto e a data antes de enviar.' }),
            makeBlock('list', { title: 'Com o Plus+ voce tem', items: ['Questoes ilimitadas', 'Flashcards e materiais exclusivos', 'Estatisticas avancadas', 'Suporte prioritario'] }),
            makeBlock('button', { buttonText: 'Quero assinar o Plus+', url: `${appUrl}/buy` }),
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
        subject: 'Seu acesso Plus+ esta perto de expirar',
        previewText: 'Renove para nao interromper sua rotina de estudos.',
        blocks: [
            makeBlock('hero', { title: 'Nao deixe seu ritmo quebrar', text: 'Continue com acesso aos recursos Plus+.' }),
            makeBlock('list', { title: 'Voce mantem', items: ['Conteúdos Plus+', 'Questoes e revisoes', 'Ferramentas de evolucao'] }),
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
    const [filterMaterialMode, setFilterMaterialMode] = useState<'all' | 'bought' | 'not_bought'>('all')
    const [filterMaterialIds, setFilterMaterialIds] = useState<Set<string>>(new Set())
    const [materialFilterSearch, setMaterialFilterSearch] = useState('')
    const [showMaterialFilter, setShowMaterialFilter] = useState(false)
    const [materialOwnership, setMaterialOwnership] = useState<{
        byUserId: Record<string, string[]>
        byEmail: Record<string, string[]>
    }>({ byUserId: {}, byEmail: {} })
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

    // Aba visível abaixo de xl. No desktop as três colunas aparecem juntas e
    // este estado é ignorado.
    const [mobileTab, setMobileTab] = useState<MobileTab>('content')

    const [showPreview, setShowPreview] = useState(false)
    const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile')
    const [drafts, setDrafts] = useState<EmailDraft[]>([])
    const [currentDraftId, setCurrentDraftId] = useState<string | null>(null)
    const [showDrafts, setShowDrafts] = useState(false)
    const [savingDraft, setSavingDraft] = useState(false)
    const [sendResult, setSendResult] = useState<SendResult | null>(null)
    const [showRecipientReport, setShowRecipientReport] = useState(false)
    const [continuingSend, setContinuingSend] = useState(false)

    // Agendamentos
    const [schedules, setSchedules] = useState<EmailSchedule[]>([])
    const [showSchedules, setShowSchedules] = useState(false)
    const [savingSchedule, setSavingSchedule] = useState(false)
    const [scheduleName, setScheduleName] = useState('')
    const [scheduleFrequency, setScheduleFrequency] = useState<ScheduleFrequency>('once')
    const [scheduleTime, setScheduleTime] = useState('09:00')
    const [scheduleDate, setScheduleDate] = useState('')
    const [scheduleWeekdays, setScheduleWeekdays] = useState<number[]>([1])
    const [scheduleDayOfMonth, setScheduleDayOfMonth] = useState(1)
    // 'fixed' congela quem está selecionado agora; 'dynamic' reavalia os filtros
    // a cada execução (alcança quem entrou na base depois).
    const [scheduleAudience, setScheduleAudience] = useState<'fixed' | 'dynamic'>('fixed')

    const [toast, setToast] = useState<{ open: boolean; message: string; type?: 'success' | 'error' | 'info' }>({ open: false, message: '' })

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ open: true, message, type })
    }

    const reloadSchedules = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/emails/schedules', { cache: 'no-store' })
            if (res.ok) {
                const data = await res.json()
                setSchedules(data.schedules || [])
            }
        } catch (error) {
            console.error('Reload schedules error:', error)
        }
    }, [])

    useEffect(() => {
        loadData()
        reloadSchedules()
    }, [reloadSchedules])

    async function loadData() {
        try {
            const [usersRes, templatesRes, materialsRes, flashcardsRes, draftsRes, ownershipRes] = await Promise.all([
                fetch('/api/users', { cache: 'no-store' }),
                fetch('/api/admin/emails/templates', { cache: 'no-store' }),
                fetch('/api/materiais', { cache: 'no-store' }),
                fetch('/api/flashcards/manual?scope=all-admin', { cache: 'no-store' }),
                fetch('/api/admin/emails/drafts', { cache: 'no-store' }),
                fetch('/api/admin/material-purchases', { cache: 'no-store' }),
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

            if (ownershipRes.ok) {
                const ownershipData = await ownershipRes.json()
                setMaterialOwnership({
                    byUserId: ownershipData.ownership?.byUserId || {},
                    byEmail: ownershipData.ownership?.byEmail || {},
                })
            }
        } catch (error) {
            console.error('Load email composer data error:', error)
            showToast('Erro ao carregar dados da central de e-mails', 'error')
        } finally {
            setLoading(false)
        }
    }

    const ownedMaterialsForUser = useCallback((user: User): Set<string> => {
        const owned = new Set<string>()
        const byId = materialOwnership.byUserId[user._id]
        if (byId) byId.forEach(id => owned.add(id))
        if (user.email) {
            const byEmail = materialOwnership.byEmail[user.email.toLowerCase().trim()]
            if (byEmail) byEmail.forEach(id => owned.add(id))
        }
        return owned
    }, [materialOwnership])

    const filteredUsers = useMemo(() => {
        const query = searchQuery.toLowerCase().trim()
        const materialFilterActive = filterMaterialMode !== 'all' && filterMaterialIds.size > 0
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

            let matchesMaterial = true
            if (materialFilterActive) {
                const owned = ownedMaterialsForUser(user)
                const boughtAny = Array.from(filterMaterialIds).some(id => owned.has(id))
                matchesMaterial = filterMaterialMode === 'bought' ? boughtAny : !boughtAny
            }

            return matchesSearch && matchesAccountType && matchesPeriodo && matchesMaterial
        })
    }, [filterAccountType, filterPeriodo, searchQuery, users, filterMaterialMode, filterMaterialIds, ownedMaterialsForUser])

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

    const updateBlockStat = (blockId: string, index: number, updates: Partial<EmailStat>) => {
        setBlocks(prev => prev.map(block => {
            if (block.id !== blockId) return block
            const stats = [...(block.stats || [])]
            stats[index] = { ...stats[index], ...updates }
            return { ...block, stats }
        }))
    }

    const addBlockStat = (blockId: string) => {
        setBlocks(prev => prev.map(block => (
            block.id === blockId
                ? { ...block, stats: [...(block.stats || []), { value: '', label: '' }] }
                : block
        )))
    }

    const removeBlockStat = (blockId: string, index: number) => {
        setBlocks(prev => prev.map(block => {
            if (block.id !== blockId) return block
            return { ...block, stats: (block.stats || []).filter((_, statIndex) => statIndex !== index) }
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
        // No celular, escolher um modelo é o passo anterior a editá-lo: sem
        // trocar de aba o admin ficaria olhando a lista de modelos sem sinal de
        // que algo aconteceu fora da tela.
        setMobileTab('content')
        showToast(`Template "${template.name}" carregado`, 'success')
    }

    // O preview usa exatamente o mesmo template do envio real. Antes esta
    // função carregava uma cópia do CSS do e-mail, que já tinha divergido do
    // original — o admin aprovava um layout e o destinatário recebia outro.
    const getPreviewHtml = useCallback(
        () => getMarketingEmailTemplate(finalContent, previewText),
        [finalContent, previewText],
    )

    /** Especificação de destinatários enviada ao servidor (envio e agendamento). */
    const buildRecipientSpec = useCallback((audience: 'fixed' | 'dynamic' = 'fixed') => {
        if (audience === 'dynamic') {
            // Parte da base inteira (`selectAll`) e aplica os filtros por cima — o
            // servidor os reavalia a cada execução, que é o que faz um agendamento
            // recorrente alcançar quem se cadastrou depois. Sem o `selectAll`, com
            // os dois filtros em "todos" não sobraria ninguém para filtrar.
            return {
                selectAll: true,
                additionalEmails,
                filter: {
                    accountType: filterAccountType,
                    periodo: filterPeriodo,
                },
            }
        }
        return {
            userIds: selectAll ? undefined : Array.from(selectedUserIds),
            additionalEmails,
            selectAll,
        }
    }, [additionalEmails, filterAccountType, filterPeriodo, selectAll, selectedUserIds])

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
                    recipients: buildRecipientSpec('fixed'),
                    subject,
                    content: finalContent,
                    previewText,
                }),
            })

            // Lê como texto primeiro: em erros de gateway (504) a resposta vem em
            // HTML/texto puro, e res.json() direto quebrava com "Unexpected token".
            const raw = await res.text()
            let data: SendResult & { error?: string } = {} as SendResult
            try {
                data = raw ? JSON.parse(raw) : ({} as SendResult)
            } catch {
                if (res.status === 504) {
                    throw new Error(
                        'O servidor demorou demais para responder. Os e-mails ficaram na fila e continuam saindo em segundo plano — confira o andamento em "Agendamentos e envios".'
                    )
                }
                throw new Error(
                    res.ok ? 'Resposta inesperada do servidor.' : `Falha no envio (HTTP ${res.status}).`
                )
            }

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao enviar e-mails')
            }

            setSendResult(data)
            showToast(data.message, data.stats?.dead ? 'info' : 'success')
        } catch (error) {
            const err = error as Error
            showToast(err.message, 'error')
        } finally {
            setSending(false)
        }
    }

    // Acompanha a campanha até a fila esvaziar. Sem isso, campanhas grandes (que
    // não cabem no orçamento de tempo de uma requisição) ficariam paradas em "na
    // fila" na tela, mesmo continuando a sair no servidor.
    useEffect(() => {
        const campaignId = sendResult?.campaignId
        if (!campaignId || sendResult?.done) return

        let cancelled = false
        const timer = setInterval(async () => {
            try {
                const res = await fetch(`/api/admin/emails/campaigns/${campaignId}`, { cache: 'no-store' })
                if (!res.ok) return
                const progress = await res.json()
                if (cancelled) return
                setSendResult(prev => (prev?.campaignId === campaignId
                    ? {
                        ...prev,
                        stats: progress.stats,
                        done: progress.done,
                        recipients: progress.recipients,
                        message: progress.done
                            ? `${progress.stats.sent} de ${progress.stats.total} enviado(s).`
                            : `${progress.stats.sent} de ${progress.stats.total} enviado(s) — ${progress.stats.pending} na fila...`,
                    }
                    : prev))
            } catch {
                // Falha de rede num tick não é motivo para parar o acompanhamento.
            }
        }, 5000)

        return () => {
            cancelled = true
            clearInterval(timer)
        }
    }, [sendResult?.campaignId, sendResult?.done])

    /** Drena mais uma leva da fila sem esperar o cron. */
    const continueSending = async () => {
        const campaignId = sendResult?.campaignId
        if (!campaignId) return

        setContinuingSend(true)
        try {
            const res = await fetch(`/api/admin/emails/campaigns/${campaignId}`, { method: 'POST' })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Erro ao continuar o envio')
            setSendResult(prev => (prev?.campaignId === campaignId
                ? {
                    ...prev,
                    stats: data.stats,
                    done: data.done,
                    recipients: data.recipients,
                    message: `${data.stats.sent} de ${data.stats.total} enviado(s).`,
                }
                : prev))
        } catch (error) {
            showToast((error as Error).message, 'error')
        } finally {
            setContinuingSend(false)
        }
    }

    // ── Agendamentos ────────────────────────────────────────────────────────

    const openScheduleDialog = () => {
        if (!subject.trim() || !plainContent.trim()) {
            showToast('Monte o e-mail (assunto e conteúdo) antes de agendar', 'error')
            return
        }
        if (recipientCount === 0 && scheduleAudience === 'fixed') {
            showToast('Selecione pelo menos um destinatário', 'error')
            return
        }
        setScheduleName(prev => prev || subject.trim())
        setShowSchedules(true)
        reloadSchedules()
    }

    const createSchedule = async () => {
        setSavingSchedule(true)
        try {
            const res = await fetch('/api/admin/emails/schedules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: scheduleName.trim() || subject.trim(),
                    subject,
                    previewText,
                    content: finalContent,
                    blocks,
                    recipients: buildRecipientSpec(scheduleAudience),
                    frequency: scheduleFrequency,
                    time: scheduleTime,
                    date: scheduleDate,
                    weekdays: scheduleWeekdays,
                    dayOfMonth: scheduleDayOfMonth,
                    isActive: true,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Erro ao criar agendamento')

            await reloadSchedules()
            showToast(
                `Agendado! Próximo envio em ${formatDateTime(data.schedule?.nextRunAt)}`,
                'success',
            )
        } catch (error) {
            showToast((error as Error).message, 'error')
        } finally {
            setSavingSchedule(false)
        }
    }

    const toggleSchedule = async (schedule: EmailSchedule) => {
        try {
            const res = await fetch(`/api/admin/emails/schedules/${schedule._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !schedule.isActive }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Erro ao atualizar agendamento')
            await reloadSchedules()
            showToast(schedule.isActive ? 'Agendamento pausado' : 'Agendamento reativado', 'success')
        } catch (error) {
            showToast((error as Error).message, 'error')
        }
    }

    const removeSchedule = async (schedule: EmailSchedule) => {
        if (!confirm(`Excluir o agendamento "${schedule.name}"?`)) return
        try {
            const res = await fetch(`/api/admin/emails/schedules/${schedule._id}`, { method: 'DELETE' })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data.error || 'Erro ao excluir agendamento')
            await reloadSchedules()
            showToast('Agendamento excluído', 'success')
        } catch (error) {
            showToast((error as Error).message, 'error')
        }
    }

    const runScheduleNow = async (schedule: EmailSchedule) => {
        if (!confirm(`Disparar "${schedule.name}" agora? Os e-mails serão enviados de verdade.`)) return
        try {
            const res = await fetch(`/api/admin/emails/schedules/${schedule._id}`, { method: 'POST' })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Erro ao executar agendamento')
            await reloadSchedules()
            if (data.campaignId) {
                setSendResult({
                    campaignId: data.campaignId,
                    message: `Disparo manual de "${schedule.name}" em andamento...`,
                    stats: { total: data.recipients, sent: 0, pending: data.recipients, failed: 0, dead: 0, skipped: 0 },
                    done: false,
                })
                setShowSchedules(false)
            }
            showToast(`Disparado para ${data.recipients} destinatário(s)`, 'success')
        } catch (error) {
            showToast((error as Error).message, 'error')
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
            ? cloneBlocks(draft.blocks)
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
            <div className="container mx-auto max-w-[1500px] px-3 pb-28 pt-5 sm:px-4 sm:py-7 xl:pb-7">
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-2 sm:gap-3">
                        <Button variant="ghost" size="icon" onClick={() => router.push('/admin')} className="mt-0.5 shrink-0">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl font-bold text-slate-950 sm:text-2xl dark:text-white">Criar e-mail</h1>
                                <Badge variant="outline" className="gap-1">
                                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                    {templates.length} templates
                                </Badge>
                            </div>
                            {/* No celular as abas logo abaixo já dizem o caminho;
                                a frase só empurraria o conteúdo para baixo. */}
                            <p className="mt-1 hidden text-sm text-muted-foreground sm:block">
                                Escolha um template, edite os blocos e envie com preview.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 lg:min-w-[460px]">
                        <div className="rounded-lg border bg-white p-2.5 text-center shadow-sm sm:p-3 dark:bg-slate-950">
                            <p className="text-[11px] text-muted-foreground sm:text-xs">Destinatários</p>
                            <p className="text-lg font-bold sm:text-xl">{recipientCount}</p>
                        </div>
                        <div className="rounded-lg border bg-white p-2.5 text-center shadow-sm sm:p-3 dark:bg-slate-950">
                            <p className="text-[11px] text-muted-foreground sm:text-xs">Template</p>
                            <p className="truncate text-xs font-semibold sm:text-sm">{selectedTemplate?.name || 'Livre'}</p>
                        </div>
                        <div className="rounded-lg border bg-white p-2.5 text-center shadow-sm sm:p-3 dark:bg-slate-950">
                            <p className="text-[11px] text-muted-foreground sm:text-xs">Anexo</p>
                            <p className="truncate text-xs font-semibold sm:text-sm">{currentAttachment?.badge || 'Nenhum'}</p>
                        </div>
                    </div>
                </div>

                {/* Abas de navegação — só abaixo de xl. As três colunas do desktop
                    empilhavam no celular, e a lista de templates (alta, com scroll
                    próprio) ficava na frente de tudo: era preciso rolar muito para
                    chegar ao conteúdo e mais ainda para chegar ao envio. */}
                <div className="sticky top-0 z-30 -mx-3 mb-4 border-b bg-background/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-4 sm:px-4 xl:hidden">
                    <div className="grid grid-cols-3 gap-1.5">
                        {MOBILE_TABS.map(tab => {
                            const Icon = tab.icon
                            const active = mobileTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setMobileTab(tab.id)}
                                    className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border px-2 text-sm font-medium transition ${active
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'bg-background text-muted-foreground hover:bg-muted/60'
                                        }`}
                                >
                                    <Icon className="h-4 w-4 shrink-0" />
                                    <span className="truncate">{tab.label}</span>
                                    {tab.id === 'send' && recipientCount > 0 && (
                                        <span className={`rounded-full px-1.5 text-[10px] font-bold ${active ? 'bg-white/25' : 'bg-primary/15 text-primary'}`}>
                                            {recipientCount}
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)_390px]">
                    <div className={`min-w-0 space-y-5 ${mobileTab === 'templates' ? '' : 'hidden'} xl:block`}>
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

                                <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1 xl:max-h-[530px]">
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

                    <div className={`min-w-0 space-y-5 ${mobileTab === 'content' ? '' : 'hidden'} xl:block`}>
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

                                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                                    <p className="font-semibold">Variáveis de personalização</p>
                                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                                        {[
                                            { token: '%nome%', description: 'primeiro nome' },
                                            { token: '%nome completo%', description: 'nome completo' },
                                        ].map(item => (
                                            <span key={item.token} className="flex items-center gap-1.5">
                                                <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono dark:bg-amber-900/60">{item.token}</code>
                                                <span className="text-amber-600 dark:text-amber-400">{item.description}</span>
                                            </span>
                                        ))}
                                    </div>
                                    <p className="mt-1.5 text-amber-500 dark:text-amber-500">
                                        Funciona no assunto, no preview e no conteúdo.
                                    </p>
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
                                {/* Flex em vez de grid: a coluna do meio muda muito
                                    de largura entre celular, tablet e desktop com a
                                    sidebar aberta, e um número fixo de colunas
                                    espremia os rótulos até se sobreporem. */}
                                <div className="flex flex-wrap gap-2">
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
                                                        <Input value={block.eyebrow || ''} onChange={(event) => updateBlock(block.id, { eyebrow: event.target.value })} placeholder="Etiqueta acima do título (opcional) — ex: NOVIDADE" />
                                                        <Input value={block.title || ''} onChange={(event) => updateBlock(block.id, { title: event.target.value })} placeholder="Título principal" />
                                                        <Textarea value={block.text || ''} onChange={(event) => updateBlock(block.id, { text: event.target.value })} placeholder="Subtítulo curto" className="min-h-[86px]" />
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
                                                    <div className="space-y-3">
                                                        <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
                                                            <Input value={block.buttonText || ''} onChange={(event) => updateBlock(block.id, { buttonText: event.target.value })} placeholder="Texto do botão" />
                                                            <Input value={block.url || ''} onChange={(event) => updateBlock(block.id, { url: event.target.value })} placeholder="https://..." />
                                                        </div>
                                                        <Input value={block.hint || ''} onChange={(event) => updateBlock(block.id, { hint: event.target.value })} placeholder="Frase abaixo do botão (opcional) — ex: Leva 2 minutos" />
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
                                                        <Textarea value={block.text || ''} onChange={(event) => updateBlock(block.id, { text: event.target.value })} placeholder="Citação ou prova social" className="min-h-[100px]" />
                                                        <Input value={block.author || ''} onChange={(event) => updateBlock(block.id, { author: event.target.value })} placeholder="Autor da citação (ex: Maria, aluna aprovada)" />
                                                    </div>
                                                )}

                                                {block.type === 'stats' && (
                                                    <div className="space-y-2">
                                                        <p className="text-xs text-muted-foreground">
                                                            Números curtos criam prova social. No celular eles empilham, um por linha.
                                                        </p>
                                                        {(block.stats || []).map((stat, statIndex) => (
                                                            <div key={`${block.id}-stat-${statIndex}`} className="flex gap-2">
                                                                <Input
                                                                    value={stat.value}
                                                                    onChange={(event) => updateBlockStat(block.id, statIndex, { value: event.target.value })}
                                                                    placeholder="+12 mil"
                                                                    className="w-28 shrink-0 font-semibold"
                                                                />
                                                                <Input
                                                                    value={stat.label}
                                                                    onChange={(event) => updateBlockStat(block.id, statIndex, { label: event.target.value })}
                                                                    placeholder="estudantes na plataforma"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="shrink-0 text-destructive"
                                                                    onClick={() => removeBlockStat(block.id, statIndex)}
                                                                    disabled={(block.stats || []).length <= 1}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => addBlockStat(block.id)}
                                                            disabled={(block.stats || []).length >= 4}
                                                        >
                                                            <Plus className="mr-2 h-4 w-4" />
                                                            Adicionar número
                                                        </Button>
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

                    <div className={`min-w-0 space-y-5 ${mobileTab === 'send' ? '' : 'hidden'} xl:block`}>
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
                                                    <SelectItem value="premium">Plus+</SelectItem>
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

                                        <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm font-medium">Filtrar por materiais comprados</span>
                                            </div>
                                            <div className="grid gap-2 sm:grid-cols-[200px_minmax(0,1fr)]">
                                                <Select
                                                    value={filterMaterialMode}
                                                    onValueChange={(value) => {
                                                        const mode = value as 'all' | 'bought' | 'not_bought'
                                                        setFilterMaterialMode(mode)
                                                        setShowMaterialFilter(mode !== 'all')
                                                    }}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Materiais" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">Sem filtro de material</SelectItem>
                                                        <SelectItem value="bought">Compraram (algum selecionado)</SelectItem>
                                                        <SelectItem value="not_bought">NÃO compraram (nenhum selecionado)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {filterMaterialMode !== 'all' && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="justify-between"
                                                        onClick={() => setShowMaterialFilter(prev => !prev)}
                                                    >
                                                        <span className="truncate">
                                                            {filterMaterialIds.size === 0
                                                                ? 'Selecionar materiais...'
                                                                : `${filterMaterialIds.size} material(is) selecionado(s)`}
                                                        </span>
                                                        {showMaterialFilter ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                                                    </Button>
                                                )}
                                            </div>

                                            {filterMaterialMode !== 'all' && showMaterialFilter && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative flex-1">
                                                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                            <Input
                                                                value={materialFilterSearch}
                                                                onChange={(event) => setMaterialFilterSearch(event.target.value)}
                                                                placeholder="Buscar material..."
                                                                className="pl-9 h-9"
                                                            />
                                                        </div>
                                                        {filterMaterialIds.size > 0 && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setFilterMaterialIds(new Set())}
                                                            >
                                                                Limpar
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <div className="max-h-52 overflow-y-auto rounded-lg border bg-background">
                                                        {(() => {
                                                            const q = materialFilterSearch.toLowerCase().trim()
                                                            const list = materials.filter(m => !q || m.title.toLowerCase().includes(q))
                                                            if (list.length === 0) {
                                                                return <div className="p-4 text-center text-xs text-muted-foreground">Nenhum material encontrado</div>
                                                            }
                                                            return list.map(material => (
                                                                <button
                                                                    key={material._id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setFilterMaterialIds(prev => {
                                                                            const next = new Set(prev)
                                                                            if (next.has(material._id)) next.delete(material._id)
                                                                            else next.add(material._id)
                                                                            return next
                                                                        })
                                                                    }}
                                                                    className={`flex w-full items-center gap-3 border-b p-2.5 text-left last:border-b-0 hover:bg-muted/50 ${filterMaterialIds.has(material._id) ? 'bg-primary/10' : ''}`}
                                                                >
                                                                    <Checkbox
                                                                        checked={filterMaterialIds.has(material._id)}
                                                                        onCheckedChange={() => {
                                                                            setFilterMaterialIds(prev => {
                                                                                const next = new Set(prev)
                                                                                if (next.has(material._id)) next.delete(material._id)
                                                                                else next.add(material._id)
                                                                                return next
                                                                            })
                                                                        }}
                                                                        onClick={(event) => event.stopPropagation()}
                                                                    />
                                                                    <span className="truncate text-sm">{material.title}</span>
                                                                </button>
                                                            ))
                                                        })()}
                                                    </div>
                                                </div>
                                            )}

                                            {filterMaterialMode !== 'all' && filterMaterialIds.size > 0 && (
                                                <p className="text-xs text-muted-foreground">
                                                    {filterMaterialMode === 'bought'
                                                        ? 'Mostrando usuários que compraram pelo menos um dos materiais selecionados (inclui pacotes que contêm esses materiais).'
                                                        : 'Mostrando usuários que NÃO compraram nenhum dos materiais selecionados.'}
                                                    {' '}Use o botão <strong>Filtrados</strong> para selecioná-los.
                                                </p>
                                            )}
                                        </div>

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
                                    <div
                                        className={`rounded-lg border p-4 ${sendResult.stats.dead > 0
                                            ? 'border-yellow-300 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20'
                                            : 'border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {!sendResult.done ? (
                                                <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-sky-600" />
                                            ) : sendResult.stats.dead > 0 ? (
                                                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
                                            ) : (
                                                <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium">{sendResult.message}</p>

                                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                                                    <div
                                                        className="h-full rounded-full bg-emerald-600 transition-all"
                                                        style={{
                                                            width: `${sendResult.stats.total > 0
                                                                ? Math.round((sendResult.stats.sent / sendResult.stats.total) * 100)
                                                                : 0}%`,
                                                        }}
                                                    />
                                                </div>

                                                <p className="mt-2 text-sm text-muted-foreground">
                                                    {`Enviados: ${sendResult.stats.sent}`}
                                                    {sendResult.stats.pending > 0 ? ` · Na fila: ${sendResult.stats.pending}` : ''}
                                                    {sendResult.stats.dead > 0 ? ` · Falharam: ${sendResult.stats.dead}` : ''}
                                                    {sendResult.stats.skipped > 0 ? ` · Ignorados: ${sendResult.stats.skipped}` : ''}
                                                </p>

                                                {!sendResult.done && (
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        O restante continua saindo em segundo plano, no ritmo seguro do servidor de e-mail.
                                                    </p>
                                                )}

                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {sendResult.recipients && sendResult.recipients.length > 0 && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setShowRecipientReport(true)}
                                                        >
                                                            <Users className="mr-2 h-4 w-4" />
                                                            Ver quem recebeu ({sendResult.recipients.length})
                                                        </Button>
                                                    )}
                                                    {!sendResult.done && sendResult.campaignId && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={continueSending}
                                                            disabled={continuingSend}
                                                        >
                                                            {continuingSend ? (
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Send className="mr-2 h-4 w-4" />
                                                            )}
                                                            Continuar envio agora
                                                        </Button>
                                                    )}
                                                </div>

                                                {sendResult.errors && sendResult.errors.length > 0 && (
                                                    <details className="mt-3">
                                                        <summary className="cursor-pointer text-sm text-destructive">
                                                            Ver erros ({sendResult.errors.length})
                                                        </summary>
                                                        <ul className="mt-1 space-y-1 text-xs">
                                                            {sendResult.errors.map((err, index) => (
                                                                <li key={index} className="break-all text-destructive">{err}</li>
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
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={openScheduleDialog}
                                        className="h-11"
                                    >
                                        <CalendarClock className="mr-2 h-4 w-4" />
                                        Agendar envio
                                        {schedules.length > 0 && (
                                            <Badge variant="outline" className="ml-2">
                                                {schedules.filter(s => s.isActive).length} ativo(s)
                                            </Badge>
                                        )}
                                    </Button>
                                </div>

                                {recipientCount > 50 && (
                                    <p className="text-center text-xs text-muted-foreground">
                                        Envios em massa saem em lotes, no ritmo seguro do servidor de e-mail. A tela continua
                                        acompanhando quem já recebeu, mesmo que leve alguns minutos.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Barra de ação fixa (mobile). O botão de enviar fica no fim de uma
                página muito longa; sem isso, no celular era preciso rolar tudo de
                novo a cada ajuste só para disparar ou ver o preview. */}
            <div className="pwa-safe-bottom fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-3 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/85 xl:hidden">
                {/* O dock flutuante global (components/mobile-floating-dock) fica
                    fixo no canto inferior direito até lg; a folga à direita evita
                    que ele cubra o botão de enviar. */}
                <div className="flex items-center gap-2 pr-[68px] lg:pr-0">
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 shrink-0"
                        onClick={() => setShowPreview(true)}
                        title="Visualizar e-mail"
                    >
                        <Eye className="h-5 w-5" />
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 shrink-0"
                        onClick={openScheduleDialog}
                        title="Agendar envio"
                    >
                        <CalendarClock className="h-5 w-5" />
                    </Button>
                    <Button
                        type="button"
                        onClick={sendEmail}
                        disabled={sending || recipientCount === 0 || !subject.trim() || !plainContent.trim()}
                        className="h-11 flex-1"
                    >
                        {sending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Enviar
                                {recipientCount > 0 && ` (${recipientCount})`}
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
                    <DialogHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
                        <DialogTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            Preview do e-mail
                        </DialogTitle>
                        <DialogDescription className="truncate">{subject || 'Sem assunto definido'}</DialogDescription>
                    </DialogHeader>

                    <div className="px-4 pb-4 sm:px-6 sm:pb-6">
                        {/* Alternar largura simula como o e-mail chega no celular —
                            é onde a maioria abre, e onde os problemas de layout
                            aparecem primeiro. */}
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <div className="inline-flex rounded-lg border p-0.5">
                                {([
                                    { id: 'mobile' as const, label: 'Celular', icon: Smartphone },
                                    { id: 'desktop' as const, label: 'Computador', icon: Monitor },
                                ]).map(option => {
                                    const Icon = option.icon
                                    return (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => setPreviewDevice(option.id)}
                                            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${previewDevice === option.id
                                                ? 'bg-primary text-primary-foreground'
                                                : 'text-muted-foreground hover:bg-muted'
                                                }`}
                                        >
                                            <Icon className="h-3.5 w-3.5" />
                                            {option.label}
                                        </button>
                                    )
                                })}
                            </div>
                            <div className="hidden items-center gap-3 text-xs text-muted-foreground sm:flex">
                                <span>{recipientCount} destinatário(s)</span>
                                <span>·</span>
                                <span>{blocks.length} blocos</span>
                                <span>·</span>
                                <span>Checklist {readinessScore}/{readinessChecks.length}</span>
                            </div>
                        </div>

                        <div className="flex justify-center overflow-hidden rounded-lg border bg-muted/40 p-2 sm:p-3">
                            <iframe
                                srcDoc={getPreviewHtml()}
                                title="Email Preview"
                                className={`h-[65vh] rounded-md bg-white transition-all sm:h-[70vh] ${previewDevice === 'mobile' ? 'w-full max-w-[390px]' : 'w-full'}`}
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showDrafts} onOpenChange={setShowDrafts}>
                <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                    <DialogHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
                        <DialogTitle className="flex items-center gap-2">
                            <FolderOpen className="h-5 w-5" />
                            Rascunhos salvos
                        </DialogTitle>
                        <DialogDescription>
                            Continue de onde parou ou exclua rascunhos antigos.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="px-4 pb-4 sm:px-6 sm:pb-6">
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
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showRecipientReport} onOpenChange={setShowRecipientReport}>
                <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
                    <DialogHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Destinatários da campanha
                        </DialogTitle>
                        <DialogDescription>
                            Status de cada pessoa, direto da fila de envio. Atualiza sozinho enquanto houver pendências.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="px-4 pb-4 sm:px-6 sm:pb-6">

                        {sendResult && (
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {[
                                    { label: 'Total', value: sendResult.stats.total },
                                    { label: 'Enviados', value: sendResult.stats.sent },
                                    { label: 'Na fila', value: sendResult.stats.pending },
                                    { label: 'Falharam', value: sendResult.stats.dead },
                                ].map(item => (
                                    <div key={item.label} className="rounded-lg border p-3 text-center">
                                        <p className="text-xs text-muted-foreground">{item.label}</p>
                                        <p className="text-xl font-bold">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="max-h-[45vh] divide-y overflow-y-auto rounded-lg border">
                            {(sendResult?.recipients || []).map(recipient => {
                                const status = RECIPIENT_STATUS[recipient.status] || {
                                    label: recipient.status,
                                    className: 'bg-slate-500/15 text-slate-600',
                                }
                                return (
                                    <div key={recipient.email} className="flex items-start justify-between gap-3 p-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {recipient.name || recipient.email}
                                            </p>
                                            {recipient.name && (
                                                <p className="truncate text-xs text-muted-foreground">{recipient.email}</p>
                                            )}
                                            {recipient.error && (
                                                <p className="mt-1 break-all text-xs text-destructive">{recipient.error}</p>
                                            )}
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${status.className}`}>
                                                {status.label}
                                            </span>
                                            {recipient.sentAt && (
                                                <p className="mt-1 text-[10px] text-muted-foreground">
                                                    {formatDateTime(recipient.sentAt)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                            {(sendResult?.recipients || []).length === 0 && (
                                <div className="p-8 text-center text-sm text-muted-foreground">
                                    Nenhum destinatário para mostrar.
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showSchedules} onOpenChange={setShowSchedules}>
                <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                    <DialogHeader className="p-4 pb-3 sm:p-6 sm:pb-4">
                        <DialogTitle className="flex items-center gap-2">
                            <CalendarClock className="h-5 w-5" />
                            Agendar envio automático
                        </DialogTitle>
                        <DialogDescription>
                            O e-mail montado agora é salvo junto com a recorrência. Horários em Brasília.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="px-4 pb-4 sm:px-6 sm:pb-6">

                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium">Nome do agendamento</label>
                                <Input
                                    value={scheduleName}
                                    onChange={(event) => setScheduleName(event.target.value)}
                                    placeholder="Ex: Resumo semanal de novidades"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">Frequência</label>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                    {(Object.keys(FREQUENCY_LABELS) as ScheduleFrequency[]).map(frequency => (
                                        <Button
                                            key={frequency}
                                            type="button"
                                            size="sm"
                                            variant={scheduleFrequency === frequency ? 'default' : 'outline'}
                                            onClick={() => setScheduleFrequency(frequency)}
                                        >
                                            {FREQUENCY_LABELS[frequency]}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium">Horário</label>
                                    <Input
                                        type="time"
                                        value={scheduleTime}
                                        onChange={(event) => setScheduleTime(event.target.value)}
                                    />
                                </div>

                                {scheduleFrequency === 'once' && (
                                    <div>
                                        <label className="mb-2 block text-sm font-medium">Data</label>
                                        <Input
                                            type="date"
                                            value={scheduleDate}
                                            onChange={(event) => setScheduleDate(event.target.value)}
                                        />
                                    </div>
                                )}

                                {scheduleFrequency === 'monthly' && (
                                    <div>
                                        <label className="mb-2 block text-sm font-medium">Dia do mês</label>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={31}
                                            value={scheduleDayOfMonth}
                                            onChange={(event) => setScheduleDayOfMonth(Number(event.target.value) || 1)}
                                        />
                                    </div>
                                )}
                            </div>

                            {scheduleFrequency === 'weekly' && (
                                <div>
                                    <label className="mb-2 block text-sm font-medium">Dias da semana</label>
                                    <div className="flex flex-wrap gap-2">
                                        {WEEKDAY_LABELS.map((label, index) => (
                                            <Button
                                                key={label}
                                                type="button"
                                                size="sm"
                                                variant={scheduleWeekdays.includes(index) ? 'default' : 'outline'}
                                                onClick={() => setScheduleWeekdays(prev => (
                                                    prev.includes(index)
                                                        ? prev.filter(day => day !== index)
                                                        : [...prev, index].sort()
                                                ))}
                                            >
                                                {label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="mb-2 block text-sm font-medium">Quem recebe</label>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={() => setScheduleAudience('fixed')}
                                        className={`rounded-lg border p-3 text-left text-sm transition ${scheduleAudience === 'fixed' ? 'border-primary bg-primary/10' : 'hover:bg-muted/50'}`}
                                    >
                                        <p className="font-medium">Lista fixa ({recipientCount})</p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Exatamente quem está selecionado agora, em todos os envios.
                                        </p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setScheduleAudience('dynamic')}
                                        className={`rounded-lg border p-3 text-left text-sm transition ${scheduleAudience === 'dynamic' ? 'border-primary bg-primary/10' : 'hover:bg-muted/50'}`}
                                    >
                                        <p className="font-medium">Filtros dinâmicos</p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {describeAudienceFilter(filterAccountType, filterPeriodo)} — reavaliado a cada
                                            envio, então alcança quem se cadastrar depois.
                                        </p>
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="button"
                                className="w-full"
                                onClick={createSchedule}
                                disabled={savingSchedule}
                            >
                                {savingSchedule ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <CalendarClock className="mr-2 h-4 w-4" />
                                )}
                                Criar agendamento
                            </Button>
                        </div>

                        <div className="mt-2 space-y-3">
                            <h3 className="text-sm font-semibold">Agendamentos existentes</h3>
                            {schedules.length === 0 ? (
                                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                                    Nenhum agendamento criado ainda.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {schedules.map(schedule => (
                                        <div
                                            key={schedule._id}
                                            className={`rounded-lg border p-3 ${schedule.isActive ? '' : 'opacity-60'}`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="truncate text-sm font-semibold">{schedule.name}</p>
                                                        <Badge variant={schedule.isActive ? 'default' : 'outline'} className="text-[10px]">
                                                            {schedule.isActive ? 'Ativo' : 'Pausado'}
                                                        </Badge>
                                                    </div>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {describeSchedule(schedule)}
                                                    </p>
                                                    <p className="mt-1 text-xs">
                                                        <span className="text-muted-foreground">Próximo envio: </span>
                                                        <span className="font-medium">
                                                            {schedule.isActive ? formatDateTime(schedule.nextRunAt) : 'pausado'}
                                                        </span>
                                                    </p>
                                                    {schedule.lastRunAt && (
                                                        <p className="mt-1 text-[11px] text-muted-foreground">
                                                            Última execução: {formatDateTime(schedule.lastRunAt)}
                                                            {schedule.lastStatus === 'ok' && ` · ${schedule.lastRecipientCount ?? 0} destinatário(s)`}
                                                            {schedule.lastStatus === 'empty' && ' · nenhum destinatário'}
                                                            {schedule.lastStatus === 'error' && ` · erro: ${schedule.lastError || 'desconhecido'}`}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex shrink-0 gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        title="Executar agora"
                                                        onClick={() => runScheduleNow(schedule)}
                                                    >
                                                        <Send className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        title={schedule.isActive ? 'Pausar' : 'Reativar'}
                                                        onClick={() => toggleSchedule(schedule)}
                                                    >
                                                        {schedule.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive"
                                                        title="Excluir"
                                                        onClick={() => removeSchedule(schedule)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                            <div className="flex items-start gap-3">
                                <Terminal className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                                        Falta ligar o gatilho (uma vez só)
                                    </p>
                                    <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                                        Os agendamentos só disparam se algo chamar o app periodicamente. Crie um cronjob
                                        gratuito em <strong>cron-job.org</strong> apontando para a URL abaixo, a cada 1 minuto.
                                        Troque <code>SEU_SEGREDO</code> pelo valor de <code>CRON_SECRET</code>.
                                    </p>

                                    <div className="mt-3 space-y-2">
                                        <div>
                                            <p className="mb-1 text-[11px] font-medium text-amber-900 dark:text-amber-200">
                                                URL (cole em cron-job.org)
                                            </p>
                                            <div className="flex gap-2">
                                                <code className="min-w-0 flex-1 overflow-x-auto rounded bg-amber-100 px-2 py-1.5 font-mono text-[11px] dark:bg-amber-900/60">
                                                    {cronUrl}
                                                </code>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8 shrink-0"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(cronUrl)
                                                        showToast('URL copiada', 'success')
                                                    }}
                                                >
                                                    <Copy className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="mb-1 text-[11px] font-medium text-amber-900 dark:text-amber-200">
                                                Ou via curl (para testar / usar no crontab)
                                            </p>
                                            <div className="flex gap-2">
                                                <code className="min-w-0 flex-1 overflow-x-auto whitespace-pre rounded bg-amber-100 px-2 py-1.5 font-mono text-[11px] dark:bg-amber-900/60">
                                                    {cronCurl}
                                                </code>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8 shrink-0"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(cronCurl)
                                                        showToast('Comando copiado', 'success')
                                                    }}
                                                >
                                                    <Copy className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="mt-3 text-[11px] text-amber-700 dark:text-amber-400">
                                        Passo a passo completo em <code>docs/EMAIL_AGENDAMENTO_CRONJOB.md</code>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
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
