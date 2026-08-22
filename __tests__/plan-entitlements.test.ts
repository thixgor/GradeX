import { beforeEach, describe, expect, it } from 'vitest'
import {
  MANUAL_CLINICO_MODULE_KEYS,
  PLAN_FEATURE_KEYS,
  descreverRegra,
  inicioDaJanela,
  normalizePlanPermissions,
  permissoesLiberadas,
  permissoesPadraoParaCargo,
  sanitizePlanPermissions,
} from '@/lib/plan-entitlements'
import {
  areaLiberada,
  avaliarUsoDoPlano,
  contarUso,
  corpoDeRecusa,
  invalidarCatalogoDePlanos,
  moduloDoManualLiberadoNoContexto,
  resolverPermissoes,
} from '@/lib/plan-entitlements-server'

/**
 * Permissões modulares de plano.
 *
 * O que estes testes seguram, em ordem de gravidade:
 *
 *  1. **Nada muda para quem não pediu.** Plano sem o interruptor ligado — que é
 *     todo plano já existente — precisa sair daqui como "não se aplica", ou o
 *     deploy tira acesso de assinante pagante sem ninguém ter configurado nada.
 *  2. **A regra do plano é a única régua quando vale.** É o que impede a
 *     plataforma de dar duas respostas para a mesma pergunta.
 *  3. **Documento velho não quebra a checagem.** O bloco vive no Mongo e
 *     sobrevive a mudanças de código; área nova precisa nascer liberada.
 */

/**
 * Banco de mentira mínimo: um catálogo de planos, uma conta e um log de uso.
 * Só implementa o que o módulo realmente chama.
 */
function bancoFalso(opcoes: {
  planos?: any[]
  usuario?: Record<string, any>
  /** Eventos já gravados: `{ feature, recurso?, createdAt }`. */
  eventos?: Array<Record<string, any>>
  /** Contagem devolvida pelas coleções reais (posse vitalícia). */
  posse?: Record<string, number>
} = {}) {
  const eventos = opcoes.eventos || []
  return {
    collection(nome: string) {
      if (nome === 'admin_settings') {
        return { findOne: async () => ({ planos: opcoes.planos || [] }) }
      }
      if (nome === 'users') {
        return { findOne: async () => opcoes.usuario ?? null }
      }
      if (nome === 'plan_usage_events') {
        return {
          countDocuments: async (filtro: any) =>
            eventos.filter(e => {
              if (filtro.feature && e.feature !== filtro.feature) return false
              if (filtro.recurso && e.recurso !== filtro.recurso) return false
              const desde = filtro.createdAt?.$gte
              if (desde && new Date(e.createdAt) < new Date(desde)) return false
              return true
            }).length,
          findOne: async () => eventos[0] ?? null,
          insertOne: async (doc: any) => {
            eventos.push(doc)
            return { insertedId: 'x' }
          },
          createIndex: async () => undefined,
        }
      }
      return {
        countDocuments: async () => opcoes.posse?.[nome] ?? 0,
        findOne: async () => null,
        insertOne: async () => ({ insertedId: 'x' }),
        createIndex: async () => undefined,
      }
    },
  } as any
}

const CONTA = { userId: '507f1f77bcf86cd799439011', role: 'user', accountType: 'plus' }

function planoCom(regras: Record<string, any>, extras: Record<string, any> = {}) {
  const base = permissoesLiberadas()
  return {
    tipo: 'mensal',
    nome: 'Plano Mensal',
    role: 'plus',
    permissoes: {
      ...base,
      ativo: true,
      regras: { ...base.regras, ...regras },
      ...extras,
    },
  }
}

beforeEach(() => {
  // O catálogo é memoizado por 30s numa chave fixa; sem descartar, o primeiro
  // teste decidiria o resultado de todos os outros.
  invalidarCatalogoDePlanos()
})

