import type { Exam } from '@/lib/types'
import { resolverJanelaDaProva, type JanelaDaProva } from './janela-da-prova'
import { RETOMADAS_PERMITIDAS } from './retomada'

/**
 * O que ESTA pessoa pode fazer nesta prova, agora.
 *
 * ## O que estava faltando
 *
 * O cartão de `/provas` decidia tudo a partir da janela e de um único dado
 * pessoal: se a pessoa tinha passado pelo portão. Isso basta para a maioria
 * dos casos e falha exatamente no caso mais delicado — quem entrou, saiu,
 * entrou de novo e esgotou a retomada.
 *
 * Para essa pessoa a janela diz "em andamento" (ela passou pelo portão a
 * tempo, e o portão fechado é um fato sobre os outros), então o cartão dizia
 * "Disponível" e oferecia "Realizar Prova". Só que a prova já acabou para ela:
 * não há retomada, o que estava gravado foi entregue, e o botão levava a uma
 * tela que não podia fazer nada. Prometer uma prova que não existe mais é pior
 * do que não mostrar botão nenhum.
 *
 * A janela responde "a prova está aberta?". Falta a outra metade: "e para
 * MIM?". As duas juntas moram aqui, e as duas telas — o catálogo e a tela da
 * prova — leem a mesma resposta, para não voltarem a discordar.
 */

/** O que o servidor sabe sobre esta pessoa nesta prova. */
export interface EstadoDoAluno {
  /** Passou pelo portão enquanto ele estava aberto. */
  jaEntrou?: boolean
  /** Já entregou (há submissão registrada). */
  jaEntregou?: boolean
  /** Tem rascunho gravado (começou a responder). */
  temRascunho?: boolean
  /** Quantas retomadas já consumiu. */
  retomadasUsadas?: number
}

export type AcaoDoAluno =
  /** Prova de treino ou pessoal: entra e faz, quantas vezes quiser. */
  | 'praticar'
  /** Pode começar a prova agora. */
  | 'fazer'
  /** Começou, caiu, e ainda tem retomada. */
  | 'retomar'
  /** O portão abriu e a prova ainda não começou: dá para esperar lá dentro. */
  | 'entrar-na-sala'
  /** Acabou para esta pessoa (entregou, ou não tem mais como continuar). */
  | 'ver-resultado'
  /** Não dá para fazer nada: fora do público, portão fechado sem ter entrado. */
  | 'indisponivel'
  /** A prova ainda vai abrir. */
  | 'aguardar'

export interface VereditoDoAluno {
  acao: AcaoDoAluno
  /** O texto do botão. */
  rotulo: string
  /** Uma frase curta para o cartão, quando há algo a explicar. `null` quando é óbvio. */
  detalhe: string | null
  /** O botão leva a algum lugar? */
  clicavel: boolean
  /** A prova acabou para esta pessoa (entregue ou sem como continuar). */
  encerradaParaMim: boolean
  /** O portão está fechado para quem ainda não entrou. */
  portaoFechado: boolean
}

/**
 * A prova acabou para esta pessoa?
 *
 * Duas maneiras de acabar: entregar, ou ficar sem retomada com um rascunho
 * gravado — a segunda entrega sozinha (ver `exigeEntregaAutomatica` em
 * `retomada.ts`), então as duas terminam no mesmo lugar.
 */
function acabouParaMim(estado: EstadoDoAluno): boolean {
  if (estado.jaEntregou) return true
  return !!estado.temRascunho && (estado.retomadasUsadas ?? 0) >= RETOMADAS_PERMITIDAS
}

export function resolverAcaoDoAluno(
  prova: Partial<Exam> | null | undefined,
  estado: EstadoDoAluno = {},
  agora: Date = new Date(),
): VereditoDoAluno {
  const janela: JanelaDaProva = resolverJanelaDaProva(prova, agora, { jaEntrou: estado.jaEntrou })

  if (janela.fase === 'livre') {
    return {
      acao: 'praticar',
      rotulo: prova?.isPracticeExam ? 'Praticar' : 'Fazer prova',
      detalhe: null,
      clicavel: true,
      encerradaParaMim: false,
      portaoFechado: false,
    }
  }

  const portaoFechado = !janela.podeEntrar && !janela.encerrada

  /*
   * "Acabou para mim" vem ANTES da janela.
   *
   * Quem entregou — ou esgotou a retomada, o que entrega sozinho — não tem
   * mais prova a fazer, mesmo que ela continue aberta para a turma. Era esta
   * a ordem que faltava: a janela dizia "em andamento" e o cartão oferecia
   * "Realizar Prova" para quem já não tinha o que realizar.
   */
  if (acabouParaMim(estado)) {
    return {
      acao: 'ver-resultado',
      rotulo: janela.encerrada ? 'Ver resultados' : 'Ver minhas respostas',
      detalhe: estado.jaEntregou
        ? 'Você já entregou esta prova.'
        : 'Suas respostas foram entregues — você não tinha mais retomadas.',
      clicavel: true,
      encerradaParaMim: true,
      portaoFechado,
    }
  }

  if (janela.encerrada) {
    return {
      acao: 'ver-resultado',
      rotulo: 'Ver resultados',
      detalhe: null,
      clicavel: true,
      encerradaParaMim: true,
      portaoFechado: false,
    }
  }

  if (janela.fase === 'antes-do-portao') {
    return {
      acao: 'aguardar',
      rotulo: 'Aguardando',
      detalhe: janela.motivo,
      clicavel: false,
      encerradaParaMim: false,
      portaoFechado: false,
    }
  }

  if (janela.fase === 'portao-fechado' && !janela.podeIniciar) {
    return {
      acao: 'indisponivel',
      rotulo: 'Portões fechados',
      detalhe: janela.motivo,
      clicavel: false,
      encerradaParaMim: false,
      portaoFechado: true,
    }
  }

  // Daqui para baixo a pessoa pode entrar ou continuar. Ter rascunho gravado
  // é o que separa "começar" de "voltar".
  const voltando = !!estado.temRascunho

  if (janela.fase === 'sala-de-espera') {
    return {
      acao: 'entrar-na-sala',
      rotulo: voltando ? 'Voltar para a sala' : 'Entrar na sala',
      detalhe: 'A prova abre no horário marcado.',
      clicavel: true,
      encerradaParaMim: false,
      portaoFechado,
    }
  }

  return {
    acao: voltando ? 'retomar' : 'fazer',
    rotulo: voltando ? 'Retomar prova' : 'Realizar prova',
    /*
     * Quem já está dentro precisa saber que o portão fechou — não para ser
     * barrado, mas porque é a diferença entre "posso sair e voltar" e "esta é
     * a minha última entrada". Sem a frase, a pessoa fecha a aba achando que
     * volta quando quiser.
     */
    detalhe: portaoFechado
      ? 'Os portões já fecharam. Você entrou a tempo e pode continuar.'
      : null,
    clicavel: true,
    encerradaParaMim: false,
    portaoFechado,
  }
}
