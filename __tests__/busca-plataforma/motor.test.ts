import { describe, expect, it } from 'vitest'

import { criarBuscador, indexar, ranquear, type ItemBuscavel } from '@/lib/busca-plataforma/motor'
import {
  chaveDeBusca,
  distanciaLimitada,
  fatiarParaRealce,
  iniciais,
  termosDaConsulta,
} from '@/lib/busca-plataforma/texto'

const ITENS: ItemBuscavel[] = [
  {
    id: 'area:bancoQuestoes',
    titulo: 'Banco de Questões',
    subtitulo: 'Questões, listas, histórico e treino por assuntos.',
    trilha: 'Áreas da plataforma',
    palavrasChave: ['banco', 'questoes', 'bq', 'exercicios', 'treino'],
    prioridade: 10,
  },
  {
    id: 'pagina:banco-historico',
    titulo: 'Histórico de questões',
    subtitulo: 'Tudo o que você já respondeu.',
    trilha: 'Banco de Questões',
    palavrasChave: ['historico', 'respondidas', 'desempenho'],
    prioridade: 5,
  },
  {
    id: 'area:mapaMental',
    titulo: 'Mapas Mentais',
    subtitulo: 'Editor de mapas mentais e comunidade.',
    trilha: 'Áreas da plataforma',
    palavrasChave: ['mindmap', 'esquema'],
    prioridade: 10,
  },
  {
    id: 'conteudo:patologia',
    titulo: 'Insuficiência cardíaca',
    subtitulo: 'I50 · Cardiovascular',
    trilha: 'Manual Clínico',
    palavrasChave: ['ic', 'falência cardíaca'],
    prioridade: 6,
  },
  {
    id: 'conta:perfil',
    titulo: 'Meu perfil',
    subtitulo: 'Seus dados, progresso e preferências.',
    trilha: 'Conta',
    palavrasChave: ['perfil', 'conta', 'dados', 'senha', 'foto', 'editar perfil', 'estatisticas'],
    prioridade: 8,
  },
  {
    id: 'ferramenta:cardiologia',
    titulo: 'Cardiologia',
    subtitulo: '29 calculadoras — ECG, escores de risco e hemodinâmica',
    trilha: 'Manual Clínico › Ferramentas Clínicas',
    palavrasChave: ['calculadora', 'escore'],
    prioridade: 6,
  },
]

const INDICE = indexar(ITENS)

function ids(consulta: string, opcoes = {}) {
  return ranquear(INDICE, consulta, opcoes).map(r => r.item.id)
}

describe('normalização', () => {
  it('ignora acento e caixa', () => {
    expect(chaveDeBusca('Insuficiência CARDÍACA')).toBe('insuficiencia cardiaca')
  })

  it('descarta conectivos, mas não quando são tudo o que existe', () => {
    expect(termosDaConsulta('banco de questões')).toEqual(['banco', 'questoes'])
    expect(termosDaConsulta('de')).toEqual(['de'])
  })

  it('monta a sigla a partir das palavras significativas', () => {
    expect(iniciais('banco de questoes')).toBe('bq')
  })
})

describe('distância com teto', () => {
  it('conta transposição de vizinhos como um erro só', () => {
    expect(distanciaLimitada('cardiolgoia', 'cardiologia', 2)).toBeLessThanOrEqual(2)
  })

  it('desiste cedo quando as palavras não se parecem', () => {
    expect(distanciaLimitada('cronograma', 'flashcards', 2)).toBe(3)
  })
})

describe('ranqueamento', () => {
  it('encontra pelo início da palavra antes de terminar de digitar', () => {
    expect(ids('banc')[0]).toBe('area:bancoQuestoes')
  })

  it('encontra pela sigla', () => {
    expect(ids('bq')[0]).toBe('area:bancoQuestoes')
  })

  it('encontra com acento faltando', () => {
    expect(ids('insuficiencia cardiaca')[0]).toBe('conteudo:patologia')
  })

  it('tolera erro de digitação', () => {
    expect(ids('cardiolgoia')).toContain('ferramenta:cardiologia')
  })

  it('casa o termo escrito sem espaço, inclusive por cima dos conectivos', () => {
    expect(ids('mapasmentais')[0]).toBe('area:mapaMental')
    expect(ids('bancoquestoes')[0]).toBe('area:bancoQuestoes')
  })

  it('exige que TODOS os termos apareçam', () => {
    // "histórico" existe; "rifa" não existe em item nenhum desta lista.
    expect(ids('historico rifa')).toEqual([])
  })

  it('prefere o título ao texto de apoio', () => {
    const ordem = ids('historico')
    expect(ordem[0]).toBe('pagina:banco-historico')
  })

  it('não casa por letras espalhadas dentro de um campo longo', () => {
    // "flash" tem f, l, a, s e h em ordem dentro da lista de palavras-chave de
    // "Meu perfil". Subsequência em campo longo não é sinal de relevância.
    expect(ids('flash')).not.toContain('conta:perfil')
  })

  it('não penaliza o item por ter, ALÉM do casamento certeiro, um parecido no texto de apoio', () => {
    // "cardiologia" bate no título; "cardíaca" (do outro item) é só parecida.
    // O desconto de casamento aproximado não pode cair sobre quem acertou.
    const ordem = ids('cardiologia')
    expect(ordem[0]).toBe('ferramenta:cardiologia')
  })

  it('uma letra solta não arrasta o catálogo inteiro', () => {
    // O "x" de "raio x" aparece dentro de alguma palavra de quase todo item.
    // Só quem tem a palavra inteira responde.
    expect(ids('raio x')).toEqual([])
  })

  it('devolve nada para consulta vazia', () => {
    expect(ids('')).toEqual([])
    expect(ids('   ')).toEqual([])
  })

  it('respeita o limite depois de ordenar', () => {
    expect(ranquear(INDICE, 'questoes', { limite: 1 })).toHaveLength(1)
  })
})

describe('personalização', () => {
  it('sobe o item que o usuário costuma abrir', () => {
    const agora = Date.now()
    const semHistorico = ids('questoes')
    const comHistorico = ids('questoes', {
      historico: {
        aberturas: { 'pagina:banco-historico': 12 },
        ultimaAbertura: { 'pagina:banco-historico': agora },
      },
      agora,
    })

    expect(semHistorico[0]).toBe('area:bancoQuestoes')
    expect(comHistorico[0]).toBe('pagina:banco-historico')
  })
})

describe('buscador com cache', () => {
  it('devolve o mesmo objeto para a mesma consulta', () => {
    const buscador = criarBuscador(ITENS)
    const primeira = buscador.buscar('banco')
    const segunda = buscador.buscar('BANCO')
    expect(segunda).toBe(primeira)
  })

  it('recalcula quando a versão do histórico muda', () => {
    const buscador = criarBuscador(ITENS)
    const primeira = buscador.buscar('banco', { versao: 1 })
    const segunda = buscador.buscar('banco', { versao: 2 })
    expect(segunda).not.toBe(primeira)
  })
})

describe('realce', () => {
  it('recorta o texto original, com acento e maiúscula', () => {
    const fatias = fatiarParaRealce('Insuficiência cardíaca', ['cardiaca'])
    expect(fatias.filter(f => f.realce).map(f => f.texto)).toEqual(['cardíaca'])
    expect(fatias.map(f => f.texto).join('')).toBe('Insuficiência cardíaca')
  })

  it('não realça nada quando o termo não aparece', () => {
    const fatias = fatiarParaRealce('Mapas Mentais', ['rifa'])
    expect(fatias).toEqual([{ texto: 'Mapas Mentais', realce: false }])
  })
})
