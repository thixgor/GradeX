'use client'

import { useEffect, useRef } from 'react'
import type { Exam } from '@/lib/types'
import type { FaseDaProva, JanelaDaProva } from '@/lib/provas/janela-da-prova'
import {
  cadenciaDaSincronizacao,
  instantesDaJanela,
  instantesMudaram,
  type HorariosCrus,
  type InstantesDaJanela,
} from '@/lib/provas/sincronizacao-da-janela'

/**
 * A sala de espera conferindo o relógio da prova com o servidor.
 *
 * ## O que este hook conserta
 *
 * A tela da prova carrega o documento uma vez e, dali em diante, só o relógio
 * do navegador avança. Então "Forçar Início" — que grava `startTime` e
 * `gatesOpen` como agora, em `/admin/exams` — mudava o banco e não mudava
 * nada na tela de quem estava esperando: a contagem regressiva continuava
 * correndo para o horário antigo até alguém dar F5. Numa sala de espera, pedir
 * F5 é pedir para a pessoa vigiar a tela que existe justamente para ela não
 * precisar vigiar nada.
 *
 * Aqui a tela pergunta ao servidor, de tempos em tempos, só pelos quatro
 * instantes da janela (`GET /api/exams/[id]/janela` — a prova inteira, com as
 * questões, não volta nessa rota). Quando algum deles mudou, o documento que a
 * tela guarda é corrigido e o resto acontece sozinho: a janela é recalculada a
 * cada segundo a partir dele, o botão destrava, o aviso de início abre.
 *
 * ## As travas, porque isto roda na aba de todo mundo
 *
 * 1. **Só quem está esperando** (`ativo`, decidido por
 *    `deveSincronizarAJanela`): quem já começou a responder não pergunta mais.
 * 2. **Só com a aba à vista.** Aba escondida não tem sala de espera para
 *    atualizar — e a volta para a aba dispara uma conferida imediata, que é
 *    quando a pessoa de fato olha.
 * 3. **Um pedido por vez**, e o anterior é abortado ao desmontar.
 * 4. **Cadência pela fase** (`cadenciaDaSincronizacao`): 15 s enquanto o
 *    início importa, 1 min depois de a prova encerrar.
 * 5. **Silêncio em falha.** Uma rota fora do ar não pode encher a tela de
 *    quem está prestes a fazer prova com erro nenhum: o ciclo apenas tenta de
 *    novo na próxima volta.
 */

export interface RespostaDaJanela {
  horarios: InstantesDaJanela
  janela: JanelaDaProva
  jaEntrou: boolean
}

export function useJanelaSincronizada({
  provaId,
  prova,
  fase,
  ativo,
  aoMudar,
}: {
  provaId: string
  /** O documento que a tela guarda — a base da comparação. */
  prova: (HorariosCrus & Partial<Exam>) | null | undefined
  /** A fase que a tela está mostrando, para escolher o ritmo. */
  fase: FaseDaProva | null | undefined
  ativo: boolean
  /** Chamado só quando algum instante mudou de fato. */
  aoMudar: (instantes: InstantesDaJanela, resposta: RespostaDaJanela) => void
}): void {
  /*
   * Os instantes conhecidos vivem num ref, e não nas dependências do efeito:
   * eles mudam junto com a resposta que o próprio efeito buscou, e como
   * dependência remontariam o ciclo a cada mudança — o intervalo reiniciando
   * sozinho é como um polling vira uma enxurrada.
   */
  const conhecidosRef = useRef<InstantesDaJanela>(instantesDaJanela(prova))
  useEffect(() => {
    conhecidosRef.current = instantesDaJanela(prova)
  }, [prova])

  const aoMudarRef = useRef(aoMudar)
  aoMudarRef.current = aoMudar

  const cadencia = cadenciaDaSincronizacao(fase)

  useEffect(() => {
    if (!ativo || !provaId) return

    let vivo = true
    let emVoo = false
    let controlador: AbortController | null = null

    const conferir = async () => {
      if (!vivo || emVoo) return
      if (typeof document !== 'undefined' && document.hidden) return

      emVoo = true
      controlador = new AbortController()
      try {
        const res = await fetch(`/api/exams/${provaId}/janela`, {
          cache: 'no-store',
          signal: controlador.signal,
        })
        if (!res.ok) return

        const dados: RespostaDaJanela = await res.json()
        if (!vivo || !dados?.horarios) return

        const novos = instantesDaJanela(dados.horarios)
        if (!instantesMudaram(conhecidosRef.current, novos)) return

        conhecidosRef.current = novos
        aoMudarRef.current(novos, dados)
      } catch {
        // Rede caiu, aba fechando, rota fora do ar: a próxima volta tenta de
        // novo. Nada disso vira mensagem na tela de quem vai fazer prova.
      } finally {
        emVoo = false
      }
    }

    const relogio = setInterval(conferir, cadencia)

    // A volta para a aba é o instante em que a pessoa de fato olha a tela —
    // esperar mais quinze segundos ali seria mostrar a ela um horário que o
    // servidor já sabe estar errado.
    const aoVoltar = () => {
      if (typeof document === 'undefined' || !document.hidden) conferir()
    }
    document.addEventListener('visibilitychange', aoVoltar)
    window.addEventListener('focus', aoVoltar)
    window.addEventListener('online', aoVoltar)

    return () => {
      vivo = false
      clearInterval(relogio)
      controlador?.abort()
      document.removeEventListener('visibilitychange', aoVoltar)
      window.removeEventListener('focus', aoVoltar)
      window.removeEventListener('online', aoVoltar)
    }
  }, [ativo, provaId, cadencia])
}
