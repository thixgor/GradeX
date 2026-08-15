import { describe, expect, it } from 'vitest'

import {
  COMPARACOES,
  DOENCAS,
  EXAMES,
  MARCADORES,
  MARCADOR_POR_ID,
  PADROES,
  SISTEMAS,
  gruposComConteudo,
  indiceCompleto,
  resumoDoAcervo,
} from '@/lib/exames-laboratoriais'
import { ALTERACOES, PERGUNTAS, buscar } from '@/lib/exames-laboratoriais/busca'
import { BASE, CENARIOS, CENARIO_POR_ID, gerarExame } from '@/lib/exames-laboratoriais/laboratorio-virtual'

/**
 * Integridade do acervo dos Exames Laboratoriais.
 *
 * O conteúdo é ligado por ids escritos à mão em dezenas de arquivos: um
 * marcador cita outro em `relacionados`, um padrão aponta para uma doença, uma
 * doença aponta para um cenário do Laboratório Virtual. Nada disso é validado
 * pelo compilador — `string` é `string`. Um id errado só apareceria como um
 * link morto ou um bloco vazio na tela.
 *
 * Estes testes são o que impede essa deriva. Eles falham no dia em que alguém
 * renomear um marcador e esquecer de atualizar quem o cita.
 */

const IDS = new Set(MARCADORES.map((m) => m.id))

describe('catálogo de marcadores', () => {
  it('não tem ids repetidos', () => {
    const vistos = new Set<string>()
    const repetidos: string[] = []
    for (const m of MARCADORES) {
      if (vistos.has(m.id)) repetidos.push(m.id)
      vistos.add(m.id)
    }
    expect(repetidos).toEqual([])
  })

  it('todo marcador tem nome, resumo, referência e fisiologia', () => {
    for (const m of MARCADORES) {
      expect(m.nome.length, m.id).toBeGreaterThan(2)
      expect(m.resumo.length, m.id).toBeGreaterThan(20)
      expect(m.referencias.length, m.id).toBeGreaterThan(0)
      expect(m.fisiologia.oQueE.length, m.id).toBeGreaterThan(10)
      expect(m.fisiologia.funcao.length, m.id).toBeGreaterThan(5)
    }
  })

  it('toda faixa de referência informa a unidade e de quem ela é', () => {
    for (const m of MARCADORES) {
      for (const r of m.referencias) {
        expect(r.rotulo.length, `${m.id} · ${r.rotulo}`).toBeGreaterThan(0)
        // Ou é um intervalo numérico, ou é um texto — nunca nenhum dos dois.
        const temNumero = r.minimo != null || r.maximo != null
        expect(temNumero || !!r.texto, `${m.id} · ${r.rotulo}`).toBe(true)
      }
    }
  })

  it('todo marcador explica pelo menos um mecanismo de aumento', () => {
    for (const m of MARCADORES) {
      expect(m.aumento.resumo.length, m.id).toBeGreaterThan(20)
      // A exceção legítima é o marcador cuja elevação não tem significado
      // clínico (RDW baixo, basopenia): nesses casos a lista fica vazia de
      // propósito, e o resumo é quem explica por quê.
      if (m.aumento.mecanismos.length === 0) continue
      for (const mec of m.aumento.mecanismos) {
        expect(mec.explicacao.length, `${m.id} · ${mec.titulo}`).toBeGreaterThan(20)
        expect(mec.exemplos.length, `${m.id} · ${mec.titulo}`).toBeGreaterThan(0)
      }
    }
  })

  it('toda cadeia causal tem pelo menos duas etapas — causa e consequência', () => {
    for (const m of MARCADORES) {
      const mecanismos = [...m.aumento.mecanismos, ...(m.reducao?.mecanismos ?? [])]
      for (const mec of mecanismos) {
        for (const exemplo of mec.exemplos) {
          expect(exemplo.causa.length, `${m.id} · ${exemplo.causa}`).toBeGreaterThanOrEqual(3)
          expect(exemplo.etapas.length, `${m.id} · ${exemplo.causa}`).toBeGreaterThanOrEqual(2)
        }
      }
    }
  })

  it('todo id citado em relacionados e em "estudar também" existe', () => {
    const orfas: string[] = []
    for (const m of MARCADORES) {
      for (const r of m.relacionados ?? []) {
        for (const id of r.ids) if (!IDS.has(id)) orfas.push(`${m.id} → relacionados → ${id}`)
      }
      for (const id of m.estudarTambem ?? []) {
        if (!IDS.has(id)) orfas.push(`${m.id} → estudarTambem → ${id}`)
      }
    }
    expect(orfas).toEqual([])
  })

  it('toda comparação tem uma célula por hipótese em cada linha', () => {
    const inconsistentes: string[] = []
    const todas = [...COMPARACOES, ...MARCADORES.flatMap((m) => m.comparacoes ?? [])]
    for (const c of todas) {
      for (const linha of c.linhas) {
        if (linha.celulas.length !== c.hipoteses.length) {
          inconsistentes.push(`${c.id} · ${linha.marcador}: ${linha.celulas.length} de ${c.hipoteses.length}`)
        }
      }
    }
    expect(inconsistentes).toEqual([])
  })
})

