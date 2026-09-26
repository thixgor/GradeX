/**
 * Campos que a validação do servidor recusou (`details` do 400, no formato
 * `format()` ou `flatten()` do zod). Só "Dados inválidos" na tela não dizia
 * nada — nem ao comprador, nem a quem recebe o print no suporte.
 */
export function invalidFieldsFrom(details: unknown): string[] {
  if (!details || typeof details !== 'object') return []
  const d = details as Record<string, any>
  if (d.fieldErrors && typeof d.fieldErrors === 'object') {
    return Object.keys(d.fieldErrors).filter(k => Array.isArray(d.fieldErrors[k]) && d.fieldErrors[k].length > 0)
  }
  return Object.keys(d).filter(k => k !== '_errors' && d[k] && typeof d[k] === 'object')
}
