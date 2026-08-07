/**
 * Pipeline de ingestão do Manual da Histologia.
 *
 *   node --experimental-strip-types scripts/histologia/construir-dados.mjs
 *
 * Lê o acervo normalizado em `public/Manual-Histologia/dados/` (52 MB de JSONL,
 * que **não** vão para o deploy) e escreve derivados enxutos em `data/histologia/`.
 *
 * Três decisões que valem explicação:
 *
 * 1. **Fragmentação por subsetor.** As 1.524 páginas viram 21 fragmentos, um por
 *    subsetor de nível 2. Um único arquivo com tudo obrigaria o servidor a
 *    carregar 15 MB para renderizar uma lâmina; um arquivo por página geraria
 *    1.320 módulos que o file-tracing da Vercel não consegue seguir por caminho
 *    dinâmico. O fragmento por subsetor fica entre 200 KB e 900 KB e é
 *    endereçado por um mapa estático de `import()`.
 *
 * 2. **Slugs próprios.** `_rota_sugerida` do acervo tem 1.248 valores para 1.524
 *    páginas — 37 grupos colidem — e trunca os segmentos em 18 caracteres. Aqui
 *    os slugs nascem de `caminho_setorial`, com desambiguação determinística.
 *
 * 3. **Mídia por SHA-256, nunca por caminho.** 9.500 referências apontam para
 *    9.175 objetos distintos; o hash é a chave, e a deduplicação acontece de
 *    graça. O arquivo em si nunca entra no repositório nem no deploy.
 *
 * O script é idempotente e termina imprimindo a conciliação. Se qualquer
 * contador divergir do acervo, ele sai com código 1 — dado que não fecha não
 * vira interface.
 */

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import {
  chaveDeBusca,
  criarDesambiguador,
  slugificar,
  textoDeHtml,
} from '../../lib/histologia/texto.ts'
import {
  COLORACOES,
  classificarMarcador,
  traduzirTermo,
} from '../../lib/histologia/glossario.ts'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const dirAcervo = path.join(raiz, 'public/Manual-Histologia')
const dirDados = path.join(dirAcervo, 'dados')
const dirSaida = path.join(raiz, 'data/histologia')

const ACESSADO_EM = '2026-08-07'
const LICENCA = 'CC BY-NC-SA 4.0'

/* ────────────────────────── utilidades ────────────────────────── */

async function lerJsonl(arquivo) {
  const bruto = await readFile(path.join(dirDados, arquivo), 'utf8')
  return bruto
    .split('\n')
    .filter((l) => l.trim().length > 0)
    .map((l) => JSON.parse(l))
}


/** Escreve JSON com quebra de linha final, criando o diretório se preciso. */
async function escrever(destino, dados) {
  await mkdir(path.dirname(destino), { recursive: true })
  await writeFile(destino, `${JSON.stringify(dados)}\n`, 'utf8')
  return Buffer.byteLength(JSON.stringify(dados))
}

/* ────────────────────────── carga ────────────────────────── */

console.log('Lendo acervo normalizado…')
const [paginasBrutas, midiaBruta, quizzesBrutos, planoBruto] = await Promise.all([
  lerJsonl('paginas.jsonl'),
  lerJsonl('midia.jsonl'),
  lerJsonl('quizzes.jsonl'),
  lerJsonl('plano-assets-blob.jsonl'),
])

/**
 * Índice de assets por SHA-256. É a tabela que o resolver de mídia consulta em
 * tempo de execução para montar a URL de CDN.
 */
/**
 * Manifesto de derivadas, quando existe.
 *
 * `scripts/histologia/recomprimir-acervo.mjs` converte o acervo para WebP com
 * qualidade escalonada por camada, para caber no limite de armazenamento do
 * plano. O **SHA-256 continua sendo o do arquivo original** — ele identifica a
 * fonte e sustenta a proveniência; o que muda é a extensão e o tamanho do que
 * de fato é servido. Sem o manifesto, o pipeline usa os arquivos originais.
 */
let derivadas = {}
try {
  derivadas = JSON.parse(
    await readFile(path.join(dirAcervo, 'dados/manifesto-derivadas.json'), 'utf8'),
  )
} catch {
  /* sem recompressão: serve o acervo original */
}

/**
 * Guarda contra a regeneração silenciosamente errada.
 *
 * O manifesto é artefato gerado e não é versionado. Sem esta checagem, quem
 * clonasse o repositório e rodasse o pipeline produziria `ext: 'jpg'` para
 * imagens que no CDN só existem como `.webp` — e o resultado seria um atlas
 * inteiro de imagens quebradas, sem nenhum erro em tempo de build. Falhar aqui
 * é a diferença entre um erro de 30 segundos e um site quebrado em produção.
 */
