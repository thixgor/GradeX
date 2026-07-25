#!/usr/bin/env node
/*
 * Converte o HTML "bundled" da landing do Manual Clinico (arquivo unico de
 * ~5 MB, com todos os assets em base64 dentro de um <script __bundler/manifest>)
 * na forma que o site serve de verdade: um HTML de texto em public/ldpg-mnclinico.html
 * + os assets soltos em public/ldpg-mnclinico-assets/.
 *
 * Por que isso importa: no formato bundled o HTML real vive dentro de uma string
 * JSON e so existe depois que o JS roda. Nada de preco, titulo ou texto chega ao
 * Google, e o route handler (app/ldpg-mnclinico/route.ts) nao consegue injetar o
 * valor do produto server-side. Desempacotado, o HTML e texto de novo: da pra
 * marcar os pontos de preco e o crawler ve a pagina inteira.
 *
 * Uso (a partir da raiz do repo):
 *   node scripts/unbundle-ldpg-mnclinico.js <bundle.html> [--keep-orphans]
 *
 * O script e re-executavel: sempre que uma nova versao da landing for exportada,
 * rode-o de novo. Ele reinsere os marcadores <!--LDPG_*--> a partir de ancoras
 * do proprio HTML e ABORTA se alguma ancora sumir, para nunca publicar uma pagina
 * com "preco a confirmar" no ar.
 */

const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const ROOT = path.resolve(__dirname, '..')
const OUT_HTML = path.join(ROOT, 'public', 'ldpg-mnclinico.html')
const ASSETS_DIR = path.join(ROOT, 'public', 'ldpg-mnclinico-assets')
const ASSETS_URL = '/ldpg-mnclinico-assets'
const SITE_ORIGIN = 'https://domineaqui.com.br'

const EXT_BY_MIME = {
  'image/webp': '.webp',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/svg+xml': '.svg',
  'image/gif': '.gif',
  'font/woff2': '.woff2',
  'font/woff': '.woff',
  'text/javascript': '.js',
  'application/javascript': '.js',
  'text/css': '.css',
  'audio/mpeg': '.mp3',
  'video/mp4': '.mp4',
}

function fail(message) {
  console.error(`\n[unbundle] ERRO: ${message}\n`)
  process.exit(1)
}

function readBundlerBlock(html, type) {
  const re = new RegExp(`<script type="__bundler/${type}">([\\s\\S]*?)</script>`)
  const match = html.match(re)
  return match ? match[1] : null
}

function decodeAsset(entry) {
  const raw = Buffer.from(entry.data, 'base64')
  return entry.compressed ? zlib.gunzipSync(raw) : raw
}

/** Substitui exatamente uma ocorrencia da ancora; aborta se sumiu ou duplicou. */
function anchorReplace(html, name, anchor, replacement) {
  const first = html.indexOf(anchor)
  if (first < 0) {
    fail(
      `ancora "${name}" nao encontrada no HTML novo.\n` +
      `O layout da landing mudou. Localize o trecho equivalente e atualize a ancora\n` +
      `em scripts/unbundle-ldpg-mnclinico.js antes de publicar.\n\n` +
      `Trecho procurado:\n${anchor}`
    )
  }
  if (html.indexOf(anchor, first + anchor.length) >= 0) {
    fail(`ancora "${name}" aparece mais de uma vez — precisa ser unica para o replace ser seguro.`)
  }
  return html.slice(0, first) + replacement + html.slice(first + anchor.length)
}

