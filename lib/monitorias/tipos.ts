/**
 * Monitorias — o marketplace de aulas entre usuários.
 *
 * ## Nome
 *
 * "Monitor" já é um cargo de equipe (`user.secondaryRole === 'monitor'`, quem
 * gerencia aulas e fórum). Esta seção NÃO usa esse cargo: quem anuncia
 * monitoria é um "tutor" no código e "Monitor" na tela. As coleções são todas
 * `monitorias_*`.
 *
 * ## Dinheiro
 *
 * Todo valor aqui é **centavo inteiro** (`*Centavos`). Float só existe na
 * fronteira com o Mercado Pago (`payment_orders.amount` é em reais) — ver
 * `lib/monitorias/dinheiro.ts`. Somar 0,1 + 0,2 em float num livro-razão é
 * como se perde dinheiro sem ninguém notar.
 *
 * ## Datas
 *
 * Instantes em UTC no banco; tudo que uma pessoa escolhe ou lê é no horário
 * de Brasília (`lib/fuso-brasilia.ts`).
 */

import type { ObjectId } from 'mongodb'

type Id = string | ObjectId

// ─── Tutor (perfil de quem dá monitoria) ────────────────────────────────

export type TipoChavePix = 'cpf' | 'email' | 'telefone' | 'aleatoria'

export interface ChavePixArmazenada {
  tipo: TipoChavePix
  /** AES-256-GCM "iv.tag.cifra" em base64url — ver `cripto.ts`. */
  cifrada: string
  /** Para exibir: "***.456.789-**", "jo***@gmail.com"... */
  mascarada: string
  /** HMAC da chave normalizada — compara sem decifrar. */
  hmac: string
  /**
   * O titular é SEMPRE o próprio monitor (conferido no cadastro: mesmo CPF da
   * conta). Por isso o CPF não é repetido aqui — numa chave do tipo CPF ele
   * seria a própria chave em texto puro, ao lado da versão cifrada.
   */
  titularConferido: true
  atualizadaEm: Date
}

/** Intervalo semanal de disponibilidade, no horário de Brasília. */
export interface JanelaSemanal {
  /** 0 = domingo … 6 = sábado (dia da semana em Brasília). */
  dia: number
  /** "HH:MM" em Brasília. */
  inicio: string
  /** "HH:MM" em Brasília, exclusivo. */
  fim: string
}

export interface Disponibilidade {
  semanal: JanelaSemanal[]
  /** Dias inteiros bloqueados ("AAAA-MM-DD" em Brasília): férias, provas... */
  diasBloqueados: string[]
  /** Folga obrigatória entre duas aulas, em minutos (0, 15 ou 30). */
  intervaloMin: number
}

export type StatusTutor = 'ativo' | 'suspenso'

export interface Tutor {
  _id?: Id
  userId: string
  /** Nome de exibição (copiado do usuário no momento da edição). */
  nome: string
  fotoUrl?: string
  /** Frase curta do card ("Monitora de Fisiologia há 3 semestres"). */
  titulo: string
  bio: string
  historia: string
  status: StatusTutor
  /** Cancelamentos/faltas do monitor nos últimos 90 dias. */
  strikes: Array<{ em: Date; reservaId: string; motivo: string }>
  pix?: ChavePixArmazenada
  /** Troca de chave pendente: só vale depois de `liberaEm` (carência anti-invasão). */
  pixPendente?: ChavePixArmazenada & { liberaEm: Date }
  disponibilidade: Disponibilidade
  /** Estorno que chegou depois do repasse: abatido do próximo pagamento. */
  saldoDevedorCentavos: number
  stats: { aulasDadas: number; nota: number; avaliacoes: number }
  createdAt: Date
  updatedAt: Date
}

// ─── Anúncio ────────────────────────────────────────────────────────────

export type ModoPreco = 'aula' | 'hora'

export interface FaixaGrupo {
  /** A partir de quantos alunos esta faixa vale. */
  minAlunos: number
  /** Preço POR PESSOA nesta faixa. */
  valorPorPessoaCentavos: number
}

export interface ModoDireto {
  /** Duração mínima de uma aula agendada direto, em minutos (múltiplo de 30). */
  duracaoMinMin: number
  /** Duração máxima — "quantas horas no máximo eu dou por aula". */
  duracaoMaxMin: number
  /** De quanto em quanto a duração cresce (30 ou 60). */
  passoMin: number
  /** Antecedência mínima para agendar, em horas. */
  antecedenciaMinHoras: number
}

export interface ModosContratacao {
  /** Aluno escolhe horário na agenda e paga na hora. */
  direto?: ModoDireto
  /** Aluno conversa e negocia em cima do preço de referência. */
  negociacao?: boolean
  /** "Valor e horários a combinar" — a 1ª proposta vem do monitor. */
  aCombinar?: boolean
}

