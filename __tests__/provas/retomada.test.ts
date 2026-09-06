import { describe, expect, it } from 'vitest'
import {
  RETOMADAS_PERMITIDAS,
  avaliarRetomada,
  contarRespondidas,
  exigeEntregaAutomatica,
  inicioBloqueadoPorProgresso,
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

const esgotada = () => avaliarRetomada(entrada({ progresso: { resumesUsed: RETOMADAS_PERMITIDAS } }))

describe('exigeEntregaAutomatica', () => {
  it('entrega sozinha quando a retomada acabou e há o que entregar', () => {
    /*
     * Quem caiu duas vezes — conexão do celular, bateria, aba descartada — é
     * justamente quem pode não voltar para clicar em "entregar". Sem isto, o
     * rascunho esperava um gesto que talvez nunca acontecesse e a prova
     * terminava zerada com as respostas guardadas no banco.
     */
    const veredito = esgotada()
    expect(veredito.podeRetomar).toBe(false)
    expect(veredito.podeEntregarOSalvo).toBe(true)
    expect(exigeEntregaAutomatica(veredito)).toBe(true)
  })

  it('não entrega nada quando não há resposta gravada', () => {
    const semRespostas = avaliarRetomada(
      entrada({ progresso: { resumesUsed: RETOMADAS_PERMITIDAS }, respostasGravadas: 0 }),
    )
    expect(exigeEntregaAutomatica(semRespostas)).toBe(false)
  })

  it('não se intromete em quem ainda pode continuar', () => {
    expect(exigeEntregaAutomatica(avaliarRetomada(entrada()))).toBe(false)
  })

  it('não reentrega o que já foi entregue', () => {
    expect(exigeEntregaAutomatica(avaliarRetomada(entrada({ jaEntregou: true })))).toBe(false)
  })

  it('prova encerrada não dispara entrega: a janela fechou para enviar', () => {
    // O servidor recusaria a entrega, e insistir viraria um erro na cara de
    // quem só abriu a tela para ver o que tinha ficado.
    const encerrada = avaliarRetomada(entrada({ janelaAberta: false, jaEncerrou: true }))
    expect(exigeEntregaAutomatica(encerrada)).toBe(false)
  })
})

describe('inicioBloqueadoPorProgresso', () => {
  it('não deixa começar do zero por cima de um rascunho que não pode ser retomado', () => {
    /*
     * O botão "Iniciar Prova" olhava só a janela e a assinatura. Quem tinha
     * esgotado a retomada lia "Você já usou a sua única retomada" e, logo
     * abaixo, um botão que recomeçava a prova — e a gravação automática
     * seguinte passava por cima do rascunho com o estado vazio.
     */
    expect(inicioBloqueadoPorProgresso(esgotada())).toBe(true)
  })

  it('quem ainda pode retomar não fica travado', () => {
    expect(inicioBloqueadoPorProgresso(avaliarRetomada(entrada()))).toBe(false)
  })

  it('sem progresso nenhum, a prova começa normalmente', () => {
    const semNada = avaliarRetomada(entrada({ progresso: null }))
    expect(inicioBloqueadoPorProgresso(semNada)).toBe(false)
  })

  it('quem já entregou é caso do modal de prova finalizada, não deste bloqueio', () => {
    expect(inicioBloqueadoPorProgresso(avaliarRetomada(entrada({ jaEntregou: true })))).toBe(false)
  })

  it('aceita veredito ausente (a tela ainda não carregou)', () => {
    expect(inicioBloqueadoPorProgresso(null)).toBe(false)
    expect(inicioBloqueadoPorProgresso(undefined)).toBe(false)
  })
})

