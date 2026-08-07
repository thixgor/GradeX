import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { MODULOS_DE_LABORATORIO } from '@/lib/histologia/laboratorio'
import { BASE, rotaDaPagina } from '@/lib/histologia/rotas'

const RAIZ = path.resolve(__dirname, '../..')
const DADOS = path.join(RAIZ, 'data/histologia')

function arquivosDoModulo(): string[] {
  const alvos = ['components/histologia', 'app/manual-clinico/histologia', 'lib/histologia']
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

const ARQUIVOS = arquivosDoModulo()
const FONTES = new Map(ARQUIVOS.map((a) => [path.relative(RAIZ, a), readFileSync(a, 'utf8')]))

describe('rotas declaradas na interface existem no currículo', () => {
  const rotas = new Set<string>()
  for (const arquivo of readdirSync(path.join(DADOS, 'paginas'))) {
    const conteudo = JSON.parse(readFileSync(path.join(DADOS, 'paginas', arquivo), 'utf8'))
    Object.keys(conteudo).forEach((r) => rotas.add(r))
  }

  /**
   * A home aponta para trilhas e para uma lâmina de abertura por caminho
   * literal. Se uma reingestão mudar um slug, o link vira 404 silencioso — a
   * home continua bonita e o botão principal não leva a lugar nenhum.
   */
  it('a lâmina de abertura e as trilhas da home existem', () => {
    const home = FONTES.get('app/manual-clinico/histologia/page.tsx')!
    const caminhos = [...home.matchAll(/destino: \[([^\]]+)\]|ROTA_HERO = \[([^\]]+)\]/g)].map((m) =>
      (m[1] ?? m[2])
        .split(',')
        .map((s) => s.trim().replace(/^'|'$/g, ''))
        .filter(Boolean)
        .join('/'),
    )
    expect(caminhos.length).toBeGreaterThanOrEqual(4)
    for (const caminho of caminhos) {
      expect(rotas.has(caminho), `rota inexistente referenciada na home: ${caminho}`).toBe(true)
    }
  })

  it('todo módulo de laboratório tem componente correspondente', () => {
    const pagina = FONTES.get('app/manual-clinico/histologia/laboratorio/[modulo]/page.tsx')!
    for (const modulo of MODULOS_DE_LABORATORIO) {
      expect(pagina, `módulo sem caso no switch: ${modulo.id}`).toContain(`case '${modulo.id}'`)
    }
  })

  it('os construtores de rota montam caminhos sob o módulo', () => {
    expect(BASE).toBe('/manual-clinico/histologia')
    expect(rotaDaPagina(['tecidos', 'epitelio'])).toBe(`${BASE}/tecidos/epitelio`)
    expect(rotaDaPagina('tecidos/epitelio')).toBe(`${BASE}/tecidos/epitelio`)
  })
})

describe('acessibilidade — verificações estáticas', () => {
  /**
   * Estas checagens não substituem auditoria com leitor de tela; elas travam os
   * erros que reaparecem sozinhos quando alguém edita um componente com pressa.
   */

  it('nenhum ícone decorativo fica sem aria-hidden', () => {
    // Ícones do lucide sempre acompanham texto ou um aria-label no elemento
    // pai; anunciá-los duplicaria a leitura.
    for (const [nome, fonte] of FONTES) {
      if (!nome.endsWith('.tsx')) continue
      const icones = [...fonte.matchAll(/<([A-Z][A-Za-z0-9]*)\s+className="[^"]*h-[^"]*"([^>]*)>/g)]
      for (const [, componente, resto] of icones) {
        // Componentes próprios (Logo…, Estado…) não são ícones.
        if (!/^(Arrow|Chevron|Check|X|Search|Star|Clock|Layers|Target|Eye|Zoom|Rotate|Move|Sun|Contrast|Crosshair|Maximize|Minimize|Keyboard|Microscope|Flask|List|Book|Pencil|Timer|Alert|Play|Trophy|Trash|Download|History|Sparkles|Columns|Loader|Folder|Play)/.test(componente)) {
          continue
        }
        expect(
          /aria-hidden/.test(resto),
          `${nome}: <${componente}> decorativo sem aria-hidden`,
        ).toBe(true)
      }
    }
  })

  it('todo alvo de toque interativo tem altura mínima confortável', () => {
    // WCAG 2.2 AA (2.5.8) pede 24×24 CSS px; adotamos 36 px como piso interno e
    // 44 px nos alvos primários.
    for (const [nome, fonte] of FONTES) {
      if (!nome.endsWith('.tsx')) continue
      const botoes = [...fonte.matchAll(/<button\b[^>]*className="([^"]+)"/g)]
      for (const [, classes] of botoes) {
        const temAltura =
          /min-h-\[(3[6-9]|[4-9]\d)px\]/.test(classes) ||
          /\bh-(9|10|11|12|14)\b/.test(classes) ||
          /\bh-8 w-(7|8)\b/.test(classes) || // botões de remover, dentro de alvo maior
          /\bh-9 w-9\b/.test(classes)
        expect(temAltura, `${nome}: botão sem altura de alvo declarada — "${classes.slice(0, 70)}"`).toBe(
          true,
        )
      }
    }
  })

  it('nenhum estado é comunicado apenas por cor', () => {
    // Onde há `aria-pressed`, precisa haver também rótulo, ícone ou marcador
    // textual mudando junto. Verificamos a presença dos marcadores usados.
    const microscopio = FONTES.get('components/histologia/microscopio.tsx')!
    expect(microscopio).toContain("{ativo ? '●' : '○'}")
    const busca = FONTES.get('components/histologia/busca.tsx')!
    expect(busca).toContain("{ativo ? '●' : '○'}")
  })

  it('as alternativas do quiz são controles de formulário reais', () => {
    const quiz = FONTES.get('components/histologia/quiz.tsx')!
    // Um `<button>` estilizado não é anunciado como "opção 2 de 5".
    expect(quiz).toContain("role={questao.multipla ? 'group' : 'radiogroup'}")
    expect(quiz).toContain("type={questao.multipla ? 'checkbox' : 'radio'}")
  })

  it('o palco do microscópio é operável por teclado e descrito', () => {
    const microscopio = FONTES.get('components/histologia/microscopio.tsx')!
    expect(microscopio).toContain('tabIndex={0}')
    expect(microscopio).toContain('onKeyDown={aoTeclar}')
    expect(microscopio).toContain('aria-describedby')
    expect(microscopio).toContain('focus-visible:ring')
    // As setas precisam existir como caso no manipulador.
    for (const tecla of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) {
      expect(microscopio).toContain(`case '${tecla}'`)
    }
  })

  it('o painel de atalhos prende e devolve o foco', () => {
    const microscopio = FONTES.get('components/histologia/microscopio.tsx')!
    expect(microscopio).toContain("role=\"dialog\"")
    expect(microscopio).toContain('aria-modal="true"')
    expect(microscopio).toContain("e.key === 'Escape'")
    // Devolve o foco ao elemento anterior no desmonte.
    expect(microscopio).toContain('anterior?.focus?.()')
  })

  it('o zoom da página não é sequestrado', () => {
    const microscopio = FONTES.get('components/histologia/microscopio.tsx')!
    // Ctrl+roda é o zoom do navegador e precisa continuar sendo.
    expect(microscopio).toContain('if (evento.ctrlKey) return')
  })
})

