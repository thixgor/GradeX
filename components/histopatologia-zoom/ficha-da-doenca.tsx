import Link from 'next/link'
import { BookOpen } from 'lucide-react'

import { SinalDePatologia } from '@/components/histologia-zoom/sinal-de-patologia'
import { achadoPorId } from '@/lib/histopatologia-zoom/achados'
import type { DoencaZoom } from '@/lib/histopatologia-zoom/tipos'

const PESO = { criterio: 'Critério', frequente: 'Frequente', ocasional: 'Ocasional' } as const

/**
 * Ficha da doença: definição, patogênese, roteiro de leitura da lâmina,
 * achados gerais e específicos, diferencial e correlação clínica.
 *
 * `compacto` é a versão do painel lateral do visualizador (tela cheia):
 * o essencial para ler a lâmina, sem o diferencial longo.
 */
export function FichaDaDoenca({ doenca, compacto = false }: { doenca: DoencaZoom; compacto?: boolean }) {
  const especificos = doenca.achados.filter((a) => a.tipo === 'especifico')
  const gerais = doenca.achados.filter((a) => a.tipo === 'geral')
  return (
    <div className={compacto ? 'space-y-4 text-sm' : 'space-y-7'}>
      <div>
        <p className={compacto ? 'leading-relaxed' : 'text-[15px] leading-relaxed'}>{doenca.resumo}</p>
        {!compacto && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{doenca.epidemiologia}</p>}
      </div>

      <Bloco titulo="Como ler a lâmina" compacto={compacto}>
        <ol className="space-y-1.5">
          {doenca.roteiro.map((t, i) => (
            <li key={t} className="flex gap-2.5 leading-relaxed">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-[11px] font-bold text-rose-800 dark:text-rose-200">
                {i + 1}
              </span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
      </Bloco>

      <div className={compacto ? 'space-y-4' : 'grid gap-6 md:grid-cols-2'}>
        <ListaDeAchados titulo="Achados específicos" itens={especificos} />
        <ListaDeAchados titulo="Achados gerais" itens={gerais} />
      </div>

      {!compacto && (
        <Bloco titulo="Patogênese — por que a lâmina fica assim">
          <ol className="space-y-1.5">
            {doenca.patogenese.map((t, i) => (
              <li key={t} className="flex gap-2.5 leading-relaxed">
                <span className="w-5 shrink-0 text-right font-mono text-xs text-muted-foreground">{i + 1}.</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </Bloco>
      )}

      <Bloco titulo="Comparando com o normal" compacto={compacto}>
        <Itens itens={doenca.comparacaoComNormal} />
      </Bloco>

      {!compacto && (
        <>
          <Bloco titulo="Diagnóstico diferencial">
            <ul className="space-y-2.5">
              {doenca.diferenciais.map((d) => (
                <li key={d.nome} className="rounded-lg border border-border bg-card px-3 py-2.5">
                  <p className="font-semibold leading-snug">{d.nome}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{d.comoSeparar}</p>
                </li>
              ))}
            </ul>
          </Bloco>
          <Bloco titulo="Correlação clínica">
            <Itens itens={doenca.correlacaoClinica} />
          </Bloco>
          {doenca.doencaDoManual && (
            <Link
              href={`/manual-clinico/histologia/histopatologia/doencas/${doenca.doencaDoManual}`}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-rose-500/40 px-3 text-sm font-semibold text-rose-800 hover:bg-rose-500/10 dark:text-rose-200"
            >
              <BookOpen className="h-4 w-4" aria-hidden /> Estudo completo da doença no Manual
            </Link>
          )}
        </>
      )}
    </div>
  )
}

function ListaDeAchados({ titulo, itens }: { titulo: string; itens: DoencaZoom['achados'] }) {
  if (!itens.length) return null
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        <SinalDePatologia className="h-3.5 w-3.5" /> {titulo}
      </h3>
      <ul className="space-y-2">
        {itens.map((a) => (
          <li key={a.achado} className="text-sm leading-relaxed">
            <span className="font-semibold">{achadoPorId(a.achado)?.nome ?? a.achado}</span>
            <span
              className={`ml-1.5 rounded px-1 py-px text-[10px] font-bold uppercase tracking-wide ${
                a.peso === 'criterio' ? 'bg-rose-600 text-white' : 'bg-muted text-muted-foreground'
              }`}
            >
              {PESO[a.peso]}
            </span>
            <span className="block text-muted-foreground">{a.comoAparece}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Bloco({ titulo, children, compacto = false }: { titulo: string; children: React.ReactNode; compacto?: boolean }) {
  return (
    <section>
      <h3
        className={
          compacto
            ? 'mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground'
            : 'mb-2.5 font-heading text-lg font-semibold tracking-tight'
        }
      >
        {titulo}
      </h3>
      <div className="text-sm">{children}</div>
    </section>
  )
}

function Itens({ itens }: { itens: string[] }) {
  return (
    <ul className="space-y-1.5">
      {itens.map((t) => (
        <li key={t} className="flex gap-2 leading-relaxed">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" aria-hidden />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  )
}
