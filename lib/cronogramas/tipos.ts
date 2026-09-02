/**
 * Vocabulário compartilhado dos cronogramas.
 *
 * Este módulo é puro e client-safe de propósito: a página do aluno, a do admin,
 * o gerador e o cron dos lembretes falam todos daqui, e nenhum deles deveria
 * arrastar `mongodb` ou o JSON de 500 KB da ementa junto.
 */

// ── Seções (cursos) ─────────────────────────────────────────────────────────

export type SecaoCurso = 'medicina' | 'psicologia' | 'biomedicina' | 'odontologia'

export interface DefinicaoSecao {
  id: SecaoCurso
  nome: string
  /** Nome curto para chips e filtros onde o nome inteiro não cabe. */
  curto: string
  emoji: string
  /**
   * Quantos períodos o curso tem. É a lista inteira, não só a parte com ementa
   * importada: uma avaliação do 7º período existe na agenda antes de alguém
   * publicar o conteúdo programático dele, e esconder o período deixaria essa
   * prova invisível para a turma.
   */
  periodos: number
  /** Cor da marca usada nos destaques da seção (hex, tema-agnóstica). */
  cor: string
}

export const SECOES: DefinicaoSecao[] = [
  // Medicina vai até o 8º: é o alcance dos calendários de avaliação que a
  // coordenação publica ("N3 ESPECÍFICA – 1º AO 8º PERÍODO – MEDICINA") e dos
  // eixos que aparecem neles (HAM 8, IESC 8).
  { id: 'medicina', nome: 'Medicina', curto: 'Med', emoji: '🩺', periodos: 8, cor: '#468152' },
  { id: 'psicologia', nome: 'Psicologia', curto: 'Psico', emoji: '🧠', periodos: 10, cor: '#7C6BD8' },
  { id: 'biomedicina', nome: 'Biomedicina', curto: 'Biomed', emoji: '🔬', periodos: 7, cor: '#2E8FA8' },
  { id: 'odontologia', nome: 'Odontologia', curto: 'Odonto', emoji: '🦷', periodos: 10, cor: '#CE5929' },
]

export const SECOES_IDS = SECOES.map(s => s.id)

export function isSecaoCurso(valor: unknown): valor is SecaoCurso {
  return typeof valor === 'string' && (SECOES_IDS as string[]).includes(valor)
}

export function getSecao(id: SecaoCurso): DefinicaoSecao {
  return SECOES.find(s => s.id === id) ?? SECOES[0]
}

/**
 * Normaliza qualquer coisa que já tenha sido gravada como curso em outra parte
 * do site (o sufixo `-afya` legado dos cronogramas antigos, maiúsculas vindas
 * de importação, o rótulo com acento) para uma seção válida.
 */
export function normalizarSecao(valor: unknown): SecaoCurso | null {
  if (typeof valor !== 'string') return null
  const limpo = valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/-afya$/, '')
    .trim()
  return isSecaoCurso(limpo) ? limpo : null
}

// ── Prioridade da ementa ────────────────────────────────────────────────────

/**
 * Prioridade declarada entre parênteses na ementa (`(Prioridade: Alta)`).
 * `normal` é o que o item recebe quando o documento não declarou nada — a
 * regra pedida: "se não tiver estabelecido, faça como normal".
 */
export type Prioridade = 'alta' | 'media' | 'normal' | 'baixa'

export const PRIORIDADES: Prioridade[] = ['alta', 'media', 'normal', 'baixa']

export interface EstiloPrioridade {
  rotulo: string
  /** Ordem de estudo: quanto menor, mais cedo o item entra no cronograma. */
  ordem: number
  /** Multiplicador de horas e de reforço na repetição espaçada. */
  peso: number
  classe: string
  ponto: string
}

export const ESTILO_PRIORIDADE: Record<Prioridade, EstiloPrioridade> = {
  alta: {
    rotulo: 'Alta',
    ordem: 0,
    peso: 1.35,
    classe: 'bg-[#CE5929]/12 text-[#CE5929] dark:text-[#F0A07E] border-[#CE5929]/30',
    ponto: 'bg-[#CE5929]',
  },
  media: {
    rotulo: 'Média',
    ordem: 1,
    peso: 1,
    classe: 'bg-[#E2A43E]/12 text-[#9A6D12] dark:text-[#E2A43E] border-[#E2A43E]/30',
    ponto: 'bg-[#E2A43E]',
  },
  normal: {
    rotulo: 'Padrão',
    ordem: 2,
    peso: 1,
    classe: 'bg-muted text-muted-foreground border-border',
    ponto: 'bg-muted-foreground/50',
  },
  baixa: {
    rotulo: 'Baixa',
    ordem: 3,
    peso: 0.7,
    classe: 'bg-[#468152]/10 text-[#468152] dark:text-[#7DCEA0] border-[#468152]/25',
    ponto: 'bg-[#468152]/60',
  },
}

