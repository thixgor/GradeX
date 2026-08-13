/**
 * Gestos do visualizador de prancha: pinça, arraste e limites de zoom.
 *
 * Vive fora do componente por um motivo concreto. A versão anterior guardava o
 * estado do gesto em refs e lia essas refs *dentro* do updater do `setState`:
 *
 *     setTransformacao(atual => limitar({ ...atual, escala: gesto.current!.escala * fator }))
 *
 * O React processa as atualizações de `pointermove` em lote e executa o updater
 * depois do evento. Num gesto real, a 120 Hz, vários `pointermove` entram no
 * mesmo lote — e basta um dedo sair antes do lote ser processado para que
 * `gesto.current` já seja `null` quando o updater roda. Resultado: exceção de
 * cliente no meio da pinça, justamente no celular, que é onde a pinça existe.
 *
 * A regra aqui é estrutural: `mover` devolve uma função que só depende de
 * números capturados no momento do gesto. Depois de criada, ela pode ser
 * executada a qualquer tempo — inclusive depois do gesto ter acabado — que o
 * resultado é o mesmo e nada pode ser nulo.
 */

export interface Transformacao {
  escala: number
  /** Deslocamento horizontal em % da moldura. */
  x: number
  /** Deslocamento vertical em % da moldura. */
  y: number
}

export const TRANSFORMACAO_INICIAL: Transformacao = { escala: 1, x: 0, y: 0 }

export const ZOOM_MIN = 1
export const ZOOM_MAX = 6
export const ZOOM_PASSO = 0.4

/**
 * Mantém a escala na faixa e o deslocamento dentro do que sobra da moldura.
 * Em escala 1 não há para onde arrastar; acima disso, o limite é metade do
 * excedente, para a peça nunca sair de vista.
 */
export function limitarTransformacao(valor: Transformacao): Transformacao {
  const escala = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number.isFinite(valor.escala) ? valor.escala : 1))
  const limite = ((escala - 1) / 2) * 100
  const x = Number.isFinite(valor.x) ? valor.x : 0
  const y = Number.isFinite(valor.y) ? valor.y : 0

  return {
    escala,
    x: escala === 1 ? 0 : Math.min(limite, Math.max(-limite, x)),
    y: escala === 1 ? 0 : Math.min(limite, Math.max(-limite, y)),
  }
}

export interface Ponteiro {
  id: number
  x: number
  y: number
}

export interface Moldura {
  largura: number
  altura: number
}

/** O que o componente precisa fazer depois de cada evento. */
export type ReacaoAoPressionar = 'pinca' | 'arraste' | 'nada'
export type ReacaoAoSoltar = 'fim' | 'arraste' | 'segue'

/** Transformação seguinte, calculada só a partir do que já foi capturado. */
export type Ajuste = (atual: Transformacao) => Transformacao

export interface ControladorDeGestos {
  ponteirosAtivos(): number
  pressionar(ponteiro: Ponteiro, atual: Transformacao): ReacaoAoPressionar
  mover(ponteiro: Ponteiro, moldura: Moldura): Ajuste | null
  soltar(ponteiro: Pick<Ponteiro, 'id'>, atual: Transformacao): ReacaoAoSoltar
  cancelarTudo(): void
}

export function criarControladorDeGestos(): ControladorDeGestos {
  const ponteiros = new Map<number, { x: number; y: number }>()
  let pinca: { distancia: number; escala: number } | null = null
  let arraste: { x: number; y: number; origemX: number; origemY: number } | null = null

  function distanciaEntreOsDois() {
    const [a, b] = [...ponteiros.values()]
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  return {
    ponteirosAtivos: () => ponteiros.size,

    pressionar(ponteiro, atual) {
      ponteiros.set(ponteiro.id, { x: ponteiro.x, y: ponteiro.y })

      if (ponteiros.size === 2) {
        pinca = { distancia: distanciaEntreOsDois(), escala: atual.escala }
        // O arraste sai de cena enquanto há dois dedos: quem manda é a pinça.
        arraste = null
        return 'pinca'
      }

      if (ponteiros.size > 2 || atual.escala === 1) return 'nada'

      arraste = { x: ponteiro.x, y: ponteiro.y, origemX: atual.x, origemY: atual.y }
      return 'arraste'
    },

    mover(ponteiro, moldura) {
      if (!ponteiros.has(ponteiro.id)) return null
      ponteiros.set(ponteiro.id, { x: ponteiro.x, y: ponteiro.y })

      if (ponteiros.size === 2 && pinca) {
        // Escala resolvida agora, com números; o ajuste devolvido não volta a
        // olhar para `pinca`, que pode já ter sido descartado quando ele rodar.
        const fator = distanciaEntreOsDois() / (pinca.distancia || 1)
        const escala = pinca.escala * fator
        return atual => limitarTransformacao({ ...atual, escala })
      }

      if (ponteiros.size !== 1 || !arraste) return null

      const deslocamentoX = ((ponteiro.x - arraste.x) / (moldura.largura || 1)) * 100
      const deslocamentoY = ((ponteiro.y - arraste.y) / (moldura.altura || 1)) * 100
      const x = arraste.origemX + deslocamentoX
      const y = arraste.origemY + deslocamentoY
      return atual => limitarTransformacao({ ...atual, x, y })
    },

    soltar(ponteiro, atual) {
      ponteiros.delete(ponteiro.id)
      if (ponteiros.size < 2) pinca = null

      if (ponteiros.size === 1) {
        // Um dedo saiu no meio da pinça. O que ficou vira a nova origem do
        // arraste — sem isso, a peça salta assim que o dedo restante se move.
        const [restante] = [...ponteiros.values()]
        arraste = { x: restante.x, y: restante.y, origemX: atual.x, origemY: atual.y }
        return atual.escala > 1 ? 'arraste' : 'segue'
      }

      if (ponteiros.size === 0) {
        arraste = null
        return 'fim'
      }

      return 'segue'
    },

    cancelarTudo() {
      ponteiros.clear()
      pinca = null
      arraste = null
    },
  }
}
