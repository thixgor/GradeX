import { z } from 'zod'

/**
 * Contratos de dados do Manual da Histologia.
 *
 * Tudo que o pipeline gera passa por aqui antes de ser escrito, e o teste
 * `__tests__/histologia/dados.test.ts` revalida os artefatos versionados. A
 * regra que orienta o desenho: **nenhum campo científico é obrigatório**. O
 * acervo de origem não contém histogênese, ultraestrutura nem correlação
 * clínica em português, e um schema que exigisse esses campos empurraria quem
 * implementa a inventá-los. Campo ausente é ausente; a interface mostra a
 * lacuna em vez de preenchê-la.
 */

/* ─────────────────────── Proveniência e crédito ─────────────────────── */

export const esquemaCredito = z.object({
  /** Texto de crédito exatamente como identificado na página de origem. */
  texto: z.string().min(1),
  /** De onde veio o crédito: da página do acervo ou escrito pela edição. */
  origem: z.enum(['acervo', 'editorial']),
})
export type Credito = z.infer<typeof esquemaCredito>

export const esquemaProveniencia = z.object({
  /** URL da página original no digitalhistology.org. */
  urlOrigem: z.string().url(),
  /** Data ISO de acesso ao acervo. */
  acessadoEm: z.string(),
  /** Identificador numérico da página no catálogo de origem. */
  idOrigem: z.number().int().nonnegative(),
  /** Caminho do arquivo no acervo-fonte, para auditoria. */
  arquivoOrigem: z.string(),
  licenca: z.literal('CC BY-NC-SA 4.0'),
})
export type Proveniencia = z.infer<typeof esquemaProveniencia>

/* ───────────────────────────── Mídia ───────────────────────────── */

/**
 * Referência de mídia por hash. O `sha256` é a chave canônica: dois arquivos
 * com o mesmo conteúdo compartilham a mesma entrada e a mesma URL de CDN, e é
 * por isso que 9.500 referências viram 9.175 objetos.
 */
export const esquemaMidia = z.object({
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
  bytes: z.number().int().positive(),
  mime: z.string().min(1),
  /**
   * Extensão do arquivo de origem. Guardada explicitamente porque **não é
   * derivável do MIME**: duas imagens do acervo são `.jpeg` (não `.jpg`) e os
   * 19 pacotes H5P chegam como `application/octet-stream`. Derivar do MIME
   * quebraria 21 URLs de CDN.
   */
  ext: z.string().min(1),
  /** URL original do arquivo, preservada por exigência de atribuição. */
  urlOrigem: z.string().url(),
  /** Texto alternativo em português, contextual. Nunca vazio. */
  alt: z.string().min(1),
  /**
   * Largura e altura em pixels, quando conhecidas. Só o acervo de quiz (H5P)
   * declara dimensões; para as lâminas o viewer lê do próprio arquivo.
   */
  largura: z.number().int().positive().optional(),
  altura: z.number().int().positive().optional(),
})
export type Midia = z.infer<typeof esquemaMidia>

/**
 * Camada de marcação sobreposta à lâmina.
 *
 * `explicacaoOriginal` é o texto em inglês, tal como veio — mantido porque é a
 * prova de origem e a matéria-prima da tradução. `explicacao` é a versão em
 * português; enquanto não existir, a interface mostra o original com aviso
 * explícito de que ainda não passou por revisão. Nunca traduza aqui de forma
 * automática e marque como revisado.
 */
export const esquemaOverlay = z.object({
  id: z.string().min(1),
  ordem: z.number().int().positive(),
  /** Rótulo em português exibido ao aluno. */
  rotulo: z.string().min(1),
  /** Rótulo original, preservado para busca e conferência. */
  rotuloOriginal: z.string(),
  explicacao: z.string().optional(),
  explicacaoOriginal: z.string().optional(),
  midia: esquemaMidia,
})
export type Overlay = z.infer<typeof esquemaOverlay>

/* ─────────────────────── Estado editorial ─────────────────────── */

/**
 * Nada é publicado por omissão. `pendente-de-revisao` é o padrão e aparece na
 * interface como tarja visível — o aluno precisa saber o que já passou por
 * revisor biomédico e o que ainda não passou.
 */
