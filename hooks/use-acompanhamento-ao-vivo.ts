'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  cadenciaComOcio,
  cadenciaDoRetrato,
  devePararPorOcio,
  esperaComRecuo,
  type RetratoAoVivo,
} from '@/lib/provas/acompanhamento-ao-vivo'
import type { FaseDaProva } from '@/lib/provas/janela-da-prova'

/**
 * O retrato da prova, pedido no ritmo certo — e não mais que isso.
 *
 * ## O que este hook está protegendo
 *
 * A plataforma roda na Vercel, cobrada por invocação. Um painel de
 * acompanhamento é, por natureza, uma tela que fica aberta: o admin abre no
 * começo da prova e deixa lá as três horas seguintes, muitas vezes numa aba
 * atrás de outras. Um `setInterval` ingênuo de 5 segundos nessa aba são 2 160
 * invocações por prova, quase todas devolvendo exatamente o retrato anterior.
 *
 * Seis travas, todas aqui:
 *
 *  1. **Só quando o painel está aberto** (`ativo`). Fechar o diálogo mata o
 *     relógio; não há polling de fundo em `/admin/exams`.
 *  2. **Só com a aba à vista.** `visibilitychange` interrompe o ciclo e o
 *     retoma na volta — a aba escondida não tem ninguém olhando.
 *  3. **Só quando algo pode mudar.** `cadenciaDoRetrato` devolve `null` antes
 *     de o portão abrir e depois do término: nas duas pontas o hook busca uma
 *     vez e para. A fase é passada de fora, pelo relógio que já desperta no
 *     instante de cada marco — então o portão abrir religa o ciclo sozinho.
 *  4. **Só enquanto houver novidade.** Respostas iguais (304) afrouxam o
 *     intervalo até um minuto, e trinta minutos sem nenhuma mudança param o
 *     ciclo de vez — a aba esquecida deixa de custar. Ver `cadenciaComOcio`.
 *  5. **Recuo depois de falha.** Uma rota com defeito não vira mil chamadas.
 *  6. **A escolha do admin fica guardada.** Quem prefere pedir na mão desliga
 *     uma vez e o painel abre desligado da próxima vez.
 *
 * Some-se a etiqueta (`ETag`) que a rota devolve: uma sala parada responde 304
 * sem corpo, então a maioria das voltas do relógio não transporta nada — e é
 * essa mesma etiqueta que alimenta a trava 4.
 *
 * ## O relógio que vale é o do servidor
 *
 * "Respondendo" e "parado" saem da distância entre o último sinal do aluno e
 * agora. Se "agora" fosse o relógio do computador do admin — adiantado dois
 * minutos, como tantos são —, a turma inteira apareceria parada. O hook mede o
 * desvio a cada retrato (`agora` do servidor menos o local) e devolve
 * `relogioDoServidor()`, que é o que o painel usa para classificar.
 */

/** Onde a preferência "atualiza sozinho ou não" fica guardada. */
const CHAVE_DA_PREFERENCIA = 'gradex:ao-vivo:automatico'

export interface AcompanhamentoAoVivo {
  retrato: RetratoAoVivo | null
  carregando: boolean
  erro: string | null
  /** Quando o último retrato (ou 304) chegou, pelo relógio local. */
  atualizadoEm: number | null
  /** O admin desligou a atualização automática. */
  pausado: boolean
  /** O ciclo parou sozinho: meia hora sem nenhuma mudança na sala. */
  paradoPorOcio: boolean
  alternarPausa: () => void
  atualizarAgora: () => void
  /** De quanto em quanto tempo o ciclo pergunta. `null` = ciclo parado. */
  cadencia: number | null
  /** Quantas leituras este painel fez desde que abriu — o custo, à vista. */
  leituras: number
  /** Respostas seguidas sem novidade nenhuma. */
  leiturasSemNovidade: number
  /** `Date.now()` corrigido pelo desvio em relação ao servidor. */
  relogioDoServidor: () => number
}

function lerPreferencia(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(CHAVE_DA_PREFERENCIA) !== 'nao'
  } catch {
    // Navegador com armazenamento bloqueado: o padrão vale.
    return true
  }
}

