import { SIDEBAR_SECTION_DEFINITIONS, type SidebarSectionKey } from './sidebar-sections'

/**
 * Catálogo de ícones que o admin pode associar a cada seção do menu.
 *
 * Aqui só moram NOMES e rótulos — nada de importar lucide. Este módulo é lido
 * por código de servidor (validação do que vem do banco em /api/admin/settings
 * e /api/bootstrap), e puxar componentes React ali quebraria o build.
 *
 * O desenho de cada ícone vive em `components/sidebar-icon-map.tsx`, que é
 * cliente e importa um a um — nunca `import * as Icons`, que anularia o
 * tree-shaking e arrastaria os ~1.400 ícones do pacote para o bundle.
 *
 * Os dois lados são mantidos em sincronia por teste: um nome aqui sem desenho
 * lá renderizaria um buraco no menu.
 */

export interface SidebarIconOption {
  /** Nome do ícone no lucide, em kebab-case (ex.: 'heart-pulse'). */
  name: string
  /** Como o admin lê a opção na tela. */
  label: string
}

export interface SidebarIconGroup {
  label: string
  icons: SidebarIconOption[]
}

export const SIDEBAR_ICON_GROUPS: SidebarIconGroup[] = [
  {
    label: 'Medicina e clínica',
    icons: [
      { name: 'stethoscope', label: 'Estetoscópio' },
      { name: 'heart-pulse', label: 'Batimento cardíaco' },
      { name: 'activity', label: 'Traçado / ECG' },
      { name: 'heart', label: 'Coração' },
      { name: 'pill', label: 'Comprimido' },
      { name: 'syringe', label: 'Seringa' },
      { name: 'thermometer', label: 'Termômetro' },
      { name: 'cross', label: 'Cruz médica' },
      { name: 'shield-plus', label: 'Escudo com cruz' },
      { name: 'clipboard-check', label: 'Prancheta conferida' },
      { name: 'clipboard-list', label: 'Prancheta com lista' },
      { name: 'bed', label: 'Leito' },
    ],
  },
  {
    label: 'Corpo e anatomia',
    icons: [
      { name: 'brain', label: 'Cérebro' },
      { name: 'brain-circuit', label: 'Cérebro em circuito' },
      { name: 'bone', label: 'Osso' },
      { name: 'dna', label: 'DNA' },
      { name: 'ear', label: 'Orelha' },
      { name: 'eye', label: 'Olho' },
      { name: 'footprints', label: 'Pegadas' },
      { name: 'person-standing', label: 'Corpo humano' },
      { name: 'accessibility', label: 'Acessibilidade' },
      { name: 'baby', label: 'Bebê / neonatal' },
    ],
  },
  {
    label: 'Laboratório e ciência',
    icons: [
      { name: 'microscope', label: 'Microscópio' },
      { name: 'test-tube', label: 'Tubo de ensaio' },
      { name: 'test-tubes', label: 'Tubos de ensaio' },
      { name: 'test-tube-2', label: 'Tubo com amostra' },
      { name: 'flask-conical', label: 'Erlenmeyer' },
      { name: 'flask-round', label: 'Balão de fundo redondo' },
      { name: 'beaker', label: 'Béquer' },
      { name: 'atom', label: 'Átomo' },
      { name: 'biohazard', label: 'Risco biológico' },
      { name: 'droplet', label: 'Gota' },
      { name: 'droplets', label: 'Gotas' },
    ],
  },
  {
    label: 'Imagem e diagnóstico',
    icons: [
      { name: 'scan-line', label: 'Escaneamento (linha)' },
      { name: 'scan', label: 'Escaneamento (moldura)' },
      { name: 'radiation', label: 'Radiação' },
      { name: 'waves', label: 'Ondas / ultrassom' },
      { name: 'orbit', label: 'Órbita / corte tomográfico' },
      { name: 'gauge', label: 'Medidor' },
      { name: 'camera', label: 'Câmera' },
      { name: 'image', label: 'Imagem' },
      { name: 'film', label: 'Filme radiográfico' },
      { name: 'video', label: 'Vídeo' },
      { name: 'layers', label: 'Camadas' },
      { name: 'box', label: 'Cubo 3D' },
    ],
  },
  {
    label: 'Estudo e conteúdo',
    icons: [
      { name: 'book-open', label: 'Livro aberto' },
      { name: 'book', label: 'Livro' },
      { name: 'book-marked', label: 'Livro marcado' },
      { name: 'book-heart', label: 'Livro com coração' },
      { name: 'book-open-check', label: 'Livro conferido' },
      { name: 'library', label: 'Biblioteca' },
      { name: 'graduation-cap', label: 'Formatura' },
      { name: 'scroll', label: 'Pergaminho' },
      { name: 'scroll-text', label: 'Pergaminho escrito' },
      { name: 'newspaper', label: 'Jornal' },
      { name: 'file-text', label: 'Documento' },
      { name: 'file-check', label: 'Documento conferido' },
      { name: 'file-heart', label: 'Documento favorito' },
      { name: 'files', label: 'Documentos' },
      { name: 'highlighter', label: 'Marca-texto' },
      { name: 'pencil', label: 'Lápis' },
    ],
  },
  {
    label: 'Organização',
    icons: [
      { name: 'folder', label: 'Pasta' },
      { name: 'folder-open', label: 'Pasta aberta' },
      { name: 'folder-heart', label: 'Pasta favorita' },
      { name: 'bookmark', label: 'Marcador' },
      { name: 'list', label: 'Lista' },
      { name: 'list-checks', label: 'Checklist' },
      { name: 'table', label: 'Tabela' },
      { name: 'database', label: 'Banco de dados' },
      { name: 'network', label: 'Rede / mapa mental' },
      { name: 'calendar', label: 'Calendário' },
      { name: 'calendar-days', label: 'Calendário com dias' },
      { name: 'clock', label: 'Relógio' },
      { name: 'timer', label: 'Cronômetro' },
    ],
  },
  {
    label: 'Ferramentas e dados',
    icons: [
      { name: 'calculator', label: 'Calculadora' },
      { name: 'ruler', label: 'Régua' },
      { name: 'scale', label: 'Balança' },
      { name: 'compass', label: 'Bússola' },
      { name: 'target', label: 'Alvo' },
      { name: 'crosshair', label: 'Mira' },
      { name: 'search', label: 'Busca' },
      { name: 'bar-chart', label: 'Gráfico de barras' },
      { name: 'pie-chart', label: 'Gráfico de pizza' },
      { name: 'trending-up', label: 'Tendência de alta' },
      { name: 'percent', label: 'Porcentagem' },
      { name: 'cpu', label: 'Processador' },
      { name: 'monitor', label: 'Monitor' },
      { name: 'smartphone', label: 'Celular' },
    ],
  },
  {
    label: 'Destaques e gamificação',
    icons: [
      { name: 'star', label: 'Estrela' },
      { name: 'sparkles', label: 'Brilhos' },
      { name: 'trophy', label: 'Troféu' },
      { name: 'medal', label: 'Medalha' },
      { name: 'award', label: 'Prêmio' },
      { name: 'flame', label: 'Chama / ofensiva' },
      { name: 'rocket', label: 'Foguete' },
      { name: 'lightbulb', label: 'Lâmpada' },
      { name: 'puzzle', label: 'Quebra-cabeça' },
      { name: 'gamepad-2', label: 'Controle de videogame' },
      { name: 'dices', label: 'Dados' },
      { name: 'swords', label: 'Espadas / desafio' },
      { name: 'zap', label: 'Raio' },
      { name: 'wand-2', label: 'Varinha / IA' },
    ],
  },
  {
    label: 'Vendas e comunidade',
    icons: [
      { name: 'shopping-cart', label: 'Carrinho' },
      { name: 'shopping-bag', label: 'Sacola' },
      { name: 'store', label: 'Loja' },
      { name: 'ticket', label: 'Ingresso / rifa' },
      { name: 'tag', label: 'Etiqueta' },
      { name: 'banknote', label: 'Cédula' },
      { name: 'coins', label: 'Moedas' },
      { name: 'wallet', label: 'Carteira' },
      { name: 'users', label: 'Pessoas' },
      { name: 'user', label: 'Pessoa' },
      { name: 'message-circle', label: 'Balão de conversa' },
      { name: 'megaphone', label: 'Megafone' },
      { name: 'bell', label: 'Sino' },
      { name: 'share-2', label: 'Compartilhar' },
    ],
  },
  {
    label: 'Bem-estar e natureza',
    icons: [
      { name: 'leaf', label: 'Folha' },
      { name: 'apple', label: 'Maçã' },
      { name: 'dumbbell', label: 'Halter' },
      { name: 'sun', label: 'Sol' },
      { name: 'moon', label: 'Lua' },
      { name: 'wind', label: 'Vento / respiração' },
      { name: 'smile', label: 'Sorriso' },
      { name: 'globe', label: 'Globo' },
      { name: 'map', label: 'Mapa' },
      { name: 'shield', label: 'Escudo' },
      { name: 'lock', label: 'Cadeado' },
      { name: 'key', label: 'Chave' },
      { name: 'home', label: 'Início' },
      { name: 'file-search', label: 'Documento em busca' },
    ],
  },
]

