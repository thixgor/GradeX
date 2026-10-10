'use client'

import { useEffect, useState } from 'react'
import { BadgePercent, BookOpen, Check, Loader2, Search, X } from 'lucide-react'
import { formatarCentavos } from '@/lib/monitorias/dinheiro'
import { materialIsentaTaxa } from '@/lib/monitorias/comissao'
import { cn } from '@/lib/utils'
import { api } from './base'

export interface MaterialOficialItem {
  id: string
  titulo: string
  capa: string | null
  precoCentavos: number
}

/**
 * Escolha do material OFICIAL que o monitor indica no anúncio. A lista vem do
 * servidor (só materiais pagos e visíveis da loja); a conta dos 10% aqui é só
 * para o monitor entender. Quem decide, com o preço do banco, é o checkout.
 */
export function EscolherMaterialOficial({
  valorId,
  valorAulaCentavos,
  onChange,
}: {
  valorId: string | null
  /** Preço de referência do anúncio (por hora ou por aula), para a simulação. */
  valorAulaCentavos: number
  onChange: (id: string | null) => void
}) {
  const [escolhido, setEscolhido] = useState<MaterialOficialItem | null>(null)
  const [busca, setBusca] = useState('')
  const [itens, setItens] = useState<MaterialOficialItem[]>([])
  const [carregando, setCarregando] = useState(false)
  const [aberto, setAberto] = useState(false)

  // Material já salvo no anúncio: busca o nome e o preço atuais.
  useEffect(() => {
    if (!valorId) {
      setEscolhido(null)
      return
    }
    if (escolhido?.id === valorId) return
    api<{ itens: MaterialOficialItem[] }>(`/api/monitorias/tutor/materiais-oficiais?id=${valorId}`)
      .then((r) => setEscolhido(r.itens[0] || null))
      .catch(() => setEscolhido(null))
  }, [valorId, escolhido?.id])

  // Busca com pausa de 300 ms (uma requisição por pausa de digitação, não por tecla).
  useEffect(() => {
    if (!aberto) return
    const t = setTimeout(() => {
      setCarregando(true)
      api<{ itens: MaterialOficialItem[] }>(`/api/monitorias/tutor/materiais-oficiais?q=${encodeURIComponent(busca.trim())}`)
        .then((r) => setItens(r.itens))
        .catch(() => setItens([]))
        .finally(() => setCarregando(false))
    }, 300)
    return () => clearTimeout(t)
  }, [busca, aberto])

  const isenta = escolhido ? materialIsentaTaxa(valorAulaCentavos, escolhido.precoCentavos) : false

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BadgePercent className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-heading text-base font-semibold">Material oficial: receba 100% da aula</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Indique um material da loja DomineAqui. Se o aluno levar junto e o material custar pelo menos 10% do valor da aula, a plataforma não cobra taxa daquela aula: o valor é todo seu. Para o aluno é opcional.
          </p>
        </div>
      </div>

      {escolhido ? (
        <div className="mt-4 rounded-xl border border-primary/30 bg-primary/[0.04] p-3">
          <div className="flex items-center gap-3">
            <Capa url={escolhido.capa} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{escolhido.titulo}</p>
              <p className="text-xs text-muted-foreground">Preço oficial: {formatarCentavos(escolhido.precoCentavos)}</p>
            </div>
            <button type="button" onClick={() => onChange(null)} className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="Remover material">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className={cn('mt-3 rounded-lg px-3 py-2 text-xs leading-relaxed', isenta ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
            {valorAulaCentavos > 0
              ? isenta
                ? `Com seu preço de ${formatarCentavos(valorAulaCentavos)}, quem levar este material faz você receber ${formatarCentavos(valorAulaCentavos)}, sem taxa.`
                : `Este material isenta aulas de até ${formatarCentavos(escolhido.precoCentavos * 10)}. Acima disso, a taxa de 10% continua (o aluno ainda pode levar o material).`
              : `Este material isenta aulas de até ${formatarCentavos(escolhido.precoCentavos * 10)}.`}
          </p>
        </div>
      ) : aberto ? (
        <div className="mt-4">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar na loja de Materiais"
              className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm"
            />
          </label>
          <ul className="mt-2 max-h-72 divide-y divide-border overflow-y-auto rounded-xl border border-border">
            {carregando && <li className="flex items-center gap-2 p-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Buscando</li>}
            {!carregando && itens.length === 0 && <li className="p-3 text-sm text-muted-foreground">Nenhum material pago encontrado.</li>}
            {!carregando &&
              itens.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setEscolhido(m)
                      onChange(m.id)
                      setAberto(false)
                    }}
                    className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-muted/50"
                  >
                    <Capa url={m.capa} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{m.titulo}</span>
                      <span className="block text-xs text-muted-foreground">
                        {formatarCentavos(m.precoCentavos)}
                        {valorAulaCentavos > 0 && (materialIsentaTaxa(valorAulaCentavos, m.precoCentavos) ? ' · isenta sua aula' : ' · não isenta seu preço atual')}
                      </span>
                    </span>
                    {materialIsentaTaxa(valorAulaCentavos, m.precoCentavos) && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </button>
                </li>
              ))}
          </ul>
        </div>
      ) : (
        <button type="button" onClick={() => setAberto(true)} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-dashed border-primary/50 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/5">
          <BookOpen className="h-4 w-4" /> Escolher material oficial
        </button>
      )}
    </section>
  )
}

function Capa({ url }: { url: string | null }) {
  if (!url) {
    return (
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <BookOpen className="h-5 w-5" />
      </span>
    )
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" loading="lazy" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
}
