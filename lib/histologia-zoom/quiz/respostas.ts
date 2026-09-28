/**
 * Correção de respostas escritas.
 *
 * O aluno escreve como fala: com ou sem acento, "o corno anterior da medula",
 * "celula de purkinje", "purkinje". Aceitamos o nome e os sinônimos do verbete
 * com tolerância a erro de digitação proporcional ao tamanho da palavra, e a
 * resposta que *contém* o termo inteiro ("é o corno anterior").
 */

const ARTIGOS = new Set(['o', 'a', 'os', 'as', 'um', 'uma', 'de', 'da', 'do', 'das', 'dos', 'e', 'é', 'eh', 'no', 'na'])

export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter((p) => p && !ARTIGOS.has(p))
    .join(' ')
}

export function distancia(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let anterior = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const atual = [i]
    for (let j = 1; j <= b.length; j++) {
      atual[j] = Math.min(anterior[j] + 1, atual[j - 1] + 1, anterior[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    anterior = atual
  }
  return anterior[b.length]
}

/** Erros de digitação tolerados para um termo de `n` letras. */
function tolerancia(n: number): number {
  if (n <= 4) return 0
  if (n <= 8) return 1
  if (n <= 14) return 2
  return 3
}

/** A resposta confere com algum dos termos aceitos? */
export function confere(resposta: string, aceitos: string[]): boolean {
  const r = normalizar(resposta)
  if (!r) return false
  for (const bruto of aceitos) {
    const t = normalizar(bruto)
    if (!t) continue
    if (r === t) return true
    if (distancia(r, t) <= tolerancia(t.length)) return true
    // "é o corno anterior da medula" contém "corno anterior"
    if (t.length >= 6 && ` ${r} `.includes(` ${t} `)) return true
    // termo de várias palavras escrito com um erro pequeno dentro de uma frase
    const palavras = r.split(' ')
    const n = t.split(' ').length
    if (t.length >= 8 && palavras.length > n) {
      for (let i = 0; i + n <= palavras.length; i++) {
        if (distancia(palavras.slice(i, i + n).join(' '), t) <= tolerancia(t.length)) return true
      }
    }
  }
  return false
}

/** Formas aceitas de um nome: o nome inteiro e o nome sem o parêntese. */
export function formasDoNome(nome: string): string[] {
  const sem = nome.replace(/\s*\([^)]*\)\s*/g, ' ').trim()
  const dentro = [...nome.matchAll(/\(([^)]*)\)/g)].map((m) => m[1]).filter((t) => t.length >= 4)
  return [...new Set([nome, sem, ...dentro])]
}
