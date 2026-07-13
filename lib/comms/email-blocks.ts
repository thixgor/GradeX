// ────────────────────────────────────────────────────────────────────────────
// Blocos visuais de e-mail — mesmo modelo usado em /admin/emails, reaproveitado
// pelo composer da Central Social-Media para dar a mesma UX de "montar por
// blocos" em vez de escrever HTML na mão. Client-safe (sem imports de servidor).
// ────────────────────────────────────────────────────────────────────────────

export type EmailBlockType = 'hero' | 'text' | 'highlight' | 'list' | 'button' | 'image' | 'quote'

export interface EmailBlock {
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

export const EMAIL_BLOCK_LABELS: Record<EmailBlockType, string> = {
    hero: 'Título principal',
    text: 'Texto',
    highlight: 'Destaque',
    list: 'Lista',
    button: 'Botão',
    image: 'Imagem',
    quote: 'Citação',
}

export function newBlockId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function makeEmailBlock(type: EmailBlockType, data: Partial<EmailBlock> = {}): EmailBlock {
    const defaults: Record<EmailBlockType, EmailBlock> = {
        hero: { id: newBlockId(), type: 'hero', title: 'Título do e-mail', text: 'Uma frase curta para explicar o principal benefício.' },
        text: { id: newBlockId(), type: 'text', text: 'Escreva um parágrafo curto, claro e orientado para ação.' },
        highlight: { id: newBlockId(), type: 'highlight', title: 'Destaque', text: 'O principal motivo para o usuário clicar.' },
        list: { id: newBlockId(), type: 'list', title: 'O que você recebe', items: ['Benefício 1', 'Benefício 2', 'Próximo passo'] },
        button: { id: newBlockId(), type: 'button', buttonText: 'Acessar agora', url: '' },
        image: { id: newBlockId(), type: 'image', imageUrl: '', alt: 'Imagem do e-mail' },
        quote: { id: newBlockId(), type: 'quote', text: 'Insira uma prova social, depoimento ou frase curta.', author: 'Nome do autor' },
    }
    return { ...defaults[type], id: newBlockId(), ...data }
}

function escapeHtml(value = ''): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

function applyInline(escaped = ''): string {
    return escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

function textToHtml(value = ''): string {
    return escapeHtml(value)
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .map((paragraph) => `<p>${applyInline(paragraph.replace(/\n/g, '<br>'))}</p>`)
        .join('')
}

function normalizeHref(value = ''): string {
    const trimmed = value.trim()
    if (!trimmed) return ''
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

/** Renderiza os blocos para o HTML esperado pelo template de e-mail (mesmas classes CSS). */
export function renderEmailBlocksHtml(blocks: EmailBlock[]): string {
    return blocks
        .map((block) => {
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
                          ${(block.items || []).filter(Boolean).map((item) => `<li>${applyInline(escapeHtml(item))}</li>`).join('')}
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
        })
        .join('')
}
