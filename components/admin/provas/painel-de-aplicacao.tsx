'use client'

import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Clock, Download, GraduationCap, Loader2, Lock, ShieldOff, Shuffle, Users } from 'lucide-react'
import { MAX_PERIODO, MIN_PERIODO } from '@/lib/user-periodo'
import {
  type EsperasDeDownload,
  type LiberacoesDeDownload,
  type QuandoLibera,
  normalizarEsperas,
  normalizarLiberacoes,
} from '@/lib/provas/downloads-da-prova'
import { type PublicoDaProva, normalizarPublico } from '@/lib/provas/publico-da-prova'
import { type TravasAntiCola, normalizarTravas } from '@/lib/provas/anti-cola'
import { cn } from '@/lib/utils'

/**
 * Como esta prova é aplicada: a quem, com que embaralhamento e com quais PDFs
 * liberados.
 *
 * As três decisões estão juntas porque são a mesma decisão vista de ângulos
 * diferentes — o que a turma recebe. Espalhá-las por três seções distantes do
 * formulário é o que faz alguém agendar uma prova para o 3º período e só
 * descobrir na hora que o gabarito estava liberado para download.
 *
 * Cada bloco carrega a consequência ao lado do controle, não numa ajuda
 * escondida: quantos alunos o período alcança agora, o que o embaralhamento faz
 * com a letra da alternativa, e por que a exceção de download não vale para o
 * gabarito.
 */

interface Props {
  publico: PublicoDaProva
  onPublicoChange: (publico: PublicoDaProva) => void
  liberacoes: LiberacoesDeDownload
  onLiberacoesChange: (liberacoes: LiberacoesDeDownload) => void
  /** Quais arquivos ficam presos até o término. Ausente = prova sem término (treino). */
  esperas?: EsperasDeDownload
  onEsperasChange?: (esperas: EsperasDeDownload) => void
  travas: TravasAntiCola
  onTravasChange: (travas: TravasAntiCola) => void
  embaralharQuestoes: boolean
  embaralharAlternativas: boolean
  onEmbaralharChange: (campo: 'questoes' | 'alternativas', valor: boolean) => void
  /** Prova pessoal não tem público nem exceção de plano a configurar. */
  desabilitado?: boolean
}

const PERIODOS = Array.from({ length: MAX_PERIODO - MIN_PERIODO + 1 }, (_, i) => MIN_PERIODO + i)

/** Como cada momento é dito na tela do admin. */
const ROTULO_DO_MOMENTO: Record<QuandoLibera, string> = {
  imediato: 'Assim que a prova abre',
  'apos-entrega': 'Depois que o aluno entregar',
  'apos-termino': 'Depois que a prova terminar',
}

/**
 * Os arquivos da prova, na ordem em que fazem sentido para quem configura.
 *
 * `momentos` ausente significa que o arquivo não tem escolha — e `porQueFixo`
 * diz por quê, na própria linha. Sem essa frase o admin ficaria procurando o
 * botão que não existe.
 */
const ARQUIVOS: {
  chave: keyof LiberacoesDeDownload
  titulo: string
  descricao: string
  momentos?: QuandoLibera[]
  quandoFixo?: QuandoLibera
  porQueFixo?: string
}[] = [
  {
    chave: 'prova',
    titulo: 'Prova em branco',
    descricao: 'O caderno de questões, sem gabarito. Serve para imprimir e refazer no papel.',
    momentos: ['imediato', 'apos-entrega', 'apos-termino'],
  },
  {
    chave: 'compacto',
    titulo: 'Folha de respostas do aluno',
    descricao: 'Só as letras que ele marcou — o que se confere com os colegas na saída. Sem enunciado e sem gabarito.',
    quandoFixo: 'apos-entrega',
    porQueFixo: 'antes disso não há resposta',
  },
  {
    chave: 'relatorio',
    titulo: 'Relatório do aluno',
    descricao: 'A prova dele com as respostas marcadas e a nota.',
    momentos: ['apos-entrega', 'apos-termino'],
  },
  {
    chave: 'gabarito',
    titulo: 'Gabarito e respostas comentadas',
    descricao: 'O gabarito oficial e a explicação de cada questão.',
    quandoFixo: 'apos-termino',
    porQueFixo: 'não circula com a turma respondendo',
  },
]