export const esquemaRevisao = z.object({
  estado: z.enum(['pendente-de-revisao', 'em-revisao', 'publicado']),
  /** Nome do revisor biomédico. Obrigatório quando estado === 'publicado'. */
  revisor: z.string().optional(),
  revisadoEm: z.string().optional(),
  /** Histórico editorial, em ordem cronológica. */
  historico: z
    .array(z.object({ data: z.string(), autor: z.string(), nota: z.string() }))
    .default([]),
}).refine(
  (r) => r.estado !== 'publicado' || (!!r.revisor && !!r.revisadoEm),
  { message: 'Conteúdo publicado exige revisor biomédico e data de revisão.' },
)
export type Revisao = z.infer<typeof esquemaRevisao>

export const esquemaReferencia = z.object({
  citacao: z.string().min(1),
  url: z.string().url().optional(),
})
export type Referencia = z.infer<typeof esquemaReferencia>

/* ─────────────────────── Dossiê didático ─────────────────────── */

/**
 * O aprofundamento didático de uma lâmina. Todos os campos são opcionais de
 * propósito (ver a nota no topo do arquivo): o acervo não os fornece, e eles só
 * ganham valor quando escritos com fonte e revisados por humano. A página
 * renderiza apenas as seções presentes e informa quais faltam.
 */
export const esquemaDossie = z.object({
  objetivos: z.array(z.string()).optional(),
  minutosEstimados: z.number().int().positive().optional(),
  resumoOrientador: z.string().optional(),
  comoReconhecer: z
    .array(z.object({ aumento: z.string(), pista: z.string() }))
    .optional(),
  celulasEMatriz: z.string().optional(),
  arquiteturaEFuncao: z.string().optional(),
  histogenese: z.string().optional(),
  coloracaoEAparencia: z.string().optional(),
  ultraestrutura: z.string().optional(),
  vascularizacaoEInervacao: z.string().optional(),
  renovacaoEHomeostase: z.string().optional(),
  diferenciais: z.array(z.object({ contra: z.string(), criterio: z.string() })).optional(),
  armadilhas: z.array(z.string()).optional(),
  correlacoesClinicas: z.array(z.string()).optional(),
  checkpoint: z
    .array(
      z.object({
        pergunta: z.string(),
        alternativas: z.array(z.string()).min(2),
        indiceCorreto: z.number().int().nonnegative(),
        explicacao: z.string(),
      }),
    )
    .optional(),
  resumoDeAltaRetencao: z.array(z.string()).optional(),
  referencias: z.array(esquemaReferencia).optional(),
})
export type Dossie = z.infer<typeof esquemaDossie>

/* ─────────────────────── Calibração óptica ─────────────────────── */

/**
 * Escala em micrômetros. **Só existe quando o dado de origem a comprova.**
 *
 * O acervo não traz calibração para as lâminas, então este campo fica ausente e
 * a régua micrométrica não é desenhada. Inventar `µm/px` a partir do objetivo
 * nominal produziria uma medida plausível e falsa — o erro mais fácil de
 * cometer e o mais difícil de o aluno detectar.
 */
export const esquemaCalibracao = z.object({
  micrometrosPorPixel: z.number().positive(),
  fonte: z.string().min(1),
})
export type Calibracao = z.infer<typeof esquemaCalibracao>

/* ─────────────────────────── Página ─────────────────────────── */

export const esquemaTrilha = z.object({
  slug: z.string(),
  titulo: z.string(),
})

export const esquemaPagina = z.object({
  slug: z.string().min(1),
  /** Caminho completo de slugs, do setor até a lâmina. */
  caminho: z.array(z.string().min(1)).min(1),
  /** Breadcrumb legível, em português. */
  trilha: z.array(esquemaTrilha).min(1),
  titulo: z.string().min(1),
  tituloOriginal: z.string(),
  /**
   * 'lamina' tem imagem e/ou marcadores e vira página didática;
   * 'secao' é nó de índice do currículo e vira landing de seção.
   */
  tipo: z.enum(['lamina', 'secao']),
  setor: z.string().min(1),
  descricaoOriginal: z.string(),
  descricao: z.string().optional(),
  base: esquemaMidia.nullable(),
  overlays: z.array(esquemaOverlay),
  calibracao: esquemaCalibracao.optional(),
  dossie: esquemaDossie,
  revisao: esquemaRevisao,
  creditos: z.array(esquemaCredito),
  proveniencia: esquemaProveniencia,
  /** Colorações detectadas no texto de origem (H&E, PAS, tricrômico…). */
  coloracoes: z.array(z.string()),
  /** Slugs de quizzes que cobrem este assunto. */
  quizzes: z.array(z.string()),
})
export type Pagina = z.infer<typeof esquemaPagina>

