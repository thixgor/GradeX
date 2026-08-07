'use client'

import { useEffect, useRef } from 'react'
import {
  X,
  Crosshair,
  Ruler,
  Stethoscope,
  AlertTriangle,
  Check,
  Layers3,
  Activity,
  Contrast,
  Compass,
  MapPin,
} from 'lucide-react'
import type { EstruturaTC } from '@/lib/tomografia/tipos'
import { COR_CATEGORIA, ICONE_CATEGORIA, ROTULO_CATEGORIA, tema } from './tema'

interface DossieProps {
  estrutura: EstruturaTC
  /** Vai para o corte em que a estrutura aparece rotulada. */
  onIrParaCorte?: (corte: number) => void
  corteAtual?: number
  estudada: boolean
  onAlternarEstudada: () => void
  onFechar?: () => void
  /** Quando true, o painel é o conteúdo de uma folha inferior (celular). */
  comoFolha?: boolean
}

/**
 * Ficha completa de uma estrutura.
 *
 * A ordem das seções não é arbitrária: reproduz o raciocínio de quem está
 * diante da imagem — primeiro "o que é isso", depois "como eu acho", depois
 * "o que muda se estiver doente". Por isso `comoIdentificar` e `reparos`
 * aparecem antes da clínica, e não no fim como um apêndice.
 */
