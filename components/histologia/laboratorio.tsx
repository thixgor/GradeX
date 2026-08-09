'use client'

import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Check, RotateCcw, X } from 'lucide-react'

import {
  ARTEFATOS,
  ETAPAS_DO_PROCESSAMENTO,
  type Artefato,
  type EtapaDoProcesso,
} from '@/lib/histologia/laboratorio'
import { registrarEvento } from '@/lib/histologia/analitica'
import { useProgresso } from '@/lib/histologia/progresso'
import { embaralharComSemente, semented } from '@/lib/histologia/texto'

/**
 * Atividades interativas do laboratório virtual.
 *
 * ## O que estas simulações fazem — e o que recusam fazer
 *
 * Elas ensinam **modelo e consequência**: por que a autólise começa antes da
 * fixação, por que inverter desidratação e diafanização é quimicamente
 * impossível, com o que cada artefato se confunde na hora de ler a lâmina.
 *
 * Elas **não** desenham uma lâmina "mal fixada" nem colorem um corte fictício
 * de roxo para simular hematoxilina. Um desfoque arbitrário não é aberração
 * óptica e uma cor inventada não é reação histoquímica — desenhar isso ensinaria
 * uma falsidade convincente, que é pior do que não ensinar.
 */

/* ─────────────────── Da coleta à lâmina ─────────────────── */

