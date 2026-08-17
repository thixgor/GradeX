import clientPromise, { getDb } from '@/lib/mongodb'
import type { Collection } from 'mongodb'

/**
 * Onde /provas guarda cada coisa.
 *
 * As provas e os grupos moram em bancos DIFERENTES do mesmo cluster: as provas
 * em `gradex` (é de lá que `/api/exams` lê) e os grupos em `DomineAqui` (é de lá
 * que `/api/groups` lê e escreve). A divisão é herdada e não dá erro nenhum
 * quando se erra o lado — a consulta simplesmente não acha nada, e o sintoma
 * chega como "Grupo não encontrado" para um grupo que está bem ali na tela.
 *
 * Por isso o acesso passa por aqui: quem escrever a próxima rota de /provas não
 * precisa saber dessa história nem lembrar de qual lado pegar cada coleção.
 */

/** Provas — banco `gradex`, o mesmo que `/api/exams` devolve. */
export async function colecaoDeProvas(): Promise<Collection> {
  const db = await getDb()
  return db.collection('exams')
}

/** Grupos e subgrupos — banco `DomineAqui`, o mesmo que `/api/groups` mantém. */
export async function colecaoDeGrupos(): Promise<Collection> {
  const client = await clientPromise
  return client.db('DomineAqui').collection('groups')
}
