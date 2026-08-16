'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Copy, FileText, ListOrdered, Search, X } from 'lucide-react'
import { formatarTempo } from '@/lib/aulas/progresso'
import {
  buscarNaTranscricao,
  capituloAtual,
  transcricaoEmTexto,
  type Capitulo,
  type TrechoDaTranscricao,
} from '@/lib/aulas/marcadores'
import type { ControleDoPlayer } from '@/components/aulas/player'
import { cn } from '@/lib/utils'

/**
 * Capítulos (§11) e transcrição (§10) ao lado do player.
 *
 * As duas respondem a mesma pergunta — "onde está a parte que eu preciso?" — em
 * escalas diferentes: o capítulo navega por assunto, a transcrição navega por
 * palavra. Ficam em abas porque disputam exatamente o mesmo espaço e nunca são
 * usadas ao mesmo tempo.
 *
 * A transcrição vale a pena mesmo para quem nunca a lê de ponta a ponta: é a
 * única forma de responder "onde ele falou de varfarina?" sem reassistir 40
 * minutos. Por isso a busca é o primeiro elemento da aba, e não um extra
 * escondido no rodapé.
 *
 * Com vídeo em iframe não dá para navegar por tempo (`navegavel: false`). Aí os
 * itens deixam de ser botões e a aba avisa — carimbo que não leva a lugar nenhum
 * é pior que carimbo nenhum, porque promete o que não cumpre.
 */

type Aba = 'capitulos' | 'transcricao'