export function LinhaDoProcessamento({ moduloId }: { moduloId: string }) {
  const { concluirLaboratorio } = useProgresso()
  const [aberta, setAberta] = useState<string | null>(ETAPAS_DO_PROCESSAMENTO[0].id)
  const [vistas, setVistas] = useState<Set<string>>(new Set([ETAPAS_DO_PROCESSAMENTO[0].id]))

  const abrir = (etapa: EtapaDoProcesso) => {
    const proxima = aberta === etapa.id ? null : etapa.id
    setAberta(proxima)
    if (proxima) {
      const novas = new Set(vistas).add(etapa.id)
      setVistas(novas)
      if (novas.size === ETAPAS_DO_PROCESSAMENTO.length) {
        concluirLaboratorio(moduloId)
        registrarEvento({ nome: 'laboratorio_concluido', modulo: moduloId })
      }
    }
  }

  return (
    <div>
      <p className="mb-3 text-xs text-muted-foreground" aria-live="polite">
        {vistas.size} de {ETAPAS_DO_PROCESSAMENTO.length} etapas percorridas
      </p>

      <ol className="relative space-y-2 border-l-2 border-border pl-5">
        {ETAPAS_DO_PROCESSAMENTO.map((etapa, i) => {
          const expandida = aberta === etapa.id
          return (
            <li key={etapa.id} className="relative">
              <span
                aria-hidden
                className={`absolute -left-[27px] top-3 flex h-4 w-4 items-center justify-center rounded-full border-2 text-[9px] font-black ${
                  vistas.has(etapa.id)
                    ? 'border-teal-700 bg-teal-700 text-white'
                    : 'border-border bg-background text-muted-foreground'
                }`}
              >
                {i + 1}
              </span>

              <button
                type="button"
                onClick={() => abrir(etapa)}
                aria-expanded={expandida}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  expandida ? 'border-teal-600 bg-teal-500/[0.06]' : 'border-border bg-card hover:border-teal-500/45'
                }`}
              >
                <span className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-bold">{etapa.titulo}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {etapa.duracaoTipica}
                  </span>
                </span>
              </button>

              {expandida && (
                <dl className="mt-1.5 space-y-2 rounded-lg border border-border bg-muted/20 p-3 text-xs leading-relaxed">
                  <div>
                    <dt className="font-bold">O que acontece com o tecido</dt>
                    <dd className="mt-0.5 text-muted-foreground">{etapa.oQueAcontece}</dd>
                  </div>
                  <div>
                    <dt className="font-bold">Por que esta etapa existe</dt>
                    <dd className="mt-0.5 text-muted-foreground">{etapa.porQue}</dd>
                  </div>
                  <div>
                    <dt className="font-bold text-rose-800 dark:text-rose-300">
                      O que aparece na lâmina se falhar
                    </dt>
                    <dd className="mt-0.5 text-muted-foreground">{etapa.seFalhar}</dd>
                  </div>
                </dl>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/* ─────────────────── Ordem impossível ─────────────────── */

export function OrdemImpossivel({ moduloId }: { moduloId: string }) {
  const { concluirLaboratorio } = useProgresso()
  // Semente fixa: o embaralhamento inicial é sempre o mesmo, então recarregar a
  // página não devolve um exercício diferente no meio da tentativa.
  const inicial = useMemo(
    () => embaralharComSemente(ETAPAS_DO_PROCESSAMENTO, semented('ordem-impossivel')),
    [],
  )
  const [ordem, setOrdem] = useState<EtapaDoProcesso[]>(inicial)
  const [conferido, setConferido] = useState(false)

  const correta = ETAPAS_DO_PROCESSAMENTO.map((e) => e.id)
  const acertos = ordem.filter((e, i) => e.id === correta[i]).length
  const tudoCerto = acertos === correta.length

  const mover = (indice: number, direcao: -1 | 1) => {
    const destino = indice + direcao
    if (destino < 0 || destino >= ordem.length) return
    const nova = [...ordem]
    ;[nova[indice], nova[destino]] = [nova[destino], nova[indice]]
    setOrdem(nova)
    setConferido(false)
  }

  const conferir = () => {
    setConferido(true)
    if (acertos === correta.length) {
      concluirLaboratorio(moduloId)
      registrarEvento({ nome: 'laboratorio_concluido', modulo: moduloId })
    }
  }

  return (
    <div>
      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
        Coloque as etapas na ordem correta. Use os botões de mover — a atividade é operável
        inteiramente por teclado, sem arrastar.
      </p>

      <ol className="space-y-2">
        {ordem.map((etapa, i) => {
          const posicaoCerta = etapa.id === correta[i]
          return (
            <li
              key={etapa.id}
              className={`flex items-center gap-2 rounded-lg border p-2.5 ${
                conferido
                  ? posicaoCerta
                    ? 'border-emerald-600 bg-emerald-500/[0.07]'
                    : 'border-rose-600 bg-rose-500/[0.07]'
                  : 'border-border bg-card'
              }`}
            >
              <span aria-hidden className="w-5 shrink-0 text-center font-mono text-xs text-muted-foreground">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 text-sm font-medium">{etapa.titulo}</span>

              {conferido && (
                <span
                  className={`shrink-0 text-xs font-bold ${
                    posicaoCerta ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                  }`}
                >
                  {posicaoCerta ? (
                    <>
                      <Check className="inline h-4 w-4" aria-hidden />
                      <span className="sr-only">posição correta</span>
                    </>
                  ) : (
                    <>
                      <X className="inline h-4 w-4" aria-hidden />
                      <span className="sr-only">
                        posição incorreta; o correto nesta posição é{' '}
                        {ETAPAS_DO_PROCESSAMENTO[i].titulo}
                      </span>
                    </>
                  )}
                </span>
              )}

              <span className="flex shrink-0 gap-0.5">
                <button
                  type="button"
                  onClick={() => mover(i, -1)}
                  disabled={i === 0}
                  aria-label={`Mover ${etapa.titulo} para cima`}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-border transition-colors hover:border-teal-500/50 disabled:opacity-30"
                >
                  <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => mover(i, 1)}
                  disabled={i === ordem.length - 1}
                  aria-label={`Mover ${etapa.titulo} para baixo`}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-border transition-colors hover:border-teal-500/50 disabled:opacity-30"
                >
                  <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                </button>
              </span>
            </li>
          )
        })}
      </ol>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={conferir}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md bg-teal-700 px-4 text-sm font-bold text-white transition-colors hover:bg-teal-800"
        >
          Conferir a sequência
        </button>
        <button
          type="button"
          onClick={() => {
            setOrdem(inicial)
            setConferido(false)
          }}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-border px-4 text-sm font-bold transition-colors hover:border-teal-500/50"
        >
          <RotateCcw className="h-4 w-4" aria-hidden /> Recomeçar
        </button>
      </div>

      {conferido && (
        <div
          role="status"
          className={`mt-4 rounded-lg border p-4 ${
            tudoCerto ? 'border-emerald-600/40 bg-emerald-500/[0.07]' : 'border-amber-600/40 bg-amber-500/[0.07]'
          }`}
        >
          <p className="text-sm font-bold">
            {acertos} de {correta.length} na posição certa
          </p>
          {!tudoCerto && (
            <div className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
              <p className="font-semibold text-foreground">Por que a ordem é essa:</p>
              <p>
                <strong>Fixação antes de tudo</strong> — enquanto o tecido não estiver fixado, as
                enzimas lisossômicas seguem digerindo as próprias células. Nenhuma etapa posterior
                recupera o que a autólise destruiu.
              </p>
              <p>
                <strong>Desidratação antes da diafanização</strong> — o xilol não é miscível com
                água. Levar tecido hidratado direto ao clareamento simplesmente não funciona: o
                solvente não penetra.
              </p>
              <p>
                <strong>Diafanização antes da inclusão</strong> — a parafina não se mistura com
                álcool. O solvente intermediário existe exatamente para fazer essa ponte.
              </p>
              <p>
                <strong>Banho-maria antes da coloração</strong> — o corte sai do micrótomo
                comprimido. Corar antes de distender fixaria a deformação, e toda medida
                morfométrica sairia errada.
              </p>
              <p>
                <strong>Montagem por último</strong> — a lamínula sela o corte. Depois dela não há
                mais acesso ao tecido.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─────────────────── Diagnóstico de artefatos ─────────────────── */

export function DiagnosticoDeArtefatos({ moduloId }: { moduloId: string }) {
  const { concluirLaboratorio } = useProgresso()
  const [indice, setIndice] = useState(0)
  const [escolhas, setEscolhas] = useState<Record<string, string>>({})
  const artefato: Artefato = ARTEFATOS[indice]
  const escolhida = escolhas[artefato.id]
  const acertou = escolhida === artefato.etapaCulpada

  const avancar = () => {
    if (indice < ARTEFATOS.length - 1) {
      setIndice(indice + 1)
      return
    }
    concluirLaboratorio(moduloId)
    registrarEvento({ nome: 'laboratorio_concluido', modulo: moduloId })
  }

  return (
    <div>
      <p className="mb-3 text-xs text-muted-foreground" aria-live="polite">
        Artefato {indice + 1} de {ARTEFATOS.length}
      </p>

      <article className="histologia-cartao p-4">
        <h3 className="font-heading text-lg font-semibold">{artefato.nome}</h3>

        <div className="mt-3 rounded-lg border border-border bg-muted/25 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Como aparece na lâmina
          </p>
          <p className="mt-1 text-sm leading-relaxed">{artefato.aparencia}</p>
        </div>

        <fieldset className="mt-4">
          <legend className="mb-2 text-sm font-semibold">
            Qual etapa do processamento é a responsável?
          </legend>
          <div role="radiogroup" aria-label="Etapa responsável" className="grid gap-1.5 sm:grid-cols-2">
            {ETAPAS_DO_PROCESSAMENTO.map((etapa) => {
              const marcada = escolhida === etapa.id
              const revela = !!escolhida && (marcada || etapa.id === artefato.etapaCulpada)
              return (
                <label
                  key={etapa.id}
                  className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-xs transition-colors ${
                    revela
                      ? etapa.id === artefato.etapaCulpada
                        ? 'border-emerald-600 bg-emerald-500/10'
                        : 'border-rose-600 bg-rose-500/10'
                      : 'border-border hover:border-teal-500/45'
                  }`}
                >
                  <input
                    type="radio"
                    name={`artefato-${artefato.id}`}
                    checked={marcada}
                    disabled={!!escolhida}
                    onChange={() => setEscolhas((e) => ({ ...e, [artefato.id]: etapa.id }))}
                    className="h-4 w-4 shrink-0 accent-teal-700"
                  />
                  <span className="flex-1 font-medium">{etapa.titulo}</span>
                  {revela && etapa.id === artefato.etapaCulpada && (
                    <Check className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden />
                  )}
                </label>
              )
            })}
          </div>
        </fieldset>

        {escolhida && (
          <div
            role="status"
            className={`mt-4 rounded-lg border p-3 ${
              acertou ? 'border-emerald-600/40 bg-emerald-500/[0.07]' : 'border-amber-600/40 bg-amber-500/[0.07]'
            }`}
          >
            <p className="text-sm font-bold">
              {acertou ? 'Isso mesmo.' : `A etapa responsável é: ${nomeDaEtapa(artefato.etapaCulpada)}.`}
            </p>
            <dl className="mt-2 space-y-1.5 text-xs leading-relaxed">
              <div>
                <dt className="inline font-semibold">Causa: </dt>
                <dd className="inline text-muted-foreground">{artefato.causa}</dd>
              </div>
              <div>
                <dt className="inline font-semibold">Como corrigir o processo: </dt>
                <dd className="inline text-muted-foreground">{artefato.correcao}</dd>
              </div>
              <div>
                <dt className="inline font-semibold text-rose-800 dark:text-rose-300">
                  Com o que se confunde:{' '}
                </dt>
                <dd className="inline text-muted-foreground">{artefato.confundeCom}</dd>
              </div>
            </dl>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={indice === 0}
            onClick={() => setIndice(indice - 1)}
            className="inline-flex min-h-[40px] items-center rounded-md border border-border px-3 text-xs font-semibold transition-colors hover:border-teal-500/50 disabled:opacity-40"
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={!escolhida}
            onClick={avancar}
            className="ml-auto inline-flex min-h-[40px] items-center rounded-md bg-teal-700 px-4 text-xs font-bold text-white transition-colors hover:bg-teal-800 disabled:opacity-40"
          >
            {indice === ARTEFATOS.length - 1 ? 'Concluir módulo' : 'Próximo artefato'}
          </button>
        </div>
      </article>
    </div>
  )
}

function nomeDaEtapa(id: string): string {
  return ETAPAS_DO_PROCESSAMENTO.find((e) => e.id === id)?.titulo ?? id
}
