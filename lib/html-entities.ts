// Utilitário leve (sem dependências de servidor) para codificar/decodificar
// entidades HTML. Fica separado de `api-security.ts` para poder ser importado
// com segurança em código de cliente e em geradores de PDF sem arrastar
// dependências de Node (crypto, NextRequest, etc.).

export const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
}

export function encodeHtmlEntities(input: string): string {
  if (!input || typeof input !== 'string') return ''
  return input.replace(/[&<>"'`=/]/g, char => HTML_ENTITIES[char] || char)
}

// Mapa reverso. `&amp;` fica por último no padrão para não desfazer entidades
// já decodificadas (ex.: transformar `&amp;#x2F;` em `/` de uma só vez).
const DECODE_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#x27;': "'",
  '&#39;': "'",
  '&#x2F;': '/',
  '&#47;': '/',
  '&#x60;': '`',
  '&#x3D;': '=',
  '&nbsp;': ' ',
}

const DECODE_PATTERN = new RegExp(
  Object.keys(DECODE_MAP)
    .map(e => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|'),
  'g'
)

/**
 * Reverte a codificação de entidades HTML feita por `encodeHtmlEntities` /
 * `sanitizeHtml`. Usado ao renderizar valores em superfícies que NÃO
 * interpretam HTML (PDF via jsPDF, exportação CSV) ou onde o React já escapa
 * por conta própria (evitando o "duplo escape" que mostra &quot; / &#x2F;).
 *
 * Aplica a decodificação repetidamente para lidar com valores que foram
 * codificados mais de uma vez em versões anteriores.
 */
export function decodeHtmlEntities(input: string): string {
  if (!input || typeof input !== 'string') return input
  let out = input
  // Até 3 passadas cobre valores duplamente/triplamente codificados sem risco
  // de loop infinito.
  for (let i = 0; i < 3; i++) {
    if (!DECODE_PATTERN.test(out)) break
    DECODE_PATTERN.lastIndex = 0
    out = out.replace(DECODE_PATTERN, entity => DECODE_MAP[entity] ?? entity)
  }
  return out
}
