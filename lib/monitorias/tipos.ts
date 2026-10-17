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
import type { PeriodoDemanda, QuandoDemanda, ResumoDemanda } from './demandas-regras'

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
  /**
   * Retrato escolhido no catálogo (`lib/monitorias/avatares.ts`). O monitor não
   * envia foto: `fotoUrl` é sempre gravada pelo servidor a partir deste id.
   */
  avatar?: string
  fotoUrl?: string
  /** Versão da conferência "retrato do monitor = retrato da conta" já feita (varredura). */
  retratoConferido?: number
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
  /** Último e-mail de "aluno procurando monitor" (no máximo um por dia). */
  ultimoAvisoDemandaEm?: Date
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
  /**
   * Material OFICIAL da plataforma (coleção `materials`) que o monitor indica
   * para levar junto. Só o id: título e preço são sempre lidos do banco.
   * Opcional para o aluno (sem venda casada, CDC art. 39, I).
   */
  materialOficialId?: string | null
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
  | 'cancelada_suporte'
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
  /** Nasceu da resposta de um monitor a um pedido do aluno (cópia do pedido). */
  demanda?: { id: string } & ResumoDemanda
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
  /** Trava curta: uma entrada por convite de cada vez (a última vaga não vai para dois). */
  entrandoEm?: Date
  /** Última atividade de cada lado — para "sem resposta há 72h". */
  ultimaAtividadeEm: Date
  /**
   * Sala de teste do admin (sem anúncio, contrato nem pagamento). Fica fora dos
   * lembretes, da conclusão, das estatísticas e das avaliações; some em 7 dias.
   */
  teste?: boolean
  /** Código do convite da sala de teste (`/monitorias/teste/<código>`). */
  codigoTeste?: string
  /**
   * Excluída pelo suporte: some de todas as telas (aluno, monitor, admin), mas
   * o registro financeiro e o contrato ficam guardados. O admin pode restaurar.
   */
  excluidaEm?: Date
  excluidaPor?: string
  motivoExclusao?: string
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
  /** 'falhou' só em registros antigos: hoje a varredura nunca desiste. */
  status: 'processando' | 'concluido' | 'falhou'
  erro?: string
  /** Concluído porque o MP já mostrava a devolução (a resposta anterior se perdeu). */
  conciliadoNoGateway?: boolean
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
  /** A reserva foi excluída pelo suporte: o assento some das listas e do "investido" do aluno. */
  reservaExcluida?: boolean
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
  /** Pagamento conferido no Mercado Pago (status, valor e referência) antes de liberar o repasse. */
  conferidoNoGatewayEm?: Date
  /**
   * Percentual da plataforma DESTA contratação, gravado uma vez, quando o
   * pagamento é aprovado (vem do pedido, que o servidor montou). Ausente =
   * assento de antes da regra = 10%.
   */
  taxaPercent?: number
  /** Material oficial comprado junto no mesmo PIX (retrato do pedido aprovado). */
  materialOficial?: MaterialNaCompra
  createdAt: Date
  updatedAt: Date
}

