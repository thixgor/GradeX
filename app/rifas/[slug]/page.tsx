'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Ticket, Gift, Trophy, Clock, ArrowLeft, ShieldCheck, AlertCircle,
  CheckCircle2, Loader2, Tag, User, Mail, Phone, Info,
} from 'lucide-react'
import { MercadoPagoCheckout } from '@/components/payments/mercado-pago-checkout'
import { NumberGrid } from '@/components/rifas/number-grid'
import { DrawOverlay } from '@/components/rifas/draw-overlay'
import { CompactCountdown } from '@/components/rifas/compact-countdown'
import { resolveTheme, RAFFLE_STATUS_LABELS, RAFFLE_STATUS_COLORS, formatBRL } from '@/lib/raffle-shared'
import type { RaffleStatus } from '@/lib/types'

interface RaffleDetail {
  id: string
  name: string
  slug: string
  description: string
  pricePerNumber: number
  totalNumbers: number
  winnersCount: number
  coverImageUrl: string
  prizeName: string
  prizeDescription: string
  prizeCategory: string
  prizeImageUrl: string
  template: any
  customDesign: any
  visibility: string
  status: RaffleStatus
  rules: string
  startsAt: string | null
  endsAt: string | null
  soldCount: number
  availableCount: number
  winners: { number: number; participantName: string; prizeName: string; drawnAt: string }[]
}

