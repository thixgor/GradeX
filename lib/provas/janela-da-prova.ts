import type { Exam } from '@/lib/types'

/**
 * A janela de tempo de uma prova — portões, início e término — num lugar só.
 *
 * ## O problema que isto resolve
 *
 * `gatesOpen` e `gatesClose` existiam no documento da prova, apareciam no
 * formulário do admin e viravam um selo ("Portões fechados") na lista de
 * `/provas`. E era só isso: a tela da prova (`/exam/[id]`) nunca os leu, e a
 * rota de entrega (`POST /api/exams/[id]/submit`) checava apenas `endTime`.
 * Quem digitasse o endereço da prova entrava com os portões fechados — o
 * cadeado estava desenhado na porta, não instalado nela.
 *
 * Havia ainda três relógios discordando: a lista decidia uma coisa, a tela da
 * prova outra (`now >= startTime`, ignorando portões) e o servidor uma terceira
 * (só `endTime`). Este arquivo é o único relógio, e ele é puro — o cliente usa
 * para desenhar, o servidor usa para decidir.
 *
 * ## O que cada marco significa
 *
 * Os quatro momentos formam duas janelas encaixadas, como num vestibular:
 *
 *   portão abre ──── prova começa ──── prova termina ──── portão fecha
 *        └──────── quem pode ENTRAR ────────┘
 *                       └──── quem pode RESPONDER ────┘
 *
 *  - **Portão aberto** (`gatesOpen`): a sala de espera abre. A pessoa entra,
 *    assina, confere os dados — e espera. Ainda não há prova para responder.
 *  - **Início** (`startTime`): a prova começa. Quem está na sala de espera
 *    passa a poder iniciar.
 *  - **Término** (`endTime`): acabou. Ninguém mais responde nem entrega.
 *  - **Portão fechado** (`gatesClose`): o atraso máximo tolerado para ENTRAR.
 *    Fechar o portão não expulsa quem já está dentro — quem entrou antes
 *    continua respondendo até o término. É por isso que `gatesClose` não é o
 *    fim da prova: é o fim da entrada.
 *
 * Portões são opcionais. Sem eles a entrada segue a própria prova
 * (`gatesOpen = startTime`, `gatesClose = endTime`), que é o comportamento de
 * todas as provas criadas antes desta funcionalidade.
 *
 * ## Prova de treino e prova pessoal
 *
 * Nascem com `endTime` um ano à frente só para liberar o acesso. Não têm
 * janela: `fase` é `'livre'` e tudo é permitido, sempre.
 */

export type FaseDaProva =
  /** Sem janela: prova de treino ou pessoal. */
  | 'livre'
  /** Antes do portão abrir — nem a sala de espera existe ainda. */
  | 'antes-do-portao'
  /** Portão aberto, prova ainda não começou: dá para entrar e esperar. */
  | 'sala-de-espera'
  /** Prova em andamento e portão ainda aberto: dá para entrar e começar. */
  | 'em-andamento'
  /** Prova em andamento, portão fechado: quem está dentro continua; ninguém entra. */
  | 'portao-fechado'
  /** Passou do término. */
  | 'encerrada'

export interface JanelaDaProva {
  fase: FaseDaProva
  /** Instantes já normalizados (portões caem para a própria prova quando ausentes). */
  abrePortaoEm: Date | null
  fechaPortaoEm: Date | null
  comecaEm: Date | null
  terminaEm: Date | null
  /** Pode abrir a tela da prova / a sala de espera. */
  podeEntrar: boolean
  /** Pode clicar em "Iniciar prova" agora. */
  podeIniciar: boolean
  /** Pode enviar respostas. Fechar o portão não impede quem já está dentro. */
  podeEnviar: boolean
  /** A prova já acabou para todo mundo (libera gabarito, resultados, ranking). */
  encerrada: boolean
  /** Frase pronta para a tela, quando algo está bloqueado. */
  motivo: string | null
}

/** Prova sem janela de tempo: treino do próprio aluno ou prova pessoal. */
export function eProvaSemJanela(prova: Partial<Exam> | null | undefined): boolean {
  return !!(prova?.isPracticeExam || prova?.isPersonalExam)
}

function paraData(valor: unknown): Date | null {
  if (!valor) return null
  const data = valor instanceof Date ? valor : new Date(valor as string)
  return Number.isFinite(data.getTime()) ? data : null
}

