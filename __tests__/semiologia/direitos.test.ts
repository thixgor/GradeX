import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  FONTES_LICENCIADAS,
  LISTA_DE_FONTES,
  fonteDaUrl,
  hostAutorizado,
} from '@/lib/acervos-licenciados'
import { caminhoNoEspelho, urlDaMidia, midiasServiveis, type MidiaClinica } from '@/lib/semiologia/midia'
import { ACERVO_DE_MIDIA } from '@/lib/semiologia/acervo.gerado'
import { chaveDaCena, chaveDoSinal, cobertura } from '@/lib/semiologia/acervo'
import { SINAIS } from '@/lib/semiologia/sinais'
import { JANELAS_ULTRASSOM } from '@/lib/semiologia/ultrassom'
import { VISTAS } from '@/lib/semiologia/vistas'

/**
 * Estes testes protegem uma obrigação contratual, não uma preferência de
 * código. As autorizações do The POCUS Atlas e do Radiopaedia concedem exceção
 * à cláusula NonCommercial em favor da DomineAqui **mediante condições** — e as
 * duas condições que dá para verificar automaticamente são o crédito exigido e
 * o território onde a mídia pode ser servida.
 *
 * Um crédito que some num refactor de layout, ou uma URL de host não autorizado
 * que entra no acervo, não quebram nenhuma tela. Quebram a autorização — e é
 * justamente por não quebrarem nada visível que precisam de teste.
 */
