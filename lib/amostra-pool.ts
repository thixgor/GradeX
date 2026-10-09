/**
 * O pool da amostra pública: poucas questões por semana, sempre as mesmas.
 *
 * ## O problema
 *
 * `/api/amostra` é aberta (sem login) e devolve questões COM gabarito e
 * comentário — é o que faz dela uma amostra. Enquanto ela sorteava com
 * `$sample` sobre o banco inteiro, cada chamada trazia 10 questões novas: um
 * script de visitante, no ritmo do limite por IP, levava o Banco de Questões
 * inteiro, comentado, sem pagar nada.
 *
 * ## A regra
 *
 * A amostra sorteia dentro de um pool de `TAMANHO_DO_POOL` questões, e o pool
 * é escolhido pela SEMANA, de forma determinística: toda instância da função
 * chega ao mesmo conjunto sem combinar nada com as outras. Quem raspa a
 * amostra a semana inteira leva, no máximo, essas questões. Para o visitante
 * nada muda: dez questões comentadas, em ordem diferente a cada visita.
 *
 * Determinístico, e não guardado no banco: não há coleção nova, índice novo,
 * nem rotina para trocar o pool — a troca acontece sozinha na virada da semana.
 */

export const TAMANHO_DO_POOL = 40

const MS_POR_SEMANA = 7 * 24 * 60 * 60 * 1000

/** Número da semana desde a época Unix (UTC). Muda uma vez por semana. */
export function semanaAtual(agora: number = Date.now()): number {
  return Math.floor(agora / MS_POR_SEMANA)
}

/** Gerador pseudoaleatório com semente (mulberry32): mesma semente, mesma sequência. */
function geradorComSemente(semente: number): () => number {
  let a = semente >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Embaralha uma cópia (Fisher–Yates) com o gerador dado. */
export function embaralhar<T>(itens: readonly T[], aleatorio: () => number = Math.random): T[] {
  const copia = itens.slice()
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

/**
 * Os ids do pool desta semana.
 *
 * Os ids são ordenados antes de embaralhar: a ordem em que o Mongo os devolve
 * não é garantida, e sem isso duas instâncias com a mesma semente poderiam
 * chegar a pools diferentes.
 */
export function escolherPoolDaSemana(
  ids: readonly string[],
  semana: number,
  tamanho: number = TAMANHO_DO_POOL,
): string[] {
  const ordenados = Array.from(new Set(ids)).sort()
  return embaralhar(ordenados, geradorComSemente(semana * 2654435761)).slice(0, tamanho)
}

/** Sorteia `quantas` do pool para esta visita (aleatório de verdade). */
export function sortearDoPool<T>(pool: readonly T[], quantas: number, aleatorio: () => number = Math.random): T[] {
  return embaralhar(pool, aleatorio).slice(0, quantas)
}
