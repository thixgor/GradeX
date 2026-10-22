import 'server-only'

import { obterDoenca, obterEntradaCatalogada, obterMecanismoPublicado, obterSistemaComContagem } from './repositorio'
import { resumoDoCapituloWebPathUtah } from './webpath-utah/catalogo'

/**
 * As páginas existem? É o que os cascos estáticos da Histopatologia perguntam no
 * servidor, para responder 404 a endereço inexistente como antes.
 *
 * Num módulo à parte, e não junto de `paginas.ts`, por peso: `paginas.ts` lê o
 * inventário do acervo (`acervo.ts`), e o rastreio do Turbopack leva para toda
 * função que o importa os 5,7 MB de fragmentos `.json.gz` do catálogo. Os
 * cascos só precisam saber se o endereço existe.
 */

export async function entradaDoAtlasExiste(id: string): Promise<boolean> {
  return Boolean(await obterEntradaCatalogada(id))
}

export function capituloWebPathExiste(id: string): boolean {
  return Boolean(resumoDoCapituloWebPathUtah(id))
}

export function mecanismoExiste(id: string): boolean {
  return Boolean(obterMecanismoPublicado(id))
}

export function sistemaDaPatologiaExiste(id: string): boolean {
  return Boolean(obterSistemaComContagem(id))
}

/** O par existe (doença conhecida e caminho normal declarado por ela)? Par não afirmado pela edição é 404. */
export async function comparacaoComNormalExiste(slugs: string[]): Promise<boolean> {
  const [slugDaDoenca, ...caminhoNormal] = slugs
  if (!slugDaDoenca || caminhoNormal.length === 0) return false
  const fragmento = await obterDoenca(slugDaDoenca)
  const chave = caminhoNormal.join('/')
  return Boolean(fragmento?.doenca.conteudo.histologiaNormalDeReferencia.some((r) => r.caminhoNormal.join('/') === chave))
}