export interface VideoAnuncio {
  provider: 'youtube' | 'instagram'
  /** Só o identificador — nunca a URL crua (ver `videos.ts`). */
  id: string
  /** Para Instagram: post ('p') ou reel. */
  tipo?: 'p' | 'reel'
}

export interface MaterialComplementar {
  titulo: string
  url: string
  dominio: string
}

export interface ItemFaq {
  pergunta: string
  resposta: string
}

export type StatusAnuncio = 'rascunho' | 'em_analise' | 'publicado' | 'rejeitado' | 'pausado' | 'suspenso'

/** O que o monitor pode editar — e o que vai para análise. */
export interface ConteudoAnuncio {
  titulo: string
  materia: string
  /** Módulos/conteúdos que cobre ("Sistema cardiovascular", "ECG"...). */
  conteudos: string[]
  descricao: string
  videos: VideoAnuncio[]
  preco: {
    modo: ModoPreco
    /** Por aula ou por hora, conforme `modo`. Em "a combinar" é o "a partir de". */
    valorCentavos: number
    /** Duração de referência de uma aula (para o modo 'aula'). */
    duracaoPadraoMin: number
  }
  grupo: { ativo: boolean; maxAlunos: number; faixas: FaixaGrupo[] }
  aulaGratis: { ativa: boolean; duracaoMin: number }
  modos: ModosContratacao
  faq: ItemFaq[]
  materiais: MaterialComplementar[]
  /** Aviso "tenho materiais complementares" mesmo sem links públicos. */
  temMateriais: boolean
}

export interface AssinaturaOferta {
  /** Versão do texto da oferta-padrão assinada. */
  versao: string
  hash: string
  em: Date
  ip: string
  userAgent: string
  /** O texto assinado (prova autossuficiente). */
  texto?: string
}

export interface Anuncio extends ConteudoAnuncio {
  _id?: Id
  tutorId: string
  /** userId do dono — repetido para os filtros de dono saírem num índice só. */
  userId: string
  slug: string
  status: StatusAnuncio
  /** Edição de um anúncio já publicado esperando o admin (a versão no ar continua). */
  revisaoPendente?: ConteudoAnuncio & { enviadaEm: Date }
  moderacao?: { por: string; em: Date; acao: string; motivo?: string }
  /** Oferta-padrão do agendamento direto, assinada pelo monitor. */
  ofertaAssinada?: AssinaturaOferta
  stats: { reservas: number; nota: number; avaliacoes: number; perguntas: number }
  publicadoEm?: Date
  createdAt: Date
  updatedAt: Date
}

// ─── Perguntas públicas do anúncio ──────────────────────────────────────

export interface Pergunta {
  _id?: Id
  anuncioId: string
  tutorUserId: string
  autorId: string
  autorNome: string
  texto: string
  resposta?: { texto: string; em: Date }
  status: 'visivel' | 'oculta'
  denuncias: Array<{ userId: string; em: Date }>
  createdAt: Date
}

// ─── Reserva (negociação + o evento da aula) ────────────────────────────

export type StatusReserva =
  | 'solicitada'
  | 'em_negociacao'
  | 'aguardando_assinaturas'
  | 'aguardando_pagamento'
  | 'confirmada'
  | 'realizada'
  | 'concluida'
  | 'em_disputa'
  | 'cancelada_aluno'
  | 'cancelada_monitor'
  | 'recusada'
  | 'expirada'
  | 'reembolsada'

export type OrigemReserva = 'direto' | 'negociacao' | 'a_combinar' | 'gratis'

export interface Proposta {
  id: string
  autorId: string
  /** Instante UTC do início. */
  inicio: Date
  duracaoMin: number
  conteudos: string[]
  /** Quantos alunos (1 = individual). */
  vagas: number
  valorPorPessoaCentavos: number
  gratis: boolean
  observacao?: string
  criadaEm: Date
}