describe('fontes licenciadas', () => {
  it('cada fonte declara licença base, exceção e o crédito exigido', () => {
    for (const fonte of LISTA_DE_FONTES) {
      expect(fonte.licencaBase, fonte.id).toBeTruthy()
      expect(fonte.excecao, fonte.id).toBeTruthy()
      expect(fonte.credito.length, fonte.id).toBeGreaterThan(40)
      expect(fonte.permissoes.length, fonte.id).toBeGreaterThan(0)
      expect(fonte.restricoes.length, fonte.id).toBeGreaterThan(0)
      expect(fonte.signatarios.length, fonte.id).toBeGreaterThan(0)
    }
  })

  it('o crédito reproduz o texto que a autorização pede', () => {
    // Literal de propósito: reescrever o crédito "para caber no layout" é como
    // se deixa de cumprir uma cláusula negociada palavra por palavra.
    expect(FONTES_LICENCIADAS['pocus-atlas'].credito).toContain('thepocusatlas.com')
    expect(FONTES_LICENCIADAS['pocus-atlas'].credito).toContain('Dr. Michael Macias')
    expect(FONTES_LICENCIADAS['pocus-atlas'].credito).toContain('Dr. Matthew David Riscinti')
    expect(FONTES_LICENCIADAS['pocus-atlas'].credito).toContain('CC BY-NC 4.0')

    expect(FONTES_LICENCIADAS.radiopaedia.credito).toContain('Radiopaedia.org')
    expect(FONTES_LICENCIADAS.radiopaedia.credito).toContain('Radiopaedia Australia Pty Ltd')
  })

  it('cada fonte registra o documento que a sustenta', () => {
    for (const fonte of LISTA_DE_FONTES) {
      expect(fonte.comprovante.sha256, fonte.id).toMatch(/^[0-9a-f]{64}$/)
      expect(fonte.comprovante.data, fonte.id).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('a exceção é registrada como nossa, não como abertura do conteúdo', () => {
    // Para terceiros, as licenças originais continuam valendo. Se alguém um dia
    // apagar essa ressalva, o módulo passa a sugerir que o material virou aberto.
    for (const fonte of LISTA_DE_FONTES) {
      const texto = fonte.restricoes.join(' ').toLowerCase()
      expect(texto, fonte.id).toContain('terceiros')
    }
  })
})

describe('allowlist de mídia', () => {
  it('aceita só HTTPS e só host da própria fonte', () => {
    const radiopaedia = FONTES_LICENCIADAS.radiopaedia
    expect(hostAutorizado('https://radiopaedia.org/cases/1', radiopaedia)).toBe(true)
    expect(hostAutorizado('https://prod-images-static.radiopaedia.org/a.jpg', radiopaedia)).toBe(true)
    expect(hostAutorizado('http://radiopaedia.org/cases/1', radiopaedia)).toBe(false)
    expect(hostAutorizado('https://exemplo.com/a.jpg', radiopaedia)).toBe(false)
  })

  it('não cai no truque do sufixo', () => {
    // `endsWith('radiopaedia.org')` sozinho aceitaria isto — é como allowlist
    // vira convite.
    const radiopaedia = FONTES_LICENCIADAS.radiopaedia
    expect(hostAutorizado('https://naoradiopaedia.org/a.jpg', radiopaedia)).toBe(false)
    expect(hostAutorizado('https://radiopaedia.org.exemplo.com/a.jpg', radiopaedia)).toBe(false)
  })

  it('não mistura as fontes', () => {
    expect(hostAutorizado('https://www.thepocusatlas.com/a.jpg', FONTES_LICENCIADAS.radiopaedia)).toBe(false)
    expect(hostAutorizado('https://radiopaedia.org/a.jpg', FONTES_LICENCIADAS['pocus-atlas'])).toBe(false)
  })

  it('identifica a fonte a partir da URL', () => {
    expect(fonteDaUrl('https://radiopaedia.org/cases/1')?.id).toBe('radiopaedia')
    expect(fonteDaUrl('https://www.thepocusatlas.com/x')?.id).toBe('pocus-atlas')
    expect(fonteDaUrl('https://exemplo.com/x')).toBeNull()
    expect(fonteDaUrl('não é url')).toBeNull()
  })

  it('URL lixo não derruba o resolvedor', () => {
    expect(hostAutorizado('', FONTES_LICENCIADAS.radiopaedia)).toBe(false)
    expect(hostAutorizado('javascript:alert(1)', FONTES_LICENCIADAS.radiopaedia)).toBe(false)
  })
})

describe('resolução de mídia', () => {
  const valida: MidiaClinica = {
    id: 'x',
    tipo: 'imagem',
    fonte: 'radiopaedia',
    urlOrigem: 'https://prod-images-static.radiopaedia.org/exemplo.jpg',
    urlDoCaso: 'https://radiopaedia.org/cases/exemplo',
    legenda: 'Exemplo',
  }

  it('serve da origem fora de produção', () => {
    expect(urlDaMidia(valida)).toBe(valida.urlOrigem)
  })

  it('recusa mídia de host fora da autorização, mesmo já catalogada', () => {
    // A allowlist é reaplicada na renderização de propósito: uma URL que
    // escapou da curadoria não deve chegar ao navegador do aluno só porque
    // entrou no arquivo de dado.
    expect(urlDaMidia({ ...valida, urlOrigem: 'https://exemplo.com/a.jpg' })).toBeNull()
    expect(urlDaMidia({ ...valida, urlOrigem: 'http://radiopaedia.org/a.jpg' })).toBeNull()
  })

  it('o caminho no espelho é endereçado por hash', () => {
    expect(caminhoNoEspelho('abcdef0123', 'jpg')).toBe('semiologia/ab/abcdef0123.jpg')
  })

  it('lista vazia e ausente não quebram', () => {
    expect(midiasServiveis(undefined)).toEqual([])
    expect(midiasServiveis([])).toEqual([])
    expect(midiasServiveis([{ ...valida, urlOrigem: 'https://exemplo.com/a.jpg' }])).toEqual([])
  })
})

describe('vínculo entre acervo e direitos', () => {
  it('toda fonte marcada como licenciada existe no registro de direitos', () => {
    for (const janela of [...VISTAS, ...JANELAS_ULTRASSOM]) {
      for (const fonte of janela.ondeVerFoto) {
        if (!fonte.licenciada) continue
        expect(FONTES_LICENCIADAS[fonte.licenciada], `${janela.slug} → ${fonte.licenciada}`).toBeDefined()
      }
    }
  })

  it('nenhuma fonte licenciada ainda pede para o aluno conferir a licença', () => {
    // Era o texto correto antes das autorizações. Depois delas, mandar conferir
    // uma licença já negociada é informação errada na tela.
    for (const janela of [...VISTAS, ...JANELAS_ULTRASSOM]) {
      for (const fonte of janela.ondeVerFoto) {
        if (!fonte.licenciada) continue
        expect(fonte.nota?.toLowerCase() ?? '', `${janela.slug} → ${fonte.titulo}`).not.toContain('verifique a licença')
      }
    }
  })

  it('toda mídia real catalogada aponta para host autorizado da própria fonte', () => {
    // O acervo nasce vazio: a autorização diz o que podemos usar, não nos
    // entrega os arquivos. Este teste passa a valer sozinho quando a curadoria
    // começar a povoar as cenas.
    for (const janela of [...VISTAS, ...JANELAS_ULTRASSOM]) {
      for (const cena of janela.cenas) {
        for (const midia of cena.midiaReal ?? []) {
          const fonte = FONTES_LICENCIADAS[midia.fonte]
          expect(fonte, `${janela.slug}/${cena.id}/${midia.id}`).toBeDefined()
          expect(hostAutorizado(midia.urlOrigem, fonte), midia.urlOrigem).toBe(true)
          expect(midia.legenda.length, midia.id).toBeGreaterThan(10)
          expect(midia.urlDoCaso, midia.id).toMatch(/^https:\/\//)
        }
      }
    }
  })
})

describe('pipeline de curadoria', () => {
  const script = readFileSync('scripts/semiologia/curar-acervo.mjs', 'utf8')

  it('a allowlist do script não diverge da allowlist dos direitos', () => {
    // O script roda em Node puro, sem o resolvedor de caminhos do Next, então
    // repete a lista em vez de importá-la. A duplicação só é aceitável porque
    // este teste a vigia: um host acrescentado num lado e esquecido no outro
    // significa ou mídia que o script aprova e a aplicação recusa, ou o
    // contrário — e os dois são falhas silenciosas.
    for (const fonte of LISTA_DE_FONTES) {
      for (const host of fonte.dominiosDeMidia) {
        expect(script, `${fonte.id} → ${host}`).toContain(host)
      }
    }
  })

  it('o script nunca gera acervo parcial', () => {
    // Gerar 12 de 40 calado faria a pessoa acreditar que curou 40.
    expect(script).toContain('Nada foi gerado')
    expect(script).toContain('process.exit(1)')
  })

  it('o envio ao espelho usa o mesmo caminho que a aplicação lê', () => {
    // `enviar-espelho.mjs` repete `caminhoNoEspelho` em vez de importá-lo,
    // pelo mesmo motivo da allowlist: roda em Node puro. Se as duas fórmulas
    // divergissem, o script subiria os arquivos para um caminho e a interface
    // os procuraria em outro — 16 quadrados quebrados sem nenhum erro no log.
    const envio = readFileSync('scripts/semiologia/enviar-espelho.mjs', 'utf8')
    const corpo = envio.match(/function caminhoNoEspelho\(sha256, ext\) \{\s*return (`[^`]+`)/)?.[1]
    expect(corpo, 'caminhoNoEspelho não encontrada no script').toBeTruthy()
    const doScript = new Function('sha256', 'ext', `return ${corpo}`) as (s: string, e: string) => string
    for (const [sha, ext] of [['abcdef0123', 'jpg'], ['7e5e4a638dcf', 'gif'], ['00ff', 'mp4']]) {
      expect(doScript(sha, ext)).toBe(caminhoNoEspelho(sha, ext))
    }
  })
})

describe('acervo curado', () => {
  it('toda chave do acervo aponta para uma cena que existe', () => {
    // Chave com typo produz mídia que nunca aparece e ninguém nota, porque a
    // página continua renderizando — com o esquema e sem o caso.
    const validas = new Set([
      ...[...VISTAS, ...JANELAS_ULTRASSOM].flatMap((janela) =>
        janela.cenas.map((cena) => chaveDaCena(janela.slug, cena.id)),
      ),
      ...SINAIS.map((sinal) => chaveDoSinal(sinal.slug)),
    ])
    for (const chave of Object.keys(ACERVO_DE_MIDIA)) {
      expect(validas.has(chave), `chave órfã no acervo: ${chave}`).toBe(true)
    }
  })

  it('toda mídia do acervo vem de host autorizado e tem proveniência', () => {
    for (const [chave, midias] of Object.entries(ACERVO_DE_MIDIA)) {
      for (const midia of midias) {
        const fonte = FONTES_LICENCIADAS[midia.fonte]
        expect(fonte, `${chave}/${midia.id}`).toBeDefined()
        expect(hostAutorizado(midia.urlOrigem, fonte), midia.urlOrigem).toBe(true)
        expect(midia.urlDoCaso, `${chave}/${midia.id}`).toMatch(/^https:\/\//)
        expect(midia.legenda.length, `${chave}/${midia.id}`).toBeGreaterThan(10)
      }
    }
  })

  it('a cobertura é contável sem o acervo estar povoado', () => {
    const total = cobertura([...VISTAS, ...JANELAS_ULTRASSOM])
    expect(total.cenas).toBe(
      [...VISTAS, ...JANELAS_ULTRASSOM].reduce((n, j) => n + j.cenas.length, 0),
    )
    expect(total.comCaso).toBeLessThanOrEqual(total.cenas)
  })
})
