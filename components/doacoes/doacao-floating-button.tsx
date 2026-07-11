'use client'

import { useEffect, useState } from 'react'
import { Heart, X, Trophy } from 'lucide-react'
import { useAppShell } from '@/components/app-shell'
import { useFloatingDock } from '@/context/FloatingDockContext'
import { DoacaoContent } from './doacao-content'
import { DoacaoForm } from './doacao-form'
import { DoacaoRanking } from './doacao-ranking'
import { DoacaoEcgAnimation } from './doacao-ecg-animation'

export function DoacaoFloatingButton() {
  const dock = useFloatingDock()
  // Abertura controlada pelo dock compartilhado (um painel por vez; abre pelo
  // gatilho desktop ou pelo FAB consolidado no mobile).
  const open = dock?.activePanel === 'donation'
  const setOpen = (value: boolean) => {
    if (value) dock?.open('donation')
    else dock?.close()
  }
  const [formOpen, setFormOpen] = useState(false)
  const { sidebarCollapsed } = useAppShell()

  // Registra a ação "Apoiar" no dock flutuante (usado no mobile).
  const register = dock?.register
  const unregister = dock?.unregister
  useEffect(() => {
    if (!register || !unregister) return
    register({ id: 'donation', label: 'Apoiar', order: 2 })
    return () => unregister('donation')
  }, [register, unregister])

  // Empurra o botão para não ficar atrás do sidebar no desktop
  // Mobile: sidebar é overlay (não empurra), fica em bottom-5 left-5
  // Desktop: sidebar collapsed=72px, expanded=280px — adiciona 20px de margem
  const leftOffset = sidebarCollapsed ? 'lg:left-[92px]' : 'lg:left-[300px]'

  return (
    <>
      {/* ── Botão flutuante — canto inferior esquerdo (desktop apenas) ── */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Apoiar com doação Pix"
        className={`fixed bottom-5 left-5 ${leftOffset} z-40 group hidden lg:flex items-center gap-2.5 doacao-float-idle transition-[left] duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]`}
        style={{ filter: 'drop-shadow(0 0 16px rgba(70,129,82,0.45))' }}
      >
        {/* Anel de pulso externo */}
        <span
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            animation: 'doacao-ring-pulse 2.4s ease-out infinite',
            background: 'radial-gradient(circle, rgba(70,129,82,0.18) 0%, transparent 70%)',
          }}
        />

        {/* Corpo do botão — glassmorphism */}
        <span
          className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-emerald-400/25 transition-all duration-300 group-hover:border-emerald-400/50 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, rgba(21,61,31,0.82) 0%, rgba(15,45,26,0.90) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(70,129,82,0.2)',
          }}
        >
          {/* Reflexo topo */}
          <span className="absolute top-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full pointer-events-none" />

          <Heart className="h-4 w-4 text-rose-400 fill-rose-400 flex-shrink-0 doacao-heart" />
          <span className="text-xs font-semibold text-emerald-200 whitespace-nowrap">Apoiar</span>
        </span>
      </button>

      {/* ── Modal de doação — glassmorphism centralizado ── */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
          style={{ animation: 'fadeIn 0.2s ease' }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 cursor-pointer"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            onClick={() => setOpen(false)}
          />

          {/* Painel glass */}
          <div
            className="relative w-full sm:max-w-xl max-h-[92vh] sm:max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl flex flex-col"
            style={{
              animation: 'slideUpModal 0.35s cubic-bezier(0.34,1.2,0.64,1)',
              background: 'linear-gradient(145deg, rgba(15,20,15,0.92) 0%, rgba(10,25,15,0.96) 100%)',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              border: '1px solid rgba(70,129,82,0.18)',
              boxShadow: '0 -8px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            {/* Reflexo superior */}
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />

            {/* ECG decoração topo */}
            <div className="absolute top-0 left-0 right-0 h-14 opacity-25 pointer-events-none overflow-hidden rounded-t-3xl">
              <DoacaoEcgAnimation color="#4ade80" opacity={1} />
            </div>

            {/* Header */}
            <div
              className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
              style={{
                background: 'linear-gradient(180deg, rgba(10,25,15,0.98) 60%, transparent 100%)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="flex items-center gap-3">
                <span className="doacao-heart text-xl leading-none">❤️</span>
                <div>
                  <h2 className="font-bold text-white text-sm sm:text-base leading-tight">Apoie o DomineAqui</h2>
                  <p className="text-emerald-400/70 text-[11px] mt-0.5">Educação médica acessível para todos</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <X className="h-4 w-4 text-white/60" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="px-4 sm:px-5 pb-6 space-y-5 flex-1">
              <DoacaoContent
                compact={false}
                onDonateClick={() => {
                  setOpen(false)
                  setTimeout(() => setFormOpen(true), 150)
                }}
              />

              {/* Divisor */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(70,129,82,0.4), transparent)' }} />
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/60 font-medium">
                  <Trophy className="h-3 w-3" />
                  Ranking de Doadores
                </div>
                <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(70,129,82,0.4), transparent)' }} />
              </div>

              <DoacaoRanking glass />
            </div>
          </div>
        </div>
      )}

      {/* Formulário de confirmação */}
      <DoacaoForm open={formOpen} onClose={() => setFormOpen(false)} />

      <style jsx global>{`
        @keyframes doacao-ring-pulse {
          0% { transform: scale(0.9); opacity: 0.7; }
          70% { transform: scale(1.8); opacity: 0; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes slideUpModal {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  )
}
