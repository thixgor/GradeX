'use client'

import { useEffect, useMemo, useState } from 'react'
import { computeFreight } from '@/lib/shop'
import type { DeliveryMethod, PickupPoint, ShippingAddress } from '@/lib/types'

export interface PublicShopSettings {
  deliveryMethods: DeliveryMethod[]
  pickupPoints: PickupPoint[]
  sellerFooter: string
  freeShippingThreshold?: number
}

const emptyAddress: ShippingAddress = {
  name: '', phone: '', cep: '', street: '', number: '', complement: '', district: '', city: '', uf: '',
}

/**
 * Estado de seleção de entrega (retirada/endereço + método) + frete calculado,
 * compartilhado pelo checkout físico e pelo checkout unificado. Carrega as
 * configurações públicas da loja (métodos, pontos, frete grátis).
 */
export function useDeliverySelection(physicalSubtotal: number) {
  const [settings, setSettings] = useState<PublicShopSettings | null>(null)
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'shipping'>('pickup')
  const [pickupPointId, setPickupPointId] = useState('')
  const [deliveryMethodId, setDeliveryMethodId] = useState('')
  const [address, setAddress] = useState<ShippingAddress>({ ...emptyAddress })

  useEffect(() => {
    fetch('/api/loja/settings/public')
      .then((r) => r.json())
      .then((s: PublicShopSettings) => {
        setSettings(s)
        const firstPickup = (s?.pickupPoints || [])[0]
        if (firstPickup) setPickupPointId(firstPickup.id)
        const firstMethod = (s?.deliveryMethods || [])[0]
        if (firstMethod) setDeliveryMethodId(firstMethod.id)
      })
      .catch(() => {})
  }, [])

  const selectedMethod = useMemo(
    () => settings?.deliveryMethods.find((m) => m.id === deliveryMethodId),
    [settings, deliveryMethodId]
  )

  const freight = useMemo(() => {
    if (deliveryType === 'pickup') return 0
    if (!selectedMethod) return 0
    return computeFreight({ method: selectedMethod, uf: address.uf, physicalSubtotal, settings })
  }, [deliveryType, selectedMethod, address.uf, physicalSubtotal, settings])

  const addressValid =
    !!address.name.trim() &&
    address.cep.replace(/\D/g, '').length >= 8 &&
    !!address.street.trim() &&
    !!address.number.trim() &&
    !!address.district.trim() &&
    !!address.city.trim() &&
    address.uf.length === 2

  const valid = deliveryType === 'pickup' ? !!pickupPointId : !!deliveryMethodId && addressValid

  /** Payload de entrega para enviar ao checkout. */
  const deliveryPayload = useMemo(() => {
    if (deliveryType === 'pickup') return { deliveryType: 'pickup' as const, pickupPointId }
    return { deliveryType: 'shipping' as const, deliveryMethodId, shippingAddress: { ...address, uf: address.uf.toUpperCase() } }
  }, [deliveryType, pickupPointId, deliveryMethodId, address])

  return {
    settings,
    deliveryType, setDeliveryType,
    pickupPointId, setPickupPointId,
    deliveryMethodId, setDeliveryMethodId,
    address, setAddress,
    selectedMethod,
    freight,
    addressValid,
    valid,
    deliveryPayload,
  }
}

export { emptyAddress }