export function PainelDeMarcadores({
  capitulos,
  transcricao,
  controle,
  className,
}: {
  capitulos?: Capitulo[] | null
  transcricao?: TrechoDaTranscricao[] | null
  controle: ControleDoPlayer | null
  className?: string
}) {
  const temCapitulos = (capitulos?.length || 0) > 0
  const temTranscricao = (transcricao?.length || 0) > 0

  const [aba, setAba] = useState<Aba>(temCapitulos ? 'capitulos' : 'transcricao')
  const [busca, setBusca] = useState('')
  const [segundo, setSegundo] = useState(0)
  const [copiado, setCopiado] = useState(false)

  const navegavel = controle?.navegavel === true

  /*
   * Acompanha o tempo do vídeo para destacar o capítulo atual.
   *
   * Por sondagem de um em um segundo, e não por evento: o player expõe
   * `tempoAtual()` mas não emite mudança de tempo, e um segundo é fino o
   * bastante para o destaque parecer imediato sem repintar a lista à toa.
   */
  useEffect(() => {
    if (!navegavel || !temCapitulos) return
    const timer = setInterval(() => setSegundo(Math.floor(controle?.tempoAtual() || 0)), 1000)
    return () => clearInterval(timer)
  }, [controle, navegavel, temCapitulos])

  const indiceAtivo = useMemo(
    () => (temCapitulos ? capituloAtual(capitulos || [], segundo) : -1),
    [capitulos, segundo, temCapitulos],
  )

  const trechosVisiveis = useMemo(
    () => buscarNaTranscricao(transcricao || [], busca),
    [transcricao, busca],
  )

  const refAtivo = useRef<HTMLLIElement>(null)
  useEffect(() => {
    // Rola a lista, não a página: `block: 'nearest'` mantém o vídeo no lugar.
    refAtivo.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [indiceAtivo])

  if (!temCapitulos && !temTranscricao) return null

  async function copiarTranscricao() {
    try {
      await navigator.clipboard.writeText(transcricaoEmTexto(transcricao || []))
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1800)
    } catch {
      /* área de transferência indisponível — silencioso por design */
    }
  }

  return (
    <div className={cn('rounded-xl border border-border bg-card', className)}>
      {/* ── Abas ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-border p-1.5">
        {temCapitulos ? (
          <BotaoDeAba ativa={aba === 'capitulos'} onClick={() => setAba('capitulos')} icone={ListOrdered}>
            Capítulos
            <span className="ml-1 tabular-nums opacity-60">{capitulos?.length}</span>
          </BotaoDeAba>
        ) : null}
        {temTranscricao ? (
          <BotaoDeAba ativa={aba === 'transcricao'} onClick={() => setAba('transcricao')} icone={FileText}>
            Transcrição
          </BotaoDeAba>
        ) : null}

        {aba === 'transcricao' && temTranscricao ? (
          <button
            type="button"
            onClick={copiarTranscricao}
            className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11.5px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            {copiado ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
            {copiado ? 'Copiado' : 'Copiar'}
          </button>
        ) : null}
      </div>

      {!navegavel ? (
        <p className="border-b border-border px-3 py-2 text-[11.5px] leading-relaxed text-muted-foreground">
          Vídeo incorporado: dá para ler e buscar, mas não para pular até o momento.
        </p>
      ) : null}

      {/* ── Capítulos ─────────────────────────────────────────────────── */}
      {aba === 'capitulos' && temCapitulos ? (
        <ul className="max-h-[22rem] overflow-y-auto p-1.5">
          {(capitulos || []).map((capitulo, i) => {
            const ativo = i === indiceAtivo
            return (
              <li key={`${capitulo.segundo}-${i}`} ref={ativo ? refAtivo : undefined}>
                <ItemComTempo
                  segundo={capitulo.segundo}
                  ativo={ativo}
                  navegavel={navegavel}
                  onIr={() => controle?.irPara(capitulo.segundo)}
                >
                  {capitulo.titulo}
                </ItemComTempo>
              </li>
            )
          })}
        </ul>
      ) : null}

      {/* ── Transcrição ───────────────────────────────────────────────── */}
      {aba === 'transcricao' && temTranscricao ? (
        <div>
          <div className="relative border-b border-border p-1.5">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar na transcrição..."
              className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-8 text-xs outline-none transition focus:border-primary/50"
            />
            {busca ? (
              <button
                type="button"
                onClick={() => setBusca('')}
                aria-label="Limpar busca"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          {trechosVisiveis.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-muted-foreground">
              Nada com esse termo na transcrição.
            </p>
          ) : (
            <>
              {busca.trim().length >= 2 ? (
                <p className="px-3 pt-2 text-[11px] text-muted-foreground">
                  {trechosVisiveis.length} trecho(s)
                </p>
              ) : null}
              <ul className="max-h-[22rem] overflow-y-auto p-1.5">
                {trechosVisiveis.map((trecho, i) => (
                  <li key={`${trecho.segundo}-${i}`}>
                    <ItemComTempo
                      segundo={trecho.segundo}
                      navegavel={navegavel}
                      onIr={() => controle?.irPara(trecho.segundo)}
                    >
                      {trecho.texto}
                    </ItemComTempo>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}

/**
 * Uma linha com carimbo.
 *
 * Vira `<div>` quando não dá para navegar: um `<button>` que não faz nada é
 * pior do que texto — ele é focável pelo teclado e anunciado como acionável
 * pelo leitor de tela, prometendo uma ação que não existe.
 */
function ItemComTempo({
  segundo,
  ativo,
  navegavel,
  onIr,
  children,
}: {
  segundo: number
  ativo?: boolean
  navegavel: boolean
  onIr: () => void
  children: React.ReactNode
}) {
  const conteudo = (
    <>
      <span
        className={cn(
          'mt-0.5 flex-none rounded-md px-1.5 py-0.5 font-mono text-[11px] font-bold tabular-nums',
          ativo ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary',
        )}
      >
        {formatarTempo(segundo)}
      </span>
      <span className={cn('min-w-0 flex-1 text-xs leading-relaxed', ativo && 'font-semibold')}>
        {children}
      </span>
    </>
  )

  const classe = cn(
    'flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition',
    ativo && 'bg-primary/10',
  )

  if (!navegavel) return <div className={classe}>{conteudo}</div>

  return (
    <button type="button" onClick={onIr} className={cn(classe, 'hover:bg-muted')}>
      {conteudo}
    </button>
  )
}

function BotaoDeAba({
  ativa,
  onClick,
  icone: Icone,
  children,
}: {
  ativa: boolean
  onClick: () => void
  icone: typeof ListOrdered
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativa}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-semibold transition',
        ativa ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted',
      )}
    >
      <Icone className="h-3.5 w-3.5" />
      {children}
    </button>
  )
}
