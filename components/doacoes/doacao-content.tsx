'use client'

import { useState } from 'react'
import { Copy, Check, QrCode, Heart, Stethoscope, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
      // fallback
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
      {/* Fundo médico com gradiente */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#153D1F] via-[#1e4d2a] to-[#0f2d1a] rounded-2xl" />
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 via-transparent to-emerald-900/20 rounded-2xl" />

      {/* ECG decoration — top */}
      <div className="absolute top-0 left-0 right-0 h-12 opacity-40">
        <DoacaoEcgAnimation color="#68d391" opacity={1} />
      </div>

      {/* ECG decoration — bottom */}
      {!compact && (
        <div className="absolute bottom-0 left-0 right-0 h-10 opacity-30 rotate-180">
          <DoacaoEcgAnimation color="#4299e1" opacity={1} />
        </div>
      )}

      {/* Grid overlay sutil */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 p-5 sm:p-7">
        {/* Header */}
        <div className="flex items-start gap-3 mb-5">
          <div className="flex-shrink-0 mt-0.5">
            <span className="doacao-heart text-3xl sm:text-4xl leading-none">❤️</span>
          </div>
          <div>
            <h2 className={`font-bold text-white leading-tight ${compact ? 'text-base sm:text-lg' : 'text-lg sm:text-2xl'}`}>
              Apoie quem salva vidas com conhecimento
            </h2>
            <p className="text-emerald-200/80 text-xs sm:text-sm mt-1 leading-relaxed">
              Sua doação mantém a educação médica acessível a todos.{' '}
              <span className="text-emerald-300 font-medium">Cada contribuição forma melhores profissionais da saúde.</span>
            </p>
          </div>
        </div>

        {/* Métricas de impacto */}
        {!compact && (
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { icon: Stethoscope, label: 'Estudantes', value: 'impactados' },
              { icon: Heart, label: 'Educação', value: 'acessível' },
              { icon: Zap, label: 'Conteúdo', value: 'gratuito' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white/5 rounded-xl p-2 sm:p-3 text-center border border-white/10">
                <Icon className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
                <div className="text-white text-[10px] sm:text-xs font-semibold">{label}</div>
                <div className="text-emerald-300/70 text-[9px] sm:text-[10px]">{value}</div>
              </div>
            ))}
          </div>
        )}

        <div className={`flex gap-4 sm:gap-6 ${compact ? 'flex-col sm:flex-row' : 'flex-col md:flex-row'} items-center`}>
          {/* QR Code */}
          <div className="flex-shrink-0">
            <div className="bg-white rounded-2xl p-3 shadow-2xl doacao-card-glow w-fit mx-auto">
              <img
                src={QR_CODE_URL}
                alt="QR Code Pix para doação"
                className={`rounded-lg object-contain ${compact ? 'w-28 h-28 sm:w-32 sm:h-32' : 'w-36 h-36 sm:w-44 sm:h-44'}`}
                loading="lazy"
              />
              <p className="text-center text-[9px] text-gray-500 mt-1.5 font-medium">Escaneie e doe via Pix</p>
            </div>
          </div>

          {/* Chaves e código */}
          <div className="flex-1 w-full space-y-3">
            {/* Chaves Pix */}
            <div>
              <p className="text-emerald-300 text-xs font-semibold mb-2 uppercase tracking-widest">Chaves Pix</p>
              <div className="space-y-1.5">
                {PIX_KEYS.map(({ label, value, icon }) => (
                  <div
                    key={value}
                    className="flex items-center justify-between gap-2 bg-white/8 hover:bg-white/12 rounded-xl px-3 py-2 border border-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base leading-none flex-shrink-0">{icon}</span>
                      <div className="min-w-0">
                        <div className="text-white/50 text-[10px]">{label}</div>
                        <div className="text-white text-xs sm:text-sm font-mono truncate">{value}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(value, value)}
                      className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${
                        copiedKey === value
                          ? 'bg-emerald-500/30 text-emerald-300 copy-success-anim'
                          : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
                      }`}
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
              <p className="text-emerald-300 text-xs font-semibold mb-2 uppercase tracking-widest">Código Pix (copia e cola)</p>
              <div className="bg-white/8 rounded-xl px-3 py-2 border border-white/10">
                <p className="text-white/50 text-[10px] font-mono break-all line-clamp-2 leading-relaxed">
                  {PIX_CODE.slice(0, 60)}…
                </p>
              </div>
              <button
                onClick={copyPixCode}
                className={`w-full mt-2 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  copiedCode
                    ? 'bg-emerald-500 text-white copy-success-anim'
                    : 'bg-emerald-600/70 hover:bg-emerald-500 text-white border border-emerald-500/40 hover:border-emerald-400'
                }`}
              >
                {copiedCode
                  ? <><Check className="h-4 w-4" /> Copiado!</>
                  : <><QrCode className="h-4 w-4" /> Copiar código Pix</>
                }
              </button>
            </div>

            {/* Botão já doei */}
            {onDonateClick && (
              <button
                onClick={onDonateClick}
                className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-lg shadow-rose-900/30 transition-all duration-200 active:scale-[0.98] border border-rose-500/30"
              >
                <Heart className="h-4 w-4 fill-current" />
                Já fiz minha doação
              </button>
            )}
          </div>
        </div>

        {/* Footer mensagem */}
        <p className="text-center text-white/30 text-[10px] mt-5 italic">
          Você está investindo em vidas. Obrigado por acreditar na educação médica acessível. 🩺
        </p>
      </div>
    </div>
  )
}
