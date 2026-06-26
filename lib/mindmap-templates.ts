import type { MindMapNode, MindMapStyle } from './types'

/**
 * Especificação hierárquica de um template — convertida em nós posicionados
 * por `buildNodes` (layout em árvore horizontal, igual ao auto-organizar).
 */
interface NodeSpec {
  text: string
  color?: string
  icon?: string
  children?: NodeSpec[]
}

export interface MindMapTemplate {
  id: string
  name: string
  description: string
  emoji: string
  category: string
  style: MindMapStyle
  spec: NodeSpec
}

const X_GAP = 240
const Y_GAP = 72

/** Converte a especificação em nós com posições (tidy tree horizontal). */
export function buildNodes(spec: NodeSpec): MindMapNode[] {
  const nodes: MindMapNode[] = []
  let counter = 0
  let cursorY = 0

  function place(s: NodeSpec, parentId: string | null, depth: number): number {
    const id = parentId === null ? 'root' : `n${counter++}`
    const node: MindMapNode = {
      id,
      parentId,
      text: s.text,
      x: depth * X_GAP,
      y: 0,
      ...(s.color ? { color: s.color } : {}),
      ...(s.icon ? { icon: s.icon } : {}),
    }
    nodes.push(node)
    if (!s.children || s.children.length === 0) {
      node.y = cursorY
      cursorY += Y_GAP
      return node.y
    }
    const childYs = s.children.map(c => place(c, id, depth + 1))
    node.y = (childYs[0] + childYs[childYs.length - 1]) / 2
    return node.y
  }

  place(spec, null, 0)
  return nodes
}

const S = (theme: string, edgeStyle: MindMapStyle['edgeStyle'] = 'curved', nodeShape: MindMapStyle['nodeShape'] = 'rounded'): MindMapStyle =>
  ({ theme, edgeStyle, nodeShape })

