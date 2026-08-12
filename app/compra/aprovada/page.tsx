'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Loader2, CheckCircle2, Copy, Check, QrCode, KeyRound, ArrowRight,
  ShieldCheck, Mail, Clock, AlertCircle,
} from 'lucide-react'

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #020d06 0%, #031a0b 40%, #041408 100%)',
  padding: '32px 16px',
}
const glassCard: React.CSSProperties = {
  background: 'rgba(6,20,10,0.85)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(52,211,153,0.15)',
  borderRadius: '20px',
}

interface TimedAccessInfo {
  accessMode?: 'lifetime' | 'timed'
  accessVersionLabel?: string | null
  accessDurationLabel?: string | null
  /** Só existe depois da ativação — antes dela o prazo nem começou. */
  accessExpiresAt?: string | null
}

interface Purchase extends TimedAccessInfo {
  approved: boolean
  status: string
  statusLabel: string
  productType?: string
  productTypeLabel?: string
  productTitle?: string
  amount?: number
  buyerName?: string
  buyerFirstName?: string
  buyerEmail?: string
  buyerPhone?: string
  serialKey?: string | null
  activationUrl?: string
  qrDataUrl?: string
  isCart?: boolean
  serialKeys?: Array<{
    key: string
    productTitle?: string
    productTypeLabel?: string
    amount?: number
    activationUrl?: string
    qrDataUrl?: string
  } & TimedAccessInfo>
  transactionId?: string
  createdAt?: string
  paidAt?: string
  pix?: { qrCode: string; qrCodeBase64: string } | null
  generating?: boolean
}

function CopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch {} }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        background: copied ? 'rgba(52,211,153,0.25)' : 'rgba(52,211,153,0.15)',
        border: '1px solid rgba(52,211,153,0.4)', color: '#34d399',
        borderRadius: '10px', padding: '10px 16px', cursor: 'pointer',
        fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap',
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? 'Copiado!' : label}
    </button>
  )
}

/**
 * Aviso de acesso por tempo no comprovante. Enquanto a key não é ativada, a
 * data de fim ainda não existe — e é exatamente isso que o comprador precisa
 * ler: o prazo não corre enquanto ele não ativar.
 */
