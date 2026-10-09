'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useBootstrap } from '@/hooks/use-bootstrap'
import {
  ESTADO_INICIAL,
  EVENTO_INSPECAO,
  atalhoDeInspecao,
  avaliarDevtools,
  avisoDoAtalho,
  deveBloquearMenu,
  type DetalheDoEventoDeInspecao,
} from '@/lib/protecao-inspecao'

/**
 * A dissuasão contra o inspetor, aplicada ao site inteiro.
 *
 * As regras moram em `lib/protecao-inspecao.ts`, que também diz com todas as
 * letras o que isto NÃO faz: tudo o que chega ao navegador pode ser lido por
 * quem insistir. Aqui é só a ligação delas com a página:
 *
 * - **atalhos** do inspetor, do código-fonte e de salvar a página não fazem
 *   nada, e uma linha na tela diz por quê (tecla morta parece defeito);
 * - **botão direito** do mouse não abre o menu nativo — exceto em link e em
 *   campo de escrita;
 * - **DevTools acoplado** à janela esconde a página atrás de um aviso, e a
 *   prova monitorada ouve `EVENTO_INSPECAO` para registrar o fato.
 *
 * ## Custo
 *
 * Zero de servidor. A detecção roda no evento `resize` — abrir o DevTools
 * acoplado é, para a página, a janela ficando menor — e não em relógio. Quem
 * é admin sai de `useBootstrap({ skip: true })`, que só escuta o cache que o
 * `AppShell` já preencheu (e que é reidratado do `localStorage` antes do
 * primeiro render): não sai requisição nenhuma daqui.
 *
 * ## Quem fica de fora
 *
 * Admin (precisa depurar o próprio site), `next dev` e quem ligar
 * `NEXT_PUBLIC_PROTECAO_INSPECAO=off` — o interruptor para o dia em que a
 * heurística acusar alguém que não devia, sem mexer em código (a variável entra
 * no bundle no build, então vale a partir do próximo deploy).
 */

const DESLIGADA =
  process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_PROTECAO_INSPECAO === 'off'

/** Id do contêiner que a regra de `globals.css` poupa quando a página some. */
const ID_DO_CONTEINER = 'protecao-inspecao'

const DURACAO_DO_AVISO_MS = 2600

export function ProtecaoContraInspecao() {
  const { isAdmin } = useBootstrap({ skip: true })
  const ligada = !DESLIGADA && !isAdmin

  const [aberto, setAberto] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const [montado, setMontado] = useState(false)
  const avisoTimer = useRef<number | null>(null)
  const ultimoAberto = useRef(false)

  useEffect(() => setMontado(true), [])

  // Atalhos e botão direito.
  useEffect(() => {
    if (!ligada) return

    let ultimoPonteiro: string | null = null

    const avisar = (mensagem: string) => {
      setAviso(mensagem)
      if (avisoTimer.current) window.clearTimeout(avisoTimer.current)
      avisoTimer.current = window.setTimeout(() => setAviso(null), DURACAO_DO_AVISO_MS)
    }

    const aoTeclar = (evento: KeyboardEvent) => {
      const qual = atalhoDeInspecao(evento)
      if (!qual) return
      evento.preventDefault()
      avisar(avisoDoAtalho(qual))
    }

    const aoApontar = (evento: PointerEvent) => {
      ultimoPonteiro = evento.pointerType || null
    }

    // Na fase de bolha, no `document`: os menus próprios do site (grifo, mapa
    // mental) rodam antes, pelo React, e chegam aqui já com `defaultPrevented`.
    const aoPedirMenu = (evento: MouseEvent) => {
      if (
        !deveBloquearMenu({
          alvo: evento.target,
          ultimoPonteiro,
          jaCancelado: evento.defaultPrevented,
        })
      ) {
        return
      }
      evento.preventDefault()
      avisar('O menu do botão direito está desativado neste site.')
    }

    // Captura na janela: o navegador é impedido antes de qualquer ouvinte da
    // página poder esquecer. Sem `stopPropagation` — um editor do próprio site
    // que use Ctrl+S continua recebendo a tecla.
    window.addEventListener('keydown', aoTeclar, true)
    window.addEventListener('pointerdown', aoApontar, { capture: true, passive: true })
    document.addEventListener('contextmenu', aoPedirMenu)

    return () => {
      window.removeEventListener('keydown', aoTeclar, true)
      window.removeEventListener('pointerdown', aoApontar, true)
      document.removeEventListener('contextmenu', aoPedirMenu)
      if (avisoTimer.current) window.clearTimeout(avisoTimer.current)
    }
  }, [ligada])

  // Detecção do DevTools acoplado.
  useEffect(() => {
    if (!ligada) {
      setAberto(false)
      return
    }
    // Celular e tablet não abrem DevTools, e o teclado virtual encolhe a
    // página do mesmo jeito que um painel — a conta lá só daria falso alarme.
    if (!window.matchMedia?.('(pointer: fine)').matches) return

    let estado = ESTADO_INICIAL
    const ler = () => {
      estado = avaliarDevtools(estado, {
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio || 1,
      })
      setAberto(estado.aberto)
    }

    ler()
    window.addEventListener('resize', ler)
    return () => window.removeEventListener('resize', ler)
  }, [ligada])

  // O estado vira atributo (para o CSS esconder a página) e evento (para a
  // prova monitorada registrar). Só as mudanças — o "fechado" inicial não é
  // notícia para ninguém.
  useEffect(() => {
    document.documentElement.toggleAttribute('data-inspecao-aberta', aberto)
    if (aberto === ultimoAberto.current) return
    ultimoAberto.current = aberto
    window.dispatchEvent(
      new CustomEvent<DetalheDoEventoDeInspecao>(EVENTO_INSPECAO, { detail: { aberto } }),
    )
  }, [aberto])

  useEffect(() => () => document.documentElement.removeAttribute('data-inspecao-aberta'), [])

  if (!montado || !ligada) return null

  return createPortal(
    <div id={ID_DO_CONTEINER}>
      {aberto && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="protecao-inspecao-titulo"
          className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-background p-6 text-foreground select-none"
        >
          <div className="max-w-md text-center">
            <h2 id="protecao-inspecao-titulo" className="text-xl font-semibold">
              Feche as ferramentas de desenvolvedor
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              O conteúdo da DomineAqui fica oculto enquanto o inspetor do navegador estiver aberto.
              Se você abriu um painel lateral do navegador (favoritos, leitura), feche-o também.
            </p>
          </div>
        </div>
      )}
      {aviso && !aberto && (
        <div
          role="status"
          className="pointer-events-none fixed inset-x-0 bottom-6 z-[2147483646] flex justify-center px-4"
        >
          <span className="rounded-full bg-foreground/90 px-4 py-2 text-sm text-background shadow-lg">
            {aviso}
          </span>
        </div>
      )}
    </div>,
    document.body,
  )
}