export function normalizarPrioridade(valor: unknown): Prioridade {
  return typeof valor === 'string' && (PRIORIDADES as string[]).includes(valor)
    ? (valor as Prioridade)
    : 'normal'
}

// ── Ementa ──────────────────────────────────────────────────────────────────

export interface EmentaSubmodulo {
  id: string
  nome: string
  prioridade: Prioridade
}

export interface EmentaModulo {
  id: string
  nome: string
  prioridade: Prioridade
  horasEstimadas: number
  incluido: boolean
  submodulos: EmentaSubmodulo[]
}

export interface EmentaSubtopico {
  id: string
  nome: string
  prioridade: Prioridade
  incluido: boolean
  modulos: EmentaModulo[]
}

export interface EmentaTopico {
  id: string
  nome: string
  prioridade: Prioridade
  incluido: boolean
  subtopicos: EmentaSubtopico[]
}

export interface ResumoPeriodo {
  periodo: number
  topicos: number
  subtopicos: number
  modulos: number
  submodulos: number
  horas: number
}

export interface IndiceCurso {
  id: SecaoCurso
  nome: string
  periodos: ResumoPeriodo[]
}

/** Contagem agregada de uma lista de tópicos — usada nos cabeçalhos da ementa. */
export function contarEmenta(topicos: EmentaTopico[]) {
  let subtopicos = 0
  let modulos = 0
  let submodulos = 0
  let horas = 0
  const porPrioridade: Record<Prioridade, number> = { alta: 0, media: 0, normal: 0, baixa: 0 }

  for (const topico of topicos) {
    subtopicos += topico.subtopicos.length
    for (const sub of topico.subtopicos) {
      modulos += sub.modulos.length
      for (const modulo of sub.modulos) {
        submodulos += modulo.submodulos.length
        horas += modulo.horasEstimadas
        porPrioridade[modulo.prioridade] += 1
      }
    }
  }

  return { topicos: topicos.length, subtopicos, modulos, submodulos, horas, porPrioridade }
}

// ── Avaliações ──────────────────────────────────────────────────────────────

export type TipoAvaliacao = 'prova' | 'simulado' | 'trabalho' | 'apresentacao' | 'pratica' | 'outro'

export interface DefinicaoTipoAvaliacao {
  id: TipoAvaliacao
  rotulo: string
  emoji: string
  classe: string
}

export const TIPOS_AVALIACAO: DefinicaoTipoAvaliacao[] = [
  { id: 'prova', rotulo: 'Prova', emoji: '📝', classe: 'bg-[#CE5929]/12 text-[#CE5929] dark:text-[#F0A07E] border-[#CE5929]/30' },
  { id: 'simulado', rotulo: 'Simulado', emoji: '🎯', classe: 'bg-[#468152]/12 text-[#468152] dark:text-[#7DCEA0] border-[#468152]/30' },
  { id: 'trabalho', rotulo: 'Trabalho', emoji: '📄', classe: 'bg-[#E2A43E]/12 text-[#9A6D12] dark:text-[#E2A43E] border-[#E2A43E]/30' },
  { id: 'apresentacao', rotulo: 'Apresentação', emoji: '🎤', classe: 'bg-[#7C6BD8]/12 text-[#6558B8] dark:text-[#B3A9F0] border-[#7C6BD8]/30' },
  { id: 'pratica', rotulo: 'Prática', emoji: '🧪', classe: 'bg-[#2E8FA8]/12 text-[#2E8FA8] dark:text-[#7FCBDE] border-[#2E8FA8]/30' },
  { id: 'outro', rotulo: 'Outro', emoji: '📌', classe: 'bg-muted text-muted-foreground border-border' },
]

export function getTipoAvaliacao(id: TipoAvaliacao | string): DefinicaoTipoAvaliacao {
  return TIPOS_AVALIACAO.find(t => t.id === id) ?? TIPOS_AVALIACAO[TIPOS_AVALIACAO.length - 1]
}

export type UnidadeFrequencia = 'dias' | 'semanas'

/**
 * Configuração de lembretes de UMA avaliação. Mora dentro do documento da
 * avaliação porque é sempre editada junto com ela — separar em outra coleção
 * obrigaria o admin a abrir duas telas para responder "quando esse povo é
 * avisado da P1?".
 */
export interface ConfigLembrete {
  /** Desligado aqui, ninguém dessa avaliação recebe nada. */
  ativo: boolean
  /** Quantos dias antes da avaliação o primeiro lembrete sai. */
  iniciarDiasAntes: number
  /** A cada quanto repete, na unidade escolhida. */
  frequencia: number
  unidade: UnidadeFrequencia
  /** Horário de envio em Brasília, "HH:MM". */
  horario: string
  /** Texto opcional do admin, entra no corpo do lembrete. */
  observacao?: string
}

