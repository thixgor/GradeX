/**
 * Apaga tudo que está sob `manual-histologia/` no Vercel Blob.
 *
 *   BLOB_READ_WRITE_TOKEN=... node scripts/histologia/limpar-blob.mjs
 *
 * Necessário ao trocar o formato servido: os arquivos antigos (`.jpg`/`.png`)
 * não são sobrescritos pelos novos (`.webp`) — têm caminho diferente — e
 * continuariam consumindo a cota de armazenamento sem nunca serem servidos.
 *
 * Só remove o prefixo `manual-histologia/`. Qualquer outra coisa no store fica
 * intacta: um Blob store costuma ser compartilhado entre funcionalidades, e
 * apagar por engano o que não é nosso seria irreversível.
 */

import { del, list } from '@vercel/blob'
import process from 'node:process'

const token = process.env.BLOB_READ_WRITE_TOKEN
if (!token) {
  console.error('Defina BLOB_READ_WRITE_TOKEN.')
  process.exit(1)
}

const PREFIXO = 'manual-histologia/'

let cursor
let apagados = 0
let bytes = 0

for (;;) {
  const pagina = await list({ token, prefix: PREFIXO, limit: 1000, cursor })
  if (pagina.blobs.length === 0) break

  // Confirmação defensiva: nada fora do prefixo entra na lista de exclusão,
  // mesmo que a API devolvesse algo inesperado.
  const alvos = pagina.blobs.filter((b) => b.pathname.startsWith(PREFIXO))
  if (alvos.length !== pagina.blobs.length) {
    console.error('✘ A listagem trouxe itens fora do prefixo; abortando por segurança.')
    process.exit(1)
  }

  bytes += alvos.reduce((n, b) => n + (b.size ?? 0), 0)

  // A API aceita até 1000 URLs por chamada, mas aplica rate limit bem antes
  // disso em lotes grandes. Lotes de 100 com backoff que honra o `retryAfter`
  // do erro terminam mais rápido do que um lote gigante que é recusado.
  for (let i = 0; i < alvos.length; i += 100) {
    const lote = alvos.slice(i, i + 100).map((b) => b.url)
    for (let tentativa = 1; ; tentativa++) {
      try {
        await del(lote, { token })
        break
      } catch (erro) {
        const espera = (erro?.retryAfter ?? 2 ** tentativa) * 1000
        if (tentativa >= 5) throw erro
        console.log(`  rate limit; aguardando ${Math.round(espera / 1000)}s…`)
        await new Promise((r) => setTimeout(r, espera))
      }
    }
    apagados += lote.length
    if (apagados % 500 === 0) console.log(`apagados ${apagados.toLocaleString('pt-BR')}…`)
  }

  if (!pagina.hasMore) break
  cursor = pagina.cursor
}

console.log('')
console.log(`✔ ${apagados.toLocaleString('pt-BR')} objetos removidos (${(bytes / 2 ** 30).toFixed(2)} GiB liberados).`)
