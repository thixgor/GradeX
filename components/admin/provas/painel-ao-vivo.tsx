'use client'

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ChevronDown,
  Eye,
  Loader2,
  Pause,
  PenLine,
  Play,
  RefreshCw,
  Users,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useRelogioDaLista } from '@/hooks/use-relogio-da-lista'
import { useAcompanhamentoAoVivo } from '@/hooks/use-acompanhamento-ao-vivo'
import {
  ROTULO_DO_ESTADO,
  estadoDoParticipante,
  temSalaDeEspera,
  type EstadoNaProva,
  type ParticipanteAoVivo,
} from '@/lib/provas/acompanhamento-ao-vivo'
import { ROTULO_DA_FASE, resolverJanelaDaProva } from '@/lib/provas/janela-da-prova'
import { horariosDaProva } from '@/lib/provas/horarios-da-prova'
import { montarProvaParaAluno, sementeDaProva } from '@/lib/provas/embaralhar'
import type { Exam, Question } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * A prova acontecendo, numa tela só.
 *
 * ## O que o admin não tinha
 *
 * Entre "a prova ainda não começou" e "a prova acabou" existem três horas em
 * que o painel não dizia nada. Quem está na sala? Quem assinou? Quem travou na
 * questão 7? Essas perguntas têm resposta no banco desde sempre — em três
 * coleções diferentes — e nenhuma tela as fazia.
 *
 * Aqui elas viram uma lista: uma linha por pessoa, o estado dela em cores, e a
 * questão em que ela está agora. Abrir a linha mostra a questão inteira, do
 * jeito que ELA a está vendo, com a alternativa que ela marcou.
 *
 * ## Expandir uma pessoa não custa nada
 *
 * O enunciado, o comando e as alternativas não vêm do servidor: a lista de
 * `/admin/exams` já carrega as provas completas, e a ordem que cada aluno viu é
 * reproduzível a partir da semente `examId:userId` (ver
 * `lib/provas/embaralhar.ts`) — inclusive a letra de cada alternativa, que
 * muda de aluno para aluno quando a prova embaralha. Então o painel monta a
 * prova daquela pessoa no próprio navegador, e o retrato do servidor precisa
 * mandar só o id da alternativa marcada.
 *
 * A única coisa pedida ao servidor ao expandir é a imagem da assinatura, que
 * pesa centenas de kilobytes e por isso mora numa rota separada, buscada uma
 * vez por pessoa.
 */

interface Props {
  /** A prova a acompanhar, ou `null` quando o painel está fechado. */
  prova: Exam | null
  onFechar: () => void
}

const CORES_DO_ESTADO: Record<EstadoNaProva, string> = {
  respondendo: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  parado: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  sumiu: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
  'na-sala': 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
  entregou: 'bg-muted text-muted-foreground border-border',
}

/** O mesmo tratamento de texto da tela da prova: `\n` escapado vira quebra. */
const comQuebras = (texto: string) => (texto || '').replace(/\\nl/g, '\n').replace(/\\n/g, '\n')

