import type { AchadoPatologico } from '../tipos'

/** Lesão e morte celular, e alterações da luz de vísceras. */
export const ACHADOS_LESAO_CELULAR: AchadoPatologico[] = [
  {
    id: 'necrose-coagulativa',
    nome: 'Necrose coagulativa',
    sinonimos: ['necrose isquêmica', 'infarto', 'gangrena'],
    categoria: 'lesao-celular',
    resumo:
      'Morte celular em que o contorno das células e a arquitetura do tecido persistem por dias, mas os núcleos desaparecem e o citoplasma fica rosa-intenso e homogêneo — "células-fantasma".',
    comoReconhecer: [
      'No pequeno aumento: área mais rosa (hipereosinofílica) e mais pálida de azul que o tecido vivo ao lado, com o desenho geral do órgão ainda reconhecível.',
      'No médio aumento: contornos celulares preservados, sem núcleos corados.',
      'No grande aumento: alterações nucleares em sequência — picnose (núcleo pequeno e escuro), cariorrexe (fragmentação) e cariólise (núcleo que "some").',
      'Na borda, com o tempo: neutrófilos (1–3 dias), macrófagos (3–7 dias), tecido de granulação (a partir de ~1 semana).',
    ],
    mecanismo: [
      'A isquemia derruba a produção de ATP: as bombas iônicas falham, a célula incha e a glicólise anaeróbia acidifica o citoplasma.',
      'A acidose desnatura as proteínas estruturais e também as enzimas que digeririam a célula — por isso a "silhueta" se mantém em vez de liquefazer.',
      'A membrana se rompe, o conteúdo vaza (troponina, transaminases, CK) e desencadeia inflamação na borda.',
    ],
    significado: [
      'Padrão típico do infarto de órgãos sólidos (coração, rim, baço) — exceto o cérebro, que liquefaz.',
      'Na parede intestinal ou do apêndice, a necrose transmural define a forma gangrenosa e antecede a perfuração.',
    ],
    ondeOcorre: ['Infarto do miocárdio', 'Infarto renal e esplênico', 'Apendicite gangrenosa', 'Isquemia intestinal', 'Centro de tumores de crescimento rápido'],
    armadilhas: [
      'Autólise (demora na fixação) também apaga núcleos, mas de forma difusa e sem inflamação na borda.',
      'Tecido cauterizado fica rosa e sem núcleos nítidos, porém só na margem cirúrgica e com núcleos "estirados".',
    ],
  },
  {
    id: 'fecalito',
    nome: 'Fecalito (apendicolito)',
    sinonimos: ['apendicolito', 'coprólito'],
    categoria: 'agente',
    resumo:
      'Concreção de fezes endurecidas, às vezes calcificada, dentro da luz do apêndice: material amorfo em camadas, com restos vegetais e bactérias.',
    comoReconhecer: [
      'No pequeno aumento: massa dentro da luz, de bordas nítidas, com lamelas concêntricas.',
      'No médio aumento: restos vegetais (paredes celulares retangulares refráteis), bactérias em massa basofílica, muco; cálcio aparece em roxo-escuro.',
    ],
    mecanismo: [
      'Fezes retidas na luz estreita do apêndice perdem água e se compactam; sais de cálcio podem se depositar.',
      'O fecalito oclui a luz: a secreção de muco continua, a pressão sobe e começa a cadeia obstrução → isquemia → invasão bacteriana.',
    ],
    significado: [
      'Causa mais comum da obstrução que inicia a apendicite no adulto; associado a maior risco de perfuração.',
      'Frequentemente não aparece no corte: a peça é seccionada em fragmentos e o fecalito pode ter se deslocado.',
    ],
    ondeOcorre: ['Apendicite aguda', 'Divertículos colônicos'],
    armadilhas: [
      'Fezes soltas na luz não são fecalito: falta a organização compacta e lamelar.',
    ],
  },
  {
    id: 'perfuracao-da-parede',
    nome: 'Perfuração da parede',
    sinonimos: ['perfuração', 'ruptura'],
    categoria: 'lesao-celular',
    resumo:
      'Descontinuidade de toda a espessura da parede de uma víscera, com necrose e exsudato comunicando a luz com a serosa ou com o tecido ao redor.',
    comoReconhecer: [
      'No pequeno aumento: a muscular própria se interrompe; no lugar, necrose e pus em continuidade da mucosa ao tecido periorgânico.',
      'No médio aumento: bordas da parede necróticas, cercadas de neutrófilos; abscesso ou peritonite fibrinopurulenta do lado de fora.',
    ],
    mecanismo: [
      'A necrose transmural (isquêmica e inflamatória) destrói a camada muscular, que é o que dá resistência à parede.',
      'A pressão intraluminal rompe o tecido enfraquecido e o conteúdo contaminado sai para a cavidade.',
    ],
    significado: [
      'Complicação grave: peritonite, abscesso e sepse. No apêndice, mais comum em crianças pequenas e idosos, que chegam tarde ao diagnóstico.',
    ],
    ondeOcorre: ['Apendicite perfurada', 'Diverticulite', 'Úlcera péptica perfurada', 'Colite fulminante'],
    armadilhas: ['Rasgo pela manipulação cirúrgica tem bordas limpas, sem necrose nem inflamação.'],
  },
]
