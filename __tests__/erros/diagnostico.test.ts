import { describe, expect, it } from 'vitest'

import {
  classificarErro,
  descreverAparelho,
  descreverConexao,
  diagnosticar,
  diagnosticoDe,
  gerarCodigoDeErro,
  type CategoriaDeErro,
} from '@/lib/erros/diagnostico'

/**
 * O que estes testes protegem: a promessa de que nenhuma tela de erro volta a
 * dizer "a client-side exception has occurred".
 *
 * Toda categoria precisa chegar com título, causa e caminho de saída em
 * português — e a classificação precisa continuar acertando os quatro casos
 * que respondem pela quase totalidade dos erros reais: sem internet, deploy
 * novo com a aba velha, servidor fora e sessão vencida.
 */
const TODAS: CategoriaDeErro[] = [
  'sem-conexao',
  'rede-instavel',
  'versao-nova',
  'sessao-expirada',
  'sem-permissao',
  'nao-encontrado',
  'muitas-tentativas',
  'servidor',
  'armazenamento',
  'memoria',
  'interferencia',
  'desconhecido',
]

describe('classificarErro', () => {
  it('estar sem rede explica qualquer outro sintoma e vence tudo', () => {
    // Um erro de servidor com o aparelho offline continua sendo, para quem
    // está lendo, "você está sem internet" — foi a rede que impediu a resposta.
    expect(
      classificarErro({ online: false, status: 500, mensagem: 'Internal Server Error' }),
    ).toBe('sem-conexao')
  })

  it('reconhece o deploy novo com a aba antiga aberta', () => {
    expect(classificarErro({ nome: 'ChunkLoadError' })).toBe('versao-nova')
    expect(
      classificarErro({ mensagem: 'Loading chunk 4821 failed. (error: /_next/static/…)' }),
    ).toBe('versao-nova')
    expect(
      classificarErro({ mensagem: 'Failed to fetch dynamically imported module' }),
    ).toBe('versao-nova')
  })

  it('separa "sem rede" de "rede ruim"', () => {
    expect(classificarErro({ nome: 'TypeError', mensagem: 'Failed to fetch' })).toBe(
      'rede-instavel',
    )
    expect(classificarErro({ status: 504 })).toBe('rede-instavel')
    expect(classificarErro({ mensagem: 'The operation was aborted' })).toBe(
      'rede-instavel',
    )
  })

  it('usa o código HTTP quando ele existe, que é a evidência mais confiável', () => {
    expect(classificarErro({ status: 401 })).toBe('sessao-expirada')
    expect(classificarErro({ status: 403 })).toBe('sem-permissao')
    expect(classificarErro({ status: 404 })).toBe('nao-encontrado')
    expect(classificarErro({ status: 429 })).toBe('muitas-tentativas')
    expect(classificarErro({ status: 500 })).toBe('servidor')
    expect(classificarErro({ status: 503 })).toBe('servidor')
  })

  it('acerta mesmo com acento, caixa alta e mensagem em português', () => {
    expect(classificarErro({ mensagem: 'Sessão expirada' })).toBe('sessao-expirada')
    expect(classificarErro({ mensagem: 'ACESSO NEGADO ao material' })).toBe(
      'sem-permissao',
    )
    expect(classificarErro({ mensagem: 'Prova não encontrada' })).toBe('nao-encontrado')
  })

  it('atribui a extensão/tradutor os erros de hidratação', () => {
    expect(classificarErro({ mensagem: 'Hydration failed because the initial UI…' })).toBe(
      'interferencia',
    )
    expect(classificarErro({ mensagem: 'Minified React error #418' })).toBe(
      'interferencia',
    )
    expect(
      classificarErro({
        nome: 'NotFoundError',
        mensagem: "Failed to execute 'removeChild' on 'Node'",
      }),
    ).toBe('interferencia')
  })

  it('reconhece os limites do aparelho', () => {
    expect(classificarErro({ nome: 'QuotaExceededError' })).toBe('armazenamento')
    expect(classificarErro({ mensagem: 'Maximum call stack size exceeded' })).toBe(
      'memoria',
    )
  })

  it('trata a falha genérica de Server Component como problema nosso, não do usuário', () => {
    expect(
      classificarErro({
        mensagem:
          'An error occurred in the Server Components render. The specific message is omitted in production builds.',
      }),
    ).toBe('servidor')
    expect(classificarErro({ mensagem: 'MongoServerError: connection timed out' })).toBe(
      'servidor',
    )
  })

  it('cai em desconhecido sem inventar causa quando não há sinal nenhum', () => {
    expect(classificarErro({})).toBe('desconhecido')
    expect(classificarErro({ mensagem: '   ' })).toBe('desconhecido')
    expect(classificarErro({ nome: 'Error', mensagem: 'x is not a function' })).toBe(
      'desconhecido',
    )
  })
})

