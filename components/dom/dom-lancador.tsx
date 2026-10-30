'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { DomMascote } from './dom-mascote'
import { DomReacoes } from './dom-reacoes'
import { falaDe, momentoDaSaudacao, textoDaFala, type Fala, type MomentoDaFala } from './falas'
import { falar, pararDeFalar } from './voz'
import { useMudo } from './use-mudo'
import type { ContextoDoMaterial } from './dom-assistente'
import './dom.css'

/**
 * O Dom flutuante — o que toda página da área logada carrega.
 *
 * - **Botão**: o busto do Dom num anel em órbita. O painel (conversa,
 *   socrático) é um chunk à parte, baixado no primeiro toque (ou quando o
 *   mouse passa por cima); o desenho só é pedido depois que a página assentou.
 * - **Balão de contexto**: nas vitrines (/materiais, /pacotes, /buy) e no
 *   leitor, uma fala engraçadinha e persuasiva da página, uma vez por sessão
 *   em cada tipo de página; no resto do site, a saudação uma vez por dia.
 * - **Aparições** (`DomReacoes`): conquistas da plataforma fazem o Dom entrar
 *   na tela e comemorar.
 *
 * O painel aberto sobrevive à navegação: "vou te levar lá" troca de página e
 * o Dom continua aberto do outro lado (`sessionStorage`).
 */

const carregarPainel = () => import('./dom-assistente').then((m) => m.DomAssistente)
const DomAssistente = dynamic(carregarPainel, { ssr: false })

const CHAVE_ABERTO = 'dom:aberto'
const CHAVE_BALAO_DIA = 'dom:balao-dia'

/** Telas sem o botão do Dom: prova, resolução de questões, login e checkout. */
export function rotaSemDom(pathname: string): boolean {
  if (/^\/exams?\/[^/]+$/.test(pathname) && pathname !== '/exams/create-personal') return true
  if (/^\/banco-questoes\/(listas\/)?[^/]+$/.test(pathname) && !/^\/banco-questoes\/(historico|listas)$/.test(pathname)) return true
  return pathname.startsWith('/auth') || pathname.startsWith('/buy/checkout')
}

/** A fala de contexto da página (vitrines e leitor), se houver. */
function momentoDaPagina(pathname: string, noLeitor: boolean): MomentoDaFala | null {
  if (noLeitor) return 'paginaLeitor'
  if (pathname === '/buy' || pathname === '/upgrade') return 'paginaPlanos'
  if (pathname.startsWith('/pacotes')) return 'paginaPacotes'
  if (pathname.startsWith('/materiais')) return 'paginaMateriais'
  return null
}

function hoje(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

function lerArmazenado(chave: string, onde: 'local' | 'sessao'): string | null {
  try {
    return (onde === 'local' ? localStorage : sessionStorage).getItem(chave)
  } catch {
    return null
  }
}
function gravarArmazenado(chave: string, valor: string, onde: 'local' | 'sessao') {
  try {
    ;(onde === 'local' ? localStorage : sessionStorage).setItem(chave, valor)
  } catch {}
}

export function DomLancador({ nome = '', material }: { nome?: string; material?: ContextoDoMaterial | null }) {
  const pathname = usePathname() || '/'
  const [aberto, setAberto] = useState(false)
  const [mascoteLiberado, setMascoteLiberado] = useState(false)
  const [balao, setBalao] = useState<string | null>(null)
  const [falando, setFalando] = useState(false)
  const [boca, setBoca] = useState(false)
  const [oculto, setOculto] = useState(false)
  const mudo = useMudo()
  const primeiroNome = (nome.trim().split(/\s+/)[0] || '').replace(/^./, (c) => c.toUpperCase())

  // Reabre se estava aberto antes da navegação.
  useEffect(() => {
    if (lerArmazenado(CHAVE_ABERTO, 'sessao') === '1') setAberto(true)
  }, [])

  const abrir = useCallback(() => {
    setBalao(null)
    pararDeFalar()
    setAberto(true)
    gravarArmazenado(CHAVE_ABERTO, '1', 'sessao')
  }, [])
  const fechar = useCallback(() => {
    setAberto(false)
    gravarArmazenado(CHAVE_ABERTO, '0', 'sessao')
  }, [])

  // Desenho do mascote depois que a página assentou (não disputa banda com ela).
  useEffect(() => {
    const ocioso = (window as any).requestIdleCallback as undefined | ((cb: () => void, o?: { timeout: number }) => number)
    const t = ocioso ? ocioso(() => setMascoteLiberado(true), { timeout: 3500 }) : window.setTimeout(() => setMascoteLiberado(true), 2000)
    return () => {
      if (!ocioso) clearTimeout(t)
    }
  }, [])

  // Balão: fala da página (uma vez por sessão em cada tipo) ou saudação do dia.
  useEffect(() => {
    if (aberto || rotaSemDom(pathname)) return
    const daPagina = momentoDaPagina(pathname, !!material)
    let momento: MomentoDaFala | null = null
    let marcar: () => void = () => {}
    if (daPagina) {
      const chave = `dom:balao:${daPagina}`
      if (lerArmazenado(chave, 'sessao')) return
      momento = daPagina
      marcar = () => gravarArmazenado(chave, '1', 'sessao')
    } else {
      if (lerArmazenado(CHAVE_BALAO_DIA, 'local') === hoje()) return
      momento = momentoDaSaudacao()
      marcar = () => gravarArmazenado(CHAVE_BALAO_DIA, hoje(), 'local')
    }
    let fala: Fala | null = null
    const mostrar = setTimeout(() => {
      fala = falaDe(momento!)
      setBalao(textoDaFala(fala))
      marcar()
      falar(fala, { aoComecar: () => setFalando(true), aoTerminar: () => setFalando(false), aoBoca: setBoca })
    }, 5000)
    const esconder = setTimeout(() => setBalao(null), 15000)
    return () => {
      clearTimeout(mostrar)
      clearTimeout(esconder)
    }
  }, [pathname, material, aberto])

  // Animações param com a aba oculta.
  useEffect(() => {
    const ver = () => setOculto(document.visibilityState !== 'visible')
    document.addEventListener('visibilitychange', ver)
    return () => document.removeEventListener('visibilitychange', ver)
  }, [])

  // Prova e resolução de questões: sem botão nem painel (foco), mas o Dom
  // ainda aparece para comemorar o foguinho e o resultado.
  if (rotaSemDom(pathname)) {
    return (
      <div className="dom-escopo" data-oculto={oculto || undefined}>
        {mascoteLiberado && <DomReacoes painelAberto={false} />}
      </div>
    )
  }

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
          aria-label={primeiroNome ? `Abrir o Dom, assistente de IA de ${primeiroNome}` : 'Abrir o Dom, assistente de IA'}
          aria-haspopup="dialog"
        >
          <span className="dom-lancador__miolo">
            <span className="dom-busto">{mascoteLiberado && <DomMascote estado={balao ? 'acenando' : 'parado'} falando={falando} boca={boca} calado={mudo && !falando} simples />}</span>
          </span>
          <span className="dom-lancador__status" aria-hidden />
          <span className="dom-lancador__rotulo" aria-hidden>
            IA
          </span>
        </button>
      </div>
      {mascoteLiberado && <DomReacoes painelAberto={aberto} />}
      {aberto && <DomAssistente nome={primeiroNome} material={material} rota={pathname} aoFechar={fechar} />}
    </div>
  )
}
