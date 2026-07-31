// Especialidades médicas e áreas de atuação reconhecidas pelo CFM.
//
// Fonte: Resolução CFM nº 2.380/2024 (homologa a Portaria CME nº 1/2024), que
// revogou a Resolução CFM nº 2.330/2023 e segue vigente em jul/2026 — 55
// especialidades e 62 áreas de atuação. A Resolução CFM nº 2.422/2025 trata de
// UTI coronariana e não altera esta relação.
//
// `MEDICAL_SPECIALTIES` é o que o médico escolhe. O residente escolhe em
// `RESIDENCY_AREAS`, que soma as áreas de atuação — programas de residência
// existem para as duas coisas (ex.: quem faz R3 de Medicina Fetal está numa
// área de atuação, não numa especialidade).

/** As 55 especialidades médicas reconhecidas pelo CFM. */
export const CFM_SPECIALTIES: string[] = [
  'Acupuntura',
  'Alergia e Imunologia',
  'Anestesiologia',
  'Angiologia',
  'Cardiologia',
  'Cirurgia Cardiovascular',
  'Cirurgia da Mão',
  'Cirurgia de Cabeça e Pescoço',
  'Cirurgia do Aparelho Digestivo',
  'Cirurgia Geral',
  'Cirurgia Oncológica',
  'Cirurgia Pediátrica',
  'Cirurgia Plástica',
  'Cirurgia Torácica',
  'Cirurgia Vascular',
  'Clínica Médica',
  'Coloproctologia',
  'Dermatologia',
  'Endocrinologia e Metabologia',
  'Endoscopia',
  'Gastroenterologia',
  'Genética Médica',
  'Geriatria',
  'Ginecologia e Obstetrícia',
  'Hematologia e Hemoterapia',
  'Homeopatia',
  'Infectologia',
  'Mastologia',
  'Medicina de Emergência',
  'Medicina de Família e Comunidade',
  'Medicina de Tráfego',
  'Medicina do Trabalho',
  'Medicina Esportiva',
  'Medicina Física e Reabilitação',
  'Medicina Intensiva',
  'Medicina Legal e Perícia Médica',
  'Medicina Nuclear',
  'Medicina Preventiva e Social',
  'Nefrologia',
  'Neurocirurgia',
  'Neurologia',
  'Nutrologia',
  'Oftalmologia',
  'Oncologia Clínica',
  'Ortopedia e Traumatologia',
  'Otorrinolaringologia',
  'Patologia',
  'Patologia Clínica/Medicina Laboratorial',
  'Pediatria',
  'Pneumologia',
  'Psiquiatria',
  'Radiologia e Diagnóstico por Imagem',
  'Radioterapia',
  'Reumatologia',
  'Urologia',
]

/** As 62 áreas de atuação reconhecidas pelo CFM (exigem uma especialidade antes). */
export const CFM_PRACTICE_AREAS: string[] = [
  'Administração em Saúde',
  'Alergia e Imunologia Pediátrica',
  'Angiorradiologia e Cirurgia Endovascular',
  'Atendimento ao Queimado',
  'Auditoria Médica',
  'Cardiologia Pediátrica',
  'Cirurgia Bariátrica',
  'Cirurgia Crânio-Maxilo-Facial',
  'Cirurgia do Trauma',
  'Cirurgia Videolaparoscópica',
  'Citopatologia',
  'Densitometria Óssea',
  'Dor',
  'Ecocardiografia',
  'Ecografia Vascular com Doppler',
  'Eletrofisiologia Clínica Invasiva',
  'Emergência Pediátrica',
  'Endocrinologia Pediátrica',
  'Endoscopia Digestiva',
  'Endoscopia Ginecológica',
  'Endoscopia Respiratória',
  'Ergometria',
  'Estimulação Cardíaca Eletrônica Implantável',
  'Foniatria',
  'Gastroenterologia Pediátrica',
  'Hansenologia',
  'Hematologia e Hemoterapia Pediátrica',
  'Hemodinâmica e Cardiologia Intervencionista',
  'Hepatologia',
  'Infectologia Hospitalar',
  'Infectologia Pediátrica',
  'Mamografia',
  'Medicina Aeroespacial',
  'Medicina do Adolescente',
  'Medicina do Sono',
  'Medicina Fetal',
  'Medicina Intensiva Pediátrica',
  'Medicina Paliativa',
  'Medicina Tropical',
  'Nefrologia Pediátrica',
  'Neonatologia',
  'Neurofisiologia Clínica',
  'Neurologia Pediátrica',
  'Neurorradiologia',
  'Nutrição Parenteral e Enteral',
  'Nutrição Parenteral e Enteral Pediátrica',
  'Nutrologia Pediátrica',
  'Oncogenética',
  'Oncologia Pediátrica',
  'Pneumologia Pediátrica',
  'Psicogeriatria',
  'Psicoterapia',
  'Psiquiatria da Infância e Adolescência',
  'Psiquiatria Forense',
  'Radiologia Intervencionista e Angiorradiologia',
  'Reprodução Assistida',
  'Reumatologia Pediátrica',
  'Sexologia',
  'Toxicologia Médica',
  'Transplante de Medula Óssea',
  'Ultrassonografia em Ginecologia e Obstetrícia',
  'Ultrassonografia Geral',
]

/** Opção de escape exibida no fim dos selects de especialidade/área. */
export const OTHER_SPECIALTY_OPTION = 'Outra (não está na lista)'

/**
 * Opções do select de especialidade do médico: as 55 especialidades, depois as
 * 62 áreas de atuação (quem tem certificado de área costuma se apresentar por
 * ela) e, por último, a opção de escape.
 */
export const MEDICAL_SPECIALTIES: string[] = [
  ...CFM_SPECIALTIES,
  ...CFM_PRACTICE_AREAS,
  OTHER_SPECIALTY_OPTION,
]

/**
 * Opções do select de residência. Mesmo conjunto do médico — programas de
 * residência existem tanto para especialidades quanto para áreas de atuação —
 * mais os programas de pré-requisito que não são especialidade em si.
 */
export const RESIDENCY_AREAS: string[] = [
  ...CFM_SPECIALTIES,
  ...CFM_PRACTICE_AREAS,
  OTHER_SPECIALTY_OPTION,
]