describe('exames, sistemas, padrões e doenças', () => {
  it('todo marcador citado num painel existe', () => {
    const orfas: string[] = []
    for (const e of EXAMES) {
      for (const bloco of e.blocos) {
        for (const id of bloco.marcadores) if (!IDS.has(id)) orfas.push(`${e.id} · ${bloco.titulo} → ${id}`)
      }
    }
    expect(orfas).toEqual([])
  })

  it('todo painel tem roteiro de leitura e pelo menos um bloco', () => {
    for (const e of EXAMES) {
      expect(e.comoInterpretar.length, e.id).toBeGreaterThan(2)
      expect(e.blocos.length, e.id).toBeGreaterThan(0)
      expect(e.oQueAvalia.length, e.id).toBeGreaterThan(30)
    }
  })

  it('todo marcador citado num sistema existe', () => {
    const orfas: string[] = []
    for (const s of SISTEMAS) {
      for (const eixo of s.eixos) {
        for (const id of eixo.marcadores) if (!IDS.has(id)) orfas.push(`${s.id} · ${eixo.titulo} → ${id}`)
      }
    }
    expect(orfas).toEqual([])
  })

  it('todo padrão explica o mecanismo e cita achados com id válido', () => {
    const orfas: string[] = []
    for (const p of PADROES) {
      expect(p.mecanismo.length, p.id).toBeGreaterThan(40)
      expect(p.achados.length, p.id).toBeGreaterThan(1)
      for (const a of p.achados) {
        if (a.id && !IDS.has(a.id)) orfas.push(`${p.id} → ${a.id}`)
      }
    }
    expect(orfas).toEqual([])
  })

  it('toda doença explica o porquê de cada achado esperado', () => {
    const orfas: string[] = []
    for (const d of DOENCAS) {
      expect(d.fisiopatologia.length, d.id).toBeGreaterThan(60)
      expect(d.esperado.length, d.id).toBeGreaterThan(2)
      for (const e of d.esperado) {
        expect(e.porque.length, `${d.id} · ${e.marcador}`).toBeGreaterThan(15)
        if (e.id && !IDS.has(e.id)) orfas.push(`${d.id} → ${e.id}`)
      }
    }
    expect(orfas).toEqual([])
  })

  it('toda referência cruzada entre padrões, doenças e comparações resolve', () => {
    const padroes = new Set(PADROES.map((p) => p.id))
    const doencas = new Set(DOENCAS.map((d) => d.id))
    const comparacoes = new Set([...COMPARACOES.map((c) => c.id), ...MARCADORES.flatMap((m) => (m.comparacoes ?? []).map((c) => c.id))])

    const orfas: string[] = []
    for (const p of PADROES) for (const id of p.doencas ?? []) if (!doencas.has(id)) orfas.push(`padrão ${p.id} → doença ${id}`)
    for (const d of DOENCAS) {
      for (const id of d.padroes ?? []) if (!padroes.has(id)) orfas.push(`doença ${d.id} → padrão ${id}`)
      for (const id of d.comparacoes ?? []) if (!comparacoes.has(id)) orfas.push(`doença ${d.id} → comparação ${id}`)
    }
    for (const s of SISTEMAS) for (const id of s.padroes ?? []) if (!padroes.has(id)) orfas.push(`sistema ${s.id} → padrão ${id}`)
    for (const e of EXAMES) for (const id of e.padroes ?? []) if (!padroes.has(id)) orfas.push(`exame ${e.id} → padrão ${id}`)

    expect(orfas).toEqual([])
  })

  it('todo grupo declarado tem pelo menos um marcador', () => {
    for (const g of gruposComConteudo()) {
      expect(g.total, g.id).toBeGreaterThan(0)
    }
  })
})

