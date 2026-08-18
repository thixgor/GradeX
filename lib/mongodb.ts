import { MongoClient, Db } from 'mongodb'

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

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

/**
 * Índices garantidos no primeiro contato de cada processo com o banco.
 *
 * Lista única para desenvolvimento e produção. Antes eram duas cópias que
 * divergiram no tempo — a de desenvolvimento não tinha os índices de pagamento
 * e assinatura, a de produção não tinha os de `medicamentos` nem o de CPF —,
 * então um mesmo teste local e em produção percorria planos de consulta
 * diferentes. Uma lista só é o que impede a divergência de voltar, e ela é
 * ~90 declarações a menos para o webpack copiar em cada uma das 356 funções
 * que importam este módulo.
 *
 * Todas as chamadas são idempotentes: `createIndex` sobre um índice que já
 * existe com a mesma especificação é um no-op no servidor.
 */
function garantirIndices(db: Db): Promise<unknown> {
  return Promise.all([
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
    // ── Manual Clínico: patologias e medicamentos ──
    db.collection('patologias').createIndex({ slug: 1 }, { unique: true }),
    db.collection('patologias').createIndex({ nome: 'text', sinonimos: 'text', cid10: 'text', classificacao: 'text', fisiopatologia: 'text' }, { default_language: 'portuguese', name: 'patologias_text_search' }),
    db.collection('patologias').createIndex({ areas: 1 }),
    db.collection('patologias').createIndex({ sistema: 1 }),
    db.collection('medicamentos').createIndex({ slug: 1 }, { unique: true }),
    db.collection('medicamentos').createIndex({ nome: 'text', sinonimos: 'text', classe_principal: 'text', subclasse: 'text', classificacao: 'text' }, { default_language: 'portuguese', name: 'medicamentos_text_search' }),
    db.collection('medicamentos').createIndex({ classe_principal: 1, subclasse: 1, nome: 1 }),
    // ── Manual Clínico: compras e cotas gratuitas ──
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
    // ── Auditoria ──
    db.collection('audit_logs').createIndex({ ts: -1 }),
    db.collection('audit_logs').createIndex({ action: 1, ts: -1 }),
    db.collection('audit_logs').createIndex({ targetUserId: 1, ts: -1 }),
    // ── Analytics de checkout ──
    db.collection('checkout_events').createIndex({ event: 1, createdAt: -1 }),
    db.collection('checkout_events').createIndex({ userId: 1, createdAt: -1 }),
    db.collection('checkout_events').createIndex({ productId: 1, productType: 1, createdAt: -1 }),
    db.collection('checkout_events').createIndex({ orderId: 1 }),
    db.collection('checkout_events').createIndex({ 'metadata.couponCode': 1, createdAt: -1 }),
    // ── Cupons ──
    db.collection('coupons').createIndex({ codeNormalized: 1 }, { unique: true }),
    db.collection('coupons').createIndex({ isActive: 1, expiresAt: 1 }),
    db.collection('coupon_redemptions').createIndex({ couponId: 1, status: 1, createdAt: -1 }),
    db.collection('coupon_redemptions').createIndex({ orderId: 1 }, { unique: true, sparse: true }),
    db.collection('coupon_redemptions').createIndex({ userId: 1, createdAt: -1 }),
    db.collection('coupon_redemptions').createIndex({ couponId: 1, userId: 1, status: 1 }),
    db.collection('coupon_redemptions').createIndex({ couponId: 1, userEmail: 1, status: 1 }),
    // ── Flashcards / mapas mentais ──
    db.collection('flashcardSpacedProgress').createIndex({ userId: 1, cardId: 1 }, { unique: true }),
    db.collection('flashcardSpacedProgress').createIndex({ userId: 1, deckId: 1, nextReviewAt: 1 }),
    db.collection('flashcardSpacedProgress').createIndex({ deckId: 1, cardId: 1 }),
    db.collection('mindMaps').createIndex({ slug: 1 }, { unique: true }),
    db.collection('mindMaps').createIndex({ ownerId: 1, updatedAt: -1 }),
    db.collection('mindMaps').createIndex({ visibility: 1, isPublished: 1, isHidden: 1, likeCount: -1 }),
    db.collection('mindMapLikes').createIndex({ mapId: 1, userId: 1 }, { unique: true }),
    // ── Leitor de PDF dos materiais ──
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
}

// `async` de propósito: a falta da URI precisa virar uma promessa REJEITADA, e
// não uma exceção síncrona. Quem chama é sempre `await` — e `await` sobre um
// thenable cujo `then` lança também rejeita —, mas qualquer consumidor que use
// `.then()` direto (um teste, um `Promise.allSettled`) receberia a exceção na
// própria pilha em vez de no caminho de erro. Uma função async elimina a
// diferença entre os dois casos.
async function abrirConexao(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('Please add your Mongo URI to .env.local')
  }

  return new MongoClient(uri, options).connect().then((client) => {
    // Índices criados em BACKGROUND (sem await): antes, as ~90 chamadas de
    // createIndex bloqueavam a resolução da conexão, então a primeira query de
    // toda lambda fria esperava 90 round-trips ao Atlas. Elas são idempotentes
    // e não precisam existir para a query funcionar.
    void garantirIndices(client.db('gradex'))
    return client
  })
}

/**
 * A conexão nasce no primeiro `await`, não no import.
 *
 * Antes, `client.connect()` rodava no escopo do módulo. Como as 356 rotas que
 * importam este arquivo são todas carregadas pelo `next build` na fase de
 * "Collecting page data", o build abria conexões de verdade com o Atlas — uma
 * por worker — e disparava as ~90 chamadas de `createIndex` contra o banco de
 * PRODUÇÃO só para descobrir quais rotas são dinâmicas. E, sem `MONGODB_URI`
 * no ambiente, o `throw` no topo do módulo derrubava o build inteiro na
 * primeira rota importada.
 *
 * Adiando a conexão, o build volta a ser uma operação puramente local. Em
 * runtime nada muda de fato: numa lambda o módulo é avaliado no mesmo tick em
 * que o handler roda, e o handler faz `await` na primeira linha útil.
 *
 * A contrapartida é que a ausência de `MONGODB_URI` deixa de ser um erro de
 * build e passa a ser um erro na primeira requisição que toca o banco — que é
 * onde a variável realmente faz falta.
 */
function conectar(): Promise<MongoClient> {
  if (process.env.NODE_ENV === 'development') {
    // Em desenvolvimento o módulo é reavaliado a cada hot reload; guardar a
    // promessa no escopo global é o que evita abrir um cliente por edição.
    global._mongoClientPromise ??= abrirConexao()
    return global._mongoClientPromise
  }
  memoria ??= abrirConexao()
  return memoria
}

let memoria: Promise<MongoClient> | undefined

export async function getDb(): Promise<Db> {
  const client = await conectar()
  return client.db('gradex')
}

/**
 * Default export preguiçoso.
 *
 * As 356 rotas fazem `const client = await clientPromise`, e `await` aceita
 * qualquer thenable — então este objeto se comporta exatamente como a promessa
 * que ele substitui, com a diferença de que a conexão só é aberta quando
 * alguém de fato espera por ela.
 */
const clientPromise = {
  then<R1 = MongoClient, R2 = never>(
    aoResolver?: ((client: MongoClient) => R1 | PromiseLike<R1>) | null,
    aoRejeitar?: ((motivo: unknown) => R2 | PromiseLike<R2>) | null,
  ): Promise<R1 | R2> {
    return conectar().then(aoResolver, aoRejeitar)
  },
  catch<R = never>(aoRejeitar?: ((motivo: unknown) => R | PromiseLike<R>) | null): Promise<MongoClient | R> {
    return conectar().catch(aoRejeitar)
  },
  finally(aoFinal?: (() => void) | null): Promise<MongoClient> {
    return conectar().finally(aoFinal)
  },
  get [Symbol.toStringTag]() {
    return 'Promise'
  },
} as Promise<MongoClient>

export default clientPromise
