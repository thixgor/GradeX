import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  ALTERACOES_REALIZADAS,
  AUTORIZACAO,
  CREDITO_BASE,
  LICENCA,
  PENDENCIA_NAO_COMERCIAL,
  histologiaEhPrivativa,
  licencaPermitePublicar,
  pendenciaDeLicenca,
  podeIndexar,
} from '@/lib/histologia/licenca'

const RAIZ = path.resolve(__dirname, '../..')
const ACERVO = path.join(RAIZ, 'public/Manual-Histologia')

describe('portão de licença', () => {
  /**
   * O teste que impede o acidente mais caro deste módulo: publicar conteúdo
   * CC BY-NC-SA atrás do paywall do Domine Aqui. Enquanto `AUTORIZACAO.decisao` for
   * 'pendente', nada disso pode ir a produção nem ser indexado.
   *
   * Quando a decisão for registrada (ver docs/adr/0001), este teste passa a
   * exigir responsável e data — não basta trocar a string.
   */
  it('sem decisão registrada, não publica nem indexa em produção', () => {
    if (AUTORIZACAO.decisao === 'pendente') {
      expect(licencaPermitePublicar()).toBe(false)
      expect(podeIndexar()).toBe(false)
      expect(pendenciaDeLicenca()).toContain('Portão de licença pendente')
      return
    }
    // Decisão registrada: exige rastreabilidade completa.
    expect(AUTORIZACAO.responsavel.length).toBeGreaterThan(0)
    expect(AUTORIZACAO.registradoEm).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    if (AUTORIZACAO.decisao === 'autorizacao-escrita-arquivada') {
      expect(AUTORIZACAO.documento).toBeTruthy()
    }
  })

  it('preserva os titulares e a licença exatos do acervo', () => {
    expect(LICENCA.identificador).toBe('CC BY-NC-SA 4.0')
    expect(LICENCA.titulares).toContain('Digital Histology')
    expect(LICENCA.titulares.some((t) => t.includes('Virginia Commonwealth'))).toBe(true)
    expect(CREDITO_BASE).toContain('Digital Histology')
    expect(CREDITO_BASE).toContain('CC BY-NC-SA 4.0')
  })

  it('declara as alterações de forma específica, como a cláusula BY exige', () => {
    expect(ALTERACOES_REALIZADAS.length).toBeGreaterThanOrEqual(4)
    // "Adaptamos o conteúdo" não cumpre a licença; listar o que foi feito, sim.
    for (const alteracao of ALTERACOES_REALIZADAS) {
      expect(alteracao.length).toBeGreaterThan(40)
    }
  })

  /**
   * O módulo passou a ser privativo em 2026-08-13 (ADR 0003). A cláusula
   * NãoComercial **não** foi resolvida por isso — foi assumida como risco pelo
   * responsável pelo produto.
   *
   * Este teste substitui o antigo "nenhum acoplamento a fluxo pago". O que ele
   * defende agora não é a gratuidade, e sim que o risco continue *declarado*:
   * enquanto houver paywall sem autorização escrita arquivada, a pendência tem
   * de existir por escrito no código, com data e responsável. Quando a
   * autorização chegar, a decisão vira 'autorizacao-escrita-arquivada', o
   * documento passa a ser obrigatório e a pendência some sozinha.
   */
  it('paywall sem autorização escrita mantém a pendência NãoComercial declarada', () => {
    if (!histologiaEhPrivativa()) {
      expect(PENDENCIA_NAO_COMERCIAL).toBeNull()
      return
    }
    expect(AUTORIZACAO.documento).toBeNull()
    expect(PENDENCIA_NAO_COMERCIAL).toBeTruthy()
    expect(PENDENCIA_NAO_COMERCIAL).toContain('CC BY-NC-SA')
    expect(PENDENCIA_NAO_COMERCIAL).toContain(AUTORIZACAO.registradoEm)
    // Quem herdar isto precisa achar o caminho de volta sem arqueologia.
    expect(AUTORIZACAO.observacao).toContain('lib/histologia/acesso.ts')
  })
})