function TimedAccessReceiptNote({
  durationLabel,
  versionLabel,
  expiresAt,
}: {
  durationLabel: string
  versionLabel?: string | null
  expiresAt?: string | null
}) {
  const expiresLabel = expiresAt
    ? new Date(expiresAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : ''
  return (
    <div style={{
      background: 'rgba(56,189,248,0.08)',
      border: '1px solid rgba(56,189,248,0.28)',
      borderRadius: '12px',
      padding: '12px 14px',
      textAlign: 'left',
    }}>
      <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#7dd3fc', marginBottom: '6px' }}>
        <Clock size={13} /> {versionLabel || 'Acesso temporário'} · {durationLabel}
      </p>
      <p style={{ fontSize: '12px', lineHeight: 1.6, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
        {expiresLabel
          ? <>Seu acesso já está ativo e vai até <strong style={{ color: 'white' }}>{expiresLabel}</strong>.</>
          : <>A contagem de <strong style={{ color: 'white' }}>{durationLabel}</strong> começa quando você <strong style={{ color: 'white' }}>ativar esta Serial Key</strong> — comprar hoje e ativar depois não consome o seu prazo, e se você já tem acesso a este item o prazo é somado ao que ainda resta.</>}
        {' '}Esta modalidade é de leitura no visualizador protegido da plataforma, <strong style={{ color: 'white' }}>sem download</strong>.
      </p>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>{label}</span>
      <span style={{ fontSize: '13px', color: 'white', fontWeight: 600, textAlign: 'right' }}>{value || '—'}</span>
    </div>
  )
}

function ApprovedView({ data }: { data: Purchase }) {
  const firstName = data.buyerFirstName || (data.buyerName || 'Comprador').split(' ')[0]
  const dateStr = data.paidAt || data.createdAt
    ? new Date(data.paidAt || data.createdAt!).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Selo + animação */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 16 }}
        style={{ ...glassCard, padding: '36px 28px', textAlign: 'center', border: '1px solid rgba(52,211,153,0.4)', boxShadow: '0 0 60px rgba(52,211,153,0.18)' }}
      >
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 14 }}
          style={{ width: '84px', height: '84px', margin: '0 auto 8px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.25), rgba(52,211,153,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <CheckCircle2 size={56} style={{ color: '#34d399' }} />
        </motion.div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #059669, #34d399)', borderRadius: '999px', padding: '5px 14px', fontSize: '12px', fontWeight: 800, color: 'white', letterSpacing: '0.04em', marginBottom: '14px' }}>
          <ShieldCheck size={14} /> COMPRA APROVADA
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'white', marginBottom: '10px', letterSpacing: '-0.02em' }}>
          Obrigado pela compra, {firstName}! 🎉
        </h1>
        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', maxWidth: '560px', margin: '0 auto' }}>
          Seu acesso foi aprovado com sucesso. Enviamos todas as informações da compra e ativação para o e-mail{' '}
          <strong style={{ color: '#34d399' }}>{data.buyerEmail}</strong>. Guarde sua Serial Key com segurança e use o botão abaixo para ativar seu produto.
        </p>
      </motion.div>

      {/* Serial Key(s) */}
      {data.isCart && data.serialKeys && data.serialKeys.length > 1 ? (
        <div style={{ ...glassCard, padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <KeyRound size={18} style={{ color: '#34d399' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(52,211,153,0.85)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Suas {data.serialKeys.length} Serial Keys — uma por produto
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {data.serialKeys.map((sk, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '18px' }}>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginBottom: '2px' }}>{sk.productTypeLabel}</p>
                <p style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: sk.accessMode === 'timed' ? '6px' : '12px' }}>{sk.productTitle}</p>
                {sk.accessMode === 'timed' && sk.accessDurationLabel && (
                  <TimedAccessReceiptNote
                    durationLabel={sk.accessDurationLabel}
                    versionLabel={sk.accessVersionLabel}
                    expiresAt={sk.accessExpiresAt}
                  />
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                  {sk.qrDataUrl && <img src={sk.qrDataUrl} alt="QR" style={{ width: '110px', height: '110px', borderRadius: '10px', background: 'white', padding: '6px' }} />}
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ background: 'linear-gradient(135deg, rgba(5,150,105,0.18), rgba(52,211,153,0.08))', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '10px', padding: '12px', textAlign: 'center', marginBottom: '10px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: 800, color: '#34d399', letterSpacing: '2px', wordBreak: 'break-all' }}>{sk.key}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      <CopyButton text={sk.key} label="Copiar key" />
                      {sk.activationUrl && <CopyButton text={sk.activationUrl} label="Copiar link" />}
                      {sk.activationUrl && (
                        <a href={sk.activationUrl} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #059669, #34d399)', border: 'none', borderRadius: '10px', color: 'white', fontWeight: 700, fontSize: '13px', padding: '10px 16px', textDecoration: 'none' }}>
                          Ativar <ArrowRight size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div style={{ ...glassCard, padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <KeyRound size={18} style={{ color: '#34d399' }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(52,211,153,0.85)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sua Serial Key</span>
            </div>
            <div style={{ background: 'linear-gradient(135deg, rgba(5,150,105,0.18), rgba(52,211,153,0.08))', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '14px', padding: '20px', textAlign: 'center', marginBottom: '14px' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '26px', fontWeight: 800, color: '#34d399', letterSpacing: '3px', wordBreak: 'break-all' }}>
                {data.serialKey}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
              <CopyButton text={data.serialKey || ''} label="Copiar Serial Key" />
              {data.activationUrl && <CopyButton text={data.activationUrl} label="Copiar link de ativação" />}
            </div>
            {data.accessMode === 'timed' && data.accessDurationLabel && (
              <div style={{ marginTop: '14px' }}>
                <TimedAccessReceiptNote
                  durationLabel={data.accessDurationLabel}
                  versionLabel={data.accessVersionLabel}
                  expiresAt={data.accessExpiresAt}
                />
              </div>
            )}
          </div>

          {/* QR + ativar */}
          <div style={{ ...glassCard, padding: '24px', display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center', justifyContent: 'center' }}>
            {data.qrDataUrl && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                  <QrCode size={14} /> QR Code de ativação
                </div>
                <img src={data.qrDataUrl} alt="QR Code de ativação" style={{ width: '180px', height: '180px', borderRadius: '12px', background: 'white', padding: '8px' }} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: '240px' }}>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', marginBottom: '16px' }}>
                Ative seu produto agora. Se ainda não tiver conta, você poderá criar uma em segundos — o produto aparecerá liberado automaticamente.
              </p>
              {data.activationUrl && (
                <a
                  href={data.activationUrl}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    background: 'linear-gradient(135deg, #059669, #34d399)', boxShadow: '0 0 30px rgba(52,211,153,0.3)',
                    border: 'none', borderRadius: '12px', color: 'white', fontWeight: 700, fontSize: '15px',
                    padding: '14px 24px', cursor: 'pointer', width: '100%', textDecoration: 'none',
                  }}
                >
                  Ativar meu produto <ArrowRight size={16} />
                </a>
              )}
            </div>
          </div>
        </>
      )}

      {/* Resumo da compra */}
      <div style={{ ...glassCard, padding: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '12px' }}>Resumo da compra</h3>
        <SummaryRow label="Produto" value={`${data.productTitle || ''}${data.productTypeLabel ? ` (${data.productTypeLabel})` : ''}`} />
        <SummaryRow label="Valor pago" value={data.amount != null ? `R$ ${data.amount.toFixed(2).replace('.', ',')}` : undefined} />
        <SummaryRow
          label="Modalidade de acesso"
          value={data.accessMode === 'timed' && data.accessDurationLabel
            ? `${data.accessVersionLabel || 'Acesso temporário'} — ${data.accessDurationLabel} a partir da ativação, sem download`
            : 'Acesso vitalício'}
        />
        <SummaryRow label="Status do pagamento" value={data.statusLabel} />
        <SummaryRow label="Data e hora" value={dateStr} />
        <SummaryRow label="Nome completo" value={data.buyerName} />
        <SummaryRow label="E-mail" value={data.buyerEmail} />
        <SummaryRow label="Telefone" value={data.buyerPhone} />
        {data.transactionId && <SummaryRow label="ID da transação" value={data.transactionId} />}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
        <Mail size={13} /> Um comprovante em PDF também foi enviado ao seu e-mail.
      </div>
    </div>
  )
}

function PendingView({ data }: { data: Purchase }) {
  const isError = ['rejected', 'cancelled', 'expired', 'refunded', 'charged_back'].includes(data.status)
  return (
    <div style={{ maxWidth: '560px', margin: '0 auto' }}>
      <div style={{ ...glassCard, padding: '36px 28px', textAlign: 'center' }}>
        {isError ? (
          <>
            <AlertCircle size={48} style={{ color: '#f87171', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f87171', marginBottom: '8px' }}>{data.statusLabel}</h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Não foi possível confirmar seu pagamento. Você pode tentar novamente.</p>
          </>
        ) : (
          <>
            <Clock size={44} style={{ color: '#34d399', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>Aguardando confirmação do pagamento</h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '18px' }}>
              Assim que o pagamento for aprovado, sua Serial Key aparecerá aqui automaticamente e será enviada ao seu e-mail.
            </p>
            {data.pix?.qrCodeBase64 && (
              <img src={`data:image/png;base64,${data.pix.qrCodeBase64}`} alt="QR Pix" style={{ width: '180px', height: '180px', borderRadius: '12px', background: 'white', padding: '8px', margin: '0 auto 12px' }} />
            )}
            {data.pix?.qrCode && (
              <div style={{ marginTop: '10px' }}><CopyButton text={data.pix.qrCode} label="Copiar código Pix" /></div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '18px', fontSize: '12px', color: 'rgba(52,211,153,0.7)' }}>
              <Loader2 size={14} className="animate-spin" /> Esta página atualiza sozinha.
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function AprovadaContent() {
  const params = useSearchParams()
  const orderId = params.get('order') || ''
  const token = params.get('token') || ''
  const [data, setData] = useState<Purchase | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!orderId || !token) { setError('Link inválido.'); setLoading(false); return }
    let active = true
    const fetchOnce = async () => {
      try {
        const res = await fetch(`/api/serial-keys/purchase/${orderId}?token=${encodeURIComponent(token)}`, { cache: 'no-store' })
        const json = await res.json()
        if (!active) return
        if (!res.ok) { setError(json.error || 'Não foi possível carregar a compra.'); setLoading(false); return }
        setData(json)
        setLoading(false)
        // Para de pollar quando aprovado com key ou em estado de erro terminal.
        const terminalError = ['rejected', 'cancelled', 'expired', 'refunded', 'charged_back'].includes(json.status)
        if ((json.approved && json.serialKey) || terminalError) {
          if (timer.current) clearInterval(timer.current)
        }
      } catch {
        if (active) setLoading(false)
      }
    }
    fetchOnce()
    timer.current = setInterval(fetchOnce, 4000)
    return () => { active = false; if (timer.current) clearInterval(timer.current) }
  }, [orderId, token])

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><Loader2 size={32} style={{ color: '#34d399', animation: 'spin 1s linear infinite' }} /></div>
  }
  if (error) {
    return <div style={{ maxWidth: '520px', margin: '0 auto' }}><div style={{ ...glassCard, padding: '28px', color: '#f87171', textAlign: 'center' }}>{error}</div></div>
  }
  if (data?.approved && data.serialKey) return <ApprovedView data={data} />
  if (data?.approved && !data.serialKey) {
    return <div style={{ maxWidth: '520px', margin: '0 auto' }}><div style={{ ...glassCard, padding: '28px', textAlign: 'center', color: 'white' }}><Loader2 size={28} style={{ color: '#34d399', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} /><p>Pagamento aprovado! Gerando sua Serial Key…</p></div></div>
  }
  return <PendingView data={data as Purchase} />
}

export default function CompraAprovadaPage() {
  return (
    <div style={pageStyle}>
      <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><Loader2 size={32} style={{ color: '#34d399', animation: 'spin 1s linear infinite' }} /></div>}>
        <AprovadaContent />
      </Suspense>
    </div>
  )
}
