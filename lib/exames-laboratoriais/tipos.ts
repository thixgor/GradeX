/**
 * Tipos da central de Exames Laboratoriais — o DomineAqui Lab.
 *
 * O modelo inteiro nasce de uma decisão editorial: **nenhum marcador é um
 * número com faixa de referência ao lado**. Um marcador é uma molécula que
 * alguém produz, que circula, que é depurada por algum órgão — e o valor no
 * papel é a fotografia desse equilíbrio num instante. Por isso o tipo
 * `Marcador` não tem um campo "causas de aumento: string[]": ele tem
 * `aumento.mecanismos[]`, e cada mecanismo carrega a cadeia causal escrita
 * (`doença → alteração fisiopatológica → mudança na concentração`). Listar
 * doenças é o que qualquer tabela faz; explicar por que cada uma mexe no
 * número é o produto.
 *
 * ## Três profundidades, um só conteúdo
 *
 * `resumo`, `entenda` e `aprofundar` não são três textos sobre o mesmo assunto:
 * são a mesma explicação em três distâncias. A interface mostra uma de cada vez
 * (ver `components/exames-laboratoriais/ficha-marcador.tsx`), então o texto
 * pode ser tão profundo quanto o assunto exige sem que a tela fique cansativa
 * para quem só quer conferir um valor de referência entre um paciente e outro.
 *
 * ## Campos obrigatórios e campos opcionais
 *
 * O núcleo (`id`, `nome`, `referencias`, `resumo`, `fisiologia`, `aumento`) é
 * obrigatório porque sem ele não existe ficha — só verbete. Tudo que é
 * aprofundamento (`comparacoes`, `cinetica`, `normalizacao`, `diferenciais`) é
 * opcional: há marcadores em que a comparação lado a lado é o coração da
 * interpretação (ferritina, TSH) e outros em que ela seria invenção. Preferimos
 * um catálogo honesto — fundo onde há o que dizer, direto onde não há — a um
 * catálogo uniforme preenchido com texto de enchimento.
 *
 * ## Valores de referência
 *
 * `referencias` é sempre uma lista, nunca um par min/max solto. Isso é
 * deliberado e clínico: hemoglobina de homem não é hemoglobina de mulher,
 * creatinina de idoso não é creatinina de jovem, TSH de gestante no primeiro
 * trimestre não é TSH de adulto não gestante. O tipo obriga quem escreve a
 * dizer *de quem* é aquele intervalo, e a interface sempre imprime o aviso de
 * que o laboratório executor manda mais do que qualquer tabela.
 */

/* ══════════════════════════ Eixos de organização ══════════════════════════ */

/** Grupo de conteúdo — governa o code-splitting (um arquivo por grupo). */
export type GrupoId =
  | 'hematologia'
  | 'ferro'
  | 'renal'
  | 'hepatico'
  | 'eletrolitos'
  | 'cardiaco'
  | 'inflamatorio'
  | 'lipidico'
  | 'endocrino'
  | 'glicemia'
  | 'coagulacao'
  | 'gasometria'
  | 'urinalise'
  | 'tumorais'
  | 'vitaminas'
  | 'imunologia'
  | 'infectologia'
  | 'digestivo'
  // Domínios acrescentados na expansão para medicina laboratorial completa.
  // Cada um existe porque a pergunta clínica que ele responde não cabia em
  // nenhum dos grupos anteriores: monitorização de fármaco não é toxicologia,
  // líquido pleural não é urinálise, autoanticorpo específico não é o FAN.
  | 'autoimunidade'
  | 'alergologia'
  | 'neurologia'
  | 'muscular'
  | 'osseo'
  | 'onco-hematologia'
  | 'liquidos'
  | 'fecal'
  | 'toxicologia'
  | 'farmacos'
  | 'hemostasia'

/** Sistema do organismo — eixo de navegação da tela "Exames por Sistemas". */
export type SistemaId =
  | 'hematologico'
  | 'hepatobiliar'
  | 'renal'
  | 'cardiovascular'
  | 'endocrino'
  | 'respiratorio'
  | 'digestivo'
  | 'imunologico'
  | 'infeccioso'
  | 'metabolico'
  | 'oncologico'
  | 'neurologico'
  | 'musculoesqueletico'
  | 'toxicologico'

