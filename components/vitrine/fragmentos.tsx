import { CoverImage } from '@/components/cover-image'
import { cn } from '@/lib/utils'

/*
 * Pedaços da tela da prova e do banco, no tamanho em que aparecem no app.
 *
 * São as figuras das vitrines: o produto não tem fotografia, e um recorte da
 * própria interface, com dados que fecham a conta, mostra mais do que qualquer
 * foto mostraria. Cada um leva `data-ui` na raiz — dentro dele valem as
 * convenções do app (borda de 1px, raio pequeno, a cor só no dado).
 *
 * Os números de exemplo (horários, nota, turma, acertos) estão listados em
 * `lib/vitrines/exemplos.ts`, num lugar só, para que ninguém os confunda com
 * dado do banco.
 */

export interface ProvaDoFragmento {
  titulo: string
  capa: string | null
  questoes: number | null
  duracao: number | null
}

export function duracaoPorExtenso(minutos: number): string {
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto ? `${horas}h${String(resto).padStart(2, '0')}` : `${horas}h` // duração. taste-skill-ignore
}

/** A tela de entrada da prova: a capa, o nome e os números do cartão. */
export function FragmentoEntradaDaProva({
  prova,
  prioridade = false,
  rotulo = 'Prova geral',
}: {
  prova: ProvaDoFragmento
  prioridade?: boolean
  rotulo?: string
}) {
  const numeros = [
    prova.questoes ? { nome: 'Questões', valor: String(prova.questoes) } : null,
    prova.duracao ? { nome: 'Duração', valor: duracaoPorExtenso(prova.duracao) } : null,
  ].filter(Boolean) as Array<{ nome: string; valor: string }>

  return (
    <div data-ui className="overflow-hidden p-2.5" role="img" aria-label={`Tela de entrada da prova ${prova.titulo}`}>
      <div className="ui-cartao overflow-hidden">
        <div className="relative aspect-[2/1] w-full bg-[#153d1f]">
          <CoverImage
            src={prova.capa}
            alt=""
            priority={prioridade}
            sizes="(max-width: 768px) 100vw, 58vw"
            fallback={
              <span className="absolute inset-0 flex items-center justify-center">
                <img src="/img/logo_darkmode.svg" alt="" width={64} height={70} className="h-16 w-auto opacity-70" />
              </span>
            }
          />
        </div>
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="ui-pilula">{rotulo}</span>
            <span className="ui-pilula ui-pilula-dado">Portões abertos</span>
          </div>
          <p className="ui-titulo">{prova.titulo}</p>
          {numeros.length > 0 && (
            <div className="flex">
              {numeros.map((n, i) => (
                <div key={n.nome} className={cn('pr-6', i > 0 && 'ui-divisor pl-6')}>
                  <p className="ui-rotulo">{n.nome}</p>
                  <p className="ui-valor">{n.valor}</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="ui-rotulo">Relógio do servidor, o mesmo para a turma</span>
            <span className="ui-botao ui-botao-cheio">Iniciar prova</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export interface Marco {
  nome: string
  hora: string
}

/** Os quatro marcos da prova, com o de agora em destaque. */
export function FragmentoPortoes({ marcos, atual }: { marcos: Marco[]; atual: number }) {
  return (
    <div data-ui className="p-2.5" role="img" aria-label="Os portões da prova: os quatro horários, com os portões abertos agora">
      <div className="ui-cartao p-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold">Portões abertos</p>
          <span className="ui-pilula ui-pilula-dado">Você está na sala</span>
        </div>
        <ol className="mt-4 grid grid-cols-4">
          {marcos.map((m, i) => (
            <li key={m.nome} className="relative pr-2">
              <span aria-hidden className="block h-1 overflow-hidden rounded-full bg-[var(--ui-regra)]">
                {i <= atual && (
                  <span data-cresce-x style={{ ['--j' as string]: i }} className="block h-full bg-[var(--ui-dado)]" />
                )}
              </span>
              <p className="ui-rotulo mt-2">{m.nome}</p>
              <p className={cn('num font-semibold', i === atual && 'text-[var(--ui-dado)]')}>{m.hora}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

/** O fim da prova para quem entregou: a nota e as folhas de respostas. */
export function FragmentoResultado({
  acertos,
  total,
  folhas,
}: {
  acertos: number
  total: number
  folhas: string[]
}) {
  const nota = ((acertos / total) * 10).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return (
    <div data-ui className="p-2.5" role="img" aria-label={`Resultado: ${acertos} de ${total} questões, nota ${nota}`}>
      <div className="ui-cartao p-4">
        <p className="font-semibold">Prova entregue</p>
        <div className="mt-3 flex">
          <div className="pr-6">
            <p className="ui-rotulo">Acertos nas objetivas</p>
            <p className="ui-valor">
              {acertos} <span className="ui-suave text-[14px]">de {total}</span>
            </p>
          </div>
          <div className="ui-divisor pl-6">
            <p className="ui-rotulo">Nota</p>
            <p className="ui-valor">{nota}</p>
          </div>
        </div>
        <div className="ui-regra mt-4 flex flex-wrap gap-2 pt-4">
          {folhas.map((f) => (
            <span key={f} className="ui-botao">
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * A distribuição das notas da turma, sem nomes, com a faixa de quem olha.
 * Uma série, uma cor; a faixa da pessoa é a única no tom cheio.
 */
export function FragmentoDistribuicao({
  faixas,
  suaFaixa,
  suaNota,
  gabarito,
}: {
  faixas: number[]
  suaFaixa: number
  suaNota: string
  gabarito: { questao: number; letra: string; acertaram: number }
}) {
  const turma = faixas.reduce((a, b) => a + b, 0)
  const maior = Math.max(...faixas)
  return (
    <div
      data-ui
      className="p-2.5"
      role="img"
      aria-label={`Distribuição das notas da turma: ${turma} alunos; sua nota, ${suaNota}, na faixa de ${suaFaixa} a ${suaFaixa + 1}`}
    >
      <div className="ui-cartao p-4">
        <div className="flex items-baseline justify-between">
          <p className="font-semibold">Notas da turma</p>
          <p className="ui-rotulo num">{turma} alunos</p>
        </div>
        <div className="mt-4 flex h-28 items-end gap-1.5">
          {faixas.map((n, i) => (
            <div key={i} className="flex h-full flex-1 flex-col justify-end">
              <span
                data-cresce-y
                className={cn(
                  'block rounded-t-[6px]',
                  i === suaFaixa ? 'bg-[linear-gradient(180deg,#f2c063,#e2a43e)] shadow-[0_0_24px_rgba(226,164,62,0.55)]' : 'bg-[var(--ui-controle)]',
                )}
                style={{ height: `${Math.max(2, (n / maior) * 100)}%`, ['--j' as string]: i }}
              />
            </div>
          ))}
        </div>
        <div className="ui-rotulo num mt-1.5 flex justify-between">
          <span>0</span>
          <span>5</span>
          <span>10</span>
        </div>
        <p className="mt-2 text-[13px]">
          Você: <span className="num font-semibold text-[#f2c063]">{suaNota}</span>
        </p>
        <div className="ui-regra mt-3 flex items-center justify-between gap-3 pt-3">
          <span>
            Questão {gabarito.questao} · gabarito <span className="font-semibold">{gabarito.letra}</span>
          </span>
          <span className="ui-rotulo num">
            {gabarito.acertaram} de {turma} acertaram
          </span>
        </div>
      </div>
    </div>
  )
}

/** Os filtros do banco, à vista enquanto a lista rola. */
export function FragmentoFiltros({ filtros, resultado }: { filtros: string[]; resultado: string }) {
  return (
    <div data-ui className="p-2.5" role="img" aria-label={`Filtros do banco: ${filtros.join(', ')}; ${resultado}`}>
      <div className="ui-cartao flex flex-wrap items-center gap-2 p-4">
        {filtros.map((f) => (
          <span key={f} className="ui-pilula">
            {f} <span aria-hidden className="ui-suave">×</span>
          </span>
        ))}
        <span className="ui-rotulo num ml-auto">{resultado}</span>
      </div>
    </div>
  )
}

/** O saldo da conta gratuita: dez questões, abertas por escolha. */
export function FragmentoSaldo({ abertas, limite }: { abertas: string[]; limite: number }) {
  return (
    <div data-ui className="p-2.5" role="img" aria-label={`Questões grátis: ${abertas.length} de ${limite} abertas`}>
      <div className="ui-cartao p-4">
        <div className="flex items-baseline justify-between">
          <p className="font-semibold">Questões grátis</p>
          <p className="num">
            {abertas.length} <span className="ui-suave">de {limite} abertas</span>
          </p>
        </div>
        <div className="mt-3 grid grid-cols-10 gap-1">
          {Array.from({ length: limite }, (_, i) => (
            <span
              key={i}
              data-cresce-y={i < abertas.length ? '' : undefined}
              style={{ ['--j' as string]: i }}
              className={cn('h-2 rounded-full', i < abertas.length ? 'bg-[var(--ui-dado)]' : 'bg-[var(--ui-regra)]')}
            />
          ))}
        </div>
        <ul className="mt-3">
          {abertas.map((q) => (
            <li key={q} className="ui-regra flex items-center justify-between py-2">
              <span>{q}</span>
              <span className="ui-rotulo">liberada</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** Onde a pessoa erra, tópico por tópico. */
export function FragmentoDesempenho({ linhas }: { linhas: Array<{ topico: string; acertos: number; total: number }> }) {
  const pior = linhas.reduce((p, l, i) => (l.acertos / l.total < linhas[p].acertos / linhas[p].total ? i : p), 0)
  return (
    <div data-ui className="p-2.5" role="img" aria-label="Acerto por tópico">
      <div className="ui-cartao p-4">
        <p className="font-semibold">Acerto por tópico</p>
        <ul className="mt-3 space-y-3">
          {linhas.map((l, i) => {
            const pct = Math.round((l.acertos / l.total) * 100)
            return (
              <li key={l.topico}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className={cn(i === pior && 'font-semibold')}>
                    {l.topico}
                    {i === pior && <span className="ui-rotulo"> · seu ponto fraco</span>}
                  </span>
                  <span className="num ui-suave">
                    {l.acertos}/{l.total} · <span className="text-[var(--ui-texto)]">{pct}%</span>
                  </span>
                </div>
                <div className="ui-barra mt-1.5">
                  <span data-cresce-x style={{ width: `${pct}%`, ['--j' as string]: i }} />
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

/** Um módulo do catálogo do banco: os tópicos com quantas questões têm. */
export function FragmentoCatalogo({
  modulo,
}: {
  modulo: { nome: string; total: number; topicos: Array<{ nome: string; total: number; subtopicos: number }> }
}) {
  return (
    <div data-ui className="p-2.5" role="img" aria-label={`Catálogo do banco: ${modulo.nome}, ${modulo.total} questões`}>
      <div className="ui-cartao p-4">
        <div className="flex items-center justify-end gap-2 pb-3">
          <span className="ui-botao w-48 font-normal text-[var(--ui-suave)]">Buscar tópico</span>
          <span className="ui-botao">Semestre</span>
        </div>
        <div className="ui-regra flex items-baseline justify-between pt-3">
          <p className="ui-titulo">{modulo.nome}</p>
          <p className="num ui-suave">{modulo.total.toLocaleString('pt-BR')} questões</p>
        </div>
        <ul className="mt-3">
          {modulo.topicos.slice(0, 6).map((t) => (
            <li key={t.nome} className="ui-regra flex items-center justify-between gap-4 py-2.5">
              <span>
                {t.nome}
                {t.subtopicos > 0 && <span className="ui-rotulo"> · {t.subtopicos} subtópicos</span>}
              </span>
              <span className="num">{t.total.toLocaleString('pt-BR')}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
