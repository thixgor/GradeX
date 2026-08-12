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

export type MaterialCartItemType = 'material' | 'package'

export interface MaterialCartItem {
  itemType: MaterialCartItemType
  itemId: string
  title: string
  pricing: 'free' | 'paid'
  price: number
  coverImage?: string
  materialType?: string
  materialCount?: number
  effectivePrice?: number
  originalPrice?: number
  discountApplied?: number
  /**
   * Versão de acesso por tempo escolhida. Ausente = acesso vitalício. O id é
   * revalidado no servidor a cada preview/checkout — aqui ele só preserva a
   * escolha do usuário entre a página do produto e o checkout.
   */
  accessVersionId?: string
  accessVersionLabel?: string
  accessDurationLabel?: string
  addedAt: string
}

interface MaterialCartContextType {
  items: MaterialCartItem[]
  itemCount: number
  subtotal: number
  addItem: (item: Omit<MaterialCartItem, 'addedAt'>) => 'added' | 'exists'
  removeItem: (itemType: MaterialCartItemType, itemId: string) => void
  clearCart: () => void
  isInCart: (itemType: MaterialCartItemType, itemId: string) => boolean
}

const CART_STORAGE_KEY = 'domineaqui-material-cart'
const MaterialCartContext = createContext<MaterialCartContextType | null>(null)

function normalizeCartItem(item: any): MaterialCartItem | null {
  if (!item || (item.itemType !== 'material' && item.itemType !== 'package') || !item.itemId) {
    return null
  }

  return {
    itemType: item.itemType,
    itemId: String(item.itemId),
    title: String(item.title || 'Item'),
    pricing: item.pricing === 'free' ? 'free' : 'paid',
    price: Math.max(0, Number(item.price || 0)),
    coverImage: item.coverImage ? String(item.coverImage) : undefined,
    materialType: item.materialType ? String(item.materialType) : undefined,
    materialCount: Number.isFinite(Number(item.materialCount)) ? Number(item.materialCount) : undefined,
    effectivePrice: Number.isFinite(Number(item.effectivePrice)) ? Math.max(0, Number(item.effectivePrice)) : undefined,
    originalPrice: Number.isFinite(Number(item.originalPrice)) ? Math.max(0, Number(item.originalPrice)) : undefined,
    discountApplied: Number.isFinite(Number(item.discountApplied)) ? Math.max(0, Number(item.discountApplied)) : undefined,
    accessVersionId: item.accessVersionId ? String(item.accessVersionId).slice(0, 40) : undefined,
    accessVersionLabel: item.accessVersionLabel ? String(item.accessVersionLabel).slice(0, 60) : undefined,
    accessDurationLabel: item.accessDurationLabel ? String(item.accessDurationLabel).slice(0, 40) : undefined,
    addedAt: item.addedAt ? String(item.addedAt) : new Date().toISOString(),
  }
}

export function MaterialCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<MaterialCartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          const normalized = parsed
            .map(normalizeCartItem)
            .filter(Boolean) as MaterialCartItem[]
          setItems(normalized)
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

  const addItem = useCallback((item: Omit<MaterialCartItem, 'addedAt'>) => {
    const normalized = normalizeCartItem({ ...item, addedAt: new Date().toISOString() })
    if (!normalized) return 'exists'

    if (items.some(existing => existing.itemType === normalized.itemType && existing.itemId === normalized.itemId)) {
      return 'exists'
    }

    setItems(prev => {
      if (prev.some(existing => existing.itemType === normalized.itemType && existing.itemId === normalized.itemId)) {
        return prev
      }
      return [...prev, normalized]
    })
    return 'added'
  }, [items])

  const removeItem = useCallback((itemType: MaterialCartItemType, itemId: string) => {
    setItems(prev => prev.filter(item => !(item.itemType === itemType && item.itemId === itemId)))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const isInCart = useCallback((itemType: MaterialCartItemType, itemId: string) => {
    return items.some(item => item.itemType === itemType && item.itemId === itemId)
  }, [items])

  const value = useMemo<MaterialCartContextType>(() => {
    const subtotal = items.reduce((sum, item) => {
      const price = item.effectivePrice ?? item.price
      return sum + Math.max(0, Number(price || 0))
    }, 0)

    return {
      items,
      itemCount: items.length,
      subtotal,
      addItem,
      removeItem,
      clearCart,
      isInCart,
    }
  }, [addItem, clearCart, isInCart, items, removeItem])

  return (
    <MaterialCartContext.Provider value={value}>
      {children}
    </MaterialCartContext.Provider>
  )
}

export function useMaterialCart() {
  const context = useContext(MaterialCartContext)
  if (!context) {
    throw new Error('useMaterialCart must be used within MaterialCartProvider')
  }
  return context
}
