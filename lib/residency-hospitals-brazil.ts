// Principais hospitais/instituições com programas de residência médica
// (COREME) do Brasil, agrupados por estado (UF). Não é uma lista exaustiva
// de todos os hospitais credenciados, por isso cada estado tem uma opção de
// fallback para quem não encontrar seu hospital.
export const RESIDENCY_HOSPITALS_BY_STATE: Record<string, string[]> = {
  AC: [
    'Hospital das Clínicas do Acre',
    'Hospital Regional de Rio Branco',
  ],
  AL: [
    'Hospital Universitário Prof. Alberto Antunes (UFAL)',
    'Santa Casa de Misericórdia de Maceió',
  ],
  AP: [
    'Hospital de Emergência de Macapá',
  ],
  AM: [
    'Hospital Universitário Getúlio Vargas (UFAM)',
    'Fundação Hospitalar Adriano Jorge',
    'Hospital e Pronto-Socorro João Lúcio Pereira Machado',
  ],
  BA: [
    'Complexo Hospitalar Universitário Professor Edgard Santos (UFBA)',
    'Hospital Geral Roberto Santos',
    'Hospital Santa Izabel',
    'Hospital Português da Bahia',
    'Santa Casa de Misericórdia da Bahia',
  ],
  CE: [
    'Hospital Universitário Walter Cantídio (UFC)',
    'Hospital Geral de Fortaleza',
    'Hospital Geral Waldemar de Alcântara',
    'Instituto Doutor José Frota',
  ],
  DF: [
    'Hospital de Base do Distrito Federal',
    'Hospital Universitário de Brasília (HUB)',
    'Hospital Regional da Asa Norte (HRAN)',
    'Hospital das Forças Armadas',
  ],
  ES: [
    'Hospital Universitário Cassiano Antônio de Moraes (HUCAM/UFES)',
    'Santa Casa de Misericórdia de Vitória',
  ],
  GO: [
    'Hospital das Clínicas da UFG',
    'Hospital Geral de Goiânia Dr. Alberto Rassi (HGG)',
    'Santa Casa de Misericórdia de Goiânia',
  ],
  MA: [
    'Hospital Universitário Presidente Dutra (UFMA)',
    'Hospital Geral de São Luís',
  ],
  MT: [
    'Hospital Universitário Júlio Müller (UFMT)',
    'Hospital Geral e Maternidade de Cuiabá',
  ],
  MS: [
    'Hospital Universitário Maria Aparecida Pedrossian (UFMS)',
    'Santa Casa de Campo Grande',
  ],
  MG: [
    'Hospital das Clínicas da UFMG',
    'Hospital Risoleta Tolentino Neves',
    'Santa Casa de Belo Horizonte',
    'Hospital Universitário São José',
    'Hospital de Clínicas da UFU - Uberlândia',
    'Hospital Universitário de Juiz de Fora (HU-UFJF)',
  ],
  PA: [
    'Hospital Universitário João de Barros Barreto (UFPA)',
    'Fundação Santa Casa de Misericórdia do Pará',
    'Hospital Ophir Loyola',
  ],
  PB: [
    'Hospital Universitário Lauro Wanderley (UFPB)',
    'Hospital Universitário Alcides Carneiro (UFCG)',
  ],
  PR: [
    'Complexo Hospital de Clínicas da UFPR (CHC-UFPR)',
    'Hospital Universitário Regional de Maringá',
    'Hospital Universitário do Oeste do Paraná',
    'Santa Casa de Curitiba',
    'Hospital de Clínicas de Londrina (UEL)',
  ],
  PE: [
    'Hospital das Clínicas da UFPE',
    'Instituto de Medicina Integral Prof. Fernando Figueira (IMIP)',
    'Hospital Universitário Oswaldo Cruz (UPE)',
    'Real Hospital Português',
  ],
  PI: [
    'Hospital Universitário do Piauí (HU-UFPI)',
    'Hospital Getúlio Vargas',
  ],
  RJ: [
    'Hospital Universitário Clementino Fraga Filho (UFRJ)',
    'Hospital Universitário Pedro Ernesto (UERJ)',
    'Hospital Universitário Antônio Pedro (UFF)',
    'Santa Casa da Misericórdia do Rio de Janeiro',
    'Hospital Federal dos Servidores do Estado',
    'Hospital Municipal Miguel Couto',
    'Instituto Nacional de Câncer (INCA)',
    'Hospital Naval Marcílio Dias',
  ],
  RN: [
    'Hospital Universitário Onofre Lopes (UFRN)',
    'Maternidade Escola Januário Cicco',
  ],
  RS: [
    'Hospital de Clínicas de Porto Alegre (HCPA)',
    'Santa Casa de Misericórdia de Porto Alegre',
    'Hospital São Lucas da PUCRS',
    'Hospital Universitário de Santa Maria (HUSM)',
    'Hospital Escola da UFPel',
  ],
  RO: [
    'Hospital de Base Dr. Ary Pinheiro',
  ],
  RR: [
    'Hospital Geral de Roraima',
  ],
  SC: [
    'Hospital Universitário Polydoro Ernani de São Thiago (UFSC)',
    'Hospital Regional de São José',
    'Hospital Nereu Ramos',
  ],
  SP: [
    'Hospital das Clínicas da FMUSP',
    'Hospital de Clínicas da UNICAMP',
    'Hospital São Paulo (UNIFESP/EPM)',
    'Santa Casa de Misericórdia de São Paulo',
    'Hospital do Servidor Público Estadual',
    'Hospital Israelita Albert Einstein',
    'Hospital Sírio-Libanês',
    'Hospital Heliópolis',
    'Irmandade Santa Casa de Santos',
    'Hospital das Clínicas de Ribeirão Preto (HCFMRP-USP)',
    'Hospital de Base de São José do Rio Preto (FAMERP)',
  ],
  SE: [
    'Hospital Universitário de Sergipe (HU-UFS)',
  ],
  TO: [
    'Hospital Geral de Palmas',
  ],
}

const NOT_FOUND_OPTION = 'Não encontro meu hospital na lista'

export function getResidencyHospitalsByState(uf?: string | null): string[] {
  if (!uf) return []
  const list = RESIDENCY_HOSPITALS_BY_STATE[uf] || []
  return [...list, NOT_FOUND_OPTION]
}
