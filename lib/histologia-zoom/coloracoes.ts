/**
 * Colorações do acervo, traduzidas e explicadas.
 *
 * A chave é o texto de origem **normalizado** (minúsculas, sem acento, sem
 * pontuação final), porque o HistoViewer escreve a mesma técnica de várias
 * formas: "May-Gruenwald-Giemsa", "May-Grunwald-Giemsa", "May-Giemsa-Grünwald".
 */

export interface Coloracao {
  id: string
  nome: string
  /** O que fica de que cor — a frase que o aluno precisa para ler a lâmina. */
  resultado: string
}

const C = (id: string, nome: string, resultado: string): Coloracao => ({ id, nome, resultado })

const HE = C(
  'he',
  'Hematoxilina-eosina (HE)',
  'Núcleos e RNA em azul-violeta (hematoxilina); citoplasma, colágeno e músculo em rosa (eosina).',
)
const TOLUIDINA = C(
  'azul-de-toluidina',
  'Azul de toluidina',
  'Núcleos e citoplasma em tons de azul; grânulos de mastócitos e matriz cartilaginosa em violeta-avermelhado (metacromasia).',
)
const MGG = C(
  'may-grunwald-giemsa',
  'May-Grünwald-Giemsa',
  'Hemácias rosa-alaranjadas; núcleos em violeta; grânulos eosinófilos em laranja e basófilos em azul-escuro.',
)
const ORCEINA = C(
  'orceina',
  'Orceína',
  'Fibras e lâminas elásticas em marrom-avermelhado; o restante do tecido fica pálido.',
)
const RESORCINA = C(
  'resorcina-fucsina',
  'Resorcina-fucsina (Weigert)',
  'Fibras elásticas em violeta-escuro a preto; demais estruturas pouco coradas.',
)
const AZAN = C(
  'azan',
  'Azan (Heidenhain)',
  'Colágeno em azul intenso; núcleos em vermelho; músculo e citoplasma em laranja-avermelhado.',
)
const MASSON_GOLDNER = C(
  'masson-goldner',
  'Tricrômico de Masson-Goldner',
  'Colágeno e osteoide em verde; osso mineralizado em verde-escuro; citoplasma e músculo em vermelho; núcleos escuros.',
)
const SIRIUS = C(
  'sirius',
  'Picrossírius (Sirius red)',
  'Colágeno em vermelho vivo sobre fundo amarelado; músculo em amarelo-alaranjado.',
)

