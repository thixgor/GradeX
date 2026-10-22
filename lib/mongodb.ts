import { MongoClient, Db } from 'mongodb'
import { ensureIndexes } from './mongodb-indexes'

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local')
}

const uri: string = process.env.MONGODB_URI
// Opções afinadas para serverless (Vercel): cada lambda mantém um pool pequeno
// e devolve conexões ociosas rápido.
//
// `serverSelectionTimeoutMS` é quanto uma operação espera por um servidor que
// a atenda. O padrão do driver (30 s) travava o login por meio minuto numa
// queda; 5 s, o valor que veio depois, é menor que a troca de primário do
// Atlas (manutenção ou eleição, normalmente até ~12 s) — e quem chegava nessa
// janela recebia `ReplicaSetNoPrimary` em vez de esperar a troca terminar. Era
// a maior parte dos erros de banco no log de 21/10. 15 s atravessa a troca e
// ainda cabe com folga no teto de 30 s das rotas.
const options = {
  maxPoolSize: 10,
  minPoolSize: 0,
  maxIdleTimeMS: 60_000,
  serverSelectionTimeoutMS: 15_000,
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
  return client.connect().then(
    (client) => {
      if (criarIndicesNaConexao) {
        // Sem `await`: são idempotentes e nenhuma query precisa deles para
        // funcionar, então não faz sentido segurar a primeira requisição.
        void ensureIndexes(client.db('gradex')).catch((err) =>
          console.error('Erro ao criar índices iniciais:', err),
        )
      }
      return client
    },
    (erro) => {
      // A tentativa que falhou não deixa sockets nem monitores para trás.
      void client.close().catch(() => {})
      throw erro
    },
  )
}

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

/**
 * A conexão da instância — e uma nova tentativa quando a anterior falhou.
 *
 * A conexão era aberta uma vez só, na carga do módulo, e a promessa ficava
 * guardada para sempre. Se essa primeira tentativa falhasse (o primário do
 * Atlas trocando naquele instante, um handshake TLS que estourou), a FALHA
 * ficava guardada: toda requisição daquela instância recebia o mesmo erro na
 * hora, sem tentar de novo, até a Vercel reciclar a instância. Agora a
 * promessa rejeitada é esquecida e a próxima chamada conecta outra vez. Depois
 * de conectado, quem cuida de queda e troca de primário é o próprio driver.
 *
 * Em desenvolvimento a promessa mora no `global`, que sobrevive ao hot reload:
 * sem isso cada recompilação abriria um pool novo contra o mesmo banco.
 */
let conexaoDaInstancia: Promise<MongoClient> | undefined
const emDesenvolvimento = process.env.NODE_ENV === 'development'

function conexaoGuardada(): Promise<MongoClient> | undefined {
  return emDesenvolvimento ? global._mongoClientPromise : conexaoDaInstancia
}

function guardarConexao(conexao: Promise<MongoClient> | undefined): void {
  if (emDesenvolvimento) global._mongoClientPromise = conexao
  else conexaoDaInstancia = conexao
}

function obterCliente(): Promise<MongoClient> {
  const guardada = conexaoGuardada()
  if (guardada) return guardada
  const tentativa = conectar()
  guardarConexao(tentativa)
  tentativa.catch(() => {
    if (conexaoGuardada() === tentativa) guardarConexao(undefined)
  })
  return tentativa
}

// Começa a conectar já na carga do módulo, como antes: a primeira requisição
// de uma instância fria não espera o handshake do zero. O `catch` só evita a
// rejeição solta; quem chamar `getDb` recebe o erro (ou a nova tentativa).
void obterCliente().catch(() => {})

export async function getDb(): Promise<Db> {
  const client = await obterCliente()
  return client.db('gradex')
}

/**
 * O export antigo, para as rotas que fazem `await clientPromise`. É uma
 * promessa "viva": cada `await` passa por `obterCliente`, então também ganha a
 * nova tentativa em vez de herdar uma falha guardada.
 */
const clientPromise: Promise<MongoClient> = {
  then<A = MongoClient, B = never>(
    aoResolver?: ((cliente: MongoClient) => A | PromiseLike<A>) | null,
    aoRejeitar?: ((erro: unknown) => B | PromiseLike<B>) | null,
  ): Promise<A | B> {
    return obterCliente().then(aoResolver, aoRejeitar)
  },
  catch<B = never>(aoRejeitar?: ((erro: unknown) => B | PromiseLike<B>) | null): Promise<MongoClient | B> {
    return obterCliente().catch(aoRejeitar)
  },
  finally(aoFim?: (() => void) | null): Promise<MongoClient> {
    return obterCliente().finally(aoFim)
  },
  [Symbol.toStringTag]: 'Promise',
}

export default clientPromise