/** Para que serve clinicamente aquele marcador. Não são exclusivos entre si. */
export type UtilidadeClinica =
  | 'diagnostico'
  | 'prognostico'
  | 'rastreamento'
  | 'acompanhamento'
  | 'triagem'

/** Direção de uma alteração — governa a seta e a cor na folha do laudo. */
export type Direcao = 'alto' | 'baixo' | 'normal' | 'muito-alto' | 'muito-baixo'

/* ═══════════════════════════ Valores de referência ═══════════════════════ */

export interface FaixaReferencia {
  /** De quem é este intervalo: 'Adulto', 'Homens', 'Gestante — 1º trimestre'. */
  rotulo: string
  /** Limite inferior, quando o intervalo é numérico. */
  minimo?: number
  /** Limite superior, quando o intervalo é numérico. */
  maximo?: number
  /**
   * Intervalo escrito, para o que não cabe em min/max — "< 0,04 ng/mL",
   * "Não reagente", "Ausente". Tem precedência sobre min/max na exibição.
   */
  texto?: string
  unidade: string
  /** O detalhe que muda a leitura: método, jejum, momento da coleta. */
  observacao?: string
}

/* ═══════════════════════════════ Fisiologia ══════════════════════════════ */

export interface Fisiologia {
  /** O que a molécula é, em uma frase — antes de qualquer doença. */
  oQueE: string
  /** Onde é produzida: órgão, célula, compartimento. */
  origem: string
  /** Como é sintetizada ou gerada. */
  sintese?: string
  /** Como circula e a que se liga no plasma. */
  circulacao?: string
  /** Para que serve no organismo saudável. */
  funcao: string
  /** O que o corpo faz com ela depois. */
  metabolismo?: string
  /** Por onde sai. */
  eliminacao?: string
  /** Meia-vida plasmática — é o que explica a velocidade de subida e queda. */
  meiaVida?: string
  /** Órgãos cuja função altera a concentração, mesmo sem doença deles. */
  orgaosEnvolvidos?: string[]
  /**
   * A cadeia visual do percurso da molécula, etapa a etapa. É o que o
   * componente `<Fluxo>` desenha:
   * `['Creatina muscular', 'ciclização espontânea', 'creatinina', 'filtração glomerular', 'urina']`
   */
  percurso?: string[]
}

/* ═════════════════════════ Por que sobe / por que cai ════════════════════ */

/**
 * A cadeia causal escrita — o núcleo pedagógico da seção.
 *
 * Não basta dizer "insuficiência renal aumenta a creatinina": as `etapas`
 * mostram *onde* a fisiologia se rompeu, e é isso que permite ao estudante
 * deduzir sozinho o comportamento de uma doença que ele nunca viu.
 */
export interface CadeiaCausal {
  /** A situação clínica: doença, medicamento, estado fisiológico. */
  causa: string
  /** O caminho, etapa a etapa, até a alteração laboratorial. */
  etapas: string[]
  /** O detalhe que diferencia essa causa das vizinhas. */
  nota?: string
}

export interface Mecanismo {
  /** O mecanismo em si: 'Eliminação reduzida', 'Liberação por lesão celular'. */
  titulo: string
  /** Por que esse mecanismo mexe no número, em linguagem de fisiologia. */
  explicacao: string
  /** As situações clínicas que operam por esse mecanismo, cada uma explicada. */
  exemplos: CadeiaCausal[]
}

/**
 * Causas separadas por peso epidemiológico — nunca por probabilidade absoluta.
 *
 * A distinção importa: o exame sozinho não estabelece probabilidade clínica.
 * "Muito comum" aqui significa "é o que mais aparece na prática quando esse
 * valor vem alterado", não "seu paciente tem X% de chance de ter isso".
 */
export interface CausasPorPeso {
  muitoComuns?: string[]
  comuns?: string[]
  menosComuns?: string[]
  /** As que passam batido e custam caro quando passam. */
  naoEsquecer?: string[]
  /** As que mudam a conduta na mesma hora. */
  emergencias?: string[]
}

export interface Alteracao {
  /** Uma frase: por que, em essência, esse marcador se move nessa direção. */
  resumo: string
  /** O que significa clinicamente estar assim (não o que causa — o que é). */
  significado?: string
  mecanismos: Mecanismo[]
  causas?: CausasPorPeso
}

