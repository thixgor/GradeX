'use client'

/**
 * `/admin/cargos` — o catálogo de "o que uma conta pode ser".
 *
 * Antes desta tela, criar um cargo era uma tarefa de programação: o Quest
 * exigiu tocar em nove arquivos, e nenhum deles continha decisão de engenharia
 * — era tudo decisão de produto esperando deploy. Aqui o cargo é um documento,
 * e criar um leva o tempo de digitar o nome e marcar o que ele abre.
 *
 * ## O que a tela precisa deixar claro
 *
 * 1. **Quem manda em quem.** Um cargo com o bloco modular ligado é regido por
 *    ele; um cargo de fábrica com o bloco desligado continua no caminho
 *    legado, que é código. A tela diz qual dos dois vale, cargo a cargo — sem
 *    isso, o admin marca uma área e não entende por que nada muda.
 * 2. **Quantas contas dependem disto.** Apagar um cargo com 40 alunos dentro é
 *    diferente de apagar um recém-criado, e o número tem que estar na frente
 *    do botão, não numa outra tela.
 * 3. **O que é intocável.** Os quatro cargos de fábrica são nomeados
 *    diretamente no código (`isPlusAccount`, filtros de receita, cupons) e não
 *    podem ser apagados. A tela mostra isso como um fato, não como um erro que
 *    só aparece ao tentar.
 */

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  Crown,
  GraduationCap,
  Infinity as InfinityIcon,
  Loader2,
  Lock,
  Plus,
  Save,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Timer,
  Trash2,
  Users,
  Zap,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ToastAlert } from '@/components/ui/toast-alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PlanPermissionsEditor } from '@/components/admin/plan-permissions-editor'
import {
  CARGO_CORES,
  CARGO_ICONES,
  cargoEmBranco,
  classesDaCor,
  slugDeCargo,
  validarIdDeCargo,
  type CargoDefinicao,
  type CargoIcone,
} from '@/lib/cargos'
import {
  PLAN_FEATURE_DEFINITIONS,
  descreverRegra,
  permissoesPadraoParaCargo,
  regraDaArea,
} from '@/lib/plan-entitlements'
import { limparCacheDeCargos } from '@/hooks/use-cargos'
import { cn } from '@/lib/utils'

/** Tradução de `CargoIcone` para componente. Fica aqui, não em `lib/cargos`. */
const ICONES: Record<CargoIcone, React.ComponentType<{ className?: string }> | null> = {
  none: null,
  crown: Crown,
  sparkles: Sparkles,
  target: Target,
  timer: Timer,
  star: Star,
  zap: Zap,
  shield: Shield,
  book: BookOpen,
  graduation: GraduationCap,
  infinity: InfinityIcon,
}

function SeloDoCargo({ cargo, className }: { cargo: CargoDefinicao; className?: string }) {
  const Icone = ICONES[cargo.icone]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r px-2.5 py-1 text-xs font-semibold text-white',
        classesDaCor(cargo.cor),
        className,
      )}
    >
      {Icone ? <Icone className="h-3.5 w-3.5" /> : null}
      {cargo.nome || cargo.id || 'Sem nome'}
    </span>
  )
}