export function PainelDeAplicacao({
  publico,
  onPublicoChange,
  liberacoes,
  onLiberacoesChange,
  esperas,
  onEsperasChange,
  travas,
  onTravasChange,
  embaralharQuestoes,
  embaralharAlternativas,
  onEmbaralharChange,
  desabilitado,
}: Props) {
  const [contagem, setContagem] = useState<Record<number, number> | null>(null)
  const [carregandoContagem, setCarregandoContagem] = useState(false)

  const publicoNormalizado = normalizarPublico(publico)
  const liberacoesNormalizadas = normalizarLiberacoes(liberacoes)
  const esperasNormalizadas = normalizarEsperas(esperas)
  const travasNormalizadas = normalizarTravas(travas)
  const porPeriodos = publicoNormalizado.modo === 'periodos'

  // A contagem só é buscada quando alguém abre o modo por período: numa prova
  // aberta a plataforma inteira, o número não influencia decisão nenhuma.
  useEffect(() => {
    if (!porPeriodos || contagem || carregandoContagem) return
    setCarregandoContagem(true)
    fetch('/api/admin/exams/periodos')
      .then((res) => (res.ok ? res.json() : null))
      .then((dados) => {
        if (!dados?.periodos) return
        const mapa: Record<number, number> = {}
        for (const item of dados.periodos) mapa[item.periodo] = item.alunos
        setContagem(mapa)
      })
      .catch(() => {
        // Sem a contagem, o seletor continua funcionando — ele só deixa de
        // mostrar o alcance ao lado de cada período.
      })
      .finally(() => setCarregandoContagem(false))
  }, [porPeriodos, contagem, carregandoContagem])

  const alcance = publicoNormalizado.periodos.reduce((soma, p) => soma + (contagem?.[p] ?? 0), 0)

  function alternarPeriodo(periodo: number) {
    const atuais = new Set(publicoNormalizado.periodos)
    if (atuais.has(periodo)) atuais.delete(periodo)
    else atuais.add(periodo)
    const lista = Array.from(atuais).sort((a, b) => a - b)
    onPublicoChange({ modo: lista.length > 0 ? 'periodos' : 'todos', periodos: lista })
  }

  return (
    <div className="space-y-6">
      {/* ── A quem ──────────────────────────────────────────────── */}
      <section className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/20">
        <div className="flex items-start gap-2.5">
          <GraduationCap className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">Quem faz esta prova</h3>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
              Aplique a prova a um ou mais períodos. Quem não está no período não vê a prova na lista
              nem consegue abri-la pelo endereço — e não consegue entregá-la.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={desabilitado}
            onClick={() => onPublicoChange({ modo: 'todos', periodos: [] })}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
              !porPeriodos
                ? 'border-blue-500 bg-blue-500 text-white'
                : 'border-border bg-background hover:bg-muted',
              desabilitado && 'cursor-not-allowed opacity-50',
            )}
          >
            <Users className="mr-1.5 inline h-3.5 w-3.5" />
            Todos os alunos
          </button>
          <button
            type="button"
            disabled={desabilitado}
            onClick={() =>
              onPublicoChange(
                porPeriodos ? { modo: 'todos', periodos: [] } : { modo: 'periodos', periodos: [] },
              )
            }
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
              porPeriodos
                ? 'border-blue-500 bg-blue-500 text-white'
                : 'border-border bg-background hover:bg-muted',
              desabilitado && 'cursor-not-allowed opacity-50',
            )}
          >
            Por período
          </button>
        </div>

        {porPeriodos && (
          <div className="space-y-2.5">
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {PERIODOS.map((periodo) => {
                const marcado = publicoNormalizado.periodos.includes(periodo)
                const alunos = contagem?.[periodo]
                return (
                  <button
                    key={periodo}
                    type="button"
                    disabled={desabilitado}
                    onClick={() => alternarPeriodo(periodo)}
                    className={cn(
                      'rounded-lg border px-2 py-2 text-center transition-colors',
                      marcado
                        ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300'
                        : 'border-border bg-background hover:bg-muted',
                      desabilitado && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    <span className="block text-sm font-bold">{periodo}º</span>
                    {/* O alcance ao lado do período é o que impede agendar uma
                        prova para um período vazio sem perceber. */}
                    <span className="block text-[10px] leading-tight text-muted-foreground">
                      {alunos === undefined ? '—' : `${alunos} aluno${alunos === 1 ? '' : 's'}`}
                    </span>
                  </button>
                )
              })}
            </div>

            <p className="flex items-center gap-1.5 text-xs">
              {carregandoContagem && <Loader2 className="h-3 w-3 animate-spin" />}
              {publicoNormalizado.periodos.length === 0 ? (
                <span className="font-medium text-amber-700 dark:text-amber-400">
                  Nenhum período marcado — a prova continua aberta a todos os alunos.
                </span>
              ) : (
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  Esta prova será aplicada a <strong>{alcance}</strong>{' '}
                  {alcance === 1 ? 'aluno' : 'alunos'}, ao mesmo tempo, no horário agendado acima.
                </span>
              )}
            </p>
          </div>
        )}
      </section>

      {/* ── Embaralhamento ──────────────────────────────────────── */}
      <section className="space-y-3 rounded-xl border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-900 dark:bg-violet-950/20">
        <div className="flex items-start gap-2.5">
          <Shuffle className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-600 dark:text-violet-400" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">Embaralhamento</h3>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
              A ordem é sorteada por aluno e fica estável: recarregar a página devolve a mesma prova, e
              o relatório numera as questões como aquela pessoa as viu.
            </p>
          </div>
        </div>

        <Opcao
          id="shuffleQuestions"
          marcado={embaralharQuestoes}
          onChange={(v) => onEmbaralharChange('questoes', v)}
          titulo="Embaralhar a ordem das questões"
          descricao="Cada aluno recebe as questões em uma ordem diferente."
        />
        <Opcao
          id="shuffleAlternatives"
          marcado={embaralharAlternativas}
          onChange={(v) => onEmbaralharChange('alternativas', v)}
          titulo="Embaralhar as alternativas"
          descricao="As letras são reatribuídas por posição, então a resposta certa não é a mesma letra para todo mundo — que é justamente o que se copia numa sala."
        />
      </section>

      {/* ── Downloads ───────────────────────────────────────────── */}
      <section className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900 dark:bg-amber-950/20">
        <div className="flex items-start gap-2.5">
          <Download className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">Arquivos que o aluno pode baixar</h3>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
              Cada arquivo tem duas decisões: <strong>quem</strong> pode baixar e <strong>quando</strong>{' '}
              ele libera. Baixar PDF de prova é recurso de assinante — marcar "liberar" abre exceção
              só nesta prova.
            </p>
          </div>
        </div>

        {/*
          Uma linha por arquivo, com as duas decisões lado a lado.

          Antes eram dois blocos de caixinhas — um de plano, outro de tempo — e
          os dois listavam os mesmos arquivos: "PDF da prova (em branco)"
          aparecia duas vezes na tela com significados diferentes, mais uma
          terceira caixinha falando do mesmo arquivo por outro ângulo. Para
          saber o que acontecia com um arquivo era preciso cruzar três lugares
          e adivinhar como eles se somavam.

          Aqui o arquivo é a unidade: tudo que decide o destino dele está na
          mesma linha, e as opções de tempo se excluem em vez de se somar.
        */}
        <div className="space-y-2">
          {ARQUIVOS.map((arquivo) => {
            const quando = arquivo.chave === 'prova' ? esperasNormalizadas.prova
              : arquivo.chave === 'relatorio' ? esperasNormalizadas.relatorio
              : arquivo.quandoFixo!

            return (
              <div
                key={arquivo.chave}
                className="rounded-lg border border-border/50 bg-background/70 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{arquivo.titulo}</p>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                      {arquivo.descricao}
                    </p>
                  </div>

                  <label className="flex flex-shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border/60 px-2 py-1 text-xs">
                    <input
                      type="checkbox"
                      checked={liberacoesNormalizadas[arquivo.chave]}
                      disabled={desabilitado}
                      onChange={(e) =>
                        onLiberacoesChange({ ...liberacoesNormalizadas, [arquivo.chave]: e.target.checked })
                      }
                      className="h-3.5 w-3.5 rounded border-input"
                    />
                    Liberar sem assinatura
                  </label>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-border/40 pt-2.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Libera
                  </span>

                  {arquivo.momentos && onEsperasChange ? (
                    <div className="flex flex-wrap gap-1">
                      {arquivo.momentos.map((momento) => (
                        <button
                          key={momento}
                          type="button"
                          disabled={desabilitado || !onEsperasChange}
                          onClick={() =>
                            onEsperasChange?.({
                              ...esperasNormalizadas,
                              [arquivo.chave]: momento,
                            } as EsperasDeDownload)
                          }
                          className={cn(
                            'rounded-full border px-2.5 py-1 text-[11px] transition-colors disabled:opacity-50',
                            quando === momento
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border/60 bg-background hover:bg-muted',
                          )}
                        >
                          {ROTULO_DO_MOMENTO[momento]}
                        </button>
                      ))}
                    </div>
                  ) : (
                    /*
                      Arquivo sem escolha: o momento é uma consequência do que
                      ele é, não uma preferência. Mostrado assim mesmo — some
                      da tela e o admin fica sem saber quando o aluno recebe.
                    */
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                      <Lock className="h-2.5 w-2.5" />
                      {/*
                        Prova de treino não tem término a esperar — ela acaba
                        quando o dono entrega. Os botões apareceriam cinzas e
                        sem explicação; a frase resolve.
                      */}
                      {!onEsperasChange && arquivo.momentos
                        ? 'Assim que a prova abre — treino não tem término'
                        : `${ROTULO_DO_MOMENTO[quando]}${arquivo.porQueFixo ? ` — ${arquivo.porQueFixo}` : ''}`}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <p className="flex items-start gap-1.5 rounded-lg bg-background/70 p-2.5 text-[11px] leading-snug text-muted-foreground">
          <Lock className="mt-0.5 h-3 w-3 flex-shrink-0" />
          <span>
            "Liberar sem assinatura" vale para o <strong>plano</strong>, nunca para o{' '}
            <strong>tempo</strong>: liberar o gabarito não o antecipa — ele continua saindo só
            depois do término, para não circular enquanto a turma responde.
          </span>
        </p>
      </section>

      {/* ── Anti-cola ───────────────────────────────────────────── */}
      <section className="space-y-3 rounded-xl border border-border/60 bg-muted/25 p-4">
        <div className="flex items-start gap-2.5">
          <ShieldOff className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">Travas na tela de resolução</h3>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
              Aumentam o trabalho de tirar a prova da tela enquanto ela está sendo feita. O grifo,
              a discursiva e a redação continuam funcionando: grifar é selecionar, e o texto que o
              aluno escreve é dele.
            </p>
          </div>
        </div>

        <Opcao
          id="antiColaCopia"
          marcado={travasNormalizadas.copia}
          onChange={(v) => onTravasChange({ ...travasNormalizadas, copia: v })}
          titulo="Não permitir copiar o conteúdo"
          descricao="Bloqueia o Ctrl+C, o arrastar do enunciado para outra janela e o copiar do toque longo. O grifo continua funcionando: selecionar é como o aluno marca o texto."
          disabled={desabilitado}
        />
        <Opcao
          id="antiColaImpressao"
          marcado={travasNormalizadas.impressao}
          onChange={(v) => onTravasChange({ ...travasNormalizadas, impressao: v })}
          titulo="Não permitir imprimir a página"
          descricao="Bloqueia o Ctrl+P e faz o papel sair só com um aviso — inclusive pelo menu do navegador."
          disabled={desabilitado}
        />
        <Opcao
          id="antiColaMenu"
          marcado={travasNormalizadas.menu}
          onChange={(v) => onTravasChange({ ...travasNormalizadas, menu: v })}
          titulo="Desativar o menu do botão direito"
          descricao="É por onde se copia imagem e se abre 'salvar como'."
          disabled={desabilitado}
        />

        <p className="flex items-start gap-1.5 rounded-lg bg-background/70 p-2.5 text-[11px] leading-snug text-muted-foreground">
          <Lock className="mt-0.5 h-3 w-3 flex-shrink-0" />
          <span>
            <strong>Isto não impede foto de celular nem print do sistema.</strong> O computador não
            pergunta nada ao site antes de capturar a tela. Para esse caso valem a marca d'água com
            o nome de quem baixou e o monitoramento por câmera — estas travas são o degrau mais
            barato, e o único que não atrapalha quem está de boa-fé.
          </span>
        </p>
      </section>
    </div>
  )
}

function Opcao({
  id,
  marcado,
  onChange,
  titulo,
  descricao,
  disabled,
}: {
  id: string
  marcado: boolean
  onChange: (valor: boolean) => void
  titulo: string
  descricao: string
  disabled?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        id={id}
        checked={marcado}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 flex-shrink-0 rounded border-input"
      />
      <div className="min-w-0 flex-1">
        <Label htmlFor={id} className="cursor-pointer text-sm font-medium">
          {titulo}
        </Label>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{descricao}</p>
      </div>
    </div>
  )
}
