/**
 * Quem pode baixar o PDF de um material.
 *
 * Existem duas camadas, e a individual vence a do material:
 *
 *   1. `materials.pdfDownloadEnabled` — o padrão do material. Desligado, o
 *      arquivo só é lido no visualizador protegido.
 *   2. `material_purchases.pdfDownloadAllowed` — a liberação (ou o bloqueio)
 *      individual, gravada no registro de acesso daquela pessoa.
 *
 * A liberação individual foi criada para substituir o envio do PDF por e-mail:
 * um anexo de material grande esbarra no limite da caixa de quem recebe (e no
 * do servidor de saída), enquanto liberar o download para uma pessoa específica
 * entrega o mesmo arquivo — com a mesma marca d'água — sem anexo nenhum.
 *
 * O padrão é NÃO permitir: sem uma liberação individual, quem manda é o
 * material, e num material com download desligado ninguém baixa. `false` no
 * registro individual bloqueia mesmo com o material liberado (o inverso: tirar
 * o download de uma pessoa sem tirar de todas).
 */

/**
 * Liberação individual gravada no registro de acesso:
 *   - `true`  → pode baixar, mesmo com o material bloqueado
 *   - `false` → não pode baixar, mesmo com o material liberado
 *   - `null`  → segue o material (padrão)
 */
export type PdfDownloadOverride = boolean | null

export type PdfDownloadPermissionSource = 'individual' | 'material'

export interface PdfDownloadPermission {
  allowed: boolean
  /** Quem decidiu: a liberação individual ou o padrão do material. */
  source: PdfDownloadPermissionSource
}

/** Campo gravado em `material_purchases`. */
export const PDF_DOWNLOAD_OVERRIDE_FIELD = 'pdfDownloadAllowed'

/** O padrão do material — ausente vale como permitido (comportamento legado). */
export function materialAllowsDownload(material: any): boolean {
  return material?.pdfDownloadEnabled !== false
}

/**
 * Lê a liberação individual de um registro de acesso (`material_purchases`),
 * normalizando qualquer coisa que não seja booleano para `null` (= herda).
 */
export function readDownloadOverride(accessRecord: any): PdfDownloadOverride {
  const raw = accessRecord?.[PDF_DOWNLOAD_OVERRIDE_FIELD]
  return typeof raw === 'boolean' ? raw : null
}

/** Normaliza o valor recebido da API para o que vai ao banco. */
export function normalizeDownloadOverride(value: unknown): PdfDownloadOverride {
  if (value === true || value === 'true' || value === 'allow') return true
  if (value === false || value === 'false' || value === 'block') return false
  return null
}

/**
 * Resolve se esta pessoa pode baixar o PDF deste material.
 *
 * @param material      documento de `materials` (basta `pdfDownloadEnabled`)
 * @param accessRecord  registro de `material_purchases` que deu o acesso (ou
 *                      null, quando o acesso veio por grupo/gratuito)
 */
export function resolvePdfDownloadPermission(
  material: any,
  accessRecord?: any
): PdfDownloadPermission {
  const override = readDownloadOverride(accessRecord)
  if (override !== null) return { allowed: override, source: 'individual' }
  return { allowed: materialAllowsDownload(material), source: 'material' }
}

/** A mesma resolução, partindo de valores soltos (sem os documentos). */
export function resolvePdfDownloadPermissionFrom(
  materialDownloadEnabled: boolean | undefined,
  override: PdfDownloadOverride
): PdfDownloadPermission {
  if (override !== null) return { allowed: override, source: 'individual' }
  return { allowed: materialDownloadEnabled !== false, source: 'material' }
}

/** A recusa que o usuário lê — diferente quando o bloqueio é só dele. */
export function pdfDownloadDeniedMessage(permission: PdfDownloadPermission): string {
  return permission.source === 'individual'
    ? 'O download deste PDF nao esta liberado para a sua conta. Leia o material no visualizador protegido ou fale com a equipe.'
    : 'O download deste PDF foi desabilitado. Use o visualizador protegido quando disponivel.'
}
