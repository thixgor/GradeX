'use client'

import { useEffect, useMemo, useState } from 'react'

/**
 * Marca d'água do acervo de anatomia.
 *
 * O Atlas é a parte do Manual Clínico mais fácil de piratear: a prancha é uma
 * imagem só, e um print resolve. A marca não impede o print — nada impede —,
 * mas faz com que a cópia carregue para sempre o e-mail de quem a tirou, que é
 * o que torna o repasse caro para quem o faz. O CPF ficou de fora de propósito:
 * é dado sensível de mais para estampar numa imagem que pode circular fora do
 * nosso controle, e o e-mail já identifica a conta sozinho.
 *
 * O ladrilho é discreto por design — a função dele é sobreviver a um print,
 * não competir com a prancha que o aluno está estudando. Ele é desenhado como
 * fundo repetido (um azulejo SVG) e não como uma pilha de elementos: são zero
 * nós extras no DOM, o ladrilho cobre qualquer tamanho de palco — inclusive a
 * tela cheia — e o custo de pintura é o de uma textura, que é o que uma
 * prancha com zoom e arraste pode pagar.
 */

export interface IdentidadeDoAluno {
  nome: string
  email: string
}

/**
 * A identidade é a mesma para todas as pranchas da sessão, então ela vive fora
 * do React: o primeiro visualizador que montar busca, os demais reaproveitam, e
 * trocar de prancha ou abrir o quiz não gera pedido novo.
 */
let identidadeEmCache: IdentidadeDoAluno | null = null
let buscaEmVoo: Promise<IdentidadeDoAluno | null> | null = null
/** Visitante recebe 401 aqui. Uma vez basta: a amostra da landing não muda. */
let semIdentidade = false

async function buscarIdentidade(): Promise<IdentidadeDoAluno | null> {
  if (identidadeEmCache) return identidadeEmCache
  if (semIdentidade) return null
  if (buscaEmVoo) return buscaEmVoo

  buscaEmVoo = fetch('/api/auth/me')
    .then(resposta => (resposta.ok ? resposta.json() : null))
    .then((conteudo: { user?: { name?: string; email?: string } } | null) => {
      const usuario = conteudo?.user
      if (!usuario) {
        semIdentidade = true
        return null
      }
      identidadeEmCache = {
        nome: (usuario.name || '').trim(),
        email: (usuario.email || '').trim(),
      }
      return identidadeEmCache
    })
    .catch(() => {
      semIdentidade = true
      return null
    })
    .finally(() => {
      buscaEmVoo = null
    })

  return buscaEmVoo
}

/**
 * Nome e e-mail de quem está olhando, quando há sessão.
 *
 * Devolve `null` para visitante — a amostra da landing existe justamente para
 * quem ainda não entrou, e ali a marca fica só com a assinatura da casa.
 */
export function useIdentidadeDoAluno(): IdentidadeDoAluno | null {
  const [identidade, setIdentidade] = useState<IdentidadeDoAluno | null>(identidadeEmCache)

  useEffect(() => {
    if (identidadeEmCache || semIdentidade) return
    let ativo = true
    void buscarIdentidade().then(valor => {
      if (ativo && valor) setIdentidade(valor)
    })
    return () => {
      ativo = false
    }
  }, [])

  return identidade
}

const escapar = (valor: string) =>
  valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/**
 * O azulejo.
 *
 * O texto sai com contorno escuro por baixo do preenchimento claro
 * (`paint-order`), e é isso que o faz sobreviver tanto ao osso quase branco
 * quanto ao fundo da mesa: numa peça clara quem marca é o contorno, numa
 * região escura quem marca é o preenchimento. Uma cor só nunca daria conta das
 * duas.
 *
 * A opacidade é baixa de propósito — a versão anterior chegava perto de 0.45
 * e competia com a prancha em vez de só acompanhá-la. O que faz a marca
 * cumprir a função não é dar na vista: é estar lá quando alguém for procurar.
 */
function azulejo(linhas: string[]): string {
  const largura = 360
  const altura = 210
  const centroY = altura / 2
  const primeira = centroY - ((linhas.length - 1) * 17) / 2

  const textos = linhas
    .map((linha, indice) => `<text x="180" y="${primeira + indice * 17}">${escapar(linha)}</text>`)
    .join('')

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}">` +
    `<g transform="rotate(-24 180 ${centroY})" font-family="ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif"` +
    ` font-size="12.5" font-weight="600" letter-spacing="0.3" text-anchor="middle" dominant-baseline="middle"` +
    ` paint-order="stroke fill" stroke="rgba(2,6,23,0.14)" stroke-width="2.4" stroke-linejoin="round"` +
    ` fill="rgba(255,255,255,0.18)">${textos}</g>` +
    `</svg>`

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

export function MarcaDaguaDoAcervo({ className = '' }: { className?: string }) {
  const identidade = useIdentidadeDoAluno()

  const fundo = useMemo(() => {
    const linhas = ['Domine Aqui']
    if (identidade?.nome) linhas.push(identidade.nome)
    if (identidade?.email) linhas.push(identidade.email)
    if (linhas.length === 1) linhas.push('domineaqui.com.br')
    return azulejo(linhas)
  }, [identidade])

  // O azulejo entra por variável, e não por `style="background-image:..."`:
  // o Modo Lite apaga fundo de imagem declarado inline para poupar banda, e a
  // marca não é banda (é um data-URI de poucas centenas de bytes) nem é
  // dispensável — ela é justamente o que não pode sumir de uma cópia.
  return (
    <span aria-hidden className={`pointer-events-none absolute inset-0 select-none ${className}`}>
      <span
        className="anatomia-marca-dagua absolute inset-0"
        style={{ ['--marca-dagua' as string]: fundo }}
      />

      {/* Selo da casa, sozinho no canto. O ladrilho já carrega o nome no
          texto; este é o toque de marca — pequeno, sempre no mesmo lugar,
          reconhecível mesmo num recorte que corte o resto da prancha. Fica no
          canto superior: o inferior é onde o palco desenha seus controles de
          zoom, e a logo entraria embaixo deles. */}
      <img
        src="/img/logo.svg"
        alt=""
        className="absolute right-3 top-3 h-5 w-auto opacity-45 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] dark:hidden sm:h-6"
      />
      <img
        src="/img/logo_darkmode.svg"
        alt=""
        className="absolute right-3 top-3 hidden h-5 w-auto opacity-45 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] dark:block sm:h-6"
      />
    </span>
  )
}
