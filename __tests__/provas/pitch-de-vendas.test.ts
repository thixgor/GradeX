import { describe, expect, it } from 'vitest'
import {
  arredondarProvaSocial,
  DESTINOS_DO_PITCH,
  ehDestinoInterno,
  listarRotulos,
  MAXIMO_DE_DESTINOS,
  MODELOS_DE_PITCH,
  montarPitch,
  normalizarPitch,
  paragrafosDoTextoLivre,
  partirEmNegrito,
  pitchDaProva,
  pitchEstaCompleto,
  pitchVisivelPara,
  PITCH_PADRAO,
  resolverDestinos,
  rotuloDoPitch,
  type PitchDeVendas,
} from '@/lib/provas/pitch-de-vendas'

const DADOS = {
  primeiroNome: 'Ana',
  tituloDaProva: 'Simulado de Clínica Médica',
  aproveitamento: null as number | null,
  estudantes: '',
}

/**
 * O pitch de teste. `mudancas` aceita `email` parcial porque o bloco tem cinco
 * campos e quase todo teste mexe em um — quem preenche os outros quatro é o
 * normalizador, que é justamente o que está sendo exercitado.
 */
type Mudancas = Partial<Omit<PitchDeVendas, 'email'>> & {
  email?: Partial<PitchDeVendas['email']>
}

function pitch(mudancas: Mudancas = {}): PitchDeVendas {
  return normalizarPitch({
    ativo: true,
    modelo: 'prova-social',
    destinos: ['planos'],
    ...mudancas,
  })
}

describe('normalizarPitch', () => {
  it('nasce desligado: prova que ninguém configurou não vende nada', () => {
    expect(normalizarPitch(undefined)).toEqual(PITCH_PADRAO)
    expect(normalizarPitch({}).ativo).toBe(false)
  })

  it('só o booleano true liga — "true" em texto não', () => {
    expect(normalizarPitch({ ativo: 'true' }).ativo).toBe(false)
    expect(normalizarPitch({ ativo: true }).ativo).toBe(true)
  })

  it('esconder de assinantes é o padrão, e um documento antigo continua protegido', () => {
    expect(normalizarPitch({}).esconderDeAssinantes).toBe(true)
    expect(normalizarPitch({ esconderDeAssinantes: false }).esconderDeAssinantes).toBe(false)
  })

  it('modelo desconhecido volta ao padrão', () => {
    expect(normalizarPitch({ modelo: 'hipnose' }).modelo).toBe(PITCH_PADRAO.modelo)
  })

  it('descarta destino que não existe e não repete o mesmo duas vezes', () => {
    const normalizado = normalizarPitch({
      destinos: ['planos', 'secao-que-nao-existe', 'planos', 'materiais'],
    })
    expect(normalizado.destinos).toEqual(['planos', 'materiais'])
  })

  it('corta a lista de destinos no máximo que cabe no cartão', () => {
    const todos = DESTINOS_DO_PITCH.map((destino) => destino.chave)
    expect(todos.length).toBeGreaterThan(MAXIMO_DE_DESTINOS)
    expect(normalizarPitch({ destinos: todos }).destinos).toHaveLength(MAXIMO_DE_DESTINOS)
  })

  it('corta os textos no limite em vez de aceitar um documento gigante', () => {
    const normalizado = normalizarPitch({
      personalizado: { titulo: 'a'.repeat(500), texto: 'b'.repeat(5000), chamada: 'c'.repeat(200) },
      email: {
        assunto: 'd'.repeat(500),
        titulo: 'e'.repeat(500),
        texto: 'f'.repeat(5000),
        chamada: 'g'.repeat(200),
      },
    })
    expect(normalizado.personalizado.titulo).toHaveLength(120)
    expect(normalizado.personalizado.texto).toHaveLength(1500)
    expect(normalizado.personalizado.chamada).toHaveLength(40)
    expect(normalizado.email.assunto).toHaveLength(120)
    expect(normalizado.email.titulo).toHaveLength(120)
    expect(normalizado.email.texto).toHaveLength(1500)
    expect(normalizado.email.chamada).toHaveLength(40)
  })

  it('o bloco de e-mail nasce inteiro e vazio', () => {
    expect(normalizarPitch({}).email).toEqual({
      ativo: false,
      assunto: '',
      titulo: '',
      texto: '',
      chamada: '',
    })
  })

  it('lê o bloco do documento da prova', () => {
    expect(pitchDaProva({ pitchDeVendas: { ativo: true, destinos: ['planos'] } } as any).ativo).toBe(true)
    expect(pitchDaProva(null)).toEqual(PITCH_PADRAO)
  })
})

