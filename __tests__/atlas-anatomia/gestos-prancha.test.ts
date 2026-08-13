import { describe, expect, it } from 'vitest'
import {
  criarControladorDeGestos,
  limitarTransformacao,
  TRANSFORMACAO_INICIAL,
  ZOOM_MAX,
  type Ajuste,
  type Transformacao,
} from '@/lib/anatomia/gestos-prancha'

const MOLDURA = { largura: 400, altura: 400 }

describe('gestos da prancha', () => {
  it('mantém escala e deslocamento dentro dos limites da moldura', () => {
    expect(limitarTransformacao({ escala: 99, x: 0, y: 0 }).escala).toBe(ZOOM_MAX)
    expect(limitarTransformacao({ escala: 0.1, x: 0, y: 0 }).escala).toBe(1)

    // Em escala 1 não há excedente: o deslocamento é zerado.
    expect(limitarTransformacao({ escala: 1, x: 50, y: -50 })).toEqual({ escala: 1, x: 0, y: 0 })

    // Em escala 3 sobram 200% de moldura, 100% para cada lado.
    expect(limitarTransformacao({ escala: 3, x: 500, y: -500 })).toEqual({ escala: 3, x: 100, y: -100 })
  })

  it('não deixa um valor inválido virar transformação quebrada', () => {
    expect(limitarTransformacao({ escala: NaN, x: NaN, y: NaN })).toEqual({ escala: 1, x: 0, y: 0 })
  })

  it('aproxima e afasta conforme os dedos se separam', () => {
    const gestos = criarControladorDeGestos()

    expect(gestos.pressionar({ id: 1, x: 100, y: 200 }, TRANSFORMACAO_INICIAL)).toBe('nada')
    expect(gestos.pressionar({ id: 2, x: 200, y: 200 }, TRANSFORMACAO_INICIAL)).toBe('pinca')

    // Dobrar a distância entre os dedos dobra a escala.
    const ajuste = gestos.mover({ id: 2, x: 300, y: 200 }, MOLDURA)
    expect(ajuste).toBeTruthy()
    expect(ajuste!(TRANSFORMACAO_INICIAL).escala).toBeCloseTo(2, 5)

    // Aproximar de volta devolve a escala original.
    const devolta = gestos.mover({ id: 2, x: 200, y: 200 }, MOLDURA)
    expect(devolta!(TRANSFORMACAO_INICIAL).escala).toBeCloseTo(1, 5)
  })

  /**
   * A regressão que motivou este módulo.
   *
   * O React processa `pointermove` em lote e executa os updaters depois do
   * evento. Se o ajuste olhar para o estado interno do gesto na hora de rodar,
   * um dedo que saiu no meio do lote deixa esse estado nulo — e o updater
   * explode dentro do render, derrubando a página com "client-side exception".
   *
   * O contrato aqui é que o ajuste devolvido não dependa de nada que possa
   * mudar depois: executá-lo antes ou depois do gesto terminar dá o mesmo
   * resultado, e nunca lança.
   */
  it('devolve ajustes que sobrevivem ao fim do gesto', () => {
    const gestos = criarControladorDeGestos()
    gestos.pressionar({ id: 1, x: 100, y: 200 }, TRANSFORMACAO_INICIAL)
    gestos.pressionar({ id: 2, x: 200, y: 200 }, TRANSFORMACAO_INICIAL)

    // Rajada de movimentos, como o React enfileiraria num único lote.
    const fila: Ajuste[] = []
    for (let x = 220; x <= 400; x += 20) {
      const ajuste = gestos.mover({ id: 2, x, y: 200 }, MOLDURA)
      if (ajuste) fila.push(ajuste)
    }
    expect(fila.length).toBeGreaterThan(4)

    // Os dois dedos saem antes de a fila ser processada.
    gestos.soltar({ id: 2 }, TRANSFORMACAO_INICIAL)
    gestos.soltar({ id: 1 }, TRANSFORMACAO_INICIAL)

    let estado: Transformacao = TRANSFORMACAO_INICIAL
    expect(() => {
      for (const ajuste of fila) estado = ajuste(estado)
    }).not.toThrow()

    // E o resultado é o mesmo que teria saído se rodasse na hora.
    expect(estado.escala).toBeCloseTo(3, 5)
  })

  it('reancora o arraste quando um dedo sai no meio da pinça', () => {
    const gestos = criarControladorDeGestos()
    const ampliada: Transformacao = { escala: 3, x: 0, y: 0 }

    gestos.pressionar({ id: 1, x: 100, y: 200 }, ampliada)
    gestos.pressionar({ id: 2, x: 200, y: 200 }, ampliada)

    // Sai o dedo 2; o dedo 1 assume o arraste a partir de onde está.
    expect(gestos.soltar({ id: 2 }, ampliada)).toBe('arraste')

    // Mover o dedo restante desloca em relação à posição dele naquele momento,
    // e não à posição em que ele tocou a tela — senão a peça salta.
    const ajuste = gestos.mover({ id: 1, x: 140, y: 200 }, MOLDURA)
    expect(ajuste!(ampliada).x).toBeCloseTo(10, 5)
  })

  it('não arrasta sem zoom e encerra quando o último dedo sai', () => {
    const gestos = criarControladorDeGestos()

    // Em escala 1 a peça preenche a moldura: não há para onde arrastar.
    expect(gestos.pressionar({ id: 1, x: 10, y: 10 }, TRANSFORMACAO_INICIAL)).toBe('nada')
    expect(gestos.mover({ id: 1, x: 90, y: 90 }, MOLDURA)).toBeNull()
    expect(gestos.soltar({ id: 1 }, TRANSFORMACAO_INICIAL)).toBe('fim')
    expect(gestos.ponteirosAtivos()).toBe(0)

    // Com zoom, o mesmo gesto arrasta.
    const ampliada: Transformacao = { escala: 2, x: 0, y: 0 }
    expect(gestos.pressionar({ id: 1, x: 10, y: 10 }, ampliada)).toBe('arraste')
    expect(gestos.mover({ id: 1, x: 90, y: 10 }, MOLDURA)!(ampliada).x).toBeCloseTo(20, 5)
  })

  it('ignora ponteiro desconhecido e limpa tudo ao trocar de prancha', () => {
    const gestos = criarControladorDeGestos()
    expect(gestos.mover({ id: 42, x: 0, y: 0 }, MOLDURA)).toBeNull()

    gestos.pressionar({ id: 1, x: 0, y: 0 }, { escala: 2, x: 0, y: 0 })
    gestos.cancelarTudo()
    expect(gestos.ponteirosAtivos()).toBe(0)
    expect(gestos.mover({ id: 1, x: 50, y: 50 }, MOLDURA)).toBeNull()
  })
})
