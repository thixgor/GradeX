import { describe, expect, it } from 'vitest'
import {
  destinoDoArraste,
  indiceDepoisDeMover,
  moverQuestao,
  resumoDaQuestao,
  trecho,
} from '@/lib/provas/ordem-das-questoes'

function questao(id: string, number: number, campos: Record<string, any> = {}) {
  return { id, number, statement: '', command: '', alternatives: [], ...campos } as any
}

const ids = (lista: any[]) => lista.map((q) => q.id)
const numeros = (lista: any[]) => lista.map((q) => q.number)

const prova = () => [questao('a', 1), questao('b', 2), questao('c', 3), questao('d', 4)]

describe('moverQuestao', () => {
  it('insere no destino em vez de trocar com quem estava lá', () => {
    // Arrastar a última para a frente de tudo: as outras descem um lugar, e
    // 'a' NÃO é catapultada para o fim (que é o que uma troca faria).
    expect(ids(moverQuestao(prova(), 3, 0))).toEqual(['d', 'a', 'b', 'c'])
  })

  it('move para baixo empurrando as do caminho para cima', () => {
    expect(ids(moverQuestao(prova(), 0, 2))).toEqual(['b', 'c', 'a', 'd'])
  })

  it('entre vizinhas, inserir dá no mesmo que trocar — as setas seguem valendo', () => {
    expect(ids(moverQuestao(prova(), 2, 1))).toEqual(['a', 'c', 'b', 'd'])
    expect(ids(moverQuestao(prova(), 1, 2))).toEqual(['a', 'c', 'b', 'd'])
  })

  it('renumera a prova inteira: o número é a posição', () => {
    const movida = moverQuestao(prova(), 3, 0)
    expect(numeros(movida)).toEqual([1, 2, 3, 4])
    expect(movida[0].id).toBe('d')
  })

  it('devolve objetos novos para quem mudou de número', () => {
    const original = prova()
    const movida = moverQuestao(original, 3, 0)
    expect(movida[0]).not.toBe(original[3])
    // E não mexe na lista que recebeu.
    expect(ids(original)).toEqual(['a', 'b', 'c', 'd'])
    expect(numeros(original)).toEqual([1, 2, 3, 4])
  })

  it('soltar no mesmo lugar não mexe em nada', () => {
    const original = prova()
    expect(moverQuestao(original, 2, 2)).toBe(original)
  })

  it('ignora índice fora da prova em vez de perder questão', () => {
    const original = prova()
    expect(moverQuestao(original, -1, 0)).toBe(original)
    expect(moverQuestao(original, 0, 9)).toBe(original)
    expect(moverQuestao(original, 9, 0)).toBe(original)
  })
})

describe('indiceDepoisDeMover', () => {
  it('a questão arrastada é seguida até onde foi solta', () => {
    expect(indiceDepoisDeMover(3, 3, 0)).toBe(0)
  })

  it('quem está aberta anda quando o arraste passa por cima dela', () => {
    // 'a' (0) foi para 2: quem estava em 1 e 2 sobe um lugar.
    expect(indiceDepoisDeMover(1, 0, 2)).toBe(0)
    expect(indiceDepoisDeMover(2, 0, 2)).toBe(1)
    // 'd' (3) foi para 0: quem estava em 0..2 desce um lugar.
    expect(indiceDepoisDeMover(0, 3, 0)).toBe(1)
    expect(indiceDepoisDeMover(2, 3, 0)).toBe(3)
  })

  it('quem está fora do trecho remexido fica onde estava', () => {
    expect(indiceDepoisDeMover(3, 0, 2)).toBe(3)
    expect(indiceDepoisDeMover(3, 1, 2)).toBe(3)
    expect(indiceDepoisDeMover(0, 1, 2)).toBe(0)
  })

  it('soltar no mesmo lugar não troca a questão aberta', () => {
    expect(indiceDepoisDeMover(2, 2, 2)).toBe(2)
  })
})

