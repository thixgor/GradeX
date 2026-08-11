import { describe, it, expect } from 'vitest'
import {
  DEFAULT_SECTION_ICONS,
  SIDEBAR_ICON_GROUPS,
  SIDEBAR_ICON_NAMES,
  getSidebarIconLabel,
  isValidSidebarIcon,
  normalizeSidebarIcons,
} from '@/lib/sidebar-icons'
import { SIDEBAR_ICON_COMPONENTS } from '@/components/sidebar-icon-map'
import { SIDEBAR_SECTION_DEFINITIONS } from '@/lib/sidebar-sections'

/**
 * O catálogo (nomes, servidor) e o mapa de desenhos (componentes, cliente) são
 * arquivos separados de propósito: `lib/sidebar-icons` é lido por rota de API e
 * não pode importar lucide. O preço disso é poderem divergir — e a divergência
 * é silenciosa: nome sem desenho vira buraco no menu, desenho sem nome vira
 * peso morto no bundle. Estes testes fecham essa porta.
 */

describe('catálogo de ícones', () => {
  it('todo ícone do catálogo tem desenho', () => {
    const semDesenho = SIDEBAR_ICON_NAMES.filter((name) => !SIDEBAR_ICON_COMPONENTS[name])

    expect(semDesenho).toEqual([])
  })

  it('todo desenho está no catálogo (nada sobrando no bundle)', () => {
    const foraDoCatalogo = Object.keys(SIDEBAR_ICON_COMPONENTS).filter(
      (name) => !SIDEBAR_ICON_NAMES.includes(name)
    )

    expect(foraDoCatalogo).toEqual([])
  })

  it('todo desenho é de fato um componente renderizável', () => {
    for (const [name, Icon] of Object.entries(SIDEBAR_ICON_COMPONENTS)) {
      expect(Icon, `ícone "${name}" não resolveu — nome de export errado no lucide`).toBeTruthy()
      expect(['function', 'object']).toContain(typeof Icon)
    }
  })

  it('não há nome repetido', () => {
    expect(new Set(SIDEBAR_ICON_NAMES).size).toBe(SIDEBAR_ICON_NAMES.length)
  })

  it('é uma lista realmente grande e agrupada', () => {
    expect(SIDEBAR_ICON_NAMES.length).toBeGreaterThanOrEqual(100)
    expect(SIDEBAR_ICON_GROUPS.length).toBeGreaterThanOrEqual(5)
    for (const group of SIDEBAR_ICON_GROUPS) {
      expect(group.label.trim().length).toBeGreaterThan(0)
      expect(group.icons.length).toBeGreaterThan(0)
    }
  })

  it('todo ícone tem rótulo em português para o admin', () => {
    for (const group of SIDEBAR_ICON_GROUPS) {
      for (const icon of group.icons) {
        expect(icon.label.trim().length).toBeGreaterThan(0)
        expect(getSidebarIconLabel(icon.name)).toBe(icon.label)
      }
    }
  })

  it('tem ícones para as áreas médicas que motivaram a lista', () => {
    for (const esperado of ['microscope', 'scan-line', 'activity', 'stethoscope', 'pill', 'dna']) {
      expect(SIDEBAR_ICON_NAMES).toContain(esperado)
    }
  })
})

describe('normalizeSidebarIcons', () => {
  it('sem nada salvo, cada seção fica com o ícone padrão', () => {
    const icons = normalizeSidebarIcons(undefined)

    expect(icons).toEqual(DEFAULT_SECTION_ICONS)
  })

  it('respeita a escolha do admin', () => {
    const icons = normalizeSidebarIcons({ manualRadiologia: 'radiation' })

    expect(icons.manualRadiologia).toBe('radiation')
  })

  it('ícone que saiu do catálogo volta para o padrão da seção', () => {
    // Cenário real: o lucide remove um ícone numa atualização e o nome salvo
    // no banco deixa de existir. Melhor o padrão do que um buraco no menu.
    const icons = normalizeSidebarIcons({ manualRadiologia: 'icone-que-nao-existe' })

    expect(icons.manualRadiologia).toBe(DEFAULT_SECTION_ICONS.manualRadiologia)
  })

  it('ignora lixo sem quebrar', () => {
    for (const entrada of [null, 'texto', 42, [], { provas: 123 }, { provas: null }]) {
      const icons = normalizeSidebarIcons(entrada)
      expect(Object.keys(icons).sort()).toEqual(
        SIDEBAR_SECTION_DEFINITIONS.map((s) => s.key).sort()
      )
      for (const name of Object.values(icons)) {
        expect(isValidSidebarIcon(name)).toBe(true)
      }
    }
  })

  it('toda seção tem um padrão, e o padrão existe no catálogo', () => {
    for (const section of SIDEBAR_SECTION_DEFINITIONS) {
      const padrao = DEFAULT_SECTION_ICONS[section.key]
      expect(padrao, `seção "${section.key}" sem ícone padrão`).toBeTruthy()
      expect(SIDEBAR_ICON_NAMES).toContain(padrao)
      expect(SIDEBAR_ICON_COMPONENTS[padrao]).toBeTruthy()
    }
  })
})