describe('ehDestinoInterno', () => {
  it('aceita rota deste site', () => {
    expect(ehDestinoInterno('/buy')).toBe(true)
    expect(ehDestinoInterno('/manual-clinico/histologia')).toBe(true)
  })

  it('recusa tudo que tiraria o aluno do aplicativo', () => {
    // O ponto inteiro da funcionalidade: destino é seção, nunca link.
    expect(ehDestinoInterno('https://exemplo.com')).toBe(false)
    // Protocolo relativo: o navegador lê como host externo.
    expect(ehDestinoInterno('//exemplo.com')).toBe(false)
    expect(ehDestinoInterno('javascript:alert(1)')).toBe(false)
    expect(ehDestinoInterno('materiais')).toBe(false)
    expect(ehDestinoInterno(null)).toBe(false)
  })

  it('todo destino do catálogo é interno', () => {
    for (const destino of DESTINOS_DO_PITCH) {
      expect(ehDestinoInterno(destino.href)).toBe(true)
    }
  })
})

describe('resolverDestinos', () => {
  it('preserva a ordem escolhida — o primeiro vira o botão principal', () => {
    const destinos = resolverDestinos(['materiais', 'planos'])
    expect(destinos.map((d) => d.chave)).toEqual(['materiais', 'planos'])
  })

  it('lista vazia, entrada estranha e nulo devolvem nada', () => {
    expect(resolverDestinos(undefined)).toEqual([])
    expect(resolverDestinos('planos')).toEqual([])
    expect(resolverDestinos([null, 42, ''])).toEqual([])
  })
})

describe('pitchEstaCompleto', () => {
  it('desligado nunca está completo', () => {
    expect(pitchEstaCompleto(pitch({ ativo: false }))).toBe(false)
  })

  it('sem destino não está completo: um convite precisa de um lugar', () => {
    expect(pitchEstaCompleto(pitch({ destinos: [] }))).toBe(false)
  })

  it('personalizado sem texto não está completo', () => {
    expect(pitchEstaCompleto(pitch({ modelo: 'personalizado' }))).toBe(false)
    expect(
      pitchEstaCompleto(
        pitch({ modelo: 'personalizado', personalizado: { titulo: 'Oi', texto: '', chamada: '' } }),
      ),
    ).toBe(true)
  })
})

describe('pitchVisivelPara', () => {
  const prova = (config: Partial<PitchDeVendas>) => ({ pitchDeVendas: pitch(config) }) as any

  it('mostra para conta gratuita', () => {
    expect(pitchVisivelPara(prova({}), { accountType: 'gratuito' })).toBe(true)
  })

  it('esconde de quem já assina, e de admin junto', () => {
    expect(pitchVisivelPara(prova({}), { accountType: 'plus' })).toBe(false)
    expect(pitchVisivelPara(prova({}), { accountType: 'gratuito', isAdmin: true })).toBe(false)
  })

  it('com a trava desligada, o assinante também vê', () => {
    const aberto = prova({ esconderDeAssinantes: false })
    expect(pitchVisivelPara(aberto, { accountType: 'plus' })).toBe(true)
  })

  it('prova sem pitch não mostra nada', () => {
    expect(pitchVisivelPara({} as any, { accountType: 'gratuito' })).toBe(false)
  })
})

