export interface PublicMetricSettings {
  flashcards: {
    showLikes: boolean
    showViews: boolean
  }
  materials: {
    showDownloads: boolean
    showViews: boolean
  }
}

export const DEFAULT_PUBLIC_METRIC_SETTINGS: PublicMetricSettings = {
  flashcards: {
    showLikes: false,
    showViews: false,
  },
  materials: {
    showDownloads: false,
    showViews: false,
  },
}

export function normalizePublicMetricSettings(input: unknown): PublicMetricSettings {
  const value = input && typeof input === 'object' ? input as any : {}

  return {
    flashcards: {
      showLikes: value.flashcards?.showLikes === true,
      showViews: value.flashcards?.showViews === true,
    },
    materials: {
      showDownloads: value.materials?.showDownloads === true,
      showViews: value.materials?.showViews === true,
    },
  }
}
