import { MongoClient, Db } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local')
}

const uri: string = process.env.MONGODB_URI
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect().then(async (client) => {
      const db = client.db('gradex')
      // Criar índices essenciais uma única vez
      await Promise.all([
        db.collection('leads').createIndex({ campaignId: 1, email: 1 }),
        db.collection('lead_page_views').createIndex({ campaignId: 1, ip: 1 }),
        db.collection('patologias').createIndex({ slug: 1 }, { unique: true }),
        db.collection('patologias').createIndex({ nome: 'text', sinonimos: 'text', cid10: 'text', classificacao: 'text', fisiopatologia: 'text' }, { default_language: 'portuguese', name: 'patologias_text_search' }),
        db.collection('patologias').createIndex({ areas: 1 }),
        db.collection('patologias').createIndex({ sistema: 1 }),
        // ── Analytics de checkout ──
        db.collection('checkout_events').createIndex({ event: 1, createdAt: -1 }),
        db.collection('checkout_events').createIndex({ userId: 1, createdAt: -1 }),
        db.collection('checkout_events').createIndex({ productId: 1, productType: 1, createdAt: -1 }),
        db.collection('checkout_events').createIndex({ orderId: 1 }),
        db.collection('checkout_events').createIndex({ 'metadata.couponCode': 1, createdAt: -1 }),
        db.collection('coupons').createIndex({ codeNormalized: 1 }, { unique: true }),
        db.collection('coupons').createIndex({ isActive: 1, expiresAt: 1 }),
        db.collection('coupon_redemptions').createIndex({ couponId: 1, status: 1, createdAt: -1 }),
        db.collection('coupon_redemptions').createIndex({ orderId: 1 }, { unique: true, sparse: true }),
        db.collection('coupon_redemptions').createIndex({ userId: 1, createdAt: -1 }),
        db.collection('coupon_redemptions').createIndex({ couponId: 1, userId: 1, status: 1 }),
        db.collection('coupon_redemptions').createIndex({ couponId: 1, userEmail: 1, status: 1 }),
        db.collection('flashcardSpacedProgress').createIndex({ userId: 1, cardId: 1 }, { unique: true }),
        db.collection('flashcardSpacedProgress').createIndex({ userId: 1, deckId: 1, nextReviewAt: 1 }),
        db.collection('flashcardSpacedProgress').createIndex({ deckId: 1, cardId: 1 }),
        db.collection('material_pdf_annotations').createIndex({ userId: 1, materialId: 1, pageNumber: 1 }),
        db.collection('material_pdf_viewer_logs').createIndex({ userId: 1, materialId: 1, createdAt: -1 }),
        db.collection('material_pdf_viewer_logs').createIndex({ materialId: 1, action: 1, createdAt: -1 }),
        // ── Avaliações (reviews) ──
        db.collection('reviews').createIndex({ targetType: 1, targetId: 1, createdAt: -1 }),
        db.collection('reviews').createIndex({ targetType: 1, targetId: 1, isFeatured: -1, createdAt: -1 }),
        db.collection('reviews').createIndex({ userId: 1, createdAt: -1 }),
        db.collection('reviews').createIndex(
          { targetType: 1, targetId: 1, userId: 1 },
          { unique: true, partialFilterExpression: { isAdminCreated: false, userId: { $type: 'string' } } },
        ),
      ]).catch(err => console.error('Erro ao criar índices iniciais:', err))
      return client
    })
  }
  clientPromise = global._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect().then(async (client) => {
    const db = client.db('gradex')
    // Criar índices essenciais uma única vez
    await Promise.all([
      db.collection('leads').createIndex({ campaignId: 1, email: 1 }),
      db.collection('lead_page_views').createIndex({ campaignId: 1, ip: 1 }),
      db.collection('patologias').createIndex({ slug: 1 }, { unique: true }),
      db.collection('patologias').createIndex({ nome: 'text', sinonimos: 'text', cid10: 'text', classificacao: 'text', fisiopatologia: 'text' }, { default_language: 'portuguese', name: 'patologias_text_search' }),
      db.collection('patologias').createIndex({ areas: 1 }),
      db.collection('patologias').createIndex({ sistema: 1 }),
      // ── Pagamentos (Mercado Pago) ──
      db.collection('payment_orders').createIndex({ providerOrderId: 1 }, { sparse: true }),
      db.collection('payment_orders').createIndex({ userId: 1, createdAt: -1 }),
      db.collection('payment_orders').createIndex({ status: 1, createdAt: -1 }),
      db.collection('payment_orders').createIndex({ idempotencyKey: 1 }, { unique: true, sparse: true }),
      db.collection('payments').createIndex({ providerPaymentId: 1 }, { unique: true, sparse: true }),
      db.collection('payments').createIndex({ orderId: 1 }),
      db.collection('subscriptions').createIndex({ userId: 1 }),
      db.collection('subscriptions').createIndex({ providerSubscriptionId: 1 }, { unique: true, sparse: true }),
      db.collection('subscriptions').createIndex({ status: 1, currentPeriodEndsAt: 1 }),
      db.collection('donation_payments').createIndex({ providerOrderId: 1 }, { unique: true, sparse: true }),
      db.collection('donation_payments').createIndex({ status: 1, createdAt: -1 }),
      db.collection('webhook_events').createIndex({ provider: 1, eventId: 1 }, { unique: true }),
      db.collection('webhook_events').createIndex({ processedAt: 1 }),
      db.collection('audit_logs').createIndex({ ts: -1 }),
      db.collection('audit_logs').createIndex({ action: 1, ts: -1 }),
      db.collection('audit_logs').createIndex({ targetUserId: 1, ts: -1 }),
      db.collection('checkout_events').createIndex({ event: 1, createdAt: -1 }),
      db.collection('checkout_events').createIndex({ userId: 1, createdAt: -1 }),
      db.collection('checkout_events').createIndex({ productId: 1, productType: 1, createdAt: -1 }),
      db.collection('checkout_events').createIndex({ orderId: 1 }),
      db.collection('checkout_events').createIndex({ 'metadata.couponCode': 1, createdAt: -1 }),
      db.collection('coupons').createIndex({ codeNormalized: 1 }, { unique: true }),
      db.collection('coupons').createIndex({ isActive: 1, expiresAt: 1 }),
      db.collection('coupon_redemptions').createIndex({ couponId: 1, status: 1, createdAt: -1 }),
      db.collection('coupon_redemptions').createIndex({ orderId: 1 }, { unique: true, sparse: true }),
      db.collection('coupon_redemptions').createIndex({ userId: 1, createdAt: -1 }),
      db.collection('coupon_redemptions').createIndex({ couponId: 1, userId: 1, status: 1 }),
      db.collection('coupon_redemptions').createIndex({ couponId: 1, userEmail: 1, status: 1 }),
      db.collection('flashcardSpacedProgress').createIndex({ userId: 1, cardId: 1 }, { unique: true }),
      db.collection('flashcardSpacedProgress').createIndex({ userId: 1, deckId: 1, nextReviewAt: 1 }),
      db.collection('flashcardSpacedProgress').createIndex({ deckId: 1, cardId: 1 }),
      db.collection('material_pdf_annotations').createIndex({ userId: 1, materialId: 1, pageNumber: 1 }),
      db.collection('material_pdf_viewer_logs').createIndex({ userId: 1, materialId: 1, createdAt: -1 }),
      db.collection('material_pdf_viewer_logs').createIndex({ materialId: 1, action: 1, createdAt: -1 }),
      // ── Avaliações (reviews) ──
      db.collection('reviews').createIndex({ targetType: 1, targetId: 1, createdAt: -1 }),
      db.collection('reviews').createIndex({ targetType: 1, targetId: 1, isFeatured: -1, createdAt: -1 }),
      db.collection('reviews').createIndex({ userId: 1, createdAt: -1 }),
      db.collection('reviews').createIndex(
        { targetType: 1, targetId: 1, userId: 1 },
        { unique: true, partialFilterExpression: { isAdminCreated: false, userId: { $type: 'string' } } },
      ),
    ]).catch(err => console.error('Erro ao criar índices iniciais:', err))
    return client
  })
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise
  return client.db('gradex')
}

export default clientPromise
