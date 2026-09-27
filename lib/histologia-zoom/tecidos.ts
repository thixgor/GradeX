import type { GrupoDeTecido, TipoDeTecido } from './tipos'

/**
 * Classificação dos tecidos usada nas fichas.
 *
 * O rótulo é sempre **completo**: "Conjuntivo propriamente dito · denso não
 * modelado (irregular)", e não só "conjuntivo". A distinção entre frouxo e
 * denso, e entre modelado e não modelado, é exatamente o que a prova prática
 * cobra — e é o que some quando a tabela abrevia.
 *
 * Os dois nomes de cada subtipo (modelado/regular, não modelado/irregular)
 * aparecem juntos porque os livros brasileiros usam um e as aulas, o outro.
 */

export interface DescricaoDeTecido {
  grupo: GrupoDeTecido
  /** Rótulo curto, para chips e gráficos. */
  curto: string
  /** Classificação completa. */
  completo: string
  /** Critério de reconhecimento em uma linha. */
  criterio: string
}

/**
 * Cores dos grupos para a barra de composição. Paleta categórica validada
 * (skill de dataviz: faixa de luminosidade, croma, separação para daltonismo e
 * visão normal) — em ordem fixa, com passos próprios para o modo escuro. A cor
 * nunca aparece sozinha: toda barra tem legenda e a tabela ao lado.
 */
export const GRUPOS: Record<GrupoDeTecido, { nome: string; cor: string; corEscura: string }> = {
  epitelial: { nome: 'Epitelial', cor: '#D9536F', corEscura: '#E0607B' },
  'conjuntivo-propriamente-dito': { nome: 'Conjuntivo propriamente dito', cor: '#D08A1E', corEscura: '#B8860B' },
  'conjuntivo-especializado': { nome: 'Conjuntivo especializado', cor: '#7B5BC4', corEscura: '#8C6FD6' },
  muscular: { nome: 'Muscular', cor: '#B83A2A', corEscura: '#C94A38' },
  nervoso: { nome: 'Nervoso', cor: '#0A8FA3', corEscura: '#1A9DB5' },
  dentario: { nome: 'Tecidos dentários', cor: '#5E9A1C', corEscura: '#6AA82A' },
}

export const ORDEM_DOS_GRUPOS: GrupoDeTecido[] = [
  'epitelial',
  'conjuntivo-propriamente-dito',
  'conjuntivo-especializado',
  'muscular',
  'nervoso',
  'dentario',
]