describe('conteúdo das telas', () => {
  it('toda categoria tem título, causa e pelo menos um caminho de saída', () => {
    for (const categoria of TODAS) {
      const d = diagnosticoDe(categoria)
      expect(d.categoria).toBe(categoria)
      expect(d.titulo.length).toBeGreaterThan(8)
      expect(d.resumo.length).toBeGreaterThan(30)
      expect(d.fator.length).toBeGreaterThan(3)
      expect(d.passos.length).toBeGreaterThan(0)
      expect(d.passos.every((passo) => passo.trim().length > 10)).toBe(true)
    }
  })

  it('nenhum texto volta a falar em console, exception ou inglês de erro', () => {
    const proibidos = ['console', 'exception', 'client-side', 'application error', 'undefined']
    for (const categoria of TODAS) {
      const d = diagnosticoDe(categoria)
      const texto = `${d.titulo} ${d.resumo} ${d.fator} ${d.passos.join(' ')}`.toLowerCase()
      for (const termo of proibidos) {
        expect(texto).not.toContain(termo)
      }
    }
  })

  it('só oferece "tentar de novo" onde tentar de novo pode resolver', () => {
    // Deploy novo: remontar a rota busca os mesmos arquivos que sumiram. O
    // único caminho é recarregar — oferecer as duas coisas seria empurrar a
    // pessoa para o botão que não funciona.
    expect(diagnosticoDe('versao-nova').tentarNovamenteResolve).toBe(false)
    expect(diagnosticoDe('versao-nova').recarregarResolve).toBe(true)
    // Sessão vencida e falta de permissão não mudam por insistência.
    expect(diagnosticoDe('sessao-expirada').tentarNovamenteResolve).toBe(false)
    expect(diagnosticoDe('sem-permissao').tentarNovamenteResolve).toBe(false)
    expect(diagnosticoDe('servidor').tentarNovamenteResolve).toBe(true)
  })

  it('diagnosticar entrega a mesma coisa que a categoria correspondente', () => {
    expect(diagnosticar({ online: false })).toEqual(diagnosticoDe('sem-conexao'))
  })
})

describe('gerarCodigoDeErro', () => {
  it('é estável: o mesmo erro dita sempre o mesmo código ao suporte', () => {
    const erro = { digest: '2938471029', nome: 'Error', mensagem: 'falhou' }
    expect(gerarCodigoDeErro(erro)).toBe(gerarCodigoDeErro({ ...erro }))
  })

  it('distingue erros diferentes', () => {
    expect(gerarCodigoDeErro({ digest: 'a' })).not.toBe(gerarCodigoDeErro({ digest: 'b' }))
  })

  it('tem sempre o formato ditável DA-XXXX-XX', () => {
    for (const semente of ['', 'ChunkLoadError', '2938471029', 'x'.repeat(500)]) {
      expect(gerarCodigoDeErro({ mensagem: semente })).toMatch(/^DA-[0-9A-Z]{4}-[0-9A-Z]{2}$/)
    }
  })

  it('não quebra quando não sobrou informação nenhuma do erro', () => {
    expect(gerarCodigoDeErro({})).toBe('DA-0000-00')
  })
})

describe('sinais do ambiente', () => {
  it('traduz o tipo de conexão para linguagem de gente', () => {
    expect(descreverConexao('4g', true)).toBe('Boa (4G ou melhor)')
    expect(descreverConexao('slow-2g', true)).toBe('Muito lenta (2G)')
    expect(descreverConexao(undefined, true)).toBe('Conectado')
    // Offline vence o tipo relatado: o dado antigo não pode desmentir a tela.
    expect(descreverConexao('4g', false)).toBe('Sem conexão')
  })

  it('nomeia o navegador certo mesmo quando o user agent mente', () => {
    // Edge, Opera e Samsung Internet se anunciam como Chrome; o Chrome se
    // anuncia como Safari. A ordem das checagens é o que salva.
    expect(
      descreverAparelho(
        'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36',
      ),
    ).toBe('Samsung Internet · Android')
    expect(
      descreverAparelho(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0',
      ),
    ).toBe('Edge · Windows')
    expect(
      descreverAparelho(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
      ),
    ).toBe('Safari · iPhone/iPad')
    expect(descreverAparelho('')).toBe('Navegador não identificado')
  })
})
