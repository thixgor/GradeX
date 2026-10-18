/**
 * Resumo por IA das monitorias — tipos compartilhados (servidor, cliente e testes).
 *
 * Três registros, cada um com um dono só:
 *  - `AdicionalResumo` (monitorias_resumos_adicionais): o DINHEIRO. Um por
 *    assento que comprou; segue o estado do assento (pago, entregue,
 *    reembolsado). Nunca entra no repasse do monitor.
 *  - `TarefaResumo` (monitorias_resumos): o PROCESSAMENTO. Um por reserva
 *    (uma aula gera um resumo, entregue a cada comprador).
 *  - `SegmentoDeAudio` (monitorias_resumos_segmentos): cada trecho de voz
 *    enviado ao Google, com a transcrição dele (apagada no prazo de retenção).
 */

type Id = unknown

// ─── Configuração (Admin → Configurações → Resumo por IA) ───────────────

/** Preço oficial de um modelo, em US$ por 1 milhão de tokens, a partir de uma data. */
export interface PrecoDeModelo {
  modelo: string
  /** "AAAA-MM-DD": vale a partir deste dia (inclusive), até a próxima linha do mesmo modelo. */
  desde: string
  entradaTexto: number
  entradaAudio: number
  saida: number
}

export interface ConfigResumo {
  /** Novas contratações ligadas. Desligar não mexe nas já contratadas. */
  vendaAtiva: boolean
  /**
   * O admin confirmou que a chave padrão do Gemini é de projeto com faturamento
   * (nível pago: o Google não usa o conteúdo para melhorar produtos). Sem isso
   * a venda não liga.
   */
  nivelPagoConfirmado: boolean
  modeloResumo: string
  modeloTranscricao: string
  precos: PrecoDeModelo[]
  /** Parâmetros da estimativa (o custo real vem do `usage` de cada resposta). */
  estimativa: {
    tokensPorSegundoAudio: number
    /** Fração da aula em que o monitor fala (o gravador pausa no silêncio). */
    fracaoFalaMonitor: number
    /** Fração da aula em que o aluno fala (só aula individual: no grupo só o monitor é gravado). */
    fracaoFalaAluno: number
    tokensTranscricaoPorMinutoDeFala: number
    tokensResumo: number
    /** Raciocínio do modelo, cobrado como saída, em fração da saída visível. */
    fatorRaciocinio: number
    /** Instruções enviadas em cada chamada de transcrição. */
    tokensPromptPorSegmento: number
    tokensPromptResumo: number
  }
  /** Margem sobre o custo estimado, para cobrir variação (fala acima da média, reparos). */
  margemSegurancaPct: number
  margemComercialPct: number
  /**
   * Lucro da plataforma por resumo, em centavos, somado ao custo com a margem
   * de segurança. O preço é o maior entre este caminho e o da margem comercial:
   * aula curta não sai pelo custo do Gemini mais trocados.
   */
  lucroMinimoCentavos: number
  /** Custos diretos fixos por aula, em US$ (chamadas de reparo, reenvio). */
  custosDiretosUsd: number
  precoMinimoCentavos: number
  precoMaximoCentavos: number
  /** Arredonda para cima até o próximo ",90". */
  arredondar90: boolean
  cambio: {
    fonte: 'ptax' | 'manual'
    /** IOF + spread do cartão internacional do Google Cloud. */
    acrescimoPct: number
    /** Usado quando a fonte é manual ou a PTAX não respondeu. */
    manualBrlPorUsd: number
  }
  limites: {
    duracaoMaxMin: number
    custoMaxPorAulaUsd: number
    orcamentoMensalUsd: number
    tentativasPorEtapa: number
  }
  retencaoTranscricaoDias: number
  /** O adicional fica fora da base da comissão do sócio do split (como os materiais marcados). */
  foraDaComissaoDoSocio: boolean
}

// ─── Adicional (o dinheiro) ─────────────────────────────────────────────

