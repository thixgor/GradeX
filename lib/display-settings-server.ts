import type { Db } from 'mongodb'
import {
  normalizePublicMetricSettings,
  type PublicMetricSettings,
} from './display-settings'

export const PUBLIC_METRIC_SETTINGS_FIELD = 'publicMetricSettings'

export async function getPublicMetricSettings(db: Db): Promise<PublicMetricSettings> {
  const doc = await db
    .collection('landing_settings')
    .findOne({}, { projection: { [PUBLIC_METRIC_SETTINGS_FIELD]: 1 } })

  return normalizePublicMetricSettings(doc?.[PUBLIC_METRIC_SETTINGS_FIELD])
}

export async function savePublicMetricSettings(
  db: Db,
  input: unknown
): Promise<PublicMetricSettings> {
  const settings = normalizePublicMetricSettings(input)
  const collection = db.collection('landing_settings')

  const existingDocs = await collection.find({}).limit(2).toArray()
  if (existingDocs.length > 1) {
    const [keep, ...extras] = existingDocs
    await collection.deleteMany({ _id: { $in: extras.map(doc => doc._id) } })
    await collection.updateOne(
      { _id: keep._id },
      { $set: { [PUBLIC_METRIC_SETTINGS_FIELD]: settings, updatedAt: new Date() } }
    )
  } else {
    await collection.updateOne(
      {},
      { $set: { [PUBLIC_METRIC_SETTINGS_FIELD]: settings, updatedAt: new Date() } },
      { upsert: true }
    )
  }

  return settings
}
