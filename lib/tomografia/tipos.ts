/**
 * Tipos do Manual de Tomografia.
 *
 * Cada série de TC vive em `public/TC_<REGIAO>/<PASTA>` como uma pilha de
 * cortes numerados de 1 a N — exatamente a ordem em que o aparelho os
 * reconstrói. O visualizador percorre essa pilha com scroll/arraste, então
 * `totalCortes` e `ext` precisam bater com o disco: quem lista os arquivos é o
 * script de indexação (ver `lib/tomografia/index.ts`), não o componente.
 *
 * O campo `cortes` de cada estrutura guarda os números de corte em que o rótulo
 * daquela estrutura aparece impresso na imagem. Ele foi extraído por OCR das
 * próprias imagens, então é a verdade do material — é o que permite "pular para
 * o corte" e marcar os ticks na barra de navegação sem chutar.
 */

export type SecaoId = 'torax' | 'abdome' | 'cranio'

/** Famílias de estrutura — governam cor, ícone e agrupamento no painel. */
export type CategoriaEstrutura =
  | 'arteria'
  | 'veia'
  | 'osso'
  | 'musculo'
  | 'viscera-parenquimatosa'
  | 'viscera-oca'
  | 'via-aerea'
  | 'nervoso'
  | 'liquor'
  | 'seio-paranasal'
  | 'glandula'
  | 'urinario'
  | 'genital'
  | 'partes-moles'
  | 'serosa'
  | 'biliar'

/** Presets de janela (window width / window level) que o visualizador simula. */
export type JanelaId =
  | 'padrao'
  | 'mediastinal'
  | 'pulmonar'
  | 'ossea'
  | 'cerebral'
  | 'angio'
  | 'hepatica'

export interface AlteracaoTC {
  /** Nome da doença, síndrome ou variante. */
  nome: string
  /** Como ela se traduz na imagem — densidade, forma, realce, sinal clássico. */
  achado: string
}

export interface MedidaTC {
  rotulo: string
  valor: string
}

export interface EstruturaTC {
  id: string
  nome: string
  sinonimos?: string[]
  categoria: CategoriaEstrutura
  /** Uma ou duas frases: o que é, em linguagem direta. */
  resumo: string
  /** Forma, dimensões, trajeto, relações anatômicas. */
  morfologia: string
  /** Para que serve — fisiologia, e o que se perde quando falha. */
  funcao: string
  /** Densidade em UH e comportamento com contraste. */
  densidade: string
  /** Janela em que a estrutura é melhor avaliada e por quê. */
  janela: string
  /** Passo a passo de como achar a estrutura rolando os cortes. */
  comoIdentificar: string
  /** Reparos anatômicos vizinhos que confirmam a identificação. */
  reparos: string[]
  /** Relevância clínica: o que muda na conduta quando algo acontece aqui. */
  clinica: string
  /** Doenças e variantes com a tradução visual na TC. */
  alteracoes: AlteracaoTC[]
  /** Erros clássicos de leitura, pseudolesões e artefatos que imitam doença. */
  armadilhas?: string[]
  /** Números de referência (calibres, dimensões, valores de corte). */
  medidas?: MedidaTC[]
  /** Cortes da série em que o rótulo aparece (1-indexado). Extraído por OCR. */
  cortes?: number[]
}

export interface QuestaoTC {
  pergunta: string
  alternativas: string[]
  /** Índice da alternativa correta em `alternativas`. */
  correta: number
  explicacao: string
}

export interface PassoRoteiro {
  passo: string
  detalhe: string
}

export interface SubsecaoTC {
  id: string
  titulo: string
  subtitulo: string
  secaoId: SecaoId
  /** Caminho da pasta em /public, sem barra final. Pode conter acentos. */
  pasta: string
  /** Extensão real dos arquivos no disco (case-sensitive em produção). */
  ext: string
  totalCortes: number
  /** Sentido em que a pilha avança conforme o número do corte cresce. */
  orientacao: 'cranio-caudal' | 'caudo-cranial'
  /** Chave em `ICONES` (components/tomografia/tema.ts). */
  icone: string
  /** Chave em `TEMA` (components/tomografia/tema.ts). */
  cor: string
  /** Como o exame que gerou esta série é adquirido na prática. */
  protocolo: string
  /**
   * Janela em que a série já foi reconstruída pelo aparelho — informação, não
   * ajuste: o visualizador abre em "Original", porque reaplicar o preset sobre
   * uma imagem que já saiu naquela janela estoura o brilho.
   */
  janelaPadrao: JanelaId
  /** Texto de abertura — o "porquê" da série, denso e didático. */
  introducao: string
  /** Roteiro de leitura sistemática, na ordem em que se deve olhar. */
  roteiro: PassoRoteiro[]
  estruturas: EstruturaTC[]
  quiz: QuestaoTC[]
  /** Pérolas de prova e de plantão. */
  perolas?: string[]
}

export interface SecaoTC {
  id: SecaoId
  titulo: string
  subtitulo: string
  descricao: string
  icone: string
  cor: string
  subsecoes: SubsecaoTC[]
}

/** Caminho público de um corte da série (1-indexado). */
export function caminhoDoCorte(sub: Pick<SubsecaoTC, 'pasta' | 'ext'>, n: number): string {
  return encodeURI(`${sub.pasta}/${n}.${sub.ext}`)
}
