import 'server-only'

import type { NoCurriculo, Pagina, Quiz, Relatorio } from './esquemas'

import { FRAGMENTOS, QUIZZES } from './carregadores.gerado'

import curriculoBruto from '@/data/histologia/curriculo.json'
import relatorioBruto from '@/data/histologia/relatorio.json'
import listaDeQuizzes from '@/data/histologia/quizzes.json'

/**
 * Acesso aos dados do Manual da Histologia — **somente no servidor**.
 *
 * ## Por que um mapa literal de `import()`
 *
 * São 1.320 lâminas. Três abordagens foram descartadas:
 *
 * - um arquivo único: obrigaria a carregar 8,7 MB para renderizar uma página;
 * - um arquivo por lâmina: 1.320 módulos endereçados por caminho dinâmico, que
 *   o rastreamento de arquivos da Vercel não consegue seguir — funcionaria em
 *   desenvolvimento e daria 404 em produção;
 * - `fs.readFile` sobre `data/`: mesma armadilha, agravada por depender do
 *   diretório de trabalho da função serverless.
 *
 * O mapa em `carregadores.gerado.ts` é literal e enumerável: o bundler enxerga
 * cada `import()`, empacota os 22 fragmentos como chunks separados e carrega
 * exatamente um por requisição. Ele é *gerado* pelo pipeline justamente porque
 * precisa ser literal — mantido à mão, dessincronizaria no primeiro fragmento
 * novo e o erro só apareceria em produção.
 *
 * Os `as` sobre o resultado do `import()` são deliberados: o TypeScript infere
 * dos JSON tipos literais (`tipo: string`, não `'lamina' | 'secao'`), e nenhuma
 * anotação faz um arquivo de dados provar sua própria forma. Quem prova é
 * `__tests__/histologia/dados.test.ts`, que roda os 22 fragmentos e os 19
 * quizzes contra os schemas Zod.
 */
export const CURRICULO = curriculoBruto as unknown as NoCurriculo[]
export const RELATORIO = relatorioBruto as Relatorio
export const RESUMO_DE_QUIZZES = listaDeQuizzes as Array<{
  slug: string
  titulo: string
  tituloOriginal: string
  questoes: number
  comImagem: number
}>

/** Chave do fragmento que contém uma rota. Espelha a regra do pipeline. */
function chaveDoFragmento(caminho: string[]): string {
  return caminho.length >= 2 ? caminho.slice(0, 2).join('__') : '_setores'
}

/**
 * Carrega uma página pelo caminho de slugs. Devolve `null` para rota
 * inexistente — quem chama transforma isso em 404, sem inventar página vazia.
 */
export async function obterPagina(caminho: string[]): Promise<Pagina | null> {
  const carregar = FRAGMENTOS[chaveDoFragmento(caminho)]
  if (!carregar) return null
  const fragmento = (await carregar()).default as Record<string, Pagina>
  return fragmento[caminho.join('/')] ?? null
}

/** Todas as páginas de um subsetor, na ordem do catálogo. */
export async function obterFragmento(caminho: string[]): Promise<Pagina[]> {
  const carregar = FRAGMENTOS[chaveDoFragmento(caminho)]
  if (!carregar) return []
  const fragmento = (await carregar()).default as Record<string, Pagina>
  return Object.values(fragmento)
}

export async function obterQuiz(slug: string): Promise<Quiz | null> {
  const carregar = QUIZZES[slug]
  if (!carregar) return null
  return (await carregar()).default as Quiz
}

export function listarSlugsDeQuiz(): string[] {
  return Object.keys(QUIZZES)
}

/* ─────────────────────── navegação no currículo ─────────────────────── */

/** Localiza um nó do currículo pelo caminho de slugs. */
export function obterNo(caminho: string[]): NoCurriculo | null {
  let nivel = CURRICULO
  let atual: NoCurriculo | null = null
  for (const slug of caminho) {
    const achado: NoCurriculo | undefined = nivel.find((n) => n.slug === slug)
    if (!achado) return null
    atual = achado
    nivel = achado.filhos
  }
  return atual
}

/** Achata a árvore em lista, em profundidade — a ordem de leitura do currículo. */
export function achatarCurriculo(nos: NoCurriculo[] = CURRICULO): NoCurriculo[] {
  const saida: NoCurriculo[] = []
  const visitar = (lista: NoCurriculo[]) => {
    for (const n of lista) {
      saida.push(n)
      visitar(n.filhos)
    }
  }
  visitar(nos)
  return saida
}

/**
 * Lâmina anterior e próxima na ordem de leitura global. É o que permite ao
 * aluno percorrer um subsetor inteiro sem voltar ao índice.
 */
export function vizinhas(caminho: string[]): { anterior?: NoCurriculo; proxima?: NoCurriculo } {
  const laminas = achatarCurriculo().filter((n) => n.tipo === 'lamina')
  const alvo = caminho.join('/')
  const i = laminas.findIndex((n) => n.caminho.join('/') === alvo)
  if (i < 0) return {}
  return {
    anterior: i > 0 ? laminas[i - 1] : undefined,
    proxima: i < laminas.length - 1 ? laminas[i + 1] : undefined,
  }
}

export const TOTAIS = {
  laminas: CURRICULO.reduce((n, s) => n + s.laminas, 0),
  estruturas: CURRICULO.reduce((n, s) => n + s.estruturas, 0),
  setores: CURRICULO.length,
  subsetores: CURRICULO.reduce((n, s) => n + s.filhos.length, 0),
  quizzes: RESUMO_DE_QUIZZES.length,
  questoes: RESUMO_DE_QUIZZES.reduce((n, q) => n + q.questoes, 0),
}