describe('portão de assinatura num único ponto', () => {
  /**
   * Antes, este bloco varria o módulo proibindo qualquer símbolo de cobrança —
   * a gratuidade era estrutural. Com o módulo privativo, a invariante muda de
   * natureza mas não de espírito: o acesso pago pode existir, **num lugar só**.
   *
   * O que isso compra: reverter a decisão (ou trocar a regra de quem entra) é
   * mexer em `lib/histologia/acesso.ts` e mais nada. Uma checagem copiada para
   * dentro de uma página é exatamente o que faz um paywall sobreviver à decisão
   * de removê-lo.
   */
  const SIMBOLOS_DE_ACESSO = [
    'useAcessoTomografia',
    'PLUS_LABEL',
    'manual-clinico/checkout',
    'hasFullAccess',
    'account-tier',
    'getManualClinicoAccess',
  ]

  /**
   * Os únicos arquivos autorizados a falar de acesso pago. As rotas de dados
   * só perguntam ao portão (`verificarAcessoAHistologia`,
   * `histologiaLiberadaNaRequisicao`).
   */
  const AUTORIZADOS = ['lib/histologia/licenca.ts', 'lib/histologia/acesso.ts', 'components/histologia/vitrine.tsx']

  const alvos = [
    'lib/histologia',
    'components/histologia',
    'app/manual-clinico/histologia',
    'app/api/manual-clinico/histologia',
  ]

  it('só o portão e a vitrine tocam em acesso pago', async () => {
    const { readdirSync, statSync, existsSync } = await import('node:fs')
    const arquivos: string[] = []
    const varrer = (dir: string) => {
      if (!existsSync(dir)) return
      for (const nome of readdirSync(dir)) {
        const completo = path.join(dir, nome)
        if (statSync(completo).isDirectory()) varrer(completo)
        else if (/\.(ts|tsx)$/.test(nome)) arquivos.push(completo)
      }
    }
    alvos.forEach((a) => varrer(path.join(RAIZ, a)))
    expect(arquivos.length).toBeGreaterThan(0)

    for (const arquivo of arquivos) {
      const relativo = path.relative(RAIZ, arquivo).split(path.sep).join('/')
      if (AUTORIZADOS.includes(relativo)) continue
      const conteudo = readFileSync(arquivo, 'utf8')
      for (const simbolo of SIMBOLOS_DE_ACESSO) {
        expect(
          conteudo.includes(simbolo),
          `${relativo} referencia "${simbolo}" — o portão deve viver só em lib/histologia/acesso.ts`,
        ).toBe(false)
      }
    }
  })

  const relativoDe = (completo: string) => path.relative(RAIZ, completo).split(path.sep).join('/')

  async function arquivos(dir: string, nome: string): Promise<string[]> {
    const { readdirSync, statSync } = await import('node:fs')
    const saida: string[] = []
    const varrer = (atual: string) => {
      for (const item of readdirSync(atual)) {
        const completo = path.join(atual, item)
        if (statSync(completo).isDirectory()) varrer(completo)
        else if (item === nome) saida.push(completo)
      }
    }
    varrer(path.join(RAIZ, dir))
    return saida
  }

  /**
   * O erro que esta forma de portão permite cometer.
   *
   * O portão não pode ficar no layout: no App Router a árvore da página é prop
   * de um componente de cliente, então ela renderiza e vai serializada no
   * payload RSC mesmo quando o layout devolve outra coisa — o HTML mostra a
   * vitrine e o `<script>` seguinte entrega a lâmina. Foi medido.
   *
   * Por isso toda página do módulo é um **casco estático**: não lê a sessão,
   * não carrega nada do acervo, e quem desenha é um componente que passa pelo
   * portão de cliente (`components/histologia/portao.tsx`) — o conteúdo só
   * chega de uma rota de dados, que tem o portão (ver o teste seguinte). A
   * próxima página nova que servir conteúdo de outro jeito é exatamente o
   * vazamento; a que voltar a ler a sessão é exatamente a conta de volta.
   *
   * Exceções declaradas: a vitrine estática (o "não" do portão, só com a
   * amostra que a landing sempre mostrou ao visitante) e as páginas que só
   * redirecionam (não servem nada; o portão fica no destino).
   */
  it('toda página da árvore é casco estático com o portão de cliente', async () => {
    const paginas = await arquivos('app/manual-clinico/histologia', 'page.tsx')
    expect(paginas.length).toBeGreaterThan(30)

    let cascos = 0
    for (const pagina of paginas) {
      const relativo = relativoDe(pagina)
      const conteudo = readFileSync(pagina, 'utf8')

      expect(conteudo, `${relativo} lê a sessão: a página vira função a cada visita`).not.toMatch(
        /force-dynamic|getSession|cookies\(|headers\(|verificarAcessoAHistologia|histologiaLiberadaNaRequisicao/,
      )

      if (relativo === 'app/manual-clinico/histologia/vitrine/page.tsx') {
        expect(conteudo).toContain('montarVitrine()')
        expect(conteudo).not.toMatch(/from '@\/lib\/histologia\/(repositorio|catalogo|inicio|curriculo)'/)
        continue
      }
      if (!conteudo.includes('<AppShell')) {
        expect(conteudo, `${relativo} não desenha nada, mas também não redireciona`).toMatch(/redirect\(/)
        continue
      }

      cascos++
      const desenho = [...conteudo.matchAll(/from '@\/(components\/[^']+)'/g)]
        .filter(([, modulo]) => modulo !== 'components/app-shell')
        .map(([, modulo]) => [`${modulo}.tsx`, `${modulo}.ts`].find((a) => existsSync(path.join(RAIZ, a))))
        .map((arquivo) => (arquivo ? readFileSync(path.join(RAIZ, arquivo), 'utf8') : ''))
        .join('\n')
      expect(desenho, `${relativo} serve conteúdo do módulo sem passar pelo portão`).toMatch(
        /PortaoDaHistologia|useConteudoDaHistologia/,
      )
    }
    // 33 páginas: a vitrine, 2 que só redirecionam (WebPath/Utah) e 30 cascos.
    expect(cascos).toBeGreaterThanOrEqual(30)
  })

  /**
   * As rotas que servem o acervo em JSON — índice, busca, gabarito e o
   * conteúdo de cada casco — fecham junto com as páginas. Sem elas, o portão
   * da página seria um muro com a porta dos fundos aberta.
   *
   * A oferta é a exceção declarada: é o preço do produto, igual para todo
   * mundo, e por isso mesmo pode ficar no cache da borda.
   */
  it('as rotas de dados do módulo fecham junto com as páginas', async () => {
    const PUBLICAS = ['app/api/manual-clinico/histologia/oferta/route.ts']
    const rotas = await arquivos('app/api/manual-clinico/histologia', 'route.ts')
    expect(rotas.length).toBeGreaterThan(8)

    for (const completo of rotas) {
      const rota = relativoDe(completo)
      const conteudo = readFileSync(completo, 'utf8')
      if (PUBLICAS.includes(rota)) {
        expect(conteudo, `${rota} é pública e não pode tocar no acervo`).not.toMatch(
          /repositorio|catalogo|curriculo|paginas/,
        )
        continue
      }
      if (histologiaEhPrivativa()) {
        expect(
          /histologiaLiberadaNaRequisicao\(|verificarAcessoAHistologia\(/.test(conteudo),
          `${rota} serve o acervo sem consultar o portão`,
        ).toBe(true)
      }
      // Resposta que depende de sessão nunca pode ficar num cache compartilhado.
      expect(conteudo.includes('public, s-maxage'), `${rota} cacheável na borda`).toBe(false)
    }
  })

  /**
   * O que é desenhado no navegador vai para o JavaScript público do site —
   * baixável por qualquer um, sem sessão. As tabelas do acervo chegam aos
   * componentes já recortadas, pelas rotas de dados; importá-las daqui seria
   * entregá-las inteiras. (Os módulos `server-only`, como os repositórios, o
   * build já recusa.)
   */
  it('componentes do módulo não importam as tabelas do acervo', async () => {
    const TABELAS = [
      '@/lib/histologia/resumos',
      '@/lib/histologia/laminas',
      '@/lib/histologia-zoom/tecidos',
      '@/lib/histologia-zoom/especies',
      '@/lib/histopatologia-zoom/achados',
      '@/lib/histopatologia/editorial/mecanismos',
    ]
    const componentes = (
      await Promise.all(
        ['components/histologia', 'components/histologia-zoom', 'components/histopatologia', 'components/histopatologia-zoom'].map(
          componentesDe,
        ),
      )
    ).flat()
    expect(componentes.length).toBeGreaterThan(30)

    for (const completo of componentes) {
      const conteudo = readFileSync(completo, 'utf8')
      for (const tabela of TABELAS) {
        // Qualquer `import … from` que não seja `import type`, em uma ou em
        // várias linhas. `[^'";]` não deixa o casamento atravessar outro import.
        const valor = new RegExp(`import\\s+(?!type\\s)[^'";]*?from '${tabela}'`)
        expect(valor.test(conteudo), `${relativoDe(completo)} importa ${tabela}`).toBe(false)
      }
    }
  })

  async function componentesDe(dir: string): Promise<string[]> {
    const { readdirSync, statSync } = await import('node:fs')
    const saida: string[] = []
    const varrer = (atual: string) => {
      for (const item of readdirSync(atual)) {
        const completo = path.join(atual, item)
        if (statSync(completo).isDirectory()) varrer(completo)
        else if (/\.tsx?$/.test(item)) saida.push(completo)
      }
    }
    varrer(path.join(RAIZ, dir))
    return saida
  }
})

describe('integridade do acervo por ponteiro Git LFS', () => {
  /**
   * Os 9.479 binários do acervo estão versionados por Git LFS e, num clone sem
   * `git lfs pull`, o arquivo em disco é um ponteiro de texto. O ponteiro
   * carrega o `oid sha256` do conteúdo real — o que permite validar o acervo
   * inteiro sem ter os 2,56 GiB na máquina.
   *
   * Quando os binários estiverem materializados, o teste se declara não
   * aplicável em vez de falhar: um clone com LFS resolvido é o caso saudável,
   * não uma regressão.
   */
  const plano = readFileSync(path.join(ACERVO, 'dados/plano-assets-blob.jsonl'), 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as { sha256: string; bytes: number; arquivoLocal: string })

  const PONTEIRO = /^version https:\/\/git-lfs[^\n]*\noid sha256:([0-9a-f]{64})\nsize (\d+)\n/

  it('todo asset do plano corresponde ao hash do ponteiro em disco', () => {
    let conferidos = 0
    let materializados = 0

    for (const item of plano) {
      const completo = path.join(ACERVO, item.arquivoLocal.replace(/^acervo-fonte\//, 'acervo-fonte/'))
      let cabecalho: string
      try {
        cabecalho = readFileSync(completo).subarray(0, 200).toString('utf8')
      } catch {
        throw new Error(`Asset ausente do acervo: ${item.arquivoLocal}`)
      }
      const achado = PONTEIRO.exec(cabecalho)
      if (!achado) {
        materializados++
        continue
      }
      expect(achado[1], `hash divergente em ${item.arquivoLocal}`).toBe(item.sha256)
      expect(Number(achado[2]), `tamanho divergente em ${item.arquivoLocal}`).toBe(item.bytes)
      conferidos++
    }

    expect(conferidos + materializados).toBe(plano.length)
    expect(plano.length).toBe(9175)
  })
})
