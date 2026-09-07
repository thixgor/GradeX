import type { Exam } from '@/lib/types'
import {
  eProvaSemJanela,
  resolverJanelaDaProva,
  type FaseDaProva,
  type JanelaDaProva,
} from './janela-da-prova'

/**
 * A prova acontecendo, vista do painel do admin.
 *
 * ## O que faltava
 *
 * Enquanto uma prova com portão acontece, o admin tinha duas telas — e nenhuma
 * delas respondia às perguntas da hora. `/admin/exams` mostra a agenda (os
 * quatro horários) e o selo da fase; o relatório (`/admin/exams/[id]/relatorio`)
 * mostra o resultado, que só existe depois. No meio dos dois — que é
 * justamente a hora em que a sala está cheia — o painel era cego:
 *
 *  - quantos já passaram pelo portão? (o portão fecha às 13h50; às 13h45 essa
 *    pergunta decide se o admin adia o fechamento);
 *  - quem assinou? (a assinatura é condição para iniciar, e descobrir que
 *    alguém não assinou depois da prova não conserta nada);
 *  - quem já começou, e onde cada um está?
 *
 * Este arquivo é a lógica dessas respostas, separada de onde os dados moram
 * (Mongo) e de onde eles aparecem (React). Ele é puro: o servidor usa para
 * montar o retrato, o painel usa para classificar e ordenar, e o teste usa sem
 * banco nem navegador.
 *
 * ## Por que "ao vivo" aqui NÃO é WebSocket
 *
 * A plataforma roda na Vercel, cobrada por invocação e por duração. Uma conexão
 * aberta por prova em andamento é uma função viva o tempo todo; o monitoramento
 * por vídeo (`/admin/proctoring`) precisa disso e paga o preço, mas aqui a
 * pergunta é outra — "em que questão essa pessoa está?" — e a resposta só muda
 * quando o rascunho do aluno é gravado, o que acontece a cada
 * `INTERVALO_DE_GRAVACAO_MS` (12 s). Ler mais rápido que isso é gastar
 * invocação para receber o mesmo retrato.
 *
 * Então o painel PERGUNTA, num ritmo que a fase da prova define
 * (`cadenciaDoRetrato`), e não pergunta nada quando não há o que mudar: antes
 * do portão abrir ninguém pode entrar, e depois do término ninguém pode
 * responder. Nas duas pontas a cadência é `null` — zero invocação.
 */

/** Teto de linhas por retrato. Uma prova gigante não pode virar um payload gigante. */
export const LIMITE_DE_PARTICIPANTES = 500

/**
 * Silêncio tolerado antes de alguém deixar de ser "respondendo".
 *
 * O rascunho é gravado a cada 12 s. Um único envio perdido (rede do celular,
 * aba escondida por um instante) não pode virar "parado" no painel — seria um
 * alarme falso a cada minuto, para toda a turma. Cinco gravações de folga é o
 * que separa uma falha de transmissão de uma pessoa que de fato parou.
 */
export const LIMIAR_ATIVO_MS = 60_000

/** A partir daqui a pessoa não está só com a rede ruim: ela sumiu. */
export const LIMIAR_SUMIU_MS = 5 * 60_000

export type EstadoNaProva =
  /** Passou pelo portão e ainda não começou a responder. */
  | 'na-sala'
  /** Gravou progresso agora há pouco. */
  | 'respondendo'
  /** Começou, mas o rascunho não anda há alguns minutos. */
  | 'parado'
  /** Começou e não dá sinal há bastante tempo. */
  | 'sumiu'
  /** Entregou. */
  | 'entregou'

export const ROTULO_DO_ESTADO: Record<EstadoNaProva, string> = {
  'na-sala': 'Na sala de espera',
  respondendo: 'Respondendo',
  parado: 'Parado',
  sumiu: 'Sem sinal',
  entregou: 'Entregou',
}

/** A questão em que a pessoa está, na ordem em que ELA vê a prova. */
export interface QuestaoAtualAoVivo {
  /** Índice 0-based dentro da ordem desta pessoa. */
  indice: number
  /** O número que ela lê na tela — `indice + 1`, e não `question.number`. */
  numero: number
  /** Id da questão. É o que liga este retrato ao documento da prova. */
  questaoId: string | null
  /** Id da alternativa marcada, quando há. Id e não letra: a letra embaralha. */
  marcada: string | null
  /** Há texto escrito (discursiva ou redação) nesta questão. */
  escreveu: boolean
}

