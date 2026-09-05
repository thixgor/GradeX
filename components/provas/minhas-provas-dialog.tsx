'use client'

/**
 * "Minhas Provas & Resultados" — de dentro de /provas, sem passar por /profile.
 *
 * O histórico de provas feitas (nota, correção, PDFs) já existia — na aba
 * "Desempenho" de `/profile`. O problema é que quase ninguém sabia que aquilo
 * estava lá: é uma aba entre quatro, dentro de uma página que a pessoa só abre
 * para mexer em configurações. Resultado, o recurso existia e não era achado.
 *
 * Este diálogo é o mesmo dado (`/api/user/submissions`) e a mesma lista
 * (`SubmissionsList`), só que a um clique de `/provas`.
 * `/profile?tab=desempenho` continua existindo — o rodapé aponta para lá para
 * quem quiser os gráficos — mas deixa de ser o único caminho.
 *
 * ## Três coisas que este arquivo conserta em relação ao primeiro esboço
 *
 * 1. **A barra de rolagem horizontal.** O `DialogContent` do projeto é
 *    `w-full mx-4` dentro de um wrapper que tem largura de conteúdo e
 *    `overflow-y-auto` — e `overflow-y` diferente de `visible` faz o navegador
 *    computar `overflow-x: auto` junto. Os 2rem de margem entravam POR CIMA da
 *    largura cheia, o conteúdo passava do wrapper e nascia a barra. Aqui a
 *    margem é cancelada e a largura é calculada contra a viewport.
 *
 * 2. **O botão que não levava a lugar nenhum.** O estado vazio de
 *    `SubmissionsList` oferece "Ver provas disponíveis" e navega para a home —
 *    o que faz sentido dentro de `/profile` e nenhum sentido aqui, onde a
 *    pessoa JÁ está na tela de provas. O vazio deste diálogo é próprio, e o
 *    botão dele fecha o diálogo em vez de recarregar a mesma página.
 *
 * 3. **O cartão dentro do cartão.** O vazio herdado vinha com borda e fundo
 *    próprios, desenhando uma moldura dentro da moldura do diálogo, com um
 *    vão enorme no meio.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ClipboardList, ExternalLink, Hourglass, TrendingUp } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SubmissionsList, type UserSubmission } from '@/components/profile/submissions-list'

/**
 * Uma prova está fechada quando não há mais nota para chegar. É o mesmo critério
 * que `SubmissionsList` usa para decidir se mostra a nota ou o aviso de espera —
 * repetido aqui porque o resumo do topo precisa da mesma conta.
 */
function aguardandoCorrecao(submission: UserSubmission): boolean {
  if (submission.isPracticeExam) return false
  if (!submission.hasDiscursiveQuestions) return false
  return submission.correctionStatus !== 'corrected'
}

export function MinhasProvasDialog({
  open,
  onOpenChange,
  userName,
  accountType,
  isAdmin,
  onError,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  userName: string
  /** Repassado à lista: é o cargo que decide se os PDFs saem. */
  accountType?: string | null
  isAdmin?: boolean
  onError: (message: string) => void
}) {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<UserSubmission[]>([])
  const [loading, setLoading] = useState(false)
  const [carregou, setCarregou] = useState(false)

  // Os dados só são buscados na primeira abertura: a maioria de quem entra em
  // /provas não clica nisto, e buscar de cara seria uma requisição paga por
  // todo mundo para um recurso que só alguns usam.
  useEffect(() => {
    if (!open || carregou) return
    setLoading(true)
    fetch('/api/user/submissions')
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => setSubmissions(data.submissions || []))
      .catch(() => onError('Não foi possível carregar suas provas. Tente novamente em instantes.'))
      .finally(() => {
        setLoading(false)
        setCarregou(true)
      })
  }, [open, carregou, onError])

  const pendentes = submissions.filter(aguardandoCorrecao).length
  const temProvas = submissions.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        `mx-0` cancela a margem que causava o transbordo, e a largura é medida
        contra a viewport (menos o `p-4` do wrapper) em vez de contra um pai de
        largura automática.
      */}
      <DialogContent className="mx-0 flex max-h-[85vh] w-[min(34rem,calc(100vw-2rem))] max-w-none flex-col overflow-hidden rounded-2xl">
        {/* ── Cabeçalho ─────────────────────────────────────────── */}
        <div className="flex items-start gap-3 border-b border-border/60 px-5 py-4 sm:px-6">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#468152]/10">
            <ClipboardList className="h-5 w-5 text-[#468152]" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold leading-tight sm:text-lg">Minhas Provas &amp; Resultados</h2>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
              {temProvas
                ? 'Toque em uma prova para ver a nota, o relatório e baixar os PDFs.'
                : 'Tudo o que você entregar aparece aqui, com nota e gabarito.'}
            </p>
          </div>
        </div>

        {/* ── Resumo ────────────────────────────────────────────── */}
        {temProvas && (
          <div className="flex flex-wrap items-center gap-2 border-b border-border/60 bg-muted/30 px-5 py-2.5 sm:px-6">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-background px-2.5 py-1 text-[11px] font-semibold shadow-sm">
              <TrendingUp className="h-3 w-3 text-[#468152]" />
              {submissions.length} {submissions.length === 1 ? 'prova entregue' : 'provas entregues'}
            </span>
            {/* Só aparece quando existe: um "0 aguardando" é ruído. */}
            {pendentes > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                <Hourglass className="h-3 w-3" />
                {pendentes} aguardando correção
              </span>
            )}
          </div>
        )}

        {/* ── Corpo ─────────────────────────────────────────────── */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {loading ? (
            // Esqueleto no formato das linhas que vão chegar: a lista não
            // "salta" quando os dados entram, e a espera parece mais curta do
            // que um "Carregando..." centralizado no vazio.
            <div className="space-y-2" aria-busy="true" aria-label="Carregando suas provas">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-border/50 px-4 py-3">
                  <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-muted-foreground/25" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="h-3 animate-pulse rounded bg-muted-foreground/15" style={{ width: `${70 - i * 12}%` }} />
                    <div className="h-2.5 w-24 animate-pulse rounded bg-muted-foreground/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : temProvas ? (
            <SubmissionsList
              submissions={submissions}
              loading={false}
              userName={userName}
              accountType={accountType}
              isAdmin={isAdmin}
              onError={onError}
            />
          ) : (
            <div className="px-2 py-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <ClipboardList className="h-6 w-6 text-muted-foreground/60" />
              </div>
              <p className="text-sm font-semibold">Você ainda não entregou nenhuma prova</p>
              <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-muted-foreground">
                Escolha uma prova da faculdade ou da plataforma. Quando terminar, a nota, o gabarito e o
                relatório completo aparecem aqui.
              </p>
              {/*
                Fecha o diálogo em vez de navegar: as provas estão logo atrás
                dele. O botão herdado do perfil mandava para a home — daqui,
                isso era recarregar a página em que a pessoa já estava.
              */}
              <Button size="sm" onClick={() => onOpenChange(false)} className="mt-5 rounded-xl">
                Escolher uma prova
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* ── Rodapé ────────────────────────────────────────────── */}
        {/* Quem quiser os gráficos e o histórico completo encontra o caminho
            para onde este resumo sempre morou. */}
        <button
          onClick={() => router.push('/profile?tab=desempenho')}
          className="flex shrink-0 items-center justify-center gap-1.5 border-t border-border/60 px-5 py-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground sm:px-6"
        >
          Ver desempenho com gráficos
          <ExternalLink className="h-3 w-3" />
        </button>
      </DialogContent>
    </Dialog>
  )
}
