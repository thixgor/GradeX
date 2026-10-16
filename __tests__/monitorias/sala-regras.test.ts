import { describe, expect, it } from 'vitest'
import {
  avaliarAcessoSala,
  cadenciaDaSala,
  classificarAmostra,
  CONFIG_SALA_PADRAO,
  ESPERA_MAXIMA_SOZINHO_MS,
  janelaDaSala,
  nivelDeVideo,
  normalizarConfigSala,
  presente,
  proximaQualidade,
  salaCheia,
  situacaoDoTurn,
  statusHttpDaRecusa,
  ttlDoTurnSegundos,
  vagasMaximasPelaSala,
  BYTES_POR_GB,
  type EntradaDoAcesso,
} from '@/lib/monitorias/sala/regras'
import type { ParticipanteSala } from '@/lib/monitorias/tipos'

const inicio = new Date('2026-11-10T17:00:00Z')
const fim = new Date('2026-11-10T18:00:00Z')
const min = (n: number) => n * 60_000

function entrada(extra: Partial<EntradaDoAcesso> = {}): EntradaDoAcesso {
  return {
    ehMonitor: false,
    assento: { status: 'paga', ativo: true },
    status: 'confirmada',
    inicio,
    fim,
    agora: new Date(inicio.getTime() - min(5)),
    config: CONFIG_SALA_PADRAO,
    ...extra,
  }
}

describe('sala: janela de horário', () => {
  it('monitor abre 30 min antes, aluno 15; os dois fecham 30 min depois do fim', () => {
    expect(janelaDaSala(inicio, fim, 'monitor').abreEm.getTime()).toBe(inicio.getTime() - min(30))
    expect(janelaDaSala(inicio, fim, 'aluno').abreEm.getTime()).toBe(inicio.getTime() - min(15))
    expect(janelaDaSala(inicio, fim, 'aluno').fechaEm.getTime()).toBe(fim.getTime() + min(30))
  })

  it('aluno 20 min antes ainda não entra; monitor entra', () => {
    const agora = new Date(inicio.getTime() - min(20))
    const aluno = avaliarAcessoSala(entrada({ agora }))
    expect(aluno.ok).toBe(false)
    expect(!aluno.ok && aluno.motivo).toBe('nao_abriu')
    expect(avaliarAcessoSala(entrada({ agora, ehMonitor: true, assento: null })).ok).toBe(true)
  })

  it('bordas: abre exatamente no minuto e fecha depois da folga', () => {
    expect(avaliarAcessoSala(entrada({ agora: new Date(inicio.getTime() - min(15)) })).ok).toBe(true)
    expect(avaliarAcessoSala(entrada({ agora: new Date(fim.getTime() + min(30)) })).ok).toBe(true)
    const depois = avaliarAcessoSala(entrada({ agora: new Date(fim.getTime() + min(30) + 1) }))
    expect(!depois.ok && depois.motivo).toBe('fechada')
  })
})

describe('sala: quem entra', () => {
  it('estranho (sem assento) recebe 404, sem confirmar que a reserva existe', () => {
    const r = avaliarAcessoSala(entrada({ assento: null }))
    expect(!r.ok && r.motivo).toBe('sem_acesso')
    expect(statusHttpDaRecusa('sem_acesso')).toBe(404)
  })

  it('assento sem aula (aguardando pagamento, reembolsado, saindo) não entra', () => {
    for (const status of ['aguardando_pagamento', 'aguardando_assinatura', 'reembolsada', 'cancelada', 'expirada']) {
      expect(avaliarAcessoSala(entrada({ assento: { status, ativo: true } })).ok).toBe(false)
    }
    // Reembolso integral em andamento: papelNaReserva já devolve nulo (ativo=false).
    expect(avaliarAcessoSala(entrada({ assento: { status: 'reembolso_processando', ativo: false } })).ok).toBe(false)
  })

  it('pago, grátis, concluído e reembolso parcial em andamento entram', () => {
    for (const status of ['paga', 'gratis', 'concluida', 'reembolso_processando']) {
      expect(avaliarAcessoSala(entrada({ assento: { status, ativo: true } })).ok).toBe(true)
    }
  })

  it('só monitorias confirmadas ou realizadas', () => {
    expect(avaliarAcessoSala(entrada({ status: 'realizada' })).ok).toBe(true)
    for (const status of ['aguardando_pagamento', 'cancelada_aluno', 'reembolsada', 'concluida'] as const) {
      const r = avaliarAcessoSala(entrada({ status }))
      expect(!r.ok && r.motivo).toBe('status')
    }
  })

  it('disputa aberta durante a aula entra; antes do início (pedido de cancelamento) não', () => {
    const durante = avaliarAcessoSala(entrada({ status: 'em_disputa', disputaEm: new Date(inicio.getTime() + min(16)), agora: new Date(inicio.getTime() + min(20)) }))
    expect(durante.ok).toBe(true)
    const antes = avaliarAcessoSala(entrada({ status: 'em_disputa', disputaEm: new Date(inicio.getTime() - min(60)) }))
    expect(!antes.ok && antes.motivo).toBe('status')
  })

  it('sala desligada pelo admin: 503 com mensagem', () => {
    const r = avaliarAcessoSala(entrada({ config: { ...CONFIG_SALA_PADRAO, salaNativaAtiva: false } }))
    expect(!r.ok && r.motivo).toBe('desligada')
    expect(statusHttpDaRecusa('desligada')).toBe(503)
  })

  it('aula encerrada pelo monitor: aluno não volta, monitor pode reabrir', () => {
    const encerradaEm = new Date(inicio.getTime() + min(50))
    const agora = new Date(inicio.getTime() + min(55))
    expect(avaliarAcessoSala(entrada({ encerradaEm, agora })).ok).toBe(false)
    expect(avaliarAcessoSala(entrada({ encerradaEm, agora, ehMonitor: true, assento: null })).ok).toBe(true)
  })

  it('sem horário definido não abre', () => {
    const r = avaliarAcessoSala(entrada({ inicio: null }))
    expect(!r.ok && r.motivo).toBe('sem_horario')
  })
})

