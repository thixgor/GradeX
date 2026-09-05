'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ThemeToggle } from '@/components/theme-toggle'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ToastAlert } from '@/components/ui/toast-alert'
import { useRelogioDaLista } from '@/hooks/use-relogio-da-lista'
import { CartaoDeProva, type AcaoNaProva, type AcoesDaProva } from '@/components/admin/provas/cartao-de-prova'
import { Exam } from '@/lib/types'
import { cn } from '@/lib/utils'
// PDF generator loaded dynamically to reduce initial bundle size
import { ArrowLeft, Trash2, Plus, AlertTriangle, Settings, Check, X, Lock, ShieldAlert, Database, Video, Search, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/** O que uma confirmação precisa dizer antes de algo irreversível acontecer. */
interface PedidoDeConfirmacao {
  titulo: string
  descricao: ReactNode
  rotuloDeConfirmar: string
  aoConfirmar: () => void
}

/** Abaixo disto, voltar para a aba não vale uma nova leitura da lista. */
const IDADE_ACEITAVEL_DA_LISTA = 30_000

const idDaProva = (prova: Exam) => prova._id!.toString()

export default function AdminExamsPage() {
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [atualizando, setAtualizando] = useState(false)
  const [atualizadoEm, setAtualizadoEm] = useState<number | null>(null)
  /**
   * Qual ação está rodando em cada prova, por id.
   *
   * É o que substitui o "a tela inteira ficou parada e depois piscou": o cartão
   * que está em movimento se anuncia sozinho, e os outros continuam clicáveis.
   */
  const [acoesEmCurso, setAcoesEmCurso] = useState<Record<string, AcaoNaProva>>({})
  const [confirmacao, setConfirmacao] = useState<PedidoDeConfirmacao | null>(null)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'error' | 'success' | 'info'>('error')
  const [showSettings, setShowSettings] = useState(false)
  const [geminiApiKey, setGeminiApiKey] = useState('')
  const [savedGeminiApiKey, setSavedGeminiApiKey] = useState('')
  const [testingConnection, setTestingConnection] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [showVaultDialog, setShowVaultDialog] = useState(false)
  const [vaultPassword, setVaultPassword] = useState('')
  const [resettingDatabase, setResettingDatabase] = useState(false)
  // Segunda etapa do cofre: o servidor devolve uma frase de uso único e manda um
  // código por e-mail. Enquanto `vaultChallenge` for nulo, a tela está na etapa 1.
  const [vaultChallenge, setVaultChallenge] = useState<{ desafioId: string; frase: string } | null>(null)
  const [vaultEmailCode, setVaultEmailCode] = useState('')
  const [vaultPhrase, setVaultPhrase] = useState('')
  const [search, setSearch] = useState('')

  /**
   * O relógio da lista.
   *
   * As decisões de tempo desta tela — qual selo de fase mostrar, se cabe
   * "Forçar Início" ou "Forçar Término" — eram tomadas com `new Date()` no meio
   * do JSX, o que só acontece quando algo faz a página renderizar de novo. Uma
   * prova que começava às 14h continuava oferecendo "Forçar Início" às 14h30
   * até alguém recarregar. É o mesmo relógio compartilhado dos cartões de
   * `/provas` (ver hooks/use-relogio-da-lista.ts).
   *
   * O `pisoDoRelogio` existe porque o passo é de 30 segundos e forçar o início
   * de uma prova não pode esperar o próximo: no clique, "Forçar Início" tem de
   * virar "Forçar Término". Ele guarda o instante que a ação acabou de
   * estabelecer — o do SERVIDOR, não o desta máquina — e o relógio o ultrapassa
   * sozinho no passo seguinte.
   */
  const tiqueDoRelogio = useRelogioDaLista()
  const [pisoDoRelogio, setPisoDoRelogio] = useState(0)
  const agora = Math.max(tiqueDoRelogio, pisoDoRelogio)

  const buscandoRef = useRef(false)
  const atualizadoEmRef = useRef<number | null>(null)
  const temAcaoEmCursoRef = useRef(false)

  useEffect(() => { atualizadoEmRef.current = atualizadoEm }, [atualizadoEm])
  useEffect(() => { temAcaoEmCursoRef.current = Object.keys(acoesEmCurso).length > 0 }, [acoesEmCurso])

  const showToastMessage = useCallback((message: string, type: 'error' | 'success' | 'info' = 'error') => {
    setToastMessage(message)
    setToastType(type)
    setToastOpen(true)
  }, [])

  /**
   * Relê a lista inteira.
   *
   * `silencioso` é o modo que não apaga a tela: o botão "Atualizar" e a volta
   * para a aba usam ele, e a lista só troca quando a resposta chega. O modo
   * ruidoso (a primeira carga) é o único que tem direito ao esqueleto.
   *
   * Nenhuma ação da lista chama isto: `GET /api/exams` devolve os documentos
   * completos, com todas as questões de todas as provas, e pedir isso de volta
   * para confirmar um booleano que o servidor já aceitou é o que fazia a tela
   * inteira se remontar a cada clique.
   */
  const carregarProvas = useCallback(async (opcoes: { silencioso?: boolean } = {}) => {
    if (buscandoRef.current) return
    buscandoRef.current = true
    if (opcoes.silencioso) setAtualizando(true)

    try {
      const res = await fetch('/api/exams', { cache: 'no-store' })
      if (!res.ok) throw new Error('Não foi possível carregar as provas')
      const data = await res.json()
      setExams(data.exams || [])
      setAtualizadoEm(Date.now())
    } catch (error: any) {
      console.error('Erro ao carregar provas:', error)
      if (opcoes.silencioso) showToastMessage(error.message || 'Erro ao atualizar a lista')
    } finally {
      buscandoRef.current = false
      setLoading(false)
      setAtualizando(false)
    }
  }, [showToastMessage])

  useEffect(() => {
    carregarProvas()
    loadSettings()
  }, [carregarProvas])

  /**
   * Voltar para a aba vale uma conferência.
   *
   * Painel de prova costuma ficar aberto do lado enquanto a prova acontece; o
   * hábito de recarregar a página vinha em parte de não haver outro jeito de
   * saber se a lista ainda valia. Não recarrega no meio de uma ação em curso —
   * a resposta do servidor chegaria por cima da mudança que ainda está a
   * caminho.
   */
  useEffect(() => {
    function aoVoltarParaAba() {
      if (document.visibilityState !== 'visible') return
      if (temAcaoEmCursoRef.current) return
      const idade = Date.now() - (atualizadoEmRef.current ?? 0)
      if (idade < IDADE_ACEITAVEL_DA_LISTA) return
      carregarProvas({ silencioso: true })
    }

    document.addEventListener('visibilitychange', aoVoltarParaAba)
    return () => document.removeEventListener('visibilitychange', aoVoltarParaAba)
  }, [carregarProvas])

  /** Corrige UMA prova no estado. É o coração da atualização sem recarga. */
  const aplicarNaProva = useCallback((examId: string, mudancas: Partial<Exam>) => {
    setExams(atual => atual.map(prova => (idDaProva(prova) === examId ? { ...prova, ...mudancas } : prova)))
  }, [])

  const removerDaLista = useCallback((examId: string) => {
    setExams(atual => atual.filter(prova => idDaProva(prova) !== examId))
  }, [])

  const marcarAcao = useCallback((examId: string, acao: AcaoNaProva | null) => {
    setAcoesEmCurso(atual => {
      if (!acao) {
        if (!(examId in atual)) return atual
        const proximo = { ...atual }
        delete proximo[examId]
        return proximo
      }
      return { ...atual, [examId]: acao }
    })
  }, [])

  const pedirConfirmacao = useCallback((pedido: PedidoDeConfirmacao) => setConfirmacao(pedido), [])

  async function loadSettings() {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        const apiKey = data.settings?.geminiApiKey || ''
        setSavedGeminiApiKey(apiKey)
        setGeminiApiKey(apiKey)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }

  async function saveSettings() {
    setSavingSettings(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiApiKey })
      })

      if (res.ok) {
        setSavedGeminiApiKey(geminiApiKey)
        showToastMessage('Configurações salvas com sucesso!', 'success')
      } else {
        throw new Error('Erro ao salvar')
      }
    } catch (error: any) {
      showToastMessage(error.message)
    } finally {
      setSavingSettings(false)
    }
  }

  async function testGeminiConnection() {
    if (!geminiApiKey.trim()) {
      showToastMessage('Por favor, insira uma API Key', 'error')
      return
    }

    setTestingConnection(true)
    try {
      const res = await fetch('/api/settings/test-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: geminiApiKey })
      })

      const data = await res.json()

      if (data.success) {
        showToastMessage('Conexão com Gemini estabelecida com sucesso!', 'success')
      } else {
        showToastMessage(data.error || 'Falha ao conectar com Gemini', 'error')
      }
    } catch (error: any) {
      showToastMessage('Erro ao testar conexão: ' + error.message)
    } finally {
      setTestingConnection(false)
    }
  }

  function fecharCofre() {
    setShowVaultDialog(false)
    setVaultPassword('')
    setVaultChallenge(null)
    setVaultEmailCode('')
    setVaultPhrase('')
  }

  /**
   * Etapa 1: pedir o desafio.
   *
   * O servidor confere o código do cofre e a lista de administradores
   * autorizados, devolve uma frase de uso único e manda um código de 6 dígitos
   * para o e-mail do admin. Nada é apagado aqui.
   */
  async function solicitarDesafioDoCofre() {
    if (!vaultPassword) {
      showToastMessage('Por favor, insira o código do cofre', 'error')
      return
    }

    setResettingDatabase(true)
    try {
      const res = await fetch('/api/settings/reset-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etapa: 'desafio', codigoDoCofre: vaultPassword })
      })

      if (res.status === 404) {
        showToastMessage('O reset do banco está desligado neste ambiente (ALLOW_DB_RESET).', 'error')
        return
      }

      const data = await res.json()

      if (res.ok && data.desafioId) {
        setVaultChallenge({ desafioId: data.desafioId, frase: data.frase })
        showToastMessage(data.mensagem || 'Código enviado por e-mail.', 'success')
      } else {
        showToastMessage(data.error || 'Falha ao iniciar a operação', 'error')
      }
    } catch (error: any) {
      showToastMessage('Erro ao iniciar: ' + error.message)
    } finally {
      setResettingDatabase(false)
    }
  }

  /** Etapa 2: frase digitada + código do e-mail. Só aqui as coleções se movem. */
  async function executarResetDoCofre() {
    if (!vaultChallenge) return

    setResettingDatabase(true)
    try {
      const res = await fetch('/api/settings/reset-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          etapa: 'executar',
          codigoDoCofre: vaultPassword,
          desafioId: vaultChallenge.desafioId,
          frase: vaultPhrase,
          codigo: vaultEmailCode,
        })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        showToastMessage(
          `⚠️ ${data.colecoesMovidas} coleções movidas para a lixeira (${data.prefixoDaLixeira}). Nada foi apagado.`,
          'success',
        )
        fecharCofre()
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
      } else {
        showToastMessage(data.error || 'Falha ao executar a operação', 'error')
      }
    } catch (error: any) {
      showToastMessage('Erro ao executar: ' + error.message)
    } finally {
      setResettingDatabase(false)
    }
  }

  /*
   * As ações de uma prova.
   *
   * Todas seguem a mesma forma: marcam a ação no cartão, mandam a requisição e
   * corrigem no estado APENAS o que mudou. As que só viram uma chave
   * (visibilidade, classificação) mudam a tela antes da resposta e desfazem se
   * o servidor recusar — o clique responde na hora, e o erro, quando existe,
   * chega como aviso e não como uma tela que voltou sozinha.
   */

  const deletarProva = useCallback(async (prova: Exam) => {
    const id = idDaProva(prova)
    marcarAcao(id, 'deletar')
    try {
      const res = await fetch(`/api/exams/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Erro ao deletar')

      // Some da lista aqui mesmo. Antes vinha um `router.refresh()` junto com a
      // releitura: dois recarregamentos para apagar uma linha da tela.
      removerDaLista(id)
      showToastMessage('Prova deletada com sucesso!', 'success')
    } catch (error: any) {
      showToastMessage(error.message)
    } finally {
      marcarAcao(id, null)
    }
  }, [marcarAcao, removerDaLista, showToastMessage])

  const deletarTodasAsProvas = useCallback(async () => {
    setAtualizando(true)
    try {
      const res = await fetch('/api/exams', { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao deletar')

      const data = await res.json()
      setExams([])
      setAtualizadoEm(Date.now())
      showToastMessage(data.message, 'success')
    } catch (error: any) {
      showToastMessage(error.message)
    } finally {
      setAtualizando(false)
    }
  }, [showToastMessage])

  const alternarVisibilidade = useCallback(async (prova: Exam) => {
    const id = idDaProva(prova)
    const eraOculta = !!prova.isHidden
    marcarAcao(id, 'visibilidade')
    aplicarNaProva(id, { isHidden: !eraOculta })

    try {
      const res = await fetch(`/api/exams/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHidden: !eraOculta }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar a visibilidade')

      showToastMessage(
        eraOculta
          ? 'Prova visível: ela volta ao catálogo dos alunos.'
          : 'Prova oculta: ela sai do catálogo dos alunos e fica só no painel.',
        'success',
      )
    } catch (error: any) {
      aplicarNaProva(id, { isHidden: eraOculta })
      showToastMessage(error.message)
    } finally {
      marcarAcao(id, null)
    }
  }, [aplicarNaProva, marcarAcao, showToastMessage])

  /** Liga/desliga a classificação pública desta prova para os alunos. */
  const alternarClassificacao = useCallback(async (prova: Exam) => {
    const id = idDaProva(prova)
    const estadoAnterior = prova.showRanking
    const passaAExibir = prova.showRanking === false
    marcarAcao(id, 'classificacao')
    aplicarNaProva(id, { showRanking: passaAExibir })

    try {
      const res = await fetch(`/api/exams/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showRanking: passaAExibir }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar a classificação')

      showToastMessage(
        passaAExibir
          ? 'Classificação visível: os alunos voltam a ver a lista de notas.'
          : 'Classificação oculta: os alunos veem a própria nota e a média da turma, sem a lista de nomes.',
        'success',
      )
    } catch (error: any) {
      aplicarNaProva(id, { showRanking: estadoAnterior })
      showToastMessage(error.message)
    } finally {
      marcarAcao(id, null)
    }
  }, [aplicarNaProva, marcarAcao, showToastMessage])

  /**
   * Forçar início e término.
   *
   * As datas voltam do servidor e são gravadas no cartão. É a diferença entre
   * "o botão mudou porque o relógio DESTA máquina achou que devia" e "o botão
   * mudou porque a prova começou": o instante que vale é o do servidor, e é ele
   * que a lista passa a exibir.
   */
  const forcarHorario = useCallback(async (prova: Exam, acao: 'start' | 'end') => {
    const id = idDaProva(prova)
    marcarAcao(id, acao === 'start' ? 'forcar-inicio' : 'forcar-termino')

    try {
      const res = await fetch(`/api/exams/${id}/force-time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: acao }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Erro ao forçar ${acao === 'start' ? 'início' : 'término'}`)

      const aplicadoEm = data.aplicadoEm ? new Date(data.aplicadoEm) : new Date()
      aplicarNaProva(
        id,
        acao === 'start'
          ? { startTime: aplicadoEm, gatesOpen: aplicadoEm }
          : { endTime: aplicadoEm, gatesClose: aplicadoEm },
      )
      setPisoDoRelogio(aplicadoEm.getTime() + 1)
      showToastMessage(data.message, 'success')
    } catch (error: any) {
      showToastMessage(error.message)
    } finally {
      marcarAcao(id, null)
    }
  }, [aplicarNaProva, marcarAcao, showToastMessage])

  /**
   * Zerar a prova.
   *
   * O documento da prova não muda — o que sai são as entregas, os rascunhos, as
   * tentativas e as anotações (ver `lib/provas/reset-da-prova.ts`). Por isso
   * aqui não há nada a corrigir na lista: reler as provas para descobrir que
   * nenhuma delas mudou era trabalho puro.
   */
  const zerarProva = useCallback(async (prova: Exam) => {
    const id = idDaProva(prova)
    marcarAcao(id, 'zerar')
    try {
      const res = await fetch(`/api/exams/${id}/reset-submissions`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao zerar a prova')

      showToastMessage(data.message, 'success')
    } catch (error: any) {
      showToastMessage(error.message)
    } finally {
      marcarAcao(id, null)
    }
  }, [marcarAcao, showToastMessage])

  /**
   * Duplicar a prova.
   *
   * A cópia nasce OCULTA (ver `app/api/exams/[id]/duplicate/route.ts`) e o
   * painel vai direto para o editor dela: quem duplica uma prova está prestes
   * a mudar alguma coisa nela — a data, quase sempre —, e devolver a lista
   * obrigaria a procurar a cópia no meio das outras para fazer isso.
   *
   * É a única ação que não desmarca o cartão no sucesso: o spinner continua até
   * a navegação acontecer, senão o botão volta ao normal e parece que nada foi
   * feito no intervalo entre a resposta e a troca de tela.
   */
  const duplicarProva = useCallback(async (prova: Exam) => {
    const id = idDaProva(prova)
    marcarAcao(id, 'duplicar')
    try {
      const res = await fetch(`/api/exams/${id}/duplicate`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao duplicar prova')

      showToastMessage(data.message, 'success')
      router.push(`/admin/exams/${data.examId}/edit`)
    } catch (error: any) {
      showToastMessage(error.message)
      marcarAcao(id, null)
    }
  }, [marcarAcao, router, showToastMessage])

  const gerarPDFDaProva = useCallback(async (prova: Exam) => {
    const id = idDaProva(prova)
    marcarAcao(id, 'pdf')
    try {
      const { generateExamPDF, downloadPDF } = await import('@/lib/pdf-generator')
      const blob = await generateExamPDF(prova)
      downloadPDF(blob, `${prova.title}.pdf`, { type: 'exam_pdf', resourceId: id, resourceTitle: prova.title })
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error)
      showToastMessage('Erro ao gerar PDF: ' + error.message)
    } finally {
      marcarAcao(id, null)
    }
  }, [marcarAcao, showToastMessage])

  /*
   * As confirmações não são mais `window.confirm`.
   *
   * O `confirm` do navegador trava a aba inteira, ignora o tema, não formata a
   * lista do que vai ser apagado e — em vários navegadores — ganha um "não
   * perguntar de novo" que desarma a última trava antes de uma exclusão. Um
   * diálogo do próprio painel cabe no texto que essas ações precisam ter.
   */
  const acoes = useMemo<AcoesDaProva>(() => ({
    editar: prova => router.push(`/admin/exams/${idDaProva(prova)}/edit`),
    duplicar: duplicarProva,
    alternarVisibilidade,
    alternarClassificacao,
    forcarInicio: prova =>
      pedirConfirmacao({
        titulo: 'Forçar o início agora?',
        descricao: (
          <>
            <strong>{prova.title}</strong> passa a valer como iniciada neste instante: o horário de
            início e a abertura dos portões vão para agora, e quem estiver na sala de espera pode
            começar.
          </>
        ),
        rotuloDeConfirmar: 'Sim, iniciar agora',
        aoConfirmar: () => forcarHorario(prova, 'start'),
      }),
    forcarTermino: prova =>
      pedirConfirmacao({
        titulo: 'Forçar o término agora?',
        descricao: (
          <>
            <strong>{prova.title}</strong> encerra neste instante. Quem estiver respondendo perde a
            possibilidade de enviar, e o gabarito e os resultados são liberados.
          </>
        ),
        rotuloDeConfirmar: 'Sim, encerrar agora',
        aoConfirmar: () => forcarHorario(prova, 'end'),
      }),
    /*
     * O aviso lista o que sai porque o que sai deixou de ser só "as submissões":
     * rascunhos, tentativas, anotações e relatos de questão vão junto (ver
     * `lib/provas/reset-da-prova.ts`). Um admin que leia "as submissões" e perca
     * as anotações dos alunos foi avisado da coisa errada.
     */
    zerar: prova =>
      pedirConfirmacao({
        titulo: 'Zerar a prova?',
        descricao: (
          <>
            Isso apaga <strong>permanentemente</strong> tudo o que os alunos deixaram em{' '}
            <strong>{prova.title}</strong>:
            <ul className="mt-3 space-y-1 text-left list-disc list-inside">
              <li>entregas, notas e correções</li>
              <li>rascunhos salvos e retomadas já usadas</li>
              <li>registros de tentativa (inclusive as em andamento)</li>
              <li>anotações dos alunos nas questões</li>
              <li>relatos de erro enviados sobre as questões</li>
            </ul>
            <p className="mt-3">
              As questões e as configurações da prova não são alteradas, e todos poderão refazê-la.
              Esta ação não pode ser desfeita.
            </p>
          </>
        ),
        rotuloDeConfirmar: 'Sim, zerar a prova',
        aoConfirmar: () => zerarProva(prova),
      }),
    corrigirDiscursivas: prova => router.push(`/admin/exams/${idDaProva(prova)}/corrections`),
    verRelatorio: prova => router.push(`/admin/exams/${idDaProva(prova)}/relatorio`),
    gerarPDF: gerarPDFDaProva,
    deletar: prova =>
      pedirConfirmacao({
        titulo: 'Deletar esta prova?',
        descricao: (
          <>
            <strong>{prova.title}</strong> e todas as submissões dela são apagadas
            permanentemente. Esta ação não pode ser desfeita.
          </>
        ),
        rotuloDeConfirmar: 'Sim, deletar',
        aoConfirmar: () => deletarProva(prova),
      }),
    verRankingPublico: prova => router.push(`/exam/${idDaProva(prova)}/results`),
  }), [
    alternarClassificacao,
    alternarVisibilidade,
    deletarProva,
    duplicarProva,
    forcarHorario,
    gerarPDFDaProva,
    pedirConfirmacao,
    router,
    zerarProva,
  ])

  const q = search.trim().toLowerCase()
  const filteredExams = q
    ? exams.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q)
      )
    : exams

  const horaDaAtualizacao = atualizadoEm
    ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(atualizadoEm)
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        {/*
          A barra quebra em linha em vez de estourar a tela: são seis controles
          numa fileira que era `flex` sem `wrap`, e num monitor menor (ou num
          celular) os últimos saíam pela direita — inclusive "Nova Prova".
        */}
        <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Gerenciar Provas</h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {/*
              O botão que substitui o F5.
              A lista se corrige sozinha a cada ação, mas provas mudam por fora
              do painel (outro admin, a prova que começou). Este é o jeito de
              conferir sem perder a busca digitada nem a rolagem.
            */}
            <Button
              variant="outline"
              onClick={() => carregarProvas({ silencioso: true })}
              disabled={atualizando || loading}
              title="Relê a lista sem recarregar a página"
              aria-busy={atualizando}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', atualizando && 'animate-spin')} />
              Atualizar
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/admin/proctoring')}
              className="border-blue-500 text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950"
            >
              <Video className="h-4 w-4 mr-2" />
              Monitoramento
            </Button>
            {exams.length > 0 && (
              <Button
                variant="destructive"
                onClick={() =>
                  pedirConfirmacao({
                    titulo: 'Deletar todas as provas?',
                    descricao: (
                      <>
                        Todas as {exams.length} prova(s) e suas submissões serão deletadas
                        permanentemente do sistema. Esta ação é <strong>irreversível</strong>.
                      </>
                    ),
                    rotuloDeConfirmar: 'Sim, deletar tudo',
                    aoConfirmar: deletarTodasAsProvas,
                  })
                }
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar Todas
              </Button>
            )}
            <Button onClick={() => router.push('/admin/exams/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Prova
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Card de Configurações */}
        {showSettings && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações do Sistema
              </CardTitle>
              <CardDescription>
                Configure as integrações e API keys necessárias para o funcionamento do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gemini-api-key">API Key do Google Gemini</Label>
                <p className="text-sm text-muted-foreground">
                  Necessária para correção automática de questões discursivas.{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Obter API Key
                  </a>
                </p>
                <div className="flex gap-2">
                  <Input
                    id="gemini-api-key"
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIza..."
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={testGeminiConnection}
                    disabled={testingConnection || !geminiApiKey.trim()}
                  >
                    {testingConnection ? 'Testando...' : 'Testar'}
                  </Button>
                  <Button
                    onClick={saveSettings}
                    disabled={savingSettings || geminiApiKey === savedGeminiApiKey}
                  >
                    {savingSettings ? (
                      'Salvando...'
                    ) : geminiApiKey === savedGeminiApiKey ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Salvo
                      </>
                    ) : (
                      'Salvar'
                    )}
                  </Button>
                </div>
                {savedGeminiApiKey && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    ✓ API Key configurada
                  </p>
                )}
              </div>

              {/* Zona de Perigo - Reset Database */}
              <div className="pt-6 mt-6 border-t border-red-200 dark:border-red-800">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <ShieldAlert className="h-5 w-5" />
                    <h3 className="font-semibold text-lg">Zona de Perigo</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ações irreversíveis que afetam todo o sistema. Use com extrema cautela.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => setShowVaultDialog(true)}
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Resetar Banco de Dados
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Campo de busca */}
        {!loading && exams.length > 0 && (
          <div className="mb-6 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Pesquisar provas por título ou descrição…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredExams.length === exams.length
                ? `${exams.length} prova(s)`
                : `${filteredExams.length} de ${exams.length} prova(s)`}
              {horaDaAtualizacao && ` · lista lida às ${horaDaAtualizacao}`}
              {atualizando && ' · atualizando…'}
            </p>
          </div>
        )}

        {loading ? (
          /*
            Esqueleto no lugar de "Carregando...": a lista já ocupa o espaço que
            vai ocupar, então a chegada dos dados não empurra a página.
          */
          <div className="space-y-4" aria-busy="true">
            {[0, 1, 2].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-2/3 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-28" />
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-40" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : exams.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                Você ainda não criou nenhuma prova
              </p>
              <Button onClick={() => router.push('/admin/exams/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Prova
              </Button>
            </CardContent>
          </Card>
        ) : filteredExams.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground">Nenhuma prova encontrada para &ldquo;{search}&rdquo;</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearch('')}>
                Limpar busca
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredExams.map((exam) => {
              const id = idDaProva(exam)
              return (
                <CartaoDeProva
                  key={id}
                  prova={exam}
                  agora={agora}
                  // A ação DESTE cartão, não o mapa inteiro: passar o objeto
                  // todo faria qualquer clique invalidar a memoização de todos.
                  acaoEmCurso={acoesEmCurso[id] ?? null}
                  acoes={acoes}
                />
              )
            })}
          </div>
        )}
      </main>

      {/* Confirmação das ações que não dá para desfazer */}
      <Dialog open={!!confirmacao} onOpenChange={(open) => { if (!open) setConfirmacao(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-300" />
            </div>
            <DialogTitle className="text-center text-xl">
              {confirmacao?.titulo}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-center mt-2 space-y-2">{confirmacao?.descricao}</div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmacao(null)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const pedido = confirmacao
                // O diálogo sai na hora: quem mostra o andamento daqui em diante
                // é o próprio cartão, com o botão que virou spinner.
                setConfirmacao(null)
                pedido?.aoConfirmar()
              }}
              className="w-full sm:w-auto"
            >
              {confirmacao?.rotuloDeConfirmar}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog do Cofre de Segurança Máxima */}
      <Dialog open={showVaultDialog} onOpenChange={(open) => {
        if (!open) fecharCofre()
        else setShowVaultDialog(true)
      }}>
        <DialogContent className="max-w-md border-4 border-red-500 dark:border-red-700 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950">
          <DialogHeader>
            <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-red-600 to-red-800 dark:from-red-700 dark:to-red-900 flex items-center justify-center mb-4 shadow-2xl border-4 border-red-700 dark:border-red-600 relative">
              <div className="absolute inset-0 rounded-full bg-red-500 opacity-20 animate-pulse"></div>
              <Lock className="h-12 w-12 text-white drop-shadow-lg relative z-10" />
            </div>
            <DialogTitle className="text-center text-2xl font-bold text-red-900 dark:text-red-100 uppercase tracking-wider">
              🔒 Cofre de Segurança Máxima
            </DialogTitle>
            <DialogDescription className="text-center mt-4 space-y-3">
              <div className="bg-red-100 dark:bg-red-900/50 border-2 border-red-400 dark:border-red-600 rounded-lg p-4">
                <p className="text-red-900 dark:text-red-100 font-bold text-lg mb-2">
                  ⚠️ AVISO CRÍTICO ⚠️
                </p>
                <p className="text-red-800 dark:text-red-200 text-sm leading-relaxed">
                  Você está prestes a <strong>DESTRUIR PERMANENTEMENTE</strong> todo o banco de dados do sistema.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-900 border-2 border-red-300 dark:border-red-700 rounded-lg p-3 text-left space-y-2">
                <p className="text-sm text-red-900 dark:text-red-100 font-semibold">
                  Esta ação irá deletar:
                </p>
                <ul className="text-xs text-red-800 dark:text-red-200 space-y-1 ml-4">
                  <li>✗ Todos os usuários</li>
                  <li>✗ Todas as provas</li>
                  <li>✗ Todas as submissões</li>
                  <li>✗ Todos os tickets</li>
                  <li>✗ Todas as notificações</li>
                  <li>✗ Todas as configurações</li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg p-3 border-2 border-red-700">
                <p className="text-sm font-bold">
                  🔐 Exige código do cofre, código enviado por e-mail e frase de confirmação.
                </p>
                <p className="text-xs mt-2 opacity-90">
                  As coleções são movidas para uma lixeira (prefixo <code>_lixeira_</code>),
                  não apagadas — dá para restaurar pelo Atlas.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vault-password" className="text-red-900 dark:text-red-100 font-semibold flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Código do Cofre
              </Label>
              <Input
                id="vault-password"
                type="password"
                value={vaultPassword}
                onChange={(e) => setVaultPassword(e.target.value)}
                placeholder="Digite o código de segurança"
                className="border-2 border-red-400 dark:border-red-600 focus:border-red-600 dark:focus:border-red-500 bg-white dark:bg-gray-900"
                disabled={resettingDatabase || !!vaultChallenge}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !resettingDatabase && !vaultChallenge) {
                    solicitarDesafioDoCofre()
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Definido em <code>DB_RESET_CODE</code>, diferente do código do painel
              </p>
            </div>

            {vaultChallenge && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="vault-code" className="text-red-900 dark:text-red-100 font-semibold">
                    Código enviado por e-mail
                  </Label>
                  <Input
                    id="vault-code"
                    inputMode="numeric"
                    value={vaultEmailCode}
                    onChange={(e) => setVaultEmailCode(e.target.value)}
                    placeholder="6 dígitos"
                    className="border-2 border-red-400 dark:border-red-600 bg-white dark:bg-gray-900 tracking-widest text-center"
                    disabled={resettingDatabase}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vault-phrase" className="text-red-900 dark:text-red-100 font-semibold">
                    Digite exatamente esta frase
                  </Label>
                  <div className="rounded-lg bg-gray-900 text-red-200 font-mono text-sm px-3 py-2 select-all break-all">
                    {vaultChallenge.frase}
                  </div>
                  <Input
                    id="vault-phrase"
                    value={vaultPhrase}
                    onChange={(e) => setVaultPhrase(e.target.value)}
                    placeholder="Repita a frase acima"
                    className="border-2 border-red-400 dark:border-red-600 bg-white dark:bg-gray-900 font-mono"
                    disabled={resettingDatabase}
                  />
                  <p className="text-xs text-muted-foreground">
                    Vale uma vez só e expira em 5 minutos
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={fecharCofre}
              disabled={resettingDatabase}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={vaultChallenge ? executarResetDoCofre : solicitarDesafioDoCofre}
              disabled={
                resettingDatabase ||
                (vaultChallenge
                  ? !vaultEmailCode.trim() || !vaultPhrase.trim()
                  : !vaultPassword)
              }
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 font-bold"
            >
              {resettingDatabase ? (
                <>
                  <Lock className="h-4 w-4 mr-2 animate-spin" />
                  {vaultChallenge ? 'Executando...' : 'Enviando código...'}
                </>
              ) : vaultChallenge ? (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Confirmar e mover para a lixeira
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Enviar código por e-mail
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ToastAlert
        open={toastOpen}
        onOpenChange={setToastOpen}
        message={toastMessage}
        type={toastType}
      />
    </div>
  )
}
