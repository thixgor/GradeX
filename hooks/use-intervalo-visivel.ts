'use client'

import { useEffect, useRef } from 'react'

/**
 * O mínimo do documento e da janela de que o agendamento precisa. Existe para a
 * política abaixo poder ser testada sem DOM — ela é o que decide o gasto, e
 * verificá-la não deveria depender de montar um componente.
 */
export interface AmbienteDeAgendamento {
  visivel: () => boolean
  ouvirVisibilidade: (ouvinte: () => void) => () => void
  agendar: (acao: () => void, intervaloMs: number) => number
  cancelar: (id: number) => void
  /** Relógio, para `soSeVencido`. Padrão: `Date.now`. */
  agora?: () => number
}

export interface OpcoesDeAgendamento {
  /**
   * Ao voltar para a aba, só roda na hora se o intervalo já tiver vencido
   * desde a última execução. Serve ao polling do app inteiro (notificações,
   * checagem de banimento): quem alterna de aba a cada minuto não pode virar
   * uma requisição por minuto onde antes eram três por hora. A contagem
   * começa no agendamento, que acontece logo depois da carga inicial.
   */
  soSeVencido?: boolean
}

/**
 * Repete `acao` a cada `intervaloMs`, mas só enquanto a aba está visível.
 * Devolve a função que desfaz tudo.
 *
 * ## O que isto conserta
 *
 * Um painel que se atualiza sozinho é útil enquanto alguém olha para ele. Numa
 * aba de fundo — minimizada, esquecida no fim de semana — cada volta do relógio
 * é uma invocação paga para repintar uma tela que ninguém está vendo.
 *
 * As telas de aluno já faziam essa conta (ver `components/support-chat.tsx` e
 * `app/provas/page.tsx`). As de admin não faziam, e são justamente as que ficam
 * abertas o dia inteiro: uma aba de tickets esquecida aberta, com uma conversa
 * selecionada, são mais de onze mil requisições por dia — mais do que o público
 * inteiro do site gera no mesmo período.
 *
 * ## Como se comporta
 *
 * O relógio é **desligado** quando a aba sai de vista, e não apenas ignorado:
 * um `setInterval` vivo continua acordando a thread, e o navegador só o limita
 * a uma volta por minuto. Ao voltar, a ação roda **na hora** e o relógio
 * recomeça — quem retorna à aba encontra o painel já atualizado, em vez de
 * esperar o próximo ciclo. Na prática o painel fica mais fresco do que antes,
 * gastando menos.
 */
export function agendarEnquantoVisivel(
  acao: () => void,
  intervaloMs: number,
  ambiente: AmbienteDeAgendamento,
  opcoes: OpcoesDeAgendamento = {}
): () => void {
  const agora = ambiente.agora ?? (() => Date.now())
  let relogio: number | undefined
  let ultimaExecucao = agora()

  const executar = () => {
    ultimaExecucao = agora()
    acao()
  }

  const ligar = () => {
    if (relogio !== undefined) return
    relogio = ambiente.agendar(executar, intervaloMs)
  }

  const desligar = () => {
    if (relogio === undefined) return
    ambiente.cancelar(relogio)
    relogio = undefined
  }

  const aoMudarVisibilidade = () => {
    if (ambiente.visivel()) {
      // Voltar para a aba é o momento em que o dado importa de novo.
      if (!opcoes.soSeVencido || agora() - ultimaExecucao >= intervaloMs) executar()
      ligar()
    } else {
      desligar()
    }
  }

  if (ambiente.visivel()) ligar()
  const pararDeOuvir = ambiente.ouvirVisibilidade(aoMudarVisibilidade)

  return () => {
    desligar()
    pararDeOuvir()
  }
}

export function ambienteDoNavegador(): AmbienteDeAgendamento {
  return {
    visivel: () => document.visibilityState === 'visible',
    ouvirVisibilidade: (ouvinte) => {
      document.addEventListener('visibilitychange', ouvinte)
      return () => document.removeEventListener('visibilitychange', ouvinte)
    },
    agendar: (acao, intervaloMs) => window.setInterval(acao, intervaloMs),
    cancelar: (id) => window.clearInterval(id),
  }
}

/**
 * A ligação do agendamento acima com o React.
 *
 * `intervaloMs` nulo (ou não positivo) desliga tudo: é como as telas expressam
 * "agora não" — a aba não está na aba certa, o auto-refresh está desmarcado, a
 * prova já encerrou.
 *
 * A ação mais recente é lida de uma `ref`, então uma closure nova a cada render
 * não reinicia o relógio.
 */
export function useIntervaloVisivel(acao: () => void, intervaloMs: number | null) {
  const acaoRef = useRef(acao)

  useEffect(() => {
    acaoRef.current = acao
  }, [acao])

  useEffect(() => {
    if (intervaloMs === null || !Number.isFinite(intervaloMs) || intervaloMs <= 0) return
    if (typeof document === 'undefined') return
    return agendarEnquantoVisivel(
      () => acaoRef.current(),
      intervaloMs,
      ambienteDoNavegador()
    )
  }, [intervaloMs])
}