if (Object.keys(derivadas).length === 0) {
  const anterior = await readFile(
    path.join(dirSaida, 'relatorio.json'),
    'utf8',
  ).catch(() => null)
  if (anterior && JSON.parse(anterior).formatoServido === 'webp') {
    console.error(
      '✘ Os dados versionados foram gerados a partir de derivadas WebP, mas\n' +
        '  dados/manifesto-derivadas.json não existe nesta máquina.\n' +
        '\n' +
        '  Regenerar agora produziria URLs .jpg/.png contra um CDN que só tem\n' +
        '  .webp — o atlas inteiro ficaria com imagens quebradas.\n' +
        '\n' +
        '  Rode antes:\n' +
        '    git lfs pull --exclude="*.h5p"\n' +
        '    npm install --no-save sharp\n' +
        '    node scripts/histologia/recomprimir-acervo.mjs\n',
    )
    process.exit(1)
  }
}

/**
 * Assets que a origem declara como imagem mas não são.
 *
 * Um deles existe: 29 KB de HTML salvos com extensão `.png` pelo scraper
 * original, referenciados por 8 lâminas. Publicá-lo poria um marcador quebrado
 * em todas elas. Descartar é a única saída honesta — e o descarte é contado no
 * relatório, para os números continuarem fechando com o acervo.
 */
let assetsInvalidos = {}
try {
  assetsInvalidos = JSON.parse(
    await readFile(path.join(dirAcervo, 'dados/assets-invalidos.json'), 'utf8'),
  )
} catch {
  /* nenhum inválido conhecido */
}

let overlaysDescartados = 0
let basesDescartadas = 0
let imagensDeQuizDescartadas = 0

const assetsPorSha = new Map()
for (const item of planoBruto) {
  const derivada = derivadas[item.sha256]
  assetsPorSha.set(item.sha256, {
    sha256: item.sha256,
    bytes: derivada?.bytes ?? item.bytes,
    mime: derivada?.mime ?? item.mime,
    // A extensão vem do nome do arquivo, nunca do MIME: 2 imagens são `.jpeg`
    // (e não `.jpg`) e os 19 pacotes H5P chegam como `application/octet-stream`.
    // Derivar do MIME produziria 21 URLs de CDN quebradas.
    ext: derivada?.ext ?? path.extname(item.arquivoLocal).slice(1).toLowerCase(),
    blobPath: item.blobPath,
  })
}
if (Object.keys(derivadas).length > 0) {
  console.log(`Manifesto de derivadas: ${Object.keys(derivadas).length} assets servidos em WebP.`)
}

/**
 * Do arquivo local para o hash. `midia.jsonl` referencia arquivos por caminho
 * relativo dentro de cada página; é esse mapa que fecha a ponte entre a página
 * e o objeto deduplicado.
 */
const shaPorArquivoLocal = new Map()
const urlOrigemPorSha = new Map()
for (const m of midiaBruta) {
  shaPorArquivoLocal.set(m.arquivo_local, m.sha256)
  if (!urlOrigemPorSha.has(m.sha256)) urlOrigemPorSha.set(m.sha256, m.url_origem_arquivo)
}

/** `midia.jsonl` usa caminho absoluto no acervo; a página usa caminho relativo. */
function localizarSha(diretorioDaPagina, arquivoRelativo) {
  const completo = `${diretorioDaPagina}/${arquivoRelativo}`.replace(/\\/g, '/')
  return shaPorArquivoLocal.get(completo) ?? null
}

/* ────────────────────────── slugs ────────────────────────── */

/**
 * Constrói o slug de cada página a partir de `caminho_setorial`.
 *
 * A desambiguação é feita por escopo (irmãos do mesmo pai) e não globalmente:
 * duas páginas "Overview" em setores diferentes podem manter o slug limpo, e só
 * colisões reais dentro do mesmo nível ganham sufixo.
 */
const desambiguadoresPorPai = new Map()
const caminhoPorPagina = new Map()
const nosPorChave = new Map()

