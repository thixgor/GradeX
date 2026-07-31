// CRM — registro no Conselho Regional de Medicina.
//
// Não existe um formato único nacional: cada CRM estadual emite sua própria
// numeração, com 4 a 7 dígitos (e alguns estados usam zeros à esquerda, que
// fazem parte do número). Por isso a validação aqui é só de forma — o que
// identifica o registro é sempre o par número + UF.

/** Só os dígitos, no máximo 7. */
export function onlyCrmDigits(value: string): string {
  return (value || '').replace(/\D/g, '').slice(0, 7)
}

/** Formata o CRM: mantém apenas dígitos, preservando zeros à esquerda. */
export function formatCrm(value: string): string {
  return onlyCrmDigits(value)
}

/** `true` para números com 4 a 7 dígitos (formato aceito por todos os CRMs). */
export function isValidCrmNumber(value: string): boolean {
  const digits = onlyCrmDigits(value)
  return digits.length >= 4 && digits.length <= 7 && Number(digits) > 0
}

/** Rótulo canônico exibido e gravado: "CRM/SP 123456". */
export function formatCrmLabel(crm?: string | null, uf?: string | null): string {
  const digits = onlyCrmDigits(crm || '')
  if (!digits) return ''
  return uf ? `CRM/${uf} ${digits}` : `CRM ${digits}`
}
