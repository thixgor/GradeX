/**
 * Nome civil (o do documento): uma regra só para o perfil, a conferência do
 * CPF e os requisitos das Monitorias. Função pura, roda no cliente e no
 * servidor.
 */

/** Espaços colapsados e pontas aparadas. Não mexe em caixa nem acento. */
export function normalizarNomeCivil(valor: unknown): string {
  return String(valor ?? '').trim().replace(/\s+/g, ' ')
}

/**
 * `null` quando o nome serve; senão, a mensagem para mostrar no campo.
 * Pede nome e sobrenome, só letras (com acento), espaço, hífen, apóstrofo e
 * ponto de abreviação. Números e símbolos ficam de fora: nome com "123" ou
 * "@" não é nome de documento.
 */
export function validarNomeCivil(valor: unknown): string | null {
  const nome = normalizarNomeCivil(valor)
  if (!nome) return 'Informe seu nome completo.'
  if (nome.length > 120) return 'Nome muito longo. Use até 120 caracteres.'
  if (!/^[\p{L}][\p{L}' .-]*$/u.test(nome)) return 'Use só letras, como está no documento.'
  const partes = nome.split(' ').filter((p) => /\p{L}{2,}/u.test(p))
  if (partes.length < 2) return 'Informe nome e sobrenome, como está no documento.'
  return null
}

/** Mesmo nome ignorando caixa, acentos e espaços extras. */
export function mesmoNomeCivil(a: unknown, b: unknown): boolean {
  const chave = (s: unknown) =>
    normalizarNomeCivil(s)
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
  return chave(a) === chave(b)
}
