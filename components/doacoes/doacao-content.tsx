'use client'

import { useState } from 'react'
import { Copy, Check, QrCode, Heart, Stethoscope, Zap } from 'lucide-react'
import { DoacaoEcgAnimation } from './doacao-ecg-animation'

const PIX_CODE = '00020126670014BR.GOV.BCB.PIX0124pix@thiago-rodrigues.com0217DOACAO DOMINEAQUI5204000053039865802BR5925THIAGO FERREIRA RODRIGUES6009SAO PAULO6226052212IaRUQICaXa9pGli4bPRh6304556B'
const QR_CODE_URL = 'https://i.imgur.com/mMW0lmw.png'

const PIX_KEYS = [
  { label: 'E-mail Pix', value: 'pix@thiago-rodrigues.com', icon: '📧' },
]

interface DoacaoContentProps {
  compact?: boolean
  onDonateClick?: () => void
}

export function DoacaoContent({ compact = false, onDonateClick }: DoacaoContentProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)

  async function copyToClipboard(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    }
  }

  async function copyPixCode() {
    try {
      await navigator.clipboard.writeText(PIX_CODE)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2500)
    } catch {
      const el = document.createElement('textarea')
      el.value = PIX_CODE
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2500)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* ── Camadas de fundo glass ── */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(145deg, rgba(12,28,16,0.85) 0%, rgba(8,22,12,0.92) 100%)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
      />
      {/* Gradiente colorido sutil */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 80% 60% at 20% 0%, rgba(70,129,82,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 100%, rgba(59,130,246,0.10) 0%, transparent 60%)',
      }} />
      {/* Borda interior luminosa */}
      <div className="absolute inset-0 rounded-2xl" style={{
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.2)',
        border: '1px solid rgba(70,129,82,0.22)',
      }} />

      {/* ECG topo */}
      <div className="absolute top-0 left-0 right-0 h-12 opacity-35 pointer-events-none overflow-hidden rounded-t-2xl">
        <DoacaoEcgAnimation color="#68d391" opacity={1} />
      </div>
      {/* ECG base */}
      {!compact && (
        <div className="absolute bottom-0 left-0 right-0 h-8 opacity-20 pointer-events-none overflow-hidden rounded-b-2xl rotate-180">
          <DoacaoEcgAnimation color="#4299e1" opacity={1} />
        </div>
      )}

      {/* Grid overlay sutil */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      <div className="relative z-10 p-5 sm:p-6">

        {/* ── Header ── */}
        <div className="flex items-start gap-3 mb-5">
          <div className="flex-shrink-0 mt-0.5">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(220,38,38,0.25) 0%, rgba(239,68,68,0.15) 100%)',
                border: '1px solid rgba(239,68,68,0.25)',
                boxShadow: '0 0 20px rgba(239,68,68,0.15)',
              }}
            >
              <span className="doacao-heart text-xl leading-none">❤️</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className={`font-bold text-white leading-tight tracking-tight ${compact ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'}`}>
              Apoie quem salva vidas com conhecimento
            </h2>
            <p className="text-emerald-300/70 text-xs sm:text-sm mt-1 leading-relaxed">
              Sua doação mantém a educação médica acessível a todos.{' '}
              <span className="text-emerald-300 font-medium">Cada contribuição forma melhores profissionais.</span>
            </p>
          </div>
        </div>

        {/* ── Métricas — glass pills ── */}
        {!compact && (
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { icon: Stethoscope, label: 'Estudantes', value: 'impactados' },
              { icon: Heart, label: 'Educação', value: 'acessível' },
              { icon: Zap, label: 'Conteúdo', value: 'gratuito' },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="rounded-xl p-2 sm:p-3 text-center"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                }}
              >
                <Icon className="h-3.5 w-3.5 text-emerald-400/80 mx-auto mb-1" />
                <div className="text-white/80 text-[10px] sm:text-xs font-semibold">{label}</div>
                <div className="text-emerald-400/50 text-[9px] sm:text-[10px]">{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Conteúdo principal ── */}
        <div className={`flex gap-4 sm:gap-5 ${compact ? 'flex-col sm:flex-row' : 'flex-col md:flex-row'} items-center`}>

          {/* QR Code glass card */}
          <div className="flex-shrink-0">
            <div
              className="rounded-2xl p-3 w-fit mx-auto"
              style={{
                background: 'rgba(255,255,255,0.97)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.15), 0 0 40px rgba(70,129,82,0.15)',
              }}
            >
              <img
                src={QR_CODE_URL}
                alt="QR Code Pix para doação"
                className={`rounded-lg object-contain ${compact ? 'w-28 h-28 sm:w-32 sm:h-32' : 'w-36 h-36 sm:w-40 sm:h-40'}`}
                loading="lazy"
              />
              <p className="text-center text-[9px] text-gray-400 mt-1.5 font-medium tracking-wide uppercase">
                Escaneie e doe via Pix
              </p>
            </div>
          </div>

          {/* Chaves e código */}
          <div className="flex-1 min-w-0 space-y-3">

            {/* Chave Pix */}
            <div>
              <p className="text-emerald-400/60 text-[10px] font-bold mb-2 uppercase tracking-widest">Chave Pix</p>
              <div className="space-y-1.5">
                {PIX_KEYS.map(({ label, value, icon }) => (
                  <div
                    key={value}
                    className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 transition-all group"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base leading-none flex-shrink-0">{icon}</span>
                      <div className="min-w-0">
                        <div className="text-white/35 text-[10px] font-medium">{label}</div>
                        <div className="text-white/90 text-xs sm:text-sm font-mono truncate">{value}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(value, value)}
                      className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${
                        copiedKey === value ? 'copy-success-anim' : ''
                      }`}
                      style={{
                        background: copiedKey === value ? 'rgba(70,129,82,0.3)' : 'rgba(255,255,255,0.07)',
                        border: `1px solid ${copiedKey === value ? 'rgba(70,129,82,0.4)' : 'rgba(255,255,255,0.10)'}`,
                        color: copiedKey === value ? '#86efac' : 'rgba(255,255,255,0.5)',
                      }}
                      title={`Copiar ${label}`}
                    >
                      {copiedKey === value
                        ? <Check className="h-3.5 w-3.5" />
                        : <Copy className="h-3.5 w-3.5" />
                      }
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Código Pix copia-e-cola */}
            <div>
              <p className="text-emerald-400/60 text-[10px] font-bold mb-2 uppercase tracking-widest">Código Pix (copia e cola)</p>
              <div
                className="rounded-xl px-3 py-2"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <p className="text-white/30 text-[10px] font-mono break-all line-clamp-2 leading-relaxed">
                  {PIX_CODE.slice(0, 60)}…
                </p>
              </div>
              <button
                onClick={copyPixCode}
                className={`w-full mt-2 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${copiedCode ? 'copy-success-anim' : ''}`}
                style={{
                  background: copiedCode
                    ? 'linear-gradient(135deg, rgba(70,129,82,0.8) 0%, rgba(52,211,153,0.6) 100%)'
                    : 'linear-gradient(135deg, rgba(70,129,82,0.35) 0%, rgba(52,211,153,0.20) 100%)',
                  border: `1px solid ${copiedCode ? 'rgba(70,129,82,0.6)' : 'rgba(70,129,82,0.30)'}`,
                  boxShadow: copiedCode ? '0 0 20px rgba(70,129,82,0.3)' : 'inset 0 1px 0 rgba(255,255,255,0.07)',
                  color: copiedCode ? '#fff' : 'rgba(167,243,208,0.9)',
                }}
              >
                {copiedCode
                  ? <><Check className="h-4 w-4" /> Copiado!</>
                  : <><QrCode className="h-4 w-4" /> Copiar código Pix</>
                }
              </button>
            </div>

            {/* Botão: pagar pela plataforma (Pix/cartão/boleto via Mercado Pago) */}
            <a
              href="/doar"
              className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.55) 0%, rgba(5,150,105,0.45) 100%)',
                border: '1px solid rgba(16,185,129,0.4)',
                boxShadow: '0 4px 20px rgba(5,150,105,0.25), inset 0 1px 0 rgba(255,255,255,0.08)',
                color: 'rgba(220,252,231,0.95)',
              }}
            >
              <QrCode className="h-4 w-4" />
              Doar pela plataforma
            </a>

            {/* Botão já doei (fluxo manual) */}
            {onDonateClick && (
              <button
                onClick={onDonateClick}
                className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, rgba(190,24,93,0.55) 0%, rgba(219,39,119,0.45) 100%)',
                  border: '1px solid rgba(219,39,119,0.35)',
                  boxShadow: '0 4px 20px rgba(190,24,93,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
                  color: 'rgba(255,182,203,0.95)',
                }}
              >
                <Heart className="h-4 w-4 fill-current" />
                Já paguei pelo app do banco
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/20 text-[10px] mt-5 italic tracking-wide">
          Você está investindo em vidas. Obrigado por acreditar na educação médica acessível. 🩺
        </p>
      </div>
    </div>
  )
}
