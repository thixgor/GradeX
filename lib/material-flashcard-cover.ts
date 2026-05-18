import { ObjectId } from 'mongodb'

function parseFlashcardSlug(downloadUrl?: string | null) {
  if (!downloadUrl) return ''
  const match = String(downloadUrl).match(/\/flashcards\/d\/([^/?#]+)/)
  return match?.[1] ? decodeURIComponent(match[1]) : ''
}

export async function resolveFlashcardMaterialCoverImage(db: any, material: any) {
  if (material?.type !== 'flashcard_deck') return ''

  const materialId = material?._id ? String(material._id) : ''
  const downloadSlug = parseFlashcardSlug(material?.downloadUrl)
  const or: any[] = []

  if (material.linkedDeckId && ObjectId.isValid(String(material.linkedDeckId))) {
    or.push({ _id: new ObjectId(String(material.linkedDeckId)) })
  }
  if (material.linkedDeckSlug) or.push({ slug: material.linkedDeckSlug })
  if (downloadSlug) or.push({ slug: downloadSlug })
  if (materialId) or.push({ linkedMaterialId: materialId })

  if (!or.length) return ''

  const linkedDeck = await db
    .collection('flashcardManualDecks')
    .findOne({ $or: or }, { projection: { coverImage: 1 } })

  return linkedDeck?.coverImage || ''
}
