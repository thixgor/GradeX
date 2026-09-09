'use client'

/**
 * Os PDFs que uma prova produz, e o motivo de cada um que não sai.
 *
 * ## Por que virou componente
 *
 * Esta grade nasceu dentro de `/exam/[id]/results`. Quando a prova encerrada
 * ganhou uma tela de entrada própria (`/exam/[id]/encerrada`), a escolha era
 * copiar oito cartões e a função que os gera para a segunda tela, ou tirá-los
 * das duas. Copiar significaria que uma liberação nova — ou uma correção na
 * regra de quem pode baixar o quê — passaria a precisar de dois lugares para
 * ficar certa, e o dia em que alguém esquece o segundo é o dia em que as duas
 * telas discordam sobre o que o aluno pode baixar.
 *
 * ## A decisão de desenho que ele carrega
 *
 * O cartão indisponível NÃO some: fica na tela, desligado, com a explicação
 * embaixo. Sumir seria mais limpo e pior — o aluno que ouviu do professor
 * "liberei o gabarito comentado" precisa ver o arquivo existir para entender
 * que o que falta é o plano dele, não o arquivo.
 */

import { useState } from 'react'
import {
  BookOpenCheck,
  ClipboardCheck,
  ClipboardList,
  Download,
  FileCheck2,
  FileText,
  ListChecks,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Exam, ExamSubmission } from '@/lib/types'
import {
  FORMATOS_DA_FOLHA,
  type LiberacoesDeDownload,
  type VereditoDeDownload,
} from '@/lib/provas/downloads-da-prova'
import { cn } from '@/lib/utils'

type Arquivo =
  | 'prova'
  | 'gabarito'
  | 'comentado'
  | 'meu'
  | 'folha'
  | 'folhaComQuestoes'
  | 'folhaComparada'

export interface PainelDeDownloadsProps {
  exam: Exam
  examId: string
  /** O veredito por arquivo — plano, liberação da prova e tempo, já resolvidos. */
  downloads: Record<keyof LiberacoesDeDownload, VereditoDeDownload>
  /** A entrega desta pessoa, quando existe: as folhas saem dela. */
  minhaEntrega: ExamSubmission | null
  /**
   * Esta pessoa fez a prova? `null` enquanto não se sabe.
   *
   * Separa "você não fez esta prova" de "ainda estamos carregando a sua
   * entrega" — sem isso, quem fez a prova lia, no primeiro instante, um aviso
   * dizendo que não tinha entrega nenhuma.
   */
  participei: boolean | null
  /** O id de quem está baixando, para a marca d'água do caderno em branco. */
  contaId?: string
  onErro: (mensagem: string) => void
  /** Sem o cabeçalho, para quem já tem um título em volta. */
  semTitulo?: boolean
  className?: string
}

