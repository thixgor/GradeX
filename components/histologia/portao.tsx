'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import { BASE } from '@/lib/histologia/rotas'

/**
 * Portão de cliente do Manual da Histologia.
 *
 * As páginas do módulo eram renderizadas sob demanda porque cada uma lia a
 * sessão para decidir entre o conteúdo e a vitrine: toda visita de assinante
 * rodava uma função e devolvia de 80 a 500 KB de HTML sem compressão — Fast
 * Origin Transfer, cobrado byte a byte. Agora a página é um casco estático
 * (sai do CDN) e o conteúdo vem de uma rota de dados que passa pelo mesmo
 * portão de sempre (`lib/histologia/acesso.ts`), comprimido.
 *
 * **Quem decide continua sendo o servidor.** O casco não carrega nada do
 * acervo — nem no HTML, nem no payload RSC, nem no JavaScript —, então não há
 * o que vazar para quem não assina: a rota responde 404 e este componente leva
 * à home, onde está a vitrine. É o mesmo destino do `redirect()` que as páginas
 * faziam no servidor. O visitante sem sessão nem chega aqui: o middleware já o
 * resolve na borda.
 *
 * Um 404 aqui sempre quer dizer "sem acesso": rota de acervo inexistente é
 * barrada antes, pelo casco, que confere no servidor se a página existe.
 */

type Estado<T> =
  | { fase: 'carregando' }
  | { fase: 'pronto'; dados: T }
  | { fase: 'fora' }
  | { fase: 'erro' }

/**
 * O último conteúdo de cada rota, na memória da aba. Voltar a uma página
 * acabou de vista (o "voltar" do navegador, a home depois de uma lâmina) monta
 * na hora, sem esperar a rota de novo. Um minuto é a mesma tolerância que o
 * portão do servidor já dá a um veredito positivo.
 */
const memoria = new Map<string, { dados: unknown; em: number }>()
const VALIDADE_MS = 60 * 1000

function inicial<T>(url: string): Estado<T> {
  const guardado = memoria.get(url)
  if (guardado && Date.now() - guardado.em < VALIDADE_MS) return { fase: 'pronto', dados: guardado.dados as T }
  return { fase: 'carregando' }
}

export function useConteudoDaHistologia<T>(url: string) {
  const [pedido, setPedido] = useState({ url, tentativa: 0 })
  const [estado, setEstado] = useState<Estado<T>>(() => inicial<T>(url))

  // Mesma instância, outra rota (o roteador pode reaproveitar o componente
  // entre lâminas): o estado é refeito durante a renderização, antes de a
  // lâmina anterior aparecer com o endereço da próxima.
  if (pedido.url !== url) {
    setPedido({ url, tentativa: 0 })
    setEstado(inicial<T>(url))
  }

  const carregando = estado.fase === 'carregando'
  useEffect(() => {
    if (!carregando) return
    let ativo = true
    // Pedido simples, sem cabeçalho a mais: é o que casa com o `preload` que o
    // casco emite, e o navegador reaproveita a resposta que já está chegando.
    fetch(pedido.url)
      .then(async (resposta) => {
        if (!ativo) return
        if (resposta.status === 404) {
          setEstado({ fase: 'fora' })
          return
        }
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
        const dados = (await resposta.json()) as T
        if (!ativo) return
        memoria.set(pedido.url, { dados, em: Date.now() })
        setEstado({ fase: 'pronto', dados })
      })
      .catch(() => {
        if (ativo) setEstado({ fase: 'erro' })
      })
    return () => {
      ativo = false
    }
  }, [pedido, carregando])

  function tentarDeNovo() {
    setEstado({ fase: 'carregando' })
    setPedido((atual) => ({ ...atual, tentativa: atual.tentativa + 1 }))
  }

  return { estado, tentarDeNovo }
}

/**
 * O portão das páginas internas: conteúdo para quem tem acesso, home (e,
 * portanto, vitrine) para quem não tem.
 */
export function PortaoDaHistologia<T>({
  url,
  superficie = 'pagina',
  children,
}: {
  /** Rota de dados da página, em `/api/manual-clinico/histologia/…`. */
  url: string
  /** O fundo da espera: o catálogo é sempre escuro, as páginas de estudo seguem o tema. */
  superficie?: 'pagina' | 'catalogo'
  children: (dados: T) => ReactNode
}) {
  const router = useRouter()
  const { estado, tentarDeNovo } = useConteudoDaHistologia<T>(url)

  const fora = estado.fase === 'fora'
  useEffect(() => {
    if (fora) router.replace(BASE)
  }, [fora, router])

  if (estado.fase === 'pronto') return <>{children(estado.dados)}</>
  if (estado.fase === 'erro') return <FalhaAoCarregar superficie={superficie} aoTentarDeNovo={tentarDeNovo} />
  return <EsperaDaHistologia superficie={superficie} />
}

export function EsperaDaHistologia({ superficie = 'pagina' }: { superficie?: 'pagina' | 'catalogo' }) {
  return (
    <div
      className={`flex min-h-screen items-center justify-center ${superficie === 'catalogo' ? 'dark catalogo-histo' : 'surface-page'}`}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      <span className="sr-only">Carregando o Manual da Histologia…</span>
    </div>
  )
}

/**
 * Sem resposta do servidor não dá para mostrar nem o conteúdo nem a vitrine. O
 * portão fecha e explica, em vez de girar para sempre.
 */
export function FalhaAoCarregar({
  superficie = 'pagina',
  aoTentarDeNovo,
}: {
  superficie?: 'pagina' | 'catalogo'
  aoTentarDeNovo: () => void
}) {
  return (
    <div
      className={`flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center ${superficie === 'catalogo' ? 'dark catalogo-histo text-white' : 'surface-page'}`}
    >
      <p className="font-heading text-lg font-semibold">Não foi possível carregar o Manual da Histologia</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Verifique sua conexão e tente de novo. Se o problema continuar, o módulo volta assim que o serviço se
        restabelecer.
      </p>
      <button
        type="button"
        onClick={aoTentarDeNovo}
        className="mt-1 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
      >
        Tentar de novo
      </button>
    </div>
  )
}
