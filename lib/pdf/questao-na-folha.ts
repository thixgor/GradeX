import type { Question } from '@/lib/types'
import type { RecursoVisual } from '@/lib/ia/estudo/recursos-visuais'
import type { ImagemDeQuestao, LayoutDeImagens } from '@/lib/questoes/imagens'
import { blocoDaResposta, blocoDoEnunciado } from '@/lib/questoes/imagens-da-questao'
import { montarRespostaComentada } from '@/lib/provas/resposta-comentada'

import { desenharCaixaDeRespostaComentada } from './caixa-de-resposta-comentada'
import {
  type Alternativa,
  type Folha,
  type LinhaDoGrupo,
  baseDaLinha,
  desenharGrupo,
  escreverCredito,
  escreverTexto,
  novaPagina,
} from './folha'
import {
  ALTURA_MAXIMA_DA_IMAGEM,
  type ImagemCarregada,
  desenharImagensNoPdf,
  medirLinhasDeImagens,
} from './imagens-de-questao'
import {
  FLORESTA,
  TINTA,
  TINTA_SUAVE,
  Y_APOS_CABECALHO,
  desenharBolha,
  fonte,
  marcarCerto,
  marcarErrado,
} from './marca'
import { desenharRecursoNoPdf } from './recurso-visual-pdf'
import { desenharLinhaRica, quebrarTexto } from './texto'

/**
 * As peças de uma QUESTÃO numa folha: o enunciado com tudo o que vem junto,
 * a caixa de vidro do comentário, a grade de respostas.
 *
 * Moram aqui, e não em cada gerador, porque a prova (`lib/pdf-generator.ts`)
 * e o relatório do aluno (`lib/user-report-generator.ts`) desenham a MESMA
 * questão — e duas cópias do mesmo desenho são duas cópias que divergem: o
 * relatório já foi o único PDF que omitia as imagens do enunciado.
 */

export function rotuloDoTipo(question: Question): string {
  return question.type === 'discursive' ? 'Discursiva' : question.type === 'essay' ? 'Redação' : 'Múltipla escolha'
}

/**
 * As imagens de um bloco, em fluxo, dentro da folha.
 *
 * A medida, a quebra de página que não separa a figura do crédito e o lado a
 * lado moram em `lib/pdf/imagens-de-questao.ts`; isto só amarra a folha.
 */
export function desenharImagensNaFolha(
  folha: Folha,
  imageMap: Map<string, ImagemCarregada>,
  bloco: { imagens: ImagemDeQuestao[]; layout: LayoutDeImagens },
  opcoes: { recuo?: number; alturaMaxima?: number } = {},
): void {
  if (bloco.imagens.length === 0) return
  const recuo = opcoes.recuo ?? 0
  const inicio = folha.y + 1.5
  // A moldura passa 1 mm para fora da figura: o recuo de 1 mm a mantém
  // dentro da margem.
  const fim = desenharImagensNoPdf(folha.doc, bloco.imagens, bloco.layout, imageMap, {
    x: folha.margem + recuo + 1,
    largura: folha.larguraUtil - recuo - 2,
    y: inicio,
    limiteY: folha.limite - 1,
    alturaMaxima: opcoes.alturaMaxima,
    fonte: folha.fonte,
    espacoDepois: 4,
    novaPagina: () => novaPagina(folha) + 1.5,
  })
  if (fim !== inicio) folha.y = fim
}

/** Tabela, gráfico, esquema ou citação (provas geradas por IA). */
export function desenharRecursoNaFolha(folha: Folha, recurso: RecursoVisual): void {
  folha.y = desenharRecursoNoPdf(
    {
      doc: folha.doc,
      fonte: folha.fonte,
      x: folha.margem,
      largura: folha.larguraUtil,
      // O título do recurso é escrito NA linha de base `y`: o respiro de cima
      // é o que o separa do enunciado.
      y: folha.y + 3.5,
      limiteInferior: folha.limite,
      novaPagina: () => novaPagina(folha) + 3.5,
    },
    recurso,
  )
}

