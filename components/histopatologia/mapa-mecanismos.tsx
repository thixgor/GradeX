import Link from 'next/link'

import type { MecanismoGeral } from '@/lib/histopatologia/esquemas'
import { FAMILIAS_DE_MECANISMO } from '@/lib/histopatologia/editorial/mecanismos'
import { rotaDoMecanismo } from '@/lib/histopatologia/rotas'
import { CLASSE_DE_FAMILIA } from './tema'

/**
 * Mapa de mecanismos, agrupado por família.
 *
 * As oito famílias vêm da seção 4 do plano e são o segundo eixo de navegação do
 * módulo — o primeiro é o sistema/órgão. A diferença entre os dois eixos é
 * pedagógica: por sistema, o aluno estuda um órgão; por mecanismo, ele descobre
 * que o granuloma do pulmão e o do fígado são o mesmo fenômeno.
 *
 * Famílias sem mecanismo cadastrado **aparecem mesmo assim**, com estado vazio
 * honesto. Ocultá-las daria a impressão de um mapa completo; mostrá-las diz
 * exatamente onde o trabalho editorial ainda não chegou.
 */
export function MapaDeMecanismos({
  mecanismos,
  contagemPorMecanismo,
}: {
  mecanismos: MecanismoGeral[]
  contagemPorMecanismo?: Record<string, number>
}) {
  return (
    <div className="space-y-6">
      {FAMILIAS_DE_MECANISMO.map((familia) => {
        const daFamilia = mecanismos.filter((m) => m.familia === familia.id)
        return (
          <section key={familia.id} aria-labelledby={`familia-${familia.id}`}>
            <h3 id={`familia-${familia.id}`} className="mb-2 text-sm font-bold">
              {familia.nome}
              <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                {daFamilia.length} {daFamilia.length === 1 ? 'mecanismo' : 'mecanismos'}
              </span>
            </h3>

            {daFamilia.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                Nenhum mecanismo desta família foi escrito ainda. A família permanece listada porque
                o catálogo tem material dela — o que falta é curadoria, não acervo.
              </p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {daFamilia.map((mecanismo) => (
                  <li key={mecanismo.id}>
                    <Link
                      href={rotaDoMecanismo(mecanismo.id)}
                      className="flex h-full min-h-[44px] flex-col rounded-xl border border-border bg-card p-3.5 transition-colors hover:border-teal-600/50"
                    >
                      <span
                        className={`mb-1.5 inline-flex w-fit rounded-full border px-2 py-0.5 text-[10px] font-bold ${CLASSE_DE_FAMILIA[mecanismo.familia]}`}
                      >
                        {familia.nome}
                      </span>
                      <span className="text-sm font-bold leading-snug">{mecanismo.nome}</span>
                      <span className="mt-1 line-clamp-3 flex-1 text-xs leading-relaxed text-muted-foreground">
                        {mecanismo.conceito}
                      </span>
                      {contagemPorMecanismo?.[mecanismo.id] ? (
                        <span className="mt-2 text-[11px] font-bold text-teal-700 dark:text-teal-400">
                          {contagemPorMecanismo[mecanismo.id]}{' '}
                          {contagemPorMecanismo[mecanismo.id] === 1 ? 'doença' : 'doenças'}
                        </span>
                      ) : (
                        <span className="mt-2 text-[11px] text-muted-foreground">
                          Sem doença associada ainda
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
