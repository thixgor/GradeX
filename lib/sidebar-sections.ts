export type SidebarSectionKey =
  | 'provas'
  | 'bancoQuestoes'
  | 'aulas'
  | 'flashcards'
  | 'mapaMental'
  | 'cronogramas'
  | 'forum'
  | 'games'
  | 'manualClinico'
  | 'ferramentasClinicas'
  | 'farmacologia'
  | 'anatomia3d'
  | 'manualHistologia'
  | 'manualRadiologia'
  | 'manualEletro'
  | 'materiais'
  | 'rifas'

export type SidebarSectionSettings = Record<SidebarSectionKey, boolean>

/** Ordem em que as seções aparecem no menu, definida pelo admin. */
export type SidebarSectionOrder = SidebarSectionKey[]

export interface SidebarSectionDefinition {
  key: SidebarSectionKey
  label: string
  href: string
  description: string
  defaultEnabled: boolean
}

export const SIDEBAR_SECTION_DEFINITIONS: SidebarSectionDefinition[] = [
  {
    key: 'provas',
    label: 'Provas',
    href: '/provas',
    description: 'Lista de provas gerais e atividades avaliativas.',
    defaultEnabled: true,
  },
  {
    key: 'bancoQuestoes',
    label: 'Banco de Questões',
    href: '/banco-questoes',
    description: 'Questões, listas, histórico e treino por assuntos.',
    defaultEnabled: true,
  },
  {
    key: 'aulas',
    label: 'Aulas',
    href: '/aulas',
    description: 'Aulas gravadas, ao vivo e conteúdos organizados.',
    defaultEnabled: true,
  },
  {
    key: 'flashcards',
    label: 'Flashcards',
    href: '/flashcards',
    description: 'Flashcards automáticos, manuais e compartilhados.',
    defaultEnabled: true,
  },
  {
    key: 'mapaMental',
    label: 'Mapas Mentais',
    href: '/mapa-mental',
    description: 'Editor de mapas mentais e comunidade.',
    defaultEnabled: true,
  },
  {
    key: 'cronogramas',
    label: 'Cronogramas',
    href: '/cronogramas',
    description: 'Planejamento e acompanhamento de estudos.',
    defaultEnabled: true,
  },
  {
    key: 'forum',
    label: 'Fórum',
    href: '/forum',
    description: 'Discussões, dúvidas e materiais da comunidade.',
    defaultEnabled: true,
  },
  {
    key: 'games',
    label: 'Games',
    href: '/games',
    description: 'Jogos educativos e gamificação médica.',
    defaultEnabled: true,
  },
  {
    key: 'manualClinico',
    label: 'Manual Clínico',
    href: '/manual-clinico',
    description: 'Manual de patologias e consulta clínica.',
    defaultEnabled: true,
  },
  // Áreas do Manual Clínico que também podem ganhar atalho próprio no menu.
  // Nascem desligadas: quem decide promover uma delas a item de primeiro nível
  // é o admin — ligar tudo de uma vez encheria o menu de todo mundo sem que
  // ninguém tenha pedido.
  {
    key: 'ferramentasClinicas',
    label: 'Ferramentas Clínicas',
    href: '/manual-clinico/ferramentas',
    description: 'Calculadoras e escores interativos (gasometria, sepse, função renal e mais).',
    defaultEnabled: false,
  },
  {
    key: 'farmacologia',
    label: 'Farmacologia',
    href: '/manual-clinico/farmacologia',
    description: 'Fármacos por classe: mecanismo, posologia e calculadora de dose.',
    defaultEnabled: false,
  },
  {
    key: 'anatomia3d',
    label: 'Anatomia 3D',
    href: '/manual-clinico/anatomia-3d',
    description: 'Atlas 3D interativo com modelos rotacionáveis em 360°.',
    defaultEnabled: false,
  },
  {
    key: 'manualHistologia',
    label: 'Manual da Histologia',
    href: '/manual-clinico/histologia',
    description: 'Atlas de histologia com microscópio virtual e lâminas reais.',
    defaultEnabled: false,
  },
  {
    key: 'manualRadiologia',
    label: 'Manual de Radiologia',
    href: '/manual-clinico/radiologia',
    description: 'Tomografia e Raio-X no mesmo atlas, corte a corte.',
    defaultEnabled: false,
  },
  {
    key: 'manualEletro',
    label: 'Manual do Eletrocardiograma',
    href: '/manual-clinico/eletrocardiograma',
    description: 'Simulador interativo de ECG com 12 derivações em tempo real.',
    defaultEnabled: false,
  },
  {
    key: 'materiais',
    label: 'Materiais',
    href: '/materiais',
    description: 'Biblioteca e marketplace de materiais.',
    defaultEnabled: true,
  },
  {
    key: 'rifas',
    label: 'Rifas & Sorteios',
    href: '/rifas',
    description: 'Rifas, venda de números e sorteios ao vivo.',
    defaultEnabled: true,
  },
]

