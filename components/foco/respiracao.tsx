'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { falarFoco, tocarSino } from './som-do-foco'
import type { IdDaFalaDeFoco } from '@/lib/foco/narracao'

/**
 * Respiração guiada antes de começar (ou na pausa).
 *
 * - **Suspiro cíclico** (Balban et al., 2023): duas inspirações pelo nariz —
 *   uma cheia, outra curta por cima — e uma expiração longa pela boca. O
 *   estudo usou 5 min/dia; aqui é 1 min, como ritual de entrada.
 * - **Respiração quadrada** (4-4-4-4): inspira, segura, solta, segura.
 *
 * A esfera cresce e encolhe no tempo exato de cada fase (a transição do CSS
 * dura o mesmo que a fase), e a legenda diz o que fazer. Com os MP3 do foco no
 * ar, a voz guia junto.
 */

type Fase = { nome: string; s: number; escala: number; fala?: IdDaFalaDeFoco }

const PADROES: Record<'ciclico' | 'quadrada', { nome: string; fases: Fase[] }> = {
  ciclico: {
    nome: 'Suspiro cíclico',
    fases: [
      { nome: 'Inspira pelo nariz', s: 2, escala: 1, fala: 'resp-inspira' },
      { nome: 'Mais um pouco', s: 1, escala: 1.15, fala: 'resp-mais' },
      { nome: 'Solta devagar pela boca', s: 6, escala: 0.55, fala: 'resp-solta' },
    ],
  },
  quadrada: {
    nome: 'Respiração quadrada',
    fases: [
      { nome: 'Inspira', s: 4, escala: 1.1 },
      { nome: 'Segura', s: 4, escala: 1.1 },
      { nome: 'Solta', s: 4, escala: 0.55 },
      { nome: 'Segura', s: 4, escala: 0.55 },
    ],
  },
}

const DURACAO_S = 60

export function Respiracao({ aoTerminar }: { aoTerminar?: () => void }) {
  const [padrao, setPadrao] = useState<'ciclico' | 'quadrada'>('ciclico')
  const [rodando, setRodando] = useState(false)
  const [indice, setIndice] = useState(0)
  const [restante, setRestante] = useState(DURACAO_S)
  const [ciclos, setCiclos] = useState(0)
  const inicio = useRef(0)

  const fases = PADROES[padrao].fases
  const fase = fases[indice]

  // Avança de fase no tempo exato dela.
  useEffect(() => {
    if (!rodando) return
    if (fase.fala) falarFoco(fase.fala)
    const t = window.setTimeout(() => {
      const prox = (indice + 1) % fases.length
      if (prox === 0) setCiclos((c) => c + 1)
      setIndice(prox)
    }, fase.s * 1000)
    return () => window.clearTimeout(t)
  }, [rodando, indice, fase, fases.length])

  // O minuto total.
  useEffect(() => {
    if (!rodando) return
    let quadro = 0
    const passo = () => {
      const s = Math.max(0, DURACAO_S - Math.floor((performance.now() - inicio.current) / 1000))
      setRestante(s)
      if (s <= 0) {
        setRodando(false)
        tocarSino('fim')
        aoTerminar?.()
        return
      }
      quadro = requestAnimationFrame(passo)
    }
    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
  }, [rodando, aoTerminar])

  function comecar() {
    inicio.current = performance.now()
    setIndice(0)
    setCiclos(0)
    setRestante(DURACAO_S)
    setRodando(true)
    tocarSino('inicio')
  }

  return (
    <div className="mf-respiracao">
      <div className="ck-seg mf-seg-pequeno" role="tablist" aria-label="Tipo de respiração">
        {(Object.keys(PADROES) as Array<keyof typeof PADROES>).map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={padrao === p}
            className="ck-seg-opcao"
            data-ativo={padrao === p ? '' : undefined}
            onClick={() => { setPadrao(p); setRodando(false); setIndice(0) }}
          >
            {PADROES[p].nome}
          </button>
        ))}
      </div>

      <div className="mf-orbe-palco">
        <span
          className="mf-orbe"
          data-rodando={rodando ? '' : undefined}
          style={{
            transform: `scale(${rodando ? fase.escala : 0.75})`,
            transitionDuration: `${rodando ? fase.s : 0.6}s`,
          }}
        />
        <span className="mf-orbe-anel" aria-hidden />
        <div className="mf-orbe-texto" aria-live="polite">
          {rodando ? (
            <motion.p key={`${indice}-${ciclos}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              {fase.nome}
            </motion.p>
          ) : (
            <p>1 minuto</p>
          )}
          <small>{rodando ? `${restante}s · ${ciclos} ciclo${ciclos === 1 ? '' : 's'}` : PADROES[padrao].nome}</small>
        </div>
      </div>

      {!rodando ? (
        <button type="button" className="ck-cta min-h-[48px]" onClick={comecar}>Respirar 1 minuto</button>
      ) : (
        <button type="button" className="ck-botao min-h-[44px]" onClick={() => setRodando(false)}>Parar</button>
      )}
    </div>
  )
}
