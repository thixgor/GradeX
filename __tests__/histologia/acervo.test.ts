import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  ALTERACOES_REALIZADAS,
  AUTORIZACAO,
  CREDITO_BASE,
  LICENCA,
  licencaPermitePublicar,
  pendenciaDeLicenca,
  podeIndexar,
} from '@/lib/histologia/licenca'

const RAIZ = path.resolve(__dirname, '../..')
const ACERVO = path.join(RAIZ, 'public/Manual-Histologia')

describe('portão de licença', () => {
  /**
   * O teste que impede o acidente mais caro deste módulo: publicar conteúdo
   * CC BY-NC-SA atrás do paywall do GradeX. Enquanto `AUTORIZACAO.decisao` for
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
})

describe('nenhum acoplamento a fluxo pago', () => {
  /**
   * A gratuidade do módulo é estrutural: não existe código de cobrança para
   * configurar errado. Este teste varre a superfície inteira do módulo atrás
   * dos símbolos que trariam o paywall de volta.
   */
  const PROIBIDOS = [
    'useAcessoTomografia',
    'PLUS_LABEL',
    'manual-clinico/checkout',
    'hasFullAccess',
    'account-tier',
  ]

  const alvos = [
    'lib/histologia',
    'components/histologia',
    'app/manual-clinico/histologia',
    'app/api/manual-clinico/histologia',
  ]

  it('nenhum arquivo do módulo referencia acesso pago', async () => {
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
      const conteudo = readFileSync(arquivo, 'utf8')
      for (const proibido of PROIBIDOS) {
        // `licenca.ts` e este teste citam os nomes em comentário, de propósito.
        if (/licenca\.ts$/.test(arquivo)) continue
        expect(
          conteudo.includes(proibido),
          `${path.relative(RAIZ, arquivo)} referencia "${proibido}"`,
        ).toBe(false)
      }
    }
  })
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
