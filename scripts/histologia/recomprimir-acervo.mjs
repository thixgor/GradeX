/**
 * Recompressão escalonada do acervo do Manual da Histologia.
 *
 *   npm install --no-save sharp
 *   node scripts/histologia/recomprimir-acervo.mjs
 *
 * `sharp` é instalado sob demanda e não entra em `package.json`: é uma
 * dependência nativa pesada, usada por um script de migração que roda uma vez —
 * não deveria custar a instalação de todo mundo que clona o repositório.
 *
 * ## Por que existe
 *
 * O acervo servível tem 2,10 GiB e o plano Hobby da Vercel limita o Blob a
 * 1 GiB. Em vez de comprimir tudo por igual, a qualidade é escalonada pelo
 * papel pedagógico de cada camada — o que se amplia recebe o melhor orçamento,
 * o que é arte de linha recebe o menor:
 *
 * | camada           | papel                                          | alvo |
 * |------------------|------------------------------------------------|------|
 * | imagem-base      | as lâminas que o aluno amplia no microscópio    | q87  |
 * | imagem-de-quiz   | vistas para identificar, sem zoom profundo      | q75  |
 * | marcador-overlay | setas e contornos, sem textura fotográfica      | q90  |
 *
 * ## O que é preservado
 *
 * O **SHA-256 original continua sendo a identidade do asset**. Ele não é o hash
 * do arquivo recomprimido: é o identificador da fonte, e é o que liga cada
 * imagem à sua proveniência no Digital Histology. O que muda é só a extensão
 * servida (`.webp`) e o tamanho — registrados no manifesto para o pipeline
 * reescrever os fragmentos de dados.
 *
 * A transparência dos overlays é preservada com `alphaQuality: 100`: o canal
 * alfa define onde a seta existe, e degradá-lo borraria o marcador contra a
 * lâmina.
 *
 * ## O que se perde, dito com todas as letras
 *
 * Recompressão com perda não é reversível e come textura fina — exatamente o
 * que distingue padrão de cromatina, granulação e borda em escova. As imagens
 * originais continuam íntegras no acervo Git LFS; se um dia houver orçamento de
 * armazenamento, basta reenviar sem passar por aqui.
 */

import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const acervo = path.join(raiz, 'public/Manual-Histologia')
const saida = path.join(acervo, 'derivadas-webp')
const manifesto = path.join(acervo, 'dados/manifesto-derivadas.json')

/**
 * Qualidade por tipo de asset. Ver a tabela no cabeçalho.
 *
 * Os valores foram **recalibrados sobre a conversão real**, não sobre a amostra
 * inicial: medindo 332 imagens-base convertidas, q92 rendeu 61% do original e
 * não os 52% que uma amostra de 20 arquivos sugeria. Com aquele erro, o acervo
 * fecharia em ~0,97 GiB contra um limite de 1,00 GiB que já provou ser rígido —
 * 3% de folga. Os overlays, medidos em 1.868 arquivos, deram 30% a q90 e ficam
 * como estão.
 */
const QUALIDADE = {
  'imagem-base': 87,
  'imagem-de-quiz': 75,
  'marcador-overlay': 90,
}

const plano = (await readFile(path.join(acervo, 'dados/plano-assets-blob.jsonl'), 'utf8'))
  .split('\n')
  .filter((l) => l.trim())
  .map((l) => JSON.parse(l))
  // Os 19 pacotes H5P são prova de origem e a interface nunca os serve.
  .filter((item) => item.tipo !== 'pacote-h5p')

let derivadas = {}
try {
  derivadas = JSON.parse(await readFile(manifesto, 'utf8'))
} catch {
  /* primeira execução */
}

const pendentes = plano.filter((i) => !derivadas[i.sha256])

console.log(`Total a converter : ${plano.length.toLocaleString('pt-BR')} arquivos`)
console.log(`Já convertidos    : ${(plano.length - pendentes.length).toLocaleString('pt-BR')}`)
console.log('')

const concorrencia = Math.max(1, Math.min(8, Number(process.env.HISTOLOGIA_CONCORRENCIA) || 4))
let cursor = 0
let feitos = 0
let bytesOriginais = 0
let bytesDerivados = 0
let falhas = 0
const inicio = Date.now()

