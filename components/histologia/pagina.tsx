'use client'

import { useEffect } from 'react'

/**
 * Peças comuns das páginas do módulo desenhadas no navegador (ver
 * `components/histologia/portao.tsx`).
 */

/**
 * O título da aba. O casco é estático e igual para todas as páginas de uma
 * rota, então o título específico — o nome da lâmina, da doença — só existe
 * depois que o conteúdo chega. O sufixo é o mesmo que o `metadadosDoModulo` da
 * área punha (a Histopatologia tem o dela).
 *
 * Atribuir uma vez não basta: o `<title>` do casco é reinserido no `<head>`
 * depois deste efeito — na hidratação e ao fim de uma navegação —, e o título
 * genérico voltava. Enquanto a página está montada, o observador reaplica; só
 * no endereço em que ela montou, para não disputar a aba com a rota seguinte
 * (o mesmo recurso de `lib/apg-pagina.ts`).
 */
export function useTituloDaAba(titulo: string, sufixo = ' — Manual da Histologia') {
  const completo = `${titulo}${sufixo}`
  useEffect(() => {
    const caminho = window.location.pathname
    const aplicar = () => {
      if (window.location.pathname === caminho && document.title !== completo) document.title = completo
    }
    aplicar()
    const observador = new MutationObserver(aplicar)
    observador.observe(document.head, { childList: true, subtree: true, characterData: true })
    return () => observador.disconnect()
  }, [completo])
}

export function DadosEstruturados({ dados }: { dados: Record<string, unknown>[] }) {
  return (
    <>
      {dados.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Escapar `<` impede que algo aqui feche a tag e injete markup — a
          // mesma regra de `buildJsonLd` (`lib/seo.ts`), que não dá para
          // importar daqui: o módulo carrega o driver do banco por baixo.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item).replace(/</g, '\\u003c') }}
        />
      ))}
    </>
  )
}
