'use client'

/**
 * Ofertas de versão impressa (add-on físico) exibidas no checkout de material/
 * pacote (tema escuro, estilos inline para combinar com a página de checkout).
 *
 * - Resolve os add-ons vinculados aos materiais (diretos e de pacotes).
 * - Exige login para comprar materiais físicos: visitantes veem um aviso e o
 *   botão leva ao login (retornando à mesma página).
 * - Suporta versões (o acréscimo +R$ muda conforme a versão escolhida).
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Printer, Plus, Check, Truck, LogIn, Info, ArrowRight, Trash2, ShoppingBag } from 'lucide-react'
import { useShopCart } from '@/context/ShopCartContext'
import { useAuthUser } from '@/hooks/use-auth-user'
import { useLinkedAddons } from '@/components/shop/use-linked-addons'

const brl = (n: number) => `R$ ${Number(n).toFixed(2).replace('.', ',')}`

export function CheckoutAddonOffers({
  materialIds,
  packageIds,
}: {
  materialIds?: string[]
  packageIds?: string[]
}) {
  const router = useRouter()
  const { products, loading } = useLinkedAddons({ materialIds, packageIds })
  const { addItem, isInCart, items: cartItems, subtotal, itemCount, removeItem } = useShopCart()
  const { isAuthenticated, loading: authLoading } = useAuthUser({})
  const [selectedVersions, setSelectedVersions] = useState<Record<string, string>>({})
  const [justAdded, setJustAdded] = useState<string | null>(null)

  if (loading || products.length === 0) return null

  const loginHref =
    typeof window !== 'undefined'
      ? `/auth/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`
      : '/auth/login'

  return (
    <div
      style={{
        marginBottom: '24px',
        borderRadius: '16px',
        border: '1px solid rgba(70,129,82,0.35)',
        background: 'rgba(70,129,82,0.10)',
        padding: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <Printer size={16} style={{ color: '#7ee2a0' }} />
        <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: 'white' }}>Leve também a versão impressa</p>
      </div>
      <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
        {packageIds && packageIds.length > 0
          ? 'Alguns materiais deste pacote têm versão física. Adicione as que quiser.'
          : 'Este material tem versão física. Adicione se quiser recebê-la impressa.'}
      </p>

      {!authLoading && !isAuthenticated && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '10px 12px',
            borderRadius: '10px',
            background: 'rgba(245,158,11,0.10)',
            border: '1px solid rgba(245,158,11,0.28)',
            color: 'rgba(253,230,138,0.98)',
            fontSize: '12px',
            marginBottom: '12px',
          }}
        >
          <Info size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>É necessário fazer login para comprar materiais físicos.</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {products.map((p) => {
          const pid = String(p._id)
          const base = p.addonSurcharge ?? p.price
          const versions = p.versions || []
          const verId = versions.length > 0 ? selectedVersions[pid] || versions[0].id : undefined
          const ver = versions.find((v) => v.id === verId)
          const price = ver && typeof ver.price === 'number' ? ver.price : base
          const inCart = isInCart(pid, verId)
          const added = inCart || justAdded === `${pid}::${verId || ''}`

          return (
            <div
              key={pid}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  flexShrink: 0,
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {p.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt={p.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Printer size={18} style={{ color: '#7ee2a0' }} />
                )}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.title}
                </p>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.5)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Truck size={11} /> {p.madeToOrder ? 'sob encomenda' : 'pronta entrega'}
                </p>
                {versions.length > 0 && (
                  <select
                    value={verId}
                    onChange={(e) => setSelectedVersions((s) => ({ ...s, [pid]: e.target.value }))}
                    style={{
                      marginTop: '6px',
                      height: '28px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.16)',
                      background: 'rgba(0,0,0,0.25)',
                      color: 'white',
                      fontSize: '12px',
                      padding: '0 8px',
                    }}
                  >
                    {versions.map((v) => (
                      <option key={v.id} value={v.id} style={{ color: '#000' }}>{v.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 800, color: '#7ee2a0' }}>+ {brl(price)}</p>
                {!isAuthenticated ? (
                  <a
                    href={loginHref}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      borderRadius: '9px',
                      background: 'rgba(255,255,255,0.10)',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    <LogIn size={13} /> Entrar
                  </a>
                ) : added ? (
                  <button
                    type="button"
                    onClick={() => router.push('/loja/checkout')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      borderRadius: '9px',
                      border: 'none',
                      background: 'rgba(52,211,153,0.15)',
                      color: '#7ee2a0',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <Check size={13} /> No carrinho
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      addItem({
                        productId: pid,
                        title: p.title,
                        price,
                        imageUrl: p.images?.[0],
                        versionId: ver?.id,
                        versionName: ver?.name,
                        isAddon: true,
                        linkedMaterialId: p.linkedMaterialId,
                        madeToOrder: p.madeToOrder,
                        productionDays: p.productionDays,
                      })
                      setJustAdded(`${pid}::${verId || ''}`)
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      borderRadius: '9px',
                      border: 'none',
                      background: '#468152',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={13} /> Adicionar
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {isAuthenticated && cartItems.length > 0 && (
        <div
          style={{
            marginTop: '14px',
            paddingTop: '14px',
            borderTop: '1px solid rgba(255,255,255,0.10)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <ShoppingBag size={14} style={{ color: '#7ee2a0' }} />
            <p style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: 'white' }}>
              Materiais físicos no carrinho ({itemCount})
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
            {cartItems.map((ci) => (
              <div
                key={`${ci.productId}::${ci.versionId || ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}
              >
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ci.quantity}× {ci.title}{ci.versionName ? ` (${ci.versionName})` : ''}
                </span>
                <span style={{ fontWeight: 700, color: 'white' }}>{brl(ci.price * ci.quantity)}</span>
                <button
                  type="button"
                  onClick={() => removeItem(ci.productId, ci.versionId)}
                  aria-label="Remover"
                  style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '2px', lineHeight: 0 }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
              Subtotal físico: <strong style={{ color: 'white' }}>{brl(subtotal)}</strong>
              <span style={{ display: 'block', fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>+ frete no checkout físico</span>
            </span>
            <button
              type="button"
              onClick={() => router.push('/loja/checkout')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                borderRadius: '10px',
                border: 'none',
                background: '#468152',
                color: 'white',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Finalizar pedido físico <ArrowRight size={15} />
            </button>
          </div>
          <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>
            Os materiais físicos são pagos e enviados <strong>à parte</strong> da compra digital (com entrega/retirada). Entregue por DomineAqui LTDA — Rio de Janeiro.
          </p>
        </div>
      )}
    </div>
  )
}