export const DEFAULT_SIDEBAR_SECTIONS = SIDEBAR_SECTION_DEFINITIONS.reduce(
  (acc, section) => {
    acc[section.key] = section.defaultEnabled
    return acc
  },
  {} as SidebarSectionSettings
)

export function normalizeSidebarSections(input?: Partial<SidebarSectionSettings> | null): SidebarSectionSettings {
  return SIDEBAR_SECTION_DEFINITIONS.reduce((acc, section) => {
    acc[section.key] = input?.[section.key] !== undefined
      ? Boolean(input[section.key])
      : section.defaultEnabled
    return acc
  }, {} as SidebarSectionSettings)
}

export function isSidebarSectionEnabled(
  sections: Partial<SidebarSectionSettings> | undefined | null,
  key: SidebarSectionKey
): boolean {
  return normalizeSidebarSections(sections)[key] !== false
}

/** Ordem padrão = a ordem em que as seções estão declaradas acima. */
export const DEFAULT_SIDEBAR_ORDER: SidebarSectionOrder = SIDEBAR_SECTION_DEFINITIONS.map(
  (section) => section.key
)

const KNOWN_SECTION_KEYS = new Set<string>(DEFAULT_SIDEBAR_ORDER)

/**
 * Normaliza a ordem vinda do banco. É tolerante de propósito, porque este dado
 * sobrevive a mudanças de código:
 *  - descarta chaves desconhecidas (seção removida numa versão futura);
 *  - descarta repetições (uma chave só pode ocupar uma posição);
 *  - acrescenta no fim, na ordem de declaração, toda seção que ainda não foi
 *    ordenada — é o que faz uma seção NOVA aparecer sem exigir que o admin
 *    salve a tela de novo.
 */
export function normalizeSidebarOrder(input?: unknown): SidebarSectionOrder {
  const ordered: SidebarSectionOrder = []
  const seen = new Set<string>()

  if (Array.isArray(input)) {
    for (const raw of input) {
      if (typeof raw !== 'string') continue
      if (!KNOWN_SECTION_KEYS.has(raw) || seen.has(raw)) continue
      seen.add(raw)
      ordered.push(raw as SidebarSectionKey)
    }
  }

  for (const key of DEFAULT_SIDEBAR_ORDER) {
    if (!seen.has(key)) ordered.push(key)
  }

  return ordered
}

/** Definições na ordem configurada pelo admin. Não filtra por habilitado. */
export function getOrderedSidebarSections(order?: unknown): SidebarSectionDefinition[] {
  const byKey = new Map(SIDEBAR_SECTION_DEFINITIONS.map((section) => [section.key, section]))
  return normalizeSidebarOrder(order)
    .map((key) => byKey.get(key))
    .filter((section): section is SidebarSectionDefinition => !!section)
}

/**
 * Definições que devem aparecer no menu: na ordem configurada e já sem as
 * desabilitadas. `isAdmin` enxerga tudo, como no resto da plataforma.
 */
export function getVisibleSidebarSections(
  sections: Partial<SidebarSectionSettings> | undefined | null,
  order?: unknown,
  isAdmin = false
): SidebarSectionDefinition[] {
  const normalized = normalizeSidebarSections(sections)
  return getOrderedSidebarSections(order).filter(
    (section) => isAdmin || normalized[section.key] !== false
  )
}
