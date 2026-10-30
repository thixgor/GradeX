import { NextRequest, NextResponse } from 'next/server'
import { cursoValido } from '@/lib/dom/temas'
import { cursosDoDom, temasDoPeriodo } from '@/lib/dom/temas-servidor'

export const runtime = 'nodejs'

/**
 * `GET /api/dom/temas?curso=medicina&periodo=2` — os temas do Método Socrático
 * de um período, tirados da ementa que o admin importa em /admin/cronogramas
 * (a mesma de /cronogramas). Sem parâmetros, devolve os cursos e os períodos
 * que têm ementa.
 *
 * Igual para todo mundo: a borda guarda por 5 min (a importação nova aparece
 * em até 5 min) e a função quase nunca roda.
 */
export async function GET(request: NextRequest) {
  const curso = request.nextUrl.searchParams.get('curso')
  const periodo = Number(request.nextUrl.searchParams.get('periodo'))
  const cache = { 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600' }
  try {
    if (!curso) return NextResponse.json({ cursos: await cursosDoDom() }, { headers: cache })
    if (!cursoValido(curso)) return NextResponse.json({ error: 'Curso inválido' }, { status: 400 })
    return NextResponse.json({ temas: await temasDoPeriodo(curso, periodo) }, { headers: cache })
  } catch (erro) {
    console.error('[dom/temas] erro:', erro)
    return NextResponse.json({ error: 'Temas indisponíveis' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
