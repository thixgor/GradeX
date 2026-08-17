/**
 * A organização do Banco de Questões: Módulo → Tópico → Subtópico.
 *
 * Antes havia um nível acima de tudo, "Período" ("SOI I", "HAM II"). Ele foi
 * removido do produto porque era a pior porta de entrada possível: pedia que a
 * pessoa soubesse o nome interno da grade da faculdade ANTES de ver uma única
 * questão, e um módulo só existia dentro de um período — então "Cardiologia"
 * podia estar em dois lugares sem que ninguém percebesse.
 *
 * O campo `periodoId` continua nos documentos antigos e nada foi apagado (a
 * transição é por leitura, não por script): ele simplesmente deixou de ser lido.
 * Módulo passou a ser o topo.
 *
 * Este arquivo não importa nada — é lido pelas telas e pelas rotas, que
 * precisam concordar sobre a mesma árvore.
 */

export interface NoDeHierarquia {
  _id: string
  nome: string
  /** Contagem do ramo inteiro, já somada. */
  totalQuestoes: number
}

export interface ModuloDaArvore extends NoDeHierarquia {
  topicos: TopicoDaArvore[]
}

export interface TopicoDaArvore extends NoDeHierarquia {
  moduloId: string
  subtopicos: NoDeHierarquia[]
}

interface ModuloBruto {
  _id: string
  nome: string
  ordem?: number
  totalQuestoes?: number
}
interface TopicoBruto {
  _id: string
  moduloId: string
  nome: string
  ordem?: number
  totalQuestoes?: number
}
interface SubtopicoBruto {
  _id: string
  topicoId: string
  nome: string
  ordem?: number
  totalQuestoes?: number
}

/** Remove acentos e caixa. "Fibrilação Atrial" → "fibrilacao atrial". */
export function paraBusca(valor: string): string {
  return (valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Código estável a partir do nome — usado para casar hierarquia na importação.
 *
 * Precisa ser idempotente: importar duas vezes o mesmo material não pode criar
 * "Cardiologia" e "cardiologia " como dois módulos diferentes.
 */
export function paraCodigo(valor: string): string {
  return paraBusca(valor)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Monta a árvore com as contagens somadas de baixo para cima.
 *
 * A contagem que aparece num módulo é a do ramo inteiro. Um módulo que mostra
 * "0 questões" porque só tem questões nos tópicos filhos é um módulo que
 * ninguém abre.
 */
export function montarArvore(
  modulos: ModuloBruto[],
  topicos: TopicoBruto[],
  subtopicos: SubtopicoBruto[],
): ModuloDaArvore[] {
  const subsPorTopico = new Map<string, NoDeHierarquia[]>()
  for (const s of subtopicos) {
    const lista = subsPorTopico.get(s.topicoId) || []
    lista.push({ _id: s._id, nome: s.nome, totalQuestoes: s.totalQuestoes || 0 })
    subsPorTopico.set(s.topicoId, lista)
  }

  const topicosPorModulo = new Map<string, TopicoDaArvore[]>()
  for (const t of topicos) {
    const filhos = ordenarPorNome(subsPorTopico.get(t._id) || [])
    const lista = topicosPorModulo.get(t.moduloId) || []
    lista.push({
      _id: t._id,
      moduloId: t.moduloId,
      nome: t.nome,
      // O total do tópico já vem contado direto do banco; os subtópicos são um
      // recorte DENTRO dele, não uma soma a mais — somar os dois contaria a
      // mesma questão duas vezes.
      totalQuestoes: t.totalQuestoes || 0,
      subtopicos: filhos,
    })
    topicosPorModulo.set(t.moduloId, lista)
  }

  return modulos
    .map((m) => {
      const filhos = ordenarPorNome(topicosPorModulo.get(m._id) || []) as TopicoDaArvore[]
      return {
        _id: m._id,
        nome: m.nome,
        totalQuestoes: m.totalQuestoes ?? filhos.reduce((s, t) => s + t.totalQuestoes, 0),
        topicos: filhos,
      }
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

function ordenarPorNome<T extends { nome: string }>(lista: T[]): T[] {
  return [...lista].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

/**
 * Filtra a árvore por um termo, mantendo o caminho.
 *
 * Um tópico que casa aparece com o módulo dele em volta — arrancar o tópico do
 * contexto faria "Arritmias" aparecer sem dizer de qual módulo veio, e há
 * "Arritmias" em mais de um.
 */
export function filtrarArvore(arvore: ModuloDaArvore[], termo: string): ModuloDaArvore[] {
  const alvo = paraBusca(termo)
  if (alvo.length < 2) return arvore

  const casa = (nome: string) => paraBusca(nome).includes(alvo)

  return arvore
    .map((modulo) => {
      if (casa(modulo.nome)) return modulo
      const topicos = modulo.topicos
        .map((topico) => {
          if (casa(topico.nome)) return topico
          const subtopicos = topico.subtopicos.filter((s) => casa(s.nome))
          return subtopicos.length > 0 ? { ...topico, subtopicos } : null
        })
        .filter(Boolean) as TopicoDaArvore[]
      return topicos.length > 0 ? { ...modulo, topicos } : null
    })
    .filter(Boolean) as ModuloDaArvore[]
}

/** Total de questões visíveis na árvore (já filtrada ou não). */
export function totalDaArvore(arvore: ModuloDaArvore[]): number {
  return arvore.reduce((soma, m) => soma + m.totalQuestoes, 0)
}

/** O caminho legível de uma questão, para mostrar no cartão dela. */
export function descreverCaminho(partes: {
  moduloNome?: string
  topicoNome?: string
  subtopicoNome?: string
}): string {
  return [partes.moduloNome, partes.topicoNome, partes.subtopicoNome]
    .filter((p) => !!p && String(p).trim().length > 0)
    .join(' › ')
}
