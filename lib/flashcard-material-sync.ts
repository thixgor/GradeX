import { ObjectId } from 'mongodb'
import { FLASHCARD_MANUAL_COLLECTIONS } from '@/lib/flashcard-manual'
import type { FlashcardManualDeck } from '@/lib/types'

function isValidObjectId(value: unknown): value is string {
  return typeof value === 'string' && ObjectId.isValid(value)
}

export async function syncMaterialForFlashcardDeck(db: any, deck: FlashcardManualDeck & { _id: ObjectId }) {
  const isPaid = deck.pricing === 'paid'
  const materialPayload = {
    title: deck.title,
    description: deck.description || '',
    coverImage: deck.coverImage || '',
    type: 'flashcard_deck',
    downloadUrl: `/flashcards/d/${deck.slug}`,
    folderId: deck.materialsFolderId || null,
    moduloId: '',
    tags: deck.tags || [],
    pricing: isPaid ? 'paid' : 'free',
    price: isPaid ? deck.price || 0 : 0,
    stripePriceId: isPaid ? deck.stripePriceId || '' : '',
    allowedGroups: deck.allowedGroups || [],
    isHidden: !!deck.isHidden || deck.visibility === 'private',
    isFeatured: !!deck.isFeatured,
    order: 0,
    linkedDeckId: String(deck._id),
    linkedDeckSlug: deck.slug,
    updatedAt: new Date(),
  }

  if (isValidObjectId(deck.linkedMaterialId)) {
    await db.collection('materials').updateOne(
      { _id: new ObjectId(deck.linkedMaterialId) },
      { $set: materialPayload }
    )
    return deck.linkedMaterialId
  }

  const created = await db.collection('materials').insertOne({
    ...materialPayload,
    downloadCount: 0,
    viewCount: 0,
    createdBy: deck.ownerId,
    createdByName: deck.ownerName,
    createdAt: new Date(),
  })

  await db.collection(FLASHCARD_MANUAL_COLLECTIONS.decks).updateOne(
    { _id: deck._id },
    { $set: { linkedMaterialId: String(created.insertedId), updatedAt: new Date() } }
  )
  return String(created.insertedId)
}
