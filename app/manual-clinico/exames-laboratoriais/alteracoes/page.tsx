import Link from 'next/link'
import type { Metadata } from 'next'

import { AreaDosExames, CabecalhoDaSecao } from '@/components/exames-laboratoriais/area'
import { BuscaInteligente } from '@/components/exames-laboratoriais/busca-inteligente'
import { AvisoDeContexto } from '@/components/exames-laboratoriais/folha'
import { ALTERACOES, ROTULO_DO_GRUPO, indiceCompleto, marcadorPorId } from '@/lib/exames-laboratoriais'
import type { AlteracaoLaboratorial, GrupoId } from '@/lib/exames-laboratoriais'

export const metadata: Metadata = {
  title: 'Alterações laboratoriais — o vocabulário do laudo | DomineAqui Lab',
  description:
    'Hiponatremia, hipercalemia, colestase, microcitose: o nome do achado, o mecanismo que o produz, as causas por frequência e as doenças que o explicam.',
}

/**
 * O índice das alterações.
 *
 * É a porta de entrada de quem está lendo um laudo: ali não está escrito
 * "sódio", está escrito que o sódio veio 128 — e o nome que a pessoa tem na
 * cabeça é "hiponatremia". Cada alteração abre a sua própria página, com o
 * mecanismo do lado para o qual o marcador se moveu.
 */
export default function PaginaDeAlteracoes() {
  const indice = indiceCompleto()

  const porGrupo = new Map<GrupoId, AlteracaoLaboratorial[]>()
  for (const a of ALTERACOES) {
    const grupo = marcadorPorId(a.marcador)?.grupo
    if (!grupo) continue
    const lista = porGrupo.get(grupo) ?? []
    lista.push(a)
    porGrupo.set(grupo, lista)
  }

  return (
    <AreaDosExames alvo="as alterações laboratoriais">
      <CabecalhoDaSecao
        titulo="Alterações laboratoriais"
        subtitulo={`${ALTERACOES.length} achados com nome próprio. Cada um abre pelo lado que importa: por que o marcador se moveu para lá, o que costuma estar por trás e o que investigar em seguida.`}
      />

      <div className="container mx-auto max-w-5xl px-4 pb-16 pt-6">
        <BuscaInteligente indice={indice} />

        <div className="mt-8 space-y-9">
          {Array.from(porGrupo.entries()).map(([grupo, lista]) => (
            <section key={grupo}>
              <p className="lab-rubrica">Alterações</p>
              <h2 className="mt-1 font-heading text-xl font-semibold tracking-tight">
                {ROTULO_DO_GRUPO[grupo]}
                <span className="ml-2 font-mono text-sm font-normal text-muted-foreground">{lista.length}</span>
              </h2>
              <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {lista.map((a) => {
                  const marcador = marcadorPorId(a.marcador)
                  const alta = a.direcao === 'alta'
                  return (
                    <li key={a.id}>
                      <Link
                        href={`/manual-clinico/exames-laboratoriais/alteracao/${a.id}`}
                        prefetch={false}
                        className="lab-cartao lab-cartao-link block h-full p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-bold capitalize leading-snug">{a.termo}</p>
                          <span
                            className={`shrink-0 font-mono text-sm font-bold ${
                              alta ? 'text-amber-700 dark:text-amber-400' : 'text-sky-700 dark:text-sky-400'
                            }`}
                          >
                            {marcador?.sigla ?? marcador?.nome} {alta ? '↑' : '↓'}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{a.descricao}</p>
                        {a.sinonimos && a.sinonimos.length > 0 && (
                          <p className="mt-1 text-[11px] capitalize text-muted-foreground">
                            Também: {a.sinonimos.join(' · ')}
                          </p>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>

        <AvisoDeContexto className="mt-10" />
      </div>
    </AreaDosExames>
  )
}
