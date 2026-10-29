'use client'

import { useCallback, useEffect, useState } from 'react'
import '@/components/checkout/checkout-vidro.css'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { AlertCircle, Check, Clock, Flame, Gift, Loader2, Package, ShoppingCart, Sparkles } from 'lucide-react'
import { useMaterialCart } from '@/context/MaterialCartContext'
import { useIntervaloVisivel } from '@/hooks/use-intervalo-visivel'

interface ItemDaVitrine {
  itemType: 'material' | 'package'
  itemId: string
  titulo: string
  materialType?: string
  preco: number
  precoFinal: number
}

interface CupomDaVitrine {
  codigo: string
  rotulo: string
  estado: 'ativo' | 'esgotado' | 'expirado' | 'inativo' | 'indisponivel'
  motivo?: string
  validoAte: string | null
  usosRestantes: number | null
}

interface RespostaDaOferta {
  oferta: {
    id: string
    titulo: string
    mensagem: string
    nome: string
    criadaEm: string
    previaDoAdmin: boolean
  }
  vitrine: {
    itens: ItemDaVitrine[]
    foraDaCompra: { itemType: string; itemId: string; titulo: string; motivo: string }[]
    subtotal: number
    desconto: number
    total: number
    cupom: CupomDaVitrine | null
  }
}

function reais(valor: number) {
  return `R$ ${Number(valor || 0).toFixed(2).replace('.', ',')}`
}

function tempoRestante(alvo: string | null, agora: number) {
  if (!alvo) return null
  const ms = new Date(alvo).getTime() - agora
  if (!Number.isFinite(ms) || ms <= 0) return null
  const s = Math.floor(ms / 1000)
  return {
    dias: Math.floor(s / 86400),
    horas: Math.floor((s % 86400) / 3600),
    minutos: Math.floor((s % 3600) / 60),
    segundos: s % 60,
  }
}

/*
 * A oferta mora no mundo do checkout: tema escuro de marca só nesta página,
 * aurora fixa atrás e vidro por cima (`checkout-vidro.css`).
 */
const MUNDO = 'dark ck-mundo ck-fundo-fixo'

const fundo: React.CSSProperties = {
  minHeight: '100vh',
  padding: '24px 16px 48px',
  color: 'white',
}

const vidro: React.CSSProperties = {
  position: 'relative',
  background: 'var(--ck-vidro-forte)',
  backdropFilter: 'blur(28px) saturate(170%)',
  WebkitBackdropFilter: 'blur(28px) saturate(170%)',
  boxShadow:
    'inset 0 1px 0 var(--ck-brilho), inset 0 0 0 1px var(--ck-borda), 0 0 0 1px var(--ck-contorno), 0 30px 60px -30px var(--ck-sombra)',
  border: '1px solid transparent',
  borderRadius: '26px',
}

