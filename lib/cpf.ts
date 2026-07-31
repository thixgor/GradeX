// Utilidades de CPF puras (sem I/O), usadas no cliente e no servidor.
// A conferência do CPF contra a base da Receita Federal fica em
// `lib/receita-cpf.ts` — este arquivo só faz o que dá para fazer offline.

/** Só os dígitos, no máximo 11. */
export function onlyCpfDigits(value: string): string {
  return (value || '').replace(/\D/g, '').slice(0, 11)
}

/** Formata enquanto o usuário digita: 000.000.000-00. */
export function formatCpf(value: string): string {
  const digits = onlyCpfDigits(value)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

/**
 * Valida os dois dígitos verificadores do CPF. Rejeita também as sequências
 * repetidas (000.000.000-00, 111.111.111-11, ...), que passam no cálculo mas
 * não são CPFs reais.
 *
 * Isto é validação estrutural: diz que o número é *bem formado*, não que ele
 * existe ou pertence a quem digitou. Para isso, ver `verifyCpfWithReceita`.
 */
export function isValidCpf(value: string): boolean {
  const cpf = onlyCpfDigits(value)
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false

  const checkDigit = (length: number): number => {
    let sum = 0
    for (let i = 0; i < length; i++) {
      sum += Number(cpf[i]) * (length + 1 - i)
    }
    const remainder = (sum * 10) % 11
    return remainder === 10 ? 0 : remainder
  }

  return checkDigit(9) === Number(cpf[9]) && checkDigit(10) === Number(cpf[10])
}

/** Exibe apenas os 3 dígitos do meio: ***.456.789-**. Para telas e logs. */
export function maskCpf(value?: string | null): string {
  const cpf = onlyCpfDigits(value || '')
  if (cpf.length !== 11) return ''
  return `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**`
}
