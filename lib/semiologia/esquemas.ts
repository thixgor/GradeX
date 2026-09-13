import type { MidiaClinica } from './midia'

/**
 * Contratos do Manual de Semiologia.
 *
 * ## O buraco que este módulo tapa
 *
 * O Manual já ensina a ler o exame *complementar*: radiografia, tomografia,
 * lâmina, traçado, gasometria. Ensina a doença inteira em cada ficha. E ensina
 * a conta que fecha a conduta. Não ensinava a etapa que vem antes de tudo
 * isso — a que o aluno faz com a própria mão, sem máquina nenhuma no meio.
 *
 * O aluno vai à clínica da família, encosta o otoscópio no primeiro ouvido da
 * vida dele e descobre que não sabe dizer se aquilo é normal. Não é falta de
 * teoria: ele sabe recitar que a membrana timpânica é "translúcida, nacarada,
 * com triângulo luminoso ântero-inferior". O que falta é a imagem — nunca viu
 * uma, e a descrição só vira reconhecimento quando existe alguma coisa para
 * comparar.
 *
 * Vale para o fundo de olho, para a rinoscopia, para a orofaringe e para o
 * ultrassom à beira do leito. E vale, principalmente, para o exame físico sem
 * instrumento nenhum: "como é uma pessoa ictérica?" não se responde com a
 * definição de bilirrubina acima de 2,5 mg/dL.
 *
 * ## As três alas
 *
 * 1. **Sinais** — achado de exame físico, um a um: o que é, como se procura,
 *    por que aparece, o que muda na conduta e onde engana.
 * 2. **Beira-leito** — o que se vê pelo instrumento simples: otoscópio,
 *    oftalmoscópio, espéculo nasal, abaixador de língua, endoscópio.
 * 3. **Ultrassom** — as janelas do POCUS, normal e alterada.
 *
 * ## Por que ilustração desenhada, e não fotografia
 *
 * Acervo fotográfico de otoscopia e fundo de olho é quase todo proprietário, e
 * o pouco que é aberto vem em licença que proíbe uso comercial. Comprar direito
 * de imagem para cada achado sairia caro e ainda deixaria o atlas refém de um
 * terceiro — foi exatamente o risco que o Manual da Histologia teve de
 * contornar com CDN próprio.
 *
 * A saída é a mesma do Manual do Eletrocardiograma, que não guarda um só PNG de
 * traçado: **a imagem é gerada**. Aqui cada cena é um SVG paramétrico escrito
 * por nós — a membrana timpânica é desenhada a partir de cor, translucidez,
 * abaulamento e posição do cabo do martelo; a esclera ictérica, a partir da
 * bilirrubina. Isso custa trabalho de desenho, mas paga três vezes:
 *
 * - **Direito nosso.** Nada de licença de terceiro, nada de tarja de origem.
 * - **Comparável.** Duas otites lado a lado mudam só no que importa, porque o
 *   resto do desenho é literalmente o mesmo código. Numa fotografia, muda
 *   também o ângulo, a luz, o paciente e a câmera — e o aluno aprende o ruído
 *   junto com o sinal.
 * - **Interativo.** Um parâmetro que o aluno arrasta é o que transforma
 *   "bilirrubina de 3 é subclínica e de 12 é evidente" em coisa vista.
 *
 * O que a ilustração **não** faz é substituir a fotografia clínica na hora de
 * treinar o olho para a variação real. Por isso cada cena aponta para onde
 * conferir a imagem real (Radiopaedia, The POCUS Atlas, acervos abertos), e a
 * interface diz, sem meias palavras, que o desenho é esquemático.
 */

// ─── Vocabulário comum ────────────────────────────────────────────────────────

export type SistemaSemiologico =
  | 'geral'
  | 'cardiovascular'
  | 'respiratorio'
  | 'abdome'
  | 'neurologico'
  | 'pele'
  | 'cabeca-pescoco'
  | 'endocrino'

export const TITULOS_DE_SISTEMA: Record<SistemaSemiologico, string> = {
  geral: 'Sinais gerais',
  cardiovascular: 'Cardiovascular',
  respiratorio: 'Respiratório',
  abdome: 'Abdome e fígado',
  neurologico: 'Neurológico',
  pele: 'Pele e fâneros',
  'cabeca-pescoco': 'Cabeça e pescoço',
  endocrino: 'Endócrino',
}

/** Um passo de manobra: o que fazer e por que fazer exatamente assim. */
export interface PassoDeExame {
  passo: string
  /** O detalhe que faz a manobra funcionar — ou falhar, quando ignorado. */
  detalhe: string
}

