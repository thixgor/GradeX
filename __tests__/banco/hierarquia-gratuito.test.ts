import { describe, it, expect } from 'vitest'
import {
  descreverCaminho,
  filtrarArvore,
  montarArvore,
  topicosDoRamo,
  paraBusca,
  paraCodigo,
  totalDaArvore,
} from '@/lib/banco/hierarquia'
import {
  LIMITE_GRATUITO,
  descreverSaldo,
  jaDesbloqueada,
  lerEstadoGratuito,
  restantes,
  resumoBloqueado,
  tentarAbrir,
} from '@/lib/banco/gratuito'

const modulos = [
  { _id: 'm1', nome: 'Cardiologia', totalQuestoes: 30 },
  { _id: 'm2', nome: 'Anatomia', totalQuestoes: 10 },
]
const topicos = [
  { _id: 't1', moduloId: 'm1', nome: 'Arritmias', totalQuestoes: 20 },
  { _id: 't2', moduloId: 'm1', nome: 'Insuficiência cardíaca', totalQuestoes: 10 },
  { _id: 't3', moduloId: 'm2', nome: 'Membros', totalQuestoes: 10 },
]
const subtopicos = [
  { _id: 's1', topicoId: 't1', nome: 'Fibrilação atrial', totalQuestoes: 12 },
  { _id: 's2', topicoId: 't1', nome: 'Flutter', totalQuestoes: 8 },
]

describe('árvore da hierarquia', () => {
  it('monta módulos com tópicos e subtópicos, em ordem alfabética', () => {
    const arvore = montarArvore(modulos, topicos, subtopicos)
    expect(arvore.map((m) => m.nome)).toEqual(['Anatomia', 'Cardiologia'])
    const cardio = arvore[1]
    expect(cardio.topicos.map((t) => t.nome)).toEqual(['Arritmias', 'Insuficiência cardíaca'])
    expect(cardio.topicos[0].subtopicos.map((s) => s.nome)).toEqual(['Fibrilação atrial', 'Flutter'])
  })

  it('não soma o subtópico por cima do tópico', () => {
    // O subtópico é um recorte DENTRO do tópico; somar contaria a mesma
    // questão duas vezes e o módulo passaria a mentir.
    const arvore = montarArvore(modulos, topicos, subtopicos)
    expect(arvore[1].topicos[0].totalQuestoes).toBe(20)
    expect(totalDaArvore(arvore)).toBe(40)
  })

  it('cai na soma dos filhos quando o módulo não traz total', () => {
    const arvore = montarArvore([{ _id: 'm1', nome: 'Cardiologia' }], topicos, [])
    expect(arvore[0].totalQuestoes).toBe(30)
  })

  it('módulo sem tópico continua na árvore', () => {
    const arvore = montarArvore([{ _id: 'mx', nome: 'Vazio', totalQuestoes: 0 }], [], [])
    expect(arvore).toHaveLength(1)
    expect(arvore[0].topicos).toEqual([])
  })
})

describe('filtro da árvore', () => {
  const arvore = montarArvore(modulos, topicos, subtopicos)

  it('ignora acento e caixa', () => {
    expect(paraBusca('Fibrilação Atrial')).toBe('fibrilacao atrial')
    const achado = filtrarArvore(arvore, 'fibrilacao')
    expect(achado).toHaveLength(1)
    expect(achado[0].nome).toBe('Cardiologia')
  })

  it('mantém o caminho de quem casou', () => {
    // Arrancar o tópico do módulo faria "Arritmias" aparecer sem dizer de onde
    // veio — e há "Arritmias" em mais de um módulo na vida real.
    const achado = filtrarArvore(arvore, 'arritmias')
    expect(achado[0].nome).toBe('Cardiologia')
    expect(achado[0].topicos.map((t) => t.nome)).toEqual(['Arritmias'])
  })

  it('módulo que casa vem inteiro', () => {
    const achado = filtrarArvore(arvore, 'cardio')
    expect(achado[0].topicos).toHaveLength(2)
  })

  it('termo curto não filtra nada', () => {
    expect(filtrarArvore(arvore, 'a')).toHaveLength(2)
  })
})

describe('códigos e caminho', () => {
  it('gera código estável e idempotente', () => {
    expect(paraCodigo('Insuficiência Cardíaca')).toBe('insuficiencia-cardiaca')
    expect(paraCodigo('  Módulo I  ')).toBe('modulo-i')
    expect(paraCodigo('Período 1 › Módulo I')).toBe('periodo-1-modulo-i')
  })

  it('descreve o caminho pulando o que falta', () => {
    expect(descreverCaminho({ moduloNome: 'Medicina', subtopicoNome: 'Prova' })).toBe('Medicina › Prova')
    expect(descreverCaminho({})).toBe('')
  })
})

