import { z } from 'zod'

/**
 * Contratos de dados da Histopatologia.
 *
 * Duas regras orientam o desenho e explicam quase toda decisão daqui:
 *
 * 1. **Campo científico ausente permanece ausente.** O catálogo de origem tem
 *    URLs, títulos e descrições capturadas de páginas — não tem etiologia,
 *    mecanismo, gradação nem diferencial. Um schema que exigisse esses campos
 *    empurraria quem implementa a inventá-los. Por isso o schema *bruto* é
 *    permissivo; quem exige o conjunto mínimo é `esquemaPublicacao`, aplicado
 *    apenas quando alguém tenta marcar a doença como publicada.
 *
 * 2. **Entrada catalogada ≠ doença canônica.** São duas entidades, com dois
 *    schemas e dois ciclos de vida. As 2.917 entradas do catálogo incluem
 *    doenças, variantes, técnicas, casos, recortes anatômicos e até títulos de
 *    navegação ("this page in english"). Promover automaticamente qualquer uma
 *    delas a entidade nosológica seria inventar diagnóstico a partir de nome de
 *    página — exatamente o que a documentação proíbe.
 */

/* ═══════════════════════ Fontes e direitos ═══════════════════════ */

export const esquemaFonteId = z.enum(['unicamp', 'histopathology-atlas'])
export type FonteId = z.infer<typeof esquemaFonteId>

/**
 * Estado de direitos de exibição.
 *
 * A ordem importa e é crescente em permissão:
 *
 * - `pendente` — nenhuma base jurídica registrada. Mostra descrição, crédito e
 *   botão para a página-fonte. **A URL da mídia não sai do servidor.**
 * - `autorizado-link-remoto` — pode-se linkar a imagem/visualizador na origem,
 *   sem incorporar.
 * - `autorizado-incorporacao` — pode-se montar `<img src="URL_REMOTA">` com
 *   crédito adjacente.
 * - `bloqueado` — decisão negativa registrada. Nem a URL da mídia, nem link
 *   direto; sobra a referência bibliográfica.
 *
 * Ausência de informação nunca é autorização: o padrão de todo escopo novo é
 * `pendente`.
 */
export const esquemaEstadoDeDireitos = z.enum([
  'pendente',
  'autorizado-link-remoto',
  'autorizado-incorporacao',
  'bloqueado',
])
export type EstadoDeDireitos = z.infer<typeof esquemaEstadoDeDireitos>

/**
 * Registro versionado de direitos, por escopo.
 *
 * O escopo é o que permite liberar uma coleção sem liberar a fonte inteira — e
 * é por isso que `CREDITOS_E_DIREITOS.md` exige "escopo exato: coleção, página,
 * arquivo ou domínio". Um registro de fonte não vale como registro de coleção.
 */
export const esquemaEscopoDeDireitos = z.object({
  id: z.string().min(1),
  fonteId: esquemaFonteId,
  escopo: z.enum(['fonte', 'colecao', 'dominio', 'pagina', 'arquivo']),
  /** Alvo do escopo: id da fonte, prefixo de URL, host ou id da mídia. */
  alvo: z.string().min(1),
  estado: esquemaEstadoDeDireitos,
  /** Titular/licenciante dos direitos, como identificado na origem. */
  titular: z.string().min(1),
  /** Licença ou autorização aplicável. `null` enquanto não houver. */
  licenca: z.string().nullable(),
  /** URL ou caminho do documento comprobatório. `null` enquanto não houver. */
  comprovante: z.string().nullable(),
  verificadoEm: z.string().min(4),
  responsavel: z.string().min(1),
  restricoes: z.array(z.string()).default([]),
  observacao: z.string().default(''),
})
export type EscopoDeDireitos = z.infer<typeof esquemaEscopoDeDireitos>