export const TECIDOS: Record<TipoDeTecido, DescricaoDeTecido> = {
  'epitelial-revestimento': {
    grupo: 'epitelial',
    curto: 'Epitélio de revestimento',
    completo: 'Epitelial · de revestimento',
    criterio: 'Células justapostas sobre lâmina basal, sem vasos, forrando superfície ou luz.',
  },
  'epitelial-glandular-exocrino': {
    grupo: 'epitelial',
    curto: 'Glandular exócrino',
    completo: 'Epitelial · glandular exócrino',
    criterio: 'Unidades secretoras (ácinos, túbulos) que drenam por ductos para uma superfície.',
  },
  'epitelial-glandular-endocrino': {
    grupo: 'epitelial',
    curto: 'Glandular endócrino',
    completo: 'Epitelial · glandular endócrino',
    criterio: 'Cordões, ilhotas ou folículos sem ductos, rentes a capilares fenestrados.',
  },
  'conjuntivo-frouxo': {
    grupo: 'conjuntivo-propriamente-dito',
    curto: 'Conjuntivo frouxo',
    completo: 'Conjuntivo propriamente dito · frouxo (areolar)',
    criterio: 'Fibras finas e esparsas, muita substância fundamental, células variadas e vasos.',
  },
  'conjuntivo-denso-nao-modelado': {
    grupo: 'conjuntivo-propriamente-dito',
    curto: 'Denso não modelado',
    completo: 'Conjuntivo propriamente dito · denso não modelado (irregular)',
    criterio: 'Feixes colágenos grossos cruzando em várias direções; poucas células.',
  },
  'conjuntivo-denso-modelado': {
    grupo: 'conjuntivo-propriamente-dito',
    curto: 'Denso modelado',
    completo: 'Conjuntivo propriamente dito · denso modelado (regular)',
    criterio: 'Feixes colágenos paralelos, com fibroblastos achatados enfileirados entre eles.',
  },
  'conjuntivo-reticular': {
    grupo: 'conjuntivo-especializado',
    curto: 'Reticular',
    completo: 'Conjuntivo especializado · reticular',
    criterio: 'Rede de fibras reticulares (colágeno III) que sustenta células livres; argirófila.',
  },
  'conjuntivo-elastico': {
    grupo: 'conjuntivo-especializado',
    curto: 'Elástico',
    completo: 'Conjuntivo especializado · elástico',
    criterio: 'Predomínio de fibras ou lâminas elásticas, refringentes, coradas por orceína/resorcina.',
  },
  'conjuntivo-mucoso': {
    grupo: 'conjuntivo-especializado',
    curto: 'Mucoso',
    completo: 'Conjuntivo especializado · mucoso (geleia de Wharton)',
    criterio: 'Matriz gelatinosa abundante, pálida, com fibroblastos estrelados e poucas fibras.',
  },
  'adiposo-unilocular': {
    grupo: 'conjuntivo-especializado',
    curto: 'Adiposo unilocular',
    completo: 'Conjuntivo especializado · adiposo unilocular (branco)',
    criterio: 'Células grandes, uma gota lipídica única (vazia no parafina) e núcleo em anel.',
  },
  'adiposo-multilocular': {
    grupo: 'conjuntivo-especializado',
    curto: 'Adiposo multilocular',
    completo: 'Conjuntivo especializado · adiposo multilocular (pardo)',
    criterio: 'Células menores, muitas gotículas, núcleo central, citoplasma granular e muitos capilares.',
  },
  'cartilagem-hialina': {
    grupo: 'conjuntivo-especializado',
    curto: 'Cartilagem hialina',
    completo: 'Conjuntivo especializado · cartilagem hialina',
    criterio: 'Matriz homogênea basófila, condrócitos em lacunas e grupos isógenos, pericôndrio.',
  },
  'cartilagem-elastica': {
    grupo: 'conjuntivo-especializado',
    curto: 'Cartilagem elástica',
    completo: 'Conjuntivo especializado · cartilagem elástica',
    criterio: 'Como a hialina, mas com rede densa de fibras elásticas na matriz.',
  },
  fibrocartilagem: {
    grupo: 'conjuntivo-especializado',
    curto: 'Fibrocartilagem',
    completo: 'Conjuntivo especializado · fibrocartilagem',
    criterio: 'Condrócitos em fileiras entre feixes grossos de colágeno tipo I; sem pericôndrio.',
  },
  'osso-compacto': {
    grupo: 'conjuntivo-especializado',
    curto: 'Osso compacto',
    completo: 'Conjuntivo especializado · ósseo compacto (lamelar)',
    criterio: 'Ósteons com lamelas concêntricas em torno de canais de Havers.',
  },
  'osso-esponjoso': {
    grupo: 'conjuntivo-especializado',
    curto: 'Osso esponjoso',
    completo: 'Conjuntivo especializado · ósseo esponjoso (trabecular)',
    criterio: 'Trabéculas lamelares delimitando espaços medulares.',
  },
  'osso-primario': {
    grupo: 'conjuntivo-especializado',
    curto: 'Osso primário',
    completo: 'Conjuntivo especializado · ósseo primário (não lamelar)',
    criterio: 'Osso imaturo, fibras desorganizadas, muitos osteócitos, bordas com osteoblastos.',
  },
  sangue: {
    grupo: 'conjuntivo-especializado',
    curto: 'Sangue',
    completo: 'Conjuntivo especializado · sangue',
    criterio: 'Células livres em matriz líquida (plasma); hemácias anucleadas predominam.',
  },
  hematopoetico: {
    grupo: 'conjuntivo-especializado',
    curto: 'Hematopoético',
    completo: 'Conjuntivo especializado · hematopoético (medula óssea vermelha)',
    criterio: 'Precursores de todas as séries, megacariócitos, adipócitos e sinusoides.',
  },
  linfoide: {
    grupo: 'conjuntivo-especializado',
    curto: 'Linfoide',
    completo: 'Conjuntivo especializado · linfoide (sobre estroma reticular)',
    criterio: 'Linfócitos densamente agrupados, difusos ou em nódulos com centro germinativo.',
  },
  'muscular-liso': {
    grupo: 'muscular',
    curto: 'Músculo liso',
    completo: 'Muscular · liso',
    criterio: 'Células fusiformes, núcleo central alongado, sem estrias.',
  },
  'muscular-esqueletico': {
    grupo: 'muscular',
    curto: 'Músculo esquelético',
    completo: 'Muscular · estriado esquelético',
    criterio: 'Fibras longas, multinucleadas, núcleos periféricos, estrias transversais.',
  },
  'muscular-cardiaco': {
    grupo: 'muscular',
    curto: 'Músculo cardíaco',
    completo: 'Muscular · estriado cardíaco',
    criterio: 'Fibras ramificadas, 1–2 núcleos centrais, discos intercalares.',
  },
  'nervoso-snc': {
    grupo: 'nervoso',
    curto: 'Nervoso (SNC)',
    completo: 'Nervoso · sistema nervoso central (substâncias cinzenta e branca)',
    criterio: 'Neurônios e glia imersos em neurópilo, sem conjuntivo entre as células.',
  },
  'nervoso-snp': {
    grupo: 'nervoso',
    curto: 'Nervoso (SNP)',
    completo: 'Nervoso · sistema nervoso periférico (nervos e gânglios)',
    criterio: 'Fibras nervosas envoltas por endo, peri e epineuro; gânglios com células satélites.',
  },
  'dentario-mineralizado': {
    grupo: 'dentario',
    curto: 'Dentina/esmalte/cemento',
    completo: 'Tecidos dentários mineralizados · dentina, esmalte e cemento',
    criterio: 'Matrizes mineralizadas acelulares (esmalte) ou tubulares (dentina).',
  },
  'dentario-odontogenico': {
    grupo: 'dentario',
    curto: 'Órgão do esmalte/papila',
    completo: 'Tecidos odontogênicos · órgão do esmalte, papila e folículo dentários',
    criterio: 'Epitélio odontogênico em campânula envolvendo a papila ectomesenquimal.',
  },
}

export function descreverTecido(tipo: TipoDeTecido): DescricaoDeTecido {
  return TECIDOS[tipo]
}
