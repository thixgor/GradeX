/**
 * Pricing helpers for material packages.
 *
 * When a user already owns one (or more) of the materials inside a package,
 * we discount the package proportionally — never below zero and never by an
 * amount larger than the package itself.
 *
 *   effectivePrice = pkgPrice * (1 - ownedValue / totalPaidIndividualValue)
 *
 * Example: package R$5 contains a R$20 material the user already bought.
 * The credit is capped at the package value (R$5), so the user pays R$0 —
 * not a negative amount. Free materials inside the package are ignored
 * for both sides of the ratio.
 */

export interface PricedMaterial {
  _id: string
  pricing?: 'free' | 'paid'
  price?: number
}

export interface EffectivePackagePrice {
  /** Original package price (unchanged) */
  originalPackagePrice: number
  /** Final price the user should pay after the overlap discount */
  effectivePrice: number
  /** R$ credited (originalPackagePrice - effectivePrice) */
  discountApplied: number
  /** Sum of paid-material prices the user already owns inside this pkg */
  ownedValue: number
  /** Sum of every paid material price inside the pkg */
  totalPaidIndividualValue: number
  /** Material IDs in the package the user already owns */
  ownedMaterialIds: string[]
}

export function computeEffectivePackagePrice(args: {
  pkgPrice: number
  materials: PricedMaterial[]
  ownedMaterialIds: Iterable<string>
}): EffectivePackagePrice {
  const originalPackagePrice = Math.max(0, Number(args.pkgPrice) || 0)
  const ownedSet = new Set(Array.from(args.ownedMaterialIds, (v) => String(v)))
  const ownedHits: string[] = []

  let totalPaidIndividualValue = 0
  let ownedValue = 0

  for (const m of args.materials) {
    if (!m) continue
    const isPaid = m.pricing === 'paid'
    const price = Math.max(0, Number(m.price) || 0)
    if (!isPaid || price <= 0) continue

    totalPaidIndividualValue += price
    if (ownedSet.has(String(m._id))) {
      ownedValue += price
      ownedHits.push(String(m._id))
    }
  }

  if (
    originalPackagePrice <= 0 ||
    ownedValue <= 0 ||
    totalPaidIndividualValue <= 0
  ) {
    return {
      originalPackagePrice,
      effectivePrice: originalPackagePrice,
      discountApplied: 0,
      ownedValue,
      totalPaidIndividualValue,
      ownedMaterialIds: ownedHits,
    }
  }

  const ratio = Math.min(1, ownedValue / totalPaidIndividualValue)
  const credit = originalPackagePrice * ratio
  const effectiveRaw = originalPackagePrice - credit
  const effectivePrice = Math.max(0, Math.round(effectiveRaw * 100) / 100)
  const discountApplied = Math.round((originalPackagePrice - effectivePrice) * 100) / 100

  return {
    originalPackagePrice,
    effectivePrice,
    discountApplied,
    ownedValue,
    totalPaidIndividualValue,
    ownedMaterialIds: ownedHits,
  }
}
