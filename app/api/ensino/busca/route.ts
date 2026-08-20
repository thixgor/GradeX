import { NextResponse } from 'next/server'

import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { montarContextoDoUsuario } from '@/lib/aulas/contexto'
import { COLECOES } from '@/lib/ensino/compatibilidade'
import { lerNos, lerTrilhas, montarCartoes } from '@/lib/ensino/repositorio'
import { buscar, TERMO_MINIMO, type Candidato } from '@/lib/ensino/busca'
import { duracaoLegivel } from '@/lib/ensino/aula'
import { resumirTrilha } from '@/lib/ensino/trilha'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Busca da Área de Ensino (§15).
 *
 * A resposta vem separada por tipo — Trilhas, Aulas, Aulas Resumo, PDFs,
 * Flashcards, Tópicos — porque são coisas com usos diferentes. Ver "IC em 6
 * minutos" no meio das aulas completas obrigaria o aluno a ler cada linha para
 * descobrir o que serve para revisar às onze da noite antes da prova.
 *
 * TUDO PASSA PELO MOTOR DE ACESSO
 *
 * Os PDFs e os flashcards que aparecem aqui saem de aulas que a pessoa PODE
 * ver. Uma busca que revela o nome do material de uma aula bloqueada não é
 * vazamento de conteúdo, mas listar o arquivo de quem não tem acesso seria — e
 * é por isso que os candidatos são montados a partir dos cartões já filtrados,
 * e não da coleção crua.
 */
export async function GET(request: Request) {
  try {
    const p = new URL(request.url).searchParams
    const termo = String(p.get('q') || '').trim()

    if (termo.length < TERMO_MINIMO) {
      return NextResponse.json({ grupos: [], total: 0, termo })
    }

    const db = await getDb()
    const sessao = await getSession()
    const usuario = await montarContextoDoUsuario(db, sessao as any)

    const [nos, trilhas, documentos] = await Promise.all([
      lerNos(db),
      lerTrilhas(db, { situacao: 'publicada' }),
      db
        .collection(COLECOES.aulas)
        .find({ oculta: { $ne: true } })
        .limit(4000)
        .toArray(),
    ])

    const cartoes = await montarCartoes(db, documentos as any, usuario, {
      usuarioId: sessao?.userId,
      nos,
    })
    const porId = new Map(documentos.map((d: any) => [String(d._id), d]))

    const candidatos: Candidato[] = []

    for (const trilha of trilhas) {
      const resumo = resumirTrilha(trilha)
      candidatos.push({
        id: String(trilha._id),
        tipo: 'trilha',
        titulo: trilha.titulo,
        detalhe: trilha.subtitulo || trilha.descricao,
        termos: trilha.tags || [],
        href: `/aulas/trilhas/${trilha.slug}`,
        extra: { aulas: resumo.aulas, etapas: resumo.etapas, nivel: trilha.nivel },
      })
    }

    for (const cartao of cartoes) {
      candidatos.push({
        id: cartao._id,
        tipo: cartao.tipo === 'resumo' ? 'resumo' : 'aula',
        titulo: cartao.titulo,
        detalhe: cartao.localizacao || cartao.descricao,
        termos: cartao.tags,
        href: cartao.href,
        extra: {
          duracao: cartao.duracaoLabel,
          liberado: cartao.acesso.liberado,
          concluida: cartao.progresso?.concluida === true,
        },
      })

      // PDFs e flashcards entram como resultados próprios: quem digita "resumo
      // de insuficiência cardíaca" está atrás do arquivo, não da aula.
      const documento: any = porId.get(cartao._id)
      if (cartao.recursos.pdf && cartao.acesso.liberado) {
        for (const pdf of documento?.pdfs || []) {
          candidatos.push({
            id: `${cartao._id}:${pdf.url}`,
            tipo: 'pdf',
            titulo: pdf.nome || `PDF — ${cartao.titulo}`,
            detalhe: cartao.titulo,
            href: `/aulas/${cartao._id}?aba=pdf`,
          })
        }
      }
      if (cartao.recursos.flashcards) {
        candidatos.push({
          id: `${cartao._id}:flashcards`,
          tipo: 'flashcards',
          titulo: `Flashcards — ${cartao.titulo}`,
          detalhe: cartao.localizacao,
          href: `/aulas/${cartao._id}?aba=flashcards`,
        })
      }
    }

    for (const no of nos) {
      if (no.oculto) continue
      candidatos.push({
        id: no._id,
        tipo: 'topico',
        titulo: no.nome,
        detalhe: no.descricao,
        href: `/aulas/explorar?no=${no._id}`,
        extra: { nivel: no.nivel },
      })
    }

    const resultado = buscar(candidatos, termo, { limitePorGrupo: 12 })

    return NextResponse.json(
      { ...resultado, termo },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (erro) {
    console.error('[ensino/busca] GET:', erro)
    return NextResponse.json({ error: 'Erro na busca' }, { status: 500 })
  }
}
