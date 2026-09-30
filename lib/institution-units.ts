// Unidades da rede de graduação que o aluno procura primeiro no cadastro. O
// nome segue a instituição (sigla ou "Faculdade de Ciências Médicas de ..."),
// nunca a marca do grupo mantenedor: o site é independente e não cita marcas
// de terceiros. As unidades aparecem no topo do select de instituição, antes
// da lista nacional do e-MEC.
//
// Os rótulos antigos (gravados em perfis e cupons antes da troca) são
// traduzidos em `lib/institution-units-legacy.ts`, só no servidor.

export interface InstitutionUnit {
  /** Rótulo exibido e gravado no banco. */
  label: string
  /** UF onde a unidade fica — usada para filtrar o select por estado. */
  uf: string
}

export const NETWORK_UNITS: InstitutionUnit[] = [
  { label: 'Faculdade de Ciências Médicas de Cruzeiro do Sul - Cruzeiro do Sul (AC)', uf: 'AC' },
  { label: 'Centro Universitário de Maceió (UNIMA) - Maceió (AL)', uf: 'AL' },
  { label: 'Faculdade de Ciências Médicas de Itacoatiara - Itacoatiara (AM)', uf: 'AM' },
  { label: 'Faculdade de Ciências Médicas de Manacapuru - Manacapuru (AM)', uf: 'AM' },
  { label: 'Faculdade de Ciências Médicas de Barreiras - Barreiras (BA)', uf: 'BA' },
  { label: 'Faculdade de Ciências Médicas de Guanambi - Guanambi (BA)', uf: 'BA' },
  { label: 'Faculdade de Ciências Médicas de Itabuna - Itabuna (BA)', uf: 'BA' },
  { label: 'Faculdade de Ciências Médicas de Luís Eduardo Magalhães - Luís Eduardo Magalhães (BA)', uf: 'BA' },
  { label: 'Faculdade de Ciências Médicas de Ribeira do Pombal - Ribeira do Pombal (BA)', uf: 'BA' },
  { label: 'Faculdade de Ciências Médicas de Salvador - Salvador (BA)', uf: 'BA' },
  { label: 'Faculdade de Ciências Médicas de Vitória da Conquista - Vitória da Conquista (BA)', uf: 'BA' },
  { label: 'Faculdade de Ciências Médicas de Contagem - Contagem (MG)', uf: 'MG' },
  { label: 'Faculdade de Ciências Médicas de Ipatinga - Ipatinga (MG)', uf: 'MG' },
  { label: 'Faculdade de Medicina de Itajubá - Itajubá (MG)', uf: 'MG' },
  { label: 'Faculdade de Ciências Médicas de Montes Claros - Montes Claros (MG)', uf: 'MG' },
  { label: 'Centro Universitário Presidente Tancredo de Almeida Neves (UNIPTAN) - São João del-Rei (MG)', uf: 'MG' },
  { label: 'Faculdade de Ciências Médicas de Sete Lagoas - Sete Lagoas (MG)', uf: 'MG' },
  { label: 'Faculdade de Ciências Médicas de Santa Inês - Santa Inês (MA)', uf: 'MA' },
  { label: 'Faculdade de Ciências Médicas de Abaetetuba - Abaetetuba (PA)', uf: 'PA' },
  { label: 'Faculdade de Ciências Médicas de Bragança - Bragança (PA)', uf: 'PA' },
  { label: 'Faculdade de Ciências Médicas de Cametá - Cametá (PA)', uf: 'PA' },
  { label: 'Faculdade de Ciências Médicas de Marabá - Marabá (PA)', uf: 'PA' },
  { label: 'Faculdade de Ciências Médicas de Redenção - Redenção (PA)', uf: 'PA' },
  { label: 'Faculdade de Ciências Médicas da Paraíba - Cabedelo (PB)', uf: 'PB' },
  { label: 'Faculdade de Ciências Médicas de Garanhuns (FAMEG) - Garanhuns (PE)', uf: 'PE' },
  { label: 'Faculdade de Ciências Médicas de Jaboatão dos Guararapes - Jaboatão dos Guararapes (PE)', uf: 'PE' },
  { label: 'Faculdade de Ciências Médicas de Parnaíba - Parnaíba (PI)', uf: 'PI' },
  { label: 'Centro Universitário UNINOVAFAPI - Teresina (PI)', uf: 'PI' },
  { label: 'Faculdade de Ciências Médicas de Pato Branco - Pato Branco (PR)', uf: 'PR' },
  { label: 'Centro Universitário Redentor (UniRedentor) - Itaperuna (RJ)', uf: 'RJ' },
  { label: 'Unigranrio Barra da Tijuca - Rio de Janeiro (RJ)', uf: 'RJ' },
  { label: 'Unigranrio Duque de Caxias - Duque de Caxias (RJ)', uf: 'RJ' },
  { label: 'Unigranrio Nova Iguaçu - Nova Iguaçu (RJ)', uf: 'RJ' },
  { label: 'Faculdade de Ciências Médicas de Ji-Paraná - Ji-Paraná (RO)', uf: 'RO' },
  { label: 'Centro Universitário São Lucas - Porto Velho (RO)', uf: 'RO' },
  { label: 'Centro Universitário Tocantinense Presidente Antônio Carlos (UNITPAC) - Araguaína (TO)', uf: 'TO' },
  { label: 'Instituto Tocantinense Presidente Antônio Carlos (ITPAC) - Palmas (TO)', uf: 'TO' },
  { label: 'Faculdade Presidente Antônio Carlos (FAPAC) - Porto Nacional (TO)', uf: 'TO' },
]

/** Só os rótulos, na ordem em que aparecem acima. */
export const INSTITUTION_UNITS: string[] = NETWORK_UNITS.map((unit) => unit.label)

/** Unidades da rede num estado. Vazio quando o estado não tem unidade. */
export function getNetworkUnitsByState(uf?: string | null): string[] {
  if (!uf) return []
  return NETWORK_UNITS.filter((unit) => unit.uf === uf).map((unit) => unit.label)
}

/** `true` quando o rótulo veio da lista de unidades da rede. */
export function isNetworkUnit(label?: string | null): boolean {
  if (!label) return false
  return NETWORK_UNITS.some((unit) => unit.label === label)
}
