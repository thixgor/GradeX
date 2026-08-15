'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { Dices, Eye, FlaskConical, Link2, RefreshCw, Sparkles } from 'lucide-react'

import {
  CENARIOS,
  CENARIO_POR_ID,
  cenariosPorCategoria,
  gerarExame,
  type Cenario,
  type ExameGerado,
} from '@/lib/exames-laboratoriais/laboratorio-virtual'
import { AvisoDeContexto, AvisoDeReferencia, BlocoDaFolha, CabecalhoDaFolha, LinhaResultado } from './folha'

/**
 * O Laboratório Virtual.
 *
 * A ideia é simples e a execução importa: gerar exames fictícios que reproduzem
 * o **padrão fisiopatológico** de uma condição, não um caso decorado. Os valores
 * são sorteados dentro de faixas coerentes a cada clique, então a mesma anemia
 * ferropriva nunca sai duas vezes igual — o que treina o reconhecimento do
 * padrão em vez da memorização de números.
 *
 * O modo desafio inverte a ordem que a tela naturalmente sugere: primeiro o
 * exame e o contexto, sem resposta; a interpretação só aparece quando a pessoa
 * pede. É a diferença entre ler uma explicação e ter tentado antes de lê-la.
 *
 * Nenhum dado vem de paciente real: sexo e idade são sorteados dentro da faixa
 * plausível do quadro, e nome nunca é atribuído.
 */
