#!/usr/bin/env node
/**
 * Ingestão do acervo licenciado do Manual de Semiologia.
 *
 * ## O que este script faz, e o que ele deliberadamente não faz
 *
 * As autorizações do The POCUS Atlas e do Radiopaedia liberam o acervo completo
 * de cada fonte para a DomineAqui. O que elas não fazem é escolher, por nós,
 * qual caso ilustra bem uma otite média aguda — isso é julgamento clínico, e
 * continua sendo trabalho de gente.
 *
 * A divisão é essa:
 *
 * - **Pessoa**: abre `curadoria.json` e diz "a cena `otoscopia/otite-media-aguda`
 *   recebe este caso, com esta legenda". Uma linha por mídia.
 * - **Script**: verifica que a URL é HTTPS e de host autorizado, baixa,
 *   confere o tipo, calcula o SHA-256, opcionalmente espelha, e gera
 *   `lib/semiologia/acervo.gerado.ts`.
 *
 * Ninguém digita hash, ninguém digita caminho de espelho, e nenhuma URL entra
 * no acervo sem ter respondido 200 pelo menos uma vez.
 *
 * ## Modos
 *
 *   --esboco      monta o formulário de curadoria com as cenas que faltam
 *   --verificar   (padrão) checa cada entrada e relata, sem escrever nada
 *   --gerar       escreve lib/semiologia/acervo.gerado.ts
 *   --baixar      baixa os bytes para .semiologia/midia/ e calcula o SHA-256
 *   --arquivo=X   usa outro arquivo de curadoria
 *
 * O `--esboco` existe porque a parte cara da curadoria não é escrever JSON: é
 * saber, para cada uma das 29 cenas, o que procurar. Ele lê o próprio acervo,
 * descobre quais cenas ainda não têm caso e emite uma entrada por cena, já com
 * janela, cena e uma legenda rascunhada a partir do diagnóstico que a ficha
 * declara. Sobra para a pessoa colar o link do caso e revisar a legenda.
 *
 * O `--verificar` sozinho não toca em disco de propósito: é o modo que roda em
 * CI para detectar link podre antes de o aluno encontrar o quadrado quebrado.
 *
 * ## Sobre a resolução automática de casos do Radiopaedia
 *
 * O Radiopaedia publica uma API em `/api/v1/`. Quando a entrada traz `caso` em
 * vez de `urlOrigem`, o script tenta usá-la para descobrir as imagens do caso e
 * a autoria — poupando a pessoa de copiar URL de imagem uma a uma.
 *
 * A resolução é **defensiva por escolha**: se o corpo não vier no formato
 * esperado, a entrada falha com uma mensagem dizendo o que veio, em vez de
 * adivinhar um caminho e gravar uma URL inventada no acervo. Uma URL inventada
 * não falha aqui — falha em produção, na frente do aluno, com o crédito
 * apontando para um caso que pode não existir. Esse é o erro que uma
 * autorização de uso não perdoa, e é o único que este script se recusa a
 * cometer sozinho.
 */

import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const raizDoProjeto = path.resolve(scriptDir, '..', '..')

const args = process.argv.slice(2)
const esboco = args.includes('--esboco')
const gerar = args.includes('--gerar')
const baixar = args.includes('--baixar')
const arquivoArg = args.find((a) => a.startsWith('--arquivo='))
const arquivoDeCuradoria = arquivoArg
  ? path.resolve(raizDoProjeto, arquivoArg.slice('--arquivo='.length))
  : path.join(scriptDir, 'curadoria.json')

const destinoGerado = path.join(raizDoProjeto, 'lib', 'semiologia', 'acervo.gerado.ts')
const pastaDeBytes = path.join(raizDoProjeto, '.semiologia', 'midia')

/**
 * Espelho dos hosts autorizados de `lib/acervos-licenciados.ts`.
 *
 * Repetido aqui, e não importado, porque este script roda em Node puro sem o
 * resolvedor de caminhos do Next — e porque o teste
 * `__tests__/semiologia/direitos.test.ts` compara as duas listas e falha se
 * elas divergirem. A duplicação é vigiada, então não é duplicação solta.
 */
