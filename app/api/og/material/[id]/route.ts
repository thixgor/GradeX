import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { DEFAULT_OG_IMAGE, absoluteUrl } from '@/lib/seo'
import { resolveFlashcardMaterialCoverImage } from '@/lib/material-flashcard-cover'

export const dynamic = 'force-dynamic'

function contentTypeFromUrl(url: string) {
  if (/\.png(\?|$)/i.test(url)) return 'image/png'
  if (/\.webp(\?|$)/i.test(url)) return 'image/webp'
  if (/\.gif(\?|$)/i.test(url)) return 'image/gif'
  return 'image/jpeg'
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!params?.id || !ObjectId.isValid(params.id)) {
      return NextResponse.redirect(DEFAULT_OG_IMAGE)
    }

    const db = await getDb()
    const material = await db.collection('materials').findOne(
      { _id: new ObjectId(params.id) },
      {
        projection: {
          coverImage: 1,
          type: 1,
          linkedDeckId: 1,
          linkedDeckSlug: 1,
          linkedMaterialId: 1,
          downloadUrl: 1,
        },
      }
    )

    const flashcardCoverImage = material
      ? await resolveFlashcardMaterialCoverImage(db, material)
      : ''
    const imageUrl = absoluteUrl(flashcardCoverImage || material?.coverImage || DEFAULT_OG_IMAGE)

    const imageRes = await fetch(imageUrl, {
      headers: { 'User-Agent': 'DomineAqui OG Image Proxy' },
      cache: 'no-store',
    })

    if (!imageRes.ok) return NextResponse.redirect(DEFAULT_OG_IMAGE)

    const contentType = imageRes.headers.get('content-type') || contentTypeFromUrl(imageUrl)
    const bytes = await imageRes.arrayBuffer()

    return new NextResponse(bytes, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    })
  } catch {
    return NextResponse.redirect(DEFAULT_OG_IMAGE)
  }
}
