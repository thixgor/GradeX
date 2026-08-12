import { describe, it, expect } from 'vitest'
import {
  MAX_TIMED_ACCESS_VERSIONS,
  activeAccessFilter,
  buildTimedPurchaseFields,
  buildTimedPurchaseFieldsFromMinutes,
  findTimedAccessVersion,
  formatDurationMinutes,
  formatRemaining,
  getActiveTimedAccessVersions,
  isPurchaseActive,
  lifetimeOwnershipFilter,
  sanitizeTimedAccessVersions,
  serializeTimedAccessVersions,
  summarizeTimedAccess,
  versionDurationMinutes,
} from '@/lib/material-timed-access'

/**
 * O acesso por tempo é o que separa "comprei por 30 dias" de "comprei para
 * sempre" — errar aqui é entregar acervo de graça ou tirar acesso de quem
 * pagou. Estes testes fixam as três regras que sustentam a modalidade:
 * a duração vem do admin já saneada, o prazo só começa quando o acesso é
 * liberado, e uma compra vencida deixa de valer.
 */

const DAY_MINUTES = 24 * 60

function version(overrides: Record<string, any> = {}) {
  return {
    id: 'v30',
    label: 'Acesso 30 dias',
    price: 19.9,
    durationDays: 30,
    durationHours: 0,
    isActive: true,
    order: 0,
    ...overrides,
  }
}

describe('saneamento das versões vindas do admin', () => {
  it('descarta versão sem rótulo ou sem duração', () => {
    const result = sanitizeTimedAccessVersions([
      version(),
      version({ id: 'sem-nome', label: '   ' }),
      version({ id: 'sem-prazo', durationDays: 0, durationHours: 0 }),
    ])
    expect(result.map((v) => v.id)).toEqual(['v30'])
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

  it('limita horas a 23 — o resto vira dia, não hora extra', () => {
    const [result] = sanitizeTimedAccessVersions([version({ durationHours: 90 })])
    expect(result.durationHours).toBe(23)
  })

  it('ignora entrada que não é lista', () => {
    expect(sanitizeTimedAccessVersions(null)).toEqual([])
    expect(sanitizeTimedAccessVersions({ id: 'x' })).toEqual([])
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

  it('serializa com rótulo de duração pronto para a interface', () => {
    const [first] = serializeTimedAccessVersions(item)
    expect(first.durationMinutes).toBe(30 * DAY_MINUTES)
    expect(first.durationLabel).toBe('30 dias')
  })
})

describe('o prazo começa quando o acesso é liberado', () => {
  it('conta a partir de `startsAt` — a ativação da key, não o pagamento', () => {
    const activatedAt = new Date('2026-03-10T12:00:00.000Z')
    const fields = buildTimedPurchaseFields(version(), activatedAt)

    expect(fields.accessMode).toBe('timed')
    expect(fields.accessStartsAt).toBe(activatedAt)
    expect(fields.accessExpiresAt?.toISOString()).toBe('2026-04-09T12:00:00.000Z')
    // A modalidade não inclui download em nenhuma hipótese.
    expect(fields.downloadDisabled).toBe(true)
  })

  it('aceita a forma achatada que viaja no pedido/serial key', () => {
    const start = new Date('2026-01-01T00:00:00.000Z')
    const fields = buildTimedPurchaseFieldsFromMinutes(
      { id: 'v1', label: '24 horas', durationMinutes: DAY_MINUTES },
      start
    )
    expect(fields.accessExpiresAt?.toISOString()).toBe('2026-01-02T00:00:00.000Z')
    expect(fields.accessVersionLabel).toBe('24 horas')
  })

  it('soma dias e horas da versão', () => {
    expect(versionDurationMinutes({ durationDays: 2, durationHours: 6 })).toBe(2 * DAY_MINUTES + 360)
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
      accessVersionLabel: 'Acesso 30 dias',
      accessDurationMinutes: 30 * DAY_MINUTES,
      accessStartsAt: new Date('2026-05-01T12:00:00.000Z'),
      accessExpiresAt: new Date('2026-05-31T12:00:00.000Z'),
    }
    expect(isPurchaseActive(purchase, now)).toBe(true)

    const status = summarizeTimedAccess(purchase, now)
    expect(status?.expired).toBe(false)
    expect(status?.remainingLabel).toBe('21 dias')
    expect(status?.endingSoon).toBe(false)
    // Nem quando ainda está no prazo a modalidade libera download.
    expect(status?.downloadAllowed).toBe(false)
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
  it('formata durações', () => {
    expect(formatDurationMinutes(30 * DAY_MINUTES)).toBe('30 dias')
    expect(formatDurationMinutes(DAY_MINUTES)).toBe('1 dia')
    expect(formatDurationMinutes(DAY_MINUTES + 360)).toBe('1 dia e 6 h')
    expect(formatDurationMinutes(120)).toBe('2 horas')
    expect(formatDurationMinutes(90)).toBe('1 h e 30 min')
    expect(formatDurationMinutes(1)).toBe('1 minuto')
  })

  it('formata o tempo restante, inclusive nos extremos', () => {
    expect(formatRemaining(0)).toBe('Acesso encerrado')
    expect(formatRemaining(30_000)).toBe('Menos de 1 minuto')
    expect(formatRemaining(2 * DAY_MINUTES * 60_000)).toBe('2 dias')
  })
})