describe('experiência gratuita', () => {
  it('começa com o limite cheio', () => {
    const estado = lerEstadoGratuito({})
    expect(restantes(estado)).toBe(LIMITE_GRATUITO)
    expect(descreverSaldo(estado)).toContain(String(LIMITE_GRATUITO))
  })

  it('herda as questões do modelo antigo por período', () => {
    // Quem chegou ontem não pode abrir a página hoje e descobrir que perdeu o
    // que já tinha visto.
    const estado = lerEstadoGratuito({
      freeQuestionsByPeriod: { p1: ['a', 'b'], p2: ['c'] },
    })
    expect(estado.desbloqueadas.sort()).toEqual(['a', 'b', 'c'])
    expect(restantes(estado)).toBe(LIMITE_GRATUITO - 3)
  })

  it('não conta o mesmo id duas vezes vindo dos dois modelos', () => {
    const estado = lerEstadoGratuito({
      bancoQuestoesLiberadas: ['a'],
      freeQuestionsByPeriod: { p1: ['a'] },
    })
    expect(estado.desbloqueadas).toEqual(['a'])
  })

  it('abrir consome saldo; reabrir não', () => {
    const estado = lerEstadoGratuito({ bancoQuestoesLiberadas: ['a'] })
    expect(tentarAbrir(estado, 'a')).toEqual({ liberada: true, gravar: false })
    expect(tentarAbrir(estado, 'b')).toEqual({ liberada: true, gravar: true })
    expect(jaDesbloqueada(estado, 'a')).toBe(true)
  })

  it('trava quando o saldo acaba, mas o que já foi aberto continua aberto', () => {
    const ids = Array.from({ length: LIMITE_GRATUITO }, (_, i) => `q${i}`)
    const estado = lerEstadoGratuito({ bancoQuestoesLiberadas: ids })
    expect(restantes(estado)).toBe(0)
    expect(tentarAbrir(estado, 'nova').liberada).toBe(false)
    expect(tentarAbrir(estado, 'q0').liberada).toBe(true)
  })

  it('o resumo bloqueado mostra metadado, nunca o enunciado', () => {
    const { caminho, etiquetas } = resumoBloqueado({
      moduloNome: 'Medicina',
      topicoNome: 'Período 1',
      tipo: 'objetiva',
      dificuldade: 'dificil',
      ano: 2023,
    })
    expect(caminho).toBe('Medicina › Período 1')
    expect(etiquetas).toEqual(['Objetiva', 'Difícil', '2023'])
  })
})

describe('montarRamos', () => {
  // O caminho que a importação das provas grava no nome do tópico.
  const topicosDeProva = [
    { _id: 't1', moduloId: 'm1', nome: '1º PERÍODO › HAM I', totalQuestoes: 95 },
    { _id: 't2', moduloId: 'm1', nome: '1º PERÍODO › SOI I', totalQuestoes: 131 },
    { _id: 't3', moduloId: 'm1', nome: '2º PERÍODO › HAM II', totalQuestoes: 80 },
    { _id: 't4', moduloId: 'm1', nome: '10º PERÍODO › INT', totalQuestoes: 10 },
  ]

  const arvore = montarArvore([{ _id: 'm1', nome: 'Medicina' }], topicosDeProva, [])

  it('quebra o caminho em níveis em vez de uma linha achatada', () => {
    const ramos = arvore[0].ramos
    expect(ramos.map((r) => r.nome)).toEqual(['1º PERÍODO', '2º PERÍODO', '10º PERÍODO'])
    expect(ramos[0].ramos.map((r) => r.nome)).toEqual(['HAM I', 'SOI I'])
  })

  it('soma o ramo inteiro no nível de cima', () => {
    expect(arvore[0].ramos[0].totalQuestoes).toBe(226)
    expect(arvore[0].ramos[1].totalQuestoes).toBe(80)
  })

  it('só o segmento final carrega o tópico selecionável', () => {
    const periodo = arvore[0].ramos[0]
    expect(periodo.topico).toBeUndefined()
    expect(periodo.ramos[0].topico?._id).toBe('t1')
  })

  it('devolve todos os tópicos de um ramo, para o clique no nível de cima', () => {
    expect(topicosDoRamo(arvore[0].ramos[0]).sort()).toEqual(['t1', 't2'])
  })

  it('tópico sem separador continua sendo um nível só', () => {
    const simples = montarArvore(
      [{ _id: 'm1', nome: 'Cardiologia' }],
      [{ _id: 't1', moduloId: 'm1', nome: 'Arritmias', totalQuestoes: 12 }],
      [],
    )
    expect(simples[0].ramos).toHaveLength(1)
    expect(simples[0].ramos[0].nome).toBe('Arritmias')
    expect(simples[0].ramos[0].topico?._id).toBe('t1')
  })

  it('a busca remonta os ramos com o que sobrou', () => {
    const achado = filtrarArvore(arvore, 'soi')
    expect(achado[0].ramos.map((r) => r.nome)).toEqual(['1º PERÍODO'])
    expect(achado[0].ramos[0].ramos.map((r) => r.nome)).toEqual(['SOI I'])
  })
})
