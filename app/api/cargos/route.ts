import { NextResponse } from 'next/server'
import { lerCargosPublicos } from '@/lib/cargos-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * O registro de cargos no recorte que o navegador pode ver.
 *
 * Serve às telas que mostram o cargo de alguém — o selo do perfil, a lista de
 * usuários, o seletor de plano — e que antes carregavam a mesma lista de cargos
 * escrita à mão em cada arquivo. Cada cópia dessas era um lugar a mais para
 * esquecer um cargo novo: a tela de materiais, por exemplo, oferecia
 * "Gratuito / Trial / Plus+ / Monitor" e ficou sem o Quest por meses.
 *
 * Sem autenticação de propósito. O conteúdo é o catálogo comercial — nome, cor
 * e quais áreas cada cargo abre —, a mesma informação que a página de planos
 * publica para quem ainda nem tem conta. `cargoPublico()` é o recorte: o bloco
 * de permissões cru, com tetos e janelas, fica só no `/api/admin/cargos`.
 */
export async function GET() {
  try {
    const cargos = await lerCargosPublicos()
    return NextResponse.json(
      { cargos },
      // O registro muda quando o admin mexe nele, o que é raro; 30s na borda
      // é a mesma janela da memória do servidor e some com a maior parte das
      // idas ao banco sem atrasar o que ele acabou de salvar.
      { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=30, stale-while-revalidate=60' } },
    )
  } catch (erro) {
    console.error('[cargos] falha ao listar:', erro)
    // Lista vazia deixaria as telas sem rótulo nenhum; o erro é mais honesto e
    // o hook do cliente cai nos embutidos.
    return NextResponse.json({ error: 'Erro ao carregar os cargos' }, { status: 500 })
  }
}
