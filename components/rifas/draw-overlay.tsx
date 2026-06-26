'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Sparkles } from 'lucide-react'
import { Confetti } from './confetti'
import { pad } from '@/lib/raffle-shared'
import type { ResolvedTheme } from '@/lib/raffle-shared'

export interface DrawWinner {
  number: number
  participantName: string
  prizeName?: string
}

interface DrawOverlayProps {
  status: 'drawing' | 'finished'
  winners: DrawWinner[]
  totalNumbers: number
  prizeName: string
  theme: ResolvedTheme
}

/**
 * Experiência de sorteio ao vivo: roleta de números girando, suspense e
 * revelação progressiva dos vencedores com confete.
 */
export function DrawOverlay({ status, winners, totalNumbers, prizeName, theme }: DrawOverlayProps) {
  const hasWinners = winners.length > 0
  const isDrawing = status === 'drawing' && !hasWinners

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-6 sm:p-10 text-center"
      style={{
        background: `radial-gradient(circle at 50% 0%, ${theme.primaryColor}22, transparent 70%), rgba(0,0,0,0.55)`,
        border: `1px solid ${theme.primaryColor}44`,
        boxShadow: `0 0 60px ${theme.primaryColor}22`,
      }}
    >
      <Confetti active={hasWinners} colors={[theme.primaryColor, theme.secondaryColor, '#facc15', '#f43f5e']} />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-6"
        style={{ background: `${theme.primaryColor}22`, color: theme.primaryColor, border: `1px solid ${theme.primaryColor}55` }}
      >
        <Sparkles size={14} />
        {isDrawing ? 'Sorteio em andamento' : 'Resultado do sorteio'}
      </motion.div>

      {isDrawing && <SlotMachine totalNumbers={totalNumbers} theme={theme} />}

      {hasWinners && (
        <div className="space-y-4 mt-2">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white">🎉 Temos {winners.length > 1 ? 'ganhadores' : 'um ganhador'}!</h3>
          <p className="text-sm text-white/60 mb-4">Prêmio: <strong style={{ color: theme.primaryColor }}>{prizeName}</strong></p>
          <div className="grid gap-3 sm:grid-cols-2 max-w-2xl mx-auto">
            {winners.map((w, idx) => (
              <WinnerCard key={w.number} winner={w} totalNumbers={totalNumbers} theme={theme} delay={idx * 0.4} />
            ))}
          </div>
        </div>
      )}

      {isDrawing && (
        <p className="mt-6 text-sm text-white/60 animate-pulse">Aguarde, estamos sorteando os números vencedores...</p>
      )}
    </div>
  )
}

function SlotMachine({ totalNumbers, theme }: { totalNumbers: number; theme: ResolvedTheme }) {
  const [display, setDisplay] = useState<string>('000')

  useEffect(() => {
    const interval = setInterval(() => {
      const n = Math.floor(Math.random() * totalNumbers) + 1
      setDisplay(pad(n, totalNumbers))
    }, 70)
    return () => clearInterval(interval)
  }, [totalNumbers])

  return (
    <div className="flex justify-center gap-2 my-6">
      {display.split('').map((d, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 0.3, delay: i * 0.05 }}
          className="flex items-center justify-center rounded-xl font-mono font-black text-4xl sm:text-6xl"
          style={{
            width: '64px',
            height: '88px',
            background: 'rgba(0,0,0,0.6)',
            border: `2px solid ${theme.primaryColor}`,
            color: theme.primaryColor,
            boxShadow: `0 0 25px ${theme.primaryColor}66, inset 0 0 20px rgba(0,0,0,0.5)`,
          }}
        >
          {d}
        </motion.div>
      ))}
    </div>
  )
}

function WinnerCard({ winner, totalNumbers, theme, delay }: { winner: DrawWinner; totalNumbers: number; theme: ResolvedTheme; delay: number }) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -8, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ delay, type: 'spring', stiffness: 200, damping: 14 }}
      className="rounded-2xl p-5 flex items-center gap-4"
      style={{
        background: `linear-gradient(135deg, ${theme.primaryColor}22, ${theme.secondaryColor}11)`,
        border: `1px solid ${theme.primaryColor}66`,
        boxShadow: `0 0 30px ${theme.primaryColor}33`,
      }}
    >
      <div
        className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{ width: 56, height: 56, background: theme.primaryColor, color: '#08130d' }}
      >
        <Trophy size={26} />
      </div>
      <div className="text-left min-w-0">
        <div className="text-3xl font-black font-mono" style={{ color: theme.primaryColor }}>
          {pad(winner.number, totalNumbers)}
        </div>
        <div className="text-sm text-white/80 truncate">{winner.participantName}</div>
      </div>
    </motion.div>
  )
}