const HOSTS = {
  'pocus-atlas': ['www.thepocusatlas.com', 'thepocusatlas.com', 'images.squarespace-cdn.com'],
  radiopaedia: ['radiopaedia.org', 'prod-images-static.radiopaedia.org', 'images.radiopaedia.org'],
}

const TIPOS = {
  imagem: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'],
  clipe: ['video/mp4', 'video/webm', 'video/quicktime'],
}

function hostAutorizado(url, fonteId) {
  let alvo
  try {
    alvo = new URL(url)
  } catch {
    return false
  }
  if (alvo.protocol !== 'https:') return false
  const host = alvo.hostname.toLowerCase()
  return (HOSTS[fonteId] ?? []).some((p) => host === p || host.endsWith(`.${p}`))
}

/** Resolve um caso do Radiopaedia pela API pública, sem adivinhar formato. */
async function resolverCasoRadiopaedia(referencia) {
  const id = String(referencia).match(/(\d+)/)?.[1]
  if (!id) throw new Error(`não consegui extrair o id do caso de "${referencia}"`)

  const alvo = `https://radiopaedia.org/api/v1/cases/${id}`
  const resposta = await fetch(alvo, {
    headers: { Accept: 'application/json', 'User-Agent': 'DomineAqui-curadoria/1.0' },
  })
  if (!resposta.ok) throw new Error(`API do Radiopaedia respondeu ${resposta.status} para ${alvo}`)

  let corpo
  try {
    corpo = await resposta.json()
  } catch {
    throw new Error(`API do Radiopaedia devolveu algo que não é JSON para ${alvo}`)
  }

  // Varredura genérica: em vez de fixar um caminho que pode mudar, procura
  // qualquer URL de imagem em host autorizado dentro da resposta. Se não achar
  // nenhuma, falha — nunca inventa.
  const encontradas = []
  const visitar = (no) => {
    if (!no) return
    if (typeof no === 'string') {
      if (/^https:\/\//.test(no) && hostAutorizado(no, 'radiopaedia') && /\.(jpe?g|png|webp)(\?|$)/i.test(no)) {
        encontradas.push(no)
      }
      return
    }
    if (Array.isArray(no)) return no.forEach(visitar)
    if (typeof no === 'object') return Object.values(no).forEach(visitar)
  }
  visitar(corpo)

  if (!encontradas.length) {
    throw new Error(
      `nenhuma imagem em host autorizado no caso ${id}. ` +
        `Chaves de topo vindas da API: ${Object.keys(corpo ?? {}).join(', ') || '(nenhuma)'}. ` +
        `Ajuste a resolução ou informe "urlOrigem" diretamente na curadoria.`,
    )
  }

  return {
    urls: [...new Set(encontradas)],
    autoria: typeof corpo?.author?.name === 'string' ? corpo.author.name : undefined,
    urlDoCaso: typeof corpo?.public_url === 'string' ? corpo.public_url : `https://radiopaedia.org/cases/${id}`,
  }
}