function registrarNo(caminhoSetorial) {
  const chave = caminhoSetorial.join(' > ')
  const existente = nosPorChave.get(chave)
  if (existente) return existente

  const pai =
    caminhoSetorial.length > 1 ? registrarNo(caminhoSetorial.slice(0, -1)) : null
  const escopo = pai ? pai.caminho.join('/') : ''
  if (!desambiguadoresPorPai.has(escopo)) {
    desambiguadoresPorPai.set(escopo, criarDesambiguador())
  }
  const unico = desambiguadoresPorPai.get(escopo)
  const slug = unico(slugificar(caminhoSetorial[caminhoSetorial.length - 1]))

  const no = {
    slug,
    caminho: pai ? [...pai.caminho, slug] : [slug],
    titulo: caminhoSetorial[caminhoSetorial.length - 1],
    setorial: caminhoSetorial,
    pai,
    filhos: [],
    pagina: null,
  }
  if (pai) pai.filhos.push(no)
  nosPorChave.set(chave, no)
  return no
}

/**
 * Cria um nó irmão para uma página cujo `caminho_setorial` já está ocupado.
 *
 * Acontece uma vez no acervo: "Brunner's glands" e "Submucosal plexus" são
 * páginas distintas que caíram ambas em "Small intestine 16" (o segundo tinha
 * slug `-16-2` na origem). Em vez de sufixar a URL com um número sem
 * significado, o nó novo é nomeado pelo título da própria página — que é o que
 * realmente distingue as duas.
 */
function registrarIrmao(noOcupado, pagina) {
  const pai = noOcupado.pai
  const escopo = pai ? pai.caminho.join('/') : ''
  const unico = desambiguadoresPorPai.get(escopo) ?? criarDesambiguador()
  desambiguadoresPorPai.set(escopo, unico)
  const slug = unico(slugificar(pagina.titulo))
  const no = {
    slug,
    caminho: pai ? [...pai.caminho, slug] : [slug],
    titulo: pagina.titulo,
    setorial: [...noOcupado.setorial.slice(0, -1), pagina.titulo],
    pai,
    filhos: [],
    pagina: null,
  }
  if (pai) pai.filhos.push(no)
  return no
}

// A ordem de registro define quem fica com o slug limpo, então precisa ser a
// ordem do catálogo — que é estável entre execuções.
for (const p of paginasBrutas) {
  let no = registrarNo(p.caminho_setorial)
  if (no.reservado) no = registrarIrmao(no, p)
  no.reservado = true
  caminhoPorPagina.set(p.id, no)
}

const raizesDoCurriculo = [...nosPorChave.values()].filter((n) => n.caminho.length === 1)

/* ────────────────────────── conversão de página ────────────────────────── */

const divergencias = []

/** Corta uma chave já normalizada na última fronteira de palavra que couber. */
function recortarChave(chave, maximo) {
  if (chave.length <= maximo) return chave
  return chave.slice(0, maximo).replace(/\s+\S*$/, '').trim()
}

function detectarColoracoes(texto) {
  const alvo = chaveDeBusca(texto)
  const achadas = []
  for (const c of COLORACOES) {
    if (c.padroes.some((p) => alvo.includes(chaveDeBusca(p)))) achadas.push(c.id)
  }
  return achadas
}

/**
 * Texto alternativo da imagem-base.
 *
 * Deliberadamente construído a partir de título e trilha, e não da `legenda_ia`
 * do acervo: aquela legenda tem 600 caracteres, repete a licença em toda imagem
 * e foi escrita sem acentuação. Um leitor de tela leria isso inteiro antes de
 * chegar ao conteúdo.
 */
function altDaBase(pagina, trilhaLegivel) {
  return `Fotomicrografia de ${pagina.titulo} — ${trilhaLegivel}.`
}

function altDoOverlay(rotulo, titulo) {
  return `Camada de marcação destacando ${rotulo} em ${titulo}.`
}

function montarMidia(sha, alt, extras = {}) {
  if (assetsInvalidos[sha]) return null
  const asset = assetsPorSha.get(sha)
  if (!asset) {
    divergencias.push(`Asset sem entrada no plano de blob: ${sha}`)
    return null
  }
  return {
    sha256: asset.sha256,
    bytes: asset.bytes,
    mime: asset.mime,
    ext: asset.ext,
    urlOrigem: urlOrigemPorSha.get(sha) ?? '',
    alt,
    ...extras,
  }
}

const paginasConvertidas = []
const entradasDeBusca = []

