'use client'

import { useEffect, useState } from 'react'
import { DomMascote } from './dom-mascote'
import { falaDe, textoDaFala, type MomentoDaFala } from './falas'
import { falar, pararDeFalar } from './voz'
import { useMudo } from './use-mudo'
import './dom.css'

/**
 * O Dom apresentando o tour da plataforma: o busto dele no cartão de cada
 * passo, falando a frase do passo com a voz gravada (ou mexendo a boca em
 * silêncio, enquanto não houver áudio).
 */

const FALA_DO_PASSO: Record<string, MomentoDaFala> = {
  welcome: 'tourOla',
  'hero-cta': 'tourAtalho',
  'questao-do-dia': 'questaoDoDia',
  stats: 'tourNumeros',
  experiences: 'tourAreas',
  'sidebar-nav': 'tourMenu',
  'sidebar-new-exam': 'tourCriarProva',
  'header-tools': 'tourFoco',
  'tour-button': 'tourBotaoTour',
  dom: 'tourDom',
  finish: 'tourFim',
}

export function DomNoTour({ passo, aoFalar }: { passo: string; aoFalar?: (falando: boolean) => void }) {
  const [texto, setTexto] = useState('')
  const [falando, setFalando] = useState(false)
  const [boca, setBoca] = useState(false)
  const mudo = useMudo()

  useEffect(() => {
    const momento = FALA_DO_PASSO[passo]
    if (!momento) return
    const fala = falaDe(momento)
    setTexto(textoDaFala(fala))
    const t = setTimeout(() => falar(
        fala,
        {
          aoComecar: () => {
            setFalando(true)
            aoFalar?.(true)
          },
          aoTerminar: () => {
            setFalando(false)
            aoFalar?.(false)
          },
          aoBoca: setBoca,
        },
        { prioridade: 'alta' },
      ), 350)
    return () => {
      clearTimeout(t)
      pararDeFalar()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passo])

  if (!FALA_DO_PASSO[passo]) return null
  return (
    <div className="dom-escopo dom-no-tour">
      <span className="dom-no-tour__busto" aria-hidden>
        <span className="dom-busto">
          <DomMascote estado={passo === 'welcome' || passo === 'finish' ? 'acenando' : falando ? 'explicando' : 'feliz'} falando={falando} boca={boca} calado={mudo && !falando} simples />
        </span>
      </span>
      <p className="dom-no-tour__fala" aria-live="polite">
        <strong>Dom</strong>
        {texto}
      </p>
    </div>
  )
}
