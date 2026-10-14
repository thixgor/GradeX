/*
 * Service worker do DomineAqui (PWA).
 *
 * Antes: o handler de fetch fazia `event.respondWith(fetch(event.request))` em
 * TODA requisição GET — ou seja, cada request passava a fazer um desvio pela
 * thread do service worker sem ganhar absolutamente nada em troca. Era
 * overhead puro (anti-pattern conhecido); um SW sem handler de fetch é
 * estritamente mais rápido que esse.
 *
 * Agora: cache-first APENAS para assets imutáveis. `/_next/static/*` tem hash
 * de conteúdo no nome e fontes/imagens são versionadas por deploy, então
 * servir do cache nunca entrega "versão velha" — se o conteúdo muda, a URL
 * muda. Todo o resto (HTML, /api/*, tudo que não casa) NÃO chama
 * respondWith e portanto segue o caminho normal do navegador, sem desvio.
 *
 * Resultado: revisitas e navegação dentro da PWA pegam JS/CSS/fontes do disco,
 * sem rede — e nenhum risco de conteúdo desatualizado.
 *
 * Uma exceção entrou depois, por causa do app instalado no Android: a
 * NAVEGAÇÃO passa pelo SW para poder cair na página offline quando não há
 * rede (dentro de um app em tela cheia, a tela de erro do navegador parece
 * defeito nosso). O custo disso é pago com navigation preload — o browser
 * dispara a requisição em paralelo com a subida do SW —, então a regra de
 * "não atrapalhar o caminho normal" continua valendo na prática.
 *
 * E outra, por custo: o VÍDEO dos anúncios (Vercel Blob, cobrado por byte
 * transferido). Ver `videoDeAnuncio` mais abaixo.
 */

const CACHE_VERSION = 'da-static-v3'

// Vídeos de anúncio já baixados. Fora do CACHE_VERSION de propósito: uma
// versão nova do worker não pode jogar fora um vídeo que o aluno já pagou
// (em banda) para baixar.
const CACHE_ANUNCIOS = 'da-anuncios-v1'
// Poucos vídeos bastam (é o que está no ar); o mais antigo sai primeiro.
const ANUNCIOS_MAX_VIDEOS = 6

// Página mostrada quando a navegação falha por falta de rede. Ela existe por
// causa do app instalado: no navegador, cair na tela de erro é normal; dentro
// de um app que abre em tela cheia, a tela de dinossauro do Chrome parece o
// app ter quebrado. Guardamos uma cópia no install e servimos essa cópia.
const PAGINA_OFFLINE = '/offline'

// Guardados junto com a página offline: sem rede, o que não estiver no cache
// não aparece. O ícone é o que faz a tela continuar sendo o DomineAqui.
const ASSETS_DA_PAGINA_OFFLINE = [PAGINA_OFFLINE, '/icon-192.png']

// Só caminhos cujo conteúdo é imutável para uma dada URL.
function isImmutableAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.startsWith('/img/') ||
    url.pathname.startsWith('/ldpg-mnclinico-assets/')
  )
}

/**
 * Descobre as folhas de estilo que a página offline usa e guarda cada uma.
 *
 * Sem isto, guardávamos o HTML da página offline e mais nada: os arquivos de
 * CSS do Next têm hash no nome, então só estavam em cache se o usuário já
 * tivesse navegado depois de o service worker ativar. Quando não estavam, a
 * tela sem internet abria como HTML cru — texto preto em fundo branco,
 * empilhado. Dentro de um app em tela cheia, isso não parece "sem internet":
 * parece o app ter quebrado, que é exatamente o que a página existe para
 * evitar.
 */
