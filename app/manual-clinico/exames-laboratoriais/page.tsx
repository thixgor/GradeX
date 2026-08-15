import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  Bone,
  Brain,
  Bug,
  Droplets,
  Filter,
  Flame,
  FlaskConical,
  GitCompare,
  HeartPulse,
  Layers,
  Leaf,
  Microscope,
  ShieldCheck,
  Stethoscope,
  Utensils,
  Wind,
} from 'lucide-react'

import { AreaDosExames } from '@/components/exames-laboratoriais/area'
import { BuscaInteligente } from '@/components/exames-laboratoriais/busca-inteligente'
import { ListaDeFavoritos } from '@/components/exames-laboratoriais/interacoes'
import { AvisoDeContexto } from '@/components/exames-laboratoriais/folha'
import {
  EXAMES,
  PADROES,
  SISTEMAS,
  gruposComConteudo,
  indiceCompleto,
  resumoDoAcervo,
} from '@/lib/exames-laboratoriais'

/**
 * A home do DomineAqui Lab.
 *
 * Montada no servidor: os módulos de conteúdo somam centenas de kilobytes de
 * texto clínico, e o navegador não precisa de nenhum deles para desenhar esta
 * tela. O que atravessa a rede é o índice leve da busca — nome, sigla,
 * sinônimos e uma linha por item.
 *
 * A ordem da página segue a ordem em que a pessoa pensa: primeiro a busca
 * (porque quem chega quase sempre tem um termo na cabeça), depois as portas de
 * entrada (exame, marcador, sistema, alteração, doença), e só então o acervo
 * organizado.
 */
export default function PaginaDosExames() {
  const numeros = resumoDoAcervo()
  const indice = indiceCompleto()
  const grupos = gruposComConteudo()

  return (
    <AreaDosExames>
      <div className="container mx-auto max-w-5xl px-4 pb-16 pt-16 sm:pt-8">
        {/* ══════════════ Cabeçalho ══════════════ */}
        <header>
          <Link
            href="/manual-clinico"
            prefetch={false}
            className="-m-2 mb-4 inline-flex items-center gap-1.5 rounded-lg p-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Voltar ao Manual Clínico
          </Link>
          <p className="lab-rubrica">DomineAqui Lab</p>
          <h1 className="mt-1.5 font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Exames Laboratoriais
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Interprete exames, compreenda alterações e conecte resultados à fisiologia e à clínica.
          </p>
        </header>

        {/* ══════════════ Busca ══════════════ */}
        <div className="mt-6">
          <BuscaInteligente indice={indice} />
        </div>

        {/* ══════════════ Portas de entrada ══════════════ */}
        <nav className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Formas de navegar">
          <Porta
            href="/manual-clinico/exames-laboratoriais/exame/hemograma"
            icone={<Layers className="h-5 w-5" />}
            titulo="Exames completos"
            detalhe={`${EXAMES.length} painéis com roteiro de leitura`}
          />
          <Porta
            href="/manual-clinico/exames-laboratoriais/marcadores"
            icone={<FlaskConical className="h-5 w-5" />}
            titulo="Marcadores"
            detalhe={`${numeros.marcadores} fichas com mecanismo e diferenciais`}
          />
          <Porta
            href="/manual-clinico/exames-laboratoriais/sistemas"
            icone={<Stethoscope className="h-5 w-5" />}
            titulo="Por sistemas"
            detalhe={`${SISTEMAS.length} sistemas com mapas fisiológicos`}
          />
          <Porta
            href="/manual-clinico/exames-laboratoriais/padroes"
            icone={<Activity className="h-5 w-5" />}
            titulo="Padrões laboratoriais"
            detalhe={`${PADROES.length} padrões clássicos explicados`}
          />
          <Porta
            href="/manual-clinico/exames-laboratoriais/doencas"
            icone={<Microscope className="h-5 w-5" />}
            titulo="Por doenças"
            detalhe="O padrão esperado, achado por achado"
          />
          <Porta
            href="/manual-clinico/exames-laboratoriais/comparar"
            icone={<GitCompare className="h-5 w-5" />}
            titulo="Comparar diagnósticos"
            detalhe={`${numeros.comparacoes} comparações lado a lado`}
          />
          <Porta
            href="/manual-clinico/exames-laboratoriais/laboratorio"
            icone={<FlaskConical className="h-5 w-5" />}
            titulo="Laboratório Virtual"
            detalhe="Gere exames fictícios e treine a interpretação"
            destaque
          />
          <Porta
            href="/manual-clinico/exames-laboratoriais/exame/painel-completo"
            icone={<Filter className="h-5 w-5" />}
            titulo="Painel completo"
            detalhe="Todos os blocos numa tela só, como num prontuário"
          />
        </nav>

        {/* ══════════════ A tese da seção ══════════════ */}
        <section className="mt-10 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <p className="lab-rubrica">O princípio</p>
          <h2 className="mt-1.5 font-heading text-xl font-semibold leading-snug tracking-tight">
            Não decorar que o marcador sobe. Entender por que ele sobe.
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Toda ficha desta seção percorre o mesmo caminho: anatomia, fisiologia, bioquímica, fisiopatologia, alteração
            laboratorial, manifestação clínica e diagnóstico diferencial. Em cada causa listada, a cadeia vem escrita —
            o que a doença quebra, o que muda na célula e por que o número se move naquela direção.
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Numero valor={numeros.marcadores} rotulo="marcadores" />
            <Numero valor={numeros.cadeias} rotulo="cadeias causais escritas" />
            <Numero valor={numeros.padroes} rotulo="padrões laboratoriais" />
            <Numero valor={numeros.comparacoes} rotulo="comparações lado a lado" />
          </dl>
        </section>

        {/* ══════════════ Exames completos ══════════════ */}
        <section className="mt-10">
          <p className="lab-rubrica">Exames completos</p>
          <h2 className="mt-1 font-heading text-xl font-semibold tracking-tight">A biblioteca de painéis</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Cada painel traz o que ele avalia, o roteiro de leitura na ordem certa, os blocos como o laudo os agrupa e as
            alterações que mais aparecem.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {EXAMES.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/manual-clinico/exames-laboratoriais/exame/${e.id}`}
                  prefetch={false}
                  className="lab-cartao lab-cartao-link block h-full p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-bold leading-snug">{e.nome}</p>
                    <span className="lab-etiqueta lab-etiqueta-neutro shrink-0">
                      {e.blocos.reduce((n, b) => n + b.marcadores.length, 0)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-3">{e.oQueAvalia}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* ══════════════ Sistemas ══════════════ */}
        <section className="mt-10">
          <p className="lab-rubrica">Por sistemas</p>
          <h2 className="mt-1 font-heading text-xl font-semibold tracking-tight">Exames por sistema do organismo</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Cada sistema organizado por eixo funcional, com mapas que desenham a cadeia órgão → processo → marcador.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SISTEMAS.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/manual-clinico/exames-laboratoriais/sistemas#${s.id}`}
                  prefetch={false}
                  className="lab-cartao lab-cartao-link flex h-full items-start gap-3 p-4"
                >
                  <span className="mt-0.5 shrink-0 rounded-lg bg-primary/10 p-2 text-primary">{ICONE_DO_SISTEMA[s.icone] ?? <Activity className="h-4 w-4" />}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold leading-snug">{s.nome}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground line-clamp-3">{s.chamada}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* ══════════════ Grupos de marcadores ══════════════ */}
        <section className="mt-10">
          <p className="lab-rubrica">Marcadores</p>
          <h2 className="mt-1 font-heading text-xl font-semibold tracking-tight">O acervo por grupo</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {grupos.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/manual-clinico/exames-laboratoriais/marcadores#${g.id}`}
                  prefetch={false}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium transition hover:border-primary/40"
                >
                  {g.nome}
                  <span className="font-mono text-[11px] font-bold text-primary">{g.total}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <ListaDeFavoritos />

        <div className="mt-10">
          <AvisoDeContexto />
        </div>

        <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground">
          Conteúdo educacional. Os intervalos de referência variam entre laboratórios, métodos, idade, sexo e população —
          use sempre o intervalo informado pelo laboratório que executou o exame. Nenhuma informação aqui substitui
          avaliação clínica individual.
        </p>
      </div>
    </AreaDosExames>
  )
}

