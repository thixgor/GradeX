import { describe, expect, it } from 'vitest'

/**
 * O relatório com gabarito, gerado de verdade.
 *
 * O teste existe por um defeito que só aparecia no papel: uma resposta
 * comentada mais alta que a folha era desenhada inteira mesmo assim, e o que
 * passava do fim da página sumia. O aluno recebia a explicação cortada no meio
 * da frase.
 *
 * O detalhe que engana: o texto perdido ESTÁ no arquivo. O jsPDF não recorta
 * nada — ele escreve o operador de desenho na coordenada que mandarem, e é o
 * leitor de PDF que não mostra o que cai fora da página. Procurar o texto no
 * arquivo, portanto, não prova nada; o que prova é a COORDENADA de cada linha.
 *
 * Daí a leitura do stream. Ela depende de duas coisas do jsPDF: o conteúdo sair
 * sem compressão (é o padrão) e o texto ser posicionado com `Td`. Se um dia uma
 * atualização mudar isso, `semPosicao` acusa — e o conserto é reescrever a
 * leitura, não afrouxar a asserção.
 */

const A4_ALTURA_MM = 297
const PONTOS_POR_MM = 72 / 25.4
/** Abaixo daqui é rodapé: o mesmo limite que o gerador respeita. */
const LIMITE_INFERIOR_MM = A4_ALTURA_MM - 25

/** Stubs mínimos de DOM — o gerador é de navegador. */
function prepararAmbiente(): { blob: () => Blob | null } {
  class ImagemFalsa {
    crossOrigin = ''
    naturalWidth = 0
    naturalHeight = 0
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    // O logo e as imagens da prova não existem aqui; os carregadores já sabem
    // desistir sozinhos e seguir sem elas.
    set src(_url: string) {
      setTimeout(() => this.onerror?.(), 0)
    }
  }

  let capturado: Blob | null = null
  const g = globalThis as any

  g.Image = ImagemFalsa
  g.document = {
    createElement: () => ({ href: '', download: '', style: {}, click: () => {}, getContext: () => null }),
    body: { appendChild: () => {}, removeChild: () => {} },
  }
  // O gerador entrega o arquivo por download; é por aqui que ele passa.
  g.URL.createObjectURL = (blob: Blob) => {
    capturado = blob
    return 'blob:teste'
  }
  g.URL.revokeObjectURL = () => {}

  return { blob: () => capturado }
}

/** Onde cada linha numerada da resposta comentada foi de fato desenhada. */
function posicoesDasLinhas(pdf: string): Map<string, number> {
  const posicoes = new Map<string, number>()
  for (const trecho of pdf.matchAll(/([\d.]+) ([\d.-]+) Td\s*\((?:[^()\\]|\\.)*Linha (\d{3})[^)]*\)/g)) {
    // A origem do PDF é o canto inferior esquerdo; o gerador conta de cima.
    const yEmPontos = parseFloat(trecho[2])
    posicoes.set(trecho[3], A4_ALTURA_MM - yEmPontos / PONTOS_POR_MM)
  }
  return posicoes
}

const TOTAL_DE_LINHAS = 90
const numeroDaLinha = (i: number) => String(i + 1).padStart(3, '0')

const RESPOSTA_COMENTADA = Array.from({ length: TOTAL_DE_LINHAS }, (_, i) =>
  `Linha ${numeroDaLinha(i)} da resposta comentada, longa o bastante para ocupar a largura util da caixa do relatorio.`,
).join('\n')

function provaDeUmaQuestao() {
  return {
    title: 'Prova de Fisiologia',
    numberOfQuestions: 1,
    questions: [
      {
        id: 'q1',
        number: 1,
        type: 'multiple-choice',
        statement: 'Enunciado curto.',
        command: 'Assinale a alternativa correta.',
        alternatives: [
          { id: 'a', letter: 'A', text: 'Primeira', isCorrect: false },
          { id: 'b', letter: 'B', text: 'Segunda', isCorrect: true },
        ],
        explanation: RESPOSTA_COMENTADA,
      },
    ],
  } as any
}

describe('relatório com gabarito', () => {
  it('desenha a resposta comentada longa dentro da página, sem perder linha', async () => {
    const ambiente = prepararAmbiente()
    const { generateUserReportWithGabaritoPDF } = await import('@/lib/user-report-generator')

    await generateUserReportWithGabaritoPDF({
      exam: provaDeUmaQuestao(),
      examId: 'e1',
      userName: 'Aluno de Teste',
      signature: '',
      answers: [{ questionId: 'q1', selectedAlternative: 'b' } as any],
    })

    const blob = ambiente.blob()
    expect(blob).toBeTruthy()

    const pdf = Buffer.from(await blob!.arrayBuffer()).toString('latin1')
    const posicoes = posicoesDasLinhas(pdf)
    const todas = Array.from({ length: TOTAL_DE_LINHAS }, (_, i) => numeroDaLinha(i))

    // Toda linha foi desenhada em algum lugar.
    expect(todas.filter(n => !posicoes.has(n))).toEqual([])

    // E esse lugar está dentro da área útil: acima do rodapé e abaixo do topo.
    // Era exatamente aqui que a versão antiga falhava — a partir de certa
    // altura as linhas iam parar fora da folha, invisíveis.
    const foraDaAreaUtil = todas.filter(n => {
      const y = posicoes.get(n)!
      return y < 0 || y > LIMITE_INFERIOR_MM
    })
    expect(foraDaAreaUtil).toEqual([])
  }, 30000)
})
