'use client'

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'
import { CornerDownLeft, Loader2, Search, X } from 'lucide-react'

import { useAppShell } from '@/components/app-shell'
import { getSidebarIconComponent } from '@/components/sidebar-icon-map'
import { useLiteMode } from '@/hooks/use-lite-mode'
import { CATALOGO, filtrarPorAcesso } from '@/lib/busca-plataforma/catalogo'
import { criarBuscador, indexar, ranquear, type Resultado } from '@/lib/busca-plataforma/motor'
import { fatiarParaRealce, termosDaConsulta } from '@/lib/busca-plataforma/texto'
import { ROTULO_DO_GRUPO, type AcaoBusca, type GrupoBusca, type ItemBusca } from '@/lib/busca-plataforma/tipos'
import { cn } from '@/lib/utils'
import { useHistoricoBusca } from './use-historico-busca'

/**
 * Painel da busca global — a metade pesada.
 *
 * Vive em arquivo separado porque `components/busca/busca-global.tsx` o carrega
 * por `next/dynamic`: o catálogo da plataforma, o motor de ranqueamento e as
 * animações só descem para o aparelho quando alguém abre a busca de fato. A
 * dashboard é a tela mais visitada do app e não deveria pagar por isto na
 * primeira pintura.
 *
 * ## Como as duas metades se encaixam
 *
 * O que é ESTRUTURA (páginas, ações, famílias de ferramentas) mora num catálogo
 * estático e é ranqueado no próprio navegador: a lista aparece na mesma tecla,
 * sem rede, e continua funcionando com a conexão ruim. O que é CONTEÚDO vive no
 * banco e vem de `/api/busca`, com 200 ms de espera para não disparar uma
 * requisição por caractere, `AbortController` para que a resposta antiga nunca
 * ultrapasse a nova, e memória local por consulta — apagar uma letra volta para
 * um resultado que já está em mãos.
 *
 * Os dois lados passam pelo MESMO motor de pontuação, então as pontuações são
 * comparáveis e a lista final é uma só, ordenada por relevância de verdade — e
 * não "primeiro o local, depois o que a rede trouxer".
 */

/** Ordem de desempate entre grupos com a mesma pontuação máxima. */
const ORDEM_DO_GRUPO: GrupoBusca[] = ['acao', 'area', 'pagina', 'ferramenta', 'conteudo', 'conta', 'admin']

const MAX_POR_GRUPO = 6
const MAX_RESULTADOS = 32
const ESPERA_REDE_MS = 200

interface GrupoDeResultados {
  grupo: GrupoBusca
  itens: Resultado<ItemBusca>[]
  melhor: number
}