/* ═══════════════════════ Diferenciais e comparações ══════════════════════ */

export interface Diferencial {
  hipotese: string
  /** O que aponta para ela dentro do próprio exame. */
  pistas: string[]
  /** O que resolve a dúvida — o exame ou dado clínico que fecha. */
  comoConfirmar: string
}

/**
 * A tabela lado a lado que ensina a diferenciar.
 *
 * `linhas[].celulas` acompanha a ordem de `hipoteses`. O texto de cada célula
 * é curto de propósito ('↑↑', '↓', 'normal ou ↑') — a leitura em `leitura`
 * é quem explica o padrão; a tabela existe para ser varrida com os olhos.
 */
export interface Comparacao {
  id: string
  titulo: string
  /** Uma linha dizendo qual dúvida clínica esta tabela resolve. */
  pergunta?: string
  hipoteses: string[]
  linhas: { marcador: string; celulas: string[] }[]
  /** O raciocínio: o que faz a diferença entre as colunas. */
  leitura: string
  /** O que a tabela não resolve — e depende da clínica. */
  limites?: string
}

/* ═════════════════════════════ Interferentes ═════════════════════════════ */

export interface Interferentes {
  /** Antes do tubo chegar ao aparelho: jejum, garrote, hemólise, transporte. */
  preAnalitico?: string[]
  /** Não é doença e mesmo assim muda: idade, sexo, gravidez, exercício, ritmo. */
  fisiologico?: string[]
  /** Fármacos com interferência de fato relevante — não a bula inteira. */
  medicamentos?: string[]
  /** Por que o mesmo soro dá números diferentes em laboratórios diferentes. */
  metodo?: string[]
}

/* ══════════════════════ Cinética e normalização ══════════════════════════ */

export interface Cinetica {
  /** Quanto tempo depois do insulto o marcador começa a subir. */
  inicio?: string
  /** Quando atinge o pico. */
  pico?: string
  /** Quanto tempo leva para voltar, uma vez cessada a causa. */
  normalizacao?: string
  /** Por que a tendência entre duas coletas vale mais que um valor isolado. */
  tendencia?: string
}

export interface CenarioNormalizacao {
  /** A situação que alterou o marcador. */
  cenario: string
  /** O que faz o número voltar — sempre corrigindo a causa, não o número. */
  caminho: string
  /** Em quanto tempo se espera ver a mudança. */
  prazo?: string
}

/* ══════════════════════════════ O marcador ══════════════════════════════ */

export interface Marcador {
  id: string
  nome: string
  /** Sigla de uso corrente: 'AST', 'TSH', 'NT-proBNP'. */
  sigla?: string
  /**
   * Como a pessoa pode chamar isso na busca. TGO precisa achar AST, que precisa
   * achar aspartato aminotransferase — são o mesmo exame com três nomes em uso
   * simultâneo no Brasil, e quem digita um deles não sabe que existe o outro.
   */
  sinonimos?: string[]
  grupo: GrupoId
  sistemas: SistemaId[]
  /** Material biológico: 'Soro', 'Sangue total com EDTA', 'Urina de 24h'. */
  material: string
  unidade: string
  referencias: FaixaReferencia[]

  /** Nível 1 — o que é, em segundos. */
  resumo: string
  /** Nível 2 — a explicação que basta para interpretar. */
  entenda?: string
  /** Nível 3 — fisiologia, bioquímica e raciocínio, em parágrafos. */
  aprofundar?: string[]

  fisiologia: Fisiologia
  aumento: Alteracao
  reducao?: Alteracao

  diferenciais?: Diferencial[]
  comparacoes?: Comparacao[]

  /**
   * O bloco "não interprete isoladamente": que marcadores leem-se junto e o
   * que a combinação muda.
   */
  relacionados?: { titulo: string; ids: string[]; leitura: string }[]

  interferentes?: Interferentes
  cinetica?: Cinetica
  normalizacao?: CenarioNormalizacao[]

  /** Para que serve: diagnóstico, prognóstico, rastreamento, acompanhamento. */
  utilidade?: UtilidadeClinica[]
  /** A ressalva que precisa aparecer sempre — marcadores tumorais, sobretudo. */
  advertencia?: string

