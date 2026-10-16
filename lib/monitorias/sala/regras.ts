/**
 * Regras da sala de aula — funções puras, testadas, usadas pelo servidor E pelo
 * navegador. Nada aqui toca rede, banco ou DOM.
 *
 * ## O desenho, em uma frase
 *
 * Áudio e vídeo vão direto entre os navegadores (ou pelo Cloudflare TURN quando o
 * direto falha); a Vercel só apresenta as pessoas e ajuda a reconectar. Cada
 * número abaixo existe para manter essa segunda parte rara: a sala custa
 * invocações só enquanto ninguém está conectado.
 */

import type { ConfigSala, PapelNaSala, ParticipanteSala, StatusReserva } from '../tipos'

// ─── Janela de horário ─────────────────────────────────────────────────

/** O monitor chega antes para arrumar câmera e material. */
export const ABRE_ANTES_MONITOR_MIN = 30
export const ABRE_ANTES_ALUNO_MIN = 15
/** Folga depois do fim: aula que passa um pouco do horário não é cortada no meio. */
export const FECHA_DEPOIS_MIN = 30
/** Aviso na tela antes de a sala fechar. */
export const AVISO_FECHAMENTO_MIN = 10

export function janelaDaSala(inicio: Date, fim: Date, papel: PapelNaSala): { abreEm: Date; fechaEm: Date } {
  const antes = papel === 'monitor' ? ABRE_ANTES_MONITOR_MIN : ABRE_ANTES_ALUNO_MIN
  return {
    abreEm: new Date(inicio.getTime() - antes * 60_000),
    fechaEm: new Date(fim.getTime() + FECHA_DEPOIS_MIN * 60_000),
  }
}

// ─── Tokens, presença e fila de sinais ─────────────────────────────────

/** Vida do token da sala. Curto: a renovação é quando o servidor reconfere tudo. */
export const TOKEN_TTL_MS = 15 * 60_000
/** Renova com esta antecedência (na prática, a cada ~10 min). */
export const RENOVAR_ANTES_MS = 5 * 60_000
/** Sem pulso há mais que isto = não está mais na sala (o pulso é de 30 s). */
export const PRESENCA_VALIDA_MS = 75_000
/** Sinal mais velho que isto é ignorado (SDP/candidato de uma tentativa antiga). */
export const SINAL_TTL_MS = 120_000
/** Quantos sinais a sala guarda. Uma negociação usa 2 a 4. */
export const FILA_DE_SINAIS = 60
/** Sinais por minuto por conexão. Uma negociação inteira cabe com folga. */
export const ENVIOS_POR_MINUTO = 60
/** Entradas por hora por conta (recarregar a página conta como entrada). */
export const ENTRADAS_POR_HORA = 20
export const RENOVACOES_POR_HORA = 20

export function presente(p: Pick<ParticipanteSala, 'conexao' | 'vistoEm'> | null | undefined, agora: Date): boolean {
  return !!p && !!p.conexao && agora.getTime() - new Date(p.vistoEm).getTime() <= PRESENCA_VALIDA_MS
}

// ─── Configuração do admin ─────────────────────────────────────────────

export const CONFIG_SALA_PADRAO: ConfigSala = {
  salaNativaAtiva: true,
  // Ligado de início: quem já combinou aula pelo Meet não é pego de surpresa.
  linkExternoPermitido: true,
  turnAtivo: true,
  // Abaixo dos 1.000 GB grátis do Cloudflare, com folga.
  turnOrcamentoGbMes: 900,
  turnCorteAutomaticoPct: 90,
  limiteMalha: 4,
  compartilharTela: true,
  chatNaSala: true,
}

export const LIMITE_MALHA_MIN = 2
export const LIMITE_MALHA_MAX = 4

function inteiroEntre(valor: unknown, min: number, max: number, padrao: number): number {
  const n = typeof valor === 'number' ? valor : Number(valor)
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : padrao
}

