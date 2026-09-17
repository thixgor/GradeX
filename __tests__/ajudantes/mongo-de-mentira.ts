/**
 * Mongo de mentira, em memória.
 *
 * Existe para testar as funções que decidem reservas de desconto (cupom e
 * benefício PROUNI/FIES). Essas decisões não cabem em função pura: elas SÃO a
 * sequência de leituras e escritas condicionais no banco — é justamente no
 * "filtro que não casa mais" que morava o bug de quem tentava pagar duas
 * vezes. Testar só a aritmética deixaria de fora exatamente a parte quebrada.
 *
 * Suporta apenas o que o código sob teste usa: caminhos com ponto, `$or`,
 * `$in`, `$nin`, `$exists`, `$set` e `$inc`. Não é um Mongo; é o suficiente
 * para que um teste falhe pelo motivo certo.
 */

type Doc = Record<string, any>

function ehObjetoDeOperadores(valor: any) {
  return (
    valor !== null &&
    typeof valor === 'object' &&
    !Array.isArray(valor) &&
    !(valor instanceof Date) &&
    Object.keys(valor).some((chave) => chave.startsWith('$'))
  )
}

function valorEm(doc: Doc, caminho: string) {
  return caminho.split('.').reduce<any>((atual, chave) => (atual == null ? undefined : atual[chave]), doc)
}

function definirEm(doc: Doc, caminho: string, valor: any) {
  const partes = caminho.split('.')
  let atual = doc
  for (const parte of partes.slice(0, -1)) {
    if (atual[parte] == null || typeof atual[parte] !== 'object') atual[parte] = {}
    atual = atual[parte]
  }
  atual[partes[partes.length - 1]] = valor
}

function igual(atual: any, esperado: any) {
  if (esperado === null) return atual === null || atual === undefined
  // Campo de array casa quando QUALQUER elemento bate — é como o Mongo trata
  // `{'grant.reservedOrderIds': '<id>'}`.
  if (Array.isArray(atual)) return atual.some((item) => String(item) === String(esperado))
  if (atual === undefined) return false
  return String(atual) === String(esperado)
}

export function casaComFiltro(doc: Doc, filtro: Doc): boolean {
  for (const [chave, esperado] of Object.entries(filtro || {})) {
    if (chave === '$or') {
      if (!(esperado as Doc[]).some((sub) => casaComFiltro(doc, sub))) return false
      continue
    }
    if (chave === '$and') {
      if (!(esperado as Doc[]).every((sub) => casaComFiltro(doc, sub))) return false
      continue
    }

    const atual = valorEm(doc, chave)
    if (ehObjetoDeOperadores(esperado)) {
      const ops = esperado as Doc
      if ('$exists' in ops && (atual !== undefined) !== Boolean(ops.$exists)) return false
      if ('$in' in ops && !(ops.$in as any[]).some((valor) => igual(atual, valor))) return false
      if ('$nin' in ops && (ops.$nin as any[]).some((valor) => igual(atual, valor))) return false
      if ('$regex' in ops) {
        const regex = ops.$regex instanceof RegExp ? ops.$regex : new RegExp(String(ops.$regex))
        if (typeof atual !== 'string' || !regex.test(atual)) return false
      }
      if ('$gte' in ops && !(atual instanceof Date ? atual >= ops.$gte : Number(atual) >= Number(ops.$gte))) return false
      continue
    }

    if (!igual(atual, esperado)) return false
  }
  return true
}

function aplicarAtualizacao(doc: Doc, atualizacao: Doc) {
  for (const [caminho, valor] of Object.entries(atualizacao.$set || {})) {
    definirEm(doc, caminho, valor)
  }
  for (const [caminho, valor] of Object.entries(atualizacao.$inc || {})) {
    definirEm(doc, caminho, Number(valorEm(doc, caminho) || 0) + Number(valor))
  }
}

function clonar<T>(valor: T): T {
  return JSON.parse(JSON.stringify(valor, (_chave, v) => (v instanceof Date ? v.toISOString() : v)))
}

export interface ColecaoDeMentira {
  docs: Doc[]
}

/**
 * Banco com as coleções que o teste entregar: `{ coupons: [...], ... }`.
 * Os documentos são usados por referência — o teste pode inspecioná-los
 * depois de cada operação.
 */
export function mongoDeMentira(colecoes: Record<string, Doc[]>) {
  const dados: Record<string, Doc[]> = colecoes

  function docsDe(nome: string) {
    if (!dados[nome]) dados[nome] = []
    return dados[nome]
  }

  return {
    dados,
    collection(nome: string) {
      const docs = docsDe(nome)
      return {
        async findOne(filtro: Doc = {}, opcoes: Doc = {}) {
          const achados = docs.filter((doc) => casaComFiltro(doc, filtro))
          if (opcoes?.sort) achados.reverse()
          return achados[0] || null
        },
        find(filtro: Doc = {}) {
          let achados = docs.filter((doc) => casaComFiltro(doc, filtro))
          const cursor = {
            sort() {
              return cursor
            },
            limit(n: number) {
              achados = achados.slice(0, n)
              return cursor
            },
            async toArray() {
              return achados
            },
          }
          return cursor
        },
        async countDocuments(filtro: Doc = {}) {
          return docs.filter((doc) => casaComFiltro(doc, filtro)).length
        },
        async updateOne(filtro: Doc, atualizacao: Doc) {
          const alvo = docs.find((doc) => casaComFiltro(doc, filtro))
          if (!alvo) return { matchedCount: 0, modifiedCount: 0 }
          aplicarAtualizacao(alvo, atualizacao)
          return { matchedCount: 1, modifiedCount: 1 }
        },
        async updateMany(filtro: Doc, atualizacao: Doc) {
          const alvos = docs.filter((doc) => casaComFiltro(doc, filtro))
          for (const alvo of alvos) aplicarAtualizacao(alvo, atualizacao)
          return { matchedCount: alvos.length, modifiedCount: alvos.length }
        },
        async findOneAndUpdate(filtro: Doc, atualizacao: Doc, opcoes: Doc = {}) {
          const alvo = docs.find((doc) => casaComFiltro(doc, filtro))
          if (!alvo) return null
          const antes = clonar(alvo)
          aplicarAtualizacao(alvo, atualizacao)
          return opcoes.returnDocument === 'before' ? antes : alvo
        },
        async insertOne(doc: Doc) {
          docs.push(doc)
          return { insertedId: doc._id }
        },
      }
    },
  } as any
}
