/**
 * Persistência da conexão de marketplace (OAuth) do Mercado Pago.
 *
 * Depois que o admin conecta a conta à aplicação do sócio, guardamos aqui o
 * access token (vinculado ao marketplace) e o refresh token. A camada de
 * pagamento passa a usar ESTE token no lugar do MERCADOPAGO_ACCESS_TOKEN do
 * ambiente — então o split funciona sem precisar reeditar variáveis no Vercel.
 *
 * Segurança: este documento contém credenciais sensíveis. A coleção só é lida
 * no servidor; nunca exponha o token completo em respostas de API.
 */

import { getDb } from '@/lib/mongodb'
import { getPaymentConfig } from '../config'
import { refreshAccessToken, type MpOAuthTokenResponse } from './oauth'

const COLLECTION = 'mercadopago_marketplace'
const DOC_ID = 'connection'

/** Renova o token quando faltar menos que isto para expirar (7 dias). */
const REFRESH_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000

export interface MarketplaceConnection {
  _id: string
  accessToken: string
  refreshToken: string
  /** ID numérico da conta que processa os pagamentos (collector). */
  collectorId: number
  publicKey?: string
  liveMode?: boolean
  scope?: string
  expiresAt: Date
  connectedAt: Date
  updatedAt: Date
  connectedByUserId?: string
}

function expiresAtFrom(expiresInSeconds: number): Date {
  const ms = (Number(expiresInSeconds) || 0) * 1000
  return new Date(Date.now() + ms)
}

/** Salva (ou substitui) a conexão de marketplace após o OAuth. */
export async function saveMarketplaceConnection(
  token: MpOAuthTokenResponse,
  byUserId?: string
): Promise<void> {
  const db = await getDb()
  const now = new Date()
  await db.collection<MarketplaceConnection>(COLLECTION).updateOne(
    { _id: DOC_ID },
    {
      $set: {
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        collectorId: token.user_id,
        publicKey: token.public_key,
        liveMode: token.live_mode,
        scope: token.scope,
        expiresAt: expiresAtFrom(token.expires_in),
        updatedAt: now,
        connectedByUserId: byUserId,
      },
      $setOnInsert: { connectedAt: now },
    },
    { upsert: true }
  )
}

/** Lê a conexão de marketplace, ou null se nunca foi conectada. */
export async function getMarketplaceConnection(): Promise<MarketplaceConnection | null> {
  try {
    const db = await getDb()
    return await db.collection<MarketplaceConnection>(COLLECTION).findOne({ _id: DOC_ID })
  } catch (err) {
    console.error('[payments] erro ao ler conexão de marketplace MP:', err)
    return null
  }
}

/** Remove a conexão (desconectar). Volta a usar o token do ambiente. */
export async function clearMarketplaceConnection(): Promise<void> {
  const db = await getDb()
  await db.collection<MarketplaceConnection>(COLLECTION).deleteOne({ _id: DOC_ID })
}

export interface EffectiveMpAuth {
  accessToken: string
  /** 'marketplace' = token do OAuth (split ativo); 'env' = MERCADOPAGO_ACCESS_TOKEN. */
  source: 'marketplace' | 'env'
  connected: boolean
  collectorId?: number
}

export interface EffectiveMpPublicKey {
  publicKey: string
  /** De onde saiu a chave: a conexão de marketplace ou o ambiente. */
  source: 'marketplace' | 'env'
  /**
   * true quando há conexão de marketplace mas ela não trouxe public key, e
   * caímos na do ambiente. Nesse estado a chave NÃO pareia com o token — o
   * cartão falha; Pix e boleto seguem funcionando.
   */
  fellBackToEnv: boolean
}

/**
 * Resolve a public key que o NAVEGADOR deve usar para tokenizar o cartão.
 *
 * Precisa parear com o access token que `getEffectiveMpAuth()` devolve: o
 * token do cartão é criado no navegador com esta chave e cobrado no servidor
 * com aquele token. Se os dois vierem de aplicações diferentes (ex.: chave do
 * ambiente + token de marketplace), o Mercado Pago recusa a cobrança com
 * "Invalid credentials" — e o sintoma engana, porque Pix e boleto continuam
 * funcionando (eles não passam por tokenização de cartão).
 *
 * Diferente do access token, a public key não expira — por isso esta função
 * NÃO dispara refresh de token. Ela é chamada por um endpoint público, e
 * renovar credencial ali seria efeito colateral indevido.
 */
export async function getEffectiveMpPublicKey(): Promise<EffectiveMpPublicKey> {
  const cfg = getPaymentConfig()
  const conn = await getMarketplaceConnection()

  if (!conn?.accessToken) {
    return { publicKey: cfg.mp.publicKey, source: 'env', fellBackToEnv: false }
  }
  if (conn.publicKey) {
    return { publicKey: conn.publicKey, source: 'marketplace', fellBackToEnv: false }
  }

  // Conectado porém sem public key salva (o OAuth do MP marca o campo como
  // opcional). Mantemos a do ambiente para não derrubar Pix/boleto junto, mas
  // sinalizamos — o admin precisa reconectar para o cartão voltar.
  return { publicKey: cfg.mp.publicKey, source: 'marketplace', fellBackToEnv: true }
}

/**
 * Resolve o access token que a camada de pagamento deve usar:
 *  - se houver conexão de marketplace salva, usa o token dela (renovando se
 *    estiver perto de expirar);
 *  - caso contrário, cai no MERCADOPAGO_ACCESS_TOKEN do ambiente.
 *
 * Ao tokenizar cartão no navegador, use SEMPRE `getEffectiveMpPublicKey()`:
 * as duas credenciais formam um par e precisam sair da mesma aplicação.
 */
export async function getEffectiveMpAuth(): Promise<EffectiveMpAuth> {
  const cfg = getPaymentConfig()
  const conn = await getMarketplaceConnection()

  if (!conn?.accessToken) {
    return { accessToken: cfg.mp.accessToken, source: 'env', connected: false }
  }

  const expiresMs = conn.expiresAt ? new Date(conn.expiresAt).getTime() : 0
  const needsRefresh = expiresMs - Date.now() < REFRESH_THRESHOLD_MS

  if (needsRefresh && conn.refreshToken && cfg.mp.oauth.clientId && cfg.mp.oauth.clientSecret) {
    try {
      const refreshed = await refreshAccessToken({
        clientId: cfg.mp.oauth.clientId,
        clientSecret: cfg.mp.oauth.clientSecret,
        refreshToken: conn.refreshToken,
      })
      await saveMarketplaceConnection(refreshed, conn.connectedByUserId)
      return {
        accessToken: refreshed.access_token,
        source: 'marketplace',
        connected: true,
        collectorId: refreshed.user_id,
      }
    } catch (err) {
      // Falha ao renovar: usa o token atual (pode ainda estar válido) e loga.
      console.error('[payments] falha ao renovar token de marketplace MP:', err)
    }
  }

  return {
    accessToken: conn.accessToken,
    source: 'marketplace',
    connected: true,
    collectorId: conn.collectorId,
  }
}
