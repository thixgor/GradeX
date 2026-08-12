import { describe, it, expect } from 'vitest'
import {
  MAX_TIMED_ACCESS_VERSIONS,
  activeAccessFilter,
  buildTimedPurchaseFields,
  buildTimedPurchaseFieldsFor,
  computeAccessExpiry,
  durationToApproxMinutes,
  findTimedAccessVersion,
  formatDuration,
  formatDurationMinutes,
  formatRemaining,
  getActiveTimedAccessVersions,
  hasDuration,
  isPurchaseActive,
  lifetimeOwnershipFilter,
  normalizeDuration,
  sanitizeTimedAccessVersions,
  serializeTimedAccessVersions,
  summarizeTimedAccess,
  versionDuration,
  versionDurationMinutes,
  type TimedAccessDuration,
} from '@/lib/material-timed-access'

/**
 * O acesso por tempo é o que separa "comprei por 30 dias" de "comprei para
 * sempre" — errar aqui é entregar acervo de graça ou tirar acesso de quem
 * pagou. Estes testes fixam as regras que sustentam a modalidade: o prazo vem
 * do admin já saneado nas cinco unidades, meses e anos andam no calendário,
 * a contagem só começa quando o acesso é liberado, e uma compra vencida deixa
 * de valer.
 */

const DAY_MINUTES = 24 * 60

function duration(overrides: Partial<TimedAccessDuration> = {}): TimedAccessDuration {
  return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, ...overrides }
}

function version(overrides: Record<string, any> = {}) {
  return {
    id: 'v30',
    label: 'Acesso 30 dias',
    price: 19.9,
    durationYears: 0,
    durationMonths: 0,
    durationDays: 30,
    durationHours: 0,
    durationMinutes: 0,
    isActive: true,
    order: 0,
    ...overrides,
  }
}

describe('saneamento das versões vindas do admin', () => {
  it('aceita as cinco unidades e soma todas', () => {
    const [result] = sanitizeTimedAccessVersions([
      version({ durationYears: 1, durationMonths: 2, durationDays: 3, durationHours: 4, durationMinutes: 5 }),
    ])
    expect(versionDuration(result)).toEqual({ years: 1, months: 2, days: 3, hours: 4, minutes: 5 })
  })

  it('descarta versão sem rótulo ou sem nenhuma unidade preenchida', () => {
    const result = sanitizeTimedAccessVersions([
      version(),
      version({ id: 'sem-nome', label: '   ' }),
      version({ id: 'sem-prazo', durationDays: 0 }),
    ])
    expect(result.map((v) => v.id)).toEqual(['v30'])
  })

  it('uma versão só de minutos vale', () => {
    const result = sanitizeTimedAccessVersions([
      version({ id: 'v45', label: 'Acesso 45 minutos', durationDays: 0, durationMinutes: 45 }),
    ])
    expect(result).toHaveLength(1)
    expect(formatDuration(versionDuration(result[0]))).toBe('45 minutos')
  })

  it('gera id novo quando falta ou colide, para não misturar duas versões', () => {
    const result = sanitizeTimedAccessVersions([
      version({ id: '' }),
      version({ id: 'dup' }),
      version({ id: 'dup', label: 'Outra' }),
    ])
    const ids = result.map((v) => v.id)
    expect(new Set(ids).size).toBe(3)
    expect(ids.every(Boolean)).toBe(true)
  })

  it('respeita o teto de versões e normaliza preço negativo', () => {
    const many = Array.from({ length: MAX_TIMED_ACCESS_VERSIONS + 3 }, (_, i) =>
      version({ id: `v${i}`, price: -5, order: i })
    )
    const result = sanitizeTimedAccessVersions(many)
    expect(result).toHaveLength(MAX_TIMED_ACCESS_VERSIONS)
    expect(result.every((v) => v.price === 0)).toBe(true)
  })

  it('ignora entrada que não é lista', () => {
    expect(sanitizeTimedAccessVersions(null)).toEqual([])
    expect(sanitizeTimedAccessVersions({ id: 'x' })).toEqual([])
  })

  it('lê versões antigas (só dias e horas) sem mudar o prazo publicado', () => {
    const legacy = { id: 'v7', label: 'Acesso 7 dias', price: 9, durationDays: 7, durationHours: 12, isActive: true, order: 0 }
    const [result] = sanitizeTimedAccessVersions([legacy])
    expect(versionDuration(result)).toEqual({ years: 0, months: 0, days: 7, hours: 12, minutes: 0 })
  })
})