export const MINDMAP_TEMPLATES: MindMapTemplate[] = [
  {
    id: 'blank',
    name: 'Em branco',
    description: 'Comece do zero com um único nó central.',
    emoji: '✨',
    category: 'Básico',
    style: S('forest'),
    spec: { text: 'Tema central' },
  },
  {
    id: 'brainstorm',
    name: 'Brainstorm',
    description: 'Explore ideias livremente em torno de um tema.',
    emoji: '💡',
    category: 'Criatividade',
    style: S('sunset'),
    spec: {
      text: 'Ideia central', icon: '💡',
      children: [
        { text: 'Ideia 1', children: [{ text: 'Detalhe' }, { text: 'Detalhe' }] },
        { text: 'Ideia 2', children: [{ text: 'Detalhe' }] },
        { text: 'Ideia 3', children: [{ text: 'Detalhe' }, { text: 'Detalhe' }] },
        { text: 'Ideia 4' },
      ],
    },
  },
  {
    id: 'study-plan',
    name: 'Plano de estudos',
    description: 'Organize disciplinas, tópicos e metas de estudo.',
    emoji: '📚',
    category: 'Estudos',
    style: S('forest'),
    spec: {
      text: 'Plano de estudos', icon: '📚',
      children: [
        { text: 'Disciplina 1', color: '#3498DB', children: [{ text: 'Tópico A' }, { text: 'Tópico B' }, { text: 'Revisão' }] },
        { text: 'Disciplina 2', color: '#9B59B6', children: [{ text: 'Tópico A' }, { text: 'Tópico B' }] },
        { text: 'Metas', color: '#F1C40F', children: [{ text: 'Semanal' }, { text: 'Mensal' }] },
        { text: 'Recursos', color: '#1ABC9C', children: [{ text: 'Livros' }, { text: 'Vídeos' }] },
      ],
    },
  },
  {
    id: 'lecture-summary',
    name: 'Resumo de aula',
    description: 'Capture os pontos-chave de uma aula ou leitura.',
    emoji: '📝',
    category: 'Estudos',
    style: S('midnight'),
    spec: {
      text: 'Tema da aula', icon: '📝',
      children: [
        { text: 'Conceitos-chave', children: [{ text: 'Conceito 1' }, { text: 'Conceito 2' }] },
        { text: 'Definições', children: [{ text: 'Termo → significado' }] },
        { text: 'Exemplos', children: [{ text: 'Exemplo prático' }] },
        { text: 'Dúvidas', icon: '❓' },
      ],
    },
  },
  {
    id: 'swot',
    name: 'Análise SWOT (FOFA)',
    description: 'Forças, fraquezas, oportunidades e ameaças.',
    emoji: '📊',
    category: 'Negócios',
    style: S('graphite', 'stepped', 'rect'),
    spec: {
      text: 'Análise SWOT',
      children: [
        { text: 'Forças', color: '#2ECC71', children: [{ text: 'Ponto forte' }] },
        { text: 'Fraquezas', color: '#E74C3C', children: [{ text: 'Ponto fraco' }] },
        { text: 'Oportunidades', color: '#3498DB', children: [{ text: 'Oportunidade' }] },
        { text: 'Ameaças', color: '#E67E22', children: [{ text: 'Ameaça' }] },
      ],
    },
  },
  {
    id: 'project',
    name: 'Planejamento de projeto',
    description: 'Escopo, etapas, equipe e prazos de um projeto.',
    emoji: '🚀',
    category: 'Negócios',
    style: S('ocean', 'stepped'),
    spec: {
      text: 'Projeto', icon: '🚀',
      children: [
        { text: 'Objetivo', color: '#2DD4BF' },
        { text: 'Escopo', color: '#38BDF8', children: [{ text: 'Incluído' }, { text: 'Fora do escopo' }] },
        { text: 'Etapas', color: '#818CF8', children: [{ text: 'Planejar' }, { text: 'Executar' }, { text: 'Entregar' }] },
        { text: 'Equipe', color: '#F472B6' },
        { text: 'Prazos', color: '#FBBF24' },
      ],
    },
  },
  {
    id: 'concept-map',
    name: 'Mapa conceitual',
    description: 'Relacione conceitos e suas conexões.',
    emoji: '🧠',
    category: 'Estudos',
    style: S('royal'),
    spec: {
      text: 'Conceito principal', icon: '🧠',
      children: [
        { text: 'Subconceito A', children: [{ text: 'Relaciona-se com…' }] },
        { text: 'Subconceito B', children: [{ text: 'Exemplo' }] },
        { text: 'Subconceito C', children: [{ text: 'Causa' }, { text: 'Efeito' }] },
      ],
    },
  },
  {
    id: 'decision',
    name: 'Tomada de decisão',
    description: 'Compare opções pesando prós e contras.',
    emoji: '⚖️',
    category: 'Produtividade',
    style: S('graphite'),
    spec: {
      text: 'Decisão a tomar', icon: '⚖️',
      children: [
        { text: 'Opção A', color: '#3498DB', children: [{ text: 'Prós', icon: '✅' }, { text: 'Contras', icon: '❗' }] },
        { text: 'Opção B', color: '#9B59B6', children: [{ text: 'Prós', icon: '✅' }, { text: 'Contras', icon: '❗' }] },
        { text: 'Critérios', color: '#F1C40F', children: [{ text: 'Custo' }, { text: 'Tempo' }, { text: 'Impacto' }] },
      ],
    },
  },
  {
    id: 'timeline',
    name: 'Linha do tempo',
    description: 'Sequencie eventos ou fases em ordem.',
    emoji: '🗓️',
    category: 'Produtividade',
    style: S('midnight', 'straight'),
    spec: {
      text: 'Cronograma', icon: '🗓️',
      children: [
        { text: 'Fase 1', color: '#60A5FA', children: [{ text: 'Marco' }] },
        { text: 'Fase 2', color: '#22D3EE', children: [{ text: 'Marco' }] },
        { text: 'Fase 3', color: '#34D399', children: [{ text: 'Marco' }] },
        { text: 'Fase 4', color: '#FBBF24', children: [{ text: 'Marco' }] },
      ],
    },
  },
  {
    id: 'goals',
    name: 'Metas SMART',
    description: 'Defina objetivos específicos e mensuráveis.',
    emoji: '🎯',
    category: 'Produtividade',
    style: S('forest'),
    spec: {
      text: 'Meta', icon: '🎯',
      children: [
        { text: 'Específica', color: '#2ECC71' },
        { text: 'Mensurável', color: '#3498DB' },
        { text: 'Atingível', color: '#9B59B6' },
        { text: 'Relevante', color: '#E67E22' },
        { text: 'Temporal', color: '#F1C40F' },
      ],
    },
  },
]

export function getTemplate(id: string): MindMapTemplate | undefined {
  return MINDMAP_TEMPLATES.find(t => t.id === id)
}
