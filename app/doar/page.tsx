'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, Loader2, AlertCircle, ChevronLeft, CheckCircle2, Lock } from 'lucide-react'
import { MercadoPagoCheckout } from '@/components/payments/mercado-pago-checkout'

const PRESETS = [10, 25, 50, 100, 250]

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #1a0510 0%, #0d0a15 50%, #120616 100%)',
  padding: '24px 16px',
}

const glassCard: React.CSSProperties = {
  background: 'rgba(30,10,20,0.8)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(251,113,133,0.15)',
  borderRadius: '20px',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: 'rgba(251,113,133,0.8)',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const glassInput: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(251,113,133,0.2)',
  color: 'white',
  borderRadius: '10px',
  padding: '10px 14px',
  width: '100%',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
}

const roseBtn: React.CSSProperties = {
  background: 'linear-gradient(135deg, #be185d, #f43f5e)',
  boxShadow: '0 0 30px rgba(244,63,94,0.3)',
  border: 'none',
  borderRadius: '12px',
  color: 'white',
  fontWeight: 700,
  fontSize: '15px',
  padding: '12px 28px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'opacity 0.2s',
}

function ghostBtn(): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    background: 'transparent', border: 'none',
    color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '14px',
    marginBottom: '24px', padding: '0',
  }
}

