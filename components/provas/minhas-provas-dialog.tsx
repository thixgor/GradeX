'use client'

/**
 * "Minhas Provas & Resultados" — de dentro de /provas, sem passar por /profile.
 *
 * O histórico de provas feitas (nota, correção, PDFs) já existia — na aba
 * "Desempenho" de `/profile`. O problema é que quase ninguém sabia que aquilo
 * estava lá: é uma aba entre quatro, dentro de uma página que a pessoa só abre
 * para mexer em configurações. Resultado, o recurso existia e não era achado.
 *
 * Este diálogo é o mesmo dado (`/api/user/submissions`), a mesma lista
 * (`SubmissionsList`, reaproveitada tal como está — os botões de PDF e o link
 * para o relatório já funcionam sozinhos), só que a um clique de `/provas`, que
 * é a tela que a pessoa já abre para lidar com provas. `/profile?tab=desempenho`
 * continua existindo — o rodapé aponta para lá para quem quiser os gráficos e o
 * aprofundamento — mas deixa de ser o único caminho.
 *
 * Os dados só são buscados na primeira abertura (e ficam em cache no
 * componente): a maioria de quem entra em `/provas` não clica nisto, então
 * buscar de cara seria uma requisição paga por todo mundo para um recurso que
 * só alguns usam.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardList, ExternalLink } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SubmissionsList, type UserSubmission } from '@/components/profile/submissions-list'

export function MinhasProvasDialog({
  open,
  onOpenChange,
  userName,
  onError,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  userName: string
  onError: (message: string) => void
}) {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<UserSubmission[]>([])
  const [loading, setLoading] = useState(false)
  const [carregou, setCarregou] = useState(false)

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader className="pb-3">
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#468152]/10">
              <ClipboardList className="h-5 w-5 text-[#468152]" />
            </div>
            Minhas Provas & Resultados
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-2">
          <SubmissionsList submissions={submissions} loading={loading} userName={userName} onError={onError} />
        </div>

        {/* Quem quiser os gráficos e o histórico completo (não só a lista)
            encontra o caminho para onde este resumo sempre morou. */}
        <button
          onClick={() => router.push('/profile?tab=desempenho')}
          className="flex items-center justify-center gap-1.5 border-t border-border/60 px-6 py-3.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Ver com gráficos e histórico completo
          <ExternalLink className="h-3 w-3" />
        </button>
      </DialogContent>
    </Dialog>
  )
}
