'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { DomMascote } from './dom-mascote'
import { falaDe, momentoDaSaudacao } from './falas'
import type { ContextoDoMaterial } from './dom-assistente'
import './dom.css'

/**
 * O botão flutuante do Dom — o que toda página da área logada carrega.
 *
 * Leve de propósito: o painel (conversa, socrático, logo) é um chunk à parte,
 * baixado no primeiro toque (ou quando o mouse passa por cima); o desenho do
 * mascote só é pedido depois que a página assentou. Uma vez por dia, um
 * balãozinho cumprimenta pelo nome — e some sozinho.
 *
 * O painel aberto sobrevive à navegação: "vou te levar lá" troca de página e
 * o Dom continua aberto do outro lado (`sessionStorage`).
 */

const carregarPainel = () => import('./dom-assistente').then((m) => m.DomAssistente)
const DomAssistente = dynamic(carregarPainel, { ssr: false })

const CHAVE_ABERTO = 'dom:aberto'
const CHAVE_BALAO = 'dom:balao-dia'

/** Telas onde o Dom não aparece: prova em andamento e resolução de questões. */
function rotaSemDom(pathname: string): boolean {
  if (/^\/exams?\/[^/]+$/.test(pathname) && pathname !== '/exams/create-personal') return true
  if (/^\/banco-questoes\/(listas\/)?[^/]+$/.test(pathname) && !/^\/banco-questoes\/(historico|listas)$/.test(pathname)) return true
  return pathname.startsWith('/auth') || pathname.startsWith('/buy/checkout')
}

function hoje(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

export function DomLancador({ nome = '', material }: { nome?: string; material?: ContextoDoMaterial | null }) {
  const pathname = usePathname() || '/'
  const [aberto, setAberto] = useState(false)
  const [mascoteLiberado, setMascoteLiberado] = useState(false)
  const [balao, setBalao] = useState<string | null>(null)
  const [oculto, setOculto] = useState(false)
  const primeiroNome = (nome.trim().split(/\s+/)[0] || '').replace(/^./, (c) => c.toUpperCase())

  // Reabre se estava aberto antes da navegação.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(CHAVE_ABERTO) === '1') setAberto(true)
    } catch {
      /* sem armazenamento */
    }
  }, [])

  const abrir = useCallback(() => {
    setBalao(null)
    setAberto(true)
    try {
      sessionStorage.setItem(CHAVE_ABERTO, '1')
    } catch {}
  }, [])
  const fechar = useCallback(() => {
    setAberto(false)
    try {
      sessionStorage.setItem(CHAVE_ABERTO, '0')
    } catch {}
  }, [])

  // Desenho do mascote depois que a página assentou (não disputa banda com ela).
  useEffect(() => {
    const ocioso = (window as any).requestIdleCallback as undefined | ((cb: () => void, o?: { timeout: number }) => number)
    const t = ocioso ? ocioso(() => setMascoteLiberado(true), { timeout: 3500 }) : window.setTimeout(() => setMascoteLiberado(true), 2000)
    return () => {
      if (!ocioso) clearTimeout(t)
    }
  }, [])

  // Balão do dia.
  useEffect(() => {
    if (aberto) return
    let jaViu = false
    try {
      jaViu = localStorage.getItem(CHAVE_BALAO) === hoje()
    } catch {}
    if (jaViu) return
    const mostrar = setTimeout(() => {
      setBalao(material ? falaDe('material', primeiroNome) : falaDe(momentoDaSaudacao(), primeiroNome))
      try {
        localStorage.setItem(CHAVE_BALAO, hoje())
      } catch {}
    }, 6000)
    const esconder = setTimeout(() => setBalao(null), 15000)
    return () => {
      clearTimeout(mostrar)
      clearTimeout(esconder)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Animações param com a aba oculta.
  useEffect(() => {
    const ver = () => setOculto(document.visibilityState !== 'visible')
    document.addEventListener('visibilitychange', ver)
    return () => document.removeEventListener('visibilitychange', ver)
  }, [])

  if (rotaSemDom(pathname)) return null

  return (
    <div className="dom-escopo" data-oculto={oculto || undefined}>
      <div className="dom-lancador" data-aberto={aberto ? '1' : '0'}>
        {balao && (
          <button type="button" className="dom-lancador__balao" onClick={abrir}>
            <strong>Dom · DomineAqui AI</strong>
            {balao}
          </button>
        )}
        <button
          type="button"
          className="dom-lancador__botao"
          onClick={abrir}
          onPointerEnter={() => void carregarPainel()}
          onFocus={() => void carregarPainel()}
          aria-label="Abrir o Dom, assistente de IA"
          aria-haspopup="dialog"
        >
          <span className="dom-lancador__miolo">
            <span className="dom-busto">{mascoteLiberado && <DomMascote estado={balao ? 'acenando' : 'parado'} simples />}</span>
          </span>
          <span className="dom-lancador__status" aria-hidden />
          <span className="dom-lancador__rotulo" aria-hidden>
            IA
          </span>
        </button>
      </div>
      {aberto && <DomAssistente nome={primeiroNome} material={material} rota={pathname} aoFechar={fechar} />}
    </div>
  )
}
