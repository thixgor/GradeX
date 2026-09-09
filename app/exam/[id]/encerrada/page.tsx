'use client'

/**
 * A porta de uma prova que já acabou.
 *
 * ## O beco que isto fecha
 *
 * Clicar numa prova encerrada em `/provas` mandava a pessoa direto para
 * `/exam/[id]/results` — uma tela longa que abre pela colocação e desce por
 * distribuição, ranking e oito cartões de PDF. Ela responde bem a UMA pergunta
 * ("onde eu fiquei?") e atropela as outras três que a mesma pessoa tem quando
 * abre uma prova encerrada:
 *
 *  - quero refazer isso;
 *  - quero o caderno em PDF;
 *  - qual foi a questão que a turma inteira errou?
 *
 * A terceira nem existia para o aluno: o número era calculado e ficava no
 * painel do admin (ver `lib/provas/analise-da-turma.ts`).
 *
 * Esta tela é o menu que faltava. Ela não repete o que as outras fazem — ela
 * escolhe entre elas, e só a análise da turma mora aqui, porque não morava em
 * lugar nenhum.
 *
 * ## Por que a análise nasce fechada
 *
 * Porque a pergunta mais comum de quem chega é "quero minha nota" ou "quero o
 * PDF", e uma tabela de trinta questões aberta empurra as duas para fora da
 * dobra. Fechada, ela é uma linha; aberta, é o que a pessoa veio buscar quando
 * clica nela. O resumo — a mais errada e a mais acertada — fica no cabeçalho do
 * bloco, visível sem abrir: é a manchete, e ela cabe em duas linhas.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Download,
  Dumbbell,
  FileDown,
  Lock,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { ToastAlert } from '@/components/ui/toast-alert'
import { LogoLoading } from '@/components/logo-loading'
import { ExamBrandFooter, ExamBrandHeader } from '@/components/exam/exam-brand-header'
import { PainelDeDownloads } from '@/components/exam/painel-de-downloads'
import type { Exam, ExamSubmission } from '@/lib/types'
import { provaJaEncerrou, resolverDownloadsDaProva } from '@/lib/provas/downloads-da-prova'
import { enderecoDoTreino } from '@/lib/provas/treino-pos-termino'
import type { AnalisePublicaDaTurma, DestaqueDaTurma } from '@/lib/provas/analise-da-turma'
import { cn } from '@/lib/utils'

export default function ProvaEncerradaPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()

  const [exam, setExam] = useState<Exam | null>(null)
  const [conta, setConta] = useState<{ id?: string; role?: string; accountType?: string }>({})
  const [minhaEntrega, setMinhaEntrega] = useState<ExamSubmission | null>(null)
  const [participei, setParticipei] = useState<boolean | null>(null)
  const [treinoLiberado, setTreinoLiberado] = useState(false)
  /*
   * A análise da turma como o ALUNO a recebe: o percentual de acerto por
   * questão, e nenhuma contagem de pessoas. Quantos entregaram, quantos
   * responderam e quantos acertaram cada questão ficam no painel do professor —
   * ver `analiseParaOAluno`.
   */
  const [analise, setAnalise] = useState<AnalisePublicaDaTurma | null>(null)
  const [minhaNota, setMinhaNota] = useState<number | null>(null)
  const [notaMaxima, setNotaMaxima] = useState<number | null>(null)
  const [mediaDaTurma, setMediaDaTurma] = useState<number | null>(null)
  const [temResultados, setTemResultados] = useState(false)

  const [analiseAberta, setAnaliseAberta] = useState(false)
  const [downloadsAbertos, setDownloadsAbertos] = useState(false)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const avisar = useCallback((mensagem: string) => {
    setToastMessage(mensagem)
    setToastOpen(true)
  }, [])

  useEffect(() => {
    let ativo = true

    async function carregar() {
      try {
        const [resExam, resMe] = await Promise.all([
          fetch(`/api/exams/${id}?ordem=original`),
          fetch('/api/auth/me'),
        ])

        const dadosExam = await resExam.json()
        if (!resExam.ok) throw new Error(dadosExam.error || 'Prova não encontrada.')
        if (!ativo) return

        /*
         * Esta tela só sabe falar de prova encerrada.
         *
         * Ela se anuncia com o selo "Prova encerrada" e oferece o caderno, o
         * gabarito e o treino. Aberta no endereço de uma prova que ainda está
         * correndo — um link antigo, alguém digitando —, ela mentiria sobre a
         * prova e prometeria arquivos que o servidor vai recusar. Quem manda é
         * a janela do servidor, que vem junto com a prova; a porta certa dessa
         * pessoa é a da prova.
         */
        const janela = dadosExam.janela
        const encerrada = janela ? janela.encerrada : provaJaEncerrou(dadosExam.exam)
        if (!encerrada) {
          router.replace(`/exam/${id}`)
          return
        }

        setExam(dadosExam.exam)

        let meuId: string | undefined
        if (resMe.ok) {
          const dadosMe = await resMe.json()
          meuId = dadosMe.user?._id || dadosMe.user?.id
          if (ativo) {
            setConta({
              id: meuId,
              role: dadosMe.user?.role,
              accountType: dadosMe.user?.accountType,
            })
          }
        }

        /*
         * Os resultados podem ser recusados, e isso NÃO é um erro desta tela.
         *
         * Uma prova com a classificação desligada recusa quem não participou —
         * e essa pessoa continua tendo o que fazer aqui: baixar o caderno,
         * praticar. Falhar a tela inteira por causa do bloco da turma seria
         * trancar a porta por causa de uma janela.
         */
        const resResultados = await fetch(`/api/exams/${id}/results`)
        const dados = await resResultados.json().catch(() => null)
        if (!ativo) return

        if (resResultados.ok && dados) {
          setTemResultados(true)
          setAnalise(dados.analiseDaTurma ?? null)
          setParticipei(dados.participei === undefined ? null : !!dados.participei)
          setTreinoLiberado(!!dados.treinoLiberado)
          setMinhaNota(typeof dados.minhaNota === 'number' ? dados.minhaNota : null)
          setNotaMaxima(typeof dados.notaMaxima === 'number' ? dados.notaMaxima : null)
          setMediaDaTurma(dados.estatisticas?.media ?? null)
        }

        if (meuId && dados?.participei !== false) {
          const resEntrega = await fetch(`/api/exams/${id}/submissions/${meuId}`)
          if (resEntrega.ok && ativo) {
            const dadosEntrega = await resEntrega.json()
            setMinhaEntrega(dadosEntrega.submission || null)
          }
        }
      } catch (error: any) {
        if (ativo) setErro(error.message || 'Não foi possível carregar esta prova.')
      } finally {
        if (ativo) setLoading(false)
      }
    }

    carregar()
    return () => {
      ativo = false
    }
  }, [id, router])

  const downloads = useMemo(
    () =>
      resolverDownloadsDaProva(exam, {
        accountType: conta.accountType,
        isAdmin: conta.role === 'admin',
        jaEnviou: !!minhaEntrega,
      }),
    [exam, conta, minhaEntrega],
  )

  /** Há algum arquivo que esta pessoa realmente consegue baixar agora? */
  const algumDownloadLiberado =
    downloads.prova.permitido ||
    downloads.gabarito.permitido ||
    (!!minhaEntrega && (downloads.relatorio.permitido || downloads.compacto.permitido))


  if (loading) return <LogoLoading message="Carregando prova..." size="lg" fullscreen />

  if (erro || !exam) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-lg font-bold">Prova indisponível</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {erro || 'Não encontramos esta prova.'}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/provas')} className="rounded-xl">
          Ver minhas provas
        </Button>
        <ExamBrandFooter className="mt-4" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/40">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.push('/provas')} aria-label="Voltar">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <ExamBrandHeader durante className="min-w-0" />
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto max-w-3xl space-y-5 px-4 py-6 sm:py-8">
        {/* ── Cabeçalho da prova ─────────────────────────────────── */}
        <section className="rounded-3xl border border-border/60 bg-background/60 p-6 backdrop-blur-md">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
            <CheckCircle2 className="h-3 w-3" />
            Prova encerrada
          </span>
          <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            {exam.title}
          </h1>
          {exam.description && (
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{exam.description}</p>
          )}

          {/*
            A nota, quando ela existe — em uma linha, e não numa seção.

            Quem quer o detalhe tem o botão logo abaixo; repetir aqui o anel, a
            colocação e a distribuição seria refazer a tela de resultados dentro
            do menu que existe para levar até ela.
          */}
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {minhaNota !== null && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                <Trophy className="h-3.5 w-3.5" />
                Sua nota: {minhaNota}
                {notaMaxima !== null && <span className="font-normal opacity-70">/ {notaMaxima}</span>}
              </span>
            )}
            {participei === false && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-3 py-1.5 text-muted-foreground">
                Você não fez esta prova
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 py-1.5 text-muted-foreground">
              <Target className="h-3.5 w-3.5" />
              {analise?.totalDeQuestoes ?? exam.numberOfQuestions}{' '}
              {(analise?.totalDeQuestoes ?? exam.numberOfQuestions) === 1 ? 'questão' : 'questões'}
            </span>
          </div>
        </section>

        {/* ── O menu ─────────────────────────────────────────────── */}
        <section className="grid gap-3 sm:grid-cols-2">
          {treinoLiberado && (
            <ItemDoMenu
              icone={Dumbbell}
              titulo="Praticar"
              descricao="Refaça as mesmas questões com correção na hora, quantas vezes quiser. Não altera sua nota nem a classificação."
              destaque
              onClick={() => router.push(enderecoDoTreino(id))}
            />
          )}

          <ItemDoMenu
            icone={BarChart3}
            titulo="Resultados da turma"
            descricao={
              temResultados
                ? 'Sua colocação, a distribuição das notas e a classificação.'
                : 'Esta prova não publica os resultados para quem não participou.'
            }
            desabilitado={!temResultados}
            onClick={() => router.push(`/exam/${id}/results`)}
          />

          {minhaEntrega && (
            <ItemDoMenu
              icone={CheckCircle2}
              titulo="Minhas respostas"
              descricao="A sua prova questão a questão, com o que você marcou e a correção."
              onClick={() => router.push(`/exam/${id}/user/${conta.id}`)}
            />
          )}

          <ItemDoMenu
            icone={FileDown}
            titulo="PDFs e downloads"
            descricao={
              algumDownloadLiberado
                ? 'O caderno em branco, o gabarito comentado e as suas folhas de resposta.'
                : 'Nenhum arquivo liberado agora — abra para ver o motivo de cada um.'
            }
            aberto={downloadsAbertos}
            onClick={() => setDownloadsAbertos((v) => !v)}
          />
        </section>

        {/* ── Downloads ──────────────────────────────────────────── */}
        {downloadsAbertos && (
          <section className="rounded-2xl border border-border/60 bg-background/60 p-5 backdrop-blur-md">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-bold">
              <Download className="h-4 w-4 text-muted-foreground" />
              Documentos da prova
            </h2>
            <p className="mb-4 text-xs text-muted-foreground">
              O que estiver indisponível diz o porquê — pode ser o seu plano, ou uma liberação que o
              professor não abriu.
            </p>
            <PainelDeDownloads
              exam={exam}
              examId={id}
              downloads={downloads}
              minhaEntrega={minhaEntrega}
              participei={participei}
              contaId={conta.id}
              onErro={(mensagem) => avisar(mensagem)}
              semTitulo
            />
          </section>
        )}

        {/* ── Análise da turma ───────────────────────────────────── */}
        <AnaliseDaTurma
          analise={analise}
          media={mediaDaTurma}
          notaMaxima={notaMaxima}
          aberta={analiseAberta}
          onAlternar={() => setAnaliseAberta((v) => !v)}
        />

        <ExamBrandFooter />
      </main>

      <ToastAlert open={toastOpen} onOpenChange={setToastOpen} message={toastMessage} type="info" />
    </div>
  )
}

