/**
 * Leitura do registro de cargos no servidor.
 *
 * Separado de `lib/cargos.ts` pelo mesmo motivo que
 * `plan-entitlements-server.ts` é separado do núcleo: o modelo é isomórfico e
 * roda no navegador; só isto aqui toca o Mongo.
 *
 * O registro é dado impessoal — o mesmo para todo mundo —, então cabe na
 * memória curta do servidor. A janela de 30s é a mesma do catálogo de planos,
 * pelo mesmo motivo: absorve a rajada de checagens de uma abertura de tela sem
 * fazer o admin esperar para ver o que acabou de salvar.
 */

import type { Db } from 'mongodb'
import { getDb } from './mongodb'
import { invalidarCacheDeServidor, memoizarPorTempo } from './cache-de-servidor'
import {
  acharCargo,
  cargoPublico,
  mesclarRegistroDeCargos,
  type CargoDefinicao,
  type CargoPublico,
} from './cargos'
import { isPaidAccount, normalizeAccountType } from './account-tier'

const CHAVE_DO_REGISTRO = 'cargos:registro'
const TTL_MS = 30_000

/**
 * Descarta o registro memoizado. Chamado pela rota que grava os cargos, para
 * que a edição valha na requisição seguinte em vez de depender do TTL — quem
 * acabou de salvar precisa poder conferir na hora.
 */
export function invalidarRegistroDeCargos(): void {
  invalidarCacheDeServidor(CHAVE_DO_REGISTRO)
}

/**
 * O registro completo: os cargos de fábrica mesclados com o que o admin gravou.
 *
 * Nunca devolve lista vazia. Falha de leitura cai nos embutidos — um registro
 * ausente não pode virar "ninguém tem cargo", que fecharia a plataforma para
 * todos os assinantes de uma vez.
 */
export async function lerRegistroDeCargos(db?: Db): Promise<CargoDefinicao[]> {
  return memoizarPorTempo(CHAVE_DO_REGISTRO, TTL_MS, async () => {
    try {
      const database = db ?? (await getDb())
      const settings = await database
        .collection('admin_settings')
        .findOne({}, { projection: { cargos: 1 } })
      return mesclarRegistroDeCargos(settings?.cargos)
    } catch (erro) {
      console.error('[cargos] falha ao ler o registro, usando os embutidos:', erro)
      return mesclarRegistroDeCargos(null)
    }
  })
}

/** O registro no recorte que o navegador pode ver. */
export async function lerCargosPublicos(db?: Db): Promise<CargoPublico[]> {
  const registro = await lerRegistroDeCargos(db)
  return registro.map(cargoPublico)
}

/**
 * O cargo de uma conta — ou `null` quando o valor gravado não existe mais no
 * registro (cargo apagado depois de já ter sido atribuído a alguém).
 *
 * Não normaliza para `gratuito` de propósito: quem chama precisa saber a
 * diferença entre "é gratuito" e "tem um cargo que ninguém reconhece", porque
 * a segunda situação é a que merece o caminho legado, não o piso.
 */
export async function lerCargoDaConta(
  accountType?: string | null,
  db?: Db,
): Promise<CargoDefinicao | null> {
  const registro = await lerRegistroDeCargos(db)
  // Passa pelos aliases legados primeiro: uma conta ainda gravada como
  // `premium` precisa encontrar o cargo `plus`.
  return acharCargo(registro, normalizeAccountType(accountType))
}

/**
 * O cargo tem o bloco modular ligado? Só então ele responde por área.
 *
 * É o teste que separa "o registro manda nesta conta" de "o caminho legado
 * manda" — ver a regra de precedência no cabeçalho de `lib/cargos.ts`.
 */
export function cargoRegeAsAreas(cargo: CargoDefinicao | null): boolean {
  return !!cargo?.permissoes.ativo
}

/**
 * Esta conta paga algum cargo?
 *
 * Versão do `isPaidAccount()` que enxerga o registro: um cargo pago criado
 * pelo admin precisa vencer, ser rebaixado e entrar nas cotas do Guard como
 * qualquer outro. Cargo órfão (id que não existe mais no registro) cai no
 * teste síncrono, que responde pelos de fábrica.
 */
export async function contaEhPaga(accountType?: string | null, db?: Db): Promise<boolean> {
  const cargo = await lerCargoDaConta(accountType, db)
  if (cargo) return cargo.pago
  return isPaidAccount(accountType)
}

/**
 * Todos os ids de cargo que hoje representam uma conta paga.
 *
 * Substitui a constante fixa `PAID_ACCOUNT_TYPES` nos filtros de expiração:
 * um cargo pago criado pelo admin precisa ser varrido pelo cron como qualquer
 * outro, senão vira um cargo vitalício por omissão.
 */
export async function idsDeCargosPagos(db?: Db): Promise<string[]> {
  const registro = await lerRegistroDeCargos(db)
  const ids = registro.filter(c => c.pago).map(c => c.id)
  // Os aliases legados de `plus` não são cargos do registro, mas existem em
  // documentos antigos e precisam entrar no mesmo filtro.
  if (ids.includes('plus')) ids.push('premium', 'essential')
  return ids
}
