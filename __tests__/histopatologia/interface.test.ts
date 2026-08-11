import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  BASE,
  BASE_HISTOLOGIA,
  rotaDaDoenca,
  rotaDaEntradaCatalogada,
  rotaDeComparacao,
  rotaDoCapituloWebPathUtah,
  rotaDoMecanismo,
  rotaDoSistema,
  rotaNormal,
} from '@/lib/histopatologia/rotas'
import { MARCA_DE_DIREITOS, MARCA_DE_PESO, MARCA_DE_REVISAO, visivelEm } from '@/components/histopatologia/tema'

/**
 * Verificações estáticas sobre o código da interface.
 *
 * Elas não substituem auditoria com leitor de tela nem revisão visual; travam os
 * erros que reaparecem sozinhos quando alguém edita um componente com pressa —
 * e, sobretudo, travam as três regras que este módulo não pode perder: nenhuma
 * imagem baixada, nenhum proxy do Next, crédito junto de cada mídia.
 */

const RAIZ = path.resolve(__dirname, '../..')

function arquivosDoModulo(): string[] {
  const alvos = [
    'components/histopatologia',
    'app/manual-clinico/histologia/histopatologia',
    'app/api/manual-clinico/histopatologia',
    'lib/histopatologia',
  ]
  const saida: string[] = []
  const varrer = (dir: string) => {
    for (const nome of readdirSync(dir)) {
      const completo = path.join(dir, nome)
      if (statSync(completo).isDirectory()) varrer(completo)
      else if (/\.(ts|tsx)$/.test(nome) && !nome.endsWith('.gerado.ts')) saida.push(completo)
    }
  }
  alvos.forEach((a) => varrer(path.join(RAIZ, a)))
  return saida
}

/**
 * Remove comentários antes das verificações estritas.
 *
 * Sem isto, o teste que proíbe `/_next/image` falharia justamente no arquivo que
 * **explica** por que não se usa `/_next/image` — e a correção natural seria
 * apagar a explicação. Verificar código é o objetivo; a documentação que cita a
 * proibição é parte da defesa, não uma violação dela.
 */
function semComentarios(fonte: string): string {
  return fonte.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ')
}

const ARQUIVOS = arquivosDoModulo()
const FONTES = new Map(
  ARQUIVOS.map((a) => [path.relative(RAIZ, a).split(path.sep).join('/'), readFileSync(a, 'utf8')]),
)
const CODIGO = new Map([...FONTES].map(([nome, fonte]) => [nome, semComentarios(fonte)]))
const PIPELINE = semComentarios(
  readFileSync(path.join(RAIZ, 'scripts/histopatologia/construir-dados.mjs'), 'utf8'),
)

