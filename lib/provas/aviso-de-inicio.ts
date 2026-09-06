import type { FaseDaProva } from '@/lib/provas/janela-da-prova'

/**
 * O aviso de que a prova começou, para quem está esperando por ele.
 *
 * ## O que estava errado
 *
 * A sala de espera avisava o início com um `Toast`: um retângulo de 320px no
 * CANTO SUPERIOR DIREITO, que some sozinho em cinco segundos. Quem espera vinte
 * minutos por uma prova não fica olhando o canto da tela — olha a contagem
 * regressiva, o celular, a porta da sala. O aviso aparecia e ia embora enquanto
 * ninguém olhava, e o que ficava na tela era um botão verde parecido com os
 * outros, muitas vezes fora da dobra: num tablet em retrato, com a assinatura e
 * o painel de portões acima dele, "Iniciar Prova Agora" fica ABAIXO do fim da
 * tela. A pessoa precisava rolar para descobrir que a prova já tinha começado —
 * e ela não tinha nenhum motivo para rolar.
 *
 * Perder minutos de prova por não ter visto um toast é perder nota por um
 * detalhe de layout.
 *
 * Este módulo é a decisão, separada da tela: QUANDO avisar, e o que ainda falta
 * para a pessoa poder começar de dentro do próprio aviso. A tela desenha; aqui
 * mora a regra, que é testável sem navegador.
 */

/** Onde a pessoa está enquanto o relógio não chega no início. */
export interface SituacaoDaEspera {
  /** Está na sala de espera (a tela que só existe antes de a prova começar). */
  naSalaDeEspera: boolean
  /** A fase da janela da prova, como a tela a enxerga agora. */
  fase: FaseDaProva | null | undefined
  /** A prova já pode ser iniciada agora (`janela.podeIniciar`). */
  liberada: boolean
}

/**
 * A pessoa está esperando o início.
 *
 * São duas telas, não uma: a sala de espera (quem clicou em "Entrar na Sala") e
 * a tela de entrada com o portão aberto antes do início (quem abriu o endereço
 * da prova e ficou lendo os dados). Nas duas o botão diz "aguarde" e nas duas o
 * início chega sem nenhum anúncio — então as duas recebem o aviso.
 *
 * Quem já pode começar não está esperando: para essa pessoa não há transição
 * nenhuma a anunciar.
 */
export function estaEsperandoOInicio(situacao: SituacaoDaEspera): boolean {
  if (situacao.liberada) return false
  return situacao.naSalaDeEspera || situacao.fase === 'sala-de-espera'
}

/** O que a tela precisa saber para decidir se abre o aviso. */
export interface GatilhoDoAviso {
  /** A pessoa estava esperando o início (agora ou em algum instante anterior). */
  estavaEsperando: boolean
  /** A prova já pode ser iniciada. */
  liberada: boolean
  /** Esta pessoa já está respondendo. */
  emAndamento: boolean
  /** Esta pessoa já entregou esta prova. */
  jaEntregou: boolean
  /** O aviso já apareceu uma vez nesta visita à tela. */
  jaAvisado: boolean
}

/**
 * Abrir o aviso é uma TRANSIÇÃO, não um estado.
 *
 * Ele existe para contar uma novidade — "acabou de liberar" — e por isso só
 * vale para quem estava do outro lado dela. Quem abre a página com a prova já
 * em andamento não recebe nada: para essa pessoa nada mudou, e um modal na
 * frente da tela seria só um obstáculo entre ela e o botão.
 *
 * `jaAvisado` é o que impede o aviso de voltar depois de fechado. Sem ele, a
 * condição continuaria verdadeira a cada segundo (a janela é recalculada a cada
 * tique do relógio) e o modal reapareceria por cima da assinatura, da prova,
 * do termo de monitoramento — para sempre.
 */
export function deveAvisarQueLiberou(gatilho: GatilhoDoAviso): boolean {
  if (gatilho.jaAvisado) return false
  if (gatilho.emAndamento || gatilho.jaEntregou) return false
  if (!gatilho.liberada) return false
  return gatilho.estavaEsperando
}

/** O que falta para esta pessoa poder começar. */
export type MotivoDePendencia = 'retomada-esgotada' | 'nome' | 'frase-tema' | 'assinatura'

export interface PendenciaParaIniciar {
  motivo: MotivoDePendencia
  /** A frase do aviso: o que falta, em uma linha. */
  descricao: string
  /** O rótulo do botão que leva até o campo. */
  rotuloDoBotao: string
  /**
   * O `id` do elemento na tela para onde levar a pessoa, ou `null` quando não
   * há nada a fazer (a retomada esgotada não tem campo para preencher).
   */
  alvo: string | null
}

/** Os `id`s dos campos, para o aviso levar a pessoa até eles. */
export const ALVO_DO_NOME = 'userName'
/** O botão de iniciar — o destino de quem fecha o aviso para conferir a tela. */
export const ALVO_DO_BOTAO_INICIAR = 'botao-iniciar-prova'
export const ALVO_DA_FRASE_TEMA = 'theme'
export const ALVO_DA_ASSINATURA = 'campo-assinatura'

export interface EstadoDoFormulario {
  exigeAssinatura: boolean
  assinou: boolean
  nome: string
  fraseTema?: string | null
  transcricaoDaFrase: string
  /** Há progresso gravado que não pode mais ser retomado. */
  retomadaBloqueia: boolean
  mensagemDaRetomada?: string | null
}

/**
 * O aviso não pode virar um botão que não funciona.
 *
 * "Iniciar prova agora" dentro do modal passa pelas MESMAS condições do botão
 * da tela (`handleStartExam` recusa sem assinatura e sem retomada disponível).
 * Se alguma delas falta, o aviso não some com um erro: ele diz o que falta e
 * leva a pessoa até o campo — que é justamente o que ela não estava vendo, já
 * que o problema todo é a tela ser mais alta que o tablet.
 *
 * A ordem é a ordem da tela, de cima para baixo: nome, frase-tema, assinatura.
 * A retomada esgotada vem antes de todas porque nenhuma delas resolveria nada.
 */
export function pendenciaParaIniciar(estado: EstadoDoFormulario): PendenciaParaIniciar | null {
  if (estado.retomadaBloqueia) {
    return {
      motivo: 'retomada-esgotada',
      descricao:
        estado.mensagemDaRetomada?.trim() ||
        'Esta prova já foi iniciada e não pode ser reiniciada.',
      rotuloDoBotao: 'Entendi',
      alvo: null,
    }
  }

  if (!estado.nome.trim()) {
    return {
      motivo: 'nome',
      descricao: 'Preencha seu nome completo para iniciar.',
      rotuloDoBotao: 'Ir para o nome',
      alvo: ALVO_DO_NOME,
    }
  }

  if (estado.fraseTema && !estado.transcricaoDaFrase.trim()) {
    return {
      motivo: 'frase-tema',
      descricao: 'Transcreva a frase-tema para iniciar.',
      rotuloDoBotao: 'Ir para a frase-tema',
      alvo: ALVO_DA_FRASE_TEMA,
    }
  }

  if (estado.exigeAssinatura && !estado.assinou) {
    return {
      motivo: 'assinatura',
      descricao: 'Assine no campo de assinatura para iniciar.',
      rotuloDoBotao: 'Ir para a assinatura',
      alvo: ALVO_DA_ASSINATURA,
    }
  }

  return null
}
