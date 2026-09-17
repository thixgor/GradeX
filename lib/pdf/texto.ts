/**
 * Quebra de linha e negrito/itálico inline, para todos os PDFs.
 *
 * Havia duas cópias: uma em `lib/pdf-generator.ts` e outra em
 * `lib/user-report-generator.ts`. Elas divergiam em dois pontos que se veem no
 * papel:
 *
 * - Só a primeira descontava o `**` da MEDIÇÃO. Como o marcador não é
 *   desenhado, medir com ele conta quatro caracteres a mais por trecho em
 *   negrito, e a linha quebra antes do necessário — o relatório do aluno saía
 *   com o parágrafo ondulado, mais curto de um lado.
 * - Só a primeira sabia DESENHAR o negrito. No relatório, um
 *   `**Comentário por alternativa**` ia para o papel com os asteriscos.
 *
 * Uma cópia só resolve as duas. `sanitizarParaPdf` continua no funil: sem a
 * Roboto embutida, é o que impede um `≥` perdido de soletrar a linha inteira
 * (ver `lib/pdf/marca.ts`).
 *
 * ## Os dois defeitos que a resposta comentada mostrava
 *
 * **Asteriscos no papel.** A quebra era feita no texto cru e o desenho
 * procurava `**...**` DENTRO de cada linha já quebrada. Um negrito que não
 * coubesse inteiro numa linha — o caso comum, porque o comentário por
 * alternativa destaca termos no meio da frase — ficava com o `**` de abertura
 * numa linha e o de fechamento na seguinte. Nenhuma das duas casava com o
 * padrão, então as duas iam para o papel com os asteriscos à mostra e sem
 * negrito nenhum. Por isso a marcação agora é interpretada UMA VEZ, no
 * parágrafo inteiro, antes de quebrar: cada linha sai com os marcadores
 * fechados nela mesma e reabertos na próxima.
 *
 * **Barras invertidas soltas.** O comentário chega com escapes de JSON
 * (`\"`, `\-`) do modelo que o gerou. Só `\n` e `\nl` eram desfeitos; o resto
 * sobrava no papel como uma barra grudada na aspa. `desescaparParaPdf` desfaz
 * o escape em vez de imprimi-lo.
 */

import type jsPDF from 'jspdf'
import { sanitizarParaPdf } from './marca'

export type EstiloDeTexto = 'normal' | 'bold' | 'italic' | 'bolditalic'

/** Um pedaço de linha com um estilo só. */
export interface TrechoDeTexto {
  texto: string
  estilo: EstiloDeTexto
}

type Marcador = '**' | '*'

// ── Escapes ──────────────────────────────────────────────────────

/**
 * Desfaz os escapes que chegam no texto em vez de imprimi-los.
 *
 * Os comentários gerados por IA e os importados de TXT vêm com o texto já
 * escapado para JSON: `\"`, `\'`, `\-`, e o `\n` / `\nl` de quebra de linha.
 * O `\n` era o único tratado, e os outros saíam no PDF como a barra invertida
 * que o aluno via colada à aspa.
 *
 * O que NÃO é escape continua intocado: `\alpha` e `\frac` (letra depois da
 * barra) seguem inteiros, porque ali a barra é conteúdo.
 */
export function desescaparParaPdf(texto: string): string {
  if (!texto) return texto || ''
  if (!texto.includes('\\')) return texto

  let saida = ''
  for (let i = 0; i < texto.length; i += 1) {
    if (texto[i] !== '\\') {
      saida += texto[i]
      continue
    }

    const proximo = texto[i + 1]
    // Barra sozinha no fim do texto: não sobra nada para escapar, e imprimi-la
    // é exatamente o defeito que este arquivo corrige.
    if (proximo === undefined) continue

    if (proximo === 'n') {
      // `\nl` é o que os importadores de TXT gravam para "linha nova".
      i += texto[i + 2] === 'l' ? 2 : 1
      saida += '\n'
      continue
    }
    if (proximo === 'r') {
      i += 1
      continue
    }
    if (proximo === 't') {
      i += 1
      saida += ' '
      continue
    }
    if (proximo === '\\') {
      i += 1
      saida += '\\'
      continue
    }
    // Letra ou número depois da barra não é escape de JSON — é notação
    // (`\alpha`, `\SI`), e mexer nela estragaria o texto.
    if (/[A-Za-z0-9]/.test(proximo)) {
      i += 1
      saida += `\\${proximo}`
      continue
    }
    i += 1
    saida += proximo
  }
  return saida
}

