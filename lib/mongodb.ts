import { MongoClient, Db } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local')
}

const uri: string = process.env.MONGODB_URI
// Opções afinadas para serverless (Vercel): cada lambda mantém um pool pequeno,
// devolve conexões ociosas rápido e — crucialmente — desiste da seleção de
// servidor em 5s. Sem `serverSelectionTimeoutMS` o driver usa 30s por padrão,
// então uma eleição lenta no Atlas travava o login por meio minuto.
const options = {
  maxPoolSize: 10,
  minPoolSize: 0,
  maxIdleTimeMS: 60_000,
  serverSelectionTimeoutMS: 5_000,
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect().then((client) => {
      const db = client.db('gradex')
      // Índices criados em BACKGROUND (sem await): antes, as ~139 chamadas de
      // createIndex abaixo bloqueavam a resolução de clientPromise, então a
      // primeira query de toda lambda fria esperava 139 round-trips ao Atlas.
      // Elas são idempotentes e não precisam existir para a query funcionar.
      void Promise.all([
        // ── Autenticação / usuário (crítico: login fazia collection scan) ──
        // Não-único de propósito: impor unicidade agora seria mudança de regra
        // de negócio e falharia se já existir e-mail duplicado — o ganho de
        // performance da busca é o mesmo.
        db.collection('users').createIndex({ email: 1 }),
        // CPF: sustenta a checagem de duplicidade em /api/user/complete-profile.
        // Esparso e não-único pelo mesmo motivo do e-mail — impor unicidade em
        // base já povoada quebraria a criação do índice se houver duplicata; a
        // API já rejeita CPF repetido antes de gravar.
        db.collection('users').createIndex({ cpf: 1 }, { sparse: true }),
        db.collection('submissions').createIndex({ userId: 1 }),
        db.collection('exam_submissions').createIndex({ userId: 1 }),
        db.collection('notifications').createIndex({ userId: 1, read: 1 }),
        db.collection('personal_exams').createIndex({ createdBy: 1 }),
        db.collection('leads').createIndex({ campaignId: 1, email: 1 }),
        db.collection('lead_page_views').createIndex({ campaignId: 1, ip: 1 }),
        db.collection('patologias').createIndex({ slug: 1 }, { unique: true }),
        db.collection('patologias').createIndex({ nome: 'text', sinonimos: 'text', cid10: 'text', classificacao: 'text', fisiopatologia: 'text' }, { default_language: 'portuguese', name: 'patologias_text_search' }),
        db.collection('patologias').createIndex({ areas: 1 }),
        db.collection('patologias').createIndex({ sistema: 1 }),
        db.collection('medicamentos').createIndex({ slug: 1 }, { unique: true }),
        db.collection('medicamentos').createIndex({ nome: 'text', sinonimos: 'text', classe_principal: 'text', subclasse: 'text', classificacao: 'text' }, { default_language: 'portuguese', name: 'medicamentos_text_search' }),
        db.collection('medicamentos').createIndex({ classe_principal: 1, subclasse: 1, nome: 1 }),
        db.collection('manual_clinico_product_settings').createIndex({ productId: 1 }, { unique: true }),
        db.collection('manual_clinico_purchases').createIndex({ userId: 1, productId: 1, status: 1 }),
        db.collection('manual_clinico_purchases').createIndex({ userEmail: 1, productId: 1, status: 1 }),
        db.collection('manual_clinico_purchases').createIndex({ productId: 1, status: 1, purchasedAt: -1 }),
        db.collection('manual_clinico_purchases').createIndex({ providerOrderId: 1 }, { sparse: true }),
        db.collection('manual_clinico_free_quotas').createIndex({ productId: 1, userId: 1 }, { unique: true }),
        db.collection('manual_clinico_free_quotas').createIndex({ userEmail: 1, productId: 1 }),
        db.collection('manual_clinico_free_quotas').createIndex({ productId: 1, lastClaimedAt: -1 }),
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
        db.collection('mindMaps').createIndex({ slug: 1 }, { unique: true }),
        db.collection('mindMaps').createIndex({ ownerId: 1, updatedAt: -1 }),
        db.collection('mindMaps').createIndex({ visibility: 1, isPublished: 1, isHidden: 1, likeCount: -1 }),
        db.collection('mindMapLikes').createIndex({ mapId: 1, userId: 1 }, { unique: true }),
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
        // ── Rifas / Sorteios ──
        db.collection('raffles').createIndex({ slug: 1 }, { unique: true }),
        db.collection('raffles').createIndex({ visibility: 1, status: 1, createdAt: -1 }),
        db.collection('raffles').createIndex({ status: 1, endsAt: 1 }),
        db.collection('raffle_numbers').createIndex({ raffleId: 1, number: 1 }, { unique: true }),
        db.collection('raffle_numbers').createIndex({ raffleId: 1, status: 1 }),
        db.collection('raffle_numbers').createIndex({ status: 1, reservedUntil: 1 }),
        db.collection('raffle_numbers').createIndex({ orderId: 1 }),
        db.collection('raffle_participants').createIndex({ raffleId: 1, email: 1 }),
        db.collection('raffle_purchases').createIndex({ raffleId: 1, status: 1, createdAt: -1 }),
        db.collection('raffle_purchases').createIndex({ orderId: 1 }, { sparse: true }),
        db.collection('raffle_purchases').createIndex({ mercadoPagoPaymentId: 1 }, { unique: true, sparse: true }),
        db.collection('raffle_winners').createIndex({ raffleId: 1, number: 1 }, { unique: true }),
        // ── Loja física (produtos físicos / pedidos) ──
        db.collection('physical_products').createIndex({ isHidden: 1, order: 1 }),
        db.collection('physical_products').createIndex({ linkedMaterialId: 1 }, { sparse: true }),
        db.collection('physical_products').createIndex({ slug: 1 }, { unique: true, sparse: true }),
        db.collection('shop_orders').createIndex({ userId: 1, createdAt: -1 }),
        db.collection('shop_orders').createIndex({ status: 1, createdAt: -1 }),
        db.collection('shop_orders').createIndex({ providerOrderId: 1 }, { sparse: true }),
        db.collection('shop_orders').createIndex({ orderNumber: 1 }, { unique: true }),
        db.collection('shop_settings').createIndex({ settingsId: 1 }, { unique: true }),
      ]).catch(err => console.error('Erro ao criar índices iniciais:', err))
      return client
    })
  }
  clientPromise = global._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect().then((client) => {
    const db = client.db('gradex')
    // Índices criados em BACKGROUND (sem await): antes, as ~139 chamadas de
    // createIndex abaixo bloqueavam a resolução de clientPromise, então a
    // primeira query de toda lambda fria esperava 139 round-trips ao Atlas.
    // Elas são idempotentes e não precisam existir para a query funcionar.
    void Promise.all([
      // ── Autenticação / usuário (crítico: login fazia collection scan) ──
      // Não-único de propósito: impor unicidade agora seria mudança de regra
      // de negócio e falharia se já existir e-mail duplicado — o ganho de
      // performance da busca é o mesmo.
      db.collection('users').createIndex({ email: 1 }),
      db.collection('submissions').createIndex({ userId: 1 }),
      db.collection('exam_submissions').createIndex({ userId: 1 }),
      db.collection('notifications').createIndex({ userId: 1, read: 1 }),
      db.collection('personal_exams').createIndex({ createdBy: 1 }),
      db.collection('leads').createIndex({ campaignId: 1, email: 1 }),
      db.collection('lead_page_views').createIndex({ campaignId: 1, ip: 1 }),
      db.collection('patologias').createIndex({ slug: 1 }, { unique: true }),
      db.collection('patologias').createIndex({ nome: 'text', sinonimos: 'text', cid10: 'text', classificacao: 'text', fisiopatologia: 'text' }, { default_language: 'portuguese', name: 'patologias_text_search' }),
      db.collection('patologias').createIndex({ areas: 1 }),
      db.collection('patologias').createIndex({ sistema: 1 }),
      db.collection('manual_clinico_product_settings').createIndex({ productId: 1 }, { unique: true }),
      db.collection('manual_clinico_purchases').createIndex({ userId: 1, productId: 1, status: 1 }),
      db.collection('manual_clinico_purchases').createIndex({ userEmail: 1, productId: 1, status: 1 }),
      db.collection('manual_clinico_purchases').createIndex({ productId: 1, status: 1, purchasedAt: -1 }),
      db.collection('manual_clinico_purchases').createIndex({ providerOrderId: 1 }, { sparse: true }),
      db.collection('manual_clinico_free_quotas').createIndex({ productId: 1, userId: 1 }, { unique: true }),
      db.collection('manual_clinico_free_quotas').createIndex({ userEmail: 1, productId: 1 }),
      db.collection('manual_clinico_free_quotas').createIndex({ productId: 1, lastClaimedAt: -1 }),
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
      db.collection('mindMaps').createIndex({ slug: 1 }, { unique: true }),
      db.collection('mindMaps').createIndex({ ownerId: 1, updatedAt: -1 }),
      db.collection('mindMaps').createIndex({ visibility: 1, isPublished: 1, isHidden: 1, likeCount: -1 }),
      db.collection('mindMapLikes').createIndex({ mapId: 1, userId: 1 }, { unique: true }),
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
      // ── Rifas / Sorteios ──
      db.collection('raffles').createIndex({ slug: 1 }, { unique: true }),
      db.collection('raffles').createIndex({ visibility: 1, status: 1, createdAt: -1 }),
      db.collection('raffles').createIndex({ status: 1, endsAt: 1 }),
      db.collection('raffle_numbers').createIndex({ raffleId: 1, number: 1 }, { unique: true }),
      db.collection('raffle_numbers').createIndex({ raffleId: 1, status: 1 }),
      db.collection('raffle_numbers').createIndex({ status: 1, reservedUntil: 1 }),
      db.collection('raffle_numbers').createIndex({ orderId: 1 }),
      db.collection('raffle_participants').createIndex({ raffleId: 1, email: 1 }),
      db.collection('raffle_purchases').createIndex({ raffleId: 1, status: 1, createdAt: -1 }),
      db.collection('raffle_purchases').createIndex({ orderId: 1 }, { sparse: true }),
      db.collection('raffle_purchases').createIndex({ mercadoPagoPaymentId: 1 }, { unique: true, sparse: true }),
      db.collection('raffle_winners').createIndex({ raffleId: 1, number: 1 }, { unique: true }),
      // ── Loja física (produtos físicos / pedidos) ──
      db.collection('physical_products').createIndex({ isHidden: 1, order: 1 }),
      db.collection('physical_products').createIndex({ linkedMaterialId: 1 }, { sparse: true }),
      db.collection('physical_products').createIndex({ slug: 1 }, { unique: true, sparse: true }),
      db.collection('shop_orders').createIndex({ userId: 1, createdAt: -1 }),
      db.collection('shop_orders').createIndex({ status: 1, createdAt: -1 }),
      db.collection('shop_orders').createIndex({ providerOrderId: 1 }, { sparse: true }),
      db.collection('shop_orders').createIndex({ orderNumber: 1 }, { unique: true }),
      db.collection('shop_settings').createIndex({ settingsId: 1 }, { unique: true }),
    ]).catch(err => console.error('Erro ao criar índices iniciais:', err))
    return client
  })
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise
  return client.db('gradex')
}

export default clientPromise
