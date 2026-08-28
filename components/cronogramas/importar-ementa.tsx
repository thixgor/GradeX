'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  BookOpen,
  Check,
  FileText,
  Info,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { analisarEmenta, detectarAlvo, resumirBruto, type ResumoEmenta } from '@/lib/cronogramas/analisar-ementa'
import { ESTILO_PRIORIDADE, SECOES, getSecao, type SecaoCurso } from '@/lib/cronogramas/tipos'

/** Uma ementa já gravada, como a rota do painel devolve. */
export interface EmentaImportada {
  secao: SecaoCurso
  periodo: number
  origem: string[]
  importadaEm?: string
  topicos: number
  subtopicos: number
  modulos: number
  submodulos: number
  horas: number
  nomesDosTopicos: string[]
}

/** Um arquivo (ou texto colado) esperando confirmação antes de subir. */
interface Candidato {
  id: string
  nome: string
  markdown: string
  secao: SecaoCurso
  periodo: number
  resumo: ResumoEmenta
  /** true quando seção/período vieram do nome do arquivo, não da mão do admin. */
  detectado: boolean
}

interface ImportarEmentaProps {
  importadas: EmentaImportada[]
  carregando: boolean
  onImportar: (itens: Array<{ secao: SecaoCurso; periodo: number; markdown: string; nome: string }>, adicionar: boolean) => Promise<boolean>
  onRemover: (secao: SecaoCurso, periodo: number) => void
}

let sequencia = 0

/**
 * Importação da ementa.
 *
 * A ementa é conteúdo da coordenação, não código — então ela entra por aqui,
 * do mesmo markdown que já é escrito à mão, sem passar por deploy.
 *
 * O fluxo assume o caso real: o admin tem uma pasta com dez arquivos de um
 * curso e quer subir todos. Ele solta os dez de uma vez, a tela adivinha seção
 * e período pelo nome de cada um, mostra o que leu de cada arquivo (quantos
 * tópicos, módulos, quantos com prioridade declarada) e só então importa. Ler
 * antes de gravar é o que evita descobrir que um arquivo veio truncado depois
 * que ele já substituiu a ementa de um período inteiro.
 */