/** Enunciado, crédito, imagens, material de apoio e comando, nesta ordem. */
export function desenharEnunciado(folha: Folha, question: Question, imageMap: Map<string, ImagemCarregada>): void {
  if (question.statement) escreverTexto(folha, question.statement, { depois: 2 })
  if (question.statementSource) escreverCredito(folha, question.statementSource)
  desenharImagensNaFolha(folha, imageMap, blocoDoEnunciado(question))
  if (question.supportMaterial) desenharRecursoNaFolha(folha, question.supportMaterial)
  if (question.command) {
    escreverTexto(folha, question.command, { estilo: 'bold', cor: FLORESTA, depois: 2 })
  }
  folha.y += 1.5
}

/** As medidas da caixa de vidro do comentário, iguais em todo documento. */
export const MEDIDAS_DO_COMENTARIO = {
  alturaDaLinha: 5.2,
  alturaDoTitulo: 10,
  respiroDeContinuacao: 3.5,
  respiroInferior: 4,
  recuo: 5,
  corpoDoTitulo: 9,
  baseDoTitulo: 6.8,
  corpoDoTexto: 9.3,
}

/**
 * Um texto longo numa caixa de vidro que atravessa páginas.
 *
 * É a caixa da resposta comentada: as imagens entram DENTRO dela (medidas
 * antes, porque o vidro é pintado antes do conteúdo) e ela fatia em quantas
 * páginas o texto pedir.
 *
 * A caixa conta cada linha como uma faixa de `alturaDaLinha` com a linha de
 * base no TOPO da faixa; o desenhador desloca a base para o meio da faixa,
 * e assim o respiro de cima e o de baixo saem iguais.
 */
export function desenharCaixaDeTexto(
  folha: Folha,
  texto: string,
  titulo: string,
  opcoes: {
    tom?: 'verde' | 'claro' | 'laranja'
    imagens?: { imagens: ImagemDeQuestao[]; layout: LayoutDeImagens }
    imageMap?: Map<string, ImagemCarregada>
    /** Troca o corpo e a entrelinha — a frente de um flashcard é maior. */
    medidas?: Partial<typeof MEDIDAS_DO_COMENTARIO>
  } = {},
): boolean {
  const { doc } = folha
  const m = { ...MEDIDAS_DO_COMENTARIO, ...opcoes.medidas }
  const larguraDoConteudo = folha.larguraUtil - 2 * m.recuo
  // A fonte é definida ANTES de quebrar: medir em corpo 10 o texto que sai
  // em 9,3 dá outra quebra.
  fonte(doc, 'normal', m.corpoDoTexto, TINTA)
  const linhas = texto ? quebrarTexto(doc, texto, larguraDoConteudo) : []
  const imagens =
    opcoes.imagens && opcoes.imageMap && opcoes.imagens.imagens.length > 0
      ? medirLinhasDeImagens(doc, opcoes.imagens.imagens, opcoes.imagens.layout, opcoes.imageMap, {
          largura: larguraDoConteudo - 2,
          alturaMaxima: ALTURA_MAXIMA_DA_IMAGEM * 0.8,
          fonte: folha.fonte,
        })
      : []
  if (linhas.length === 0 && imagens.length === 0) return false

  // Caixa curta não se parte: três linhas no pé de uma página e o resto na
  // seguinte é pior do que começar a caixa inteira lá.
  const alturaTotal =
    m.alturaDoTitulo +
    linhas.length * m.alturaDaLinha +
    imagens.reduce((soma, linha) => soma + linha.altura + 4, 0) +
    m.respiroInferior
  if (alturaTotal <= 70 && folha.y + alturaTotal > folha.limite) novaPagina(folha)

  const deslocamento = baseDaLinha(m.alturaDaLinha, m.corpoDoTexto)
  folha.y = desenharCaixaDeRespostaComentada({
    doc,
    fonte: folha.fonte,
    x: folha.margem,
    largura: folha.larguraUtil,
    y: folha.y,
    limiteInferior: folha.limite,
    yAposQuebra: Y_APOS_CABECALHO,
    novaPagina: () => {
      novaPagina(folha)
    },
    linhas,
    imagens: imagens.map((linha) => ({
      ...linha,
      desenhar: (x: number, y: number, escala?: number) => linha.desenhar(x + 1, y, escala),
    })),
    titulo,
    tom: opcoes.tom ?? 'verde',
    cores: { titulo: FLORESTA, texto: TINTA },
    medidas: m,
    desenharLinha: (linha, x, y) => desenharLinhaRica(doc, folha.fonte, linha, x, y + deslocamento),
  })
  folha.y += 4
  return true
}

