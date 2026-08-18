import { readFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * O acervo não pode voltar para o pacote do navegador.
 *
 * As 418 pranchas e os 2.382 marcadores somam 66 KB comprimidos. Eles são
 * servidos por sistema, sob demanda, via `/api/anatomia/acervo` — mas basta um
 * `import` de valor vindo de `catalogo.ts` em qualquer módulo do cliente para o
 * webpack colar o JSON inteiro de volta no pacote. Foi exatamente o que
 * aconteceu quando `flattenCollections` ainda morava lá: a área de estudo
 * baixava o acervo completo antes de pedir o sistema que o aluno abriu.
 *
 * Por isso o teste é estrutural, e não de tamanho: percorre os imports a partir
 * de cada tela do cliente e falha se algum caminho chegar ao arquivo do acervo.
 */

const RAIZ = resolve(__dirname, '../..')

/** Telas que rodam no navegador e, portanto, viram pacote baixado. */
const ENTRADAS_DO_CLIENTE = [
  'components/anatomia/atlas-experiencia.tsx',
  'components/anatomia/atlas-estudo.tsx',
  'components/anatomia/quiz-atlas.tsx',
  'components/anatomia/quiz-rodada.tsx',
  'components/anatomia/ficha-estrutura.tsx',
  'components/anatomia/prancha-interativa.tsx',
  'components/anatomia/vitrine-anatomia.tsx',
  'components/anatomia/hub-anatomia.tsx',
]

const PROIBIDO = 'data/atlas-anatomia/catalogo.json'

function resolverImport(especificador: string, deQualArquivo: string): string | null {
  // Só interessam os módulos do próprio projeto; pacotes do npm não trazem o acervo.
  const base = especificador.startsWith('@/')
    ? resolve(RAIZ, especificador.slice(2))
    : especificador.startsWith('.')
      ? resolve(dirname(deQualArquivo), especificador)
      : null
  if (!base) return null

  // `existsSync` sozinho não serve: `@/lib/utils` casa tanto com o arquivo
  // `lib/utils.ts` quanto com o diretório `lib/utils/`, e o diretório vem
  // primeiro na lista de sufixos. Aceitar só arquivo evita ler uma pasta.
  for (const sufixo of ['', '.ts', '.tsx', '.json', '/index.ts', '/index.tsx']) {
    const candidato = base + sufixo
    try {
      if (statSync(candidato).isFile()) return candidato
    } catch {
      /* não existe: tenta o próximo sufixo */
    }
  }
  return null
}

/**
 * Caminho de imports até o acervo, se existir.
 *
 * `import type` é apagado na compilação e não pesa nada, então não conta — é o
 * que permite a ficha e o quiz continuarem tipados pelo formato do acervo sem
 * carregar o acervo.
 */
function caminhoAteOAcervo(arquivo: string, visitados = new Set<string>(), trilha: string[] = []): string[] | null {
  if (visitados.has(arquivo)) return null
  visitados.add(arquivo)

  const proprio = [...trilha, arquivo.replace(RAIZ + '/', '')]
  if (arquivo.endsWith(PROIBIDO)) return proprio

  const fonte = readFileSync(arquivo, 'utf8')
  const importes = [...fonte.matchAll(/^\s*import\s+(type\s+)?([\s\S]*?)from\s+'([^']+)'/gm)]

  for (const [, tipoNaFrente, corpo, especificador] of importes) {
    // `import { type Foo } from` também some na compilação; só segue o que sobra.
    const somenteTipos = !!tipoNaFrente || (corpo.includes('{') && /\{[^}]*\}/.test(corpo) &&
      corpo
        .replace(/[\s\S]*?\{([\s\S]*?)\}[\s\S]*/, '$1')
        .split(',')
        .filter(parte => parte.trim())
        .every(parte => parte.trim().startsWith('type ')) &&
      !corpo.replace(/\{[\s\S]*?\}/, '').replace(/,/g, '').trim())
    if (somenteTipos) continue

    const destino = resolverImport(especificador, arquivo)
    if (!destino) continue
    const achado = caminhoAteOAcervo(destino, visitados, proprio)
    if (achado) return achado
  }

  return null
}

describe('peso do pacote de Domine Anatomia', () => {
  it.each(ENTRADAS_DO_CLIENTE)('%s não arrasta o acervo para o navegador', entrada => {
    const caminho = caminhoAteOAcervo(resolve(RAIZ, entrada))
    expect(caminho, caminho ? `import de valor até o acervo:\n  ${caminho.join('\n  → ')}` : '').toBeNull()
  })

  it('o acervo continua vivo, e num módulo só', () => {
    // A contrapartida: o servidor precisa do arquivo inteiro para servir por
    // sistema. Se este import sumir, o endpoint do acervo ficou sem dado.
    const catalogo = readFileSync(resolve(RAIZ, 'lib/atlas-anatomia/catalogo.ts'), 'utf8')
    expect(catalogo).toContain(PROIBIDO.replace('data/', '@/data/'))
  })
})
