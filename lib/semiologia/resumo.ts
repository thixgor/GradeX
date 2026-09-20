import { COMPARADORES } from './comparadores'
import { TOTAIS, sistemasComSinais } from './catalogo'
import { SINAIS } from './sinais'
import { JANELAS_ULTRASSOM } from './ultrassom'
import { VISTAS } from './vistas'

/**
 * O recorte do acervo que a landing pode mostrar.
 *
 * Só título e contagem — nunca o corpo de uma ficha. É o que prova o tamanho
 * do módulo sem entregar o que está sendo vendido, e por isso pode ser servido
 * a qualquer visitante, inclusive sem conta.
 *
 * Mora aqui, e não na rota da API, porque dois consumidores precisam do mesmo
 * recorte: o handler `/api/manual-clinico/semiologia`, que responde ao portão
 * dentro do app, e a página `/manual-clinico/semiologia/vitrine`, que precisa
 * dele no **servidor** para a landing nascer pronta em vez de piscar um molde
 * e só depois desenhar os números. Duas cópias seriam duas chances de a página
 * anunciar um número que a API desmente.
 *
 * Calculado uma vez, na carga do módulo: é tudo constante em código.
 */
export const RESUMO_DA_SEMIOLOGIA = {
  ...TOTAIS,
  titulosSinais: SINAIS.map((sinal) => sinal.nome),
  titulosVistas: VISTAS.map((vista) => vista.nome),
  titulosJanelas: JANELAS_ULTRASSOM.map((janela) => janela.nome),
  titulosComparadores: COMPARADORES.map((comparador) => comparador.titulo),
  /** A pergunta binária de cada comparador — o argumento em uma linha. */
  perguntasDosComparadores: COMPARADORES.map((comparador) => comparador.pergunta),
  /** Os sistemas cobertos, com quantos sinais cada um tem. */
  sistemas: sistemasComSinais().map(({ titulo, total }) => ({ titulo, total })),
  /**
   * Quantos sinais trazem razão de verossimilhança publicada, e quantos têm
   * comparador. São os dois números que dizem a profundidade da ficha sem
   * mostrar o conteúdo dela — "343 sinais" mede tamanho, estes medem o que há
   * dentro de cada um.
   */
  sinaisComDesempenho: SINAIS.filter((sinal) => sinal.desempenho?.length).length,
  sinaisComComparador: SINAIS.filter((sinal) => sinal.comparador).length,
}

export type ResumoDaSemiologia = typeof RESUMO_DA_SEMIOLOGIA
