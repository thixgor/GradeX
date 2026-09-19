import { Etiqueta, Fluxo } from '@/components/exames-laboratoriais/folha'
import { Expansivel } from '@/components/exames-laboratoriais/interacoes'
import type { Alteracao, CausasPorPeso } from '@/lib/exames-laboratoriais/tipos'

/**
 * As peças de texto clínico compartilhadas pelas telas da seção.
 *
 * Elas nasceram dentro da ficha do marcador e saíram para cá quando a alteração
 * laboratorial ganhou página própria: "por que a hiponatremia acontece" e "por
 * que o sódio cai" são a mesma explicação vista de dois lugares diferentes, e
 * duplicar o componente seria duplicar a chance de as duas telas divergirem.
 *
 * Tudo aqui é componente de servidor. A única ilha de cliente é o `Expansivel`,
 * que recebe o conteúdo já renderizado como `children`.
 */

/* ═══════════════════════════ Estrutura ═══════════════════════════ */

export function Secao({ titulo, rubrica, children }: { titulo: string; rubrica?: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      {rubrica && <p className="lab-rubrica">{rubrica}</p>}
      <h2 className="mt-1 font-heading text-xl font-semibold tracking-tight">{titulo}</h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}

export function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3.5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{rotulo}</p>
      <p className="mt-1 text-sm leading-relaxed">{valor}</p>
    </div>
  )
}

export function Lista({ itens }: { itens: string[] }) {
  return (
    <ul className="space-y-1.5">
      {itens.map((i) => (
        <li key={i} className="text-sm leading-relaxed text-muted-foreground">
          {i}
        </li>
      ))}
    </ul>
  )
}

/** A cor da seta: quente para o que sobe, fria para o que cai. */
export function corDaDirecao(direcao: string): string {
  if (direcao.includes('↑')) return 'text-amber-700 dark:text-amber-400'
  if (direcao.includes('↓')) return 'text-sky-700 dark:text-sky-400'
  return 'text-muted-foreground'
}

/* ═══════════════════════ Aumento e redução ═══════════════════════ */

/**
 * O corpo de uma alteração: resumo, significado, mecanismos e causas.
 *
 * O desenho aqui é o coração da tese: primeiro o resumo do porquê, depois os
 * mecanismos fisiopatológicos, e dentro de cada mecanismo as situações clínicas
 * — cada uma com a cadeia causal desenhada. É por isso que a tela não é uma
 * lista de doenças: a doença é a entrada da cadeia, não a resposta.
 */
export function CorpoDaAlteracao({ alteracao, tom }: { alteracao: Alteracao; tom: 'alta' | 'baixa' }) {
  return (
    <>
      <p className="rounded-lg border border-border bg-muted/25 px-4 py-3 text-sm leading-relaxed">{alteracao.resumo}</p>

      {alteracao.significado && (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">O que significa: </span>
          {alteracao.significado}
        </p>
      )}

      <div className="mt-4 space-y-2.5">
        {alteracao.mecanismos.map((m) => (
          <Expansivel key={m.titulo} titulo={m.titulo} detalhe={m.explicacao} contagem={m.exemplos.length} tom={tom}>
            <ul className="space-y-4">
              {m.exemplos.map((e) => (
                <li key={e.causa}>
                  <p className="text-sm font-semibold">{e.causa}</p>
                  <div className="mt-2 rounded-lg border border-border bg-muted/20 p-3">
                    <Fluxo etapas={e.etapas} compacto />
                  </div>
                  {e.nota && (
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      <span className="font-semibold text-foreground">Detalhe que importa: </span>
                      {e.nota}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Expansivel>
        ))}
      </div>

      {alteracao.causas && <Causas causas={alteracao.causas} />}
    </>
  )
}

/** A mesma alteração, dentro de uma seção titulada — como a ficha do marcador a exibe. */
export function SecaoDeAlteracao({ titulo, alteracao, tom }: { titulo: string; alteracao: Alteracao; tom: 'alta' | 'baixa' }) {
  return (
    <Secao titulo={titulo} rubrica={tom === 'alta' ? 'Por que sobe' : 'Por que cai'}>
      <CorpoDaAlteracao alteracao={alteracao} tom={tom} />
    </Secao>
  )
}

/**
 * Causas separadas por peso epidemiológico.
 *
 * O rótulo é sempre sobre frequência de aparecimento na prática, nunca sobre
 * probabilidade clínica do caso concreto — o exame sozinho não estabelece
 * probabilidade, e sugerir o contrário seria ensinar errado.
 */
export function Causas({ causas }: { causas: CausasPorPeso }) {
  const blocos: { rotulo: string; itens?: string[]; tom: 'neutro' | 'alta' | 'alerta' | 'destaque' }[] = [
    { rotulo: 'Muito comuns', itens: causas.muitoComuns, tom: 'destaque' },
    { rotulo: 'Comuns', itens: causas.comuns, tom: 'neutro' },
    { rotulo: 'Menos comuns', itens: causas.menosComuns, tom: 'neutro' },
    { rotulo: 'Importantes para não esquecer', itens: causas.naoEsquecer, tom: 'alta' },
    { rotulo: 'Emergências associadas', itens: causas.emergencias, tom: 'alerta' },
  ]
  const comConteudo = blocos.filter((b) => b.itens && b.itens.length > 0)
  if (comConteudo.length === 0) return null

  return (
    <div className="mt-5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Principais causas</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        {comConteudo.map((b) => (
          <div key={b.rotulo} className="rounded-xl border border-border bg-card p-3.5">
            <Etiqueta tom={b.tom}>{b.rotulo}</Etiqueta>
            <ul className="mt-2 space-y-1">
              {b.itens!.map((i) => (
                <li key={i} className="text-sm leading-relaxed text-muted-foreground">
                  {i}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground">
        A separação é por frequência de aparecimento na prática, não por probabilidade clínica: um exame isolado não
        estabelece probabilidade diagnóstica.
      </p>
    </div>
  )
}
