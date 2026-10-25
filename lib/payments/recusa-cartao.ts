/**
 * Análise de falhas e recusas de cartão — a parte PURA (sem banco, sem rede).
 *
 * "Cartão recusado" junta coisas muito diferentes, e a conduta de cada uma é
 * outra: o banco que negou (nada a fazer além de oferecer Pix), o antifraude do
 * Mercado Pago (pode ser algo nosso: device ID, cartão de terceiro), um dado
 * digitado errado, uma falha NOSSA (token vencido, credencial trocada) ou uma
 * queda de rede. Sem separar isso, o painel só dizia "recusado".
 *
 * Este arquivo faz três coisas:
 *  1. extrai do pagamento do Mercado Pago os dados técnicos que importam, sem
 *     guardar nada sensível (só os 6 primeiros e os 4 últimos dígitos — o que o
 *     próprio Mercado Pago devolve e o que o PCI permite guardar);
 *  2. traduz o código da recusa numa análise: quem decidiu, causas prováveis,
 *     o que o comprador e a equipe devem fazer, e se dá para recuperar;
 *  3. deriva SINAIS dos dados daquela tentativa (parcelado, débito, sem
 *     device ID, cartão de terceiro...) e agrega tudo para o painel.
 *
 * O que fica guardado são só os FATOS. A análise é refeita na leitura: quando
 * este conhecimento melhora, o histórico inteiro passa a ser lido com ele.
 */

import { relogioBrasilia } from '../fuso-brasilia'

export type EtapaDaFalha = 'resultado' | 'criacao' | 'assinatura' | 'tokenizacao' | 'envio'

export type Responsavel = 'banco' | 'antifraude' | 'dados' | 'limite' | 'integracao' | 'rede' | 'desconhecido'

export const ROTULO_DA_ETAPA: Record<EtapaDaFalha, string> = {
  resultado: 'Resposta do Mercado Pago (recusa)',
  criacao: 'Erro ao criar o pagamento',
  assinatura: 'Erro ao criar a assinatura',
  tokenizacao: 'Erro ao validar o cartão (navegador)',
  envio: 'Erro ao enviar o pagamento (navegador)',
}

export const ROTULO_DO_RESPONSAVEL: Record<Responsavel, string> = {
  banco: 'Banco emissor',
  antifraude: 'Antifraude do Mercado Pago',
  dados: 'Dados digitados',
  limite: 'Limite ou parcelas',
  integracao: 'Nossa integração',
  rede: 'Rede ou processamento',
  desconhecido: 'Não identificado',
}

// ─── O que NÓS enviamos ──────────────────────────────────────────────────────

/** O que a nossa chamada ao Mercado Pago levava — sem token, sem CPF, sem chave. */
export interface RequisicaoDoCartao {
  paymentMethodId: string
  parcelas: number
  valorEnviado: number
  emissorEnviado: string | null
  deviceIdPresente: boolean
  deviceIdTamanho: number
  titularDiferenteDoComprador: boolean
  documentoTipo: string | null
  splitAtivo: boolean
  tokenDoMarketplace: boolean
  ambiente: 'sandbox' | 'producao'
  timeoutMs: number
  idempotencyKey: string
  referencia: string
}

export function montarRequisicaoDoCartao(input: {
  paymentMethodId: string
  parcelas?: number
  valor: number
  emissor?: string | number | null
  deviceId?: string | null
  cardholderDocumentNumber?: string | null
  documentoTipo?: string | null
  splitAtivo?: boolean
  tokenDoMarketplace?: boolean
  ambiente: 'sandbox' | 'producao'
  timeoutMs: number
  idempotencyKey?: string
  referencia?: string
}): RequisicaoDoCartao {
  const deviceId = (input.deviceId || '').trim()
  return {
    paymentMethodId: String(input.paymentMethodId || ''),
    parcelas: Math.max(1, Math.trunc(Number(input.parcelas) || 1)),
    valorEnviado: arredondar(input.valor),
    emissorEnviado: input.emissor != null && String(input.emissor).trim() ? String(input.emissor).trim() : null,
    deviceIdPresente: deviceId.length > 0,
    deviceIdTamanho: deviceId.length,
    titularDiferenteDoComprador: !!(input.cardholderDocumentNumber && String(input.cardholderDocumentNumber).trim()),
    documentoTipo: input.documentoTipo || null,
    splitAtivo: !!input.splitAtivo,
    tokenDoMarketplace: !!input.tokenDoMarketplace,
    ambiente: input.ambiente,
    timeoutMs: input.timeoutMs,
    idempotencyKey: input.idempotencyKey || '',
    referencia: input.referencia || '',
  }
}

// ─── O que o MERCADO PAGO respondeu ──────────────────────────────────────────

export interface DadosTecnicos {
  paymentId?: string
  status?: string
  statusDetail?: string
  paymentMethodId?: string
  paymentTypeId?: string
  emissorId?: string
  bin?: string
  ultimos4?: string
  parcelas?: number
  valorTransacao?: number
  valorTotalPago?: number
  valorParcela?: number
  moeda?: string
  capturado?: boolean
  modoReal?: boolean
  modoBinario?: boolean
  criadoEm?: string
  atualizadoEm?: string
  codigoDeAutorizacao?: string
  documentoDoPagadorTipo?: string
  documentoDoTitularTipo?: string
  processamento?: string
  contaDoComerciante?: string
  descritor?: string
  taxaDeAplicacao?: number
  tresDsPresente?: boolean
}

function arredondar(n: unknown): number {
  const v = Number(n)
  return Number.isFinite(v) ? Math.round(v * 100) / 100 : 0
}

/** Texto curto e seguro para guardar. Nunca devolve objeto. */
function texto(valor: unknown, max = 300): string | undefined {
  if (valor == null) return undefined
  const t = typeof valor === 'string' ? valor : typeof valor === 'number' || typeof valor === 'boolean' ? String(valor) : ''
  const limpo = t.replace(/\s+/g, ' ').trim()
  return limpo ? limpo.slice(0, max) : undefined
}

function numero(valor: unknown): number | undefined {
  if (valor === null || valor === undefined || valor === '') return undefined
  const v = Number(valor)
  return Number.isFinite(v) ? v : undefined
}

/** Só dígitos, no tamanho exato — o que não for isso é descartado. */
function digitos(valor: unknown, tamanho: number): string | undefined {
  const d = String(valor ?? '').replace(/\D/g, '')
  return d.length === tamanho ? d : undefined
}

/** Remove as chaves sem valor, para o documento ficar enxuto. */
function semVazios<T extends object>(obj: T): T {
  const registro = obj as Record<string, unknown>
  for (const k of Object.keys(registro)) if (registro[k] === undefined) delete registro[k]
  return obj
}

/**
 * Os dados técnicos de um pagamento do Mercado Pago (o corpo de `GET
 * /v1/payments/:id`). Só campos escalares conhecidos: nada do que não está
 * listado aqui é copiado, então um campo novo ou sensível do MP não vaza para
 * o banco por tabela.
 */
export function extrairDadosTecnicos(raw: any): DadosTecnicos {
  if (!raw || typeof raw !== 'object') return {}
  const td = raw.transaction_details || {}
  const card = raw.card || {}
  return semVazios<DadosTecnicos>({
    paymentId: texto(raw.id, 40),
    status: texto(raw.status, 40),
    statusDetail: texto(raw.status_detail, 80),
    paymentMethodId: texto(raw.payment_method_id, 40),
    paymentTypeId: texto(raw.payment_type_id, 40),
    emissorId: texto(raw.issuer_id ?? raw.payment_method?.issuer_id, 20),
    bin: digitos(card.first_six_digits, 6),
    ultimos4: digitos(card.last_four_digits, 4),
    parcelas: numero(raw.installments),
    valorTransacao: numero(raw.transaction_amount),
    valorTotalPago: numero(td.total_paid_amount),
    valorParcela: numero(td.installment_amount),
    moeda: texto(raw.currency_id, 8),
    capturado: typeof raw.captured === 'boolean' ? raw.captured : undefined,
    modoReal: typeof raw.live_mode === 'boolean' ? raw.live_mode : undefined,
    modoBinario: typeof raw.binary_mode === 'boolean' ? raw.binary_mode : undefined,
    criadoEm: texto(raw.date_created, 40),
    atualizadoEm: texto(raw.date_last_updated, 40),
    codigoDeAutorizacao: texto(raw.authorization_code, 40),
    documentoDoPagadorTipo: texto(raw.payer?.identification?.type, 12),
    documentoDoTitularTipo: texto(card.cardholder?.identification?.type, 12),
    processamento: texto(raw.processing_mode, 30),
    contaDoComerciante: texto(raw.merchant_account_id, 40),
    descritor: texto(raw.statement_descriptor, 40),
    taxaDeAplicacao: numero(raw.application_fee),
    tresDsPresente: raw.three_ds_info ? true : undefined,
  })
}