describe('Laboratório Virtual', () => {
  it('todo marcador de cenário existe na tabela de referência do gerador', () => {
    const orfas: string[] = []
    for (const c of CENARIOS) {
      for (const bloco of c.blocos) {
        for (const id of Object.keys(bloco.valores)) if (!BASE[id]) orfas.push(`${c.id} · ${bloco.titulo} → ${id}`)
      }
    }
    expect(orfas).toEqual([])
  })

  it('a tabela do gerador só usa ids que têm ficha própria', () => {
    // Um valor no laudo sem ficha correspondente vira uma linha que não abre
    // quando a pessoa toca nela — o gesto central da seção falhando em silêncio.
    const semFicha = Object.entries(BASE)
      .map(([id, base]) => base.ficha ?? id)
      .filter((id) => !IDS.has(id))
    expect(semFicha).toEqual([])
  })

  it('todo cenário citado por uma doença ou por um painel existe', () => {
    const orfas: string[] = []
    for (const d of DOENCAS) if (d.cenario && !CENARIO_POR_ID.has(d.cenario)) orfas.push(`doença ${d.id} → ${d.cenario}`)
    for (const e of EXAMES) for (const id of e.cenarios ?? []) if (!CENARIO_POR_ID.has(id)) orfas.push(`exame ${e.id} → ${id}`)
    expect(orfas).toEqual([])
  })

  it('todo cenário tem interpretação completa', () => {
    for (const c of CENARIOS) {
      const i = c.interpretacao
      expect(c.contexto.length, c.id).toBeGreaterThan(20)
      expect(i.alteracoes.length, c.id).toBeGreaterThan(0)
      expect(i.mecanismo.length, c.id).toBeGreaterThan(40)
      expect(i.hipotese.length, c.id).toBeGreaterThan(5)
      expect(i.explicacao.length, c.id).toBeGreaterThan(0)
      if (i.padraoId) expect(PADROES.some((p) => p.id === i.padraoId), `${c.id} → ${i.padraoId}`).toBe(true)
    }
  })

  it('gera valores coerentes com a tendência declarada em cada cenário', () => {
    for (const c of CENARIOS) {
      const exame = gerarExame(c.id, 12345)
      expect(exame, c.id).not.toBeNull()

      for (const bloco of exame!.blocos) {
        const declarados = c.blocos.find((b) => b.titulo === bloco.titulo)!.valores
        for (const valor of bloco.valores) {
          const tendencia = declarados[valor.id]
          if (tendencia === 'n') expect(valor.direcao, `${c.id} · ${valor.id}`).toBe('normal')
          if (tendencia === 'a' || tendencia === 'A' || tendencia === 'AA') {
            expect(valor.direcao, `${c.id} · ${valor.id}`).toMatch(/alto/)
          }
          if (tendencia === 'b' || tendencia === 'B') {
            expect(valor.direcao, `${c.id} · ${valor.id}`).toMatch(/baixo/)
          }
        }
      }
    }
  })

  it('a mesma semente reproduz exatamente o mesmo exame', () => {
    const a = gerarExame('anemia-ferropriva', 999)
    const b = gerarExame('anemia-ferropriva', 999)
    expect(a).toEqual(b)
  })

  it('sementes diferentes produzem valores diferentes no mesmo padrão', () => {
    const a = gerarExame('anemia-ferropriva', 1)!
    const b = gerarExame('anemia-ferropriva', 2)!
    const valoresA = a.blocos.flatMap((bl) => bl.valores.map((v) => v.valor))
    const valoresB = b.blocos.flatMap((bl) => bl.valores.map((v) => v.valor))
    expect(valoresA).not.toEqual(valoresB)
    // Mas o padrão precisa ser o mesmo: as direções não podem mudar.
    const direcoesA = a.blocos.flatMap((bl) => bl.valores.map((v) => v.direcao))
    const direcoesB = b.blocos.flatMap((bl) => bl.valores.map((v) => v.direcao))
    expect(direcoesA).toEqual(direcoesB)
  })

  it('nunca gera valor negativo', () => {
    for (const c of CENARIOS) {
      const exame = gerarExame(c.id, 4242)!
      for (const bloco of exame.blocos) {
        for (const v of bloco.valores) {
          expect(v.valor.startsWith('-'), `${c.id} · ${v.id}`).toBe(false)
        }
      }
    }
  })
})

