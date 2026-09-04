import type { Db } from 'mongodb'
import { ObjectId } from 'mongodb'
import { periodoDoUsuario } from './publico-da-prova'

/**
 * O período de quem está pedindo — a leitura que as rotas de prova repetem.
 *
 * São dois campos (`periodoBase` e a âncora), e a rota só quer o número. Ter
 * isto em um lugar evita que cada rota escreva a própria projeção, e concentra
 * a guarda do `ObjectId`: `new ObjectId(...)` **lança** quando a string não é um
 * id válido, e uma sessão com id fora do formato derrubaria a listagem de
 * provas inteira com um 500 em vez de simplesmente não achar período.
 */
export async function lerPeriodoDoAluno(db: Db, userId: string): Promise<number | null> {
  if (!userId || !ObjectId.isValid(userId)) return null

  const usuario = await db
    .collection('users')
    .findOne({ _id: new ObjectId(userId) }, { projection: { periodoBase: 1, periodoBaseRef: 1 } })

  return periodoDoUsuario(usuario as any)
}