describe('sala: presença e capacidade', () => {
  const agora = new Date('2026-11-10T17:10:00Z')
  const p = (vistoHaMs: number, conexao: string | null = 'cx'): ParticipanteSala => ({
    uid: 'u', papel: 'aluno', nome: 'Ana', conexao, epoca: 1, entrouEm: agora, vistoEm: new Date(agora.getTime() - vistoHaMs),
  })

  it('presença vence sem pulso e some com a saída', () => {
    expect(presente(p(10_000), agora)).toBe(true)
    expect(presente(p(80_000), agora)).toBe(false)
    expect(presente(p(10_000, null), agora)).toBe(false)
  })

  it('cheia conta os outros presentes, não a própria conexão antiga', () => {
    const participantes = { eu: p(1_000), a: p(1_000), b: p(1_000), c: p(1_000) }
    expect(salaCheia(participantes, 'eu', 4, agora)).toBe(false)
    expect(salaCheia({ ...participantes, d: p(1_000) }, 'eu', 4, agora)).toBe(true)
    expect(salaCheia({ ...participantes, d: p(200_000) }, 'eu', 4, agora)).toBe(false)
  })
})

describe('sala: configuração do admin', () => {
  it('registro vazio vira o padrão', () => {
    expect(normalizarConfigSala(undefined)).toEqual(CONFIG_SALA_PADRAO)
    expect(normalizarConfigSala('lixo')).toEqual(CONFIG_SALA_PADRAO)
  })

  it('cerca os limites e aceita teto nulo', () => {
    const c = normalizarConfigSala({ limiteMalha: 12, turnCorteAutomaticoPct: 400, turnOrcamentoGbMes: null, turnAtivo: false })
    expect(c.limiteMalha).toBe(4)
    expect(c.turnCorteAutomaticoPct).toBe(100)
    expect(c.turnOrcamentoGbMes).toBeNull()
    expect(c.turnAtivo).toBe(false)
    expect(normalizarConfigSala({ limiteMalha: 1 }).limiteMalha).toBe(2)
  })

  it('sem link externo, nova reserva não passa do que a malha comporta', () => {
    expect(vagasMaximasPelaSala({ ...CONFIG_SALA_PADRAO, linkExternoPermitido: false, limiteMalha: 4 })).toBe(3)
    expect(vagasMaximasPelaSala({ ...CONFIG_SALA_PADRAO, linkExternoPermitido: true })).toBeNull()
  })
})