export const esquemaFonte = z.object({
  id: esquemaFonteId,
  nome: z.string().min(1),
  url: z.string().url(),
  doi: z.string().optional(),
  creditoCurto: z.string().min(1),
  atribuicaoCatalogada: z.string().min(1),
  /** Hosts que podem aparecer numa URL de mídia desta fonte. Fecha a porta. */
  dominiosDeMidia: z.array(z.string().min(1)).min(1),
  situacaoDeDireitos: z.string().min(1),
  politicaInicial: z.string().min(1),
})
export type Fonte = z.infer<typeof esquemaFonte>

/* ═══════════════════════ Catálogo (dado bruto) ═══════════════════════ */

export const esquemaModalidade = z.enum([
  'Histologia',
  'Imuno-histoquímica',
  'Macroscopia',
  'Imagem anatomopatológica',
  'Lâmina virtual (WSI)',
])
export type Modalidade = z.infer<typeof esquemaModalidade>

/**
 * Referência de mídia, exatamente como catalogada. É a forma que o pipeline lê
 * dos `.json.gz`; espelha `catalogo/esquemas/midia.schema.json`.
 *
 * `politicaDeExibicao` é um literal fixo no catálogo e permanece assim: ele
 * declara que *toda* mídia passa pelo portão de direitos, sem exceção herdada.
 */
export const esquemaMidiaCatalogada = z.object({
  id: z.string().min(1),
  patologiaId: z.string().min(1),
  fonteId: esquemaFonteId,
  patologia: z.string().min(1),
  sistema: z.string().min(1),
  modalidade: esquemaModalidade,
  coloracao: z.string().min(1),
  descricao: z.string(),
  baseDaDescricao: z.string().optional(),
  tituloDaPagina: z.string().optional(),
  urlPaginaFonte: z.string().url(),
  urlImagem: z.string().url().optional(),
  urlMiniatura: z.string().url().optional(),
  urlVisualizador: z.string().url().optional(),
  tipoArquivo: z.string().optional(),
  acessadoEm: z.string().optional(),
  sinalizadorDeQualidade: z.string().optional(),
  politicaDeExibicao: z.literal('url-remota-com-portao-de-direitos'),
})
export type MidiaCatalogada = z.infer<typeof esquemaMidiaCatalogada>

/** Entrada catalogada: espelha `catalogo/esquemas/patologia.schema.json`. */
export const esquemaEntradaCatalogada = z.object({
  id: z.string().min(1),
  fonteId: esquemaFonteId,
  nomeCatalogado: z.string().min(1),
  slugCatalogado: z.string().min(1),
  sistemaCatalogado: z.string().min(1),
  descricaoCatalogada: z.string().optional(),
  quantidadeMidias: z.number().int().nonnegative(),
  quantidadeImagens: z.number().int().nonnegative().optional(),
  quantidadeVisualizadores: z.number().int().nonnegative().optional(),
  paginasFonte: z.array(z.string().url()),
  revisao: z.object({
    estado: z.enum(['pendente', 'em-revisao', 'publicado', 'rejeitado']),
    nota: z.string(),
  }),
  fragmentosDeMidia: z.array(z.string().regex(/^midias\/.+\.json\.gz$/)).min(1),
})
export type EntradaCatalogada = z.infer<typeof esquemaEntradaCatalogada>

/* ═══════════════════════ DTOs entregues à interface ═══════════════════════ */

/**
 * Mídia já filtrada pelo portão de direitos.
 *
 * As URLs são **opcionais de propósito**: `lib/histopatologia/midia.ts` as
 * remove quando o estado não as autoriza. É o único caminho pelo qual uma URL
 * de mídia chega a um componente, e é por isso que "direitos pendentes" não
 * depende de a interface lembrar de checar — não há URL para renderizar.
 */
