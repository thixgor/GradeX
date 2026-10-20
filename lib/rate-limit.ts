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
 * ## A cota da instância: o banco só entra quando a conta começa a importar
 *
 * Cada chamada aqui era uma ESCRITA no Atlas — inclusive as do `/api/bootstrap`,
 * a requisição mais frequente do app, e as de polling de pagamento e de rifa. Um
 * aluno comum faz duas ou três dessas por minuto, contra tetos de 40 a 300: o
 * banco gravava milhares de contadores por hora para confirmar que ninguém
 * estava perto do limite.
 *
 * Agora cada instância conta na memória e só passa a consultar o banco depois
 * de gastar um quarto do teto dentro da janela. Na primeira ida, leva junto o
 * que contou sozinha, então numa instância só a contagem continua exata. Com
 * várias instâncias, o que escapa é no máximo um quarto do teto por instância
 * que não chegou a reportar — folga irrelevante para tetos de 20 para cima, que
 * são de leitura, polling e checkout.
 *
 * Tetos abaixo de 20 (login, reenvio de verificação, recuperação de senha,
 * verificação de conta) são os que defendem contra força bruta, e janelas
 * acima de um minuto (respostas por dia, envios por hora) são poucas chamadas
 * cuja contagem não pode morrer com a instância: esses continuam indo ao banco
 * em TODA chamada, como antes.
 */
const TETO_MINIMO_PARA_COTA_LOCAL = 20
const JANELA_MAXIMA_PARA_COTA_LOCAL_MS = 60_000
const FRACAO_DA_COTA_LOCAL = 0.25

interface ContagemLocal {
  contadas: number
  reportadas: number
  fim: number
}

const contagensLocais = new Map<string, ContagemLocal>()
let ultimaVarredura = 0

function contarNaInstancia(chave: string, windowMs: number, agora: number): ContagemLocal {
  // Varredura preguiçosa: sem timer, roda no máximo uma vez por minuto.
  if (agora - ultimaVarredura > 60_000) {
    ultimaVarredura = agora
    for (const [k, v] of contagensLocais) if (v.fim <= agora) contagensLocais.delete(k)
  }
  let atual = contagensLocais.get(chave)
  if (!atual || atual.fim <= agora) {
    atual = { contadas: 0, reportadas: 0, fim: agora + windowMs }
    contagensLocais.set(chave, atual)
  }
  atual.contadas += 1
  return atual
}

export function cotaLocal(limit: number, windowMs: number): number {
  if (limit < TETO_MINIMO_PARA_COTA_LOCAL || windowMs > JANELA_MAXIMA_PARA_COTA_LOCAL_MS) return 0
  return Math.floor(limit * FRACAO_DA_COTA_LOCAL)
}

/** Só para testes: zera as contagens desta instância. */
export function _zerarContagensLocais(): void {
  contagensLocais.clear()
  ultimaVarredura = 0
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
  const local = contarNaInstancia(`${endpoint}|${ip}`, windowMs, Date.now())
  if (local.contadas <= cotaLocal(limit, windowMs)) {
    return {
      success: true,
      remaining: Math.max(0, limit - local.contadas),
      resetAt: new Date(local.fim),
    }
  }
  // O que esta instância contou e o banco ainda não sabe, esta inclusa.
  const incremento = local.contadas - local.reportadas
  local.reportadas = local.contadas

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
              $cond: [janelaViva, { $add: [{ $ifNull: ['$count', 0] }, incremento] }, incremento],
            },
            resetAt: {
              $cond: [janelaViva, '$resetAt', fimDaJanelaNova],
            },
          },
        },
      ],
      { upsert: true, returnDocument: 'after' },
    )

    const contagem = registro?.count ?? incremento
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
