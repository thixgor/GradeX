'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronRight, FolderTree, Layers, Minus, Search, X } from 'lucide-react'
import {
  filtrarArvore,
  montarArvore,
  topicosDoRamo,
  totalDaArvore,
  type ModuloDaArvore,
  type RamoDaArvore,
} from '@/lib/banco/hierarquia'
import { cn } from '@/lib/utils'

/**
 * O catálogo do Banco de Questões, visível de uma vez.
 *
 * O que existia antes eram quatro `<select>` encadeados — Período, depois
 * Módulo, depois Tópico, depois Subtópico — em que cada um só ganhava opções
 * depois do clique no anterior. Não dava para VER o catálogo, só adivinhá-lo:
 * para descobrir se havia questões de arritmia era preciso escolher um período
 * ao acaso e ir abrindo caixinhas.
 *
 * Aqui a árvore inteira está na tela, com a contagem em cada nível, e a busca
 * filtra sem ir ao servidor. Escolher um tópico é um clique, e o que está
 * escolhido fica marcado — inclusive quando a busca esconde a linha.
 *
 * ## O que mudou na segunda passada
 *
 * 1. **Cada segmento do caminho é um nível que recolhe.** A importação grava o
 *    caminho inteiro no nome do tópico ("1º PERÍODO › HAM I"), e a árvore
 *    mostrava isso como está: uma linha por caminho completo, doze seguidas
 *    começando por "1º PERÍODO ›", todas cortadas na largura da coluna
 *    justamente na parte que as diferencia. Agora "1º PERÍODO" é uma pasta e
 *    "HAM I" está dentro dela. Idem para os subtópicos, que depois da
 *    importação são o TÍTULO DE CADA PROVA — um módulo com 40 provas despejava
 *    40 linhas de uma vez ao ser aberto.
 *
 * 2. **A contagem virou peso visível.** Além do número, cada módulo mostra uma
 *    barra proporcional à fatia dele no banco. É o que responde de relance
 *    "onde está o volume de questões" — coisa que uma coluna de números
 *    alinhados não responde sem que a pessoa some tudo de cabeça.
 *
 * 3. **A escolha ficou explícita.** O item marcado leva uma caixa com o traço
 *    da confirmação e uma barra de cor na lateral, não só um fundo esverdeado:
 *    cor sozinha não é estado para quem não distingue verde de cinza.
 */

export interface SelecaoDaArvore {
  moduloIds: string[]
  topicoIds: string[]
  subtopicoIds: string[]
}

export const SELECAO_VAZIA: SelecaoDaArvore = { moduloIds: [], topicoIds: [], subtopicoIds: [] }

export function contarSelecionados(selecao: SelecaoDaArvore): number {
  return selecao.moduloIds.length + selecao.topicoIds.length + selecao.subtopicoIds.length
}

