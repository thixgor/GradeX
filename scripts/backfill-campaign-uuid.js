const { MongoClient } = require('mongodb')
const { randomUUID } = require('crypto')

/**
 * Migração aditiva: garante `campaignUuid` (UUID v4) em todas as campanhas de
 * leads existentes (coleção `lead_campaigns`), sem alterar `slug` — os links
 * públicos /lead/[slug] já divulgados continuam funcionando exatamente iguais.
 * Idempotente — rodar de novo só preenche o que faltar.
 *
 * Uso:
 *   node scripts/backfill-campaign-uuid.js
 */
async function backfill() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gradex'
    const client = new MongoClient(uri)

    try {
        await client.connect()
        const db = client.db()
        const campaigns = db.collection('lead_campaigns')

        const total = await campaigns.countDocuments({})
        const missing = await campaigns.countDocuments({ campaignUuid: { $exists: false } })
        console.log(`🚀 Backfill de campaignUuid — total: ${total}, sem UUID: ${missing}`)

        const cursor = campaigns.find({ campaignUuid: { $exists: false } }, { projection: { _id: 1 } })
        let updated = 0
        while (await cursor.hasNext()) {
            const doc = await cursor.next()
            await campaigns.updateOne({ _id: doc._id }, { $set: { campaignUuid: randomUUID() } })
            updated++
        }

        console.log(`✅ ${updated} campanhas receberam campaignUuid`)

        await campaigns.createIndex(
            { campaignUuid: 1 },
            { unique: true, partialFilterExpression: { campaignUuid: { $type: 'string' } } },
        )
        console.log('✅ Índice único em campaignUuid garantido')
        console.log('ℹ️  Nenhum slug foi alterado — links /lead/[slug] já divulgados continuam válidos.')
    } catch (err) {
        console.error('❌ Erro no backfill:', err)
        process.exitCode = 1
    } finally {
        await client.close()
    }
}

backfill()
