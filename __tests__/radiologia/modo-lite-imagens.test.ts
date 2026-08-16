import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * O Modo Lite apaga `style="background-image:url(...)"` para economizar banda —
 * e chegou a apagar as radiografias de "Casos e alterações", que são sprites de
 * duas metades (filme limpo | filme marcado) e por isso chegam como fundo, não
 * como `<img>`. O negatoscópio virava um retângulo preto.
 *
 * O contrato que impede a volta disso tem dois lados, e os dois são testados
 * aqui: o CSS abre exceção para `data-imagem-clinica`, e todo elemento que
 * pinta radiografia por fundo declara o atributo.
 */

const RAIZ = join(__dirname, '..', '..')
const globais = readFileSync(join(RAIZ, 'app', 'globals.css'), 'utf8')

function arquivosTsx(pasta: string): string[] {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((item) => {
    const caminho = join(pasta, item.name)
    if (item.isDirectory()) return arquivosTsx(caminho)
    return item.name.endsWith('.tsx') ? [caminho] : []
  })
}

/** O elemento JSX que abre imediatamente antes da linha informada. */
function elemento(linhas: string[], indice: number): string {
  for (let i = indice; i >= 0 && indice - i < 20; i--) {
    if (/^\s*<[A-Za-z]/.test(linhas[i])) return linhas.slice(i, indice + 1).join('\n')
  }
  return ''
}

describe('Modo Lite não apaga as radiografias', () => {
  it('abre exceção para data-imagem-clinica ao remover fundos', () => {
    const regra = globais
      .split('\n')
      .find((linha) => linha.includes("[style*='background-image']") && linha.includes('.lite-mode'))
    expect(regra, 'a regra que remove fundos no Modo Lite sumiu do globals.css').toBeDefined()
    expect(regra).toContain(":not([style*='gradient'])")
    expect(regra).toContain(':not([data-imagem-clinica])')
  })

  it('preserva o filtro do negatoscópio, que é ferramenta e não enfeite', () => {
    const regra = globais
      .split('\n')
      .find((linha) => /^\.lite-mode \*:not\(\[data-imagem-clinica\]\)\s*\{/.test(linha))
    expect(regra, 'o `filter: none` do Modo Lite voltou a valer para todo elemento').toBeDefined()
  })

  it('marca todo fundo que é radiografia, e só esses', () => {
    const alvos: string[] = []
    for (const arquivo of arquivosTsx(join(RAIZ, 'components'))) {
      const linhas = readFileSync(arquivo, 'utf8').split('\n')
      linhas.forEach((linha, indice) => {
        if (!/backgroundImage:/.test(linha)) return
        const valor = linha + linhas[indice + 1]
        // Gradiente de CSS o Modo Lite já preserva sozinho — não precisa marca.
        if (valor.includes('gradient') || valor.includes('RETICULA')) return
        const bloco = elemento(linhas, indice)
        if (!bloco.includes('data-imagem-clinica')) {
          alvos.push(`${arquivo.replace(RAIZ + '/', '')}:${indice + 1}`)
        }
      })
    }
    expect(alvos, 'fundo de imagem sem `data-imagem-clinica`: some no Modo Lite').toEqual([])
  })
})