/** O que estiver gravado, completado e cercado pelos limites. Nunca lança. */
export function normalizarConfigSala(cru: unknown): ConfigSala {
  const c = (cru && typeof cru === 'object' ? cru : {}) as Partial<Record<keyof ConfigSala, unknown>>
  const bool = (v: unknown, padrao: boolean) => (typeof v === 'boolean' ? v : padrao)
  const p = CONFIG_SALA_PADRAO
  const orcamento =
    c.turnOrcamentoGbMes === null ? null : c.turnOrcamentoGbMes === undefined ? p.turnOrcamentoGbMes : inteiroEntre(c.turnOrcamentoGbMes, 0, 1_000_000, p.turnOrcamentoGbMes ?? 0)
  return {
    salaNativaAtiva: bool(c.salaNativaAtiva, p.salaNativaAtiva),
    linkExternoPermitido: bool(c.linkExternoPermitido, p.linkExternoPermitido),
    turnAtivo: bool(c.turnAtivo, p.turnAtivo),
    turnOrcamentoGbMes: orcamento,
    turnCorteAutomaticoPct: inteiroEntre(c.turnCorteAutomaticoPct, 10, 100, p.turnCorteAutomaticoPct),
    limiteMalha: inteiroEntre(c.limiteMalha, LIMITE_MALHA_MIN, LIMITE_MALHA_MAX, p.limiteMalha),
    compartilharTela: bool(c.compartilharTela, p.compartilharTela),
    chatNaSala: bool(c.chatNaSala, p.chatNaSala),
  }
}

/**
 * Vagas máximas de uma reserva NOVA. Sem link externo, a única sala é a nativa,
 * e a malha comporta `limiteMalha` pessoas (monitor incluído): não se vende o
 * que a sala não comporta. Com link externo permitido, não há teto daqui.
 */
export function vagasMaximasPelaSala(config: ConfigSala): number | null {
  if (config.linkExternoPermitido) return null
  return config.limiteMalha - 1
}

// ─── TURN: entregar ou não ─────────────────────────────────────────────

export const BYTES_POR_GB = 1_000_000_000

export type SituacaoTurn = 'ativo' | 'desligado' | 'sem_credenciais' | 'orcamento'

export function situacaoDoTurn(input: { config: ConfigSala; configurado: boolean; bytesNoMes: number }): SituacaoTurn {
  if (!input.config.turnAtivo) return 'desligado'
  if (!input.configurado) return 'sem_credenciais'
  const teto = input.config.turnOrcamentoGbMes
  if (teto !== null && input.bytesNoMes >= (teto * BYTES_POR_GB * input.config.turnCorteAutomaticoPct) / 100) return 'orcamento'
  return 'ativo'
}

/** Validade da credencial TURN: até a sala fechar (+5 min), entre 5 min e 4 h. */
export function ttlDoTurnSegundos(agora: Date, fechaEm: Date): number {
  const s = Math.ceil((fechaEm.getTime() - agora.getTime()) / 1000) + 300
  return Math.min(4 * 3600, Math.max(300, s))
}

// ─── Quem pode entrar ──────────────────────────────────────────────────

/** Assento que dá direito à aula (o reembolso PARCIAL em andamento não tira ninguém). */
export const ASSENTOS_COM_AULA = ['paga', 'gratis', 'concluida', 'reembolso_processando']

export type MotivoRecusa = 'sem_acesso' | 'desligada' | 'status' | 'sem_horario' | 'nao_abriu' | 'fechada' | 'encerrada' | 'cheia'

export type ResultadoAcesso =
  | { ok: true; papel: PapelNaSala; abreEm: Date; fechaEm: Date }
  | { ok: false; motivo: MotivoRecusa; mensagem: string; abreEm?: Date; fechaEm?: Date }

