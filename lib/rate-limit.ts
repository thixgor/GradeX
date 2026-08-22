import { getDb } from './mongodb'

/**
 * Rate limit que sobrevive ao serverless.
 *
 * ## O que estava errado
 *
 * A versão anterior tinha três problemas, e os três apareciam justamente sob
 * carga — que é quando um rate limit precisa funcionar:
 *
 * 1. **Um `deleteMany` a cada chamada.** Toda requisição limitada começava
 *    varrendo a coleção inteira para apagar registros vencidos. Isso é trabalho
 *    proporcional ao tráfego, executado *por causa* do tráfego: quanto mais
 *    alguém martelava o endpoint, mais caro ficava defendê-lo. Um índice TTL faz
 *    a mesma limpeza de graça, em segundo plano.
 *
 * 2. **Contagem não atômica.** Era `findOne` e depois `updateOne`. Entre as duas
 *    chamadas cabem quantas requisições concorrentes o atacante quiser: todas
 *    leem o mesmo `count` abaixo do limite e todas passam. Num endpoint de
 *    login, é a diferença entre cinco tentativas por janela e quantas couberem
 *    em paralelo.
 *
 * 3. **`insertOne` sem upsert.** Duas primeiras requisições simultâneas criavam
 *    dois registros para o mesmo par (chave, endpoint), e a contagem passava a
 *    ser dividida entre eles — cada um contando metade do tráfego real.
 *
 * ## Como está agora
 *
 * Uma única `findOneAndUpdate` com pipeline de atualização faz tudo de uma vez e
 * sem espaço entre leitura e escrita: se a janela ainda vale, incrementa; se
 * venceu, começa uma janela nova. O índice único garante um registro por chave,
 * e o TTL recolhe os vencidos sozinho.
 */

const COLECAO = 'rate_limits'

let indicesGarantidos = false

async function garantirIndices(collection: any) {
  if (indicesGarantidos) return
  try {
    await Promise.all([
      // Um registro por par (chave, endpoint) — é o que torna o upsert seguro.
      collection.createIndex({ ip: 1, endpoint: 1 }, { unique: true }),
      // Recolhe o registro assim que a janela vence, sem varredura nossa.
      collection.createIndex({ resetAt: 1 }, { expireAfterSeconds: 0 }),
    ])
    indicesGarantidos = true
  } catch (err) {
    // Índice já existente com outra forma, permissão, corrida entre instâncias:
    // nada disso deve impedir a checagem em si de acontecer.
    console.error('[rate-limit] falha ao garantir índices:', err)
  }
}

export interface ResultadoDeLimite {
  success: boolean
  remaining: number
  /** Quando a janela atual termina — útil para o cabeçalho `Retry-After`. */
  resetAt?: Date
}

/**
 * Consome uma unidade da cota e diz se a requisição pode seguir.
 *
 * `ip` é o nome histórico do parâmetro e continua aceito, mas o valor pode ser
 * qualquer chave estável: `secureApiEndpoint` passa a identidade da sessão
 * quando existe, porque limitar por IP sozinho não segura quem troca de rede.
 *
 * Falha ABERTA de propósito: se o banco estiver indisponível, um erro aqui
 * derrubaria endpoints que estavam funcionando, transformando uma intermitência
 * do Atlas numa queda do site. O log registra, e a próxima chamada tenta de novo.
 */
export async function checkRateLimit(
  ip: string,
  endpoint: string,
  limit: number,
  windowMs: number,
): Promise<ResultadoDeLimite> {
  try {
    const db = await getDb()
    const collection = db.collection(COLECAO)

    void garantirIndices(collection)

    const agora = new Date()
    const fimDaJanelaNova = new Date(agora.getTime() + windowMs)

    // Uma ida ao banco resolve as duas possibilidades — janela viva (incrementa)
    // e janela vencida (recomeça) — sem intervalo entre ler e escrever.
    const janelaViva = { $gt: ['$resetAt', agora] }

    const registro = await collection.findOneAndUpdate(
      { ip, endpoint },
      [
        {
          $set: {
            ip,
            endpoint,
            count: {
              $cond: [janelaViva, { $add: [{ $ifNull: ['$count', 0] }, 1] }, 1],
            },
            resetAt: {
              $cond: [janelaViva, '$resetAt', fimDaJanelaNova],
            },
          },
        },
      ],
      { upsert: true, returnDocument: 'after' },
    )

    const contagem = registro?.count ?? 1
    const resetAt: Date = registro?.resetAt ?? fimDaJanelaNova

    if (contagem > limit) {
      return { success: false, remaining: 0, resetAt }
    }

    return { success: true, remaining: Math.max(0, limit - contagem), resetAt }
  } catch (error) {
    console.error('[rate-limit] falha ao verificar limite:', error)
    return { success: true, remaining: limit }
  }
}