export const esquemaMidiaExibivel = z.object({
  id: z.string().min(1),
  fonteId: esquemaFonteId,
  modalidade: esquemaModalidade,
  coloracao: z.string().min(1),
  /** Descrição catalogada, sempre texto puro. Nunca é HTML. */
  descricao: z.string(),
  /** A descrição veio da fonte e **não** passou por revisão médica. */
  descricaoRevisada: z.boolean(),
  nomeCatalogado: z.string().min(1),
  urlPaginaFonte: z.string().url(),
  estadoDeDireitos: esquemaEstadoDeDireitos,
  /** Presente somente quando `estadoDeDireitos` permite link ou incorporação. */
  urlImagem: z.string().url().optional(),
  urlVisualizador: z.string().url().optional(),
  /** Texto alternativo editorial. Nunca afirma diagnóstico não revisado. */
  alt: z.string().min(1),
  creditoCurto: z.string().min(1),
  /** Aumento didático atribuído editorialmente, quando houver. */
  aumento: z.enum(['panoramica', 'pequeno', 'medio', 'grande', 'macroscopia']).optional(),
  /** Legenda escrita pela edição do Domine Aqui, quando houver. */
  legendaEditorial: z.string().optional(),
})
export type MidiaExibivel = z.infer<typeof esquemaMidiaExibivel>

/* ═══════════════════════ Revisão biomédica ═══════════════════════ */

export const esquemaEstadoDeRevisao = z.enum([
  'rascunho',
  'revisao-medica',
  'publicado',
  'desatualizado',
])
export type EstadoDeRevisao = z.infer<typeof esquemaEstadoDeRevisao>

export const esquemaReferencia = z.object({
  citacao: z.string().min(8),
  url: z.string().url().optional(),
  /** Organização/consenso de referência, quando o conteúdo depende dele. */
  organizacao: z.string().optional(),
  edicao: z.string().optional(),
  ano: z.number().int().optional(),
})
export type Referencia = z.infer<typeof esquemaReferencia>

/**
 * Revisão biomédica. `revisor` e `revisadoEm` passam a ser obrigatórios no
 * momento em que o estado vira `publicado` — a checagem vive no `refine`, e não
 * na cabeça de quem edita o arquivo.
 */
export const esquemaRevisaoBiomedica = z
  .object({
    estado: esquemaEstadoDeRevisao,
    revisor: z.string().optional(),
    /** Registro profissional do revisor (CRM/CRBM). Publicação o exige. */
    registroProfissional: z.string().optional(),
    revisadoEm: z.string().optional(),
    versao: z.number().int().positive().default(1),
    atualizadoEm: z.string().min(4),
    /** Nota editorial sobre o que falta para publicar. */
    pendencias: z.array(z.string()).default([]),
    historico: z
      .array(z.object({ data: z.string(), autor: z.string(), nota: z.string() }))
      .default([]),
  })
  .refine((r) => r.estado !== 'publicado' || (!!r.revisor && !!r.revisadoEm), {
    message: 'Conteúdo publicado exige revisor biomédico identificado e data de revisão.',
  })
export type RevisaoBiomedica = z.infer<typeof esquemaRevisaoBiomedica>

/* ═══════════════════════ Modelo científico ═══════════════════════ */

export const esquemaBlocoComFontes = z.object({
  texto: z.string().min(1),
  referencias: z.array(esquemaReferencia).default([]),
})
export type BlocoComFontes = z.infer<typeof esquemaBlocoComFontes>

export const esquemaEtiologia = z.object({
  agente: z.string().min(1),
  categoria: z.enum([
    'infecciosa',
    'imunologica',
    'toxica',
    'metabolica',
    'isquemica',
    'genetica',
    'fisica',
    'neoplasica',
    'iatrogenica',
    'idiopatica',
  ]),
  explicacao: z.string().min(1),
})

export const esquemaFatorDeRisco = z.object({
  fator: z.string().min(1),
  /** Por que o fator aumenta o risco — o mecanismo, não só a associação. */
  porQue: z.string().min(1),
  /** Força da evidência, quando declarável sem inventar número. */
  forca: z.enum(['estabelecido', 'provável', 'em-discussão']).optional(),
})

