import Link from 'next/link'
import {
  BookMarked,
  FlaskConical,
  Layers,
  ListChecks,
  Microscope,
  Stethoscope,
  Target,
  type LucideIcon,
} from 'lucide-react'

import { IconeDoSistema } from '@/components/histologia-zoom/icone-do-sistema'
import type { ItemDoCatalogo } from '@/lib/histologia/catalogo-tipos'

/**
 * Cartão do catálogo.
 *
 * ## Uma área de clique, nenhum botão dentro
 *
 * O cartão inteiro é o link. A versão antiga empilhava "abrir", "comparar" e
 * chips de órgão dentro do mesmo cartão — três alvos num espaço de polegar, e
 * o aluno não sabia qual deles era "estudar esta lâmina".
 *
 * ## O que o cartão diz antes do clique
 *
 * - a imagem real da lâmina (ou capa tipográfica, quando não há imagem — nunca
 *   uma foto genérica no lugar);
 * - o nome do que se estuda;
 * - a área (Histologia ou Histopatologia), com cor própria;
 * - o selo **Zoom** quando a lâmina tem visualização com zoom interativo. Zoom
 *   é modalidade, não categoria: aparece como selo, em qualquer fileira.
 *
 * O hover amplia de leve e revela a linha de detalhe; no toque, a linha já
 * está visível, porque não existe hover.
 */

const ICONES: Record<string, LucideIcon> = {
  Layers,
  Stethoscope,
  ListChecks,
  FlaskConical,
  Target,
  BookMarked,
  Microscope,
}

const ROTULO_DA_AREA = { histologia: 'Histologia', histopatologia: 'Histopatologia', praticar: 'Praticar' } as const

/*
 * O visual mora em classes `cat-*` de `globals.css`, não em utilitários: a
 * página tem centenas de cartões, e cada utilitário se repetiria no HTML e no
 * payload RSC de todos eles (ver CLAUDE.md, "Código que sai das funções").
 */
export function CartaoDoCatalogo({
  item,
  formato = 'paisagem',
  mostrarArea = true,
  prioridade = false,
}: {
  item: ItemDoCatalogo
  formato?: 'paisagem' | 'retrato'
  /** Em fileiras de uma área só, o rótulo de área repetido em todo cartão é ruído. */
  mostrarArea?: boolean
  /** Primeira fileira visível: carrega já, sem esperar a rolagem. */
  prioridade?: boolean
}) {
  return (
    <Link href={item.href} className={formato === 'retrato' ? 'cat-cartao cat-retrato' : 'cat-cartao'}>
      <span className="cat-capa">
        <Capa item={item} prioridade={prioridade} />
        {(mostrarArea || item.zoom) && (
          <span className="cat-topo">
            {mostrarArea && <span className={`cat-chip cat-${item.area}`}>{ROTULO_DA_AREA[item.area]}</span>}
            {item.zoom && (
              <span className="cat-chip cat-zoom">
                Zoom<span className="sr-only"> interativo disponível</span>
              </span>
            )}
          </span>
        )}
        <span className="cat-titulo">{item.titulo}</span>
      </span>
      <span className="cat-meta">
        <span>{item.categoria}</span>
        {item.detalhe && <span className="cat-detalhe">{item.detalhe}</span>}
      </span>
    </Link>
  )
}

function Capa({ item, prioridade }: { item: ItemDoCatalogo; prioridade: boolean }) {
  if (item.mosaico) {
    // Lâmina DZI: o tile único tem ~150 px e borraria; o mosaico 2×2 é nítido.
    return (
      <svg
        viewBox={`0 0 ${item.mosaico.largura} ${item.mosaico.altura}`}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        {item.mosaico.tiles.map((t) => (
          <image key={t.url} href={t.url} x={t.x} y={t.y} width={t.l} height={t.a} preserveAspectRatio="none" />
        ))}
      </svg>
    )
  }
  if (item.imagem) {
    /* eslint-disable-next-line @next/next/no-img-element */
    return <img src={item.imagem} alt="" loading={prioridade ? 'eager' : 'lazy'} decoding="async" />
  }
  // Sem imagem real: capa tipográfica na cor do sistema, com o ícone da área.
  const cor = item.cor ?? '#E8763A'
  const Icone = item.icone ? ICONES[item.icone] : undefined
  return (
    <span
      className="cat-tipografica"
      style={{ background: `radial-gradient(circle at 30% 20%, ${cor}55, transparent 60%), linear-gradient(135deg, ${cor}33, #0B1F1A 75%)` }}
      aria-hidden
    >
      {Icone ? (
        <Icone className="h-10 w-10" aria-hidden />
      ) : item.icone ? (
        <IconeDoSistema nome={item.icone} className="h-10 w-10" />
      ) : (
        <Microscope className="h-10 w-10" aria-hidden />
      )}
    </span>
  )
}

/** Os `<li>` de uma fileira. As quatro primeiras capas carregam já quando a fileira está no alto. */
export function CartoesDaFileira({
  itens,
  formato,
  mostrarArea,
  prioridade = false,
}: {
  itens: ItemDoCatalogo[]
  formato?: 'paisagem' | 'retrato'
  mostrarArea?: boolean
  prioridade?: boolean
}) {
  return (
    <>
      {itens.map((item, i) => (
        <li key={item.id}>
          <CartaoDoCatalogo item={item} formato={formato} mostrarArea={mostrarArea} prioridade={prioridade && i < 4} />
        </li>
      ))}
    </>
  )
}
