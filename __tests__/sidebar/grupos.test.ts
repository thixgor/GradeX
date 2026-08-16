import { describe, it, expect } from 'vitest'
import {
  DEFAULT_SECTION_GROUPS,
  DEFAULT_SIDEBAR_GROUPS,
  MAX_SIDEBAR_GROUPS,
  assignSectionToGroup,
  buildFullSidebarTree,
  buildSidebarTree,
  moveSidebarNode,
  normalizeSidebarGroups,
  normalizeSidebarSectionGroups,
  removeSidebarGroup,
  toSidebarGroupKey,
  uniqueSidebarGroupKey,
  type SidebarGroupDefinition,
} from '@/lib/sidebar-groups'
import {
  DEFAULT_SIDEBAR_ORDER,
  getVisibleSidebarSections,
  normalizeSidebarSections,
  type SidebarSectionKey,
} from '@/lib/sidebar-sections'
import { SIDEBAR_ICON_NAMES } from '@/lib/sidebar-icons'

/**
 * Grupos são configuração do admin salva no banco — mesmo contrato duro da
 * ordem das seções: sobrevive a mudanças de código, a grupo apagado, a lixo
 * escrito à mão. Estes testes fixam o que nunca pode acontecer, sendo o pior
 * caso "o usuário perde acesso a uma área porque o grupo dela sumiu".
 */

const GRUPOS: SidebarGroupDefinition[] = [
  { key: 'estudar', label: 'Estudar', icon: 'book-open', defaultOpen: true },
  { key: 'manual-clinico', label: 'Manual Clínico', icon: 'heart-pulse', defaultOpen: false },
]

describe('normalizeSidebarGroups', () => {
  it('sem nada salvo, devolve o grupo padrão do Manual Clínico', () => {
    expect(normalizeSidebarGroups(undefined)).toEqual(DEFAULT_SIDEBAR_GROUPS)
    expect(normalizeSidebarGroups(null)).toEqual(DEFAULT_SIDEBAR_GROUPS)
    expect(normalizeSidebarGroups('lixo')).toEqual(DEFAULT_SIDEBAR_GROUPS)
  })

  it('array vazio é escolha do admin — menu sem grupo nenhum', () => {
    // Diferente de "nunca configurado": aqui o admin apagou todos os grupos e
    // reimpor o padrão desfaria a decisão dele a cada carregamento.
    expect(normalizeSidebarGroups([])).toEqual([])
  })

  it('descarta entrada quebrada sem derrubar as boas', () => {
    const grupos = normalizeSidebarGroups([
      { key: 'valido', label: 'Válido', icon: 'folder', defaultOpen: true },
      null,
      'texto',
      { label: 'sem chave' },
      { key: 'CHAVE INVÁLIDA!', label: 'x' },
    ])

    expect(grupos).toHaveLength(1)
    expect(grupos[0].key).toBe('valido')
  })

  it('descarta chave repetida', () => {
    const grupos = normalizeSidebarGroups([
      { key: 'a', label: 'Primeiro', icon: 'folder', defaultOpen: false },
      { key: 'a', label: 'Segundo', icon: 'folder', defaultOpen: false },
    ])

    expect(grupos).toHaveLength(1)
    expect(grupos[0].label).toBe('Primeiro')
  })

  it('ícone fora do catálogo vira o padrão em vez de buraco no menu', () => {
    const grupos = normalizeSidebarGroups([{ key: 'a', label: 'A', icon: 'icone-que-nao-existe' }])

    expect(SIDEBAR_ICON_NAMES).toContain(grupos[0].icon)
  })

  it('rótulo vazio cai para a chave, nunca fica em branco', () => {
    const grupos = normalizeSidebarGroups([{ key: 'meu-grupo', label: '   ' }])

    expect(grupos[0].label).toBe('meu-grupo')
  })

  it('respeita o teto de grupos', () => {
    const muitos = Array.from({ length: MAX_SIDEBAR_GROUPS + 5 }, (_, i) => ({
      key: `g${i}`,
      label: `G${i}`,
      icon: 'folder',
      defaultOpen: false,
    }))

    expect(normalizeSidebarGroups(muitos)).toHaveLength(MAX_SIDEBAR_GROUPS)
  })
})

