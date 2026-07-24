/*
 * Service worker mínimo do DomineAqui (PWA).
 *
 * Objetivo: habilitar a instalabilidade da PWA (critério exigido pelo
 * Chrome/Android) SEM introduzir cache agressivo — nada de servir conteúdo
 * desatualizado, nada de bugs de "atualizei o site mas o app ficou velho".
 *
 * Por isso o fetch é network-first puro: apenas repassa o request para a rede.
 * Se a rede falhar (offline), deixamos o erro seguir — não há shell offline.
 */

self.addEventListener('install', () => {
  // Ativa a nova versão imediatamente, sem esperar abas antigas fecharem.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Limpa qualquer cache que uma versão anterior possa ter deixado.
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
      await self.clients.claim()
    })()
  )
})

self.addEventListener('fetch', (event) => {
  // Só GET; o resto (POST etc.) segue o fluxo normal do navegador.
  if (event.request.method !== 'GET') return
  // Network-first sem cache: sempre a versão mais recente.
  event.respondWith(fetch(event.request))
})
