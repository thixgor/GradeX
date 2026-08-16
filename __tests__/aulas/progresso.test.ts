import { describe, expect, it } from 'vitest'

import {
  PERCENTUAL_CONCLUSAO_PADRAO,
  aplicarBatida,
  calcularPercentual,
  deveConcluir,
  formatarTempo,
  podeRetomar,
  resumirProgresso,
  type ProgressoDaAula,
} from '@/lib/aulas/progresso'

/**
 * O que estes testes protegem: a confiança do aluno no próprio progresso.
 *
 * Progresso errado é pior do que progresso nenhum. Uma barra que anda para trás
 * depois de rever um trecho, uma aula que "desconclui" sozinha, ou um
 * "continuar de 0:04" fazem a pessoa parar de confiar no que a tela diz — e aí
 * ela passa a controlar o estudo por fora da plataforma.
 */

function progresso(overrides: Partial<ProgressoDaAula> = {}): ProgressoDaAula {
  return {
    aulaId: 'a1',
    usuarioId: 'u1',
    posicaoSegundos: 0,
    duracaoSegundos: 0,
    percentual: 0,
    concluida: false,
    atualizadoEm: new Date(),
    ...overrides,
  }
}

describe('calcularPercentual', () => {
  it('calcula a fração assistida', () => {
    expect(calcularPercentual(300, 600)).toBe(50)
    expect(calcularPercentual(0, 600)).toBe(0)
  })

  it('não inventa percentual quando a duração é desconhecida', () => {
    // Um vídeo sem metadata carregado tem duração 0. Dividir por isso daria
    // Infinity e pintaria a barra cheia numa aula nunca aberta.
    expect(calcularPercentual(120, 0)).toBe(0)
    expect(calcularPercentual(120, NaN as any)).toBe(0)
  })

  it('nunca passa de 100, mesmo com posição além do fim', () => {
    expect(calcularPercentual(700, 600)).toBe(100)
  })

  it('trata posição negativa como início', () => {
    expect(calcularPercentual(-50, 600)).toBe(0)
  })
})

describe('deveConcluir', () => {
  it('conclui a partir do limite padrão', () => {
    expect(deveConcluir(PERCENTUAL_CONCLUSAO_PADRAO)).toBe(true)
    expect(deveConcluir(PERCENTUAL_CONCLUSAO_PADRAO - 1)).toBe(false)
  })

  it('respeita um limite definido pelo administrador', () => {
    expect(deveConcluir(80, 80)).toBe(true)
    expect(deveConcluir(79, 80)).toBe(false)
  })

  it('cai no padrão quando o limite é lixo', () => {
    expect(deveConcluir(95, 0)).toBe(true)
    expect(deveConcluir(95, NaN as any)).toBe(true)
  })
})

describe('aplicarBatida', () => {
  it('cria o progresso na primeira batida', () => {
    const novo = aplicarBatida(null, { posicaoSegundos: 120, duracaoSegundos: 600 })
    expect(novo.posicaoSegundos).toBe(120)
    expect(novo.percentual).toBe(20)
    expect(novo.concluida).toBe(false)
  })

  it('a barra não anda para trás quando o aluno revê um trecho', () => {
    const anterior = progresso({ posicaoSegundos: 540, duracaoSegundos: 600, percentual: 90 })
    const novo = aplicarBatida(anterior, { posicaoSegundos: 60, duracaoSegundos: 600 })
    // A posição volta (é onde ele está agora), mas o percentual guarda o maior
    // já alcançado — senão rever o início desfaz o estudo da pessoa.
    expect(novo.posicaoSegundos).toBe(60)
    expect(novo.percentual).toBe(90)
  })

  it('uma batida sem duração não apaga a duração já conhecida', () => {
    const anterior = progresso({ duracaoSegundos: 600, percentual: 50, posicaoSegundos: 300 })
    const novo = aplicarBatida(anterior, { posicaoSegundos: 360 })
    expect(novo.duracaoSegundos).toBe(600)
    expect(novo.percentual).toBe(60)
  })

  it('conclui sozinha ao cruzar o limite', () => {
    const novo = aplicarBatida(null, { posicaoSegundos: 570, duracaoSegundos: 600 })
    expect(novo.percentual).toBe(95)
    expect(novo.concluida).toBe(true)
    expect(novo.concluidaEm).toBeInstanceOf(Date)
  })

  it('aula concluída não desconclui ao ser reaberta no início', () => {
    const anterior = progresso({ concluida: true, percentual: 100, concluidaEm: new Date('2026-01-01') })
    const novo = aplicarBatida(anterior, { posicaoSegundos: 5, duracaoSegundos: 600 })
    expect(novo.concluida).toBe(true)
    // A data original é preservada: "concluí em janeiro" não vira "concluí hoje"
    // só porque a pessoa reabriu para revisar.
    expect(novo.concluidaEm).toEqual(new Date('2026-01-01'))
  })
})

