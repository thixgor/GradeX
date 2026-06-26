import type { MindMapStyle } from './types'

/**
 * Temas visuais do mapa mental. Cada tema define o fundo do canvas, a paleta
 * rápida de cores dos nós e as cores padrão (raiz/nó/borda/conexão/texto).
 * Compartilhado entre o editor (render + export SVG) e a validação no servidor.
 */
export interface MindMapTheme {
  key: string
  name: string
  /** Cor de fundo do canvas. */
  canvasBg: string
  /** Cor dos pontos da grade (rgba). */
  dot: string
  /** Cor de destaque (seleção, acentos). */
  accent: string
  /** Preenchimento padrão do nó raiz. */
  rootBg: string
  rootText: string
  /** Preenchimento padrão dos nós comuns. */
  nodeBg: string
  nodeText: string
  nodeBorder: string
  /** Cor padrão das conexões. */
  edge: string
  /** Paleta rápida oferecida no seletor de cores. */
  palette: string[]
}

export const MINDMAP_THEMES: Record<string, MindMapTheme> = {
  forest: {
    key: 'forest', name: 'Floresta', canvasBg: '#0B1F17', dot: 'rgba(45,90,70,0.35)',
    accent: '#2ECC71', rootBg: '#2ECC71', rootText: '#0B1F17', nodeBg: '#163126',
    nodeText: '#FFFFFF', nodeBorder: '#2D5A46', edge: '#2D5A46',
    palette: ['#2ECC71', '#27AE60', '#1ABC9C', '#3498DB', '#9B59B6', '#E67E22', '#E74C3C', '#F1C40F', '#EC4899', '#34495E'],
  },
  midnight: {
    key: 'midnight', name: 'Meia-noite', canvasBg: '#0B1326', dot: 'rgba(59,86,140,0.35)',
    accent: '#60A5FA', rootBg: '#3B82F6', rootText: '#0B1326', nodeBg: '#16213E',
    nodeText: '#FFFFFF', nodeBorder: '#2A3A5E', edge: '#2A3A5E',
    palette: ['#60A5FA', '#3B82F6', '#6366F1', '#8B5CF6', '#06B6D4', '#22D3EE', '#F472B6', '#FBBF24', '#34D399', '#F87171'],
  },
  graphite: {
    key: 'graphite', name: 'Grafite', canvasBg: '#15161A', dot: 'rgba(120,124,135,0.30)',
    accent: '#A3E635', rootBg: '#84CC16', rootText: '#15161A', nodeBg: '#23252C',
    nodeText: '#F3F4F6', nodeBorder: '#3A3D47', edge: '#3A3D47',
    palette: ['#A3E635', '#84CC16', '#22D3EE', '#60A5FA', '#A78BFA', '#F472B6', '#FB923C', '#FBBF24', '#F87171', '#94A3B8'],
  },
  ocean: {
    key: 'ocean', name: 'Oceano', canvasBg: '#062A33', dot: 'rgba(45,120,135,0.35)',
    accent: '#2DD4BF', rootBg: '#14B8A6', rootText: '#042027', nodeBg: '#0C3B45',
    nodeText: '#ECFEFF', nodeBorder: '#1A5763', edge: '#1A5763',
    palette: ['#2DD4BF', '#14B8A6', '#22D3EE', '#38BDF8', '#818CF8', '#F472B6', '#FB7185', '#FBBF24', '#A3E635', '#5EEAD4'],
  },
  sunset: {
    key: 'sunset', name: 'Pôr do sol', canvasBg: '#2A1410', dot: 'rgba(140,80,60,0.35)',
    accent: '#FB923C', rootBg: '#F97316', rootText: '#2A1410', nodeBg: '#3D211A',
    nodeText: '#FFF7ED', nodeBorder: '#5E342A', edge: '#5E342A',
    palette: ['#FB923C', '#F97316', '#EF4444', '#EC4899', '#F59E0B', '#FBBF24', '#A78BFA', '#60A5FA', '#34D399', '#FCA5A5'],
  },
  royal: {
    key: 'royal', name: 'Realeza', canvasBg: '#1A1030', dot: 'rgba(110,80,160,0.35)',
    accent: '#C084FC', rootBg: '#A855F7', rootText: '#1A1030', nodeBg: '#2A1C45',
    nodeText: '#F5F3FF', nodeBorder: '#3F2D63', edge: '#3F2D63',
    palette: ['#C084FC', '#A855F7', '#8B5CF6', '#6366F1', '#EC4899', '#F472B6', '#60A5FA', '#22D3EE', '#FBBF24', '#34D399'],
  },
  rose: {
    key: 'rose', name: 'Rosé', canvasBg: '#2A0E1B', dot: 'rgba(150,70,100,0.32)',
    accent: '#FB7185', rootBg: '#F43F5E', rootText: '#2A0E1B', nodeBg: '#3D1626',
    nodeText: '#FFF1F2', nodeBorder: '#5E2238', edge: '#5E2238',
    palette: ['#FB7185', '#F43F5E', '#EC4899', '#D946EF', '#A855F7', '#F59E0B', '#FBBF24', '#34D399', '#60A5FA', '#FDA4AF'],
  },
  light: {
    key: 'light', name: 'Claro', canvasBg: '#F4F6F5', dot: 'rgba(120,140,130,0.35)',
    accent: '#16A34A', rootBg: '#16A34A', rootText: '#FFFFFF', nodeBg: '#FFFFFF',
    nodeText: '#0F1F18', nodeBorder: '#CBD5D0', edge: '#94A3A0',
    palette: ['#16A34A', '#059669', '#0891B2', '#2563EB', '#7C3AED', '#DB2777', '#EA580C', '#CA8A04', '#DC2626', '#475569'],
  },
}

export const MINDMAP_THEME_KEYS = Object.keys(MINDMAP_THEMES)

export const DEFAULT_MINDMAP_STYLE: MindMapStyle = {
  theme: 'forest',
  edgeStyle: 'curved',
  nodeShape: 'rounded',
}

export function getTheme(key: string | undefined): MindMapTheme {
  return (key && MINDMAP_THEMES[key]) || MINDMAP_THEMES.forest
}

export function resolveStyle(style: Partial<MindMapStyle> | undefined): MindMapStyle {
  return {
    theme: style?.theme && MINDMAP_THEMES[style.theme] ? style.theme : DEFAULT_MINDMAP_STYLE.theme,
    edgeStyle: style?.edgeStyle && ['curved', 'straight', 'stepped'].includes(style.edgeStyle)
      ? style.edgeStyle : DEFAULT_MINDMAP_STYLE.edgeStyle,
    nodeShape: style?.nodeShape && ['rounded', 'pill', 'rect', 'ellipse'].includes(style.nodeShape)
      ? style.nodeShape : DEFAULT_MINDMAP_STYLE.nodeShape,
  }
}

/** Escolhe texto preto/branco legível sobre uma cor de fundo hex. */
export function idealTextColor(hex?: string): string {
  if (!hex) return '#FFFFFF'
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  if (h.length < 6) return '#FFFFFF'
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.6 ? '#0B1F17' : '#FFFFFF'
}