export default function OfertaExclusivaPage() {
  const params = useParams()
  const router = useRouter()
  const id = String(params?.id || '')
  const { addItem } = useMaterialCart()

  const [dados, setDados] = useState<RespostaDaOferta | null>(null)
  const [erro, setErro] = useState<{ mensagem: string; precisaEntrar?: boolean } | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [indo, setIndo] = useState(false)
  const [agora, setAgora] = useState(() => Date.now())

  useEffect(() => {
    let vivo = true
    fetch(`/api/ofertas/${encodeURIComponent(id)}`, { cache: 'no-store' })
      .then(async (r) => {
        const corpo = await r.json().catch(() => ({}))
        if (!vivo) return
        if (!r.ok) {
          setErro({ mensagem: corpo.error || 'Não foi possível abrir a oferta.', precisaEntrar: r.status === 401 })
          return
        }
        setDados(corpo)
      })
      .catch(() => { if (vivo) setErro({ mensagem: 'Sem conexão. Tente de novo em instantes.' }) })
      .finally(() => { if (vivo) setCarregando(false) })
    return () => { vivo = false }
  }, [id])

  const cupom = dados?.vitrine.cupom || null
  const cupomVale = cupom?.estado === 'ativo'
  const contando = cupomVale && !!cupom?.validoAte
  const tick = useCallback(() => setAgora(Date.now()), [])
  useIntervaloVisivel(tick, contando ? 1000 : null)
  const restante = contando ? tempoRestante(cupom!.validoAte, agora) : null

  function comprar() {
    if (!dados) return
    setIndo(true)
    for (const item of dados.vitrine.itens) {
      addItem({
        itemType: item.itemType,
        itemId: item.itemId,
        title: item.titulo,
        pricing: item.preco > 0 ? 'paid' : 'free',
        price: item.preco,
        materialType: item.materialType,
      })
    }
    const query = new URLSearchParams({ cart: '1' })
    if (cupomVale && cupom) query.set('coupon', cupom.codigo)
    router.push(`/materiais/checkout?${query.toString()}`)
  }

  if (carregando) {
    return (
      <div className={MUNDO} style={{ ...fundo, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#34d399' }} />
      </div>
    )
  }

  if (erro || !dados) {
    return (
      <div style={fundo} className={MUNDO}>
        <div style={{ ...vidro, maxWidth: 520, margin: '64px auto', padding: 28, textAlign: 'center' }}>
          <AlertCircle className="mx-auto h-10 w-10" style={{ color: '#fbbf24' }} />
          <p style={{ marginTop: 14, fontSize: 16, fontWeight: 700 }}>{erro?.mensagem || 'Oferta indisponível.'}</p>
          <Link
            href={erro?.precisaEntrar ? `/auth/login?redirect=${encodeURIComponent(`/oferta/${id}`)}` : '/materiais'}
            style={{ display: 'inline-block', marginTop: 18, color: '#34d399', fontWeight: 800 }}
          >
            {erro?.precisaEntrar ? 'Entrar na minha conta' : 'Ver materiais'}
          </Link>
        </div>
      </div>
    )
  }

  const { oferta, vitrine } = dados
  const primeiroNome = (oferta.nome || '').trim().split(/\s+/)[0] || 'você'
  const nadaParaComprar = vitrine.itens.length === 0

  return (
    <div style={fundo} className={MUNDO}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {oferta.previaDoAdmin ? (
          <p style={{ marginBottom: 12, fontSize: 12, color: '#fbbf24', textAlign: 'center' }}>
            Prévia do admin — é isto que {oferta.nome || 'a pessoa'} vê.
          </p>
        ) : null}

        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999,
            background: 'linear-gradient(135deg, rgba(217,70,239,0.25), rgba(52,211,153,0.25))',
            border: '1px solid rgba(217,70,239,0.35)', fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            <Sparkles size={14} /> Oferta exclusiva
          </span>
          <h1 style={{ margin: '14px 0 6px', fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: 900, lineHeight: 1.15 }}>
            {oferta.titulo}
          </h1>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.65)', fontSize: 15 }}>
            Montamos este carrinho só para {primeiroNome}. Ninguém mais recebeu.
          </p>
        </div>

        {oferta.mensagem ? (
          <div style={{ ...vidro, padding: '16px 18px', marginBottom: 16, borderColor: 'rgba(251,191,36,0.3)' }}>
            <p style={{ margin: 0, whiteSpace: 'pre-line', fontSize: 15, lineHeight: 1.55, color: 'rgba(255,255,255,0.88)' }}>
              {oferta.mensagem}
            </p>
          </div>
        ) : null}

        {cupom ? (
          cupomVale ? (
            <div style={{
              ...vidro, padding: 18, marginBottom: 16, textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(5,150,105,0.35), rgba(6,20,10,0.9))', borderColor: 'rgba(52,211,153,0.4)',
            }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#a7f3d0' }}>
                Seu cupom · {cupom.rotulo}
              </p>
              <p style={{ margin: '6px 0 0', fontFamily: 'monospace', fontSize: 24, fontWeight: 900, letterSpacing: 2 }}>{cupom.codigo}</p>
              {restante ? (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }} aria-label="Tempo restante do cupom">
                  {[
                    ...(restante.dias > 0 ? [{ v: restante.dias, r: 'dias' }] : []),
                    { v: restante.horas, r: 'h' },
                    { v: restante.minutos, r: 'min' },
                    { v: restante.segundos, r: 's' },
                  ].map((bloco) => (
                    <div key={bloco.r} style={{ minWidth: 52, padding: '6px 8px', borderRadius: 10, background: 'rgba(0,0,0,0.35)' }}>
                      <div style={{ fontSize: 20, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{String(bloco.v).padStart(2, '0')}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>{bloco.r}</div>
                    </div>
                  ))}
                </div>
              ) : null}
              <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 12, marginTop: 10, fontSize: 13, color: '#fde68a' }}>
                {cupom.validoAte ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={13} /> Vale até {new Date(cupom.validoAte).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                ) : null}
                {typeof cupom.usosRestantes === 'number' ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Flame size={13} /> {cupom.usosRestantes === 1 ? 'Resta 1 uso' : `Restam ${cupom.usosRestantes} usos`}
                  </span>
                ) : null}
              </div>
            </div>
          ) : (
            <div style={{ ...vidro, padding: 14, marginBottom: 16, borderColor: 'rgba(251,191,36,0.35)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <AlertCircle size={18} style={{ color: '#fbbf24', flexShrink: 0, marginTop: 2 }} />
              <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
                {cupom.motivo || 'O cupom desta oferta não está mais valendo.'} Os itens continuam separados para você pelo preço normal.
              </p>
            </div>
          )
        ) : null}

        <div style={{ ...vidro, padding: 18 }}>
          {nadaParaComprar ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <Gift className="mx-auto h-10 w-10" style={{ color: '#34d399' }} />
              <p style={{ marginTop: 10, fontSize: 16, fontWeight: 800 }}>Você já garantiu tudo desta oferta.</p>
              <Link href="/materiais" style={{ display: 'inline-block', marginTop: 10, color: '#34d399', fontWeight: 800 }}>
                Ir para meus materiais
              </Link>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {vitrine.itens.map((item) => (
                  <div key={`${item.itemType}:${item.itemId}`} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                    padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <Package size={18} style={{ color: '#34d399', flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, fontSize: 14, overflowWrap: 'anywhere' }}>{item.titulo}</span>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {item.precoFinal < item.preco ? (
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through' }}>{reais(item.preco)}</div>
                      ) : null}
                      <div style={{ fontWeight: 900, color: item.precoFinal < item.preco ? '#34d399' : 'white' }}>{reais(item.precoFinal)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14 }}>
                {vitrine.desconto > 0 ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.6)' }}>
                      <span>Subtotal</span><span>{reais(vitrine.subtotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399', fontWeight: 700 }}>
                      <span>Desconto exclusivo</span><span>− {reais(vitrine.desconto)}</span>
                    </div>
                  </>
                ) : null}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
                  <span style={{ fontWeight: 800 }}>Total</span>
                  <span style={{ fontSize: 24, fontWeight: 900, color: '#fbbf24' }}>{reais(vitrine.total)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={comprar}
                disabled={indo || oferta.previaDoAdmin}
                style={{
                  marginTop: 18, width: '100%', minHeight: 52, border: 0, borderRadius: 14, cursor: indo ? 'wait' : 'pointer',
                  background: 'linear-gradient(135deg, #059669, #34d399)', color: 'white', fontWeight: 900, fontSize: 16,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: oferta.previaDoAdmin ? 0.5 : 1,
                }}
              >
                {indo ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} />}
                {cupomVale && vitrine.desconto > 0 ? 'Garantir com meu desconto' : 'Garantir minha oferta'}
              </button>
              <p style={{ margin: '10px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>
                {cupomVale ? 'O cupom entra sozinho no pagamento.' : 'Você escolhe a forma de pagamento na próxima tela.'}
              </p>
            </>
          )}

          {vitrine.foraDaCompra.length > 0 ? (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {vitrine.foraDaCompra.map((item) => (
                <div key={`${item.itemType}:${item.itemId}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                  <Check size={14} style={{ color: '#34d399', flexShrink: 0 }} />
                  <span style={{ overflowWrap: 'anywhere' }}>{item.titulo} — {item.motivo}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