function hora(valor: string | null | undefined): string {
  if (!valor) return '—'
  const data = new Date(valor)
  if (!Number.isFinite(data.getTime())) return '—'
  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function haQuantoTempo(valor: string | null | undefined, agora: number): string {
  if (!valor) return '—'
  const t = new Date(valor).getTime()
  if (!Number.isFinite(t)) return '—'
  const segundos = Math.max(0, Math.round((agora - t) / 1000))
  if (segundos < 60) return `há ${segundos}s`
  const minutos = Math.floor(segundos / 60)
  if (minutos < 60) return `há ${minutos} min`
  const horas = Math.floor(minutos / 60)
  return `há ${horas} h ${minutos % 60} min`
}

/**
 * A contagem regressiva do próximo marco.
 *
 * Ela corre no navegador, de segundo em segundo, e não custa requisição
 * nenhuma: os quatro horários da prova já vieram no documento. É a resposta
 * para "quanto falta para o portão abrir" sem nenhuma ida ao servidor.
 */
function ContagemRegressiva({ alvo }: { alvo: number }) {
  const [restante, setRestante] = useState(() => Math.max(0, alvo - Date.now()))

  useEffect(() => {
    setRestante(Math.max(0, alvo - Date.now()))
    const timer = setInterval(() => setRestante(Math.max(0, alvo - Date.now())), 1000)
    return () => clearInterval(timer)
  }, [alvo])

  const total = Math.floor(restante / 1000)
  const dias = Math.floor(total / 86_400)
  const horas = Math.floor((total % 86_400) / 3600)
  const minutos = Math.floor((total % 3600) / 60)
  const segundos = total % 60
  const doisDigitos = (n: number) => String(n).padStart(2, '0')

  return (
    <span className="font-mono tabular-nums text-2xl sm:text-3xl font-bold tracking-tight">
      {dias > 0 && `${dias}d `}
      {doisDigitos(horas)}:{doisDigitos(minutos)}:{doisDigitos(segundos)}
    </span>
  )
}

function Numero({
  rotulo,
  valor,
  total,
  cor,
}: {
  rotulo: string
  valor: number
  total?: number
  cor?: string
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/30 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{rotulo}</p>
      <p className={cn('text-xl font-bold leading-tight mt-0.5', cor)}>
        {valor}
        {total !== undefined && <span className="text-sm font-normal text-muted-foreground">/{total}</span>}
      </p>
    </div>
  )
}

/** A assinatura de uma pessoa — pedida só quando a linha é aberta. */
function AssinaturaDoAluno({ provaId, userId }: { provaId: string; userId: string }) {
  const [estado, setEstado] = useState<'carregando' | 'pronta' | 'erro'>('carregando')
  const [imagem, setImagem] = useState<string | null>(null)
  const [nomeDeclarado, setNomeDeclarado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    const controlador = new AbortController()

    ;(async () => {
      try {
        const res = await fetch(`/api/admin/exams/${provaId}/ao-vivo/${userId}`, {
          cache: 'no-store',
          signal: controlador.signal,
        })
        if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || 'Falha ao carregar')
        const dados = await res.json()
        if (cancelado) return
        setImagem(dados.assinatura || null)
        setNomeDeclarado(dados.nomeDeclarado || null)
        setEstado('pronta')
      } catch (e: any) {
        if (cancelado || e?.name === 'AbortError') return
        setErro(e?.message || 'Falha ao carregar a assinatura')
        setEstado('erro')
      }
    })()

    return () => {
      cancelado = true
      controlador.abort()
    }
  }, [provaId, userId])

  if (estado === 'carregando') {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Carregando assinatura…
      </div>
    )
  }

  if (estado === 'erro') {
    return <p className="text-xs text-rose-600 dark:text-rose-400">{erro}</p>
  }

  if (!imagem) {
    return <p className="text-xs text-muted-foreground">Sem assinatura gravada.</p>
  }

  return (
    <div className="space-y-1.5">
      {nomeDeclarado && (
        <p className="text-xs text-muted-foreground">
          Assinou como <span className="font-medium text-foreground">{nomeDeclarado}</span>
        </p>
      )}
      {/*
        A assinatura é um data URI gerado pelo próprio canvas do aluno — não há
        URL remota para o otimizador do Next processar, então `img` é o
        elemento certo aqui.
      */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imagem}
        alt="Assinatura digital do aluno"
        className="max-h-24 w-auto rounded-lg border border-border/50 bg-white p-1"
      />
    </div>
  )
}

