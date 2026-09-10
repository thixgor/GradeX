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
 *
 * Depois do texto ainda podem vir BLOCOS INDIVISÍVEIS — as imagens da resposta
 * comentada. Eles são parte da caixa, não algo que vem depois dela: desenhados
 * fora, ficavam pendurados abaixo do retângulo colorido, órfãos do comentário
 * que os explica. Aqui eles entram na conta da altura, e por isso o retângulo
 * cresce para envolvê-los.
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
  /** Índices, em `blocosFinais`, dos blocos que entram nesta caixa. */
  blocos: number[]
  /**
   * Altura reservada a esses blocos dentro da caixa.
   *
   * É a soma das alturas deles, salvo no caso do bloco sozinho mais alto do
   * que a página inteira: aí é o que sobrou, e cabe a quem desenha encolher a
   * imagem para esse espaço.
   */
  alturaDosBlocos: number
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
  /**
   * Blocos indivisíveis que vêm DEPOIS de todo o texto e DENTRO da caixa —
   * cada número é a altura de uma linha de imagens, em mm.
   */
  blocosFinais?: number[]
}

/**
 * Devolve os lotes na ordem em que devem ser desenhados.
 *
 * Garantias, e é o que o teste cobra:
 *
 * - nenhuma linha se perde e nenhuma se repete — os lotes, somados e em ordem,
 *   são exatamente a lista original, e o mesmo vale para `blocosFinais`;
 * - nenhum bloco final é fatiado: uma imagem que não cabe no que resta da
 *   página inteira vai para a caixa da página seguinte;
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

  const blocosFinais = medidas.blocosFinais ?? []
  const temTexto = totalDeLinhas > 0 && alturaDaLinha > 0
  if (!temTexto && blocosFinais.length === 0) return []

  const lotes: LoteDeLinhas[] = []
  let restantes = temTexto ? totalDeLinhas : 0
  let linhasFeitas = 0
  let proximoBloco = 0
  let y = yInicial
  let primeiro = true

  while (restantes > 0 || proximoBloco < blocosFinais.length) {
    const topo = primeiro ? alturaDoTitulo : respiroDeContinuacao

    // Quanto uma caixa recém-aberta numa página vazia comporta de conteúdo.
    // É o teto do bloco indivisível: uma imagem mais alta do que isso não cabe
    // em página nenhuma, e pedir a página seguinte por causa dela só geraria
    // uma folha em branco atrás da outra.
    const espacoDePaginaCheia = Math.max(1, limiteInferior - yAposQuebra - topo - respiroInferior)

    // Só vale ficar nesta página se couber o topo da caixa, ao menos uma
    // linha (ou o próximo bloco inteiro) e o respiro de baixo — uma caixa com
    // o título e nada mais não ajuda ninguém.
    const minimo =
      restantes > 0 ? alturaDaLinha : Math.min(blocosFinais[proximoBloco], espacoDePaginaCheia)
    const novaPagina = y + topo + minimo + respiroInferior > limiteInferior
    if (novaPagina) y = yAposQuebra

    // O `max` é a saída da página baixa demais: sem ele o espaço seria
    // negativo e nenhum lote consumiria nada.
    const espaco = Math.max(minimo, limiteInferior - y - topo - respiroInferior)

    let linhas = 0
    if (restantes > 0) {
      linhas = Math.min(Math.max(1, Math.floor(espaco / alturaDaLinha)), restantes)
      restantes -= linhas
    }

    // As imagens comentam o que o texto diz: elas só entram depois da última
    // linha dele, e sempre dentro da caixa.
    const blocos: number[] = []
    let alturaDosBlocos = 0
    if (restantes === 0) {
      let livre = espaco - linhas * alturaDaLinha
      while (proximoBloco < blocosFinais.length) {
        const altura = blocosFinais[proximoBloco]
        if (altura > livre) {
          // Um bloco sozinho, mais alto do que a página: entra encolhido no
          // que sobrou, senão a fila nunca esvazia.
          if (linhas === 0 && blocos.length === 0 && livre > 0) {
            blocos.push(proximoBloco++)
            alturaDosBlocos = livre
          }
          break
        }
        blocos.push(proximoBloco++)
        alturaDosBlocos += altura
        livre -= altura
      }
    }

    const altura = topo + linhas * alturaDaLinha + alturaDosBlocos + respiroInferior

    lotes.push({
      inicio: linhasFeitas,
      linhas,
      novaPagina,
      primeiro,
      y,
      altura,
      blocos,
      alturaDosBlocos,
    })

    y += altura
    linhasFeitas += linhas
    primeiro = false
  }

  return lotes
}
