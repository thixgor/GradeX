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
  BarChart3,
  BookOpenCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Dumbbell,
  FileDown,
  FileText,
  Loader2,
  Trophy,
} from 'lucide-react'
import { ExamBrandFooter, ExamBrandHeader } from '@/components/exam/exam-brand-header'
import { CapaDaProva } from '@/components/exam/capa-da-prova'
import { FundoIos } from '@/components/materiais/fundo-ios'
import { AnelDeNota } from '@/components/exam/pecas-da-prova'
import type { Exam, UserAnswer } from '@/lib/types'
import {
  FORMATOS_DA_FOLHA,
  type FormatoDaFolha,
  type LiberacoesDeDownload,
  type VereditoDeDownload,
} from '@/lib/provas/downloads-da-prova'
import { enderecoDoTreino, permiteTreinoAposTermino } from '@/lib/provas/treino-pos-termino'

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

  /**
   * Os dois arquivos da PROVA (não da entrega): o caderno em branco e o caderno
   * com gabarito comentado.
   *
   * Faltavam nesta tela — e é esta a tela de quem abre o link da prova depois
   * de tê-la feito. A pessoa entregava, a prova terminava, ela voltava para
   * baixar o caderno para estudar e encontrava só as folhas de resposta dela
   * própria: os dois arquivos que ela queria existiam, o admin os liberava em
   * "Aplicação da prova", e não havia botão nenhum aqui.
   *
   * Cada um segue a liberação do que CONTÉM: o caderno em branco responde a
   * `downloads.prova`; o comentado revela a resposta, então responde a
   * `downloads.gabarito` — a mesma regra sem exceção do gabarito.
   */
  async function baixarCadernoDaProva(formato: 'branco' | 'comentado') {
    const veredito = formato === 'branco' ? downloads.prova : downloads.gabarito
    if (!veredito.permitido) {
      // A recusa de tempo não se resolve assinando; a de plano, sim.
      if (veredito.esperandoOFim) onErro(veredito.motivo || 'Ainda não liberado.')
      else onPlanoBloqueado()
      return
    }
    try {
      setGerando(formato)
      /*
       * A prova completa vem do servidor, e não da prop.
       *
       * O `exam` desta tela pode ter sido carregado ANTES do término, e nesse
       * caso ele chegou sanitizado — sem `isCorrect` e sem os comentários (ver
       * `lib/provas/sanitizar-prova.ts`). Um "gabarito comentado" montado em
       * cima dele sairia com todas as alternativas erradas e sem uma linha de
       * explicação: um arquivo com cara de correto e conteúdo inventado.
       */
      const res = await fetch(`/api/exams/${examId}`)
      if (!res.ok) throw new Error('Erro ao buscar prova')
      const dados = await res.json()
      const { generateExamPDF, generateExamWithAnswersPDF, downloadPDF } = await import(
        '@/lib/pdf-generator'
      )
      const blob =
        formato === 'branco'
          ? await generateExamPDF(dados.exam, userId)
          : await generateExamWithAnswersPDF(dados.exam)
      downloadPDF(
        blob,
        `${formato === 'branco' ? 'prova' : 'gabarito-comentado'}-${dados.exam.title}.pdf`,
        {
          type: formato === 'branco' ? 'exam_pdf' : 'exam_answers_pdf',
          resourceId: examId,
          resourceTitle: dados.exam.title,
        },
      )
    } catch (error: any) {
      onErro('Erro ao gerar o PDF: ' + error.message)
    } finally {
      setGerando(null)
    }
  }

  const girando = (chave: string) => gerando === chave
  const podePraticar = permiteTreinoAposTermino(exam)

  /*
   * As linhas de ação, à moda dos Ajustes: ícone de cor, título, a dica do que
   * o arquivo contém e o giro enquanto o PDF é montado.
   */
  const linha = ({
    chave,
    icone,
    tom,
    titulo,
    detalhe,
    onClick,
    seta = false,
  }: {
    chave: string
    icone: React.ReactNode
    tom?: 'ambar' | 'cinza' | 'azul'
    titulo: string
    detalhe?: string
    onClick: () => void
    seta?: boolean
  }) => (
    <li key={chave}>
      <button
        type="button"
        className="ios-linha w-full text-left disabled:opacity-55"
        disabled={!seta && !!gerando}
        onClick={onClick}
      >
        <span className="pv-icone-linha" data-tom={tom}>
          {icone}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] leading-snug">{titulo}</span>
          {detalhe && <span className="mt-0.5 block text-[12.5px] leading-snug ios-rotulo-2">{detalhe}</span>}
        </span>
        {girando(chave) ? (
          <Loader2 className="h-[18px] w-[18px] shrink-0 animate-spin ios-rotulo-2" aria-label="Gerando" />
        ) : seta ? (
          <ChevronRight className="h-5 w-5 shrink-0 ios-rotulo-3" />
        ) : (
          <FileDown className="h-[18px] w-[18px] shrink-0 ios-rotulo-3" />
        )}
      </button>
    </li>
  )

  const cartao = (
    <div className="w-full space-y-6">
      {/* A capa também aqui: quem volta pelo link reconhece a prova pela imagem. */}
      {exam.coverImage && (
        <div className="ios-capa ios-assenta overflow-hidden rounded-[24px] shadow-[var(--ios-sombra-alta)]">
          <CapaDaProva src={exam.coverImage} titulo={exam.title} sizes="(max-width: 560px) 100vw, 560px" />
        </div>
      )}

      <div className="flex flex-col items-center text-center">
        <AnelDeNota percentual={100} tamanho={96} espessura={8} cor="var(--ios-tinta)" rotulo="Prova entregue">
          <Check className="h-9 w-9 ios-tinta" strokeWidth={2.5} />
        </AnelDeNota>
        <h1 className="ios-titulo-produto mt-4">Você finalizou esta prova</h1>
        <p className="mt-1 text-[15px] ios-rotulo-2">{exam.title}</p>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed ios-rotulo-2">
          {/*
            "Não é possível refazê-la" continua verdadeiro sobre a ENTREGA, e
            vira meia verdade quando o treino está liberado: a pessoa lê que
            não dá para refazer e logo abaixo encontra um botão "Praticar". A
            frase passa a dizer as duas coisas.
          */}
          {podePraticar
            ? 'Sua entrega está registrada e não pode ser refeita — mas a prova está liberada para treino, e treinar não altera a sua nota.'
            : 'Sua entrega está registrada. Não é possível refazê-la.'}
        </p>
      </div>

      {/*
        Sem o id não há endereço de relatório — e o botão nasceria apontando
        para `/exam/<id>/user/`, que não é a página de ninguém. Ele chega
        junto com o resto da sessão, num piscar; até lá o botão espera.
      */}
      <button
        type="button"
        onClick={() => router.push(`/exam/${examId}/user/${userId}`)}
        disabled={!userId}
        className="ios-botao ios-botao-g exam-botao-chama relative w-full overflow-hidden"
      >
        <BarChart3 className="h-[18px] w-[18px]" />
        Ver meu resumo
      </button>

      {(encerrada || podePraticar) && (
        <ul className="ios-lista" style={{ '--ios-recuo': '60px' } as React.CSSProperties}>
          {/*
            A classificação da turma só existe depois do término — antes disso o
            botão levaria a uma tela que recusa a entrada.
          */}
          {encerrada &&
            linha({
              chave: 'resultados',
              icone: <Trophy className="h-4 w-4" />,
              tom: 'ambar',
              titulo: 'Resultados da turma',
              seta: true,
              onClick: () => router.push(`/exam/${examId}/results`),
            })}
          {/*
            Refazer como treino, quando o admin libera: primeiro como eu fui,
            depois o que eu faço com isso. Ver lib/provas/treino-pos-termino.ts.
          */}
          {podePraticar &&
            linha({
              chave: 'treino',
              icone: <Dumbbell className="h-4 w-4" />,
              titulo: 'Praticar esta prova',
              detalhe: 'Correção na hora — não altera a sua nota nem a classificação',
              seta: true,
              onClick: () => router.push(enderecoDoTreino(examId)),
            })}
        </ul>
      )}

      {/*
        Os dois cadernos da prova e as folhas de respostas.

        Some da tela só o que ainda NÃO EXISTE — o arquivo cuja liberação espera
        o término, numa prova que não terminou. Depois disso as linhas ficam,
        mesmo para quem não pode baixar: sumir sem dizer nada faz o aluno
        concluir que "não dá para baixar o PDF desta prova" quando o que falta é
        o plano dele. O toque conta qual das duas recusas é — a de tempo vira um
        aviso, a de plano abre o convite de assinatura.

        As folhas: a mesma informação em dois formatos, com o enunciado junto
        ou só as letras. Nenhuma diz o que era certo. Ver `FORMATOS_DA_FOLHA`.
      */}
      <section className="space-y-2">
        <h2 className="ios-cabeca-lista">Downloads</h2>
        <ul className="ios-lista" style={{ '--ios-recuo': '60px' } as React.CSSProperties}>
          {!downloads.prova.esperandoOFim &&
            linha({
              chave: 'branco',
              icone: <FileText className="h-4 w-4" />,
              tom: 'cinza',
              titulo: 'Prova em branco',
              detalhe: 'Enunciados e alternativas, sem gabarito',
              onClick: () => baixarCadernoDaProva('branco'),
            })}
          {!downloads.gabarito.esperandoOFim &&
            linha({
              chave: 'comentado',
              icone: <BookOpenCheck className="h-4 w-4" />,
              tom: 'ambar',
              titulo: 'Resposta comentada',
              detalhe: 'A correta e o comentário de cada questão',
              onClick: () => baixarCadernoDaProva('comentado'),
            })}
          {FORMATOS_DA_FOLHA.filter((formato) => downloads[formato.liberacao].permitido).map((formato) =>
            linha({
              chave: formato.chave,
              icone: <ClipboardList className="h-4 w-4" />,
              tom: 'azul',
              titulo:
                formato.chave === 'com-questoes' ? 'Minhas respostas com as questões' : 'Minhas respostas (A, B, C…)',
              detalhe: formato.chave === 'com-questoes' ? 'O que você marcou, questão por questão' : 'Só as letras',
              onClick: () => baixarFolha(formato.chave),
            }),
          )}
          {!downloads.gabarito.esperandoOFim &&
            linha({
              chave: 'gabarito',
              icone: <FileDown className="h-4 w-4" />,
              titulo: 'Gabarito',
              detalhe: 'As letras certas de cada questão',
              onClick: baixarGabarito,
            })}
        </ul>
        <p className="ios-pe-lista">
          {downloads.gabarito.esperandoOFim ? (
            <span className="inline-flex items-start gap-1.5 ios-ambar">
              <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {downloads.gabarito.motivo || 'O gabarito é liberado quando a prova termina.'}
            </span>
          ) : (
            'Veja seu resumo com as respostas e a correção, ou baixe os arquivos da prova.'
          )}
        </p>
      </section>

      <button type="button" onClick={() => router.push('/provas')} className="ios-botao-cinza w-full">
        Voltar para as provas
      </button>
    </div>
  )

  if (variante === 'modal') {
    return (
      <div className="pv-veu" style={{ zIndex: 100 }}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Você finalizou esta prova"
          className="pv-folha sm:max-w-lg"
        >
          <div className="pv-alca" aria-hidden />
          <div className="pv-folha-corpo pt-5 sm:pt-7">{cartao}</div>
        </div>
      </div>
    )
  }

  return (
    <FundoIos capa={exam.coverImage} capaSizes="(max-width: 560px) 100vw, 560px" className="min-h-screen">
      <div className="mx-auto w-full max-w-xl px-4 pb-16 pt-[calc(8px+env(safe-area-inset-top))] sm:px-6">
        {/* A marca: esta é a tela de quem chega pelo link direto da prova. */}
        <nav className="flex items-center justify-between gap-3 py-2">
          <button type="button" className="ios-voltar ios-vidro" onClick={() => router.push('/provas')}>
            <ChevronLeft className="h-5 w-5" />
            Provas
          </button>
          <ExamBrandHeader />
        </nav>
        <div className="mt-6 sm:mt-10">{cartao}</div>
        <ExamBrandFooter className="mt-6" />
      </div>
    </FundoIos>
  )
}