/**
 * Âncora na histologia normal.
 *
 * `caminhoNormal` aponta para uma rota **real** do currículo de Histologia; o
 * teste `__tests__/histopatologia/rotas.test.ts` resolve cada uma contra os
 * fragmentos versionados e falha se um slug sumir numa reingestão. `aproximado`
 * existe porque o acervo normal não cobre todo órgão — o apêndice, por exemplo,
 * é estudado pela mucosa colônica e pelo tecido linfoide; dizer isso é honesto,
 * apontar para "apêndice normal" inexistente não seria.
 */
export const esquemaReferenciaNormal = z.object({
  titulo: z.string().min(1),
  caminhoNormal: z.array(z.string().min(1)).min(1),
  /** O que observar na lâmina normal antes de olhar a doença. */
  oQueObservar: z.string().min(1),
  aproximado: z.boolean().default(false),
  /** Justificativa obrigatória quando `aproximado` é verdadeiro. */
  notaDeAproximacao: z.string().optional(),
})
export type ReferenciaNormal = z.infer<typeof esquemaReferenciaNormal>

/** Uma etapa da cadeia causal. A ordem do array é a ordem da cadeia. */
export const esquemaEtapaCausal = z.object({
  etapa: z.enum([
    'gatilho',
    'alvo',
    'resposta-celular',
    'resposta-tecidual',
    'morfologia',
    'disfuncao',
    'clinica',
    'complicacao',
  ]),
  titulo: z.string().min(1),
  /** Explicação causal: responde "por que o próximo evento acontece?". */
  porQue: z.string().min(1),
  /** Achado morfológico correspondente, quando esta etapa produz um. */
  achadoAssociado: z.string().optional(),
})
export type EtapaCausal = z.infer<typeof esquemaEtapaCausal>

/** Referência a um mecanismo patológico geral, com a aplicação específica. */
export const esquemaAplicacaoDeMecanismo = z.object({
  mecanismoId: z.string().min(1),
  /** Como o conceito geral se materializa nesta doença, neste órgão. */
  aplicacao: z.string().min(1),
})

export const esquemaAchadoMorfologico = z.object({
  achado: z.string().min(1),
  /** Processo biológico que produz o achado. */
  processo: z.string().min(1),
  /** Consequência diagnóstica ou funcional. */
  consequencia: z.string().min(1),
  /**
   * Peso diagnóstico. Distinguir os quatro é o que impede "patognomônico" de
   * ser usado como muleta: a documentação exige separar frequente, sugestivo,
   * necessário e suficiente.
   */
  peso: z.enum(['frequente', 'sugestivo', 'necessário', 'suficiente']).default('frequente'),
})
export type AchadoMorfologico = z.infer<typeof esquemaAchadoMorfologico>

export const esquemaNivelDeAumento = z.object({
  /** O que procurar, na ordem do microscópio. */
  procure: z.string().min(1),
  achados: z.array(esquemaAchadoMorfologico).min(1),
})

/**
 * Roteiro microscópico completo. Panorâmica → pequeno → médio → grande →
 * síntese, sempre nesta ordem; a interface não oferece caminho para pular ao
 * grande aumento antes de estabelecer a arquitetura.
 */
export const esquemaHistopatologiaPorAumento = z.object({
  panoramica: esquemaNivelDeAumento,
  pequeno: esquemaNivelDeAumento,
  medio: esquemaNivelDeAumento,
  grande: esquemaNivelDeAumento,
  /** Quais achados sustentam a hipótese e o que ainda exige correlação. */
  sintese: z.string().min(1),
})
export type HistopatologiaPorAumento = z.infer<typeof esquemaHistopatologiaPorAumento>