/** Uma pessoa nesta prova, agora. */
export interface ParticipanteAoVivo {
  userId: string
  /** O nome da conta. */
  nome: string
  email: string
  /**
   * O nome que a pessoa declarou na prova.
   *
   * Só difere do nome da conta quando a prova permite nome personalizado
   * (`allowCustomName`) — e é justamente aí que o admin precisa dos dois lado
   * a lado, porque a folha de presença é assinada com este.
   */
  nomeDeclarado: string | null
  /** Instante em que o servidor autorizou a passagem pelo portão. */
  entrouEm: string | null
  /** Há assinatura digital gravada para esta pessoa nesta prova. */
  assinou: boolean
  assinadoEm: string | null
  /** Transcreveu a frase-tema, quando a prova pede uma. */
  transcreveu: boolean
  /** Primeira gravação de rascunho — o começo real da prova para ela. */
  iniciouEm: string | null
  /** Última gravação de rascunho. É o batimento cardíaco desta pessoa. */
  ultimoSinalEm: string | null
  entregouEm: string | null
  respondidas: number
  totalQuestoes: number
  retomadasUsadas: number
  questaoAtual: QuestaoAtualAoVivo | null
}

export interface ResumoAoVivo {
  /** Passaram pelo portão. */
  entraram: number
  assinaram: number
  /** Têm rascunho gravado — ou seja, começaram a prova de fato. */
  comecaram: number
  respondendo: number
  parados: number
  sumiram: number
  entregaram: number
  /** Entraram e ainda não começaram. */
  naSala: number
}

/** O retrato completo que a rota devolve e o painel desenha. */
export interface RetratoAoVivo {
  provaId: string
  /** O relógio do SERVIDOR no instante do retrato. */
  agora: string
  /**
   * A prova EXIGE assinatura para iniciar (`requireSignature` verdadeiro).
   *
   * Separado de `assinaturaDisponivel` porque são perguntas diferentes, e
   * juntá-las produzia um alarme falso: numa prova em que assinar é opcional,
   * um único booleano marcaria a turma inteira como "sem assinatura" — um
   * aviso vermelho sobre gente que não fez nada de errado.
   */
  assinaturaObrigatoria: boolean
  /** O campo de assinatura aparece na tela do aluno (`requireSignature !== false`). */
  assinaturaDisponivel: boolean
  pedeFraseTema: boolean
  permiteNomeProprio: boolean
  totalQuestoes: number
  janela: JanelaDaProva
  participantes: ParticipanteAoVivo[]
  resumo: ResumoAoVivo
  /** O teto de linhas foi atingido — há mais gente do que o retrato mostra. */
  truncado: boolean
}

/**
 * Esta prova tem andamento para acompanhar?
 *
 * Prova de treino e prova pessoal não têm: são feitas a qualquer hora, quantas
 * vezes a pessoa quiser, e não guardam rascunho no servidor
 * (`app/exam/[id]/page.tsx` pula a gravação para elas). Um painel "ao vivo"
 * para uma prova assim mostraria uma lista permanentemente vazia.
 */
export function provaAcompanhavel(prova: Partial<Exam> | null | undefined): boolean {
  if (!prova) return false
  if (eProvaSemJanela(prova)) return false
  return resolverJanelaDaProva(prova).fase !== 'livre'
}

/**
 * Esta prova tem sala de espera de verdade?
 *
 * Ter portão não basta: `resolverJanelaDaProva` normaliza a prova sem portão
 * próprio para `gatesOpen = startTime`, e nessa montagem a "sala de espera"
 * dura zero segundo — quem entra já pode começar. A sala existe quando o
 * portão abre ANTES do início, que é a montagem de vestibular: portão às 13h,
 * prova às 14h.
 */
export function temSalaDeEspera(prova: Partial<Exam> | null | undefined): boolean {
  if (!provaAcompanhavel(prova)) return false
  const janela = resolverJanelaDaProva(prova)
  if (!janela.abrePortaoEm || !janela.comecaEm) return false
  return janela.abrePortaoEm.getTime() < janela.comecaEm.getTime()
}

function ms(valor: string | null | undefined): number | null {
  if (!valor) return null
  const t = new Date(valor).getTime()
  return Number.isFinite(t) ? t : null
}

/**
 * Em que pé esta pessoa está.
 *
 * A ordem das perguntas é a ordem dos fatos: entregar encerra tudo; ter
 * rascunho significa ter começado; não ter rascunho significa estar esperando.
 * O silêncio só é lido para quem começou — quem está na sala de espera não
 * grava nada, e medir o batimento de quem não tem batimento marcaria a sala
 * inteira como "sumiu".
 */