export interface EntradaDoAcesso {
  ehMonitor: boolean
  /** Assento do usuário na reserva e se ele ainda participa (`papelNaReserva` não nulo). */
  assento: { status: string; ativo: boolean } | null
  status: StatusReserva
  inicio?: Date | null
  fim?: Date | null
  /** Quando a disputa foi aberta, se houver. */
  disputaEm?: Date | null
  encerradaEm?: Date | null
  agora: Date
  config: ConfigSala
}

/**
 * A decisão de entrar (e de continuar: a renovação passa por aqui de novo).
 *
 * `em_disputa` entra só se a disputa nasceu DEPOIS do início: é o aluno que
 * reportou um problema durante a aula, e o monitor pode ainda chegar. Disputa
 * aberta antes do início é pedido de cancelamento — essa aula não acontece por
 * aqui até o suporte decidir.
 */
export function avaliarAcessoSala(e: EntradaDoAcesso): ResultadoAcesso {
  const temAssento = !!e.assento && e.assento.ativo && ASSENTOS_COM_AULA.includes(e.assento.status)
  if (!e.ehMonitor && !temAssento) return { ok: false, motivo: 'sem_acesso', mensagem: 'Não encontrado.' }
  if (!e.config.salaNativaAtiva) {
    return { ok: false, motivo: 'desligada', mensagem: 'A sala de vídeo da plataforma está desligada no momento. Use o link da reunião, se houver, ou fale com o suporte.' }
  }
  const papel: PapelNaSala = e.ehMonitor ? 'monitor' : 'aluno'
  if (!e.inicio || !e.fim) return { ok: false, motivo: 'sem_horario', mensagem: 'Esta monitoria ainda não tem horário definido.' }
  const { abreEm, fechaEm } = janelaDaSala(e.inicio, e.fim, papel)
  const disputaDuranteAula = e.status === 'em_disputa' && !!e.disputaEm && e.disputaEm.getTime() >= e.inicio.getTime()
  if (e.status !== 'confirmada' && e.status !== 'realizada' && !disputaDuranteAula) {
    return { ok: false, motivo: 'status', mensagem: 'A sala só abre para monitorias confirmadas.', abreEm, fechaEm }
  }
  if (e.agora.getTime() < abreEm.getTime()) {
    return { ok: false, motivo: 'nao_abriu', mensagem: 'A sala ainda não abriu.', abreEm, fechaEm }
  }
  if (e.agora.getTime() > fechaEm.getTime()) {
    return { ok: false, motivo: 'fechada', mensagem: 'O horário desta monitoria terminou e a sala foi fechada.', abreEm, fechaEm }
  }
  if (e.encerradaEm && !e.ehMonitor) {
    return { ok: false, motivo: 'encerrada', mensagem: 'O monitor encerrou a aula. Se ele reabrir a sala, você pode voltar.', abreEm, fechaEm }
  }
  return { ok: true, papel, abreEm, fechaEm }
}

/** 404 para quem não é parte (não confirmamos que a reserva existe); 409 para "agora não". */
export function statusHttpDaRecusa(motivo: MotivoRecusa): number {
  if (motivo === 'sem_acesso') return 404
  if (motivo === 'desligada') return 503
  return 409
}

/** Cabe mais um? Conta quem está presente, sem contar o próprio (que pode estar trocando de aba). */
export function salaCheia(participantes: Record<string, ParticipanteSala>, meuPid: string, limite: number, agora: Date): boolean {
  const outros = Object.entries(participantes).filter(([pid, p]) => pid !== meuPid && presente(p, agora)).length
  return outros + 1 > limite
}

export function primeiroNome(nome: string): string {
  return (nome || '').trim().split(/\s+/)[0] || 'Participante'
}

// ─── Cadência da sinalização ───────────────────────────────────────────