describe('sala: TURN', () => {
  it('desligado, sem credenciais ou no teto: não entrega', () => {
    const base = { config: CONFIG_SALA_PADRAO, configurado: true, bytesNoMes: 0 }
    expect(situacaoDoTurn(base)).toBe('ativo')
    expect(situacaoDoTurn({ ...base, config: { ...CONFIG_SALA_PADRAO, turnAtivo: false } })).toBe('desligado')
    expect(situacaoDoTurn({ ...base, configurado: false })).toBe('sem_credenciais')
    // Teto 900 GB, corte em 90% = 810 GB.
    expect(situacaoDoTurn({ ...base, bytesNoMes: 809 * BYTES_POR_GB })).toBe('ativo')
    expect(situacaoDoTurn({ ...base, bytesNoMes: 810 * BYTES_POR_GB })).toBe('orcamento')
    expect(situacaoDoTurn({ ...base, config: { ...CONFIG_SALA_PADRAO, turnOrcamentoGbMes: null }, bytesNoMes: 10 ** 15 })).toBe('ativo')
  })

  it('credencial vale até a sala fechar, entre 5 min e 4 h', () => {
    const agora = new Date('2026-11-10T17:00:00Z')
    expect(ttlDoTurnSegundos(agora, new Date(agora.getTime() + min(60)))).toBe(3600 + 300)
    expect(ttlDoTurnSegundos(agora, new Date(agora.getTime() - min(60)))).toBe(300)
    expect(ttlDoTurnSegundos(agora, new Date(agora.getTime() + min(600)))).toBe(4 * 3600)
  })
})

describe('sala: cadência (o que custa invocação)', () => {
  const c = (fase: Parameters<typeof cadenciaDaSala>[0]['fase'], extra: Partial<Parameters<typeof cadenciaDaSala>[0]> = {}) =>
    cadenciaDaSala({ fase, visivel: true, haMs: 0, falhasSeguidas: 0, ...extra })

  it('em aula: só o pulso de 30 s, mesmo com a aba oculta', () => {
    expect(c('em_aula')).toBe(30_000)
    expect(c('em_aula', { visivel: false })).toBe(30_000)
  })

  it('esperando sozinho afrouxa com o tempo e para depois de 45 min', () => {
    expect(c('sozinho')).toBe(3_000)
    expect(c('sozinho', { haMs: min(5) })).toBe(6_000)
    expect(c('sozinho', { haMs: min(20) })).toBe(10_000)
    expect(c('sozinho', { visivel: false })).toBe(15_000)
    expect(c('sozinho', { haMs: ESPERA_MAXIMA_SOZINHO_MS })).toBeNull()
  })

  it('negociação rápida, mas por pouco tempo', () => {
    expect(c('negociando')).toBe(1_000)
    expect(c('negociando', { haMs: 20_000 })).toBe(3_000)
  })

  it('grupo incompleto não fica acelerado a aula inteira', () => {
    expect(c('incompleta')).toBe(6_000)
    expect(c('incompleta', { haMs: min(6) })).toBe(15_000)
    expect(c('incompleta', { haMs: min(20) })).toBe(30_000)
  })

  it('reconectando recua até 8 s; falha do servidor recua até 30 s', () => {
    expect(c('reconectando')).toBe(1_000)
    expect(c('reconectando', { falhasSeguidas: 3 })).toBe(8_000)
    expect(c('reconectando', { falhasSeguidas: 10 })).toBe(8_000)
    expect(c('sozinho', { falhasSeguidas: 1 })).toBe(2_000)
    expect(c('em_aula', { falhasSeguidas: 9 })).toBe(30_000)
  })

  it('pior caso de uma aula 1:1 de 60 min fica abaixo de 400 requisições por pessoa', () => {
    // 5 min sozinho + 55 min em aula, aba visível.
    let total = 0
    for (let t = 0; t < min(5); t += c('sozinho', { haMs: t })!) total++
    total += Math.ceil(min(55) / c('em_aula')!)
    expect(total).toBeLessThan(400)
  })
})

