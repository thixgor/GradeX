// Faculdades de Medicina do Brasil, agrupadas por estado (UF). Cobre as
// principais instituições públicas e privadas de cada estado — não é uma
// lista exaustiva de todas as ~380 escolas médicas do país, por isso cada
// estado tem uma opção de fallback para quem não encontrar sua instituição.
export const MEDICAL_SCHOOLS_BY_STATE: Record<string, string[]> = {
  AC: [
    'Universidade Federal do Acre (UFAC)',
    'Centro Universitário UNINORTE - Rio Branco',
  ],
  AL: [
    'Universidade Federal de Alagoas (UFAL)',
    'Universidade Estadual de Ciências da Saúde de Alagoas (UNCISAL)',
    'Centro Universitário CESMAC',
    'Universidade Tiradentes - Alagoas (UNIT-AL)',
  ],
  AP: [
    'Universidade Federal do Amapá (UNIFAP)',
  ],
  AM: [
    'Universidade Federal do Amazonas (UFAM)',
    'Universidade do Estado do Amazonas (UEA)',
    'Centro Universitário UNINORTE - Manaus',
  ],
  BA: [
    'Universidade Federal da Bahia (UFBA)',
    'Escola Bahiana de Medicina e Saúde Pública (EBMSP)',
    'Universidade Estadual de Feira de Santana (UEFS)',
    'Universidade Federal do Recôncavo da Bahia (UFRB)',
    'Universidade Federal do Oeste da Bahia (UFOB)',
    'Universidade Federal do Sul da Bahia (UFSB)',
    'UNIME - União Metropolitana de Educação e Cultura',
    'UniFTC - Faculdade de Tecnologia e Ciências',
    'Universidade Salvador (UNIFACS)',
    'Faculdade Nobre (FAN) - Feira de Santana',
  ],
  CE: [
    'Universidade Federal do Ceará (UFC)',
    'Universidade Estadual do Ceará (UECE)',
    'Universidade de Fortaleza (UNIFOR)',
    'Centro Universitário Christus (Unichristus)',
    'Faculdade de Medicina de Juazeiro do Norte (FMJ)',
    'Centro Universitário Dr. Leão Sampaio (UNILEÃO)',
  ],
  DF: [
    'Universidade de Brasília (UnB)',
    'Escola Superior de Ciências da Saúde (ESCS)',
    'Centro Universitário de Brasília (UniCEUB)',
    'Universidade Católica de Brasília (UCB)',
    'Centro Universitário IESB',
  ],
  ES: [
    'Universidade Federal do Espírito Santo (UFES)',
    'Escola Superior de Ciências da Santa Casa de Misericórdia de Vitória (EMESCAM)',
    'Universidade Vila Velha (UVV)',
    'Faculdade Brasileira Multivix',
  ],
  GO: [
    'Universidade Federal de Goiás (UFG)',
    'Pontifícia Universidade Católica de Goiás (PUC Goiás)',
    'Universidade Estadual de Goiás (UEG)',
    'Universidade de Rio Verde (UniRV)',
    'Faculdade Uni-Anhanguera',
  ],
  MA: [
    'Universidade Federal do Maranhão (UFMA)',
    'Universidade Estadual do Maranhão (UEMA)',
    'Universidade CEUMA',
    'Universidade UNDB',
  ],
  MT: [
    'Universidade Federal de Mato Grosso (UFMT)',
    'Universidade de Cuiabá (UNIC)',
    'Universidade de Várzea Grande (UNIVAG)',
  ],
  MS: [
    'Universidade Federal de Mato Grosso do Sul (UFMS)',
    'Universidade Católica Dom Bosco (UCDB)',
    'Universidade Anhanguera-Uniderp',
    'Faculdade UNIGRAN - Dourados',
  ],
  MG: [
    'Universidade Federal de Minas Gerais (UFMG)',
    'Universidade Federal de Juiz de Fora (UFJF)',
    'Universidade Federal de Uberlândia (UFU)',
    'Universidade Federal de Alfenas (UNIFAL-MG)',
    'Universidade Federal de São João del-Rei (UFSJ)',
    'Universidade Federal do Triângulo Mineiro (UFTM)',
    'Universidade Federal dos Vales do Jequitinhonha e Mucuri (UFVJM)',
    'Pontifícia Universidade Católica de Minas Gerais (PUC Minas)',
    'Faculdade de Ciências Médicas de Minas Gerais (FCMMG)',
    'Universidade José do Rosário Vellano (UNIFENAS)',
    'Universidade Vale do Rio Doce (UNIVALE) - Governador Valadares',
    'Faculdade de Medicina de Barbacena (FAME)',
    'Faculdade Ciências Médicas de Montes Claros (UNIFIPMoc)',
    'Universidade de Itaúna',
  ],
  PA: [
    'Universidade Federal do Pará (UFPA)',
    'Universidade do Estado do Pará (UEPA)',
    'Centro Universitário do Estado do Pará (CESUPA)',
  ],
  PB: [
    'Universidade Federal da Paraíba (UFPB)',
    'Universidade Federal de Campina Grande (UFCG)',
    'Centro Universitário de João Pessoa (UNIPÊ)',
    'Faculdade de Ciências Médicas da Paraíba (FCM-PB)',
  ],
  PR: [
    'Universidade Federal do Paraná (UFPR)',
    'Universidade Estadual de Londrina (UEL)',
    'Universidade Estadual de Maringá (UEM)',
    'Universidade Estadual do Oeste do Paraná (UNIOESTE)',
    'Pontifícia Universidade Católica do Paraná (PUCPR)',
    'Universidade Positivo',
    'Universidade Cesumar (UniCesumar) - Maringá',
    'Universidade Estadual de Ponta Grossa (UEPG)',
  ],
  PE: [
    'Universidade Federal de Pernambuco (UFPE)',
    'Universidade de Pernambuco (UPE)',
    'Faculdade Pernambucana de Saúde (FPS)',
    'Faculdade de Ciências Médicas de Pernambuco',
  ],
  PI: [
    'Universidade Federal do Piauí (UFPI)',
    'UNINOVAFAPI',
    'Faculdade Integral Diferencial (FACID)',
  ],
  RJ: [
    'Universidade Federal do Rio de Janeiro (UFRJ)',
    'Universidade do Estado do Rio de Janeiro (UERJ)',
    'Universidade Federal Fluminense (UFF)',
    'Universidade Federal do Estado do Rio de Janeiro (UNIRIO)',
    'Universidade Estácio de Sá (UNESA)',
    'Universidade Iguaçu (UNIG)',
    'Universidade Severino Sombra (USS) - Vassouras',
    'Fundação Técnico-Educacional Souza Marques',
    'Centro Universitário de Volta Redonda (UniFOA)',
    'Universidade do Grande Rio (Unigranrio) - Duque de Caxias',
    'Universidade do Grande Rio (Unigranrio) - Barra da Tijuca',
  ],
  RN: [
    'Universidade Federal do Rio Grande do Norte (UFRN)',
    'Universidade Potiguar (UnP)',
    'Faculdade de Ciências da Saúde do Trairi (UFRN)',
  ],
  RS: [
    'Universidade Federal do Rio Grande do Sul (UFRGS)',
    'Universidade Federal de Ciências da Saúde de Porto Alegre (UFCSPA)',
    'Pontifícia Universidade Católica do Rio Grande do Sul (PUCRS)',
    'Universidade Federal de Pelotas (UFPel)',
    'Universidade Federal de Santa Maria (UFSM)',
    'Universidade de Caxias do Sul (UCS)',
    'Universidade de Passo Fundo (UPF)',
    'Universidade Luterana do Brasil (ULBRA)',
  ],
  RO: [
    'Universidade Federal de Rondônia (UNIR)',
    'Faculdade São Lucas',
  ],
  RR: [
    'Universidade Federal de Roraima (UFRR)',
  ],
  SC: [
    'Universidade Federal de Santa Catarina (UFSC)',
    'Universidade do Sul de Santa Catarina (UNISUL)',
    'Universidade da Região de Joinville (UNIVILLE)',
    'Universidade do Extremo Sul Catarinense (UNESC)',
    'Universidade do Oeste de Santa Catarina (UNOESC)',
  ],
  SP: [
    'Universidade de São Paulo (USP) - Faculdade de Medicina',
    'Universidade de São Paulo (USP) - Ribeirão Preto',
    'Universidade Estadual de Campinas (UNICAMP)',
    'Universidade Estadual Paulista (UNESP) - Botucatu',
    'Universidade Federal de São Paulo (UNIFESP/EPM)',
    'Faculdade de Ciências Médicas da Santa Casa de São Paulo (FCMSCSP)',
    'Faculdade de Medicina do ABC (FMABC)',
    'Faculdade de Medicina de São José do Rio Preto (FAMERP)',
    'Faculdade de Medicina de Jundiaí (FMJ)',
    'Pontifícia Universidade Católica de Campinas (PUC-Campinas)',
    'Universidade São Francisco (USF) - Bragança Paulista',
    'Universidade de Santo Amaro (UNISA)',
    'Universidade Cidade de São Paulo (UNICID)',
    'Universidade de Marília (UNIMAR)',
    'Universidade de Sorocaba (UNISO)',
    'Universidade do Oeste Paulista (UNOESTE) - Presidente Prudente',
    'Universidade Metropolitana de Santos (UNIMES)',
    'Centro Universitário Padre Albino (UNIFIPA) - Catanduva',
    'Centro Universitário Barão de Mauá - Ribeirão Preto',
    'Centro Universitário Lusíada (UNILUS) - Santos',
  ],
  SE: [
    'Universidade Federal de Sergipe (UFS)',
    'Universidade Tiradentes (UNIT)',
  ],
  TO: [
    'Universidade Federal do Tocantins (UFT)',
    'Universidade de Gurupi (UnirG)',
  ],
}

const NOT_FOUND_OPTION = 'Não encontro minha instituição na lista'

export function getMedicalSchoolsByState(uf?: string | null): string[] {
  if (!uf) return []
  const list = MEDICAL_SCHOOLS_BY_STATE[uf] || []
  return [...list, NOT_FOUND_OPTION]
}
