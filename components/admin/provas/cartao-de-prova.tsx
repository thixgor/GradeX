'use client'

import { memo } from 'react'
import type { ComponentProps } from 'react'
import {
  BarChart3,
  Copy,
  Download,
  Edit,
  Eye,
  EyeOff,
  FileCheck,
  FileDown,
  Medal,
  Play,
  RotateCcw,
  StopCircle,
  Trash2,
  Users,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { algumaLiberacaoLigada, normalizarLiberacoes } from '@/lib/provas/downloads-da-prova'
import {
  ROTULO_DA_FASE,
  eProvaSemJanela,
  resolverJanelaDaProva,
  type FaseDaProva,
} from '@/lib/provas/janela-da-prova'
import { normalizarPublico, rotuloDoPublico } from '@/lib/provas/publico-da-prova'
import type { Exam } from '@/lib/types'
import { cn, formatDate } from '@/lib/utils'

/**
 * Um cartão da lista de `/admin/exams`.
 *
 * ## Por que isto virou um componente à parte
 *
 * A lista inteira morava num único arquivo, e cada ação do painel terminava em
 * `loadExams()` — uma releitura de `GET /api/exams`, que devolve os documentos
 * COMPLETOS (o array `questions` de cada prova junto). Ocultar uma prova, um
 * clique que muda um booleano, rebaixava e remontava a lista toda: a tela
 * piscava, e a sensação era a de ter recarregado a página para ver uma chave
 * virar.
 *
 * Com o cartão isolado e memoizado (`memo`), a página passa a corrigir só a
 * prova que mudou dentro do próprio estado. React reconcilia um cartão; os
 * outros nem chegam a renderizar de novo, e a busca, a rolagem e o que estava
 * aberto na tela continuam onde estavam.
 *
 * Para a memoização funcionar, as props precisam ser estáveis: `acoes` é um
 * objeto memoizado na página e `acaoEmCurso` é a ação DESTE cartão (não o mapa
 * inteiro), senão qualquer botão pressionado em qualquer cartão invalidaria
 * todos.
 */

/** As ações que rodam sem sair da lista — e que por isso precisam de spinner. */
export type AcaoNaProva =
  | 'visibilidade'
  | 'classificacao'
  | 'duplicar'
  | 'forcar-inicio'
  | 'forcar-termino'
  | 'zerar'
  | 'deletar'

export interface AcoesDaProva {
  editar: (prova: Exam) => void
  duplicar: (prova: Exam) => void
  alternarVisibilidade: (prova: Exam) => void
  alternarClassificacao: (prova: Exam) => void
  forcarInicio: (prova: Exam) => void
  forcarTermino: (prova: Exam) => void
  zerar: (prova: Exam) => void
  corrigirDiscursivas: (prova: Exam) => void
  verRelatorio: (prova: Exam) => void
  gerarPDF: (prova: Exam) => void
  deletar: (prova: Exam) => void
  verRankingPublico: (prova: Exam) => void
}

interface CartaoDeProvaProps {
  prova: Exam
  /**
   * O instante em que a lista se considera. Vem da página como um número que
   * avança sozinho de tempo em tempo — é ele que faz "Forçar Início" virar
   * "Forçar Término" quando a prova começa, sem ninguém recarregar nada.
   */
  agora: number
  acaoEmCurso: AcaoNaProva | null
  acoes: AcoesDaProva
}

/** Cores do selo de fase. Só o painel usa — o aluno tem os selos de `/provas`. */
const CORES_DA_FASE: Record<FaseDaProva, string> = {
  livre: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  'antes-do-portao': 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
  'sala-de-espera': 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  'em-andamento': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  'portao-fechado': 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  encerrada: 'bg-muted text-muted-foreground',
}

interface BotaoDeAcaoProps extends ComponentProps<typeof Button> {
  /** Qual ação este botão dispara — é assim que ele sabe se o spinner é dele. */
  acao: AcaoNaProva
  acaoEmCurso: AcaoNaProva | null
  icone: LucideIcon
  rotulo: string
  rotuloEmCurso?: string
}

/**
 * Botão que mostra no próprio rótulo que está trabalhando.
 *
 * Enquanto uma ação roda, os OUTROS botões do mesmo cartão ficam desativados:
 * "Zerar Prova" e "Deletar" disparados no mesmo segundo, na mesma prova, são
 * duas requisições que se atropelam — e o segundo clique costuma ser o dedo
 * impaciente de quem achou que o primeiro não pegou.
 */
function BotaoDeAcao({
  acao,
  acaoEmCurso,
  icone: Icone,
  rotulo,
  rotuloEmCurso,
  disabled,
  ...resto
}: BotaoDeAcaoProps) {
  const rodando = acaoEmCurso === acao

  return (
    <Button {...resto} disabled={disabled || acaoEmCurso !== null} aria-busy={rodando}>
      {rodando ? (
        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <Icone className="h-4 w-4 mr-2" />
      )}
      {rodando ? rotuloEmCurso ?? rotulo : rotulo}
    </Button>
  )
}

function CartaoDeProvaBase({ prova, agora, acaoEmCurso, acoes }: CartaoDeProvaProps) {
  const janela = resolverJanelaDaProva(prova, new Date(agora))
  const semJanela = eProvaSemJanela(prova)
  const publico = normalizarPublico((prova as any).audience)
  const liberaDownloads = algumaLiberacaoLigada(normalizarLiberacoes((prova as any).freeDownloads))
  const temDiscursivas = prova.questions?.some(q => q.type === 'discursive')

  // Uma ação em curso deixa o cartão translúcido: é o aviso de que aquele
  // pedaço da tela está em movimento, no lugar do recarregamento inteiro que
  // antes servia de resposta a qualquer clique.
  return (
    <Card className={cn('transition-opacity', acaoEmCurso && 'opacity-70')}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{prova.title}</CardTitle>

              {/*
                A fase é calculada do relógio, não guardada: ela muda sozinha
                quando o portão abre e quando a prova começa. Antes a lista não
                tinha nenhum indicador de estado — só dava para deduzir pelas
                datas — e era preciso recarregar a página para ver os botões
                acompanharem o horário.
              */}
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium',
                  CORES_DA_FASE[janela.fase],
                )}
                title={janela.motivo ?? undefined}
              >
                {janela.fase === 'em-andamento' && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
                {ROTULO_DA_FASE[janela.fase]}
              </span>

              {prova.isHidden && (
                <span className="text-xs bg-muted px-2 py-1 rounded">Oculto</span>
              )}

              {/*
                Os dois selos que mudam quem recebe a prova. Sem eles, uma prova
                aplicada a um período e uma prova com os PDFs liberados para
                contas gratuitas são visualmente idênticas às demais — e a
                diferença só aparece quando alguém reclama.
              */}
              {publico.modo === 'periodos' && (
                <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-400">
                  <Users className="h-3 w-3" />
                  {rotuloDoPublico(publico)}
                </span>
              )}

              {prova.showRanking === false && (
                <span
                  className="inline-flex items-center gap-1 rounded bg-slate-500/10 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300"
                  title="Os alunos não veem a lista de notas desta prova"
                >
                  <Medal className="h-3 w-3" />
                  Sem classificação
                </span>
              )}

              {liberaDownloads && (
                <span
                  className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-400"
                  title="Esta prova libera PDFs para contas sem assinatura"
                >
                  <Download className="h-3 w-3" />
                  Downloads liberados
                </span>
              )}
            </div>
            {prova.description && <CardDescription>{prova.description}</CardDescription>}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Questões:</span> {prova.numberOfQuestions}
            </p>
            <p>
              <span className="text-muted-foreground">Pontuação:</span>{' '}
              {prova.scoringMethod === 'tri' ? 'TRI (1000 pts)' : `${prova.totalPoints} pts`}
            </p>
          </div>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Início:</span> {formatDate(prova.startTime)}
            </p>
            <p>
              <span className="text-muted-foreground">Término:</span> {formatDate(prova.endTime)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => acoes.editar(prova)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>

          <BotaoDeAcao
            acao="duplicar"
            acaoEmCurso={acaoEmCurso}
            icone={Copy}
            rotulo="Duplicar"
            rotuloEmCurso="Duplicando…"
            variant="outline"
            size="sm"
            onClick={() => acoes.duplicar(prova)}
            title="Cria uma cópia oculta com as mesmas questões e configurações"
          />

          <BotaoDeAcao
            acao="visibilidade"
            acaoEmCurso={acaoEmCurso}
            icone={prova.isHidden ? Eye : EyeOff}
            rotulo={prova.isHidden ? 'Tornar Visível' : 'Ocultar'}
            variant="outline"
            size="sm"
            onClick={() => acoes.alternarVisibilidade(prova)}
          />

          {/*
            A classificação é uma decisão por prova, e ela vive aqui pelo mesmo
            motivo que "Ocultar": é uma chave que o admin precisa virar depois
            que a prova já existe — normalmente depois de ver a lista de notas —
            e não no formulário de criação, onde ainda não há nota nenhuma para
            julgar.
          */}
          <BotaoDeAcao
            acao="classificacao"
            acaoEmCurso={acaoEmCurso}
            icone={Medal}
            rotulo={prova.showRanking === false ? 'Classificação oculta' : 'Classificação visível'}
            variant="outline"
            size="sm"
            onClick={() => acoes.alternarClassificacao(prova)}
            title={
              prova.showRanking === false
                ? 'Os alunos não veem a lista de notas desta prova'
                : 'Os alunos veem a lista de notas desta prova'
            }
            className={
              prova.showRanking === false
                ? 'border-slate-400 text-slate-600 dark:text-slate-300'
                : 'border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950'
            }
          />

          {/*
            Forçar horário só existe para prova com janela. Numa prova de treino
            ou pessoal as datas são um marcador de "sempre disponível" (2099), e
            o botão "Forçar Início" aparecia para ela sem ter o que iniciar —
            clicar só sujava as datas de uma prova que nunca as consulta.
          */}
          {!semJanela && janela.comecaEm && agora < janela.comecaEm.getTime() && (
            <BotaoDeAcao
              acao="forcar-inicio"
              acaoEmCurso={acaoEmCurso}
              icone={Play}
              rotulo="Forçar Início"
              rotuloEmCurso="Iniciando…"
              variant="default"
              size="sm"
              onClick={() => acoes.forcarInicio(prova)}
            />
          )}

          {!semJanela &&
            janela.comecaEm &&
            janela.terminaEm &&
            agora >= janela.comecaEm.getTime() &&
            agora < janela.terminaEm.getTime() && (
              <BotaoDeAcao
                acao="forcar-termino"
                acaoEmCurso={acaoEmCurso}
                icone={StopCircle}
                rotulo="Forçar Término"
                rotuloEmCurso="Encerrando…"
                variant="destructive"
                size="sm"
                onClick={() => acoes.forcarTermino(prova)}
              />
            )}

          {/*
            Sem a condição `agora >= startTime` que existia aqui: uma prova pode
            ter rascunho e tentativa ANTES do início (o admin adiantou o começo,
            depois corrigiu a data), e era justamente nesse estado que o botão
            de limpar sumia.
          */}
          <BotaoDeAcao
            acao="zerar"
            acaoEmCurso={acaoEmCurso}
            icone={RotateCcw}
            rotulo="Zerar Prova"
            rotuloEmCurso="Zerando…"
            variant="outline"
            size="sm"
            onClick={() => acoes.zerar(prova)}
            className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
            title="Apaga entregas, rascunhos, tentativas e anotações desta prova"
          />

          {temDiscursivas && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => acoes.corrigirDiscursivas(prova)}
              className="border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950"
            >
              <FileCheck className="h-4 w-4 mr-2" />
              Corrigir Discursivas
            </Button>
          )}

          {/*
            O relatório vem ANTES do PDF e não espera o término. "Ver
            Resultados" só aparecia depois que a prova acabava — durante a
            aplicação, que é quando o admin mais precisa saber se a turma está
            conseguindo entrar, não havia tela.
          */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => acoes.verRelatorio(prova)}
            className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Relatório e Resultados
          </Button>

          {/*
            Abre o seletor de formato em vez de baixar direto.

            O botão baixava sempre o caderno EM BRANCO, e era o único caminho
            para PDF que o painel tinha: quem quisesse a prova com resposta
            comentada — que o gerador sabe fazer, e que /provas oferece ao
            aluno — não tinha onde pedir. Ver `components/admin/provas/dialogo-de-pdf.tsx`.
          */}
          <Button
            variant="outline"
            size="sm"
            disabled={acaoEmCurso !== null}
            onClick={() => acoes.gerarPDF(prova)}
            className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Gerar PDF…
          </Button>

          <BotaoDeAcao
            acao="deletar"
            acaoEmCurso={acaoEmCurso}
            icone={Trash2}
            rotulo="Deletar"
            rotuloEmCurso="Deletando…"
            variant="destructive"
            size="sm"
            onClick={() => acoes.deletar(prova)}
          />

          {janela.encerrada && (
            <Button variant="secondary" size="sm" onClick={() => acoes.verRankingPublico(prova)}>
              Ranking público
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export const CartaoDeProva = memo(CartaoDeProvaBase)
