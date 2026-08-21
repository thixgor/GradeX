/** Formatos devolvidos por /api/admin/stats/* — espelho dos payloads das rotas. */

export type RangeKey = '24h' | '7d' | '30d' | '90d' | '12m' | 'all'

export const RANGE_OPTIONS: { key: RangeKey; label: string; short: string }[] = [
  { key: '24h', label: 'Últimas 24 horas', short: '24h' },
  { key: '7d', label: 'Últimos 7 dias', short: '7d' },
  { key: '30d', label: 'Últimos 30 dias', short: '30d' },
  { key: '90d', label: 'Últimos 90 dias', short: '90d' },
  { key: '12m', label: 'Últimos 12 meses', short: '12m' },
  { key: 'all', label: 'Desde o início', short: 'Tudo' },
]

export type AttemptStatus = 'opened' | 'in_progress' | 'idle' | 'abandoned' | 'submitted'

export const ATTEMPT_STATUS_META: Record<AttemptStatus, { label: string; color: string; descricao: string }> = {
  in_progress: { label: 'Fazendo agora', color: 'var(--viz-good)', descricao: 'Sinal de vida nos últimos 3 minutos' },
  idle: { label: 'Parado', color: 'var(--viz-warning)', descricao: 'Começou e está sem sinal há alguns minutos' },
  abandoned: { label: 'Saiu no meio', color: 'var(--viz-critical)', descricao: 'Começou, sumiu por mais de 15 min e não entregou' },
  opened: { label: 'Só abriu', color: 'var(--viz-serious)', descricao: 'Abriu a prova e nunca chegou a começar' },
  submitted: { label: 'Entregou', color: 'var(--viz-1)', descricao: 'Enviou a prova' },
}

export interface OverviewPayload {
  range: { key: RangeKey; label: string; from: string; to: string; days: number; granularity: string }
  kpis: {
    usuarios: { total: number; novos: number; delta: number | null }
    provas: { total: number; novas: number }
    submissoes: { total: number; periodo: number; delta: number | null }
    nota: { media: number | null; avaliadas: number; delta: number | null }
    aberturas: { total: number; delta: number | null }
    downloads: { total: number; delta: number | null }
  }
  funil: {
    aberturas: number
    iniciadas: number
    entregues: number
    abandonadas: number
    desistiuAntesDeComecar: number
    taxaInicio: number
    taxaConclusao: number
    taxaAbandono: number
    progressoMedioAoAbandonar: number
  }
  series: Record<string, string | number>[]
  distribuicoes: {
    contas: { gratuito: number; trial: number; plus: number; banidos: number }
    metodos: { normal: number; tri: number; discursive: number }
    notas: { label: string; count: number }[]
    dispositivos: { label: string; count: number }[]
    areas: { label: string; count: number; usuarios: number }[]
  }
  heatmap: number[][]
  topProvas: {
    examId: string
    titulo: string
    aberturas: number
    iniciadas: number
    entregues: number
    alunos: number
    taxaConclusao: number
  }[]
  topUsuarios: {
    userId: string
    nome: string
    provas: number
    media: number | null
    melhor: number | null
    ultima: string | null
  }[]
  topConteudo: {
    kind: string
    resourceId: string
    titulo: string
    area: string
    aberturas: number
    usuarios: number
    ultima: string | null
  }[]
  aoVivo: { online: number; fazendoProva: number }
}

export interface ExamRow {
  examId: string
  titulo: string
  metodo: string
  questoes: number
  criadaEm: string | null
  criadaPor: string
  oculta: boolean
  treino: boolean
  pessoal: boolean
  proctoring: boolean
  duracao: number | null
  janela: { inicio: string | null; fim: string | null }
  aberturas: number
  iniciadas: number
  entregues: number
  abandonadas: number
  soDeuUmaOlhada: number
  acontecendoAgora: number
  alunosUnicos: number
  ultimoAcesso: string | null
  paradaMediaPct: number | null
  taxaConclusao: number | null
  taxaAbandono: number | null
  submissoes: number
  media: number | null
  melhor: number | null
  pior: number | null
  aguardandoCorrecao: number
  ultimaSubmissao: string | null
}

export interface ExamsPayload {
  range: { key: RangeKey; label: string }
  total: number
  page: number
  limit: number
  totais: {
    aberturas: number
    iniciadas: number
    entregues: number
    abandonadas: number
    submissoes: number
    aguardandoCorrecao: number
  }
  provas: ExamRow[]
}

export interface ExamDetailPayload {
  prova: {
    examId: string
    titulo: string
    metodo: string
    questoes: number
    objetivas: number
    criadaEm: string | null
    criadaPor: string
    oculta: boolean
    treino: boolean
    proctoring: boolean
    duracao: number | null
    janela: { inicio: string | null; fim: string | null }
    truncado: boolean
  }
  resumo: {
    aberturas: number
    iniciadas: number
    entregues: number
    abandonadas: number
    acontecendoAgora: number
    soAbriram: number
    submissoes: number
    media: number | null
    aproveitamentoMedio: number | null
    taxaConclusao: number | null
    taxaAbandono: number | null
    porStatus: Record<string, number>
    downloads: { tipo: string; count: number }[]
  }
  ranking: {
    posicao: number
    submissionId: string
    userId: string
    nome: string
    nota: number | null
    acertos: number
    totalObjetivas: number
    aproveitamento: number | null
    respondidas: number
    embranco: number
    correcaoPendente: boolean
    enviadaEm: string | null
    iniciadaEm: string | null
    duracaoMs: number | null
  }[]
  tentativas: {
    attemptId: string
    userId: string
    nome: string
    email: string
    plano: string
    status: AttemptStatus
    abriuEm: string | null
    comecouEm: string | null
    ultimoSinal: string | null
    enviouEm: string | null
    respondidas: number
    totalQuestoes: number
    progresso: number
    parouNaQuestao: number
    saiuDaAba: number
    duracaoMs: number
    dispositivo: string
  }[]
  porQuestao: {
    id: string
    numero: number
    indice: number
    tipo: string
    enunciado: string
    acertos: number
    erros: number
    embranco: number
    respostas: number
    taxaAcerto: number | null
    alternativas: { id: string; letra: string; correta: boolean; marcacoes: number }[]
  }[]
  abandonoPorQuestao: { questao: number; abandonos: number }[]
  distribuicaoNotas: { label: string; count: number }[]
}

