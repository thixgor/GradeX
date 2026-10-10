import { describe, expect, it } from 'vitest'
import {
  anuncioAtendeDemanda,
  chaveDaMateria,
  CorpoDemanda,
  expiracaoDaDemanda,
  haQuantoTempo,
  materiaApresentavel,
  resumoDaDemanda,
} from '@/lib/monitorias/demandas-regras'

describe('pedidos de monitoria: regras puras', () => {
  it('matéria casa sem acento, maiúscula ou espaço sobrando', () => {
    expect(chaveDaMateria('  Fisiologia   Humana ')).toBe('fisiologia humana')
    expect(chaveDaMateria('Bioquímica')).toBe(chaveDaMateria('bioquimica'))
    expect(materiaApresentavel('  farmacologia  ')).toBe('Farmacologia')
  })

  it('pedido "o quanto antes" sai do mural antes de "sem pressa"', () => {
    const agora = new Date('2026-10-10T12:00:00Z')
    const dias = (d: Date) => (d.getTime() - agora.getTime()) / 86_400_000
    expect(dias(expiracaoDaDemanda('logo', agora))).toBe(3)
    expect(dias(expiracaoDaDemanda('esta_semana', agora))).toBe(7)
    expect(dias(expiracaoDaDemanda('proxima_semana', agora))).toBe(14)
    expect(dias(expiracaoDaDemanda('sem_pressa', agora))).toBe(21)
  })

  it('valida o corpo: só escolhas conhecidas, valor mínimo e assunto opcional', () => {
    const base = { materia: 'Fisiologia', pessoas: 1, valorPorPessoaCentavos: null, duracaoMin: 60, quando: 'esta_semana', periodos: [] }
    expect(CorpoDemanda.safeParse(base).success).toBe(true)
    expect(CorpoDemanda.parse(base).assunto).toBe('')
    expect(CorpoDemanda.safeParse({ ...base, duracaoMin: 45 }).success).toBe(false)
    expect(CorpoDemanda.safeParse({ ...base, valorPorPessoaCentavos: 500 }).success).toBe(false)
    expect(CorpoDemanda.safeParse({ ...base, pessoas: 11 }).success).toBe(false)
    expect(CorpoDemanda.safeParse({ ...base, quando: 'ontem' }).success).toBe(false)
    expect(CorpoDemanda.safeParse({ ...base, periodos: ['madrugada'] }).success).toBe(false)
    expect(CorpoDemanda.safeParse({ ...base, extra: 1 }).success).toBe(false)
  })

  it('grupo maior do que o anúncio aceita: não dá para responder com ele', () => {
    expect(anuncioAtendeDemanda({ grupo: { ativo: false, maxAlunos: 1 } }, { pessoas: 1 }).ok).toBe(true)
    const semGrupo = anuncioAtendeDemanda({ grupo: { ativo: false, maxAlunos: 8 } }, { pessoas: 3 })
    expect(semGrupo.ok).toBe(false)
    expect(!semGrupo.ok && semGrupo.motivo).toContain('Aula em grupo')
    expect(anuncioAtendeDemanda({ grupo: { ativo: true, maxAlunos: 4 } }, { pessoas: 4 }).ok).toBe(true)
    expect(anuncioAtendeDemanda({ grupo: { ativo: true, maxAlunos: 4 } }, { pessoas: 5 }).ok).toBe(false)
  })

  it('resumo legível e tempo relativo', () => {
    // formatarCentavos usa espaço inseparável depois de "R$".
    expect(
      resumoDaDemanda({ materia: 'Fisiologia', assunto: 'ECG', pessoas: 3, valorPorPessoaCentavos: 4000, duracaoMin: 90, quando: 'esta_semana', periodos: ['noite'] }).replace(/\s/g, ' '),
    ).toBe('Fisiologia (ECG) · 3 pessoas · 1h30 · até R$ 40,00 por pessoa · Esta semana, noite')
    expect(resumoDaDemanda({ materia: 'Anatomia', pessoas: 1, valorPorPessoaCentavos: null, duracaoMin: 60, quando: 'logo', periodos: [] })).toBe(
      'Anatomia · Individual · 1h · valor a propor · O quanto antes',
    )
    const agora = new Date('2026-10-10T12:00:00Z')
    expect(haQuantoTempo(new Date(agora.getTime() - 30_000), agora)).toBe('agora')
    expect(haQuantoTempo(new Date(agora.getTime() - 5 * 60_000), agora)).toBe('há 5 min')
    expect(haQuantoTempo(new Date(agora.getTime() - 3 * 3_600_000), agora)).toBe('há 3 h')
    expect(haQuantoTempo(new Date(agora.getTime() - 26 * 3_600_000), agora)).toBe('há 1 dia')
  })
})
