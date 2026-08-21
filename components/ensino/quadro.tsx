'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { AmbienteDeEnsino, DocaDeEnsino } from '@/components/ensino/doca'

/**
 * O quadro persistente da Área de Ensino (§14, §15, §16).
 *
 * ══ POR QUE ELE EXISTE ═══════════════════════════════════════════════
 *
 * Cada página de `/aulas` montava a sua própria doca. No App Router isso
 * significa que a barra é DESMONTADA e REMONTADA a cada navegação: ela desce,
 * some, e volta subindo com a animação de entrada. Quem olha vê a navegação
 * piscar a cada toque — o oposto exato de um fluxo contínuo.
 *
 * Um layout, ao contrário, sobrevive à troca de rota. Este componente é a parte
 * cliente do `app/aulas/layout.tsx`: ele monta a doca UMA vez e a mantém no ar
 * enquanto a pessoa circula por Aprender, Buscar, Revisar, uma Trilha ou uma
 * aula. O que muda entre telas é só a posição da pílula, com a mola de sempre.
 *
 * ══ E POR QUE ELE GUARDA A ROLAGEM ═══════════════════════════════════
 *
 * O `ScrollToTop` global joga toda navegação para o topo — o comportamento
 * certo para "abri uma página nova", e o errado para "voltei de uma aula para a
 * lista de onde a abri". Quem desceu vinte cartões, entrou numa aula e voltou
 * caía no topo e tinha de descer tudo de novo; na prática, deixava de voltar.
 *
 * Aqui a posição de cada rota de `/aulas` é guardada ao sair e restaurada ao
 * chegar. Só para trás: ir de Aprender para Buscar continua começando no topo,
 * porque é uma tela nova; voltar para Aprender devolve o lugar exato. A
 * distinção é feita pelo `popstate`, o mesmo sinal que o `ScrollToTop` já usa
 * para não atrapalhar o voltar do navegador.
 *
 * A memória vive num `Map` em módulo, e não em `sessionStorage`: ela vale para
 * a visita atual e não deve sobreviver a um recarregamento — depois de um
 * F5 a expectativa de todo mundo é começar do topo.
 */

const rolagemPorRota = new Map<string, number>()

/** Quanto tempo depois de um `popstate` ainda consideramos "isto é um voltar". */
const JANELA_DE_VOLTA_MS = 1000

export function QuadroDeEnsino({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ''
  const rotaAnterior = useRef<string | null>(null)
  const voltouEm = useRef(0)

  useEffect(() => {
    const marcar = () => {
      voltouEm.current = Date.now()
    }
    window.addEventListener('popstate', marcar)
    return () => window.removeEventListener('popstate', marcar)
  }, [])

  useEffect(() => {
    const anterior = rotaAnterior.current
    rotaAnterior.current = pathname

    // Guarda onde a pessoa estava na tela que acabou de sair.
    if (anterior && anterior !== pathname) {
      rolagemPorRota.set(anterior, window.scrollY)
    }

    if (!anterior || anterior === pathname) return
    if (Date.now() - voltouEm.current > JANELA_DE_VOLTA_MS) return

    const guardada = rolagemPorRota.get(pathname)
    if (!guardada) return

    /*
     * A restauração espera o conteúdo existir.
     *
     * A tela nova nasce com o esqueleto — curta — e cresce quando os dados
     * chegam. Rolar para 1200px antes disso não faz nada (o documento ainda
     * não tem 1200px), e um único `requestAnimationFrame` chegaria cedo
     * demais. Tentamos por alguns quadros, e paramos assim que a posição pega
     * ou assim que a pessoa encosta na tela — ninguém deve brigar com o
     * scroll do próprio app.
     */
    let quadro = 0
    let tentativas = 0
    let cancelado = false

    const desistir = () => {
      cancelado = true
      cancelAnimationFrame(quadro)
      window.removeEventListener('wheel', desistir)
      window.removeEventListener('touchstart', desistir)
    }

    const tentar = () => {
      if (cancelado) return
      if (document.body.style.position === 'fixed') return desistir()
      if (document.documentElement.scrollHeight - window.innerHeight >= guardada) {
        window.scrollTo(0, guardada)
        return desistir()
      }
      if (++tentativas > 40) return desistir()
      quadro = requestAnimationFrame(tentar)
    }

    window.addEventListener('wheel', desistir, { passive: true })
    window.addEventListener('touchstart', desistir, { passive: true })
    quadro = requestAnimationFrame(tentar)

    return desistir
  }, [pathname])

  return (
    <>
      {/* O halo fica no layout, e não em cada tela, pelo mesmo motivo da doca:
          ele é o ambiente da área inteira. Montado por página, ele piscaria a
          cada navegação — e o vidro por cima dele piscaria junto. */}
      <AmbienteDeEnsino />
      {children}
      <DocaDeEnsino />
    </>
  )
}
