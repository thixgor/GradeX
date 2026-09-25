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
import { anuncioVisivelParaPeriodo, shouldHideAdsOnRoute } from '@/lib/anuncio-exibicao'
import { formatarConteudoAnuncio, resumirConteudoAnuncio } from '@/lib/anuncio-formatacao'

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

  it('é escrito na formatação simples, sem HTML', () => {
    // O modelo cai no campo de texto do admin: tag ali é o que o editor novo evita.
    for (const modelo of ANUNCIO_TEMPLATES) {
      expect(modelo.modalConteudo).not.toMatch(/<[a-z]/i)
    }
  })

  it('gera só as tags aceitas na exibição pública', () => {
    const permitidas = new Set([
      'a', 'b', 'blockquote', 'br', 'del', 'em', 'h3', 'h4', 'hr', 'i', 'li', 'mark', 'ol', 'p', 's', 'small', 'span',
      'strong', 'u', 'ul',
    ])

    for (const modelo of ANUNCIO_TEMPLATES) {
      for (const tag of formatarConteudoAnuncio(modelo.modalConteudo).match(/<\/?([a-zA-Z0-9]+)/g) ?? []) {
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

describe('onde e para quem o anúncio aparece', () => {
  it('não exibe nas rotas que competem com a peça', () => {
    // O painel do admin é a rota onde o próprio anunciante testa — e por isso a
    // que mais gera "criei e não apareceu".
    expect(shouldHideAdsOnRoute('/admin')).toBe(true)
    expect(shouldHideAdsOnRoute('/admin/anuncios')).toBe(true)
    expect(shouldHideAdsOnRoute('/auth/login')).toBe(true)
    expect(shouldHideAdsOnRoute('/exams/123')).toBe(true)
    expect(shouldHideAdsOnRoute('/buy')).toBe(true)
    expect(shouldHideAdsOnRoute('/materiais/abc')).toBe(true)
    expect(shouldHideAdsOnRoute('/materiais/abc/viewer')).toBe(true)
    expect(shouldHideAdsOnRoute('/pacotes/abc')).toBe(true)
  })

  it('exibe no resto da plataforma', () => {
    expect(shouldHideAdsOnRoute('/dashboard')).toBe(false)
    expect(shouldHideAdsOnRoute('/materiais')).toBe(false)
    expect(shouldHideAdsOnRoute('/banco-questoes/historico')).toBe(false)
    expect(shouldHideAdsOnRoute('/flashcards')).toBe(false)
    expect(shouldHideAdsOnRoute('/')).toBe(false)
    // Barra no fim não pode mudar a decisão.
    expect(shouldHideAdsOnRoute('/dashboard/')).toBe(false)
  })

  it('segmenta por período sem esconder o que não foi segmentado', () => {
    expect(anuncioVisivelParaPeriodo([], 4)).toBe(true)
    expect(anuncioVisivelParaPeriodo(undefined, null)).toBe(true)

    expect(anuncioVisivelParaPeriodo([3, 4], 4)).toBe(true)
    expect(anuncioVisivelParaPeriodo([3, 4], 5)).toBe(false)

    // Sem período definido, o usuário só vê anúncio sem segmentação.
    expect(anuncioVisivelParaPeriodo([3], null)).toBe(false)
  })
})

describe('formatação do conteúdo do modal', () => {
  it('Enter quebra a linha e linha em branco separa parágrafos', () => {
    expect(formatarConteudoAnuncio('Linha 1\nLinha 2\n\nOutro parágrafo')).toBe(
      '<p>Linha 1<br>Linha 2</p><p>Outro parágrafo</p>',
    )
    expect(formatarConteudoAnuncio('a\r\nb')).toBe('<p>a<br>b</p>')
  })

  it('converte as ênfases sem precisar de tag', () => {
    expect(formatarConteudoAnuncio('**negrito** *itálico* _itálico_ ++sub++ ~~risco~~ ==marca==')).toBe(
      '<p><strong>negrito</strong> <em>itálico</em> <em>itálico</em> <u>sub</u> <del>risco</del> <mark>marca</mark></p>',
    )
    expect(formatarConteudoAnuncio('**negrito com *itálico* dentro**')).toBe(
      '<p><strong>negrito com <em>itálico</em> dentro</strong></p>',
    )
  })

  it('não formata o que só parece marcação', () => {
    expect(formatarConteudoAnuncio('nome_de_arquivo, 5 * 3 * 2, C++ e C++, a == b')).toBe(
      '<p>nome_de_arquivo, 5 * 3 * 2, C++ e C++, a == b</p>',
    )
    expect(formatarConteudoAnuncio('\\*literal\\*')).toBe('<p>*literal*</p>')
    // Marcador de rascunho dos modelos não é link.
    expect(formatarConteudoAnuncio('[PRODUTO] (novo)')).toBe('<p>[PRODUTO] (novo)</p>')
  })

  it('monta títulos, listas, citação, letra miúda e divisória', () => {
    expect(
      formatarConteudoAnuncio('# Título\n### Sub\n- a\n- b\n1. um\n2) dois\n> cit 1\n> cit 2\n---\n-# miúdo'),
    ).toBe(
      '<h3>Título</h3><h4>Sub</h4><ul><li>a</li><li>b</li></ul><ol><li>um</li><li>dois</li></ol>' +
        '<blockquote>cit 1<br>cit 2</blockquote><hr><p><small>miúdo</small></p>',
    )
  })

  it('cria links, inclusive de URL solta, sem estragar o endereço', () => {
    expect(formatarConteudoAnuncio('[clique **aqui**](/materiais/1)')).toBe(
      '<p><a href="/materiais/1">clique <strong>aqui</strong></a></p>',
    )
    expect(formatarConteudoAnuncio('Veja https://site.com/a_b_c.')).toBe(
      '<p>Veja <a href="https://site.com/a_b_c">https://site.com/a_b_c</a>.</p>',
    )
    expect(formatarConteudoAnuncio('www.site.com')).toBe('<p><a href="https://www.site.com">www.site.com</a></p>')
    // Aspas no endereço não fecham o atributo.
    expect(formatarConteudoAnuncio('[x](https://a.com/?q="onclick=y)')).toBe(
      '<p><a href="https://a.com/?q=&quot;onclick=y">x</a></p>',
    )
  })

  it('mantém o HTML dos anúncios antigos', () => {
    const antigo = '<p>Antigo <strong>html</strong></p><ul><li>x</li></ul>'
    expect(formatarConteudoAnuncio(antigo)).toBe(antigo)
    expect(formatarConteudoAnuncio('<ul>\n<li>x</li>\n</ul>')).toBe('<ul>\n<li>x</li>\n</ul>')
    // Parágrafo de HTML em várias linhas também respeita o Enter.
    expect(formatarConteudoAnuncio('<p>linha 1\nlinha 2</p>\ndepois')).toBe('<p>linha 1<br>linha 2</p><p>depois</p>')
    // Tag inline no começo não desliga a formatação.
    expect(formatarConteudoAnuncio('<strong>a</strong> e **b**\nc')).toBe(
      '<p><strong>a</strong> e <strong>b</strong><br>c</p>',
    )
  })

  it('resume em texto corrido para a lista do admin', () => {
    expect(resumirConteudoAnuncio('# Título\n- **a**\n- b\n\ntexto')).toBe('Título a b texto')
    expect(resumirConteudoAnuncio(undefined)).toBe('')
  })
})