export interface Reserva {
  _id?: Id
  anuncioId: string
  anuncioTitulo: string
  tutorId: string
  tutorUserId: string
  /** Quem abriu a reserva (o organizador, no caso de grupo). */
  solicitanteId: string
  origem: OrigemReserva
  status: StatusReserva
  /** Proposta em vigor (a última feita). */
  proposta?: Proposta
  /** Aceites da proposta em vigor — zera a cada proposta nova. */
  aceites: { aluno?: Date; tutor?: Date }
  inicio?: Date
  fim?: Date
  /** Até quando os assentos podem pagar. */
  prazoPagamento?: Date
  /** Código de convite do grupo — só aparece para quem já está na reserva. */
  codigoConvite?: string
  linkReuniao?: string
  /** Materiais do anúncio no momento da reserva (o aluno não perde se o anúncio mudar). */
  materiais?: MaterialComplementar[]
  /** Materiais que o monitor mandou só para esta monitoria. */
  materiaisExtras?: Array<MaterialComplementar & { em: Date }>
  motivoCancelamento?: string
  canceladaPor?: string
  ticketId?: string
  /** Reporte de problema depois da aula (abre disputa). */
  disputa?: { abertaPor: string; em: Date; motivo: string; decisao?: string; decididaPor?: string; decididaEm?: Date }
  lembretes?: { h24?: Date; h1?: Date; avaliar?: Date }
  versao: number
  /** Trava curta enquanto a confirmação após o pagamento roda (evita duas ao mesmo tempo). */
  confirmandoEm?: Date
  /** Última atividade de cada lado — para "sem resposta há 72h". */
  ultimaAtividadeEm: Date
  createdAt: Date
  updatedAt: Date
}

export interface Mensagem {
  _id?: Id
  reservaId: string
  autorId: string
  tipo: 'texto' | 'proposta' | 'sistema'
  texto: string
  propostaId?: string
  createdAt: Date
}

export type StatusParticipacao =
  | 'aguardando_assinatura'
  | 'aguardando_pagamento'
  | 'paga'
  | 'gratis'
  | 'expirada'
  | 'cancelada'
  | 'reembolso_processando'
  | 'reembolsada'
  | 'concluida'
  | 'chargeback'

export interface Reembolso {
  chave: string
  valorCentavos: number
  motivo: string
  por: string
  em: Date
  status: 'processando' | 'concluido' | 'falhou'
  erro?: string
}

/** Um assento: um aluno numa reserva. É o que se paga e o que se reembolsa. */
export interface Participacao {
  _id?: Id
  reservaId: string
  alunoId: string
  alunoNome: string
  tutorId: string
  status: StatusParticipacao
  /** Preço do assento, fixado pelo servidor no aceite. Nunca vem do cliente. */
  valorCentavos: number
  contratoId?: string
  paymentOrderId?: string
  providerPaymentId?: string
  /** Total que saiu do bolso do aluno (com taxa Pix), em centavos. */
  pagoCentavos?: number
  pagoEm?: Date
  reembolsos: Reembolso[]
  /** Avaliação do aluno depois da aula (1 a 5 estrelas). */
  avaliacao?: { nota: number; comentario: string; em: Date; anuncioId: string }
  /** Status a que o assento volta depois de um reembolso PARCIAL. */
  statusAntesDoReembolso?: StatusParticipacao
  tentativasReembolso?: number
  /** Pedido de cancelamento (<24h, fora do arrependimento) esperando o suporte: segura o repasse. */
  cancelamentoPedidoEm?: Date
  cancelamentoTicketId?: string
  /** Avisos de "pagamento confirmado" já mandados (reprocessar a aprovação não reenvia). */
  pagamentoAvisadoEm?: Date
  createdAt: Date
  updatedAt: Date
}

/** Blocos de 30 min ocupados. Índice único (tutorId, inicioBloco) = sem conflito de horário. */
export interface Bloqueio {
  _id?: Id
  tutorId: string
  inicioBloco: Date
  reservaId: string
  tipo: 'hold' | 'firme'
  /** Só para hold: quando o TTL recolhe. */
  expiraEm?: Date
}

// ─── Dinheiro: repasses, livro-razão, pagamentos ao monitor ─────────────

export type StatusRepasse = 'em_garantia' | 'liberado' | 'em_pagamento' | 'pago' | 'estornado' | 'retido'

export interface Repasse {
  _id?: Id
  participacaoId: string
  reservaId: string
  tutorId: string
  tutorUserId: string
  brutoCentavos: number
  taxaPlataformaCentavos: number
  liquidoTutorCentavos: number
  status: StatusRepasse
  /** Fim da aula + 48h. */
  liberaEm?: Date
  payoutId?: string
  /** Estornos já aplicados (pela chave do reembolso): nunca descontar duas vezes. */
  estornos?: Array<{ chave: string; perdaCentavos: number; em: Date }>
  /** Parte do bruto reembolsada DEPOIS que o repasse já tinha saído. */
  brutoEstornadoAposPagoCentavos?: number
  createdAt: Date
  updatedAt: Date
}

export type TipoLancamento = 'credito_bruto' | 'taxa_plataforma' | 'estorno' | 'repasse' | 'ajuste' | 'saldo_devedor'

/** Livro-razão: só insere, nunca altera. */
export interface Lancamento {
  _id?: Id
  tutorId: string
  repasseId?: string
  participacaoId?: string
  payoutId?: string
  tipo: TipoLancamento
  /** Com sinal: crédito ao monitor positivo, débito negativo. */
  valorCentavos: number
  descricao: string
  por: string
  em: Date
}

