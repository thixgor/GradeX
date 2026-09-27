import type { SistemaId } from './tipos'

/**
 * Sistemas da Histologia com Zoom, na ordem em que o curso costuma percorrê-los:
 * da célula aos tecidos, dos tecidos aos órgãos.
 *
 * `icone` é o nome de um ícone do lucide-react, resolvido no componente — este
 * módulo continua sem dependências para poder ir ao cliente.
 */
export interface Sistema {
  id: SistemaId
  nome: string
  /** Frase de abertura da página do sistema. */
  descricao: string
  icone: string
  /** Cor de acento (hex), usada em chips e no marcador do cartão. */
  cor: string
}

export const SISTEMAS: Sistema[] = [
  {
    id: 'celula',
    nome: 'Célula e divisão celular',
    descricao:
      'Cromossomos, mitose e a referência de escala — o ponto de partida para calibrar o olhar antes dos tecidos.',
    icone: 'Dna',
    cor: '#5B3E8E',
  },
  {
    id: 'tecidos-fundamentais',
    nome: 'Tecidos fundamentais',
    descricao:
      'Tecido conjuntivo denso modelado, fibras colágenas e elásticas, adiposo branco e pardo: os tecidos isolados, antes de se combinarem em órgãos.',
    icone: 'Layers',
    cor: '#C98A2B',
  },
  {
    id: 'sangue',
    nome: 'Sangue e hematopoese',
    descricao: 'Esfregaços de sangue periférico e de medula óssea, com todas as linhagens celulares.',
    icone: 'Droplet',
    cor: '#B4232F',
  },
  {
    id: 'esqueletico',
    nome: 'Sistema esquelético',
    descricao:
      'Osso compacto e esponjoso, cartilagem de crescimento e as duas formas de ossificação.',
    icone: 'Bone',
    cor: '#8A7E6A',
  },
  {
    id: 'muscular',
    nome: 'Sistema muscular',
    descricao: 'Músculo estriado esquelético e músculo liso, em corte longitudinal e transversal.',
    icone: 'Dumbbell',
    cor: '#B4432F',
  },
  {
    id: 'nervoso',
    nome: 'Sistema nervoso',
    descricao:
      'Medula espinal, córtex cerebral, nervos periféricos e gânglios — neurônio, glia e mielina.',
    icone: 'Brain',
    cor: '#007183',
  },
  {
    id: 'cardiovascular',
    nome: 'Sistema cardiovascular',
    descricao: 'Parede cardíaca, aorta e artéria coronária: as túnicas e suas lâminas elásticas.',
    icone: 'HeartPulse',
    cor: '#C0392B',
  },
  {
    id: 'linfoide',
    nome: 'Sistema linfoide',
    descricao: 'Linfonodo, baço, timo e tonsila: o estroma reticular e a organização dos linfócitos.',
    icone: 'ShieldPlus',
    cor: '#5B3E8E',
  },
  {
    id: 'tegumentar',
    nome: 'Sistema tegumentar',
    descricao: 'Pele espessa, fina e axilar, e a cicatriz: epiderme, derme e anexos cutâneos.',
    icone: 'Hand',
    cor: '#C77D5A',
  },
  {
    id: 'respiratorio',
    nome: 'Sistema respiratório',
    descricao: 'Epiglote, traqueia e pulmão — da cartilagem elástica ao alvéolo.',
    icone: 'Wind',
    cor: '#3E7CB1',
  },
  {
    id: 'cavidade-oral',
    nome: 'Cavidade oral e dentes',
    descricao:
      'Lábio, língua e papilas, gengiva, palato, periodonto e as fases do desenvolvimento dentário.',
    icone: 'Smile',
    cor: '#D9536F',
  },
  {
    id: 'digestorio',
    nome: 'Sistema digestório',
    descricao:
      'O tubo digestório do esôfago ao canal anal: as quatro túnicas e o que muda em cada segmento.',
    icone: 'Soup',
    cor: '#B46A2F',
  },
  {
    id: 'glandulas-digestivas',
    nome: 'Glândulas anexas do digestório',
    descricao: 'Glândulas salivares, pâncreas, fígado e vesícula biliar.',
    icone: 'FlaskRound',
    cor: '#6B7F3A',
  },
  {
    id: 'urinario',
    nome: 'Sistema urinário',
    descricao: 'Rim, ureter, bexiga e uretra — do néfron ao urotélio.',
    icone: 'Filter',
    cor: '#C9A227',
  },
  {
    id: 'endocrino',
    nome: 'Sistema endócrino',
    descricao: 'Hipófise, tireoide, paratireoide e adrenal: glândulas sem ductos.',
    icone: 'Activity',
    cor: '#0E7C66',
  },
  {
    id: 'reprodutor-masculino',
    nome: 'Sistema reprodutor masculino',
    descricao: 'Testículo e epidídimo, ducto deferente, próstata e pênis.',
    icone: 'CircleDot',
    cor: '#2F6FAE',
  },
  {
    id: 'reprodutor-feminino',
    nome: 'Sistema reprodutor feminino',
    descricao: 'Ovário, tuba uterina, útero nas fases do ciclo, colo uterino e glândula mamária.',
    icone: 'Egg',
    cor: '#B03A7A',
  },
  {
    id: 'embriologia',
    nome: 'Embriologia e anexos',
    descricao: 'Blastocisto, placenta, cordão umbilical e membranas fetais.',
    icone: 'Baby',
    cor: '#C77DA0',
  },
  {
    id: 'sentidos',
    nome: 'Órgãos dos sentidos',
    descricao: 'Olho, córnea, nervo óptico e orelha interna.',
    icone: 'Eye',
    cor: '#3A6EA5',
  },
]

const POR_ID = new Map(SISTEMAS.map((s) => [s.id, s]))

export function sistemaPorId(id: string): Sistema | undefined {
  return POR_ID.get(id as SistemaId)
}