export default function RaffleDetailPage() {
  const params = useParams()
  const slug = String(params.slug || '')

  const [raffle, setRaffle] = useState<RaffleDetail | null>(null)
  const [soldNumbers, setSoldNumbers] = useState<number[]>([])
  const [reservedNumbers, setReservedNumbers] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [selected, setSelected] = useState<number[]>([])
  const [publicKey, setPublicKey] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [showCheckout, setShowCheckout] = useState(false)
  const [formError, setFormError] = useState('')

  const theme = useMemo(() => resolveTheme(raffle?.template, raffle?.customDesign), [raffle])

  const loadDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/raffles/${slug}`)
      if (!res.ok) {
        setNotFound(true)
        return
      }
      const data = await res.json()
      setRaffle(data.raffle)
      setSoldNumbers(data.soldNumbers || [])
      setReservedNumbers(data.reservedNumbers || [])
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    loadDetail()
    fetch('/api/payments/public-key').then(r => r.json()).then(d => setPublicKey(d.publicKey || '')).catch(() => {})
  }, [loadDetail])

  // Polling de status ao vivo (grid + transição de sorteio).
  useEffect(() => {
    if (!raffle) return
    const terminal = raffle.status === 'cancelled'
    if (terminal) return
    const intervalMs = raffle.status === 'drawing' || raffle.status === 'closed' ? 5000 : 15000
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/raffles/${slug}/status`)
        if (!res.ok) return
        const data = await res.json()
        setSoldNumbers(data.soldNumbers || [])
        setReservedNumbers(data.reservedNumbers || [])
        setRaffle(prev => prev ? {
          ...prev,
          status: data.status,
          soldCount: data.soldCount,
          availableCount: data.availableCount,
          winners: data.winners || prev.winners,
        } : prev)
      } catch {}
    }, intervalMs)
    return () => clearInterval(id)
  }, [raffle?.status, slug, raffle])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#06140a' }}>
        <Loader2 className="animate-spin text-emerald-400" size={36} />
      </div>
    )
  }

  if (notFound || !raffle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center" style={{ background: '#06140a' }}>
        <AlertCircle size={48} className="text-red-400" />
        <h1 className="text-xl font-bold text-white">Rifa não encontrada</h1>
        <Link href="/rifas" className="text-emerald-400 hover:underline">← Voltar para as rifas</Link>
      </div>
    )
  }

  const pct = raffle.totalNumbers > 0 ? Math.min(100, Math.round((raffle.soldCount / raffle.totalNumbers) * 100)) : 0
  const amount = Math.round(raffle.pricePerNumber * selected.length * 100) / 100
  const isOpen = raffle.status === 'open'
  const isDrawingOrDone = raffle.status === 'drawing' || raffle.status === 'finished' || raffle.status === 'closed'
  const statusColor = RAFFLE_STATUS_COLORS[raffle.status]

  function validateForm(): boolean {
    if (form.name.trim().length < 2) { setFormError('Informe seu nome completo.'); return false }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) { setFormError('Informe um e-mail válido.'); return false }
    if (form.phone.replace(/\D/g, '').length < 8) { setFormError('Informe um celular/WhatsApp válido.'); return false }
    if (selected.length === 0) { setFormError('Selecione ao menos um número.'); return false }
    setFormError('')
    return true
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: theme.background }}>
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
        <Link href="/rifas" className="inline-flex items-center gap-2 text-sm mb-5 opacity-70 hover:opacity-100 transition" style={{ color: theme.light ? '#333' : '#fff' }}>
          <ArrowLeft size={16} /> Todas as rifas
        </Link>

        {/* Cabeçalho */}
        <div className="rounded-3xl overflow-hidden mb-6" style={{ border: `1px solid ${theme.primaryColor}33`, background: 'rgba(0,0,0,0.3)' }}>
          {raffle.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={raffle.coverImageUrl} alt={raffle.name} className="w-full h-52 sm:h-72 object-cover" />
          )}
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide" style={{ background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}66` }}>
                {RAFFLE_STATUS_LABELS[raffle.status]}
              </span>
              {raffle.prizeCategory && (
                <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold" style={{ background: `${theme.primaryColor}1a`, color: theme.primaryColor }}>
                  <Tag size={11} /> {raffle.prizeCategory}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight" style={{ color: theme.light ? '#0b0b0b' : '#fff' }}>{raffle.name}</h1>
            {raffle.description && <p className="mt-2 text-sm sm:text-base opacity-70" style={{ color: theme.light ? '#333' : '#fff' }}>{raffle.description}</p>}

            {/* Métricas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              <Stat icon={<Ticket size={16} />} label="Por número" value={formatBRL(raffle.pricePerNumber)} theme={theme} highlight />
              <Stat icon={<Trophy size={16} />} label="Ganhadores" value={String(raffle.winnersCount)} theme={theme} />
              <Stat icon={<Gift size={16} />} label="Disponíveis" value={String(raffle.availableCount)} theme={theme} />
              <Stat icon={<CheckCircle2 size={16} />} label="Vendidos" value={`${pct}%`} theme={theme} />
            </div>

            {/* Progresso */}
            <div className="mt-4">
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${theme.secondaryColor}, ${theme.primaryColor})` }} />
              </div>
            </div>

            {/* Contagens regressivas */}
            {raffle.status === 'scheduled' && raffle.startsAt && (
              <CountdownBox label="Começa em" date={raffle.startsAt} theme={theme} onComplete={loadDetail} />
            )}
            {raffle.status === 'open' && raffle.endsAt && (
              <CountdownBox label="Encerra em" date={raffle.endsAt} theme={theme} onComplete={loadDetail} />
            )}
          </div>
        </div>

        {/* Estado: sorteio ao vivo / resultado */}
        {isDrawingOrDone && (
          <div className="mb-6">
            <DrawOverlay
              status={raffle.status === 'finished' ? 'finished' : 'drawing'}
              winners={raffle.winners.map(w => ({ number: w.number, participantName: w.participantName, prizeName: w.prizeName }))}
              totalNumbers={raffle.totalNumbers}
              prizeName={raffle.prizeName}
              theme={theme}
            />
          </div>
        )}

        {raffle.status === 'cancelled' && (
          <div className="rounded-2xl p-6 text-center mb-6" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <AlertCircle size={32} className="mx-auto text-red-400 mb-2" />
            <p className="text-white font-semibold">Esta rifa foi cancelada.</p>
            <p className="text-white/60 text-sm mt-1">Compras não estão disponíveis.</p>
          </div>
        )}

        {/* Prêmio */}
        <div className="rounded-2xl p-5 sm:p-6 mb-6" style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${theme.primaryColor}22` }}>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: theme.primaryColor }}><Gift size={18} /> O prêmio</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            {raffle.prizeImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={raffle.prizeImageUrl} alt={raffle.prizeName} className="w-full sm:w-48 h-40 object-cover rounded-xl" />
            )}
            <div>
              <h3 className="text-xl font-bold" style={{ color: theme.light ? '#111' : '#fff' }}>{raffle.prizeName}</h3>
              {raffle.prizeDescription && <p className="mt-1 text-sm opacity-70" style={{ color: theme.light ? '#333' : '#fff' }}>{raffle.prizeDescription}</p>}
            </div>
          </div>
        </div>

        {/* Seleção de números (apenas se aberta) */}
        {isOpen && (
          <div className="rounded-2xl p-5 sm:p-6 mb-6" style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${theme.primaryColor}22` }}>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: theme.primaryColor }}><Ticket size={18} /> Escolha seus números</h2>
            <NumberGrid
              totalNumbers={raffle.totalNumbers}
              soldNumbers={soldNumbers}
              reservedNumbers={reservedNumbers}
              selected={selected}
              onChange={setSelected}
              theme={theme}
              disabled={showCheckout}
            />
          </div>
        )}

        {/* Checkout */}
        {isOpen && selected.length > 0 && (
          <div className="rounded-2xl p-5 sm:p-6" style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${theme.primaryColor}44` }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: theme.primaryColor }}><ShieldCheck size={18} /> Finalizar compra</h2>
              <div className="text-right">
                <div className="text-xs opacity-60" style={{ color: theme.light ? '#333' : '#fff' }}>{selected.length} × {formatBRL(raffle.pricePerNumber)}</div>
                <div className="text-2xl font-extrabold" style={{ color: theme.primaryColor }}>{formatBRL(amount)}</div>
              </div>
            </div>

            {!showCheckout ? (
              <div className="space-y-3 max-w-lg">
                <Field icon={<User size={15} />} placeholder="Nome completo" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} theme={theme} />
                <Field icon={<Mail size={15} />} placeholder="E-mail" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} theme={theme} type="email" />
                <Field icon={<Phone size={15} />} placeholder="Celular / WhatsApp" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} theme={theme} />
                {formError && <p className="text-sm text-red-400 flex items-center gap-1.5"><AlertCircle size={14} /> {formError}</p>}
                <button
                  onClick={() => { if (validateForm()) setShowCheckout(true) }}
                  className="w-full rounded-xl py-3 font-bold transition active:scale-[0.99]"
                  style={{ background: `linear-gradient(135deg, ${theme.secondaryColor}, ${theme.primaryColor})`, color: '#08130d' }}
                >
                  Ir para o pagamento • {formatBRL(amount)}
                </button>
              </div>
            ) : (
              <div>
                <button onClick={() => setShowCheckout(false)} className="text-sm mb-3 inline-flex items-center gap-1 opacity-70 hover:opacity-100" style={{ color: theme.light ? '#333' : '#fff' }}>
                  <ArrowLeft size={14} /> Editar dados
                </button>
                {publicKey ? (
                  <MercadoPagoCheckout
                    publicKey={publicKey}
                    amount={amount}
                    description={`Rifa: ${raffle.name}`}
                    endpoint={`/api/raffles/${raffle.id}/checkout`}
                    extraBody={{ numbers: selected, name: form.name, email: form.email, phone: form.phone }}
                    payerEmailHint={form.email}
                    payerNameHint={form.name}
                    analytics={{ productId: raffle.id, productTitle: raffle.name, productType: 'product', source: 'rifas' }}
                    onApproved={() => {
                      setSelected([])
                      setShowCheckout(false)
                      loadDetail()
                    }}
                  />
                ) : (
                  <p className="text-sm text-red-400">Pagamento indisponível no momento.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Regras */}
        {raffle.rules && (
          <div className="rounded-2xl p-5 mt-6" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 className="text-sm font-bold mb-2 flex items-center gap-2 opacity-80" style={{ color: theme.light ? '#222' : '#fff' }}><Info size={15} /> Regras e observações</h3>
            <p className="text-sm whitespace-pre-wrap opacity-70" style={{ color: theme.light ? '#333' : '#fff' }}>{raffle.rules}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ icon, label, value, theme, highlight }: { icon: React.ReactNode; label: string; value: string; theme: any; highlight?: boolean }) {
  return (
    <div className="rounded-xl p-3" style={{ background: highlight ? `${theme.primaryColor}1a` : 'rgba(255,255,255,0.05)', border: `1px solid ${theme.primaryColor}22` }}>
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide opacity-60" style={{ color: theme.light ? '#333' : '#fff' }}>
        <span style={{ color: theme.primaryColor }}>{icon}</span> {label}
      </div>
      <div className="mt-1 text-lg font-extrabold" style={{ color: highlight ? theme.primaryColor : theme.light ? '#111' : '#fff' }}>{value}</div>
    </div>
  )
}

function CountdownBox({ label, date, theme, onComplete }: { label: string; date: string; theme: any; onComplete: () => void }) {
  return (
    <div className="mt-4 rounded-xl p-3 flex items-center gap-3" style={{ background: `${theme.primaryColor}12`, border: `1px solid ${theme.primaryColor}33` }}>
      <Clock size={18} style={{ color: theme.primaryColor }} />
      <span className="text-sm font-semibold opacity-80" style={{ color: theme.light ? '#222' : '#fff' }}>{label}:</span>
      <span className="text-sm font-bold" style={{ color: theme.primaryColor }}>
        <CompactCountdown targetDate={date} onComplete={onComplete} />
      </span>
    </div>
  )
}

function Field({ icon, placeholder, value, onChange, theme, type = 'text' }: { icon: React.ReactNode; placeholder: string; value: string; onChange: (v: string) => void; theme: any; type?: string }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: theme.primaryColor, opacity: 0.7 }}>{icon}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none"
        style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${theme.primaryColor}33`, color: theme.light ? '#111' : '#fff' }}
      />
    </div>
  )
}
