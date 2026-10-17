'use client'

/**
 * Anotações de uma monitoria: o navegador guarda a cada pausa na digitação e o
 * servidor recebe com folga (no máximo a cada 30 s enquanto a pessoa escreve,
 * e ao esconder a aba ou fechar o painel). Uma aula inteira de anotações custa
 * poucas dezenas de requisições pequenas — e nenhuma se nada mudou.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { ANOTACOES_MAX, juntarAnotacoes } from '@/lib/monitorias/anotacoes'
import type { DadosDoPdf } from '@/lib/monitorias/anotacoes-pdf'

const SALVAR_LOCAL_MS = 700
const ENVIO_MINIMO_MS = 30_000
const ENVIO_DEPOIS_DE_PARAR_MS = 4_000
/** `fetch keepalive` aceita até 64 KB de corpo. */
const KEEPALIVE_MAX = 60_000

export type SituacaoDasAnotacoes = 'carregando' | 'salvo' | 'pendente' | 'enviando' | 'offline' | 'erro'

interface Rascunho {
  texto: string
  versaoBase: number
  em: number
}

const chaveLocal = (reservaId: string, chave: string) => `domineaqui:anotacoes:${reservaId}:${chave}`

function lerRascunho(k: string): Rascunho | null {
  try {
    const v = JSON.parse(localStorage.getItem(k) || 'null')
    return v && typeof v.texto === 'string' && typeof v.versaoBase === 'number' ? v : null
  } catch {
    return null
  }
}

function gravarRascunho(k: string, r: Rascunho): void {
  try {
    localStorage.setItem(k, JSON.stringify(r))
  } catch {
    /* navegação privada ou armazenamento cheio: o servidor ainda recebe */
  }
}

