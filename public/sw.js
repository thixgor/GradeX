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
 */

const CACHE_VERSION = 'da-static-v3'

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
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
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