describe('versões publicadas', () => {
  const item = {
    timedAccessVersions: [
      version({ id: 'v7', label: 'Acesso 7 dias', price: 9.9, durationDays: 7, order: 1 }),
      version({ id: 'off', isActive: false }),
      version({ id: 'v30', order: 0 }),
    ],
  }

  it('esconde as desligadas e ordena por ordem/preço', () => {
    expect(getActiveTimedAccessVersions(item).map((v) => v.id)).toEqual(['v30', 'v7'])
  })

  it('só encontra versão publicada — id desligado ou inexistente não vale', () => {
    expect(findTimedAccessVersion(item, 'v7')?.label).toBe('Acesso 7 dias')
    expect(findTimedAccessVersion(item, 'off')).toBeNull()
    expect(findTimedAccessVersion(item, 'nao-existe')).toBeNull()
    expect(findTimedAccessVersion(item, undefined)).toBeNull()
  })

  it('serializa com duração e rótulo prontos para a interface', () => {
    const [first] = serializeTimedAccessVersions(item)
    expect(first.duration).toEqual({ years: 0, months: 0, days: 30, hours: 0, minutes: 0 })
    expect(first.durationLabel).toBe('30 dias')
  })

  it('a versão serializada volta a ser lida sem confundir minutos com o total', () => {
    // `durationMinutes` na versão serializada é o total estimado; ler dele
    // como se fosse "minutos" daria um prazo absurdo.
    const [first] = serializeTimedAccessVersions({
      timedAccessVersions: [version({ durationMonths: 1, durationDays: 0 })],
    })
    expect(normalizeDuration(first)).toEqual({ years: 0, months: 1, days: 0, hours: 0, minutes: 0 })
  })
})

describe('meses e anos andam no calendário', () => {
  it('1 mês em janeiro cai em fevereiro, não em 30 dias corridos', () => {
    const end = computeAccessExpiry(new Date('2026-01-15T10:00:00.000Z'), duration({ months: 1 }))
    expect(end.toISOString()).toBe('2026-02-15T10:00:00.000Z')
  })

  it('quando o dia não existe no mês de destino, para no último dia dele', () => {
    // 31/01 + 1 mês não pode escorregar para 03/03.
    const end = computeAccessExpiry(new Date('2026-01-31T09:00:00.000Z'), duration({ months: 1 }))
    expect(end.toISOString()).toBe('2026-02-28T09:00:00.000Z')
  })

  it('respeita ano bissexto', () => {
    const end = computeAccessExpiry(new Date('2028-01-31T09:00:00.000Z'), duration({ months: 1 }))
    expect(end.toISOString()).toBe('2028-02-29T09:00:00.000Z')
  })

  it('1 ano a partir de 29/02 cai em 28/02 do ano seguinte', () => {
    const end = computeAccessExpiry(new Date('2028-02-29T12:00:00.000Z'), duration({ years: 1 }))
    expect(end.toISOString()).toBe('2029-02-28T12:00:00.000Z')
  })

  it('meses acima de 12 viram anos corretamente', () => {
    const end = computeAccessExpiry(new Date('2026-03-10T00:00:00.000Z'), duration({ months: 18 }))
    expect(end.toISOString()).toBe('2027-09-10T00:00:00.000Z')
  })

  it('soma calendário e tempo absoluto na mesma versão', () => {
    const end = computeAccessExpiry(
      new Date('2026-01-31T22:30:00.000Z'),
      duration({ months: 1, days: 2, hours: 3, minutes: 45 })
    )
    // 31/01 → 28/02 (fim do mês), depois +2d 3h45min.
    expect(end.toISOString()).toBe('2026-03-03T02:15:00.000Z')
  })

  it('minutos e horas sozinhos são tempo absoluto', () => {
    const end = computeAccessExpiry(new Date('2026-01-01T23:30:00.000Z'), duration({ hours: 1, minutes: 45 }))
    expect(end.toISOString()).toBe('2026-01-02T01:15:00.000Z')
  })
})

