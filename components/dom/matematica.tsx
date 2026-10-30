import { Fragment, type ReactNode } from 'react'

/**
 * Notação científica das respostas do Dom: `$H^+/K^+$ ATPase` vira H⁺/K⁺
 * ATPase com a letrinha em cima de verdade (`<sup>`), `$CO_2$` vira CO₂
 * (`<sub>`), `\rightarrow` vira →, `\ce{HCO3^-}` vira HCO₃⁻.
 *
 * Não é o KaTeX (≈ 280 KB de JS + fontes): o Dom só escreve íons, fórmulas,
 * setas e letras gregas, e isso cabe em sup/sub/Unicode. Continua sem HTML —
 * tudo sai como nó do React, então nenhuma resposta injeta marcação.
 */

const COMANDOS: Record<string, string> = {
  rightarrow: '→', to: '→', leftarrow: '←', leftrightarrow: '↔', rightleftharpoons: '⇌', longrightarrow: '⟶',
  Rightarrow: '⇒', Leftarrow: '⇐', Leftrightarrow: '⇔', uparrow: '↑', downarrow: '↓', updownarrow: '↕',
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ',
  kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', phi: 'φ',
  varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω', Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Pi: 'Π',
  Sigma: 'Σ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
  times: '×', cdot: '·', div: '÷', pm: '±', mp: '∓', le: '≤', leq: '≤', ge: '≥', geq: '≥', neq: '≠', ne: '≠',
  approx: '≈', sim: '∼', propto: '∝', infty: '∞', circ: '°', degree: '°', partial: '∂', sum: '∑', prod: '∏',
  int: '∫', in: '∈', ll: '≪', gg: '≫', cdots: '⋯', ldots: '…', dots: '…', '%': '%', '$': '$', '&': '&', '#': '#',
  ',': ' ', ';': ' ', ':': ' ', '!': '', quad: '  ', qquad: '   ', ' ': ' ',
}
/** Comandos que só embrulham o argumento: o conteúdo sai como está. */
const EMBRULHOS = new Set(['text', 'mathrm', 'mathbf', 'mathit', 'textbf', 'textit', 'operatorname', 'mathsf', 'boldsymbol'])
const SOMEM = new Set(['left', 'right', 'big', 'Big', 'bigl', 'bigr', 'displaystyle', 'limits'])

/** Lê `{…}` balanceado (ou um único caractere) a partir de `i`. */
function argumento(s: string, i: number): [string, number] {
  while (s[i] === ' ') i++
  if (s[i] !== '{') {
    // `^-`, `^2`, `^+`: um caractere; `^{2+}`: o grupo. Íon "2+" sem chave também é comum.
    const m = s.slice(i).match(/^(\d+[+\-−]|[+\-−]|\d|\\[A-Za-z]+|.)/)
    const t = m ? m[0] : ''
    return [t, i + t.length]
  }
  let nivel = 0
  for (let j = i; j < s.length; j++) {
    if (s[j] === '{') nivel++
    else if (s[j] === '}' && --nivel === 0) return [s.slice(i + 1, j), j + 1]
  }
  return [s.slice(i + 1), s.length]
}

/** `\ce{HCO3^-}`: no mhchem, número logo depois de elemento ou `)` é índice. */
function quimica(s: string): string {
  return s.replace(/([A-Za-z)\]])(\d+)/g, '$1_{$2}').replace(/<->/g, '\\leftrightarrow ').replace(/<=>/g, '\\rightleftharpoons ').replace(/->/g, '\\rightarrow ')
}

