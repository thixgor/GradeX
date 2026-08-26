'use client'

import { useEffect, useState } from 'react'
import { ACERVO_SEM_NUMERO, rotuloDoAcervo } from '@/lib/banco/acervo-publico'

/**
 * O número do acervo, compartilhado entre todas as telas que o mostram.
 *
 * O modal de PDF e o banner de venda das provas podem estar montados ao mesmo
 * tempo (o banner fica visível o tempo todo; o modal abre por cima dele), e os
 * dois querem a mesma frase. Sem este módulo cada componente teria seu próprio
 * cache e sua própria requisição — a segunda sempre chegando tarde demais para
 * evitar a rajada dupla no primeiro carregamento da página.
 *
 * `emVoo` deduplica essa rajada: a primeira chamada dispara o `fetch`, a
 * segunda (do outro componente, no mesmo render) recebe a MESMA promise em vez
 * de abrir outra requisição.
 */
let acervoEmCache: number | null = null
let emVoo: Promise<number | null> | null = null

function buscarAcervo(): Promise<number | null> {
  if (!emVoo) {
    emVoo = fetch('/api/banco/contagem')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        const valor = Number(data?.aproximado)
        return Number.isFinite(valor) ? valor : null
      })
      // Sem número o texto ainda funciona (`ACERVO_SEM_NUMERO`): nenhuma tela
      // de venda pode depender desta requisição secundária dar certo.
      .catch(() => null)
      .finally(() => { emVoo = null })
  }
  return emVoo
}

/**
 * A frase pronta para exibir: `"+15 mil questões"` ou, sem número confiável
 * ainda, `ACERVO_SEM_NUMERO`.
 *
 * `ativo: false` pula a busca — para quando o componente que chama já sabe que
 * não vai mostrar a frase (ex.: assinante Plus+/Quest+ olhando a própria tela).
 */
export function useRotuloDoAcervo(ativo: boolean = true): string {
  const [acervo, setAcervo] = useState<number | null>(acervoEmCache)

  useEffect(() => {
    if (!ativo || acervoEmCache !== null) return
    let vivo = true
    buscarAcervo().then(valor => {
      if (valor === null) return
      acervoEmCache = valor
      if (vivo) setAcervo(valor)
    })
    return () => { vivo = false }
  }, [ativo])

  return rotuloDoAcervo(acervo) ?? ACERVO_SEM_NUMERO
}
