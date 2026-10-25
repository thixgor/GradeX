import { describe, expect, it } from 'vitest'
import {
  comissaoSobreOProduto,
  destinoSeguro,
  dividirVenda,
  cicloDeRepasse,
  deslocarMes,
  escopoDoDestino,
  rotuloDoMes,
  validarIdDaTransacao,
  itemNoEscopo,
  lerCookieDoCupom,
  valorDoCookieDoCupom,
  vincularAoEmbaixador,
  formatarChavePix,
  linkSeguro,
  nomeDiscreto,
  normalizarCodigo,
  normalizarConfig,
  saudeDoCupom,
  semanaDe,
  sugerirCodigo,
  ultimasSemanas,
  validarChavePix,
} from '@/lib/embaixadores/regras'

describe('a divisão de uma venda', () => {
  it('segue a fórmula: sócio 30%, embaixador c × 70%, o resto fica conosco', () => {
    const d = dividirVenda(100, 30, 10)
    expect(d.valorSocio).toBe(30)
    expect(d.nossaParteBruta).toBe(70)
    expect(d.comissao).toBe(7)
    expect(d.nossaParteLiquida).toBe(63)
  })

  it('a comissão nunca toca a parte do sócio', () => {
    for (const c of [0, 5, 12.5, 50, 100]) {
      expect(dividirVenda(249.9, 30, c).valorSocio).toBe(dividirVenda(249.9, 30, 0).valorSocio)
    }
  })

  it('as partes sempre somam o valor do produto, centavo por centavo', () => {
    for (const valor of [0.01, 9.99, 33.33, 127.45, 1999.9]) {
      for (const c of [0, 7, 12.5, 33.3]) {
        const d = dividirVenda(valor, 30, c)
        expect(Math.round((d.valorSocio + d.comissao + d.nossaParteLiquida) * 100)).toBe(Math.round(valor * 100))
      }
    }
  })

  it('embaixador sem comissão (não-remunerado) recebe zero', () => {
    expect(dividirVenda(100, 30, 0).comissao).toBe(0)
  })

  it('não aceita porcentagem fora de 0–100 nem valor negativo', () => {
    expect(dividirVenda(100, 30, 250).comissao).toBe(70)
    expect(dividirVenda(-10, 30, 10).valor).toBe(0)
  })

  it('a comissão vista sobre o valor do produto', () => {
    expect(comissaoSobreOProduto(30, 10)).toBe(7)
    expect(comissaoSobreOProduto(30, 15)).toBe(10.5)
  })
})

describe('o código do embaixador', () => {
  it('vira maiúsculas, sem acento e sem símbolo', () => {
    expect(normalizarCodigo(' joão-10! ')).toBe('JOAO10')
  })

  it('a sugestão sai do primeiro nome e do desconto', () => {
    expect(sugerirCodigo('Maria Clara Souza', 10)).toBe('MARIA10')
    expect(sugerirCodigo('', 10)).toBe('EMBAIXADOR10')
  })
})

describe('a chave PIX', () => {
  it('aceita CPF válido e guarda só os dígitos', () => {
    const r = validarChavePix({ tipo: 'cpf', chave: '529.982.247-25', titular: 'Fulana de Tal' })
    expect(r.ok && r.chave.chave).toBe('52998224725')
  })

  it('recusa CPF com dígito errado', () => {
    expect(validarChavePix({ tipo: 'cpf', chave: '529.982.247-26', titular: 'Fulana' }).ok).toBe(false)
  })

  it('telefone vira +55 com DDD', () => {
    const r = validarChavePix({ tipo: 'telefone', chave: '(11) 91234-5678', titular: 'Fulana' })
    expect(r.ok && r.chave.chave).toBe('+5511912345678')
    expect(r.ok && formatarChavePix(r.chave)).toBe('+55 (11) 91234-5678')
  })

  it('e-mail em minúsculas e chave aleatória no formato UUID', () => {
    const e = validarChavePix({ tipo: 'email', chave: 'Fulana@Email.com', titular: 'Fulana' })
    expect(e.ok && e.chave.chave).toBe('fulana@email.com')
    expect(validarChavePix({ tipo: 'aleatoria', chave: 'nao-e-uuid', titular: 'Fulana' }).ok).toBe(false)
  })

  it('exige o nome do titular', () => {
    expect(validarChavePix({ tipo: 'email', chave: 'a@b.com', titular: '' }).ok).toBe(false)
  })
})

