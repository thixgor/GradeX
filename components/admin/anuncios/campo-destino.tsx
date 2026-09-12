'use client'

/**
 * Campo de destino do anúncio.
 *
 * O ponto do componente é tornar o destino INTERNO o caminho fácil: procurar um
 * material, um produto da loja, uma aula ou uma área do site e deixar a URL ser
 * montada aqui. Digitar a URL na mão levava a dois problemas crônicos — link
 * absoluto do próprio site (que abria aba nova e tirava a pessoa do app) e link
 * quebrado, descoberto só depois que a campanha já estava no ar.
 *
 * O link externo continua disponível, mas como a segunda opção.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  Box,
  Check,
  ExternalLink,
  Layers,
  Loader2,
  Search,
  Store,
  Ticket,
  Video,
  X,
  type LucideIcon,
} from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ANUNCIO_DESTINO_LABEL,
  isInternalPath,
  isValidNavigationUrl,
  type AnuncioDestino,
  type AnuncioDestinoTipo,
} from '@/lib/anuncio-destinos'
import { cn } from '@/lib/utils'

interface DestinoSugerido {
  id: string
  tipo: AnuncioDestinoTipo
  titulo: string
  subtitulo?: string
  trilha?: string
  href: string
  refId?: string
}

const ICONE_POR_TIPO: Record<AnuncioDestinoTipo, LucideIcon> = {
  material: BookOpen,
  pacote: Box,
  produto: Store,
  aula: Video,
  rifa: Ticket,
  pagina: Layers,
  externo: ExternalLink,
}

const FILTROS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Tudo' },
  { value: 'material', label: 'Materiais' },
  { value: 'pacote', label: 'Pacotes' },
  { value: 'produto', label: 'Loja' },
  { value: 'aula', label: 'Aulas' },
  { value: 'rifa', label: 'Rifas' },
  { value: 'pagina', label: 'Partes do site' },
]

interface CampoDestinoProps {
  label: string
  helper?: string
  value: string
  destino?: AnuncioDestino
  onChange: (href: string, destino?: AnuncioDestino) => void
  /** Campo opcional (botão do modal): permite deixar vazio. */
  opcional?: boolean
}

/**
 * O modo (interno/externo) é estado local inicializado pelo que está salvo. Quem
 * usa o componente deve passar uma `key` que mude junto com o anúncio editado,
 * para que abrir outro anúncio recomece o campo no modo certo.
 */
