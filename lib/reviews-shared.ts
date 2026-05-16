export type ReviewTargetType = 'material' | 'flashcard_deck'

export const REVIEW_TARGET_TYPES: ReviewTargetType[] = ['material', 'flashcard_deck']

export const REVIEW_COMMENT_MAX = 1500
export const REVIEW_DISPLAY_NAME_MAX = 80
export const REVIEW_AVATAR_URL_MAX = 500

export interface PublicReview {
  _id: string
  targetType: ReviewTargetType
  targetId: string
  rating: 1 | 2 | 3 | 4 | 5
  comment: string
  userId: string | null
  displayName: string
  avatarUrl: string | null
  isAdminCreated: boolean
  isFeatured: boolean
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface ReviewSummary {
  count: number
  avg: number
  distribution: { 1: number; 2: number; 3: number; 4: number; 5: number }
}