/**
 * Exame complementar (coloração especial, IHQ, molecular).
 *
 * Nenhum campo aqui é decorativo: `pergunta`, `limitacoes` e `mudaODiferencial`
 * são o que separa uma explicação de uma lista de marcadores. Resultado de IHQ
 * não é diagnóstico isolado, e o contrato torna isso difícil de esquecer.
 */
export const esquemaExameComplementar = z.object({
  nome: z.string().min(1),
  tipo: z.enum(['coloracao', 'imuno-histoquimica', 'molecular', 'outro']),
  /** Pergunta diagnóstica que o exame responde. */
  pergunta: z.string().min(1),
  padraoEsperado: z.string().min(1),
  controles: z.string().optional(),
  limitacoes: z.array(z.string()).min(1),
  mudaODiferencial: z.string().min(1),
})
export type ExameComplementar = z.infer<typeof esquemaExameComplementar>

export const esquemaCorrelacaoClinica = z.object({
  achadoMorfologico: z.string().min(1),
  consequenciaFuncional: z.string().min(1),
  manifestacao: z.string().min(1),
})

export const esquemaDiferencial = z.object({
  nome: z.string().min(1),
  /** Slug de outra doença canônica, quando ela existe no módulo. */
  slug: z.string().optional(),
  motivoDaConfusao: z.string().min(1),
  achadosCompartilhados: z.array(z.string()).min(1),
  /** O achado que efetivamente separa as duas entidades. */
  discriminador: z.string().min(1),
  exameQueResolve: z.string().optional(),
  armadilhaDeAmostragem: z.string().optional(),
})
export type Diferencial = z.infer<typeof esquemaDiferencial>

export const esquemaComplicacao = z.object({
  complicacao: z.string().min(1),
  mecanismo: z.string().min(1),
})

export const esquemaPergunta = z.object({
  pergunta: z.string().min(1),
  alternativas: z.array(z.string()).min(2),
  indiceCorreto: z.number().int().nonnegative(),
  /** Devolutiva explicativa — por que a certa está certa e as outras não. */
  devolutiva: z.string().min(1),
  nivel: z.enum(['essencial', 'aprofundar', 'avancado']).default('essencial'),
})

/**
 * Conteúdo científico de uma doença.
 *
 * Quase tudo é opcional: uma doença pode entrar no módulo com definição e
 * inventário de lâminas e crescer depois. O que **não** é opcional é a ordem em
 * que a interface apresenta o que existe, e a exigência de conjunto mínimo para
 * publicar (`esquemaPublicacao`).
 */
export const esquemaConteudoDeDoenca = z.object({
  objetivos: z.array(z.string()).default([]),
  definicao: z.string().min(1),
  epidemiologia: esquemaBlocoComFontes.optional(),
  etiologias: z.array(esquemaEtiologia).default([]),
  fatoresDeRisco: z.array(esquemaFatorDeRisco).default([]),
  histologiaNormalDeReferencia: z.array(esquemaReferenciaNormal).default([]),
  mecanismoPatologicoGeral: z.array(esquemaAplicacaoDeMecanismo).default([]),
  fisiopatologiaEspecifica: z.array(esquemaEtapaCausal).default([]),
  macroscopia: z.array(esquemaAchadoMorfologico).default([]),
  histopatologia: esquemaHistopatologiaPorAumento.optional(),
  coloracoesEspeciais: z.array(esquemaExameComplementar).default([]),
  imunoHistoquimica: z.array(esquemaExameComplementar).default([]),
  biologiaMolecular: z.array(esquemaExameComplementar).default([]),
  correlacaoClinica: z.array(esquemaCorrelacaoClinica).default([]),
  diagnosticosDiferenciais: z.array(esquemaDiferencial).default([]),
  complicacoes: z.array(esquemaComplicacao).default([]),
  prognostico: esquemaBlocoComFontes.optional(),
  /** Quadro normal × patológico: o que foi perdido, ganho ou reorganizado. */
  normalVersusPatologico: z
    .array(
      z.object({
        aspecto: z.string().min(1),
        normal: z.string().min(1),
        patologico: z.string().min(1),
      }),
    )
    .default([]),
  resumoDeProva: z.array(z.string()).default([]),
  armadilhas: z.array(z.string()).default([]),
  perguntasDeAutoavaliacao: z.array(esquemaPergunta).default([]),
  referencias: z.array(esquemaReferencia).default([]),
})
export type ConteudoDeDoenca = z.infer<typeof esquemaConteudoDeDoenca>