export function ArvoreDoBanco({
  modulos,
  topicos,
  subtopicos,
  selecao,
  onChange,
  carregando = false,
}: {
  modulos: { _id: string; nome: string; totalQuestoes?: number }[]
  topicos: { _id: string; moduloId: string; nome: string; totalQuestoes?: number }[]
  subtopicos: { _id: string; topicoId: string; nome: string; totalQuestoes?: number }[]
  selecao: SelecaoDaArvore
  onChange: (selecao: SelecaoDaArvore) => void
  carregando?: boolean
}) {
  const [busca, setBusca] = useState('')
  const [abertos, setAbertos] = useState<string[]>([])

  const arvore = useMemo(
    () => montarArvore(modulos, topicos, subtopicos),
    [modulos, topicos, subtopicos],
  )
  const visivel = useMemo(() => filtrarArvore(arvore, busca), [arvore, busca])
  const buscando = busca.trim().length >= 2

  // A barra de peso é relativa ao MAIOR módulo, não ao total. Contra o total,
  // um banco com trinta módulos daria barras de 3% em todos e nenhuma
  // comparação seria possível.
  const maiorModulo = useMemo(
    () => Math.max(1, ...arvore.map((m) => m.totalQuestoes)),
    [arvore],
  )
  const totalGeral = useMemo(() => totalDaArvore(arvore), [arvore])

  /**
   * Liga ou desliga um conjunto de ids de uma vez.
   *
   * Um ramo intermediário ("1º PERÍODO") não tem id próprio — ele é os tópicos
   * que estão embaixo dele. Marcar o ramo tem que marcar todos, e desmarcar só
   * quando todos já estão marcados; senão clicar num período parcialmente
   * escolhido apagaria a escolha em vez de completá-la.
   */
  function alternarVarios(campo: keyof SelecaoDaArvore, ids: string[]) {
    if (ids.length === 0) return
    const atual = selecao[campo]
    const todosMarcados = ids.every((id) => atual.includes(id))
    onChange({
      ...selecao,
      [campo]: todosMarcados
        ? atual.filter((id) => !ids.includes(id))
        : Array.from(new Set([...atual, ...ids])),
    })
  }

  function alternar(campo: keyof SelecaoDaArvore, id: string) {
    alternarVarios(campo, [id])
  }

  function alternarAberto(id: string) {
    setAbertos((a) => (a.includes(id) ? a.filter((i) => i !== id) : [...a, id]))
  }

  const totalEscolhido = contarSelecionados(selecao)

  if (carregando) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-10 rounded-xl skeleton-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* ── Cabeçalho ──────────────────────────────────────────────────── */}
      <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          <FolderTree className="h-3.5 w-3.5" />
          Catálogo
        </p>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-semibold tabular-nums text-muted-foreground">
          {totalGeral.toLocaleString('pt-BR')}
        </span>
      </div>

      {/* ── Busca ──────────────────────────────────────────────────────── */}
      <div className="relative mb-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar módulo ou tópico…"
          className="h-10 w-full rounded-xl border border-border bg-background/70 pl-9 pr-8 text-[13px] outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
        />
        {busca ? (
          <button
            type="button"
            onClick={() => setBusca('')}
            aria-label="Limpar busca"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-3 w-3" />
          </button>
        ) : null}
      </div>

      {totalEscolhido > 0 ? (
        <button
          type="button"
          onClick={() => onChange(SELECAO_VAZIA)}
          className="mb-2 flex items-center gap-1.5 self-start rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary transition hover:bg-primary/15"
        >
          {totalEscolhido} {totalEscolhido === 1 ? 'assunto escolhido' : 'assuntos escolhidos'}
          <X className="h-3 w-3" />
        </button>
      ) : null}

      {/* ── Árvore ─────────────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
        {visivel.length === 0 ? (
          <p className="px-2 py-8 text-center text-xs text-muted-foreground">
            {buscando ? 'Nenhum assunto com esse nome.' : 'O banco ainda não tem assuntos cadastrados.'}
          </p>
        ) : (
          visivel.map((modulo) => (
            <Modulo
              key={modulo._id}
              modulo={modulo}
              peso={modulo.totalQuestoes / maiorModulo}
              // Durante a busca tudo nasce aberto: esconder o resultado atrás de
              // mais um clique desfaz o motivo de ter buscado.
              buscando={buscando}
              abertos={abertos}
              onAlternarAberto={alternarAberto}
              selecao={selecao}
              onEscolher={alternar}
              onEscolherVarios={alternarVarios}
            />
          ))
        )}
      </div>

      {buscando ? (
        <p className="mt-2 text-[11px] text-muted-foreground">
          {totalDaArvore(visivel).toLocaleString('pt-BR')} questões nos assuntos encontrados
        </p>
      ) : null}
    </div>
  )
}

function Modulo({
  modulo,
  peso,
  buscando,
  abertos,
  onAlternarAberto,
  selecao,
  onEscolher,
  onEscolherVarios,
}: {
  modulo: ModuloDaArvore
  /** Fatia do módulo em relação ao maior módulo, de 0 a 1. */
  peso: number
  buscando: boolean
  abertos: string[]
  onAlternarAberto: (id: string) => void
  selecao: SelecaoDaArvore
  onEscolher: (campo: keyof SelecaoDaArvore, id: string) => void
  onEscolherVarios: (campo: keyof SelecaoDaArvore, ids: string[]) => void
}) {
  const escolhido = selecao.moduloIds.includes(modulo._id)
  const aberto = buscando || abertos.includes(modulo._id)

  return (
    <div>
      <div className="flex items-stretch gap-0.5">
        <button
          type="button"
          onClick={() => onAlternarAberto(modulo._id)}
          aria-label={aberto ? `Recolher ${modulo.nome}` : `Expandir ${modulo.nome}`}
          aria-expanded={aberto}
          disabled={modulo.ramos.length === 0}
          className="flex w-6 flex-none items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted disabled:opacity-25"
        >
          <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', aberto && 'rotate-90')} />
        </button>

        <button
          type="button"
          onClick={() => onEscolher('moduloIds', modulo._id)}
          aria-pressed={escolhido}
          className={cn(
            'group relative flex min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-xl px-2 py-2 text-left transition active:scale-[0.99]',
            escolhido
              ? 'bg-primary/12 text-primary shadow-[inset_2px_0_0_hsl(var(--primary))]'
              : 'hover:bg-muted',
          )}
        >
          <Marca estado={escolhido ? 'marcado' : 'vazio'} icone={<Layers className="h-3 w-3" />} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold">{modulo.nome}</span>
            {/* A barra é o peso do módulo no banco. Fica sob o nome, fina, para
                ser lida de relance sem competir com o texto. */}
            <span className="mt-1 block h-[3px] w-full overflow-hidden rounded-full bg-muted">
              <span
                className={cn(
                  'block h-full rounded-full transition-[width] duration-500',
                  escolhido ? 'bg-primary' : 'bg-primary/35',
                )}
                style={{ width: `${Math.max(4, Math.round(peso * 100))}%` }}
              />
            </span>
          </span>
          <span className="flex-none self-start text-[11px] font-semibold tabular-nums opacity-70">
            {modulo.totalQuestoes.toLocaleString('pt-BR')}
          </span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {aberto ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="ml-3 overflow-hidden border-l border-border pl-1"
          >
            {modulo.ramos.map((ramo) => (
              <Ramo
                key={ramo.chave}
                ramo={ramo}
                // A chave do ramo já carrega o caminho; prefixar com o módulo
                // impede que "1º PERÍODO" de dois módulos abra junto.
                prefixo={modulo._id}
                buscando={buscando}
                abertos={abertos}
                onAlternarAberto={onAlternarAberto}
                selecao={selecao}
                onEscolher={onEscolher}
                onEscolherVarios={onEscolherVarios}
              />
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

/**
 * Um segmento do caminho — recursivo, porque o caminho pode ter a profundidade
 * que a organização das provas tiver.
 *
 * O ramo é sempre selecionável, tenha ele um tópico próprio ou não: marcar
 * "1º PERÍODO" marca os tópicos todos que estão embaixo. Quando parte deles já
 * está marcada, a caixa mostra o traço parcial — dizer "marcado" ali seria
 * mentir sobre o que o filtro está fazendo.
 */
function Ramo({
  ramo,
  prefixo,
  buscando,
  abertos,
  onAlternarAberto,
  selecao,
  onEscolher,
  onEscolherVarios,
}: {
  ramo: RamoDaArvore
  prefixo: string
  buscando: boolean
  abertos: string[]
  onAlternarAberto: (id: string) => void
  selecao: SelecaoDaArvore
  onEscolher: (campo: keyof SelecaoDaArvore, id: string) => void
  onEscolherVarios: (campo: keyof SelecaoDaArvore, ids: string[]) => void
}) {
  const chave = `${prefixo}/${ramo.chave}`
  const subtopicos = ramo.topico?.subtopicos || []
  const temFilhos = ramo.ramos.length > 0 || subtopicos.length > 0
  const aberto = buscando || abertos.includes(chave)

  const ids = useMemo(() => topicosDoRamo(ramo), [ramo])
  const marcados = ids.filter((id) => selecao.topicoIds.includes(id)).length
  const estado = marcados === 0 ? 'vazio' : marcados === ids.length ? 'marcado' : 'parcial'

  return (
    <div>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onAlternarAberto(chave)}
          aria-label={aberto ? `Recolher ${ramo.nome}` : `Expandir ${ramo.nome}`}
          aria-expanded={aberto}
          disabled={!temFilhos}
          className="flex h-8 w-5 flex-none items-center justify-center rounded text-muted-foreground transition hover:bg-muted disabled:opacity-0"
        >
          <ChevronRight className={cn('h-3 w-3 transition-transform', aberto && 'rotate-90')} />
        </button>

        <button
          type="button"
          onClick={() => onEscolherVarios('topicoIds', ids)}
          aria-pressed={estado === 'marcado'}
          className={cn(
            'flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left transition active:scale-[0.99]',
            estado !== 'vazio'
              ? 'bg-primary/12 text-primary shadow-[inset_2px_0_0_hsl(var(--primary))]'
              : 'hover:bg-muted',
          )}
        >
          <Marca estado={estado} />
          <span className="min-w-0 flex-1 truncate text-[12.5px]">{ramo.nome}</span>
          {/* Quantos itens estão escondidos aí dentro. Some ao abrir: com o
              conteúdo à vista, o número vira ruído ao lado da contagem real. */}
          {temFilhos && !aberto ? (
            <span className="flex-none rounded bg-muted px-1 text-[10px] tabular-nums text-muted-foreground">
              {ramo.ramos.length || subtopicos.length}
            </span>
          ) : null}
          <span className="flex-none text-[11px] tabular-nums opacity-60">
            {ramo.totalQuestoes.toLocaleString('pt-BR')}
          </span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {aberto && temFilhos ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="ml-3 overflow-hidden border-l border-border pl-1"
          >
            {ramo.ramos.map((filho) => (
              <Ramo
                key={filho.chave}
                ramo={filho}
                prefixo={prefixo}
                buscando={buscando}
                abertos={abertos}
                onAlternarAberto={onAlternarAberto}
                selecao={selecao}
                onEscolher={onEscolher}
                onEscolherVarios={onEscolherVarios}
              />
            ))}

            {subtopicos.map((sub) => {
              const subEscolhido = selecao.subtopicoIds.includes(sub._id)
              return (
                <button
                  key={sub._id}
                  type="button"
                  onClick={() => onEscolher('subtopicoIds', sub._id)}
                  aria-pressed={subEscolhido}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition active:scale-[0.99]',
                    subEscolhido
                      ? 'bg-primary/12 text-primary shadow-[inset_2px_0_0_hsl(var(--primary))]'
                      : 'hover:bg-muted',
                  )}
                >
                  <Marca estado={subEscolhido ? 'marcado' : 'vazio'} />
                  <span
                    className={cn(
                      'min-w-0 flex-1 truncate text-[12px]',
                      subEscolhido ? '' : 'text-muted-foreground',
                    )}
                  >
                    {sub.nome}
                  </span>
                  <span className="flex-none text-[10.5px] tabular-nums opacity-60">
                    {sub.totalQuestoes.toLocaleString('pt-BR')}
                  </span>
                </button>
              )
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

/**
 * A caixinha de escolha, em três estados.
 *
 * Marcada, ela mostra o traço da confirmação; parcialmente marcada, um traço
 * horizontal. O estado não é só a cor de fundo — quem não distingue verde de
 * cinza precisa ver a diferença mesmo assim, e "alguns filhos escolhidos"
 * precisa se distinguir de "todos".
 */
function Marca({
  estado,
  icone,
}: {
  estado: 'vazio' | 'parcial' | 'marcado'
  icone?: React.ReactNode
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex h-4 w-4 flex-none items-center justify-center rounded-[5px] border transition',
        estado === 'marcado'
          ? 'border-primary bg-primary text-primary-foreground'
          : estado === 'parcial'
            ? 'border-primary bg-primary/20 text-primary'
            : 'border-border text-muted-foreground/60',
      )}
    >
      {estado === 'marcado' ? (
        <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
      ) : estado === 'parcial' ? (
        <Minus className="h-2.5 w-2.5" strokeWidth={3.5} />
      ) : (
        icone
      )}
    </span>
  )
}
