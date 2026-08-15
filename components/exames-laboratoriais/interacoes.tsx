'use client'

import { useCallback, useEffect, useId, useState, type ReactNode } from 'react'
import { ChevronDown, Star } from 'lucide-react'

/**
 * As ilhas de interação da seção.
 *
 * A regra que organiza este arquivo: o conteúdo é do servidor, o gesto é do
 * cliente. Cada componente aqui recebe conteúdo já renderizado como `children`
 * e adiciona apenas o comportamento — trocar de profundidade, abrir uma seção,
 * marcar um favorito. Nenhum texto clínico é reconstruído no navegador, o que
 * mantém o bundle pequeno mesmo nas fichas mais longas.
 */

/* ═══════════════════════ Níveis de profundidade ═══════════════════════ */

export type Nivel = 'resumo' | 'entenda' | 'aprofundar'

const ROTULOS: Record<Nivel, string> = {
  resumo: 'Resumo',
  entenda: 'Entenda',
  aprofundar: 'Aprofundar',
}

const DESCRICOES: Record<Nivel, string> = {
  resumo: 'O que é, em segundos',
  entenda: 'A explicação que basta para interpretar',
  aprofundar: 'Fisiologia, bioquímica e raciocínio clínico',
}

/**
 * As três distâncias do mesmo conteúdo.
 *
 * Não são três textos sobre o assunto: são a mesma explicação vista de mais
 * perto a cada aba. É esse desenho que permite ao conteúdo ser profundo sem
 * que a tela fique cansativa para quem só precisa conferir um valor entre um
 * paciente e outro.
 */
