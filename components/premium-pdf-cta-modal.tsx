'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Crown,
  FileText,
  ListChecks,
  BookOpenCheck,
  Package2,
  Library,
  X,
  Printer,
  Play,
  Check,
  ArrowRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { PLUS_LABEL, QUEST_LABEL, ROTA_ASSINATURA } from '@/lib/account-tier'
import { ACERVO_SEM_NUMERO, rotuloDoAcervo } from '@/lib/banco/acervo-publico'

interface PremiumPdfCtaModalProps {
  open: boolean
  onClose: () => void
  onTakeExam?: () => void
}

/**
 * A contagem do acervo, buscada uma vez por carregamento da página.
 *
 * O modal abre e fecha várias vezes na mesma sessão (uma por clique em
 * "baixar"), e o número do acervo não muda entre um clique e outro. Guardar
 * aqui fora do componente evita repetir a requisição a cada abertura e faz o
 * número aparecer instantaneamente da segunda vez em diante.
 */
let acervoEmCache: number | null = null

/**
 * O que o Quest+ entrega, na ordem em que resolve o problema de quem está
 * olhando esta tela: primeiro o papel na mão (o que a pessoa pediu ao clicar
 * em "baixar"), depois a correção, depois o acervo inteiro.
 *
 * A última linha é a única com número, e ele vem do servidor arredondado (ver
 * `lib/banco/acervo-publico.ts`) — por isso `descricao` é função em todas elas,
 * mesmo nas quatro que ignoram o argumento.
 */
interface Beneficio {
  icon: LucideIcon
  color: string
  bg: string
  titulo: string
  descricao: (acervo: string) => string
}

const BENEFICIOS: Beneficio[] = [
  {
    icon: FileText,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    titulo: 'A prova em branco, pronta para imprimir',
    descricao: () => 'Do mesmo jeito que ela cai na faculdade — caneta na mão, no seu ritmo.',
  },
  {
    icon: ListChecks,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    titulo: 'O gabarito à parte',
    descricao: () => 'Corrija a folha inteira em minutos, sem caçar resposta no meio do texto.',
  },
  {
    icon: BookOpenCheck,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    titulo: 'As respostas comentadas, impressas junto',
    descricao: () => 'Você entende por que errou na hora em que erra — que é quando gruda.',
  },
  {
    icon: Package2,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    titulo: 'A pasta inteira num download só',
    descricao: () => 'Todas as provas do grupo de uma vez: seu caderno de revisão fica pronto.',
  },
  {
    icon: Library,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    titulo: 'E o Banco de Questões liberado',
    descricao: (acervo: string) => `${acervo} para treinar por assunto, ano e dificuldade.`,
  },
]

/**
 * A oferta que aparece quando quem não assina clica em "baixar PDF".
 *
 * O público é específico e vale ter em mente ao mexer no texto: alguém que
 * está fazendo (ou acabou de abrir) uma prova de graça e quis levá-la para o
 * papel. A pessoa já demonstrou a intenção mais valiosa que existe aqui — ela
 * não precisa ser convencida do produto, precisa saber o que destrava o clique
 * que ela acabou de dar.
 *
 * Daí as três regras deste texto:
 *
 *  1. **Não assustar.** A primeira coisa depois do título diz que fazer a prova
 *     continua de graça. Sem isso, o modal parece uma parede cobrando por algo
 *     que ela estava fazendo sem pagar, e o efeito é abandono, não venda.
 *  2. **Nomear o plano certo.** Quem quer imprimir prova não precisa da
 *     plataforma inteira: o Quest+ é o caminho barato e é ele que o botão
 *     principal vende. O Plus+ aparece uma vez, no rodapé, para quem quiser mais.
 *  3. **Nunca prometer número exato.** O tamanho do acervo vem de
 *     `/api/banco/contagem` já arredondado para baixo; se a rota falhar, a
 *     frase sai sem número em vez de sair com um chute.
 */