describe('nenhuma promessa que os dados não sustentam', () => {
  it('a barra de escala em µm exige calibração', () => {
    const viewport = readFileSync(path.join(RAIZ, 'lib/histologia/viewport.ts'), 'utf8')
    expect(viewport).toContain('if (!calibracao) return null')
    // E o microscópio declara a ausência em vez de desenhar régua falsa.
    const microscopio = FONTES.get('components/histologia/microscopio.tsx')!
    expect(microscopio).toContain('sem calibração métrica no acervo')
  })

  it('o foco simulado é rotulado como simulado', () => {
    const microscopio = FONTES.get('components/histologia/microscopio.tsx')!
    expect(microscopio).toContain('nota="simulado"')
  })

  it('nenhum arquivo do módulo usa iframe', () => {
    for (const [nome, fonte] of FONTES) {
      expect(/<iframe/i.test(fonte), `${nome} usa iframe`).toBe(false)
    }
  })

  it('nenhum arquivo do módulo carrega o runtime do H5P', () => {
    for (const [nome, fonte] of FONTES) {
      expect(/H5P\.|h5p-standalone|h5p\.js/i.test(fonte), `${nome} referencia o player H5P`).toBe(
        false,
      )
    }
  })
})

describe('privacidade da telemetria', () => {
  /**
   * O tipo `Evento` é uma união fechada de campos categóricos. Este teste trava
   * a propriedade que importa: nenhum evento carrega texto livre — nem termo de
   * busca, nem nota, nem resposta.
   */
  it('nenhum evento tem campo de texto livre', () => {
    const analitica = readFileSync(path.join(RAIZ, 'lib/histologia/analitica.ts'), 'utf8')
    const uniao = analitica.slice(analitica.indexOf('export type Evento'), analitica.indexOf('export type FaixaDeResultados'))
    for (const proibido of ['termo', 'consulta', 'texto', 'nota', 'resposta', 'query', 'email']) {
      expect(uniao.includes(`${proibido}:`), `evento carrega campo "${proibido}"`).toBe(false)
    }
  })

  it('a busca só registra categoria e faixa', () => {
    const busca = FONTES.get('components/histologia/busca.tsx')!
    // Recorta exatamente o literal passado a `registrarEvento` — nada além
    // dele. A primeira versão deste teste pegava o array de dependências do
    // `useCallback` logo abaixo e acusava falso positivo.
    const inicio = busca.indexOf("nome: 'busca_executada'")
    const carga = busca.slice(inicio, busca.indexOf('})', inicio))
    expect(carga).toContain('escopo:')
    expect(carga).toContain('faixa:')
    // O termo digitado não pode aparecer na carga sob nenhum nome.
    for (const proibido of ['termo', 'q:', 'consulta', 'texto']) {
      expect(carga.includes(proibido), `carga do evento contém "${proibido}"`).toBe(false)
    }
  })

  it('o caderno nunca é enviado a lugar nenhum', () => {
    const progresso = readFileSync(path.join(RAIZ, 'lib/histologia/progresso.ts'), 'utf8')
    expect(progresso).not.toMatch(/fetch\(|navigator\.sendBeacon|axios/)
  })
})
