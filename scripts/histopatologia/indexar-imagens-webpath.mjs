import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const DIRETORIO = path.resolve('data/histopatologia/webpath-utah')
const CONCORRENCIA = 8

function imagemPrincipal(html, urlPagina) {
  const candidatos = [...html.matchAll(/<img\b[^>]*\bsrc\s*=\s*["']?([^"'\s>]+)/gi)]
    .map((resultado) => resultado[1])
    .filter((src) => !/\/(?:GIFS|icons?)\//i.test(src))
    .map((src) => new URL(src, urlPagina))
    .filter((url) => url.protocol === 'https:' && url.host === 'webpath.med.utah.edu')

  return candidatos[0]?.href
}

async function buscarImagem(entrada) {
  if (entrada.urlImagem) return entrada
  for (let tentativa = 1; tentativa <= 3; tentativa += 1) {
    try {
      const resposta = await fetch(entrada.url, {
        headers: { 'user-agent': 'DomineAqui-WebPath-Catalog/1.0 (educational)' },
      })
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
      const urlImagem = imagemPrincipal(await resposta.text(), entrada.url)
      if (!urlImagem) throw new Error('imagem principal não encontrada')
      return { ...entrada, urlImagem }
    } catch (erro) {
      if (tentativa === 3) {
        throw new Error(`${entrada.url}: ${erro instanceof Error ? erro.message : String(erro)}`)
      }
      await new Promise((resolve) => setTimeout(resolve, tentativa * 500))
    }
  }
}

async function emLotes(itens, tarefa) {
  const saida = new Array(itens.length)
  let proximo = 0
  await Promise.all(
    Array.from({ length: CONCORRENCIA }, async () => {
      while (proximo < itens.length) {
        const indice = proximo
        proximo += 1
        saida[indice] = await tarefa(itens[indice])
      }
    }),
  )
  return saida
}

const arquivos = (await readdir(DIRETORIO)).filter((nome) => nome.endsWith('.json')).sort()
let total = 0

for (const nome of arquivos) {
  const arquivo = path.join(DIRETORIO, nome)
  const capitulo = JSON.parse(await readFile(arquivo, 'utf8'))
  capitulo.entradas = await emLotes(capitulo.entradas, buscarImagem)
  total += capitulo.entradas.length
  await writeFile(arquivo, `${JSON.stringify(capitulo)}\n`, 'utf8')
  process.stdout.write(`${nome}: ${capitulo.entradas.length}\n`)
}

process.stdout.write(`Total indexado: ${total}\n`)
