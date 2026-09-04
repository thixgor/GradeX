/**
 * O que existe dentro do Manual Clínico.
 *
 * Todos os manuais são liberados pela **mesma** compra — o servidor decide isso num
 * lugar só (`getManualClinicoAccess`), e todas as seções privativas consultam
 * essa mesma resposta. O problema nunca foi técnico: era de leitura. Cada seção
 * tinha a própria página de vendas, cada uma anunciava o próprio conteúdo, e
 * quem caía na Histologia por um link não tinha como saber que o mesmo
 * pagamento abre a Radiologia, o Eletrocardiograma e as 201 calculadoras.
 * Pareciam produtos avulsos concorrendo entre si.
 *
 * Este arquivo é a lista única do que entra no pacote. Todas as vitrines
 * importam daqui, então acrescentar um manual é editar um array — e não uma
 * página por seção, que já discordavam entre si sobre o que estava incluso.
 *
 * ## Sobre os números
 *
 * São contagens reais do acervo, não arredondamentos de marketing. Onde a
 * contagem vive no banco (patologias, fármacos) o valor é uma faixa honesta;
 * onde vive no repositório, é o número exato apurado dos dados. As vitrines que
 * têm a contagem ao vivo pela API passam o valor de lá por cima — estes aqui
 * são o piso, para a página nunca anunciar "undefined lâminas" se a chamada
 * falhar.
 *
 * Nenhum módulo tem preço avulso listado de propósito: nenhum deles é vendido
 * à parte, e inventar um "valor separado" que ninguém nunca cobrou seria
 * ancorar a oferta numa cifra falsa. O valor aqui se constrói com o que existe
 * dentro — que é grande o bastante para não precisar de invenção.
 */

export type IdDoModulo =
  | 'manual'
  | 'exames'
  | 'farmacologia'
  | 'eletrocardiograma'
  | 'radiologia'
  | 'histologia'
  | 'anatomia'
  | 'ferramentas'

/** Nome do ícone em `lucide-react`, resolvido no componente que desenha. */
export type IconeDoModulo =
  | 'BookOpen'
  | 'FlaskConical'
  | 'Pill'
  | 'Activity'
  | 'ScanLine'
  | 'Microscope'
  | 'PersonStanding'
  | 'Sigma'

export interface NumeroDoModulo {
  /** O número, já formatado para leitura (usa separador de milhar pt-BR). */
  v: string
  /** O que ele conta. */
  r: string
}

export interface ModuloDoPacote {
  id: IdDoModulo
  /** Como o produto se chama nas vitrines. */
  nome: string
  /** Rótulo curto, para caber em selo e barra. */
  nomeCurto: string
  /** Uma linha: o que é, escrita para quem ainda não conhece. */
  chamada: string
  /** O argumento de peso — a frase que faz esse módulo valer sozinho. */
  destaque: string
  numeros: NumeroDoModulo[]
  href: string
  icone: IconeDoModulo
}