function ItemDoMenu({
  icone: Icone,
  titulo,
  descricao,
  onClick,
  destaque,
  desabilitado,
  aberto,
}: {
  icone: typeof BarChart3
  titulo: string
  descricao: string
  onClick: () => void
  destaque?: boolean
  desabilitado?: boolean
  /** Quando o item abre um bloco na própria página, em vez de navegar. */
  aberto?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desabilitado}
      className={cn(
        'flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors',
        desabilitado
          ? 'cursor-not-allowed border-border/40 bg-muted/10 opacity-70'
          : destaque
            ? 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/70'
            : 'border-border/60 bg-background/60 hover:border-primary/40 hover:bg-muted/30',
      )}
    >
      <span
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
          destaque
            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
            : 'bg-muted text-muted-foreground',
        )}
      >
        <Icone className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          {titulo}
          {aberto !== undefined && (
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', aberto && 'rotate-180')} />
          )}
        </span>
        <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
          {descricao}
        </span>
      </span>
    </button>
  )
}

/**
 * Como a turma foi, questão a questão.
 *
 * O cabeçalho carrega a manchete — a mais errada e a mais acertada — e fica
 * visível com o bloco fechado: é a resposta que a pessoa veio buscar, e ela
 * cabe em duas linhas. A tabela inteira, que é o que empurraria o resto da tela
 * para fora da dobra, espera o clique.
 */
