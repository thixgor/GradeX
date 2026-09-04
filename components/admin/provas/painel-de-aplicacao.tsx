'use client'

import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Download, GraduationCap, Loader2, Lock, Shuffle, Users } from 'lucide-react'
import { MAX_PERIODO, MIN_PERIODO } from '@/lib/user-periodo'
import {
  type LiberacoesDeDownload,
  normalizarLiberacoes,
} from '@/lib/provas/downloads-da-prova'
import { type PublicoDaProva, normalizarPublico } from '@/lib/provas/publico-da-prova'
import { cn } from '@/lib/utils'

/**
 * Como esta prova é aplicada: a quem, com que embaralhamento e com quais PDFs
 * liberados.
 *
 * As três decisões estão juntas porque são a mesma decisão vista de ângulos
 * diferentes — o que a turma recebe. Espalhá-las por três seções distantes do
 * formulário é o que faz alguém agendar uma prova para o 3º período e só
 * descobrir na hora que o gabarito estava liberado para download.
 *
 * Cada bloco carrega a consequência ao lado do controle, não numa ajuda
 * escondida: quantos alunos o período alcança agora, o que o embaralhamento faz
 * com a letra da alternativa, e por que a exceção de download não vale para o
 * gabarito.
 */

interface Props {
  publico: PublicoDaProva
  onPublicoChange: (publico: PublicoDaProva) => void
  liberacoes: LiberacoesDeDownload
  onLiberacoesChange: (liberacoes: LiberacoesDeDownload) => void
  embaralharQuestoes: boolean
  embaralharAlternativas: boolean
  onEmbaralharChange: (campo: 'questoes' | 'alternativas', valor: boolean) => void
  /** Prova pessoal não tem público nem exceção de plano a configurar. */
  desabilitado?: boolean
}

const PERIODOS = Array.from({ length: MAX_PERIODO - MIN_PERIODO + 1 }, (_, i) => MIN_PERIODO + i)

