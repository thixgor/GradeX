'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Loader2, KeyRound, CheckCircle2, Clock, LogIn, UserPlus, ArrowRight, AlertCircle, ShieldCheck,
} from 'lucide-react'

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #020d06 0%, #031a0b 40%, #041408 100%)',
  padding: '32px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
const glassCard: React.CSSProperties = {
  background: 'rgba(6,20,10,0.85)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(52,211,153,0.15)',
  borderRadius: '20px',
  padding: '32px 28px',
  maxWidth: '520px',
  width: '100%',
}
const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  background: 'linear-gradient(135deg, #059669, #34d399)', boxShadow: '0 0 30px rgba(52,211,153,0.3)',
  border: 'none', borderRadius: '12px', color: 'white', fontWeight: 700, fontSize: '15px',
  padding: '14px 24px', cursor: 'pointer', width: '100%', textDecoration: 'none',
}
const ghostBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '12px', color: 'white', fontWeight: 600, fontSize: '14px',
  padding: '12px 20px', cursor: 'pointer', width: '100%', textDecoration: 'none',
}

interface KeyInfo {
  found: boolean
  legacy?: boolean
  productType?: string
  productTitle?: string
  status?: string
  amount?: number
  buyerFirstName?: string
  buyerEmail?: string
  alreadyActivated?: boolean
  cancelled?: boolean
  restrictActivationToBuyerEmail?: boolean
  // Acesso por tempo: o prazo só passa a correr a partir desta ativação.
  accessMode?: 'lifetime' | 'timed'
  accessVersionLabel?: string | null
  accessDurationLabel?: string | null
  accessExpiresAt?: string | null
}