  /** Ids de padrões laboratoriais em que este marcador é peça. */
  padroes?: string[]
  /** Ids de doenças cujo padrão inclui este marcador. */
  doencas?: string[]
  /** "Você também deveria estudar" — ids de outros marcadores. */
  estudarTambem?: string[]
}

/* ═══════════════════════════ Exames (painéis) ═══════════════════════════ */

export interface BlocoDoExame {
  /** 'Série vermelha', 'Série branca', 'Plaquetas'. */
  titulo: string
  /** Uma linha sobre o que o bloco avalia. */
  descricao?: string
  marcadores: string[]
}

export interface Exame {
  id: string
  nome: string
  sigla?: string
  sinonimos?: string[]
  grupo: GrupoId
  sistemas: SistemaId[]
  material: string
  /** O que o exame avalia — a primeira coisa que a página do exame mostra. */
  oQueAvalia: string
  /** Roteiro de leitura: por onde começar e em que ordem olhar. */
  comoInterpretar: string[]
  blocos: BlocoDoExame[]
  /** Alterações que aparecem com frequência nesse exame. */
  alteracoesComuns?: { titulo: string; descricao: string }[]
  /** Ids de padrões laboratoriais que este exame revela. */
  padroes?: string[]
  /** Cenários que o Laboratório Virtual sabe gerar para este exame. */
  cenarios?: string[]
  /** Preparo e armadilhas de coleta específicas do exame. */
  preparo?: string[]
}

/* ═══════════════════════ Padrões laboratoriais ═══════════════════════════ */

export interface AchadoDoPadrao {
  /** Nome do marcador como aparece na leitura do padrão. */
  marcador: string
  /** Id do marcador, quando existe ficha — vira link. */
  id?: string
  /** '↑↑', '↓', 'normal ou ↑'. */
  direcao: string
  /** Por que este achado faz parte do padrão. */
  porque?: string
}

export interface Padrao {
  id: string
  nome: string
  /** O reconhecimento em uma linha: 'AST e ALT muito acima de FA e GGT'. */
  assinatura: string
  sistemas: SistemaId[]
  achados: AchadoDoPadrao[]
  /** O mecanismo que produz esse conjunto — o coração do padrão. */
  mecanismo: string
  /** O que costuma estar por trás. */
  causas: string[]
  /** O passo seguinte: o que pedir, o que perguntar. */
  proximoPasso?: string[]
  /** O que imita esse padrão e não é ele. */
  armadilhas?: string[]
  /** Ids de doenças que produzem este padrão. */
  doencas?: string[]
}

/* ═════════════════════════ Doenças → exames ═════════════════════════════ */

export interface AchadoEsperado {
  marcador: string
  id?: string
  direcao: string
  /** Por que essa doença mexe nesse marcador dessa forma. */
  porque: string
}

export interface Doenca {
  id: string
  nome: string
  sinonimos?: string[]
  sistemas: SistemaId[]
  /** O mecanismo da doença, do ponto de vista do laboratório. */
  fisiopatologia: string
  esperado: AchadoEsperado[]
  /** O que confirma. */
  confirmacao?: string[]
  /** Do que precisa ser diferenciada. */
  diferenciais?: string[]
  /** Ids de comparações lado a lado que a envolvem. */
  comparacoes?: string[]
  /** Ids de padrões laboratoriais. */
  padroes?: string[]
  /** Id do cenário do Laboratório Virtual que reproduz este quadro. */
  cenario?: string
}

/* ══════════════════════════════ Sistemas ═════════════════════════════════ */

export interface EtapaDoMapa {
  /** 'Hepatócito', 'Lesão celular', 'Liberação de ALT e AST'. */
  titulo: string
  /** O que acontece nessa etapa. */
  detalhe?: string
}

export interface MapaFisiologico {
  titulo: string
  etapas: EtapaDoMapa[]
  /** O que o mapa ensina, em uma frase. */
  leitura?: string
}

export interface Sistema {
  id: SistemaId
  nome: string
  /** Uma linha: o que este sistema entrega ao laboratório. */
  chamada: string
  /** Cor de identidade do sistema na grade — classe utilitária Tailwind. */
  cor: string
  /** Nome do ícone em lucide-react. */
  icone: string
  /** Os marcadores do sistema, agrupados por eixo funcional. */
  eixos: { titulo: string; descricao?: string; marcadores: string[] }[]
  mapas?: MapaFisiologico[]
  padroes?: string[]
}
