// ─────────────────────────────────────────────────────────────
// Normalizacao de nomes do Manual Clinico.
//
// SOMENTE PARA COMPARACAO. O valor retornado aqui nunca deve ser
// exibido ao usuario nem gravado no lugar do nome original — ele
// perde acentos e caixa de proposito, para que "Hipertensao
// Arterial  Sistemica" e "Hipertensão Arterial Sistêmica" caiam
// na mesma chave.
// ─────────────────────────────────────────────────────────────

// Mesmo intervalo de diacriticos ja usado em lib/utils/slug.ts.
const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g')
const WHITESPACE_RUN = /\s+/g

/**
 * Chave canonica de comparacao para nomes de patologias e farmacos.
 *
 * 1. trim
 * 2. minusculas
 * 3. remove acentos (decompoe em NFD e descarta os diacriticos)
 * 4. colapsa espacos repetidos em um unico espaco
 * 5. preserva letras e numeros
 *
 * Nao remove pontuacao: "CID-10" continua "cid-10". Retorna string
 * vazia para entradas nulas ou nao textuais.
 */
export function normalizeManualContentName(value: unknown): string {
  if (value == null) return ''
  return String(value)
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(WHITESPACE_RUN, ' ')
    .trim()
}