describe('busca', () => {
  const indice = indiceCompleto()

  it('encontra pelo sinônimo brasileiro, não só pela sigla internacional', () => {
    for (const termo of ['tgo', 'tgp', 'kptt', 'dhl', 'gama gt']) {
      const achados = buscar(indice, termo)
      expect(achados.length, termo).toBeGreaterThan(0)
    }
  })

  it('leva "TGO" e "AST" ao mesmo marcador', () => {
    expect(buscar(indice, 'tgo')[0]?.id).toBe('ast')
    expect(buscar(indice, 'ast')[0]?.id).toBe('ast')
  })

  it('entende o nome da alteração, e não só o do exame', () => {
    expect(buscar(indice, 'hiponatremia')[0]?.id).toBe('sodio')
    expect(buscar(indice, 'hipercalemia')[0]?.id).toBe('potassio')
    expect(buscar(indice, 'microcitose')[0]?.id).toBe('vcm')
  })

  it('responde a perguntas escritas por extenso', () => {
    const achados = buscar(indice, 'Por que a ferritina aumenta na inflamação?')
    expect(achados[0]?.tipo).toBe('pergunta')
  })

  it('toda alteração e toda pergunta apontam para conteúdo que existe', () => {
    const orfas: string[] = []
    for (const a of ALTERACOES) if (!IDS.has(a.marcador)) orfas.push(`alteração ${a.termo} → ${a.marcador}`)
    for (const p of PERGUNTAS) {
      if (p.destino.tipo === 'marcador' && !IDS.has(p.destino.id)) orfas.push(`pergunta "${p.pergunta}" → ${p.destino.id}`)
    }
    expect(orfas).toEqual([])
  })

  it('não devolve nada para consulta curta demais', () => {
    expect(buscar(indice, 'a')).toEqual([])
  })
})

describe('resumo do acervo', () => {
  it('conta o que realmente existe', () => {
    const r = resumoDoAcervo()
    expect(r.marcadores).toBe(MARCADORES.length)
    expect(r.exames).toBe(EXAMES.length)
    expect(r.sistemas).toBe(SISTEMAS.length)
    expect(r.padroes).toBe(PADROES.length)
    expect(r.doencas).toBe(DOENCAS.length)
    expect(r.cadeias).toBeGreaterThan(r.mecanismos)
  })

  it('o índice cobre todos os marcadores', () => {
    const indice = indiceCompleto()
    const doIndice = new Set(indice.filter((i) => i.tipo === 'marcador').map((i) => i.id))
    for (const m of MARCADORES) expect(doIndice.has(m.id), m.id).toBe(true)
  })

  it('todo marcador resolve pelo próprio id', () => {
    for (const m of MARCADORES) expect(MARCADOR_POR_ID.get(m.id)?.nome, m.id).toBe(m.nome)
  })
})
