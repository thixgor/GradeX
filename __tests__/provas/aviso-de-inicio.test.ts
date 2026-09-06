import { describe, expect, it } from 'vitest'
import {
  ALVO_DA_ASSINATURA,
  ALVO_DA_FRASE_TEMA,
  ALVO_DO_NOME,
  deveAvisarQueLiberou,
  estaEsperandoOInicio,
  pendenciaParaIniciar,
} from '@/lib/provas/aviso-de-inicio'

const esperando = {
  estavaEsperando: true,
  liberada: true,
  emAndamento: false,
  jaEntregou: false,
  jaAvisado: false,
}

const formularioCompleto = {
  exigeAssinatura: true,
  assinou: true,
  nome: 'Maria de Souza',
  fraseTema: null,
  transcricaoDaFrase: '',
  retomadaBloqueia: false,
}

describe('quem está esperando o início', () => {
  it('na sala de espera, com a prova ainda travada', () => {
    expect(
      estaEsperandoOInicio({ naSalaDeEspera: true, fase: 'sala-de-espera', liberada: false }),
    ).toBe(true)
  })

  it('na tela de entrada com o portão aberto — ela também é uma espera', () => {
    /*
     * Quem abre o endereço da prova e fica lendo os dados nunca clica em
     * "Entrar na Sala": para essa pessoa o botão vira "Iniciar Prova" sem
     * nenhum anúncio. É a mesma espera, na outra tela.
     */
    expect(
      estaEsperandoOInicio({ naSalaDeEspera: false, fase: 'sala-de-espera', liberada: false }),
    ).toBe(true)
  })

  it('quem já pode começar não está esperando nada', () => {
    expect(
      estaEsperandoOInicio({ naSalaDeEspera: true, fase: 'em-andamento', liberada: true }),
    ).toBe(false)
  })

  it('prova de treino (fase livre) não tem espera', () => {
    expect(estaEsperandoOInicio({ naSalaDeEspera: false, fase: 'livre', liberada: true })).toBe(false)
  })

  it('antes do portão abrir, na tela de entrada, ainda não é a sala de espera', () => {
    expect(
      estaEsperandoOInicio({ naSalaDeEspera: false, fase: 'antes-do-portao', liberada: false }),
    ).toBe(false)
  })
})

describe('quando o aviso de início aparece', () => {
  it('quem esperava e viu liberar recebe o aviso', () => {
    expect(deveAvisarQueLiberou(esperando)).toBe(true)
  })

  it('quem chega com a prova já em andamento não recebe nada', () => {
    /*
     * O aviso conta uma novidade. Para quem abriu a página depois do início não
     * houve transição nenhuma — e o modal seria só um obstáculo entre ela e o
     * botão.
     */
    expect(deveAvisarQueLiberou({ ...esperando, estavaEsperando: false })).toBe(false)
  })

  it('não volta depois de fechado', () => {
    // A janela é recalculada a cada segundo: sem esta trava o modal
    // reapareceria por cima da assinatura, da prova, do termo de monitoramento.
    expect(deveAvisarQueLiberou({ ...esperando, jaAvisado: true })).toBe(false)
  })

  it('não aparece antes de a prova liberar', () => {
    expect(deveAvisarQueLiberou({ ...esperando, liberada: false })).toBe(false)
  })

  it('não aparece para quem já está respondendo nem para quem já entregou', () => {
    expect(deveAvisarQueLiberou({ ...esperando, emAndamento: true })).toBe(false)
    expect(deveAvisarQueLiberou({ ...esperando, jaEntregou: true })).toBe(false)
  })
})

describe('o que falta para iniciar de dentro do aviso', () => {
  it('sem pendência, o aviso inicia a prova', () => {
    expect(pendenciaParaIniciar(formularioCompleto)).toBeNull()
  })

  it('a assinatura exigida vira um caminho até o campo, não um erro', () => {
    /*
     * `handleStartExam` recusa começar sem assinatura. Se o aviso oferecesse
     * "Iniciar" mesmo assim, o clique só devolveria uma mensagem — e o campo
     * continuaria fora da tela, que é o problema todo num tablet.
     */
    const pendencia = pendenciaParaIniciar({ ...formularioCompleto, assinou: false })
    expect(pendencia?.motivo).toBe('assinatura')
    expect(pendencia?.alvo).toBe(ALVO_DA_ASSINATURA)
  })

  it('assinatura opcional não bloqueia', () => {
    expect(
      pendenciaParaIniciar({ ...formularioCompleto, exigeAssinatura: false, assinou: false }),
    ).toBeNull()
  })

  it('o nome vem antes da assinatura — é a ordem da tela', () => {
    const pendencia = pendenciaParaIniciar({ ...formularioCompleto, nome: '   ', assinou: false })
    expect(pendencia?.motivo).toBe('nome')
    expect(pendencia?.alvo).toBe(ALVO_DO_NOME)
  })

  it('a frase-tema só é exigida quando a prova tem uma', () => {
    expect(
      pendenciaParaIniciar({ ...formularioCompleto, fraseTema: 'A saúde é um direito', transcricaoDaFrase: '' })
        ?.alvo,
    ).toBe(ALVO_DA_FRASE_TEMA)
    expect(
      pendenciaParaIniciar({
        ...formularioCompleto,
        fraseTema: 'A saúde é um direito',
        transcricaoDaFrase: 'A saúde é um direito',
      }),
    ).toBeNull()
  })

  it('retomada esgotada vem antes de tudo: nenhum campo resolveria', () => {
    const pendencia = pendenciaParaIniciar({
      ...formularioCompleto,
      assinou: false,
      nome: '',
      retomadaBloqueia: true,
      mensagemDaRetomada: 'Você já usou sua retomada nesta prova.',
    })
    expect(pendencia?.motivo).toBe('retomada-esgotada')
    expect(pendencia?.alvo).toBeNull()
    expect(pendencia?.descricao).toBe('Você já usou sua retomada nesta prova.')
  })

  it('retomada esgotada sem mensagem do servidor ainda diz alguma coisa', () => {
    expect(
      pendenciaParaIniciar({ ...formularioCompleto, retomadaBloqueia: true, mensagemDaRetomada: '  ' })
        ?.descricao,
    ).toBe('Esta prova já foi iniciada e não pode ser reiniciada.')
  })
})
