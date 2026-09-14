import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, it, expect } from 'vitest'

/**
 * O Modo Lite achata o contexto 3D da página inteira (`transform-style: flat`,
 * `perspective: none` em `app/globals.css`) para poupar GPU em aparelho fraco.
 *
 * Achatar um flip 3D, porém, NÃO o desliga: sem contexto 3D o `rotateY(180deg)`
 * deixa de girar no espaço e passa a ESPELHAR a imagem no eixo X. O flashcard
 * virado no Modo Lite aparecia com todas as letras ao contrário — e a face da
 * frente, que não tem rotação própria para acionar o `backface-visibility`,
 * continuava visível por baixo.
 *
 * A correção não foi "achatar melhor": onde existe um flip de verdade, o Modo
 * Lite usa outro MECANISMO (trocar as faces por visibilidade, sem transform
 * nenhum) — que por acaso é também o caminho mais barato, que é o ponto do
 * Modo Lite.
 *
 * Este teste guarda a regra para o próximo flip que alguém escrever: quem monta
 * um giro de 180° num contexto `preserve-3d` precisa saber o que fazer quando o
 * Lite estiver ligado, ou a plataforma volta a entregar conteúdo espelhado.
 */

const RAIZ = join(__dirname, '..', '..')
const PASTAS = ['components', 'app', 'hooks', 'context']
const EXTENSOES = ['.tsx', '.ts']
const IGNORADAS = new Set(['node_modules', '.next', '.git', 'public'])

function arquivosDeCodigo(dir: string, acc: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    if (IGNORADAS.has(nome)) continue
    const caminho = join(dir, nome)
    if (statSync(caminho).isDirectory()) arquivosDeCodigo(caminho, acc)
    else if (EXTENSOES.some((ext) => nome.endsWith(ext))) acc.push(caminho)
  }
  return acc
}

/**
 * Assinatura de um flip 3D permanente: o palco declara `preserve-3d` e alguma
 * face fica pendurada em 180° (o estado que persiste, e por isso espelha).
 * Rotações de entrada (`rotateY: -180` animando até 0) e inclinações de
 * paralaxe (`rotateY(6deg)`) não entram — elas terminam em 0 e não deixam
 * nenhuma face virada.
 */
function ehFlipPermanente(fonte: string): boolean {
  const temPalco3D = /preserve-3d/.test(fonte)
  const temFaceVirada = /rotateY\(\s*180deg\s*\)/.test(fonte) || /rotateY:\s*180\b/.test(fonte)
  return temPalco3D && temFaceVirada
}

const globals = readFileSync(join(RAIZ, 'app', 'globals.css'), 'utf8')

describe('Modo Lite x giro 3D', () => {
  it('continua achatando o contexto 3D (é a economia que criou o problema)', () => {
    expect(globals).toMatch(/\.lite-mode \*\s*\{[^}]*transform-style:\s*flat\s*!important/)
    expect(globals).toMatch(/\.lite-mode \*\s*\{[^}]*perspective:\s*none\s*!important/)
  })

  it('todo flip 3D em componente tem caminho próprio no Modo Lite', () => {
    const comFlip = PASTAS.flatMap((pasta) => arquivosDeCodigo(join(RAIZ, pasta)))
      .map((caminho) => ({ caminho, fonte: readFileSync(caminho, 'utf8') }))
      .filter(({ fonte }) => ehFlipPermanente(fonte))

    // Se cair a zero, a assinatura acima deixou de casar com o código real e o
    // teste virou decoração — melhor falhar do que passar vazio.
    expect(comFlip.length).toBeGreaterThan(0)

    const semTratamento = comFlip
      .filter(({ fonte }) => !fonte.includes('useLiteMode'))
      .map(({ caminho }) => relative(RAIZ, caminho))

    expect(
      semTratamento,
      'flip 3D sem leitura do Modo Lite: achatado, o rotateY(180deg) espelha o conteúdo ' +
        'em vez de girá-lo. Leia useLiteMode() e troque as faces por visibilidade.',
    ).toEqual([])
  })

  it('o switch de tema (flip em CSS puro) não gira nem esconde o ícone no Lite', () => {
    // O thumb girava 180° e o ícone contra-girava outros 180°. Sem 3D o par não
    // se cancela, e o ícone (com backface-visibility: hidden) virava o verso
    // para a tela: thumb vazio no tema escuro.
    expect(globals).toMatch(
      /\.lite-mode \.theme-toggle-thumb\[data-dark='true'\]\s*\{\s*transform:\s*translateX\(var\(--thumb-travel[^;]*!important/,
    )
    expect(globals).toMatch(
      /\.lite-mode \.theme-toggle-thumb \.theme-toggle-icon[^{]*\{[^}]*backface-visibility:\s*visible\s*!important/,
    )
  })
})
