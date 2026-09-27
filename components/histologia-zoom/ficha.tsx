import { Info, Microscope, Palette, ScanEye, Search, AlertTriangle } from 'lucide-react'

import type { Coloracao } from '@/lib/histologia-zoom/coloracoes'
import { GRUPOS, ORDEM_DOS_GRUPOS, TECIDOS } from '@/lib/histologia-zoom/tecidos'
import type { GrupoDeTecido, Orgao } from '@/lib/histologia-zoom/tipos'

/**
 * Ficha de características de uma lâmina.
 *
 * Sem estado e sem hooks: a mesma ficha é renderizada no servidor, na página
 * da lâmina, e dentro do visualizador em tela cheia (componente de cliente),
 * sem duplicar marcação.
 *
 * ## As porcentagens
 *
 * São estimativas didáticas, arredondadas a 5 %, e a ficha diz isso ao lado de
 * cada tabela. Número sem essa ressalva seria lido como morfometria — e o
 * aluno que o repetisse numa prova estaria repetindo uma medida que ninguém fez.
 *
 * ## Gráficos
 *
 * Duas formas só: barra de magnitude por linha (uma série, um tom) e uma barra
 * empilhada de composição por grupo de tecido, com legenda e rótulo direto. A
 * tabela é a própria visualização acessível; a cor nunca carrega sozinha a
 * identidade do grupo.
 */