export function PremiumPdfCtaModal({ open, onClose, onTakeExam }: PremiumPdfCtaModalProps) {
  const router = useRouter()
  const [acervo, setAcervo] = useState<number | null>(acervoEmCache)

  useEffect(() => {
    if (!open || acervoEmCache !== null) return
    let vivo = true
    fetch('/api/banco/contagem')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        const valor = Number(data?.aproximado)
        if (!Number.isFinite(valor)) return
        acervoEmCache = valor
        if (vivo) setAcervo(valor)
      })
      // Sem número o texto ainda funciona ("Milhares de questões"): a venda não
      // pode depender de uma requisição secundária dar certo.
      .catch(() => {})
    return () => { vivo = false }
  }, [open])

  const rotuloAcervo = rotuloDoAcervo(acervo) ?? ACERVO_SEM_NUMERO

  function assinar() {
    onClose()
    router.push(ROTA_ASSINATURA)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="p-0 overflow-hidden border-0 shadow-2xl w-[calc(100vw-2rem)] max-w-sm rounded-2xl">

        {/* Header gradient */}
        <div className="relative bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-500 px-5 pt-5 pb-6">
          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {/* Decorative glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.25)_0%,_transparent_60%)] pointer-events-none" />

          <div className="relative flex flex-col items-center text-center gap-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm shadow-inner">
              <Printer className="h-6 w-6 text-white drop-shadow" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight text-balance">
                Quer baixar esta prova e imprimir?
              </h2>
              <p className="text-white/90 text-xs mt-1 leading-snug">
                É o que o <strong className="text-white">DomineAqui {QUEST_LABEL}</strong> faz:
                prova, gabarito e resposta comentada no papel.
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pt-4 pb-5 space-y-4">

          {/* A prova em si continua de graça — dizer isso antes de qualquer preço */}
          <div className="flex items-start gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5">
            <Play className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-snug">
              <strong>Fazer a prova aqui é de graça, sempre.</strong> A assinatura entra só quando
              você quer levá-la para fora da tela.
            </p>
          </div>

          {/* O que destrava */}
          <ul className="space-y-2">
            {BENEFICIOS.map(({ icon: Icon, color, bg, titulo, descricao }) => (
              <li
                key={titulo}
                className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-muted/30 px-3 py-2.5"
              >
                <div className={`flex-shrink-0 p-1.5 rounded-lg ${bg}`}>
                  <Icon className={`h-3.5 w-3.5 ${color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold leading-tight">{titulo}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                    {descricao(rotuloAcervo)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="space-y-2">
            <button
              onClick={assinar}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-[0.98] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all duration-150"
            >
              <Crown className="h-4 w-4" />
              Assinar o DomineAqui {QUEST_LABEL}
            </button>
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <Check className="h-3 w-3 text-emerald-500 flex-shrink-0" />
              Acesso liberado na hora, assim que o pagamento é aprovado
            </p>
          </div>

          {/* Upgrade para quem quer mais do que provas */}
          <button
            onClick={assinar}
            className="w-full flex items-center justify-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Quer a plataforma inteira? Veja o {PLUS_LABEL}
            <ArrowRight className="h-3 w-3" />
          </button>

          {/* Continuar sem assinar (só quando o modal veio de uma prova específica) */}
          {onTakeExam && (
            <button
              onClick={() => { onClose(); onTakeExam() }}
              className="w-full h-10 rounded-xl border border-border bg-muted/40 hover:bg-muted/70 active:scale-[0.98] text-foreground font-medium text-sm flex items-center justify-center gap-2 transition-all duration-150"
            >
              <Play className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Continuar e fazer a prova (sem PDF)
            </button>
          )}

          {/* Dismiss */}
          <button
            onClick={onClose}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-0.5"
          >
            Agora não
          </button>
        </div>

      </DialogContent>
    </Dialog>
  )
}