async function guardarEstilosDaPaginaOffline(cache, htmlOffline) {
  if (!htmlOffline) return
  let html
  try {
    html = await htmlOffline.clone().text()
  } catch {
    return
  }

  const encontrados = new Set()
  // A query opcional cobre o `?v=` que o servidor de desenvolvimento anexa; em
  // produção o nome já traz o hash e vem sem query.
  const padrao = /href="(\/_next\/static\/[^"]+\.css(?:\?[^"]*)?)"/g
  let achado
  while ((achado = padrao.exec(html)) !== null) {
    encontrados.add(achado[1])
  }

  await Promise.all(
    Array.from(encontrados).map((caminho) =>
      cache.add(new Request(caminho, { cache: 'reload' })).catch(() => {})
    )
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION)
      await Promise.all(
        ASSETS_DA_PAGINA_OFFLINE.map((caminho) =>
          // Um a um, com catch individual: sem rede na hora do install,
          // seguimos sem fallback em vez de impedir o SW de ativar.
          cache.add(new Request(caminho, { cache: 'reload' })).catch(() => {})
        )
      )
      await guardarEstilosDaPaginaOffline(cache, await cache.match(PAGINA_OFFLINE))
    })()
  )
  // Ativa a nova versão imediatamente, sem esperar abas antigas fecharem.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Navigation preload: o browser dispara a requisição da navegação EM
      // PARALELO com a subida do service worker. É o que permite ter fallback
      // offline sem devolver ao usuário a latência de acordar o SW a cada
      // navegação — a preocupação que motivou este arquivo a não interceptar
      // navegação nenhuma até aqui.
      if (self.registration.navigationPreload) {
        try {
          await self.registration.navigationPreload.enable()
        } catch {
          /* navegador sem suporte: cai no fetch normal */
        }
      }

      // Remove caches de versões anteriores, preservando o atual.
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((k) => k !== CACHE_VERSION && k !== CACHE_ANUNCIOS)
          .map((k) => caches.delete(k))
      )
      await self.clients.claim()
    })()
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request

  // Só GET; o resto (POST etc.) segue o fluxo normal do navegador.
  if (request.method !== 'GET') return

  let url
  try {
    url = new URL(request.url)
  } catch {
    return
  }

  if (videoDeAnuncio(url)) {
    event.respondWith(responderVideoDeAnuncio(event, request, url))
    return
  }

  if (url.origin !== self.location.origin) return

  // Navegação (abrir/trocar de página): vai para a rede como sempre, usando a
  // resposta que o navigation preload já começou a baixar. A única diferença é
  // o `catch`: sem rede, entregamos a página offline em vez da tela de erro.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const preload = await event.preloadResponse
          if (preload) return preload
          return await fetch(request)
        } catch {
          const cache = await caches.open(CACHE_VERSION)
          const offline = await cache.match(PAGINA_OFFLINE)
          if (offline) return offline
          throw new Error('offline sem página de fallback')
        }
      })()
    )
    return
  }

  // O ícone da página offline: rede primeiro (ele não é versionado por URL,
  // então não pode virar cache-first), cache só quando a rede falha. Sem isto,
  // a tela offline abriria com o ícone quebrado mesmo tendo a cópia guardada.
  if (ASSETS_DA_PAGINA_OFFLINE.includes(url.pathname)) {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_VERSION)
        const guardado = await cache.match(url.pathname)
        if (guardado) return guardado
        throw new Error('asset offline indisponível')
      })
    )
    return
  }

  // Não é asset imutável → não intercepta. Sem respondWith o navegador trata a
  // requisição normalmente, sem custo de service worker.
  if (!isImmutableAsset(url)) return

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_VERSION)
      const cached = await cache.match(request)
      if (cached) return cached

      const response = await fetch(request)
      // Só guarda respostas completas e bem-sucedidas.
      if (response && response.status === 200 && response.type === 'basic') {
        cache.put(request, response.clone()).catch(() => {})
      }
      return response
    })().catch(() => fetch(request))
  )
})

/*
 * ── Vídeo de anúncio: baixado UMA vez por aparelho ──────────────────────────
 *
 * O vídeo vem do Vercel Blob, que cobra cada byte entregue. Sem isto, quem vê
 * o anúncio em dez páginas pode baixá-lo de novo várias vezes:
 *
 *  - O <video> pede o arquivo em pedaços (cabeçalho `Range`), e o cache HTTP
 *    do navegador lida mal com pedaços: o Safari praticamente não reaproveita,
 *    e o Chrome descarta com facilidade arquivos grandes.
 *  - O vídeo toca em loop e pausa/retoma ao sair e voltar à tela — cada
 *    retomada pode virar um pedido novo.
 *
 * Aqui o arquivo é baixado inteiro na primeira vez, guardado no Cache Storage
 * e, dali em diante, TODO pedido (início, loop, salto, outra página, outro
 * dia) é respondido do disco, recortando o pedaço pedido. A URL do Blob é
 * imutável (nome com sufixo aleatório), então a cópia nunca fica velha.
 *
 * Qualquer falha cai no caminho normal (`fetch(request)`): no pior caso, o
 * vídeo toca como tocaria sem o worker.
 */

function videoDeAnuncio(url) {
  return (
    url.hostname.endsWith('.public.blob.vercel-storage.com') &&
    url.pathname.startsWith('/anuncios/videos/') &&
    url.pathname.endsWith('.mp4')
  )
}

// Download inteiro em andamento, por URL: pedidos simultâneos (o vídeo pede o
// começo e logo um salto) esperam o MESMO download em vez de abrir outro.
const downloadsEmAndamento = new Map()

/** `bytes=a-b`, `bytes=a-`, `bytes=-n` → { inicio, fim? } ou { sufixo }. */
function lerRange(cabecalho) {
  const m = /^bytes=(\d*)-(\d*)$/.exec((cabecalho || '').trim())
  if (!m || (m[1] === '' && m[2] === '')) return null
  if (m[1] === '') return { sufixo: Number(m[2]) }
  return { inicio: Number(m[1]), fim: m[2] === '' ? undefined : Number(m[2]) }
}

