/**
 * Estruturas marcadas nas lâminas.
 *
 * Duas camadas de dado, de propósito separadas:
 *
 * - o **glossário** (`Estrutura`): o que é a estrutura, em qualquer lâmina —
 *   características básicas e aprofundadas, funções, regeneração, onde se
 *   encontra e alterações típicas. Escrito uma vez, reusado em todas as
 *   lâminas em que ela aparece;
 * - a **marcação** (`MarcacaoNaLamina`): onde ela está *nesta* lâmina —
 *   setas, contornos e elipses em coordenadas de viewport do OpenSeadragon
 *   (x de 0 a 1 na largura da imagem; y na mesma escala, de 0 a
 *   altura ÷ largura). Mudar o visualizador não invalida uma marcação.
 *
 * As marcações moram em `data/histologia-zoom/anotacoes/<slug>.json`, uma por
 * lâmina, e são consolidadas em `anotacoes.gerado.json` por
 * `scripts/histologia-zoom/consolidar-anotacoes.mjs`.
 */

export type TipoDeEstrutura =
  | 'celula'
  | 'camada'
  | 'regiao'
  | 'epitelio'
  | 'glandula'
  | 'vaso'
  | 'fibra'
  | 'matriz'
  | 'orgao-parte'
  | 'artefato'

export type NivelDeRegeneracao = 'alta' | 'moderada' | 'baixa' | 'nula' | 'nao-se-aplica'

export interface Estrutura {
  id: string
  nome: string
  sinonimos?: string[]
  tipo: TipoDeEstrutura
  /** Uma frase: o que é e como se reconhece. Sempre visível no catálogo. */
  resumo: string
  /** Características morfo-histológicas básicas (o que a prova cobra). */
  caracteristicas: string[]
  /** Aprofundamento: ultraestrutura, histoquímica, variações. */
  aprofundado: string[]
  funcoes: string[]
  regeneracao: { nivel: NivelDeRegeneracao; texto: string }
  /** Onde mais se encontra (órgãos e locais em que é mais abundante ou típica). */
  ondeEncontrar: string[]
  /** Desmorfologias e alterações típicas (patologia e artefatos). */
  alteracoes: string[]
}

export type Ponto = [number, number]

export type Marca =
  | { tipo: 'seta'; ponta: Ponto; /** direção, em graus, relativa à lâmina (0 = para a direita). */ angulo: number }
  | { tipo: 'contorno'; pontos: Ponto[] }
  | { tipo: 'elipse'; centro: Ponto; raios: Ponto }

export interface MarcacaoNaLamina {
  /** Único dentro da lâmina (ex.: `purkinje`, `purkinje-2`). */
  id: string
  /**
   * Chave do glossário. Nas marcações `patologica`, é a chave do glossário de
   * achados histopatológicos (`lib/histopatologia-zoom/achados`).
   */
  estrutura: string
  /**
   * `patologica`: achado de doença (Histopatologia com Zoom), desenhado com o
   * sinal de patologia. Ausente: estrutura histológica normal.
   */
  categoria?: 'patologica'
  /** Rótulo específico desta marcação, quando difere do nome do glossário. */
  rotulo?: string
  marcas: Marca[]
  /** Região para enquadrar ao selecionar [x0, y0, x1, y1]; senão, calculada das marcas. */
  vista?: [number, number, number, number]
  /** Observação desta lâmina ("aqui cortada obliquamente"). */
  nota?: string
}

export interface AnotacaoDaLamina {
  slug: string
  /** Quem marcou e como foi conferido. */
  revisao: { por: string; data: string; conferencias: number }
  estruturas: MarcacaoNaLamina[]
}

/** Marcação com o verbete do glossário já resolvido, pronta para a interface. */
export interface EstruturaMarcada extends Omit<MarcacaoNaLamina, 'categoria'> {
  /** Estrutura normal: nunca é um achado patológico. */
  categoria?: undefined
  verbete: Estrutura
}
