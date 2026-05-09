import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import stripe from '@/lib/stripe'

export const dynamic = 'force-dynamic'

// POST - Criar sessão de checkout para material/pacote
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const { itemType, itemId } = await request.json()

    if (!itemType || !itemId) {
      return NextResponse.json({ error: 'Tipo e ID do item são obrigatórios' }, { status: 400 })
    }

    // Verificar se já comprou
    const existingPurchase = await db.collection('material_purchases').findOne({
      userId: session.userId,
      itemType,
      itemId,
      status: 'completed',
    })

    if (existingPurchase) {
      return NextResponse.json({ error: 'Você já adquiriu este item' }, { status: 400 })
    }

    // Buscar o item
    const collection = itemType === 'package' ? 'material_packages' : 'materials'
    const item = await db.collection(collection).findOne({ _id: new ObjectId(itemId) })

    if (!item) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })
    }

    // Se for um material vinculado a um deck de flashcard, montamos a URL de
    // sucesso apontando para o deck — o usuário cai direto no estudo após pagar.
    const isFlashcardDeck = item.type === 'flashcard_deck' && item.linkedDeckSlug
    const successPath = isFlashcardDeck
      ? `/flashcards/d/${item.linkedDeckSlug}?purchase=success`
      : `/materiais?purchase=success&session_id={CHECKOUT_SESSION_ID}`
    const cancelPath = isFlashcardDeck
      ? `/flashcards/d/${item.linkedDeckSlug}?purchase=canceled`
      : `/materiais?purchase=canceled`

    if (item.pricing === 'free') {
      // Para itens gratuitos, criar compra diretamente
      await db.collection('material_purchases').insertOne({
        userId: session.userId,
        userName: session.name,
        userEmail: session.email,
        itemType,
        itemId,
        itemTitle: item.title,
        price: 0,
        status: 'completed',
        purchasedAt: new Date(),
      })

      // Incrementar contador de downloads
      await db.collection(collection).updateOne(
        { _id: new ObjectId(itemId) },
        { $inc: { downloadCount: 1 } }
      )

      return NextResponse.json({
        free: true,
        success: true,
        redirectTo: isFlashcardDeck ? `/flashcards/d/${item.linkedDeckSlug}` : null,
      })
    }

    // Para itens pagos, criar sessão do Stripe
    if (!item.stripePriceId) {
      // Se não tem stripePriceId, criar um preço dinâmico
      const priceInCents = Math.round((item.price || 0) * 100)

      const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card', 'boleto'],
        line_items: [
          {
            price_data: {
              currency: 'brl',
              product_data: {
                name: item.title,
                description: item.description || undefined,
                images: item.coverImage ? [item.coverImage] : undefined,
              },
              unit_amount: priceInCents,
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${successPath}${isFlashcardDeck ? '' : ''}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${cancelPath}`,
        customer_email: session.email,
        metadata: {
          userId: session.userId,
          userName: session.name,
          itemType,
          itemId,
          itemTitle: item.title,
          price: String(item.price || 0),
          purchaseType: 'material',
          ...(isFlashcardDeck ? { flashcardDeckSlug: item.linkedDeckSlug, flashcardDeckId: item.linkedDeckId || '' } : {}),
        },
      })

      return NextResponse.json({ url: checkoutSession.url })
    }

    // Se tem stripePriceId configurado
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'boleto'],
      line_items: [
        {
          price: item.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${successPath}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${cancelPath}`,
      customer_email: session.email,
      metadata: {
        userId: session.userId,
        userName: session.name,
        itemType,
        itemId,
        itemTitle: item.title,
        price: String(item.price || 0),
        purchaseType: 'material',
        ...(isFlashcardDeck ? { flashcardDeckSlug: item.linkedDeckSlug, flashcardDeckId: item.linkedDeckId || '' } : {}),
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error('Material checkout error:', error)
    return NextResponse.json({ error: 'Erro ao criar sessão de pagamento' }, { status: 500 })
  }
}
