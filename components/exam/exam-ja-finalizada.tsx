'use client'

/**
 * "Você já finalizou esta prova" — a tela e o aviso, no mesmo lugar.
 *
 * ## O buraco que isto fecha
 *
 * Este cartão existia, mas só como um sobreposto (`fixed inset-0`) DENTRO do
 * corpo principal de `/exam/[id]` — o corpo que só é montado depois que a prova
 * começa. Quem já tinha entregue e abria o endereço da prova de novo não
 * chegava nele: a página parava antes, no retorno antecipado da tela inicial, e
 * desenhava a prova como se ela estivesse por vir. Portões, "Você está dentro",
 * campo de assinatura e um botão verde escrito **Iniciar Prova** — para uma
 * pessoa que não tem mais prova para iniciar.
 *
 * O clique não refazia a prova (a rota de entrega recusa a segunda submissão),
 * mas isso o aluno não sabe: ele vê a prova aberta de novo e a dúvida é
 * imediata — "minha entrega não foi registrada?". Numa prova valendo nota, essa
 * dúvida é o pior efeito possível de uma tela.
 *
 * Agora o mesmo cartão atende os dois momentos: a página inteira, para quem
 * volta, e o sobreposto, para quando a entrega é descoberta com a prova já
 * aberta na tela (a checagem chega depois do primeiro render).
 *
 * ## Por que ele busca a entrega
 *
 * As folhas de respostas precisam do que a pessoa marcou. O cartão antigo usava
 * o estado da sessão — que existe para quem acabou de entregar e está vazio
 * para quem voltou dias depois: o botão gerava uma folha em branco, com cara de
 * arquivo correto. Quando as respostas da sessão não vêm, ele busca a entrega
 * no servidor.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileDown,
  Trophy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExamBrandFooter, ExamBrandHeader } from '@/components/exam/exam-brand-header'
import type { Exam, UserAnswer } from '@/lib/types'
import {
  FORMATOS_DA_FOLHA,
  type FormatoDaFolha,
  type LiberacoesDeDownload,
  type VereditoDeDownload,
} from '@/lib/provas/downloads-da-prova'

export interface ExamJaFinalizadaProps {
  exam: Exam
  examId: string
  /** Quem entregou — para o link do relatório e para buscar as respostas. */
  userId: string
  userName: string
  /** A prova já acabou para a turma (libera o ranking). */
  encerrada: boolean
  downloads: Record<keyof LiberacoesDeDownload, VereditoDeDownload>
  /**
   * As respostas desta sessão, quando a pessoa acabou de entregar. Ausentes,
   * o cartão busca a entrega no servidor antes de montar qualquer folha.
   */
  respostasDaSessao?: UserAnswer[]
  onErro: (mensagem: string) => void
  /** A recusa por plano — abre o convite de assinatura, não um toast. */
  onPlanoBloqueado: () => void
  /** `pagina` ocupa a tela; `modal` cobre a prova aberta atrás. */
  variante?: 'pagina' | 'modal'
}

