import 'server-only'

import type { CapituloWebPathUtahBruto } from './catalogo.ts'
import { CAPITULOS_WEBPATH_UTAH_CARREGADORES } from './carregadores.gerado.ts'

export async function obterCapituloWebPathUtah(
  id: string,
): Promise<CapituloWebPathUtahBruto | null> {
  const carregar = CAPITULOS_WEBPATH_UTAH_CARREGADORES[id]
  if (!carregar) return null
  return (await carregar()).default as CapituloWebPathUtahBruto
}
