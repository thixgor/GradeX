'use client'

import { useEffect, useState } from 'react'
import { Link2, Loader2, Search, ShoppingBag, Video, X } from 'lucide-react'

/**
 * Vínculo da aula com /materiais, no editor da aula (§2).
 *
 * A tela precisa deixar claro que são DUAS decisões independentes, porque os
 * dois casos de uso são diferentes:
 *
 *  • uma aula do curso que passa a ser vendida avulsa → marca só "libera por
 *    compra"; o vídeo continua na aula;
 *  • uma vídeo-aula que já era vendida em /materiais e agora precisa aparecer
 *    dentro do curso → marca também "o vídeo vem do material", e o embed passa
 *    a ter dono único.
 *
 * Colapsar as duas numa chave só ("integrar com material") obrigaria a
 * duplicar o vídeo num dos casos — exatamente o que se quer evitar.
 */

export interface VinculoMaterial {
  materialId: string
  materialTitulo?: string
  liberaPorCompra: boolean
  conteudoDoMaterial: boolean
}

interface ResultadoBusca {
  itemId: string
  title: string
  typeLabel: string
  price: number
  pricing: 'free' | 'paid'
  isHidden?: boolean
}

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function VinculoMaterialField({
  valor,
  onChange,
  escuro = false,
}: {
  valor: VinculoMaterial | null
  onChange: (v: VinculoMaterial | null) => void
  /**
   * O editor de aula tem fundo roxo fixo, e não a superfície do tema.
   *
   * Sem este sinal o componente usa `text-muted-foreground`, que no tema claro
   * é um cinza escuro: sobre o roxo do cartão, o texto explicativo ficava
   * praticamente invisível — exatamente onde ele mais precisa ser lido, porque
   * é o que distingue "vender a aula" de "buscar o vídeo do material".
   */
  escuro?: boolean
}) {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState<ResultadoBusca[]>([])
  const [carregando, setCarregando] = useState(false)

  const apagado = escuro ? 'text-white/60' : 'text-muted-foreground'
  const caixa = escuro ? 'border-white/10 bg-white/[0.04]' : 'border bg-muted/30'
  const campo = escuro
    ? 'border border-white/15 bg-white/5 text-white placeholder:text-white/35 focus:border-emerald-400/50'
    : 'border bg-background focus:border-primary/45'
  const item = escuro ? 'border border-white/10 bg-white/[0.04] text-white' : 'border bg-background'
  const opcao = escuro ? 'hover:bg-white/10 text-white' : 'hover:bg-muted'

  useEffect(() => {
    const termo = busca.trim()
    if (valor || termo.length < 2) {
      setResultados([])
      return
    }
    const timer = setTimeout(async () => {
      setCarregando(true)
      try {
        const res = await fetch(`/api/admin/coupons/products?q=${encodeURIComponent(termo)}`, {
          cache: 'no-store',
        })
        const data = await res.json()
        if (res.ok) {
          setResultados(
            (data.products || []).filter((p: any) => p.itemType === 'material').slice(0, 8),
          )
        }
      } finally {
        setCarregando(false)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [busca, valor])

  if (valor) {
    return (
      <div className={`rounded-lg p-3.5 ${escuro ? 'border border-emerald-400/25 bg-emerald-400/10' : 'border border-primary/25 bg-primary/5'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${escuro ? 'text-emerald-300' : 'text-primary'}`}>
              <Link2 className="h-3.5 w-3.5" /> Vinculada a um material
            </p>
            <p className={`mt-1 truncate text-sm font-semibold ${escuro ? 'text-white' : 'text-foreground'}`}>
              {valor.materialTitulo || valor.materialId}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-destructive/25 bg-destructive/10 px-2.5 py-1.5 text-xs font-bold text-destructive"
          >
            <X className="h-3.5 w-3.5" /> Desvincular
          </button>
        </div>

        <div className="mt-3 space-y-2">
          <label className={`flex items-start gap-2 rounded-md px-3 py-2.5 text-sm ${item}`}>
            <input
              type="checkbox"
              className="mt-0.5"
              checked={valor.liberaPorCompra}
              onChange={(e) => onChange({ ...valor, liberaPorCompra: e.target.checked })}
            />
            <span>
              <span className="font-semibold flex items-center gap-1.5">
                <ShoppingBag className="h-3.5 w-3.5 text-primary" /> Comprar o material libera esta aula
              </span>
              <span className={`mt-0.5 block text-xs ${apagado}`}>
                Quem comprar o material — ou um pacote que o contenha — passa a assistir. Some
                às regras atuais, não substitui: quem já tinha acesso continua tendo.
              </span>
            </span>
          </label>

          <label className={`flex items-start gap-2 rounded-md px-3 py-2.5 text-sm ${item}`}>
            <input
              type="checkbox"
              className="mt-0.5"
              checked={valor.conteudoDoMaterial}
              onChange={(e) => onChange({ ...valor, conteudoDoMaterial: e.target.checked })}
            />
            <span>
              <span className="font-semibold flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5 text-primary" /> O vídeo vem do material
              </span>
              <span className={`mt-0.5 block text-xs ${apagado}`}>
                Use quando a vídeo-aula já existe em /materiais. O embed passa a ter uma fonte
                só — editar no material atualiza a aula, sem cópia para desincronizar.
              </span>
            </span>
          </label>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-lg p-3.5 ${caixa}`}>
      <p className={`mb-2 text-xs ${apagado}`}>
        Vincule esta aula a um material para vendê-la em /materiais, ou para reaproveitar uma
        vídeo-aula que já existe lá.
      </p>
      <div className="relative">
        <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${apagado}`} />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar material (2+ letras)..."
          className={`h-10 w-full rounded-md pl-9 pr-9 text-sm outline-none ${campo}`}
        />
        {carregando ? (
          <Loader2 className={`absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin ${apagado}`} />
        ) : null}
      </div>

      {resultados.length > 0 ? (
        <div className={`mt-2 max-h-56 space-y-1 overflow-y-auto rounded-md p-1 ${item}`}>
          {resultados.map((r) => (
            <button
              key={r.itemId}
              type="button"
              onClick={() => {
                onChange({
                  materialId: r.itemId,
                  materialTitulo: r.title,
                  liberaPorCompra: true,
                  conteudoDoMaterial: false,
                })
                setBusca('')
              }}
              className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm ${opcao}`}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{r.title}</span>
                <span className={`text-xs ${apagado}`}>
                  {r.typeLabel} · {r.pricing === 'paid' ? moeda.format(r.price) : 'Grátis'}
                  {r.isHidden ? ' · oculto' : ''}
                </span>
              </span>
              <Link2 className="h-4 w-4 shrink-0 text-primary" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