// ─── O que o NAVEGADOR viu ───────────────────────────────────────────────────

/**
 * Falha que acontece no navegador antes de chegar ao Mercado Pago (validação do
 * cartão) ou na volta do nosso servidor. Quem informa é o navegador do
 * comprador: não é prova, é um indício — por isso o painel marca a origem.
 */
export interface DadosDoNavegador {
  origemDoFormulario: 'checkout' | 'assinatura'
  codigos: string[]
  mensagem?: string
  httpStatus?: number
  codigoDoServidor?: string
  bandeira?: string
  bin?: string
  ultimos4?: string
  parcelas?: number
  valor?: number
  titularDiferente?: boolean
  deviceIdPresente?: boolean
  endpoint?: string
  produto?: string
}

// ─── Erro da API (criação do pagamento / da assinatura) ──────────────────────

export interface ErroDaApi {
  nome?: string
  status?: number
  codigo?: string
  mensagem?: string
  causas: Array<{ codigo?: string; descricao?: string }>
}

/** O erro que o SDK do Mercado Pago lança: um Error, ou o corpo JSON da API. */
export function extrairErroDaApi(err: unknown): ErroDaApi {
  // `MercadoPagoPaymentError` traz a mensagem AMIGÁVEL em `message` e o erro
  // técnico do SDK em `original`: o log quer o técnico.
  const traduzido = err as any
  const e = traduzido?.original && typeof traduzido.original === 'object' ? traduzido.original : traduzido
  const bruto = e?.cause ?? e?.response?.cause ?? e?.error?.cause
  const lista: any[] = Array.isArray(bruto) ? bruto : bruto && typeof bruto === 'object' ? [bruto] : []
  const status = numero(e?.status ?? e?.response?.status)
  return semVazios<ErroDaApi>({
    nome: texto(traduzido?.name ?? e?.name, 60),
    status,
    codigo: texto(typeof e?.error === 'string' ? e.error : undefined, 80),
    mensagem: texto(e?.message ?? (typeof err === 'string' ? err : undefined), 300),
    causas: lista.slice(0, 6).map(c => semVazios({ codigo: texto(c?.code, 30), descricao: texto(c?.description ?? c?.message, 200) })),
  })
}

// ─── Bandeira ────────────────────────────────────────────────────────────────

const BANDEIRAS: Record<string, string> = {
  visa: 'Visa',
  debvisa: 'Visa (débito)',
  master: 'Mastercard',
  debmaster: 'Mastercard (débito)',
  maestro: 'Maestro (débito)',
  elo: 'Elo',
  debelo: 'Elo (débito)',
  amex: 'American Express',
  hipercard: 'Hipercard',
  diners: 'Diners Club',
  cabal: 'Cabal',
  debcabal: 'Cabal (débito)',
  credit_card: 'Crédito (bandeira não detectada)',
  debit_card: 'Débito (bandeira não detectada)',
}

export function rotuloDaBandeira(paymentMethodId?: string | null): string {
  const id = (paymentMethodId || '').toLowerCase()
  if (!id) return 'Não informada'
  return BANDEIRAS[id] || id
}

export function ehDebito(tecnico?: DadosTecnicos | null, requisicao?: RequisicaoDoCartao | null): boolean {
  const tipo = tecnico?.paymentTypeId
  if (tipo) return tipo === 'debit_card'
  return /^deb|^maestro/.test((requisicao?.paymentMethodId || tecnico?.paymentMethodId || '').toLowerCase())
}

// ─── Conhecimento por código ─────────────────────────────────────────────────

export type Recuperavel = 'sim' | 'talvez' | 'nao'

interface Entrada {
  rotulo: string
  responsavel: Responsavel
  recuperavel: Recuperavel
  /** Algo para investigar do NOSSO lado (e não só uma decisão do banco/cliente). */
  nosso: boolean
  diagnostico: string
  causas: string[]
  acaoComprador: string
  acaoEquipe: string
}

const OUTRO_CARTAO = 'Tentar com outro cartão ou pagar com Pix, que é aprovado na hora.'