/**
 * Em que pé a sala está, do ponto de vista de quanto ela precisa perguntar ao
 * servidor:
 *  - `sozinho`: na sala, esperando alguém. Precisa saber logo quando chegar.
 *  - `negociando`: oferta/resposta em curso. Rápido, por poucos segundos.
 *  - `incompleta`: conectado a alguém, mas falta gente esperada (grupo).
 *  - `em_aula`: todos conectados. O canal P2P faz o resto; aqui é só o pulso.
 *  - `reconectando`: o P2P caiu e o canal junto. Recuo progressivo.
 */
export type FaseDeSinal = 'sozinho' | 'negociando' | 'incompleta' | 'em_aula' | 'reconectando'

/** Esperando sozinho mais que isto, para de perguntar e mostra "Ainda está aí?". */
export const ESPERA_MAXIMA_SOZINHO_MS = 45 * 60_000
export const PULSO_EM_AULA_MS = 30_000

export function cadenciaDaSala(input: {
  fase: FaseDeSinal
  visivel: boolean
  /** Desde quando a fase atual começou (para afrouxar a espera). */
  haMs: number
  falhasSeguidas: number
}): number | null {
  const { fase, visivel, haMs, falhasSeguidas } = input
  if (falhasSeguidas > 0 && fase !== 'reconectando') return Math.min(30_000, 2_000 * 2 ** Math.min(4, falhasSeguidas - 1))
  switch (fase) {
    case 'negociando':
      // Uma negociação leva 1 a 3 voltas. Passou disso, algo travou (o outro
      // fechou a aba sem avisar e a presença ainda não venceu): afrouxa.
      return haMs < 15_000 ? 1_000 : 3_000
    case 'reconectando':
      // 1 s, 2 s, 4 s… até 8 s: o par caiu e cada segundo sem áudio conta.
      return Math.min(8_000, 1_000 * 2 ** Math.min(3, falhasSeguidas))
    case 'sozinho':
      if (haMs >= ESPERA_MAXIMA_SOZINHO_MS) return null
      if (!visivel) return 15_000
      if (haMs < 2 * 60_000) return 3_000
      if (haMs < 10 * 60_000) return 6_000
      return 10_000
    case 'incompleta':
      // Um aluno do grupo que nunca aparece não pode manter a sala inteira
      // perguntando a cada 6 s pela aula toda: afrouxa até o ritmo do pulso.
      if (haMs >= 15 * 60_000) return PULSO_EM_AULA_MS
      if (!visivel || haMs >= 5 * 60_000) return 15_000
      return 6_000
    case 'em_aula':
      return PULSO_EM_AULA_MS
  }
}

// ─── Qualidade adaptativa ──────────────────────────────────────────────

export interface NivelDeVideo {
  maxBitrate: number
  /** Divisor da resolução capturada (640x360). */
  escala: number
  maxFramerate: number
}

/** `null` = vídeo pausado, só áudio. */
export type Nivel = NivelDeVideo | null

export const CAPTURA_VIDEO = { largura: 640, altura: 360, fps: 24 } as const
export const AUDIO_MAX_BITRATE = 32_000

/**
 * Perfis conservadores. No grupo cada pessoa envia um vídeo POR PAR (malha),
 * então o teto por par é menor: com 4 pessoas, o monitor sobe 3 vídeos.
 */
export const NIVEIS: Record<'individual' | 'grupo', Nivel[]> = {
  individual: [
    { maxBitrate: 600_000, escala: 1, maxFramerate: 24 },
    { maxBitrate: 300_000, escala: 4 / 3, maxFramerate: 15 },
    { maxBitrate: 150_000, escala: 2, maxFramerate: 10 },
    null,
  ],
  grupo: [
    { maxBitrate: 300_000, escala: 4 / 3, maxFramerate: 15 },
    { maxBitrate: 180_000, escala: 2, maxFramerate: 12 },
    { maxBitrate: 100_000, escala: 8 / 3, maxFramerate: 8 },
    null,
  ],
}