export function Dossie({
  estrutura,
  onIrParaCorte,
  corteAtual,
  estudada,
  onAlternarEstudada,
  onFechar,
  comoFolha = false,
}: DossieProps) {
  const t = tema(COR_CATEGORIA[estrutura.categoria])
  const Icone = ICONE_CATEGORIA[estrutura.categoria]
  const topoRef = useRef<HTMLDivElement>(null)

  // Trocar de estrutura precisa voltar ao topo: sem isso, quem estava lendo as
  // alterações da estrutura anterior abre a próxima já no meio do texto.
  useEffect(() => {
    topoRef.current?.scrollTo({ top: 0 })
  }, [estrutura.id])

  const cortes = estrutura.cortes || []

  return (
    /* A altura máxima fica AQUI, no próprio contêiner flex, e não no wrapper de
       fora. Com `h-full` dentro de um pai de altura automática, a porcentagem
       resolvia para `auto`: a ficha crescia com o texto, o `flex-1` do corpo
       nunca ganhava altura para rolar e a folha saía cortada embaixo — a parte
       de clínica e alterações ficava inalcançável no celular. */
    <div
      className={
        comoFolha
          ? 'glass-sheet flex max-h-[86vh] flex-col overflow-hidden rounded-t-2xl'
          : 'flex flex-col overflow-hidden rounded-2xl border border-border bg-card'
      }
    >
      {/* Puxador da folha — sinaliza que o painel rola e que dá para fechar */}
      {comoFolha && (
        <div className="flex shrink-0 justify-center pb-1 pt-2.5">
          <span className="h-1 w-9 rounded-full bg-foreground/20" />
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex shrink-0 items-start gap-3 border-b border-border p-4">
        <div className={`shrink-0 rounded-lg ${t.bg} p-2`}>
          <Icone className={`h-5 w-5 ${t.text}`} />
        </div>
        <div className="min-w-0 flex-1">
          <span className={`text-[10px] font-black uppercase tracking-wider ${t.text}`}>
            {ROTULO_CATEGORIA[estrutura.categoria]}
          </span>
          <h3 className="font-heading text-lg font-semibold leading-tight tracking-tight">{estrutura.nome}</h3>
          {estrutura.sinonimos && estrutura.sinonimos.length > 0 && (
            <p className="mt-0.5 text-xs text-muted-foreground">{estrutura.sinonimos.join(' · ')}</p>
          )}
        </div>
        {onFechar && (
          <button
            onClick={onFechar}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Fechar ficha"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Ações */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
        {cortes.length > 0 && onIrParaCorte && (
          <button
            onClick={() => onIrParaCorte(cortes[Math.floor(cortes.length / 2)])}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-[11px] font-bold text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98]"
          >
            <Crosshair className="h-3.5 w-3.5" />
            Ir para o corte
          </button>
        )}
        <button
          onClick={onAlternarEstudada}
          className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-bold transition active:scale-[0.98] ${
            estudada
              ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
              : 'border border-border bg-muted/40 text-muted-foreground hover:text-foreground'
          }`}
        >
          <Check className="h-3.5 w-3.5" />
          {estudada ? 'Estudada' : 'Marcar como estudada'}
        </button>
        {cortes.length > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/70">
            <Layers3 className="h-3 w-3" />
            {cortes.length === 1 ? `corte ${cortes[0]}` : `${cortes.length} cortes`}
          </span>
        )}
      </div>

      {/* Corpo */}
      {/* min-h-0: item de flex em coluna nasce com `min-height: auto` e se
          recusa a encolher abaixo do conteúdo — sem isto o `overflow-y-auto`
          não tem o que rolar. `overscroll-contain` impede que o fim da rolagem
          da ficha continue arrastando a página atrás dela.
          `flex-auto` e não `flex-1`: a base `auto` faz a ficha curta medir o
          próprio conteúdo. Com base zero, um contêiner de altura automática não
          tem espaço livre para distribuir e o Firefox devolve altura zero. */}
      <div ref={topoRef} className="min-h-0 flex-auto space-y-4 overflow-y-auto overscroll-contain p-4">
        <p className="text-sm leading-relaxed text-foreground/90">{estrutura.resumo}</p>

        {cortes.length > 1 && onIrParaCorte && (
          <Bloco icone={MapPin} titulo="Cortes em que aparece">
            <div className="flex flex-wrap gap-1.5">
              {cortes.map((c) => (
                <button
                  key={c}
                  onClick={() => onIrParaCorte(c)}
                  className={`h-7 min-w-[2rem] rounded-md px-1.5 font-mono text-[11px] font-bold transition ${
                    corteAtual === c
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted-foreground/20 hover:text-foreground'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </Bloco>
        )}

        <Bloco icone={Compass} titulo="Como encontrar na imagem" destaque>
          <p className="text-sm leading-relaxed text-foreground/85">{estrutura.comoIdentificar}</p>
          {estrutura.reparos.length > 0 && (
            <ul className="mt-2.5 space-y-1">
              {estrutura.reparos.map((r) => (
                <li key={r} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                  {r}
                </li>
              ))}
            </ul>
          )}
        </Bloco>

        <Bloco icone={Contrast} titulo="Densidade e janela">
          <p className="text-sm leading-relaxed text-foreground/85">{estrutura.densidade}</p>
          <p className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            <strong className="font-semibold text-foreground/80">Janela ideal:</strong> {estrutura.janela}
          </p>
        </Bloco>

        <Bloco icone={Layers3} titulo="Morfologia">
          <p className="text-sm leading-relaxed text-foreground/85">{estrutura.morfologia}</p>
        </Bloco>

        <Bloco icone={Activity} titulo="Função">
          <p className="text-sm leading-relaxed text-foreground/85">{estrutura.funcao}</p>
        </Bloco>

        {estrutura.medidas && estrutura.medidas.length > 0 && (
          <Bloco icone={Ruler} titulo="Medidas de referência">
            <dl className="grid gap-1.5">
              {estrutura.medidas.map((m) => (
                <div
                  key={m.rotulo}
                  className="flex items-baseline justify-between gap-3 rounded-lg bg-muted/40 px-3 py-1.5"
                >
                  <dt className="text-xs text-muted-foreground">{m.rotulo}</dt>
                  <dd className="font-mono text-xs font-bold text-foreground">{m.valor}</dd>
                </div>
              ))}
            </dl>
          </Bloco>
        )}

        <Bloco icone={Stethoscope} titulo="Importância clínica" destaque>
          <p className="text-sm leading-relaxed text-foreground/85">{estrutura.clinica}</p>
        </Bloco>

        <Bloco icone={AlertTriangle} titulo="Alterações e como aparecem na TC">
          <div className="space-y-2">
            {estrutura.alteracoes.map((a) => (
              <div key={a.nome} className="rounded-lg border border-border bg-muted/25 p-3">
                <p className="text-xs font-bold text-foreground">{a.nome}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{a.achado}</p>
              </div>
            ))}
          </div>
        </Bloco>

        {estrutura.armadilhas && estrutura.armadilhas.length > 0 && (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.07] p-3.5">
            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" /> Armadilhas de leitura
            </p>
            <ul className="space-y-1.5">
              {estrutura.armadilhas.map((a) => (
                <li key={a} className="flex items-start gap-2 text-xs leading-relaxed text-foreground/80">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* respiro no fim da folha, respeitando a faixa do indicador do iPhone */}
        {comoFolha && <div className="h-[calc(0.5rem+env(safe-area-inset-bottom))]" />}
      </div>
    </div>
  )
}

function Bloco({
  icone: Icone,
  titulo,
  destaque = false,
  children,
}: {
  icone: React.ComponentType<{ className?: string }>
  titulo: string
  destaque?: boolean
  children: React.ReactNode
}) {
  return (
    <section className={destaque ? 'rounded-xl border border-primary/20 bg-primary/[0.04] p-3.5' : ''}>
      <h4 className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
        <Icone className="h-3.5 w-3.5" />
        {titulo}
      </h4>
      {children}
    </section>
  )
}