/** Ícones dos sistemas, resolvidos pelo nome declarado em `sistemas.ts`. */
const ICONE_DO_SISTEMA: Record<string, React.ReactNode> = {
  Droplets: <Droplets className="h-4 w-4" />,
  Leaf: <Leaf className="h-4 w-4" />,
  Filter: <Filter className="h-4 w-4" />,
  HeartPulse: <HeartPulse className="h-4 w-4" />,
  Activity: <Activity className="h-4 w-4" />,
  Wind: <Wind className="h-4 w-4" />,
  Utensils: <Utensils className="h-4 w-4" />,
  ShieldCheck: <ShieldCheck className="h-4 w-4" />,
  Bug: <Bug className="h-4 w-4" />,
  Flame: <Flame className="h-4 w-4" />,
  Microscope: <Microscope className="h-4 w-4" />,
  Brain: <Brain className="h-4 w-4" />,
  Bone: <Bone className="h-4 w-4" />,
  FlaskConical: <FlaskConical className="h-4 w-4" />,
}

function Porta({
  href,
  icone,
  titulo,
  detalhe,
  destaque = false,
}: {
  href: string
  icone: React.ReactNode
  titulo: string
  detalhe: string
  destaque?: boolean
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={`lab-cartao lab-cartao-link group flex h-full flex-col p-4 ${destaque ? 'border-primary/35 bg-primary/[0.04]' : ''}`}
    >
      <span className={`inline-flex w-fit rounded-lg p-2 ${destaque ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
        {icone}
      </span>
      <span className="mt-2.5 text-sm font-bold leading-snug">{titulo}</span>
      <span className="mt-0.5 flex-1 text-xs leading-relaxed text-muted-foreground">{detalhe}</span>
      <ArrowRight className="mt-2 h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  )
}

function Numero({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/25 p-3">
      <dt className="font-mono text-xl font-bold text-primary">{valor.toLocaleString('pt-BR')}</dt>
      <dd className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{rotulo}</dd>
    </div>
  )
}
