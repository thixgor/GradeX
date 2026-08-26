import { beforeEach, describe, expect, it, vi } from 'vitest'
import { permissoesLiberadas } from '@/lib/plan-entitlements'
import {
  areaLiberadaOuEntao,
  invalidarCatalogoDePlanos,
  resolverPermissoes,
} from '@/lib/plan-entitlements-server'
import { invalidarRegistroDeCargos } from '@/lib/cargos-server'

/**
 * A ordem de precedência: plano → cargo → caminho legado.
 *
 * É a única parte do registro de cargos que pode tirar acesso de quem já paga,
 * então é a que precisa de teste. O que estes casos seguram:
 *
 *  1. **Cargo de fábrica não muda nada.** Eles entram com o bloco desligado, e
 *     `resolverPermissoes` tem de continuar devolvendo contexto neutro para
 *     eles — se devolvesse `aplicavel: true`, todo assinante Plus+ passaria a
 *     ser regido por um documento em vez do código que sempre valeu.
 *  2. **O plano ganha do cargo.** Quem comprou um plano modulado é regido por
 *     ele, mesmo que o cargo diga outra coisa. Sem essa ordem, um cargo
 *     genérico sobrescreveria a configuração específica que alguém pagou.
 *  3. **`areaLiberadaOuEntao` só chama o legado quando ninguém mais responde.**
 *     É o que faz um cargo criado pelo admin realmente abrir a área — o teste
 *     legado é uma lista fixa que nunca vai conhecê-lo.
 */

/** Banco de mentira: um catálogo de planos e um registro de cargos. */
function bancoFalso(opcoes: { planos?: any[]; cargos?: any[] } = {}) {
  return {
    collection(nome: string) {
      if (nome === 'admin_settings') {
        return {
          findOne: async (_filtro: unknown, projecao?: any) => {
            // As duas leituras memoizadas usam projeções diferentes; devolver
            // o documento inteiro serve às duas.
            void projecao
            return { planos: opcoes.planos || [], cargos: opcoes.cargos || [] }
          },
        }
      }
      return { findOne: async () => null, countDocuments: async () => 0 }
    },
  } as any
}

const USER_ID = '507f1f77bcf86cd799439011'

function permissoesCom(patch: Record<string, boolean>) {
  const base = permissoesLiberadas()
  for (const [key, liberado] of Object.entries(patch)) {
    base.regras[key as keyof typeof base.regras] = { liberado, limite: 0, periodo: 'dia' }
  }
  return { ...base, ativo: true }
}

