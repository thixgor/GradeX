'use client'

import { useState } from 'react'
import { Heart, Send, Calendar, DollarSign, User, Tag, MessageSquare, CheckCircle2, X } from 'lucide-react'

interface DoacaoFormProps {
  open: boolean
  onClose: () => void
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '10px',
  padding: '8px 12px',
  fontSize: '13px',
  color: 'rgba(255,255,255,0.90)',
  outline: 'none',
  boxSizing: 'border-box',
  colorScheme: 'dark',
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  fontSize: '11px',
  fontWeight: 600,
  color: 'rgba(255,255,255,0.45)',
  marginBottom: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

export function DoacaoForm({ open, onClose }: DoacaoFormProps) {
  const [form, setForm] = useState({
    nomeCompleto: '',
    apelido: '',
    valor: '',
    mensagem: '',
    dataDoacao: new Date().toISOString().split('T')[0],
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nomeCompleto.trim() || !form.apelido.trim() || !form.valor || !form.dataDoacao) {
      setError('Preencha todos os campos obrigatórios.')
      return
    }
    if (isNaN(Number(form.valor)) || Number(form.valor) <= 0) {
      setError('Insira um valor válido.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/doacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, valor: Number(form.valor) }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erro ao enviar. Tente novamente.')
        return
      }
      setSuccess(true)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    if (loading) return
    onClose()
    setTimeout(() => {
      setSuccess(false)
      setError('')
      setForm({ nomeCompleto: '', apelido: '', valor: '', mensagem: '', dataDoacao: new Date().toISOString().split('T')[0] })
    }, 300)
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{
        background: 'rgba(0,0,0,0.70)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        animation: 'doacaoFadeIn 0.2s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          animation: 'doacaoSlideUp 0.30s cubic-bezier(0.34,1.15,0.64,1)',
          background: 'linear-gradient(145deg, rgba(12,22,14,0.95) 0%, rgba(8,16,10,0.98) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(70,129,82,0.22)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Reflexo topo */}
        <div className="absolute top-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent pointer-events-none" />

        {!success ? (
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(220,38,38,0.20)', border: '1px solid rgba(239,68,68,0.22)' }}
                >
                  <span className="doacao-heart text-base leading-none">❤️</span>
                </div>
                <div>
                  <h2 className="font-bold text-white text-sm leading-tight">Registrar doação</h2>
                  <p className="text-emerald-400/55 text-[11px]">Entre no ranking de apoiadores</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <X className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
              </button>
            </div>

            {/* Divider */}
            <div className="mx-5 h-px mb-4" style={{ background: 'linear-gradient(90deg, transparent, rgba(70,129,82,0.30), transparent)' }} />

            {/* Fields */}
            <div className="px-5 space-y-3">

              {/* Nome completo */}
              <div>
                <label style={LABEL_STYLE}>
                  <User size={10} />
                  Nome completo <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  name="nomeCompleto"
                  value={form.nomeCompleto}
                  onChange={handleChange}
                  placeholder="Nome na conta bancária"
                  disabled={loading}
                  style={INPUT_STYLE}
                  autoComplete="off"
                />
              </div>

              {/* Apelido + Valor em 2 colunas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={LABEL_STYLE}>
                    <Tag size={10} />
                    Apelido público <span style={{ color: '#f87171' }}>*</span>
                  </label>
                  <input
                    name="apelido"
                    value={form.apelido}
                    onChange={handleChange}
                    placeholder="No ranking"
                    disabled={loading}
                    style={INPUT_STYLE}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>
                    <DollarSign size={10} />
                    Valor (R$) <span style={{ color: '#f87171' }}>*</span>
                  </label>
                  <div className="relative">
                    <span
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold pointer-events-none"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                    >R$</span>
                    <input
                      name="valor"
                      type="number"
                      min="1"
                      step="0.01"
                      value={form.valor}
                      onChange={handleChange}
                      placeholder="0,00"
                      disabled={loading}
                      style={{ ...INPUT_STYLE, paddingLeft: '32px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Data */}
              <div>
                <label style={LABEL_STYLE}>
                  <Calendar size={10} />
                  Data da doação <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  name="dataDoacao"
                  type="date"
                  value={form.dataDoacao}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  disabled={loading}
                  style={INPUT_STYLE}
                />
              </div>

              {/* Mensagem */}
              <div>
                <label style={LABEL_STYLE}>
                  <MessageSquare size={10} />
                  Mensagem <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span>
                </label>
                <textarea
                  name="mensagem"
                  value={form.mensagem}
                  onChange={handleChange}
                  placeholder="Deixe um recado para a comunidade…"
                  rows={2}
                  disabled={loading}
                  style={{ ...INPUT_STYLE, resize: 'none' }}
                />
              </div>

              {/* Erro */}
              {error && (
                <div
                  className="rounded-xl px-3 py-2 text-xs font-medium"
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}
                >
                  {error}
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="px-5 pt-4 pb-5 flex gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  color: 'rgba(255,255,255,0.45)',
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all active:scale-[0.98]"
                style={{
                  background: loading
                    ? 'rgba(190,24,93,0.35)'
                    : 'linear-gradient(135deg, rgba(190,24,93,0.80) 0%, rgba(219,39,119,0.70) 100%)',
                  border: '1px solid rgba(219,39,119,0.35)',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(190,24,93,0.25), inset 0 1px 0 rgba(255,255,255,0.10)',
                  color: loading ? 'rgba(255,182,203,0.5)' : 'rgba(255,182,203,0.95)',
                }}
              >
                {loading ? (
                  <>
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-pink-300/30 border-t-pink-300 animate-spin" />
                    Enviando…
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Enviar
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Sucesso */
          <div className="px-5 py-8 text-center">
            <div className="doacao-heart-confirm text-5xl leading-none mb-4">❤️</div>
            <h3 className="text-lg font-bold text-white mb-2">
              Obrigado, {form.apelido}! 🩺
            </h3>
            <p className="text-sm leading-relaxed mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Sua doação foi registrada e está em análise.<br />
              Após aprovação você entrará no ranking.
            </p>
            <p className="text-sm font-semibold mt-3 mb-5" style={{ color: 'rgba(134,239,172,0.85)' }}>
              Você está investindo em vidas. ❤️
            </p>
            <div
              className="flex items-center justify-center gap-1.5 text-xs rounded-xl px-4 py-2 mx-auto w-fit mb-5"
              style={{ background: 'rgba(70,129,82,0.15)', border: '1px solid rgba(70,129,82,0.25)', color: 'rgba(134,239,172,0.7)' }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Análise em até 48h
            </div>
            <button
              onClick={handleClose}
              className="px-8 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, rgba(70,129,82,0.70) 0%, rgba(52,211,153,0.55) 100%)',
                border: '1px solid rgba(70,129,82,0.40)',
                boxShadow: '0 4px 20px rgba(70,129,82,0.20)',
                color: 'rgba(167,243,208,0.95)',
              }}
            >
              Fechar
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes doacaoFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes doacaoSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
