const { MongoClient } = require('mongodb')

/**
 * Liga `collectPhone` (pedir WhatsApp no formulário público) em TODAS as
 * campanhas de leads existentes.
 *
 * Por que incondicional (não só onde o campo está ausente): antes desta
 * versão não existia UI para configurar isso, então o backend sempre gravava
 * `collectPhone: false` explicitamente em toda campanha criada — o campo
 * nunca ficava "ausente". Ou seja, não há como diferenciar "admin desligou de
 * propósito" de "nunca teve a opção"; todas as campanhas atuais estão nesse
 * segundo caso, então é seguro (e é o que o admin pediu) ligar para todas.
 * Depois de rodar este script, qualquer novo desligamento feito pela UI de
 * edição da campanha é respeitado normalmente (é só rodar este script uma vez).
 *
 * Uso:
 *   node scripts/backfill-collect-phone.js
 */
async function backfill() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gradex'
    const client = new MongoClient(uri)

    try {
        await client.connect()
        const db = client.db()
        const campaigns = db.collection('lead_campaigns')

        const total = await campaigns.countDocuments({})
        const alreadyOn = await campaigns.countDocuments({ collectPhone: true })
        console.log(`🚀 Backfill de collectPhone — total: ${total}, já ligado: ${alreadyOn}`)

        const res = await campaigns.updateMany(
            { collectPhone: { $ne: true } },
            { $set: { collectPhone: true } },
        )
        // requirePhone só é setado onde ainda não existe, para não sobrescrever
        // uma obrigatoriedade que porventura já tenha sido configurada.
        await campaigns.updateMany(
            { requirePhone: { $exists: false } },
            { $set: { requirePhone: false } },
        )

        console.log(`✅ ${res.modifiedCount} campanhas passaram a pedir WhatsApp no formulário`)
    } catch (err) {
        console.error('❌ Erro no backfill:', err)
        process.exitCode = 1
    } finally {
        await client.close()
    }
}

backfill()