/** Todos os nomes do catálogo, achatados. */
export const SIDEBAR_ICON_NAMES: string[] = SIDEBAR_ICON_GROUPS.flatMap((group) =>
  group.icons.map((icon) => icon.name)
)

const ICON_NAME_SET = new Set(SIDEBAR_ICON_NAMES)

export function isValidSidebarIcon(name: unknown): name is string {
  return typeof name === 'string' && ICON_NAME_SET.has(name)
}

/** Rótulo em português de um ícone, para leitores de tela e tooltip. */
export function getSidebarIconLabel(name: string): string {
  for (const group of SIDEBAR_ICON_GROUPS) {
    const found = group.icons.find((icon) => icon.name === name)
    if (found) return found.label
  }
  return name
}

/** Ícone usado quando a seção nunca teve escolha própria. */
export const DEFAULT_SECTION_ICONS: Record<SidebarSectionKey, string> = {
  provas: 'file-text',
  bancoQuestoes: 'database',
  aulas: 'video',
  flashcards: 'brain',
  mapaMental: 'network',
  cronogramas: 'book-marked',
  forum: 'message-circle',
  games: 'gamepad-2',
  manualClinico: 'heart-pulse',
  ferramentasClinicas: 'calculator',
  farmacologia: 'pill',
  anatomia3d: 'box',
  manualHistologia: 'microscope',
  manualRadiologia: 'scan-line',
  manualEletro: 'activity',
  materiais: 'book-open',
  rifas: 'ticket',
}

export type SidebarSectionIcons = Record<SidebarSectionKey, string>

/**
 * Normaliza os ícones vindos do banco. Como esse dado sobrevive a mudanças de
 * código, um nome que saiu do catálogo (ícone removido numa atualização do
 * lucide) volta para o padrão da seção em vez de virar um buraco no menu.
 */
export function normalizeSidebarIcons(input?: unknown): SidebarSectionIcons {
  const stored = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>

  return SIDEBAR_SECTION_DEFINITIONS.reduce((acc, section) => {
    const chosen = stored[section.key]
    acc[section.key] = isValidSidebarIcon(chosen) ? chosen : DEFAULT_SECTION_ICONS[section.key]
    return acc
  }, {} as SidebarSectionIcons)
}