/** A questão que a pessoa está respondendo, como ELA a está vendo. */
function QuestaoDoAluno({
  questao,
  numero,
  total,
  marcada,
  escreveu,
}: {
  questao: Question | null
  numero: number
  total: number
  marcada: string | null
  escreveu: boolean
}) {
  if (!questao) {
    return (
      <p className="text-xs text-muted-foreground">
        Não foi possível localizar a questão {numero} nesta prova — ela pode ter sido removida depois
        que a pessoa começou.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
        Questão {numero} de {total}
      </p>

      {questao.statement && (
        <div className="rounded-xl border border-border/40 bg-muted/40 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
            Enunciado
          </p>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{comQuebras(questao.statement)}</p>
        </div>
      )}

      {questao.command && (
        <div className="rounded-xl border border-blue-200/50 dark:border-blue-800/30 bg-blue-50/50 dark:bg-blue-950/20 p-3">
          <p className="text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-400 font-semibold mb-1.5">
            Comando
          </p>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{comQuebras(questao.command)}</p>
        </div>
      )}

      {questao.type === 'multiple-choice' ? (
        <div className="space-y-1.5">
          {(questao.alternatives || []).map((alternativa) => {
            const marcou = alternativa.id === marcada
            return (
              <div
                key={alternativa.id}
                className={cn(
                  'flex gap-2.5 rounded-lg border p-2.5 text-sm',
                  marcou
                    ? 'border-emerald-500/60 bg-emerald-500/10'
                    : 'border-border/40 bg-background/40',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold',
                    marcou ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {alternativa.letter}
                </span>
                <span className="flex-1 whitespace-pre-wrap leading-relaxed">
                  {comQuebras(alternativa.text)}
                </span>
                {/*
                  O gabarito fica ao lado da marcação porque quem lê esta tela é
                  o admin, e a pergunta que ele faz olhando uma questão durante
                  a prova é "essa turma está errando esta aqui?".
                */}
                {alternativa.isCorrect && (
                  <span className="shrink-0 self-start rounded px-1.5 py-0.5 text-[10px] font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-300">
                    gabarito
                  </span>
                )}
              </div>
            )
          })}
          {!marcada && (
            <p className="text-xs text-muted-foreground pt-1">Ainda não marcou nada nesta questão.</p>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Questão {questao.type === 'essay' ? 'de redação' : 'discursiva'} —{' '}
          {escreveu ? 'já há texto escrito.' : 'ainda em branco.'}{' '}
          <span className="italic">O texto só aparece na correção, depois da entrega.</span>
        </p>
      )}
    </div>
  )
}

interface LinhaProps {
  participante: ParticipanteAoVivo
  prova: Exam
  provaId: string
  exigeAssinatura: boolean
  agora: number
  expandida: boolean
  aoAlternar: (userId: string) => void
}

function LinhaBase({
  participante,
  prova,
  provaId,
  exigeAssinatura,
  agora,
  expandida,
  aoAlternar,
}: LinhaProps) {
  const estado = estadoDoParticipante(participante, agora)

  /*
   * A prova como ESTA pessoa a vê.
   *
   * Só é montada quando a linha abre — embaralhar as alternativas de todas as
   * questões para as 60 linhas fechadas seria trabalho jogado fora a cada
   * retrato. A semente é a mesma do aluno (`examId:userId`), então a letra que
   * aparece aqui é exatamente a letra que ele leu na tela.
   */
  const questaoDoAluno = useMemo(() => {
    if (!expandida || !participante.questaoAtual) return null

    const { questaoId, indice } = participante.questaoAtual
    const montada = montarProvaParaAluno(prova.questions || [], sementeDaProva(provaId, participante.userId), {
      embaralharQuestoes: !!prova.shuffleQuestions,
      embaralharAlternativas: !!prova.shuffleAlternatives,
    })

    // Pelo id primeiro: a ordem gravada no rascunho é a verdade sobre o que a
    // pessoa viu, e ela pode divergir da reconstruída se a prova mudou de
    // configuração no meio da aplicação.
    const porId = questaoId ? montada.questions.find((q) => q.id === questaoId) : undefined
    return porId || montada.questions[indice] || null
  }, [expandida, participante.questaoAtual, participante.userId, prova, provaId])

  const nome = participante.nomeDeclarado || participante.nome || 'Sem nome'
  const nomeDaConta = participante.nome && participante.nome !== nome ? participante.nome : null
  const questao = participante.questaoAtual

  return (
    <li className="rounded-xl border border-border/50 bg-background/60 overflow-hidden">
      <button
        type="button"
        onClick={() => aoAlternar(participante.userId)}
        aria-expanded={expandida}
        className="w-full text-left px-3 py-2.5 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-medium text-sm truncate">{nome}</span>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold',
                  CORES_DO_ESTADO[estado],
                )}
              >
                {estado === 'respondendo' && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
                {ROTULO_DO_ESTADO[estado]}
              </span>
              {participante.assinou ? (
                <span
                  className="inline-flex items-center gap-1 rounded bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700 dark:text-violet-300"
                  title={`Assinou ${hora(participante.assinadoEm)}`}
                >
                  <PenLine className="h-3 w-3" />
                  Assinou
                </span>
              ) : (
                exigeAssinatura && (
                  <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="h-3 w-3" />
                    Sem assinatura
                  </span>
                )
              )}
              {participante.retomadasUsadas > 0 && (
                <span className="rounded bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700 dark:text-orange-300">
                  retomou
                </span>
              )}
            </div>

            <p className="mt-0.5 text-xs text-muted-foreground truncate">
              {nomeDaConta && <span>{nomeDaConta} · </span>}
              {participante.entregouEm
                ? `Entregou ${hora(participante.entregouEm)}`
                : questao
                  ? `Questão ${questao.numero} de ${participante.totalQuestoes} · ${participante.respondidas} respondida(s) · ${haQuantoTempo(participante.ultimoSinalEm, agora)}`
                  : `Entrou ${hora(participante.entrouEm)} · aguardando o início`}
            </p>
          </div>

          {!participante.entregouEm && questao && (
            <div className="shrink-0 text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Questão
              </p>
              <p className="text-xl font-bold leading-none tabular-nums">{questao.numero}</p>
            </div>
          )}

          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
              expandida && 'rotate-180',
            )}
          />
        </div>
      </button>

      {expandida && (
        <div className="border-t border-border/50 bg-muted/20 p-3 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {[
              { rotulo: 'Entrou', valor: hora(participante.entrouEm) },
              { rotulo: 'Assinou', valor: hora(participante.assinadoEm) },
              { rotulo: 'Começou', valor: hora(participante.iniciouEm) },
              {
                rotulo: participante.entregouEm ? 'Entregou' : 'Último sinal',
                valor: hora(participante.entregouEm || participante.ultimoSinalEm),
              },
            ].map((item) => (
              <div key={item.rotulo} className="rounded-lg border border-border/40 bg-background/60 p-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {item.rotulo}
                </p>
                <p className="font-mono tabular-nums text-sm mt-0.5">{item.valor}</p>
              </div>
            ))}
          </div>

          {participante.assinou && (
            <div>
              <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">
                Assinatura digital
              </p>
              <AssinaturaDoAluno provaId={provaId} userId={participante.userId} />
            </div>
          )}

          {questao ? (
            <QuestaoDoAluno
              questao={questaoDoAluno}
              numero={questao.numero}
              total={participante.totalQuestoes}
              marcada={questao.marcada}
              escreveu={questao.escreveu}
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              Esta pessoa passou pelo portão e ainda não começou a responder — não há questão em
              andamento.
            </p>
          )}
        </div>
      )}
    </li>
  )
}

