const { MongoClient } = require('mongodb')
const { randomUUID } = require('crypto')

/**
 * Migração aditiva: garante `leadUuid` (UUID v4) em todos os leads existentes,
 * sem remover nem alterar nenhum outro campo. Idempotente — rodar de novo só
 * preenche o que faltar. Também cria índice único em `leadUuid`.
 *
 * Uso:
 *   node scripts/backfill-lead-uuid.js
 */
async function backfill() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gradex'
    const client = new MongoClient(uri)

    try {
        await client.connect()
        const db = client.db()
        const leads = db.collection('leads')

        const total = await leads.countDocuments({})
        const missing = await leads.countDocuments({ leadUuid: { $exists: false } })
        console.log(`🚀 Backfill de leadUuid — total: ${total}, sem UUID: ${missing}`)

        const cursor = leads.find({ leadUuid: { $exists: false } }, { projection: { _id: 1 } })
        let updated = 0
        while (await cursor.hasNext()) {
            const doc = await cursor.next()
            await leads.updateOne({ _id: doc._id }, { $set: { leadUuid: randomUUID() } })
            updated++
            if (updated % 200 === 0) console.log(`  … ${updated} atualizados`)
        }

        console.log(`✅ ${updated} leads receberam leadUuid`)

        // Índice único (parcial, para não falhar caso ainda existam nulos transitórios).
        await leads.createIndex(
            { leadUuid: 1 },
            { unique: true, partialFilterExpression: { leadUuid: { $type: 'string' } } },
        )
        console.log('✅ Índice único em leadUuid garantido')
    } catch (err) {
        console.error('❌ Erro no backfill:', err)
        process.exitCode = 1
    } finally {
        await client.close()
    }
}

backfill()