function AnaliseDaTurma({
  analise,
  media,
  notaMaxima,
  aberta,
  onAlternar,
}: {
  analise: AnalisePublicaDaTurma | null
  media: number | null
  notaMaxima: number | null
  aberta: boolean
  onAlternar: () => void
}) {
  if (!analise || !analise.temEntregas) return null

  /*
   * O destaque vem pronto do servidor.
   *
   * O desempate entre duas questões com o mesmo percentual usa a mais
   * RESPONDIDA — e esse número é uma contagem de pessoas, que não viaja até
   * aqui. Calcular o ranking no navegador exigiria recebê-lo. Ver
   * `analiseParaOAluno`.
   */
  const maisErrada: DestaqueDaTurma | null = analise.maisErrada
  const maisAcertada: DestaqueDaTurma | null = analise.maisAcertada

  const objetivas = analise.questoes.filter(
    (q) => q.type === 'multiple-choice' && q.percentualDeAcerto !== null,
  )

  return (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-background/60 backdrop-blur-md">
      <button
        type="button"
        onClick={onAlternar}
        className="flex w-full items-start gap-3 p-5 text-left transition-colors hover:bg-muted/30"
      >
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <BarChart3 className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-sm font-bold">
            Análise da turma
            <ChevronDown className={cn('h-4 w-4 transition-transform', aberta && 'rotate-180')} />
          </span>
          <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
            {analise.totalDeQuestoes} {analise.totalDeQuestoes === 1 ? 'questão' : 'questões'}
            {analise.discursivas > 0 && ` (${analise.objetivas} objetivas)`}
            {media !== null && ` · média da turma ${media.toFixed(1)}${notaMaxima ? `/${notaMaxima}` : ''}`}
          </span>

          {/* A manchete, visível com o bloco fechado. */}
          {(maisErrada || maisAcertada) && (
            <span className="mt-2 flex flex-wrap gap-1.5">
              {maisErrada && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-1 text-[11px] font-medium text-rose-700 dark:text-rose-400">
                  <TrendingDown className="h-3 w-3" />
                  Mais errada: Q{maisErrada.number} ({Math.round(maisErrada.percentualDeAcerto!)}% de
                  acerto)
                </span>
              )}
              {maisAcertada && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  <TrendingUp className="h-3 w-3" />
                  Mais acertada: Q{maisAcertada.number} (
                  {Math.round(maisAcertada.percentualDeAcerto!)}%)
                </span>
              )}
            </span>
          )}
        </span>
      </button>

      {aberta && (
        <div className="border-t border-border/50 px-5 pb-5 pt-4">
          {objetivas.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              Esta prova não tem questões objetivas com respostas registradas.
            </p>
          ) : (
            <>
              <p className="mb-3 text-[11px] leading-snug text-muted-foreground">
                O percentual é sobre quem <strong>respondeu</strong> a questão — quem deixou em
                branco não entra na conta. A análise é sobre as questões: ela não identifica
                ninguém e não diz quantas pessoas fizeram a prova.
              </p>
              <ol className="space-y-1.5">
                {objetivas.map((q) => {
                  const pct = Math.round(q.percentualDeAcerto!)
                  return (
                    <li
                      key={q.questionId}
                      className="relative flex items-center gap-3 overflow-hidden rounded-lg border border-border/50 px-3 py-2"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'absolute inset-y-0 left-0 -z-10',
                          pct >= 70
                            ? 'bg-emerald-500/10'
                            : pct >= 40
                              ? 'bg-amber-500/10'
                              : 'bg-rose-500/10',
                        )}
                        style={{ width: `${pct}%` }}
                      />
                      <span className="w-9 flex-shrink-0 text-xs font-bold tabular-nums text-muted-foreground">
                        Q{q.number}
                      </span>
                      {/*
                        Só o percentual. "12 de 34 acertaram" respondia a mesma
                        pergunta sobre a questão e, de quebra, contava quantas
                        pessoas fizeram a prova — que é o que não sai daqui.
                      */}
                      <span className="min-w-0 flex-1 text-[11px] text-muted-foreground">
                        {pct}% da turma acertou
                      </span>
                      <span
                        className={cn(
                          'flex-shrink-0 text-sm font-bold tabular-nums',
                          pct >= 70
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : pct >= 40
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-rose-600 dark:text-rose-400',
                        )}
                      >
                        {pct}%
                      </span>
                    </li>
                  )
                })}
              </ol>
            </>
          )}
        </div>
      )}
    </section>
  )
}
