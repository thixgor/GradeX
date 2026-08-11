import { createHash } from 'node:crypto'
import { readFile, readdir, mkdir, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDir, '..', '..')
const manifestPath = path.join(scriptDir, 'assets-raio-x.json')
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const publicRoot = path.join(
  projectRoot,
  'public',
  ...manifest.publicRoot.split('/').filter(Boolean),
)
const download = process.argv.includes('--download')

function destinationFor(relativePath) {
  if (!relativePath || relativePath.includes('..') || path.isAbsolute(relativePath)) {
    throw new Error(`Caminho inseguro no manifesto: ${relativePath}`)
  }
  const destination = path.resolve(publicRoot, relativePath)
  if (!destination.startsWith(path.resolve(publicRoot) + path.sep)) {
    throw new Error(`Destino fora do acervo: ${destination}`)
  }
  return destination
}

function checksum(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

async function materialize(asset) {
  const destination = destinationFor(asset.path)
  if (download) {
    const response = await fetch(asset.source)
    if (!response.ok) throw new Error(`${response.status} ao baixar ${asset.source}`)
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) {
      throw new Error(`Tipo inválido ${contentType}: ${asset.source}`)
    }
    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.length !== asset.bytes || checksum(bytes) !== asset.sha256) {
      throw new Error(`O arquivo remoto mudou desde o manifesto: ${asset.source}`)
    }
    await mkdir(path.dirname(destination), { recursive: true })
    const temporary = `${destination}.part`
    await writeFile(temporary, bytes)
    await rm(destination, { force: true })
    await rename(temporary, destination)
    return
  }

  const bytes = await readFile(destination)
  if (bytes.length !== asset.bytes) throw new Error(`Tamanho divergente: ${asset.path}`)
  if (checksum(bytes) !== asset.sha256) throw new Error(`SHA-256 divergente: ${asset.path}`)
}

async function listFiles(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      files.push(...await listFiles(path.join(directory, entry.name), relative))
    } else {
      files.push(relative)
    }
  }
  return files
}

let cursor = 0
const workers = Array.from({ length: download ? 8 : 4 }, async () => {
  while (cursor < manifest.files.length) {
    const asset = manifest.files[cursor++]
    await materialize(asset)
  }
})

try {
  await Promise.all(workers)
  const expected = new Set(manifest.files.map((asset) => asset.path))
  const actual = new Set(await listFiles(publicRoot))
  const missing = [...expected].filter((file) => !actual.has(file))
  const unexpected = [...actual].filter((file) => !expected.has(file) && !file.endsWith('.part'))
  if (missing.length || unexpected.length) {
    throw new Error(
      `Inventário divergente. Ausentes: ${missing.join(', ') || 'nenhum'}. ` +
      `Extras: ${unexpected.join(', ') || 'nenhum'}.`,
    )
  }
  const total = manifest.files.reduce((sum, asset) => sum + asset.bytes, 0)
  console.log(`${manifest.files.length} assets verificados (${total} bytes), versão ${manifest.version}.`)
} catch (error) {
  const partials = (await listFiles(publicRoot).catch(() => [])).filter((file) => file.endsWith('.part'))
  await Promise.all(partials.map((file) => rm(destinationFor(file), { force: true })))
  throw error
}