// ── Marcação inline ──────────────────────────────────────────────

function marcadorEm(texto: string, indice: number): Marcador | null {
  if (texto[indice] !== '*') return null
  return texto[indice + 1] === '*' ? '**' : '*'
}

/**
 * Há um fechamento para este marcador mais adiante?
 *
 * Um `*` solto é quase sempre conteúdo — multiplicação, nota de rodapé, item
 * de lista. Exigir o par preserva esse texto como texto, que é o que o padrão
 * `\*(.+?)\*` de antes fazia.
 */
function temFechamento(texto: string, desde: number, marcador: Marcador): boolean {
  for (let j = desde; j < texto.length; j += 1) {
    const encontrado = marcadorEm(texto, j)
    if (!encontrado) continue
    // Fechar colado à abertura seria um trecho vazio: não é negrito, é texto.
    if (encontrado === marcador) return j > desde
    j += encontrado.length - 1
  }
  return false
}

function estiloDaPilha(pilha: Marcador[], base: EstiloDeTexto): EstiloDeTexto {
  const negrito = pilha.includes('**') || base === 'bold' || base === 'bolditalic'
  const italico = pilha.includes('*') || base === 'italic' || base === 'bolditalic'
  if (negrito && italico) return 'bolditalic'
  if (negrito) return 'bold'
  if (italico) return 'italic'
  return 'normal'
}

/**
 * Lê `**negrito**` e `*itálico*` e devolve os trechos com o estilo de cada um.
 *
 * Um `**` sem fechamento vale até o fim do parágrafo. É o oposto do que o
 * padrão antigo fazia (imprimir os asteriscos), e é o que o texto quer dizer:
 * ninguém escreve dois asteriscos seguidos no meio de um comentário de prova.
 */
export function analisarTrechos(texto: string, estiloBase: EstiloDeTexto = 'normal'): TrechoDeTexto[] {
  const trechos: TrechoDeTexto[] = []
  const pilha: Marcador[] = []
  let buffer = ''

  const despejar = () => {
    if (!buffer) return
    trechos.push({ texto: buffer, estilo: estiloDaPilha(pilha, estiloBase) })
    buffer = ''
  }

  for (let i = 0; i < texto.length; i += 1) {
    const marcador = marcadorEm(texto, i)
    if (!marcador) {
      buffer += texto[i]
      continue
    }

    const aberto = pilha.lastIndexOf(marcador)
    if (aberto >= 0) {
      despejar()
      // `splice` e não `pop`: em `**a *b** c*` o fechamento do negrito também
      // encerra o itálico que abriu dentro dele.
      pilha.splice(aberto)
      i += marcador.length - 1
      continue
    }

    if (marcador === '**' || temFechamento(texto, i + marcador.length, marcador)) {
      despejar()
      pilha.push(marcador)
      i += marcador.length - 1
      continue
    }

    buffer += marcador
    i += marcador.length - 1
  }

  despejar()
  return trechos
}

/** O texto sem os marcadores, que é o que efetivamente vai para a página. */
export function semMarcacao(texto: string): string {
  if (!texto || !texto.includes('*')) return texto || ''
  return analisarTrechos(texto)
    .map((trecho) => trecho.texto)
    .join('')
}

// ── Quebra de linha ──────────────────────────────────────────────

/** Uma palavra pode ter mais de um estilo: `**neg**rito`. */
type Palavra = TrechoDeTexto[]

function palavrasComEstilo(trechos: TrechoDeTexto[]): Palavra[] {
  const palavras: Palavra[] = []
  let atual: Palavra = []

  for (const trecho of trechos) {
    const partes = trecho.texto.split(' ')
    partes.forEach((parte, indice) => {
      if (indice > 0) {
        if (atual.length > 0) palavras.push(atual)
        atual = []
      }
      if (parte) atual.push({ texto: parte, estilo: trecho.estilo })
    })
  }
  if (atual.length > 0) palavras.push(atual)

  return palavras
}

