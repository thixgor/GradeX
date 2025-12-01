import Stripe from 'stripe'

const secretKey = process.env.STRIPE_SECRET_KEY

if (!secretKey) {
  console.warn('⚠️ STRIPE_SECRET_KEY não está configurada no .env.local')
}

const stripe = new Stripe(secretKey || '', {
  // Usar a versão mais recente da API
})

export default stripe

// Mapeamento de planos para price IDs do Stripe
export const STRIPE_PRICES = {
  monthly: 'price_1SZNGXLawSqPVy6JgWlwc7jZ',
  quarterly: 'price_1SZNGwLawSqPVy6Ja5PmQ7La',
  'semi-annual': 'price_1SZNHALawSqPVy6J83iS9ZOE',
  annual: 'price_1SZNHcLawSqPVy6JzTZvOkDJ',
  lifetime: 'price_1SZNI6LawSqPVy6JCtC12X3H',
} as const

export type PlanId = keyof typeof STRIPE_PRICES