/**
 * Poder diagnóstico do achado.
 *
 * Guardamos a **razão de verossimilhança** e não só sensibilidade e
 * especificidade porque é ela que responde à pergunta que o aluno faz de
 * verdade: "achei o sinal — mudou alguma coisa?". Um sinal com LR+ de 1,2 é
 * ruído com nome próprio, e é honesto dizer isso.
 *
 * Todo número aqui vem de estudo citado em `referencias`. Onde não existe
 * número publicado confiável, o campo fica de fora — inventar uma cifra
 * plausível seria pior do que não ter nenhuma.
 */
export interface DesempenhoDiagnostico {
  /** A pergunta clínica a que o número responde. */
  alvo: string
  sensibilidade?: string
  especificidade?: string
  razaoPositiva?: string
  razaoNegativa?: string
  /** O que o número significa na beira do leito. */
  leitura: string
  fonte: string
}

export interface GrupoDeCausas {
  titulo: string
  /** O que une as causas do grupo — o mecanismo, não a lista. */
  mecanismo: string
  itens: string[]
}

/**
 * Aponta para a ilustração paramétrica que desenha o achado.
 *
 * A camada de dado não importa React: guarda só o identificador da cena e os
 * parâmetros. Quem resolve o identificador em componente é
 * `components/semiologia/ilustracoes/registro.tsx`. Assim um módulo de servidor
 * pode montar catálogo, sitemap e busca sem arrastar SVG nenhum para o bundle.
 */
export interface IlustracaoRef {
  id: string
  /** Parâmetros da cena (intensidade, lado, fase…). */
  params?: Record<string, number | string | boolean>
  /** Texto alternativo — descrição do que a figura mostra. */
  alt: string
}

// ─── Ala 1: sinais do exame físico ────────────────────────────────────────────

export interface Sinal {
  slug: string
  nome: string
  sinonimos: string[]
  sistema: SistemaSemiologico
  /** Uma linha para o card do catálogo. */
  resumo: string
  /** Definição operacional: o que conta como presente. */
  definicao: string
  /** Como se procura — manobra, posição, luz. */
  comoProcurar: PassoDeExame[]
  /** A cadeia do mecanismo, do insulto ao que a mão encosta. */
  mecanismo: string
  /** O que muda quando está presente. */
  significado: string
  /** Onde o sinal engana. */
  armadilhas: string[]
  causas: GrupoDeCausas[]
  desempenho?: DesempenhoDiagnostico[]
  ilustracao?: IlustracaoRef
  /** Slug do comparador a que pertence, quando há um. */
  comparador?: string
  /** Patologias do Manual Clínico em que este sinal é peça-chave. */
  patologias?: string[]
  referencias: string[]
}

/**
 * Tabela de diferenciação de um mesmo achado entre causas.
 *
 * É a peça que o aluno pede e que livro nenhum entrega inteira: não "o que é
 * edema", mas **qual edema é qual**. Renal, hepático, cardíaco, venoso e
 * linfático produzem o mesmo substantivo e exigem condutas opostas; o que os
 * separa é um punhado de eixos (cacifo, temperatura, cor, distribuição, hora do
 * dia) que ninguém tabela em lugar nenhum.
 *
 * O formato é matriz: eixos nas linhas, causas nas colunas. Cada célula tem o
 * valor curto (o que cabe na tabela) e o detalhe (por que é assim). O detalhe é
 * o que impede a tabela de virar decoreba.
 */
export interface Comparador {
  slug: string
  titulo: string
  /** A pergunta que o comparador responde, escrita como o aluno faz. */
  pergunta: string
  introducao: string
  sistema: SistemaSemiologico
  eixos: EixoComparativo[]
  colunas: ColunaComparativa[]
  /** O que resolve quando a tabela empata. */
  desempate: string
  referencias: string[]
}

export interface EixoComparativo {
  id: string
  rotulo: string
  /** Como se examina esse eixo — a pergunta feita ao paciente ou à mão. */
  comoAvaliar: string
}

export interface ColunaComparativa {
  id: string
  titulo: string
  /** O mecanismo em uma linha: por que essa causa faz esse edema. */
  subtitulo: string
  ilustracao?: IlustracaoRef
  /** eixoId → célula. */
  celulas: Record<string, CelulaComparativa>
  /** O achado que, sozinho, mais aponta para esta coluna. */
  chave: string
}

export interface CelulaComparativa {
  /** O que cabe na tabela. */
  valor: string
  /** Por que é assim. */
  detalhe?: string
  /** Destaca a célula quando ela é a que decide. */
  decisiva?: boolean
}

// ─── Ala 2: imagem à beira do leito ───────────────────────────────────────────

export type Instrumento = 'otoscopio' | 'oftalmoscopio' | 'especulo-nasal' | 'abaixador' | 'endoscopio'

export const TITULOS_DE_INSTRUMENTO: Record<Instrumento, string> = {
  otoscopio: 'Otoscópio',
  oftalmoscopio: 'Oftalmoscópio',
  'especulo-nasal': 'Espéculo nasal',
  abaixador: 'Abaixador de língua',
  endoscopio: 'Endoscópio',
}