describe('o prazo começa quando o acesso é liberado', () => {
  it('conta a partir de `startsAt` — a ativação da key, não o pagamento', () => {
    const activatedAt = new Date('2026-03-10T12:00:00.000Z')
    const fields = buildTimedPurchaseFields(version() as any, activatedAt)

    expect(fields.accessMode).toBe('timed')
    expect(fields.accessStartsAt).toBe(activatedAt)
    expect(fields.accessExpiresAt?.toISOString()).toBe('2026-04-09T12:00:00.000Z')
    // A modalidade não inclui download em nenhuma hipótese.
    expect(fields.downloadDisabled).toBe(true)
  })

  it('guarda a duração inteira, para a data poder ser recalculada', () => {
    const fields = buildTimedPurchaseFields(
      version({ durationDays: 0, durationMonths: 6 }) as any,
      new Date('2026-01-10T00:00:00.000Z')
    )
    expect(fields.accessDuration).toEqual({ years: 0, months: 6, days: 0, hours: 0, minutes: 0 })
    expect(fields.accessExpiresAt?.toISOString()).toBe('2026-07-10T00:00:00.000Z')
  })

  it('key antiga, que só carrega minutos, continua sendo ativada', () => {
    const fields = buildTimedPurchaseFieldsFor(
      { id: 'v1', label: '24 horas', durationMinutes: DAY_MINUTES },
      new Date('2026-01-01T00:00:00.000Z')
    )
    expect(fields.accessExpiresAt?.toISOString()).toBe('2026-01-02T00:00:00.000Z')
    expect(fields.accessVersionLabel).toBe('24 horas')
  })

  it('estimativa em minutos serve para comparar prazos', () => {
    expect(durationToApproxMinutes(duration({ days: 2, hours: 6 }))).toBe(2 * DAY_MINUTES + 360)
    expect(versionDurationMinutes(version({ durationMonths: 1, durationDays: 0 }))).toBe(30 * DAY_MINUTES)
    expect(hasDuration(duration())).toBe(false)
    expect(hasDuration(duration({ minutes: 1 }))).toBe(true)
  })
})

