import { describe, expect, it } from 'vitest'

import {
  agendarEnquantoVisivel,
  type AmbienteDeAgendamento,
} from '@/hooks/use-intervalo-visivel'

/**
 * Os painéis de admin se atualizavam sozinhos sem olhar se alguém estava
 * olhando. Uma aba de tickets esquecida aberta, com uma conversa selecionada,
 * batia no servidor a cada 10s indefinidamente — mais de onze mil requisições
 * por dia, de madrugada e no fim de semana inclusive.
 *
 * O que estes testes fixam é a política inteira: parar de verdade quando a aba
 * sai de vista, voltar já atualizado (sem esperar um ciclo), não acumular
 * relógios, e não deixar nada ligado ao desmontar.
 */

/** Aba de mentira, com relógio controlado à mão. */
function ambienteFalso(comecaVisivel = true) {
  let visivel = comecaVisivel
  const ouvintes = new Set<() => void>()
  const relogios = new Map<number, { acao: () => void; intervaloMs: number }>()
  let proximoId = 1

  const ambiente: AmbienteDeAgendamento = {
    visivel: () => visivel,
    ouvirVisibilidade: (ouvinte) => {
      ouvintes.add(ouvinte)
      return () => ouvintes.delete(ouvinte)
    },
    agendar: (acao, intervaloMs) => {
      const id = proximoId++
      relogios.set(id, { acao, intervaloMs })
      return id
    },
    cancelar: (id) => {
      relogios.delete(id)
    },
  }

  return {
    ambiente,
    /** Quantos relógios estão ligados agora. */
    relogiosLigados: () => relogios.size,
    /** Faz o tempo passar: uma volta de cada relógio ligado. */
    tique: (voltas = 1) => {
      for (let i = 0; i < voltas; i += 1) {
        for (const { acao } of Array.from(relogios.values())) acao()
      }
    },
    esconder: () => {
      visivel = false
      for (const ouvinte of Array.from(ouvintes)) ouvinte()
    },
    mostrar: () => {
      visivel = true
      for (const ouvinte of Array.from(ouvintes)) ouvinte()
    },
    ouvintesRegistrados: () => ouvintes.size,
  }
}

describe('agendamento que respeita a visibilidade da aba', () => {
  it('com a aba visível, repete no intervalo pedido', () => {
    const aba = ambienteFalso()
    let chamadas = 0

    agendarEnquantoVisivel(() => { chamadas += 1 }, 10_000, aba.ambiente)

    expect(aba.relogiosLigados()).toBe(1)
    aba.tique(3)
    expect(chamadas).toBe(3)
  })

  it('com a aba escondida, o relógio é desligado — não apenas ignorado', () => {
    const aba = ambienteFalso()
    let chamadas = 0

    agendarEnquantoVisivel(() => { chamadas += 1 }, 10_000, aba.ambiente)
    aba.tique(2)
    expect(chamadas).toBe(2)

    aba.esconder()

    // O ponto do conserto: nada de relógio vivo no fundo.
    expect(aba.relogiosLigados()).toBe(0)
    aba.tique(100)
    expect(chamadas).toBe(2)
  })

  it('ao voltar, atualiza na hora e volta a repetir', () => {
    const aba = ambienteFalso()
    let chamadas = 0

    agendarEnquantoVisivel(() => { chamadas += 1 }, 10_000, aba.ambiente)
    aba.esconder()
    aba.tique(50)
    expect(chamadas).toBe(0)

    aba.mostrar()

    // Quem volta para a aba encontra o painel já atualizado, sem esperar
    // o próximo ciclo — fica mais fresco do que antes, gastando menos.
    expect(chamadas).toBe(1)
    expect(aba.relogiosLigados()).toBe(1)
    aba.tique(2)
    expect(chamadas).toBe(3)
  })

  it('nasce parado quando a aba já está escondida', () => {
    const aba = ambienteFalso(false)
    let chamadas = 0

    agendarEnquantoVisivel(() => { chamadas += 1 }, 10_000, aba.ambiente)

    expect(aba.relogiosLigados()).toBe(0)
    aba.tique(10)
    expect(chamadas).toBe(0)
  })

  it('esconder e mostrar várias vezes não acumula relógios', () => {
    const aba = ambienteFalso()
    let chamadas = 0

    agendarEnquantoVisivel(() => { chamadas += 1 }, 10_000, aba.ambiente)

    for (let i = 0; i < 5; i += 1) {
      aba.esconder()
      aba.mostrar()
    }

    // Um relógio, não seis. Sem isto, cada ida e volta dobraria o gasto.
    expect(aba.relogiosLigados()).toBe(1)

    const antes = chamadas
    aba.tique(1)
    expect(chamadas).toBe(antes + 1)
  })

  it('duas visibilidades seguidas iguais não ligam um segundo relógio', () => {
    const aba = ambienteFalso()
    agendarEnquantoVisivel(() => {}, 10_000, aba.ambiente)

    aba.mostrar()
    aba.mostrar()

    expect(aba.relogiosLigados()).toBe(1)
  })

  it('desfazer para o relógio e solta o ouvinte', () => {
    const aba = ambienteFalso()
    let chamadas = 0

    const desfazer = agendarEnquantoVisivel(() => { chamadas += 1 }, 10_000, aba.ambiente)
    expect(aba.ouvintesRegistrados()).toBe(1)

    desfazer()

    expect(aba.relogiosLigados()).toBe(0)
    expect(aba.ouvintesRegistrados()).toBe(0)
    aba.tique(10)
    expect(chamadas).toBe(0)

    // E uma mudança de visibilidade depois do desmonte não ressuscita nada.
    aba.mostrar()
    expect(aba.relogiosLigados()).toBe(0)
    expect(chamadas).toBe(0)
  })
})