/** `status_detail` do Mercado Pago em pagamento recusado/cancelado. */
const POR_STATUS_DETAIL: Record<string, Entrada> = {
  cc_rejected_other_reason: {
    rotulo: 'Recusado pelo banco (sem motivo informado)',
    responsavel: 'banco',
    recuperavel: 'talvez',
    nosso: false,
    diagnostico:
      'O banco emissor negou a autorização e não informou o motivo ao Mercado Pago — é o código genérico de recusa mais comum. Não dá para saber a causa exata só por aqui.',
    causas: [
      'Limite ou saldo insuficiente no cartão',
      'Compra online não habilitada ou cartão bloqueado preventivamente',
      'Bloqueio do perfil de compra (valor, horário ou estabelecimento novo para o cliente)',
      'Cartão virtual, pré-pago ou internacional com restrição',
    ],
    acaoComprador: `Liberar a compra no app do banco ou ligar para ele e tentar de novo. ${OUTRO_CARTAO}`,
    acaoEquipe: 'Nada a corrigir no código. Ofereça o Pix na mesma tela; se um emissor ou BIN concentrar recusas, veja "Por emissor" e "Por BIN".',
  },
  cc_rejected_call_for_authorize: {
    rotulo: 'Banco exige autorização do titular',
    responsavel: 'banco',
    recuperavel: 'sim',
    nosso: false,
    diagnostico: 'O banco pediu que o titular autorize esta compra manualmente (no app ou por telefone) antes de aprovar.',
    causas: ['Compra online de valor ou estabelecimento novo para o cartão', 'Política de segurança do emissor'],
    acaoComprador: 'Autorizar a compra no app do banco (ou ligar para ele) e tentar de novo.',
    acaoEquipe: 'Recuperável: oriente o comprador a liberar a compra e refazer o pagamento.',
  },
  cc_rejected_card_disabled: {
    rotulo: 'Cartão bloqueado ou inativo',
    responsavel: 'banco',
    recuperavel: 'talvez',
    nosso: false,
    diagnostico: 'O cartão está bloqueado, cancelado ou ainda não foi desbloqueado para uso.',
    causas: ['Cartão novo ainda não desbloqueado', 'Bloqueio por segurança ou por inadimplência', 'Cartão cancelado ou substituído'],
    acaoComprador: `Desbloquear o cartão com o banco ou usar outro. ${OUTRO_CARTAO}`,
    acaoEquipe: 'Nada a corrigir no código.',
  },
  cc_rejected_card_error: {
    rotulo: 'Falha ao processar o cartão',
    responsavel: 'rede',
    recuperavel: 'sim',
    nosso: false,
    diagnostico: 'O cartão não foi processado: falha entre o Mercado Pago, a adquirente e o banco, e não uma decisão sobre o cartão.',
    causas: ['Instabilidade momentânea do emissor ou da adquirente', 'Resposta do banco fora do prazo'],
    acaoComprador: 'Tentar de novo em instantes; se persistir, outro cartão ou Pix.',
    acaoEquipe: 'Se aparecer em rajada para o mesmo emissor, é instabilidade dele; confira o status do Mercado Pago.',
  },
  cc_rejected_bad_filled_card_number: {
    rotulo: 'Número do cartão incorreto',
    responsavel: 'dados',
    recuperavel: 'sim',
    nosso: false,
    diagnostico: 'O número do cartão não confere com o que o banco tem.',
    causas: ['Dígito trocado ou faltando (o formulário confere só o formato, não se o cartão existe)', 'Cartão digitado de outro país ou de outro tipo'],
    acaoComprador: 'Conferir o número impresso no cartão e digitar de novo.',
    acaoEquipe: 'Sem ação. Muitos casos juntos podem indicar autopreenchimento do navegador errado.',
  },
  cc_rejected_bad_filled_date: {
    rotulo: 'Validade incorreta',
    responsavel: 'dados',
    recuperavel: 'sim',
    nosso: false,
    diagnostico: 'A validade informada não confere com a do cartão.',
    causas: ['Mês e ano trocados', 'Cartão renovado: o plástico novo tem outra validade', 'Preenchimento automático com a validade do cartão antigo'],
    acaoComprador: 'Conferir mês e ano no cartão e digitar de novo.',
    acaoEquipe: 'Sem ação. Em volume, confira se o autopreenchimento está entregando a validade certa.',
  },
  cc_rejected_bad_filled_security_code: {
    rotulo: 'CVV incorreto',
    responsavel: 'dados',
    recuperavel: 'sim',
    nosso: false,
    diagnostico: 'O código de segurança não confere com o do cartão.',
    causas: ['CVV digitado errado', 'CVV de 4 dígitos (Amex) no campo de 3, ou o contrário', 'Cartão reemitido com outro CVV'],
    acaoComprador: 'Conferir o código no verso do cartão (4 dígitos na frente, no Amex) e digitar de novo.',
    acaoEquipe: 'Sem ação.',
  },
  cc_rejected_bad_filled_other: {
    rotulo: 'Dado do cartão incorreto',
    responsavel: 'dados',
    recuperavel: 'sim',
    nosso: false,
    diagnostico: 'Algum dado do cartão não confere, e o Mercado Pago não diz qual.',
    causas: ['Nome ou CPF do titular diferente do cadastrado no banco', 'Número, validade ou CVV errados'],
    acaoComprador: 'Conferir número, validade, CVV, nome e o CPF do titular (se o cartão for de outra pessoa, marcar essa opção).',
    acaoEquipe: 'Sem ação. Se for frequente, confira se quem usa cartão de terceiro está marcando a opção do titular.',
  },
  cc_rejected_duplicated_payment: {
    rotulo: 'Pagamento duplicado',
    responsavel: 'antifraude',
    recuperavel: 'talvez',
    nosso: false,
    diagnostico: 'O Mercado Pago viu outro pagamento idêntico (mesmo cartão e valor) há pouco tempo e barrou este.',
    causas: ['O comprador clicou duas vezes ou refez o pagamento achando que o primeiro falhou', 'O primeiro pagamento pode ter sido aprovado'],
    acaoComprador: 'Conferir se a primeira compra foi aprovada (e-mail e "Meus materiais") antes de pagar de novo.',
    acaoEquipe: 'CONFIRA se o mesmo comprador tem um pagamento aprovado logo antes: se tem, a compra já foi concluída e o comprador só precisa ser avisado.',
  },
  cc_rejected_high_risk: {
    rotulo: 'Antifraude do Mercado Pago (alto risco)',
    responsavel: 'antifraude',
    recuperavel: 'talvez',
    nosso: false,
    diagnostico:
      'O antifraude do Mercado Pago considerou a compra de risco e negou, sem explicar o critério. O banco pode nem ter sido consultado. É a recusa que mais depende de dados nossos.',
    causas: [
      'Device ID ausente: o antifraude perde a identificação do aparelho',
      'Cartão de outra pessoa (CPF do titular diferente do comprador)',
      'Várias tentativas seguidas, com cartões ou dados diferentes',
      'Conta, e-mail ou aparelho novos, sem histórico',
      'Compra fora do padrão do comprador',
    ],
    acaoComprador: `${OUTRO_CARTAO} Para o mesmo cartão, não adianta repetir.`,
    acaoEquipe:
      'Veja os sinais desta tentativa: se o device ID não foi enviado, é correção nossa. Se for cartão de terceiro ou tentativa repetida, o melhor caminho é levar a pessoa para o Pix.',
  },
  cc_rejected_fraud: {
    rotulo: 'Bloqueado por suspeita de fraude',
    responsavel: 'antifraude',
    recuperavel: 'nao',
    nosso: false,
    diagnostico: 'A compra foi bloqueada por suspeita de fraude (pelo Mercado Pago ou pelo banco).',
    causas: ['Cartão reportado como roubado ou clonado', 'Padrão de uso associado a fraude', 'Aparelho ou IP com histórico ruim'],
    acaoComprador: 'Falar com o banco ou usar outro meio de pagamento (Pix).',
    acaoEquipe: 'Não insista com o mesmo cartão. Se for um comprador conhecido, ofereça o Pix.',
  },
  cc_rejected_insufficient_amount: {
    rotulo: 'Limite insuficiente',
    responsavel: 'limite',
    recuperavel: 'sim',
    nosso: false,
    diagnostico: 'O cartão não tem limite (ou saldo, no débito) para o valor da compra.',
    causas: ['Limite disponível menor que o total', 'No parcelado, o limite precisa comportar o TOTAL das parcelas, e não só a primeira'],
    acaoComprador: 'Pagar com menos parcelas, em outro cartão ou no Pix.',
    acaoEquipe: 'Sem ação no código. Compras parceladas recusadas por limite sugerem destacar o Pix.',
  },
  cc_rejected_invalid_installments: {
    rotulo: 'Cartão não aceita essas parcelas',
    responsavel: 'limite',
    recuperavel: 'sim',
    nosso: true,
    diagnostico:
      'O número de parcelas escolhido não é aceito por este cartão. O checkout só oferece parcelas que o Mercado Pago confirmou para o cartão digitado, então isto não deveria acontecer.',
    causas: ['Cartão trocado depois de escolher as parcelas', 'Consulta de parcelamento desatualizada na tela', 'Regra do emissor mudou entre a consulta e o pagamento'],
    acaoComprador: 'Escolher outra quantidade de parcelas ou pagar à vista.',
    acaoEquipe: 'INVESTIGUE: se aparecer mais de uma vez, a consulta de parcelas da tela pode estar divergindo do que vai no pagamento.',
  },
  cc_rejected_max_attempts: {
    rotulo: 'Limite de tentativas atingido',
    responsavel: 'antifraude',
    recuperavel: 'talvez',
    nosso: false,
    diagnostico: 'O cartão excedeu o número de tentativas permitido em um período.',
    causas: ['Várias recusas seguidas com o mesmo cartão', 'Tentativas repetidas para o mesmo pedido'],
    acaoComprador: `Aguardar algumas horas ou usar outro cartão. ${OUTRO_CARTAO}`,
    acaoEquipe: 'Veja o histórico de tentativas deste comprador nos sinais desta tentativa.',
  },
  cc_rejected_blacklist: {
    rotulo: 'Cartão em lista restritiva',
    responsavel: 'antifraude',
    recuperavel: 'nao',
    nosso: false,
    diagnostico: 'O cartão consta em uma lista restritiva do Mercado Pago (ou do banco).',
    causas: ['Cartão com histórico de fraude ou contestação', 'Cartão reportado como perdido ou roubado'],
    acaoComprador: 'Usar outro cartão ou pagar com Pix.',
    acaoEquipe: 'Não insista com este cartão.',
  },
  cc_rejected_card_type_not_allowed: {
    rotulo: 'Tipo de cartão não aceito',
    responsavel: 'banco',
    recuperavel: 'talvez',
    nosso: false,
    diagnostico: 'O tipo do cartão (débito, pré-pago, virtual ou corporativo) não é aceito para esta compra.',
    causas: ['Débito ou pré-pago sem permissão para compra online', 'Cartão virtual de uso único ou com limite próprio'],
    acaoComprador: 'Usar um cartão de crédito comum ou pagar com Pix.',
    acaoEquipe: 'Sem ação no código.',
  },
  cc_amount_rate_limit_exceeded: {
    rotulo: 'Limite de valor do cartão excedido',
    responsavel: 'limite',
    recuperavel: 'talvez',
    nosso: false,
    diagnostico: 'O valor passa do máximo que o cartão ou o emissor permite por transação ou por dia.',
    causas: ['Limite diário de compras online', 'Limite por transação do emissor'],
    acaoComprador: 'Aumentar o limite no app do banco, dividir em mais parcelas ou pagar com Pix.',
    acaoEquipe: 'Sem ação no código.',
  },
  cc_rejected_3ds_mandatory: {
    rotulo: 'Banco exige autenticação extra (3DS)',
    responsavel: 'banco',
    recuperavel: 'talvez',
    nosso: false,
    diagnostico: 'O emissor só autoriza esta compra com autenticação 3DS (confirmação no app do banco), e o checkout atual não faz essa etapa.',
    causas: ['Emissor que exige 3DS em compras online', 'Valor ou perfil que dispara a exigência'],
    acaoComprador: `${OUTRO_CARTAO}`,
    acaoEquipe: 'Cada caso é venda perdida no cartão. Se for frequente, vale implementar o 3DS no checkout (projeto à parte).',
  },
  cc_rejected_3ds_challenge: {
    rotulo: 'Autenticação 3DS não concluída',
    responsavel: 'banco',
    recuperavel: 'talvez',
    nosso: false,
    diagnostico: 'A autenticação pedida pelo banco não foi concluída.',
    causas: ['O titular não confirmou no app do banco', 'A confirmação expirou'],
    acaoComprador: 'Tentar de novo e confirmar no app do banco, ou pagar com Pix.',
    acaoEquipe: 'Veja se há muitos casos: pode indicar fricção na autenticação.',
  },
  rejected_by_bank: {
    rotulo: 'Recusado pelo banco',
    responsavel: 'banco',
    recuperavel: 'talvez',
    nosso: false,
    diagnostico: 'O banco emissor recusou o pagamento.',
    causas: ['Limite, bloqueio ou política do emissor'],
    acaoComprador: `Falar com o banco, ou ${OUTRO_CARTAO.toLowerCase()}`,
    acaoEquipe: 'Nada a corrigir no código.',
  },
  rejected_insufficient_data: {
    rotulo: 'Dados insuficientes',
    responsavel: 'dados',
    recuperavel: 'sim',
    nosso: true,
    diagnostico: 'Faltaram dados para o Mercado Pago aprovar o pagamento.',
    causas: ['CPF ou dados do pagador ausentes ou inconsistentes com o cartão', 'Campos de apoio do antifraude não enviados'],
    acaoComprador: 'Conferir CPF e dados do cartão.',
    acaoEquipe: 'INVESTIGUE o que foi enviado nesta tentativa (documento, device ID, itens).',
  },
  bank_error: {
    rotulo: 'Banco não respondeu',
    responsavel: 'rede',
    recuperavel: 'sim',
    nosso: false,
    diagnostico: 'O banco não respondeu a tempo. Nenhuma cobrança foi feita.',
    causas: ['Instabilidade do emissor', 'Lentidão na rede de pagamentos'],
    acaoComprador: 'Tentar de novo em instantes ou pagar com Pix.',
    acaoEquipe: 'Se vier em rajada, é indisponibilidade do emissor.',
  },
  provider_error: {
    rotulo: 'Mercado Pago não confirmou o pagamento',
    responsavel: 'integracao',
    recuperavel: 'sim',
    nosso: true,
    diagnostico:
      'A criação do pagamento não teve resposta clara e, passados 3 minutos, o pagamento não apareceu no Mercado Pago. Nenhuma cobrança foi feita; o pedido foi encerrado por nós.',
    causas: ['Timeout ou queda de conexão entre a função e o Mercado Pago', 'Instabilidade momentânea do Mercado Pago'],
    acaoComprador: 'Pode tentar de novo.',
    acaoEquipe: 'INVESTIGUE se aparecer em sequência: pode ser lentidão do Mercado Pago ou da função (tempo limite de 8 s por tentativa).',
  },
}