export type StatusAdicional = 'pago' | 'entregue' | 'reembolso_processando' | 'reembolsado'

export interface EstimativaDoResumo {
  duracaoMin: number
  custoUsd: number
  brlPorUsd: number
  fonteCambio: 'ptax' | 'manual'
  dataCambio: string | null
  tabelaDesde: string
  modelo: string
}

/** Retrato do adicional gravado no pedido (o servidor fixou na hora do checkout). */
export interface ResumoNoPedido {
  precoCentavos: number
  estimativa: EstimativaDoResumo
  aceite: { versao: string; hash: string; em: string; ip?: string }
  foraDaComissaoDoSocio: boolean
}

export interface ReembolsoDoAdicional {
  chave: string
  valorCentavos: number
  motivo: string
  por: string
  em: Date
  status: 'processando' | 'concluido'
  /** Junto do reembolso integral do assento (o MP devolveu tudo de uma vez). */
  viaAssento?: boolean
  /** Contestação/estorno registrado direto no Mercado Pago. */
  viaGateway?: boolean
  tentativas?: number
  erro?: string
}

export interface AdicionalResumo {
  _id?: Id
  participacaoId: string
  reservaId: string
  alunoId: string
  paymentOrderId: string
  precoCentavos: number
  /** Parte da taxa do PIX que corresponde ao adicional (proporcional à base). */
  taxaPixCentavos: number
  estimativa: EstimativaDoResumo
  aceite: { versao: string; hash: string; em: Date; ip?: string }
  status: StatusAdicional
  reembolso?: ReembolsoDoAdicional
  pagoEm: Date
  entregueEm?: Date
  /** Sala de teste do admin: sem cobrança, sem reembolso. */
  teste?: boolean
  createdAt: Date
  updatedAt: Date
}

// ─── Tarefa (o processamento) ───────────────────────────────────────────

export type StatusTarefa = 'aguardando' | 'transcrevendo' | 'resumindo' | 'pronto' | 'falhou' | 'cancelado'

export interface Voz {
  papel: 'monitor' | 'aluno'
  nome: string
  consentimento?: { aceito: boolean; em: Date; versao: string; ip?: string }
  /** Último trecho que o navegador gravou (avisado ao sair da sala). */
  ultimoSeq?: number
  saiuEm?: Date
}

export interface ChamadaRegistrada {
  etapa: 'transcricao' | 'resumo' | 'parcial' | 'reparo'
  modelo: string
  entrada: number
  entradaAudio: number
  saida: number
  raciocinio: number
  usd: number
  em: Date
}

export interface TarefaResumo {
  /** O id da reserva. */
  _id: string
  status: StatusTarefa
  tutorUserId: string
  anuncioTitulo: string
  materia: string
  conteudos: string[]
  /** 1 = individual (grava monitor e aluno); grupo grava só o monitor. */
  individual: boolean
  inicio: Date
  fim: Date
  duracaoMin: number
  vozes: Record<string, Voz>
  /** Lease do passo de resumo (um processador por vez). */
  lease?: { ate: Date; dono: string }
  tentativas: number
  proximaTentativaEm?: Date
  /** Resumos parciais do map-reduce (aula longa). */
  parciais?: Array<{ janela: number; texto: string }>
  resultado?: ResumoGerado
  cobertura?: { aulaMs: number; gravadoMs: number; pct: number }
  custo: { estimadoUsd: number; realUsd: number; chamadas: ChamadaRegistrada[] }
  erro?: string
  falhouEm?: Date
  prontoEm?: Date
  /** Quando as transcrições (texto) deste resumo são apagadas. */
  transcricaoExpiraEm?: Date
  transcricaoApagadaEm?: Date
  teste?: boolean
  /**
   * Sala de teste encerrada pelo admin ("Gerar resumo agora"): `inicio`/`fim`
   * passam a ser o período realmente gravado, e o resumo sai sem esperar os
   * 90 min agendados.
   */
  encerradoNoTesteEm?: Date
  createdAt: Date
  updatedAt: Date
}

