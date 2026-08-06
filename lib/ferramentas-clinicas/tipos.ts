/**
 * Tipos das Ferramentas Clínicas.
 *
 * Cada ferramenta é uma função pura `calcular(valores) -> Resultado` mais a
 * descrição dos campos que a alimentam. A interface não sabe nada de medicina:
 * ela lê `campos`, desenha os controles, junta tudo num `Valores` e mostra o
 * `Resultado`. Isso é deliberado — acrescentar uma calculadora nova é escrever
 * um objeto neste formato, sem tocar em componente nenhum.
 *
 * Todo valor trafega como string. Input numérico em React vira string de
 * qualquer jeito, e manter um único tipo evita o vaivém de `NaN`, `''` e
 * `undefined` que costuma quebrar formulário clínico. As funções `num`, `opc` e
 * `sim` (em `helpers.ts`) fazem a leitura tipada do outro lado.
 *
 * `calcular` devolve `null` quando falta dado obrigatório. A interface trata
 * isso como "ainda não dá para responder" e mostra o que falta — nunca inventa
 * zero. Num contexto clínico, um resultado calculado sobre campo vazio é pior
 * do que resultado nenhum.
 */

export type CategoriaId =
  | 'gasometria'
  | 'cardiologia'
  | 'pneumologia'
  | 'nefrologia'
  | 'infectologia'
  | 'neurologia'
  | 'gastroenterologia'
  | 'hematologia'
  | 'endocrinologia'
  | 'pediatria'
  | 'ginecologia'
  | 'emergencia'
  | 'cirurgia'
  | 'farmacologia'
  | 'nutricao'

/** Mapa de valores brutos do formulário: id do campo -> texto digitado/escolhido. */
export type Valores = Record<string, string>

/* ───────────────────────────── Campos ───────────────────────────── */

export type TipoCampo =
  /** Entrada numérica livre, com unidade e faixa fisiológica. */
  | 'numero'
  /** Lista suspensa — usada quando há muitas alternativas. */
  | 'opcao'
  /** Botões lado a lado — usado quando há 2 a 4 alternativas curtas. */
  | 'segmentado'
  /** Item de escore: presente/ausente, valendo `pontos`. */
  | 'sim-nao'

export interface OpcaoCampo {
  valor: string
  rotulo: string
  /** Pontuação do item em escores. Ausente em campos puramente descritivos. */
  pontos?: number
  /** Explicação curta do critério — o que conta e o que não conta. */
  descricao?: string
}

export interface Campo {
  id: string
  rotulo: string
  tipo: TipoCampo
  /** Unidade exibida à direita do input. Não converte nada — é rótulo. */
  unidade?: string
  /** Uma linha de contexto: de onde tirar o dado, qual armadilha evitar. */
  ajuda?: string
  /** Valor inicial. Em escores, quase sempre a alternativa de 0 ponto. */
  padrao?: string
  /** Faixa aceita. Fora dela a interface avisa, mas não bloqueia. */
  min?: number
  max?: number
  passo?: number
  /** Faixa considerada normal/usual — desenhada como trilho de referência. */
  normalMin?: number
  normalMax?: number
  opcoes?: OpcaoCampo[]
  /** Pontos de um item `sim-nao` quando marcado como presente. */
  pontos?: number
  /** Campo que pode ficar vazio sem impedir o cálculo. */
  opcional?: boolean
  /** Exibe o campo só quando a condição bate (formulários que se ramificam). */
  mostrarSe?: (v: Valores) => boolean
}

/* ──────────────────────────── Resultado ──────────────────────────── */

/**
 * Semáforo do resultado. Governa cor, ícone e ênfase — e só isso: nenhuma
 * conduta depende dele no código, para que a cor nunca vire o diagnóstico.
 */
export type Nivel = 'neutro' | 'ok' | 'atencao' | 'alerta' | 'critico'

export interface LinhaDetalhe {
  rotulo: string
  valor: string
  /** Comentário curto: faixa de referência, alvo, o que fazer com o número. */
  nota?: string
  nivel?: Nivel
}

export interface TabelaResultado {
  titulo?: string
  colunas: string[]
  linhas: string[][]
  /** Índice da linha que corresponde ao caso calculado — fica destacada. */
  destaque?: number
}

export interface Resultado {
  /** Número/rótulo principal. É o que a pessoa veio buscar. */
  valor: string
  unidade?: string
  /** Legenda do valor principal ("escore total", "TFG estimada"...). */
  titulo?: string
  nivel?: Nivel
  /** Classificação em palavras: "alto risco", "acidose metabólica"... */
  rotuloNivel?: string
  /** Números intermediários e derivados — a conta aberta. */
  detalhes?: LinhaDetalhe[]
  /** Leitura clínica do resultado, em parágrafos. */
  interpretacao?: string[]
  /** O que fazer com isso. Sempre subordinado ao julgamento clínico. */
  conduta?: string[]
  /** Avisos duros: limites de validade, riscos, uso indevido. */
  alertas?: string[]
  tabela?: TabelaResultado
}

/* ──────────────────────────── Ferramenta ──────────────────────────── */

export interface Referencia {
  /** Citação legível: autores, título, periódico, ano. */
  texto: string
  /** DOI, PMID ou URL da diretriz. */
  link?: string
}

export interface Ferramenta {
  /** Slug estável — entra na URL (`?f=slug`) e em favoritos. Não mude. */
  id: string
  nome: string
  sigla?: string
  /** Termos alternativos para a busca: sinônimos, epônimos, grafias. */
  sinonimos?: string[]
  /** Uma frase: o que a ferramenta responde. */
  resumo: string
  /** Primeira categoria = onde a ferramenta mora; as demais são atalhos. */
  categorias: CategoriaId[]
  campos: Campo[]
  calcular: (v: Valores) => Resultado | null
  /** Fórmula em texto monoespaçado, uma linha por passo. */
  formula?: string[]
  /** Por que a conta funciona, o que ela mede de fato, de onde saiu. */
  fundamento: string
  /** Erros clássicos de aplicação — o que faz o número mentir. */
  armadilhas?: string[]
  referencias: Referencia[]
}

export interface Categoria {
  id: CategoriaId
  nome: string
  /** Subtítulo curto para o card do índice. */
  subtitulo: string
  descricao: string
  /** Chave em `ICONES` (components/ferramentas-clinicas/tema.ts). */
  icone: string
  /** Chave em `TEMA` — a cor identifica a categoria em toda a seção. */
  cor: string
  /** Quantidade de ferramentas. Verificada em desenvolvimento pelo índice. */
  total: number
}
