'use client'

import { useEffect, useMemo, useState } from 'react'

/**
 * Marca d'água do acervo de anatomia.
 *
 * O Atlas é a parte do Manual Clínico mais fácil de piratear: a prancha é uma
 * imagem só, e um print resolve. A marca não impede o print — nada impede —,
 * mas faz com que a cópia carregue para sempre o nome e o CPF de quem a tirou,
 * que é o que torna o repasse caro para quem o faz.
 *
 * Ela é desenhada como fundo repetido (um azulejo SVG) e não como uma pilha de
 * elementos: são zero nós no DOM, o ladrilho cobre qualquer tamanho de palco —
 * inclusive a tela cheia — e o custo de pintura é o de uma textura, que é o
 * que uma prancha com zoom e arraste pode pagar.
 */

export interface IdentidadeDoAluno {
  nome: string
  cpf: string
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

function formatarCpf(bruto: string): string {
  const digitos = bruto.replace(/\D/g, '')
  if (digitos.length !== 11) return bruto.trim()
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`
}

async function buscarIdentidade(): Promise<IdentidadeDoAluno | null> {
  if (identidadeEmCache) return identidadeEmCache
  if (semIdentidade) return null
  if (buscaEmVoo) return buscaEmVoo

  buscaEmVoo = fetch('/api/auth/me')
    .then(resposta => (resposta.ok ? resposta.json() : null))
    .then((conteudo: { user?: { name?: string; cpf?: string } } | null) => {
      const usuario = conteudo?.user
      if (!usuario) {
        semIdentidade = true
        return null
      }
      identidadeEmCache = {
        nome: (usuario.name || '').trim(),
        cpf: usuario.cpf ? formatarCpf(usuario.cpf) : '',
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
 * Nome e CPF de quem está olhando, quando há sessão.
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
 */
function azulejo(linhas: string[]): string {
  const largura = 300
  const altura = 168
  const centroY = altura / 2
  const primeira = centroY - ((linhas.length - 1) * 17) / 2

  const textos = linhas
    .map((linha, indice) => `<text x="150" y="${primeira + indice * 17}">${escapar(linha)}</text>`)
    .join('')

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}">` +
    `<g transform="rotate(-24 150 ${centroY})" font-family="ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif"` +
    ` font-size="13" font-weight="700" letter-spacing="0.4" text-anchor="middle" dominant-baseline="middle"` +
    ` paint-order="stroke fill" stroke="rgba(2,6,23,0.3)" stroke-width="2.6" stroke-linejoin="round"` +
    ` fill="rgba(255,255,255,0.45)">${textos}</g>` +
    `</svg>`

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

export function MarcaDaguaDoAcervo({ className = '' }: { className?: string }) {
  const identidade = useIdentidadeDoAluno()

  const fundo = useMemo(() => {
    const linhas = ['Domine Aqui']
    if (identidade?.nome) linhas.push(identidade.nome)
    if (identidade?.cpf) linhas.push(`CPF ${identidade.cpf}`)
    if (linhas.length === 1) linhas.push('domineaqui.com.br')
    return azulejo(linhas)
  }, [identidade])

  // O azulejo entra por variável, e não por `style="background-image:..."`:
  // o Modo Lite apaga fundo de imagem declarado inline para poupar banda, e a
  // marca não é banda (é um data-URI de 400 bytes) nem é dispensável — ela é
  // justamente o que não pode sumir de uma cópia.
  return (
    <span
      aria-hidden
      className={`anatomia-marca-dagua pointer-events-none absolute inset-0 select-none ${className}`}
      style={{ ['--marca-dagua' as string]: fundo }}
    />
  )
}