/** No grupo o monitor é quem mais importa ver: um pouco mais no nível de entrada. */
export const BITRATE_MONITOR_GRUPO_N0 = 400_000

export const TELA = {
  individual: { maxBitrate: 1_200_000, maxFramerate: 5 },
  grupo: { maxBitrate: 500_000, maxFramerate: 5 },
} as const

/** Câmera enquanto a tela está compartilhada: miniatura. */
export const CAMERA_DURANTE_TELA = { maxBitrate: 150_000, escala: 2, maxFramerate: 10 } as const

export function nivelDeVideo(perfil: 'individual' | 'grupo', indice: number, papel: PapelNaSala): Nivel {
  const lista = NIVEIS[perfil]
  const nivel = lista[Math.min(lista.length - 1, Math.max(0, indice))]
  if (nivel && perfil === 'grupo' && indice === 0 && papel === 'monitor') return { ...nivel, maxBitrate: BITRATE_MONITOR_GRUPO_N0 }
  return nivel
}

export type Amostra = 'boa' | 'ruim' | 'neutra'

/**
 * Uma leitura do `getStats` vira boa, ruim ou neutra. Perda e atraso pesam mais
 * que banda: áudio picotado incomoda mais que imagem menor.
 */
export function classificarAmostra(s: {
  perda: number | null
  rttMs: number | null
  bitrateDisponivel: number | null
  limitadoPorBanda: boolean
  alvoBitrate: number
}): Amostra {
  const perda = s.perda ?? 0
  const rtt = s.rttMs ?? 0
  if (perda > 0.08 || rtt > 600 || s.limitadoPorBanda) return 'ruim'
  if (s.bitrateDisponivel !== null && s.bitrateDisponivel < s.alvoBitrate * 0.8) return 'ruim'
  const folgado = s.bitrateDisponivel === null || s.bitrateDisponivel > s.alvoBitrate * 1.6
  if (perda < 0.02 && rtt < 300 && folgado) return 'boa'
  return 'neutra'
}

export interface EstadoDeQualidade {
  nivel: number
  ruins: number
  boas: number
}

/** Amostras ruins seguidas para descer; boas seguidas para subir (a cada 2 s). */
export const RUINS_PARA_DESCER = 2
export const BOAS_PARA_SUBIR = 10
/**
 * O estimador de banda do WebRTC começa baixo e sobe nos primeiros segundos:
 * nesse aquecimento (e logo depois de cada troca de nível) a leitura não decide
 * nada, senão toda chamada nasceria rebaixada.
 */
export const AQUECIMENTO_MS = 10_000
export const ACOMODACAO_MS = 6_000

/** Desce rápido, sobe devagar: histerese para não ficar oscilando. */
export function proximaQualidade(e: EstadoDeQualidade, amostra: Amostra, nivelMaximo: number): EstadoDeQualidade {
  if (amostra === 'ruim') {
    const ruins = e.ruins + 1
    if (ruins >= RUINS_PARA_DESCER && e.nivel < nivelMaximo) return { nivel: e.nivel + 1, ruins: 0, boas: 0 }
    return { nivel: e.nivel, ruins, boas: 0 }
  }
  if (amostra === 'boa') {
    const boas = e.boas + 1
    if (boas >= BOAS_PARA_SUBIR && e.nivel > 0) return { nivel: e.nivel - 1, ruins: 0, boas: 0 }
    return { nivel: e.nivel, ruins: 0, boas }
  }
  return { nivel: e.nivel, ruins: 0, boas: e.boas }
}

/** O indicador de conexão (3 barras) a partir da última amostra e do nível. */
export function rotuloDeConexao(amostra: Amostra, nivel: number): 'boa' | 'instavel' | 'fraca' {
  if (nivel >= 2 || (amostra === 'ruim' && nivel >= 1)) return 'fraca'
  if (amostra === 'ruim' || nivel === 1) return 'instavel'
  return 'boa'
}

// ─── Reconexão ─────────────────────────────────────────────────────────