describe('compra vencida deixa de dar acesso', () => {
  const now = new Date('2026-05-10T12:00:00.000Z')

  it('vitalícia continua valendo sempre', () => {
    expect(isPurchaseActive({ itemId: 'x' }, now)).toBe(true)
    expect(summarizeTimedAccess({ itemId: 'x' }, now)).toBeNull()
  })

  it('dentro do prazo vale e informa quanto resta', () => {
    const purchase = {
      accessMode: 'timed',
      accessVersionLabel: 'Acesso 1 mês',
      accessDuration: duration({ months: 1 }),
      accessStartsAt: new Date('2026-05-01T12:00:00.000Z'),
      accessExpiresAt: new Date('2026-06-01T12:00:00.000Z'),
    }
    expect(isPurchaseActive(purchase, now)).toBe(true)

    const status = summarizeTimedAccess(purchase, now)
    expect(status?.expired).toBe(false)
    expect(status?.durationLabel).toBe('1 mês')
    expect(status?.remainingLabel).toBe('22 dias')
    expect(status?.endingSoon).toBe(false)
    // Nem quando ainda está no prazo a modalidade libera download.
    expect(status?.downloadAllowed).toBe(false)
  })

  it('compra antiga, só com minutos, ainda descreve o prazo', () => {
    const status = summarizeTimedAccess(
      {
        accessMode: 'timed',
        accessDurationMinutes: 30 * DAY_MINUTES,
        accessExpiresAt: new Date('2026-05-20T12:00:00.000Z'),
      },
      now
    )
    expect(status?.durationLabel).toBe('30 dias')
  })

  it('marca "acabando" na última 24 h', () => {
    const status = summarizeTimedAccess(
      { accessMode: 'timed', accessExpiresAt: new Date('2026-05-11T02:00:00.000Z') },
      now
    )
    expect(status?.endingSoon).toBe(true)
    expect(status?.remainingLabel).toBe('14 horas')
  })

  it('passada a data, não vale mais', () => {
    const purchase = { accessMode: 'timed', accessExpiresAt: new Date('2026-05-09T12:00:00.000Z') }
    expect(isPurchaseActive(purchase, now)).toBe(false)
    const status = summarizeTimedAccess(purchase, now)
    expect(status?.expired).toBe(true)
    expect(status?.remainingMs).toBe(0)
  })
})

describe('filtros Mongo', () => {
  it('activeAccessFilter usa $nor para conviver com o $or de userId/e-mail', () => {
    const filter = activeAccessFilter(new Date('2026-05-10T12:00:00.000Z'))
    // Duas chaves `$or` no mesmo objeto se anulariam; `$nor` é chave distinta.
    expect(Object.keys(filter)).toEqual(['$nor'])
    expect(filter.$nor[0].accessExpiresAt.$type).toBe('date')
  })

  it('lifetimeOwnershipFilter só casa posse sem prazo', () => {
    const filter = lifetimeOwnershipFilter()
    expect(filter.accessExpiresAt).toEqual({ $exists: false })
    expect(filter.accessMode).toEqual({ $ne: 'timed' })
  })
})

describe('rótulos em português', () => {
  it('formata cada unidade e junta no máximo as duas maiores', () => {
    expect(formatDuration(duration({ days: 30 }))).toBe('30 dias')
    expect(formatDuration(duration({ days: 1 }))).toBe('1 dia')
    expect(formatDuration(duration({ months: 1 }))).toBe('1 mês')
    expect(formatDuration(duration({ months: 3 }))).toBe('3 meses')
    expect(formatDuration(duration({ years: 1 }))).toBe('1 ano')
    expect(formatDuration(duration({ years: 1, months: 6 }))).toBe('1 ano e 6 meses')
    expect(formatDuration(duration({ hours: 2, minutes: 30 }))).toBe('2 h e 30 min')
    expect(formatDuration(duration({ minutes: 1 }))).toBe('1 minuto')
    expect(formatDuration(duration({ hours: 2 }))).toBe('2 horas')
    // Três unidades ou mais: mostra só as duas maiores.
    expect(formatDuration(duration({ years: 1, months: 2, days: 3 }))).toBe('1 ano e 2 meses')
    expect(formatDuration(duration())).toBe('0 minutos')
  })

  it('formata a partir de minutos (compras antigas)', () => {
    expect(formatDurationMinutes(30 * DAY_MINUTES)).toBe('30 dias')
    expect(formatDurationMinutes(DAY_MINUTES + 360)).toBe('1 dia e 6 h')
    expect(formatDurationMinutes(120)).toBe('2 horas')
    expect(formatDurationMinutes(90)).toBe('1 h e 30 min')
  })

  it('formata o tempo restante, inclusive nos extremos', () => {
    expect(formatRemaining(0)).toBe('Acesso encerrado')
    expect(formatRemaining(30_000)).toBe('Menos de 1 minuto')
    expect(formatRemaining(2 * DAY_MINUTES * 60_000)).toBe('2 dias')
  })
})