async function trabalhador() {
  for (;;) {
    const i = cursor++
    if (i >= pendentes.length) return
    const item = pendentes[i]
    const origem = path.join(acervo, item.arquivoLocal)
    const qualidade = QUALIDADE[item.tipo]
    if (!qualidade) {
      falhas++
      console.error(`✘ Tipo sem qualidade definida: ${item.tipo}`)
      continue
    }

    try {
      const entrada = await readFile(origem)
      // Recusa ponteiro Git LFS: converter um arquivo de texto de 130 bytes
      // "daria certo" e produziria uma imagem inválida no CDN.
      if (entrada.length !== item.bytes) {
        throw new Error(
          `tamanho ${entrada.length} ≠ ${item.bytes} — rode "git lfs pull --exclude=*.h5p"`,
        )
      }

      const destino = path.join(saida, `${item.sha256.slice(0, 2)}/${item.sha256}.webp`)
      await mkdir(path.dirname(destino), { recursive: true })

      const buffer = await sharp(entrada)
        .webp({ quality: qualidade, alphaQuality: 100, effort: 4 })
        .toBuffer()
      await writeFile(destino, buffer)

      derivadas[item.sha256] = {
        ext: 'webp',
        mime: 'image/webp',
        bytes: buffer.length,
        bytesOriginais: item.bytes,
        qualidade,
        tipo: item.tipo,
      }

      bytesOriginais += item.bytes
      bytesDerivados += buffer.length
      feitos++

      if (feitos % 200 === 0) {
        await writeFile(manifesto, `${JSON.stringify(derivadas)}\n`, 'utf8')
        const s = (Date.now() - inicio) / 1000
        const restam = pendentes.length - feitos - falhas
        console.log(
          `${feitos.toLocaleString('pt-BR')}/${pendentes.length.toLocaleString('pt-BR')} · ` +
            `${gib(bytesDerivados)} de ${gib(bytesOriginais)} · ` +
            `faltam ~${Math.round((s / feitos) * restam / 60)} min`,
        )
      }
    } catch (erro) {
      falhas++
      console.error(`✘ ${item.arquivoLocal} — ${erro.message}`)
      if (falhas > 20) {
        console.error('Falhas demais; abortando.')
        process.exit(1)
      }
    }
  }
}

function gib(b) {
  return `${(b / 2 ** 30).toFixed(2)} GiB`
}

await Promise.all(Array.from({ length: concorrencia }, trabalhador))
await writeFile(manifesto, `${JSON.stringify(derivadas)}\n`, 'utf8')

/* ────────────────────────── relatório ────────────────────────── */

const porTipo = {}
for (const d of Object.values(derivadas)) {
  const t = (porTipo[d.tipo] ??= { n: 0, orig: 0, novo: 0, q: d.qualidade })
  t.n++
  t.orig += d.bytesOriginais
  t.novo += d.bytes
}

console.log('')
console.log('── Resultado ──')
console.log(`${'camada'.padEnd(18)}${'q'.padStart(4)}${'arquivos'.padStart(10)}${'original'.padStart(12)}${'WebP'.padStart(12)}${'%'.padStart(7)}`)
let totalOrig = 0
let totalNovo = 0
for (const [tipo, t] of Object.entries(porTipo)) {
  totalOrig += t.orig
  totalNovo += t.novo
  console.log(
    `${tipo.padEnd(18)}${String(t.q).padStart(4)}${t.n.toLocaleString('pt-BR').padStart(10)}` +
      `${gib(t.orig).padStart(12)}${gib(t.novo).padStart(12)}${`${((100 * t.novo) / t.orig).toFixed(0)}%`.padStart(7)}`,
  )
}
console.log(
  `${'TOTAL'.padEnd(18)}${''.padStart(4)}${Object.keys(derivadas).length.toLocaleString('pt-BR').padStart(10)}` +
    `${gib(totalOrig).padStart(12)}${gib(totalNovo).padStart(12)}${`${((100 * totalNovo) / totalOrig).toFixed(0)}%`.padStart(7)}`,
)
console.log('')

const LIMITE_HOBBY = 2 ** 30
if (totalNovo >= LIMITE_HOBBY) {
  console.error(
    `✘ ${gib(totalNovo)} ainda estoura o limite de 1 GiB do plano Hobby. ` +
      'Baixe a qualidade em QUALIDADE e rode de novo (apague o manifesto antes).',
  )
  process.exit(1)
}
console.log(
  `✔ Cabe no plano Hobby: ${gib(totalNovo)} de 1,00 GiB ` +
    `(folga de ${(100 * (1 - totalNovo / LIMITE_HOBBY)).toFixed(0)}%).`,
)
if (falhas > 0) {
  console.error(`Atenção: ${falhas} falha(s).`)
  process.exit(1)
}