// ── Cabecalho: o export nao traz title/description/OG. Sem isso a pagina nao
// indexa nem gera preview decente em link compartilhado. {{LDPG_META_PRICE}} e
// substituido pelo preco real em app/ldpg-mnclinico/route.ts.
function buildHead(runtimeSrc, resourceMap, preloadImages) {
  const preloads = preloadImages
    .map((href, i) => `<link rel="preload" as="image" href="${href}"${i === 0 ? ' fetchpriority="high"' : ''}>`)
    .join('\n')

  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Manual Clínico: o raciocínio clínico na palma da mão + Manual do ECG</title>
<meta name="description" content="Manual Clínico. O raciocínio clínico na palma da mão. Mais de 300 patologias e o Manual do Eletrocardiograma inclusos por apenas {{LDPG_META_PRICE}}.">
<meta name="theme-color" content="#f7f8fa">
<link rel="canonical" href="${SITE_ORIGIN}/ldpg-mnclinico">
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE_ORIGIN}/ldpg-mnclinico">
<meta property="og:site_name" content="DomineAqui">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="Manual Clínico: o raciocínio clínico na palma da mão">
<meta property="og:description" content="Mais de 300 patologias indexadas e o Manual do Eletrocardiograma inclusos. CIDs, fisiopatologia, diagnósticos diferenciais, farmacologia e fluxogramas de tratamento.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Manual Clínico: o raciocínio clínico na palma da mão">
<meta name="twitter:description" content="Mais de 300 patologias indexadas e o Manual do Eletrocardiograma inclusos.">
${preloads}
<!--LDPG_JSONLD_START--><!--LDPG_JSONLD_END-->
<script>window.__resources = ${JSON.stringify(resourceMap).replace(/</g, '\\u003c')};</script>
<script src="${runtimeSrc}"></script>`
}

// ── Marcadores de preco ──────────────────────────────────────────────────────
// O conteudo entre START/END e sempre reescrito pelo route handler (inclusive no
// caminho de fallback, quando o Mongo esta fora). O que fica no arquivo e so um
// texto neutro, sem numero, para nunca publicar um valor desatualizado por engano.

const HERO_MICROCOPY_ANCHOR =
  '<p style="display:flex; align-items:center; gap:8px; font-family:var(--fmono); font-size:0.78rem; color:var(--ink-3); margin-top:18px; letter-spacing:0.03em;"><span style="width:5px; height:5px; border-radius:50%; background:var(--ecg);"></span> Acesso imediato · sem instalar nada</p>'

const HERO_EYEBROW_ANCHOR = '</span> Produto carro-chefe · DomineAqui\n      </div>'

const FINAL_PILL_ANCHOR = `        <div style="display:inline-flex; align-items:center; gap:12px; margin:30px 0 0; padding:12px 20px; background:oklch(100% 0 0 / 0.05); border:1px solid oklch(100% 0 0 / 0.12); border-radius:14px;">
          <span style="font-family:var(--fmono); font-size:0.68rem; font-weight:600; text-transform:uppercase; letter-spacing:0.12em; color:var(--ecg);">Assinatura</span>
          <span style="width:1px; height:22px; background:oklch(100% 0 0 / 0.15);"></span>
          <span style="font-family:var(--fdisplay); font-weight:700; font-size:1.65rem; letter-spacing:-0.02em;">R$ —</span>
          <span style="font-family:var(--fmono); font-size:0.7rem; color:#79838a;">preço a confirmar</span>
        </div>`

function insertPriceMarkers(html) {
  // 1. Preco no hero, logo acima da microcopy "Acesso imediato".
  html = anchorReplace(
    html,
    'hero-microcopy',
    HERO_MICROCOPY_ANCHOR,
    `<!--LDPG_HERO_PRICE_START--><!--LDPG_HERO_PRICE_END-->\n      ${HERO_MICROCOPY_ANCHOR}`
  )

  // 2. Selo de "-X% OFF" na tarja do hero, quando ha lote/cupom ativo.
  html = anchorReplace(
    html,
    'hero-eyebrow',
    HERO_EYEBROW_ANCHOR,
    '</span> Produto carro-chefe · DomineAqui<!--LDPG_PROMO_OFF_START--><!--LDPG_PROMO_OFF_END-->\n      </div>'
  )

  // 3. Pilula de preco do CTA final — e onde o export traz "R$ — / preço a confirmar".
  html = anchorReplace(
    html,
    'final-cta-price',
    FINAL_PILL_ANCHOR,
    `        <div style="display:inline-flex; flex-wrap:wrap; align-items:center; gap:12px; margin:30px 0 0; padding:12px 20px; background:oklch(100% 0 0 / 0.05); border:1px solid oklch(100% 0 0 / 0.12); border-radius:14px;"><!--LDPG_FINAL_PRICE_START-->
          <span style="font-family:var(--fmono); font-size:0.68rem; font-weight:600; text-transform:uppercase; letter-spacing:0.12em; color:var(--ecg);">Assinatura</span>
        <!--LDPG_FINAL_PRICE_END--></div>`
  )

  return html
}

// ─────────────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2)
  const keepOrphans = args.includes('--keep-orphans')
  const input = args.find((a) => !a.startsWith('--'))
  if (!input) fail('informe o caminho do HTML bundled. Ex.: node scripts/unbundle-ldpg-mnclinico.js /tmp/ldpg.html')

  const bundlePath = path.resolve(input)
  if (!fs.existsSync(bundlePath)) fail(`arquivo nao encontrado: ${bundlePath}`)

  const bundle = fs.readFileSync(bundlePath, 'utf8')
  const manifestRaw = readBundlerBlock(bundle, 'manifest')
  const templateRaw = readBundlerBlock(bundle, 'template')
  if (!manifestRaw || !templateRaw) {
    fail('o arquivo nao esta no formato bundled (faltam os <script type="__bundler/...">).')
  }

  const manifest = JSON.parse(manifestRaw)
  const extResources = JSON.parse(readBundlerBlock(bundle, 'ext_resources') || '[]')
  const pageOrder = JSON.parse(readBundlerBlock(bundle, 'page_order') || '[]')
  if (pageOrder.length > 0) {
    fail('este bundle contem paginas aninhadas (iframes). O desempacotador ainda nao cobre esse caso.')
  }

  let template = JSON.parse(templateRaw)

  // 1. Grava cada asset como arquivo e monta o mapa uuid -> URL publica.
  fs.mkdirSync(ASSETS_DIR, { recursive: true })
  const urlByUuid = {}
  const written = new Set()
  for (const [uuid, entry] of Object.entries(manifest)) {
    const ext = EXT_BY_MIME[entry.mime]
    if (!ext) fail(`mime desconhecido "${entry.mime}" no asset ${uuid}. Adicione-o em EXT_BY_MIME.`)
    const filename = `${uuid}${ext}`
    fs.writeFileSync(path.join(ASSETS_DIR, filename), decodeAsset(entry))
    urlByUuid[uuid] = `${ASSETS_URL}/${filename}`
    written.add(filename)
  }

  // 2. Troca os uuids do template pelas URLs dos arquivos.
  for (const [uuid, url] of Object.entries(urlByUuid)) {
    template = template.split(uuid).join(url)
  }

  // 3. React/ReactDOM nao aparecem no HTML: o dc-runtime os procura em
  // window.__resources pela URL do unpkg e so vai a rede se nao achar.
  const resourceMap = {}
  for (const res of extResources) {
    if (urlByUuid[res.uuid]) resourceMap[res.id] = urlByUuid[res.uuid]
  }

  // 4. Links absolutos para o proprio site viram relativos: assim a landing
  // funciona em preview/staging e o clique nao faz um hop cross-origin. Roda
  // ANTES do cabecalho ser injetado — o <link rel="canonical"> precisa continuar
  // absoluto, senao nao serve de canonical pra ninguem.
  template = template.split(`href="${SITE_ORIGIN}/`).join('href="/')
  // Preconnects que sobraram do export: as fontes agora sao locais e o proprio
  // site e same-origin, entao os tres so custam handshake a toa.
  template = template.replace(
    /<link rel="preconnect" href="https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|domineaqui\.com\.br)"[^>]*>\n?/g,
    ''
  )

  // 5. Cabecalho proprio (o export vem sem title/description/OG).
  const runtimeMatch = template.match(/<script src="(\/ldpg-mnclinico-assets\/[^"]+\.js)"><\/script>/)
  if (!runtimeMatch) fail('nao encontrei o <script> do dc-runtime no <head> do template.')

  const heroImage = urlByUuid[Object.keys(manifest).find((u) => manifest[u].mime === 'image/webp')]
  const head = buildHead(runtimeMatch[1], resourceMap, heroImage ? [heroImage] : [])

  const headStart = template.indexOf('<head>')
  const headEnd = template.indexOf('</head>')
  if (headStart < 0 || headEnd < 0) fail('template sem <head>.')
  template = template.slice(0, headStart + '<head>'.length) + '\n' + head + '\n' + template.slice(headEnd)

  // 6. <html> sem lang atrapalha leitor de tela e SEO em pt-BR.
  template = template.replace(/<html(\s[^>]*)?>/i, '<html lang="pt-BR">')

  // 7. Marcadores de preco.
  template = insertPriceMarkers(template)

  fs.writeFileSync(OUT_HTML, template, 'utf8')

  // 8. Assets da versao anterior que ninguem mais referencia.
  const orphans = fs.readdirSync(ASSETS_DIR).filter((f) => !written.has(f))
  if (orphans.length > 0) {
    if (keepOrphans) {
      console.log(`[unbundle] ${orphans.length} asset(s) orfao(s) mantido(s) (--keep-orphans).`)
    } else {
      for (const f of orphans) fs.unlinkSync(path.join(ASSETS_DIR, f))
      console.log(`[unbundle] ${orphans.length} asset(s) orfao(s) da versao anterior removido(s).`)
    }
  }

  const kb = (n) => `${(n / 1024).toFixed(1)} KB`
  console.log(`[unbundle] HTML:   ${path.relative(ROOT, OUT_HTML)} (${kb(Buffer.byteLength(template))}, era ${kb(Buffer.byteLength(bundle))})`)
  console.log(`[unbundle] Assets: ${written.size} arquivo(s) em ${path.relative(ROOT, ASSETS_DIR)}`)
  console.log('[unbundle] Marcadores de preco inseridos: HERO_PRICE, PROMO_OFF, FINAL_PRICE, JSONLD, META_PRICE.')
}

main()