describe('privacidade e segurança', () => {
  it('o embaixador vê só primeiro nome e inicial de quem indicou', () => {
    expect(nomeDiscreto('Ana Beatriz Lima')).toBe('Ana L.')
    expect(nomeDiscreto('')).toBe('Alguém')
  })

  it('o link só redireciona para caminho interno', () => {
    expect(destinoSeguro('/buy', 'ANA10')).toBe('/buy')
    expect(destinoSeguro('//evil.com', 'ANA10')).toBe('/convite/ANA10')
    expect(destinoSeguro('https://evil.com', 'ANA10')).toBe('/convite/ANA10')
    expect(destinoSeguro('/e/OUTRO', 'ANA10')).toBe('/convite/ANA10')
    expect(destinoSeguro(null, 'ANA10')).toBe('/convite/ANA10')
  })

  it('o link do formulário não aceita javascript:', () => {
    expect(linkSeguro('/forms/6aaed6ee00234fc63cf6e9ab')).toBe(true)
    expect(linkSeguro('https://forms.gle/x')).toBe(true)
    expect(linkSeguro('javascript:alert(1)')).toBe(false)
    expect(normalizarConfig({ linkInscricao: 'javascript:alert(1)' }).linkInscricao).toBe('/forms/6aaed6ee00234fc63cf6e9ab')
  })
})

describe('a saúde do cupom', () => {
  const agora = new Date('2026-10-25T12:00:00-03:00')
  const dias = (n: number) => new Date(agora.getTime() - n * 86_400_000)

  it('sem venda e recém-chegado: estreando, não parado', () => {
    expect(saudeDoCupom({ entrouEm: dias(5), diasParaParado: 60, agora }).saude).toBe('estreando')
  })

  it('sem venda há mais que o prazo: parado', () => {
    expect(saudeDoCupom({ entrouEm: dias(90), diasParaParado: 60, agora }).saude).toBe('parado')
  })

  it('venda recente gira, a meio caminho esfria', () => {
    expect(saudeDoCupom({ ultimaVendaEm: dias(3), entrouEm: dias(200), diasParaParado: 60, agora }).saude).toBe('girando')
    expect(saudeDoCupom({ ultimaVendaEm: dias(40), entrouEm: dias(200), diasParaParado: 60, agora }).saude).toBe('esfriando')
    expect(saudeDoCupom({ ultimaVendaEm: dias(61), entrouEm: dias(200), diasParaParado: 60, agora }).saude).toBe('parado')
  })
})

describe('as semanas do gráfico', () => {
  it('a semana começa na segunda-feira, em Brasília', () => {
    // Domingo 25/10/2026 às 23h de Brasília ainda é a semana de 19/10.
    expect(semanaDe(new Date('2026-10-26T01:30:00Z'))).toBe('2026-10-19')
    expect(semanaDe(new Date('2026-10-26T12:00:00-03:00'))).toBe('2026-10-26')
  })

  it('devolve n semanas distintas, da mais antiga para a atual', () => {
    const s = ultimasSemanas(12, new Date('2026-10-25T12:00:00-03:00'))
    expect(s).toHaveLength(12)
    expect(new Set(s).size).toBe(12)
    expect(s[11]).toBe('2026-10-19')
  })
})