export default function DoarPage() {
  const router = useRouter()
  const [step, setStep] = useState<'choose' | 'online' | 'manual'>('choose')
  const [amount, setAmount] = useState<number>(25)
  const [customAmount, setCustomAmount] = useState('')
  const [donorName, setDonorName] = useState('')
  const [donorAlias, setDonorAlias] = useState('')
  const [donorEmail, setDonorEmail] = useState('')
  const [donorMessage, setDonorMessage] = useState('')
  const [publicKey, setPublicKey] = useState('')
  const [pkLoading, setPkLoading] = useState(true)
  const [pkError, setPkError] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPkLoading(false)
      if (!publicKey) setPkError(true)
    }, 10000)

    fetch('/api/payments/public-key')
      .then(r => r.json())
      .then(d => {
        const pk = d.publicKey || ''
        setPublicKey(pk)
        if (!pk) setPkError(true)
      })
      .catch(() => setPkError(true))
      .finally(() => {
        setPkLoading(false)
        clearTimeout(timeout)
      })

    return () => clearTimeout(timeout)
  }, [])

  const finalAmount = customAmount ? Number(customAmount.replace(',', '.')) : amount

  if (step === 'choose') {
    return (
      <div style={pageStyle}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <button onClick={() => router.push('/')} style={ghostBtn()}>
            <ChevronLeft size={16} /> Voltar
          </button>

          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Heart size={32} style={{ color: '#f43f5e' }} />
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: '10px' }}>
              Apoie o DomineAqui
            </h1>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.6' }}>
              Sua doação ajuda a manter a plataforma gratuita para milhares de estudantes.
            </p>
          </div>

          {/* Choice cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <button
              onClick={() => setStep('online')}
              style={{
                ...glassCard,
                padding: '22px 24px',
                cursor: 'pointer',
                textAlign: 'left',
                border: '1px solid rgba(244,63,94,0.2)',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'rgba(244,63,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Heart size={18} style={{ color: '#f43f5e' }} />
                </div>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>Pagar pela plataforma</span>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5', marginLeft: '48px' }}>
                Cartão, Pix ou boleto. A doação é registrada automaticamente após confirmação.
              </p>
            </button>

            <button
              onClick={() => setStep('manual')}
              style={{
                ...glassCard,
                padding: '22px 24px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <CheckCircle2 size={18} style={{ color: 'rgba(255,255,255,0.5)' }} />
                </div>
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>Já paguei pelo app do banco</span>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5', marginLeft: '48px' }}>
                Você fez o Pix direto pelo banco e quer registrar sua doação para aparecer no ranking.
              </p>
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '24px' }}>
            🔒 Dados protegidos · Mercado Pago
          </p>
        </div>
      </div>
    )
  }

  if (step === 'manual') {
    return <ManualDonationStep onBack={() => setStep('choose')} />
  }

  // step === 'online'
  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <button onClick={() => setStep('choose')} style={ghostBtn()}>
          <ChevronLeft size={16} /> Voltar
        </button>

        <div style={{ ...glassCard, padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <Heart size={20} style={{ color: '#f43f5e' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>Doação online</h2>
          </div>

          {/* Amount presets */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Valor</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
              {PRESETS.map(v => (
                <button
                  type="button"
                  key={v}
                  onClick={() => { setAmount(v); setCustomAmount('') }}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    border: (!customAmount && amount === v) ? '1px solid rgba(244,63,94,0.6)' : '1px solid rgba(255,255,255,0.1)',
                    background: (!customAmount && amount === v) ? 'rgba(244,63,94,0.2)' : 'rgba(255,255,255,0.04)',
                    color: (!customAmount && amount === v) ? '#f43f5e' : 'rgba(255,255,255,0.7)',
                    fontWeight: (!customAmount && amount === v) ? 700 : 400,
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s',
                  }}
                >
                  R$ {v}
                </button>
              ))}
            </div>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Outro valor (R$)"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              style={glassInput}
            />
            {finalAmount < 1 && customAmount && (
              <p style={{ fontSize: '12px', color: '#f87171', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={12} /> Mínimo R$ 1,00
              </p>
            )}
          </div>

          {/* Donor info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Nome completo (opcional)</label>
              <input style={glassInput} value={donorName} onChange={(e) => setDonorName(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Apelido (público)</label>
              <input style={glassInput} value={donorAlias} onChange={(e) => setDonorAlias(e.target.value)} placeholder="Anônimo" />
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>E-mail (recomendado)</label>
            <input type="email" style={glassInput} value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)} placeholder="seu@email.com" />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Mensagem (opcional)</label>
            <textarea
              rows={2}
              value={donorMessage}
              onChange={(e) => setDonorMessage(e.target.value)}
              maxLength={500}
              style={{ ...glassInput, resize: 'vertical', minHeight: '64px' }}
            />
          </div>

          {/* Checkout */}
          {finalAmount >= 1 && !pkLoading && !pkError && publicKey && (
            <MercadoPagoCheckout
              publicKey={publicKey}
              amount={finalAmount}
              description={`Doação DomineAqui — ${donorAlias || donorName || 'Anônimo'}`}
              endpoint="/api/donations/checkout"
              extraBody={{
                amount: finalAmount,
                donationName: donorName || donorAlias || 'Anônimo',
                donationAlias: donorAlias || donorName || 'Anônimo',
                donationMessage: donorMessage || undefined,
                donationEmail: donorEmail || undefined,
              }}
              payerNameHint={donorName}
              payerEmailHint={donorEmail}
              onApproved={() => {
                setTimeout(() => router.push('/doar/sucesso'), 1500)
              }}
            />
          )}
          {pkLoading && (
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Loader2 size={14} className="animate-spin" /> Carregando integração de pagamento...
            </p>
          )}
          {!pkLoading && pkError && (
            <div style={{
              padding: '14px', background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px',
              color: '#fca5a5', fontSize: '13px',
            }}>
              Não foi possível carregar a integração de pagamento. Tente recarregar a página ou volte mais tarde.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ManualDonationStep({ onBack }: { onBack: () => void }) {
  const router = useRouter()
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [apelido, setApelido] = useState('')
  const [valor, setValor] = useState('')
  const [dataDoacao, setDataDoacao] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/doacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeCompleto,
          apelido,
          valor: Number(valor.replace(',', '.')),
          dataDoacao,
          mensagem: mensagem || undefined,
          paymentSource: 'manual',
        }),
      })
      if (res.status === 401) {
        setError('__auth__')
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha ao registrar doação')
      setSuccess(true)
    } catch (err: any) {
      setError(err?.message || 'Erro ao registrar doação')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        <button onClick={onBack} style={ghostBtn()}>
          <ChevronLeft size={16} /> Voltar
        </button>

        <div style={{ ...glassCard, padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <CheckCircle2 size={20} style={{ color: '#f43f5e' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white' }}>Registrar doação feita pelo banco</h2>
          </div>

          {success ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <CheckCircle2 size={48} style={{ color: '#34d399', margin: '0 auto 14px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>Doação registrada!</h3>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.6' }}>
                Um administrador irá revisar em breve e sua doação aparecerá no ranking.
              </p>
            </div>
          ) : error === '__auth__' ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Lock size={40} style={{ color: 'rgba(255,255,255,0.4)', margin: '0 auto 14px' }} />
              <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', marginBottom: '16px' }}>
                Faça login para registrar sua doação.
              </p>
              <a
                href="/auth/login"
                style={{
                  ...roseBtn,
                  textDecoration: 'none',
                }}
              >
                Entrar / Criar conta
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Nome completo *</label>
                <input
                  required
                  value={nomeCompleto}
                  onChange={e => setNomeCompleto(e.target.value)}
                  style={glassInput}
                  placeholder="Seu nome completo"
                />
              </div>
              <div>
                <label style={labelStyle}>Apelido / Nickname *</label>
                <input
                  required
                  value={apelido}
                  onChange={e => setApelido(e.target.value)}
                  style={glassInput}
                  placeholder="Como quer aparecer no ranking"
                />
              </div>
              <div>
                <label style={labelStyle}>Valor doado (R$) *</label>
                <input
                  required
                  type="text"
                  inputMode="decimal"
                  value={valor}
                  onChange={e => setValor(e.target.value)}
                  style={glassInput}
                  placeholder="0,00"
                />
              </div>
              <div>
                <label style={labelStyle}>Data da doação *</label>
                <input
                  required
                  type="date"
                  max={today}
                  value={dataDoacao}
                  onChange={e => setDataDoacao(e.target.value)}
                  style={{ ...glassInput, colorScheme: 'dark' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Mensagem (opcional)</label>
                <textarea
                  rows={3}
                  value={mensagem}
                  onChange={e => setMensagem(e.target.value)}
                  maxLength={500}
                  style={{ ...glassInput, resize: 'vertical', minHeight: '72px' }}
                  placeholder="Deixe uma mensagem de apoio..."
                />
              </div>

              {error && error !== '__auth__' && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '12px 16px', background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px',
                  color: '#f87171', fontSize: '13px',
                }}>
                  <AlertCircle size={16} style={{ marginTop: '1px', flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{ ...roseBtn, width: '100%', justifyContent: 'center', opacity: submitting ? 0.6 : 1 }}
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                Registrar doação
              </button>

              <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                🔒 Dados protegidos · Mercado Pago
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