describe('normalização do bloco de permissões', () => {
  it('trata ausência total como "não modulado"', () => {
    const p = normalizePlanPermissions(null)
    expect(p.ativo).toBe(false)
    for (const key of PLAN_FEATURE_KEYS) {
      expect(p.regras[key].liberado).toBe(true)
      expect(p.regras[key].limite).toBe(0)
    }
  })

  it('completa área que ainda não existia quando o plano foi gravado', () => {
    const p = normalizePlanPermissions({
      ativo: true,
      regras: { materiais: { liberado: false, limite: 0, periodo: 'dia' } },
    } as any)
    expect(p.regras.materiais.liberado).toBe(false)
    // Área nova nasce liberada: um plano vendido antes dela existir não pode
    // perder acesso por causa de um campo que ninguém tinha como preencher.
    expect(p.regras.mapasMentais.liberado).toBe(true)
  })

  it('descarta valores impossíveis em vez de gravar regra ininterpretável', () => {
    const p = normalizePlanPermissions({
      ativo: true,
      regras: {
        cronogramas: { liberado: true, limite: -5, periodo: 'decada' },
        provasIa: { liberado: true, limite: 99_999_999, periodo: 'dia' },
      },
    } as any)
    expect(p.regras.cronogramas.limite).toBe(0)
    expect(p.regras.cronogramas.periodo).toBe('dia')
    expect(p.regras.provasIa.limite).toBe(1_000_000)
  })

  it('zera o teto das áreas que são só liga/desliga', () => {
    const p = normalizePlanPermissions({
      ativo: true,
      regras: { aulas: { liberado: true, limite: 30, periodo: 'dia' } },
    } as any)
    expect(p.regras.aulas.limite).toBe(0)
  })

  it('sanitiza carimbando a data da edição', () => {
    const p = sanitizePlanPermissions({ ativo: true })
    expect(p.atualizadoEm).toBeInstanceOf(Date)
  })

  it('descreve a regra do jeito que o editor mostra', () => {
    const p = normalizePlanPermissions({
      ativo: true,
      regras: {
        materiais: { liberado: true, limite: 10, periodo: 'dia' },
        aulas: { liberado: false, limite: 0, periodo: 'dia' },
      },
    } as any)
    expect(descreverRegra(p, 'materiais')).toBe('10 downloads por dia')
    expect(descreverRegra(p, 'aulas')).toBe('Bloqueado')
    expect(descreverRegra(p, 'cronogramas')).toBe('Liberado, sem limite')
  })
})

describe('pré-carga a partir do cargo', () => {
  it('para o cargo pago, libera tudo sem teto (o comportamento de hoje)', () => {
    const p = permissoesPadraoParaCargo('plus')
    for (const key of PLAN_FEATURE_KEYS) {
      expect(p.regras[key].liberado).toBe(true)
      expect(p.regras[key].limite).toBe(0)
    }
  })

  it('para o cargo gratuito, espelha os limites que já existem', () => {
    const p = permissoesPadraoParaCargo('gratuito')
    expect(p.regras.materiais.liberado).toBe(false)
    expect(p.regras.bancoQuestoes.liberado).toBe(false)
    expect(p.regras.manualClinico.liberado).toBe(false)
    expect(p.regras.aulas.liberado).toBe(false)
    expect(p.regras.cronogramas).toMatchObject({ liberado: true, limite: 5, periodo: 'total' })
    expect(p.regras.mapasMentais).toMatchObject({ liberado: true, limite: 1, periodo: 'total' })
    for (const modulo of MANUAL_CLINICO_MODULE_KEYS) {
      expect(p.manualClinicoModulos[modulo]).toBe(false)
    }
  })
})

