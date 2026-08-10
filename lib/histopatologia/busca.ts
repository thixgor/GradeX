import type { EntradaBusca, EstadoDeRevisao } from './esquemas'
import { chaveDeBusca, radical } from './texto'

/**
 * Busca da Histopatologia.
 *
 * Pura e isomórfica: a mesma função ranqueia no navegador (índice compacto de
 * doenças, sistemas e mecanismos — 7 KB) e no servidor (índice completo, com as
 * 2.917 entradas catalogadas). Duas implementações divergiriam na ordenação, e o
 * aluno veria resultados diferentes para a mesma consulta conforme a rede.
 *
 * ## O que este ranqueador tem a mais que o da Histologia normal
 *
 * Tolerância a plural. As chaves do índice já foram geradas com `chaveDeIndice`,
 * que acrescenta o radical de cada termo; aqui a consulta também é reduzida a
 * radical quando o casamento direto falha. Buscar "granulomas" encontra
 * "granuloma", e "necroses" encontra "necrose" — sem stemmer agressivo, que em
 * patologia colapsaria entidades distintas.
 *
 * ## O que ele deliberadamente não faz
 *
 * Não traduz. Sinônimos em inglês são encontrados porque foram **cadastrados** na
 * camada editorial, não porque a busca adivinhou. Tradução automática de títulos
 * durante a consulta é proibida pelo plano, e com razão: "case" e "caso" não são
 * a mesma coisa num acervo em que metade dos títulos é prosa capturada de página.
 */

export type TipoDeResultado = 'doenca' | 'entrada' | 'sistema' | 'mecanismo'

const TIPO_POR_CODIGO: Record<EntradaBusca['t'], TipoDeResultado> = {
  d: 'doenca',
  c: 'entrada',
  s: 'sistema',
  m: 'mecanismo',
}

export const ROTULO_DE_TIPO: Record<TipoDeResultado, string> = {
  doenca: 'Doença',
  entrada: 'Entrada catalogada',
  sistema: 'Sistema',
  mecanismo: 'Mecanismo',
}

export interface Resultado {
  tipo: TipoDeResultado
  /** Caminho relativo ao módulo, sem barra inicial. */
  url: string
  titulo: string
  trilha: string
  estadoDeRevisao?: EstadoDeRevisao
  /** Por que este resultado casou — exibido ao lado do item. */
  razao: string
  peso: number
}

/**
 * Peso por tipo de casamento. A ordem importa mais do que os números: doença
 * cujo nome começa com o termo vem antes de entrada catalogada que o menciona no
 * meio de um parágrafo. Sem isso, buscar "necrose" devolveria trinta títulos de
 * página da Unicamp antes do mecanismo geral chamado "Necrose coagulativa".
 */
const PESO = {
  exato: 120,
  prefixo: 80,
  palavra: 55,
  contido: 30,
  todosOsTermos: 18,
  radical: 14,
}

/**
 * Bônus por tipo.
 *
 * Doença e mecanismo carregam conteúdo revisável; entrada catalogada é
 * inventário bruto. Colocar o inventário à frente do capítulo faria a busca
 * parecer um índice de arquivos — que é exatamente o que o módulo não é.
 */
const PESO_POR_TIPO: Record<TipoDeResultado, number> = {
  doenca: 14,
  mecanismo: 10,
  sistema: 6,
  entrada: 2,
}

export interface FiltrosDeBusca {
  tipos?: TipoDeResultado[]
  /** Apenas doenças com este estado de revisão. */
  estados?: EstadoDeRevisao[]
}