/**
 * Resposta comentada: explicação avulsa + comentário por alternativa +
 * pontos-chave, na ordem de `montarRespostaComentada`. Ler só
 * `question.explanation` era o que fazia o PDF sair sem comentário nenhum nas
 * provas cujo feedback está por alternativa.
 */
export function desenharRespostaComentada(folha: Folha, question: Question, imageMap: Map<string, ImagemCarregada>): boolean {
  return desenharCaixaDeTexto(folha, montarRespostaComentada(question), 'Resposta comentada', {
    imagens: blocoDaResposta(question),
    imageMap,
  })
}

/** O espaço entre o fim de uma questão e o cabeçalho da seguinte. */
export function fecharQuestao(folha: Folha): void {
  folha.y += 5
}

/**
 * A grade de respostas: número da questão e a letra numa bolha, em colunas.
 *
 * Serve ao gabarito oficial (só a letra certa), à folha do aluno (a dele) e à
 * versão comparada (a dele, a certa e a marca de acerto). A cor nunca está
 * sozinha: a marca de certo/errado é desenhada, e a bolha cheia × vazada diz
 * quem é quem mesmo em preto e branco.
 */
export interface CelulaDaGrade {
  numero: string | number
  /** A letra principal: a resposta (do aluno ou oficial). `—` em branco. */
  letra: string
  /** A letra do gabarito, na versão comparada. */
  gabarito?: string
  /** `true` acertou, `false` errou, `null`/ausente não se aplica. */
  acerto?: boolean | null
}

export function desenharGrade(folha: Folha, celulas: CelulaDaGrade[], colunas: number, titulo: string): void {
  if (celulas.length === 0) return
  const { doc } = folha
  const altura = 9.4
  const larguraDaCelula = folha.larguraUtil / colunas
  const linhas: LinhaDoGrupo[] = []
  for (let i = 0; i < celulas.length; i += colunas) {
    const fileira = celulas.slice(i, i + colunas)
    linhas.push({
      altura,
      desenhar: (x, y) => {
        const meio = y + altura / 2
        fileira.forEach((celula, c) => {
          const cx = x + c * larguraDaCelula
          if (c > 0) {
            doc.setDrawColor(226, 234, 229)
            doc.setLineWidth(0.22)
            doc.line(cx, y + 1.6, cx, y + altura - 1.6)
          }
          fonte(doc, 'bold', 8.5, TINTA_SUAVE)
          doc.text(String(celula.numero), cx + 9, meio + 1.05, { align: 'right' })
          const emBranco = !celula.letra || celula.letra === '—' || celula.letra === '-'
          if (emBranco) {
            fonte(doc, 'normal', 9, [150, 162, 155])
            doc.text('—', cx + 14.5, meio + 1.1, { align: 'center' })
          } else {
            desenharBolha(doc, celula.letra, cx + 14.5, meio, 'cheia', 2.8)
          }
          if (celula.gabarito !== undefined) {
            desenharBolha(doc, celula.gabarito || '—', cx + 22, meio, 'vazia', 2.8)
            if (celula.acerto === true) marcarCerto(doc, cx + 29.5, meio, 2.2)
            else if (celula.acerto === false) marcarErrado(doc, cx + 29.5, meio, 2.2)
          }
        })
      },
    })
  }
  desenharGrupo(folha, linhas, { titulo, recuoDoFio: 3, depois: 3 })
}

/** As alternativas de uma questão, no formato de `desenharAlternativas`. */
export function alternativasDa(
  question: Question,
  estado: (alt: Question['alternatives'][number]) => Alternativa['estado'],
  etiqueta?: (alt: Question['alternatives'][number]) => string | undefined,
): Alternativa[] {
  return (question.alternatives || []).map((alt, i) => ({
    letra: alt.letter || String.fromCharCode(65 + i),
    texto: alt.text || '',
    estado: estado(alt),
    etiqueta: etiqueta?.(alt),
  }))
}