const ENTRADA_CANCELADO: Entrada = {
  rotulo: 'Pagamento cancelado',
  responsavel: 'desconhecido',
  recuperavel: 'talvez',
  nosso: false,
  diagnostico: 'O Mercado Pago cancelou o pagamento. O detalhe informado por ele está nos dados técnicos.',
  causas: ['Cancelamento pelo Mercado Pago (análise de risco ou falta de confirmação)', 'Cancelamento manual'],
  acaoComprador: 'Pode tentar de novo ou pagar com Pix.',
  acaoEquipe: 'Veja o status_detail nos dados técnicos.',
}

function entradaGenerica(statusDetail: string): Entrada {
  return {
    rotulo: `Recusa não catalogada (${statusDetail})`,
    responsavel: 'desconhecido',
    recuperavel: 'talvez',
    nosso: false,
    diagnostico: `O Mercado Pago devolveu um motivo que ainda não está catalogado aqui: "${statusDetail}".`,
    causas: ['Veja o código em "Dados técnicos" e na documentação do Mercado Pago'],
    acaoComprador: OUTRO_CARTAO,
    acaoEquipe: 'Se este código se repetir, acrescente-o a POR_STATUS_DETAIL em lib/payments/recusa-cartao.ts.',
  }
}

/** Erros de VALIDAÇÃO da API na criação do pagamento (mesmos códigos de mercado-pago/errors.ts). */
const POR_CODIGO_DA_API: Record<string, Entrada> = {}
function api(codigos: string[], e: Entrada) {
  for (const c of codigos) POR_CODIGO_DA_API[c] = e
}
api(['2006', '2062', '3003'], {
  rotulo: 'Token do cartão inválido, vencido ou já usado',
  responsavel: 'integracao',
  recuperavel: 'sim',
  nosso: false,
  diagnostico: 'O Mercado Pago não aceitou o token do cartão. Cada token vale uma única vez e por pouco tempo, então a tela ficou aberta tempo demais ou o pagamento foi reenviado com o mesmo token.',
  causas: ['Aba do checkout aberta por muito tempo antes de pagar', 'Duplo clique ou reenvio do mesmo formulário', 'Public key de uma aplicação e token de acesso de outra (se acontece com todos os cartões)'],
  acaoComprador: 'Digitar o CVV de novo e tentar outra vez.',
  acaoEquipe: 'Ocasional é normal. Se acontecer com TODOS os cartões, confira se a public key e o access token são da mesma aplicação (e do mesmo ambiente).',
})
api(['2067', '4020'], {
  rotulo: 'CPF não confere com o titular do cartão',
  responsavel: 'dados',
  recuperavel: 'sim',
  nosso: false,
  diagnostico: 'O documento enviado no pagamento é diferente do usado para validar o cartão.',
  causas: ['Cartão de outra pessoa sem a opção "o cartão é de outra pessoa" marcada', 'CPF do comprador diferente do CPF do titular'],
  acaoComprador: 'Marcar "o cartão é de outra pessoa" e informar o CPF do titular.',
  acaoEquipe: 'Sem ação, a menos que apareça com cartão do próprio comprador.',
})
api(['2034'], {
  rotulo: 'Comprador e vendedor são a mesma conta',
  responsavel: 'integracao',
  recuperavel: 'sim',
  nosso: false,
  diagnostico: 'O e-mail do pagador é o da conta do Mercado Pago que recebe o pagamento.',
  causas: ['Teste feito com a própria conta recebedora'],
  acaoComprador: 'Usar outro e-mail ou outra conta.',
  acaoEquipe: 'Costuma ser teste interno.',
})
api(['3029', '4033'], {
  rotulo: 'Parcelas não aceitas pelo cartão',
  responsavel: 'limite',
  recuperavel: 'sim',
  nosso: true,
  diagnostico: 'O Mercado Pago recusou o número de parcelas na criação do pagamento. O checkout só oferece parcelas confirmadas para o cartão, então a consulta da tela pode estar desatualizada.',
  causas: ['Cartão trocado depois de escolher as parcelas', 'Valor mudou entre a consulta e o pagamento'],
  acaoComprador: 'Escolher outra quantidade de parcelas ou pagar à vista.',
  acaoEquipe: 'INVESTIGUE se repetir: compare as parcelas enviadas (Dados técnicos) com a consulta de parcelamento.',
})
api(['3034'], {
  rotulo: 'Número do cartão não confere com a bandeira',
  responsavel: 'dados',
  recuperavel: 'sim',
  nosso: true,
  diagnostico: 'A bandeira enviada no pagamento não corresponde ao número do cartão.',
  causas: ['Bandeira detectada errada pela consulta de BIN', 'Cartão trocado depois da detecção'],
  acaoComprador: 'Conferir o número do cartão.',
  acaoEquipe: 'INVESTIGUE se o payment_method_id enviado bate com o BIN: a detecção de bandeira pode estar errando para este BIN.',
})
api(['3033'], {
  rotulo: 'Número do cartão incorreto',
  responsavel: 'dados',
  recuperavel: 'sim',
  nosso: false,
  diagnostico: 'O número do cartão foi rejeitado pelo Mercado Pago.',
  causas: ['Dígitos incorretos'],
  acaoComprador: 'Conferir e digitar de novo.',
  acaoEquipe: 'Sem ação.',
})
api(['3031', '3032'], {
  rotulo: 'CVV incorreto',
  responsavel: 'dados',
  recuperavel: 'sim',
  nosso: false,
  diagnostico: 'O código de segurança foi rejeitado pelo Mercado Pago.',
  causas: ['CVV digitado errado ou com o tamanho errado para a bandeira'],
  acaoComprador: 'Conferir o CVV no cartão.',
  acaoEquipe: 'Sem ação.',
})
api(['3030', '3035'], {
  rotulo: 'Validade incorreta',
  responsavel: 'dados',
  recuperavel: 'sim',
  nosso: false,
  diagnostico: 'A validade foi rejeitada pelo Mercado Pago.',
  causas: ['Mês ou ano errados', 'Cartão vencido'],
  acaoComprador: 'Conferir a validade impressa no cartão.',
  acaoEquipe: 'Sem ação.',
})
api(['2131', '316'], {
  rotulo: 'Nome do titular incorreto',
  responsavel: 'dados',
  recuperavel: 'sim',
  nosso: false,
  diagnostico: 'O nome do titular foi rejeitado pelo Mercado Pago.',
  causas: ['Nome com números ou símbolos', 'Nome diferente do impresso no cartão'],
  acaoComprador: 'Digitar o nome exatamente como está no cartão.',
  acaoEquipe: 'Sem ação.',
})
api(['2077', '3013'], {
  rotulo: 'Emissor não identificado',
  responsavel: 'dados',
  recuperavel: 'sim',
  nosso: true,
  diagnostico: 'O Mercado Pago não identificou o banco emissor do cartão.',
  causas: ['BIN que o Mercado Pago não reconhece', 'issuer_id enviado inconsistente com o cartão'],
  acaoComprador: 'Digitar o número de novo ou usar outro cartão.',
  acaoEquipe: 'INVESTIGUE o BIN: se for sempre o mesmo, o emissor não está no cadastro do Mercado Pago.',
})