export function Profundidade({
  resumo,
  entenda,
  aprofundar,
  inicial = 'resumo',
}: {
  resumo: ReactNode
  entenda?: ReactNode
  aprofundar?: ReactNode
  inicial?: Nivel
}) {
  const disponiveis: Nivel[] = ['resumo', ...(entenda ? (['entenda'] as Nivel[]) : []), ...(aprofundar ? (['aprofundar'] as Nivel[]) : [])]
  const [nivel, setNivel] = useState<Nivel>(disponiveis.includes(inicial) ? inicial : 'resumo')
  const idBase = useId()

  if (disponiveis.length === 1) return <div className="prose-lab">{resumo}</div>

  return (
    <div>
      <div role="tablist" aria-label="Nível de profundidade" className="flex flex-wrap gap-1.5">
        {disponiveis.map((n) => {
          const ativo = n === nivel
          return (
            <button
              key={n}
              role="tab"
              id={`${idBase}-${n}`}
              aria-selected={ativo}
              aria-controls={`${idBase}-painel`}
              onClick={() => setNivel(n)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                ativo
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border bg-muted/40 text-muted-foreground hover:border-primary/25 hover:text-foreground'
              }`}
            >
              {ROTULOS[n]}
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">{DESCRICOES[nivel]}</p>
      <div id={`${idBase}-painel`} role="tabpanel" aria-labelledby={`${idBase}-${nivel}`} className="prose-lab mt-3">
        {nivel === 'resumo' && resumo}
        {nivel === 'entenda' && entenda}
        {nivel === 'aprofundar' && aprofundar}
      </div>
    </div>
  )
}

/* ═══════════════════════ Seção expansível ═══════════════════════ */

/**
 * Uma seção que abre e fecha.
 *
 * O conteúdo permanece no HTML mesmo fechado (apenas escondido por CSS), o que
 * garante que a busca do navegador e os leitores de tela o encontrem, e que um
 * link com âncora para dentro dele continue funcionando.
 */
export function Expansivel({
  titulo,
  detalhe,
  children,
  aberto = false,
  contagem,
  tom = 'neutro',
}: {
  titulo: string
  detalhe?: string
  children: ReactNode
  aberto?: boolean
  contagem?: number
  tom?: 'neutro' | 'alta' | 'baixa'
}) {
  const [ativo, setAtivo] = useState(aberto)
  const idBase = useId()

  const corDoTitulo =
    tom === 'alta' ? 'text-amber-700 dark:text-amber-400' : tom === 'baixa' ? 'text-sky-700 dark:text-sky-400' : ''

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        onClick={() => setAtivo((v) => !v)}
        aria-expanded={ativo}
        aria-controls={idBase}
        className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
      >
        <span className="min-w-0">
          <span className={`block text-sm font-bold leading-snug ${corDoTitulo}`}>
            {titulo}
            {contagem != null && <span className="ml-1.5 font-mono text-[11px] font-semibold text-muted-foreground">({contagem})</span>}
          </span>
          {detalhe && <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{detalhe}</span>}
        </span>
        <ChevronDown className={`mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${ativo ? 'rotate-180' : ''}`} />
      </button>
      <div id={idBase} hidden={!ativo} className="border-t border-border px-4 py-4">
        {children}
      </div>
    </div>
  )
}

/* ═══════════════════════════ Favoritos ═══════════════════════════ */

export type TipoFavorito = 'marcador' | 'exame' | 'padrao' | 'doenca'

export interface Favorito {
  tipo: TipoFavorito
  id: string
  nome: string
  href: string
}

const CHAVE = 'domineaqui:exames-laboratoriais:favoritos'

function ler(): Favorito[] {
  if (typeof window === 'undefined') return []
  try {
    const bruto = window.localStorage.getItem(CHAVE)
    const lista = bruto ? JSON.parse(bruto) : []
    return Array.isArray(lista) ? lista : []
  } catch {
    return []
  }
}

/**
 * Biblioteca pessoal, guardada no próprio aparelho.
 *
 * Fica em `localStorage` de propósito: é uma marcação de estudo, não um dado de
 * conta. Assim funciona sem login, sem ida ao servidor e sem custo de banco —
 * e o preço, que é não sincronizar entre aparelhos, é aceitável para o que a
 * funcionalidade se propõe.
 */
export function useFavoritos() {
  const [favoritos, setFavoritos] = useState<Favorito[]>([])
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    setFavoritos(ler())
    setPronto(true)

    // Mantém as abas em sincronia: marcar um favorito numa aba reflete na outra.
    const aoMudar = (e: StorageEvent) => {
      if (e.key === CHAVE) setFavoritos(ler())
    }
    window.addEventListener('storage', aoMudar)
    return () => window.removeEventListener('storage', aoMudar)
  }, [])

  const alternar = useCallback((item: Favorito) => {
    setFavoritos((atuais) => {
      const existe = atuais.some((f) => f.tipo === item.tipo && f.id === item.id)
      const proximos = existe ? atuais.filter((f) => !(f.tipo === item.tipo && f.id === item.id)) : [item, ...atuais]
      try {
        window.localStorage.setItem(CHAVE, JSON.stringify(proximos.slice(0, 200)))
      } catch {
        /* Cota cheia ou modo privativo: a marcação vale só para esta sessão. */
      }
      return proximos
    })
  }, [])

  const marcado = useCallback(
    (tipo: TipoFavorito, id: string) => favoritos.some((f) => f.tipo === tipo && f.id === id),
    [favoritos],
  )

  return { favoritos, alternar, marcado, pronto }
}

export function BotaoFavorito({ item, rotulo = 'Salvar' }: { item: Favorito; rotulo?: string }) {
  const { alternar, marcado, pronto } = useFavoritos()
  const ativo = pronto && marcado(item.tipo, item.id)

  return (
    <button
      onClick={() => alternar(item)}
      aria-pressed={ativo}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
        ativo
          ? 'border-amber-400/40 bg-amber-400/10 text-amber-700 dark:text-amber-300'
          : 'border-border bg-muted/40 text-muted-foreground hover:border-amber-400/40 hover:text-foreground'
      }`}
    >
      <Star className={`h-3.5 w-3.5 ${ativo ? 'fill-current' : ''}`} />
      {ativo ? 'Salvo' : rotulo}
    </button>
  )
}

/** A biblioteca pessoal, listada. Usada na home da seção. */
export function ListaDeFavoritos() {
  const { favoritos, pronto } = useFavoritos()

  if (!pronto || favoritos.length === 0) return null

  return (
    <section className="mt-10">
      <p className="lab-rubrica">Sua biblioteca</p>
      <h2 className="mt-1 font-heading text-lg font-semibold tracking-tight">Salvos por você</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {favoritos.map((f) => (
          <li key={`${f.tipo}-${f.id}`}>
            <a
              href={f.href}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium transition hover:border-primary/40"
            >
              <Star className="h-3 w-3 fill-current text-amber-500" />
              {f.nome}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
