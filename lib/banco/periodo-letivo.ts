/**
 * O período letivo de uma prova — "2026.2", "2023.1".
 *
 * ## Por que o título e não a data
 *
 * A importação deduzia o ano da questão de `startTime`/`createdAt` da prova.
 * Isso está errado na maior parte do acervo: as provas antigas da faculdade
 * foram CADASTRADAS aqui muito depois de terem sido aplicadas — uma N1 de
 * 2023.2 digitada em 2026 entrava no banco como "2026". O filtro por ano então
 * respondia com o ano do cadastro, que não diz nada a quem está procurando a
 * prova de um semestre específico.
 *
 * Quem sabe o semestre é o título, e ele segue um padrão firme na plataforma:
 *
 *     N1 SOI I - 2026.2
 *     N1 SOI I - 2026.1
 *     N1 IESC I - 2026.1
 *     N1 SOI I - 2023.2
 *     TPI - 2023.1
 *
 * O que interessa é o `AAAA.S` no fim: o ano e o semestre. O resto do título
 * (a avaliação e o módulo) já vira subtópico na importação.
 *
 * Este arquivo é puro de propósito — a regra é testável sem banco, e a tela, a
 * importação e as rotas leem todas a MESMA definição de período letivo. Duas
 * leituras diferentes de "2026.2" seria o tipo de divergência que ninguém vê:
 * a questão entra com um valor e o filtro procura por outro.
 */

export interface PeriodoLetivo {
  ano: number
  /** 1 ou 2. Prova sem semestre no título não vira período letivo. */
  semestre: 1 | 2
}

/** Menor ano aceito. Antes disso é quase certo que o número é outra coisa. */
const ANO_MINIMO = 1990
const ANO_MAXIMO = 2100

/*
 * O separador aceita ponto, barra e hífen porque os três aparecem no acervo
 * ("2023.1", "2023/1", "2023-1"). O `(?!\d)` no fim é o que impede "2023.10"
 * — dia 10 de alguma coisa — de virar o semestre 1 de 2023.
 */
const PADRAO = /(?:^|[^\d])((?:19|20)\d{2})\s*[./\-]\s*([12])(?!\d)/g

/**
 * Lê o período letivo de um título de prova.
 *
 * Quando o título tem mais de um candidato ("Revisão 2023.1 para a N1 2023.2"),
 * vale o ÚLTIMO: o padrão da plataforma põe o período no fim, e o que aparece
 * antes costuma ser referência a outra coisa.
 */
export function lerPeriodoLetivo(titulo: string | null | undefined): PeriodoLetivo | null {
  if (!titulo) return null

  let achado: PeriodoLetivo | null = null
  for (const casamento of String(titulo).matchAll(PADRAO)) {
    const ano = Number(casamento[1])
    const semestre = Number(casamento[2]) as 1 | 2
    if (ano < ANO_MINIMO || ano > ANO_MAXIMO) continue
    achado = { ano, semestre }
  }
  return achado
}

/**
 * O ano solto do título, para quando não há semestre ("Prova de 2024").
 *
 * Separado de `lerPeriodoLetivo` porque um ano sem semestre não é um período
 * letivo — serve para o filtro por ano, não para o rótulo "2024.1".
 */
export function lerAnoDoTitulo(titulo: string | null | undefined): number | null {
  if (!titulo) return null

  let achado: number | null = null
  for (const casamento of String(titulo).matchAll(/(?:^|[^\d])((?:19|20)\d{2})(?!\d)/g)) {
    const ano = Number(casamento[1])
    if (ano < ANO_MINIMO || ano > ANO_MAXIMO) continue
    achado = ano
  }
  return achado
}

/** "2026.2" — o rótulo que a plataforma inteira mostra. */
export function formatarPeriodoLetivo(periodo: PeriodoLetivo | null | undefined): string | null {
  if (!periodo) return null
  return `${periodo.ano}.${periodo.semestre}`
}

/** O caminho de volta: "2026.2" → { ano: 2026, semestre: 2 }. */
export function interpretarPeriodoLetivo(rotulo: string | null | undefined): PeriodoLetivo | null {
  if (!rotulo) return null
  const casamento = /^((?:19|20)\d{2})\.([12])$/.exec(String(rotulo).trim())
  if (!casamento) return null
  return { ano: Number(casamento[1]), semestre: Number(casamento[2]) as 1 | 2 }
}

/**
 * Ordena rótulos do mais recente para o mais antigo.
 *
 * Ordenar "2026.2" como texto quase funciona e falha em silêncio no dia em que
 * aparecer um período de outro formato — comparar ano e semestre como números
 * é o que garante 2026.2 > 2026.1 > 2025.2 sempre.
 */
export function ordenarPeriodosLetivos(rotulos: string[]): string[] {
  return [...rotulos].sort((a, b) => {
    const pa = interpretarPeriodoLetivo(a)
    const pb = interpretarPeriodoLetivo(b)
    if (!pa || !pb) return String(b).localeCompare(String(a))
    if (pa.ano !== pb.ano) return pb.ano - pa.ano
    return pb.semestre - pa.semestre
  })
}