function entradaDeErroDaApi(erro: ErroDaApi): Entrada {
  for (const c of erro.causas) {
    const achada = c.codigo ? POR_CODIGO_DA_API[c.codigo] : undefined
    if (achada) return achada
  }
  const s = erro.status
  const detalhe = [erro.mensagem, ...erro.causas.map(c => c.descricao)].filter(Boolean).join(' · ')
  if (s === 401 || s === 403 || /credential|unauthorized|forbidden/i.test(detalhe)) {
    return {
      rotulo: 'Credencial ou permissão recusada pelo Mercado Pago',
      responsavel: 'integracao',
      recuperavel: 'nao',
      nosso: true,
      diagnostico: 'O Mercado Pago recusou as credenciais usadas na cobrança. Enquanto isso durar, NENHUM cartão passa.',
      causas: ['Public key e access token de aplicações ou ambientes diferentes (teste x produção)', 'Token do marketplace expirado ou revogado', 'Conta ou aplicação com restrição'],
      acaoComprador: 'Pagar com Pix enquanto isso é resolvido.',
      acaoEquipe: 'URGENTE: confira as credenciais e a conexão de marketplace em /admin/settings > Pagamentos.',
    }
  }
  if (s != null && s >= 500) {
    return {
      rotulo: 'Erro no servidor do Mercado Pago',
      responsavel: 'rede',
      recuperavel: 'sim',
      nosso: false,
      diagnostico: 'O Mercado Pago respondeu com erro interno. Nenhuma cobrança deve ter sido feita.',
      causas: ['Instabilidade do Mercado Pago'],
      acaoComprador: 'Tentar de novo em instantes ou pagar com Pix.',
      acaoEquipe: 'Se em rajada, confira o status do Mercado Pago.',
    }
  }
  if (s === 429) {
    return {
      rotulo: 'Muitas requisições ao Mercado Pago',
      responsavel: 'rede',
      recuperavel: 'sim',
      nosso: false,
      diagnostico: 'O Mercado Pago limitou o volume de chamadas da conta.',
      causas: ['Pico de tentativas'],
      acaoComprador: 'Tentar de novo em instantes.',
      acaoEquipe: 'Se recorrente, é preciso reduzir tentativas ou falar com o Mercado Pago.',
    }
  }
  return {
    rotulo: 'Erro de validação do Mercado Pago (não catalogado)',
    responsavel: 'integracao',
    recuperavel: 'talvez',
    nosso: true,
    diagnostico: `O Mercado Pago recusou a criação do pagamento por validação${detalhe ? `: ${detalhe}` : ''}. Ainda não há uma análise catalogada para este erro.`,
    causas: ['Campo enviado fora do que o Mercado Pago aceita'],
    acaoComprador: 'Tentar de novo ou pagar com Pix.',
    acaoEquipe: 'INVESTIGUE a mensagem e as causas nos dados técnicos; acrescente o código a POR_CODIGO_DA_API se repetir.',
  }
}

/** Erros de `createCardToken` do mercadopago.js (mesmos códigos de card-token-errors.ts). */
const POR_CODIGO_DO_TOKEN: Record<string, Entrada> = {}
function token(codigos: string[], rotulo: string, causas: string[], acao: string, responsavel: Responsavel = 'dados') {
  const e: Entrada = {
    rotulo,
    responsavel,
    recuperavel: 'sim',
    nosso: false,
    diagnostico: `O Mercado Pago rejeitou os dados do cartão ANTES da cobrança (validação no navegador): ${rotulo.toLowerCase()}. Nenhum pagamento foi criado.`,
    causas,
    acaoComprador: acao,
    acaoEquipe: 'Sem ação. Em volume alto, confira se a validação do formulário está deixando passar o erro.',
  }
  for (const c of codigos) POR_CODIGO_DO_TOKEN[c] = e
}
token(['205', 'E301'], 'Número do cartão incorreto', ['Dígito trocado ou faltando', 'Autopreenchimento com número errado'], 'Conferir o número do cartão.')
token(['208', '209', '325', '326', 'E205'], 'Validade incorreta', ['Mês ou ano trocados', 'Cartão vencido', 'Autopreenchimento com validade antiga'], 'Conferir mês e ano impressos no cartão.')
token(['224', 'E302', 'E203'], 'CVV incorreto', ['CVV com o tamanho errado para a bandeira', 'CVV digitado errado'], 'Conferir o código no verso do cartão.')
token(['221', '316'], 'Nome do titular incorreto', ['Nome com números ou símbolos', 'Nome diferente do impresso'], 'Digitar o nome como está impresso no cartão.')
token(['212', '213', '214', '322', '323', '324'], 'CPF não aceito para este cartão', ['CPF digitado errado', 'Cartão de outra pessoa sem a opção do titular marcada'], 'Conferir o CPF; se o cartão for de outra pessoa, marcar essa opção.')
token(['220'], 'Emissor não identificado', ['BIN que o Mercado Pago não reconhece'], 'Digitar o número do cartão de novo.', 'integracao')

