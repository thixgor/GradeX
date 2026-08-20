import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { montarContextoDoUsuario } from '@/lib/aulas/contexto'
import { ordenarAnotacoes } from '@/lib/aulas/anotacoes'
import { formatarTempo } from '@/lib/aulas/progresso'
import { COLECOES } from '@/lib/ensino/compatibilidade'
import { lerNos, montarCartoes } from '@/lib/ensino/repositorio'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * "Minhas Anotações" (§11) — o caderno inteiro, atravessando as aulas.
 *
 * As anotações já existiam, mas só dentro da aula em que foram escritas. Isso
 * as tornava inúteis para a única coisa que um caderno serve: reler antes da
 * prova. Reencontrar uma frase escrita há três semanas exigia lembrar em que
 * vídeo ela foi escrita — que é exatamente o que a pessoa não lembra.
 *
 * A coleção é a MESMA (`aulas_anotacoes`); o que muda é a leitura. Nenhuma
 * anotação é migrada, nada é reescrito, e a tela da aula continua funcionando
 * como funcionava.
 *
 * Cada anotação volta com a aula resolvida e, quando tem timestamp, o endereço
 * que abre o vídeo naquele segundo — é o que transforma o caderno em índice do
 * próprio conteúdo.
 */
export async function GET(request: Request) {
  try {
    const sessao = await getSession()
    if (!sessao?.userId) return NextResponse.json({ anotacoes: [], logado: false })

    const db = await getDb()
    const p = new URL(request.url).searchParams
    const limite = Math.min(500, Math.max(1, Number(p.get('limite')) || 200))

    const filtro: Record<string, any> = { usuarioId: sessao.userId }
    if (p.get('destacadas') === '1') filtro.destacada = true
    if (p.get('aula') && ObjectId.isValid(p.get('aula') as string)) filtro.aulaId = p.get('aula')

    const anotacoes = await db
      .collection(COLECOES.anotacoes)
      .find(filtro)
      .sort({ atualizadoEm: -1 })
      .limit(limite)
      .toArray()

    if (anotacoes.length === 0) return NextResponse.json({ anotacoes: [], logado: true, total: 0 })

    const aulaIds = Array.from(
      new Set(anotacoes.map((a: any) => String(a.aulaId)).filter(ObjectId.isValid)),
    )

    const [documentos, nos] = await Promise.all([
      db
        .collection(COLECOES.aulas)
        .find({ _id: { $in: aulaIds.map((id) => new ObjectId(id)) } as any })
        .toArray(),
      lerNos(db),
    ])

    const usuario = await montarContextoDoUsuario(db, sessao as any)
    const cartoes = await montarCartoes(db, documentos as any, usuario, {
      usuarioId: sessao.userId,
      nos,
    })
    const porId = new Map(cartoes.map((c) => [c._id, c]))

    /*
     * Agrupadas por aula.
     *
     * Uma lista corrida de 200 anotações de doze aulas diferentes é ilegível: a
     * unidade de leitura de um caderno é o assunto, não a frase. Dentro de cada
     * aula, `ordenarAnotacoes` põe as com timestamp em ordem de vídeo — juntas
     * elas viram o sumário daquela aula escrito pelo próprio aluno.
     */
    const grupos = new Map<string, any>()
    for (const anotacao of anotacoes as any[]) {
      const cartao = porId.get(String(anotacao.aulaId))
      if (!cartao) continue

      const grupo = grupos.get(cartao._id) || {
        aulaId: cartao._id,
        titulo: cartao.titulo,
        localizacao: cartao.localizacao,
        href: cartao.href,
        anotacoes: [] as any[],
      }

      grupo.anotacoes.push({
        _id: String(anotacao._id),
        conteudo: anotacao.conteudo,
        segundo: anotacao.segundo ?? null,
        destacada: anotacao.destacada === true,
        criadoEm: anotacao.criadoEm,
        atualizadoEm: anotacao.atualizadoEm,
        tempoLabel: anotacao.segundo !== null && anotacao.segundo !== undefined
          ? formatarTempo(anotacao.segundo)
          : null,
        href:
          anotacao.segundo !== null && anotacao.segundo !== undefined
            ? `/aulas/${cartao._id}?t=${Math.floor(anotacao.segundo)}`
            : cartao.href,
      })

      grupos.set(cartao._id, grupo)
    }

    const lista = Array.from(grupos.values()).map((grupo) => ({
      ...grupo,
      anotacoes: ordenarAnotacoes(grupo.anotacoes),
    }))

    return NextResponse.json(
      { logado: true, grupos: lista, total: anotacoes.length },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (erro) {
    console.error('[ensino/anotacoes] GET:', erro)
    return NextResponse.json({ error: 'Erro ao carregar suas anotações' }, { status: 500 })
  }
}