/**
 * O fim da prova. Sempre `endTime` — `gatesClose` é o fim da ENTRADA, não o da
 * prova, e usá-lo como término encerrava a prova (e liberava o gabarito) para
 * quem ainda estava respondendo legitimamente.
 */
export function fimDaProva(prova: Partial<Exam> | null | undefined): Date | null {
  return paraData(prova?.endTime)
}

export function resolverJanelaDaProva(
  prova: Partial<Exam> | null | undefined,
  agora: Date = new Date(),
): JanelaDaProva {
  const livre: JanelaDaProva = {
    fase: 'livre',
    abrePortaoEm: null,
    fechaPortaoEm: null,
    comecaEm: null,
    terminaEm: null,
    podeEntrar: true,
    podeIniciar: true,
    podeEnviar: true,
    encerrada: false,
    motivo: null,
  }

  if (!prova) return livre
  if (eProvaSemJanela(prova)) return livre

  const comecaEm = paraData(prova.startTime)
  const terminaEm = paraData(prova.endTime)

  // Prova avaliativa sem datas não deveria existir (a API exige as duas), mas um
  // documento antigo sem elas não pode virar uma prova trancada para sempre.
  if (!comecaEm || !terminaEm) return livre

  const abrePortaoEm = paraData(prova.gatesOpen) ?? comecaEm
  const fechaPortaoEm = paraData(prova.gatesClose) ?? terminaEm

  const t = agora.getTime()
  const encerrada = t > terminaEm.getTime()
  const portaoAberto = t >= abrePortaoEm.getTime() && t <= fechaPortaoEm.getTime()
  const comecou = t >= comecaEm.getTime()

  let fase: FaseDaProva
  if (encerrada) fase = 'encerrada'
  else if (t < abrePortaoEm.getTime()) fase = 'antes-do-portao'
  else if (!comecou) fase = 'sala-de-espera'
  else if (portaoAberto) fase = 'em-andamento'
  else fase = 'portao-fechado'

  const podeEntrar = !encerrada && portaoAberto
  const podeIniciar = podeEntrar && comecou
  // Quem já está respondendo entrega até o término, mesmo com o portão fechado.
  const podeEnviar = !encerrada && comecou

  return {
    fase,
    abrePortaoEm,
    fechaPortaoEm,
    comecaEm,
    terminaEm,
    podeEntrar,
    podeIniciar,
    podeEnviar,
    encerrada,
    motivo: motivoDaFase(fase),
  }
}

export function motivoDaFase(fase: FaseDaProva): string | null {
  switch (fase) {
    case 'antes-do-portao':
      return 'Os portões ainda não abriram para esta prova.'
    case 'portao-fechado':
      return 'Os portões desta prova já fecharam — não é mais possível entrar.'
    case 'encerrada':
      return 'Esta prova já foi encerrada.'
    default:
      return null
  }
}

export const ROTULO_DA_FASE: Record<FaseDaProva, string> = {
  livre: 'Disponível',
  'antes-do-portao': 'Portões fechados',
  'sala-de-espera': 'Portões abertos',
  'em-andamento': 'Em andamento',
  'portao-fechado': 'Portões fechados',
  encerrada: 'Encerrada',
}

/**
 * O prazo pessoal de quem está respondendo.
 *
 * Uma prova pode ter duração própria (`duration`, em minutos) menor que a
 * janela: 3h de janela para uma prova de 90 minutos, e cada aluno tem 90
 * minutos a partir de quando começou. O prazo é o que vier primeiro entre o
 * término da prova e o fim da duração individual.
 *
 * `iniciadaEm` vem do servidor (o registro de progresso), não do relógio do
 * navegador — senão recarregar a página com o `localStorage` limpo devolveria
 * a duração inteira.
 */
export function prazoDeEntrega(
  prova: Partial<Exam> | null | undefined,
  iniciadaEm: Date | null | undefined,
): Date | null {
  const fim = fimDaProva(prova)
  const duracaoMin = Number(prova?.duration)
  const inicio = paraData(iniciadaEm)

  if (!inicio || !Number.isFinite(duracaoMin) || duracaoMin <= 0) return fim

  const prazoIndividual = new Date(inicio.getTime() + duracaoMin * 60_000)
  if (!fim) return prazoIndividual
  return prazoIndividual.getTime() < fim.getTime() ? prazoIndividual : fim
}
