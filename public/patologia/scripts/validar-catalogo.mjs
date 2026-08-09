import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { gunzipSync } from 'node:zlib'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const catalogo = path.join(raiz, 'catalogo')

const lerJson = async (arquivo) => JSON.parse(await readFile(arquivo, 'utf8'))
const manifesto = await lerJson(path.join(catalogo, 'manifesto.json'))
const fontes = await lerJson(path.join(catalogo, 'fontes.json'))
const patologias = await lerJson(path.join(catalogo, 'patologias.json'))

const idsDeFonte = new Set(fontes.map((item) => item.id))
const idsDePatologia = new Set()
const fragmentosEsperados = new Map()

for (const patologia of patologias) {
  if (idsDePatologia.has(patologia.id)) throw new Error(`Patologia duplicada: ${patologia.id}`)
  if (!idsDeFonte.has(patologia.fonteId)) throw new Error(`Fonte ausente: ${patologia.fonteId}`)
  if (!patologia.fragmentosDeMidia?.length) throw new Error(`Patologia sem fragmento: ${patologia.id}`)
  idsDePatologia.add(patologia.id)
  fragmentosEsperados.set(patologia.id, new Set(patologia.fragmentosDeMidia))
}

let totalMidias = 0
const midiasPorPatologia = new Map()

for (const parte of manifesto.arquivos.fragmentosDeMidia) {
  const arquivo = path.join(catalogo, parte.arquivo)
  const compactado = await readFile(arquivo)
  const sha256 = createHash('sha256').update(compactado).digest('hex')
  if (sha256 !== parte.sha256) throw new Error(`SHA-256 divergente: ${parte.arquivo}`)

  const midias = JSON.parse(gunzipSync(compactado).toString('utf8'))
  if (midias.length !== parte.registros) throw new Error(`Contagem divergente: ${parte.arquivo}`)

  for (const midia of midias) {
    if (!idsDePatologia.has(midia.patologiaId)) {
      throw new Error(`Mídia ${midia.id} aponta para patologia inexistente: ${midia.patologiaId}`)
    }
    if (!idsDeFonte.has(midia.fonteId)) throw new Error(`Mídia ${midia.id} tem fonte inexistente`)
    if (!fragmentosEsperados.get(midia.patologiaId).has(parte.arquivo)) {
      throw new Error(`Índice não aponta para ${parte.arquivo}: ${midia.patologiaId}`)
    }
    if (!midia.urlImagem && !midia.urlMiniatura && !midia.urlVisualizador) {
      throw new Error(`Mídia sem destino remoto: ${midia.id}`)
    }
    const total = midiasPorPatologia.get(midia.patologiaId) ?? 0
    midiasPorPatologia.set(midia.patologiaId, total + 1)
  }
  totalMidias += midias.length
}

if (patologias.length !== manifesto.totais.patologias) {
  throw new Error(`Patologias: manifesto=${manifesto.totais.patologias}, real=${patologias.length}`)
}
if (totalMidias !== manifesto.totais.midias) {
  throw new Error(`Mídias: manifesto=${manifesto.totais.midias}, real=${totalMidias}`)
}
for (const patologia of patologias) {
  const real = midiasPorPatologia.get(patologia.id) ?? 0
  if (real !== patologia.quantidadeMidias) {
    throw new Error(`Mídias de ${patologia.id}: índice=${patologia.quantidadeMidias}, real=${real}`)
  }
}

console.log(
  `Catálogo válido: ${patologias.length.toLocaleString('pt-BR')} patologias, ` +
    `${totalMidias.toLocaleString('pt-BR')} mídias e ` +
    `${manifesto.arquivos.fragmentosDeMidia.length} fragmentos.`,
)