for (const bruta of paginasBrutas) {
  const no = caminhoPorPagina.get(bruta.id)
  const diretorio = path.posix.dirname(bruta._arquivo.replace(/\\/g, '/'))
  const trilhaLegivel = no.setorial.join(' › ')

  const ehLamina = bruta.bases.length > 0 || bruta.marcadores.length > 0

  /* ── base ── */
  let base = null
  if (bruta.bases.length > 0) {
    const b = bruta.bases[0]
    const sha = localizarSha(diretorio, b.arquivo)
    if (!sha) divergencias.push(`Imagem-base sem hash: ${diretorio}/${b.arquivo}`)
    else {
      base = montarMidia(sha, altDaBase(bruta, trilhaLegivel))
      if (!base && assetsInvalidos[sha]) basesDescartadas++
    }
  }
  if (bruta.bases.length > 1) {
    divergencias.push(`Página com mais de uma base (não previsto): ${bruta.id}`)
  }

  /* ── overlays ── */
  const overlays = []
  const usadosNoEscopo = criarDesambiguador()
  for (const m of bruta.marcadores) {
    const sha = localizarSha(diretorio, m.arquivo)
    if (!sha) {
      divergencias.push(`Marcador sem hash: ${diretorio}/${m.arquivo}`)
      continue
    }
    const rotuloOriginal = (m.rotulo ?? '').trim() || `Marcador ${m.ordem}`
    const classe = classificarMarcador(rotuloOriginal)
    const traduzido = traduzirTermo(rotuloOriginal)
    const midia = montarMidia(sha, altDoOverlay(traduzido ?? rotuloOriginal, bruta.titulo))
    if (!midia) {
      if (assetsInvalidos[sha]) overlaysDescartados++
      continue
    }

    overlays.push({
      id: usadosNoEscopo(slugificar(rotuloOriginal, 48)),
      ordem: m.ordem,
      rotulo: traduzido ?? rotuloOriginal,
      rotuloOriginal,
      // `traduzido === null` sinaliza à interface que o termo segue no original.
      traduzido: traduzido !== null,
      classe,
      explicacaoOriginal: (m.explicacao_original ?? '').trim() || undefined,
      midia,
    })
  }

  const textoParaColoracao = [
    bruta.descricao_original,
    ...bruta.marcadores.map((m) => m.explicacao_original ?? ''),
  ].join(' ')

  const pagina = {
    slug: no.slug,
    caminho: no.caminho,
    trilha: no.caminho.map((_, i) => ({
      slug: no.caminho.slice(0, i + 1).join('/'),
      titulo: no.setorial[i],
    })),
    titulo: bruta.titulo,
    tituloOriginal: bruta.titulo_wordpress || bruta.titulo,
    tipo: ehLamina ? 'lamina' : 'secao',
    setor: no.setorial[0],
    descricaoOriginal: bruta.descricao_original ?? '',
    base,
    overlays,
    // `calibracao` fica deliberadamente ausente: o acervo não traz µm/px, e
    // derivar a escala do objetivo nominal produziria medida falsa.
    dossie: {},
    revisao: { estado: 'pendente-de-revisao', historico: [] },
    creditos: (bruta.creditos_identificados ?? []).map((texto) => ({
      texto,
      origem: 'acervo',
    })),
    proveniencia: {
      urlOrigem: bruta.url_origem,
      acessadoEm: ACESSADO_EM,
      idOrigem: bruta.id,
      arquivoOrigem: bruta._arquivo,
      licenca: LICENCA,
    },
    coloracoes: detectarColoracoes(textoParaColoracao),
    quizzes: [],
  }

  no.pagina = pagina
  paginasConvertidas.push(pagina)

  /* ── entradas de busca ── */
  const url = no.caminho.join('/')
  entradasDeBusca.push({
    t: ehLamina ? 'l' : 's',
    u: url,
    n: bruta.titulo,
    b: trilhaLegivel,
    // Cortamos a chave em 400 caracteres para o índice não inchar com
    // descrições longas — mas cortando na fronteira de palavra e renormalizando
    // depois, senão sobra um espaço à direita (ou meia palavra) e a chave deixa
    // de ser idempotente sob `chaveDeBusca`.
    k: recortarChave(
      chaveDeBusca(
        [bruta.titulo, bruta.titulo_wordpress, trilhaLegivel, bruta.descricao_original].join(' '),
      ),
      400,
    ),
    ...(base ? { m: base.sha256 } : {}),
  })
  for (const ov of overlays) {
    if (ov.classe !== 'estrutura') continue
    entradasDeBusca.push({
      t: 'e',
      u: url,
      n: ov.rotulo,
      b: `${bruta.titulo} · ${trilhaLegivel}`,
      k: chaveDeBusca(`${ov.rotulo} ${ov.rotuloOriginal}`),
      o: ov.id,
      ...(base ? { m: base.sha256 } : {}),
    })
  }
}

/* ────────────────────────── quizzes ────────────────────────── */

const slugQuiz = criarDesambiguador()
const quizzesConvertidos = []

