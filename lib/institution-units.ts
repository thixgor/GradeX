// Unidades da Afya (rede de graduação), consultadas em unidades.afya.com.br e
// medicina.afya.com.br em jul/2026. São a marca que o aluno reconhece — ele
// não se identifica como "Centro Universitário Presidente Tancredo de Almeida
// Neves", e sim como "Afya São João del-Rei". Por isso as unidades aparecem no
// topo do select de instituição, antes da lista nacional do e-MEC.

export interface AfyaUnit {
  /** Rótulo exibido e gravado no banco. */
  label: string
  /** UF onde a unidade fica — usada para filtrar o select por estado. */
  uf: string
}

export const AFYA_UNITS: AfyaUnit[] = [
  { label: 'Afya Cruzeiro do Sul - Cruzeiro do Sul (AC)', uf: 'AC' },
  { label: 'Afya Maceió (UNIMA) - Maceió (AL)', uf: 'AL' },
  { label: 'Afya Itacoatiara - Itacoatiara (AM)', uf: 'AM' },
  { label: 'Afya Manacapuru - Manacapuru (AM)', uf: 'AM' },
  { label: 'Afya Barreiras - Barreiras (BA)', uf: 'BA' },
  { label: 'Afya Guanambi - Guanambi (BA)', uf: 'BA' },
  { label: 'Afya Itabuna - Itabuna (BA)', uf: 'BA' },
  { label: 'Afya Luís Eduardo Magalhães - Luís Eduardo Magalhães (BA)', uf: 'BA' },
  { label: 'Afya Ribeira do Pombal - Ribeira do Pombal (BA)', uf: 'BA' },
  { label: 'Afya Salvador - Salvador (BA)', uf: 'BA' },
  { label: 'Afya Vitória da Conquista - Vitória da Conquista (BA)', uf: 'BA' },
  { label: 'Afya Contagem - Contagem (MG)', uf: 'MG' },
  { label: 'Afya Ipatinga - Ipatinga (MG)', uf: 'MG' },
  { label: 'Afya Itajubá - Itajubá (MG)', uf: 'MG' },
  { label: 'Afya Montes Claros - Montes Claros (MG)', uf: 'MG' },
  { label: 'Afya São João del-Rei (UNIPTAN) - São João del-Rei (MG)', uf: 'MG' },
  { label: 'Afya Sete Lagoas - Sete Lagoas (MG)', uf: 'MG' },
  { label: 'Afya Santa Inês - Santa Inês (MA)', uf: 'MA' },
  { label: 'Afya Abaetetuba - Abaetetuba (PA)', uf: 'PA' },
  { label: 'Afya Bragança - Bragança (PA)', uf: 'PA' },
  { label: 'Afya Cametá - Cametá (PA)', uf: 'PA' },
  { label: 'Afya Marabá - Marabá (PA)', uf: 'PA' },
  { label: 'Afya Redenção - Redenção (PA)', uf: 'PA' },
  { label: 'Afya Cabedelo (Afya Paraíba) - Cabedelo (PB)', uf: 'PB' },
  { label: 'Afya Garanhuns - Garanhuns (PE)', uf: 'PE' },
  { label: 'Afya Jaboatão dos Guararapes - Jaboatão dos Guararapes (PE)', uf: 'PE' },
  { label: 'Afya Parnaíba - Parnaíba (PI)', uf: 'PI' },
  { label: 'Afya Teresina (UNINOVAFAPI) - Teresina (PI)', uf: 'PI' },
  { label: 'Afya Pato Branco - Pato Branco (PR)', uf: 'PR' },
  { label: 'Afya Itaperuna (UniRedentor) - Itaperuna (RJ)', uf: 'RJ' },
  { label: 'Afya Unigranrio Barra da Tijuca - Rio de Janeiro (RJ)', uf: 'RJ' },
  { label: 'Afya Unigranrio Duque de Caxias - Duque de Caxias (RJ)', uf: 'RJ' },
  { label: 'Afya Unigranrio Nova Iguaçu - Nova Iguaçu (RJ)', uf: 'RJ' },
  { label: 'Afya Ji-Paraná - Ji-Paraná (RO)', uf: 'RO' },
  { label: 'Afya São Lucas - Porto Velho (RO)', uf: 'RO' },
  { label: 'Afya Araguaína (UNITPAC) - Araguaína (TO)', uf: 'TO' },
  { label: 'Afya Palmas (ITPAC) - Palmas (TO)', uf: 'TO' },
  { label: 'Afya Porto Nacional (FAPAC) - Porto Nacional (TO)', uf: 'TO' },
]

/** Só os rótulos, na ordem em que aparecem acima. */
export const INSTITUTION_UNITS: string[] = AFYA_UNITS.map((unit) => unit.label)

/** Unidades Afya de um estado. Vazio quando o estado não tem unidade. */
export function getAfyaUnitsByState(uf?: string | null): string[] {
  if (!uf) return []
  return AFYA_UNITS.filter((unit) => unit.uf === uf).map((unit) => unit.label)
}

/** `true` quando o rótulo veio da lista de unidades Afya. */
export function isAfyaUnit(label?: string | null): boolean {
  if (!label) return false
  return AFYA_UNITS.some((unit) => unit.label === label)
}