describe('precedência plano → cargo → legado', () => {
  beforeEach(() => {
    // As duas camadas são memoizadas por 30s; sem limpar, um caso herdaria o
    // catálogo do anterior.
    invalidarCatalogoDePlanos()
    invalidarRegistroDeCargos()
    vi.restoreAllMocks()
  })

  it('devolve contexto neutro para cargo de fábrica — nada muda no deploy', async () => {
    const db = bancoFalso()
    for (const accountType of ['gratuito', 'trial', 'quest', 'plus']) {
      invalidarRegistroDeCargos()
      const contexto = await resolverPermissoes(db, { userId: USER_ID, accountType })
      expect(contexto.aplicavel, accountType).toBe(false)
      expect(contexto.origem, accountType).toBe(null)
    }
  })

  it('aplica o cargo quando o admin liga o bloco', async () => {
    const db = bancoFalso({
      cargos: [
        {
          id: 'manual-pro',
          nome: 'Manual Pro',
          pago: true,
          permissoes: permissoesCom({ bancoQuestoes: false, manualClinico: true }),
        },
      ],
    })

    const contexto = await resolverPermissoes(db, { userId: USER_ID, accountType: 'manual-pro' })

    expect(contexto.aplicavel).toBe(true)
    expect(contexto.origem).toBe('cargo')
    expect(contexto.planoNome).toBe('Manual Pro')
    expect(contexto.permissoes.regras.manualClinico.liberado).toBe(true)
    expect(contexto.permissoes.regras.bancoQuestoes.liberado).toBe(false)
  })

  it('deixa o plano ganhar do cargo', async () => {
    const db = bancoFalso({
      planos: [
        {
          tipo: 'anual',
          nome: 'Anual',
          permissoes: permissoesCom({ bancoQuestoes: true }),
        },
      ],
      cargos: [
        {
          id: 'manual-pro',
          nome: 'Manual Pro',
          pago: true,
          permissoes: permissoesCom({ bancoQuestoes: false }),
        },
      ],
    })

    const contexto = await resolverPermissoes(db, {
      userId: USER_ID,
      accountType: 'manual-pro',
      premiumPlanType: 'anual',
    })

    expect(contexto.origem).toBe('plano')
    expect(contexto.permissoes.regras.bancoQuestoes.liberado).toBe(true)
  })

  it('cai no cargo quando o plano existe mas não está modulado', async () => {
    const db = bancoFalso({
      // `ativo: false` é o estado de todo plano criado antes das permissões
      // modulares existirem.
      planos: [{ tipo: 'anual', nome: 'Anual', permissoes: { ativo: false } }],
      cargos: [
        {
          id: 'manual-pro',
          nome: 'Manual Pro',
          pago: true,
          permissoes: permissoesCom({ manualClinico: true }),
        },
      ],
    })

    const contexto = await resolverPermissoes(db, {
      userId: USER_ID,
      accountType: 'manual-pro',
      premiumPlanType: 'anual',
    })

    expect(contexto.origem).toBe('cargo')
  })

  it('nunca limita o admin', async () => {
    const db = bancoFalso({
      cargos: [
        { id: 'manual-pro', nome: 'Manual Pro', permissoes: permissoesCom({ manualClinico: false }) },
      ],
    })
    const contexto = await resolverPermissoes(db, {
      userId: USER_ID,
      role: 'admin',
      accountType: 'manual-pro',
    })
    expect(contexto.isAdmin).toBe(true)
    expect(contexto.aplicavel).toBe(false)
  })

  it('cai nos embutidos quando a leitura do registro falha', async () => {
    const dbQuebrado = {
      collection: () => ({
        findOne: async () => {
          throw new Error('Atlas fora do ar')
        },
      }),
    } as any

    // Sem catálogo nem registro, ninguém pode perder acesso: contexto neutro,
    // e o caminho legado assume.
    const contexto = await resolverPermissoes(dbQuebrado, { userId: USER_ID, accountType: 'plus' })
    expect(contexto.aplicavel).toBe(false)
  })
})

describe('areaLiberadaOuEntao', () => {
  const neutro = {
    userId: USER_ID,
    isAdmin: false,
    permissoes: permissoesLiberadas(),
    aplicavel: false,
    origem: null,
    planoTipo: null,
    planoNome: null,
  } as const

  it('consulta o legado quando o modular não responde', () => {
    expect(areaLiberadaOuEntao(neutro, 'bancoQuestoes', () => true)).toBe(true)
    expect(areaLiberadaOuEntao(neutro, 'bancoQuestoes', () => false)).toBe(false)
  })

  it('ignora o legado quando o modular responde', () => {
    const modular = {
      ...neutro,
      aplicavel: true,
      origem: 'cargo' as const,
      permissoes: permissoesCom({ bancoQuestoes: true }),
    }
    // O legado diria "não" — a lista fixa não conhece cargo criado pelo admin.
    expect(areaLiberadaOuEntao(modular, 'bancoQuestoes', () => false)).toBe(true)

    const fechado = { ...modular, permissoes: permissoesCom({ bancoQuestoes: false }) }
    // E o inverso: o modular fecha mesmo que o legado abrisse.
    expect(areaLiberadaOuEntao(fechado, 'bancoQuestoes', () => true)).toBe(false)
  })

  it('libera o admin sem consultar ninguém', () => {
    const admin = { ...neutro, isAdmin: true }
    let chamou = false
    expect(
      areaLiberadaOuEntao(admin, 'bancoQuestoes', () => {
        chamou = true
        return false
      }),
    ).toBe(true)
    expect(chamou).toBe(false)
  })
})