export function estadoDoParticipante(
  participante: Pick<ParticipanteAoVivo, 'entregouEm' | 'iniciouEm' | 'ultimoSinalEm'>,
  agora: number = Date.now(),
): EstadoNaProva {
  if (participante.entregouEm) return 'entregou'
  if (!participante.iniciouEm) return 'na-sala'

  const sinal = ms(participante.ultimoSinalEm) ?? ms(participante.iniciouEm)
  if (sinal === null) return 'parado'

  const silencio = agora - sinal
  if (silencio <= LIMIAR_ATIVO_MS) return 'respondendo'
  if (silencio <= LIMIAR_SUMIU_MS) return 'parado'
  return 'sumiu'
}

export function resumoDoAcompanhamento(
  participantes: readonly ParticipanteAoVivo[],
  agora: number = Date.now(),
): ResumoAoVivo {
  const resumo: ResumoAoVivo = {
    entraram: 0,
    assinaram: 0,
    comecaram: 0,
    respondendo: 0,
    parados: 0,
    sumiram: 0,
    entregaram: 0,
    naSala: 0,
  }

  for (const p of participantes) {
    if (p.entrouEm) resumo.entraram += 1
    if (p.assinou) resumo.assinaram += 1
    if (p.iniciouEm) resumo.comecaram += 1

    switch (estadoDoParticipante(p, agora)) {
      case 'respondendo':
        resumo.respondendo += 1
        break
      case 'parado':
        resumo.parados += 1
        break
      case 'sumiu':
        resumo.sumiram += 1
        break
      case 'entregou':
        resumo.entregaram += 1
        break
      case 'na-sala':
        resumo.naSala += 1
        break
    }
  }

  return resumo
}

/** Peso de cada estado na lista: o que exige atenção primeiro. */
const PRIORIDADE: Record<EstadoNaProva, number> = {
  respondendo: 0,
  parado: 1,
  sumiu: 2,
  'na-sala': 3,
  entregou: 4,
}

/**
 * A ordem da lista.
 *
 * Alfabética seria estável e inútil: numa turma de 60, quem está com problema
 * (parado, sem sinal) fica espalhado entre os que vão bem. Aqui o estado manda,
 * e dentro do mesmo estado o nome desempata — para a linha de alguém não pular
 * de lugar entre dois retratos só porque respondeu mais uma questão.
 */
export function ordenarParticipantes(
  participantes: readonly ParticipanteAoVivo[],
  agora: number = Date.now(),
): ParticipanteAoVivo[] {
  return [...participantes].sort((a, b) => {
    const pesoA = PRIORIDADE[estadoDoParticipante(a, agora)]
    const pesoB = PRIORIDADE[estadoDoParticipante(b, agora)]
    if (pesoA !== pesoB) return pesoA - pesoB
    return (a.nomeDeclarado || a.nome || '').localeCompare(b.nomeDeclarado || b.nome || '', 'pt-BR')
  })
}

/**
 * De quanto em quanto tempo vale a pena pedir um retrato novo.
 *
 * `null` significa NÃO PERGUNTAR — e é a decisão mais importante deste
 * arquivo, porque cada volta do relógio é uma invocação cobrada.
 *
 *  - **antes do portão**: ninguém pode entrar, então nada pode mudar. O painel
 *    mostra a contagem regressiva (que corre no navegador, de graça) e busca
 *    UM retrato quando o portão abre.
 *  - **encerrada**: ninguém pode responder. O último retrato já é o final.
 *  - **sala de espera / portão fechado**: o que muda é gente entrando e
 *    assinando — gestos humanos, de dezenas de segundos. 20 s.
 *  - **em andamento**: o rascunho é gravado a cada 12 s; 15 s alcança cada
 *    gravação sem perguntar duas vezes pela mesma.
 *
 * Sem ninguém respondendo, a prova em andamento cai para o ritmo da espera:
 * uma sala vazia não fica menos vazia por ser consultada de 15 em 15 segundos.
 */
export function cadenciaDoRetrato(fase: FaseDaProva, temGenteRespondendo: boolean): number | null {
  switch (fase) {
    case 'antes-do-portao':
    case 'encerrada':
    case 'livre':
      return null
    case 'em-andamento':
      return temGenteRespondendo ? 15_000 : 20_000
    case 'sala-de-espera':
    case 'portao-fechado':
      return 20_000
    default:
      return 20_000
  }
}

/**
 * O recuo depois de uma falha.
 *
 * Uma rota que responde 500 responde 500 de novo em 15 segundos, e um painel
 * esquecido aberto numa aba transformaria uma falha em milhares de invocações
 * cobradas. Dobra até o teto de dois minutos.
 */
export function esperaComRecuo(falhasSeguidas: number, base: number): number {
  const passos = Math.min(3, Math.max(0, falhasSeguidas - 1))
  return Math.min(120_000, base * 2 ** (passos + 1))
}