export const LEMBRETE_PADRAO: ConfigLembrete = {
  ativo: true,
  iniciarDiasAntes: 14,
  frequencia: 3,
  unidade: 'dias',
  horario: '19:00',
}

export interface Avaliacao {
  _id?: string
  secao: SecaoCurso
  /**
   * O período da turma. Quando `todosOsPeriodos` é true ele deixa de valer
   * como filtro e serve só de âncora para ordenação e telas antigas.
   */
  periodo: number
  /**
   * A avaliação vale para o curso inteiro, como UMA prova.
   *
   * É o caso do teste de progresso: mesma prova, mesmo dia, mesmo horário,
   * do 1º ao último período. Cadastrá-la como oito avaliações iguais era
   * possível, mas errado — o painel ficava com oito linhas para editar e
   * apagar juntas, e uma correção de data que esquecesse uma turma passaria
   * despercebida. Uma prova, um registro.
   */
  todosOsPeriodos?: boolean
  titulo: string
  tipo: TipoAvaliacao
  /** Data no calendário de Brasília, "AAAA-MM-DD". */
  data: string
  /** Horário de início em Brasília, "HH:MM". Vazio = dia inteiro. */
  hora?: string
  local?: string
  /** Conteúdo cobrado, em texto livre. */
  conteudo?: string
  /** Ids de tópicos/subtópicos da ementa cobrados na avaliação. */
  itensEmenta?: string[]
  peso?: number
  lembrete: ConfigLembrete
  publicada: boolean
  criadaEm?: string
  atualizadaEm?: string
  criadaPor?: string
}

/**
 * A avaliação alcança este período?
 *
 * Um único lugar responde isso — painel, calendário do aluno, consulta ao
 * banco e cron dos lembretes — porque uma prova visível para a turma no
 * calendário e invisível para o disparo do lembrete seria o pior defeito
 * possível aqui.
 */
export function cobrePeriodo(
  avaliacao: Pick<Avaliacao, 'periodo' | 'todosOsPeriodos'>,
  periodo: number,
): boolean {
  return avaliacao.todosOsPeriodos === true || avaliacao.periodo === periodo
}

/** "3º período" ou "todos os períodos" — o alcance em uma expressão. */
export function descreverAlcance(
  avaliacao: Pick<Avaliacao, 'periodo' | 'todosOsPeriodos'>,
): string {
  return avaliacao.todosOsPeriodos ? 'todos os períodos' : `${avaliacao.periodo}º período`
}

// ── Provas repetidas turma a turma ──────────────────────────────────────────

export interface GrupoMesmaProva {
  chave: string
  /** As avaliações do grupo, em ordem de período. */
  avaliacoes: Avaliacao[]
  /** Períodos que o grupo já cobre hoje. */
  periodos: number[]
  /** Períodos que a fusão passaria a cobrir e hoje não estão no grupo. */
  faltando: number[]
  /** true quando o grupo já cobre o curso inteiro — fundir não amplia nada. */
  cobreOCursoInteiro: boolean
}

function assinaturaDaProva(avaliacao: Avaliacao): string {
  const titulo = avaliacao.titulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

  return [avaliacao.secao, avaliacao.data, avaliacao.hora ?? '', titulo].join('|')
}

/**
 * Acha a MESMA prova cadastrada uma vez por turma.
 *
 * Mesma seção, mesma data, mesmo horário e mesmo título em vários períodos é
 * quase sempre uma prova só que entrou copiada — o teste de progresso é o caso
 * clássico. Elas não estão erradas, mas viram trabalho repetido: corrigir a
 * data exige editar todas, e esquecer uma deixa a turma com a agenda diferente.
 *
 * Só agrupa; a decisão de fundir é do admin, e a tela mostra quais períodos a
 * fusão passaria a cobrir — a N3 de manhã, por exemplo, tem quatro turmas com
 * mesmo horário porque as outras quatro fazem à tarde, e fundir ali estaria
 * errado.
 */
