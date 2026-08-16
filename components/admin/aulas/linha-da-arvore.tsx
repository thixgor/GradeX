'use client'

import { memo } from 'react'
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  FolderTree,
  GripVertical,
  Layers,
  Link2,
  MoreVertical,
  Pencil,
  PlayCircle,
  Plus,
  Trash2,
  UserRound,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FILHOS_PERMITIDOS,
  ROTULO_DO_TIPO,
  type NoDaArvore,
  type TipoDeNo,
} from '@/lib/aulas/arvore-admin'
import { estaVazia, selosDeAcesso, situacaoDaAula } from '@/lib/aulas/situacao'
import { cn } from '@/lib/utils'

/**
 * Uma linha da árvore do painel (§4, §5, §28, §29, §30).
 *
 * Cada linha responde três coisas de relance — o que é, em que estado está e o
 * que dá para fazer com ela — sem que o admin precise abrir nada. É o que
 * transforma a tela de uma lista em um mapa.
 *
 * **Sobre arrastar e soltar.** Usamos os eventos nativos de arraste do HTML, e
 * não uma biblioteca. Eles não existem em toque: no celular, arrastar é rolar a
 * página, e nenhum truque de `touchmove` melhora isso sem sequestrar a rolagem.
 * Por isso toda reordenação também está nos botões ↑ ↓ e no menu "Mover para".
 * Arrastar é o atalho de quem está no computador; os botões são o caminho que
 * funciona em qualquer lugar — inclusive para quem navega por teclado.
 */

export type ZonaDeSolta = 'antes' | 'dentro' | 'depois'

const ICONE_DO_TIPO: Record<TipoDeNo, typeof BookOpen> = {
  setor: BookOpen,
  topico: FolderTree,
  subtopico: FolderTree,
  modulo: Layers,
  submodulo: Layers,
  aula: PlayCircle,
}

const CLASSE_DO_TOM: Record<string, string> = {
  ok: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  neutro: 'bg-muted text-muted-foreground',
  atencao: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  perigo: 'bg-destructive/15 text-destructive',
  destaque: 'bg-primary/15 text-primary',
}

function Selo({ tom, children }: { tom: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex flex-none items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold leading-tight',
        CLASSE_DO_TOM[tom] || CLASSE_DO_TOM.neutro,
      )}
    >
      {children}
    </span>
  )
}

export interface AcoesDaLinha {
  aoAlternarAberto: (id: string) => void
  aoSelecionar: (no: NoDaArvore, marcado: boolean) => void
  aoAdicionar: (pai: NoDaArvore, tipo: TipoDeNo) => void
  aoRenomear: (no: NoDaArvore) => void
  aoDuplicar: (no: NoDaArvore) => void
  aoAlternarVisibilidade: (no: NoDaArvore) => void
  aoExcluir: (no: NoDaArvore) => void
  aoEditarAula: (no: NoDaArvore) => void
  aoVerComoAluno: (no: NoDaArvore) => void
  aoCopiarLink: (no: NoDaArvore) => void
  aoMoverNaOrdem: (no: NoDaArvore, direcao: -1 | 1) => void
  aoIniciarArraste: (no: NoDaArvore) => void
  /** Chamado a cada passagem por cima — é o que acende a linha de inserção. */
  aoPassarPorCima: (alvo: NoDaArvore, zona: ZonaDeSolta) => void
  aoSoltarEm: (alvo: NoDaArvore, zona: ZonaDeSolta) => void
  aoTerminarArraste: () => void
}

export interface EstadoDaLinha {
  aberto: boolean
  selecionado: boolean
  arrastando: boolean
  /** Zona destacada enquanto algo passa por cima desta linha. */
  zonaAtiva: ZonaDeSolta | null
  /** Pode subir/descer? Falso nas pontas da lista de irmãos. */
  podeSubir: boolean
  podeDescer: boolean
  /** O nó em arraste caberia aqui dentro? Bloqueia solta impossível. */
  aceitaSolta: boolean
}