/* ─────────────────────────── Quiz ─────────────────────────── */

export const esquemaAlternativa = z.object({
  id: z.string().min(1),
  texto: z.string().min(1),
  correta: z.boolean(),
  /** Devolutiva explicativa exibida depois da resposta. */
  feedback: z.string(),
})

export const esquemaQuestao = z.object({
  id: z.string().min(1),
  numero: z.number().int().positive(),
  enunciado: z.string().min(1),
  enunciadoOriginal: z.string(),
  /**
   * Imagem da questão. O `alt` aqui é deliberadamente descritivo *sem* entregar
   * a resposta — descrever "corte de osso compacto com linha cementante" numa
   * questão que pergunta qual é a estrutura anularia o exercício para quem usa
   * leitor de tela.
   */
  midia: esquemaMidia.nullable(),
  alternativas: z.array(esquemaAlternativa).min(2),
  multipla: z.boolean(),
})
export type Questao = z.infer<typeof esquemaQuestao>

export const esquemaQuiz = z.object({
  slug: z.string().min(1),
  titulo: z.string().min(1),
  tituloOriginal: z.string(),
  idOrigem: z.number().int().nonnegative(),
  idH5p: z.string(),
  questoes: z.array(esquemaQuestao).min(1),
  proveniencia: esquemaProveniencia,
  revisao: esquemaRevisao,
  /** Percentual de acerto para aprovação, herdado do pacote de origem. */
  percentualAprovacao: z.number().min(0).max(100),
})
export type Quiz = z.infer<typeof esquemaQuiz>

/* ─────────────────────── Índice e busca ─────────────────────── */

export const esquemaNoCurriculo: z.ZodType<NoCurriculo> = z.lazy(() =>
  z.object({
    slug: z.string(),
    caminho: z.array(z.string()),
    titulo: z.string(),
    tipo: z.enum(['lamina', 'secao']),
    /** Quantidade de lâminas abaixo deste nó, inclusive. */
    laminas: z.number().int().nonnegative(),
    estruturas: z.number().int().nonnegative(),
    filhos: z.array(esquemaNoCurriculo),
  }),
)
export interface NoCurriculo {
  slug: string
  caminho: string[]
  titulo: string
  tipo: 'lamina' | 'secao'
  laminas: number
  estruturas: number
  filhos: NoCurriculo[]
}

export const esquemaEntradaBusca = z.object({
  /** 'l' lâmina, 's' seção, 'e' estrutura, 'q' quiz — abreviado para caber. */
  t: z.enum(['l', 's', 'e', 'q']),
  /** Caminho da URL (sem o prefixo do módulo). */
  u: z.string(),
  /** Título exibido. */
  n: z.string(),
  /** Trilha legível curta. */
  b: z.string(),
  /** Chave de busca já normalizada (sem acento, sem pontuação). */
  k: z.string(),
  /** Id do overlay, quando t === 'e'. */
  o: z.string().optional(),
  /** Hash da miniatura, quando houver. */
  m: z.string().optional(),
})
export type EntradaBusca = z.infer<typeof esquemaEntradaBusca>

export const esquemaRelatorio = z.object({
  geradoEm: z.string(),
  paginas: z.number().int(),
  laminas: z.number().int(),
  secoes: z.number().int(),
  imagensBase: z.number().int(),
  overlays: z.number().int(),
  imagensDeQuiz: z.number().int(),
  pacotesH5p: z.number().int(),
  quizzes: z.number().int(),
  questoes: z.number().int(),
  referenciasDeArquivo: z.number().int(),
  assetsUnicos: z.number().int(),
  bytesUnicos: z.number().int(),
  entradasDeBusca: z.number().int(),
  fragmentos: z.number().int(),
  /** Divergências encontradas na conciliação. Vazio é o único estado aceitável. */
  divergencias: z.array(z.string()),
})
export type Relatorio = z.infer<typeof esquemaRelatorio>
