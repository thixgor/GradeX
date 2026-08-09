/**
 * Direção de arte do Manual da Histologia.
 *
 * A paleta não é escolhida por gosto: ela vem do que se vê na bancada.
 *
 * - **marfim de lâmina** — o fundo quente do vidro sobre a luz transmitida. É
 *   também o `--background` do GradeX, então o módulo pousa no aplicativo sem
 *   emenda;
 * - **grafite** — o corpo do microscópio, usado nas superfícies do visualizador;
 * - **hematoxilina** — o violeta-azulado dos núcleos. Identifica navegação,
 *   estrutura e currículo;
 * - **eosina** — o rosa-coral do citoplasma e da matriz. Identifica conteúdo,
 *   destaque e progresso;
 * - **petróleo** — extraído do logotipo oficial, para o instrumento em si;
 * - **vermelho de marcador** — o mesmo vermelho das setas do acervo. Reservado
 *   *exclusivamente* às camadas de marcação, para que vermelho signifique
 *   sempre "olhe aqui" e nunca "erro" ou "botão".
 *
 * A regra que sustenta tudo: **nenhuma dessas cores carrega informação
 * sozinha.** Cor acompanha rótulo, ícone ou forma — WCAG 2.2 AA, mas também
 * porque um aluno daltônico precisa distinguir o overlay ativo do inativo.
 */

export const PALETA = {
  marfim: '#F6F1E8',
  vidro: '#FFFCF7',
  grafite: '#1F2724',
  grafiteClaro: '#3A4441',
  hematoxilina: '#5B3E8E',
  hematoxilinaClara: '#8B6BC4',
  eosina: '#D9536F',
  eosinaClara: '#EE8AA0',
  petroleo: '#007183',
  petroleoClaro: '#46AEAA',
  marcador: '#D42B1F',
} as const

export type CorDoSetor = 'hematoxilina' | 'eosina' | 'petroleo' | 'ambar'

export interface TemaDeCor {
  texto: string
  fundo: string
  borda: string
  ativo: string
  hover: string
  /** Cor crua, para SVG e canvas — onde classe do Tailwind não chega. */
  crua: string
}

export const TEMA: Record<CorDoSetor, TemaDeCor> = {
  hematoxilina: {
    texto: 'text-violet-700 dark:text-violet-300',
    fundo: 'bg-violet-500/10',
    borda: 'border-violet-500/30',
    ativo: 'bg-violet-600 text-white border-violet-600',
    hover: 'hover:border-violet-500/45',
    crua: PALETA.hematoxilina,
  },
  eosina: {
    texto: 'text-rose-700 dark:text-rose-300',
    fundo: 'bg-rose-500/10',
    borda: 'border-rose-500/30',
    ativo: 'bg-rose-600 text-white border-rose-600',
    hover: 'hover:border-rose-500/45',
    crua: PALETA.eosina,
  },
  petroleo: {
    texto: 'text-teal-700 dark:text-teal-300',
    fundo: 'bg-teal-500/10',
    borda: 'border-teal-500/30',
    ativo: 'bg-teal-700 text-white border-teal-700',
    hover: 'hover:border-teal-500/45',
    crua: PALETA.petroleo,
  },
  ambar: {
    texto: 'text-amber-700 dark:text-amber-300',
    fundo: 'bg-amber-500/10',
    borda: 'border-amber-500/30',
    ativo: 'bg-amber-600 text-white border-amber-600',
    hover: 'hover:border-amber-500/45',
    crua: '#B45309',
  },
}

export function tema(cor: CorDoSetor): TemaDeCor {
  return TEMA[cor]
}

/**
 * Cor e ícone de cada setor do currículo. A associação é fixa: o aluno aprende
 * que violeta é Tecidos em três minutos, e trocar isso entre páginas
 * desperdiçaria esse aprendizado.
 */
export const SETORES: Record<
  string,
  { cor: CorDoSetor; icone: string; resumo: string }
> = {
  'histologia-basica': {
    cor: 'petroleo',
    icone: 'flask',
    resumo:
      'Como uma peça vira lâmina: fixação, inclusão, microtomia e coloração. É o capítulo que explica por que a imagem tem a aparência que tem.',
  },
  celulas: {
    cor: 'hematoxilina',
    icone: 'atom',
    resumo:
      'A célula ao microscópio óptico e eletrônico: compartimentos, organelas, superfície e divisão celular.',
  },
  tecidos: {
    cor: 'eosina',
    icone: 'layers',
    resumo:
      'Os quatro tecidos fundamentais — epitelial, conjuntivo, muscular e nervoso — com os critérios que os distinguem na lâmina.',
  },
  'orgaos-e-sistemas': {
    cor: 'ambar',
    icone: 'heart',
    resumo:
      'Como os tecidos se combinam em órgãos: arquitetura, camadas e o padrão de cada sistema, aparelho por aparelho.',
  },
}

export function setorDe(caminho: string[] | string): { cor: CorDoSetor; icone: string; resumo: string } {
  const raiz = Array.isArray(caminho) ? caminho[0] : caminho.split('/')[0]
  return SETORES[raiz] ?? { cor: 'petroleo', icone: 'microscope', resumo: '' }
}

/**
 * Grão microscópico.
 *
 * Uma textura sutil de ruído em SVG, aplicada como `background-image` — o
 * mesmo granulado que se vê no campo iluminado. Fica em 3% de opacidade: o
 * suficiente para o fundo não parecer papel digital, longe o bastante para não
 * disputar com o texto. Abaixo de `prefers-reduced-motion` ela não é animada
 * (nunca é), e sob `forced-colors` some junto com o resto da decoração.
 */
export const GRAO_MICROSCOPICO =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23g)' opacity='0.5'/%3E%3C/svg%3E\")"

/** Retícula do micrômetro ocular, para o fundo do visualizador. */
export const RETICULA =
  'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)'
