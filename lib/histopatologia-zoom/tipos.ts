/**
 * Tipos da Histopatologia com Zoom.
 *
 * Sem dependências de servidor: o visualizador e os componentes de cliente
 * importam daqui.
 *
 * Três camadas, separadas de propósito:
 *
 * - **glossário de achados** (`AchadoPatologico`): o que é um achado
 *   histopatológico em qualquer lâmina — necrose caseosa, coilócito, invasão
 *   da muscular própria —, como se reconhece, por que se forma e o que
 *   significa;
 * - **doença** (`DoencaZoom`): quais achados gerais e específicos definem a
 *   doença, o diferencial e a correlação clínica;
 * - **lâmina** (`LaminaPatologica` + anotação): um caso real, com as marcações
 *   e o veredito de cada achado da doença *nesta* lâmina — presente, ausente ou
 *   não avaliável.
 */

import type { EstruturaMarcada, MarcacaoNaLamina } from '@/lib/histologia-zoom/estruturas/tipos'
import type { PiramideDaLamina, SistemaId } from '@/lib/histologia-zoom/tipos'

export type CategoriaDeAchado =
  | 'lesao-celular'
  | 'inflamacao'
  | 'reparo'
  | 'circulatorio'
  | 'deposito'
  | 'adaptacao'
  | 'neoplasia'
  | 'agente'
  | 'arquitetura'

export interface AchadoPatologico {
  id: string
  nome: string
  sinonimos?: string[]
  categoria: CategoriaDeAchado
  /** Uma frase: o que é e como se reconhece. */
  resumo: string
  /** Critérios microscópicos, do menor para o maior aumento. */
  comoReconhecer: string[]
  /** Por que se forma: a patogênese do achado, não da doença. */
  mecanismo: string[]
  /** O que o achado indica — diagnóstico, gravidade, prognóstico, conduta. */
  significado: string[]
  /** Doenças e contextos em que aparece. */
  ondeOcorre: string[]
  /** Mimetizadores, artefatos e armadilhas de interpretação. */
  armadilhas: string[]
}

/** Achado com o verbete do glossário resolvido, pronto para a interface. */
export interface AchadoMarcado extends MarcacaoNaLamina {
  categoria: 'patologica'
  verbete: AchadoPatologico
}

/** O que o visualizador desenha e o catálogo lista: histologia normal ou achado de doença. */
export type MarcacaoExibida = EstruturaMarcada | AchadoMarcado

export function ehAchado(m: MarcacaoExibida): m is AchadoMarcado {
  return m.categoria === 'patologica'
}

// ─── Doença ─────────────────────────────────────────────────────────────────

/**
 * `geral`: achado de um processo patológico comum a várias doenças (necrose,
 * inflamação aguda, fibrose). `especifico`: achado que caracteriza ou define
 * esta doença (neutrófilos na muscular própria na apendicite).
 */
export type TipoDeAchadoDaDoenca = 'geral' | 'especifico'

export interface AchadoDaDoenca {
  achado: string
  tipo: TipoDeAchadoDaDoenca
  /** Como o achado se apresenta NESTA doença. */
  comoAparece: string
  /** `criterio`: necessário ou decisivo para o diagnóstico. */
  peso: 'criterio' | 'frequente' | 'ocasional'
}

export interface DiferencialDaDoenca {
  nome: string
  comoSeparar: string
}

export interface DoencaZoom {
  id: string
  nome: string
  sinonimos: string[]
  nomesEmIngles: string[]
  sistema: SistemaId
  /** Órgão normal da Histologia com Zoom para comparação. */
  orgao: string
  /** Ordem de prioridade no catálogo (1 = mais comum/cobrada). */
  prioridade: number
  /** Uma frase de definição. */
  resumo: string
  epidemiologia: string
  /** Patogênese em passos: cada passo explica o próximo. */
  patogenese: string[]
  /** Como a lâmina desta doença se lê, do panorâmico ao grande aumento. */
  roteiro: string[]
  achados: AchadoDaDoenca[]
  diferenciais: DiferencialDaDoenca[]
  correlacaoClinica: string[]
  /** O que olhar na lâmina normal para perceber a diferença. */
  comparacaoComNormal: string[]
  /** Slug da doença no módulo de texto da Histopatologia, quando existir. */
  doencaDoManual?: string
}

// ─── Lâmina ─────────────────────────────────────────────────────────────────

export type SituacaoDoAchado = 'presente' | 'ausente' | 'nao-avaliavel'

/** Veredito de um achado nesta lâmina. */
export interface AchadoNaLamina {
  achado: string
  status: SituacaoDoAchado
  /** Marcações que mostram o achado (vazio quando é difuso e está descrito na nota). */
  marcacoes?: string[]
  /** O que se vê nesta lâmina — ou por que o achado está ausente ou não é avaliável. */
  nota?: string
}

/** Arquivo `data/histopatologia-zoom/anotacoes/<slug>.json`. */
export interface AnotacaoPatologica {
  slug: string
  revisao: { por: string; data: string; conferencias: number }
  /** O que esta lâmina mostra, em uma ou duas frases. */
  resumo: string
  marcacoes: MarcacaoNaLamina[]
  achados: AchadoNaLamina[]
  /**
   * Lâmina publicada só com a descrição dos achados, sem setas: o diagnóstico
   * e cada veredito foram conferidos, mas as marcações ainda serão feitas.
   */
  semMarcacoes?: boolean
}

/** Caso clínico de origem, traduzido. */
export interface CasoDaLamina {
  sexo: 'F' | 'M' | null
  idade: number | null
  /** História clínica em português. */
  historia: string | null
  /** Diagnóstico como consta na fonte (em inglês). */
  diagnosticoOriginal: string
}

/** Entrada da curadoria (append-only por doença: a ordem define o sufixo do slug). */
export interface CuradoriaDaLamina {
  doenca: string
  /** Caminho do `.svs` no servidor de imagens de Leeds. */
  caminho: string
  largura: number
  altura: number
  /** AppMag do scan (20 ou 40). */
  objetiva: number
  /** Micrômetros por pixel no topo da pirâmide. */
  mpp: number | null
  subtitulo: string | null
  caso: CasoDaLamina
  /** Lâmina normal preferida para comparação (slug da Histologia com Zoom). */
  laminaNormal?: string
  /** Coloração, quando não é H&E (ex.: imuno-histoquímica que mostra o achado que o H&E não mostra). */
  coloracao?: string
}

export interface LaminaPatologica {
  slug: string
  doenca: string
  subtitulo: string | null
  titulo: string
  coloracao: string
  objetiva: number
  mpp: number | null
  caso: CasoDaLamina
  piramide: PiramideDaLamina
  largura: number
  altura: number
  laminaNormal?: string
}

/** Versão leve para cartões e busca. */
export interface LaminaPatologicaResumida {
  slug: string
  doenca: string
  titulo: string
  subtitulo: string | null
  miniatura: string
  miniaturaL: number
  miniaturaA: number
  achadosPresentes: number
}