export type StatusSegmento = 'enviando' | 'enviado' | 'transcrevendo' | 'transcrito' | 'falhou' | 'descartado'

export interface FraseTranscrita {
  /** ms desde o início do trecho gravado (tempo de ÁUDIO, sem as pausas). */
  t: number
  texto: string
  incerto?: boolean
}

export interface SegmentoDeAudio {
  _id?: Id
  reservaId: string
  userId: string
  seq: number
  papel: 'monitor' | 'aluno'
  nome: string
  /** Instante (relógio do navegador, conferido pelo servidor) em que o trecho começou. */
  inicio: Date
  /**
   * Marcas de retomada [ms de áudio, ms reais desde `inicio`]: o gravador pausa
   * no silêncio, então o tempo do áudio é menor que o da aula. Com as marcas a
   * fala volta ao minuto certo da aula.
   */
  marcas: Array<[number, number]>
  duracaoAudioMs: number
  /** ms reais cobertos pelo trecho (do começo ao fim, pausas incluídas). */
  duracaoRealMs: number
  bytes: number
  mime: string
  origem: 'direto' | 'blob'
  /** Nome dado ao arquivo no Files API ao abrir a sessão: o processador confere antes de usar. */
  nomeDeExibicao?: string
  arquivo?: { nome: string; uri?: string }
  blobUrl?: string
  status: StatusSegmento
  tentativas: number
  proximaTentativaEm?: Date
  lease?: { ate: Date; dono: string }
  frases?: FraseTranscrita[]
  erro?: string
  createdAt: Date
  updatedAt: Date
}

/** Consumo do mês ("AAAA-MM", horário de Brasília): o teto do orçamento e o painel. */
export interface UsoDoResumo {
  _id: string
  realUsd: number
  chamadas: number
  aulas: number
  vendasCentavos: number
  reembolsosCentavos: number
  updatedAt: Date
}

// ─── O resumo gerado ────────────────────────────────────────────────────

export interface ResumoGerado {
  titulo: string
  sintese: string
  topicos: Array<{
    titulo: string
    explicacao: string
    conceitos: Array<{ termo: string; definicao: string }>
    mecanismos: string[]
    raciocinioDoMonitor: string
  }>
  duvidas: Array<{ pergunta: string; resposta: string; quemPerguntou: 'aluno' | 'monitor' | 'incerto' }>
  comparacoes: Array<{ itens: string; diferencas: string }>
  pontosDeAtencao: string[]
  revisaoRapida: string[]
  questoes: Array<{
    enunciado: string
    alternativas: string[]
    /** Índice da alternativa correta (0 = A). */
    correta: number
    comentario: string
  }>
  lacunas: string[]
  aVerificar: string[]
}

/** O que a sala sabe do Resumo por IA para uma pessoa (vem no saguão e na entrada). */
export interface EstadoDoResumoNaSala {
  /** Esta aula tem Resumo por IA ativo (todos veem o selo). */
  ativo: boolean
  /** Esta pessoa grava a própria voz agora (voz transcrita e autorizada). */
  gravar: boolean
  papel: 'monitor' | 'aluno'
  individual: boolean
  /** Só do monitor: precisa decidir antes de gravar. */
  consentimento: 'pendente' | 'aceito' | 'recusado' | null
  /** Próximo número de trecho desta voz (o navegador continua dele). */
  proximoSeq: number
  versao: string
}

/** O que a API devolve ao comprador (sem a transcrição). */
export interface EstadoDoResumo {
  oferta: boolean
  adicional: { status: StatusAdicional; precoCentavos: number; reembolso?: { motivo: string; status: string } } | null
  tarefa: {
    status: StatusTarefa
    cobertura: number | null
    prontoEm: string | null
    erroPublico: string | null
  } | null
  resultado: ResumoGerado | null
}
