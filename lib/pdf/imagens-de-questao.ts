/**
 * As imagens de uma questão dentro de um PDF.
 *
 * ## O que havia antes
 *
 * Sete geradores tinham, cada um, o mesmo bloco de dez linhas: pegar
 * `question.imageUrl`, calcular `ratio = min(larguraMax/w, alturaMax/h, 1)` e
 * desenhar. Três consequências:
 *
 * 1. **Uma imagem por questão.** Não havia onde encaixar a segunda, e a
 *    resposta comentada não tinha imagem nenhuma.
 * 2. **Tamanho ingovernável.** `alturaMax` era 80mm num arquivo, 75mm noutro, e
 *    o `min(..., 1)` deixava a imagem ocupar a largura inteira da página quase
 *    sempre. Uma prova de vinte questões com figura saía com trinta páginas —
 *    é a reclamação de "as imagens estão muito grandes".
 * 3. **Quebra de página torta.** O `checkPage` era chamado com a altura da
 *    imagem, mas a legenda vinha depois e sozinha: a fonte da imagem ia parar
 *    no topo da página seguinte, órfã da figura.
 *
 * Aqui a conta é uma só. O tamanho é a porcentagem configurada na questão (ver
 * `lib/questoes/imagens.ts`), a mesma que a tela usa — 60% no editor é 60% da
 * largura do texto no papel. A linha (imagens + legendas) é medida INTEIRA
 * antes de decidir a página, então figura e crédito nunca se separam.
 */

import type jsPDF from 'jspdf'
import {
  type ImagemDeQuestao,
  type LayoutDeImagens,
  distribuirEmLinhas,
  tamanhoDaImagem,
} from '@/lib/questoes/imagens'
import { sanitizarParaPdf } from './marca'

export interface ImagemCarregada {
  dataUrl: string
  width: number
  height: number
}

/**
 * A altura, em milímetros, que uma imagem de 100% pode ocupar.
 *
 * Vale como TETO, não como alvo. Está calibrado para NÃO atrapalhar a
 * paisagem: uma imagem 16:9 na largura inteira de uma A4 com margem de 20mm
 * tem 95,6mm de altura, e o teto precisa ficar acima disso — senão "largura
 * toda" não entrega a largura toda, que é o defeito que o campo de tamanho
 * veio consertar. Quem ele existe para conter é o retrato: uma radiografia em
 * pé, sem teto, come a página e empurra as alternativas para a folha seguinte.
 */
export const ALTURA_MAXIMA_DA_IMAGEM = 105

/** Nenhuma imagem fica menor que isto por causa do teto de altura. */
const ALTURA_MINIMA_DO_TETO = 30

/**
 * O quanto o teto de altura acompanha o tamanho pedido.
 *
 * Se o teto fosse fixo, o campo de tamanho não teria efeito nenhum sobre um
 * retrato extremo (ele já está preso pela altura, não pela largura, em 20% e
 * em 100%). Se acompanhasse a porcentagem de um para um, uma paisagem a 50%
 * sairia menor do que a metade — o teto passaria a mandar onde a largura
 * deveria mandar.
 *
 * A parte fixa (55%) é o que garante a paisagem; a variável (45%) é o que faz
 * o retrato encolher junto quando se pede uma imagem menor.
 */
const PARTE_FIXA_DO_TETO = 0.55

/** O respiro entre duas imagens lado a lado. */
const ESPACO_ENTRE_IMAGENS = 4

const ALTURA_DA_LINHA_DA_FONTE = 4
const TAMANHO_DA_FONTE_DA_LEGENDA = 7

export interface OpcoesDeDesenho {
  /** Margem esquerda do bloco, em mm. */
  x: number
  /** Largura disponível para o bloco, em mm. */
  largura: number
  /** Onde o bloco começa. */
  y: number
  /** O y máximo utilizável na página (normalmente `pageHeight - rodapé`). */
  limiteY: number
  /** Cria a página seguinte (com cabeçalho) e devolve o y inicial dela. */
  novaPagina: () => number
  /** Teto de altura de uma imagem de 100%. Padrão: `ALTURA_MAXIMA_DA_IMAGEM`. */
  alturaMaxima?: number
  /** A família de fonte ativa no documento — a legenda usa a mesma. */
  fonte?: string
  /** Espaço deixado depois do último bloco de imagens. */
  espacoDepois?: number
}

interface ImagemMedida {
  imagem: ImagemDeQuestao
  carregada: ImagemCarregada
  largura: number
  altura: number
  legenda: string[]
}

/**
 * Quanto uma imagem ocupa, dado o tamanho pedido.
 *
 * O `min(..., 1)` do código antigo continua aqui, e de propósito: sem ele, um
 * ícone de 90px de largura seria esticado para os 170mm da página e sairia
 * borrado. Ele só limita para cima — imagem grande continua encolhendo até
 * caber no que foi pedido.
 */
export function medirImagem(
  carregada: Pick<ImagemCarregada, 'width' | 'height'>,
  porcentagem: number,
  larguraDisponivel: number,
  tetoDeAltura: number = ALTURA_MAXIMA_DA_IMAGEM,
): { largura: number; altura: number } {
  const alvoDeLargura = (larguraDisponivel * porcentagem) / 100
  const alvoDeAltura = Math.max(
    ALTURA_MINIMA_DO_TETO,
    tetoDeAltura * (PARTE_FIXA_DO_TETO + (1 - PARTE_FIXA_DO_TETO) * (porcentagem / 100)),
  )
  const escala = Math.min(alvoDeLargura / carregada.width, alvoDeAltura / carregada.height, 1)
  return { largura: carregada.width * escala, altura: carregada.height * escala }
}

