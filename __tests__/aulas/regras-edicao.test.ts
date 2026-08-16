import { describe, expect, it } from 'vitest'
import {
  chaveDaCondicao,
  descreverRegras,
  normalizarRegras,
  regrasIniciais,
  visibilidadeEquivalente,
} from '@/lib/aulas/regras-edicao'
import { avaliarAcessoAula } from '@/lib/aulas/acesso'
import {
  incluirMembros,
  normalizarGrupo,
  removerMembros,
  separarEmails,
  unicos,
  MAX_MEMBROS,
} from '@/lib/aulas/grupos'

describe('normalizarRegras', () => {
  it('descarta condição sem alvo', () => {
    // "Quem comprou o material" sem material é uma porta que nunca abre, e o
    // admin não perceberia isso olhando a lista.
    const regras = normalizarRegras({
      liberarPara: [{ tipo: 'material' }, { tipo: 'plus' }],
    })
    expect(regras?.liberarPara).toEqual([{ tipo: 'plus' }])
  })

  it('remove condições repetidas', () => {
    const regras = normalizarRegras({
      liberarPara: [
        { tipo: 'plus' },
        { tipo: 'plus' },
        { tipo: 'material', itemId: 'm1' },
        { tipo: 'material', itemId: 'm1', titulo: 'outro nome' },
        { tipo: 'material', itemId: 'm2' },
      ],
    })
    expect(regras?.liberarPara).toHaveLength(3)
  })

  it('devolve null quando não sobra nenhuma condição válida', () => {
    // Sem isso, gravaríamos uma aula com `liberarPara: []` — que o motor trata
    // como "ninguém entra", inclusive quem pagou.
    expect(normalizarRegras({ liberarPara: [] })).toBeNull()
    expect(normalizarRegras({ liberarPara: [{ tipo: 'inventado' }] })).toBeNull()
    expect(normalizarRegras(null)).toBeNull()
  })

  it('só aceita turma no exigirTambem', () => {
    const regras = normalizarRegras({
      liberarPara: [{ tipo: 'plus' }],
      exigirTambem: [{ tipo: 'plus' }, { tipo: 'grupo', grupoId: 'g1' }],
    })
    expect(regras?.exigirTambem).toEqual([{ tipo: 'grupo', grupoId: 'g1', titulo: undefined }])
  })

  it('omite exigirTambem quando fica vazio', () => {
    const regras = normalizarRegras({ liberarPara: [{ tipo: 'plus' }], exigirTambem: [] })
    expect(regras).not.toHaveProperty('exigirTambem')
  })
})

describe('chaveDaCondicao', () => {
  it('separa condições do mesmo tipo com alvos diferentes', () => {
    expect(chaveDaCondicao({ tipo: 'material', itemId: 'a' })).not.toBe(
      chaveDaCondicao({ tipo: 'material', itemId: 'b' }),
    )
    expect(chaveDaCondicao({ tipo: 'plus' })).toBe(chaveDaCondicao({ tipo: 'plus' }))
  })
})

describe('visibilidadeEquivalente', () => {
  it('só chama de gratuita o que está mesmo aberto', () => {
    expect(visibilidadeEquivalente({ liberarPara: [{ tipo: 'publico' }] })).toBe('gratuita')
    expect(visibilidadeEquivalente({ liberarPara: [{ tipo: 'cadastrado' }] })).toBe('gratuita')
  })

  it('erra para o lado de paga quando há qualquer restrição', () => {
    // Errar para "paga" esconde uma aula; errar para "gratuita" publica uma aula
    // trancada. Só um dos dois erros custa dinheiro.
    expect(visibilidadeEquivalente({ liberarPara: [{ tipo: 'plus' }] })).toBe('plus')
    expect(
      visibilidadeEquivalente({
        liberarPara: [{ tipo: 'cadastrado' }],
        exigirTambem: [{ tipo: 'grupo', grupoId: 'g1' }],
      }),
    ).toBe('plus')
  })
})

describe('regrasIniciais', () => {
  it('abre o editor mostrando o que a aula legada já fazia', () => {
    // §45: nada de tela em branco convidando o admin a inventar configuração.
    expect(regrasIniciais({ visibilidade: 'premium' }).liberarPara).toEqual([{ tipo: 'plus' }])
    expect(regrasIniciais({ visibilidade: 'gratuita' }).liberarPara).toEqual([{ tipo: 'cadastrado' }])
  })

  it('prefere as regras próprias quando existem', () => {
    const regras = regrasIniciais({
      visibilidade: 'gratuita',
      regrasAcesso: { liberarPara: [{ tipo: 'grupo', grupoId: 'g1' }] },
    })
    expect(regras.liberarPara).toEqual([{ tipo: 'grupo', grupoId: 'g1' }])
  })

  it('devolve cópias, não as listas originais', () => {
    const original = { liberarPara: [{ tipo: 'plus' as const }] }
    const regras = regrasIniciais({ visibilidade: 'plus', regrasAcesso: original })
    regras.liberarPara.push({ tipo: 'publico' })
    // Editar no formulário não pode mexer no objeto que veio da API.
    expect(original.liberarPara).toHaveLength(1)
  })
})