describe('montarPitch', () => {
  it('devolve nulo quando não há o que mostrar', () => {
    expect(montarPitch(pitch({ ativo: false }), DADOS)).toBeNull()
    expect(montarPitch(pitch({ destinos: [] }), DADOS)).toBeNull()
  })

  it('todo modelo pronto produz título, parágrafos, botão e assunto de e-mail', () => {
    for (const modelo of MODELOS_DE_PITCH) {
      if (modelo.chave === 'personalizado') continue
      const montado = montarPitch(pitch({ modelo: modelo.chave }), DADOS)!
      expect(montado, modelo.chave).not.toBeNull()
      expect(montado.titulo.length, modelo.chave).toBeGreaterThan(0)
      expect(montado.paragrafos.length, modelo.chave).toBeGreaterThan(0)
      expect(montado.chamada.length, modelo.chave).toBeGreaterThan(0)
      expect(montado.email.assunto.length, modelo.chave).toBeGreaterThan(0)
      expect(montado.email.paragrafos.length, modelo.chave).toBeGreaterThan(0)
    }
  })

  it('nenhum modelo escreve token de template cru', () => {
    for (const modelo of MODELOS_DE_PITCH) {
      if (modelo.chave === 'personalizado') continue
      const montado = montarPitch(pitch({ modelo: modelo.chave }), DADOS)!
      const tudo = [montado.titulo, ...montado.paragrafos, montado.email.assunto].join(' ')
      expect(tudo, modelo.chave).not.toMatch(/\{\{|undefined|NaN/)
    }
  })

  it('a prova social some quando o número real não veio', () => {
    const semNumero = montarPitch(pitch({ modelo: 'prova-social' }), DADOS)!
    expect(semNumero.paragrafos.join(' ')).not.toMatch(/estudantes\*\*/)

    const comNumero = montarPitch(pitch({ modelo: 'prova-social' }), { ...DADOS, estudantes: '1.200+' })!
    expect(comNumero.paragrafos.join(' ')).toContain('1.200+')
  })

  it('o modelo lógico usa a nota quando ela é do aluno, e cai para a versão sem número quando não é', () => {
    const comNota = montarPitch(pitch({ modelo: 'logica' }), { ...DADOS, aproveitamento: 68 })!
    expect(comNota.titulo).toContain('68%')
    expect(comNota.titulo).toContain('32%')

    // Nota presa até o término: o pitch não é a porta dos fundos dela.
    const semNota = montarPitch(pitch({ modelo: 'logica' }), DADOS)!
    expect(semNota.titulo).not.toMatch(/\d+%/)
  })

  it('o texto personalizado vira título e parágrafos, com o botão escolhido', () => {
    const montado = montarPitch(
      pitch({
        modelo: 'personalizado',
        personalizado: {
          titulo: 'A turma de setembro abre segunda',
          texto: 'Primeiro parágrafo.\n\nSegundo **em negrito**.\n\nTerceiro.',
          chamada: 'Quero minha vaga',
        },
      }),
      DADOS,
    )!

    expect(montado.titulo).toBe('A turma de setembro abre segunda')
    expect(montado.paragrafos).toHaveLength(3)
    expect(montado.chamada).toBe('Quero minha vaga')
    // A prévia do e-mail é o começo, não o pitch inteiro.
    expect(montado.email.paragrafos).toHaveLength(2)
  })

  it('sem título, o personalizado promove o primeiro parágrafo a título', () => {
    const montado = montarPitch(
      pitch({
        modelo: 'personalizado',
        personalizado: { titulo: '', texto: 'Isto vira o título.\n\nIsto é o corpo.', chamada: '' },
      }),
      DADOS,
    )!
    expect(montado.titulo).toBe('Isto vira o título.')
    expect(montado.paragrafos).toEqual(['Isto é o corpo.'])
  })

  it('o e-mail sai completo, com destino, mesmo sem o admin escrever nada', () => {
    const montado = montarPitch(pitch({ modelo: 'valores', destinos: ['materiais'] }), DADOS)!

    expect(montado.email.assunto.length).toBeGreaterThan(0)
    // Título e botão do e-mail são os do CARTÃO quando ninguém os sobrescreve.
    expect(montado.email.titulo).toBe(montado.titulo)
    expect(montado.email.chamada).toBe(montado.chamada)
    expect(montado.email.destino).toBe('/materiais')
  })

  it('cada campo escrito pelo admin ganha do que o modelo escreveria', () => {
    const padrao = montarPitch(pitch({ modelo: 'valores' }), DADOS)!
    const meu = montarPitch(
      pitch({
        modelo: 'valores',
        email: {
          ativo: true,
          assunto: 'Assunto meu',
          titulo: 'Título meu',
          texto: 'Primeiro **meu**.\n\nSegundo meu.',
          chamada: 'Botão meu',
        },
      }),
      DADOS,
    )!

    expect(meu.email.assunto).toBe('Assunto meu')
    expect(meu.email.titulo).toBe('Título meu')
    expect(meu.email.paragrafos).toEqual(['Primeiro **meu**.', 'Segundo meu.'])
    expect(meu.email.chamada).toBe('Botão meu')

    // E o cartão na tela não muda por causa do e-mail: são coisas separadas.
    expect(meu.titulo).toBe(padrao.titulo)
    expect(meu.chamada).toBe(padrao.chamada)
    expect(meu.paragrafos).toEqual(padrao.paragrafos)
  })

  it('campo em branco cai para o padrão, um a um', () => {
    const montado = montarPitch(
      pitch({
        modelo: 'valores',
        email: { ativo: true, titulo: 'Só o título' },
      }),
      DADOS,
    )!
    const padrao = montarPitch(pitch({ modelo: 'valores' }), DADOS)!

    expect(montado.email.titulo).toBe('Só o título')
    expect(montado.email.assunto).toBe(padrao.email.assunto)
    expect(montado.email.paragrafos).toEqual(padrao.email.paragrafos)
    expect(montado.email.chamada).toBe(padrao.email.chamada)
  })

  it('no modelo personalizado o e-mail também é editável por cima do texto livre', () => {
    const montado = montarPitch(
      pitch({
        modelo: 'personalizado',
        personalizado: { titulo: 'Turma de setembro', texto: 'Um.\n\nDois.\n\nTrês.', chamada: 'Quero vaga' },
        email: { ativo: true, texto: 'Só isto no e-mail.' },
      }),
      DADOS,
    )!

    expect(montado.email.paragrafos).toEqual(['Só isto no e-mail.'])
    // O que não foi escrito continua vindo do cartão personalizado.
    expect(montado.email.titulo).toBe('Turma de setembro')
    expect(montado.email.chamada).toBe('Quero vaga')
  })

  it('só entrega destinos internos, na ordem escolhida', () => {
    const montado = montarPitch(pitch({ destinos: ['materiais', 'planos'] }), DADOS)!
    expect(montado.destinos.map((d) => d.chave)).toEqual(['materiais', 'planos'])
    for (const destino of montado.destinos) {
      expect(ehDestinoInterno(destino.href)).toBe(true)
    }
  })
})

describe('arredondarProvaSocial', () => {
  it('arredonda para baixo em centenas — "1.247" tem cara de número inventado', () => {
    expect(arredondarProvaSocial(1247)).toBe('1.200+')
    expect(arredondarProvaSocial(100)).toBe('100+')
  })

  it('abaixo de cem não arredonda, e abaixo de vinte não fala', () => {
    expect(arredondarProvaSocial(64)).toBe('64')
    expect(arredondarProvaSocial(19)).toBe('')
    expect(arredondarProvaSocial(0)).toBe('')
    expect(arredondarProvaSocial(undefined)).toBe('')
  })
})

describe('partirEmNegrito', () => {
  it('separa o que está entre asteriscos duplos', () => {
    expect(partirEmNegrito('antes **forte** depois')).toEqual([
      { texto: 'antes ', forte: false },
      { texto: 'forte', forte: true },
      { texto: ' depois', forte: false },
    ])
  })

  it('asterisco desemparelhado fica como texto', () => {
    expect(partirEmNegrito('um ** dois')).toEqual([{ texto: 'um ** dois', forte: false }])
  })
})

describe('paragrafosDoTextoLivre', () => {
  it('linha em branco separa; espaço sobrando não cria parágrafo vazio', () => {
    expect(paragrafosDoTextoLivre('um\n\n  \n\ndois\n\n')).toEqual(['um', 'dois'])
  })
})

describe('listarRotulos e rotuloDoPitch', () => {
  it('enumera em português', () => {
    expect(listarRotulos([])).toBe('a plataforma')
    expect(listarRotulos(resolverDestinos(['planos']))).toBe('Planos')
    expect(listarRotulos(resolverDestinos(['planos', 'materiais']))).toBe('Planos e Materiais')
    expect(listarRotulos(resolverDestinos(['planos', 'materiais', 'aulas']))).toBe(
      'Planos, Materiais e Aulas',
    )
  })

  it('resume o estado para o cartão do admin', () => {
    expect(rotuloDoPitch(pitch({ ativo: false }))).toContain('desligado')
    expect(rotuloDoPitch(pitch({ destinos: [] }))).toContain('sem destino')
    expect(rotuloDoPitch(pitch({ email: { ativo: true, assunto: '' } }))).toContain('e-mail')
  })
})
