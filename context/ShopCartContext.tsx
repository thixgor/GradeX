'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export interface ShopCartItem {
  productId: string
  title: string
  price: number
  imageUrl?: string
  /** Versão/variante escolhida (opcional). */
  versionId?: string
  versionName?: string
  isAddon?: boolean
  linkedMaterialId?: string
  madeToOrder?: boolean
  productionDays?: number
  quantity: number
  addedAt: string
}

interface ShopCartContextType {
  items: ShopCartItem[]
  itemCount: number
  subtotal: number
  addItem: (item: Omit<ShopCartItem, 'addedAt' | 'quantity'> & { quantity?: number }) => 'added' | 'incremented'
  removeItem: (productId: string, versionId?: string) => void
  setQuantity: (productId: string, quantity: number, versionId?: string) => void
  clearCart: () => void
  isInCart: (productId: string, versionId?: string) => boolean
}

const CART_STORAGE_KEY = 'domineaqui-shop-cart'
const ShopCartContext = createContext<ShopCartContextType | null>(null)

/** Chave de linha: mesmo produto com versões diferentes = linhas distintas. */
function lineKey(productId: string, versionId?: string): string {
  return `${productId}::${versionId || ''}`
}

function normalize(item: any): ShopCartItem | null {
  if (!item || !item.productId) return null
  return {
    productId: String(item.productId),
    title: String(item.title || 'Produto'),
    price: Math.max(0, Number(item.price || 0)),
    imageUrl: item.imageUrl ? String(item.imageUrl) : undefined,
    versionId: item.versionId ? String(item.versionId) : undefined,
    versionName: item.versionName ? String(item.versionName) : undefined,
    isAddon: item.isAddon === true,
    linkedMaterialId: item.linkedMaterialId ? String(item.linkedMaterialId) : undefined,
    madeToOrder: item.madeToOrder === true,
    productionDays: Number.isFinite(Number(item.productionDays)) ? Number(item.productionDays) : undefined,
    quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
    addedAt: item.addedAt ? String(item.addedAt) : new Date().toISOString(),
  }
}

export function ShopCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ShopCartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setItems(parsed.map(normalize).filter(Boolean) as ShopCartItem[])
        }
      }
    } catch {
      localStorage.removeItem(CART_STORAGE_KEY)
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [hydrated, items])

  const addItem = useCallback<ShopCartContextType['addItem']>((item) => {
    const normalized = normalize({ ...item, quantity: item.quantity ?? 1, addedAt: new Date().toISOString() })
    let outcome: 'added' | 'incremented' = 'added'
    if (!normalized) return outcome
    const key = lineKey(normalized.productId, normalized.versionId)
    setItems((prev) => {
      const existing = prev.find((p) => lineKey(p.productId, p.versionId) === key)
      if (existing) {
        outcome = 'incremented'
        return prev.map((p) =>
          lineKey(p.productId, p.versionId) === key ? { ...p, quantity: p.quantity + normalized.quantity } : p
        )
      }
      return [...prev, normalized]
    })
    return outcome
  }, [])

  const removeItem = useCallback((productId: string, versionId?: string) => {
    const key = lineKey(productId, versionId)
    setItems((prev) => prev.filter((p) => lineKey(p.productId, p.versionId) !== key))
  }, [])

  const setQuantity = useCallback((productId: string, quantity: number, versionId?: string) => {
    const q = Math.max(1, Math.floor(quantity))
    const key = lineKey(productId, versionId)
    setItems((prev) => prev.map((p) => (lineKey(p.productId, p.versionId) === key ? { ...p, quantity: q } : p)))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const isInCart = useCallback(
    (productId: string, versionId?: string) => {
      const key = lineKey(productId, versionId)
      return items.some((p) => lineKey(p.productId, p.versionId) === key)
    },
    [items]
  )

  const value = useMemo<ShopCartContextType>(() => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
    return { items, itemCount, subtotal, addItem, removeItem, setQuantity, clearCart, isInCart }
  }, [items, addItem, removeItem, setQuantity, clearCart, isInCart])

  return <ShopCartContext.Provider value={value}>{children}</ShopCartContext.Provider>
}

export function useShopCart() {
  const context = useContext(ShopCartContext)
  if (!context) {
    throw new Error('useShopCart must be used within ShopCartProvider')
  }
  return context
}
