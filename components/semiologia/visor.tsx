'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeftRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Layers,
  ShieldCheck,
  ListChecks,
  Pencil,
  Target,
} from 'lucide-react'
import type { CenaClinica, EstruturaDaVista, FonteExterna, PassoDeExame } from '@/lib/semiologia/esquemas'
import { fonteLicenciada } from '@/lib/acervos-licenciados'
import { midiasServiveis } from '@/lib/semiologia/midia'
import { CasoReal } from './caso-real'
import { Enfase } from './enfase'
import { Deslizador } from './deslizador'
import { controleDaCena } from './ilustracoes/controles'
import { Ilustracao } from './ilustracoes/registro'

/**
 * O visor de cenas — a peça central das duas alas de imagem.
 *
 * ## As três decisões que o desenharam
 *
 * **1. A cena normal nunca sai de cena.** O botão "comparar com o normal" abre
 * as duas figuras lado a lado, e é a única forma de o aluno ver o *delta*. Todo
 * atlas mostra a patologia sozinha e conta com o aluno lembrar do normal que
 * viu três páginas antes — e ele não lembra. Aqui a comparação é um clique, e a
 * ficha ainda traz `diferencaDoNormal` escrito por extenso, porque ver a
 * diferença e saber nomeá-la são duas competências distintas.
 *
 * **2. As estruturas só acendem na cena normal.** Anatomia se aprende no normal;
 * na membrana abaulada não existe triângulo luminoso para apontar. Deixar os
 * marcadores ligados na cena patológica ensinaria o aluno a procurar o que não
 * está lá.
 *
 * **3. A cena mora na URL.** `?cena=otite-media-aguda` é compartilhável,
 * linkável de uma ficha de patologia e sobrevive ao recarregamento. Um estado
 * que só existe no `useState` não pode ser mandado para o grupo de estudo.
 */