function entradaDeTokenizacao(codigos: string[], mensagem?: string): Entrada {
  for (const c of codigos) {
    const achada = POR_CODIGO_DO_TOKEN[c]
    if (achada) return achada
  }
  if (/fetch|network|timeout|failed to load|load failed|abort/i.test(mensagem || '')) {
    return {
      rotulo: 'Falha de rede ao validar o cartão',
      responsavel: 'rede',
      recuperavel: 'sim',
      nosso: false,
      diagnostico: 'O navegador não conseguiu falar com o Mercado Pago para validar o cartão (conexão instável, bloqueio por extensão/rede ou SDK não carregado).',
      causas: ['Conexão móvel instável', 'Bloqueador de anúncios ou rede corporativa barrando o mercadopago.js', 'Navegador embutido de rede social com restrições'],
      acaoComprador: 'Tentar de novo com uma conexão estável, ou abrir o site direto no navegador.',
      acaoEquipe: 'Se concentrar em um navegador ou dispositivo, veja "Por dispositivo".',
    }
  }
  return {
    rotulo: 'Erro ao validar o cartão (não catalogado)',
    responsavel: 'desconhecido',
    recuperavel: 'talvez',
    nosso: false,
    diagnostico: 'A validação do cartão no navegador falhou por um motivo ainda não catalogado. Veja o código e a mensagem nos dados técnicos.',
    causas: ['Resposta inesperada do mercadopago.js'],
    acaoComprador: 'Conferir os dados e tentar de novo.',
    acaoEquipe: 'Se repetir, catalogue o código em POR_CODIGO_DO_TOKEN.',
  }
}

function entradaDeEnvio(httpStatus?: number, mensagem?: string): Entrada {
  if (httpStatus === 409) {
    return {
      rotulo: 'Bloqueado: pagamento anterior em análise',
      responsavel: 'integracao',
      recuperavel: 'sim',
      nosso: false,
      diagnostico: 'Nossa trava contra cobrança dupla barrou a tentativa: o mesmo comprador já tem um pagamento em cartão em análise.',
      causas: ['Pagamento anterior em revisão do antifraude', 'Segunda tentativa logo após a primeira'],
      acaoComprador: 'Aguardar o resultado do pagamento anterior antes de tentar de novo.',
      acaoEquipe: 'Funcionando como projetado. Se o comprador reclamar, confira o pedido em análise.',
    }
  }
  if (httpStatus === 503) {
    return {
      rotulo: 'Parcelamento do cartão indisponível',
      responsavel: 'integracao',
      recuperavel: 'sim',
      nosso: true,
      diagnostico: 'O servidor não conseguiu confirmar o parcelamento do cartão com o Mercado Pago e não cobrou, para não arriscar juros em dobro.',
      causas: ['Consulta de parcelamento do Mercado Pago lenta ou fora do ar'],
      acaoComprador: 'Pagar à vista ou tentar de novo em instantes.',
      acaoEquipe: 'Se recorrente, é lentidão da API de parcelamento do Mercado Pago.',
    }
  }
  if (httpStatus === 429) {
    return {
      rotulo: 'Muitas tentativas (limite do site)',
      responsavel: 'rede',
      recuperavel: 'sim',
      nosso: false,
      diagnostico: 'O limite de requisições por IP foi atingido.',
      causas: ['Muitas tentativas seguidas', 'Muitas pessoas atrás do mesmo IP (rede móvel)'],
      acaoComprador: 'Aguardar um minuto e tentar de novo.',
      acaoEquipe: 'Se atingir compradores legítimos, avalie o teto da rota.',
    }
  }
  if (httpStatus != null && httpStatus >= 500) {
    return {
      rotulo: 'Erro do servidor ao processar o pagamento',
      responsavel: 'integracao',
      recuperavel: 'talvez',
      nosso: true,
      diagnostico: 'O servidor respondeu com erro ao receber o pagamento. O pagamento pode ou não ter sido criado.',
      causas: ['Erro interno ou tempo esgotado na função', 'Falha na criação do pagamento no Mercado Pago'],
      acaoComprador: 'Conferir o e-mail e o app do banco antes de tentar de novo.',
      acaoEquipe: 'Confira se há pedido aprovado do mesmo comprador e os logs da função.',
    }
  }
  return {
    rotulo: 'Pagamento barrado antes do Mercado Pago',
    responsavel: 'dados',
    recuperavel: 'sim',
    nosso: false,
    diagnostico: `O servidor recusou a tentativa antes de cobrar${mensagem ? `: "${mensagem}"` : ''}.`,
    causas: ['Dado inválido (CPF, parcelas, e-mail) ou regra do pedido (já comprado, cupom, estoque)'],
    acaoComprador: 'Corrigir o que a mensagem pede e tentar de novo.',
    acaoEquipe: 'Veja a mensagem nos dados técnicos.',
  }
}

// ─── Análise ─────────────────────────────────────────────────────────────────

export interface HistoricoDoComprador {
  /** Tentativas com cartão (qualquer desfecho) do mesmo comprador nas 24 h anteriores. */
  tentativasAnteriores24h: number
  /** Dessas, quantas foram recusadas. */
  recusasAnteriores24h: number
  /** Já houve recusa anterior com o MESMO cartão (mesmos 6 primeiros e 4 últimos dígitos)? */
  mesmoCartaoRecusadoAntes: boolean
}

export interface Sinal {
  nivel: 'info' | 'atencao' | 'alerta'
  texto: string
}

export interface AnaliseDaRecusa {
  codigo: string
  rotulo: string
  responsavel: Responsavel
  responsavelRotulo: string
  recuperavel: Recuperavel
  nosso: boolean
  diagnostico: string
  causas: string[]
  acaoComprador: string
  acaoEquipe: string
  sinais: Sinal[]
}

export interface EntradaDaAnalise {
  etapa: EtapaDaFalha
  status?: string
  statusDetail?: string
  tecnico?: DadosTecnicos | null
  requisicao?: RequisicaoDoCartao | null
  erro?: ErroDaApi | null
  navegador?: Partial<DadosDoNavegador> | null
  historico?: HistoricoDoComprador | null
}

const brl = (v: number) => `R$ ${arredondar(v).toFixed(2).replace('.', ',')}`

function derivarSinais(e: EntradaDaAnalise, entrada: Entrada): Sinal[] {
  const sinais: Sinal[] = []
  const t = e.tecnico || undefined
  const r = e.requisicao || undefined
  const parcelas = r?.parcelas ?? t?.parcelas ?? 1
  const valor = t?.valorTransacao ?? r?.valorEnviado
  const detalhe = e.statusDetail || ''
  const debito = ehDebito(t, r)

  if (debito) {
    sinais.push({
      nivel: 'atencao',
      texto: 'Cartão de DÉBITO: exige saldo na conta e autorização do banco, e muitos emissores recusam débito online sem autenticação extra.',
    })
  }

  if (parcelas > 1) {
    const total = t?.valorTotalPago || valor
    const porParcela = t?.valorParcela || (total ? arredondar(total / parcelas) : undefined)
    const limitado = /insufficient|other_reason|invalid_installments|rate_limit|rejected_by_bank/.test(detalhe)
    sinais.push({
      nivel: limitado ? 'atencao' : 'info',
      texto:
        `Compra parcelada em ${parcelas}x${porParcela ? ` de ${brl(porParcela)}` : ''}${total ? ` (total ${brl(total)})` : ''}` +
        (limitado ? ': o limite do cartão precisa comportar o total das parcelas — à vista ou em menos parcelas costuma passar.' : '.'),
    })
  }

  if (
    r &&
    (e.etapa === 'resultado' || e.etapa === 'criacao') &&
    (entrada.responsavel === 'antifraude' || entrada.responsavel === 'banco' || entrada.responsavel === 'desconhecido')
  ) {
    if (!r.deviceIdPresente) {
      sinais.push({
        nivel: 'alerta',
        texto:
          'O device ID NÃO foi enviado ao Mercado Pago nesta tentativa. O antifraude deles perde a identificação do aparelho e recusa bem mais cartão bom — é uma causa nossa e corrigível (script de segurança bloqueado ou ainda não carregado).',
      })
    } else {
      sinais.push({ nivel: 'info', texto: `Device ID enviado (${r.deviceIdTamanho} caracteres): o antifraude recebeu a identificação do aparelho.` })
    }
  }

  if (r?.titularDiferenteDoComprador) {
    sinais.push({
      nivel: entrada.responsavel === 'antifraude' ? 'alerta' : 'atencao',
      texto: 'Cartão de OUTRA pessoa (CPF do titular diferente do comprador): é um padrão que o antifraude pesa contra a compra.',
    })
  }

  if (e.navegador?.titularDiferente) {
    sinais.push({ nivel: 'atencao', texto: 'Cartão de OUTRA pessoa (o comprador informou o CPF do titular).' })
  }

  if (r && !r.emissorEnviado && (e.etapa === 'resultado' || e.etapa === 'criacao')) {
    sinais.push({ nivel: 'atencao', texto: 'O emissor (issuer_id) não foi enviado: o Mercado Pago adivinhou o banco pelo BIN, e quando erra, recusa.' })
  }

  if (t?.modoReal === false || r?.ambiente === 'sandbox') {
    sinais.push({ nivel: 'atencao', texto: 'Pagamento em modo de TESTE (sandbox): a recusa não vem de um banco real.' })
  }

  if (r?.splitAtivo) {
    sinais.push({ nivel: 'info', texto: 'Pagamento com split de marketplace (comissão do sócio) ativo.' })
  }

  if (t?.tresDsPresente) {
    sinais.push({ nivel: 'info', texto: 'O pagamento envolveu autenticação 3DS.' })
  }

  const h = e.historico
  if (h && h.tentativasAnteriores24h > 0) {
    sinais.push({
      nivel: h.recusasAnteriores24h > 0 ? 'atencao' : 'info',
      texto:
        `Esta é a ${h.tentativasAnteriores24h + 1}ª tentativa de pagamento com cartão deste comprador em 24 h` +
        (h.recusasAnteriores24h > 0
          ? ` (${h.recusasAnteriores24h} anterior${h.recusasAnteriores24h > 1 ? 'es' : ''} recusada${h.recusasAnteriores24h > 1 ? 's' : ''}): tentativas repetidas elevam o risco e podem disparar bloqueios por excesso de tentativas.`
          : '.'),
    })
  }
  if (h?.mesmoCartaoRecusadoAntes) {
    sinais.push({ nivel: 'alerta', texto: 'Este MESMO cartão (mesmos 6 primeiros e 4 últimos dígitos) já foi recusado antes: repetir não deve adiantar.' })
  }

  if (t?.codigoDeAutorizacao && e.etapa === 'resultado') {
    sinais.push({ nivel: 'info', texto: `O banco chegou a devolver um código de autorização (${t.codigoDeAutorizacao}).` })
  }

  return sinais
}