describe('podeRetomar', () => {
  it('não oferece retomada de quem mal começou', () => {
    expect(podeRetomar(progresso({ posicaoSegundos: 4, duracaoSegundos: 600 }))).toBe(false)
  })

  it('oferece retomada no meio da aula', () => {
    expect(podeRetomar(progresso({ posicaoSegundos: 300, duracaoSegundos: 600 }))).toBe(true)
  })

  it('não oferece retomada nos créditos', () => {
    // Retomar aos 9:55 de um vídeo de 10:00 joga a pessoa no fim. Ali o próximo
    // passo é a aula seguinte.
    expect(podeRetomar(progresso({ posicaoSegundos: 595, duracaoSegundos: 600 }))).toBe(false)
  })

  it('não oferece retomada de aula concluída', () => {
    expect(podeRetomar(progresso({ posicaoSegundos: 300, duracaoSegundos: 600, concluida: true }))).toBe(false)
  })

  it('lida com ausência de progresso', () => {
    expect(podeRetomar(null)).toBe(false)
  })
})

describe('formatarTempo', () => {
  it('formata minutos e segundos', () => {
    expect(formatarTempo(1122)).toBe('18:42')
    expect(formatarTempo(65)).toBe('1:05')
  })

  it('só mostra horas quando existem', () => {
    expect(formatarTempo(3903)).toBe('1:05:03')
    expect(formatarTempo(59)).toBe('0:59')
  })

  it('não quebra com lixo', () => {
    expect(formatarTempo(-10)).toBe('0:00')
    expect(formatarTempo(NaN)).toBe('0:00')
  })
})

describe('resumirProgresso', () => {
  const aulas = ['a1', 'a2', 'a3', 'a4']

  it('conta concluídas e calcula o percentual do curso', () => {
    const mapa = new Map([
      ['a1', { concluida: true, percentual: 100 }],
      ['a2', { concluida: true, percentual: 100 }],
    ])
    const resumo = resumirProgresso(aulas, mapa)
    expect(resumo.concluidas).toBe(2)
    expect(resumo.total).toBe(4)
    expect(resumo.percentual).toBe(50)
  })

  it('a próxima aula é a que está no meio, não a próxima nunca aberta', () => {
    // Terminar o que se começou tem menos atrito do que começar outra coisa.
    const mapa = new Map([
      ['a1', { concluida: true, percentual: 100 }],
      ['a2', { concluida: false, percentual: 40 }],
    ])
    expect(resumirProgresso(aulas, mapa).proximaAulaId).toBe('a2')
  })

  it('sem nada em andamento, aponta a primeira não vista', () => {
    const mapa = new Map([['a1', { concluida: true, percentual: 100 }]])
    expect(resumirProgresso(aulas, mapa).proximaAulaId).toBe('a2')
  })

  it('curso terminado não empurra próxima aula', () => {
    const mapa = new Map(aulas.map((id) => [id, { concluida: true, percentual: 100 }]))
    const resumo = resumirProgresso(aulas, mapa)
    expect(resumo.percentual).toBe(100)
    expect(resumo.proximaAulaId).toBeNull()
  })

  it('curso vazio não divide por zero', () => {
    const resumo = resumirProgresso([], new Map())
    expect(resumo.percentual).toBe(0)
    expect(resumo.proximaAulaId).toBeNull()
  })
})
