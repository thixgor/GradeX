'use client'

import { useEffect, useState } from 'react'
import { Loader2, MousePointerClick } from 'lucide-react'
import {
  CATEGORIA_POR_ID,
  carregarModulo,
  type CategoriaId,
  type Ferramenta,
} from '@/lib/ferramentas-clinicas'
import { PainelFerramenta } from './painel'

/**
 * As três ferramentas liberadas na vitrine.
 *
 * Escolhidas por serem reconhecíveis à primeira vista e por mostrarem os três
 * formatos que a seção tem: uma conta de fisiologia (Winter), um escore de
 * pontos (CHA₂DS₂-VASc) e uma equação de regressão (CKD-EPI). Três bastam para
 * provar o mecanismo; mais do que isso começaria a ser o produto de graça.
 */
const DEMOS: { categoria: CategoriaId; ferramenta: string }[] = [
  { categoria: 'gasometria', ferramenta: 'formula-winter' },
  { categoria: 'cardiologia', ferramenta: 'cha2ds2-vasc' },
  { categoria: 'nefrologia', ferramenta: 'tfg-ckd-epi' },
]

/**
 * Demonstração interativa.
 *
 * Renderiza o painel de verdade — o mesmo componente da seção paga, com a mesma
 * conta, a mesma fórmula aberta, as mesmas armadilhas e as mesmas referências.
 * Uma reprodução aproximada seria mais leve, mas a vitrine estaria prometendo
 * uma coisa e o produto entregando outra. Cada área só é baixada quando a aba
 * é aberta.
 */
export function DemoFerramentas() {
  const [ativa, setAtiva] = useState(0)
  const [cache, setCache] = useState<Record<string, Ferramenta>>({})
  const [erro, setErro] = useState(false)

  const demo = DEMOS[ativa]
  const ferramenta = cache[demo.ferramenta]

  useEffect(() => {
    if (cache[demo.ferramenta]) return
    let vivo = true
    carregarModulo(demo.categoria)
      .then((lista) => {
        if (!vivo) return
        const achada = lista.find((f) => f.id === demo.ferramenta)
        if (achada) setCache((c) => ({ ...c, [demo.ferramenta]: achada }))
        else setErro(true)
      })
      .catch(() => vivo && setErro(true))
    return () => {
      vivo = false
    }
  }, [demo, cache])

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {DEMOS.map((d, i) => {
          const cat = CATEGORIA_POR_ID[d.categoria]
          const ativo = i === ativa
          return (
            <button
              key={d.ferramenta}
              type="button"
              onClick={() => setAtiva(i)}
              aria-pressed={ativo}
              className={`min-h-[2.25rem] rounded-lg border px-3 py-1.5 text-[12.5px] font-bold transition-colors ${
                ativo
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {cat?.nome ?? d.categoria}
            </button>
          )
        })}
      </div>

      {erro ? (
        <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Não foi possível carregar a demonstração. Recarregue a página.
        </p>
      ) : !ferramenta ? (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-border bg-card py-20 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando a ferramenta…
        </div>
      ) : (
        <PainelFerramenta
          ferramenta={ferramenta}
          cor={CATEGORIA_POR_ID[demo.categoria]?.cor ?? 'azul'}
          aberto
          fixo
          onToggle={() => {}}
        />
      )}

      <p className="mt-3 flex items-start gap-2 text-[12px] leading-relaxed text-muted-foreground">
        <MousePointerClick className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        Estas três estão liberadas de verdade — mexa nos campos e veja o resultado mudar. As outras{' '}
        <strong className="font-semibold text-foreground">198</strong> funcionam exatamente assim.
      </p>
    </div>
  )
}
