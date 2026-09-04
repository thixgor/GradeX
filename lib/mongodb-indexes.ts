import type { Db } from 'mongodb'

/**
 * Criação dos índices do banco — **fora do caminho da requisição**.
 *
 * Esta lista já viveu duplicada dentro de `lib/mongodb.ts`, uma cópia no ramo
 * de desenvolvimento e outra no de produção, e as duas divergiram: produção
 * não criava `users.cpf` nem os três de `medicamentos`; desenvolvimento não
 * criava nenhum dos de pagamento (`payment_orders`, `payments`,
 * `subscriptions`, `webhook_events`, `donation_payments`, `audit_logs`). O
 * arquivo único acaba com a divergência — é a união das duas listas.
 *
 * ## Por que não roda mais a cada conexão
 *
 * Antes, todo processo que importasse `lib/mongodb` disparava estas ~114
 * chamadas ao conectar. Em serverless isso não acontece uma vez: acontece em
 * **cada instância fria**, e a plataforma cobra memória provisionada pelo tempo
 * em que a instância está ativa — ou seja, pagávamos ~114 idas ao Atlas por
 * partida a frio para recriar índices que já existiam desde a primeira vez.
 *
 * Índice é estrutura de implantação, não de requisição. Agora é explícito:
 * `npm run db:indexes` depois de mexer nesta lista, ou
 * `MONGODB_ENSURE_INDEXES=1` no ambiente para o comportamento antigo. Em
 * desenvolvimento continua automático, porque um banco local recém-criado
 * precisa deles e ninguém vai lembrar de rodar o script.
 *
 * As chamadas são idempotentes: rodar de novo sobre um índice que já existe
 * não faz nada.
 */
export async function ensureIndexes(db: Db): Promise<void> {
  await Promise.all([
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
    // ── Suporte / tickets ──
    // A listagem é ordenada por updatedAt e filtrada por dono (usuário) ou por
    // situação (painel do admin); sem estes índices, cada volta do polling era
    // uma varredura da coleção inteira.
    db.collection('tickets').createIndex({ userId: 1, updatedAt: -1 }),
    db.collection('tickets').createIndex({ status: 1, updatedAt: -1 }),
    db.collection('tickets').createIndex({ assignedTo: 1, status: 1 }),
    // Sustenta a varredura de respostas pendentes (/api/cron/ticket-replies),
    // que roda de 5 em 5 minutos: esparso porque só um punhado de tickets
    // carrega a marca a qualquer momento.
    db.collection('tickets').createIndex({ pendingEmailSince: 1 }, { sparse: true }),
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
    // ── Rastreamento de atividade (/admin/stats) ──
    // Todo painel de estatísticas filtra por janela de tempo, então
    // createdAt entra em todos os índices; os prefixos cobrem os três
    // recortes usados: por conteúdo, por usuário e por área.
    db.collection('activity_events').createIndex({ createdAt: -1 }),
    db.collection('activity_events').createIndex({ kind: 1, createdAt: -1 }),
    db.collection('activity_events').createIndex({ kind: 1, resourceId: 1, createdAt: -1 }),
    db.collection('activity_events').createIndex({ userId: 1, createdAt: -1 }),
    db.collection('activity_events').createIndex({ area: 1, createdAt: -1 }),
    db.collection('exam_attempts').createIndex({ attemptId: 1 }, { unique: true }),
    db.collection('exam_attempts').createIndex({ examId: 1, status: 1, lastSeenAt: -1 }),
    db.collection('exam_attempts').createIndex({ userId: 1, lastSeenAt: -1 }),
    db.collection('exam_attempts').createIndex({ status: 1, lastSeenAt: -1 }),
    db.collection('exam_attempts').createIndex({ openedAt: -1 }),
    /*
     * `exam_progress` — o rascunho da prova em andamento.
     *
     * A chave (`examId`, `userId`) é consultada em toda gravação automática
     * (uma por aluno a cada 12 segundos, e uma turma inteira grava ao mesmo
     * tempo): sem índice, cada gravação varre a coleção. Única, porque um
     * segundo rascunho para a mesma pessoa na mesma prova é o que faria a
     * retomada devolver a metade errada do trabalho — e é o que o `upsert`
     * criaria numa corrida entre duas abas.
     */
    db.collection('exam_progress').createIndex({ examId: 1, userId: 1 }, { unique: true }),
    db.collection('exam_progress').createIndex({ examId: 1, updatedAt: -1 }),
    // `download_logs` alimenta três rankings do painel e não tinha índice
    // nenhum — cada aba varria a coleção inteira.
    db.collection('download_logs').createIndex({ downloadedAt: -1 }),
    db.collection('download_logs').createIndex({ type: 1, downloadedAt: -1 }),
    db.collection('download_logs').createIndex({ userId: 1, downloadedAt: -1 }),
    db.collection('download_logs').createIndex({ type: 1, resourceId: 1, downloadedAt: -1 }),
    db.collection('material_html_viewer_logs').createIndex({ materialId: 1, ts: -1 }),
    db.collection('material_html_viewer_logs').createIndex({ userId: 1, ts: -1 }),
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
    // ── Banco de Questões ──
    // Sem nenhum destes, toda listagem em /banco-questoes varria a
    // coleção inteira: o filtro por assunto/tipo/dificuldade/ano/período,
    // o $lookup de resolução por questão (1 busca por documento) e a
    // ordenação por "menos praticadas" rodavam sem índice nenhum.
    db.collection('banco_questoes').createIndex({ moduloId: 1, createdAt: -1 }),
    db.collection('banco_questoes').createIndex({ topicoId: 1, createdAt: -1 }),
    db.collection('banco_questoes').createIndex({ subtopicoid: 1, createdAt: -1 }),
    db.collection('banco_questoes').createIndex({ periodoId: 1 }),
    db.collection('banco_questoes').createIndex({ tipo: 1, createdAt: -1 }),
    db.collection('banco_questoes').createIndex({ dificuldade: 1, createdAt: -1 }),
    db.collection('banco_questoes').createIndex({ ano: 1, createdAt: -1 }),
    db.collection('banco_questoes').createIndex({ periodoLetivo: 1, createdAt: -1 }),
    db.collection('banco_questoes').createIndex({ createdAt: -1 }),
    db.collection('banco_questoes').createIndex({ totalRespostas: 1, createdAt: -1 }),
    // Cobre o lookup por questão+usuário (listagem/resolução) e o lookup
    // por usuário+questões (contagem de progresso de uma lista).
    db.collection('banco_resolucoes').createIndex({ questaoId: 1, userId: 1, createdAt: -1 }),
    db.collection('banco_resolucoes').createIndex({ userId: 1, questaoId: 1 }),
    db.collection('banco_listas_usuario').createIndex({ userId: 1 }),
  ])
}
