'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, File, Package, Sparkles } from 'lucide-react'
import { useMaterialCart } from '@/context/MaterialCartContext'
import { formatBRL, typeIcons, typeLabels } from '@/components/materiais/shared'

/** Espelha `Recomendacao` de lib/recomendacoes/motor.ts. */
interface Sugestao {
  itemType: 'material' | 'package'
  itemId: string
  titulo: string
  capa: string | null
  tipo: string | null
  pago: boolean
  preco: number
  motivo: string
  totalDeMateriais?: number
}

/**
 * Prateleira "Quem estuda isto também leva" das páginas de material e pacote.
 *
 * `autenticado` chega da própria página (que já perguntou ao servidor): sem
 * login, a busca vai com `visitante=1` e é servida do CDN; com login, a
 * resposta tira o que a pessoa já tem. Enquanto a página não sabe, a
 * prateleira espera — pedir antes seria pedir a versão errada.
 *
 * A busca só sai quando a prateleira chega perto da tela: quem compra direto
 * ou fecha a página sem rolar não aciona a função.
 */
export function Recomendacoes({
  tipo,
  id,
  autenticado,
}: {
  tipo: 'material' | 'package'
  id: string
  autenticado: boolean | null
}) {
  const [itens, setItens] = useState<Sugestao[] | null>(null)
  const [personalizado, setPersonalizado] = useState(false)
  const { isInCart } = useMaterialCart()
  const ancora = useRef<HTMLElement>(null)
  const [perto, setPerto] = useState(false)

  useEffect(() => {
    const alvo = ancora.current
    if (!alvo || perto) return
    if (typeof IntersectionObserver === 'undefined') {
      setPerto(true)
      return
    }
    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          setPerto(true)
          observador.disconnect()
        }
      },
      { rootMargin: '600px 0px' }
    )
    observador.observe(alvo)
    return () => observador.disconnect()
  }, [perto])

  useEffect(() => {
    if (!perto || autenticado === null || !id) return
    let vivo = true
    const query = new URLSearchParams({ tipo, id })
    if (!autenticado) query.set('visitante', '1')
    // Sem `no-store`: o navegador reaproveita a resposta pelo tempo que o
    // servidor mandar (2 min para quem está logado, privado).
    fetch(`/api/materiais/recomendacoes?${query.toString()}`)
      .then((r) => (r.ok ? r.json() : { itens: [] }))
      .then((corpo) => {
        if (!vivo) return
        setItens(Array.isArray(corpo?.itens) ? corpo.itens : [])
        setPersonalizado(corpo?.personalizado === true)
      })
      .catch(() => { if (vivo) setItens([]) })
    return () => { vivo = false }
  }, [perto, tipo, id, autenticado])

  if (itens !== null && itens.length === 0) return null

  return (
    <section ref={ancora} className="mt-10" aria-labelledby="titulo-recomendacoes">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id="titulo-recomendacoes" className="ios-titulo-secao flex items-center gap-2">
            <Sparkles className="ios-tinta h-5 w-5 shrink-0" />
            Quem estuda isto também leva
          </h2>
          <p className="ios-rotulo-2 mt-0.5 text-[15px]">
            {personalizado ? 'Escolhido a partir deste item e do que você já tem.' : 'Escolhido a partir do que outros alunos compram juntos.'}
          </p>
        </div>
      </div>

      <div
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="list"
      >
        {itens === null
          ? Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="w-[168px] shrink-0 sm:w-[200px]" aria-hidden>
                <div className="ios-esqueleto aspect-[16/10] rounded-[18px]" />
                <div className="ios-esqueleto mt-2 h-4 w-4/5 rounded-full" />
                <div className="ios-esqueleto mt-1.5 h-3 w-1/2 rounded-full" />
              </div>
            ))
          : itens.map((item) => {
              const href = item.itemType === 'package' ? `/pacotes/${item.itemId}` : `/materiais/${item.itemId}`
              const noCarrinho = isInCart(item.itemType, item.itemId)
              const rotuloDoTipo = item.itemType === 'package'
                ? `Pacote${item.totalDeMateriais ? ` · ${item.totalDeMateriais} itens` : ''}`
                : typeLabels[item.tipo || 'other'] || 'Material'
              return (
                <Link
                  key={`${item.itemType}:${item.itemId}`}
                  href={href}
                  role="listitem"
                  className="ios-cartao ios-toque group w-[168px] shrink-0 snap-start rounded-[20px] p-2 sm:w-[200px]"
                >
                  <span className="ios-capa relative block aspect-[16/10] rounded-[14px]">
                    {item.capa ? (
                      <Image src={item.capa} alt="" fill sizes="200px" className="object-cover" />
                    ) : (
                      <span className="ios-capa-vazia ios-tinta flex h-full w-full items-center justify-center">
                        {item.itemType === 'package' ? <Package className="h-6 w-6" /> : typeIcons[item.tipo || 'other'] || <File className="h-5 w-5" />}
                      </span>
                    )}
                    {noCarrinho ? (
                      <span className="ios-selo absolute left-1.5 top-1.5 z-[3]">
                        <Check className="h-3 w-3" strokeWidth={3} /> No carrinho
                      </span>
                    ) : null}
                  </span>
                  <span className="block px-1 pb-1 pt-2">
                    <span className="ios-rotulo-3 block truncate text-[11px] font-semibold uppercase tracking-[0.04em]">{rotuloDoTipo}</span>
                    <span className="mt-0.5 line-clamp-2 min-h-[2.5em] text-[14px] font-semibold leading-[1.25] tracking-[-0.01em]">{item.titulo}</span>
                    <span className="mt-1 block text-[14px] font-semibold tabular-nums">
                      {item.pago ? formatBRL(item.preco) : <span className="ios-tinta">Grátis</span>}
                    </span>
                    <span className="ios-tinta mt-1 line-clamp-2 min-h-[2.5em] text-[12px] font-medium leading-[1.25]">{item.motivo}</span>
                  </span>
                </Link>
              )
            })}
      </div>
    </section>
  )
}