/**
 * Dois quizzes chegam com título truncado na origem — "Revestimento" e
 * "Glândulas Exócrinas" perderam o assunto ao serem cortados de "Epithelial
 * tissues - Lining and covering" e "- Exocrine glands". Renomear é decisão
 * editorial, registrada aqui em vez de escondida numa string da interface.
 */
const TITULO_EDITORIAL_DE_QUIZ = {
  'Revestimento': 'Epitélios de revestimento',
  'Glândulas Exócrinas': 'Epitélios glandulares exócrinos',
}

for (const bruto of quizzesBrutos) {
  const diretorio = path.posix.dirname(bruto._arquivo.replace(/\\/g, '/'))
  const titulo = TITULO_EDITORIAL_DE_QUIZ[bruto.titulo] ?? bruto.titulo
  const slug = slugQuiz(slugificar(titulo))
  const questoes = []

  bruto.questoes.forEach((q, indice) => {
    const sha = q.imagem ? localizarSha(diretorio, q.imagem) : null
    if (q.imagem && !sha) divergencias.push(`Imagem de quiz sem hash: ${diretorio}/${q.imagem}`)

    const originalH5p = bruto.json_h5p_original?.questions?.[indice]?.params
    const arquivoH5p = originalH5p?.media?.params?.file

    const alternativas = q.alternativas.map((a, i) => ({
      id: `a${i + 1}`,
      texto: textoDeHtml(a.texto),
      correta: !!a.correta,
      feedback: textoDeHtml(a.feedback ?? ''),
    }))

    if (!alternativas.some((a) => a.correta)) {
      divergencias.push(`Questão sem gabarito: ${bruto.titulo} #${q.numero}`)
      return
    }

    questoes.push({
      id: `q${q.numero}`,
      numero: q.numero,
      // O enunciado do acervo está em inglês. Não traduzimos automaticamente:
      // a interface mostra o original com tarja de pendência editorial.
      enunciado: textoDeHtml(q.enunciado),
      enunciadoOriginal: textoDeHtml(q.enunciado),
      midia: sha
        ? (assetsInvalidos[sha] && ++imagensDeQuizDescartadas, montarMidia(
            sha,
            // Alt que não entrega a resposta: descreve o *tipo* de imagem e o
            // que se pede, jamais a estrutura perguntada.
            `Imagem da questão ${q.numero} do quiz ${titulo}. Fotomicrografia para identificação; a descrição detalhada revelaria a resposta.`,
            arquivoH5p?.width && arquivoH5p?.height
              ? { largura: arquivoH5p.width, altura: arquivoH5p.height }
              : {},
          ))
        : null,
      alternativas,
      multipla: alternativas.filter((a) => a.correta).length > 1,
    })
  })

  quizzesConvertidos.push({
    slug,
    titulo,
    tituloOriginal: bruto.titulo_original,
    idOrigem: bruto.id_pagina,
    idH5p: String(bruto.id_h5p),
    questoes,
    proveniencia: {
      urlOrigem: bruto.url_origem,
      acessadoEm: ACESSADO_EM,
      idOrigem: bruto.id_pagina,
      arquivoOrigem: bruto._arquivo,
      licenca: LICENCA,
    },
    revisao: { estado: 'pendente-de-revisao', historico: [] },
    percentualAprovacao: bruto.json_h5p_original?.passPercentage ?? 50,
  })

  entradasDeBusca.push({
    t: 'q',
    u: `quizzes/${slug}`,
    n: `Quiz: ${titulo}`,
    b: 'Quizzes',
    k: chaveDeBusca(`${titulo} ${bruto.titulo} ${bruto.titulo_original} quiz`),
  })
}

/**
 * Liga cada quiz aos assuntos que ele cobre.
 *
 * O acervo não declara essa relação, então usamos o único sinal confiável: o
 * título do quiz contra o título dos subsetores. Quando não há correspondência
 * clara, a lâmina simplesmente não anuncia quiz — melhor do que sugerir uma
 * avaliação que não é sobre aquilo.
 */
const subsetores = raizesDoCurriculo.flatMap((r) => r.filhos)
for (const quiz of quizzesConvertidos) {
  const alvo = chaveDeBusca(quiz.titulo)
  for (const sub of subsetores) {
    const chaveSub = chaveDeBusca(sub.titulo)
    if (!chaveSub.includes(alvo) && !alvo.includes(chaveSub)) continue
    const marcar = (no) => {
      if (no.pagina && !no.pagina.quizzes.includes(quiz.slug)) no.pagina.quizzes.push(quiz.slug)
      no.filhos.forEach(marcar)
    }
    marcar(sub)
  }
}