describe('sala: qualidade adaptativa', () => {
  it('perda e atraso pesam mais que banda', () => {
    expect(classificarAmostra({ perda: 0.1, rttMs: 50, bitrateDisponivel: 5e6, limitadoPorBanda: false, alvoBitrate: 600_000 })).toBe('ruim')
    expect(classificarAmostra({ perda: 0, rttMs: 700, bitrateDisponivel: 5e6, limitadoPorBanda: false, alvoBitrate: 600_000 })).toBe('ruim')
    expect(classificarAmostra({ perda: 0, rttMs: 50, bitrateDisponivel: 400_000, limitadoPorBanda: false, alvoBitrate: 600_000 })).toBe('ruim')
    expect(classificarAmostra({ perda: 0.01, rttMs: 80, bitrateDisponivel: 2e6, limitadoPorBanda: false, alvoBitrate: 600_000 })).toBe('boa')
    expect(classificarAmostra({ perda: 0.03, rttMs: 80, bitrateDisponivel: 2e6, limitadoPorBanda: false, alvoBitrate: 600_000 })).toBe('neutra')
  })

  it('desce em 2 amostras ruins e sobe só depois de 10 boas', () => {
    let e = { nivel: 0, ruins: 0, boas: 0 }
    e = proximaQualidade(e, 'ruim', 3)
    expect(e.nivel).toBe(0)
    e = proximaQualidade(e, 'ruim', 3)
    expect(e.nivel).toBe(1)
    for (let i = 0; i < 9; i++) e = proximaQualidade(e, 'boa', 3)
    expect(e.nivel).toBe(1)
    e = proximaQualidade(e, 'boa', 3)
    expect(e.nivel).toBe(0)
  })

  it('nunca passa do último nível (só áudio) nem sobe acima do primeiro', () => {
    let e = { nivel: 3, ruins: 0, boas: 0 }
    e = proximaQualidade(proximaQualidade(e, 'ruim', 3), 'ruim', 3)
    expect(e.nivel).toBe(3)
    e = { nivel: 0, ruins: 0, boas: 0 }
    for (let i = 0; i < 30; i++) e = proximaQualidade(e, 'boa', 3)
    expect(e.nivel).toBe(0)
  })

  it('no grupo o teto por par é menor, com um pouco mais para o monitor; último nível pausa o vídeo', () => {
    expect(nivelDeVideo('individual', 0, 'aluno')!.maxBitrate).toBe(600_000)
    expect(nivelDeVideo('grupo', 0, 'aluno')!.maxBitrate).toBe(300_000)
    expect(nivelDeVideo('grupo', 0, 'monitor')!.maxBitrate).toBe(400_000)
    expect(nivelDeVideo('grupo', 3, 'monitor')).toBeNull()
  })
})

describe('sala: presença para o suporte', () => {
  const t = (min: number) => new Date(Date.UTC(2026, 10, 10, 17, min))
  it('soma o tempo sem contar duas vezes duas abas abertas ao mesmo tempo', async () => {
    const { resumirPresenca } = await import('@/lib/monitorias/sala/regras')
    const r = resumirPresenca([
      { pid: 'm', papel: 'monitor', entrou: t(0), ate: t(30), saiu: t(30) },
      { pid: 'm', papel: 'monitor', entrou: t(20), ate: t(50) },
      { pid: 'a', papel: 'aluno', entrou: t(5), ate: t(55), conexaoTipo: 'retransmitida' },
      { pid: 'm', papel: 'monitor', entrou: t(52), ate: t(58), saiu: t(58) },
    ])
    expect(r.map((x) => [x.papel, x.minutos, x.retransmitida])).toEqual([
      ['monitor', 56, false],
      ['aluno', 50, true],
    ])
    expect(r[0].primeiraEntrada).toEqual(t(0))
    expect(r[0].ultimaAtividade).toEqual(t(58))
  })

  it('registro vazio ou inválido não quebra', async () => {
    const { resumirPresenca } = await import('@/lib/monitorias/sala/regras')
    expect(resumirPresenca([])).toEqual([])
    expect(resumirPresenca([{ pid: 'x', papel: 'aluno', entrou: 'lixo', ate: 'lixo' }])).toEqual([])
  })
})

describe('sala: atalhos', () => {
  it('"Entrar na sala" só dentro da janela de uma aula confirmada', async () => {
    const { salaAbertaAgora } = await import('@/lib/monitorias/sala/regras')
    const inicio = '2026-11-10T17:00:00.000Z'
    const base = { status: 'confirmada', inicio, duracaoMin: 60 }
    const em = (iso: string) => new Date(iso).getTime()
    expect(salaAbertaAgora({ ...base, papel: 'aluno', agora: em('2026-11-10T16:50:00Z') })).toBe(true)
    expect(salaAbertaAgora({ ...base, papel: 'aluno', agora: em('2026-11-10T16:40:00Z') })).toBe(false)
    expect(salaAbertaAgora({ ...base, papel: 'monitor', agora: em('2026-11-10T16:40:00Z') })).toBe(true)
    expect(salaAbertaAgora({ ...base, papel: 'aluno', agora: em('2026-11-10T18:31:00Z') })).toBe(false)
    expect(salaAbertaAgora({ ...base, status: 'aguardando_pagamento', papel: 'aluno', agora: em('2026-11-10T17:10:00Z') })).toBe(false)
  })

  it('a rota da sala é reconhecida (o chrome do app não monta nela)', async () => {
    const { ehRotaDaSala } = await import('@/lib/monitorias/sala/regras')
    expect(ehRotaDaSala('/monitorias/reservas/65f0c0ffee0000000000aaaa/sala')).toBe(true)
    expect(ehRotaDaSala('/monitorias/reservas/65f0c0ffee0000000000aaaa')).toBe(false)
    expect(ehRotaDaSala('/monitorias/reservas/x/sala')).toBe(false)
    expect(ehRotaDaSala(null)).toBe(false)
  })
})