/** Resposta parcial (206) recortada de um vídeo inteiro já guardado. */
async function recortar(guardado, range) {
  const corpo = await guardado.blob()
  const total = corpo.size
  if (!range) {
    return new Response(corpo, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': String(total),
        'Accept-Ranges': 'bytes',
      },
    })
  }

  let inicio
  let fim
  if (range.sufixo !== undefined) {
    inicio = Math.max(0, total - range.sufixo)
    fim = total - 1
  } else {
    inicio = range.inicio
    fim = range.fim === undefined ? total - 1 : Math.min(range.fim, total - 1)
  }
  if (inicio >= total || inicio > fim) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${total}` } })
  }

  return new Response(corpo.slice(inicio, fim + 1), {
    status: 206,
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': String(fim - inicio + 1),
      'Content-Range': `bytes ${inicio}-${fim}/${total}`,
      'Accept-Ranges': 'bytes',
    },
  })
}

/**
 * Um pedaço direto da rede, mas passando pelo worker em modo CORS.
 *
 * Por que não `fetch(request)`: o <video> pede sem CORS, e a resposta viria
 * "opaca". O navegador recusa um vídeo cujos pedaços misturam resposta opaca
 * com resposta montada aqui — o próximo pedaço, vindo do cache, quebraria a
 * reprodução. Todo pedaço sai daqui do mesmo tipo.
 */
async function pedacoDaRede(url, request) {
  const cabecalhos = {}
  const range = request.headers.get('Range')
  if (range) cabecalhos.Range = range
  const rede = await fetch(url.href, { mode: 'cors', credentials: 'omit', headers: cabecalhos })
  const copiar = ['Content-Type', 'Content-Length', 'Content-Range', 'Accept-Ranges']
  const saida = {}
  for (const nome of copiar) {
    const valor = rede.headers.get(nome)
    if (valor) saida[nome] = valor
  }
  return new Response(rede.body, { status: rede.status, headers: saida })
}

/** Mantém só os vídeos mais recentes (as chaves vêm na ordem de inserção). */
async function aparar(cache) {
  const chaves = await cache.keys()
  const excesso = chaves.length - ANUNCIOS_MAX_VIDEOS
  for (let i = 0; i < excesso; i++) await cache.delete(chaves[i])
}

/**
 * Baixa o arquivo inteiro (modo CORS: o worker precisa LER os bytes para
 * guardar e recortar) e devolve dois fluxos do mesmo download: um vai para o
 * Cache Storage, o outro é entregue já ao vídeo — que começa a tocar sem
 * esperar o arquivo terminar.
 */
async function iniciarDownload(event, url) {
  const rede = await fetch(url.href, { mode: 'cors', credentials: 'omit' })
  if (!rede.ok || rede.status !== 200 || !rede.body) throw new Error('download do vídeo falhou')

  const [paraCache, paraVideo] = rede.body.tee()
  const cabecalhos = { 'Content-Type': 'video/mp4' }
  const tamanho = rede.headers.get('Content-Length')
  if (tamanho) cabecalhos['Content-Length'] = tamanho

  const gravacao = (async () => {
    const cache = await caches.open(CACHE_ANUNCIOS)
    await cache.put(url.href, new Response(paraCache, { status: 200, headers: cabecalhos }))
    await aparar(cache)
  })()
  const concluido = gravacao.finally(() => downloadsEmAndamento.delete(url.href))
  downloadsEmAndamento.set(url.href, concluido)
  // O vídeo pode ser desmontado no meio (a pessoa trocou de página): o
  // download termina mesmo assim, para não ter sido pago à toa.
  event.waitUntil(concluido.catch(() => {}))

  return { paraVideo, total: Number(rede.headers.get('Content-Length')) || 0, concluido }
}

async function responderVideoDeAnuncio(event, request, url) {
  try {
    const cache = await caches.open(CACHE_ANUNCIOS)
    const range = lerRange(request.headers.get('Range'))

    // 1. Já está no aparelho: zero byte de rede.
    const guardado = await cache.match(url.href)
    if (guardado) return await recortar(guardado, range)

    // 2. Está baixando: espera o mesmo download e recorta.
    const emAndamento = downloadsEmAndamento.get(url.href)
    if (emAndamento) {
      await emAndamento
      const pronto = await cache.match(url.href)
      if (pronto) return await recortar(pronto, range)
      return await pedacoDaRede(url, request)
    }

    // 3. Primeiro pedido "do começo" (o que o <video> faz ao dar play): vira o
    //    download inteiro, entregue em fluxo enquanto é guardado.
    const doComeco =
      !range || (range.inicio === 0 && (range.fim === undefined || range.fim >= 1024 * 1024))
    if (doComeco) {
      const { paraVideo, total } = await iniciarDownload(event, url)
      if (!range || !total) {
        return new Response(paraVideo, {
          status: 200,
          headers: { 'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes', ...(total ? { 'Content-Length': String(total) } : {}) },
        })
      }
      return new Response(paraVideo, {
        status: 206,
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Length': String(total),
          'Content-Range': `bytes 0-${total - 1}/${total}`,
          'Accept-Ranges': 'bytes',
        },
      })
    }

    // 4. Pedido pequeno antes de existir download (o Safari sonda `bytes=0-1`):
    //    vai à rede — são poucos bytes.
    return await pedacoDaRede(url, request)
  } catch {
    // CORS indisponível ou rede instável: o caminho normal do navegador. Se o
    // CORS falha, falha em todo pedaço, então a resposta fica opaca do começo
    // ao fim — sem mistura.
    return fetch(request)
  }
}