/**
 * Uma janela de exame: o que o instrumento mostra.
 *
 * A vista guarda duas coisas que o atlas de Raio-X ensinou a separar: as
 * **estruturas** (o mapa da cena normal, que o aluno acende uma a uma) e as
 * **cenas** (normal e cada alteração). Estrutura é anatomia; cena é achado. O
 * aluno que não separa os dois decora "triângulo luminoso" sem nunca entender
 * que ele some porque a membrana abaulou.
 */
export interface Vista {
  slug: string
  nome: string
  instrumento: Instrumento
  /** Uma linha para o card. */
  resumo: string
  /** Por que este exame existe — o que ele decide. */
  paraQue: string
  comoFazer: PassoDeExame[]
  /** Critérios de que o exame saiu bom. Sem isso, o achado não vale. */
  qualidade: string[]
  estruturas: EstruturaDaVista[]
  cenas: CenaClinica[]
  armadilhas: string[]
  /** Onde conferir a imagem fotográfica real. */
  ondeVerFoto: FonteExterna[]
  referencias: string[]
}

export interface EstruturaDaVista {
  slug: string
  nome: string
  /** O termo que aparece no laudo e na prova. */
  original?: string
  /** O que é e por que se olha para ela. */
  nota: string
  /** Coordenadas na cena, em porcentagem da caixa (0–100). */
  x: number
  y: number
}

export interface CenaClinica {
  id: string
  titulo: string
  estado: 'normal' | 'alterado'
  /** Uma linha: o diagnóstico que a cena ilustra. */
  diagnostico: string
  /** O que se vê, escrito como laudo. */
  achado: string
  /** Roteiro de leitura da cena, na ordem em que se olha. */
  leitura: string[]
  /** Como esta cena difere da normal — o delta, explicitado. */
  diferencaDoNormal: string
  /** O que fazer diante dela. */
  conduta: string
  /** O que mais produz uma cena parecida. */
  diferencial: string[]
  ilustracao: IlustracaoRef
  /**
   * Casos reais de acervo licenciado, exibidos ao lado do esquema.
   *
   * O esquema ensina o padrão; a fotografia ensina a variação. São competências
   * distintas, então a cena carrega as duas em vez de trocar uma pela outra —
   * e o esquema nunca é removido quando uma foto chega.
   *
   * Só entra mídia de fonte com autorização registrada em `direitos.ts`, e o
   * resolvedor (`midia.ts`) reaplica a allowlist antes de servir.
   */
  midiaReal?: MidiaClinica[]
  /** Patologia correspondente no Manual Clínico, quando existe. */
  patologia?: string
}

/**
 * Acervo externo para conferir a imagem real.
 *
 * Antes das autorizações do The POCUS Atlas e do Radiopaedia, estas entradas
 * eram apenas ponteiros — "vá ver lá, e confira a licença antes de reutilizar".
 * Com a autorização escrita, a natureza do vínculo muda: a fonte passa a ser
 * acervo licenciado para uso dentro da plataforma, e `licenciada` é o campo que
 * carrega essa diferença até a interface. Sem ele, a tela continuaria mandando
 * o aluno conferir uma licença que já foi negociada.
 */
export interface FonteExterna {
  titulo: string
  url: string
  /** O que especificamente procurar lá. */
  oQueProcurar: string
  /** Fonte com autorização registrada em `direitos.ts`. */
  licenciada?: import('./direitos').FonteLicenciadaId
  /** Observação de uso, quando relevante para o aluno. */
  nota?: string
}

// ─── Ala 3: ultrassom à beira do leito ────────────────────────────────────────

export type Transdutor = 'convexo' | 'linear' | 'setorial'

export const TITULOS_DE_TRANSDUTOR: Record<Transdutor, string> = {
  convexo: 'Convexo (abdominal)',
  linear: 'Linear (alta frequência)',
  setorial: 'Setorial (phased array)',
}

/**
 * Uma janela de POCUS.
 *
 * O ultrassom à beira do leito é o exame de imagem que mais se parece com
 * exame físico: o médico é quem faz, na hora, com a pergunta já formulada. Por
 * isso ele mora aqui e não na Radiologia — lá o aluno interpreta o exame que
 * outro alguém adquiriu; aqui ele precisa saber onde encostar a sonda.
 */
export interface JanelaUltrassom {
  slug: string
  nome: string
  protocolo: string
  transdutor: Transdutor
  /** Onde encostar e com o marcador para onde. */
  posicao: string
  /** A pergunta binária que a janela responde. */
  pergunta: string
  profundidade: string
  comoFazer: PassoDeExame[]
  estruturas: EstruturaDaVista[]
  cenas: CenaClinica[]
  armadilhas: string[]
  ondeVerFoto: FonteExterna[]
  referencias: string[]
}