export function PainelDeAplicacao({
  publico,
  onPublicoChange,
  liberacoes,
  onLiberacoesChange,
  embaralharQuestoes,
  embaralharAlternativas,
  onEmbaralharChange,
  desabilitado,
}: Props) {
  const [contagem, setContagem] = useState<Record<number, number> | null>(null)
  const [carregandoContagem, setCarregandoContagem] = useState(false)

  const publicoNormalizado = normalizarPublico(publico)
  const liberacoesNormalizadas = normalizarLiberacoes(liberacoes)
  const porPeriodos = publicoNormalizado.modo === 'periodos'

  // A contagem só é buscada quando alguém abre o modo por período: numa prova
  // aberta a plataforma inteira, o número não influencia decisão nenhuma.
  useEffect(() => {
    if (!porPeriodos || contagem || carregandoContagem) return
    setCarregandoContagem(true)
    fetch('/api/admin/exams/periodos')
      .then((res) => (res.ok ? res.json() : null))
      .then((dados) => {
        if (!dados?.periodos) return
        const mapa: Record<number, number> = {}
        for (const item of dados.periodos) mapa[item.periodo] = item.alunos
        setContagem(mapa)
      })
      .catch(() => {
        // Sem a contagem, o seletor continua funcionando — ele só deixa de
        // mostrar o alcance ao lado de cada período.
      })
      .finally(() => setCarregandoContagem(false))
  }, [porPeriodos, contagem, carregandoContagem])

  const alcance = publicoNormalizado.periodos.reduce((soma, p) => soma + (contagem?.[p] ?? 0), 0)

  function alternarPeriodo(periodo: number) {
    const atuais = new Set(publicoNormalizado.periodos)
    if (atuais.has(periodo)) atuais.delete(periodo)
    else atuais.add(periodo)
    const lista = Array.from(atuais).sort((a, b) => a - b)
    onPublicoChange({ modo: lista.length > 0 ? 'periodos' : 'todos', periodos: lista })
  }

  return (
    <div className="space-y-6">
      {/* ── A quem ──────────────────────────────────────────────── */}
      <section className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/20">
        <div className="flex items-start gap-2.5">
          <GraduationCap className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">Quem faz esta prova</h3>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
              Aplique a prova a um ou mais períodos. Quem não está no período não vê a prova na lista
              nem consegue abri-la pelo endereço — e não consegue entregá-la.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={desabilitado}
            onClick={() => onPublicoChange({ modo: 'todos', periodos: [] })}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
              !porPeriodos
                ? 'border-blue-500 bg-blue-500 text-white'
                : 'border-border bg-background hover:bg-muted',
              desabilitado && 'cursor-not-allowed opacity-50',
            )}
          >
            <Users className="mr-1.5 inline h-3.5 w-3.5" />
            Todos os alunos
          </button>
          <button
            type="button"
            disabled={desabilitado}
            onClick={() =>
              onPublicoChange(
                porPeriodos ? { modo: 'todos', periodos: [] } : { modo: 'periodos', periodos: [] },
              )
            }
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors',
              porPeriodos
                ? 'border-blue-500 bg-blue-500 text-white'
                : 'border-border bg-background hover:bg-muted',
              desabilitado && 'cursor-not-allowed opacity-50',
            )}
          >
            Por período
          </button>
        </div>

        {porPeriodos && (
          <div className="space-y-2.5">
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {PERIODOS.map((periodo) => {
                const marcado = publicoNormalizado.periodos.includes(periodo)
                const alunos = contagem?.[periodo]
                return (
                  <button
                    key={periodo}
                    type="button"
                    disabled={desabilitado}
                    onClick={() => alternarPeriodo(periodo)}
                    className={cn(
                      'rounded-lg border px-2 py-2 text-center transition-colors',
                      marcado
                        ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300'
                        : 'border-border bg-background hover:bg-muted',
                      desabilitado && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    <span className="block text-sm font-bold">{periodo}º</span>
                    {/* O alcance ao lado do período é o que impede agendar uma
                        prova para um período vazio sem perceber. */}
                    <span className="block text-[10px] leading-tight text-muted-foreground">
                      {alunos === undefined ? '—' : `${alunos} aluno${alunos === 1 ? '' : 's'}`}
                    </span>
                  </button>
                )
              })}
            </div>

            <p className="flex items-center gap-1.5 text-xs">
              {carregandoContagem && <Loader2 className="h-3 w-3 animate-spin" />}
              {publicoNormalizado.periodos.length === 0 ? (
                <span className="font-medium text-amber-700 dark:text-amber-400">
                  Nenhum período marcado — a prova continua aberta a todos os alunos.
                </span>
              ) : (
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  Esta prova será aplicada a <strong>{alcance}</strong>{' '}
                  {alcance === 1 ? 'aluno' : 'alunos'}, ao mesmo tempo, no horário agendado acima.
                </span>
              )}
            </p>
          </div>
        )}
      </section>

      {/* ── Embaralhamento ──────────────────────────────────────── */}
      <section className="space-y-3 rounded-xl border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-900 dark:bg-violet-950/20">
        <div className="flex items-start gap-2.5">
          <Shuffle className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-600 dark:text-violet-400" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">Embaralhamento</h3>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
              A ordem é sorteada por aluno e fica estável: recarregar a página devolve a mesma prova, e
              o relatório numera as questões como aquela pessoa as viu.
            </p>
          </div>
        </div>

        <Opcao
          id="shuffleQuestions"
          marcado={embaralharQuestoes}
          onChange={(v) => onEmbaralharChange('questoes', v)}
          titulo="Embaralhar a ordem das questões"
          descricao="Cada aluno recebe as questões em uma ordem diferente."
        />
        <Opcao
          id="shuffleAlternatives"
          marcado={embaralharAlternativas}
          onChange={(v) => onEmbaralharChange('alternativas', v)}
          titulo="Embaralhar as alternativas"
          descricao="As letras são reatribuídas por posição, então a resposta certa não é a mesma letra para todo mundo — que é justamente o que se copia numa sala."
        />
      </section>

      {/* ── Downloads ───────────────────────────────────────────── */}
      <section className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900 dark:bg-amber-950/20">
        <div className="flex items-start gap-2.5">
          <Download className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">Downloads sem assinatura (exceção desta prova)</h3>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
              Por padrão, baixar PDF de prova é um recurso das contas assinantes. Aqui você abre uma
              exceção <strong>só nesta prova</strong> — contas gratuitas passam a baixar o que você marcar.
            </p>
          </div>
        </div>

        <Opcao
          id="freeProva"
          marcado={liberacoesNormalizadas.prova}
          onChange={(v) => onLiberacoesChange({ ...liberacoesNormalizadas, prova: v })}
          titulo="PDF da prova (em branco)"
          descricao="Os enunciados e alternativas, sem gabarito. Serve para imprimir e resolver no papel."
          disabled={desabilitado}
        />
        <Opcao
          id="freeRelatorio"
          marcado={liberacoesNormalizadas.relatorio}
          onChange={(v) => onLiberacoesChange({ ...liberacoesNormalizadas, relatorio: v })}
          titulo="Relatório do aluno (prova respondida)"
          descricao="A prova dele com as próprias respostas marcadas. Fica disponível depois que ele entrega."
          disabled={desabilitado}
        />
        <Opcao
          id="freeGabarito"
          marcado={liberacoesNormalizadas.gabarito}
          onChange={(v) => onLiberacoesChange({ ...liberacoesNormalizadas, gabarito: v })}
          titulo="Gabarito e respostas comentadas"
          descricao="Liberado somente depois do término da prova."
          disabled={desabilitado}
        />

        <p className="flex items-start gap-1.5 rounded-lg bg-background/70 p-2.5 text-[11px] leading-snug text-muted-foreground">
          <Lock className="mt-0.5 h-3 w-3 flex-shrink-0" />
          <span>
            A exceção vale para o <strong>plano</strong>, nunca para o <strong>tempo</strong>. Marcar o
            gabarito aqui não o antecipa: ele continua saindo só depois do término, para não circular
            enquanto a turma responde.
          </span>
        </p>
      </section>
    </div>
  )
}

function Opcao({
  id,
  marcado,
  onChange,
  titulo,
  descricao,
  disabled,
}: {
  id: string
  marcado: boolean
  onChange: (valor: boolean) => void
  titulo: string
  descricao: string
  disabled?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        id={id}
        checked={marcado}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 flex-shrink-0 rounded border-input"
      />
      <div className="min-w-0 flex-1">
        <Label htmlFor={id} className="cursor-pointer text-sm font-medium">
          {titulo}
        </Label>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{descricao}</p>
      </div>
    </div>
  )
}