const Linha = memo(LinhaBase)

export function PainelAoVivo({ prova, onFechar }: Props) {
  const [expandida, setExpandida] = useState<string | null>(null)

  const provaId = prova?._id ? String(prova._id) : null

  /*
   * O relógio da lista com a prova: além do batimento de 30 s, ele desperta no
   * milissegundo de cada marco. É o que faz o painel trocar de fase — e o
   * ciclo de leitura religar — no instante em que o portão abre.
   */
  const agoraLocal = useRelogioDaLista(prova)
  /*
   * `jaEntrou: true` porque esta tela olha a PROVA, não uma pessoa.
   *
   * Com `false`, uma prova em pleno andamento cujo portão já fechou apareceria
   * como "Portões fechados" — que é a verdade sobre quem está do lado de fora,
   * e a mentira sobre a sala cheia que o painel está mostrando. O estado do
   * portão continua visível na linha do tempo logo abaixo, onde ele é uma
   * informação e não um rótulo.
   */
  const janela = useMemo(
    () => resolverJanelaDaProva(prova, new Date(agoraLocal), { jaEntrou: true }),
    [prova, agoraLocal],
  )

  const acompanhamento = useAcompanhamentoAoVivo(provaId, prova ? janela.fase : null, !!prova)
  const {
    retrato,
    carregando,
    erro,
    pausado,
    paradoPorOcio,
    alternarPausa,
    atualizarAgora,
    cadencia,
    leituras,
    relogioDoServidor,
  } = acompanhamento

  // Fechar o painel devolve a expansão ao estado inicial: reabrir noutra prova
  // com uma linha aberta de outra sala não faria sentido nenhum.
  useEffect(() => {
    if (!prova) setExpandida(null)
  }, [prova])

  const alternarLinha = useCallback((userId: string) => {
    setExpandida((atual) => (atual === userId ? null : userId))
  }, [])

  if (!prova || !provaId) return null

  /*
   * `horariosDaProva` e não `marcosDaJanela`: os dois ordenam pelo relógio,
   * mas este descarta o marco de portão que só repete o horário da prova. Numa
   * prova sem portão próprio, os quatro marcos virariam dois pares idênticos
   * ("Portão abre 14:00" / "Prova começa 14:00") — informação duplicada lida
   * como configuração estranha.
   */
  const marcos = horariosDaProva(prova, new Date(agoraLocal), { jaEntrou: true })
  const marcoAtual = marcos.find((m) => m.eOProximo) ?? null
  const comSala = temSalaDeEspera(prova)
  const resumo = retrato?.resumo
  const agoraDoServidor = relogioDoServidor()

  return (
    <Dialog open onOpenChange={(aberto) => { if (!aberto) onFechar() }}>
      <DialogContent className="max-w-4xl w-[min(56rem,95vw)] p-0">
        {/* ── Cabeçalho ─────────────────────────────────────────────── */}
        <div className="sticky top-0 z-10 border-b border-border/60 bg-background/95 backdrop-blur px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold truncate">{prova.title}</h2>
                <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs font-medium">
                  {janela.fase === 'em-andamento' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                  {ROTULO_DA_FASE[janela.fase]}
                </span>
              </div>
              {/*
                A cadência e a contagem de leituras ficam à vista porque o
                custo desta tela é literalmente o número de vezes que ela
                pergunta. Escondê-lo transformaria uma aba esquecida num gasto
                invisível — e é justamente o gasto invisível que este painel
                foi desenhado para não ter.
              */}
              <p className="text-xs text-muted-foreground mt-0.5">
                Acompanhamento ao vivo
                {cadencia
                  ? ` · a cada ${Math.round(cadencia / 1000)}s`
                  : paradoPorOcio
                    ? ' · parado por falta de novidade'
                    : pausado
                      ? ' · só quando você pedir'
                      : ' · sem atualização automática nesta fase'}
                {leituras > 0 && ` · ${leituras} leitura${leituras > 1 ? 's' : ''}`}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={alternarPausa}
                title={
                  pausado
                    ? 'Voltar a atualizar sozinho'
                    : 'Parar de atualizar sozinho — o painel passa a ler só quando você pedir'
                }
              >
                {pausado ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={atualizarAgora} disabled={carregando} title="Atualizar agora">
                <RefreshCw className={cn('h-4 w-4', carregando && 'animate-spin')} />
              </Button>
              <Button variant="ghost" size="sm" onClick={onFechar} title="Fechar">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* ── O relógio da prova ──────────────────────────────────── */}
          <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-muted/50 to-background p-4">
            {marcoAtual ? (
              <div className="text-center space-y-1">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {marcoAtual.rotulo} em
                </p>
                <ContagemRegressiva alvo={marcoAtual.quando.getTime()} />
                <p className="text-xs text-muted-foreground">{marcoAtual.texto}</p>
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                Todos os horários desta prova já passaram.
              </p>
            )}

            {/* A linha do tempo em ordem de relógio — ver marcosDaJanela. */}
            <div
              className={cn(
                'mt-3 grid gap-2',
                marcos.length > 2 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2',
              )}
            >
              {marcos.map((marco, i) => (
                <div
                  key={`${marco.rotulo}-${i}`}
                  className={cn(
                    'rounded-lg border px-2 py-1.5 text-center',
                    marco.eOProximo
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : marco.jaPassou
                        ? 'border-border/40 bg-muted/40 opacity-60'
                        : 'border-border/40 bg-background/40',
                  )}
                >
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    {marco.rotulo}
                  </p>
                  <p className="text-xs font-mono tabular-nums mt-0.5">
                    {marco.quando.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>

            {!comSala && (
              <p className="mt-2 text-[11px] text-muted-foreground text-center">
                Esta prova não tem sala de espera: os portões abrem junto com o início.
              </p>
            )}
          </div>

          {/* ── Os números ──────────────────────────────────────────── */}
          {resumo && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              <Numero rotulo="Entraram" valor={resumo.entraram} />
              {retrato?.assinaturaDisponivel && (
                <Numero
                  rotulo="Assinaram"
                  valor={resumo.assinaram}
                  total={resumo.entraram}
                  cor={
                    retrato.assinaturaObrigatoria && resumo.assinaram < resumo.entraram
                      ? 'text-amber-600 dark:text-amber-400'
                      : undefined
                  }
                />
              )}
              <Numero rotulo="Começaram" valor={resumo.comecaram} />
              <Numero
                rotulo="Respondendo"
                valor={resumo.respondendo}
                cor="text-emerald-600 dark:text-emerald-400"
              />
              <Numero
                rotulo="Parados"
                valor={resumo.parados + resumo.sumiram}
                cor={resumo.parados + resumo.sumiram > 0 ? 'text-amber-600 dark:text-amber-400' : undefined}
              />
              <Numero rotulo="Entregaram" valor={resumo.entregaram} />
            </div>
          )}

          {/*
            O ciclo desistiu sozinho.
            
            Meia hora sem uma única mudança não é um palpite sobre o admin: é um
            fato sobre a sala. Enquanto alguém responde, o rascunho se move a
            cada 12 segundos e o retrato muda junto — trinta minutos idênticos
            significam que não há ninguém do outro lado.
          */}
          {paradoPorOcio && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/40 p-3">
              <div className="text-sm">
                <p className="font-medium">O painel parou de consultar sozinho.</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Nada mudou nesta sala nos últimos 30 minutos. O retrato abaixo continua valendo.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={atualizarAgora}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retomar
              </Button>
            </div>
          )}

          {erro && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <div>
                <p className="text-rose-700 dark:text-rose-300">{erro}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  O painel volta a tentar sozinho, com intervalo crescente. Os dados abaixo são do
                  último retrato que chegou.
                </p>
              </div>
            </div>
          )}

          {/* ── A lista ─────────────────────────────────────────────── */}
          {!retrato && carregando ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Lendo o andamento da prova…
            </div>
          ) : retrato && retrato.participantes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 py-10 text-center">
              <Users className="h-7 w-7 mx-auto mb-2 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">
                {janela.fase === 'antes-do-portao'
                  ? 'Os portões ainda não abriram — ninguém pode entrar.'
                  : 'Ninguém passou pelo portão desta prova até agora.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {retrato?.participantes.map((participante) => (
                <Linha
                  key={participante.userId}
                  participante={participante}
                  prova={prova}
                  provaId={provaId}
                  exigeAssinatura={!!retrato?.assinaturaObrigatoria}
                  agora={agoraDoServidor}
                  expandida={expandida === participante.userId}
                  aoAlternar={alternarLinha}
                />
              ))}
            </ul>
          )}

          {retrato?.truncado && (
            <p className="text-xs text-muted-foreground text-center">
              A lista mostra as primeiras 500 pessoas desta prova.
            </p>
          )}

          <p className="flex items-start justify-center gap-1.5 text-[11px] text-muted-foreground text-center">
            <Eye className="h-3 w-3 mt-0.5 shrink-0" />
            <span>
              O andamento vem do rascunho que a prova grava a cada 12 segundos — é essa a resolução
              máxima do que aparece aqui. O painel só consulta com esta janela aberta e a aba à
              vista, afrouxa sozinho quando nada muda e para de vez depois de 30 minutos parados.
            </span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