/* ═══════════════════════ Mecanismo geral ═══════════════════════ */

export const esquemaMecanismoGeral = z.object({
  id: z.string().min(1),
  nome: z.string().min(1),
  sinonimos: z.array(z.string()).default([]),
  familia: z.enum([
    'lesao-celular',
    'inflamacao',
    'hemodinamica',
    'imunopatologia',
    'infeccao',
    'reparo-fibrose',
    'genetica',
    'neoplasia',
  ]),
  /** Conceito reutilizável, independente de órgão. */
  conceito: z.string().min(1),
  /** Como o mecanismo se registra na morfologia. */
  assinaturaMorfologica: z.array(z.string()).min(1),
  referencias: z.array(esquemaReferencia).default([]),
})
export type MecanismoGeral = z.infer<typeof esquemaMecanismoGeral>

/** Forma de entrada do mecanismo — o que os arquivos editoriais escrevem. */
export type MecanismoGeralEntrada = z.input<typeof esquemaMecanismoGeral>

/* ═══════════════════════ Sistema ═══════════════════════ */

export const esquemaSistema = z.object({
  id: z.string().min(1),
  nome: z.string().min(1),
  /** Nomes do campo `sistemaCatalogado` que este sistema absorve. */
  sistemasCatalogados: z.array(z.string()).default([]),
  descricao: z.string().min(1),
  /** Rota de entrada correspondente no Manual da Histologia normal. */
  caminhoNormal: z.array(z.string()).optional(),
})
export type Sistema = z.infer<typeof esquemaSistema>

/* ═══════════════════════ Doença canônica ═══════════════════════ */

/**
 * Seleção editorial de mídia dentro de uma entrada catalogada.
 *
 * `bloqueadas` existe para retirar uma imagem específica sem retirar a entrada
 * inteira — o caso real é a lâmina cuja legenda de origem afirma um diagnóstico
 * que a revisão não sustenta.
 */
export const esquemaSelecaoDeMidia = z.object({
  midiaId: z.string().min(1),
  aumento: z.enum(['panoramica', 'pequeno', 'medio', 'grande', 'macroscopia']).optional(),
  legendaEditorial: z.string().optional(),
  alt: z.string().optional(),
  ordem: z.number().int().nonnegative().default(0),
})

export const esquemaDoencaCanonica = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  nome: z.string().min(1),
  sinonimos: z.array(z.string()).default([]),
  /** Sinônimos em inglês, cadastrados um a um. Nunca traduzidos em runtime. */
  sinonimosEmIngles: z.array(z.string()).default([]),
  sistemaId: z.string().min(1),
  orgaos: z.array(z.string()).min(1),
  natureza: z.enum(['nao-neoplasica', 'neoplasica-benigna', 'neoplasica-maligna', 'indefinida']),
  /** Entradas catalogadas consolidadas nesta doença. Pode ser vazio. */
  catalogoIds: z.array(z.string()).default([]),
  /** Mídias escolhidas editorialmente, na ordem didática. */
  midiasPrincipais: z.array(esquemaSelecaoDeMidia).default([]),
  /** Mídias retiradas de exibição, com motivo registrado. */
  midiasBloqueadas: z.array(z.object({ midiaId: z.string(), motivo: z.string().min(8) })).default([]),
  mecanismoIds: z.array(z.string()).default([]),
  padroesMorfologicos: z.array(z.string()).default([]),
  conteudo: esquemaConteudoDeDoenca,
  revisao: esquemaRevisaoBiomedica,
})
export type DoencaCanonica = z.infer<typeof esquemaDoencaCanonica>

