import { getDb } from './mongodb'

/**
 * Registro de cada e-mail que o site tentou mandar.
 *
 * Quando alguém diz "o e-mail não chegou", a primeira pergunta é sempre a
 * mesma: saiu daqui? Sem uma linha dizendo o que o servidor SMTP aceitou ou
 * recusou, o suporte só tinha o log da função, que some em poucas horas e não
 * dá para procurar por destinatário. Com este registro o admin abre a pessoa em
 * /admin/users e vê cada envio, com hora, assunto, tentativas e o erro, se
 * houve.
 *
 * Auxiliar por natureza: nenhuma falha aqui pode derrubar o envio.
 */

export const COLECAO_DE_ENVIOS = 'email_envios'

/** Some sozinho depois disso — é diagnóstico, não arquivo. */
const DIAS_DE_RETENCAO = 45

export interface RegistroDeEnvio {
  /** Destinatários em minúsculas, para a busca por pessoa. */
  para: string[]
  assunto: string
  categoria?: string
  status: 'enviado' | 'falhou'
  tentativas: number
  /** Qual servidor entregou (ou deu o último erro). */
  transporte: 'principal' | 'reserva'
  messageId?: string
  /** Resposta do servidor SMTP ("250 OK queued as …"). */
  resposta?: string
  aceitos?: string[]
  recusados?: string[]
  erro?: string
  codigo?: string
  duracaoMs: number
  createdAt: Date
}

let indicesGarantidos: Promise<void> | null = null

/** Uma vez por instância, nunca por requisição. */
function garantirIndices(): Promise<void> {
  if (!indicesGarantidos) {
    indicesGarantidos = (async () => {
      const db = await getDb()
      const col = db.collection(COLECAO_DE_ENVIOS)
      await Promise.all([
        col.createIndex({ para: 1, createdAt: -1 }),
        col.createIndex({ createdAt: 1 }, { expireAfterSeconds: DIAS_DE_RETENCAO * 24 * 60 * 60 }),
      ])
    })().catch((err) => {
      indicesGarantidos = null
      console.error('[email] falha ao garantir índices do registro de envios:', err)
    })
  }
  return indicesGarantidos
}

/**
 * Códigos numéricos no assunto ("482913 é o seu código…") não vão para o
 * registro: quem lê o registro não precisa — nem deve — ver o código de outra
 * pessoa.
 */
export function assuntoParaRegistro(assunto: string): string {
  return String(assunto || '').replace(/\b\d{4,8}\b/g, '••••').slice(0, 300)
}

export async function registrarEnvio(registro: Omit<RegistroDeEnvio, 'createdAt'>): Promise<void> {
  try {
    void garantirIndices()
    const db = await getDb()
    await db.collection<RegistroDeEnvio>(COLECAO_DE_ENVIOS).insertOne({
      ...registro,
      assunto: assuntoParaRegistro(registro.assunto),
      para: registro.para.map((e) => e.toLowerCase()),
      createdAt: new Date(),
    })
  } catch (err) {
    console.error('[email] falha ao registrar envio:', err)
  }
}

export async function listarEnviosPara(email: string, limite = 30) {
  const db = await getDb()
  const docs = await db
    .collection<RegistroDeEnvio>(COLECAO_DE_ENVIOS)
    .find({ para: String(email || '').trim().toLowerCase() })
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(limite, 1), 100))
    .toArray()
  return docs.map(({ _id, ...doc }) => ({ id: String(_id), ...doc }))
}
