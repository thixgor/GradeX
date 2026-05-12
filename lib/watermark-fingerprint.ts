export function emailFingerprint(email: string | undefined): string {
  const normalized = (email || '').trim().toLowerCase()
  if (!normalized) return 'mail-na'

  let hash = 5381
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) + hash) ^ normalized.charCodeAt(i)
  }

  return `mail-${(hash >>> 0).toString(36).slice(0, 8)}`
}
