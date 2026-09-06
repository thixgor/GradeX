import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { prepararTermoDeBusca, TEMPO_MAXIMO_DE_BUSCA_MS } from '@/lib/utils/escape-regex'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()

    /*
     * `?ids=a,b,c` — os mesmos usuários, pedidos por id.
     *
     * Quem guarda uma lista de pessoas guarda ids (é o que o servidor compara),
     * mas a tela precisa mostrar nomes: sem este caminho, reabrir a prova com
     * convidados exibiria `68f3a1...` no lugar de quem foi convidado. É a
     * mesma projeção e a mesma checagem de admin da busca por texto — só muda
     * o filtro.
     */
    const idsBrutos = (searchParams.get('ids') || '')
      .split(',')
      .map((i) => i.trim())
      .filter((i) => ObjectId.isValid(i))
      .slice(0, 100)

    if (idsBrutos.length > 0) {
      const db = await getDb()
      const encontrados = await db
        .collection('users')
        .find({ _id: { $in: idsBrutos.map((i) => new ObjectId(i)) } })
        .project({ _id: 1, name: 1, email: 1, accountType: 1 })
        .limit(100)
        .maxTimeMS(TEMPO_MAXIMO_DE_BUSCA_MS)
        .toArray()

      return NextResponse.json({
        users: encontrados.map((u: any) => ({
          id: u._id.toString(),
          name: u.name || '',
          email: u.email || '',
          accountType: u.accountType || '',
        })),
      })
    }

    if (q.length < 2) {
      return NextResponse.json({ users: [] })
    }

    // O termo vira texto literal antes de encostar no Mongo: sem isto, um
    // `(a+)+$` digitado na busca de usuários custa tempo exponencial POR
    // documento e segura a conexão do Atlas até estourar.
    const termo = prepararTermoDeBusca(q)
    if (!termo) {
      return NextResponse.json({ users: [] })
    }

    const db = await getDb()

    const users = await db
      .collection('users')
      .find({
        $or: [
          { name:  { $regex: termo, $options: 'i' } },
          { email: { $regex: termo, $options: 'i' } },
        ],
      })
      .project({ _id: 1, name: 1, email: 1, accountType: 1 })
      .sort({ name: 1 })
      .limit(20)
      .maxTimeMS(TEMPO_MAXIMO_DE_BUSCA_MS)
      .toArray()

    return NextResponse.json({
      users: users.map((u: any) => ({
        id:          u._id.toString(),
        name:        u.name  || '',
        email:       u.email || '',
        accountType: u.accountType || '',
      })),
    })
  } catch (error) {
    console.error('Error searching users:', error)
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 })
  }
}