describe('link de produto', () => {
  const id = '66ab0123456789abcdef0123'

  it('cada página de produto alcança a compra certa', () => {
    expect(escopoDoDestino(`/materiais/${id}`)).toBe(`material:${id}`)
    expect(escopoDoDestino(`/materiais/${id}/viewer`)).toBe(`material:${id}`)
    expect(escopoDoDestino(`/pacotes/${id}`)).toBe(`package:${id}`)
    expect(escopoDoDestino(`/materiais/checkout?id=${id}&type=package`)).toBe(`package:${id}`)
    expect(escopoDoDestino('/materiais')).toBe('materiais')
    expect(escopoDoDestino('/flashcards/d/anatomia')).toBe('flashcards')
    expect(escopoDoDestino('/buy')).toBe('plus')
    expect(escopoDoDestino('/buy/checkout?plan=semestral')).toBe('plus')
    expect(escopoDoDestino('/manual-clinico/farmacologia')).toBe('manual_clinico')
    expect(escopoDoDestino('/comprar?productType=plus&productId=x')).toBe('plus')
  })

  it('convite e páginas que não vendem nada não aplicam cupom', () => {
    expect(escopoDoDestino('/convite/MARIA10')).toBeNull()
    expect(escopoDoDestino('/')).toBeNull()
    expect(escopoDoDestino('/banco-questoes')).toBeNull()
    expect(escopoDoDestino('/provas')).toBeNull()
  })

  it('o cupom só entra no produto que o link alcança', () => {
    expect(itemNoEscopo(`material:${id}`, { itemType: 'material', itemId: id })).toBe(true)
    expect(itemNoEscopo(`material:${id}`, { itemType: 'material', itemId: '66ab0123456789abcdef9999' })).toBe(false)
    expect(itemNoEscopo('plus', { itemType: 'plus', itemId: 'semestral' })).toBe(true)
    expect(itemNoEscopo('plus', { itemType: 'manual_clinico', itemId: 'x' })).toBe(false)
    expect(itemNoEscopo('materiais', { itemType: 'package', itemId: id })).toBe(true)
    expect(itemNoEscopo('flashcards', { itemType: 'material', itemId: id, materialType: 'flashcard_deck' })).toBe(true)
    expect(itemNoEscopo('flashcards', { itemType: 'material', itemId: id, materialType: 'resumo' })).toBe(false)
  })

  it('o cookie volta igual e recusa lixo', () => {
    expect(lerCookieDoCupom(valorDoCookieDoCupom('MARIA10', `material:${id}`))).toEqual({ codigo: 'MARIA10', escopo: `material:${id}` })
    expect(lerCookieDoCupom('MARIA10.qualquercoisa')).toBeNull()
    expect(lerCookieDoCupom('semponto')).toBeNull()
    expect(lerCookieDoCupom(undefined)).toBeNull()
  })

  it('a URL do produto carrega o embaixador, trocando um vínculo antigo', () => {
    expect(vincularAoEmbaixador('/buy', 'MARIA10')).toBe('/buy?emb=MARIA10')
    expect(vincularAoEmbaixador('/buy/checkout?plan=anual&emb=JOAO10', 'MARIA10')).toBe('/buy/checkout?plan=anual&emb=MARIA10')
  })
})

describe('repasse mensal', () => {
  it('no dia 5, o próximo repasse paga o mês anterior até o dia 10', () => {
    const c = cicloDeRepasse(new Date('2026-11-05T12:00:00-03:00'), 10)
    expect(c.mesFechado).toBe('2026-10')
    expect(c.mesAtual).toBe('2026-11')
    expect(c.prazoDoFechado?.toISOString()).toBe(new Date('2026-11-10T23:59:59-03:00').toISOString())
    expect(c.prazoDoAtual.toISOString()).toBe(new Date('2026-12-10T23:59:59-03:00').toISOString())
    expect(c.inicioDoMesAtual.toISOString()).toBe(new Date('2026-11-01T00:00:00-03:00').toISOString())
  })

  it('passado o dia do repasse, o prazo do mês fechado some (está atrasado ou pago)', () => {
    expect(cicloDeRepasse(new Date('2026-11-15T12:00:00-03:00'), 10).prazoDoFechado).toBeNull()
  })

  it('o mês vira em Brasília, não em UTC', () => {
    // 31/10 às 22h em Brasília já é 01/11 em UTC.
    expect(cicloDeRepasse(new Date('2026-11-01T01:00:00Z'), 10).mesAtual).toBe('2026-10')
  })

  it('a virada de ano', () => {
    expect(deslocarMes('2026-12', 1)).toBe('2027-01')
    expect(deslocarMes('2027-01', -1)).toBe('2026-12')
    expect(rotuloDoMes('2026-10')).toBe('outubro de 2026')
  })

  it('o ID da transação PIX (E2E) é validado e normalizado', () => {
    const ok = validarIdDaTransacao(' e00000000202611101530abc123xyz9z ')
    expect(ok.ok && ok.id).toBe('E00000000202611101530ABC123XYZ9Z')
    expect(validarIdDaTransacao('123').ok).toBe(false)
    expect(validarIdDaTransacao('').ok).toBe(false)
  })
})
