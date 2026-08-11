import { describe, it, expect } from 'vitest'
import {
  DEFAULT_SIDEBAR_ORDER,
  SIDEBAR_SECTION_DEFINITIONS,
  getOrderedSidebarSections,
  getVisibleSidebarSections,
  normalizeSidebarOrder,
  normalizeSidebarSections,
  type SidebarSectionKey,
} from '@/lib/sidebar-sections'

/**
 * A ordem do menu é um dado que sobrevive a mudanças de código: fica salvo no
 * banco e continua lá quando uma seção é criada, renomeada ou removida numa
 * versão futura. Estes testes fixam esse contrato — sem ele, uma seção nova
 * sumiria do menu de quem já salvou a configuração alguma vez.
 */

describe('normalizeSidebarOrder', () => {
  it('sem nada salvo, devolve a ordem de declaração', () => {
    expect(normalizeSidebarOrder(undefined)).toEqual(DEFAULT_SIDEBAR_ORDER)
    expect(normalizeSidebarOrder(null)).toEqual(DEFAULT_SIDEBAR_ORDER)
    expect(normalizeSidebarOrder([])).toEqual(DEFAULT_SIDEBAR_ORDER)
  })

  it('respeita a ordem salva pelo admin', () => {
    const order = normalizeSidebarOrder(['materiais', 'provas'])

    expect(order[0]).toBe('materiais')
    expect(order[1]).toBe('provas')
  })

  it('acrescenta no fim a seção que ainda não foi ordenada', () => {
    // Cenário real: o admin salvou a ordem antes de a seção existir.
    const order = normalizeSidebarOrder(['materiais', 'provas'])

    expect(order).toContain('manualHistologia')
    expect(new Set(order).size).toBe(SIDEBAR_SECTION_DEFINITIONS.length)
  })

  it('nunca perde nem duplica seção, qualquer que seja a entrada', () => {
    const order = normalizeSidebarOrder(['provas', 'provas', 'provas'])

    expect(order).toHaveLength(SIDEBAR_SECTION_DEFINITIONS.length)
    expect(new Set(order).size).toBe(order.length)
  })

  it('descarta chave desconhecida (seção removida numa versão futura)', () => {
    const order = normalizeSidebarOrder(['secaoQueNaoExisteMais', 'provas'])

    expect(order).not.toContain('secaoQueNaoExisteMais' as SidebarSectionKey)
    expect(order[0]).toBe('provas')
  })

  it('ignora lixo no lugar do array sem quebrar', () => {
    for (const entrada of ['texto', 42, {}, [null, 7, 'provas']]) {
      const order = normalizeSidebarOrder(entrada)
      expect(order).toHaveLength(SIDEBAR_SECTION_DEFINITIONS.length)
      expect(new Set(order).size).toBe(order.length)
    }
  })
})

describe('getVisibleSidebarSections', () => {
  it('aplica a ordem configurada', () => {
    const visiveis = getVisibleSidebarSections(normalizeSidebarSections(), [
      'materiais',
      'provas',
    ])

    expect(visiveis[0].key).toBe('materiais')
    expect(visiveis[1].key).toBe('provas')
  })

  it('esconde do usuário comum a seção desligada', () => {
    const sections = { ...normalizeSidebarSections(), provas: false }

    const chaves = getVisibleSidebarSections(sections, undefined, false).map((s) => s.key)

    expect(chaves).not.toContain('provas')
  })

  it('admin continua enxergando tudo', () => {
    const sections = { ...normalizeSidebarSections(), provas: false }

    const chaves = getVisibleSidebarSections(sections, undefined, true).map((s) => s.key)

    expect(chaves).toContain('provas')
    expect(chaves).toHaveLength(SIDEBAR_SECTION_DEFINITIONS.length)
  })

  it('as áreas do Manual Clínico nascem desligadas para o usuário comum', () => {
    // Ligar tudo no deploy encheria o menu de todo mundo sem ninguém pedir.
    const novas: SidebarSectionKey[] = [
      'ferramentasClinicas',
      'farmacologia',
      'anatomia3d',
      'manualHistologia',
      'manualRadiologia',
      'manualEletro',
    ]
    const padrao = normalizeSidebarSections()

    for (const key of novas) {
      expect(padrao[key]).toBe(false)
    }

    const chaves = getVisibleSidebarSections(padrao, undefined, false).map((s) => s.key)
    for (const key of novas) {
      expect(chaves).not.toContain(key)
    }
  })

  it('as seções que já existiam seguem ligadas por padrão', () => {
    // Nenhuma regressão para quem nunca abriu a tela de configuração.
    const padrao = normalizeSidebarSections()
    const antigas: SidebarSectionKey[] = [
      'provas',
      'bancoQuestoes',
      'aulas',
      'flashcards',
      'mapaMental',
      'cronogramas',
      'forum',
      'games',
      'manualClinico',
      'materiais',
      'rifas',
    ]

    for (const key of antigas) {
      expect(padrao[key]).toBe(true)
    }
  })
})

describe('definições das seções', () => {
  it('toda seção tem rota e rótulo', () => {
    for (const section of SIDEBAR_SECTION_DEFINITIONS) {
      expect(section.label.trim().length).toBeGreaterThan(0)
      expect(section.href.startsWith('/')).toBe(true)
      expect(section.description.trim().length).toBeGreaterThan(0)
    }
  })

  it('não há chave nem rota repetida', () => {
    const chaves = SIDEBAR_SECTION_DEFINITIONS.map((s) => s.key)
    const rotas = SIDEBAR_SECTION_DEFINITIONS.map((s) => s.href)

    expect(new Set(chaves).size).toBe(chaves.length)
    expect(new Set(rotas).size).toBe(rotas.length)
  })

  it('getOrderedSidebarSections devolve todas as definições', () => {
    expect(getOrderedSidebarSections()).toHaveLength(SIDEBAR_SECTION_DEFINITIONS.length)
  })
})