/** Qual entrada do conhecimento vale para esta falha. */
function escolherEntrada(e: EntradaDaAnalise): { codigo: string; entrada: Entrada } {
  if (e.etapa === 'tokenizacao') {
    const codigos = e.navegador?.codigos || []
    return { codigo: codigos[0] || 'token_error', entrada: entradaDeTokenizacao(codigos, e.navegador?.mensagem) }
  }
  if (e.etapa === 'envio') {
    return { codigo: `http_${e.navegador?.httpStatus ?? 'x'}`, entrada: entradaDeEnvio(e.navegador?.httpStatus, e.navegador?.mensagem) }
  }
  if (e.etapa === 'criacao' || e.etapa === 'assinatura') {
    const erro = e.erro || { causas: [] }
    if (e.etapa === 'assinatura' && /CC_VAL_433|card validation|credit card validation/i.test(`${erro.mensagem || ''} ${erro.causas.map(c => c.descricao).join(' ')}`)) {
      return {
        codigo: 'CC_VAL_433',
        entrada: {
          rotulo: 'Banco recusou o cartão para a assinatura',
          responsavel: 'banco',
          recuperavel: 'talvez',
          nosso: false,
          diagnostico: 'Na assinatura recorrente, o Mercado Pago valida o cartão antes de ativar o plano e o banco recusou essa validação.',
          causas: ['Cartão sem limite para a primeira cobrança', 'Emissor que não aceita cobrança recorrente nesse cartão', 'Cartão de débito, pré-pago ou virtual'],
          acaoComprador: 'Tentar outro cartão de crédito ou usar o pagamento único (Pix ou cartão).',
          acaoEquipe: 'Nada a corrigir no código.',
        },
      }
    }
    const codigo = erro.causas.find(c => c.codigo)?.codigo || (erro.status ? `http_${erro.status}` : 'erro_api')
    return { codigo, entrada: entradaDeErroDaApi(erro) }
  }
  // resultado: recusa/cancelamento devolvido pelo Mercado Pago (ou encerrado por nós).
  const detalhe = e.statusDetail || e.tecnico?.statusDetail || ''
  if (detalhe && POR_STATUS_DETAIL[detalhe]) return { codigo: detalhe, entrada: POR_STATUS_DETAIL[detalhe] }
  if ((e.status || e.tecnico?.status) === 'cancelled') return { codigo: detalhe || 'cancelled', entrada: ENTRADA_CANCELADO }
  return { codigo: detalhe || 'rejected', entrada: detalhe ? entradaGenerica(detalhe) : { ...entradaGenerica('sem detalhe'), rotulo: 'Recusa sem detalhe' } }
}

export function analisarRecusa(e: EntradaDaAnalise): AnaliseDaRecusa {
  const { codigo, entrada } = escolherEntrada(e)
  return {
    codigo,
    rotulo: entrada.rotulo,
    responsavel: entrada.responsavel,
    responsavelRotulo: ROTULO_DO_RESPONSAVEL[entrada.responsavel],
    recuperavel: entrada.recuperavel,
    nosso: entrada.nosso,
    diagnostico: entrada.diagnostico,
    causas: entrada.causas,
    acaoComprador: entrada.acaoComprador,
    acaoEquipe: entrada.acaoEquipe,
    sinais: derivarSinais(e, entrada),
  }
}

// ─── Dispositivo ─────────────────────────────────────────────────────────────

