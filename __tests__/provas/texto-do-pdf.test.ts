import { describe, expect, it } from 'vitest'
import {
  analisarTrechos,
  desenharLinhaRica,
  desescaparParaPdf,
  quebrarTexto,
  semMarcacao,
} from '@/lib/pdf/texto'

/**
 * O que o aluno via no PDF com resposta comentada:
 *
 * 1. Trechos com `**` impressos como asterisco, sem negrito — o negrito que
 *    não cabia inteiro numa linha era partido pela quebra, e o desenho, que lê
 *    linha a linha, não achava mais o par.
 * 2. Barras invertidas soltas, quase sempre coladas numa aspa — o `\"` que o
 *    comentário traz escapado do modelo que o gerou.
 *
 * Os testes olham as duas pontas: o que a quebra devolve e o que o desenho
 * manda para a página.
 */

/** Um jsPDF de mentira: mede um milímetro por caractere e anota o que desenha. */
function docDeMentira() {
  const desenhado: { texto: string; estilo: string; x: number }[] = []
  let estilo = 'normal'
  const doc = {
    getTextWidth: (texto: string) => texto.length,
    setFont: (_fonte: string, novoEstilo = 'normal') => {
      estilo = novoEstilo
    },
    text: (texto: string, x: number, _y: number) => {
      desenhado.push({ texto, estilo, x })
    },
  }
  return { doc: doc as never, desenhado }
}

/** Tudo o que foi para a página, na ordem. */
function noPapel(desenhado: { texto: string }[]): string {
  return desenhado.map((d) => d.texto).join('')
}

describe('desescaparParaPdf', () => {
  it('desfaz a aspa escapada em vez de imprimir a barra', () => {
    expect(desescaparParaPdf('o chamado \\"sinal de Murphy\\" é positivo')).toBe(
      'o chamado "sinal de Murphy" é positivo',
    )
  })

  it('desfaz os outros escapes de pontuação que o modelo devolve', () => {
    expect(desescaparParaPdf('hipotensão \\- taquicardia \\(choque\\)')).toBe(
      'hipotensão - taquicardia (choque)',
    )
    expect(desescaparParaPdf('aspas simples: \\’')).toBe('aspas simples: ’')
  })

  it('mantém a quebra de linha dos importadores', () => {
    expect(desescaparParaPdf('primeira\\nlsegunda')).toBe('primeira\nsegunda')
    expect(desescaparParaPdf('primeira\\nsegunda')).toBe('primeira\nsegunda')
  })

  it('não mexe na barra que é conteúdo', () => {
    expect(desescaparParaPdf('\\alpha e \\beta')).toBe('\\alpha e \\beta')
  })

  it('não deixa a barra sozinha do fim sobrar no papel', () => {
    expect(desescaparParaPdf('fim da frase \\')).toBe('fim da frase ')
  })
})

describe('analisarTrechos', () => {
  it('separa o negrito do resto', () => {
    expect(analisarTrechos('**A) (correta)** a aorta')).toEqual([
      { texto: 'A) (correta)', estilo: 'bold' },
      { texto: ' a aorta', estilo: 'normal' },
    ])
  })

  it('trata o asterisco solto como texto', () => {
    expect(semMarcacao('3 * 4 mg')).toBe('3 * 4 mg')
  })

  it('não imprime o `**` que ficou sem par', () => {
    expect(semMarcacao('**Conclusão: o quadro é compensatório')).toBe(
      'Conclusão: o quadro é compensatório',
    )
  })
})

describe('quebrarTexto', () => {
  const largura = 20

  it('fecha e reabre o negrito partido pela quebra de linha', () => {
    const { doc } = docDeMentira()
    const linhas = quebrarTexto(doc, 'veja o **sinal de Murphy positivo** aqui', largura)

    expect(linhas.length).toBeGreaterThan(1)
    // Nenhuma linha sai com marcador aberto: é isso que fazia o `**` ir parar
    // no papel.
    for (const linha of linhas) {
      expect(semMarcacao(linha)).not.toContain('*')
    }
    expect(semMarcacao(linhas.join(' '))).toBe('veja o sinal de Murphy positivo aqui')
  })

  it('mede sem os marcadores, que não são desenhados', () => {
    const { doc } = docDeMentira()
    const comNegrito = quebrarTexto(doc, '**doze letras** e mais um tanto de texto', largura)
    const semNegrito = quebrarTexto(doc, 'doze letras e mais um tanto de texto', largura)

    expect(comNegrito.map(semMarcacao)).toEqual(semNegrito.map(semMarcacao))
  })

  it('tira os escapes antes de quebrar', () => {
    const { doc } = docDeMentira()
    const linhas = quebrarTexto(doc, 'o \\"sopro\\" é sistólico', 60)

    expect(linhas).toEqual(['o "sopro" é sistólico'])
  })

  it('preserva a linha em branco entre parágrafos', () => {
    const { doc } = docDeMentira()
    expect(quebrarTexto(doc, 'um\n\ndois', 60)).toEqual(['um', '', 'dois'])
  })
})

describe('desenharLinhaRica', () => {
  it('desenha o negrito em negrito e sem asterisco', () => {
    const { doc, desenhado } = docDeMentira()
    desenharLinhaRica(doc, 'Roboto', '**A) (correta)** a aorta', 10, 50)

    expect(noPapel(desenhado)).toBe('A) (correta) a aorta')
    expect(desenhado[0]).toMatchObject({ texto: 'A) (correta)', estilo: 'bold', x: 10 })
    expect(desenhado[1]).toMatchObject({ texto: ' a aorta', estilo: 'normal' })
  })

  it('leva o negrito para a linha de baixo quando a quebra o parte', () => {
    const { doc, desenhado } = docDeMentira()
    for (const linha of quebrarTexto(doc, 'veja o **sinal de Murphy positivo** aqui', 20)) {
      desenharLinhaRica(doc, 'Roboto', linha, 10, 50)
    }

    expect(noPapel(desenhado)).not.toContain('*')
    // O "Murphy", que caiu na segunda linha, continua em negrito.
    expect(desenhado.filter((d) => d.estilo === 'bold').map((d) => d.texto).join('')).toContain(
      'Murphy',
    )
  })
})