export function LaboratorioVirtual({ inicial }: { inicial?: string }) {
  const [exame, setExame] = useState<ExameGerado | null>(() => (inicial ? gerarExame(inicial) : null))
  const [desafio, setDesafio] = useState(true)
  const categorias = useMemo(() => cenariosPorCategoria(), [])

  const gerar = useCallback((id: string) => setExame(gerarExame(id)), [])

  const sortear = useCallback(() => {
    const lista = CENARIOS.filter((c) => c.id !== 'normal')
    gerar(lista[Math.floor(Math.random() * lista.length)].id)
  }, [gerar])

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="lab-rubrica">Gerar exame</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Escolha um cenário ou sorteie. Os valores mudam a cada geração, mantendo o padrão da condição.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold">
              <input
                type="checkbox"
                checked={desafio}
                onChange={(e) => setDesafio(e.target.checked)}
                className="h-3.5 w-3.5 accent-current"
              />
              Modo desafio
            </label>
            <button
              onClick={sortear}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98]"
            >
              <Dices className="h-3.5 w-3.5" /> Exame aleatório
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {categorias.map((grupo) => (
            <div key={grupo.categoria}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{grupo.categoria}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {grupo.cenarios.map((c) => (
                  <Chip key={c.id} ativo={exame?.cenarioId === c.id} onClick={() => gerar(c.id)}>
                    {c.nome}
                  </Chip>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {!exame ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
          <FlaskConical className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-semibold">Escolha um cenário acima para gerar um exame</p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
            Com o modo desafio ligado, você recebe o contexto clínico e os valores — e só vê a interpretação quando
            pedir. É a ordem que treina raciocínio, e não reconhecimento.
          </p>
        </div>
      ) : (
        // A chave recria o estado a cada exame novo: a resposta revelada de um
        // caso nunca vaza para o seguinte.
        <ExamePraticado key={exame.semente} exame={exame} desafio={desafio} aoRegerar={() => gerar(exame.cenarioId)} />
      )}
    </div>
  )
}

/**
 * O gerador embutido nas páginas de exame.
 *
 * Mesmo motor, superfície menor: a página do hemograma oferece só os cenários
 * hematológicos, a hepática só os do fígado. Evita que a pessoa saia da página
 * para praticar exatamente o que está estudando.
 */
export function GerarParaPraticar({ cenarios, titulo = 'Gerar exame para praticar' }: { cenarios: string[]; titulo?: string }) {
  const disponiveis = useMemo(
    () => cenarios.map((id) => CENARIO_POR_ID.get(id)).filter((c): c is Cenario => !!c),
    [cenarios],
  )
  const [exame, setExame] = useState<ExameGerado | null>(null)
  const [desafio, setDesafio] = useState(true)

  if (disponiveis.length === 0) return null

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="lab-rubrica">Praticar</p>
          <h2 className="mt-1 font-heading text-lg font-semibold tracking-tight">{titulo}</h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
            Cada geração sorteia valores novos dentro do mesmo padrão fisiopatológico — é o padrão que se aprende a
            reconhecer, não o caso.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold">
          <input type="checkbox" checked={desafio} onChange={(e) => setDesafio(e.target.checked)} className="h-3.5 w-3.5 accent-current" />
          Modo desafio
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {disponiveis.map((c) => (
          <Chip key={c.id} ativo={exame?.cenarioId === c.id} onClick={() => setExame(gerarExame(c.id))}>
            {c.nome}
          </Chip>
        ))}
      </div>

      {exame && (
        <div className="mt-5">
          <ExamePraticado
            key={exame.semente}
            exame={exame}
            desafio={desafio}
            aoRegerar={() => setExame(gerarExame(exame.cenarioId))}
          />
        </div>
      )}
    </section>
  )
}

function Chip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition ${
        ativo
          ? 'border-primary/45 bg-primary/10 font-semibold text-primary'
          : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/30 hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}

/* ════════════════════ A folha gerada e a resposta ════════════════════ */

function ExamePraticado({ exame, desafio, aoRegerar }: { exame: ExameGerado; desafio: boolean; aoRegerar: () => void }) {
  const cenario = CENARIO_POR_ID.get(exame.cenarioId)
  const [revelado, setRevelado] = useState(false)
  const [conectando, setConectando] = useState(false)

  if (!cenario) return null

  return (
    <div className="space-y-5">
      <div className="lab-folha">
        <CabecalhoDaFolha
          titulo="Painel laboratorial"
          paciente={`Paciente educacional · ${exame.paciente.sexo === 'M' ? 'Masculino' : 'Feminino'} · ${exame.paciente.idade} anos`}
          material="Sangue e urina"
        />
        <div className="border-b border-border bg-muted/30 px-5 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Contexto clínico</p>
          <p className="mt-1 text-sm leading-relaxed">{cenario.contexto}</p>
        </div>

        {exame.blocos.map((bloco) => (
          <BlocoDaFolha key={bloco.titulo} titulo={bloco.titulo}>
            {bloco.valores.map((v) => (
              <LinhaResultado
                key={v.id}
                linha={{ id: v.ficha, nome: v.nome, valor: v.valor, unidade: v.unidade, referencia: v.referencia, direcao: v.direcao }}
              />
            ))}
          </BlocoDaFolha>
        ))}

        <div className="px-5 pb-4 pt-3">
          <AvisoDeReferencia />
          <p className="mt-2 text-[11px] text-muted-foreground">
            Exame gerado para estudo. Nenhum dado provém de paciente real. Semente {exame.semente}.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={aoRegerar}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-4 py-2 text-xs font-bold transition hover:border-primary/35"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Gerar outro deste cenário
        </button>
        <button
          onClick={() => setConectando((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-4 py-2 text-xs font-bold transition hover:border-primary/35"
        >
          <Link2 className="h-3.5 w-3.5" /> {conectando ? 'Ocultar conexões' : 'Conectar alterações'}
        </button>
        {desafio && !revelado && (
          <button
            onClick={() => setRevelado(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98]"
          >
            <Eye className="h-3.5 w-3.5" /> Ver interpretação
          </button>
        )}
      </div>

      {conectando && <ConectarAlteracoes exame={exame} />}

      {desafio && !revelado ? (
        <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-4">
          <p className="text-sm font-bold">Tente interpretar antes de ver a resposta</p>
          <ol className="mt-2 space-y-1 text-xs leading-relaxed text-muted-foreground">
            <li>1. Quais valores estão fora da faixa? Marque todos antes de interpretar qualquer um.</li>
            <li>2. Agrupe as alterações por sistema — elas raramente são independentes entre si.</li>
            <li>3. Que padrão elas formam juntas? Que mecanismo único explicaria o conjunto?</li>
            <li>4. Qual exame decidiria entre as hipóteses que sobraram?</li>
          </ol>
        </div>
      ) : (
        <Interpretacao cenario={cenario} />
      )}
    </div>
  )
}

/**
 * Conectar alterações — a leitura do conjunto.
 *
 * Lista o que está fora da faixa e mostra que o valor de cada um só ganha
 * sentido ao lado dos outros. É a tradução em tela da tese da seção: alteração
 * isolada e conjunto de alterações não significam a mesma coisa.
 */
function ConectarAlteracoes({ exame }: { exame: ExameGerado }) {
  const alteradas = exame.blocos.flatMap((b) =>
    b.valores.filter((v) => v.direcao !== 'normal').map((v) => ({ ...v, bloco: b.titulo })),
  )

  if (alteradas.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-muted/25 px-4 py-4 text-sm leading-relaxed text-muted-foreground">
        Nenhum valor fora da faixa de referência neste exame. Vale lembrar que exames normais não excluem doença — eles
        afastam um conjunto de hipóteses e reorientam o raciocínio para o que o laboratório não vê.
      </div>
    )
  }

  const porBloco = alteradas.reduce<Record<string, typeof alteradas>>((acc, v) => {
    ;(acc[v.bloco] ??= []).push(v)
    return acc
  }, {})

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <p className="lab-rubrica">Conectar alterações</p>
      <h3 className="mt-1 font-heading text-base font-semibold tracking-tight">
        {alteradas.length} {alteradas.length === 1 ? 'valor fora da faixa' : 'valores fora da faixa'}
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Agrupados por bloco. Um marcador alterado sozinho e vários alterados juntos raramente contam a mesma história —
        procure o mecanismo único que explicaria o conjunto. Toque em qualquer um para abrir a ficha.
      </p>

      <div className="mt-4 space-y-3">
        {Object.entries(porBloco).map(([bloco, valores]) => (
          <div key={bloco} className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{bloco}</p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {valores.map((v) => (
                <li key={v.id}>
                  <Link
                    href={`/manual-clinico/exames-laboratoriais/marcador/${v.ficha}`}
                    prefetch={false}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-xs transition hover:border-primary/40 ${
                      v.direcao.includes('alto')
                        ? 'border-amber-400/30 bg-amber-400/10 text-amber-700 dark:text-amber-300'
                        : 'border-sky-400/30 bg-sky-400/10 text-sky-700 dark:text-sky-300'
                    }`}
                  >
                    {v.nome} {v.direcao.includes('alto') ? '↑' : '↓'}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

/** A resposta comentada, na ordem em que o raciocínio clínico acontece. */
function Interpretacao({ cenario }: { cenario: Cenario }) {
  const i = cenario.interpretacao

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-primary/25 bg-primary/[0.04] p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="lab-rubrica">Interpretação</p>
        </div>

        <h3 className="mt-2 font-heading text-lg font-semibold tracking-tight">{i.hipotese}</h3>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Alterações principais</p>
            <ul className="mt-1.5 space-y-1">
              {i.alteracoes.map((a) => (
                <li key={a} className="text-sm leading-relaxed">
                  {a}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Padrão laboratorial</p>
            <p className="mt-1.5 text-sm leading-relaxed">{i.padrao}</p>
            {i.padraoId && (
              <Link
                href={`/manual-clinico/exames-laboratoriais/padroes#${i.padraoId}`}
                prefetch={false}
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Abrir o padrão completo →
              </Link>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-3.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Mecanismo</p>
          <p className="mt-1 text-sm leading-relaxed">{i.mecanismo}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Diagnósticos diferenciais</p>
          <ul className="mt-2 space-y-1.5">
            {i.diferenciais.map((d) => (
              <li key={d} className="text-sm leading-relaxed text-muted-foreground">
                {d}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Exames adicionais</p>
          <ul className="mt-2 space-y-1.5">
            {i.examesAdicionais.map((e) => (
              <li key={e} className="text-sm leading-relaxed text-muted-foreground">
                {e}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Explicação completa</p>
        <div className="mt-2 space-y-3">
          {i.explicacao.map((p, idx) => (
            <p key={idx} className="text-sm leading-relaxed">
              {p}
            </p>
          ))}
        </div>
      </div>

      <AvisoDeContexto />
    </div>
  )
}