/** Aparelho e navegador a partir do user-agent — o suficiente para achar um padrão. */
export function descreverDispositivo(userAgent?: string | null): string {
  const ua = userAgent || ''
  if (!ua) return 'Não informado'
  const celular = /Android|iPhone|iPad|iPod|Mobi/i.test(ua)
  let navegador = 'Outro navegador'
  if (/Instagram/i.test(ua)) navegador = 'Navegador do Instagram'
  else if (/FBAN|FBAV|FB_IAB/i.test(ua)) navegador = 'Navegador do Facebook'
  else if (/WhatsApp/i.test(ua)) navegador = 'Navegador do WhatsApp'
  else if (/Edg\//i.test(ua)) navegador = 'Edge'
  else if (/SamsungBrowser/i.test(ua)) navegador = 'Samsung Internet'
  else if (/OPR\/|Opera/i.test(ua)) navegador = 'Opera'
  else if (/Firefox|FxiOS/i.test(ua)) navegador = 'Firefox'
  else if (/CriOS|Chrome/i.test(ua)) navegador = 'Chrome'
  else if (/Safari/i.test(ua)) navegador = 'Safari'
  return `${celular ? 'Celular' : 'Computador'} · ${navegador}`
}

// ─── Agregação para o painel ─────────────────────────────────────────────────

export interface RecusaParaResumo {
  etapa: EtapaDaFalha
  analise: AnaliseDaRecusa
  tecnico?: DadosTecnicos | null
  requisicao?: RequisicaoDoCartao | null
  valor: number
  criadoEm: Date | string
  comprador: string
  recuperada: boolean
  dispositivo: string
}

export interface LinhaDoResumo {
  chave: string
  rotulo: string
  qtd: number
  valor: number
  recuperadas: number
  participacao: number
  responsavel?: Responsavel
}

export interface ResumoDasRecusas {
  total: number
  valor: number
  recuperadas: number
  valorRecuperado: number
  valorPerdido: number
  compradores: number
  nossas: number
  /** Tentativas cuja chamada ao Mercado Pago saiu sem device ID. */
  semDeviceId: number
  porMotivo: LinhaDoResumo[]
  porResponsavel: LinhaDoResumo[]
  porEtapa: LinhaDoResumo[]
  porBandeira: LinhaDoResumo[]
  porEmissor: LinhaDoResumo[]
  porBin: LinhaDoResumo[]
  porParcelas: LinhaDoResumo[]
  porHorario: LinhaDoResumo[]
  porDispositivo: LinhaDoResumo[]
}

const FAIXAS = ['Madrugada (0h–6h)', 'Manhã (6h–12h)', 'Tarde (12h–18h)', 'Noite (18h–24h)']

export function resumirRecusas(registros: RecusaParaResumo[]): ResumoDasRecusas {
  const total = registros.length
  const soma = (lista: RecusaParaResumo[]) => arredondar(lista.reduce((s, r) => s + (r.valor || 0), 0))
  const recuperadas = registros.filter(r => r.recuperada)

  const agrupar = (
    chaveDe: (r: RecusaParaResumo) => { chave: string; rotulo: string; responsavel?: Responsavel } | null,
    ordem?: string[]
  ): LinhaDoResumo[] => {
    const mapa = new Map<string, LinhaDoResumo>()
    for (const o of ordem || []) mapa.set(o, { chave: o, rotulo: o, qtd: 0, valor: 0, recuperadas: 0, participacao: 0 })
    for (const r of registros) {
      const k = chaveDe(r)
      if (!k) continue
      const atual = mapa.get(k.chave) || { chave: k.chave, rotulo: k.rotulo, qtd: 0, valor: 0, recuperadas: 0, participacao: 0, responsavel: k.responsavel }
      atual.qtd += 1
      atual.valor = arredondar(atual.valor + (r.valor || 0))
      if (r.recuperada) atual.recuperadas += 1
      mapa.set(k.chave, atual)
    }
    const linhas = [...mapa.values()].map(l => ({ ...l, participacao: total ? (l.qtd / total) * 100 : 0 }))
    return ordem ? linhas : linhas.sort((a, b) => b.qtd - a.qtd || b.valor - a.valor)
  }

  return {
    total,
    valor: soma(registros),
    recuperadas: recuperadas.length,
    valorRecuperado: soma(recuperadas),
    valorPerdido: soma(registros.filter(r => !r.recuperada)),
    compradores: new Set(registros.map(r => r.comprador).filter(Boolean)).size,
    nossas: registros.filter(r => r.analise.nosso).length,
    semDeviceId: registros.filter(r => r.requisicao && !r.requisicao.deviceIdPresente).length,
    porMotivo: agrupar(r => ({ chave: r.analise.codigo, rotulo: r.analise.rotulo, responsavel: r.analise.responsavel })),
    porResponsavel: agrupar(r => ({ chave: r.analise.responsavel, rotulo: r.analise.responsavelRotulo, responsavel: r.analise.responsavel })),
    porEtapa: agrupar(r => ({ chave: r.etapa, rotulo: ROTULO_DA_ETAPA[r.etapa] })),
    porBandeira: agrupar(r => {
      const id = r.tecnico?.paymentMethodId || r.requisicao?.paymentMethodId
      return id ? { chave: id, rotulo: rotuloDaBandeira(id) } : null
    }),
    porEmissor: agrupar(r => {
      const id = r.tecnico?.emissorId || r.requisicao?.emissorEnviado
      return id ? { chave: id, rotulo: `Emissor ${id}` } : null
    }),
    porBin: agrupar(r => (r.tecnico?.bin ? { chave: r.tecnico.bin, rotulo: `BIN ${r.tecnico.bin}` } : null)).slice(0, 15),
    porParcelas: agrupar(r => {
      const n = r.requisicao?.parcelas ?? r.tecnico?.parcelas
      return n ? { chave: String(n), rotulo: n === 1 ? 'À vista' : `${n}x` } : null
    }).sort((a, b) => Number(a.chave) - Number(b.chave)),
    porHorario: agrupar(
      r => {
        const hora = Math.floor(relogioBrasilia(new Date(r.criadoEm)).minutos / 60)
        const faixa = FAIXAS[Math.min(3, Math.floor(hora / 6))]
        return { chave: faixa, rotulo: faixa }
      },
      FAIXAS
    ),
    porDispositivo: agrupar(r => ({ chave: r.dispositivo, rotulo: r.dispositivo })),
  }
}

/** Frases de leitura do conjunto — o "o que isto quer dizer" que o painel abre. */
export function diagnosticoGeral(
  resumo: ResumoDasRecusas,
  contexto: { aprovadas?: number; recusadasNoPeriodo?: number } = {}
): string[] {
  const out: string[] = []
  if (resumo.total === 0) return ['Nenhuma falha de cartão registrada no período.']

  const pct = (n: number) => `${((n / resumo.total) * 100).toFixed(0)}%`
  const dePorResp = (r: Responsavel) => resumo.porResponsavel.find(l => l.chave === r)

  const tentativas = (contexto.aprovadas ?? 0) + (contexto.recusadasNoPeriodo ?? 0)
  if (tentativas > 0 && contexto.recusadasNoPeriodo != null) {
    out.push(
      `De ${tentativas} pagamentos com cartão que tiveram resultado, ${contexto.recusadasNoPeriodo} foram recusados (${((contexto.recusadasNoPeriodo / tentativas) * 100).toFixed(1).replace('.', ',')}%).`
    )
  }

  const principal = resumo.porMotivo[0]
  if (principal) out.push(`Motivo mais comum: ${principal.rotulo} — ${principal.qtd} caso${principal.qtd > 1 ? 's' : ''} (${pct(principal.qtd)}).`)

  const banco = dePorResp('banco')
  if (banco && banco.qtd / resumo.total >= 0.3) {
    out.push(`${pct(banco.qtd)} das falhas são decisão do banco emissor: não dá para corrigir no código, e a saída é oferecer o Pix no lugar.`)
  }

  const antifraude = dePorResp('antifraude')
  if (antifraude && antifraude.qtd > 0) {
    const n = antifraude.qtd
    out.push(`${n} falha${n > 1 ? 's' : ''} (${pct(n)}) ${n > 1 ? 'vieram' : 'veio'} do antifraude do Mercado Pago, o grupo em que dados nossos (device ID, cartão de terceiro, tentativas repetidas) mais pesam. Veja os sinais de cada caso.`)
  }

  if (resumo.semDeviceId > 0) {
    const n = resumo.semDeviceId
    out.push(`${n} tentativa${n > 1 ? 's' : ''} ${n > 1 ? 'saíram' : 'saiu'} SEM device ID: o antifraude do Mercado Pago recusa bem mais sem ele, e isso é corrigível do nosso lado.`)
  }

  if (resumo.nossas > 0) {
    const n = resumo.nossas
    out.push(`ATENÇÃO: ${n} falha${n > 1 ? 's' : ''} (${pct(n)}) ${n > 1 ? 'têm' : 'tem'} indício de causa NOSSA (integração, parcelas, credencial). Marque "Só com indício de causa nossa" na lista abaixo.`)
  }

  const dados = dePorResp('dados')
  if (dados && dados.qtd / resumo.total >= 0.2) {
    out.push(`${pct(dados.qtd)} são dados digitados errado: vale revisar o formulário (autopreenchimento, validade, CPF do titular).`)
  }

  if (resumo.recuperadas > 0) {
    const n = resumo.recuperadas
    out.push(
      `${n} de ${resumo.total} recusas (${pct(n)}) ${n > 1 ? 'foram recuperadas' : 'foi recuperada'}: o comprador pagou depois, e isso preserva ${brl(resumo.valorRecuperado)}. Sem recuperação ficam ${brl(resumo.valorPerdido)}.`
    )
  } else {
    out.push(`Nenhuma recusa foi recuperada no período: ${brl(resumo.valorPerdido)} deixaram de entrar.`)
  }

  const insta = resumo.porDispositivo.find(l => /Instagram|Facebook|WhatsApp/.test(l.rotulo))
  if (insta && insta.qtd >= 2 && insta.qtd / resumo.total >= 0.2) {
    out.push(`${pct(insta.qtd)} das falhas vieram de navegadores embutidos de redes sociais, que costumam bloquear scripts de segurança e do Mercado Pago.`)
  }

  const parceladas = resumo.porParcelas.filter(l => Number(l.chave) > 1).reduce((s, l) => s + l.qtd, 0)
  if (parceladas / resumo.total >= 0.5) {
    out.push(`${((parceladas / resumo.total) * 100).toFixed(0)}% das falhas eram compras parceladas: o limite do cartão precisa comportar o total, e à vista ou o Pix costumam passar.`)
  }

  return out
}
