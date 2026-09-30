// Rótulos de instituição gravados antes da troca para nomes neutros (sem a
// marca do grupo mantenedor). Perfis e cupons antigos ainda guardam esses
// valores; o servidor os traduz para o rótulo atual ao ler e ao comparar.
// Só importar em código de servidor: o mapa não deve ir para o bundle do
// navegador. `scripts/migrar-rotulos-instituicao.js` regrava o banco.
import 'server-only'

const LEGACY_TO_CURRENT: Record<string, string> = {
  'Afya Cruzeiro do Sul - Cruzeiro do Sul (AC)': 'Faculdade de Ciências Médicas de Cruzeiro do Sul - Cruzeiro do Sul (AC)',
  'Afya Maceió (UNIMA) - Maceió (AL)': 'Centro Universitário de Maceió (UNIMA) - Maceió (AL)',
  'Afya Itacoatiara - Itacoatiara (AM)': 'Faculdade de Ciências Médicas de Itacoatiara - Itacoatiara (AM)',
  'Afya Manacapuru - Manacapuru (AM)': 'Faculdade de Ciências Médicas de Manacapuru - Manacapuru (AM)',
  'Afya Barreiras - Barreiras (BA)': 'Faculdade de Ciências Médicas de Barreiras - Barreiras (BA)',
  'Afya Guanambi - Guanambi (BA)': 'Faculdade de Ciências Médicas de Guanambi - Guanambi (BA)',
  'Afya Itabuna - Itabuna (BA)': 'Faculdade de Ciências Médicas de Itabuna - Itabuna (BA)',
  'Afya Luís Eduardo Magalhães - Luís Eduardo Magalhães (BA)': 'Faculdade de Ciências Médicas de Luís Eduardo Magalhães - Luís Eduardo Magalhães (BA)',
  'Afya Ribeira do Pombal - Ribeira do Pombal (BA)': 'Faculdade de Ciências Médicas de Ribeira do Pombal - Ribeira do Pombal (BA)',
  'Afya Salvador - Salvador (BA)': 'Faculdade de Ciências Médicas de Salvador - Salvador (BA)',
  'Afya Vitória da Conquista - Vitória da Conquista (BA)': 'Faculdade de Ciências Médicas de Vitória da Conquista - Vitória da Conquista (BA)',
  'Afya Contagem - Contagem (MG)': 'Faculdade de Ciências Médicas de Contagem - Contagem (MG)',
  'Afya Ipatinga - Ipatinga (MG)': 'Faculdade de Ciências Médicas de Ipatinga - Ipatinga (MG)',
  'Afya Itajubá - Itajubá (MG)': 'Faculdade de Medicina de Itajubá - Itajubá (MG)',
  'Afya Montes Claros - Montes Claros (MG)': 'Faculdade de Ciências Médicas de Montes Claros - Montes Claros (MG)',
  'Afya São João del-Rei (UNIPTAN) - São João del-Rei (MG)': 'Centro Universitário Presidente Tancredo de Almeida Neves (UNIPTAN) - São João del-Rei (MG)',
  'Afya Sete Lagoas - Sete Lagoas (MG)': 'Faculdade de Ciências Médicas de Sete Lagoas - Sete Lagoas (MG)',
  'Afya Santa Inês - Santa Inês (MA)': 'Faculdade de Ciências Médicas de Santa Inês - Santa Inês (MA)',
  'Afya Abaetetuba - Abaetetuba (PA)': 'Faculdade de Ciências Médicas de Abaetetuba - Abaetetuba (PA)',
  'Afya Bragança - Bragança (PA)': 'Faculdade de Ciências Médicas de Bragança - Bragança (PA)',
  'Afya Cametá - Cametá (PA)': 'Faculdade de Ciências Médicas de Cametá - Cametá (PA)',
  'Afya Marabá - Marabá (PA)': 'Faculdade de Ciências Médicas de Marabá - Marabá (PA)',
  'Afya Redenção - Redenção (PA)': 'Faculdade de Ciências Médicas de Redenção - Redenção (PA)',
  'Afya Cabedelo (Afya Paraíba) - Cabedelo (PB)': 'Faculdade de Ciências Médicas da Paraíba - Cabedelo (PB)',
  'Afya Garanhuns - Garanhuns (PE)': 'Faculdade de Ciências Médicas de Garanhuns (FAMEG) - Garanhuns (PE)',
  'Afya Jaboatão dos Guararapes - Jaboatão dos Guararapes (PE)': 'Faculdade de Ciências Médicas de Jaboatão dos Guararapes - Jaboatão dos Guararapes (PE)',
  'Afya Parnaíba - Parnaíba (PI)': 'Faculdade de Ciências Médicas de Parnaíba - Parnaíba (PI)',
  'Afya Teresina (UNINOVAFAPI) - Teresina (PI)': 'Centro Universitário UNINOVAFAPI - Teresina (PI)',
  'Afya Pato Branco - Pato Branco (PR)': 'Faculdade de Ciências Médicas de Pato Branco - Pato Branco (PR)',
  'Afya Itaperuna (UniRedentor) - Itaperuna (RJ)': 'Centro Universitário Redentor (UniRedentor) - Itaperuna (RJ)',
  'Afya Unigranrio Barra da Tijuca - Rio de Janeiro (RJ)': 'Unigranrio Barra da Tijuca - Rio de Janeiro (RJ)',
  'Afya Unigranrio Duque de Caxias - Duque de Caxias (RJ)': 'Unigranrio Duque de Caxias - Duque de Caxias (RJ)',
  'Afya Unigranrio Nova Iguaçu - Nova Iguaçu (RJ)': 'Unigranrio Nova Iguaçu - Nova Iguaçu (RJ)',
  'Afya Ji-Paraná - Ji-Paraná (RO)': 'Faculdade de Ciências Médicas de Ji-Paraná - Ji-Paraná (RO)',
  'Afya São Lucas - Porto Velho (RO)': 'Centro Universitário São Lucas - Porto Velho (RO)',
  'Afya Araguaína (UNITPAC) - Araguaína (TO)': 'Centro Universitário Tocantinense Presidente Antônio Carlos (UNITPAC) - Araguaína (TO)',
  'Afya Palmas (ITPAC) - Palmas (TO)': 'Instituto Tocantinense Presidente Antônio Carlos (ITPAC) - Palmas (TO)',
  'Afya Porto Nacional (FAPAC) - Porto Nacional (TO)': 'Faculdade Presidente Antônio Carlos (FAPAC) - Porto Nacional (TO)',
}

/** Rótulo atual de uma instituição; valores que não são legados passam intactos. */
export function normalizeInstitutionLabel<T extends string | null | undefined>(label: T): T {
  if (!label) return label
  return (LEGACY_TO_CURRENT[label] ?? label) as T
}

/** Mesmo que `normalizeInstitutionLabel`, para listas (ex.: unidades de um cupom). */
export function normalizeInstitutionLabels(labels?: string[] | null): string[] {
  return Array.from(new Set((labels || []).map((label) => normalizeInstitutionLabel(label))))
}