export function PainelDeBusca({
  onFechar,
  onAbrirTour,
}: {
  onFechar: () => void
  onAbrirTour?: () => void
}) {
  const router = useRouter()
  const { setTheme, resolvedTheme } = useTheme()
  const { liteMode, toggleLiteMode } = useLiteMode()
  const { isAdmin, sidebarSections, handleCreateExam, handleLogout } = useAppShell()
  const { recentes, historico, versao, registrarAbertura, registrarConsulta, esquecerRecentes } =
    useHistoricoBusca()

  const [consulta, setConsulta] = useState('')
  const [ativo, setAtivo] = useState(0)
  const [remotos, setRemotos] = useState<ItemBusca[]>([])
  const [carregando, setCarregando] = useState(false)
  const [falhouRede, setFalhouRede] = useState(false)

  const campoRef = useRef<HTMLInputElement>(null)
  const listaRef = useRef<HTMLDivElement>(null)
  /** Respostas da rede já obtidas nesta sessão de busca, por consulta. */
  const cacheRemoto = useRef(new Map<string, ItemBusca[]>())

  // `useDeferredValue`: em aparelho fraco, ranquear enquanto se digita competia
  // com o próprio cursor. Aqui a tecla aparece na hora e a lista alcança logo
  // depois, sem travar a digitação.
  const consultaAdiada = useDeferredValue(consulta)

  /* ── Catálogo visível para esta conta ── */
  const catalogo = useMemo(() => {
    const permitidos = filtrarPorAcesso(CATALOGO, { isAdmin, secoes: sidebarSections })
    return onAbrirTour ? permitidos : permitidos.filter(item => item.acao !== 'abrir-tour')
  }, [isAdmin, sidebarSections, onAbrirTour])

  const buscador = useMemo(() => criarBuscador(catalogo), [catalogo])

  /* ── Foco e travas de janela ── */
  useEffect(() => {
    campoRef.current?.focus()
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Esc na janela inteira, e não só no painel: se o foco escapar para o corpo
    // da página (acontece ao clicar no fundo), a tecla precisa continuar valendo.
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onFechar()
    }
    window.addEventListener('keydown', aoTeclar)

    return () => {
      document.body.style.overflow = overflowAnterior
      window.removeEventListener('keydown', aoTeclar)
    }
  }, [onFechar])

  /* ── Conteúdo do banco, com espera e cancelamento ── */
  useEffect(() => {
    const termo = consulta.trim()
    if (termo.length < 2) {
      setRemotos([])
      setCarregando(false)
      setFalhouRede(false)
      return
    }

    const emCache = cacheRemoto.current.get(termo.toLowerCase())
    if (emCache) {
      setRemotos(emCache)
      setCarregando(false)
      return
    }

    const controle = new AbortController()
    setCarregando(true)

    const espera = window.setTimeout(async () => {
      try {
        const resposta = await fetch(`/api/busca?q=${encodeURIComponent(termo)}`, {
          signal: controle.signal,
        })
        if (!resposta.ok) throw new Error(String(resposta.status))
        const dados = await resposta.json()
        const itens: ItemBusca[] = Array.isArray(dados?.itens) ? dados.itens : []
        cacheRemoto.current.set(termo.toLowerCase(), itens)
        setRemotos(itens)
        setFalhouRede(false)
      } catch (erro) {
        if ((erro as Error)?.name === 'AbortError') return
        // A busca não morre por causa da rede: o catálogo local continua
        // respondendo e o rodapé avisa que faltou o conteúdo do banco.
        setRemotos([])
        setFalhouRede(true)
      } finally {
        if (!controle.signal.aborted) setCarregando(false)
      }
    }, ESPERA_REDE_MS)

    return () => {
      window.clearTimeout(espera)
      controle.abort()
    }
  }, [consulta])

  /* ── Ranqueamento ── */
  const locais = useMemo(() => {
    if (consultaAdiada.trim().length === 0) return []
    return buscador.buscar(consultaAdiada, { historico, versao, limite: MAX_RESULTADOS })
  }, [buscador, consultaAdiada, historico, versao])

  const conteudo = useMemo(() => {
    if (consultaAdiada.trim().length === 0 || remotos.length === 0) return []
    return ranquear(indexar(remotos), consultaAdiada, { limite: MAX_RESULTADOS, historico })
  }, [remotos, consultaAdiada, historico])

  const resultados = useMemo(() => {
    const vistos = new Set<string>()
    return [...locais, ...conteudo]
      .sort((a, b) => b.pontos - a.pontos)
      .filter(r => {
        const chave = r.item.href ?? r.item.id
        if (vistos.has(chave)) return false
        vistos.add(chave)
        return true
      })
      .slice(0, MAX_RESULTADOS)
  }, [locais, conteudo])

  /**
   * Sugestões da tela vazia: o que você mais abre, completado pelas áreas de
   * maior prioridade. Uma dashboard que abre a busca com uma lista em branco
   * não ensina o que dá para procurar.
   */
  const sugestoes = useMemo(() => {
    const pontuar = (item: ItemBusca) =>
      (historico.aberturas?.[item.id] ?? 0) * 100 + (item.prioridade ?? 0)
    return [...catalogo]
      .filter(item => item.grupo === 'area' || item.grupo === 'acao' || (historico.aberturas?.[item.id] ?? 0) > 0)
      .sort((a, b) => pontuar(b) - pontuar(a))
      .slice(0, 8)
      .map(item => ({ item, pontos: 0, motivo: '' }))
  }, [catalogo, historico])

  const listagem = consultaAdiada.trim().length === 0 ? sugestoes : resultados

  const grupos = useMemo<GrupoDeResultados[]>(() => {
    const mapa = new Map<GrupoBusca, Resultado<ItemBusca>[]>()
    for (const resultado of listagem) {
      const atual = mapa.get(resultado.item.grupo)
      if (atual) {
        if (atual.length < MAX_POR_GRUPO) atual.push(resultado)
      } else {
        mapa.set(resultado.item.grupo, [resultado])
      }
    }

    // Grupos ordenados pelo melhor resultado que carregam. Fixar a ordem faria
    // um casamento exato de patologia aparecer abaixo de três páginas quaisquer.
    return Array.from(mapa.entries())
      .map(([grupo, itens]) => ({ grupo, itens, melhor: itens[0]?.pontos ?? 0 }))
      .sort(
        (a, b) =>
          b.melhor - a.melhor || ORDEM_DO_GRUPO.indexOf(a.grupo) - ORDEM_DO_GRUPO.indexOf(b.grupo),
      )
  }, [listagem])

  const plana = useMemo(() => grupos.flatMap(g => g.itens), [grupos])

  useEffect(() => {
    setAtivo(0)
  }, [consultaAdiada, remotos])

  // Aquece a rota do item selecionado: quando o Enter chegar, o destino já está
  // baixando. Só o item ativo — aquecer a lista inteira a cada seta seria pior
  // que não aquecer nada.
  useEffect(() => {
    const href = plana[ativo]?.item.href
    if (!href) return
    try {
      router.prefetch(href)
    } catch {
      // rota não prefetchável — o clique continua funcionando
    }
  }, [ativo, plana, router])

  useEffect(() => {
    const no = listaRef.current?.querySelector<HTMLElement>(`[data-indice="${ativo}"]`)
    no?.scrollIntoView({ block: 'nearest' })
  }, [ativo])

  const executarAcao = useCallback(
    (acao: AcaoBusca) => {
      switch (acao) {
        case 'criar-prova':
          handleCreateExam()
          break
        case 'alternar-tema':
          setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
          break
        case 'modo-lite':
          toggleLiteMode()
          break
        case 'abrir-tour':
          onAbrirTour?.()
          break
        case 'sair':
          handleLogout()
          break
      }
    },
    [handleCreateExam, handleLogout, onAbrirTour, resolvedTheme, setTheme, toggleLiteMode],
  )

  const abrir = useCallback(
    (item: ItemBusca) => {
      registrarAbertura(item.id)
      registrarConsulta(consulta)
      onFechar()
      if (item.acao) executarAcao(item.acao)
      else if (item.href) router.push(item.href)
    },
    [consulta, executarAcao, onFechar, registrarAbertura, registrarConsulta, router],
  )

  const aoTeclar = useCallback(
    (evento: React.KeyboardEvent) => {
      // Esc é tratado na janela inteira, no efeito de montagem.
      if (evento.key === 'ArrowDown') {
        evento.preventDefault()
        setAtivo(i => (plana.length === 0 ? 0 : (i + 1) % plana.length))
        return
      }
      if (evento.key === 'ArrowUp') {
        evento.preventDefault()
        setAtivo(i => (plana.length === 0 ? 0 : (i - 1 + plana.length) % plana.length))
        return
      }
      if (evento.key === 'Enter') {
        evento.preventDefault()
        const escolhido = plana[ativo]
        if (escolhido) abrir(escolhido.item)
      }
    },
    [abrir, ativo, plana],
  )

  const termos = useMemo(() => termosDaConsulta(consultaAdiada), [consultaAdiada])
  const vazio = consultaAdiada.trim().length > 0 && plana.length === 0 && !carregando

  const animacao = liteMode
    ? { initial: false as const, animate: {}, exit: {} }
    : {
        initial: { opacity: 0, y: -8, scale: 0.99 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -8, scale: 0.99 },
      }

  let indiceGlobal = -1

  return (
    <motion.div
      className="fixed inset-0 z-[120] flex items-start justify-center px-4 pt-[9vh] sm:px-6 sm:pt-[8vh]"
      initial={liteMode ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
    >
      <div className="busca-vidro-fundo absolute inset-0" onClick={onFechar} aria-hidden />

      {/* Retângulo flutuante em qualquer tela — no celular também. Encostado um
          pouco acima do meio de propósito: centralizado de verdade, o teclado
          virtual cobriria justamente o campo onde se digita. */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Busca da plataforma"
        {...animacao}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'busca-vidro relative z-10 flex w-full flex-col overflow-hidden',
          'max-h-[74dvh] rounded-3xl',
          'sm:max-h-[72vh] sm:w-[min(680px,94vw)] sm:rounded-[26px]',
        )}
        onKeyDown={aoTeclar}
      >
        {/* Campo */}
        <div className="busca-vidro-linha relative z-[1] flex items-center gap-3 border-b px-4 py-3.5 sm:px-5">
          <Search className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
          <input
            ref={campoRef}
            value={consulta}
            onChange={evento => setConsulta(evento.target.value)}
            placeholder="Buscar páginas, patologias, materiais, aulas, ferramentas…"
            aria-label="Buscar em toda a plataforma"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground/70"
          />
          {carregando && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />}
          {consulta.length > 0 && !carregando && (
            <button
              type="button"
              onClick={() => {
                setConsulta('')
                campoRef.current?.focus()
              }}
              aria-label="Limpar busca"
              className="rounded-md p-1 text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {/* No celular, com o teclado aberto, sobra pouca área do painel para
              tocar "fora" — então o fechar fica à vista. No desktop a mesma
              área vira a dica da tecla Esc. */}
          <button
            type="button"
            onClick={onFechar}
            className="shrink-0 text-sm font-medium text-primary transition active:opacity-70 sm:hidden"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar busca"
            className="busca-vidro-linha hidden rounded-md border px-1.5 py-0.5 font-clinical text-[10px] font-medium text-muted-foreground transition hover:text-foreground sm:block"
          >
            esc
          </button>
        </div>

        {/* Contagem anunciada por leitor de tela — a lista muda a cada tecla e
            sem isto a mudança é silenciosa para quem não vê a tela. */}
        <p aria-live="polite" className="sr-only">
          {consultaAdiada.trim().length === 0
            ? ''
            : `${plana.length} ${plana.length === 1 ? 'resultado' : 'resultados'} para ${consultaAdiada.trim()}`}
        </p>

        {/* Lista */}
        <div ref={listaRef} className="relative z-[1] min-h-0 flex-1 overflow-y-auto overscroll-contain py-2">
          {consultaAdiada.trim().length === 0 && recentes.length > 0 && (
            <section className="px-2 pb-1">
              <div className="flex items-center justify-between px-3 py-1.5">
                <h3 className="font-clinical text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Buscas recentes
                </h3>
                <button
                  type="button"
                  onClick={esquecerRecentes}
                  className="text-[11px] text-muted-foreground transition hover:text-foreground"
                >
                  limpar
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                {recentes.map(recente => (
                  <button
                    key={recente}
                    type="button"
                    onClick={() => {
                      setConsulta(recente)
                      campoRef.current?.focus()
                    }}
                    className="busca-vidro-linha rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                  >
                    {recente}
                  </button>
                ))}
              </div>
            </section>
          )}

          {grupos.map(({ grupo, itens }) => (
            <section key={grupo} className="px-2 pb-1">
              <h3 className="px-3 py-1.5 font-clinical text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {consultaAdiada.trim().length === 0 && grupo !== 'acao'
                  ? 'Sugestões'
                  : ROTULO_DO_GRUPO[grupo]}
              </h3>
              <ul>
                {itens.map(resultado => {
                  indiceGlobal += 1
                  const indice = indiceGlobal
                  return (
                    <LinhaDeResultado
                      key={resultado.item.id}
                      item={resultado.item}
                      indice={indice}
                      ativo={indice === ativo}
                      termos={termos}
                      onAtivar={() => setAtivo(indice)}
                      onEscolher={() => abrir(resultado.item)}
                    />
                  )
                })}
              </ul>
            </section>
          ))}

          {vazio && (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-medium text-foreground">
                Nada encontrado para “{consultaAdiada.trim()}”.
              </p>
              <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
                Tente uma palavra mais curta, o nome da área ou a sigla — a busca aceita erro de
                digitação, mas precisa de pelo menos um pedaço reconhecível.
              </p>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="busca-vidro-linha relative z-[1] flex items-center justify-between gap-3 border-t px-4 py-2.5 sm:px-5">
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="hidden items-center gap-1 sm:flex">
              <Tecla>↑</Tecla>
              <Tecla>↓</Tecla>
              navegar
            </span>
            <span className="flex items-center gap-1">
              <Tecla>
                <CornerDownLeft className="h-3 w-3" />
              </Tecla>
              abrir
            </span>
            <span className="hidden items-center gap-1 sm:flex">
              <Tecla>esc</Tecla>
              fechar
            </span>
          </div>
          <p className="truncate text-[11px] text-muted-foreground">
            {falhouRede
              ? 'Sem conexão com o conteúdo — mostrando só as páginas'
              : plana.length > 0
                ? `${plana.length} ${plana.length === 1 ? 'resultado' : 'resultados'}`
                : 'Busca em toda a plataforma'}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Tecla({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="busca-vidro-linha inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border px-1 font-clinical text-[10px] font-medium text-muted-foreground">
      {children}
    </kbd>
  )
}

function LinhaDeResultado({
  item,
  indice,
  ativo,
  termos,
  onAtivar,
  onEscolher,
}: {
  item: ItemBusca
  indice: number
  ativo: boolean
  termos: string[]
  onAtivar: () => void
  onEscolher: () => void
}) {
  const Icone = getSidebarIconComponent(item.icone)

  return (
    <li>
      <button
        type="button"
        data-indice={indice}
        onMouseMove={onAtivar}
        onFocus={onAtivar}
        onClick={onEscolher}
        aria-current={ativo || undefined}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
          ativo ? 'bg-primary/15 ring-1 ring-inset ring-primary/20' : 'hover:bg-foreground/[0.06]',
        )}
      >
        <span
          className={cn(
            'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors',
            ativo
              ? 'border-primary/30 bg-primary/20 text-primary'
              : 'border-white/40 bg-white/40 text-muted-foreground dark:border-white/10 dark:bg-white/[0.06]',
          )}
        >
          <Icone className="h-[18px] w-[18px]" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-foreground">
              <Realce texto={item.titulo} termos={termos} />
            </span>
            {item.etiqueta && (
              <span className="shrink-0 rounded-full bg-foreground/[0.07] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {item.etiqueta}
              </span>
            )}
          </span>
          {(item.subtitulo || item.trilha) && (
            <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              {item.trilha && <span className="shrink-0 truncate max-w-[45%]">{item.trilha}</span>}
              {item.trilha && item.subtitulo && <span className="text-muted-foreground/50">·</span>}
              {item.subtitulo && (
                <span className="truncate">
                  <Realce texto={item.subtitulo} termos={termos} />
                </span>
              )}
            </span>
          )}
        </span>

        {ativo && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-primary" />}
      </button>
    </li>
  )
}

/** Marca no texto original o pedaço que casou com a busca. */
function Realce({ texto, termos }: { texto: string; termos: string[] }) {
  const fatias = useMemo(() => fatiarParaRealce(texto, termos), [texto, termos])
  return (
    <>
      {fatias.map((fatia, i) =>
        fatia.realce ? (
          <mark key={i} className="bg-transparent font-semibold text-primary">
            {fatia.texto}
          </mark>
        ) : (
          <span key={i}>{fatia.texto}</span>
        ),
      )}
    </>
  )
}