export function useAcompanhamentoAoVivo(
  provaId: string | null,
  fase: FaseDaProva | null,
  ativo: boolean,
): AcompanhamentoAoVivo {
  const [retrato, setRetrato] = useState<RetratoAoVivo | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [atualizadoEm, setAtualizadoEm] = useState<number | null>(null)
  const [pausado, setPausado] = useState(false)
  const [visivel, setVisivel] = useState(true)
  const [leituras, setLeituras] = useState(0)
  const [leiturasSemNovidade, setLeiturasSemNovidade] = useState(0)
  const [paradoPorOcio, setParadoPorOcio] = useState(false)

  const etiquetaRef = useRef<string | null>(null)
  const buscandoRef = useRef(false)
  const falhasRef = useRef(0)
  const desvioRef = useRef(0)
  const atualizadoEmRef = useRef<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  /** Última vez que o retrato de fato mudou — o cronômetro do ócio. */
  const mudouEmRef = useRef<number>(Date.now())
  const semNovidadeRef = useRef(0)

  useEffect(() => {
    atualizadoEmRef.current = atualizadoEm
  }, [atualizadoEm])

  /*
   * A preferência do admin só pode ser lida DEPOIS de montar.
   *
   * `localStorage` não existe no servidor: usá-lo no estado inicial faria o
   * HTML do servidor e o primeiro render do navegador discordarem, e a
   * hidratação descartaria a página inteira.
   */
  useEffect(() => {
    setPausado(!lerPreferencia())
  }, [])

  const respondendo = retrato?.resumo.respondendo ?? 0
  const cadenciaBase = fase ? cadenciaDoRetrato(fase, respondendo > 0) : null
  const cadencia = cadenciaComOcio(cadenciaBase, leiturasSemNovidade)
  const cadenciaRef = useRef<number | null>(cadencia)
  cadenciaRef.current = cadencia

  /** Trocar de prova zera tudo: o retrato antigo é de outra sala. */
  useEffect(() => {
    etiquetaRef.current = null
    falhasRef.current = 0
    atualizadoEmRef.current = null
    semNovidadeRef.current = 0
    mudouEmRef.current = Date.now()
    setRetrato(null)
    setErro(null)
    setAtualizadoEm(null)
    setLeituras(0)
    setLeiturasSemNovidade(0)
    setParadoPorOcio(false)
  }, [provaId])

  useEffect(() => {
    const aoMudar = () => setVisivel(document.visibilityState === 'visible')
    aoMudar()
    document.addEventListener('visibilitychange', aoMudar)
    return () => document.removeEventListener('visibilitychange', aoMudar)
  }, [])

  /** O ciclo volta a valer a pena quando a novidade volta a existir. */
  const marcarNovidade = useCallback(() => {
    semNovidadeRef.current = 0
    mudouEmRef.current = Date.now()
    setLeiturasSemNovidade(0)
    setParadoPorOcio(false)
  }, [])

  const buscar = useCallback(async () => {
    if (!provaId || buscandoRef.current) return
    buscandoRef.current = true
    setCarregando(true)
    setLeituras((n) => n + 1)

    const controlador = new AbortController()
    abortRef.current = controlador

    try {
      const cabecalhos: Record<string, string> = {}
      // A etiqueta faz duas coisas de uma vez: poupa o corpo da resposta e é a
      // prova de que nada mudou, que é o que alimenta o afrouxamento abaixo.
      if (etiquetaRef.current) cabecalhos['If-None-Match'] = etiquetaRef.current

      const res = await fetch(`/api/admin/exams/${provaId}/ao-vivo`, {
        headers: cabecalhos,
        cache: 'no-store',
        signal: controlador.signal,
      })

      if (res.status === 304) {
        falhasRef.current = 0
        semNovidadeRef.current += 1
        setLeiturasSemNovidade(semNovidadeRef.current)
        setErro(null)
        setAtualizadoEm(Date.now())
        if (devePararPorOcio(Date.now() - mudouEmRef.current)) setParadoPorOcio(true)
        return
      }

      if (!res.ok) {
        const corpo = await res.json().catch(() => ({}))
        throw new Error(corpo?.error || 'Não foi possível ler o andamento da prova')
      }

      const etiqueta = res.headers.get('etag')
      if (etiqueta) etiquetaRef.current = etiqueta

      const dados = (await res.json()) as RetratoAoVivo
      const doServidor = new Date(dados.agora).getTime()
      if (Number.isFinite(doServidor)) desvioRef.current = doServidor - Date.now()

      setRetrato(dados)
      setErro(null)
      falhasRef.current = 0
      setAtualizadoEm(Date.now())
      marcarNovidade()
    } catch (e: any) {
      if (e?.name === 'AbortError') return
      falhasRef.current += 1
      setErro(e?.message || 'Falha ao atualizar')
    } finally {
      buscandoRef.current = false
      setCarregando(false)
    }
  }, [provaId, marcarNovidade])

  /*
   * O ciclo.
   *
   * `fase` está nas dependências de propósito: é ela que religa o ciclo quando
   * o portão abre. O relógio da lista desperta no milissegundo exato de cada
   * marco (ver hooks/use-relogio-da-lista.ts), então o painel não fica
   * esperando o próximo tique de 30 s para descobrir que a sala abriu.
   *
   * `retrato` NÃO entra: cada resposta mudaria o retrato, o efeito seria
   * remontado e o ciclo recomeçaria do zero — o que é, na prática, um segundo
   * ciclo por cima do primeiro. A cadência viaja por ref justamente para isso.
   */
  useEffect(() => {
    if (!ativo || !provaId || pausado || !visivel || paradoPorOcio) return

    let cancelado = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const agendar = () => {
      if (cancelado) return
      const base = cadenciaRef.current
      if (falhasRef.current > 0) {
        timer = setTimeout(ciclo, esperaComRecuo(falhasRef.current, base ?? 20_000))
        return
      }
      // Fase sem movimento (antes do portão, encerrada): um retrato basta.
      if (base === null) return
      timer = setTimeout(ciclo, base)
    }

    const ciclo = async () => {
      if (cancelado) return
      await buscar()
      if (cancelado) return
      agendar()
    }

    /*
     * Voltar para a aba não custa uma invocação se o retrato ainda é novo.
     * Sem esta conferência, alternar entre abas viraria uma chamada por
     * alternância — e alternar de aba é o gesto mais comum de quem acompanha
     * uma prova com outra coisa aberta do lado.
     */
    const idade = Date.now() - (atualizadoEmRef.current ?? 0)
    const limite = Math.min(cadenciaRef.current ?? 20_000, 10_000)
    if (idade >= limite) ciclo()
    else agendar()

    return () => {
      cancelado = true
      clearTimeout(timer)
      abortRef.current?.abort()
    }
  }, [ativo, provaId, pausado, visivel, paradoPorOcio, fase, buscar])

  /*
   * Pedir na mão é sempre um recomeço.
   *
   * Quem clica em "atualizar" está dizendo que quer ver de novo — então o
   * afrouxamento por ócio e a parada por ócio saem do caminho, junto com o
   * recuo por falha.
   */
  const atualizarAgora = useCallback(() => {
    falhasRef.current = 0
    marcarNovidade()
    void buscar()
  }, [buscar, marcarNovidade])

  const alternarPausa = useCallback(() => {
    setPausado((antes) => {
      const agora = !antes
      try {
        window.localStorage.setItem(CHAVE_DA_PREFERENCIA, agora ? 'nao' : 'sim')
      } catch {
        // Sem armazenamento a escolha vale só nesta visita — e tudo bem.
      }
      // Religar depois de uma pausa longa não pode herdar o ócio de antes.
      if (!agora) marcarNovidade()
      return agora
    })
  }, [marcarNovidade])

  const relogioDoServidor = useCallback(() => Date.now() + desvioRef.current, [])

  return {
    retrato,
    carregando,
    erro,
    atualizadoEm,
    pausado,
    paradoPorOcio,
    alternarPausa,
    atualizarAgora,
    cadencia: ativo && !pausado && visivel && !paradoPorOcio ? cadencia : null,
    leituras,
    leiturasSemNovidade,
    relogioDoServidor,
  }
}
