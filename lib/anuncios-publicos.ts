'use client'

/**
 * Uma busca só de `/api/anuncios` por página, para todas as peças.
 *
 * O banner flutuante e os anúncios na página (topo e fim) leem a mesma lista.
 * Cada um buscando a sua seriam três idas ao Mongo por navegação; aqui a
 * primeira busca é compartilhada e a lista vale por um minuto — o mesmo
 * `max-age` que a rota já declara.
 *
 * Também guarda a última lista recebida: numa navegação dentro do app, o
 * anúncio da página seguinte nasce já com o conteúdo, sem esperar rede e sem
 * empurrar o texto para baixo depois de aparecer.
 */

const VALIDADE_MS = 60_000

let ultimaLista: unknown[] | null = null
let busca: { em: number; promessa: Promise<unknown[]> } | null = null

/** A última lista recebida, para pintar sem esperar. `null` antes da primeira. */
export function anunciosEmCache(): unknown[] | null {
  return ultimaLista
}

export function carregarAnunciosPublicos(): Promise<unknown[]> {
  if (busca && Date.now() - busca.em < VALIDADE_MS) return busca.promessa

  const promessa = fetch('/api/anuncios')
    .then(async (response) => {
      if (!response.ok) throw new Error(`Anuncios: resposta ${response.status} de /api/anuncios`)
      const data = await response.json()
      const lista = Array.isArray(data?.anuncios) ? (data.anuncios as unknown[]) : []
      ultimaLista = lista
      return lista
    })
    .catch((error) => {
      // Falha não fica em cache: a próxima peça tenta de novo.
      busca = null
      throw error
    })

  busca = { em: Date.now(), promessa }
  return promessa
}