export function ImportarEmenta({ importadas, carregando, onImportar, onRemover }: ImportarEmentaProps) {
  const [candidatos, setCandidatos] = useState<Candidato[]>([])
  const [texto, setTexto] = useState('')
  const [secaoColada, setSecaoColada] = useState<SecaoCurso>('medicina')
  const [periodoColado, setPeriodoColado] = useState(1)
  const [adicionar, setAdicionar] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [arrastando, setArrastando] = useState(false)

  const entradaDeArquivo = useRef<HTMLInputElement>(null)

  const receberArquivos = useCallback(async (arquivos: FileList | File[]) => {
    setErro(null)
    const novos: Candidato[] = []

    for (const arquivo of Array.from(arquivos)) {
      if (!/\.(md|markdown|txt)$/i.test(arquivo.name)) {
        setErro(`"${arquivo.name}" não é .md ou .txt — ignorei.`)
        continue
      }

      const markdown = await arquivo.text()
      const { topicos, periodoDetectado } = analisarEmenta(markdown)

      if (topicos.length === 0) {
        setErro(`Não encontrei nenhum tópico em "${arquivo.name}". Confira o formato.`)
        continue
      }

      const alvo = detectarAlvo(arquivo.name)
      novos.push({
        id: `arquivo-${sequencia++}`,
        nome: arquivo.name,
        markdown,
        secao: alvo?.secao ?? 'medicina',
        periodo: alvo?.periodo ?? periodoDetectado ?? 1,
        resumo: resumirBruto(topicos),
        detectado: alvo?.periodo != null || periodoDetectado != null,
      })
    }

    if (novos.length > 0) setCandidatos(anterior => [...anterior, ...novos])
  }, [])

  function adicionarTextoColado() {
    setErro(null)
    const { topicos, periodoDetectado } = analisarEmenta(texto)

    if (topicos.length === 0) {
      setErro('Não encontrei nenhum tópico no texto. As linhas precisam começar com TÓPICO:, Subtópico:, Módulo: ou Submódulo:.')
      return
    }

    setCandidatos(anterior => [
      ...anterior,
      {
        id: `colado-${sequencia++}`,
        nome: 'Texto colado',
        markdown: texto,
        secao: secaoColada,
        periodo: periodoDetectado ?? periodoColado,
        resumo: resumirBruto(topicos),
        detectado: periodoDetectado != null,
      },
    ])
    setTexto('')
  }

  function ajustar(id: string, mudancas: Partial<Pick<Candidato, 'secao' | 'periodo'>>) {
    setCandidatos(anterior =>
      anterior.map(item => (item.id === id ? { ...item, ...mudancas, detectado: false } : item)),
    )
  }

  /** Quais períodos serão gravados, já agrupados como o servidor vai agrupar. */
  const destinos = useMemo(() => {
    const mapa = new Map<string, { secao: SecaoCurso; periodo: number; arquivos: number; resumo: ResumoEmenta }>()
    for (const candidato of candidatos) {
      const chave = `${candidato.secao}:${candidato.periodo}`
      const atual = mapa.get(chave)
      if (atual) {
        atual.arquivos += 1
        atual.resumo = somar(atual.resumo, candidato.resumo)
      } else {
        mapa.set(chave, { secao: candidato.secao, periodo: candidato.periodo, arquivos: 1, resumo: { ...candidato.resumo } })
      }
    }
    return [...mapa.values()].sort((a, b) => a.secao.localeCompare(b.secao) || a.periodo - b.periodo)
  }, [candidatos])

  /** Destinos que vão sobrescrever algo já importado — o aviso antes do clique. */
  const sobrescritos = useMemo(() => {
    if (adicionar) return []
    return destinos.filter(destino =>
      importadas.some(item => item.secao === destino.secao && item.periodo === destino.periodo),
    )
  }, [destinos, importadas, adicionar])

  async function importar() {
    if (candidatos.length === 0) return
    setEnviando(true)
    setErro(null)

    const ok = await onImportar(
      candidatos.map(item => ({
        secao: item.secao,
        periodo: item.periodo,
        markdown: item.markdown,
        nome: item.nome,
      })),
      adicionar,
    )

    setEnviando(false)
    if (ok) setCandidatos([])
  }

  return (
    <div className="space-y-4">
      {/* ── Entrada: arrastar, escolher ou colar ── */}
      <section className="glass-page-card rounded-2xl p-4 sm:p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <BookOpen className="h-5 w-5 text-[#468152]" aria-hidden />
          Importar ementa
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          O mesmo markdown que a coordenação já escreve. Vale para a seção e o período que você
          escolher, e passa a valer para os alunos na hora — sem deploy.
        </p>

        <div
          onDragOver={evento => {
            evento.preventDefault()
            setArrastando(true)
          }}
          onDragLeave={() => setArrastando(false)}
          onDrop={evento => {
            evento.preventDefault()
            setArrastando(false)
            void receberArquivos(evento.dataTransfer.files)
          }}
          className={`mt-4 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
            arrastando ? 'border-[#468152] bg-[#468152]/8' : 'border-border/60 bg-muted/20'
          }`}
        >
          <Upload className="mx-auto h-7 w-7 text-muted-foreground" aria-hidden />
          <p className="mt-2 text-sm font-medium text-foreground">
            Arraste os arquivos <code className="rounded bg-muted px-1 text-xs">.md</code> aqui
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Pode soltar vários de uma vez — a seção e o período saem do nome de cada arquivo.
          </p>

          <input
            ref={entradaDeArquivo}
            type="file"
            accept=".md,.markdown,.txt"
            multiple
            className="hidden"
            onChange={evento => {
              if (evento.target.files) void receberArquivos(evento.target.files)
              evento.target.value = ''
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => entradaDeArquivo.current?.click()}
            className="mt-3 h-9 rounded-lg"
          >
            Escolher arquivos
          </Button>
        </div>

        <details className="mt-3 rounded-xl border border-border/60 bg-background/50 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-foreground">
            Ou colar o texto direto
          </summary>

          <div className="mt-3 space-y-2">
            <textarea
              value={texto}
              onChange={evento => setTexto(evento.target.value)}
              rows={8}
              placeholder={'TÓPICO: SOI I:\n1. Subtópico: BASES CELULARES (Prioridade: Alta)\n├─ Módulo: Ciclo celular (Prioridade: Alta)\n│   ├─ Submódulo: Interfase e fase M (Prioridade: Alta)'}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-[#468152]/50"
            />

            <div className="flex flex-wrap items-end gap-2">
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Seção</span>
                <select
                  value={secaoColada}
                  onChange={evento => setSecaoColada(evento.target.value as SecaoCurso)}
                  className="h-9 rounded-lg border border-border bg-background px-2 text-sm outline-none"
                >
                  {SECOES.map(secao => (
                    <option key={secao.id} value={secao.id}>{secao.emoji} {secao.nome}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Período</span>
                <select
                  value={periodoColado}
                  onChange={evento => setPeriodoColado(Number(evento.target.value))}
                  className="h-9 rounded-lg border border-border bg-background px-2 text-sm outline-none"
                >
                  {Array.from({ length: getSecao(secaoColada).periodos }, (_, i) => i + 1).map(numero => (
                    <option key={numero} value={numero}>{numero}º</option>
                  ))}
                </select>
              </label>

              <Button
                size="sm"
                variant="outline"
                onClick={adicionarTextoColado}
                disabled={texto.trim().length === 0}
                className="h-9 rounded-lg"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Adicionar à fila
              </Button>
            </div>
          </div>
        </details>

        {erro && (
          <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-destructive/10 p-2.5 text-xs font-medium text-destructive">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            {erro}
          </p>
        )}
      </section>

      {/* ── Conferência antes de gravar ── */}
      {candidatos.length > 0 && (
        <section className="glass-page-card rounded-2xl p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-foreground">
              {candidatos.length} arquivo{candidatos.length === 1 ? '' : 's'} para importar
            </h3>
            <button
              onClick={() => setCandidatos([])}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Limpar fila
            </button>
          </div>

          <ul className="mt-3 space-y-2">
            {candidatos.map(candidato => (
              <li key={candidato.id} className="rounded-xl border border-border/50 bg-background/60 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="truncate">{candidato.nome}</span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {candidato.resumo.topicos} tópicos · {candidato.resumo.subtopicos} subtópicos ·{' '}
                      {candidato.resumo.modulos} módulos · {candidato.resumo.submodulos} submódulos ·{' '}
                      ~{candidato.resumo.horas}h
                    </p>
                    <p className="mt-1 text-xs">
                      {candidato.resumo.comPrioridade > 0 ? (
                        <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-semibold ${ESTILO_PRIORIDADE.alta.classe}`}>
                          {candidato.resumo.comPrioridade} itens com prioridade declarada
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          Sem prioridade declarada — tudo entra como {ESTILO_PRIORIDADE.normal.rotulo.toLowerCase()}.
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <select
                      value={candidato.secao}
                      onChange={evento => ajustar(candidato.id, { secao: evento.target.value as SecaoCurso })}
                      aria-label={`Seção de ${candidato.nome}`}
                      className="h-8 rounded-lg border border-border bg-background px-1.5 text-xs outline-none"
                    >
                      {SECOES.map(secao => (
                        <option key={secao.id} value={secao.id}>{secao.emoji} {secao.curto}</option>
                      ))}
                    </select>

                    <select
                      value={candidato.periodo}
                      onChange={evento => ajustar(candidato.id, { periodo: Number(evento.target.value) })}
                      aria-label={`Período de ${candidato.nome}`}
                      className="h-8 rounded-lg border border-border bg-background px-1.5 text-xs outline-none"
                    >
                      {Array.from({ length: getSecao(candidato.secao).periodos }, (_, i) => i + 1).map(numero => (
                        <option key={numero} value={numero}>{numero}º</option>
                      ))}
                    </select>

                    <button
                      onClick={() => setCandidatos(anterior => anterior.filter(item => item.id !== candidato.id))}
                      aria-label={`Tirar ${candidato.nome} da fila`}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {destinos.length > 0 && (
            <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                Vira {destinos.length} ementa{destinos.length === 1 ? '' : 's'}:{' '}
                {destinos
                  .map(d => `${getSecao(d.secao).curto} ${d.periodo}º${d.arquivos > 1 ? ` (${d.arquivos} arquivos juntos)` : ''}`)
                  .join(', ')}
                .
              </span>
            </p>
          )}

          <label className="mt-3 flex items-start gap-2 text-xs text-foreground">
            <input
              type="checkbox"
              checked={adicionar}
              onChange={evento => setAdicionar(evento.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 accent-[#468152]"
            />
            <span>
              <strong>Somar aos tópicos já importados</strong> em vez de substituir o período.
              <span className="block text-muted-foreground">
                Use ao subir HAM I num período que já tem SOI I. Tópico de mesmo nome é atualizado, não duplicado.
              </span>
            </span>
          </label>

          {sobrescritos.length > 0 && (
            <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-[#E2A43E]/12 p-2.5 text-xs font-medium text-[#9A6D12] dark:text-[#E2A43E]">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                Vai substituir a ementa de{' '}
                {sobrescritos.map(d => `${getSecao(d.secao).curto} ${d.periodo}º`).join(', ')}. Marque
                a caixa acima se a intenção era somar.
              </span>
            </p>
          )}

          <Button
            onClick={importar}
            disabled={enviando}
            className="mt-4 h-11 w-full rounded-xl bg-gradient-to-r from-[#468152] to-[#5a9a63] font-semibold text-white"
          >
            {enviando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando…
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Importar {destinos.length} ementa{destinos.length === 1 ? '' : 's'}
              </>
            )}
          </Button>
        </section>
      )}

      {/* ── O que já está no ar ── */}
      <section className="glass-page-card rounded-2xl p-4 sm:p-5">
        <h3 className="text-sm font-bold text-foreground">Ementas publicadas</h3>

        {carregando ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Carregando…
          </p>
        ) : importadas.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Nenhuma ementa importada ainda. Enquanto isso, o aluno vê o estado vazio no lugar da
            ementa e não consegue montar cronograma pelo conteúdo do período.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {importadas.map(item => {
              const secao = getSecao(item.secao)
              return (
                <li
                  key={`${item.secao}-${item.periodo}`}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-border/50 bg-background/60 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold" style={{ color: secao.cor }}>
                      {secao.emoji} {secao.nome} · {item.periodo}º período
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.topicos} tópicos · {item.subtopicos} subtópicos · {item.modulos} módulos ·{' '}
                      {item.submodulos} submódulos · ~{item.horas}h
                    </p>
                    {item.nomesDosTopicos.length > 0 && (
                      <p className="mt-1 truncate text-xs text-muted-foreground/80">
                        {item.nomesDosTopicos.join(' · ')}
                      </p>
                    )}
                    {item.importadaEm && (
                      <p className="mt-1 text-[11px] text-muted-foreground/70">
                        Importada em {new Date(item.importadaEm).toLocaleString('pt-BR')}
                        {item.origem.length > 0 && ` · ${item.origem.join(', ')}`}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => onRemover(item.secao, item.periodo)}
                    aria-label={`Remover ementa de ${secao.nome} ${item.periodo}º período`}
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function somar(a: ResumoEmenta, b: ResumoEmenta): ResumoEmenta {
  return {
    topicos: a.topicos + b.topicos,
    subtopicos: a.subtopicos + b.subtopicos,
    modulos: a.modulos + b.modulos,
    submodulos: a.submodulos + b.submodulos,
    horas: a.horas + b.horas,
    comPrioridade: a.comPrioridade + b.comPrioridade,
  }
}