function ActivarContent() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') || ''
  const keyParam = params.get('key') || ''
  const returnTo = `/ativar?${token ? `token=${encodeURIComponent(token)}` : `key=${encodeURIComponent(keyParam)}`}`

  const [info, setInfo] = useState<KeyInfo | null>(null)
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activating, setActivating] = useState(false)
  const [done, setDone] = useState<{ label: string; redirectTo: string } | null>(null)
  const [manualKey, setManualKey] = useState(keyParam)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const qs = token ? `token=${encodeURIComponent(token)}` : keyParam ? `key=${encodeURIComponent(keyParam)}` : ''
        const [meRes, infoRes] = await Promise.all([
          fetch('/api/auth/me', { cache: 'no-store' }).then(r => r.ok).catch(() => false),
          qs ? fetch(`/api/serial-keys/activate?${qs}`, { cache: 'no-store' }).then(r => r.json()).catch(() => null) : Promise.resolve(null),
        ])
        if (!active) return
        setLoggedIn(!!meRes)
        if (infoRes && infoRes.found) setInfo(infoRes)
        else if (qs) setError('Serial key não encontrada.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [token, keyParam])

  async function activate() {
    setActivating(true)
    setError('')
    try {
      const body: any = token ? { token } : { key: manualKey }
      const res = await fetch('/api/serial-keys/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (res.status === 401 || json.requiresAuth) {
        router.push(`/auth/login?redirect=${encodeURIComponent(returnTo)}`)
        return
      }
      if (!res.ok) { setError(json.error || 'Falha ao ativar.'); return }
      setDone({ label: json.productLabel || json.productTitle || 'Produto', redirectTo: json.redirectTo || '/dashboard' })
    } catch {
      setError('Erro ao ativar. Tente novamente.')
    } finally {
      setActivating(false)
    }
  }

  if (loading) {
    return <div style={glassCard}><div style={{ textAlign: 'center' }}><Loader2 size={30} style={{ color: '#34d399', animation: 'spin 1s linear infinite' }} /></div></div>
  }

  if (done) {
    return (
      <div style={glassCard}>
        <div style={{ textAlign: 'center' }}>
          <CheckCircle2 size={56} style={{ color: '#34d399', margin: '0 auto 16px' }} />
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'white', marginBottom: '10px' }}>Produto ativado! 🎉</h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)', marginBottom: info?.accessMode === 'timed' ? '14px' : '22px' }}>
            <strong style={{ color: '#34d399' }}>{done.label}</strong> foi liberado na sua conta.
          </p>
          {info?.accessMode === 'timed' && info.accessDurationLabel && (
            <p style={{
              fontSize: '13px',
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.7)',
              background: 'rgba(56,189,248,0.08)',
              border: '1px solid rgba(56,189,248,0.28)',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '22px',
              textAlign: 'left',
            }}>
              <strong style={{ color: '#7dd3fc' }}>Seu prazo começou agora:</strong> você tem{' '}
              <strong style={{ color: 'white' }}>{info.accessDurationLabel}</strong> de acesso, para leitura no
              visualizador protegido da plataforma (sem download). O tempo restante aparece na página do produto
              e dentro do leitor.
            </p>
          )}
          <a href={done.redirectTo} style={primaryBtn}>Acessar agora <ArrowRight size={16} /></a>
        </div>
      </div>
    )
  }

  const cancelled = info?.cancelled || info?.status === 'cancelled'
  const already = info?.alreadyActivated || info?.status === 'activated'

  return (
    <div style={glassCard}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <KeyRound size={22} style={{ color: '#34d399' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'white' }}>Ativar Serial Key</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Libere seu produto DomineAqui</p>
        </div>
      </div>

      {/* Sem token/key → campo manual */}
      {!token && !info && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(52,211,153,0.8)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Digite sua Serial Key</label>
          <input
            value={manualKey}
            onChange={(e) => setManualKey(e.target.value.toUpperCase())}
            placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(52,211,153,0.2)', color: 'white', borderRadius: '10px', padding: '12px 14px', fontSize: '14px', fontFamily: 'monospace', outline: 'none' }}
          />
        </div>
      )}

      {info && (
        <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginBottom: '4px' }}>Produto</p>
          <p style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>{info.productTitle || 'Produto'}</p>
        </div>
      )}

      {info?.accessMode === 'timed' && info.accessDurationLabel && !cancelled && (
        <div style={{ display: 'flex', gap: '10px', padding: '12px 16px', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.28)', borderRadius: '10px', color: 'rgba(255,255,255,0.75)', fontSize: '13px', marginBottom: '16px' }}>
          <Clock size={16} style={{ flexShrink: 0, marginTop: '1px', color: '#7dd3fc' }} />
          <span>
            {already && info.accessExpiresAt ? (
              <>
                Acesso por tempo limitado ({info.accessVersionLabel || info.accessDurationLabel}): vale até{' '}
                <strong style={{ color: 'white' }}>
                  {new Date(info.accessExpiresAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </strong>, para leitura na plataforma, sem download.
              </>
            ) : (
              <>
                Esta key libera <strong style={{ color: 'white' }}>{info.accessVersionLabel || 'acesso temporário'}</strong>: a contagem de{' '}
                <strong style={{ color: 'white' }}>{info.accessDurationLabel}</strong> começa <strong style={{ color: 'white' }}>agora</strong>, ao ativar.
                Leitura no visualizador protegido, sem download.
              </>
            )}
          </span>
        </div>
      )}

      {info?.restrictActivationToBuyerEmail && !cancelled && (
        <div style={{ display: 'flex', gap: '10px', padding: '12px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '10px', color: '#fbbf24', fontSize: '13px', marginBottom: '16px' }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>
            Ativação restrita ao e-mail da compra{info.buyerEmail ? <> (<strong>{info.buyerEmail}</strong>)</> : ''}. Entre com a conta desse e-mail — ou crie uma com ele — para ativar.
          </span>
        </div>
      )}

      {cancelled && (
        <div style={{ display: 'flex', gap: '10px', padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>
          <AlertCircle size={16} /> Esta serial key foi cancelada. Fale com o suporte.
        </div>
      )}

      {already && !cancelled && (
        <div style={{ display: 'flex', gap: '10px', padding: '12px 16px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '10px', color: '#34d399', fontSize: '13px', marginBottom: '16px' }}>
          <CheckCircle2 size={16} /> Esta serial key já foi ativada.
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', gap: '10px', padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {!cancelled && (
        loggedIn ? (
          <button onClick={activate} disabled={activating || (!token && !manualKey)} style={{ ...primaryBtn, opacity: (activating || (!token && !manualKey)) ? 0.6 : 1, cursor: (activating || (!token && !manualKey)) ? 'not-allowed' : 'pointer' }}>
            {activating ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            {already ? 'Reverificar ativação' : 'Ativar meu produto'}
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: '4px' }}>
              Faça login ou crie sua conta para ativar. É rápido e o produto aparecerá liberado automaticamente.
            </p>
            <a href={`/auth/login?redirect=${encodeURIComponent(returnTo)}`} style={primaryBtn}><LogIn size={16} /> Entrar e ativar</a>
            <a href={`/auth/register?redirect=${encodeURIComponent(returnTo)}`} style={ghostBtn}><UserPlus size={16} /> Criar conta</a>
          </div>
        )
      )}
    </div>
  )
}

export default function AtivarPage() {
  return (
    <div style={pageStyle}>
      <Suspense fallback={<div style={glassCard}><div style={{ textAlign: 'center' }}><Loader2 size={30} style={{ color: '#34d399', animation: 'spin 1s linear infinite' }} /></div></div>}>
        <ActivarContent />
      </Suspense>
    </div>
  )
}