describe('trecho', () => {
  it('junta quebras de linha e espaços repetidos', () => {
    expect(trecho('Um   texto\ncom\n\nquebras')).toBe('Um texto com quebras')
  })

  it('corta sem partir palavra e sem pontuação pendurada', () => {
    const cortado = trecho('Paciente de 54 anos comparece ao ambulatorio de cardiologia relatando dor', 40)
    expect(cortado.endsWith('…')).toBe(true)
    expect(cortado.length).toBeLessThanOrEqual(41)
    expect(cortado).not.toContain('  ')
    expect(cortado.slice(0, -1).trim()).toBe(cortado.slice(0, -1))
  })

  it('texto curto passa inteiro, sem reticências', () => {
    expect(trecho('ENEM 2023')).toBe('ENEM 2023')
  })

  it('aguenta questão sem o campo', () => {
    expect(trecho(undefined)).toBe('')
    expect(trecho(null)).toBe('')
  })
})

describe('resumoDaQuestao', () => {
  it('a fonte do enunciado é o que identifica a questão', () => {
    const r = resumoDaQuestao(questao('a', 1, { statementSource: 'ENEM 2023', statement: 'Um texto qualquer' }))
    expect(r.origem).toBe('fonte')
    expect(r.fonte).toBe('ENEM 2023')
    expect(r.texto).toBe('ENEM 2023')
  })

  it('sem fonte, o começo do enunciado serve', () => {
    const r = resumoDaQuestao(questao('a', 1, { statement: 'Paciente de 54 anos com dor toracica' }))
    expect(r.origem).toBe('enunciado')
    expect(r.fonte).toBe('')
    expect(r.texto).toBe('Paciente de 54 anos com dor toracica')
  })

  it('redação se reconhece pelo tema', () => {
    const r = resumoDaQuestao(questao('a', 1, { essayTheme: 'Desafios da saude mental' }))
    expect(r.origem).toBe('tema')
    expect(r.texto).toBe('Desafios da saude mental')
  })

  it('questão recém-criada cai no comando', () => {
    const r = resumoDaQuestao(questao('a', 1, { command: 'Assinale a alternativa correta' }))
    expect(r.origem).toBe('comando')
  })

  it('questão em branco não inventa texto', () => {
    const r = resumoDaQuestao(questao('a', 1))
    expect(r.origem).toBe('vazia')
    expect(r.texto).toBe('')
  })

  it('fonte só de espaços conta como sem fonte', () => {
    const r = resumoDaQuestao(questao('a', 1, { statementSource: '   ', statement: 'Enunciado' }))
    expect(r.origem).toBe('enunciado')
  })
})

describe('destinoDoArraste', () => {
  it('soltar antes de alguém que vem depois desconta a própria saída da lista', () => {
    // Arrastar 'b' (1) para a fenda entre 'c' e 'd' (3) tem de deixá-la em 2.
    expect(destinoDoArraste(1, 3)).toBe(2)
    expect(ids(moverQuestao(prova(), 1, destinoDoArraste(1, 3)))).toEqual(['a', 'c', 'b', 'd'])
  })

  it('soltar para trás usa a fenda como está', () => {
    expect(destinoDoArraste(3, 1)).toBe(1)
    expect(ids(moverQuestao(prova(), 3, destinoDoArraste(3, 1)))).toEqual(['a', 'd', 'b', 'c'])
  })

  it('soltar na fenda ao lado de si mesma não move nada', () => {
    expect(destinoDoArraste(2, 2)).toBe(2)
    expect(destinoDoArraste(2, 3)).toBe(2)
  })

  it('soltar no fim da lista chega na última posição', () => {
    expect(destinoDoArraste(0, 4)).toBe(3)
    expect(ids(moverQuestao(prova(), 0, destinoDoArraste(0, 4)))).toEqual(['b', 'c', 'd', 'a'])
  })
})
