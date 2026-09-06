/**
 * Fatiar uma caixa de texto em páginas.
 *
 * O jsPDF não tem noção de fluxo: `doc.text()` desenha onde mandarem, e o que
 * cai depois do fim da folha some sem aviso. Quem monta um bloco alto —
 * uma resposta comentada, por exemplo — precisa decidir sozinho onde ele
 * quebra.
 *
 * O erro fácil, e o que este arquivo existe para não deixar acontecer de novo,
 * é medir a caixa inteira, ver que ela não cabe no resto da página e pular
 * para a próxima: isso resolve "não cabe AQUI", mas não resolve "não cabe em
 * página NENHUMA". Um texto mais alto que a folha era desenhado inteiro mesmo
 * assim, e chegava ao leitor cortado no meio da frase.
 *
 * Aqui as linhas são servidas em lotes: cada lote é o que cabe no espaço que
 * resta, e o resto continua na página seguinte, quantas forem necessárias.
 */

export interface LoteDeLinhas {
  /** Índice, na lista completa, da primeira linha deste lote. */
  inicio: number
  /** Quantas linhas o lote leva. */
  linhas: number
  /** Se este lote começa numa página nova. */
  novaPagina: boolean
  /** Se é o primeiro lote — o único que leva o título da caixa. */
  primeiro: boolean
  /** Onde a caixa deste lote começa a ser desenhada. */
  y: number
  /** Altura da caixa deste lote, do topo ao respiro de baixo. */
  altura: number
}

export interface MedidasDaCaixa {
  /** Quantas linhas o texto tem, depois de quebrado. */
  totalDeLinhas: number
  /** Distância entre as linhas de base. */
  alturaDaLinha: number
  /** Espaço reservado no topo do primeiro lote, onde entra o título. */
  alturaDoTitulo: number
  /** Espaço no topo dos lotes seguintes, que não repetem o título. */
  respiroDeContinuacao: number
  /** Espaço entre a última linha e a borda de baixo da caixa. */
  respiroInferior: number
  /** Onde a caixa começaria, na página em que se está. */
  yInicial: number
  /** Última coordenada utilizável da página (acima do rodapé). */
  limiteInferior: number
  /** Onde o conteúdo recomeça numa página nova, logo abaixo do cabeçalho. */
  yAposQuebra: number
}

/**
 * Devolve os lotes na ordem em que devem ser desenhados.
 *
 * Garantias, e é o que o teste cobra:
 *
 * - nenhuma linha se perde e nenhuma se repete — os lotes, somados e em ordem,
 *   são exatamente a lista original;
 * - nenhuma caixa passa do `limiteInferior`, contanto que uma página vazia
 *   comporte o topo, uma linha e o respiro de baixo. Numa página que não
 *   comporte nem isso, cada lote ainda leva uma linha — sem essa saída o laço
 *   nunca esvaziaria a fila.
 */
export function fatiarCaixaEmPaginas(medidas: MedidasDaCaixa): LoteDeLinhas[] {
  const {
    totalDeLinhas,
    alturaDaLinha,
    alturaDoTitulo,
    respiroDeContinuacao,
    respiroInferior,
    yInicial,
    limiteInferior,
    yAposQuebra,
  } = medidas

  if (totalDeLinhas <= 0 || alturaDaLinha <= 0) return []

  const lotes: LoteDeLinhas[] = []
  let restantes = totalDeLinhas
  let y = yInicial
  let primeiro = true

  while (restantes > 0) {
    const topo = primeiro ? alturaDoTitulo : respiroDeContinuacao

    // Só vale ficar nesta página se couber o topo da caixa, ao menos uma
    // linha e o respiro de baixo — uma caixa com o título e nada mais não
    // ajuda ninguém.
    const novaPagina = y + topo + alturaDaLinha + respiroInferior > limiteInferior
    if (novaPagina) y = yAposQuebra

    const cabem = Math.max(
      1,
      Math.floor((limiteInferior - y - topo - respiroInferior) / alturaDaLinha),
    )
    const linhas = Math.min(cabem, restantes)
    const altura = topo + linhas * alturaDaLinha + respiroInferior

    lotes.push({ inicio: totalDeLinhas - restantes, linhas, novaPagina, primeiro, y, altura })

    y += altura
    restantes -= linhas
    primeiro = false
  }

  return lotes
}
