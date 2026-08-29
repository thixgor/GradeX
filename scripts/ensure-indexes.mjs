/**
 * Cria/atualiza os índices do banco. Rode depois de mexer em
 * `lib/mongodb-indexes.ts` — as chamadas são idempotentes, então rodar sobre um
 * banco já indexado não faz nada.
 *
 *   npm run db:indexes
 *
 * Isto costumava acontecer sozinho em toda instância fria de toda função
 * serverless. Saiu de lá porque índice é passo de implantação: recriá-lo a cada
 * partida a frio só gastava memória provisionada e viagens ao Atlas.
 */
import { MongoClient } from 'mongodb'
import { ensureIndexes } from '../lib/mongodb-indexes.ts'

const uri = process.env.MONGODB_URI
if (!uri) {
  console.error('MONGODB_URI não definida. Use: MONGODB_URI="..." npm run db:indexes')
  process.exit(1)
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15_000 })
try {
  await client.connect()
  console.log('Conectado. Criando índices...')
  await ensureIndexes(client.db('gradex'))
  console.log('Índices em dia.')
} catch (err) {
  console.error('Falha ao criar índices:', err)
  process.exitCode = 1
} finally {
  await client.close()
}
