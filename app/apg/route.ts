import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SITE = 'https://domineaqui.com.br'
const OG_IMAGE = 'https://i.imgur.com/hvh7Sek.png'

type Meta = { title: string; description: string; canonical: string }

const GLOBAL_META: Meta = {
  title: 'Cadernos de APG | DomineAqui',
  description:
    'Todas as APGs do seu período em um caderno só, na ordem do PBL. Cada objetivo aberto, aprofundado e integrado, pronto pra tutoria e pra prova.',
  canonical: `${SITE}/apg`,
}

const PERIOD_META: Record<number, Meta> = {
  1: {
    title: 'APGs de SOI I: 22 APGs, 2.653 páginas | DomineAqui',
    description:
      'As 22 APGs do 1º período na ordem exata da metodologia. 2.653 páginas e 770 exercícios integrando anatomia, histologia, fisiologia e bioquímica sem lacunas.',
    canonical: `${SITE}/apg?periodo=1`,
  },
  2: {
    title: 'APGs de SOI II: 26 APGs, 763 páginas | DomineAqui',
    description:
      'As 26 APGs do 2º período, do sistema nervoso ao renal. Cada objetivo desdobrado em tópicos e aprofundado, sem buraco pra tapar na véspera da prova.',
    canonical: `${SITE}/apg?periodo=2`,
  },
  3: {
    title: 'APGs de SOI III: 26 APGs, 1.012 páginas | DomineAqui',
    description:
      'As 26 APGs do 3º período, do cardiovascular ao tegumentar. 1.012 páginas abrindo cada objetivo da fisiopatologia ao tratamento, prontas pra tutoria e prova.',
    canonical: `${SITE}/apg?periodo=3`,
  },
  4: {
    title: 'APGs de SOI IV: 34 APGs, 3.312 páginas | DomineAqui',
    description:
      'As 34 APGs do 4º período, da clínica ao tratamento. 3.312 páginas e 770 questões integrando fisiopatologia, diagnóstico e conduta em um caderno só.',
    canonical: `${SITE}/apg?periodo=4`,
  },
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildHead(meta: Meta): string {
  const title = escapeAttr(meta.title)
  const desc = escapeAttr(meta.description)
  const url = escapeAttr(meta.canonical)

  return `<title>${title}</title>
  <meta name="description" content="${desc}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="DomineAqui">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${OG_IMAGE}">
  <meta property="og:image:alt" content="Cadernos de APG da DomineAqui">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="${OG_IMAGE}">
  <script>${titleGuard(meta.title)}</script>`
}

// O bundler troca o documento inteiro ao descompactar e o template nao traz
// <title>, entao a aba ficaria em branco. O observer roda no Document (que
// sobrevive a troca do documentElement) e reaplica o title.
function titleGuard(title: string): string {
  return `(function(){var t=${JSON.stringify(title)};function fix(){if(document.title!==t){document.title=t;}}fix();new MutationObserver(fix).observe(document,{childList:true,subtree:true});})();`
}

let cachedHtml: string | null = null
function loadHtml(): string {
  if (!cachedHtml) {
    cachedHtml = readFileSync(join(process.cwd(), 'public', 'Cadernos-APGs.html'), 'utf8')
  }
  return cachedHtml
}

export async function GET(request: Request) {
  const periodo = Number(new URL(request.url).searchParams.get('periodo'))
  const meta = PERIOD_META[periodo] ?? GLOBAL_META

  const html = loadHtml().replace('<title>Bundled Page</title>', buildHead(meta))

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // `s-maxage` de um ano, não de uma hora.
      //
      // Esta página é um HTML de ~10 MB lido do disco e devolvido pela função.
      // Com `s-maxage=3600` cada região da borda voltava à origem de hora em
      // hora para buscar de novo os mesmos 10 MB — 24 vezes por dia, vezes o
      // número de regiões com tráfego. Era parte dos 10,49 GB de Fast Origin
      // Transfer de agosto (US$ 3,72), gastos em bytes idênticos.
      //
      // Um ano é seguro porque o conteúdo só muda em deploy, e cada deploy da
      // Vercel tem chave de cache própria: a borda parte fria. `max-age=0`
      // mantém o navegador reconferindo — mas com a borda, não com a origem.
      'cache-control': 'public, max-age=0, s-maxage=31536000, stale-while-revalidate=86400',
    },
  })
}