function pontuar(chave: string, consulta: string, termos: string[]) {
  if (chave === consulta) return { peso: PESO.exato, razao: 'Correspondência exata' }
  if (chave.startsWith(consulta)) return { peso: PESO.prefixo, razao: 'Começa com o termo' }
  if (chave.includes(` ${consulta} `) || chave.endsWith(` ${consulta}`)) {
    return { peso: PESO.palavra, razao: 'Palavra inteira no título' }
  }
  if (chave.includes(consulta)) return { peso: PESO.contido, razao: 'Contém o termo' }
  if (termos.length > 1 && termos.every((t) => chave.includes(t))) {
    return { peso: PESO.todosOsTermos, razao: 'Contém todos os termos' }
  }
  // Último recurso: plural/singular. Fica por último para não roubar a frente de
  // um casamento literal, que é sempre mais informativo.
  const radicais = termos.map(radical).filter((r) => r.length >= 4)
  if (radicais.length > 0 && radicais.every((r) => chave.includes(r))) {
    return { peso: PESO.radical, razao: 'Variação de plural ou flexão' }
  }
  return null
}

export function buscar(
  indice: readonly EntradaBusca[],
  termo: string,
  { limite = 30, filtros = {} }: { limite?: number; filtros?: FiltrosDeBusca } = {},
): Resultado[] {
  const consulta = chaveDeBusca(termo)
  if (consulta.length < 2) return []
  const termos = consulta.split(' ').filter(Boolean)

  const achados: Resultado[] = []
  for (const entrada of indice) {
    const tipo = TIPO_POR_CODIGO[entrada.t]
    if (filtros.tipos && filtros.tipos.length > 0 && !filtros.tipos.includes(tipo)) continue
    if (filtros.estados && filtros.estados.length > 0) {
      if (!entrada.r || !filtros.estados.includes(entrada.r)) continue
    }

    // O nome pesa mais que a chave completa: a chave inclui sinônimos, órgãos e
    // descrição, então casar nela é sinal mais fraco de relevância.
    const noNome = pontuar(chaveDeBusca(entrada.n), consulta, termos)
    const naChave = pontuar(entrada.k, consulta, termos)
    if (!noNome && !naChave) continue

    const base = noNome ?? { peso: Math.round(naChave!.peso * 0.45), razao: 'Aparece no conteúdo' }
    achados.push({
      tipo,
      url: entrada.u,
      titulo: entrada.n,
      trilha: entrada.b,
      estadoDeRevisao: entrada.r,
      razao: base.razao,
      peso: base.peso + PESO_POR_TIPO[tipo],
    })
  }

  return achados
    .sort((a, b) => b.peso - a.peso || a.titulo.localeCompare(b.titulo, 'pt-BR'))
    .slice(0, limite)
}

/**
 * Marca as ocorrências do termo para realce, devolvendo fatias em vez de HTML.
 * Montar `<mark>` aqui obrigaria a interface a usar `dangerouslySetInnerHTML`
 * sobre texto que veio de um catálogo externo — fatias são igualmente úteis e
 * não abrem esse caminho.
 */
export function fatiarParaRealce(
  texto: string,
  termo: string,
): Array<{ texto: string; realce: boolean }> {
  const consulta = chaveDeBusca(termo)
  if (consulta.length < 2) return [{ texto, realce: false }]

  const normalizado = chaveDeBusca(texto)
  // A normalização pode colapsar caracteres; só realçamos quando o comprimento
  // se preserva. Um destaque deslocado é pior que nenhum.
  if (normalizado.length !== texto.length) return [{ texto, realce: false }]

  const partes: Array<{ texto: string; realce: boolean }> = []
  let cursor = 0
  let pos = normalizado.indexOf(consulta)
  while (pos >= 0) {
    if (pos > cursor) partes.push({ texto: texto.slice(cursor, pos), realce: false })
    partes.push({ texto: texto.slice(pos, pos + consulta.length), realce: true })
    cursor = pos + consulta.length
    pos = normalizado.indexOf(consulta, cursor)
  }
  if (cursor < texto.length) partes.push({ texto: texto.slice(cursor), realce: false })
  return partes.length > 0 ? partes : [{ texto, realce: false }]
}
