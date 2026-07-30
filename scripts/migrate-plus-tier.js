#!/usr/bin/env node
/**
 * Migração: PREMIUM + ESSENTIAL → Plus+ (`plus`).
 *
 * O código já lê os cargos legados via `lib/account-tier.ts`, então nada quebra
 * se esta migração não rodar. Ela existe para deixar o banco consistente e
 * permitir que, mais adiante, os aliases legados sejam removidos.
 *
 * Uso:
 *   node scripts/migrate-plus-tier.js --dry-run   # só relata, não grava
 *   node scripts/migrate-plus-tier.js             # aplica
 *
 * Requer MONGODB_URI no ambiente (ou .env.local).
 */

const path = require('path')
const fs = require('fs')

// Carrega .env.local sem depender de dotenv.
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
}

const { MongoClient } = require('mongodb')

const DRY_RUN = process.argv.includes('--dry-run')
const LEGACY = ['premium', 'essential']

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('MONGODB_URI não definido.')
    process.exit(1)
  }

  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db(process.env.MONGODB_DB || undefined)

  console.log(DRY_RUN ? '── SIMULAÇÃO (nada será gravado) ──\n' : '── MIGRAÇÃO Plus+ ──\n')

  const report = []

  // 1) Usuários: accountType premium|essential → plus
  await step(report, 'users.accountType', db.collection('users'), { accountType: { $in: LEGACY } }, {
    $set: { accountType: 'plus' },
  })

  // 2) Planos configurados em admin_settings.planos[].role
  {
    const settings = await db.collection('admin_settings').findOne({})
    const planos = settings?.planos || []
    const toFix = planos.filter(p => LEGACY.includes(p.role))
    console.log(`admin_settings.planos: ${toFix.length} plano(s) com cargo legado`)
    if (toFix.length && !DRY_RUN) {
      const updated = planos.map(p => (LEGACY.includes(p.role) ? { ...p, role: 'plus' } : p))
      await db.collection('admin_settings').updateOne({}, { $set: { planos: updated } })
    }
    report.push(['admin_settings.planos', toFix.length])
  }

  // 3) Assinaturas: subscriptions.role
  await step(report, 'subscriptions.role', db.collection('subscriptions'), { role: { $in: LEGACY } }, {
    $set: { role: 'plus' },
  })

  // 4) Serial keys: grant.role, grant.productType e type
  await step(report, 'serial_keys.grant.role', db.collection('serial_keys'), { 'grant.role': { $in: LEGACY } }, {
    $set: { 'grant.role': 'plus' },
  })
  await step(report, 'serial_keys.grant.productType', db.collection('serial_keys'), { 'grant.productType': { $in: LEGACY } }, {
    $set: { 'grant.productType': 'plus' },
  })
  await step(report, 'serial_keys.type', db.collection('serial_keys'), { type: 'premium' }, {
    $set: { type: 'plus' },
  })

  // 5) Grupos de acesso: materiais, pacotes e decks.
  // Não basta um $set — a lista pode conter ambos os legados e viraria ['plus','plus'].
  for (const col of ['materials', 'material_packages', 'flashcardManualDecks']) {
    const docs = await db
      .collection(col)
      .find({ allowedGroups: { $in: LEGACY } }, { projection: { allowedGroups: 1 } })
      .toArray()
    console.log(`${col}.allowedGroups: ${docs.length} documento(s)`)
    if (!DRY_RUN) {
      for (const d of docs) {
        const next = Array.from(
          new Set((d.allowedGroups || []).map(g => (LEGACY.includes(g) ? 'plus' : g))),
        )
        await db.collection(col).updateOne({ _id: d._id }, { $set: { allowedGroups: next } })
      }
    }
    report.push([`${col}.allowedGroups`, docs.length])
  }

  // 6) Aulas: visibilidade 'premium' → 'plus'
  await step(report, 'aulas_postagens.visibilidade', db.collection('aulas_postagens'), { visibilidade: 'premium' }, {
    $set: { visibilidade: 'plus' },
  })

  // 7) Manual Clínico: duas flags antigas → includedInPlus
  {
    const col = db.collection('manual_clinico_product_settings')
    const docs = await col
      .find({ $or: [{ includedInPremium: { $exists: true } }, { includedInEssential: { $exists: true } }] })
      .toArray()
    console.log(`manual_clinico_product_settings: ${docs.length} documento(s)`)
    if (!DRY_RUN) {
      for (const d of docs) {
        await col.updateOne(
          { _id: d._id },
          {
            $set: { includedInPlus: d.includedInPlus ?? (d.includedInPremium === true || d.includedInEssential === true) },
            $unset: { includedInPremium: '', includedInEssential: '' },
          },
        )
      }
    }
    report.push(['manual_clinico_product_settings', docs.length])
  }

  // 8) Índices do Plus+ Guard (idempotente)
  if (!DRY_RUN) {
    const logs = db.collection('plus_download_logs')
    await logs.createIndex({ userId: 1, createdAt: -1 })
    await logs.createIndex({ createdAt: -1 })
    await logs.createIndex({ inRefundWindow: 1, createdAt: -1 })
    await logs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 })
    console.log('\nÍndices de plus_download_logs criados.')
  }

  console.log('\n── Resumo ──')
  for (const [name, count] of report) {
    console.log(`  ${String(count).padStart(6)}  ${name}`)
  }
  console.log(DRY_RUN ? '\nSimulação concluída — nada foi gravado.' : '\nMigração concluída.')

  await client.close()
}

async function step(report, name, collection, filter, update) {
  const count = await collection.countDocuments(filter)
  console.log(`${name}: ${count} documento(s)`)
  if (count > 0 && !DRY_RUN) {
    await collection.updateMany(filter, update)
  }
  report.push([name, count])
}

main().catch(err => {
  console.error('Falha na migração:', err)
  process.exit(1)
})
