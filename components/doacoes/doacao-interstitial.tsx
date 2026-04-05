'use client'

import { useEffect, useState } from 'react'
import { SkipForward, Heart, BookOpen, Trophy, Zap, Lock, X } from 'lucide-react'
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

  if (!mounted) return null

  // While the settings API call is in flight, show a blocking overlay so the
  // underlying name-form doesn't flash through for 1-2 seconds.
  if (!visible) {
    return (
      <div
        className="fixed inset-0 z-[200]"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
      />
    )
  }

  const contextLabel = context === 'manual-clinico'
    ? 'Manual Clínico gratuito — ajude a mantê-lo assim'
    : 'Provas gratuitas — ajude a mantê-las assim'

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 z-[200]"
        style={{
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          animation: 'doacaoFadeIn 0.25s ease',
        }}
        onClick={handleClose}
      />

      {/* ══════════════════════════════════════
          MOBILE: bottom sheet
          DESKTOP: centered modal
      ══════════════════════════════════════ */}

      {/* ── Mobile bottom sheet ── */}
      <div className="fixed inset-x-0 bottom-0 z-[201] flex flex-col sm:hidden"
        style={{ animation: 'doacaoSlideUpMobile 0.35s cubic-bezier(0.34,1.15,0.64,1)' }}
      >
        {/* Drag handle visual */}
        <div className="flex justify-center pt-3 pb-0 pointer-events-none">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Sheet panel */}
        <div
          className="relative flex flex-col overflow-hidden"
          style={{
            background: 'linear-gradient(165deg, rgba(12,22,14,0.98) 0%, rgba(8,18,10,1) 100%)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(70,129,82,0.22)',
            borderBottom: 'none',
            borderRadius: '24px 24px 0 0',
            boxShadow: '0 -16px 60px rgba(0,0,0,0.6)',
            maxHeight: '88svh',
          }}
        >
          {/* ECG decorativo */}
          <div className="absolute top-0 left-0 right-0 h-10 opacity-15 pointer-events-none overflow-hidden">
            <DoacaoEcgAnimation color="#4ade80" opacity={1} />
          </div>

          {/* ─ Skip bar — ALWAYS visible at top on mobile ─ */}
          <div
            className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0 relative z-10"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(220,38,38,0.25) 0%, rgba(239,68,68,0.15) 100%)',
                  border: '1px solid rgba(239,68,68,0.25)',
                }}
              >
                <span className="doacao-heart text-base leading-none">❤️</span>
              </div>
              <div>
                <h2 className="font-bold text-white text-sm leading-tight">Antes de continuar…</h2>
                <p className="text-emerald-400/60 text-[10px] mt-0.5 leading-tight">{contextLabel}</p>
              </div>
            </div>

            {/* Large tap target for skip */}
            <button
              onClick={handleClose}
              className="flex items-center gap-1.5 font-semibold rounded-2xl transition-all active:scale-95"
              style={{
                background: 'rgba(255,255,255,0.09)',
                border: '1px solid rgba(255,255,255,0.14)',
                color: 'rgba(255,255,255,0.75)',
                padding: '10px 16px',
                fontSize: '13px',
                minWidth: '72px',
                minHeight: '44px',
              }}
            >
              <X className="h-3.5 w-3.5" />
              Pular
            </button>
          </div>

          {/* ─ Scrollable content ─ */}
          <div className="overflow-y-auto flex-1 px-4 pb-4 pt-3 space-y-4">
            {/* Impact pills — 2 per row on mobile */}
            <div className="grid grid-cols-2 gap-2">
              {IMPACT_ITEMS.map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex flex-col gap-1.5 p-3 rounded-2xl"
                  style={{
                    background: 'rgba(70,129,82,0.10)',
                    border: '1px solid rgba(70,129,82,0.18)',
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(70,129,82,0.22)', border: '1px solid rgba(70,129,82,0.28)' }}
                  >
                    <Icon className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <p className="text-white/70 text-[11px] leading-snug">{text}</p>
                </div>
              ))}
            </div>

            {/* Donation CTA */}
            <DoacaoContent
              compact
              onDonateClick={() => {
                setVisible(false)
                setFormOpen(true)
              }}
            />

            {/* Ranking — collapsed/compact */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(70,129,82,0.35), transparent)' }} />
                <span className="text-[10px] font-semibold text-emerald-400/50 flex items-center gap-1">
                  <Trophy className="h-3 w-3" /> Quem já apoiou
                </span>
                <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(70,129,82,0.35), transparent)' }} />
              </div>
              <DoacaoRanking compact glass />
            </div>
          </div>

          {/* ─ Bottom skip CTA ─ */}
          <div className="px-4 pb-5 pt-1 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <button
              onClick={handleClose}
              className="w-full text-center rounded-2xl transition-all active:scale-[0.98]"
              style={{
                color: 'rgba(255,255,255,0.40)',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '14px 0',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              Pular por agora e continuar
            </button>
          </div>
        </div>
      </div>

      {/* ── Desktop centered modal ── */}
      <div
        className="hidden sm:flex fixed inset-0 z-[201] items-center justify-center p-6"
        style={{ animation: 'doacaoFadeIn 0.25s ease' }}
      >
        <div
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl flex flex-col"
          style={{
            animation: 'doacaoSlideUp 0.35s cubic-bezier(0.34,1.15,0.64,1)',
            background: 'linear-gradient(145deg, rgba(12,22,14,0.94) 0%, rgba(8,18,10,0.97) 100%)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(70,129,82,0.20)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
          onClick={e => e.stopPropagation()}
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

          {/* Header */}
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
                <h2 className="font-bold text-white text-base leading-tight">Antes de continuar…</h2>
                <p className="text-emerald-400/60 text-xs mt-0.5">{contextLabel}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:bg-white/10"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.65)',
                minHeight: '40px',
              }}
            >
              <SkipForward className="h-3.5 w-3.5" />
              Pular
            </button>
          </div>

          {/* Conteúdo */}
          <div className="px-5 pb-2 space-y-5 flex-1">
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
              <div className="grid grid-cols-2 gap-2">
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

            <DoacaoContent
              compact
              onDonateClick={() => {
                setVisible(false)
                setFormOpen(true)
              }}
            />

            <div className="flex items-center gap-3">
              <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(70,129,82,0.35), transparent)' }} />
              <div className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: 'rgba(134,239,172,0.5)' }}>
                <Trophy className="h-3 w-3" />
                Quem já apoiou
              </div>
              <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(70,129,82,0.35), transparent)' }} />
            </div>

            <DoacaoRanking compact glass />
          </div>

          {/* Rodapé */}
          <div className="px-5 py-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className="w-full text-center text-xs py-3 rounded-xl transition-all hover:bg-white/5"
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
        @keyframes doacaoSlideUpMobile {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
