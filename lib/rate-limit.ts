
import { getDb } from './mongodb'

export async function checkRateLimit(ip: string, endpoint: string, limit: number, windowMs: number): Promise<{ success: boolean; remaining: number }> {
    const db = await getDb()
    const collection = db.collection('rate_limits')
    const now = new Date()

    // Clean up old entries
    await collection.deleteMany({ resetAt: { $lt: now } })

    const record = await collection.findOne({ ip, endpoint })

    if (!record) {
        await collection.insertOne({
            ip,
            endpoint,
            count: 1,
            resetAt: new Date(now.getTime() + windowMs)
        })
        return { success: true, remaining: limit - 1 }
    }

    if (record.count >= limit) {
        return { success: false, remaining: 0 }
    }

    await collection.updateOne(
        { _id: record._id },
        { $inc: { count: 1 } }
    )

    return { success: true, remaining: limit - record.count - 1 }
}
