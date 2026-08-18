'use client'

import { useEffect } from 'react'

import { TelaDeErro } from '@/components/erro/tela-de-erro'

/**
 * Fronteira de erro das rotas.
 *
 * Sem este arquivo, qualquer exceção durante a renderização — tanto a que
 * acontece no servidor quanto a que acontece no navegador — caía na tela
 * padrão do Next: "Application error: a client-side exception has occurred
 * (see the browser console for more information)". Em inglês, sem causa, sem
 * saída, e mandando abrir o console. Dentro do app instalado, que abre em tela
 * cheia, aquilo parecia o DomineAqui ter morrido.
 *
 * O layout continua montado aqui (cabeçalho, rodapé, tema), então a pessoa
 * segue dentro do produto — e o `reset` do Next permite remontar só a rota que
 * quebrou, sem recarregar tudo.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // O registro no console continua existindo para quem investiga — o que
    // mudou é que ele deixou de ser a única coisa oferecida ao usuário.
    console.error('[DomineAqui] erro na rota:', error)
  }, [error])

  return (
    <TelaDeErro
      entrada={{
        mensagem: error.message,
        nome: error.name,
        digest: error.digest,
      }}
      aoTentarNovamente={reset}
    />
  )
}
