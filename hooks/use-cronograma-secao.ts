'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { Avaliacao, EmentaTopico, IndiceCurso, SecaoCurso } from '@/lib/cronogramas/tipos'
import { normalizarSecao } from '@/lib/cronogramas/tipos'

/**
 * Estado compartilhado da área de cronogramas: qual seção e período o aluno
 * está olhando, se ele quer lembretes, a ementa daquele período e as
 * avaliações publicadas.
 *
 * Fica num hook porque a página e a tela de criação precisam exatamente do
 * mesmo estado — e porque a troca de seção tem que ser otimista: o aluno clica
 * em "Odontologia" e a interface muda na hora, com a gravação da preferência
 * acontecendo atrás. Esperar o servidor para pintar um botão é o tipo de
 * latência que faz o seletor parecer quebrado.
 */

interface EstadoCronogramaSecao {
  pronto: boolean
  secao: SecaoCurso
  periodo: number
  lembretesAtivos: boolean
  salvandoLembretes: boolean
  indice: IndiceCurso[]
  periodosDisponiveis: number[]
  /**
   * A seção que o aluno acompanha de fato, que pode ser diferente da que ele
   * está OLHANDO agora — espiar Odontologia não muda o curso de ninguém.
   * `null` enquanto ele nunca escolheu nenhuma.
   */
  secaoAcompanhada: SecaoCurso | null
  topicos: EmentaTopico[]
  carregandoEmenta: boolean
  avaliacoes: Avaliacao[]
  carregandoAvaliacoes: boolean
  hoje: string
  setSecao: (secao: SecaoCurso) => void
  setPeriodo: (periodo: number) => void
  setLembretes: (ativo: boolean) => void
  recarregarAvaliacoes: () => void
}