/**
 * Decide a zona de solta pela posição do cursor dentro da linha.
 *
 * As bordas (25% de cima e de baixo) reordenam entre irmãos; o miolo move para
 * dentro. Sem essa divisão, a única solta possível seria "dentro", e reordenar
 * exigiria um segundo gesto — que é como a maioria dos painéis erra isto.
 */
export function zonaPelaPosicao(evento: React.DragEvent, aceitaDentro: boolean): ZonaDeSolta {
  const caixa = evento.currentTarget.getBoundingClientRect()
  const proporcao = (evento.clientY - caixa.top) / Math.max(caixa.height, 1)
  if (!aceitaDentro) return proporcao < 0.5 ? 'antes' : 'depois'
  if (proporcao < 0.28) return 'antes'
  if (proporcao > 0.72) return 'depois'
  return 'dentro'
}

export const LinhaDaArvore = memo(function LinhaDaArvore({
  no,
  estado,
  acoes,
}: {
  no: NoDaArvore
  estado: EstadoDaLinha
  acoes: AcoesDaLinha
}) {
  const Icone = ICONE_DO_TIPO[no.tipo]
  const ehAula = no.tipo === 'aula'
  const temFilhos = no.filhos.length > 0
  const filhosPossiveis = FILHOS_PERMITIDOS[no.tipo]

  const situacao = ehAula ? situacaoDaAula(no.dados as any) : null
  const acessos = ehAula ? selosDeAcesso(no.dados as any) : []
  const vazia = ehAula && estaVazia(no.dados as any)

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.stopPropagation()
        // `setData` é obrigatório no Firefox — sem ele o arraste nem começa.
        e.dataTransfer.setData('text/plain', no.id)
        e.dataTransfer.effectAllowed = 'move'
        acoes.aoIniciarArraste(no)
      }}
      onDragEnd={acoes.aoTerminarArraste}
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
        e.dataTransfer.dropEffect = 'move'
        acoes.aoPassarPorCima(no, zonaPelaPosicao(e, estado.aceitaSolta))
      }}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        acoes.aoSoltarEm(no, zonaPelaPosicao(e, estado.aceitaSolta))
      }}
      className={cn(
        'group relative flex items-center gap-1.5 rounded-lg border border-transparent py-1.5 pr-1 transition',
        'hover:border-border hover:bg-muted/40',
        estado.selecionado && 'border-primary/40 bg-primary/5',
        estado.arrastando && 'opacity-40',
        // A linha de inserção mostra ONDE o item vai cair. Sem ela, arrastar é
        // um chute: solta-se às cegas e confere-se depois.
        estado.zonaAtiva === 'antes' && 'border-t-2 border-t-primary',
        estado.zonaAtiva === 'depois' && 'border-b-2 border-b-primary',
        estado.zonaAtiva === 'dentro' && 'border-primary bg-primary/10 ring-1 ring-primary/40',
      )}
    >
      <GripVertical
        className="h-4 w-4 flex-none cursor-grab text-muted-foreground/40 opacity-0 transition group-hover:opacity-100 active:cursor-grabbing"
        aria-hidden
      />

      <input
        type="checkbox"
        checked={estado.selecionado}
        onChange={(e) => acoes.aoSelecionar(no, e.target.checked)}
        aria-label={`Selecionar ${no.nome}`}
        className="h-3.5 w-3.5 flex-none accent-primary"
      />

      {temFilhos ? (
        <button
          type="button"
          onClick={() => acoes.aoAlternarAberto(no.id)}
          aria-label={estado.aberto ? 'Recolher' : 'Expandir'}
          aria-expanded={estado.aberto}
          className="flex h-6 w-6 flex-none items-center justify-center rounded text-muted-foreground transition hover:bg-muted"
        >
          {estado.aberto ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      ) : (
        <span className="h-6 w-6 flex-none" />
      )}

      <Icone
        className={cn(
          'h-4 w-4 flex-none',
          ehAula ? 'text-primary' : 'text-muted-foreground',
        )}
      />

      {/*
        No celular o nome fica numa linha e os selos em outra. Na primeira
        versão tudo disputava a mesma linha, e os selos venciam: títulos viravam
        "E…" e "Di…", e uma aula chegou a aparecer sem título nenhum — só o selo.
        O nome é a única coisa que a linha não pode perder.
      */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
        <button
          type="button"
          onClick={() => (ehAula ? acoes.aoEditarAula(no) : acoes.aoAlternarAberto(no.id))}
          className="min-w-0 truncate text-left text-sm transition hover:text-primary sm:flex-1"
          title={no.nome}
        >
          <span className={cn('font-medium', no.oculta && 'text-muted-foreground line-through')}>
            {no.nome}
          </span>
        </button>

        <div className="flex flex-wrap items-center gap-1 sm:flex-none sm:flex-nowrap">
          {vazia ? <Selo tom="perigo">Sem conteúdo</Selo> : null}
          {situacao ? (
            <Selo tom={situacao.tom}>
              {situacao.rotulo}
              {situacao.detalhe ? ` · ${situacao.detalhe}` : ''}
            </Selo>
          ) : null}
          {acessos.slice(0, 2).map((selo, i) => (
            <span key={i} className="hidden sm:inline">
              <Selo tom={selo.tom}>{selo.rotulo}</Selo>
            </span>
          ))}
          {!ehAula ? (
            <span className="whitespace-nowrap text-[11px] tabular-nums text-muted-foreground">
              {no.totalAulas} {no.totalAulas === 1 ? 'aula' : 'aulas'}
            </span>
          ) : null}
          {!ehAula && no.oculta ? <Selo tom="neutro">Oculto</Selo> : null}
        </div>
      </div>

      {/* Subir/descer: o caminho que funciona no celular e no teclado. */}
      {/*
        No toque não existe `hover`: esconder as setas atrás dele deixaria o
        celular sem NENHUMA forma de reordenar, já que arrastar também não
        funciona lá. Elas só se escondem onde há mouse.
      */}
      <div className="flex flex-none items-center transition sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
        <button
          type="button"
          disabled={!estado.podeSubir}
          onClick={() => acoes.aoMoverNaOrdem(no, -1)}
          aria-label={`Subir ${no.nome}`}
          className="flex h-6 w-6 items-center justify-center rounded text-xs text-muted-foreground transition hover:bg-muted disabled:opacity-25"
        >
          ↑
        </button>
        <button
          type="button"
          disabled={!estado.podeDescer}
          onClick={() => acoes.aoMoverNaOrdem(no, 1)}
          aria-label={`Descer ${no.nome}`}
          className="flex h-6 w-6 items-center justify-center rounded text-xs text-muted-foreground transition hover:bg-muted disabled:opacity-25"
        >
          ↓
        </button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Ações de ${no.nome}`}
            className="flex h-7 w-7 flex-none items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          {filhosPossiveis.length > 0 ? (
            <>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar dentro
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {filhosPossiveis.map((tipo) => (
                    <DropdownMenuItem key={tipo} onClick={() => acoes.aoAdicionar(no, tipo)}>
                      {ROTULO_DO_TIPO[tipo]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
            </>
          ) : null}

          {ehAula ? (
            <DropdownMenuItem onClick={() => acoes.aoEditarAula(no)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar aula
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => acoes.aoRenomear(no)}>
              <Pencil className="mr-2 h-4 w-4" />
              Renomear
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={() => acoes.aoDuplicar(no)}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicar{ehAula ? '' : ' com o conteúdo'}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => acoes.aoAlternarVisibilidade(no)}>
            {no.oculta ? (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Publicar
              </>
            ) : (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Ocultar
              </>
            )}
          </DropdownMenuItem>

          {ehAula ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => acoes.aoVerComoAluno(no)}>
                <UserRound className="mr-2 h-4 w-4" />
                Visualizar como aluno
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => acoes.aoCopiarLink(no)}>
                <Link2 className="mr-2 h-4 w-4" />
                Copiar link
              </DropdownMenuItem>
            </>
          ) : null}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => acoes.aoExcluir(no)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
})