export function PainelDeDownloads({
  exam,
  examId,
  downloads,
  minhaEntrega,
  participei,
  contaId,
  onErro,
  semTitulo,
  className,
}: PainelDeDownloadsProps) {
  const [gerando, setGerando] = useState<Arquivo | null>(null)

  /**
   * A recusa dos arquivos que dependem da entrega desta pessoa.
   *
   * Duas frases, porque são dois fatos diferentes: quem não fez a prova precisa
   * saber que o arquivo não existe para ele (e não que algo falhou), e quem fez
   * merece um "aguarde" enquanto a entrega chega, em vez de um aviso que
   * desmente a prova que ele acabou de fazer.
   */
  const semEntrega: VereditoDeDownload =
    participei === false
      ? {
          permitido: false,
          motivo: 'Este arquivo é montado a partir das suas respostas, e você não fez esta prova.',
          esperandoOFim: false,
        }
      : {
          permitido: false,
          motivo: 'Estamos carregando a sua entrega…',
          esperandoOFim: false,
        }

  async function baixar(arquivo: Arquivo) {
    if (!exam || gerando) return

    /*
     * O veredito segue o CONTEÚDO do arquivo, não o nome dele.
     *
     * "Minhas respostas corrigidas" passava por `downloads.relatorio`, que o
     * admin pode liberar já na entrega — só que o arquivo é
     * `generateUserReportWithGabaritoPDF`: ele traz a alternativa correta de
     * cada questão e uma folha de gabarito no fim. Liberado na entrega, é o
     * gabarito saindo pela porta do relatório, com a turma ainda respondendo.
     * (E antes do término ele nem sairia certo: o servidor não manda
     * `isCorrect`, então o documento sairia com todas as questões marcadas como
     * erradas — ver `lib/provas/sanitizar-prova.ts`.)
     *
     * As duas folhas de respostas mostram só o que a pessoa marcou, mas uma
     * delas imprime o enunciado junto — e é o enunciado que o admin segura
     * quando prende o relatório. Por isso ela segue `relatorio` e a de letras
     * segue a própria. A folha comparada põe o gabarito ao lado, então segue a
     * regra do gabarito: depois do término, e sem exceção.
     */
    const veredito =
      arquivo === 'prova'
        ? downloads.prova
        : arquivo === 'folha'
          ? downloads.compacto
          : arquivo === 'folhaComQuestoes'
            ? downloads.relatorio
            : downloads.gabarito

    if (!veredito.permitido) {
      onErro(veredito.motivo || 'Download não disponível.')
      return
    }
    if (arquivo !== 'prova' && arquivo !== 'gabarito' && arquivo !== 'comentado' && !minhaEntrega) {
      onErro('Não encontramos a sua entrega desta prova.')
      return
    }

    const nomeBase = exam.title.replace(/\s+/g, '-')

    try {
      setGerando(arquivo)

      if (arquivo === 'meu') {
        const gerador = await import('@/lib/user-report-generator')
        await gerador.generateUserReportWithGabaritoPDF({
          exam,
          examId,
          userName: minhaEntrega!.userName,
          signature: minhaEntrega!.signature || '',
          answers: minhaEntrega!.answers || [],
          submittedAt: minhaEntrega!.submittedAt,
          score: typeof minhaEntrega!.score === 'number' ? minhaEntrega!.score : null,
        })
        return
      }

      const {
        generateExamPDF,
        generateGabaritoPDF,
        generateExamWithAnswersPDF,
        generateCompactAnswersPDF,
        generateStudentAnswersPDF,
        downloadPDF,
      } = await import('@/lib/pdf-generator')

      const receita = {
        prova: {
          blob: () => generateExamPDF(exam, contaId),
          nome: `prova-${nomeBase}.pdf`,
          tipo: 'exam_pdf' as const,
        },
        gabarito: {
          blob: () => generateGabaritoPDF(exam),
          nome: `gabarito-${nomeBase}.pdf`,
          tipo: 'gabarito_pdf' as const,
        },
        comentado: {
          blob: () => generateExamWithAnswersPDF(exam),
          nome: `gabarito-comentado-${nomeBase}.pdf`,
          tipo: 'exam_answers_pdf' as const,
        },
        folha: {
          blob: () =>
            generateCompactAnswersPDF(exam, minhaEntrega!.answers || [], minhaEntrega!.userName),
          nome: `folha-de-respostas-${nomeBase}.pdf`,
          tipo: 'exam_answers_pdf' as const,
        },
        folhaComQuestoes: {
          blob: () =>
            generateStudentAnswersPDF(exam, minhaEntrega!.answers || [], minhaEntrega!.userName),
          nome: `folha-de-respostas-com-questoes-${nomeBase}.pdf`,
          tipo: 'student_answers_pdf' as const,
        },
        folhaComparada: {
          blob: () =>
            generateCompactAnswersPDF(exam, minhaEntrega!.answers || [], minhaEntrega!.userName, {
              comparar: true,
            }),
          nome: `folha-de-respostas-comparada-${nomeBase}.pdf`,
          tipo: 'exam_answers_pdf' as const,
        },
      }[arquivo]

      const blob = await receita.blob()
      downloadPDF(blob, receita.nome, {
        type: receita.tipo,
        resourceId: exam._id?.toString() || examId,
        resourceTitle: exam.title,
      })
    } catch (error: any) {
      onErro('Erro ao gerar o PDF: ' + error.message)
    } finally {
      setGerando(null)
    }
  }

  return (
    <div className={className}>
      {!semTitulo && (
        <>
          <h2 className="mb-1 flex items-center gap-2 text-sm font-bold">
            <Download className="h-4 w-4 text-muted-foreground" />
            Documentos da prova
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Os PDFs que esta prova produz. O que estiver indisponível diz o porquê.
          </p>
        </>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <CartaoDeDownload
          icone={FileText}
          titulo="Prova em branco"
          descricao="Enunciados e alternativas, sem gabarito. Para imprimir e refazer no papel."
          veredito={downloads.prova}
          gerando={gerando === 'prova'}
          ocupado={!!gerando}
          onBaixar={() => baixar('prova')}
        />
        <CartaoDeDownload
          icone={ListChecks}
          titulo="Gabarito oficial"
          descricao="A folha de respostas certas, questão a questão."
          veredito={downloads.gabarito}
          gerando={gerando === 'gabarito'}
          ocupado={!!gerando}
          onBaixar={() => baixar('gabarito')}
        />
        <CartaoDeDownload
          icone={BookOpenCheck}
          titulo="Gabarito comentado"
          descricao="Cada questão com a alternativa correta e a explicação dela."
          veredito={downloads.gabarito}
          gerando={gerando === 'comentado'}
          ocupado={!!gerando}
          onBaixar={() => baixar('comentado')}
        />
        <CartaoDeDownload
          icone={FileCheck2}
          titulo="Minhas respostas corrigidas"
          descricao="A sua prova com o que você marcou, o que era certo e a sua nota."
          veredito={minhaEntrega ? downloads.gabarito : semEntrega}
          gerando={gerando === 'meu'}
          ocupado={!!gerando}
          onBaixar={() => baixar('meu')}
        />
        {/*
          As três folhas.

          As duas primeiras vêm de `FORMATOS_DA_FOLHA` e mostram só o que VOCÊ
          marcou — uma com o enunciado junto, outra só com as letras. Nenhuma
          diz qual era a certa; o que muda entre elas é o caderno, e é por isso
          que cada uma responde a uma liberação diferente. A comparada põe o
          gabarito ao lado, então segue a do gabarito.
        */}
        {FORMATOS_DA_FOLHA.map((formato) => (
          <CartaoDeDownload
            key={formato.chave}
            icone={formato.chave === 'com-questoes' ? FileText : ClipboardList}
            titulo={formato.titulo}
            descricao={formato.descricao}
            veredito={minhaEntrega ? downloads[formato.liberacao] : semEntrega}
            gerando={gerando === (formato.chave === 'com-questoes' ? 'folhaComQuestoes' : 'folha')}
            ocupado={!!gerando}
            onBaixar={() => baixar(formato.chave === 'com-questoes' ? 'folhaComQuestoes' : 'folha')}
          />
        ))}
        <CartaoDeDownload
          icone={ClipboardCheck}
          titulo="Folha de respostas comparada"
          descricao="As suas letras ao lado do gabarito, com o acerto marcado e a contagem."
          veredito={minhaEntrega ? downloads.gabarito : semEntrega}
          gerando={gerando === 'folhaComparada'}
          ocupado={!!gerando}
          onBaixar={() => baixar('folhaComparada')}
        />
      </div>

      {exam.pdfUrl && (
        <Button
          variant="outline"
          onClick={() => window.open(exam.pdfUrl, '_blank')}
          className="mt-3 w-full rounded-xl sm:w-auto"
        >
          <FileText className="mr-2 h-4 w-4" />
          PDF original enviado pelo professor
        </Button>
      )}
    </div>
  )
}

/**
 * Um documento e o motivo de ele não estar disponível.
 *
 * O botão indisponível continua na tela, desligado e com a explicação embaixo.
 * Ver o comentário do arquivo.
 */
function CartaoDeDownload({
  icone: Icone,
  titulo,
  descricao,
  veredito,
  gerando,
  ocupado,
  onBaixar,
}: {
  icone: typeof FileText
  titulo: string
  descricao: string
  veredito: VereditoDeDownload
  gerando: boolean
  ocupado: boolean
  onBaixar: () => void
}) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border p-4 transition-colors',
        veredito.permitido
          ? 'border-border/60 bg-muted/20 hover:border-emerald-500/40'
          : 'border-border/40 bg-muted/10',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg',
            veredito.permitido
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-muted text-muted-foreground',
          )}
        >
          <Icone className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">{titulo}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{descricao}</p>
        </div>
      </div>

      <Button
        onClick={onBaixar}
        disabled={ocupado || !veredito.permitido}
        variant={veredito.permitido ? 'default' : 'outline'}
        size="sm"
        className="mt-3 w-full rounded-lg"
        title={veredito.motivo || undefined}
      >
        {gerando ? (
          <>
            <span className="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Gerando…
          </>
        ) : (
          <>
            <Download className="mr-2 h-3.5 w-3.5" />
            {veredito.permitido ? 'Baixar PDF' : 'Indisponível'}
          </>
        )}
      </Button>

      {!veredito.permitido && veredito.motivo && (
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{veredito.motivo}</p>
      )}
    </div>
  )
}