describe('normalizeSidebarSectionGroups', () => {
  it('sem nada salvo, agrupa as áreas do Manual Clínico', () => {
    const vinculos = normalizeSidebarSectionGroups(undefined, DEFAULT_SIDEBAR_GROUPS)

    expect(vinculos).toEqual(DEFAULT_SECTION_GROUPS)
  })

  it('objeto vazio é escolha do admin — nenhuma seção agrupada', () => {
    expect(normalizeSidebarSectionGroups({}, DEFAULT_SIDEBAR_GROUPS)).toEqual({})
  })

  it('seção apontando para grupo apagado volta ao primeiro nível', () => {
    const vinculos = normalizeSidebarSectionGroups(
      { provas: 'grupo-que-o-admin-apagou', aulas: 'estudar' },
      GRUPOS
    )

    expect(vinculos.provas).toBeUndefined()
    expect(vinculos.aulas).toBe('estudar')
  })

  it('descarta seção desconhecida (removida numa versão futura)', () => {
    const vinculos = normalizeSidebarSectionGroups({ secaoQueNaoExiste: 'estudar' }, GRUPOS)

    expect(vinculos).toEqual({})
  })
})

describe('buildSidebarTree', () => {
  const todas = (order = DEFAULT_SIDEBAR_ORDER) =>
    getVisibleSidebarSections(normalizeSidebarSections(), order, true)

  it('agrupa as seções vinculadas e mantém o resto no primeiro nível', () => {
    const arvore = buildSidebarTree(todas(), DEFAULT_SIDEBAR_GROUPS, DEFAULT_SECTION_GROUPS)

    const grupo = arvore.find((no) => no.type === 'group')
    expect(grupo).toBeDefined()
    expect(grupo?.type === 'group' && grupo.sections.map((s) => s.key)).toContain('manualClinico')

    const provas = arvore.find((no) => no.type === 'section' && no.section.key === 'provas')
    expect(provas).toBeDefined()
  })

  it('nenhuma seção se perde no caminho', () => {
    const secoes = todas()
    const arvore = buildSidebarTree(secoes, DEFAULT_SIDEBAR_GROUPS, DEFAULT_SECTION_GROUPS)

    const chaves = arvore.flatMap((no) =>
      no.type === 'section' ? [no.section.key] : no.sections.map((s) => s.key)
    )

    expect(new Set(chaves)).toEqual(new Set(secoes.map((s) => s.key)))
  })

  it('grupo com uma seção só é desmontado — a área volta ao primeiro nível', () => {
    // É exatamente a instalação padrão: só "Manual Clínico" ligada, sem as
    // subáreas. O menu tem de continuar idêntico ao de antes dos grupos.
    const visiveis = getVisibleSidebarSections(normalizeSidebarSections(), DEFAULT_SIDEBAR_ORDER, false)
    const arvore = buildSidebarTree(visiveis, DEFAULT_SIDEBAR_GROUPS, DEFAULT_SECTION_GROUPS)

    expect(arvore.every((no) => no.type === 'section')).toBe(true)
    expect(arvore.some((no) => no.type === 'section' && no.section.key === 'manualClinico')).toBe(true)
  })

  it('grupo aparece na posição do primeiro membro, mesmo com a ordem embaralhada', () => {
    const order = ['manualExames', 'provas', 'manualClinico', 'aulas'] as SidebarSectionKey[]
    const arvore = buildSidebarTree(todas(order), DEFAULT_SIDEBAR_GROUPS, DEFAULT_SECTION_GROUPS)

    expect(arvore[0].type).toBe('group')
    expect(arvore[1].type === 'section' && arvore[1].section.key).toBe('provas')
  })

  it('grupo sem nenhuma seção visível não aparece', () => {
    const grupoVazio: SidebarGroupDefinition[] = [
      { key: 'vazio', label: 'Vazio', icon: 'folder', defaultOpen: false },
    ]
    const arvore = buildSidebarTree(todas(), grupoVazio, {})

    expect(arvore.every((no) => no.type === 'section')).toBe(true)
  })
})

describe('moveSidebarNode', () => {
  it('move o grupo inteiro como bloco, sem partir os membros', () => {
    const ordem = moveSidebarNode(
      DEFAULT_SIDEBAR_ORDER,
      DEFAULT_SIDEBAR_GROUPS,
      DEFAULT_SECTION_GROUPS,
      { type: 'group', key: 'manual-clinico' },
      -1
    )

    const indices = Object.keys(DEFAULT_SECTION_GROUPS).map((key) =>
      ordem.indexOf(key as SidebarSectionKey)
    )
    const min = Math.min(...indices)
    const max = Math.max(...indices)

    expect(max - min).toBe(indices.length - 1)
    expect(ordem).toHaveLength(DEFAULT_SIDEBAR_ORDER.length)
    expect(new Set(ordem).size).toBe(ordem.length)
  })

  it('seção dentro do grupo anda apenas entre os irmãos', () => {
    const antes = buildFullSidebarTree(
      DEFAULT_SIDEBAR_ORDER,
      DEFAULT_SIDEBAR_GROUPS,
      DEFAULT_SECTION_GROUPS
    )
    const grupoAntes = antes.find((no) => no.type === 'group')
    const segundo = grupoAntes?.type === 'group' ? grupoAntes.sections[1].key : null
    expect(segundo).toBeTruthy()

    const ordem = moveSidebarNode(
      DEFAULT_SIDEBAR_ORDER,
      DEFAULT_SIDEBAR_GROUPS,
      DEFAULT_SECTION_GROUPS,
      { type: 'section', key: segundo as SidebarSectionKey },
      -1
    )

    const depois = buildFullSidebarTree(ordem, DEFAULT_SIDEBAR_GROUPS, DEFAULT_SECTION_GROUPS)
    const grupoDepois = depois.find((no) => no.type === 'group')

    expect(grupoDepois?.type === 'group' && grupoDepois.sections[0].key).toBe(segundo)
    // Continua dentro do grupo: mover não pode expulsar a seção.
    expect(grupoDepois?.type === 'group' && grupoDepois.sections).toHaveLength(
      grupoAntes?.type === 'group' ? grupoAntes.sections.length : -1
    )
  })

  it('nas pontas, não faz nada e devolve uma ordem íntegra', () => {
    const ordem = moveSidebarNode(
      DEFAULT_SIDEBAR_ORDER,
      DEFAULT_SIDEBAR_GROUPS,
      DEFAULT_SECTION_GROUPS,
      { type: 'section', key: 'provas' },
      -1
    )

    expect(new Set(ordem)).toEqual(new Set(DEFAULT_SIDEBAR_ORDER))
  })
})