export function ExamJaFinalizada({
  exam,
  examId,
  userId,
  userName,
  encerrada,
  downloads,
  respostasDaSessao,
  onErro,
  onPlanoBloqueado,
  variante = 'modal',
}: ExamJaFinalizadaProps) {
  const router = useRouter()
  const [gerando, setGerando] = useState<string | null>(null)
  const [respostas, setRespostas] = useState<UserAnswer[] | null>(respostasDaSessao ?? null)

  /*
   * A entrega do servidor, só quando faz falta.
   *
   * Quem acabou de entregar já tem as respostas na mão; quem voltou depois não
   * tem nenhuma, e é para esse caso que a requisição existe. Falha em silêncio:
   * sem as respostas os botões de folha continuam aparecendo e o erro é contado
   * no clique, com uma frase, em vez de sumirem sem explicação.
   */
  useEffect(() => {
    if (respostas || !userId) return
    let ativo = true
    fetch(`/api/exams/${examId}/submissions/${userId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((dados) => {
        if (ativo && dados?.submission) setRespostas(dados.submission.answers || [])
      })
      .catch(() => {})
    return () => {
      ativo = false
    }
  }, [examId, userId, respostas])

  async function baixarFolha(formato: FormatoDaFolha) {
    const veredito = downloads[FORMATOS_DA_FOLHA.find((f) => f.chave === formato)!.liberacao]
    if (!veredito.permitido) {
      onErro(veredito.motivo || 'Download não disponível.')
      return
    }
    if (!respostas) {
      onErro('Ainda estamos carregando a sua entrega. Tente de novo em instantes.')
      return
    }
    try {
      setGerando(formato)
      const { generateStudentAnswersPDF, generateCompactAnswersPDF, downloadPDF } = await import(
        '@/lib/pdf-generator'
      )
      const blob =
        formato === 'com-questoes'
          ? await generateStudentAnswersPDF(exam, respostas, userName || 'Aluno')
          : await generateCompactAnswersPDF(exam, respostas, userName || 'Aluno')
      const sufixo = FORMATOS_DA_FOLHA.find((f) => f.chave === formato)!.sufixo
      downloadPDF(blob, `${sufixo}-${exam.title}.pdf`, {
        type: formato === 'com-questoes' ? 'student_answers_pdf' : 'exam_answers_pdf',
        resourceId: examId,
        resourceTitle: exam.title,
      })
    } catch (error: any) {
      onErro('Erro ao gerar a folha: ' + error.message)
    } finally {
      setGerando(null)
    }
  }

  async function baixarGabarito() {
    if (!downloads.gabarito.permitido) {
      // A recusa de tempo não se resolve assinando; a de plano, sim.
      if (downloads.gabarito.esperandoOFim) onErro(downloads.gabarito.motivo || 'Ainda não liberado.')
      else onPlanoBloqueado()
      return
    }
    try {
      setGerando('gabarito')
      const res = await fetch(`/api/exams/${examId}`)
      if (!res.ok) throw new Error('Erro ao buscar prova')
      const dados = await res.json()
      const { generateGabaritoPDF, downloadPDF } = await import('@/lib/pdf-generator')
      const blob = await generateGabaritoPDF(dados.exam)
      downloadPDF(blob, `Gabarito-${dados.exam.title}.pdf`, {
        type: 'gabarito_pdf',
        resourceId: examId,
        resourceTitle: dados.exam.title,
      })
    } catch (error: any) {
      onErro('Erro ao gerar gabarito: ' + error.message)
    } finally {
      setGerando(null)
    }
  }

  const girando = (chave: string) => gerando === chave

  const cartao = (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="space-y-4 text-center">
        <div className="exam-selo-estoura mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <CardTitle className="text-2xl">Você finalizou essa prova</CardTitle>
          <CardDescription className="mt-2">
            Sua entrega está registrada. Não é possível refazê-la.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted p-4">
          <p className="text-center text-sm text-muted-foreground">
            {downloads.gabarito.esperandoOFim
              ? 'Seu resumo já está disponível. O gabarito é liberado quando a prova termina.'
              : 'Veja seu resumo com as respostas e a correção, ou baixe o gabarito da prova.'}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {/*
            Sem o id não há endereço de relatório — e o botão nasceria apontando
            para `/exam/<id>/user/`, que não é a página de ninguém. Ele chega
            junto com o resto da sessão, num piscar; até lá o botão espera.
          */}
          <Button
            onClick={() => router.push(`/exam/${examId}/user/${userId}`)}
            disabled={!userId}
            className="exam-botao-chama relative w-full overflow-hidden bg-gradient-to-r from-[#468152] to-[#3a6d44] font-semibold text-white hover:from-[#3a6d44] hover:to-[#2f5a38] disabled:bg-none"
            size="lg"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Quero ver meu resumo
          </Button>

          {/*
            A classificação da turma só existe depois do término — antes disso o
            botão levaria a uma tela que recusa a entrada.
          */}
          {encerrada && (
            <Button
              onClick={() => router.push(`/exam/${examId}/results`)}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Trophy className="mr-2 h-4 w-4" />
              Ver resultados da turma
            </Button>
          )}

          {/*
            As duas folhas de respostas — a mesma informação em dois formatos:
            com o enunciado junto, ou só as letras. Nenhuma diz o que era certo.
            A que imprime o enunciado leva o caderno da prova junto, e por isso
            segue a espera do relatório; a de letras sai na entrega. Ver
            `FORMATOS_DA_FOLHA`.
          */}
          {FORMATOS_DA_FOLHA.filter((formato) => downloads[formato.liberacao].permitido).map(
            (formato) => (
              <Button
                key={formato.chave}
                onClick={() => baixarFolha(formato.chave)}
                disabled={!!gerando}
                variant="outline"
                className="w-full"
                size="lg"
                title={formato.descricao}
              >
                {girando(formato.chave) ? (
                  <>
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Gerando…
                  </>
                ) : (
                  <>
                    <ClipboardList className="mr-2 h-4 w-4" />
                    {formato.chave === 'com-questoes'
                      ? 'Minhas respostas com as questões'
                      : 'Minhas respostas (A, B, C…)'}
                  </>
                )}
              </Button>
            ),
          )}

          {!downloads.gabarito.esperandoOFim ? (
            <Button onClick={baixarGabarito} disabled={!!gerando} variant="outline" className="w-full" size="lg">
              {girando('gabarito') ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Gerando…
                </>
              ) : (
                <>
                  <FileDown className="mr-2 h-4 w-4" />
                  Baixar Gabarito (PDF)
                </>
              )}
            </Button>
          ) : (
            <div className="w-full rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-950">
              <p className="text-center text-sm text-orange-800 dark:text-orange-200">
                <Clock className="mr-2 inline h-4 w-4" />
                {downloads.gabarito.motivo}
              </p>
            </div>
          )}

          <Button onClick={() => router.push('/provas')} variant="ghost" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para as provas
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  if (variante === 'modal') {
    return (
      <div className="animate-in fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm duration-200">
        {cartao}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/40 p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* A marca: esta é a tela de quem chega pelo link direto da prova. */}
        <ExamBrandHeader className="mb-3 px-1" />
        <p className="mb-3 truncate px-1 text-sm font-medium text-muted-foreground">{exam.title}</p>
        {cartao}
        <ExamBrandFooter className="mt-4" />
      </div>
    </div>
  )
}
