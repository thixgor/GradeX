import Link from 'next/link'
import { ExternalLink, ShieldCheck } from 'lucide-react'
import { CREDITO_BASE, LISTA_DE_FONTES } from '@/lib/acervos-licenciados'
import { cobertura } from '@/lib/semiologia/acervo'
import { GERADO_EM } from '@/lib/semiologia/acervo.gerado'
import { ROTAS } from '@/lib/semiologia/rotas'
import { SINAIS } from '@/lib/semiologia/sinais'
import { JANELAS_ULTRASSOM } from '@/lib/semiologia/ultrassom'
import { VISTAS } from '@/lib/semiologia/vistas'

/**
 * O crédito das fontes licenciadas.
 *
 * ## Onde ele fica, e por que exatamente ali
 *
 * As duas autorizações pedem a mesma coisa com as mesmas palavras: atribuição
 * **clara e permanente**, e explicitamente **não repetitiva ou intrusiva**. O
 * Radiopaedia chega a dizer que não é necessário repetir o crédito em cada
 * página, card ou item, desde que a origem esteja identificada em local visível
 * e permanente da seção.
 *
 * Isso descreve um rodapé de seção, e é onde ele está: renderizado uma vez pelo
 * portão do módulo (`AreaSemiologia`), portanto presente em todas as sete rotas
 * sem ser escrito sete vezes e sem se repetir dentro de uma. Um selo por card
 * cumpriria a letra e violaria a condição — as duas autorizações pedem
 * explicitamente que não seja assim.
 *
 * ## Por que o texto não é editável aqui
 *
 * Cada linha vem de `direitos.ts`, reproduzida da própria autorização. Reescrever
 * o crédito no componente "para caber melhor no layout" é como se deixa de
 * cumprir uma cláusula negociada palavra por palavra — e é um erro que ninguém
 * percebe, porque a página continua bonita.
 */
export function RodapeDeCreditos() {
  return (
    <footer className="border-t border-border bg-muted/20">
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-3xl space-y-1.5">
            {LISTA_DE_FONTES.map((fonte) => (
              <p key={fonte.id} className="text-[11px] leading-relaxed text-muted-foreground">
                {fonte.credito}
              </p>
            ))}
            <p className="text-[11px] leading-relaxed text-muted-foreground/80">
              As figuras esquemáticas do módulo são material próprio da DomineAqui.
            </p>
          </div>
          <Link
            href={ROTAS.creditos}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-medium transition-colors hover:bg-muted"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Créditos e direitos
          </Link>
        </div>
      </div>
    </footer>
  )
}

/**
 * A página inteira de proveniência.
 *
 * Existe pelo mesmo motivo que a da Histopatologia: o rodapé cumpre a obrigação
 * de crédito, mas não cabe nele a informação que torna o crédito verificável —
 * quem assinou, o que a autorização cobre, o que ela **não** cobre e qual
 * documento sustenta tudo. Quem quiser auditar precisa de um lugar para onde
 * olhar, e um leitor que só vê "adaptado de" no rodapé merece poder chegar aqui.
 */
export function PaginaDeCreditos() {
  const curadoria = cobertura([...VISTAS, ...JANELAS_ULTRASSOM], SINAIS)

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Transparência</p>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Créditos, proveniência e direitos</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{CREDITO_BASE}</p>
      </header>

      <ul className="space-y-5">
        {LISTA_DE_FONTES.map((fonte) => (
          <li key={fonte.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base font-semibold">{fonte.nome}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">{fonte.titular}</p>
              </div>
              <a
                href={fonte.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
              >
                Visitar a fonte
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <p className="mt-4 rounded-lg bg-muted/50 p-3 text-xs leading-relaxed">{fonte.credito}</p>

            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Licença pública do acervo
                </dt>
                <dd className="mt-1 text-xs leading-relaxed text-muted-foreground">{fonte.licencaBase}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Exceção concedida à DomineAqui
                </dt>
                <dd className="mt-1 text-xs leading-relaxed text-muted-foreground">{fonte.excecao}</dd>
              </div>
            </dl>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                  O que a autorização permite
                </p>
                <ul className="mt-1.5 space-y-1">
                  {fonte.permissoes.map((item) => (
                    <li key={item} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                      <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-emerald-600/70" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                  O que ela não cobre
                </p>
                <ul className="mt-1.5 space-y-1">
                  {fonte.restricoes.map((item) => (
                    <li key={item} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                      <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-amber-600/70" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 border-t border-border pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Assinaturas e documento
              </p>
              <ul className="mt-1.5 space-y-0.5">
                {fonte.signatarios.map((assinante) => (
                  <li key={assinante} className="text-xs text-muted-foreground">
                    {assinante}
                  </li>
                ))}
              </ul>
              <p className="mt-2 break-all text-[11px] leading-relaxed text-muted-foreground/80">
                {fonte.comprovante.arquivo}
                {fonte.comprovante.versao ? ` · versão ${fonte.comprovante.versao}` : ''} ·{' '}
                {fonte.comprovante.data} · SHA-256 {fonte.comprovante.sha256}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {/* Estado real da curadoria.
          Publicado em vez de escondido porque a alternativa é a página anunciar
          dois acervos licenciados e o aluno não achar um só caso real — e
          concluir, com razão, que o crédito é decorativo. O número diz onde a
          curadoria está, e sobe sozinho a cada execução do gerador. */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold">Casos reais no módulo</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {curadoria.comCaso === 0 ? (
            <>
              As autorizações estão assinadas e o módulo já sabe exibir casos reais ao lado de cada esquema, mas a
              curadoria ainda não começou: nenhuma das {curadoria.cenas} cenas tem caso anexado. Autorização diz o que
              podemos usar — escolher qual caso ensina bem um achado continua sendo julgamento clínico.
            </>
          ) : (
            <>
              {curadoria.comCaso} de {curadoria.cenas} cenas têm caso real anexado, somando {curadoria.midias} mídias
              das fontes acima. Cada uma passou por verificação automática de host autorizado, tipo de arquivo e
              resposta da origem antes de entrar no acervo
              {GERADO_EM ? ` (última curadoria em ${GERADO_EM})` : ''}.
            </>
          )}
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold">Material próprio</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Todas as figuras esquemáticas do módulo — membrana timpânica, fundo de olho, orofaringe, fossa nasal,
          setores de ultrassom e os sinais do exame físico — são desenhadas pela DomineAqui como SVG paramétrico, a
          partir dos parâmetros clínicos de cada achado. Não derivam de fotografia de terceiro e não reproduzem
          material de nenhum dos acervos acima. O texto das fichas é autoral, escrito a partir das referências citadas
          em cada página.
        </p>
      </section>
    </div>
  )
}
