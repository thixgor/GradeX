'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Manda o conteúdo para o fim do `<body>`, fora da árvore de quem chamou.
 *
 * ## Por que um modal precisa disto
 *
 * `z-index` não é global: ele só compara irmãos DENTRO do mesmo contexto de
 * empilhamento. Qualquer ancestral com `isolation: isolate`, `transform`,
 * `filter` ou `opacity` menor que 1 abre um contexto novo, e a partir dali o
 * `z-[200]` do modal só vale contra os irmãos dele lá dentro — nunca contra o
 * resto da página.
 *
 * É exatamente o que acontecia no Banco de Questões: a página inteira vive
 * dentro de `.vidro-ambiente`, que isola o contexto para prender as manchas de
 * cor do fundo atrás do conteúdo (`z-index: -1`). Os botões flutuantes — o
 * "voltar" e a doca — são filhos diretos do `<body>`, em `z-30` e `z-40`. Trinta
 * é menos que duzentos, mas isso não importava: eles estavam num contexto
 * acima, e passavam por cima do modal, cobrindo justamente o botão de confirmar.
 *
 * Subir o `z-index` do modal não resolveria — não há número que atravesse um
 * contexto de empilhamento. Sair dele resolve.
 *
 * Renderiza `null` no servidor e no primeiro quadro: `document` não existe na
 * renderização do servidor, e montar direto causaria divergência de hidratação.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  const [montado, setMontado] = useState(false)

  useEffect(() => {
    setMontado(true)
  }, [])

  if (!montado || typeof document === 'undefined') return null
  return createPortal(children, document.body)
}
