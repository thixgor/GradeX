'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, ShieldCheck, User, Mail, Phone, ArrowRight, ChevronLeft } from 'lucide-react'
import { MercadoPagoCheckout } from '@/components/payments/mercado-pago-checkout'

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #020d06 0%, #031a0b 40%, #041408 100%)',
  padding: '28px 16px',
}
const glassCard: React.CSSProperties = {
  background: 'rgba(6,20,10,0.85)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(52,211,153,0.15)',
  borderRadius: '20px',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(52,211,153,0.8)',
  marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em',
}
const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(52,211,153,0.2)', color: 'white', borderRadius: '10px',
  padding: '12px 14px', fontSize: '14px', outline: 'none',
}

interface Product {
  productType: string
  productTypeLabel: string
  productId: string
  productTitle: string
  amount: number
  description: string
}

function isEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) }
function digits(v: string) { return v.replace(/\D/g, '') }

function ComprarContent() {
  const params = useSearchParams()
  const productType = params.get('productType') || ''
  const productId = params.get('productId') || ''
  const planKey = params.get('planKey') || ''
  const itemType = params.get('itemType') || ''

  const [product, setProduct] = useState<Product | null>(null)
  const [publicKey, setPublicKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [step, setStep] = useState<'buyer' | 'payment'>('buyer')
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!productType) { setError('Produto não informado.'); setLoading(false); return }
    const qs = new URLSearchParams({ productType })
    if (productId) qs.set('productId', productId)
    if (planKey) qs.set('planKey', planKey)
    if (itemType) qs.set('itemType', itemType)
    Promise.all([
      fetch(`/api/serial-keys/checkout?${qs.toString()}`).then(r => r.json()),
      fetch('/api/payments/public-key').then(r => r.json()),
    ])
      .then(([prod, pk]) => {
        if (prod.error) { setError(prod.error); return }
        setProduct(prod)
        setPublicKey(pk.publicKey || '')
      })
      .catch(() => setError('Falha ao carregar o produto.'))
      .finally(() => setLoading(false))
  }, [productType, productId, planKey, itemType])

  const nameValid = name.trim().includes(' ') && name.trim().length >= 3
  const emailValid = isEmail(email.trim())
  const phoneValid = digits(phone).length >= 10 && digits(phone).length <= 15
  const buyerValid = nameValid && emailValid && phoneValid

  const extraBody = useMemo(() => ({
    productType, productId: productId || undefined, planKey: planKey || undefined,
    itemType: itemType || undefined,
    buyerName: name.trim(), buyerEmail: email.trim().toLowerCase(), buyerPhone: phone.trim(),
  }), [productType, productId, planKey, itemType, name, email, phone])

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><Loader2 size={32} style={{ color: '#34d399', animation: 'spin 1s linear infinite' }} /></div>
  }
  if (error || !product) {
    return <div style={{ maxWidth: '520px', margin: '0 auto' }}><div style={{ ...glassCard, padding: '28px', color: '#f87171', textAlign: 'center' }}>{error || 'Produto indisponível.'}</div></div>
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'white', marginBottom: '6px', letterSpacing: '-0.02em' }}>Finalizar compra</h1>
      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '28px' }}>
        Compra rápida e segura — você recebe sua <strong style={{ color: '#34d399' }}>Serial Key</strong> por e-mail, mesmo sem ter conta.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr)', gap: '24px', alignItems: 'start' }} className="checkout-grid">
        {/* Resumo do produto */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ ...glassCard, padding: '26px' }}>
            <div style={{ display: 'inline-block', background: 'linear-gradient(135deg, #059669, #34d399)', borderRadius: '10px', padding: '5px 12px', fontSize: '12px', fontWeight: 700, color: 'white', marginBottom: '12px' }}>
              {product.productTypeLabel}
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'white', marginBottom: '16px' }}>{product.productTitle}</h2>
            <div style={{ padding: '16px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.12)', borderRadius: '12px' }}>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>Valor</p>
              <p style={{ fontSize: '30px', fontWeight: 800, color: '#34d399', letterSpacing: '-0.03em' }}>R$ {product.amount.toFixed(2).replace('.', ',')}</p>
            </div>
          </div>
          <div style={{ ...glassCard, padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              <ShieldCheck size={16} style={{ color: '#34d399' }} /> Pagamento 100% seguro · Mercado Pago
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              <Mail size={16} style={{ color: '#34d399' }} /> Serial Key enviada por e-mail com QR e comprovante
            </div>
          </div>
        </div>

        {/* Formulário / pagamento */}
        <div style={{ ...glassCard, padding: '28px' }}>
          {step === 'buyer' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}><User size={12} style={{ display: 'inline', marginRight: 4 }} /> Nome completo</label>
                <input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} placeholder="Seu nome completo" style={inputStyle} />
                {touched && !nameValid && <span style={{ fontSize: '11px', color: '#f87171' }}>Informe nome e sobrenome.</span>}
              </div>
              <div>
                <label style={labelStyle}><Mail size={12} style={{ display: 'inline', marginRight: 4 }} /> E-mail</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched(true)} type="email" placeholder="seu@email.com" style={inputStyle} />
                {touched && !emailValid && <span style={{ fontSize: '11px', color: '#f87171' }}>E-mail inválido.</span>}
              </div>
              <div>
                <label style={labelStyle}><Phone size={12} style={{ display: 'inline', marginRight: 4 }} /> Telefone (com DDD)</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={() => setTouched(true)} placeholder="(00) 00000-0000" style={inputStyle} />
                {touched && !phoneValid && <span style={{ fontSize: '11px', color: '#f87171' }}>Telefone inválido.</span>}
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                Usamos esses dados para vincular sua compra, gerar sua Serial Key e enviar o comprovante. Não é necessário criar conta agora.
              </p>
              <button
                onClick={() => { setTouched(true); if (buyerValid) setStep('payment') }}
                disabled={!buyerValid}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  background: 'linear-gradient(135deg, #059669, #34d399)', boxShadow: '0 0 30px rgba(52,211,153,0.3)',
                  border: 'none', borderRadius: '12px', color: 'white', fontWeight: 700, fontSize: '15px',
                  padding: '14px 24px', width: '100%', cursor: buyerValid ? 'pointer' : 'not-allowed', opacity: buyerValid ? 1 : 0.6,
                }}
              >
                Ir para pagamento <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div>
              <button onClick={() => setStep('buyer')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '13px', marginBottom: '16px', padding: 0 }}>
                <ChevronLeft size={14} /> Editar meus dados
              </button>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px 14px', marginBottom: '18px', fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>
                Comprando como <strong style={{ color: 'white' }}>{name}</strong> · {email} · {phone}
              </div>
              <MercadoPagoCheckout
                publicKey={publicKey}
                amount={product.amount}
                description={product.productTitle}
                endpoint="/api/serial-keys/checkout"
                extraBody={extraBody}
                payerEmailHint={email}
                payerNameHint={name}
                analytics={{ productId: product.productId, productTitle: product.productTitle, productType: 'product', source: 'Serial Key' }}
                onApproved={(resp) => { window.location.href = (resp as any).successRedirect || '/compra/aprovada' }}
              />
            </div>
          )}
        </div>
      </div>
      <style>{`@media (max-width: 860px){ .checkout-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}

export default function ComprarPage() {
  return (
    <div style={pageStyle}>
      <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><Loader2 size={32} style={{ color: '#34d399', animation: 'spin 1s linear infinite' }} /></div>}>
        <ComprarContent />
      </Suspense>
    </div>
  )
}
