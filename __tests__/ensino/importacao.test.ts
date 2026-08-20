import { describe, expect, it } from 'vitest'
import {
  conferirPacote,
  lerDuracaoEmSegundos,
  lerJson,
  lerMarkdown,
  lerPacote,
} from '@/lib/ensino/importacao'

const ARQUIVO = `# Importação — Cardiologia

## Taxonomia

- Área: Medicina
  - Módulo: Ciclo Básico
    - Tópico: Sistema Cardiovascular
      - Subtópico: Fisiologia
  - Módulo: Ciclo Clínico
    - Tópico: Cardiologia
      - Subtópico: Insuficiência Cardíaca

## Aulas

### Aula: Lei de Frank-Starling
- localizacao: Medicina > Ciclo Básico > Sistema Cardiovascular > Fisiologia
- duracao: 12min
- profundidade: essencial
- professor: Dra. Helena Prado
- tags: hemodinâmica, contratilidade
- video: https://cdn.exemplo.com/frank-starling.mp4
- descricao: A relação entre estiramento da fibra e força de contração.
- prerequisitos: Débito cardíaco
- resumo: Frank-Starling em 3 minutos | 3min | https://cdn.exemplo.com/fs-resumo.mp4
- pdf: Resumo em PDF | https://cdn.exemplo.com/fs.pdf
- acesso: plus

### Aula: Fisiopatologia da Insuficiência Cardíaca
- localizacao: Medicina > Ciclo Clínico > Cardiologia > Insuficiência Cardíaca
- duracao: 18min
- profundidade: intermediario

## Trilhas

### Trilha: Entenda Insuficiência Cardíaca do Zero
- subtitulo: Do débito cardíaco ao tratamento da ICFEr
- nivel: iniciante
- publico: Ciclo Clínico
- duracao: 6h
- certificado: sim
- aprendizados:
  - Explicar a fisiopatologia da IC
  - Classificar pela fração de ejeção

#### Etapa: Antes da doença
- Lei de Frank-Starling
- Débito cardíaco

#### Etapa: Entenda a doença
- Fisiopatologia da Insuficiência Cardíaca
`

describe('lerDuracaoEmSegundos', () => {
  it('aceita as formas que um humano escreve', () => {
    expect(lerDuracaoEmSegundos('12min')).toBe(720)
    expect(lerDuracaoEmSegundos('1h20')).toBe(4800)
    expect(lerDuracaoEmSegundos('1h 30min')).toBe(5400)
    expect(lerDuracaoEmSegundos('18:42')).toBe(1122)
    expect(lerDuracaoEmSegundos('1:05:03')).toBe(3903)
    expect(lerDuracaoEmSegundos('45s')).toBe(45)
    // Só um número: minutos, que é a leitura provável num plano de aula.
    expect(lerDuracaoEmSegundos('12')).toBe(720)
    expect(lerDuracaoEmSegundos('')).toBe(0)
  })
})

