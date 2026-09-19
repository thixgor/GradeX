import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { AreaDosExames, CabecalhoDaSecao } from '@/components/exames-laboratoriais/area'
import { AvisoDeContexto, Etiqueta } from '@/components/exames-laboratoriais/folha'
import { BotaoFavorito } from '@/components/exames-laboratoriais/interacoes'
import { GerarParaPraticar } from '@/components/exames-laboratoriais/laboratorio'
import { Secao, corDaDirecao } from '@/components/exames-laboratoriais/secoes'
import {
  COMPARACAO_POR_ID,
  DOENCAS,
  DOENCA_POR_ID,
  PADRAO_POR_ID,
  SISTEMA_POR_ID,
} from '@/lib/exames-laboratoriais'

/**
 * A página de uma doença.
 *
 * Existe porque abrir uma doença tem de abrir **aquela** doença. Enquanto o
 * padrão esperado morava todo numa página só, clicar em "cirrose" levava à
 * lista inteira e deixava o trabalho de procurar para quem clicou — uma âncora
 * não é uma página, e numa tela de celular a diferença é a de chegar ou não
 * chegar.
 *
 * O conteúdo é o mesmo da navegação inversa: fisiopatologia do ponto de vista
 * do laboratório, o padrão esperado achado por achado (cada um com o `porque`),
 * o que confirma, do que diferenciar, e os atalhos para padrão, comparação e
 * Laboratório Virtual.
 */

