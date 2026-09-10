/**
 * A caixa colorida da resposta comentada.
 *
 * ## O que havia antes
 *
 * O texto do comentário era fatiado em páginas e desenhado dentro do
 * retângulo; as IMAGENS do comentário — o fluxograma, o esquema, a lâmina que
 * ele descreve — vinham depois, num `desenharImagensNoPdf` solto, já com a
 * caixa fechada. No papel, a figura aparecia pendurada ABAIXO do retângulo
 * colorido, fora dele, órfã do comentário que a explica.
 *
 * A ordem de desenho é o que obriga a fazer diferente: o `roundedRect` é
 * pintado ANTES do conteúdo (o preenchimento cobriria a imagem se viesse
 * depois), então a altura da caixa precisa ser conhecida antes de qualquer
 * pixel — e isso inclui a altura das imagens. Por isso elas chegam aqui já
 * medidas (`medirLinhasDeImagens`) e entram no fatiamento como blocos
 * indivisíveis, para o retângulo crescer e envolvê-las.
 */

import type jsPDF from 'jspdf'
import { ESPACO_ENTRE_LINHAS_DE_IMAGENS, type LinhaDeImagens } from './imagens-de-questao'
import { fatiarCaixaEmPaginas } from './paginacao'

type Cor = readonly [number, number, number]

/** O respiro entre a última linha do comentário e a primeira imagem. */
export const ESPACO_ACIMA_DAS_IMAGENS = 3

export interface CoresDaCaixa {
  fundo: Cor
  borda: Cor
  titulo: Cor
  texto: Cor
}

export interface MedidasDoConteudo {
  /** Distância entre as linhas de base do comentário. */
  alturaDaLinha: number
  /** Espaço reservado no topo do primeiro lote, onde entra o título. */
  alturaDoTitulo: number
  /** Espaço no topo dos lotes seguintes, que não repetem o título. */
  respiroDeContinuacao: number
  /** Espaço entre o último conteúdo e a borda de baixo da caixa. */
  respiroInferior: number
  /** Recuo do conteúdo em relação à borda esquerda da caixa. */
  recuo: number
  /** Corpo do título. */
  corpoDoTitulo: number
  /** Distância do topo da caixa à linha de base do título. */
  baseDoTitulo: number
  /** Corpo do texto do comentário. */
  corpoDoTexto: number
}

export interface CaixaDeRespostaComentada {
  doc: jsPDF
  /** A família de fonte ativa no documento. */
  fonte: string
  /** Borda esquerda da caixa. */
  x: number
  /** Largura da caixa. */
  largura: number
  /** Onde a caixa começaria, na página em que se está. */
  y: number
  /** Última coordenada utilizável da página (acima do rodapé). */
  limiteInferior: number
  /** Onde o conteúdo recomeça numa página nova, logo abaixo do cabeçalho. */
  yAposQuebra: number
  /** Abre a página seguinte, com cabeçalho. */
  novaPagina: () => void
  /** As linhas do comentário, já quebradas na largura do conteúdo. */
  linhas: string[]
  /** As linhas de imagens, já medidas na largura do conteúdo. */
  imagens: LinhaDeImagens[]
  /** O rótulo do primeiro lote. */
  titulo: string
  cores: CoresDaCaixa
  medidas: MedidasDoConteudo
  /**
   * Escreve uma linha do comentário.
   *
   * Não é `doc.text` direto porque o comentário por alternativa vem com
   * `**A)**` em negrito, e cada gerador tem o seu desenhador de linha rica.
   */
  desenharLinha: (texto: string, x: number, y: number) => void
}

/**
 * Desenha a caixa (uma por página, quantas forem precisas) e devolve o `y`
 * logo abaixo da última.
 *
 * Devolve o `y` de entrada intocado quando não há comentário nem imagem.
 */
export function desenharCaixaDeRespostaComentada(caixa: CaixaDeRespostaComentada): number {
  const { doc, medidas, cores } = caixa

  // O respiro acima da primeira imagem viaja junto com ela: se ficasse de
  // fora, a caixa poderia fechar exatamente na borda da figura.
  const alturaDoBloco = (indice: number) =>
    caixa.imagens[indice].altura +
    (indice === 0 ? ESPACO_ACIMA_DAS_IMAGENS : ESPACO_ENTRE_LINHAS_DE_IMAGENS)

  const lotes = fatiarCaixaEmPaginas({
    totalDeLinhas: caixa.linhas.length,
    alturaDaLinha: medidas.alturaDaLinha,
    alturaDoTitulo: medidas.alturaDoTitulo,
    respiroDeContinuacao: medidas.respiroDeContinuacao,
    respiroInferior: medidas.respiroInferior,
    yInicial: caixa.y,
    limiteInferior: caixa.limiteInferior,
    yAposQuebra: caixa.yAposQuebra,
    blocosFinais: caixa.imagens.map((_, indice) => alturaDoBloco(indice)),
  })

  if (lotes.length === 0) return caixa.y

  let y = caixa.y

  for (const lote of lotes) {
    if (lote.novaPagina) caixa.novaPagina()

    const topo = lote.y
    doc.setFillColor(cores.fundo[0], cores.fundo[1], cores.fundo[2])
    doc.setDrawColor(cores.borda[0], cores.borda[1], cores.borda[2])
    doc.setLineWidth(0.5)
    doc.roundedRect(caixa.x, topo, caixa.largura, lote.altura, 2, 2, 'FD')

    const xDoConteudo = caixa.x + medidas.recuo
    y = topo

    if (lote.primeiro) {
      doc.setFontSize(medidas.corpoDoTitulo)
      doc.setFont(caixa.fonte, 'bold')
      doc.setTextColor(cores.titulo[0], cores.titulo[1], cores.titulo[2])
      doc.text(caixa.titulo, xDoConteudo, topo + medidas.baseDoTitulo)
      y += medidas.alturaDoTitulo
    } else {
      y += medidas.respiroDeContinuacao
    }

    doc.setFont(caixa.fonte, 'normal')
    doc.setFontSize(medidas.corpoDoTexto)
    doc.setTextColor(cores.texto[0], cores.texto[1], cores.texto[2])
    for (const texto of caixa.linhas.slice(lote.inicio, lote.inicio + lote.linhas)) {
      caixa.desenharLinha(texto, xDoConteudo, y)
      y += medidas.alturaDaLinha
    }

    // `lote.alturaDosBlocos` só é menor do que o pedido no caso da imagem mais
    // alta do que a página inteira; aí ela entra encolhida, que é melhor do
    // que sair pela borda do retângulo.
    let sobra = lote.alturaDosBlocos
    for (const indice of lote.blocos) {
      const linha = caixa.imagens[indice]
      const acima = indice === 0 ? ESPACO_ACIMA_DAS_IMAGENS : ESPACO_ENTRE_LINHAS_DE_IMAGENS
      const disponivel = sobra - acima - linha.alturaDasLegendas
      const escala =
        linha.alturaDasImagens > disponivel && disponivel > 0
          ? disponivel / linha.alturaDasImagens
          : 1

      y += acima
      linha.desenhar(xDoConteudo, y, escala)
      const alturaDesenhada = linha.alturaDasImagens * escala + linha.alturaDasLegendas
      y += alturaDesenhada
      sobra -= acima + alturaDesenhada
    }

    // O fecho vem da altura calculada, não do que o desenho somou: assim o
    // conteúdo seguinte começa exatamente na borda de baixo do retângulo.
    y = topo + lote.altura
  }

  return y
}