/* ────────────────────────── currículo ────────────────────────── */

function resumirNo(no) {
  const filhos = no.filhos.map(resumirNo)
  const proprias = no.pagina?.tipo === 'lamina' ? 1 : 0
  const estruturasProprias =
    no.pagina?.overlays.filter((o) => o.classe === 'estrutura').length ?? 0
  return {
    slug: no.slug,
    caminho: no.caminho,
    titulo: no.titulo,
    tipo: no.pagina?.tipo ?? 'secao',
    laminas: proprias + filhos.reduce((n, f) => n + f.laminas, 0),
    estruturas: estruturasProprias + filhos.reduce((n, f) => n + f.estruturas, 0),
    filhos,
  }
}

const curriculo = raizesDoCurriculo.map(resumirNo)

/* ────────────────────────── fragmentos ────────────────────────── */

/**
 * Fragmenta por subsetor (nível 2). Páginas de nível 1 — as quatro landings de
 * setor — vão para um fragmento próprio, `_setores`, porque não têm subsetor
 * ao qual pertencer.
 */
const fragmentos = new Map()
for (const pagina of paginasConvertidas) {
  const chave = pagina.caminho.length >= 2 ? pagina.caminho.slice(0, 2).join('__') : '_setores'
  if (!fragmentos.has(chave)) fragmentos.set(chave, {})
  fragmentos.get(chave)[pagina.caminho.join('/')] = pagina
}

console.log('Escrevendo derivados…')
await rm(dirSaida, { recursive: true, force: true })

let bytesFragmentos = 0
for (const [chave, conteudo] of fragmentos) {
  bytesFragmentos += await escrever(path.join(dirSaida, 'paginas', `${chave}.json`), conteudo)
}

// Mapa estático de fragmentos: é ele que permite ao Next rastrear os módulos.
const listaFragmentos = [...fragmentos.keys()].sort()
await escrever(path.join(dirSaida, 'fragmentos.json'), listaFragmentos)

await escrever(path.join(dirSaida, 'curriculo.json'), curriculo)

// Duas fatias do mesmo índice, por uma razão de peso:
//  - `busca-cliente` só tem lâminas e seções (1.524 entradas, sem a descrição
//    no campo de chave) e é buscado sob demanda no navegador: dá resposta
//    instantânea enquanto se digita, sem custar 370 KB comprimidos;
//  - `busca-servidor` tem tudo, inclusive os 7.453 rótulos de estrutura, e só
//    é lido pela rota de API. Mandar isso ao cliente inviabilizaria o 3G.
const buscaCliente = entradasDeBusca
  .filter((e) => e.t !== 'e')
  .map((e) => ({ ...e, k: chaveDeBusca(`${e.n} ${e.b}`) }))
await escrever(path.join(dirSaida, 'busca-cliente.json'), buscaCliente)
await escrever(path.join(dirSaida, 'busca-servidor.json'), entradasDeBusca)

for (const quiz of quizzesConvertidos) {
  await escrever(path.join(dirSaida, 'quizzes', `${quiz.slug}.json`), quiz)
}
await escrever(
  path.join(dirSaida, 'quizzes.json'),
  quizzesConvertidos.map((q) => ({
    slug: q.slug,
    titulo: q.titulo,
    tituloOriginal: q.tituloOriginal,
    questoes: q.questoes.length,
    comImagem: q.questoes.filter((q2) => q2.midia).length,
  })),
)

/**
 * Gera o módulo de carregadores.
 *
 * O mapa precisa ser literal para o rastreamento de arquivos da Vercel enxergar
 * cada `import()` e empacotar os fragmentos como chunks. Literal e à mão
 * dessincronizaria no primeiro fragmento novo; literal e gerado, não.
 */
const linhasFragmento = listaFragmentos
  .map((k) => `  ${JSON.stringify(k)}: () => import('@/data/histologia/paginas/${k}.json'),`)
  .join('\n')
const linhasQuiz = quizzesConvertidos
  .map((q) => `  ${JSON.stringify(q.slug)}: () => import('@/data/histologia/quizzes/${q.slug}.json'),`)
  .join('\n')