export function agruparMesmaProva(avaliacoes: Avaliacao[]): GrupoMesmaProva[] {
  const porAssinatura = new Map<string, Avaliacao[]>()

  for (const avaliacao of avaliacoes) {
    if (avaliacao.todosOsPeriodos) continue
    const chave = assinaturaDaProva(avaliacao)
    porAssinatura.set(chave, [...(porAssinatura.get(chave) ?? []), avaliacao])
  }

  const grupos: GrupoMesmaProva[] = []

  for (const [chave, doGrupo] of porAssinatura) {
    if (doGrupo.length < 2) continue

    const ordenadas = [...doGrupo].sort((a, b) => a.periodo - b.periodo)
    const periodos = [...new Set(ordenadas.map(item => item.periodo))]
    const total = getSecao(ordenadas[0].secao).periodos
    const faltando = Array.from({ length: total }, (_, i) => i + 1).filter(
      numero => !periodos.includes(numero),
    )

    grupos.push({
      chave,
      avaliacoes: ordenadas,
      periodos,
      faltando,
      cobreOCursoInteiro: faltando.length === 0,
    })
  }

  return grupos.sort((a, b) => a.avaliacoes[0].data.localeCompare(b.avaliacoes[0].data))
}

/** Um disparo já feito, gravado para não repetir o mesmo lembrete no mesmo dia. */
export interface EnvioLembrete {
  avaliacaoId: string
  userId: string
  /** Data de Brasília do envio, "AAAA-MM-DD". */
  dia: string
  diasRestantes: number
  enviadoEm: Date
  canal: 'email' | 'app'
}

// ── Preferências do aluno ───────────────────────────────────────────────────

export interface PreferenciasCronograma {
  /** O opt-in do calendário: "Quero receber lembretes das minhas avaliações". */
  lembretesAtivos: boolean
  /** Seção que o aluno está acompanhando (o seletor da página). */
  secao: SecaoCurso
  periodo: number
  /** `false` quando `secao` é só o padrão do site, não uma escolha gravada. */
  secaoEscolhida?: boolean
  atualizadoEm?: string
}

// ── Urgência de uma avaliação ───────────────────────────────────────────────

/**
 * Estilo de cada faixa de proximidade (`faixaProximidade` em `brasilia.ts`).
 *
 * A cor aqui é leitura, não decoração: laranja da marca para o que é hoje ou
 * está em cima, âmbar para a janela de estudo produtiva, verde para o que
 * ainda está longe, cinza para o que já passou. O aluno aprende as quatro numa
 * olhada e nunca mais precisa ler o rótulo.
 *
 * Mora em `tipos.ts` — e não no componente do calendário, onde nasceu —
 * porque a barra de foco da página, o cartão de avaliação e a grade do mês
 * precisam pintar a MESMA prova da mesma cor. Duas cópias divergiam na
 * primeira vez que alguém ajustasse um tom.
 */
export interface EstiloFaixa {
  /** Filete vertical do cartão. */
  barra: string
  /** Pílula com borda (grade do mês, selos). */
  chip: string
  /** A cor como tinta de texto, já legível nos dois temas. */
  texto: string
  /** Fundo suave para painéis inteiros. */
  fundo: string
  anel: string
}

export const ESTILO_FAIXA: Record<
  'passada' | 'hoje' | 'critica' | 'proxima' | 'distante',
  EstiloFaixa
> = {
  hoje: {
    barra: 'bg-[#CE5929]',
    chip: 'bg-[#CE5929]/15 text-[#CE5929] dark:text-[#F3A588] border-[#CE5929]/30',
    texto: 'text-[#CE5929] dark:text-[#F3A588]',
    fundo: 'bg-[#CE5929]/8 border-[#CE5929]/25',
    anel: 'ring-[#CE5929]/40',
  },
  critica: {
    barra: 'bg-[#CE5929]',
    chip: 'bg-[#CE5929]/12 text-[#CE5929] dark:text-[#F3A588] border-[#CE5929]/25',
    texto: 'text-[#CE5929] dark:text-[#F3A588]',
    fundo: 'bg-[#CE5929]/6 border-[#CE5929]/20',
    anel: 'ring-[#CE5929]/30',
  },
  proxima: {
    barra: 'bg-[#E2A43E]',
    chip: 'bg-[#E2A43E]/14 text-[#9A6D12] dark:text-[#E2A43E] border-[#E2A43E]/30',
    texto: 'text-[#9A6D12] dark:text-[#E2A43E]',
    fundo: 'bg-[#E2A43E]/8 border-[#E2A43E]/25',
    anel: 'ring-[#E2A43E]/30',
  },
  distante: {
    barra: 'bg-[#468152]',
    chip: 'bg-[#468152]/12 text-[#468152] dark:text-[#7DCEA0] border-[#468152]/25',
    texto: 'text-[#468152] dark:text-[#7DCEA0]',
    fundo: 'bg-[#468152]/6 border-[#468152]/20',
    anel: 'ring-[#468152]/25',
  },
  passada: {
    barra: 'bg-muted-foreground/40',
    chip: 'bg-muted text-muted-foreground border-border',
    texto: 'text-muted-foreground',
    fundo: 'bg-muted/40 border-border',
    anel: 'ring-border',
  },
}
