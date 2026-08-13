import { flattenCollections, type AtlasMarker, type AtlasSystem } from './estrutura'

/**
 * Recorte e sorteio do quiz — a metade leve.
 *
 * Está separada de `quiz.ts` porque a tela de configuração precisa contar
 * estruturas e listar regiões, e só isso. Montar a questão é que exige o
 * dicionário de estruturas, os contextos regionais e o classificador: 111 KB
 * comprimidos que não fazem falta enquanto o aluno ainda está escolhendo de
 * onde virão as perguntas.
 *
 * A geração é determinística a partir de uma semente para a mesma rodada poder
 * ser refeita e conferida; o embaralhamento não é "aleatório de verdade", é
 * reprodutível de propósito.
 */

/* ══════════════════════════ Sorteio reprodutível ══════════════════════════ */

/** Gerador congruencial simples (mulberry32): rápido e suficiente para sorteio. */
export function gerador(semente: number) {
  let estado = semente >>> 0
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function embaralhar<T>(itens: T[], sortear: () => number): T[] {
  const copia = [...itens]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(sortear() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

export const normalizar = (valor: string) =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

/* ══════════════════════════ Universo de perguntas ══════════════════════════ */

export interface Ocorrencia {
  sistemaSlug: string
  sistemaTitulo: string
  colecaoSlug: string
  colecaoTitulo: string
  caminho: string[]
  /** Primeiro nível do caminho — a "região" usada no recorte do quiz. */
  regiao: string
  pecaId: string
  pecaTitulo: string
  imagem: string
  marcador: AtlasMarker
}

/** Todos os marcadores dos sistemas carregados, achatados em uma lista. */
export function ocorrenciasDoAcervo(sistemas: AtlasSystem[]): Ocorrencia[] {
  const encontradas: Ocorrencia[] = []
  for (const sistema of sistemas) {
    for (const colecao of flattenCollections(sistema.collections)) {
      for (const peca of colecao.pieces || []) {
        for (const marcador of peca.markers) {
          encontradas.push({
            sistemaSlug: sistema.slug,
            sistemaTitulo: sistema.title,
            colecaoSlug: colecao.slug,
            colecaoTitulo: colecao.title,
            caminho: colecao.breadcrumb,
            regiao: colecao.breadcrumb.length > 1 ? colecao.breadcrumb[0] : colecao.title,
            pecaId: peca.id,
            pecaTitulo: peca.title,
            imagem: peca.image,
            marcador,
          })
        }
      }
    }
  }
  return encontradas
}

/**
 * De onde as questões podem sair.
 *
 * Os dois campos são listas porque um recorte útil raramente é um só: quem vai
 * revisar membro superior quer o esquelético e o muscular juntos, e quem estuda
 * cabeça e pescoço quer crânio, face e coluna cervical na mesma rodada.
 *
 * Cada região vem prefixada pelo sistema (`esqueletico:Membro Superior`) porque
 * o nome sozinho é ambíguo — "Tronco" existe em mais de um sistema, e sem o
 * prefixo marcar o tronco do esquelético traria o do muscular junto.
 */
export interface RecorteQuiz {
  /** Vazio = acervo inteiro. */
  sistemas?: string[] | null
  /** Vazio = os sistemas inteiros. Chaves no formato `sistema:regiao`. */
  regioes?: string[] | null
}

export const chaveDeRegiao = (sistemaSlug: string, regiao: string) => `${sistemaSlug}:${regiao}`

/** Marca usada por chaves antigas, sem sistema na frente: valem para todos. */
const QUALQUER_SISTEMA = '*'

function regioesPorSistema(chaves: string[]): Map<string, Set<string>> {
  const mapa = new Map<string, Set<string>>()
  for (const chave of chaves) {
    const corte = chave.indexOf(':')
    // Links antigos traziam `?regiao=Membro Superior`, sem o sistema. Continuam
    // valendo — só que aplicados a qualquer sistema do recorte.
    const sistema = corte < 0 ? QUALQUER_SISTEMA : chave.slice(0, corte)
    const regiao = corte < 0 ? chave : chave.slice(corte + 1)
    if (!mapa.has(sistema)) mapa.set(sistema, new Set())
    mapa.get(sistema)!.add(regiao)
  }
  return mapa
}

export function aplicarRecorte(ocorrencias: Ocorrencia[], recorte: RecorteQuiz): Ocorrencia[] {
  const sistemas = new Set(recorte.sistemas || [])
  const porSistema = regioesPorSistema(recorte.regioes || [])
  const soltas = porSistema.get(QUALQUER_SISTEMA)

  return ocorrencias.filter(ocorrencia => {
    if (sistemas.size > 0 && !sistemas.has(ocorrencia.sistemaSlug)) return false

    // Recortar por região em um sistema não pode encolher os outros: quem
    // marcou "Membro Superior" no esquelético e o muscular inteiro espera as
    // duas coisas. Por isso o filtro de região vale por sistema.
    const doSistema = porSistema.get(ocorrencia.sistemaSlug)
    if (doSistema) return doSistema.has(ocorrencia.regiao)
    if (soltas && porSistema.size === 1) return soltas.has(ocorrencia.regiao)
    return true
  })
}

/** Regiões disponíveis para recortar o quiz dentro de um sistema. */
export function regioesDoSistema(
  ocorrencias: Ocorrencia[],
  sistemaSlug: string,
): Array<{ nome: string; estruturas: number }> {
  const contagem = new Map<string, number>()
  for (const ocorrencia of ocorrencias) {
    if (ocorrencia.sistemaSlug !== sistemaSlug) continue
    contagem.set(ocorrencia.regiao, (contagem.get(ocorrencia.regiao) || 0) + 1)
  }
  return [...contagem.entries()].map(([nome, estruturas]) => ({ nome, estruturas }))
}

export function contarEstruturas(ocorrencias: Ocorrencia[], recorte: RecorteQuiz): number {
  return aplicarRecorte(ocorrencias, recorte).length
}
