/**
 * Diagnóstico dos trechos de voz de uma aula, para o admin: quantos chegaram,
 * foram transcritos ou falharam, e o erro real (do Gemini, da conferência no
 * Google ou do envio do navegador). Usado na aba "Resumos por IA" e na sala de
 * teste.
 */

import type { ResumoDosTrechos } from '@/lib/monitorias/resumo/tipos'

export function LinhaDosTrechos({ trechos }: { trechos: ResumoDosTrechos | null }) {
  // Só spans (com `block`): a linha entra tanto em <div> quanto dentro de <span>.
  if (!trechos) return <span className="block text-xs text-muted-foreground">Nenhum trecho de voz chegou ao servidor.</span>
  const partes = [
    `${trechos.total} trecho(s)`,
    `${trechos.transcritos} transcrito(s)`,
    trechos.falharam ? `${trechos.falharam} falharam` : '',
    trechos.enviando ? `${trechos.enviando} no envio` : '',
    trechos.peloBlob ? `${trechos.peloBlob} pelo Blob` : '',
  ].filter(Boolean)
  return (
    <span className="block space-y-0.5 text-xs">
      <span className="block text-muted-foreground">Trechos de voz: {partes.join(' · ')}</span>
      {trechos.ultimoErro && <span className="block break-words text-rose-600">Erro do trecho: {trechos.ultimoErro}</span>}
      {trechos.erroDireto && <span className="block break-words text-amber-700 dark:text-amber-400">Envio direto ao Google: {trechos.erroDireto}</span>}
    </span>
  )
}