describe('lerMarkdown', () => {
  const pacote = lerMarkdown(ARQUIVO)

  it('monta a taxonomia com o caminho de cada nó', () => {
    expect(pacote.nos).toHaveLength(7)
    const subtopico = pacote.nos.find((n) => n.nome === 'Insuficiência Cardíaca')!
    expect(subtopico.nivel).toBe('subtopico')
    expect(subtopico.caminho).toEqual(['Medicina', 'Ciclo Clínico', 'Cardiologia'])
  })

  it('reinicia o caminho ao subir de nível', () => {
    const cardio = pacote.nos.find((n) => n.nome === 'Cardiologia')!
    expect(cardio.caminho).toEqual(['Medicina', 'Ciclo Clínico'])
  })

  it('lê os campos da aula', () => {
    const aula = pacote.aulas.find((a) => a.titulo === 'Lei de Frank-Starling')!
    expect(aula.slug).toBe('lei-de-frank-starling')
    expect(aula.duracaoSegundos).toBe(720)
    expect(aula.profundidade).toBe('essencial')
    expect(aula.professor).toBe('Dra. Helena Prado')
    expect(aula.tags).toEqual(['hemodinâmica', 'contratilidade'])
    expect(aula.caminho).toEqual([
      'Medicina',
      'Ciclo Básico',
      'Sistema Cardiovascular',
      'Fisiologia',
    ])
    expect(aula.prerequisitos).toEqual(['Débito cardíaco'])
    expect(aula.acesso).toBe('plus')
  })

  it('lê a Aula Resumo vinculada', () => {
    const aula = pacote.aulas.find((a) => a.titulo === 'Lei de Frank-Starling')!
    expect(aula.resumo).toEqual({
      titulo: 'Frank-Starling em 3 minutos',
      video: 'https://cdn.exemplo.com/fs-resumo.mp4',
      duracaoSegundos: 180,
    })
  })

  it('lê PDF com nome e endereço', () => {
    const aula = pacote.aulas[0]
    expect(aula.pdfs).toEqual([{ nome: 'Resumo em PDF', url: 'https://cdn.exemplo.com/fs.pdf' }])
  })

  it('monta a Trilha com etapas na ordem', () => {
    const trilha = pacote.trilhas[0]
    expect(trilha.titulo).toBe('Entenda Insuficiência Cardíaca do Zero')
    expect(trilha.slug).toBe('entenda-insuficiencia-cardiaca-do-zero')
    expect(trilha.nivel).toBe('iniciante')
    expect(trilha.certificado).toBe(true)
    expect(trilha.duracaoEstimadaMin).toBe(360)
    expect(trilha.aprendizados).toEqual([
      'Explicar a fisiopatologia da IC',
      'Classificar pela fração de ejeção',
    ])
    expect(trilha.etapas.map((e) => e.titulo)).toEqual(['Antes da doença', 'Entenda a doença'])
    expect(trilha.etapas[0].aulas).toEqual(['Lei de Frank-Starling', 'Débito cardíaco'])
  })

  it('avisa em vez de recusar o arquivo por uma linha torta', () => {
    const p = lerMarkdown(`## Aulas\n\n### Aula: X\n- campo-que-nao-existe: 1\n- duracao: 5min\n`)
    expect(p.aulas[0].duracaoSegundos).toBe(300)
    expect(p.avisos.some((a) => a.includes('campo-que-nao-existe'))).toBe(true)
  })

  it('sobrevive a arquivo vazio', () => {
    const p = lerMarkdown('')
    expect(p.aulas).toEqual([])
    expect(p.trilhas).toEqual([])
  })
})

describe('lerJson', () => {
  it('produz a mesma estrutura do Markdown', () => {
    const p = lerJson(
      JSON.stringify({
        nos: [{ nivel: 'Área', nome: 'Medicina' }],
        aulas: [
          {
            titulo: 'Hipercalemia',
            localizacao: 'Medicina > Ciclo Clínico > Nefrologia',
            duracao: '9min',
            tags: ['potássio'],
            profundidade: 'essencial',
          },
        ],
        trilhas: [
          { titulo: 'Distúrbios do Potássio', etapas: [{ titulo: 'Base', aulas: ['Hipercalemia'] }] },
        ],
      }),
    )
    expect(p.nos[0].nivel).toBe('area')
    expect(p.aulas[0].caminho).toEqual(['Medicina', 'Ciclo Clínico', 'Nefrologia'])
    expect(p.aulas[0].duracaoSegundos).toBe(540)
    expect(p.trilhas[0].etapas[0].aulas).toEqual(['Hipercalemia'])
  })

  it('avisa em vez de estourar com JSON inválido', () => {
    const p = lerJson('{ nao é json')
    expect(p.aulas).toEqual([])
    expect(p.avisos[0]).toContain('inválido')
  })
})

describe('lerPacote', () => {
  it('escolhe o analisador pelo conteúdo', () => {
    expect(lerPacote('{"aulas":[{"titulo":"A"}]}').aulas).toHaveLength(1)
    expect(lerPacote('## Aulas\n### Aula: B\n').aulas[0].titulo).toBe('B')
  })
})

describe('conferirPacote', () => {
  it('lista as aulas citadas que não estão no arquivo', () => {
    const conferencia = conferirPacote(lerMarkdown(ARQUIVO))
    expect(conferencia.aulas).toBe(2)
    expect(conferencia.resumos).toBe(1)
    expect(conferencia.trilhas).toBe(1)
    expect(conferencia.etapas).toBe(2)
    // "Débito cardíaco" é citada pela Trilha e não vem no arquivo: ou já existe
    // na plataforma (reuso, o caso desejado) ou é erro de digitação.
    expect(conferencia.aulasCitadasForaDoPacote).toEqual(['Débito cardíaco'])
  })

  it('aponta aula repetida e aula sem localização', () => {
    const c = conferirPacote(lerMarkdown('## Aulas\n### Aula: X\n### Aula: X\n'))
    expect(c.problemas.some((p) => p.includes('mais de uma vez'))).toBe(true)
    expect(c.problemas.some((p) => p.includes('avulsa'))).toBe(true)
  })
})
