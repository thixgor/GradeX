'use client'

import { BookOpenCheck, Download, FileDown, FileText, ListChecks, Package, type LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  FORMATOS_DE_PDF_DA_PROVA,
  avisoDoGabaritoComentado,
  type FormatoDePdfDaProva,
} from '@/lib/provas/formatos-de-pdf'
import type { Exam } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * A escolha do formato, antes de gerar.
 *
 * O painel tinha um botão único que sempre baixava o caderno EM BRANCO — o
 * admin não tinha, em lugar nenhum de `/admin/exams`, como pedir a prova com
 * resposta comentada. Aqui os formatos aparecem lado a lado, cada um dizendo o
 * que traz, no mesmo desenho do seletor que o aluno já vê em `/provas`.
 *
 * O aviso da prova sem comentários é a metade que faltava: a opção existia no
 * código há tempo, mas uma prova cujas questões não têm explicação gera um
 * arquivo com o gabarito marcado e nenhum comentário — e um arquivo assim, sem
 * aviso, parece o gerador quebrado. Ver `avisoDoGabaritoComentado`.
 */

const ICONES: Record<FormatoDePdfDaProva, LucideIcon> = {
  exam: FileText,
  'with-answers': BookOpenCheck,
  gabarito: ListChecks,
  pacote: Package,
}

const CORES: Record<FormatoDePdfDaProva, string> = {
  exam: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/30 hover:border-emerald-500/60 text-emerald-600 dark:text-emerald-400',
  'with-answers':
    'from-blue-500/10 to-blue-600/5 border-blue-500/30 hover:border-blue-500/60 text-blue-600 dark:text-blue-400',
  gabarito:
    'from-amber-500/10 to-amber-600/5 border-amber-500/30 hover:border-amber-500/60 text-amber-600 dark:text-amber-400',
  pacote:
    'from-violet-500/10 to-violet-600/5 border-violet-500/30 hover:border-violet-500/60 text-violet-600 dark:text-violet-400',
}

interface DialogoDePdfProps {
  /** A prova escolhida, ou `null` quando o diálogo está fechado. */
  prova: Exam | null
  /** Qual formato está sendo gerado agora — o spinner é dele. */
  gerando: FormatoDePdfDaProva | null
  /** Andamento do pacote, que monta mais de um documento. */
  progresso?: { feitos: number; total: number } | null
  onGerar: (prova: Exam, formato: FormatoDePdfDaProva) => void
  onFechar: () => void
}

export function DialogoDePdf({ prova, gerando, progresso, onGerar, onFechar }: DialogoDePdfProps) {
  if (!prova) return null

  const aviso = avisoDoGabaritoComentado(prova)
  const ocupado = gerando !== null

  return (
    <Dialog open={!!prova} onOpenChange={(aberto) => { if (!aberto && !ocupado) onFechar() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Gerar PDF
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">{prova.title}</p>
        </DialogHeader>

        <div className="space-y-3 px-6 py-2">
          {FORMATOS_DE_PDF_DA_PROVA.map((opcao) => {
            const Icone = ICONES[opcao.chave]
            const rodando = gerando === opcao.chave
            return (
              <button
                key={opcao.chave}
                type="button"
                disabled={ocupado}
                aria-busy={rodando}
                onClick={() => onGerar(prova, opcao.chave)}
                className={cn(
                  'w-full text-left rounded-xl border p-4 transition-all duration-200 bg-gradient-to-br',
                  CORES[opcao.chave],
                  ocupado && !rodando ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]',
                  rodando && 'ring-2 ring-primary/40',
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {rodando ? (
                      <span className="block h-7 w-7 rounded-full border-2 border-current border-t-transparent animate-spin opacity-70" />
                    ) : (
                      <Icone className="h-7 w-7" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">{opcao.titulo}</span>
                      {opcao.partes.length > 1 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/15 font-semibold uppercase">
                          {opcao.partes.length} em 1
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{opcao.descricao}</p>
                    {rodando && progresso && progresso.total > 1 && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Montando {progresso.feitos} de {progresso.total} documentos…
                      </p>
                    )}
                  </div>
                  {!rodando && <Download className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />}
                </div>
              </button>
            )
          })}
        </div>

        {aviso && (
          <p className="px-6 pb-1 text-xs text-amber-700 dark:text-amber-400">{aviso}</p>
        )}

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onFechar} disabled={ocupado}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