export const MODULOS_DO_PACOTE: ModuloDoPacote[] = [
  {
    id: 'manual',
    nome: 'Manual Clínico',
    nomeCurto: 'Manual Clínico',
    chamada:
      'As patologias aprofundadas: definição, fisiopatologia, quadro clínico, diagnóstico, diferenciais, tratamento e fluxogramas de conduta.',
    destaque: 'A ficha que você abre no plantão e resolve o caso — não o resumo que só lembra o nome da doença.',
    numeros: [
      { v: '300+', r: 'patologias' },
      { v: '20', r: 'sistemas' },
      { v: 'PDF', r: 'download liberado' },
    ],
    href: '/manual-clinico',
    icone: 'BookOpen',
  },
  {
    id: 'exames',
    nome: 'Exames Laboratoriais',
    nomeCurto: 'Exames Laboratoriais',
    chamada:
      'A central de interpretação laboratorial: cada marcador com fisiologia, mecanismo de alteração, diagnósticos diferenciais e padrões — mais o Laboratório Virtual para praticar.',
    destaque:
      'Você não decora que a ferritina sobe na inflamação: você vê a cadeia inteira, da citocina ao número do laudo.',
    numeros: [
      { v: '100+', r: 'marcadores com ficha completa' },
      { v: '25', r: 'padrões laboratoriais' },
      { v: 'Lab', r: 'exames gerados para praticar' },
    ],
    href: '/manual-clinico/exames-laboratoriais',
    icone: 'FlaskConical',
  },
  {
    id: 'farmacologia',
    nome: 'Manual de Farmacologia',
    nomeCurto: 'Farmacologia',
    chamada:
      'Bulário organizado por classe e subclasse: mecanismo de ação, metabolismo, excreção, efeitos adversos, contraindicações e posologia.',
    destaque: 'Com calculadora de dose por peso embutida em cada ficha — a conta que você faz errado às 3 da manhã.',
    numeros: [
      { v: '13', r: 'classes' },
      { v: 'Dose', r: 'calculada por peso' },
      { v: '100%', r: 'com mecanismo escrito' },
    ],
    href: '/manual-clinico/farmacologia',
    icone: 'Pill',
  },
  {
    id: 'eletrocardiograma',
    nome: 'Manual do Eletrocardiograma',
    nomeCurto: 'Eletrocardiograma',
    chamada:
      'Trilha de ensino do nó sinusal ao laudo, mais o simulador de 12 derivações geradas matematicamente em tempo real.',
    destaque: 'Os traçados são gerados por parâmetros eletrofisiológicos, nunca imagens prontas: você muda a fisiologia e vê a onda mudar.',
    numeros: [
      { v: '90', r: 'traçados comentados' },
      { v: '27', r: 'lições em 11 módulos' },
      { v: '12', r: 'derivações em tempo real' },
    ],
    href: '/manual-clinico/eletrocardiograma',
    icone: 'Activity',
  },
  {
    id: 'radiologia',
    nome: 'Manual de Radiologia',
    nomeCurto: 'Radiologia',
    chamada:
      'Tomografia e Raio-X no mesmo acesso: pilhas de corte que você rola como na estação de trabalho e radiografias com cada estrutura demarcada.',
    destaque: 'Sete janelas de leitura, salto direto para o corte em que a estrutura aparece e dossiê clínico em cada uma.',
    numeros: [
      { v: '640', r: 'cortes de TC' },
      { v: '28', r: 'incidências de Raio-X' },
      { v: '493', r: 'estruturas comentadas' },
    ],
    href: '/manual-clinico/radiologia',
    icone: 'ScanLine',
  },
  {
    id: 'histologia',
    nome: 'Manual de Histologia',
    nomeCurto: 'Histologia',
    chamada:
      'Microscópio interativo: lâminas reais com as camadas de marcação que você acende sobre a imagem, mais o acervo de Histopatologia.',
    destaque: 'Cada lâmina traz as estruturas marcadas uma a uma — dá para desligar tudo e testar se você reconhece sozinho.',
    numeros: [
      { v: '1.318', r: 'lâminas' },
      { v: '7.371', r: 'estruturas marcadas' },
      { v: '2.917', r: 'entradas de histopatologia' },
    ],
    href: '/manual-clinico/histologia',
    icone: 'Microscope',
  },
  {
    id: 'anatomia',
    nome: 'Domine Anatomia',
    nomeCurto: 'Domine Anatomia',
    chamada:
      'O corpo em duas linguagens: pranchas anatômicas reais com cada estrutura marcada e explicada, e modelos 3D que você gira em 360°.',
    destaque: 'Toque em qualquer marcador e recebe a ficha inteira da estrutura — não só o nome dela.',
    numeros: [
      { v: '211', r: 'pranchas reais' },
      { v: '1.252', r: 'estruturas com ficha' },
      { v: '100', r: 'modelos 3D' },
    ],
    href: '/anatomia',
    icone: 'PersonStanding',
  },
  {
    id: 'ferramentas',
    nome: 'Ferramentas Clínicas',
    nomeCurto: 'Ferramentas Clínicas',
    chamada:
      'Calculadoras e escores que respondem enquanto você digita, com a conta aberta, a fórmula à vista e o fundamento escrito.',
    destaque: 'Toda ferramenta diz o que invalida o próprio resultado — a parte que as calculadoras da internet omitem.',
    numeros: [
      { v: '201', r: 'calculadoras e escores' },
      { v: '15', r: 'áreas clínicas' },
      { v: '396', r: 'referências citadas' },
    ],
    href: '/manual-clinico/ferramentas',
    icone: 'Sigma',
  },
]

export const TOTAL_DE_MODULOS = MODULOS_DO_PACOTE.length

/**
 * Os módulos na ordem em que a vitrine da seção `atual` deve mostrá-los.
 *
 * O módulo da seção em que a pessoa está vem primeiro — ela chegou por ele, é o
 * que reconhece — e os outros seis logo atrás, que é o argumento novo. Sem
 * `atual`, a ordem canônica.
 */
export function modulosOrdenados(atual?: IdDoModulo | null): ModuloDoPacote[] {
  if (!atual) return MODULOS_DO_PACOTE
  const alvo = MODULOS_DO_PACOTE.find((m) => m.id === atual)
  if (!alvo) return MODULOS_DO_PACOTE
  return [alvo, ...MODULOS_DO_PACOTE.filter((m) => m.id !== atual)]
}

/** Todos menos o da seção atual — "o que mais vem junto". */
export function outrosModulos(atual?: IdDoModulo | null): ModuloDoPacote[] {
  if (!atual) return MODULOS_DO_PACOTE
  return MODULOS_DO_PACOTE.filter((m) => m.id !== atual)
}

export function moduloPorId(id: IdDoModulo): ModuloDoPacote | undefined {
  return MODULOS_DO_PACOTE.find((m) => m.id === id)
}