/** Baixa, confere o tipo e devolve hash e tamanho. */
async function inspecionar(url, tipoEsperado) {
  const resposta = await fetch(url, { headers: { 'User-Agent': 'DomineAqui-curadoria/1.0' } })
  if (!resposta.ok) throw new Error(`${resposta.status} ao buscar ${url}`)

  const contentType = (resposta.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
  const aceitos = TIPOS[tipoEsperado] ?? []
  if (aceitos.length && !aceitos.includes(contentType)) {
    throw new Error(`tipo ${contentType || '(vazio)'} não é ${tipoEsperado} em ${url}`)
  }

  const bytes = Buffer.from(await resposta.arrayBuffer())
  if (!bytes.length) throw new Error(`corpo vazio em ${url}`)

  return {
    sha256: createHash('sha256').update(bytes).digest('hex'),
    bytes,
    tamanho: bytes.length,
    ext: contentType.split('/')[1]?.replace('quicktime', 'mov').replace('jpeg', 'jpg') ?? 'bin',
  }
}

function exigir(condicao, mensagem) {
  if (!condicao) throw new Error(mensagem)
}

/**
 * Formulário de curadoria: uma entrada por cena que ainda não tem caso.
 *
 * Carrega o corpus com `--experimental-strip-types`, como os outros pipelines
 * do repositório — os arquivos de conteúdo só importam tipos uns dos outros, e
 * import de tipo some na remoção, então Node os carrega sem precisar do
 * resolvedor do Next.
 */
async function montarEsboco() {
  const { VISTAS } = await import('../../lib/semiologia/vistas.ts')
  const { JANELAS_ULTRASSOM } = await import('../../lib/semiologia/ultrassom.ts')
  const { ACERVO_DE_MIDIA } = await import('../../lib/semiologia/acervo.gerado.ts')

  const existente = new Set(Object.keys(ACERVO_DE_MIDIA ?? {}))
  const midias = []

  for (const janela of [...VISTAS, ...JANELAS_ULTRASSOM]) {
    const ehUltrassom = 'protocolo' in janela
    for (const cena of janela.cenas) {
      const chave = `${janela.slug}/${cena.id}`
      if (existente.has(chave)) continue
      midias.push({
        _alvo: `${janela.nome} → ${cena.titulo}`,
        _procurar: cena.diagnostico,
        janela: janela.slug,
        cena: cena.id,
        // O POCUS Atlas cobre ultrassom; o Radiopaedia cobre o resto do acervo
        // de imagem. É palpite editorial, não regra — troque à vontade.
        fonte: ehUltrassom ? 'pocus-atlas' : 'radiopaedia',
        tipo: ehUltrassom && /desliza|pneumotorax|cava|pericard/i.test(chave) ? 'clipe' : 'imagem',
        caso: '',
        urlOrigem: '',
        urlDoCaso: '',
        legenda: cena.diagnostico,
      })
    }
  }

  const destino = path.join(scriptDir, 'curadoria.json')
  const atual = JSON.parse(await readFile(destino, 'utf8').catch(() => '{}'))
  const conteudo = {
    _leia:
      'Para cada entrada: cole "caso" (URL do caso no Radiopaedia) OU "urlOrigem" (URL direta do arquivo) e "urlDoCaso". Revise a legenda — ela vem rascunhada do diagnóstico da ficha. Apague as entradas que não for curar agora. Depois: npm run semiologia:acervo:gerar',
    _campos: atual._campos,
    midias,
  }
  await writeFile(destino, `${JSON.stringify(conteudo, null, 2)}\n`, 'utf8')
  console.log(`Esboço com ${midias.length} cena(s) sem caso: ${path.relative(raizDoProjeto, destino)}`)
  console.log('Cole os links, revise as legendas, apague o que não for curar agora.')
}

async function main() {
  if (esboco) return montarEsboco()

  let curadoria
  try {
    curadoria = JSON.parse(await readFile(arquivoDeCuradoria, 'utf8'))
  } catch (erro) {
    console.error(`Não consegui ler a curadoria em ${arquivoDeCuradoria}: ${erro.message}`)
    process.exit(1)
  }

  const todas = Array.isArray(curadoria?.midias) ? curadoria.midias : []
  // Entrada de esboço ainda sem link não é erro: é trabalho não começado. O
  // script conta e segue, para a pessoa poder curar dez cenas hoje e vinte
  // depois sem precisar apagar as que faltam.
  const entradas = todas.filter((e) => e?.caso || e?.urlOrigem)
  const pendentes = todas.length - entradas.length
  if (pendentes) console.log(`${pendentes} cena(s) ainda sem link — ignoradas nesta passagem.\n`)
  if (!entradas.length) {
    console.log('Curadoria vazia — nada a fazer.')
    console.log(`Acrescente entradas em ${path.relative(raizDoProjeto, arquivoDeCuradoria)} e rode de novo.`)
    if (gerar) await escrever({})
    return
  }

  const acervo = {}
  const falhas = []
  let total = 0

  for (const [i, entrada] of entradas.entries()) {
    const rotulo = `${entrada.janela ?? '?'}/${entrada.cena ?? '?'} [${i + 1}]`
    try {
      exigir(entrada.janela && entrada.cena, 'faltam "janela" e "cena"')
      exigir(entrada.fonte in HOSTS, `fonte desconhecida: ${entrada.fonte}`)
      exigir(typeof entrada.legenda === 'string' && entrada.legenda.length > 10, 'legenda ausente ou curta demais')
      const tipo = entrada.tipo === 'clipe' ? 'clipe' : 'imagem'

      let urls = entrada.urlOrigem ? [entrada.urlOrigem] : []
      let autoria = entrada.autoria
      let urlDoCaso = entrada.urlDoCaso

      if (!urls.length) {
        exigir(entrada.caso, 'informe "urlOrigem" ou "caso"')
        exigir(entrada.fonte === 'radiopaedia', 'resolução por "caso" só existe para o Radiopaedia')
        const resolvido = await resolverCasoRadiopaedia(entrada.caso)
        urls = entrada.quantas ? resolvido.urls.slice(0, entrada.quantas) : resolvido.urls.slice(0, 1)
        autoria ??= resolvido.autoria
        urlDoCaso ??= resolvido.urlDoCaso
      }

      exigir(urlDoCaso, 'faltou "urlDoCaso" — o vínculo de proveniência é obrigatório')

      const chave = `${entrada.janela}/${entrada.cena}`
      acervo[chave] ??= []

      for (const [j, url] of urls.entries()) {
        exigir(hostAutorizado(url, entrada.fonte), `host fora da autorização de ${entrada.fonte}: ${url}`)

        const midia = {
          id: entrada.id ? (urls.length > 1 ? `${entrada.id}-${j + 1}` : entrada.id) : `m${i + 1}${j ? `-${j + 1}` : ''}`,
          tipo,
          fonte: entrada.fonte,
          urlOrigem: url,
          urlDoCaso,
          legenda: entrada.legenda,
          ...(autoria ? { autoria } : {}),
        }

        if (baixar) {
          const info = await inspecionar(url, tipo)
          midia.sha256 = info.sha256
          midia.ext = info.ext
          await mkdir(path.join(pastaDeBytes, info.sha256.slice(0, 2)), { recursive: true })
          await writeFile(path.join(pastaDeBytes, info.sha256.slice(0, 2), `${info.sha256}.${info.ext}`), info.bytes)
          console.log(`  ✓ ${rotulo} ${url} → ${info.sha256.slice(0, 12)}… (${(info.tamanho / 1024).toFixed(0)} kB)`)
        } else {
          console.log(`  ✓ ${rotulo} ${url}`)
        }

        acervo[chave].push(midia)
        total += 1
      }
    } catch (erro) {
      falhas.push(`${rotulo}: ${erro.message}`)
      console.error(`  ✗ ${rotulo}: ${erro.message}`)
    }
  }

  console.log(`\n${total} mídia(s) em ${Object.keys(acervo).length} cena(s); ${falhas.length} falha(s).`)

  if (falhas.length) {
    // Gerar um acervo parcial calado deixaria a pessoa achar que curou 40 casos
    // quando 12 falharam. Ou passa tudo, ou o arquivo não é reescrito.
    console.error('\nNada foi gerado: corrija as falhas acima e rode de novo.')
    process.exit(1)
  }

  if (gerar) {
    await escrever(acervo)
    console.log(`Gerado: ${path.relative(raizDoProjeto, destinoGerado)}`)
  } else {
    console.log('Modo verificação — nada foi escrito. Use --gerar para escrever o acervo.')
  }
}

async function escrever(acervo) {
  const corpo = Object.entries(acervo)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([chave, midias]) => `  ${JSON.stringify(chave)}: ${JSON.stringify(midias, null, 2).replace(/\n/g, '\n  ')},`)
    .join('\n')

  const conteudo = `/* eslint-disable */
// ARQUIVO GERADO — não edite à mão.
// Origem: scripts/semiologia/curar-acervo.mjs
//
// Mídia clínica real das fontes licenciadas, indexada por \`janela/cena\`.
//
// Está separado dos arquivos de conteúdo (\`vistas.ts\`, \`ultrassom.ts\`) de
// propósito: aqueles são prosa escrita e revisada por gente, e um script que
// reescreve prosa é um script que um dia apaga a revisão de alguém. O gerador
// só toca neste arquivo; o merge acontece em \`acervo.ts\`, na leitura.

import type { MidiaClinica } from './midia'

export const ACERVO_DE_MIDIA: Record<string, MidiaClinica[]> = {
${corpo}
}

/** Quando o acervo foi gerado pela última vez. */
export const GERADO_EM: string | null = ${JSON.stringify(new Date().toISOString().slice(0, 10))}
`
  await writeFile(destinoGerado, conteudo, 'utf8')
}

await main()