export const COLORACOES: Record<string, Coloracao> = {
  he: HE,
  'hematoxylin-eosin': HE,
  'toluidine blue': TOLUIDINA,
  toluidine: TOLUIDINA,
  'may-gruenwald-giemsa': MGG,
  'may-grunwald-giemsa': MGG,
  'may-giemsa-grunwald': MGG,
  orceine: ORCEINA,
  resorcin: RESORCINA,
  azan: AZAN,
  'mallory azan': C(
    'azan-mallory',
    'Azan de Mallory',
    'Colágeno em azul; núcleos em vermelho; citoplasma de células serosas em rosa-violáceo.',
  ),
  'heidenhains azan': AZAN,
  'masson-goldner': MASSON_GOLDNER,
  'masson-goldner-trichrome': MASSON_GOLDNER,
  sirius: SIRIUS,
  'sirius-resorcin': C(
    'sirius-resorcina',
    'Picrossírius + resorcina',
    'Colágeno em vermelho; lâminas elásticas em violeta-escuro; músculo liso em amarelo.',
  ),
  'sirius, resorcin, hematoxylin': C(
    'sirius-resorcina-hematoxilina',
    'Picrossírius + resorcina + hematoxilina',
    'Colágeno em vermelho, elástica em violeta-escuro, núcleos em azul, músculo liso amarelado.',
  ),
  'gomori silver': C(
    'prata-gomori',
    'Impregnação argêntica de Gomori',
    'Fibras reticulares (colágeno III) em preto, formando a rede de sustentação; o resto fica acinzentado.',
  ),
  silver: C(
    'prata',
    'Impregnação argêntica',
    'Neurônios e seus prolongamentos em preto-acastanhado sobre fundo claro.',
  ),
  thionin: C(
    'tionina',
    'Tionina (Nissl)',
    'Corpúsculos de Nissl (RER) e núcleos em azul; substância branca quase incolor.',
  ),
  osmium: C(
    'osmio',
    'Tetróxido de ósmio',
    'Bainhas de mielina em preto — em corte transversal, anéis escuros em torno do axônio claro.',
  ),
  'osmium, sirius': C(
    'osmio-sirius',
    'Ósmio + picrossírius',
    'Mielina em preto; septos e bainhas conjuntivas (colágeno) em vermelho.',
  ),
  'modified weigert (ad modum weil)': C(
    'weigert-weil',
    'Weigert modificado (Weil)',
    'Mielina em azul-escuro a preto: a substância branca escurece e a cinzenta fica clara.',
  ),
  'iron hematoxylin': C(
    'hematoxilina-ferrica',
    'Hematoxilina férrica (Heidenhain)',
    'Núcleos, cromatina e estruturas densas em preto-azulado, com alto contraste.',
  ),
  feulgen: C(
    'feulgen',
    'Reação de Feulgen',
    'Coloração específica de DNA em magenta: só cromatina e cromossomos se coram.',
  ),
  'acetic orcein': C(
    'orceina-acetica',
    'Orceína acética',
    'Cromossomos em vermelho-acastanhado, com o citoplasma quase incolor.',
  ),
  'van giesson': C(
    'van-gieson',
    'Van Gieson',
    'Colágeno em vermelho; citoplasma e músculo em amarelo; núcleos escuros.',
  ),
  'pas, hematoxylin': C(
    'pas-hematoxilina',
    'PAS + hematoxilina',
    'Glicoproteínas, muco e membranas basais em magenta; núcleos em azul.',
  ),
  pas: C(
    'pas',
    'Ácido periódico-Schiff (PAS)',
    'Muco das células caliciformes, glicocálice e membranas basais em magenta.',
  ),
  mallory: C(
    'mallory',
    'Tricrômico de Mallory',
    'Colágeno em azul; núcleos em vermelho; citoplasmas em tons de laranja, vermelho ou azul conforme a afinidade.',
  ),
  'haematoxylin-picrofuchsin': C(
    'hematoxilina-picrofucsina',
    'Hematoxilina-picrofucsina',
    'Colágeno e dentina em vermelho; citoplasma em amarelo; núcleos escuros.',
  ),
  immunostaining: C(
    'imuno-sma',
    'Imuno-histoquímica (actina de músculo liso)',
    'Células que expressam actina de músculo liso em marrom (células mioepiteliais e músculo vascular).',
  ),
  'immunohistochemistry of insulin in b-cells': C(
    'imuno-insulina',
    'Imuno-histoquímica (insulina)',
    'Células β das ilhotas em marrom (insulina); o pâncreas exócrino fica sem marcação.',
  ),
  'enzyme histochemistry (acid phosphatase)': C(
    'histoquimica-fosfatase-acida',
    'Histoquímica enzimática (fosfatase ácida)',
    'Lisossomos marcados por precipitado escuro — mais densos nos túbulos proximais.',
  ),
  'enzyme histochemistry (cytochrome oxidase)': C(
    'histoquimica-citocromo-oxidase',
    'Histoquímica enzimática (citocromo-oxidase)',
    'Mitocôndrias ativas marcadas em marrom — os túbulos com mais mitocôndrias escurecem mais.',
  ),
  'toluidine blue and photosensitive sliver halogenide layer': C(
    'autorradiografia',
    'Autorradiografia + azul de toluidina',
    'Grãos de prata pretos sobre as estruturas que incorporaram o aminoácido marcado.',
  ),
  unstained: C(
    'sem-coloracao',
    'Sem coloração',
    'Corte parafinado sem corante: quase transparente, visível só pela refração — é o ponto de partida.',
  ),
  none: C('nenhuma', 'Sem coloração', 'Objeto não biológico montado em lâmina, sem corante.'),
  hematoxilina: C(
    'hematoxilina',
    'Hematoxilina (contracoloração)',
    'Só núcleos em azul-violeta sobre neurópilo e matriz quase incolores: a arquitetura aparece pela distribuição dos núcleos.',
  ),
  'tricromico-azul': C(
    'tricromico-azul',
    'Tricrômico com colágeno em azul',
    'Colágeno em azul intenso; núcleos e citoplasma das células em tons avermelhados a violeta.',
  ),
  distensao: C(
    'distensao',
    'Distensão total (fibras colágenas e elásticas)',
    'Membrana distendida e corada por inteiro: fibras colágenas rosadas e onduladas, fibras elásticas finas e escuras, núcleos de fibroblastos.',
  ),
}

export function normalizarColoracao(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/β/g, 'b')
    .toLowerCase()
    .replace(/\.\s*$/, '')
    .trim()
}

export function coloracaoDe(texto: string): Coloracao {
  const chave = normalizarColoracao(texto)
  return (
    COLORACOES[chave] ?? {
      id: chave.replace(/[^a-z0-9]+/g, '-'),
      nome: texto,
      resultado: 'Coloração especial — consulte o resumo da técnica.',
    }
  )
}

export function coloracaoPorId(id: string): Coloracao | undefined {
  return Object.values(COLORACOES).find((c) => c.id === id)
}