export type StatusPayout = 'aberto' | 'pago' | 'cancelado'

export interface Payout {
  _id?: Id
  tutorId: string
  tutorUserId: string
  repasseIds: string[]
  /** Soma dos líquidos menos saldo devedor abatido. */
  totalCentavos: number
  abatidoCentavos: number
  pix: { tipo: TipoChavePix; mascarada: string; titularCpfMascarado: string }
  provider: 'manual'
  status: StatusPayout
  e2eId?: string
  comprovantePath?: string
  comprovanteTipo?: string
  criadoPor: string
  pagoPor?: string
  pagoEm?: Date
  createdAt: Date
  updatedAt: Date
}

// ─── Termos e contratos ─────────────────────────────────────────────────

export type PapelTermos = 'monitor' | 'aluno'

export interface AceiteTermos {
  _id?: Id
  userId: string
  papel: PapelTermos
  versao: string
  hash: string
  em: Date
  ip: string
  userAgent: string
  /** Cópia do que foi aceito — reimprime a versão exata mesmo se o código mudar. */
  titulo?: string
  secoes?: Array<{ titulo: string; paragrafos: string[] }>
}

export interface EvidenciaAssinatura {
  userId: string
  papel: 'contratante' | 'contratado'
  nome: string
  em: Date
  ip: string
  userAgent: string
  /**
   * codigo_email: assinou com o código enviado ao e-mail.
   * oferta_padrao: monitor, no agendamento direto (assinou a oferta do anúncio).
   * assinatura_da_reserva: monitor, para alunos que entram depois num grupo —
   *   vale a assinatura que ele deu no contrato do organizador, nas mesmas condições.
   */
  metodo: 'codigo_email' | 'oferta_padrao' | 'assinatura_da_reserva'
  /** Hash do contrato que a pessoa viu e assinou. */
  hash: string
  /** De onde vem a assinatura prévia (versão da oferta / nº do contrato do organizador). */
  referencia?: string
  /**
   * Assinatura por ADESÃO (oferta-padrão ou contrato do organizador): o hash do
   * documento que o monitor de fato assinou em `em`, e quando essa assinatura
   * foi vinculada a este contrato. Assim a cronologia é verdadeira: "assinou a
   * oferta X em 01/10; vinculada a este contrato na emissão, em 05/10".
   */
  hashOrigem?: string
  vinculadaEm?: Date
}

/** Dados congelados no contrato — o PDF e o hash saem daqui. */
export interface DadosContrato {
  numero: string
  modeloVersao: string
  contratante: { userId: string; nome: string; cpf: string; email: string }
  contratado: { userId: string; nome: string; cpf: string; email: string }
  anuncio: { id: string; titulo: string; materia: string }
  conteudos: string[]
  inicio: string
  fim: string
  duracaoMin: number
  vagas: number
  valorCentavos: number
  taxaPlataformaCentavos: number
  gratis: boolean
  origem: OrigemReserva
  emitidoEm: string
  /** Intermediadora, foro e versão dos Termos congelados na emissão (modelo v2+). */
  intermediadora?: { identificacao: string; foro: string; versaoTermos: string }
}

export interface Contrato {
  _id?: Id
  numero: string
  reservaId: string
  participacaoId: string
  contratanteId: string
  contratadoId: string
  dados: DadosContrato
  /** O texto exato que foi emitido/assinado (modelo v2+). */
  secoes?: Array<{ titulo: string; paragrafos: string[] }>
  hash: string
  assinaturas: EvidenciaAssinatura[]
  status: 'aguardando_assinaturas' | 'assinado' | 'rescindido'
  /** Por que deixou de valer (ex.: reembolso integral do assento). O texto assinado não muda. */
  rescisao?: { em: Date; motivo: string }
  /** Código curto para a página pública de verificação. */
  codigoVerificacao: string
  pdfPath?: string
  createdAt: Date
  updatedAt: Date
}

/** Códigos de 6 dígitos enviados por e-mail (assinatura, troca de PIX). */
export interface CodigoConfirmacao {
  _id?: Id
  userId: string
  finalidade: string
  hash: string
  tentativas: number
  expiraEm: Date
  createdAt: Date
}

/**
 * Devolução de um pagamento que NÃO é o do assento (PIX pago duas vezes, valor
 * errado com o assento já pago). `_id` é a chave de idempotência no Mercado
 * Pago — a varredura tenta de novo com a mesma chave até concluir.
 */
export interface DevolucaoAvulsa {
  _id: string
  orderId: string
  providerPaymentId: string
  participacaoId: string
  alunoId: string
  motivo: string
  status: 'processando' | 'concluida' | 'falhou'
  tentativas: number
  erro?: string
  createdAt: Date
  updatedAt: Date
}