describe('resolução do plano da conta', () => {
  it('não se aplica a administrador', async () => {
    const db = bancoFalso({ planos: [planoCom({ materiais: { liberado: false, limite: 0, periodo: 'dia' } })] })
    const ctx = await resolverPermissoes(db, { ...CONTA, role: 'admin', premiumPlanType: 'mensal' })
    expect(ctx.aplicavel).toBe(false)
    expect(areaLiberada(ctx, 'materiais')).toBe(true)
  })

  it('não se aplica quando o plano existe mas não ligou o interruptor', async () => {
    const plano = planoCom({ materiais: { liberado: false, limite: 0, periodo: 'dia' } })
    plano.permissoes.ativo = false
    const ctx = await resolverPermissoes(bancoFalso({ planos: [plano] }), {
      ...CONTA,
      premiumPlanType: 'mensal',
    })
    expect(ctx.aplicavel).toBe(false)
    expect(areaLiberada(ctx, 'materiais')).toBe(true)
  })

  it('não se aplica quando a conta não aponta para nenhum plano', async () => {
    const ctx = await resolverPermissoes(bancoFalso({ planos: [planoCom({})] }), {
      ...CONTA,
      premiumPlanType: null,
    })
    expect(ctx.aplicavel).toBe(false)
  })

  it('aplica as regras do plano comprado', async () => {
    const ctx = await resolverPermissoes(
      bancoFalso({ planos: [planoCom({ materiais: { liberado: false, limite: 0, periodo: 'dia' } })] }),
      { ...CONTA, premiumPlanType: 'mensal' },
    )
    expect(ctx.aplicavel).toBe(true)
    expect(ctx.planoNome).toBe('Plano Mensal')
    expect(areaLiberada(ctx, 'materiais')).toBe(false)
    expect(areaLiberada(ctx, 'cronogramas')).toBe(true)
  })

  it('escolhe o plano certo quando há vários no catálogo', async () => {
    const anual = planoCom({ bancoQuestoes: { liberado: false, limite: 0, periodo: 'dia' } })
    anual.tipo = 'anual'
    anual.nome = 'Plano Anual'
    const ctx = await resolverPermissoes(bancoFalso({ planos: [planoCom({}), anual] }), {
      ...CONTA,
      premiumPlanType: 'anual',
    })
    expect(ctx.planoTipo).toBe('anual')
    expect(areaLiberada(ctx, 'bancoQuestoes')).toBe(false)
  })
})

describe('módulos do Manual Clínico', () => {
  it('desliga só o módulo escolhido', async () => {
    const plano = planoCom({}, {
      manualClinicoModulos: {
        ...permissoesLiberadas().manualClinicoModulos,
        radiologia: false,
      },
    })
    const ctx = await resolverPermissoes(bancoFalso({ planos: [plano] }), {
      ...CONTA,
      premiumPlanType: 'mensal',
    })
    expect(moduloDoManualLiberadoNoContexto(ctx, 'radiologia')).toBe(false)
    expect(moduloDoManualLiberadoNoContexto(ctx, 'patologias')).toBe(true)
  })

  it('área fechada leva todos os módulos junto', async () => {
    const plano = planoCom({ manualClinico: { liberado: false, limite: 0, periodo: 'total' } })
    const ctx = await resolverPermissoes(bancoFalso({ planos: [plano] }), {
      ...CONTA,
      premiumPlanType: 'mensal',
    })
    for (const modulo of MANUAL_CLINICO_MODULE_KEYS) {
      expect(moduloDoManualLiberadoNoContexto(ctx, modulo)).toBe(false)
    }
  })
})

