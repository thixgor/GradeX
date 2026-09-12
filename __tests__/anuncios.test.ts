import { describe, expect, it } from 'vitest'
import {
  inferDestinoTipo,
  isInternalPath,
  isValidImageUrl,
  isValidNavigationUrl,
  sanitizeDestino,
  toInternalPath,
} from '@/lib/anuncio-destinos'
import { ANUNCIO_TEMPLATES, listarPlaceholders } from '@/lib/anuncio-templates'

const ORIGEM = 'https://domineaqui.com'

describe('destino de anúncio', () => {
  it('aceita caminho interno e recusa o que só parece interno', () => {
    expect(isInternalPath('/materiais/123')).toBe(true)
    expect(isInternalPath('/materiais?tab=loja')).toBe(true)

    // Começam com barra, mas o navegador resolve como endereço absoluto: aceitá-los
    // transformaria o campo de destino interno em redirecionamento aberto.
    expect(isInternalPath('//evil.example')).toBe(false)
    expect(isInternalPath('/\\evil.example')).toBe(false)
    expect(isInternalPath('https://exemplo.com')).toBe(false)
  })

  it('valida URL de navegação pelos protocolos permitidos', () => {
    expect(isValidNavigationUrl('/loja/abc')).toBe(true)
    expect(isValidNavigationUrl('https://exemplo.com/x')).toBe(true)
    expect(isValidNavigationUrl('mailto:contato@exemplo.com')).toBe(true)

    expect(isValidNavigationUrl('javascript:alert(1)')).toBe(false)
    expect(isValidNavigationUrl('//evil.example')).toBe(false)
    expect(isValidNavigationUrl('   ')).toBe(false)
  })

  it('valida URL de imagem sem aceitar protocolo relativo', () => {
    expect(isValidImageUrl('/uploads/banner.png')).toBe(true)
    expect(isValidImageUrl('https://blob.exemplo.com/a.png')).toBe(true)
    expect(isValidImageUrl('//cdn.evil.example/a.png')).toBe(false)
    expect(isValidImageUrl('data:image/png;base64,AAA')).toBe(false)
  })

  it('converte endereço do próprio site em caminho relativo', () => {
    expect(toInternalPath('/materiais/1', ORIGEM)).toBe('/materiais/1')
    expect(toInternalPath(`${ORIGEM}/materiais/1?x=2#y`, ORIGEM)).toBe('/materiais/1?x=2#y')
    expect(toInternalPath('https://outro.com/materiais/1', ORIGEM)).toBeNull()
    expect(toInternalPath('', ORIGEM)).toBeNull()
  })

  it('deduz o tipo do destino pelo caminho', () => {
    expect(inferDestinoTipo('/materiais/abc')).toBe('material')
    expect(inferDestinoTipo('/pacotes/abc')).toBe('pacote')
    expect(inferDestinoTipo('/loja/abc')).toBe('produto')
    expect(inferDestinoTipo('/aulas/abc')).toBe('aula')
    expect(inferDestinoTipo('/rifas/natal')).toBe('rifa')
    expect(inferDestinoTipo('/flashcards')).toBe('pagina')
    expect(inferDestinoTipo('https://exemplo.com')).toBe('externo')
  })

  it('normaliza o destino vindo do cliente', () => {
    expect(sanitizeDestino({ tipo: 'material', rotulo: '  Apostila  ', refId: 'abc' })).toEqual({
      tipo: 'material',
      rotulo: 'Apostila',
      refId: 'abc',
    })

    // Tipo inválido cai para o que o próprio caminho revela.
    expect(sanitizeDestino({ tipo: 'qualquer' }, '/loja/1')?.tipo).toBe('produto')

    // Sem tipo e sem caminho não há o que gravar.
    expect(sanitizeDestino(undefined)).toBeUndefined()
    expect(sanitizeDestino({})).toBeUndefined()
  })
})

describe('modelos persuasivos', () => {
  it('não repete identificador', () => {
    const ids = ANUNCIO_TEMPLATES.map((modelo) => modelo.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('usa só as tags aceitas na exibição pública', () => {
    const permitidas = new Set([
      'a', 'b', 'blockquote', 'br', 'em', 'h3', 'h4', 'hr', 'i', 'li', 'ol', 'p', 'small', 'span', 'strong', 'u', 'ul',
    ])

    for (const modelo of ANUNCIO_TEMPLATES) {
      for (const tag of modelo.modalConteudo.match(/<\/?([a-zA-Z0-9]+)/g) ?? []) {
        expect(permitidas.has(tag.replace(/[</]/g, '').toLowerCase())).toBe(true)
      }
    }
  })

  it('marca com [COLCHETES] o que precisa ser trocado', () => {
    for (const modelo of ANUNCIO_TEMPLATES) {
      const pendentes = listarPlaceholders(
        modelo.titulo,
        modelo.ctaTexto,
        modelo.modalTitulo,
        modelo.modalConteudo,
        modelo.modalBotaoTexto,
      )
      expect(pendentes.length).toBeGreaterThan(0)
    }
  })

  it('não acusa marcador em texto já preenchido', () => {
    expect(listarPlaceholders('Restam 8 vagas', 'Garantir vaga')).toEqual([])
  })
})
