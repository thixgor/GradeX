export type SidebarSectionKey =
  | 'provas'
  | 'bancoQuestoes'
  | 'aulas'
  | 'flashcards'
  | 'cronogramas'
  | 'forum'
  | 'games'
  | 'manualClinico'
  | 'materiais'

export type SidebarSectionSettings = Record<SidebarSectionKey, boolean>

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
  {
    key: 'materiais',
    label: 'Materiais',
    href: '/materiais',
    description: 'Biblioteca e marketplace de materiais.',
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
