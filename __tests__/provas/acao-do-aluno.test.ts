import { describe, expect, it } from 'vitest'
import { resolverAcaoDoAluno } from '@/lib/provas/acao-do-aluno'
import { RETOMADAS_PERMITIDAS } from '@/lib/provas/retomada'

/*
 * Os horários do caso relatado: prova 01:23–02:43, portão fecha 02:08.
 * "Agora" são 02:28 — portão fechado há vinte minutos, prova ainda aberta.
 */
const prova = {
  startTime: new Date('2026-09-06T01:23:00-03:00'),
  gatesOpen: new Date('2026-09-06T01:23:00-03:00'),
  gatesClose: new Date('2026-09-06T02:08:00-03:00'),
  endTime: new Date('2026-09-06T02:43:00-03:00'),
} as any

const AGORA = new Date('2026-09-06T02:28:00-03:00')
const DEPOIS_DO_FIM = new Date('2026-09-06T03:00:00-03:00')
const ANTES_DE_ABRIR = new Date('2026-09-06T01:00:00-03:00')

describe('o caso que motivou este arquivo', () => {
  it('entrou, saiu, entrou, esgotou a retomada: a prova acabou para ele', () => {
    /*
     * A janela diz "em andamento" — ele passou pelo portão a tempo, e o portão
     * fechado é um fato sobre os outros. O cartão dizia "Disponível" e
     * oferecia "Realizar Prova" para quem já não tinha o que realizar.
     */
    const v = resolverAcaoDoAluno(
      prova,
      { jaEntrou: true, temRascunho: true, retomadasUsadas: RETOMADAS_PERMITIDAS },
      AGORA,
    )
    expect(v.acao).toBe('ver-resultado')
    expect(v.encerradaParaMim).toBe(true)
    expect(v.detalhe).toContain('não tinha mais retomadas')
  })

  it('quem ainda tem retomada volta para a prova, e sabe que o portão fechou', () => {
    const v = resolverAcaoDoAluno(prova, { jaEntrou: true, temRascunho: true, retomadasUsadas: 0 }, AGORA)
    expect(v.acao).toBe('retomar')
    expect(v.rotulo).toBe('Retomar prova')
    // A frase importa: é a diferença entre "posso sair e voltar" e "esta é a
    // minha última entrada".
    expect(v.portaoFechado).toBe(true)
    expect(v.detalhe).toContain('entrou a tempo')
  })

  it('quem entrou e não começou nada faz a prova normalmente', () => {
    const v = resolverAcaoDoAluno(prova, { jaEntrou: true }, AGORA)
    expect(v.acao).toBe('fazer')
    expect(v.rotulo).toBe('Realizar prova')
    expect(v.clicavel).toBe(true)
  })

  it('quem NÃO passou pelo portão fica de fora', () => {
    const v = resolverAcaoDoAluno(prova, { jaEntrou: false }, AGORA)
    expect(v.acao).toBe('indisponivel')
    expect(v.clicavel).toBe(false)
    expect(v.portaoFechado).toBe(true)
  })
})

describe('quem já entregou', () => {
  it('vê o resultado, não um botão de fazer', () => {
    const v = resolverAcaoDoAluno(prova, { jaEntrou: true, jaEntregou: true }, AGORA)
    expect(v.acao).toBe('ver-resultado')
    expect(v.detalhe).toContain('já entregou')
  })

  it('vale mesmo com a prova aberta para a turma', () => {
    expect(resolverAcaoDoAluno(prova, { jaEntregou: true }, AGORA).encerradaParaMim).toBe(true)
  })
})

describe('as outras fases', () => {
  it('antes do portão abrir, só resta aguardar', () => {
    const v = resolverAcaoDoAluno(prova, {}, ANTES_DE_ABRIR)
    expect(v.acao).toBe('aguardar')
    expect(v.clicavel).toBe(false)
  })

  it('prova encerrada leva ao resultado', () => {
    const v = resolverAcaoDoAluno(prova, { jaEntrou: true }, DEPOIS_DO_FIM)
    expect(v.acao).toBe('ver-resultado')
    expect(v.encerradaParaMim).toBe(true)
    // Encerrada não é "portão fechado": a prova acabou para todo mundo.
    expect(v.portaoFechado).toBe(false)
  })

  it('sala de espera: portão aberto e prova por começar', () => {
    const comSala = {
      ...prova,
      gatesOpen: new Date('2026-09-06T01:00:00-03:00'),
      startTime: new Date('2026-09-06T01:23:00-03:00'),
    }
    const v = resolverAcaoDoAluno(comSala, {}, new Date('2026-09-06T01:10:00-03:00'))
    expect(v.acao).toBe('entrar-na-sala')
    expect(v.rotulo).toBe('Entrar na sala')
  })

  it('quem já tem rascunho volta para a sala, em vez de "entrar"', () => {
    const comSala = {
      ...prova,
      gatesOpen: new Date('2026-09-06T01:00:00-03:00'),
    }
    const v = resolverAcaoDoAluno(comSala, { temRascunho: true }, new Date('2026-09-06T01:10:00-03:00'))
    expect(v.rotulo).toBe('Voltar para a sala')
  })
})

describe('prova de treino', () => {
  it('não tem portão nem retomada: entra e pratica', () => {
    const treino = { ...prova, isPracticeExam: true }
    const v = resolverAcaoDoAluno(treino, { temRascunho: true, retomadasUsadas: 99 }, DEPOIS_DO_FIM)
    expect(v.acao).toBe('praticar')
    expect(v.clicavel).toBe(true)
    expect(v.encerradaParaMim).toBe(false)
  })
})
