/**
 * Onde o Dom pode ser escondido. A pessoa esconde pelo próprio Dom (×, ou
 * "Esconder aqui" no painel) e traz de volta em Perfil › Ajustes › Botões
 * flutuantes. Guardado com as outras preferências de interface
 * (`context/UIPreferencesContext.tsx`).
 */

export type SecaoDoDom = 'tudo' | 'leitor' | 'vitrines' | 'questoes' | 'flashcards' | 'manual' | 'outras'

export const SECOES_DO_DOM: Array<{ id: SecaoDoDom; rotulo: string; onde: string }> = [
  { id: 'tudo', rotulo: 'Em todo o site', onde: 'em todo o site' },
  { id: 'leitor', rotulo: 'No leitor de PDF', onde: 'no leitor de PDF' },
  { id: 'vitrines', rotulo: 'Em Materiais, Pacotes e Planos', onde: 'nas vitrines de materiais' },
  { id: 'questoes', rotulo: 'No Banco de Questões e nas provas', onde: 'no Banco de Questões e nas provas' },
  { id: 'flashcards', rotulo: 'Nos flashcards', onde: 'nos flashcards' },
  { id: 'manual', rotulo: 'No Manual Clínico e Anatomia', onde: 'no Manual Clínico' },
  { id: 'outras', rotulo: 'Nas demais páginas', onde: 'nas demais páginas' },
]

export function secaoDaRota(pathname: string, noLeitor: boolean): Exclude<SecaoDoDom, 'tudo'> {
  if (noLeitor || /^\/materiais\/[^/]+\/viewer/.test(pathname)) return 'leitor'
  if (/^\/(materiais|pacotes|buy|upgrade)(\/|$)/.test(pathname)) return 'vitrines'
  if (/^\/(banco-questoes|provas|exams?|simulados?)(\/|$)/.test(pathname)) return 'questoes'
  if (/^\/flashcards(\/|$)/.test(pathname)) return 'flashcards'
  if (/^\/(manual-clinico|anatomia)(\/|$)/.test(pathname)) return 'manual'
  return 'outras'
}

export function domOcultoAqui(ocultoEm: readonly string[], pathname: string, noLeitor: boolean): boolean {
  return ocultoEm.includes('tudo') || ocultoEm.includes(secaoDaRota(pathname, noLeitor))
}

export function ondeDaSecao(secao: SecaoDoDom): string {
  return SECOES_DO_DOM.find((s) => s.id === secao)?.onde || 'aqui'
}