await mkdir(path.join(raiz, 'lib/histologia'), { recursive: true })
await writeFile(
  path.join(raiz, 'lib/histologia/carregadores.gerado.ts'),
  `/* eslint-disable */
// ARQUIVO GERADO — não edite à mão.
// Origem: scripts/histologia/construir-dados.mjs
//
// Mapa literal de \`import()\` por fragmento e por quiz. É literal porque o
// rastreamento de arquivos da Vercel precisa enxergar cada especificador para
// incluir o JSON no bundle da função; um \`import()\` com caminho montado em
// variável funciona em desenvolvimento e devolve 404 em produção.
//
// Os carregadores são tipados como \`unknown\`: o TypeScript infere dos JSON os
// tipos literais (\`tipo: string\` em vez de \`'lamina' | 'secao'\`, por exemplo) e
// afirmar a forma aqui só produziria um \`as\` por linha. A garantia real vem de
// \`__tests__/histologia/dados.test.ts\`, que valida cada fragmento contra o
// schema Zod — verificação de valor, não de sintaxe.
type Carregador = () => Promise<{ default: unknown }>

export const FRAGMENTOS: Record<string, Carregador> = {
${linhasFragmento}
}

export const QUIZZES: Record<string, Carregador> = {
${linhasQuiz}
}
`,
  'utf8',
)

// Fixture que trava a paridade entre a normalização do build e a do aplicativo.
await escrever(
  path.join(dirSaida, 'fixture-normalizacao.json'),
  ['Órgãos e Sistemas', 'H&E — Cólon', 'Lâmina própria', 'Bowman\'s space', 'CN VIII'].map((v) => ({
    entrada: v,
    chave: chaveDeBusca(v),
    slug: slugificar(v),
  })),
)

/* ────────────────────────── conciliação ────────────────────────── */

const laminas = paginasConvertidas.filter((p) => p.tipo === 'lamina').length
const secoes = paginasConvertidas.filter((p) => p.tipo === 'secao').length
const totalOverlays = paginasConvertidas.reduce((n, p) => n + p.overlays.length, 0)
const totalBases = paginasConvertidas.filter((p) => p.base).length
const imagensDeQuiz = quizzesConvertidos.reduce(
  (n, q) => n + q.questoes.filter((x) => x.midia).length,
  0,
)
const totalQuestoes = quizzesConvertidos.reduce((n, q) => n + q.questoes.length, 0)
const pacotesH5p = midiaBruta.filter((m) => m.tipo === 'pacote-h5p').length
// Dois totais distintos, que não devem ser confundidos:
//  - `bytesUnicos` é o tamanho do acervo ORIGINAL, e é o que se compara com o
//    número anunciado no README;
//  - `bytesServidos` é o que de fato vai ao CDN depois da recompressão.
const bytesUnicos = planoBruto.reduce((n, a) => n + a.bytes, 0)
// Só conta o que o CDN de fato recebe: fora os 19 pacotes H5P (prova de origem,
// nunca servidos) e os assets recusados por não serem imagem.
const bytesServidos = planoBruto
  .filter((a) => a.tipo !== 'pacote-h5p' && !assetsInvalidos[a.sha256])
  .reduce((n, a) => n + (assetsPorSha.get(a.sha256)?.bytes ?? a.bytes), 0)

const esperado = {
  paginas: 1524,
  imagensBase: 1318,
  overlays: 7775,
  imagensDeQuiz: 388,
  pacotesH5p: 19,
  quizzes: 19,
  questoes: 388,
  referenciasDeArquivo: 9500,
  assetsUnicos: 9175,
}
// Os contadores comparam com o acervo somando o que foi mantido e o que foi
// descartado por ser inválido: descartar em silêncio faria os números "baterem"
// escondendo perda de conteúdo.
const obtido = {
  paginas: paginasConvertidas.length,
  imagensBase: totalBases + basesDescartadas,
  overlays: totalOverlays + overlaysDescartados,
  imagensDeQuiz: imagensDeQuiz + imagensDeQuizDescartadas,
  pacotesH5p,
  quizzes: quizzesConvertidos.length,
  questoes: totalQuestoes,
  referenciasDeArquivo: midiaBruta.length,
  assetsUnicos: assetsPorSha.size,
}
for (const [chave, valor] of Object.entries(esperado)) {
  if (obtido[chave] !== valor) {
    divergencias.push(`Contador "${chave}": esperado ${valor}, obtido ${obtido[chave]}.`)
  }
}

// Unicidade de rota — a razão pela qual descartamos `_rota_sugerida`.
const rotas = new Set()
for (const p of paginasConvertidas) {
  const r = p.caminho.join('/')
  if (rotas.has(r)) divergencias.push(`Rota duplicada: ${r}`)
  rotas.add(r)
}

/**
 * O README do pacote anuncia "2.792.828.927 bytes únicos". Esse número não
 * corresponde nem à soma dos objetos deduplicados (2.750.855.677) nem à soma de
 * todas as referências (2.811.077.750) — fica entre as duas. Registramos a
 * divergência em vez de escolher um valor que feche: os outros nove contadores
 * conciliam exatamente, então o dado suspeito é esse, e apagá-lo do relatório
 * seria esconder o único ponto que não bate.
 */
