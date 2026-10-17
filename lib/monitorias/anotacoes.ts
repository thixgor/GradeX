/**
 * Anotações da monitoria: limites e a junção de versões (puro, testável).
 */

/** Uns 25 páginas de texto: sobra para uma aula e cabe num documento pequeno. */
export const ANOTACOES_MAX = 50_000

/**
 * Duas versões divergentes (dois aparelhos): nada se perde. Se uma contém a
 * outra, fica a maior; senão, a local primeiro e a outra depois, marcada.
 */
export function juntarAnotacoes(local: string, remota: string): string {
  const a = local.trimEnd()
  const b = remota.trimEnd()
  if (!b || a === b || a.includes(b)) return local
  if (!a || b.includes(a)) return remota
  return `${a}\n\n[Do outro aparelho]\n${b}`.slice(0, ANOTACOES_MAX)
}
