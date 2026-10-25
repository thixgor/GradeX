import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { montarArvoreDoBanco } from '@/lib/banco/arvore'
import { memoizarPorTempo } from '@/lib/cache-de-servidor'
import { algoBarrado } from '@/lib/banco/visibilidade'
import { nosBarradosDoUsuario } from '@/lib/banco/visibilidade-servidor'
import { jsonComprimido } from '@/lib/resposta-comprimida'

export const dynamic = 'force-dynamic'

/** A árvore é a mesma para todo mundo e muda quando um admin cadastra um nó. */
const TTL_DA_ARVORE_MS = 60_000

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // A árvore completa não depende de quem pede, então a mesma instância
    // serve a árvore já montada para o próximo aluno que abrir a tela. O que
    // muda por pessoa é o recorte (nós ocultos/restritos, abaixo) e o conteúdo
    // da questão, decidido em /api/banco/questoes.
    const db = await getDb()
    const [completa, barrados] = await Promise.all([
      memoizarPorTempo('banco:hierarquia', TTL_DA_ARVORE_MS, montarArvoreDoBanco),
      nosBarradosDoUsuario(db, session),
    ])

    /*
     * Módulo/tópico oculto ou restrito a outro cargo some da árvore desta
     * pessoa, com os subtópicos dele (ver lib/banco/visibilidade.ts). O admin
     * recebe tudo, com as marcações, e a tela dele desenha os selos.
     */
    const arvore = algoBarrado(barrados)
      ? (() => {
          const topicos = completa.topicos.filter(
            (t) => !barrados.modulos.has(t.moduloId) && !barrados.topicos.has(t._id),
          )
          const topicosVisiveis = new Set(topicos.map((t) => t._id))
          return {
            modulos: completa.modulos.filter((m) => !barrados.modulos.has(m._id)),
            topicos,
            subtopicos: completa.subtopicos.filter((s) => topicosVisiveis.has(s.topicoId)),
          }
        })()
      : completa

    return jsonComprimido(request, arvore, {
      headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' },
    })
  } catch (error) {
    console.error('Erro ao montar hierarquia do banco:', error)
    return NextResponse.json({ error: 'Erro ao carregar a hierarquia' }, { status: 500 })
  }
}