export function useAnotacoes(reservaId: string, ativo: boolean) {
  const [texto, setTexto] = useState('')
  const [situacao, setSituacao] = useState<SituacaoDasAnotacoes>('carregando')
  const [sincronizadoEm, setSincronizadoEm] = useState<Date | null>(null)
  const [reserva, setReserva] = useState<DadosDoPdf['reserva'] | null>(null)
  const [erro, setErro] = useState('')

  const textoRef = useRef('')
  const versao = useRef(0)
  const enviado = useRef('')
  const chave = useRef<string | null>(null)
  const ultimoEnvio = useRef(0)
  const timers = useRef<{ local?: ReturnType<typeof setTimeout>; envio?: ReturnType<typeof setTimeout> }>({})
  const carregou = useRef(false)
  const enviando = useRef(false)

  const salvarLocal = useCallback(() => {
    if (!chave.current) return
    gravarRascunho(chaveLocal(reservaId, chave.current), { texto: textoRef.current, versaoBase: versao.current, em: Date.now() })
  }, [reservaId])

  const enviar = useCallback(
    async (tentativa = 0): Promise<void> => {
      clearTimeout(timers.current.envio)
      timers.current.envio = undefined
      if (!carregou.current || enviando.current) return
      const atual = textoRef.current
      if (atual === enviado.current) {
        setSituacao('salvo')
        return
      }
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        setSituacao('offline')
        return
      }
      enviando.current = true
      setSituacao('enviando')
      ultimoEnvio.current = Date.now()
      try {
        const res = await fetch(`/api/monitorias/reservas/${reservaId}/anotacoes`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texto: atual, versaoBase: versao.current }),
          cache: 'no-store',
        })
        const corpo = await res.json().catch(() => null)
        if (res.ok) {
          versao.current = corpo.versao
          enviado.current = atual
          setSincronizadoEm(new Date())
          setErro('')
          salvarLocal()
          setSituacao(textoRef.current === atual ? 'salvo' : 'pendente')
        } else if (res.status === 409 && tentativa === 0) {
          // Outro aparelho gravou antes: junta as duas versões e grava de novo.
          versao.current = corpo?.versao || 0
          const junto = juntarAnotacoes(textoRef.current, String(corpo?.texto || ''))
          textoRef.current = junto
          setTexto(junto)
          enviando.current = false
          return enviar(1)
        } else {
          setErro(corpo?.error || 'Não deu para salvar na sua conta agora. O texto está guardado neste aparelho.')
          setSituacao('erro')
        }
      } catch {
        setSituacao('offline')
      } finally {
        enviando.current = false
      }
    },
    [reservaId, salvarLocal],
  )

  const agendarEnvio = useCallback(() => {
    if (timers.current.envio) return
    const desde = Date.now() - ultimoEnvio.current
    timers.current.envio = setTimeout(() => void enviar(), Math.max(ENVIO_DEPOIS_DE_PARAR_MS, ENVIO_MINIMO_MS - desde))
  }, [enviar])

  /** Ao esconder a aba ou sair: manda o que faltou (sem esperar resposta). */
  const despachar = useCallback(() => {
    salvarLocal()
    const atual = textoRef.current
    if (!carregou.current || atual === enviado.current) return
    const corpo = JSON.stringify({ texto: atual, versaoBase: versao.current })
    if (corpo.length > KEEPALIVE_MAX) return
    try {
      void fetch(`/api/monitorias/reservas/${reservaId}/anotacoes`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: corpo, keepalive: true }).catch(() => {})
      // Não sabemos a nova versão: na próxima abertura o servidor manda.
      enviado.current = atual
    } catch {
      /* fica no rascunho local */
    }
  }, [reservaId, salvarLocal])

  // Carrega na primeira vez que o painel abre.
  useEffect(() => {
    if (!ativo || carregou.current) return
    let cancelado = false
    setSituacao('carregando')
    fetch(`/api/monitorias/reservas/${reservaId}/anotacoes`, { cache: 'no-store' })
      .then(async (res) => {
        const corpo = await res.json().catch(() => null)
        if (!res.ok) throw new Error(corpo?.error || 'Não deu para abrir suas anotações.')
        return corpo
      })
      .then((corpo) => {
        if (cancelado) return
        chave.current = corpo.chave
        setReserva(corpo.reserva)
        versao.current = corpo.versao
        enviado.current = corpo.texto
        const rascunho = lerRascunho(chaveLocal(reservaId, corpo.chave))
        let inicial = corpo.texto as string
        if (rascunho && rascunho.texto !== corpo.texto) {
          // Rascunho local mais novo que o servidor (saiu sem sincronizar) ou
          // os dois andaram (outro aparelho): nada se perde.
          inicial = rascunho.versaoBase === corpo.versao ? rascunho.texto : juntarAnotacoes(rascunho.texto, corpo.texto)
        }
        textoRef.current = inicial
        setTexto(inicial)
        carregou.current = true
        setSincronizadoEm(corpo.atualizadoEm ? new Date(corpo.atualizadoEm) : null)
        if (inicial !== corpo.texto) {
          setSituacao('pendente')
          agendarEnvio()
        } else setSituacao('salvo')
      })
      .catch((e) => {
        if (cancelado) return
        setErro(e instanceof Error ? e.message : 'Não deu para abrir suas anotações.')
        setSituacao('erro')
      })
    return () => {
      cancelado = true
    }
  }, [ativo, reservaId, agendarEnvio])

  // Painel fechado ou aba escondida: manda o que faltou.
  useEffect(() => {
    if (!ativo && carregou.current) void enviar()
  }, [ativo, enviar])
  useEffect(() => {
    const aoEsconder = () => document.visibilityState === 'hidden' && despachar()
    const pendentes = timers.current
    document.addEventListener('visibilitychange', aoEsconder)
    window.addEventListener('pagehide', despachar)
    return () => {
      document.removeEventListener('visibilitychange', aoEsconder)
      window.removeEventListener('pagehide', despachar)
      despachar()
      clearTimeout(pendentes.local)
      clearTimeout(pendentes.envio)
    }
  }, [despachar])
  useEffect(() => {
    const voltou = () => carregou.current && textoRef.current !== enviado.current && void enviar()
    window.addEventListener('online', voltou)
    return () => window.removeEventListener('online', voltou)
  }, [enviar])

  const editar = useCallback(
    (novo: string) => {
      const t = novo.slice(0, ANOTACOES_MAX)
      textoRef.current = t
      setTexto(t)
      if (!carregou.current) return
      setSituacao('pendente')
      clearTimeout(timers.current.local)
      timers.current.local = setTimeout(salvarLocal, SALVAR_LOCAL_MS)
      agendarEnvio()
    },
    [salvarLocal, agendarEnvio],
  )

  return { texto, editar, situacao, sincronizadoEm, reserva, erro, carregado: carregou.current, salvarAgora: enviar }
}