describe('assignSectionToGroup', () => {
  it('põe a seção no grupo e a leva para junto dos novos irmãos', () => {
    const resultado = assignSectionToGroup(
      DEFAULT_SIDEBAR_ORDER,
      DEFAULT_SIDEBAR_GROUPS,
      DEFAULT_SECTION_GROUPS,
      'flashcards',
      'manual-clinico'
    )

    expect(resultado.assignments.flashcards).toBe('manual-clinico')

    const arvore = buildFullSidebarTree(
      resultado.order,
      DEFAULT_SIDEBAR_GROUPS,
      resultado.assignments
    )
    const grupo = arvore.find((no) => no.type === 'group')
    expect(grupo?.type === 'group' && grupo.sections.map((s) => s.key)).toContain('flashcards')
    expect(new Set(resultado.order)).toEqual(new Set(DEFAULT_SIDEBAR_ORDER))
  })

  it('tira a seção do grupo quando o destino é nulo', () => {
    const resultado = assignSectionToGroup(
      DEFAULT_SIDEBAR_ORDER,
      DEFAULT_SIDEBAR_GROUPS,
      DEFAULT_SECTION_GROUPS,
      'manualExames',
      null
    )

    expect(resultado.assignments.manualExames).toBeUndefined()
  })

  it('ignora grupo inexistente em vez de criar um vínculo órfão', () => {
    const resultado = assignSectionToGroup(
      DEFAULT_SIDEBAR_ORDER,
      DEFAULT_SIDEBAR_GROUPS,
      DEFAULT_SECTION_GROUPS,
      'provas',
      'grupo-fantasma'
    )

    expect(resultado.assignments.provas).toBeUndefined()
  })
})

describe('removeSidebarGroup', () => {
  it('apaga o grupo e devolve as áreas ao primeiro nível — nenhuma some', () => {
    const resultado = removeSidebarGroup(
      DEFAULT_SIDEBAR_ORDER,
      DEFAULT_SIDEBAR_GROUPS,
      DEFAULT_SECTION_GROUPS,
      'manual-clinico'
    )

    expect(resultado.groups).toHaveLength(0)
    expect(resultado.assignments).toEqual({})
    expect(new Set(resultado.order)).toEqual(new Set(DEFAULT_SIDEBAR_ORDER))

    const arvore = buildFullSidebarTree(resultado.order, resultado.groups, resultado.assignments)
    expect(arvore.every((no) => no.type === 'section')).toBe(true)
  })
})

describe('chaves de grupo', () => {
  it('gera slug legível a partir do nome digitado', () => {
    expect(toSidebarGroupKey('Manual Clínico')).toBe('manual-clinico')
    expect(toSidebarGroupKey('  Estudar!  ')).toBe('estudar')
  })

  it('nome só de símbolos ainda produz chave utilizável', () => {
    expect(toSidebarGroupKey('!!!')).toMatch(/^grupo-/)
  })

  it('não repete chave já usada', () => {
    expect(uniqueSidebarGroupKey('estudar', ['estudar'])).toBe('estudar-2')
    expect(uniqueSidebarGroupKey('estudar', ['estudar', 'estudar-2'])).toBe('estudar-3')
  })

  it('a chave gerada passa pela normalização', () => {
    const key = toSidebarGroupKey('Área Clínica')
    const grupos = normalizeSidebarGroups([{ key, label: 'Área Clínica', icon: 'folder' }])

    expect(grupos).toHaveLength(1)
    expect(grupos[0].key).toBe(key)
  })
})
