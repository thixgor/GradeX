'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useBootstrap } from '@/hooks/use-bootstrap'

/**
 * Marca d'água da área de resolução de flashcard.
 *
 * Nome, e-mail e data de quem está estudando, mais a marca DomineAqui,
 * ladrilhados em diagonal por cima do card. Se o card aparecer num print ou
 * num PDF montado a partir de capturas de tela, ele diz de qual conta saiu.
 *
 * ## Custo: nenhum
 *
 * - **Dados.** Nome e e-mail vêm de `useBootstrap({ skip: true })`, que não
 *   faz requisição: só lê o cache do `/api/bootstrap` que o `AppShell` em volta
 *   já carregou (e que é reidratado do `localStorage` antes do primeiro
 *   render). Virar card, avançar e voltar não buscam nada.
 * - **Logo.** `/img/logo.svg`, o mesmo do cabeçalho do `AppShell`: já está no
 *   cache do navegador, com `immutable` (regra `/img/` do `next.config.js`).
 * - **Desenho.** O texto é um ladrilho SVG em data-URI, gerado uma vez por
 *   pessoa e por dia (`useMemo`). É um nó só, sem animação, fora do elemento
 *   3D que gira — virar o card não repinta a marca.
 *
 * ## Sem atrapalhar
 *
 * `pointer-events: none` (o clique atravessa até o card), opacidade baixa e
 * letra pequena: a marca existe para aparecer no print, não para competir com a
 * pergunta.
 *
 * ## Se alguém apagar pelo inspetor
 *
 * Um `MutationObserver` no invólucro percebe quando o nó some ou tem o estilo
 * trocado, e o React o recoloca com uma `key` nova. É dissuasão — uma regra CSS
 * injetada ainda esconde —, mas tira do caminho o "apaga o div e tira print".
 */

const COR_DO_TEXTO = '#6b7280'

function escaparXml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** O ladrilho de texto, como `url("data:image/svg+xml,…")`. */
export function ladrilhoDaMarca(nome: string, email: string, data: string): string {
  const linhas = ['DomineAqui', nome, email, data].filter(Boolean).map(escaparXml)
  const largura = 340
  const altura = 200
  const textos = linhas
    .map((linha, i) => {
      const peso = i === 0 ? 700 : 500
      const tamanho = i === 0 ? 15 : 12
      const y = altura / 2 - ((linhas.length - 1) * 16) / 2 + i * 16
      return `<text x="${largura / 2}" y="${y}" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="${tamanho}" font-weight="${peso}" fill="${COR_DO_TEXTO}">${linha}</text>`
    })
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}"><g transform="rotate(-30 ${largura / 2} ${altura / 2})">${textos}</g></svg>`
  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`
}

/** Três logos discretos: canto superior esquerdo, centro, canto inferior direito. */
const POSICOES_DO_LOGO = [
  { top: '8%', left: '6%', tamanho: 28 },
  { top: '50%', left: '50%', tamanho: 56, centro: true },
  { top: '82%', left: '84%', tamanho: 28 },
] as const

/**
 * `sobreFundoEscuro`: para card que é escuro em qualquer tema (o dos flashcards
 * por IA). Sem ele, a opacidade segue o tema do site.
 */
export function MarcaDaguaFlashcard({ sobreFundoEscuro = false }: { sobreFundoEscuro?: boolean } = {}) {
  const { user } = useBootstrap({ skip: true })
  const nome = (user?.name || '').trim()
  const email = (user?.email || '').trim()

  const fundo = useMemo(
    () => ladrilhoDaMarca(nome, email, new Date().toLocaleDateString('pt-BR')),
    [nome, email],
  )

  const [versao, setVersao] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const no = ref.current
    const pai = no?.parentElement
    if (!no || !pai || typeof MutationObserver === 'undefined') return

    const estiloOriginal = no.getAttribute('style')
    const classeOriginal = no.getAttribute('class')

    const observador = new MutationObserver(() => {
      const adulterado =
        !pai.contains(no) ||
        no.getAttribute('style') !== estiloOriginal ||
        no.getAttribute('class') !== classeOriginal ||
        no.hasAttribute('hidden')
      if (adulterado) setVersao((v) => v + 1)
    })
    observador.observe(pai, { childList: true })
    observador.observe(no, { attributes: true, childList: true, subtree: true })
    return () => observador.disconnect()
  }, [versao, fundo])

  return (
    <div
      key={versao}
      ref={ref}
      aria-hidden="true"
      data-marca-dagua=""
      className={`marca-dagua-flashcard pointer-events-none absolute inset-0 z-[5] select-none overflow-hidden rounded-[inherit] ${
        sobreFundoEscuro ? 'opacity-[0.24]' : 'opacity-[0.10] dark:opacity-[0.24]'
      }`}
      // O ladrilho vai por variável, e a classe em `globals.css` o pinta. Não
      // é `backgroundImage` inline de propósito: o Modo Lite apaga fundo
      // inline porque fundo costuma ser download — e este é um data-URI, que
      // não custa byte de rede. Apagá-lo não economizaria nada e tiraria a
      // marca de quem usa o Lite.
      style={{ '--marca-dagua': fundo } as React.CSSProperties}
    >
      {POSICOES_DO_LOGO.map((posicao, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src="/img/logo.svg"
          alt=""
          draggable={false}
          width={posicao.tamanho}
          height={posicao.tamanho}
          className="absolute"
          style={{
            top: posicao.top,
            left: posicao.left,
            transform: `translate(-50%, -50%) rotate(-30deg)`,
            opacity: 'centro' in posicao ? 0.9 : 0.7,
          }}
        />
      ))}
    </div>
  )
}