/**
 * Preço dividido pelo número de manuais.
 *
 * É a conta que desarma a objeção de preço sem precisar de desconto: o número
 * que a pessoa compara com o cafezinho não é o total, é o total dividido pelo número de manuais.
 * Devolve `null` quando não há preço para dividir, para a interface simplesmente
 * não mostrar a linha em vez de anunciar "R$ 0,00 por manual".
 */
export function precoPorModulo(preco: number): number | null {
  if (!Number.isFinite(preco) || preco <= 0) return null
  return Math.round((preco / TOTAL_DE_MODULOS) * 100) / 100
}

/**
 * O preço em reais, escrito como o Brasil escreve.
 *
 * Estava duplicado como função local em `components/manual-clinico/pacote.tsx`
 * — mas quem calcula o preço aqui também precisa escrevê-lo (ver
 * `apresentarPreco`), e duas cópias do mesmo formatador são duas chances de a
 * vitrine e o cálculo discordarem sobre uma vírgula.
 */
export function reais(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0))
}

/**
 * O mesmo preço dito por mês.
 *
 * Só faz sentido para plano com prazo — no vitalício não existe "por mês",
 * porque não existe fim. Devolve `null` nesse caso.
 */
export function precoPorMes(preco: number, meses: number | null | undefined): number | null {
  if (!Number.isFinite(preco) || preco <= 0) return null
  if (!meses || meses <= 0) return null
  return Math.round((preco / meses) * 100) / 100
}

/** "1 mês", "6 meses", "12 meses". `null` quando não há prazo. */
export function prazoEmMeses(meses: number | null | undefined): string | null {
  if (!meses || meses <= 0) return null
  return meses === 1 ? '1 mês' : `${meses} meses`
}

export interface PrecoApresentado {
  /** O número grande. */
  destaque: string
  /** Sufixo do número grande — `"/mês"` quando há prazo, `null` quando não há. */
  sufixo: string | null
  /** O mesmo número grande no preço cheio, para riscar. `null` sem lote. */
  destaqueRiscado: string | null
  /** O que será REALMENTE cobrado. Nunca é `null`, nunca é letra miúda. */
  cobranca: string
}

/**
 * Como o preço é dito na vitrine.
 *
 * ## Por que o número grande é o mensal
 *
 * "R$ 197,00" é verdade e é a coisa errada a gritar primeiro: ele é o número
 * de um semestre inteiro, e quem lê compara com o preço de UMA coisa. O mesmo
 * valor dito por mês — "R$ 32,83" — é a mesma verdade na unidade em que a
 * pessoa pensa gasto, e é ela que decide se vale.
 *
 * ## Por que a cobrança vem junto, e não em letra miúda
 *
 * Porque isto NÃO é assinatura. Não há renovação, não há débito mensal: é um
 * pagamento só que abre um prazo. Um "R$ 32,83/mês" solto numa página de
 * compra promete uma cobrança recorrente que não existe, e a pessoa descobre
 * o valor real no cartão — que é o jeito mais rápido de transformar uma venda
 * em estorno. Por isso `cobranca` sai daqui SEMPRE preenchido, para ser
 * desenhado logo abaixo do número grande e em tamanho legível: "R$ 197,00 uma
 * vez · acesso por 6 meses".
 *
 * Sem prazo (vitalício, ou produto sem plano) não existe mensal a calcular: o
 * número grande volta a ser o total e `sufixo` é `null`.
 */
export function apresentarPreco({
  precoBase,
  precoFinal,
  temLote = false,
  mesesDoPlano,
}: {
  precoBase: number
  precoFinal: number
  temLote?: boolean
  mesesDoPlano: number | null | undefined
}): PrecoApresentado {
  const porMes = precoPorMes(precoFinal, mesesDoPlano)
  const prazo = prazoEmMeses(mesesDoPlano)

  if (porMes == null || prazo == null) {
    return {
      destaque: reais(precoFinal),
      sufixo: null,
      destaqueRiscado: temLote && precoBase > precoFinal ? reais(precoBase) : null,
      cobranca: 'Pagamento único, sem mensalidade.',
    }
  }

  const porMesCheio = precoPorMes(precoBase, mesesDoPlano)

  return {
    destaque: reais(porMes),
    sufixo: '/mês',
    destaqueRiscado:
      temLote && porMesCheio != null && precoBase > precoFinal ? reais(porMesCheio) : null,
    cobranca: `${reais(precoFinal)} uma vez · acesso por ${prazo}`,
  }
}

/**
 * Custo por dia de um plano com prazo — o outro jeito de encolher o número.
 *
 * Só faz sentido para plano com duração: no vitalício não existe "por dia",
 * porque não existe fim. Devolve `null` nesse caso.
 */
export function precoPorDia(preco: number, meses: number | null | undefined): number | null {
  if (!Number.isFinite(preco) || preco <= 0) return null
  if (!meses || meses <= 0) return null
  const dias = meses * 30
  return Math.round((preco / dias) * 100) / 100
}
