'use client'

import Link from 'next/link'
import { BookMarked, Star, Trophy } from 'lucide-react'

import { CartaoDoCatalogo } from '@/components/histologia/catalogo/cartao'
import { FileiraDoCatalogo } from '@/components/histologia/catalogo/fileira'
import { useProgresso } from '@/lib/histologia/progresso'
import { BASE, rotaDaPagina } from '@/lib/histologia/rotas'
import { useVistos } from '@/lib/histologia/vistos'

/**
 * "Continue estudando" — primeira fileira da home, e só para quem tem o que
 * continuar. Um bloco vazio dizendo "você ainda não estudou nada" ocuparia o
 * lugar mais valioso da tela para não dizer nada.
 *
 * Junta as duas memórias do módulo: as lâminas e doenças abertas (`vistos`,
 * com imagem) e a última página do atlas por assunto (`progresso.ultima`).
 * Tudo vem do `localStorage`, então nada renderiza antes da hidratação — sem
 * divergência com o HTML do servidor.
 */
export function ContinuarEstudando() {
  const { vistos, carregado: vistosProntos } = useVistos()
  const { progresso, carregado } = useProgresso()

  if (!carregado || !vistosProntos) return null

  const itens = vistos.map((v) => ({ ...v, id: v.href }))
  const ultima = progresso.ultima
  if (ultima && !itens.some((v) => v.href === rotaDaPagina(ultima.rota))) {
    itens.push({
      id: ultima.rota,
      href: rotaDaPagina(ultima.rota),
      titulo: ultima.titulo,
      categoria: 'Histologia · Atlas por assunto',
      area: 'histologia',
      imagem: null,
      zoom: false,
      em: ultima.em,
    })
  }
  itens.sort((a, b) => b.em - a.em)

  const concluidas = Object.keys(progresso.concluidas).length
  const favoritas = Object.keys(progresso.favoritos).length
  const quizzes = Object.keys(progresso.quizzes).length

  if (itens.length === 0 && concluidas + favoritas + quizzes === 0) return null

  return (
    <FileiraDoCatalogo
      id="continuar"
      titulo="Continue estudando"
      subtitulo={
        <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1">
            <Trophy className="h-3.5 w-3.5 text-[#E8763A]" aria-hidden /> {concluidas} concluídas
          </span>
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-[#E8763A]" aria-hidden /> {favoritas} favoritas
          </span>
          <span className="inline-flex items-center gap-1">
            <BookMarked className="h-3.5 w-3.5 text-[#E8763A]" aria-hidden /> {quizzes} quizzes feitos
          </span>
        </span>
      }
      verTudo={{ href: `${BASE}/caderno`, rotulo: 'Meu caderno' }}
    >
      {itens.length > 0 ? (
        itens.map((item, i) => (
          <li key={item.id}>
            <CartaoDoCatalogo item={{ ...item, icone: 'Layers' }} prioridade={i < 4} />
          </li>
        ))
      ) : (
        <li className="!w-auto">
          <Link
            href={`${BASE}/caderno`}
            className="inline-flex min-h-[44px] items-center rounded-lg border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/80 hover:border-[#E8763A]/60"
          >
            Abrir meu caderno, favoritas e revisões
          </Link>
        </li>
      )}
    </FileiraDoCatalogo>
  )
}