/** Retrato do material oficial vendido junto com a monitoria (preço oficial do banco). */
export interface MaterialNaCompra {
  id: string
  titulo: string
  precoCentavos: number
  /** Pedido (payment_orders) em que foi vendido — a compra do material aponta para ele. */
  paymentOrderId: string
  /** Preço ≥ 10% do valor da aula no momento da compra. */
  isentaTaxa: boolean
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
  /** Percentual aplicado (0 ou 10). Ausente = repasse de antes da regra = 10%. */
  taxaPercent?: number
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
  /** Por que ficou retido (ex.: divergência com o Mercado Pago na conferência antes de liberar). */
  retencao?: { motivo: string; em: Date; resolvidaPor?: string; resolvidaEm?: Date; nota?: string }
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

// ─── Pedidos de monitoria (o aluno publica, monitores respondem) ─────────

export type StatusDemanda = 'aberta' | 'atendida' | 'encerrada'

export interface Demanda {
  _id?: Id
  alunoId: string
  /** Só o primeiro nome aparece para os monitores. */
  alunoPrimeiroNome: string
  materia: string
  /** `chaveDaMateria(materia)`: casa "fisiologia" com "Fisiologia". */
  materiaChave: string
  assunto?: string
  pessoas: number
  valorPorPessoaCentavos: number | null
  duracaoMin: number
  quando: QuandoDemanda
  periodos: PeriodoDemanda[]
  status: StatusDemanda
  /** Monitores que responderam (teto em MAX_RESPOSTAS_POR_DEMANDA). */
  respostas: number
  /** Reserva que fechou o pedido (pago/confirmado). */
  atendidaPor?: string
  expiraEm: Date
  createdAt: Date
  updatedAt: Date
}

// ─── Sala de aula (videoconferência nativa; ver lib/monitorias/sala/) ────

/**
 * Chaves da sala no Admin → Monitorias (`admin_settings.monitoriasSala`).
 * Registro sem o campo = o padrão de `normalizarConfigSala`.
 */
export interface ConfigSala {
  /** Desligada: ninguém entra na sala nativa (botão "Entrar" some). */
  salaNativaAtiva: boolean
  /** O monitor pode colar link de Meet/Zoom (plano B). */
  linkExternoPermitido: boolean
  /** Entrega credenciais do Cloudflare TURN. Desligado: só STUN (grátis). */
  turnAtivo: boolean
  /** Teto mensal estimado de relé, em GB. `null` = sem teto. */
  turnOrcamentoGbMes: number | null
  /** Percentual do teto em que o TURN para de ser entregue sozinho. */
  turnCorteAutomaticoPct: number
  /** Pessoas ao mesmo tempo na sala (malha P2P): 2 a 4. */
  limiteMalha: number
  compartilharTela: boolean
  chatNaSala: boolean
  /** Qualidade do vídeo (fluidez, nitidez, consumo). */
  video: ConfigVideo
}

export type PerfilDeVideo = 'fluido' | 'equilibrado' | 'nitido' | 'economico' | 'personalizado'

/** O teto do vídeo de câmera e da tela; os degraus de rede ruim saem daqui (`niveisDaConfig`). */
export interface ConfigVideo {
  perfil: PerfilDeVideo
  /** Quadros por segundo no melhor nível (10 a 30). */
  fpsMax: number
  /** Teto da câmera numa aula 1:1, em kbps. */
  bitrateIndividualKbps: number
  /** Teto por par numa aula em grupo (malha: cada um envia um vídeo por pessoa), em kbps. */
  bitrateGrupoKbps: number
  /** Altura da captura: 360p (padrão) ou 480p. */
  resolucao: 360 | 480
  /** Desce a qualidade sozinho quando a rede piora (recomendado). */
  adaptativo: boolean
  telaFps: number
  telaBitrateKbps: number
}

export type PapelNaSala = 'monitor' | 'aluno'

export interface ParticipanteSala {
  uid: string
  papel: PapelNaSala
  /** Nome completo; quem vê o primeiro nome ou o completo é decidido na saída. */
  nome: string
  /** Retrato da conta (id do catálogo, o mesmo do /profile); a URL sai do catálogo na leitura. */
  avatar?: string
  /** Conexão ativa (uma aba/aparelho). `null` = saiu. */
  conexao: string | null
  /** Sobe a cada entrada: aba ou aparelho antigo deixa de valer. */
  epoca: number
  entrouEm: Date
  vistoEm: Date
  saiuEm?: Date
  /** Usuário da credencial TURN entregue (para revogar no "cortar agora"). */
  turnUsuario?: string
  /** Limite de envio de sinais: janela de 1 min e quantos foram. */
  envio?: { inicio: Date; n: number }
}

/** Sinal em trânsito: SDP/candidatos. Some sozinho (fila curta + 2 min + limpeza da varredura). */
export interface SinalArmazenado {
  seq: number
  de: string
  /** Conexão de quem enviou — o destinatário descarta o que vem de aba antiga. */
  cx: string
  para: string
  tipo: 'oferta' | 'resposta' | 'candidatos' | 'reiniciar'
  dados: unknown
  em: Date
}

/** Presença mínima: sem IP, sem SDP, sem aparelho. Evidência para o suporte numa disputa. */
export interface RegistroPresenca {
  /** A conexão (entrada) a que o registro se refere. */
  id: string
  pid: string
  papel: PapelNaSala
  entrou: Date
  /** Último sinal de vida (pulso/renovação). */
  ate: Date
  saiu?: Date
  conexaoTipo?: 'direta' | 'retransmitida'
}

export interface Sala {
  /** O id da reserva. Uma sala por reserva, criada só por entrada autorizada. */
  _id: string
  fim: Date
  /** Por id opaco (`pid`), que não revela o userId aos outros participantes. */
  participantes: Record<string, ParticipanteSala>
  seq: number
  /** Sobe quando alguém entra, sai ou troca de aba — a ETag do polling sai daqui. */
  versao: number
  sinais: SinalArmazenado[]
  registro: RegistroPresenca[]
  /** Quantas pessoas a aula espera (monitor + assentos com aula), até o limite da sala. */
  esperados?: number
  encerradaEm?: Date | null
  /** Quem encerrou foi o suporte: o monitor não reabre. */
  encerradaPeloSuporte?: boolean
  /** Tirados da sala (pelo monitor ou pelo suporte): não entram de novo até serem liberados. */
  removidos?: Record<string, { em: Date; por: 'monitor' | 'suporte'; nome: string }>
  /** O que o monitor liberou para os alunos nesta aula (ausente = liberado). */
  permissoes?: PermissoesDaSala
  avisouEntradaMonitor?: Date
  createdAt: Date
  updatedAt: Date
}

export interface PermissoesDaSala {
  /** Alunos podem compartilhar a tela. */
  telaAlunos: boolean
  /** Alunos podem escrever no chat durante a aula. */
  chatAlunos: boolean
}

/** Consumo estimado do mês (um documento por "AAAA-MM"), para o teto de TURN. */
export interface UsoDaSala {
  _id: string
  bytesRelay: number
  segundosRelay: number
  segundosDireta: number
  atualizadoEm: Date
}

/** Onde a tentativa de contato apareceu. */
export type OrigemInfracao = 'chat' | 'chat_sala' | 'material'

/**
 * Tentativa de passar contato ou combinar por fora (`contato-inteligente.ts`).
 * `bloqueio` não foi entregue; `alerta` foi, mas o admin pode querer olhar.
 */
export interface Infracao {
  _id?: Id
  reservaId: string
  userId: string
  /** Nome no momento (o admin lê sem abrir o cadastro). */
  nome: string
  papel: 'monitor' | 'aluno'
  origem: OrigemInfracao
  nivel: 'bloqueio' | 'alerta'
  categorias: string[]
  trechos: string[]
  /** A mensagem (cortada em 500 caracteres): é a evidência para o suporte. */
  texto: string
  vistaEm?: Date
  vistaPor?: string
  createdAt: Date
}

/** Anotações de uma pessoa numa monitoria (só ela lê). O PDF sai no navegador. */
export interface Anotacao {
  _id?: Id
  userId: string
  reservaId: string
  texto: string
  /** Sobe a cada gravação: o aparelho com versão antiga não sobrescreve o mais novo. */
  versao: number
  createdAt: Date
  updatedAt: Date
}
