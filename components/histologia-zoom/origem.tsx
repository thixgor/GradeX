import { Dna, HelpCircle, Leaf, PawPrint, UserRound } from 'lucide-react'

import {
  ROTULO_DA_CATEGORIA,
  TEXTO_HUMANA,
  TEXTO_NAO_INFORMADA,
  type CategoriaDeOrigem,
  type OrigemDaPeca,
} from '@/lib/histologia-zoom/especies'

/**
 * Origem da peça: humana, não humana, vegetal ou não informada.
 *
 * Sem estado nem hooks — renderiza igual na página (servidor) e dentro do
 * painel de Características do visualizador em tela cheia.
 *
 * A cor acompanha sempre ícone e rótulo em texto: âmbar para "não humana",
 * verde para "humana", neutro para "não informada". Nunca só a cor.
 */

const ESTILO: Record<CategoriaDeOrigem, { caixa: string; texto: string; icone: typeof Dna }> = {
  humana: {
    caixa: 'border-emerald-500/30 bg-emerald-500/[0.07]',
    texto: 'text-emerald-800 dark:text-emerald-300',
    icone: UserRound,
  },
  'nao-humana': {
    caixa: 'border-amber-500/40 bg-amber-500/[0.08]',
    texto: 'text-amber-800 dark:text-amber-300',
    icone: PawPrint,
  },
  vegetal: {
    caixa: 'border-lime-600/40 bg-lime-500/[0.08]',
    texto: 'text-lime-800 dark:text-lime-300',
    icone: Leaf,
  },
  'nao-informada': {
    caixa: 'border-border bg-muted/40',
    texto: 'text-muted-foreground',
    icone: HelpCircle,
  },
}

/** Selo curto, para cabeçalho, cartões e o visualizador. */
export function SeloDeOrigem({
  categoria,
  especie,
  tamanho = 'normal',
}: {
  categoria: CategoriaDeOrigem
  especie: string
  tamanho?: 'normal' | 'mini'
}) {
  const e = ESTILO[categoria]
  const Icone = e.icone
  const texto =
    categoria === 'nao-informada'
      ? 'Espécie não informada'
      : categoria === 'humana'
        ? 'Humana'
        : especie.replace(' (primata não humano)', '')
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${e.caixa} ${e.texto} ${
        tamanho === 'mini' ? 'px-1.5 py-px text-[10px]' : 'px-2 py-0.5 text-xs'
      }`}
      title={ROTULO_DA_CATEGORIA[categoria]}
    >
      <Icone className={tamanho === 'mini' ? 'h-3 w-3' : 'h-3.5 w-3.5'} aria-hidden />
      {categoria === 'nao-humana' && <span className="sr-only">Peça não humana:</span>}
      {texto}
    </span>
  )
}

/** Bloco completo: espécie, por que importa e, se não humana, as diferenças para o humano. */
export function OrigemDaPecaBloco({ origem, idBase = 'origem' }: { origem: OrigemDaPeca; idBase?: string }) {
  const e = ESTILO[origem.categoria]
  const Icone = e.icone
  const { comparacao } = origem

  return (
    <section aria-labelledby={`${idBase}-titulo`} className={`rounded-xl border p-4 ${e.caixa}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 shrink-0 ${e.texto}`}>
          <Icone className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={`${idBase}-titulo`} className={`text-sm font-bold ${e.texto}`}>
            {ROTULO_DA_CATEGORIA[origem.categoria]}
            {origem.categoria !== 'nao-informada' && origem.categoria !== 'humana' && (
              <>
                {' — '}
                {origem.especie}
              </>
            )}
            {origem.cientifico && origem.categoria !== 'humana' && (
              <span className="font-normal italic"> ({origem.cientifico})</span>
            )}
          </h2>

          {origem.categoria === 'humana' && (
            <p className="mt-1 text-sm leading-relaxed text-foreground">{TEXTO_HUMANA}</p>
          )}
          {origem.categoria === 'nao-informada' && (
            <p className="mt-1 text-sm leading-relaxed text-foreground">{TEXTO_NAO_INFORMADA}</p>
          )}

          {comparacao && (
            <div className="mt-2 space-y-3">
              <p className="text-sm leading-relaxed text-foreground">{comparacao.resumo}</p>

              {comparacao.nestaPeca && (
                <p className="rounded-lg bg-background/60 px-3 py-2 text-sm leading-relaxed">
                  <span className="font-semibold">Nesta peça: </span>
                  {comparacao.nestaPeca}
                </p>
              )}

              <div>
                <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  O que muda em relação à peça humana
                </h3>
                <ul className="space-y-1.5">
                  {comparacao.diferencas.map((d) => (
                    <li key={d} className="flex gap-2 text-sm leading-relaxed">
                      <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-current ${e.texto}`} aria-hidden />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  O que vale igual para o humano
                </h3>
                <ul className="space-y-1.5">
                  {comparacao.igual.map((d) => (
                    <li key={d} className="flex gap-2 text-sm leading-relaxed">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" aria-hidden />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