export interface UserRow {
  userId: string
  nome: string
  email: string
  plano: string
  banido: boolean
  cadastro: string | null
  ultimoLogin: string | null
  faculdade: string
  periodo: string
  provas: number
  provasDistintas: number
  media: number | null
  melhor: number | null
  pior: number | null
  ultimaProva: string | null
  aberturasProva: number
  provasIniciadas: number
  provasEntregues: number
  provasAbandonadas: number
  fazendoAgora: boolean
  conteudosAbertos: number
  areas: string[]
  downloads: number
  dispositivos: number
  ultimaAtividade: string | null
}

export interface UsersPayload {
  range: { key: RangeKey; label: string }
  total: number
  page: number
  limit: number
  resumo: {
    exibidos: number
    ativos: number
    nuncaFizeram: number
    comAbandono: number
    fazendoAgora: number
  }
  usuarios: UserRow[]
}

export interface UserDetailPayload {
  usuario: {
    userId: string
    nome: string
    email: string
    plano: string
    papel: string
    banido: boolean
    cadastro: string | null
    ultimoLogin: string | null
    trialExpiraEm: string | null
    faculdade: string
    periodo: string
  }
  resumo: {
    provasEntregues: number
    media: number | null
    melhor: number | null
    pior: number | null
    provasAbertas: number
    provasAbandonadas: number
    fazendoAgora: number
    conteudosAbertos: number
    downloads: number
    dispositivosAtivos: number
  }
  historicoProvas: {
    submissionId: string
    examId: string
    titulo: string
    nota: number | null
    correcaoPendente: boolean
    enviadaEm: string | null
    duracaoMs: number | null
    questoesRespondidas: number
    totalQuestoes: number
  }[]
  tentativas: {
    attemptId: string
    examId: string
    titulo: string
    status: AttemptStatus
    abriuEm: string | null
    comecouEm: string | null
    enviouEm: string | null
    ultimoSinal: string | null
    progresso: number
    parouNaQuestao: number
    totalQuestoes: number
    saiuDaAba: number
    duracaoMs: number
    dispositivo: string
  }[]
  conteudos: {
    kind: string
    rotulo: string
    area: string
    resourceId: string
    titulo: string
    dispositivo: string
    em: string
  }[]
  topConteudos: { key: string; titulo: string; area: string; aberturas: number }[]
  downloads: { tipo: string; titulo: string; em: string }[]
  dispositivos: { aparelho: string; ip: string; ultimaAtividade: string | null; revogado: boolean }[]
}

export interface ContentRanking {
  resourceId: string
  titulo: string
  aberturas: number
  leitores: number
  ultima: string | null
}

export interface ContentPayload {
  range: { key: RangeKey; label: string }
  resumo: {
    totalPatologias: number
    totalMateriais: number
    aberturasNoPeriodo: number
    downloadsNoPeriodo: number
  }
  porArea: { area: string; aberturas: number; leitores: number }[]
  porTipo: { kind: string; rotulo: string; aberturas: number; leitores: number }[]
  manualClinico: {
    maisAbertas: ContentRanking[]
    porArea: { label: string; count: number }[]
    porSistema: { label: string; count: number }[]
  }
  materiais: {
    maisAbertos: ContentRanking[]
    leitorPdf: ContentRanking[]
    leitorHtml: ContentRanking[]
  }
  downloads: {
    porTipo: { tipo: string; rotulo: string; count: number }[]
    maisBaixados: { tipo: string; rotulo: string; resourceId: string; titulo: string; count: number; ultimo: string }[]
    porUsuario: { userId: string; nome: string; email: string; count: number; ultimo: string }[]
  }
  feed: {
    userId: string | null
    nome: string
    email: string
    plano: string
    kind: string
    rotulo: string
    area: string
    titulo: string
    resourceId: string
    dispositivo: string
    em: string
  }[]
  seriePorArea: { dia: string; area: string; count: number }[]
}

export interface LivePayload {
  geradoEm: string
  heartbeatSegundos: number
  resumo: {
    online: number
    dispositivosOnline: number
    fazendoProva: number
    paradosNaProva: number
    apenasAbriram: number
    aberturasUltimaHora: number
  }
  online: {
    userId: string
    nome: string
    email: string
    plano: string
    admin: boolean
    aparelhos: number
    dispositivo: string
    ultimaAtividade: string | null
    inativoHaSegundos: number | null
  }[]
  provasAgora: {
    attemptId: string
    examId: string
    prova: string
    userId: string
    nome: string
    email: string
    plano: string
    status: AttemptStatus
    respondidas: number
    totalQuestoes: number
    progresso: number
    questaoAtual: number
    parouNaQuestao: number
    saiuDaAba: number
    comecouEm: string | null
    duracaoMs: number
    ultimoSinal: string | null
    silencioSegundos: number | null
    dispositivo: string
  }[]
  feed: {
    nome: string
    userId: string | null
    rotulo: string
    area: string
    titulo: string
    dispositivo: string
    em: string
  }[]
}
