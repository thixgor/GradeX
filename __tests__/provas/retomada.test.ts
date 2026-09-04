import { describe, expect, it } from 'vitest'
import {
  RETOMADAS_PERMITIDAS,
  avaliarRetomada,
  contarRespondidas,
  mesclarRespostas,
} from '@/lib/provas/retomada'
import type { UserAnswer } from '@/lib/types'

function entrada(campos: Partial<Parameters<typeof avaliarRetomada>[0]> = {}) {
  return {
    progresso: { resumesUsed: 0 },
    jaEntregou: false,
    janelaAberta: true,
    respostasGravadas: 8,
    ...campos,
  }
}

describe('avaliarRetomada', () => {
  it('quem caiu pela primeira vez pode continuar', () => {
    const v = avaliarRetomada(entrada())
    expect(v.podeRetomar).toBe(true)
    expect(v.retomadasRestantes).toBe(RETOMADAS_PERMITIDAS)
  })

  it('a segunda queda não devolve a prova, mas o que estava salvo continua entregável', () => {
    const v = avaliarRetomada(entrada({ progresso: { resumesUsed: 1 } }))
    expect(v.podeRetomar).toBe(false)
    expect(v.retomadasRestantes).toBe(0)
    expect(v.podeEntregarOSalvo).toBe(true)
    expect(v.motivo).toBe('retomadas-esgotadas')
  })

  it('sem nada gravado, não há o que entregar', () => {
    const v = avaliarRetomada(entrada({ progresso: { resumesUsed: 1 }, respostasGravadas: 0 }))
    expect(v.podeEntregarOSalvo).toBe(false)
  })

  it('a prova encerrada fecha a retomada — o portão não é contornável', () => {
    const v = avaliarRetomada(entrada({ janelaAberta: false, jaEncerrou: true }))
    expect(v.podeRetomar).toBe(false)
    expect(v.podeEntregarOSalvo).toBe(false)
    expect(v.motivo).toBe('prova-encerrada')
    expect(v.mensagem).toMatch(/já terminou/)
  })

  it('antes do início a prova NÃO terminou — e o aviso não pode dizer que sim', () => {
    /*
     * `janelaAberta` é falso nos dois extremos, e o veredito tratava os dois
     * como o mesmo. Quem abria a prova antes de ela começar (o admin corrigiu
     * o horário, ou mandou o começo para trás e voltou) lia "A prova já
     * terminou" com o portão ainda fechado — sobre uma prova que ia acontecer
     * dali a pouco.
     */
    const v = avaliarRetomada(entrada({ janelaAberta: false, jaEncerrou: false }))
    expect(v.motivo).toBe('prova-nao-comecou')
    expect(v.mensagem).toMatch(/ainda não começou/)
    expect(v.mensagem).not.toMatch(/terminou/)
    expect(v.podeRetomar).toBe(false)
  })

  it('sem `jaEncerrou`, o veredito antigo continua valendo', () => {
    const v = avaliarRetomada(entrada({ janelaAberta: false }))
    expect(v.motivo).toBe('prova-encerrada')
  })

  it('prova encerrada vence a retomada disponível', () => {
    const v = avaliarRetomada(entrada({ janelaAberta: false, progresso: { resumesUsed: 0 } }))
    expect(v.podeRetomar).toBe(false)
  })

  it('quem já entregou não retoma', () => {
    const v = avaliarRetomada(entrada({ jaEntregou: true }))
    expect(v.podeRetomar).toBe(false)
    expect(v.motivo).toBe('ja-entregou')
  })

  it('sem progresso gravado não há retomada nem aviso', () => {
    const v = avaliarRetomada(entrada({ progresso: null }))
    expect(v.temProgresso).toBe(false)
    expect(v.podeRetomar).toBe(false)
    expect(v.mensagem).toBeNull()
  })
})

describe('mesclarRespostas', () => {
  const esqueleto: UserAnswer[] = [
    { questionId: 'q1', selectedAlternative: '', crossedAlternatives: [] },
    { questionId: 'q2', discursiveText: '' },
    { questionId: 'q3', selectedAlternative: '' },
  ]

  it('devolve o que foi respondido, na forma do esqueleto', () => {
    const mesclado = mesclarRespostas(esqueleto, [
      { questionId: 'q2', discursiveText: 'resposta longa' },
      { questionId: 'q1', selectedAlternative: 'alt-b' },
    ])
    expect(mesclado.map((a) => a.questionId)).toEqual(['q1', 'q2', 'q3'])
    expect(mesclado[0].selectedAlternative).toBe('alt-b')
    expect(mesclado[1].discursiveText).toBe('resposta longa')
    expect(mesclado[2].selectedAlternative).toBe('')
  })

  it('questão que saiu da prova é descartada em silêncio', () => {
    const mesclado = mesclarRespostas(esqueleto, [{ questionId: 'apagada', selectedAlternative: 'x' }])
    expect(mesclado).toHaveLength(3)
    expect(mesclado.some((a) => a.questionId === 'apagada')).toBe(false)
  })

  it('sem progresso, o esqueleto passa intacto', () => {
    expect(mesclarRespostas(esqueleto, null)).toEqual(esqueleto)
  })
})

describe('contarRespondidas', () => {
  it('conta só o que tem conteúdo de verdade', () => {
    expect(
      contarRespondidas([
        { questionId: 'a', selectedAlternative: 'x' },
        { questionId: 'b', selectedAlternative: '' },
        { questionId: 'c', discursiveText: '   ' },
        { questionId: 'd', discursiveText: 'texto' },
        { questionId: 'e', essayText: 'redação' },
        { questionId: 'f', discursiveSelfScore: 0 },
      ]),
    ).toBe(4)
  })
})