function montar(s: string, chave: string): ReactNode[] {
  const saida: ReactNode[] = []
  let texto = ''
  const soltar = () => {
    if (texto) saida.push(texto)
    texto = ''
  }
  let i = 0
  while (i < s.length) {
    const c = s[i]
    if (c === '^' || c === '_') {
      const [arg, fim] = argumento(s, i + 1)
      soltar()
      const filhos = montar(arg, `${chave}${c}${i}`)
      saida.push(c === '^' ? <sup key={`${chave}s${i}`}>{filhos}</sup> : <sub key={`${chave}b${i}`}>{filhos}</sub>)
      i = fim
      continue
    }
    if (c === '\\') {
      const m = s.slice(i + 1).match(/^([A-Za-z]+|.)/)
      const nome = m ? m[1] : ''
      i += 1 + nome.length
      if (nome === 'frac') {
        const [num, a] = argumento(s, i)
        const [den, b] = argumento(s, a)
        soltar()
        const simples = (x: string) => /^[\w^_{}+\-−.\\]*$/.test(x) && !/[+\-−]/.test(x.replace(/[\^_]\{?[+\-−\d]+\}?/g, ''))
        saida.push(
          <Fragment key={`${chave}f${i}`}>
            {simples(num) ? montar(num, `${chave}n${i}`) : ['(', ...montar(num, `${chave}n${i}`), ')']}/
            {simples(den) ? montar(den, `${chave}d${i}`) : ['(', ...montar(den, `${chave}d${i}`), ')']}
          </Fragment>,
        )
        i = b
      } else if (nome === 'sqrt') {
        const [arg, fim] = argumento(s, i)
        soltar()
        saida.push(<Fragment key={`${chave}r${i}`}>√({montar(arg, `${chave}r${i}`)})</Fragment>)
        i = fim
      } else if (nome === 'ce' || nome === 'pu') {
        const [arg, fim] = argumento(s, i)
        soltar()
        saida.push(<Fragment key={`${chave}c${i}`}>{montar(quimica(arg), `${chave}c${i}`)}</Fragment>)
        i = fim
      } else if (EMBRULHOS.has(nome)) {
        const [arg, fim] = argumento(s, i)
        soltar()
        saida.push(<Fragment key={`${chave}t${i}`}>{montar(arg, `${chave}t${i}`)}</Fragment>)
        i = fim
      } else if (SOMEM.has(nome)) {
        // `\left(` → só o parêntese.
      } else if (nome in COMANDOS) {
        texto += COMANDOS[nome]
        // Como no LaTeX: depois de símbolo comum o espaço é só separador
        // (`\Delta G` → ΔG); seta e relação mantêm o respiro (`A \to B`).
        if (/^[\u0370-\u03ff°∞∂]$/.test(COMANDOS[nome]) && s[i] === ' ') i++
      } else {
        texto += nome // comando desconhecido: o nome cru é melhor que a barra
      }
      continue
    }
    if (c === '{' || c === '}') {
      i++
      continue
    }
    // Menos tipográfico e o "-" de íon.
    texto += c === '-' ? '−' : c
    i++
  }
  soltar()
  return saida
}

/** Uma expressão (`H^+/K^+`) como elementos React. */
export function Formula({ fonte }: { fonte: string }) {
  return <span className="dom-formula">{montar(fonte.trim(), 'm')}</span>
}

/**
 * Trechos de fórmula num texto: `$…$`, `\(…\)` e `\ce{…}` soltos.
 * O `$` de abertura não pode vir colado em letra/número nem seguido de espaço
 * — é o que impede "R$ 29,90 ou R$ 49,90" de virar fórmula. Sem lookbehind
 * (o Safari antigo do iPhone não entende e quebraria o chunk inteiro): o
 * caractere antes do `$` é capturado e devolvido.
 */
export const RE_FORMULA = /\\\((.+?)\\\)|(^|[^\w$\\])\$(\S(?:[^$\n]*?\S)?)\$(?!\d)|(\\ce\{(?:[^{}]|\{[^{}]*\})*\})/g

/** Íon fora de `$…$` (`Na^+`, `Ca^{2+}`): o modelo às vezes esquece o cifrão. */
export const RE_EXPOENTE_SOLTO = /([A-Za-z0-9)\]])\^(\{[^}\n]{1,8}\}|\d*[+\-−]|\d+)/g
