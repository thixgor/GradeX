/**
 * Termo de busca digitado por gente vira texto literal, nunca padrão.
 *
 * ## Por que este arquivo existe
 *
 * Várias rotas montam filtro do Mongo com `{ $regex: termo }` a partir do que o
 * visitante digitou. Sem tratamento, o termo É a expressão regular — e isso
 * abre dois buracos que não precisam de conta de admin nem de ferramenta
 * nenhuma, só do console do navegador:
 *
 * 1. **Derrubar o banco.** `(a+)+$` é o exemplo clássico de retrocesso
 *    catastrófico: o casamento explode em tempo exponencial por documento
 *    visitado. Uma requisição só ocupa uma conexão do Atlas até estourar, e
 *    algumas dezenas em paralelo tiram o site inteiro do ar — inclusive as
 *    telas que nada têm a ver com busca.
 * 2. **Ler o que não foi pedido.** `.*` casa com tudo; `^` e `$` deslocam a
 *    âncora de uma comparação que o código achava que era de igualdade.
 *
 * ## O que a função faz
 *
 * Escapa os metacaracteres de `RegExp`, deixando o termo com o mesmo
 * significado visual que ele tinha na caixa de texto: quem procura por `C++`
 * acha `C++`, e quem manda `(a+)+$` procura pelo texto `(a+)+$`, que não existe
 * em lugar nenhum e responde rápido.
 *
 * Havia treze cópias idênticas disto espalhadas pelo projeto e seis rotas que
 * simplesmente não chamavam nenhuma delas. Uma única definição evita que a
 * próxima rota de busca nasça com o mesmo buraco.
 */
export function escapeRegex(value: string): string {
  return String(value ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Alias em português — parte do código já usava este nome. */
export const escaparRegex = escapeRegex

/**
 * Teto de caracteres de um termo de busca.
 *
 * Escapar resolve o retrocesso catastrófico, mas não o custo linear: um termo
 * de 10 mil caracteres ainda obriga o Mongo a comparar 10 mil posições em cada
 * documento da coleção. Nenhuma busca real passa de algumas dezenas.
 */
export const TAMANHO_MAXIMO_DE_BUSCA = 80

/**
 * Piso de caracteres de um termo de busca.
 *
 * Uma única letra casa com quase todo documento da coleção e transforma a busca
 * numa varredura completa sem índice — que é a mesma conta de um ataque, feita
 * por engano. Duas letras já recortam o suficiente.
 */
export const TAMANHO_MINIMO_DE_BUSCA = 2

/**
 * Tempo que uma busca pode ocupar no servidor antes de o Mongo desistir dela.
 *
 * É o teto que `app/api/busca/route.ts` já adotava; aplicá-lo às demais buscas
 * garante que uma consulta cara falhe sozinha em vez de segurar a conexão.
 */
export const TEMPO_MAXIMO_DE_BUSCA_MS = 2500

/**
 * Normaliza um termo cru em algo seguro de mandar para o `$regex` — ou `null`
 * quando ele não deve virar filtro nenhum.
 *
 * Devolver `null` em vez de lançar é de propósito: um termo curto demais não é
 * erro do usuário, é uma busca que ainda não começou. Quem chama simplesmente
 * não aplica o filtro, e a tela mostra a lista inteira em vez de um erro.
 */
export function prepararTermoDeBusca(
  bruto: unknown,
  opcoes: { minimo?: number; maximo?: number } = {},
): string | null {
  const { minimo = TAMANHO_MINIMO_DE_BUSCA, maximo = TAMANHO_MAXIMO_DE_BUSCA } = opcoes

  if (typeof bruto !== 'string') return null
  const termo = bruto.trim()
  if (termo.length < minimo) return null

  return escapeRegex(termo.slice(0, maximo))
}