/**
 * Forma de *entrada* da doença canônica — a que os arquivos editoriais escrevem.
 *
 * Difere de `DoencaCanonica` exatamente nos campos com `.default()`: no tipo de
 * saída eles já existem, no de entrada são opcionais. Tipar os arquivos
 * editoriais pela entrada é o que permite escrever uma doença nova declarando só
 * o que ela tem, sem uma parede de `[]` para satisfazer o compilador — e o
 * pipeline, que sempre roda `esquemaDoencaCanonica.parse`, entrega ao aplicativo
 * a forma completa.
 */
export type DoencaCanonicaEntrada = z.input<typeof esquemaDoencaCanonica>

/**
 * Conjunto mínimo para publicar, conforme a seção 13 do plano.
 *
 * Separado do schema principal de propósito. Uma doença em `rascunho` com dois
 * campos preenchidos é um estado legítimo do fluxo editorial; a mesma doença
 * marcada como `publicado` sem mecanismo, sem roteiro por aumento e sem
 * referência é conteúdo médico apresentado como revisado sem o ser. O pipeline
 * roda esta validação e **falha o build** nesse caso.
 */
export function validarPublicacao(doenca: DoencaCanonica): string[] {
  if (doenca.revisao.estado !== 'publicado') return []
  const faltas: string[] = []
  const c = doenca.conteudo
  if (c.histologiaNormalDeReferencia.length === 0) faltas.push('histologia normal de referência')
  if (c.mecanismoPatologicoGeral.length === 0) faltas.push('mecanismo patológico geral')
  if (c.fisiopatologiaEspecifica.length < 4) faltas.push('cadeia fisiopatológica específica')
  if (!c.histopatologia) faltas.push('roteiro histopatológico por aumento')
  if (c.correlacaoClinica.length === 0) faltas.push('correlação morfofuncional')
  if (c.diagnosticosDiferenciais.length === 0) faltas.push('ao menos um diagnóstico diferencial')
  if (c.referencias.length === 0) faltas.push('referências bibliográficas')
  if (!doenca.revisao.revisor) faltas.push('revisor identificado')
  if (!doenca.revisao.revisadoEm) faltas.push('data de revisão')
  if (!doenca.revisao.registroProfissional) faltas.push('registro profissional do revisor')
  return faltas
}

/* ═══════════════════════ Derivados ═══════════════════════ */

/** Resumo de doença usado em listas, mapas e cartões. Sem URLs de mídia. */
export const esquemaResumoDeDoenca = z.object({
  slug: z.string(),
  nome: z.string(),
  sistemaId: z.string(),
  natureza: esquemaDoencaCanonica.shape.natureza,
  mecanismoIds: z.array(z.string()),
  orgaos: z.array(z.string()),
  estadoDeRevisao: esquemaEstadoDeRevisao,
  definicaoCurta: z.string(),
  /** Quantas mídias catalogadas a doença agrega, por modalidade. */
  midias: z.record(z.string(), z.number().int().nonnegative()),
  temLaminaVirtual: z.boolean(),
  fontes: z.array(esquemaFonteId),
})
export type ResumoDeDoenca = z.infer<typeof esquemaResumoDeDoenca>

