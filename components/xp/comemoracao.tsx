'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { LogoAnimada } from '@/components/marca/logo-animada'
import type { InfoDeNivel } from '@/lib/xp/regras'
import type { Comemoracao } from '@/lib/xp/motivos'
import { NumeroQueCorre, estiloDaLiga } from './pecas'
import '@/components/marca/logo-animada.css'
import './xp.css'

export interface Celebracao {
  chave: number
  xp: number
  total: number
  nivel: InfoDeNivel
  /** Progresso no nível antes do ganho — a barra anda dele até o novo. */
  progressoAntes: number
  comemoracao: Comemoracao
}

/**
 * A celebração com a marca: a moeda do DomineAqui girando com moedinhas em
 * órbita, "DomineAqui XP", o número subindo, o motivo e a barra do nível
 * andando. Some sozinha (a avaliação fica mais tempo, com corações) e fecha com
 * um toque ou Esc — não trava ninguém.
 */
export function CelebracaoDeXp({ celebracao, fechar }: { celebracao: Celebracao | null; fechar: () => void }) {
  const [montado, setMontado] = useState(false)
  const calmo = useReducedMotion()
  useEffect(() => setMontado(true), [])

  useEffect(() => {
    if (!celebracao) return
    const t = window.setTimeout(fechar, celebracao.comemoracao.especial ? 5200 : 3600)
    const aoTeclar = (e: KeyboardEvent) => { if (e.key === 'Escape') fechar() }
    window.addEventListener('keydown', aoTeclar)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', aoTeclar)
    }
  }, [celebracao, fechar])

  const faiscas = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        a: `${Math.round((i / 22) * 360 + Math.random() * 12)}deg`,
        d: `${Math.round(120 + Math.random() * 120)}px`,
        atraso: `${(Math.random() * 0.25).toFixed(2)}s`,
      })),
    // Um sorteio por celebração.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [celebracao?.chave],
  )

  if (!montado) return null
  return createPortal(
    <AnimatePresence>
      {celebracao && (
        <motion.div
          key={celebracao.chave}
          className="xc-palco"
          data-especial={celebracao.comemoracao.especial ? '' : undefined}
          style={estiloDaLiga(celebracao.nivel.liga)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35 } }}
        >
          <span className="xc-brilho" aria-hidden />
          {!calmo && (
            <span className="xc-faiscas" aria-hidden>
              {faiscas.map((f, i) => (
                <i key={i} style={{ '--a': f.a, '--d': f.d, '--atraso': f.atraso } as React.CSSProperties} />
              ))}
            </span>
          )}
          {!calmo && celebracao.comemoracao.especial && (
            <span className="xc-coracoes" aria-hidden>
              {Array.from({ length: 10 }, (_, i) => (
                <Heart key={i} style={{ '--x': `${(i - 4.5) * 34}px`, '--atraso': `${i * 0.18}s` } as React.CSSProperties} />
              ))}
            </span>
          )}

          <motion.div
            className="xc-cartao"
            role="status"
            aria-live="polite"
            onClick={fechar}
            initial={calmo ? { opacity: 0 } : { scale: 0.5, opacity: 0, y: 40, rotateX: 25 }}
            animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          >
            <span className="xc-moeda">
              <span className="xc-orbita" aria-hidden>
                <i /><i /><i /><i /><i /><i />
              </span>
              <LogoAnimada tamanho="compacto" nome={false} inclinacao="nenhuma" modo="gerando" />
            </span>

            <p className="xc-marca">
              Domine<b>Aqui</b> <span>XP</span>
            </p>

            <p className="xc-numero">
              +{calmo ? celebracao.xp.toLocaleString('pt-BR') : <NumeroQueCorre valor={celebracao.xp} />}
              <small> XP</small>
            </p>

            <h2 className="xc-titulo">{celebracao.comemoracao.titulo}</h2>
            <p className="xc-texto">{celebracao.comemoracao.texto}</p>

            <div className="xc-nivel">
              <span>Nível {celebracao.nivel.nivel}</span>
              <span className="xc-barra" aria-hidden>
                <motion.i
                  initial={{ width: `${Math.round(celebracao.progressoAntes * 100)}%` }}
                  animate={{ width: `${Math.round(celebracao.nivel.progresso * 100)}%` }}
                  transition={{ delay: 0.5, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                />
              </span>
              <span>{celebracao.total.toLocaleString('pt-BR')} XP</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
