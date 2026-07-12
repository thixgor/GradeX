// ────────────────────────────────────────────────────────────────────────────
// Normalização de telefone para E.164 (foco Brasil).
//
// Aceita entradas como "(11) 99999-8888", "11999998888", "+55 11 99999-8888"
// e devolve "+5511999998888". Retorna null se claramente inválido.
// ────────────────────────────────────────────────────────────────────────────

export function normalizeBRPhone(input: string | undefined | null): string | null {
    if (!input) return null
    let digits = input.replace(/\D/g, '')
    if (!digits) return null

    // Remove zeros de operadora / DDD-longa-distância no início.
    digits = digits.replace(/^0+/, '')

    // Já veio com código do país (55) + DDD (2) + número (8 ou 9).
    if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
        return `+${digits}`
    }

    // DDD (2) + número (8 ou 9) sem código do país → assume Brasil (+55).
    if (digits.length === 10 || digits.length === 11) {
        return `+55${digits}`
    }

    // Formato internacional genérico (com DDI diferente): aceita se plausível.
    if (digits.length >= 11 && digits.length <= 15) {
        return `+${digits}`
    }

    return null
}
