import { MongoClient, Db } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local')
}

const uri: string = process.env.MONGODB_URI
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect().then(async (client) => {
      const db = client.db('gradex')
      // Criar índices essenciais uma única vez
      await Promise.all([
        db.collection('leads').createIndex({ campaignId: 1, email: 1 }),
        db.collection('lead_page_views').createIndex({ campaignId: 1, ip: 1 }),
        db.collection('patologias').createIndex({ slug: 1 }, { unique: true }),
        db.collection('patologias').createIndex({ nome: 'text', sinonimos: 'text', cid10: 'text', classificacao: 'text', fisiopatologia: 'text' }, { default_language: 'portuguese', name: 'patologias_text_search' }),
        db.collection('patologias').createIndex({ areas: 1 }),
        db.collection('patologias').createIndex({ sistema: 1 }),
      ]).catch(err => console.error('Erro ao criar índices iniciais:', err))
      return client
    })
  }
  clientPromise = global._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect().then(async (client) => {
    const db = client.db('gradex')
    // Criar índices essenciais uma única vez
    await Promise.all([
      db.collection('leads').createIndex({ campaignId: 1, email: 1 }),
      db.collection('lead_page_views').createIndex({ campaignId: 1, ip: 1 }),
      db.collection('patologias').createIndex({ slug: 1 }, { unique: true }),
      db.collection('patologias').createIndex({ nome: 'text', sinonimos: 'text', cid10: 'text', classificacao: 'text', fisiopatologia: 'text' }, { default_language: 'portuguese', name: 'patologias_text_search' }),
      db.collection('patologias').createIndex({ areas: 1 }),
      db.collection('patologias').createIndex({ sistema: 1 }),
    ]).catch(err => console.error('Erro ao criar índices iniciais:', err))
    return client
  })
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise
  return client.db('gradex')
}

export default clientPromise