describe('veredicto de uso', () => {
  async function contextoCom(regras: Record<string, any>, db: any) {
    return resolverPermissoes(db, { ...CONTA, premiumPlanType: 'mensal' })
  }

  it('libera sem contar quando a área não tem teto', async () => {
    const db = bancoFalso({ planos: [planoCom({})] })
    const ctx = await contextoCom({}, db)
    const v = await avaliarUsoDoPlano(db, ctx, 'provasIa')
    expect(v).toMatchObject({ permitido: true, aplicavel: true })
    expect(v.limite).toBeUndefined()
  })

  it('recusa a área bloqueada com mensagem que nomeia o plano', async () => {
    const db = bancoFalso({ planos: [planoCom({ aulas: { liberado: false, limite: 0, periodo: 'total' } })] })
    const ctx = await contextoCom({}, db)
    const v = await avaliarUsoDoPlano(db, ctx, 'aulas')
    expect(v.permitido).toBe(false)
    expect(v.motivo).toBe('bloqueado')
    expect(v.mensagem).toContain('Plano Mensal')
  })

  it('recusa quando a janela já está cheia e informa quando renova', async () => {
    const agora = new Date('2026-08-22T12:00:00Z')
    const eventos = Array.from({ length: 15 }, (_, i) => ({
      feature: 'provasPdf',
      recurso: `prova-${i}`,
      createdAt: new Date(agora.getTime() - 60 * 60 * 1000),
    }))
    const db = bancoFalso({
      planos: [planoCom({ provasPdf: { liberado: true, limite: 15, periodo: 'dia' } })],
      eventos,
    })
    const ctx = await contextoCom({}, db)
    const v = await avaliarUsoDoPlano(db, ctx, 'provasPdf', { recurso: 'prova-nova', agora })

    expect(v.permitido).toBe(false)
    expect(v.motivo).toBe('limite')
    expect(v).toMatchObject({ limite: 15, usado: 15, restante: 0, periodo: 'dia' })
    expect(v.renovaEm).toBeInstanceOf(Date)
  })

  it('não cobra duas vezes pelo mesmo recurso dentro da janela', async () => {
    const agora = new Date('2026-08-22T12:00:00Z')
    const eventos = Array.from({ length: 300 }, (_, i) => ({
      feature: 'bancoQuestoes',
      recurso: `q-${i}`,
      createdAt: new Date(agora.getTime() - 1000),
    }))
    const db = bancoFalso({
      planos: [planoCom({ bancoQuestoes: { liberado: true, limite: 300, periodo: 'dia' } })],
      eventos,
    })
    const ctx = await contextoCom({}, db)

    // Questão nunca aberta: a cota está cheia, então é recusa.
    const nova = await avaliarUsoDoPlano(db, ctx, 'bancoQuestoes', { recurso: 'q-999', agora })
    expect(nova.permitido).toBe(false)

    // Questão já aberta hoje: reabrir para revisar não gasta de novo.
    const revisita = await avaliarUsoDoPlano(db, ctx, 'bancoQuestoes', { recurso: 'q-7', agora })
    expect(revisita.permitido).toBe(true)
  })

  it('conta a coleção real quando a janela é vitalícia', async () => {
    const db = bancoFalso({
      planos: [planoCom({ cronogramas: { liberado: true, limite: 3, periodo: 'total' } })],
      posse: { cronogramas: 3 },
    })
    const ctx = await contextoCom({}, db)
    const v = await avaliarUsoDoPlano(db, ctx, 'cronogramas')
    expect(v.permitido).toBe(false)
    expect(v.usado).toBe(3)
    // Teto vitalício não renova sozinho — prometer data seria mentir.
    expect(v.renovaEm).toBeUndefined()
  })

  it('conta os cronogramas que já existiam antes destas permissões', async () => {
    const db = bancoFalso({ posse: { cronogramas: 12 } })
    expect(await contarUso(db, CONTA.userId, 'cronogramas', 'total')).toBe(12)
  })

  it('libera sem tocar em nada quando o plano não modula a conta', async () => {
    const db = bancoFalso({ planos: [] })
    const ctx = await resolverPermissoes(db, { ...CONTA, premiumPlanType: 'inexistente' })
    const v = await avaliarUsoDoPlano(db, ctx, 'materiais')
    expect(v).toEqual({ permitido: true, aplicavel: false })
  })
})

describe('corpo da recusa', () => {
  it('sai no formato que as telas já tratam para limite de plano', async () => {
    const db = bancoFalso({
      planos: [planoCom({ mapasMentais: { liberado: true, limite: 1, periodo: 'total' } })],
      posse: { mindMaps: 1 },
    })
    const ctx = await resolverPermissoes(db, { ...CONTA, premiumPlanType: 'mensal' })
    const corpo = corpoDeRecusa(await avaliarUsoDoPlano(db, ctx, 'mapasMentais'))

    expect(corpo.requiresUpgrade).toBe(true)
    expect(corpo.upgradeUrl).toBe('/buy')
    expect(corpo.planLimit).toBe(true)
    expect(corpo.limit).toBe(1)
    expect(typeof corpo.error).toBe('string')
  })
})

describe('janelas de tempo', () => {
  it('vitalício não tem começo', () => {
    expect(inicioDaJanela('total')).toBeNull()
  })

  it('a janela desliza a partir de agora', () => {
    const agora = new Date('2026-08-22T12:00:00Z')
    expect(inicioDaJanela('dia', agora)!.toISOString()).toBe('2026-08-21T12:00:00.000Z')
    expect(inicioDaJanela('hora', agora)!.toISOString()).toBe('2026-08-22T11:00:00.000Z')
  })
})
