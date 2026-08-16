'use client'

import { useEffect, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { CardDeAula, Trilho, type AulaNaBiblioteca } from '@/components/aulas/biblioteca'

/**
 * Uma faixa de aulas carregada sob demanda — salvas (§21) e histórico (§22).
 *
 * As duas listas são a mesma coisa na tela: um trilho de cards com progresso e
 * cadeado. O que muda é de onde vem a lista de ids, e por isso são um componente
 * só com a rota como parâmetro — duas versões quase idênticas divergiriam no
 * primeiro ajuste de card.
 *
 * Carrega depois da árvore principal, e não junto: nenhuma das duas é a primeira
 * pergunta de quem abre a biblioteca, e disputar a rede com a listagem que a
 * pessoa veio ver atrasaria justamente o que importa.
 *
 * Some por completo quando está vazia. Uma seção com "você ainda não salvou
 * nada" empurra a biblioteca para baixo e não oferece nada em troca — a estrela
 * nos cards é descoberta no uso, que é onde ela faz sentido.
 */
export function EstanteDeAulas({
  titulo,
  vazio,
  rota,
  icone: Icone,
  recarregar,
}: {
  titulo: string
  /** Texto para quando a estante existe mas está vazia — só depois do primeiro uso. */
  vazio: string
  rota: string
  icone: LucideIcon
  /**
   * Valor que, ao mudar, refaz a busca.
   *
   * A estante de salvos precisa disso: favoritar uma aula lá em cima muda a
   * lista daqui, e sem o sinal ela só se atualizaria no próximo carregamento da
   * página — o aluno salvaria uma aula e não a veria aparecer.
   */
  recarregar?: unknown
}) {
  const [itens, setItens] = useState<AulaNaBiblioteca[] | null>(null)
  const [jaTeveConteudo, setJaTeveConteudo] = useState(false)

  useEffect(() => {
    let vivo = true
    fetch(rota, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { itens: [] }))
      .then((d) => {
        if (!vivo) return
        const lista = (d.itens || []).map((a: any) => ({ ...a, _id: String(a._id) }))
        setItens(lista)
        if (lista.length > 0) setJaTeveConteudo(true)
      })
      .catch(() => vivo && setItens([]))
    return () => {
      vivo = false
    }
  }, [rota, recarregar])

  // Ainda carregando, ou nunca teve nada: não desenha esqueleto nem seção vazia.
  if (itens === null) return null
  if (itens.length === 0 && !jaTeveConteudo) return null

  return (
    <section className="mt-8">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold tracking-tight">
        <Icone className="h-5 w-5 text-primary" />
        {titulo}
      </h2>
      {itens.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
          {vazio}
        </p>
      ) : (
        <Trilho>
          {itens.map((aula) => (
            <CardDeAula key={aula._id} aula={aula} noTrilho />
          ))}
        </Trilho>
      )}
    </section>
  )
}
