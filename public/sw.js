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
 */

const CACHE_VERSION = 'da-static-v1'

// Só caminhos cujo conteúdo é imutável para uma dada URL.
function isImmutableAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.startsWith('/img/') ||
    url.pathname.startsWith('/ldpg-mnclinico-assets/')
  )
}

self.addEventListener('install', () => {
  // Ativa a nova versão imediatamente, sem esperar abas antigas fecharem.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
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

  // Outra origem, ou não é asset imutável → não intercepta. Sem respondWith o
  // navegador trata a requisição normalmente, sem custo de service worker.
  if (url.origin !== self.location.origin) return
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
