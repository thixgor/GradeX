'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AlertTriangle, Download, Star, Trash2 } from 'lucide-react'

import { VERSAO_ATUAL, useProgresso } from '@/lib/histologia/progresso'
import { rotaDaPagina } from '@/lib/histologia/rotas'

/**
 * Caderno e gestão de dados.
 *
 * Exportar e apagar não são cortesias: são o contrato que torna aceitável
 * guardar o progresso do aluno sem conta. Ele precisa poder levar embora e
 * precisa poder sumir — as duas coisas em um clique, sem falar com ninguém.
 */
export function Caderno() {
  const { progresso, carregado, salvarNota, alternarFavorito, apagarTudo, exportar } = useProgresso()
  const [confirmandoApagar, setConfirmandoApagar] = useState(false)

  if (!carregado) {
    return <div className="h-64 animate-pulse rounded-xl border border-border bg-muted/40" />
  }

  const notas = Object.entries(progresso.caderno).sort(
    (a, b) => b[1].atualizadoEm - a[1].atualizadoEm,
  )
  const favoritos = Object.entries(progresso.favoritos).sort((a, b) => b[1] - a[1])
  const aRevisar = Object.keys(progresso.aRevisar)
  const concluidas = Object.keys(progresso.concluidas)
  const quizzes = Object.entries(progresso.quizzes)

  const baixar = () => {
    const conteudo = exportar()
    const url = URL.createObjectURL(new Blob([conteudo], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `manual-da-histologia-progresso-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    // Sem isto, o Blob fica retido na memória da aba até o fechamento.
    URL.revokeObjectURL(url)
  }

  const vazio =
    notas.length === 0 &&
    favoritos.length === 0 &&
    aRevisar.length === 0 &&
    concluidas.length === 0 &&
    quizzes.length === 0

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Cartao rotulo="Lâminas concluídas" valor={concluidas.length} />
        <Cartao rotulo="Favoritas" valor={favoritos.length} />
        <Cartao rotulo="Estruturas a revisar" valor={aRevisar.length} />
        <Cartao rotulo="Notas no caderno" valor={notas.length} />
      </dl>

      {vazio && (
        <p className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          Ainda não há nada guardado. Abra uma lâmina, favorite o que quiser rever e escreva suas
          notas — tudo aparece aqui.
        </p>
      )}

      {notas.length > 0 && (
        <section aria-labelledby="notas">
          <h2 id="notas" className="mb-3 font-heading text-lg font-semibold">
            Notas de lâminas
          </h2>
          <ul className="space-y-2">
            {notas.map(([rota, nota]) => (
              <li key={rota} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={rotaDaPagina(rota)}
                    className="min-w-0 text-sm font-semibold hover:underline"
                  >
                    {rota.split('/').at(-1)?.replace(/-/g, ' ')}
                  </Link>
                  <button
                    type="button"
                    onClick={() => salvarNota(rota, '')}
                    aria-label={`Apagar a nota de ${rota.split('/').at(-1)}`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                  {nota.texto}
                </p>
                <p className="mt-1.5 text-[10px] text-muted-foreground/70">
                  {new Date(nota.atualizadoEm).toLocaleString('pt-BR')}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {favoritos.length > 0 && (
        <section aria-labelledby="favoritas">
          <h2 id="favoritas" className="mb-3 font-heading text-lg font-semibold">
            Favoritas
          </h2>
          <ul className="space-y-1.5">
            {favoritos.map(([rota]) => (
              <li
                key={rota}
                className="flex min-h-[44px] items-center justify-between gap-2 rounded-lg border border-border bg-card px-3"
              >
                <Link href={rotaDaPagina(rota)} className="min-w-0 py-2 text-sm hover:underline">
                  {rota.split('/').at(-1)?.replace(/-/g, ' ')}
                </Link>
                <button
                  type="button"
                  onClick={() => alternarFavorito(rota)}
                  aria-label={`Remover ${rota.split('/').at(-1)} dos favoritos`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-amber-600 hover:bg-muted"
                >
                  <Star className="h-4 w-4 fill-current" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {aRevisar.length > 0 && (
        <section aria-labelledby="revisar">
          <h2 id="revisar" className="mb-3 font-heading text-lg font-semibold">
            Estruturas marcadas para revisar
          </h2>
          <ul className="flex flex-wrap gap-1.5">
            {aRevisar.map((chave) => {
              const [rota, overlay] = chave.split('#')
              return (
                <li key={chave}>
                  <Link
                    href={`${rotaDaPagina(rota)}?estrutura=${encodeURIComponent(overlay)}`}
                    className="inline-flex min-h-[36px] items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-3 text-xs font-medium hover:border-amber-500"
                  >
                    {overlay.replace(/-/g, ' ')}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {quizzes.length > 0 && (
        <section aria-labelledby="resultados">
          <h2 id="resultados" className="mb-3 font-heading text-lg font-semibold">
            Melhores resultados nos quizzes
          </h2>
          <ul className="space-y-1.5">
            {quizzes.map(([slug, resultado]) => (
              <li
                key={slug}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-3"
              >
                <span className="text-sm font-medium capitalize">{slug.replace(/-/g, ' ')}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {resultado.acertos}/{resultado.total}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Gestão de dados ── */}
      <section aria-labelledby="dados" className="rounded-xl border border-border bg-muted/20 p-4">
        <h2 id="dados" className="font-heading text-lg font-semibold">
          Seus dados
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Tudo o que aparece nesta página está no armazenamento local deste navegador, no formato
          versão {VERSAO_ATUAL}. Nenhuma nota, resposta ou termo de busca é enviado a servidor
          nenhum — a telemetria do módulo registra apenas categorias (lâmina aberta, quiz iniciado)
          e nunca conteúdo.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={baixar}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-border bg-card px-4 text-sm font-bold transition-colors hover:border-teal-500/50"
          >
            <Download className="h-4 w-4" aria-hidden />
            Exportar em JSON
          </button>

          {confirmandoApagar ? (
            <span className="inline-flex flex-wrap items-center gap-2 rounded-md border border-rose-600/40 bg-rose-500/10 p-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                <AlertTriangle className="h-4 w-4" aria-hidden />
                Apagar tudo? Não dá para desfazer.
              </span>
              <button
                type="button"
                onClick={() => {
                  apagarTudo()
                  setConfirmandoApagar(false)
                }}
                className="inline-flex min-h-[36px] items-center rounded-md bg-rose-600 px-3 text-xs font-bold text-white"
              >
                Apagar
              </button>
              <button
                type="button"
                onClick={() => setConfirmandoApagar(false)}
                className="inline-flex min-h-[36px] items-center rounded-md border border-border bg-card px-3 text-xs font-bold"
              >
                Cancelar
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmandoApagar(true)}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-rose-600/40 px-4 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-500/10 dark:text-rose-400"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Apagar meus dados
            </button>
          )}
        </div>
      </section>
    </div>
  )
}

function Cartao({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <dt className="text-[10px] font-medium leading-tight text-muted-foreground">{rotulo}</dt>
      <dd className="mt-0.5 font-heading text-2xl font-semibold tabular-nums">{valor}</dd>
    </div>
  )
}