function quebrarLegenda(doc: jsPDF, texto: string, largura: number, fonte: string): string[] {
  const limpo = sanitizarParaPdf(String(texto || '').trim())
  if (limpo.length === 0) return []
  doc.setFont(fonte, 'italic')
  doc.setFontSize(TAMANHO_DA_FONTE_DA_LEGENDA)
  const linhas = doc.splitTextToSize(`Fonte: ${limpo}`, Math.max(20, largura)) as string[]
  // Uma legenda quilométrica não pode virar meia página de crédito.
  return linhas.slice(0, 3)
}

/**
 * Desenha as imagens e devolve o novo `y`.
 *
 * Uma URL sem entrada no mapa (download falhou, imagem fora do ar) é
 * simplesmente pulada: um PDF a menos uma figura ainda é o PDF que a pessoa
 * pediu, e o `[Imagem não carregada: https://…]` que o gerador antigo escrevia
 * no meio da prova era pior do que o silêncio — ele ia impresso, na prova do
 * aluno.
 */
export function desenharImagensNoPdf(
  doc: jsPDF,
  imagens: ImagemDeQuestao[],
  layout: LayoutDeImagens,
  mapa: Map<string, ImagemCarregada>,
  opcoes: OpcoesDeDesenho,
): number {
  const disponiveis = (imagens || []).filter((imagem) => mapa.has(imagem.url))
  if (disponiveis.length === 0) return opcoes.y

  const fonte = opcoes.fonte || 'helvetica'
  const teto = opcoes.alturaMaxima ?? ALTURA_MAXIMA_DA_IMAGEM
  const espacoDepois = opcoes.espacoDepois ?? 4
  let y = opcoes.y

  const linhas = distribuirEmLinhas(disponiveis, layout)
  const ultimaLinha = linhas[linhas.length - 1]

  for (const linha of linhas) {
    const medidas: ImagemMedida[] = linha.map((imagem) => {
      const carregada = mapa.get(imagem.url)!
      const { largura, altura } = medirImagem(
        carregada,
        tamanhoDaImagem(imagem),
        opcoes.largura,
        teto,
      )
      return { imagem, carregada, largura, altura, legenda: [] }
    })

    // Uma linha lado a lado pode estourar a largura quando as imagens são mais
    // largas do que altas (o tamanho pedido é um alvo de largura, mas a altura
    // pode ter encolhido menos). Encolher a linha inteira pelo mesmo fator
    // preserva a proporção entre elas.
    const espacos = ESPACO_ENTRE_IMAGENS * (medidas.length - 1)
    const larguraDasImagens = medidas.reduce((soma, m) => soma + m.largura, 0)
    const larguraUtil = Math.max(10, opcoes.largura - espacos)
    if (larguraDasImagens > larguraUtil) {
      const fator = larguraUtil / larguraDasImagens
      for (const m of medidas) {
        m.largura *= fator
        m.altura *= fator
      }
    }

    for (const m of medidas) {
      m.legenda = quebrarLegenda(doc, m.imagem.fonte || '', m.largura, fonte)
    }

    const alturaDasImagens = Math.max(...medidas.map((m) => m.altura))
    const alturaDasLegendas = Math.max(
      0,
      ...medidas.map((m) => (m.legenda.length > 0 ? m.legenda.length * ALTURA_DA_LINHA_DA_FONTE + 1 : 0)),
    )
    const alturaDaLinha = alturaDasImagens + alturaDasLegendas

    // A figura e o seu crédito viajam juntos para a página seguinte.
    if (y + alturaDaLinha > opcoes.limiteY) {
      y = opcoes.novaPagina()
    }

    // Se ainda assim não couber (imagem mais alta que uma página inteira), a
    // linha encolhe até caber: melhor menor do que cortada ao meio.
    const espacoDaPagina = opcoes.limiteY - y - alturaDasLegendas
    if (alturaDasImagens > espacoDaPagina && espacoDaPagina > 10) {
      const fator = espacoDaPagina / alturaDasImagens
      for (const m of medidas) {
        m.largura *= fator
        m.altura *= fator
      }
    }

    let x = opcoes.x
    const alturaFinal = Math.max(...medidas.map((m) => m.altura))
    for (const m of medidas) {
      try {
        doc.addImage(m.carregada.dataUrl, 'JPEG', x, y, m.largura, m.altura)
      } catch {
        // Um dataUrl corrompido não derruba o arquivo inteiro.
      }
      if (m.legenda.length > 0) {
        doc.setFont(fonte, 'italic')
        doc.setFontSize(TAMANHO_DA_FONTE_DA_LEGENDA)
        doc.setTextColor(120, 120, 120)
        let yDaLegenda = y + alturaFinal + ALTURA_DA_LINHA_DA_FONTE
        for (const texto of m.legenda) {
          doc.text(texto, x, yDaLegenda)
          yDaLegenda += ALTURA_DA_LINHA_DA_FONTE
        }
      }
      x += m.largura + ESPACO_ENTRE_IMAGENS
    }

    y += alturaFinal + alturaDasLegendas
    if (linha !== ultimaLinha) y += ESPACO_ENTRE_IMAGENS
  }

  return y + espacoDepois
}