export function FichaDaLamina({
  orgao,
  sistemaNome,
  coloracao,
  notaDaLamina,
  compacto = false,
  idBase = 'ficha',
}: {
  orgao: Orgao
  sistemaNome: string
  coloracao?: Coloracao
  notaDaLamina?: string | null
  compacto?: boolean
  idBase?: string
}) {
  const { ficha } = orgao
  const celulas = [...ficha.celulas].sort((a, b) => b.pct - a.pct)
  const tecidos = [...ficha.tecidos].sort((a, b) => b.pct - a.pct)
  const h = compacto ? 'text-sm' : 'text-base'

  // Composição por grupo, na ordem fixa dos grupos (cor segue a entidade, não o ranking).
  const porGrupo = new Map<GrupoDeTecido, number>()
  for (const t of ficha.tecidos) {
    const g = TECIDOS[t.tipo].grupo
    porGrupo.set(g, (porGrupo.get(g) ?? 0) + t.pct)
  }
  const composicao = ORDEM_DOS_GRUPOS.filter((g) => porGrupo.has(g)).map((g) => ({
    grupo: g,
    pct: porGrupo.get(g)!,
  }))

  return (
    <div className="space-y-6">
      <section aria-labelledby={`${idBase}-visao`}>
        <h2 id={`${idBase}-visao`} className="sr-only">
          Visão geral
        </h2>
        <p className={`leading-relaxed text-foreground ${compacto ? 'text-sm' : 'text-[15px]'}`}>
          {ficha.resumo}
        </p>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          <Dado rotulo="Sistema" valor={sistemaNome} />
          <Dado rotulo="Tecido principal" valor={ficha.tecidoPrincipal} />
        </dl>
        {notaDaLamina && (
          <p className="mt-3 flex gap-2 rounded-lg border border-teal-500/30 bg-teal-500/[0.07] p-3 text-sm leading-relaxed">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-teal-700 dark:text-teal-300" aria-hidden />
            <span>
              <span className="font-semibold">Nesta lâmina: </span>
              {notaDaLamina}
            </span>
          </p>
        )}
      </section>

      <section aria-labelledby={`${idBase}-epitelio`}>
        <Titulo id={`${idBase}-epitelio`} className={h} icone={<ScanEye className="h-4 w-4" aria-hidden />}>
          Epitélio
        </Titulo>
        {ficha.epitelios.length ? (
          <ul className="space-y-2">
            {ficha.epitelios.map((e) => (
              <li key={e.tipo + e.onde} className="rounded-lg border border-border bg-card/60 p-3">
                <p className="text-sm font-semibold leading-snug">{e.tipo}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{e.onde}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-border p-3 text-sm leading-relaxed text-muted-foreground">
            {ficha.semEpitelio}
          </p>
        )}
      </section>

      <section aria-labelledby={`${idBase}-morfologia`}>
        <Titulo id={`${idBase}-morfologia`} className={h} icone={<Microscope className="h-4 w-4" aria-hidden />}>
          Características morfológicas gerais
        </Titulo>
        <ol className="space-y-1.5">
          {ficha.morfologia.map((m, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
              <span
                className="mt-[3px] inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[10px] font-bold text-muted-foreground"
                aria-hidden
              >
                {i + 1}
              </span>
              <span>{m}</span>
            </li>
          ))}
        </ol>
      </section>

      {celulas.length > 0 && (
        <section aria-labelledby={`${idBase}-celulas`}>
          <Titulo id={`${idBase}-celulas`} className={h}>
            Células presentes e predominância
          </Titulo>
          <p className="mb-2 text-xs leading-relaxed text-muted-foreground">
            Estimativa didática da população celular visível no corte, arredondada a 5 %. Serve para
            orientar o olhar, não é morfometria.
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[420px] border-collapse text-sm">
              <caption className="sr-only">Células presentes, em porcentagem estimada</caption>
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th scope="col" className="px-3 py-2 font-semibold">Célula</th>
                  <th scope="col" className="w-[38%] px-3 py-2 font-semibold">%</th>
                </tr>
              </thead>
              <tbody>
                {celulas.map((c, i) => (
                  <tr key={c.nome} className="border-b border-border/70 align-top last:border-0">
                    <th scope="row" className="px-3 py-2.5 text-left font-normal">
                      <span className="font-semibold">{c.nome}</span>
                      {i === 0 && (
                        <span className="ml-1.5 rounded bg-violet-500/10 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-violet-700 dark:text-violet-300">
                          predominante
                        </span>
                      )}
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{c.nota}</span>
                    </th>
                    <td className="px-3 py-2.5">
                      <Barra pct={c.pct} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section aria-labelledby={`${idBase}-tecidos`}>
        <Titulo id={`${idBase}-tecidos`} className={h}>
          Tipos de tecido e predominância
        </Titulo>
        {tecidos.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-3 text-sm leading-relaxed text-muted-foreground">
            {ficha.semTecidos}
          </p>
        ) : (
          <>
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
              Fração estimada da área do corte ocupada por cada tecido, com a classificação completa
              (frouxo ou denso; modelado/regular ou não modelado/irregular).
            </p>

            <figure className="mb-3">
              <div
                className="flex h-3.5 w-full gap-[2px] overflow-hidden rounded-[4px]"
                role="img"
                aria-label={composicao
                  .map((c) => `${GRUPOS[c.grupo].nome} ${c.pct}%`)
                  .join(', ')}
              >
                {composicao.map((c) => (
                  <span
                    key={c.grupo}
                    title={`${GRUPOS[c.grupo].nome}: ${c.pct}%`}
                    className="h-full bg-[var(--c)] dark:bg-[var(--c-escura)]"
                    style={
                      {
                        width: `${c.pct}%`,
                        '--c': GRUPOS[c.grupo].cor,
                        '--c-escura': GRUPOS[c.grupo].corEscura,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>
              <figcaption>
                <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {composicao.map((c) => (
                    <li key={c.grupo} className="inline-flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-sm bg-[var(--c)] dark:bg-[var(--c-escura)]"
                        style={
                          {
                            '--c': GRUPOS[c.grupo].cor,
                            '--c-escura': GRUPOS[c.grupo].corEscura,
                          } as React.CSSProperties
                        }
                        aria-hidden
                      />
                      <span className="text-foreground">{GRUPOS[c.grupo].nome}</span>
                      <span className="tabular-nums">{c.pct}%</span>
                    </li>
                  ))}
                </ul>
              </figcaption>
            </figure>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[460px] border-collapse text-sm">
                <caption className="sr-only">Tipos de tecido, em porcentagem estimada da área</caption>
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="px-3 py-2 font-semibold">Tecido (classificação)</th>
                    <th scope="col" className="w-[34%] px-3 py-2 font-semibold">% da área</th>
                  </tr>
                </thead>
                <tbody>
                  {tecidos.map((t) => {
                    const d = TECIDOS[t.tipo]
                    const g = GRUPOS[d.grupo]
                    return (
                      <tr key={t.tipo} className="border-b border-border/70 align-top last:border-0">
                        <th scope="row" className="px-3 py-2.5 text-left font-normal">
                          <span className="flex items-start gap-2">
                            <span
                              className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-sm bg-[var(--c)] dark:bg-[var(--c-escura)]"
                              style={{ '--c': g.cor, '--c-escura': g.corEscura } as React.CSSProperties}
                              aria-hidden
                            />
                            <span>
                              <span className="block font-semibold leading-snug">{d.completo}</span>
                              <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                                {t.onde}
                              </span>
                            </span>
                          </span>
                        </th>
                        <td className="px-3 py-2.5">
                          <Barra pct={t.pct} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section aria-labelledby={`${idBase}-reconhecer`}>
        <Titulo id={`${idBase}-reconhecer`} className={h} icone={<Search className="h-4 w-4" aria-hidden />}>
          Como reconhecer na prova
        </Titulo>
        <ul className="space-y-1.5">
          {ficha.reconhecer.map((r) => (
            <li key={r} className="flex gap-2 text-sm leading-relaxed">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" aria-hidden />
              {r}
            </li>
          ))}
        </ul>
      </section>

      {ficha.diferencial && ficha.diferencial.length > 0 && (
        <section aria-labelledby={`${idBase}-diferencial`}>
          <Titulo
            id={`${idBase}-diferencial`}
            className={h}
            icone={<AlertTriangle className="h-4 w-4" aria-hidden />}
          >
            Não confunda com
          </Titulo>
          <ul className="space-y-1.5">
            {ficha.diferencial.map((d) => (
              <li key={d} className="rounded-lg bg-muted/50 px-3 py-2 text-sm leading-relaxed">
                {d}
              </li>
            ))}
          </ul>
        </section>
      )}

      {coloracao && (
        <section aria-labelledby={`${idBase}-coloracao`}>
          <Titulo id={`${idBase}-coloracao`} className={h} icone={<Palette className="h-4 w-4" aria-hidden />}>
            Coloração desta lâmina
          </Titulo>
          <p className="text-sm font-semibold">{coloracao.nome}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{coloracao.resultado}</p>
        </section>
      )}
    </div>
  )
}

function Titulo({
  id,
  children,
  className,
  icone,
}: {
  id: string
  children: React.ReactNode
  className: string
  icone?: React.ReactNode
}) {
  return (
    <h2 id={id} className={`mb-2.5 flex items-center gap-2 font-heading font-semibold tracking-tight ${className}`}>
      {icone && <span className="text-muted-foreground">{icone}</span>}
      {children}
    </h2>
  )
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-lg border border-border bg-card/60 px-3 py-2">
      <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{rotulo}</dt>
      <dd className="mt-0.5 text-sm font-medium leading-snug">{valor}</dd>
    </div>
  )
}

/** Barra de magnitude de uma série só: um tom, ponta arredondada, valor em texto. */
function Barra({ pct }: { pct: number }) {
  return (
    <span className="flex items-center gap-2">
      <span className="relative h-2 flex-1 overflow-hidden rounded-[4px] bg-muted" aria-hidden>
        <span
          className="absolute inset-y-0 left-0 rounded-[4px] bg-violet-600 dark:bg-violet-400"
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="w-9 text-right font-mono text-xs font-semibold tabular-nums text-foreground">{pct}%</span>
    </span>
  )
}
