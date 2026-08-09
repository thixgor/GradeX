import type { EntradaBusca } from './esquemas'
import { chaveDeBusca } from './texto'

/**
 * Busca do Manual da Histologia.
 *
 * Puro e isomórfico: a mesma função ranqueia no navegador (índice compacto de
 * lâminas, resposta instantânea enquanto se digita) e no servidor (índice
 * completo, incluindo os 7.453 rótulos de estrutura). Duas implementações
 * divergiriam na ordenação e o aluno veria resultados diferentes para a mesma
 * consulta conforme a rede.
 *
 * As chaves do índice já foram normalizadas em tempo de build pelo mesmo
 * `chaveDeBusca` usado aqui — buscar "colon", "cólon" ou "COLON" encontra a
 * mesma coisa, e "H&E" encontra "h e".
 */

export type TipoDeResultado = 'lamina' | 'secao' | 'estrutura' | 'quiz'

const TIPO_POR_CODIGO: Record<EntradaBusca['t'], TipoDeResultado> = {
  l: 'lamina',
  s: 'secao',
  e: 'estrutura',
  q: 'quiz',
}

export interface Resultado {
  tipo: TipoDeResultado
  /** Caminho relativo ao módulo, sem barra inicial. */
  url: string
  titulo: string
  trilha: string
  /** Id do overlay, quando o resultado é uma estrutura. */
  overlay?: string
  /** Hash da miniatura, quando houver. */
  miniatura?: string
  /** Por que este resultado casou — exibido ao lado do item. */
  razao: string
  peso: number
}

/**
 * Peso por tipo de casamento. A ordem importa mais do que os números: título
 * que começa com o termo vem antes de título que o contém, que vem antes de
 * casamento só na trilha. Sem isso, buscar "osso" devolveria trinta lâminas que
 * mencionam osso antes da lâmina chamada "Osso".
 */
const PESO = {
  exato: 120,
  prefixo: 80,
  palavra: 55,
  contido: 30,
  todosOsTermos: 18,
}

/** Bônus por tipo: estrutura é o que o aluno mais busca; seção é contexto. */
const PESO_POR_TIPO: Record<TipoDeResultado, number> = {
  estrutura: 8,
  lamina: 6,
  quiz: 4,
  secao: 2,
}

export interface FiltrosDeBusca {
  tipos?: TipoDeResultado[]
  /** Slug do setor (primeiro segmento da URL), ex.: 'tecidos'. */
  setor?: string
}

function pontuar(chave: string, consulta: string, termos: string[]) {
  if (chave === consulta) return { peso: PESO.exato, razao: 'Correspondência exata' }
  if (chave.startsWith(`${consulta} `) || chave.startsWith(consulta)) {
    return { peso: PESO.prefixo, razao: 'Começa com o termo' }
  }
  if (chave.includes(` ${consulta} `) || chave.endsWith(` ${consulta}`)) {
    return { peso: PESO.palavra, razao: 'Palavra inteira no título' }
  }
  if (chave.includes(consulta)) return { peso: PESO.contido, razao: 'Contém o termo' }
  if (termos.length > 1 && termos.every((t) => chave.includes(t))) {
    return { peso: PESO.todosOsTermos, razao: 'Contém todos os termos' }
  }
  return null
}

/**
 * Ranqueia entradas do índice. `limite` corta a lista *depois* da ordenação —
 * cortar antes traria os primeiros do arquivo, não os melhores.
 */
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
    if (filtros.setor && !entrada.u.startsWith(`${filtros.setor}/`) && entrada.u !== filtros.setor) {
      continue
    }

    // O nome pesa mais que a chave completa: a chave inclui trilha e descrição,
    // então casar nela é sinal mais fraco de relevância.
    const noNome = pontuar(chaveDeBusca(entrada.n), consulta, termos)
    const naChave = pontuar(entrada.k, consulta, termos)
    if (!noNome && !naChave) continue

    const base = noNome ?? { peso: Math.round(naChave!.peso * 0.45), razao: 'Aparece no conteúdo' }
    achados.push({
      tipo,
      url: entrada.u,
      titulo: entrada.n,
      trilha: entrada.b,
      overlay: entrada.o,
      miniatura: entrada.m,
      razao: base.razao,
      peso: base.peso + PESO_POR_TIPO[tipo],
    })
  }

  return achados
    .sort((a, b) => b.peso - a.peso || a.titulo.localeCompare(b.titulo, 'pt-BR'))
    .slice(0, limite)
}

/**
 * Sugestões de autocompletar: títulos distintos, ordenados por relevância.
 * Deduplicamos por título porque a mesma estrutura aparece em dezenas de
 * lâminas e uma lista com "Lâmina própria" trinta vezes não ajuda ninguém.
 */
export function sugerir(
  indice: readonly EntradaBusca[],
  termo: string,
  limite = 8,
): Array<{ texto: string; tipo: TipoDeResultado }> {
  const vistos = new Set<string>()
  const saida: Array<{ texto: string; tipo: TipoDeResultado }> = []
  for (const r of buscar(indice, termo, { limite: limite * 6 })) {
    const chave = chaveDeBusca(r.titulo)
    if (vistos.has(chave)) continue
    vistos.add(chave)
    saida.push({ texto: r.titulo, tipo: r.tipo })
    if (saida.length >= limite) break
  }
  return saida
}

/**
 * Marca as ocorrências do termo para realce, devolvendo fatias em vez de HTML.
 * Montar `<mark>` aqui obrigaria a interface a usar `dangerouslySetInnerHTML`
 * sobre texto que passou por dados externos — fatias são igualmente úteis e
 * não abrem esse caminho.
 */
export function fatiarParaRealce(
  texto: string,
  termo: string,
): Array<{ texto: string; realce: boolean }> {
  const consulta = chaveDeBusca(termo)
  if (consulta.length < 2) return [{ texto, realce: false }]

  // Trabalhamos sobre a versão normalizada para achar as posições, mas
  // recortamos o texto original — o aluno precisa ver "Cólon", não "colon".
  const normalizado = chaveDeBusca(texto)
  const partes: Array<{ texto: string; realce: boolean }> = []

  // A normalização pode colapsar caracteres, então só realçamos quando o
  // comprimento se preserva. Fora disso, devolvemos o texto inteiro sem realce:
  // um destaque deslocado é pior que nenhum.
  if (normalizado.length !== texto.length) return [{ texto, realce: false }]

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