const notas = []
const bytesDeTodasAsReferencias = midiaBruta.reduce((n, m) => n + m.bytes, 0)
if (bytesUnicos !== 2792828927) {
  notas.push(
    `O README anuncia 2.792.828.927 bytes únicos; a soma dos ${assetsPorSha.size} objetos ` +
      `deduplicados dá ${bytesUnicos} e a soma das ${midiaBruta.length} referências dá ` +
      `${bytesDeTodasAsReferencias}. Nenhuma das duas bate com o anunciado.`,
  )
}

const relatorio = {
  geradoEm: new Date().toISOString().slice(0, 10),
  paginas: paginasConvertidas.length,
  laminas,
  secoes,
  imagensBase: totalBases,
  overlays: totalOverlays,
  imagensDeQuiz,
  pacotesH5p,
  quizzes: quizzesConvertidos.length,
  questoes: totalQuestoes,
  referenciasDeArquivo: midiaBruta.length,
  assetsUnicos: assetsPorSha.size,
  bytesUnicos,
  /** Tamanho efetivamente publicado no CDN, depois da recompressão. */
  bytesServidos,
  entradasDeBusca: entradasDeBusca.length,
  fragmentos: fragmentos.size,
  /** Formato efetivamente servido pelo CDN. Consultado pela guarda acima. */
  formatoServido: Object.keys(derivadas).length > 0 ? 'webp' : 'original',
  /** Referências descartadas por o arquivo de origem não ser uma imagem. */
  descartados: {
    assets: Object.keys(assetsInvalidos).length,
    bases: basesDescartadas,
    overlays: overlaysDescartados,
    imagensDeQuiz: imagensDeQuizDescartadas,
  },
  divergencias,
  notas,
}
await escrever(path.join(dirSaida, 'relatorio.json'), relatorio)

const traduzidos = paginasConvertidas.reduce(
  (n, p) => n + p.overlays.filter((o) => o.traduzido).length,
  0,
)

console.log('')
console.log('── Conciliação ──')
for (const [chave, valor] of Object.entries(obtido)) {
  const alvo = esperado[chave]
  console.log(`  ${chave.padEnd(22)} ${String(valor).padStart(6)}  ${valor === alvo ? '✔' : `✘ (esperado ${alvo})`}`)
}
console.log(`  ${'lâminas'.padEnd(22)} ${String(laminas).padStart(6)}`)
console.log(`  ${'seções (índice)'.padEnd(22)} ${String(secoes).padStart(6)}`)
console.log(`  ${'entradas de busca'.padEnd(22)} ${String(entradasDeBusca.length).padStart(6)}`)
console.log(`  ${'fragmentos'.padEnd(22)} ${String(fragmentos.size).padStart(6)}  (${(bytesFragmentos / 1e6).toFixed(1)} MB)`)
console.log(
  `  ${'bytes originais'.padEnd(22)}${(bytesUnicos / 2 ** 30).toFixed(2).padStart(6)} GiB`,
)
console.log(
  `  ${'bytes no CDN'.padEnd(22)}${(bytesServidos / 2 ** 30).toFixed(2).padStart(6)} GiB` +
    `  (WebP, sem H5P)`,
)
console.log(
  `  ${'rótulos traduzidos'.padEnd(22)} ${String(traduzidos).padStart(6)}  de ${totalOverlays} (${((100 * traduzidos) / totalOverlays).toFixed(1)}%)`,
)
console.log('')

if (Object.keys(assetsInvalidos).length > 0) {
  notas.push(
    `${Object.keys(assetsInvalidos).length} asset(s) da origem não são imagem e foram ` +
      `descartados, removendo ${overlaysDescartados} overlay(s), ${basesDescartadas} base(s) e ` +
      `${imagensDeQuizDescartadas} imagem(ns) de quiz. Ver dados/assets-invalidos.json.`,
  )
}
for (const nota of notas) console.log(`  nota: ${nota}`)
if (notas.length > 0) console.log('')

if (divergencias.length > 0) {
  console.error(`✘ ${divergencias.length} divergência(s):`)
  for (const d of divergencias.slice(0, 30)) console.error(`   - ${d}`)
  if (divergencias.length > 30) console.error(`   … e mais ${divergencias.length - 30}.`)
  process.exit(1)
}

console.log('✔ Acervo conciliado. Derivados em data/histologia/.')