describe('descreverRegras', () => {
  it('diz que as condições se somam', () => {
    const frase = descreverRegras({
      liberarPara: [{ tipo: 'plus' }, { tipo: 'material', itemId: 'm1', titulo: 'Manual de ECG' }],
    })
    expect(frase).toContain(' ou ')
    expect(frase).toContain('Manual de ECG')
  })

  it('diz que a turma restringe, e não soma', () => {
    // É a diferença entre liberar para trezentas pessoas e para trinta.
    const frase = descreverRegras({
      liberarPara: [{ tipo: 'plus' }],
      exigirTambem: [{ tipo: 'grupo', grupoId: 'g1', titulo: 'Turma A' }],
    })
    expect(frase).toContain('só quem estiver em Turma A')
  })

  it('avisa quando a lista está vazia', () => {
    expect(descreverRegras({ liberarPara: [] })).toContain('Ninguém')
  })
})

describe('as regras editadas valem no motor de acesso', () => {
  // O editor não pode produzir regra que o motor interprete de outro jeito.
  const regras = normalizarRegras({
    liberarPara: [{ tipo: 'plus' }, { tipo: 'material', itemId: 'm1' }],
    exigirTambem: [{ tipo: 'grupo', grupoId: 'g1' }],
  })!

  const aula = { visibilidade: 'plus', regrasAcesso: regras, dataLiberacao: new Date('2020-01-01') }

  it('assinante fora da turma não entra', () => {
    const v = avaliarAcessoAula(aula as any, { logado: true, ehPlus: true, grupos: [] })
    expect(v.liberado).toBe(false)
  })

  it('assinante dentro da turma entra', () => {
    const v = avaliarAcessoAula(aula as any, { logado: true, ehPlus: true, grupos: ['g1'] })
    expect(v.liberado).toBe(true)
  })

  it('comprador do material dentro da turma entra', () => {
    const v = avaliarAcessoAula(aula as any, {
      logado: true,
      ehPlus: false,
      materiais: ['m1'],
      grupos: ['g1'],
    })
    expect(v.liberado).toBe(true)
  })
})

/* ─────────────────────────── Turmas ─────────────────────────── */

describe('normalizarGrupo', () => {
  it('exige nome', () => {
    expect(normalizarGrupo({ nome: '   ' })).toBeNull()
    expect(normalizarGrupo({})).toBeNull()
  })

  it('corta espaços e limita o tamanho', () => {
    const g = normalizarGrupo({ nome: '  Turma A  ', descricao: ' 2026 ' })
    expect(g).toEqual({ nome: 'Turma A', descricao: '2026' })
    expect(normalizarGrupo({ nome: 'x'.repeat(200) })?.nome).toHaveLength(80)
  })
})

describe('separarEmails', () => {
  it('aceita os separadores em que a lista chega no mundo real', () => {
    const texto = 'a@x.com, b@x.com;c@x.com\nd@x.com  e@x.com'
    expect(separarEmails(texto)).toEqual(['a@x.com', 'b@x.com', 'c@x.com', 'd@x.com', 'e@x.com'])
  })

  it('ignora o que não é e-mail e normaliza a caixa', () => {
    expect(separarEmails('Fulano, A@X.COM, ---')).toEqual(['a@x.com'])
  })
})

describe('incluirMembros', () => {
  it('separa adicionados de quem já estava', () => {
    // "12 adicionados" e "12 já estavam" são resultados muito diferentes para
    // quem acabou de colar uma lista.
    const r = incluirMembros(['u1', 'u2'], ['u2', 'u3', 'u3'])
    expect(r.membros).toEqual(['u1', 'u2', 'u3'])
    expect(r.adicionados).toBe(1)
    expect(r.jaEstavam).toBe(1)
  })

  it('respeita o teto e conta o que não coube', () => {
    const cheia = Array.from({ length: MAX_MEMBROS }, (_, i) => `u${i}`)
    const r = incluirMembros(cheia, ['novo1', 'novo2'])
    expect(r.membros).toHaveLength(MAX_MEMBROS)
    expect(r.adicionados).toBe(0)
    expect(r.excedentes).toBe(2)
  })

  it('limpa repetidos que já existiam na lista guardada', () => {
    expect(incluirMembros(['u1', 'u1'], []).membros).toEqual(['u1'])
  })
})

describe('removerMembros', () => {
  it('tira quem foi pedido e mantém o resto', () => {
    expect(removerMembros(['u1', 'u2', 'u3'], ['u2'])).toEqual(['u1', 'u3'])
  })
})

describe('unicos', () => {
  it('preserva a ordem de chegada', () => {
    expect(unicos(['b', 'a', 'b', 'c'])).toEqual(['b', 'a', 'c'])
  })
})