/** Espera depois de `disconnected` antes de reiniciar o ICE (muitas vezes volta sozinho). */
export const ESPERA_ANTES_DE_REINICIAR_MS = 3_000
/** Reinícios de ICE por par numa janela; depois, uma reconstrução e então botão manual. */
export const REINICIOS_MAXIMOS = 3
export const JANELA_DE_REINICIOS_MS = 2 * 60_000
export const PRAZO_NEGOCIACAO_MS = 20_000
export const PRAZO_COLETA_ICE_MS = 1_500

// ─── Rota ──────────────────────────────────────────────────────────────

/**
 * A tela da sala. Nela o "chrome" do app (menu, sino, player de música,
 * anúncios, convites) não monta: nada disso cabe numa aula, e cada um faz
 * requisições e toca som por conta própria.
 */
export function ehRotaDaSala(pathname: string | null | undefined): boolean {
  return !!pathname && /^\/monitorias\/reservas\/[a-fA-F0-9]{24}\/sala\/?$/.test(pathname)
}

/**
 * O atalho "Entrar na sala" das listas (calculado no navegador, sem requisição):
 * monitoria confirmada (ou recém-realizada) dentro da janela da sala.
 */
export function salaAbertaAgora(r: { status: string; inicio: string | Date | null; duracaoMin?: number | null; papel: PapelNaSala; agora?: number }): boolean {
  if (!r.inicio || !r.duracaoMin || (r.status !== 'confirmada' && r.status !== 'realizada')) return false
  const inicio = new Date(r.inicio)
  const { abreEm, fechaEm } = janelaDaSala(inicio, new Date(inicio.getTime() + r.duracaoMin * 60_000), r.papel)
  const agora = r.agora ?? Date.now()
  return agora >= abreEm.getTime() && agora <= fechaEm.getTime()
}

// ─── Presença para o suporte (disputas) ────────────────────────────────

export interface ResumoDePresenca {
  pid: string
  papel: PapelNaSala
  primeiraEntrada: Date
  ultimaAtividade: Date
  /** Minutos na sala, sem contar duas vezes os trechos com duas abas abertas. */
  minutos: number
  retransmitida: boolean
}

/** O registro mínimo, resumido por pessoa: quando entrou, até quando e por quanto tempo. */
export function resumirPresenca(registro: Array<{ pid: string; papel: PapelNaSala; entrou: Date | string; ate: Date | string; saiu?: Date | string; conexaoTipo?: string }>): ResumoDePresenca[] {
  const porPid = new Map<string, typeof registro>()
  for (const r of registro || []) porPid.set(r.pid, [...(porPid.get(r.pid) || []), r])
  const resumo: ResumoDePresenca[] = []
  for (const [pid, entradas] of porPid) {
    const trechos = entradas
      .map((e) => [new Date(e.entrou).getTime(), new Date(e.saiu ?? e.ate).getTime()] as [number, number])
      .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b) && b >= a)
      .sort((x, y) => x[0] - y[0])
    if (!trechos.length) continue
    let total = 0
    let [ini, fim] = trechos[0]
    for (const [a, b] of trechos.slice(1)) {
      if (a <= fim) fim = Math.max(fim, b)
      else {
        total += fim - ini
        ;[ini, fim] = [a, b]
      }
    }
    total += fim - ini
    resumo.push({
      pid,
      papel: entradas[0].papel,
      primeiraEntrada: new Date(trechos[0][0]),
      ultimaAtividade: new Date(Math.max(...trechos.map((t) => t[1]))),
      minutos: Math.round(total / 60_000),
      retransmitida: entradas.some((e) => e.conexaoTipo === 'retransmitida'),
    })
  }
  return resumo.sort((a, b) => (a.papel === b.papel ? a.primeiraEntrada.getTime() - b.primeiraEntrada.getTime() : a.papel === 'monitor' ? -1 : 1))
}
