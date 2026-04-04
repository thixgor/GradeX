'use client'

import { useEffect, useState } from 'react'
import { SkipForward, Heart, BookOpen, Trophy, Zap, Lock } from 'lucide-react'
import { DoacaoContent } from './doacao-content'
import { DoacaoRanking } from './doacao-ranking'
import { DoacaoForm } from './doacao-form'
import { DoacaoEcgAnimation } from './doacao-ecg-animation'
import { shouldShowInterstitial } from '@/lib/doacao-interstitial'

type InterstitialContext = 'manual-clinico' | 'exam'

interface DoacaoInterstitialProps {
  context: InterstitialContext
  onClose: () => void
}

const IMPACT_ITEMS = [
  { icon: BookOpen, text: 'Manual Clínico completo e gratuito para todos os estudantes' },
  { icon: Zap,      text: 'Questões ilimitadas, flashcards e simulados sem paywall' },
  { icon: Lock,     text: 'Sua doação evita que conteúdo essencial vire pago' },
  { icon: Trophy,   text: 'Forme médicos melhores — o impacto vai além da tela' },
]

export function DoacaoInterstitial({ context, onClose }: DoacaoInterstitialProps) {
  const [visible, setVisible] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    async function check() {
      if (!shouldShowInterstitial(context)) { onClose(); return }

      try {
        const res = await fetch('/api/doacoes/settings')
        const data = await res.json()
        const flagKey = context === 'manual-clinico'
          ? 'doacaoInterstitialManualClinico'
          : 'doacaoInterstitialExams'
        if (!data[flagKey]) { onClose(); return }
      } catch {
        onClose(); return
      }

      setVisible(true)
    }
    check()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 250)
  }

  if (!mounted || !visible) return null

  return (
    <>
      {/* ── Overlay ── */}
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6"
        style={{
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          animation: 'doacaoFadeIn 0.25s ease',
        }}
      >
        {/* ── Painel glass ── */}
        <div
          className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl flex flex-col"
          style={{
            animation: 'doacaoSlideUp 0.35s cubic-bezier(0.34,1.15,0.64,1)',
            background: 'linear-gradient(145deg, rgba(12,22,14,0.94) 0%, rgba(8,18,10,0.97) 100%)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(70,129,82,0.20)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {/* Reflexo topo */}
          <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-emerald-400/35 to-transparent pointer-events-none" />

          {/* ECG topo */}
          <div className="absolute top-0 left-0 right-0 h-12 opacity-20 pointer-events-none overflow-hidden rounded-t-3xl">
            <DoacaoEcgAnimation color="#4ade80" opacity={1} />
          </div>

          {/* Grid sutil */}
          <div className="absolute inset-0 opacity-[0.025] pointer-events-none rounded-3xl" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }} />

          {/* ── Header ── */}
          <div
            className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 flex-shrink-0"
            style={{
              background: 'linear-gradient(180deg, rgba(8,18,10,0.98) 65%, transparent 100%)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(220,38,38,0.25) 0%, rgba(239,68,68,0.15) 100%)',
                  border: '1px solid rgba(239,68,68,0.25)',
                }}
              >
                <span className="doacao-heart text-lg leading-none">❤️</span>
              </div>
              <div>
                <h2 className="font-bold text-white text-sm sm:text-base leading-tight">Antes de continuar…</h2>
                <p className="text-emerald-400/60 text-[11px] mt-0.5">
                  {context === 'manual-clinico' ? 'Manual Clínico gratuito — ajude a mantê-lo assim' : 'Provas gratuitas — ajude a mantê-las assim'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.10)',
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              <SkipForward className="h-3 w-3" />
              Pular
            </button>
          </div>

          {/* ── Conteúdo principal ── */}
          <div className="px-4 sm:px-5 pb-2 space-y-5 flex-1">

            {/* Por que doar — glass pills */}
            <div
              className="rounded-2xl p-4"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <p className="text-emerald-300/80 text-xs font-bold uppercase tracking-widest mb-3">
                Por que sua doação é essencial?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {IMPACT_ITEMS.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-start gap-2.5">
                    <div
                      className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center mt-0.5"
                      style={{ background: 'rgba(70,129,82,0.20)', border: '1px solid rgba(70,129,82,0.25)' }}
                    >
                      <Icon className="h-3 w-3 text-emerald-400" />
                    </div>
                    <p className="text-white/65 text-xs leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Doação */}
            <DoacaoContent
              compact
              onDonateClick={() => {
                setVisible(false)
                setFormOpen(true)
              }}
            />

            {/* Divisor */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(70,129,82,0.35), transparent)' }} />
              <div className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: 'rgba(134,239,172,0.5)' }}>
                <Trophy className="h-3 w-3" />
                Quem já apoiou
              </div>
              <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(70,129,82,0.35), transparent)' }} />
            </div>

            {/* Ranking */}
            <DoacaoRanking compact glass />
          </div>

          {/* ── Rodapé ── */}
          <div className="px-4 py-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className="w-full text-center text-xs py-2.5 rounded-xl transition-all"
              style={{
                color: 'rgba(255,255,255,0.30)',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              Pular por agora e continuar
            </button>
          </div>
        </div>
      </div>

      <DoacaoForm
        open={formOpen}
        onClose={() => { setFormOpen(false); onClose() }}
      />

      <style jsx global>{`
        @keyframes doacaoFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes doacaoSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  )
}
