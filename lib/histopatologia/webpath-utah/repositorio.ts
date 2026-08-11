import 'server-only'

import type { EntradaBusca } from '../esquemas.ts'
import { chaveDeBusca } from '../texto.ts'
import type { CapituloWebPathUtahBruto } from './catalogo.ts'
import { CAPITULOS_WEBPATH_UTAH } from './catalogo.ts'
import { CAPITULOS_WEBPATH_UTAH_CARREGADORES } from './carregadores.gerado.ts'
import { traduzirTituloWebPathUtah } from './traducao.ts'

export async function obterCapituloWebPathUtah(
  id: string,
): Promise<CapituloWebPathUtahBruto | null> {
  const carregar = CAPITULOS_WEBPATH_UTAH_CARREGADORES[id]
  if (!carregar) return null
  return (await carregar()).default as CapituloWebPathUtahBruto
}

let indiceDeBuscaEmCache: Promise<EntradaBusca[]> | undefined

/** Acrescenta o WebPath ao mesmo índice de busca usado pelos demais atlas. */
export function indiceDeBuscaWebPathUtah(): Promise<EntradaBusca[]> {
  if (indiceDeBuscaEmCache) return indiceDeBuscaEmCache

  indiceDeBuscaEmCache = Promise.all(
    CAPITULOS_WEBPATH_UTAH.map(async (resumo) => {
      const capitulo = await obterCapituloWebPathUtah(resumo.id)
      if (!capitulo) return []
      return capitulo.entradas.map((entrada): EntradaBusca => {
        const titulo = traduzirTituloWebPathUtah(entrada.tituloOriginal)
        const referencia = new URL(entrada.url).pathname.split('/').pop() ?? ''
        return {
          t: 'c',
          u:
            `atlas/webpath-utah/${resumo.id}?q=${encodeURIComponent(titulo)}` +
            `&ref=${encodeURIComponent(referencia)}`,
          n: titulo,
          b: `${resumo.nome} · WebPath/Utah`,
          k: chaveDeBusca(
            `${titulo} ${entrada.tituloOriginal} ${entrada.secaoOriginal} ${resumo.nome} ${resumo.nomeOriginal}`,
          ),
        }
      })
    }),
  ).then((capitulos) => capitulos.flat())

  return indiceDeBuscaEmCache
}