/** Resumo de entrada catalogada para o atlas de inventário. Sem URLs. */
export const esquemaResumoDeEntrada = z.object({
  id: z.string(),
  fonteId: esquemaFonteId,
  nome: z.string(),
  nomeCompleto: z.string(),
  sistemaId: z.string(),
  sistemaCatalogado: z.string(),
  midias: z.number().int().nonnegative(),
  /** Mídias em domínio da allowlist da fonte — as únicas exibíveis. */
  midiasElegiveis: z.number().int().nonnegative(),
  modalidades: z.array(esquemaModalidade),
  coloracoes: z.array(z.string()),
  temLaminaVirtual: z.boolean(),
  /** Slug da doença canônica que consolidou esta entrada, quando houver. */
  doencaSlug: z.string().optional(),
  /** O título parece nome de entidade, ou é prosa capturada da página? */
  tituloConfiavel: z.boolean(),
  paginasFonte: z.array(z.string()),
  /**
   * Fragmentos do catálogo que contêm as mídias desta entrada.
   *
   * Guardado no derivado para que a leitura sob demanda abra **um** arquivo em
   * vez de varrer os dezoito — e para que o nome do arquivo lido venha sempre de
   * um dado conciliado no build, nunca de um parâmetro de URL.
   */
  fragmentosDeMidia: z.array(z.string()),
})
export type ResumoDeEntrada = z.infer<typeof esquemaResumoDeEntrada>

/**
 * Entrada do índice de busca. Campos abreviados porque o índice de cliente é
 * baixado inteiro; `t` tipo, `u` url, `n` nome, `b` trilha, `k` chave.
 *
 * **Nunca** carrega URL de mídia — é o contrato que o teste de bundle verifica.
 */
export const esquemaEntradaBusca = z.object({
  /** 'd' doença, 'c' entrada catalogada, 's' sistema, 'm' mecanismo. */
  t: z.enum(['d', 'c', 's', 'm']),
  u: z.string(),
  n: z.string(),
  b: z.string(),
  k: z.string(),
  /** Estado de revisão, quando `t === 'd'`. */
  r: esquemaEstadoDeRevisao.optional(),
})
export type EntradaBusca = z.infer<typeof esquemaEntradaBusca>

export const esquemaRelatorio = z.object({
  geradoEm: z.string(),
  versaoDoMapaEditorial: z.number().int().positive(),
  catalogo: z.object({
    patologias: z.number().int(),
    midias: z.number().int(),
    fragmentos: z.number().int(),
    falhasDeColeta: z.number().int(),
  }),
  conciliacao: z.object({
    midiasVinculadas: z.number().int(),
    midiasPorFonte: z.record(z.string(), z.number().int()),
    midiasPorModalidade: z.record(z.string(), z.number().int()),
    /** Mídias cuja URL está fora da allowlist da fonte. Contadas, não apagadas. */
    midiasForaDaAllowlist: z.number().int(),
    hostsForaDaAllowlist: z.record(z.string(), z.number().int()),
    /** Mídias sem nenhuma URL utilizável depois da filtragem. */
    midiasSemDestinoElegivel: z.number().int(),
  }),
  editorial: z.object({
    doencas: z.number().int(),
    doencasPublicadas: z.number().int(),
    doencasEmRevisao: z.number().int(),
    entradasConsolidadas: z.number().int(),
    entradasNaoConsolidadas: z.number().int(),
    midiasSelecionadas: z.number().int(),
    midiasBloqueadas: z.number().int(),
  }),
  derivados: z.object({
    arquivos: z.number().int(),
    bytes: z.number().int(),
    bytesDoIndiceDeCliente: z.number().int(),
  }),
  /** Divergências encontradas. Vazio é o único estado aceitável. */
  divergencias: z.array(z.string()),
})
export type Relatorio = z.infer<typeof esquemaRelatorio>

/** Fragmento de uma doença: o que a página de doença carrega, e nada além. */
export const esquemaFragmentoDeDoenca = z.object({
  doenca: esquemaDoencaCanonica,
  /** Entradas catalogadas consolidadas, com contadores. */
  entradas: z.array(esquemaResumoDeEntrada),
  /** Mídias selecionadas editorialmente, já resolvidas do catálogo. */
  galeria: z.array(esquemaMidiaCatalogada),
})
export type FragmentoDeDoenca = z.infer<typeof esquemaFragmentoDeDoenca>
