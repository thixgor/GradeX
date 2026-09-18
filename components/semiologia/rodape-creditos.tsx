import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { LISTA_DE_FONTES } from '@/lib/acervos-licenciados'
import { ROTAS } from '@/lib/semiologia/rotas'

/**
 * Separado de `creditos.tsx` por causa do peso, não por organização.
 *
 * Este rodapé é renderizado por `AreaSemiologia`, o portão que envolve TODA a
 * árvore `/manual-clinico/semiologia` — e `AreaSemiologia` é `'use client'`.
 * Ele morava no mesmo módulo que `PaginaDeCreditos`, que calcula a cobertura
 * da curadoria com `cobertura([...VISTAS, ...JANELAS_ULTRASSOM], SINAIS)`.
 *
 * Um módulo é a unidade de dependência do empacotador: como os dois componentes
 * estavam juntos, os três catálogos (VISTAS 142 KB, JANELAS_ULTRASSOM 129 KB,
 * SINAIS 75 KB) caíam no chunk compartilhado da seção inteira. Toda página de
 * semiologia baixava os catálogos completos para desenhar um rodapé que só
 * precisa da lista de fontes — e a própria página de créditos, que é a única
 * que usa esse cálculo, aparecia no build com 540 kB de First Load.
 *
 * O rodapé aqui importa quatro coisas leves. O cálculo continua em
 * `creditos.tsx`, carregado só por `/manual-clinico/semiologia/creditos`.
 */
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
