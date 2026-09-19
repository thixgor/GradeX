import Link from 'next/link'
import type { Metadata } from 'next'

import { AreaDosExames, CabecalhoDaSecao } from '@/components/exames-laboratoriais/area'
import { AvisoDeContexto } from '@/components/exames-laboratoriais/folha'
import { DOENCAS, SISTEMAS } from '@/lib/exames-laboratoriais'
import type { Doenca } from '@/lib/exames-laboratoriais/tipos'

export const metadata: Metadata = {
  title: 'Doenças e o padrão laboratorial esperado | DomineAqui Lab',
  description:
    'A navegação inversa: parta da doença e veja o padrão laboratorial esperado, achado por achado, com a explicação de por que cada marcador se move naquela direção.',
}

/**
 * Doenças → exames: o índice da navegação inversa.
 *
 * A seção inteira é construída para ser percorrida nos dois sentidos. Quem
 * parte de um valor alterado chega à doença pelas fichas de marcador; quem
 * parte da doença entra por aqui.
 *
 * Esta tela é um índice, e não o acervo inteiro empilhado: cada doença tem
 * página própria (`/doenca/[id]`), porque abrir uma doença precisa abrir
 * **aquela** doença — e não uma lista onde ela está em algum lugar. As âncoras
 * antigas (`/doencas#cirrose`) continuam caindo no cartão certo, de onde um
 * toque leva à página.
 */
export default function PaginaDeDoencas() {
  const grupos = SISTEMAS.map((s) => ({
    id: s.id,
    nome: s.nome,
    doencas: DOENCAS.filter((d) => d.sistemas[0] === s.id),
  })).filter((g) => g.doencas.length > 0)

  // Nenhuma doença pode sumir do índice porque seu sistema não está na lista.
  const cobertas = new Set(grupos.flatMap((g) => g.doencas.map((d) => d.id)))
  const restantes = DOENCAS.filter((d) => !cobertas.has(d.id))

  return (
    <AreaDosExames alvo="a navegação por doenças">
      <CabecalhoDaSecao
        titulo="Doenças e o padrão esperado"
        subtitulo={`${DOENCAS.length} doenças. Parta da doença e veja o que o laboratório mostra — com a razão de cada alteração, e não apenas a seta.`}
      />

      <div className="container mx-auto max-w-5xl px-4 pb-16 pt-6">
        <nav className="flex flex-wrap gap-1.5" aria-label="Ir para um sistema">
          {grupos.map((g) => (
            <a
              key={g.id}
              href={`#sistema-${g.id}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-3 py-1.5 text-xs transition hover:border-primary/35"
            >
              {g.nome}
              <span className="font-mono text-[11px] font-bold text-primary">{g.doencas.length}</span>
            </a>
          ))}
        </nav>

        <div className="mt-8 space-y-10">
          {grupos.map((grupo) => (
            <section key={grupo.id} id={`sistema-${grupo.id}`} className="scroll-mt-24">
              <p className="lab-rubrica">Por sistema</p>
              <h2 className="mt-1 font-heading text-xl font-semibold tracking-tight">
                {grupo.nome}
                <span className="ml-2 font-mono text-sm font-normal text-muted-foreground">{grupo.doencas.length}</span>
              </h2>
              <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {grupo.doencas.map((d) => (
                  <CartaoDaDoenca key={d.id} doenca={d} />
                ))}
              </ul>
            </section>
          ))}

          {restantes.length > 0 && (
            <section>
              <p className="lab-rubrica">Outras</p>
              <h2 className="mt-1 font-heading text-xl font-semibold tracking-tight">Demais quadros</h2>
              <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {restantes.map((d) => (
                  <CartaoDaDoenca key={d.id} doenca={d} />
                ))}
              </ul>
            </section>
          )}
        </div>

        <AvisoDeContexto className="mt-10" />
      </div>
    </AreaDosExames>
  )
}

/**
 * O cartão do índice.
 *
 * Leva o `id` da doença como âncora para que os links antigos, escritos como
 * `/doencas#cirrose`, continuem chegando ao lugar certo desta tela.
 */
function CartaoDaDoenca({ doenca }: { doenca: Doenca }) {
  const achados = doenca.esperado.slice(0, 4)

  return (
    <li id={doenca.id} className="scroll-mt-24">
      <Link
        href={`/manual-clinico/exames-laboratoriais/doenca/${doenca.id}`}
        prefetch={false}
        className="lab-cartao lab-cartao-link block h-full p-4"
      >
        <p className="text-sm font-bold leading-snug">{doenca.nome}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-3">{doenca.fisiopatologia}</p>
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
          {achados.map((a) => (
            <span key={a.marcador}>
              {a.marcador} <span className={corDoAchado(a.direcao)}>{a.direcao}</span>
            </span>
          ))}
          {doenca.esperado.length > achados.length && <span>+{doenca.esperado.length - achados.length}</span>}
        </p>
      </Link>
    </li>
  )
}

function corDoAchado(direcao: string): string {
  if (direcao.includes('↑')) return 'font-bold text-amber-700 dark:text-amber-400'
  if (direcao.includes('↓')) return 'font-bold text-sky-700 dark:text-sky-400'
  return ''
}
