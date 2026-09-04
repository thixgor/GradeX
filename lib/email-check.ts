/**
 * Conferência de e-mail digitado, sem I/O — a metade que dá para fazer no
 * navegador, enquanto a pessoa ainda está com o dedo no teclado.
 *
 * Existe por causa de um prejuízo concreto: na compra SEM LOGIN o e-mail é o
 * único endereço do que foi comprado. Quem digita `@gmial.com` paga, não recebe
 * nada, e o desfecho é sempre o mesmo — pedido de reembolso, suporte, e um
 * material que ninguém usou. O formato do endereço estava certo; o domínio é
 * que não existe.
 *
 * A checagem de domínio de verdade (existe servidor de e-mail?) precisa de DNS
 * e mora em `lib/email-domain-check.ts`.
 */

/**
 * Domínios que respondem pela imensa maioria dos cadastros — provedores
 * grandes e os brasileiros. Serve para dois fins opostos: sugerir a correção
 * de quem chegou perto de um deles, e NÃO sugerir nada a quem digitou um deles
 * exatamente (inclusive os parecidos entre si, como bol/uol).
 */
const KNOWN_DOMAINS = [
  'gmail.com',
  'googlemail.com',
  'hotmail.com',
  'hotmail.com.br',
  'outlook.com',
  'outlook.com.br',
  'live.com',
  'msn.com',
  'yahoo.com',
  'yahoo.com.br',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  // Provedores reais a uma letra de `gmail.com`. Sem eles na lista, quem tem um
  // desses seria mandado para o Gmail — corrigir um endereço que funcionava.
  'mail.com',
  'email.com',
  'protonmail.com',
  'proton.me',
  'bol.com.br',
  'uol.com.br',
  'terra.com.br',
  'globo.com',
  'globomail.com',
  'ig.com.br',
  'oi.com.br',
  'r7.com',
  'superig.com.br',
  'zipmail.com.br',
] as const

const KNOWN_SET = new Set<string>(KNOWN_DOMAINS)

/**
 * Distância de edição contando TRANSPOSIÇÃO como um erro só (Damerau-
 * Levenshtein, alinhamento ótimo).
 *
 * A distinção não é acadêmica: `gmial.com` é o erro de digitação mais comum que
 * existe, e para a Levenshtein comum ele está a 2 edições de `gmail.com` — longe
 * demais para um domínio curto. Trocar duas letras de lugar é um deslize, não
 * dois.
 */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  // Três linhas bastam: a anterior da anterior é o que a transposição precisa.
  let twoBack: number[] = []
  let previous: number[] = Array.from({ length: b.length + 1 }, (_, i) => i)
  let current: number[] = []

  for (let i = 1; i <= a.length; i++) {
    current = [i]
    for (let j = 1; j <= b.length; j++) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1
      let value = Math.min(
        current[j - 1] + 1,             // inserção
        previous[j] + 1,                // remoção
        previous[j - 1] + substitutionCost // substituição
      )
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, twoBack[j - 2] + 1) // transposição
      }
      current[j] = value
    }
    twoBack = previous
    previous = current
  }
  return previous[b.length]
}

/** Divide em parte local e domínio, sem validar nada além da presença do @. */
function splitEmail(email: string): { local: string; domain: string } | null {
  const trimmed = String(email || '').trim().toLowerCase()
  const at = trimmed.lastIndexOf('@')
  if (at <= 0 || at === trimmed.length - 1) return null
  return { local: trimmed.slice(0, at), domain: trimmed.slice(at + 1) }
}

/**
 * "Você quis dizer @gmail.com?" — devolve o e-mail corrigido, ou `null` quando
 * não há nada a sugerir.
 *
 * Nunca sugere sobre um domínio que já é conhecido. É o que impede a sugestão
 * mais constrangedora possível: mandar quem tem `@bol.com.br` trocar para
 * `@uol.com.br`, que está a uma letra de distância e é igualmente real.
 *
 * O limite de distância acompanha o tamanho do domínio — dois erros num
 * endereço curto já podem ser outro endereço de verdade.
 */
export function suggestEmailFix(email: string): string | null {
  const parts = splitEmail(email)
  if (!parts) return null
  const { local, domain } = parts
  if (KNOWN_SET.has(domain)) return null

  // Sufixo sobrando (`@gmail.com.br`): o domínio conhecido está inteiro ali,
  // com um pedaço a mais colado no fim. Distância de edição não pega isso, e é
  // um dos erros mais frequentes no Brasil.
  for (const known of KNOWN_DOMAINS) {
    if (domain.startsWith(`${known}.`)) return `${local}@${known}`
  }

  // `.br` faltando (`@uol.com`, `@bol.com`, `@terra.com`). Tem de vir ANTES da
  // distância de edição: `uol.com` está a uma letra de `aol.com`, e mandar um
  // brasileiro do UOL para a AOL é o pior palpite possível.
  if (KNOWN_SET.has(`${domain}.br`)) return `${local}@${domain}.br`

  let best: string | null = null
  let bestDistance = Number.POSITIVE_INFINITY
  for (const known of KNOWN_DOMAINS) {
    const distance = editDistance(domain, known)
    if (distance < bestDistance) {
      bestDistance = distance
      best = known
    }
  }
  if (!best) return null

  const limit = best.length >= 10 ? 2 : 1
  if (bestDistance > limit) return null
  return `${local}@${best}`
}

/** O domínio do e-mail, em minúsculas. `null` se não houver um. */
export function emailDomainOf(email: string): string | null {
  return splitEmail(email)?.domain || null
}