export function generateStaticParams() {
  return DOENCAS.map((d) => ({ slug: d.id }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const d = DOENCA_POR_ID.get(params.slug)
  if (!d) return { title: 'Doença não encontrada | DomineAqui Lab' }
  return {
    title: `${d.nome} — o padrão laboratorial esperado | DomineAqui Lab`,
    description: d.fisiopatologia.slice(0, 155),
  }
}

export default function PaginaDaDoenca({ params }: { params: { slug: string } }) {
  const doenca = DOENCA_POR_ID.get(params.slug)
  if (!doenca) notFound()

  const padroes = (doenca.padroes ?? []).map((id) => PADRAO_POR_ID.get(id)).filter((p): p is NonNullable<typeof p> => !!p)
  const comparacoes = (doenca.comparacoes ?? []).map((id) => COMPARACAO_POR_ID.get(id)).filter((c): c is NonNullable<typeof c> => !!c)
  const vizinhas = DOENCAS.filter((d) => d.id !== doenca.id && d.sistemas.some((s) => doenca.sistemas.includes(s))).slice(0, 8)

  return (
    <AreaDosExames alvo={doenca.nome}>
      <CabecalhoDaSecao
        titulo={doenca.nome}
        subtitulo="O padrão laboratorial esperado, achado por achado — com a razão de cada alteração, e não apenas a seta."
        voltar="/manual-clinico/exames-laboratoriais/doencas"
        rotuloVoltar="Voltar às doenças"
        acoes={
          <BotaoFavorito
            item={{
              tipo: 'doenca',
              id: doenca.id,
              nome: doenca.nome,
              href: `/manual-clinico/exames-laboratoriais/doenca/${doenca.id}`,
            }}
          />
        }
      />

      <div className="container mx-auto max-w-4xl px-4 pb-16 pt-6">
        {doenca.sinonimos && doenca.sinonimos.length > 0 && (
          <p className="text-xs text-muted-foreground">Também chamada de: {doenca.sinonimos.join(' · ')}</p>
        )}

        {/* ══════════ Fisiopatologia ══════════ */}
        <div className="mt-3 rounded-2xl border border-primary/25 bg-primary/[0.04] p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Fisiopatologia, do ponto de vista do laboratório
          </p>
          <p className="mt-1.5 text-sm leading-relaxed">{doenca.fisiopatologia}</p>
        </div>

        <ul className="mt-3 flex flex-wrap gap-1.5">
          {doenca.sistemas.map((s) => (
            <li key={s}>
              <Etiqueta>{SISTEMA_POR_ID.get(s)?.nome ?? s}</Etiqueta>
            </li>
          ))}
        </ul>

        {/* ══════════ Padrão esperado ══════════ */}
        <Secao titulo="Padrão laboratorial esperado" rubrica="O que o laboratório mostra">
          <ul className="space-y-1.5">
            {doenca.esperado.map((e) => (
              <li key={e.marcador} className="rounded-lg border border-border bg-card p-3.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <span className="text-sm font-semibold">
                    {e.id ? (
                      <Link
                        href={`/manual-clinico/exames-laboratoriais/marcador/${e.id}`}
                        prefetch={false}
                        className="hover:text-primary hover:underline"
                      >
                        {e.marcador}
                      </Link>
                    ) : (
                      e.marcador
                    )}
                  </span>
                  <span className={`font-mono text-sm font-bold ${corDaDirecao(e.direcao)}`}>{e.direcao}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{e.porque}</p>
              </li>
            ))}
          </ul>
          <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground">
            O padrão é o esperado, não o obrigatório: doença em fase inicial, tratamento em curso e comorbidade associada
            deslocam achados isolados sem desfazer o conjunto.
          </p>
        </Secao>

        {/* ══════════ Confirmação e diferenciais ══════════ */}
        {((doenca.confirmacao && doenca.confirmacao.length > 0) || (doenca.diferenciais && doenca.diferenciais.length > 0)) && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {doenca.confirmacao && doenca.confirmacao.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">O que confirma</p>
                <ul className="mt-2 space-y-1">
                  {doenca.confirmacao.map((c) => (
                    <li key={c} className="text-sm leading-relaxed text-muted-foreground">
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {doenca.diferenciais && doenca.diferenciais.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Do que diferenciar</p>
                <ul className="mt-2 space-y-1">
                  {doenca.diferenciais.map((d) => (
                    <li key={d} className="text-sm leading-relaxed text-muted-foreground">
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ══════════ Padrões e comparações ══════════ */}
        {(padroes.length > 0 || comparacoes.length > 0) && (
          <Secao titulo="Onde este quadro se encaixa" rubrica="Padrões e comparações">
            <div className="grid gap-3 sm:grid-cols-2">
              {padroes.map((p) => (
                <Link
                  key={p.id}
                  href={`/manual-clinico/exames-laboratoriais/padroes#${p.id}`}
                  prefetch={false}
                  className="lab-cartao lab-cartao-link block h-full p-4"
                >
                  <p className="lab-rubrica">Padrão</p>
                  <p className="mt-1 text-sm font-bold leading-snug">{p.nome}</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{p.assinatura}</p>
                </Link>
              ))}
              {comparacoes.map((c) => (
                <Link
                  key={c.id}
                  href={`/manual-clinico/exames-laboratoriais/comparar#${c.id}`}
                  prefetch={false}
                  className="lab-cartao lab-cartao-link block h-full p-4"
                >
                  <p className="lab-rubrica">Comparar</p>
                  <p className="mt-1 text-sm font-bold leading-snug">{c.titulo}</p>
                  {c.pergunta && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.pergunta}</p>}
                </Link>
              ))}
            </div>
          </Secao>
        )}

        {/* ══════════ Praticar ══════════ */}
        {doenca.cenario && (
          <div className="mt-8">
            <GerarParaPraticar cenarios={[doenca.cenario]} titulo={`Gerar um exame de ${doenca.nome.toLowerCase()}`} />
          </div>
        )}

        {/* ══════════ Vizinhas ══════════ */}
        {vizinhas.length > 0 && (
          <Secao titulo="Doenças do mesmo sistema" rubrica="Continue">
            <ul className="flex flex-wrap gap-2">
              {vizinhas.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/manual-clinico/exames-laboratoriais/doenca/${d.id}`}
                    prefetch={false}
                    className="inline-flex rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium transition hover:border-primary/40"
                  >
                    {d.nome}
                  </Link>
                </li>
              ))}
            </ul>
          </Secao>
        )}

        <div className="mt-8">
          <AvisoDeContexto />
        </div>
      </div>
    </AreaDosExames>
  )
}