export function VisorDeCenas({
  titulo,
  subtitulo,
  contexto,
  cenas,
  estruturas,
  comoFazer,
  qualidade,
  armadilhas,
  ondeVerFoto,
  referencias,
  voltarPara,
  voltarRotulo,
}: {
  titulo: string
  subtitulo: string
  /** Linha de contexto: para que serve o exame, ou a pergunta que a janela responde. */
  contexto: string
  cenas: CenaClinica[]
  estruturas: EstruturaDaVista[]
  comoFazer: PassoDeExame[]
  qualidade: string[]
  armadilhas: string[]
  ondeVerFoto: FonteExterna[]
  referencias: string[]
  voltarPara: string
  voltarRotulo: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const parametros = useSearchParams()

  const normal = useMemo(() => cenas.find((cena) => cena.estado === 'normal') ?? cenas[0], [cenas])
  const pedida = parametros.get('cena')
  const cenaAtual = useMemo(
    () => cenas.find((cena) => cena.id === pedida) ?? normal,
    [cenas, pedida, normal],
  )

  const [comparando, setComparando] = useState(false)
  const [estruturaAberta, setEstruturaAberta] = useState<string | null>(null)
  const [marcadoresLigados, setMarcadoresLigados] = useState(true)

  const ehNormal = cenaAtual.id === normal.id

  // Filtrado aqui e não na renderização: sem isso a interface reservaria espaço
  // para uma galeria que pode chegar vazia (ver `estrategiaDeMidia`).
  const reais = useMemo(() => midiasServiveis(cenaAtual.midiaReal), [cenaAtual])

  // Estrutura acesa não faz sentido fora da cena normal — some ao trocar.
  useEffect(() => {
    if (!ehNormal) setEstruturaAberta(null)
  }, [ehNormal])

  // O parâmetro que o aluno varre, quando a cena tem um com limiar clínico.
  // Começa no valor que a ficha declara e volta a ele a cada troca de cena —
  // arrastar a aorta até 8 cm não deve contaminar a vesícula seguinte.
  const controle = controleDaCena(cenaAtual.ilustracao)
  const [valorDoControle, setValorDoControle] = useState<number | null>(null)
  useEffect(() => setValorDoControle(null), [cenaAtual.id])
  const valorAtual =
    valorDoControle ??
    (controle && typeof cenaAtual.ilustracao.params?.[controle.param] === 'number'
      ? (cenaAtual.ilustracao.params[controle.param] as number)
      : (controle?.padrao ?? 0))
  const paramsDaCena = controle ? { ...cenaAtual.ilustracao.params, [controle.param]: valorAtual } : cenaAtual.ilustracao.params

  const trocarCena = useCallback(
    (id: string) => {
      const busca = new URLSearchParams(parametros.toString())
      if (id === normal.id) busca.delete('cena')
      else busca.set('cena', id)
      const consulta = busca.toString()
      router.replace(consulta ? `${pathname}?${consulta}` : pathname, { scroll: false })
    },
    [normal.id, parametros, pathname, router],
  )

  const estrutura = estruturas.find((item) => item.slug === estruturaAberta) ?? null

  return (
    <div className="space-y-8">
      <header>
        <Link
          href={voltarPara}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronRight className="h-3 w-3 rotate-180" />
          {voltarRotulo}
        </Link>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{titulo}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitulo}</p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{contexto}</p>
      </header>

      {/* Seletor de cenas: normal primeiro, alterações depois. */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Cenas desta janela">
        {cenas.map((cena) => {
          const ativa = cena.id === cenaAtual.id
          return (
            <button
              key={cena.id}
              role="tab"
              aria-selected={ativa}
              onClick={() => trocarCena(cena.id)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                ativa
                  ? 'border-sky-500 bg-sky-500 text-white'
                  : 'border-border bg-card text-muted-foreground hover:border-sky-500/40 hover:text-foreground'
              }`}
            >
              {cena.estado === 'normal' && <span aria-hidden className="mr-1.5">●</span>}
              {cena.titulo}
            </button>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="space-y-3">
          {/* O caso real vem primeiro quando existe. A fotografia é o que o
              aluno vai encontrar na clínica; o esquema é o gabarito que explica
              o que ele está vendo. A ordem diz qual é qual — e o esquema nunca
              sai, porque a comparação entre os dois é parte do que se ensina. */}
          {reais.length > 0 && <CasoReal midias={reais} cenaId={cenaAtual.id} />}

          {/* Com caso real, o esquema vira referência recolhível: continua a
              um clique, com os marcadores e o comparador intactos, mas não
              disputa o palco com a fotografia. Sem caso real, é a figura. */}
          <details open={reais.length === 0} className="group space-y-3">
            <summary
              className={`flex cursor-pointer list-none items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground ${
                reais.length === 0 ? 'hidden' : ''
              }`}
            >
              <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
              Esquema de referência
            </summary>

          {/* Figura esquemática, com os marcadores de estrutura sobrepostos. */}
          <div className={comparando && !ehNormal ? 'grid grid-cols-2 gap-3' : ''}>
            {comparando && !ehNormal && (
              <figure className="space-y-2">
                <Ilustracao
                  id={normal.ilustracao.id}
                  params={normal.ilustracao.params}
                  titulo={normal.ilustracao.alt}
                  className="border border-border"
                />
                <figcaption className="text-center text-[11px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  Normal
                </figcaption>
              </figure>
            )}
            <figure className="space-y-2">
              <Ilustracao
                id={cenaAtual.ilustracao.id}
                params={paramsDaCena}
                titulo={cenaAtual.ilustracao.alt}
                className="border border-border"
                marcadores={
                  ehNormal && marcadoresLigados && !comparando ? (
                    <Marcadores
                      estruturas={estruturas}
                      aberta={estruturaAberta}
                      onEscolher={(slug) => setEstruturaAberta((atual) => (atual === slug ? null : slug))}
                    />
                  ) : undefined
                }
              />
              <figcaption className="text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {comparando && !ehNormal ? cenaAtual.titulo : cenaAtual.ilustracao.alt}
              </figcaption>
            </figure>
          </div>

          <div className="flex flex-wrap gap-2">
            {!ehNormal && (
              <button
                onClick={() => setComparando((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  comparando ? 'border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300' : 'border-border hover:bg-muted'
                }`}
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                Comparar com o normal
              </button>
            )}
            {ehNormal && estruturas.length > 0 && (
              <button
                onClick={() => setMarcadoresLigados((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  marcadoresLigados ? 'border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300' : 'border-border hover:bg-muted'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                {marcadoresLigados ? 'Apagar marcações' : `Acender ${estruturas.length} estruturas`}
              </button>
            )}
          </div>

          {controle && (
            <Deslizador
              id="controle-cena"
              controle={controle}
              valor={valorAtual}
              onMudar={setValorDoControle}
              nota="Arraste e veja onde o achado passa a mudar a conduta. Os marcos são os limiares que a decisão usa."
            />
          )}

          {/* Dossiê da estrutura acesa. */}
          {estrutura && (
            <div className="rounded-xl border border-sky-500/40 bg-sky-500/5 p-4">
              <p className="text-sm font-semibold">
                {estrutura.nome}
                {estrutura.original && (
                  <span className="ml-2 font-normal italic text-muted-foreground">{estrutura.original}</span>
                )}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground"><Enfase texto={estrutura.nota} /></p>
            </div>
          )}

          {ehNormal && marcadoresLigados && estruturas.length > 0 && !estrutura && (
            <p className="text-xs text-muted-foreground">
              Toque num marcador para abrir a ficha da estrutura. Apague as marcações para testar se você as nomeia
              sozinho.
            </p>
          )}

          <p className="rounded-lg bg-muted/50 p-2.5 text-[11px] leading-relaxed text-muted-foreground">
            Figura esquemática desenhada a partir dos parâmetros do achado — não é fotografia clínica. Ela fixa o
            padrão; a variação real se aprende no caso {reais.length > 0 ? 'acima' : 'fotográfico'}.
          </p>
          </details>
        </div>

        {/* Leitura da cena. */}
        <div className="space-y-5">
          <Bloco icone={Target} titulo="Diagnóstico">
            <p className="text-sm font-medium">{cenaAtual.diagnostico}</p>
          </Bloco>

          <Bloco icone={Pencil} titulo="O que se vê">
            <p className="text-sm leading-relaxed text-muted-foreground"><Enfase texto={cenaAtual.achado} /></p>
          </Bloco>

          {!ehNormal && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                <ArrowLeftRight className="h-3.5 w-3.5" />
                Diferença para o normal
              </p>
              <p className="mt-2 text-sm leading-relaxed"><Enfase texto={cenaAtual.diferencaDoNormal} /></p>
            </div>
          )}

          <Bloco icone={ListChecks} titulo="Roteiro de leitura">
            <ol className="space-y-2 text-sm text-muted-foreground">
              {cenaAtual.leitura.map((passo, i) => (
                <li key={passo} className="flex gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-foreground">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed"><Enfase texto={passo} /></span>
                </li>
              ))}
            </ol>
          </Bloco>

          <Bloco icone={CheckCircle2} titulo="Conduta">
            <p className="text-sm leading-relaxed text-muted-foreground"><Enfase texto={cenaAtual.conduta} /></p>
          </Bloco>

          {cenaAtual.diferencial.length > 0 && (
            <Bloco icone={Layers} titulo="Diferencial">
              <ul className="flex flex-wrap gap-1.5">
                {cenaAtual.diferencial.map((item) => (
                  <li key={item} className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                    {item}
                  </li>
                ))}
              </ul>
            </Bloco>
          )}

          {cenaAtual.patologia && (
            <Link
              href={`/manual-clinico/${cenaAtual.patologia}`}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Abrir a ficha da patologia no Manual Clínico
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Técnica, qualidade e armadilhas: valem para a janela inteira. */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Bloco icone={ListChecks} titulo="Como fazer">
          <ol className="space-y-3">
            {comoFazer.map((item, i) => (
              <li key={item.passo} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-[11px] font-semibold text-sky-700 dark:text-sky-300">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium">{item.passo}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{item.detalhe}</p>
                </div>
              </li>
            ))}
          </ol>
        </Bloco>

        <div className="space-y-6">
          {qualidade.length > 0 && (
            <Bloco icone={CheckCircle2} titulo="O exame saiu bom?">
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {qualidade.map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="leading-relaxed"><Enfase texto={item} /></span>
                  </li>
                ))}
              </ul>
            </Bloco>
          )}

          <Bloco icone={AlertTriangle} titulo="Onde engana">
            <ul className="space-y-2 text-sm text-muted-foreground">
              {armadilhas.map((item) => (
                <li key={item} className="flex gap-2">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span className="leading-relaxed"><Enfase texto={item} /></span>
                </li>
              ))}
            </ul>
          </Bloco>
        </div>
      </div>

      {ondeVerFoto.length > 0 && (
        <Bloco icone={ExternalLink} titulo="Onde ver a imagem real">
          <ul className="space-y-3">
            {ondeVerFoto.map((fonte) => (
              <li key={fonte.url}>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={fonte.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-700 hover:underline dark:text-sky-400"
                  >
                    {fonte.titulo}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  {fonte.licenciada && (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                      <ShieldCheck className="h-3 w-3" />
                      acervo licenciado para a DomineAqui
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{fonte.oQueProcurar}</p>
                {fonte.nota && <p className="mt-0.5 text-xs text-muted-foreground/80">{fonte.nota}</p>}
                {fonte.licenciada && (
                  <p className="mt-0.5 text-xs text-muted-foreground/80">
                    {fonteLicenciada(fonte.licenciada).creditoCurto}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Bloco>
      )}

      <footer className="border-t border-border pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Referências</p>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          {referencias.map((ref) => (
            <li key={ref}>{ref}</li>
          ))}
        </ul>
      </footer>
    </div>
  )
}

/**
 * Marcadores posicionados em porcentagem — a mesma escala do `viewBox` das
 * ilustrações, e é isso que faz o ponto cair sobre o cabo do martelo sem
 * ninguém precisar saber o tamanho em que a figura será exibida.
 */
function Marcadores({
  estruturas,
  aberta,
  onEscolher,
}: {
  estruturas: EstruturaDaVista[]
  aberta: string | null
  onEscolher: (slug: string) => void
}) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {estruturas.map((estrutura) => {
        const ativa = estrutura.slug === aberta
        return (
          <button
            key={estrutura.slug}
            type="button"
            onClick={() => onEscolher(estrutura.slug)}
            style={{ left: `${estrutura.x}%`, top: `${estrutura.y}%` }}
            aria-label={estrutura.nome}
            aria-pressed={ativa}
            className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
              ativa
                ? 'h-5 w-5 border-white bg-sky-500 shadow-lg shadow-sky-500/40'
                : 'h-4 w-4 border-white/90 bg-sky-500/70 hover:h-5 hover:w-5 hover:bg-sky-500'
            }`}
          >
            <span className="sr-only">{estrutura.nome}</span>
          </button>
        )
      })}
    </div>
  )
}

function Bloco({
  icone: Icone,
  titulo,
  children,
}: {
  icone: typeof Target
  titulo: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icone className="h-3.5 w-3.5" />
        {titulo}
      </h2>
      {children}
    </section>
  )
}