export function CampoDestino({ label, helper, value, destino, onChange, opcional }: CampoDestinoProps) {
  const [modo, setModo] = useState<'interno' | 'externo'>(
    destino?.tipo === 'externo' || (!!value && !isInternalPath(value)) ? 'externo' : 'interno',
  )
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState('')
  const [itens, setItens] = useState<DestinoSugerido[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [caminhoManual, setCaminhoManual] = useState(false)

  const pedidoRef = useRef(0)

  useEffect(() => {
    if (modo !== 'interno') return

    const controller = new AbortController()
    const pedido = ++pedidoRef.current
    const timer = window.setTimeout(async () => {
      setCarregando(true)
      setErro(null)
      try {
        const params = new URLSearchParams()
        if (busca.trim()) params.set('q', busca.trim())
        if (filtro) params.set('tipo', filtro)

        const res = await fetch(`/api/admin/anuncios/destinos?${params.toString()}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!res.ok) throw new Error('Não foi possível buscar destinos')

        const data = await res.json()
        // Resposta de uma busca já abandonada não pode sobrescrever a atual.
        if (pedido === pedidoRef.current) {
          setItens(Array.isArray(data.itens) ? data.itens : [])
        }
      } catch (error) {
        if ((error as Error)?.name === 'AbortError') return
        if (pedido === pedidoRef.current) {
          setErro(error instanceof Error ? error.message : 'Erro ao buscar destinos')
          setItens([])
        }
      } finally {
        if (pedido === pedidoRef.current) setCarregando(false)
      }
    }, busca.trim() ? 300 : 0)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [busca, filtro, modo])

  const selecionado = useMemo(() => {
    if (!value) return null
    if (!isInternalPath(value)) return null
    return {
      rotulo: destino?.rotulo || value,
      tipo: destino?.tipo ?? 'pagina',
      href: value,
    }
  }, [destino?.rotulo, destino?.tipo, value])

  const escolher = useCallback(
    (item: DestinoSugerido) => {
      onChange(item.href, { tipo: item.tipo, rotulo: item.titulo, refId: item.refId })
    },
    [onChange],
  )

  const limpar = useCallback(() => onChange('', undefined), [onChange])

  const urlExternaInvalida = modo === 'externo' && !!value.trim() && !isValidNavigationUrl(value)

  return (
    <div className="space-y-3">
      <div>
        <Label>
          {label} {opcional ? <span className="font-normal text-muted-foreground">(opcional)</span> : '*'}
        </Label>
        {helper && <p className="mt-1 text-xs text-muted-foreground">{helper}</p>}
      </div>

      <div className="flex flex-wrap gap-1">
        <ModoBotao
          ativo={modo === 'interno'}
          onClick={() => setModo('interno')}
          titulo="Dentro da plataforma"
          descricao="Abre sem sair do app"
        />
        <ModoBotao
          ativo={modo === 'externo'}
          onClick={() => setModo('externo')}
          titulo="Link externo"
          descricao="Abre outro site"
        />
      </div>

      {modo === 'interno' ? (
        <div className="space-y-3">
          {selecionado ? (
            <div className="flex items-center gap-2 rounded-lg border border-[#468152]/35 bg-[#468152]/8 p-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#468152]/15 text-[#468152]">
                <Check className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{selecionado.rotulo}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {ANUNCIO_DESTINO_LABEL[selecionado.tipo]} · {selecionado.href}
                </p>
              </div>
              <button
                type="button"
                onClick={limpar}
                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
                aria-label="Remover destino"
                title="Remover destino"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          <div className="flex items-center gap-2 rounded-lg border bg-background/70 px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar material, pacote, produto, aula ou área do site"
              className="border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {carregando && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />}
          </div>

          <div className="flex flex-wrap gap-1">
            {FILTROS.map((item) => (
              <button
                key={item.value || 'tudo'}
                type="button"
                onClick={() => setFiltro(item.value)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-[11px] font-bold transition',
                  filtro === item.value
                    ? 'bg-[#468152] text-white shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border bg-background/50 p-1">
            {erro ? (
              <p className="p-3 text-sm text-red-500">{erro}</p>
            ) : itens.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">
                {carregando ? 'Buscando...' : 'Nenhum destino encontrado.'}
              </p>
            ) : (
              itens.map((item) => {
                const Icone = ICONE_POR_TIPO[item.tipo]
                const ativo = item.href === value
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => escolher(item)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg p-2 text-left transition',
                      ativo ? 'bg-[#468152]/12' : 'hover:bg-muted/70',
                    )}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icone className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{item.titulo}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.trilha || ANUNCIO_DESTINO_LABEL[item.tipo]}
                        {item.subtitulo ? ` · ${item.subtitulo}` : ''}
                      </span>
                    </span>
                    {ativo && <Check className="h-4 w-4 shrink-0 text-[#468152]" />}
                  </button>
                )
              })
            )}
          </div>

          <button
            type="button"
            onClick={() => setCaminhoManual((current) => !current)}
            className="text-xs font-semibold text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            {caminhoManual ? 'Ocultar caminho manual' : 'Informar um caminho manualmente'}
          </button>

          {caminhoManual && (
            <div className="space-y-1.5">
              <Input
                value={isInternalPath(value) ? value : ''}
                onChange={(event) =>
                  onChange(event.target.value, {
                    tipo: destino?.tipo && destino.tipo !== 'externo' ? destino.tipo : 'pagina',
                    rotulo: destino?.rotulo,
                  })
                }
                placeholder="/materiais?tab=loja"
              />
              <p className="text-xs text-muted-foreground">
                Precisa começar com / — é um caminho deste site, não um endereço completo.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          <Input
            value={value}
            onChange={(event) => onChange(event.target.value, { tipo: 'externo' })}
            placeholder="https://exemplo.com/pagina"
          />
          <p className={cn('text-xs', urlExternaInvalida ? 'font-semibold text-red-500' : 'text-muted-foreground')}>
            {urlExternaInvalida
              ? 'Endereço inválido. Use http(s), mailto: ou tel:.'
              : 'Use apenas para páginas fora da plataforma — elas abrem em outra aba.'}
          </p>
        </div>
      )}
    </div>
  )
}

function ModoBotao({
  ativo,
  onClick,
  titulo,
  descricao,
}: {
  ativo: boolean
  onClick: () => void
  titulo: string
  descricao: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 rounded-lg border px-3 py-2 text-left transition',
        ativo
          ? 'border-[#468152] bg-[#468152]/10'
          : 'border-border bg-background/60 hover:bg-muted/60',
      )}
    >
      <span className="block text-xs font-bold">{titulo}</span>
      <span className="block text-[11px] text-muted-foreground">{descricao}</span>
    </button>
  )
}