describe('nenhuma imagem é baixada, copiada ou reprocessada', () => {
  it('nenhum arquivo do módulo usa next/image', () => {
    for (const [nome, fonte] of FONTES) {
      expect(/from ['"]next\/image['"]/.test(fonte), `${nome} importa next/image`).toBe(false)
      expect(/<Image[\s/>]/.test(fonte), `${nome} usa <Image>`).toBe(false)
    }
  })

  it('nenhum arquivo do módulo aponta para o otimizador /_next/image', () => {
    for (const [nome, codigo] of CODIGO) {
      expect(codigo.includes('/_next/image'), `${nome} usa o otimizador do Next`).toBe(false)
    }
  })

  it('nenhum componente busca mídia remota no servidor', () => {
    for (const [nome, codigo] of CODIGO) {
      if (!nome.startsWith('components/')) continue
      expect(/fetch\(\s*['"`]https?:/.test(codigo), `${nome} faz fetch remoto`).toBe(false)
    }
  })

  it('o pipeline não faz requisição de rede nem manipula bytes de imagem', () => {
    expect(/\bfetch\s*\(/.test(PIPELINE)).toBe(false)
    expect(/from ['"]node:https?['"]|require\(['"]https?['"]\)/.test(PIPELINE)).toBe(false)
    expect(/\b(sharp|jimp|image-size)\b/.test(PIPELINE)).toBe(false)
    expect(PIPELINE).toContain('Nenhuma imagem foi baixada, copiada ou armazenada')
  })

  it('nenhum arquivo do módulo escreve em Vercel Blob ou CDN próprio', () => {
    for (const [nome, codigo] of CODIGO) {
      expect(/@vercel\/blob|uploadToBlob/.test(codigo), `${nome} envia arquivo`).toBe(false)
    }
  })
})

describe('a mídia remota só monta <img> quando os direitos permitem', () => {
  const componente = CODIGO.get('components/histopatologia/imagem-remota.tsx')!

  it('o único <img> do módulo está atrás da guarda de incorporação', () => {
    // Elemento JSX real: início de linha. Menções em prosa não contam.
    const comImg = [...CODIGO.entries()].filter(([, codigo]) => /^\s*<img\b/m.test(codigo))
    expect(comImg.map(([nome]) => nome)).toEqual(['components/histopatologia/imagem-remota.tsx'])
    // A guarda precede o elemento no arquivo.
    expect(componente.indexOf('podeIncorporar(midia)')).toBeLessThan(componente.indexOf('<img'))
    expect(componente).toContain('{incorporar ? (')
  })

  it('a guarda exige estado autorizado e URL presente', () => {
    const midia = FONTES.get('lib/histopatologia/midia.ts')!
    expect(midia).toContain('permiteIncorporacao(midia.estadoDeDireitos) && Boolean(midia.urlImagem)')
    // E a URL só entra no DTO quando o estado permite.
    expect(midia).toContain('const podeApontar = permiteLinkDireto(decisao.estado)')
    expect(midia).toContain('urlImagem: podeApontar ?')
    expect(midia).toContain('urlVisualizador: podeApontar ?')
  })

  it('o <img> declara carregamento tardio, decodificação assíncrona e referrer restrito', () => {
    expect(componente).toContain('loading="lazy"')
    expect(componente).toContain('decoding="async"')
    expect(componente).toContain('referrerPolicy="strict-origin-when-cross-origin"')
  })

  it('o espaço da imagem é reservado antes de qualquer carregamento', () => {
    expect(componente).toMatch(/aspect-\[4\/3\]/)
  })

  it('há fallback com descrição e erro recuperável', () => {
    expect(componente).toContain('onError={() => setFalhou(true)}')
    expect(componente).toContain('A imagem não carregou')
    expect(componente).toContain('Fonte e crédito')
  })

  it('a abertura principal acontece no visualizador do Domine Aqui', () => {
    expect(componente).toContain('Abrir no Domine Aqui')
    expect(componente).toContain('role="dialog"')
    expect(componente).toContain('aria-modal="true"')
    expect(componente).not.toContain('Abrir imagem na fonte')
  })

  it('o crédito fica na mesma unidade visual da mídia', () => {
    // A `<figcaption>` do cartão precisa conter o crédito curto — a página geral
    // de créditos é complementar, nunca substituta.
    const legenda = componente.slice(componente.indexOf('<figcaption'))
    expect(legenda).toContain('{midia.creditoCurto}')
    expect(legenda).toContain('{midia.modalidade}')
    expect(legenda).toContain('{midia.nomeCatalogado}')
  })

  it('descrição catalogada é sinalizada como não revisada', () => {
    expect(componente).toContain('AVISO_DESCRICAO')
  })
})

describe('nenhum HTML de terceiro é renderizado', () => {
  it('dangerouslySetInnerHTML só aparece para JSON-LD montado por buildJsonLd', () => {
    for (const [nome, fonte] of FONTES) {
      const usos = [...fonte.matchAll(/dangerouslySetInnerHTML=\{\{\s*__html:\s*([^}]+)\}\}/g)]
      for (const [, expressao] of usos) {
        expect(expressao.includes('buildJsonLd'), `${nome}: HTML não escapado`).toBe(true)
      }
    }
  })

  it('nenhum arquivo do módulo usa iframe', () => {
    for (const [nome, fonte] of FONTES) {
      expect(/<iframe/i.test(fonte), `${nome} usa iframe`).toBe(false)
    }
  })
})

describe('acessibilidade — verificações estáticas', () => {
  it('nenhum ícone decorativo fica sem aria-hidden', () => {
    for (const [nome, fonte] of FONTES) {
      if (!nome.endsWith('.tsx')) continue
      const icones = [...fonte.matchAll(/<([A-Z][A-Za-z0-9]*)\s+className="[^"]*h-[^"]*"([^>]*)>/g)]
      for (const [, componente, resto] of icones) {
        if (
          !/^(Alert|Arrow|Calendar|Check|Chevron|Columns|External|Eye|Filter|Image|Layers|Library|Loader|Microscope|Scroll|Search|Shield|Stethoscope|User|X)/.test(
            componente,
          )
        ) {
          continue
        }
        expect(
          /aria-hidden|aria-label/.test(resto),
          `${nome}: <${componente}> sem aria-hidden nem aria-label`,
        ).toBe(true)
      }
    }
  })

  it('todo botão declara altura mínima de alvo de toque', () => {
    for (const [nome, fonte] of FONTES) {
      if (!nome.endsWith('.tsx')) continue
      for (const [, classes] of fonte.matchAll(/<button\b[^>]*className=[`"]([^`"]+)[`"]/g)) {
        const temAltura =
          /min-h-\[(3[6-9]|[4-9]\d)px\]/.test(classes) ||
          /\bh-(9|10|11|12|14)\b/.test(classes) ||
          /\bh-9 w-9\b/.test(classes)
        expect(
          temAltura,
          `${nome}: botão sem altura de alvo — "${classes.slice(0, 70)}"`,
        ).toBe(true)
      }
    }
  })

  it('nenhum estado é comunicado apenas por cor', () => {
    // Todo `aria-pressed` do módulo vem acompanhado de um marcador textual.
    for (const [nome, fonte] of FONTES) {
      if (!fonte.includes('aria-pressed')) continue
      expect(fonte.includes("{ativo ? '●' : '○'}"), `${nome}: estado só por cor`).toBe(true)
    }
    // E as marcas de estado carregam rótulo e símbolo, não só classe de cor.
    for (const marca of [
      ...Object.values(MARCA_DE_REVISAO),
      ...Object.values(MARCA_DE_DIREITOS),
      ...Object.values(MARCA_DE_PESO),
    ]) {
      expect(marca.rotulo.length).toBeGreaterThan(2)
      expect(marca.simbolo.length).toBeGreaterThan(0)
    }
  })

  it('a cadeia causal também existe como lista textual ordenada', () => {
    const cadeia = FONTES.get('components/histopatologia/cadeia-fisiopatologica.tsx')!
    expect(cadeia).toContain('<ol')
    // O trilho vertical é decoração sobre a lista, não a estrutura.
    expect(cadeia).toContain('aria-hidden')
    expect(cadeia).not.toContain('<svg')
  })

  it('as tabelas comparativas têm cabeçalho de linha e de coluna', () => {
    const tabela = FONTES.get('components/histopatologia/tabela-normal-patologico.tsx')!
    expect(tabela).toContain('scope="col"')
    expect(tabela).toContain('scope="row"')
    expect(tabela).toContain('<caption')
  })

  it('as alternativas da autoavaliação são controles de formulário reais', () => {
    const auto = FONTES.get('components/histopatologia/autoavaliacao.tsx')!
    expect(auto).toContain('<fieldset>')
    expect(auto).toContain('<legend')
    expect(auto).toContain('type="radio"')
  })

  it('conteúdo oculto pelo seletor de profundidade não fica no DOM', () => {
    const seletor = CODIGO.get('components/histopatologia/seletor-profundidade.tsx')!
    expect(seletor).toContain('return null')
    // `aria-hidden` é legítimo; esconder a seção com CSS não é.
    expect(seletor).not.toMatch(/className="[^"]*\bhidden\b|display:\s*none/)
  })

  it('animações respeitam prefers-reduced-motion', () => {
    for (const [nome, fonte] of FONTES) {
      for (const [, classes] of fonte.matchAll(/className="([^"]*animate-[a-z]+[^"]*)"/g)) {
        expect(
          /motion-reduce:/.test(classes),
          `${nome}: animação sem variante motion-reduce — "${classes.slice(0, 60)}"`,
        ).toBe(true)
      }
    }
  })

  it('toda galeria e paginação tem nome acessível próprio', () => {
    const galeria = FONTES.get('components/histopatologia/galeria-remota.tsx')!
    expect(galeria).toContain('aria-label={titulo}')
    expect(galeria).toContain('aria-label={`Paginação — ${titulo}`}')
  })
})

describe('desempenho e volume', () => {
  it('a galeria pagina em vez de renderizar tudo', () => {
    const galeria = FONTES.get('components/histopatologia/galeria-remota.tsx')!
    expect(galeria).toContain('MIDIAS_POR_PAGINA')
    expect(galeria).toContain('.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina)')
  })

  it('a home não importa inventário nem índice de servidor', () => {
    const home = FONTES.get('app/manual-clinico/histologia/histopatologia/page.tsx')!
    expect(home).not.toContain('obterInventario')
    expect(home).not.toContain('busca-servidor')
    expect(home).not.toContain('indiceDeBuscaDoServidor')
  })

  it('a página de doença carrega apenas o fragmento da doença', () => {
    const pagina = FONTES.get(
      'app/manual-clinico/histologia/histopatologia/doencas/[slug]/page.tsx',
    )!
    expect(pagina).toContain('obterDoenca')
    expect(pagina).not.toContain('obterInventario')
    expect(pagina).not.toContain('busca-servidor')
  })

  it('o índice de servidor só é importado por rota de API', () => {
    for (const [nome, fonte] of FONTES) {
      if (!fonte.includes('busca-servidor.json')) continue
      expect(
        nome.startsWith('app/api/') || nome.startsWith('lib/'),
        `${nome} importa o índice completo fora de uma rota de servidor`,
      ).toBe(true)
    }
  })

  it('componentes de cliente não importam o repositório server-only', () => {
    for (const [nome, fonte] of FONTES) {
      if (!fonte.startsWith("'use client'")) continue
      const codigo = CODIGO.get(nome)!
      for (const proibido of ['repositorio', 'acervo']) {
        expect(
          new RegExp(`from ['"]@/lib/histopatologia/${proibido}['"]`).test(codigo),
          `${nome} é cliente e importa ${proibido}`,
        ).toBe(false)
      }
    }
  })

  it('nenhuma rota pré-renderiza o catálogo inteiro', () => {
    for (const [nome, codigo] of CODIGO) {
      if (!nome.endsWith('page.tsx')) continue
      if (!/export function generateStaticParams/.test(codigo)) continue
      // Só sistemas e mecanismos — conjuntos de 14 itens — são pré-renderizados.
      expect(
        /sistemas\/\[sistema\]|mecanismos\/\[id\]/.test(nome),
        `${nome} declara generateStaticParams`,
      ).toBe(true)
    }
  })
})

describe('rotas', () => {
  it('os construtores montam caminhos sob o módulo', () => {
    expect(BASE).toBe('/manual-clinico/histologia/histopatologia')
    expect(BASE_HISTOLOGIA).toBe('/manual-clinico/histologia')
    expect(rotaDaDoenca('apendicite-aguda')).toBe(`${BASE}/doencas/apendicite-aguda`)
    expect(rotaDoSistema('gastrointestinal')).toBe(`${BASE}/sistemas/gastrointestinal`)
    expect(rotaDoMecanismo('inflamacao-aguda')).toBe(`${BASE}/mecanismos/inflamacao-aguda`)
    expect(rotaDoCapituloWebPathUtah('renal')).toBe(`${BASE}/atlas/webpath-utah/renal`)
    expect(rotaNormal(['tecidos', 'epitelio'])).toBe(`${BASE_HISTOLOGIA}/tecidos/epitelio`)
    expect(rotaDeComparacao('apendicite-aguda', ['a', 'b'])).toBe(
      `${BASE}/comparar/apendicite-aguda/a/b`,
    )
  })

  it('o id catalogado é codificado na URL', () => {
    // Os ids do catálogo são seguros hoje, mas a codificação é o que garante que
    // um id novo com caractere especial não quebre a rota nem escape dela.
    expect(rotaDaEntradaCatalogada('unicamp-a b')).toBe(`${BASE}/atlas/unicamp-a%20b`)
  })

  it('existe um arquivo de rota para cada superfície prometida', () => {
    const raiz = path.join(RAIZ, 'app/manual-clinico/histologia/histopatologia')
    for (const relativo of [
      'layout.tsx',
      'page.tsx',
      'atlas/page.tsx',
      'atlas/[id]/page.tsx',
      'mecanismos/page.tsx',
      'mecanismos/[id]/page.tsx',
      'sistemas/[sistema]/page.tsx',
      'doencas/[slug]/page.tsx',
      'comparar/[...slugs]/page.tsx',
      'creditos/page.tsx',
      'webpath-utah/page.tsx',
      'webpath-utah/[capitulo]/page.tsx',
      'atlas/webpath-utah/[capitulo]/page.tsx',
    ]) {
      expect(statSync(path.join(raiz, relativo)).isFile(), relativo).toBe(true)
    }
  })

  it('o portão do módulo devolve 404 seco, sem anunciar o motivo', () => {
    const layout = FONTES.get('app/manual-clinico/histologia/histopatologia/layout.tsx')!
    expect(layout).toContain('histopatologiaHabilitada()')
    expect(layout).toContain('notFound()')
    // O motivo vai para o log do servidor, não para a resposta.
    expect(layout).toContain('console.warn')
  })

  it('o comparador recusa pares que a edição não afirmou', () => {
    const comparar = FONTES.get(
      'app/manual-clinico/histologia/histopatologia/comparar/[...slugs]/page.tsx',
    )!
    expect(comparar).toContain('histologiaNormalDeReferencia.find')
    expect(comparar).toContain('if (!referencia) notFound()')
  })
})

describe('integração com a Histologia normal', () => {
  it('a home da Histologia oferece a escolha entre normal e patológico', () => {
    const home = readFileSync(
      path.join(RAIZ, 'app/manual-clinico/histologia/page.tsx'),
      'utf8',
    )
    expect(home).toContain('Histopatologia')
    expect(home).toContain(`${'${BASE}'}/histopatologia`)
    expect(home).toContain('Comparar normal × patológico')
  })

  it('as páginas do currículo normal listam as doenças relacionadas', () => {
    const pagina = readFileSync(
      path.join(RAIZ, 'app/manual-clinico/histologia/[...slug]/page.tsx'),
      'utf8',
    )
    expect(pagina).toContain('doencasRelacionadasA(params.slug)')
    // Nos dois ramos: nó de índice e lâmina.
    expect(pagina.match(/<DoencasRelacionadas/g)?.length).toBe(2)
  })

  it('o bloco de doenças relacionadas some por completo quando não há vínculo', () => {
    const bloco = FONTES.get('components/histopatologia/doencas-relacionadas.tsx')!
    expect(bloco).toContain('if (doencas.length === 0) return null')
  })
})

describe('níveis de profundidade', () => {
  it('avançado inclui o essencial, e essencial não inclui o avançado', () => {
    expect(visivelEm('essencial', 'essencial')).toBe(true)
    expect(visivelEm('essencial', 'avancado')).toBe(true)
    expect(visivelEm('aprofundar', 'essencial')).toBe(false)
    expect(visivelEm('avancado', 'aprofundar')).toBe(false)
  })
})
