import { beforeEach, describe, expect, it, vi } from 'vitest'

const headMock = vi.fn()
const delMock = vi.fn()

vi.mock('@vercel/blob', () => ({
  head: (...args: any[]) => headMock(...args),
  del: (...args: any[]) => delMock(...args),
}))

import { verificarAnexos, prouniBlobPrefix } from '@/lib/prouni-anexos'
import { ProuniError } from '@/lib/prouni-shared'

/**
 * O que estes testes protegem: a porta de entrada de arquivo de terceiro.
 *
 * Cada caso abaixo é uma forma real de burlar o upload — pegar o comprovante de
 * outra pessoa, mentir o tipo, mentir o tamanho, mandar HTML com nome de PDF.
 * O token do Blob limita o estrago; quem recusa de fato é esta conferência, e
 * ela precisa continuar recusando mesmo quando alguém "arruma" o payload.
 */

const USER = '507f1f77bcf86cd799439011'
const PREFIXO = prouniBlobPrefix(USER)

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 0, 0, 0, 0, 0, 0, 0, 0])
const HTML = new TextEncoder().encode('<html><script>x')

function respostaComBytes(bytes: Uint8Array) {
  return {
    ok: true,
    status: 206,
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  } as any
}

function anexo(nome = 'comprovante.pdf') {
  return {
    url: `https://blob.example.com/${PREFIXO}${nome}`,
    pathname: `${PREFIXO}${nome}`,
    filename: nome,
  }
}

beforeEach(() => {
  headMock.mockReset()
  delMock.mockReset()
  vi.stubGlobal('fetch', vi.fn(async () => respostaComBytes(PDF)))
})

describe('verificarAnexos', () => {
  it('aceita um PDF verdadeiro dentro dos limites', async () => {
    const entrada = anexo()
    headMock.mockResolvedValue({ pathname: entrada.pathname, contentType: 'application/pdf', size: 1024 })

    const validados = await verificarAnexos([entrada], { userId: USER, prefixoPermitido: PREFIXO })
    expect(validados).toHaveLength(1)
    expect(validados[0].contentType).toBe('application/pdf')
    expect(validados[0].sizeBytes).toBe(1024)
    // Nome saneado: o original vira algo sem caractere perigoso e com extensão
    // derivada do tipo real, não do que veio escrito.
    expect(validados[0].filename).toMatch(/\.pdf$/)
  })

  it('recusa arquivo que está fora da pasta de quem envia', async () => {
    const alheio = {
      url: 'https://blob.example.com/prouni-comprovantes/outra-pessoa/doc.pdf',
      pathname: 'prouni-comprovantes/outra-pessoa/doc.pdf',
    }
    await expect(
      verificarAnexos([alheio], { userId: USER, prefixoPermitido: PREFIXO })
    ).rejects.toBeInstanceOf(ProuniError)
    // Nem chega a consultar o Blob: a checagem de dono vem antes da rede.
    expect(headMock).not.toHaveBeenCalled()
  })

  it('recusa quando o pathname declarado não é o do blob apontado pela URL', async () => {
    const entrada = anexo()
    headMock.mockResolvedValue({
      pathname: 'prouni-comprovantes/outra-pessoa/doc.pdf',
      contentType: 'application/pdf',
      size: 1024,
    })
    await expect(
      verificarAnexos([entrada], { userId: USER, prefixoPermitido: PREFIXO })
    ).rejects.toThrow(/inválido/i)
  })

  it('recusa tipo fora da lista, mesmo com extensão aceita', async () => {
    const entrada = anexo()
    headMock.mockResolvedValue({ pathname: entrada.pathname, contentType: 'text/html', size: 500 })
    await expect(
      verificarAnexos([entrada], { userId: USER, prefixoPermitido: PREFIXO })
    ).rejects.toThrow(/Formato não aceito/i)
  })

  it('recusa conteúdo que não bate com o tipo declarado', async () => {
    const entrada = anexo()
    headMock.mockResolvedValue({ pathname: entrada.pathname, contentType: 'application/pdf', size: 500 })
    vi.stubGlobal('fetch', vi.fn(async () => respostaComBytes(HTML)))
    await expect(
      verificarAnexos([entrada], { userId: USER, prefixoPermitido: PREFIXO })
    ).rejects.toThrow(/não corresponde/i)
  })

  it('usa o tamanho do Blob, não o que o cliente afirma', async () => {
    const entrada = anexo()
    headMock.mockResolvedValue({
      pathname: entrada.pathname,
      contentType: 'application/pdf',
      size: 40 * 1024 * 1024,
    })
    await expect(
      verificarAnexos([entrada as any], { userId: USER, prefixoPermitido: PREFIXO })
    ).rejects.toThrow(/no máximo/i)
  })

  it('recusa quando a soma dos arquivos passa do teto', async () => {
    const a = anexo('a.pdf')
    const b = anexo('b.pdf')
    const c = anexo('c.pdf')
    headMock.mockImplementation(async (url: string) => ({
      pathname: url.replace('https://blob.example.com/', ''),
      contentType: 'application/pdf',
      size: 7 * 1024 * 1024,
    }))
    await expect(
      verificarAnexos([a, b, c], { userId: USER, prefixoPermitido: PREFIXO })
    ).rejects.toThrow(/soma dos arquivos/i)
  })

  it('recusa mais anexos do que o limite', async () => {
    const muitos = ['a.pdf', 'b.pdf', 'c.pdf', 'd.pdf'].map((nome) => anexo(nome))
    await expect(
      verificarAnexos(muitos, { userId: USER, prefixoPermitido: PREFIXO })
    ).rejects.toThrow(/no máximo/i)
  })

  it('recusa o mesmo arquivo enviado duas vezes', async () => {
    const entrada = anexo()
    headMock.mockResolvedValue({ pathname: entrada.pathname, contentType: 'application/pdf', size: 1024 })
    await expect(
      verificarAnexos([entrada, entrada], { userId: USER, prefixoPermitido: PREFIXO })
    ).rejects.toThrow(/duas vezes/i)
  })

  it('recusa arquivo vazio', async () => {
    const entrada = anexo()
    headMock.mockResolvedValue({ pathname: entrada.pathname, contentType: 'application/pdf', size: 0 })
    await expect(
      verificarAnexos([entrada], { userId: USER, prefixoPermitido: PREFIXO })
    ).rejects.toThrow(/vazio/i)
  })

  it('recusa lista vazia', async () => {
    await expect(
      verificarAnexos([], { userId: USER, prefixoPermitido: PREFIXO })
    ).rejects.toThrow(/pelo menos um/i)
  })
})