export default function AdminCargosPage() {
  const router = useRouter()

  const [cargos, setCargos] = useState<CargoDefinicao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sujo, setSujo] = useState(false)
  const [abertos, setAbertos] = useState<Set<string>>(new Set())
  const [contagem, setContagem] = useState<Record<string, number>>({})
  const [orfaos, setOrfaos] = useState<string[]>([])
  const [paraApagar, setParaApagar] = useState<CargoDefinicao | null>(null)

  const [toastAberto, setToastAberto] = useState(false)
  const [toastTexto, setToastTexto] = useState('')
  const [toastTipo, setToastTipo] = useState<'success' | 'error'>('success')

  const avisar = useCallback((texto: string, tipo: 'success' | 'error' = 'success') => {
    setToastTexto(texto)
    setToastTipo(tipo)
    setToastAberto(true)
  }, [])

  const carregar = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/cargos', { cache: 'no-store' })
      if (!res.ok) throw new Error('Falha ao carregar')
      const dados = await res.json()
      setCargos(dados.cargos || [])
      setSujo(false)
    } catch {
      avisar('Não foi possível carregar os cargos.', 'error')
    } finally {
      setCarregando(false)
    }
  }, [avisar])

  /** Quantas contas usam cada cargo. Consulta separada porque é cara. */
  const carregarContagem = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/cargos', { method: 'POST' })
      if (!res.ok) return
      const dados = await res.json()
      setContagem(dados.porCargo || {})
      setOrfaos(dados.orfaos || [])
    } catch {
      /* a contagem é informativa; a tela funciona sem ela */
    }
  }, [])

  useEffect(() => {
    carregar()
    carregarContagem()
  }, [carregar, carregarContagem])

  /*
   * Aviso do navegador ao sair com edição pendente.
   *
   * A tela guarda tudo em memória até o "Salvar" — é o que permite reordenar,
   * criar e ajustar vários cargos numa tacada só, gravando uma vez. O preço é
   * que fechar a aba no meio perde o trabalho, e isto é o que avisa.
   */
  useEffect(() => {
    if (!sujo) return
    const aoSair = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', aoSair)
    return () => window.removeEventListener('beforeunload', aoSair)
  }, [sujo])

  function atualizar(indice: number, patch: Partial<CargoDefinicao>) {
    setCargos(anteriores => anteriores.map((c, i) => (i === indice ? { ...c, ...patch } : c)))
    setSujo(true)
  }

  function criar() {
    const novo = cargoEmBranco(cargos.length + 1)
    setCargos(anteriores => [...anteriores, novo])
    setAbertos(anteriores => new Set(anteriores).add(''))
    setSujo(true)
  }

  function apagar(cargo: CargoDefinicao) {
    setCargos(anteriores => anteriores.filter(c => c !== cargo))
    setParaApagar(null)
    setSujo(true)
  }

  function alternarAberto(chave: string) {
    setAbertos(anteriores => {
      const proximo = new Set(anteriores)
      if (proximo.has(chave)) proximo.delete(chave)
      else proximo.add(chave)
      return proximo
    })
  }

  async function salvar() {
    // Valida antes de mandar: o servidor recusa igual, mas a mensagem local
    // aponta o cargo na tela, e a do servidor chega como um texto solto.
    const vistos: string[] = []
    for (const cargo of cargos) {
      const id = slugDeCargo(cargo.id || cargo.nome)
      const veredicto = validarIdDeCargo(id, vistos)
      if (!veredicto.valido) {
        avisar(`"${cargo.nome || cargo.id || 'Cargo sem nome'}": ${veredicto.motivo}`, 'error')
        return
      }
      vistos.push(id)
    }

    setSalvando(true)
    try {
      const res = await fetch('/api/admin/cargos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // O id de um cargo novo só existe como texto digitado até aqui; é neste
        // ponto que ele vira slug de verdade.
        body: JSON.stringify({
          cargos: cargos.map(c => ({ ...c, id: slugDeCargo(c.id || c.nome) })),
        }),
      })
      const dados = await res.json()
      if (!res.ok) throw new Error(dados.error || 'Falha ao salvar')

      setCargos(dados.cargos || [])
      setSujo(false)
      // O hook do cliente guarda o registro em memória de módulo; sem isto, as
      // outras telas continuariam mostrando a lista antiga até um recarregamento.
      limparCacheDeCargos()
      carregarContagem()
      avisar(dados.aviso || 'Cargos salvos.', dados.aviso ? 'error' : 'success')
    } catch (erro: any) {
      avisar(erro?.message || 'Erro ao salvar os cargos.', 'error')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <AppShell headerTitle="Cargos" headerSubtitle="Carregando…">
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell headerTitle="Cargos" headerSubtitle="O que uma conta pode ser">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.push('/admin')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao painel
        </Button>

        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Cargos
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              O cargo é o que a conta <em>é</em> — o que ela abre na plataforma antes de qualquer
              compra avulsa. Crie um para vender uma parte do acervo sozinha, como o Quest faz com
              o Banco de Questões.
            </p>
          </div>
          <div className="flex flex-none flex-wrap gap-2">
            <Button variant="outline" onClick={criar}>
              <Plus className="mr-2 h-4 w-4" /> Novo cargo
            </Button>
            <Button onClick={salvar} disabled={salvando || !sujo}>
              {salvando ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {sujo ? 'Salvar alterações' : 'Tudo salvo'}
            </Button>
          </div>
        </div>

        {orfaos.length > 0 && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="min-w-0 text-sm">
              <p className="font-semibold">Contas com cargo que não existe mais</p>
              <p className="mt-1 leading-relaxed text-muted-foreground">
                {orfaos.join(', ')} — essas contas caem no comportamento gratuito até serem
                movidas para um cargo do registro. Recrie o cargo com o mesmo id para devolver o
                acesso, ou ajuste as contas em <strong>Usuários</strong>.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {cargos.map((cargo, indice) => {
            const chave = cargo.id || `novo-${indice}`
            const aberto = abertos.has(chave)
            const contas = contagem[cargo.id] || 0
            /*
             * O que este cargo abre — a pergunta que a lista existe para
             * responder, e que precisa ter resposta em toda linha.
             *
             * Com o bloco ligado, sai dele. Desligado (todo cargo de fábrica),
             * sai do padrão do cargo, que é o retrato do que o código já
             * concede. A versão anterior mostrava, nesse caso, uma frase
             * explicando que o registro não valia ali — repetida quatro vezes,
             * ela empurrava para baixo justamente o que interessa.
             */
            const fonteDasAreas = cargo.permissoes.ativo
              ? cargo.permissoes
              : permissoesPadraoParaCargo(cargo.id)
            const liberadas = PLAN_FEATURE_DEFINITIONS.filter(
              d => regraDaArea(fonteDasAreas, d.key).liberado,
            )
            const idPrevisto = slugDeCargo(cargo.id || cargo.nome)

            return (
              <Card key={chave} className={cn(aberto && 'ring-1 ring-primary/30')}>
                <CardContent className="p-0">
                  {/* ── Cabeçalho ─────────────────────────────────────── */}
                  <button
                    type="button"
                    onClick={() => alternarAberto(chave)}
                    className="flex w-full items-center gap-3 p-4 text-left"
                  >
                    <SeloDoCargo cargo={cargo} className="flex-none" />

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-[11px] text-muted-foreground">
                        {idPrevisto || 'sem-id'}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {cargo.descricao || 'Sem descrição'}
                      </p>
                    </div>

                    <div className="hidden flex-none items-center gap-2 sm:flex">
                      {cargo.pago && (
                        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                          Pago
                        </span>
                      )}
                      {cargo.embutido && (
                        <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                          De fábrica
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground tabular-nums">
                        <Users className="h-3 w-3" />
                        {contas}
                      </span>
                    </div>

                    <ChevronDown
                      className={cn(
                        'h-4 w-4 flex-none text-muted-foreground transition-transform',
                        aberto && 'rotate-180',
                      )}
                    />
                  </button>

                  {/* Resumo do que o cargo abre, sempre visível: é a resposta
                      que a tela existe para dar, e escondê-la atrás do clique
                      transformaria a lista num monte de nomes iguais. */}
                  {!aberto && (
                    <div className="flex flex-wrap items-center gap-1.5 border-t px-4 py-2.5">
                      {liberadas.length ? (
                        liberadas.map(d => (
                          <span
                            key={d.key}
                            className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                            title={descreverRegra(fonteDasAreas, d.key)}
                          >
                            {d.label}
                          </span>
                        ))
                      ) : (
                        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Lock className="h-3 w-3" />
                          Não abre nenhuma área
                        </span>
                      )}
                      {/* De onde veio a resposta acima. Curto de propósito: é
                          contexto, não o assunto da linha. */}
                      {!cargo.permissoes.ativo && (
                        <span
                          className="ml-auto rounded border border-dashed px-1.5 py-0.5 text-[10px] text-muted-foreground"
                          title="Este cargo é regido pelo comportamento embutido no código. Abra e ligue as permissões para modular área por área."
                        >
                          padrão do código
                        </span>
                      )}
                    </div>
                  )}

                  {/* ── Edição ────────────────────────────────────────── */}
                  {aberto && (
                    <div className="space-y-4 border-t p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label className="text-xs">Nome</Label>
                          <Input
                            value={cargo.nome}
                            maxLength={40}
                            placeholder="Ex.: Manual Pro"
                            onChange={e => atualizar(indice, { nome: e.target.value })}
                          />
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            Como aparece para o aluno, no selo da conta.
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs">Id</Label>
                          <Input
                            value={cargo.id}
                            disabled={!!cargo.embutido}
                            placeholder={slugDeCargo(cargo.nome) || 'gerado-do-nome'}
                            onChange={e => atualizar(indice, { id: e.target.value })}
                          />
                          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                            {cargo.embutido ? (
                              <>
                                Cargo de fábrica: o id é citado direto no código e não pode mudar.
                              </>
                            ) : (
                              <>
                                Gravado em cada conta. Mudar o id de um cargo já atribuído deixa
                                essas contas órfãs — trate como definitivo.
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Descrição</Label>
                        <Textarea
                          value={cargo.descricao || ''}
                          maxLength={200}
                          rows={2}
                          placeholder="Uma linha sobre o que este cargo entrega."
                          onChange={e => atualizar(indice, { descricao: e.target.value })}
                        />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label className="text-xs">Cor do selo</Label>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {CARGO_CORES.map(cor => (
                              <button
                                key={cor.id}
                                type="button"
                                aria-label={cor.label}
                                title={cor.label}
                                onClick={() => atualizar(indice, { cor: cor.id })}
                                className={cn(
                                  'h-7 w-7 rounded-md bg-gradient-to-br ring-offset-2 ring-offset-background transition',
                                  cor.classes,
                                  cargo.cor === cor.id && 'ring-2 ring-primary',
                                )}
                              >
                                {cargo.cor === cor.id && (
                                  <Check className="mx-auto h-4 w-4 text-white" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Ícone do selo</Label>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {CARGO_ICONES.map(nome => {
                              const Icone = ICONES[nome]
                              return (
                                <button
                                  key={nome}
                                  type="button"
                                  aria-label={nome}
                                  title={nome === 'none' ? 'Sem ícone' : nome}
                                  onClick={() => atualizar(indice, { icone: nome })}
                                  className={cn(
                                    'flex h-7 w-7 items-center justify-center rounded-md border transition',
                                    cargo.icone === nome
                                      ? 'border-primary bg-primary/10 text-primary'
                                      : 'border-border text-muted-foreground hover:bg-muted',
                                  )}
                                >
                                  {Icone ? (
                                    <Icone className="h-3.5 w-3.5" />
                                  ) : (
                                    <span className="text-[10px]">—</span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      {/* ── Cargo pago ────────────────────────────────── */}
                      <div className="flex items-start justify-between gap-3 rounded-lg border border-dashed bg-muted/20 p-3">
                        <div className="min-w-0">
                          <Label className="text-xs font-semibold">Cargo pago</Label>
                          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                            Cargo pago vence pela data de <code>premiumExpiresAt</code>, é
                            rebaixado pelo cron quando o prazo passa e entra nas cotas antiabuso do
                            Plus+ Guard. Deixe desligado para um rótulo sem cobrança (cortesia,
                            monitoria) — esse não vence sozinho.
                            {cargo.embutido && (
                              <>
                                {' '}
                                <strong>De fábrica:</strong> este valor é estrutural e não muda
                                aqui.
                              </>
                            )}
                          </p>
                        </div>
                        <Switch
                          checked={cargo.pago}
                          disabled={!!cargo.embutido}
                          onCheckedChange={pago => atualizar(indice, { pago })}
                        />
                      </div>

                      {/* ── Permissões ────────────────────────────────── */}
                      {cargo.embutido && !cargo.permissoes.ativo && (
                        <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                          <p className="text-[11px] leading-relaxed">
                            Hoje o <strong>{cargo.nome}</strong> é regido pelo comportamento
                            embutido no código, e não por este bloco. Ligar as permissões faz o que
                            estiver marcado abaixo passar a ser a única régua para todas as contas
                            com este cargo — inclusive as que já existem. As caixas já vêm marcadas
                            com o que ele libera hoje, então ligar sem mexer em nada não muda
                            acesso de ninguém.
                          </p>
                        </div>
                      )}

                      <PlanPermissionsEditor
                        permissoes={cargo.permissoes}
                        role={cargo.id}
                        semInterruptor={!cargo.embutido}
                        titulo={`O que o ${cargo.nome || 'cargo'} abre`}
                        onChange={permissoes => atualizar(indice, { permissoes })}
                      />

                      {/* ── Apagar ────────────────────────────────────── */}
                      <div className="flex items-center justify-between gap-3 border-t pt-3">
                        <p className="text-[11px] text-muted-foreground">
                          {contas > 0 ? (
                            <>
                              <strong className="tabular-nums">{contas}</strong>{' '}
                              {contas === 1 ? 'conta usa' : 'contas usam'} este cargo.
                            </>
                          ) : (
                            'Nenhuma conta usa este cargo.'
                          )}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!!cargo.embutido}
                          onClick={() => setParaApagar(cargo)}
                          className="h-8 text-xs text-destructive hover:bg-destructive/10 disabled:text-muted-foreground"
                          title={
                            cargo.embutido
                              ? 'Cargos de fábrica não podem ser apagados'
                              : 'Apagar este cargo'
                          }
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Apagar
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground">
          Um cargo criado aqui já aparece para atribuir em <strong>Usuários</strong>, para vender
          em <strong>Configurações → Planos</strong> e para restringir um material em{' '}
          <strong>Materiais</strong>. Administradores nunca são limitados por cargo.
        </p>
      </div>

      {/* ── Confirmação de exclusão ───────────────────────────────────── */}
      <Dialog open={!!paraApagar} onOpenChange={aberto => !aberto && setParaApagar(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Apagar {paraApagar?.nome}?
            </DialogTitle>
            <DialogDescription className="pt-2 leading-relaxed">
              {contagem[paraApagar?.id || ''] ? (
                <>
                  <strong className="text-foreground tabular-nums">
                    {contagem[paraApagar?.id || '']}
                  </strong>{' '}
                  {contagem[paraApagar?.id || ''] === 1 ? 'conta está' : 'contas estão'} neste
                  cargo. Elas não são alteradas — continuam com o id gravado, mas sem um cargo que
                  o reconheça, e passam a se comportar como conta gratuita até serem movidas.
                </>
              ) : (
                <>
                  Nenhuma conta usa este cargo, então apagar não tira acesso de ninguém. Materiais
                  restritos a ele deixam de ter esse grupo.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setParaApagar(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => paraApagar && apagar(paraApagar)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Apagar cargo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ToastAlert
        open={toastAberto}
        onOpenChange={setToastAberto}
        message={toastTexto}
        type={toastTipo}
      />
    </AppShell>
  )
}
