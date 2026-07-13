// ────────────────────────────────────────────────────────────────────────────
// Camada de persuasão (Parte 5).
//
// Resolve variáveis dinâmicas usadas nos templates para aplicar princípios de
// persuasão comprovados ao público de estudantes de medicina:
//  - Prova social  → {{totalStudents}}, {{campaignLeads}}
//  - Autoridade    → {{authority}} (conteúdo validado/credencial)
//  - Escassez      → {{spotsLeft}}, {{offerEndsAt}} (LEGÍTIMAS — vindas de dados reais)
//  - Personalização→ {{firstName}}, {{persuasiveTag}}, {{campaignName}}
//
// Importante: escassez/urgência devem vir de dados reais (nº de vagas, prazo de
// oferta). Nunca gere valores falsos aqui.
// ────────────────────────────────────────────────────────────────────────────

import { getDb } from '@/lib/mongodb'

export type PersuasionVars = Record<string, string>

export interface PersuasionContext {
    name?: string
    /** Cidade do destinatário (geolocalizada na captura), se disponível. */
    city?: string
    persuasiveTag?: string
    campaignId?: string
    campaignName?: string
    /** Vagas restantes reais (se a oferta tiver limite). */
    spotsLeft?: number
    /** Fim real da oferta (se houver). */
    offerEndsAt?: Date
    /** Frase de autoridade (ex.: "validado por professores de Clínica Médica"). */
    authority?: string
    /** Variáveis extras já resolvidas. */
    extra?: PersuasionVars
}

/** Conta usuários cadastrados (prova social). Cacheado por processo por 5min. */
let studentCountCache: { value: number; at: number } | null = null
export async function totalStudents(): Promise<number> {
    if (studentCountCache && Date.now() - studentCountCache.at < 5 * 60_000) {
        return studentCountCache.value
    }
    const db = await getDb()
    const value = await db.collection('users').estimatedDocumentCount()
    studentCountCache = { value, at: Date.now() }
    return value
}

function formatDateBR(d: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
    }).format(d)
}

/** Monta o mapa de variáveis de persuasão a partir do contexto + dados reais. */
export async function buildPersuasionVars(ctx: PersuasionContext): Promise<PersuasionVars> {
    const firstName = (ctx.name || '').trim().split(/\s+/)[0] || 'estudante'
    const vars: PersuasionVars = {
        firstName,
        nome: firstName,
        name: ctx.name || firstName,
        city: ctx.city || '',
        cidade: ctx.city || '',
        persuasiveTag: ctx.persuasiveTag || '',
        campaignName: ctx.campaignName || '',
        authority: ctx.authority || '',
    }

    // Prova social: total de estudantes já na plataforma (aproximado, arredondado).
    const total = await totalStudents()
    const rounded = total >= 100 ? `${Math.floor(total / 100) * 100}+` : String(total)
    vars.totalStudents = rounded

    // Prova social específica da campanha (leads capturados).
    if (ctx.campaignId) {
        const db = await getDb()
        const leads = await db.collection('leads').countDocuments({ campaignId: ctx.campaignId })
        vars.campaignLeads = String(leads)
    }

    // Escassez/urgência LEGÍTIMAS (só se vierem valores reais).
    if (typeof ctx.spotsLeft === 'number') vars.spotsLeft = String(ctx.spotsLeft)
    if (ctx.offerEndsAt) vars.offerEndsAt = formatDateBR(ctx.offerEndsAt)

    return { ...vars, ...(ctx.extra || {}) }
}

/**
 * Substitui tokens {{chave}} (com espaços opcionais) num template.
 * Tokens sem valor viram string vazia para não vazar "{{x}}" ao usuário.
 */
export function renderPersuasion(template: string, vars: PersuasionVars): string {
    return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key: string) => {
        const v = vars[key]
        return v === undefined || v === null ? '' : String(v)
    })
}
