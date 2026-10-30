import { NextRequest, NextResponse } from 'next/server'
import { CURSOS_DO_DOM, cursoValido, temasDoPeriodo } from '@/lib/dom/temas'

export const runtime = 'nodejs'

/**
 * `GET /api/dom/temas?curso=medicina&periodo=2` — os temas do Método Socrático
 * de um período (a mesma grade dos cronogramas). Igual para todo mundo e só
 * muda com deploy: a borda guarda por um dia e a função quase nunca roda.
 * Sem parâmetros, devolve só a lista de cursos.
 */
export function GET(request: NextRequest) {
  const curso = request.nextUrl.searchParams.get('curso')
  const periodo = Number(request.nextUrl.searchParams.get('periodo'))
  const cache = { 'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800' }
  if (!curso) return NextResponse.json({ cursos: CURSOS_DO_DOM }, { headers: cache })
  if (!cursoValido(curso)) return NextResponse.json({ error: 'Curso inválido' }, { status: 400 })
  return NextResponse.json({ temas: temasDoPeriodo(curso, periodo) }, { headers: cache })
}
