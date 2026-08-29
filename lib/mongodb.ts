import { MongoClient, Db } from 'mongodb'
import { ensureIndexes } from './mongodb-indexes'

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local')
}

const uri: string = process.env.MONGODB_URI
// Opções afinadas para serverless (Vercel): cada lambda mantém um pool pequeno,
// devolve conexões ociosas rápido e — crucialmente — desiste da seleção de
// servidor em 5s. Sem `serverSelectionTimeoutMS` o driver usa 30s por padrão,
// então uma eleição lenta no Atlas travava o login por meio minuto.
const options = {
  maxPoolSize: 10,
  minPoolSize: 0,
  maxIdleTimeMS: 60_000,
  serverSelectionTimeoutMS: 5_000,
}

/**
 * Os índices são criados na conexão apenas em desenvolvimento (banco local
 * novo precisa deles e ninguém lembra de rodar o script) ou quando
 * `MONGODB_ENSURE_INDEXES=1` pede explicitamente — é o que `npm run
 * db:indexes` faz.
 *
 * Em produção **não**. As ~114 chamadas de `createIndex` rodavam em toda
 * instância fria, recriando índices que já existiam desde a primeira partida.
 * Fluid Compute cobra memória provisionada pelo tempo em que a instância está
 * ativa, então cada partida a frio pagava por 114 idas ao Atlas que não
 * mudavam nada. Índice é passo de implantação, não de requisição.
 */
const criarIndicesNaConexao =
  process.env.NODE_ENV === 'development' || process.env.MONGODB_ENSURE_INDEXES === '1'

function conectar(): Promise<MongoClient> {
  const client = new MongoClient(uri, options)
  return client.connect().then((client) => {
    if (criarIndicesNaConexao) {
      // Sem `await`: são idempotentes e nenhuma query precisa deles para
      // funcionar, então não faz sentido segurar a primeira requisição.
      void ensureIndexes(client.db('gradex')).catch((err) =>
        console.error('Erro ao criar índices iniciais:', err),
      )
    }
    return client
  })
}

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // O cache global sobrevive ao hot reload; sem ele cada recompilação abriria
  // um pool novo contra o mesmo banco.
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = conectar()
  }
  clientPromise = global._mongoClientPromise
} else {
  clientPromise = conectar()
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise
  return client.db('gradex')
}

export default clientPromise
