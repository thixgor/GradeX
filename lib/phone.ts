// Formata um telefone brasileiro conforme o usuário digita: (XX) XXXXX-XXXX
// (celular, 9 dígitos) ou (XX) XXXX-XXXX (fixo, 8 dígitos).
export function formatBrazilPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length === 0) return ''

  const ddd = digits.slice(0, 2)
  if (digits.length <= 2) return `(${ddd}`

  const rest = digits.slice(2)
  if (rest.length <= 4) return `(${ddd}) ${rest}`
  if (digits.length <= 10) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`
}

export function isValidBrazilPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length === 10 || digits.length === 11
}