export function useCronogramaSecao(): EstadoCronogramaSecao {
  const [pronto, setPronto] = useState(false)
  const [secao, definirSecao] = useState<SecaoCurso>('medicina')
  const [secaoAcompanhada, definirSecaoAcompanhada] = useState<SecaoCurso | null>(null)
  const [periodo, definirPeriodo] = useState(1)
  const [lembretesAtivos, definirLembretes] = useState(false)
  const [salvandoLembretes, setSalvandoLembretes] = useState(false)

  const [indice, setIndice] = useState<IndiceCurso[]>([])
  const [topicos, setTopicos] = useState<EmentaTopico[]>([])
  const [carregandoEmenta, setCarregandoEmenta] = useState(true)

  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [carregandoAvaliacoes, setCarregandoAvaliacoes] = useState(true)
  const [hoje, setHoje] = useState(() => new Date().toISOString().slice(0, 10))
  const [versaoAvaliacoes, setVersaoAvaliacoes] = useState(0)

  /**
   * Cache de ementa por (seção, período). Voltar para um período já visto é
   * instantâneo, e a ementa não muda entre deploys — não há o que invalidar.
   */
  const cache = useRef(new Map<string, EmentaTopico[]>())

  useEffect(() => {
    let ativo = true

    fetch('/api/cronogramas/preferencias')
      .then(resposta => (resposta.ok ? resposta.json() : null))
      .then(dados => {
        if (!ativo || !dados?.preferencias) return
        const secaoSalva = normalizarSecao(dados.preferencias.secao)
        if (secaoSalva) definirSecao(secaoSalva)
        if (secaoSalva && dados.preferencias.secaoEscolhida) definirSecaoAcompanhada(secaoSalva)
        if (dados.preferencias.periodo) definirPeriodo(dados.preferencias.periodo)
        definirLembretes(dados.preferencias.lembretesAtivos === true)
      })
      .catch(() => {})
      .finally(() => {
        if (ativo) setPronto(true)
      })

    return () => {
      ativo = false
    }
  }, [])

  // ── Ementa ──
  useEffect(() => {
    if (!pronto) return
    let ativo = true
    const chave = `${secao}:${periodo}`

    const emCache = cache.current.get(chave)
    if (emCache) {
      setTopicos(emCache)
      setCarregandoEmenta(false)
      return
    }

    setCarregandoEmenta(true)
    fetch(`/api/cronogramas/ementa?secao=${secao}&periodo=${periodo}`)
      .then(resposta => (resposta.ok ? resposta.json() : null))
      .then(dados => {
        if (!ativo) return
        const recebidos: EmentaTopico[] = dados?.topicos ?? []
        cache.current.set(chave, recebidos)
        setTopicos(recebidos)
        if (Array.isArray(dados?.indice)) setIndice(dados.indice)
      })
      .catch(() => {
        if (ativo) setTopicos([])
      })
      .finally(() => {
        if (ativo) setCarregandoEmenta(false)
      })

    return () => {
      ativo = false
    }
  }, [pronto, secao, periodo])

  // ── Avaliações ──
  useEffect(() => {
    if (!pronto) return
    let ativo = true

    setCarregandoAvaliacoes(true)
    fetch(`/api/cronogramas/avaliacoes?secao=${secao}&periodo=${periodo}`)
      .then(resposta => (resposta.ok ? resposta.json() : null))
      .then(dados => {
        if (!ativo) return
        setAvaliacoes(dados?.avaliacoes ?? [])
        if (dados?.hoje) setHoje(dados.hoje)
      })
      .catch(() => {
        if (ativo) setAvaliacoes([])
      })
      .finally(() => {
        if (ativo) setCarregandoAvaliacoes(false)
      })

    return () => {
      ativo = false
    }
  }, [pronto, secao, periodo, versaoAvaliacoes])

  const gravar = useCallback((mudancas: Record<string, unknown>) => {
    return fetch('/api/cronogramas/preferencias', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mudancas),
    }).catch(() => null)
  }, [])

  const setSecao = useCallback(
    (nova: SecaoCurso) => {
      definirSecao(nova)
      definirSecaoAcompanhada(nova)
      // O período pode não existir na seção nova (Medicina vai até 5).
      const disponiveis = indice.find(curso => curso.id === nova)?.periodos ?? []
      const maximo = disponiveis.length > 0 ? disponiveis[disponiveis.length - 1].periodo : 12
      const ajustado = Math.min(periodo, maximo)
      if (ajustado !== periodo) definirPeriodo(ajustado)
      void gravar({ secao: nova, periodo: ajustado })
    },
    [gravar, indice, periodo],
  )

  const setPeriodo = useCallback(
    (novo: number) => {
      definirPeriodo(novo)
      void gravar({ periodo: novo })
    },
    [gravar],
  )

  const setLembretes = useCallback(
    (ativo: boolean) => {
      const anterior = lembretesAtivos
      definirLembretes(ativo)
      setSalvandoLembretes(true)
      gravar({ lembretesAtivos: ativo })
        .then(resposta => {
          // Falhou de verdade: volta o interruptor, senão o aluno acha que
          // está ligado e nunca recebe nada.
          if (!resposta || !resposta.ok) definirLembretes(anterior)
        })
        .finally(() => setSalvandoLembretes(false))
    },
    [gravar, lembretesAtivos],
  )

  const periodosDisponiveis = useMemo(() => {
    const curso = indice.find(item => item.id === secao)
    if (curso && curso.periodos.length > 0) return curso.periodos.map(p => p.periodo)
    return []
  }, [indice, secao])

  const recarregarAvaliacoes = useCallback(() => setVersaoAvaliacoes(v => v + 1), [])

  return {
    pronto,
    secao,
    periodo,
    lembretesAtivos,
    salvandoLembretes,
    indice,
    periodosDisponiveis,
    secaoAcompanhada,
    topicos,
    carregandoEmenta,
    avaliacoes,
    carregandoAvaliacoes,
    hoje,
    setSecao,
    setPeriodo,
    setLembretes,
    recarregarAvaliacoes,
  }
}
