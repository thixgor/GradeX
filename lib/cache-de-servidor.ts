/**
 * Memória curta do servidor.
 *
 * Cada função serverless da Vercel fica viva entre requisições — é a mesma
 * instância que atende o segundo aluno que abre a tela logo depois do primeiro.
 * Consulta que devolve exatamente o mesmo resultado para todo mundo (a árvore
 * do Banco, o eixo de anos, o catálogo de aulas que alimenta a contagem da
 * navegação) não precisa ir ao Atlas de novo dentro dessa janela.
 *
 * O QUE PODE ENTRAR AQUI
 *
 * Só dado IMPESSOAL. A chave não carrega usuário, então guardar aqui qualquer
 * coisa que dependa de quem está logado — saldo do plano gratuito, progresso,
 * listas, permissões — entregaria o dado de uma pessoa para a seguinte. Para
 * esses, a resposta continua sendo buscada fresca a cada requisição.
 *
 * O TTL É CURTO DE PROPÓSITO
 *
 * Segundos, não minutos: o admin que cadastra um tópico novo quer vê-lo na
 * árvore, e esperar meio minuto é aceitável — esperar dez minutos não é. A
 * janela existe para absorver a rajada de requisições de uma mesma abertura de
 * tela, não para virar um cache de verdade.
 */

interface Entrada<T> {
  valor: Promise<T>
  expiraEm: number
}

const memoria = new Map<string, Entrada<unknown>>()

/**
 * Executa `calcular` no máximo uma vez a cada `ttlMs` por chave.
 *
 * Guarda a PROMESSA, e não o valor resolvido: duas requisições que chegam
 * juntas na mesma instância fria compartilham a mesma ida ao banco em vez de
 * dispararem duas. Se ela falhar, a entrada é descartada — senão o erro ficaria
 * em cache e a tela continuaria quebrada depois que o banco voltasse.
 */
export function memoizarPorTempo<T>(
  chave: string,
  ttlMs: number,
  calcular: () => Promise<T>,
): Promise<T> {
  const agora = Date.now()
  const emCache = memoria.get(chave) as Entrada<T> | undefined
  if (emCache && emCache.expiraEm > agora) return emCache.valor

  const valor = calcular().catch((erro) => {
    memoria.delete(chave)
    throw erro
  })

  memoria.set(chave, { valor, expiraEm: agora + ttlMs } as Entrada<unknown>)

  // Varredura oportunista: sem ela, uma chave dinâmica encheria o mapa até o
  // fim da vida da instância. São dezenas de entradas, então percorrer tudo
  // aqui é mais barato que manter um timer.
  if (memoria.size > 64) {
    for (const [k, e] of memoria) if (e.expiraEm <= agora) memoria.delete(k)
  }

  return valor
}

/** Descarta uma chave — chamado por quem grava o dado que ela guarda. */
export function invalidarCacheDeServidor(chave: string): void {
  memoria.delete(chave)
}

/** Descarta tudo que começa com o prefixo. Útil para famílias de chaves. */
export function invalidarPrefixo(prefixo: string): void {
  for (const k of Array.from(memoria.keys())) {
    if (k.startsWith(prefixo)) memoria.delete(k)
  }
}
