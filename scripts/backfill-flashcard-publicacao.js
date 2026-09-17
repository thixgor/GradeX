#!/usr/bin/env node
/**
 * Conserta os decks de flashcards que ficaram marcados como públicos sem estar
 * publicados.
 *
 * Um deck criado já com visibilidade `public` gravava `isPublished: false`, e a
 * comunidade só listava `isPublished: true` — o deck existia, dizia "Público" na
 * própria página e nunca aparecia em /flashcards. O código agora deriva a
 * publicação da visibilidade, então nada depende desta migração; ela existe para
 * deixar o banco coerente com o que a interface mostra.
 *
 * Também grava `isHidden: false` onde o campo nunca existiu (decks antigos), já
 * que as listas passaram a usar `$ne: true` justamente por causa deles.
 *
 * Uso:
 *   node scripts/backfill-flashcard-publicacao.js --dry-run   # só relata
 *   node scripts/backfill-flashcard-publicacao.js             # aplica
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
const COLLECTION = 'flashcardManualDecks'

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('MONGODB_URI não definido.')
    process.exit(1)
  }

  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db(process.env.MONGODB_DB || undefined)
  const decks = db.collection(COLLECTION)

  console.log(DRY_RUN ? '── SIMULAÇÃO (nada será gravado) ──\n' : '── BACKFILL publicação de decks ──\n')

  const casos = [
    {
      nome: 'público/não-listado sem isPublished',
      filtro: { visibility: { $in: ['public', 'unlisted'] }, isPublished: { $ne: true } },
      update: { $set: { isPublished: true } },
    },
    {
      nome: 'privado marcado como publicado',
      filtro: { visibility: 'private', isPublished: true },
      update: { $set: { isPublished: false } },
    },
    {
      nome: 'sem o campo isHidden',
      filtro: { isHidden: { $exists: false } },
      update: { $set: { isHidden: false } },
    },
  ]

  for (const caso of casos) {
    const total = await decks.countDocuments(caso.filtro)
    console.log(`${caso.nome}: ${total} deck(s)`)
    if (total > 0 && !DRY_RUN) {
      const res = await decks.updateMany(caso.filtro, caso.update)
      console.log(`  → ${res.modifiedCount} atualizado(s)`)
    }
  }

  await client.close()
  console.log(DRY_RUN ? '\nSimulação concluída.' : '\nBackfill concluído.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
