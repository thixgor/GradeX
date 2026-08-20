import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { isValidObjectId } from '@/lib/api-security'
import { avaliarAcessoAula } from '@/lib/aulas/acesso'
import { montarContextoDoUsuario } from '@/lib/aulas/contexto'
import { aplicarVinculo, resolverVinculosEmLote } from '@/lib/aulas/resolver-vinculo'
import { formatarTempo } from '@/lib/aulas/progresso'
import { lerTrilhas } from '@/lib/ensino/repositorio'
import { resumirTrilha } from '@/lib/ensino/trilha'
import type { AulaPostagem } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * As aulas e Trilhas que a compra de um material libera (§2, §25).
 *
 * Serve à página do material: "este material inclui 12 vídeo-aulas", com a
 * lista e o link direto para cada uma. É argumento de venda para quem não
 * comprou e atalho de acesso para quem já comprou — a mesma rota, porque a
 * diferença entre os dois casos é só o veredito de acesso.
 *
 * Pública de propósito (a página do material abre sem login), e por isso
 * devolve apenas título, capa, duração e situação — nunca o embed. O conteúdo
 * continua saindo só por /api/aulas/<id>, com o mesmo motor de acesso.
 *
 * As TRILHAS entram pela mesma porta (§25). Um produto pode entregar um caminho
 * inteiro, e não só vídeos avulsos: basta a Trilha ter, nas regras de acesso, a
 * condição "comprou este material". O aluno nunca precisa entender essa
 * arquitetura comercial — para ele a Trilha simplesmente aparece liberada.
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!isValidObjectId(params.id)) {
      return NextResponse.json({ aulas: [] })
    }

    const db = await getDb()

    const aulas = await db.collection<AulaPostagem>('aulas_postagens')
      .find({
        'vinculoMaterial.materialId': params.id,
        'vinculoMaterial.liberaPorCompra': true,
      } as any)
      .sort({ ordem: 1, criadoEm: 1 })
      .limit(200)
      .toArray()

    const session = await getSession()
    const [usuario, vinculos, trilhasPublicadas] = await Promise.all([
      montarContextoDoUsuario(db, session),
      resolverVinculosEmLote(db, aulas as any),
      lerTrilhas(db, { situacao: 'publicada' }),
    ])

    const agora = new Date()
    const itens = aulas
      .map((aula) => {
        const resolvida = aplicarVinculo(aula as any, vinculos)
        const veredito = avaliarAcessoAula(resolvida, usuario, agora)
        // Rascunho não é argumento de venda: some da vitrine do material.
        if (veredito.invisivel) return null

        const duracao = (resolvida as any).duracaoSegundos || null
        return {
          _id: String(aula._id),
          titulo: aula.titulo,
          descricao: aula.descricao || '',
          capa: aula.capa || null,
          duracaoLabel: duracao ? formatarTempo(duracao) : null,
          liberada: veredito.liberado,
          href: `/aulas/${String(aula._id)}`,
        }
      })
      .filter(Boolean)

    /*
     * As Trilhas entregues por este material.
     *
     * A pergunta é feita às REGRAS da Trilha, e não a um campo `materialId`
     * dedicado: assim uma Trilha liberada por três produtos diferentes continua
     * sendo uma Trilha só, e quem edita a permissão edita num lugar único.
     */
    const trilhas = trilhasPublicadas
      .filter((trilha) =>
        (trilha.regrasAcesso?.liberarPara || []).some(
          (condicao: any) =>
            (condicao.tipo === 'material' || condicao.tipo === 'pacote') &&
            String(condicao.itemId) === params.id,
        ),
      )
      .map((trilha) => {
        const veredito = avaliarAcessoAula(
          {
            visibilidade: 'gratuita',
            regrasAcesso: trilha.regrasAcesso || null,
            oculta: false,
            dataLiberacao: new Date('2000-01-01'),
          } as any,
          usuario,
          agora,
        )
        const resumo = resumirTrilha(trilha)
        return {
          _id: String(trilha._id),
          slug: trilha.slug,
          titulo: trilha.titulo,
          subtitulo: trilha.subtitulo || '',
          capa: trilha.capa || null,
          aulas: resumo.aulas,
          etapas: resumo.etapas,
          liberada: veredito.liberado,
          href: `/aulas/trilhas/${trilha.slug}`,
        }
      })

    return NextResponse.json(
      { aulas: itens, total: itens.length, trilhas, totalDeTrilhas: trilhas.length },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('[materiais/aulas] erro:', error)
    // A página do material não cai por causa da lista de aulas incluídas.
    return NextResponse.json({ aulas: [], total: 0, trilhas: [], totalDeTrilhas: 0 })
  }
}