function marcadoresDo(estilo: EstiloDeTexto): { negrito: boolean; italico: boolean } {
  return {
    negrito: estilo === 'bold' || estilo === 'bolditalic',
    italico: estilo === 'italic' || estilo === 'bolditalic',
  }
}

/**
 * Escreve a linha de volta em `**` / `*`, fechando tudo o que ficou aberto.
 *
 * É o que faz a linha ser autossuficiente: o desenho lê cada linha sozinha, e
 * um negrito partido pela quebra precisa fechar aqui e reabrir na linha
 * seguinte para não virar asterisco no papel.
 */
function serializar(palavras: Palavra[]): string {
  let saida = ''
  let negrito = false
  let italico = false

  palavras.forEach((palavra, indice) => {
    if (indice > 0) {
      const alvo = marcadoresDo(palavra[0].estilo)
      // O espaço entre palavras não pertence a nenhum dos dois estilos: fechar
      // antes dele deixa `**A) (correta)** texto` em vez de `**A) (correta) **texto`.
      if (negrito !== alvo.negrito || italico !== alvo.italico) {
        if (italico) {
          saida += '*'
          italico = false
        }
        if (negrito) {
          saida += '**'
          negrito = false
        }
      }
      saida += ' '
    }

    for (const pedaco of palavra) {
      const alvo = marcadoresDo(pedaco.estilo)
      if (alvo.negrito !== negrito || alvo.italico !== italico) {
        if (italico) {
          saida += '*'
          italico = false
        }
        if (negrito) {
          saida += '**'
          negrito = false
        }
        if (alvo.negrito) {
          saida += '**'
          negrito = true
        }
        if (alvo.italico) {
          saida += '*'
          italico = true
        }
      }
      saida += pedaco.texto
    }
  })

  if (italico) saida += '*'
  if (negrito) saida += '**'
  return saida
}

/**
 * Quebra o texto na largura dada, preservando os parágrafos.
 *
 * `\n` e `\nl` (que os importadores de TXT gravam) viram quebra de verdade, e
 * a linha em branco entre parágrafos é preservada: sem isso, um enunciado de
 * caso clínico vira um bloco único.
 */
export function quebrarTexto(doc: jsPDF, texto: string, larguraMaxima: number): string[] {
  if (!texto) return []

  const limpo = sanitizarParaPdf(desescaparParaPdf(texto))
  const linhas: string[] = []

  for (const paragrafo of limpo.split(/\n/)) {
    if (paragrafo.trim() === '') {
      linhas.push('')
      continue
    }

    const palavras = palavrasComEstilo(analisarTrechos(paragrafo))
    let atual: Palavra[] = []
    // A medição ignora os marcadores porque eles não são desenhados.
    let plano = ''

    for (const palavra of palavras) {
      const palavraPlana = palavra.map((pedaco) => pedaco.texto).join('')
      const teste = plano ? `${plano} ${palavraPlana}` : palavraPlana
      if (doc.getTextWidth(teste) > larguraMaxima && atual.length > 0) {
        linhas.push(serializar(atual))
        atual = [palavra]
        plano = palavraPlana
      } else {
        atual.push(palavra)
        plano = teste
      }
    }
    if (atual.length > 0) linhas.push(serializar(atual))
  }

  return linhas
}

/**
 * Desenha uma linha com `**negrito**` e `*itálico*` inline.
 *
 * O caminho rápido (linha sem `*`) é uma chamada só de `doc.text` — a esmagadora
 * maioria das linhas de uma prova, e o que mantém o custo do arquivo igual ao
 * de antes.
 */
export function desenharLinhaRica(
  doc: jsPDF,
  fonte: string,
  linha: string,
  x: number,
  y: number,
  estiloBase: EstiloDeTexto = 'normal',
): void {
  if (!linha.includes('*')) {
    doc.setFont(fonte, estiloBase)
    doc.text(linha, x, y)
    return
  }

  let cursor = x
  for (const trecho of analisarTrechos(linha, estiloBase)) {
    doc.setFont(fonte, trecho.estilo)
    doc.text(trecho.texto, cursor, y)
    cursor += doc.getTextWidth(trecho.texto)
  }
  doc.setFont(fonte, estiloBase)
}
